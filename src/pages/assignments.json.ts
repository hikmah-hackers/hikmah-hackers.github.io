import type { APIRoute } from 'astro';
import { getAllLessons, isReleased } from '../lib/content';

/**
 * Machine-readable list of released assignments.
 * The Apps Script submission handler fetches this to check the week
 * exists and to decide whether a submission is late.
 */
export const GET: APIRoute = async () => {
  const lessons = await getAllLessons();
  const assignments = lessons
    .filter((lesson) => isReleased(lesson) && lesson.data.assignment)
    .map((lesson) => ({
      week: lesson.data.week,
      title: lesson.data.assignment!.title,
      due: lesson.data.assignment!.due,
    }));

  return new Response(JSON.stringify({ success: true, data: assignments }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
