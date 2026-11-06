/**
 * One function per slide type. Each takes (pres, spec, ctx) and adds one slide.
 * Slide types mirror the Week 1 deck: cover, agenda, statement, code, table, cards, yourTurn, assignment, next.
 */
import { COLORS, FONTS, PAGE, TONES } from './theme.mjs';
import { codeBlock, footer, header, notes, panel } from './parts.mjs';

const newSlide = (pres, tone) => {
  const slide = pres.addSlide();
  slide.background = { color: TONES[tone].bg };
  return slide;
};

function cover(pres, s, ctx) {
  const slide = newSlide(pres, 'dark');
  slide.addImage({ path: ctx.logoPath, x: PAGE.marginX, y: 1.2, w: 3.6, h: 1.93, altText: 'Hikmah Hackers logo' });
  slide.addText(s.title, {
    x: PAGE.marginX, y: 3.45, w: PAGE.contentW, h: 1.1,
    fontFace: FONTS.head, fontSize: 54, bold: true, color: COLORS.cream, margin: 0, fit: 'shrink', isTextBox: true,
  });
  slide.addText(s.subtitle || '', {
    x: PAGE.marginX, y: 4.6, w: PAGE.contentW, h: 0.6,
    fontFace: FONTS.body, fontSize: 24, color: COLORS.mint, margin: 0, isTextBox: true,
  });
  slide.addText((s.footer || 'Darul Uloom Michigan · Fridays').toUpperCase(), {
    x: PAGE.marginX, y: PAGE.footerY, w: PAGE.contentW, h: 0.35,
    fontFace: FONTS.body, fontSize: 13, color: COLORS.gold, charSpacing: 3, margin: 0, isTextBox: true,
  });
  notes(slide, s.notes);
}

function table(pres, s) {
  const tone = s.tone || 'light';
  const slide = newSlide(pres, tone);
  header(slide, tone, s.eyebrow, s.title);
  const mono = new Set(s.monoColumns || []);
  const dark = tone === 'dark';
  const cell = (text, col, isHead) => ({
    text,
    options: {
      fontFace: !isHead && mono.has(col) ? FONTS.mono : FONTS.body,
      fontSize: isHead ? 17 : s.fontSize || 18,
      bold: isHead,
      color: dark ? COLORS.cream : COLORS.green,
      fill: { color: isHead ? (dark ? COLORS.greenDeep : COLORS.creamHead) : dark ? COLORS.greenCard : COLORS.creamCard },
      margin: [0.08, 0.15, 0.08, 0.15],
      valign: 'middle',
    },
  });
  const rows = [s.header.map((h, c) => cell(h, c, true)), ...s.rows.map((r) => r.map((t, c) => cell(t, c, false)))];
  slide.addTable(rows, {
    x: PAGE.marginX, y: PAGE.contentY, w: PAGE.contentW, colW: s.columnWidths,
    border: { type: 'solid', pt: 1, color: dark ? COLORS.greenLine : COLORS.creamLine }, rowH: 0.6,
  });
  footer(slide, tone, s.footer);
  notes(slide, s.notes);
}

function agenda(pres, s) {
  table(pres, { ...s, tone: 'light', eyebrow: s.eyebrow || 'Today', header: ['Time', 'What we do'], columnWidths: [2.2, PAGE.contentW - 2.2] });
}

function statement(pres, s) {
  const slide = newSlide(pres, 'dark');
  header(slide, 'dark', s.eyebrow, s.title, s.cards?.length ? 34 : 40);
  const cards = s.cards || [];
  const gap = 0.3;
  const w = (PAGE.contentW - gap * (cards.length - 1)) / Math.max(cards.length, 1);
  cards.forEach((card, i) => {
    const x = PAGE.marginX + i * (w + gap);
    panel(slide, { x, y: 2.75, w, h: 2.9, fill: COLORS.greenCard });
    slide.addText(card.label, { x: x + 0.35, y: 3.0, w: w - 0.7, h: 0.8, fontFace: FONTS.head, fontSize: 40, bold: true, color: COLORS.gold, margin: 0, isTextBox: true });
    slide.addText(card.text, { x: x + 0.35, y: 3.85, w: w - 0.7, h: 0.75, fontFace: FONTS.body, fontSize: 20, color: COLORS.cream, margin: 0, valign: 'top', isTextBox: true });
    if (card.code) {
      slide.addText(card.code, { x: x + 0.35, y: 4.65, w: w - 0.7, h: 0.8, fontFace: FONTS.mono, fontSize: 17, color: COLORS.string, margin: 0, valign: 'top', fit: 'shrink', isTextBox: true });
    }
  });
  footer(slide, 'dark', s.footer);
  notes(slide, s.notes);
}

function code(pres, s) {
  const tone = s.tone || 'light';
  const slide = newSlide(pres, tone);
  header(slide, tone, s.eyebrow, s.title);
  const lines = Math.max(s.code.split('\n').length, (s.output || '').split('\n').length);
  const h = Math.min(1.1 + lines * 0.42, 4.2);
  if (s.output) {
    const w = (PAGE.contentW - 0.3) / 2;
    codeBlock(slide, { x: PAGE.marginX, y: PAGE.contentY, w: w + 0.6, h, code: s.code, label: s.codeLabel || 'Type this, then press Run' });
    codeBlock(slide, { x: PAGE.marginX + w + 0.9, y: PAGE.contentY, w: w - 0.6, h, code: s.output, label: 'You should see', plain: true, fill: '062019' });
  } else {
    codeBlock(slide, { x: PAGE.marginX, y: PAGE.contentY, w: PAGE.contentW, h, code: s.code, label: s.codeLabel });
  }
  if (s.callout) {
    slide.addText(s.callout, {
      x: PAGE.marginX, y: PAGE.contentY + h + 0.35, w: PAGE.contentW, h: 0.9,
      fontFace: FONTS.body, fontSize: 20, color: TONES[tone].body, margin: 0, valign: 'top', isTextBox: true,
    });
  }
  footer(slide, tone, s.footer);
  notes(slide, s.notes);
}

function cards(pres, s) {
  const tone = s.tone || 'light';
  const t = TONES[tone];
  const slide = newSlide(pres, tone);
  header(slide, tone, s.eyebrow, s.title);
  const gap = 0.3;
  const w = (PAGE.contentW - gap * (s.cards.length - 1)) / s.cards.length;
  s.cards.forEach((card, i) => {
    const x = PAGE.marginX + i * (w + gap);
    panel(slide, { x, y: PAGE.contentY + 0.2, w, h: 3.3, fill: t.card, line: tone === 'light' ? COLORS.creamLine : undefined });
    slide.addText(card.title, { x: x + 0.35, y: PAGE.contentY + 0.5, w: w - 0.7, h: 0.9, fontFace: FONTS.head, fontSize: 24, bold: true, color: t.title, margin: 0, valign: 'top', isTextBox: true });
    if (card.code) {
      slide.addText(card.code, { x: x + 0.35, y: PAGE.contentY + 1.4, w: w - 0.7, h: 0.6, fontFace: FONTS.mono, fontSize: 18, color: tone === 'light' ? COLORS.goldInk : COLORS.string, margin: 0, fit: 'shrink', isTextBox: true });
    }
    slide.addText(card.body, { x: x + 0.35, y: PAGE.contentY + (card.code ? 2.05 : 1.45), w: w - 0.7, h: 1.3, fontFace: FONTS.body, fontSize: 19, color: t.body, margin: 0, valign: 'top', isTextBox: true });
  });
  footer(slide, tone, s.footer);
  notes(slide, s.notes);
}

function yourTurn(pres, s) {
  const slide = newSlide(pres, 'gold');
  header(slide, 'gold', s.eyebrow || 'Your turn · 5 min', s.title);
  const lines = s.code.split('\n').length;
  codeBlock(slide, { x: PAGE.marginX, y: PAGE.contentY, w: 6.9, h: Math.min(0.7 + lines * 0.5, 4.2), code: s.code, fontSize: 22 });
  panel(slide, { x: PAGE.marginX + 7.25, y: PAGE.contentY, w: PAGE.contentW - 7.25, h: 2.3, fill: COLORS.cream });
  slide.addText(s.sideTitle || 'Finished early?', { x: PAGE.marginX + 7.6, y: PAGE.contentY + 0.3, w: PAGE.contentW - 7.95, h: 0.5, fontFace: FONTS.head, fontSize: 22, bold: true, color: COLORS.green, margin: 0, isTextBox: true });
  slide.addText(s.sideBody, { x: PAGE.marginX + 7.6, y: PAGE.contentY + 0.85, w: PAGE.contentW - 7.95, h: 1.3, fontFace: FONTS.body, fontSize: 18, color: COLORS.inkSoft, margin: 0, valign: 'top', isTextBox: true });
  footer(slide, 'gold', s.footer);
  notes(slide, s.notes);
}

function assignment(pres, s) {
  const slide = newSlide(pres, 'light');
  header(slide, 'light', s.eyebrow || 'Mini-project · due next Friday', s.title);
  const w = (PAGE.contentW - 0.4) / 2;
  const top = PAGE.contentY;
  panel(slide, { x: PAGE.marginX, y: top, w, h: 4.1, fill: COLORS.creamCard, line: COLORS.creamLine });
  slide.addText('Required', { x: PAGE.marginX + 0.4, y: top + 0.3, w: w - 0.8, h: 0.5, fontFace: FONTS.head, fontSize: 22, bold: true, color: COLORS.green, margin: 0, isTextBox: true });
  slide.addText(s.required.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < s.required.length - 1 } })), {
    x: PAGE.marginX + 0.4, y: top + 0.9, w: w - 0.8, h: 3.0, fontFace: FONTS.body, fontSize: 18, color: COLORS.inkSoft, margin: 0, valign: 'top', paraSpaceAfter: 6, isTextBox: true,
  });
  const bx = PAGE.marginX + w + 0.4;
  panel(slide, { x: bx, y: top, w, h: 4.1, fill: COLORS.greenDeep });
  slide.addText(s.bonusTitle || 'Bonus', { x: bx + 0.4, y: top + 0.3, w: w - 0.8, h: 0.5, fontFace: FONTS.head, fontSize: 22, bold: true, color: COLORS.gold, margin: 0, isTextBox: true });
  if (s.bonusCode) {
    codeBlock(slide, { x: bx + 0.2, y: top + 0.85, w: w - 0.4, h: 1.75, code: s.bonusCode, fontSize: 17, fill: COLORS.greenDeep });
  }
  slide.addText(s.bonusBody || '', { x: bx + 0.4, y: top + (s.bonusCode ? 2.75 : 0.9), w: w - 0.8, h: 1.2, fontFace: FONTS.body, fontSize: 17, color: COLORS.mint, margin: 0, valign: 'top', isTextBox: true });
  footer(slide, 'light', s.footer);
  notes(slide, s.notes);
}

function next(pres, s) {
  const slide = newSlide(pres, 'dark');
  header(slide, 'dark', s.eyebrow || 'Next Friday', s.title, 44);
  const lines = s.code.split('\n').length;
  codeBlock(slide, { x: PAGE.marginX, y: 2.6, w: PAGE.contentW, h: 0.7 + lines * 0.5, code: s.code, fontSize: 24 });
  slide.addText(s.closing || '', {
    x: PAGE.marginX, y: 3.6 + lines * 0.5, w: PAGE.contentW, h: 0.8,
    fontFace: FONTS.body, fontSize: 24, color: COLORS.mint, margin: 0, valign: 'top', isTextBox: true,
  });
  slide.addText((s.footer || 'Hikmah Hackers · See you next week, in sha Allah').toUpperCase(), {
    x: PAGE.marginX, y: PAGE.footerY, w: PAGE.contentW, h: 0.35,
    fontFace: FONTS.body, fontSize: 13, color: COLORS.gold, charSpacing: 3, margin: 0, isTextBox: true,
  });
  notes(slide, s.notes);
}

export const LAYOUTS = { cover, agenda, statement, code, table, cards, yourTurn, assignment, next };
