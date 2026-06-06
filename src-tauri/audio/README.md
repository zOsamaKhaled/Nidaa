# Adhan audio files

The app prefers **local bundled files** in this folder, declared in
`tauri.conf.json` under `bundle.resources` (`"audio/*"`) and resolved at runtime
by `AudioService` via `resolveResource("audio/<file>")`.

If a local file is missing, `AudioService` automatically falls back to the
streaming `url` defined for that entry in `src/data/muezzins.ts` (and, as a last
resort, to `FALLBACK_ADHAN_URL`), so the Adhan is **never silent** even with no
files present here.

## Optional files (override the streaming defaults)

Drop any of these `.mp3` files here to play them locally/offline instead of
streaming. Filenames must match `src/data/muezzins.ts`:

| Reciter                    | File name                  | Fajr file (optional)        |
| -------------------------- | -------------------------- | --------------------------- |
| Mishary Rashid Alafasy     | `adhan-alafasy.mp3`        | `adhan-alafasy-fajr.mp3`    |
| Abdul Basit Abdus Samad    | `adhan-abdulbasit.mp3`     |                             |
| Mahmoud Khalil Al-Hussary  | `adhan-husary.mp3`         |                             |
| Mohamed Siddiq El-Minshawi | `adhan-minshawi.mp3`       |                             |
| Nasser Al Qatami           | `adhan-qatami.mp3`         |                             |
| Yasser Al Dosari           | `adhan-dosari.mp3`         |                             |

The built-in reciter files are **bundled by default** (downloaded into this
folder and `public/audio/`), so the built-in reciters play **fully offline**.
They are served from the frontend at `/audio/<file>` (via `public/audio`, copied
to `dist/audio` on build) — `AudioService.localUrl` uses that path, which works
in both dev and packaged builds.

Custom (user-added) reciters stream from their mp3/YouTube URL and need internet;
when offline, playback falls back to the **Offline default reciter** chosen in
Settings (a bundled built-in).

**Short vs Full:** the Settings "Adhan length" option plays either the full
recording or a shortened ~40-second clip with a smooth fade-out. "Short" is done
by truncating playback in `AudioService`, so it works for every reciter without
separate short files.

## Adding more Muezzins

1. Drop the new `.mp3` here, e.g. `adhan-qatami.mp3`.
2. Add an entry to `MUEZZINS` in `src/data/muezzins.ts` with the same `file`.
3. (Optional) Add a separate Fajr recitation and set `fajrFile`.
4. Add the display name to `muezzins` in both `src/i18n/locales/en.json` and
   `ar.json`.

No other code changes are needed — the Settings screen renders the list.

> The `.mp3` files are git-ignored on purpose (they are large/licensed). Obtain
> recitations you have the right to distribute, or let the app fall back to the
> notification only when a file is missing.

## Dev (browser) fallback

When running `npm run dev` **without** the Tauri shell, files are served from
`public/audio/` instead. Copy the same files there for previewing in a browser.
