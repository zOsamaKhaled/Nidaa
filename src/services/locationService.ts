import type { GeoLocation } from "../types";
import { nearestCity } from "../data/cities";

/**
 * LocationService — automatic + manual location resolution.
 *
 * Automatic detection tries, in order:
 *   1. The device's precise location via `navigator.geolocation` (GPS / Wi-Fi),
 *      reverse-geocoded to a city name. This is accurate to the actual city
 *      (e.g. Khobar), not just the ISP's metro area.
 *   2. IP-based geolocation across several free, HTTPS + CORS-enabled providers.
 *      IP location is only city/metro accurate, so it may report the nearest
 *      large city (e.g. "Dammam" when you are in Khobar) — that is expected.
 *
 * The caller is expected to ask the user for consent before invoking
 * `detectAuto()` (the Settings UI gates this behind a button press, which acts
 * as explicit permission).
 *
 * Manual selection is handled by the bundled `cities.ts` dataset plus live
 * geocoding; this service only deals with automatic detection.
 */

const TIMEOUT_MS = 8000;
const GEO_TIMEOUT_MS = 10000;

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function valid(loc: GeoLocation): GeoLocation {
  if (
    typeof loc.latitude !== "number" ||
    typeof loc.longitude !== "number" ||
    Number.isNaN(loc.latitude) ||
    Number.isNaN(loc.longitude)
  ) {
    throw new Error("provider returned no coordinates");
  }
  if (!loc.timezone) loc.timezone = guessTimezone();
  return loc;
}

/** ipwho.is — free, HTTPS, CORS, no key, no aggressive rate limit. */
async function fromIpwho(): Promise<GeoLocation> {
  const d = await fetchJson("https://ipwho.is/");
  if (d && d.success === false) throw new Error(d.message ?? "ipwho failed");
  return valid({
    city: d.city ?? "",
    country: d.country ?? "",
    countryCode: d.country_code ?? undefined,
    latitude: d.latitude,
    longitude: d.longitude,
    timezone: d.timezone?.id ?? guessTimezone(),
  });
}

/** GeoJS — free, HTTPS, CORS, no key. */
async function fromGeoJs(): Promise<GeoLocation> {
  const d = await fetchJson("https://get.geojs.io/v1/ip/geo.json");
  return valid({
    city: d.city ?? "",
    country: d.country ?? "",
    countryCode: d.country_code ?? undefined,
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
    timezone: d.timezone ?? guessTimezone(),
  });
}

/** freeipapi.com — free, HTTPS, CORS, no key. */
async function fromFreeIpApi(): Promise<GeoLocation> {
  const d = await fetchJson("https://freeipapi.com/api/json");
  return valid({
    city: d.cityName ?? "",
    country: d.countryName ?? "",
    countryCode: d.countryCode ?? undefined,
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
    timezone:
      (Array.isArray(d.timeZones) ? d.timeZones[0] : d.timeZone) ??
      guessTimezone(),
  });
}

/** ipapi.co — free but rate-limited; kept as a last resort. */
async function fromIpapi(): Promise<GeoLocation> {
  const d = await fetchJson("https://ipapi.co/json/");
  if (d && d.error) throw new Error(d.reason ?? "ipapi error");
  return valid({
    city: d.city ?? "",
    country: d.country_name ?? "",
    countryCode: d.country_code ?? undefined,
    latitude: d.latitude,
    longitude: d.longitude,
    timezone: d.timezone ?? guessTimezone(),
  });
}

const PROVIDERS = [fromIpwho, fromGeoJs, fromFreeIpApi, fromIpapi];

interface RevName {
  city: string;
  country: string;
  countryCode?: string;
}

async function fetchReverse(
  latitude: number,
  longitude: number,
  language: "en" | "ar"
): Promise<RevName> {
  const d = await fetchJson(
    "https://api.bigdatacloud.net/data/reverse-geocode-client" +
      `?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language}`
  );
  return {
    city: d.city || d.locality || d.principalSubdivision || "",
    country: d.countryName || "",
    countryCode: d.countryCode || undefined,
  };
}

/**
 * Reverse-geocode coordinates to bilingual city/country names (free, no key,
 * CORS). Fetches English and Arabic so the UI can show the right one regardless
 * of language; falls back to the nearest curated city if the lookup fails.
 */
async function reverseGeocode(
  latitude: number,
  longitude: number,
  language: "en" | "ar" = "en"
): Promise<GeoLocation> {
  const [en, ar] = await Promise.all([
    fetchReverse(latitude, longitude, "en").catch(() => null),
    fetchReverse(latitude, longitude, "ar").catch(() => null),
  ]);

  let cityEn = en?.city || "";
  let countryEn = en?.country || "";
  let cityAr = ar?.city || "";
  let countryAr = ar?.country || "";
  let countryCode = en?.countryCode || ar?.countryCode;

  if (!cityEn && !cityAr) {
    const near = nearestCity(latitude, longitude);
    if (near) {
      cityEn = near.city;
      countryEn = near.country;
      cityAr = near.cityAr;
      countryAr = near.countryAr;
      countryCode = near.countryCode;
    }
  }

  const fallback = language === "ar" ? "موقعك الحالي" : "Current location";
  return valid({
    city: cityEn || cityAr || fallback,
    country: countryEn || countryAr || "",
    cityAr: cityAr || cityEn || fallback,
    countryAr: countryAr || countryEn || "",
    countryCode,
    latitude,
    longitude,
    timezone: guessTimezone(),
  });
}

/** Precise device location via the browser/OS, reverse-geocoded to a name. */
async function fromBrowserGeolocation(
  language: "en" | "ar"
): Promise<GeoLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("geolocation unavailable");
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: GEO_TIMEOUT_MS,
      maximumAge: 0,
    });
  });
  return reverseGeocode(pos.coords.latitude, pos.coords.longitude, language);
}

/** Best-effort device timezone from the runtime. */
export function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const LocationService = {
  /**
   * Detect the user's location. Prefers precise device geolocation, then falls
   * back to IP providers in turn. Throws only if everything fails.
   */
  async detectAuto(language: "en" | "ar" = "en"): Promise<GeoLocation> {
    let lastErr: unknown;

    // 1) Precise device location (most accurate). Falls through on
    //    denial/timeout/unavailability.
    try {
      return await fromBrowserGeolocation(language);
    } catch (err) {
      lastErr = err;
    }

    // 2) IP-based providers (metro-accurate).
    for (const provider of PROVIDERS) {
      try {
        return await provider();
      } catch (err) {
        lastErr = err;
        // try the next provider
      }
    }
    throw new Error(
      `all geolocation providers failed: ${(lastErr as Error)?.message ?? "unknown"}`
    );
  },

  guessTimezone,
};
