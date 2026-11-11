/* Dinleme sayfaları: ecouter.css çalar denetimlerini yalnız html.js varken gösterir (betiksizde <noscript> yedeği). Ana sitede bu sınıfı Base.astro koyar; egitim'de sıkı CSP satır içi betiğe izin vermez, bu yüzden boyamadan önce çalışan küçük dış betik. */
document.documentElement.classList.add('js');
