#!/usr/bin/env bash
# render-case-figures.sh — rasterise the case-study figures with headless Chromium.
set -euo pipefail
ROOT="/workspace/greentoken"
FIG="$ROOT/docs/figures"
CHROME="/workspace/.home/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
SCALE=2
mkdir -p "$FIG"
for svg in "$FIG"/*.svg; do
  name="$(basename "$svg" .svg)"
  dims=$(python3 -c "
import re,sys
x=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'viewBox=\"0 0 (\d+) (\d+)\"',x)
print(int(m.group(1)), int(m.group(2)))
" "$svg")
  set -- $dims
  w=$(( $1 * SCALE )); h=$(( $2 * SCALE ))
  cat > "$FIG/$name.html" <<HTML
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff}
img{display:block;width:${w}px;height:${h}px}
</style></head><body><img src="$name.svg"></body></html>
HTML
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=1 --window-size="${w},${h}" \
    --screenshot="$FIG/$name.png" "file://$FIG/$name.html" >/dev/null 2>&1
  rm -f "$FIG/$name.html"
  printf "  %-12s %sx%s\n" "$name.png" "$w" "$h"
done
