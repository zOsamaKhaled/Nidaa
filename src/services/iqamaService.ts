import { IQAMA_CHIME, IQAMA_CUSTOM, type AppSettings } from "../types";
import { findIqamaSound } from "../data/iqamaSounds";
import { isYouTubeUrl, parseYouTubeId } from "../utils/youtube";
import { AudioService } from "./audioService";
import { YouTubeService } from "./youtubeService";

/**
 * IqamaService — the short call played at Iqama time.
 *
 * Deliberately separate from the Adhan pipeline: an Iqama is a few seconds
 * ("قد قامت الصلاة"), so we never fall back to a full Adhan recording. The
 * user picks one of:
 *   - the built-in chime (synthesized, always available offline),
 *   - a bundled Iqama recording from `data/iqamaSounds.ts`, or
 *   - their own link (`iqamaUrl`) — direct mp3 or YouTube.
 *
 * Anything that fails to play falls back to the chime, so the Iqama is never
 * silent and never turns into an Adhan.
 */

/** Play the Iqama alert. Never throws. */
export async function playIqama(settings: AppSettings): Promise<void> {
  const chime = () => AudioService.playChime(settings.volume);

  if (settings.iqamaSoundId === IQAMA_CHIME) {
    await chime();
    return;
  }

  if (settings.iqamaSoundId === IQAMA_CUSTOM) {
    const url = settings.iqamaUrl.trim();
    if (!url) {
      await chime();
      return;
    }
    try {
      if (isYouTubeUrl(url)) {
        const id = parseYouTubeId(url);
        if (!id) throw new Error("bad YouTube link");
        await YouTubeService.play(id, settings.volume, {});
        return;
      }
      await AudioService.playCandidates([url], settings.volume);
      return;
    } catch {
      await chime();
      return;
    }
  }

  // A bundled Iqama recording (offline).
  const sound = findIqamaSound(settings.iqamaSoundId);
  if (!sound) {
    await chime();
    return;
  }
  try {
    await AudioService.playCandidates(
      [`/audio/${sound.file}`],
      settings.volume
    );
  } catch {
    // File not present in this build — the chime keeps the alert audible.
    await chime();
  }
}
