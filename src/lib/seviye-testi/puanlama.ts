import type {
  AlanKodu, AlanSonucu, BasamakSonucu, BilgiAlani, Cevaplar, Madde, OkumaSonucu, Sonuc,
} from './tipler.ts';

export const BILGI_ESIGI = 0.6;
export const OKUMA_ESIGI = 0.66;
export const BILGI_ALANLARI: BilgiAlani[] = ['kuranBilgi', 'itikat', 'namaz', 'ibadet', 'siyer', 'ahlak'];
export type PuanGirdisi = { cevaplar: Cevaplar; atla?: Partial<Record<AlanKodu, boolean>> };

function basamaklariPuanla(
  maddeler: Madde[], girdi: PuanGirdisi, alan: AlanKodu, sayi: number, esik: number,
): BasamakSonucu[] {
  const puanli = maddeler.filter(m => m.alan === alan && !m.emekli && !('mezhepBagli' in m && m.mezhepBagli));
  return Array.from({ length: sayi }, (_, i) => {
    const basamak = i + 1;
    const grup = puanli.filter(m => m.basamak === basamak);
    const dogru = girdi.atla?.[alan] === true ? 0 : grup.filter(m => {
      const cevap = girdi.cevaplar[m.id];
      return Number.isInteger(cevap) && cevap >= 0 && cevap < m.siklar.length && cevap === m.dogru;
    }).length;
    return { basamak, dogru, toplam: grup.length, gecti: grup.length > 0 && dogru / grup.length >= esik };
  });
}

function kesintisizDuzey(basamaklar: BasamakSonucu[]): number {
  let duzey = 0;
  for (const sonuc of basamaklar) {
    if (!sonuc.gecti) break;
    duzey = sonuc.basamak;
  }
  return duzey;
}

/** Aynı banka ve cevaplar için aynı sonucu üretir; girdileri değiştirmez. */
export function puanla(maddeler: Madde[], girdi: PuanGirdisi): Sonuc {
  const alanlar: AlanSonucu[] = BILGI_ALANLARI.map(alan => {
    const basamaklar = basamaklariPuanla(maddeler, girdi, alan, 3, BILGI_ESIGI);
    const toplam = basamaklar.reduce((n, b) => n + b.toplam, 0);
    const dogru = basamaklar.reduce((n, b) => n + b.dogru, 0);
    return {
      alan, duzey: kesintisizDuzey(basamaklar) as AlanSonucu['duzey'],
      yuzde: toplam === 0 ? 0 : Math.round(100 * dogru / toplam),
      atlandi: girdi.atla?.[alan] === true, basamaklar,
    };
  });
  const basamaklar = basamaklariPuanla(maddeler, girdi, 'okuma', 5, OKUMA_ESIGI);
  const okuma: OkumaSonucu = {
    duzey: kesintisizDuzey(basamaklar) as OkumaSonucu['duzey'],
    atlandi: girdi.atla?.okuma === true,
    basamaklar,
    tecvid: alanlar.find(a => a.alan === 'kuranBilgi')!.basamaklar[2].gecti,
  };
  const namaz = alanlar.find(a => a.alan === 'namaz')!;
  const program = okuma.duzey <= 1 ? 'A' : okuma.duzey <= 3 ? 'B' : namaz.duzey < 2 ? 'C' : 'D';
  const mezhepNotlari = maddeler.flatMap(m => {
    const verilen = girdi.cevaplar[m.id];
    // Emeklilik puanı etkiler; cevaplanmış mezhep maddesinin bilgi notunu kaldırmaz.
    return 'mezhepBagli' in m && m.mezhepBagli && verilen !== undefined && verilen !== -1
      ? [{ id: m.id, verilen, dogru: m.dogru }] : [];
  });
  return { okuma, alanlar, program, mezhepNotlari };
}

export function girdiDogrula(
  maddeler: Madde[], cevaplar: unknown,
): { tamam: true } | { tamam: false; kod: string } {
  if (cevaplar === null || typeof cevaplar !== 'object' || Array.isArray(cevaplar)) {
    return { tamam: false, kod: 'cevaplar-gecersiz' };
  }
  const prototip = Object.getPrototypeOf(cevaplar);
  if (prototip !== Object.prototype && prototip !== null) {
    return { tamam: false, kod: 'cevaplar-gecersiz' };
  }
  const banka = new Map(maddeler.map(m => [m.id, m]));
  for (const id of Reflect.ownKeys(cevaplar)) {
    const madde = typeof id === 'string' ? banka.get(id) : undefined;
    if (!madde) return { tamam: false, kod: 'madde-bilinmiyor' };
    const cevap = (cevaplar as Record<PropertyKey, unknown>)[id];
    if (typeof cevap !== 'number' || !Number.isInteger(cevap) || cevap < -1 || cevap >= madde.siklar.length) {
      return { tamam: false, kod: 'cevap-gecersiz' };
    }
  }
  return { tamam: true };
}
