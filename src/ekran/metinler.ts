import type { TemaId } from '../lib/ekran/icerik.ts';

/** Ekrana özgü iki dilli sabit metinler. Vakit adları site sözlüğünden gelir (src/i18n/ui.ts → sayfa verisi);
 *  sayfa verisi bozuksa aşağıdaki VAKIT_ADLARI kullanılır. */
export const METIN = {
  // Her gün bütün ayet, hadis ve dualar sırayla gösterilir (secim.ts → maneviSirasi): başlıkta «Günün …» yok.
  ayet: { tr: 'Âyet-i Kerîme', fr: 'Verset du Coran' },
  hadis: { tr: 'Hadîs-i Şerîf', fr: 'Hadith' },
  dua: { tr: 'Dua', fr: 'Invocation' },
  // Tema kartında üst başlık temanın adıdır (TEMA_BASLIGI); bu ikisi yalnız tanınmayan temada yedektir.
  bilgi: { tr: 'Bilgi', fr: 'Le saviez-vous ?' },
  soz: { tr: 'Güzel Söz', fr: 'Belle parole' },
  duyuru: { tr: 'Duyuru', fr: 'Annonce' },
  vaktine: { tr: 'vaktine', fr: 'dans' },
  gunesUzun: { tr: 'Güneş', fr: 'Lever du soleil' }, // geri sayımda: satırdaki kısa «Lever» tek başına anlaşılmıyor
  vakitYok: { tr: 'Namaz vakitleri güncellenemedi', fr: 'Horaires de prière indisponibles' },
  saatYok: { tr: 'Saat doğrulanıyor', fr: 'Vérification de l’heure…' },
  yarin: { tr: 'Yarın', fr: 'Demain' }, // yatay blokta yarının imsakının etiketi (yatsıdan sonra sıradaki vakit)
  hosgeldiniz: { tr: 'Hoş geldiniz', fr: 'Bienvenue' },
} as const;

/** Tema kartının üst başlığı (19 Ekim 2026): çeşit başlığı (METIN) yerine kartın teması yazılır. En dar ekranda tek satıra
 *  sığması Playwright'ta denetlenir (tests/web/ekran.spec.mjs). */
export const TEMA_BASLIGI: Record<TemaId, { tr: string; fr: string }> = {
  emek: { tr: 'Emek ve Çalışma', fr: 'Travail et effort' },
  disiplin: { tr: 'Disiplin ve Sorumluluk', fr: 'Discipline et responsabilité' },
  terbiye: { tr: 'Terbiye ve Edep', fr: 'Éducation et bonnes manières' },
  ilim: { tr: 'İlim ve Öğrenme', fr: 'Savoir et apprentissage' },
  birlikte: { tr: 'Birlikte Yaşama', fr: 'Vivre ensemble' },
  sabir: { tr: 'Sabır ve Şükür', fr: 'Patience et gratitude' },
};

/** Sayfa verisi (#ekran-veri) eksik ya da bozuksa kullanılan vakit adları (src/ekran/main.ts → sayfaVerisiOku);
 *  yoksa geri sayım "undefined vaktine 30 dk" yazardı. Asıl kaynak site sözlüğüdür (src/i18n/ui.ts → namaz.*,
 *  cuma = namaz.cumaKisa, cumaUzun = namaz.cuma); sözlüğün tamamı pakete girmesin diye burada kopyası durur,
 *  tests/ekran-veri.test.mjs ikisinin aynı kaldığını denetler. */
export const VAKIT_ADLARI: Record<'tr' | 'fr', Record<string, string>> = {
  tr: { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı', cuma: 'Cuma', cumaUzun: 'Cuma namazı' },
  fr: { imsak: 'Fajr', gunes: 'Lever', ogle: 'Dhuhr', ikindi: 'Asr', aksam: 'Maghrib', yatsi: 'Isha', cuma: 'Vendredi', cumaUzun: 'Prière du vendredi' },
};
