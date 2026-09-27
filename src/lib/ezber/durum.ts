/**
 * Ezber Kilimi — durum makinesi (27 Eylül 2026, Faz 1b). Saf işlevler: ekran ve veritabanı bilmez; günler
 * 'YYYY-AA-GG' dizesidir (Brüksel ders günü). Firestore biçimi, kurallar ve geçiş: docs/EZBER-KILIMI.md «Durum
 * makinesi ve veri modeli»; yazan katman `depo.ts`. Hatalı girdi `Error` fırlatır; ileti ekranda olduğu gibi gösterilir.
 *
 * Basamaklar: 0 yok · 1 Çalışıyor · 2 Hocaya okudu · 3 Pekişti · 4 Kalıcı (kayıtta yalnız 1–4 durur).
 * Dinleme tam/az: 0–1 → 2 (+7 gün) · 2 → 3 (+30) ve 3 → 4 yalnız kontrol günü gelince; erken dinleme yalnız olaydır,
 * «yine de ilerlet» (`zorla`) açıkça ilerletir. «Tekrar gelsin» her zaman bir basamak düşürür (en az 1), +7 gün.
 */
import { gunGecerli, tarihEkle } from '../ogrenme-ilerleme';
import { KATALOG, SEVIYE_SIRASI, ezberBul, seviyeOgeleri, type EskiDurum, type Katalog, type Seviye } from './katalog';

export type Basamak = 0 | 1 | 2 | 3 | 4;
export type Kalite = 'tam' | 'az' | 'tekrar';
export type OlayTuru = 'atama' | 'dinleme' | 'duzeltme' | 'gecis';

/** 2 → 3 (Pekişti) için en az bekleme. */
export const PEKISME_GUN = 7;
/** 3 → 4 (Kalıcı) için en az bekleme. */
export const KALICILIK_GUN = 30;
/** «Tekrar gelsin» sonrası yeniden kontrol. */
export const TEKRAR_GUN = 7;
/** Bir kayıttaki kalıp not sayısı üst sınırı (kural da denetler). */
export const NOT_SINIRI = 3;
export const KALITELER: readonly Kalite[] = Object.freeze(['tam', 'az', 'tekrar'] as const);
/** Kalıp notu anahtarı; metinler ekran katmanındaki kalıp tablosundadır. Kuraldaki kalıpla aynı. */
const NOT_KALIBI = /^[a-z0-9-]{1,40}$/;

export interface OgeDurumu {
  readonly basamak: 1 | 2 | 3 | 4;
  /** Son dinlemenin kalitesi; atama ve geçişte boş. */
  readonly kalite: Kalite | '';
  /** Son dinlemede veliye seçilen kalıp notları (anahtar). */
  readonly notlar: readonly string[];
  /** Sonraki kontrol günü: 2–3'te dolu, 4'te boş, 1'de yalnız «Tekrar gelsin» sonrası dolu. */
  readonly sonrakiKontrol: string;
  /** Madde başına iyimser eşzamanlılık sayacı: kural `eski + 1` (yeni maddede 1) ister. */
  readonly surum: number;
}
/** Elle düzeltmenin hedefi: sürümü makine verir. */
export type Hedef = Omit<OgeDurumu, 'surum'>;
export interface EzberOlayi {
  readonly ezber: string;
  readonly tur: OlayTuru;
  /** Yalnız dinlemede dolu. */
  readonly kalite: Kalite | '';
  readonly notlar: readonly string[];
  readonly basamakOnce: Basamak;
  readonly basamakSonra: Basamak;
  /** Kontrol gününden önce «yine de ilerlet» ile ilerletildi. */
  readonly zorla: boolean;
  /** Ders günü. */
  readonly tarih: string;
}
/** `yaz`: durum ve olay · `sil`: madde kaydı kalkar + olay · `olay`: durum değişmez, yalnız olay yazılır. */
export type Gecis =
  | { readonly islem: 'yaz'; readonly durum: OgeDurumu; readonly olay: EzberOlayi }
  | { readonly islem: 'sil'; readonly olay: EzberOlayi }
  | { readonly islem: 'olay'; readonly olay: EzberOlayi };

function gunDenetle(bugun: string): void {
  if (!gunGecerli(bugun)) throw new Error(`Geçersiz gün: ${String(bugun)} (YYYY-AA-GG beklenir).`);
}
function kimlikDenetle(id: string): void {
  if (!ezberBul(id)) throw new Error(`Katalogda olmayan ezber kimliği: ${String(id)}.`);
}
function notHatasi(notlar: unknown): string {
  if (!Array.isArray(notlar)) return 'Notlar liste olmalı.';
  if (notlar.length > NOT_SINIRI) return `En çok ${NOT_SINIRI} not seçilebilir.`;
  for (const [i, n] of notlar.entries()) {
    if (typeof n !== 'string' || !NOT_KALIBI.test(n)) return `Geçersiz not anahtarı: ${String(n)}.`;
    if (notlar.indexOf(n) !== i) return `Aynı not iki kez seçilmiş: ${n}.`;
  }
  return '';
}
/** Madde durumunun alan ve tutarlılık denetimi (kuralla aynı); geçerliyse boş dize. */
function hedefHatasi(x: Record<string, unknown>): string {
  const { basamak, kalite, sonrakiKontrol } = x;
  if (basamak !== 1 && basamak !== 2 && basamak !== 3 && basamak !== 4) return `Basamak 1–4 olmalı: ${String(basamak)}.`;
  if (kalite !== '' && !KALITELER.includes(kalite as Kalite)) return `Geçersiz kalite: ${String(kalite)}.`;
  const not = notHatasi(x.notlar);
  if (not) return not;
  if (typeof sonrakiKontrol !== 'string' || (sonrakiKontrol !== '' && !gunGecerli(sonrakiKontrol))) return `Geçersiz kontrol günü: ${String(sonrakiKontrol)}.`;
  if ((basamak === 2 || basamak === 3) && sonrakiKontrol === '') return 'Hocaya okudu ve Pekişti basamaklarında kontrol günü gerekir.';
  if (basamak === 4 && sonrakiKontrol !== '') return 'Kalıcı basamakta kontrol günü olmaz.';
  return '';
}
function notlarAl(notlar: unknown = []): string[] {
  const hata = notHatasi(notlar);
  if (hata) throw new Error(hata);
  return [...(notlar as string[])];
}
function olayYap(ezber: string, tur: OlayTuru, once: Basamak, sonra: Basamak, tarih: string, ek: { kalite?: Kalite; notlar?: readonly string[]; zorla?: boolean } = {}): EzberOlayi {
  return { ezber, tur, kalite: ek.kalite ?? '', notlar: [...(ek.notlar ?? [])], basamakOnce: once, basamakSonra: sonra, zorla: ek.zorla ?? false, tarih };
}

/** Kontrol günü bugün ya da geçmişte mi (kontrolsüz madde için hayır). */
export function kontrolGeldi(d: OgeDurumu | undefined, bugun: string): boolean {
  return Boolean(d && d.sonrakiKontrol !== '' && d.sonrakiKontrol <= bugun);
}

/** Hocanın dinlemesi. */
export function dinle(onceki: OgeDurumu | undefined, id: string, kalite: Kalite, bugun: string,
  secenek: { notlar?: readonly string[]; zorla?: boolean } = {}): Gecis {
  kimlikDenetle(id);
  gunDenetle(bugun);
  if (!KALITELER.includes(kalite)) throw new Error(`Geçersiz kalite: ${String(kalite)}.`);
  const notlar = notlarAl(secenek.notlar);
  const once: Basamak = onceki?.basamak ?? 0;
  const yaz = (basamak: 1 | 2 | 3 | 4, gun: number, zorla = false): Gecis => ({
    islem: 'yaz',
    durum: { basamak, kalite, notlar, sonrakiKontrol: gun ? tarihEkle(bugun, gun) : '', surum: (onceki?.surum ?? 0) + 1 },
    olay: olayYap(id, 'dinleme', once, basamak, bugun, { kalite, notlar, zorla }),
  });
  if (kalite === 'tekrar') return yaz(Math.max(1, once - 1) as 1 | 2 | 3, TEKRAR_GUN);
  if (once <= 1) return yaz(2, PEKISME_GUN);
  const geldi = kontrolGeldi(onceki, bugun);
  if (once === 4 || (!geldi && !secenek.zorla)) return { islem: 'olay', olay: olayYap(id, 'dinleme', once, once, bugun, { kalite, notlar }) };
  return once === 2 ? yaz(3, KALICILIK_GUN, !geldi) : yaz(4, 0, !geldi);
}

/** Hocanın «çalışmaya başla» ataması; kaydı olan maddeye dokunmaz (`null`). */
export function ata(onceki: OgeDurumu | undefined, id: string, bugun: string): Gecis | null {
  kimlikDenetle(id);
  gunDenetle(bugun);
  if (onceki) return null;
  return { islem: 'yaz', durum: { basamak: 1, kalite: '', notlar: [], sonrakiKontrol: '', surum: 1 }, olay: olayYap(id, 'atama', 0, 1, bugun) };
}

/**
 * Tablodan elle basamak seçimi için hedef: kontrol günü basamaktan türer (1 ve 4 kontrolsüz, 2 +7, 3 +30); son
 * dinlemenin kalitesi ve notu korunur. 0 = kaydı kaldır (`null`).
 */
export function elleBasamak(basamak: Basamak, onceki: OgeDurumu | undefined, bugun: string): Hedef | null {
  gunDenetle(bugun);
  if (basamak === 0) return null;
  if (basamak !== 1 && basamak !== 2 && basamak !== 3 && basamak !== 4) throw new Error(`Basamak 0–4 olmalı: ${String(basamak)}.`);
  const gun = basamak === 2 ? PEKISME_GUN : basamak === 3 ? KALICILIK_GUN : 0;
  return { basamak, kalite: onceki?.kalite ?? '', notlar: [...(onceki?.notlar ?? [])], sonrakiKontrol: gun ? tarihEkle(bugun, gun) : '' };
}

/** Elle düzeltme ve geri alma: hedef aynen yazılır; `null` kaydı kaldırır. Değişiklik yoksa `null`. */
export function duzelt(onceki: OgeDurumu | undefined, id: string, hedef: Hedef | null, bugun: string): Gecis | null {
  kimlikDenetle(id);
  gunDenetle(bugun);
  const once: Basamak = onceki?.basamak ?? 0;
  if (hedef === null) return onceki ? { islem: 'sil', olay: olayYap(id, 'duzeltme', once, 0, bugun) } : null;
  const hata = hedefHatasi(hedef as unknown as Record<string, unknown>);
  if (hata) throw new Error(hata);
  const notlar = [...hedef.notlar];
  if (onceki && onceki.basamak === hedef.basamak && onceki.kalite === hedef.kalite && onceki.sonrakiKontrol === hedef.sonrakiKontrol
    && onceki.notlar.length === notlar.length && onceki.notlar.every((n, i) => n === notlar[i])) return null;
  return {
    islem: 'yaz',
    durum: { basamak: hedef.basamak, kalite: hedef.kalite, notlar, sonrakiKontrol: hedef.sonrakiKontrol, surum: (onceki?.surum ?? 0) + 1 },
    olay: olayYap(id, 'duzeltme', once, hedef.basamak, bugun),
  };
}

/**
 * Eski hoca ekranı durumunun yeni basamağı (27 Eylül 2026 kararı): `ogrendi` → Hocaya okudu (kontrol +7 gün; Pekişti
 * yeniden dinlemeyle gelir) · `tekrar` → Çalışıyor · `baslamadi` → kayıt açılmaz.
 */
export function gecisDurumu(eski: EskiDurum, id: string, bugun: string): Gecis | null {
  kimlikDenetle(id);
  gunDenetle(bugun);
  if (eski === 'baslamadi') return null;
  if (eski !== 'ogrendi' && eski !== 'tekrar') throw new Error(`Tanınmayan eski durum: ${String(eski)}.`);
  const basamak = eski === 'ogrendi' ? 2 : 1;
  return {
    islem: 'yaz',
    durum: { basamak, kalite: '', notlar: [], sonrakiKontrol: basamak === 2 ? tarihEkle(bugun, PEKISME_GUN) : '', surum: 1 },
    olay: olayYap(id, 'gecis', 0, basamak, bugun),
  };
}

/** Firestore'dan gelen tek madde; bozuk ya da tutarsızsa `null`. Sunucu alanları (`son`) taşınmaz. */
export function ogeDurumuOku(x: unknown): OgeDurumu | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  if (hedefHatasi(o) || !Number.isInteger(o.surum) || (o.surum as number) < 1) return null;
  return { basamak: o.basamak as OgeDurumu['basamak'], kalite: o.kalite as OgeDurumu['kalite'], notlar: [...(o.notlar as string[])],
    sonrakiKontrol: o.sonrakiKontrol as string, surum: o.surum as number };
}

const OLAY_TURLERI: readonly OlayTuru[] = Object.freeze(['atama', 'dinleme', 'duzeltme', 'gecis'] as const);
const basamakMi = (v: unknown): v is Basamak => v === 0 || v === 1 || v === 2 || v === 3 || v === 4;

/** `ezberDurum/{ref}/olaylar` belgesi; bozuk ya da katalog dışıysa `null`. Sunucu zamanı taşınmaz. */
export function olayOku(x: unknown): EzberOlayi | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  if (typeof o.ezber !== 'string' || !ezberBul(o.ezber) || !OLAY_TURLERI.includes(o.tur as OlayTuru)) return null;
  if ((o.kalite !== '' && !KALITELER.includes(o.kalite as Kalite)) || notHatasi(o.notlar)) return null;
  if (!basamakMi(o.basamakOnce) || !basamakMi(o.basamakSonra) || typeof o.zorla !== 'boolean' || !gunGecerli(o.tarih)) return null;
  return { ezber: o.ezber, tur: o.tur as OlayTuru, kalite: o.kalite as Kalite | '', notlar: [...(o.notlar as string[])],
    basamakOnce: o.basamakOnce, basamakSonra: o.basamakSonra, zorla: o.zorla, tarih: o.tarih as string };
}

/** `ezberDurum/{ref}` belgesinin maddeleri: katalog dışı ve bozuk maddeler düşer (ekran çökmez). */
export function ezberDurumuOku(veri: unknown): Record<string, OgeDurumu> {
  const sonuc: Record<string, OgeDurumu> = {};
  const ogeler = veri && typeof veri === 'object' ? (veri as { ogeler?: unknown }).ogeler : undefined;
  if (!ogeler || typeof ogeler !== 'object' || Array.isArray(ogeler)) return sonuc;
  for (const [id, x] of Object.entries(ogeler)) {
    const d = ezberBul(id) ? ogeDurumuOku(x) : null;
    if (d) sonuc[id] = d;
  }
  return sonuc;
}

const siraDizini = new Map(SEVIYE_SIRASI.flatMap((s) => seviyeOgeleri(s)).map((o, i) => [o.id, i]));
/** Kataloğun okunma sırasındaki yer (şerit, sonra sıra); katalog dışı kimlik en sona. */
export function katalogSirasi(id: string): number {
  return siraDizini.get(id) ?? Number.MAX_SAFE_INTEGER;
}

/** Kontrol günü gelmiş maddeler: en eski kontrol önce, eşitlikte katalog sırası. Kalıcı ve kontrolsüz olanlar yok. */
export function kontrolSirasi(ogeler: Readonly<Record<string, OgeDurumu>>, bugun: string): string[] {
  gunDenetle(bugun);
  return Object.entries(ogeler)
    .filter(([id, d]) => siraDizini.has(id) && d.basamak < 4 && kontrolGeldi(d, bugun))
    .sort(([a, x], [b, y]) => x.sonrakiKontrol.localeCompare(y.sonrakiKontrol) || katalogSirasi(a) - katalogSirasi(b))
    .map(([id]) => id);
}

/** Ödül ve kilim bölmesi: her şerit (1–8, kenar) ve durağı olan şeridin durakları (Amme: 8.1–8.5). */
export interface Bolum {
  readonly anahtar: string;
  readonly seviye: Seviye;
  readonly durak?: number;
  /** Kenar suyu seviye dışıdır: ödülü yok. */
  readonly odullu: boolean;
  readonly ogeler: readonly string[];
}
export interface BolumOzeti {
  readonly bolum: Bolum;
  /** Basamak başına madde sayısı (0 = kaydı yok). */
  readonly sayilar: readonly [number, number, number, number, number];
  readonly rozet: boolean;
  readonly sertifika: boolean;
  readonly altin: boolean;
}

export function bolumler(katalog: Katalog = KATALOG): Bolum[] {
  const sonuc: Bolum[] = [];
  for (const seviye of SEVIYE_SIRASI) {
    const ogeler = seviyeOgeleri(seviye, katalog);
    const odullu = seviye !== 'kenar';
    sonuc.push({ anahtar: String(seviye), seviye, odullu, ogeler: ogeler.map((o) => o.id) });
    const duraklar = [...new Set(ogeler.flatMap((o) => (o.durak === undefined ? [] : [o.durak])))].sort((a, b) => a - b);
    for (const durak of duraklar)
      sonuc.push({ anahtar: `${seviye}.${durak}`, seviye, durak, odullu, ogeler: ogeler.filter((o) => o.durak === durak).map((o) => o.id) });
  }
  return sonuc;
}

/** Kapsama: aynı sûrede âyet aralığı başka bir maddenin aralığı içinde kalan madde (bugün yalnız s-alak-1-5 ⊂ s-alak). */
const kapsayanlar = new Map<string, string[]>();
for (const a of KATALOG.ogeler)
  for (const b of KATALOG.ogeler) {
    if (a === b || !a.kuran || !b.kuran || a.kuran.sure !== b.kuran.sure) continue;
    const [a1, a2] = a.kuran.ayetler;
    const [b1, b2] = b.kuran.ayetler;
    if (b1 <= a1 && a2 <= b2 && (b1 !== a1 || b2 !== a2)) kapsayanlar.set(a.id, [...(kapsayanlar.get(a.id) ?? []), b.id]);
  }
export function kapsayanMaddeler(id: string): readonly string[] {
  return kapsayanlar.get(id) ?? [];
}
/**
 * Ekranda gösterilen basamak: maddenin kendi basamağı ile onu kapsayan maddelerin (bütün sûre) en yükseği. Türetilir,
 * yazılmaz; tersi geçerli değildir (sûrenin ilk beş âyeti bütün sûreyi göstermez). Kontrol sırası yalnız kayda bakar.
 */
export function gorunenBasamak(ogeler: Readonly<Record<string, OgeDurumu>>, id: string): Basamak {
  let b: Basamak = Object.hasOwn(ogeler, id) ? ogeler[id].basamak : 0;
  for (const k of kapsayanMaddeler(id)) if (Object.hasOwn(ogeler, k) && ogeler[k].basamak > b) b = ogeler[k].basamak;
  return b;
}

/** Onaylı eşikler: rozet tümü ≥ 2 · sertifika tümü ≥ 3 · altın kenar tümü 4 (gösterilen basamakla). */
export function bolumOzeti(bolum: Bolum, ogeler: Readonly<Record<string, OgeDurumu>>): BolumOzeti {
  const basamak = (id: string): Basamak => gorunenBasamak(ogeler, id);
  const sayilar: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const id of bolum.ogeler) sayilar[basamak(id)]++;
  const tumu = (esik: number) => bolum.odullu && bolum.ogeler.length > 0 && bolum.ogeler.every((id) => basamak(id) >= esik);
  return { bolum, sayilar, rozet: tumu(2), sertifika: tumu(3), altin: tumu(4) };
}

export function bolumOzetleri(ogeler: Readonly<Record<string, OgeDurumu>>, katalog: Katalog = KATALOG): BolumOzeti[] {
  return bolumler(katalog).map((b) => bolumOzeti(b, ogeler));
}
