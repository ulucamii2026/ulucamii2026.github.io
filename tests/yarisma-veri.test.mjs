/**
 * Bilgi Yarışması soru bankası denetimi (10 Kasım 2026): eski `dogrula.py`'nin node:test karşılığı. src/data/yarisma/sorular.json beş dilde
 * eksiksiz mi, her sınav sorusu kartındaki mini soruyla BİREBİR mi (yeni dinî bilgi yok), her kaynak kimliği depoda var mı, biçim
 * kuralları tutuyor mu. Banka scripts/yarisma-uret.mjs ile üretilir; elle düzenlenmez (bu test sapmayı yakalar).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const modul = async (ad, giris) => {
  const cikti = resolve(`node_modules/.cache/yarisma-veri-${ad}-test.mjs`);
  await build({ entryPoints: [giris], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
};
const t = await modul('tur-v', 'src/lib/yarisma/tur.ts');
const v = await modul('veri', 'src/lib/yarisma/veri.ts');

const oku = (yol) => JSON.parse(readFileSync(new URL(`../${yol}`, import.meta.url), 'utf8'));
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const BICIMLER = { quiz: 'q', siralama: 's', gruplama: 'g', eslestirme: 'e', gizemli: 'm' };
const KONULAR = ['itikat', 'ibadet', 'siyer', 'ahlak', 'kuran'];
const KOTU = /undefined|\bnull\b|TODO|lorem|\{\{|\}\}/i;
const KALP = /[❤♥❣\u{1F493}-\u{1F49F}\u{1F90D}\u{1F90E}\u{1F9E1}\u{1FA75}-\u{1FA77}]/u;

const banka = oku('src/data/yarisma/sorular.json');
const sorular = banka.sorular;

const kimlikler = new Set();
const kartSoru = new Map();
for (const f of readdirSync(new URL('../src/data/ilim-yolu/kartlar/', import.meta.url))) {
  for (const k of oku(`src/data/ilim-yolu/kartlar/${f}`).kartlar) {
    kimlikler.add(k.id);
    for (const q of k.sorular) { kimlikler.add(q.id); kartSoru.set(q.id, q); }
  }
}
for (const dosya of ['abdest', 'namaz']) {
  const d = oku(`src/data/ibadet/${dosya}.json`);
  for (const a of d.adimlar) kimlikler.add(a.id);
  for (const r of d.rekatKurallari ?? []) kimlikler.add(r.id);
  for (const v of d.vakitler ?? []) kimlikler.add(`namaz:vakit:${v.id}`);
  if (d.vitir) kimlikler.add('namaz:vitir');
}

function metinTamam(m, yer, hatalar) {
  if (!m || typeof m !== 'object' || JSON.stringify(Object.keys(m).sort()) !== JSON.stringify([...DILLER].sort())) { hatalar.push(`${yer}: beş dilli nesne değil`); return; }
  for (const d of DILLER) {
    const v = m[d];
    if (typeof v !== 'string' || !v.trim()) hatalar.push(`${yer}.${d} boş`);
    else if (KOTU.test(v)) hatalar.push(`${yer}.${d} şüpheli sözcük`);
    else if (KALP.test(v)) hatalar.push(`${yer}.${d} kalp simgesi`);
    else if (v !== v.trim()) hatalar.push(`${yer}.${d} baş/son boşluk`);
  }
}
function tekil(liste, yer, hatalar) {
  for (const d of DILLER) {
    const v = liste.map((x) => (x?.[d] ?? '').trim().toLowerCase());
    if (new Set(v).size !== v.length) hatalar.push(`${yer}: ${d} yinelenen metin`);
  }
}

test('banka kökü: beş dil, 158 öğe, benzersiz kimlik, kimlik öneki biçimle uyumlu', () => {
  assert.deepEqual(banka.diller, DILLER);
  assert.ok(sorular.length >= 150);
  assert.equal(new Set(sorular.map((s) => s.id)).size, sorular.length);
  for (const s of sorular) {
    assert.match(s.id, /^yar-[qsegm]-\d{3}$/);
    assert.ok(BICIMLER[s.format], `${s.id} biçim`);
    assert.ok(s.id.startsWith(`yar-${BICIMLER[s.format]}-`), `${s.id} önek`);
    assert.ok(KONULAR.includes(s.topic), `${s.id} konu`);
    assert.ok([1, 2, 3].includes(s.level), `${s.id} seviye`);
    assert.ok(Array.isArray(s.kaynak) && s.kaynak.length, `${s.id} kaynak`);
    for (const k of s.kaynak) assert.ok(kimlikler.has(k), `${s.id}: kaynak kimliği depoda yok: ${k}`);
  }
  for (const b of Object.keys(BICIMLER)) assert.ok(sorular.some((s) => s.format === b), `${b} biçiminde soru yok`);
});

test('her biçimin kuralları: şık/öğe/çift sayıları, tek doğru, tekil metinler, beş dilde eksiksiz', () => {
  const h = [];
  for (const s of sorular) {
    const i = s.id;
    if (s.format === 'quiz') {
      metinTamam(s.soru, `${i}.soru`, h);
      if (!(s.secenekler.length >= 3 && s.secenekler.length <= 4)) h.push(`${i}: şık sayısı`);
      s.secenekler.forEach((x, n) => metinTamam(x, `${i}.secenekler[${n}]`, h));
      tekil(s.secenekler, i, h);
      if (!Number.isInteger(s.dogru) || s.dogru < 0 || s.dogru >= s.secenekler.length) h.push(`${i}: dogru`);
      const qid = s.kaynak.find((k) => kartSoru.has(k));
      if (!qid) { h.push(`${i}: kaynakta soru kimliği yok`); continue; }
      const q = kartSoru.get(qid);
      if (q.dogru !== s.dogru || q.siklar.length !== s.secenekler.length) h.push(`${i}: şıklar/doğru karttan farklı`);
      for (const d of DILLER) {
        if (s.soru[d] !== q.soru[d]) h.push(`${i}: soru ${d} karttan farklı (${qid})`);
        s.secenekler.forEach((x, n) => { if (x[d] !== q.siklar[n]?.[d]) h.push(`${i}: şık ${n} ${d} karttan farklı (${qid})`); });
      }
    } else if (s.format === 'siralama') {
      metinTamam(s.baslik, `${i}.baslik`, h);
      if (!(s.ogeler.length >= 3 && s.ogeler.length <= 6)) h.push(`${i}: öge sayısı`);
      s.ogeler.forEach((x, n) => metinTamam(x, `${i}.ogeler[${n}]`, h));
      tekil(s.ogeler, i, h);
    } else if (s.format === 'gruplama') {
      metinTamam(s.baslik, `${i}.baslik`, h);
      if (s.gruplar.length !== 2) h.push(`${i}: iki grup`);
      s.gruplar.forEach((x, n) => metinTamam(x, `${i}.gruplar[${n}]`, h));
      tekil(s.gruplar, i, h);
      if (!(s.ogeler.length >= 4 && s.ogeler.length <= 8)) h.push(`${i}: öge sayısı`);
      const say = [0, 0];
      s.ogeler.forEach((x, n) => { metinTamam(x.metin, `${i}.ogeler[${n}]`, h); if (x.grup === 0 || x.grup === 1) say[x.grup]++; else h.push(`${i}: grup ${x.grup}`); });
      if (Math.min(...say) < 2) h.push(`${i}: her grupta en az 2 öğe: ${say}`);
      tekil(s.ogeler.map((x) => x.metin), i, h);
    } else if (s.format === 'eslestirme') {
      metinTamam(s.baslik, `${i}.baslik`, h);
      if (!(s.ciftler.length >= 3 && s.ciftler.length <= 5)) h.push(`${i}: çift sayısı`);
      s.ciftler.forEach((c, n) => { metinTamam(c.sol, `${i}.ciftler[${n}].sol`, h); metinTamam(c.sag, `${i}.ciftler[${n}].sag`, h); });
      tekil(s.ciftler.map((c) => c.sol), i, h);
      tekil(s.ciftler.map((c) => c.sag), i, h);
    } else {
      metinTamam(s.baslik, `${i}.baslik`, h);
      if (!(s.ipuclari.length >= 3 && s.ipuclari.length <= 4)) h.push(`${i}: ipucu sayısı`);
      s.ipuclari.forEach((x, n) => metinTamam(x, `${i}.ipuclari[${n}]`, h));
      if (!(s.secenekler.length >= 3 && s.secenekler.length <= 4)) h.push(`${i}: şık sayısı`);
      s.secenekler.forEach((x, n) => metinTamam(x, `${i}.secenekler[${n}]`, h));
      tekil(s.secenekler, i, h);
      if (!Number.isInteger(s.dogru) || s.dogru < 0 || s.dogru >= s.secenekler.length) h.push(`${i}: dogru`);
    }
  }
  assert.deepEqual(h, []);
});

test('hassas gizemli kutular bankada var ve varsayılan havuzdan hariç tutulur', () => {
  for (const id of ['yar-m-004', 'yar-m-022']) {
    assert.ok(sorular.some((s) => s.id === id), id + ' bankada yok');
    assert.ok(v.HASSAS.has(id));
  }
  const ayar = { bicim: 'gizemli', konular: v.KONULAR, seviye: '1-2', adet: 15, tohum: 'x' };
  for (const sev of ['1', '1-2', '2-3']) {
    assert.equal(t.havuz(v.SORULAR, { ...ayar, seviye: sev }).some((s) => v.HASSAS.has(s.id)), false, 'seviye ' + sev);
    assert.equal(t.turDagit(v.SORULAR, { ...ayar, seviye: sev, bicim: 'karisik' }).some((s) => v.HASSAS.has(s.id)), false);
  }
  assert.ok(t.havuz(v.SORULAR, { ...ayar, seviye: '1-2' }, true).some((s) => v.HASSAS.has(s.id)) || t.havuz(v.SORULAR, { ...ayar, seviye: '2-3' }, true).some((s) => v.HASSAS.has(s.id)), 'dahil edilince geri gelir');
});
