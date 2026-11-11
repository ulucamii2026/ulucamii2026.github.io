/**
 * Dilim 4 / P6: sesli ders sayfaları egitim.ulucamii.be/e/<kod>/ — basılı Fransızca ders kitabındaki 74 kare kodun HEPSİ. Kodlar kâğıtta basılıdır ve
 * ulucamii.be/e/<kod>/ adresine gider (orada olduğu gibi kalır); egitim'deki sayfalar ikinci yoldur (noindex, kanonik ulucamii.be). Liste dondurulmuştur:
 * tests/fixtures/e-kodlari-basili.json. Önce `npm run egitim:build` (derleme yoksa derleme sınamaları atlanır). Ağ kullanmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const oku = (y) => readFileSync(y, 'utf8');
const dist = (y) => `egitim/dist/${y}`;
const KODLAR = JSON.parse(oku('tests/fixtures/e-kodlari-basili.json')).kodlar;
const atla = !existsSync(dist('e/fatiha/index.html')) && 'önce npm run egitim:build';

test('Dondurulmuş liste: 74 kod, hepsi hâlâ ses verisinde (basılı bir kod hiçbir zaman silinemez)', () => {
  assert.equal(KODLAR.length, 74);
  assert.equal(new Set(KODLAR).size, 74);
  const veri = Object.keys(JSON.parse(oku('src/data/ecouter.json')).kodlar);
  for (const k of KODLAR) assert.ok(veri.includes(k), `basılı kod veriden silinmiş: ${k}`);
  assert.ok(KODLAR.includes('test') && KODLAR.includes('fatiha') && KODLAR.includes('alphabet'));
});

test('74 basılı kodun hepsi egitim’de var (noindex, kanonik ulucamii.be/e/<kod>/); dizin sayfası da', { skip: atla }, () => {
  for (const k of KODLAR) {
    const html = oku(dist(`e/${k}/index.html`));
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${k}: noindex`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://ulucamii\\.be/e/${k}/"`), `${k}: kanonik`);
    assert.equal(/rel="alternate" hreflang/.test(html), false, `${k}: hreflang yok`);
  }
  const dizin = oku(dist('e/index.html'));
  assert.match(dizin, /<link rel="canonical" href="https:\/\/ulucamii\.be\/e\/"/);
  for (const k of KODLAR.filter((x) => x !== 'test')) assert.match(dizin, new RegExp(`href="/e/${k}/"`), `dizinde ${k}`);
});

test('test kodu seviye testine (ulucamii.be) yönlendirir: meta yenileme ve düğme mutlak adres', { skip: atla }, () => {
  const html = oku(dist('e/test/index.html'));
  assert.match(html, /<meta http-equiv="refresh" content="0;url=https:\/\/ulucamii\.be\/fr\/test-de-niveau\/"/);
  assert.match(html, /href="https:\/\/ulucamii\.be\/fr\/test-de-niveau\/"/);
});

test('Sesler ulucamii.be’den: çalar kökeni ve betiksiz yedek bağlantılar mutlak; Diyanet kaydı yolu aynen', { skip: atla }, () => {
  const fatiha = oku(dist('e/fatiha/index.html'));
  assert.match(fatiha, /data-ses-kok="https:\/\/ulucamii\.be"/);
  const mp3 = [...fatiha.matchAll(/<(?:audio|a)\b[^>]*(?:src|href)="([^"]*\.mp3[^"]*)"/g)].map((m) => m[1]);
  assert.ok(mp3.length >= 2, 'betiksiz yedek bağlantılar yok');
  for (const m of mp3) assert.match(m, /^https:\/\/ulucamii\.be\/media\/ses\//);
  // Çalar düğmelerinin veri adresleri ana sitedeki ses yoluyla aynı; dosyalar ana sitenin public/ klasöründe var.
  for (const m of fatiha.matchAll(/data-ses="(\/media\/ses\/[^"]+)"/g)) assert.ok(existsSync(`public${m[1]}`), `ses dosyası yok: ${m[1]}`);
});

test('Betik: ses kökeni isteğe bağlı (data-ses-kok yoksa eski davranış); egitim CSS’i data: maskesi taşımaz', () => {
  assert.match(oku('src/scripts/ecouter.ts'), /kok\?\.dataset\.sesKok \|\| window\.location\.origin/);
  const css = oku('egitim/src/styles/ecouter.css');
  assert.doesNotMatch(css, /url\(\s*["']?data:/i);
  for (const m of css.matchAll(/url\(\s*["']?(\/[^)"']+)["']?\s*\)/g)) assert.ok(existsSync(`egitim/public${m[1]}`), `${m[1]} yok`);
});
