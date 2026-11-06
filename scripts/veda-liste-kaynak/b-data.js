/* Veri modeli: savunmacı ayrıştırma, gruplar (aynı ad+kurum), sürüm geçmişi, zaman çizelgesi, kırılımlar, veri kalitesi. */
const tek = (v) => (v == null ? '' : String(typeof v === 'object' ? '' : v)).trim();
const kisiSayisi = (v) => { const n = Math.round(Number(v)); return isFinite(n) && n >= 1 ? Math.min(n, 99) : 1; };
const kayitHazirla = (k, i) => {
  if (!k || typeof k !== 'object') return null;
  const ms = Date.parse(k.zaman);
  const kat = k.durum === 'katilacak';
  return { i, id: (isNaN(ms) ? 0 : ms) + '|' + tek(k.ad) + '|' + tek(k.kurum) + '|' + (kat ? 'k' + kisiSayisi(k.kisi) : 'y'), ad: tek(k.ad), kurum: tek(k.kurum), gorev: tek(k.gorev), telefon: tek(k.telefon), durum: kat ? 'katilacak' : (k.durum === 'katilamayacak' ? 'katilamayacak' : 'belirsiz'), kisi: kat ? kisiSayisi(k.kisi) : 0, ms: isNaN(ms) ? 0 : ms, gecerli: !!k.gecerli, mesaj: tek(k.mesaj) };
};
const telAnahtar = (t) => { const d = String(t || '').replace(/\D/g, ''); return d.length >= 8 ? d.slice(-9) : ''; };
const durumEtiket = (k) => (k.durum === 'katilacak' ? 'Katılacak' : (k.durum === 'katilamayacak' ? 'Katılamayacak' : 'Durum belirsiz'));
const gorevAd = (g) => g || 'Belirtilmemiş';

// Sürümler arası fark (eskiden yeniye); telefon değerleri ASLA metne girmez.
const farklar = (a, b) => {
  const f = [];
  if (a.durum !== b.durum) f.push({ tur: 'durum', metin: durumEtiket(a) + ' → ' + durumEtiket(b) + (b.durum === 'katilacak' ? ' (' + b.kisi + ' kişi)' : '') });
  else if (a.durum === 'katilacak' && a.kisi !== b.kisi) f.push({ tur: 'kisi', metin: a.kisi + ' → ' + b.kisi + ' kişi' });
  if (a.gorev !== b.gorev) f.push({ tur: 'gorev', metin: 'Görev: ' + (a.gorev || 'belirtilmedi') + ' → ' + (b.gorev || 'belirtilmedi') });
  if (a.kurum !== b.kurum) f.push({ tur: 'kurum', metin: 'Kurum yazımı: ' + (a.kurum || '—') + ' → ' + (b.kurum || '—') });
  if (a.mesaj !== b.mesaj) f.push({ tur: 'mesaj', metin: !a.mesaj ? 'Mesaj eklendi' : (!b.mesaj ? 'Mesaj kaldırıldı' : 'Mesaj değişti') });
  if (telAnahtar(a.telefon) !== telAnahtar(b.telefon) || (a.telefon !== b.telefon && tel(a.telefon) !== tel(b.telefon))) f.push({ tur: 'tel', metin: 'Telefon güncellendi' });
  return f;
};

const islet = (v) => {
  const hepsi = [];
  v.kayitlar.forEach((k, i) => { const h = kayitHazirla(k, i); if (h) hepsi.push(h); });
  const harita = new Map();
  hepsi.forEach((k) => { const a = trn(k.ad) + '|' + trn(k.kurum); (harita.get(a) || harita.set(a, []).get(a)).push(k); });
  const gruplar = [];
  harita.forEach((liste, a) => {
    liste.sort((x, y) => y.ms - x.ms || y.i - x.i);
    const cur = liste.find((x) => x.gecerli) || liste[0];
    const surum = liste.slice().reverse();            // eskiden yeniye
    const adimlar = surum.map((x, j) => ({ k: x, fark: j ? farklar(surum[j - 1], x) : [] }));
    const g = { key: a, cur, eski: liste.filter((x) => x !== cur), surum, adimlar, ara: trn(cur.ad + ' ' + cur.kurum + ' ' + cur.gorev), adKey: trn(cur.ad), gkey: trn(cur.gorev), kkey: trn(cur.kurum), tk: telAnahtar(cur.telefon) };
    g.degisti = adimlar.some((s) => s.fark.some((x) => x.tur === 'durum' || x.tur === 'kisi'));
    gruplar.push(g);
  });
  gruplar.forEach((g) => { g.gec = g.cur.ms > SON_YANIT; g.buyuk = g.cur.durum === 'katilacak' && g.cur.kisi >= 3; });

  const cur = gruplar.map((g) => g.cur);
  const kat = cur.filter((k) => k.durum === 'katilacak');
  const simdi = Date.now(); const bugun = gunAnahtar(simdi);
  const o = {
    kat: kat.length, kisi: kat.reduce((t, k) => t + k.kisi, 0), yok: cur.filter((k) => k.durum === 'katilamayacak').length, msj: cur.filter((k) => k.mesaj).length,
    bugun: cur.filter((k) => k.ms && gunAnahtar(k.ms) === bugun).length,
    son24: cur.filter((k) => k.ms && simdi - k.ms <= 86400000 && simdi - k.ms >= -60000).length,
    son24kisi: kat.filter((k) => k.ms && simdi - k.ms <= 86400000 && simdi - k.ms >= -60000).reduce((t, k) => t + k.kisi, 0),
    sonra: cur.filter((k) => k.ms > SON_YANIT).length,
  };
  o.hesap = { kat: o.kat, kisi: o.kisi, yok: o.yok };
  if (v.toplam) { o.kat = Number(v.toplam.katilacakKayit) || 0; o.kisi = Number(v.toplam.katilacakKisi) || 0; o.yok = Number(v.toplam.katilamayacak) || 0; }

  // Görev × durum
  const gm = new Map();
  cur.forEach((k) => {
    const key = trn(k.gorev);
    const a = gm.get(key) || gm.set(key, { key, ad: key ? k.gorev : 'Belirtilmemiş', kat: 0, yok: 0, kisi: 0 }).get(key);
    if (k.durum === 'katilacak') { a.kat++; a.kisi += k.kisi; } else if (k.durum === 'katilamayacak') a.yok++;
  });
  const sira = (g) => { const i = GOREVLER.findIndex((x) => trn(x) === g.key); return i >= 0 ? i : (g.key ? 10 : 99); };
  o.gorevDurum = Array.from(gm.values()).sort((x, y) => sira(x) - sira(y) || kol.compare(x.ad, y.ad));
  o.gorevler = o.gorevDurum.filter((g) => g.kat > 0).map((g) => ({ key: g.key, ad: g.ad, kisi: g.kisi, kayit: g.kat })).sort((x, y) => y.kisi - x.kisi || kol.compare(x.ad, y.ad));

  // Kurum sıralaması (katılacak kişi)
  const km = new Map();
  const buyukMu = (s) => s === s.toLocaleUpperCase('tr') && s !== s.toLocaleLowerCase('tr');
  kat.forEach((k) => {
    const kk = trn(k.kurum);
    const b = km.get(kk) || km.set(kk, { key: kk, adlar: new Map(), kisi: 0, kayit: 0 }).get(kk); b.kisi += k.kisi; b.kayit++;
    const r = b.adlar.get(k.kurum) || b.adlar.set(k.kurum, { n: 0, ms: 0 }).get(k.kurum); r.n++; r.ms = Math.max(r.ms, k.ms);
  });
  o.kurumlar = Array.from(km.values()).map((b) => {
    let en = null; b.adlar.forEach((r, ad) => { if (!en || r.n > en.r.n || (r.n === en.r.n && ((buyukMu(en.ad) && !buyukMu(ad)) || (buyukMu(en.ad) === buyukMu(ad) && r.ms > en.r.ms)))) en = { ad, r }; });
    return { key: b.key, ad: (en && en.ad) || 'Belirtilmemiş', kisi: b.kisi, kayit: b.kayit };
  }).sort((x, y) => y.kisi - x.kisi || kol.compare(x.ad, y.ad));

  // Günlük / saatlik / saat-dağılımı
  const gun = new Map(), saat = new Map(), dag = new Array(24).fill(0);
  cur.forEach((k) => {
    if (!k.ms) return;
    const d = gunAnahtar(k.ms); const r = gun.get(d) || gun.set(d, { once: 0, sonra: 0 }).get(d); if (k.ms > SON_YANIT) r.sonra++; else r.once++;
    const sk = saatAnahtar(k.ms); const s = saat.get(sk) || saat.set(sk, { once: 0, sonra: 0 }).get(sk); if (k.ms > SON_YANIT) s.sonra++; else s.once++;
    dag[Number(parca(k.ms).h)]++;
  });
  o.gun = gun; o.saat = saat; o.saatDagilim = dag;

  // Grup büyüklükleri
  const bk = [0, 0, 0, 0, 0], bkk = [0, 0, 0, 0, 0];
  kat.forEach((k) => { const i = Math.min(k.kisi, 5) - 1; bk[i]++; bkk[i] += k.kisi; });
  o.buyukluk = bk.map((n, i) => ({ ad: i === 4 ? '5+' : String(i + 1), kayit: n, kisi: bkk[i] }));

  // Zaman çizelgesi: tüm sürümler, her grup için "o ana kadarki son sürüm" mantığıyla
  const olaylar = [];
  gruplar.forEach((g) => g.surum.forEach((k) => { if (k.ms) olaylar.push({ ms: k.ms, g, k }); }));
  olaylar.sort((a, b) => a.ms - b.ms || a.k.i - b.k.i);
  const durumlar = new Map(); let ck = 0, cr = 0, cy = 0;
  const tl = [];
  olaylar.forEach((e) => {
    const eski = durumlar.get(e.g.key);
    if (eski) { if (eski.durum === 'katilacak') { ck -= eski.kisi; cr--; } else if (eski.durum === 'katilamayacak') cy--; }
    durumlar.set(e.g.key, e.k);
    if (e.k.durum === 'katilacak') { ck += e.k.kisi; cr++; } else if (e.k.durum === 'katilamayacak') cy++;
    tl.push({ ms: e.ms, kisi: ck, kayit: cr, yok: cy, ad: e.k.ad });
  });
  o.tl = tl;
  // Mesaj birikimi (geçerli kayıtlar, son bildirim zamanına göre)
  o.msjTl = cur.filter((k) => k.mesaj && k.ms).sort((a, b) => a.ms - b.ms).map((k, i) => ({ ms: k.ms, n: i + 1 }));

  // Veri kalitesi
  const adMap = new Map(), telMap = new Map();
  gruplar.forEach((g) => {
    if (g.adKey) (adMap.get(g.adKey) || adMap.set(g.adKey, []).get(g.adKey)).push(g);
    if (g.tk) (telMap.get(g.tk) || telMap.set(g.tk, []).get(g.tk)).push(g);
  });
  const kal = { gorevBos: gruplar.filter((g) => !g.cur.gorev), mukerrerAd: [], mukerrerTel: [], gec: gruplar.filter((g) => g.gec), degisen: gruplar.filter((g) => g.degisti) };
  adMap.forEach((l) => { if (new Set(l.map((g) => g.kkey)).size >= 2) kal.mukerrerAd.push(l); });
  telMap.forEach((l) => { if (new Set(l.map((g) => g.adKey)).size >= 2) kal.mukerrerTel.push(l); });
  o.kalite = kal;
  o.ilkMs = tl.length ? tl[0].ms : 0;
  return { hepsi, gruplar, ozet: o };
};

// Zaman çizelgesinde t anındaki durum (ikili arama)
const tlDurum = (tl, t) => {
  let lo = 0, hi = tl.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (tl[m].ms <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r < 0 ? { ms: 0, kisi: 0, kayit: 0, yok: 0 } : tl[r];
};
// Gün sonu değerleri (son N gün) — küçük grafikler ve tablo yedeği için
const gunSonlari = (tl, n) => {
  const bugun = gunAnahtar(Date.now());
  const sonG = tl.length && gunAnahtar(tl[tl.length - 1].ms) > bugun ? gunAnahtar(tl[tl.length - 1].ms) : bugun;
  const out = []; let j = 0, son = { kisi: 0, kayit: 0, yok: 0 };
  for (let i = n - 1; i >= 0; i--) {
    const d = gunEkle(sonG, -i);
    while (j < tl.length && gunAnahtar(tl[j].ms) <= d) { son = tl[j]; j++; }
    out.push({ d, kisi: son.kisi, kayit: son.kayit, yok: son.yok });
  }
  return out;
};
const gunlukYeni = (cur, n) => {
  const bugun = gunAnahtar(Date.now()); const m = new Map();
  cur.forEach((k) => { if (!k.ms) return; const d = gunAnahtar(k.ms); m.set(d, (m.get(d) || 0) + 1); });
  const out = []; for (let i = n - 1; i >= 0; i--) { const d = gunEkle(bugun, -i); out.push({ d, n: m.get(d) || 0 }); } return out;
};
