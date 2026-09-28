/**
 * Cami ekranı duyuru görseli adresinin içerik sürümü — YALNIZ derleme anında (src/pages/ekran/akis.json.ts).
 * Bu dosya node:fs ve node:crypto kullanır; ekran paketine (src/ekran/, src/lib/ekran/akis.ts) girmemelidir.
 *
 * Neden: ekranın service worker'ı /media/ görsellerini ÖNBELLEK ÖNCE verir (src/ekran/sw.ts). SW sürüm damgası artık
 * yalnız ekran dosyaları değişince değişir (scripts/ekran-damga.mjs); CMS'te aynı dosya adıyla yeniden yüklenen ya da
 * yerinde yenilenen bir afiş (ör. tarihi düzeltilmiş) aylarca eski hâliyle görünürdü. Akıştaki adres görselin içerik
 * özetiyle (?v=) sürümlenir: yeni bayt → yeni adres → önbellekte yok, ağdan gelir; duyuru anahtarı da değişir, slayt
 * turu yeniden kurulur (src/ekran/veri.ts → duyuruAnahtari). Eski adres SW'de budanır (src/ekran/onbellek.ts).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/** Site içi görselin baytları public/ altından (Astro derlemesi hep proje kökünde çalışır, src/lib/gorsel.ts ile
 *  aynı kök); bulunamazsa ya da yol public/ dışına çıkıyorsa null. */
export function publicDosyasi(yol: string): Uint8Array | null {
  const kok = resolve(process.cwd(), 'public');
  const dosya = resolve(kok, '.' + yol);
  if (dosya.indexOf(kok + sep) !== 0) return null;
  try {
    return readFileSync(dosya);
  } catch {
    return null;
  }
}

/** Site içi (`/` ile başlayan) görsel adresine `?v=<baytların SHA-256'sının ilk 8 hanesi>` ekler; var olan sorgu
 *  korunur (`&v=`). Dış adres (`https://`, `//`), bulunamayan dosya ve boş değer olduğu gibi döner — derleme
 *  hiçbir durumda bozulmaz, en kötü ihtimalle eski davranış sürer. */
export function gorselSurumu(gorsel: string | undefined, oku: (yol: string) => Uint8Array | null = publicDosyasi): string | undefined {
  if (!gorsel || gorsel.charAt(0) !== '/' || gorsel.charAt(1) === '/' || gorsel.indexOf('#') >= 0) return gorsel;
  const bayt = oku(gorsel.split('?')[0]);
  if (!bayt) return gorsel;
  const ozet = createHash('sha256').update(bayt).digest('hex').slice(0, 8);
  return gorsel + (gorsel.indexOf('?') >= 0 ? '&' : '?') + 'v=' + ozet;
}
