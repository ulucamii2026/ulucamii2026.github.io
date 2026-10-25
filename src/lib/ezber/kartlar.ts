/**
 * Ezber kartları · 8'li baskı (25 Ekim 2026): seçilen ezberleri A4 kâğıda 2 × 4 = 8 kart olarak dizen saf kütüphane. Ekran ve ağ
 * bilmez; `egitim/src/scripts/kartlar.ts` ve `egitim/src/pages/[dil]/kartlar.astro` bunu kullanır, tests/ezber-kartlar.test.mjs sabitler.
 *
 * ÇİFT TARAFLI DÜZEN (bağlayıcı): uzun kenardan çevrilen dikey A4'te kâğıt dikey eksen etrafında döner. Ön yüzde (satır r, sütun c)
 * konumundaki kartın arkası, çevirince aynı satırda ters sütundadır (r, sütun−1−c). Bu yüzden arka sayfa, ön sayfanın her SATIRI
 * ters çevrilmiş sırayla dizilir (`aynala`). Kartların kendi içeriği aynalanmaz; yalnız konumları yer değiştirir. Kesik çizgiler
 * ve kenar boşlukları iki yüzde simetriktir (kartlar.css), böylece ön ve arka tam üst üste gelir.
 *
 * Arapça yazı yalnız aynı maddenin kendi sayfasında zaten gösterilen metinden (src/data/ezber/metin/<id>.json) alınır; kartta
 * okunuş yoktur (DİYK 2021 Karar 15 ve 23; aynı kural basılı tek kartta da geçerli).
 */
import type { CihazDurumu } from './cihaz';
import { belgeSatirlari } from './belge';
import type { MaddeMetni } from './madde-metni';

export const KART_SUTUN = 2;
export const KART_SATIR = 4;
/** Bir kâğıt yüzündeki kart sayısı. */
export const SAYFA_KART = KART_SUTUN * KART_SATIR;

export type Yuz = 'on' | 'arka';
/** Basılacak yüzler: ikisi (çift taraflı), yalnız ön ya da yalnız arka (tek taraflı yazıcı: iki geçiş). */
export type YuzSecimi = 'cift' | 'on' | 'arka';

export interface KartSayfasi<T> {
  /** 1'den başlar. */
  readonly sayfa: number;
  /** Ön yüz: soldan sağa, yukarıdan aşağıya; kalan yer `null`. */
  readonly on: readonly (T | null)[];
  /** Arka yüz: ön yüzün her satırı ters çevrilmiş (uzun kenardan çevirince karşı karşıya gelir). */
  readonly arka: readonly (T | null)[];
}

export interface BasilacakSayfa<T> {
  readonly sayfa: number;
  readonly yuz: Yuz;
  readonly kartlar: readonly (T | null)[];
}

/** Bir yüzün her satırını ters çevirir: uzun kenardan çevrilen kâğıtta ön yüzdeki kartın arkası ters sütundadır. */
export function aynala<T>(yuz: readonly T[], sutun = KART_SUTUN): T[] {
  if (!Number.isInteger(sutun) || sutun < 1) throw new RangeError('sütun sayısı pozitif tam sayı olmalı');
  const cikti: T[] = [];
  for (let i = 0; i < yuz.length; i += sutun) cikti.push(...yuz.slice(i, i + sutun).reverse());
  return cikti;
}

/** Kartları sayfalara böler; son sayfanın boş yerleri `null` kalır ve arka yüz de aynı hücrelerin aynasıdır. */
export function sayfala<T>(ogeler: readonly T[], sayfaKart = SAYFA_KART, sutun = KART_SUTUN): KartSayfasi<T>[] {
  if (!Number.isInteger(sayfaKart) || sayfaKart < 1 || sayfaKart % sutun !== 0) throw new RangeError('sayfa kart sayısı sütunun katı olmalı');
  const sayfalar: KartSayfasi<T>[] = [];
  for (let i = 0; i < ogeler.length; i += sayfaKart) {
    const on: (T | null)[] = ogeler.slice(i, i + sayfaKart);
    while (on.length < sayfaKart) on.push(null);
    sayfalar.push({ sayfa: sayfalar.length + 1, on, arka: aynala(on, sutun) });
  }
  return sayfalar;
}

/**
 * Yazıcıya giden sayfa sırası. Çift taraflı: ön 1, arka 1, ön 2, arka 2… (yazıcı her yaprağın iki yüzünü art arda basar).
 * Yalnız ön / yalnız arka: tek taraflı yazıcıda iki geçiş için aynı sıra korunur.
 */
export function basimSirasi<T>(sayfalar: readonly KartSayfasi<T>[], secim: YuzSecimi = 'cift'): BasilacakSayfa<T>[] {
  const cikti: BasilacakSayfa<T>[] = [];
  for (const s of sayfalar) {
    if (secim !== 'arka') cikti.push({ sayfa: s.sayfa, yuz: 'on', kartlar: s.on });
    if (secim !== 'on') cikti.push({ sayfa: s.sayfa, yuz: 'arka', kartlar: s.arka });
  }
  return cikti;
}

/** Seçili kart sayısından kâğıt özeti: `kagit` yaprak, `sayfa` basılacak toplam yüz. */
export function basimOzeti(kart: number, secim: YuzSecimi = 'cift'): { kart: number; kagit: number; sayfa: number } {
  const kagit = Math.ceil(kart / SAYFA_KART);
  return { kart, kagit, sayfa: secim === 'cift' ? kagit * 2 : kagit };
}

/**
 * Katalog kodu (karta basılır): şerit numarası ve şeritteki sıra, «3-02»; Amme «8-14»; kenar suyu «K-04». Kodun amacı elle
 * eşleştirmedir (kesilmiş ön ve arka yüz aynı kodu taşır) ve ezberin katalogdaki yerini söylemektir.
 */
export function kartKodu(seviye: number | 'kenar', sira: number): string {
  return `${seviye === 'kenar' ? 'K' : seviye}-${String(sira).padStart(2, '0')}`;
}

/** Ön yüzde Arapça satırdaki en çok kelime (uzun duaların ilk satırı kartı taşırmasın). */
export const ARAPCA_KELIME_TAVANI = 6;

export interface ArapcaKartYazisi {
  readonly metin: string;
  /** Metin ilk kelimelerle sınırlandı: kartta «…» (Arapça yazı tipinde değil) eklenir. */
  readonly kesik: boolean;
}

/**
 * Ön yüzün Arapça satırı. Tam sûrede sayfanın serlevhasındaki «سُورَةُ …» adı; öbür maddelerde sayfadaki ilk bölümün ilk
 * kelimeleri. Metni olmayan madde (bilgi maddeleri) için `null`: kartta Arapça satır çizilmez.
 */
export function arapcaKartYazisi(mt: MaddeMetni | undefined, id: string, tur: string): ArapcaKartYazisi | null {
  if (!mt || mt.bolumler.length === 0) return null;
  const tamSure = mt.kuran && tur === 'sure' && mt.kuran.ayetler[0] === 1 && !/-\d+-\d+$/.test(id);
  if (tamSure && mt.sureAdi) return { metin: `سُورَةُ ${mt.sureAdi}`, kesik: false };
  const kelimeler = mt.bolumler[0].ar.trim().split(/\s+/).filter(Boolean);
  const kesik = kelimeler.length > ARAPCA_KELIME_TAVANI || mt.bolumler.length > 1;
  return { metin: kelimeler.slice(0, ARAPCA_KELIME_TAVANI).join(' '), kesik };
}

const KIMLIK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `?sec=a,b` sorgusundaki madde kimlikleri; yalnız katalogda (çalışma sayfası olanlar arasında) bulunanlar, sırayı katalog belirler. */
export function secParametresi(sorgu: string, sira: readonly string[]): string[] {
  let ham = '';
  try { ham = new URLSearchParams(sorgu).get('sec') ?? ''; } catch { return []; }
  const istenen = new Set(ham.split(',').map((s) => s.trim()).filter((s) => KIMLIK.test(s)));
  return sira.filter((id) => istenen.has(id));
}

/**
 * Açılışta işaretli gelen ezberler: bu cihazda çalışma kaydı olanlar (Çalışma Belgesi ile aynı ölçüt) ve bağlantıyla istenenler.
 * Hiçbiri yoksa boş: hiçbir şey kendiliğinden seçilmez. Sıra katalog sırasıdır.
 */
export function baslangicSecimi(d: CihazDurumu, sira: readonly string[], sec: readonly string[] = []): string[] {
  const calisilan = new Set(belgeSatirlari(d, sira).map((s) => s.id));
  for (const id of sec) if (sira.includes(id)) calisilan.add(id);
  return sira.filter((id) => calisilan.has(id));
}
