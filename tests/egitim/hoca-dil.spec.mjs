import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { mektepAc } from './helpers/mektep.mjs';

/* Hoca ekranı arayüz dilleri (12 Kasım 2026).
   1) Türkçe DEĞİŞMEDİ kanıtı: bütün sekmelerin ve giriş ekranının çizdiği HTML, i18n öncesinde (tr.json) alınan altın kayıtla
      BİREBİR aynıdır (dil seçicisi #hoca-ekrani'nın dışında durur). Altın kaydı yeniden üretmek: HOCA_ALTIN_YAZ=1.
   2) Dil değişince en az üç ekranda metinler değişir; kaydedilen veri dilden bağımsızdır; 360 px'te yatay taşma yok. */

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SEKMELER = ['yoklama', 'defter', 'ezber', 'envanter', 'odev', 'kitaplar', 'bildirim', 'ogrenci', 'ilim', 'bulten', 'duyuru', 'aile', 'hesap'];
const ALTIN = 'tests/egitim/hoca-dil-altin/tr.json';
const gun = '2026-09-13';
const ogrenciler = [
  { ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe', veliler: ['veli@example.test'] },
  { ref: 'TEST-2', ad: 'İkinci', soyad: 'Örnek', veliler: ['veli2@example.test'], dil: 'fr' },
];
const kayitlar = () => ({
  aileler: [
    { id: 'veli@example.test', eposta: 'veli@example.test', ogrenciler: ['TEST-1'], dil: 'tr', adSoyad: 'Örnek Veli', sifreVar: true },
    { id: 'veli2@example.test', eposta: 'veli2@example.test', ogrenciler: ['TEST-2'], dil: 'fr', adSoyad: 'Veli İki' },
  ],
  bildirimler: [
    { id: 'b1', ref: 'TEST-1', tur: 'soru', tarih: gun, metin: 'Örnek soru', okundu: false, eposta: 'veli@example.test', zaman: '2026-09-12T08:00:00Z' },
    { id: 'b2', ref: 'TEST-2', tur: 'mazeret', tarih: gun, metin: 'Hasta', okundu: false, eposta: 'veli2@example.test', zaman: '2026-09-12T09:00:00Z' },
  ],
  duyurular: [{ id: 'd1', baslik: 'Örnek duyuru', metin: 'Örnek duyuru metni.', tarih: '2026-09-10', zaman: '2026-09-10T08:00:00Z' }],
  notlar: [{ id: 'n1', ref: 'TEST-1', metin: 'Örnek not.', tarih: '2026-09-12', zaman: '2026-09-12T08:00:00Z' }],
  yoklama: [{ id: `TEST-1_${gun}`, ref: 'TEST-1', tarih: gun, dersler: { 1: 'var' }, not: '' }],
});

/** Sekmeyi açar, çizim durulana (HTML üç ardışık okumada aynı) kadar bekler ve #hoca-ekrani HTML'ini döndürür. */
async function durgun(page) {
  const kok = page.locator('#hoca-ekrani');
  let onceki = '', say = 0;
  for (let i = 0; i < 60 && say < 3; i++) {
    await page.waitForTimeout(120);
    const simdi = await kok.innerHTML();
    say = simdi === onceki ? say + 1 : 0;
    onceki = simdi;
  }
  return onceki;
}
async function girisEkrani(page, context) {
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {} });
  return { giris: await durgun(page) };
}
async function sekmeler(page, context) {
  const cikti = {};
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: kayitlar() });
  for (const s of SEKMELER) {
    await page.locator(`[role=tab][data-sekme=${s}]`).click();
    cikti[s] = await durgun(page);
  }
  return cikti;
}
function altinKarsilastir(sonuc) {
  if (process.env.HOCA_ALTIN_YAZ) {
    mkdirSync('tests/egitim/hoca-dil-altin', { recursive: true });
    const mevcut = existsSync(ALTIN) ? JSON.parse(readFileSync(ALTIN, 'utf8')) : {};
    writeFileSync(ALTIN, JSON.stringify({ ...mevcut, ...sonuc }, null, 1), 'utf8');
    return;
  }
  expect(existsSync(ALTIN)).toBe(true);
  const altin = JSON.parse(readFileSync(ALTIN, 'utf8'));
  const port = (s) => s.replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:PORT'); // sunucu portu (yerel koşuya göre değişir)
  for (const k of Object.keys(sonuc)) expect(port(sonuc[k]), `ekran: ${k}`).toBe(port(altin[k]));
}

test('Türkçe varsayılan: giriş ekranı altın kayıtla birebir aynı', async ({ page, context }) => {
  altinKarsilastir(await girisEkrani(page, context));
});

test('Türkçe varsayılan: 13 sekme altın kayıtla birebir aynı', async ({ page, context }) => {
  test.setTimeout(120_000);
  altinKarsilastir(await sekmeler(page, context));
});
