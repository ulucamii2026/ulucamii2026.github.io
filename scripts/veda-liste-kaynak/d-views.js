/* Durum ve görünümler: Özet, Katılımcılar (+ ayrıntı çekmecesi), Analiz (+ veri kalitesi), Mesajlar, Dışa aktar. */
const S = { gorunum: 'ozet', sekme: 'tumu', ara: '', sira: 'yeni', grup: null, kurumHepsi: false, eskiMsj: false, f: { gec: false, msj: false, yeni: false, kisi3: false, degisti: false }, gunMod: 'gun' };
let veri = null, alindi = 0, imza = '', gruplar = [], ozet = null, tumKayit = [];
let yeniEsik = 0;
const acik = new Set();
let suruyor = false, yetkisiz = false, hataSayisi = 0, planli = null, tiktak = null;
const GORUNUMLER = ['ozet', 'katilimcilar', 'analiz', 'mesajlar', 'disari'];

// ---------- Simgeler ----------
const IKON = {
  yenile: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5', menu: 'M4 7h16M4 12h16M4 17h16', ozet: 'M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z',
  kisiler: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 5.2a3.5 3.5 0 0 1 0 6.6',
  analiz: 'M5 20V10M12 20V4M19 20v-7', mesaj: 'M4 5h16v11H9l-5 4z', yazdir: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z', x: 'M6 6l12 12M18 6L6 18',
  tel: 'M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2', indir: 'M12 4v11M7 11l5 5 5-5M5 20h14', tema: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9',
  cikis: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9', ok: 'M5 12l4 4 10-10', rapor: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6', kopya: 'M9 9h11v11H9zM5 15V4h11',
};
const ikon = (ad, boyut) => { const s = sv('svg', { width: boyut || 20, height: boyut || 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false', class: 'ikon' }); s.appendChild(sv('path', { d: IKON[ad] || '' })); return s; };
const dugme = (ad, cls, ikonAd, tikla) => { const b = el('button', 'd-btn ' + (cls || '')); b.type = 'button'; if (ikonAd) b.appendChild(ikon(ikonAd, 18)); b.appendChild(document.createTextNode(ad)); if (tikla) b.addEventListener('click', tikla); return b; };
const rozet = (cls, m) => el('span', 'rz ' + cls, m);
const avatar = (ad, boy) => { const a = el('span', 'av a' + renkIndeksi(ad) + (boy ? ' buyuk' : ''), bas(ad)); a.setAttribute('aria-hidden', 'true'); return a; };
const yeniMi = (k) => !!k.gecerli && ((yeniEsik > 0 && k.ms > yeniEsik) || yeniSet.has(k.id));

// ---------- Sayaçlar ----------
const zamanCiz = () => {
  const simdi = Date.now();
  if (simdi < SON_YANIT) {
    $('s1-et').textContent = 'Yanıt süresine'; $('s1-deger').textContent = sureMetni(SON_YANIT - simdi); $('s1-alt').textContent = 'Cumartesi 7 Kasım, 12.00';
  } else {
    $('s1-et').textContent = 'Yanıt süresi'; $('s1-deger').textContent = 'Süre doldu';
    $('s1-alt').textContent = 'Yanıt süresi doldu · form açık, geç bildirimler işaretleniyor' + (ozet && ozet.sonra ? ' (' + ozet.sonra + ' kayıt).' : '.');
  }
  if (simdi < PROGRAM_BAS) {
    const kars = simdi >= PROGRAM;
    $('s2-deger').textContent = kars ? 'Karşılama başladı · programa ' + sureMetni(PROGRAM_BAS - simdi) : 'Programa ' + sureMetni(PROGRAM_BAS - simdi);
    $('s2-alt').textContent = 'Pazar 8 Kasım, 15.30 · karşılama 15.00';
  } else if (simdi < PROGRAM_SON) { $('s2-deger').textContent = 'Program başladı'; $('s2-alt').textContent = 'BDV Genel Merkezi · 8 Kasım'; }
  else { $('s2-deger').textContent = 'Program günü geçti'; $('s2-alt').textContent = '8 Kasım 2026'; }
  const sayac = $('sayac2'); if (sayac) sayac.classList.toggle('program-once', simdi >= SON_YANIT);
};

// ---------- Sayı animasyonu (yalnız hareket azaltma kapalıyken) ----------
const gosterilen = new Map();
const sayiYaz = (id, hedef) => {
  const e = $(id); if (!e) return; const onceki = gosterilen.get(id);
  gosterilen.set(id, hedef);
  if (azaltmaTercihi() || onceki === hedef || typeof requestAnimationFrame !== 'function') { e.textContent = String(hedef); return; }
  const bas = onceki == null ? 0 : onceki; const t0 = performance.now(); const sure = 650;
  const adim = (t) => { const p = Math.min(1, (t - t0) / sure); const v = Math.round(bas + (hedef - bas) * (1 - Math.pow(1 - p, 3))); e.textContent = String(v); if (p < 1 && gosterilen.get(id) === hedef) requestAnimationFrame(adim); else e.textContent = String(gosterilen.get(id)); };
  requestAnimationFrame(adim);
};

// ---------- Özet ----------
const pencere = (pred, bas, son) => { const simdi = Date.now(); return gruplar.filter((g) => { const k = g.cur; return k.ms && simdi - k.ms >= bas && simdi - k.ms < son && pred(k); }); };
const ozetCiz = () => {
  const o = ozet;
  sayiYaz('t-kisi', o.kisi); sayiYaz('t-kayit', o.kat); sayiYaz('t-yok', o.yok); sayiYaz('t-msj', o.msj); sayiYaz('t-bugun', o.bugun); sayiYaz('t-24', o.son24);
  $('t-kisi-alt').textContent = 'eşler ve misafirler dahil · ' + o.kat + ' kayıttan';
  const H = 86400000; const kat = (k) => k.durum === 'katilacak';
  const d24 = (pred) => pencere(pred, 0, H).length, d48 = (pred) => pencere(pred, H, 2 * H).length;
  $('t-kisi-delta').textContent = o.son24kisi > 0 ? '+' + o.son24kisi + ' kişi son 24 saat' : 'Son 24 saatte yeni kişi yok';
  const dm = (n) => (n > 0 ? '+' + n + ' son 24 saat' : 'son 24 saatte yeni yok');
  $('d-kayit').textContent = dm(d24(kat)); $('d-yok').textContent = dm(d24((k) => !kat(k))); $('d-msj').textContent = dm(d24((k) => !!k.mesaj));
  const bugun = gunAnahtar(Date.now()), dun = gunEkle(bugun, -1);
  $('d-bugun').textContent = 'dün: ' + gruplar.filter((g) => g.cur.ms && gunAnahtar(g.cur.ms) === dun).length;
  $('d-24').textContent = 'önceki 24 saat: ' + d48(() => true);
  const tl = o.tl, cur = gruplar.map((g) => g.cur);
  const gs = gunSonlari(tl, 14); const yen = gunlukYeni(cur, 14);
  const msjG = (() => { const dizi = []; let j = 0, n = 0; gs.forEach((r) => { while (j < o.msjTl.length && gunAnahtar(o.msjTl[j].ms) <= r.d) { n = o.msjTl[j].n; j++; } dizi.push(n); }); return dizi; })();
  const koy = (id, v, sinif) => { const y = $(id); bosalt(y); y.appendChild(kucukCizgi(v, sinif)); };
  koy('sp-kisi', gs.map((r) => r.kisi), 'kirmizi'); koy('sp-kayit', gs.map((r) => r.kayit), 'kirmizi'); koy('sp-yok', gs.map((r) => r.yok), 'gri'); koy('sp-msj', msjG, 'mavi'); koy('sp-bugun', yen.map((r) => r.n), 'kirmizi'); koy('sp-24', yen.map((r) => r.n), 'mavi');
  zamanCiz(); kirilimCiz(); sonBildirimCiz();
  grafikCiz('kum-ozet');
};
const dilimCiz = (ul, liste, tur) => {
  bosalt(ul); const en = Math.max(1, ...liste.map((x) => x.kisi));
  liste.forEach((x) => {
    const li = el('li'); const b = el('button', 'satir'); b.type = 'button';
    const aktif = S.grup && S.grup.tur === tur && S.grup.key === x.key; b.setAttribute('aria-pressed', aktif ? 'true' : 'false');
    b.setAttribute('aria-label', x.ad + ': ' + x.kisi + ' kişi, ' + x.kayit + ' kayıt. Katılımcılar listesini bu ' + (tur === 'gorev' ? 'göreve' : 'kuruma') + ' göre süz');
    b.appendChild(el('span', '', x.ad));
    const s = el('span', 'sayi', x.kisi + ' kişi '); s.appendChild(el('small', '', '(' + x.kayit + ' kayıt)')); b.appendChild(s);
    const c = el('span', 'cubuk'); const i = el('i'); i.style.width = (x.kisi / en * 100) + '%'; c.appendChild(i); b.appendChild(c);
    b.addEventListener('click', () => { if (aktif) { S.grup = null; kirilimCiz(); if (S.gorunum === 'katilimcilar') listeCiz(); } else suzGit({ tur, key: x.key, ad: x.ad }); });
    li.appendChild(b); ul.appendChild(li);
  });
  if (!liste.length) { const li = el('li'); li.appendChild(el('p', 'mut', 'Henüz katılacak kayıt yok.')); ul.appendChild(li); }
};
const kirilimCiz = () => {
  if (!ozet) return;
  dilimCiz($('k-gorev'), ozet.gorevler, 'gorev');
  const ku = ozet.kurumlar; const goster = S.kurumHepsi ? ku : ku.slice(0, KURUM_ILK);
  if (!S.kurumHepsi && S.grup && S.grup.tur === 'kurum' && !goster.some((x) => x.key === S.grup.key)) { const x = ku.find((y) => y.key === S.grup.key); if (x) goster.push(x); }
  dilimCiz($('k-kurum'), goster, 'kurum');
  const d = $('kurum-daha');
  if (ku.length > KURUM_ILK) { d.hidden = false; d.textContent = S.kurumHepsi ? 'Daha az göster' : 'Tüm kurumlar (' + ku.length + ')'; d.setAttribute('aria-expanded', S.kurumHepsi ? 'true' : 'false'); } else d.hidden = true;
};
const sonBildirimCiz = () => {
  const y = $('son-bildirimler'); bosalt(y); const simdi = Date.now();
  const son = gruplar.slice().sort((a, b) => b.cur.ms - a.cur.ms).slice(0, 5);
  if (!son.length) { y.appendChild(el('p', 'mut', 'Henüz bildirim yok.')); return; }
  son.forEach((g) => {
    const k = g.cur; const li = el('li'); const b = el('button', 'son-satir'); b.type = 'button';
    b.appendChild(avatar(k.ad)); const m = el('span', 'son-metin'); m.appendChild(el('b', '', k.ad || '—'));
    m.appendChild(el('span', 'mut', (k.kurum || 'Kurum belirtilmemiş') + ' · ' + (k.durum === 'katilacak' ? k.kisi + ' kişi' : durumEtiket(k).toLocaleLowerCase('tr')))); b.appendChild(m);
    const z = el('span', 'mut gz son-z', goreli(k.ms, simdi)); z.dataset.ms = String(k.ms); b.appendChild(z);
    b.addEventListener('click', () => detayAc(g, b)); li.appendChild(b); y.appendChild(li);
  });
};

// ---------- Süzme ----------
const suzGit = (grup) => { S.grup = grup; if (S.sekme === 'katilamayacak') S.sekme = 'katilacak'; gorunumAc('katilimcilar'); };
const suzIslev = (g) => {
  const f = S.f;
  if (f.gec && !g.gec) return false; if (f.msj && !g.cur.mesaj) return false; if (f.yeni && !yeniMi(g.cur)) return false; if (f.kisi3 && !g.buyuk) return false; if (f.degisti && !g.degisti) return false;
  if (S.sekme === 'katilacak' && g.cur.durum !== 'katilacak') return false;
  if (S.sekme === 'katilamayacak' && g.cur.durum !== 'katilamayacak') return false;
  if (S.grup) { if (S.grup.tur === 'gorev' && g.gkey !== S.grup.key) return false; if (S.grup.tur === 'kurum' && g.kkey !== S.grup.key) return false; }
  return true;
};
const süz = () => {
  const jetonlar = trn(S.ara).split(' ').filter(Boolean);
  return gruplar.filter((g) => suzIslev(g) && jetonlar.every((j) => g.ara.indexOf(j) !== -1));
};
const sirala = (liste, f) => {
  if (S.sira === 'ad') return liste.sort((a, b) => kol.compare(f(a).ad, f(b).ad) || f(b).ms - f(a).ms);
  if (S.sira === 'kurum') return liste.sort((a, b) => kol.compare(f(a).kurum, f(b).kurum) || kol.compare(f(a).ad, f(b).ad));
  if (S.sira === 'kisi') return liste.sort((a, b) => f(b).kisi - f(a).kisi || f(b).ms - f(a).ms);
  return liste.sort((a, b) => f(b).ms - f(a).ms);
};

// ---------- Katılımcılar ----------
const acikTakip = (d, id) => { d.dataset.id = id; if (acik.has(id)) d.open = true; return d; };
const eskiBlok = (g) => {
  const d = el('details', 'd-det'); acikTakip(d, 'e|' + g.key);
  d.appendChild(el('summary', '', g.eski.length + ' eski bildirim'));
  const w = el('div', 'eskiler');
  g.eski.forEach((k) => {
    const e = el('div', 'e');
    e.appendChild(document.createTextNode(mutlak(k.ms) + ' · ' + (k.durum === 'katilacak' ? 'Katılacak, ' + k.kisi + ' kişi' : durumEtiket(k)) + (k.gorev ? ' · ' + k.gorev : '')));
    if (k.mesaj) e.appendChild(el('span', 'm', k.mesaj));
    w.appendChild(e);
  });
  d.appendChild(w); return d;
};
const rozetler = (g) => {
  const k = g.cur; const rz = el('span', 'rozetler');
  rz.appendChild(rozet(k.durum === 'katilacak' ? 'evet' : (k.durum === 'katilamayacak' ? 'hayir' : 'eski'), durumEtiket(k)));
  if (yeniMi(k)) rz.appendChild(rozet('yeni', 'Yeni'));
  if (g.gec) rz.appendChild(rozet('gec', 'süre sonrası'));
  if (g.degisti) rz.appendChild(rozet('deg', 'Değişti'));
  if (!k.gecerli) rz.appendChild(rozet('eski', 'Eski kayıt'));
  if (k.mesaj) rz.appendChild(rozet('msj', 'Mesaj var'));
  return rz;
};
const satirCiz = (g, simdi) => {
  const k = g.cur; const tb = el('tbody'); tb.setAttribute('role', 'rowgroup');
  if (yeniMi(k)) tb.className = 'yeni-kayit';
  const tr = el('tr', 'ana'); tr.setAttribute('role', 'row');
  const hucre = (cls) => { const t = el('td', cls); t.setAttribute('role', 'cell'); return t; };
  const ad = hucre('c-ad'); const sar = el('div', 'ad-sar'); sar.appendChild(avatar(k.ad));
  const kt = el('div', 'ad-kt'); const bt = el('button', 'ad-btn', k.ad || '—'); bt.type = 'button'; bt.setAttribute('aria-label', k.ad + ' — ayrıntıları aç'); bt.addEventListener('click', () => detayAc(g, bt)); kt.appendChild(bt); kt.appendChild(rozetler(g)); sar.appendChild(kt); ad.appendChild(sar); tr.appendChild(ad);
  const kurum = hucre('c-kurum'); kurum.textContent = k.kurum || '—'; tr.appendChild(kurum);
  const gorev = hucre('c-gorev' + (k.gorev ? '' : ' bos')); gorev.textContent = k.gorev || '—'; tr.appendChild(gorev);
  const tl = hucre('c-tel' + (tel(k.telefon).length >= 5 ? '' : ' bos'));
  if (tel(k.telefon).length >= 5) { const a = el('a', '', k.telefon); a.href = 'tel:' + tel(k.telefon); tl.appendChild(a); } else tl.textContent = k.telefon || '—';
  tr.appendChild(tl);
  const kisi = hucre('c-kisi' + (k.durum === 'katilacak' ? '' : ' bos')); kisi.textContent = k.durum === 'katilacak' ? k.kisi + ' kişi' : '—'; tr.appendChild(kisi);
  const z = hucre('c-zaman'); z.appendChild(document.createTextNode(mutlak(k.ms)));
  const gz = el('span', 'mut gz', goreli(k.ms, simdi)); gz.dataset.ms = String(k.ms); z.appendChild(gz); tr.appendChild(z);
  tb.appendChild(tr);
  const ekle = (node) => { const r = el('tr', 'ek'); r.setAttribute('role', 'row'); const t = el('td'); t.setAttribute('role', 'cell'); t.colSpan = 6; t.appendChild(node); r.appendChild(t); tb.appendChild(r); };
  if (k.mesaj) { const d = el('details', 'd-det'); acikTakip(d, 'm|' + g.key); d.appendChild(el('summary', '', 'Hocamıza mesaj')); d.appendChild(el('div', 'ic', k.mesaj)); ekle(d); }
  if (g.eski.length) ekle(eskiBlok(g));
  return tb;
};
const bosDurum = (b, m, temizle) => {
  const d = el('div', 'bos-durum'); d.appendChild(el('b', '', b)); d.appendChild(document.createTextNode(m));
  if (temizle) { const x = el('button', 'd-btn', 'Süzgeçleri temizle'); x.type = 'button'; x.style.marginTop = '12px'; x.addEventListener('click', suzgecTemizle); d.appendChild(document.createElement('br')); d.appendChild(x); }
  return d;
};
const suzgecTemizle = () => { S.ara = ''; S.grup = null; S.f = { gec: false, msj: false, yeni: false, kisi3: false, degisti: false }; $('ara').value = ''; kirilimCiz(); listeCiz(); };
const hizliCiz = () => {
  const y = $('hizli'); bosalt(y);
  const say = (fn) => gruplar.filter(fn).length;
  const ogeler = [['gec', 'Süre sonrası', (g) => g.gec], ['msj', 'Mesajlı', (g) => !!g.cur.mesaj], ['yeni', 'Yeni', (g) => yeniMi(g.cur)], ['kisi3', '3+ kişi', (g) => g.buyuk], ['degisti', 'Değişti', (g) => g.degisti]];
  ogeler.forEach(([k, ad, fn]) => {
    const b = el('button', 'hizli-chip'); b.type = 'button'; b.dataset.hizli = k; b.setAttribute('aria-pressed', S.f[k] ? 'true' : 'false');
    b.appendChild(document.createTextNode(ad)); b.appendChild(el('span', 'n', ' ' + say(fn)));
    b.addEventListener('click', () => { S.f[k] = !S.f[k]; hizliCiz(); listeCiz(); }); y.appendChild(b);
  });
  const ayr = el('span', 'hizli-ayrac'); ayr.setAttribute('aria-hidden', 'true'); y.appendChild(ayr);
  const gv = ozet.gorevDurum.slice();
  gv.forEach((x) => {
    const key = x.key; const ad = gorevAd(key ? x.ad : ''); const n = say((g) => g.gkey === key);
    const b = el('button', 'hizli-chip gorev'); b.type = 'button'; b.dataset.gorev = key; const ak = S.grup && S.grup.tur === 'gorev' && S.grup.key === key; b.setAttribute('aria-pressed', ak ? 'true' : 'false');
    b.appendChild(document.createTextNode(ad)); b.appendChild(el('span', 'n', ' ' + n));
    b.addEventListener('click', () => { S.grup = ak ? null : { tur: 'gorev', key, ad }; kirilimCiz(); hizliCiz(); listeCiz(); }); y.appendChild(b);
  });
};
const listeCiz = () => {
  const yer = $('liste-yeri'); const simdi = Date.now(); bosalt(yer);
  const cy = $('grup-chip-yeri'); bosalt(cy);
  if (S.grup && S.grup.tur === 'kurum') { const c = el('span', 'chip'); c.appendChild(document.createTextNode('Kurum: ' + S.grup.ad)); const b = el('button', '', '×'); b.type = 'button'; b.setAttribute('aria-label', 'Süzgeci kaldır'); b.addEventListener('click', () => { S.grup = null; kirilimCiz(); hizliCiz(); listeCiz(); }); c.appendChild(b); cy.appendChild(c); }
  else if (S.grup) { const c = el('span', 'chip'); c.appendChild(document.createTextNode('Görev: ' + S.grup.ad)); const b = el('button', '', '×'); b.type = 'button'; b.setAttribute('aria-label', 'Süzgeci kaldır'); b.addEventListener('click', () => { S.grup = null; kirilimCiz(); hizliCiz(); listeCiz(); }); c.appendChild(b); cy.appendChild(c); }
  hizliCiz2();
  const bulunan = süz(); const sc = $('sonuc-sayi'); bosalt(sc);
  const suzgecVar = !!(S.ara.trim() || S.grup || Object.keys(S.f).some((k) => S.f[k]));
  sirala(bulunan, (g) => g.cur);
  sc.appendChild(el('span', '', bulunan.length + ' kayıt' + (bulunan.length !== gruplar.length ? ' (toplam ' + gruplar.length + ')' : '')));
  if (!gruplar.length) { yer.appendChild(bosDurum('Henüz kayıt yok', 'Davetiye formu doldurulunca bildirimler burada görünecek. Liste kendiliğinden yenilenir.', false)); return; }
  if (!bulunan.length) { yer.appendChild(bosDurum('Aramanıza uyan kayıt yok', 'Yazımı değiştirin ya da süzgeci kaldırın.', true)); return; }
  const t = el('table', 'liste-t'); t.setAttribute('role', 'table'); t.setAttribute('aria-label', 'Katılım bildirimleri');
  const cg = el('colgroup'); ['k-ad', 'k-kurum', 'k-gorev', 'k-tel', 'k-kisi', 'k-zaman'].forEach((c) => cg.appendChild(el('col', c))); t.appendChild(cg);
  const th = el('thead'); th.setAttribute('role', 'rowgroup'); const hr = el('tr'); hr.setAttribute('role', 'row');
  [['Ad soyad', 'ad'], ['Kurum', 'kurum'], ['Görevi', ''], ['Telefon', ''], ['Kişi', 'kisi'], ['Zaman', 'yeni']].forEach(([m, sk]) => {
    const h = el('th', ''); h.scope = 'col'; h.setAttribute('role', 'columnheader');
    if (sk) { const b = el('button', 'th-sira', m); b.type = 'button'; b.setAttribute('aria-label', m + ' sütununa göre sırala'); if (S.sira === sk) { b.classList.add('akt'); h.setAttribute('aria-sort', 'ascending'); } b.addEventListener('click', () => { S.sira = sk; $('sira').value = sk; listeCiz(); }); h.appendChild(b); } else h.textContent = m;
    hr.appendChild(h);
  });
  th.appendChild(hr); t.appendChild(th);
  const frag = document.createDocumentFragment(); bulunan.forEach((g) => frag.appendChild(satirCiz(g, simdi))); t.appendChild(frag);
  yer.appendChild(t);
};
const hizliCiz2 = () => { document.querySelectorAll('#hizli .hizli-chip[data-hizli]').forEach((b) => b.setAttribute('aria-pressed', S.f[b.dataset.hizli] ? 'true' : 'false')); document.querySelectorAll('#hizli .hizli-chip.gorev').forEach((b) => b.setAttribute('aria-pressed', S.grup && S.grup.tur === 'gorev' && S.grup.key === b.dataset.gorev ? 'true' : 'false')); };
const sekmeDurumu = () => {
  document.querySelectorAll('#sekmeler .sekme').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sekme === S.sekme ? 'true' : 'false'));
  $('n-tumu').textContent = ' ' + gruplar.length;
  $('n-katilacak').textContent = ' ' + gruplar.filter((g) => g.cur.durum === 'katilacak').length;
  $('n-katilamayacak').textContent = ' ' + gruplar.filter((g) => g.cur.durum === 'katilamayacak').length;
  const nm = $('nav-mesaj'); if (nm) nm.textContent = String(gruplar.filter((g) => g.cur.mesaj).length);
};

// ---------- Ayrıntı çekmecesi ----------
let detayAcan = null;
const detayAc = (g, acan) => {
  const d = $('detay'); detayAcan = acan || null; bosalt(d); const k = g.cur; const simdi = Date.now();
  const ust = el('div', 'dt-ust'); ust.appendChild(avatar(k.ad, true)); const bs = el('div', 'dt-bas'); const h = el('h2', '', k.ad || '—'); h.id = 'dt-baslik'; bs.appendChild(h); bs.appendChild(rozetler(g)); ust.appendChild(bs);
  const kp = el('button', 'ikon-btn dt-kapat'); kp.type = 'button'; kp.setAttribute('aria-label', 'Kapat'); kp.appendChild(ikon('x', 20)); kp.addEventListener('click', () => d.close()); ust.appendChild(kp); d.appendChild(ust);
  d.setAttribute('aria-labelledby', 'dt-baslik');
  const dl = el('dl', 'dt-alanlar');
  const alan = (ad, deg, link) => { dl.appendChild(el('dt', '', ad)); const dd = el('dd'); if (link) dd.appendChild(link); else dd.textContent = deg || '—'; dl.appendChild(dd); };
  alan('Kurum', k.kurum); alan('Görev', k.gorev); alan('Durum', durumEtiket(k) + (k.durum === 'katilacak' ? ' · ' + k.kisi + ' kişi' : ''));
  if (tel(k.telefon).length >= 5) { const a = el('a', 'tel-btn', k.telefon); a.href = 'tel:' + tel(k.telefon); a.insertBefore(ikon('tel', 16), a.firstChild); alan('Telefon', '', a); } else alan('Telefon', k.telefon);
  alan('Son bildirim', mutlak(k.ms) + (k.ms ? ' · ' + goreli(k.ms, simdi) : '') + (g.gec ? ' · süre sonrası' : ''));
  d.appendChild(dl);
  if (k.mesaj) { d.appendChild(el('h3', 'dt-h', 'Hocamıza mesaj')); d.appendChild(el('blockquote', 'dt-mesaj', k.mesaj)); }
  d.appendChild(el('h3', 'dt-h', 'Bildirim geçmişi'));
  const ol = el('ol', 'gecmis');
  if (g.surum.length < 2) ol.appendChild(el('li', 'mut', 'İlk ve tek bildirim; sonradan değişiklik yok.'));
  g.adimlar.forEach((a, j) => {
    const x = a.k; const li = el('li', x === k ? 'su-an' : ''); li.appendChild(el('span', 'g-nokta'));
    const ic = el('div', 'g-ic'); const bs2 = el('div', 'g-bas'); bs2.appendChild(el('b', '', mutlak(x.ms))); if (x === k) bs2.appendChild(rozet('evet', 'Geçerli')); ic.appendChild(bs2);
    ic.appendChild(el('div', 'mut', durumEtiket(x) + (x.durum === 'katilacak' ? ' · ' + x.kisi + ' kişi' : '') + (j === 0 ? ' · ilk bildirim' : '')));
    if (j > 0) { const f = a.fark; if (!f.length) ic.appendChild(el('div', 'g-fark yok', 'Aynı bilgilerle yeniden gönderildi')); f.forEach((z) => ic.appendChild(el('div', 'g-fark f-' + z.tur, z.metin))); }
    li.appendChild(ic); ol.appendChild(li);
  });
  d.appendChild(ol);
  if (!d.open) d.showModal();
};

// ---------- Analiz ----------
const GRAFIK = {};
const grafikKur = () => {
  const y = $('analiz-yer'); bosalt(y);
  const ek = (id, baslik, alt, genis) => { const k = grafikKarti(baslik, alt, 'g-' + id); if (genis) k.f.classList.add('genis'); GRAFIK[id] = k; y.appendChild(k.f); return k; };
  ek('kum', 'Birikimli bildirimler', 'Zaman içinde katılacak kişi ve kayıt sayısı; yanıt süresi ve “şimdi” işaretli.', true);
  const gk = ek('gun', 'Bildirimler', 'Süre içinde ve süre sonrası gelen kayıtlar.', false);
  [['gun', 'Günlük'], ['saat', 'Son 72 saat']].forEach(([m, ad]) => { const b = el('button', 'mini-sek', ad); b.type = 'button'; b.dataset.mod = m; b.setAttribute('aria-pressed', S.gunMod === m ? 'true' : 'false'); b.addEventListener('click', () => { S.gunMod = m; gk.araclar.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.mod === m ? 'true' : 'false')); grafikCiz('gun'); }); gk.araclar.appendChild(b); });
  ek('durum', 'Katılım durumu', 'Katılacak ve katılamayacak kayıtların payı.', false);
  ek('gorev', 'Göreve göre durum', 'Dokunursanız katılımcı listesi o göreve süzülür.', false);
  ek('buyukluk', 'Kayıt başına kişi', 'Tek başına mı, eşle mi, grupla mı geliyor?', false);
  ek('kurum', 'Kuruma göre katılacak kişi', 'İlk 10 kurum; dokunursanız liste o kuruma süzülür.', true);
  ek('saat', 'Günün hangi saatinde yanıtlıyorlar?', 'Brüksel saatine göre bildirim dağılımı.', false);
};
const grafikCiz = (id, baski) => {
  if (!ozet) return; const k = id === 'kum-ozet' ? GRAFIK_OZET : GRAFIK[id]; if (!k) return;
  const w = Math.floor(k.govde.clientWidth); if (w < 60) { k.kirli = true; return; } k.kirli = false;
  if (id === 'kum' || id === 'kum-ozet') cizKum(k, w, id === 'kum-ozet');
  else if (id === 'gun') cizGun(k, w); else if (id === 'durum') cizDurum(k, w); else if (id === 'gorev') cizGorev(k, w);
  else if (id === 'buyukluk') cizBuyukluk(k, w); else if (id === 'kurum') cizKurum(k, w); else if (id === 'saat') cizSaat(k, w);
};
let GRAFIK_OZET = null;
const ozetGrafikKur = () => { GRAFIK_OZET = grafikKarti('Birikimli bildirimler', 'Katılacak kişi ve kayıt; son yanıt saati ve “şimdi” işaretli.', 'g-kum-ozet'); const y = $('g-kum-ozet-yer'); bosalt(y); y.appendChild(GRAFIK_OZET.f); };
const gorunenGrafikleriCiz = () => {
  if (!ozet) return;
  if (S.gorunum === 'ozet') grafikCiz('kum-ozet');
  if (S.gorunum === 'analiz') Object.keys(GRAFIK).forEach((id) => grafikCiz(id));
};
const kaliteSatiri = (g, ek) => { const b = el('button', 'kl-ad'); b.type = 'button'; b.appendChild(avatar(g.cur.ad)); const m = el('span', 'kl-m'); m.appendChild(el('b', '', g.cur.ad || '—')); m.appendChild(el('span', 'mut', ek)); b.appendChild(m); b.addEventListener('click', () => detayAc(g, b)); return b; };
const kaliteCiz = () => {
  const y = $('kalite'); bosalt(y); const kal = ozet.kalite;
  const kart = (baslik, aciklama, n, govde) => {
    const s = el('section', 'kl-kart' + (n ? ' var' : ' temiz')); const ust = el('div', 'kl-ust'); ust.appendChild(el('b', 'kl-n', String(n))); const bs = el('div'); bs.appendChild(el('h3', '', baslik)); bs.appendChild(el('p', 'mut', n ? aciklama : 'Sorun görünmüyor.')); ust.appendChild(bs); s.appendChild(ust);
    if (n && govde) { const d = el('details', 'd-det'); d.appendChild(el('summary', '', 'Kayıtları göster')); const l = el('div', 'kl-liste'); govde(l); d.appendChild(l); s.appendChild(d); }
    return s;
  };
  y.appendChild(kart('Görevi boş kayıtlar', 'Görev alanı doldurulmamış; görev dağılımında “Belirtilmemiş” görünür.', kal.gorevBos.length, (l) => kal.gorevBos.forEach((g) => l.appendChild(kaliteSatiri(g, g.cur.kurum || 'Kurum yok')))));
  y.appendChild(kart('Olası mükerrer: aynı ad, farklı kurum', 'Aynı kişi iki farklı kurum adıyla yazmış olabilir; kontrol edin.', kal.mukerrerAd.length, (l) => kal.mukerrerAd.forEach((li) => { const w = el('div', 'kl-grup'); li.forEach((g) => w.appendChild(kaliteSatiri(g, g.cur.kurum || 'Kurum yok'))); l.appendChild(w); })));
  y.appendChild(kart('Olası mükerrer: aynı telefon, farklı ad', 'Aynı telefondan farklı adlarla bildirim gelmiş (numara burada gösterilmez).', kal.mukerrerTel.length, (l) => kal.mukerrerTel.forEach((li) => { const w = el('div', 'kl-grup'); li.forEach((g) => w.appendChild(kaliteSatiri(g, g.cur.kurum || 'Kurum yok'))); l.appendChild(w); })));
  y.appendChild(kart('Süre sonrası gelenler', 'Cumartesi 12.00’den sonra gelen bildirimler.', kal.gec.length, (l) => kal.gec.slice().sort((a, b) => b.cur.ms - a.cur.ms).forEach((g) => l.appendChild(kaliteSatiri(g, mutlak(g.cur.ms))))));
  y.appendChild(kart('Cevabını değiştirenler', 'Durumunu ya da kişi sayısını sonradan değiştirmiş.', kal.degisen.length, (l) => kal.degisen.forEach((g) => { const son = g.adimlar.filter((a) => a.fark.some((z) => z.tur === 'durum' || z.tur === 'kisi')).pop(); l.appendChild(kaliteSatiri(g, son.fark.filter((z) => z.tur === 'durum' || z.tur === 'kisi').map((z) => z.metin).join(' · '))); })));
};
const analizCiz = () => { kaliteCiz(); gorunenGrafikleriCiz(); };

// ---------- Mesajlar ----------
const mesajKart = (g, k, eskiMi) => {
  const f = el('figure', 'msg' + (eskiMi ? ' eski-m' : ''));
  f.appendChild(el('blockquote', '', k.mesaj));
  const c = el('figcaption', ''); c.appendChild(avatar(k.ad)); const t = el('span', 'msg-kim'); t.appendChild(el('b', '', k.ad));
  t.appendChild(el('span', 'mut', [k.kurum, k.gorev].filter(Boolean).join(' · ') + (eskiMi ? ' · eski bildirim' : '') + (k.durum === 'katilacak' ? '' : ' · ' + durumEtiket(k).toLocaleLowerCase('tr')) + ' · ' + mutlak(k.ms)));
  c.appendChild(t); f.appendChild(c); return f;
};
const mesajListesi = () => {
  const out = [];
  gruplar.forEach((g) => { if (g.cur.mesaj) out.push({ g, k: g.cur, eski: !g.cur.gecerli }); if (S.eskiMsj) g.eski.forEach((k) => { if (k.mesaj) out.push({ g, k, eski: true }); }); });
  return out.sort((a, b) => b.k.ms - a.k.ms);
};
const mesajlarCiz = () => {
  const yer = $('mesaj-yer'); bosalt(yer); const ml = mesajListesi();
  const sc = el('p', 'sonuc-sayi'); sc.appendChild(el('span', '', ml.length + ' mesaj'));
  const eskiVar = gruplar.some((g) => g.eski.some((k) => k.mesaj));
  if (eskiVar) { const l = el('label', 'esk-lbl'); const c = el('input'); c.type = 'checkbox'; c.checked = S.eskiMsj; c.addEventListener('change', () => { S.eskiMsj = c.checked; mesajlarCiz(); }); l.appendChild(c); l.appendChild(document.createTextNode('Eski bildirimlerdeki mesajları da göster')); sc.appendChild(l); }
  yer.appendChild(sc);
  if (!ml.length) { yer.appendChild(bosDurum('Henüz mesaj yok', 'Hocamıza yazılan mesajlar burada görünecek.', false)); return; }
  const ar = el('div', 'araclar2'); ar.appendChild(dugme('Mesajları kopyala', '', 'kopya', () => kopyala(ml))); ar.appendChild(dugme('Mesajları yazdır', '', 'yazdir', () => yazdir('mesaj', ml))); yer.appendChild(ar);
  const w = el('div', 'mesajlar'); ml.forEach((x) => w.appendChild(mesajKart(x.g, x.k, x.eski))); yer.appendChild(w);
};

// ---------- Dışa aktar ----------
const disariKur = () => {
  const y = $('disari-yer'); bosalt(y);
  const kart = (ikonAd, baslik, aciklama, ekler) => { const s = el('section', 'dk'); const u = el('div', 'dk-ust'); const i = el('span', 'dk-ikon'); i.appendChild(ikon(ikonAd, 24)); u.appendChild(i); const t = el('div'); t.appendChild(el('h3', '', baslik)); t.appendChild(el('p', 'mut', aciklama)); u.appendChild(t); s.appendChild(u); const a = el('div', 'dk-araclar'); ekler.forEach((e) => a.appendChild(e)); s.appendChild(a); return s; };
  const sel = el('select'); sel.id = 'yz-sira'; sel.setAttribute('aria-label', 'Kapı listesi sıralaması');
  [['ad', 'Ad sırası'], ['soyad', 'Soyad sırası'], ['kurum', 'Kurum sırası']].forEach(([v, m]) => { const o = el('option', '', m); o.value = v; sel.appendChild(o); });
  const kapi = dugme('Kapı listesi (yazdır)', 'birincil', 'yazdir', () => yazdir('kapi')); kapi.id = 'kapi-yaz';
  const rapor = dugme('Özet raporu (yazdır / PDF)', 'birincil', 'rapor', () => yazdir('rapor')); rapor.id = 'rapor-yaz';
  const csv = dugme('CSV indir', '', 'indir', csvIndir); csv.id = 'csv-indir';
  const msj = dugme('Mesajları yazdır', '', 'yazdir', () => yazdir('mesaj')); msj.id = 'mesaj-yaz';
  y.appendChild(kart('rapor', 'Özet raporu', 'KPI’lar, ana grafikler ve dağılımlar; A4, 1–2 sayfa. Telefon numarası içermez.', [rapor]));
  y.appendChild(kart('yazdir', 'Kapı listesi', 'Katılacak kayıtlar; onay kutuları ve boş satırlar. Telefon ve mesaj içermez.', [sel, kapi]));
  y.appendChild(kart('indir', 'CSV (Excel)', 'Ad, kurum, görev, durum, kişi, zaman, süre sonrası, mesaj. UTF-8, noktalı virgül; telefon içermez.', [csv]));
  y.appendChild(kart('mesaj', 'Hocamıza mesajlar', 'Tüm mesajlar tek baskı olarak.', [msj]));
};
