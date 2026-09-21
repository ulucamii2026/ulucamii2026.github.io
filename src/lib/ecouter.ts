/**
 * Dinleme sayfaları (/e/<kod>/) — tür sözleşmesi ve Fransızca arayüz metinleri.
 *
 * Basılı Fransızca ders kitabındaki (D:\ulu-camii-yetiskin-egitimi) kare kodlar
 * `https://ulucamii.be/e/<kod>/` adresine gider. Kitabı okuyan yetişkin telefonunu
 * kitabın üstüne tutar, açılan sayfa YALNIZ dinlemeye yarar: büyük çal düğmesi,
 * satır satır ses, hız, tekrar. Sayfa Fransızcadır, arama motoruna kapalıdır
 * (noindex + site haritası dışı) ve menüde yer almaz.
 *
 * Veri `src/data/ecouter.json` dosyasından gelir; kişisel veri İÇERMEZ.
 * Sözleşme ve üretim: docs/DINLEME-SAYFALARI.md.
 *
 * Bu dosya bilerek JSON içe aktarmaz: Playwright sınamaları metinleri buradan okur.
 */

/** Tek çalınabilir parça: sûrenin bir âyeti ya da Elifbâ tahtasının bir hecesi.
    `ar`, `okunus`, `fr` ve `ses` alanlarının hepsi isteğe bağlıdır — sesi olmayan
    satırda çal düğmesi hiç basılmaz. */
export type EcouterParca = {
  /** Âyet/satır numarası (sûre sayfalarında). Yoksa numara gösterilmez. */
  no?: number;
  /** Arapça metin (Kur'an işaretleriyle; alt küme yazı tipi KULLANILMAZ). */
  ar?: string;
  /** Fransızca okura göre çeviri yazı (motor/YAZIM-KILAVUZU.md §4 şeması). */
  okunus?: string;
  /** Fransızca anlamı. */
  fr?: string;
  /** Yerel ses dosyası (`/media/ses/...`). Yalnız resmî Diyanet kayıtları. */
  ses?: string;
};

/** Sayfanın büyük «tamamını dinle» düğmesi. */
export type EcouterTam = { ses: string; etiket?: string };

export type EcouterKod = {
  baslik: string;
  altbaslik?: string;
  /** Altbilgide yazılan ses/metin kaynağı künyesi. */
  kaynak?: string;
  tam?: EcouterTam;
  /** Satır satır liste (sûre, dua). */
  satirlar?: EcouterParca[];
  /** Dokunmatik kare ızgarası (Elifbâ heceleri). */
  ogeler?: EcouterParca[];
  /** Dolu ise sayfa yalnız bu adrese yönlendirir. */
  yonlendir?: string;
};

export type EcouterVeri = { surum: number; kodlar: Record<string, EcouterKod> };

/** Tercihlerin (hız, tekrar) saklandığı localStorage anahtarı. */
export const EC_ANAHTAR = 'ulucamii:ecouter:v1';

/** Tekrar kipinde aynı parça kaç kez çalınır («écouter, puis répéter»). */
export const EC_TEKRAR_SAYISI = 3;

/** Sayfanın bütün görünen metni — sayfa Fransızca olduğu için tek dil.
    Fransız tipografisi: « … » içinde ve ; : ! ? önünde dar bölünmez boşluk (U+202F). */
export const EC_METIN = {
  etiket: 'Écouter',
  kurum: 'Mosquée Ulu Camii · Marche-en-Famenne',
  tamEtiket: 'Écouter en entier',
  sureSifir: '0:00',
  sureBos: '–:––',
  kontroller: 'Réglages d’écoute',
  hizBaslik: 'Vitesse',
  hizYavas: '0,75×',
  hizNormal: '1×',
  hizYavasAd: 'Vitesse lente, 0,75 fois',
  hizNormalAd: 'Vitesse normale, 1 fois',
  tekrar: 'Répéter',
  tekrarIpucu: '« Répéter » joue chaque passage 3 fois, avec une pause de la même durée : écoutez, puis répétez à voix haute.',
  zincir: 'Lecture continue',
  zincirIpucu: 'Les passages s’enchaînent l’un après l’autre.',
  /** Satır çal düğmesinin gizli adı; {no} satır numarasıyla değişir. */
  satirCal: 'Écouter le passage {no}',
  /** Ögenin (hece) çal düğmesi ekran okuyucuya böyle okunur; {ad} çeviri yazıdır. */
  ogeCal: 'Écouter {ad}',
  hata: 'Le son n’a pas pu être lu. Vérifiez votre connexion, puis réessayez.',
  noscript: 'Le lecteur a besoin de JavaScript. Les enregistrements restent accessibles ci-dessous.',
  noscriptListe: 'Enregistrements',
  yonlendirMetin: 'Cette page vous redirige vers le test de niveau.',
  yonlendirDugme: 'Continuer',
} as const;

/** «Écouter le passage 3» gibi metinleri üretir. */
export const ecMetinDoldur = (kalip: string, degerler: Record<string, string | number>): string =>
  kalip.replace(/\{(\w+)\}/g, (_, anahtar: string) => String(degerler[anahtar] ?? ''));

/** Bir parçanın çal düğmesine yazılacak gizli ad. `sira` 1'den başlar. */
export function ecParcaAdi(parca: EcouterParca, sira: number, kare: boolean): string {
  if (kare && parca.okunus) return ecMetinDoldur(EC_METIN.ogeCal, { ad: parca.okunus });
  return ecMetinDoldur(EC_METIN.satirCal, { no: parca.no ?? sira });
}
