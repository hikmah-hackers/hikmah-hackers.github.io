import { portalApi, session, type Session } from '../lib/portal-api';
import { storage } from '../lib/storage';
import { ALLOWED_FILE_EXTENSIONS, LIMITS, validateWork, type FieldErrors, type WorkPayload } from '../lib/submission-rules';
import { initLoginPanel } from './login-panel';

const draftKey = (week: number) => `hh:draft:week-${week}`;

function field<T extends HTMLElement>(form: HTMLFormElement, name: string): T {
  const el = form.elements.namedItem(name);
  if (!el) throw new Error(`Missing form field: ${name}`);
  return el as unknown as T;
}

function readWork(form: HTMLFormElement): WorkPayload {
  return {
    week: Number(field<HTMLSelectElement>(form, 'week').value),
    code: field<HTMLTextAreaElement>(form, 'code').value.replace(/\r\n/g, '\n'),
    note: field<HTMLInputElement>(form, 'note').value.trim(),
  };
}

function showErrors(form: HTMLFormElement, errors: FieldErrors): void {
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((slot) => {
    const name = slot.dataset.errorFor as keyof WorkPayload;
    const message = errors[name] ?? '';
    slot.textContent = message;
    field<HTMLElement>(form, name).setAttribute('aria-invalid', message ? 'true' : 'false');
  });
  form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

function setStatus(box: HTMLElement, kind: 'success' | 'error', title: string, detail = ''): void {
  box.hidden = false;
  box.dataset.kind = kind;
  const heading = document.createElement('strong');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = detail;
  box.replaceChildren(heading, ...(detail ? [body] : []));
  box.focus();
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

function preselectWeek(form: HTMLFormElement): void {
  const week = new URLSearchParams(window.location.search).get('week');
  const select = field<HTMLSelectElement>(form, 'week');
  if (week && [...select.options].some((option) => option.value === week)) select.value = week;
}

function showForm(form: HTMLFormElement, gate: HTMLElement, current: Session): void {
  const who = form.querySelector<HTMLElement>('[data-student-name]');
  if (who) who.textContent = `${current.student.firstName} ${current.student.lastName}`;
  gate.hidden = true;
  form.hidden = false;
}

export function initSubmitForm(form: HTMLFormElement, gate: HTMLElement): void {
  const endpoint = form.dataset.endpoint ?? '';
  const validWeeks = (form.dataset.weeks ?? '').split(',').filter(Boolean).map(Number);
  const status = document.getElementById('submit-status');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const buttonLabel = button?.querySelector<HTMLElement>('.label');
  const gateForm = gate.querySelector<HTMLFormElement>('[data-login-panel]');
  if (!status || !button || !buttonLabel || !gateForm) return;
  const codeBox = field<HTMLTextAreaElement>(form, 'code');
  const idleLabel = buttonLabel.textContent ?? 'Submit';

  preselectWeek(form);
  wireDrafts(form, codeBox);
  wireFileInput(form, codeBox);
  initLoginPanel(gateForm, { endpoint, onLogin: (s) => showForm(form, gate, s) });
  form.querySelector('[data-logout]')?.addEventListener('click', () => {
    session.clear();
    form.hidden = true;
    gate.hidden = false;
  });

  const saved = session.get();
  if (saved) showForm(form, gate, saved);
  else gate.hidden = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const current = session.get();
    if (!current) {
      form.hidden = true;
      gate.hidden = false;
      return;
    }
    const work = readWork(form);
    const errors = validateWork(work, validWeeks);
    showErrors(form, errors);
    if (Object.keys(errors).length > 0) return;

    button.disabled = true;
    buttonLabel.textContent = 'Sending…';
    const result = await portalApi.submit(endpoint, current.studentCode, work);
    button.disabled = false;
    buttonLabel.textContent = idleLabel;

    if (!result.success || !result.data) {
      setStatus(status, 'error', 'That didn’t go through.', result.error ?? 'Please try again.');
      return;
    }
    storage.remove(draftKey(work.week));
    const { late, resubmission } = result.data;
    const detail = [
      resubmission ? 'This replaced your earlier submission.' : 'Your teacher will see it.',
      late ? 'It was after the due date, so it’s marked late. That’s OK!' : '',
      'See it any time on your My work page.',
    ]
      .filter(Boolean)
      .join(' ');
    setStatus(status, 'success', `Submitted! Week ${work.week} is in.`, detail);
    codeBox.value = '';
    field<HTMLInputElement>(form, 'note').value = '';
    field<HTMLInputElement>(form, 'file').value = '';
  });
}
