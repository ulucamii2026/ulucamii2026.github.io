/**
 * Mektep Odası Günün Hadis-i Şerifi ve Ahlâk İlkeleri.
 * Çocuklar için seçilmiş Nebevî tavsiyeler (TR / FR / EN).
 */
import type { Dil } from '../i18n/ui';

export type HadisOgesi = {
  id: string;
  arapca: string;
  metin: Record<Dil, string>;
  kaynak: string;
  konu: Record<Dil, string>;
  ikon: string;
};

export const AHLAK_HADISLERI: HadisOgesi[] = [
  {
    id: 'tebessum',
    arapca: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    metin: {
      tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.',
      fr: 'Sourire à ton frère est pour toi une aumône.',
      en: 'Smiling at your brother is an act of charity for you.',
    },
    kaynak: 'Tirmizî, Birr, 36',
    konu: {
      tr: 'Sevgi & Tebessüm',
      fr: 'Amour & Sourire',
      en: 'Love & Smile',
    },
    ikon: '😊',
  },
  {
    id: 'kuran-ogrenen',
    arapca: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    metin: {
      tr: 'Sizin en hayırlınız, Kur’ân’ı öğrenen ve öğretendir.',
      fr: 'Le meilleur d’entre vous est celui qui apprend le Coran et l’enseigne.',
      en: 'The best among you are those who learn the Quran and teach it.',
    },
    kaynak: 'Buhârî, Fedâilü’l-Kur’ân, 21',
    konu: {
      tr: 'Kur’ân Sevgisi',
      fr: 'Amour du Coran',
      en: 'Love of the Quran',
    },
    ikon: '📖',
  },
  {
    id: 'temizlik',
    arapca: 'الطُّهُورُ شَطْرُ الإِيمَانِ',
    metin: {
      tr: 'Temizlik imanın yarısıdır.',
      fr: 'La propreté est la moitié de la foi.',
      en: 'Cleanliness is half of faith.',
    },
    kaynak: 'Müslim, Tahâret, 1',
    konu: {
      tr: 'Temizlik & Arınma',
      fr: 'Pureté & Propreté',
      en: 'Cleanliness & Purity',
    },
    ikon: '💧',
  },
  {
    id: 'sevgi-merhamet',
    arapca: 'لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا وَيُوَقِّرْ كَبِيرَنَا',
    metin: {
      tr: 'Küçüklerimize merhamet etmeyen, büyüklerimize saygı göstermeyen bizden değildir.',
      fr: 'N’est pas des nôtres celui qui n’est pas miséricordieux envers nos petits et ne respecte pas nos aînés.',
      en: 'He is not of us who is not merciful to our young and does not respect our elders.',
    },
    kaynak: 'Ebû Dâvûd, Edeb, 58',
    konu: {
      tr: 'Saygı & Merhamet',
      fr: 'Respect & Compassion',
      en: 'Respect & Mercy',
    },
    ikon: '🤝',
  },
  {
    id: 'dogruluk',
    arapca: 'إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    metin: {
      tr: 'Doğruluk iyiliğe götürür, iyilik de cennete iletir.',
      fr: 'La sincérité mène à la piété, et la piété mène au Paradis.',
      en: 'Truthfulness leads to righteousness, and righteousness leads to Paradise.',
    },
    kaynak: 'Buhârî, Edeb, 69',
    konu: {
      tr: 'Doğruluk & Dürüstlük',
      fr: 'Vérité & Sincérité',
      en: 'Truth & Honesty',
    },
    ikon: '✨',
  },
  {
    id: 'hediye',
    arapca: 'تَهَادَوْا تَحَابُّوا',
    metin: {
      tr: 'Birbirinize hediye verin ki aranızdaki sevgi artsın.',
      fr: 'Échangez des cadeaux, vous augmenterez votre amour mutuel.',
      en: 'Exchange gifts, for you will increase your mutual love.',
    },
    kaynak: 'Buhârî, el-Edebü’l-Müfred, 594',
    konu: {
      tr: 'Cömertlik & Paylaşma',
      fr: 'Générosité & Partage',
      en: 'Generosity & Sharing',
    },
    ikon: '🎁',
  },
  {
    id: 'tesekkur',
    arapca: 'مَنْ لَا يَشْكُرُ النَّاسَ لَا يَشْكُرُ اللَّهَ',
    metin: {
      tr: 'İnsanlara teşekkür etmeyen, Allah’a da şükretmez.',
      fr: 'Celui qui ne remercie pas les gens ne remercie pas Allah.',
      en: 'Whoever does not thank people does not thank Allah.',
    },
    kaynak: 'Tirmizî, Birr, 35',
    konu: {
      tr: 'Şükür & Minnet',
      fr: 'Reconnaissance & Gratitude',
      en: 'Gratitude & Thanks',
    },
    ikon: '🙏',
  },
  {
    id: 'guzel-soz',
    arapca: 'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ',
    metin: {
      tr: 'Güzel söz söylemek bir sadakadır.',
      fr: 'Une bonne parole est une aumône.',
      en: 'A good word is an act of charity.',
    },
    kaynak: 'Buhârî, Cihâd, 128',
    konu: {
      tr: 'Tatlı Dil & Nezaket',
      fr: 'Parole Douce & Politesse',
      en: 'Kind Words & Politeness',
    },
    ikon: '🌸',
  },
  {
    id: 'komsu-hakki',
    arapca: 'مَا آمَنَ بِي مَنْ بَاتَ شَبْعَانًا وَجَارُهُ جَائِعٌ',
    metin: {
      tr: 'Komşusu açken tok yatan kimse (kâmil) mümin değildir.',
      fr: 'N’est pas croyant celui qui s’endort rassasié alors que son voisin a faim.',
      en: 'He is not a true believer who sleeps full while his neighbor is hungry.',
    },
    kaynak: 'Hâkim, el-Müstedrek, II, 15',
    konu: {
      tr: 'Yardımlaşma & Komşuluk',
      fr: 'Entraide & Bon Voisinage',
      en: 'Helping & Neighborliness',
    },
    ikon: '🏡',
  },
  {
    id: 'kolaylastirin',
    arapca: 'يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا',
    metin: {
      tr: 'Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.',
      fr: 'Facilitez et ne rendez pas difficile ; annoncez de bonnes nouvelles et ne faites pas fuir.',
      en: 'Facilitate things and do not make them difficult; give glad tidings and do not repel.',
    },
    kaynak: 'Buhârî, İlim, 11',
    konu: {
      tr: 'Müjde & Kolaylık',
      fr: 'Facilité & Bonne Nouvelle',
      en: 'Ease & Glad Tidings',
    },
    ikon: '🕊️',
  },
];

/**
 * Günün tarihine göre deterministik (herkes için o gün aynı) hadis seçer.
 */
export function gununHadisiGetir(tarih: Date | string = new Date()): HadisOgesi {
  const d = typeof tarih === 'string' ? new Date(tarih.slice(0, 10) + 'T12:00:00Z') : tarih;
  const gunSayisi = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
  const index = Math.abs(gunSayisi) % AHLAK_HADISLERI.length;
  return AHLAK_HADISLERI[index];
}
