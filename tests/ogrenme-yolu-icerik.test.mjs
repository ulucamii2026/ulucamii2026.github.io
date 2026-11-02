import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const yol = JSON.parse(fs.readFileSync(new URL('../paylasilan/ogrenme-yolu/icerik.json', import.meta.url), 'utf8'));
const DIL = ['tr', 'fr', 'en', 'nl', 'de'];
const tumMetin = (v, cikti = []) => {
  if (typeof v === 'string') cikti.push(v);
  else if (Array.isArray(v)) v.forEach((x) => tumMetin(x, cikti));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => tumMetin(x, cikti));
  return cikti;
};
const metinOk = (m, ne) => {
  assert.deepEqual(Object.keys(m), DIL, `${ne}: beş dil sırayla olmalı`);
  for (const d of DIL) assert.ok(typeof m[d] === 'string' && m[d].trim().length > 0, `${ne}.${d} boş`);
};

test('12 hafta h01–h12 sırayla, adım 1–8 hepsi kullanılmış', () => {
  assert.equal(yol.surum, 1);
  assert.deepEqual(yol.haftalar.map((h) => h.id), Array.from({ length: 12 }, (_, i) => 'h' + String(i + 1).padStart(2, '0')));
  assert.deepEqual(yol.adimlar.map((a) => a.no), [1, 2, 3, 4, 5, 6, 7, 8]);
  const kullanilan = new Set(yol.haftalar.map((h) => h.adim));
  for (let n = 1; n <= 8; n++) assert.ok(kullanilan.has(n), `adım ${n} kullanılmamış`);
});

test('beş dil her yerde dolu; uzunluk sınırları', () => {
  metinOk(yol.giris, 'giris');
  for (const d of DIL) assert.ok(yol.giris[d].length <= 600, `giris.${d} > 600`);
  for (const a of yol.adimlar) metinOk(a.baslik, `adim ${a.no}`);
  for (const h of yol.haftalar) {
    for (const alan of ['baslik', 'hedef', 'metin', 'yap']) metinOk(h[alan], `${h.id}.${alan}`);
    for (const d of DIL) assert.ok(h.metin[d].length <= 900, `${h.id}.metin.${d} > 900 (${h.metin[d].length})`);
    for (const d of DIL) assert.equal(h.durum[d], 'taslak');
    assert.ok(h.kaynaklar.length >= 1 && h.kaynaklar.length <= 4, `${h.id} kaynak sayısı`);
    for (const k of h.kaynaklar) metinOk(k.ad, `${h.id}.kaynak.ad`);
  }
});

test('sorular geçerli', () => {
  for (const h of yol.haftalar) {
    assert.equal(h.sorular.length, 2, `${h.id}: 2 soru`);
    h.sorular.forEach((s, i) => {
      assert.equal(s.id, `${h.id}-${i + 1}`);
      metinOk(s.soru, s.id);
      assert.ok(s.siklar.length >= 3 && s.siklar.length <= 4, `${s.id} şık sayısı`);
      s.siklar.forEach((x, j) => metinOk(x, `${s.id} şık ${j}`));
      for (const d of DIL) assert.equal(new Set(s.siklar.map((x) => x[d])).size, s.siklar.length, `${s.id}.${d} şıklar farklı olmalı`);
      assert.ok(Number.isInteger(s.dogru) && s.dogru >= 0 && s.dogru < s.siklar.length, `${s.id} dogru`);
      assert.ok(typeof s.kaynak === 'string' && s.kaynak.trim(), `${s.id} kaynak`);
    });
  }
});

test('bağlantılar yalnız izinli sunuculara', () => {
  const sunnah = new Set(['/bukhari:1', '/bukhari:69', '/muslim:8a']);
  for (const h of yol.haftalar) for (const k of h.kaynaklar) {
    const u = new URL(k.url);
    assert.equal(u.protocol, 'https:', k.url);
    const ok = u.hostname === 'islamansiklopedisi.org.tr' || u.hostname === 'diyanet.gov.tr' || u.hostname.endsWith('.diyanet.gov.tr') ||
      (u.hostname === 'sunnah.com' && sunnah.has(decodeURIComponent(u.pathname)));
    assert.ok(ok, `izinsiz bağlantı: ${k.url}`);
  }
});

test('telefon, e-posta ve kurum adı yok', () => {
  const hepsi = tumMetin(yol);
  for (const s of hepsi) {
    assert.ok(!/\+?\d[\d ./-]{7,}\d/.test(s.replace(/https?:\/\/\S+/g, '')), `telefon benzeri: ${s.slice(0, 60)}`);
    assert.ok(!/[\w.+-]+@[\w-]+\.[\w.-]+/.test(s), `e-posta: ${s.slice(0, 60)}`);
  }
  const json = JSON.stringify(yol);
  assert.ok(!new RegExp(['ulu', 'camii'].join(' ?'), 'i').test(json));
});

test('video kimlikleri sitenin video verisinde var', () => {
  const oku = (f) => JSON.parse(fs.readFileSync(new URL('../src/data/' + f, import.meta.url), 'utf8'));
  const idler = {
    tr: new Set(oku('diyanet-videolar.json').bolumler.map((b) => b.id)),
    en: new Set(oku('diyanet-videolar-en.json').bolumler.map((b) => b.id)),
  };
  for (const h of yol.haftalar) for (const [dil, id] of Object.entries(h.video ?? {})) {
    assert.ok(idler[dil]?.has(id), `${h.id}: ${dil} video ${id} yok`);
  }
});

test('yasak sözcük listesi (OGRENME_YASAK_LISTE)', (t) => {
  const yolu = process.env.OGRENME_YASAK_LISTE;
  if (!yolu) return t.skip('OGRENME_YASAK_LISTE tanımsız: yasak sözcük taraması atlandı');
  const kurallar = fs.readFileSync(yolu, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')).map((s) => new RegExp(s, 'i'));
  const json = JSON.stringify(yol);
  for (const k of kurallar) assert.ok(!k.test(json), `yasak desen eşleşti: ${k}`);
});
