/**
 * spoken.js — the 13 spoken slides (exactly 10:00 of talk).
 * Every slide carries a visual and a real speaker note.
 */
const { C, F, W, H, M, ground, head, foot, panel, stat, chip, arrow, bullets, table } = require('./theme');

const VIDEO_FEATURE = 'https://www.youtube.com/watch?v=h3mRsvFmWi0';
const VIDEO_CLIP = 'https://www.youtube.com/watch?v=-DkCQKQPaWI';

function s01Cover(pres) {
  const s = pres.addSlide();
  ground(pres, s, true);

  s.addText('A PROMISE\nTHAT KEEPS ITSELF', {
    x: M, y: 1.85, w: 8.0, h: 2.1, margin: 0,
    fontFace: F.display, fontSize: 47, bold: true, color: C.white, lineSpacing: 50, valign: 'middle',
  });
  s.addText('Smart contracts, the carbon market, and how to live on Earth', {
    x: M, y: 4.05, w: 7.6, h: 0.4, margin: 0,
    fontFace: F.body, fontSize: 16, color: C.mint, valign: 'middle',
  });
  s.addText([
    { text: '21CSE435T · Smart Contracts and Application Development', options: { breakLine: true } },
    { text: 'Aswath AS · RA2311050010060 · Dr. S. Ganesh Kumar', options: { breakLine: true } },
    { text: 'greentoken-7gc.pages.dev', options: { fontFace: F.mono, fontSize: 10, color: '7FA98F' } },
  ], {
    x: M, y: 4.75, w: 7.6, h: 1.1, margin: 0,
    fontFace: F.body, fontSize: 12, color: 'BFD0C6', lineSpacing: 20,
  });

  // the ledger spine
  const bx = 9.15;
  const bw = 3.4;
  for (let i = 0; i < 4; i += 1) {
    const y = 1.95 + i * 1.06;
    panel(pres, s, { x: bx, y, w: bw, h: 0.86, fill: i === 3 ? C.forest : C.darkPanel, border: i === 3 ? C.moss : '2B3D33' });
    s.addText(`block ${String(i + 1).padStart(3, '0')}`, {
      x: bx + 0.18, y: y + 0.1, w: 1.2, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 9.5, color: i === 3 ? C.mint : '7FA98F', valign: 'middle',
    });
    s.addText(['prevHash  4c1f…a92e', 'txHash    77be…03d1', 'merkle     9f0c…6b48', 'sig       ecd:p256'][i], {
      x: bx + 0.18, y: y + 0.42, w: bw - 0.36, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 9.5, color: C.white, valign: 'middle',
    });
    if (i < 3) arrow(pres, s, { x: bx + bw / 2, y: y + 0.88, w: 0, h: 0.16, color: '4E6A59', width: 1.5 });
  }
  s.addText('one chain · nobody can quietly edit it', {
    x: bx, y: 6.25, w: bw, h: 0.3, margin: 0,
    fontFace: F.body, fontSize: 9.5, color: '7FA98F', align: 'center', valign: 'middle',
  });

  s.addNotes('Open on the title and say nothing for two seconds. Let the room read it.\n\n'
    + 'Hook line: "Everyone here has heard a promise that kept itself. Very few have heard one that had to."\n\n'
    + 'Do not introduce yourself yet. The story starts in the next slide.');
  return s;
}

function s02Video(pres) {
  const s = pres.addSlide();
  ground(pres, s, true);
  const y = head(s, { dark: true, kicker: 'Cold open · 40 seconds', title: 'The world’s greatest how-to.' });

  panel(pres, s, { x: M, y: y + 0.1, w: 7.1, h: 4.35, fill: C.darkPanel, border: '2B3D33' });
  s.addText('HOW TO LIVE ON EARTH', {
    x: M + 0.35, y: y + 0.42, w: 6.4, h: 0.55, margin: 0,
    fontFace: F.display, fontSize: 26, bold: true, color: C.white, valign: 'middle',
  });
  s.addText('A feature documentary · Open Planet Studios\nNarrated by Benedict Cumberbatch · 2026', {
    x: M + 0.35, y: y + 1.02, w: 6.4, h: 0.7, margin: 0,
    fontFace: F.body, fontSize: 12.5, color: '9FB4A7', lineSpacing: 18, valign: 'top',
  });

  // play button
  s.addShape(pres.ShapeType.triangle, {
    x: M + 0.38, y: y + 1.95, w: 0.62, h: 0.72, rotate: 90,
    fill: { color: C.moss }, line: { color: C.moss, width: 1 },
  });
  s.addText('CLICK TO PLAY', {
    x: M + 1.15, y: y + 1.95, w: 2.4, h: 0.72, margin: 0,
    fontFace: F.body, fontSize: 13, bold: true, color: C.mint, valign: 'middle',
    hyperlink: { url: VIDEO_CLIP },
  });
  s.addText('the official 54-second clip  ·  youtu.be/-DkCQKQPaWI', {
    x: M + 1.15, y: y + 2.6, w: 5.3, h: 0.28, margin: 0,
    fontFace: F.mono, fontSize: 9, color: '9FB4A7', valign: 'middle',
  });
  s.addText('Full 96-minute documentary', {
    x: M + 0.38, y: y + 3.22, w: 3.2, h: 0.32, margin: 0,
    fontFace: F.body, fontSize: 11, color: '9FB4A7', valign: 'middle',
    hyperlink: { url: VIDEO_FEATURE },
  });
  s.addText('youtu.be/h3mRsvFmWi0', {
    x: M + 0.38, y: y + 3.55, w: 3.2, h: 0.28, margin: 0,
    fontFace: F.mono, fontSize: 9, color: '9FB4A7', valign: 'middle',
  });
  s.addText('We link the film. We never copy a frame of it.', {
    x: M + 0.38, y: y + 3.92, w: 6.3, h: 0.3, margin: 0,
    fontFace: F.body, fontSize: 9.5, italic: true, color: '9FB4A7', valign: 'middle',
  });

  s.addText('Solutions exist.\nProof does not.', {
    x: 8.35, y: y + 0.35, w: 4.25, h: 1.6, margin: 0,
    fontFace: F.display, fontSize: 28, bold: true, color: C.mint, lineSpacing: 34, valign: 'middle',
  });
  s.addText('The film’s argument is that the answers are already here — and it is right. '
    + 'But a solution nobody can check is a story with good lighting.\n\n'
    + 'For ten minutes we are going to find one promise that is supposed to be checked, '
    + 'and find out whether it actually is.', {
    x: 8.35, y: y + 2.05, w: 4.25, h: 2.4, margin: 0,
    fontFace: F.body, fontSize: 12.5, color: 'C7D6CD', lineSpacing: 19, valign: 'top',
  });

  foot(s, { dark: true, source: 'Open Planet Studios · premiered on YouTube 20 September 2026 · UNDP Nature · the deck links the film, it does not host it' });
  s.addNotes('PRE-FLIGHT: the clip is already open in a second browser tab. Click PLAY here, or switch tabs — whichever is smoother in the room.\n\n'
    + 'Say while it plays (do not talk over the opening): "This is the world’s greatest how-to. Somebody finally made a film about how to live on Earth, and it is hopeful."\n\n'
    + 'Then, on the cut: "Solutions exist. Proof does not."\n\n'
    + 'If there is no network: read the two lines on the right instead of playing. The story survives.');
  return s;
}

function s03Emitters(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 1 · the world going bad',
    title: 'Thirty-two companies. Half the world’s CO₂.',
    deck: 'The emitters are few, named, and measurable — which is exactly why a rule about them can be checked.',
  });

  // 50/50 concentration bar
  const bw = W - 2 * M;
  s.addShape(pres.ShapeType.rect, { x: M, y: y + 0.12, w: bw / 2, h: 0.86, fill: { color: C.clay }, line: { color: C.clay, width: 1 } });
  s.addShape(pres.ShapeType.rect, { x: M + bw / 2, y: y + 0.12, w: bw / 2, h: 0.86, fill: { color: C.panel }, line: { color: C.line, width: 1 } });
  s.addText('32 fossil-fuel & cement producers', {
    x: M + 0.25, y: y + 0.12, w: bw / 2 - 0.5, h: 0.86, margin: 0,
    fontFace: F.display, fontSize: 17, bold: true, color: C.white, valign: 'middle',
  });
  s.addText('50% of global CO₂', {
    x: M + 0.25, y: y + 0.56, w: bw / 2 - 0.5, h: 0.34, margin: 0,
    fontFace: F.mono, fontSize: 11, color: 'F6DCD5', valign: 'middle',
  });
  s.addText('everyone else', {
    x: M + bw / 2 + 0.25, y: y + 0.12, w: bw / 2 - 0.5, h: 0.86, margin: 0,
    fontFace: F.display, fontSize: 17, bold: true, color: C.muted, valign: 'middle',
  });
  s.addText('the other 50%', {
    x: M + bw / 2 + 0.25, y: y + 0.56, w: bw / 2 - 0.5, h: 0.34, margin: 0,
    fontFace: F.mono, fontSize: 11, color: C.muted, valign: 'middle',
  });

  const cy = y + 1.28;
  stat(pres, s, {
    x: M, y: cy, w: 3.75, h: 2.1, value: '1.7 bn t', vsize: 34, vh: 0.78,
    label: 'Saudi Aramco’s CO₂ in 2024. Ranked as a country it would be the world’s fifth biggest emitter — behind Russia.',
    sub: 'largest single corporate emitter',
  });
  stat(pres, s, {
    x: M + 4.05, y: cy, w: 3.75, h: 2.1, value: '610 Mt', vsize: 34, vh: 0.78,
    label: 'ExxonMobil — the largest investor-owned emitter. Ranked as a country it would be ninth, ahead of South Korea.',
    sub: 'largest private emitter',
    accent: C.forest,
  });
  stat(pres, s, {
    x: M + 8.1, y: cy, w: 3.73, h: 2.1, value: '17 of 20', vsize: 34, vh: 0.78,
    label: 'of the top twenty emitters are state-controlled. Only Shell, Chevron and ExxonMobil are private.',
    sub: 'concentration is not accidental',
    accent: C.amber,
  });

  s.addText('Thirty-two companies. That is good news — a rule for thirty-two companies can be checked.', {
    x: M, y: cy + 2.3, w: bw, h: 0.42, margin: 0,
    fontFace: F.display, fontSize: 17, bold: true, color: C.forest, valign: 'middle',
  });

  foot(s, { page: 3, source: 'InfluenceMap Carbon Majors study, reported by The Guardian, 21 January 2026 · 2024 emissions' });
  s.addNotes('55 seconds. Do not read the cards. Say the headline, then the two numbers that make it human:\n\n'
    + '"Aramco alone put 1.7 billion tonnes into the air last year. Rank it as a country and it is the fifth biggest polluter on Earth."\n\n'
    + '"And of the top twenty, seventeen are state-controlled. We are not dealing with a diffuse problem."\n\n'
    + 'Land the turn: "Thirty-two companies. That is good news — a rule for thirty-two companies can be checked."\n\n'
    + 'Numbers: 32 = half of global CO₂ (InfluenceMap, Guardian 21 Jan 2026). Aramco 1.7 bn t = 5th as a country. Exxon 610 Mt = 9th. 17 of top 20 state-controlled.');
  return s;
}

function s04Escape(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 2 · the escape hatch',
    title: 'A credit is one tonne that somebody else removed.',
    deck: 'Companies that cannot cut first buy credits. In 2025 the voluntary market issued 294 Mt and retired 202 Mt.',
  });

  s.addChart(pres.ChartType.bar, [{ name: 'MtCO2e, 2025', labels: ['Credits issued', 'Credits retired'], values: [294, 202] }], {
    x: M - 0.1, y: y + 0.12, w: 5.5, h: 3.5,
    barDir: 'col', barGapWidthPct: 70, chartColors: [C.moss],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: C.ink,
    dataLabelFontSize: 15, dataLabelFontFace: F.body, dataLabelFontBold: true,
    showLegend: false, showTitle: false,
    catAxisLabelColor: C.ink, catAxisLabelFontSize: 12, catAxisLabelFontFace: F.body,
    valAxisLabelColor: C.muted, valAxisLabelFontSize: 10, valAxisLabelFontFace: F.body,
    valAxisMaxVal: 340, valAxisMinVal: 0,
    valGridLine: { color: C.line, size: 1 }, catGridLine: { style: 'none' },
    plotArea: { fill: { color: C.white } }, chartArea: { fill: { color: C.white } },
  });
  s.addText('In 2024, 71 Mt of credits were issued and never used — claims that exist on paper and are retired by nobody.', {
    x: M, y: y + 3.66, w: 5.4, h: 0.5, margin: 0,
    fontFace: F.body, fontSize: 11, color: C.muted, lineSpacing: 15, valign: 'top',
  });

  const rx = 6.6;
  const rw = W - M - rx;
  const facts = [
    ['US$ 1.4 bn', 'primary market value, 2025'],
    ['18', 'registries, which cannot talk to each other'],
    ['2.6 bn', 'credits issued since Paris'],
    ['10,200+', 'registered projects'],
  ];
  facts.forEach((f, i) => {
    const fy = y + 0.12 + i * 0.72;
    s.addText(f[0], {
      x: rx, y: fy, w: 2.0, h: 0.6, margin: 0,
      fontFace: F.display, fontSize: 22, bold: true, color: C.forest, valign: 'middle',
    });
    s.addText(f[1], {
      x: rx + 2.05, y: fy, w: rw - 2.05, h: 0.6, margin: 0,
      fontFace: F.body, fontSize: 12, color: C.ink, valign: 'middle', lineSpacing: 16,
    });
  });
  panel(pres, s, { x: rx, y: y + 3.06, w: rw, h: 1.08, fill: C.forest, border: C.forest });
  s.addText('And then the law made buying mandatory.', {
    x: rx + 0.22, y: y + 3.16, w: rw - 0.44, h: 0.42, margin: 0,
    fontFace: F.display, fontSize: 15.5, bold: true, color: C.white, valign: 'middle',
  });
  s.addText('Disclosure, border taxes and trading schemes all point at the same door.', {
    x: rx + 0.22, y: y + 3.58, w: rw - 0.44, h: 0.44, margin: 0,
    fontFace: F.body, fontSize: 11, color: 'BFD0C6', valign: 'middle',
  });

  foot(s, { page: 4, source: 'MSCI, “Carbon Credits Come of Age in 2025” (Jan 2026) · UNCTAD, The Role of Voluntary Carbon Markets in Global Climate Action (2025)' });
  s.addNotes('40 seconds. The chart carries it — 294 issued, 202 retired. Do not read every fact on the right; read two.\n\n'
    + '"Two hundred and ninety-four million tonnes of credits were issued last year. Two hundred and two million were used. And in 2024, seventy-one million tonnes existed as claims on paper that nobody ever retires."\n\n'
    + 'Then the pivot: "And then the law made buying mandatory."\n\n'
    + 'If you are short on time, cut the four facts and go straight to the green box.');
  return s;
}

function s05Law(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 2 · the law',
    title: 'The law now says: prove it.',
    deck: 'Four layers of law now push carbon claims at companies. Every one of them stops at the same sentence.',
  });

  const layers = [
    ['GLOBAL', 'Paris Agreement Article 6 · 6.2 ITMOs with a corresponding adjustment · 6.4 PACM on the UNFCCC registry', C.moss],
    ['NATIONAL', 'India · Carbon Credit Trading Scheme 2023 (Energy Conservation Act 2001, s. 14(w)) · CERC is the designated regulator · compliance mechanism from July 2024 under the BEE Detailed Procedure · Carbon Credit Certificates on the ICM registry, run by the Grid Controller of India', C.moss],
    ['BORDER', 'EU CBAM · definitive regime from 1 January 2026 · May 2026 draft: Article 6 credits cut the bill through the producer’s carbon price, capped at 10 % of the exported goods’ emissions — a cap reported in trade press, not in the Commission’s own text', C.amber],
    ['DISCLOSURE', 'CSRD / ESRS E1-6 · gross Scope 1–3, no netting of credits · E1-7 · credits and removals disclosed separately, project by project', C.amber],
  ];

  let ly = y + 0.1;
  layers.forEach((l) => {
    const h = l[1].length > 150 ? 0.8 : 0.62;
    panel(pres, s, { x: M, y: ly, w: W - 2 * M, h, fill: C.panel, border: C.line });
    chip(pres, s, { x: M + 0.16, y: ly + (h - 0.3) / 2, w: 1.28, h: 0.3, text: l[0], fill: l[2], color: C.white, size: 9 });
    s.addText(l[1], {
      x: M + 1.62, y: ly + 0.04, w: W - 2 * M - 1.85, h: h - 0.08, margin: 0,
      fontFace: F.body, fontSize: 10.5, color: C.ink, valign: 'middle', lineSpacing: 14,
    });
    ly += h + 0.08;
  });

  // the gap
  s.addShape(pres.ShapeType.rect, {
    x: M, y: ly + 0.04, w: W - 2 * M, h: 0.54,
    fill: { color: C.clay }, line: { color: C.clay, width: 1.5, dashType: 'dash' },
  });
  s.addText('WHO CHECKS?  ·  none of these four says.', {
    x: M + 0.2, y: ly + 0.04, w: W - 2 * M - 0.4, h: 0.54, margin: 0,
    fontFace: F.display, fontSize: 15, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  s.addText([
    { text: 'Every rule says: prove it.', options: { breakLine: true } },
    { text: 'Not one of them says who checks, how, or what happens when someone does not.' },
  ], {
    x: M, y: ly + 0.66, w: W - 2 * M, h: 0.62, margin: 0,
    fontFace: F.display, fontSize: 17, bold: true, color: C.forest, valign: 'middle', align: 'center',
  });

  foot(s, { page: 5, source: 'UNFCCC Article 6 · India CCTS 2023 (28 June 2023, Energy Conservation Act 2001 s. 14(w)) · BEE Detailed Procedure for Compliance Mechanism (July 2024) · CERC · Grid Controller of India (ICM registry) · EU CBAM definitive regime 1 Jan 2026 (the Article 6 credit deduction is a May 2026 DRAFT; the 10 % cap is reported in trade press) · EFRAG ESRS E1-6, E1-7' });
  s.addNotes('70 seconds — this is the slide the teacher will interrogate. Read the four bands by their label only (GLOBAL / NATIONAL / BORDER / DISCLOSURE), then stop at the dashed band.\n\n'
    + '"Four layers of law. Paris Article 6 makes a credit transfer between countries auditable. India built a scheme in 2023 with CERC as regulator, the Grid Controller of India running its registry, and BEE administering it. Europe put a border tax on carbon from January this year. The EU now requires companies to disclose credits separately from emissions."\n\n'
    + 'Then point at the dashed band: "Every one of them stops at the same sentence. Prove it. And not one of them says who checks, or how, or what happens to the person who does not."\n\n'
    + 'BE PRECISE if asked: the CBAM Article 6 credit deduction is a DRAFT (published mid-May 2026) and the 10 % cap comes from trade-press reporting of that draft — the Commission’s own page does not state it. India’s enabling Act is the Energy Conservation Act 2001, s. 14(w); the July 2024 instrument is BEE’s Detailed Procedure for Compliance Mechanism, and there is no separate "Standards and Procedures Rules 2023". ESRS E1-6 requires gross reporting with no netting; E1-7 requires credits disclosed separately with project detail.');
  return s;
}

function s06Receipts(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 3 · the evidence',
    title: 'The receipts.',
    deck: 'Then people checked. Three findings, each from a different institution, each with a number you can repeat.',
  });

  stat(pres, s, {
    x: M, y: y + 0.14, w: 3.75, h: 2.62, value: '6 %', vsize: 46, vh: 0.9, lh: 0.94,
    label: 'of a potential 89 million credits were linked to real additional reductions. Sixteen of the eighteen projects claimed far more deforestation than their comparison sites.',
    sub: 'Cambridge + VU Amsterdam, Science (2023)',
    accent: C.clay,
  });
  stat(pres, s, {
    x: M + 4.05, y: y + 0.14, w: 3.75, h: 2.62, value: '15.2 M', vsize: 46, vh: 0.9, lh: 0.94,
    label: 'excess credits Verra admits it issued for the Kariba project. Ten point three million of them were already used to make environmental claims.',
    sub: 'Carbonplan, 21 October 2025',
    accent: C.clay,
  });
  stat(pres, s, {
    x: M + 8.1, y: y + 0.14, w: 3.73, h: 2.62, value: '80 %+', vsize: 46, vh: 0.9, lh: 0.94,
    label: 'of issued credits likely represent a lower climate impact than claimed — 2,346 projects reviewed.',
    sub: 'Probst et al., Nature Comms (2024); US GAO-25-107128',
    accent: C.clay,
  });

  panel(pres, s, { x: M, y: y + 3.0, w: W - 2 * M, h: 1.0, fill: C.forest, border: C.forest });
  s.addText('Six per cent is not proof. It is the market’s normal case.', {
    x: M + 0.3, y: y + 3.1, w: W - 2 * M - 0.6, h: 0.5, margin: 0,
    fontFace: F.display, fontSize: 20, bold: true, color: C.white, valign: 'middle',
  });
  s.addText('This is not a fringe scandal. It is what happens when the record of who owns a tonne lives in eighteen places that cannot talk to each other.', {
    x: M + 0.3, y: y + 3.58, w: W - 2 * M - 0.6, h: 0.34, margin: 0,
    fontFace: F.body, fontSize: 11.5, color: 'BFD0C6', valign: 'middle',
  });

  foot(s, { page: 6, source: 'West et al., Science (2023) via University of Cambridge · Grayson Badgley, Chris Allen & Freya Chay, Carbonplan (21 Oct 2025) · Probst et al., Nature Communications (2024) · US GAO-25-107128 (2025)' });
  s.addNotes('70 seconds. Three numbers. Say them slowly.\n\n'
    + '"Cambridge and Amsterdam looked at eighteen flagship forest projects. Eighty-nine million credits were in play. Five point four million were real. Six per cent."\n\n'
    + '"And Verra itself — the largest registry on Earth — admitted in October that it issued fifteen point two million excess credits for one project, and ten point three million of those had already been used to make environmental claims."\n\n'
    + 'Land it: "Six per cent is not proof. It is the market’s normal case."\n\n'
    + 'If someone challenges the numbers: the study is West et al., peer-reviewed in Science (2023) — 18 REDD+ projects, 89 million expected offsets, 5.4 million likely real; the Kariba figure is Verra’s own admission, reported by Carbonplan.');
  return s;
}

function s07Tree(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 3 · human scale',
    title: 'One photograph. Two buyers. One tree.',
    deck: 'Ravi plants forty neem trees on a half-acre plot and photographs them. The same photograph is then attached to a second plantation eight kilometres away.',
  });

  const photo = (px, py, label, sub, hash) => {
    panel(pres, s, { x: px, y: py, w: 3.55, h: 2.5, fill: C.panel, border: C.line });
    s.addShape(pres.ShapeType.rect, { x: px + 0.25, y: py + 0.25, w: 1.15, h: 1.15, fill: { color: C.forest }, line: { color: C.forest, width: 1 } });
    s.addText('40 neem', {
      x: px + 0.25, y: py + 0.55, w: 1.15, h: 0.5, margin: 0,
      fontFace: F.body, fontSize: 9, color: C.mint, align: 'center', valign: 'middle',
    });
    s.addText(label, {
      x: px + 1.55, y: py + 0.3, w: 1.85, h: 0.6, margin: 0,
      fontFace: F.display, fontSize: 14, bold: true, color: C.ink, valign: 'middle',
    });
    s.addText(sub, {
      x: px + 1.55, y: py + 0.88, w: 1.85, h: 0.55, margin: 0,
      fontFace: F.body, fontSize: 10, color: C.muted, valign: 'top', lineSpacing: 14,
    });
    s.addText(hash, {
      x: px + 0.25, y: py + 1.72, w: 3.05, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 8.5, color: C.muted, valign: 'middle',
    });
    s.addText('CLAIMED AS CARBON', {
      x: px + 0.25, y: py + 2.02, w: 3.05, h: 0.3, margin: 0,
      fontFace: F.body, fontSize: 9, bold: true, charSpacing: 1.6, color: C.clay, valign: 'middle',
    });
  };

  photo(M, y + 0.12, 'Planting A', 'Mandya, Karnataka\n12.9716° N', 'photo sha256  9f2c…a41e');
  photo(M + 3.85, y + 0.12, 'Planting B', '8 km away\nthe same photo', 'photo sha256  9f2c…a41e');

  s.addShape(pres.ShapeType.roundRect, {
    x: M + 3.18, y: y + 1.02, w: 1.5, h: 0.44, fill: { color: C.clay }, line: { color: C.clay, width: 1 }, rectRadius: 0.1,
  });
  s.addText('SAME PHOTO', {
    x: M + 3.18, y: y + 1.02, w: 1.5, h: 0.44, margin: 0,
    fontFace: F.body, fontSize: 9.5, bold: true, color: C.white, align: 'center', valign: 'middle',
  });

  const rx = M + 8.0;
  const rw = W - M - rx;
  s.addText('Kariba is fifteen million tonnes of forest that nobody can point to.', {
    x: rx, y: y + 0.12, w: rw, h: 0.9, margin: 0,
    fontFace: F.display, fontSize: 17, bold: true, color: C.ink, valign: 'top', lineSpacing: 22,
  });
  s.addText('This is the same failure at a size you can hold — one phone photo, two buyers, one tree.', {
    x: rx, y: y + 1.06, w: rw, h: 0.8, margin: 0,
    fontFace: F.body, fontSize: 12.5, color: C.muted, valign: 'top', lineSpacing: 18,
  });
  panel(pres, s, { x: rx, y: y + 1.98, w: rw, h: 0.64, fill: C.forest, border: C.forest });
  s.addText('What has to be true for this to work:', {
    x: rx + 0.18, y: y + 2.02, w: rw - 0.36, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 9.5, bold: true, charSpacing: 1.2, color: C.mint, valign: 'middle',
  });
  s.addText('nobody can sell the same tree twice.', {
    x: rx + 0.18, y: y + 2.26, w: rw - 0.36, h: 0.3, margin: 0,
    fontFace: F.display, fontSize: 14, bold: true, color: C.white, valign: 'middle',
  });

  foot(s, { page: 7, source: 'Scenario from the GreenToken case study (21CSE435T) · the failure mode is documented in UNCTAD, Role of Voluntary Carbon Markets in Global Climate Action (2025)' });
  s.addNotes('40 seconds. Slow down. This is the emotional beat before the concept.\n\n'
    + '"Ravi plants forty neem trees and takes a photograph. He sends it to a cooperative, who forwards it to a company that wants to buy the carbon. The same photograph is then attached to a second plantation eight kilometres away — because a photograph of forty neem trees looks exactly like a photograph of forty neem trees."\n\n'
    + '"Kariba is fifteen million tonnes of forest that nobody can point to. This is the same failure at a size you can hold."\n\n'
    + 'Do not explain the hash yet. The next act explains why a hash is the answer.');
  return s;
}

function s08Refusals(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 4 · the concept',
    title: 'A smart contract is a promise that keeps itself.',
    deck: 'Not a clever document. Three refusals — and the record that makes them enforceable.',
  });

  const cards = [
    ['NO DISCRETION', 'Nobody can negotiate at run time.', 'The rule fires. There is no one to call, no one to ask for an exception.', C.moss],
    ['NO ROLLBACK', 'The outcome is written once.', 'A funded token cannot quietly become unfunded. The history stays.', C.forest],
    ['NO PRIVATE EDIT', 'Everyone reads the same record.', 'A change is visible — and provable — to everyone, forever.', C.amber],
  ];
  cards.forEach((c, i) => {
    const cx = M + i * 4.03;
    panel(pres, s, { x: cx, y: y + 0.14, w: 3.77, h: 2.55, fill: C.panel, border: C.line });
    s.addShape(pres.ShapeType.ellipse, { x: cx + 0.28, y: y + 0.42, w: 0.62, h: 0.62, fill: { color: c[3] }, line: { color: c[3], width: 1 } });
    s.addText(String(i + 1), {
      x: cx + 0.28, y: y + 0.42, w: 0.62, h: 0.62, margin: 0,
      fontFace: F.display, fontSize: 18, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s.addText(c[0], {
      x: cx + 1.05, y: y + 0.42, w: 2.5, h: 0.62, margin: 0,
      fontFace: F.display, fontSize: 16, bold: true, color: C.ink, valign: 'middle',
    });
    s.addText(c[1], {
      x: cx + 0.28, y: y + 1.18, w: 3.2, h: 0.56, margin: 0,
      fontFace: F.body, fontSize: 13, color: C.ink, valign: 'top', lineSpacing: 17,
    });
    s.addText(c[2], {
      x: cx + 0.28, y: y + 1.78, w: 3.2, h: 0.8, margin: 0,
      fontFace: F.body, fontSize: 11, color: C.muted, valign: 'top', lineSpacing: 15,
    });
  });

  panel(pres, s, { x: M, y: y + 2.92, w: W - 2 * M, h: 1.06, fill: C.forest, border: C.forest });
  s.addText('Carbon credits are a promise sold to strangers. The blockchain is not the feature — these three refusals are.', {
    x: M + 0.3, y: y + 2.99, w: W - 2 * M - 0.6, h: 0.56, margin: 0,
    fontFace: F.display, fontSize: 16, bold: true, color: C.white, valign: 'middle', align: 'center', lineSpacing: 19,
  });
  s.addText('The chain is simply how you deliver the same three refusals to people who do not trust each other.', {
    x: M + 0.3, y: y + 3.58, w: W - 2 * M - 0.6, h: 0.34, margin: 0,
    fontFace: F.body, fontSize: 11.5, color: 'BFD0C6', valign: 'middle', align: 'center',
  });

  foot(s, { page: 8, source: 'The three properties map onto Hyperledger Fabric: endorsement policy and determinism (no discretion), append-only hash-linked blocks (no rollback), a shared channel state visible to all members (no private edit)' });
  s.addNotes('55 seconds. Three cards — read only the bold lines.\n\n'
    + '"No discretion: the rule fires. There is nobody to call and nobody to ask for an exception. No rollback: the outcome is written once. No private edit: everybody reads the same record, and any change is provable."\n\n'
    + 'Then the important clarification, because students always get this wrong: "Do not think blockchain is the feature. The chain is how we deliver these three refusals to people who do not trust each other. The refusals are the feature."\n\n'
    + 'If asked "is that not just a database?" — answer: a database has an owner who can change history. Here there is no owner, and the change is provable.');
  return s;
}

function s09Flow(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 4 · the mechanism',
    title: 'How one tree becomes one token.',
    deck: 'Eight steps. Every one of them is a rule in code, and every one of them is checked by somebody else.',
  });

  const steps = [
    ['1 · TRIGGER', 'A planter submits a photo and a GPS fix', C.forest],
    ['2 · ORACLE', 'SHA-256 of the photo, hash of the geo payload', C.clay],
    ['3 · RULES', 'Species in the registry · one photo backs at most one token', C.forest],
    ['4 · ENDORSEMENT', 'Two organisations from different MSPs, one review each', C.moss],
    ['5 · ORDERING', 'Hash-linked block, orderer signature, Merkle root', C.forest],
    ['6 · STATE', 'Token written PENDING → VERIFIED, indexed by district and species', C.moss],
    ['7 · EVENT', 'The contract emits; the feed and dashboard update', C.forest],
    ['8 · SETTLEMENT', '₹150 per tree, discount tier applied in the contract', C.moss],
  ];

  const bw = 2.72;
  const gap = 0.31;
  const bh = 1.36;
  steps.forEach((st, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const bx = M + col * (bw + gap);
    const by = y + 0.12 + row * (bh + 0.62);
    panel(pres, s, { x: bx, y: by, w: bw, h: bh, fill: C.panel, border: C.line });
    s.addShape(pres.ShapeType.rect, { x: bx, y: by, w: bw, h: 0.06, fill: { color: st[2] }, line: { color: st[2], width: 0.5 } });
    s.addText(st[0], {
      x: bx + 0.16, y: by + 0.16, w: bw - 0.32, h: 0.28, margin: 0,
      fontFace: F.body, fontSize: 9.5, bold: true, charSpacing: 1.4, color: st[2], valign: 'middle',
    });
    s.addText(st[1], {
      x: bx + 0.16, y: by + 0.46, w: bw - 0.32, h: 0.78, margin: 0,
      fontFace: F.body, fontSize: 10.5, color: C.ink, valign: 'top', lineSpacing: 14,
    });
    if (col < 3) arrow(pres, s, { x: bx + bw + 0.05, y: by + bh / 2, w: gap - 0.1, color: 'A9BDB0', width: 1.5 });
  });
  // row wrap
  arrow(pres, s, { x: M + 3 * (bw + gap) + bw / 2, y: y + 0.12 + bh + 0.06, w: 0, h: 0.46, color: 'A9BDB0', width: 1.5 });
  s.addShape(pres.ShapeType.line, {
    x: M + 0.4, y: y + 0.12 + bh + 0.28, w: 3 * (bw + gap) + bw / 2 - 0.4, h: 0,
    line: { color: 'A9BDB0', width: 1.5 },
  });

  panel(pres, s, { x: M, y: y + 3.56, w: W - 2 * M, h: 0.88, fill: C.clay, border: C.clay });
  s.addText('The oracle is the weak link: a contract can only be as honest as the fact you feed it.', {
    x: M + 0.3, y: y + 3.63, w: W - 2 * M - 0.6, h: 0.4, margin: 0,
    fontFace: F.display, fontSize: 16, bold: true, color: C.white, valign: 'middle',
  });
  s.addText('GreenToken admits it: the GPS and the photograph are supplied by the planter. Everything after step two is checked by parties who want to disagree with each other.', {
    x: M + 0.3, y: y + 4.02, w: W - 2 * M - 0.6, h: 0.36, margin: 0,
    fontFace: F.body, fontSize: 11, color: 'F6DCD5', valign: 'middle',
  });

  foot(s, { page: 9, source: 'GreenToken contract: PlantTree, VerifyPlanting, FundTokens, SettleFunding (src/core/chaincode.ts) · REQUIRED_ENDORSEMENTS = 2 · BASE_PRICE_INR = 150' });
  s.addNotes('70 seconds. Walk the top row left to right, then the bottom row. Name the steps, do not explain them.\n\n'
    + '"Trigger, oracle, rules, endorsement, ordering, state, event, settlement. That is one tree becoming one token — and every arrow is a rule in code, not a promise in an email."\n\n'
    + 'Then stop on the red band and be honest: "The oracle is the weak link. The photo and the coordinates come from the planter. Everything after step two is checked by parties who want to disagree with each other. A smart contract cannot launder a lie — it can only refuse to launder it silently."\n\n'
    + 'If asked about step 4: two endorsements from two different organisations, one review per organisation, and a rejection is permanent.');
  return s;
}

function s10Applications(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 4 · applications',
    title: 'Every application is a promise with a shape.',
    deck: 'Pick the application by asking which property its promise needs.',
  });

  const yn = '●';
  const no = '—';
  const rows = [
    ['Application', 'The promise it must keep', 'Evidence it is real', 'Cannot be sold twice', 'No discretion'],
    ['Carbon credits', 'one tonne, removed once', yn, yn, yn],
    ['Parametric insurance', 'the trigger fired, so it pays', no, yn, yn],
    ['Supply-chain provenance', 'this is the good we shipped', no, yn, yn],
    ['Escrow & trade finance', 'the money moves when the terms are met', no, no, yn],
    ['Tokenised deposits', 'one deposit, one withdrawal', yn, yn, no],
    ['Voting & elections', 'one ballot, one vote, a public tally', no, yn, yn],
  ];
  const body = rows.map((r, ri) => r.map((c, ci) => {
    if (ri === 0) return { text: c, options: { bold: true, color: C.white, fill: C.forest, fontSize: 10.5 } };
    const txt = String(c);
    if (ci >= 2) {
      return {
        text: txt,
        options: {
          align: 'center', valign: 'middle', fontSize: 15, bold: txt === yn,
          color: txt === yn ? C.moss : 'C3CCC6',
        },
      };
    }
    return { text: txt, options: { color: ci === 0 ? C.ink : C.muted, bold: ci === 0, fontSize: 11 } };
  }));
  s.addTable(body, {
    x: M, y: y + 0.12, w: W - 2 * M,
    colW: [3.0, 4.13, 1.57, 1.57, 1.56],
    rowH: 0.46,
    border: { type: 'solid', color: C.line, pt: 1 },
    fill: C.white,
    autoPage: false,
  });

  panel(pres, s, { x: M, y: y + 3.5, w: W - 2 * M, h: 0.86, fill: C.forest, border: C.forest });
  s.addText('Carbon credits needed all three at once — which is why this market broke first.', {
    x: M + 0.3, y: y + 3.58, w: W - 2 * M - 0.6, h: 0.42, margin: 0,
    fontFace: F.display, fontSize: 16, bold: true, color: C.white, valign: 'middle', align: 'center',
  });
  s.addText('● = the property this promise depends on.   — = not required by that promise.', {
    x: M + 0.3, y: y + 3.98, w: W - 2 * M - 0.6, h: 0.3, margin: 0,
    fontFace: F.body, fontSize: 10, color: 'BFD0C6', valign: 'middle', align: 'center',
  });

  foot(s, { page: 10, source: 'The matrix is the teaching device for this subject: each row is a promise, each column is a property a smart contract supplies' });
  s.addNotes('55 seconds. Do not read the table. Read the tool.\n\n'
    + '"Here is the whole subject in one table. Every application is a promise with a shape. Parametric insurance is a promise that pays when an objective trigger fires — it needs no discretion, and it must not fire twice. Supply-chain provenance needs evidence and uniqueness. Escrow needs settlement without negotiation."\n\n'
    + 'Then the row that matters: "Carbon credits needed all three at once. That is why the carbon market broke before any other market did — not for lack of demand, but for lack of a way to keep the promise."\n\n'
    + 'If a student asks which application to pick: "Ask what its promise is. Then ask which column the promise leans on."');
  return s;
}

function s11Comparison(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Act 4 · the landscape',
    title: 'What changes when the promise is code.',
    deck: 'Not a better database. A different kind of record — one where the rules run instead of being negotiated.',
  });

  const rows = [
    ['The question', 'The carbon market today', 'GreenToken'],
    ['Who owns this tonne?', 'A registry entry, reconciled across 18 systems', 'A token in one shared state, queryable by anyone'],
    ['Can it be sold twice?', 'Yes — no system can see the other', 'No — the photo digest is indexed; the second claim is refused at creation'],
    ['Who verifies?', 'Whoever the project appoints', 'Two organisations with nothing to gain from agreeing'],
    ['The price', 'Negotiated, per project, off-platform', '₹150 a tree and the discount ladder, written in the contract'],
    ['The audit trail', 'Documents, if they are kept', 'Hash-linked blocks, a Merkle root, and an event feed'],
    ['A dispute', 'An argument between two databases', 'A query — anyone can recompute the whole history'],
  ];
  const body = rows.map((r, ri) => r.map((c, ci) => {
    if (ri === 0) {
      return { text: c, options: { bold: true, color: C.white, fill: ci === 2 ? C.moss : C.forest, fontSize: 11 } };
    }
    const opt = { fontSize: 11, valign: 'middle' };
    if (ci === 0) { opt.bold = true; opt.color = C.ink; }
    else if (ci === 1) { opt.color = C.muted; }
    else { opt.color = C.forest; opt.bold = true; }
    return { text: c, options: opt };
  }));
  s.addTable(body, {
    x: M, y: y + 0.12, w: W - 2 * M,
    colW: [2.6, 4.4, 4.83],
    rowH: 0.5,
    border: { type: 'solid', color: C.line, pt: 1 },
    fill: C.white,
    autoPage: false,
  });

  panel(pres, s, { x: M, y: y + 3.7, w: W - 2 * M, h: 0.78, fill: C.moss, border: C.moss });
  s.addText('The buyer can open the ledger and recompute the entire history without asking anybody for anything. That is what turns a claim into evidence.', {
    x: M + 0.3, y: y + 3.76, w: W - 2 * M - 0.6, h: 0.66, margin: 0,
    fontFace: F.display, fontSize: 14.5, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  foot(s, { page: 11, source: 'GreenToken contract rules: REQUIRED_ENDORSEMENTS = 2 distinct organisations · BASE_PRICE_INR = 150, discount tiers 0/5/10/15 % · photo-hash index (src/core/chaincode.ts)' });
  s.addNotes('70 seconds. Read the two rows that answer the earlier evidence, then the last one.\n\n'
    + '"Can it be sold twice? Today: yes, and no system can see the other. Here: no — the photo digest is indexed, so the second claim is refused at creation, not detected later."\n\n'
    + '"And a dispute? Today it is an argument between two databases. Here it is a query."\n\n'
    + 'Land the green band: "The buyer can open the ledger and recompute the whole history without asking anybody for anything. That is what turns a claim into evidence — and evidence is what gets a credit past due diligence."\n\n'
    + 'If asked about cost: two signatures and one transaction per token, against a price of ₹150 a tree.');
  return s;
}

function s12Proof(pres) {
  const s = pres.addSlide();
  ground(pres, s, true);
  const y = head(s, { dark: true, kicker: 'Act 5 · the proof', title: 'I am going to try two crimes.' });

  const crimes = [
    ['1', 'Sell the same tree twice.', 'Plant one tree. Plant it again with the same photograph.', C.clay],
    ['2', 'Edit the ledger.', 'Reach into the last block and change what it says.', C.clay],
  ];
  crimes.forEach((c, i) => {
    const cx = M + i * 4.1;
    panel(pres, s, { x: cx, y: y + 0.1, w: 3.85, h: 2.1, fill: C.darkPanel, border: '2B3D33' });
    s.addShape(pres.ShapeType.ellipse, { x: cx + 0.28, y: y + 0.42, w: 0.62, h: 0.62, fill: { color: c[3] }, line: { color: c[3], width: 1 } });
    s.addText(c[0], {
      x: cx + 0.28, y: y + 0.42, w: 0.62, h: 0.62, margin: 0,
      fontFace: F.display, fontSize: 18, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s.addText(c[1], {
      x: cx + 1.05, y: y + 0.42, w: 2.6, h: 0.62, margin: 0,
      fontFace: F.display, fontSize: 16, bold: true, color: C.white, valign: 'middle',
    });
    s.addText(c[2], {
      x: cx + 0.28, y: y + 1.2, w: 3.3, h: 0.8, margin: 0,
      fontFace: F.body, fontSize: 12, color: 'BFD0C6', valign: 'top', lineSpacing: 17,
    });
  });

  panel(pres, s, { x: M + 8.2, y: y + 0.1, w: W - M - 8.2, h: 2.1, fill: C.forest, border: C.moss });
  s.addText('Then we watch it refuse.', {
    x: M + 8.45, y: y + 0.32, w: W - M - 8.7, h: 0.9, margin: 0,
    fontFace: F.display, fontSize: 22, bold: true, color: C.white, valign: 'middle', lineSpacing: 26,
  });
  s.addText('Everything I have said about immutability is a claim until somebody tries to break it.', {
    x: M + 8.45, y: y + 1.24, w: W - M - 8.7, h: 0.8, margin: 0,
    fontFace: F.body, fontSize: 12, color: 'BFD0C6', valign: 'top', lineSpacing: 17,
  });

  panel(pres, s, { x: M, y: y + 2.5, w: W - 2 * M, h: 1.5, fill: '132019', border: '2B3D33' });
  s.addText('DEMO CUE CARD', {
    x: M + 0.3, y: y + 2.64, w: 3.0, h: 0.28, margin: 0,
    fontFace: F.body, fontSize: 9.5, bold: true, charSpacing: 1.8, color: C.mint, valign: 'middle',
  });
  const cues = [
    '▸  Open greentoken-7gc.pages.dev  ·  Ledger Explorer  →  ↺ Reset demo',
    '▸  Plant with the prepared photo file  →  then plant the SAME file again',
    '▸  Verify (two organisations)  →  fund  →  settle  →  tamper  →  restore',
  ];
  cues.forEach((c, i) => {
    s.addText(c, {
      x: M + 0.3, y: y + 2.96 + i * 0.32, w: W - 2 * M - 0.6, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 11, color: 'C7D6CD', valign: 'middle',
    });
  });

  foot(s, { dark: true, source: 'The deployed app at greentoken-7gc.pages.dev · the ledger lives in the presenter’s browser (localStorage) · the rehearsal proves the refusal before the class does' });
  s.addNotes('15 seconds, then switch to the browser. Say it as a promise to the room, because that is what makes the demo land:\n\n'
    + '"Everything I have said about immutability is a claim until somebody tries to break it. So I am going to try two crimes. One: sell the same tree twice. Two: edit the ledger. And I want you to watch what happens."\n\n'
    + 'Then stop talking. Demo steps, then return to the close slide.\n\n'
    + 'REMEMBER: reset the demo first, and use the SAME photo file for both plantings.');
  return s;
}

function s13Close(pres) {
  const s = pres.addSlide();
  ground(pres, s, true);
  s.addText('Every how-to needs proof.', {
    x: M, y: 2.35, w: W - 2 * M, h: 1.1, margin: 0,
    fontFace: F.display, fontSize: 46, bold: true, color: C.white, valign: 'middle', align: 'center',
  });
  s.addText('Plant it.  Prove it.  Tokenise it.', {
    x: M, y: 3.55, w: W - 2 * M, h: 0.6, margin: 0,
    fontFace: F.display, fontSize: 24, bold: true, color: C.mint, valign: 'middle', align: 'center',
  });
  s.addText('The carbon market asked for a promise and got a spreadsheet.\nWe made one promise keep itself — and then let you try to break it.', {
    x: 2.6, y: 4.4, w: W - 5.2, h: 0.9, margin: 0,
    fontFace: F.body, fontSize: 14, color: 'BFD0C6', valign: 'top', align: 'center', lineSpacing: 21,
  });
  s.addText('21CSE435T · Smart Contracts and Application Development   ·   greentoken-7gc.pages.dev   ·   github.com/aswathas/greentoken', {
    x: M, y: 5.75, w: W - 2 * M, h: 0.35, margin: 0,
    fontFace: F.mono, fontSize: 10, color: '7FA98F', valign: 'middle', align: 'center',
  });
  s.addText('UN SDG 13 · Climate Action', {
    x: M, y: 6.14, w: W - 2 * M, h: 0.3, margin: 0,
    fontFace: F.body, fontSize: 10, bold: true, charSpacing: 1.4, color: C.mint, valign: 'middle', align: 'center',
  });
  s.addNotes('15 seconds. Say the callback line, then the three words, then stop.\n\n'
    + '"Every how-to needs proof. Plant it. Prove it. Tokenise it."\n\n'
    + 'Optional last line, if the room is warm: "The demo is still running. Come and try to sell me the same tree."\n\n'
    + 'Then: "Questions — and the appendix is the honest answer to all of them."');
  return s;
}

module.exports = [s01Cover, s02Video, s03Emitters, s04Escape, s05Law, s06Receipts, s07Tree, s08Refusals, s09Flow, s10Applications, s11Comparison, s12Proof, s13Close];
