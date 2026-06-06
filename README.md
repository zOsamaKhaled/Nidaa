# Prayer Times Desktop App

A lightweight, installable desktop app for Islamic prayer times and automatic
Adhan playback. Bilingual (**Arabic / English**) with full **RTL/LTR** support,
system-tray background mode, reminders, and offline-tolerant prayer times.

> **MVP target:** Windows. The codebase is structured so macOS and Linux are a
> build-target change away (Tauri is cross-platform).

---

## 1. Recommended tech stack (and why)

**Tauri 2 + React + TypeScript + Vite.** Chosen over Electron and .NET:

| Concern | Tauri + React | Electron + React | .NET MAUI / WPF |
| --- | --- | --- | --- |
| Installer / binary size | ~3–10 MB | ~80–150 MB | medium |
| Memory footprint | low (OS webview) | high (bundled Chromium) | low |
| Background service + tray | first-class (Rust) | yes | yes |
| Cross-platform (future macOS/Linux) | yes | yes | weak / Windows-only |
| Web UI skills reuse (RTL, i18n) | yes (React) | yes (React) | no (XAML) |
| Native notifications, autostart, secure storage | plugins | plugins/manual | native |

Tauri gives a **tiny, fast, secure** app with a **Rust background layer** for the
system tray and OS integration, while letting us build the UI with React +
i18next — which makes Arabic RTL and translation trivial. .NET would lock us to
Windows; Electron is far heavier for the same result.

---

## 2. Features

- Bilingual **Arabic / English** UI, switchable at runtime, persisted locally.
- Automatic **RTL** (Arabic) / **LTR** (English) layout via the `<html dir>` attr.
- Prayer times for **Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha**.
- Calculation methods: Umm Al-Qura, Muslim World League, Egyptian, ISNA, Karachi,
  and more. Asr method: **Standard (Shafi'i)** / **Hanafi**.
- **Aladhan API** with local caching + an **offline calculation fallback**
  (`adhan` library) — never leaves the user with a blank screen.
- Correct **timezone** handling (per-location IANA timezone, not the device's).
- **Hijri date** via the Intl Islamic calendar.
- Location: **automatic** (IP geolocation, behind a consent button) or **manual**
  (country → city with search), persisted locally.
- **Adhan playback** at prayer time from **bundled local audio**, multiple
  Muezzins, **preview**, **volume**, **mute**, with **per-prayer/day dedupe**.
- **Notifications** at prayer start + optional **reminder** (5/10/15/custom min),
  working while minimized / in the tray.
- **System tray**: minimize-to-tray, Open / Toggle Adhan / Change language / Quit.
- Local persistence of every setting + last prayer times + playback records.
- Light / Dark / System theme. Start-on-boot toggle.

---

## 3. Architecture

Clean separation between **services** (logic, no UI), **hooks** (React glue),
**components/pages** (UI), and the **Rust** native layer.

```
src/
  types/                 Domain types + DEFAULT_SETTINGS
  data/
    calculationMethods.ts  Aladhan method ids
    muezzins.ts            Bundled Muezzin list (add new ones here)
    cities.ts              Country/city dataset (coords + timezone) + search
  i18n/
    index.ts               I18nService: init, language + dir switching
    locales/en.json
    locales/ar.json
  services/
    storageService.ts      Tauri Store (JSON in app-data) + localStorage fallback
    settingsService.ts     Typed load/save/patch of AppSettings
    locationService.ts     Automatic IP geolocation
    prayerTimesApiService.ts  Aladhan fetch + cache + offline fallback + Hijri
    audioService.ts        Adhan/preview playback from bundled files
    notificationService.ts OS notifications (Tauri plugin / Web fallback)
    schedulerService.ts    Pure time logic + playback-record dedupe store
    systemService.ts       Autostart, tray event bridge, theme
  hooks/
    usePrayerTimes.ts      Fetch + daily refresh
    useCountdown.ts        Next prayer + live countdown
    useScheduler.ts        The background engine (fires notifications + Adhan)
  context/AppContext.tsx   Settings state + persistence
  components/              Header, NextPrayerHero, PrayerCard, LocationPicker
  pages/                   Home, Settings
  styles/global.css        Theme + RTL-safe (logical properties)

src-tauri/
  src/lib.rs               App bootstrap, plugins, close-to-tray, commands
  src/tray.rs              SystemTrayService (native): tray menu + events
  src/main.rs
  tauri.conf.json          Window, bundle (nsis/msi), resources, plugins
  capabilities/default.json  Permission allow-list
  audio/                   Bundled Adhan .mp3 files (see audio/README.md)
  icons/                   Generated app icons (see icons/README.md)
```

Service-to-requirement mapping: `PrayerTimesApiService`, `LocationService`,
`AudioService`, `NotificationService`, `SettingsService`, `SchedulerService`,
`I18nService` (`i18n/index.ts`), `StorageService`, UI components, and
`SystemTrayService` (`src-tauri/src/tray.rs` + `systemService.ts`).

---

## 4. Prerequisites

Install once on your machine:

1. **Node.js** ≥ 18 — <https://nodejs.org>
2. **Rust** (stable) via **rustup** — <https://rustup.rs>
3. **Windows build tools** — *Microsoft C++ Build Tools* (Desktop development
   with C++) and **WebView2** runtime (preinstalled on Windows 10/11).

Verify:

```powershell
node -v
npm -v
rustc --version
cargo --version
```

---

## 5. Development setup

```powershell
# from the project root
npm install

# generate app icons once (needs a 1024x1024 PNG named app-icon.png at root)
npm run tauri icon ./app-icon.png

# (optional) add Adhan audio for testing — see src-tauri/audio/README.md
#   src-tauri/audio/adhan-alafasy.mp3
#   src-tauri/audio/adhan-abdulbasit.mp3

# run the desktop app with hot reload
npm run tauri:dev
```

- Frontend-only preview in a browser (no tray/notifications):
  `npm run dev` then open <http://localhost:1420>.

---

## 6. Production build (Windows installer)

```powershell
npm run tauri:build
```

Outputs land in `src-tauri/target/release/bundle/`:

- `nsis/Prayer Times_0.1.0_x64-setup.exe` — recommended installer.
- `msi/Prayer Times_0.1.0_x64_en-US.msi` — MSI alternative.

Both are self-contained installers you can copy to another Windows machine and
run. (WebView2 is auto-installed by the NSIS installer if missing.)

> macOS/Linux: run `npm run tauri:build` on that OS to produce `.dmg`/`.AppImage`/`.deb`.

---

## 7. How to add a new language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<code>.json` and translate
   **all** values (the app never hardcodes UI strings).
2. In `src/i18n/index.ts`: import it and add to `resources`; if it is
   right-to-left, add the code to `RTL_LANGUAGES`.
3. Add the code to the `Language` type in `src/types/index.ts`.
4. Add a button for it in the Settings language selector (`src/pages/Settings.tsx`).

Direction (RTL/LTR) is then handled automatically.

## 8. How to add a new Muezzin

1. Put the `.mp3` in `src-tauri/audio/` (and `public/audio/` for browser dev).
2. Add an entry to `MUEZZINS` in `src/data/muezzins.ts` (same `file` name).
   Optionally set `fajrFile` for a separate Fajr recitation.
3. Add the display name under `muezzins` in **both** locale JSON files.

The Settings list (with preview) updates automatically — no UI changes needed.

## 9. How to add cities / countries

Append entries to `CITIES` in `src/data/cities.ts` (English + Arabic name,
latitude, longitude, IANA timezone, ISO country code). Countries and search are
derived automatically.

---

## 10. Implementation notes

- **No hardcoded UI text** — everything goes through i18next.
- **No streaming-only audio** — Adhan plays from bundled/cached local files.
- **API failures are graceful** — cache first, then offline calculation, with an
  on-screen offline warning.
- **Timezone-correct** — times are computed/displayed in the *location's* IANA
  timezone, not the device's.
- **Recalculation** — `usePrayerTimes` refetches on city / method / Asr change and
  at day rollover; `useScheduler` always reads the latest settings.
- **No duplicate Adhan / notifications** — `PlaybackStore` records what fired per
  prayer per day and resets at midnight.

---

## 11. MVP scope (delivered)

Windows app · AR/EN · RTL/LTR · manual + auto location · API prayer times ·
next-prayer highlight + countdown · 2 Muezzins + preview · Adhan at prayer time ·
notifications · system tray · local settings.

## 12. Future improvements (prepared for)

macOS/Linux builds · more Muezzins · separate Fajr Adhan (`fajrFile` already in
the model) · offline calculation (already wired as fallback) · monthly timetable ·
widget mode · dark/light (done) · auto-updates · custom Adhan upload ·
multiple calculation APIs.

---

## License

MIT. Adhan audio files are **not** included — supply recitations you have the
right to distribute.
"# Nidaa" 
"# Nidaa" 
