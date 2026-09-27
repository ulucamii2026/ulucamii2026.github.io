// Kök (/) dil yönlendirmesi: (1) bu platformda en son seçilen dil (dil.ts yazar), (2) tarayıcının dil sırası,
// (3) hiçbiri tutmazsa İngilizce. Dil listesi sayfanın `data-diller` özniteliğinden gelir. Dış dosya olarak çıkar
// (satır içi betik yok): Hosting'deki CSP `script-src 'self'` başka izin istemez. JS kapalıysa sayfadaki meta refresh
// Türkçe'ye gider.
const diller = (document.documentElement.dataset.diller ?? '').split(' ').filter(Boolean);
let hedef: string | null = null;
try {
  const kayitli = localStorage.getItem('ulucamiiEgitimDili');
  if (kayitli && diller.includes(kayitli)) hedef = kayitli;
} catch {
  /* gizli sekme ya da depolama kapalı: tarayıcı diline düş */
}
if (!hedef) {
  const istenen = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  hedef = istenen.map((kod) => String(kod).toLowerCase().slice(0, 2)).find((kod) => diller.includes(kod)) ?? null;
}
location.replace(`/${hedef ?? 'en'}/`);

// Modül: üst düzey adlar öbür sayfa betikleriyle (ör. seritler.ts `hedef`) ortak kapsama düşmesin.
export {};
