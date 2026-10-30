import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** YAML turns unquoted 2026-10-30 into a Date; normalize both forms to 'YYYY-MM-DD'. */
const isoDate = z.union([
  z.date().transform((date) => date.toISOString().slice(0, 10)),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
]);

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: z.object({
    week: z.number().int().min(1).max(60),
    title: z.string(),
    date: isoDate,
    unit: z.string(),
    summary: z.string(),
    objectives: z.array(z.string()).default([]),
    slides: z.url().optional(),
    assignment: z
      .object({
        title: z.string(),
        due: isoDate,
        summary: z.string(),
        required: z.array(z.string()).min(1),
        bonus: z.string().optional(),
      })
      .optional(),
  }),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: z.object({
    title: z.string(),
    date: isoDate,
    pinned: z.boolean().default(false),
  }),
});

const showcase = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/showcase' }),
  schema: z.object({
    title: z.string(),
    student: z.string().max(40), // first name only
    grade: z.number().int().min(6).max(12).optional(),
    week: z.number().int().optional(),
    date: isoDate,
    draft: z.boolean().default(false),
  }),
});

export const collections = { lessons, announcements, showcase };
