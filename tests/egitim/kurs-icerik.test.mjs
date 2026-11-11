/**
 * Dilim 4 / P5 + P6: Kur'an kursu sayfaları (egitim.ulucamii.be/<dil>/kurs/…) ve sesli dersler (/e/, /e/<kod>/) — derlenmiş çıktı ve kaynak taraması.
 * Dilim 4 geçişinden beri (11 Kasım 2026) asıl adres egitim'dedir: aynı içerik kaynağı, dizine açık, kanonik kendi adresi + hreflang, üst/alt bilgiden bağlı, site haritasında.
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

test('Kurs sayfaları: beş dilde beş sayfa, dizine açık, kanonik kendi adresi, hreflang beş dil + x-default', { skip: atla }, () => {
  for (const y of kursYollari) {
    const html = oku(dist(`${y}index.html`));
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/, `${y}: dizine açık`);
    const kan = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(kan.length, 1, `${y}: tek kanonik`);
    assert.equal(kan[0], `https://egitim.ulucamii.be/${y}`, `${y}: kanonik egitim`);
    assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, 6, `${y}: hreflang beş dil + x-default`);
    assert.match(html, /property="og:url"/, `${y}: og:url`);
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

test('Geçiş: robots.txt kurs ve /e/ yasağını kaldırdı (veli/hoca yasak kalır); üst/alt bilgi kurs ve veliye bağlanır; site haritasında kurs ve /e/ var, veli/hoca yok', () => {
  const r = oku('egitim/public/robots.txt');
  assert.doesNotMatch(r, /Disallow: \/\*\/kurs\/|Disallow: \/e\//);
  assert.doesNotMatch(r, /Disallow: \/hoca\/|Disallow: \/\*\/veli\//); // G-12: veli/hoca noindex başlığıyla (firebase.json) dizinden çıkar, robots.txt ile değil
  for (const f of ['egitim/src/components/UstBilgi.astro', 'egitim/src/components/AltBilgi.astro']) {
    assert.match(oku(f), /\/kurs\//, `${f}: kurs bağlantısı`);
    assert.match(oku(f), /\/veli\//, `${f}: veli bağlantısı`);
  }
  if (derlendi) {
    const harita = readdirSync('egitim/dist').filter((f) => /^sitemap-\d+\.xml$/.test(f)).map((s) => oku(dist(s))).join('\n');
    for (const y of kursYollari) assert.ok(harita.includes(`<loc>https://egitim.ulucamii.be/${y}</loc>`), `haritada yok: ${y}`);
    for (const y of eYollari.filter((x) => x !== 'e/test/')) assert.ok(harita.includes(`<loc>https://egitim.ulucamii.be/${y}</loc>`), `haritada yok: ${y}`);
    assert.equal(harita.includes('/e/test/'), false, 'test kodu haritada olmamalı');
    assert.equal(/\/veli\/|\/hoca\//.test(harita), false, 'veli/hoca haritada olmamalı');
  }
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
