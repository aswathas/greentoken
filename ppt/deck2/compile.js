/**
 * Compile the GreenToken story deck.
 *
 *   node deck2/compile.js
 *
 * 30 slides in four acts:
 *   1  the problem        — one tree, then the scale, then the market
 *   2  the trust game     — who is stuck, and what changes the game
 *   3  Fabric, taught     — the six components and the six phases
 *   4  GreenToken         — the application, the proof, the close
 */
const path = require('path');
const pptxgen = require('/usr/local/lib/node_modules/pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Aswath AS (RA2311050010060)';
pres.company = 'SRM Institute of Science and Technology — Data Science and Business Systems';
pres.title = 'GreenToken — The Tree That Was Sold Twice';
pres.subject = '21CSE435T — Smart Contract and Application Development · Unit 5';

const acts = ['./act1.js', './act2.js', './act3.js', './act4.js'];
let count = 0;
acts.forEach((f) => {
  const mod = require(path.join(__dirname, f));
  count += mod.build(pres).length;
});

const out = path.join(__dirname, 'output', 'GreenToken-The-Tree-That-Was-Sold-Twice.pptx');
pres.writeFile({ fileName: out }).then(() => {
  console.log(`✔ Compiled ${count} slides → ${out}`);
});
