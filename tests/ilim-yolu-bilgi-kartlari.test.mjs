/**
 * İlim Yolu Dilim 2 (2 Kasım 2026) — bilgi kartları (src/data/ilim-yolu/kartlar/*.json, tip: src/lib/ilim-yolu/bilgi-kartlari.ts).
 * Her plan konusu tek kartta; beş dil dolu; özet kısa; şıklar geçerli; kart yalnız izinli alanları taşır (kitap metni girmez).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { IZINLI_ALAN, ON_EK, OZET_ENCOK } from '../src/lib/ilim-yolu/bilgi-kartlari.ts';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'src/data/ilim-yolu/kartlar';
const KART_ALANLARI = new Set(['id', 'kod', 'planKonu', 'ilkDers', 'seviyeAlani', 'basamak', 'baslik', 'ozet', 'kitap', 'sorular', 'durum']);
const SORU_ALANLARI = new Set(['id', 'soru', 'siklar', 'dogru', 'kaynak']);

const plan = JSON.parse(readFileSync('src/data/yillik-plan-2026-2027.json', 'utf8'));
const planKonulari = new Map(); // `kod|konu` → ilk gün
for (const gun of plan.gunler) for (const d of gun.dersler ?? []) {
  const k = `${d.kod}|${d.konu}`;
  if (!planKonulari.has(k)) planKonulari.set(k, { ilk: gun.tarih, kaynak: d.kaynak });
}
const dosyalar = existsSync(KOK) ? readdirSync(KOK).filter((a) => a.endsWith('.json')).sort() : [];
const kartlar = dosyalar.flatMap((a) => {
  const v = JSON.parse(readFileSync(`${KOK}/${a}`, 'utf8'));
  assert.equal(`${v.kod}.json`, a, `${a}: dosya adı kod ile aynı olmalı`);
  return v.kartlar.map((k) => ({ ...k, dosyaKod: v.kod }));
});

const metinDolu = (m, yer) => {
  assert.equal(typeof m, 'object', yer);
  assert.deepEqual(Object.keys(m).sort(), [...DILLER].sort(), `${yer}: beş dil`);
  for (const d of DILLER) assert.ok(typeof m[d] === 'string' && m[d].trim().length > 0, `${yer}.${d} boş`);
};
const sikAnahtari = (s) => (s.ar ? `ar:${s.ar}` : `tr:${s.tr?.trim().toLocaleLowerCase('tr')}`);

test('her kart geçerli: kimlik, plan bağı, alan, basamak, beş dil, kısa özet, izinli alanlar', () => {
  const kimlikler = new Set();
  for (const k of kartlar) {
    const yer = k.id ?? '(kimliksiz)';
    for (const a of Object.keys(k)) if (a !== 'dosyaKod') assert.ok(KART_ALANLARI.has(a), `${yer}: izinsiz alan «${a}»`);
    assert.equal(k.kod, k.dosyaKod, `${yer}: kod dosyayla aynı olmalı`);
    assert.match(k.id, new RegExp(`^${ON_EK[k.kod]}-\\d{3}$`), `${yer}: kimlik biçimi`);
    assert.ok(!kimlikler.has(k.id), `${yer}: kimlik tekrar`);
    kimlikler.add(k.id);
    const p = planKonulari.get(`${k.kod}|${k.planKonu}`);
    assert.ok(p, `${yer}: planda yok «${k.planKonu}»`);
    assert.equal(k.ilkDers, p.ilk, `${yer}: ilkDers`);
    assert.ok(IZINLI_ALAN[k.kod].includes(k.seviyeAlani), `${yer}: seviyeAlani ${k.seviyeAlani}`);
    assert.ok([1, 2, 3].includes(k.basamak), `${yer}: basamak`);
    metinDolu(k.baslik, `${yer}.baslik`);
    metinDolu(k.ozet, `${yer}.ozet`);
    for (const d of DILLER) assert.ok(k.ozet[d].length <= OZET_ENCOK, `${yer}.ozet.${d}: ${k.ozet[d].length} > ${OZET_ENCOK}`);
    if (k.kitap !== undefined) assert.equal(k.kitap, p.kaynak, `${yer}: kitap planın kaynak alanıyla aynı olmalı`);
    assert.deepEqual(Object.keys(k.durum).sort(), [...DILLER].sort(), `${yer}: durum beş dil`);
    for (const d of DILLER) assert.ok(['taslak', 'onayli'].includes(k.durum[d]), `${yer}.durum.${d}`);
    assert.ok(Array.isArray(k.sorular), `${yer}: sorular dizi`);
  }
});

test('mini sorular: kimlik, beş dil, 3–4 farklı şık, doğru şık sırası, künye', () => {
  for (const k of kartlar) for (const [i, s] of k.sorular.entries()) {
    const yer = `${k.id}.sorular[${i}]`;
    for (const a of Object.keys(s)) assert.ok(SORU_ALANLARI.has(a), `${yer}: izinsiz alan «${a}»`);
    assert.equal(s.id, `${k.id}-${i + 1}`, `${yer}: kimlik`);
    metinDolu(s.soru, `${yer}.soru`);
    assert.ok(s.siklar.length >= 3 && s.siklar.length <= 4, `${yer}: şık sayısı`);
    for (const [j, sik] of s.siklar.entries()) if (!sik.ar) metinDolu(sik, `${yer}.siklar[${j}]`);
    assert.equal(new Set(s.siklar.map(sikAnahtari)).size, s.siklar.length, `${yer}: şıklar farklı olmalı`);
    assert.ok(Number.isInteger(s.dogru) && s.dogru >= 0 && s.dogru < s.siklar.length, `${yer}: dogru`);
    assert.ok(typeof s.kaynak === 'string' && s.kaynak.trim().length >= 5, `${yer}: künye`);
  }
});

test('kapsam: yazılmış her kod dosyası o koddaki bütün plan konularını tam bir kez kapsar', () => {
  for (const a of dosyalar) {
    const kod = a.replace(/\.json$/, '');
    const beklenen = [...planKonulari.keys()].filter((k) => k.startsWith(`${kod}|`)).sort();
    const olan = kartlar.filter((k) => k.kod === kod).map((k) => `${k.kod}|${k.planKonu}`).sort();
    assert.deepEqual(olan, beklenen, `${a}: eksik/fazla konu`);
  }
});
