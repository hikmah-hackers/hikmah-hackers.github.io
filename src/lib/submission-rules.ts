/**
 * Validation rules and API types shared by the portal and submit form.
 * apps-script/*.gs enforces the same limits on the server. Keep them in sync.
 */
export const LIMITS = {
  codeMaxChars: 50_000,
  noteMax: 500,
  fileMaxBytes: 100_000,
} as const;

export const ALLOWED_FILE_EXTENSIONS = ['.py', '.txt'] as const;

/** Codes look like KQM-4827: no I, O, 0 or 1 so they're easy to read off a card. */
const STUDENT_CODE_PATTERN = /^[A-HJ-NP-Z]{3}-[2-9]{4}$/;

/** "kqm 4827" / "KQM4827" -> "KQM-4827"; anything else -> "". Mirrors Roster.gs. */
export function normalizeStudentCode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const formatted = `${compact.slice(0, 3)}-${compact.slice(3)}`;
  return STUDENT_CODE_PATTERN.test(formatted) ? formatted : '';
}

export interface WorkPayload {
  week: number;
  code: string;
  note: string;
}

export type FieldErrors = Partial<Record<keyof WorkPayload, string>>;

export function validateWork(payload: WorkPayload, validWeeks: number[]): FieldErrors {
  const errors: FieldErrors = {};
  if (!validWeeks.includes(payload.week)) errors.week = 'Pick which week you are submitting.';
  if (!payload.code.trim()) errors.code = 'Paste your code or choose a file.';
  else if (payload.code.length > LIMITS.codeMaxChars) errors.code = 'That code is too long. Is it the right file?';
  if (payload.note.length > LIMITS.noteMax) errors.note = `Keep the note under ${LIMITS.noteMax} characters.`;
  return errors;
}

/* ---------- API shapes (see apps-script/Code.gs) ---------- */

export interface Student {
  firstName: string;
  lastName: string;
  grade: number | '';
}

export interface SubmissionSummary {
  week: number;
  submittedAt: string;
  late: boolean;
  attempts: number;
  feedback: string;
}

export interface LoginData {
  student: Student;
  submissions: SubmissionSummary[];
}

export interface SubmitData {
  path: string;
  late: boolean;
  resubmission: boolean;
}

export interface CodeData {
  week: number;
  code: string;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/* ---------- Admin API shapes (see apps-script/Admin.gs) ---------- */

export const FEEDBACK_MAX = 2000;

export interface RosterEntry {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  grade: string;
  active: boolean;
  emailed: string;
}

export interface SubmissionRow {
  submittedAt: string;
  week: number;
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  late: boolean;
  resubmission: boolean;
  note: string;
  feedback: string;
}

export interface AdminOverview {
  roster: RosterEntry[];
  submissions: SubmissionRow[];
  sheetUrl: string;
}
