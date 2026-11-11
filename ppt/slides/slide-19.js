const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 19 — Limitations and future scope */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Honest limitations', 'What is modelled, and what is not');

  const cols = [
    {
      x: M, title: 'LIMITATIONS TODAY', accent: 'B23A3A',
      items: [
        'Private data is emulated — the planter\u2019s contact is never written to shared state, but the Fabric build should use a real private data collection.',
        'GPS is trusted on submission and the accuracy radius is recorded but not thresholded; production needs device attestation.',
        'CO₂ rates are a static species table, not a measured sequestration model.',
        'No on-chain governance yet — the consortium rules are code, not votes.',
      ],
    },
    {
      x: 3.52, title: 'FUTURE SCOPE', accent: DEEP,
      items: [
        'Land records module on the same channel — property transfers and encumbrances between government entities.',
        'PDS-style entitlement accounting and subsidy disbursement.',
        'On-chain governance: changing the quorum or the discount ladder by token-holder vote.',
        'An oracle-sourced carbon price instead of the contract\u2019s fixed ₹150 per tree.',
      ],
    },
    {
      x: 6.49, title: 'IF MORE TIME', accent: DARKEST,
      items: [
        'Settlement derives each planter\u2019s share from the invoice — the actual bank transfer is not implemented.',
        'Fabric Gateway client so the same UI talks to a real Fabric network.',
        'Hyperledger Aries / BBS+ for selective-disclosure credentials.',
        'Caliper benchmarks for throughput and latency.',
      ],
    },
  ];

  cols.forEach((c) => {
    panel(slide, c.x, 1.28, 2.96, 3.5, { fill: WHITE, line: SAGE });
    slide.addShape('rect', { x: c.x, y: 1.28, w: 2.96, h: 0.06, fill: { color: c.accent }, line: { color: c.accent, width: 0 } });
    slide.addText(c.title, {
      x: c.x + 0.16, y: 1.44, w: 2.66, h: 0.24,
      fontSize: 8.5, bold: true, charSpacing: 1.1, color: c.accent, fontFace: FONT, margin: 0,
    });
    c.items.forEach((it, i) => {
      const y = 1.78 + i * 0.73;
      slide.addShape('ellipse', { x: c.x + 0.18, y: y + 0.04, w: 0.09, h: 0.09, fill: { color: c.accent }, line: { color: c.accent, width: 0 } });
      slide.addText(it, {
        x: c.x + 0.36, y: y - 0.03, w: 2.46, h: 0.68,
        fontSize: 8.5, color: theme.primary, fontFace: FONT, margin: 0,
      });
    });
  });

  footer(slide, 'Every limitation listed here is a deliberate, stated scope decision — not an accident.');
  pageNum(slide, 19);
  return slide;
}

module.exports = { createSlide };
