/**
 * Validation rules shared by the submit form.
 * apps-script/Code.gs enforces the same limits on the server —
 * keep the two in sync.
 */
export const LIMITS = {
  nameMax: 40,
  codeMaxChars: 50_000,
  noteMax: 500,
  fileMaxBytes: 100_000,
  passcodeMax: 64,
} as const;

export const NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u;
export const ALLOWED_FILE_EXTENSIONS = ['.py', '.txt'] as const;
export const GRADES = [7, 8, 9, 10] as const;

export interface SubmissionPayload {
  firstName: string;
  lastName: string;
  grade: number;
  week: number;
  code: string;
  note: string;
  passcode: string;
}

export interface SubmissionResult {
  success: boolean;
  data?: { path: string; late: boolean; resubmission: boolean };
  error?: string;
}

export type FieldErrors = Partial<Record<keyof SubmissionPayload, string>>;

export function validateSubmission(payload: SubmissionPayload, validWeeks: number[]): FieldErrors {
  const errors: FieldErrors = {};
  const nameError = (value: string) => {
    if (!value) return 'Please fill this in.';
    if (value.length > LIMITS.nameMax) return `Keep it under ${LIMITS.nameMax} characters.`;
    if (!NAME_PATTERN.test(value)) return 'Use letters only (spaces, - and ’ are OK).';
    return undefined;
  };

  const firstName = nameError(payload.firstName);
  const lastName = nameError(payload.lastName);
  if (firstName) errors.firstName = firstName;
  if (lastName) errors.lastName = lastName;
  if (!GRADES.includes(payload.grade as (typeof GRADES)[number])) errors.grade = 'Pick your grade.';
  if (!validWeeks.includes(payload.week)) errors.week = 'Pick which week you are submitting.';
  if (!payload.code.trim()) errors.code = 'Paste your code or choose a file.';
  else if (payload.code.length > LIMITS.codeMaxChars) errors.code = 'That code is too long. Is it the right file?';
  if (payload.note.length > LIMITS.noteMax) errors.note = `Keep the note under ${LIMITS.noteMax} characters.`;
  if (!payload.passcode) errors.passcode = 'Ask your teacher for the class passcode.';
  else if (payload.passcode.length > LIMITS.passcodeMax) errors.passcode = 'That passcode is too long.';
  return errors;
}
