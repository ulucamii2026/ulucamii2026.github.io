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
  // Open-Meteo'nun anahtarsız API'si burada sabit bir yanıtla taklit edilir (18.6°C → yuvarlanınca 19°C,
  // kod 61 → yağmur simgesi); testler bunu ezmek isterse sonradan eklenen route öncelik kazanır.
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'api.open-meteo.com') return route.fulfill({ json: { current: { temperature_2m: 18.6, weather_code: 61 } } });
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

// Faz 1 çıkış ölçütü (≤ 15 dk): duyuru akışı 3 dakikada bir yoklanır; yeni derlemeli akış gelince ekrandaki slayt
// normal biter, SONRAKİ slayt turu yeni duyurularla yeniden kurar. Eski tur bilerek uzun (20 duyuru × 10 sn =
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
  // İmam yeni bir duyuru yayımladı: yeni derleme.
  govde = { ...AKIS([DUYURU({ id: 'mevlid', tr: { baslik: 'Mevlid programı', metin: 'Perşembe akşamı yatsıdan sonra.' }, fr: { baslik: 'Programme du Mawlid', metin: 'Jeudi soir après la prière de la nuit.' } })]), derleme: 'derleme-2' };
  // Eski 10 dakikalık aralıkta akis.json bu 3 dakikada hiç yeniden istenmez: bekleme zaman aşımıyla düşer.
  const yoklama = page.waitForResponse((y) => y.url().endsWith('/ekran/akis.json'), { timeout: 15_000 });
  await page.clock.runFor(3 * 60_000);
  await yoklama;
  await page.clock.runFor(10_000); // ekrandaki slayt normal biter (SABIT_10SN); sonraki slayt turu yeniden kurar
  await expect(baslik).toHaveText('Mevlid programı');
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
    await context.unroute('**/ekran/vakitler.json');
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
  await expect(page.locator('[data-alan="hava"] span')).toHaveText('19°C');
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
  await expect(page.locator('[data-alan="hava"] span')).toHaveText('19°C');
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
