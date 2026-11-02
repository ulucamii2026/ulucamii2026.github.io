/**
 * İlim Yolu hesap sayfaları (2 Kasım 2026): giriş, kayıt, hesabım ve kare kodlu kart girişi (`/k/`). Dış ağ kesik; Firebase sunucusuna HİÇBİR istek gitmez
 * (kesilen istekler yalnız başarısız olur). Neden bu testler: hesap sayfaları beş dilde açılmalı, noindex olmalı, CSP ihlali ve yatay taşma olmamalı;
 * kart sırrı hiçbir ağ isteğinden önce adresten silinmeli; oturumsuz ana sayfa Firebase'i HİÇ yüklememeli; giriş formu klavyeyle sırayla gezilmeli.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const SAYFALAR = ['hesap/giris', 'hesap/kayit', 'hesap'];
// 12 + 22 karakterlik geçerli biçimli (ama sahte) kart: kartId.sır
const KART = 'AbCdEfGhIjKl.AbCdEfGhIjKlMnOpQrStUv';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
/** Hesabım sayfasının oturum açılınca görünen bölümlerini erişilebilirlik sınaması için açar (Firebase'siz). */
const bolumleriAc = (page) => page.evaluate(() => {
  document.querySelector('[data-yukleniyor]')?.setAttribute('hidden', '');
  for (const e of document.querySelectorAll('[data-hesap], [data-bolum], [data-riza], [data-gunler], [data-yer-sehir-alan], [data-ad-kutu], [data-eposta-satiri]')) e.removeAttribute('hidden');
});

for (const dil of DILLER) {
  for (const sayfa of SAYFALAR) {
    test(`${dil}/${sayfa}: noindex, kanonik adres yok, CSP ihlalsiz, taşmasız, iki temada erişilebilir`, async ({ page }) => {
      await page.goto(`/${dil}/${sayfa}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.locator('link[rel="canonical"], link[rel="alternate"][hreflang]')).toHaveCount(0);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (sayfa === 'hesap') {
        // Oturum yok: yükleniyor biter, «giriş yap» bağlantısı görünür; ardından oturumlu bölümler açılıp aynı denetim yapılır.
        await expect(page.locator('[data-oturumsuz]')).toBeVisible();
        await expect(page.locator('[data-oturumsuz] a')).toHaveAttribute('href', `/${dil}/hesap/giris/`);
        await bolumleriAc(page);
      }
      for (const tema of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 5).map((n) => n.target) }))).toEqual([]);
        expect(await tasmaYok(page)).toBe(true);
      }
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test(`${dil}: /k/ kart girişi beş dilden birinde açılır, noindex, CSP ihlalsiz`, async ({ browser }) => {
    const baglam = await browser.newContext({ baseURL: KOK, locale: { tr: 'tr-TR', fr: 'fr-BE', en: 'en-GB', nl: 'nl-BE', de: 'de-DE' }[dil], reducedMotion: 'reduce' });
    await baglam.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    await baglam.addInitScript(() => {
      window.__csp = [];
      addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
    });
    const page = await baglam.newPage();
    await page.goto('/k/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
    await expect(page.locator('[data-hata]')).not.toBeEmpty(); // kart yok → açıklama
    await expect(page.locator('[data-baglantilar] a[data-ana]')).toHaveAttribute('href', `/${dil}/`);
    expect(await tasmaYok(page)).toBe(true);
    const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(sonuc.violations.map((v) => v.id)).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    await baglam.close();
  });
}

test('/k/: kart sırrı HİÇBİR ağ isteğinden önce adresten silinir; sunucuya yalnız gövdede gider', async ({ page }) => {
  await page.addInitScript(() => {
    window.__ag = [];
    const kaydet = (tur, adres) => window.__ag.push({ tur, adres: String(adres), hash: location.hash, href: location.href });
    const f = window.fetch;
    window.fetch = function (girdi, ...r) { kaydet('fetch', girdi?.url ?? girdi); return f.call(this, girdi, ...r); };
    const a = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u, ...r) { kaydet('xhr', u); return a.call(this, m, u, ...r); };
    const gecmis = history.replaceState;
    window.__temizlik = [];
    history.replaceState = function (...r) { window.__temizlik.push({ once: location.hash }); return gecmis.apply(this, r); };
  });
  const istekler = [];
  await page.route('**/api/kart-giris', async (r) => {
    istekler.push({ adres: r.request().url(), govde: r.request().postData() });
    await r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.goto(`/k/#${KART}`);
  await expect(page.locator('[data-hata]')).not.toBeEmpty();
  // Sır adres çubuğunda ve geçmişte yok.
  expect(new URL(page.url()).hash).toBe('');
  expect(page.url()).not.toContain(KART.split('.')[1]);
  expect(await page.evaluate(() => location.hash)).toBe('');
  // replaceState sırrı gördü (ilk iş) ve sonrasındaki HER ağ çağrısında adres temiz.
  const temizlik = await page.evaluate(() => window.__temizlik);
  expect(temizlik[0].once).toBe(`#${KART}`);
  const ag = await page.evaluate(() => window.__ag);
  for (const c of ag) {
    expect(c.hash, `${c.tur} ${c.adres}`).toBe('');
    expect(c.adres).not.toContain(KART.split('.')[1]);
  }
  // Sunucuya: adres düz, gövde kartId + sır.
  expect(istekler).toHaveLength(1);
  expect(new URL(istekler[0].adres).search).toBe('');
  expect(JSON.parse(istekler[0].govde)).toEqual({ kartId: KART.split('.')[0], sir: KART.split('.')[1] });
  // Geçmiş girdisi sırrı tutmaz: geri/ileri gidilse de adres temiz kalır.
  expect(await page.evaluate(() => history.state)).toBeNull();
});

test('/k/: parça yoksa ya da biçimi bozuksa ağ isteği yapılmaz, parça yine silinir', async ({ page }) => {
  const api = [];
  await page.route('**/api/**', (r) => { api.push(r.request().url()); return r.abort(); });
  await page.goto('/k/');
  await expect(page.locator('[data-hata]')).not.toBeEmpty();
  await page.goto('about:blank'); // aynı belgede parça değişimi sayfayı yeniden yüklemez
  await page.goto('/k/#bozuk-parca');
  await expect(page.locator('[data-hata]')).not.toBeEmpty();
  expect(await page.evaluate(() => location.hash)).toBe('');
  expect(api).toEqual([]);
});

test('Oturumsuz ana sayfa beş dilde Firebase yüklemez: betik gövdelerinde SDK yok, ağ isteği yok', async ({ page }) => {
  for (const dil of DILLER) {
    const istekler = [];
    const govdeler = [];
    page.on('request', (r) => istekler.push(r.url()));
    page.on('response', async (y) => {
      if (/\.js(\?|$)/.test(y.url())) govdeler.push(await y.text().catch(() => ''));
    });
    await page.goto(`/${dil}/`);
    await page.waitForLoadState('networkidle');
    // Ziyaretçi görünümü açık, girişli görünüm gizli.
    await expect(page.locator('[data-misafir]').first()).toBeVisible();
    await expect(page.locator('[data-girisli]').first()).toBeHidden();
    // Dış köken yok (Google, Firebase, Cloud Functions); inen betiklerin hiçbirinde SDK (identitytoolkit) yok. Küçük istemci modülü paketlenmiş olabilir.
    expect(istekler.filter((u) => new URL(u).origin !== KOK), dil).toEqual([]);
    for (const g of govdeler) expect(g, dil).not.toMatch(/identitytoolkit|securetoken\.googleapis/);
    page.removeAllListeners('request');
    page.removeAllListeners('response');
  }
});

test('Ana sayfa: oturum işareti varsa girişli görünüm açılır, yoksa ya da bozuksa ziyaretçi görünümü (Firebase işareti silmeden önce)', async ({ page }) => {
  // Oturum işareti okuyucusu boyamadan önce çalışır; sonra Firebase saklı oturumu bulamazsa işareti siler. İlk durum DOMContentLoaded'da yakalanır.
  await page.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      const kisi = document.querySelector('a.kisi[data-girisli]');
      window.__ilk = { isaret: document.documentElement.hasAttribute('data-oturum'), kisi: kisi ? getComputedStyle(kisi).display !== 'none' : null };
    });
  });
  await page.goto('/tr/');
  expect(await page.evaluate(() => window.__ilk)).toEqual({ isaret: false, kisi: false });
  await page.evaluate(() => localStorage.setItem('ilimYolu:oturum', 'a'.repeat(32)));
  await page.reload();
  expect(await page.evaluate(() => window.__ilk)).toEqual({ isaret: true, kisi: true });
  await page.evaluate(() => localStorage.setItem('ilimYolu:oturum', 'xyz'));
  await page.reload();
  expect(await page.evaluate(() => window.__ilk)).toEqual({ isaret: false, kisi: false });
});

test('320 px: hesap sayfaları ve ana sayfa yatay kaydırmasız (beş dil)', async ({ page }, info) => {
  test.skip(info.project.name !== 'masaustu-chromium', 'görünüm penceresi bu testte elle ayarlanır');
  await page.setViewportSize({ width: 320, height: 700 });
  for (const dil of DILLER) {
    for (const yol of ['', 'ezber/', 'hesap/giris/', 'hesap/kayit/', 'hesap/']) {
      await page.goto(`/${dil}/${yol}`);
      await page.evaluate(() => document.fonts.ready);
      if (yol === 'hesap/') await bolumleriAc(page);
      expect(await tasmaYok(page), `${dil}/${yol}`).toBe(true);
    }
  }
  await page.goto('/k/');
  expect(await tasmaYok(page)).toBe(true);
});

test('Giriş formu: klavyeyle sıralı gezilir, sekmeler ok tuşlarıyla değişir, boş gönderimde hata söylenir', async ({ page }) => {
  await page.goto('/tr/hesap/giris/');
  // Seçili sekme tek sekme durağıdır; ardından alanlar yazılma sırasıyla.
  await page.locator('#t-eposta').focus();
  await expect(page.locator('#t-google')).toHaveAttribute('tabindex', '-1');
  const sira = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    sira.push(await page.evaluate(() => {
      const e = document.activeElement;
      return e.id || (e.hasAttribute('data-sifre-goster') ? 'sifre-goster' : e.hasAttribute('data-sifirla') ? 'sifirla' : e.type === 'submit' ? 'gonder' : `${e.tagName}:${e.getAttribute('href')}`);
    }));
  }
  expect(sira.slice(0, 5)).toEqual(['g-eposta', 'g-sifre', 'sifre-goster', 'gonder', 'sifirla']);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.getAttribute('href'))).toBe('/tr/hesap/kayit/');
  // Ok tuşları sekmeyi değiştirir, panel gizlenir/görünür.
  await page.locator('#t-eposta').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#t-google')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#p-google')).toBeVisible();
  await expect(page.locator('#p-eposta')).toBeHidden();
  await page.keyboard.press('End');
  await expect(page.locator('#t-kurs')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.locator('#t-eposta')).toHaveAttribute('aria-selected', 'true');
  // Boş gönderim: ağ yok, alan odaklı, hata duyurulur (role=alert).
  await page.locator('[data-form="eposta"] button[type="submit"]').click();
  await expect(page.locator('[data-hata]')).toHaveText(/e-posta adresinizi yazın/i);
  await expect(page.locator('#g-eposta')).toBeFocused();
  // Şifre göster/gizle.
  await page.fill('#g-sifre', 'ornek-sifre');
  await page.locator('#p-eposta [data-sifre-goster]').click();
  await expect(page.locator('#g-sifre')).toHaveAttribute('type', 'text');
  await expect(page.locator('#p-eposta [data-sifre-goster]')).toHaveAttribute('aria-pressed', 'true');
});

test('Giriş: ?yontem=kurs ile «Kurs öğrencisi» sekmesi açılır; kullanıcı adı alanı büyük harfe zorlanmaz', async ({ page }) => {
  await page.goto('/tr/hesap/giris/?yontem=kurs');
  await expect(page.locator('#t-kurs')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#g-kad')).toBeVisible();
  await expect(page.locator('#g-kad')).toHaveAttribute('autocapitalize', 'none');
  await page.locator('[data-form="kurs"] button[type="submit"]').click();
  await expect(page.locator('[data-hata]')).not.toBeEmpty();
});

test('Kayıt: kullanıcı adı kuralları canlı gösterilir, Türkçe harf için öneri sunulur ve uygulanır', async ({ page }) => {
  await page.goto('/tr/hesap/kayit/');
  await page.waitForLoadState('networkidle'); // adım betiği Firebase yüklenince bağlanır
  await page.evaluate(() => document.querySelector('[data-adim="2"]').removeAttribute('hidden'));
  const girdi = page.locator('#k-ad-girdi');
  const durum = page.locator('#k-ad-durum');
  await expect(durum).toBeHidden();
  await girdi.fill('ab');
  await expect(durum).toHaveText('Ad en az 3 karakter olmalı.');
  await expect(girdi).toHaveAttribute('aria-invalid', 'true');
  await girdi.fill('Şükrü');
  await expect(durum).toContainText('harf ya da rakamla başlamalı');
  const oneri = page.locator('[data-ad-oneri]').first();
  await expect(oneri).toBeVisible();
  await expect(oneri).toHaveText('Şunu deneyebilirsiniz: @sukru');
  await oneri.click();
  await expect(girdi).toHaveValue('sukru');
  await expect(durum).toHaveText('@sukru biçimi uygun');
  await expect(girdi).toHaveAttribute('aria-invalid', 'false');
  await girdi.fill('Ahmet Yılmaz');
  await expect(durum).toContainText('Yalnız a–z');
});
