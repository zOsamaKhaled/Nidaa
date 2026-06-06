import { useEffect, useState } from "react";

/**
 * ReminderPopup — the contents of the bottom-right reminder window. It renders
 * standalone (no app context / i18n provider): everything it needs is passed
 * via URL query params by `ReminderService`. Auto-dismisses after a timeout and
 * can be closed manually.
 */

const AUTO_DISMISS_MS = 14000;

function param(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

async function closeSelf() {
  try {
    if ("__TAURI_INTERNALS__" in window) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } else {
      window.close();
    }
  } catch {
    /* ignore */
  }
}

export function ReminderPopup() {
  const lang = (param("lang") || "en") as "en" | "ar";
  const isAr = lang === "ar";
  const title = param("title");
  const body = param("body");
  const prayer = param("prayer");
  const hadithAr = param("hadithAr");
  const hadithEn = param("hadithEn");
  const source = isAr ? param("source") : param("sourceEn");

  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isAr ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    document.body.classList.add("reminder-body");
    const t1 = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS - 400);
    const t2 = setTimeout(() => void closeSelf(), AUTO_DISMISS_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isAr, lang]);

  return (
    <div className={`reminder-card${leaving ? " leaving" : ""}`}>
      <button
        className="reminder-close"
        aria-label="close"
        onClick={() => void closeSelf()}
      >
        ✕
      </button>

      <div className="reminder-head">
        <span className="reminder-icon">🕌</span>
        <div>
          <div className="reminder-title">{title}</div>
          <div className="reminder-sub">{body}</div>
        </div>
      </div>

      <div className="reminder-hadith" lang="ar" dir="rtl">
        {hadithAr}
      </div>
      {!isAr && hadithEn && <div className="reminder-hadith-en">{hadithEn}</div>}

      <div className="reminder-source">
        — {source}
        {prayer ? ` · ${prayer}` : ""}
      </div>

      <div className="reminder-progress">
        <span style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }} />
      </div>
    </div>
  );
}
