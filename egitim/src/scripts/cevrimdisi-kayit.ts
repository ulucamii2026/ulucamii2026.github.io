/**
 * Service worker kaydı (25 Ekim 2026, çevrim dışı çalışma): her sayfada, yalnız güvenli bağlamda (https ya da localhost/127.0.0.1) ve üretim
 * derlemesinde (`astro dev` /sw.js üretmez). Sayfa yüklendikten SONRA kaydedilir: ilk boyamayı ve sayfanın kendi isteklerini yavaşlatmaz.
 * Kayıt başarısız olursa (engelli, gizli pencere, eski tarayıcı, dosya yok) sessizce geçilir: sayfa SW'siz tam çalışır, hata gösterilmez.
 * Kapsam `/` (sw.js kökte); HTML `no-cache` olduğundan SW dosyası her gezintide doğrulanır (`updateViaCache: 'none'`).
 */
if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  const kaydet = () => { navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => undefined); };
  if (document.readyState === 'complete') kaydet();
  else window.addEventListener('load', kaydet, { once: true });
}

export {};
