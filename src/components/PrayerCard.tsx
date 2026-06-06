import { useTranslation } from "react-i18next";
import type { PrayerName } from "../types";
import { useAppContext } from "../context/AppContext";
import { formatTime } from "../utils/time";

interface Props {
  prayer: PrayerName;
  time: string;
  isNext: boolean;
}

/** A single prayer time card. Highlights when it is the next prayer. */
export function PrayerCard({ prayer, time, isNext }: Props) {
  const { t, i18n } = useTranslation();
  const { settings } = useAppContext();
  const display = formatTime(
    time,
    settings.timeFormat,
    i18n.language === "ar" ? "ar" : "en"
  );
  return (
    <div className={`prayer-card${isNext ? " next" : ""}`}>
      <span className="pname">{t(`prayers.${prayer}`)}</span>
      <span className="ptime">{display}</span>
    </div>
  );
}
