// Bilgi Yarışması (10 Kasım 2026): giriş ve oyun sayfaları beş dilde, CSP, iki temada erişilebilirlik, 320 px; kısa bir oyun YALNIZ klavyeyle
// (karışık: sınav, sıralama, gruplama, eşleştirme, gizemli kutu) oynanır ve hata yapmadan 3 × tur = ortak puan gelir; hiçbir veri saklanmaz.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const HASH = (f, n = 5, s = 'sinif1') => `#f=${f}&k=itikat,ibadet,siyer,ahlak,kuran&d=1-2&n=${n}&s=${s}`;
test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
});

const veriOku = (page) => page.evaluate(() => JSON.parse(document.querySelector('[data-ya-oyun]').dataset.veri));
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const dil of DILLER) {
  test(`${dil}: giriş ve oyun sayfaları, CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
    for (const yol of ['yarisma/', `yarisma/oyna/${HASH('karisik')}`]) {
      await page.goto(`/${dil}/${yol}`);
      await expect(page.locator('h1, h2.ya-soru').first()).toBeVisible();
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page)).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      }
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('giriş: seçim soru sayısını ve bağlantıyı günceller; soru kalmayınca başlatma kapanır', async ({ page }) => {
  await page.goto('/tr/yarisma/');
  const bag = page.locator('[data-basla]');
  await expect(page.locator('[data-sayim]')).toContainText('soru var');
  await page.getByLabel('Gruplama').check();
  for (const k of ['İman (itikat)', 'İbadet', 'Siyer', 'Ahlak']) await page.getByLabel(k).uncheck();
  await expect(page.locator('[data-sayim]')).toContainText('soru yok');
  await expect(bag).toHaveAttribute('aria-disabled', 'true');
  await page.getByLabel('Kur’an bilgisi').uncheck();
  await page.getByLabel('İbadet').check();
  await page.getByLabel('Sınav').check();
  await page.getByLabel('Büyükler').check();
  await page.getByLabel('15 tur').check();
  await expect(bag).toHaveAttribute('aria-disabled', 'false');
  const href = await bag.getAttribute('href');
  expect(href).toMatch(/^\/tr\/yarisma\/oyna\/#f=quiz&k=ibadet&d=2-3&n=15&s=[\w-]+$/);
  await bag.click();
  await expect(page).toHaveURL(/\/tr\/yarisma\/oyna\/#f=quiz/);
  await expect(page.locator('.ya-bicim')).toHaveText('Sınav');
});

test('oyun: hiçbir veri saklanmaz, ağa yazılmaz; hassas gizemli kutular sayfada yok', async ({ page }) => {
  const yazimlar = [];
  page.on('request', (r) => { if (r.method() !== 'GET') yazimlar.push(`${r.method()} ${r.url()}`); });
  await page.goto('/tr/yarisma/oyna/' + HASH('karisik', 15));
  const ham = await page.locator('[data-ya-oyun]').getAttribute('data-veri');
  expect(ham).not.toContain('yar-m-004');
  expect(ham).not.toContain('yar-m-022');
  expect(ham).not.toMatch(/"(fr|en|nl|de)":/);
  await expect(page.locator('h2.ya-soru')).toBeVisible();
  expect(yazimlar).toEqual([]);
  const depo = await page.evaluate(() => ({ s: Object.keys(sessionStorage), l: Object.keys(localStorage).filter((k) => k !== 'ulucamiiEgitimDili'), db: indexedDB.databases ? null : null }));
  expect(depo.s).toEqual([]);
  expect(depo.l).toEqual([]);
});

test('tr: sınav — yanlış seçim elenir ve ikinci şans verir; ilk doğru 3, düzeltmeyle 1 puan; klavyeyle', async ({ page }) => {
  await page.goto('/tr/yarisma/oyna/' + HASH('quiz', 5, 'q-a'));
  const veri = await veriOku(page);
  const soruYaz = async () => {
    const id = await page.locator('[data-sahne]').getAttribute('data-soru-id');
    return veri.sorular.find((s) => s.id === id);
  };
  const dogruSirasi = async (s) => (await page.locator('.ya-sec .ya-metin').allTextContents()).indexOf(s.secenekler[s.dogru]);
  // Tur 1: bilerek yanlış, sonra doğru.
  let s = await soruYaz();
  let k = await dogruSirasi(s);
  const yanlis = k === 0 ? 1 : 0;
  await page.keyboard.press(String(yanlis + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('p.ya-durum')).toContainText('Tekrar deneyin');
  await expect(page.locator(`.ya-sec[data-k="${yanlis}"]`)).toHaveAttribute('data-durum', 'elendi');
  await expect(page.locator(`.ya-sec[data-k="${yanlis}"]`)).toBeDisabled();
  await page.keyboard.press(String(k + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('.ya-sec[data-durum="dogru"] .ya-etiket')).toContainText('Doğru');
  await expect(page.locator('p.ya-durum')).toContainText('+1');
  await expect(page.locator('[data-puan]')).toHaveText('1');
  await page.keyboard.press('n');
  // Tur 2: ilk denemede doğru: +3.
  s = await soruYaz();
  k = await dogruSirasi(s);
  await page.keyboard.press('abcd'[k]);
  await page.keyboard.press('Enter');
  await expect(page.locator('p.ya-durum')).toContainText('+3');
  await expect(page.locator('[data-puan]')).toHaveText('4');
  // Tur 3: iki kez yanlış → cevap gösterilir, 0 puan, «Birlikte öğrendik».
  await page.keyboard.press('ArrowRight');
  s = await soruYaz();
  k = await dogruSirasi(s);
  const yanlislar = [0, 1, 2].filter((x) => x !== k).slice(0, 2);
  for (const y of yanlislar) { await page.keyboard.press(String(y + 1)); await page.keyboard.press('Enter'); }
  await expect(page.locator('p.ya-durum')).toContainText('Birlikte öğrendik');
  await expect(page.locator('.ya-sec[data-durum="dogru"]')).toHaveCount(1);
  await expect(page.locator('[data-puan]')).toHaveText('4');
});

test('tr: gizemli kutu — yanlış seçim sıradaki ipucunu açar; puan açık ipucuna göre', async ({ page }) => {
  await page.goto('/tr/yarisma/oyna/' + HASH('gizemli', 5, 'g-1'));
  const veri = await veriOku(page);
  const id = await page.locator('[data-sahne]').getAttribute('data-soru-id');
  const s = veri.sorular.find((x) => x.id === id);
  const metinler = await page.locator('.ya-sec .ya-metin').allTextContents();
  const k = metinler.indexOf(s.secenekler[s.dogru]);
  await expect(page.locator('.ya-ipucu')).toHaveCount(1);
  await page.keyboard.press(' ');
  await expect(page.locator('.ya-ipucu')).toHaveCount(2);
  const yanlis = [0, 1, 2].find((x) => x !== k && x < metinler.length);
  await page.keyboard.press(String(yanlis + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('.ya-ipucu')).toHaveCount(Math.min(3, s.ipuclari.length));
  await page.keyboard.press(String(k + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-puan]')).toHaveText(s.ipuclari.length >= 3 ? '1' : '2');
});

test('tr: karışık 5 tur yalnız klavyeyle, hatasız oynanır → ortak puan 15; son ekranda sıcak cümle, yüzde ya da N/M yok', async ({ page }) => {
  await page.goto('/tr/yarisma/oyna/' + HASH('karisik', 5, 'tam-oyun'));
  const veri = await veriOku(page);
  const bicimler = [];
  for (let tur = 0; tur < 5; tur++) {
    const id = await page.locator('[data-sahne]').getAttribute('data-soru-id');
    const s = veri.sorular.find((x) => x.id === id);
    bicimler.push(s.format);
    if (s.format === 'quiz' || s.format === 'gizemli') {
      const k = (await page.locator('.ya-sec .ya-metin').allTextContents()).indexOf(s.secenekler[s.dogru]);
      await page.keyboard.press(String(k + 1));
      await page.keyboard.press('Enter');
    } else if (s.format === 'siralama') {
      const adlar = () => page.locator('.ya-sira-oge .ya-metin').allTextContents();
      for (let hedef = 0; hedef < s.ogeler.length; hedef++) {
        let simdi = (await adlar()).indexOf(s.ogeler[hedef]);
        while (simdi > hedef) {
          await page.locator('.ya-sira-oge').nth(simdi).focus();
          await page.keyboard.press('ArrowUp');
          simdi--;
        }
      }
      expect(await adlar()).toEqual(s.ogeler);
      await page.keyboard.press('Enter');
    } else if (s.format === 'gruplama') {
      for (let n = 0; n < s.ogeler.length; n++) {
        const kart = page.locator('.ya-havuz .ya-kart').first();
        const metin = (await kart.textContent()).replace(/seçili$/, '');
        const o = s.ogeler.find((x) => metin.startsWith(x.metin));
        await kart.focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press(String(o.grup + 1));
      }
      await page.keyboard.press('Enter');
    } else {
      for (let n = 0; n < s.ciftler.length; n++) {
        await page.locator(`[data-sol="${n}"]`).focus();
        await page.keyboard.press('Enter');
        const sagMetinler = await page.locator('.ya-sutun').nth(1).locator('.ya-oge .ya-metin').allTextContents();
        await page.locator('[data-sag]').nth(sagMetinler.indexOf(s.ciftler[n].sag)).focus();
        await page.keyboard.press('Enter');
      }
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('p.ya-durum')).toContainText('+3');
    await page.keyboard.press('n');
  }
  await expect(page.locator('.ya-son-sayi')).toHaveText('15');
  await expect(page.locator('[data-puan]')).toHaveText('15');
  await expect(page.locator('.ya-bant')).toBeVisible();
  const govde = await page.locator('[data-ya-oyun]').innerText();
  expect(govde).not.toMatch(new RegExp('%|15 */ *15'));
  expect(new Set(bicimler).size).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.ya-karolar .ya-karo')).toHaveCount(5);
  // Aynı oyunu yeniden oynama başa döner.
  await page.getByRole('button', { name: 'Aynı oyunu yeniden oynayın' }).click();
  await expect(page.locator('[data-puan]')).toHaveText('0');
});

test('gruplama ve eşleştirme: yanlışlar geri döner, doğrular kalır; ikinci yanlışta cevap gösterilir (fr)', async ({ page }) => {
  for (const bicim of ['gruplama', 'eslestirme']) {
    await page.goto(`/fr/yarisma/oyna/${HASH(bicim, 5, 'y-' + bicim)}`);
    const veri = await veriOku(page);
    const id = await page.locator('[data-sahne]').getAttribute('data-soru-id');
    const s = veri.sorular.find((x) => x.id === id);
    if (bicim === 'gruplama') {
      // Hepsini YANLIŞ kutuya koy.
      const n = s.ogeler.length;
      for (let a = 0; a < n; a++) {
        const kart = page.locator('.ya-havuz .ya-kart').first();
        const metin = (await kart.textContent()).replace(/sélectionnée$/, '');
        const o = s.ogeler.find((x) => metin.startsWith(x.metin));
        await kart.focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press(String(2 - o.grup));
      }
    } else {
      // Sol i ↔ sağ (i+1) kaydır: hepsi yanlış.
      const n = s.ciftler.length;
      for (let a = 0; a < n; a++) {
        await page.locator(`[data-sol="${a}"]`).focus();
        await page.keyboard.press('Enter');
        const sagMetinler = await page.locator('.ya-sutun').nth(1).locator('.ya-oge .ya-metin').allTextContents();
        await page.locator('[data-sag]').nth(sagMetinler.indexOf(s.ciftler[(a + 1) % n].sag)).focus();
        await page.keyboard.press('Enter');
      }
    }
    await page.keyboard.press('Enter');
    await expect(page.locator('p.ya-durum')).toContainText(/Essayez encore|Quand|Ensemble|appris/);
    await expect(page.locator('[data-kontrol]')).toBeVisible();
    await expect(page.locator('[data-kontrol]')).toBeDisabled();
  }
});

test('320 px: giriş ve oyun taşmaz; azaltılmış harekette geçiş yok', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const yol of ['/de/yarisma/', `/nl/yarisma/oyna/${HASH('quiz')}`, `/de/yarisma/oyna/${HASH('eslestirme', 5, 'e-1')}`, `/fr/yarisma/oyna/${HASH('siralama', 5, 's-1')}`]) {
    await page.goto(yol);
    await expect(page.locator('h1, h2.ya-soru').first()).toBeVisible();
    expect(await tasmaYok(page)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.ya-sec, .ya-oge, .ya-sira-oge').first().evaluate((el) => getComputedStyle(el).transitionDuration)).toMatch(/^0s|0\.001s|1e-05s|0s/);
});

test('tr: bir tur geri — ← ve düğme; ortak puan tutarlı düzelir, ilk turda düğme yok', async ({ page }) => {
  await page.goto('/tr/yarisma/oyna/' + HASH('quiz', 5, 'geri-1'));
  const veri = await veriOku(page);
  const geri = page.locator('[data-geri]');
  const dogruYap = async () => {
    const id = await page.locator('[data-sahne]').getAttribute('data-soru-id');
    const s = veri.sorular.find((x) => x.id === id);
    const k = (await page.locator('.ya-sec .ya-metin').allTextContents()).indexOf(s.secenekler[s.dogru]);
    await page.keyboard.press(String(k + 1));
    await page.keyboard.press('Enter');
    await expect(page.locator('p.ya-durum')).toContainText('+3');
    return id;
  };
  // İlk tur çözülmeden geri yok; ← hiçbir şey yapmaz.
  await expect(geri).toBeHidden();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-tur-yazi]')).toContainText('1 / 5');
  // Tur 1 doğru (3), tur 2 doğru (6).
  const id1 = await dogruYap();
  await expect(page.locator('[data-puan]')).toHaveText('3');
  await page.keyboard.press('n');
  const id2 = await dogruYap();
  await expect(page.locator('[data-puan]')).toHaveText('6');
  // Çözülmüş turda ←: bu turun puanı çıkar, aynı tur baştan açılır.
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-puan]')).toHaveText('3');
  await expect(page.locator('[data-sahne]')).toHaveAttribute('data-soru-id', id2);
  await expect(page.locator('p.ya-durum')).toContainText('geri alındı');
  await expect(page.locator('.ya-sec:not([disabled])').first()).toBeVisible();
  // Çözülmemiş turda düğmeyle: önceki tur silinir ve yeniden açılır.
  await geri.click();
  await expect(page.locator('[data-puan]')).toHaveText('0');
  await expect(page.locator('[data-sahne]')).toHaveAttribute('data-soru-id', id1);
  await expect(page.locator('[data-tur-yazi]')).toContainText('1 / 5');
  await expect(geri).toBeHidden();
  // Yeniden oynanır: puan yine tutarlı.
  await dogruYap();
  await expect(page.locator('[data-puan]')).toHaveText('3');
});
