import { storage } from './storage';
import type { ApiResult, CodeData, LoginData, Student, SubmitData, WorkPayload } from './submission-rules';

const REQUEST_TIMEOUT_MS = 25_000;
const SESSION_KEY = 'hh:session';
const SERVER_PROBLEM = 'The class server had a problem. Please tell your teacher.';
const OFFLINE = 'Could not reach the server. Check your internet and try again.';

/* ---------- Session: the student code is the login ---------- */

export interface Session {
  studentCode: string;
  student: Student;
}

function readSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    return typeof parsed.studentCode === 'string' && parsed.student ? parsed : null;
  } catch {
    return null;
  }
}

export const session = {
  get(): Session | null {
    return readSession(storage.get(SESSION_KEY, 'session')) ?? readSession(storage.get(SESSION_KEY, 'local'));
  },
  /** `remember` keeps the login after the browser closes (fine on a student's own Chromebook). */
  save(value: Session, remember: boolean): void {
    const json = JSON.stringify(value);
    storage.set(SESSION_KEY, json, 'session');
    if (remember) storage.set(SESSION_KEY, json, 'local');
    else storage.remove(SESSION_KEY, 'local');
  },
  clear(): void {
    storage.remove(SESSION_KEY, 'session');
    storage.remove(SESSION_KEY, 'local');
  },
};

/* ---------- Calls to the Apps Script ---------- */

async function call<T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  if (!endpoint) return { success: false, error: 'The class portal isn’t open yet.' };
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // text/plain avoids a CORS preflight, which Apps Script can't answer.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return { success: false, error: SERVER_PROBLEM };
    try {
      return (await response.json()) as ApiResult<T>;
    } catch {
      return { success: false, error: SERVER_PROBLEM };
    }
  } catch {
    return { success: false, error: OFFLINE };
  } finally {
    window.clearTimeout(timer);
  }
}

export const portalApi = {
  login: (endpoint: string, studentCode: string) => call<LoginData>(endpoint, { action: 'login', studentCode }),
  submit: (endpoint: string, studentCode: string, work: WorkPayload) =>
    call<SubmitData>(endpoint, { action: 'submit', studentCode, ...work }),
  getCode: (endpoint: string, studentCode: string, week: number) =>
    call<CodeData>(endpoint, { action: 'getCode', studentCode, week }),
};
