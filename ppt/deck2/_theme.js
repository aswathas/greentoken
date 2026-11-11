/**
 * Shared theme and helpers for the GreenToken story deck.
 *
 * Light theme, one accent hue (green) plus one warm alert hue (clay) that is
 * used only on the problem slides, so the reader's eye is told where the
 * danger is and where the answer is.
 *
 *   paper  FFFFFF   page
 *   mist   F4F8F5   panel
 *   line   DCE8E0   hairline
 *   ink    12211A   body text
 *   deep   1B4332   headings
 *   acc    1E8E4E   the accent — our system
 *   sage   A3B18A   secondary
 *   clay   B4491F   the problem
 *   amber  A66A00   caution
 *   night  14382A   dark slide background
 */

const PAPER = 'FFFFFF';
const MIST = 'F4F8F5';
const MIST2 = 'EAF4EE';
const LINE = 'DCE8E0';
const INK = '12211A';
const DEEP = '1B4332';
const ACC = '1E8E4E';
const SAGE = 'A3B18A';
const CLAY = 'B4491F';
const CLAYBG = 'FBF0EA';
const AMBER = 'A66A00';
const NIGHT = '14382A';
const NIGHT2 = '1C4B38';
const CREAM = 'EAF3EC';

const FONT = 'Arial';
const W = 10;
const H = 5.625;
const M = 0.55;

function pageNum(slide, n, onDark) {
  slide.addShape('ellipse', {
    x: 9.28, y: 5.12, w: 0.34, h: 0.34,
    fill: { color: onDark ? SAGE : DEEP },
    line: { color: onDark ? SAGE : DEEP, width: 0.5 },
  });
  slide.addText(String(n), {
    x: 9.28, y: 5.12, w: 0.34, h: 0.34,
    fontSize: 9.5, bold: true, align: 'center', valign: 'middle',
    color: onDark ? NIGHT : CREAM, fontFace: FONT, margin: 0,
  });
}

/** Light-slide header: small kicker over a bold title. */
function head(slide, kicker, title, opts = {}) {
  const onDark = !!opts.onDark;
  slide.addText(kicker.toUpperCase(), {
    x: M, y: 0.3, w: 8.5, h: 0.22,
    fontSize: 9, bold: true, charSpacing: 1.5,
    color: onDark ? SAGE : ACC, fontFace: FONT, margin: 0,
  });
  slide.addText(title, {
    x: M, y: 0.54, w: opts.w ?? 8.5, h: 0.5,
    fontSize: opts.size ?? 23, bold: true,
    color: onDark ? CREAM : DEEP, fontFace: FONT, margin: 0, valign: 'top',
  });
}

/** A rounded panel. */
function panel(slide, x, y, w, h, opts = {}) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.06,
    fill: { color: opts.fill ?? PAPER },
    line: { color: opts.line ?? LINE, width: opts.lineWidth ?? 0.75 },
    shadow: opts.shadow === false ? undefined
      : { type: 'outer', color: '1B4332', opacity: 0.1, blur: 5, offset: 1, angle: 90 },
  });
}

/** A flat panel with no shadow and a left accent bar. */
function barPanel(slide, x, y, w, h, barColor, opts = {}) {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: opts.fill ?? MIST },
    line: { color: opts.line ?? LINE, width: 0.75 },
  });
  slide.addShape('rect', {
    x, y, w: 0.055, h,
    fill: { color: barColor }, line: { color: barColor, width: 0.25 },
  });
}

/** A big-number statistic block. */
function stat(slide, x, y, w, value, label, opts = {}) {
  const c = opts.color ?? DEEP;
  slide.addText(value, {
    x, y, w, h: opts.vh ?? 0.62,
    fontSize: opts.vsize ?? 34, bold: true, color: c,
    fontFace: FONT, margin: 0, valign: 'middle', align: opts.align ?? 'left',
  });
  slide.addText(label, {
    x, y: y + (opts.vh ?? 0.62), w, h: opts.lh ?? 0.5,
    fontSize: opts.lsize ?? 9.5, color: opts.lcolor ?? '48654F',
    fontFace: FONT, margin: 0, valign: 'top', align: opts.align ?? 'left',
  });
}

/** A small uppercase label. */
function label(slide, x, y, w, text, color) {
  slide.addText(text.toUpperCase(), {
    x, y, w, h: 0.2,
    fontSize: 8, bold: true, charSpacing: 1.2,
    color: color ?? ACC, fontFace: FONT, margin: 0,
  });
}

/**
 * Convert inline markup into a PptxGenJS rich-text run array.
 *
 * This build of pptxgenjs does NOT parse <b> / <i> inside a plain string —
 * it renders them literally. So every string that carries markup is run
 * through here first: <b>..</b> becomes a bold run, <i>..</i> an italic one,
 * and <span class="mono">..</span> a monospaced one.
 */
function rich(text) {
  const lines = String(text).split('\n');
  const out = [];
  lines.forEach((line, li) => {
    const TAG = /<(b|i|em)>([\s\S]*?)<\/\1>|<span class="mono">([\s\S]*?)<\/span>/g;
    const runs = [];
    let last = 0;
    let m;
    const push = (txt, opt) => {
      if (txt !== '') runs.push({ text: txt, options: Object.assign({ breakLine: false }, opt || {}) });
    };
    while ((m = TAG.exec(line)) !== null) {
      push(line.slice(last, m.index), {});
      if (m[1] === 'b') push(m[2], { bold: true });
      else if (m[1] === 'i' || m[1] === 'em') push(m[2], { italic: true });
      else push(m[3], { fontFace: 'Consolas' });
      last = TAG.lastIndex;
    }
    push(line.slice(last), {});
    if (!runs.length) runs.push({ text: '', options: { breakLine: false } });
    const isLastLine = li === lines.length - 1;
    runs[runs.length - 1].options.breakLine = !isLastLine;
    out.push.apply(out, runs);
  });
  return out;
}

/** Body paragraph. */
function para(slide, x, y, w, h, text, opts = {}) {
  slide.addText(rich(text), {
    x, y, w, h,
    fontSize: opts.size ?? 10.5, color: opts.color ?? INK,
    fontFace: FONT, margin: 0, valign: 'top', lineSpacingMultiple: opts.ls ?? 1.05,
    align: opts.align ?? 'left', bold: opts.bold, italic: opts.italic,
  });
}

/** Bullet list rendered as separate paragraphs so spacing stays predictable. */
function bullets(slide, x, y, w, items, opts = {}) {
  const size = opts.size ?? 10;
  const gap = opts.gap ?? 0.3;
  let cy = y;
  items.forEach((it, i) => {
    const bold = typeof it === 'object' ? it.b : null;
    const text = typeof it === 'object' ? it.t : it;
    const col = (typeof it === 'object' && it.c) ? it.c : (opts.color ?? INK);
    slide.addShape('ellipse', {
      x, y: cy + 0.055, w: 0.07, h: 0.07,
      fill: { color: opts.dot ?? ACC }, line: { color: opts.dot ?? ACC, width: 0.25 },
    });
    slide.addText(rich(text), {
      x: x + 0.16, y: cy - 0.03, w: w - 0.16, h: gap,
      fontSize: size, color: col, fontFace: FONT, margin: 0, valign: 'top',
      lineSpacingMultiple: 1.02,
    });
    cy += gap;
  });
  return cy;
}

/** A pill / tag. */
function pill(slide, x, y, w, text, opts = {}) {
  const h = opts.h ?? 0.24;
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: h / 2,
    fill: { color: opts.fill ?? ACC }, line: { color: opts.fill ?? ACC, width: 0.5 },
  });
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.fontSize ?? 8, bold: true, align: 'center', valign: 'middle',
    color: opts.color ?? CREAM, fontFace: FONT, margin: 0, charSpacing: 0.6,
  });
}

/** Numbered circle. */
function numDot(slide, x, y, n, opts = {}) {
  const d = opts.d ?? 0.32;
  slide.addShape('ellipse', {
    x, y, w: d, h: d,
    fill: { color: opts.fill ?? ACC }, line: { color: opts.fill ?? ACC, width: 0.5 },
  });
  slide.addText(String(n), {
    x, y, w: d, h: d,
    fontSize: opts.fs ?? 10, bold: true, align: 'center', valign: 'middle',
    color: opts.color ?? CREAM, fontFace: FONT, margin: 0,
  });
}

/** Chevron between flow steps. */
function chevron(slide, x, y, color) {
  slide.addShape('rightArrow', {
    x, y, w: 0.26, h: 0.15,
    fill: { color: color ?? SAGE }, line: { color: color ?? SAGE, width: 0.5 },
  });
}

/** Small source note at the foot of a slide. */
function source(slide, text, onDark) {
  slide.addText(text, {
    x: M, y: 5.2, w: 8.3, h: 0.22,
    fontSize: 7.2, color: onDark ? SAGE : '8A9C92', fontFace: FONT, margin: 0, valign: 'middle',
  });
}

/** The GreenToken tree mark, drawn from primitives (no emoji). */
function treeMark(slide, x, y, size, opts = {}) {
  const canopy = opts.canopy ?? SAGE;
  const trunk = opts.trunk ?? DEEP;
  slide.addShape('rect', {
    x: x + size / 2 - size * 0.055, y: y + size * 0.7, w: size * 0.11, h: size * 0.3,
    fill: { color: trunk }, line: { color: trunk, width: 0.5 },
  });
  slide.addShape('ellipse', {
    x: x + size * 0.26, y: y + size * 0.02, w: size * 0.48, h: size * 0.42,
    fill: { color: canopy }, line: { color: canopy, width: 0.5 },
  });
  slide.addShape('ellipse', {
    x: x + size * 0.04, y: y + size * 0.2, w: size * 0.46, h: size * 0.4,
    fill: { color: canopy }, line: { color: canopy, width: 0.5 },
  });
  slide.addShape('ellipse', {
    x: x + size * 0.5, y: y + size * 0.2, w: size * 0.46, h: size * 0.4,
    fill: { color: canopy }, line: { color: canopy, width: 0.5 },
  });
}

/** A full-bleed dark act divider. */
function actBreak(slide, part, title, sub, n) {
  slide.background = { color: NIGHT };
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.06, fill: { color: ACC }, line: { color: ACC, width: 0 },
  });
  slide.addText(part.toUpperCase(), {
    x: M, y: 1.5, w: 8, h: 0.3,
    fontSize: 11, bold: true, charSpacing: 2.4, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText(title, {
    x: M, y: 1.9, w: 8.6, h: 1.0,
    fontSize: 32, bold: true, color: CREAM, fontFace: FONT, margin: 0, valign: 'top',
  });
  slide.addText(sub, {
    x: M, y: 3.0, w: 7.6, h: 0.9,
    fontSize: 13, color: SAGE, fontFace: FONT, margin: 0, valign: 'top', lineSpacingMultiple: 1.12,
  });
  treeMark(slide, 8.4, 3.3, 1.0, { canopy: ACC, trunk: SAGE });
  pageNum(slide, n, true);
}

/** A chart styled to match the deck. */
function chartOpts(pres, extra = {}) {
  return Object.assign({
    chartColors: [ACC],
    showLegend: false,
    showTitle: false,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    catAxisLabelColor: '48654F',
    valAxisLabelColor: '48654F',
    catAxisLabelFontFace: FONT,
    valAxisLabelFontFace: FONT,
    border: { pt: 0, color: PAPER },
    plotArea: { fill: { color: PAPER } },
    chartArea: { fill: { color: PAPER } },
    catGridLine: { style: 'none' },
    valGridLine: { color: LINE, style: 'solid', size: 0.5 },
  }, extra);
}

module.exports = {
  PAPER, MIST, MIST2, LINE, INK, DEEP, ACC, SAGE, CLAY, CLAYBG, AMBER,
  NIGHT, NIGHT2, CREAM,
  FONT, W, H, M,
  pageNum, head, panel, barPanel, stat, label, para, bullets, pill, numDot, rich,
  chevron, source, treeMark, actBreak, chartOpts,
};
