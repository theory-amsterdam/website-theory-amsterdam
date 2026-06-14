const fs = require("node:fs");
const path = require("node:path");

const postsDir = path.join(__dirname, "..", "posts");

/**
 * Eleventy global data: builds a `{ slug -> featured image URL }` map by
 * scanning `src/posts/<slug>/` folders for a `featured.{jpg,jpeg,png,gif,webp}`
 * file.
 *
 * Posts can use any supported image extension, so templates must look the URL
 * up via this map (e.g. `featured[slug]`) rather than hardcoding `.jpg`. Posts
 * without a featured image are simply omitted from the map.
 */
module.exports = function () {
  const map = {};
  for (const slug of fs.readdirSync(postsDir)) {
    const dir = path.join(postsDir, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
    const file = fs
      .readdirSync(dir)
      .find((f) => /^featured\.(jpe?g|png|gif|webp)$/i.test(f));
    if (file) map[slug] = `/post/${slug}/${file}`;
  }
  return map;
};
