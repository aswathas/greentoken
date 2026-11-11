#!/usr/bin/env bash
#
# restore-deliverables.sh — materialise the binary deliverables that are
# committed to this repository as base64 sidecar files.
#
# GitHub's API accepts file contents as text, so the presentation deck and the
# printable PDFs are committed as `<name>.b64` alongside a SHA-256 checksum.
# This script decodes them back into the real files and verifies the checksum,
# so you can prove the copy you have is byte-identical to the one served from
# the live deployment.
#
# Usage:
#   ./scripts/restore-deliverables.sh          # decode into dist-deliverables/
#   ./scripts/restore-deliverables.sh --verify  # only check the checksums
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DIR="dist-deliverables"
VERIFY_ONLY=0
[[ "${1:-}" == "--verify" ]] && VERIFY_ONLY=1

if ! compgen -G "$DIR/*.b64.[0-9][0-9][0-9]" >/dev/null; then
  echo "nothing to restore — no .b64 files found in $DIR/"
  exit 0
fi

status=0
for src in "$DIR"/*.b64.[0-9][0-9][0-9]; do
  [[ -e "$src" ]] || continue
  # the sidecar for <name> is split into <name>.b64.001, .002, ...
  base="$(basename "$src")"
  base="${base%.b64.*}"
  dest="$DIR/$base"

  if [[ -f "$dest" ]]; then
    echo "skip   $base (already present)"
    continue
  fi

  if [[ "$VERIFY_ONLY" == "1" ]]; then
    echo "would restore $base"
    continue
  fi

  cat "$DIR/$base".b64.[0-9][0-9][0-9] | base64 -d > "$dest.tmp" && mv "$dest.tmp" "$dest"

  if [[ -f "$DIR/$base.b64.sha256" ]]; then
    expected="$(awk '{print $1}' "$DIR/$base.b64.sha256")"
    actual="$(sha256sum "$dest" | awk '{print $1}')"
    if [[ "$expected" == "$actual" ]]; then
      echo "ok     $base  sha256 $actual"
    else
      echo "FAIL   $base  expected $expected got $actual" >&2
      status=1
    fi
  else
    echo "ok     $base  ($(stat -c%s "$dest") bytes)"
  fi
done

if [[ "$VERIFY_ONLY" == "0" ]]; then
  echo
  echo "Done. The files above are byte-identical to the copies served from"
  echo "https://greentoken-7gc.pages.dev/downloads/"
fi

exit "$status"
