/* «Ahde Vefa» katılım paneli v3 — çekirdek: sabitler, yardımcılar, depolar. Veri yalnız textContent / güvenli DOM ile basılır. */
'use strict';
const UC = JSON.parse(document.getElementById('uc').textContent);
const $ = (i) => document.getElementById(i);
const TZ = 'Europe/Brussels';
const SON_YANIT = Date.parse('2026-11-07T12:00:00+01:00');
const PROGRAM = Date.parse('2026-11-08T15:00:00+01:00');
const PROGRAM_BAS = Date.parse('2026-11-08T15:30:00+01:00');
const PROGRAM_SON = Date.parse('2026-11-09T00:00:00+01:00');
const ONBELLEK_ANAHTARI = 'veda-liste-onbellek-v1';
const ONBELLEK_SON = Date.parse('2026-11-09T23:59:00+01:00');
const OTURUM_ANAHTARI = 'veda-liste-oturum-v1';
const SON_GORULEN = 'veda-liste-son-gorulen-v1';
const GORUNUM_ANAHTARI = 'veda-liste-gorunum-v1';
const TEMA_ANAHTARI = 'veda-liste-tema-v1';
const GERI_DENEME = [5000, 10000, 20000, 40000, 60000, 120000];
const YENILEME = 60000;
const ZAMAN_ASIMI = 45000;
const KURUM_ILK = 6;
const GOREVLER = ['Dernek başkanı', 'Din görevlisi', 'STK temsilcisi', 'Diğer'];
const kolC = new Intl.Collator('tr', { sensitivity: 'base', numeric: true });
const harfBas = (s) => String(s).replace(/^[^\p{L}\p{N}]+/u, '');
const kol = { compare: (a, b) => kolC.compare(harfBas(a), harfBas(b)) };
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const azaltmaTercihi = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };

// ---------- Metin / DOM ----------
const trn = (s) => String(s == null ? '' : s).toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const bosalt = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, at, metin) => { const e = document.createElementNS(SVGNS, tag); if (at) for (const k in at) e.setAttribute(k, at[k]); if (metin != null) e.textContent = metin; return e; };
const tel = (t) => String(t || '').replace(/[^\d+]/g, '');
const kisalt = (s, n) => (s.length > n ? s.slice(0, Math.max(1, n - 1)).trimEnd() + '…' : s);
const bas = (ad) => { const p = String(ad || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return '?'; const a = Array.from(p[0])[0] || '?'; const b = p.length > 1 ? (Array.from(p[p.length - 1])[0] || '') : ''; return (a + b).toLocaleUpperCase('tr'); };
const renkIndeksi = (ad) => { let h = 0; const s = trn(ad); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 5; return h; };

// ---------- Zaman (Europe/Brussels; biçimleyici önbellekli) ----------
const dtf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const parcaMemo = new Map();
const parca = (ms) => {
  let r = parcaMemo.get(ms); if (r) return r;
  const o = {}; try { dtf.formatToParts(new Date(ms)).forEach((p) => { o[p.type] = p.value; }); } catch (_) {}
  r = { y: o.year || '1970', m: o.month || '01', d: o.day || '01', h: o.hour === '24' ? '00' : (o.hour || '00'), mi: o.minute || '00' };
  if (parcaMemo.size > 8000) parcaMemo.clear();
  parcaMemo.set(ms, r); return r;
};
const gunAnahtar = (ms) => { const p = parca(ms); return p.y + '-' + p.m + '-' + p.d; };
const saatAnahtar = (ms) => { const p = parca(ms); return p.y + '-' + p.m + '-' + p.d + 'T' + p.h; };
const saatDk = (ms) => { const p = parca(ms); return p.h + '.' + p.mi; };
const gunAyAnahtar = (d) => Number(d.slice(8)) + ' ' + AYLAR[Number(d.slice(5, 7)) - 1];
const gunAy = (ms) => { const p = parca(ms); return Number(p.d) + ' ' + AYLAR[Number(p.m) - 1]; };
const mutlak = (ms) => (ms ? gunAy(ms) + ' ' + saatDk(ms) : '—');
const haftaGunu = (d) => GUNLER[new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)))).getUTCDay()];
const gunEkle = (anahtar, n) => { const [y, m, d] = anahtar.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const gunFark = (a, b) => { const f = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((f(a) - f(b)) / 86400000); };
const gunBasi = (d) => Date.parse(d + (d >= '2026-10-25' && d < '2027-03-28' ? 'T00:00:00+01:00' : 'T00:00:00+02:00'));
const tamTarih = (ms) => { const p = parca(ms == null ? Date.now() : ms); return p.d + '.' + p.m + '.' + p.y + ' ' + p.h + '.' + p.mi; };
const goreli = (ms, simdi) => {
  if (!ms) return '';
  const f = simdi - ms;
  if (f < 45000) return 'az önce';
  if (f < 3600000) return Math.max(1, Math.round(f / 60000)) + ' dk önce';
  if (f < 86400000 && gunAnahtar(ms) === gunAnahtar(simdi)) return Math.round(f / 3600000) + ' saat önce';
  const g = gunFark(gunAnahtar(simdi), gunAnahtar(ms));
  if (g <= 0) return Math.round(f / 3600000) + ' saat önce';
  if (g === 1) return 'dün';
  return g + ' gün önce';
};
const sureMetni = (ms) => {
  const dk = Math.max(0, Math.floor(ms / 60000));
  const g = Math.floor(dk / 1440), s = Math.floor((dk % 1440) / 60), m = dk % 60;
  if (g >= 1) return g + ' gün ' + s + ' sa';
  if (s >= 1) return s + ' sa ' + m + ' dk';
  return m + ' dk';
};
const gunEtiket = (ms) => { const d = gunAnahtar(ms); return haftaGunu(d) + ' ' + gunAyAnahtar(d); };

// ---------- Depolar (anahtar yalnız sessionStorage; adrese / günlüğe / localStorage'a asla) ----------
const oturumOku = () => { try { return sessionStorage.getItem(OTURUM_ANAHTARI) || ''; } catch (_) { return ''; } };
const oturumYaz = (k) => { try { sessionStorage.setItem(OTURUM_ANAHTARI, k); } catch (_) {} };
const oturumSil = () => { try { sessionStorage.removeItem(OTURUM_ANAHTARI); sessionStorage.removeItem(GORUNUM_ANAHTARI); } catch (_) {} };
const onbellekGecerliMi = (o, simdi) => !!(o && typeof o === 'object' && o.veri && o.veri.ok && Array.isArray(o.veri.kayitlar) && o.veri.toplam && typeof o.alindi === 'string' && !isNaN(Date.parse(o.alindi)) && (simdi == null ? Date.now() : simdi) < ONBELLEK_SON);
const depoSil = () => { try { localStorage.removeItem(ONBELLEK_ANAHTARI); } catch (_) {} };
const depoOku = () => { try { const o = JSON.parse(localStorage.getItem(ONBELLEK_ANAHTARI) || 'null'); if (onbellekGecerliMi(o)) return o; if (o) depoSil(); } catch (_) {} return null; };
const depoYaz = (veri) => { try { localStorage.setItem(ONBELLEK_ANAHTARI, JSON.stringify({ alindi: new Date().toISOString(), veri })); } catch (_) {} };
const sonGorulenOku = () => { try { return Number(localStorage.getItem(SON_GORULEN)) || 0; } catch (_) { return 0; } };
const sonGorulenYaz = (ms) => { try { localStorage.setItem(SON_GORULEN, String(ms)); } catch (_) {} };
const gorunumOku = () => { try { return sessionStorage.getItem(GORUNUM_ANAHTARI) || ''; } catch (_) { return ''; } };
const gorunumYaz = (g) => { try { sessionStorage.setItem(GORUNUM_ANAHTARI, g); } catch (_) {} };
