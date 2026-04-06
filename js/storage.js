/**
 * storage.js — persistence adapter.
 * Only this file may access localStorage directly.
 * Swap this file to swap the backend (e.g. Postgres via Astro API route).
 */

const KEY = 'designops-survey-v1';

/** Persist resumable state { cur, ans }. */
export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

/** Load persisted state. Returns { cur, ans } or null. */
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear persisted state. */
export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Fail silently
  }
}
