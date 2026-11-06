/**
 * Builds a branded PowerPoint deck from a week's content file.
 *
 * Usage (from website/):  npm run deck -- ../slides/week-02.json
 * Writes the .pptx named in the file's "output" (next to the JSON).
 * Slide types and their fields are documented in ../slides/README.md.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import { LAYOUTS } from './deck/layouts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = resolve(here, '..', '..', 'logo', 'hikmah-hackers-lockup-dark.png');

export async function buildDeck(specPath) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  if (!Array.isArray(spec.slides) || !spec.output) throw new Error('Deck file needs "output" and a "slides" list.');
  if (!existsSync(LOGO_PATH)) throw new Error(`Logo not found at ${LOGO_PATH}`);

  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = spec.title || 'Hikmah Hackers';
  pres.author = 'Hikmah Hackers';
  pres.company = 'Darul Uloom Michigan';

  spec.slides.forEach((slide, i) => {
    const layout = LAYOUTS[slide.type];
    if (!layout) throw new Error(`Slide ${i + 1}: unknown type "${slide.type}". Use one of: ${Object.keys(LAYOUTS).join(', ')}`);
    layout(pres, slide, { logoPath: LOGO_PATH });
  });

  const outPath = join(dirname(resolve(specPath)), spec.output);
  await pres.writeFile({ fileName: outPath });
  return { outPath, week: spec.week, count: spec.slides.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error('Usage: npm run deck -- <path-to-week-NN.json>');
    process.exit(1);
  }
  const { outPath, count } = await buildDeck(resolve(specPath));
  console.log(`Built ${count} slides -> ${outPath}`);
}
