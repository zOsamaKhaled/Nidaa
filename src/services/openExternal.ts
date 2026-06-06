/**
 * Open a URL in the user's default browser. Uses the Tauri opener plugin when
 * available (so it opens the real browser, not the app's webview), with a
 * window.open fallback for plain browser/dev.
 */
export async function openExternal(url: string): Promise<void> {
  try {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    }
  } catch {
    /* fall through to window.open */
  }
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    /* ignore */
  }
}
