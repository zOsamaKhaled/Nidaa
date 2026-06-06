import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

/**
 * SystemService — client-side glue for OS integration that lives partly in
 * Rust (system tray, window show/hide) and partly in JS (autostart, theme).
 *
 * The system tray itself is created in Rust (`src-tauri/src/tray.rs`). Tray
 * menu clicks are forwarded to the webview as Tauri events; `onTrayEvent`
 * subscribes to them so React can react (toggle Adhan, change language…).
 */

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Enable/disable launch-on-login via the autostart plugin. */
export async function setAutostart(value: boolean): Promise<void> {
  if (!inTauri()) return;
  const currently = await isEnabled();
  if (value && !currently) await enable();
  if (!value && currently) await disable();
}

export type TrayEvent =
  | { kind: "toggle-adhan" }
  | { kind: "change-language" }
  | { kind: "open" };

/**
 * Subscribe to tray menu events emitted from Rust.
 * Returns an unsubscribe function.
 */
export async function onTrayEvent(
  handler: (event: TrayEvent) => void
): Promise<() => void> {
  if (!inTauri()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const unlisteners = await Promise.all([
    listen("tray://toggle-adhan", () => handler({ kind: "toggle-adhan" })),
    listen("tray://change-language", () => handler({ kind: "change-language" })),
    listen("tray://open", () => handler({ kind: "open" })),
  ]);
  return () => unlisteners.forEach((u) => u());
}

/** Tell Rust whether the Adhan is enabled so the tray label can update. */
export async function syncTrayAdhanState(enabled: boolean): Promise<void> {
  if (!inTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_tray_adhan_state", { enabled });
  } catch {
    /* command not registered in dev/web */
  }
}

/** Apply the chosen theme to the document (handles "system"). */
export function applyTheme(theme: "light" | "dark" | "system"): void {
  const root = document.documentElement;
  let resolved = theme;
  if (theme === "system") {
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    resolved = prefersDark ? "dark" : "light";
  }
  root.setAttribute("data-theme", resolved);
}
