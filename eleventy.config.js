const { RenderPlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(RenderPlugin);

  eleventyConfig.ignores.add("**/_site/**");

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/authors/**/avatar.*");

  eleventyConfig.addCollection("authors", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/authors/**/index.md")
      .sort((a, b) => (a.data.lastname || "").localeCompare(b.data.lastname || ""))
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
