/** Kurs bölümü çeviri bindirmeleri (12 Kasım 2026) — eşlik, yazım ve eskime kapısı.
 *
 *  İlim Yolu kurs sayfaları (egitim/src/sayfalar/{DersMateryalleri,KursGunlugu,YillikPlan,Mufredat}.astro) en/nl/de metnini
 *  src/data/konular-<dil>.json ve src/data/kurs-ceviri/<dil>.json bindirmelerinden alır; kaynak veri kurs projesindeki betiklerle
 *  haftalık yenilenir (src/lib/kurs-ceviri.mjs başlığı). Bu test:
 *   1. kaynaktaki her öğenin her dilde çevirisi ya da bilerek «bekleyen» kaydı olduğunu (eşlik),
 *   2. hafta notu ve kalıcı materyal çevirilerinin Türkçe kaynak değişince eskidiğini (özet uyuşması),
 *   3. çevirilerin biçimini (boş değil, kenar boşluğu/çift boşluk yok, doğru tırnak/kesme, Fransızca noktalama yok, satır ve madde
 *      sayısı, kaynaktaki sayıların korunması) denetler.
 *  Sahipsiz bindirme girdisi (kaynak metin değişti/kalktı) yalnız bildirilir. Eksik çıktığında sayfa o öğeyi Fransızca/Türkçe ve
 *  doğru `lang` + görünür dil etiketiyle gösterir; listeyi `node scripts/kurs-ceviri-kaynak.mjs --eksik <dil>` verir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { depoKaynaklari, CEVIRI_DILLERI } from '../src/lib/kurs-ceviri.mjs';
import { rapor } from '../scripts/kurs-ceviri-kaynak.mjs';

const kok = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\/$/, '');
const oku = (y) => JSON.parse(readFileSync(`${kok}/${y}`, 'utf8'));
const kaynak = depoKaynaklari(kok);
const BOLUMLER = ['baslik', 'sunumKonu', 'hedef', 'rozet'];

const bindirme = (dil) => oku(`src/data/kurs-ceviri/${dil}.json`);
const konular = (dil) => (existsSync(`${kok}/src/data/konular-${dil}.json`) ? oku(`src/data/konular-${dil}.json`) : {});

/** Bir dilin bütün çeviri değerleri: [{ ad, tr, deger }] (kaynak metniyle birlikte, biçim denetimi için). */
function degerler(dil) {
  const b = bindirme(dil);
  const k = konular(dil);
  const liste = [];
  for (const o of kaynak.konu) if (dil !== 'en' && k[o.k] !== undefined) liste.push({ ad: `konu «${o.k}»`, tr: o.k, deger: k[o.k] });
  for (const bolum of BOLUMLER) for (const o of kaynak[bolum]) if (b[bolum]?.[o.k] !== undefined) liste.push({ ad: `${bolum} «${o.k}»`, tr: o.k, deger: b[bolum][o.k] });
  for (const o of kaynak.hafta) if (b.hafta?.[o.k]) liste.push({ ad: `hafta ${o.k}`, tr: o.tr, deger: b.hafta[o.k].t });
  for (const o of kaynak.kalici) {
    const v = b.kalici?.[o.k];
    if (v) { liste.push({ ad: `kalici ${o.k} başlık`, tr: o.tr, deger: v.baslik }); if (o.trAciklama) liste.push({ ad: `kalici ${o.k} açıklama`, tr: o.trAciklama, deger: v.aciklama }); }
  }
  return liste;
}

for (const dil of CEVIRI_DILLERI) {
  test(`${dil}: kaynaktaki her öğenin çevirisi var ya da bilerek bekleyen`, () => {
    const r = rapor(dil);
    const eksik = Object.entries(r).flatMap(([bolum, v]) => v.eksik.map((o) => `${bolum}: ${String(o.k).slice(0, 80)}`));
    const eski = Object.entries(r).flatMap(([bolum, v]) => v.eski.map((k) => `${bolum}: ${k}`));
    const sahipsiz = Object.entries(r).flatMap(([bolum, v]) => v.sahipsiz.map((k) => `${bolum}: ${String(k).slice(0, 60)}`));
    if (sahipsiz.length) console.log(`# ${dil}: ${sahipsiz.length} sahipsiz bindirme girdisi (kaynak metin değişmiş/kalkmış olabilir): ${sahipsiz.slice(0, 5).join(' | ')}`);
    assert.deepEqual(eksik, [], `${dil}: çevirisi olmayan öğeler (node scripts/kurs-ceviri-kaynak.mjs --eksik ${dil}); sayfa bunları Fransızca/Türkçe + dil etiketiyle gösterir`);
    assert.deepEqual(eski, [], `${dil}: Türkçe kaynağı değişen, çevirisi eskimiş öğeler`);
  });

  test(`${dil}: bekleyen kayıtlar kaynakta var ve nedeni yazılı`, () => {
    const b = bindirme(dil);
    const varMi = { baslik: kaynak.baslik, sunumKonu: kaynak.sunumKonu, hedef: kaynak.hedef, rozet: kaynak.rozet, konu: kaynak.konu, hafta: kaynak.hafta, kalici: kaynak.kalici };
    for (const [bolum, anahtarlar] of Object.entries(b.bekleyen ?? {})) {
      assert.ok(varMi[bolum], `bilinmeyen bekleyen bölüm: ${bolum}`);
      for (const k of anahtarlar) assert.ok(varMi[bolum].some((o) => o.k === k), `${dil}: bekleyen ${bolum} anahtarı kaynakta yok: ${k}`);
    }
    if (Object.keys(b.bekleyen ?? {}).length) assert.ok(b.bekleyenNeden, `${dil}: bekleyenNeden yazılmalı`);
  });

  test(`${dil}: çevirilerin biçimi (boşluk, tırnak, noktalama, satır/madde, sayılar)`, () => {
    const sorun = [];
    for (const { ad, tr, deger } of degerler(dil)) {
      if (typeof deger !== 'string' || !deger.trim()) { sorun.push(`${ad}: boş`); continue; }
      if (deger !== deger.trim()) sorun.push(`${ad}: kenar boşluğu`);
      if (/[ \t]{2,}/.test(deger)) sorun.push(`${ad}: çift boşluk`);
      if (/ [:;?!]/.test(deger)) sorun.push(`${ad}: noktalama öncesi boşluk (Fransızca biçimi)`);
      if (/['"«»]/.test(deger)) sorun.push(`${ad}: düz tırnak/kesme ya da « » (’ ve dile uygun tırnak kullanın)`);
      if ((dil === 'nl' || dil === 'en') && /„/.test(deger)) sorun.push(`${ad}: ${dil} dilinde „ kullanılmaz`);
      if (dil === 'de' && /[”]/.test(deger)) sorun.push(`${ad}: de'de ” yerine “ kapanış kullanılır („…“)`);
      if (dil === 'de' && (deger.match(/“/g) ?? []).length !== (deger.match(/„/g) ?? []).length) sorun.push(`${ad}: „ “ çifti eşleşmiyor`);
      if (deger.split('\n').length !== tr.split('\n').length) sorun.push(`${ad}: satır sayısı kaynakla aynı değil`);
      if ((deger.match(/•/g) ?? []).length !== (tr.match(/•/g) ?? []).length) sorun.push(`${ad}: madde (•) sayısı kaynakla aynı değil`);
      /* Tek haneli sayılar çeviride sözcük olabilir («1. gün» → «eerste dag», «5 âyet» → «fünf»); iki ve daha çok haneli sayılar (sayfa, tarih, saat) aynen kalır. */
      const sayilar = (tr.match(/\d{2,}/g) ?? []);
      for (const n of sayilar) if (!deger.includes(n)) sorun.push(`${ad}: kaynaktaki sayı yok (${n})`);
    }
    assert.deepEqual(sorun, []);
  });
}

test('en/nl/de: bindirme dosyaları aynı bölümlere sahip ve dürüst durum notu taşır', () => {
  for (const dil of CEVIRI_DILLERI) {
    const b = bindirme(dil);
    for (const bolum of [...BOLUMLER, 'hafta', 'kalici']) assert.equal(typeof b[bolum], 'object', `${dil}: ${bolum} bölümü yok`);
    assert.match(b._aciklama ?? '', /gözden geçirilmedi/, `${dil}: makine destekli çeviri notu eksik`);
  }
});

test('çevirici: düşüş zinciri doğru dili bildirir; eskimiş hafta notu çeviri sayılmaz; tr/fr bindirmeden etkilenmez', async () => {
  const { cevirici, ozet } = await import('../src/lib/kurs-ceviri.mjs');
  const bind = { hedef: { 'Türkçe cümle': 'Dutch sentence' }, hafta: { '2026-09-05|odev': { h: ozet('eski'), t: 'oud' } } };
  const nl = cevirici('nl', { bindirme: bind });
  assert.deepEqual(nl.hedef({ goal_tr: 'Türkçe cümle', goal_fr: 'Phrase' }), { m: 'Dutch sentence', d: 'nl' });
  assert.deepEqual(nl.hedef({ goal_tr: 'Yeni cümle', goal_fr: 'Nouvelle phrase' }), { m: 'Nouvelle phrase', d: 'fr' });
  assert.deepEqual(nl.hedef({ goal_tr: 'Yeni cümle', goal_fr: '' }), { m: 'Yeni cümle', d: 'tr' });
  assert.deepEqual(nl.hafta('2026-09-05', 'odev', { tr: 'eski', fr: 'ancien' }), { m: 'oud', d: 'nl' });
  assert.deepEqual(nl.hafta('2026-09-05', 'odev', { tr: 'değişti', fr: 'changé' }), { m: 'changé', d: 'fr' });
  const fr = cevirici('fr', { bindirme: bind });
  assert.deepEqual(fr.hedef({ goal_tr: 'Türkçe cümle', goal_fr: 'Phrase' }), { m: 'Phrase', d: 'fr' });
  assert.deepEqual(cevirici('tr').hedef({ goal_tr: 'Türkçe cümle', goal_fr: 'Phrase' }), { m: 'Türkçe cümle', d: 'tr' });
  const en = cevirici('en', { konular: { Konu: 'Topic' } });
  assert.deepEqual(en.konu('Konu'), { m: 'Topic', d: 'en' });
  assert.deepEqual(en.kalici('x', 'baslik', { baslik: { tr: 'T', fr: 'F', en: 'E' } }), { m: 'E', d: 'en' });
});
