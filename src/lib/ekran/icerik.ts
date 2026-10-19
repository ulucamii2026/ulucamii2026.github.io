/**
 * Cami ekranının içerik akışı (/ekran/icerik.json): günün ayeti, hadisi, duası ve tema kartı — 27 Eylül 2026; dua
 * 29 Eylül 2026 (A alt projesi). 19 Ekim 2026: Esmâ-i Hüsnâ panelden kalktı; yerine her gün bir «tema kartı» gelir
 * (emek, disiplin, terbiye, ilim, birlikte yaşama, sabır): tematik ayet, hadis, bilgi kartı ya da güzel söz.
 *
 * Yalnız imamın onayladığı kayıtlar (durum: "imam-onayli") yayına girer. Eksik alanlı, mükerrer kimlikli ya da ekrana
 * sığmayan (src/lib/ekran/butce.ts) kayıt atlanır ve `eksik` listesinde raporlanır. Metinler resmî Diyanet
 * yayınlarından alınır; yerel ihtisas arşivi yalnız seçim/doğrulama içindir (telif kuralı). Fransızca meal DİB /
 * Mohammed Chiadmi «Le Noble Coran» (2022) çevirisidir; cami Diyanet'e bağlı olduğu için Diyanet yayınları için
 * ayrıca izin istenmez. Ayette ve Kur'an duasında `fr` ile `kaynakFr` birlikte dolu değilse FR yayımlanmaz, ekran
 * AR + TR gösterir. Hadisin, hadis duasının, bilgi kartının ve sözün FR metni imam onaylı çeviridir; altına çeviri
 * kaynağı yazılmaz (28 Eylül 2026 kararı). Sitedeki 10 ahlâk hadisi (src/lib/hadis-verisi.ts) zaten yayında olduğu
 * için başlangıç havuzudur. Fransızca metinlere Fransız yazım kuralı uygulanır (src/lib/fransiz-tipografi.ts).
 */
import type { HadisOgesi } from '../hadis-verisi.ts';
import { fransizMetin } from '../fransiz-tipografi.ts';
import { bilgiButce, maneviButce, type BilgiMetni, type ManeviMetin } from './butce.ts';
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

/** Tema kartının konusu; ekranda üst başlık olur (src/ekran/metinler.ts → TEMA_BASLIGI). */
export type TemaId = 'emek' | 'disiplin' | 'terbiye' | 'ilim' | 'birlikte' | 'sabir';
export const TEMALAR: readonly TemaId[] = ['emek', 'disiplin', 'terbiye', 'ilim', 'birlikte', 'sabir'];

interface KartOrtak { id: string; tema: TemaId; durum: Durum; onayTarihi?: string }
/** Tema kartı (src/data/ekran/kartlar.json). Ayet ve hadis kendi kayıt biçimindedir; bilgi kartı iki dilli başlık ve
 *  kısa metindir; söz atasözü ya da büyüklerin sözüdür (Arapçası isteğe bağlı, kaynak = söyleyen ya da «Atasözü»).
 *  Kartlar dosyadaki sırayla günden güne döner. */
export type KartKaydi =
  | (AyetKaydi & { cesit: 'ayet'; tema: TemaId })
  | (HadisKaydi & { cesit: 'hadis'; tema: TemaId })
  | (KartOrtak & { cesit: 'bilgi'; baslik: { tr: string; fr?: string }; tr: string; fr?: string; kaynak: string })
  | (KartOrtak & { cesit: 'soz'; ar?: string; tr: string; fr?: string; kaynak: string });

export interface EkranAyet { id: string; referans: Referans; ar: string; tr: string; fr?: string; kaynakTr: string; kaynakFr?: string }
export interface EkranHadis { id: string; ar: string; tr: string; fr?: string; kaynak: string }
/** `kaynak` ekranda görünen hazır kaynak satırıdır; `kuran` Arapçanın Kur'an yazı tipiyle yazılacağını söyler. */
export interface EkranDua { id: string; ar: string; tr: string; fr?: string; kaynak: string; kuran: boolean }
/** Bilgi kartı: FR başlığı ve FR metni ya birlikte vardır ya hiç yoktur. */
export interface EkranBilgi { id: string; baslik: { tr: string; fr?: string }; tr: string; fr?: string; kaynak: string }
export interface EkranSoz { id: string; ar?: string; tr: string; fr?: string; kaynak: string }
export type EkranKart =
  | { cesit: 'ayet'; tema: TemaId; oge: EkranAyet }
  | { cesit: 'hadis'; tema: TemaId; oge: EkranHadis }
  | { cesit: 'bilgi'; tema: TemaId; oge: EkranBilgi }
  | { cesit: 'soz'; tema: TemaId; oge: EkranSoz };
export interface EkranIcerik { ayetler: EkranAyet[]; hadisler: EkranHadis[]; dualar: EkranDua[]; kartlar: EkranKart[]; eksik: string[] }

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

/** Mükerrer kimlik denetimi: her tür (ayet, sitedeki hadis, JSON hadis, dua, tema kartı) kendi kimlik kümesiyle. */
function mukerrerDenetcisi(eksik: string[]): (id: string) => boolean {
  const gorulen = new Set<string>();
  return (id: string): boolean => {
    if (gorulen.has(id)) { eksik.push(id + ' (mükerrer)'); return false; }
    gorulen.add(id);
    return true;
  };
}

/** Ekrana sığıyor mu (src/lib/ekran/butce.ts); sığmıyorsa `eksik`e kısaltma miktarıyla yazar. */
function sigar(tur: 'ayet' | 'hadis' | 'dua' | 'soz', id: string, m: ManeviMetin, eksik: string[]): boolean {
  const b = maneviButce(tur, m);
  if (!b.uygun) eksik.push(`${id} (ekrana sığmaz: ${b.asim.join(', ')})`);
  return b.uygun;
}
function bilgiSigar(id: string, m: BilgiMetni, eksik: string[]): boolean {
  const b = bilgiButce(m);
  if (!b.uygun) eksik.push(`${id} (ekrana sığmaz: ${b.asim.join(', ')})`);
  return b.uygun;
}

/** Onaylı ayet kaydının ekran öğesi; taslak, eksik, bozuk, mükerrer ya da sığmayan kayıtta null (sebep `eksik`te). */
function ayetOgesi(a: AyetKaydi, eksik: string[], yeni: (id: string) => boolean): EkranAyet | null {
  if (a.durum !== 'imam-onayli') return null;
  if (!dolu(a.id) || !kunyeTam(a) || !dolu(a.ar) || !dolu(a.tr) || !dolu(a.kaynakTr)) { eksik.push(String(a.id)); return null; }
  if (!aralikGecerli(a.ayet)) { eksik.push(a.id + ' (ayet aralığı bozuk)'); return null; }
  if (!yeni(a.id)) return null;
  const frGecerli = dolu(a.fr) && dolu(a.kaynakFr);
  if (dolu(a.fr) && !frGecerli) eksik.push(String(a.id) + ' (FR kaynağı yok)');
  const oge: EkranAyet = { id: a.id, referans: referans(a.sureAdi, a.sure, a.ayet), ar: a.ar, tr: a.tr, ...(frGecerli ? { fr: frMetni(a.fr), kaynakFr: a.kaynakFr } : {}), kaynakTr: a.kaynakTr };
  return sigar('ayet', a.id, { ar: oge.ar, tr: oge.tr, fr: oge.fr, kaynak: ayetKaynagi(oge) }, eksik) ? oge : null;
}

function hadisOgesi(h: HadisKaydi, eksik: string[], yeni: (id: string) => boolean): EkranHadis | null {
  if (h.durum !== 'imam-onayli') return null;
  if (!dolu(h.id) || !dolu(h.ar) || !dolu(h.tr) || !dolu(h.kaynak)) { eksik.push(String(h.id)); return null; }
  if (!yeni(h.id)) return null;
  const fr = frMetni(h.fr);
  const oge: EkranHadis = { id: h.id, ar: h.ar, tr: h.tr, ...(fr ? { fr } : {}), kaynak: h.kaynak };
  return sigar('hadis', h.id, oge, eksik) ? oge : null;
}

/** Tema kartının ekran öğesi (ayet ve hadis kendi kurallarıyla). Bilgi kartında FR başlık ile FR metin birlikte
 *  yayımlanır; biri eksikse FR hiç çıkmaz ve `eksik`te işaretlenir. */
function kartOgesi(k: KartKaydi, eksik: string[], yeni: (id: string) => boolean): EkranKart | null {
  if (k.durum !== 'imam-onayli') return null;
  if (TEMALAR.indexOf(k.tema) < 0) { eksik.push(k.id + ' (tema bilinmiyor)'); return null; }
  switch (k.cesit) {
    case 'ayet': { const oge = ayetOgesi(k, eksik, yeni); return oge ? { cesit: 'ayet', tema: k.tema, oge } : null; }
    case 'hadis': { const oge = hadisOgesi(k, eksik, yeni); return oge ? { cesit: 'hadis', tema: k.tema, oge } : null; }
    case 'bilgi': {
      if (!dolu(k.id) || !nesneMi(k.baslik) || !dolu(k.baslik.tr) || !dolu(k.tr) || !dolu(k.kaynak)) { eksik.push(String(k.id)); return null; }
      if (!yeni(k.id)) return null;
      const frVar = dolu(k.fr) && dolu(k.baslik.fr);
      if ((dolu(k.fr) || dolu(k.baslik.fr)) && !frVar) eksik.push(k.id + ' (FR başlık ya da metin eksik)');
      const oge: EkranBilgi = frVar
        ? { id: k.id, baslik: { tr: k.baslik.tr, fr: frMetni(k.baslik.fr) }, tr: k.tr, fr: frMetni(k.fr), kaynak: k.kaynak }
        : { id: k.id, baslik: { tr: k.baslik.tr }, tr: k.tr, kaynak: k.kaynak };
      const m: BilgiMetni = { baslikTr: oge.baslik.tr, baslikFr: oge.baslik.fr, tr: oge.tr, fr: oge.fr, kaynak: oge.kaynak };
      return bilgiSigar(k.id, m, eksik) ? { cesit: 'bilgi', tema: k.tema, oge } : null;
    }
    case 'soz': {
      if (!dolu(k.id) || !dolu(k.tr) || !dolu(k.kaynak)) { eksik.push(String(k.id)); return null; }
      if (!yeni(k.id)) return null;
      const fr = frMetni(k.fr);
      const oge: EkranSoz = { id: k.id, ...(dolu(k.ar) ? { ar: k.ar } : {}), tr: k.tr, ...(fr ? { fr } : {}), kaynak: k.kaynak };
      return sigar('soz', k.id, { ar: oge.ar || '', tr: oge.tr, fr: oge.fr, kaynak: oge.kaynak }, eksik) ? { cesit: 'soz', tema: k.tema, oge } : null;
    }
    default:
      eksik.push(String((k as { id?: unknown }).id) + ' (kart çeşidi bilinmiyor)');
      return null;
  }
}

export function ekranIcerigi(ayetler: AyetKaydi[], hadisler: HadisKaydi[], siteHadisleri: HadisOgesi[], dualar: DuaKaydi[] = [], kartlar: KartKaydi[] = []): EkranIcerik {
  const eksik: string[] = [];

  const ekranAyetleri: EkranAyet[] = [];
  const yeniAyet = mukerrerDenetcisi(eksik);
  for (const a of ayetler) {
    if (!nesneMi(a)) { eksik.push('geçersiz kayıt (ayet): ' + String(a)); continue; }
    const oge = ayetOgesi(a, eksik, yeniAyet);
    if (oge) ekranAyetleri.push(oge);
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
    const oge = hadisOgesi(h, eksik, yeniHadis);
    if (oge) ekranHadisleri.push(oge);
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

  const ekranKartlari: EkranKart[] = [];
  const yeniKart = mukerrerDenetcisi(eksik);
  for (const k of kartlar) {
    if (!nesneMi(k)) { eksik.push('geçersiz kayıt (kart): ' + String(k)); continue; }
    const oge = kartOgesi(k, eksik, yeniKart);
    if (oge) ekranKartlari.push(oge);
  }

  return { ayetler: ekranAyetleri, hadisler: ekranHadisleri, dualar: ekranDualari, kartlar: ekranKartlari, eksik };
}
