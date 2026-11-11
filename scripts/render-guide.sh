#!/usr/bin/env bash
# Render the GreenToken study guide to PDF.
#
#   ./scripts/render-guide.sh [out.pdf] [probe]
#
# The second argument "probe" injects invisible section markers so that a
# probe render can report the true starting page of every section; the page
# numbers are then written back into docs/guide-pages.json and the final
# render uses them, so the table of contents is never a guess.
set -euo pipefail

ROOT="/workspace/greentoken"
SKILL="/workspace/.skills/pdf"
OUT="${1:-$ROOT/docs/GreenToken-Fabric-Guide.pdf}"
MODE="${2:-final}"

cd "$ROOT"

if [ "$MODE" = "probe" ]; then
  GUIDE_PROBE=1 python3 scripts/build-guide.py >/dev/null
else
  python3 scripts/build-guide.py >/dev/null
fi

HEADER='<div style="font-size:7.6pt; color:#75897D; width:100%; padding:0 14mm; box-sizing:border-box; display:flex; justify-content:space-between; font-family:Helvetica,Arial,sans-serif;"><span style="font-weight:700; color:#48654F;">GreenToken</span><span>Hyperledger Fabric from first principles &nbsp;·&nbsp; Unit 5</span></div>'
FOOTER='<div style="font-size:7.6pt; color:#75897D; width:100%; padding:0 14mm; box-sizing:border-box; display:flex; justify-content:space-between; font-family:Helvetica,Arial,sans-serif;"><span>21CSE432IT &nbsp;·&nbsp; greentoken-7gc.pages.dev</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'

bash "$SKILL/scripts/make.sh" render \
  --in "$ROOT/docs/guide.html" \
  --out "$OUT" \
  --format A4 \
  --margin "18mm 14mm 17mm 14mm" \
  --header "$HEADER" \
  --footer "$FOOTER"

pdfinfo "$OUT" | egrep "Pages|Page size"
