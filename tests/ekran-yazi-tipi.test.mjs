import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import { ekranIcerigi } from '../src/lib/ekran/icerik.ts';
import { AHLAK_HADISLERI } from '../src/lib/hadis-verisi.ts';

const kok = (p) => new URL('../' + p, import.meta.url);
const yuzler = JSON.parse(readFileSync(kok('src/ekran/yazi-tipleri.json'), 'utf8'));
const oku = (ad) => JSON.parse(readFileSync(kok(`src/data/ekran/${ad}.json`), 'utf8'));

test('yazı tipi rolleri: kuran ve metin; dosya var, satır yüksekliği makul, boyut katsayısı tabanı küçültmez', () => {
  assert.deepEqual(Object.keys(yuzler).sort(), ['kuran', 'metin']);
  assert.equal(yuzler.kuran.dosya, 'arapca-kuran.woff2');
  assert.equal(yuzler.metin.dosya, 'arapca-metin.woff2');
  for (const [rol, y] of Object.entries(yuzler)) {
    assert.ok(existsSync(kok(y.kaynak)), rol + ': ' + y.kaynak);
    assert.ok(y.satirYuksekligi >= 1.4 && y.satirYuksekligi <= 2.2, rol + ' satır yüksekliği');
    assert.ok(y.boyutKatsayisi >= 1 && y.boyutKatsayisi <= 1.3, rol + ' boyut katsayısı (≥ 1: taban korunur)');
    assert.equal(y.lisans, 'OFL-1.1');
  }
});

test('kabuk yeni yazı tiplerini önbelleğe alır, eski Amiri dosyasını almaz; CSS eski yüzü tanımlamaz', () => {
  const kabuk = JSON.parse(readFileSync(kok('src/ekran/kabuk.json'), 'utf8'));
  assert.ok(kabuk.includes('/ekran/fonts/arapca-kuran.woff2') && kabuk.includes('/ekran/fonts/arapca-metin.woff2'));
  assert.equal(kabuk.includes('/ekran/fonts/amiri-arabic.woff2'), false);
  assert.doesNotMatch(readFileSync(kok('src/ekran/ekran.css'), 'utf8'), /amiri-arabic\.woff2/);
});

const yuzAc = (rol) => fontkit.openSync(fileURLToPath(kok(yuzler[rol].kaynak)));
const kn = (ch) => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

// Glif kapısı: yayımlanan her Arapça metnin her harfi ve işareti kendi rolünün yüzünde bulunmalı; yoksa ekranda
// kutucuk ya da başka yazı tipinden karışık harf çıkar.
test('glif kapısı: yayımlanan Arapça metinlerin her kod noktası seçilen yüzde var', () => {
  const s = ekranIcerigi(oku('ayetler'), oku('hadisler'), AHLAK_HADISLERI, oku('dualar'), oku('esma'));
  const metinler = {
    kuran: s.ayetler.map((a) => [a.id, a.ar]).concat(s.dualar.filter((d) => d.kuran).map((d) => [d.id, d.ar])),
    metin: s.hadisler.map((h) => [h.id, h.ar]).concat(s.dualar.filter((d) => !d.kuran).map((d) => [d.id, d.ar]), s.esmalar.map((e) => [e.id, e.ar])),
  };
  const ARAPCA = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const eksikler = [];
  for (const [rol, liste] of Object.entries(metinler)) {
    const yuz = yuzAc(rol);
    for (const [id, ar] of liste) {
      for (const ch of ar) {
        if (ARAPCA.test(ch) && !yuz.hasGlyphForCodePoint(ch.codePointAt(0))) eksikler.push(`${rol} ${id} ${kn(ch)}`);
      }
    }
  }
  assert.deepEqual(eksikler, []);
});

// İçerik taslaklarında geçen özel Kur'an işaretleri: yüz değişirse sessizce kutucuğa dönmesin.
test('kuran yüzü taslaklardaki özel Kur\u2019an işaretlerini taşır', () => {
  const yuz = yuzAc('kuran');
  const gerekli = [0x08d6, 0x0656, 0x06d9, 0x06dc, 0x0670, 0x0653];
  const yok = gerekli.filter((cp) => !yuz.hasGlyphForCodePoint(cp)).map((cp) => kn(String.fromCodePoint(cp)));
  assert.deepEqual(yok, []);
});

// Yüz aileleri ve sayısal değerler tek kaynaktan (yazi-tipleri.json) gelir; kodda kopya kalırsa burada yakalanır.
test("Arapça yüz aileleri main.ts ve ekran.css'te yazi-tipleri.json'daki aile ile aynı", () => {
  const main = readFileSync(kok('src/ekran/main.ts'), 'utf8');
  const css = readFileSync(kok('src/ekran/ekran.css'), 'utf8');
  const kodda = /ARAPCA_YUZLER = \[([^\]]*)\]/.exec(main)[1].split(',').map((x) => x.trim().replace(/^'|'$/g, ''));
  assert.deepEqual(kodda.sort(), [yuzler.kuran.aile, yuzler.metin.aile].sort());
  const cssAileleri = new Set([...css.matchAll(/font-family: ([^;]*);/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])).filter((a) => /^Ekran /.test(a)));
  assert.deepEqual([...cssAileleri].sort(), [yuzler.kuran.aile, yuzler.metin.aile].sort());
});

test("derleme CSS'i --lh-kuran, --lh-metin, --k-kuran, --k-metin değişkenlerini üretir; ekran.css sayısal yedek taşımaz", () => {
  const derle = readFileSync(kok('scripts/ekran-derle.mjs'), 'utf8');
  for (const [d, alan] of [['--lh-kuran', 'kuran.satirYuksekligi'], ['--lh-metin', 'metin.satirYuksekligi'], ['--k-kuran', 'kuran.boyutKatsayisi'], ['--k-metin', 'metin.boyutKatsayisi']]) {
    assert.ok(derle.includes(d + ':${YUZLER.' + alan + '}'), d + " derleme betiğinde yazi-tipleri.json'dan üretilmeli");
  }
  const css = readFileSync(kok('src/ekran/ekran.css'), 'utf8');
  assert.doesNotMatch(css, /var\(--(lh|k)-(kuran|metin),/, "sayı yalnız yazi-tipleri.json'da yaşar");
  // Üretilmiş dosya varsa (build sonrası) değişkenler değerleriyle orada olmalı.
  const uretilen = new URL('../public/ekran/ekran.css', import.meta.url);
  if (existsSync(uretilen)) {
    const u = readFileSync(uretilen, 'utf8');
    assert.ok(u.includes(`--lh-kuran:${yuzler.kuran.satirYuksekligi}`) && u.includes(`--lh-metin:${yuzler.metin.satirYuksekligi}`));
    assert.ok(u.includes(`--k-kuran:${yuzler.kuran.boyutKatsayisi}`) && u.includes(`--k-metin:${yuzler.metin.boyutKatsayisi}`));
  }
});
