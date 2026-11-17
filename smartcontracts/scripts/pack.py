"""pack.py — build the no-network offline pack and the deliverable zip.

Usage: python -I scripts/pack.py
Writes: output/offline/  and  output/A-Promise-That-Keeps-Itself-Scripts.zip
"""
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'output')
OFF = os.path.join(OUT, 'offline')
ZIP = os.path.join(OUT, 'A-Promise-That-Keeps-Itself-Scripts.zip')

DECK_PDF = 'SmartContract-A-Promise-That-Keeps-Itself.pdf'
DECK_PPTX = 'SmartContract-A-Promise-That-Keeps-Itself.pptx'

# carried into the offline pack (the no-network fallback)
PACK_FILES = [
    (os.path.join(OUT, DECK_PDF), DECK_PDF),
    (os.path.join(OUT, 'presenter-script.pdf'), 'presenter-script.pdf'),
    (os.path.join(OUT, 'DEMO-CARD.pdf'), 'DEMO-CARD.pdf'),
    (os.path.join(OUT, 'run-of-show.md'), 'run-of-show.md'),
    (os.path.join(ROOT, 'sources', 'sources.md'), 'sources.md'),
]

# the zip that goes to WhatsApp
ZIP_FILES = [
    (os.path.join(OUT, DECK_PDF), DECK_PDF),
    (os.path.join(OUT, 'presenter-script.pdf'), 'presenter-script.pdf'),
    (os.path.join(OUT, 'DEMO-CARD.pdf'), 'DEMO-CARD.pdf'),
    (os.path.join(OUT, 'run-of-show.md'), 'run-of-show.md'),
    (os.path.join(ROOT, 'sources', 'sources.md'), 'sources.md'),
]


def main():
    os.makedirs(OFF, exist_ok=True)
    for src, name in PACK_FILES:
        shutil.copy2(src, os.path.join(OFF, name))
    print('offline pack ->', OFF)

    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for src, name in ZIP_FILES:
            z.write(src, name)
    print('zip ->', ZIP, '%.1f KB' % (os.path.getsize(ZIP) / 1024))
    with zipfile.ZipFile(ZIP) as z:
        for i in z.infolist():
            print('   ', i.filename, i.file_size)


if __name__ == '__main__':
    main()
