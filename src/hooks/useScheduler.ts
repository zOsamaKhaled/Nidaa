import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { AppSettings, PrayerDay } from "../types";
import {
  PlaybackStore,
  dueEvents,
  type ScheduledEvent,
} from "../services/schedulerService";
import { NotificationService } from "../services/notificationService";
import { ReminderService } from "../services/reminderService";
import { AzanService } from "../services/azanService";
import { AudioService } from "../services/audioService";
import { findMuezzin, shortMsFor, offlineFileFor } from "../data/muezzins";
import { randomHadith } from "../data/hadiths";
import { formatTime } from "../utils/time";

const TICK_MS = 15 * 1000;

/**
 * useScheduler — the background engine. On a fixed interval it asks the
 * SchedulerService which events are due (respecting dedupe records), then
 * performs the side-effects: OS notifications, reminders, and Adhan playback.
 *
 * Runs as long as the React app is alive — which, thanks to the system-tray
 * "minimize to tray" behavior, is the whole time the app is running, including
 * while the window is hidden.
 */
export function useScheduler(
  settings: AppSettings,
  prayerDay: PrayerDay | null
) {
  const { t, i18n } = useTranslation();
  // Keep the latest values in refs so the interval closure stays stable.
  const settingsRef = useRef(settings);
  const dayRef = useRef(prayerDay);
  settingsRef.current = settings;
  dayRef.current = prayerDay;

  useEffect(() => {
    let cancelled = false;

    async function handle(event: ScheduledEvent, tz: string) {
      const s = settingsRef.current;
      const prayerLabel = t(`prayers.${event.prayer}`);

      if (event.type === "notify") {
        // When the Adhan will play, the azan popup is the notification — skip
        // the duplicate OS toast. Otherwise show a toast so the user is told.
        if (!s.adhanEnabled) {
          await NotificationService.notify(
            t("notifications.timeStartedTitle"),
            t("notifications.timeStartedBody", { prayer: prayerLabel })
          );
        }
      } else if (event.type === "reminder") {
        const lang = i18n.language === "ar" ? "ar" : "en";
        const h = randomHadith();
        await ReminderService.show({
          title: t("notifications.reminderTitle"),
          body: t("notifications.reminderBody", {
            count: event.minutes,
            prayer: prayerLabel,
          }),
          prayer: prayerLabel,
          hadithAr: h.ar,
          hadithEn: h.en,
          source: h.source,
          sourceEn: h.sourceEn,
          language: lang,
        });
      } else if (event.type === "adhan") {
        const lang = i18n.language === "ar" ? "ar" : "en";
        const short = s.adhanLength === "short";
        const shortMs = shortMsFor(s.muezzinId, s.shortSeconds);
        const day = dayRef.current;
        const at = day ? formatTime(day.timings[event.prayer], s.timeFormat, lang) : "";
        try {
          const muezzin = findMuezzin(s.muezzinId, s.customMuezzins);
          await AudioService.playAdhan(muezzin, {
            volume: s.adhanEnabled ? s.volume : 0,
            fajr: event.prayer === "fajr",
            short,
            shortMs,
            offlineFile: offlineFileFor(s.offlineDefaultId),
          });
        } catch {
          // Audio file missing/blocked — fail silently; the popup still informs
          // the user that the prayer time has started.
        }
        // Announce with a popup that has a Stop button.
        await AzanService.show({
          title: t("notifications.azanTitle"),
          prayer: prayerLabel,
          body: t("notifications.timeStartedBody", { prayer: prayerLabel }),
          at,
          stopLabel: t("settings.stopPreview"),
          language: lang,
          ttlMs: short ? shortMs + 2500 : 240000,
        });
      }
      await PlaybackStore.markEvent(tz, event);
    }

    async function tick() {
      const day = dayRef.current;
      const s = settingsRef.current;
      if (cancelled || !day || !s.location) return;
      const tz = s.location.timezone || "UTC";

      const played = await PlaybackStore.today(tz);
      const events = dueEvents(
        day.timings,
        tz,
        {
          adhanEnabled: s.adhanEnabled,
          remindersEnabled: s.remindersEnabled,
          reminderMinutes: Number(s.reminderMinutes) || 0,
        },
        played
      );
      for (const event of events) {
        if (cancelled) break;
        await handle(event, tz);
      }
    }

    // Request notification permission once, up front.
    void NotificationService.ensurePermission();

    const id = setInterval(() => void tick(), TICK_MS);
    void tick(); // run immediately
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [t, i18n]);
}
