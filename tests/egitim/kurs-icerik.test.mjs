/**
 * Dilim 4 / P5 + P6: Kur'an kursu sayfaları (egitim.ulucamii.be/<dil>/kurs/…) ve sesli dersler (/e/, /e/<kod>/) — derlenmiş çıktı ve kaynak taraması.
 * Sayfalar ulucamii.be'deki sayfaların ikinci yoludur: aynı içerik kaynağı, noindex, kanonik adres ulucamii.be, hiçbir yerden bağlı değil, robots.txt'te yasak.
 * Önce `npm run egitim:build` (derleme yoksa atlanır). Ağ kullanmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SAYFALAR = ['', 'mufredat/', 'yillik-plan/', 'materyaller/', 'gunluk/'];
const dist = (y) => `egitim/dist/${y}`;
const oku = (y) => readFileSync(y, 'utf8');
const derlendi = existsSync(dist('tr/kurs/index.html'));
const atla = !derlendi && 'önce npm run egitim:build';
const KODLAR = JSON.parse(oku('tests/fixtures/e-kodlari-basili.json')).kodlar;
const kursYollari = DILLER.flatMap((d) => SAYFALAR.map((s) => `${d}/kurs/${s}`));
const eYollari = ['e/', ...KODLAR.map((k) => `e/${k}/`)];

test('Kurs sayfaları: beş dilde beş sayfa, noindex, kanonik adres ulucamii.be, hreflang yok', { skip: atla }, () => {
  for (const y of kursYollari) {
    const html = oku(dist(`${y}index.html`));
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${y}: noindex`);
    const kan = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(kan.length, 1, `${y}: tek kanonik`);
    assert.match(kan[0], new RegExp(`^https://ulucamii\\.be/${y.slice(0, 2)}/[a-z-]+/$`), `${y}: kanonik ana sitede`);
    assert.equal(/rel="alternate" hreflang/.test(html), false, `${y}: hreflang yok`);
    assert.equal(/property="og:url"/.test(html), false, `${y}: og:url yok`);
  }
  // Çapalar (ders kitapları bağlantısı): tr #ders-kitaplari, diğer diller #manuels
  assert.match(oku(dist('tr/kurs/index.html')), /id="ders-kitaplari"/);
  for (const d of ['fr', 'en', 'nl', 'de']) assert.match(oku(dist(`${d}/kurs/index.html`)), /id="manuels"/, `${d}: #manuels`);
});

test('Kurs ve sesli ders sayfaları sıkı CSP’ye uyar: src’siz betik, <style>, style özniteliği, olay özniteliği, data: adresi yok', { skip: atla }, () => {
  for (const y of [...kursYollari, ...eYollari]) {
    const html = oku(dist(`${y}index.html`));
    assert.deepEqual(html.match(/<script(?![^>]*\ssrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>/g), null, `${y}: src'siz <script>`);
    assert.equal(/<style[\s>]/.test(html), false, `${y}: <style>`);
    assert.equal(/<[^>]+\sstyle=/.test(html), false, `${y}: style özniteliği`);
    assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(html), false, `${y}: olay özniteliği`);
    assert.equal(/\s(?:src|href)="data:/.test(html), false, `${y}: data: adresi`);
    assert.equal(/\s(src|href)="http:/.test(html), false, `${y}: şifresiz http`);
  }
  for (const f of readdirSync(dist('_astro')).filter((a) => /^(KursSayfasi|SesliDers|IcerikSayfasi).*\.css$/.test(a))) {
    assert.equal(/url\(\s*["']?data:/.test(oku(dist(`_astro/${f}`))), false, `${f}: CSS'te data: adresi`);
  }
});

test('Kök göreli her bağlantı ve kaynak egitim çıktısında bulunur (markdown bağlantıları ulucamii.be’ye çevrilmiş)', { skip: atla }, () => {
  const eksik = [];
  for (const y of [...kursYollari, ...eYollari]) {
    const html = oku(dist(`${y}index.html`));
    for (const m of html.matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
      if (m[1].startsWith('//')) continue;
      if (!existsSync(dist(m[1])) && !existsSync(dist(`${m[1]}/index.html`))) eksik.push(`${y} → ${m[1]}`);
    }
  }
  assert.deepEqual(eksik, []);
  // Ana sitede kalan sayfalara (gizlilik, veli portalı…) giden markdown bağlantıları mutlak ulucamii.be adresi olmuştur.
  assert.match(oku(dist('tr/kurs/index.html')), /href="https:\/\/ulucamii\.be\/tr\/gizlilik\/?"/);
});

test('İndirme bağlantıları ve sesler ulucamii.be’de kalır (kopyalanmadı): PDF, ders belgeleri, ses dosyaları mutlak adres', { skip: atla }, () => {
  const mufredat = oku(dist('tr/kurs/mufredat/index.html'));
  assert.match(mufredat, /href="https:\/\/ulucamii\.be\/belgeler\/kuran-kursu\/Ulu-Camii-Kuran-Kursu-Mufredat-2026-2027\.pdf"/);
  assert.match(mufredat, /href="https:\/\/ulucamii\.be\/belgeler\/kuran-kursu\/mufredat-2026-2027\.html"/);
  assert.equal(existsSync(dist('belgeler')), false, 'belgeler/ egitim çıktısına kopyalanmamalı');
  for (const d of ['sureler', 'ayet', 'dualar', 'elifba', 'hadisler']) assert.equal(existsSync(dist(`media/ses/${d}`)), false, `sesler egitim çıktısına kopyalanmamalı (Hosting ses taşımaz): ${d}`);
  const ders = oku(dist('fr/kurs/materyaller/index.html'));
  for (const m of ders.matchAll(/\shref="([^"]+\.(?:pdf|pptx|docx|xlsx))"/g)) assert.match(m[1], /^https:\/\//, `indirme adresi mutlak olmalı: ${m[1]}`);
});

test('Kurs sayfaları arasındaki bağlantılar egitim’in kendi adreslerine gider; taşınmayanlar ana siteye', { skip: atla }, () => {
  const kurs = oku(dist('fr/kurs/index.html'));
  for (const s of ['mufredat', 'yillik-plan', 'materyaller', 'gunluk']) assert.match(kurs, new RegExp(`href="/fr/kurs/${s}/"`), s);
  assert.match(kurs, /href="\/fr\/veli\/"/);
  assert.match(kurs, /href="https:\/\/ulucamii\.be\/fr\/[a-z-]+\/"/); // UİP, seviye testi…
});

test('Kişisel veri yok: günlük sayfası e-posta, öğrenci referansı ya da telefon içermez; din görevlisi numarası yalnız wa.me bağlantısında', { skip: atla }, () => {
  const imamNo = /32471794682/;
  for (const y of kursYollari) {
    const html = oku(dist(`${y}index.html`));
    assert.equal(/UC-\d{4}-\d{4}/.test(html), false, `${y}: öğrenci referansı`);
    const telefonlar = [...html.matchAll(/href="tel:([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(telefonlar.filter((t) => t !== '+32472985073'), [], `${y}: yalnız cami hattı tel: olabilir`);
    for (const m of html.matchAll(new RegExp(`.{0,40}${imamNo.source}.{0,20}`, 'g'))) assert.match(m[0], /wa\.me\/32471794682/, `${y}: din görevlisi numarası yalnız wa.me bağlantısında`);
    assert.equal(/0471[\s.]?79[\s.]?46[\s.]?82|\+32[\s.]?471[\s.]?79/.test(html), false, `${y}: din görevlisi numarası metin olarak`);
  }
  const gunluk = oku(dist('tr/kurs/gunluk/index.html')).replace(/<script[\s\S]*?<\/script>/g, '');
  const postalar = [...gunluk.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((m) => m[0]).filter((e) => e !== 'info@ulucamii.be');
  assert.deepEqual(postalar, [], 'günlükte kişisel e-posta adresi');
});

test('Hiçbir yerden bağlanmaz: robots.txt yasaklar, üst/alt bilgi anmaz, site haritasında yok', () => {
  const r = oku('egitim/public/robots.txt');
  assert.match(r, /^Disallow: \/\*\/kurs\/$/m);
  assert.match(r, /^Disallow: \/e\/$/m);
  for (const f of ['egitim/src/components/UstBilgi.astro', 'egitim/src/components/AltBilgi.astro']) assert.doesNotMatch(oku(f), /\/kurs\/|\/e\//, `${f} henüz kurs/e sayfalarına bağlanmamalı`);
  if (derlendi) for (const s of readdirSync('egitim/dist').filter((f) => /^sitemap-\d+\.xml$/.test(f))) assert.doesNotMatch(oku(dist(s)), /\/kurs\/|\/e\//, 'site haritasında kurs/e yok');
});

test('Kaynak: kurs sayfaları ana sitenin içerik ve veri dosyalarını kullanır (kopya yok)', () => {
  assert.equal(existsSync('egitim/src/content'), false, 'içerik kopyalanmamalı');
  assert.equal(readdirSync('egitim/src').includes('data'), false, 'veri kopyalanmamalı');
  const ayar = oku('egitim/src/content.config.ts');
  for (const k of ['sayfalar', 'ayarlar', 'materyaller']) assert.match(ayar, new RegExp(`\\.\\./src/content/${k}`));
  assert.match(oku('src/content.config.ts'), /from '\.\/lib\/icerik-semalari\.ts'/);
  for (const f of ['Mufredat', 'YillikPlan', 'DersMateryalleri', 'KursGunlugu']) {
    const s = oku(`egitim/src/sayfalar/${f}.astro`);
    assert.match(s, /@ortak\/data\//, `${f}: veri ana siteden`);
    assert.equal(/\sstyle=\{?["`]/.test(s.replace(/<style[\s\S]*?<\/style>/g, '')), false, `${f}: satır içi stil`);
  }
});
