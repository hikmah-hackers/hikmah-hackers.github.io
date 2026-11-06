/**
 * Small building blocks shared by every slide layout.
 * pptxgenjs mutates option objects, so every helper builds fresh ones.
 */
import { COLORS, FONTS, PAGE, TONES } from './theme.mjs';

export function header(slide, tone, eyebrow, title, titleSize = 36) {
  const t = TONES[tone];
  if (eyebrow) {
    slide.addText(eyebrow.toUpperCase(), {
      x: PAGE.marginX, y: PAGE.eyebrowY, w: PAGE.contentW, h: 0.35,
      fontFace: FONTS.body, fontSize: 14, bold: true, color: t.eyebrow, charSpacing: 3, margin: 0, isTextBox: true,
    });
  }
  slide.addText(title, {
    x: PAGE.marginX, y: PAGE.titleY, w: PAGE.contentW, h: 0.95,
    fontFace: FONTS.head, fontSize: titleSize, bold: true, color: t.title, margin: 0, valign: 'middle', fit: 'shrink', isTextBox: true,
  });
}

export function footer(slide, tone, text) {
  if (!text) return;
  slide.addText(text, {
    x: PAGE.marginX, y: PAGE.footerY, w: PAGE.contentW, h: 0.35,
    fontFace: FONTS.body, fontSize: 12, color: TONES[tone].footer, margin: 0, isTextBox: true,
  });
}

export function panel(slide, { x, y, w, h, fill, line }) {
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: fill },
    line: line ? { color: line, width: 1 } : { type: 'none' },
  });
}

/** Splits one line of Python into colored runs: strings gold, comments muted, the rest cream. */
function tokenizeLine(line) {
  const runs = [];
  let buffer = '';
  let i = 0;
  const flush = (color) => {
    if (buffer) runs.push({ text: buffer, color });
    buffer = '';
  };
  while (i < line.length) {
    const ch = line[i];
    if (ch === '#') {
      flush(COLORS.cream);
      runs.push({ text: line.slice(i), color: COLORS.comment });
      return runs;
    }
    if (ch === '"' || ch === "'") {
      flush(COLORS.cream);
      const end = line.indexOf(ch, i + 1);
      const stop = end === -1 ? line.length : end + 1;
      runs.push({ text: line.slice(i, stop), color: COLORS.string });
      i = stop;
      continue;
    }
    buffer += ch;
    i += 1;
  }
  flush(COLORS.cream);
  return runs;
}

/** Python code as text runs, one paragraph per line. `plain` skips highlighting (for output). */
export function codeRuns(code, { plain = false, color = COLORS.cream } = {}) {
  const lines = code.split('\n');
  return lines.flatMap((line, li) => {
    const parts = plain ? [{ text: line, color }] : tokenizeLine(line);
    const safe = parts.length ? parts : [{ text: ' ', color }];
    return safe.map((part, pi) => ({
      text: part.text,
      options: { color: part.color, breakLine: pi === safe.length - 1 && li < lines.length - 1 },
    }));
  });
}

export function codeBlock(slide, { x, y, w, h, code, label, plain = false, fontSize = 22, fill = COLORS.greenDeep }) {
  panel(slide, { x, y, w, h, fill });
  let top = y + 0.25;
  if (label) {
    slide.addText(label.toUpperCase(), {
      x: x + 0.4, y: top, w: w - 0.8, h: 0.3,
      fontFace: FONTS.body, fontSize: 12, bold: true, color: COLORS.comment, charSpacing: 2, margin: 0, isTextBox: true,
    });
    top += 0.4;
  }
  slide.addText(codeRuns(code, { plain, color: plain ? COLORS.gold : COLORS.cream }), {
    x: x + 0.4, y: top, w: w - 0.8, h: y + h - top - 0.2,
    fontFace: FONTS.mono, fontSize, margin: 0, valign: 'top', lineSpacingMultiple: 1.25, fit: 'shrink', isTextBox: true,
  });
}

export function notes(slide, text) {
  if (text) slide.addNotes(text);
}
