/* Yönetim paneli — public/admin/index.html'in betiği.
   4 Eylül 2026'ya kadar HTML içinde gömülüydü; ayrı dosya olunca `node --check` ile denetlenir
   (npm run denetim:panel) ve tarayıcı ayrı önbellekler. Sırlar sessionStorage'dadır (giriş kapısı: kapi.js).
   Bölümler: yardımcılar · ziyaretler (GoatCounter) · durum (Actions + durum.json) · başvurular (GAS liste)
   · form PDF (GAS pdf) · EK-9 belgesi · CSV · son değişiklikler · yükle/yenile. */
const REPO = 'ulucamii2026/ulucamii2026.github.io';
const GAS = 'https://script.google.com/macros/s/AKfycbz2cgLbdHmx9ejuk4euzybGbpDro0UAEjzjwl86tMdRtz05Pp5WI1JUZT374y_lb4J8BQ/exec';
const GOAT = 'https://ulucamii.goatcounter.com';
let SIRLAR = null;
// Sırlar sessionStorage'da: sekme kapanınca cihazdan silinir (bkz. giriş kapısı).
try { SIRLAR = JSON.parse(sessionStorage.getItem('panel-sirlar') || 'null'); } catch {}
/* Sırlar yoksa kapi.js bu sayfayı çizdirmeden giriş sayfasına yollar; burada yalnız tek tek alanlar (gas/goatApi) yoklanır. */

const $ = (id) => document.getElementById(id);
/* Eski localStorage önbellekleri (kişisel veri, «Çıkış»a basılmadan cihazda kalıyordu) bir kez temizlenir. */
try { ['panel-basvuru-v1', 'panel-trafik-v3'].forEach((k) => localStorage.removeItem(k)); } catch {}

/* ---- Zaman: panel hangi cihazda/saat diliminde açılırsa açılsın «bugün» caminin (Brüksel) günüdür ---- */
const BRUKSEL = 'Europe/Brussels';
const bugunBrussels = () => new Intl.DateTimeFormat('en-CA', { timeZone: BRUKSEL, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const saatBrussels = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: BRUKSEL, hour: '2-digit', hour12: false }).format(new Date()).slice(0, 2)) % 24;
/** Brüksel gününden n gün geri, YYYY-MM-DD. */
const gunGeri = (n) => { const [y, a, g] = bugunBrussels().split('-').map(Number); return new Date(Date.UTC(y, a - 1, g - n)).toISOString().slice(0, 10); };

/* ---- Apps Script'e tek kapı ----
   Dağıtımdan hemen sonraki ilk çağrıda Google bir kez HTML «sayfa bulunamadı» döndürebiliyor
   (4 Eyl 2026 ölçümü: 37 sn sonra 404, ikinci istek 3 sn'de geldi); JSON gelmezse bir kez daha denenir. */
async function gasIstek(islem, parametreler) {
  const p = new URLSearchParams({ islem, anahtar: (SIRLAR && SIRLAR.gas) || '', ...(parametreler || {}) });
  let sonHata = null;
  for (let deneme = 0; deneme < 2; deneme++) {
    if (deneme) await bekle(800);
    try {
      const r = await fetch(`${GAS}?${p}`, { redirect: 'follow' });
      const metin = await r.text();
      try { return JSON.parse(metin); } catch { sonHata = new Error('Arka uç beklenmedik cevap verdi (' + r.status + ')'); }
    } catch (e) { sonHata = e; }
  }
  throw sonHata || new Error('Arka uca ulaşılamadı');
}

/* ---- Defterdeki ham form kodları panelde Türkçe okunur ----
   Form, seçenekleri kod olarak gönderir (kiz/erkek, anne/baba/vasi, yeni/devam, tr/fr…); defterde de
   kod durur. Kart ve «Tüm bilgiler» tablosu bu kodları etikete çevirir; bilinmeyen değer olduğu gibi kalır. */
const ETIKET = {
  /* İngilizce kodlar (male/father/…) v1 formundan taşınan satırlarda durur. */
  cinsiyet: { kiz: 'Kız', erkek: 'Erkek', kadin: 'Kadın', kadın: 'Kadın', male: 'Erkek', female: 'Kız' },
  yakinlik: { anne: 'Anne', baba: 'Baba', vasi: 'Vasi', father: 'Baba', mother: 'Anne', guardian: 'Vasi' },
  evet: { evet: 'Evet', hayir: 'Hayır', hayır: 'Hayır', yes: 'Evet', no: 'Hayır', true: 'Evet', false: 'Hayır' },
  dil: { tr: 'Türkçe', fr: 'Fransızca', en: 'İngilizce', ar: 'Arapça' },
  medeni: { bekar: 'Bekâr', evli: 'Evli', dul: 'Dul', bosanmis: 'Boşanmış' },
  kurs: { yeni: 'Yeni kayıt', devam: 'Devam eden öğrenci' },
};
const SUTUN_ETIKETI = [
  [/^cinsiyet$/i, 'cinsiyet'], [/yakınlığı/i, 'yakinlik'], [/dili$/i, 'dil'], [/medeni/i, 'medeni'],
  [/^kurs durumu$/i, 'kurs'], [/öğrenim/i, 'ogrenim'], [/önceki din/i, 'oncekiDin'],
  [/rızası$|izni$|^açık rıza$/i, 'evet'],
];
const etiketle = (baslik, ham) => {
  const e = SUTUN_ETIKETI.find(([re]) => re.test(String(baslik).trim()));
  if (!e) return ham;
  const harita = ETIKET[e[1]] || (EK9_ETIKET[e[1]] || {});   // öğrenim / önceki din tabloları EK-9 ile ortak
  return harita[String(ham).trim().toLocaleLowerCase('tr')] || ham;
};

/* ---- Tarih ----
   Defterden üç biçim gelebilir: "15.06.2015 00:00" (Sheets'in tarih hücresi), "2017-03-15" (formdan gelen
   salt tarih), "Sat Aug 23 2026 20:01:00 GMT+0200 (…)" (v1 defterinden taşınan satırlar, ham JS tarihi).
   Hepsi gg.aa.yyyy [ss:dd] olarak, Brüksel saatiyle gösterilir. */
const tarihSadelestir = (deger) => {
  const d = String(deger ?? '').trim();
  if (!d) return '';
  if (/^\d{2}[.\/]\d{2}[.\/]\d{4}/.test(d)) return d.replace(/\s00:00$/, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return d;
  const saatli = /\d{2}:\d{2}/.test(d);
  const secenek = { timeZone: BRUKSEL, day: '2-digit', month: '2-digit', year: 'numeric' };
  if (saatli) { secenek.hour = '2-digit'; secenek.minute = '2-digit'; }
  return new Intl.DateTimeFormat('tr-TR', secenek).format(t).replace(/\s00:00$/, '');
};
/** Defter zamanını milisaniyeye çevirir («Yeni» kararı için; bir saatlik yaz/kış sapması önemsizdir). */
const zamanMs = (deger) => {
  const d = String(deger ?? '').trim();
  const m = d.match(/^(\d{2})[.\/](\d{2})[.\/](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] || 0) - 1, +(m[5] || 0));
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/* ---- Durum hücresi ----
   Defterdeki «Durum» sistem notudur ("Yeni kayıt · e-posta gönderilemedi"). Kartta yalnız yöneticinin
   yapması gereken şey görünür; sorun yoksa rozet boş kalır (her kartta «Yeni kayıt» yazması bilgi değildi). */
const durumOzet = (durum) => {
  const d = String(durum || '');
  if (/gönderilemedi|gonderilemedi/i.test(d)) return 'E-posta gönderilemedi';
  if (/hata|başarısız|basarisiz/i.test(d)) return 'İşlem hatası';
  return '';
};

/** «Tüm bilgiler» tablosundaki tek hücre: sütun adına göre telefon / tarih / kod etiketi / düz metin. */
const degerBicimle = (baslik, ham) => {
  const b = String(baslik);
  if (/telefon|cep/i.test(b)) return kacir(telefonBicim(ham));
  if (/tarih|zaman/i.test(b)) return kacir(tarihSadelestir(ham));
  if (/şahit/i.test(b)) return kacir(String(ham).replace(/\s\|\s/g, ' · '));   // arka ucun iç ayracı
  if (/^durum$/i.test(b)) {
    /* "Yeni kayıt | temizlendi-v15 | v1'den taşındı" — ilk parça durum, gerisi arka ucun bakım işaretleri (küçük, soluk). */
    const [ilk, ...isaretler] = String(ham).split(/\s\|\s/);
    return kacir(ilk) + (isaretler.length ? ` <small class="sistem-not">${kacir(isaretler.join(' · '))}</small>` : '');
  }
  return kacir(etiketle(b, ham));
};

/* ---- «Yeni» işareti: son ziyaretten sonra gelen başvurular ----
   Damga sekme gizlenince/kapanınca yazılır (pagehide + visibilitychange). İlk açılışta damga yoktur,
   hiçbir şey «Yeni» sayılmaz; ikinci açılıştan itibaren aradaki başvurular işaretlenir. Kişisel veri değil,
   yalnız zaman damgası tutulur — localStorage'da kalması sorun değildir. */
const SON_GORULDU = 'panel-son-goruldu';
let sonGorulen = 0;
try { sonGorulen = Number(localStorage.getItem(SON_GORULDU)) || 0; } catch {}
const yeniMi = (zaman) => sonGorulen > 0 && zamanMs(zaman) > sonGorulen;
const sonGorulduKaydet = () => { try { localStorage.setItem(SON_GORULDU, String(Date.now())); } catch {} };
const kacir = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bekle = (ms) => new Promise((c) => setTimeout(c, ms));
/* Tarih anahtarı hep Brüksel gününe göre: panel hangi cihazda açılırsa açılsın «bugün» caminin günüdür. */
const tarihStr = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const sayiTR = (n) => Number(n || 0).toLocaleString('tr-TR');
function neZaman(ts) {
  const dk = Math.round((Date.now() - ts) / 60000);
  if (dk < 1) return 'az önce';
  if (dk < 60) return dk + ' dakika önce';
  const s = Math.round(dk / 60);
  return s < 24 ? s + ' saat önce' : new Date(ts).toLocaleString('tr-BE', { dateStyle: 'short', timeStyle: 'short' });
}
$('cikis').addEventListener('click', () => {
  localStorage.removeItem('sveltia-cms.user'); localStorage.removeItem('panel-oturum');
  sessionStorage.removeItem('panel-sirlar');
  ['panel-trafik-v3', 'panel-basvuru-v1', SON_GORULDU].forEach((k) => localStorage.removeItem(k));
  ['panel-trafik-v4', 'panel-basvuru-v2'].forEach((k) => sessionStorage.removeItem(k));
  location.replace('/admin/giris.html');
});

// Bölüm gezintisi: kaydırdıkça etkin bölümü işaretle
(function gezintiKur() {
  const baglar = [...document.querySelectorAll('nav.gezinti a')];
  const hedefler = baglar.map((a) => $(a.getAttribute('href').slice(1))).filter(Boolean);
  const ustlik = document.querySelector('.ustlik');
  if (!hedefler.length || !ustlik) return;
  const yuksekligiYaz = () => document.documentElement.style.setProperty('--ustlik-yukseklik', (ustlik.offsetHeight + 12) + 'px');
  yuksekligiYaz();
  addEventListener('resize', yuksekligiYaz);
  let bekleyen = false;
  const guncelle = () => {
    const esik = scrollY + ustlik.offsetHeight + 48;
    let etkin = hedefler[0].id;
    for (const h of hedefler) if (h.offsetTop <= esik) etkin = h.id;
    baglar.forEach((a) => a.classList.toggle('etkin', a.getAttribute('href') === '#' + etkin));
  };
  addEventListener('scroll', () => {
    if (bekleyen) return;
    bekleyen = true;
    requestAnimationFrame(() => { bekleyen = false; guncelle(); });
  }, { passive: true });
  guncelle();
})();

/* ============================ ZİYARETLER ============================ */
const TRAFIK_ONBELLEK = 'panel-trafik-v4';   // sessionStorage
async function sayac(yol) {
  try { const r = await fetch(`${GOAT}/counter/${yol}.json`, { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); return j.count_unique ?? j.count; }
  catch { return null; }
}
async function goatApi(uc, deneme) {
  deneme = deneme || 0;
  let r;
  try {
    r = await fetch(`${GOAT}/api/v0/${uc}`, { headers: { Authorization: `Bearer ${SIRLAR.goatApi}` }, cache: 'no-store' });
  } catch (agHata) {
    // hız sınırı yanıtı CORS başlıksız gelir ve fetch TypeError atar — bekleyip yeniden dene
    if (deneme < 3) { await bekle(1500 * (deneme + 1)); return goatApi(uc, deneme + 1); }
    throw agHata;
  }
  if (r.status === 429 && deneme < 3) { await bekle(1500 * (deneme + 1)); return goatApi(uc, deneme + 1); }
  if (!r.ok) throw new Error('goat ' + r.status);
  return r.json();
}
/** İstekleri sıraya dizer: eşzamanlı çağrı hız sınırını tetikliyordu. Düşen uç diğerlerini düşürmez. */
async function siraliCek(ucler) {
  const c = [];
  for (let i = 0; i < ucler.length; i++) {
    try { c.push(await goatApi(ucler[i])); } catch { c.push(null); }
    if (i < ucler.length - 1) await bekle(280);
  }
  return c;
}

const ULKE_TR = { Belgium: 'Belçika', Turkey: 'Türkiye', France: 'Fransa', Germany: 'Almanya', Netherlands: 'Hollanda', 'United States': 'ABD', 'United Kingdom': 'Birleşik Krallık', Morocco: 'Fas', Luxembourg: 'Lüksemburg', Switzerland: 'İsviçre', Austria: 'Avusturya', Italy: 'İtalya', Spain: 'İspanya', Canada: 'Kanada', Algeria: 'Cezayir', Tunisia: 'Tunus' };
const CIHAZ_TR = { phone: '📱 Telefon', tablet: '📲 Tablet', desktop: '🖥️ Masaüstü', unknown: 'Bilinmiyor' };
const bayrak = (kod) => /^[A-Za-z]{2}$/.test(kod || '') ? String.fromCodePoint(...[...kod.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : '';
const gunEtiket = (t) => new Date(t + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
/** Özel isme doğru ayrılma eki ekler: Belçika'dan, Türkiye'den, Fas'tan, Krallık'tan. */
const EK_OZEL = { 'ABD': "'den", 'BAE': "'den" };
function ekDan(kelime) {
  const k = String(kelime || '');
  if (EK_OZEL[k]) return EK_OZEL[k];
  const unlu = 'aeıioöuüAEIİOÖUÜ';
  let son = '';
  for (let i = k.length - 1; i >= 0; i--) { if (unlu.includes(k[i])) { son = k[i].toLocaleLowerCase('tr'); break; } }
  const kalin = 'aıou'.includes(son);
  const sonHarf = k.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').slice(-1).toLocaleLowerCase('tr');
  const sert = 'fstkçşhp'.includes(sonHarf);
  return "'" + (sert ? (kalin ? 'tan' : 'ten') : (kalin ? 'dan' : 'den'));
}
/** Uzun sayfa başlıklarını özet cümlesi için okunur kısa ada indirger. */
function kisaBaslik(baslik, yol) {
  const y = String(yol || '').replace(/\/$/, '');
  if (/^\/(tr|fr|en)?$/.test(y)) return 'Ana sayfa';
  let t = String(baslik || y || '').split('—')[0].trim();     // "Sayfa — Site adı" → "Sayfa"
  if (t.includes('·')) t = t.split('·').pop().trim();         // "Site adı · Sayfa" → "Sayfa"
  if (!t) t = y;
  return t.length > 34 ? t.slice(0, 32).trimEnd() + '…' : t;
}

/** Ham API yanıtlarını çizime hazır sade bir modele indirger (önbelleğe de bu yazılır). */
function modelKur(gun, [seri, sayfalar, kaynaklar, ulkeler, cihazlar, tarayicilar]) {
  const bugunStr = bugunBrussels();
  const basStr = gun === 1 ? bugunStr : gunGeri(gun - 1);
  const tum = ((seri && seri.stats) || []).filter((x) => x.day <= bugunStr); // UTC kaymasıyla gelen yarınki boş günü at
  const donem = tum.filter((x) => x.day >= basStr);
  const onceki = tum.filter((x) => x.day < basStr).reduce((a, x) => a + x.daily, 0);
  return {
    gun, bugunStr, basStr,
    eksik: !seri,
    gunler: donem.map((x) => ({ gun: x.day, sayi: x.daily })),
    saatler: gun === 1 ? ((donem[0] && donem[0].hourly) || []) : null,
    saatlerBugun: (tum.find((x) => x.day === bugunStr) || {}).hourly || [],
    donemToplam: donem.reduce((a, x) => a + x.daily, 0),
    oncekiToplam: onceki,
    bugun: (tum.find((x) => x.day === bugunStr) || {}).daily || 0,
    dun: (tum.find((x) => x.day === tarihStr(new Date(Date.now() - 86400000))) || {}).daily || 0,
    sayfalar: sayfalar ? (sayfalar.hits || []).map((h) => ({ yol: h.path, baslik: h.title || h.path, sayi: h.count })) : null,
    kaynaklar: kaynaklar ? (() => {
      // Kendi alan adımızdan gelen satırlar dış kaynak değil, site içi gezinmedir: tek satırda toplanır
      const ham = (kaynaklar.stats || []).map((k) => ({ ad: k.name || '', sayi: k.count }));
      const ici = ham.filter((k) => /ulucamii\.be/i.test(k.ad)).reduce((a, k) => a + k.sayi, 0);
      const dis = ham.filter((k) => !/ulucamii\.be/i.test(k.ad));
      if (ici > 0) dis.push({ ad: '↩ Site içi gezinme', sayi: ici, ici: true });
      return dis.sort((a, b) => b.sayi - a.sayi);
    })() : null,
    ulkeler: ulkeler ? (ulkeler.stats || []).map((u) => ({ id: u.id, ad: u.name, sayi: u.count })) : null,
    cihazlar: cihazlar ? (cihazlar.stats || []).filter((c) => c.count > 0).map((c) => ({ id: c.id, sayi: c.count })) : null,
    tarayicilar: tarayicilar ? (tarayicilar.stats || []).filter((t) => t.count > 0).map((t) => ({ ad: t.name || t.id, sayi: t.count })) : null,
  };
}

function ozetYaz(m, zaman) {
  const donemAd = m.gun === 1 ? 'Bugün' : `Son ${m.gun} günde`;
  const parcalar = [];
  parcalar.push(`${donemAd} <b>${sayiTR(m.donemToplam)}</b> sayfa görüntülenmesi`);
  if (m.sayfalar && m.sayfalar.length) {
    const e = m.sayfalar[0];
    parcalar.push(`en çok bakılan sayfa <b>${kacir(kisaBaslik(e.baslik, e.yol))}</b> (${sayiTR(e.sayi)})`);
  }
  if (m.cihazlar && m.cihazlar.length) {
    const top = m.cihazlar.reduce((a, c) => a + c.sayi, 0);
    const tel = (m.cihazlar.find((c) => c.id === 'phone') || {}).sayi || 0;
    if (top > 0) parcalar.push(`<b>%${Math.round(tel / top * 100)}</b> telefondan`);
  }
  if (m.ulkeler && m.ulkeler.length) {
    const ulke = ULKE_TR[m.ulkeler[0].ad] || m.ulkeler[0].ad || '';
    if (ulke) parcalar.push(`ziyaretlerin çoğu <b>${kacir(ulke)}</b>${ekDan(ulke)}`);
  }
  let kiyas = '';
  if (m.gun > 1 && m.oncekiToplam > 0) {
    const fark = Math.round((m.donemToplam - m.oncekiToplam) / m.oncekiToplam * 100);
    kiyas = fark >= 0
      ? ` <span class="artis">▲ önceki ${m.gun} güne göre %${fark} artış.</span>`
      : ` <span class="azalis">▼ önceki ${m.gun} güne göre %${-fark} azalış.</span>`;
  }
  $('ozet').innerHTML = parcalar.join(', ') + '.' + kiyas +
    `<span class="tazelik" id="ozet-tazelik">${zaman ? 'Veriler ' + neZaman(zaman) + ' alındı.' : ''}</span>`;
}

function ciz(m, zaman) {
  ozetYaz(m, zaman);
  $('d-donem').textContent = sayiTR(m.donemToplam);
  $('a-donem').textContent = m.gun === 1 ? 'Bugün · sayfa açılışı' : `Son ${m.gun} gün · önceki dönem: ${sayiTR(m.oncekiToplam)}`;
  $('d-bugun').textContent = sayiTR(m.bugun);
  $('a-dun').textContent = 'Dün: ' + sayiTR(m.dun);

  // Grafik — verinin başladığı günden itibaren çizilir; öncesindeki boş günler bilgi taşımadığı için kırpılır
  const okuma = $('grafik-okuma');
  if (m.gun === 1) {
    const s = m.saatler || [];
    const maks = Math.max(1, ...s);
    $('grafik').innerHTML = s.map((n, i) =>
      `<div class="cubuk${i === saatBrussels() ? ' bugun' : ''}" tabindex="0" role="img" aria-label="${String(i).padStart(2, '0')}:00 — ${n} görüntülenme" data-etiket="${String(i).padStart(2, '0')}:00 — ${n} görüntülenme" style="height:${Math.max(3, Math.round(n / maks * 100))}%"></div>`
    ).join('') || '<span class="yol-alt">Bugün henüz ziyaret yok</span>';
    $('grafik-eksen').innerHTML = s.length ? '<span>00:00</span><span>12:00</span><span>23:00</span>' : '';
    okuma.textContent = s.length ? 'Saatlik dağılım — çubuğa dokunun' : '';
  } else if (m.gunler.filter((x) => x.sayi > 0).length < 3 && m.saatlerBugun.some((x) => x > 0)) {
    // Dönemde yalnız bir-iki gün veri varsa günlük çubuklar bilgi taşımaz; bugünün saatlik dağılımı gösterilir
    const s = m.saatlerBugun;
    const maks = Math.max(1, ...s);
    $('grafik').innerHTML = s.map((n, i) =>
      `<div class="cubuk${i === saatBrussels() ? ' bugun' : ''}" tabindex="0" role="img" aria-label="${String(i).padStart(2, '0')}:00 — ${n} görüntülenme" data-etiket="${String(i).padStart(2, '0')}:00 — ${n} görüntülenme" style="height:${Math.max(3, Math.round(n / maks * 100))}%"></div>`
    ).join('');
    $('grafik-eksen').innerHTML = '<span>00:00</span><span>12:00</span><span>23:00</span>';
    okuma.textContent = 'Sayaç yeni kuruldu — bugünün saatlik dağılımı gösteriliyor';
  } else {
    let g = m.gunler;
    const ilkDolu = g.findIndex((x) => x.sayi > 0);
    const kirpildi = ilkDolu > 0;
    if (ilkDolu > 0) g = g.slice(ilkDolu);
    const maks = Math.max(1, ...g.map((x) => x.sayi));
    $('grafik').innerHTML = g.map((x) =>
      `<div class="cubuk${x.gun === m.bugunStr ? ' bugun' : ''}" tabindex="0" role="img" aria-label="${gunEtiket(x.gun)} — ${x.sayi} görüntülenme" data-etiket="${gunEtiket(x.gun)} — ${x.sayi} görüntülenme" style="height:${Math.max(3, Math.round(x.sayi / maks * 100))}%"></div>`
    ).join('') || '<span class="yol-alt">Bu dönemde ziyaret yok</span>';
    $('grafik-eksen').innerHTML = g.length ? `<span>${gunEtiket(g[0].gun)}</span><span>${gunEtiket(g[Math.floor(g.length / 2)].gun)}</span><span>${gunEtiket(g[g.length - 1].gun)}</span>` : '';
    okuma.textContent = g.length ? (kirpildi ? `Grafik ${gunEtiket(g[0].gun)} tarihinde başlıyor (sayaç bu tarihte kuruldu)` : 'Günlük dağılım — çubuğa dokunun') : '';
  }

  const bosNot = (v) => v === null ? '<tr><td colspan="2">Şu an alınamadı — 5 dk içinde kendiliğinden tazelenir</td></tr>' : '<tr><td colspan="2">Bu dönemde kayıt yok</td></tr>';
  const s = m.sayfalar;
  if (s && s.length) {
    const enCok = Math.max(1, ...s.map((h) => h.sayi));
    const satir = (h, gizli) =>
      `<tr${gizli ? ' class="fazla" hidden' : ''}><td><div>${kacir(h.baslik)}</div><div class="yol-alt">${kacir(h.yol)}</div><div class="oran"><span style="width:${Math.round(h.sayi / enCok * 100)}%"></span></div></td><td class="sayi">${sayiTR(h.sayi)}</td></tr>`;
    let govde = s.slice(0, 6).map((h) => satir(h, false)).join('') + s.slice(6).map((h) => satir(h, true)).join('');
    if (s.length > 6) govde += `<tr id="fazla-satir"><td colspan="2" style="text-align:center"><button class="dugme" type="button" id="fazla-dugme" style="min-height:32px;font-size:.84rem">Kalan ${s.length - 6} sayfayı göster</button></td></tr>`;
    $('trafik-govde').innerHTML = govde;
    const fd = $('fazla-dugme');
    if (fd) fd.addEventListener('click', () => {
      document.querySelectorAll('#trafik-govde tr.fazla').forEach((t) => { t.hidden = false; });
      $('fazla-satir').remove();
    });
  } else $('trafik-govde').innerHTML = bosNot(s);

  $('kaynak-govde').innerHTML = (m.kaynaklar && m.kaynaklar.length)
    ? m.kaynaklar.map((k) => `<tr><td>${kacir(k.ad || 'Doğrudan / adres çubuğu')}</td><td class="sayi">${sayiTR(k.sayi)}</td></tr>`).join('')
    : bosNot(m.kaynaklar);
  $('ulke-govde').innerHTML = (m.ulkeler && m.ulkeler.length)
    ? m.ulkeler.map((u) => `<tr><td>${bayrak(u.id)} ${kacir(ULKE_TR[u.ad] || u.ad || u.id || 'Bilinmiyor')}</td><td class="sayi">${sayiTR(u.sayi)}</td></tr>`).join('')
    : bosNot(m.ulkeler);
  const cihazSat = (m.cihazlar || []).map((c) => `<tr><td>${kacir(CIHAZ_TR[c.id] || c.id)}</td><td class="sayi">${sayiTR(c.sayi)}</td></tr>`);
  const tarSat = (m.tarayicilar || []).map((t) => `<tr><td style="color:var(--metin-2)">${kacir(t.ad)}</td><td class="sayi">${sayiTR(t.sayi)}</td></tr>`);
  $('cihaz-govde').innerHTML = (cihazSat.length || tarSat.length) ? cihazSat.concat(tarSat).join('') : bosNot(m.cihazlar);
}

// Grafikte çubuk okuma (fare + dokunmatik)
(function grafikOkumaKur() {
  const gr = $('grafik'), ok = $('grafik-okuma');
  let varsayilan = '';
  const goster = (e) => {
    const c = e.target.closest && e.target.closest('.cubuk');
    if (!c) return;
    if (!varsayilan) varsayilan = ok.textContent;
    gr.querySelectorAll('.cubuk.sec').forEach((x) => x.classList.remove('sec'));
    c.classList.add('sec');
    ok.textContent = c.dataset.etiket;
  };
  gr.addEventListener('pointerdown', goster);
  gr.addEventListener('focusin', goster);   // klavyeyle gezinme: odaklanan çubuk okunur
  gr.addEventListener('focusout', (e) => { if (gr.contains(e.relatedTarget)) return; gr.querySelectorAll('.cubuk.sec').forEach((x) => x.classList.remove('sec')); if (varsayilan) { ok.textContent = varsayilan; varsayilan = ''; } });
  gr.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) goster(e); });
  gr.addEventListener('pointerleave', () => { gr.querySelectorAll('.cubuk.sec').forEach((x) => x.classList.remove('sec')); if (varsayilan) { ok.textContent = varsayilan; varsayilan = ''; } });
})();

let trafikMesgul = false, bekleyenGun = null;
async function trafikYukle(gun, sessiz) {
  gun = gun || seciliGun();
  if (trafikMesgul) { bekleyenGun = gun; return; }   // kilitliyken gelen seçim yutulmaz, kilit açılınca çizilir
  trafikMesgul = true;
  sayac('TOTAL').then((n) => { $('d-toplam').textContent = n != null ? sayiTR(n) : '—'; });
  if (!SIRLAR || !SIRLAR.goatApi) {
    $('ozet').innerHTML = 'Ziyaret verileri için bir kez <a href="/admin/giris.html">yeniden giriş</a> yapın (erişim paketi yenilendi).';
    ['trafik-govde', 'kaynak-govde', 'ulke-govde', 'cihaz-govde'].forEach((i) => { $(i).innerHTML = '<tr><td colspan="2">Yeniden giriş gerekli</td></tr>'; });
    $('grafik').innerHTML = '<span class="yol-alt">Ziyaret grafiği için yeniden giriş gerekli</span>'; $('grafik-eksen').innerHTML = '';
    trafikMesgul = false; return;
  }
  const bugunStr = bugunBrussels();
  const basStr = gun === 1 ? bugunStr : gunGeri(gun - 1);
  const q = `start=${basStr}`; // end gönderilmez: salt tarihli end günün 00:00'ı sayılıp bugünü dışlıyor
  if (!sessiz) $('ozet-tazelik') && ($('ozet-tazelik').textContent = 'Tazeleniyor…');
  try {
    const yanit = await siraliCek([
      `stats/total?start=${gun === 1 ? bugunStr : gunGeri(2 * gun - 1)}`  /* kıyas için seri iki dönem geriden çekilir */,
      `stats/hits?${q}&limit=10`,
      `stats/toprefs?${q}&limit=8`,
      `stats/locations?${q}&limit=6`,
      `stats/sizes?${q}`,
      `stats/browsers?${q}&limit=5`,
    ]);
    if (!yanit[0] && !yanit[1]) throw new Error('veri alınamadı');
    const m = modelKur(gun, yanit);
    const zaman = Date.now();
    ciz(m, zaman);
    try { sessionStorage.setItem(TRAFIK_ONBELLEK, JSON.stringify({ zaman, model: m })); } catch {}
  } catch (e) {
    $('ozet').innerHTML = `Ziyaret verileri şu an alınamadı. <button class="dugme" type="button" id="trafik-tekrar" style="margin-left:.5rem">Tekrar dene</button>`;
    $('trafik-tekrar').addEventListener('click', () => trafikYukle(seciliGun()));
  } finally {
    trafikMesgul = false;
    if (bekleyenGun && bekleyenGun !== gun) { const g = bekleyenGun; bekleyenGun = null; trafikYukle(g); } else bekleyenGun = null;
  }
}
const seciliGun = () => { const s = document.querySelector('.donem-dugme.secili'); return s ? parseInt(s.dataset.gun, 10) : 7; };
document.querySelectorAll('.donem-dugme').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.donem-dugme').forEach((x) => x.classList.remove('secili'));
  b.classList.add('secili');
  trafikYukle(parseInt(b.dataset.gun, 10));
}));
// Önbellekten anında çizim: panel açılır açılmaz sayılar ekranda olur, tazeleme arkada sürer
(function onbellektenCiz() {
  try {
    const o = JSON.parse(sessionStorage.getItem(TRAFIK_ONBELLEK) || 'null');
    if (o && o.model && o.model.gun === seciliGun() && Date.now() - o.zaman < 86400000) ciz(o.model, o.zaman);
  } catch {}
})();
// Geniş ekranda ikincil tablolar açık, telefonda katlı gelir
if (window.matchMedia('(min-width: 900px)').matches) ['kat-kaynak', 'kat-ulke', 'kat-cihaz', 'kat-degisiklik'].forEach((i) => { $(i).open = true; });
setInterval(() => { if (document.visibilityState === 'visible') trafikYukle(seciliGun(), true); }, 300000);
if (SIRLAR && SIRLAR.goat) $('goat-link').href = `${GOAT}/?access-token=${SIRLAR.goat}`;
else $('goat-link').addEventListener('click', (e) => { e.preventDefault(); alert('Ayrıntılı panel bağlantısı için yeniden giriş yapın.'); });

/* ============================ DURUM ============================ */
/* Beş pil: site, kayıt formu, son yayın, erişim denetimi, namaz vakitleri; altında sitede şu an yayında
   olan bantlar (/admin/durum.json, derlemede üretilir). Pil ancak sorun varsa kızarır/sararır — göz önce
   oraya gider. GitHub API'si anahtarsız saatte 60 istek tanır; sınır dolunca 403 döner ve bu «alınamadı»
   değil «GitHub sınırı» diye yazılır (yanlış alarm olmasın). */
let durumSira = 0;
function pilYaz(id, durum, deger, ipucu) {
  const p = $(id); if (!p) return;
  p.className = 'pil' + (durum === 'kotu' || durum === 'uyari' ? ' ' + durum : '');
  p.querySelector('.nokta').className = 'nokta' + (durum ? ' ' + durum : '');
  p.querySelector('.deger').textContent = deger;
  p.title = ipucu || '';
}
const kisaZaman = (iso) => new Date(iso).toLocaleString('tr-TR', { timeZone: BRUKSEL, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const kisaGun = (ymd) => { const [y, a, g] = String(ymd).slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, a - 1, g, 12)).toLocaleDateString('tr-TR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }); };
const kosuMetni = (k, iyiMetin, kotuMetin) => {
  if (k.status === 'in_progress' || k.status === 'queued') return ['uyari', 'sürüyor…'];
  return k.conclusion === 'success' ? ['iyi', iyiMetin] : ['kotu', kotuMetin];
};
async function durumYukle() {
  const sira = ++durumSira;
  const yokla = async (u) => { try { const r = await fetch(u, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch { return false; } };
  const kosu = async (wf) => {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${wf}/runs?per_page=1`);
      if (r.status === 403 || r.status === 429) return { githubSinir: true };
      const j = await r.json(); return (j.workflow_runs || [])[0] || null;
    } catch { return null; }
  };
  const durumJson = async () => { try { const r = await fetch('/admin/durum.json', { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } };
  const [site, kayit, yayin, uptime, namazKosu, d] = await Promise.all([
    yokla('/tr/'), yokla('/kayit/'), kosu('deploy.yml'), kosu('uptime.yml'), kosu('namaz-vakitleri.yml'), durumJson(),
  ]);
  if (sira !== durumSira) return;   // bu arada Yenile'ye yeniden basıldı; eski cevap ekranı ezmesin
  pilYaz('pil-site', site ? 'iyi' : 'kotu', site ? 'yayında' : 'ERİŞİLEMİYOR');
  pilYaz('pil-kayit', kayit ? 'iyi' : 'kotu', kayit ? 'çalışıyor' : 'ERİŞİLEMİYOR', 'ulucamii.be/kayit/');
  const kosuPili = (id, k, iyiMetin, kotuMetin, ipucu) => {
    if (k && k.githubSinir) { pilYaz(id, '', 'GitHub sınırı', 'GitHub istek sınırı doldu — bir saat içinde kendiliğinden düzelir'); return; }
    if (!k) { pilYaz(id, '', '—', 'Şu an alınamadı'); return; }
    const [durum, metin] = kosuMetni(k, iyiMetin, kotuMetin);
    pilYaz(id, durum, metin + ' · ' + kisaZaman(k.updated_at), ipucu);
  };
  kosuPili('pil-yayin', yayin, 'başarılı', 'BAŞARISIZ', 'Sitenin son derlemesi (deploy.yml)');
  kosuPili('pil-uptime', uptime, 'sorun yok', 'SORUN VAR', 'Saatlik erişim denetimi (uptime.yml): site, kayıt formu ve arka uç yokla­nır');
  /* Namaz vakitleri: veri Diyanet değilse ya da bugünün satırı yoksa kırmızı; kapsam 45 günün altına
     indiyse veya son çekim başarısızsa sarı (yıllık tablo Aralık'ta çekilir; sessizce durursa buradan görülür). */
  if (!d) pilYaz('pil-namaz', '', '—', 'durum.json alınamadı (site henüz yeni sürümle derlenmemiş olabilir)');
  else {
    const n = d.namaz || {};
    const cekim = n.guncelleme ? 'Son çekim: ' + kisaZaman(n.guncelleme) : '';
    const cekimBozuk = namazKosu && !namazKosu.githubSinir && namazKosu.conclusion && namazKosu.conclusion !== 'success';
    if (n.kaynakTuru !== 'diyanet') pilYaz('pil-namaz', 'kotu', 'KAYNAK DİYANET DEĞİL', cekim);
    else if (!n.bugunVar) pilYaz('pil-namaz', 'kotu', 'BUGÜNÜN VERİSİ YOK', cekim);
    else if (n.kalanGun < 45) pilYaz('pil-namaz', 'uyari', `Diyanet · ${n.kalanGun} gün kaldı`, cekim + ' — yıllık tablo henüz çekilmedi');
    else if (cekimBozuk) pilYaz('pil-namaz', 'uyari', 'Diyanet · son çekim başarısız', 'Eldeki veri ' + kisaGun(n.sonGun) + ' tarihine kadar yeter; çekim düzelmezse info@ulucamii.be');
    else pilYaz('pil-namaz', 'iyi', 'Diyanet · son gün ' + kisaGun(n.sonGun), cekim);
    yayindaYaz(d);
  }
}
function yayindaYaz(d) {
  const y = $('yayinda');
  const parcalar = [];
  (d.bantlar || []).forEach((b) => parcalar.push(`<span><b>${kacir(b.ad)}</b>${b.son ? ' · son gün ' + kacir(kisaGun(b.son)) : ''}${b.not ? ' · ' + kacir(b.not) : ''}</span>`));
  (d.heroMesajlar || []).filter((m) => m.son).forEach((m) => parcalar.push(`<span>Kapak şeridi: “${kacir(m.metin)}” · son gün ${kacir(kisaGun(m.son))}</span>`));
  if (!parcalar.length) { y.hidden = true; return; }
  y.hidden = false;
  y.innerHTML = `<span class="etiket">Sitede şu an yayında · derleme ${kacir(kisaZaman(d.derleme))}</span>${parcalar.join('')}`;
}

/* ============================ BAŞVURULAR ============================ */
/* sessionStorage: çocuk/veli verisi sekme kapanınca cihazdan silinir — localStorage'da «Çıkış»a basılmadan kalıyordu (4 Eyl 2026 denetimi) */
const BASVURU_ONBELLEK = 'panel-basvuru-v2';
let aktifTur = 'kayit', sonVeri = null, suzgec = '';
/* Sekmeler WAI-ARIA «tabs» kalıbı: yalnız seçili sekme Tab sırasındadır, ötekine ok tuşlarıyla geçilir
   (Sol/Sağ/Home/End). Eski «sekmeSecildi» bayrağı hiçbir yerde okunmuyordu — kaldırıldı. */
const SEKMELER = [...document.querySelectorAll('.sekme')];
function sekmeSec(s, odakla) {
  SEKMELER.forEach((x) => { const secili = x === s; x.setAttribute('aria-selected', String(secili)); x.tabIndex = secili ? 0 : -1; });
  $('basvuru-alan').setAttribute('aria-labelledby', s.id);
  aktifTur = s.dataset.tur;
  if (odakla) s.focus();
  if (sonVeri) basvuruCiz();
}
SEKMELER.forEach((s, i) => {
  s.addEventListener('click', () => sekmeSec(s));
  s.addEventListener('keydown', (e) => {
    const n = SEKMELER.length;
    const hedef = e.key === 'ArrowRight' ? SEKMELER[(i + 1) % n] : e.key === 'ArrowLeft' ? SEKMELER[(i - 1 + n) % n]
      : e.key === 'Home' ? SEKMELER[0] : e.key === 'End' ? SEKMELER[n - 1] : null;
    if (hedef) { e.preventDefault(); sekmeSec(hedef, true); }
  });
});
$('basvuru-ara').addEventListener('input', (e) => { suzgec = e.target.value.trim().toLocaleLowerCase('tr'); if (sonVeri) basvuruCiz(); });

let basvuruSira = 0, sonAlinma = 0;
async function basvuruYukle(sessiz) {
  const durum = $('basvuru-durum');
  const bilgi = $('basvuru-bilgi');
  const sira = ++basvuruSira;
  if (!sessiz) durum.textContent = 'Yükleniyor…';
  if (!SIRLAR || !SIRLAR.gas) {
    durum.textContent = '';
    bilgi.hidden = false; bilgi.className = 'bilgi-kutu uyari';
    bilgi.innerHTML = 'Erişim paketi eksik — lütfen <a href="/admin/giris.html">yeniden giriş</a> yapın.';
    return;
  }
  try {
    const j = await gasIstek('liste');
    if (sira !== basvuruSira) return;   // daha yeni bir istek yolda; eski cevap ekranı ezmesin
    if (j && j.hata === 'yetki') {
      durum.textContent = '';
      bilgi.hidden = false; bilgi.className = 'bilgi-kutu hata'; $('basvuru-liste').innerHTML = '';
      bilgi.innerHTML = 'Panel anahtarı kabul edilmedi — bir kez <a href="/admin/giris.html">yeniden giriş</a> yapın. Sorun sürerse arka uçtaki anahtar yenilenmiş olabilir; info@ulucamii.be adresine yazın.';
      return;
    }
    if (!j.kayitlar && !j.ihtidalar) {
      durum.textContent = '';
      bilgi.hidden = false; bilgi.className = 'bilgi-kutu uyari'; $('basvuru-liste').innerHTML = '';
      bilgi.innerHTML = '<b>Arka uç güncellemesi bekleniyor.</b> Başvuru listeleme henüz dağıtılmadı; başvurular yine de kayıt defterine düşüyor, veri kaybı yok.';
      return;
    }
    sonVeri = j; sonAlinma = Date.now();
    try { sessionStorage.setItem(BASVURU_ONBELLEK, JSON.stringify({ zaman: sonAlinma, veri: j })); } catch {}
    durum.textContent = 'Güncellendi: ' + new Date(sonAlinma).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    basvuruCiz();
  } catch (e) {
    if (sira !== basvuruSira) return;
    /* Başarısız tazeleme ekrandaki son başarılı zamanı silmesin: yönetici verinin ne kadar eski olduğunu görsün. */
    durum.textContent = sonAlinma ? neZaman(sonAlinma) + ' alındı · tazelenemedi' : '';
    if (!sonVeri) {
      bilgi.hidden = false; bilgi.className = 'bilgi-kutu hata';
      bilgi.innerHTML = 'Listeye şu an ulaşılamadı. <button class="dugme" type="button" id="basvuru-tekrar" style="margin-left:.5rem">Tekrar dene</button>';
      $('basvuru-tekrar').addEventListener('click', () => basvuruYukle());
    }
  }
}

/* Panel HER ZAMAN Kur'an kursu kayıtlarıyla açılır. Önceden "boş sekmede kalınmasın"
   diye dolu olan listeye kendiliğinden geçiliyordu; kayıt 0, ihtida 1 olduğu için panel
   İhtida Başvuruları ekranıyla açılıyor ve iki defter karışmış gibi görünüyordu
   (26 Ağustos 2026, Rıdvan bildirdi). Hangi defterde olduğun her zaman seçili sekmeden
   ve rozetlerden okunur; sekmeyi kullanıcı değiştirir, panel değil. */
function rozetleriYaz() {
  /* Satır değil ÖĞRENCİ sayılır: düzeltilmiş bir kayıt defterde iki satırdır. */
  const k = grupSayisi(sonVeri && sonVeri.kayitlar);
  const i = grupSayisi(sonVeri && sonVeri.ihtidalar);
  $('rozet-kayit').textContent = '(' + k + ')';
  $('rozet-ihtida').textContent = '(' + i + ')';
  /* Toplam yazmak yanıltıyordu: tek bir "(1)" öğrenci kaydı sanılabiliyordu.
     İki defter ayrı ayrı okunur — kurs · ihtida. */
  const yeniSay = (v) => { if (!v || !v.basliklar) return 0; const iZ = sut(v.basliklar, 'zaman damgası', 'zaman'); return iZ < 0 ? 0 : gruplaSurumler(v).filter((g) => yeniMi(g.guncel[iZ])).length; };
  const yeni = yeniSay(sonVeri && sonVeri.kayitlar) + yeniSay(sonVeri && sonVeri.ihtidalar);
  $('gez-rozet').className = 'rozet' + (yeni ? ' yeni' : '');
  $('gez-rozet').textContent = yeni ? yeni + ' yeni' : ((k + i) ? '(' + k + '·' + i + ')' : '');
  $('gez-rozet').title = 'Kur’an kursu kayıtları: ' + k + ' · İhtida başvuruları: ' + i;
}

/** Sütun başlığından alan sırası bulur — arka uç şeması değişse de kart doğru kurulur. */
/* Önce TAM eşleşme, sonra içerme: «durum» adayı «Kurs durumu» / «Öğrenim durumu» sütununa
   takılıyordu; rozet kurs durumunu gösteriyor, e-posta gönderilemedi uyarısı hiç çıkmıyordu (4 Eyl 2026). */
const sut = (basliklar, ...adaylar) => {
  const kucuk = basliklar.map((b) => String(b).trim().toLocaleLowerCase('tr'));
  for (const a of adaylar) { const i = kucuk.indexOf(a); if (i !== -1) return i; }
  for (const a of adaylar) { const i = kucuk.findIndex((b) => b.includes(a)); if (i !== -1) return i; }
  return -1;
};

/* SÜRÜM GRUPLAMA (27 Ağustos 2026, Rıdvan bildirdi).
   Bir kaydın düzeltilmesi deftere YENİ bir satır yazar (UC-2026-0002 → -R2) ve
   eskisini "Güncellendi →" diye işaretler; defter böylece bir denetim izi olur ve
   bu doğru bir tasarımdır. Ama panel her satırı ayrı kart olarak çiziyordu: aynı
   öğrenci iki kez kaydedilmiş gibi görünüyor, sayaç da öğrenci değil satır
   sayıyordu. Artık bir öğrenci bir karttır; eski sürümler kartın içindedir. */
const refKok = (d) => String(d ?? '').trim().replace(/-R\d+$/i, '');
const refSurum = (d) => { const m = String(d ?? '').trim().match(/-R(\d+)$/i); return m ? Number(m[1]) : 1; };

function gruplaSurumler(v) {
  if (!v || !v.satirlar || !v.satirlar.length) return [];
  const iRef = sut(v.basliklar, 'referans');
  const sira = [];
  const harita = new Map();
  v.satirlar.forEach((r, i) => {
    const kok = iRef >= 0 ? refKok(r[iRef]) : '';
    const anahtar = kok || ('satir-' + i);   // referanssız satır kendi başına durur
    if (!harita.has(anahtar)) { harita.set(anahtar, []); sira.push(anahtar); }
    harita.get(anahtar).push(r);
  });
  return sira.map((a) => {
    const hepsi = harita.get(a).slice()
      .sort((x, y) => refSurum(iRef >= 0 ? y[iRef] : '') - refSurum(iRef >= 0 ? x[iRef] : ''));
    return { hepsi, guncel: hepsi[0], eskiler: hepsi.slice(1) };
  });
}

const grupSayisi = (v) => gruplaSurumler(v).length;

function basvuruCiz() {
  rozetleriYaz();
  const v = aktifTur === 'kayit' ? sonVeri.kayitlar : sonVeri.ihtidalar;
  const liste = $('basvuru-liste');
  $('basvuru-bilgi').hidden = true;
  if (!v || !v.satirlar || !v.satirlar.length) {
    const digerSay = grupSayisi(aktifTur === 'kayit'
      ? (sonVeri && sonVeri.ihtidalar) : (sonVeri && sonVeri.kayitlar));
    const digerAd = aktifTur === 'kayit' ? 'İhtida Başvuruları' : 'Kur’an Kursu Kayıtları';
    const digerNot = digerSay ? ` <b>${digerAd}</b> sekmesinde ${digerSay} kayıt var.` : '';
    liste.innerHTML = `<div class="bilgi-kutu">${aktifTur === 'kayit' ? 'Kur’an kursu için henüz online kayıt gelmedi.' : 'Henüz ihtida başvurusu gelmedi.'} Yeni başvurular buraya kendiliğinden düşer.${digerNot}</div>`;
    $('csv').disabled = true; return;
  }
  const b = v.basliklar;
  const iZaman = sut(b, 'zaman damgası', 'zaman'), iRef = sut(b, 'referans'), iDurum = sut(b, 'durum'), iPdf = sut(b, 'pdf bağlantısı', 'pdf');
  const iSaglik = aktifTur === 'kayit' ? sut(b, 'sağlık notu') : -1;
  const iAd = aktifTur === 'kayit' ? sut(b, 'öğrenci adı', 'adı') : sut(b, 'adı soyadı', 'adı');
  const iSoyad = aktifTur === 'kayit' ? sut(b, 'öğrenci soyadı', 'soyadı') : -1;
  const iTel = aktifTur === 'kayit' ? sut(b, 'veli cep', 'cep', 'telefon') : sut(b, 'telefon', 'cep');
  const iVeli = sut(b, 'veli adı');
  const iOkul = sut(b, 'okul'), iSinif = sut(b, 'sınıf'), iEposta = sut(b, 'e-posta');
  /* Arama eski sürümlerde de eşleşir: elindeki eski numarayla arayan bulur. */
  const gruplar = gruplaSurumler(v)
    .filter((g) => !suzgec || g.hepsi.some((r) => r.join(' ').toLocaleLowerCase('tr').includes(suzgec)));
  if (!gruplar.length) { liste.innerHTML = '<div class="bilgi-kutu">Aramaya uyan başvuru yok.</div>'; $('csv').disabled = false; return; }
  const al = (r, i) => i >= 0 ? String(r[i] ?? '').trim() : '';
  const duzeltilenVar = gruplar.some((g) => g.eskiler.length);
  liste.innerHTML = gruplar.map(({ guncel: r, eskiler }) => {
    const ad = [al(r, iAd), al(r, iSoyad)].filter(Boolean).join(' ') || '(isim yok)';
    const durum = al(r, iDurum);
    /* Sira onemli: "Yeni kayit · e-posta gonderilemedi" hem "yeni" hem sorun icerir;
       sorun kazanmali, yoksa uyari normal kayit gibi gorunur. */
    const sorun = /gönderilemedi|gonderilemedi|hata|başarısız|basarisiz/i.test(durum);
    const duzeltildi = !sorun && eskiler.length > 0;
    const yeni = !sorun && yeniMi(al(r, iZaman));   // son ziyaretten sonra geldi
    /* Ham durum metni ("Güncel kayıt (revizyon)") kartta yer tutuyor ama bilgi
       vermiyordu; kaçıncı sürüm olduğunu söylemek daha faydalı. */
    const rozetMetni = duzeltildi ? (refSurum(al(r, iRef)) + '. sürüm · düzeltildi') : sorun ? durumOzet(durum) : yeni ? 'Yeni' : '';
    const tel = al(r, iTel), pdf = al(r, iPdf), eposta = al(r, iEposta);
    const bilgiler = [];
    if (al(r, iZaman)) bilgiler.push(`<span>${kacir(tarihSadelestir(al(r, iZaman)))}</span>`);
    if (aktifTur === 'kayit') {
      if (al(r, iVeli)) bilgiler.push(`<span>Veli: <b>${kacir(al(r, iVeli))}</b></span>`);
      const okul = [al(r, iOkul), al(r, iSinif)].filter(Boolean).join(' · ');
      if (okul) bilgiler.push(`<span>${kacir(okul)}</span>`);
    }
    if (tel) bilgiler.push(`<span>☎ <b>${kacir(telefonBicim(tel))}</b></span>`);
    if (iSaglik >= 0 && al(r, iSaglik)) bilgiler.push('<span class="saglik">Sağlık notu var</span>');
    const araclar = [];
    if (tel) {
      const e164 = telefonE164(tel);
      araclar.push(`<a class="dugme" href="tel:${kacir(e164)}">Ara</a>`);
      araclar.push(`<a class="dugme" href="https://wa.me/${kacir(e164.replace(/^\+/, ''))}" target="_blank" rel="noopener">WhatsApp ↗</a>`);
    }
    if (eposta && eposta.includes('@')) araclar.push(`<a class="dugme" href="mailto:${kacir(eposta)}">E-posta</a>`);
    if (pdf.startsWith('http')) araclar.push(pdfDugmesi(pdf, `${al(r, iRef) || 'form'} - ${ad}.pdf`, 'Form PDF', 'dugme'));
    if (aktifTur === 'ihtida' && al(r, iRef)) araclar.push(`<button class="dugme birincil" type="button" data-ek9="${kacir(al(r, iRef))}">EK-9 belgesi üret</button>`);
    const eskiSurumler = eskiler.length ? `<details class="eski-surum"><summary>Önceki sürümler (${eskiler.length})</summary><table>${
      eskiler.map((e) => {
        const epdf = al(e, iPdf);
        return `<tr><th>${kacir(al(e, iRef))}</th><td>${kacir(tarihSadelestir(al(e, iZaman)))}${
          epdf.startsWith('http') ? ` · ${pdfDugmesi(epdf, `${al(e, iRef) || 'form'} - ${ad}.pdf`, 'Form PDF', 'pdf-bag')}` : ''}</td></tr>`;
      }).join('')
    }</table><p class="eski-not">Bu sürümler veli tarafından düzeltildi. Geçerli olan, yukarıdaki ${kacir(al(r, iRef))} numaralı kayıttır.</p></details>` : '';
    const ayrinti = b.map((baslik, i) => {
      const ham = String(r[i] ?? '').trim();
      if (!ham) return '';
      const deger = ham.startsWith('http')
        ? pdfDugmesi(ham, `${al(r, iRef) || 'form'} - ${ad}.pdf`, 'Form PDF', 'pdf-bag')
        : degerBicimle(baslik, ham);
      const vurgu = /sağlık notu/i.test(baslik) ? ' class="vurgu"' : '';
      return `<tr${vurgu}><th>${kacir(baslik)}</th><td>${deger}</td></tr>`;
    }).join('');
    return `<article class="bkart${yeni ? ' yeni' : ''}">
      <div class="bkart-ust"><span class="bkart-ad">${kacir(ad)}</span>${al(r, iRef) ? `<span class="bkart-ref">${kacir(al(r, iRef))}</span>` : ''}${rozetMetni ? `<span class="rozet-durum${sorun ? ' sorun' : (duzeltildi ? ' duzeltme' : (yeni ? ' yeni' : ''))}">${kacir(rozetMetni)}</span>` : ''}</div>
      <div class="bkart-satir">${bilgiler.join('')}</div>
      ${araclar.length ? `<div class="bkart-arac">${araclar.join('')}</div>` : ''}
      <details><summary>Tüm bilgiler</summary><table>${ayrinti}</table></details>
      ${eskiSurumler}
    </article>`;
  }).join('');
  $('basvuru-not').innerHTML = duzeltilenVar
    ? 'Düzeltilen kayıtların eski sürümleri kartın içindedir; dışa aktarımda yalnız güncel sürümler yer alır.'
    : '';
  $('basvuru-not').hidden = !duzeltilenVar;
  liste.querySelectorAll('[data-ek9]').forEach((d) => d.addEventListener('click', () => ek9Uretimi(d)));
  liste.querySelectorAll('[data-pdf]').forEach((d) => d.addEventListener('click', () => formPdfAc(d)));
  $('csv').disabled = false;
}

/* ---------------- Form PDF (Drive'dan, panel anahtarıyla) ----------------
   Defterdeki «PDF bağlantısı» Drive'ın yalnız dosya sahibine (dernek hesabı) açık
   adresidir; panele başka bir Google hesabıyla girmiş yönetici o bağlantıda Drive'ın
   «erişim isteyin» sayfasına düşüyordu (4 Eylül 2026). Dosya artık GAS ?islem=pdf ucundan
   panel anahtarıyla alınır ve tarayıcıda blob olarak açılır; Drive dosyaları özel kalır.

   Sekme TIKLAMA ANINDA açılır (eşzamanlı, kullanıcı jesti sürerken); GAS cevabı 2-6 sn
   sürebilir ve o kadar sonra çağrılan window.open açılır-pencere engeline takılır —
   yani tam da istenmeyen "izin" sorusu çıkar. Boş sekme «hazırlanıyor» der, dosya
   gelince oraya yüklenir. Aynı dosya ikinci tıklamada önbellekten anında açılır. */
const PDF_ONBELLEK = new Map();   // Drive kimliği → { url, ad } (sekme ömrü boyunca, en çok PDF_ONBELLEK_SINIR)
const PDF_ONBELLEK_SINIR = 12;
const onbellegeKoy = (id, girdi) => {
  PDF_ONBELLEK.set(id, girdi);
  /* Üst sınır: en eski blob serbest bırakılır (4 Eyl 2026 incelemesi: sınırsız Map'te onlarca 100 KB'lık
     PDF sekme ömrü boyunca bellekte kalıyordu). Açık sekmede yüklü belge etkilenmez; yalnız o sekmeyi
     yenilemek yeni istek gerektirir. */
  while (PDF_ONBELLEK.size > PDF_ONBELLEK_SINIR) {
    const [eskiId, eski] = PDF_ONBELLEK.entries().next().value;
    URL.revokeObjectURL(eski.url); PDF_ONBELLEK.delete(eskiId);
  }
};
const driveKimligi = (url) => {
  const m = String(url ?? '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || String(url ?? '').match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : '';
};
/* Drive bağlantısıysa panel içinden açan düğme; değilse (ileride başka bir depo olursa) düz bağlantı. */
const pdfDugmesi = (url, dosyaAdi, etiket, sinif) => {
  const id = driveKimligi(url);
  if (!id) return `<a class="${sinif}" href="${kacir(url)}" target="_blank" rel="noopener">${kacir(etiket)} ↗</a>`;
  return `<button class="${sinif}" type="button" data-pdf="${kacir(id)}" data-pdf-ad="${kacir(dosyaAdi)}">${kacir(etiket)}</button>`;
};
/* iPadOS 13+ kendini Mac olarak tanıtır; çok noktalı dokunma ile ayırt edilir. */
const mobilCihaz = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
/* Açılan sekmeyi PDF'e çevirir. Masaüstünde ince bir üst çubuk (dosya adı · İndir · Yazdır) + iframe:
   blob adresinin dosya adı olmadığından görüntüleyicinin kendi «indir»i rastgele bir ad verirdi (inceleme
   bulgusu); İndir bağlantısı download özniteliğiyle gerçek adı — GAS'ın döndürdüğü Drive adını — verir.
   Telefon/tablette iframe'li PDF güvenilir değildir (iOS Safari yalnız ilk sayfayı gösterir, Android
   Chrome göstermez): orada sekme doğrudan blob'a gider, sistemin PDF görüntüleyicisi açılır. */
function pdfSekmesiniDoldur(pencere, url, ad) {
  if (mobilCihaz()) { pencere.location.href = url; return; }
  const d = pencere.document;
  d.title = ad;
  d.body.replaceChildren();
  d.body.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;font:14px system-ui,sans-serif;background:#24201c;color:#f7f3ea';
  const bar = d.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;gap:.8rem;padding:.45rem .9rem;background:#2f2924;border-bottom:1px solid rgba(255,255,255,.12)';
  const isim = d.createElement('span');
  isim.textContent = ad; isim.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const indir = d.createElement('a'); indir.href = url; indir.download = ad; indir.textContent = 'İndir';
  const yazdir = d.createElement('button'); yazdir.type = 'button'; yazdir.textContent = 'Yazdır';
  for (const el of [indir, yazdir]) el.style.cssText = 'color:#f7f3ea;background:none;border:1px solid rgba(255,255,255,.4);border-radius:3px;padding:.3rem .7rem;font:inherit;line-height:1.2;text-decoration:none;cursor:pointer';
  const cerceve = d.createElement('iframe');
  cerceve.src = url; cerceve.title = ad; cerceve.style.cssText = 'flex:1;border:0;width:100%';
  yazdir.addEventListener('click', () => { try { cerceve.contentWindow.focus(); cerceve.contentWindow.print(); } catch { pencere.print(); } });
  bar.append(isim, indir, yazdir);
  d.body.append(bar, cerceve);
}
async function formPdfAc(dugme) {
  const id = dugme.dataset.pdf;
  if (!SIRLAR || !SIRLAR.gas) { alert('Erişim paketi eksik — lütfen yeniden giriş yapın.'); return; }
  const hazir = PDF_ONBELLEK.get(id);
  const pencere = window.open('', '_blank');
  /* Yalnız AÇILIŞ engellendiyse aynı sekmeye düşülür. Kullanıcının bekleme sırasında boş sekmeyi
     kapatması ayrı durumdur: o zaman panel sekmesine DOKUNULMAZ (inceleme bulgusu, 4 Eyl 2026 —
     pencere.closed'a bakan eski koşul panelin kendisini PDF'e çeviriyordu). */
  const engellendi = !pencere;
  if (hazir) {
    if (engellendi) window.location.assign(hazir.url); else pdfSekmesiniDoldur(pencere, hazir.url, hazir.ad);
    return;
  }
  const ad0 = dugme.dataset.pdfAd || 'form.pdf';
  if (!engellendi) {
    try {
      pencere.document.title = ad0;
      const not = pencere.document.createElement('p');
      not.style.cssText = 'font:16px system-ui,sans-serif;color:#4a3728;padding:2rem';
      not.textContent = 'Form hazırlanıyor… (' + ad0 + ')';
      pencere.document.body.replaceChildren(not);
    } catch {}
  }
  const eskiMetin = dugme.textContent;
  dugme.disabled = true; dugme.textContent = 'Açılıyor…';
  try {
    const j = await gasIstek('pdf', { id });
    if (!j.ok || !j.pdfB64) {
      throw new Error(j.hata === 'bulunamadi' ? 'Bu form Drive\'da bulunamadı (silinmiş ya da taşınmış olabilir).'
        : j.hata === 'yetki' ? 'Erişim anahtarı geçersiz — lütfen yeniden giriş yapın.'
        : 'Form alınamadı; arka uç henüz güncellenmemiş olabilir.');
    }
    const ikili = atob(j.pdfB64);
    const bayt = new Uint8Array(ikili.length);
    for (let i = 0; i < ikili.length; i++) bayt[i] = ikili.charCodeAt(i);
    const ad = j.ad || ad0;
    const url = URL.createObjectURL(new File([bayt], ad, { type: 'application/pdf' }));
    onbellegeKoy(id, { url, ad });
    if (engellendi) window.location.assign(url);              // sekme hiç açılamadı: aynı sekmede; geri tuşu panele döner
    else if (!pencere.closed) pdfSekmesiniDoldur(pencere, url, ad);
    // kapatıldıysa: dosya önbellekte, bir sonraki tıklama anında açar
  } catch (e) {
    if (pencere && !pencere.closed) pencere.close();
    alert(e.message || 'Form alınamadı.');
  } finally {
    dugme.disabled = false; dugme.textContent = eskiMetin;
  }
}

/* ---------------- EK-9 İhtida Belgesi (resmî şablon üzerine) ----------------
   Belgeyi düzenleyen makam camidir; şahit imzası verilmemişse din görevlisinin
   (ve gerekiyorsa eşinin) imzasıyla tamamlanır. İmza görselleri yalnız şifreli
   sır paketinden gelir — hiçbir açık adreste durmaz. */
const EK9_ETIKET = {
  cinsiyet: { erkek: 'Erkek / Homme', kadin: 'Kadın / Femme', kadın: 'Kadın / Femme' },
  oncekiDin: {
    'hristiyan-katolik': 'Hristiyanlık / Katolik', 'hristiyan-ortodoks': 'Hristiyanlık / Ortodoks',
    'hristiyan-protestan': 'Hristiyanlık / Protestan', 'hristiyan-diger': 'Hristiyanlık',
    'musevi': 'Musevilik', 'budist': 'Budizm', 'hindu': 'Hinduizm',
    'ateist': 'Ateist', 'agnostik': 'Agnostik', 'dinsiz': 'Dinî bağı yok', 'yok': 'Dinî bağı yok',
  },
  medeniHali: { bekar: 'Bekâr', evli: 'Evli', bosanmis: 'Boşanmış', dul: 'Dul' },
  ogrenim: {
    ilkokul: 'İlkokul', ortaokul: 'Ortaokul', lise: 'Lise', onlisans: 'Ön lisans',
    lisans: 'Lisans', yukseklisans: 'Yüksek lisans', doktora: 'Doktora', diger: 'Diğer',
  },
};
const ek9Etiket = (tur, deger) => {
  const d = String(deger || '').trim();
  if (!d) return '';
  const s = EK9_ETIKET[tur] && EK9_ETIKET[tur][d.toLocaleLowerCase('tr')];
  return s || (d.charAt(0).toLocaleUpperCase('tr') + d.slice(1));
};
/** "23.08.2026 20:01" / "1979-04-24" gibi değerleri belgedeki gg/aa/yyyy biçimine getirir. */
const ek9Tarih = (deger) => {
  const d = tarihSadelestir(String(deger || '').trim());
  if (!d) return '';
  let e = d.match(/^(\d{2})[.\/](\d{2})[.\/](\d{4})/);
  if (e) return `${e[1]}/${e[2]}/${e[3]}`;
  e = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (e) return `${e[3]}/${e[2]}/${e[1]}`;
  return d;
};
/** Sheets telefonu sayıya çevirip baştaki "+" işaretini düşürüyor; okunur biçime getirilir.
 *  Panel kartlarında da kullanılır — `tel:` bağlantısı ülke kodsuz kalırsa yanlış numara aranır. */
const telefonBicim = (deger) => {
  const ham = String(deger || '').trim();
  if (!ham) return '';
  const rakam = ham.replace(/\D/g, '');
  if (rakam.length < 9) return ham;
  if (rakam.startsWith('32') && rakam.length === 11) return `+32 ${rakam.slice(2, 5)} ${rakam.slice(5, 7)} ${rakam.slice(7, 9)} ${rakam.slice(9)}`;
  if (rakam.startsWith('90') && rakam.length === 12) return `+90 ${rakam.slice(2, 5)} ${rakam.slice(5, 8)} ${rakam.slice(8, 10)} ${rakam.slice(10)}`;
  // Türkiye yerel biçimi: 0 + 10 hane (0532 123 45 67). Belçika yerelinden (0 + 9 hane)
  // uzunlukla ayrılır; ayrılmazsa "+05321234567" gibi geçersiz bir dize üretiliyordu.
  if (rakam.startsWith('0') && rakam.length === 11) return `+90 ${rakam.slice(1, 4)} ${rakam.slice(4, 7)} ${rakam.slice(7, 9)} ${rakam.slice(9)}`;
  if (rakam.startsWith('0') && rakam.length === 10) return `0${rakam.slice(1, 4)} ${rakam.slice(4, 6)} ${rakam.slice(6, 8)} ${rakam.slice(8)}`;
  if (rakam.startsWith('0') && rakam.length === 9) return `${rakam.slice(0, 3)} ${rakam.slice(3, 5)} ${rakam.slice(5, 7)} ${rakam.slice(7)}`;   // Belçika sabit hat: 084 31 11 11
  /* Formun sunduğu öbür ülke kodları (Lüksemburg, Fas, Hollanda, Fransa…): kod + üçlü öbekler ("+352 661 909 497"). */
  const kod = ['352', '212', '31', '33', '34', '39', '44', '49'].find((k) => rakam.startsWith(k));
  if (kod && rakam.length >= kod.length + 8) {
    const kalan = rakam.slice(kod.length);
    const ilk = kalan.length % 3 === 1 ? 4 : (kalan.length % 3 === 2 ? 2 : 3);
    return `+${kod} ${[kalan.slice(0, ilk), ...(kalan.slice(ilk).match(/.{1,3}/g) || [])].join(' ')}`;
  }
  return ham.startsWith('+') ? ham : '+' + rakam;
};
/** `tel:` için E.164: yalnız rakamlar, başında ülke kodu ve "+". */
const telefonE164 = (deger) => {
  const rakam = String(deger || '').replace(/\D/g, '');
  if (!rakam) return '';
  if (rakam.startsWith('00')) return '+' + rakam.slice(2);
  if (rakam.startsWith('0') && rakam.length === 11) return '+90' + rakam.slice(1);  // yerel Türkiye numarası
  if (rakam.startsWith('0')) return '+32' + rakam.slice(1);      // yerel Belçika numarası
  return '+' + rakam;
};
const bugunTR = () => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
};
/** Kullanıcıdan yerel bir görsel ister (eski başvurularda vesikalık arka uçta saklanmamış olabilir). */
function dosyaSec(kabul) {
  return new Promise((coz) => {
    const g = document.createElement('input');
    g.type = 'file'; g.accept = kabul || 'image/*';
    g.addEventListener('change', () => {
      const dosya = g.files && g.files[0];
      if (!dosya) return coz('');
      const okuyucu = new FileReader();
      okuyucu.onload = () => coz(String(okuyucu.result || ''));
      okuyucu.onerror = () => coz('');
      okuyucu.readAsDataURL(dosya);
    });
    g.addEventListener('cancel', () => coz(''));
    g.click();
  });
}

let ek9Modul = null, ek9Kaynak = null;
async function ek9Hazirla() {
  if (!ek9Modul) {
    // pdf-lib/fontkit'in ESM yapıları "pako" gibi çıplak modül adlarını dışarıdan bekler
    // (tarayıcıda import map olmadan çözülmez) — bu yüzden UMD paketleri script ile yüklenir.
    const betikYukle = (src) => new Promise((coz, red) => {
      const b = document.createElement('script');
      b.src = src; b.onload = () => coz(); b.onerror = () => red(new Error(src + ' yüklenemedi'));
      document.head.appendChild(b);
    });
    if (!window.PDFLib) await betikYukle('/vendor/pdf-lib.min.js');
    if (!window.fontkit) await betikYukle('/vendor/fontkit.umd.min.js');
    const modul = await import('/admin/ek9.js');
    ek9Modul = { pdfLib: window.PDFLib, fontkit: window.fontkit, uret: modul.ek9Uret };
  }
  if (!ek9Kaynak) {
    const getirBaytlari = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + ' alınamadı'); return r.arrayBuffer(); }).then((b) => new Uint8Array(b));
    const [sablon, font, fontKalin] = await Promise.all([
      getirBaytlari('/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'),
      getirBaytlari('/fonts/Lora-Regular.ttf'),
      getirBaytlari('/fonts/Lora-Bold.ttf'),
    ]);
    ek9Kaynak = { sablon, font, fontKalin };
  }
}

async function ek9Uretimi(dugme) {
  const ref = dugme.dataset.ek9;
  const eskiMetin = dugme.textContent;
  const durumYaz = (metin) => { dugme.textContent = metin; };
  dugme.disabled = true;
  try {
    durumYaz('Hazırlanıyor…');
    await ek9Hazirla();
    if (!SIRLAR || !SIRLAR.gas) throw new Error('Erişim paketi eksik — yeniden giriş yapın.');

    const j = await gasIstek('belge', { ref });
    if (!j.ok) throw new Error(j.hata === 'bulunamadi' ? 'Başvuru bulunamadı.' : 'Belge verisi alınamadı.');
    const k = j.kayit || {};

    let vesikalik = j.vesikalik || '';
    if (!vesikalik) {
      durumYaz('Fotoğraf seçin…');
      vesikalik = await dosyaSec('image/*');
      if (!vesikalik && !confirm('Vesikalık fotoğraf yok. Belge fotoğrafsız üretilsin mi?')) { durumYaz(eskiMetin); dugme.disabled = false; return; }
    }
    durumYaz('Belge üretiliyor…');

    const imzalar = (SIRLAR && SIRLAR.imzalar) || {};
    const yedekler = [];
    if (imzalar.ridvan) yedekler.push({ ad: 'Rıdvan KAYAHAN', imza: imzalar.ridvan });
    if (imzalar.yeliz) yedekler.push({ ad: 'Yeliz KAYAHAN', imza: imzalar.yeliz });

    /* Vesikalik verildigi halde gomulemezse (WEBP/HEIC gibi bir bicim tarayicida da
       cozulemediyse) belge sessizce fotografsiz cikmasin. */
    const ek9Uyarilari = [];
    const bytes = await ek9Modul.uret({
      uyar: (kod) => ek9Uyarilari.push(kod),
      pdfLib: ek9Modul.pdfLib, fontkit: ek9Modul.fontkit,
      sablonBytes: ek9Kaynak.sablon, fontBytes: ek9Kaynak.font, fontKalinBytes: ek9Kaynak.fontKalin,
      veri: {
        adSoyad: k['Adı Soyadı'] || '',
        belgeNo: '',                                   // Müşavirlik/Müftülük doldurur
        belgeTarihi: bugunTR(),
        duzenleyen: 'Marche-en-Famenne Ulu Camii',
        cinsiyet: ek9Etiket('cinsiyet', k['Cinsiyet']),
        ogrenim: ek9Etiket('ogrenim', k['Öğrenim durumu']),
        anneAdi: k['Anne adı'] || '',
        babaAdi: k['Baba adı'] || '',
        dogumYeri: k['Doğum yeri'] || '',
        dogumTarihi: ek9Tarih(k['Doğum tarihi']),
        medeniHali: ek9Etiket('medeniHali', k['Medeni hali']),
        meslek: k['Mesleği'] || '',
        uyruk: k['Uyruk'] || '',
        tcKimlik: k['T.C. Kimlik No'] || '',
        oncekiDin: ek9Etiket('oncekiDin', k['Önceki din/mezhep']),
        ihtidaSebebi: k['İhtida sebebi'] || '',
        ihtidaTarihi: ek9Tarih(k['Tören tarihi tercihi']) || bugunTR(),
        eposta: k['E-posta'] || '',
        telefon: telefonBicim(k['Telefon']),
        adres: k['Adres'] || '',
        beyanTarihi: ek9Tarih(k['Zaman damgası']) || bugunTR(),
      },
      foto: vesikalik,
      sahitler: j.sahitler || [],
      yedekImzalar: yedekler,
      basvuranImza: j.basvuranImza || '',
      tarih: new Date(),
    });

    const ad = `EK-9 Ihtida Belgesi ${ref}.pdf`;
    const bag = document.createElement('a');
    bag.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    bag.download = ad; bag.click();
    setTimeout(() => URL.revokeObjectURL(bag.href), 20000);
    if (ek9Uyarilari.includes('vesikalik-gomulemedi')) {
      durumYaz('⚠ Fotoğrafsız');
      alert('Belge indirildi, ancak vesikalık fotoğraf okunamadığı için belgeye YERLEŞTİRİLEMEDİ.\n\n'
        + 'Fotoğrafı JPEG veya PNG olarak kaydedip belgeyi yeniden üretin.');
    } else {
      durumYaz('✓ İndirildi');
    }
    setTimeout(() => { durumYaz(eskiMetin); dugme.disabled = false; }, 4000);
  } catch (hata) {
    console.error(hata);
    alert('EK-9 belgesi üretilemedi: ' + (hata && hata.message ? hata.message : hata));
    durumYaz(eskiMetin); dugme.disabled = false;
  }
}

$('basvuru-yenile').addEventListener('click', () => basvuruYukle());
$('csv').addEventListener('click', () => {
  const v = aktifTur === 'kayit' ? sonVeri.kayitlar : sonVeri.ihtidalar;
  /* Excel/LibreOffice, hücre "=", "+", "-" veya "@" ile başlıyorsa onu FORMÜL sayar.
     Başvurandan gelen bir metin (ör. adres alanına yazılmış "=cmd|...") böylece
     din görevlisinin bilgisayarında çalışabilirdi. Zararsız bir tek tırnak öneki
     hücreyi metin olarak sabitler (25 Ağustos 2026 denetimi). */
  const tirnak = (s) => {
    let d = String(s ?? '');
    if (/^[=+\-@\t\r]/.test(d)) d = "'" + d;
    return '"' + d.replace(/"/g, '""') + '"';
  };
  /* Yalnız güncel sürümler: düzeltilmiş bir kaydın eski satırı da girseydi
     sınıf listesinde öğrenci iki kez görünürdü. Denetim izi defterde durur. */
  const disaAktarilan = gruplaSurumler(v).map((g) => g.guncel);
  const csv = [v.basliklar.map(tirnak).join(';'), ...disaAktarilan.map((r) => r.map(tirnak).join(';'))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = (aktifTur === 'kayit' ? 'kuran-kursu-kayitlari' : 'ihtida-basvurulari') + '.csv'; a.click();
});
// Önbellekten anında çizim, ardından arka planda tazeleme
(function basvuruOnbellek() {
  try {
    const o = JSON.parse(sessionStorage.getItem(BASVURU_ONBELLEK) || 'null');
    if (o && o.veri && Date.now() - o.zaman < 604800000) { sonVeri = o.veri; basvuruCiz(); sonAlinma = o.zaman; $('basvuru-durum').textContent = neZaman(o.zaman) + ' alındı'; }
  } catch {}
})();
setInterval(() => { if (document.visibilityState === 'visible') basvuruYukle(true); }, 300000);

/* ============================ SON DEĞİŞİKLİKLER ============================ */
async function degisiklikYukle() {
  const g = $('commit-govde');
  try {
    const r = await fetch('https://api.github.com/repos/' + REPO + '/commits?per_page=8');
    const j = await r.json();
    if (!Array.isArray(j)) { g.innerHTML = '<tr><td colspan="2">' + (r.status === 403 || r.status === 429 ? 'GitHub istek sınırı doldu — bir saat içinde kendiliğinden düzelir.' : 'Şu an alınamadı.') + '</td></tr>'; return; }
    g.innerHTML = j.map((c) => {
      const t = new Date(c.commit.author.date).toLocaleString('tr-BE', { dateStyle: 'short', timeStyle: 'short' });
      const mesaj = kacir(c.commit.message.split('\n')[0]);
      return '<tr><td style="white-space:nowrap">' + t + '</td><td>' + mesaj + '</td></tr>';
    }).join('');
  } catch (e) { g.innerHTML = '<tr><td colspan="2">Şu an alınamadı.</td></tr>'; }
}

/* ============================ YÜKLE / YENİLE ============================ */
function hepsiniYukle() { durumYukle(); trafikYukle(seciliGun()); basvuruYukle(); degisiklikYukle(); }
$('yenile').addEventListener('click', hepsiniYukle);
hepsiniYukle();
/* «Son görüldü» damgası: sekme gizlenince/kapanınca yazılır; sonra gelenler bir sonraki açılışta «Yeni» olur. */
addEventListener('pagehide', sonGorulduKaydet);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sonGorulduKaydet(); });
    
