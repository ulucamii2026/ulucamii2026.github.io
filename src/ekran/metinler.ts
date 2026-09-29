/** Ekrana özgü iki dilli sabit metinler. Vakit adları site sözlüğünden gelir (src/i18n/ui.ts → sayfa verisi);
 *  sayfa verisi bozuksa aşağıdaki VAKIT_ADLARI kullanılır. */
export const METIN = {
  ayet: { tr: 'Günün Ayeti', fr: 'Verset du jour' },
  hadis: { tr: 'Günün Hadisi', fr: 'Hadith du jour' },
  dua: { tr: 'Günün Duası', fr: 'Invocation du jour' },
  esma: { tr: 'Esmâ-i Hüsnâ', fr: 'Les beaux noms d’Allah' }, // TR yazımı TDV İslâm Ansiklopedisi'ne göre
  duyuru: { tr: 'Duyuru', fr: 'Annonce' },
  vaktine: { tr: 'vaktine', fr: 'dans' },
  gunesUzun: { tr: 'Güneş', fr: 'Lever du soleil' }, // geri sayımda: satırdaki kısa «Lever» tek başına anlaşılmıyor
  vakitYok: { tr: 'Namaz vakitleri güncellenemedi', fr: 'Horaires de prière indisponibles' },
  saatYok: { tr: 'Saat doğrulanıyor', fr: 'Vérification de l’heure…' },
  yarin: { tr: 'Yarın', fr: 'Demain' }, // yatay blokta yarının imsakının etiketi (yatsıdan sonra sıradaki vakit)
  hosgeldiniz: { tr: 'Hoş geldiniz', fr: 'Bienvenue' },
} as const;

/** Sayfa verisi (#ekran-veri) eksik ya da bozuksa kullanılan vakit adları (src/ekran/main.ts → sayfaVerisiOku);
 *  yoksa geri sayım "undefined vaktine 30 dk" yazardı. Asıl kaynak site sözlüğüdür (src/i18n/ui.ts → namaz.*,
 *  cuma = namaz.cumaKisa, cumaUzun = namaz.cuma); sözlüğün tamamı pakete girmesin diye burada kopyası durur,
 *  tests/ekran-veri.test.mjs ikisinin aynı kaldığını denetler. */
export const VAKIT_ADLARI: Record<'tr' | 'fr', Record<string, string>> = {
  tr: { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı', cuma: 'Cuma', cumaUzun: 'Cuma namazı' },
  fr: { imsak: 'Fajr', gunes: 'Lever', ogle: 'Dhuhr', ikindi: 'Asr', aksam: 'Maghrib', yatsi: 'Isha', cuma: 'Vendredi', cumaUzun: 'Prière du vendredi' },
};
