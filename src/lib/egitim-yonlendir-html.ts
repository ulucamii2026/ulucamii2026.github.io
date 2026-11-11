/**
 * ulucamii.be → egitim.ulucamii.be yönlendirme sayfasının HTML'i (Dilim 4 · P7a). Saf işlev: astro.config.mjs'teki `egitim-yonlendirme` entegrasyonu
 * derleme sonunda eski sayfaların üzerine yazar (lib/egitim-tasima.ts). Sayfa BİLEREK Astro/Base.astro dışıdır: sayaç (GoatCounter), harici betik,
 * stil dosyası, çerez bildirimi, üst/alt bilgi, görsel yok → ağ isteği yok. Neden: eski e-posta bağlantıları adrese `?apiKey=…&oobCode=…&mode=signIn`
 * ekler; bu sorgu bir sayaca ya da üçüncü tarafa gitmemeli. `<meta name="referrer" content="no-referrer">` sorgunun Referer ile sızmasını da keser.
 * Davranış: `location.replace(hedef + location.search + location.hash)` (GitHub Pages 301 veremez). `noindex` + kanonik = egitim adresi.
 * Betiksiz tarayıcı: kamu sayfalarında (kurs, /e/) `<noscript>` meta refresh (sorgu taşımaz; kamu sayfasında önemsiz); hesap sayfalarında (veli, hoca)
 * yalnız bağlantı: sorgu statik HTML'de bilinemez, yarım kalan bir meta refresh oobCode'u düşürürdü.
 * Hesap sayfalarında (`hesap`): bu cihazda eşitlenmemiş yazım varsa (hoca ezber defteri, atölye kuyruğu) yönlendirme durur ve TEK SEFERLİK uyarı çıkar;
 * düğmeye basılınca bayrak yazılır, uyarı bir daha çıkmaz. Firestore'un kendi çevrim dışı kuyruğu (IndexedDB) buradan okunamaz: bilinen sınır.
 * Satır içi betik bilerek: ek istek yok, anında çalışır; tests/tasima-yonlendirme.test.mjs aynı betiği vm içinde çalıştırır.
 */
import type { Dil } from '../i18n/ui';
import { hreflangKodu } from '../i18n/utils';

interface Metin { baslik: string; tasindi: string; git: string; uyBaslik: string; uyMetin: string; uyGec: string; uyBekle: string }
const M: Record<Dil, Metin> = {
  tr: {
    baslik: 'Sayfa taşındı',
    tasindi: 'Bu sayfa yeni adresine taşındı. Yönlendiriliyorsunuz…',
    git: 'Yeni adrese git',
    uyBaslik: 'Bu cihazda gönderilmemiş kayıtlar var',
    uyMetin: 'Adres değiştiği için bu cihazda bekleyen kayıtlar (ezber, çalışma) yeni adresten gönderilemez. Önce yöneticiye haber verin; eski sürüm kısa süreliğine açılıp kayıtlar eşitlenebilir. Yine de devam ederseniz bu kayıtlar yeni adreste görünmez. Bu uyarı bir kez çıkar.',
    uyGec: 'Yine de yeni adrese geç',
    uyBekle: 'Bekle',
  },
  fr: {
    baslik: 'Page déplacée',
    tasindi: 'Cette page a été déplacée à sa nouvelle adresse. Redirection en cours…',
    git: 'Aller à la nouvelle adresse',
    uyBaslik: 'Des enregistrements non envoyés sont présents sur cet appareil',
    uyMetin: 'L’adresse ayant changé, les enregistrements en attente sur cet appareil ne pourront plus être envoyés depuis la nouvelle adresse. Prévenez d’abord l’administrateur : l’ancienne version peut être rouverte brièvement pour tout synchroniser. Si vous continuez quand même, ces enregistrements n’apparaîtront pas à la nouvelle adresse. Cet avertissement n’apparaît qu’une fois.',
    uyGec: 'Continuer quand même',
    uyBekle: 'Attendre',
  },
  en: {
    baslik: 'Page moved',
    tasindi: 'This page has moved to its new address. Redirecting…',
    git: 'Go to the new address',
    uyBaslik: 'This device holds records that have not been sent yet',
    uyMetin: 'Because the address changed, records waiting on this device cannot be sent from the new address. Please tell the administrator first: the old version can be reopened briefly so the records can sync. If you continue anyway, those records will not appear at the new address. This notice appears only once.',
    uyGec: 'Continue anyway',
    uyBekle: 'Wait',
  },
  nl: {
    baslik: 'Pagina verplaatst',
    tasindi: 'Deze pagina is verplaatst naar het nieuwe adres. U wordt doorgestuurd…',
    git: 'Naar het nieuwe adres',
    uyBaslik: 'Op dit toestel staan nog niet verzonden gegevens',
    uyMetin: 'Omdat het adres is gewijzigd, kunnen wachtende gegevens op dit toestel niet meer vanaf het nieuwe adres worden verzonden. Verwittig eerst de beheerder: de oude versie kan kort heropend worden om alles te synchroniseren. Gaat u toch verder, dan verschijnen die gegevens niet op het nieuwe adres. Deze melding verschijnt slechts één keer.',
    uyGec: 'Toch doorgaan',
    uyBekle: 'Wachten',
  },
  de: {
    baslik: 'Seite verschoben',
    tasindi: 'Diese Seite ist unter eine neue Adresse umgezogen. Sie werden weitergeleitet…',
    git: 'Zur neuen Adresse',
    uyBaslik: 'Auf diesem Gerät liegen noch nicht gesendete Einträge',
    uyMetin: 'Da sich die Adresse geändert hat, können wartende Einträge auf diesem Gerät nicht mehr von der neuen Adresse gesendet werden. Bitte informieren Sie zuerst die Verwaltung: Die alte Version kann kurz wieder geöffnet werden, damit alles synchronisiert wird. Wenn Sie trotzdem fortfahren, erscheinen diese Einträge unter der neuen Adresse nicht. Dieser Hinweis erscheint nur einmal.',
    uyGec: 'Trotzdem fortfahren',
    uyBekle: 'Warten',
  },
};

const STIL = `:root { --zemin: #fbf7f0; --yazi: #2a2118; --vurgu: #134420; --kenar: #d9cdb8; }
@media (prefers-color-scheme: dark) { :root { --zemin: #1b1510; --yazi: #f2eadd; --vurgu: #9fd0a8; --kenar: #4a3d2e; } }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; background: var(--zemin); color: var(--yazi); font: 18px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 34rem; text-align: center; }
h1 { font-size: 1.4rem; margin: 0 0 .75rem; }
a.dugme, button { display: inline-block; margin: .5rem .25rem 0; padding: .7rem 1.2rem; border-radius: 8px; border: 2px solid var(--vurgu); background: transparent; color: var(--vurgu); font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; min-height: 44px; }
a.dugme.birincil { background: var(--vurgu); color: var(--zemin); }
#uyari { border: 1px solid var(--kenar); border-radius: 12px; padding: 1rem; text-align: left; }
[hidden] { display: none !important; }`;

const BETIK = `(function () {
  var kok = document.getElementById('yonlendir');
  var hedef = kok.getAttribute('data-hedef');
  var hesap = kok.getAttribute('data-hesap') === '1';
  var son = hedef + location.search + location.hash;
  document.getElementById('git').href = son;
  var BAYRAK = 'ulucamii.tasima.uyari.v1';
  function bekleyenVar() {
    try {
      var d = window.localStorage;
      var liste = ['ulucamii.ezber.bekleyen.v1', 'ulucamii.ezber.kayip.v1'];
      for (var i = 0; i < liste.length; i++) {
        var v = JSON.parse(d.getItem(liste[i]) || '[]');
        if (Array.isArray(v) && v.length) return true;
      }
      for (var k = 0; k < d.length; k++) {
        var ad = d.key(k);
        if (/^ulucamii_ogrenme_v1:.*:bekleyen$/.test(ad)) {
          var o = JSON.parse(d.getItem(ad) || '{}');
          if (o && typeof o === 'object' && Object.keys(o).length) return true;
        }
      }
    } catch (e) { /* Depolama kapalı ya da bozuk: uyarı çıkarılamaz, yönlendir. */ }
    return false;
  }
  function gec() { location.replace(son); }
  var uyarildi = false;
  try { uyarildi = window.localStorage.getItem(BAYRAK) === '1'; } catch (e) { /* yoksay */ }
  if (hesap && !uyarildi && bekleyenVar()) {
    document.getElementById('duz').hidden = true;
    var u = document.getElementById('uyari');
    u.hidden = false;
    var g = document.getElementById('uyari-gec');
    g.href = son;
    g.addEventListener('click', function (e) {
      e.preventDefault();
      try { window.localStorage.setItem(BAYRAK, '1'); } catch (x) { /* yoksay */ }
      gec();
    });
    document.getElementById('uyari-bekle').addEventListener('click', function () { u.hidden = true; document.getElementById('duz').hidden = false; });
  } else {
    gec();
  }
})();`;

export function yonlendirmeSayfasi(hedef: string, dil: Dil, hesap: boolean): string {
  const m = M[dil];
  return `<!doctype html>
<html lang="${hreflangKodu(dil)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>${m.baslik}</title>
<link rel="canonical" href="${hedef}">
${hesap ? '' : `<noscript><meta http-equiv="refresh" content="0;url=${hedef}"></noscript>\n`}<style>
${STIL}
</style>
</head>
<body>
<main id="yonlendir" data-hedef="${hedef}" data-hesap="${hesap ? '1' : '0'}">
<div id="duz">
<h1>${m.baslik}</h1>
<p>${m.tasindi}</p>
<p><a id="git" class="dugme birincil" href="${hedef}">${m.git}</a></p>
</div>
${hesap ? `<div id="uyari" role="alert" hidden>
<h1>${m.uyBaslik}</h1>
<p>${m.uyMetin}</p>
<p><a id="uyari-gec" class="dugme" href="${hedef}">${m.uyGec}</a> <button id="uyari-bekle" type="button">${m.uyBekle}</button></p>
</div>
` : ''}</main>
<script>
${BETIK}
</script>
</body>
</html>
`;
}
