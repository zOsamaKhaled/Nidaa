import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GeoLocation, LocationMode } from "../types";
import {
  COUNTRIES,
  citiesForCountry,
  cityToLocation,
  searchCities,
  geocodeCities,
  mergeCityResults,
  type CityEntry,
} from "../data/cities";
import { LocationService } from "../services/locationService";

interface Props {
  mode: LocationMode;
  location: GeoLocation | null;
  onModeChange: (mode: LocationMode) => void;
  onLocationChange: (loc: GeoLocation) => void;
}

/**
 * Reusable location selector used on both the Settings screen and the
 * "change location" flow. Supports automatic detection and manual
 * country → city selection with live worldwide search.
 */
export function LocationPicker({
  mode,
  location,
  onModeChange,
  onLocationChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(location?.countryCode ?? "");

  // Live geocoding results, merged into the curated list as the user types.
  const [liveResults, setLiveResults] = useState<CityEntry[]>([]);
  const [searching, setSearching] = useState(false);

  // Curated/offline matches available synchronously.
  const localResults = useMemo<CityEntry[]>(() => {
    if (search.trim()) return searchCities(search).slice(0, 50);
    if (country) return citiesForCountry(country);
    return [];
  }, [search, country]);

  // Debounced live worldwide search (Open-Meteo) so any city is findable.
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setLiveResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const live = await geocodeCities(
          q,
          controller.signal,
          isAr ? "ar" : "en"
        );
        setLiveResults(live);
      } catch {
        // network/geocoding failed — silently keep curated results only
        setLiveResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search, isAr]);

  const cityResults = useMemo<CityEntry[]>(
    () =>
      search.trim()
        ? mergeCityResults(localResults, liveResults).slice(0, 60)
        : localResults,
    [search, localResults, liveResults]
  );

  // A city is the current one if its coordinates match the saved location.
  const isSelected = (c: CityEntry) =>
    !!location &&
    Math.abs(location.latitude - c.latitude) < 0.02 &&
    Math.abs(location.longitude - c.longitude) < 0.02;

  async function detect() {
    setDetecting(true);
    setDetectError(null);
    try {
      const loc = await LocationService.detectAuto(isAr ? "ar" : "en");
      onLocationChange(loc);
    } catch {
      setDetectError(t("errors.locationFailed"));
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div>
      <div className="field-row">
        <label>{t("settings.locationMode")}</label>
        <div className="seg">
          <button
            className={mode === "auto" ? "active" : ""}
            onClick={() => onModeChange("auto")}
          >
            {t("settings.auto")}
          </button>
          <button
            className={mode === "manual" ? "active" : ""}
            onClick={() => onModeChange("manual")}
          >
            {t("settings.manual")}
          </button>
        </div>
      </div>

      {mode === "auto" ? (
        <div className="field">
          <button className="primary" onClick={detect} disabled={detecting}>
            {detecting ? t("settings.detecting") : t("settings.detectLocation")}
          </button>
          {detectError && <span className="muted">{detectError}</span>}
        </div>
      ) : (
        <>
          <div className="field">
            <label>{t("settings.country")}</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setSearch("");
              }}
            >
              <option value="">{t("settings.selectCountry")}</option>
              {COUNTRIES.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {isAr ? c.countryAr : c.country}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              {t("settings.searchCity")}
              {searching && (
                <span className="muted"> · {t("common.loading")}</span>
              )}
            </label>
            <input
              type="search"
              placeholder={t("settings.searchCityHint")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="field">
            <label>{t("settings.city")}</label>
            <div className="city-list" role="listbox">
              {cityResults.length === 0 ? (
                <div className="city-empty muted">
                  {searching
                    ? t("common.loading")
                    : search.trim()
                    ? t("settings.noCities")
                    : t("settings.selectCity")}
                </div>
              ) : (
                cityResults.map((c) => {
                  const selected = isSelected(c);
                  return (
                    <button
                      type="button"
                      key={`${c.countryCode}|${c.city}|${c.latitude.toFixed(
                        3
                      )},${c.longitude.toFixed(3)}`}
                      className={`city-row${selected ? " selected" : ""}`}
                      role="option"
                      aria-selected={selected}
                      onClick={() => onLocationChange(cityToLocation(c))}
                    >
                      <span className="city-name">
                        {isAr ? c.cityAr : c.city}
                      </span>
                      <span className="city-country muted">
                        {isAr ? c.countryAr : c.country}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {location && (
        <p className="muted">
          {isAr ? "الموقع الحالي:" : "Current:"}{" "}
          {isAr ? location.cityAr || location.city : location.city},{" "}
          {isAr ? location.countryAr || location.country : location.country} (
          {location.timezone})
        </p>
      )}
    </div>
  );
}
