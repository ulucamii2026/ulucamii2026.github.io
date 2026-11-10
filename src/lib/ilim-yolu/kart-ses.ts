/**
 * İlim Yolu bilgi kartı seslendirmesi (10 Kasım 2026). Saf: manifest (src/data/ilim-yolu/kart-ses.json) hangi kartın hangi dilde sesi olduğunu söyler;
 * dosyalar ana sitede `<taban>/<dil>/<kart-kimliği>.mp3` adresinden çalar (okuma sesleriyle aynı kural: ulucamii.be, egitim CSP `media-src` izinli).
 * Yalnız tr ve fr seslendirilir. Manifest boşsa hiçbir sayfada «Dinleyin» görünmez. Manifesti `scripts/kart-ses-al.mjs` üretir (sha256 ile).
 */
/** Varsayılan taban (manifestteki `taban` bununla aynı olmalı; test denetler). */
export const KART_SES_TABANI = '/media/ses/kart';
export const KART_SES_DILLERI = ['tr', 'fr'] as const;
export type KartSesDili = (typeof KART_SES_DILLERI)[number];

export interface KartSesKaydi { readonly bayt: number; readonly sn: number | null; readonly sha256: string }
export interface KartSesManifesti {
  readonly v: 1;
  /** Ses adresinin site köküne göre öneki; tek yerden ayarlanır. */
  readonly taban: string;
  readonly kartlar: Readonly<Record<string, Readonly<Partial<Record<KartSesDili, KartSesKaydi>>>>>;
}

const sesDiliMi = (dil: string): dil is KartSesDili => (KART_SES_DILLERI as readonly string[]).includes(dil);

/** Kartın bu dilde sesi varsa `<kök><taban>/<dil>/<id>.mp3`, yoksa `null` (kök: sayfanın ses sitesi, ör. https://ulucamii.be). */
export function kartSesAdresi(m: KartSesManifesti, dil: string, id: string, kok = ''): string | null {
  if (!sesDiliMi(dil) || !/^[a-z0-9-]+$/.test(id)) return null;
  return m.kartlar[id]?.[dil] ? `${kok}${m.taban}/${dil}/${id}.mp3` : null;
}
