import { useSyncExternalStore } from "react";

/**
 * Editor preferences kept in this browser, outside the project file.
 * Read through useSyncExternalStore so server and client agree on the first
 * paint and the stored value applies right after hydration.
 */
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function readPreference(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(`uim-pref-${key}`);
    return value === null ? fallback : value === "on";
  } catch {
    return fallback;
  }
}
export function writePreference(key: string, value: boolean) {
  try {
    localStorage.setItem(`uim-pref-${key}`, value ? "on" : "off");
  } catch {
    // Storage may be unavailable; the in-memory value still updates listeners.
  }
  listeners.forEach((listener) => listener());
}
export function useBooleanPreference(key: string, fallback: boolean) {
  return useSyncExternalStore(
    subscribe,
    () => readPreference(key, fallback),
    () => fallback,
  );
}
