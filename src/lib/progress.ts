import type { SubmissionSummary } from './submission-rules';

export interface AssignmentInfo {
  week: number;
  title: string;
  due: string;
}

export type WeekStatus = 'done' | 'late' | 'missing' | 'open';

export interface WeekTile extends AssignmentInfo {
  status: WeekStatus;
  submission?: SubmissionSummary;
}

export interface ProgressStats {
  done: number;
  total: number;
  late: number;
  streak: number;
}

export const STATUS_LABEL: Record<WeekStatus, string> = {
  done: 'Done',
  late: 'Done (late)',
  missing: 'Missing',
  open: 'Open',
};

function statusFor(assignment: AssignmentInfo, submission: SubmissionSummary | undefined, today: string): WeekStatus {
  if (submission) return submission.late ? 'late' : 'done';
  return today <= assignment.due ? 'open' : 'missing';
}

export function buildTiles(assignments: AssignmentInfo[], submissions: SubmissionSummary[], today: string): WeekTile[] {
  const byWeek = new Map(submissions.map((s) => [s.week, s]));
  return [...assignments]
    .sort((a, b) => a.week - b.week)
    .map((assignment) => {
      const submission = byWeek.get(assignment.week);
      return { ...assignment, submission, status: statusFor(assignment, submission, today) };
    });
}

/** Streak = weeks in a row turned in, counting back from the newest (open weeks don't break it). */
export function computeStats(tiles: WeekTile[]): ProgressStats {
  const isTurnedIn = (tile: WeekTile) => tile.status === 'done' || tile.status === 'late';
  const newestFirst = [...tiles].reverse();
  const firstNotOpen = newestFirst.findIndex((tile) => tile.status !== 'open');
  const counted = firstNotOpen === -1 ? [] : newestFirst.slice(firstNotOpen);
  const firstGap = counted.findIndex((tile) => !isTurnedIn(tile));
  return {
    done: tiles.filter(isTurnedIn).length,
    total: tiles.length,
    late: tiles.filter((t) => t.status === 'late').length,
    streak: firstGap === -1 ? counted.length : firstGap,
  };
}

/** Today's date (YYYY-MM-DD) in the class time zone, in the browser. */
export function todayInClassZone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
