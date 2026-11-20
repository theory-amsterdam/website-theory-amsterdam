// /llms.txt — entry point for LLMs and agents, following https://llmstxt.org/.
const site = require("../_data/site.js");
const groups = require("../_data/groups.js");
const { personLine, membersOf } = require("../_includes/markdown.js");

module.exports = class {
  data() {
    return { permalink: "/llms.txt" };
  }

  render({ collections }) {
    const md = (url) => `${site.url}${url}index.html.md`;
    const out = [
      `# ${site.name}`,
      "",
      `> ${site.description}`,
      "",
      "The site lists the TCS researchers in Amsterdam (permanent members, postdocs and PhD students) with their roles, affiliations and research interests, plus the regular TCS seminars, teaching programmes, notable alumni, and the history of TCS in Amsterdam.",
      "",
      "Every HTML page has a Markdown version at the same URL with `index.html.md` appended (e.g. https://theory.amsterdam/authors/wolf/index.html.md). The whole site as one Markdown file: " +
        `${site.url}/llms-full.txt. Researcher profile pages also carry schema.org Person data as JSON-LD.`,
      "",
      "## Main pages",
      "",
      `- [Home](${md("/")}): all researchers grouped by role, seminars, teaching programmes and alumni`,
      `- [Institutes](${md("/institutes/")}): the same researchers grouped by institute and research group (CWI, UvA, VU, QuSoft)`,
      `- [History](${md("/history/")}): influential researchers in the history of TCS in Amsterdam`,
      `- [Contact](${md("/contact/")}): code of conduct, maintainers, mailing list`,
    ];
    for (const group of groups.roles) {
      const members = membersOf(collections.authors, group);
      if (!members.length) continue;
      out.push("", `## ${group}`, "", ...members.map((a) => personLine(a, { link: "md" })));
    }
    out.push("", "## Optional", "");
    out.push(`- [Jobs](${md("/post/")}): job announcements and news posts`);
    for (const p of [...(collections.posts || [])].reverse())
      out.push(`- [${p.data.title}](${md(p.url)}): posted ${p.date.toISOString().slice(0, 10)}`);
    return out.join("\n") + "\n";
  }
};
