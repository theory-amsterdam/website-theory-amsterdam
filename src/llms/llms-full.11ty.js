// /llms-full.txt — the whole site as a single Markdown document.
const site = require("../_data/site.js");
const groups = require("../_data/groups.js");
const {
  homeMarkdown,
  institutesMarkdown,
  personProfile,
  postMarkdown,
  pageMarkdown,
  membersOf,
} = require("../_includes/markdown.js");

module.exports = class {
  data() {
    return { permalink: "/llms-full.txt" };
  }

  render({ collections }) {
    const authors = collections.authors;
    const byUrl = (url) => collections.mdPages.find((p) => p.url === url);
    const out = [
      `# ${site.name} — full content`,
      "",
      `> ${site.description}`,
      "",
      `Source: ${site.url}/ (generated at build time from the site's content; index: ${site.url}/llms.txt).`,
      "",
      homeMarkdown(authors, { headingLevel: 2 }),
      "",
      institutesMarkdown(authors, { headingLevel: 2 }),
      "",
      "## Researcher profiles",
    ];
    for (const group of groups.roles) {
      const members = membersOf(authors, group);
      if (!members.length) continue;
      out.push("", `### ${group}`);
      for (const a of members) out.push("", personProfile(a, { headingLevel: 4 }));
    }
    for (const url of ["/history/", "/contact/"]) {
      const page = byUrl(url);
      if (page) out.push("", pageMarkdown(page, { headingLevel: 2 }));
    }
    out.push("", "## Jobs and news", "");
    out.push("Job announcements and news posts, newest first.");
    for (const p of [...(collections.posts || [])].reverse())
      out.push("", postMarkdown(p, authors, { headingLevel: 3 }));
    return out.join("\n") + "\n";
  }
};
