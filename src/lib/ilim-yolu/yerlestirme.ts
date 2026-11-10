/**
 * İlim Yolu yerleştirme testi (Dilim 2, 10 Kasım 2026): seviye testi soru bankasının (src/lib/seviye-testi) küçük bir alt kümesi ve onun
 * puanlaması (`puanla`) tarayıcıda çalışır; hiçbir şey gönderilmez ve kaydedilmez, test yalnız bir yol ÖNERİR. Uyarlamalıdır: bir
 * alanın üst basamağı, alt basamağı geçilmeden sorulmaz (kısa kalır). Ölçüt seviye testiyle aynıdır (basamak geçişi için o basamaktaki
 * soruların en az %60'ı, okumada %66'sı; iki soruda ikisi de doğru olmalı).
 */
import { puanla } from '../seviye-testi/puanlama';
import type { AlanKodu, Cevaplar, Madde } from '../seviye-testi/tipler';
import { ALANLAR } from './yollar';

/** Alan başına basamak başına sorulan soru sayısı. */
export const BASAMAK_SORUSU = 2;
/** Yerleştirmede sorulan basamaklar: okumada K1–K3, bilgi alanlarında B1–B2. */
export const ENCOK_BASAMAK = (alan: AlanKodu): number => (alan === 'okuma' ? 3 : 2);

/** Alt küme: sesli (dinle → seç), emekli ve mezhebe bağlı maddeler dışında, alan ve basamak başına ilk iki soru (banka sırasıyla). */
export function yerlestirmeSorulari(maddeler: readonly Madde[]): Madde[] {
  const cikti: Madde[] = [];
  for (const alan of ALANLAR) {
    for (let b = 1; b <= ENCOK_BASAMAK(alan); b++) {
      const grup = maddeler.filter((m) => m.alan === alan && m.basamak === b && !m.emekli && !('mezhepBagli' in m && m.mezhepBagli) && !('ses' in m && m.ses));
      cikti.push(...grup.slice(0, BASAMAK_SORUSU));
    }
  }
  return cikti;
}

const gecti = (sorular: readonly Madde[], cevaplar: Cevaplar, alan: AlanKodu, basamak: number): boolean => {
  const grup = sorular.filter((m) => m.alan === alan && m.basamak === basamak);
  if (grup.length === 0) return false;
  const dogru = grup.filter((m) => cevaplar[m.id] === m.dogru).length;
  return dogru / grup.length >= (alan === 'okuma' ? 0.66 : 0.6);
};

/** Sıradaki soru: cevaplanmamış ilk soru; alt basamak geçilmediyse üst basamağın sorusu atlanır. Bitince `null`. */
export function siradaki(sorular: readonly Madde[], cevaplar: Cevaplar): Madde | null {
  for (const m of sorular) {
    if (m.id in cevaplar) continue;
    let acik = true;
    for (let b = 1; b < m.basamak; b++) {
      const altGrup = sorular.filter((x) => x.alan === m.alan && x.basamak === b);
      if (altGrup.some((x) => !(x.id in cevaplar)) || !gecti(sorular, cevaplar, m.alan, b)) acik = false;
    }
    if (acik) return m;
  }
  return null;
}

export interface AlanOnerisi {
  readonly alan: AlanKodu;
  /** Kesintisiz geçilen basamak sayısı (okuma 0–3, diğerleri 0–2). */
  readonly duzey: number;
  /** Başlanması önerilen basamak (1–3; kartların `basamak` değeri). */
  readonly basamak: 1 | 2 | 3;
  readonly yuzde: number;
}
export interface YerlestirmeSonucu { readonly alanlar: AlanOnerisi[]; readonly onerilen: AlanOnerisi }

/** Cevaplardan her alan için düzey ve başlangıç basamağı; en zayıf alan (göreli düzey, sonra yüzde, sonra alan sırası) önerilir. */
export function oner(sorular: readonly Madde[], cevaplar: Cevaplar): YerlestirmeSonucu {
  const s = puanla([...sorular], { cevaplar });
  const alanlar: AlanOnerisi[] = ALANLAR.map((alan) => {
    const en = ENCOK_BASAMAK(alan);
    const basamaklar = alan === 'okuma' ? s.okuma.basamaklar : s.alanlar.find((x) => x.alan === alan)!.basamaklar;
    const duzey = Math.min(en, alan === 'okuma' ? s.okuma.duzey : s.alanlar.find((x) => x.alan === alan)!.duzey);
    const ilk = basamaklar.slice(0, en);
    const toplam = ilk.reduce((n, b) => n + b.toplam, 0);
    const dogru = ilk.reduce((n, b) => n + b.dogru, 0);
    return { alan, duzey, basamak: Math.min(3, duzey + 1) as 1 | 2 | 3, yuzde: toplam ? Math.round((100 * dogru) / toplam) : 0 };
  });
  const goreli = (a: AlanOnerisi) => a.duzey / ENCOK_BASAMAK(a.alan);
  const sirali = [...alanlar].sort((x, y) => goreli(x) - goreli(y) || x.yuzde - y.yuzde);
  return { alanlar, onerilen: sirali[0] };
}
