import { portalApi, session, type Session } from '../lib/portal-api';
import { buildTiles, computeStats, STATUS_LABEL, todayInClassZone, type AssignmentInfo, type WeekTile } from '../lib/progress';
import type { LoginData } from '../lib/submission-rules';
import { el, formatDateTime, formatDue } from './dom';
import { initLoginPanel } from './login-panel';

interface PortalConfig {
  endpoint: string;
  timeZone: string;
  assignments: AssignmentInfo[];
}

const pad = (week: number) => String(week).padStart(2, '0');

function renderStats(root: HTMLElement, tiles: WeekTile[]): void {
  const stats = computeStats(tiles);
  const stat = (value: string, label: string) => el('div', { class: 'stat' }, [el('strong', {}, [value]), el('span', {}, [label])]);
  root.replaceChildren(
    stat(`${stats.done}/${stats.total}`, 'mini-projects turned in'),
    stat(String(stats.streak), stats.streak === 1 ? 'week streak' : 'weeks in a row'),
    stat(String(stats.late), stats.late === 1 ? 'late (still counts!)' : 'late (still count!)'),
  );
}

function renderTiles(root: HTMLElement, tiles: WeekTile[]): void {
  root.replaceChildren(
    ...tiles.map((tile) =>
      el('li', { class: `tile tile-${tile.status}` }, [
        el('span', { class: 'tile-wk' }, [`WK ${pad(tile.week)}`]),
        el('span', { class: 'tile-title' }, [tile.title]),
        el('span', { class: 'tile-status' }, [tile.status === 'open' ? `Due ${formatDue(tile.due)}` : STATUS_LABEL[tile.status]]),
      ]),
    ),
  );
}

function codeToggle(config: PortalConfig, current: Session, week: number): HTMLElement {
  const box = el('pre', { class: 'code', hidden: '' });
  const button = el('button', { type: 'button', class: 'btn btn-ghost small' }, ['Show my code']);
  button.addEventListener('click', async () => {
    if (!box.hidden) {
      box.hidden = true;
      button.textContent = 'Show my code';
      return;
    }
    if (!box.textContent) {
      button.textContent = 'Loading…';
      const result = await portalApi.getCode(config.endpoint, current.studentCode, week);
      box.textContent = result.success && result.data ? result.data.code : (result.error ?? 'Could not load your code.');
    }
    box.hidden = false;
    button.textContent = 'Hide code';
  });
  return el('div', { class: 'code-wrap' }, [button, box]);
}

function renderSubmissions(root: HTMLElement, tiles: WeekTile[], config: PortalConfig, current: Session): void {
  const turnedIn = tiles.filter((tile) => tile.submission).reverse();
  if (turnedIn.length === 0) {
    const firstOpen = tiles.find((tile) => tile.status === 'open' || tile.status === 'missing');
    root.replaceChildren(
      el('div', { class: 'empty' }, [
        el('p', {}, ['Nothing turned in yet. Your first mini-project is waiting!']),
        firstOpen ? el('a', { class: 'btn btn-gold', href: `/submit?week=${firstOpen.week}` }, [`Submit Week ${firstOpen.week} →`]) : null,
      ]),
    );
    return;
  }
  root.replaceChildren(
    ...turnedIn.map((tile) => {
      const sub = tile.submission!;
      const feedback = sub.feedback
        ? el('blockquote', { class: 'feedback' }, [el('span', {}, ['From your teacher']), el('p', {}, [sub.feedback])])
        : el('p', { class: 'no-feedback' }, ['No feedback yet.']);
      return el('article', { class: 'card sub' }, [
        el('div', { class: 'sub-head' }, [
          el('span', { class: 'meta' }, [`Week ${tile.week}`]),
          sub.late ? el('span', { class: 'chip chip-due-soon' }, ['Late']) : el('span', { class: 'chip chip-open' }, ['On time']),
        ]),
        el('h3', {}, [tile.title]),
        el('p', { class: 'when' }, [`Turned in ${formatDateTime(sub.submittedAt)}${sub.attempts > 1 ? ` · ${sub.attempts} tries` : ''}`]),
        feedback,
        el('div', { class: 'row' }, [
          codeToggle(config, current, tile.week),
          el('a', { class: 'link', href: `/submit?week=${tile.week}` }, ['Resubmit']),
        ]),
      ]);
    }),
  );
}

function showDashboard(config: PortalConfig, current: Session, data: LoginData): void {
  const tiles = buildTiles(config.assignments, data.submissions, todayInClassZone(config.timeZone));
  const byId = (id: string) => document.getElementById(id) as HTMLElement;
  byId('portal-name').textContent = current.student.firstName;
  renderStats(byId('portal-stats'), tiles);
  renderTiles(byId('portal-tiles'), tiles);
  renderSubmissions(byId('portal-subs'), tiles, config, current);
  byId('portal-gate').hidden = true;
  byId('portal-loading').hidden = true;
  byId('portal-dash').hidden = false;
}

function showGate(message = ''): void {
  (document.getElementById('portal-dash') as HTMLElement).hidden = true;
  (document.getElementById('portal-loading') as HTMLElement).hidden = true;
  (document.getElementById('portal-gate') as HTMLElement).hidden = false;
  const error = document.querySelector<HTMLElement>('#portal-gate .err');
  if (error) error.textContent = message;
}

export async function initPortal(config: PortalConfig): Promise<void> {
  const gateForm = document.querySelector<HTMLFormElement>('#portal-gate [data-login-panel]');
  if (gateForm) initLoginPanel(gateForm, { endpoint: config.endpoint, onLogin: (s, data) => showDashboard(config, s, data) });

  document.getElementById('portal-logout')?.addEventListener('click', () => {
    session.clear();
    showGate();
  });

  const saved = session.get();
  if (!saved) return showGate();

  // Refresh from the server each visit so new feedback shows up.
  (document.getElementById('portal-loading') as HTMLElement).hidden = false;
  const result = await portalApi.login(config.endpoint, saved.studentCode);
  if (result.success && result.data) return showDashboard(config, saved, result.data);
  // Keep the saved session: a flaky connection shouldn't log the student out.
  showGate(result.error ?? '');
}
