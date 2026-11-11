const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 5 — Solution overview: three pillars */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'The solution', 'GreenToken in one slide');

  const pillars = [
    {
      n: '01', title: 'Proof',
      sub: 'The evidence is hashed before it is claimed',
      points: [
        'Photo bytes → SHA-256, written to the ledger',
        'GPS lat/lng → geo-hash, bound to the photo',
        'Accuracy radius recorded and shown to reviewers',
        'Same photo cannot back two tokens',
      ],
    },
    {
      n: '02', title: 'Trust',
      sub: 'No single organisation can mint a token',
      points: [
        'Two independent endorsements required',
        'Forest Dept and Independent Auditor sign separately',
        'Role enforced by MSP attributes inside the contract',
        'Planter contact never written to shared state',
      ],
    },
    {
      n: '03', title: 'Money',
      sub: 'Funding becomes a ledger transaction, not a spreadsheet',
      points: [
        'Funders browse real plantings on a map',
        'One invoice per basket, bulk discount applied',
        'Settlement records the release on chain',
        'Leaderboard derived from ledger state only',
      ],
    },
  ];

  pillars.forEach((p, i) => {
    const x = M + i * 3.0;
    panel(slide, x, 1.3, 2.86, 3.42, { fill: WHITE, line: SAGE });
    slide.addShape('rect', { x, y: 1.3, w: 2.86, h: 0.07, fill: { color: DEEP }, line: { color: DEEP, width: 0 } });

    slide.addShape('ellipse', {
      x: x + 0.18, y: 1.5, w: 0.46, h: 0.46,
      fill: { color: DEEP }, line: { color: DEEP, width: 0.5 },
    });
    slide.addText(p.n, {
      x: x + 0.18, y: 1.5, w: 0.46, h: 0.46,
      fontSize: 13, bold: true, color: CREAM, align: 'center', valign: 'middle', fontFace: FONT, margin: 0,
    });

    slide.addText(p.title, {
      x: x + 0.76, y: 1.56, w: 1.9, h: 0.36,
      fontSize: 20, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(p.sub, {
      x: x + 0.18, y: 2.16, w: 2.5, h: 0.42,
      fontSize: 9.5, italic: true, color: MID, fontFace: FONT, margin: 0,
    });
    slide.addShape('line', { x: x + 0.18, y: 2.62, w: 2.5, h: 0, line: { color: SAGE, width: 0.75 } });

    p.points.forEach((pt, j) => {
      const y = 2.74 + j * 0.46;
      slide.addShape('ellipse', { x: x + 0.2, y: y + 0.05, w: 0.1, h: 0.1, fill: { color: MID }, line: { color: MID, width: 0 } });
      slide.addText(pt, {
        x: x + 0.4, y: y - 0.03, w: 2.32, h: 0.44,
        fontSize: 9.5, color: theme.primary, fontFace: FONT, margin: 0,
      });
    });
  });

  slide.addText('One token  =  one verified planting batch  ·  every tree in it is one transferable credit unit', {
    x: M, y: 4.8, w: 8.9, h: 0.3,
    fontSize: 12, bold: true, color: DEEP, fontFace: FONT, margin: 0, align: 'center',
  });

  footer(slide, 'A token is only mintable after two independent endorsements — the quorum is enforced in the smart contract.');
  pageNum(slide, 5);
  return slide;
}

module.exports = { createSlide };
