/**
 * «Abdest ve Namaz» sayfalarının sunucu tarafı model kurucuları (10 Kasım 2026): veri + arayüz metni → çizilecek kart/satır modelleri.
 * Dinî ifadeler veri dosyasından olduğu gibi gelir; burada yalnız seçilir ve etiketlenir.
 */
import type { Dil } from '@ortak/i18n/ui';
import { ezberBul } from '@ortak/lib/ezber/katalog';
import { ABDEST, NAMAZ, adimKaynaklari, type Adim, type Birimi, type KonuVerisi, KISMI_ETIKET } from '@ortak/lib/ibadet/ibadet-veri';
import { adimAdi, cizimAdi, ibadetMetinleri } from '../i18n/ibadet';

export interface DuaBaglantisi { readonly id: string; readonly ad: string; readonly href: string }
export interface AdimKarti {
  readonly id: string;
  readonly no: number;
  readonly ad: string;
  readonly ikon: string;
  readonly alt: string;
  readonly tur: Adim['tur'];
  readonly hukum: string;
  readonly metin: string;
  readonly kadin?: string;
  readonly not?: string;
  /** Etiket asıl fiile aitse o fiilin adı (arayüz bunu açıkça yazar). */
  readonly kismiFiil?: string;
  readonly dualar: readonly DuaBaglantisi[];
  readonly kaynak: string;
}

export const konuVerisi = (konu: 'abdest' | 'namaz'): KonuVerisi => (konu === 'abdest' ? ABDEST : NAMAZ);

export function altMetni(dil: Dil, ikon: string): string {
  return ibadetMetinleri(dil).cizimAlt.replace('{ad}', cizimAdi(dil, ikon));
}

/** Var olan dua içeriğine bağlantı; katalogda olmayan dua kimliği sessizce atlanır (yokluğu tests/ibadet-veri.test.mjs yakalar). */
export function duaBaglantilari(dil: Dil, adim: Adim): DuaBaglantisi[] {
  const idler = [adim.dua, ...(adim.duaEk ?? [])].filter((x): x is string => Boolean(x));
  return idler.flatMap((id) => {
    const oge = ezberBul(id);
    return oge ? [{ id, ad: oge.ad[dil], href: `/${dil}/calis/${id}/` }] : [];
  });
}

export function hukumAdi(konu: KonuVerisi, tur: string, dil: Dil): string {
  return konu.terimler[tur]?.[dil] ?? tur;
}

export function adimKarti(dil: Dil, konu: KonuVerisi, adim: Adim): AdimKarti {
  const m = ibadetMetinleri(dil);
  const k = konu.kaynak[0];
  const fiil = KISMI_ETIKET[adim.id];
  return {
    id: adim.id,
    no: adim.sira,
    ad: adimAdi(dil, adim.id, adim.ikon),
    ikon: adim.ikon,
    alt: altMetni(dil, adim.ikon),
    tur: adim.tur,
    hukum: hukumAdi(konu, adim.tur, dil),
    metin: adim.metin[dil],
    kadin: adim.kadin?.[dil],
    not: adim.not?.[dil],
    kismiFiil: fiil ? m.fiil[fiil] : undefined,
    dualar: duaBaglantilari(dil, adim),
    kaynak: `${k.eser}, ${adimKaynaklari(adim).join(', ')}`,
  };
}

export const adimKartlari = (dil: Dil, konu: KonuVerisi, idler?: readonly string[]): AdimKarti[] =>
  (idler ? idler.map((id) => konu.adimlar.find((a) => a.id === id)!) : [...konu.adimlar]).map((a) => adimKarti(dil, konu, a));

export const kaynakSatiri = (dil: Dil, konu: KonuVerisi): string => {
  const k = konu.kaynak[0];
  return `${ibadetMetinleri(dil).kaynak}: ${k.eser}, ${dil === 'tr' ? 'cilt' : dil === 'fr' ? 'tome' : dil === 'de' ? 'Band' : dil === 'nl' ? 'deel' : 'vol.'} ${k.cilt}, ${k.sayfa}`;
};

/** Bir vakit birimi için okunur ad: «4 rek‘at · Farzdan önce». */
export function birimAdi(dil: Dil, b: Birimi): string {
  const m = ibadetMetinleri(dil);
  return `${m.rekat.replace('{n}', String(b.rekat))} · ${m.birimler[b.tip]}`;
}
