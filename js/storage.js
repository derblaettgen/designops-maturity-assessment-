/**
 * storage.js — persistence adapter.
 * Only this file may access localStorage directly.
 * Swap this file to swap the backend (e.g. Postgres via Astro API route).
 */

const STORAGE_KEY = 'designops-survey-v1';

export function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private browsing
  }
}

export function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fail silently
  }
}
