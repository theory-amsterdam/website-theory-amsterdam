---
name: people-refresh
description: Run the recurring people refresh for this site — reconcile src/authors/ against the institute pages and the private roster, move departures to alumni, and sweep for link rot. Use when asked to refresh, update or reconcile the people/member listings, when handling a "People refresh <YYYY-MM>" reminder issue, or when adding, removing or re-tagging someone on the site.
---

Read `docs/people-refresh.md` and follow it phase by phase. `CLAUDE.md` has the data model and
the exact `user_groups` vocabulary it depends on.

Three things that matter more than the rest:

- **Phase 1 first.** `bash scripts/check-people.sh` before touching any upstream source. It is
  offline, deterministic, and usually finds more than the upstream diff does.
- **Departures need the private roster.** Absence from an institute listing page is not evidence
  that someone left. If `private_data/` is not present, skip the departure pass and say so.
- **Nothing committed describes the private roster** — no filename, no structure, no field names.
  State conclusions, never source records. The same goes for the mailing-list membership.
- **The mailing-list check (Phase 7b) is additive only.** Report current members who aren't
  subscribed; never propose removing anyone.
