import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
import { LocationPicker } from "../components/LocationPicker";
import { CALCULATION_METHODS } from "../data/calculationMethods";
import {
  MUEZZINS,
  allMuezzins,
  findMuezzin,
  shortMsFor,
  offlineFileFor,
  isBuiltInMuezzin,
  DEFAULT_SHORT_SECONDS,
  DEFAULT_MUEZZIN_ID,
} from "../data/muezzins";
import { isYouTubeUrl } from "../utils/youtube";
import { AudioService } from "../services/audioService";
import { ReminderService } from "../services/reminderService";
import { AzanService } from "../services/azanService";
import { NotificationService } from "../services/notificationService";
import { randomHadith } from "../data/hadiths";
import { formatTime } from "../utils/time";
import { PrayerTimesApiService } from "../services/prayerTimesApiService";
import { PlaybackStore } from "../services/schedulerService";
import { openExternal } from "../services/openExternal";
import { UpdateService, type UpdateResult } from "../services/updateService";
import { APP_VERSION, DONATE_URL } from "../version";
import {
  ADHAN_PRAYERS,
  DEFAULT_IQAMA_OFFSETS,
  IQAMA_CUSTOM,
  type AdhanLength,
  type AsrMethod,
  type IqamaPrayer,
  type Language,
  type LocationMode,
  type Muezzin,
  type TimeFormat,
} from "../types";
import { playIqama } from "../services/iqamaService";
import { IQAMA_SOUNDS } from "../data/iqamaSounds";
import { setAutostart } from "../services/systemService";

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { settings, update } = useAppContext();
  const [toast, setToast] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateResult | null>(null);

  async function checkUpdates() {
    setChecking(true);
    setUpdateInfo(null);
    try {
      setUpdateInfo(await UpdateService.check());
    } finally {
      setChecking(false);
    }
  }

  const muezzins = allMuezzins(settings.customMuezzins);

  useEffect(() => {
    const off = AudioService.onEnded(() => setPreviewing(null));
    return off;
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function muezzinLabel(m: Muezzin): string {
    return m.nameKey ? t(`muezzins.${m.nameKey}`) : m.name;
  }

  async function previewMuezzin(id: string) {
    if (previewing === id) {
      AudioService.stop();
      setPreviewing(null);
      return;
    }
    try {
      await AudioService.preview(
        findMuezzin(id, settings.customMuezzins),
        settings.volume,
        {
          short: settings.adhanLength === "short",
          shortMs: shortMsFor(id, settings.shortSeconds),
          offlineFile: offlineFileFor(settings.offlineDefaultId),
        }
      );
      setPreviewing(id);
    } catch {
      showToast(t("errors.audioFailed"));
    }
  }

  function setShortSeconds(id: string, seconds: number) {
    void update({
      shortSeconds: { ...settings.shortSeconds, [id]: seconds },
    });
  }

  function addMuezzin() {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !url) return;
    const m: Muezzin = { id: `custom-${Date.now()}`, name, file: "", url };
    void update({ customMuezzins: [...settings.customMuezzins, m] });
    setNewName("");
    setNewUrl("");
    showToast(t("settings.muezzinAdded"));
  }

  function removeMuezzin(id: string) {
    const rest = { ...settings.shortSeconds };
    delete rest[id];
    void update({
      customMuezzins: settings.customMuezzins.filter((m) => m.id !== id),
      shortSeconds: rest,
      muezzinId:
        settings.muezzinId === id ? DEFAULT_MUEZZIN_ID : settings.muezzinId,
    });
  }

  async function testAdhan() {
    const lang = i18n.language === "ar" ? "ar" : "en";
    const short = settings.adhanLength === "short";
    const shortMs = shortMsFor(settings.muezzinId, settings.shortSeconds);
    const prayer = t("prayers.dhuhr");
    try {
      await AudioService.playAdhan(
        findMuezzin(settings.muezzinId, settings.customMuezzins),
        {
          volume: settings.volume,
          short,
          shortMs,
          offlineFile: offlineFileFor(settings.offlineDefaultId),
        }
      );
      void AzanService.show({
        title: t("notifications.azanTitle"),
        prayer,
        body: t("notifications.timeStartedBody", { prayer }),
        at: formatTime(
          new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date()),
          settings.timeFormat,
          lang
        ),
        stopLabel: t("settings.stopPreview"),
        language: lang,
        ttlMs: short ? shortMs + 2500 : 240000,
      });
      showToast(t("settings.testSent"));
    } catch {
      showToast(t("errors.audioFailed"));
    }
  }

  function setIqamaOffset(prayer: IqamaPrayer, minutes: number) {
    const clamped = Math.min(120, Math.max(0, Math.round(minutes) || 0));
    void update({
      iqamaOffsets: { ...settings.iqamaOffsets, [prayer]: clamped },
    });
  }

  /** Preview the Iqama exactly as it will fire (sound + popup). */
  async function testIqama() {
    const lang = i18n.language === "ar" ? "ar" : "en";
    const prayer = t("prayers.maghrib");
    try {
      await playIqama(settings);
    } catch {
      showToast(t("errors.audioFailed"));
    }
    void AzanService.show({
      title: t("notifications.iqamaTitle"),
      prayer,
      body: t("notifications.iqamaBody", { prayer }),
      at: formatTime(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
        settings.timeFormat,
        lang
      ),
      stopLabel: t("settings.stopPreview"),
      language: lang,
      ttlMs: 30000,
    });
    showToast(t("settings.testSent"));
  }

  async function toggleStartup(value: boolean) {
    await update({ startOnBoot: value });
    try {
      await setAutostart(value);
    } catch {
      /* autostart plugin unavailable (e.g. web dev) */
    }
  }

  async function clearCache() {
    if (!confirm(t("settings.clearCacheConfirm"))) return;
    await PrayerTimesApiService.clearCache();
    await PlaybackStore.clear();
    showToast(t("settings.cacheCleared"));
  }

  async function testReminder() {
    const lang = i18n.language === "ar" ? "ar" : "en";
    const h = randomHadith();
    const prayer = t("prayers.asr");
    await ReminderService.show({
      title: t("notifications.reminderTitle"),
      body: t("notifications.reminderBody", {
        count: settings.reminderMinutes || 10,
        prayer,
      }),
      prayer,
      hadithAr: h.ar,
      hadithEn: h.en,
      source: h.source,
      sourceEn: h.sourceEn,
      language: lang,
    });
    showToast(t("settings.testSent"));
  }

  async function testNotification() {
    await NotificationService.notify(
      t("notifications.timeStartedTitle"),
      t("notifications.timeStartedBody", { prayer: t("prayers.dhuhr") })
    );
    showToast(t("settings.testSent"));
  }

  return (
    <div className="app">
      <header className="header">
        <div className="city">{t("settings.title")}</div>
        <button className="ghost" onClick={onBack}>
          ← {t("common.back")}
        </button>
      </header>

      {/* Language */}
      <div className="section">
        <h3>{t("settings.language")}</h3>
        <div className="seg">
          {(["en", "ar"] as Language[]).map((lng) => (
            <button
              key={lng}
              className={settings.language === lng ? "active" : ""}
              onClick={() => update({ language: lng })}
            >
              {lng === "ar" ? t("settings.languageArabic") : t("settings.languageEnglish")}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="section">
        <h3>{t("settings.locationSection")}</h3>
        <LocationPicker
          mode={settings.locationMode}
          location={settings.location}
          onModeChange={(mode: LocationMode) => update({ locationMode: mode })}
          onLocationChange={(loc) => update({ location: loc })}
        />
      </div>

      {/* Calculation */}
      <div className="section">
        <h3>{t("settings.calculationSection")}</h3>
        <div className="field">
          <label>{t("settings.calculationMethod")}</label>
          <select
            value={settings.calculationMethod}
            onChange={(e) => update({ calculationMethod: Number(e.target.value) })}
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {t(`methods.${m.key}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("settings.asrMethod")}</label>
          <div className="seg">
            {(["standard", "hanafi"] as AsrMethod[]).map((a) => (
              <button
                key={a}
                className={settings.asrMethod === a ? "active" : ""}
                onClick={() => update({ asrMethod: a })}
              >
                {a === "standard" ? t("settings.asrStandard") : t("settings.asrHanafi")}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t("settings.timeFormat")}</label>
          <div className="seg">
            {(["12h", "24h"] as TimeFormat[]).map((f) => (
              <button
                key={f}
                className={settings.timeFormat === f ? "active" : ""}
                onClick={() => update({ timeFormat: f })}
              >
                {f === "12h"
                  ? t("settings.timeFormat12")
                  : t("settings.timeFormat24")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio */}
      <div className="section">
        <h3>{t("settings.audioSection")}</h3>
        <div className="field">
          <label>{t("settings.muezzin")}</label>
          {muezzins.map((m) => {
            const isCustom = m.id.startsWith("custom-");
            const offline = isBuiltInMuezzin(m.id);
            const youtube = isYouTubeUrl(m.url);
            const fixedShort = !!m.shortFile; // dedicated short clip → not editable
            return (
              <div className="muezzin-row" key={m.id}>
                <label className="row muezzin-pick" style={{ gap: 8 }}>
                  <input
                    type="radio"
                    name="muezzin"
                    checked={settings.muezzinId === m.id}
                    onChange={() => update({ muezzinId: m.id })}
                  />
                  <span>{muezzinLabel(m)}</span>
                  {offline ? (
                    <span className="tag tag-offline">{t("settings.tagOffline")}</span>
                  ) : (
                    <span className="tag tag-online">
                      {youtube ? t("settings.tagYouTube") : t("settings.tagOnline")}
                    </span>
                  )}
                </label>
                <div className="row" style={{ gap: 6 }}>
                  {fixedShort ? (
                    <span className="short-unit" title={t("settings.fixedShortHint")}>
                      {t("settings.fixedShort")}
                    </span>
                  ) : (
                    <span className="short-field" title={t("settings.shortLengthHint")}>
                      <input
                        type="number"
                        min={3}
                        max={180}
                        value={settings.shortSeconds[m.id] ?? DEFAULT_SHORT_SECONDS}
                        onChange={(e) =>
                          setShortSeconds(m.id, Math.max(0, Number(e.target.value)))
                        }
                      />
                      <span className="short-unit">{t("settings.seconds")}</span>
                    </span>
                  )}
                  <button className="ghost" onClick={() => previewMuezzin(m.id)}>
                    {previewing === m.id
                      ? `⏹ ${t("settings.stopPreview")}`
                      : `▶ ${t("settings.preview")}`}
                  </button>
                  {isCustom && (
                    <button
                      className="ghost icon"
                      title={t("settings.removeMuezzin")}
                      onClick={() => removeMuezzin(m.id)}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add a custom muezzin */}
        <div className="field">
          <label>{t("settings.addMuezzin")}</label>
          <div className="add-muezzin">
            <input
              type="text"
              placeholder={t("settings.muezzinName")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="url"
              placeholder={t("settings.muezzinUrl")}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <button
              className="primary"
              onClick={addMuezzin}
              disabled={!newName.trim() || !newUrl.trim()}
            >
              ＋ {t("settings.add")}
            </button>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            {t("settings.shortLengthHint")}
          </span>
        </div>

        <div className="field">
          <label>{t("settings.offlineDefault")}</label>
          <select
            value={settings.offlineDefaultId}
            onChange={(e) => update({ offlineDefaultId: e.target.value })}
          >
            {MUEZZINS.map((m) => (
              <option key={m.id} value={m.id}>
                {muezzinLabel(m)}
              </option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: 12 }}>
            {t("settings.offlineDefaultHint")}
          </span>
        </div>

        <div className="field">
          <label>{t("settings.adhanLength")}</label>
          <div className="seg">
            {(["full", "short"] as AdhanLength[]).map((l) => (
              <button
                key={l}
                className={settings.adhanLength === l ? "active" : ""}
                onClick={() => update({ adhanLength: l })}
              >
                {l === "full"
                  ? t("settings.adhanFull")
                  : t("settings.adhanShort")}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>
            {t("settings.volume")} — {Math.round(settings.volume * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
          />
        </div>
        <div className="field-row">
          <label>{t("settings.adhanEnabled")}</label>
          <input
            type="checkbox"
            checked={settings.adhanEnabled}
            onChange={(e) => update({ adhanEnabled: e.target.checked })}
          />
        </div>
        <div className="field">
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="primary" onClick={() => void testAdhan()}>
              ▶ {t("settings.testAdhan")}
            </button>
            <button className="ghost" onClick={() => AudioService.stop()}>
              ⏹ {t("settings.stopPreview")}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="section">
        <h3>{t("settings.notificationsSection")}</h3>
        <div className="field-row">
          <label>{t("settings.remindersEnabled")}</label>
          <input
            type="checkbox"
            checked={settings.remindersEnabled}
            onChange={(e) => update({ remindersEnabled: e.target.checked })}
          />
        </div>
        {settings.remindersEnabled && (
          <div className="field">
            <label>{t("settings.reminderTime")}</label>
            <div className="seg">
              {[5, 10, 15].map((min) => (
                <button
                  key={min}
                  className={settings.reminderMinutes === min ? "active" : ""}
                  onClick={() => update({ reminderMinutes: min })}
                >
                  {t("settings.minutesBefore", { count: min })}
                </button>
              ))}
            </div>
            <label style={{ marginTop: 8 }}>{t("settings.customMinutes")}</label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.reminderMinutes}
              onChange={(e) =>
                update({ reminderMinutes: Math.max(0, Number(e.target.value)) })
              }
            />
          </div>
        )}
        <div className="field">
          <label>{t("settings.testSection")}</label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="ghost" onClick={() => void testReminder()}>
              🔔 {t("settings.testReminder")}
            </button>
            <button className="ghost" onClick={() => void testNotification()}>
              💬 {t("settings.testNotification")}
            </button>
          </div>
        </div>
      </div>

      {/* Iqama */}
      <div className="section">
        <h3>{t("settings.iqamaSection")}</h3>
        <span className="muted" style={{ fontSize: 12 }}>
          {t("settings.iqamaHint")}
        </span>

        <div className="field-row">
          <label>{t("settings.iqamaEnabled")}</label>
          <input
            type="checkbox"
            checked={settings.iqamaEnabled}
            onChange={(e) => update({ iqamaEnabled: e.target.checked })}
          />
        </div>

        {settings.iqamaEnabled && (
          <>
            <div className="field">
              <label>{t("settings.iqamaOffsets")}</label>
              {(ADHAN_PRAYERS as IqamaPrayer[]).map((p) => (
                <div className="muezzin-row" key={p}>
                  <span>{t(`prayers.${p}`)}</span>
                  <span className="short-field">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={settings.iqamaOffsets[p] ?? 0}
                      onChange={(e) => setIqamaOffset(p, Number(e.target.value))}
                    />
                    <span className="short-unit">{t("settings.minutes")}</span>
                  </span>
                </div>
              ))}
              <span className="muted" style={{ fontSize: 12 }}>
                {t("settings.iqamaOffsetsHint")}
              </span>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button
                  className="ghost"
                  onClick={() =>
                    update({ iqamaOffsets: { ...DEFAULT_IQAMA_OFFSETS } })
                  }
                >
                  ↺ {t("settings.iqamaReset")}
                </button>
              </div>
            </div>

            <div className="field">
              <label>{t("settings.iqamaSound")}</label>
              <select
                value={settings.iqamaSoundId}
                onChange={(e) => update({ iqamaSoundId: e.target.value })}
              >
                {IQAMA_SOUNDS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(`iqamaSounds.${s.nameKey}`)}
                  </option>
                ))}
                <option value={IQAMA_CUSTOM}>{t("settings.iqamaCustom")}</option>
              </select>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button
                  className="ghost"
                  onClick={() => void playIqama(settings)}
                >
                  ▶ {t("settings.preview")}
                </button>
                <button className="ghost" onClick={() => AudioService.stop()}>
                  ⏹ {t("settings.stopPreview")}
                </button>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {t("settings.iqamaSoundHint")}
              </span>
            </div>

            {settings.iqamaSoundId === IQAMA_CUSTOM && (
              <div className="field">
                <label>{t("settings.iqamaUrl")}</label>
                <input
                  type="url"
                  placeholder={t("settings.muezzinUrl")}
                  value={settings.iqamaUrl}
                  onChange={(e) => update({ iqamaUrl: e.target.value })}
                />
                <span className="muted" style={{ fontSize: 12 }}>
                  {t("settings.iqamaUrlHint")}
                </span>
              </div>
            )}

            <div className="field-row">
              <label>{t("settings.iqamaShowInList")}</label>
              <input
                type="checkbox"
                checked={settings.iqamaShowInList}
                onChange={(e) => update({ iqamaShowInList: e.target.checked })}
              />
            </div>

            <div className="field">
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="primary" onClick={() => void testIqama()}>
                  ▶ {t("settings.testIqama")}
                </button>
                <button className="ghost" onClick={() => AudioService.stop()}>
                  ⏹ {t("settings.stopPreview")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* System */}
      <div className="section">
        <h3>{t("settings.systemSection")}</h3>
        <div className="field-row">
          <label>{t("settings.startOnBoot")}</label>
          <input
            type="checkbox"
            checked={settings.startOnBoot}
            onChange={(e) => toggleStartup(e.target.checked)}
          />
        </div>
        <div className="field">
          <label>{t("settings.theme")}</label>
          <div className="seg">
            {(["system", "light", "dark"] as const).map((th) => (
              <button
                key={th}
                className={settings.theme === th ? "active" : ""}
                onClick={() => update({ theme: th })}
              >
                {t(
                  th === "system"
                    ? "settings.themeSystem"
                    : th === "light"
                    ? "settings.themeLight"
                    : "settings.themeDark"
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="section">
        <h3>{t("settings.dataSection")}</h3>
        <button className="ghost" onClick={clearCache}>
          🗑 {t("settings.clearCache")}
        </button>
      </div>

      {/* About · Support · Updates */}
      <div className="section">
        <h3>{t("settings.aboutSection")}</h3>

        <div className="field-row">
          <label>{t("settings.version")}</label>
          <span className="muted">v{APP_VERSION}</span>
        </div>

        <div className="field">
          <button className="primary" onClick={() => void openExternal(DONATE_URL)}>
            ❤️ {t("settings.support")}
          </button>
          <span className="muted" style={{ fontSize: 12 }}>
            {t("settings.supportHint")}
          </span>
        </div>

        <div className="field">
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="ghost" onClick={() => void checkUpdates()} disabled={checking}>
              ⟳ {checking ? t("settings.checking") : t("settings.checkUpdates")}
            </button>
            {updateInfo?.status === "update" && updateInfo.url && (
              <button
                className="primary"
                onClick={() => void openExternal(updateInfo.url!)}
              >
                ⬇ {t("settings.downloadUpdate", { version: updateInfo.version })}
              </button>
            )}
          </div>
          {updateInfo?.status === "latest" && (
            <span className="muted">{t("settings.upToDate")}</span>
          )}
          {updateInfo?.status === "error" && (
            <span className="muted">{t("settings.updateError")}</span>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
