/**
 * Browser storage that never throws. Managed Chromebooks and private windows
 * can block storage; the site must keep working (just without remembering).
 */
type Area = 'local' | 'session';

function area(kind: Area): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const storage = {
  get(key: string, kind: Area = 'local'): string | null {
    try {
      return area(kind)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string, kind: Area = 'local'): void {
    try {
      area(kind)?.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
  remove(key: string, kind: Area = 'local'): void {
    try {
      area(kind)?.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};
