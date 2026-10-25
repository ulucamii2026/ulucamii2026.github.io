/**
 * Ders günü ezber takvimi (25 Ekim 2026): «Derste bu hafta» bandı, yıllık takvim sayfası ve çalışma sayfasındaki «Derste:» satırı için saf kütüphane.
 * Ekran, ağ ve katalog bilmez; veriyi çağıran verir. Aynı işlevler derleme anında (sayfalar), tarayıcıda (hangi hafta sonu, hangi gün «Bugün»)
 * ve testlerde (tests/ezber-ders-takvimi.test.mjs) çalışır: hafta seçimi bir kez yazılır, üç yerde aynı sonucu verir.
 *
 * Veri akışı: kurs projesi (tek kaynak) → scripts/ezber-ders-takvimi.mjs → src/data/ezber/ders-takvimi-2026-2027.json (bu modül şemasını doğrular)
 * → `dersGunleri` (yıllık plandan hesaplanan «diğer derslerin ezberi» ile birleşir) → sayfalar. Öğreticiye ait alanlar (not, plan konusu, bireysel
 * dinleme) türev dosyaya hiç girmez; bu modül onlara bakmaz.
 *
 * Tarihler `YYYY-AA-GG` dizesidir (takvim günü). Saat dilimi yalnız «bugün» hesabında karışır: Brüksel günü (`brukselGunu`); dersler Brüksel'de olur,
 * yurt dışındaki bir cihazda da aynı hafta sonu görünür.
 */

export const DERS_KIPLERI = ['kose', 'plan-ezber', 'tekrar', 'tam-ders'] as const;
export type DersKipi = (typeof DERS_KIPLERI)[number];

/** Takvimdeki bir ezber: kimlik + (varsa) âyet aralığı ya da ezberin kaçıncı bölümü olduğu. */
export interface TakvimMaddesi {
  readonly id: string;
  readonly ayet?: readonly [number, number];
  readonly bolum?: number;
}

/** Türev dosyadaki gün (src/data/ezber/ders-takvimi-2026-2027.json). Boş liste yazılmaz. */
export interface TakvimGunu {
  readonly tarih: string;
  readonly gun: string;
  readonly kip: DersKipi;
  readonly yeni?: readonly TakvimMaddesi[];
  readonly pekistir?: readonly TakvimMaddesi[];
  readonly dinleme?: readonly TakvimMaddesi[];
  readonly plan?: readonly string[];
  readonly kalici?: readonly string[];
}
export interface TakvimVerisi {
  readonly kaynak: string;
  readonly kaynakSha256: string;
  readonly uretim: string;
  readonly gunler: readonly TakvimGunu[];
}

/** Ekrandaki gruplar ve sırası: yeni ezber · pekiştirme · dinleme · tekrar ve kalıcı tur · dersin ezberi (plan) · diğer derslerin ezberi. */
export const GRUP_SIRASI = ['yeni', 'pekistir', 'dinleme', 'kalici', 'plan', 'diger'] as const;
export type GrupKodu = (typeof GRUP_SIRASI)[number];
export type Gruplar = Partial<Record<GrupKodu, readonly TakvimMaddesi[]>>;

/** Sayfaların kullandığı gün: türev gün + yıllık plandan gelen «diğer derslerin ezberi», hepsi aynı madde biçiminde. */
export interface DersGunu {
  readonly tarih: string;
  readonly gun: string;
  readonly kip: DersKipi;
  readonly gruplar: Gruplar;
}

/** Aynı hafta sonuna ait ders günleri. `ilk` ve `son` dâhil. */
export interface HaftaSonu<G = DersGunu> {
  readonly ilk: string;
  readonly son: string;
  readonly gunler: readonly G[];
}
/** Hafta seçimi yalnız aralığa bakar: sayfadaki hazır DOM'dan (yalnız tarih öznitelikleri) da seçim yapılabilsin diye. */
export interface HaftaAraligi { readonly ilk: string; readonly son: string }

/** İki ders günü arası en çok bu kadar gün olursa aynı hafta sonudur (Cumartesi → Pazar → bayram/tatil Pazartesisi: fark ≤ 2). */
export const HAFTA_SONU_BOSLUGU = 2;

const TARIH = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Gerçek takvim günü mü (örn. «2026-02-30» değil). */
export const tarihMi = (s: unknown): s is string => typeof s === 'string' && TARIH.test(s) && gunEkle(s, 0) === s;

/** `tarih` + `n` gün (UTC takvimi; yaz saati kaymaz). */
export function gunEkle(tarih: string, n: number): string {
  const [, y, a, g] = TARIH.exec(tarih) ?? [];
  return new Date(Date.UTC(Number(y), Number(a) - 1, Number(g) + n)).toISOString().slice(0, 10);
}

/** `son` − `bas` gün sayısı. */
export function gunFarki(bas: string, son: string): number {
  const gun = (s: string) => {
    const [, y, a, g] = TARIH.exec(s) ?? [];
    return Date.UTC(Number(y), Number(a) - 1, Number(g));
  };
  return Math.round((gun(son) - gun(bas)) / 86_400_000);
}

/** Brüksel takvim günü (YYYY-AA-GG): cihazın saat dilimi ne olursa olsun dersin yapıldığı yerin günü. */
export function brukselGunu(simdi: Date = new Date()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(simdi).map(({ type, value }) => [type, value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/** Tarih biçimleri: öğlen UTC'den kurulur, Brüksel saat dilimiyle yazılır (gün hiçbir saat diliminde kaymaz). */
const ogle = (t: string) => new Date(`${t}T12:00:00Z`);
const bicim = (yerel: string, secenek: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(yerel, { timeZone: 'Europe/Brussels', ...secenek });
const buyuk = (s: string, yerel: string) => (s ? s[0].toLocaleUpperCase(yerel) + s.slice(1) : s);

/** «Cumartesi 24 Ekim» / «Saturday 24 October» (sayfa dilinin yerel kodu; ilk harf büyük). */
export function gunYaz(tarih: string, yerel: string): string {
  return buyuk(bicim(yerel, { weekday: 'long', day: 'numeric', month: 'long' }).format(ogle(tarih)), yerel);
}
/** «24 Ekim» (haftanın günü olmadan). */
export function gunKisa(tarih: string, yerel: string): string {
  return bicim(yerel, { day: 'numeric', month: 'long' }).format(ogle(tarih));
}
/** «Ekim 2026» (ay başlığı). */
export function ayYaz(tarih: string, yerel: string): string {
  return buyuk(bicim(yerel, { month: 'long', year: 'numeric' }).format(ogle(tarih)), yerel);
}
/** «24–26 Ekim» / «31 Ekim – 1 Kasım»; tek günlük hafta sonunda «15 Mayıs». */
export function aralikYaz(ilk: string, son: string, yerel: string): string {
  const f = bicim(yerel, { day: 'numeric', month: 'long' });
  return ilk === son ? f.format(ogle(ilk)) : f.formatRange(ogle(ilk), ogle(son));
}

/** Ay anahtarı: «2026-10». */
export const ayAnahtari = (tarih: string): string => tarih.slice(0, 7);

/**
 * Yıllık plandan «diğer derslerin ezberi»: ders günü → katalog kimlikleri. Yalnız Kur'an dışı derslerin (`kod !== 'kuran'`) `ezber` dizeleri alınır;
 * Kur'an dersinin plan ezberi zaten ezber köşesi planındaki `plan` listesidir. Kimlik eşlemesi `planKimlikleri` (katalog.ts) ile; sıra planın sırası,
 * yineleme yok.
 */
export function digerDersEzberi(
  plan: { readonly gunler: readonly { readonly tarih: string; readonly dersler?: readonly { readonly kod?: string; readonly ezber?: readonly string[] }[] }[] },
  planKimlikleri: (planMetni: string) => readonly string[],
): Record<string, string[]> {
  const sonuc: Record<string, string[]> = {};
  for (const gun of plan.gunler) {
    const idler: string[] = [];
    for (const ders of gun.dersler ?? []) {
      if (ders.kod === 'kuran') continue;
      for (const metin of ders.ezber ?? []) for (const id of planKimlikleri(metin)) if (!idler.includes(id)) idler.push(id);
    }
    if (idler.length) sonuc[gun.tarih] = idler;
  }
  return sonuc;
}

/**
 * Türev günleri ekran gününe çevirir. `diger`: ders günü → kimlikler (`digerDersEzberi`); o günün ezber köşesi listelerinde (yeni, pekiştirme, dinleme,
 * plan, kalıcı) zaten geçen kimlik «diğer» grubuna YAZILMAZ (aynı ezber aynı günde iki kez görünmesin). Bu işlev yeni gün uydurmaz: planda ders olup
 * türev dosyada olmayan günler (ör. bayram tatili) listeye girmez.
 */
export function dersGunleri(veri: TakvimVerisi, diger: Readonly<Record<string, readonly string[]>> = {}): DersGunu[] {
  return veri.gunler.map((g) => {
    const gruplar: { -readonly [K in GrupKodu]?: readonly TakvimMaddesi[] } = {};
    if (g.yeni?.length) gruplar.yeni = g.yeni;
    if (g.pekistir?.length) gruplar.pekistir = g.pekistir;
    if (g.dinleme?.length) gruplar.dinleme = g.dinleme;
    if (g.kalici?.length) gruplar.kalici = g.kalici.map((id) => ({ id }));
    if (g.plan?.length) gruplar.plan = g.plan.map((id) => ({ id }));
    const kose = new Set(Object.values(gruplar).flatMap((l) => l.map((x) => x.id)));
    const digerIdler = (diger[g.tarih] ?? []).filter((id) => !kose.has(id));
    if (digerIdler.length) gruplar.diger = digerIdler.map((id) => ({ id }));
    // Anahtar sırası GRUP_SIRASI olsun (JSON'a yazılırken de okunur kalır).
    const sirali: { -readonly [K in GrupKodu]?: readonly TakvimMaddesi[] } = {};
    for (const k of GRUP_SIRASI) if (gruplar[k]) sirali[k] = gruplar[k];
    return { tarih: g.tarih, gun: g.gun, kip: g.kip, gruplar: sirali };
  });
}

/** Ders günlerini hafta sonlarına böler (artan tarih sırası bekler; aralarında `bosluk` günden fazla boşluk yeni hafta sonu başlatır). */
export function haftaSonlari(gunler: readonly DersGunu[], bosluk: number = HAFTA_SONU_BOSLUGU): HaftaSonu[] {
  const haftalar: DersGunu[][] = [];
  for (const g of gunler) {
    const son = haftalar[haftalar.length - 1];
    if (son && gunFarki(son[son.length - 1].tarih, g.tarih) <= bosluk) son.push(g);
    else haftalar.push([g]);
  }
  return haftalar.map((gunlerListesi) => ({ ilk: gunlerListesi[0].tarih, son: gunlerListesi[gunlerListesi.length - 1].tarih, gunler: gunlerListesi }));
}

/**
 * Bugün (Brüksel günü) için gösterilecek hafta sonu: bugünü kapsayan hafta sonu, yoksa sıradaki. Bugün son hafta sonundan sonraysa `null`
 * (dersler bitti). Liste artan ve çakışmasız olmalı.
 */
export function haftaBul<T extends HaftaAraligi>(haftalar: readonly T[], bugun: string): { readonly hafta: T; readonly simdi: boolean } | null {
  const hafta = haftalar.find((h) => h.son >= bugun);
  return hafta ? { hafta, simdi: hafta.ilk <= bugun } : null;
}

/** Maddenin takvimde geçtiği günler ve o günkü gruplar (artan tarih, gruplar GRUP_SIRASI sırasında, tekil). */
export interface MaddeGunu { readonly tarih: string; readonly gruplar: readonly GrupKodu[] }
export function maddeTarihleri(gunler: readonly DersGunu[], id: string): MaddeGunu[] {
  const cikti: MaddeGunu[] = [];
  for (const g of gunler) {
    const kodlar = GRUP_SIRASI.filter((k) => g.gruplar[k]?.some((x) => x.id === id));
    if (kodlar.length) cikti.push({ tarih: g.tarih, gruplar: kodlar });
  }
  return cikti;
}
/** Bugün ya da sonraki ilk gün (liste artan sıralı). */
export function sonrakiGun(tarihler: readonly MaddeGunu[], bugun: string): MaddeGunu | null {
  return tarihler.find((t) => t.tarih >= bugun) ?? null;
}

/** Yalnız yapıyı doğrular (dosya elle bozulduysa derleme durur); kimlik kümesi verilirse her kimliğin katalogda olduğu da denetlenir. */
export function takvimDogrula(veri: TakvimVerisi, kimlikler?: ReadonlySet<string>): TakvimVerisi {
  const hata = (m: string): never => { throw new Error(`ders-takvimi: ${m}`); };
  if (!Array.isArray(veri.gunler) || !veri.gunler.length) hata('gunler[] yok');
  let onceki = '';
  for (const g of veri.gunler) {
    if (!tarihMi(g.tarih)) hata(`geçersiz tarih ${String(g.tarih)}`);
    if (g.tarih <= onceki) hata(`${g.tarih}: günler artan ve tekil olmalı`);
    onceki = g.tarih;
    if (!(DERS_KIPLERI as readonly string[]).includes(g.kip)) hata(`${g.tarih}: bilinmeyen kip ${String(g.kip)}`);
    for (const ad of ['yeni', 'pekistir', 'dinleme'] as const) {
      for (const x of g[ad] ?? []) if (!x?.id || (kimlikler && !kimlikler.has(x.id))) hata(`${g.tarih}.${ad}: kimlik ${String(x?.id)} geçersiz`);
    }
    for (const ad of ['plan', 'kalici'] as const) {
      for (const id of g[ad] ?? []) if (!id || (kimlikler && !kimlikler.has(id))) hata(`${g.tarih}.${ad}: kimlik ${String(id)} geçersiz`);
    }
  }
  return veri;
}

// ——— Ekrana yazma yardımcıları (sunucuda sayfa, tarayıcıda band aynı işlevleri kullanır) ———

/** `{ad}` yer tutucularını doldurur. */
export const doldur = (s: string, d: Readonly<Record<string, string | number>>): string => s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));

export interface MaddeEkiMetinleri { readonly ayetTek: string; readonly ayetAralik: string; readonly bolum: string }
/** Madde adının yanına yazılan ek: «1–4. âyetler», «2. bölüm»; ikisi de yoksa boş dize. */
export function maddeEki(x: TakvimMaddesi, m: MaddeEkiMetinleri): string {
  const parcalar: string[] = [];
  if (x.ayet) parcalar.push(x.ayet[0] === x.ayet[1] ? doldur(m.ayetTek, { a: x.ayet[0] }) : doldur(m.ayetAralik, { a: x.ayet[0], b: x.ayet[1] }));
  if (x.bolum) parcalar.push(doldur(m.bolum, { n: x.bolum }));
  return parcalar.join(' · ');
}

/**
 * Giriş sayfasına yazılan yoğun biçim: `id`, `id~a-b`, `id#n`, `id~a-b#n`. Sayfa HTML'ini hafif tutar (her madde bir kısa dize); tarayıcı `coz` ile açar.
 * Kimliklerde `~` ve `#` yoktur (katalog kimlikleri `[a-z0-9-]`).
 */
export function kodla(x: TakvimMaddesi): string {
  return x.id + (x.ayet ? `~${x.ayet[0]}-${x.ayet[1]}` : '') + (x.bolum ? `#${x.bolum}` : '');
}
export function coz(s: string): TakvimMaddesi {
  const m = /^([^~#]+)(?:~(\d+)-(\d+))?(?:#(\d+))?$/.exec(s);
  if (!m) throw new Error(`ders-takvimi: çözülemeyen madde «${s}»`);
  return { id: m[1], ...(m[2] ? { ayet: [Number(m[2]), Number(m[3])] as const } : {}), ...(m[4] ? { bolum: Number(m[4]) } : {}) };
}
