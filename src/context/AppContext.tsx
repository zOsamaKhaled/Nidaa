import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppSettings, DEFAULT_SETTINGS } from "../types";
import { SettingsService } from "../services/settingsService";
import { applyLanguage } from "../i18n";
import { AudioService } from "../services/audioService";

interface AppContextValue {
  settings: AppSettings;
  ready: boolean;
  /** Persist a partial settings change and update state. */
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  // Initial load from disk.
  useEffect(() => {
    (async () => {
      const loaded = await SettingsService.load();
      setSettings(loaded);
      applyLanguage(loaded.language);
      setReady(true);
    })();
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Persist (fire-and-forget; load() always merges over defaults).
      void SettingsService.save(next);
      if (patch.language && patch.language !== prev.language) {
        applyLanguage(patch.language);
      }
      if (patch.volume !== undefined) {
        AudioService.setVolume(patch.volume);
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, ready, update }),
    [settings, ready, update]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
