/**
 * «Derste bu hafta» bandı ve ezber takvimi (25 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı. Burada sabitlenenler:
 *  - giriş sayfasındaki band: bugünün BRÜKSEL gününe göre bu hafta sonunu (Cumartesi sabahı, Pazar, tatil Pazartesisi) ya da sıradakini (hafta içi,
 *    tatil) seçer; gün kartları, gruplar, çalışma sayfası bağlantıları, «Bugün» işareti (`aria-current="date"`); yıl bitince kısa not;
 *    cihaz saat diliminden bağımsızlık (Los Angeles'ta Brüksel'in ertesi günü);
 *  - JavaScript kapalıyken yanlış bir hafta gösterilmez: band gizli, yerine takvime tek bağlantılı sabit paragraf;
 *  - takvim sayfası: sunucuda eksiksiz çizilir (77 gün, 35 hafta sonu, her kimlik adıyla), bugünün haftası vurgulanır, ay bağlantıları, çalışma
 *    sayfası olmayan ezber düz metin; derin bağlantı (`#g-…`) kaydırmayı ezmez; JavaScript olmadan da eksiksiz;
 *  - çalışma sayfasındaki «Derste:» satırı: sıradaki gün ve grup, bitince gizli, takvimde hiç geçmeyen ezberde hiç çizilmez;
 *  - beş dilde sayfa (başlık, kanonik adres, hreflang), iki temada axe, 320 px yatay taşma yok, CSP ihlali yok, dış ağ yok, cihaza yazma yok;
 *  - giriş noktaları (alt bilgi, «Kendi çalışmanız için» satırı; karo sayısı üç kaldı); yazdırmada band gizli, A4, piksel görsel yok.
 * Dış ağ kapalıdır. Saat `page.clock.setFixedTime` ile sabitlenir; tarihler UTC verilir ki sınav makinenin saat diliminden etkilenmesin.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const SITE = 'https://egitim.ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const takvim = JSON.parse(readFileSync(new URL('../../src/data/ezber/ders-takvimi-2026-2027.json', import.meta.url), 'utf8'));
const GUN_SAYISI = takvim.gunler.length;
const HAFTA_SAYISI = 35;
// Varsayılan «şimdi»: 28 Ekim 2026 Çarşamba (sonbahar tatili bitti, sıradaki ders 31 Ekim).
const VARSAYILAN = '2026-10-28T10:00:00Z';
const saat = (page, iso) => page.clock.setFixedTime(new Date(iso));
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
/** Boşlukları (bölünmez ve ince boşluk dâhil) tek düz boşluğa indirir. */
const duzMetin = async (loc) => ((await loc.textContent()) ?? '').replace(/\s+/g, ' ').trim();
const TUMU = { tr: 'Bütün yılın takvimi', fr: 'Calendrier de toute l’année', en: 'The whole year’s calendar', nl: 'Kalender van het hele jaar', de: 'Kalender für das ganze Jahr' };
const BAND = { tr: 'Derste bu hafta', fr: 'En classe cette semaine', en: 'In class this week', nl: 'Deze week in de les', de: 'Diese Woche im Unterricht' };
const BASLIK = { tr: 'Ezber takvimi', fr: 'Calendrier de mémorisation', en: 'Memorisation calendar', nl: 'Memoriseerkalender', de: 'Memorierkalender' };
const BUGUN = { tr: 'Bugün', fr: 'Aujourd’hui', en: 'Today', nl: 'Vandaag', de: 'Heute' };
const AXE = ['wcag2a', 'wcag2aa', 'wcag21aa'];

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
  await saat(page, VARSAYILAN);
});

test.describe('giriş sayfasındaki band: hafta seçimi (Brüksel günü)', () => {
  test('çarşamba (28 Ekim): sıradaki ders 31 Ekim; Cumartesi yeni ezber İhlâs, Pazar pekiştirme; bağlantılar çalışma sayfasına', async ({ page }) => {
    await page.goto('/tr/');
    const band = page.locator('[data-ders-bandi]');
    await expect(band).toBeVisible();
    await expect(band.locator('h2')).toHaveText(BAND.tr);
    expect(await duzMetin(band.locator('[data-ders-alt]'))).toBe('Sıradaki ders: 31 Ekim Cumartesi');
    const kartlar = band.locator('.tk-gun');
    expect(await kartlar.evaluateAll((k) => k.map((x) => x.dataset.tarih))).toEqual(['2026-10-31', '2026-11-01']);
    await expect(band.locator('[aria-current="date"]')).toHaveCount(0);
    await expect(band.locator('.tk-bugun')).toHaveCount(0);
    const cumartesi = kartlar.nth(0);
    await expect(cumartesi.locator('.tk-gun-ad')).toHaveText('31 Ekim Cumartesi');
    await expect(cumartesi.locator('.tk-grup')).toHaveCount(1);
    await expect(cumartesi.locator('[data-grup="yeni"] dt')).toHaveText('Yeni ezber');
    await expect(cumartesi.locator('[data-grup="yeni"] a')).toHaveAttribute('href', '/tr/calis/s-ihlas/');
    await expect(cumartesi.locator('[data-grup="yeni"] a .tk-ad')).toHaveText('İhlâs Sûresi');
    const pazar = kartlar.nth(1);
    await expect(pazar.locator('[data-grup="pekistir"] dt')).toHaveText('Pekiştirme');
    await expect(pazar.locator('[data-grup="pekistir"] a')).toHaveAttribute('href', '/tr/calis/s-ihlas/');
    await expect(band.locator('.ders-tumu')).toHaveAttribute('href', '/tr/takvim/');
    expect(await duzMetin(band.locator('.ders-tumu'))).toBe(TUMU.tr);
    await band.locator('[data-grup="yeni"] a').click();
    await expect(page).toHaveURL(/\/tr\/calis\/s-ihlas\/$/);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('Cumartesi sabahı (24 Ekim): bu haftanın dersleri 24–26 Ekim, üç kart; kartın bugünü yok (hafta içi sonrası) ve her şey yerinde', async ({ page }) => {
    await saat(page, '2026-10-24T06:00:00Z'); // 08.00 Brüksel
    await page.goto('/tr/');
    const band = page.locator('[data-ders-bandi]');
    expect(await duzMetin(band.locator('[data-ders-alt]'))).toMatch(/^Bu haftanın dersleri: 24\s*[–-]\s*26 Ekim$/);
    expect(await band.locator('.tk-gun').evaluateAll((k) => k.map((x) => x.dataset.tarih))).toEqual(['2026-10-24', '2026-10-25', '2026-10-26']);
    await expect(band.locator('[data-tarih="2026-10-24"]')).toHaveAttribute('aria-current', 'date');
    await expect(band.locator('[aria-current="date"]')).toHaveCount(1);
    // 24 Ekim: Tekbir ve Sübhâneke yeni; 25 Ekim: Sübhâneke pekiştirme; 26 Ekim (Pazartesi): tekrar günü, dört madde.
    const t24 = band.locator('[data-tarih="2026-10-24"] [data-grup="yeni"] .tk-ad');
    await expect(t24).toHaveCount(2);
    expect(await band.locator('[data-tarih="2026-10-26"] .tk-kip').textContent()).toMatch(/tekrar/i);
    await expect(band.locator('[data-tarih="2026-10-26"] [data-grup="pekistir"] li')).toHaveCount(4);
  });

  test('Pazar (25 Ekim): aynı hafta sonu; «Bugün» ve aria-current yalnız 25 Ekim kartında', async ({ page }) => {
    await saat(page, '2026-10-25T09:00:00Z');
    await page.goto('/tr/');
    const band = page.locator('[data-ders-bandi]');
    expect(await duzMetin(band.locator('[data-ders-alt]'))).toMatch(/^Bu haftanın dersleri: 24\s*[–-]\s*26 Ekim$/);
    await expect(band.locator('[aria-current="date"]')).toHaveCount(1);
    await expect(band.locator('[data-tarih="2026-10-25"]')).toHaveAttribute('aria-current', 'date');
    await expect(band.locator('[data-tarih="2026-10-25"] .tk-bugun')).toHaveText(BUGUN.tr);
    await expect(band.locator('.tk-bugun')).toHaveCount(1);
  });

  test('tatil Pazartesisi (26 Ekim): ders günü; aynı hafta sonunun üçüncü kartı bugün', async ({ page }) => {
    await saat(page, '2026-10-26T09:00:00Z');
    await page.goto('/tr/');
    const band = page.locator('[data-ders-bandi]');
    expect(await duzMetin(band.locator('[data-ders-alt]'))).toMatch(/^Bu haftanın dersleri:/);
    await expect(band.locator('[aria-current="date"]')).toHaveAttribute('data-tarih', '2026-10-26');
  });

  test('hafta içi (27 Ekim, Salı): sıradaki hafta sonu, bugün işareti yok', async ({ page }) => {
    await saat(page, '2026-10-27T09:00:00Z');
    await page.goto('/tr/');
    expect(await duzMetin(page.locator('[data-ders-alt]'))).toBe('Sıradaki ders: 31 Ekim Cumartesi');
  });

  test('yıl bitince: son günden sonra kısa not, gün listesi gizli; ilk günden önce: 10 Ekim sıradaki', async ({ page }) => {
    await saat(page, '2027-06-07T09:00:00Z');
    await page.goto('/tr/');
    const band = page.locator('[data-ders-bandi]');
    await expect(band).toBeVisible();
    expect(await duzMetin(band.locator('[data-ders-alt]'))).toMatch(/^Bu ders yılının dersleri tamamlandı\./);
    await expect(band.locator('[data-ders-gunler]')).toBeHidden();
    await expect(band.locator('.ders-tumu')).toBeVisible();
    await saat(page, '2026-10-09T09:00:00Z');
    await page.goto('/tr/');
    expect(await duzMetin(page.locator('[data-ders-alt]'))).toBe('Sıradaki ders: 10 Ekim Cumartesi');
  });
});

test.describe('Brüksel günü (cihaz saat dilimi başka)', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });
  test('Los Angeles’ta 25 Ekim 16.30 = Brüksel 26 Ekim 00.30: bugün 26 Ekim; 24 Ekim 15.30 LA = Brüksel 25 Ekim 00.30 CEST: bugün 25 Ekim', async ({ page }) => {
    await saat(page, '2026-10-25T23:30:00Z');
    await page.goto('/tr/');
    await expect(page.locator('[data-ders-bandi] [aria-current="date"]')).toHaveAttribute('data-tarih', '2026-10-26');
    await saat(page, '2026-10-24T22:30:00Z');
    await page.goto('/tr/');
    await expect(page.locator('[data-ders-bandi] [aria-current="date"]')).toHaveAttribute('data-tarih', '2026-10-25');
  });
});

test.describe('JavaScript kapalı', () => {
  test.use({ javaScriptEnabled: false });
  test('band gizli kalır, yerine takvime tek bağlantılı sabit paragraf; yanlış hafta gösterilmez', async ({ page }) => {
    await page.goto('/tr/');
    await expect(page.locator('[data-ders-bandi]')).toBeHidden();
    const yedek = page.locator('.ders-bandi:not([data-ders-bandi])');
    await expect(yedek).toBeVisible();
    await expect(yedek.locator('.ders-alt')).toHaveText('Bu hafta sonu hangi ezberlerin çalışılacağını yıllık takvimde bulabilirsiniz.');
    await expect(yedek.locator('a')).toHaveAttribute('href', '/tr/takvim/');
    await expect(page.locator('.ders-bandi .tk-gun')).toHaveCount(0);
  });

  test('takvim sayfası JavaScript olmadan da eksiksiz: 77 gün, 35 hafta sonu, «Bugün» yok', async ({ page }) => {
    await page.goto('/tr/takvim/');
    await expect(page.locator('[data-tk-gun]')).toHaveCount(GUN_SAYISI);
    await expect(page.locator('[data-tk-hafta]')).toHaveCount(HAFTA_SAYISI);
    await expect(page.locator('.tk-simdi')).toHaveCount(0);
    await expect(page.locator('.tk-bugun')).toHaveCount(0);
    await expect(page.locator('[data-yazdir]')).toBeHidden(); // yazdır düğmesi JavaScript ister
  });
});

test.describe('takvim sayfası', () => {
  for (const dil of DILLER) {
    test(`${dil}: açılır; başlık, kanonik adres, hreflang; ${GUN_SAYISI} gün ve ${HAFTA_SAYISI} hafta sonu sunucuda çizili; her ezber adıyla`, async ({ page }) => {
      await page.goto(`/${dil}/takvim/`);
      await expect(page.locator('h1')).toHaveText(BASLIK[dil]);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/${dil}/takvim/`);
      expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(6);
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
      await expect(page.locator('[data-tk-gun]')).toHaveCount(GUN_SAYISI);
      await expect(page.locator('[data-tk-hafta]')).toHaveCount(HAFTA_SAYISI);
      // Ad boş ya da kimlik olarak kalan satır yok.
      const adlar = await page.locator('.tk-ad').allTextContents();
      expect(adlar.length).toBeGreaterThan(200);
      expect(adlar.every((a) => a.trim() && !/^[a-z]-[a-z0-9-]+$/.test(a.trim()))).toBe(true);
      // Bağlantılar yalnız bu dilin çalışma sayfalarına gider.
      const bag = await page.locator('.tk-madde a').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
      expect(bag.length).toBeGreaterThan(150);
      expect(bag.every((h) => new RegExp(`^/${dil}/calis/[a-z0-9-]+/$`).test(h))).toBe(true);
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('bugünün haftası vurgulanır (28 Ekim → 31 Ekim haftası, «bu hafta» değil); sayfa o haftaya kayar; ay bağlantıları çalışır', async ({ page }) => {
    await page.goto('/tr/takvim/');
    const hafta = page.locator('.tk-simdi');
    await expect(hafta).toHaveCount(1);
    await expect(hafta).toHaveAttribute('data-ilk', '2026-10-31');
    await expect(hafta).not.toHaveAttribute('data-simdi', 'bu-hafta');
    await expect(hafta).toBeInViewport();
    await expect(page.locator('.tk-bugun')).toHaveCount(0);
    const ay = page.locator('.tk-aylar a[href="#ay-2027-03"]');
    await ay.click();
    await expect(page).toHaveURL(/#ay-2027-03$/);
    await expect(page.locator('#ay-2027-03')).toBeInViewport();
    expect(await page.locator('.tk-aylar a').allTextContents()).toEqual(['Ekim 2026', 'Kasım 2026', 'Aralık 2026', 'Ocak 2027', 'Şubat 2027', 'Mart 2027', 'Nisan 2027', 'Mayıs 2027', 'Haziran 2027']);
  });

  test('Pazar (25 Ekim): bu hafta sonu vurgulu ve «bu hafta» işaretli; 25 Ekim günü aria-current ve «Bugün»', async ({ page }) => {
    await saat(page, '2026-10-25T09:00:00Z');
    await page.goto('/tr/takvim/');
    const hafta = page.locator('.tk-simdi');
    await expect(hafta).toHaveAttribute('data-ilk', '2026-10-24');
    await expect(hafta).toHaveAttribute('data-simdi', 'bu-hafta');
    await expect(page.locator('[data-tk-gun][aria-current="date"]')).toHaveCount(1);
    await expect(page.locator('#g-2026-10-25')).toHaveAttribute('aria-current', 'date');
    await expect(page.locator('#g-2026-10-25 .tk-bugun')).toHaveText(BUGUN.tr);
    await expect(page.locator('.tk-bugun')).toHaveCount(1);
  });

  test('derin bağlantı (#g-2027-03-14) kaydırmayı ezmez: o gün görünür kalır, vurgulu hafta yine işaretlenir', async ({ page }) => {
    await page.goto('/tr/takvim/#g-2027-03-14');
    await expect(page.locator('#g-2027-03-14')).toBeInViewport();
    await expect(page.locator('.tk-simdi')).toHaveCount(1);
  });

  test('çalışma sayfası olmayan ezber düz metin (bağlantı değil); aynı gün iki bölüm; plan ve diğer dersler gruplarda', async ({ page }) => {
    await page.goto('/tr/takvim/');
    const duz = page.locator('.tk-madde .tk-duz');
    expect(await duz.count()).toBeGreaterThan(0);
    await expect(page.locator('.tk-madde .tk-duz a')).toHaveCount(0);
    // 15 Mayıs 2027: Âyetü’l-Kürsî iki bölüm pekiştirme, Kunut duaları kalıcı tur.
    const g = page.locator('#g-2027-05-15');
    await expect(g.locator('[data-grup="pekistir"] li')).toHaveCount(2);
    expect(await g.locator('[data-grup="pekistir"] .tk-ek').allTextContents()).toEqual(['1. bölüm', '2. bölüm']);
    await expect(g.locator('[data-grup="kalici"] dt')).toHaveText('Tekrar ve kalıcı tur');
    // 7 Kasım: İtikat dersinin ezberi «Diğer derslerin ezberi» grubunda.
    await expect(page.locator('#g-2026-11-07 [data-grup="diger"] dt')).toHaveText('Diğer derslerin ezberi');
    expect(await page.locator('#g-2026-11-07 [data-grup="diger"] .tk-ad').allTextContents()).toEqual(['Kelime-i Tevhid', 'Kelime-i Şehâdet']);
    // Son gün (Pazar, tekrar): bütün yıl bir ezber köşesiyle biter, gün boş değil kipiyle yazılı.
    await expect(page.locator('#g-2027-06-06 .tk-kip')).not.toHaveText('');
  });

  test('sayfa cihaza yazmaz (localStorage, sessionStorage, çerez, IndexedDB boş) ve ağa dış istek atmaz', async ({ page }) => {
    const istekler = [];
    page.on('request', (r) => istekler.push(r.url()));
    await page.goto('/tr/takvim/');
    await page.goto('/tr/');
    const depo = await page.evaluate(async () => ({
      // Dil tercihi (ulucamiiEgitimDili) bütün sayfaların ortak davranışıdır (scripts/dil.ts); takvim buna ve ezber kaydına hiçbir şey eklemez.
      yerel: Object.keys(localStorage).filter((k) => k !== 'ulucamiiEgitimDili'), oturum: sessionStorage.length, cerez: document.cookie, idb: (await indexedDB.databases?.())?.length ?? 0,
    }));
    expect(depo).toEqual({ yerel: [], oturum: 0, cerez: '', idb: 0 });
    expect(istekler.filter((u) => new URL(u).origin !== KOK)).toEqual([]);
  });
});

test.describe('çalışma sayfasındaki «Derste:» satırı', () => {
  test('İhlâs 28 Ekim’de: «Derste: 31 Ekim Cumartesi (yeni ezber)», takvimdeki o güne bağlanır', async ({ page }) => {
    await page.goto('/tr/calis/s-ihlas/');
    const satir = page.locator('[data-ders-satiri]');
    await expect(satir).toBeVisible();
    expect(await duzMetin(satir)).toMatch(/^Derste: 31 Ekim Cumartesi \(yeni ezber\)$/i);
    await expect(satir.locator('a')).toHaveAttribute('href', '/tr/takvim/#g-2026-10-31');
    await satir.locator('a').click();
    await expect(page).toHaveURL(/\/tr\/takvim\/#g-2026-10-31$/);
    await expect(page.locator('#g-2026-10-31')).toBeInViewport();
  });

  test('bugün de sayılır (31 Ekim); ertesi gün sıradaki başka bir grupta (2 Kasım → 21 Kasım pekiştirme)', async ({ page }) => {
    await saat(page, '2026-10-31T10:00:00Z');
    await page.goto('/tr/calis/s-ihlas/');
    expect(await duzMetin(page.locator('[data-ders-satiri]'))).toMatch(/^Derste: 31 Ekim Cumartesi \(yeni ezber\)$/i);
    await saat(page, '2026-11-02T10:00:00Z');
    await page.goto('/tr/calis/s-ihlas/');
    expect(await duzMetin(page.locator('[data-ders-satiri]'))).toMatch(/^Derste: 21 Kasım Cumartesi \(pekiştirme\)$/i);
  });

  test('takvimde artık geçmeyen ezberde satır gizli kalır; hiç geçmeyen ezberde (Alak) satır hiç çizilmez', async ({ page }) => {
    await saat(page, '2027-02-01T10:00:00Z'); // Tekbir’in son günü 10 Ocak 2027
    await page.goto('/tr/calis/d-tekbir/');
    await expect(page.locator('[data-ders-satiri]')).toHaveCount(1);
    await expect(page.locator('[data-ders-satiri]')).toBeHidden();
    await page.goto('/tr/calis/s-alak/');
    await expect(page.locator('[data-ders-satiri]')).toHaveCount(0);
  });

  for (const dil of DILLER) {
    test(`${dil}: satır sayfa dilinde (önek, tarih, grup) ve bu dilin takvimine bağlanır; axe temiz`, async ({ page }) => {
      await page.goto(`/${dil}/calis/s-ihlas/`);
      const satir = page.locator('[data-ders-satiri]');
      await expect(satir).toBeVisible();
      await expect(satir.locator('a')).toHaveAttribute('href', `/${dil}/takvim/#g-2026-10-31`);
      expect(await duzMetin(satir.locator('.ders-onek'))).toMatch(/^(Derste:|En classe :|In class:|In de les:|Im Unterricht:)$/);
      expect(await satir.locator('a').textContent()).toMatch(/31/);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        const sonuc = await new AxeBuilder({ page }).withTags(AXE).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), colorScheme).toEqual([]);
      }
    });
  }

  test('basılı kartta (yazdırma) satır görünmez', async ({ page }) => {
    await page.goto('/tr/calis/s-ihlas/');
    await expect(page.locator('[data-ders-satiri]')).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-ders-satiri]')).toBeHidden();
  });
});

test.describe('erişilebilirlik ve yeniden akış', () => {
  for (const dil of DILLER) {
    test(`${dil}: giriş (bandla) ve takvim sayfasında iki temada axe, 320 px yatay taşma yok, CSP ihlali yok`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await saat(page, '2026-10-26T09:00:00Z'); // üç kartlı hafta sonu, bir kart «Bugün»
      for (const yol of [`/${dil}/`, `/${dil}/takvim/`]) {
        await page.goto(yol);
        if (yol.endsWith(`/${dil}/`)) await expect(page.locator('[data-ders-bandi]')).toBeVisible();
        for (const colorScheme of ['light', 'dark']) {
          await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
          expect(await tasmaYok(page), `${yol} ${colorScheme}`).toBe(true);
          const sonuc = await new AxeBuilder({ page }).withTags(AXE).analyze();
          expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `${yol} ${colorScheme}`).toEqual([]);
        }
        expect(await page.evaluate(() => window.__csp)).toEqual([]);
      }
    });
  }

  test('band ve takvim: bağlantılar ve düğmeler dokunulabilir boyda (≥ 44 px yükseklik); klavye ile gezilir', async ({ page }) => {
    await page.goto('/tr/');
    for (const bag of await page.locator('[data-ders-bandi] .tk-madde a').all()) expect((await bag.boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect((await page.locator('.ders-tumu').boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.locator('.ders-tumu').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tr\/takvim\/$/);
    await expect(page.locator('[data-yazdir]')).toBeVisible();
    expect((await page.locator('[data-yazdir]').boundingBox()).height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('giriş noktaları ve yazdırma', () => {
  for (const dil of DILLER) {
    test(`${dil}: giriş sayfasında band hero’dan sonra, şeritlerden önce; üç araç karosu aynı, takvim satırı ve alt bilgi bağlantısı var`, async ({ page }) => {
      await page.goto(`/${dil}/`);
      const y = (s) => page.locator(s).first().evaluate((e) => e.getBoundingClientRect().top + scrollY);
      await expect(page.locator('[data-ders-bandi]')).toBeVisible();
      expect(await y('[data-ders-bandi]')).toBeGreaterThan(await y('.giris'));
      expect(await y('[data-ders-bandi]')).toBeLessThan(await y('#seritler'));
      const karolar = page.locator('[data-araclar] a.arac');
      await expect(karolar).toHaveCount(3);
      expect(await karolar.evaluateAll((a) => a.map((x) => x.getAttribute('href')))).toEqual([`/${dil}/kilimim/`, `/${dil}/calisma-belgesi/`, `/${dil}/kartlar/`]);
      await expect(page.locator(`[data-araclar] .arac-takvim a[href="/${dil}/takvim/"]`)).toHaveCount(1);
      await expect(page.locator(`footer a[href="/${dil}/takvim/"]`)).toHaveCount(1);
      expect(await duzMetin(page.locator('[data-ders-bandi] .ders-tumu'))).toBe(TUMU[dil]);
      await expect(page.locator('[data-ders-bandi] h2')).toHaveText(BAND[dil]);
    });
  }

  test('yazdırma (takvim): band yok, gezinti ve düğme gizli; PDF A4, piksel görsel yok, yazı tipi gömülü, makul sayfa sayısı', async ({ page }, ti) => {
    test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
    await page.goto('/tr/takvim/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.tk-aylar')).toBeHidden();
    await expect(page.locator('.tk-arac')).toBeHidden();
    await expect(page.locator('.tk-bugun')).toHaveCount(0);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const metin = pdf.toString('latin1');
    const kutu = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(metin);
    expect(Math.abs(Number(kutu[1]) - 595.28) < 1 && Math.abs(Number(kutu[2]) - 841.89) < 1).toBe(true);
    const sayfa = (metin.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
    expect(sayfa).toBeGreaterThanOrEqual(5);
    expect(sayfa).toBeLessThanOrEqual(16);
    expect((metin.match(/\/Subtype\s*\/Image/g) ?? []).length).toBe(0);
    expect(/\/FontFile[23]?\b|\/Subtype\s*\/Type3|\/CIDFontType2/.test(metin)).toBe(true);
  });

  test('yazdırmada girişteki band görünmez', async ({ page }) => {
    await page.goto('/tr/');
    await expect(page.locator('[data-ders-bandi]')).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-ders-bandi]')).toBeHidden();
  });
});
