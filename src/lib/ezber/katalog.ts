/**
 * Ezber Kilimi — tek ezber kataloğu (27 Eylül 2026, Faz 1a).
 * Veri: src/data/ezber/katalog.json (şema katalog.schema.json). Yıllık plandaki serbest ezber dizeleri
 * plan-eslesme.json'da, eski kimlikler (EZBER_LISTESI, seviye testi ez01…, planın eski yazımları) eski-kimlikler.json'da
 * eşlenir; yıllık plan JSON'u elle düzenlenmez. Bu modül ekran ve veritabanı bilmez. Kurallar: docs/EZBER-KILIMI.md.
 * Veri modül yüklenirken derinden dondurulur: ekranlar paylaşılan nesneyi değiştiremez, gerekirse kopya alır.
 */
import type { Dil } from '../../i18n/ui';
import katalogVerisi from '../../data/ezber/katalog.json';
import planEslesme from '../../data/ezber/plan-eslesme.json';
import eskiKimlikler from '../../data/ezber/eski-kimlikler.json';

export type Seviye = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'kenar';
export type EzberTuru = 'sure' | 'dua' | 'bilgi';
export type BesDil = Readonly<Record<Dil, string>>;
/** Katalog maddesi (eski Ezber Odası'nın `EzberOgesi` tipinden ayrı). */
export interface KatalogOgesi {
  readonly id: string;
  readonly tur: EzberTuru;
  readonly seviye: Seviye;
  readonly sira: number;
  /** Yalnız 8. şerit (Amme): 1–5 ara durak (27 Eylül 2026 kararı); rozet ve kilim bölmeleri buna göre. */
  readonly durak?: number;
  readonly ad: BesDil;
  /** Kur'an metni mi (Kur'an'dan olan dualar dahil): yapay ses yasağının ve «yalnız Diyanet» kuralının dayanağı. */
  readonly kuranMetni: boolean;
  readonly kuran?: { readonly sure: number; readonly ayetler: readonly [number, number] };
  readonly ses?: { readonly tam?: string; readonly parcalar?: readonly string[] };
  readonly not?: string;
}
export interface SeviyeTanimi { readonly kimlik: Seviye; readonly ad: BesDil; readonly amac: BesDil }
export interface Katalog { readonly surum: number; readonly seviyeler: readonly SeviyeTanimi[]; readonly ogeler: readonly KatalogOgesi[] }
/** `eskiPlan`: yıllık planın eski yazımları (git geçmişi); boş dizi = bilerek karşılıksız. */
export type EskiKaynak = 'ezberListesi' | 'seviyeTesti' | 'eskiPlan';
type PlanGunu = { tarih: string; dersler?: { ezber?: string[] }[] };

/** Eski hoca ekranı ezber durumları (`ilerleme/{ref}.ezber`), geriden ileriye. Boş değer kayıt sayılmaz. */
export const ESKI_DURUM_SIRASI = Object.freeze(['baslamadi', 'tekrar', 'ogrendi'] as const);
export type EskiDurum = (typeof ESKI_DURUM_SIRASI)[number];
export interface EskiEzberGecisi {
  /** Katalog kimliği → en ileri eski durum (aynı maddeye birden çok plan dizesi düşebilir). */
  durumlar: Record<string, EskiDurum>;
  /** Hiçbir tabloda olmayan anahtarlar: kuru çalıştırma listeler ve durur. */
  eslesmeyen: string[];
  /** `eskiPlan`'da bilerek karşılıksız bırakılanlar: taşınmaz, eski alanda salt okunur kalır. */
  karsiliksiz: string[];
  /** Tanınmayan durum değeri taşıyan anahtarlar: kuru çalıştırma listeler ve durur. */
  bilinmeyenDurum: string[];
}

function dondur<T>(deger: T): T {
  if (deger && typeof deger === 'object' && !Object.isFrozen(deger)) {
    for (const ic of Object.values(deger)) dondur(ic);
    Object.freeze(deger);
  }
  return deger;
}

export const KATALOG = dondur(katalogVerisi) as unknown as Katalog;
export const SEVIYE_SIRASI: readonly Seviye[] = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 'kenar'] as const);

const dizin = new Map(KATALOG.ogeler.map((o) => [o.id, o]));
const planTablosu = dondur(planEslesme) as Readonly<Record<string, readonly string[]>>;
const eskiTablo = dondur(eskiKimlikler) as Readonly<Record<EskiKaynak, Readonly<Record<string, readonly string[]>>>>;

export function ezberBul(id: string): KatalogOgesi | undefined {
  return dizin.get(id);
}

/** Seviyenin maddeleri `sira`ya göre; dönen dizi yeni bir kopyadır. */
export function seviyeOgeleri(seviye: Seviye, katalog: Katalog = KATALOG): KatalogOgesi[] {
  return katalog.ogeler.filter((o) => o.seviye === seviye).sort((a, b) => a.sira - b.sira);
}

export function planKimlikleri(planMetni: string): readonly string[] {
  return Object.hasOwn(planTablosu, planMetni) ? planTablosu[planMetni] : [];
}

export function eskiKimliktenYeni(kaynak: EskiKaynak, eski: string): readonly string[] {
  const tablo = eskiTablo[kaynak] ?? {};
  return Object.hasOwn(tablo, eski) ? tablo[eski] : [];
}

/**
 * Faz 1b geçişinin saf çekirdeği: `ilerleme/{ref}.ezber` (plan dizesi → eski durum) → katalog kimliği → eski durum.
 * Anahtar önce bugünkü planda, sonra planın eski yazımlarında aranır. Yazma yapmaz; eski alan olduğu gibi kalır.
 * Birden çok dize aynı maddeye düşerse en ileri durum alınır: yeni basamaklar (Pekişti ≥ 1 hafta, Kalıcı ≥ 1 ay)
 * yeniden dinlemeyi zaten istediği için fazla tahmin kendiliğinden düzelir; eksik tahmin çocuğun emeğini siler.
 */
export function eskiEzberGecisi(eski: Record<string, unknown>): EskiEzberGecisi {
  const sonuc: EskiEzberGecisi = { durumlar: {}, eslesmeyen: [], karsiliksiz: [], bilinmeyenDurum: [] };
  for (const [anahtar, durum] of Object.entries(eski)) {
    if (durum === '') continue;
    const derece = ESKI_DURUM_SIRASI.indexOf(durum as EskiDurum);
    if (derece < 0) { sonuc.bilinmeyenDurum.push(anahtar); continue; }
    const idler = Object.hasOwn(planTablosu, anahtar) ? planTablosu[anahtar] : Object.hasOwn(eskiTablo.eskiPlan, anahtar) ? eskiTablo.eskiPlan[anahtar] : undefined;
    if (!idler) { sonuc.eslesmeyen.push(anahtar); continue; }
    if (!idler.length) { sonuc.karsiliksiz.push(anahtar); continue; }
    for (const id of idler) {
      const onceki = sonuc.durumlar[id];
      if (!onceki || ESKI_DURUM_SIRASI.indexOf(onceki) < derece) sonuc.durumlar[id] = ESKI_DURUM_SIRASI[derece];
    }
  }
  for (const liste of [sonuc.eslesmeyen, sonuc.karsiliksiz, sonuc.bilinmeyenDurum]) liste.sort();
  return sonuc;
}

/** Katalog kimliği → yıllık planda ilk geçtiği tarih («sınıf hedefi»). Aynı madde birden çok yazımla geçebilir. */
export function sinifHedefleri(plan: { gunler: PlanGunu[] }): Record<string, string> {
  const hedef: Record<string, string> = {};
  for (const gun of plan.gunler)
    for (const ders of gun.dersler ?? [])
      for (const metin of ders.ezber ?? [])
        for (const id of planKimlikleri(metin)) if (!hedef[id] || gun.tarih < hedef[id]) hedef[id] = gun.tarih;
  return hedef;
}
