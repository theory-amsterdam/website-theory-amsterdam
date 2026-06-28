module.exports = {
  layout: "post.njk",
  tags: "posts",
  eleventyComputed: {
    permalink: (data) =>
      data.draft ? false : `/post/${data.page.fileSlug}/`,
    eleventyExcludeFromCollections: (data) => data.draft === true,
  },
};
