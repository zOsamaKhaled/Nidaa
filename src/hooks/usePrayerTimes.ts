import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings, PrayerDay } from "../types";
import { PrayerTimesApiService, dateInTimezone } from "../services/prayerTimesApiService";

/**
 * usePrayerTimes — loads today's prayer times for the configured location and
 * keeps them fresh. Recalculates whenever the location, calculation method or
 * Asr method changes, and automatically refetches when the day rolls over.
 */
export function usePrayerTimes(settings: AppSettings) {
  const [prayerDay, setPrayerDay] = useState<PrayerDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedDateRef = useRef<string | null>(null);

  const { location, calculationMethod, asrMethod } = settings;

  const fetchNow = useCallback(async () => {
    if (!location) {
      setPrayerDay(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const day = await PrayerTimesApiService.getToday(
        location,
        calculationMethod,
        asrMethod
      );
      setPrayerDay(day);
      loadedDateRef.current = day.date;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [location, calculationMethod, asrMethod]);

  // Fetch on dependency change.
  useEffect(() => {
    void fetchNow();
  }, [fetchNow]);

  // Day-rollover watcher: every minute, refetch if the local date changed.
  useEffect(() => {
    if (!location) return;
    const tz = location.timezone || "UTC";
    const id = setInterval(() => {
      const { iso } = dateInTimezone(tz);
      if (loadedDateRef.current && iso !== loadedDateRef.current) {
        void fetchNow();
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [location, fetchNow]);

  return { prayerDay, loading, error, refetch: fetchNow };
}
