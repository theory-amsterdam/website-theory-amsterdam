// /robots.txt — everything may be crawled, including by AI/LLM crawlers.
const site = require("../_data/site.js");

module.exports = class {
  data() {
    return { permalink: "/robots.txt" };
  }

  render() {
    return `# All crawlers, including AI/LLM crawlers, are welcome.
# For LLMs and agents: ${site.url}/llms.txt (index) and ${site.url}/llms-full.txt (whole site as Markdown).
User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;
  }
};
