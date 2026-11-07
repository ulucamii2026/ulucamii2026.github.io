import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { K, BUGUN, M, sayfaAc, baglantiBelgesi, KAYITLAR, yazimlar, kayit } from './helpers/neler-baglanti.mjs';

/* «Neler biliyorum?» bağlantı sayfası — telefonla dinleyerek kayıt (7 Kasım 2026). Gerçek derlenmiş sayfa iskeleti + gerçek
   src/scripts/envanter-baglanti.ts, sahte tam SDK. Gerçek anahtar ve öğrenci verisi yok. Odak: açılış (sıra yoksa liste), kalan
   süzgeci + arama + özet, yapışkan çubuk + kısa kayıt durumu, sütun seçici, sonraki sayfa, geri tuşu, hata iletileri,
   program okumasının önbelleği, 360 px dokunma hedefleri. */

const ac = async (page, context, o) => {
  const kok = await sayfaAc(page, context, o);
  await expect(kok.locator('[data-env-baglanti]').first()).toContainText('Bütün kayıtlar gönderildi');
  return kok;
};
const satir = (kap, id) => kap.locator(`[data-satir="${id}"]`);

test('Günün sırası yoksa doğrudan öğrenci listesi açılır; varsa Bugün kalır', async ({ page, context }) => {
  let kok = await ac(page, context);
  await expect(kok.locator('[data-env-gorunum=liste]')).toHaveAttribute('aria-pressed', 'true');
  await expect(kok.locator('.env-ogr-kart').first()).toBeVisible();
});

test('Günün sırası varsa Bugün açılır', async ({ page, context }) => {
  const sira = { tarih: BUGUN, yapildi: {}, adimlar: [{ id: 'a1', saat: '10:00', ders: 1, ref: 'T-4', is: 'form', grup: '9-13', aciklama_tr: 'Form', sure_dk: 5 }] };
  const kok = await ac(page, context, { sira });
  await expect(kok.locator('[data-env-gorunum=bugun]')).toHaveAttribute('aria-pressed', 'true');
  await expect(kok.locator('.env-adim')).toHaveCount(1);
});

test('Liste: Kalan süzgeci varsayılan, yarım önce, tamam gizli; özet sayıları; Tümü/Tamam; arama aksan ve i/ı duyarsız', async ({ page, context }) => {
  const kok = await ac(page, context);
  await expect(kok.locator('[data-env-liste-ozet]')).toContainText('8 öğrenci: 1 tamam · 2 yarım · 5 başlanmadı');
  await expect(kok.locator('[data-env-filtre=kalan]')).toHaveAttribute('aria-pressed', 'true');
  const sira = await kok.locator('.env-ogr-kart').evaluateAll((l) => l.map((e) => `${e.dataset.envOgr}:${e.dataset.envOgrDurum}`));
  expect(sira).toEqual(['T-2:yarim', 'T-3:yarim', 'T-4:yok', 'T-5:yok', 'T-6:yok', 'T-7:yok', 'T-8:yok']);
  await expect(kok.locator('.env-ogr-kart[data-env-ogr="T-1"]')).toHaveCount(0);
  await expect(kok.locator('.env-ogr-kart', { hasText: 'Deneme öğrenci' })).toHaveCount(0);
  await kok.locator('[data-env-filtre=tamam]').click();
  await expect(kok.locator('.env-ogr-kart')).toHaveCount(1);
  await expect(kok.locator('.env-ogr-kart[data-env-ogr="T-1"] .env-ogr-durum')).toHaveText('tamam');
  await kok.locator('[data-env-filtre=tumu]').click();
  await expect(kok.locator('.env-ogr-kart')).toHaveCount(9); // 8 öğrenci + deneme
  // arama: «ozge» → Özge, «ibrahim» → Ibrahim (i/ı), boş sonuç iletisi; yazarken kutu odağını kaybetmez
  await kok.locator('[data-env-ara]').fill('ozge');
  await expect(kok.locator('.env-ogr-kart')).toHaveCount(1);
  await expect(kok.locator('.env-ogr-kart')).toContainText('Özge');
  await expect(kok.locator('[data-env-ara]')).toBeFocused();
  await kok.locator('[data-env-ara]').fill('ıbrahim');
  await expect(kok.locator('.env-ogr-kart')).toContainText('Ibrahim');
  await kok.locator('[data-env-ara]').fill('yokboyle');
  await expect(kok.locator('.env-ogr-kart')).toHaveCount(0);
  await expect(kok.locator('.env-bos')).toContainText('Bu ada uygun öğrenci yok.');
  const axe = await new AxeBuilder({ page }).include('[data-baglanti-envanter]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
});

test('Hepsi tamamsa Kalan boş iletisi gösterir', async ({ page, context }) => {
  const tam = (r) => ({ ...KAYITLAR[0], id: `${r}_2026-11-01_9-13`, ref: r });
  const kok = await ac(page, context, { kayitlar: ['T-1', 'T-2', 'T-3', 'T-4', 'T-5', 'T-6', 'T-7', 'T-8'].map(tam) });
  await expect(kok.locator('.env-bos')).toContainText('Kalan öğrenci yok. Hepsi tamam.');
});

test('Form: yapışkan çubuk kaydırınca görünür, kısa kayıt durumu canlı bölge; sonraki/önceki sayfa; sayfa sonunda Listeye dön', async ({ page, context }) => {
  const kok = await ac(page, context);
  await kok.locator('[data-env-ac="T-4"][data-grup="9-13"]').click();
  const cubuk = kok.locator('.env-bar');
  await expect(cubuk).toContainText('Davut D');
  await expect(cubuk.locator('[data-env-baglanti-kisa]')).toHaveAttribute('aria-live', 'polite');
  await page.evaluate(() => window.scrollTo(0, 900));
  const ust = await cubuk.evaluate((e) => Math.round(e.getBoundingClientRect().top));
  expect(ust).toBeLessThan(120); // başlığın hemen altında yapışık
  expect(ust).toBeGreaterThanOrEqual(0);
  await expect(cubuk.locator('[data-env-baglanti-kisa]')).toContainText('Kaydedildi');
  // bir dokunuş: gönderilene kadar çubuk «Gönderiliyor»/«Kaydedildi»; sonunda Kaydedildi
  await kok.locator('[data-env-sayfa="2"]').click();
  await kok.locator('[data-hoca-d][data-deger="2"]').first().click();
  await expect(cubuk.locator('[data-env-baglanti-kisa]')).toContainText('Kaydedildi', { timeout: 6000 });
  await kok.locator('[data-env-sayfa="1"]').click();
  const n = M.gruplar['9-13'].sayfalar.length;
  await expect(kok.locator('[data-env-onceki]')).toHaveCount(0);
  for (let i = 2; i <= n; i++) {
    await kok.locator('[data-env-sonraki]').click();
    await expect(kok.locator(`[data-env-sayfa="${i}"]`)).toHaveAttribute('aria-current', 'true');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
  await expect(kok.locator('[data-env-sonraki]')).toHaveCount(0);
  await kok.locator('[data-env-onceki]').click();
  await expect(kok.locator(`[data-env-sayfa="${n - 1}"]`)).toHaveAttribute('aria-current', 'true');
  await kok.locator('[data-env-sonraki]').click();
  await kok.locator('.env-sayfa-gez [data-env-geri]').click();
  await expect(kok.locator('[data-env-liste-kap]')).toBeVisible();
});

test('Sütun seçici: Yalnız hoca ben sütununu gizler, hoca dokunuşu sonraki satıra ilerler ve yalnız hoca alanını yazar; seçim hatırlanır', async ({ page, context }) => {
  const kok = await ac(page, context);
  await kok.locator('[data-env-ac="T-5"][data-grup="9-13"]').click();
  await expect(kok.locator('[data-env-sutun=ikisi]')).toHaveAttribute('aria-pressed', 'true');
  await kok.locator('[data-env-sayfa="2"]').click();
  const ilk = M.gruplar['9-13'].sayfalar[1].bolumler[0].satirlar.map((x) => x.id);
  await expect(satir(kok, ilk[0]).locator('[data-ben]')).toHaveCount(3);
  await kok.locator('[data-env-sutun=hoca]').click();
  await expect(satir(kok, ilk[0]).locator('[data-ben]')).toHaveCount(0);
  await expect(satir(kok, ilk[0]).locator('[data-hoca-d]')).toHaveCount(3);
  await satir(kok, ilk[0]).locator('[data-hoca-d][data-deger="1"]').click();
  await page.waitForTimeout(1400);
  const d = await kayit(page, `T-5_${BUGUN}_9-13`);
  expect(d.hoca[ilk[0]]).toBe(1);
  expect(d.ben ?? {}).toEqual({});
  expect(await page.evaluate(() => localStorage.getItem('ulucamii-envanter-sutun'))).toBe('hoca');
  await kok.locator('[data-env-sutun=ben]').click();
  await expect(satir(kok, ilk[0]).locator('[data-hoca-d]')).toHaveCount(0);
  await expect(satir(kok, ilk[0]).locator('[data-ben]')).toHaveCount(3);
  // Yalnız öğrenci kipinde dokunuş sonraki satıra ilerler
  await satir(kok, ilk[0]).locator('[data-ben][data-deger="2"]').click();
  await expect(satir(kok, ilk[1]).locator('[aria-pressed]').first()).toBeVisible();
  await page.waitForTimeout(1400);
  expect((await kayit(page, `T-5_${BUGUN}_9-13`)).ben[ilk[0]]).toBe(2);
});

test('Sütun tercihi yeni açılışta hatırlanır', async ({ page, context }) => {
  const kok = await ac(page, context, { onYukle: () => localStorage.setItem('ulucamii-envanter-sutun', 'hoca') });
  await kok.locator('[data-env-ac="T-6"][data-grup="9-13"]').click();
  await expect(kok.locator('[data-env-sutun=hoca]')).toHaveAttribute('aria-pressed', 'true');
  await kok.locator('[data-env-sayfa="2"]').click();
  await expect(kok.locator('[data-ben]')).toHaveCount(0);
});

test('Geri tuşu formdan listeye döner (sayfadan çıkmaz); Liste düğmesi geçmişi temiz bırakır', async ({ page, context }) => {
  const kok = await ac(page, context);
  const baslangic = await page.evaluate(() => history.length);
  await kok.locator('[data-env-ac="T-4"][data-grup="9-13"]').click();
  await expect(kok.locator('.env-form')).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(baslangic + 1);
  await page.goBack();
  await expect(kok.locator('.env-form')).toHaveCount(0);
  await expect(kok.locator('[data-env-liste-kap]')).toBeVisible();
  expect(page.url()).toContain('/neler-test/');
  // düğmeyle kapat: ek kayıt geri alınır
  await kok.locator('[data-env-ac="T-4"][data-grup="9-13"]').click();
  await kok.locator('[data-env-geri]').first().click();
  await expect(kok.locator('[data-env-liste-kap]')).toBeVisible();
  await page.waitForTimeout(300);
  expect(page.url()).toContain('/neler-test/');
  // öğrenci kipi kilitliyken geri tuşu çıkarmaz
  await kok.locator('[data-env-ac="T-4"][data-grup="9-13"]').click();
  await page.locator('[data-env-ogr-ac]').click();
  await page.goBack();
  await expect(page.locator('.env-ogr')).toBeVisible();
});

test('Yazılar kaybolmaz: form açıkken sekme gizlenince bekleyen yazım hemen gönderilir', async ({ page, context }) => {
  const kok = await ac(page, context);
  await kok.locator('[data-env-ac="T-7"][data-grup="9-13"]').click();
  await kok.locator('[data-env-sutun=hoca]').click();
  await kok.locator('[data-env-sayfa="2"]').click();
  const id = M.gruplar['9-13'].sayfalar[1].bolumler[0].satirlar[0].id;
  await satir(kok, id).locator('[data-hoca-d][data-deger="2"]').click();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect.poll(async () => (await yazimlar(page)).length).toBeGreaterThan(0);
  expect((await kayit(page, `T-7_${BUGUN}_9-13`)).hoca[id]).toBe(2);
});

test('Hata iletileri: kota, ağ, geçersiz/süresi dolmuş bağlantı düz Türkçe ve ayrı ayrı', async ({ page, context }) => {
  // geçersiz anahtar biçimi
  let kok = await sayfaAc(page, context, { hash: '#k=kisa' });
  await expect(kok).toContainText('Bu sayfa yalnız size verilen bağlantıyla açılır');
  // bağlantı belgesi yok (kural süresi dolmuşu da böyle reddeder)
  const p2 = await context.newPage();
  kok = await sayfaAc(p2, context, { veri: null });
  await expect(kok).toContainText('Bu bağlantı geçersiz ya da süresi dolmuş.');
  // kota (resource-exhausted) ve ağ (unavailable) hatası: sahte okuma o kodla fırlar
  for (const [kod, beklenen] of [['resource-exhausted', 'günlük okuma sınırı doldu'], ['unavailable', 'internet yok ya da çok zayıf']]) {
    const p = await context.newPage();
    kok = await sayfaAc(p, context, { onYukle: `window.__okumaHatasi = '${kod}'` });
    await expect(kok).toContainText(beklenen);
    await p.close();
  }
});

test('Okuma maliyeti: bağlantı belgesi 1 okuma; aynı öğrencinin programı bir kez okunur, yeniden açmak ek okuma yapmaz', async ({ page, context }) => {
  const kok = await ac(page, context);
  const say = (son) => page.evaluate((x) => (window.__getDocYollari || []).filter((y) => y.endsWith(x)).length, son);
  expect(await page.evaluate(() => (window.__getDocYollari || []).filter((y) => y.startsWith('envanterBaglanti/') && !y.includes('/', 'envanterBaglanti/'.length)).length)).toBe(1);
  await kok.locator('[data-env-ac="T-4"][data-grup="9-13"]').click();
  await expect.poll(() => say('/program/T-4')).toBe(1);
  await kok.locator('[data-env-geri]').first().click();
  await kok.locator('[data-env-ac="T-4"][data-grup="9-13"]').click();
  await kok.locator('[data-env-geri]').first().click();
  await kok.locator('[data-env-ac="T-5"][data-grup="9-13"]').click();
  await expect.poll(() => say('/program/T-5')).toBe(1);
  expect(await say('/program/T-4')).toBe(1);
});

test('360 px: yatay taşma yok; liste, süzgeç, arama, çubuk ve sütun düğmeleri ≥ 56 px', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const kok = await ac(page, context);
  const olc = (secici) => page.locator(secici).evaluateAll((l) => l.filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const v of await olc('.env-filtre, .env-rozet, .env-ara input, .env-gorunum-dugme')) expect(v).toBeGreaterThanOrEqual(56);
  await kok.locator('[data-env-ac="T-2"][data-grup="9-13"]').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const v of await olc('.env-dugme, .env-sayfa-dugme')) expect(v).toBeGreaterThanOrEqual(56);
  await kok.locator('[data-env-sayfa="2"]').click();
  for (const v of await olc('.env-yuz')) expect(v).toBeGreaterThanOrEqual(56);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const axe = await new AxeBuilder({ page }).include('[data-baglanti-envanter]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
});

test.afterAll(() => { void K; });
