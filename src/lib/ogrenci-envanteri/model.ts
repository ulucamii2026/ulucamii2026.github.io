/**
 * Online envanter («Neler biliyorum?», 1 Kasım 2026) — saf model: madde kümesi, belge biçimi, ilerleme ve rozet.
 * Şartname: D:\ulu-camii-kuran-kursu\belgeler\bireysel-plan-2026-2027\ONLINE-ENVANTER-SPEC.md.
 * Madde kümesi `src/data/ogrenci-envanteri/maddeler.json` (kurs projesindeki scripts/envanter_json.py üretir; kâğıt formla
 * birebir aynı kimlikler). Kişisel veri yok: öğrenci verisi yalnız Firestore `ogrenciEnvanteri` belgelerinde durur.
 */
import maddelerJson from '../../data/ogrenci-envanteri/maddeler.json';

export type Grup = '5-8' | '9-13';
export type Ikili = { tr: string; fr: string };
export type Satir = { id: string; tr: string; fr: string; ar?: string };
export type Bolum = { tr: string; fr: string; ikon: string; olcek: string; satirlar: Satir[] };
export type Secenek = { anahtar: string | number; tr: string; fr: string };
export type Kutu = { anahtar: string; tr: string; fr: string; coklu: boolean; secenekler: Secenek[] };
export type MetinAlani = { alan: string; tr: string; fr: string; satir: number; liste?: boolean; hoca?: boolean };
export type Sayfa = { no: number; bolumler: Bolum[]; kutular: Kutu[]; metin: MetinAlani[]; cizim?: Ikili };
export type GrupMaddeleri = { okuma_adet: number; sayfalar: Sayfa[] };
export type Maddeler = {
  olcekler: Record<string, Ikili[]>;
  yuzler: string[];
  okuma: { basamaklar: (Ikili & { no: number })[]; alt: (Ikili & { anahtar: string })[] };
  gruplar: Record<Grup, GrupMaddeleri>;
};

export const MADDELER = maddelerJson as unknown as Maddeler;
export const GRUPLAR: Grup[] = ['5-8', '9-13'];
export const TEST_REF = 'TEST-ENVANTER';
export const grupAdi = (g: Grup) => (g === '5-8' ? '5–8 yaş' : '9–13 yaş');

export type Durum = 'baslandi' | 'ogrenci-bitti' | 'tamam';
export interface EnvanterBelgesi {
  id: string; ref: string; tarih: string; grup: Grup; kaynak: string;
  ben: Record<string, number>; hoca: Record<string, number>;
  kutular: Record<string, (string | number)[]>; metin: Record<string, string | string[]>;
  okuma: { basamak?: number; sonraki?: number }; okuma_notlari: Record<string, string>;
  cizim?: string; sayfaDinlendi: Record<string, boolean>; durum: Durum; surum: number;
}

export const belgeKimligi = (ref: string, tarih: string, grup: Grup) => `${ref}_${tarih}_${grup}`;

const kayit = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const degerler = (v: unknown): Record<string, number> =>
  Object.fromEntries(Object.entries(kayit(v)).filter(([, x]) => x === 0 || x === 1 || x === 2).map(([k, x]) => [k, x as number]));

/** Firestore'dan gelen veriyi güvenli biçime çevirir (kâğıttan aktarılan belgeler eksik alan taşıyabilir). */
export function belgeOku(id: string, veri: unknown): EnvanterBelgesi | null {
  const d = kayit(veri);
  const grup = d.grup;
  if ((grup !== '5-8' && grup !== '9-13') || typeof d.ref !== 'string' || typeof d.tarih !== 'string') return null;
  const okuma = kayit(d.okuma);
  const sayi = (x: unknown) => (typeof x === 'number' && x >= 0 && x <= 6 ? x : undefined);
  return {
    id, ref: d.ref, tarih: d.tarih, grup, kaynak: typeof d.kaynak === 'string' ? d.kaynak : 'online',
    ben: degerler(d.ben), hoca: degerler(d.hoca),
    kutular: Object.fromEntries(Object.entries(kayit(d.kutular)).filter(([, x]) => Array.isArray(x)).map(([k, x]) => [k, [...(x as (string | number)[])]])),
    metin: Object.fromEntries(Object.entries(kayit(d.metin)).filter(([, x]) => typeof x === 'string' || Array.isArray(x)).map(([k, x]) => [k, Array.isArray(x) ? x.map(String) : (x as string)])),
    okuma: { basamak: sayi(okuma.basamak), sonraki: sayi(okuma.sonraki) },
    okuma_notlari: Object.fromEntries(Object.entries(kayit(d.okuma_notlari)).filter(([, x]) => typeof x === 'string').map(([k, x]) => [k, x as string])),
    cizim: typeof d.cizim === 'string' ? d.cizim : undefined,
    sayfaDinlendi: Object.fromEntries(Object.entries(kayit(d.sayfaDinlendi)).map(([k, x]) => [k, x === true])),
    durum: d.durum === 'ogrenci-bitti' || d.durum === 'tamam' ? d.durum : 'baslandi',
    surum: typeof d.surum === 'number' ? d.surum : 0,
  };
}

export function bosBelge(ref: string, tarih: string, grup: Grup): EnvanterBelgesi {
  return {
    id: belgeKimligi(ref, tarih, grup), ref, tarih, grup, kaynak: 'online', ben: {}, hoca: {}, kutular: {}, metin: {}, okuma: {},
    okuma_notlari: {}, sayfaDinlendi: {}, durum: 'baslandi', surum: 0,
  };
}

export const tumSatirlar = (grup: Grup): Satir[] => MADDELER.gruplar[grup].sayfalar.flatMap((s) => s.bolumler.flatMap((b) => b.satirlar));
export const sayfaSatirlari = (s: Sayfa): Satir[] => s.bolumler.flatMap((b) => b.satirlar);

export interface Ilerleme { toplam: number; ben: number; hoca: number; sayfa: number; dinlenen: number }
export function ilerleme(b: EnvanterBelgesi | undefined, grup: Grup): Ilerleme {
  const satir = tumSatirlar(grup);
  const sayfalar = MADDELER.gruplar[grup].sayfalar;
  return {
    toplam: satir.length,
    ben: b ? satir.filter((s) => s.id in b.ben).length : 0,
    hoca: b ? satir.filter((s) => s.id in b.hoca).length : 0,
    sayfa: sayfalar.length,
    dinlenen: b ? sayfalar.filter((s) => b.sayfaDinlendi[String(s.no)]).length : 0,
  };
}

export type Rozet = 'eksik' | 'dogrulanacak' | 'dolu';
/** eksik: öğrenci sütunu tamam değil · doğrulanacak: hoca her satırı doğrulamadı / sayfa dinlenmedi · dolu: ikisi de tamam. */
export function rozet(b: EnvanterBelgesi | undefined, grup: Grup): Rozet {
  if (!b) return 'eksik';
  const i = ilerleme(b, grup);
  if (i.ben < i.toplam) return 'eksik';
  if (b.durum === 'tamam') return 'dolu';
  const sayfaliSatir = MADDELER.gruplar[grup].sayfalar.filter((s) => sayfaSatirlari(s).length);
  const hepsiDinlendi = sayfaliSatir.every((s) => b.sayfaDinlendi[String(s.no)]);
  return i.hoca >= i.toplam || hepsiDinlendi ? 'dolu' : 'dogrulanacak';
}
export const ROZET_ADI: Record<Rozet, string> = { eksik: 'eksik', dogrulanacak: 'doğrulanacak', dolu: 'dolu' };

/** Aynı öğrenci + grup için en yeni belge (tarih, sonra sürüm); kâğıttan aktarılan belge de sayılır. */
export function enYeni(belgeler: Iterable<EnvanterBelgesi>, ref: string, grup: Grup): EnvanterBelgesi | undefined {
  let son: EnvanterBelgesi | undefined;
  for (const b of belgeler)
    if (b.ref === ref && b.grup === grup && (!son || b.tarih > son.tarih || (b.tarih === son.tarih && b.surum > son.surum))) son = b;
  return son;
}

/* ───────────── günün sırası ve kişisel program (Python yazar) ───────────── */
export type Adim = { id: string; saat: string; ders: number; ref: string | null; is: string; grup?: Grup; aciklama_tr: string; sure_dk: number };
export type GunSirasi = { tarih: string; adimlar: Adim[]; yapildi: Record<string, boolean> };
export type ProgramHafta = { tarih: string; derste_tr: string; derste_fr: string; evde_tr: string; evde_fr: string; hoca_dinler_tr: string };
export type ProgramHedef = { tur: string; baslik_tr: string; baslik_fr: string; neden_tr: string; haftalar: ProgramHafta[] };
export type Program = { ref: string; durum: 'taslak' | 'onayli'; donem: string; hedefler: ProgramHedef[]; ogrenciye_tr: string; ogrenciye_fr: string };

const metin = (v: unknown) => (typeof v === 'string' ? v : '');
export function gunSirasiOku(veri: unknown): GunSirasi | null {
  const d = kayit(veri);
  if (!Array.isArray(d.adimlar)) return null;
  const adimlar = (d.adimlar as unknown[]).flatMap((x): Adim[] => {
    const a = kayit(x);
    if (typeof a.id !== 'string') return [];
    return [{ id: a.id, saat: metin(a.saat), ders: typeof a.ders === 'number' ? a.ders : 0, ref: typeof a.ref === 'string' ? a.ref : null, is: metin(a.is),
      grup: a.grup === '5-8' || a.grup === '9-13' ? a.grup : undefined, aciklama_tr: metin(a.aciklama_tr), sure_dk: typeof a.sure_dk === 'number' ? a.sure_dk : 0 }];
  });
  return { tarih: metin(d.tarih), adimlar, yapildi: Object.fromEntries(Object.entries(kayit(d.yapildi)).map(([k, x]) => [k, x === true])) };
}
export function programOku(veri: unknown): Program | null {
  const d = kayit(veri);
  if (typeof d.ref !== 'string') return null;
  const hedefler = (Array.isArray(d.hedefler) ? d.hedefler : []).slice(0, 3).map((h: unknown): ProgramHedef => {
    const x = kayit(h);
    return { tur: metin(x.tur), baslik_tr: metin(x.baslik_tr), baslik_fr: metin(x.baslik_fr), neden_tr: metin(x.neden_tr),
      haftalar: (Array.isArray(x.haftalar) ? x.haftalar : []).map((w: unknown): ProgramHafta => {
        const k = kayit(w);
        return { tarih: metin(k.tarih), derste_tr: metin(k.derste_tr), derste_fr: metin(k.derste_fr), evde_tr: metin(k.evde_tr), evde_fr: metin(k.evde_fr), hoca_dinler_tr: metin(k.hoca_dinler_tr) };
      }) };
  });
  return { ref: d.ref, durum: d.durum === 'onayli' ? 'onayli' : 'taslak', donem: metin(d.donem), hedefler, ogrenciye_tr: metin(d.ogrenciye_tr), ogrenciye_fr: metin(d.ogrenciye_fr) };
}
