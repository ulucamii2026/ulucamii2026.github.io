/** Mühtedi Hizmetleri Envanteri sayfası (/envanter/) — tarayıcı testleri (1 Ekim 2026).
 *
 *  Sayfanın ucu (`data-uc`) CANLI Apps Script'tir: bütün dış istekler kesilir ve GAS yalnız
 *  `page.route('**\/macros/**')` ile taklit edilir. Rotalar her zaman `page.goto`dan ÖNCE kurulur.
 *  Taklit sunucu gelen gövdeyi GERÇEK sözleşmeyle (src/lib/envanter/sozlesme.ts → dogrula) sınar.
 *  Bütün kişi verileri uydurmadır; görevli soyadı TESTOGLU'dur.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { dogrula, camiTablosu } from '../../src/lib/envanter/sozlesme.ts';

const kok = new URL('../../', import.meta.url);
const json = (yol) => JSON.parse(readFileSync(new URL(yol, kok), 'utf8'));
const CAMILER = camiTablosu(json('src/data/envanter-bolgeleri.json'), json('public/data/belcika-camileri.json'));
const TASLAK = 'ulucamii:envanter:v1';
const VERI_SORUMLUSU = 'Belçika Mühtedi Koordinatörlüğü (deneme)';
const SAGLIK_ACIK = { ok: true, servis: 'ulucamii-alici', surum: 42, envanter: { acik: true, veriSorumlusu: VERI_SORUMLUSU, kapanis: '2099-12-31' } };
const KAPALI_METIN = 'Form henüz açılmadı ya da kapandı. Bağlantı, Müşavirliğimizin duyurusuyla açılacaktır.';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => (new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient')));
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

/** GET → sağlık (ya da ağ hatası); POST → gövdeyi yakalar. */
async function gasTaklidi(page, saglik) {
  const durum = { saglik, gonderilen: [], yanit: null };
  await page.route('**/macros/**', (route) => {
    if (route.request().method() !== 'POST') {
      return durum.saglik === 'ag-hatasi' ? route.abort('failed') : route.fulfill({ json: durum.saglik });
    }
    const govde = route.request().postDataJSON();
    durum.gonderilen.push(govde);
    return route.fulfill({ json: durum.yanit ?? { ok: true, ref: 'EV-2099-0001' } });
  });
  return durum;
}

async function acikSayfa(page) {
  const gas = await gasTaklidi(page, SAGLIK_ACIK);
  await page.goto('/envanter/');
  await expect(page.locator('form[data-form="envanter"]')).toBeVisible();
  // Bütün bölümler tek sayfada: doldurma adım geçişlerinden bağımsız olsun.
  await page.locator('[data-adim-tumu]').click();
  return gas;
}

async function kisiDoldur(satir, { cinsiyet = 'kadin', dil = 'fr', yil = '2025', belge = 'aldi' } = {}) {
  await satir.locator('select[name$=".cinsiyet"]').selectOption(cinsiyet);
  await satir.locator('select[name$=".dil"]').selectOption(dil);
  await satir.locator('select[name$=".ihtidaYili"]').selectOption(yil);
  await satir.locator('select[name$=".belge"]').selectOption(belge);
}

test('Kapalı, eski sürüm ya da erişilemeyen servis: form oluşmaz, kapalı iletisi görünür, POST yok', async ({ page }) => {
  for (const saglik of [
    { ...SAGLIK_ACIK, envanter: { acik: false, veriSorumlusu: null, kapanis: null } },
    { ...SAGLIK_ACIK, surum: 41 },
    { ...SAGLIK_ACIK, envanter: { acik: true, veriSorumlusu: '', kapanis: null } },
    'ag-hatasi',
  ]) {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    const gas = await gasTaklidi(page, saglik);
    await page.goto('/envanter/');
    const kapali = page.locator('[data-durum-kapali]');
    await expect(kapali).toBeVisible();
    await expect(kapali).toHaveText(KAPALI_METIN);
    await expect(page.locator('[data-durum-yukleniyor]')).toBeHidden();
    await expect(page.locator('form[data-form="envanter"]')).toHaveCount(0);
    expect(gas.gonderilen, JSON.stringify(saglik)).toHaveLength(0);
  }
});

test('Geçici sağlık ağı hatası bir kez yeniden denenir; form açılır, POST yapılmaz', async ({ page }) => {
  let istek = 0;
  await page.route('**/macros/**', (route) => {
    expect(route.request().method()).toBe('GET');
    istek++;
    return istek === 1 ? route.abort('failed') : route.fulfill({ json: SAGLIK_ACIK });
  });
  await page.goto('/envanter/');
  await expect(page.locator('form[data-form="envanter"]')).toBeVisible();
  await expect(page.locator('[data-veri-sorumlusu]')).toHaveText(VERI_SORUMLUSU);
  expect(istek).toBe(2);
});

test('Geçici sağlık sunucusu hatası bir kez yeniden denenir; gerçek kapalı yanıt açılmaz', async ({ page }) => {
  let istek = 0;
  await page.route('**/macros/**', (route) => {
    expect(route.request().method()).toBe('GET');
    istek++;
    return istek === 1 ? route.fulfill({ status: 503, body: 'Geçici hata' })
      : route.fulfill({ json: { ...SAGLIK_ACIK, envanter: { acik: false, veriSorumlusu: null, kapanis: null } } });
  });
  await page.goto('/envanter/');
  await expect(page.locator('[data-durum-kapali]')).toBeVisible();
  await expect(page.locator('form[data-form="envanter"]')).toHaveCount(0);
  expect(istek).toBe(2);
});

test('Açıkken: asgari geçerli form, iki adlı satır (biri gizli), biri kaldırılır; izin zorunlu; gövde şekli ve taslak', async ({ page }) => {
  const gas = await acikSayfa(page);
  await expect(page.locator('[data-veri-sorumlusu]')).toHaveText(VERI_SORUMLUSU);

  await page.locator('#env-onay-bilgi').check();
  await page.locator('#env-onay-izin').check();
  await page.locator('#env-ad').fill('Deniz TESTOGLU');
  await page.locator('#env-bolge').selectOption('Namur');
  await page.locator('#env-cami').selectOption('ulucamii-marche');
  await page.locator('#env-statu').selectOption('baokk');
  await page.locator('#env-telefon').fill('0470000000');
  await page.locator('#env-s-ihtida-2026-kadin').fill('2');
  await page.locator('#env-d-konyaIsteyen').fill('1');

  const ekle = page.locator('[data-kisi-ekle]');
  const satirlar = page.locator('[data-kisi]');
  await ekle.click();
  await ekle.click();
  await ekle.click();
  await expect(satirlar).toHaveCount(3);
  await expect(page.locator('[data-kisi-sayac]')).toHaveText('3 / 40 kişi');

  // 1. satır: önce ad yazılır, sonra gizli/kodlu işaretlenir → ad temizlenir ve gizlenir.
  const s1 = satirlar.nth(0);
  await s1.locator('input[name$=".ad"]').fill('Silinmesi Gereken Ad');
  await s1.locator('[data-kisi-gizli]').check();
  await expect(s1.locator('input[name$=".ad"]')).toBeHidden();
  await expect(s1.locator('input[name$=".ad"]')).toHaveValue('');
  await s1.locator('input[name$=".kod"]').fill('KOD-1');
  await kisiDoldur(s1);
  await s1.locator('input[name$=".izin"]').check();

  // 2. satır kaldırılır; başlıklar yeniden numaralanır.
  await satirlar.nth(1).locator('[data-kisi-kaldir]').click();
  await expect(satirlar).toHaveCount(2);
  await expect(satirlar.nth(1).locator('[data-kisi-baslik]')).toHaveText('Kişi 2');

  const s2 = satirlar.nth(1);
  await s2.locator('input[name$=".ad"]').fill('Jan Peeters');
  await s2.locator('input[name$=".eposta"]').fill('jan@example.test');
  await kisiDoldur(s2, { cinsiyet: 'erkek', dil: 'nl', yil: '2021-oncesi', belge: 'istiyor' });

  // İzin işaretlenmeden gönderilemez.
  await page.locator('button[type=submit]').click();
  await expect(s2.locator('input[name$=".izin"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(s2.locator('.hata').last()).toContainText('İzni olmayan kişi yazılamaz');
  expect(gas.gonderilen).toHaveLength(0);

  // Taslakta adlı bildirim, aday ve onay alanları YOK; görevli bilgileri var.
  await expect.poll(async () => page.evaluate((k) => localStorage.getItem(k), TASLAK)).not.toBeNull();
  const taslak = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), TASLAK));
  const adlar = Object.keys(taslak.alanlar);
  expect(adlar.filter((a) => a.startsWith('kisiler.') || a.startsWith('onay.') || a.startsWith('aday.a.'))).toEqual([]);
  expect(taslak.alanlar['gorevli.ad']).toBe('Deniz TESTOGLU');
  expect(JSON.stringify(taslak)).not.toContain('Jan Peeters');
  expect(JSON.stringify(taslak)).not.toContain('KOD-1');

  await s2.locator('input[name$=".izin"]').check();
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
  await expect(page.locator('[data-basari] [data-ref]')).toHaveText('EV-2099-0001');
  await expect(page.locator('[data-basari] a[href="/tr/ihtida-basvurusu/"]')).toBeVisible();

  expect(gas.gonderilen).toHaveLength(1);
  const g = gas.gonderilen[0];
  expect(g).toMatchObject({
    tur: 'envanter', formSurumu: 1, onaySurumu: 'envanter-bilgilendirme-v1', web: '',
    onay: { bilgilendirme: true, izin: true },
    gorevli: { ad: 'Deniz TESTOGLU', bolge: 'Namur', cami: 'ulucamii-marche', statu: 'baokk', telefon: '+32470000000', eposta: '', diller: [] },
  });
  expect(g.gonderimAnahtari).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
  expect(g.sayilar.ihtida['2026']).toEqual({ kadin: 2, erkek: null });
  expect(g.durum.konyaIsteyen).toBe(1);
  expect(g.kisiler).toHaveLength(2);
  expect(g.kisiler[0]).toEqual({ gizli: true, kod: 'KOD-1', ad: '', telefon: '', eposta: '', cinsiyet: 'kadin', dogumYili: null,
    dil: 'fr', ihtidaYili: '2025', belge: 'aldi', izin: true });
  expect(g.kisiler[1]).toMatchObject({ gizli: false, kod: '', ad: 'Jan Peeters', eposta: 'jan@example.test', izin: true });
  expect(JSON.stringify(g)).not.toContain('Silinmesi Gereken Ad');
  expect(g.aday.a).toEqual({ var: '' });
  // Gövde gerçek sunucu sözleşmesinden geçer.
  const sonuc = dogrula(g, CAMILER, new Date().getFullYear());
  expect(sonuc.ok, JSON.stringify(sonuc)).toBe(true);
  // Başarıdan sonra taslak silinir.
  expect(await page.evaluate((k) => localStorage.getItem(k), TASLAK)).toBeNull();
});

test('Bölge seçimi cami listesini süzer; bölge değişince seçim sıfırlanır; «Listede yok» serbest ad ister', async ({ page }) => {
  await acikSayfa(page);
  const cami = page.locator('#env-cami');
  await expect(cami.locator('option')).toHaveCount(1);
  await page.locator('#env-bolge').selectOption('Gent');
  const gent = CAMILER.filter((c) => c.bolge === 'Gent');
  await expect(cami.locator('option')).toHaveCount(gent.length + 2);
  await cami.selectOption(gent[0].id);
  await page.locator('#env-bolge').selectOption('Liège');
  await expect(cami).toHaveValue('');
  await expect(page.locator('#env-ac-cami option')).toHaveCount(CAMILER.filter((c) => c.bolge === 'Liège').length + 1);
  await expect(page.locator('#env-cami-serbest')).toBeHidden();
  await cami.selectOption('listede-yok');
  await expect(page.locator('#env-cami-serbest')).toBeVisible();
});

test('noindex, kanonik ve hreflang bağlantısı yok; menüde ve site haritasında yok; sayfada telefon numarası yok', async ({ page }) => {
  await gasTaklidi(page, { ...SAGLIK_ACIK, envanter: { acik: false, veriSorumlusu: null, kapanis: null } });
  await page.goto('/envanter/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText('Mühtedi Hizmetleri Envanteri — din görevlileri için');
  await expect(page.locator('a[href*="wa.me/"]').first()).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/tel:/);
  expect(html).not.toMatch(/\+\d[\d\s.()-]{7,}\d/);
  expect(html).not.toContain('"telephone"');

  await page.goto('/tr/');
  await expect(page.locator('a[href*="/envanter"]')).toHaveCount(0);

  const dist = new URL('dist/', kok);
  const haritalar = readdirSync(dist).filter((f) => /^sitemap.*\.xml$/.test(f));
  expect(haritalar.length).toBeGreaterThan(0);
  for (const f of haritalar) expect(readFileSync(new URL(f, dist), 'utf8')).not.toContain('/envanter/');
});
