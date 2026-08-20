#!/usr/bin/env bash
#
# check-links.sh — probe the external links on the site.
#
# Netlify runs netlify-plugin-checklinks with checkExternal = false, so a dead
# personal homepage or a moved group page never fails a deploy. Nothing catches
# external rot unless someone looks. This is that look.
#
# Usage:
#   bash scripts/check-links.sh              # probe everything
#   bash scripts/check-links.sh --list       # just print the URLs, no network
#   bash scripts/check-links.sh --jobs 4     # change parallelism (default 8)
#
# Always exits 0: this is advisory. Read the report, don't gate on it.
#
# Portability: macOS/BSD userland. `curl --max-time` rather than timeout(1).

set -u
cd "$(dirname "$0")/.." || exit 2

JOBS=8
LIST_ONLY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --list) LIST_ONLY=1; shift ;;
    --jobs) JOBS="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

# Hosts that answer bots with a refusal rather than the page. A non-2xx from
# these says nothing about whether the link works in a browser, so they are
# suppressed entirely rather than reported as noise.
#   linkedin.com  -> always 999
#   x/twitter     -> varies by region and login wall
#   researchgate, sciencedirect -> 403 to non-browsers
#   scholar.google -> 429 once you probe enough of them
ALLOW_HOSTS='www.linkedin.com
linkedin.com
x.com
twitter.com
www.researchgate.net
www.sciencedirect.com
scholar.google.com
scholar.google.nl
scholar.google.co.uk
scholar.google.ca'

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

# ------------------------------------------------------------------ extraction
# Four sources. The institutes <ul> matters twice over: those are also the pages
# the two-monthly refresh fetches, so a 404 there means our own upstream moved.
extract_urls() {
  {
    for f in src/authors/*/index.md; do
      tr -d '\r' < "$f" | sed -n -e 's/^[ ]*link: *//p' -e 's/^[ ]*url: *//p'
    done
    grep -ohE 'https?://[^)"< ]+' \
      src/home/sections/alumni.md \
      src/contact/index.md \
      src/institutes/index.njk 2>/dev/null
  } | sed 's/[[:space:]]*$//; s/[.,;]$//' \
    | grep -v '^mailto:' \
    | grep '^https\?://' \
    | sort -u
}

# -E, not BRE: BSD sed has no \? in basic regex, so `https\?://` never matches
# and every host would come back as "https:".
host_of() { printf '%s\n' "$1" | sed -E -e 's|^https?://||' -e 's|[/?#].*$||' -e 's|^.*@||'; }

allowed() { printf '%s\n' "$ALLOW_HOSTS" | grep -qxF "$(host_of "$1")"; }

urls=$(extract_urls)
total=$(printf '%s\n' "$urls" | grep -c .)

if [ "$LIST_ONLY" = "1" ]; then
  printf '%s\n' "$urls"
  echo "# $total unique external URLs" >&2
  exit 0
fi

echo "Probing $total unique external URLs with $JOBS workers..."
echo

# --------------------------------------------------------------------- probing
# Full GET with -L, not HEAD: a meaningful minority of academic servers answer
# 405 to HEAD. %{url_effective} lets us spot cross-host redirects.
probe_one() {
  u="$1"
  out=$(curl -sS -o /dev/null -L --compressed --max-time 20 \
             -A "$UA" -w '%{http_code}\t%{url_effective}' "$u" 2>/dev/null)
  [ -n "$out" ] || out=$(printf '000\t%s' "$u")
  printf '%s\t%s\n' "$u" "$out"
}
export -f probe_one host_of 2>/dev/null || true
export UA

pass1=$(mktemp -t links1); pass2=$(mktemp -t links2); final=$(mktemp -t linksf)
trap 'rm -f "$pass1" "$pass2" "$final"' EXIT

printf '%s\n' "$urls" | xargs -P "$JOBS" -I{} bash -c 'probe_one "$@"' _ {} > "$pass1"

# Second pass, serial and unhurried, over everything that wasn't 2xx. Most
# rate-limit noise disappears here; only reproducible failures get reported.
retry=$(awk -F'\t' '$2 !~ /^2/ {print $1}' "$pass1")
nretry=$(printf '%s\n' "$retry" | grep -c .)
if [ "$nretry" -gt 0 ]; then
  echo "Re-probing $nretry non-2xx URLs serially..."
  echo
  sleep 10
  printf '%s\n' "$retry" | while IFS= read -r u; do
    [ -n "$u" ] || continue
    probe_one "$u"
  done > "$pass2"
else
  : > "$pass2"
fi

# Merge: a URL that passed on either attempt is fine.
awk -F'\t' 'NR==FNR { if ($2 ~ /^2/) ok[$1]=1; next }
            { if ($1 in ok) next; print }' "$pass2" "$pass1" > "$final"
awk -F'\t' '$2 ~ /^2/ {print $1}' "$pass2" > "$pass2.ok"

# Third pass, per host. A host that fails several URLs at once is almost always
# rate-limiting us, not hosting several dead pages: parallel probing of dblp.org
# produced seven "000" results while every one of those URLs was in fact live.
# So for any host with 2+ remaining failures, re-probe its URLs one at a time
# with a real pause, and only keep the ones that still fail.
for host in $(awk -F'\t' '{print $1}' "$final" | while IFS= read -r u; do
                  allowed "$u" || host_of "$u"      # allowlisted hosts are dropped later anyway
              done | sort | uniq -c | awk '$1 >= 2 {print $2}'); do
  echo "  (re-probing $host serially — multiple failures look like rate limiting)"
  awk -F'\t' -v h="$host" 'index($1, "//"h"/") || index($1, "//"h":") {print $1}' "$final" \
  | while IFS= read -r u; do
      sleep 2
      c=$(curl -sS -o /dev/null -L --compressed --max-time 25 -A "$UA" -w '%{http_code}' "$u" 2>/dev/null)
      case "$c" in 2*) printf '%s\n' "$u" >> "$pass2.ok" ;; esac
    done
done

# ------------------------------------------------------------------ classifying
hard=0; insecure=0; soft=0; blocked=0
: > "$final.blocked"

echo "== HARD — dead, report and fix =="
# 404/410 = gone. 000 = DNS failure, connection refused or TLS error.
# 5xx that reproduced across both passes = the server is genuinely broken.
# 403/429/999 are NOT here: those are bot protection, see BLOCKED below.
while IFS=$'\t' read -r u code eff; do
  [ -n "$u" ] || continue
  grep -qxF "$u" "$pass2.ok" 2>/dev/null && continue
  case "$code" in 2*) continue ;; esac
  if allowed "$u"; then soft=$((soft+1)); continue; fi
  case "$code" in
    403|429|999)
      printf '  %-4s %s\n' "$code" "$u" >> "$final.blocked"
      blocked=$((blocked+1))
      continue ;;
  esac
  printf '  %-4s %s\n' "$code" "$u"
  grep -rln --include='*.md' --include='*.njk' -F "$u" src | sed 's/^/         in /'
  hard=$((hard+1))
done < "$final"
[ "$hard" = "0" ] && echo "  (none)"

echo
echo "== BLOCKED — refused our request; verify in a browser, don't just delete =="
if [ -s "$final.blocked" ]; then cat "$final.blocked"; else echo "  (none)"; fi

echo
echo "== INSECURE — http:// that also answers on https:// (safe to upgrade) =="
printf '%s\n' "$urls" | grep '^http://' | while IFS= read -r u; do
  s="https://${u#http://}"
  c=$(curl -sS -o /dev/null -L --compressed --max-time 15 -A "$UA" -w '%{http_code}' "$s" 2>/dev/null)
  case "$c" in 2*) printf '  %s\n       -> %s\n' "$u" "$s" ;; esac
done | tee "$pass1.ins"
[ -s "$pass1.ins" ] || echo "  (none)"
insecure=$(grep -c '^  http://' "$pass1.ins" 2>/dev/null || echo 0)

echo
echo "== REDIRECT — resolves, but to a different host (advisory) =="
awk -F'\t' '$2 ~ /^2/ {print $1"\t"$3}' "$pass1" | while IFS=$'\t' read -r u eff; do
  [ -n "$eff" ] || continue
  h1=$(host_of "$u"); h2=$(host_of "$eff")
  [ "$h1" = "$h2" ] && continue
  # www./non-www. and http->https on the same site are not interesting
  [ "${h1#www.}" = "${h2#www.}" ] && continue
  printf '  %s\n       -> %s\n' "$u" "$eff"
done | head -60

echo
echo "== SUMMARY =="
printf '  %s URLs probed\n' "$total"
printf '  %s hard failures (404/410/000/5xx)\n' "$hard"
printf '  %s blocked (403/429/999 — bot protection, verify by hand)\n' "$blocked"
printf '  %s suppressed as always-bot-blocked hosts (LinkedIn, Scholar, ...)\n' "$soft"
echo
echo "Only INSECURE is safe to fix mechanically. Everything else needs a human:"
echo "for an alumni row, hunt for a replacement URL rather than deleting the"
echo "link — a dead homepage still identifies the person."
exit 0
