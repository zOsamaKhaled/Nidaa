import type { Muezzin } from "../types";
import { FALLBACK_ADHAN_URL } from "../data/muezzins";
import { parseYouTubeId, isYouTubeUrl } from "../utils/youtube";
import { YouTubeService } from "./youtubeService";

/**
 * AudioService — plays the Adhan, preferring local bundled files and falling
 * back to streaming so it is never silent.
 *
 * Resolution order for a Muezzin:
 *   1. Local bundled file under the `audio/` resource dir (Tauri) or
 *      `/public/audio` (browser dev) — preferred, works offline.
 *   2. The Muezzin's own streaming `url` (if any).
 *   3. A shared streaming fallback, so a missing/badly-configured file still
 *      results in an audible Adhan.
 *
 * Each candidate is tried in order until one actually starts playing.
 *
 * A single shared <audio> element is used so we can guarantee only one Adhan or
 * preview plays at a time, and so volume/mute apply globally.
 */

let audio: HTMLAudioElement | null = null;
const endedCbs = new Set<() => void>();
function fireEnded(): void {
  endedCbs.forEach((cb) => cb());
}
function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = "none";
    audio.addEventListener("ended", fireEnded);
  }
  return audio;
}

/**
 * Resolve the local URL for a bundled audio file name, or null. Files live in
 * `public/audio/` → copied to `dist/audio/` at build, so the same `/audio/<file>`
 * path is served by the Vite dev server (dev) and the app protocol (packaged) —
 * making bundled reciters work fully offline in both. A missing file simply
 * 404s at play time and the next candidate is tried.
 */
async function localUrl(file: string): Promise<string | null> {
  if (!file) return null;
  return `/audio/${file}`;
}

/** Ordered list of candidate URLs to attempt for a Muezzin. */
interface Source {
  /** Local file name to prefer (may be ""). */
  file: string;
  /** Remote stream URL (may be undefined; may be a YouTube link). */
  remote?: string;
  /** YouTube video id when the source is YouTube and has no local file. */
  youtubeId: string | null;
  /** Whether playback should be truncated to the short length. */
  truncate: boolean;
}

/**
 * Resolve which audio source to play for a Muezzin given fajr/short options.
 * A reciter with a dedicated `shortFile` plays it in full (no truncation);
 * otherwise "short" truncates the full file.
 */
function resolveSource(
  muezzin: Muezzin,
  opts: { fajr?: boolean; short?: boolean }
): Source {
  const useFajr = !!opts.fajr && (!!muezzin.fajrFile || !!muezzin.fajrUrl);
  const useDedicatedShort = !!opts.short && !!muezzin.shortFile && !useFajr;
  const file = useFajr && muezzin.fajrFile
    ? muezzin.fajrFile
    : useDedicatedShort
    ? muezzin.shortFile!
    : muezzin.file;
  const remote = useFajr && muezzin.fajrUrl
    ? muezzin.fajrUrl
    : useDedicatedShort
    ? undefined // dedicated short clips are local-only
    : muezzin.url;
  const youtubeId = !file ? parseYouTubeId(remote) : null;
  const truncate = !!opts.short && !useDedicatedShort;
  return { file, remote, youtubeId, truncate };
}

/** Build the ordered list of <audio> candidate URLs for a resolved source. */
async function buildCandidates(
  src: Source,
  offlineFile?: string
): Promise<string[]> {
  const out: string[] = [];
  const local = await localUrl(src.file);
  if (local) out.push(local);
  // YouTube links aren't playable by <audio>; handled separately.
  if (src.remote && !isYouTubeUrl(src.remote)) out.push(src.remote);
  // The chosen offline-default (bundled local) comes BEFORE the online fallback,
  // so offline it plays that reciter — not a cached/generic stream.
  const offlineLocal = offlineFile ? await localUrl(offlineFile) : null;
  if (offlineLocal && !out.includes(offlineLocal)) out.push(offlineLocal);
  if (!out.includes(FALLBACK_ADHAN_URL)) out.push(FALLBACK_ADHAN_URL);
  return out;
}

// --- Short-clip handling: play a shortened Adhan with a smooth fade-out. ---
const DEFAULT_SHORT_MS = 15000;
const SHORT_FADE_MS = 2000;
let shortStopTimer: ReturnType<typeof setTimeout> | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

function clearShortTimers(): void {
  if (shortStopTimer) {
    clearTimeout(shortStopTimer);
    shortStopTimer = null;
  }
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

/** After `shortMs`, fade the volume out and stop — yielding a "short" Adhan. */
function scheduleShortStop(
  a: HTMLAudioElement,
  baseVolume: number,
  shortMs: number
): void {
  clearShortTimers();
  const total = Math.max(1500, shortMs);
  const fade = Math.min(SHORT_FADE_MS, total * 0.4);
  shortStopTimer = setTimeout(() => {
    const steps = 20;
    const stepMs = fade / steps;
    let i = 0;
    fadeTimer = setInterval(() => {
      i += 1;
      a.volume = Math.max(0, baseVolume * (1 - i / steps));
      if (i >= steps) {
        clearShortTimers();
        a.pause();
        a.currentTime = 0;
        a.volume = baseVolume; // restore for next playback
      }
    }, stepMs);
  }, Math.max(0, total - fade));
}

/** Try to play a single URL; resolves true if playback started. */
async function tryPlay(
  a: HTMLAudioElement,
  url: string,
  volume: number
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      a.removeEventListener("error", onErr);
      resolve(ok);
    };
    const onErr = () => done(false);
    a.addEventListener("error", onErr, { once: true });
    a.src = url;
    a.volume = Math.min(1, Math.max(0, volume));
    a.muted = volume <= 0;
    a.play().then(
      () => done(true),
      () => done(false)
    );
  });
}

export const AudioService = {
  /** Play the Adhan for a Muezzin. Resolves when playback *starts*. */
  async playAdhan(
    muezzin: Muezzin,
    opts: {
      volume: number;
      fajr?: boolean;
      short?: boolean;
      shortMs?: number;
      offlineFile?: string;
    }
  ): Promise<void> {
    const src = resolveSource(muezzin, { fajr: opts.fajr, short: opts.short });
    if (!src.file && src.youtubeId) {
      this.stop();
      try {
        await YouTubeService.play(src.youtubeId, opts.volume, {
          short: src.truncate,
          shortMs: opts.shortMs,
          onEnded: fireEnded,
        });
        return;
      } catch {
        // YouTube failed — fall through to the streaming fallback below.
      }
    }
    const urls = await buildCandidates(src, opts.offlineFile);
    await this.playCandidates(urls, opts.volume, {
      short: src.truncate,
      shortMs: opts.shortMs,
    });
  },

  /** Preview — same resolution as a real Adhan. */
  async preview(
    muezzin: Muezzin,
    volume: number,
    opts?: { short?: boolean; shortMs?: number; offlineFile?: string }
  ): Promise<void> {
    const src = resolveSource(muezzin, { short: opts?.short });
    if (!src.file && src.youtubeId) {
      this.stop();
      try {
        await YouTubeService.play(src.youtubeId, volume, {
          short: src.truncate,
          shortMs: opts?.shortMs,
          onEnded: fireEnded,
        });
        return;
      } catch {
        // fall through
      }
    }
    const urls = await buildCandidates(src, opts?.offlineFile);
    await this.playCandidates(urls, volume, {
      short: src.truncate,
      shortMs: opts?.shortMs,
    });
  },

  /** Try each candidate URL until one plays; throws if all fail. */
  async playCandidates(
    urls: string[],
    volume: number,
    opts?: { short?: boolean; shortMs?: number }
  ): Promise<void> {
    const a = el();
    this.stop();
    for (const url of urls) {
      if (await tryPlay(a, url, volume)) {
        if (opts?.short) {
          scheduleShortStop(
            a,
            Math.min(1, Math.max(0, volume)),
            opts.shortMs ?? DEFAULT_SHORT_MS
          );
        }
        return;
      }
    }
    throw new Error("audio play failed: no playable source");
  },

  /** Play a single explicit file/URL (kept for compatibility). */
  async play(file: string, volume: number): Promise<void> {
    const local = await localUrl(file);
    const urls = [local, file.startsWith("http") ? file : null, FALLBACK_ADHAN_URL]
      .filter((u): u is string => !!u);
    await this.playCandidates(urls, volume);
  },

  stop(): void {
    clearShortTimers();
    YouTubeService.stop();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  },

  setVolume(volume: number): void {
    if (audio) {
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.muted = volume <= 0;
    }
    YouTubeService.setVolume(volume);
  },

  isPlaying(): boolean {
    return (!!audio && !audio.paused) || YouTubeService.isActive();
  },

  /** Subscribe to "playback ended" (covers both <audio> and YouTube). */
  onEnded(cb: () => void): () => void {
    el(); // ensure the shared 'ended' listener is attached
    endedCbs.add(cb);
    return () => endedCbs.delete(cb);
  },

  /**
   * Play a short, pleasant two-note chime via the Web Audio API. Used for
   * reminder alerts. Self-contained (no audio file), works offline. Returns
   * silently if Web Audio is unavailable or blocked by autoplay policy.
   */
  async playChime(volume = 0.5): Promise<void> {
    try {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx: AudioContext = new Ctx();
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const notes = [880, 1174.66]; // A5 → D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        const peak = Math.min(1, Math.max(0, volume));
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(peak, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
      // Close the context shortly after the chime finishes.
      setTimeout(() => void ctx.close().catch(() => {}), 1200);
    } catch {
      /* ignore */
    }
  },
};
