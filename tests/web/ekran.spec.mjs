import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { brukselTarih } from '../../src/lib/namaz.ts';
import { hicriCevir } from '../../src/i18n/hicri.ts';
import { build } from 'esbuild';
import { OLCU, AFIS_EN_COK } from '../../src/lib/ekran/olcu.ts';
import { BUTCE } from '../../src/lib/ekran/butce.ts';
import { ekranIcerigi } from '../../src/lib/ekran/icerik.ts';
import { AHLAK_HADISLERI } from '../../src/lib/hadis-verisi.ts';

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
  // route.fetch() isteği Node tarafında yapar ve context.setOffline'ı tanımaz (9 Ekim 2026'da denendi): çevrimdışıyken
  // akışlar eskisi gibi route.continue ile tarayıcıya bırakılır ki «internetsiz açılış» testlerinde gerçekten düşsün.
  let cevrimdisi = false;
  const setOffline = context.setOffline.bind(context);
  context.setOffline = async (durum) => { cevrimdisi = durum; return setOffline(durum); };
  await context.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'api.open-meteo.com') return route.fulfill({ json: { current: { temperature_2m: 18.6, weather_code: 61 } } });
    if (u.origin !== 'http://127.0.0.1:4401' && u.origin !== 'http://localhost:4401') return route.abort('blockedbyclient');
    // Saat page.clock ile kurulur: önizleme sunucusunun gerçek Date başlığı geçmişe kurulmuş test saatini «geri kaymış
    // saat» sayardı (src/lib/ekran/secim.ts → saatGecerliMi). Akışlarda Date başlığı ayıklanır; o kuralı sınayan
    // testler başlığı kendileri verir. Yönlendirme açıkken HTTP önbelleği zaten kapalıdır.
    if (!cevrimdisi && /^\/ekran\/[^/]+\.json$/.test(u.pathname)) {
      const yanit = await route.fetch();
      const basliklar = yanit.headers();
      delete basliklar.date;
      return route.fulfill({ response: yanit, headers: basliklar });
    }
    return route.continue();
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

test('renderer sayacı gerçek saat döngüsüyle ilerler, kritik DOM yokken durur', async ({ page }) => {
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect.poll(() => page.evaluate(() => window.UluRenderDurumu?.().sayac)).toBeGreaterThan(0);
  const ilk = await page.evaluate(() => window.UluRenderDurumu());
  await page.clock.runFor(3_000);
  const ikinci = await page.evaluate(() => window.UluRenderDurumu());
  expect(ikinci.sayac).toBeGreaterThan(ilk.sayac);
  expect(Object.keys(ikinci)).toEqual(['v', 'sayfa', 'sayac']);
  await page.locator('[data-alan="saat-sn"]').evaluate((e) => e.removeAttribute('data-alan'));
  const durdu = await page.evaluate(() => window.UluRenderDurumu().sayac);
  await page.clock.runFor(5_000);
  expect(await page.evaluate(() => window.UluRenderDurumu().sayac)).toBe(durdu);
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

/* Pilsiz TV soğuk açılışta yakın geçmişten bir saatle başlayabilir (9 Ekim 2026: 2026-09-28T22:23Z). Alt sınırı geçen
   bu saat, ekranın daha önce gördüğü sunucu zamanının (localStorage, HTTP Date) 10 dk'dan fazla gerisindeyse güvenilmez. */
test('saat daha önce görülen sunucu zamanının gerisine düşmüşse vakit yerine uyarı gösterilir', async ({ page }) => {
  const t = an(ornek, '12:00');
  await page.addInitScript((ms) => localStorage.setItem('ekran.sonSunucuSaati', String(ms)), t.getTime() + 11 * 60_000);
  await page.clock.install({ time: t });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="saat"]')).toContainText('Saat doğrulanıyor');
  await expect(page.locator('.vakit-yok b')).toHaveText('Saat doğrulanıyor');
  await expect(page.locator('.vakit')).toHaveCount(0);
  await expect(page.locator('.takvim').first()).toHaveText('');
  // Saat düzelince (ağ saati) sayfa yenilenmeden vakitler geri gelir.
  await page.clock.setSystemTime(new Date(t.getTime() + 11 * 60_000));
  await page.clock.runFor(2_000);
  await expect(page.locator('[data-alan="saat"]')).toHaveText(/^12:11:\d\d$/);
  await expect(page.locator('.vakit')).toHaveCount(6);
});

test('akış yanıtının Date başlığı işareti yükseltir; bozuk gövdeninki yükseltmez', async ({ page }) => {
  const t = an(ornek, '12:00');
  const ileri = new Date(t.getTime() + 60 * 60_000).toUTCString();
  let bozuk = true;
  await page.route('**/ekran/akis.json', async (r) => {
    const yanit = await r.fetch();
    const basliklar = { ...yanit.headers(), date: ileri };
    return bozuk ? r.fulfill({ status: 200, headers: basliklar, contentType: 'text/html', body: '<html>portal</html>' }) : r.fulfill({ response: yanit, headers: basliklar });
  });
  await page.clock.install({ time: t });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="saat"]')).toHaveText(/^12:00:\d\d$/);
  await expect(page.locator('.vakit')).toHaveCount(6);
  expect(await page.evaluate(() => localStorage.getItem('ekran.sonSunucuSaati'))).toBeNull();
  bozuk = false;
  await page.reload();
  await expect(page.locator('[data-alan="saat"]')).toContainText('Saat doğrulanıyor');
  expect(Number(await page.evaluate(() => localStorage.getItem('ekran.sonSunucuSaati')))).toBe(Date.parse(ileri));
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

  test('yeniden boyutlanınca slayt yeniden sığdırılır (levhaSigdir)', async ({ page }) => {
    await page.clock.install({ time: an(ornek, '12:00') });
    await page.goto('/ekran/');
    const slayt = page.locator('[data-alan="slayt"]');
    await expect(slayt).not.toBeEmpty(); // ilk slayt çizildi
    await page.evaluate(() => document.fonts.ready.then(() => undefined)); // geç gelen yazı tipi levhaSigdir'i sonradan tetiklemesin
    // levhaSigdir ölçeği 1'in altına indirmez; 0,5 değerini yalnız yeniden sığdırma silebilir.
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

/* Levha ölçer (tests/web/yardimci/levha-olcer.ts): çiziciyi sayfada doğrudan çağırır; üretim paketine girmez. */
let levhaOlcerKodu = null;
async function levhaOlcerYukle(page) {
  if (!levhaOlcerKodu) {
    const r = await build({ entryPoints: [resolve(process.cwd(), 'tests/web/yardimci/levha-olcer.ts')], bundle: true, write: false, format: 'iife', target: ['chrome70'], logLevel: 'silent' });
    levhaOlcerKodu = r.outputFiles[0].text;
  }
  await page.addScriptTag({ content: levhaOlcerKodu });
}

/** Her slaytı çizer ve sığdırır; ölçek, sığma, taşma ve her paragrafın hesaplanan yazı boyu (px). */
const levhaOlc = (page, slaytlar) => page.evaluate((liste) => {
  const kok = document.querySelector('[data-alan="slayt"]');
  const u = parseFloat(getComputedStyle(document.getElementById('ekran')).getPropertyValue('--u'));
  return liste.map((s) => {
    window.__levha.slaytCiz(kok, s);
    const r = window.__levha.levhaSigdir(kok);
    const paragraflar = Array.prototype.map.call(kok.querySelectorAll('.levha p'), (p) => ({ sinif: p.className, px: parseFloat(getComputedStyle(p).fontSize) }));
    const arSatiri = kok.querySelector('.levha .ar');
    const afisKutusu = kok.querySelector('.afis');
    const govdeKutusu = kok.querySelector('.afisli');
    return { id: s.oge.id, tur: s.tur, afisGenislik: afisKutusu ? afisKutusu.offsetWidth : 0, afisOran: afisKutusu ? parseFloat(afisKutusu.getAttribute('data-oran')) : 0, govdeH: govdeKutusu ? govdeKutusu.clientHeight : 0, govdeW: govdeKutusu ? govdeKutusu.clientWidth : 0, yuz: arSatiri ? arSatiri.getAttribute('data-yuz') : null, olcek: r.olcek, sigdi: r.sigdi, u, paragraflar, tasmaY: kok.scrollHeight - kok.clientHeight, tasmaX: kok.scrollWidth - kok.clientWidth, icTasmaY: kok.firstElementChild.scrollHeight - kok.firstElementChild.clientHeight };
  });
}, slaytlar);

/** Paragraf sınıfı → olcu.ts alanı. */
const TABAN_ALANI = { ar: 'ar', okunus: 'okunus', tr: 'tr', fr: 'fr', kaynak: 'kaynak', baslik: 'baslikTr', 'baslik fr': 'baslikFr' };

async function dokunmatikAc(page, boyut = { width: 390, height: 844 }, hedef = 'ana') {
  await page.setViewportSize(boyut);
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([
    DUYURU({ id: 'dokun-1', tr: { baslik: 'Birinci duyuru', metin: 'Okunacak birinci metin.' }, hedef: [hedef] }),
    DUYURU({ id: 'dokun-2', tr: { baslik: 'İkinci duyuru', metin: 'Okunacak ikinci metin.' }, hedef: [hedef] }),
    DUYURU({ id: 'baska', tr: { baslik: 'Başka ekran', metin: 'Bu hedefte görünmez.' }, hedef: ['giris'] }),
  ]) }));
  await page.goto('/ekran/?ekran=' + hedef + '&kip=dokunmatik&don=90&duzen=yatay');
  await expect(page.locator('.slayt-duyuru .baslik').first()).toHaveText('Birinci duyuru');
  await page.evaluate(() => document.fonts.ready);
}

async function dokunmatikTasmaDenetle(page) {
  const sonuc = await page.evaluate(() => {
    const kok = document.getElementById('ekran');
    const sahne = kok.parentElement;
    const slayt = kok.querySelector('[data-alan="slayt"]');
    const kart = slayt.firstElementChild;
    return { tasmaX: sahne.scrollWidth - sahne.clientWidth, sigdi: slayt.getAttribute('data-sigdi'),
      kartTasma: kart.scrollHeight - kart.clientHeight,
      paragraflar: Array.from(slayt.querySelectorAll('.levha p'), (e) => ({ px: parseFloat(getComputedStyle(e).fontSize), genis: e.scrollWidth - e.clientWidth })),
      dugmeler: Array.from(kok.querySelectorAll('button'), (e) => ({ w: e.offsetWidth, h: e.offsetHeight })) };
  });
  expect(sonuc.tasmaX).toBeLessThanOrEqual(1);
  expect(sonuc.kartTasma).toBeLessThanOrEqual(1);
  expect(sonuc.sigdi).toBe('evet');
  for (const p of sonuc.paragraflar) { expect(p.px).toBeGreaterThanOrEqual(16); expect(p.genis).toBeLessThanOrEqual(1); }
  for (const d of sonuc.dugmeler) { expect(d.w).toBeGreaterThanOrEqual(48); expect(d.h).toBeGreaterThanOrEqual(48); }
}

for (const [w, sinif] of [[320, 'compact'], [390, 'compact'], [600, 'medium'], [839, 'medium'], [840, 'expanded'], [1200, 'expanded']]) {
  test('dokunmatik: ' + w + ' px, ' + sinif + ', ortak levha ve 48 px hedefler', async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await dokunmatikAc(page, { width: w, height: 900 });
    await expect(page.locator('#ekran')).toHaveAttribute('data-pencere', sinif);
    await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', 'dikey');
    await expect(page.locator('[data-alan="cami-tr"]')).toHaveText('Marche-en-Famenne Ulu Camii');
    await expect(page.locator('.vakit')).toHaveCount(6);
    await levhaOlcerYukle(page);
    // Yayın paketindeki daha önce onaylanmış metin; yeni dinî içerik üretilmez.
    const onayli = JSON.parse(readFileSync(resolve('dist/ekran/icerik.json'), 'utf8'));
    const a = onayli.ayetler.reduce((x, y) => y.ar.length > x.ar.length ? y : x);
    const olcum = await levhaOlc(page, [{ tur: 'ayet', karakter: 0, oge: a }]);
    expect(olcum[0].yuz).toBe('kuran');
    expect(olcum[0].olcek).toBe(1);
    expect(olcum[0].sigdi).toBe(true);
    await dokunmatikTasmaDenetle(page);
    // Aynı çizicide uzun, dinî olmayan iki dilli duyuru da kaydırılarak okunur.
    await levhaOlc(page, [{ tur: 'duyuru', karakter: 0, oge: DUYURU({ tr: { baslik: 'Uzun duyuru başlığı', metin: 'Bu metin okunabilir kalmalıdır. '.repeat(18) }, fr: { baslik: 'Une annonce avec un titre long', metin: 'Cette annonce doit rester lisible dans une fenêtre étroite. '.repeat(18) } }) }]);
    await dokunmatikTasmaDenetle(page);
    const sira = await page.locator('#ekran').evaluate((e) => Array.from(e.children, (x) => x.className));
    expect(sira.indexOf('vakitler')).toBeLessThan(sira.indexOf('slayt-alani'));
    if (process.env.EKRAN_DOKUN_GORSEL_DIZIN && [390, 840, 1200].includes(w)) {
      mkdirSync(process.env.EKRAN_DOKUN_GORSEL_DIZIN, { recursive: true });
      await page.screenshot({ path: resolve(process.env.EKRAN_DOKUN_GORSEL_DIZIN, 'dokun-' + w + '.png') });
      await page.locator('.sahne').evaluate((e) => { e.scrollTop = e.querySelector('.slayt-alani').offsetTop; });
      await page.screenshot({ path: resolve(process.env.EKRAN_DOKUN_GORSEL_DIZIN, 'levha-' + w + '.png') });
    }
    expect(hatalar).toEqual([]);
  });
}

test('dokunmatik: elle okuma kipinde bekleyen slayt renderer sayacını durdurmaz', async ({ page }) => {
  await dokunmatikAc(page, { width: 900, height: 1000 }, 'kadin');
  const ilk = await page.evaluate(() => window.UluRenderDurumu().sayac);
  // Kabuk ilerleme görmezse renderer'ı donmuş sayar; slayt süresi + 30 sn çok aşılır, geçiş yine yoktur.
  await page.clock.runFor(4 * 60_000);
  await expect(page.locator('.baslik').first()).toHaveText('Birinci duyuru');
  const orta = await page.evaluate(() => window.UluRenderDurumu().sayac);
  expect(orta - ilk).toBeGreaterThanOrEqual(200);
  // Otomatik geçiş açılınca sınır yeniden konur ve sayaç geçişlerle birlikte sürer.
  await page.getByRole('button', { name: 'Otomatik geçiş' }).click();
  await page.clock.runFor(2 * 60_000);
  expect(await page.evaluate(() => window.UluRenderDurumu().sayac) - orta).toBeGreaterThanOrEqual(100);
});

test('dokunmatik: manuel okuma, klavye, hedef filtresi, büyük yazı ve yön değişimi', async ({ page }) => {
  await dokunmatikAc(page, { width: 900, height: 1000 }, 'kadin');
  await page.clock.runFor(40_000);
  await expect(page.locator('.baslik').first()).toHaveText('Birinci duyuru');
  await page.getByRole('button', { name: 'Sonraki' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.baslik').first()).toHaveText('İkinci duyuru');
  await page.getByRole('button', { name: 'Büyük yazı' }).click();
  await expect(page.getByRole('button', { name: 'Büyük yazı' })).toHaveAttribute('aria-pressed', 'true');
  const yazi = await page.locator('.levha .tr').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  await page.setViewportSize({ width: 390, height: 230 });
  await expect(page.locator('#ekran')).toHaveAttribute('data-kisa', 'evet');
  await expect(page.locator('#ekran')).toHaveAttribute('data-pencere', 'compact');
  expect(await page.locator('.levha .tr').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBe(yazi);
  await dokunmatikTasmaDenetle(page);
  await page.getByRole('button', { name: 'Otomatik geçiş' }).click();
  await page.clock.runFor(12_000);
  await expect(page.locator('.slayt-duyuru')).toHaveCount(0); // Sıradaki onaylı manevi blok.
  await page.getByRole('button', { name: 'Otomatik geçiş' }).click();
  const once = await page.locator('.slayt-alani').textContent();
  await page.clock.runFor(40_000);
  expect(await page.locator('.slayt-alani').textContent()).toBe(once);
  expect(await page.locator('.slayt-alani').textContent()).not.toContain('Başka ekran');
});

test('dokunmatik: 200 yüzde temel yazı, kısa pencere ve afiş doğal yüksekliği', async ({ page }) => {
  await dokunmatikAc(page, { width: 320, height: 240 });
  await page.route('**/media/duyurular/test-afis.svg', (r) => r.fulfill({ contentType: 'image/svg+xml', body: AFIS_SVG }));
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.setViewportSize({ width: 321, height: 240 });
  await levhaOlcerYukle(page);
  await levhaOlc(page, [sinirAfis(16 / 9, 'dokun')]);
  await page.waitForFunction(() => document.querySelector('.afis img')?.complete);
  const afis = await page.locator('.afis img').boundingBox();
  expect(afis.width / afis.height).toBeCloseTo(16 / 9, 1);
  await dokunmatikTasmaDenetle(page);
  expect(await page.locator('.levha .tr').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(40);
});

test('dokunmatik: Diyanet günü eksikse kişisel kip de vakit hesaplamaz', async ({ page }) => {
  await page.route('**/ekran/vakitler.json', (r) => r.fulfill({ json: vakitAkisi([]) }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/?kip=dokunmatik');
  await expect(page.locator('.vakit-yok b')).toHaveText('Namaz vakitleri güncellenemedi');
  await expect(page.locator('.vakit')).toHaveCount(0);
  await expect(page.locator('.geri-sayim')).toHaveCount(0);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.setViewportSize({ width: 320, height: 240 });
  expect(await page.locator('.sahne').evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
});

test('küçük TV penceresi kişisel kip açmaz; varsayılan TV araçları gizlidir', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ekran/?kip=telefon');
  await expect(page.locator('#ekran')).not.toHaveAttribute('data-kip', 'dokunmatik');
  await expect(page.locator('.dokunmatik-araclar')).toBeHidden();
});
function tabanDenetle(o) {
  for (const p of o.paragraflar) {
    const taban = OLCU[o.tur][TABAN_ALANI[p.sinif]] * o.u;
    expect(p.px, `${o.id} .${p.sinif}: ${p.px.toFixed(1)} px ≥ taban ${taban.toFixed(1)} px`).toBeGreaterThanOrEqual(taban - 0.5);
  }
  expect(o.olcek, `${o.id} ölçek ≥ 1`).toBeGreaterThanOrEqual(1);
  expect(o.tasmaY, `${o.id} dikey taşma`).toBeLessThanOrEqual(1);
  expect(o.icTasmaY, `${o.id} slayt alanının iç kenar boşluğuna taşma`).toBeLessThanOrEqual(1);
  expect(o.tasmaX, `${o.id} yatay taşma`).toBeLessThanOrEqual(1);
}

/* Bütçe sınırında SENTETİK metinler (src/lib/ekran/butce.ts): gerçek bir ayet ya da hadis değildir; uzunluk ve harf
   genişliği gerçekçi cümlelerden kesilir. */
const kes = (kalip, n) => kalip.repeat(Math.ceil(n / kalip.length) + 1).slice(0, n).trim().padEnd(n, '.');
const K_AR = 'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ ';
const K_TR = 'Müminler ancak kardeştir; öyleyse kardeşlerinizin arasını düzeltin. ';
const K_FR = 'Les croyants ne sont que des frères ; établissez donc la concorde entre vos frères. ';
const K_KAYNAK = 'Buhârî, Edeb, 69; Müslim, Birr ve Sıla, 105; ';
const sinirHadis = (p) => ({ tur: 'hadis', karakter: 0, oge: { id: 'sinir-' + p.ad, ar: kes(K_AR, p.ar), tr: kes(K_TR, p.tr), fr: kes(K_FR, p.fr), kaynak: kes(K_KAYNAK, p.kaynak) } });
const BD = BUTCE.duyuru;
const sinirDuyuru = { tur: 'duyuru', karakter: 0, oge: DUYURU({ id: 'sinir-duyuru', tr: { baslik: kes(K_TR, BD.baslik), metin: kes(K_TR, BD.tekSlaytMetin) }, fr: { baslik: kes(K_FR, BD.baslik), metin: kes(K_FR, BD.tekSlaytMetin) } }) };
/** Kur'an duası, bütçe sınırında (profil A ya da B); Arapçası Kur'an yüzüyle çizilmelidir. */
const sinirDua = (p) => ({ tur: 'dua', karakter: 0, oge: { id: 'sinir-dua-' + p.ad, kuran: true, ar: kes(K_AR, p.ar), tr: kes(K_TR, p.tr), fr: kes(K_FR, p.fr), kaynak: kes(K_KAYNAK, p.kaynak) } });
/** Esmâ, bütçe sınırında: AR 40, okunuş 30, TR 80, FR 90 (esma tabanında). */
const sinirEsma = { tur: 'esma', karakter: 0, oge: { id: 'sinir-esma', sira: 99, ar: kes(K_AR, BUTCE.esma.ar), okunus: kes('er-Rahmân er-Rahîm ', BUTCE.esma.okunus), tr: kes(K_TR, BUTCE.esma.tr), fr: kes(K_FR, BUTCE.esma.fr), kaynak: kes(K_KAYNAK, BUTCE.esma.kaynak) } };
/** Tek dilli duyuru, sınırda: başlık 60, metin 180 (tek levha). */
const sinirDuyuruTek = { tur: 'duyuru', karakter: 0, parca: { yerlesim: 'levha', diller: ['tr'] }, oge: DUYURU({ id: 'sinir-duyuru-tek', tr: { baslik: kes(K_TR, BD.baslik), metin: kes(K_TR, BD.ikiSlaytMetin) }, fr: undefined }) };
/** İki dilli, her dilin metni 180: TR ve FR ayrı iki slayt (91–180 kuralı); iki parça da sınırda ölçülür. */
const sinirDuyuruIki = [['tr', K_TR], ['fr', K_FR]].map(([dil, kalip]) => ({
  tur: 'duyuru', karakter: 0, parca: { yerlesim: 'levha', diller: [dil] },
  oge: DUYURU({ id: 'sinir-duyuru-' + dil, tr: { baslik: kes(K_TR, BD.baslik), metin: kes(K_TR, BD.ikiSlaytMetin) }, fr: { baslik: kes(K_FR, BD.baslik), metin: kes(K_FR, BD.ikiSlaytMetin) } }),
}));
/** Afişli duyuru, sağ sütun sınırında: başlık 30, metin 44, iki dil. Görsel oranı 16:9 (afiş %45 sınırına dayanır,
 *  yazı sütunu en dar) ve dikey afiş (0,707). */
const sinirAfis = (oran, ad) => ({
  tur: 'duyuru', karakter: 0, parca: { yerlesim: 'afis-sol', metinli: true },
  oge: DUYURU({ id: 'sinir-afis-' + ad, gorsel: '/media/duyurular/test-afis.svg', gorselOran: oran, tr: { baslik: kes(K_TR, BD.afisBaslik), metin: kes(K_TR, BD.afisMetin) }, fr: { baslik: kes(K_FR, BD.afisBaslik), metin: kes(K_FR, BD.afisMetin) } }),
});
/** Afişli ama metin sütuna sığmıyor (ya da başlık > 30): afiş slaytı yalnız başlıkla; en kötü hâl, iki dilde 60 karakterlik başlık, 16:9 afişin yanındaki dar sütunda. */
const sinirAfisBasligi = {
  tur: 'duyuru', karakter: 0, parca: { yerlesim: 'afis-sol', metinli: false },
  oge: DUYURU({ id: 'sinir-afis-baslik', gorsel: '/media/duyurular/test-afis.svg', gorselOran: 16 / 9, tr: { baslik: kes(K_TR, BD.baslik), metin: kes(K_TR, BD.afisMetin + 1) }, fr: { baslik: kes(K_FR, BD.baslik), metin: kes(K_FR, BD.afisMetin + 1) } }),
};
/** Kaynak satırı, ayraçsız 70 karakter (« · », « — », «; » yok): tek `span.bolunmez` nowrap olur, kırılamaz; en kötü hâl. */
const K_KAYNAK_AYRACSIZ = 'Buhârî Edeb Bâbü rahmeti’n-nâsi ve’l-behâim ';
const sinirKaynakBolunmez = { tur: 'hadis', karakter: 0, oge: { id: 'sinir-kaynak-ayracsiz', ar: kes(K_AR, BUTCE.manevi[0].ar), tr: kes(K_TR, BUTCE.manevi[0].tr), fr: kes(K_FR, BUTCE.manevi[0].fr), kaynak: kes(K_KAYNAK_AYRACSIZ, BUTCE.manevi[0].kaynak) } };
const SINIR_ICERIK = { derleme: '', eksik: [], ayetler: [], hadisler: [sinirHadis(BUTCE.manevi[1]).oge] };
const TEK_HADIS = { derleme: '', eksik: [], ayetler: [], hadisler: [ICERIK.hadisler[0]] };

/* Dua ve Esmâ fikstürleri. Dua gerçek bir Kur'an duasıdır (Tâhâ 20/114; Kur'an Yolu meali). Esmâ kaydı deneme
   fikstürüdür: anlam ve kaynak metni yayından alınmamıştır. */
const DUA_KURAN = { id: 'd1', ar: 'رَبِّ زِدْنِي عِلْمًا', tr: 'Rabbim! İlmimi artır.', kaynak: 'Tâhâ, 20/114 · Tâ-Hâ, 20:114 — Kur’an Yolu Meali', kuran: true };
const ESMA_DENEME = { id: 'esma-deneme', sira: 2, ar: 'الرَّحِيمُ', okunus: 'er-Rahîm', tr: 'Deneme anlamı', fr: 'Sens d’essai', kaynak: 'Deneme kaynağı' };
const ICERIK_TAM = { ...ICERIK, dualar: [DUA_KURAN], esmalar: [ESMA_DENEME] };

/* Derlemenin yayımladığı gerçek kayıtlar (onaylı ve bütçeye uyan; sitedeki hadisler dahil). Taban kapısında her biri
   de ölçülür. Dosya okunamazsa boş sayılır. Dualar ve Esmâ (dualar.json, esma.json) T4'ten beri vardır; içerik gelince taban kapısı
   onları da ölçer. */
const gercekSlaytlar = () => {
  const oku = (ad) => { try { return JSON.parse(readFileSync(resolve(process.cwd(), `src/data/ekran/${ad}.json`), 'utf8')); } catch { return []; } };
  const s = ekranIcerigi(oku('ayetler'), oku('hadisler'), AHLAK_HADISLERI, oku('dualar'), oku('esma'));
  return [].concat(
    s.ayetler.map((oge) => ({ tur: 'ayet', karakter: 0, oge })),
    s.hadisler.map((oge) => ({ tur: 'hadis', karakter: 0, oge })),
    (s.dualar || []).map((oge) => ({ tur: 'dua', karakter: 0, oge })),
    (s.esmalar || []).map((oge) => ({ tur: 'esma', karakter: 0, oge })),
  );
};

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

test('bütçe sınırındaki duyuru (başlık 60, metin 90, iki dil) dikey ekranda taşmadan sığar', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([sinirDuyuru.oge]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
  await expect(slayt).toHaveAttribute('data-sigdi', 'evet');
  expect(await slayt.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
});

// Sitede Cuma saati girilmişse Perşembe→Cuma gece yarısı vakit alanı Cuma satırı için 10u uzar, slayt alanı o kadar
// kısalır (ekran.css → .vakitler.cumali). Ekrandaki slayt yeni alana hemen yeniden sığdırılmalı; yoksa altı sonraki
// slayta dek (≤ 30 sn) kırpılırdı. Slayt bütçe sınırındaki iki dilli duyurudur (başlık 60, metin 90): Perşembe alanını
// büyütülmüş ölçekle doldurur, Cuma'nın 10u kısalmış alanına aynı ölçekle sığmaz; 60 sn'liktir, gece yarısı ekranda
// hâlâ aynı slayt vardır. Sahte saat slayt görününce durdurulur; gece yarısı makine yüküne değil runFor'a bağlı gelir.
test('Perşembe→Cuma gece yarısı Cuma satırı açılınca ekrandaki slayt yeni alana yeniden sığdırılır', async ({ page }) => {
  const cuma = kaynak.gunler.find(cumaMi);
  test.skip(!cuma, 'veride Cuma yok');
  const geceYarisi = an(cuma, '00:00').getTime();
  await page.route('**/ekran/', cumaSaatiEkle('13:30'));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([sinirDuyuru.oge], { tabanSn: 60, karakterSn: 0, enAzSn: 60, enCokSn: 60 }) }));
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
    // Slayt alanı ve içindeki slayt (levhaTasiyor ile aynı): alanın kaydırma boyu kendi alt boşluğuna taşanı saymaz.
    const k = s.firstElementChild;
    const t = Math.max(s.scrollHeight - s.clientHeight, k.scrollHeight - k.clientHeight);
    v.classList.remove('cumali');
    return t;
  });
  expect(tasma).toBeGreaterThan(1);
  await page.clock.runFor(geceYarisi - (await page.evaluate(() => Date.now())) + 2_000);
  await expect(vakitler).toHaveClass(/cumali/);
  await expect(page.locator('.cuma-saati b')).toHaveText('Cuma namazı 13:30');
  await expect(slayt.locator('.slayt-duyuru')).toBeVisible(); // aynı slayt, sıradaki slayt değil
  expect(await slayt.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  expect(await slayt.evaluate((e) => e.firstElementChild.scrollHeight - e.firstElementChild.clientHeight)).toBeLessThanOrEqual(1);
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

test('duyuru görseli yüklenemezse afiş gizlenir (kırık görsel simgesi kalmaz), slayt yazı levhasına döner', async ({ page }) => {
  await page.route('**/media/duyurular/olmayan-kapak.webp', (r) => r.fulfill({ status: 404, body: '' }));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ gorsel: '/media/duyurular/olmayan-kapak.webp' })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const kart = page.locator('.slayt-duyuru');
  await expect(kart.locator('.afis img')).toHaveCount(1);
  await expect(kart.locator('.afis')).toBeHidden();
  await expect(kart).toHaveAttribute('data-yerlesim', 'levha');
  await expect(kart.locator('.baslik').first()).toHaveText('Hayır çarşısı');
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
// Bütçe DIŞI sentetik fikstür (Arapça 210, TR 260, FR 350): ekran bu slaytı sığdıramaz ve atlar (Review Focus 4).
const UZUN_HADIS = { derleme: '', eksik: [], ayetler: [], hadisler: [{ id: 'uzun', kaynak: 'Buhârî, Bed’ü’l-vahy, 1; Müslim, İmâre, 155',
  // Sentetik uzunluk fikstürü (Arapça ~210, TR ~260, FR ~350 karakter): gerçek bir hadis metni değildir.
  ar: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى '.repeat(5).slice(0, 210),
  tr: 'Ameller ancak niyetlere göre değerlendirilir ve herkese ancak niyet ettiği şey vardır. '.repeat(4).slice(0, 260),
  fr: 'Les actes ne valent que par les intentions, et chacun n’obtient que ce qu’il a eu l’intention de faire. '.repeat(4).slice(0, 350) }] };
const AFIS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 16 9"><rect width="16" height="9" fill="#8a8a8a"/></svg>';
const UZUN_DUYURU = sinirDuyuru.oge;

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

  test('bütçe sınırındaki duyuru slayt alanından taşmaz', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([UZUN_DUYURU], SABIT_60SN) });
    await expect(page.locator('.slayt-duyuru')).toBeVisible();
    await expect(page.locator('[data-alan="slayt"]')).toHaveAttribute('data-sigdi', 'evet');
    await yatayDenetle(page);
  });

  test('hiçbir slayt sığmazsa atlanır, «Hoş geldiniz» görünür, tur donmaz', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([], SABIT_60SN), icerik: UZUN_HADIS });
    const slayt = page.locator('[data-alan="slayt"]');
    // İlk slayt yazı tipleri yüklenirken gösterilmiş olabilir (yalnız o durumda atlanmaz); yazı tipleri oturduktan sonra
    // 60 sn'lik slayt süresi dolunca tur yeniden kurulur ve sığmayan slayt artık atlanır.
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.clock.runFor(61_000);
    await expect(page.locator('.slayt.bos')).toBeVisible();
    const once = Number(await slayt.getAttribute('data-atlanan'));
    expect(once).toBeGreaterThanOrEqual(1);
    await page.clock.runFor(16_000);
    await expect.poll(async () => Number(await slayt.getAttribute('data-atlanan'))).toBeGreaterThan(once);
    await yatayDenetle(page);
  });

  test('turun SON slaytı sığmazsa «Hoş geldiniz» çıkmaz; tur sınırında sonraki turun ilk slaytı gelir', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([DUYURU()], SABIT_60SN), icerik: UZUN_HADIS });
    const slayt = page.locator('[data-alan="slayt"]');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // Tur: [duyuru, uzun hadis]. Hadis sığmaz; her tur sınırında yeni tur kurulup duyuru yeniden gösterilir.
    for (let i = 0; i < 4; i++) {
      await page.clock.runFor(61_000);
      await expect(page.locator('.slayt.bos'), 'tur ' + i).toHaveCount(0);
      await expect(page.locator('.slayt-duyuru')).toBeVisible();
    }
    expect(Number(await slayt.getAttribute('data-atlanan')), 'sığmayan hadis atlandı').toBeGreaterThanOrEqual(1);
    await yatayDenetle(page);
  });

  for (const oran of [16 / 9, 0.707]) {
    test(`görselli duyuru (oran ${oran.toFixed(3)}): afiş solda panel boyunca, genişlik = min(yükseklik × oran, %45); yazı sağda; taşma yok`, async ({ page }) => {
      await page.route('**/media/duyurular/test-afis.svg', (r) => r.fulfill({ contentType: 'image/svg+xml', body: AFIS_SVG }));
      await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([DUYURU({ gorsel: '/media/duyurular/test-afis.svg', gorselOran: oran })], SABIT_60SN) });
      const kart = page.locator('.slayt-duyuru');
      await expect(kart).toHaveAttribute('data-yerlesim', 'afis-sol');
      await expect.poll(() => kart.locator('.afis img').evaluate((e) => e.complete && e.naturalWidth > 0)).toBe(true);
      const o = await kart.evaluate((e) => {
        const r = (s) => { const b = e.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, width: b.width, height: b.height }; };
        return { afis: r('.afis'), govde: r('.afisli'), levha: r('.afisli .levha') };
      });
      expect(o.afis.width, 'afiş en çok %45').toBeLessThanOrEqual(o.govde.width * AFIS_EN_COK + 1);
      expect(Math.abs(o.afis.width - Math.min(o.govde.height * oran, o.govde.width * AFIS_EN_COK)), 'genişlik = min(yükseklik × oran, %45)').toBeLessThanOrEqual(1);
      expect(Math.abs(o.afis.height - o.govde.height), 'afiş panel boyunca').toBeLessThanOrEqual(1);
      expect(o.levha.left, 'yazı afişin sağında').toBeGreaterThanOrEqual(o.afis.right);
      await expect(page.locator('[data-alan="slayt"]')).toHaveAttribute('data-sigdi', 'evet');
      await yatayDenetle(page);
    });
  }

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
  let akisModu = 'duyuru';
  let icerikModu = 'normal';
  await page.route('**/ekran/', (route) => (cumaSaati === null ? route.fallback() : cumaSaatiEkle(cumaSaati)(route)));
  await page.route('**/media/duyurular/test-afis.svg', (r) => r.fulfill({ contentType: 'image/svg+xml', body: AFIS_SVG }));
  const AFISLI = DUYURU({ gorsel: '/media/duyurular/test-afis.svg', gorselOran: 16 / 9, tr: { baslik: 'Kermes', metin: 'Pazar 14.00, cami bahçesi.' }, fr: { baslik: 'Kermesse', metin: 'Dimanche 14 h, cour de la mosquée.' } });
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: akisModu === 'duyuru' ? AKIS([DUYURU()], SABIT_60SN) : akisModu === 'afis' ? AKIS([AFISLI], SABIT_60SN) : AKIS([], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: icerikModu === 'sinir' ? SINIR_ICERIK : icerikModu === 'tek' ? TEK_HADIS : ICERIK }));
  const sahneler = [
    ['yatay-duzen-acik', [1920, 1080], an(ornek, ornek.ogle, -30), 'ogle'],
    ['yatay-duzen-koyu', [1920, 1080], an(ornek, ornek.aksam, 30), 'yatsi'],
    ['yatay-duzen-961x541', [961, 541], an(ornek, ornek.ogle, -30), 'ogle'],
    ['yatay-duzen-cuma', [961, 541], cumaGunu ? an(cumaGunu, cumaGunu.ogle, -30) : null, 'ogle', () => { cumaSaati = '13:30'; }],
    ['levha-kisa-ayet', [961, 541], an(ornek, ornek.ogle, -30), 'ogle', () => { cumaSaati = null; akisModu = 'bos'; }],
    ['levha-kisa-hadis-koyu', [1280, 720], an(ornek, ornek.aksam, 30), 'yatsi', () => { icerikModu = 'tek'; }],
    ['levha-sinir-hadis', [961, 541], an(ornek, ornek.ogle, -30), 'ogle', () => { icerikModu = 'sinir'; }],
    ['levha-duyuru-afis', [961, 541], an(ornek, ornek.ogle, -30), 'ogle', () => { akisModu = 'afis'; icerikModu = 'normal'; }],
    ['yatay-duzen-yarin-imsak', [961, 541], an(yatsiGunu, yatsiGunu.yatsi, 30), 'imsak', () => { akisModu = 'duyuru'; icerikModu = 'normal'; }],
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

test.describe('levha (A): ortalı, iki yönlü sığdırma, 1280×720', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('kısa hadis levhayı doldurur: ölçek büyür, Arapça ortalı; levha dikeyde ortalı', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([], SABIT_60SN), icerik: TEK_HADIS });
    const slayt = page.locator('[data-alan="slayt"]');
    await expect(slayt.locator('.slayt-hadis')).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(slayt).toHaveAttribute('data-sigdi', 'evet');
    expect(Number(await slayt.getAttribute('data-olcek')), 'kısa metin büyür').toBeGreaterThanOrEqual(1.3);
    expect(await slayt.locator('.levha .ar').evaluate((e) => getComputedStyle(e).textAlign)).toBe('center');
    await yatayDenetle(page);
    // Dikey ortalama taban ölçekte (1) ölçülür: büyütülmüş levha alanı doldurur ve boşluk kalmaz. Değer elle yazılır;
    // alanın boyu değişmediği için sığdırma bunu ölçüm bitene dek geri almaz.
    const o = await slayt.evaluate((e) => {
      e.style.setProperty('--olcek', '1');
      const kart = e.querySelector('.slayt').getBoundingClientRect();
      const baslik = e.querySelector('.ust-baslik').getBoundingClientRect();
      const levha = e.querySelector('.levha').getBoundingClientRect();
      return { ust: levha.top - baslik.bottom, alt: kart.bottom - levha.bottom, u: parseFloat(getComputedStyle(document.getElementById('ekran')).getPropertyValue('--u')) };
    });
    expect(o.alt, 'taban ölçekte levhanın altında boşluk kalır').toBeGreaterThan(5 * o.u);
    expect(Math.abs(o.ust - o.alt), 'levha dikeyde ortalı (üst başlığın 1,5u alt boşluğu payı)').toBeLessThanOrEqual(2 * o.u + 1);
  });

  /* TV'de görülen iki kusur (29 Eylül 2026), yayındaki onaylı kayıtlarla: (1) iki satırlık kaynak slayt alanının alt
     kenar boşluğuna taşıyordu — ölçüm yalnız slayt alanının kaydırma boyuna bakıyor, alt boşluğa taşan içeriği
     görmüyordu; (2) Kur'an yüzünde durak işaretleri (ۙۖ) satır kutusunun üstüne çıkıp üst başlığa değiyordu. */
  const DUA_UZUN_KAYNAK = { id: 'd-23-26', ar: 'قَالَ رَبِّ انْصُرْنٖي بِمَا كَذَّبُونِ', tr: 'Nûh, “Rabbim! Bunların beni yalancılıkla suçlamalarına karşı bana yardım et!” dedi.', kaynak: "Mü'minûn, 23/26 · Al-Mou’minoun, 23:26 — Kur’an Yolu Meali", kuran: true };
  const AYET_DURAK_ISARETLI = { id: 'a-91-9', referans: { tr: 'Şems, 91/9-10', fr: 'Ach-Chams, 91:9-10' }, ar: 'قَدْ اَفْلَحَ مَنْ زَكّٰيهَاۙۖ وَقَدْ خَابَ مَنْ دَسّٰيهَاؕ', tr: 'Nefsini arındıran elbette kurtuluşa ermiştir. Onu kötülüklere boğan da ziyan etmiştir.', kaynakTr: 'Kur’an Yolu Meali' };

  test('levha slayt alanının iç kenar boşluğuna taşmaz: iki satırlık kaynaklı Kur’an duası', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([], SABIT_60SN), icerik: { derleme: '', eksik: [], ayetler: [], hadisler: [], dualar: [DUA_UZUN_KAYNAK] } });
    const slayt = page.locator('[data-alan="slayt"]');
    await expect(slayt.locator('.slayt-dua')).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(slayt).toHaveAttribute('data-sigdi', 'evet');
    const o = await slayt.evaluate((e) => {
      const kart = e.querySelector('.slayt');
      const son = e.querySelector('.levha').lastElementChild.getBoundingClientRect();
      return { ic: kart.scrollHeight - kart.clientHeight, bosluk: kart.getBoundingClientRect().bottom - son.bottom };
    });
    expect(o.ic, 'slayt içeriği slayt kutusundan taşmaz').toBeLessThanOrEqual(1);
    expect(o.bosluk, 'son satır slayt kutusunun içinde biter').toBeGreaterThanOrEqual(-1);
  });

  test('Kur’an satırındaki durak işaretleri üst başlığa değmez (Şems 91/9-10)', async ({ page }) => {
    await yatayAc(page, an(ornek, ornek.ogle, -30), { siradaki: 'ogle', akis: AKIS([], SABIT_60SN), icerik: { derleme: '', eksik: [], ayetler: [AYET_DURAK_ISARETLI], hadisler: [] } });
    const slayt = page.locator('[data-alan="slayt"]');
    await expect(slayt.locator('.slayt-ayet')).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(slayt).toHaveAttribute('data-sigdi', 'evet');
    // Mürekkebin üst ucu: satır kutusunun üstü + (satır yüksekliği − yazı tipi yüksekliği)/2 + yazı tipi yükselişi
    // − glif yükselişi (canvas measureText, aynı yazı tipi). İlk satır: .ar kutusunun üstü + üst dolgu.
    const o = await slayt.evaluate((e) => {
      const ar = e.querySelector('.levha .ar');
      const cs = getComputedStyle(ar);
      const tuval = document.createElement('canvas').getContext('2d');
      tuval.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = tuval.measureText(ar.textContent);
      const lh = parseFloat(cs.lineHeight);
      const satirUstu = ar.getBoundingClientRect().top + parseFloat(cs.paddingTop);
      const murekkepUstu = satirUstu + m.fontBoundingBoxAscent + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 - m.actualBoundingBoxAscent;
      const u = parseFloat(getComputedStyle(document.getElementById('ekran')).getPropertyValue('--u'));
      return { aralik: murekkepUstu - e.querySelector('.ust-baslik').getBoundingClientRect().bottom, u, yuz: ar.getAttribute('data-yuz') };
    });
    expect(o.yuz).toBe('kuran');
    expect(o.aralik, `durak işareti ile üst başlık arasında en az 1u boşluk (ölçülen ${(o.aralik / o.u).toFixed(2)}u)`).toBeGreaterThanOrEqual(o.u);
  });
});

/* Taban kapısı: bütçe sınırındaki metin her tuvalde okunur tabanın altına inmeden sığmalı. Üç sahne: en dar yatay
   (Polaroid TV), Cuma satırıyla dikey (slayt alanı 10u kısalır) ve döndürülmüş tuval (?don=90: ölçüm döndürmeye
   kanmamalı — Review Focus 2). Slaytlar levha ölçerle sayfada doğrudan çizilir; sahte saat durdurulur. */
const TABAN_SAHNELERI = [
  ['yatay 961×541', { width: 961, height: 541 }, '/ekran/', 'yatay', false],
  ['dikey 1080×1920, Cuma satırıyla', { width: 1080, height: 1920 }, '/ekran/', 'dikey', true],
  ['döndürülmüş ?don=90 (1920×1080 pencere, dikey tuval)', { width: 1920, height: 1080 }, '/ekran/?don=90', 'dikey', false],
];
/** Sahneyi açar, saati durdurur ve levha ölçeri yükler (taban kapısı ve T7'deki kalibrasyon ortak kullanır). */
async function tabanSahnesiAc(page, [, viewport, adres, duzen, cumali]) {
  await page.setViewportSize(viewport);
  if (cumali) await page.route('**/ekran/', cumaSaatiEkle('13:30'));
  await page.route('**/media/duyurular/test-afis.svg', (r) => r.fulfill({ contentType: 'image/svg+xml', body: AFIS_SVG }));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: TEK_HADIS }));
  await page.clock.install({ time: cumali ? an(cumaGunu, '12:00') : an(ornek, '12:00') });
  await page.goto(adres);
  await expect(page.locator('#ekran')).toHaveAttribute('data-duzen', duzen);
  await expect(page.locator('.vakit')).toHaveCount(6);
  if (cumali) await expect(page.locator('[data-alan="vakitler"]')).toHaveClass(/cumali/);
  await expect(page.locator('[data-alan="slayt"] .slayt-hadis')).toBeVisible();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1_000));
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await levhaOlcerYukle(page);
}

for (const sahne of TABAN_SAHNELERI) {
  test(`taban kapısı, ${sahne[0]}: bütçe sınırındaki hadis ve Kur’an duası (profil A ve B), Esmâ ve duyuru tabanın altına inmez, taşmaz`, async ({ page }) => {
    test.skip(sahne[4] && !cumaGunu, 'veride Cuma yok');
    await tabanSahnesiAc(page, sahne);
    const duyurular = [sinirKaynakBolunmez, sinirDuyuru, sinirDuyuruTek, sinirAfis(16 / 9, 'genis'), sinirAfis(0.707, 'dikey'), sinirAfisBasligi].concat(sinirDuyuruIki);
    const sonuclar = await levhaOlc(page, [sinirHadis(BUTCE.manevi[0]), sinirHadis(BUTCE.manevi[1]), sinirDua(BUTCE.manevi[0]), sinirDua(BUTCE.manevi[1]), sinirEsma].concat(duyurular, gercekSlaytlar()));
    for (const o of sonuclar) {
      expect(o.sigdi, `${o.id} sığmalı`).toBe(true);
      tabanDenetle(o);
      if (o.id.indexOf('sinir-afis-') === 0) {
        expect(o.afisGenislik, `${o.id} afiş kutusu boyutlanmış`).toBeGreaterThan(0);
        expect(Math.abs(o.afisGenislik - Math.min(o.govdeH * o.afisOran, o.govdeW * AFIS_EN_COK)), `${o.id} afiş genişliği = min(yükseklik × oran, %45)`).toBeLessThanOrEqual(1);
      }
      if (o.id.indexOf('sinir-dua-') === 0) expect(o.yuz, `${o.id} Kur'an yüzü`).toBe('kuran');
    }
  });
}

/* Arapça yazı tipi dosyası (bugün amiri-arabic.woff2; T6'dan sonra arapca-*.woff2): Work Sans dışındaki her yazı tipi. */
const ARAPCA_YAZI_TIPI = (u) => u.pathname.indexOf('/ekran/fonts/') === 0 && u.pathname.indexOf('work-sans') < 0;

test('geç gelen Arapça yazı tipi: ilk levha yedek yazı tipiyle çizilir, yazı tipi gelince yeniden sığdırılır', async ({ page }) => {
  let birak;
  const bekleyen = new Promise((r) => { birak = r; });
  await page.route(ARAPCA_YAZI_TIPI, async (route) => { await bekleyen; await route.continue(); });
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: TEK_HADIS }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/', { waitUntil: 'commit' }); // bekleyen yazı tipi 'load' olayını da geciktirir
  await expect(page.locator('.vakit')).toHaveCount(6); // veri geldi; yazı tipi beklemesi (en çok 3 sn) başladı
  await page.clock.runFor(3_100);
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-hadis')).toBeVisible();
  // Kanıt: yeniden sığdırma olmazsa bu değer kalırdı (levhaSigdir ölçeği 1'in altına indirmez).
  await slayt.evaluate((e) => { e.style.setProperty('--olcek', '0.5'); e.setAttribute('data-olcek', '0.500'); });
  birak();
  await expect.poll(() => slayt.getAttribute('data-olcek')).not.toBe('0.500');
  expect(Number(await slayt.getAttribute('data-olcek'))).toBeGreaterThanOrEqual(1);
  expect(await slayt.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
});

test('boşluksuz uzun dize (duyuru metninde web adresi) satırı kırar, yatay taşma olmaz', async ({ page }) => {
  // Son parça 64 harf, içinde hiç kırılma fırsatı yok (tire, boşluk yok); ölçek 1'de bir satıra ~50 harf sığar.
  const adres = 'ulucamii.be/duyurular/' + 'yillikgenelkurul'.repeat(4);
  await page.setViewportSize({ width: 961, height: 541 });
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ tr: { baslik: 'Genel kurul', metin: adres }, fr: undefined })], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-duyuru')).toBeVisible();
  await expect(slayt).toHaveAttribute('data-sigdi', 'evet');
  expect(await slayt.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
});

test('yazı tipleri yüklenirken sığmayan slayt atlanmaz (ölçüm yedek yazı tipiyle), yazı tipi gelince yeniden sığdırılır', async ({ page }) => {
  let birak;
  const bekleyen = new Promise((r) => { birak = r; });
  await page.setViewportSize({ width: 961, height: 541 });
  await page.route(ARAPCA_YAZI_TIPI, async (route) => { await bekleyen; await route.continue(); });
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: UZUN_HADIS }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/', { waitUntil: 'commit' });
  await expect(page.locator('.vakit')).toHaveCount(6);
  await page.clock.runFor(3_100);
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-hadis')).toBeVisible(); // atlanıp «Hoş geldiniz»e düşmedi
  await expect(slayt).toHaveAttribute('data-atlanan', '0');
  birak();
  await expect.poll(() => slayt.getAttribute('data-sigdi')).toBe('hayir'); // yazı tipi gelince yeniden ölçüldü
});

test('manevi blok ayet → hadis → dua → Esmâ; Kur’an metni Kur’an yüzüyle; Esmâ’da okunuş ve sıra', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK_TAM }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-ayet .ar')).toHaveAttribute('data-yuz', 'kuran');
  await page.clock.runFor(10_500);
  await expect(slayt.locator('.slayt-hadis .ar')).not.toHaveAttribute('data-yuz', 'kuran');
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-dua .ar')).toHaveAttribute('data-yuz', 'kuran');
  await expect(slayt.locator('.slayt-dua .kaynak')).toHaveText('Tâhâ, 20/114 · Tâ-Hâ, 20:114 — Kur’an Yolu Meali');
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-esma .okunus')).toHaveText('er-Rahîm');
  await expect(slayt.locator('.slayt-esma .ust-baslik .sira')).toHaveText('2/99');
  await expect(slayt).toHaveAttribute('data-sigdi', 'evet');
});

test('tur hedef süreyi aşınca manevi blok turlara bölünür: duyuru her turda kalır, ikinci tur kalan öğeden başlar', async ({ page }) => {
  const akis = AKIS([DUYURU()]);
  // Her slayt 10 sn. Duyuru 10 + manevi 4 × 10 = 50 sn > 40 → turda 3 manevi: tur 0 = du, ayet, hadis, dua (0–40 sn);
  // tur 1 = du, Esmâ, ayet, hadis. Bölünmeseydi tur du, ayet, hadis, dua, Esmâ olurdu ve 40. sn'de Esmâ görünürdü.
  akis.ayar.turHedefSn = 40;
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: akis }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK_TAM }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-duyuru')).toBeVisible(); // 0 sn
  await page.clock.runFor(30_500);
  await expect(slayt.locator('.slayt-dua')).toBeVisible(); // 30 sn: turun son slaytı
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-duyuru')).toBeVisible(); // 40 sn: ikinci tur duyuruyla başlar (bölünmemişte Esmâ)
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-esma')).toBeVisible(); // 50 sn: ikinci turda Esmâ öne geçti
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-ayet')).toBeVisible();
});

// Review Focus 3: kutunun önbelleğinde A öncesi icerik.json (dualar ve esmalar yok) ile yeni paket bir arada çalışır.
test('önbellekteki eski içerik akışı (dualar ve esmalar alanı yok) turu bozmaz; sayfa hatası yok', async ({ page }) => {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(String(e)));
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-ayet')).toBeVisible();
  await page.clock.runFor(10_500);
  await expect(slayt.locator('.slayt-hadis')).toBeVisible();
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-ayet')).toBeVisible(); // tur başa döndü
  expect(hatalar).toEqual([]);
});

test('kaynak satırı başvurunun ortasından bölünmez: «94/5-6» gibi her parça tek satırda kalır', async ({ page }) => {
  await tabanSahnesiAc(page, TABAN_SAHNELERI[0]);
  const ayet = { tur: 'ayet', karakter: 0, oge: { id: 'a-kaynak', referans: { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)' } };
  const sonuc = await page.evaluate((s) => {
    const kok = document.querySelector('[data-alan="slayt"]');
    window.__levha.slaytCiz(kok, s);
    kok.querySelector('.levha').style.width = '18%'; // dar levha: kaynak satırı zorla birkaç satıra kırılır
    const p = kok.querySelector('.levha .kaynak');
    const parcalar = Array.prototype.map.call(p.querySelectorAll('.bolunmez'), (b) => ({ metin: b.textContent, dikdortgen: b.getClientRects().length }));
    const satir = parseFloat(getComputedStyle(p).lineHeight);
    return { parcalar, satirSayisi: Math.round(p.getBoundingClientRect().height / satir), metin: p.textContent };
  }, ayet);
  expect(sonuc.metin).toBe('İnşirah, 94/5-6 · Ach-Charh, 94:5-6 — Kur’an Yolu Meali (DİB)'); // ölçülen dize ile aynı
  expect(sonuc.satirSayisi).toBeGreaterThan(1); // kırılma gerçekten oldu
  expect(sonuc.parcalar.map((x) => x.metin)).toEqual(['İnşirah, 94/5-6', 'Ach-Charh, 94:5-6', 'Kur’an Yolu Meali (DİB)']);
  for (const x of sonuc.parcalar) expect(x.dikdortgen, `«${x.metin}» tek satırda`).toBe(1);
});

test('yazı tipi yükleme istisnası sınırlıdır: yazı tipi hazırlık beklemesinden sonra da yüklenmiyorsa sığmayan slayt atlanır', async ({ page }) => {
  await page.setViewportSize({ width: 961, height: 541 });
  await page.route(ARAPCA_YAZI_TIPI, () => new Promise(() => undefined)); // yazı tipi hiç gelmez
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([], SABIT_60SN) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: UZUN_HADIS }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/', { waitUntil: 'commit' });
  await expect(page.locator('.vakit')).toHaveCount(6);
  await page.clock.runFor(3_100);
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-hadis')).toBeVisible(); // ilk 10 sn içinde gösterilir
  await page.clock.runFor(61_000); // tur yeniden kurulur; 10 sn geçti → atlanır
  await expect(slayt).toHaveAttribute('data-sigdi', 'bos');
  // Tek slaytlık turda hadis iki kez denenir (tur + yeniden kurulan tur): her atlama olayı sayılır.
  await expect(slayt).toHaveAttribute('data-atlanan', '2');
});

test('iki dilli duyurunun metni 90 karakteri aşarsa TR ve FR ayrı slaytlarda gösterilir', async ({ page }) => {
  const tr = kes(K_TR, 120);
  const fr = kes(K_FR, 120);
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ tr: { baslik: 'Genel kurul', metin: tr }, fr: { baslik: 'Assemblée générale', metin: fr } })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const kart = page.locator('[data-alan="slayt"] .slayt-duyuru');
  await expect(kart.locator('p.tr')).toHaveText(tr);
  await expect(kart.locator('p.fr')).toHaveCount(0);
  await page.clock.runFor(10_500);
  await expect(kart.locator('.baslik.fr')).toHaveText('Assemblée générale');
  await expect(kart.locator('p.tr')).toHaveCount(0);
});

test('afişli duyurunun metni sağ sütuna sığmazsa afiş slaytından sonra metin levhası gelir (içerik düşmez)', async ({ page }) => {
  await page.route('**/media/duyurular/test-afis.svg', (r) => r.fulfill({ contentType: 'image/svg+xml', body: AFIS_SVG }));
  // DUYURU()'nun FR metni 47 karakter: afiş sütununun 44 sınırını aşar.
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ gorsel: '/media/duyurular/test-afis.svg', gorselOran: 0.707 })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const kart = page.locator('[data-alan="slayt"] .slayt-duyuru');
  await expect(kart).toHaveAttribute('data-yerlesim', 'afis-sol');
  await expect(kart.locator('.baslik').first()).toHaveText('Hayır çarşısı');
  await expect(kart.locator('p.tr')).toHaveCount(0);
  await page.clock.runFor(10_500);
  await expect(kart).toHaveAttribute('data-yerlesim', 'levha');
  await expect(kart.locator('p.fr').last()).toHaveText('Dimanche après-midi dans la cour de la mosquée.');
});

/* Bütçe kalibrasyonu (yalnız EKRAN_KALIBRE=1; src/lib/ekran/butce.ts). Her profilin alanları birlikte ölçeklenir
   (uzunluk = f × bütçe; kaynak satırı sabit, ayraçsız en kötü hâl) ve ölçek 1'de sığan en büyük f ikiye bölerek bulunur.
   En dar iki tuvalde (yatay 961×541, dikey Cuma satırlı) ölçülür, küçüğü alınır. Manevi profiller iki türle ölçülür:
   ayet (Kur'an yüzü, satır aralığı 1,95) ve hadis (metin yüzü, 1,75); küçük f alınır. Deneme metinleri gerçek Diyanet
   cümlelerinden kesilir; sıra: imam onaylı kayıtlar → taslak kayıtlar (src/data/ekran) → sitedeki hadisler
   (hadis-verisi.ts) → sentetik K_* (son çare). Öneri = ⌊0,95 × f × bütçe⌋ → test-results/ekran-kalibre.json.
   Duyuru sınırları (60/90/180/30/44) karardır, hesaplanmaz: f < 1 ise test düşer ve durum karar sahibine sorulur. */
test('bütçe kalibrasyonu (yalnız EKRAN_KALIBRE=1)', async ({ page }) => {
  test.skip(!process.env.EKRAN_KALIBRE, 'kalibrasyon isteğe bağlı');
  test.setTimeout(900_000);
  const oku = (ad) => { try { return JSON.parse(readFileSync(resolve(process.cwd(), `src/data/ekran/${ad}.json`), 'utf8')); } catch { return []; } };
  const kaynaklar = {};
  /** Alan için metin kalıbı: onaylı → taslak → yedek liste (sitedeki hadisler) → sentetik. Hangi kaynağın seçildiği kaydedilir. */
  const kalip = (ad, alan, dosya, yedekListe, sentetik) => {
    const liste = oku(dosya);
    const dene = [['imam-onayli', liste.filter((x) => x && x.durum === 'imam-onayli')], ['taslak', liste.filter((x) => x && x.durum === 'taslak')], ['hadis-verisi', yedekListe]];
    for (const [kaynak, l] of dene) {
      const metin = l.map((x) => x[alan]).filter(Boolean).join(' ');
      if (metin) { kaynaklar[ad] = kaynak; return metin + ' '; }
    }
    kaynaklar[ad] = 'sentetik';
    return sentetik;
  };
  const siteAr = AHLAK_HADISLERI.map((h) => ({ ar: h.arapca, tr: h.metin.tr, fr: h.metin.fr }));
  const H = { ar: kalip('hadis.ar', 'ar', 'hadisler', siteAr, K_AR), tr: kalip('hadis.tr', 'tr', 'hadisler', siteAr, K_TR), fr: kalip('hadis.fr', 'fr', 'hadisler', siteAr, K_FR) };
  // Ayetler bugün FR'siz yayımlanır (Le Noble Coran dijitalde yok): depoda FR'li ayet yoksa ayet profili FR'siz ölçülür.
  // Ayetlere FR eklendiğinde bu dal kendiliğinden FR'li ölçer; o gün kalibrasyon yeniden çalıştırılmalıdır.
  const ayetFrVar = oku('ayetler').some((x) => x && x.fr);
  if (!ayetFrVar) kaynaklar['ayet.fr'] = 'yok (ayetler FR’siz yayımlanır)';
  const Ay = { ar: kalip('ayet.ar', 'ar', 'ayetler', [], K_AR), tr: kalip('ayet.tr', 'tr', 'ayetler', [], K_TR), fr: ayetFrVar ? kalip('ayet.fr', 'fr', 'ayetler', siteAr, K_FR) : '' };
  const E = { ar: kalip('esma.ar', 'ar', 'esma', siteAr, 'الرَّحِيمُ '), okunus: kalip('esma.okunus', 'okunus', 'esma', [], 'er-Rahîm '), tr: kalip('esma.tr', 'tr', 'esma', siteAr, K_TR), fr: kalip('esma.fr', 'fr', 'esma', siteAr, K_FR) };
  kaynaklar.kaynak = 'sentetik (ayraçsız en kötü hâl)';
  const REF = { tr: 'Âl-i İmrân, 3/190-191', fr: 'Al-Imran, 3:190-191' };
  const profiller = [];
  for (const p of BUTCE.manevi) {
    profiller.push({ ad: 'manevi-' + p.ad, tur: 'hadis', b: { ar: p.ar, tr: p.tr, fr: p.fr },
      yap: (n) => ({ id: 'k', ar: kes(H.ar, n.ar), tr: kes(H.tr, n.tr), fr: kes(H.fr, n.fr), kaynak: kes(K_KAYNAK_AYRACSIZ, p.kaynak) }) });
    profiller.push({ ad: 'manevi-' + p.ad, tur: 'ayet', b: { ar: p.ar, tr: p.tr, fr: p.fr },
      yap: (n) => ({ id: 'k', referans: REF, ar: kes(Ay.ar, n.ar), tr: kes(Ay.tr, n.tr), fr: Ay.fr ? kes(Ay.fr, n.fr) : undefined, kaynakTr: kes('Kur’an Yolu Meali (DİB) ', p.kaynak - (REF.tr.length + REF.fr.length + 6)), kaynakFr: 'x' }) });
  }
  profiller.push({ ad: 'esma', tur: 'esma', b: { ar: BUTCE.esma.ar, okunus: BUTCE.esma.okunus, tr: BUTCE.esma.tr, fr: BUTCE.esma.fr },
    yap: (n) => ({ id: 'k', sira: 1, ar: kes(E.ar, n.ar), okunus: kes(E.okunus, n.okunus), tr: kes(E.tr, n.tr), fr: kes(E.fr, n.fr), kaynak: kes(K_KAYNAK_AYRACSIZ, BUTCE.esma.kaynak) }) });
  profiller.push({ ad: 'duyuru-iki-dil', tur: 'duyuru', karar: true, b: { baslik: BD.baslik, metin: BD.tekSlaytMetin },
    yap: (n) => DUYURU({ tr: { baslik: kes(K_TR, n.baslik), metin: kes(K_TR, n.metin) }, fr: { baslik: kes(K_FR, n.baslik), metin: kes(K_FR, n.metin) } }) });
  profiller.push({ ad: 'duyuru-tek-dil', tur: 'duyuru', karar: true, parca: { yerlesim: 'levha', diller: ['tr'] }, b: { baslik: BD.baslik, metin: BD.ikiSlaytMetin },
    yap: (n) => DUYURU({ tr: { baslik: kes(K_TR, n.baslik), metin: kes(K_TR, n.metin) }, fr: undefined }) });
  profiller.push({ ad: 'duyuru-afis', tur: 'duyuru', karar: true, parca: { yerlesim: 'afis-sol', metinli: true }, b: { baslik: BD.afisBaslik, metin: BD.afisMetin },
    yap: (n) => DUYURU({ gorsel: '/media/duyurular/test-afis.svg', gorselOran: 16 / 9, tr: { baslik: kes(K_TR, n.baslik), metin: kes(K_TR, n.metin) }, fr: { baslik: kes(K_FR, n.baslik), metin: kes(K_FR, n.metin) } }) });
  const sigar = async (sayfa, p, f) => {
    const n = {};
    for (const [k, v] of Object.entries(p.b)) n[k] = Math.max(1, Math.round(f * v));
    const [o] = await levhaOlc(sayfa, [{ tur: p.tur, karakter: 0, parca: p.parca, oge: p.yap(n) }]);
    return o.sigdi && o.tasmaY <= 1 && o.tasmaX <= 1;
  };
  const enBuyukF = async (sayfa, p) => {
    let lo = 0.3;
    let hi = 2.5;
    if (!(await sigar(sayfa, p, lo))) return 0;
    if (await sigar(sayfa, p, hi)) return hi;
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (await sigar(sayfa, p, m)) lo = m; else hi = m; }
    return lo;
  };
  const f = {};
  // Sahne başına yeni sayfa: sahte saat bir sayfada bir kez kurulur. Bağlamın ağ yalıtımı yeni sayfaya da geçer.
  for (const sahne of TABAN_SAHNELERI.slice(0, 2)) {
    if (sahne[4] && !cumaGunu) continue;
    const sayfa = await page.context().newPage();
    await tabanSahnesiAc(sayfa, sahne);
    for (const p of profiller) { const k = p.ad + '|' + p.tur; f[k] = Math.min(f[k] ?? Infinity, await enBuyukF(sayfa, p)); }
    await sayfa.close();
  }
  const sonuc = profiller.map((p) => {
    const fp = f[p.ad + '|' + p.tur];
    return { profil: p.ad, tur: p.tur, f: Number(fp.toFixed(3)), bugun: p.b, oneri: Object.fromEntries(Object.entries(p.b).map(([k, v]) => [k, Math.floor(0.95 * fp * v)])) };
  });
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/ekran-kalibre.json', JSON.stringify({ metinKaynaklari: kaynaklar, sonuc }, null, 2));
  console.log(JSON.stringify({ metinKaynaklari: kaynaklar, sonuc }, null, 2));
  for (const p of profiller.filter((x) => x.karar)) expect.soft(f[p.ad + '|' + p.tur], `${p.ad}: karar sınırı ekrana sığmalı`).toBeGreaterThanOrEqual(1);
});

/* ---- Kabuk köprüsü (Android kabuğu → sayfa, B1): window.UluKabukAl; src/ekran/kabuk.ts ---- */
const KABUK_DUYURU = (ek = {}) => ({ id: 'imam-1', tur: 'duyuru', tr: { baslik: 'Kabuk duyurusu', metin: 'Firestore’dan geldi.' }, fr: { baslik: 'Annonce', metin: 'Reçue du boîtier.' }, baslangic: '2000-01-01', son: '2099-12-31', hedef: [], ...ek });
const kabukIt = (page, rev, duyurular) => page.evaluate(([r, d]) => window.UluKabukAl(JSON.stringify({ rev: r, duyurular: d })), [rev, duyurular]);

async function kabukSayfasi(page, akisDuyurulari = []) {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS(akisDuyurulari) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="slayt"] .slayt').first()).toBeVisible();
  expect(await page.evaluate(() => typeof window.UluKabukAl)).toBe('function');
}

test('kabuktan itilen duyuru, ekrandaki slaytın bitmesi beklenmeden saniyeler içinde görünür', async ({ page }) => {
  await kabukSayfasi(page);
  await expect(page.locator('[data-alan="slayt"] .slayt-duyuru')).toHaveCount(0);
  await kabukIt(page, 1, [KABUK_DUYURU()]);
  await page.clock.runFor(2_000);
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toHaveText('Kabuk duyurusu');
  await expect(slayt.locator('.slayt-duyuru p.fr').last()).toHaveText('Reçue du boîtier.');
});

test('eski ya da eşit rev yok sayılır, yeni rev listeyi değiştirir, boş liste duyuruyu kaldırır', async ({ page }) => {
  await kabukSayfasi(page);
  const slayt = page.locator('[data-alan="slayt"]');
  const baslik = slayt.locator('.slayt-duyuru .baslik').first();
  await kabukIt(page, 5, [KABUK_DUYURU()]);
  await page.clock.runFor(2_000);
  await expect(baslik).toHaveText('Kabuk duyurusu');
  await kabukIt(page, 4, [KABUK_DUYURU({ id: 'eski', tr: { baslik: 'Eski liste', metin: 'x.' }, fr: undefined })]);
  await kabukIt(page, 5, [KABUK_DUYURU({ id: 'ayni', tr: { baslik: 'Eşit rev', metin: 'x.' }, fr: undefined })]);
  await page.clock.runFor(2_000);
  await expect(baslik).toHaveText('Kabuk duyurusu');
  await kabukIt(page, 6, [KABUK_DUYURU({ id: 'yeni', tr: { baslik: 'Yeni liste', metin: 'y.' }, fr: undefined })]);
  await page.clock.runFor(2_000);
  await expect(baslik).toHaveText('Yeni liste');
  await kabukIt(page, 7, []);
  await page.clock.runFor(2_000);
  await expect(slayt.locator('.slayt-duyuru')).toHaveCount(0);
});

test('bozuk ya da düşmanca yük ekranı bozmaz; metin HTML olarak yorumlanmaz', async ({ page }) => {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await kabukSayfasi(page);
  const slayt = page.locator('[data-alan="slayt"]');
  for (const bozuk of ['{bozuk', 'null', '[]', '{"rev":"1","duyurular":[]}', '{"rev":-1,"duyurular":[]}', '{"rev":1.5,"duyurular":[]}', '{"rev":1,"duyurular":{}}']) {
    await page.evaluate((y) => window.UluKabukAl(y), bozuk);
  }
  await page.evaluate(() => { window.UluKabukAl(undefined); window.UluKabukAl({ rev: 1, duyurular: 5 }); });
  await page.clock.runFor(2_000);
  await expect(slayt.locator('.slayt-duyuru')).toHaveCount(0);
  const kotu = '<img src=x onerror="window.__sizdi=1"> "q" \\ \u2028 😀';
  await kabukIt(page, 2, [KABUK_DUYURU({ tr: { baslik: kotu, metin: kotu }, fr: undefined })]);
  await page.clock.runFor(2_000);
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toContainText('<img src=x onerror');
  expect(await page.evaluate(() => window.__sizdi)).toBeUndefined();
  await expect(slayt.locator('img[src="x"]')).toHaveCount(0);
  expect(hatalar).toEqual([]);
});

test('kabuk duyuruları akış duyurularından önce gelir; başka ekrana hedeflenmiş olan bu ekranda görünmez', async ({ page }) => {
  await kabukSayfasi(page, [DUYURU({ id: 'akis-1', tr: { baslik: 'Akış duyurusu', metin: 'a.' }, fr: undefined })]);
  const slayt = page.locator('[data-alan="slayt"]');
  const baslik = slayt.locator('.slayt-duyuru .baslik').first();
  await expect(baslik).toHaveText('Akış duyurusu');
  await kabukIt(page, 1, [KABUK_DUYURU({ id: 'giris-1', hedef: ['giris'], tr: { baslik: 'Giriş ekranı', metin: 'g.' }, fr: undefined }), KABUK_DUYURU()]);
  await page.clock.runFor(2_000);
  await expect(baslik).toHaveText('Kabuk duyurusu');
  await page.clock.runFor(10_000);
  await expect(baslik).toHaveText('Akış duyurusu');
  await expect(slayt.getByText('Giriş ekranı')).toHaveCount(0);
});

test('içeriği değişmeyen yeni rev ekrandaki slaytı kesmez', async ({ page }) => {
  await kabukSayfasi(page);
  const slayt = page.locator('[data-alan="slayt"]');
  await kabukIt(page, 1, [KABUK_DUYURU()]);
  await page.clock.runFor(2_000);
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toHaveText('Kabuk duyurusu');
  await kabukIt(page, 2, [KABUK_DUYURU()]);   // aynı içerik, yeni rev
  await page.clock.runFor(3_000);             // sönümleme (1,5 sn) doldu; duyuru slaytı hâlâ ekranda (10 sn'nin ~5 sn'si)
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toHaveText('Kabuk duyurusu');
  await page.clock.runFor(7_000);             // slayt normal süresinde biter, sıradaki (manevi) slayt gelir
  await expect(slayt.locator('.slayt-duyuru')).toHaveCount(0);
});
