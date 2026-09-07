/**
 * Site sağlık denetimi — dist/ üzerinde çalışır, ağ gerektirmez.
 *
 * Her turda aynı ölçümü yapabilmek için yazıldı (25 Ağustos 2026 denetim döngüsü).
 * Kontroller:
 *   1. Sayfa envanteri: her dilde aynı sayfalar üretilmiş mi
 *   2. Baş etiketleri: title, canonical, hreflang, html lang, h1
 *   3. Dil sızıntısı: bir dilin sayfasında başka dilin sabit metni
 *   4. Bağlantılar: site içi kırık bağlantı
 *   5. Erişilebilirlik: alt eksikliği, boş bağlantı, tekrarlı id
 *
 * Kullanım: node scripts/site-denetim.mjs [--ayrinti]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const KOK = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const AYRINTI = process.argv.includes('--ayrinti');

if (!existsSync(KOK)) {
  console.error('dist/ yok — önce `npm run build`');
  process.exit(2);
}

/* ---------------------------------------------------------------- sayfa envanteri */
const sayfalar = [];
(function tara(dizin) {
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) { tara(tam); continue; }
    if (ad.endsWith('.html')) sayfalar.push(tam);
  }
})(KOK);

const yol = (dosya) => '/' + relative(KOK, dosya).split(sep).join('/').replace(/index\.html$/, '');
/** Site sayfasi olmayanlar: panel (noindex, kendi iskeleti), gomulu kayit uygulamasi ve
    arama motoru dogrulama dosyasi. Bunlarda canonical/h1/hreflang beklenmez. */
const uygulamaSayfasi = (u) => u.startsWith('/admin') || u.startsWith('/kayit') || /^\/google[0-9a-f]+\.html$/.test(u);
const dilBul = (u) => (['tr', 'fr', 'en'].includes(u.split('/')[1]) ? u.split('/')[1] : null);

const bulgular = [];
const ekle = (onem, konu, ayrinti) => bulgular.push({ onem, konu, ayrinti });

/* ---------------------------------------------------------------- sayfa denetimi */
const idHavuzu = new Map();
const icBaglantilar = new Map();
const mevcutYollar = new Set(sayfalar.map(yol));

/* Bir dilin sayfasında görünmemesi gereken, diğer dile özgü sabit ifadeler.
   ARAYÜZ sızıntısı her zaman hatadır (menü, skip-link, düğme etiketi).
   İÇERİK sızıntısı ise duyuru/etkinlik arşivinin bilinçli davranışıdır: arşiv yalnız
   TR+FR yayımlanır, İngilizce sayfa Fransızca metni gösterir (lib/icerik.ts → icerikDili).
   O sayfalarda ziyaretçiye bunu söyleyen bir not bulunur; not varsa bulgu sayılmaz,
   YOKSA sayılır — açıklamasız yabancı metin ziyaretçiyi şaşırtır. */
const SIZINTI_ARAYUZ = {
  en: [/\bAller au contenu\b/, /\bAccueil\b/, /\bNos services\b/, /\bFaire un don\b/, /İçeriğe atla/],
  fr: [/Skip to content/, /İçeriğe atla/, /\bOur services\b/, /\bDonate\b/],
  tr: [/Skip to content/, /Aller au contenu/],
};
/* Not: "Mosquée" tek başına ölçüt olamaz — derneğin yasal adı ("Association Diyanet
   Mosquée Ulu Camii de Marche en Famenne ASBL") ve banka hesap adı ("Communauté Turque
   de la Mosquée") her dilde Fransızca kalmak zorundadır. Bunun yerine yalnız Fransızca
   CÜMLE kalıpları aranır; çevrilmemiş bir arşiv metni bunlardan birini mutlaka içerir. */
const SIZINTI_ICERIK = {
  en: [/\bl’occasion\b/, /\bnotre page Facebook\b/, /\bnous remercions\b/i, /\ba rendu visite\b/, /\bs’est déroulé/],
  fr: [], tr: [],
};
const CEVIRI_NOTU = /An English version is not available/;

for (const dosya of sayfalar) {
  const u = yol(dosya);
  const html = readFileSync(dosya, 'utf8');
  const dil = dilBul(u);

  const al = (re) => (html.match(re) || [])[1];
  const title = al(/<title>([\s\S]*?)<\/title>/);
  const canonical = al(/<link rel="canonical" href="([^"]+)"/);
  const htmlLang = al(/<html lang="([^"]+)"/);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/g) || []).length;

  // noindex sayfalar (kök dil yönlendirmesi, eski adres yönlendirmeleri) arama motoruna
  // girmez; canonical/h1/hreflang beklentisi onlar için anlamsızdır.
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  const siteSayfasi = !uygulamaSayfasi(u) && !noindex;
  if (siteSayfasi) {
    if (!title) ekle('yuksek', 'title yok', u);
    if (!canonical) ekle('orta', 'canonical yok', u);
    if (!htmlLang) ekle('yuksek', 'html lang yok', u);
    if (h1 === 0) ekle('orta', 'h1 yok', u);
    if (h1 > 1) ekle('dusuk', `${h1} adet h1`, u);
  }

  // hreflang üçlüsü
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => m[1]);
  if (siteSayfasi && dil && !['tr', 'fr-BE', 'en'].every((k) => hreflangs.includes(k))) {
    ekle('orta', 'hreflang üçlüsü eksik', `${u} → ${hreflangs.join(', ') || 'yok'}`);
  }

  // gövdeden metin çıkar (script/style hariç) ve dil sızıntısı ara
  const govdeHam = html.replace(/<script[\s\S]*?<\/script>/g, ' ');
  const govde = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  if (dil && SIZINTI_ARAYUZ[dil]) {
    for (const kalip of SIZINTI_ARAYUZ[dil]) {
      const m = govde.match(kalip);
      if (m) ekle('yuksek', `${dil} sayfasında yabancı ARAYÜZ metni`, `${u} → "${m[0]}"`);
    }
  }
  if (dil && SIZINTI_ICERIK[dil] && !CEVIRI_NOTU.test(govde)) {
    for (const kalip of SIZINTI_ICERIK[dil]) {
      const m = govde.match(kalip);
      if (m) ekle('orta', `${dil} sayfasında açıklamasız yabancı içerik`, `${u} → "${m[0]}"`);
    }
  }

  // Görsellerde alt. alt="" + aria-hidden, dekoratif görsel için DOĞRU kullanımdır
  // (ekran okuyucu atlar); yalnız öznitelik hiç yoksa bulgu sayılır.
  for (const m of html.matchAll(/<img\b([^>]*?)\/?>/g)) {
    if (!/(^|\s)alt(\s|=|$)/.test(m[1])) ekle('orta', 'img alt özniteliği yok', `${u} → ${m[0].slice(0, 70)}`);
  }

  // tekrarlı id
  // <script> icindeki sablon dizeleri gercek DOM id'si degildir (panelde innerHTML ile
  // yeniden yazilan bloklar); yalniz govdedeki id'ler sayilir.
  const idler = [...govdeHam.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const tekrar = idler.filter((x, i) => idler.indexOf(x) !== i);
  if (tekrar.length) ekle('orta', 'tekrarlı id', `${u} → ${[...new Set(tekrar)].join(', ')}`);

  // site içi bağlantılar
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    let hedef = m[1];
    if (/\.(css|js|svg|png|jpe?g|webp|ico|xml|txt|pdf|woff2?|ttf|json|gz|wasm)$/i.test(hedef)) continue;
    if (!hedef.endsWith('/')) hedef += '/';
    if (!icBaglantilar.has(hedef)) icBaglantilar.set(hedef, new Set());
    icBaglantilar.get(hedef).add(u);
  }
  idHavuzu.set(u, idler);
}

/* ---------------------------------------------------------------- kırık bağlantı */
for (const [hedef, kaynaklar] of icBaglantilar) {
  const varMi = mevcutYollar.has(hedef)
    || existsSync(join(KOK, hedef.replace(/^\//, '').split('/').join(sep), 'index.html'))
    || existsSync(join(KOK, hedef.replace(/^\//, '').split('/').join(sep)));
  if (!varMi) ekle('yuksek', 'kırık site içi bağlantı', `${hedef} ← ${[...kaynaklar].slice(0, 3).join(', ')}`);
}

/* ---------------------------------------------------------------- dil paritesi */
const dilSayfalari = { tr: new Set(), fr: new Set(), en: new Set() };
for (const u of mevcutYollar) {
  const d = dilBul(u);
  if (d) dilSayfalari[d].add(u.split('/').slice(2).join('/'));
}
// Yollar dile gore cevrildigi icin (duyurular/ -> annonces/ -> announcements/) slug
// karsilastirilamaz; sayfa SAYISI karsilastirilir.
for (const d of ['fr', 'en']) {
  const fark = dilSayfalari.tr.size - dilSayfalari[d].size;
  if (fark > 0) ekle('orta', `${d} dilinde ${fark} sayfa eksik`, `tr=${dilSayfalari.tr.size} ${d}=${dilSayfalari[d].size}`);
  else if (fark < 0) ekle('dusuk', `${d} dilinde ${-fark} fazla sayfa`, `tr=${dilSayfalari.tr.size} ${d}=${dilSayfalari[d].size}`);
}

/* ---------------------------------------------------------------- namaz vakitleri */
{
  const p = new URL('../src/data/namaz-vakitleri.json', import.meta.url);
  if (existsSync(p)) {
    const v = JSON.parse(readFileSync(p, 'utf8'));
    v.kaynakTuru === 'diyanet'
      ? null
      : ekle('kritik', 'namaz vakti kaynağı Diyanet değil', String(v.kaynakTuru));
    const gunler = v.gunler || v.vakitler || [];
    const bugun = new Date().toISOString().slice(0, 10);
    const ileri = gunler.filter((g) => (g.tarih || g.MiladiTarihUzun || '') >= bugun).length;
    if (ileri < 7) ekle('yuksek', 'namaz vakti penceresi daralıyor', `${ileri} gün kaldı`);
    else if (ileri < 14) ekle('orta', 'namaz vakti penceresi', `${ileri} gün kaldı`);
  }
}


/* ---------------------------------------------------------------- ders materyalleri verisi */
/* src/data/ders-materyalleri.json betik ciktisidir (kurs projesi site-materyal-yayinla.py). Elle bozulmus
   bir kayit (eksik url, yanlis etiket, cift tarih) sayfada kirik indirme dugmesi olur — burada yakalanir.
   (6 Eylul 2026, ders materyalleri bolumu.) */
{
  const p = new URL('../src/data/ders-materyalleri.json', import.meta.url);
  if (existsSync(p)) {
    const v = JSON.parse(readFileSync(p, 'utf8'));
    const gunler = Array.isArray(v.gunler) ? v.gunler : [];
    const tarihler = new Set();
    const dosyaKontrol = (g, d, ad) => {
      if (!d) return;
      const beklenen = `https://github.com/${v.depo}/releases/download/${g.etiket}/${d.dosya}`;
      if (!d.dosya || !/^[A-Za-z0-9._-]+$/.test(d.dosya)) ekle('yuksek', 'ders materyali dosya adı ASCII değil', `${g.tarih} ${ad}: ${d.dosya}`);
      if (d.url !== beklenen) ekle('yuksek', 'ders materyali url etiketle uyuşmuyor', `${g.tarih} ${ad}: ${d.url}`);
      if (!(d.boyut > 0)) ekle('orta', 'ders materyali boyutu yok', `${g.tarih} ${ad}`);
    };
    for (const g of gunler) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(g.tarih || '')) ekle('yuksek', 'ders materyali tarihi bozuk', String(g.tarih));
      if (tarihler.has(g.tarih)) ekle('yuksek', 'ders materyali günü iki kez', g.tarih);
      tarihler.add(g.tarih);
      if (g.etiket !== `ders-${g.tarih}`) ekle('yuksek', 'ders materyali etiketi tarihle uyuşmuyor', `${g.tarih}: ${g.etiket}`);
      dosyaKontrol(g, g.plan, 'plan');
      const nolar = new Set();
      for (const s of g.sunumlar || []) {
        if (nolar.has(s.no)) ekle('orta', 'aynı ders numarası iki sunumda', `${g.tarih} ${s.no}`);
        nolar.add(s.no);
        if (!s.konuFr || !s.baslik?.fr) ekle('dusuk', 'sunumun Fransızca başlığı/konusu boş', `${g.tarih} sunum ${s.no}`);
        dosyaKontrol(g, s, `sunum ${s.no}`);
        dosyaKontrol(g, s.pdf, `sunum ${s.no} pdf`);
      }
      for (const e of g.ekler || []) dosyaKontrol(g, e, `ek ${e.dosya}`);
      if (!g.plan && !(g.sunumlar || []).length) ekle('orta', 'ders materyali günü boş', g.tarih);
    }
  }
}

/* ---------------------------------------------------------------- iletisim tutarliligi */
/* Sayfalarda gecen her telefon ve e-posta, icerik ayarlarinda (site.yaml) TANIMLI olmali.
   Elle yazilmis/eskimis bir numara ya da adres boylece yakalanir; disaridaki kurumlarin
   (baskonsolosluk, belediye, Diyanet Belcika) bilgileri de ayarlarda durdugu icin dogal
   olarak beyaz listede olur. Altyapi hesabi ise sitede hic gorunmemeli.
   (25 Agustos 2026 denetim turu 4.) */
{
  const ayarYolu = new URL('../src/content/ayarlar/site.yaml', import.meta.url);
  const ayarMetni = existsSync(ayarYolu) ? readFileSync(ayarYolu, 'utf8') : '';
  const normTel = (t) => '+' + String(t).replace(/\D/g, '');
  const tanimliTel = new Set((ayarMetni.match(/\+\d[\d\s.() -]{7,}/g) || []).map(normTel));
  /* Ayarlarda olmayan ama bir duyuruda MESRU olarak gecen dis kurum numaralari (duyurunun konusu
     olan kurumun kendi irtibati). Eklerken yanina kurumu ve duyuruyu yaz; bizim numaralarimiz
     buraya degil site.yaml'a girer. */
  const disKurumTel = new Set([
    '+32498399502', // Imam-i Azam Egitim Merkezi (BDV) — 2026 hafta sonu yatili Kur'an kursu duyurusu
    '+3225061173',  // T.C. Bruksel Buyukelciligi Sosyal Isler Musavirligi — UIP sayfasi (Musavirlik yazisi 27.02.2024)
    '+3524432810',  // T.C. Luksemburg Buyukelciligi santral — e-Devlet sifresi icin randevusuz basvuru (Konsolosluk sayfasi).
                    // Dogrulandi 7 Eyl 2026: luksemburg-be.mfa.gov.tr/Mission/Contact
  ]);
  /* Dis kurumlarin sitede gosterilen kendi e-postalari (bizim adreslerimiz site.yaml'da). */
  const disKurumEposta = new Set([
    'info@diyanet.be',              // Belcika Diyanet Vakfi
  ]);
  const tanimliEposta = new Set((ayarMetni.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []));
  // Altyapi hesabi: GitHub/Drive/Firebase sahipligi icin; sitede GOSTERILMEZ (22 Agu 2026 kurali).
  const YASAK_EPOSTA = ['ulucamii2026@gmail.com'];

  const telKalip = /\+\d[\d\s.() -]{7,}\d/g;
  const epostaKalip = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const telSayim = new Map(), epostaSayim = new Map();
  for (const dosya of sayfalar) {
    const u = yol(dosya);
    const duz = readFileSync(dosya, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    for (const t of duz.match(telKalip) || []) {
      const n = normTel(t);
      if (n.length < 10) continue;                 // yil araligi vb. degil, gercek numara
      if (!telSayim.has(n)) telSayim.set(n, new Set());
      telSayim.get(n).add(u);
    }
    for (const e of duz.match(epostaKalip) || []) {
      if (!epostaSayim.has(e)) epostaSayim.set(e, new Set());
      epostaSayim.get(e).add(u);
    }
  }
  if (!tanimliTel.size) ekle('orta', 'iletisim denetimi calismadi', 'site.yaml okunamadi');
  for (const [tel, yerler] of telSayim) {
    if (!tanimliTel.has(tel) && !disKurumTel.has(tel)) ekle('yuksek', 'ayarlarda tanimli olmayan telefon', `${tel} → ${[...yerler].slice(0, 3).join(', ')}`);
  }
  for (const [eposta, yerler] of epostaSayim) {
    if (YASAK_EPOSTA.includes(eposta)) ekle('yuksek', 'altyapi e-postasi sitede gorunuyor', `${eposta} → ${[...yerler].slice(0, 3).join(', ')}`);
    else if (!tanimliEposta.has(eposta) && !disKurumEposta.has(eposta)) ekle('orta', 'ayarlarda tanimli olmayan e-posta', `${eposta} → ${[...yerler].slice(0, 2).join(', ')}`);
  }
}

/* ---------------------------------------------------------------- SEO ve paylasim */
{
  for (const dosya of sayfalar) {
    const u = yol(dosya);
    if (uygulamaSayfasi(u)) continue;
    const html = readFileSync(dosya, 'utf8');
    if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
    if (!/<meta name="description" content="[^"]{20,}"/.test(html)) ekle('orta', 'meta description eksik/kisa', u);
    if (!/<meta property="og:title"/.test(html)) ekle('dusuk', 'og:title yok', u);
    if (!/<meta property="og:image"/.test(html)) ekle('dusuk', 'og:image yok', u);
  }
  for (const ad of ['robots.txt', 'sitemap-index.xml', '404.html']) {
    existsSync(join(KOK, ad)) ? null : ekle('yuksek', 'dosya uretilmemis', ad);
  }
}

/* ---------------------------------------------------------------- erisilebilirlik */
{
  for (const dosya of sayfalar) {
    const u = yol(dosya);
    const html = readFileSync(dosya, 'utf8');
    const govde = html.replace(/<script[\s\S]*?<\/script>/g, ' ');
    // Baslik sirasi atlanmamali (h1 -> h3 gibi)
    const basliklar = [...govde.matchAll(/<h([1-6])/g)].map((m) => Number(m[1]));
    for (let i = 1; i < basliklar.length; i++) {
      if (basliklar[i] - basliklar[i - 1] > 1) {
        ekle('dusuk', 'baslik seviyesi atlaniyor', `${u} → h${basliklar[i - 1]} sonrasi h${basliklar[i]}`);
        break;
      }
    }
    // Erisilebilir adi olmayan dugme
    for (const m of govde.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)) {
      const oz = m[1], ic = m[2].replace(/<[^>]+>/g, '').trim();
      if (!ic && !/aria-label=/.test(oz) && !/aria-labelledby=/.test(oz)) {
        ekle('orta', 'erisilebilir adi olmayan dugme', `${u} → ${m[0].slice(0, 60)}`);
      }
    }
  }
}

/* ---------------------------------------------------------------- sayfa agirligi */
{
  // Olcut ham dosya boyutu degil, ziyaretcinin gercekten indirdigi GZIP boyutudur:
  // GitHub Pages her HTML'i sikistirarak sunar, veri yogun tablolar ~%80 kuculur
  // (yillik plan 495 KB ham → 95 KB gzip). Esik 120 KB gzip.
  const agir = sayfalar
    .map((d) => {
      const ham = statSync(d).size;
      const gz = gzipSync(readFileSync(d), { level: 6 }).length;
      return { u: yol(d), kb: Math.round(ham / 1024), gz: Math.round(gz / 1024) };
    })
    .filter((x) => x.gz > 120)
    .sort((a, b) => b.gz - a.gz);
  for (const x of agir.slice(0, 5))
    ekle('dusuk', 'agir HTML sayfasi', `${x.u} → ${x.gz} KB gzip (${x.kb} KB ham)`);
}

/* ---------------------------------------------------------------- rapor */
const sira = { kritik: 0, yuksek: 1, orta: 2, dusuk: 3 };
bulgular.sort((a, b) => sira[a.onem] - sira[b.onem]);
const sayim = bulgular.reduce((o, b) => ({ ...o, [b.onem]: (o[b.onem] || 0) + 1 }), {});

console.log(`\nSite denetimi — ${sayfalar.length} sayfa, ${icBaglantilar.size} farkli site ici baglanti\n`);
if (!bulgular.length) console.log('  Bulgu yok.\n');
else {
  const gruplu = new Map();
  for (const b of bulgular) {
    const k = `${b.onem}|${b.konu}`;
    if (!gruplu.has(k)) gruplu.set(k, []);
    gruplu.get(k).push(b.ayrinti);
  }
  for (const [k, liste] of gruplu) {
    const [onem, konu] = k.split('|');
    console.log(`  [${onem}] ${konu} — ${liste.length} yer`);
    const gosterilecek = AYRINTI ? liste : liste.slice(0, 3);
    for (const a of gosterilecek) console.log(`        ${a}`);
    if (!AYRINTI && liste.length > 3) console.log(`        … ${liste.length - 3} tane daha (--ayrinti)`);
  }
  console.log('');
}
console.log(`  ozet: ${Object.entries(sayim).map(([k, v]) => `${k}=${v}`).join(' ') || 'temiz'}\n`);
process.exit(sayim.kritik ? 1 : 0);
