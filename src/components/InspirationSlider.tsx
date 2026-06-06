import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { INSPIRATIONS, type InspirationKind } from "../data/inspirations";

const ROTATE_MS = 9000;

/**
 * InspirationSlider — an auto-rotating card of Qur'anic verses, hadiths and
 * du'as that encourage prayer. Pauses on hover; manual prev/next + dots.
 */
export function InspirationSlider() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const n = INSPIRATIONS.length;
  const [i, setI] = useState(() => Math.floor(Math.random() * n));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || n <= 1) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, n]);

  if (n === 0) return null;
  const item = INSPIRATIONS[i];
  const kindLabel: Record<InspirationKind, string> = {
    ayah: t("home.kindAyah"),
    hadith: t("home.kindHadith"),
    dua: t("home.kindDua"),
  };
  const go = (d: number) => setI((p) => (p + d + n) % n);

  return (
    <div
      className="inspire"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className={`inspire-badge ${item.kind}`}>{kindLabel[item.kind]}</span>

      <div className="inspire-body">
        <div className="inspire-text" dir="rtl" lang="ar">
          {item.ar}
        </div>
        {!isAr && <div className="inspire-en">{item.en}</div>}
        <div className="inspire-source">
          {isAr ? item.source : item.sourceEn}
        </div>
      </div>

      <div className="inspire-nav" dir="ltr">
        <button className="inspire-arrow" aria-label="previous" onClick={() => go(-1)}>
          ‹
        </button>
        <span className="inspire-count">
          {i + 1} / {n}
        </span>
        <button className="inspire-arrow" aria-label="next" onClick={() => go(1)}>
          ›
        </button>
      </div>
    </div>
  );
}
