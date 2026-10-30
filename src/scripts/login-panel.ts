import { portalApi, session, type Session } from '../lib/portal-api';
import { normalizeStudentCode, type LoginData } from '../lib/submission-rules';

interface LoginOptions {
  endpoint: string;
  onLogin: (session: Session, data: LoginData) => void;
}

/** Wires a <LoginPanel> form: formats the code as you type, logs in, saves the session. */
export function initLoginPanel(form: HTMLFormElement, { endpoint, onLogin }: LoginOptions): void {
  const input = form.querySelector<HTMLInputElement>('input[name="studentCode"]');
  const remember = form.querySelector<HTMLInputElement>('input[name="remember"]');
  const error = form.querySelector<HTMLElement>('.err');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const label = button?.querySelector<HTMLElement>('.label');
  if (!input || !remember || !error || !button || !label) return;
  const idleLabel = label.textContent ?? 'Log in';

  const showError = (message: string) => {
    error.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) input.focus();
  };

  // Auto-insert the dash: "kqm4827" -> "KQM-4827".
  input.addEventListener('input', () => {
    const compact = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    input.value = compact.length > 3 ? `${compact.slice(0, 3)}-${compact.slice(3)}` : compact;
    if (error.textContent) showError('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const studentCode = normalizeStudentCode(input.value);
    if (!studentCode) {
      showError('That doesn’t look like a student code. It should be 3 letters and 4 numbers.');
      return;
    }
    button.disabled = true;
    label.textContent = 'Checking…';
    const result = await portalApi.login(endpoint, studentCode);
    button.disabled = false;
    label.textContent = idleLabel;

    if (!result.success || !result.data) {
      showError(result.error ?? 'Please try again.');
      return;
    }
    const saved: Session = { studentCode, student: result.data.student };
    session.save(saved, remember.checked);
    input.value = '';
    onLogin(saved, result.data);
  });

  button.disabled = false;
}
