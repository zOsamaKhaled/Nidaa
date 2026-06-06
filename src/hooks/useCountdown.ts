import { useEffect, useState } from "react";
import type { PrayerDay } from "../types";
import { getNextPrayer, type NextPrayerInfo } from "../services/schedulerService";

/**
 * useCountdown — derives the next prayer + a live countdown that updates every
 * second. Returns null when there is no prayer data yet.
 */
export function useCountdown(
  prayerDay: PrayerDay | null,
  timezone: string | undefined
): NextPrayerInfo | null {
  const [info, setInfo] = useState<NextPrayerInfo | null>(null);

  useEffect(() => {
    if (!prayerDay || !timezone) {
      setInfo(null);
      return;
    }
    const tick = () => setInfo(getNextPrayer(prayerDay.timings, timezone));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerDay, timezone]);

  return info;
}

/** Format seconds as H:MM:SS / MM:SS using localized unit labels. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
