/**
 * Gizlilik metninin İlim Yolu'nu ilgilendiren bölümleri (11 Kasım 2026). TEK KAYNAK `src/content/sayfalar/<dil>/gizlilik.md`: metin kopyalanmaz,
 * egitim'deki `/<dil>/gizlilik/` sayfası bu dosyadan iki dilim keser (egitim/src/content.config.ts yükleyicisi):
 *  - `kontrolcu`: ilk `##` bölümü (veri sorumlusu ve iletişim e-postası);
 *  - `ilim`: `<span id="ezber-kilimi">` çapasından dosya sonuna (İlim Yolu ve Ezber Kilimi bölümü, haklarınız, veri ihlali, şikâyet hakkı).
 * Çapa ya da bölüm yoksa FIRLATIR: kaynak yeniden düzenlenip çapa düşerse egitim derlemesi (ve tests/egitim/gizlilik-bolum.test.mjs) kırmızı olur,
 * sayfa sessizce boş kalmaz.
 */
export const CAPA = '<span id="ezber-kilimi"></span>';

/** Frontmatter'ı atar. */
export function govde(dosya: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(dosya);
  return m ? dosya.slice(m[0].length) : dosya;
}

export function gizlilikBolumleri(dosya: string): { kontrolcu: string; ilim: string } {
  const satirlar = govde(dosya).split(/\r?\n/);
  const ilkBaslik = satirlar.findIndex((s) => s.startsWith('## '));
  if (ilkBaslik < 0) throw new Error('gizlilik: ilk ## bölümü (veri sorumlusu) yok');
  const sonrakiBaslik = satirlar.findIndex((s, i) => i > ilkBaslik && s.startsWith('## '));
  const capa = satirlar.findIndex((s) => s.trim() === CAPA);
  if (capa < 0) throw new Error(`gizlilik: ${CAPA} çapası yok`);
  if (!satirlar.slice(capa).some((s) => s.startsWith('## '))) throw new Error('gizlilik: çapadan sonra ## bölümü yok');
  return {
    kontrolcu: satirlar.slice(ilkBaslik, sonrakiBaslik < 0 ? undefined : sonrakiBaslik).join('\n').trim(),
    ilim: satirlar.slice(capa).join('\n').trim(),
  };
}
