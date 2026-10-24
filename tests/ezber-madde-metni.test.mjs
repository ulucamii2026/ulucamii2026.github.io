/**
 * Ezber madde metinleri (Faz 2b, 19 Eki 2026) — kaynak bütünlüğü. Neden: madde sayfası, gizleme ve oyunlar Kur'an
 * metnini bu dosyalardan alır. Tek harflik bir çekim hatası ezberi yanlış öğretir, meâl grubundaki bir boşluk ise bir
 * âyeti anlamsız bırakır. Diyanet'ten gelen kısım elle düzenlenmez: `ozet` bunu bekler.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Validator } from '@cfworker/json-schema';
import { iskelet, katalogAyetleri, ozet } from '../scripts/ezber-iskelet.mjs';
import { DUALAR, duaOzeti } from '../scripts/ezber-dua-tanim.mjs';
import { bolumIskeleti } from '../scripts/ezber-dua-iskelet.mjs';

const json = (yol) => JSON.parse(readFileSync(yol, 'utf8'));
mkdirSync('node_modules/.cache', { recursive: true });
const modul = resolve('node_modules/.cache/ezber-madde-metni-test.mjs');
await build({ entryPoints: ['src/lib/ezber/madde-metni.ts'], outfile: modul, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const mm = await import(pathToFileURL(modul).href);
const KLASOR = 'src/data/ezber/metin';
const katalog = json('src/data/ezber/katalog.json');
const sema = new Validator(json(`${KLASOR}/metin.schema.json`), '7', false);
const tanzil = json('tests/fixtures/ezber-tanzil-iskelet.json');
const duaKaynagi = json('tests/fixtures/ezber-dua-ikinci-kaynak.json');
const font = new Set(json('egitim/public/fonts/ulu-nesih.json').kume.map((u) => Number.parseInt(u.slice(2), 16)));
const dosyalar = readdirSync(KLASOR).filter((d) => /^[sdb]-.*\.json$/.test(d));
const metinler = new Map(dosyalar.map((d) => [d.slice(0, -5), json(`${KLASOR}/${d}`)]));
const kuranMaddeleri = katalog.ogeler.filter((o) => o.kuran);
// Arapça blokları + Arapça Genişletilmiş-C (U+10EFD–10EFF: Diyanet'in «ulâike»deki kasr işareti) + boşluk/ZWNJ/ZWJ.
const ARAPCA = /^[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\u{10EC0}-\u{10EFF}  ‌‍]+$/u;

test('Her metin dosyası şemaya uyar ve katalogdaki bir maddeye aittir', () => {
  assert.ok(dosyalar.length > 0);
  for (const [id, m] of metinler) {
    const r = sema.validate(m);
    assert.ok(r.valid, `${id}: ${JSON.stringify(r.errors.slice(0, 3))}`);
    assert.equal(m.id, id);
    assert.ok(katalog.ogeler.some((o) => o.id === id), `${id} katalogda yok`);
  }
});

test('Her Kur\'an maddesinin metni var; âyetler katalogdaki aralıkla bire bir', () => {
  for (const o of kuranMaddeleri) {
    const m = metinler.get(o.id);
    assert.ok(m, `${o.id}: metin dosyası yok`);
    assert.deepEqual(m.kuran, o.kuran, o.id);
    const [a, b] = o.kuran.ayetler;
    assert.deepEqual(m.bolumler.map((x) => x.no), Array.from({ length: b - a + 1 }, (_, i) => a + i), o.id);
  }
});

test('Diyanet\'ten gelen kısım elle değişmemiş (özet), Arapça alanda Arapça dışı harf yok', () => {
  for (const [id, m] of metinler) {
    if (m.kuran) {
      // Özet yalnız Diyanet API'sinden gelen meâlleri kapsar (tr, en, de); fr/nl başka kaynaktan eklenir.
      const meal = { tr: m.meal.tr, en: m.meal.en, de: m.meal.de };
      const beklenen = createHash('sha256').update(JSON.stringify({ kuran: m.kuran, sureAdi: m.sureAdi, bolumler: m.bolumler, meal })).digest('hex');
      assert.equal(m.ozet, beklenen, `${id}: Diyanet içeriği elle değişmiş; scripts/ezber-metin-cek.mjs ile yeniden çekin`);
    } else {
      assert.equal(m.ozet, duaOzeti(m), `${id}: dua metni elle değişmiş; scripts/ezber-dua-tanim.mjs'i düzeltip scripts/ezber-dua-cek.mjs'i çalıştırın`);
    }
    for (const b of m.bolumler) assert.match(b.ar, ARAPCA, `${id}/${b.no}`);
  }
});

test('Harf iskeleti Tanzil Uthmani ile aynı; bilinen imlâ farkları gerekçeli ve sabit', () => {
  const ayetler = katalogAyetleri(katalog);
  assert.deepEqual(Object.keys(tanzil.ayetler).sort(), [...ayetler.keys()].sort(), 'fikstür katalogla aynı âyetleri kapsamalı');
  for (const [k, kimlikler] of ayetler) {
    const [s, a] = k.split(':').map(Number);
    const m = metinler.get(kimlikler[0]);
    const ar = m.bolumler.find((b) => b.no === a).ar;
    for (const id of kimlikler.slice(1)) assert.equal(metinler.get(id).bolumler.find((b) => b.no === a).ar, ar, `${id} ile ${kimlikler[0]} ${k}'de ayrışıyor`);
    const d = iskelet(ar);
    if (ozet(d) === tanzil.ayetler[k]) { assert.ok(!tanzil.farklar[k], `${k}: fark kaydı artık gereksiz`); continue; }
    const fark = tanzil.farklar[k];
    assert.ok(fark, `${s}:${a} iskeleti Tanzil'den farklı: ${d}`);
    assert.equal(fark.diyanet, ozet(d), `${k}: gözden geçirilmiş Diyanet metni değişmiş`);
    assert.ok(fark.neden && fark.neden !== 'GÖZDEN GEÇİR', `${k}: farkın gerekçesi yazılmamış`);
  }
});

test('Dua metinlerinin harf iskeleti ikinci Diyanet kaynağıyla aynı; bilinen farklar gerekçeli ve sabit', () => {
  const duaIdleri = [...metinler].filter(([, m]) => !m.kuran).map(([id]) => id);
  assert.ok(duaIdleri.length >= 11, 'dua metinleri üretilmemiş (scripts/ezber-dua-cek.mjs)');
  for (const id of duaIdleri) {
    const m = metinler.get(id);
    // Portal kayıtları namaz.diyanet.gov.tr'den; kitaptan alınan dualar (ezber-dua-tanim.mjs, `kitap`) kendi Diyanet adresiyle.
    if (DUALAR[id]?.kitap) assert.ok(m.kaynak.url === DUALAR[id].url && /^https:\/\/(kuran|diniyayinlar|dijital)\.diyanet\.gov\.tr\//.test(m.kaynak.url), `${id}: kitap kaynaklı dua kendi Diyanet adresini taşımalı`);
    else assert.ok(m.kaynak.url.startsWith('https://namaz.diyanet.gov.tr/'), id);
    assert.deepEqual(m.bolumler.map((b) => b.no), m.bolumler.map((_, i) => i + 1), `${id}: bölüm numaraları 1'den ardışık olmalı`);
    // Bir bölümü birden çok ikinci kaynak doğrulayabilir; her bölüm en az bir kayıtta bulunmalı.
    const kapsanan = [...new Set(duaKaynagi.kayitlar.filter((k) => k.id === id).flatMap((k) => k.bolumler))].sort((a, b) => a - b);
    assert.deepEqual(kapsanan, m.bolumler.map((b) => b.no), `${id}: ikinci kaynak karşılaştırması her bölümü kapsamalı`);
    // Kitaptan alınan dua yalnız iki bağımsız Diyanet kaynağında iskelet eşitse yazılır: her bölümü iskeleti AYNI çıkan bir ikinci kaynak doğrulamalı.
    if (DUALAR[id]?.kitap) for (const b of m.bolumler) {
      assert.ok(duaKaynagi.kayitlar.some((k) => k.id === id && k.bolumler.includes(b.no) && !k.fark), `${id}/${b.no}: iskeleti eşit ikinci kaynak yok`);
    }
  }
  for (const k of duaKaynagi.kayitlar) {
    const bizim = ozet(bolumIskeleti(metinler.get(k.id), k.bolumler));
    if (k.fark) {
      assert.notEqual(k.bizim, k.iskelet, `${k.id}: fark kaydı artık gereksiz`);
      assert.equal(bizim, k.bizim, `${k.id} [${k.bolumler}]: gözden geçirilmiş Diyanet metni değişmiş`);
    } else {
      assert.equal(bizim, k.iskelet, `${k.id} [${k.bolumler}]: harf iskeleti ${k.kaynak} ile aynı değil`);
    }
  }
  // Düzeltmeler yalnız Diyanet kaydının kusurunu giderir: harf iskeleti düzeltmeden önce de sonra da aynı kalmalı ya da farkı gerekçelenmeli.
  for (const id of duaIdleri) for (const d of metinler.get(id).duzeltmeler ?? []) {
    assert.ok(d.neden.length > 20, `${id}: düzeltme gerekçesi yazılmamış`);
    assert.ok(metinler.get(id).bolumler.some((b) => b.ar.includes(d.yerine)), `${id}: düzeltme metinde yok (${d.yerine})`);
  }
});

test('Meâl grupları her dilde maddenin bütün âyetlerini boşluksuz ve örtüşmesiz kaplar', () => {
  for (const [id, m] of metinler) {
    const nolar = m.bolumler.map((b) => b.no);
    for (const [dil, meal] of Object.entries(m.meal)) {
      let beklenen = nolar[0];
      for (const g of meal.gruplar) {
        assert.equal(g.ayetler[0], beklenen, `${id}/${dil}: ${beklenen} eksik ya da örtüşme`);
        assert.ok(g.ayetler[1] >= g.ayetler[0], `${id}/${dil}`);
        beklenen = g.ayetler[1] + 1;
      }
      assert.equal(beklenen, nolar.at(-1) + 1, `${id}/${dil}: son âyetlerin meâli yok`);
    }
  }
});

test('Fransızca meâl: Chiadmi (Diyanet) ya da Hamidullah, künyeyle aynı çevirmen; Kur\'an maddelerinin hepsinde; okunuş bölümlerle eşleşir', () => {
  // 24 Eki 2026: Diyanet'in Fransızca meâli dijitalde yok, Hamidullah çevirisi kullanılır (scripts/ezber-meal-fr.mjs).
  const kunye = readFileSync('egitim/src/i18n/madde.ts', 'utf8').match(/kunyeMeal: '(Traduction du sens[^']*)'/)[1];
  const cevirmen = /Chiadmi/.test(kunye) ? /Chiadmi/ : /Hamidullah/;
  for (const [id, m] of metinler) {
    if (m.kuran) assert.ok(m.meal.fr, `${id}: FR meâl yok (node scripts/ezber-meal-fr.mjs)`);
    // Kur'an dışı kitap duasında FR anlam DİTİB'in resmî Fransızca yayınından gelir (Camiye Gidiyorum – Je vais à la mosquée).
    if (m.meal.fr) assert.match(m.meal.fr.kaynak, m.kuran ? cevirmen : /Je vais à la mosquée/, `${id}: FR meâl sayfadaki künyeyle aynı çevirmenden olmalı (${kunye})`);
    for (const [dil, satirlar] of Object.entries(m.okunus ?? {})) {
      assert.deepEqual(satirlar.map((x) => x.no), m.bolumler.map((b) => b.no), `${id}/okunus-${dil}`);
    }
  }
});

test('Âyet sesleri bölümlerle bire bir; Arapça metnin her harfi Ulu Nesih yazı tipinde', () => {
  for (const o of kuranMaddeleri) {
    if (!o.ses?.parcalar) continue;
    const m = metinler.get(o.id);
    assert.deepEqual(o.ses.parcalar, m.bolumler.map((b) => `/media/ses/ayet/${o.kuran.sure}-${b.no}.mp3`), o.id);
    for (const p of o.ses.parcalar) assert.ok(existsSync(`public${p}`), p);
  }
  const eksik = new Set();
  for (const m of metinler.values()) for (const b of m.bolumler) for (const c of b.ar) {
    const k = c.codePointAt(0);
    if (k > 0x20 && k !== 0xA0 && !font.has(k)) eksik.add(`U+${k.toString(16).toUpperCase().padStart(4, '0')}`);
  }
  assert.deepEqual([...eksik], [], 'egitim/scripts/ulu-nesih-uret.py KUME listesine ekleyip yazı tipini yeniden üretin');
});

test('Sayfa blokları: meâl grubuyla; meâlsiz dilde tek blok; FR yalnız Chiadmi, Hamidullah ya da DİTİB’in resmî Fransızcası; okunuş yalnız onaylı usulde', () => {
  const fatiha = metinler.get('s-fatiha');
  assert.deepEqual(mm.metinBloklari(fatiha, 'tr').map((b) => b.ayetler), [[1, 1], [2, 4], [5, 5], [6, 7]]);
  assert.equal(mm.metinBloklari(fatiha, 'tr')[1].bolumler.length, 3);
  const fr = mm.metinBloklari(fatiha, 'fr');
  assert.deepEqual(fr.map((b) => [b.ayetler, b.bolumler.length, 'meal' in b]), Array.from({ length: 7 }, (_, i) => [[i + 1, i + 1], 1, true]));
  assert.equal(fr[0].meal, 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux.');
  const meâlsiz = { ...fatiha, meal: { tr: fatiha.meal.tr } };
  assert.deepEqual(mm.metinBloklari(meâlsiz, 'fr').map((b) => [b.ayetler, b.bolumler.length, 'meal' in b]), [[[1, 7], 7, false]]);
  const sahteFr = { ...fatiha, meal: { ...fatiha.meal, fr: { kaynak: 'Başka bir çeviri', gruplar: fatiha.meal.tr.gruplar } } };
  assert.equal(mm.sayfaMeali(sahteFr, 'fr'), undefined, 'Chiadmi ya da Hamidullah dışı FR meâl gösterilmez');
  // DİTİB'in resmî Fransızca yayını (Camiye Gidiyorum – Je vais à la mosquée) kabul edilir; çeviri adı künyede kalır.
  const tevhid = metinler.get('d-kelime-i-tevhid');
  assert.match(tevhid.meal.fr.kaynak, /Je vais à la mosquée/);
  assert.equal(mm.sayfaMeali(tevhid, 'fr'), tevhid.meal.fr);
  assert.equal(mm.sayfaMeali({ ...tevhid, meal: { ...tevhid.meal, fr: { ...tevhid.meal.fr, kaynak: 'Çalışma çevirisi' } } }, 'fr'), undefined, 'resmî olmayan FR çeviri gösterilmez');
  const okunus = { tr: fatiha.bolumler.map((b) => ({ no: b.no, metin: `okunuş ${b.no}` })) };
  assert.equal(mm.onayliOkunus({ ...fatiha, okunus, onay: null }, 'tr'), undefined);
  assert.equal(mm.onayliOkunus({ ...fatiha, okunus, onay: { tarih: '2026-10-19', kapsam: ['okunus-fr'] } }, 'tr'), undefined);
  const onayli = { ...fatiha, okunus, onay: { tarih: '2026-10-19', kapsam: ['okunus-tr'] } };
  assert.deepEqual(mm.metinBloklari(onayli, 'tr')[1].okunus.map((o) => o.no), [2, 3, 4]);
  assert.equal(mm.metinBloklari(onayli, 'fr')[0].okunus, undefined, 'FR sayfası FR usulünün onayını ister');
  // Dualar: meâlsiz dilde de her bölüm ayrı blok (Kur'an'daki kesintisiz akış duada ezber sınırlarını silerdi).
  const salli = metinler.get('d-salli');
  assert.deepEqual(mm.metinBloklari(salli, 'fr').map((b) => b.ayetler), [[1, 1], [2, 2], [3, 3]]);
  assert.ok(!('meal' in mm.metinBloklari(salli, 'fr')[0]));
  assert.equal(mm.metinBloklari(salli, 'tr')[1].meal, 'İbrahim’e ve İbrahim’in ümmetine rahmet ettiğin gibi.');
  assert.equal(mm.arapcaRakam(40), '٤٠');
  assert.equal(mm.aralikYaz([2, 4]), '2–4');
  assert.deepEqual(mm.sonKelimeyiAyir('ثُمَّ كَلَّا سَيَعْلَمُونَ '), ['ثُمَّ كَلَّا ', 'سَيَعْلَمُونَ']);
  assert.deepEqual(mm.sonKelimeyiAyir('مُدْهَٓامَّتَانِ'), ['', 'مُدْهَٓامَّتَانِ']);
});
