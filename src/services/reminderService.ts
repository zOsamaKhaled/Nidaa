import { AudioService } from "./audioService";
import { NotificationService } from "./notificationService";
import { inTauri, openPopup } from "./popupService";

/**
 * ReminderService — shows a prayer reminder as a custom, styled popup window
 * at the bottom-right of the screen (with a chime), and falls back to a native
 * OS notification if the popup can't be created (e.g. permission missing or
 * running outside Tauri).
 */

export interface ReminderContent {
  title: string;
  body: string;
  prayer: string;
  hadithAr: string;
  hadithEn: string;
  source: string;
  sourceEn: string;
  language: "en" | "ar";
}

const POPUP_LABEL = "reminder";

export const ReminderService = {
  async show(c: ReminderContent): Promise<void> {
    // Chime from the main window's audio context (already unlocked by prior
    // user interaction), so there is sound even when the popup is silent.
    void AudioService.playChime();

    if (inTauri()) {
      try {
        await openPopup(
          POPUP_LABEL,
          {
            view: "reminder",
            title: c.title,
            body: c.body,
            prayer: c.prayer,
            hadithAr: c.hadithAr,
            hadithEn: c.hadithEn,
            source: c.source,
            sourceEn: c.sourceEn,
            lang: c.language,
          },
          440,
          320
        );
        return;
      } catch {
        // Popup unavailable — fall back to a native toast (still bottom-right).
      }
    }
    await NotificationService.notify(c.title, `${c.body}\n\n${c.hadithAr}`);
  },
};
