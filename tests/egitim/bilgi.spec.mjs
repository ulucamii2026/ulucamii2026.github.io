/**
 * Bilgi maddesi sayfaları (24 Ekim 2026): iman şartları, farzlar, hadis listeleri gibi kaynaklı sayılı listeler — gerçek tarayıcıda,
 * derlenmiş çıktıya karşı. Neden: verinin doğruluğu tests/ezber-bilgi.test.mjs'te sınanır; burada listenin beş dilde, 360 px'te ve
 * iki temada okunduğu, Arapça parçaların sağdan sola çizildiği, JavaScript ve depolama kapalıyken bozulmadığı, iki çalışma kipinin
 * (Gizle ve söyle, Sırala) ve «Nasıl geçti?» kaydının klavye ve dokunmayla çalıştığı, CSP ve erişilebilirlik kapısı sınanır.
 * Dış ağ kapalıdır; ses yoktur.
 */
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const GIZLE = '#bilgi-panel-gizle';
const SIRALA = '#bilgi-panel-sirala';
const NB = ' ';

const veri = (id) => JSON.parse(readFileSync(new URL(`../../src/data/ezber/bilgi/${id}.json`, import.meta.url), 'utf8'));
// Üç temsilî sayfa: Arapçalı sıralı liste, iki gruplu sıralı liste, sırasız hadis listesi.
const SAYFALAR = ['b-imanin-sartlari', 'b-namazin-farzlari', 'b-secme-hadisler'];

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
});

for (const dil of DILLER) {
  for (const id of SAYFALAR) {
    test(`${dil}/${id}: liste, kaynak ve notlar doğru; 360 px'te taşma yok; iki temada erişilebilir`, async ({ page }) => {
      const hatalar = [];
      page.on('pageerror', (e) => hatalar.push(e.message));
      const d = veri(id);
      await page.goto(`/${dil}/calis/${id}/`);
      await expect(page.locator('section.bilgi')).toBeVisible();
      await expect(page.locator('h1')).not.toBeEmpty();
      // Liste sayfada sunucuda yazılıdır: her madde bir satır, numaralar gruptan gruba 1'den başlar.
      await expect(page.locator('section.bilgi > .bilgi-grup .bilgi-madde')).toHaveCount(d.maddeler.length);
      const nolar = await page.locator('section.bilgi > .bilgi-grup .bilgi-no').allTextContents();
      expect(nolar.length).toBe(d.maddeler.length);
      expect(nolar[0]).toBe('1');
      // Kaynak satırı: en az bir metin kaynağı ve bir karşılaştırma kaynağı.
      await expect(page.locator('.bilgi-kaynak li')).not.toHaveCount(0);
      expect(await page.locator('.bilgi-kaynak li').count()).toBeGreaterThanOrEqual(2);
      // Ses ve «çalışma yolu» basamakları bu sayfada yoktur.
      await expect(page.locator('.yollar-bolumu')).toHaveCount(0);
      await expect(page.locator('audio')).toHaveCount(0);
      // Onay ve taslak notu: hoca onayı yokken her dilde «bekliyor»; en/nl/de ayrıca resmî olmayan taslak uyarısı alır.
      await expect(page.locator('.onay-bekliyor')).toHaveCount(1);
      // Çalışma bölümü JavaScript ile açılır.
      await expect(page.locator('[data-bilgi-kip]')).toBeVisible();

      await page.setViewportSize({ width: 360, height: 740 });
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
}

test('Arapça parçalar sağdan sola çizilir; A− / A+ boyutu değiştirir ve cihazda kalır', async ({ page }) => {
  await page.goto('/tr/calis/b-imanin-sartlari/');
  const ar = page.locator('section.bilgi > .bilgi-grup .bilgi-ar');
  await expect(ar).toHaveCount(6);
  await expect(ar.first()).toHaveAttribute('lang', 'ar');
  await expect(ar.first()).toHaveAttribute('dir', 'rtl');
  expect(await ar.first().evaluate((e) => getComputedStyle(e).direction)).toBe('rtl');
  const boyut = () => ar.first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const kutu = page.locator('[data-bilgi-ar-boyut]');
  await expect(kutu).toBeVisible(); // kutu, düğmelere işleyici bağlandıktan sonra açılır
  const once = await boyut();
  await page.locator('[data-bilgi-arttir]').click();
  // Yazı boyutu CSS geçişiyle değişir: bitmiş değeri yoklayarak bekle.
  await expect.poll(boyut).toBeGreaterThan(once);
  await page.reload();
  await expect(kutu).toBeVisible();
  await expect.poll(boyut).toBeGreaterThan(once);
  await page.locator('[data-bilgi-azalt]').click();
  await expect.poll(boyut).toBe(once);
});

test('Arapçası olmayan listede A− / A+ kutusu çıkmaz', async ({ page }) => {
  await page.goto('/tr/calis/b-dort-halife/');
  await expect(page.locator('[data-bilgi-kip]')).toBeVisible();
  await expect(page.locator('[data-bilgi-ar-boyut]')).toHaveCount(0);
});

test('Taslak uyarısı: tr ve fr yalnız onay bekler; en, nl, de resmî olmayan taslak uyarısı da taşır; satır taslağı rozet alır', async ({ page }) => {
  await page.goto('/tr/calis/b-kuran-fazileti-hadisleri/');
  await expect(page.locator('.onay-bekliyor')).toHaveCount(1);
  await expect(page.locator('.bilgi-rozet')).toHaveCount(0);
  await page.goto('/fr/calis/b-kuran-fazileti-hadisleri/');
  // Fransızca çeviri iki hadiste çalışma çevirisidir: satır rozeti görünür.
  await expect(page.locator('.bilgi-rozet')).toHaveCount(2);
  for (const [dil, kelime] of [['en', /draft/i], ['nl', /concept/i], ['de', /Entwurf/i]]) {
    await page.goto(`/${dil}/calis/b-imanin-sartlari/`);
    await expect(page.locator('.onay-bekliyor')).toHaveCount(1);
    await expect(page.locator('.onay-bekliyor')).toContainText(kelime);
  }
});

test.describe('JavaScript kapalı', () => {
  test.use({ javaScriptEnabled: false });
  test('liste ve kaynaklar okunur; çalışma bölümü ve boyut kutusu gizli kalır', async ({ page }) => {
    await page.goto('/tr/calis/b-imanin-sartlari/');
    await expect(page.locator('section.bilgi > .bilgi-grup .bilgi-madde')).toHaveCount(6);
    await expect(page.locator('.bilgi-kaynak')).toBeVisible();
    await expect(page.locator('[data-bilgi-kip]')).toBeHidden();
    await expect(page.locator('[data-bilgi-ar-boyut]')).toBeHidden();
  });
});

test('Gizle ve söyle: madde noktalı çizgiyle gizlenir, düğme tek tek ve toplu açar; durum okunur', async ({ page }) => {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto('/tr/calis/b-islamin-sartlari/');
  const satirlar = page.locator(`${GIZLE} .bilgi-madde`);
  await expect(satirlar).toHaveCount(5);
  // Başlangıçta hepsi gizli: metin görünmez, noktalı çizgi görünür, durum satırı sayıyı söyler.
  for (let i = 0; i < 5; i++) await expect(satirlar.nth(i).locator('.bilgi-ad')).toBeHidden();
  await expect(satirlar.first().locator('.cizgi')).toBeVisible();
  await expect(page.locator(`${GIZLE} .kip-durum`)).toHaveText('Gizli madde: 5');
  const ac = satirlar.first().locator('.bilgi-ac');
  await expect(ac).toHaveText('Göster');
  await expect(ac).toHaveAttribute('aria-label', '1. maddeyi göster');
  expect((await ac.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await ac.click();
  await expect(satirlar.first().locator('.bilgi-ad')).toBeVisible();
  await expect(satirlar.first().locator('.cizgi')).toBeHidden();
  await expect(ac).toHaveText('Gizle');
  await expect(page.locator(`${GIZLE} .kip-durum`)).toHaveText('Gizli madde: 4');
  await page.getByRole('button', { name: 'Hepsini göster' }).click();
  await expect(page.locator(`${GIZLE} .kip-durum`)).toHaveText('Hepsi açık.');
  await page.getByRole('button', { name: 'Hepsini gizle' }).click();
  await expect(page.locator(`${GIZLE} .kip-durum`)).toHaveText('Gizli madde: 5');
  expect(hatalar).toEqual([]);
});

test('Fransızca: tarayıcıda çizilen dizelerde iki noktadan önce bölünmez boşluk vardır', async ({ page }) => {
  await page.goto('/fr/calis/b-islamin-sartlari/');
  await expect(page.locator(`${GIZLE} .kip-durum`)).toHaveText(`Éléments cachés${NB}: 5`);
  await expect(page.locator(`${GIZLE} .kip-not`)).toContainText(`«${NB}Montrer${NB}»`);
});

test('Sırasız hadis listesinde yalnız «Gizle ve söyle» vardır (sekme çubuğu çıkmaz)', async ({ page }) => {
  await page.goto('/tr/calis/b-secme-hadisler/');
  await expect(page.locator('[data-bilgi-kip]')).toBeVisible();
  await expect(page.locator('[data-bilgi-kip] [role="tab"]')).toHaveCount(0);
  await expect(page.locator(SIRALA)).toHaveCount(0);
  await expect(page.locator(`${GIZLE} .bilgi-madde`)).toHaveCount(5);
});

test('Sırala: ↑ ↓ ve Alt + ok ile taşınır; kontrol yerinde olanı sayar; doğru sıra gösterilir', async ({ page }) => {
  await page.goto('/tr/calis/b-imanin-sartlari/');
  await page.locator('#bilgi-sekme-sirala').click();
  await expect(page.locator(SIRALA)).toBeVisible();
  await expect(page.locator(GIZLE)).toBeHidden();
  const parcalar = page.locator(`${SIRALA} .sina-oge .bilgi-parca`);
  await expect(parcalar).toHaveCount(6);
  const d = veri('b-imanin-sartlari').maddeler.map((x) => x.ad.tr);

  await page.getByRole('button', { name: 'Doğru sırayı göster' }).click();
  expect(await parcalar.allTextContents()).toEqual(d);
  await expect(page.locator(`${SIRALA} .sina-oge.dogru`)).toHaveCount(6);

  // İlk parçayı aşağı taşı: iki parça yer değiştirir, kontrol 4 / 6 der.
  await page.locator(`${SIRALA} li[data-i="0"] button[data-yon="1"]`).click();
  expect(await parcalar.allTextContents()).toEqual([d[1], d[0], ...d.slice(2)]);
  await page.getByRole('button', { name: 'Kontrol et' }).click();
  await expect(page.locator(`${SIRALA} .kip-durum`)).toContainText('4 / 6');
  // Odak taşınan parçanın düğmesinde kalır; Alt + ↑ geri taşır.
  await page.locator(`${SIRALA} li[data-i="1"] button[data-yon="-1"]`).focus();
  await page.keyboard.press('Alt+ArrowUp');
  expect(await parcalar.allTextContents()).toEqual(d);
  await page.getByRole('button', { name: 'Kontrol et' }).click();
  await expect(page.locator(`${SIRALA} .sina-oge.dogru`)).toHaveCount(6);
  await expect(page.getByText('Hepsi doğru sırada.')).toBeVisible();
  // İlk ve son satırda taşıma düğmesi yönünde devre dışıdır.
  await expect(page.locator(`${SIRALA} li[data-i="0"] button[data-yon="-1"]`)).toBeDisabled();
  await expect(page.locator(`${SIRALA} li[data-i="5"] button[data-yon="1"]`)).toBeDisabled();
});

test('Sırala: iki gruplu listede bölüm seçilir ve her bölüm kendi parçalarını sıralatır', async ({ page }) => {
  await page.goto('/tr/calis/b-namazin-farzlari/');
  await page.locator('#bilgi-sekme-sirala').click();
  const secici = page.locator(`${SIRALA} select`);
  await expect(secici).toBeVisible();
  const d = veri('b-namazin-farzlari');
  const grup = (k) => d.maddeler.filter((x) => x.grup === k).map((x) => x.ad.tr).sort();
  const parcalar = page.locator(`${SIRALA} .sina-oge .bilgi-parca`);
  await secici.selectOption({ index: 0 });
  expect((await parcalar.allTextContents()).sort()).toEqual(grup(d.gruplar[0].kimlik));
  await secici.selectOption({ index: 1 });
  expect((await parcalar.allTextContents()).sort()).toEqual(grup(d.gruplar[1].kimlik));
});

test('Gizle ve söyle iki gruplu listede bölüm başlıklarını ve numaraları gruptan gruba yeniden başlatır', async ({ page }) => {
  await page.goto('/tr/calis/b-namazin-farzlari/');
  await expect(page.locator('section.bilgi > .bilgi-grup > h3')).toHaveCount(2);
  const nolar = await page.locator('section.bilgi > .bilgi-grup .bilgi-no').allTextContents();
  const d = veri('b-namazin-farzlari');
  const a = d.maddeler.filter((x) => x.grup === d.gruplar[0].kimlik).length;
  expect(nolar.slice(0, a)).toEqual(Array.from({ length: a }, (_, i) => String(i + 1)));
  expect(nolar[a]).toBe('1');
  await expect(page.locator(`${GIZLE} .bilgi-grup-ad`)).toHaveCount(2);
});

test('«Nasıl geçti?» sonucu cihazda kalır, tekrar günü önerilir; kayıt depoda madde kimliğiyle durur', async ({ page }) => {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto('/tr/calis/b-ulul-azm/');
  const nasil = page.locator('[data-bilgi-nasil]');
  await expect(nasil).toBeVisible();
  await expect(nasil.locator('.kip-durum')).toBeEmpty();
  await nasil.getByRole("button", { name: "Tam", exact: true }).click();
  await expect(nasil.locator('.kip-durum')).not.toBeEmpty();
  const kayit = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
  expect(kayit).toContain('b-ulul-azm');
  expect(kayit).toMatch(/"sonraki\\?":\\?"\d{4}-\d{2}-\d{2}/);
  // Sayfa yenilenince öneri depodan gelir.
  await page.reload();
  await expect(nasil.locator('.kip-durum')).not.toBeEmpty();
  expect(hatalar).toEqual([]);
});

test('Depolama kapalıyken (gizli pencere) sayfa bozulmaz: kipler ve düğmeler çalışır', async ({ page }) => {
  await page.addInitScript(() => {
    const at = () => { throw new DOMException('kapalı', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: at, configurable: true });
  });
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto('/tr/calis/b-imanin-sartlari/');
  await expect(page.locator('[data-bilgi-kip]')).toBeVisible();
  await page.locator(`${GIZLE} .bilgi-ac`).first().click();
  await expect(page.locator(`${GIZLE} .bilgi-ad`).first()).toBeVisible();
  await page.locator('[data-bilgi-nasil]').getByRole('button', { name: 'Bir daha' }).click();
  await page.locator('[data-bilgi-arttir]').click();
  expect(hatalar).toEqual([]);
});

test('Klavye: sekmeler oklarla gezilir ve odak sekmede kalır', async ({ page }) => {
  await page.goto('/tr/calis/b-islamin-sartlari/');
  await page.locator('#bilgi-sekme-gizle').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#bilgi-sekme-sirala')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#bilgi-sekme-sirala')).toBeFocused();
  await expect(page.locator(SIRALA)).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.locator('#bilgi-sekme-gizle')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(GIZLE)).toBeVisible();
});

test('Çalışma kipi ve iki dilde sayfa: 360 px genişlikte iki kipte de yatay kaydırma yoktur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const dil of ['tr', 'fr']) {
    await page.goto(`/${dil}/calis/b-namazin-farzlari/`);
    await page.locator('#bilgi-sekme-sirala').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#bilgi-sekme-gizle').click();
    await page.getByRole('button', { name: /^(Hepsini göster|Tout montrer)$/ }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
