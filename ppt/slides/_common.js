/**
 * Shared helpers for the GreenToken deck.
 *
 * Palette — "Forest & Eco" (design-system #11), light mode:
 *   dad7cd  cream   · a3b18a sage · 588157 mid green
 *   3a5a40  deep    · 344e41 darkest
 */
const SAGE = 'A3B18A';
const MID = '588157';
const DEEP = '3A5A40';
const DARKEST = '344E41';
const CREAM = 'DAD7CD';
const WHITE = 'FFFFFF';

const FONT = 'Arial';
const W = 10;
const H = 5.625;
const M = 0.55;

/** Page-number badge, required on every non-cover slide. */
function pageNum(slide, n, onDark = false) {
  slide.addShape('ellipse', {
    x: 9.3, y: 5.1, w: 0.36, h: 0.36,
    fill: { color: onDark ? CREAM : DEEP },
    line: { color: onDark ? CREAM : DEEP, width: 0.5 },
  });
  slide.addText(String(n), {
    x: 9.3, y: 5.1, w: 0.36, h: 0.36,
    fontSize: 10, bold: true, align: 'center', valign: 'middle',
    color: onDark ? DARKEST : CREAM, fontFace: FONT, margin: 0,
  });
}

/** Kicker + title block on a light slide. */
function heading(slide, theme, kicker, title) {
  slide.addText(kicker.toUpperCase(), {
    x: M, y: 0.34, w: 8.6, h: 0.24,
    fontSize: 9.5, bold: true, charSpacing: 1.6,
    color: MID, fontFace: FONT, margin: 0,
  });
  slide.addText(title, {
    x: M, y: 0.6, w: 8.6, h: 0.56,
    fontSize: 24, bold: true, color: theme.primary,
    fontFace: FONT, margin: 0, valign: 'top',
  });
}

/** Kicker + title block on a dark slide. */
function headingDark(slide, theme, kicker, title) {
  slide.addText(kicker.toUpperCase(), {
    x: M, y: 0.34, w: 8.6, h: 0.24,
    fontSize: 9.5, bold: true, charSpacing: 1.6,
    color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText(title, {
    x: M, y: 0.6, w: 8.6, h: 0.56,
    fontSize: 24, bold: true, color: CREAM,
    fontFace: FONT, margin: 0, valign: 'top',
  });
}

/**
 * A stylised tree drawn from vector shapes.
 * Emoji glyphs render inconsistently across PowerPoint / LibreOffice / Google
 * Slides, so the mark is built from primitives instead.
 */
function treeMark(slide, x, y, size, opts = {}) {
  const canopy = opts.canopy ?? SAGE;
  const trunk = opts.trunk ?? DEEP;
  const tW = size * 0.11;
  const tH = size * 0.3;

  // trunk
  slide.addShape('rect', {
    x: x + size / 2 - tW / 2, y: y + size - tH, w: tW, h: tH,
    fill: { color: trunk }, line: { color: trunk, width: 0.5 },
  });
  // canopy — three overlapping circles read as foliage
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

/** Rounded panel used for cards across the deck. */
function panel(slide, x, y, w, h, opts = {}) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.07,
    fill: { color: opts.fill ?? WHITE },
    line: { color: opts.line ?? SAGE, width: opts.lineWidth ?? 0.75 },
    shadow: opts.shadow === false
      ? undefined
      : { type: 'outer', color: '344E41', opacity: 0.12, blur: 6, offset: 1, angle: 90 },
  });
}

/** Small pill / tag. */
function pill(slide, x, y, w, text, opts = {}) {
  slide.addShape('roundRect', {
    x, y, w, h: opts.h ?? 0.26,
    rectRadius: 0.13,
    fill: { color: opts.fill ?? DEEP },
    line: { color: opts.fill ?? DEEP, width: 0.5 },
  });
  slide.addText(text, {
    x, y, w, h: opts.h ?? 0.26,
    fontSize: opts.fontSize ?? 9, bold: true, align: 'center', valign: 'middle',
    color: opts.color ?? CREAM, fontFace: FONT, margin: 0, charSpacing: opts.charSpacing ?? 0.4,
  });
}

/** Footer note on every slide. */
function footer(slide, text, onDark = false) {
  slide.addText(text, {
    x: M, y: 5.14, w: 7.4, h: 0.26,
    fontSize: 8.5, color: onDark ? SAGE : MID,
    fontFace: FONT, margin: 0, valign: 'middle',
  });
}

/** Numbered circle used in flows and steps. */
function numDot(slide, x, y, n, opts = {}) {
  slide.addShape('ellipse', {
    x, y, w: 0.34, h: 0.34,
    fill: { color: opts.fill ?? DEEP },
    line: { color: opts.fill ?? DEEP, width: 0.5 },
  });
  slide.addText(String(n), {
    x, y, w: 0.34, h: 0.34,
    fontSize: 11, bold: true, align: 'center', valign: 'middle',
    color: opts.color ?? CREAM, fontFace: FONT, margin: 0,
  });
}

/** Chevron arrow between flow steps. */
function arrow(slide, x, y, w = 0.3, color = MID) {
  slide.addShape('rightArrow', {
    x, y, w, h: 0.16,
    fill: { color }, line: { color, width: 0.5 },
  });
}

module.exports = {
  SAGE, MID, DEEP, DARKEST, CREAM, WHITE,
  FONT, W, H, M,
  pageNum, heading, headingDark, panel, pill, footer, numDot, arrow, treeMark,
};
