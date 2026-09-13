/** Ders günlüğü sayfasının veri kapısı (13 Eyl 2026).
 *
 *  Sayfa (src/sayfalar/KursGunlugu.astro) üç dosyayı çaprazlar: ders defteri, konu sözlükleri
 *  ve haftalık ilerleme özeti. Bu üçü elle yazılmaz; biri kaydığında sayfa sessizce yanlış
 *  başlık, boş çeviri ya da sahipsiz bir ders kimliği gösterir. Ayrıca ilerleme dosyası
 *  SINIF düzeyindedir: içinde öğrenci referansı ya da e-posta bulunmamalıdır.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const oku = (ad) => JSON.parse(readFileSync(new URL('../src/data/' + ad, import.meta.url), 'utf8'));
const defter = oku('ders-defteri-2026-2027.json');
const konularFr = oku('konular-fr.json');
const konularEn = oku('konular-en.json');
const ilerleme = oku('ders-ilerleme.json');
const plan = oku('yillik-plan-2026-2027.json');

const DURUMLAR = new Set(['islendi', 'kismen', 'ertelendi']);
const dersGunleri = plan.gunler.filter((g) => g.dersler.length > 0);
const dersGunTarihleri = new Set(dersGunleri.map((g) => g.tarih));

test('her konunun Fransızca ve İngilizce başlığı var', () => {
  const eksik = [];
  for (const d of defter) {
    if (!konularFr[d.konu] || !String(konularFr[d.konu]).trim()) eksik.push(`fr: ${d.konu}`);
    if (!konularEn[d.konu] || !String(konularEn[d.konu]).trim()) eksik.push(`en: ${d.konu}`);
  }
  assert.deepEqual(eksik, [], 'çevirisi olmayan konu başlıkları');
});

test('ders defteri kimlikleri tekil ve yıllık planla uyumlu', () => {
  const kimlikler = new Set();
  for (const d of defter) {
    assert.equal(d.id, `${d.tarih}_${d.sira}`, 'id tarih_sira kalıbında değil');
    assert.ok(!kimlikler.has(d.id), `yinelenen ders kimliği: ${d.id}`);
    kimlikler.add(d.id);
    assert.ok(dersGunTarihleri.has(d.tarih), `yıllık planda olmayan ders günü: ${d.tarih}`);
  }
});

test('ilerleme dosyası: ders kimlikleri, durumlar ve hafta anahtarları geçerli', () => {
  const kimlikler = new Set(defter.map((d) => d.id));
  for (const [id, kayit] of Object.entries(ilerleme.dersler)) {
    assert.ok(kimlikler.has(id), `ders defterinde olmayan kimlik: ${id}`);
    assert.ok(DURUMLAR.has(kayit.durum), `bilinmeyen durum: ${id} → ${kayit.durum}`);
  }
  for (const [anahtar, hafta] of Object.entries(ilerleme.haftalar)) {
    assert.match(anahtar, /^\d{4}-\d{2}-\d{2}$/, `hafta anahtarı tarih değil: ${anahtar}`);
    assert.equal(new Date(anahtar + 'T12:00:00Z').getUTCDay(), 6, `hafta anahtarı Cumartesi değil: ${anahtar}`);
    assert.ok(dersGunTarihleri.has(anahtar), `hafta anahtarı ders günü değil: ${anahtar}`);
    const gun = dersGunleri.find((g) => g.tarih === anahtar);
    assert.equal(hafta.hafta, gun.hafta, `hafta numarası yıllık planla uyuşmuyor: ${anahtar}`);
  }
});

test('ilerleme dosyasında kişisel veri yok (referans, e-posta)', () => {
  const ham = readFileSync(new URL('../src/data/ders-ilerleme.json', import.meta.url), 'utf8');
  assert.equal(/UC-\d{4}-\d{4}/.test(ham), false, 'öğrenci referansı sızmış');
  assert.equal(ham.includes('@'), false, 'e-posta adresi sızmış');
});
