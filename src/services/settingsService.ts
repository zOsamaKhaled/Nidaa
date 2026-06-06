import { AppSettings, DEFAULT_SETTINGS } from "../types";
import { KEYS, StorageService } from "./storageService";

/**
 * SettingsService — load/persist the typed AppSettings object.
 * Always returns a fully-populated settings object by merging stored values
 * over the defaults, so newly-added settings keys degrade gracefully.
 */
export const SettingsService = {
  async load(): Promise<AppSettings> {
    const stored = await StorageService.get<Partial<AppSettings>>(KEYS.settings);
    return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  },

  async save(settings: AppSettings): Promise<void> {
    await StorageService.set(KEYS.settings, settings);
  },

  async patch(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.load();
    const next = { ...current, ...patch };
    await this.save(next);
    return next;
  },
};
