import {
  ALLOWED_FILE_EXTENSIONS,
  LIMITS,
  validateSubmission,
  type FieldErrors,
  type SubmissionPayload,
  type SubmissionResult,
} from '../lib/submission-rules';

const REQUEST_TIMEOUT_MS = 25_000;
const SERVER_PROBLEM = 'The submission server had a problem. Please tell your teacher.';
const PROFILE_KEY = 'hh:profile';
const draftKey = (week: number) => `hh:draft:week-${week}`;

/** localStorage can be blocked on managed Chromebooks; never let that break the form. */
const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable: drafts just won't persist */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

function field<T extends HTMLElement>(form: HTMLFormElement, name: string): T {
  const el = form.elements.namedItem(name);
  if (!el) throw new Error(`Missing form field: ${name}`);
  return el as unknown as T;
}

/** Curly apostrophes (O’Brien) are stored as straight ones. */
const normalizeName = (name: string) => name.trim().replace(/’/g, "'");

function readPayload(form: HTMLFormElement): SubmissionPayload {
  const value = (name: string) => field<HTMLInputElement>(form, name).value;
  return {
    firstName: normalizeName(value('firstName')),
    lastName: normalizeName(value('lastName')),
    grade: Number(value('grade')),
    week: Number(value('week')),
    code: value('code').replace(/\r\n/g, '\n'),
    note: value('note').trim(),
    passcode: value('passcode').trim(),
  };
}

function showErrors(form: HTMLFormElement, errors: FieldErrors): void {
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((slot) => {
    const name = slot.dataset.errorFor as keyof SubmissionPayload;
    const message = errors[name] ?? '';
    slot.textContent = message;
    field<HTMLInputElement>(form, name).setAttribute('aria-invalid', message ? 'true' : 'false');
  });
  const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  firstInvalid?.focus();
}

function setStatus(box: HTMLElement, kind: 'success' | 'error' | 'info', title: string, detail = ''): void {
  box.hidden = false;
  box.dataset.kind = kind;
  box.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = title;
  box.append(heading);
  if (detail) {
    const body = document.createElement('p');
    body.textContent = detail;
    box.append(body);
  }
  box.focus();
}

async function postSubmission(endpoint: string, payload: SubmissionPayload): Promise<SubmissionResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // text/plain avoids a CORS preflight, which Apps Script can't answer.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return { success: false, error: SERVER_PROBLEM };
    try {
      return (await response.json()) as SubmissionResult;
    } catch {
      // An HTML reply usually means the Apps Script deployment isn't public.
      return { success: false, error: SERVER_PROBLEM };
    }
  } catch {
    return { success: false, error: 'Could not reach the server. Check your internet and try again.' };
  } finally {
    window.clearTimeout(timer);
  }
}

function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function wireFileInput(form: HTMLFormElement, codeBox: HTMLTextAreaElement): void {
  const fileInput = field<HTMLInputElement>(form, 'file');
  const errorSlot = form.querySelector<HTMLElement>('[data-error-for="code"]');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file || !errorSlot) return;
    if (!hasAllowedExtension(file.name)) {
      errorSlot.textContent = 'Choose a .py or .txt file.';
      return;
    }
    if (file.size > LIMITS.fileMaxBytes) {
      errorSlot.textContent = 'That file is too big. Is it the right one?';
      return;
    }
    try {
      codeBox.value = await file.text();
      codeBox.dispatchEvent(new Event('input'));
      errorSlot.textContent = '';
    } catch {
      errorSlot.textContent = 'Couldn’t read that file. Try copying and pasting the code instead.';
    }
  });
}

/** Each week keeps its own draft; switching weeks swaps the code box contents. */
function wireDrafts(form: HTMLFormElement, codeBox: HTMLTextAreaElement): void {
  const weekSelect = field<HTMLSelectElement>(form, 'week');
  let currentWeek = Number(weekSelect.value);
  codeBox.value = storage.get(draftKey(currentWeek)) ?? '';

  weekSelect.addEventListener('change', () => {
    storage.set(draftKey(currentWeek), codeBox.value);
    currentWeek = Number(weekSelect.value);
    codeBox.value = storage.get(draftKey(currentWeek)) ?? '';
  });
  codeBox.addEventListener('input', () => storage.set(draftKey(currentWeek), codeBox.value));
}

function restoreProfile(form: HTMLFormElement): void {
  const saved = storage.get(PROFILE_KEY);
  if (!saved) return;
  try {
    const profile = JSON.parse(saved) as Partial<Record<'firstName' | 'lastName' | 'grade', string>>;
    (['firstName', 'lastName', 'grade'] as const).forEach((name) => {
      const value = profile[name];
      if (typeof value === 'string') field<HTMLInputElement>(form, name).value = value;
    });
  } catch {
    storage.remove(PROFILE_KEY);
  }
}

function preselectWeek(form: HTMLFormElement): void {
  const week = new URLSearchParams(window.location.search).get('week');
  const select = field<HTMLSelectElement>(form, 'week');
  if (week && [...select.options].some((option) => option.value === week)) select.value = week;
}

export function initSubmitForm(form: HTMLFormElement): void {
  const endpoint = form.dataset.endpoint ?? '';
  const validWeeks = (form.dataset.weeks ?? '').split(',').filter(Boolean).map(Number);
  const status = document.getElementById('submit-status');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const buttonLabel = button?.querySelector<HTMLElement>('.label');
  if (!status || !button || !buttonLabel) return;
  const codeBox = field<HTMLTextAreaElement>(form, 'code');
  const idleLabel = buttonLabel.textContent ?? 'Submit';

  restoreProfile(form);
  preselectWeek(form);
  wireDrafts(form, codeBox);
  wireFileInput(form, codeBox);
  button.disabled = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readPayload(form);
    const errors = validateSubmission(payload, validWeeks);
    showErrors(form, errors);
    if (Object.keys(errors).length > 0) return;

    if (!endpoint) {
      setStatus(status, 'info', 'Submissions aren’t open yet.', 'Save your code in your Google Doc for now.');
      return;
    }

    button.disabled = true;
    buttonLabel.textContent = 'Sending…';
    const result = await postSubmission(endpoint, payload);
    button.disabled = false;
    buttonLabel.textContent = idleLabel;

    if (!result.success || !result.data) {
      setStatus(status, 'error', 'That didn’t go through.', result.error ?? 'Please try again.');
      return;
    }

    storage.set(PROFILE_KEY, JSON.stringify({ firstName: payload.firstName, lastName: payload.lastName, grade: String(payload.grade) }));
    storage.remove(draftKey(payload.week));
    const { late, resubmission } = result.data;
    const detail = [
      resubmission ? 'This replaced your earlier submission.' : 'Your teacher will see it.',
      late ? 'It was after the due date, so it’s marked late. That’s OK!' : '',
    ]
      .filter(Boolean)
      .join(' ');
    setStatus(status, 'success', `Submitted! Week ${payload.week} is in.`, detail);
    field<HTMLTextAreaElement>(form, 'code').value = '';
    field<HTMLInputElement>(form, 'note').value = '';
    field<HTMLInputElement>(form, 'file').value = '';
  });
}
