import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * NotificationService — OS-level notifications via the Tauri notification
 * plugin. Works while the window is minimized or hidden to the tray.
 *
 * Falls back to the Web Notification API when running outside Tauri (dev).
 */

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export const NotificationService = {
  async ensurePermission(): Promise<boolean> {
    if (inTauri()) {
      let granted = await isPermissionGranted();
      if (!granted) {
        const result = await requestPermission();
        granted = result === "granted";
      }
      return granted;
    }
    // Web fallback
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    const res = await Notification.requestPermission();
    return res === "granted";
  },

  async notify(title: string, body: string): Promise<void> {
    const granted = await this.ensurePermission();
    if (!granted) return;
    if (inTauri()) {
      sendNotification({ title, body });
    } else if (typeof Notification !== "undefined") {
      new Notification(title, { body });
    }
  },
};
