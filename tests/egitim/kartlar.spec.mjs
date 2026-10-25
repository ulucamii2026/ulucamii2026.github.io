/**
 * Ezber kartları · 8'li baskı (25 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı. Seçilen ezberler A4 kâğıda 2 × 4 kart olarak
 * dizilir; ön yüzde ad ve Arapça başlık, arka yüzde sayfaya götüren vektör kare kod. Hesap, sunucu ve ağ yoktur. Burada sabitlenenler:
 *  - beş dilde sayfa açılır (başlık, kanonik adres, hreflang); liste her şerit için gruplanır; cihazda kayıt yokken hiçbir şey seçili
 *    gelmez, kayıt varken çalışılanlar (ve `?sec=` ile istenen) seçili gelir; Tümü, Hiçbiri ve şerit kutusu (belirsiz durum) çalışır;
 *  - sayfalama: 10 ezber → 2 kâğıt, önizlemede ön 1, arka 1, ön 2, arka 2; arka yüz her satırı ters çevrilmiş (uzun kenar);
 *  - yüz seçimi (ikisi · yalnız ön · yalnız arka) önizlemeyi ve yazdırmayı değiştirir;
 *  - arka yüzdeki kare kodun verisi `https://egitim.ulucamii.be/<dil>/calis/<id>/` adresinin QR matrisidir (qrcode paketiyle yeniden kurulup
 *    yolu karşılaştırılır); kart metni taşmaz (76 madde × 5 dil, iki yüz);
 *  - sayfa cihaz hafızasına yazmaz, ağa dış istek atmaz, CSP ihlali yok;
 *  - yazdırmada yalnız sayfalar görünür; Chromium PDF'i A4, 10 ezber = 4 sayfa, piksel görsel YOK, yazı tipi gömülü;
 *  - iki temada axe, 320 px yatay taşma yok; alt bilgi, giriş, madde sayfası, Çalışma Belgesi ve Kilimim'den bağlantılar.
 * PDF üretimi yalnız masaüstü projesinde sınanır. Dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KOK = 'http://127.0.0.1:4402';
const SITE = 'https://egitim.ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ANAHTAR = 'ulucamii:ezber:cihaz:v1';
const BUGUN = new Date(2026, 9, 25, 11, 0, 0);
const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const SAYFALI = katalog.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.metinli || o.bilgiMetni);
const ID10 = SAYFALI.slice(0, 10).map((o) => o.id);
const ID5 = ['s-ihlas', 's-fatiha', 's-nas', 's-felak', 'd-amentu'];
const an = (g, s = 10) => new Date(2026, 9, g, s, 0, 0).getTime();
const durumKur = (idler) => ({
  v: 1, ar: 1, gunler: ['2026-10-12', '2026-10-24', '2026-10-25'],
  maddeler: Object.fromEntries(idler.map((id, i) => [id, { kip: 'sina', kutu: i === 0 ? 2 : -1, sonraki: i === 0 ? '2026-11-05' : '', son: an(25 - (i % 5)) }])),
});
const tohumla = (page, durum) => page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durum]);
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const BASLIK = { tr: 'Ezber kartları', fr: 'Fiches de mémorisation', en: 'Memorisation cards', nl: 'Memoriseerkaarten', de: 'Lernkarten zum Auswendiglernen' };
const OKUT = { tr: 'Dinlemek için okutun', fr: 'Scannez pour écouter', en: 'Scan to listen', nl: 'Scan om te luisteren', de: 'Zum Anhören scannen' };

/** qrcode paketinin matrisinden, src/lib/ezber/kare-kod.ts ile aynı koşu biçiminde yol (sayfadaki vektör kodla karşılaştırmak için). */
function beklenenYol(adres) {
  const m = QRCode.create(adres, { errorCorrectionLevel: 'M' }).modules;
  const parca = [];
  for (let y = 0; y < m.size; y++) {
    let x = 0;
    while (x < m.size) {
      if (!m.get(y, x)) { x++; continue; }
      const bas = x;
      while (x < m.size && m.get(y, x)) x++;
      parca.push(`M${bas + 4} ${y + 4}h${x - bas}v1h-${x - bas}z`);
    }
  }
  return parca.join('');
}

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
  await page.clock.setFixedTime(BUGUN);
});

test.describe('sayfa ve seçim', () => {
  for (const dil of DILLER) {
    test(`${dil}: açılır, başlık, kanonik adres, hreflang; kayıt yokken hiçbir şey seçili değil, yazdır kapalı`, async ({ page }) => {
      await page.goto(`/${dil}/kartlar/`);
      await expect(page.locator('h1')).toHaveText(BASLIK[dil]);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/${dil}/kartlar/`);
      expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(6);
      await expect(page.locator('[data-kartlar]')).toBeVisible();
      await expect(page.locator('input[data-kk-kutu]')).toHaveCount(SAYFALI.length);
      await expect(page.locator('input[data-kk-kutu]:checked')).toHaveCount(0);
      await expect(page.locator('[data-kk-yazdir]')).toBeDisabled();
      await expect(page.locator('[data-kk-yonerge]')).not.toContainText('işaretli geldi');
      await expect(page.locator('[data-kk-seciliyok]')).toBeVisible();
      await expect(page.locator('[data-kk-sayfalar] .kk-sayfa-kutu')).toHaveCount(0);
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('liste şerit şerit gruplanır (katalog sırası) ve her şeridin «tümünü seç» kutusu vardır', async ({ page }) => {
    await page.goto('/tr/kartlar/');
    const gruplar = page.locator('[data-kk-grup]');
    expect(await gruplar.evaluateAll((g) => g.map((x) => x.dataset.kkGrup))).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', 'kenar']);
    for (const seviye of ['1', '8', 'kenar']) {
      const beklenen = SAYFALI.filter((o) => String(o.seviye) === seviye).sort((a, b) => a.sira - b.sira).map((o) => o.id);
      expect(await page.locator(`[data-kk-grup="${seviye}"] input[data-kk-kutu]`).evaluateAll((k) => k.map((x) => x.value))).toEqual(beklenen);
    }
    await expect(page.locator('[data-kk-grup="1"] .kk-grup-sec')).toHaveText('1. şerit: tümünü seç');
  });

  test('Tümü, Hiçbiri ve şerit kutusu (işaretli, belirsiz, boş) çalışır; sayaç ve özet güncellenir', async ({ page }) => {
    await page.goto('/tr/kartlar/');
    const sayac = page.locator('[data-kk-sayac]');
    await expect(sayac).toHaveText(`Seçili: 0 / ${SAYFALI.length}`);
    const grup1 = page.locator('[data-kk-grup="1"] [data-kk-grup-kutu]');
    const n1 = SAYFALI.filter((o) => o.seviye === 1).length;
    await grup1.check();
    await expect(page.locator('[data-kk-grup="1"] input[data-kk-kutu]:checked')).toHaveCount(n1);
    await expect(sayac).toHaveText(`Seçili: ${n1} / ${SAYFALI.length}`);
    await page.locator('[data-kk-grup="1"] input[data-kk-kutu]').first().uncheck();
    expect(await grup1.evaluate((e) => e.indeterminate)).toBe(true);
    expect(await grup1.evaluate((e) => e.checked)).toBe(false);
    await page.locator('[data-kk-tumu]').click();
    await expect(page.locator('input[data-kk-kutu]:checked')).toHaveCount(SAYFALI.length);
    await expect(sayac).toHaveText(`Seçili: ${SAYFALI.length} / ${SAYFALI.length}`);
    expect(await grup1.evaluate((e) => e.checked && !e.indeterminate)).toBe(true);
    await expect(page.locator('[data-kk-ozet]')).toHaveText(`Kart: ${SAYFALI.length} · sayfa: ${Math.ceil(SAYFALI.length / 8) * 2} (${Math.ceil(SAYFALI.length / 8)} yaprak)`);
    await page.locator('[data-kk-hicbiri]').click();
    await expect(page.locator('input[data-kk-kutu]:checked')).toHaveCount(0);
    await expect(page.locator('[data-kk-yazdir]')).toBeDisabled();
  });

  test('cihazdaki çalışma kaydı olan ezberler seçili gelir (katalog sırasıyla); yönerge kayda göre değişir', async ({ page }) => {
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/kartlar/');
    const beklenen = SAYFALI.filter((o) => ID5.includes(o.id)).map((o) => o.id);
    expect(await page.locator('input[data-kk-kutu]:checked').evaluateAll((k) => k.map((x) => x.value))).toEqual(beklenen);
    await expect(page.locator('[data-kk-yonerge]')).toContainText('işaretli geldi');
    await expect(page.locator('[data-kk-yazdir]')).toBeEnabled();
  });

  test('?sec= bağlantıyla istenen ezber de seçili gelir; geçersiz kimlikler yok sayılır', async ({ page }) => {
    await page.goto('/tr/kartlar/?sec=s-kevser,x-yok,%3Cscript%3E');
    expect(await page.locator('input[data-kk-kutu]:checked').evaluateAll((k) => k.map((x) => x.value))).toEqual(['s-kevser']);
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/kartlar/?sec=s-kevser');
    await expect(page.locator('input[data-kk-kutu]:checked')).toHaveCount(ID5.length + 1);
  });

  test('betik kapalıyken açıklama kalır, seçim bölümü görünmez, JavaScript uyarısı çıkar', async ({ browser }) => {
    const baglam = await browser.newContext({ javaScriptEnabled: false, baseURL: KOK });
    const sayfa = await baglam.newPage();
    await sayfa.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    await sayfa.goto('/tr/kartlar/');
    await expect(sayfa.locator('h1')).toHaveText('Ezber kartları');
    await expect(sayfa.locator('[data-kartlar]')).toBeHidden();
    await expect(sayfa.locator('.kk-js')).toBeVisible();
    await baglam.close();
  });

  test('depolama kapalıyken ve bozuk kayıtta sayfa bozulmaz; hiçbir şey seçili gelmez', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('kapalı', 'SecurityError'); } }); });
    await page.goto('/tr/kartlar/');
    await expect(page.locator('[data-kartlar]')).toBeVisible();
    await expect(page.locator('input[data-kk-kutu]:checked')).toHaveCount(0);
  });
});

test.describe('sayfalama ve aynalama', () => {
  test('10 ezber → ön 1, arka 1, ön 2, arka 2; ilk kâğıt 8 dolu, ikincide 2 dolu ve 6 boş; arka yüz satır satır ters', async ({ page }) => {
    await tohumla(page, durumKur(ID10));
    await page.goto('/tr/kartlar/');
    const kutular = page.locator('[data-kk-sayfalar] .kk-sayfa-kutu');
    await expect(kutular).toHaveCount(4);
    expect(await kutular.evaluateAll((k) => k.map((x) => x.dataset.yuz))).toEqual(['on', 'arka', 'on', 'arka']);
    await expect(page.locator('[data-kk-ozet]')).toHaveText('Kart: 10 · sayfa: 4 (2 yaprak)');
    const idler = (n) => kutular.nth(n).locator('.kk-hucre').evaluateAll((h) => h.map((x) => x.querySelector('.kk-kart')?.dataset.id ?? null));
    const on1 = await idler(0), arka1 = await idler(1), on2 = await idler(2), arka2 = await idler(3);
    expect(on1).toEqual(ID10.slice(0, 8));
    expect(on2).toEqual([...ID10.slice(8), null, null, null, null, null, null]);
    for (const [on, arka] of [[on1, arka1], [on2, arka2]]) {
      for (let r = 0; r < 4; r++) {
        expect(arka[r * 2]).toBe(on[r * 2 + 1]);
        expect(arka[r * 2 + 1]).toBe(on[r * 2]);
      }
    }
    // Yüzler doğru: ön yüzde madde adı ve kod, arka yüzde kare kod.
    expect(await kutular.nth(0).locator('.kk-kart').evaluateAll((k) => k.every((x) => x.dataset.yuz === 'on'))).toBe(true);
    expect(await kutular.nth(1).locator('.kk-kart').evaluateAll((k) => k.every((x) => x.dataset.yuz === 'arka'))).toBe(true);
    await expect(kutular.nth(1).locator('.kk-sayfa-etiket')).toContainText('arka yüz');
  });

  test('yüz seçimi: yalnız ön → 2, yalnız arka → 2, ikisi → 4 sayfa; özet ve önizleme birlikte değişir', async ({ page }) => {
    await tohumla(page, durumKur(ID10));
    await page.goto('/tr/kartlar/');
    await page.locator('input[data-kk-yuz][value="on"]').check();
    expect(await page.locator('[data-kk-sayfalar] .kk-sayfa-kutu').evaluateAll((k) => k.map((x) => x.dataset.yuz))).toEqual(['on', 'on']);
    await expect(page.locator('[data-kk-ozet]')).toHaveText('Kart: 10 · sayfa: 2 (2 yaprak)');
    await page.locator('input[data-kk-yuz][value="arka"]').check();
    expect(await page.locator('[data-kk-sayfalar] .kk-sayfa-kutu').evaluateAll((k) => k.map((x) => x.dataset.yuz))).toEqual(['arka', 'arka']);
    await page.locator('input[data-kk-yuz][value="cift"]').check();
    await expect(page.locator('[data-kk-sayfalar] .kk-sayfa-kutu')).toHaveCount(4);
  });

  for (const dil of DILLER) {
    test(`${dil}: kartlar kâğıda sığar (76 madde × iki yüz), ad ve Arapça başlık ön yüzde, kısa yönerge ve adres arka yüzde`, async ({ page }) => {
      await page.goto(`/${dil}/kartlar/`);
      await page.locator('[data-kk-tumu]').click();
      await page.evaluate(() => document.fonts.ready);
      const sonuc = await page.evaluate(() => {
        const kotu = [];
        let n = 0;
        for (const k of document.querySelectorAll('.kk-hucre .kk-kart')) {
          n++;
          const kutu = k.getBoundingClientRect();
          if (k.scrollHeight > k.clientHeight + 1 || k.scrollWidth > k.clientWidth + 1) kotu.push(`${k.dataset.id}/${k.dataset.yuz}: taşma`);
          for (const c of k.children) { const b = c.getBoundingClientRect(); if (b.bottom > kutu.bottom - 2 || b.right > kutu.right + 1) kotu.push(`${k.dataset.id}/${k.dataset.yuz}: ${c.className} dışarıda`); }
        }
        return { n, kotu };
      });
      expect(sonuc.n).toBe(SAYFALI.length * 2);
      expect(sonuc.kotu).toEqual([]);
      const ihlas = SAYFALI.find((o) => o.id === 's-ihlas');
      const on = page.locator('.kk-hucre .kk-kart[data-id="s-ihlas"][data-yuz="on"]');
      await expect(on.locator('.kk-ad')).toHaveText(ihlas.ad[dil]);
      await expect(on.locator('.kk-ar')).toContainText('سُورَةُ');
      await expect(on.locator('.kk-kod')).toHaveText('3-02');
      const arka = page.locator('.kk-hucre .kk-kart[data-id="s-ihlas"][data-yuz="arka"]');
      await expect(arka.locator('.kk-okut')).toHaveText(OKUT[dil]);
      await expect(arka.locator('.kk-adres')).toHaveText(`egitim.ulucamii.be/${dil}/calis/s-ihlas/`);
      await expect(arka.locator('.kk-kod')).toHaveText('3-02');
    });
  }

  test('bilgi maddesinde (Arapça metni yok) ön yüzde Arapça satır çizilmez; yine kare kod ve kod vardır', async ({ page }) => {
    await page.goto('/tr/kartlar/?sec=b-imanin-sartlari');
    await expect(page.locator('.kk-hucre .kk-kart[data-id="b-imanin-sartlari"][data-yuz="on"] .kk-ar')).toHaveCount(0);
    await expect(page.locator('.kk-hucre .kk-kart[data-id="b-imanin-sartlari"][data-yuz="arka"] .kk-kare svg')).toHaveCount(1);
    await expect(page.locator('.kk-hucre .kk-kart[data-id="b-imanin-sartlari"][data-yuz="arka"] .kk-okut')).toHaveText('Çalışmak için okutun');
  });

  test('kartta okunuş (Latin harfli) ve meâl yok; Arapça yalnız maddenin kendi sayfasındaki metinden', async ({ page }) => {
    await page.goto('/tr/kartlar/?sec=s-ihlas,s-ayetel-kursi,d-ezan');
    const ar = await page.locator('.kk-hucre .kk-on .kk-ar').allTextContents();
    expect(ar.length).toBe(3);
    for (const a of ar) expect(a).not.toMatch(/[A-Za-z]/);
    await expect(page.locator('.kk-hucre .kk-on .okunus, .kk-hucre .kk-on .meal')).toHaveCount(0);
    // Sayfadaki metinle karşılaştır
    await page.goto('/tr/calis/s-ayetel-kursi/');
    const sayfa = (await page.locator('.ayet-grubu .ar').first().innerText()).replace(/[\s۝٠-٩]/g, '');
    await page.goto('/tr/kartlar/?sec=s-ayetel-kursi');
    const kart = (await page.locator('.kk-hucre .kk-on .kk-ar').innerText()).replace(/[\s… ]/g, '');
    expect(sayfa.startsWith(kart)).toBe(true);
  });
});

test.describe('kare kod', () => {
  test('arka yüzdeki vektör kare kod, sayfanın kanonik adresinin QR matrisidir (5 dil)', async ({ page }) => {
    for (const dil of DILLER) {
      await page.goto(`/${dil}/kartlar/?sec=s-ihlas,d-ezan,b-imanin-sartlari`);
      for (const id of ['s-ihlas', 'd-ezan', 'b-imanin-sartlari']) {
        const svg = page.locator(`.kk-hucre .kk-kart[data-id="${id}"][data-yuz="arka"] .kk-kare svg`);
        expect(await svg.locator('path').getAttribute('d'), `${dil}/${id}`).toBe(beklenenYol(`${SITE}/${dil}/calis/${id}/`));
        expect(await svg.getAttribute('aria-hidden')).toBe('true');
      }
    }
  });

  test('sayfadaki kare kod, madde sayfasındaki basılı kartın kare koduyla aynı matristir', async ({ page }) => {
    await page.goto('/tr/calis/s-ihlas/');
    const madde = await page.locator('.kart-kare svg path').getAttribute('d');
    await page.goto('/tr/kartlar/?sec=s-ihlas');
    expect(await page.locator('.kk-hucre .kk-kart[data-yuz="arka"] .kk-kare svg path').getAttribute('d')).toBe(madde);
  });
});

test.describe('gizlilik: kayıt cihazdan çıkmaz, sayfa yazmaz', () => {
  test('cihaz hafızası bayt bayt aynı kalır; yeni anahtar eklenmez; yalnız GET ve yalnız kendi kökeni', async ({ page }) => {
    const durum = JSON.stringify(durumKur(ID5));
    const istekler = [];
    page.on('request', (r) => istekler.push(`${r.method()} ${r.url()} ${r.postData() ?? ''}`));
    await page.addInitScript(([k, d]) => localStorage.setItem(k, d), [ANAHTAR, durum]);
    await page.goto('/tr/kartlar/');
    await page.locator('[data-kk-tumu]').click();
    await page.locator('input[data-kk-yuz][value="arka"]').check();
    await page.locator('[data-kk-hicbiri]').click();
    expect(await page.evaluate((k) => localStorage.getItem(k), ANAHTAR)).toBe(durum);
    expect((await page.evaluate(() => Object.keys(localStorage))).sort()).toEqual([ANAHTAR, 'ulucamiiEgitimDili'].sort());
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(istekler.filter((i) => !i.startsWith('GET '))).toEqual([]);
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => ['beacon', 'xmlhttprequest', 'fetch'].includes(e.initiatorType)).length)).toBe(0);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('yazdır düğmesi tarayıcının yazdırma penceresini açar', async ({ page }) => {
    await page.addInitScript(() => { window.__yazdirildi = 0; window.print = () => { window.__yazdirildi++; }; });
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/kartlar/');
    await page.locator('[data-kk-yazdir]').click();
    expect(await page.evaluate(() => window.__yazdirildi)).toBe(1);
  });
});

test.describe('yazdırma', () => {
  test('yazdırma ortamında yalnız sayfalar görünür; sayfa beyaz (koyu temada da); piksel görsel yok', async ({ page }) => {
    await tohumla(page, durumKur(ID10));
    await page.goto('/tr/kartlar/');
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
    await expect(page.locator('[data-kk-sayfalar]')).toBeVisible();
    for (const s of ['.ust', '.alt', '.kk-giris', '.kk-panel', '.kk-yan', '.kk-sayfa-etiket']) await expect(page.locator(s).first()).toBeHidden();
    expect(await page.locator('.kk-sayfa').first().evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
    const gorseller = await page.evaluate(() => [...document.querySelectorAll('[data-kk-sayfalar] img, [data-kk-sayfalar] picture, [data-kk-sayfalar] canvas, [data-kk-sayfalar] video')].map((e) => `${e.tagName} ${e.getAttribute('src') ?? ''}`));
    expect(gorseller.length).toBeGreaterThan(0);
    for (const g of gorseller) expect(g, 'piksel görsel').toMatch(/^IMG \/logo\/.*\.svg$/);
    const arka = await page.evaluate(() => [...document.querySelectorAll('.kk-sayfa, .kk-sayfa *')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b !== 'none'));
    expect(arka).toEqual([]);
  });

  const pdfOku = async (page, dil, yol, yuz) => {
    await page.emulateMedia({ media: "screen" });
    await page.goto(`/${dil}/kartlar/${yol}`);
    if (yuz) await page.locator(`input[data-kk-yuz][value="${yuz}"]`).check();
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    return page.pdf({ preferCSSPageSize: true, printBackground: true });
  };
  const sayfaSayisi = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  const piksel = (pdf) => {
    const dosya = join(tmpdir(), `kart-test-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
    writeFileSync(dosya, pdf);
    try {
      return execFileSync('pdfimages', ['-list', dosya], { encoding: 'utf8' }).trim().split('\n').length - 2;
    } catch {
      return (pdf.toString('latin1').match(/\/Subtype\s*\/Image/g) ?? []).length;
    } finally { rmSync(dosya, { force: true }); }
  };
  const A4 = (pdf) => {
    const m = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf.toString('latin1'));
    return m && Math.abs(Number(m[1]) - 595.3) < 1 && Math.abs(Number(m[2]) - 841.9) < 1;
  };

  for (const dil of ['tr', 'fr']) {
    test(`${dil}: PDF — 10 ezber = 4 sayfa (2 ön + 2 arka), A4, piksel görsel yok, yazı tipleri gömülü`, async ({ page }, ti) => {
      test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
      await tohumla(page, durumKur(ID10));
      const pdf = await pdfOku(page, dil, '');
      expect(A4(pdf)).toBe(true);
      expect(sayfaSayisi(pdf)).toBe(4);
      expect(piksel(pdf)).toBe(0);
      expect(/\/FontFile[23]?\b|\/Subtype\s*\/Type3|\/CIDFontType2/.test(pdf.toString('latin1'))).toBe(true);
    });
  }

  test('PDF — 8 ezber 2 sayfa, 9 ezber 4 sayfa; yalnız ön yüz seçilince yaprak sayısı kadar sayfa', async ({ page }, ti) => {
    test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
    await tohumla(page, durumKur(SAYFALI.slice(0, 8).map((o) => o.id)));
    expect(sayfaSayisi(await pdfOku(page, 'de', ''))).toBe(2);
    await page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durumKur(SAYFALI.slice(0, 9).map((o) => o.id))]);
    expect(sayfaSayisi(await pdfOku(page, 'de', ''))).toBe(4);
    expect(sayfaSayisi(await pdfOku(page, 'de', '', 'on'))).toBe(2);
    expect(sayfaSayisi(await pdfOku(page, 'de', '', 'arka'))).toBe(2);
  });

  test('PDF — 40 ezber (en) 10 sayfa ve piksel yok; bütün kartlar da sayfa sayısı ⌈76 / 8⌉ × 2', async ({ page }, ti) => {
    test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
    await tohumla(page, durumKur(SAYFALI.slice(0, 40).map((o) => o.id)));
    const pdf = await pdfOku(page, 'en', '');
    expect(sayfaSayisi(pdf)).toBe(10);
    expect(piksel(pdf)).toBe(0);
    await page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durumKur(SAYFALI.map((o) => o.id))]);
    const hepsi = await pdfOku(page, 'nl', '');
    expect(sayfaSayisi(hepsi)).toBe(Math.ceil(SAYFALI.length / 8) * 2);
    expect(piksel(hepsi)).toBe(0);
  });

  test('PDF — arka sayfadaki kod metni, ön yüzün aynı satırdaki ters sütunundaki kartın kodudur (metin katmanı)', async ({ page }, ti) => {
    test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
    await tohumla(page, durumKur(ID10));
    const pdf = await pdfOku(page, 'tr', '');
    const dosya = join(tmpdir(), `kart-metin-${process.pid}.pdf`);
    writeFileSync(dosya, pdf);
    let metin;
    try { metin = execFileSync('pdftotext', ['-layout', dosya, '-'], { encoding: 'utf8' }); } catch { metin = null; } finally { rmSync(dosya, { force: true }); }
    test.skip(metin === null, 'pdftotext yok');
    const sayfalar = metin.split('\f');
    const kodlar = (s) => s.match(/\b[1-8K]-\d\d\b/g) ?? [];
    const kod = (o) => `${o.seviye === 'kenar' ? 'K' : o.seviye}-${String(o.sira).padStart(2, '0')}`;
    const on1 = ID10.slice(0, 8).map((id) => kod(SAYFALI.find((o) => o.id === id)));
    // Ön sayfada her kart kodu bir kez, arka sayfada her kod bir kez; arka sayfada satır sırası ön sayfadakinin çiftli ters hâli.
    expect(kodlar(sayfalar[0]).sort()).toEqual([...on1].sort());
    expect(kodlar(sayfalar[1]).sort()).toEqual([...on1].sort());
    const beklenenArka = [];
    for (let r = 0; r < 4; r++) beklenenArka.push(on1[r * 2 + 1], on1[r * 2]);
    expect(kodlar(sayfalar[1])).toEqual(beklenenArka);
  });
});

test.describe('erişilebilirlik ve yeniden akış', () => {
  for (const dil of DILLER) {
    test(`${dil}: iki temada axe (boş ve dolu), 320 px yatay taşma yok`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(`/${dil}/kartlar/`);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page), `boş ${colorScheme}`).toBe(true);
        const bos = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(bos.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `boş ${colorScheme}`).toEqual([]);
      }
      await tohumla(page, durumKur(ID10));
      await page.goto(`/${dil}/kartlar/`);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page), `dolu ${colorScheme}`).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `dolu ${colorScheme}`).toEqual([]);
      }
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('klavye: Tab ile kutulara gidilir, Boşluk işaretler, işaret önizlemeye yansır; kutular ve düğmeler dokunulabilir boyda', async ({ page }) => {
    await page.goto('/tr/kartlar/');
    await page.locator('[data-kk-tumu]').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-kk-grup="1"] [data-kk-grup-kutu]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('input[data-kk-kutu]').first()).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('input[data-kk-kutu]:checked')).toHaveCount(1);
    await expect(page.locator('[data-kk-sayfalar] .kk-sayfa-kutu')).toHaveCount(2);
    for (const s of ['[data-kk-tumu]', '[data-kk-hicbiri]', '[data-kk-yazdir]']) {
      expect((await page.locator(s).boundingBox()).height, s).toBeGreaterThanOrEqual(44);
    }
  });

  test('320 px: 76 ezber seçiliyken de yatay taşma yok', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/de/kartlar/');
    await page.locator('[data-kk-tumu]').click();
    expect(await tasmaYok(page)).toBe(true);
  });
});

test.describe('giriş noktaları', () => {
  for (const dil of DILLER) {
    test(`${dil}: giriş sayfasında üç araç karosu, alt bilgi, madde sayfası, Çalışma Belgesi ve Kilimim'den kartlara bağlantı`, async ({ page }) => {
      await page.goto(`/${dil}/`);
      const karolar = page.locator('[data-araclar] a.arac');
      await expect(karolar).toHaveCount(3);
      expect(await karolar.evaluateAll((a) => a.map((x) => x.getAttribute('href')))).toEqual([`/${dil}/kilimim/`, `/${dil}/calisma-belgesi/`, `/${dil}/kartlar/`]);
      await expect(page.locator(`footer a[href="/${dil}/kartlar/"]`)).toHaveCount(1);
      await page.goto(`/${dil}/calis/s-ihlas/`);
      await expect(page.locator(`.belge-bag a[href="/${dil}/kartlar/"]`)).toBeVisible();
      await expect(page.locator(`[data-kartlar-bag][href="/${dil}/kartlar/?sec=s-ihlas"]`)).toBeVisible();
      await page.goto(`/${dil}/calisma-belgesi/`);
      await expect(page.locator(`.belge-kilimim a[href="/${dil}/kartlar/"]`)).toBeVisible();
      await page.goto(`/${dil}/kilimim/`);
      await expect(page.locator(`.km-bag a[href="/${dil}/kartlar/"]`)).toBeVisible();
    });
  }

  test('giriş sayfası: araç bloğu ana içeriğin (şeritler ve örnek kilim) altında, kaynaklardan önce', async ({ page }) => {
    await page.goto('/tr/');
    const y = (s) => page.locator(s).first().evaluate((e) => e.getBoundingClientRect().top + scrollY);
    expect(await y('[data-araclar]')).toBeGreaterThan(await y('#seritler'));
    expect(await y('[data-araclar]')).toBeGreaterThan(await y('#kilim-baslik'));
    expect(await y('[data-araclar]')).toBeLessThan(await y('.kaynaklar'));
  });

  test('madde sayfasında «Birden çok kart bas» bağlantısı kartlar sayfasını o maddeyle açar ve basılı kartta görünmez', async ({ page }) => {
    await page.goto('/tr/calis/s-kevser/');
    await page.locator('[data-kartlar-bag]').click();
    await expect(page).toHaveURL(/\/tr\/kartlar\/\?sec=s-kevser$/);
    expect(await page.locator('input[data-kk-kutu]:checked').evaluateAll((k) => k.map((x) => x.value))).toEqual(['s-kevser']);
    await page.goto('/tr/calis/s-kevser/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-kartlar-bag]')).toBeHidden();
  });
});
