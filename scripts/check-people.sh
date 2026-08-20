#!/usr/bin/env bash
#
# check-people.sh — offline consistency checks for src/authors/.
#
# Most of the ways this site breaks are silent: a mistyped user_group removes
# someone from a page with no error, a wrong Font Awesome pack renders an
# invisible icon, a deleted author folder leaves a dangling link that only
# fails later on Netlify. This script turns those into visible failures.
#
# Usage:  bash scripts/check-people.sh
# Exit:   1 if any HARD check failed, else 0. INFO lines never affect the code.
#
# Portability: macOS/BSD userland. No `grep -P`, no GNU-only flags.
# Two author files are CRLF-terminated, so every read pipes through `tr -d '\r'`.
# This script never reads anything under private_data/.

set -u
cd "$(dirname "$0")/.." || exit 2

hard=0
fail() { printf 'FAIL  %s\n' "$1"; hard=1; }
info() { printf 'INFO  %s\n' "$1"; }

# ---------------------------------------------------------------- vocabulary
# Must match groupOrder in src/home/index.njk and instituteGroups in
# src/institutes/index.njk exactly. Both are matched as literal strings.
ROLE_GROUPS='Permanent Members
Postdocs
PhD Students
Research Assistants
Visitors
Alumni'

INSTITUTE_GROUPS='CWI Algorithms and Complexity
CWI Networks and Optimization
CWI Computer Security
UvA ILLC
UvA Informatics Institute
UvA Korteweg-de Vries Institute for Mathematics
UvA Institute of Physics
UvA Van '\''t Hoff Institute for Molecular Sciences
VU Theoretical Computer Science
QuSoft'

VOCAB="$ROLE_GROUPS
$INSTITUTE_GROUPS"

# ----------------------------------------------------------------- extractors
# List indentation is inconsistent across files — some use "- Foo", most use
# "  - Foo" — so these match [ ]* and not [ ]+.
ug() {  # user_groups entries, one per line
  tr -d '\r' < "$1" | awk '
    /^user_groups:/ { g=1; next }
    g && /^[ ]*- / { sub(/^[ ]*- /, ""); print; next }
    g { g=0 }'
}

ogname() {  # organizations[].name values
  tr -d '\r' < "$1" | awk '
    /^organizations:/ { g=1; next }
    g && /^[ ]*- name: / { sub(/^[ ]*- name: /, ""); print; next }
    g && /^[ ]*url: / { next }
    g { g=0 }'
}

ogurl() {  # organizations[].url values
  tr -d '\r' < "$1" | awk '
    /^organizations:/ { g=1; next }
    g && /^[ ]*(- )?(name|url): / { print; next }
    g && /^[ ]*- / { next }
    g { g=0 }' | sed -n 's/^[ ]*url: *//p'
}

# Map an organizations URL onto the institute group it implies.
group_for_url() {
  case "$1" in
    *algorithms-and-complexity*) echo "CWI Algorithms and Complexity" ;;
    *networks-and-optimization*) echo "CWI Networks and Optimization" ;;
    *computer-security*)         echo "CWI Computer Security" ;;
    *life-sciences-and-health*)  echo "CWI Life Sciences and Health" ;;
    *illc.uva.nl*)               echo "UvA ILLC" ;;
    *ivi*.uva.nl*|*mns-research.nl*) echo "UvA Informatics Institute" ;;
    *kdvi.uva.nl*)               echo "UvA Korteweg-de Vries Institute for Mathematics" ;;
    *iop.uva.nl*)                echo "UvA Institute of Physics" ;;
    *cs.vu.nl*|*theoretical-computer-science*) echo "VU Theoretical Computer Science" ;;
    *qusoft.org*)                echo "QuSoft" ;;
    *) echo "" ;;
  esac
}

# Collect findings into a file first, then report — keeps `hard` out of the
# subshell a pipeline would create.
tmp=$(mktemp -t checkpeople) || exit 2
trap 'rm -f "$tmp"' EXIT
report_fail() { while IFS= read -r l; do [ -n "$l" ] && fail "$l"; done < "$tmp"; : > "$tmp"; }
report_info() { while IFS= read -r l; do [ -n "$l" ] && info "$l"; done < "$tmp"; : > "$tmp"; }

echo "== C1  user_groups values outside the vocabulary =="
# These silently drop the person from /institutes/ or /.
# Entries in scripts/known-exceptions.txt are reported as INFO instead, so that
# accepted-but-unresolved findings don't mask new ones.
EXCEPTIONS=scripts/known-exceptions.txt
excepted() {  # $1=slug $2=group
  [ -f "$EXCEPTIONS" ] || return 1
  grep -v '^#' "$EXCEPTIONS" | grep -qxF "$1|$2"
}
: > "$tmp"
: > "$tmp.info"
for f in src/authors/*/index.md; do
  slug=$(basename "$(dirname "$f")")
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    printf '%s\n' "$VOCAB" | grep -qxF "$g" && continue
    if excepted "$slug" "$g"; then
      echo "$f: '$g' is not a known group (accepted in $EXCEPTIONS)" >> "$tmp.info"
    else
      echo "$f: '$g' is not a known group" >> "$tmp"
    fi
  done < <(ug "$f")
done
report_fail
mv "$tmp.info" "$tmp"
report_info

echo
echo "== C2  role group missing or duplicated =="
# Exactly one of Permanent Members / Postdocs / PhD Students / ... per person.
for f in src/authors/*/index.md; do
  n=$(ug "$f" | grep -xF -f <(printf '%s\n' "$ROLE_GROUPS") | wc -l | tr -d ' ')
  [ "$n" = "1" ] || fail "$f has $n role groups (want exactly 1)"
done

echo
echo "== C3  organizations URL implies a user_group that is missing =="
# The institute is stored twice and the two lists drift. Matching on URL
# rather than the free-form display name keeps this low-noise. This is the
# check that would have caught the 8 people missing from QuSoft in PR #50.
: > "$tmp"
for f in src/authors/*/index.md; do
  groups=$(ug "$f")
  while IFS= read -r u; do
    [ -n "$u" ] || continue
    want=$(group_for_url "$u")
    [ -n "$want" ] || continue
    printf '%s\n' "$groups" | grep -qxF "$want" || echo "$f: needs user_group '$want' (from $u)" >> "$tmp"
  done < <(ogurl "$f")
done
report_fail

echo
echo "== C3b organizations name is a vocabulary string but not in user_groups =="
: > "$tmp"
for f in src/authors/*/index.md; do
  groups=$(ug "$f")
  while IFS= read -r o; do
    [ -n "$o" ] || continue
    printf '%s\n' "$VOCAB" | grep -qxF "$o" || continue
    printf '%s\n' "$groups" | grep -qxF "$o" || echo "$f: org '$o' not in user_groups" >> "$tmp"
  done < <(ogname "$f")
done
report_fail

echo
echo "== C3c institute user_group with no matching organizations entry (INFO) =="
# Noisy by design: organizations is display text and may legitimately word
# things differently. Advisory only.
: > "$tmp"
for f in src/authors/*/index.md; do
  orgs=$(ogname "$f")
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    printf '%s\n' "$orgs" | grep -qxF "$g" || echo "$f: '$g' has no matching organizations entry" >> "$tmp"
  done < <(ug "$f" | grep -vxF -f <(printf '%s\n' "$ROLE_GROUPS"))
done
report_info

echo
echo "== C4  role vocabulary (INFO) =="
for f in src/authors/*/index.md; do
  tr -d '\r' < "$f" | sed -n 's/^role: *//p'
done | sed 's/[[:space:]]*$//' | sort | uniq -c | sort -rn | while read -r n r; do
  printf '      %3s  %s\n' "$n" "$r"
done
: > "$tmp"
grep -l '^role: PhD student' src/authors/*/index.md 2>/dev/null \
  | sed "s|\$| uses lowercase 'PhD student' (the dominant form is 'PhD Student')|" >> "$tmp"
report_info

echo
echo "== C5  avatars =="
: > "$tmp"
for d in src/authors/*/; do
  [ -f "$d/index.md" ] || continue
  n=$(ls "$d" | grep -ciE '^avatar\.(jpe?g|png|gif|webp)$')
  [ "$n" -gt 1 ] && echo "$d has $n avatar files — only one is served, delete the rest" >> "$tmp"
done
# src/_data/avatars.js matches case-insensitively, but the passthrough glob in
# eleventy.config.js lists only these spellings. Anything else is found by the
# data file and never copied: a broken image that fails Netlify's checklinks.
find src/authors -type f -iname 'avatar.*' \
  ! -name 'avatar.jpg'  ! -name 'avatar.jpeg' ! -name 'avatar.png' \
  ! -name 'avatar.gif'  ! -name 'avatar.webp' \
  ! -name 'avatar.JPG'  ! -name 'avatar.JPEG' ! -name 'avatar.PNG' \
  | sed 's|$|: extension not in the eleventy.config.js passthrough glob|' >> "$tmp"
report_fail
: > "$tmp"
for d in src/authors/*/; do
  [ -f "$d/index.md" ] || continue
  ls "$d" | grep -qiE '^avatar\.(jpe?g|png|gif|webp)$' \
    || echo "no avatar: $d (renders the generic fallback)" >> "$tmp"
done
find src/authors -type f -iname 'avatar.*' -size +200k \
  | while IFS= read -r f; do
      echo "$(ls -lh "$f" | awk '{print $5}') $f (no build-time resize; target <=1024px, <=200 KB)"
    done >> "$tmp"
report_info

echo
echo "== C6  dangling /authors/<slug>/ links =="
# These DO fail the Netlify build — checklinks validates internal links.
: > "$tmp"
grep -rohE '/authors/[a-z0-9._-]+/' src --include='*.md' --include='*.njk' --include='*.html' \
  | sort -u | sed 's|/authors/||; s|/$||' \
  | while IFS= read -r s; do
      [ -d "src/authors/$s" ] || echo "dangling link /authors/$s/ (no such folder)"
    done >> "$tmp"
report_fail

echo
echo "== C6b dangling post bylines =="
# A byline whose slug has no author folder renders as nothing, silently.
: > "$tmp"
grep -rhoE '^authors: \[[^]]*\]' src/posts/*/index.md 2>/dev/null \
  | sed 's/authors: \[//; s/\]//' | tr ',' '\n' | tr -d ' "' | sort -u \
  | while IFS= read -r s; do
      [ -n "$s" ] || continue
      [ -d "src/authors/$s" ] || echo "post byline references missing author '$s'"
    done >> "$tmp"
report_fail

echo
echo "== C7  required fields =="
for f in src/authors/*/index.md; do
  # Here-strings, not pipes: `grep -q` exits on first match and would SIGPIPE
  # the writer.
  t=$(tr -d '\r' < "$f")
  grep -q '^title: *[^ ]'    <<< "$t" || fail "$f has no title"
  grep -q '^lastname: *[^ ]' <<< "$t" || fail "$f has no lastname (it is the sort key)"
  grep -q '^role: *[^ ]'     <<< "$t" || fail "$f has no role"
done

echo
echo "== C8  vocabulary groups with no members (INFO) =="
all=$(for f in src/authors/*/index.md; do ug "$f"; done)
: > "$tmp"
while IFS= read -r g; do
  [ -n "$g" ] || continue
  n=$(printf '%s\n' "$all" | grep -cxF "$g")
  [ "$n" = "0" ] && echo "'$g' has no members — its section renders as nothing" >> "$tmp"
done < <(printf '%s\n' "$VOCAB")
report_info

echo
echo "== C9  CRLF sentinel =="
# fokkink has been CRLF since the Hugo port. A new entry means
# someone edited through a Windows client; fix that file on its own.
: > "$tmp"
grep -rl --include='*.md' "$(printf '\r')" src/authors/ src/home/ 2>/dev/null | sort | while IFS= read -r f; do
  case "$f" in
    src/authors/fokkink/index.md) ;;
    *) echo "$f is CRLF (new — fix line endings in its own commit)" ;;
  esac
done >> "$tmp"
report_info

echo
if [ "$hard" -ne 0 ]; then
  echo "RESULT: hard failures above. Fix them before committing."
  exit 1
fi
echo "RESULT: no hard failures."
exit 0
