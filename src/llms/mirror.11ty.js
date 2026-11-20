// A Markdown mirror at <url>index.html.md (llmstxt.org convention) for every page whose source is
// Markdown: researcher profiles, posts, history, contact. New .md pages get one automatically.
const { personProfile, postMarkdown, pageMarkdown } = require("../_includes/markdown.js");

module.exports = class {
  data() {
    return {
      pagination: { data: "collections.mdPages", size: 1, alias: "item" },
      permalink: (data) => `${data.item.url}index.html.md`,
    };
  }

  render({ item, collections }) {
    const tags = item.data.tags || [];
    if (tags.includes("authors")) return personProfile(item) + "\n";
    if (tags.includes("posts")) return postMarkdown(item, collections.authors) + "\n";
    return pageMarkdown(item) + "\n";
  }
};
