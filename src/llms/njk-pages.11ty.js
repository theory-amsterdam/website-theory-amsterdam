// Markdown mirrors of the three Nunjucks pages (the home page, /institutes/, /post/).
// A new .njk page needs an entry here and a link in llms-txt.11ty.js; layout.njk's
// `hasMirror` list must match.
const { homeMarkdown, institutesMarkdown, jobsMarkdown } = require("../_includes/markdown.js");

const PAGES = [
  { url: "/", render: (c) => homeMarkdown(c.authors) },
  { url: "/institutes/", render: (c) => institutesMarkdown(c.authors) },
  { url: "/post/", render: (c) => jobsMarkdown(c.posts || []) },
];

module.exports = class {
  data() {
    return {
      pages: PAGES,
      pagination: { data: "pages", size: 1, alias: "mirror" },
      permalink: (data) => `${data.mirror.url}index.html.md`,
    };
  }

  render({ mirror, collections }) {
    return mirror.render(collections) + "\n";
  }
};
