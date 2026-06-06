import type { Muezzin } from "../types";

/**
 * Muezzins shipped with the app.
 *
 * Each entry can provide:
 *   - `file`: a local file under the bundled `audio/` resource directory
 *     (see `src-tauri/audio/` and `tauri.conf.json > bundle.resources`). This
 *     is always preferred when present.
 *   - `url`:  a remote streaming fallback (the actual, correctly-attributed
 *     recording for that reciter) used when the local `file` is missing or when
 *     running in the browser during dev.
 *
 * Streaming recordings are hosted by assabile.com and are attributed to the
 * named reciter, so each Muezzin sounds distinct out-of-the-box. Drop a matching
 * mp3 into `src-tauri/audio/` to play it locally/offline instead.
 */
export const MUEZZINS: Muezzin[] = [
  {
    id: "jazy",
    name: "Mohamed Jazy",
    nameKey: "jazy",
    file: "adhan-jazy.mp3",
    // Dedicated short clip (played in full; not truncated/editable). Offline.
    shortFile: "adhan-jazy-short.mp3",
  },
  {
    id: "qatami",
    name: "Nasser Al Qatami",
    nameKey: "qatami",
    file: "adhan-qatami.mp3",
    url: "https://media.assabile.com/assabile/adhan_3435370/6f509ec934a4.mp3",
  },
  {
    id: "dosari",
    name: "Yasser Al Dosari",
    nameKey: "dosari",
    file: "adhan-dosari.mp3",
    url: "https://media.assabile.com/assabile/adhan_3435370/f5370aa1a7e2.mp3",
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit Abdus Samad",
    nameKey: "abdulbasit",
    file: "adhan-abdulbasit.mp3",
    url: "https://media.assabile.com/assabile/adhan_3435370/1a014366658c.mp3",
  },
];

/** Default muezzin (streams out-of-the-box, no setup required). */
export const DEFAULT_MUEZZIN_ID = "qatami";

/** Default short-Adhan length (seconds) ≈ the opening four takbīrāt. */
export const DEFAULT_SHORT_SECONDS = 15;

/**
 * Last-resort streaming Adhan so playback is never silent. Uses a different
 * host than the reciter URLs above, so if one CDN blocks the webview the other
 * still works.
 */
export const FALLBACK_ADHAN_URL =
  "https://www.islamcan.com/audio/adhan/azan2.mp3";

/** Built-in + user-added muezzins. */
export function allMuezzins(custom: Muezzin[] = []): Muezzin[] {
  return [...MUEZZINS, ...custom];
}

/** Find a muezzin by id across built-in and custom lists. */
export function findMuezzin(id: string, custom: Muezzin[] = []): Muezzin {
  return allMuezzins(custom).find((m) => m.id === id) ?? MUEZZINS[0];
}

/** Resolve the short length (ms) for a muezzin from the per-muezzin overrides. */
export function shortMsFor(
  id: string,
  shortSeconds: Record<string, number> = {}
): number {
  const s = shortSeconds[id];
  return (s && s > 0 ? s : DEFAULT_SHORT_SECONDS) * 1000;
}

export function getMuezzin(id: string): Muezzin {
  return MUEZZINS.find((m) => m.id === id) ?? MUEZZINS[0];
}

/**
 * Bundled file used for the offline-default reciter. Prefers a dedicated short
 * clip when the reciter has one (e.g. Mohamed Jazy), otherwise the full file.
 */
export function offlineFileFor(id: string): string {
  const m = MUEZZINS.find((x) => x.id === id) ?? MUEZZINS[0];
  return m.shortFile ?? m.file;
}

/** True for the built-in reciters that ship with bundled (offline) audio. */
export function isBuiltInMuezzin(id: string): boolean {
  return MUEZZINS.some((m) => m.id === id);
}
