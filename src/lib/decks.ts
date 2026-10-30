import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A week's slides live in public/slides/week-NN/ (made by `npm run slides`).
 * Read at build time, so dropping in a new export is all it takes.
 */
export interface DeckSlide {
  src: string;
  alt: string;
}

export interface Deck {
  slides: DeckSlide[];
  pdf?: string;
}

interface SlideListEntry {
  file: string;
  text?: string;
}

const PUBLIC_DIR = join(process.cwd(), 'public');

export function getDeck(week: number): Deck | undefined {
  const slug = `week-${String(week).padStart(2, '0')}`;
  const dir = join(PUBLIC_DIR, 'slides', slug);
  const listPath = join(dir, 'slides.json');
  if (!existsSync(listPath)) return undefined;

  // PowerShell writes a byte-order mark; strip it before parsing.
  const entries = JSON.parse(readFileSync(listPath, 'utf8').replace(/^﻿/, '')) as SlideListEntry[];
  const slides = entries
    .filter((entry) => /^slide-\d+\.webp$/.test(entry.file) && existsSync(join(dir, entry.file)))
    .map((entry, i) => ({
      src: `/slides/${slug}/${entry.file}`,
      alt: `Slide ${i + 1}${entry.text ? `: ${entry.text}` : ''}`,
    }));
  if (slides.length === 0) return undefined;

  const pdfName = `${slug}.pdf`;
  return { slides, pdf: existsSync(join(dir, pdfName)) ? `/slides/${slug}/${pdfName}` : undefined };
}
