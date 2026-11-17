"""check-fit.py — text-fit and bounds checker for the generated deck.

Reads the .pptx XML directly (no python-pptx needed) and, for every text
shape, measures the real rendered width of each line with the actual TrueType
font via PIL, wraps it into the shape's width, and compares the required
height against the shape's height. Also flags anything outside the canvas.

Usage:  python -I scripts/check-fit.py output/<deck>.pptx
"""
import sys, re, zipfile, html, os
from PIL import ImageFont

EMU = 914400.0
SLIDE_W, SLIDE_H = 13.3333, 7.5

FONTS = {
    ('Arial', False): r'C:\Windows\Fonts\arial.ttf',
    ('Arial', True): r'C:\Windows\Fonts\arialbd.ttf',
    ('Consolas', False): r'C:\Windows\Fonts\consola.ttf',
    ('Consolas', True): r'C:\Windows\Fonts\consolab.ttf',
}
_cache = {}


def font(name, bold, pt):
    key = (name, bold, round(pt))
    if key not in _cache:
        path = FONTS.get((name, bold)) or FONTS[('Arial', bold)]
        # 1 pt == 1/72 in; PIL wants pixels -> render at 4x for precision
        _cache[key] = ImageFont.truetype(path, max(1, int(round(pt * 4))))
    return _cache[key]


def text_width_pt(s, name, bold, pt):
    f = font(name, bold, pt)
    return f.getlength(s) / 4.0


def check(path):
    z = zipfile.ZipFile(path)
    names = sorted(
        [n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)],
        key=lambda n: int(re.search(r'(\d+)', n.split('/')[-1]).group(1)),
    )
    problems = []
    for n in names:
        idx = int(re.search(r'(\d+)', n.split('/')[-1]).group(1))
        xml = z.read(n).decode('utf-8', 'replace')
        for sp in re.findall(r'<p:sp>.*?</p:sp>', xml, re.S):
            xf = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/>\s*<a:ext cx="(\d+)" cy="(\d+)"', sp)
            if not xf:
                continue
            x, y, cx, cy = (int(g) for g in xf.groups())
            x, y, cx, cy = x / EMU, y / EMU, cx / EMU, cy / EMU
            body = re.search(r'<p:txBody>.*?</p:txBody>', sp, re.S)
            if not body:
                continue
            b = body.group(0)
            paras = re.findall(r'<a:p>.*?</a:p>', b, re.S)
            # default insets unless margin:0 was set (lIns/rIns attr on bodyPr)
            bp = re.search(r'<a:bodyPr([^>]*)/?>', b)
            ins_l = ins_r = 0.1
            if bp:
                attrs = bp.group(1)
                m = re.search(r'lIns="(\d+)"', attrs)
                if m:
                    ins_l = int(m.group(1)) / EMU
                m = re.search(r'rIns="(\d+)"', attrs)
                if m:
                    ins_r = int(m.group(1)) / EMU
            avail_w_pt = (cx - ins_l - ins_r) * 72.0
            total_h_pt = 0.0
            worst = None
            for p in paras:
                runs = re.findall(r'<a:t>(.*?)</a:t>', p, re.S)
                if not runs:
                    continue
                txt = ''.join(html.unescape(r) for r in runs)
                rpr = re.search(r'<a:rPr[^>]*sz="(\d+)"', p)
                pt = (int(rpr.group(1)) / 100.0) if rpr else 18.0
                bold = 'b="1"' in (re.search(r'<a:rPr[^>]*>', p).group(0) if re.search(r'<a:rPr[^>]*>', p) else '')
                fn = re.search(r'typeface="([^"]+)"', p)
                fname = fn.group(1) if fn else 'Arial'
                ls = re.search(r'<a:lnSpc>.*?<a:spcPct val="(\d+)"/>', p, re.S)
                lsf = (int(ls.group(1)) / 100000.0) if ls else 1.0
                w = text_width_pt(txt, fname, bold, pt)
                lines = max(1, int(w / avail_w_pt) + (1 if w % avail_w_pt else 0)) if avail_w_pt > 0 else 1
                lh = pt * 1.21 * max(1.0, lsf)
                total_h_pt += lines * lh
                if lines > 1 and worst is None:
                    worst = (txt[:48], lines, round(w / avail_w_pt, 2))
            need_in = total_h_pt / 72.0
            if need_in > cy + 0.02:
                problems.append((idx, 'OVERFLOW', f'h={cy:.2f}in need={need_in:.2f}in', worst))
            if x < -0.01 or y < -0.01 or x + cx > SLIDE_W + 0.01 or y + cy > SLIDE_H + 0.01:
                problems.append((idx, 'OUT-OF-BOUNDS', f'x={x:.2f} y={y:.2f} w={cx:.2f} h={cy:.2f}', worst))
    return problems


if __name__ == '__main__':
    p = check(sys.argv[1])
    if not p:
        print('FIT OK — no overflow, nothing out of bounds')
    else:
        for idx, kind, detail, worst in p:
            print(f'slide {idx:>2}  {kind:<14} {detail}   {worst or ""}')
        print(f'\n{len(p)} issue(s)')
