# CLAUDE.md

Website of the Theory of Computing group in Amsterdam (CWI / UvA / VU). Eleventy 3, deployed on
Netlify. `README.md` covers setup and the contributor workflow; this file covers what you'd
otherwise get wrong.

- Routine two-monthly people refresh: **`docs/people-refresh.md`**.
- Before committing anything under `src/authors/`: **`bash scripts/check-people.sh`**.

## Commands

```
npm run dev      # eleventy --serve on :8080, live reload
npm run build    # writes _site/
npm run clean    # rm -rf _site  (run this before trusting a build; stale output lingers)
```

There is **no CI, no linter, no test suite**. `npm run build` is the only gate you have locally.
Netlify additionally runs `netlify-plugin-checklinks` on deploy.

## One person = one folder

`src/authors/<slug>/index.md` plus `avatar.<ext>`. There is no central people file.

Slug = lowercase, ASCII-folded surname, nobiliary particles dropped: `wolf` (de Wolf), `berg`
(van den Berg), `kohne` (Köhne), `sa` (Sá), `reiffenhaeuser` (Reiffenhäuser). One exception:
`tencate` keeps the particle in the slug while `lastname: Cate` drops it.

`src/authors/authors.json` applies `layout`, `tags` and `permalink` to every author page — never
set those in a person's file.

## Frontmatter

| Field | What it does |
|---|---|
| `title` | Display name. Also the sort tiebreak (its first token). |
| `lastname` | **Primary sort key** (`eleventy.config.js:44-55`). Particles dropped: `Wolf`, `Berg`, `Cate`. Diacritics kept: `Köhne`. |
| `role` | Free text under the name on cards. |
| `organizations` | List of `{name, url}`. Sidebar of the person's own page **only**. |
| `user_groups` | **Decides which sections the person appears in.** See below. |
| `social` | Icon links. See below. |
| `interests` | Short lowercase phrases, joined with commas on the card. |

`superuser`, `highlight_name`, `email` and `avatar_filename` are HugoBlox leftovers that **no
template reads**. Don't add them to new files; no need to strip them from old ones.

## `user_groups` — the load-bearing field

Every person needs **exactly one role group** and **one or more institute groups**. Matching is
exact string equality, and **a typo silently removes the person from a page with no build error.**

Role groups — `groupOrder` in `src/home/index.njk:6`, in render order:

```
Permanent Members · Postdocs · PhD Students · Research Assistants · Visitors · Alumni
```

Institute groups — `instituteGroups` in `src/institutes/index.njk:6-19`, in render order:

```
CWI Algorithms and Complexity · CWI Networks and Optimization · CWI Computer Security
CWI Life Sciences and Health · UvA ILLC · UvA Informatics Institute
UvA Korteweg-de Vries Institute for Mathematics · UvA Institute of Physics
VU Theoretical Computer Science · VU School of Business and Economics · VU Bioinformatics
QuSoft
```

`Research Assistants`, `Visitors`, `Alumni`, `CWI Life Sciences and Health` and
`VU School of Business and Economics` currently have no members, so those sections render as
nothing. `Alumni` is empty by design — alumni are table rows, not pages.

Three people sit outside this vocabulary and are therefore invisible on `/institutes/`: `boer`,
`laurent`, `polla`. They are listed in `scripts/known-exceptions.txt` pending a maintainer
decision — **don't "fix" them by inventing a new group string.** Adding a genuinely new institute
means editing `instituteGroups` **and** the `<ul>` of research-group links above it in the same file.

## The `organizations` / `user_groups` trap

The institute is stored twice, in two independently editable places, and they drift.
`organizations` is free-form display text; `user_groups` is exact-match machinery. PR #50 had to
fix eight people who had `QuSoft` under `organizations` but not under `user_groups` and were
missing from the QuSoft section as a result.

**When you edit one, edit the other.** `scripts/check-people.sh` catches this (check C3).

## Social icons

`src/_includes/social-icons.njk` maps `icon_pack` to a CSS prefix. The wrong pack renders an
invisible icon with no error.

| Pack | Icons used here |
|---|---|
| `fas` | `link` (personal homepage), `envelope` (always a `mailto:`) |
| `ai` | `google-scholar`, `dblp`, `orcid` |
| `fab` | `linkedin`, `twitter` |

## Avatars

The file stem must literally be `avatar`; `src/_data/avatars.js` finds
`avatar.{jpg,jpeg,png,gif,webp}` case-insensitively. Missing avatar falls back to
`/assets/media/generic-avatar.jpg`, which renders fine — an absent photo is much better than a
wrong one.

**Gotcha:** the passthrough glob in `eleventy.config.js` lists only
`{jpg,jpeg,png,gif,webp,JPG,JPEG,PNG}`. An `avatar.WEBP` would be found by the data file and never
copied — a broken image that fails Netlify's checklinks. Check C5 catches this.

**There is no build-time resize.** CSS crops portraits to 150px (cards) and 180px (profiles), but
the original bytes ship to every visitor. Target ≤1024px on the long edge and ≤200 KB. To fix one:

```
sips -Z 1024 src/authors/<slug>/avatar.jpg          # modifies in place, run before git add
sips -s format jpeg -s formatOptions 82 in.png --out avatar.jpg   # photos should not be PNG
```

## Moving someone to alumni

The operation most likely to break the build. Precedents: `bb6172f`, `0229b04`.

1. `git rm -r src/authors/<slug>/` — the **whole folder**, `index.md` and avatar.
2. Add **one** row to the correct table in `src/home/sections/alumni.md`.
3. `grep -rn "/authors/<slug>/" src/` — a dangling internal link **fails the Netlify deploy**.
4. `grep -rn "authors:.*<slug>" src/posts/` — a byline whose slug no longer resolves renders as
   nothing, silently, with no error.

Steps 3 and 4 are checks C6 and C6b.

## `src/home/sections/alumni.md`

Three hand-aligned Markdown tables whose columns **mean different things**:

| Table | Columns |
|---|---|
| `Permanent Members` | Name, Institution, Years, Current Affiliation |
| `Postdocs` | Name, **Advisor**, Years, Current Affiliation |
| `PhD Students` | Name, **PhD Advisor(s)**, **Year of PhD**, **Next Affiliation** |

Roughly reverse-chronological within each table. The name cell links to `/authors/<slug>/` when
the person still has a page (someone can be both alumnus and current member — Freek Witteveen,
Jonas Helsen, Koen Groenland), otherwise to an external homepage.

Subhasree Patro and Yfke Dulek appear in two tables on purpose: they were both PhD student and
postdoc here. **Don't deduplicate them.**

**Don't re-align the pipes** when adding a row — `0229b04` is a 60-line diff for a one-line change.

## Netlify

`netlify.toml` runs `netlify-plugin-checklinks` with `checkExternal = false`. Dangling **internal**
links fail the build; **external** rot never does. That's what `bash scripts/check-links.sh` is for.
Don't flip `checkExternal` on — `todoPatterns` already exempts the domains that matter, so it would
catch little while making deploys fail on someone else's outage.

## Line endings

`.editorconfig` says LF, but `src/authors/fokkink/index.md` and `src/authors/pissis/index.md` have
been CRLF since the Hugo port. A naive `grep '^role: PhD Student$'` misses them — the `\r` is part
of the last field. Every script here pipes through `tr -d '\r'`. Don't bulk-convert those two files
inside a people PR; it's an unrelated whole-file diff.

## Private data

`private_data/` is gitignored and holds the maintainers' local sources. **Nothing committed to this
repo names those files, describes their structure, or reproduces their contents** — state
conclusions ("graduated, moved to alumni"), never source records. See `docs/people-refresh.md`.

## Commits

One commit per person, in the existing style: `Add <Name>`, `Move <Name> to alumni`,
`Update <Name>`. Larger sweeps get a summary commit.
