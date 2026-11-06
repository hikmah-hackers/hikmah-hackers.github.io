/**
 * Hikmah Hackers deck theme, matched to the Week 1 deck.
 * Fonts are ones every Windows/Office machine has, so decks look the same on any classroom PC.
 */
export const COLORS = {
  green: '0E3B2E',
  greenCard: '174A3B',
  greenDeep: '0A2A21',
  greenLine: '245C4A',
  cream: 'F3EBDD',
  creamCard: 'FBF7EF',
  creamLine: 'E2D6BF',
  creamHead: 'E6DCC9',
  gold: 'D4A84B',
  goldInk: '7A5A1C',
  string: 'E8C26A',
  comment: '8FB3A5',
  mint: 'C9D6CF',
  inkSoft: '3F5A50',
  danger: '9A3412',
};

export const FONTS = {
  head: 'Arial',
  body: 'Calibri',
  mono: 'Consolas',
};

/** 16:9 widescreen, in inches. */
export const PAGE = {
  w: 13.333,
  h: 7.5,
  marginX: 0.9,
  contentW: 13.333 - 1.8,
  eyebrowY: 0.8,
  titleY: 1.1,
  contentY: 2.3,
  footerY: 6.75,
};

/** Background and text colors for each slide tone. */
export const TONES = {
  dark: { bg: COLORS.green, title: COLORS.cream, body: COLORS.mint, eyebrow: COLORS.gold, card: COLORS.greenCard, footer: COLORS.mint },
  light: { bg: COLORS.cream, title: COLORS.green, body: COLORS.inkSoft, eyebrow: COLORS.goldInk, card: COLORS.creamCard, footer: COLORS.inkSoft },
  gold: { bg: COLORS.gold, title: COLORS.green, body: COLORS.green, eyebrow: COLORS.green, card: COLORS.cream, footer: COLORS.green },
};
