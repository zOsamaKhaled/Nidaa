/**
 * Hadiths shown in prayer reminders to encourage prayer. Each carries the
 * Prophet ﷺ saying (Arabic), a source attribution, and an English translation
 * used when the UI language is English.
 *
 * Add more by appending to the array — `randomHadith()` shuffles automatically.
 */
export interface Hadith {
  /** Arabic text of the hadith (the saying). */
  ar: string;
  /** English translation. */
  en: string;
  /** Source attribution, e.g. "رواه مسلم". */
  source: string;
  sourceEn: string;
}

export const HADITHS: Hadith[] = [
  {
    ar: "الصَّلَاةُ الخَمْسُ، وَالْجُمْعَةُ إلى الجُمْعَةِ، كَفَّارَةٌ لِما بيْنَهُنَّ، ما لَمْ تُغْشَ الكَبَائِرُ.",
    en: "The five daily prayers, and Friday to Friday, are an expiation for whatever sins are committed between them, so long as major sins are avoided.",
    source: "رواه مسلم",
    sourceEn: "Reported by Muslim",
  },
  {
    ar: "أَرَأَيْتُمْ لو أنَّ نَهْرًا ببَابِ أَحَدِكُمْ يَغْتَسِلُ منه كُلَّ يَومٍ خَمْسَ مَرَّاتٍ، هلْ يَبْقَى مِن دَرَنِهِ شيءٌ؟ قالوا: لا يَبْقَى مِن دَرَنِهِ شيءٌ، قالَ: فَذلكَ مَثَلُ الصَّلَوَاتِ الخَمْسِ، يَمْحُو اللَّهُ بهِنَّ الخَطَايَا.",
    en: "If there were a river at the door of any of you in which he bathed five times a day, would any dirt remain on him? They said: No. He said: That is the parable of the five daily prayers — by them Allah wipes away sins.",
    source: "متفق عليه",
    sourceEn: "Agreed upon (Bukhari & Muslim)",
  },
  {
    ar: "ما مِن مُسْلِمٍ يَتَطَهَّرُ، فيُتِمُّ الطُّهُورَ الذي كَتَبَ اللَّهُ عليه، فيُصَلِّي هذِه الصَّلَواتِ الخَمْسَ، إلَّا كانَتْ كَفّاراتٍ لِما بيْنَها.",
    en: "There is no Muslim who purifies himself, completing the purification Allah has prescribed, then prays these five prayers, except that they are an expiation for what is between them.",
    source: "رواه مسلم",
    sourceEn: "Reported by Muslim",
  },
  {
    ar: "مَن تَوَضَّأَ لِلصَّلَاةِ فأسْبَغَ الوُضُوءَ، ثُمَّ مَشَى إلى الصَّلَاةِ المَكْتُوبَةِ، فَصَلَّاهَا مع النَّاسِ، أَوْ مع الجَمَاعَةِ، أَوْ في المَسْجِدِ، غَفَرَ اللَّهُ له ذُنُوبَهُ.",
    en: "Whoever performs ablution well for prayer, then walks to the obligatory prayer and prays it with the people, or in congregation, or in the mosque — Allah will forgive him his sins.",
    source: "رواه مسلم",
    sourceEn: "Reported by Muslim",
  },
  {
    ar: "ما مِنَ امْرِئٍ مُسْلِمٍ تَحْضُرُهُ صَلاةٌ مَكْتُوبَةٌ فيُحْسِنُ وُضُوءَها وخُشُوعَها ورُكُوعَها، إلَّا كانَتْ كَفَّارَةً لِما قَبْلَها مِنَ الذُّنُوبِ ما لَمْ يُؤْتِ كَبِيرَةً، وذلكَ الدَّهْرَ كُلَّهُ.",
    en: "There is no Muslim who, when an obligatory prayer comes, performs its ablution, humility and bowing well, except that it is an expiation for the sins before it, as long as no major sin is committed — and that is for all time.",
    source: "رواه مسلم",
    sourceEn: "Reported by Muslim",
  },
  {
    ar: "لا يَتَوَضَّأُ رَجُلٌ مُسْلِمٌ فيُحْسِنُ الوُضُوءَ فيُصَلِّي صَلاةً، إلَّا غَفَرَ اللَّهُ له ما بيْنَهُ وبيْنَ الصَّلاةِ الَّتي تَلِيها.",
    en: "No Muslim man performs ablution well and then prays a prayer, except that Allah forgives him for what is between it and the next prayer.",
    source: "رواه مسلم",
    sourceEn: "Reported by Muslim",
  },
];

/** A random hadith (uniformly chosen). */
export function randomHadith(): Hadith {
  return HADITHS[Math.floor(Math.random() * HADITHS.length)];
}
