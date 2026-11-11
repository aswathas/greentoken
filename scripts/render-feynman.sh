#!/usr/bin/env bash
# render-feynman.sh — render the "taught from first principles" document to PDF.
set -euo pipefail
ROOT="/workspace/greentoken"
SKILL="/workspace/.skills/pdf"
OUT="${1:-$ROOT/docs/Hyperledger-Fabric-First-Principles.pdf}"
cd "$ROOT"
python3 scripts/build-feynman.py
HEADER='<div style="font-size:7.4pt; color:#75897D; width:100%; padding:0 16mm; box-sizing:border-box; display:flex; justify-content:space-between; font-family:Helvetica,Arial,sans-serif;"><span style="font-weight:700; color:#48654F;">GreenToken</span><span>Hyperledger Fabric, taught from first principles</span></div>'
FOOTER='<div style="font-size:7.4pt; color:#75897D; width:100%; padding:0 16mm; box-sizing:border-box; display:flex; justify-content:space-between; font-family:Helvetica,Arial,sans-serif;"><span>21CSE435T &nbsp;·&nbsp; greentoken-7gc.pages.dev</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
bash "$SKILL/scripts/make.sh" render \
  --in "$ROOT/docs/feynman.html" --out "$OUT" --format A4 \
  --margin "17mm 16mm 16mm 16mm" --header "$HEADER" --footer "$FOOTER"
pdfinfo "$OUT" | egrep "Pages|Page size"
