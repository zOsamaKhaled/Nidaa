import { useTranslation } from "react-i18next";
import type { PrayerName } from "../types";
import { useAppContext } from "../context/AppContext";
import { formatTime } from "../utils/time";

interface Props {
  prayer: PrayerName;
  time: string;
  isNext: boolean;
  /** Iqama time "HH:mm", when configured for this prayer. */
  iqamaTime?: string;
}

/** A single prayer time card. Highlights when it is the next prayer. */
export function PrayerCard({ prayer, time, isNext, iqamaTime }: Props) {
  const { t, i18n } = useTranslation();
  const { settings } = useAppContext();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const display = formatTime(time, settings.timeFormat, lang);
  return (
    <div className={`prayer-card${isNext ? " next" : ""}`}>
      <span className="pname">{t(`prayers.${prayer}`)}</span>
      <span className="ptime">{display}</span>
      {iqamaTime && (
        <span className="piqama">
          {t("home.iqamaLabel")} {formatTime(iqamaTime, settings.timeFormat, lang)}
        </span>
      )}
    </div>
  );
}
