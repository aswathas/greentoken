#!/usr/bin/env bash
#
# fetch-deliverables.sh — download the binary deliverables and screenshots from
# the live deployment into this working tree.
#
# The repository commits the deck and the printable PDFs as base64 sidecars
# (see scripts/restore-deliverables.sh) because GitHub's API only accepts text
# file contents. The screenshots are not committed at all — they are served
# from the live deployment and referenced by absolute URL in the README, so
# they are always current.
#
# This script is the one-command way to materialise everything:
#
#   ./scripts/fetch-deliverables.sh
#
# Every file is verified against its published SHA-256 where one is known.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE="${GREENTOKEN_DOWNLOADS:-https://greentoken-7gc.pages.dev/downloads}"

echo "==> fetching deliverables from $BASE"

fetch() {
  local name="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  if ! curl -fsSL "$BASE/$name" -o "$dest"; then
    echo "    FAILED  $name" >&2
    return 1
  fi
  printf "    ok  %-52s %8d bytes\n" "$name" "$(stat -c%s "$dest")"
}

# the deck, the study guide, the diagram pack and the demo card
fetch "GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx" "dist-deliverables/GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx"
fetch "GreenToken-Verifiable-Carbon-Tokens-Unit5.pdf"  "dist-deliverables/GreenToken-Verifiable-Carbon-Tokens-Unit5.pdf"
fetch "GreenToken-Fabric-Guide.pdf"                   "dist-deliverables/GreenToken-Fabric-Guide.pdf"
fetch "GreenToken-Fabric-Diagrams.pdf"                "dist-deliverables/GreenToken-Fabric-Diagrams.pdf"
fetch "DEMO-CARD.pdf"                                 "dist-deliverables/DEMO-CARD.pdf"

# the screens
mkdir -p docs/screenshots
for shot in 01-dashboard 02-discover-map 03-plant-form 04-plant-submitted \
            05-verification-queue 06-funding-basket 07-invoices 08-leaderboard \
            09-ledger-explorer 10-tamper-detected 11-block-detail 12-token-provenance \
            demo-card live-deploy mobile-dashboard mobile-drawer; do
  fetch "$shot.png" "docs/screenshots/$shot.png"
done

echo
echo "==> verifying against the published checksums"
status=0
for base in dist-deliverables/*.b64.sha256; do
  [ -e "$base" ] || continue
  name="$(awk '{print $2}' "$base")"
  expected="$(awk '{print $1}' "$base")"
  target="dist-deliverables/$name"
  if [ ! -f "$target" ]; then
    echo "    MISSING  $name" >&2
    status=1
    continue
  fi
  actual="$(sha256sum "$target" | awk '{print $1}')"
  if [ "$expected" = "$actual" ]; then
    echo "    ok       $name"
  else
    echo "    MISMATCH $name" >&2
    status=1
  fi
done

echo
if [ "$status" = "0" ]; then
  echo "All deliverables fetched and verified."
else
  echo "Some files did not verify — see the messages above." >&2
fi
exit "$status"
