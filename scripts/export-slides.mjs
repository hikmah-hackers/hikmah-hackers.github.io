/**
 * Turns a week's PowerPoint deck into what the website embeds:
 *   public/slides/week-NN/slide-01.webp … , week-NN.pdf, slides.json
 *
 * Usage (from website/):  npm run slides -- ../slides/week-01-hello-python.pptx 1
 * Requires Windows + PowerPoint (for a faithful render).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WEBP_QUALITY = 82;
const here = dirname(fileURLToPath(import.meta.url));
const [deckArg, weekArg] = process.argv.slice(2);
const week = Number(weekArg);

if (!deckArg || !Number.isInteger(week) || week < 1) {
  console.error('Usage: npm run slides -- <path-to-deck.pptx> <week-number>');
  process.exit(1);
}
const deck = resolve(deckArg);
if (!existsSync(deck)) {
  console.error(`Deck not found: ${deck}`);
  process.exit(1);
}

const slug = `week-${String(week).padStart(2, '0')}`;
const outDir = resolve(here, '..', 'public', 'slides', slug);

execFileSync(
  'powershell.exe',
  ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(here, 'export-slides.ps1'), '-Deck', deck, '-OutDir', outDir, '-PdfName', `${slug}.pdf`],
  { stdio: 'inherit' },
);

const pngs = readdirSync(outDir).filter((f) => f.endsWith('.png'));
for (const png of pngs) {
  const src = join(outDir, png);
  await sharp(src).webp({ quality: WEBP_QUALITY }).toFile(src.replace(/\.png$/, '.webp'));
  unlinkSync(src);
}
console.log(`Done: ${pngs.length} slides in public/slides/${slug}/`);
