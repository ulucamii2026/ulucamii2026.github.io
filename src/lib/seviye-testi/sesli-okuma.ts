/** Seviye testi — soruların SESLİ OKUNACAK metni (okumakta zorlananlar için; 21 Eyl 2026).
 *
 *  Tek kaynak yine bankadır: klip metni buradan üretilir, kimliği metnin özetidir; soru metni
 *  değişirse kimlik de değişir ve `npm run seviye:ses -- --denetle` eksik klibi bildirir.
 *
 *  KURAL: Kur'an ve Elifbâ sesleri yalnız resmî Diyanet kaynağından gelir. Bu yüzden üretilmiş ses
 *  Arapça harf, hece, kelime ya da âyet OKUMAZ: okuma bölümünde yalnız soru kökü seslendirilir
 *  (şıklar harf adı / okunuştur), Arap harfli hiçbir metin klibe girmez. */
import type { BeyanMaddesi, EzberMaddesi, Madde } from './tipler.ts';

/** Site dilleriyle aynı beşli (bkz. tipler.ts → Dil). Klibi olmayan dilde düğme hiç basılmaz:
 *  manifest (`src/data/seviye-sesler.json`) yalnız diskteki klipleri listeler, eksik dil sessizce atlanır. */
export type OkumaDili = 'tr' | 'fr' | 'en' | 'nl' | 'de';

const KALIP: Record<OkumaDili, { siklar: string; sira: string[]; yaDa: string; ayrac: string }> = {
  tr: { siklar: 'Şıklar.', sira: ['Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı'], yaDa: 'Ya da', ayrac: ': ' },
  fr: { siklar: 'Réponses possibles.', sira: ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six'], yaDa: 'Ou bien', ayrac: ' : ' },
  en: { siklar: 'Options.', sira: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'], yaDa: 'Or', ayrac: ': ' },
  nl: { siklar: 'Antwoordmogelijkheden.', sira: ['Eén', 'Twee', 'Drie', 'Vier', 'Vijf', 'Zes'], yaDa: 'Of', ayrac: ': ' },
  de: { siklar: 'Antwortmöglichkeiten.', sira: ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs'], yaDa: 'Oder', ayrac: ': ' },
};

const ARAPCA = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const nokta = (s: string) => (/[.!?…»”"]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Yazı dilindeki kısaltmalar konuşma diline çevrilir (yalnız SESTE; ekrandaki metin değişmez).
 *  Dil başına tek kural: yeni dil eklenince TypeScript eksik anahtarı bildirir; kuralı olmayan dil
 *  metni olduğu gibi bırakır (nl ve de metinleri kısaltmasız ve cinsiyet ekisiz yazılır). */
const KONUSMA: Record<OkumaDili, (metin: string) => string> = {
  tr: (metin) => metin
    .replace(/\bHz\.\s*/g, 'Hazreti ')
    .replace(/\s*\(s\.a\.s\.\)/g, ' sallallâhu aleyhi ve sellem')
    .replace(/\s*\(a\.s\.\)/g, ' aleyhisselâm')
    .replace(/\s*\(r\.a\.\)/g, ' radıyallâhu anh'),
  // «musulman(e)», «né(e)»: yazıdaki cinsiyet eki seste okunmaz.
  fr: (metin) => metin.replace(/\((?:e|ne|s|es)\)/g, ''),
  en: (metin) => metin,
  nl: (metin) => metin,
  de: (metin) => metin,
};

const konusmaDili = (metin: string, dil: OkumaDili): string => KONUSMA[dil](metin);

/** Arap harfi içeren metin seslendirilmez (boş döner → klip üretilmez, düğme çıkmaz). */
const guvenli = (metin: string, dil: OkumaDili) => (ARAPCA.test(metin) ? '' : konusmaDili(metin, dil));

function sikListesi(dil: OkumaDili, siklar: string[], bilmiyorum?: string): string {
  const k = KALIP[dil];
  const satirlar = siklar.map((s, i) => `${k.sira[i] ?? String(i + 1)}${k.ayrac}${nokta(s)}`);
  if (bilmiyorum) satirlar.push(`${k.yaDa}${k.ayrac}${nokta(bilmiyorum)}`);
  return [k.siklar, ...satirlar].join('\n');
}

export function maddeOkumaMetni(madde: Madde, dil: OkumaDili, bilmiyorum: string): string {
  const kok = nokta(madde.soru[dil]);
  if (madde.alan === 'okuma') return guvenli(kok, dil);
  const siklar = madde.siklar.map(s => ('ar' in s ? '' : s[dil]));
  if (siklar.some(s => !s)) return guvenli(kok, dil);
  return guvenli(`${kok}\n\n${sikListesi(dil, siklar, bilmiyorum)}`, dil);
}

export function beyanOkumaMetni(b: BeyanMaddesi, dil: OkumaDili): string {
  return guvenli(`${nokta(b.soru[dil])}\n\n${sikListesi(dil, b.secenekler.map(s => s[dil]))}`, dil);
}

export function ezberOkumaMetni(e: EzberMaddesi, dil: OkumaDili, durumlar: readonly string[]): string {
  const bas = [nokta(e.ad[dil]), e.aciklama ? nokta(e.aciklama[dil]) : ''].filter(Boolean).join(' ');
  return guvenli(`${bas}\n\n${sikListesi(dil, [...durumlar])}`, dil);
}
