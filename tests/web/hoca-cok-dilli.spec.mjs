import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { mektepAc } from './helpers/mektep.mjs';

/* Hoca ekranı arayüz dilleri (12 Kasım 2026) — çok dilli davranış sınamaları (Türkçenin değişmediği: hoca-dil.spec.mjs).
   Dil seçimi cihaza özeldir (localStorage 'hocaDil'); burada her sınama dili sayfa yüklenmeden önce tohumlar. */

const DILLER = ['fr', 'en', 'nl', 'de'];
const gun = '2026-09-19';
const katalog = JSON.parse(readFileSync('src/data/ders-defteri-2026-2027.json', 'utf8'));
const dersGunu = katalog.find((x) => x.id === '2026-09-12_1');
const defterYol = 'dersDefteri/TEST-1/kayitlar';
const ogrenciler = [
  { ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe', veliler: ['veli@example.test'] },
  { ref: 'TEST-2', ad: 'İkinci', soyad: 'Örnek', veliler: ['veli2@example.test'] },
];
const kayitlar = () => ({
  aileler: [{ id: 'veli@example.test', eposta: 'veli@example.test', ogrenciler: ['TEST-1'], dil: 'tr', adSoyad: 'Örnek Veli', sifreVar: true }],
  bildirimler: [{ id: 'b1', ref: 'TEST-1', tur: 'soru', tarih: gun, metin: 'Örnek soru', okundu: false, eposta: 'veli@example.test', zaman: '2026-09-12T08:00:00Z' }],
  duyurular: [{ id: 'd1', baslik: 'Örnek duyuru', metin: 'Örnek duyuru metni.', tarih: '2026-09-10', zaman: '2026-09-10T08:00:00Z' }],
});

async function ac(page, context, dil, secenek = {}) {
  // Tohum yalnız bu sekmede ve bu dil için bir kez: dil seçicisinin yeniden yüklemesini ezmez.
  await context.addInitScript((d) => { try { if (!sessionStorage.getItem('__dilTohum_' + d)) { sessionStorage.setItem('__dilTohum_' + d, '1'); localStorage.setItem('hocaDil', d); } } catch {} }, dil);
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: kayitlar(), ...secenek });
  return page.locator('#hoca-ekrani');
}
async function durgun(page) {
  const kok = page.locator('#hoca-ekrani');
  let onceki = '', say = 0;
  for (let i = 0; i < 60 && say < 3; i++) {
    await page.waitForTimeout(120);
    const simdi = await kok.innerHTML();
    say = simdi === onceki ? say + 1 : 0;
    onceki = simdi;
  }
}
const satirlar = async (page) => (await page.locator('#hoca-ekrani').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
async function ekranSatirlari(page, sekme) {
  await page.locator(`[role=tab][data-sekme=${sekme}]`).click();
  await durgun(page);
  return satirlar(page);
}

for (const dil of DILLER) {
  test(`Dil ${dil}: html lang, seçici ve üç ekranın metinleri Türkçeden ayrışır`, async ({ page, context }) => {
    test.setTimeout(90_000);
    // Türkçe başvuru satırları
    const trSayfa = await context.newPage();
    await ac(trSayfa, context, 'tr');
    const tr = {};
    for (const s of ['yoklama', 'defter', 'ogrenci']) tr[s] = await ekranSatirlari(trSayfa, s);
    await trSayfa.close();
    await ac(page, context, dil);
    await expect(page.locator('html')).toHaveAttribute('lang', dil);
    await expect(page.locator('#hoca-dil-sec')).toHaveValue(dil);
    for (const s of ['yoklama', 'defter', 'ogrenci']) {
      const satir = await ekranSatirlari(page, s);
      const ortak = satir.filter((x) => tr[s].includes(x) && /\p{L}{3,}/u.test(x));
      // Ortak kalan satırlar yalnız veri (öğrenci adı, fikstür metni) ya da özel ad olabilir: yarıdan azı.
      expect(ortak.length / Math.max(1, satir.length), `${dil}/${s}: Türkçe kalan satırlar: ${ortak.join(' | ')}`).toBeLessThan(0.4);
    }
  });
}

test('Dil seçici: seçim cihazda saklanır, sayfa yeniden yüklenir, klavyeyle çalışır', async ({ page, context }) => {
  await ac(page, context, 'tr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  const sec = page.locator('#hoca-dil-sec');
  await expect(sec.locator('option')).toHaveCount(5);
  expect(await sec.locator('option').evaluateAll((o) => o.map((x) => x.value))).toEqual(['tr', 'fr', 'en', 'nl', 'de']);
  await sec.focus();
  await expect(sec).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('hocaDil'))).toBe('tr');
  // seçim + yeniden yükleme: sahte sayfa yeniden yüklenince boşalır; saklanan değer ve değişiklik olayı doğrulanır
  const yuklendi = page.waitForEvent('load').catch(() => null);
  await sec.selectOption('de');
  await yuklendi;
  expect(await page.evaluate(() => localStorage.getItem('hocaDil'))).toBe('de');
});

test('Kaydedilen veri arayüz dilinden bağımsız: yoklama ve defter yazımları Türkçe ve Almanca arayüzde birebir aynı', async ({ browser }) => {
  test.setTimeout(120_000);
  const yazilan = {};
  for (const dil of ['tr', 'de']) {
    const context = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.HOCA_PORT || 4401}`, serviceWorkers: 'block' });
    const page = await context.newPage();
    await ac(page, context, dil, { students: ogrenciler });
    // yoklama
    await page.locator('[role=tab][data-sekme=yoklama]').click();
    await page.locator('[data-yoklama-tarih]').selectOption(gun);
    for (const sira of ['1', '2', '3']) await page.locator(`[data-yok="TEST-1"][data-ders="${sira}"][data-durum="var"]`).click();
    await page.locator('[data-yok="TEST-2"][data-ders="1"][data-durum="yok"]').click();
    await page.locator('[data-eylem=yoklamaKaydet]').click();
    await expect.poll(() => page.evaluate(() => (window.__records.yoklama || []).length)).toBeGreaterThan(0);
    // defter: bir kalıp çipi + serbest metin + kaydet
    await page.locator('[role=tab][data-sekme=defter]').click();
    await page.locator('[data-dd-gun]').selectOption(dersGunu.tarih);
    await page.locator('[data-dd-ogr]').selectOption('TEST-1');
    const p = page.locator('[data-ders-defteri]');
    await expect(p.locator('[data-dd-form]')).toBeVisible();
    await p.locator('[name=durum]').selectOption('islendi');
    await p.locator('[data-dd-kalip]').nth(1).click();
    await p.locator('[name=odev]').fill('Sayfa 12–13');
    await p.locator('[value=kaydet]').click();
    await expect.poll(() => page.evaluate((y) => (window.__records[y] || []).length, defterYol)).toBe(1);
    yazilan[dil] = await page.evaluate((y) => JSON.parse(JSON.stringify({ yoklama: window.__records.yoklama, defter: window.__records[y] }), (k, v) => (['zaman', 'guncelleme', 'olusturma'].includes(k) ? undefined : v)), defterYol);
    await context.close();
  }
  expect(yazilan.de.yoklama.length).toBeGreaterThan(0);
  expect(yazilan.de).toEqual(yazilan.tr);
});

for (const dil of ['nl', 'de']) {
  test(`360 px ${dil}: bütün sekmelerde Türkçeden fazla yatay taşma yok`, async ({ browser }) => {
    test.setTimeout(150_000);
    const olc = {};
    for (const d of ['tr', dil]) {
      const context = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.HOCA_PORT || 4401}`, serviceWorkers: 'block', viewport: { width: 360, height: 780 } });
      const page = await context.newPage();
      await ac(page, context, d);
      olc[d] = {};
      for (const s of ['yoklama', 'defter', 'ezber', 'envanter', 'odev', 'kitaplar', 'bildirim', 'ogrenci', 'ilim', 'bulten', 'duyuru', 'aile', 'hesap']) {
        await page.locator(`[role=tab][data-sekme=${s}]`).click();
        await durgun(page);
        olc[d][s] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      }
      await context.close();
    }
    for (const s of Object.keys(olc.tr)) expect(olc[dil][s], `${dil}/${s} taşma ${olc[dil][s]}px, Türkçe ${olc.tr[s]}px`).toBeLessThanOrEqual(Math.max(0, olc.tr[s]) + 1);
  });
}

test('Erişilebilirlik: Almanca arayüz, Türkçede olmayan axe ihlali getirmez (yoklama, defter, öğrenciler, dil seçici)', async ({ page, context }) => {
  test.setTimeout(120_000);
  const ihlal = {};
  for (const dil of ['tr', 'de']) {
    const sayfa = dil === 'tr' ? await context.newPage() : page;
    await ac(sayfa, context, dil);
    ihlal[dil] = new Set();
    for (const s of ['yoklama', 'defter', 'ogrenci']) {
      await sayfa.locator(`[role=tab][data-sekme=${s}]`).click();
      await durgun(sayfa);
      const sonuc = await new AxeBuilder({ page: sayfa }).include('#hoca-ekrani').include('#hoca-dil').analyze();
      for (const v of sonuc.violations) for (const n of v.nodes) ihlal[dil].add(`${s}|${v.id}|${n.target.join(' ')}`);
    }
  }
  const yeni = [...ihlal.de].filter((x) => !ihlal.tr.has(x));
  expect(yeni, 'Almanca arayüzde yeni axe ihlali').toEqual([]);
});
