import { useTranslation } from "react-i18next";
import type { GeoLocation } from "../types";
import { useAppContext } from "../context/AppContext";
import { useNow } from "../hooks/useClock";
import { formatClock } from "../utils/time";

interface Props {
  location: GeoLocation | null;
  gregorianDate: string;
  hijriDate?: string;
  detecting?: boolean;
  onChangeLocation: () => void;
  onOpenSettings: () => void;
}

/** Top bar: city/country, dates, a live clock, and action buttons. */
export function Header({
  location,
  gregorianDate,
  hijriDate,
  detecting,
  onChangeLocation,
  onOpenSettings,
}: Props) {
  const { t, i18n } = useTranslation();
  const { settings } = useAppContext();
  const now = useNow();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const isAr = lang === "ar";
  const cityName = location
    ? (isAr ? location.cityAr || location.city : location.city)
    : "";
  const countryName = location
    ? (isAr ? location.countryAr || location.country : location.country)
    : "";
  const cityLabel = location
    ? `${cityName}${countryName ? `, ${countryName}` : ""}`
    : t("home.noLocation");
  const clock = location
    ? formatClock(now, location.timezone, settings.timeFormat, lang)
    : "";

  return (
    <header className="header">
      <div className="location">
        <span className="city">{cityLabel}</span>
        <span className="dates">
          {gregorianDate}
          {hijriDate ? ` • ${hijriDate}` : ""}
        </span>
      </div>

      {clock && (
        <div className="clock" title={t("home.localTime")}>
          <span className="clock-time">{clock}</span>
          <span className="clock-label">{t("home.localTime")}</span>
        </div>
      )}

      <div className="row">
        <button className="ghost" onClick={onChangeLocation} disabled={detecting}>
          📍 {detecting ? t("settings.detecting") : t("home.changeLocation")}
        </button>
        <button
          className="icon ghost"
          title={t("home.openSettings")}
          onClick={onOpenSettings}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
