import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import {
  BANKA_DURUMU, SORU_BANKASI_SURUMU, MADDELER, EZBER, BEYAN,
  BILGI_ALANLARI, bankaPuanla, girdiDogrula, maddeBul, puanla,
} from '../src/lib/seviye-testi/index.ts';

const diller = ['tr', 'fr', 'en', 'nl', 'de'];
const onekler = { ok: 'okuma', kb: 'kuranBilgi', it: 'itikat', nm: 'namaz', ib: 'ibadet', sy: 'siyer', ah: 'ahlak' };
const alanlar = ['okuma', ...BILGI_ALANLARI];
const puanli = MADDELER.filter(m => !m.emekli && !m.mezhepBagli);
const normalize = (s, dil) => s.normalize('NFC').toLocaleLowerCase(dil).replace(/\s+/gu, ' ').trim();
const bilmiyorum = /bilmiyorum|je ne sais pas|i don['’]t know|ik weet het niet|ich wei(ß|ss) es nicht/iu;
// U+0656/U+0657: Diyanet mushaf\u0131n\u0131n \u00E7eker i\u015Faretleri (uzun \u00AB\u00EE\u00BB/\u00AB\u00FB\u00BB); tam Amiri ikisini de i\u00E7erir.
const arapca = /^[\u0621-\u0657\u0670\u0671\u0640\u200D\u06D6-\u06ED ]+$/u;

function ucDil(metin, yer) {
  for (const dil of diller) {
    assert.equal(typeof metin?.[dil], 'string', `${yer}.${dil}: metin olmalı`);
    assert.ok(metin[dil].trim().length > 0, `${yer}.${dil}: boş olamaz`);
  }
}

function arapcaDogrula(metin, yer) {
  assert.equal(typeof metin, 'string', yer);
  assert.ok(metin.trim().length > 0, `${yer}: boş olamaz`);
  assert.equal(metin, metin.normalize('NFC'), `${yer}: NFC olmalı`);
  assert.match(metin, arapca, `${yer}: izin verilmeyen karakter`);
}

test('banka: bütün kimlikler benzersiz, biçimli ve alan önekleriyle uyumlu', () => {
  const gorulen = new Set();
  for (const [liste, ozelOnek] of [[MADDELER, null], [EZBER, 'ez'], [BEYAN, 'by']]) {
    for (const m of liste) {
      assert.match(m.id, /^[a-z]{2}\d{2,3}$/, m.id);
      assert.ok(!gorulen.has(m.id), `${m.id}: tekrar eden kimlik`);
      gorulen.add(m.id);
      const onek = m.id.slice(0, 2);
      if (ozelOnek) assert.equal(onek, ozelOnek, m.id);
      else {
        assert.ok(Object.hasOwn(onekler, onek), `${m.id}: bilinmeyen önek`);
        assert.equal(m.alan, onekler[onek], m.id);
        assert.equal(m.tur, m.alan === 'okuma' ? 'okuma' : 'bilgi', m.id);
        assert.ok(Number.isInteger(m.basamak) && m.basamak >= 1 && m.basamak <= (m.alan === 'okuma' ? 5 : 3), `${m.id}: basamak`);
      }
    }
  }
});

test('banka: sorular, metin şıkları, ezber ve beyan üç dilde dolu', () => {
  for (const m of MADDELER) {
    ucDil(m.soru, `${m.id}.soru`);
    m.siklar.forEach((s, i) => { if (!('ar' in s)) ucDil(s, `${m.id}.siklar[${i}]`); });
  }
  for (const m of EZBER) {
    ucDil(m.ad, `${m.id}.ad`);
    if (m.aciklama !== undefined) ucDil(m.aciklama, `${m.id}.aciklama`);
  }
  for (const m of BEYAN) {
    ucDil(m.soru, `${m.id}.soru`);
    m.secenekler.forEach((s, i) => ucDil(s, `${m.id}.secenekler[${i}]`));
  }
});

test('banka: şık sayısı, doğru cevap aralığı ve bilmiyorum seçeneğinin ayrılığı', () => {
  for (const m of MADDELER) {
    assert.ok(m.siklar.length >= 3 && m.siklar.length <= 4, `${m.id}: 3–4 şık`);
    if (m.tur === 'bilgi') assert.equal(m.siklar.length, 4, m.id);
    assert.ok(Number.isInteger(m.dogru) && m.dogru >= 0 && m.dogru < m.siklar.length, `${m.id}: doğru cevap`);
    for (const s of m.siklar) {
      for (const yazi of Object.values(s)) assert.doesNotMatch(normalize(yazi, 'en'), bilmiyorum, m.id);
    }
  }
});

test('banka: şıklar NFC, küçük harf ve boşluk normalizasyonundan sonra farklı', () => {
  for (const m of MADDELER) {
    for (const dil of [...diller, 'ar']) {
      const siklar = m.siklar.filter(s => dil in s).map(s => normalize(s[dil], dil));
      assert.equal(new Set(siklar).size, siklar.length, `${m.id}.${dil}: yinelenen şık`);
    }
  }
  for (const m of BEYAN) {
    for (const dil of diller) {
      const secenekler = m.secenekler.map(s => normalize(s[dil], dil));
      assert.equal(new Set(secenekler).size, secenekler.length, `${m.id}.${dil}: yinelenen beyan seçeneği`);
    }
  }
});

test('banka: gösterimler ve Arapça şıklar NFC ve izinli karakterlerden oluşur', () => {
  for (const m of MADDELER) {
    if (m.goster !== undefined) arapcaDogrula(m.goster, `${m.id}.goster`);
    m.siklar.forEach((s, i) => { if ('ar' in s) arapcaDogrula(s.ar, `${m.id}.siklar[${i}]`); });
  }
});

test('banka: okuma görseli/sesi, yerel ses dosyası ve cezm/şedde metin–ses eşleşmesi', () => {
  const alistirmalar = JSON.parse(readFileSync(new URL('../src/data/elifba-alistirmalari.json', import.meta.url), 'utf8'));
  const ornekler = Object.values(alistirmalar).flatMap(a => a.ornekler);
  const publicKoku = new URL('../public/', import.meta.url);
  for (const m of MADDELER.filter(m => m.tur === 'okuma')) {
    assert.ok(m.goster?.trim() || m.ses?.trim(), `${m.id}: gösterim ya da ses gerekli`);
    if (m.ses !== undefined) {
      assert.ok(m.ses.startsWith('/media/ses/'), `${m.id}: yerel ses yolu`);
      const dosya = new URL(`.${m.ses}`, publicKoku);
      assert.ok(dosya.href.startsWith(new URL('media/ses/', publicKoku).href), `${m.id}: ses kökü dışına çıkılamaz`);
      assert.ok(statSync(dosya, { throwIfNoEntry: false })?.isFile(), `${m.id}: ses dosyası yok (${m.ses})`);
      if (/\/(cezm|sedde)\//u.test(m.ses)) {
        assert.ok(ornekler.some(o => o.sesUrl === m.ses && o.metin === m.siklar[m.dogru]?.ar), `${m.id}: resmî metin–ses çiftiyle eşleşmiyor`);
      }
    }
  }
});

test('banka: mezhep maddeleri Hanefî etiketli ve alan başına en çok iki', () => {
  for (const alan of alanlar) {
    const maddeler = MADDELER.filter(m => m.alan === alan && m.mezhepBagli);
    assert.ok(maddeler.length <= 2, `${alan}: en çok iki mezhep maddesi`);
    for (const m of maddeler) assert.ok(m.soru.tr.includes('Hanefî'), `${m.id}: Hanefî etiketi`);
  }
});

test('banka: her sorunun kaynak künyesi en az sekiz karakter', () => {
  for (const m of MADDELER) {
    assert.equal(typeof m.kaynak, 'string', m.id);
    assert.ok(m.kaynak.trim().length >= 8, `${m.id}: kaynak künyesi yetersiz`);
  }
});

test('banka: en az sekiz puanlı maddesi olan alanda hiçbir doğru şık konumu %45’i aşmaz', () => {
  for (const alan of alanlar) {
    const maddeler = puanli.filter(m => m.alan === alan);
    if (maddeler.length < 8) continue;
    for (let i = 0; i < 4; i++) {
      assert.ok(maddeler.filter(m => m.dogru === i).length / maddeler.length <= 0.45, `${alan}: ${i}. konum dengesiz`);
    }
  }
});

test('banka: madde, ezber ve beyan metinlerinde kişisel veri izi yok', () => {
  function denetle(x, yol) {
    if (typeof x === 'string') assert.doesNotMatch(x, /@|\+32|UC-20|IH-20/u, yol);
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) denetle(v, `${yol}.${k}`);
  }
  denetle({ MADDELER, EZBER, BEYAN }, 'banka');
});

test('banka: dizin sırası, arama ve puanlama bağlantıları', () => {
  let onceki = -1;
  for (const m of MADDELER) {
    const sira = alanlar.indexOf(m.alan);
    assert.ok(sira >= onceki, `${m.id}: alan sırası`);
    onceki = sira;
    assert.equal(maddeBul(m.id), m);
  }
  assert.equal(maddeBul('olmayan-kimlik'), undefined);
  assert.deepEqual(bankaPuanla({ cevaplar: {} }), puanla(MADDELER, { cevaplar: {} }));
  assert.deepEqual(girdiDogrula(MADDELER, {}), { tamam: true });
});

const onayTesti = BANKA_DURUMU === 'onayli' ? test : test.skip;
onayTesti('onaylı banka: sürüm, toplam madde, okuma basamakları, bilgi hücreleri, ezber ve beyan tamlığı', () => {
  assert.ok(SORU_BANKASI_SURUMU >= 1);
  assert.ok(puanli.length <= 115);
  const okuma = puanli.filter(m => m.alan === 'okuma');
  assert.equal(okuma.length, 30);
  for (let b = 1; b <= 5; b++) assert.equal(okuma.filter(m => m.basamak === b).length, 6, `okuma K${b}`);
  for (const alan of BILGI_ALANLARI) {
    for (let b = 1; b <= 3; b++) {
      assert.ok(puanli.filter(m => m.alan === alan && m.basamak === b).length >= 4, `${alan} B${b}: en az dört puanlı madde`);
    }
  }
  assert.equal(EZBER.length, 14);
  assert.ok(BEYAN.length >= 10);
});
