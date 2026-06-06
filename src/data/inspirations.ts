import { HADITHS } from "./hadiths";

/**
 * Inspirations shown in the Home slider to encourage prayer — a mix of Qur'anic
 * verses, hadiths, and du'as. Add more by appending; the slider shuffles/rotates.
 */
export type InspirationKind = "ayah" | "hadith" | "dua";

export interface Inspiration {
  ar: string;
  en: string;
  source: string;
  sourceEn: string;
  kind: InspirationKind;
}

const AYAT: Inspiration[] = [
  {
    ar: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
    en: "Indeed, prayer is upon the believers a decree of specified times.",
    source: "النساء: ١٠٣",
    sourceEn: "An-Nisā' 103",
    kind: "ayah",
  },
  {
    ar: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي",
    en: "And establish prayer for My remembrance.",
    source: "طه: ١٤",
    sourceEn: "Ṭā-Hā 14",
    kind: "ayah",
  },
  {
    ar: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ",
    en: "Guard strictly the prayers, especially the middle prayer, and stand before Allah devoutly obedient.",
    source: "البقرة: ٢٣٨",
    sourceEn: "Al-Baqarah 238",
    kind: "ayah",
  },
  {
    ar: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ ۝ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ",
    en: "Successful indeed are the believers — those who humble themselves in their prayer.",
    source: "المؤمنون: ١-٢",
    sourceEn: "Al-Mu'minūn 1–2",
    kind: "ayah",
  },
  {
    ar: "وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا",
    en: "And enjoin prayer upon your family and be steadfast therein.",
    source: "طه: ١٣٢",
    sourceEn: "Ṭā-Hā 132",
    kind: "ayah",
  },
];

const DUAS: Inspiration[] = [
  {
    ar: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
    en: "My Lord, make me an establisher of prayer, and from my descendants. Our Lord, and accept my supplication.",
    source: "إبراهيم: ٤٠",
    sourceEn: "Ibrāhīm 40",
    kind: "dua",
  },
  {
    ar: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    en: "O Allah, help me to remember You, to thank You, and to worship You well.",
    source: "رواه أبو داود",
    sourceEn: "Reported by Abū Dāwūd",
    kind: "dua",
  },
];

const HADITH_ITEMS: Inspiration[] = HADITHS.map((h) => ({
  ar: h.ar,
  en: h.en,
  source: h.source,
  sourceEn: h.sourceEn,
  kind: "hadith" as const,
}));

/** Combined, interleaved list (ayah, hadith, dua, …) for variety. */
export const INSPIRATIONS: Inspiration[] = (() => {
  const out: Inspiration[] = [];
  const max = Math.max(AYAT.length, HADITH_ITEMS.length, DUAS.length);
  for (let i = 0; i < max; i++) {
    if (AYAT[i]) out.push(AYAT[i]);
    if (HADITH_ITEMS[i]) out.push(HADITH_ITEMS[i]);
    if (DUAS[i]) out.push(DUAS[i]);
  }
  return out;
})();
