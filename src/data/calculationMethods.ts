import type { CalculationMethod } from "../types";

/**
 * Aladhan API calculation method ids.
 * `key` maps into the i18n `methods` namespace.
 * Full list: https://aladhan.com/calculation-methods
 */
export const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 4, key: "ummAlQura" }, // Umm Al-Qura, Makkah
  { id: 3, key: "mwl" }, // Muslim World League
  { id: 5, key: "egypt" }, // Egyptian General Authority of Survey
  { id: 2, key: "isna" }, // Islamic Society of North America
  { id: 1, key: "karachi" }, // University of Islamic Sciences, Karachi
  { id: 0, key: "jafari" }, // Shia Ithna-Ashari (Jafari)
  { id: 7, key: "tehran" }, // Institute of Geophysics, University of Tehran
  { id: 8, key: "gulf" }, // Gulf Region
  { id: 9, key: "kuwait" }, // Kuwait
  { id: 10, key: "qatar" }, // Qatar
  { id: 11, key: "singapore" }, // Majlis Ugama Islam Singapura
  { id: 12, key: "france" }, // Union des Organisations Islamiques de France
  { id: 13, key: "turkey" }, // Diyanet İşleri Başkanlığı, Turkey
  { id: 14, key: "russia" }, // Spiritual Administration of Muslims of Russia
  { id: 15, key: "moonsighting" }, // Moonsighting Committee Worldwide
  { id: 16, key: "dubai" }, // Dubai (unofficial)
];

export const DEFAULT_METHOD_ID = 4;
