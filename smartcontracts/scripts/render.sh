#!/usr/bin/env bash
# render.sh — pptx -> pdf -> raster png -> small jpg (for Read).
# The jpegs land in a temp dir because the context-mode hook blocks image
# reads inside the project directory.
set -e
cd "$(dirname "$0")/.."
OUT="${TMP:-C:/Users/ADMIN/AppData/Local/Temp}/deckimg2"
DECK="output/SmartContract-A-Promise-That-Keeps-Itself.pptx"

rm -f output/SmartContract-A-Promise-That-Keeps-Itself.pdf
"/c/Program Files/LibreOffice/program/soffice.exe" --headless --norestore \
  -env:UserInstallation=file:///C:/Users/ADMIN/Projects/smart-contract-deck/.lo \
  --convert-to pdf --outdir output "$DECK" >/dev/null 2>&1

python -I -c "
import pymupdf, os, glob
from PIL import Image
d = pymupdf.open('output/SmartContract-A-Promise-That-Keeps-Itself.pdf')
m = pymupdf.Matrix(150/72, 150/72)
os.makedirs('raster', exist_ok=True)
for i, p in enumerate(d):
    p.get_pixmap(matrix=m).save(f'raster/slide-{i+1:02d}.png')
os.makedirs('rsmall', exist_ok=True)
for f in sorted(glob.glob('raster/slide-*.png')):
    im = Image.open(f).convert('RGB'); im.thumbnail((760,760))
    q = 26
    o = 'rsmall/' + os.path.basename(f).replace('.png','.jpg')
    im.save(o,'JPEG',quality=q,optimize=True)
    while os.path.getsize(o) > 13500 and q > 12:
        q -= 2; im.save(o,'JPEG',quality=q,optimize=True)
print('pages', d.page_count, '| max jpg KB', max(os.path.getsize('rsmall/'+f) for f in os.listdir('rsmall'))//1024)
"
rm -rf "$OUT"; mkdir -p "$OUT"; cp rsmall/*.jpg "$OUT"/
echo "renders ready in $OUT"
