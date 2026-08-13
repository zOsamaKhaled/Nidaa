import { AppSettings, DEFAULT_SETTINGS, IQAMA_CHIME, IQAMA_CUSTOM } from "../types";
import { DEFAULT_IQAMA_SOUND_ID, findIqamaSound } from "../data/iqamaSounds";
import { KEYS, StorageService } from "./storageService";

/**
 * SettingsService — load/persist the typed AppSettings object.
 * Always returns a fully-populated settings object by merging stored values
 * over the defaults, so newly-added settings keys degrade gracefully.
 */
export const SettingsService = {
  async load(): Promise<AppSettings> {
    const stored = await StorageService.get<Partial<AppSettings>>(KEYS.settings);
    const merged = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
    // An Iqama sound saved by an earlier build (the chime, or a muezzin id that
    // is no longer offered) falls back to a bundled Iqama recording.
    if (
      merged.iqamaSoundId !== IQAMA_CUSTOM &&
      (merged.iqamaSoundId === IQAMA_CHIME || !findIqamaSound(merged.iqamaSoundId))
    ) {
      merged.iqamaSoundId = DEFAULT_IQAMA_SOUND_ID;
    }
    return merged;
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
