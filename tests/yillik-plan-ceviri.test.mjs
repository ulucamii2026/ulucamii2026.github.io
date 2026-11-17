/** Yıllık plan gövdesi çevirisi (12 Kasım 2026) — anahtar eşliği, biçim ve düşüş zinciri.
 *
 *  Gövde (kazanım/özet/etkinlik/ezber paragrafları) src/data/kurs-ceviri/<dil>.json → plan bölümünde tutulur; anahtar Türkçe paragrafın
 *  kendisi. Bölüm bilerek KISMİ (kapsam tests/kurs-ceviri.test.mjs'deki «eksik» kapısına girmez): çevrilmemiş paragraf Türkçe kalır.
 *  Bu test: (1) en/nl/de/fr aynı anahtar kümesine sahip, (2) her anahtar plandaki bir paragrafla birebir eşleşir (kaynak değişince
 *  sahipsiz çeviri sessizce kalmaz), (3) biçim kuralları, (4) çevirici düşüş zinciri ve lang bildirimi.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cevirici, planParagraflari } from '../src/lib/kurs-ceviri.mjs';

const kok = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\/$/, '');
const oku = (y) => JSON.parse(readFileSync(`${kok}/${y}`, 'utf8'));
const paragraflar = planParagraflari(oku('src/data/yillik-plan-2026-2027.json'));
const DILLER = ['en', 'nl', 'de', 'fr'];
const plan = Object.fromEntries(DILLER.map((d) => [d, oku(`src/data/kurs-ceviri/${d}.json`).plan ?? {}]));

test('plan gövdesi: dört dilin anahtar kümesi aynı (eşlik) ve boş değil', () => {
  const temel = Object.keys(plan.en).sort();
  assert.ok(temel.length > 0, 'en plan bölümü boş');
  for (const d of DILLER) assert.deepEqual(Object.keys(plan[d]).sort(), temel, `${d}: anahtar kümesi en ile aynı olmalı`);
});

test('plan gövdesi: her anahtar plandaki bir paragrafla birebir eşleşir (sahipsiz çeviri yok)', () => {
  const var_ = new Set(paragraflar);
  for (const d of DILLER) for (const k of Object.keys(plan[d])) assert.ok(var_.has(k), `${d}: planda olmayan anahtar: ${k.slice(0, 70)}`);
});

test('plan gövdesi: çevirilerin biçimi (boşluk, tırnak, noktalama, madde ve eğik çizgi sayısı, sayılar, dil tuzakları)', () => {
  const sorun = [];
  for (const d of DILLER) for (const [tr, deger] of Object.entries(plan[d])) {
    const ad = `${d} «${tr.slice(0, 40)}»`;
    if (typeof deger !== 'string' || !deger.trim()) { sorun.push(`${ad}: boş`); continue; }
    if (deger !== deger.trim()) sorun.push(`${ad}: kenar boşluğu`);
    if (/[ \t]{2,}/.test(deger)) sorun.push(`${ad}: çift boşluk`);
    if (/ [:;?!]/.test(deger)) sorun.push(`${ad}: noktalama öncesi düz boşluk (Fransızca biçimini ara katman verir)`);
    if (/['"]/.test(deger)) sorun.push(`${ad}: düz tırnak/kesme (’ ve dile uygun tırnak kullanın)`);
    if (d !== 'fr' && /[«»]/.test(deger)) sorun.push(`${ad}: « » yalnız Fransızcada`);
    if (d !== 'de' && /„/.test(deger)) sorun.push(`${ad}: „ yalnız Almancada`);
    if (d === 'de' && (deger.match(/“/g) ?? []).length !== (deger.match(/„/g) ?? []).length) sorun.push(`${ad}: „ “ çifti eşleşmiyor`);
    if (deger === tr) sorun.push(`${ad}: çeviri kaynağın aynısı`);
    for (const ayirac of ['•', ' / ']) {
      const say = (s) => s.split(ayirac).length;
      if (say(deger) !== say(tr)) sorun.push(`${ad}: «${ayirac.trim()}» sayısı kaynakla aynı değil`);
    }
    for (const n of tr.match(/\d{2,}/g) ?? []) if (!deger.includes(n)) sorun.push(`${ad}: kaynaktaki sayı yok (${n})`);
    if (/\(s\.a\.s\.\)/.test(tr) && !/\((s\.a\.s\.|vzmh)\)/.test(deger)) sorun.push(`${ad}: (s.a.s.) karşılığı yok`);
  }
  assert.deepEqual(sorun, []);
});

test('plan gövdesi: çevirici düşüş zinciri doğru dili bildirir (çevrilmemiş paragraf Türkçe kalır)', () => {
  const k = Object.keys(plan.en)[0];
  const yok = 'Bu paragraf bindirmede yok.';
  for (const d of DILLER) {
    const c = cevirici(d, { bindirme: { plan: plan[d] } });
    assert.deepEqual(c.govde(k), { m: plan[d][k], d });
    assert.deepEqual(c.govde(yok), { m: yok, d: 'tr' });
  }
  assert.deepEqual(cevirici('tr', { bindirme: { plan: plan.en } }).govde(k), { m: k, d: 'tr' });
});

test('plan gövdesi: kapsam bilgisi (bilgi amaçlı, eksik başarısızlık sayılmaz)', () => {
  const t = Object.keys(plan.en).length;
  console.log(`# yıllık plan gövdesi: ${t}/${paragraflar.length} tekil paragraf çevrilmiş (en, nl, de, fr her biri); kalan Türkçe, lang="tr" ve etiketsiz`);
});
