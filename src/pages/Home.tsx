import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
import { LocationService } from "../services/locationService";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { useCountdown } from "../hooks/useCountdown";
import { useScheduler } from "../hooks/useScheduler";
import { Header } from "../components/Header";
import { NextPrayerHero } from "../components/NextPrayerHero";
import { PrayerCard } from "../components/PrayerCard";
import { InspirationSlider } from "../components/InspirationSlider";
import { ALL_PRAYERS } from "../types";
import { formatGregorian, formatHijri } from "../utils/time";

export function HomePage({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { settings, update } = useAppContext();
  const { prayerDay, loading, error, refetch } = usePrayerTimes(settings);
  const tz = settings.location?.timezone;
  const next = useCountdown(prayerDay, tz);

  const [detecting, setDetecting] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Background engine: notifications + Adhan playback.
  useScheduler(settings, prayerDay);

  const lang = i18n.language === "ar" ? "ar" : "en";

  // Change-location button: detect automatically; on failure, tell the user to
  // pick manually (the banner offers a shortcut into Settings).
  async function changeLocation() {
    setLocError(null);
    setDetecting(true);
    try {
      const loc = await LocationService.detectAuto(lang);
      await update({ location: loc, locationMode: "auto" });
    } catch {
      setLocError(t("home.detectFailedManual"));
    } finally {
      setDetecting(false);
    }
  }
  const today = new Date();
  const gregorian = settings.location ? formatGregorian(today, lang, tz) : "";
  const hijri = settings.location ? formatHijri(today, lang, tz) : "";

  if (!settings.location) {
    return (
      <div className="app">
        <Header
          location={null}
          gregorianDate={gregorian}
          onChangeLocation={onOpenSettings}
          onOpenSettings={onOpenSettings}
        />
        <div className="center">
          <p>{t("home.noLocation")}</p>
          <button className="primary" onClick={onOpenSettings}>
            {t("home.chooseLocation")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        location={settings.location}
        gregorianDate={gregorian}
        hijriDate={hijri}
        detecting={detecting}
        onChangeLocation={() => void changeLocation()}
        onOpenSettings={onOpenSettings}
      />

      {locError && (
        <div className="banner banner-row">
          <span>{locError}</span>
          <button className="ghost" onClick={onOpenSettings}>
            {t("home.chooseLocation")}
          </button>
        </div>
      )}

      {prayerDay?.fromCache && <div className="banner">{t("home.offlineWarning")}</div>}

      {loading && !prayerDay && <div className="center">{t("common.loading")}</div>}

      {error && !prayerDay && (
        <div className="center">
          <p className="muted">{t("errors.fetchFailed")}</p>
          <button className="primary" onClick={() => void refetch()}>
            {t("common.retry")}
          </button>
        </div>
      )}

      {next && <NextPrayerHero next={next} />}

      {prayerDay && (
        <div className="grid">
          {ALL_PRAYERS.map((p) => (
            <PrayerCard
              key={p}
              prayer={p}
              time={prayerDay.timings[p]}
              isNext={next?.name === p}
            />
          ))}
        </div>
      )}

      {prayerDay && <InspirationSlider />}
    </div>
  );
}
