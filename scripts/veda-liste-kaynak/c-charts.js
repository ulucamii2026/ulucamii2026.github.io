/* Grafikler: elle çizilmiş satır içi SVG. Dış kitaplık yok. Her grafikte ipucu (dokun/üzerine gel/klavye) ve tablo yedeği vardır. */
// ---------- İpucu ----------
let ipucuEl = null;
const ipucuHazirla = () => {
  if (ipucuEl) return;
  ipucuEl = el('div', 'veri-ip'); ipucuEl.setAttribute('role', 'tooltip'); ipucuEl.id = 'ipucu'; ipucuEl.hidden = true; document.body.appendChild(ipucuEl);
  document.addEventListener('pointerdown', (e) => { if (!ipucuEl.hidden && !(e.target.closest && e.target.closest('.gk-govde'))) ipucuGizle(); }, true);
  window.addEventListener('scroll', () => ipucuGizle(), { passive: true });
};
const ipucuGizle = () => { if (ipucuEl) ipucuEl.hidden = true; };
const ipucuGoster = (baslik, satirlar, x, y) => {
  ipucuHazirla(); bosalt(ipucuEl);
  ipucuEl.appendChild(el('b', 'ip-b', baslik));
  satirlar.forEach((s) => {
    const d = el('div', 'ip-s');
    if (s.renk) { const r = el('i', 'ip-r'); r.style.background = s.renk; d.appendChild(r); }
    d.appendChild(el('span', '', s.etiket)); d.appendChild(el('strong', '', String(s.deger))); ipucuEl.appendChild(d);
  });
  ipucuEl.hidden = false;
  const r = ipucuEl.getBoundingClientRect(); const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  let l = x + 14, t = y - r.height - 14;
  if (l + r.width > vw - 8) l = x - r.width - 14;
  if (l < 8) l = Math.max(8, Math.min(vw - r.width - 8, x - r.width / 2));
  if (t < 8) t = Math.min(vh - r.height - 8, y + 18);
  ipucuEl.style.left = Math.round(l) + 'px'; ipucuEl.style.top = Math.round(t) + 'px';
};

// ---------- Ölçek / eksen ----------
const olcek = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / ((d1 - d0) || 1)) * (r1 - r0);
const yEksen = (max) => {
  const m = Math.max(max, 1); let adim = 1;
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]) { adim = s; if (m / s <= 4) break; }
  const n = Math.max(1, Math.ceil(m / adim)); const ticks = []; for (let i = 0; i <= n; i++) ticks.push(i * adim);
  return { max: n * adim, ticks };
};
const bosGrafik = (m) => el('p', 'gk-bos', m);

// ---------- Kart ----------
const grafikKarti = (baslik, alt, id) => {
  const f = el('figure', 'gk'); if (id) f.id = id;
  const c = el('figcaption', 'gk-baslik'); const ust = el('div', 'gk-ust'); ust.appendChild(el('h3', '', baslik)); const araclar = el('div', 'gk-araclar'); ust.appendChild(araclar); c.appendChild(ust);
  if (alt) c.appendChild(el('p', 'gk-alt', alt)); f.appendChild(c);
  const govde = el('div', 'gk-govde'); f.appendChild(govde);
  const lej = el('div', 'gk-lejant'); f.appendChild(lej);
  const tb = el('details', 'gk-tablo'); tb.appendChild(el('summary', '', 'Tablo olarak göster')); const tw = el('div', 'gk-tw'); tb.appendChild(tw); f.appendChild(tb);
  return { f, govde, lej, tw, araclar, alt: c.querySelector('.gk-alt') };
};
const lejantYaz = (lej, ogeler) => { bosalt(lej); ogeler.forEach((o) => { const s = el('span', 'lj'); const i = el('i', o.sinif); s.appendChild(i); s.appendChild(document.createTextNode(o.ad)); lej.appendChild(s); }); };
const tabloYaz = (tw, basliklar, satirlar) => {
  bosalt(tw); const t = el('table', 'gk-t'); const th = el('thead'); const hr = el('tr');
  basliklar.forEach((b) => { const h = el('th', '', b); h.scope = 'col'; hr.appendChild(h); }); th.appendChild(hr); t.appendChild(th);
  const tb = el('tbody'); satirlar.forEach((s) => { const r = el('tr'); s.forEach((h, i) => { const c = el(i ? 'td' : 'th', '', String(h)); if (!i) c.scope = 'row'; r.appendChild(c); }); tb.appendChild(r); }); t.appendChild(tb); tw.appendChild(t);
};
const svgKur = (w, h, etiket) => { const s = sv('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'gk-svg', role: 'img', 'aria-label': etiket, tabindex: '0', focusable: 'true' }); return s; };

// Bant (sütun / satır) grafikleri için ortak etkileşim
const bantEtkilesim = (svg, hedefler, ipucu, tik) => {
  let akt = -1;
  const goster = (i, x, y) => { akt = i; const d = ipucu(i); ipucuGoster(d.baslik, d.satirlar, x, y); };
  hedefler.forEach((r, i) => {
    const h = sv('rect', { x: r.x, y: r.y, width: Math.max(1, r.w), height: Math.max(1, r.h), class: 'hit' });
    h.addEventListener('pointerenter', (e) => goster(i, e.clientX, e.clientY));
    h.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') goster(i, e.clientX, e.clientY); });
    h.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') goster(i, e.clientX, e.clientY); });
    h.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') ipucuGizle(); });
    if (tik) h.addEventListener('click', () => tik(i));
    svg.appendChild(h);
  });
  svg.addEventListener('keydown', (e) => {
    if (!hedefler.length) return;
    let i = akt;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = Math.min(hedefler.length - 1, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = Math.max(0, i < 0 ? 0 : i - 1);
    else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = hedefler.length - 1;
    else if (e.key === 'Escape') { ipucuGizle(); return; }
    else if ((e.key === 'Enter' || e.key === ' ') && tik && akt >= 0) { e.preventDefault(); tik(akt); return; }
    else return;
    e.preventDefault(); if (i < 0) i = 0;
    const b = svg.getBoundingClientRect(); const r = hedefler[i];
    goster(i, b.left + r.x + r.w / 2, b.top + r.y + Math.min(r.h, 14));
  });
  svg.addEventListener('blur', () => ipucuGizle());
};

const GRID = (g, x1, x2, y) => g.appendChild(sv('line', { x1, x2, y1: y, y2: y, class: 'gr' }));

// ---------- Küçük çizgi (KPI) ----------
const kucukCizgi = (vals, sinif) => {
  const w = 72, h = 26, s = sv('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'spark ' + (sinif || ''), 'aria-hidden': 'true', focusable: 'false' });
  if (!vals.length) return s;
  const mx = Math.max(1, ...vals), mn = Math.min(0, ...vals); const x = olcek(0, Math.max(1, vals.length - 1), 2, w - 4), y = olcek(mn, mx, h - 3, 3);
  const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
  s.appendChild(sv('path', { d: d + 'L' + x(vals.length - 1).toFixed(1) + ' ' + (h - 1) + 'L' + x(0).toFixed(1) + ' ' + (h - 1) + 'Z', class: 'sp-alan' }));
  s.appendChild(sv('path', { d, class: 'sp-cizgi' }));
  s.appendChild(sv('circle', { cx: x(vals.length - 1), cy: y(vals[vals.length - 1]), r: 2.4, class: 'sp-nokta' }));
  return s;
};

// ---------- 1) Birikimli bildirimler ----------
const cizKum = (k, w, kompakt, baski) => {
  const o = ozet, tl = o.tl; bosalt(k.govde);
  if (!tl.length) { k.govde.appendChild(bosGrafik('Henüz bildirim yok.')); bosalt(k.tw); return; }
  const h = kompakt ? 176 : 250, m = { l: 32, r: 76, t: 24, b: 26 };
  const simdi = Date.now();
  const x0 = gunBasi(gunAnahtar(tl[0].ms));
  const x1 = Math.max(simdi, SON_YANIT) + (simdi < SON_YANIT ? 5 * 3600000 : 2 * 3600000);
  const son = tl[tl.length - 1];
  const ye = yEksen(Math.max(son.kisi, son.kayit, 1));
  const X = olcek(x0, x1, m.l, w - m.r), Y = olcek(0, ye.max, h - m.b, m.t);
  const svg = svgKur(w, h, 'Birikimli bildirimler: şu ana kadar ' + son.kisi + ' katılacak kişi, ' + son.kayit + ' kayıt.');
  const g = sv('g'); svg.appendChild(g);
  ye.ticks.forEach((t) => { GRID(g, m.l, w - m.r, Y(t)); g.appendChild(sv('text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'ek' }, String(t))); });
  const span = gunFark(gunAnahtar(x1), gunAnahtar(x0)); const adim = span <= 7 ? 1 : (span <= 14 ? 2 : 3); let sonX = -99;
  for (let d = gunAnahtar(x0), i = 0; d <= gunAnahtar(x1); d = gunEkle(d, 1), i++) {
    const px = X(gunBasi(d)); if (px < m.l - 1 || px > w - m.r + 1) continue;
    g.appendChild(sv('line', { x1: px, x2: px, y1: h - m.b, y2: h - m.b + 4, class: 'tk' }));
    if (i % adim === 0 && px - sonX >= 36) { g.appendChild(sv('text', { x: px, y: h - 8, 'text-anchor': 'middle', class: 'ek' }, gunAyAnahtar(d))); sonX = px; }
  }
  const bitisMs = Math.min(simdi, x1);
  const yol = (alan) => {
    let d = 'M' + X(x0).toFixed(1) + ' ' + Y(0).toFixed(1); let py = 0;
    tl.forEach((e) => { const x = X(e.ms).toFixed(1); d += 'H' + x + 'V' + Y(e[alan]).toFixed(1); py = e[alan]; });
    d += 'H' + X(Math.max(bitisMs, son.ms)).toFixed(1); return d;
  };
  const dK = yol('kisi');
  svg.appendChild(sv('path', { d: dK + 'V' + Y(0).toFixed(1) + 'H' + X(x0).toFixed(1) + 'Z', class: 'alan-kisi' }));
  svg.appendChild(sv('path', { d: yol('kayit'), class: 'cz-kayit' }));
  svg.appendChild(sv('path', { d: dK, class: 'cz-kisi' }));
  // İşaretler: son yanıt ve şimdi
  const isaret = (ms, ad, sinif, alta) => {
    if (ms < x0 || ms > x1) return;
    const px = X(ms); svg.appendChild(sv('line', { x1: px, x2: px, y1: m.t - 6, y2: h - m.b, class: sinif }));
    const sag = px > w - m.r - 90; svg.appendChild(sv('text', { x: sag ? px - 4 : px + 4, y: alta ? h - m.b - 6 : m.t - 10, 'text-anchor': sag ? 'end' : 'start', class: 'isaret halo' }, ad));
  };
  isaret(SON_YANIT, 'Son yanıt · Cmt 12.00', 'ms-son', false);
  if (simdi <= x1) isaret(simdi, 'şimdi', 'ms-simdi', true);
  // Uç etiketleri
  const ex = Math.min(X(bitisMs), w - m.r) + 6; let yk = Y(son.kisi), yr = Y(son.kayit);
  if (Math.abs(yk - yr) < 13) { if (yk <= yr) { yk -= 6; yr += 7; } else { yr -= 6; yk += 7; } }
  svg.appendChild(sv('text', { x: ex, y: yk + 4, class: 'uc t-kisi' }, 'Kişi ' + son.kisi));
  svg.appendChild(sv('text', { x: ex, y: yr + 4, class: 'uc t-kayit' }, 'Kayıt ' + son.kayit));
  // Etkileşim
  if (!baski) {
    const ch = sv('line', { y1: m.t, y2: h - m.b, class: 'ch', visibility: 'hidden' }), d1 = sv('circle', { r: 4, class: 'dt-kisi', visibility: 'hidden' }), d2 = sv('circle', { r: 4, class: 'dt-kayit', visibility: 'hidden' });
    svg.appendChild(ch); svg.appendChild(d1); svg.appendChild(d2);
    let idx = -1;
    const goster = (ms, cx, cy) => {
      const t = Math.min(Math.max(ms, tl[0].ms), Math.min(simdi, x1) > son.ms ? Math.min(simdi, x1) : son.ms); const e = tlDurum(tl, t); const px = X(t);
      ch.setAttribute('x1', px); ch.setAttribute('x2', px); d1.setAttribute('cx', px); d1.setAttribute('cy', Y(e.kisi)); d2.setAttribute('cx', px); d2.setAttribute('cy', Y(e.kayit));
      [ch, d1, d2].forEach((n) => n.setAttribute('visibility', 'visible'));
      ipucuGoster(gunEtiket(t) + ' · ' + saatDk(t) + (t > SON_YANIT ? ' (süre sonrası)' : ''), [{ renk: 'var(--c1)', etiket: 'Katılacak kişi', deger: e.kisi }, { renk: 'var(--c2)', etiket: 'Katılacak kayıt', deger: e.kayit }, { renk: 'var(--cn)', etiket: 'Katılamayacak', deger: e.yok }], cx, cy);
    };
    const kapat = () => { [ch, d1, d2].forEach((n) => n.setAttribute('visibility', 'hidden')); ipucuGizle(); };
    const hit = sv('rect', { x: m.l, y: m.t, width: Math.max(1, w - m.l - m.r), height: h - m.t - m.b, class: 'hit' });
    const konum = (e) => { const b = svg.getBoundingClientRect(); const px = e.clientX - b.left; return x0 + (px - m.l) / ((w - m.r) - m.l) * (x1 - x0); };
    hit.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') goster(konum(e), e.clientX, e.clientY); });
    hit.addEventListener('pointerdown', (e) => { goster(konum(e), e.clientX, e.clientY); });
    hit.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') kapat(); });
    svg.appendChild(hit);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { kapat(); return; }
      if (!/^Arrow(Left|Right)$/.test(e.key) && e.key !== 'Home' && e.key !== 'End') return; e.preventDefault();
      if (e.key === 'Home') idx = 0; else if (e.key === 'End') idx = tl.length - 1; else idx = Math.max(0, Math.min(tl.length - 1, (idx < 0 ? tl.length : idx) + (e.key === 'ArrowRight' ? 1 : -1)));
      const b = svg.getBoundingClientRect(); goster(tl[idx].ms, b.left + X(tl[idx].ms), b.top + Y(tl[idx].kisi));
    });
    svg.addEventListener('blur', kapat);
  }
  k.govde.appendChild(svg);
  lejantYaz(k.lej, [{ sinif: 'k-kisi', ad: 'Katılacak kişi' }, { sinif: 'k-kayit', ad: 'Katılacak kayıt' }, { sinif: 'k-cizgi', ad: 'Son yanıt' }]);
  const n = Math.min(40, gunFark(gunAnahtar(Math.max(simdi, son.ms)), gunAnahtar(tl[0].ms)) + 1);
  tabloYaz(k.tw, ['Gün sonu', 'Katılacak kişi', 'Katılacak kayıt', 'Katılamayacak'], gunSonlari(tl, n).map((r) => [gunAyAnahtar(r.d), r.kisi, r.kayit, r.yok]));
};

// ---------- 2) Günlük / saatlik çubuklar ----------
const cizGun = (k, w, baski) => {
  const o = ozet; bosalt(k.govde);
  const simdi = Date.now(); const mod = S.gunMod; let oge = [];
  if (mod === 'saat') {
    for (let i = 71; i >= 0; i--) { const ms = simdi - i * 3600000; const sk = saatAnahtar(ms); const r = o.saat.get(sk) || { once: 0, sonra: 0 }; const p = parca(ms); oge.push({ sk, once: r.once, sonra: r.sonra, ad: p.d + '.' + p.m + ' ' + p.h + '.00–' + p.h + '.59', baslangic: Math.floor(ms / 3600000) * 3600000, p }); }
  } else {
    const keys = Array.from(o.gun.keys()).sort(); const bugun = gunAnahtar(simdi);
    if (!keys.length) { k.govde.appendChild(bosGrafik('Henüz bildirim yok.')); bosalt(k.tw); return; }
    let son = keys[keys.length - 1] > bugun ? keys[keys.length - 1] : bugun; let b = keys[0]; if (gunFark(son, b) > 20) b = gunEkle(son, -20);
    for (let d = b; d <= son; d = gunEkle(d, 1)) { const r = o.gun.get(d) || { once: 0, sonra: 0 }; oge.push({ d, once: r.once, sonra: r.sonra, ad: haftaGunu(d) + ' ' + gunAyAnahtar(d) }); }
  }
  const toplam = (r) => r.once + r.sonra; const en = Math.max(1, ...oge.map(toplam)); const ye = yEksen(en);
  const h = 190, m = { l: 28, r: 8, t: 20, b: 26 };
  const X0 = m.l, XW = w - m.l - m.r; const band = XW / oge.length; const bw = Math.max(2, Math.min(band * 0.72, 34));
  const Y = olcek(0, ye.max, h - m.b, m.t);
  const svg = svgKur(w, h, (mod === 'saat' ? 'Saatlik' : 'Günlük') + ' bildirim sayıları. Toplam ' + oge.reduce((t, r) => t + toplam(r), 0) + ' kayıt.');
  ye.ticks.forEach((t) => { GRID(svg, m.l, w - m.r, Y(t)); svg.appendChild(sv('text', { x: m.l - 5, y: Y(t) + 4, 'text-anchor': 'end', class: 'ek' }, String(t))); });
  let sonX = -99; const hedef = [];
  oge.forEach((r, i) => {
    const cx = X0 + band * i + band / 2; const x = cx - bw / 2;
    let yy = Y(0);
    const yaz = (n, sinif) => { if (!n) return; const hh = Y(0) - Y(n); const yk = yy - hh; svg.appendChild(sv('rect', { x, y: yk + (yy < Y(0) ? 1 : 0), width: bw, height: Math.max(1, hh - (yy < Y(0) ? 1 : 0)), rx: 1.5, class: sinif })); yy = yk; };
    yaz(r.once, 'b-once'); yaz(r.sonra, 'b-sonra');
    const etiket = mod === 'saat' ? (Number(r.p.h) % 12 === 0 ? (r.p.h === '00' ? r.p.d + '.' + r.p.m : r.p.h + '.00') : '') : (oge.length > 12 ? (i % 2 === 0 ? r.d.slice(8) : '') : r.d.slice(8));
    if (etiket && cx - sonX >= 26) { svg.appendChild(sv('text', { x: cx, y: h - 8, 'text-anchor': 'middle', class: 'ek' }, etiket)); sonX = cx; }
    if (toplam(r) === en && en > 0) svg.appendChild(sv('text', { x: cx, y: yy - 4, 'text-anchor': 'middle', class: 'ek en' }, String(en)));
    hedef.push({ x: X0 + band * i, y: m.t, w: band, h: h - m.t - m.b });
  });
  // son yanıt işareti
  let sx = null;
  if (mod === 'saat') { const i = oge.findIndex((r) => r.baslangic <= SON_YANIT && SON_YANIT < r.baslangic + 3600000); if (i >= 0) sx = X0 + band * i + band * ((SON_YANIT - oge[i].baslangic) / 3600000); }
  else { const i = oge.findIndex((r) => r.d === gunAnahtar(SON_YANIT)); if (i >= 0) sx = X0 + band * i + band / 2; }
  if (sx != null) { svg.appendChild(sv('line', { x1: sx, x2: sx, y1: m.t - 4, y2: h - m.b, class: 'ms-son' })); const sag = sx > w - 120; svg.appendChild(sv('text', { x: sag ? sx - 4 : sx + 4, y: m.t - 8, 'text-anchor': sag ? 'end' : 'start', class: 'isaret halo' }, 'Son yanıt · Cmt 12.00')); }
  if (!baski) bantEtkilesim(svg, hedef, (i) => { const r = oge[i]; return { baslik: r.ad, satirlar: [{ renk: 'var(--c1)', etiket: 'Süre içinde', deger: r.once }, { renk: 'var(--cn)', etiket: 'Süre sonrası', deger: r.sonra }, { etiket: 'Toplam', deger: toplam(r) }] }; });
  k.govde.appendChild(svg);
  lejantYaz(k.lej, [{ sinif: 'k-kisi', ad: 'süre içinde' }, { sinif: 'k-nt', ad: 'süre sonrası' }, { sinif: 'k-cizgi', ad: 'son yanıt saati' }]);
  tabloYaz(k.tw, [mod === 'saat' ? 'Saat' : 'Gün', 'Süre içinde', 'Süre sonrası', 'Toplam'], oge.filter((r) => toplam(r) > 0 || mod === 'gun').map((r) => [r.ad, r.once, r.sonra, toplam(r)]));
};

// ---------- 3) Katılım durumu ----------
const cizDurum = (k, w, baski) => {
  const o = ozet; bosalt(k.govde); const h = 64; const a = o.hesap.kat, b = o.hesap.yok, t = a + b;
  if (!t) { k.govde.appendChild(bosGrafik('Henüz kayıt yok.')); bosalt(k.tw); return; }
  const svg = svgKur(w, h, 'Katılım durumu: ' + a + ' katılacak, ' + b + ' katılamayacak kayıt.'); const m = { l: 2, r: 2 }; const W = w - m.l - m.r; const gap = a && b ? 2 : 0;
  const wa = a ? Math.max(4, (W - gap) * a / t) : 0, wb = W - gap - wa; const hedef = [];
  const dilim = (x, ww, sinif, ad, n, kisi) => {
    svg.appendChild(sv('rect', { x, y: 12, width: Math.max(0, ww), height: 30, rx: 3, class: sinif }));
    const yuzde = Math.round(n / t * 100) + '%';
    if (ww > 78) svg.appendChild(sv('text', { x: x + 10, y: 32, class: 'ic-yazi' }, n + ' · ' + yuzde));
    hedef.push({ x, y: 4, w: ww, h: 46, ad, n, kisi });
  };
  if (a) dilim(m.l, wa, 'b-once', 'Katılacak', a, o.hesap.kisi); if (b) dilim(m.l + wa + gap, wb, 'b-yok', 'Katılamayacak', b, 0);
  svg.appendChild(sv('text', { x: m.l, y: 58, class: 'ek' }, '0%')); svg.appendChild(sv('text', { x: w - m.r, y: 58, 'text-anchor': 'end', class: 'ek' }, '100%'));
  if (!baski) bantEtkilesim(svg, hedef, (i) => { const r = hedef[i]; return { baslik: r.ad, satirlar: [{ etiket: 'Kayıt', deger: r.n + ' (' + Math.round(r.n / t * 100) + '%)' }].concat(r.kisi ? [{ etiket: 'Kişi', deger: r.kisi }] : []) }; });
  k.govde.appendChild(svg);
  lejantYaz(k.lej, [{ sinif: 'k-kisi', ad: 'Katılacak: ' + a + ' kayıt, ' + o.hesap.kisi + ' kişi' }, { sinif: 'k-nt', ad: 'Katılamayacak: ' + b + ' kayıt' }]);
  if (a) { const ort = (o.hesap.kisi / a).toFixed(1).replace('.', ','); const p = el('p', 'gk-not', 'Katılacak kayıtlarda ortalama ' + ort + ' kişi · yanıt verenlerin %' + Math.round(a / t * 100) + '’i katılıyor.'); k.lej.appendChild(p); }
  tabloYaz(k.tw, ['Durum', 'Kayıt', 'Pay', 'Kişi'], [['Katılacak', a, Math.round(a / t * 100) + '%', o.hesap.kisi], ['Katılamayacak', b, Math.round(b / t * 100) + '%', '—']]);
};

// ---------- 4) Görev × durum (yığılmış yatay) ----------
const cizGorev = (k, w, baski) => {
  const o = ozet; bosalt(k.govde); const L = o.gorevDurum;
  if (!L.length) { k.govde.appendChild(bosGrafik('Henüz kayıt yok.')); bosalt(k.tw); return; }
  const satir = 34, h = L.length * satir + 6; const lw = Math.max(92, Math.min(170, w * 0.32)); const sagM = 34;
  const en = Math.max(1, ...L.map((g) => g.kat + g.yok)); const X = olcek(0, en, 0, w - lw - sagM);
  const svg = svgKur(w, h, 'Görev ve duruma göre kayıtlar.'); const hedef = [];
  L.forEach((g, i) => {
    const y = 4 + i * satir; svg.appendChild(sv('text', { x: 0, y: y + 19, class: 'et' }, kisalt(gorevAd(g.key ? g.ad : ''), Math.floor(lw / 7.4))));
    let x = lw; const par = (n, sinif) => { if (!n) return; const ww = Math.max(3, X(n) - 1); svg.appendChild(sv('rect', { x, y: y + 5, width: ww, height: 20, rx: 2, class: sinif })); if (ww > 22) svg.appendChild(sv('text', { x: x + ww / 2, y: y + 19.5, 'text-anchor': 'middle', class: 'ic-yazi k' }, String(n))); x += ww + 2; };
    par(g.kat, 'b-once'); par(g.yok, 'b-yok');
    svg.appendChild(sv('text', { x: x + 2, y: y + 19.5, class: 'deg' }, String(g.kat + g.yok)));
    hedef.push({ x: 0, y, w, h: satir });
  });
  if (!baski) bantEtkilesim(svg, hedef, (i) => { const g = L[i]; return { baslik: gorevAd(g.key ? g.ad : ''), satirlar: [{ renk: 'var(--c1)', etiket: 'Katılacak', deger: g.kat + ' kayıt · ' + g.kisi + ' kişi' }, { renk: 'var(--cn)', etiket: 'Katılamayacak', deger: g.yok }, { etiket: 'Dokununca liste bu göreve süzülür', deger: '' }] }; }, (i) => { const g = L[i]; if (g) suzGit({ tur: 'gorev', key: g.key, ad: gorevAd(g.key ? g.ad : '') }); });
  k.govde.appendChild(svg);
  lejantYaz(k.lej, [{ sinif: 'k-kisi', ad: 'Katılacak' }, { sinif: 'k-nt', ad: 'Katılamayacak' }]);
  tabloYaz(k.tw, ['Görev', 'Katılacak kayıt', 'Katılacak kişi', 'Katılamayacak'], L.map((g) => [gorevAd(g.key ? g.ad : ''), g.kat, g.kisi, g.yok]));
};

// ---------- 5) Grup büyüklüğü ----------
const cizBuyukluk = (k, w, baski) => {
  const o = ozet; bosalt(k.govde); const L = o.buyukluk; const toplamK = L.reduce((t, r) => t + r.kayit, 0);
  if (!toplamK) { k.govde.appendChild(bosGrafik('Henüz katılacak kayıt yok.')); bosalt(k.tw); return; }
  const h = 176, m = { l: 28, r: 6, t: 22, b: 36 }; const en = Math.max(...L.map((r) => r.kayit)); const ye = yEksen(en); const Y = olcek(0, ye.max, h - m.b, m.t);
  const band = (w - m.l - m.r) / L.length; const bw = Math.min(46, band * 0.62);
  const svg = svgKur(w, h, 'Kayıt başına kişi sayısı dağılımı.'); const hedef = [];
  ye.ticks.forEach((t) => { GRID(svg, m.l, w - m.r, Y(t)); svg.appendChild(sv('text', { x: m.l - 5, y: Y(t) + 4, 'text-anchor': 'end', class: 'ek' }, String(t))); });
  L.forEach((r, i) => {
    const cx = m.l + band * i + band / 2;
    if (r.kayit) { svg.appendChild(sv('rect', { x: cx - bw / 2, y: Y(r.kayit), width: bw, height: Y(0) - Y(r.kayit), rx: 2, class: 'b-once' })); svg.appendChild(sv('text', { x: cx, y: Y(r.kayit) - 5, 'text-anchor': 'middle', class: 'deg c' }, String(r.kayit))); }
    svg.appendChild(sv('text', { x: cx, y: h - 18, 'text-anchor': 'middle', class: 'et c' }, r.ad)); svg.appendChild(sv('text', { x: cx, y: h - 5, 'text-anchor': 'middle', class: 'ek' }, 'kişi'));
    hedef.push({ x: m.l + band * i, y: m.t, w: band, h: h - m.t - m.b });
  });
  if (!baski) bantEtkilesim(svg, hedef, (i) => { const r = L[i]; return { baslik: r.ad + ' kişilik kayıtlar', satirlar: [{ etiket: 'Kayıt', deger: r.kayit }, { etiket: 'Toplam kişi', deger: r.kisi }] }; });
  k.govde.appendChild(svg); bosalt(k.lej);
  tabloYaz(k.tw, ['Kayıttaki kişi', 'Kayıt', 'Toplam kişi'], L.map((r) => [r.ad, r.kayit, r.kisi]));
};

// ---------- 6) Kurum sıralaması ----------
const kurumListesi = () => {
  const ku = ozet.kurumlar; const ilk = ku.slice(0, 10); const kalan = ku.slice(10);
  const L = ilk.map((x) => ({ key: x.key, ad: x.ad, kisi: x.kisi, kayit: x.kayit }));
  if (kalan.length) L.push({ key: null, ad: 'Diğer ' + kalan.length + ' kurum', kisi: kalan.reduce((t, x) => t + x.kisi, 0), kayit: kalan.reduce((t, x) => t + x.kayit, 0), diger: true });
  return L;
};
const cizKurum = (k, w, baski) => {
  bosalt(k.govde); const L = kurumListesi();
  if (!L.length) { k.govde.appendChild(bosGrafik('Henüz katılacak kayıt yok.')); bosalt(k.tw); return; }
  const satir = 30, h = L.length * satir + 6; const lw = Math.max(100, Math.min(250, w * 0.34)); const deger = w > 520 ? 118 : 74;
  const en = Math.max(1, ...L.map((x) => x.kisi)); const X = olcek(0, en, 0, Math.max(30, w - lw - deger));
  const svg = svgKur(w, h, 'Kuruma göre katılacak kişi sayısı, ilk 10.'); const hedef = [];
  L.forEach((x, i) => {
    const y = 4 + i * satir; svg.appendChild(sv('text', { x: 0, y: y + 19, class: 'et' }, kisalt(x.ad, Math.floor(lw / 7.4))));
    svg.appendChild(sv('rect', { x: lw, y: y + 5, width: Math.max(3, X(x.kisi)), height: 20, rx: 2, class: x.diger ? 'b-yok' : 'b-once' }));
    svg.appendChild(sv('text', { x: lw + Math.max(3, X(x.kisi)) + 6, y: y + 19.5, class: 'deg' }, w > 520 ? x.kisi + ' kişi · ' + x.kayit + ' kayıt' : x.kisi + ' (' + x.kayit + ')'));
    hedef.push({ x: 0, y, w, h: satir });
  });
  if (!baski) bantEtkilesim(svg, hedef, (i) => { const x = L[i]; return { baslik: x.ad, satirlar: [{ etiket: 'Katılacak kişi', deger: x.kisi }, { etiket: 'Kayıt', deger: x.kayit }].concat(x.diger ? [] : [{ etiket: 'Dokununca liste bu kuruma süzülür', deger: '' }]) }; }, (i) => { const x = L[i]; if (x && !x.diger) suzGit({ tur: 'kurum', key: x.key, ad: x.ad }); });
  k.govde.appendChild(svg); bosalt(k.lej);
  tabloYaz(k.tw, ['Kurum', 'Katılacak kişi', 'Kayıt'], L.map((x) => [x.ad, x.kisi, x.kayit]));
};

// ---------- 7) Günün saatine göre dağılım ----------
const cizSaat = (k, w, baski) => {
  const o = ozet; bosalt(k.govde); const dag = o.saatDagilim; const top = dag.reduce((t, n) => t + n, 0);
  if (!top) { k.govde.appendChild(bosGrafik('Henüz bildirim yok.')); bosalt(k.tw); return; }
  const h = 150, m = { l: 28, r: 6, t: 20, b: 24 }; const en = Math.max(...dag); const ye = yEksen(en); const Y = olcek(0, ye.max, h - m.b, m.t);
  const band = (w - m.l - m.r) / 24; const bw = Math.max(3, band * 0.7);
  const svg = svgKur(w, h, 'Bildirimlerin günün saatine dağılımı (Brüksel saati).'); const hedef = [];
  ye.ticks.forEach((t) => { GRID(svg, m.l, w - m.r, Y(t)); svg.appendChild(sv('text', { x: m.l - 5, y: Y(t) + 4, 'text-anchor': 'end', class: 'ek' }, String(t))); });
  dag.forEach((n, i) => {
    const cx = m.l + band * i + band / 2;
    if (n) svg.appendChild(sv('rect', { x: cx - bw / 2, y: Y(n), width: bw, height: Y(0) - Y(n), rx: 1.5, class: 'b-once' }));
    if (n === en) svg.appendChild(sv('text', { x: cx, y: Y(n) - 4, 'text-anchor': 'middle', class: 'ek en' }, String(n)));
    if (i % 3 === 0) svg.appendChild(sv('text', { x: cx, y: h - 8, 'text-anchor': 'middle', class: 'ek' }, (i < 10 ? '0' : '') + i));
    hedef.push({ x: m.l + band * i, y: m.t, w: band, h: h - m.t - m.b });
  });
  if (!baski) bantEtkilesim(svg, hedef, (i) => ({ baslik: (i < 10 ? '0' : '') + i + '.00–' + (i < 10 ? '0' : '') + i + '.59', satirlar: [{ etiket: 'Bildirim', deger: dag[i] }, { etiket: 'Pay', deger: Math.round(dag[i] / top * 100) + '%' }] }));
  k.govde.appendChild(svg); bosalt(k.lej);
  tabloYaz(k.tw, ['Saat', 'Bildirim'], dag.map((n, i) => [(i < 10 ? '0' : '') + i + '.00', n]).filter((r) => r[1] > 0));
};
