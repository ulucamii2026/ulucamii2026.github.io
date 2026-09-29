/**
 * Cami ekranının içerik akışı (/ekran/icerik.json): günün ayeti, hadisi, duası ve Esmâ'sı — 27 Eylül 2026; dua ve
 * Esmâ 29 Eylül 2026 (A alt projesi).
 *
 * Yalnız imamın onayladığı kayıtlar (durum: "imam-onayli") yayına girer. Eksik alanlı, mükerrer kimlikli ya da ekrana
 * sığmayan (src/lib/ekran/butce.ts) kayıt atlanır ve `eksik` listesinde raporlanır. Metinler resmî Diyanet
 * yayınlarından alınır; yerel ihtisas arşivi yalnız seçim/doğrulama içindir (telif kuralı). Fransızca meal DİB /
 * Mohammed Chiadmi «Le Noble Coran» (2022) çevirisidir; cami Diyanet'e bağlı olduğu için Diyanet yayınları için
 * ayrıca izin istenmez. Ayette ve Kur'an duasında `fr` ile `kaynakFr` birlikte dolu değilse FR yayımlanmaz, ekran
 * AR + TR gösterir. Hadisin, hadis duasının ve Esmâ'nın FR metni imam onaylı çeviridir; altına çeviri kaynağı
 * yazılmaz (28 Eylül 2026 kararı). Sitedeki 10 ahlâk hadisi (src/lib/hadis-verisi.ts) zaten yayında olduğu için
 * başlangıç havuzudur. Fransızca metinlere Fransız yazım kuralı uygulanır (src/lib/fransiz-tipografi.ts).
 */
import type { HadisOgesi } from '../hadis-verisi.ts';
import { fransizMetin } from '../fransiz-tipografi.ts';
import { maneviButce, type ManeviMetin } from './butce.ts';
import { ayetKaynagi, referans, type Referans } from './kaynak.ts';

type Durum = 'taslak' | 'imam-onayli';

export interface AyetKaydi {
  id: string;
  sure: number;
  ayet: number[];
  sureAdi: Referans;
  ar: string;
  tr: string;
  fr?: string;
  kaynakTr: string;
  kaynakFr?: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface HadisKaydi {
  id: string;
  ar: string;
  tr: string;
  fr?: string;
  kaynak: string;
  durum: Durum;
  onayTarihi?: string;
}

/** Kur'an duası (`ayet` dolu) ya da hadis duası (`hadis` = hadis kaynağı, ör. «Müslim, Zikir, 1»): tam olarak biri. */
export interface DuaKaydi {
  id: string;
  ar: string;
  tr: string;
  fr?: string;
  /** TR metnin alındığı Diyanet yayını (Kur'an duasında meal). */
  kaynakTr: string;
  kaynakFr?: string;
  ayet?: { sure: number; ayet: number[]; sureAdi: Referans };
  hadis?: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface EsmaKaydi {
  id: string;
  /** Esmâ listesindeki sıra (1–99); ekran bu sırayla döner. */
  sira: number;
  ar: string;
  /** Türkçe okunuş (ör. «er-Rahîm»). */
  okunus: string;
  tr: string;
  fr?: string;
  kaynakTr: string;
  kaynakFr?: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface EkranAyet { id: string; referans: Referans; ar: string; tr: string; fr?: string; kaynakTr: string; kaynakFr?: string }
export interface EkranHadis { id: string; ar: string; tr: string; fr?: string; kaynak: string }
/** `kaynak` ekranda görünen hazır kaynak satırıdır; `kuran` Arapçanın Kur'an yazı tipiyle yazılacağını söyler. */
export interface EkranDua { id: string; ar: string; tr: string; fr?: string; kaynak: string; kuran: boolean }
export interface EkranEsma { id: string; sira: number; ar: string; okunus: string; tr: string; fr?: string; kaynak: string }
export interface EkranIcerik { ayetler: EkranAyet[]; hadisler: EkranHadis[]; dualar: EkranDua[]; esmalar: EkranEsma[]; eksik: string[] }

const dolu = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
/** Ayet numaraları pozitif tam sayı ve aralığın sonu başından önce değil (ör. [7, 5] ters aralıktır). */
const aralikGecerli = (ayetler: number[]): boolean =>
  ayetler.every((n) => Number.isInteger(n) && n >= 1) && ayetler[ayetler.length - 1] >= ayetler[0];
/** JSON dosyasında null ya da nesne olmayan öğe derlemeyi düşürmez; `eksik`te raporlanır. */
const nesneMi = (x: unknown): boolean => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Sure 1–114, dolu ayet dizisi, TR ve FR sure adı (ayet kaydında ve Kur'an duasında). */
const kunyeTam = (k: { sure: number; ayet: number[]; sureAdi: Referans } | null | undefined): boolean =>
  !!k && Number.isInteger(k.sure) && k.sure >= 1 && k.sure <= 114 && Array.isArray(k.ayet) && k.ayet.length > 0
  && !!k.sureAdi && dolu(k.sureAdi.tr) && dolu(k.sureAdi.fr);
/** Dolu FR metni Fransız yazım kuralıyla; boşsa yok. */
const frMetni = (s: string | undefined): string | undefined => (dolu(s) ? fransizMetin(s) : undefined);

/** Mükerrer kimlik denetimi: her tür (ayet, sitedeki hadis, JSON hadis, dua, Esmâ) kendi kimlik kümesiyle. */
function mukerrerDenetcisi(eksik: string[]): (id: string) => boolean {
  const gorulen = new Set<string>();
  return (id: string): boolean => {
    if (gorulen.has(id)) { eksik.push(id + ' (mükerrer)'); return false; }
    gorulen.add(id);
    return true;
  };
}

/** Ekrana sığıyor mu (src/lib/ekran/butce.ts); sığmıyorsa `eksik`e kısaltma miktarıyla yazar. */
function sigar(tur: 'ayet' | 'hadis' | 'dua' | 'esma', id: string, m: ManeviMetin, eksik: string[]): boolean {
  const b = maneviButce(tur, m);
  if (!b.uygun) eksik.push(`${id} (ekrana sığmaz: ${b.asim.join(', ')})`);
  return b.uygun;
}

export function ekranIcerigi(ayetler: AyetKaydi[], hadisler: HadisKaydi[], siteHadisleri: HadisOgesi[], dualar: DuaKaydi[] = [], esmalar: EsmaKaydi[] = []): EkranIcerik {
  const eksik: string[] = [];

  const ekranAyetleri: EkranAyet[] = [];
  const yeniAyet = mukerrerDenetcisi(eksik);
  for (const a of ayetler) {
    if (!nesneMi(a)) { eksik.push('geçersiz kayıt (ayet): ' + String(a)); continue; }
    if (a.durum !== 'imam-onayli') continue;
    if (!dolu(a.id) || !kunyeTam(a) || !dolu(a.ar) || !dolu(a.tr) || !dolu(a.kaynakTr)) { eksik.push(String(a.id)); continue; }
    if (!aralikGecerli(a.ayet)) { eksik.push(a.id + ' (ayet aralığı bozuk)'); continue; }
    if (!yeniAyet(a.id)) continue;
    const frGecerli = dolu(a.fr) && dolu(a.kaynakFr);
    if (dolu(a.fr) && !frGecerli) eksik.push(String(a.id) + ' (FR kaynağı yok)');
    const oge: EkranAyet = { id: a.id, referans: referans(a.sureAdi, a.sure, a.ayet), ar: a.ar, tr: a.tr, ...(frGecerli ? { fr: frMetni(a.fr), kaynakFr: a.kaynakFr } : {}), kaynakTr: a.kaynakTr };
    if (sigar('ayet', a.id, { ar: oge.ar, tr: oge.tr, fr: oge.fr, kaynak: ayetKaynagi(oge) }, eksik)) ekranAyetleri.push(oge);
  }

  const ekranHadisleri: EkranHadis[] = [];
  const yeniSiteHadisi = mukerrerDenetcisi(eksik);
  for (const h of siteHadisleri) {
    const id = 'site-' + h.id;
    if (!yeniSiteHadisi(id)) continue;
    const fr = frMetni(h.metin.fr);
    const oge: EkranHadis = { id, ar: h.arapca, tr: h.metin.tr, ...(fr ? { fr } : {}), kaynak: h.kaynak };
    if (sigar('hadis', id, oge, eksik)) ekranHadisleri.push(oge);
  }
  const yeniHadis = mukerrerDenetcisi(eksik);
  for (const h of hadisler) {
    if (!nesneMi(h)) { eksik.push('geçersiz kayıt (hadis): ' + String(h)); continue; }
    if (h.durum !== 'imam-onayli') continue;
    if (!dolu(h.id) || !dolu(h.ar) || !dolu(h.tr) || !dolu(h.kaynak)) { eksik.push(String(h.id)); continue; }
    if (!yeniHadis(h.id)) continue;
    const fr = frMetni(h.fr);
    const oge: EkranHadis = { id: h.id, ar: h.ar, tr: h.tr, ...(fr ? { fr } : {}), kaynak: h.kaynak };
    if (sigar('hadis', h.id, oge, eksik)) ekranHadisleri.push(oge);
  }

  const ekranDualari: EkranDua[] = [];
  const yeniDua = mukerrerDenetcisi(eksik);
  for (const d of dualar) {
    if (!nesneMi(d)) { eksik.push('geçersiz kayıt (dua): ' + String(d)); continue; }
    if (d.durum !== 'imam-onayli') continue;
    if (!dolu(d.id) || !dolu(d.ar) || !dolu(d.tr) || !dolu(d.kaynakTr)) { eksik.push(String(d.id)); continue; }
    const kuran = d.ayet !== undefined;
    if (kuran === dolu(d.hadis) || (kuran && !kunyeTam(d.ayet))) { eksik.push(d.id + ' (ayet/hadis kaynağı bozuk)'); continue; }
    if (kuran && !aralikGecerli(d.ayet!.ayet)) { eksik.push(d.id + ' (ayet aralığı bozuk)'); continue; }
    if (!yeniDua(d.id)) continue;
    let oge: EkranDua;
    if (kuran) {
      const k = d.ayet!;
      const frGecerli = dolu(d.fr) && dolu(d.kaynakFr);
      if (dolu(d.fr) && !frGecerli) eksik.push(d.id + ' (FR kaynağı yok)');
      const fr = frGecerli ? frMetni(d.fr) : undefined;
      const kaynak = ayetKaynagi({ referans: referans(k.sureAdi, k.sure, k.ayet), kaynakTr: d.kaynakTr, fr, kaynakFr: d.kaynakFr });
      oge = { id: d.id, ar: d.ar, tr: d.tr, ...(fr ? { fr } : {}), kaynak, kuran: true };
    } else {
      const fr = frMetni(d.fr);
      oge = { id: d.id, ar: d.ar, tr: d.tr, ...(fr ? { fr } : {}), kaynak: d.hadis!, kuran: false };
    }
    if (sigar('dua', d.id, oge, eksik)) ekranDualari.push(oge);
  }

  const ekranEsmalari: EkranEsma[] = [];
  const yeniEsma = mukerrerDenetcisi(eksik);
  const siralar = new Set<number>();
  for (const e of esmalar) {
    if (!nesneMi(e)) { eksik.push('geçersiz kayıt (esma): ' + String(e)); continue; }
    if (e.durum !== 'imam-onayli') continue;
    if (!dolu(e.id) || !dolu(e.ar) || !dolu(e.okunus) || !dolu(e.tr) || !dolu(e.kaynakTr)) { eksik.push(String(e.id)); continue; }
    if (!(Number.isInteger(e.sira) && e.sira >= 1 && e.sira <= 99)) { eksik.push(e.id + ' (sıra 1–99 değil)'); continue; }
    if (siralar.has(e.sira)) { eksik.push(e.id + ' (sıra mükerrer)'); continue; }
    if (!yeniEsma(e.id)) continue;
    const fr = frMetni(e.fr);
    const oge: EkranEsma = { id: e.id, sira: e.sira, ar: e.ar, okunus: e.okunus, tr: e.tr, ...(fr ? { fr } : {}), kaynak: e.kaynakTr };
    if (!sigar('esma', e.id, oge, eksik)) continue;
    siralar.add(e.sira);
    ekranEsmalari.push(oge);
  }
  ekranEsmalari.sort((a, b) => a.sira - b.sira);

  return { ayetler: ekranAyetleri, hadisler: ekranHadisleri, dualar: ekranDualari, esmalar: ekranEsmalari, eksik };
}
