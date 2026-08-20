# The two-monthly people refresh

The member listings on this site drift. People arrive, graduate, change institute or move from
PhD student to postdoc, and nobody edits the site until someone notices it is wrong — in
August 2026 a single catch-up PR added 16 people, moved 6 to alumni and corrected a dozen
affiliations. This runbook exists so that stops being an annual event.

**Cadence:** every two months. A scheduled agent opens a GitHub issue as a reminder with whatever
it could check on its own; the actual work is a local session, because the primary source and the
avatar tooling are only available locally.

**Scope:** people only, plus a link-rot sweep. Publications, seminars, teaching and job posts are
out of scope here.

`CLAUDE.md` in the repo root has the data model, the exact `user_groups` vocabulary and the
gotchas. Read it first; this file assumes it.

---

## Phase 0 — Branch

```bash
git fetch origin
git switch -c people-refresh-$(date +%Y-%m) origin/main
npm install
```

Always branch from `origin/main`, never from whatever happens to be checked out.

## Phase 1 — Fix what's already broken (offline, no network)

```bash
bash scripts/check-people.sh
```

Fix every `FAIL` before you look at any upstream source. This phase is free, deterministic and
historically finds more real breakage than the upstream diff does. `INFO` lines are advisory —
read them, act on the ones that matter, and don't feel obliged to clear them all.

If a finding is real but can't be resolved without a maintainer decision, add it to
`scripts/known-exceptions.txt` with a comment rather than leaving the check red — a permanently
failing check stops being read.

Commit as `Fix people-data drift`.

## Phase 2 — Dump the current roster

This is the left-hand side of every comparison that follows.

```bash
for f in src/authors/*/index.md; do
  s=$(basename "$(dirname "$f")")
  t=$(tr -d '\r' < "$f")
  printf '%s\t%s\t%s\t%s\n' "$s" \
    "$(printf '%s\n' "$t" | sed -n 's/^title: *//p')" \
    "$(printf '%s\n' "$t" | sed -n 's/^role: *//p')" \
    "$(printf '%s\n' "$t" | awk '/^user_groups:/{g=1;next} g&&/^[ ]*- /{sub(/^[ ]*- /,"");printf "%s;",$0;next} g{g=0}')"
done | sort
```

## Phase 3 — Consult the sources

### Primary: the private roster

The maintainers keep a local personnel roster covering the QuSoft-affiliated half of the site.
It is **the only reliable signal that someone has left or graduated.**

`private_data/people-refresh-private.md` explains what it is, how to read it and how its fields
map onto frontmatter. That file is gitignored and is not part of this repository.

**If `private_data/` is not present on your machine — as it will not be for most contributors, and
never for an automated run — skip the departure pass entirely.** Do not substitute a guess. Say in
the PR that the departure pass was not run.

Nothing you write into the repo, a commit message or a PR body may quote, paraphrase or describe
that roster. State conclusions ("graduated in 2026, moving to alumni"), never source records.

### Secondary: the institute pages

The 12 research-group pages linked from the "Research Groups" list in `src/institutes/index.njk`.
Fetch each and extract the names.

Use these **additively only**:

- to *discover* people who may be missing from the site;
- to *confirm* a job title you already suspect changed.

**Absence from one of these pages is zero evidence that somebody has left.** They list whole
groups including administrative and support staff, several are rendered client-side, and their
URLs move without notice — the UvA IvI Theory of Computer Science page moved from
`ivi.fnwi.uva.nl/tcs` to `ivi-tcs.science.uva.nl` in 2026, and the CWI Life Sciences and Health
group page 404'd for long enough that the group was dropped from this site entirely. If you infer
departures from these pages, you will eventually propose deleting a sitting professor.

The list is Amsterdam institutions only. Someone with an outside affiliation keeps it under
`organizations` and is grouped by their Amsterdam institute.

For the VU TCS, KdVI and non-QuSoft ILLC members there is **no upstream source at all** — only
these pages, and a person who knows. Name that person in the PR and ask them.

### Portraits

`https://qusoft.org/people/<first>-<last>/` for QuSoft members. See Phase 6.

## Phase 4 — Classify before editing

Write out every delta with a confidence tag before touching a file:

- `certain` — the private roster states it, or an institute page states a title explicitly.
- `needs-human` — everything else.

`needs-human` items go in the PR body. They do not go in the diff.

## Phase 5 — Apply, one commit per person

`src/authors/kohne/index.md` is the cleanest minimal template. Copy its shape; don't copy
`superuser` / `highlight_name` / `email` into new files.

| Signal | Confidence | What to edit |
|---|---|---|
| **New person**, TCS-relevant | needs-human — confirm they're in scope | New folder + `index.md`: one role group and every institute group in `user_groups`; `organizations` to match; `social` with at least a homepage or mailto; 2–3 lowercase `interests`; a 1–3 sentence first-person bio. Avatar per Phase 6. `Add <Name>` |
| **Job title changed** (PhD → postdoc, assistant → associate) | certain from the roster, else needs-human | Edit `role:`. **If the role group changes too, edit `user_groups` in the same commit** — two separate fields, and forgetting the second is the classic error. `Update <Name>` |
| **Moved institute** | certain | Edit the institute entry in `user_groups` **and** the matching `organizations` name *and* url. See `folkertsma` in `c70719c`. |
| **Gained a second affiliation** | certain | *Append* to both lists. This is the bug class PR #50 had to clean up. |
| **Left or graduated** | certain **from the private roster only** | `git rm -r src/authors/<slug>/`; one row in the right alumni table; then check C6/C6b for inbound links and bylines. `Move <Name> to alumni` |
| **Missing from an institute page, nothing in the roster** | **needs-human — do not edit** | PR body only: "not found on `<url>` — departed?" |
| **Alumni row with an empty Next Affiliation** | needs-human | Fill that cell only. Precedent `d124a78`. Never invent an employer; blank is an honest answer. |
| **Alumni link dead** (Phase 7) | certain if you find a replacement | Swap the URL in place, same row, same alignment. No replacement → leave it and note it. |
| **Person returns as a member** | needs-human | Create the folder as a new person, **leave** the alumni row, and repoint its link to `/authors/<slug>/`. Precedent: `witteveen`. Alumni history is not deleted. |
| **A genuinely new institute** | needs-human | Add to `instituteGroups` **and** the `<ul>` above it in `src/institutes/index.njk`, one commit. |
| **Stale bio or interests** | ignore | Self-authored. People edit their own pages (see PR #49). |

## Phase 6 — Avatars (local only)

1. `https://qusoft.org/people/<first>-<last>/`. The listing page lazy-loads its images, so a plain
   fetch returns `data:image/svg+xml` placeholders — the page has to be rendered in a real browser
   and the resolved `src` read after load.
2. Failing that, the person's institute staff page.
3. Failing that, **leave it absent.** The generic fallback renders fine. A wrong photo is far
   worse than no photo.

Before `git add`:

```bash
sips -g pixelWidth -g pixelHeight src/authors/<slug>/avatar.jpg
sips -Z 1024 src/authors/<slug>/avatar.jpg     # only if the long edge exceeds 1024
```

`sips -Z` **upscales** images smaller than the target as well as downscaling them, so check the
dimensions first. Photos should be JPEG, not PNG:

```bash
sips -s format jpeg -s formatOptions 82 avatar.png --out avatar.jpg && git rm avatar.png
```

These are third-party images. Record in the PR which portraits were taken and from where.

## Phase 7 — Link rot

```bash
bash scripts/check-links.sh
```

Netlify's checklinks runs with `checkExternal = false`, so nothing else catches these. The script
separates:

- **HARD** (404/410/000/5xx) — real. Fix or report.
- **BLOCKED** (403/429/999) — the host refused a bot. Verify in a browser; do not delete on this
  evidence alone.
- **INSECURE** — `http://` where `https://` works. The only class safe to fix mechanically.
- **REDIRECT** — resolves, but to a different host. Worth updating when an institution has moved.

For an alumnus, hunt for a replacement URL rather than removing the link: a dead homepage still
identifies the person.

## Phase 8 — Verify and open the PR

```bash
npm run clean && npm run build     # must exit 0
bash scripts/check-people.sh       # must exit 0
npm run dev                        # then look at / and /institutes/
```

Every person must appear **exactly once** on `/` and at least once on `/institutes/`.

```bash
gh pr create --draft --base main --title "People refresh $(date +%Y-%m)"
```

PR body, in this order:

1. **Applied** — one bullet per commit.
2. **Needs a human decision** — suspected departures with the URL checked, ambiguous roles,
   people with no avatar, empty `Next Affiliation` cells, and who to ask for each institute.
3. **Link rot** — HARD and REDIRECT findings with file and line.
4. **Drift check** — the `scripts/check-people.sh` output in a fenced block.

Never merge from the routine. A human reviews and merges.

---

## What the automated reminder can and cannot do

The scheduled run works from a clone of `origin/main`. It therefore has **no access to
`private_data/`** and no browser. That rules out the two highest-value operations, so by design it:

- **never deletes an author folder and never moves anyone to alumni** — it has no departure evidence;
- **never adds an avatar**;
- **never edits files or opens a PR** — it opens an issue listing what it found;
- **stays silent when there is nothing to report**, so the reminder keeps being worth reading.

Everything it surfaces is a candidate for the next local session, which is where this runbook
actually gets executed.
