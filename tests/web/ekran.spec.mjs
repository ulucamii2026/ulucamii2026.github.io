import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brukselTarih } from '../../src/lib/namaz.ts';

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
const ayAdi = (t, yerel) => new Intl.DateTimeFormat(yerel, { timeZone: 'Europe/Brussels', month: 'long' }).format(t);

test.beforeEach(async ({ context }) => {
  test.skip(test.info().project.name !== 'masaustu-chromium', 'ekran testleri tek tarayıcı projesinde koşar');
  // Ağ yalıtımı (depodaki öteki web testleriyle aynı): 4401 dışındaki HTTP ve WebSocket kesilir.
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    return u.origin === 'http://127.0.0.1:4401' || u.origin === 'http://localhost:4401' ? route.continue() : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
  await context.route('**/ekran/vakitler.json', (route) => route.fulfill({ json: vakitAkisi() }));
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

test('sıradaki vakit vurgulanır, geri sayım iki dilde yazılır', async ({ page }) => {
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'ogle');
  await expect(page.locator('.vakit[data-vakit="ogle"] .deger')).toHaveText(ornek.ogle);
  await expect(page.locator('.geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
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
const AKIS = (duyurular) => ({ derleme: '', ayar: { slayt: SABIT_10SN, gece: { kapanmaDk: 60, acilmaDk: 30 }, duyuruVarsayilanGun: 30 }, duyurular });
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
