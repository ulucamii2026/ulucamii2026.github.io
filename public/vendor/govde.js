/* Ortak gövde betiği — Header (masaüstü/mobil menü, tema), Lightbox (görsel görüntüleyici)
 * ve sayfa reveal (kaydırma-canlanma) mantığını tek dosyada toplar. Önceden her sayfada
 * satır içi (inline) ve birebir aynı olarak tekrarlanıyordu; tarayıcı bunu tek dosya olarak
 * önbelleğe alsın diye buraya taşındı (performans denetimi, Eylül 2026). Kaynak: Header.astro,
 * Lightbox.astro, Base.astro — davranış birebir aynı, yalnız TS tip anotasyonları kaldırıldı.
 */

/* ---------- Header: mobil menü, tema düğmesi, masaüstü açılır gruplar ---------- */
(function () {
  var dugme = document.getElementById('menu-dugme');
  var menu = document.getElementById('mobil-menu');
  dugme && dugme.addEventListener('click', function () {
    var acik = menu && menu.classList.toggle('hidden') === false;
    dugme.setAttribute('aria-expanded', String(acik));
  });
  var temaDugme = document.getElementById('tema-dugme');
  temaDugme && temaDugme.addEventListener('click', function () {
    var root = document.documentElement;
    var koyu = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var yeni = koyu ? 'light' : 'dark';
    root.dataset.theme = yeni;
    try { localStorage.setItem('tema', yeni); } catch (e) {}
  });
  // Masaüstü açılır gruplar: tıkla/klavye ile aç, dışarı tıklama veya Escape ile kapat, hover ile de açılır
  var gruplar = Array.from(document.querySelectorAll('[data-grup]'));
  var kapatHepsi = function (haric) { gruplar.forEach(function (g) { if (g !== haric) { var b = g.querySelector('button'); var u = g.querySelector('.acilir'); b && b.setAttribute('aria-expanded', 'false'); u && u.classList.add('hidden'); } }); };
  gruplar.forEach(function (g) {
    var b = g.querySelector('button'); var u = g.querySelector('.acilir'); if (!b || !u) return; var zaman = 0; var fareyle = false;
    var ac = function () { kapatHepsi(g); b.setAttribute('aria-expanded', 'true'); u.classList.remove('hidden'); };
    var kapat = function () { b.setAttribute('aria-expanded', 'false'); u.classList.add('hidden'); };
    // fareyle üzerine gelince açılır; o sırada tıklama kapatmaz (klavye/dokunmatik için tıklama aç/kapat yapar)
    b.addEventListener('click', function () { if (fareyle && b.getAttribute('aria-expanded') === 'true') return; b.getAttribute('aria-expanded') === 'true' ? kapat() : ac(); });
    g.addEventListener('mouseenter', function () { clearTimeout(zaman); fareyle = true; ac(); });
    g.addEventListener('mouseleave', function () { fareyle = false; zaman = window.setTimeout(kapat, 180); });
    g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) kapat(); });
  });
  document.addEventListener('click', function (e) { if (!gruplar.some(function (g) { return g.contains(e.target); })) kapatHepsi(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return; kapatHepsi();
    if (menu && !menu.classList.contains('hidden')) { menu.classList.add('hidden'); dugme && dugme.setAttribute('aria-expanded', 'false'); dugme && dugme.focus(); }
  });
})();

/* ---------- Lightbox: sayfa içinde büyük görsel görüntüleyici ---------- */
(function () {
  var dlg = document.getElementById('lightbox');
  var img = document.getElementById('lb-img');
  var cap = document.getElementById('lb-caption');
  var sayac = document.getElementById('lb-sayac');
  var baglar = Array.from(document.querySelectorAll('a[data-lightbox]'));
  if (dlg && img && cap && sayac && baglar.length && typeof dlg.showModal === 'function') {
    var grup = []; var i = 0; var tetik = null;
    var goster = function (k) {
      i = (k + grup.length) % grup.length; var a = grup[i];
      var metin = a.dataset.caption || (a.querySelector('img') && a.querySelector('img').alt) || '';
      img.src = a.href; img.alt = metin; cap.textContent = metin;
      sayac.textContent = grup.length > 1 ? (i + 1) + ' / ' + grup.length : '';
      dlg.dataset.tek = grup.length > 1 ? '0' : '1';
      [grup[(i + 1) % grup.length], grup[(i - 1 + grup.length) % grup.length]].forEach(function (n) { if (n && n !== a) { var p = new Image(); p.src = n.href; } });
    };
    var ac = function (a) {
      var ad = a.dataset.lightbox || ''; grup = baglar.filter(function (b) { return (b.dataset.lightbox || '') === ad; });
      tetik = a; goster(grup.indexOf(a)); dlg.showModal(); document.documentElement.style.overflow = 'hidden';
    };
    dlg.addEventListener('close', function () { document.documentElement.style.overflow = ''; img.removeAttribute('src'); tetik && tetik.focus(); });
    baglar.forEach(function (a) { a.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); ac(a); }); });
    dlg.addEventListener('click', function (e) {
      var t = e.target; var b = t.closest('[data-lb]');
      if (b && b.dataset.lb === 'kapat') dlg.close(); else if (b && b.dataset.lb === 'onceki') goster(i - 1); else if (b && b.dataset.lb === 'sonraki') goster(i + 1);
      else if (t === dlg || t.classList.contains('lb-govde')) dlg.close();
    });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') goster(i - 1); else if (e.key === 'ArrowRight') goster(i + 1); });
    var x0 = 0; dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 48) goster(dx < 0 ? i + 1 : i - 1); });
  }
})();

/* ---------- Bölüm reveal + başlık şeridi: görünür olunca .gorunur ---------- */
(function () {
  // reduced-motion'da CSS zaten devre dışı, JS yalnız sınıfı ekler
  var r = document.querySelectorAll('.reveal, .serit');
  if (r.length) {
    // emniyet: gözlemci ne olursa olsun 2,5 sn içinde her şey görünür
    setTimeout(function () { r.forEach(function (e) { e.classList.add('gorunur'); }); }, 2500);
    if (!('IntersectionObserver' in window)) r.forEach(function (e) { e.classList.add('gorunur'); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('gorunur'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      r.forEach(function (e) { io.observe(e); });
    }
  }
})();
