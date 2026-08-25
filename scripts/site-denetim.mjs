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
    if (!tanimliTel.has(tel)) ekle('yuksek', 'ayarlarda tanimli olmayan telefon', `${tel} → ${[...yerler].slice(0, 3).join(', ')}`);
  }
  for (const [eposta, yerler] of epostaSayim) {
    if (YASAK_EPOSTA.includes(eposta)) ekle('yuksek', 'altyapi e-postasi sitede gorunuyor', `${eposta} → ${[...yerler].slice(0, 3).join(', ')}`);
    else if (!tanimliEposta.has(eposta)) ekle('orta', 'ayarlarda tanimli olmayan e-posta', `${eposta} → ${[...yerler].slice(0, 2).join(', ')}`);
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
  const agir = sayfalar
    .map((d) => ({ u: yol(d), kb: Math.round(statSync(d).size / 1024) }))
    .filter((x) => x.kb > 250)
    .sort((a, b) => b.kb - a.kb);
  for (const x of agir.slice(0, 5)) ekle('dusuk', 'agir HTML sayfasi', `${x.u} → ${x.kb} KB`);
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
