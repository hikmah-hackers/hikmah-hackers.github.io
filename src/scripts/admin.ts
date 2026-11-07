import { adminApi, adminSession } from '../lib/portal-api';
import { FEEDBACK_MAX, type AdminOverview, type RosterEntry, type SubmissionRow } from '../lib/submission-rules';
import { el, formatDateTime } from './dom';

/** The latest submission for each student and week: the one that counts, and the one feedback goes on. */
function latestPerWeek(rows: SubmissionRow[]): (SubmissionRow & { attempts: number })[] {
  const groups = new Map<string, SubmissionRow[]>();
  rows.forEach((row) => {
    const key = `${row.studentId}|${row.week}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });
  return [...groups.values()]
    .map((group) => {
      const sorted = [...group].sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
      const feedback = [...sorted].reverse().find((row) => row.feedback.trim())?.feedback ?? '';
      return { ...sorted[sorted.length - 1], feedback, attempts: sorted.length };
    })
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}

function renderStats(root: HTMLElement, data: AdminOverview, latest: SubmissionRow[]): void {
  const active = data.roster.filter((s) => s.active && s.firstName);
  const emailed = active.filter((s) => s.emailed).length;
  const waiting = latest.filter((row) => !row.feedback.trim()).length;
  const stat = (value: string, label: string) => el('div', { class: 'stat' }, [el('strong', {}, [value]), el('span', {}, [label])]);
  root.replaceChildren(
    stat(String(active.length), 'students'),
    stat(String(latest.length), 'projects turned in'),
    stat(String(waiting), 'waiting for feedback'),
    stat(`${emailed}/${active.length}`, 'codes emailed'),
  );
}

function codeToggle(endpoint: string, adminCode: string, row: SubmissionRow): HTMLElement {
  const box = el('pre', { class: 'code', hidden: '' });
  const button = el('button', { type: 'button', class: 'btn btn-ghost small' }, ['Show code']);
  button.addEventListener('click', async () => {
    if (!box.hidden) {
      box.hidden = true;
      button.textContent = 'Show code';
      return;
    }
    if (!box.textContent) {
      button.textContent = 'Loading…';
      const result = await adminApi.getCode(endpoint, adminCode, row.studentId, row.week);
      box.textContent = result.success && result.data ? result.data.code : (result.error ?? 'Could not load the code.');
    }
    box.hidden = false;
    button.textContent = 'Hide code';
  });
  return el('div', { class: 'code-wrap' }, [button, box]);
}

function feedbackForm(endpoint: string, adminCode: string, row: SubmissionRow): HTMLElement {
  const id = `fb-${row.studentId}-${row.week}`;
  const textarea = el('textarea', { id, rows: '3', maxlength: String(FEEDBACK_MAX), placeholder: 'Write a note the student will see on their My work page…' });
  textarea.value = row.feedback;
  const status = el('small', { class: 'save-status', 'aria-live': 'polite' });
  const button = el('button', { type: 'submit', class: 'btn btn-gold small' }, ['Save feedback']);
  const form = el('form', { class: 'feedback-form', action: 'javascript:void 0' }, [
    el('label', { for: id }, ['Feedback']),
    textarea,
    el('div', { class: 'row' }, [button, status]),
  ]);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = 'Saving…';
    const result = await adminApi.saveFeedback(endpoint, adminCode, row.studentId, row.week, textarea.value);
    button.disabled = false;
    status.textContent = result.success ? 'Saved ✓' : (result.error ?? 'Could not save.');
    if (result.success) row.feedback = textarea.value.trim();
  });
  return form;
}

function renderWork(root: HTMLElement, endpoint: string, adminCode: string, rows: SubmissionRow[]): void {
  if (rows.length === 0) {
    root.replaceChildren(el('div', { class: 'empty' }, ['Nothing here yet.']));
    return;
  }
  root.replaceChildren(
    ...rows.map((row) =>
      el('article', { class: 'card sub' }, [
        el('div', { class: 'sub-head' }, [
          el('span', { class: 'meta' }, [`Week ${row.week}${row.grade ? ` · Grade ${row.grade}` : ''}`]),
          row.late ? el('span', { class: 'chip chip-due-soon' }, ['Late']) : el('span', { class: 'chip chip-open' }, ['On time']),
        ]),
        el('h3', {}, [`${row.firstName} ${row.lastName}`]),
        el('p', { class: 'when' }, [`Turned in ${formatDateTime(row.submittedAt)}`]),
        row.note ? el('p', { class: 'note' }, [el('strong', {}, ['Note: ']), row.note]) : null,
        codeToggle(endpoint, adminCode, row),
        feedbackForm(endpoint, adminCode, row),
      ]),
    ),
  );
}

function renderRoster(root: HTMLElement, roster: RosterEntry[], latest: SubmissionRow[]): void {
  const named = roster.filter((s) => s.firstName).sort((a, b) => a.lastName.localeCompare(b.lastName));
  if (named.length === 0) {
    root.replaceChildren(el('div', { class: 'empty' }, ['No students on the Roster yet.']));
    return;
  }
  const turnedIn = (id: string) => latest.filter((row) => row.studentId === id).length;
  const head = el('tr', {}, ['Name', 'Grade', 'Code', 'Turned in', 'Code emailed', 'Status'].map((h) => el('th', { scope: 'col' }, [h])));
  const body = named.map((s) =>
    el('tr', { class: s.active ? '' : 'inactive' }, [
      el('td', {}, [`${s.firstName} ${s.lastName}`]),
      el('td', {}, [s.grade]),
      el('td', { class: 'mono' }, [s.code || '—']),
      el('td', {}, [String(turnedIn(s.id))]),
      el('td', { class: 'small-text' }, [s.emailed || 'Not yet']),
      el('td', {}, [s.active ? 'Active' : 'Off']),
    ]),
  );
  root.replaceChildren(el('div', { class: 'table-scroll' }, [el('table', {}, [el('thead', {}, [head]), el('tbody', {}, body)])]));
}

export function initAdmin(endpoint: string): void {
  const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const form = byId<HTMLFormElement>('admin-gate');
  const gate = form;
  const dash = byId('admin-dash');
  const loading = byId('admin-loading');
  const input = byId<HTMLInputElement>('f-admin-code');
  const error = byId('admin-error');
  const weekFilter = byId<HTMLSelectElement>('admin-week');
  const needsFeedback = byId<HTMLInputElement>('admin-needs-feedback');
  let latest: SubmissionRow[] = [];
  let adminCode = '';

  const showGate = (message = '') => {
    dash.hidden = true;
    loading.hidden = true;
    gate.hidden = false;
    error.textContent = message;
  };

  const renderFiltered = () => {
    const week = Number(weekFilter.value);
    const rows = latest.filter((row) => (!week || row.week === week) && (!needsFeedback.checked || !row.feedback.trim()));
    renderWork(byId('admin-work'), endpoint, adminCode, rows);
  };

  const load = async (code: string): Promise<boolean> => {
    gate.hidden = true;
    loading.hidden = false;
    const result = await adminApi.overview(endpoint, code);
    if (!result.success || !result.data) {
      showGate(result.error ?? 'Please try again.');
      return false;
    }
    adminCode = code;
    const data = result.data;
    latest = latestPerWeek(data.submissions);
    renderStats(byId('admin-stats'), data, latest);
    renderRoster(byId('admin-roster'), data.roster, latest);
    const weeks = [...new Set(latest.map((row) => row.week))].sort((a, b) => b - a);
    weekFilter.replaceChildren(el('option', { value: '' }, ['All weeks']), ...weeks.map((w) => el('option', { value: String(w) }, [`Week ${w}`])));
    byId<HTMLAnchorElement>('admin-sheet').href = data.sheetUrl;
    renderFiltered();
    loading.hidden = true;
    dash.hidden = false;
    return true;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (!code) return showGate('Type your admin code.');
    if (await load(code)) {
      adminSession.save(code);
      input.value = '';
    }
  });
  weekFilter.addEventListener('change', renderFiltered);
  needsFeedback.addEventListener('change', renderFiltered);
  byId('admin-refresh').addEventListener('click', () => load(adminCode));
  byId('admin-logout').addEventListener('click', () => {
    adminSession.clear();
    adminCode = '';
    showGate();
  });

  form.querySelector('button')?.removeAttribute('disabled');
  const saved = adminSession.get();
  if (saved) void load(saved);
  else showGate();
}
