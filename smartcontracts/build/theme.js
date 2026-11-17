/**
 * theme.js — the design system for "A Promise That Keeps Itself".
 *
 * One type system (Arial + Consolas), one palette (forest / moss / mint /
 * amber / clay on paper, deep forest-black for the dark slides), one motif:
 * a chain of three blocks (the ledger) that repeats in the corner of every
 * content slide and appears literally in the hash-chain diagram.
 */

const C = {
  ink: '14201A',
  dark: '0E1512',
  darkPanel: '1A2721',
  paper: 'FFFFFF',
  forest: '1F3D2B',
  moss: '2E7D4F',
  mint: '9FD9B4',
  amber: 'D9A441',
  clay: 'C8553D',
  muted: '5C6B63',
  line: 'D9E0DA',
  panel: 'F2F5F2',
  white: 'FFFFFF',
};

const F = { display: 'Arial', body: 'Arial', mono: 'Consolas' };
const W = 13.333;
const H = 7.5;
const M = 0.75;

/** Full-bleed ground + the three-block motif. */
function ground(pres, slide, dark) {
  slide.background = { color: dark ? C.dark : C.paper };
  const y = 0.5;
  const x = W - M - 1.02;
  const s = 0.2;
  const g = 0.08;
  const cols = dark ? [C.moss, C.moss, '26362D'] : [C.moss, C.moss, C.line];
  for (let i = 0; i < 3; i += 1) {
    slide.addShape(pres.ShapeType.rect, {
      x: x + i * (s + g), y, w: s, h: s,
      fill: { color: cols[i] }, line: { color: cols[i], width: 0.5 },
    });
  }
}

/**
 * Slide head. Returns the y where content may start.
 * kicker = the small line above the title (the act, or the callback line).
 */
function head(slide, opts) {
  const dark = Boolean(opts.dark);
  const ink = dark ? C.white : C.ink;
  if (opts.kicker) {
    slide.addText(opts.kicker.toUpperCase(), {
      x: M, y: 0.48, w: W - 2 * M - 1.2, h: 0.28, margin: 0,
      fontFace: F.body, fontSize: 10.5, bold: true, charSpacing: 2.2,
      color: dark ? C.mint : C.moss, valign: 'middle',
    });
  }
  slide.addText(opts.title, {
    x: M, y: opts.kicker ? 0.8 : 0.55, w: W - 2 * M - 1.2, h: 0.78, margin: 0,
    fontFace: F.display, fontSize: opts.size || 29, bold: true, color: ink,
    valign: 'middle', lineSpacing: opts.size || 29,
  });
  let y = (opts.kicker ? 1.72 : 1.45);
  if (opts.deck) {
    slide.addText(opts.deck, {
      x: M, y, w: W - 2 * M - 1.2, h: 0.5, margin: 0,
      fontFace: F.body, fontSize: 13.5, color: dark ? 'BFD0C6' : C.muted,
      valign: 'top', lineSpacing: 19,
    });
    y += 0.42 + (opts.deckLines ? 0.24 * (opts.deckLines - 1) : 0);
  }
  return y;
}

/** Footer: source note bottom-left, page number bottom-right. */
function foot(slide, opts) {
  const dark = Boolean(opts.dark);
  if (opts.source) {
    slide.addText(opts.source, {
      x: M, y: H - 0.52, w: W - 2 * M - 1.0, h: 0.3, margin: 0,
      fontFace: F.body, fontSize: 8.5, color: dark ? '8FA79A' : C.muted,
      valign: 'middle',
    });
  }
  if (opts.page) {
    slide.addText(String(opts.page), {
      x: W - M - 0.6, y: H - 0.52, w: 0.6, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 9, color: dark ? '6E8677' : C.muted, align: 'right', valign: 'middle',
    });
  }
}

/** Rounded panel. */
function panel(pres, slide, o) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fill: { color: o.fill || C.panel },
    line: { color: o.border || C.line, width: o.borderWidth === undefined ? 1 : o.borderWidth },
    rectRadius: o.radius === undefined ? 0.08 : o.radius,
    shadow: o.shadow
      ? { type: 'outer', color: '000000', blur: 2, offset: 1, angle: 90, opacity: 0.12 }
      : undefined,
  });
}

/** Big-number stat card. */
function stat(pres, slide, o) {
  const dark = Boolean(o.dark);
  panel(pres, slide, {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fill: o.fill || (dark ? C.darkPanel : C.panel),
    border: o.border || (dark ? '2B3D33' : C.line),
  });
  slide.addText(o.value, {
    x: o.x + 0.22, y: o.y + 0.14, w: o.w - 0.44, h: o.vh || 0.86, margin: 0,
    fontFace: F.display, fontSize: o.vsize || 38, bold: true,
    color: o.accent || (dark ? C.mint : C.forest), valign: 'bottom',
  });
  slide.addText(o.label, {
    x: o.x + 0.22, y: o.y + (o.vh || 0.86) + 0.14, w: o.w - 0.44, h: o.lh || 0.62, margin: 0,
    fontFace: F.body, fontSize: o.lsize || 11, color: dark ? 'C7D6CD' : C.ink,
    valign: 'top', lineSpacing: o.lsize || 11 + 3,
  });
  if (o.sub) {
    slide.addText(o.sub, {
      x: o.x + 0.22, y: o.y + o.h - 0.42, w: o.w - 0.44, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 8.5, color: dark ? '8FA79A' : C.muted, valign: 'middle',
    });
  }
}

/** Small rounded chip / pill. */
function chip(pres, slide, o) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h || 0.34,
    fill: { color: o.fill }, line: { color: o.border || o.fill, width: 1 },
    rectRadius: 0.16,
  });
  slide.addText(o.text, {
    x: o.x, y: o.y, w: o.w, h: o.h || 0.34, margin: 0,
    fontFace: F.body, fontSize: o.size || 10, bold: o.bold !== false,
    color: o.color || C.white, align: 'center', valign: 'middle',
  });
}

/** Straight arrow between boxes. */
function arrow(pres, slide, o) {
  slide.addShape(pres.ShapeType.line, {
    x: o.x, y: o.y, w: o.w, h: o.h || 0,
    line: { color: o.color || C.moss, width: o.width || 2, endArrowType: 'triangle' },
  });
}

/** Bulleted list block. */
function bullets(slide, items, o) {
  const runs = items.map((t, i) => ({
    text: t,
    options: { bullet: { code: '2022' }, breakLine: i < items.length - 1, paraSpaceAfter: o.gap || 6 },
  }));
  slide.addText(runs, {
    x: o.x, y: o.y, w: o.w, h: o.h, margin: 0,
    fontFace: F.body, fontSize: o.size || 12.5, color: o.color || C.ink,
    valign: 'top', lineSpacing: o.size || 12.5 + 4,
  });
}

/** Simple bordered table. rows = array of arrays of {text} or strings. */
function table(slide, rows, o) {
  const body = rows.map((r, ri) => r.map((c, ci) => {
    const cell = typeof c === 'string' ? { text: c } : c;
    const opt = Object.assign({}, cell.options || {});
    if (ri === 0 && o.headFill) opt.fill = o.headFill;
    else if (o.rowFills && o.rowFills[ri]) opt.fill = o.rowFills[ri];
    if (ri === 0) { opt.bold = true; opt.color = o.headColor || C.white; }
    opt.fontSize = opt.fontSize || o.size || 11;
    opt.fontFace = opt.fontFace || F.body;
    opt.valign = opt.valign || 'middle';
    opt.margin = opt.margin === undefined ? 6 : opt.margin;
    return { text: cell.text, options: opt };
  }));
  slide.addTable(body, {
    x: o.x, y: o.y, w: o.w,
    colW: o.colW, rowH: o.rowH,
    border: o.border || { type: 'solid', color: C.line, pt: 1 },
    fill: o.fill || C.white,
    autoPage: false,
  });
}

module.exports = { C, F, W, H, M, ground, head, foot, panel, stat, chip, arrow, bullets, table };
