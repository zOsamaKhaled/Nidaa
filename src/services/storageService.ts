import { load, type Store } from "@tauri-apps/plugin-store";

/**
 * StorageService — a thin persistence layer.
 *
 * Uses the Tauri Store plugin (a JSON file in the OS app-data directory) when
 * running inside Tauri, and falls back to `localStorage` when running in a
 * plain browser (e.g. `npm run dev` without the desktop shell). This keeps the
 * rest of the app agnostic to the runtime.
 */

const STORE_FILE = "settings.json";

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let storePromise: Promise<Store> | null = null;
function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(STORE_FILE, { autoSave: true, defaults: {} });
  }
  return storePromise;
}

export const StorageService = {
  async get<T>(key: string): Promise<T | null> {
    if (inTauri()) {
      const store = await getStore();
      const value = await store.get<T>(key);
      return value ?? null;
    }
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (inTauri()) {
      const store = await getStore();
      await store.set(key, value);
      await store.save();
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    if (inTauri()) {
      const store = await getStore();
      await store.delete(key);
      await store.save();
      return;
    }
    localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (inTauri()) {
      const store = await getStore();
      await store.clear();
      await store.save();
      return;
    }
    localStorage.clear();
  },
};

// Storage keys, centralized to avoid typos.
export const KEYS = {
  settings: "settings",
  prayerCache: "prayerCache", // map of signature -> PrayerDay
  playback: "playback", // PlaybackRecord for the current day
} as const;
