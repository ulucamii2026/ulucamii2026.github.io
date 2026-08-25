/**
 * Kayit formu regresyon testleri (25 Agustos 2026).
 *
 * 1) T.C. kimlik kontrol hanesi: JS'in negatif sayilarda isaret koruyan % operatoru
 *    yuzunden gecerli kimlikler reddediliyordu (app.js kimlikDurumu).
 * 2) Dil baglantilari: /kayit gomulu uygulamasi dilini localStorage'da tutar.
 *    Parametresiz gidilirse eski tercih (cogu kez fr) galip gelir; bu yuzden dil
 *    degistirici ve site ici baglantilar HER dil icin acik ?lang= vermelidir.
 *    Bu test dist/ varsa uretilen HTML uzerinden dogrular.
 *
 * Calistirma: node scripts/kayit-dil-kimlik-test.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

let hata = 0;
const ok = (ad) => console.log(`  ok   ${ad}`);
const yanlis = (ad, ayrinti) => { hata++; console.log(`  HATA ${ad}\n       ${ayrinti}`); };

/* ---- 1. Kimlik kontrol hanesi ---- */
console.log('\nT.C. kimlik numarasi dogrulamasi');

const appJs = readFileSync(new URL('../public/kayit/assets/app.js', import.meta.url), 'utf8');
const govde = appJs.match(/function kimlikDurumu\(ham\)\s*\{[\s\S]*?\n {2}\}/);
if (!govde) {
  yanlis('kimlikDurumu bulundu', 'app.js icinde fonksiyon esleSmedi');
} else {
  const kimlikDurumu = new Function(`${govde[0]}; return kimlikDurumu;`)();

  // Gecerli bir T.C. kimlik numarasi uret (kural: h10 ve h11 kontrol haneleri).
  const uret = (tohum) => {
    const d = [1 + (tohum % 9)];
    let x = tohum;
    for (let j = 0; j < 8; j++) { x = (x * 1103515245 + 12345) & 0x7fffffff; d.push(x % 10); }
    const tek = d[0] + d[2] + d[4] + d[6] + d[8];
    const cift = d[1] + d[3] + d[5] + d[7];
    d.push((((tek * 7) - cift) % 10 + 10) % 10);
    d.push(d.slice(0, 10).reduce((a, b) => a + b, 0) % 10);
    return d.join('');
  };

  let reddedilen = 0;
  const ornek = [];
  for (let i = 0; i < 200000; i++) {
    const no = uret(i);
    if (kimlikDurumu(no) === 'hatali') { reddedilen++; if (ornek.length < 3) ornek.push(no); }
  }
  reddedilen === 0
    ? ok('200.000 gecerli kimlik kabul ediliyor')
    : yanlis('gecerli kimlikler reddedildi', `${reddedilen} adet, orn. ${ornek.join(', ')}`);

  // Negatif (tek*7 - cift) ureten gercek ornekler — duzeltmeden once reddediliyordu.
  for (const no of ['19090909018', '17192609072', '39090903014']) {
    kimlikDurumu(no) !== 'hatali'
      ? ok(`negatif modulo ornegi kabul: ${no}`)
      : yanlis(`negatif modulo ornegi reddedildi: ${no}`, 'floor-modulo duzeltmesi kaybolmus olabilir');
  }

  // Yazim hatasi hala yakalanmali: son haneyi bozunca 'hatali' donmeli.
  const bozuk = (() => { const n = uret(7).split(''); n[10] = String((Number(n[10]) + 5) % 10); return n.join(''); })();
  kimlikDurumu(bozuk) === 'hatali'
    ? ok('bozuk kontrol hanesi yakalaniyor')
    : yanlis('bozuk kimlik kabul edildi', bozuk);

  // Belcika rijksregister numarasi taninmaya devam etmeli.
  kimlikDurumu('85073003328') === 'belcika'
    ? ok('Belcika rijksregister numarasi taniniyor')
    : yanlis('Belcika numarasi tanninmadi', '85073003328');
}

/* ---- 2. Dil butunlugu: tr / fr / en her katmanda eksiksiz ---- */
console.log('\nDil butunlugu (tr / fr / en)');

const DILLER = ['tr', 'fr', 'en'];
const varlik = (yol) => readFileSync(new URL(yol, import.meta.url), 'utf8');

// i18n.js sozlukleri — ayni anahtarlar, ayni sirada
{
  const s = varlik('../public/kayit/assets/i18n.js');
  const blok = (ad) => { const i = s.indexOf(`const ${ad} = {`); return s.slice(i, s.indexOf('\n  };', i)); };
  const anahtar = (b) => [...b.matchAll(/^ {4}([A-Za-z0-9_]+):/gm)].map((m) => m[1]);
  const t = anahtar(blok('tr'));
  for (const d of DILLER.slice(1)) {
    const k = anahtar(blok(d));
    const eksik = t.filter((x) => !k.includes(x));
    const fazla = k.filter((x) => !t.includes(x));
    eksik.length === 0 && fazla.length === 0
      ? ok(`i18n ${d}: ${k.length} anahtar, tr ile birebir`)
      : yanlis(`i18n ${d} sozlugu tutmuyor`, `eksik: ${eksik.join(', ') || '-'} | fazla: ${fazla.join(', ') || '-'}`);
  }
  /^ {2}app\.messages = \{ tr, fr, en \};/m.test(s)
    ? ok('app.messages uc dili de kaydediyor')
    : yanlis('app.messages eksik dil', 'tr, fr, en bekleniyordu');
}

// data.js — sozlesme, beyan ve sinif adlari
{
  const s = varlik('../public/kayit/assets/data.js');
  const app = {};
  new Function('window', `${s}`)({ KayitApp: app });
  for (const d of DILLER) {
    app.declaration?.[d] ? ok(`beyan metni: ${d}`) : yanlis('beyan metni eksik', d);
    const c = app.contract?.[d];
    if (!c) { yanlis('sozlesme eksik', d); continue; }
    const sayi = [c.student?.items?.length, c.guardian?.items?.length, c.classroom?.items?.length];
    sayi.join(',') === '9,11,14'
      ? ok(`sozlesme ${d}: 9 + 11 + 14 madde`)
      : yanlis(`sozlesme ${d} madde sayisi tutmuyor`, sayi.join(', '));
    c.title && c.closing ? ok(`sozlesme ${d}: baslik + kapanis`) : yanlis(`sozlesme ${d} eksik alan`, 'title/closing');
  }
  const sinif = [...(app.classLevels?.fondamental || []), ...(app.classLevels?.secondaire || [])];
  sinif.length === 16 ? ok('16 sinif seviyesi') : yanlis('sinif sayisi', String(sinif.length));
  const eksikDil = sinif.filter((x) => DILLER.some((d) => !x[d]));
  eksikDil.length === 0
    ? ok('her sinif seviyesi uc dilde')
    : yanlis('sinif adi eksik dil', JSON.stringify(eksikDil[0]));
}

// app.js — dil listesi ve yerel ayarlar
{
  const s = varlik('../public/kayit/assets/app.js');
  /const DILLER = \['tr', 'fr', 'en'\];/.test(s)
    ? ok('app.js dil listesi uc dil')
    : yanlis('app.js DILLER sabiti', 'tr, fr, en bekleniyordu');
  /en: 'en-GB'/.test(s)
    ? ok('app.js tarih bicimi en-GB tanimli')
    : yanlis('app.js YEREL esleme', 'en-GB eksik');
  !/app\.lang === 'fr' \? 'fr-BE' : 'tr-TR'/.test(s)
    ? ok('app.js ikili tarih dallanmasi kalmadi')
    : yanlis('app.js eski ikili tarih mantigi duruyor', 'YEREL esleme kullanilmali');
}

// pdf.js — resmi belge HER ZAMAN Turkce (25 Agustos 2026 karari)
{
  const s = varlik('../public/kayit/assets/pdf.js');
  /app\.lang = 'tr';/.test(s) && /finally \{\s*app\.lang = arayuzDili;/.test(s)
    ? ok('PDF uretimi dili Turkce\'ye sabitliyor ve geri koyuyor')
    : yanlis('PDF dil sabitlemesi yok', "createPdf icinde app.lang='tr' + finally geri alma bekleniyor");
  !/const fr = app\.lang === 'fr';/.test(s) && !/\bdl\('/.test(s)
    ? ok('pdf.js dil dallanmasi kalmadi')
    : yanlis('pdf.js hala dile gore dallaniyor', 'PDF tek dilli olmali');
  // Belgede Fransizca/Ingilizce sabit metin kalmamali
  const yabanci = ['FORMULAIRE', 'PIÈCE D’IDENTITÉ', 'Nom de l’élève', 'STUDENT REGISTRATION FORM', 'Mother’s surname']
    .filter((k) => s.includes(k));
  yabanci.length === 0
    ? ok('belgede yabanci dil metni kalmadi')
    : yanlis('PDF icinde yabanci dil metni', yabanci.join(', '));
}

/* ---- 3. Dil baglantilari (dist/ uzerinden) ---- */
console.log('\nKayit formu dil baglantilari');

const dist = new URL('../dist/', import.meta.url);
const kayitHtml = new URL('kayit/index.html', dist);
if (!existsSync(kayitHtml)) {
  console.log('  atla dist/ yok — once `npm run build`');
} else {
  const html = readFileSync(kayitHtml, 'utf8');

  // Dil degistirici: TR de acik parametre almali, yoksa localStorage'daki fr galip gelir.
  const trBag = html.match(/href="(\/kayit\/[^"]*)"[^>]*hreflang="tr"/);
  trBag && trBag[1].includes('lang=tr')
    ? ok('dil degistirici TR -> ?lang=tr')
    : yanlis('dil degistirici TR parametresiz', trBag ? trBag[1] : 'baglanti bulunamadi');

  for (const d of ['fr', 'en']) {
    const bag = html.match(new RegExp(`href="(/kayit/[^"]*)"[^>]*hreflang="${d}"`));
    bag && bag[1].includes(`lang=${d}`)
      ? ok(`dil degistirici ${d.toUpperCase()} -> ?lang=${d}`)
      : yanlis(`dil degistirici ${d.toUpperCase()} hatali`, bag ? bag[1] : 'baglanti bulunamadi');
  }

  // Kanonik adres parametresiz kalmali (SEO).
  /rel="canonical" href="[^"]*\/kayit\/"/.test(html)
    ? ok('kanonik adres parametresiz')
    : yanlis('kanonik adres degismis', 'hreflang/canonical ayrimi bozulmus olabilir');

  // Site ici baglantilar: TR sayfadan gidenler ?lang=tr tasimali.
  for (const [ad, yol] of [['ana sayfa bandi', 'tr/index.html'], ['kurs sayfasi', 'tr/kuran-kursu/index.html']]) {
    const dosya = new URL(yol, dist);
    if (!existsSync(dosya)) { console.log(`  atla ${ad} bulunamadi`); continue; }
    const icerik = readFileSync(dosya, 'utf8');
    const bag = icerik.match(/href="https:\/\/www\.ulucamii\.be\/kayit\/[^"]*"/);
    if (!bag) { console.log(`  atla ${ad} kayit baglantisi yok`); continue; }
    bag[0].includes('lang=tr')
      ? ok(`${ad} TR -> ?lang=tr`)
      : yanlis(`${ad} parametresiz`, bag[0]);
  }
}

console.log(hata === 0 ? '\nTum testler gecti.\n' : `\n${hata} test basarisiz.\n`);
process.exit(hata === 0 ? 0 : 1);
