/** Ekrana özgü iki dilli sabit metinler. Vakit adları site sözlüğünden gelir (src/i18n/ui.ts → sayfa verisi). */
export const METIN = {
  ayet: { tr: 'Günün Ayeti', fr: 'Verset du jour' },
  hadis: { tr: 'Günün Hadisi', fr: 'Hadith du jour' },
  duyuru: { tr: 'Duyuru', fr: 'Annonce' },
  vaktine: { tr: 'vaktine', fr: 'dans' },
  vakitYok: { tr: 'Namaz vakitleri güncellenemedi', fr: 'Horaires de prière indisponibles' },
  saatYok: { tr: 'Saat doğrulanıyor', fr: 'Vérification de l’heure…' },
  hosgeldiniz: { tr: 'Hoş geldiniz', fr: 'Bienvenue' },
} as const;
