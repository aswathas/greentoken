const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, pill } = require('./_common');

/** Slide 9 — Smart contract design */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'The smart contract', 'Assets, functions and events');

  const cols = [
    {
      x: M, title: 'STATE (composite keys)',
      items: [
        'token:GT-000001',
        'token~idx:GT-000001',
        'idx:status:VERIFIED:…',
        'idx:district:Mandya:…',
        'idx:species:Mango:…',
        'idx:planter:p-lakshmi:…',
        'invoice:INV-2026-00001',
        'meta:tokenSeq',
      ],
      note: 'The world state is indexed, so "all verified mangoes in Mandya" is a range scan, not a full table walk.',
    },
    {
      x: 3.52, title: 'FUNCTIONS',
      items: [
        'PlantTree(input)        → write',
        'VerifyPlanting(input)   → write',
        'FundTokens(input)       → write',
        'SettleFunding(id)       → write',
        'GetToken(id)            → read',
        'SearchTokens(filter)    → read',
        'GetLeaderboard()        → read',
        'GetStats() / GetInvoice() → read',
      ],
      note: 'Writes emit events. Reads never touch the ledger — GetAllInvoices() is exported too.',
    },
    {
      x: 6.49, title: 'EVENTS',
      items: [
        'PlantTree',
        'VerifyPlanting',
        'FundTokens',
        'SettleFunding',
      ],
      note: 'The dashboard feed and the SSE stream both consume these events — the same mechanism Fabric uses.',
    },
  ];

  cols.forEach((c) => {
    panel(slide, c.x, 1.28, 2.96, 2.72, { fill: WHITE, line: SAGE });
    slide.addShape('rect', { x: c.x, y: 1.28, w: 2.96, h: 0.06, fill: { color: DEEP }, line: { color: DEEP, width: 0 } });
    slide.addText(c.title, {
      x: c.x + 0.14, y: 1.42, w: 2.7, h: 0.22,
      fontSize: 8.5, bold: true, charSpacing: 1.1, color: MID, fontFace: FONT, margin: 0,
    });
    c.items.forEach((it, i) => {
      if (!it) return;
      slide.addText(it, {
        x: c.x + 0.14, y: 1.68 + i * 0.235, w: 2.72, h: 0.22,
        fontSize: 7.8, color: theme.primary, fontFace: 'Consolas', margin: 0,
      });
    });
    slide.addText(c.note, {
      x: c.x + 0.14, y: 3.52, w: 2.7, h: 0.42,
      fontSize: 8, italic: true, color: MID, fontFace: FONT, margin: 0,
    });
  });

  // Guardrails
  panel(slide, M, 4.18, 8.9, 0.78, { fill: DEEP, line: DEEP });
  slide.addText('GUARDRAILS BUILT INTO THE CONTRACT', {
    x: M + 0.2, y: 4.28, w: 4.2, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.1, color: SAGE, fontFace: FONT, margin: 0,
  });
  const guards = [
    'Unknown species rejected',
    'Only VERIFIED tokens are fundable',
    'One endorsement per reviewer',
    'Failed tx is discarded, never written',
  ];
  guards.forEach((g, i) => {
    const x = M + 0.2 + i * 2.18;
    // evenly spaced guardrail captions
    slide.addShape('ellipse', { x, y: 4.58, w: 0.1, h: 0.1, fill: { color: SAGE }, line: { color: SAGE, width: 0 } });
    slide.addText(g, { x: x + 0.16, y: 4.52, w: 2.0, h: 0.28, fontSize: 8.5, color: CREAM, fontFace: FONT, margin: 0 });
  });

  footer(slide, 'All four write paths funnel through chaincode.ts — the UI cannot write state directly.');
  pageNum(slide, 9);
  return slide;
}

module.exports = { createSlide };
