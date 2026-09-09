import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';

const yollar = { tr: 'ihtida-basvurusu', fr: 'demande-de-conversion', en: 'conversion-application' };
const gruplar = [
  ['b-cami', 'b-kisi'], ['b-durum'], ['b-iletisim'], ['b-ihtida'],
  ['b-belgeler'], ['b-riza'], ['b-ozet'],
];
let png;

test.beforeAll(async () => {
  png = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#827868' } }).png().toBuffer();
});

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
      ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
});

const form = page => page.locator('form[data-form="ihtida"]');
const bolum = (page, id) => page.locator(`#${id}`);

async function ileriGit(page, beklenenAdim) {
  await page.locator('[data-adim-ileri]').click();
  await aktifGrubuDogrula(page, beklenenAdim);
}

async function imzaCiz(page) {
  const tuval = page.locator('[data-imza] canvas');
  await tuval.scrollIntoViewIfNeeded();
  const kutu = await tuval.boundingBox();
  if (!kutu) throw new Error('İmza tuvali görünür değil');
  await page.mouse.move(kutu.x + 24, kutu.y + kutu.height / 2);
  await page.mouse.down();
  await page.mouse.move(kutu.x + kutu.width * 0.38, kutu.y + kutu.height * 0.34, { steps: 6 });
  await page.mouse.move(kutu.x + kutu.width * 0.72, kutu.y + kutu.height * 0.62, { steps: 6 });
  await page.mouse.up();
}

async function imzaVeriUrlBoyutu(page) {
  return page.locator('[data-imza] canvas').evaluate(async tuval => {
    const veri = tuval.toDataURL('image/png');
    const resim = new Image();
    await new Promise((coz, red) => { resim.onload = coz; resim.onerror = red; resim.src = veri; });
    return { en: resim.naturalWidth, boy: resim.naturalHeight };
  });
}

async function sonluAnimasyonlariBekle(page) {
  await page.evaluate(async () => {
    const animasyonlar = document.getAnimations().filter(animasyon =>
      animasyon.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(animasyonlar.map(animasyon => animasyon.finished.catch(() => {})));
  });
}

async function aktifGrubuDogrula(page, aktif) {
  for (const [sira, ids] of gruplar.entries()) {
    for (const id of ids) {
      const alan = bolum(page, id);
      if (sira === aktif) {
        await expect(alan).toBeVisible();
        await expect(alan).not.toHaveAttribute('hidden', '');
      } else {
        await expect(alan).toHaveAttribute('hidden', '');
      }
    }
  }
  await expect(page.locator('[data-adim-durum]')).toContainText(new RegExp(`${aktif + 1}\\s*/\\s*7`));
  await expect(page.locator('progress[data-adim-ilerleme]')).toHaveAttribute('value', String(aktif + 1));
  await expect(page.locator('progress[data-adim-ilerleme]')).toHaveAttribute('max', '7');
}

for (const [dil, yol] of Object.entries(yollar)) {
  test(`${dil}: yedi adımlı ihtida sihirbazı görünür alanı, klavyeyi ve incelemeyi yönetir`, async ({ page }) => {
    await page.goto(`/${dil}/${yol}/`);
    await expect(page.locator('[data-ihtida-adimlar]')).toBeVisible();
    await expect(page.locator('[data-adim-sec]')).toHaveCount(7);
    for (let sira = 0; sira < 7; sira++) {
      await expect(page.locator(`[data-adim-sec="${sira}"]`)).toBeVisible();
    }
    await aktifGrubuDogrula(page, 0);

    // İlk adımdaki eksik zorunlu bilgi, ileri gidip gizli alanlara odak çalmamalıdır.
    await page.locator('[data-adim-ileri]').click();
    await aktifGrubuDogrula(page, 0);
    await expect(page.locator('#i-ad')).toBeFocused();

    // Alanlar gizlense de devre dışı bırakılmaz; tarayıcı doğrulaması ve taslak korunur.
    expect(await page.locator('#b-durum input, #b-durum select').evaluateAll(alanlar => alanlar.every(alan => !alan.disabled))).toBe(true);

    // Adım düğmeleri, eksik sonraki adımlar olsa bile gözden geçirme için doğrudan açılabilir.
    await page.locator('[data-adim-sec="6"]').focus();
    await page.keyboard.press('Enter');
    await aktifGrubuDogrula(page, 6);
    await expect(form(page).locator('button[type="submit"]:visible')).toHaveCount(1);

    await page.locator('[data-adim-sec="2"]').click();
    await aktifGrubuDogrula(page, 2);
    await page.locator('[data-adim-geri]').focus();
    await page.keyboard.press('Enter');
    await aktifGrubuDogrula(page, 1);

    // Tam form görünümünde tüm bölümler inceleme için açılır; geri dönünce seçili adım korunur.
    await page.locator('[data-adim-tumu]').click();
    for (const ids of gruplar) for (const id of ids) await expect(bolum(page, id)).toBeVisible();
    await page.locator('[data-adim-tumu]').click();
    await aktifGrubuDogrula(page, 1);
  });

  test(`${dil}: taslak saklanır; imza aktarım izni imzasız başvuruda görünmez`, async ({ page }) => {
    await page.goto(`/${dil}/${yol}/`);
    await page.locator('#i-ad').fill('Taslak Adım Örneği');
    await expect.poll(() => page.evaluate(() =>
      JSON.parse(localStorage.getItem('ulucamii:ihtida:v2') || '{}').alanlar?.['basvuran.adSoyad'])).toBe('Taslak Adım Örneği');
    await page.reload();
    await expect(page.locator('#i-ad')).toHaveValue('Taslak Adım Örneği');

    await page.locator('[data-adim-sec="4"]').click();
    const imzaIzni = page.locator('#i-onay-imza');
    await expect(imzaIzni).toHaveAttribute('name', 'onay.imzaAktarimIzni');
    await page.locator('input[name="imzaYok"]').check();
    await expect(imzaIzni).toBeHidden();
    await expect(imzaIzni).not.toBeChecked();
  });
}

test('Varsayılan sihirbaz, belgeler-imza-rıza ile eksiksiz başvuruyu tek akışta gönderir', async ({ page, isMobile }, info) => {
  const gonderilen = [];
  await page.route('**/macros/**', route => {
    if (route.request().method() === 'POST') gonderilen.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, surum: 27, ihtidaPaketHazir: true, ref: 'IH-2099-9999' } });
  });
  await page.goto('/tr/ihtida-basvurusu/');
  if (isMobile) await page.locator('[data-ihtida-adimlar]').screenshot({ path: info.outputPath('adim-0-mobil.png') });

  for (const [id, deger] of Object.entries({
    ad: 'Deniz Örnek', dogum: '1990-05-20', 'dogum-yeri': 'Namur', uyruk: 'Belçika', anne: 'Anne Örnek', baba: 'Baba Örnek',
  })) await page.locator(`#i-${id}`).fill(deger);
  await page.locator('#i-cins-kadin').check();
  await ileriGit(page, 1);

  await page.locator('#i-medeni').selectOption('bekar');
  await page.locator('#i-ogrenim').fill('Lisans');
  await page.locator('#i-meslek').fill('Öğretmen');
  await ileriGit(page, 2);

  for (const [id, deger] of Object.entries({
    eposta: 'deniz@example.test', telefon: '+32 470 00 00 00', adres: 'Rue du Test 12', 'posta-kodu': '6900', sehir: 'Marche-en-Famenne', ulke: 'Belçika',
  })) await page.locator(`#i-${id}`).fill(deger);
  await ileriGit(page, 3);

  await page.locator('#i-onceki-din').fill('Belirtilen inanç');
  await page.locator('#i-sebep').fill('Kendi araştırmam sonucunda.');
  await ileriGit(page, 4);

  await page.locator('#i-belge-pasaport').check();
  for (const id of ['vesikalik', 'kimlik-on']) {
    await page.locator(`#i-g-${id}`).setInputFiles({ name: `${id}.png`, mimeType: 'image/png', buffer: png });
    await expect(page.locator(`[data-gorsel="${id === 'kimlik-on' ? 'kimlikOn' : id}"]`)).toHaveAttribute('data-dolu', '1');
  }
  await imzaCiz(page);
  const imzaGorunurken = await imzaVeriUrlBoyutu(page);
  await page.locator('#i-onay-imza').check();
  await page.locator('#b-belgeler').screenshot({ path: info.outputPath('belgeler-ve-imza.png') });
  await ileriGit(page, 5);
  // Belgeler adımı gizlenince tuval yeniden küçük bir boyutta kurulup PDF imzasını kırpmamalıdır.
  await expect.poll(() => imzaVeriUrlBoyutu(page)).toEqual(imzaGorunurken);

  for (const id of ['riza', 'ek10', 'gizlilik', 'gorsel']) await page.locator(`#i-onay-${id}`).check();
  await page.locator('#i-beyan').fill('Deniz Örnek');
  await ileriGit(page, 6);

  // İnceleme görünümünde üst adım çubuğu, iletişim ve belge alanları birlikte erişilebilirdir.
  await page.locator('[data-adim-tumu]').click();
  await expect.poll(() => imzaVeriUrlBoyutu(page)).toEqual(imzaGorunurken);
  for (const tema of ['light', 'dark']) {
    if (tema === 'dark') await page.locator('#tema-dugme').click();
    await sonluAnimasyonlariBekle(page);
    const axe = await new AxeBuilder({ page })
      .include('[data-ihtida-adimlar]').include('#b-iletisim').include('#b-belgeler')
      .withTags(['wcag2a', 'wcag2aa']).analyze();
    const ciddi = axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({
      id: v.id,
      hedefler: v.nodes.map(n => n.target),
      ozet: v.nodes.map(n => n.failureSummary),
    }));
    expect(ciddi, tema).toEqual([]);
  }

  await page.locator('[data-adim-tumu]').click();
  await aktifGrubuDogrula(page, 6);
  await form(page).locator('button[type="submit"]:visible').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
  expect(gonderilen).toHaveLength(1);
  expect(gonderilen[0].onay.imzaAktarimIzni).toBe(true);
  expect(gonderilen[0].gorseller.imza).toMatch(/^data:image\/png;base64,/);
});

test('Sihirbazdaki gizli adımlar yanlışlıkla form göndermez; gönderim tüm grupları doğrular', async ({ page }) => {
  const gonderimler = [];
  await page.route('**/macros/**', route => {
    if (route.request().method() === 'POST') gonderimler.push(route.request().postData());
    return route.fulfill({ json: { ok: true, surum: 27, ihtidaPaketHazir: true } });
  });
  await page.goto('/tr/ihtida-basvurusu/');
  await expect(form(page).locator('button[type="submit"]:visible')).toHaveCount(0);
  await page.locator('#i-ad').press('Enter');
  expect(gonderimler).toHaveLength(0);
  await expect(page.locator('[data-basari]')).toBeHidden();

  await page.locator('[data-adim-sec="6"]').click();
  await form(page).locator('button[type="submit"]:visible').click();
  expect(gonderimler).toHaveLength(0);
  // Toplu doğrulama ilk eksik grubu açar; hata gizli bir adımda bırakılmaz.
  await aktifGrubuDogrula(page, 0);
  await expect(page.locator('#i-ad')).toBeFocused();
});

test('Azaltılmış hareket tercihiyle adım değişimi odağı ve ilerlemeyi korur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tr/ihtida-basvurusu/');
  await page.locator('[data-adim-sec="4"]').click();
  await aktifGrubuDogrula(page, 4);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
});
