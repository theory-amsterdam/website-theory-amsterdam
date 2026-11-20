/**
 * Helpers for the machine-readable outputs in src/llms/ (Markdown mirrors, llms.txt,
 * llms-full.txt). Plain functions, so the .11ty.js templates and eleventy.config.js share them.
 *
 * All URLs in the generated Markdown are absolute: llms-full.txt concatenates pages, and agents
 * often fetch a mirror out of context.
 */
const fs = require("node:fs");
const matter = require("gray-matter");
const site = require("../_data/site.js");
const groups = require("../_data/groups.js");

/** Body of a source file without its frontmatter. */
function rawBody(inputPath) {
  return matter(fs.readFileSync(inputPath, "utf8")).content.replace(/\r/g, "").trim();
}

const abs = (url, base = "/") => new URL(url, site.url + base).href;

/**
 * Clean a Markdown body for machine consumption: inline <img> → ![alt](absolute url),
 * <h1>…</h1> → "# …", relative link/image targets → absolute (resolved against pageUrl),
 * and runs of blank lines collapsed.
 */
function clean(md, pageUrl) {
  return md
    .replace(/<img\b([^>]*)>(\s*<\/img>)?/gi, (_, attrs) => {
      const src = (attrs.match(/\bsrc="([^"]*)"/i) || [])[1];
      const alt = (attrs.match(/\balt="([^"]*)"/i) || [])[1] || "";
      return src ? `![${alt}](${abs(src, pageUrl)})` : "";
    })
    .replace(/^[ \t]*<br\b[^>]*>[ \t]*$/gim, "")
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${t.replace(/&amp;/g, "&").trim()}`)
    .replace(/(!?\[[^\]]*\])\(([^)\s]+)\)/g, (m, label, url) =>
      /^(#|mailto:|[a-z][a-z0-9+.-]*:)/i.test(url) ? m : `${label}(${abs(url, pageUrl)})`
    )
    .replace(/\bhref="(\/[^"]*)"/g, (_, url) => `href="${abs(url)}"`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Shift every ATX heading down by n levels (max h6), skipping fenced code blocks. */
function demote(md, n) {
  let fenced = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced) return line;
      return line.replace(/^(#{1,6})(?= )/, (h) => "#".repeat(Math.min(6, h.length + n)));
    })
    .join("\n");
}

const hasH1 = (md) => /^# /m.test(md);

const SOCIAL_LABELS = {
  link: "Homepage",
  envelope: "Email",
  "google-scholar": "Google Scholar",
  dblp: "DBLP",
  orcid: "ORCID",
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  github: "GitHub",
};

function socialLinks(social, { email = true } = {}) {
  return (social || [])
    .filter((s) => s.link && (email || !s.link.startsWith("mailto:")))
    .map((s) => `[${SOCIAL_LABELS[s.icon] || s.icon}](${s.link})`);
}

const roleGroup = (d) => (d.user_groups || []).find((g) => groups.roles.includes(g));
const instituteGroups = (d) => (d.user_groups || []).filter((g) => groups.institutes.includes(g));

/** Members of a user_groups value, in collection (alphabetical) order. */
const membersOf = (authors, group) =>
  authors.filter((a) => (a.data.user_groups || []).includes(group));

/** One-line summary of a person, for lists. */
function personLine(author, { link = "html" } = {}) {
  const d = author.data;
  const url = link === "md" ? `${site.url}${author.url}index.html.md` : site.url + author.url;
  const parts = [`[${d.title}](${url})`];
  if (d.role) parts.push(d.role);
  const inst = instituteGroups(d);
  if (inst.length) parts.push(inst.join(", "));
  let line = `- ${parts.join(" — ")}`;
  if (d.interests && d.interests.length) line += `. Interests: ${d.interests.join(", ")}`;
  return line;
}

/** Full profile of a person: details list, then bio. */
function personProfile(author, { headingLevel = 1, email = true } = {}) {
  const d = author.data;
  const h = "#".repeat(headingLevel);
  const lines = [`${h} ${d.title}`, ""];
  if (d.role) lines.push(`- Role: ${d.role}`);
  const group = roleGroup(d);
  if (group) lines.push(`- Group: ${group}`);
  if (d.organizations && d.organizations.length)
    lines.push(
      `- Affiliations: ${d.organizations.map((o) => (o.url ? `[${o.name}](${o.url})` : o.name)).join(", ")}`
    );
  if (d.interests && d.interests.length) lines.push(`- Research interests: ${d.interests.join(", ")}`);
  const links = socialLinks(d.social, { email });
  if (links.length) lines.push(`- Links: ${links.join(", ")}`);
  lines.push(`- Profile page: ${site.url}${author.url}`);
  const bio = clean(rawBody(author.inputPath), author.url);
  if (bio) lines.push("", demote(bio, headingLevel));
  return lines.join("\n");
}

/** A post (job announcement / news item) with its byline. */
function postMarkdown(post, authors, { headingLevel = 1 } = {}) {
  const d = post.data;
  const h = "#".repeat(headingLevel);
  const byline = (d.authors || [])
    .map((slug) => authors.find((a) => a.page.fileSlug === slug))
    .filter(Boolean)
    .map((a) => `[${a.data.title}](${site.url}${a.url})`);
  const lines = [`${h} ${d.title}`, ""];
  lines.push(`- Published: ${post.date.toISOString().slice(0, 10)}`);
  if (byline.length) lines.push(`- Authors: ${byline.join(", ")}`);
  lines.push(`- Web page: ${site.url}${post.url}`);
  const body = clean(rawBody(post.inputPath).replace("<!--more-->", ""), post.url);
  lines.push("", demote(body, headingLevel));
  return lines.join("\n");
}

/** Any other Markdown page (history, contact): title + body. */
function pageMarkdown(item, { headingLevel = 1 } = {}) {
  let body = clean(rawBody(item.inputPath), item.url);
  if (!hasH1(body)) body = `# ${item.data.title}\n\n${body}`;
  return demote(body, headingLevel - 1);
}

/** Markdown for the home page (people by role, seminars, teaching, alumni). */
function homeMarkdown(authors, { headingLevel = 1 } = {}) {
  const h = (n) => "#".repeat(headingLevel + n - 1);
  const section = (file, level) =>
    demote(clean(rawBody(`./src/home/sections/${file}`), "/"), level);
  const out = [
    `${h(1)} TCS in Amsterdam`,
    "",
    `> ${site.description}`,
    "",
    `${h(2)} TCS Researchers in Amsterdam`,
    "",
    `Grouped by role, alphabetical within each group. Each name links to a profile page; every profile also has a Markdown version at \`<profile URL>index.html.md\`. The same people grouped by institute: ${site.url}/institutes/index.html.md`,
  ];
  for (const group of groups.roles) {
    const members = membersOf(authors, group);
    if (!members.length) continue;
    out.push("", `${h(3)} ${group}`, "", ...members.map((a) => personLine(a)));
  }
  // Partials start at ### (teaching) or ## (alumni); normalise both to sit under an h2.
  out.push("", `${h(2)} Seminars`, "", section("seminars.md", headingLevel + 1));
  out.push("", `${h(2)} Teaching`, "", section("teaching.md", headingLevel - 1));
  out.push("", `${h(2)} Some Alumni`, "", section("alumni.md", headingLevel));
  return out.join("\n");
}

/** Markdown for /institutes/. */
function institutesMarkdown(authors, { headingLevel = 1 } = {}) {
  const h = (n) => "#".repeat(headingLevel + n - 1);
  const out = [
    `${h(1)} Institutes`,
    "",
    "All TCS researchers listed on this site are employed by one (or more) of the following institutions:",
    "",
    "- CWI: [Centrum Wiskunde & Informatica](https://www.cwi.nl)",
    "- UvA: [University of Amsterdam](https://www.uva.nl)",
    "- VU: [Vrije Universiteit](https://vu.nl)",
    "",
    "Researchers are grouped below by research group or institute (one person can appear under several).",
  ];
  for (const group of groups.institutes) {
    const members = membersOf(authors, group);
    if (!members.length) continue;
    out.push("", `${h(2)} ${group}`, "", ...members.map((a) => personLine(a)));
  }
  return out.join("\n");
}

/** Markdown for /post/ (list of posts). */
function jobsMarkdown(posts, { headingLevel = 1 } = {}) {
  const h = (n) => "#".repeat(headingLevel + n - 1);
  const newest = posts.length ? Math.max(...posts.map((p) => p.date.getTime())) : 0;
  const stale = Date.now() - newest > 365 * 24 * 3600 * 1000;
  const out = [
    `${h(1)} Jobs`,
    "",
    "Job announcements and news from the TCS community in Amsterdam, newest first." +
      (stale
        ? " All of these posts are more than a year old, so the vacancies are most likely closed; check the institutes' own career pages for current openings."
        : ""),
    "",
  ];
  for (const p of [...posts].reverse())
    out.push(`- ${p.date.toISOString().slice(0, 10)}: [${p.data.title}](${site.url}${p.url}index.html.md)`);
  return out.join("\n");
}

module.exports = {
  rawBody,
  clean,
  demote,
  personLine,
  personProfile,
  postMarkdown,
  pageMarkdown,
  homeMarkdown,
  institutesMarkdown,
  jobsMarkdown,
  membersOf,
};
