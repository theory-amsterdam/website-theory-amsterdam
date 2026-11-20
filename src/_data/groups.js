/**
 * Eleventy global data: the `user_groups` vocabulary, in render order.
 *
 * `roles` drives the sections on the home page (src/home/index.njk),
 * `institutes` the sections on /institutes/ (src/institutes/index.njk); the
 * Markdown mirrors and llms-full.txt (src/llms/) use the same lists.
 * Matching against a person's `user_groups` is exact string equality.
 * scripts/check-people.sh keeps its own copy of both lists — update it too.
 */
module.exports = {
  roles: [
    "Permanent Members",
    "Postdocs",
    "PhD Students",
    "Research Assistants",
    "Visitors",
    "Alumni",
  ],
  institutes: [
    "CWI Algorithms and Complexity",
    "CWI Networks and Optimization",
    "CWI Computer Security",
    "UvA ILLC",
    "UvA Informatics Institute",
    "UvA Korteweg-de Vries Institute for Mathematics",
    "UvA Institute of Physics",
    "UvA Van 't Hoff Institute for Molecular Sciences",
    "VU Theoretical Computer Science",
    "QuSoft",
  ],
};
