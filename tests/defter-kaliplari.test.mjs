/** Ders defteri kalıpları — saf metin işlemleri ve kütüphane kapısı (14 Eyl 2026).
 *
 *  Hoca ekranındaki çipler bu işlevlerle metin ekler/çıkarır; hazır kayıt yalnız boş alanı doldurur.
 *  Kalıp metinleri öğrenci adı, e-posta ya da kayıt referansı içeremez (kütüphane geneldir).
 *  Node 24 `.ts` dosyasını doğrudan içe aktarır (tür sıyırma), derleme adımı yok.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ALAN_BICIMI, defterKaliplari, hazirKayitlar, hazirKaydiUygula,
  kalipEkle, kalipCikar, kalipDegistir, kalipVar, sayacaGoreSirala,
} from '../src/lib/defter-kaliplari.ts';

const katalog = JSON.parse(readFileSync(new URL('../src/data/ders-defteri-2026-2027.json', import.meta.url), 'utf8'));
const kuran = katalog.find((d) => d.kod === 'kuran');
const siyer = katalog.find((d) => d.kod === 'siyer');
const sonraki = katalog[katalog.findIndex((d) => d.id === kuran.id) + 1];

test('cümle kalıbı: boş alana aynen, dolu alana cümle sınırında eklenir; ikinci dokunuş geri alır', () => {
  assert.equal(kalipEkle('', 'Derse katılımı güzeldi.'), 'Derse katılımı güzeldi.');
  assert.equal(kalipEkle('Harfleri öğrendik', 'Derse katılımı güzeldi.'), 'Harfleri öğrendik. Derse katılımı güzeldi.');
  assert.equal(kalipEkle('Harfleri öğrendik.', 'Derse katılımı güzeldi.'), 'Harfleri öğrendik. Derse katılımı güzeldi.');
  assert.equal(kalipEkle('Harfleri öğrendik.', 'Harfleri öğrendik.'), 'Harfleri öğrendik.', 'aynı cümle iki kez eklenmez');
  const m = kalipEkle(kalipEkle('Hocanın kendi notu.', 'Derse katılımı güzeldi.'), 'Memnunum, elhamdülillah.');
  assert.equal(kalipCikar(m, 'Derse katılımı güzeldi.'), 'Hocanın kendi notu. Memnunum, elhamdülillah.');
  assert.equal(kalipDegistir(kalipDegistir('', 'A.'), 'A.'), '', 'ekle + çıkar = boş');
  assert.equal(kalipCikar('Serbest metin', 'Yok böyle bir cümle.'), 'Serbest metin');
  assert.equal(kalipVar('Derse katılımı güzeldi. Ek.', 'Derse katılımı güzeldi.'), true);
});

test('madde kalıbı (okunan/dikkat): virgülle birleşir, çıkarınca virgül artığı kalmaz', () => {
  assert.equal(ALAN_BICIMI.dikkat, 'madde');
  const m = kalipEkle(kalipEkle('', 'Mahreç', 'madde'), 'Peltek harfler', 'madde');
  assert.equal(m, 'Mahreç, Peltek harfler');
  assert.equal(kalipCikar(m, 'Mahreç', 'madde'), 'Peltek harfler');
  assert.equal(kalipCikar(m, 'Peltek harfler', 'madde'), 'Mahreç');
});

test('kütüphane: Kur’an dersinde okuma grupları var, siyerde yok; konu ve kaynak kalıplara işlenir; ad/e-posta/referans yok', () => {
  const k = defterKaliplari(kuran, sonraki);
  assert.ok(k.calisma.some((g) => g.ad === 'Okuma'));
  assert.ok(k.odev.some((g) => g.ad === 'Okuma · ezber'));
  assert.ok(k.okunan.length && k.dikkat.length);
  const s = defterKaliplari(siyer, null);
  assert.ok(!s.calisma.some((g) => g.ad === 'Okuma'));
  assert.equal(s.okunan.length, 0);
  assert.ok(k.calisma[0].kaliplar[0].metin.includes(kuran.konu));
  assert.ok(k.odev.at(-1).kaliplar[0].metin.includes(kuran.kaynak));
  assert.ok(k.sonraki[0].kaliplar[0].metin.includes(sonraki.konu));
  const hepsi = Object.values(k).flat().flatMap((g) => g.kaliplar);
  for (const x of hepsi) {
    assert.ok(x.etiket.trim() && x.metin.trim());
    assert.doesNotMatch(x.metin, /UC-\d{4}-\d{4}|@/);
  }
  const metinler = hepsi.map((x) => x.metin);
  assert.equal(new Set(metinler).size, metinler.length, 'kalıp metinleri benzersiz');
});

test('hazır kayıt: durum daima, metinler yalnız boşsa; dolu alan ezilmez ve raporlanır', () => {
  const [iyi, , kismen, ertelendi] = hazirKayitlar(kuran, sonraki);
  const bos = { durum: '', calisma: '', odev: '', sonraki: '' };
  const a = hazirKaydiUygula(bos, iyi);
  assert.equal(a.taslak.durum, 'islendi');
  assert.ok(a.taslak.calisma.includes(kuran.konu) && a.taslak.odev.length);
  assert.deepEqual(a.atlanan, []);
  const dolu = { durum: 'kismen', calisma: 'Hocanın kendi cümlesi.', odev: '', sonraki: '' };
  const b = hazirKaydiUygula(dolu, iyi);
  assert.equal(b.taslak.durum, 'islendi');
  assert.equal(b.taslak.calisma, 'Hocanın kendi cümlesi.');
  assert.ok(b.taslak.odev.length);
  assert.deepEqual(b.atlanan, ['calisma']);
  assert.equal(kismen.durum, 'kismen');
  assert.equal(ertelendi.durum, 'ertelendi');
  assert.ok(ertelendi.aciklama.includes(sonraki.konu));
});

test('kullanım sayacı: çok kullanılan başa gelir, eşitlikte tanım sırası korunur', () => {
  const k = [{ etiket: 'a', metin: 'A.' }, { etiket: 'b', metin: 'B.' }, { etiket: 'c', metin: 'C.' }];
  assert.deepEqual(sayacaGoreSirala(k, {}).map((x) => x.etiket), ['a', 'b', 'c']);
  assert.deepEqual(sayacaGoreSirala(k, { 'C.': 3, 'B.': 3 }).map((x) => x.etiket), ['b', 'c', 'a']);
});
