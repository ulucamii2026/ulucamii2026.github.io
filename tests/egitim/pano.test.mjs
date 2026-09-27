/**
 * egitim.ulucamii.be Faz 1f (27 Eyl 2026) — panonun yerleşimi ve arayüz metinleri. Neden: pano 182 hücrelik bir
 * ızgaradır ve her hücre konumunu sınıfla alır (satır içi stil yok); çakışan ya da boş kalan hücre, eksik ya da iki kez
 * dizilen madde, bozuk kenar yönü görsel olarak fark edilmeden yayına çıkabilir. Kenar suyu kilimle aynı saat yönü
 * düzenini izlemeli; Amme etiketi CSS'te 5 satır boyunca yayılır (egitim/src/styles/cini.css). Arayüz metinleri beş dilde
 * dolu olmalı, Fransızca tipografi tekrar uygulanınca değişmemeli, basamak metinleri onaylı eşikleri söylemeli
 * (sertifika Pekişti'de, altın kenar Kalıcı'da; taslaktaki yanlış «sertifika Kalıcı'da» cümlesi geri gelmemeli).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/egitim-pano-test.mjs');
await build({
  stdin: {
    contents: [
      'export * from "./egitim/src/lib/pano.ts";',
      'export * from "./egitim/src/i18n/metinler.ts";',
      'export * from "./egitim/src/lib/kimlik.ts";',
      'export { KATALOG, seviyeOgeleri } from "./src/lib/ezber/katalog.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  alias: { '@ortak': './src' },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(outfile).href);
const P = m.pano();
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const maddeler = P.hucreler.filter((h) => h.tur === 'madde');
const say = (tur) => P.hucreler.filter((h) => h.tur === tur).length;

test('Izgara 13 × 14: her hücre tam bir kez dolu (Amme etiketi 5 satır kaplar)', () => {
  assert.equal(P.sutun, 13);
  assert.equal(P.satir, 14);
  const dolu = new Map();
  for (const h of P.hucreler) {
    const boy = h.tur === 'amme' ? h.boy : 1;
    for (let r = h.r; r < h.r + boy; r++) {
      assert.ok(r >= 1 && r <= P.satir && h.c >= 1 && h.c <= P.sutun, `${h.tur} ${r}.${h.c} ızgara dışında`);
      const anahtar = `${r}.${h.c}`;
      assert.ok(!dolu.has(anahtar), `${anahtar} iki kez dolu (${dolu.get(anahtar)} + ${h.tur})`);
      dolu.set(anahtar, h.tur);
    }
  }
  assert.equal(dolu.size, 13 * 14, 'boş kalan hücre var');
});

test('Sayılar: 81 madde (13 kenar suyu), 33 bordür, 4 köşe, 7 sıra etiketi, 1 Amme etiketi (5 durak)', () => {
  assert.equal(maddeler.length, m.KATALOG.ogeler.length);
  assert.equal(maddeler.length, 81);
  assert.equal(maddeler.filter((h) => h.sira === null).length, 13);
  assert.equal(say('bordur'), 33);
  assert.equal(say('kose'), 4);
  assert.equal(say('sira'), 7);
  const amme = P.hucreler.filter((h) => h.tur === 'amme');
  assert.equal(amme.length, 1);
  assert.deepEqual([amme[0].r, amme[0].c, amme[0].boy], [9, 2, 5], 'cini.css .amme { grid-row-end: span 5 } buna dayanır');
  assert.deepEqual(new Set(maddeler.map((h) => h.oge.id)), new Set(m.KATALOG.ogeler.map((o) => o.id)), 'her madde tam bir kez');
});

test('Şerit maddeleri ortadaki alanda, sırası seviyeye göre; kenar suyu çevrede', () => {
  for (const h of maddeler) {
    if (h.sira === null) {
      assert.ok(h.r === 1 || h.r === P.satir || h.c === 1 || h.c === P.sutun, `${h.oge.id} çevrede değil`);
      assert.equal(h.oge.seviye, 'kenar');
    } else {
      assert.ok(h.r >= 2 && h.r <= P.satir - 1 && h.c >= 3 && h.c <= P.sutun - 1, `${h.oge.id} iç alanda değil`);
      assert.equal(h.r, h.sira.r);
    }
  }
  const siralar = P.siralar.map((s) => (s.seviye === 8 ? `8.${s.durak}` : String(s.seviye)));
  assert.deepEqual(siralar, ['1', '2', '3', '4', '5', '6', '7', '8.1', '8.2', '8.3', '8.4', '8.5']);
});

test('Okuma sırası: şeritler katalog sırasıyla, sonra kenar suyu saat yönünde (üst → sağ → alt → sol)', () => {
  const beklenen = [
    ...[1, 2, 3, 4, 5, 6, 7].flatMap((s) => m.seviyeOgeleri(s)),
    ...P.siralar.filter((s) => s.seviye === 8).flatMap((s) => s.ogeler),
    ...m.seviyeOgeleri('kenar'),
  ].map((o) => o.id);
  assert.deepEqual(maddeler.map((h) => h.oge.id), beklenen);
  const kenar = maddeler.filter((h) => h.sira === null);
  const kenarAdi = (h) => (h.r === 1 ? 'ust' : h.c === P.sutun ? 'sag' : h.r === P.satir ? 'alt' : 'sol');
  const kenarlar = kenar.map(kenarAdi);
  assert.deepEqual(kenarlar, [...kenarlar].sort((a, b) => ['ust', 'sag', 'alt', 'sol'].indexOf(a) - ['ust', 'sag', 'alt', 'sol'].indexOf(b)));
  assert.deepEqual(['ust', 'sag', 'alt', 'sol'].map((k) => kenarlar.filter((x) => x === k).length), [4, 3, 3, 3]);
  for (let i = 1; i < kenar.length; i++) {
    const [a, b] = [kenar[i - 1], kenar[i]];
    if (kenarAdi(a) !== kenarAdi(b)) continue;
    const ilerleme = { ust: b.c - a.c, sag: b.r - a.r, alt: a.c - b.c, sol: a.r - b.r }[kenarAdi(a)];
    assert.ok(ilerleme > 0, `${a.oge.id} → ${b.oge.id} saat yönünde değil`);
  }
});

test('Bordür karoları bulundukları kenarın yönünü taşır; köşeler dört uçta', () => {
  for (const h of P.hucreler.filter((x) => x.tur === 'bordur')) {
    const yon = h.r === 1 ? 'ust' : h.c === P.sutun ? 'sag' : h.r === P.satir ? 'alt' : 'sol';
    assert.equal(h.yon, yon, `${h.r}.${h.c}`);
  }
  const koseler = P.hucreler.filter((x) => x.tur === 'kose').map((h) => `${h.r}.${h.c}`).sort();
  assert.deepEqual(koseler, ['1.1', '1.13', '14.1', '14.13']);
});

test('Arayüz metinleri beş dilde dolu; işlevler dolu metin döndürür', () => {
  const bos = [];
  const gez = (d, yol, x) => {
    if (typeof x === 'string') { if (!x.trim()) bos.push(`${d}:${yol}`); return; }
    if (typeof x === 'function') { gez(d, `${yol}()`, String(x(3, 2))); return; }
    if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) gez(d, `${yol}.${k}`, v);
  };
  const anahtarlar = Object.keys(m.metin('tr')).sort();
  for (const d of DILLER) {
    assert.deepEqual(Object.keys(m.metin(d)).sort(), anahtarlar, `${d}: anahtarlar tr ile aynı olmalı`);
    gez(d, '', m.metin(d));
  }
  assert.deepEqual(bos, []);
});

test('Fransızca tipografi: bölünmez boşluklar doğru ve dönüşüm tekrar uygulanınca değişmez', () => {
  const s = 'Écouter : Fatiha ; « Pourquoi ? » Bravo !';
  const t = m.fransizTipografi(s);
  assert.equal(t, 'Écouter : Fatiha ; « Pourquoi ? » Bravo !');
  assert.equal(m.fransizTipografi(t), t);
  assert.doesNotMatch(JSON.stringify(m.metin('fr').basamak) + m.metin('fr').dinleEtiketi('X'), / [:;!?]/, 'fr metinleri dönüşmüş gelmeli');
});

test('Basamak metinleri onaylı eşikleri söyler: sertifika Pekişti basamağında, altın kenar Kalıcı basamağında', () => {
  const SERTIFIKA = { tr: /Sertifika/, fr: /certificat/i, en: /certificate/i, nl: /certificaat/i, de: /Zertifikat/i };
  for (const d of DILLER) {
    const b = m.metin(d).basamak;
    assert.match(b[3][0], SERTIFIKA[d], `${d}: sertifika Pekişti'de anılmalı`);
    assert.doesNotMatch(b[4][0], SERTIFIKA[d], `${d}: Kalıcı basamağı sertifika vermez (eşik tümü ≥ Pekişti)`);
  }
});

test('İletişim bloğu kurumsal kimlikten: yalnız cami hattı, info@ulucamii.be, ana site', () => {
  const kimlik = JSON.parse(readFileSync('src/data/kurumsal-kimlik.json', 'utf8'));
  const cami = kimlik.iletisim.telefonlar.find((t) => t.kimlik === 'cami');
  assert.deepEqual(m.ILETISIM.telefon, { goster: cami.goster, e164: cami.e164 });
  assert.equal(m.ILETISIM.eposta, 'info@ulucamii.be');
  assert.equal(m.ANA_SITE, 'https://ulucamii.be');
});
