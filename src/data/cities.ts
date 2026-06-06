import type { GeoLocation } from "../types";

/**
 * A curated dataset of major cities with coordinates + IANA timezone.
 *
 * This intentionally covers the Muslim world plus large diaspora cities so the
 * MVP works without a heavy external geocoding dependency. Each entry carries
 * everything the prayer-time engine needs (lat/lng/timezone), so prayer times
 * can be computed/fetched accurately regardless of where the user's machine is.
 *
 * To add a city: append an entry with name (English), localized Arabic name,
 * latitude, longitude, IANA timezone and the ISO country code.
 */
export interface CityEntry {
  city: string; // English name
  cityAr: string; // Arabic name
  country: string; // English country name
  countryAr: string; // Arabic country name
  countryCode: string; // ISO 3166-1 alpha-2
  latitude: number;
  longitude: number;
  timezone: string; // IANA tz
}

export const CITIES: CityEntry[] = [
  // Saudi Arabia
  { city: "Riyadh", cityAr: "الرياض", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 24.7136, longitude: 46.6753, timezone: "Asia/Riyadh" },
  { city: "Makkah", cityAr: "مكة المكرمة", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 21.3891, longitude: 39.8579, timezone: "Asia/Riyadh" },
  { city: "Madinah", cityAr: "المدينة المنورة", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 24.5247, longitude: 39.5692, timezone: "Asia/Riyadh" },
  { city: "Jeddah", cityAr: "جدة", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 21.4858, longitude: 39.1925, timezone: "Asia/Riyadh" },
  { city: "Dammam", cityAr: "الدمام", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 26.4207, longitude: 50.0888, timezone: "Asia/Riyadh" },
  { city: "Khobar", cityAr: "الخبر", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 26.2794, longitude: 50.2083, timezone: "Asia/Riyadh" },
  { city: "Dhahran", cityAr: "الظهران", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 26.2886, longitude: 50.1148, timezone: "Asia/Riyadh" },
  { city: "Qatif", cityAr: "القطيف", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 26.5196, longitude: 49.9962, timezone: "Asia/Riyadh" },
  { city: "Jubail", cityAr: "الجبيل", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 27.0046, longitude: 49.6606, timezone: "Asia/Riyadh" },
  { city: "Al-Ahsa (Hofuf)", cityAr: "الأحساء (الهفوف)", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 25.3833, longitude: 49.5872, timezone: "Asia/Riyadh" },
  { city: "Taif", cityAr: "الطائف", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 21.2703, longitude: 40.4158, timezone: "Asia/Riyadh" },
  { city: "Tabuk", cityAr: "تبوك", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 28.3838, longitude: 36.5550, timezone: "Asia/Riyadh" },
  { city: "Buraydah", cityAr: "بريدة", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 26.3260, longitude: 43.9750, timezone: "Asia/Riyadh" },
  { city: "Unaizah", cityAr: "عنيزة", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 26.0843, longitude: 43.9935, timezone: "Asia/Riyadh" },
  { city: "Hail", cityAr: "حائل", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 27.5114, longitude: 41.7208, timezone: "Asia/Riyadh" },
  { city: "Abha", cityAr: "أبها", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 18.2164, longitude: 42.5053, timezone: "Asia/Riyadh" },
  { city: "Khamis Mushait", cityAr: "خميس مشيط", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 18.3000, longitude: 42.7300, timezone: "Asia/Riyadh" },
  { city: "Jazan", cityAr: "جازان", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 16.8892, longitude: 42.5611, timezone: "Asia/Riyadh" },
  { city: "Najran", cityAr: "نجران", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 17.4924, longitude: 44.1277, timezone: "Asia/Riyadh" },
  { city: "Yanbu", cityAr: "ينبع", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 24.0890, longitude: 38.0618, timezone: "Asia/Riyadh" },
  { city: "Al Kharj", cityAr: "الخرج", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 24.1556, longitude: 47.3120, timezone: "Asia/Riyadh" },
  { city: "Sakaka", cityAr: "سكاكا", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 29.9697, longitude: 40.2064, timezone: "Asia/Riyadh" },
  { city: "Arar", cityAr: "عرعر", country: "Saudi Arabia", countryAr: "السعودية", countryCode: "SA", latitude: 30.9753, longitude: 41.0381, timezone: "Asia/Riyadh" },

  // Egypt
  { city: "Cairo", cityAr: "القاهرة", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 30.0444, longitude: 31.2357, timezone: "Africa/Cairo" },
  { city: "Alexandria", cityAr: "الإسكندرية", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 31.2001, longitude: 29.9187, timezone: "Africa/Cairo" },
  { city: "Giza", cityAr: "الجيزة", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 30.0131, longitude: 31.2089, timezone: "Africa/Cairo" },
  { city: "Mansoura", cityAr: "المنصورة", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 31.0409, longitude: 31.3785, timezone: "Africa/Cairo" },
  { city: "Tanta", cityAr: "طنطا", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 30.7865, longitude: 31.0004, timezone: "Africa/Cairo" },
  { city: "Asyut", cityAr: "أسيوط", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 27.1809, longitude: 31.1837, timezone: "Africa/Cairo" },
  { city: "Luxor", cityAr: "الأقصر", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 25.6872, longitude: 32.6396, timezone: "Africa/Cairo" },
  { city: "Port Said", cityAr: "بورسعيد", country: "Egypt", countryAr: "مصر", countryCode: "EG", latitude: 31.2653, longitude: 32.3019, timezone: "Africa/Cairo" },

  // UAE
  { city: "Dubai", cityAr: "دبي", country: "United Arab Emirates", countryAr: "الإمارات", countryCode: "AE", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai" },
  { city: "Abu Dhabi", cityAr: "أبو ظبي", country: "United Arab Emirates", countryAr: "الإمارات", countryCode: "AE", latitude: 24.4539, longitude: 54.3773, timezone: "Asia/Dubai" },
  { city: "Sharjah", cityAr: "الشارقة", country: "United Arab Emirates", countryAr: "الإمارات", countryCode: "AE", latitude: 25.3463, longitude: 55.4209, timezone: "Asia/Dubai" },
  { city: "Al Ain", cityAr: "العين", country: "United Arab Emirates", countryAr: "الإمارات", countryCode: "AE", latitude: 24.2075, longitude: 55.7447, timezone: "Asia/Dubai" },
  { city: "Ajman", cityAr: "عجمان", country: "United Arab Emirates", countryAr: "الإمارات", countryCode: "AE", latitude: 25.4052, longitude: 55.5136, timezone: "Asia/Dubai" },
  { city: "Ras Al Khaimah", cityAr: "رأس الخيمة", country: "United Arab Emirates", countryAr: "الإمارات", countryCode: "AE", latitude: 25.7895, longitude: 55.9432, timezone: "Asia/Dubai" },

  // Qatar / Kuwait / Bahrain / Oman / Yemen
  { city: "Doha", cityAr: "الدوحة", country: "Qatar", countryAr: "قطر", countryCode: "QA", latitude: 25.2854, longitude: 51.531, timezone: "Asia/Qatar" },
  { city: "Al Rayyan", cityAr: "الريان", country: "Qatar", countryAr: "قطر", countryCode: "QA", latitude: 25.2919, longitude: 51.4244, timezone: "Asia/Qatar" },
  { city: "Kuwait City", cityAr: "مدينة الكويت", country: "Kuwait", countryAr: "الكويت", countryCode: "KW", latitude: 29.3759, longitude: 47.9774, timezone: "Asia/Kuwait" },
  { city: "Al Ahmadi", cityAr: "الأحمدي", country: "Kuwait", countryAr: "الكويت", countryCode: "KW", latitude: 29.0769, longitude: 48.0838, timezone: "Asia/Kuwait" },
  { city: "Manama", cityAr: "المنامة", country: "Bahrain", countryAr: "البحرين", countryCode: "BH", latitude: 26.2285, longitude: 50.586, timezone: "Asia/Bahrain" },
  { city: "Riffa", cityAr: "الرفاع", country: "Bahrain", countryAr: "البحرين", countryCode: "BH", latitude: 26.1300, longitude: 50.5550, timezone: "Asia/Bahrain" },
  { city: "Muscat", cityAr: "مسقط", country: "Oman", countryAr: "عُمان", countryCode: "OM", latitude: 23.588, longitude: 58.3829, timezone: "Asia/Muscat" },
  { city: "Salalah", cityAr: "صلالة", country: "Oman", countryAr: "عُمان", countryCode: "OM", latitude: 17.0151, longitude: 54.0924, timezone: "Asia/Muscat" },
  { city: "Sana'a", cityAr: "صنعاء", country: "Yemen", countryAr: "اليمن", countryCode: "YE", latitude: 15.3694, longitude: 44.1910, timezone: "Asia/Aden" },
  { city: "Aden", cityAr: "عدن", country: "Yemen", countryAr: "اليمن", countryCode: "YE", latitude: 12.7855, longitude: 45.0187, timezone: "Asia/Aden" },

  // Jordan / Palestine / Lebanon / Syria / Iraq
  { city: "Amman", cityAr: "عمّان", country: "Jordan", countryAr: "الأردن", countryCode: "JO", latitude: 31.9454, longitude: 35.9284, timezone: "Asia/Amman" },
  { city: "Jerusalem", cityAr: "القدس", country: "Palestine", countryAr: "فلسطين", countryCode: "PS", latitude: 31.7683, longitude: 35.2137, timezone: "Asia/Hebron" },
  { city: "Gaza", cityAr: "غزة", country: "Palestine", countryAr: "فلسطين", countryCode: "PS", latitude: 31.5018, longitude: 34.4668, timezone: "Asia/Gaza" },
  { city: "Beirut", cityAr: "بيروت", country: "Lebanon", countryAr: "لبنان", countryCode: "LB", latitude: 33.8938, longitude: 35.5018, timezone: "Asia/Beirut" },
  { city: "Damascus", cityAr: "دمشق", country: "Syria", countryAr: "سوريا", countryCode: "SY", latitude: 33.5138, longitude: 36.2765, timezone: "Asia/Damascus" },
  { city: "Baghdad", cityAr: "بغداد", country: "Iraq", countryAr: "العراق", countryCode: "IQ", latitude: 33.3152, longitude: 44.3661, timezone: "Asia/Baghdad" },

  // North Africa
  { city: "Casablanca", cityAr: "الدار البيضاء", country: "Morocco", countryAr: "المغرب", countryCode: "MA", latitude: 33.5731, longitude: -7.5898, timezone: "Africa/Casablanca" },
  { city: "Rabat", cityAr: "الرباط", country: "Morocco", countryAr: "المغرب", countryCode: "MA", latitude: 34.0209, longitude: -6.8417, timezone: "Africa/Casablanca" },
  { city: "Algiers", cityAr: "الجزائر", country: "Algeria", countryAr: "الجزائر", countryCode: "DZ", latitude: 36.7538, longitude: 3.0588, timezone: "Africa/Algiers" },
  { city: "Tunis", cityAr: "تونس", country: "Tunisia", countryAr: "تونس", countryCode: "TN", latitude: 36.8065, longitude: 10.1815, timezone: "Africa/Tunis" },
  { city: "Tripoli", cityAr: "طرابلس", country: "Libya", countryAr: "ليبيا", countryCode: "LY", latitude: 32.8872, longitude: 13.1913, timezone: "Africa/Tripoli" },
  { city: "Khartoum", cityAr: "الخرطوم", country: "Sudan", countryAr: "السودان", countryCode: "SD", latitude: 15.5007, longitude: 32.5599, timezone: "Africa/Khartoum" },

  // Turkey / Iran
  { city: "Istanbul", cityAr: "إسطنبول", country: "Turkey", countryAr: "تركيا", countryCode: "TR", latitude: 41.0082, longitude: 28.9784, timezone: "Europe/Istanbul" },
  { city: "Ankara", cityAr: "أنقرة", country: "Turkey", countryAr: "تركيا", countryCode: "TR", latitude: 39.9334, longitude: 32.8597, timezone: "Europe/Istanbul" },
  { city: "Tehran", cityAr: "طهران", country: "Iran", countryAr: "إيران", countryCode: "IR", latitude: 35.6892, longitude: 51.389, timezone: "Asia/Tehran" },

  // South & Southeast Asia
  { city: "Karachi", cityAr: "كراتشي", country: "Pakistan", countryAr: "باكستان", countryCode: "PK", latitude: 24.8607, longitude: 67.0011, timezone: "Asia/Karachi" },
  { city: "Lahore", cityAr: "لاهور", country: "Pakistan", countryAr: "باكستان", countryCode: "PK", latitude: 31.5204, longitude: 74.3587, timezone: "Asia/Karachi" },
  { city: "Islamabad", cityAr: "إسلام آباد", country: "Pakistan", countryAr: "باكستان", countryCode: "PK", latitude: 33.6844, longitude: 73.0479, timezone: "Asia/Karachi" },
  { city: "Dhaka", cityAr: "دكا", country: "Bangladesh", countryAr: "بنغلاديش", countryCode: "BD", latitude: 23.8103, longitude: 90.4125, timezone: "Asia/Dhaka" },
  { city: "Delhi", cityAr: "دلهي", country: "India", countryAr: "الهند", countryCode: "IN", latitude: 28.7041, longitude: 77.1025, timezone: "Asia/Kolkata" },
  { city: "Mumbai", cityAr: "مومباي", country: "India", countryAr: "الهند", countryCode: "IN", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { city: "Jakarta", cityAr: "جاكرتا", country: "Indonesia", countryAr: "إندونيسيا", countryCode: "ID", latitude: -6.2088, longitude: 106.8456, timezone: "Asia/Jakarta" },
  { city: "Kuala Lumpur", cityAr: "كوالالمبور", country: "Malaysia", countryAr: "ماليزيا", countryCode: "MY", latitude: 3.139, longitude: 101.6869, timezone: "Asia/Kuala_Lumpur" },
  { city: "Singapore", cityAr: "سنغافورة", country: "Singapore", countryAr: "سنغافورة", countryCode: "SG", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore" },

  // Europe
  { city: "London", cityAr: "لندن", country: "United Kingdom", countryAr: "المملكة المتحدة", countryCode: "GB", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
  { city: "Birmingham", cityAr: "برمنغهام", country: "United Kingdom", countryAr: "المملكة المتحدة", countryCode: "GB", latitude: 52.4862, longitude: -1.8904, timezone: "Europe/London" },
  { city: "Paris", cityAr: "باريس", country: "France", countryAr: "فرنسا", countryCode: "FR", latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris" },
  { city: "Berlin", cityAr: "برلين", country: "Germany", countryAr: "ألمانيا", countryCode: "DE", latitude: 52.52, longitude: 13.405, timezone: "Europe/Berlin" },
  { city: "Amsterdam", cityAr: "أمستردام", country: "Netherlands", countryAr: "هولندا", countryCode: "NL", latitude: 52.3676, longitude: 4.9041, timezone: "Europe/Amsterdam" },
  { city: "Stockholm", cityAr: "ستوكهولم", country: "Sweden", countryAr: "السويد", countryCode: "SE", latitude: 59.3293, longitude: 18.0686, timezone: "Europe/Stockholm" },

  // North America
  { city: "New York", cityAr: "نيويورك", country: "United States", countryAr: "الولايات المتحدة", countryCode: "US", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" },
  { city: "Chicago", cityAr: "شيكاغو", country: "United States", countryAr: "الولايات المتحدة", countryCode: "US", latitude: 41.8781, longitude: -87.6298, timezone: "America/Chicago" },
  { city: "Houston", cityAr: "هيوستن", country: "United States", countryAr: "الولايات المتحدة", countryCode: "US", latitude: 29.7604, longitude: -95.3698, timezone: "America/Chicago" },
  { city: "Los Angeles", cityAr: "لوس أنجلوس", country: "United States", countryAr: "الولايات المتحدة", countryCode: "US", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles" },
  { city: "Toronto", cityAr: "تورنتو", country: "Canada", countryAr: "كندا", countryCode: "CA", latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto" },

  // Sub-Saharan Africa
  { city: "Lagos", cityAr: "لاغوس", country: "Nigeria", countryAr: "نيجيريا", countryCode: "NG", latitude: 6.5244, longitude: 3.3792, timezone: "Africa/Lagos" },
  { city: "Nairobi", cityAr: "نيروبي", country: "Kenya", countryAr: "كينيا", countryCode: "KE", latitude: -1.2921, longitude: 36.8219, timezone: "Africa/Nairobi" },
];

/** Nearest curated city to a coordinate (used as an offline name fallback). */
export function nearestCity(
  latitude: number,
  longitude: number
): CityEntry | null {
  let best: CityEntry | null = null;
  let bestD = Infinity;
  for (const c of CITIES) {
    const d =
      (c.latitude - latitude) ** 2 + (c.longitude - longitude) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Unique list of countries for the country selector. */
export interface CountryEntry {
  country: string;
  countryAr: string;
  countryCode: string;
}

export const COUNTRIES: CountryEntry[] = (() => {
  const seen = new Map<string, CountryEntry>();
  for (const c of CITIES) {
    if (!seen.has(c.countryCode)) {
      seen.set(c.countryCode, {
        country: c.country,
        countryAr: c.countryAr,
        countryCode: c.countryCode,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.country.localeCompare(b.country)
  );
})();

export function citiesForCountry(countryCode: string): CityEntry[] {
  return CITIES.filter((c) => c.countryCode === countryCode);
}

export function searchCities(query: string): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES;
  return CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(q) ||
      c.cityAr.includes(query.trim()) ||
      c.country.toLowerCase().includes(q) ||
      c.countryAr.includes(query.trim())
  );
}

export function cityToLocation(c: CityEntry): GeoLocation {
  return {
    city: c.city,
    country: c.country,
    cityAr: c.cityAr,
    countryAr: c.countryAr,
    countryCode: c.countryCode,
    latitude: c.latitude,
    longitude: c.longitude,
    timezone: c.timezone,
  };
}

/**
 * Live worldwide city search via the free Open-Meteo geocoding API
 * (no API key, HTTPS, CORS-enabled). This lets the user find *any* city on
 * earth, while the curated `CITIES` list above remains the instant/offline
 * fallback. Results carry lat/lng + IANA timezone, everything the prayer-time
 * engine needs.
 *
 * The API does not return Arabic names, so `cityAr`/`countryAr` fall back to
 * the Latin name; the prayer calculation is unaffected.
 */
export async function geocodeCities(
  query: string,
  signal?: AbortSignal,
  language: "en" | "ar" = "en"
): Promise<CityEntry[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // Open-Meteo matches and returns names in the requested language, so an
  // Arabic query like "الخبر" only works when language=ar.
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(q)}&count=20&language=${language}&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`geocoding HTTP ${res.status}`);
  const data = await res.json();
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  return results
    .filter((r) => typeof r.latitude === "number" && r.timezone)
    .map((r) => {
      // Disambiguate same-named cities by region, e.g. "Springfield (Illinois)".
      const region = r.admin1 && r.admin1 !== r.name ? ` (${r.admin1})` : "";
      const name = `${r.name}${region}`;
      const country = r.country ?? "";
      // The API only returns one language at a time; use it for both fields so
      // the entry renders correctly regardless of the current UI language.
      return {
        city: name,
        cityAr: name,
        country,
        countryAr: country,
        countryCode: r.country_code ?? "",
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone,
      } as CityEntry;
    });
}

/**
 * Merge curated + live results, de-duplicating by city+country and keeping the
 * curated entry (which has proper Arabic names) when both exist.
 */
export function mergeCityResults(
  curated: CityEntry[],
  live: CityEntry[]
): CityEntry[] {
  // De-duplicate by rounded coordinates (~1 km) so the same place coming back
  // from both the curated list and live geocoding — possibly in different
  // languages — is not shown twice. Curated entries win (better Arabic names).
  const key = (c: CityEntry) =>
    `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;
  const seen = new Set(curated.map(key));
  return [...curated, ...live.filter((c) => !seen.has(key(c)))];
}
