/**
 * İlim Yolu oturum köprüsünün ortak parçası (2 Kasım 2026; docs/ILIM-YOLU.md «Durum» — arayüz kuralları). Her sayfa betiği oturumu buradan öğrenir;
 * Firebase ANONİM sayfada hiç inmez: `gerekirseYukle()` oturum işareti (hesap/isaret.ts) yoksa `null` döner ve burada hiçbir şey indirilmez.
 *
 *  - `oturumDurumu()`: işaret varsa Firebase'i yükler, saklı oturumu bekler, işareti Auth durumuna uydurur (`oturumHazir`) ve `{ f, k }` döner;
 *    oturum kendiliğinden düşmüşse (işaret kalkar, `<html data-oturum>` kalkar) `null`. Sayfa başına bir kez.
 *  - `acilisEsitlemesi()`: sayfa açılışında cihaz kopyasını bulutla birleştirir (`esitle`), sekme görünür/gizli olunca eşitlemeyi başlatır
 *    (`esitlemeyiBaslat`) ve `sonGirisYaz` ile günde bir kez `sonGiris` damgasını atar. Sayfa başına bir kez; sonucu bekleyen sayfa (ana sayfa)
 *    bulutta yeni bir şey çıkmışsa kendini yeniden çizer.
 *  - `adiGoster()`: üst bilgideki «Hesabım» düğmesine kullanıcı adını yazar (adı bilen sayfa çağırır; ek okuma yapmaz).
 */
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { gerekirseYukle, type IlimFirebase } from '../lib/firebase-istemci';
import { esitle, esitlemeyiBaslat, type EsitlemeSonucu } from '../lib/hesap/esitle';
import { oturumHazir, type Kullanici } from '../lib/hesap/oturum';
import { sonGirisYaz } from '../lib/hesap/profil';

export interface OturumDurumu {
  readonly f: IlimFirebase;
  readonly k: Kullanici;
}

let durumSozu: Promise<OturumDurumu | null> | null = null;
let esitlemeSozu: Promise<EsitlemeSonucu | null> | null = null;

export function oturumDurumu(): Promise<OturumDurumu | null> {
  durumSozu ||= (async () => {
    const f = await gerekirseYukle();
    if (!f) return null;
    const k = await oturumHazir(f);
    if (!k) {
      document.documentElement.removeAttribute('data-oturum');
      return null;
    }
    return { f, k };
  })().catch(() => null);
  return durumSozu;
}

export function acilisEsitlemesi(): Promise<EsitlemeSonucu | null> {
  esitlemeSozu ||= oturumDurumu().then(async (d) => {
    if (!d) return null;
    const sonuc = await esitle(d.f);
    esitlemeyiBaslat(d.f);
    void sonGirisYaz(d.f, { bugun: yerelGun(new Date()) });
    return sonuc;
  }).catch(() => null);
  return esitlemeSozu;
}

/** Üst bilgideki hesap düğmesi: «@ad» (ekranda) ve «Hesabım: @ad» (erişilebilir ad). */
export function adiGoster(ad: string): void {
  const dugme = document.querySelector<HTMLElement>('[data-kisi]');
  if (!dugme || !ad) return;
  const metin = dugme.querySelector<HTMLElement>('[data-kisi-ad]');
  if (metin) metin.textContent = `@${ad}`;
  const sablon = dugme.dataset.sablon;
  if (sablon) dugme.setAttribute('aria-label', sablon.replace('{ad}', ad));
}
