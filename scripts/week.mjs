/**
 * One command per week: build the deck from slides/week-NN.json, then export it for the website.
 *
 * Usage (from website/):  npm run week -- 2
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDeck } from './build-deck.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const week = Number(process.argv[2]);
if (!Number.isInteger(week) || week < 1) {
  console.error('Usage: npm run week -- <week-number>');
  process.exit(1);
}

const specPath = resolve(here, '..', '..', 'slides', `week-${String(week).padStart(2, '0')}.json`);
if (!existsSync(specPath)) {
  console.error(`No deck content at ${specPath}. Copy slides/week-02.json as a starting point.`);
  process.exit(1);
}

const { outPath, count } = await buildDeck(specPath);
console.log(`Built ${count} slides -> ${outPath}`);
execFileSync(process.execPath, [join(here, 'export-slides.mjs'), outPath, String(week)], { stdio: 'inherit' });
