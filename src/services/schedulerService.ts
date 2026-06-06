import {
  ADHAN_PRAYERS,
  ALL_PRAYERS,
  type PlaybackRecord,
  type PrayerName,
  type PrayerTimings,
} from "../types";
import { dateInTimezone } from "./prayerTimesApiService";
import { KEYS, StorageService } from "./storageService";

/**
 * SchedulerService — pure time logic + playback-record persistence.
 *
 * The actual side-effects (playing audio, sending notifications) are performed
 * by the React `useScheduler` hook, which calls into this service on each tick.
 * Keeping the decision logic pure makes it deterministic and testable.
 */

export interface NextPrayerInfo {
  name: PrayerName;
  time: string; // "HH:mm"
  /** Minutes from "now" until this prayer (may cross midnight). */
  minutesUntil: number;
  /** Seconds until this prayer, for a smooth countdown. */
  secondsUntil: number;
}

export type ScheduledEvent =
  | { type: "adhan"; prayer: PrayerName }
  | { type: "notify"; prayer: PrayerName }
  | { type: "reminder"; prayer: PrayerName; minutes: number };

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Current minutes-since-midnight and seconds in a timezone. */
export function nowInTimezone(tz: string): { minutes: number; seconds: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const h = get("hour");
  const m = get("minute");
  const s = get("second");
  return { minutes: h * 60 + m, seconds: h * 3600 + m * 60 + s };
}

/** Find the next upcoming prayer (the six daily prayers, incl. sunrise). */
export function getNextPrayer(
  timings: PrayerTimings,
  tz: string
): NextPrayerInfo {
  const { seconds: nowSec } = nowInTimezone(tz);
  const ordered = ALL_PRAYERS.map((name) => ({
    name,
    sec: timeToMinutes(timings[name]) * 60,
  }));

  for (const p of ordered) {
    if (p.sec > nowSec) {
      const secondsUntil = p.sec - nowSec;
      return {
        name: p.name,
        time: timings[p.name],
        minutesUntil: Math.ceil(secondsUntil / 60),
        secondsUntil,
      };
    }
  }
  // All passed today → next is tomorrow's Fajr.
  const secondsUntil = 24 * 3600 - nowSec + timeToMinutes(timings.fajr) * 60;
  return {
    name: "fajr",
    time: timings.fajr,
    minutesUntil: Math.ceil(secondsUntil / 60),
    secondsUntil,
  };
}

/**
 * Decide which events are due right now, given playback history.
 * Uses a 1-minute window so a tick that lands slightly late still fires.
 */
export function dueEvents(
  timings: PrayerTimings,
  tz: string,
  opts: {
    adhanEnabled: boolean;
    remindersEnabled: boolean;
    reminderMinutes: number;
  },
  played: PlaybackRecord
): ScheduledEvent[] {
  const { minutes: nowMin } = nowInTimezone(tz);
  const events: ScheduledEvent[] = [];

  // Only the five obligatory prayers trigger notifications/Adhan; sunrise is
  // informational (it still shows in the UI and countdown).
  for (const prayer of ADHAN_PRAYERS) {
    const start = timeToMinutes(timings[prayer]);

    // "Time started" notification + Adhan.
    if (nowMin >= start && nowMin <= start + 1) {
      if (!played.notified.includes(prayer)) {
        events.push({ type: "notify", prayer });
      }
      if (opts.adhanEnabled && !played.adhanPlayed.includes(prayer)) {
        events.push({ type: "adhan", prayer });
      }
    }

    // Reminder before prayer.
    if (opts.remindersEnabled && opts.reminderMinutes > 0) {
      const remindAt = start - opts.reminderMinutes;
      if (
        nowMin >= remindAt &&
        nowMin <= remindAt + 1 &&
        nowMin < start &&
        !played.reminderFired.includes(prayer)
      ) {
        events.push({
          type: "reminder",
          prayer,
          minutes: opts.reminderMinutes,
        });
      }
    }
  }

  return events;
}

// --- Playback record persistence (dedupe across restarts) ---------------

function emptyRecord(dateIso: string): PlaybackRecord {
  return {
    date: dateIso,
    adhanPlayed: [],
    reminderFired: [],
    notified: [],
  };
}

export const PlaybackStore = {
  /** Load today's record, resetting automatically when the day changes. */
  async today(tz: string): Promise<PlaybackRecord> {
    const { iso } = dateInTimezone(tz);
    const stored = await StorageService.get<PlaybackRecord>(KEYS.playback);
    if (!stored || stored.date !== iso) {
      const fresh = emptyRecord(iso);
      await StorageService.set(KEYS.playback, fresh);
      return fresh;
    }
    return stored;
  },

  async markEvent(
    tz: string,
    event: ScheduledEvent
  ): Promise<PlaybackRecord> {
    const record = await this.today(tz);
    if (event.type === "adhan" && !record.adhanPlayed.includes(event.prayer)) {
      record.adhanPlayed.push(event.prayer);
    } else if (
      event.type === "reminder" &&
      !record.reminderFired.includes(event.prayer)
    ) {
      record.reminderFired.push(event.prayer);
    } else if (
      event.type === "notify" &&
      !record.notified.includes(event.prayer)
    ) {
      record.notified.push(event.prayer);
    }
    await StorageService.set(KEYS.playback, record);
    return record;
  },

  async clear(): Promise<void> {
    await StorageService.remove(KEYS.playback);
  },
};
