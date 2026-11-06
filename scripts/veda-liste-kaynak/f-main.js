/* Ana akış: anahtar, ağ, yenileme, görünüm geçişi, bildirimler, tema, olaylar, açılış. */
let anahtar = '';
try { anahtar = decodeURIComponent(location.hash.replace(/^#/, '')); } catch (_) { anahtar = location.hash.replace(/^#/, ''); }
if (location.hash) { try { history.replaceState(null, '', location.pathname); } catch (_) {} }
if (anahtar) oturumYaz(anahtar); else anahtar = oturumOku();

yeniEsik = sonGorulenOku();
let kayitIdleri = null; let bekleyen = 0; let tikSayac = 0;
const yeniSet = new Set();
const kirli = new Set();

// ---------- Duyuru / toast / başlık ----------
const duyur = (m) => { const d = $('duyuru'); d.textContent = ''; setTimeout(() => { d.textContent = m; }, 30); };
const toast = (metin, aksiyon, sure) => {
  const k = $('gelen-bant'); const t = el('div', 'toast-i'); t.appendChild(el('span', '', metin));
  const kapat = () => { if (t.parentNode) t.parentNode.removeChild(t); if (!k.firstChild) k.hidden = true; };
  if (aksiyon) { const b = el('button', 'd-btn', aksiyon.ad); b.type = 'button'; b.addEventListener('click', () => { aksiyon.islem(); kapat(); }); t.appendChild(b); }
  const x = el('button', 'ikon-btn kucuk'); x.type = 'button'; x.setAttribute('aria-label', 'Kapat'); x.appendChild(ikon('x', 16)); x.addEventListener('click', kapat); t.appendChild(x);
  while (k.children.length >= 3) k.removeChild(k.firstChild);
  k.appendChild(t); k.hidden = false; setTimeout(kapat, sure || (aksiyon ? 9000 : 4500));
};
const baslikGuncelle = () => { document.title = (bekleyen > 0 ? '(' + bekleyen + ') ' : '') + 'Katılım listesi'; };
const bekleyenSifirla = () => { if (bekleyen) { bekleyen = 0; baslikGuncelle(); } };

// ---------- Durum ekranları ----------
const iskeletGoster = (not) => {
  const d = $('durum'); bosalt(d);
  const p = el('p', 'yukleniyor-not'); const dn = el('span', 'donen'); dn.setAttribute('aria-hidden', 'true'); p.appendChild(dn); p.appendChild(el('span', '', not || 'Liste yükleniyor… (ilk açılış birkaç saniye sürebilir)')); d.appendChild(p);
  const i = el('div', 'iskelet'); i.setAttribute('aria-hidden', 'true'); ['b1', 'b2', 'b3', 'b3'].forEach((c) => i.appendChild(el('i', c))); d.appendChild(i);
};
const durumMesaj = (m, tur, dg) => {
  const d = $('durum'); bosalt(d); if (!m) return;
  const p = el('p', 'mesaj ' + (tur || '')); p.setAttribute('role', tur === 'hata' ? 'alert' : 'status'); p.textContent = m; d.appendChild(p);
  if (dg) { const b = el('button', 'd-btn birincil', dg.ad); b.type = 'button'; b.addEventListener('click', dg.islem); d.appendChild(b); }
};

// ---------- Üst bilgi ----------
const metaCiz = () => {
  const simdi = Date.now(); const n = $('nokta'); const g = $('guncel');
  const cevrimdisi = navigator.onLine === false; $('cevrimdisi').hidden = !cevrimdisi;
  let m;
  if (!alindi) m = suruyor ? 'Yenileniyor…' : '—';
  else {
    m = 'Son güncelleme ' + saatDk(alindi) + ' · ' + goreli(alindi, simdi);
    if (suruyor) m += ' · yenileniyor…'; else if (hataSayisi) m += ' · güncellenemedi' + (planli && !cevrimdisi ? ', yeniden denenecek' : '');
  }
  g.textContent = m;
  n.className = 'nokta' + (hataSayisi || cevrimdisi ? ' hata' : (suruyor ? ' yenileniyor' : ''));
  $('yenile').classList.toggle('doner', !!suruyor);
};
const goreliGuncelle = () => { const s = Date.now(); document.querySelectorAll('.gz').forEach((e) => { e.textContent = goreli(Number(e.dataset.ms), s); }); };
const yeniBantCiz = () => {
  if (!gruplar.length) { $('yeni-bant').hidden = true; return; }
  const yeni = gruplar.filter((g) => yeniMi(g.cur)).length; const b = $('yeni-bant');
  if (yeni > 0) { b.hidden = false; $('yeni-metin').textContent = 'Son ziyaretinizden beri ' + yeni + ' yeni bildirim var.'; } else b.hidden = true;
};

// ---------- Görünümler ----------
const gorunumCiz = (g) => {
  if (!ozet) return;
  if (g === 'ozet') ozetCiz();
  else if (g === 'katilimcilar') { sekmeDurumu(); kirilimCiz(); hizliCiz(); listeCiz(); }
  else if (g === 'analiz') analizCiz();
  else if (g === 'mesajlar') mesajlarCiz();
  kirli.delete(g);
};
const gorunumAc = (g, odak) => {
  if (GORUNUMLER.indexOf(g) < 0) g = 'ozet';
  const degisti = S.gorunum !== g; S.gorunum = g; gorunumYaz(g);
  GORUNUMLER.forEach((x) => { const v = $('v-' + x); if (v) v.hidden = x !== g; });
  document.querySelectorAll('#gorunum button').forEach((b) => { if (b.dataset.gorunum === g) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (veri && (kirli.has(g) || degisti)) gorunumCiz(g);
  if (g === 'katilimcilar' && document.visibilityState === 'visible') bekleyenSifirla();
  if (degisti) { window.scrollTo(0, 0); ipucuGizle(); }
  if (odak) { const h = document.querySelector('#v-' + g + ' h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  duyur(({ ozet: 'Özet', katilimcilar: 'Katılımcılar', analiz: 'Analiz', mesajlar: 'Mesajlar', disari: 'Yazdır ve dışa aktar' })[g] + ' görünümü');
};

// ---------- Gösterim ----------
const goster = (v, taze) => {
  try { performance.mark('v3-bas'); } catch (_) {}
  const yeniImza = JSON.stringify([v.toplam, v.kayitlar]);
  const degisti = yeniImza !== imza;
  if (degisti) {
    const r = islet(v); gruplar = r.gruplar; ozet = r.ozet; tumKayit = r.hepsi;
    const idler = new Set(r.hepsi.map((k) => k.id));
    if (kayitIdleri && taze) {
      const yeniler = r.hepsi.filter((k) => !kayitIdleri.has(k.id));
      if (yeniler.length) {
        yeniler.forEach((k) => yeniSet.add(k.id));
        const n = yeniler.length;
        toast(n + ' yeni bildirim', { ad: 'Göster', islem: () => { S.sira = 'yeni'; $('sira').value = 'yeni'; gorunumAc('katilimcilar'); } });
        duyur(n + ' yeni bildirim geldi.');
        if (document.visibilityState !== 'visible' || S.gorunum !== 'katilimcilar') { bekleyen += n; baslikGuncelle(); }
      }
    }
    kayitIdleri = idler; imza = yeniImza;
  }
  veri = v; $('icerik').hidden = false; document.body.dataset.erisim = 'var'; bosalt($('durum'));
  if (degisti) { sekmeDurumu(); yeniBantCiz(); GORUNUMLER.forEach((g) => kirli.add(g)); gorunumCiz(S.gorunum); } else { zamanCiz(); }
  try { performance.mark('v3-son'); performance.measure('v3-goster', 'v3-bas', 'v3-son'); } catch (_) {}
};

// ---------- Ağ ----------
const planla = (ms) => { clearTimeout(planli); planli = null; if (yetkisiz || !anahtar || document.visibilityState !== 'visible') return; planli = setTimeout(yukle, ms); };
const yukle = async () => {
  if (!anahtar) { durumMesaj('Bu sayfa yalnızca yetkili bağlantıyla açılır.', 'hata'); return; }
  if (UC.includes('__')) { durumMesaj('Liste hizmeti henüz etkinleştirilmemiştir.', 'hata'); return; }
  if (suruyor || yetkisiz) return;
  if (navigator.onLine === false) { hataSayisi = Math.max(hataSayisi, 1); metaCiz(); if (!veri) durumMesaj('Bağlantı yok. Bağlantı gelince liste kendiliğinden yüklenecek.', 'hata'); return; }
  clearTimeout(planli); planli = null; suruyor = true; metaCiz();
  if (!veri) iskeletGoster();
  const ac = new AbortController(); const zt = setTimeout(() => ac.abort(), ZAMAN_ASIMI);
  try {
    const y = await fetch(UC, { method: 'POST', mode: 'cors', redirect: 'follow', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ac.signal, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tur: 'veda-liste', anahtar }) });
    const s = await y.json();
    if (s && s.ok && Array.isArray(s.kayitlar) && s.toplam) { depoYaz(s); alindi = Date.now(); hataSayisi = 0; goster(s, true); duyur('Liste güncellendi: ' + saatDk(alindi)); }
    else if (s && s.hata === 'yetki') yetkisizYap();
    else throw new Error('yanit');
  } catch (_) {
    hataSayisi++;
    if (!veri) durumMesaj(navigator.onLine === false ? 'Bağlantı yok. Bağlantı gelince liste kendiliğinden yüklenecek.' : 'Liste şu anda alınamadı. Otomatik olarak yeniden deneniyor.', 'hata', { ad: 'Şimdi yeniden dene', islem: () => { hataSayisi = 0; yukle(); } });
    else duyur('Liste güncellenemedi; son alınan liste gösteriliyor.');
  } finally { clearTimeout(zt); suruyor = false; metaCiz(); if (!yetkisiz) planla(hataSayisi ? GERI_DENEME[Math.min(hataSayisi - 1, GERI_DENEME.length - 1)] : YENILEME); }
};
const sifirla = () => {
  oturumSil(); depoSil(); anahtar = ''; yetkisiz = true; veri = null; imza = ''; gruplar = []; ozet = null; tumKayit = []; kayitIdleri = null; yeniSet.clear(); bekleyen = 0; baslikGuncelle();
  clearTimeout(planli); planli = null; $('icerik').hidden = true; document.body.dataset.erisim = 'yok'; $('yeni-bant').hidden = true;
  ['liste-yeri', 'yz-govde', 'yz-m-govde', 'yz-rapor-govde', 'mesaj-yer', 'son-bildirimler'].forEach((i) => { const e = $(i); if (e) bosalt(e); });
  if ($('detay').open) $('detay').close(); ipucuGizle();
};
const yetkisizYap = () => { sifirla(); durumMesaj('Yetki yok. Bağlantıyı yetkili kişiden yeniden alın.', 'hata'); };
const cikis = () => { sifirla(); menuKapat(); durumMesaj('Çıkış yapıldı; bu cihazdaki anahtar ve önbellek silindi. Listeyi görmek için yetkili bağlantıyı yeniden açın.', 'ok'); };

// ---------- Tema / menü ----------
const temaUygula = (t) => { const r = document.documentElement; if (t === 'light' || t === 'dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme'); document.querySelectorAll('#menu [data-tema]').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.tema || '') === (t === 'light' || t === 'dark' ? t : '') ? 'true' : 'false')); };
const menuKapat = () => { const m = $('menu'); if (!m.hidden) { m.hidden = true; $('menu-ac').setAttribute('aria-expanded', 'false'); } };

// ---------- Olaylar ----------
const olaylar = () => {
  $('yenile').addEventListener('click', () => { hataSayisi = 0; yukle(); });
  $('cikis').addEventListener('click', cikis);
  $('menu-ac').addEventListener('click', (e) => { e.stopPropagation(); const m = $('menu'); m.hidden = !m.hidden; $('menu-ac').setAttribute('aria-expanded', m.hidden ? 'false' : 'true'); });
  document.addEventListener('click', (e) => { if (!e.target.closest || !e.target.closest('#menu, #menu-ac')) menuKapat(); });
  document.querySelectorAll('#menu [data-tema]').forEach((b) => b.addEventListener('click', () => { const t = b.dataset.tema || ''; try { if (t) localStorage.setItem(TEMA_ANAHTARI, t); else localStorage.removeItem(TEMA_ANAHTARI); } catch (_) {} temaUygula(t); if (ozet) gorunenGrafikleriCiz(); }));
  $('yeni-temizle').addEventListener('click', () => { yeniEsik = Date.now(); sonGorulenYaz(yeniEsik); yeniSet.clear(); yeniBantCiz(); if (S.gorunum === 'katilimcilar') listeCiz(); });
  document.querySelectorAll('#gorunum button').forEach((b) => b.addEventListener('click', () => gorunumAc(b.dataset.gorunum, false)));
  document.querySelectorAll('[data-git]').forEach((b) => b.addEventListener('click', () => gorunumAc(b.dataset.git, false)));
  document.querySelectorAll('#sekmeler .sekme').forEach((b) => b.addEventListener('click', () => { S.sekme = b.dataset.sekme; sekmeDurumu(); listeCiz(); }));
  let araZaman = null;
  $('ara').addEventListener('input', (e) => { S.ara = e.target.value; clearTimeout(araZaman); araZaman = setTimeout(listeCiz, 90); });
  $('sira').addEventListener('change', (e) => { S.sira = e.target.value; listeCiz(); });
  $('kurum-daha').addEventListener('click', () => { S.kurumHepsi = !S.kurumHepsi; kirilimCiz(); });
  $('liste-yeri').addEventListener('toggle', (e) => { const d = e.target; if (d && d.dataset && d.dataset.id) { if (d.open) acik.add(d.dataset.id); else acik.delete(d.dataset.id); } }, true);
  const dt = $('detay');
  dt.addEventListener('click', (e) => { if (e.target === dt) dt.close(); });
  dt.addEventListener('close', () => { const a = detayAcan; detayAcan = null; if (a && document.contains(a)) { try { a.focus({ preventScroll: true }); } catch (_) {} } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menuKapat();
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') && !$('icerik').hidden && !dt.open) { e.preventDefault(); gorunumAc('katilimcilar', false); $('ara').focus(); }
  });
  window.addEventListener('online', () => { hataSayisi = 0; metaCiz(); yukle(); });
  window.addEventListener('offline', metaCiz);
  let rz = null; const yenidenCiz = () => { clearTimeout(rz); rz = setTimeout(() => { if (ozet) gorunenGrafikleriCiz(); }, 140); };
  const olcu = () => { const a = $('appbar'), r = $('arac'); const k = document.documentElement.style; if (a) k.setProperty('--ab-h', a.offsetHeight + 'px'); k.setProperty('--arac-h', (r && r.offsetHeight ? r.offsetHeight : 0) + 'px'); };
  if (typeof ResizeObserver === 'function') { new ResizeObserver(yenidenCiz).observe($('ana')); const ro = new ResizeObserver(olcu); ro.observe($('appbar')); ro.observe($('arac')); } else { window.addEventListener('resize', yenidenCiz); window.addEventListener('resize', olcu); }
  olcu();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      tikBasla(); if (S.gorunum === 'katilimcilar') bekleyenSifirla();
      if (!anahtar || yetkisiz) return;
      if (veri) { zamanCiz(); goreliGuncelle(); metaCiz(); }
      if (!suruyor && (!alindi || Date.now() - alindi > 30000)) yukle(); else planla(hataSayisi ? 5000 : YENILEME);
    } else { gorulduYaz(); tikDur(); clearTimeout(planli); planli = null; }
  });
  window.addEventListener('pagehide', gorulduYaz);
};
const tikBasla = () => { if (tiktak) return; tiktak = setInterval(() => { if (!veri) return; zamanCiz(); goreliGuncelle(); metaCiz(); }, 30000); };
const tikDur = () => { clearInterval(tiktak); tiktak = null; };
const gorulduYaz = () => { if (veri) sonGorulenYaz(Date.now()); };

// ---------- Açılış ----------
(() => {
  let tema = ''; try { tema = localStorage.getItem(TEMA_ANAHTARI) || ''; } catch (_) {}
  temaUygula(tema);
  ipucuHazirla(); ozetGrafikKur(); grafikKur(); disariKur();
  document.querySelectorAll('#gorunum button').forEach((b) => { const i = b.querySelector('.nav-ikon'); if (i) i.appendChild(ikon(b.dataset.ikon, 22)); });
  [['yenile', 'yenile'], ['menu-ac', 'menu']].forEach(([id, ad]) => $(id).appendChild(ikon(ad, 20)));
  $('cikis').insertBefore(ikon('cikis', 18), $('cikis').firstChild);
  let g = gorunumOku(); if (GORUNUMLER.indexOf(g) < 0) g = 'ozet';
  olaylar();
  gorunumAc(g, false);
  if (!anahtar) { durumMesaj('Bu sayfa yalnızca yetkili bağlantıyla açılır.', 'hata'); return; }
  const onb = depoOku();
  if (onb) { alindi = Date.parse(onb.alindi); goster(onb.veri, false); } else iskeletGoster();
  tikBasla(); metaCiz(); yukle();
})();
