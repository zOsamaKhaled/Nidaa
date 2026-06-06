import { useEffect } from "react";
import { ADHAN_CONTROL_EVENT } from "../services/azanService";

/**
 * AzanPopup — the contents of the azan window shown when the Adhan starts.
 * Renders standalone (params via URL). The Stop button (and any close) asks the
 * main window to stop playback via the `ADHAN_CONTROL_EVENT`, then closes.
 */

function param(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

async function stopAndClose() {
  try {
    if ("__TAURI_INTERNALS__" in window) {
      const { emit } = await import("@tauri-apps/api/event");
      await emit(ADHAN_CONTROL_EVENT, { action: "stop" });
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } else {
      window.close();
    }
  } catch {
    /* ignore */
  }
}

export function AzanPopup() {
  const lang = (param("lang") || "en") as "en" | "ar";
  const isAr = lang === "ar";
  const title = param("title");
  const prayer = param("prayer");
  const body = param("body");
  const at = param("at");
  const stop = param("stop") || (isAr ? "إيقاف" : "Stop");
  const ttl = Number(param("ttl")) || 240000;

  useEffect(() => {
    document.documentElement.setAttribute("dir", isAr ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    document.body.classList.add("reminder-body");
    const t = setTimeout(() => void stopAndClose(), ttl);
    return () => clearTimeout(t);
  }, [isAr, lang, ttl]);

  return (
    <div className="azan-card">
      <div className="azan-pulse">🕌</div>
      <div className="azan-title">{title}</div>
      <div className="azan-prayer">{prayer}</div>
      <div className="azan-sub">
        {body}
        {at ? ` · ${at}` : ""}
      </div>
      <button className="azan-stop" onClick={() => void stopAndClose()}>
        ⏹ {stop}
      </button>
    </div>
  );
}
