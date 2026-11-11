#!/usr/bin/env bash
#
# render-diagrams.sh — render the GreenToken Fabric diagrams document to PDF.
#
#   ./scripts/render-diagrams.sh [out.pdf]
#
# A4 LANDSCAPE, because every page is one diagram. Running headers/footers are
# supplied by Chromium's native header/footer templates so the page numbers are
# always correct.
set -euo pipefail

ROOT="/workspace/greentoken"
SKILL="/workspace/.skills/pdf"
OUT="${1:-$ROOT/docs/GreenToken-Fabric-Diagrams.pdf}"

cd "$ROOT"
python3 scripts/build-diagrams.py

HEADER='<div style="font-size:7.4pt; color:#75897D; width:100%; padding:0 13mm; box-sizing:border-box; display:flex; justify-content:space-between; font-family:Helvetica,Arial,sans-serif;"><span style="font-weight:700; color:#48654F;">GreenToken</span><span>How GreenToken works in Hyperledger Fabric</span></div>'
FOOTER='<div style="font-size:7.4pt; color:#75897D; width:100%; padding:0 13mm; box-sizing:border-box; display:flex; justify-content:space-between; font-family:Helvetica,Arial,sans-serif;"><span>21CSE432IT &nbsp;·&nbsp; greentoken-7gc.pages.dev</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'

bash "$SKILL/scripts/make.sh" render \
  --in "$ROOT/docs/diagrams.html" \
  --out "$OUT" \
  --format A4 \
  --landscape \
  --margin "12mm 13mm 11mm 13mm" \
  --header "$HEADER" \
  --footer "$FOOTER"

pdfinfo "$OUT" | egrep "Pages|Page size"
