// /sitemap.xml — every HTML page in collections.all.
const site = require("../_data/site.js");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

module.exports = class {
  data() {
    return { permalink: "/sitemap.xml" };
  }

  render({ collections }) {
    const urls = collections.all
      .filter((p) => p.url && p.outputPath && p.outputPath.endsWith(".html"))
      .sort((a, b) => a.url.localeCompare(b.url))
      // lastmod only where the date is real (posts); elsewhere it would be the checkout time.
      .map((p) => {
        const lastmod = (p.data.tags || []).includes("posts")
          ? `<lastmod>${p.date.toISOString().slice(0, 10)}</lastmod>`
          : "";
        return `  <url><loc>${esc(site.url + p.url)}</loc>${lastmod}</url>`;
      });
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  }
};
