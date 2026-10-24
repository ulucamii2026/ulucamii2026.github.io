/**
 * Ezber maddesinin metni (Faz 2b, 19 Ekim 2026): Arapça bölümler, Diyanet meâlleri, hoca onaylı okunuş.
 * Veri: src/data/ezber/metin/<id>.json (şema metin.schema.json; Kur'an maddeleri scripts/ezber-metin-cek.mjs ile
 * kuran.diyanet.gov.tr'den birebir gelir). Bu modül saf işlevlerdir; dosyaları sayfa okur (import.meta.glob).
 */
import type { Dil } from '../../i18n/ui';

export interface Bolum { readonly no: number; readonly ar: string; readonly sayfa?: number }
export interface MealGrubu { readonly ayetler: readonly [number, number]; readonly metin: string; readonly duzeltme?: string }
export interface Meal { readonly kaynak: string; readonly inceleme?: boolean; readonly gruplar: readonly MealGrubu[] }
export type OkunusUsulu = 'tr' | 'fr';
export interface MaddeMetni {
  readonly id: string;
  readonly kuran?: { readonly sure: number; readonly ayetler: readonly [number, number] };
  readonly sureAdi?: string;
  readonly bolumler: readonly Bolum[];
  readonly meal: Partial<Record<Dil, Meal>>;
  readonly kaynak: { readonly ar: string; readonly url: string; readonly alindi: string };
  readonly okunus?: Partial<Record<OkunusUsulu, readonly { readonly no: number; readonly metin: string }[]>>;
  readonly zor: readonly { readonly bolum: number; readonly kelime: string; readonly not?: string }[];
  /** Dua metinleri: Diyanet portalındaki kusurlu harekeleme/yazımın düzeltmeleri (scripts/ezber-dua-tanim.mjs). */
  readonly duzeltmeler?: readonly { readonly bul: string; readonly yerine: string; readonly neden: string }[];
  readonly onay: null | { readonly tarih: string; readonly kapsam: readonly string[] };
}

/** Sayfada gösterilecek blok: bir meâl grubunun âyetleri; sayfa dilinde meâl yoksa bütün metin tek blok. */
export interface MetinBlogu {
  readonly ayetler: readonly [number, number];
  readonly bolumler: readonly Bolum[];
  readonly meal?: string;
  readonly okunus?: readonly { readonly no: number; readonly metin: string }[];
}

/**
 * Sayfa dilinin meâli. Yalnız kaynaklı meâl döner. FR: Diyanet'in Chiadmi çevirisi («Le Noble Coran», DİB 2022; imam
 * kararı 27 Eyl 2026) dijital olarak yayımlanana kadar Hamidullah çevirisi, çevirmen adıyla (24 Eki 2026 kararı,
 * scripts/ezber-meal-fr.mjs); başka FR çeviri gösterilmez. Tek istisna: kitaptan alınan dualarda DİTİB'in resmî Fransızca
 * yayını «Camiye Gidiyorum – Je vais à la mosquée» (scripts/ezber-dua-kitap.mjs; künyesi kitabın Fransızca adını taşır).
 * Diyanet'in meâli olmayan dilde (NL) çeviri `inceleme: true`
 * ile gelir ve sayfa bunu yazar (docs/DIL-NL-DE.md). Meâl yoksa sayfa «yakında» der.
 */
export function sayfaMeali(m: MaddeMetni, dil: Dil): Meal | undefined {
  const meal = m.meal[dil];
  if (dil === 'fr' && meal && !/Chiadmi|Hamidullah|Je vais à la mosquée/.test(meal.kaynak)) return undefined;
  return meal;
}

/**
 * «Anlamla eşleştir» oyununun blokları (Faz 2e): sayfa dilinin meâl grupları, her biri maddenin bölümlerinden bir aralığa
 * ([bas, son) bölüm sırası) bağlı. Oyun yalnız gözden geçirilmiş anlam metniyle kurulur: `inceleme: true` taslak çeviriler
 * (bugün NL) doğru yanıt diye öğretilmez; o dilde ya da meâli olmayan dilde boş döner ve oyun düğmesi hiç çıkmaz.
 * Meâl grubunun bölümleri bulunmuyorsa (veri tutarsızlığı) o grup atlanır.
 */
export function anlamBloklari(m: MaddeMetni, dil: Dil): { bas: number; son: number; meal: string }[] {
  const meal = sayfaMeali(m, dil);
  if (!meal || meal.inceleme) return [];
  return meal.gruplar.flatMap((g) => {
    const sirasi = m.bolumler.flatMap((b, i) => (b.no >= g.ayetler[0] && b.no <= g.ayetler[1] ? [i] : []));
    return sirasi.length && g.metin.trim() ? [{ bas: sirasi[0], son: sirasi[sirasi.length - 1] + 1, meal: g.metin }] : [];
  });
}

/** Okunuşun usulü: Fransızca sayfa Fransızca usulü, öbürleri Türkçe usulü (karar: docs/EKRAN-YOL-HARITASI.md). */
export const okunusUsulu = (dil: Dil): OkunusUsulu => (dil === 'fr' ? 'fr' : 'tr');

/** Okunuş yalnız hocanın onayladığı usulde gösterilir; Latin harfi bazı sesleri karşılamaz, onaysız yazım yerleşir. */
export function onayliOkunus(m: MaddeMetni, dil: Dil) {
  const usul = okunusUsulu(dil);
  return m.onay?.kapsam.includes(`okunus-${usul}`) ? m.okunus?.[usul] : undefined;
}

/**
 * Metni gösterim bloklarına böler: sayfa dilinin meâl gruplarıyla. O dilde meâl yoksa metin mushaftaki gibi tek blokta
 * kesintisiz akar (meâlsiz ayraç bir şey ayırmaz; 40 âyetlik sûre telefonda gereksiz uzar). Dualarda her bölüm ayrı blok.
 */
export function metinBloklari(m: MaddeMetni, dil: Dil): MetinBlogu[] {
  const meal = sayfaMeali(m, dil);
  const ilk = m.bolumler[0].no, son = m.bolumler[m.bolumler.length - 1].no;
  // Kur'an: meâlsiz dilde metin kesintisiz akar. Dualar: her bölüm kendi satırında kalır (bölüm sınırları ezberin sınırlarıdır).
  const gruplar = meal?.gruplar ?? (m.kuran ? [{ ayetler: [ilk, son] as const, metin: '' }] : m.bolumler.map((b) => ({ ayetler: [b.no, b.no] as const, metin: '' })));
  const okunus = onayliOkunus(m, dil);
  return gruplar.map((g) => {
    const icinde = (no: number) => no >= g.ayetler[0] && no <= g.ayetler[1];
    return {
      ayetler: g.ayetler,
      bolumler: m.bolumler.filter((b) => icinde(b.no)),
      ...(meal && { meal: g.metin }),
      ...(okunus && { okunus: okunus.filter((o) => icinde(o.no)) }),
    };
  });
}

/** Âyeti son kelimesinden önce ikiye böler: sayfa son kelimeyi âyet numarasıyla bölünmez tutar, numara satıra tek düşmez. */
export function sonKelimeyiAyir(ar: string): readonly [string, string] {
  const t = ar.trimEnd();
  const i = t.lastIndexOf(' ');
  return [t.slice(0, i + 1), t.slice(i + 1)];
}

const RAKAM = '٠١٢٣٤٥٦٧٨٩';
/** Arap-Hint rakamı (âyet sonu işareti ۝ ile birlikte yazılır: «۝١٢»). */
export const arapcaRakam = (n: number): string => String(n).replace(/\d/g, (r) => RAKAM[Number(r)]);

/** Grup etiketi: «2–4» ya da «5». */
export const aralikYaz = ([a, b]: readonly [number, number]): string => (a === b ? String(a) : `${a}–${b}`);
