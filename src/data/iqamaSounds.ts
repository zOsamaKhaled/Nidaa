/**
 * Iqama recordings shipped with the app.
 *
 * These are deliberately NOT the Adhan reciters: an Iqama is a short call
 * ("قد قامت الصلاة"), a few seconds long — never a full Adhan. Each file lives
 * in BOTH `public/audio/` (served in dev + packaged web assets) and
 * `src-tauri/audio/` (bundled resource), so they play with no internet.
 *
 * File names are kept ASCII on purpose — non-Latin names need URL encoding and
 * break silently in the webview.
 *
 * To add another: drop `<name>.mp3` into both folders, add an entry here, and
 * add an `iqamaSounds.<nameKey>` string to `src/i18n/locales/{en,ar}.json`.
 */
export interface IqamaSound {
  id: string;
  /** i18n key under `iqamaSounds.` */
  nameKey: string;
  /** File name under the bundled audio folder. */
  file: string;
}

export const IQAMA_SOUNDS: IqamaSound[] = [
  {
    id: "husary-short",
    nameKey: "husaryShort",
    file: "iqama-husary-short.mp3",
  },
  { id: "haram-short", nameKey: "haramShort", file: "iqama-haram-short.mp3" },
  { id: "husary-full", nameKey: "husaryFull", file: "iqama-husary-full.mp3" },
  { id: "saqqaf-full", nameKey: "saqqafFull", file: "iqama-saqqaf-full.mp3" },
];

/** Sound used when nothing has been chosen (a short one). */
export const DEFAULT_IQAMA_SOUND_ID = IQAMA_SOUNDS[0].id;

export function findIqamaSound(id: string): IqamaSound | undefined {
  return IQAMA_SOUNDS.find((s) => s.id === id);
}
