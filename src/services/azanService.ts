import { NotificationService } from "./notificationService";
import { inTauri, openPopup, closePopup } from "./popupService";

/**
 * AzanService — when the Adhan starts, shows a popup window announcing the
 * prayer with a Stop button. The Stop button (and closing the popup) emits the
 * `ADHAN_CONTROL_EVENT` which the main window listens for to stop playback.
 */

const POPUP_LABEL = "azan";

/** Event emitted by the azan popup to ask the main window to stop the Adhan. */
export const ADHAN_CONTROL_EVENT = "adhan-control";

export interface AzanContent {
  title: string; // e.g. "Adhan"
  prayer: string; // localized prayer name
  body: string; // e.g. "It is now time for Asr prayer"
  at: string; // formatted prayer time
  stopLabel: string;
  language: "en" | "ar";
  /** Auto-dismiss after this many ms. */
  ttlMs: number;
}

export const AzanService = {
  async show(c: AzanContent): Promise<void> {
    if (inTauri()) {
      try {
        await openPopup(
          POPUP_LABEL,
          {
            view: "azan",
            title: c.title,
            prayer: c.prayer,
            body: c.body,
            at: c.at,
            stop: c.stopLabel,
            lang: c.language,
            ttl: String(c.ttlMs),
          },
          420,
          300
        );
        return;
      } catch {
        // Popup unavailable — fall back to a native toast.
      }
    }
    await NotificationService.notify(c.title, `${c.body} • ${c.at}`);
  },

  async close(): Promise<void> {
    await closePopup(POPUP_LABEL);
  },
};
