/**
 * Compile the GreenToken deck.
 *   node slides/compile.js
 */
const path = require('path');
const pptxgen = require('/usr/local/lib/node_modules/pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'GreenToken — Unit 5 Course Project';
pres.company = '21CSE432IT Blockchain Technology with Hyperledger Fabric';
pres.title = 'GreenToken — Verifiable Blue-Green Carbon Tokens';
pres.subject = 'Unit 5 — Developing Smart Contracts and Use Cases';

// Forest & Eco palette (light mode)
const theme = {
  primary: '344E41',   // deep forest — titles and body text
  secondary: '588157', // mid green — secondary text
  accent: '3A5A40',    // deep green — fills and badges
  light: 'FFFFFF',     // panel background
  bg: 'DAD7CD',        // cream slide background
};

const slides = [];
for (let i = 1; i <= 21; i++) {
  slides.push(`./slide-${String(i).padStart(2, '0')}.js`);
}

slides.forEach((f) => {
  const mod = require(path.join(__dirname, f));
  mod.createSlide(pres, theme);
});

const out = path.join(__dirname, 'output', 'GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx');
pres.writeFile({ fileName: out }).then(() => {
  console.log(`✔ Compiled ${slides.length} slides → ${out}`);
});
