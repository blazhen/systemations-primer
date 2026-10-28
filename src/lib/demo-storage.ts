// Small browser storage helper for the demo: values are kept in localStorage so they
// survive a refresh, and expire after a short time so nothing lingers on a shared
// computer. Nothing is sent anywhere. Every call is safe to make on the server.

export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
export const DEMO_TTL_LABEL = "24 hours";

interface Stored<T> {
  savedAt: number;
  value: T;
}

export function loadDemoValue<T>(key: string, ttlMs: number = DEMO_TTL_MS): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored<T>;
    if (!parsed || typeof parsed.savedAt !== "number" || !("value" in parsed)) return null;
    if (Date.now() - parsed.savedAt > ttlMs) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

export function saveDemoValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    const stored: Stored<T> = { savedAt: Date.now(), value };
    window.localStorage.setItem(key, JSON.stringify(stored));
  } catch {
    // Storage full or blocked (private mode): the demo still works for this visit.
  }
}

export function clearDemoValue(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const DEMO_KEYS = {
  brief: "sys-primer:brief",
  notes: "sys-primer:call-notes",
  crm: "sys-primer:crm",
  ui: "sys-primer:ui",
} as const;
