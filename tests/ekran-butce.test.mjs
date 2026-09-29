import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OLCU, olcuDegiskenleri, UST_BASLIK } from '../src/lib/ekran/olcu.ts';
import { BUTCE, maneviButce, duyuruParcalari, duyuruDilleri, duyuruAsimlari, uzunluk } from '../src/lib/ekran/butce.ts';
import { AHLAK_HADISLERI } from '../src/lib/hadis-verisi.ts';

const harf = (n, c = 'a') => c.repeat(n);

test('ölçüler: her türün tabanı pozitif, enCok ≥ 1; üst başlık ölçeklenmez (OLCU dışında)', () => {
  // Üst başlık sabittir ve ölçekle büyümez
  assert.equal(UST_BASLIK, 2.6);
  for (const tur of Object.keys(OLCU)) {
    const vars = olcuDegiskenleri(tur);
    const varNames = vars.map(([ad]) => ad);
    assert.ok(!varNames.includes('--f-ust'), `${tur} olcuDegiskenleri'nde --f-ust olmamalı`);
  }
  // OLCU doğruluğu
  for (const [tur, o] of Object.entries(OLCU)) {
    assert.ok(o.enCok >= 1, tur + ' enCok');
    assert.ok(o.tr > 0 && o.fr > 0, tur + ' tr/fr tabanı');
  }
  assert.equal(OLCU.esma.ar, 8);
  assert.equal(OLCU.ayet.enCok, 1.9);
});

test('ölçü değişkenleri CSS adlarıyla ve sayı metniyle döner', () => {
  const d = new Map(olcuDegiskenleri('hadis'));
  assert.equal(d.get('--f-ar'), '4.8');
  assert.equal(d.get('--f-tr'), '3.4');
  assert.equal(d.get('--f-susleme'), '2.2');
});

test('uzunluk baştaki/sondaki boşluğu saymaz; boş ve undefined 0', () => {
  assert.equal(uzunluk('  ab  '), 2);
  assert.equal(uzunluk(''), 0);
  assert.equal(uzunluk(undefined), 0);
});

test('manevi bütçe: profil A ya da B\'ye uyan geçer, ikisini de aşan aşımı raporlar', () => {
  const [A, B] = BUTCE.manevi;
  assert.equal(maneviButce('hadis', { ar: harf(A.ar), tr: harf(A.tr), fr: harf(A.fr), kaynak: 'k' }).uygun, true);
  assert.equal(maneviButce('hadis', { ar: harf(B.ar), tr: harf(B.tr), fr: harf(B.fr), kaynak: 'k' }).uygun, true);
  const r = maneviButce('hadis', { ar: harf(A.ar + 1), tr: harf(B.tr + 1), kaynak: 'k' });
  assert.equal(r.uygun, false);
  assert.ok(r.asim.length > 0 && /^(AR|TR|FR|KAYNAK) \d+\/\d+$/.test(r.asim[0]), r.asim.join());
  // Rapor, kısaltmanın en az olduğu profile göre: TR 200 → B'nin sınırı (130), A'nınki (88) değil.
  const tr200test = maneviButce('hadis', { ar: 'a', tr: harf(200), kaynak: 'k' });
  assert.deepEqual(tr200test.asim, [`TR 200/${BUTCE.manevi[1].tr}`]);
});

test('esma bütçesi: isim, okunuş, TR, FR ayrı sınırlar', () => {
  const E = BUTCE.esma;
  assert.equal(maneviButce('esma', { ar: harf(E.ar), okunus: harf(E.okunus), tr: harf(E.tr), fr: harf(E.fr), kaynak: 'k' }).uygun, true);
  assert.equal(maneviButce('esma', { ar: harf(E.ar), okunus: harf(E.okunus + 1), tr: 't', kaynak: 'k' }).uygun, false);
});

test('sitedeki 10 hadisin hepsi manevi bütçeye uyar (başlangıç havuzu yayından düşmez)', () => {
  for (const h of AHLAK_HADISLERI) {
    const r = maneviButce('hadis', { ar: h.arapca, tr: h.metin.tr, fr: h.metin.fr, kaynak: h.kaynak });
    assert.equal(r.uygun, true, h.id + ': ' + r.asim.join(', '));
  }
});

const D = BUTCE.duyuru;
const m = (baslik, metin) => ({ baslik, metin });

test('duyuru: iki dil, metin ≤ 90 → tek levha iki dil', () => {
  assert.deepEqual(duyuruParcalari({ tr: m('b', harf(D.tekSlaytMetin)), fr: m('b', 'x') }), [{ yerlesim: 'levha', diller: ['tr', 'fr'] }]);
});

test('duyuru: iki dil, metin 91–180 → TR ve FR ayrı iki levha', () => {
  assert.deepEqual(duyuruParcalari({ tr: m('b', harf(D.tekSlaytMetin + 1)), fr: m('b', 'x') }), [
    { yerlesim: 'levha', diller: ['tr'] }, { yerlesim: 'levha', diller: ['fr'] }]);
});

test('duyuru: tek dil, metin ≤ 180 → tek levha', () => {
  assert.deepEqual(duyuruParcalari({ tr: m('b', harf(D.ikiSlaytMetin)) }), [{ yerlesim: 'levha', diller: ['tr'] }]);
});

test('duyuru: metin > 180 ya da başlık > 60 → sığmaz, boş liste', () => {
  assert.deepEqual(duyuruParcalari({ tr: m('b', harf(D.ikiSlaytMetin + 1)) }), []);
  assert.deepEqual(duyuruParcalari({ tr: m(harf(D.baslik + 1), 'x') }), []);
});

test('duyuru: afişli, kısa başlık ve metin → afiş yanında tek slayt, metinli', () => {
  assert.deepEqual(duyuruParcalari({ gorsel: '/a.png', tr: m(harf(D.afisBaslik), harf(D.afisMetin)), fr: m('b', 'x') }), [{ yerlesim: 'afis-sol', metinli: true }]);
});

test('duyuru: afişli, uzun metin → afiş + başlık, ardından metin levhası (içerik düşmez)', () => {
  assert.deepEqual(duyuruParcalari({ gorsel: '/a.png', tr: m('b', harf(D.afisMetin + 1)), fr: m('b', 'x') }), [
    { yerlesim: 'afis-sol', metinli: false }, { yerlesim: 'levha', diller: ['tr', 'fr'] }]);
});

test('duyuru: afişli ama metinsiz (yalnız başlık) → tek afiş slaytı', () => {
  assert.deepEqual(duyuruParcalari({ gorsel: '/a.png', tr: m('Kermes', '') }), [{ yerlesim: 'afis-sol', metinli: true }]);
});

test('CMS sınırları bütçeyle aynı: ekranMetni 180, ekranBasligi 60', () => {
  const yml = readFileSync(new URL('../public/admin/icerik/config.yml', import.meta.url), 'utf8');
  assert.match(yml, new RegExp(`name: ekranMetni[^\\n]*\\{0,${D.ikiSlaytMetin}\\}`));
  assert.match(yml, new RegExp(`name: ekranBasligi[^\\n]*\\{0,${D.baslik}\\}`));
  // Hata iletisi de CMS'te görünür: iki alanda da aynı açıklama.
  for (const ad of ['ekranBasligi', 'ekranMetni']) assert.match(yml, new RegExp(`name: ${ad}[^\\n]*Bu metin ekrana sığmaz, kısaltın`));
  // Astro şeması sınırları BUTCE'den alır (üçüncü bir kopya yok).
  const sema = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
  assert.match(sema, /ekranBasligi: z\.string\(\)\.max\(BUTCE\.duyuru\.baslik\)/);
  assert.match(sema, /ekranMetni: z\.string\(\)\.max\(BUTCE\.duyuru\.ikiSlaytMetin\)/);
});

test('duyuru: FR metni TR’den uzunsa eşik FR’ye göre (91–180 → ayrı slaytlar), TR kısa olsa da', () => {
  assert.deepEqual(duyuruParcalari({ tr: m('b', harf(20)), fr: m('b', harf(D.tekSlaytMetin + 30)) }), [
    { yerlesim: 'levha', diller: ['tr'] }, { yerlesim: 'levha', diller: ['fr'] }]);
});

test('duyuru: başlık yalnız FR’de 60’ı aşarsa sığmaz; aşım FR olarak raporlanır', () => {
  const d = { tr: m('kısa', 'x'), fr: m(harf(D.baslik + 7), 'x') };
  assert.deepEqual(duyuruParcalari(d), []);
  assert.deepEqual(duyuruAsimlari(d), [`FR başlık ${D.baslik + 7}/${D.baslik}`]);
});

test('duyuru: afişli, 91–180 karakter metin → afiş + TR ile FR ayrı iki metin slaytı (hiçbir şey düşmez)', () => {
  assert.deepEqual(duyuruParcalari({ gorsel: '/a.png', tr: m('b', harf(100)), fr: m('b', harf(120)) }), [
    { yerlesim: 'afis-sol', metinli: false }, { yerlesim: 'levha', diller: ['tr'] }, { yerlesim: 'levha', diller: ['fr'] }]);
});

test('duyuruDilleri tek kaynak: yalnız dolu diller, TR önce; duyuruAsimlari sığan duyuruda boş, aşanda dil ve sınırla', () => {
  assert.deepEqual(duyuruDilleri({ fr: m('b', 'x') }), ['fr']);
  assert.deepEqual(duyuruDilleri({ tr: m('b', 'x'), fr: m('b', 'x') }), ['tr', 'fr']);
  assert.deepEqual(duyuruDilleri({}), []);
  assert.deepEqual(duyuruAsimlari({ tr: m('b', harf(D.ikiSlaytMetin)) }), []);
  assert.deepEqual(duyuruAsimlari({ tr: m(harf(67), 'x'), fr: m('b', harf(212)) }), ['TR başlık 67/60', 'FR metin 212/180']);
});
