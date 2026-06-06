/**
 * YouTubeService — plays the audio of a YouTube video through a hidden YouTube
 * IFrame player. Used for custom muezzins whose source is a YouTube link, so a
 * user can paste their preferred reciter's video instead of an mp3.
 *
 * Notes / limitations:
 *  - Only the audio is wanted, but YouTube requires the (hidden) player iframe.
 *  - Autoplay with sound works after a user gesture (Preview/Test). For an
 *    unattended scheduled Adhan the webview may block audible autoplay; the mp3
 *    reciters are unaffected.
 */

const API_SRC = "https://www.youtube.com/iframe_api";
const CONTAINER_ID = "yt-audio-host";

let apiReady: Promise<void> | null = null;
let player: any = null; // YT.Player
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function loadApi(): Promise<void> {
  if (apiReady) return apiReady;
  apiReady = new Promise<void>((resolve, reject) => {
    const w = window as any;
    if (w.YT && w.YT.Player) return resolve();
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = API_SRC;
    tag.onerror = () => reject(new Error("failed to load YouTube API"));
    document.head.appendChild(tag);
    // Safety timeout
    setTimeout(() => reject(new Error("YouTube API timeout")), 12000);
  });
  return apiReady;
}

function host(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body.appendChild(el);
  }
  // Fresh inner node for each player (the API replaces it with an iframe).
  el.innerHTML = "<div id='yt-audio-el'></div>";
  return document.getElementById("yt-audio-el") as HTMLElement;
}

function clearStopTimer() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
}

export const YouTubeService = {
  /** Start playing the given video's audio. Resolves once playback starts. */
  async play(
    videoId: string,
    volume: number,
    opts: { short?: boolean; shortMs?: number; onEnded?: () => void } = {}
  ): Promise<void> {
    await loadApi();
    this.stop();
    const YT = (window as any).YT;
    const target = host();

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      player = new YT.Player(target, {
        videoId,
        width: "1",
        height: "1",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.setVolume(Math.round(Math.min(1, Math.max(0, volume)) * 100));
              e.target.playVideo();
            } catch {
              /* ignore */
            }
            if (!settled) {
              settled = true;
              resolve();
            }
          },
          onError: () => {
            if (!settled) {
              settled = true;
              reject(new Error("YouTube playback error"));
            }
          },
          onStateChange: (e: any) => {
            // 0 === ended
            if (e.data === 0) opts.onEnded?.();
          },
        },
      });
      setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("YouTube player timeout"));
        }
      }, 12000);
    });

    if (opts.short) {
      const ms = Math.max(1500, opts.shortMs ?? 15000);
      clearStopTimer();
      stopTimer = setTimeout(() => {
        this.stop();
        opts.onEnded?.();
      }, ms);
    }
  },

  setVolume(volume: number): void {
    try {
      player?.setVolume(Math.round(Math.min(1, Math.max(0, volume)) * 100));
    } catch {
      /* ignore */
    }
  },

  isActive(): boolean {
    return !!player;
  },

  stop(): void {
    clearStopTimer();
    if (player) {
      try {
        player.stopVideo?.();
        player.destroy?.();
      } catch {
        /* ignore */
      }
      player = null;
    }
  },
};
