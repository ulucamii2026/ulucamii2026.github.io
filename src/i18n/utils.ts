import { ui, varsayilanDil, yollar, type Dil, type Anahtar, type SayfaAnahtari } from './ui';

export const dilListesi: Dil[] = ['tr', 'fr', 'en'];

export function dilBul(url: URL): Dil {
  const [, seg] = url.pathname.split('/');
  return (seg === 'fr' || seg === 'tr' || seg === 'en') ? seg : varsayilanDil;
}

export function ceviri(dil: Dil) {
  return function t(anahtar: Anahtar): string {
    return ui[dil][anahtar] ?? ui[varsayilanDil][anahtar] ?? anahtar;
  };
}

/** Yerel sayfa URL'si üretir: yol('fr','bagis') → /fr/don/ */
export function yol(dil: Dil, sayfa: SayfaAnahtari, alt?: string): string {
  const seg = yollar[sayfa][dil];
  const parca = [dil, seg, alt].filter(Boolean).join('/');
  return `/${parca}/`.replace(/\/+/g, '/');
}

/** Mevcut sayfanın diğer dildeki karşılığı (hreflang/canonical için — parametresiz kanonik adres) */
export function digerDilYolu(url: URL, hedef: Dil): string {
  // /kayit uygulaması 26 Ağustos 2026'dan beri üç dilde üretilir: /kayit/ (TR, afiş QR'ları
  // buna bağlı olduğu için sabit), /kayit/fr/, /kayit/en/. Her dilin gerçek bir adresi var;
  // hreflang artık sorgu parametresine değil ayrı sayfalara işaret ediyor.
  if (url.pathname === '/kayit' || url.pathname.startsWith('/kayit/')) {
    return hedef === 'tr' ? '/kayit/' : `/kayit/${hedef}/`;
  }
  const [, mevcutDil, seg, ...kalan] = url.pathname.split('/').filter(Boolean).length
    ? ['', ...url.pathname.split('/').filter(Boolean)]
    : ['', varsayilanDil];
  const dil = (mevcutDil === 'fr' || mevcutDil === 'tr' || mevcutDil === 'en') ? (mevcutDil as Dil) : varsayilanDil;
  if (!seg) return yol(hedef, 'anasayfa');
  for (const [anahtar, degerler] of Object.entries(yollar) as [SayfaAnahtari, Record<Dil, string>][]) {
    if (degerler[dil] === seg) {
      // koleksiyon alt sayfaları (duyuru/etkinlik slug'ı) dilden bağımsız aynı slug'ı kullanır
      return yol(hedef, anahtar, kalan.join('/') || undefined);
    }
  }
  return yol(hedef, 'anasayfa');
}

/** Dil değiştiricinin (Header) kullandığı gezinme bağlantısı.
    /kayit üç dilde üretildiği için dil değiştirmek artık sayfa değiştirmektir: form da,
    menü de, alt bilgi de tek seferde doğru dile geçer. */
export function dilDegistirYolu(url: URL, hedef: Dil): string {
  return digerDilYolu(url, hedef);
}

/** Site içinden /kayit uygulamasına giden bağlantı — ziyaretçi bulunduğu dilde devam eder.
    Harici bir adres verilmişse (site ayarlarından) dokunulmaz. */
export function kayitBaglantisi(link: string, dil: Dil): string {
  // Bağlantı site ayarlarından gelir ve tam adres olarak yazılmış olabilir
  // (https://www.ulucamii.be/kayit/). İkisini de tanır; başka bir adrese dokunmaz.
  const eslesme = link.match(/^(https?:\/\/[^/]+)?(\/kayit)\/?(?:[?#].*)?$/);
  if (!eslesme) return link;
  const kok = eslesme[1] ?? '';
  return kok + (dil === 'tr' ? '/kayit/' : `/kayit/${dil}/`);
}

export function tarihBicimle(tarih: Date | string, dil: Dil, secenek: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const d = typeof tarih === 'string' ? new Date(tarih) : tarih;
  return new Intl.DateTimeFormat(dil === 'tr' ? 'tr-TR' : dil === 'en' ? 'en-GB' : 'fr-BE', { timeZone: 'Europe/Brussels', ...secenek }).format(d);
}

/** hreflang öznitelik değeri */
export const hreflangKodu = (d: Dil): string => (d === 'tr' ? 'tr' : d === 'en' ? 'en' : 'fr-BE');

/** Arama karşılaştırması için normalizasyon: 'tr' locale ile küçültür, kesme işaretlerini ve
    aksan/diyakritikleri temizler — böylece "İftar" veya "Kur'an" gibi kelimeler ASCII/aksansız
    sorgularla da eşleşir (bkz. src/components/YilFiltresi.astro, DuyuruKarti.astro). */
export function normalizeAra(metin: string): string {
  return metin
    .replace(/['’ʼ]/g, '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
