// ---------------------------------------------------------------------------
// Central domain types shared across services and UI.
// ---------------------------------------------------------------------------

export type Language = "en" | "ar";

export type LocationMode = "auto" | "manual";

/** The six prayers plus sunrise that we display and (optionally) schedule. */
export type PrayerName =
  | "fajr"
  | "sunrise"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

/** Prayers that trigger an Adhan (sunrise is informational only). */
export const ADHAN_PRAYERS: PrayerName[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const ALL_PRAYERS: PrayerName[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/**
 * Aladhan calculation method ids.
 * See https://aladhan.com/calculation-methods
 */
export interface CalculationMethod {
  id: number;
  /** i18n key used to render the label. */
  key: string;
}

export type AsrMethod = "standard" | "hanafi"; // 0 = Shafi/standard, 1 = Hanafi

/** Clock display preference for prayer times. */
export type TimeFormat = "12h" | "24h";

/** Adhan playback length: the full call, or a shortened clip. */
export type AdhanLength = "full" | "short";

export interface Muezzin {
  id: string;
  /** Display name i18n key (falls back to `name`). */
  nameKey?: string;
  name: string;
  /**
   * Relative path (under the bundled `audio/` resource folder) of the local
   * Adhan file. Local bundled files are strongly preferred when present.
   */
  file: string;
  /** Optional remote streaming URL, used when the local `file` is missing. */
  url?: string;
  /**
   * Optional dedicated short-Adhan file. When present, "short" mode plays this
   * file in full (no truncation) — its length is fixed and not user-editable.
   */
  shortFile?: string;
  /** Optional separate Fajr Adhan file (local). */
  fajrFile?: string;
  /** Optional separate Fajr Adhan streaming URL. */
  fajrUrl?: string;
}

export interface GeoLocation {
  city: string;
  country: string;
  /** Arabic display names (fall back to `city`/`country` when absent). */
  cityAr?: string;
  countryAr?: string;
  /** ISO-3166 alpha-2, used for the Aladhan city endpoint. */
  countryCode?: string;
  latitude: number;
  longitude: number;
  /** IANA timezone, e.g. "Asia/Riyadh". */
  timezone: string;
}

/** A single day's prayer timings, stored as "HH:mm" in the location's local time. */
export interface PrayerTimings {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayerDay {
  /** ISO date "YYYY-MM-DD" in the location's local timezone. */
  date: string;
  timings: PrayerTimings;
  hijriDate?: string;
  /** Cache key combining location + method so we know when to refetch. */
  signature: string;
  /** Epoch ms when these timings were fetched. */
  fetchedAt: number;
  /** True when served from cache because the network was unavailable. */
  fromCache?: boolean;
}

export type ReminderMinutes = 0 | 5 | 10 | 15 | number;

export interface AppSettings {
  language: Language;
  locationMode: LocationMode;
  location: GeoLocation | null;
  calculationMethod: number;
  asrMethod: AsrMethod;
  timeFormat: TimeFormat;
  muezzinId: string;
  /** Built-in (bundled, offline-capable) reciter used when offline. */
  offlineDefaultId: string;
  adhanLength: AdhanLength;
  /** User-added muezzins (name + streaming URL), persisted with settings. */
  customMuezzins: Muezzin[];
  /** Per-muezzin short-Adhan length in seconds, keyed by muezzin id. */
  shortSeconds: Record<string, number>;
  volume: number; // 0..1
  adhanEnabled: boolean;
  remindersEnabled: boolean;
  reminderMinutes: ReminderMinutes;
  startOnBoot: boolean;
  theme: "light" | "dark" | "system";
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  locationMode: "manual",
  location: null,
  calculationMethod: 4, // Umm Al-Qura is 4
  asrMethod: "standard",
  timeFormat: "12h",
  muezzinId: "qatami",
  offlineDefaultId: "jazy",
  adhanLength: "full",
  customMuezzins: [],
  shortSeconds: {},
  volume: 0.8,
  adhanEnabled: true,
  remindersEnabled: true,
  reminderMinutes: 10,
  startOnBoot: false,
  theme: "system",
};

/** Record of what has already been played/notified, to avoid duplicates. */
export interface PlaybackRecord {
  /** "YYYY-MM-DD" */
  date: string;
  /** prayers for which the Adhan has been played today */
  adhanPlayed: PrayerName[];
  /** prayers for which the reminder has fired today */
  reminderFired: PrayerName[];
  /** prayers for which the "time started" notification fired today */
  notified: PrayerName[];
}
