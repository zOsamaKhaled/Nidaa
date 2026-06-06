import { useEffect, useState } from "react";
import { useAppContext } from "./context/AppContext";
import { HomePage } from "./pages/Home";
import { SettingsPage } from "./pages/Settings";
import {
  applyTheme,
  onTrayEvent,
  syncTrayAdhanState,
} from "./services/systemService";
import { AudioService } from "./services/audioService";
import { AzanService, ADHAN_CONTROL_EVENT } from "./services/azanService";
import { inTauri } from "./services/popupService";

type Route = "home" | "settings";

export default function App() {
  const { settings, ready, update } = useAppContext();
  const [route, setRoute] = useState<Route>("home");

  // Apply theme whenever it changes (and react to OS theme switches).
  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme === "system" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  // Keep the tray's "Adhan: On/Off" label in sync.
  useEffect(() => {
    void syncTrayAdhanState(settings.adhanEnabled);
  }, [settings.adhanEnabled]);

  // Global Adhan controls (work from any page): the azan popup's Stop button
  // emits ADHAN_CONTROL_EVENT → stop playback; when audio ends, close the popup.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    if (inTauri()) {
      import("@tauri-apps/api/event").then(({ listen }) => {
        void listen(ADHAN_CONTROL_EVENT, () => {
          AudioService.stop();
          void AzanService.close();
        }).then((un) => {
          if (cancelled) un();
          else unlisten = un;
        });
      });
    }
    const offEnded = AudioService.onEnded(() => void AzanService.close());
    return () => {
      cancelled = true;
      unlisten?.();
      offEnded();
    };
  }, []);

  // Handle system-tray menu clicks coming from Rust.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      unsub = await onTrayEvent((e) => {
        if (e.kind === "toggle-adhan") {
          void update({ adhanEnabled: !settings.adhanEnabled });
        } else if (e.kind === "change-language") {
          void update({ language: settings.language === "ar" ? "en" : "ar" });
        } else if (e.kind === "open") {
          setRoute("home");
        }
      });
    })();
    return () => unsub?.();
  }, [settings.adhanEnabled, settings.language, update]);

  if (!ready) {
    return <div className="center">…</div>;
  }

  return route === "home" ? (
    <HomePage onOpenSettings={() => setRoute("settings")} />
  ) : (
    <SettingsPage onBack={() => setRoute("home")} />
  );
}
