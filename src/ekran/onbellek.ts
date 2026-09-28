/**
 * Cami ekranı service worker'ının saf yardımcıları (src/ekran/sw.ts). sw.ts yan etkilidir (olay dinleyicileri
 * kurar); bu dosya yalnız hesap yapar, birim testle sınanır (tests/ekran-sw.test.mjs). Chromium 70 uyumlu.
 */

/** Kurulumda kabuk dosyasının sürümlü adresi: `u?v=<damga>` (sorgu varsa `&v=`). GitHub Pages'in CDN'i yayından
 *  hemen sonra eski ekran.js'i verebilir; `cache: 'reload'` yalnız tarayıcının HTTP önbelleğini atlar. Sürümlü
 *  adres CDN'de hiç görülmemiş bir adrestir, taze kopya gelir; önbelleğe asıl adresle (`u`) yazılır. */
export function surumluAdres(u: string, surum: string): string {
  return u + (u.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(surum);
}

/** Duyuru akışı (/ekran/akis.json) ağdan geldiğinde silinecek önbellek kayıtları: aynı kökende /media/ altında olup
 *  ne kabuk listesinde (logolar) ne de akışın `duyurular[].gorsel` adreslerinde bulunanlar — eski ?v= sürümleri ve
 *  süresi dolmuş duyuruların görselleri. Tam adres (sorgu dâhil) karşılaştırılır. Akış beklenen biçimde değilse
 *  hiçbir şey silinmez (bozuk bir yanıt önbelleği boşaltmamalı). `anahtarlar`: önbellekteki isteklerin tam adresleri. */
export function budanacaklar(anahtarlar: readonly string[], kabuk: readonly string[], akis: unknown, koken: string): string[] {
  const duyurular = akis && typeof akis === 'object' ? (akis as { duyurular?: unknown }).duyurular : undefined;
  if (!Array.isArray(duyurular)) return [];
  const tut = new Set<string>();
  const ekle = (adres: unknown): void => {
    if (typeof adres !== 'string') return;
    try { tut.add(new URL(adres, koken).href); } catch { /* çözülemeyen adres: tutulacak bir kayıt değil */ }
  };
  for (const u of kabuk) ekle(u);
  for (const d of duyurular) if (d && typeof d === 'object') ekle((d as { gorsel?: unknown }).gorsel);
  return anahtarlar.filter((a) => {
    let adres: URL;
    try { adres = new URL(a); } catch { return false; }
    return adres.origin === koken && adres.pathname.indexOf('/media/') === 0 && !tut.has(adres.href);
  });
}
