const { RenderPlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(RenderPlugin);

  eleventyConfig.ignores.add("**/_site/**");

  eleventyConfig.addFilter("dateISO", (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("dateLong", (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/**/*.{jpg,jpeg,png,gif,webp,JPG,JPEG,PNG}");

  const firstName = (entry) => (entry.data.title || "").trim().split(/\s+/)[0] || "";

  eleventyConfig.addCollection("authors", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/authors/**/index.md")
      .sort((a, b) => {
        const byFirst = firstName(a).localeCompare(firstName(b));
        if (byFirst !== 0) return byFirst;
        return (a.data.lastname || "").localeCompare(b.data.lastname || "");
      })
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
