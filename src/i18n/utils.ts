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
  // /kayit dil öneksiz gömülü kayıt uygulamasıdır: kanonik adresi tek ve parametresizdir.
  // TR kanonik adresin kendisi; FR ve EN kendi dil parametreleriyle ayrışır (aksi hâlde iki
  // hreflang aynı adresi gösterir ve arama motoru ikisini de yok sayar).
  if (url.pathname === '/kayit' || url.pathname.startsWith('/kayit/')) {
    return hedef === 'tr' ? '/kayit/' : `/kayit/?lang=${hedef}`;
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
    /kayit gömülü uygulaması dilini localStorage'da tutar; parametresiz açılırsa önceki tercih
    galip gelir ve "Türkçe" seçen veli Fransızca form görür. Bu yüzden dil değiştirici HER dil
    için açık ?lang= verir — URL tercihi ezmeli. Form üç dili de bilir (tr/fr/en).
    hreflang farklı davranır (TR'de kanonik adres): bkz. digerDilYolu. */
export function dilDegistirYolu(url: URL, hedef: Dil): string {
  if (url.pathname === '/kayit' || url.pathname.startsWith('/kayit/')) {
    return `/kayit/?lang=${hedef}`;
  }
  return digerDilYolu(url, hedef);
}

/** Site içinden /kayit uygulamasına giden bağlantı — dil tercihi her zaman açıkça taşınır. */
export function kayitBaglantisi(link: string, dil: Dil): string {
  const ayrac = link.includes('?') ? '&' : '?';
  return `${link}${ayrac}lang=${dil}`;
}

export function tarihBicimle(tarih: Date | string, dil: Dil, secenek: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const d = typeof tarih === 'string' ? new Date(tarih) : tarih;
  return new Intl.DateTimeFormat(dil === 'tr' ? 'tr-TR' : dil === 'en' ? 'en-GB' : 'fr-BE', { timeZone: 'Europe/Brussels', ...secenek }).format(d);
}

/** hreflang öznitelik değeri */
export const hreflangKodu = (d: Dil): string => (d === 'tr' ? 'tr' : d === 'en' ? 'en' : 'fr-BE');
