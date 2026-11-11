const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 11 — Roles, access control and privacy */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Privacy & access control', 'Who may do what — enforced in the contract');

  // Role matrix
  const x0 = M;
  const colW = [2.1, 1.5, 1.5, 1.5, 1.5, 0.8];
  const headH = 0.38;
  const rowH = 0.38;
  const y0 = 1.26;

  const headers = ['MSP / role', 'Plant', 'Verify', 'Fund', 'Settle', 'Read'];
  headers.forEach((t, i) => {
    const x = x0 + colW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: y0, w: colW[i], h: headH, fill: { color: DEEP }, line: { color: CREAM, width: 0.75 } });
    slide.addText(t, {
      x: x + 0.08, y: y0, w: colW[i] - 0.16, h: headH,
      fontSize: 9.5, bold: true, color: CREAM, align: i === 0 ? 'left' : 'center',
      fontFace: FONT, margin: 0, valign: 'middle',
    });
  });

  const roles = [
    ['PlantersAssociationMSP', '●', '', '', '', '●'],
    ['ForestDeptMSP', '', '●', '', '', '●'],
    ['AuditorMSP', '', '●', '', '●', '●'],
    ['CorporateFundersMSP', '', '', '●', '●', '●'],
  ];
  roles.forEach((r, ri) => {
    const y = y0 + headH + ri * rowH;
    r.forEach((cell, ci) => {
      const x = x0 + colW.slice(0, ci).reduce((a, b) => a + b, 0);
      slide.addShape('rect', {
        x, y, w: colW[ci], h: rowH,
        fill: { color: ri % 2 ? CREAM : WHITE },
        line: { color: SAGE, width: 0.5 },
      });
      slide.addText(cell, {
        x: x + 0.08, y, w: colW[ci] - 0.16, h: rowH,
        fontSize: ci === 0 ? 8.5 : 12,
        bold: ci === 0,
        color: ci === 0 ? theme.primary : cell === '●' ? DEEP : 'C9C9C9',
        align: ci === 0 ? 'left' : 'center',
        fontFace: FONT, margin: 0, valign: 'middle',
      });
    });
  });

  slide.addText('● permitted    —  read models are open by design, so any participant can verify a token. Only writes are role-gated.', {
    x: M, y: 3.26, w: 8.9, h: 0.24,
    fontSize: 8.5, italic: true, color: MID, fontFace: FONT, margin: 0,
  });

  // Privacy cards
  const cards = [
    ['Contact details stay private', 'The planter’s phone number is never written to shared state — it is not part of the token, not returned by any read function, and not included in the transaction hash.'],
    ['Reads stay open, writes do not', 'A funder can read species, GPS, hashes and endorsements — that visibility is the point. Only writes are role-gated.'],
    ['One reviewer, one endorsement', 'The contract rejects a second endorsement from the same participant, so a single person cannot manufacture a quorum.'],
  ];
  cards.forEach((c, i) => {
    const x = M + i * 3.0;
    panel(slide, x, 3.6, 2.86, 1.4, { fill: WHITE, line: SAGE });
    slide.addText(c[0], {
      x: x + 0.16, y: 3.72, w: 2.56, h: 0.26,
      fontSize: 10.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(c[1], {
      x: x + 0.16, y: 4.0, w: 2.56, h: 0.9,
      fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
    });
  });

  footer(slide, 'Role checks read the caller’s MSP identity and attributes — the contract rejects the transaction, the UI merely hides the button.');
  pageNum(slide, 11);
  return slide;
}

module.exports = { createSlide };
