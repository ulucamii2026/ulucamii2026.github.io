import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brukselTarih } from '../../src/lib/namaz.ts';
import { hicriCevir } from '../../src/i18n/hicri.ts';

/* Cami ekranı (/ekran/, docs/EKRAN-FAZ1-UYGULAMA-PLANI.md). Tuval dikey 1080×1920; kutu yatay sinyal
   verdiğinde ?don=90. Saat page.clock ile kurulur. Testler bilerek New York saat diliminde koşar:
   ekran cihazın saat diliminden bağımsız olarak Brüksel saatini göstermeli. Vakit akışı derleme gününe
   bağlı kalmasın diye kaynak Diyanet dosyasından verilir. */
test.use({ viewport: { width: 1080, height: 1920 }, timezoneId: 'America/New_York', locale: 'en-US' });

const kaynak = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/namaz-vakitleri.json'), 'utf8'));
const vakitAkisi = (gunler = kaynak.gunler) => ({ kaynak: kaynak.kaynak, kaynakTuru: 'diyanet', ilce: '11890', ilceAdi: kaynak.ilceAdi, guncelleme: kaynak.guncelleme, gunler, atlanan: [] });
const cumaMi = (g) => new Date(g.tarih + 'T12:00:00Z').getUTCDay() === 5;
const ornek = kaynak.gunler.find((g, i) => i >= 2 && !cumaMi(g));
const an = (g, hm, dkFark = 0) => new Date(brukselTarih(g.tarih, hm).getTime() + dkFark * 60_000);
/* Vakit akışı adresi sorgu dizesinden bağımsız eşlenir: SW kurulumda kabuk dosyalarını ?v=<damga> ile ister
   (src/ekran/sw.ts), "internetsiz açılış" testleri önbellekteki kopyanın bu taklitten gelmesine dayanır. */
const VAKIT_AKISI = (u) => u.pathname === '/ekran/vakitler.json';
const ayAdi = (t, yerel) => new Intl.DateTimeFormat(yerel, { timeZone: 'Europe/Brussels', month: 'long' }).format(t);

test.beforeEach(async ({ context }) => {
  test.skip(test.info().project.name !== 'masaustu-chromium', 'ekran testleri tek tarayıcı projesinde koşar');
  // Ağ yalıtımı (depodaki öteki web testleriyle aynı): 4401 dışındaki HTTP ve WebSocket kesilir.
  // Open-Meteo'nun anahtarsız API'si burada sabit bir yanıtla taklit edilir (18.6°C → yuvarlanınca 19°C,
  // kod 61 → yağmur simgesi); testler bunu ezmek isterse sonradan eklenen route öncelik kazanır.
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'api.open-meteo.com') return route.fulfill({ json: { current: { temperature_2m: 18.6, weather_code: 61 } } });
    return u.origin === 'http://127.0.0.1:4401' || u.origin === 'http://localhost:4401' ? route.continue() : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
  await context.route(VAKIT_AKISI, (route) => route.fulfill({ json: vakitAkisi() }));
});

test('kimlik, saat, miladi ve hicrî tarih Brüksel saatine göre yazılır', async ({ page }) => {
  const t = an(ornek, '12:00');
  await page.clock.install({ time: t });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="cami-tr"]')).toHaveText('Marche-en-Famenne Ulu Camii');
  await expect(page.locator('[data-alan="saat"]')).toHaveText(/^12:00:0\d$/);
  await expect(page.locator('[data-alan="tarih-tr"]')).toContainText(ayAdi(t, 'tr-TR'));
  await expect(page.locator('[data-alan="tarih-fr"]')).toContainText(ayAdi(t, 'fr-BE'));
  await expect(page.locator('[data-alan="hicri-tr"]')).toHaveText(ornek.hicri);
  // Miladi ile hicrî tarih arasındaki "·" ayıracı CSS'ten gelir (hicrî kısım boşsa asılı kalmasın diye).
  expect(await page.locator('[data-alan="hicri-tr"]').evaluate((e) => getComputedStyle(e, '::before').content)).toBe('" · "');
});

test('gece yarısı ve yaz saatinin bitişi sayfa yenilenmeden işlenir', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-24T23:59:50+02:00') });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="tarih-tr"]')).toContainText('24 Ekim 2026');
  await page.clock.runFor(20_000);
  await expect(page.locator('[data-alan="tarih-tr"]')).toContainText('25 Ekim 2026');
  await page.clock.setSystemTime(new Date('2026-10-25T00:59:58Z'));
  await page.clock.runFor(4_000);
  await expect(page.locator('[data-alan="saat"]')).toHaveText(/^02:00:0\d$/);
});

test('saat pilsiz kutuda 1970e dönmüşse vakit yerine uyarı gösterilir', async ({ page }) => {
  await page.clock.install({ time: new Date(0) });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="saat"]')).toContainText('Saat doğrulanıyor');
  // Vakit alanı da "saat doğrulanıyor" durumunda: hiçbir günün vakti, vurgu ya da geri sayım gösterilmez.
  await expect(page.locator('.vakit-yok b')).toHaveText('Saat doğrulanıyor');
  await expect(page.locator('.vakit-yok .fr')).toHaveText('Vérification de l’heure…');
  await expect(page.locator('.vakit')).toHaveCount(0);
  await expect(page.locator('.geri-sayim')).toHaveCount(0);
  // Tarih ve hicrî tarih boş: aradaki "·" ayıracı tek başına asılı kalmaz.
  await expect(page.locator('.takvim').first()).toHaveText('');
  await expect(page.locator('.takvim.fr')).toHaveText('');
});

/* Sayfa verisi (#ekran-veri) bozuk ya da hiç yoksa (ör. önbellekteki eski iskelet ile yeni paket) açılış çökmez:
   saat ve Diyanet vakitleri yine çalışır. Vakit adları ekranın kendi güvenli varsayılanından gelir
   (src/ekran/metinler.ts → VAKIT_ADLARI): geri sayım "undefined vaktine 30 dk" yazmaz. */
const sayfaVerisiDegistir = (degistir) => async (route) => {
  const yanit = await route.fetch();
  await route.fulfill({ response: yanit, body: degistir(await yanit.text()) });
};
for (const [durum, degistir] of [
  ['bozuk', (html) => html.replace(/(<script[^>]*id="ekran-veri"[^>]*>)[\s\S]*?(<\/script>)/, '$1{bozuk$2')],
  ['eksik', (html) => html.replace(/<script[^>]*id="ekran-veri"[^>]*>[\s\S]*?<\/script>/, '')],
]) {
  test(`sayfa verisi ${durum} olsa da ekran açılır: saat, vakitler ve iki dilli geri sayım çalışır`, async ({ page }) => {
    await page.route('**/ekran/', sayfaVerisiDegistir(degistir));
    await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
    await page.goto('/ekran/');
    await expect(page.locator('[data-alan="saat"]')).toHaveText(/^\d\d:\d\d:\d\d$/);
    await expect(page.locator('.vakit')).toHaveCount(6);
    await expect(page.locator('.vakit[data-vakit="ogle"] .deger')).toHaveText(ornek.ogle);
    await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Öğle');
    await expect(page.locator('.vakit[data-vakit="ogle"] .ad i')).toHaveText('Dhuhr');
    await expect(page.locator('.geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
    await expect(page.locator('.geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
  });
}

// Sayfa verisi geçerli ama vakit adları eksikse (elle bozulmuş iskelet) de ekranda "undefined" yazmaz: eksik ad
// anahtar anahtar ekranın güvenli varsayılanından (VAKIT_ADLARI) gelir.
test('sayfa verisinde vakit adları eksikse geri sayım "undefined" yazmaz, adı güvenli varsayılandan alır', async ({ page }) => {
  await page.route('**/ekran/', sayfaVerisiDegistir((html) => html.replace(/(<script[^>]*id="ekran-veri"[^>]*>)([\s\S]*?)(<\/script>)/, (_, ac, json, kapa) => ac + JSON.stringify({ ...JSON.parse(json), vakit: { tr: {}, fr: {} } }) + kapa)));
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Öğle');
  await expect(page.locator('.geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
  await expect(page.locator('[data-alan="vakitler"]')).not.toContainText('undefined');
});

test.describe('yatay sinyalde döndürme', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test('?don=90 dikey tuvali yatay ekrana taşmadan tam sığdırır', async ({ page }) => {
    await page.goto('/ekran/?don=90');
    const kutu = await page.locator('#ekran').boundingBox();
    expect(Math.round(kutu.width)).toBe(1920);
    expect(Math.round(kutu.height)).toBe(1080);
    expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([1920, 1080]);
  });
});

/* Tuval düzeni (src/ekran/olcek.ts): pencerenin (?don= ile döndürülmüş) alan oranı 1,2 ve üzerindeyse yatay 16:9, altındaysa
   dikey 9:16; ?duzen=yatay|dikey zorlar, geçersiz değer otomatik seçim demektir. Bu bloklar yalnız tuvalin geometrisini
   sınar: data-duzen, kutu ve --u (dikeyde tuval genişliğinin, yatayda yüksekliğinin %1'i). */
const ekranKutusu = (page) => page.locator('#ekran').boundingBox();
const birimOku = (page) => page.locator('#ekran').evaluate((e) => getComputedStyle(e).getPropertyValue('--u').trim());
const kutuBoyutu = async (page) => {
  const kutu = await ekranKutusu(page);
  return [Math.round(kutu.width), Math.round(kutu.height)];
};

test.describe('yatay düzen: tuval, 1920×1080 pencere', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('yatay pencerede düzen yatay olur; tuval pencereyi taşmadan tam kaplar, u yüksekliğin %1’idir', async ({ page }) => {
    await page.goto('/ekran/');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    const kutu = await ekranKutusu(page);
    expect(kutu.x).toBeCloseTo(0, 1);
    expect(kutu.y).toBeCloseTo(0, 1);
    expect(Math.round(kutu.width)).toBe(1920);
    expect(Math.round(kutu.height)).toBe(1080);
    expect(await birimOku(page)).toBe('10.8px');
    expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([1920, 1080]);
  });

  test('?duzen=dikey yatay pencerede dikey tuvali ortalar; u tuval genişliğinin %1’idir', async ({ page }) => {
    await page.goto('/ekran/?duzen=dikey');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'dikey');
    const kutu = await ekranKutusu(page);
    expect(kutu.width).toBeCloseTo(607.5, 0); // ±0,5
    expect(kutu.x).toBeCloseTo(656.25, 0);
    expect(Math.round(kutu.height)).toBe(1080);
    expect(await birimOku(page)).toBe('6.075px');
  });

  test('?duzen= geçersizse (abc) otomatik seçim: yatay pencerede yatay', async ({ page }) => {
    await page.goto('/ekran/?duzen=abc');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    expect(await kutuBoyutu(page)).toEqual([1920, 1080]);
  });

  test('pencere yeniden boyutlanınca düzen sayfa yenilenmeden değişir: yatay → dikey → yatay', async ({ page }) => {
    await page.goto('/ekran/');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    await page.setViewportSize({ width: 1080, height: 1920 });
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'dikey');
    await expect.poll(() => kutuBoyutu(page)).toEqual([1080, 1920]);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    await expect.poll(() => kutuBoyutu(page)).toEqual([1920, 1080]);
  });

  test('yeniden boyutlanınca main.ts’teki geri çağrı çalışır: tarih bloğu yeniden çizilir', async ({ page }) => {
    const t = an(ornek, '12:00');
    await page.clock.install({ time: t });
    await page.goto('/ekran/');
    await expect(page.locator('[data-alan="tarih-tr"]')).toContainText(ayAdi(t, 'tr-TR'));
    // İlk veri tazelemesi bitmeden tarihi silmek testi yanlış nedenle geçirirdi: tazeleme tarihi kendisi yeniden yazar.
    await expect(page.locator('.vakit')).toHaveCount(6);
    // Dakika değişmediği sürece tarihi yalnız bu geri çağrı (dakikalik) yeniden yazabilir.
    await page.locator('[data-alan="tarih-tr"]').evaluate((e) => { e.textContent = ''; });
    await page.setViewportSize({ width: 1080, height: 1920 });
    await expect(page.locator('[data-alan="tarih-tr"]')).toContainText(ayAdi(t, 'tr-TR'));
  });

  test('yeniden boyutlanınca main.ts’teki geri çağrı slaytı yeniden sığdırır (sigdir)', async ({ page }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    const slayt = page.locator('[data-alan="slayt"]');
    await expect(slayt).not.toBeEmpty(); // ilk slayt çizildi
    await page.evaluate(() => document.fonts.ready.then(() => undefined)); // geç gelen yazı tipi sigdir'i sonradan tetiklemesin
    // sigdir'in basamakları 1, 0,9, 0,81… hiçbir zaman 0,5 vermez; bu değeri yalnız geri çağrının sigdir'i silebilir.
    await slayt.evaluate((e) => e.style.setProperty('--olcek', '0.5'));
    await page.setViewportSize({ width: 1080, height: 1920 });
    await expect.poll(() => slayt.evaluate((e) => e.style.getPropertyValue('--olcek'))).not.toBe('0.5');
  });
});

test.describe('yatay düzen: tuval, 1080×1920 pencere', () => {
  test.use({ viewport: { width: 1080, height: 1920 } });

  test('dikey pencerede düzen dikey kalır: tuval pencereyi tam kaplar', async ({ page }) => {
    await page.goto('/ekran/');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'dikey');
    expect(await kutuBoyutu(page)).toEqual([1080, 1920]);
    expect(await birimOku(page)).toBe('10.8px');
  });

  test('?duzen=yatay dikey pencerede yatay tuvali genişliğe yaslar ve dikeyde ortalar', async ({ page }) => {
    await page.goto('/ekran/?duzen=yatay');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    const kutu = await ekranKutusu(page);
    expect(Math.round(kutu.width)).toBe(1080);
    expect(kutu.height).toBeCloseTo(607.5, 0);
    expect(kutu.y).toBeCloseTo(656.25, 0);
    expect(await birimOku(page)).toBe('6.075px');
  });

  test('?don=90 dikey pencereyi yatay alana çevirir: düzen yatay, döndürülmüş tuval pencereyi tam kaplar', async ({ page }) => {
    await page.goto('/ekran/?don=90');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    const kutu = await ekranKutusu(page);
    expect(kutu.x).toBeCloseTo(0, 1);
    expect(kutu.y).toBeCloseTo(0, 1);
    expect(Math.round(kutu.width)).toBe(1080);
    expect(Math.round(kutu.height)).toBe(1920);
    expect(await birimOku(page)).toBe('10.8px');
    expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([1080, 1920]);
  });
});

test.describe('yatay düzen: tuval, 961×541 pencere (Polaroid TV)', () => {
  test.use({ viewport: { width: 961, height: 541 } });

  test('16:9 yuvarlaması alanı 1 pikselden az açıkta bırakırsa tuval alana yapışır, u = 5.41px', async ({ page }) => {
    await page.goto('/ekran/');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    const kutu = await ekranKutusu(page);
    expect(kutu.x).toBeCloseTo(0, 3);
    expect(kutu.y).toBeCloseTo(0, 3);
    expect(kutu.width).toBeCloseTo(961, 3); // 541 yerine 540,5625 kalsaydı alt-piksellik siyah çizgi görünürdü
    expect(kutu.height).toBeCloseTo(541, 3);
    expect(await birimOku(page)).toBe('5.41px');
  });
});

/* Yatay düzende sıradaki vakit satırı büyük blok olur ve geri sayımı kendi içinde taşır; yatsıdan sonra blok yarının
   imsakını gösterir. Burada yalnız DOM ve metin denetlenir (görünüm ekran.css'te). Yatsıdan sonraki durum için sonraki
   kaydı takvimde ertesi gün olan ve imsakı yarınkinden farklı bir gün seçilir; gece yarısına taşmaması için yatsı 23:00'ten önce olmalı. */
const ertesiGun = (g) => new Date(new Date(g.tarih + 'T12:00:00Z').getTime() + 86_400_000).toISOString().slice(0, 10);
const yatsiGunu = kaynak.gunler.find((g, i, t) => !cumaMi(g) && t[i + 1] && t[i + 1].tarih === ertesiGun(g) && t[i + 1].imsak !== g.imsak && g.yatsi < '23:00');

test.describe('yatay düzen: sıradaki vakit bloğu', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('geri sayım sıradaki vakit satırının içindedir; vakit alanında ayrı geri sayım kalmaz', async ({ page }) => {
    await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
    await page.goto('/ekran/');
    await expect(page.locator('.vakit')).toHaveCount(6);
    await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'ogle');
    await expect(page.locator('.vakit.siradaki .geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
    await expect(page.locator('.vakit.siradaki .geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
    await expect(page.locator('.geri-sayim')).toHaveCount(1);
    await expect(page.locator('.vakitler > .geri-sayim')).toHaveCount(0);
  });

  test('yatsıdan sonra sıradaki blok yarının imsakıdır: saat, «Yarın · Demain» etiketi ve geri sayım', async ({ page }) => {
    expect(yatsiGunu, 'veride uygun gün bulunamadı').toBeTruthy();
    const yarin = kaynak.gunler[kaynak.gunler.indexOf(yatsiGunu) + 1];
    await page.clock.install({ time: an(yatsiGunu, yatsiGunu.yatsi, 30) });
    await page.goto('/ekran/');
    await expect(page.locator('.vakit')).toHaveCount(6);
    const blok = page.locator('.vakit.siradaki');
    await expect(blok).toHaveAttribute('data-vakit', 'imsak');
    await expect(blok.locator('.deger')).toHaveText(yarin.imsak);
    await expect(blok.locator('.yarin span').first()).toHaveText('Yarın');
    await expect(blok.locator('.yarin .fr')).toHaveText('Demain');
    await expect(blok.locator('.yarin .fr')).toHaveAttribute('lang', 'fr');
    await expect(blok.locator('.geri-sayim b')).toContainText(/^İmsak vaktine/);
    await expect(page.locator('.geri-sayim')).toHaveCount(1);
    await expect(page.locator('.vakitler > .geri-sayim')).toHaveCount(0);
  });

  test('gün içinde «Yarın» etiketi çıkmaz', async ({ page }) => {
    await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
    await page.goto('/ekran/');
    await expect(page.locator('.vakit.siradaki')).toHaveCount(1);
    await expect(page.locator('.yarin')).toHaveCount(0);
  });

  test('veri boşluğunda (yarının kaydı eksik) yatsıdan sonra blok ve etiket çıkmaz, geri sayım vakit alanında kalır', async ({ page }) => {
    await page.route('**/ekran/vakitler.json', (r) => r.fulfill({ json: vakitAkisi([ornek]) }));
    await page.clock.install({ time: an(ornek, ornek.yatsi, 30) });
    await page.goto('/ekran/');
    await expect(page.locator('.vakit')).toHaveCount(6);
    await expect(page.locator('.vakit.siradaki')).toHaveCount(0);
    await expect(page.locator('.yarin')).toHaveCount(0);
    await expect(page.locator('.geri-sayim')).toHaveCount(1);
    await expect(page.locator('.vakitler > .geri-sayim')).toHaveCount(1);
  });

  test('yatsıdan sonra pencere dikeye dönünce blok kalkar, geri sayım vakit alanına iner; yataya dönünce geri gelir', async ({ page }) => {
    await page.clock.install({ time: an(yatsiGunu, yatsiGunu.yatsi, 30) });
    await page.goto('/ekran/');
    await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'imsak');
    await page.setViewportSize({ width: 1080, height: 1920 });
    await expect(page.locator('.vakit.siradaki')).toHaveCount(0);
    await expect(page.locator('.vakitler > .geri-sayim b')).toContainText(/^İmsak vaktine/);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'imsak');
    await expect(page.locator('.vakitler > .geri-sayim')).toHaveCount(0);
  });
});

test('dikey düzende yatsıdan sonra vurgu ve «Yarın» etiketi çıkmaz, geri sayım vakit alanında kalır (yarının imsakı)', async ({ page }) => {
  await page.clock.install({ time: an(yatsiGunu, yatsiGunu.yatsi, 30) });
  await page.goto('/ekran/');
  await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'dikey');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit.siradaki')).toHaveCount(0);
  await expect(page.locator('.yarin')).toHaveCount(0);
  await expect(page.locator('.vakitler > .geri-sayim b')).toContainText(/^İmsak vaktine/);
});

test('sıradaki vakit vurgulanır, geri sayım iki dilde yazılır', async ({ page }) => {
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'ogle');
  await expect(page.locator('.vakit[data-vakit="ogle"] .deger')).toHaveText(ornek.ogle);
  await expect(page.locator('.geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
});

test('imsak ile güneş arasında güneş vurgulanır ve güneşe kalan süre iki dilde yazılır', async ({ page }) => {
  await page.clock.install({ time: an(ornek, ornek.gunes, -15) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'gunes');
  await expect(page.locator('.geri-sayim b')).toHaveText('Güneş vaktine 15 dk');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Lever du soleil dans 15 min');
});

test('Cuma günü öğle satırı ve geri sayım Cuma olarak yazılır', async ({ page }) => {
  const cuma = kaynak.gunler.find(cumaMi);
  test.skip(!cuma, 'veride Cuma yok');
  await page.clock.install({ time: an(cuma, cuma.ogle, -90) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Cuma');
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad i')).toHaveText('Vendredi');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Prière du vendredi dans 1 h 30');
});

/* Site ile aynı kural (src/components/NamazVakitleri.tsx): site.yaml → cumaSaati doluysa öğle hücresi öğle kalır,
   Cuma saati ayrıca yazılır. Sayfa verisine (#ekran-veri) derlemeyi değiştirmeden bir Cuma saati enjekte edilir. */
const cumaSaatiEkle = (saat) => async (route) => {
  const yanit = await route.fetch();
  const html = (await yanit.text()).replace(/(<script[^>]*id="ekran-veri"[^>]*>)([\s\S]*?)(<\/script>)/, (_, ac, json, kapa) => ac + JSON.stringify({ ...JSON.parse(json), cumaSaati: saat }) + kapa);
  await route.fulfill({ response: yanit, body: html });
};

test('sitede Cuma saati girilmişse Cuma günü öğle satırı öğle kalır, geri sayımın altında Cuma namazı saati yazar', async ({ page }) => {
  const cuma = kaynak.gunler.find(cumaMi);
  test.skip(!cuma, 'veride Cuma yok');
  await page.route('**/ekran/', cumaSaatiEkle('13:30'));
  await page.clock.install({ time: an(cuma, cuma.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Öğle');
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad i')).toHaveText('Dhuhr');
  await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'ogle');
  await expect(page.locator('.geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
  await expect(page.locator('.cuma-saati b')).toHaveText('Cuma namazı 13:30');
  await expect(page.locator('.cuma-saati .fr')).toHaveText('Prière du vendredi 13:30');
  // Ek satır vakit alanından taşmaz.
  expect(await page.locator('[data-alan="vakitler"]').evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  if (process.env.EKRAN_GORSEL) await page.screenshot({ path: 'test-results/ekran-gorsel/cuma-saati.png', animations: 'disabled' });
});

test('Cuma saati girilmiş olsa da Cuma dışındaki günlerde ek satır çıkmaz', async ({ page }) => {
  await page.route('**/ekran/', cumaSaatiEkle('13:30'));
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Öğle');
  await expect(page.locator('.cuma-saati')).toHaveCount(0);
});

test('tema güneşten akşama açık, akşam vaktinden sonra koyu', async ({ page }) => {
  await page.clock.install({ time: an(ornek, ornek.aksam, -1) });
  await page.goto('/ekran/');
  await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'acik');
  await page.clock.runFor(2 * 60_000);
  await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'koyu');
});

test('bugünün Diyanet kaydı yoksa vakit yerine uyarı çıkar, geri sayım yapılmaz', async ({ page }) => {
  await page.route('**/ekran/vakitler.json', (r) => r.fulfill({ json: vakitAkisi(kaynak.gunler.filter((g) => g.tarih !== ornek.tarih)) }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit-yok b')).toHaveText('Namaz vakitleri güncellenemedi');
  await expect(page.locator('.vakit')).toHaveCount(0);
  await expect(page.locator('.geri-sayim')).toHaveCount(0);
  // Veri boşluğu günü hicrî tarih yok: miladi tarihten sonra asılı bir "·" kalmaz.
  await expect(page.locator('[data-alan="tarih-tr"]')).not.toBeEmpty();
  await expect(page.locator('.takvim').first()).not.toContainText('·');
});

test('bugünün kaydı var ama sıradaki vakit yok (yarının kaydı eksik)', async ({ page }) => {
  await page.route('**/ekran/vakitler.json', (r) => r.fulfill({ json: vakitAkisi([ornek]) }));
  await page.clock.install({ time: an(ornek, ornek.yatsi, 30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit.siradaki')).toHaveCount(0);
  await expect(page.locator('.geri-sayim')).toHaveText(''); // kutu çizilir ama içi boş kalır, geri sayım metni yok
  await expect(page.locator('.vakit-yok')).toHaveCount(0);
});

const SABIT_10SN = { tabanSn: 10, karakterSn: 0, enAzSn: 10, enCokSn: 10 };
const AKIS = (duyurular, slayt = SABIT_10SN) => ({ derleme: '', ayar: { slayt, gece: { kapanmaDk: 60, acilmaDk: 30 }, duyuruVarsayilanGun: 30 }, duyurular });
const DUYURU = (ek = {}) => ({ id: 'kermes', tur: 'duyuru', tr: { baslik: 'Hayır çarşısı', metin: 'Pazar günü öğleden sonra cami bahçesinde.' }, fr: { baslik: 'Kermesse', metin: 'Dimanche après-midi dans la cour de la mosquée.' }, baslangic: '2000-01-01', son: '2099-12-31', hedef: [], ...ek });
const ICERIK = { derleme: '', eksik: [],
  ayetler: [{ id: 'a1', referans: { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)' }],
  hadisler: [{ id: 'h1', ar: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', kaynak: 'Tirmizî, Birr, 36' }] };

test('slayt turu duyuru → günün ayeti → günün hadisi; TR ve FR alt alta', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU()]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toHaveText('Hayır çarşısı');
  await expect(slayt.locator('.slayt-duyuru p.fr').last()).toHaveText('Dimanche après-midi dans la cour de la mosquée.');
  await page.clock.runFor(10_500);
  await expect(slayt.locator('.slayt-ayet .ar')).toHaveAttribute('dir', 'rtl');
  await expect(slayt.locator('.slayt-ayet .kaynak')).toContainText('İnşirah, 94/5-6');
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-hadis p.fr')).toHaveText('Sourire à ton frère est pour toi une aumône.');
});

test('başka ekrana hedeflenmiş duyuru bu ekranda gösterilmez', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ hedef: ['giris'] })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/?ekran=kadin');
  await expect(page.locator('.slayt-ayet')).toBeVisible();
  await expect(page.locator('.slayt-duyuru')).toHaveCount(0);
});

test('uzun duyuru metni slayt alanından taşmaz', async ({ page }) => {
  const uzun = 'Cemaatimizin dikkatine: '.repeat(7).slice(0, 160);
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ tr: { baslik: 'Yıllık genel kurul toplantısı ve yönetim kurulu seçimi hakkında', metin: uzun }, fr: { baslik: 'Assemblée générale annuelle et élection du conseil d’administration', metin: uzun } })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
  expect(await page.locator('[data-alan="slayt"]').evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
});

// Sitede Cuma saati girilmişse Perşembe→Cuma gece yarısı vakit alanı Cuma satırı için 10u uzar, slayt alanı o kadar
// kısalır (ekran.css → .vakitler.cumali). Ekrandaki slayt yeni alana hemen yeniden sığdırılmalı; yoksa altı sonraki
// slayta dek (≤ 30 sn) kırpılırdı. Slayt bilerek uzun (TR ve FR metin 280'er karakter, bugünkü en uzun duyuru özeti
// kadar) ve 60 sn'lik: gece yarısı ekranda hâlâ aynı slayt vardır. Sahte saat slayt görününce durdurulur; gece yarısı
// makine yüküne değil runFor'a bağlı gelir.
test('Perşembe→Cuma gece yarısı Cuma satırı açılınca ekrandaki slayt yeni alana yeniden sığdırılır', async ({ page }) => {
  const cuma = kaynak.gunler.find(cumaMi);
  test.skip(!cuma, 'veride Cuma yok');
  const geceYarisi = an(cuma, '00:00').getTime();
  const uzun = 'Cemaatimizin dikkatine: '.repeat(12).slice(0, 280);
  await page.route('**/ekran/', cumaSaatiEkle('13:30'));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ tr: { baslik: 'Yıllık genel kurul toplantısı ve yönetim kurulu seçimi hakkında', metin: uzun }, fr: { baslik: 'Assemblée générale annuelle et élection du conseil d’administration', metin: uzun } })], { tabanSn: 60, karakterSn: 0, enAzSn: 60, enCokSn: 60 }) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: new Date(geceYarisi - 20_000) });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  const vakitler = page.locator('[data-alan="vakitler"]');
  await expect(slayt.locator('.slayt-duyuru')).toBeVisible();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2_000));
  await expect(vakitler).not.toHaveClass(/cumali/);
  // Testin kendi varsayımı: Perşembe ölçeğindeki slayt Cuma'nın kısalmış alanına sığmıyor olmalı; sığsaydı test
  // hiçbir şey kanıtlamazdı. Sınıf bir anlığına elle eklenip ölçülür, sonra geri alınır.
  const tasma = await page.evaluate(() => {
    const v = document.querySelector('[data-alan="vakitler"]');
    const s = document.querySelector('[data-alan="slayt"]');
    v.classList.add('cumali');
    const t = s.scrollHeight - s.clientHeight;
    v.classList.remove('cumali');
    return t;
  });
  expect(tasma).toBeGreaterThan(1);
  await page.clock.runFor(geceYarisi - (await page.evaluate(() => Date.now())) + 2_000);
  await expect(vakitler).toHaveClass(/cumali/);
  await expect(page.locator('.cuma-saati b')).toHaveText('Cuma namazı 13:30');
  await expect(slayt.locator('.slayt-duyuru')).toBeVisible(); // aynı slayt, sıradaki slayt değil
  expect(await slayt.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
});

test('akış bozulursa ekran son sağlam içerikle dönmeye devam eder', async ({ page }) => {
  let bozuk = false;
  await page.route('**/ekran/akis.json', (r) => (bozuk ? r.fulfill({ status: 500, body: 'hata' }) : r.fulfill({ json: AKIS([DUYURU()]) })));
  await page.route('**/ekran/icerik.json', (r) => (bozuk ? r.fulfill({ status: 200, contentType: 'application/json', body: '{bozuk' }) : r.fulfill({ json: ICERIK })));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
  bozuk = true;
  await page.clock.runFor(11 * 60_000);
  await expect(page.locator('[data-alan="slayt"] .slayt')).not.toHaveClass(/bos/);
  await expect(page.locator('.vakit')).toHaveCount(6);
});

// Faz 1 çıkış ölçütü (≤ 15 dk): duyuru akışı 3 dakikada bir yoklanır; duyuruları değişen akış gelince ekrandaki
// slayt normal biter, SONRAKİ slayt turu yeni duyurularla yeniden kurar. Eski tur bilerek uzun (20 duyuru × 10 sn =
// 200 sn): yeni duyuru 3 dk + bir slaytta ancak tur sonu beklenmeden yeniden kurulursa görünür. Yeni akışta tek
// duyuru var; yeniden kurulan tur hep onu gösterir, yani sonuç slayt evresine (fazına) bağlı değildir.
test('yeni duyuru en geç 3 dakika + bir slayt sonra ekrana gelir; tur sonu beklenmez', async ({ page }) => {
  const eskiDuyurular = Array.from({ length: 20 }, (_, i) => DUYURU({ id: 'd' + (i + 1), tr: { baslik: 'Duyuru ' + (i + 1), metin: 'Metin.' }, fr: undefined }));
  let govde = { ...AKIS(eskiDuyurular), derleme: 'derleme-1' };
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: govde }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: { derleme: '', eksik: [], ayetler: [], hadisler: [] } }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const baslik = page.locator('[data-alan="slayt"] .slayt-duyuru .baslik').first();
  await expect(baslik).toHaveText('Duyuru 1');
  // Sahte saat burada durdurulur: bundan sonra yalnız runFor ile ilerler. Durdurulmasaydı yoklama beklenirken ve
  // expect penceresinde gerçek zamanla akmaya devam ederdi; eski tur (yeniden kurma olmasa bile) Duyuru 1'den
  // 200 sn sonra kendiliğinden biter ve yük altındaki bir makinede gerileme yakalanmadan geçebilirdi.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2_000));
  // İmam yeni bir duyuru yayımladı: yeni derleme.
  govde = { ...AKIS([DUYURU({ id: 'mevlid', tr: { baslik: 'Mevlid programı', metin: 'Perşembe akşamı yatsıdan sonra.' }, fr: { baslik: 'Programme du Mawlid', metin: 'Jeudi soir après la prière de la nuit.' } })]), derleme: 'derleme-2' };
  // Eski 10 dakikalık aralıkta akis.json bu 3 dakikada hiç yeniden istenmez: bekleme zaman aşımıyla düşer.
  const yoklama = page.waitForResponse((y) => y.url().endsWith('/ekran/akis.json'), { timeout: 15_000 });
  await page.clock.runFor(3 * 60_000);
  await yoklama;
  await page.clock.runFor(10_000); // ekrandaki slayt normal biter (SABIT_10SN); sonraki slayt turu yeniden kurar
  await expect(baslik).toHaveText('Mevlid programı');
});

// `derleme` her yayında değişir (src/pages/ekran/akis.json.ts → derleme anı; günde 2–4 yayın). Duyurular aynı kaldıysa
// yeni derlemeli akış turu baştan başlatmamalı: tur yalnız duyuru içeriği değişince yeniden kurulur
// (src/ekran/veri.ts → duyuruAnahtari). Aynı 20 duyuruluk tur (200 sn) 3 dk + bir slayt sonra 20. duyurudadır;
// tur baştan başlasaydı yine "Duyuru 1" görünürdü.
test('duyurular aynıysa yalnız derleme damgası değişen akış slayt turunu baştan başlatmaz', async ({ page }) => {
  const duyurular = Array.from({ length: 20 }, (_, i) => DUYURU({ id: 'd' + (i + 1), tr: { baslik: 'Duyuru ' + (i + 1), metin: 'Metin.' }, fr: undefined }));
  let govde = { ...AKIS(duyurular), derleme: 'derleme-1' };
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: govde }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: { derleme: '', eksik: [], ayetler: [], hadisler: [] } }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const baslik = page.locator('[data-alan="slayt"] .slayt-duyuru .baslik').first();
  await expect(baslik).toHaveText('Duyuru 1');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2_000));
  // Yeni yayın (ör. başka bir sayfa düzeltildi) ama duyurular aynı: yalnız derleme damgası yeni.
  govde = { ...AKIS(duyurular), derleme: 'derleme-2' };
  const yoklama = page.waitForResponse((y) => y.url().endsWith('/ekran/akis.json'), { timeout: 15_000 });
  await page.clock.runFor(3 * 60_000);
  await yoklama;
  await page.clock.runFor(10_000);
  await expect(baslik).toHaveText('Duyuru 20');
});

// secim.ts'in "her döngü istisnadan sağ çıkar" kuralı (global-constraints.md) burada slayt turuna uygulanır:
// icerik.json'daki günün ayeti kaydı elle düzenlenmiş gibi `referans` alanı OLMADAN geliyor. slaytListesi
// (secim.ts) bu alana dokunmadığı için tur kurulurken patlamaz; ancak slaytCiz onu koşulsuz okur
// (`a.referans.tr`) ve tam o turda fırlar. Turun kendisi (main.ts → sonrakiSlayt) bu istisnayı yutup
// yeniden zamanlamalı: aksi halde ekran aylarca o karede donar. Malformasyon "duyuru" değil "ayet"
// üzerinden verildi çünkü slaytCiz'in duyuru dalındaki her alan okuması zaten `if (d.tr)`/`if (d.fr)` ile
// korunuyor (JSON'dan gelebilecek hiçbir ilkel değer orada gerçekten fırlatmıyor); ayet dalındaki
// `a.referans.tr` ise korumasız, yani eksik bir CMS kaydıyla gerçekten patlayan tek yer budur.
const ICERIK_BOZUK_AYET = { derleme: '', eksik: [],
  ayetler: [{ id: 'a1', ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)' }],
  hadisler: [{ id: 'h1', ar: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', kaynak: 'Tirmizî, Birr, 36' }] };

test('slayt çiziminde istisna çıkarsa tur donmaz; sonraki turda geçerli slayt yine görünür', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU()]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK_BOZUK_AYET }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toHaveText('Hayır çarşısı');
  // 1. tur (duyuru) 10 sn sürer; 2. tur (bozuk ayet) sırası gelince slaytCiz içinde fırlar.
  await page.clock.runFor(10_500);
  // Çizim `kok.textContent = ''` ile önceki slaytı sildikten SONRA fırladı: kutu o kare boş kalır,
  // yeni kart hiç eklenmedi. Bu, istisnanın gerçekten oradan geçtiğinin kanıtı.
  await expect(slayt.locator('.slayt')).toHaveCount(0);
  // Hatalı turdan sonraki bekleme brief'teki normal süre değil, sarmalayıcının 15 sn'lik varsayılanıdır
  // (sureMs, slaytSuresi(...) atamasına hiç ulaşmadan istisna fırlattı) — döngü yine de devam eder.
  await page.clock.runFor(15_000);
  await expect(slayt.locator('.slayt-hadis p.fr')).toHaveText('Sourire à ton frère est pour toi une aumône.');
});

// Son inceleme M2: bozuk bir `ayar.slayt` (ör. önbellekteki eski paket + yeni şemalı akış) süreyi NaN yapar;
// setTimeout(…, NaN) 0 ms demektir ve slaytlar durmadan yeniden çizilirdi. Süre korunur (en az 1 sn, yoksa 15 sn).
// Gözlem gerçek zamanla yapılır (sahte saat ilerletilmez): 0 ms döngüsü sahte saati hiç ilerletmeden döner.
test('bozuk slayt ayarı slaytı 0 ms döngüsüne sokmaz', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: { ...AKIS([DUYURU()]), ayar: { slayt: {}, gece: { kapanmaDk: 60, acilmaDk: 30 }, duyuruVarsayilanGun: 30 } } }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
  await page.evaluate(() => {
    window.__slaytDegisimi = 0;
    new MutationObserver((kayitlar) => { window.__slaytDegisimi += kayitlar.length; }).observe(document.querySelector('[data-alan="slayt"]'), { childList: true });
  });
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => window.__slaytDegisimi)).toBe(0);
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
});

test('duyuru görseli yüklenemezse gizlenir (kırık görsel simgesi kalmaz), metin yerinde kalır', async ({ page }) => {
  await page.route('**/media/duyurular/olmayan-kapak.webp', (r) => r.fulfill({ status: 404, body: '' }));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ gorsel: '/media/duyurular/olmayan-kapak.webp' })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const img = page.locator('.slayt-duyuru img');
  await expect(img).toHaveCount(1);
  await expect(img).toHaveCSS('display', 'none');
  await expect(page.locator('.slayt-duyuru .baslik').first()).toHaveText('Hayır çarşısı');
});

test.describe('internetsiz açılış', () => {
  test.use({ serviceWorkers: 'allow' });

  // Düzeltme turu 1 / F7: SW testleri artık gerçek takvime değil (bugünün Diyanet kaydı dolup taşabilir),
  // diğer testler gibi veriden seçilmiş sabit bir güne bağlı. page.clock yalnız SAYFANIN zamanlayıcılarını
  // sahteler (main.ts → saniyelik/veriDongusu); SW kendi gerçek setTimeout'unu kullanır, 10 sn'lik yarış
  // bundan etkilenmez. page.clock.install'ın page.reload() sonrasında da geçerli kaldığı elle doğrulandı
  // (rapora bkz.): sahte tarih reload sonrası hâlâ aynı, gerçek sistem saatinden farklı çıktı.
  test('internet kesilse de ekran son sağlam hâliyle açılır', async ({ page, context }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    await expect(page.locator('.vakit')).toHaveCount(6);
    // F8: beforeEach'teki vakitler.json mock'u context.setOffline(true) sırasında da "başarıyla" yanıtlar
    // (route.fulfill ağa hiç dokunmaz) — bu, SW'nin önbellek yolunu O kaynak için hiç sınamaz. unroute ile
    // kaldırılınca istek genel context.route('**/*', …) yoluna (route.continue) düşer, offline sırasında
    // GERÇEKTEN başarısız olur; SW'nin agOnce → caches.open(ONBELLEK) yoluna gerçekten muhtaç kalır.
    await context.unroute(VAKIT_AKISI);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.vakit')).toHaveCount(6);
    await expect(page.locator('[data-alan="saat"]')).toHaveText(/^\d\d:\d\d:\d\d$/);
    await context.setOffline(false);
  });

  // Kontrolör kuralı 1 (Görev 8) + düzeltme F9: Wi-Fi ayakta ama internet tıkandığında (taşıyıcı portalı,
  // yarım kalan DNS…) fetch() hiç çözülmeyebilir — context.setOffline(true) gibi net bir hata fırlatmaz,
  // sadece asılı kalır. sw.ts → agOnce ağ isteğini 10 sn'lik bir zamanlayıcıyla yarıştırır; zamanlayıcı
  // kazanırsa önbellekten yanıtlanır. Ağ isteği arka planda sürer; F9 artık bunun GERÇEKTEN gerçekleştiğini
  // (testin kendi varsayımı: istek context.route'a hiç düşmüş mü) ve geç gelen yanıtın sakla() ile
  // önbelleğe yazıldığını da doğruluyor.
  test('ağ askıda kalırsa vakitler ~10 sn içinde önbellekten gelir; geç gelen ağ yanıtı yine de önbelleğe yazılır', async ({ page, context }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    await expect(page.locator('.vakit')).toHaveCount(6);

    let vurus = 0;
    let tutulanRoute = null;
    // context.setOffline DEĞİL: gerçek bir kopukluk değil, hiç yanıt vermeyen bir bağlantı canlandırılıyor.
    // route.fulfill/abort/continue'dan hiçbiri hemen çağrılmaz — istek tarayıcı tarafında asılı kalır; route
    // nesnesi saklanır, testin sonunda "geç gelen yanıt" için elle yanıtlanacak.
    await context.route('**/ekran/vakitler.json', (route) => { vurus += 1; tutulanRoute = route; });

    const basla = Date.now();
    await page.reload();
    await expect(page.locator('.vakit')).toHaveCount(6, { timeout: 20_000 });
    const gecenMs = Date.now() - basla;

    // F9a: testin kendi varsayımını denetlemesi — istek gerçekten yukarıdaki route'a düşmüş mü? Düşmediyse
    // test SW'nin ağ davranışı hakkında hiçbir şey kanıtlamaz.
    expect(vurus).toBeGreaterThan(0);
    // F9b alt sınır: sonuç anında (mock'lanmış ağdan) değil, gerçekten ~10 sn'lik yarıştan sonra geldi.
    expect(gecenMs).toBeGreaterThanOrEqual(9_000);
    // F9b üst sınır: RED senaryosunda (yarış yok) satırlar sayfanın kendi 30 sn'lik zaman aşımına (veya
    // daha ötesine) kadar hiç çıkmaz; 20 sn hâlâ iki durumu net ayırır.
    expect(gecenMs).toBeLessThan(20_000);

    // F9c — Kural 1'in "ağ geç de gelse sakla() ile önbelleğe yazılır" şartı: tutulan isteği şimdi ayırt
    // edici bir imzayla yanıtla, SW'nin bunu GÜNCEL sürümün önbelleğine gerçekten yazdığını sayfa
    // tarafından (aynı orijindeki Cache Storage paylaşılır) doğrula.
    const imza = 'GEC-GELEN-' + Date.now();
    await tutulanRoute.fulfill({ json: { ...vakitAkisi(), imza } });
    await expect
      .poll(
        () => page.evaluate(async (yol) => {
          const yanit = await caches.match(yol, { ignoreSearch: true });
          if (!yanit) return null;
          const govde = await yanit.json();
          return govde.imza ?? null;
        }, '/ekran/vakitler.json'),
        { timeout: 5_000 },
      )
      .toBe(imza);
  });

  // Düzeltme F1: main.ts'teki `oncekiDenetci` Görev 8'de SABİT hesaplanıyordu — kutunun İLK kurulumunda
  // (henüz denetleyici yokken) hep false kalıyordu, bu yüzden SONRAKİ HİÇBİR güncelleme sayfayı bir daha
  // asla yenilemiyordu: yeni SW eski önbelleği çoktan silmiş olsa bile sayfa aylarca eski paketi belleğinden
  // çalıştırmaya devam ederdi (kutular aylarca yeniden başlatılmadığı için hiçbir düzeltme asla ekrana
  // ulaşmazdı). main.ts artık `denetciVardi`yı her controllerchange'te güncelliyor ve `yenileniyor` tek
  // seferlik koruması ile en fazla bir kez yeniliyor.
  test('yeni SW sürümü devraldığında sayfa bir kez yenilenir, ilk kurulumda yenilenmez', async ({ page }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await page.evaluate(() => { window.__isaret = 'ilk-yukleme'; });
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    await page.waitForTimeout(1_000); // ilk kurulum kendini yenilerse işaret burada zaten silinmiş olurdu
    expect(await page.evaluate(() => window.__isaret)).toBe('ilk-yukleme');

    const yenilemeBeklentisi = page.waitForEvent('framenavigated');
    // Farklı betik URL'si SW şartnamesine göre her zaman yeni bir worker kurar; statik sunucu sorgu
    // dizesini yok sayar (aynı public/ekran/sw.js dosyasını verir) — kontrolör talimatı F1 notu.
    await page.evaluate(() => navigator.serviceWorker.register('/ekran/sw.js?surum=2', { scope: '/ekran/' }));
    await yenilemeBeklentisi;

    expect(await page.evaluate(() => window.__isaret)).toBeUndefined();
    await expect(page.locator('.vakit')).toHaveCount(6);
  });

  // Düzeltme F3: agOnce eskiden HERHANGİ bir ÇÖZÜLEN fetch'i (5xx dâhil) başarı sayıyordu. GitHub Pages
  // kesintisinde (5xx) kutu, içinde ekran.js bile olmayan bir hata sayfasını önbelleğe alır ve ekran kendi
  // kendine bir daha asla toparlanamazdı; JSON akışları için de iyi veri önbellekte dururken
  // "güncellenemedi" yazardı. Artık yalnız ok ya da opaqueredirect (redirect modu manual olan gezinme
  // isteklerinde) başarı sayılır, geri kalanı önbelleğe düşer.
  // GitHub Pages'in CDN'i yayından hemen sonra eski ekran.js'i verebilir; yeni SW onu yeni damga altında saklarsa
  // eski paket bir sonraki ekran değişikliğine dek kalırdı. Kurulum her kabuk dosyasını ?v=<damga> ile (CDN'de hiç
  // görülmemiş adres) ister, önbelleğe asıl adresle yazar (src/ekran/sw.ts, onbellek.ts → surumluAdres).
  test('SW kurulumu kabuk dosyalarını sürümlü adresle ister, önbelleğe asıl adresle yazar', async ({ page, context }) => {
    const istenen = [];
    await context.route(/\/ekran\/ekran\.js\?v=/, (route) => { istenen.push(route.request().url()); return route.continue(); });
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    expect(istenen.length).toBeGreaterThan(0);
    for (const u of istenen) expect(new URL(u).search).toMatch(/^\?v=[0-9a-f]{16}$/);
    const kayitlar = await page.evaluate(async () => {
      const ad = (await caches.keys()).filter((a) => a.indexOf('ekran-') === 0)[0];
      return (await (await caches.open(ad)).keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search);
    });
    expect(kayitlar).toContain('/ekran/ekran.js');
    expect(kayitlar).toContain('/ekran/');
    expect(kayitlar.filter((u) => u.indexOf('v=') >= 0)).toEqual([]);
  });

  // Kurulum "ya hep ya hiç": kabuk dosyalarından biri tam gelmezse önbelleğe hiçbir şey yazılmaz ve SW kurulmaz;
  // yarım dolmuş bir önbellek hiçbir zaman etkinleşmez. Sayfa yine de ağdan açılır.
  test('kabuk dosyalarından biri alınamazsa SW kurulmaz, önbelleğe yarım kopya yazılmaz', async ({ page, context }) => {
    await context.route(/\/ekran\/ekran\.css\?v=/, (route) => route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' }));
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await expect(page.locator('.vakit')).toHaveCount(6);
    // İlk kurulum başarısız olunca kayıt temizlenir (etkin SW yok).
    await expect.poll(() => page.evaluate(async () => { const k = await navigator.serviceWorker.getRegistration('/ekran/'); return !!(k && k.active); }), { timeout: 10_000 }).toBe(false);
    await expect.poll(() => page.evaluate(async () => { const k = await navigator.serviceWorker.getRegistration('/ekran/'); return !k || (!k.installing && !k.waiting); }), { timeout: 10_000 }).toBe(true);
    expect(await page.evaluate(async () => (await caches.keys()).filter((a) => a.indexOf('ekran-') === 0))).toEqual([]);
    expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  });

  // Duyuru görseli yerinde değişince akış adresi ?v=<içerik özeti> ile değişir (src/pages/ekran/akis.json.ts); eski
  // adres önbellekte kalmasın diye duyuru akışı ağdan her geldiğinde /media/ altında ne kabukta ne akışta olan
  // kayıtlar silinir (onbellek.ts → budanacaklar). Akış isteği sayfadan, SW üzerinden yapılır.
  test('duyuru akışı ağdan gelince akışta olmayan eski duyuru görselleri önbellekten silinir', async ({ page, context }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    const medya = () => page.evaluate(async () => {
      const ad = (await caches.keys()).filter((a) => a.indexOf('ekran-') === 0)[0];
      return (await (await caches.open(ad)).keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search).filter((u) => u.indexOf('/media/') === 0).sort();
    });
    await page.evaluate(async () => {
      const ad = (await caches.keys()).filter((a) => a.indexOf('ekran-') === 0)[0];
      const c = await caches.open(ad);
      await c.put('/media/duyurular/kermes.webp?v=11111111', new Response('eski afiş'));
      await c.put('/media/duyurular/kermes.webp?v=22222222', new Response('yeni afiş'));
    });
    await context.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ gorsel: '/media/duyurular/kermes.webp?v=22222222' })]) }));
    await page.evaluate(() => fetch('/ekran/akis.json', { cache: 'no-cache' }).then((y) => y.json()));
    await expect.poll(medya).toEqual(['/media/duyurular/kermes.webp?v=22222222', '/media/logo/ulu-camii-logo-beyaz.svg', '/media/logo/ulu-camii-logo.svg']);
  });

  test('GitHub Pages 5xx döndürürse hem sayfa kabuğu hem vakitler önbellekten gelir', async ({ page, context }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    await expect(page.locator('.vakit')).toHaveCount(6);

    await context.route('**/ekran/', (route) => route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' }));
    await context.route('**/ekran/vakitler.json', (route) => route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' }));
    await page.reload();
    await expect(page.locator('.vakit')).toHaveCount(6);
  });
});

test('dış hava sıcaklığı, simgesi ve kaynak ibaresi üst bantta görünür', async ({ page }) => {
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="hava"]')).toBeVisible();
  // Sayı ile birim arasında dar bölünmez boşluk (U+202F, Fransızca ve SI yazımı); toHaveText boşlukları
  // sadeleştirdiği için ham metin karşılaştırılır.
  expect(await page.locator('[data-alan="hava"] span').evaluate((e) => e.textContent)).toBe('19\u202F°C');
  await expect(page.locator('[data-alan="hava"] small')).toHaveText('Open-Meteo');
  await expect(page.locator('[data-alan="hava"] svg path').first()).toBeAttached();
});

test('3 saatten eski dış hava üst bantta gizlenir', async ({ page, context }) => {
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="hava"]')).toBeVisible();
  // Open-Meteo artık hiç yanıt vermiyor (taşıyıcı kesintisi vb.): son değer bayatlayınca gizlenmeli.
  await context.route('https://api.open-meteo.com/**', (route) => route.abort());
  // fastForward (runFor'un tersine) her zamanlayıcıyı en fazla bir kez ateşler; saniyelik/havaDongusu
  // döngüleri saatlerce süren gerçek 1 sn'lik adımlar yerine doğrudan hedef ana sıçrar.
  await page.clock.fastForward(3 * 3_600_000 + 60_000); // 3 saatten biraz fazlası
  await expect(page.locator('[data-alan="hava"]')).toBeHidden();
  // Gizlenen kutuda bayat simge ve sıcaklık da kalmaz.
  await expect(page.locator('[data-alan="hava"] svg')).toHaveCount(0);
  await expect(page.locator('[data-alan="hava"]')).toBeEmpty();
});

test('Open-Meteo ilk denemede yanıt vermezse 30 dakika sonra yeniden denenir', async ({ page, context }) => {
  let vurus = 0;
  await context.route('https://api.open-meteo.com/**', (route) => { vurus += 1; route.abort(); });
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  // Testin kendi varsayımı: ilk deneme gerçekten bu route'a düşmüş mü (düşmediyse test hiçbir şey kanıtlamaz).
  await expect.poll(() => vurus).toBeGreaterThan(0);
  await expect(page.locator('[data-alan="hava"]')).toBeHidden();
  await context.unroute('https://api.open-meteo.com/**'); // kaldırılınca beforeEach'in mock'u yine yanıtlar
  await page.clock.fastForward(30 * 60_000);
  await expect(page.locator('[data-alan="hava"] span')).toHaveText('19\u202F°C');
});

// Son inceleme M8: depolama baskısında Chrome kökeni (SW + önbellek) silebilir; internetsiz açılış biterdi.
// Kalıcı depolama açılışta bir kez istenir; istek reddedilse de açılış etkilenmez.
test('kalıcı depolama açılışta bir kez istenir; reddedilirse açılış etkilenmez', async ({ page }) => {
  await page.addInitScript(() => {
    window.__kaliciIstek = 0;
    if (navigator.storage) navigator.storage.persist = () => { window.__kaliciIstek += 1; return Promise.reject(new Error('test: reddedildi')); };
  });
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  expect(await page.evaluate(() => window.__kaliciIstek)).toBe(1);
});

test('görsel kontrol görüntüleri (yalnız EKRAN_GORSEL=1)', async ({ page }) => {
  test.skip(!process.env.EKRAN_GORSEL, 'görüntü üretimi isteğe bağlı');
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await page.screenshot({ path: 'test-results/ekran-gorsel/dikey-acik.png', animations: 'disabled' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.clock.setSystemTime(an(ornek, ornek.aksam, 30));
  await page.goto('/ekran/?don=90');
  await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'koyu');
  await page.screenshot({ path: 'test-results/ekran-gorsel/yatay-don90-koyu.png', animations: 'disabled' });
});

/* Yatay «A+» yerleşimi (ekran.css → .ekran[data-duzen='yatay']): solda 80u vakit sütunu (sıradaki vakit büyük blok,
   geri sayım içinde), sağda üst bant ve slayt alanı. Hedef 40" TV'dir (1u ≈ 0,5 cm, 9–14 m'den okunur; WebView görüntü
   alanı 961,5×540,8 CSS px). Bu testler yerleşimin taşmadan sığdığını ve rakamların yeterince büyük olduğunu ÖLÇER.
   Rakam boyu = '0' glifinin mürekkep yüksekliği ÷ TUVAL yüksekliği (innerHeight değil; 961×541'de tuval yuvarlanır).
   Slayt içeriği sabit fikstürden gelir ve 60 sn'liktir: ölçüm sırasında slayt değişmez. */
const TASMA_OGELERI = ['.vakitler', '.vakit', '.ust', '.kimlik', '.zaman', '.takvim', '.slayt-alani'];
const SABIT_60SN = { tabanSn: 60, karakterSn: 0, enAzSn: 60, enCokSn: 60 };
const yatayOlcum = (page, ogeler = TASMA_OGELERI) => page.evaluate(async (secimler) => {
  await document.fonts.ready;
  const ekran = document.getElementById('ekran');
  const t = ekran.getBoundingClientRect();
  const u = parseFloat(getComputedStyle(ekran).getPropertyValue('--u'));
  const tasmalar = [];
  for (const s of secimler) {
    const liste = document.querySelectorAll(s);
    if (!liste.length) tasmalar.push(s + ': öğe yok');
    liste.forEach((e, i) => {
      const dx = e.scrollWidth - e.clientWidth;
      const dy = e.scrollHeight - e.clientHeight;
      if (dx > 1 || dy > 1) tasmalar.push(`${s}[${i}] yatay ${dx} px, dikey ${dy} px`);
    });
  }
  const ctx = document.createElement('canvas').getContext('2d');
  // getComputedStyle().font kısaltması tabular-nums gibi uzun biçimlerde boş döner; parçalardan kurulur.
  const rakam = (e) => {
    const cs = getComputedStyle(e);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText('0');
    return (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / t.height;
  };
  const kutu = (s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.left - t.left, sag: r.right - t.left, w: r.width, h: r.height };
  };
  const siradaki = document.querySelector('.vakit.siradaki .deger');
  return {
    u, tasmalar,
    vakitler: kutu('.vakitler'), ust: kutu('.ust'), slayt: kutu('.slayt-alani'), saatKutusu: kutu('.saat'), hava: kutu('.hava'),
    siradaki: siradaki ? rakam(siradaki) : null,
    digerleri: Array.prototype.map.call(document.querySelectorAll('.vakit:not(.siradaki) .deger'), rakam),
    saat: rakam(document.querySelector('[data-alan="saat-sd"]')),
  };
}, ogeler);

/** Sütunlar yerinde (±1 px), hiçbir öğe taşmıyor, rakamlar yeterince büyük. */
async function yatayDenetle(page, { siradakiVar = true } = {}) {
  const o = await yatayOlcum(page);
  expect(o.tasmalar, 'taşan öğe olmamalı').toEqual([]);
  expect(Math.abs(o.vakitler.x), 'vakit sütunu solda').toBeLessThanOrEqual(1);
  expect(Math.abs(o.vakitler.w - 80 * o.u), 'vakit sütunu 80u genişlikte').toBeLessThanOrEqual(1);
  expect(Math.abs(o.ust.x - 80 * o.u), 'üst bant 80u’da başlar').toBeLessThanOrEqual(1);
  expect(Math.abs(o.slayt.x - 80 * o.u), 'slayt alanı 80u’da başlar').toBeLessThanOrEqual(1);
  expect(o.saat, 'saat rakamı ÷ tuval yüksekliği').toBeGreaterThanOrEqual(0.13);
  if (siradakiVar) expect(o.siradaki, 'sıradaki vakit rakamı ÷ tuval yüksekliği').toBeGreaterThanOrEqual(0.13);
  expect(o.digerleri).toHaveLength(siradakiVar ? 5 : 6);
  for (const r of o.digerleri) expect(r, 'vakit rakamı ÷ tuval yüksekliği').toBeGreaterThanOrEqual(0.054);
  return o;
}

/** Öğenin metni tek satırda mı: metin kutularının toplam yüksekliği yazı boyunun 1,6 katından az. */
const tekSatirMi = (page, secici, olcuSecici = secici) => page.evaluate(([s, o]) => {
  const e = document.querySelector(s);
  const aralik = document.createRange();
  aralik.selectNodeContents(e);
  const kutular = Array.prototype.filter.call(aralik.getClientRects(), (r) => r.height > 0);
  const ust = Math.min.apply(null, kutular.map((r) => r.top));
  const alt = Math.max.apply(null, kutular.map((r) => r.bottom));
  return alt - ust < 1.6 * parseFloat(getComputedStyle(document.querySelector(o)).fontSize);
}, [secici, olcuSecici]);

async function yatayYukle(page, siradaki) {
  await page.goto('/ekran/');
  await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
  await expect(page.locator('.vakit')).toHaveCount(6);
  if (siradaki) await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', siradaki);
  await expect(page.locator('[data-alan="hava"]')).toBeVisible();
  await expect(page.locator('[data-alan="slayt"] .slayt')).toBeAttached(); // görünürlüğü yerleşim belirler; ölçüm denetler
}

async function yatayAc(page, zaman, { siradaki, akis = AKIS([DUYURU()], SABIT_60SN), icerik = ICERIK, sayfa } = {}) {
  if (sayfa) await page.route('**/ekran/', sayfa);
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: akis }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: icerik }));
  await page.clock.install({ time: zaman });
  await yatayYukle(page, siradaki);
}

for (const [genislik, yukseklik] of [[1920, 1080], [1280, 720], [961, 541]]) {
  test.describe(`yatay A+ yerleşimi: ${genislik}×${yukseklik}`, () => {
    test.use({ viewport: { width: genislik, height: yukseklik } });
    test('öğleye 30 dk kala: vakitler solda 80u, üst bant ve slayt sağda; taşma yok, rakamlar büyük', async ({ page }) => {
      await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle' });
      await yatayDenetle(page);
    });
  });
}

const cumaGunu = kaynak.gunler.find(cumaMi);
const dakika = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
// Yatsıdan ertesi günün imsakına en uzun gece: en uzun TR geri sayımlarından biri («İmsak vaktine 9 sa 59 dk» gibi).
// En uzun FR metni Cuma sabahıdır («Prière du vendredi dans 5 h 59»); son incelemede 961×541'de tek satır ölçüldü.
const enUzunGece = kaynak.gunler
  .map((g, i, t) => (t[i + 1] && t[i + 1].tarih === ertesiGun(g) ? { g, dk: 1440 - dakika(g.yatsi) + dakika(t[i + 1].imsak) } : null))
  .filter(Boolean)
  .reduce((a, b) => (b.dk > a.dk ? b : a), { g: null, dk: -1 });
const UZUN_HADIS = { derleme: '', eksik: [], ayetler: [], hadisler: [{ id: 'uzun', kaynak: 'Buhârî, Bed’ü’l-vahy, 1; Müslim, İmâre, 155',
  // Sentetik uzunluk fikstürü (Arapça ~210, TR ~260, FR ~350 karakter): gerçek bir hadis metni değildir.
  ar: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى '.repeat(5).slice(0, 210),
  tr: 'Ameller ancak niyetlere göre değerlendirilir ve herkese ancak niyet ettiği şey vardır. '.repeat(4).slice(0, 260),
  fr: 'Les actes ne valent que par les intentions, et chacun n’obtient que ce qu’il a eu l’intention de faire. '.repeat(4).slice(0, 350) }] };
const AFIS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 16 9"><rect width="16" height="9" fill="#8a8a8a"/></svg>';
const UZUN_DUYURU_METNI = 'Cemaatimizin dikkatine: '.repeat(7).slice(0, 160);
const UZUN_DUYURU = DUYURU({ tr: { baslik: 'Yıllık genel kurul toplantısı ve yönetim kurulu seçimi hakkında', metin: UZUN_DUYURU_METNI }, fr: { baslik: 'Assemblée générale annuelle et élection du conseil d’administration', metin: UZUN_DUYURU_METNI } });

test.describe('yatay A+ yerleşimi: 961×541 (Polaroid TV, en dar)', () => {
  test.use({ viewport: { width: 961, height: 541 } });

  for (const [ad, zaman, siradaki] of [
    ['imsaktan önce', () => an(ornek, ornek.imsak, -30), 'imsak'],
    ['güneşe 15 dk kala', () => an(ornek, ornek.gunes, -15), 'gunes'],
    ['ikindiye 30 dk kala', () => an(ornek, ornek.ikindi, -30), 'ikindi'],
    ['akşama 30 dk kala', () => an(ornek, ornek.aksam, -30), 'aksam'],
    ['yatsıya 30 dk kala', () => an(ornek, ornek.yatsi, -30), 'yatsi'],
    ['yatsıdan 30 dk sonra (yarının imsakı)', () => an(yatsiGunu, yatsiGunu.yatsi, 30), 'imsak'],
  ]) {
    test(`${ad}: taşma yok, rakamlar büyük`, async ({ page }) => {
      await yatayAc(page, zaman(), { siradaki });
      await yatayDenetle(page);
    });
  }

  test('Cuma, sitede Cuma saati yok: öğle satırı Cuma/Vendredi, taşma yok', async ({ page }) => {
    test.skip(!cumaGunu, 'veride Cuma yok');
    await yatayAc(page, an(cumaGunu, cumaGunu.ogle, -30), { siradaki: 'ogle', sayfa: cumaSaatiEkle('') });
    await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Cuma');
    await expect(page.locator('.vakit[data-vakit="ogle"] .ad i')).toHaveText('Vendredi');
    await expect(page.locator('.cuma-saati')).toHaveCount(0);
    await yatayDenetle(page);
  });

  test('Cuma, sitede Cuma saati 13:30: Cuma satırı sütunun altında TEK satır, taşma yok', async ({ page }) => {
    test.skip(!cumaGunu, 'veride Cuma yok');
    await yatayAc(page, an(cumaGunu, cumaGunu.ogle, -30), { siradaki: 'ogle', sayfa: cumaSaatiEkle('13:30') });
    await expect(page.locator('.cuma-saati')).toBeVisible();
    await expect(page.locator('.cuma-saati b')).toHaveText('Cuma namazı 13:30');
    expect(await tekSatirMi(page, '.cuma-saati', '.cuma-saati b'), 'Cuma satırı tek satır').toBe(true);
    expect(await page.locator('.cuma-saati .fr').evaluate((e) => getComputedStyle(e, '::before').content)).toBe('" · "');
    await yatayDenetle(page);
  });

  test('en uzun miladi + hicrî tarih satırları (TR ve FR) kısaltılmadan sığar', async ({ page }) => {
    const bicim = (yerel) => new Intl.DateTimeFormat(yerel, { timeZone: 'Europe/Brussels', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const [TR, FR] = [bicim('tr-TR'), bicim('fr-BE')];
    const satirlar = kaynak.gunler.filter((g) => g.hicri).map((g) => ({ g,
      tr: TR.format(an(g, '12:00')) + ' · ' + g.hicri,
      fr: FR.format(an(g, '12:00')) + ' · ' + hicriCevir(g.hicri, 'fr') }));
    const enUzun = (dil) => satirlar.reduce((a, b) => (b[dil].length > a[dil].length ? b : a));
    const trGunu = enUzun('tr');
    const frGunu = enUzun('fr');
    await yatayAc(page, an(trGunu.g, '12:00'));
    for (const [i, gun] of [[0, trGunu], [1, frGunu]]) {
      if (i === 1) { await page.clock.setSystemTime(an(gun.g, '12:00')); await yatayYukle(page); }
      await expect(page.locator('[data-alan="hicri-tr"]')).toHaveText(gun.g.hicri);
      const takvim = page.locator('.takvim').nth(i);
      await expect(takvim).toHaveText((i === 0 ? gun.tr : gun.fr).replace(' · ', ''));
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      expect(await takvim.evaluate((e) => e.scrollWidth - e.clientWidth), (i === 0 ? gun.tr : gun.fr)).toBeLessThanOrEqual(0);
    }
    // Veri dosyasındaki bütün günler: yazılan metin tarih satırlarına tek tek konur, hiçbiri kısaltılmaz.
    const tasanlar = await page.evaluate((liste) => {
      const alan = (a) => document.querySelector(`[data-alan="${a}"]`);
      const sonuc = [];
      for (const [trTarih, trHicri, frTarih, frHicri] of liste) {
        alan('tarih-tr').textContent = trTarih; alan('hicri-tr').textContent = trHicri;
        alan('tarih-fr').textContent = frTarih; alan('hicri-fr').textContent = frHicri;
        document.querySelectorAll('.takvim').forEach((e) => { if (e.scrollWidth > e.clientWidth) sonuc.push(e.textContent); });
      }
      return sonuc;
    }, satirlar.map(({ g }) => [TR.format(an(g, '12:00')), g.hicri, FR.format(an(g, '12:00')), hicriCevir(g.hicri, 'fr')]));
    expect(tasanlar).toEqual([]);
  });

  test('−12 °C’de hava bloğu saatin yanında en az 3u boşlukla üst bandın içinde biter', async ({ page }) => {
    await page.route('https://api.open-meteo.com/**', (r) => r.fulfill({ json: { current: { temperature_2m: -12.4, weather_code: 71 } } }));
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle' });
    expect(await page.locator('[data-alan="hava"] span').evaluate((e) => e.textContent)).toBe('-12 °C');
    const o = await yatayDenetle(page);
    expect(o.hava.sag, 'hava bloğu üst bandın içinde biter').toBeLessThanOrEqual(o.ust.sag + 0.5);
    expect(o.hava.x - o.saatKutusu.sag, 'saat ile hava arası ≥ 3u').toBeGreaterThanOrEqual(3 * o.u);
  });

  test('en uzun gece (yatsıdan 1 dk sonra): geri sayım satırları tek satır', async ({ page }) => {
    expect(enUzunGece.g, 'veride ardışık gün çifti yok').toBeTruthy();
    await yatayAc(page, an(enUzunGece.g, enUzunGece.g.yatsi, 1), { siradaki: 'imsak' });
    await expect(page.locator('.vakit.siradaki .geri-sayim b')).toContainText(/^İmsak vaktine \d+ sa \d+ dk$/);
    expect(await tekSatirMi(page, '.vakit.siradaki .geri-sayim b'), 'TR geri sayım tek satır').toBe(true);
    expect(await tekSatirMi(page, '.vakit.siradaki .geri-sayim .fr'), 'FR geri sayım tek satır').toBe(true);
    await yatayDenetle(page);
  });

  test('uzun duyuru slayt alanından taşmaz', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([UZUN_DUYURU], SABIT_60SN) });
    await expect(page.locator('.slayt-duyuru')).toBeVisible();
    await yatayDenetle(page);
  });

  test('uzun hadis (Arapça ~210, TR ~260, FR ~350 karakter) slayt alanından taşmaz', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([], SABIT_60SN), icerik: UZUN_HADIS });
    await expect(page.locator('.slayt-hadis .kaynak')).toBeVisible();
    await yatayDenetle(page);
  });

  test('görselli duyuru slayt alanından taşmaz; görsel en çok 20u yüksekliğinde', async ({ page }) => {
    await page.route('**/media/duyurular/test-afis.svg', (r) => r.fulfill({ contentType: 'image/svg+xml', body: AFIS_SVG }));
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([DUYURU({ gorsel: '/media/duyurular/test-afis.svg' })], SABIT_60SN) });
    const img = page.locator('.slayt-duyuru img');
    await expect.poll(() => img.evaluate((e) => e.complete && e.naturalWidth > 0)).toBe(true);
    await expect.poll(() => page.locator('[data-alan="slayt"]').evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
    const o = await yatayDenetle(page);
    expect((await img.boundingBox()).height).toBeLessThanOrEqual(20 * o.u + 1);
  });

  test('saat 1970e dönmüşse uyarı 5u yazıyla üst banda sığar', async ({ page }) => {
    await page.clock.install({ time: new Date(0) });
    await page.goto('/ekran/');
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'yatay');
    await expect(page.locator('[data-alan="saat"]')).toContainText('Saat doğrulanıyor');
    await expect(page.locator('.vakit-yok')).toBeVisible();
    const o = await yatayOlcum(page, ['.ust', '.kimlik', '.zaman', '.takvim', '.vakitler', '.slayt-alani']);
    expect(o.tasmalar).toEqual([]);
    const boyut = await page.locator('.saat').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(boyut).toBeCloseTo(5 * o.u, 1);
  });

  test('veri boşluğunda (vurgulu satır yok) altı satır sütunu eşit bölüşür, taşma yok', async ({ page }) => {
    await page.route('**/ekran/vakitler.json', (r) => r.fulfill({ json: vakitAkisi([ornek]) }));
    await yatayAc(page, an(ornek, ornek.yatsi, 30));
    await expect(page.locator('.vakit.siradaki')).toHaveCount(0);
    await yatayDenetle(page, { siradakiVar: false });
    const boylar = await page.locator('.vakit').evaluateAll((l) => l.map((e) => e.getBoundingClientRect().height));
    expect(Math.max(...boylar) - Math.min(...boylar)).toBeLessThanOrEqual(1);
  });

  test('koyu tema (akşamdan 30 dk sonra): taşma yok, rakamlar büyük', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.aksam, 30), { siradaki: 'yatsi' });
    await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'koyu');
    await yatayDenetle(page);
  });
});

test('yatay A+ görsel kontrol görüntüleri (yalnız EKRAN_GORSEL=1)', async ({ page }) => {
  test.skip(!process.env.EKRAN_GORSEL, 'görüntü üretimi isteğe bağlı');
  let cumaSaati = null;
  let hadisModu = false;
  await page.route('**/ekran/', (route) => (cumaSaati === null ? route.fallback() : cumaSaatiEkle(cumaSaati)(route)));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: hadisModu ? AKIS([], SABIT_60SN) : AKIS([DUYURU()], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: hadisModu ? UZUN_HADIS : ICERIK }));
  const sahneler = [
    ['yatay-duzen-acik', [1920, 1080], an(ornek, ornek.ogle, -30), 'ogle'],
    ['yatay-duzen-koyu', [1920, 1080], an(ornek, ornek.aksam, 30), 'yatsi'],
    ['yatay-duzen-961x541', [961, 541], an(ornek, ornek.ogle, -30), 'ogle'],
    ['yatay-duzen-cuma', [961, 541], cumaGunu ? an(cumaGunu, cumaGunu.ogle, -30) : null, 'ogle', () => { cumaSaati = '13:30'; }],
    ['yatay-duzen-uzun-hadis', [961, 541], an(ornek, ornek.ogle, -30), 'ogle', () => { cumaSaati = null; hadisModu = true; }],
    ['yatay-duzen-yarin-imsak', [961, 541], an(yatsiGunu, yatsiGunu.yatsi, 30), 'imsak', () => { hadisModu = false; }],
    ['yatay-duzen-1970', [961, 541], new Date(0), null],
  ];
  let kurulu = false;
  for (const [ad, [w, h], zaman, siradaki, hazirla] of sahneler) {
    if (!zaman) continue;
    if (hazirla) hazirla();
    await page.setViewportSize({ width: w, height: h });
    if (kurulu) await page.clock.setSystemTime(zaman);
    else { await page.clock.install({ time: zaman }); kurulu = true; }
    if (siradaki) await yatayYukle(page, siradaki);
    else { await page.goto('/ekran/'); await expect(page.locator('.vakit-yok')).toBeVisible(); } // saat 1970: uyarı
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.screenshot({ path: `test-results/ekran-gorsel/${ad}.png`, animations: 'disabled' });
  }
});
