// Machine-readable outputs: never part of collections (so never in sitemap.xml or listings),
// never wrapped in the HTML layout.
module.exports = {
  eleventyExcludeFromCollections: true,
  layout: false,
};
