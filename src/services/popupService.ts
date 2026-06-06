/**
 * popupService — shared helper to open/close a borderless, always-on-top popup
 * WebviewWindow at the bottom-right of the screen. Used by both the reminder and
 * the azan popups. The popup loads the app bundle with query params that
 * `main.tsx` reads to decide which view to render.
 */

export function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function buildUrl(params: Record<string, string>): string {
  const p = new URLSearchParams(params).toString();
  // Resolve against the main window's own URL so the popup loads from the same
  // origin (the Vite dev server in dev, tauri://localhost in production). A bare
  // relative "index.html" isn't reliably resolved for runtime-created windows
  // and caused ERR_CONNECTION_REFUSED.
  const base = window.location.href.split("?")[0].split("#")[0];
  return `${base}?${p}`;
}

/** Open (replacing any existing) a popup window with the given label + params. */
export async function openPopup(
  label: string,
  params: Record<string, string>,
  width: number,
  height: number
): Promise<void> {
  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const { currentMonitor } = await import("@tauri-apps/api/window");

  try {
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) await existing.close();
  } catch {
    /* ignore */
  }

  let x = 100;
  let y = 100;
  try {
    const mon = await currentMonitor();
    if (mon) {
      const sf = mon.scaleFactor || 1;
      x = Math.round(mon.size.width / sf - width - 24);
      y = Math.round(mon.size.height / sf - height - 64);
    }
  } catch {
    /* use defaults */
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const done = (ok: boolean, err?: unknown) => {
      if (settled) return;
      settled = true;
      ok ? resolve() : reject(err ?? new Error("popup failed"));
    };
    const win = new WebviewWindow(label, {
      url: buildUrl(params),
      width,
      height,
      x,
      y,
      decorations: false,
      // Opaque: Windows webview transparency renders a black box around rounded
      // corners, so the card fills the whole (borderless) window instead.
      transparent: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focus: false,
      title: params.title || "Nidaa",
    });
    win.once("tauri://created", () => done(true));
    win.once("tauri://error", (e) => done(false, e.payload));
    setTimeout(() => done(false, new Error("popup timeout")), 4000);
  });
}

/** Close a popup window by label, if it exists. */
export async function closePopup(label: string): Promise<void> {
  if (!inTauri()) return;
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) await existing.close();
  } catch {
    /* ignore */
  }
}
