const fs = require("node:fs");
const path = require("node:path");

const authorsDir = path.join(__dirname, "..", "authors");

/**
 * Eleventy global data: builds a `{ slug -> avatar URL }` map by scanning
 * `src/authors/<slug>/` folders for an `avatar.{jpg,jpeg,png,gif,webp}` file.
 *
 * Authors can use any supported image extension, so templates must look the
 * URL up via this map (e.g. `avatars[slug]`) rather than hardcoding `.jpg`.
 * Folders without a matching avatar file are simply omitted from the map.
 */
module.exports = function () {
  const map = {};
  for (const slug of fs.readdirSync(authorsDir)) {
    const dir = path.join(authorsDir, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
    const file = fs
      .readdirSync(dir)
      .find((f) => /^avatar\.(jpe?g|png|gif|webp)$/i.test(f));
    if (file) map[slug] = `/authors/${slug}/${file}`;
  }
  return map;
};
