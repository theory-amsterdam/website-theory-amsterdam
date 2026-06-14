const fs = require("node:fs");
const path = require("node:path");

const postsDir = path.join(__dirname, "..", "posts");

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
