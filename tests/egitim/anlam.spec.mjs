/**
 * «Anlamla eşleştir» (Faz 2e, 24 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı.
 * Neden: tur kurma mantığı saf kütüphanede sınanır (tests/ezber-tekrar-oyun.test.mjs); burada ekranın turu doğru çizdiği,
 * doğru çiftin kilitlendiği ve numarayla işaretlendiği, yanlış çiftin yalnız nazik bir yazı çıkarıp yeniden denettirdiği,
 * klavyeyle kullanıldığı, taslak (gözden geçirilmemiş) meâlde oyunun hiç sunulmadığı ve CSP/erişilebilirlik kapısı sınanır.
 * Doğru çiftler test içinde yazılmaz: Diyanet metin verisinden (src/data/ezber/metin) okunur. Dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const SINA = '#kip-panel-sina';
const ANAHTAR = 'ulucamii:ezber:cihaz:v1';
const metin = (id) => JSON.parse(readFileSync(new URL(`../../src/data/ezber/metin/${id}.json`, import.meta.url), 'utf8'));
// Yazım işaretlerinden bağımsız karşılaştırma (Fransızca tipografi bölünmez boşluk ekler; noktalama değişebilir).
const sade = (s) => s.normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '');
const RAKAM = '٠١٢٣٤٥٦٧٨٩';
const ilkAyet = (arapca) => {
  const e = arapca.match(/۝([٠-٩]+)/);
  return Number([...e[1]].map((r) => RAKAM.indexOf(r)).join(''));
};
/** Veriye göre bir dilin sayfada gösterilecek (gözden geçirilmiş) meâli; taslaksa ya da yoksa null. */
const oyunMeali = (id, dil) => {
  const meal = metin(id).meal[dil];
  return meal && !meal.inceleme ? meal : null;
};

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
  await page.clock.setFixedTime(new Date(2026, 9, 24, 10, 0, 0));
});

const oyunDugme = (page) => page.locator(`${SINA} .sina-oyunlar [data-oyun="anlam"]`);
const durum = (page) => page.locator(`${SINA} .sina-alan + .kip-durum`);
const sol = (page) => page.locator(`${SINA} .anlam-ar`);
const sag = (page) => page.locator(`${SINA} .anlam-meal`);
const acAnlam = async (page, yol) => {
  await page.goto(yol);
  await page.locator('#kip-sekme-sina').click();
  await expect(page.locator(SINA)).toBeVisible();
  await oyunDugme(page).click();
  await expect(sol(page).first()).toBeVisible();
};

/** Ekrandaki turda her Arapça düğmenin doğru anlam düğmesinin sırası (veriden). */
async function dogruSiralar(page, id, dil) {
  const meal = oyunMeali(id, dil);
  const arapca = await page.locator(`${SINA} .anlam-ar .anlam-metin`).allTextContents();
  const anlamlar = (await page.locator(`${SINA} .anlam-meal .anlam-metin`).allTextContents()).map(sade);
  return arapca.map((a) => {
    const n = ilkAyet(a);
    const grup = meal.gruplar.find((g) => g.ayetler[0] <= n && n <= g.ayetler[1]);
    const j = anlamlar.indexOf(sade(grup.metin));
    expect(j, `${dil}: ${n}. âyetin anlamı ekranda bulunamadı`).toBeGreaterThan(-1);
    return j;
  });
}

for (const dil of DILLER) {
  const var_ = Boolean(oyunMeali('s-ihlas', dil));
  test(`${dil}: Anlamla eşleştir ${var_ ? 'sunulur, çift çift eşleşir' : 'gözden geçirilmemiş meâlde sunulmaz'}; CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.goto(`/${dil}/calis/s-ihlas/`);
    await page.locator('#kip-sekme-sina').click();
    await expect(page.locator(SINA)).toBeVisible();
    if (!var_) {
      // Taslak çeviri doğru yanıt diye öğretilmez: düğme hiç çıkmaz, öbür üç oyun yerinde kalır.
      await expect(oyunDugme(page)).toHaveCount(0);
      await expect(page.locator(`${SINA} .sina-oyunlar button`)).toHaveCount(4);
      expect(hatalar).toEqual([]);
      return;
    }
    await expect(page.locator(`${SINA} .sina-oyunlar button`)).toHaveCount(5);
    await oyunDugme(page).click();
    await expect(oyunDugme(page)).toHaveAttribute('aria-pressed', 'true');
    // Dört âyetlik sûrede üç çift; Arapça sütun numaralı ve metin sırasında, anlam sütunu karışık.
    await expect(sol(page)).toHaveCount(3);
    await expect(sag(page)).toHaveCount(3);
    const numaralar = await page.locator(`${SINA} .anlam-ar .sina-no`).allTextContents();
    expect(numaralar).toEqual(['1', '2', '3']);
    const arapca = await page.locator(`${SINA} .anlam-ar .anlam-metin`).allTextContents();
    const ayetler = arapca.map(ilkAyet);
    expect(ayetler).toEqual([...ayetler].sort((a, b) => a - b));
    await expect(page.locator(`${SINA} .anlam-ar .anlam-metin`).first()).toHaveAttribute('lang', 'ar');
    await expect(page.locator(`${SINA} .anlam-meal .anlam-metin`).first()).toHaveAttribute('lang', new RegExp(`^${dil}`));

    const j = await dogruSiralar(page, 's-ihlas', dil);
    expect(j, 'anlam sütunu Arapça sütunla aynı sırada gelmemeli').not.toEqual([0, 1, 2]);
    // İlk çifti doğru kur: iki düğme kilitlenir, aynı numara ve ✓ taşır, yazı «Kalan: 2» der.
    await sol(page).nth(0).click();
    await expect(sol(page).nth(0)).toHaveAttribute('aria-pressed', 'true');
    await sag(page).nth(j[0]).click();
    await expect(sol(page).nth(0)).toBeDisabled();
    await expect(sag(page).nth(j[0])).toBeDisabled();
    await expect(sag(page).nth(j[0]).locator('.sina-no')).toHaveText('1');
    await expect(sol(page).nth(0).locator('.sina-isaret')).toHaveText('✓');
    await expect(sag(page).nth(j[0]).locator('.sina-isaret')).toHaveText('✓');
    await expect(sol(page).nth(0)).toHaveClass(/dogru/);
    await expect(durum(page)).toContainText(/2/);
    // Odak sıradaki eşleşmemiş Arapça düğmeye geçer (klavye kullanıcısı yolunu kaybetmez).
    await expect(sol(page).nth(1)).toBeFocused();

    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('Üç çiftin hepsi kurulunca «Hepsi eşleşti» yazar, çalışılan gün işlenir; yanlış çift nazik yazıyla yeniden denetilir', async ({ page }) => {
  await acAnlam(page, '/tr/calis/s-ihlas/');
  const j = await dogruSiralar(page, 's-ihlas', 'tr');
  // Yanlış çift: ilk Arapça bölümü doğru olmayan bir anlamla eşle. Hiçbir şey kilitlenmez, seçim kalkar, puan ya da ses yok.
  const yanlis = [0, 1, 2].find((x) => x !== j[0]);
  await sol(page).nth(0).click();
  await sag(page).nth(yanlis).click();
  await expect(durum(page)).toHaveText('Bu ikisi eşleşmedi; başka bir anlam deneyin.');
  await expect(sol(page).nth(0)).toBeEnabled();
  await expect(sol(page).nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(sag(page).nth(yanlis)).toBeEnabled();
  await expect(page.locator(`${SINA} .anlam-ogesi.dogru`)).toHaveCount(0);
  await expect(page.locator(`${SINA} .anlam-izgara`)).not.toContainText(/yanlış|hata/i);
  expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), ANAHTAR))?.gunler ?? []).toEqual([]);

  // Sıra serbest: önce anlam, sonra Arapça bölüm de seçilebilir. Aynı düğmeye ikinci dokunuş seçimi kaldırır.
  await sag(page).nth(j[1]).click();
  await sag(page).nth(j[1]).click();
  await expect(sag(page).nth(j[1])).toHaveAttribute('aria-pressed', 'false');
  for (const i of [0, 1, 2]) {
    await sag(page).nth(j[i]).click();
    await sol(page).nth(i).click();
    if (i < 2) await expect(durum(page)).toContainText(String(2 - i));
  }
  await expect(durum(page)).toHaveText('Hepsi eşleşti.');
  await expect(page.locator(`${SINA} .anlam-ogesi:not(:disabled)`)).toHaveCount(0);
  await expect(page.locator(`${SINA} .anlam-ogesi.dogru`)).toHaveCount(6);
  // Her eşleşen çift aynı numarayı taşır.
  for (const i of [0, 1, 2]) await expect(sag(page).nth(j[i]).locator('.sina-no')).toHaveText(String(i + 1));
  expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), ANAHTAR)).gunler).toEqual(['2026-10-24']);
  // Odak «Yeni tur» düğmesine gelir; yeni tur yeni (karışık) bir tur kurar.
  await expect(page.getByRole('button', { name: 'Yeni tur' })).toBeFocused();
  await page.getByRole('button', { name: 'Yeni tur' }).click();
  await expect(page.locator(`${SINA} .anlam-ogesi:not(:disabled)`)).toHaveCount(6);
});

test('«Eşleşmeleri göster» doğru çiftleri işaretler ama çalışılan günü işlemez', async ({ page }) => {
  await acAnlam(page, '/tr/calis/s-ihlas/');
  const j = await dogruSiralar(page, 's-ihlas', 'tr');
  await page.getByRole('button', { name: 'Eşleşmeleri göster' }).click();
  await expect(page.locator(`${SINA} .anlam-ogesi.dogru`)).toHaveCount(6);
  await expect(durum(page)).toHaveText('Doğru eşleşmeler gösterildi.');
  // Gösterilen her anlam, Arapça sütunda karşılığının numarasını taşır.
  for (const i of [0, 1, 2]) await expect(sag(page).nth(j[i]).locator('.sina-no')).toHaveText(String(i + 1));
  const kayit = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), ANAHTAR);
  expect(kayit?.gunler ?? []).toEqual([]);
  await expect(page.getByRole('button', { name: 'Yeni tur' })).toBeFocused();
});

test('Klavye: Tab ile gezilir, Enter/Boşluk seçer; seçili öğe aria-pressed ile bildirilir', async ({ page }) => {
  await acAnlam(page, '/tr/calis/s-ihlas/');
  const j = await dogruSiralar(page, 's-ihlas', 'tr');
  await sol(page).nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(sol(page).nth(0)).toHaveAttribute('aria-pressed', 'true');
  await sag(page).nth(j[0]).focus();
  await page.keyboard.press('Space');
  await expect(sol(page).nth(0)).toBeDisabled();
  await expect(durum(page)).toHaveText('Eşleşti. Kalan: 2.');
  // Listeler adlandırılmış ve liste anlamlıdır.
  await expect(page.getByRole('list', { name: 'Arapça bölümler' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Anlamlar' })).toBeVisible();
});

test('Çok kısımlı maddede kısım seçilince tur yalnız o kısmın bloklarından kurulur', async ({ page }) => {
  // Nebe 40 âyet: FR meâli âyet âyet; kısım seçici iki ya da daha çok seçenek sunar.
  await page.goto('/fr/calis/s-nebe/');
  await page.locator('#kip-sekme-sina').click();
  await oyunDugme(page).click();
  const secici = page.locator(`${SINA} .kip-alan select`);
  await expect(secici).toBeVisible();
  const secenekSayisi = await secici.locator('option').count();
  expect(secenekSayisi).toBeGreaterThan(2);
  await secici.selectOption({ index: 2 });
  const arapca = await page.locator(`${SINA} .anlam-ar .anlam-metin`).allTextContents();
  const ayetler = arapca.map(ilkAyet);
  expect(ayetler).toHaveLength(3);
  // 3. kısım = 11.–15. âyetler (kısım boyu 5).
  for (const n of ayetler) expect(n).toBeGreaterThanOrEqual(11);
  for (const n of ayetler) expect(n).toBeLessThanOrEqual(15);
});

test('Oyun kurulamayan madde: tek meâl blokluk sûrede (TR Felak) düğme çıkmaz; FR’de çıkar', async ({ page }) => {
  expect(oyunMeali('s-felak', 'tr').gruplar).toHaveLength(1);
  await page.goto('/tr/calis/s-felak/');
  await page.locator('#kip-sekme-sina').click();
  await expect(page.locator(`${SINA} .sina-oyunlar button`)).toHaveCount(4);
  await expect(oyunDugme(page)).toHaveCount(0);
  await page.goto('/fr/calis/s-felak/');
  await page.locator('#kip-sekme-sina').click();
  await expect(oyunDugme(page)).toHaveCount(1);
});

test('Kur’an dışı madde (TR dua): anlam bölümleriyle eşleşir; başka dillerde anlam olmadığından düğme çıkmaz', async ({ page }) => {
  await acAnlam(page, '/tr/calis/d-subhaneke/');
  expect(await sol(page).count()).toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Eşleşmeleri göster' }).click();
  await expect(page.locator(`${SINA} .anlam-ogesi:not(:disabled)`)).toHaveCount(0);
  await page.goto('/en/calis/d-subhaneke/');
  await page.locator('#kip-sekme-sina').click();
  await expect(oyunDugme(page)).toHaveCount(0);
});
