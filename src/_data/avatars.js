const fs = require("node:fs");
const path = require("node:path");

const authorsDir = path.join(__dirname, "..", "authors");

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
