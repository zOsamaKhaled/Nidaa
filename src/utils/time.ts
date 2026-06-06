import type { TimeFormat } from "../types";

type Lang = "en" | "ar";

/** Localized Gregorian date, e.g. "Friday, 5 June 2026" / "الجمعة، ٥ يونيو ٢٠٢٦". */
export function formatGregorian(date: Date, language: Lang, tz?: string): string {
  try {
    return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en-GB", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * Localized Hijri (Umm al-Qura) date — Arabic shows native Arabic month names
 * and digits (e.g. "١٩ ذو الحجة ١٤٤٧ هـ") instead of Latin transliteration.
 */
export function formatHijri(date: Date, language: Lang, tz?: string): string {
  const base = language === "ar" ? "ar-SA" : "en";
  try {
    return new Intl.DateTimeFormat(`${base}-u-ca-islamic-umalqura`, {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
      era: "short",
    }).format(date);
  } catch {
    return "";
  }
}

/** Current wall-clock time in a timezone, formatted with seconds. */
export function formatClock(
  date: Date,
  tz: string | undefined,
  format: TimeFormat,
  language: Lang
): string {
  try {
    return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: format === "12h",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * Format a stored "HH:mm" (24-hour) prayer time for display.
 *
 * - `24h` → "13:30" (Latin) / localized digits in Arabic.
 * - `12h` → "1:30 PM" (English) / "١:٣٠ م" (Arabic), via Intl localization.
 *
 * Prayer times are stored as 24-hour "HH:mm" strings in the location's local
 * time, so we only reformat the clock representation here — no timezone math.
 */
export function formatTime(
  hhmm: string,
  format: TimeFormat,
  language: "en" | "ar"
): string {
  if (!hhmm || !hhmm.includes(":")) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;

  // Build a throwaway Date (date part is irrelevant) and let Intl localize it.
  const d = new Date();
  d.setHours(h, m, 0, 0);

  const locale = language === "ar" ? "ar" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: format === "12h",
    }).format(d);
  } catch {
    return hhmm;
  }
}
