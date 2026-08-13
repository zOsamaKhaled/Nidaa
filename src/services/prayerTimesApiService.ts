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
 * Resilience (important at Windows startup, when the app often launches before
 * Wi-Fi has associated):
 *   - Whenever we do reach the network we fetch the **whole month** and cache
 *     every day, so the app keeps showing real API timings for weeks offline.
 *   - Reads are cache-first: if today's entry is already cached we return it
 *     immediately (no spinner, no network wait) and refresh in the background.
 *   - With no usable cache we fall back to fully offline calculation via the
 *     `adhan` library, flagged `fromCache` so the UI can warn.
 */

interface CacheMap {
  [signature: string]: PrayerDay;
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

const FETCH_TIMEOUT_MS = 8000;

/** fetch + JSON with a hard timeout, so a half-connected Wi-Fi can't hang us. */
async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const clean = (s: string) => s.split(" ")[0]; // strip "(+03)" suffixes

/** Map one Aladhan day object into a PrayerDay. */
function dayFromAladhan(
  entry: any,
  loc: GeoLocation,
  method: number,
  school: number
): PrayerDay | null {
  const t = entry?.timings;
  const g = entry?.date?.gregorian;
  if (!t || !g?.date) return null;
  // gregorian.date is "DD-MM-YYYY"
  const [d, m, y] = String(g.date).split("-");
  const iso = `${y}-${m}-${d}`;

  const timings: PrayerTimings = {
    fajr: clean(t.Fajr),
    sunrise: clean(t.Sunrise),
    dhuhr: clean(t.Dhuhr),
    asr: clean(t.Asr),
    maghrib: clean(t.Maghrib),
    isha: clean(t.Isha),
  };

  const hijri = entry?.date?.hijri;
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

/**
 * Fetch a whole calendar month at once. One request covers ~30 days, which is
 * what makes the app usable for weeks without any connection.
 */
async function fetchMonthFromAladhan(
  loc: GeoLocation,
  method: number,
  school: number,
  tz: string,
  year: number,
  month: number
): Promise<PrayerDay[]> {
  const url =
    `https://api.aladhan.com/v1/calendar/${year}/${month}` +
    `?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&method=${method}&school=${school}&timezonestring=${encodeURIComponent(tz)}`;

  const json = await fetchJson(url);
  const list = json?.data;
  if (!Array.isArray(list)) throw new Error("Aladhan: malformed response");

  const days = list
    .map((entry) => dayFromAladhan(entry, loc, method, school))
    .filter((d): d is PrayerDay => d !== null);
  if (!days.length) throw new Error("Aladhan: empty calendar");
  return days;
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

/** Keep two months of days (current + next) plus a little slack. */
const MAX_CACHE_ENTRIES = 80;

async function writeCache(map: CacheMap): Promise<void> {
  // Drop the oldest *dates* first (not oldest fetch time) so a freshly fetched
  // month never evicts itself.
  const entries = Object.entries(map).sort((a, b) =>
    a[1].date < b[1].date ? 1 : -1
  );
  const trimmed: CacheMap = {};
  for (const [k, v] of entries.slice(0, MAX_CACHE_ENTRIES)) trimmed[k] = v;
  await StorageService.set(KEYS.prayerCache, trimmed);
}

/** Refresh the cache for the given month; returns the stored days. */
async function refreshMonth(
  loc: GeoLocation,
  method: number,
  school: number,
  tz: string,
  year: number,
  month: number
): Promise<PrayerDay[]> {
  const days = await fetchMonthFromAladhan(loc, method, school, tz, year, month);
  const cache = await readCache();
  for (const day of days) cache[day.signature] = day;
  await writeCache(cache);
  return days;
}

/** How stale a cached day may be before we try to refresh it in background. */
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000;

export const PrayerTimesApiService = {
  /**
   * Get today's prayer times for a location.
   *
   * Cache-first: a cached day is returned instantly (so a cold Windows boot
   * with no Wi-Fi yet still shows correct times), and the month is refreshed in
   * the background. Only when nothing is cached do we wait on the network, and
   * even then we fall back to offline calculation instead of failing.
   */
  async getToday(
    loc: GeoLocation,
    method: number,
    asr: AsrMethod
  ): Promise<PrayerDay> {
    const school = schoolFromAsr(asr);
    const tz = loc.timezone || "UTC";
    const { year, month, iso } = dateInTimezone(tz);
    const sig = signatureFor(loc, method, school, iso);

    const cache = await readCache();
    const cached = cache[sig];

    if (cached) {
      // Serve immediately; top the cache up in the background when stale.
      if (Date.now() - cached.fetchedAt > REFRESH_AFTER_MS) {
        void refreshMonth(loc, method, school, tz, year, month).catch(() => {});
      }
      return cached;
    }

    try {
      const days = await refreshMonth(loc, method, school, tz, year, month);
      const today = days.find((d) => d.date === iso);
      if (today) return today;
      throw new Error("today missing from calendar");
    } catch {
      // No network and no cache — compute offline so the user is never blank.
      const offline = computeOffline(loc, method, school, tz);
      return { ...offline, fromCache: true };
    }
  },

  /**
   * Pre-cache the rest of this month and all of the next one. Called once the
   * app has a working connection so future offline launches are covered.
   */
  async prefetchAhead(
    loc: GeoLocation,
    method: number,
    asr: AsrMethod
  ): Promise<void> {
    const school = schoolFromAsr(asr);
    const tz = loc.timezone || "UTC";
    const { year, month } = dateInTimezone(tz);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    await refreshMonth(loc, method, school, tz, year, month);
    await refreshMonth(loc, method, school, tz, nextYear, nextMonth);
  },

  async clearCache(): Promise<void> {
    await StorageService.remove(KEYS.prayerCache);
  },
};
