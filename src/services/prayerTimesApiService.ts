import * as adhan from "adhan";
import type {
  AsrMethod,
  GeoLocation,
  PrayerDay,
  PrayerTimings,
} from "../types";
import { KEYS, StorageService } from "./storageService";

/**
 * PrayerTimesApiService — fetches daily prayer times.
 *
 * Primary source: the Aladhan API (https://aladhan.com). The API already
 * returns times in the location's local timezone and includes the Hijri date,
 * which keeps timezone handling simple and correct.
 *
 * Resilience:
 *   - Results are cached locally per (location + method + school + date).
 *   - If the network is unavailable we return the last cached day (flagged
 *     `fromCache`) so the UI can show a warning.
 *   - If there is no cache either, we fall back to fully offline calculation
 *     via the `adhan` library (this also seeds future offline support).
 */

interface CacheMap {
  [signature: string]: PrayerDay;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Current Y/M/D in a specific IANA timezone. */
export function dateInTimezone(tz: string, when = new Date()): {
  year: number;
  month: number;
  day: number;
  iso: string;
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA yields "YYYY-MM-DD"
  const iso = fmt.format(when);
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d, iso };
}

function signatureFor(
  loc: GeoLocation,
  method: number,
  school: number,
  dateIso: string
): string {
  return `${loc.latitude.toFixed(3)}|${loc.longitude.toFixed(
    3
  )}|${method}|${school}|${dateIso}`;
}

function schoolFromAsr(asr: AsrMethod): number {
  return asr === "hanafi" ? 1 : 0;
}

// --- Aladhan ------------------------------------------------------------

async function fetchFromAladhan(
  loc: GeoLocation,
  method: number,
  school: number,
  tz: string
): Promise<PrayerDay> {
  const { year, month, day, iso } = dateInTimezone(tz);
  const dateStr = `${pad(day)}-${pad(month)}-${year}`;
  const url =
    `https://api.aladhan.com/v1/timings/${dateStr}` +
    `?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&method=${method}&school=${school}&timezonestring=${encodeURIComponent(tz)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);
  const json = await res.json();
  const t = json?.data?.timings;
  if (!t) throw new Error("Aladhan: malformed response");

  const clean = (s: string) => s.split(" ")[0]; // strip "(+03)" suffixes
  const timings: PrayerTimings = {
    fajr: clean(t.Fajr),
    sunrise: clean(t.Sunrise),
    dhuhr: clean(t.Dhuhr),
    asr: clean(t.Asr),
    maghrib: clean(t.Maghrib),
    isha: clean(t.Isha),
  };

  const hijri = json?.data?.date?.hijri;
  const hijriDate = hijri
    ? `${hijri.day} ${hijri.month?.en ?? ""} ${hijri.year} ${hijri.designation?.abbreviated ?? "AH"}`
    : undefined;

  return {
    date: iso,
    timings,
    hijriDate,
    signature: signatureFor(loc, method, school, iso),
    fetchedAt: Date.now(),
  };
}

// --- Offline fallback via `adhan` --------------------------------------

function adhanParamsFor(method: number): adhan.CalculationParameters {
  switch (method) {
    case 4:
      return adhan.CalculationMethod.UmmAlQura();
    case 5:
      return adhan.CalculationMethod.Egyptian();
    case 2:
      return adhan.CalculationMethod.NorthAmerica();
    case 1:
      return adhan.CalculationMethod.Karachi();
    case 7:
      return adhan.CalculationMethod.Tehran();
    case 9:
      return adhan.CalculationMethod.Kuwait();
    case 10:
      return adhan.CalculationMethod.Qatar();
    case 11:
      return adhan.CalculationMethod.Singapore();
    case 13:
      return adhan.CalculationMethod.Turkey();
    case 15:
      return adhan.CalculationMethod.MoonsightingCommittee();
    case 16:
      return adhan.CalculationMethod.Dubai();
    case 3:
    default:
      return adhan.CalculationMethod.MuslimWorldLeague();
  }
}

function formatInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function computeOffline(
  loc: GeoLocation,
  method: number,
  school: number,
  tz: string
): PrayerDay {
  const { year, month, day, iso } = dateInTimezone(tz);
  const coords = new adhan.Coordinates(loc.latitude, loc.longitude);
  const params = adhanParamsFor(method);
  params.madhab = school === 1 ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const pt = new adhan.PrayerTimes(coords, date, params);

  const timings: PrayerTimings = {
    fajr: formatInTz(pt.fajr, tz),
    sunrise: formatInTz(pt.sunrise, tz),
    dhuhr: formatInTz(pt.dhuhr, tz),
    asr: formatInTz(pt.asr, tz),
    maghrib: formatInTz(pt.maghrib, tz),
    isha: formatInTz(pt.isha, tz),
  };

  return {
    date: iso,
    timings,
    hijriDate: hijriDateString(iso),
    signature: signatureFor(loc, method, school, iso),
    fetchedAt: Date.now(),
  };
}

/** Hijri date via the Intl Islamic calendar (no network). */
export function hijriDateString(isoDate: string): string | undefined {
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return undefined;
  }
}

// --- Cache --------------------------------------------------------------

async function readCache(): Promise<CacheMap> {
  return (await StorageService.get<CacheMap>(KEYS.prayerCache)) ?? {};
}

async function writeCache(map: CacheMap): Promise<void> {
  // Keep the cache small: retain only the most recent ~14 entries.
  const entries = Object.entries(map).sort(
    (a, b) => b[1].fetchedAt - a[1].fetchedAt
  );
  const trimmed: CacheMap = {};
  for (const [k, v] of entries.slice(0, 14)) trimmed[k] = v;
  await StorageService.set(KEYS.prayerCache, trimmed);
}

export const PrayerTimesApiService = {
  /**
   * Get today's prayer times for a location. Network-first with cache and
   * offline-calculation fallbacks. Never throws for the "offline" case.
   */
  async getToday(
    loc: GeoLocation,
    method: number,
    asr: AsrMethod
  ): Promise<PrayerDay> {
    const school = schoolFromAsr(asr);
    const tz = loc.timezone || "UTC";
    const { iso } = dateInTimezone(tz);
    const sig = signatureFor(loc, method, school, iso);

    try {
      const day = await fetchFromAladhan(loc, method, school, tz);
      const cache = await readCache();
      cache[day.signature] = day;
      await writeCache(cache);
      return day;
    } catch {
      // Network failed — try cache for this exact day/config.
      const cache = await readCache();
      if (cache[sig]) {
        return { ...cache[sig], fromCache: true };
      }
      // No cache — compute offline so the user is never left blank.
      const offline = computeOffline(loc, method, school, tz);
      return { ...offline, fromCache: true };
    }
  },

  async clearCache(): Promise<void> {
    await StorageService.remove(KEYS.prayerCache);
  },
};
