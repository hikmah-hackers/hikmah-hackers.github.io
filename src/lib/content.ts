import { getCollection, type CollectionEntry } from 'astro:content';
import { todayISO } from './dates';

export type Lesson = CollectionEntry<'lessons'>;
export type Announcement = CollectionEntry<'announcements'>;
export type ShowcaseItem = CollectionEntry<'showcase'>;

/** In `astro dev` you see everything; the live site only shows what's due. */
const PREVIEW = import.meta.env.DEV;

export const lessonSlug = (lesson: Lesson) => `week-${String(lesson.data.week).padStart(2, '0')}`;
export const weekLabel = (week: number) => `Week ${week}`;

export function isReleased(lesson: Lesson, today = todayISO()): boolean {
  return lesson.data.date <= today;
}

export async function getAllLessons(): Promise<Lesson[]> {
  const lessons = await getCollection('lessons');
  const weeks = lessons.map((lesson) => lesson.data.week);
  const duplicate = weeks.find((week, i) => weeks.indexOf(week) !== i);
  if (duplicate !== undefined) throw new Error(`Two lesson files both say week: ${duplicate}. Each week needs its own number.`);
  return [...lessons].sort((a, b) => a.data.week - b.data.week);
}

/** Lessons whose pages get built: released ones (plus all of them in dev). */
export async function getPublishedLessons(): Promise<Lesson[]> {
  const lessons = await getAllLessons();
  return PREVIEW ? lessons : lessons.filter((lesson) => isReleased(lesson));
}

export async function getCurrentLesson(): Promise<Lesson | undefined> {
  const released = (await getAllLessons()).filter((lesson) => isReleased(lesson));
  return released.at(-1);
}

export async function getNextLesson(): Promise<Lesson | undefined> {
  return (await getAllLessons()).find((lesson) => !isReleased(lesson));
}

export async function getAssignments(): Promise<Lesson[]> {
  const lessons = await getPublishedLessons();
  return lessons.filter((lesson) => lesson.data.assignment).reverse();
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const today = todayISO();
  const items = await getCollection('announcements', (a) => PREVIEW || a.data.date <= today);
  return [...items].sort(
    (a, b) => Number(b.data.pinned) - Number(a.data.pinned) || b.data.date.localeCompare(a.data.date),
  );
}

export async function getShowcase(): Promise<ShowcaseItem[]> {
  const items = await getCollection('showcase', (item) => PREVIEW || !item.data.draft);
  return [...items].sort((a, b) => b.data.date.localeCompare(a.data.date));
}
