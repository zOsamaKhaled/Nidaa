import { useTranslation } from "react-i18next";
import type { NextPrayerInfo } from "../services/schedulerService";
import { formatCountdown } from "../hooks/useCountdown";
import { useAppContext } from "../context/AppContext";
import { formatTime } from "../utils/time";

/** The "next prayer" hero: name, its time, and a live countdown. */
export function NextPrayerHero({ next }: { next: NextPrayerInfo }) {
  const { t, i18n } = useTranslation();
  const { settings } = useAppContext();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const at = formatTime(next.time, settings.timeFormat, lang);

  return (
    <div className="hero">
      <div className="label">{t("home.nextPrayer")}</div>

      <div className="hero-name-row">
        <span className="name">{t(`prayers.${next.name}`)}</span>
        <span className="hero-at">{at}</span>
      </div>

      <div className="remaining">
        <span className="remaining-label">{t("home.timeRemaining")}</span>
        <span className="countdown">{formatCountdown(next.secondsUntil)}</span>
      </div>
    </div>
  );
}
