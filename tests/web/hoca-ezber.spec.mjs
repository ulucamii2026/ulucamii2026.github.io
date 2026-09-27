import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mektepAc } from './helpers/mektep.mjs';

/* Ezber Kilimi Faz 1c (27 Eyl 2026) — hoca «Ezber» sekmesi. Plan: docs/superpowers/plans/2026-09-27-ezber-kilimi-faz-1c-hoca.md
   İnceleme odakları: (1) bağlantı yokken dokunuş kaybolmaz, (2) yanlış düğme «Geri al» ile iz bırakmadan döner,
   (3) iki telefon aynı maddede: eski ekran çakışma alır, (4) ilerleme kaydı eski `ezber` alanını silmez,
   (5) yoklama boşken «Bugün» boş kalmaz. Sahte tam SDK: tests/web/helpers/mektep.mjs (firestoreTam). */

const students = [
  { ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe' },
  { ref: 'TEST-2', ad: 'İkinci', soyad: 'Örnek' },
  { ref: 'TEST-3', ad: 'Pasif', soyad: 'Öğrenci', durum: 'pasif' },
];
const gun = '2026-09-19'; // sahte planda üç dersli cumartesi
const oge = (basamak, sonrakiKontrol = '', ek = {}) => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 1, ...ek });
const yok = (ref, durum) => ({ id: `${ref}_${gun}`, ref, tarih: gun, dersler: { 1: durum, 2: durum, 3: durum }, not: '' });

async function ezberAc(page, context, { ezber = {}, yoklama = [], records = {}, tarih = `${gun}T09:00:00Z` } = {}) {
  await mektepAc(page, context, {
    hoca: true, students, tarih,
    records: { ...records, yoklama, ezberDurum: Object.entries(ezber).map(([id, ogeler]) => ({ id, ogeler })) },
  });
  await page.locator('[data-sekme=ezber]').click();
  const kok = page.locator('[data-hoca-ezber]');
  await expect(kok.locator('[data-ez-baglanti]')).toContainText('Bütün kayıtlar gönderildi');
  return kok;
}
const durum = (page, ref) => page.evaluate((r) => (window.__records.ezberDurum || []).find((x) => x.id === r)?.ogeler || {}, ref);
const olaylar = (page, ref) => page.evaluate((r) => (window.__records[`ezberDurum/${r}/olaylar`] || []).map(({ zaman, id, ...o }) => o), ref);
const kart = (kok, ref) => kok.locator(`[data-ez-ac="${ref}"]`);

test('Sekme defterden sonra; eski ödev sekmesi «Haftalık ödev»; yoklama yokken bütün aktif öğrenciler (pasif yok)', async ({ page, context }) => {
  const kok = await ezberAc(page, context);
  const sekmeler = await page.locator('[role=tab]').allTextContents();
  const i = sekmeler.findIndex((x) => x.trim() === 'Ezber');
  expect(sekmeler[i - 1].trim()).toBe('Ders Defteri');
  expect(sekmeler[i + 1].trim()).toBe('Haftalık ödev');
  await expect(kok.locator('.ez-bilgi').first()).toContainText('yoklaması henüz işaretlenmedi');
  await expect(kok.locator('[data-ez-ac]')).toHaveCount(2);
  await expect(kart(kok, 'TEST-3')).toHaveCount(0);
  await expect(kart(kok, 'TEST-1')).toContainText('Sıradaki: Eûzü-Besmele');
});

test('Yanlış düğme: «Tam» notlarla yazılır, «Geri al» maddeyi ve olayı iz bırakmadan kaldırır', async ({ page, context }) => {
  const kok = await ezberAc(page, context, { yoklama: [yok('TEST-1', 'var'), yok('TEST-2', 'yok')] });
  await expect(kok.locator('[data-ez-ac]')).toHaveCount(1);
  await expect(kok.locator('.ez-bilgi').first()).toContainText('gelmeyen 1 öğrencinin');
  await kart(kok, 'TEST-1').click();
  await expect(kart(kok, 'TEST-1')).toHaveAttribute('aria-expanded', 'true');
  const panel = kok.locator('[data-ez-dinle="TEST-1"]');
  await expect(panel.locator('.ez-oneri[aria-pressed=true]')).toContainText('Eûzü-Besmele');
  await expect(panel.locator('[data-ez-kalite=tam]')).toContainText('→ Hocaya okudu');
  await expect(panel.locator('[data-ez-kalite=tekrar]')).toContainText('→ Çalışıyor');
  for (const n of ['akici', 'mahrec', 'med']) await panel.locator(`[data-ez-not=${n}]`).click();
  await expect(panel.locator('[data-ez-not=sira]')).toBeDisabled();
  await expect(panel.locator('.ez-not-onizleme')).toContainText('Uzatmalara (med) dikkat edelim.');
  await panel.locator('[data-ez-kalite=tam]').click();
  await expect(panel.locator('.ez-sonuc')).toContainText('Kaydedildi.');
  await expect(panel.locator('.ez-sonuc')).toContainText('Eûzü-Besmele: Tam → Hocaya okudu · sonraki kontrol 26 Eylül');
  await expect(panel.locator('[data-ez-geri]')).toBeFocused();
  await expect(panel.locator('[data-ez-kalite]')).toHaveCount(0); // çift dokunuş aynı maddeyi ikinci kez işlemez
  expect(await durum(page, 'TEST-1')).toMatchObject({ 'd-euzu-besmele': { basamak: 2, kalite: 'tam', notlar: ['akici', 'mahrec', 'med'], sonrakiKontrol: '2026-09-26', surum: 1 } });
  expect(await olaylar(page, 'TEST-1')).toEqual([{ ezber: 'd-euzu-besmele', tur: 'dinleme', kalite: 'tam', notlar: ['akici', 'mahrec', 'med'], basamakOnce: 0, basamakSonra: 2, zorla: false, tarih: gun }]);
  await panel.locator('[data-ez-geri]').click();
  await expect(panel.locator('.ez-sonuc')).toContainText('Geri alındı.');
  expect(await durum(page, 'TEST-1')).toEqual({});
  expect(await olaylar(page, 'TEST-1')).toEqual([]);
  await expect(panel.locator('[data-ez-kalite=tam]')).toBeFocused();
  await expect(page.locator('[data-ez-duyuru]')).toContainText('Geri alındı');
});

test('Kontrol günü: «Tekrar» en eski önce; erken dinleme basamağı değiştirmez, «yine de ilerlet» ilerletir', async ({ page, context }) => {
  const kok = await ezberAc(page, context, {
    ezber: { 'TEST-1': { 's-fatiha': oge(2, '2026-09-12'), 's-ihlas': oge(2, '2026-09-30') }, 'TEST-2': { 's-kevser': oge(3, '2026-09-10') } },
  });
  await expect(kok.locator('[data-ez-gorunum=tekrar] .ez-sayi')).toContainText('2');
  await kok.locator('[data-ez-gorunum=tekrar]').click();
  await expect(kok.locator('[data-ez-ac]')).toHaveCount(2);
  await expect(kok.locator('[data-ez-ac]').first()).toContainText('İkinci Örnek'); // 10 Eylül, 12 Eylül'den eski
  await kart(kok, 'TEST-2').click();
  const p2 = kok.locator('[data-ez-dinle="TEST-2"]');
  await expect(p2.locator('.ez-oneri[aria-pressed=true]')).toContainText('Kevser Sûresi');
  await expect(p2.locator('.ez-madde-durum')).toContainText('Pekişti · kontrol günü 9 gün önce geldi');
  await expect(p2.locator('[data-ez-kalite=tam]')).toContainText('→ Kalıcı');
  await expect(p2.locator('[data-ez-kalite=tekrar]')).toContainText('→ Hocaya okudu');

  await kok.locator('[data-ez-gorunum=bugun]').click();
  await kart(kok, 'TEST-1').click();
  const p1 = kok.locator('[data-ez-dinle="TEST-1"]');
  await p1.locator('[data-ez-baska]').selectOption('s-ihlas');
  await expect(p1.locator('.ez-madde-durum')).toContainText('kontrol 30 Eylül (11 gün sonra)');
  await expect(p1.locator('[data-ez-kalite=tam]')).toContainText('Basamak değişmez');
  await p1.locator('[data-ez-zorla]').check();
  await expect(p1.locator('[data-ez-kalite=tam]')).toContainText('→ Pekişti');
  await p1.locator('[data-ez-kalite=tam]').click();
  await expect(p1.locator('.ez-sonuc')).toContainText('İhlâs Sûresi: Tam → Pekişti · sonraki kontrol 19 Ekim');
  expect((await durum(page, 'TEST-1'))['s-ihlas']).toMatchObject({ basamak: 3, sonrakiKontrol: '2026-10-19', surum: 2 });
  expect((await olaylar(page, 'TEST-1'))[0]).toMatchObject({ ezber: 's-ihlas', zorla: true, basamakOnce: 2, basamakSonra: 3 });
});

test('Bağlantı yokken dokunuş kaybolmaz: ekran hemen güncellenir, rozet bekleyen kaydı söyler, bağlanınca gönderilir', async ({ page, context }) => {
  const kok = await ezberAc(page, context);
  await page.evaluate(() => window.__ezberBaglantiKes());
  await expect(kok.locator('[data-ez-baglanti]')).toContainText('Bağlantı yok · kayıtlar telefonda tutulur');
  await kart(kok, 'TEST-1').click();
  const panel = kok.locator('[data-ez-dinle="TEST-1"]');
  await panel.locator('[data-ez-kalite=az]').click();
  await expect(panel.locator('.ez-sonuc')).toContainText('Telefonda tutuluyor; bağlantı gelince gönderilecek.');
  await expect(kok.locator('[data-ez-baglanti]')).toContainText('Bağlantı yok · 1 kayıt telefonda bekliyor');
  await expect(kart(kok, 'TEST-1')).toContainText('Sıradaki: Kelime-i Tevhid'); // yerel önbellek hemen yansır
  expect((await durum(page, 'TEST-1'))['d-euzu-besmele']).toMatchObject({ basamak: 2, kalite: 'az' });
  await page.evaluate(() => window.__ezberBaglan());
  await expect(kok.locator('[data-ez-baglanti]')).toContainText('Bütün kayıtlar gönderildi');
  await expect(panel.locator('.ez-sonuc')).toContainText('Kaydedildi.');
});

test('İki telefon aynı maddede: eski ekranın yazımı çakışma alır, güncel durum gösterilir, geri alma sunulmaz', async ({ page, context }) => {
  const kok = await ezberAc(page, context, { ezber: { 'TEST-1': { 's-fatiha': oge(2, '2026-09-12', { surum: 3 }) } } });
  await page.evaluate(() => {
    window.__ezberReddet = { kod: 'permission-denied', sunucu: { id: 'TEST-1', ogeler: { 's-fatiha': { basamak: 3, kalite: 'az', notlar: [], sonrakiKontrol: '2026-10-19', surum: 4 } } } };
  });
  await kart(kok, 'TEST-1').click();
  const panel = kok.locator('[data-ez-dinle="TEST-1"]');
  await expect(panel.locator('.ez-oneri[aria-pressed=true]')).toContainText('Fâtiha Sûresi');
  await panel.locator('[data-ez-kalite=tam]').click();
  await expect(panel.locator('.ez-sonuc.hata')).toContainText('başka bir cihazda değişti');
  await expect(panel.locator('.ez-madde-durum')).toContainText('Pekişti · kontrol 19 Ekim');
  await expect(panel.locator('[data-ez-geri]')).toHaveCount(0);
  await expect(panel.locator('[data-ez-kalite=tam]')).toContainText('Basamak değişmez');
  expect(await olaylar(page, 'TEST-1')).toEqual([]);
  await expect(page.locator('[data-ez-duyuru]')).toContainText('başka bir cihazda değişti');
});

test('Tablo: şerit seçici, işaretlerin erişilebilir adı, elle düzeltme «düzeltme» olayı yazar', async ({ page, context }) => {
  const kok = await ezberAc(page, context, {
    ezber: { 'TEST-1': { 'd-euzu-besmele': oge(4), 'd-kelime-i-tevhid': oge(3, '2026-10-19'), 'd-kelime-i-sehadet': oge(2, '2026-09-12') } },
  });
  await kok.locator('[data-ez-gorunum=tablo]').click();
  await kok.locator('[data-ez-serit]').selectOption('1');
  const hucre = (ref, id) => kok.locator(`[data-ez-hucre="${ref}"][data-id="${id}"]`);
  await expect(hucre('TEST-1', 'd-euzu-besmele')).toHaveAttribute('aria-label', 'Örnek Talebe — Eûzü-Besmele: Kalıcı');
  await expect(hucre('TEST-1', 'd-kelime-i-sehadet')).toHaveAttribute('aria-label', /Hocaya okudu, kontrol günü geldi$/);
  await expect(hucre('TEST-2', 'b-imanin-sartlari')).toHaveAttribute('aria-label', /Başlanmadı$/);
  await expect(kok.locator('.ez-tablo tbody tr')).toHaveCount(2);
  await hucre('TEST-2', 'b-imanin-sartlari').click();
  const panel = kok.locator('#ez-tablo-dinle');
  await expect(panel.locator('h3')).toHaveText('İkinci Örnek');
  await expect(panel.locator('.ez-madde-durum')).toContainText('İmanın şartları · Başlanmadı');
  await panel.locator('.ez-elle summary').click();
  await panel.locator('[data-ez-elle-sec]').selectOption('3');
  await panel.locator('[data-ez-elle]').click();
  await expect(panel.locator('.ez-sonuc')).toContainText('İmanın şartları: basamak elle «Pekişti» yapıldı');
  expect((await durum(page, 'TEST-2'))['b-imanin-sartlari']).toMatchObject({ basamak: 3, sonrakiKontrol: '2026-10-19', surum: 1 });
  expect(await olaylar(page, 'TEST-2')).toEqual([{ ezber: 'b-imanin-sartlari', tur: 'duzeltme', kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 3, zorla: false, tarih: gun }]);
  await expect(hucre('TEST-2', 'b-imanin-sartlari')).toHaveAttribute('aria-label', /Pekişti$/);
});

test('Öğrenci kartı: ezber özeti, «Ezber sekmesinde aç»; ilerleme kaydı eski ezber alanını korur; karne yeni kayıttan', async ({ page, context }) => {
  const ilerleme = { id: 'TEST-1', kuranAdim: 0, ezber: { 'Fâtiha Sûresi': 'ogrendi', 'Eski yazım': 'tekrar' }, alanlar: { kuran: 4 }, hocaNotu: 'Önceki not', rozet: '', guncelleme: '2026-09-13' };
  await ezberAc(page, context, {
    ezber: { 'TEST-1': { 's-fatiha': oge(3, '2026-10-19'), 's-ihlas': oge(2, '2026-09-12'), 'd-euzu-besmele': oge(1) } },
    records: { ilerleme: [ilerleme] },
  });
  await page.locator('[data-sekme=ogrenci]').click();
  await page.locator('.ogr-ad[data-ogr="TEST-1"]').click();
  const ozet = page.locator('[data-ogr-ezber]');
  await expect(ozet).toContainText('Çalışıyor 1');
  await expect(ozet).toContainText('Hocaya okudu 1');
  await expect(ozet).toContainText('Pekişti 1');
  await expect(ozet).toContainText('Kalıcı 0');
  await expect(ozet).toContainText('1 maddenin kontrol günü geldi');
  await expect(page.locator('form[data-form=ilerleme] select[name^="ezber:"]')).toHaveCount(0);
  await page.locator('form[data-form=ilerleme] [name=hocaNotu]').fill('Yeni not');
  await page.locator('form[data-form=ilerleme] [type=submit]').click();
  await expect(page.locator('form[data-form=ilerleme] [data-mesaj]')).toContainText('İlerleme kaydedildi.');
  const kayit = await page.evaluate(() => window.__records.ilerleme.find((x) => x.id === 'TEST-1'));
  expect(kayit.ezber).toEqual({ 'Fâtiha Sûresi': 'ogrendi', 'Eski yazım': 'tekrar' });
  expect(kayit.hocaNotu).toBe('Yeni not');
  await page.evaluate(() => { window.__pano = ''; navigator.clipboard.writeText = async (t) => { window.__pano = t; }; });
  await page.locator('[data-eylem=whatsappKarneKopyala]').click();
  const pano = await page.evaluate(() => window.__pano);
  expect(pano).toContain('Fâtiha Sûresi (Pekişti), İhlâs Sûresi (Hocaya okudu)');
  expect(pano).not.toContain('Eûzü-Besmele');
  await page.locator('[data-ezber-ac="TEST-1"]').click();
  await expect(page.locator('#hoca-tab-ezber')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-ez-ac="TEST-1"]')).toHaveAttribute('aria-expanded', 'true');
});

test('Defter: «Ezber dinlendi» aynı paneli açar; kayıt cümleyi «Bugün sınıfta»ya ekler, geri alma çıkarır', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students });
  await page.locator('[data-sekme=defter]').click();
  await page.locator('[data-dd-gun]').selectOption('2026-09-12');
  await page.locator('[data-dd-ogr]').selectOption('TEST-1');
  await expect(page.locator('[data-dd-form]')).toBeVisible();
  const calisma = page.locator('[data-dd-form] [name=calisma]');
  await calisma.fill('Birlikte okuduk.');
  await page.locator('[data-dd-ezber]').click();
  await expect(page.locator('[data-dd-ezber]')).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('[data-dd-ezber-kap] [data-ez-dinle="TEST-1"]');
  await panel.locator('[data-ez-kalite=tam]').click();
  await expect(calisma).toHaveValue('Birlikte okuduk. Ezber — Eûzü-Besmele: çok güzel okudu.');
  await expect(page.locator('[data-dd-durum]')).toContainText('Ezber cümlesi deftere eklendi');
  expect((await olaylar(page, 'TEST-1'))[0]).toMatchObject({ ezber: 'd-euzu-besmele', tarih: '2026-09-12' }); // defterin günü
  await panel.locator('[data-ez-geri]').click();
  await expect(calisma).toHaveValue('Birlikte okuduk.');
  await page.locator('[data-dd-ezber-kap] [data-ez-kapat]').click();
  await expect(page.locator('[data-dd-ezber-kap]')).toBeHidden();
  await expect(page.locator('[data-dd-ezber]')).toBeFocused();
});

test('Görünümler iki temada erişilebilir; telefonda yatay taşma yok (tablo kendi kaydırıcısında)', async ({ page, context }, info) => {
  const kok = await ezberAc(page, context, {
    ezber: { 'TEST-1': { 's-fatiha': oge(2, '2026-09-12'), 'd-euzu-besmele': oge(4), 'd-kelime-i-tevhid': oge(1) }, 'TEST-2': { 's-kevser': oge(3, '2026-10-01') } },
    yoklama: [yok('TEST-1', 'var'), yok('TEST-2', 'gec')],
  });
  await kart(kok, 'TEST-1').click();
  const gorunumler = [['bugun', null], ['tekrar', null], ['tablo', async () => { await kok.locator('[data-ez-hucre="TEST-1"][data-id="d-kelime-i-tevhid"]').click(); }]];
  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; document.documentElement.classList.toggle('dark', t === 'dark'); }, tema);
    for (const [g, ek] of gorunumler) {
      await kok.locator(`[data-ez-gorunum=${g}]`).click();
      if (ek) await ek();
      const axe = await new AxeBuilder({ page }).include('[data-hoca-ezber]').analyze();
      expect(axe.violations, `${tema}/${g}`).toEqual([]);
      expect(await kok.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), `${tema}/${g} taşma`).toBe(true);
      await kok.screenshot({ path: info.outputPath(`ezber-${tema}-${g}.png`) });
    }
  }
});

test('Ders günü olmayan gün: bütün aktif öğrenciler, açıklamayla', async ({ page, context }) => {
  const kok = await ezberAc(page, context, { tarih: '2026-09-16T09:00:00Z' });
  await expect(kok.locator('.ez-bilgi').first()).toContainText('Bugün ders günü değil');
  await expect(kok.locator('[data-ez-ac]')).toHaveCount(2);
});
