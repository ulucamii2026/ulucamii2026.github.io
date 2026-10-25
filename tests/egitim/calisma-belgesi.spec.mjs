/**
 * Çalışma Belgesi (25 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı. Belge, bu cihazdaki çalışma kaydından hoca dinlemeden
 * hazırlanır; hesap, sunucu ve ağ yoktur. Burada sabitlenenler:
 *  - beş dilde sayfa açılır (başlık, kanonik adres, hreflang), kayıt yokken boş durum; kayıt varken ezberler adlarıyla ve son çalışma
 *    tarihiyle listelenir, hepsi seçili gelir, işaret kaldırılınca kâğıttan çıkar, hiçbiri seçilmezse yazdır düğmesi kapanır;
 *  - kâğıttaki zorunlu ifade sayfa dilindedir (Ezber Sertifikası'nın yalnız hocanın dinlediği ezberlere verildiği);
 *  - yazılan ad yalnız sayfa belleğindedir: cihaz hafızasına yazılmaz, hiçbir istekte (adres, gövde, başlık) geçmez, yenileyince silinir;
 *  - sayfa cihaz hafızasına YAZMAZ (okur) ve ağa dış istek atmaz; depolama kapalıyken boş durumla açılır; betik kapalıyken açıklama kalır;
 *  - yazdırma ortamında yalnız kâğıt görünür; Chromium'un PDF çıktısı A4, az ezberde tek sayfa, çoğunda temiz çok sayfa, piksel görsel YOK;
 *  - iki temada erişilebilirlik (axe), 320 px'te yatay taşma yok; giriş, madde ve alt bilgideki bağlantılar.
 * PDF üretimi yalnız masaüstü projesinde sınanır. Dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync, rmSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const SITE = 'https://egitim.ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ANAHTAR = 'ulucamii:ezber:cihaz:v1';
const BUGUN = new Date(2026, 9, 25, 11, 0, 0);
const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const SAYFALI = katalog.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.metinli || o.bilgiMetni);
const ad = (id, dil) => SAYFALI.find((o) => o.id === id).ad[dil];

const BASLIK = { tr: 'Çalışma Belgesi', fr: 'Attestation de travail personnel', en: 'Self-Study Certificate', nl: 'Bewijs van zelfstudie', de: 'Nachweis des Selbststudiums' };
// Zorunlu ifadenin (ana plan kararı) her dildeki ayırt edici parçaları: hoca dinlemeden · yalnız hocanın dinlediği ezbere sertifika.
const IFADE = {
  tr: ['kendi çalışmasıyla, hoca dinlemeden', 'Ezber Sertifikası yalnız hocanın dinlediği ezberlere verilir.'],
  fr: ['par la personne elle-même, sans qu’un enseignant les ait écoutés', 'certificat de mémorisation'],
  en: ['by the person themselves, without a teacher listening', 'Memorisation Certificate is awarded only'],
  nl: ['door de persoon zelf zijn geoefend, zonder dat een leerkracht luisterde', 'memorisatiecertificaat wordt alleen uitgereikt'],
  de: ['von der Person selbst geübt wurden, ohne dass eine Lehrkraft zugehört hat', 'Memorier-Zertifikat wird nur'],
};
const ID5 = ['s-ihlas', 's-fatiha', 's-nas', 's-felak', 'd-amentu'].filter((id) => SAYFALI.some((o) => o.id === id));
const an = (g, s = 10) => new Date(2026, 9, g, s, 0, 0).getTime();
const durumKur = (idler, ekstra = {}) => ({
  v: 1, ar: 1, gunler: ['2026-10-12', '2026-10-24', '2026-10-25'],
  maddeler: Object.fromEntries(idler.map((id, i) => [id, { kip: 'sina', kutu: i === 0 ? 2 : -1, sonraki: i === 0 ? '2026-11-05' : '', son: an(25 - i), ...ekstra }])),
});
const tohumla = (page, durum) => page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durum]);
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
  await page.clock.setFixedTime(BUGUN);
});

test.describe('sayfa ve boş durum', () => {
  for (const dil of DILLER) {
    test(`${dil}: açılır, başlık, kanonik adres, hreflang; kayıt yokken boş durum ve yönlendirme bağlantıları`, async ({ page }) => {
      await page.goto(`/${dil}/calisma-belgesi/`);
      await expect(page.locator('h1')).toHaveText(BASLIK[dil]);
      await expect(page.locator('html')).toHaveAttribute('lang', /^[a-z]{2}/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/${dil}/calisma-belgesi/`);
      expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(6);
      await expect(page.locator('[data-belge-bos]')).toBeVisible();
      await expect(page.locator('[data-belge-dolu]')).toBeHidden();
      await expect(page.locator('[data-belge-bos] a.birincil')).toHaveAttribute('href', `/${dil}/calis/s-fatiha/`);
      await expect(page.locator('[data-belge-bos] a.ikincil')).toHaveAttribute('href', `/${dil}/#seritler`);
      // Gizlilik cümlesi sayfada (tek satır) ve zorunlu ayrım (Ezber Sertifikası) görünür.
      await expect(page.locator('.belge-gizlilik')).toBeVisible();
      await expect(page.locator('.belge-fark')).toBeVisible();
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('dil geçişi aynı belge sayfasına gider', async ({ page }) => {
    await page.goto('/tr/calisma-belgesi/');
    for (const d of ['fr', 'en', 'nl', 'de']) await expect(page.locator(`.diller a[hreflang="${d}"]`)).toHaveAttribute('href', `/${d}/calisma-belgesi/`);
  });

  test('betik kapalıyken açıklama kalır, belge bölümü görünmez, JavaScript uyarısı çıkar', async ({ browser }) => {
    const baglam = await browser.newContext({ javaScriptEnabled: false, baseURL: KOK });
    const sayfa = await baglam.newPage();
    await sayfa.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    await sayfa.goto('/tr/calisma-belgesi/');
    await expect(sayfa.locator('h1')).toHaveText('Çalışma Belgesi');
    await expect(sayfa.locator('[data-belge]')).toBeHidden();
    await expect(sayfa.locator('.belge-js')).toBeVisible();
    await baglam.close();
  });

  test('depolama kapalıyken sayfa bozulmaz ve boş durumla açılır', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('kapalı', 'SecurityError'); } });
    });
    await page.goto('/tr/calisma-belgesi/');
    await expect(page.locator('[data-belge-bos]')).toBeVisible();
    await expect(page.locator('[data-belge-dolu]')).toBeHidden();
  });

  test('bozuk kayıt ve kataloğda olmayan madde belgeye girmez', async ({ page }) => {
    await page.addInitScript(([k]) => localStorage.setItem(k, '{bozuk'), [ANAHTAR]);
    await page.goto('/tr/calisma-belgesi/');
    await expect(page.locator('[data-belge-bos]')).toBeVisible();
    await tohumla(page, durumKur(['x-yok-boyle-madde', ID5[0]]));
    await page.goto('/tr/calisma-belgesi/');
    await expect(page.locator('.belge-liste li')).toHaveCount(1);
  });
});

test.describe('kayıtla', () => {
  for (const dil of DILLER) {
    test(`${dil}: ezberler adıyla ve son çalışma tarihiyle listelenir, hepsi seçili; kâğıtta zorunlu ifade sayfa dilinde`, async ({ page }) => {
      await tohumla(page, durumKur(ID5));
      await page.goto(`/${dil}/calisma-belgesi/`);
      await expect(page.locator('[data-belge-dolu]')).toBeVisible();
      await expect(page.locator('[data-belge-bos]')).toBeHidden();
      const maddeler = page.locator('.belge-liste li');
      await expect(maddeler).toHaveCount(ID5.length);
      await expect(page.locator('.belge-liste input:checked')).toHaveCount(ID5.length);
      // Katalog sırası, sayfa dilindeki ad ve yerel tarih.
      const beklenenSira = SAYFALI.filter((o) => ID5.includes(o.id)).map((o) => o.ad[dil]);
      expect(await page.locator('.belge-liste .ad').allTextContents()).toEqual(beklenenSira);
      await expect(page.locator('.belge-tablo tbody tr')).toHaveCount(ID5.length);
      // Kâğıt: başlık, ifade, kurum satırı (telefon ya da kişi adı yok), düzenlenme tarihi.
      const kagit = page.locator('[data-belge-kagit]');
      await expect(kagit.locator('.belge-baslik')).toHaveText(BASLIK[dil]);
      const metin = (await kagit.innerText()).replace(/\s+/g, ' ');
      for (const parca of IFADE[dil]) expect(metin).toContain(parca);
      await expect(kagit.locator('.kurum')).toContainText('egitim.ulucamii.be');
      expect(metin).not.toMatch(/\+32|\d{3} \d{2} \d{2}|imam|Rıdvan|KAYAHAN/i);
      await expect(kagit.locator('[data-belge-tarih]')).toContainText('2026');
      await expect(kagit.locator('[data-belge-ozet]')).toContainText('3'); // 12, 24, 25 Ekim: son üç haftada 3 gün
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('Fransızca: ince/bölünmez boşluk iki nokta öncesinde ve «Établi le»', async ({ page }) => {
    await tohumla(page, durumKur(ID5));
    await page.goto('/fr/calisma-belgesi/');
    await expect(page.locator('.belge-liste .son').first()).toHaveText(/dernier travail[  ]: \d/);
    await expect(page.locator('[data-belge-tarih]')).toHaveText('Établi le 25 octobre 2026');
    await expect(page.locator('.belge-gizlilik')).toContainText(/Confidentialité[  ]:/);
  });

  test('tr: tarihler ve tekrar basamağı cihazdaki kayıttan gelir, uydurma yok (basamaksız satırda «—»)', async ({ page }) => {
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/calisma-belgesi/');
    const satirlar = page.locator('.belge-tablo tbody tr');
    const ilk = satirlar.first();
    // Katalog sırasında ilk seçilen madde: kaydındaki kutu −1 ya da 2 olabilir; metin yalnız «n / 5» ya da «—».
    for (let i = 0; i < ID5.length; i++) {
      await expect(satirlar.nth(i).locator('td').first()).toHaveText(String(i + 1));
      await expect(satirlar.nth(i).locator('.basamak')).toHaveText(/^(—|[1-5] \/ 5)$/);
      await expect(satirlar.nth(i).locator('.son')).toHaveText(/^\d{1,2} \S+ 2026$/);
    }
    await expect(ilk.locator('.ad')).toHaveText(ad(SAYFALI.find((o) => ID5.includes(o.id)).id, 'tr'));
    await expect(page.locator('.belge-tablo tbody .basamak', { hasText: '3 / 5' })).toHaveCount(1); // kutu 2 → basamak 3
  });

  test('işareti kaldırılan ezber kâğıttan çıkar; hiçbiri seçilmezse yazdır kapanır; hepsi geri getirir', async ({ page }) => {
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/calisma-belgesi/');
    const sayac = page.locator('[data-belge-sayac]');
    await expect(sayac).toHaveText(`Seçili: ${ID5.length} / ${ID5.length}`);
    await page.locator('.belge-liste input').nth(1).uncheck();
    await expect(page.locator('.belge-tablo tbody tr')).toHaveCount(ID5.length - 1);
    await expect(sayac).toHaveText(`Seçili: ${ID5.length - 1} / ${ID5.length}`);
    // Numaralar yeniden dizilir.
    expect(await page.locator('.belge-tablo tbody tr td.no').allTextContents()).toEqual(ID5.slice(1).map((_, i) => String(i + 1)));
    await page.locator('[data-belge-hicbiri]').click();
    await expect(page.locator('.belge-tablo tbody tr')).toHaveCount(1);
    await expect(page.locator('.belge-tablo tbody td.bos')).toHaveText('Ezber seçilmedi.');
    await expect(page.locator('[data-belge-yazdir]')).toBeDisabled();
    await expect(page.locator('[data-belge-seciliyok]')).toBeVisible();
    await page.locator('[data-belge-hepsi]').click();
    await expect(page.locator('.belge-tablo tbody tr')).toHaveCount(ID5.length);
    await expect(page.locator('[data-belge-yazdir]')).toBeEnabled();
    await expect(page.locator('[data-belge-seciliyok]')).toBeHidden();
  });

  test('yazdır düğmesi tarayıcının yazdırma penceresini açar', async ({ page }) => {
    await page.addInitScript(() => { window.__yazdirildi = 0; window.print = () => { window.__yazdirildi++; }; });
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/calisma-belgesi/');
    await page.locator('[data-belge-yazdir]').click();
    expect(await page.evaluate(() => window.__yazdirildi)).toBe(1);
  });

  test('yoğunluk: az satırda ferah, 7–12 orta, 13+ sıkı', async ({ page }) => {
    const hepsi = SAYFALI.map((o) => o.id);
    for (const [n, beklenen] of [[3, 'az'], [9, 'orta'], [20, 'cok']]) {
      await page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durumKur(hepsi.slice(0, n))]);
      await page.goto('/tr/calisma-belgesi/');
      await expect(page.locator('[data-belge-kagit]')).toHaveAttribute('data-yogunluk', beklenen);
    }
  });
});

test.describe('gizlilik: ad ve kayıt cihazdan çıkmaz', () => {
  test('yazılan ad hiçbir istekte geçmez, depoya ve çereze yazılmaz, kaydı değiştirmez; yenileyince silinir', async ({ page }) => {
    const AD = 'Zeynep Çelik-Örnek';
    const istekler = [];
    page.on('request', (r) => istekler.push(`${r.method()} ${r.url()} ${r.postData() ?? ''} ${JSON.stringify(r.headers())}`));
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/calisma-belgesi/');
    const once = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    await page.fill('[data-belge-ad]', AD);
    await expect(page.locator('[data-belge-ad-yaz]')).toHaveText(AD);
    await page.locator('.belge-liste input').first().uncheck();
    await page.locator('[data-belge-yazdir]').click({ trial: true });
    const sonra = await page.evaluate(() => ({ ls: JSON.stringify({ ...localStorage }), ss: JSON.stringify({ ...sessionStorage }), cerez: document.cookie, adres: location.href, baslik: document.title }));
    expect(sonra.ls).toBe(once);
    expect(sonra.ls).not.toContain('Zeynep');
    expect(sonra.ss).not.toContain('Zeynep');
    expect(sonra.cerez).toBe('');
    expect(sonra.adres).not.toContain('Zeynep');
    expect(sonra.baslik).not.toContain('Zeynep');
    for (const i of istekler) expect(i, 'istek').not.toMatch(/Zeynep|%C3%87elik|Çelik/i);
    // Yalnız KENDİ kökenine ve yalnız sayfa/varlık için GET: veri gönderen (POST, beacon) istek yok.
    expect(istekler.filter((i) => !i.startsWith('GET '))).toEqual([]);
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'beacon' || e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch').length)).toBe(0);
    await page.reload();
    await expect(page.locator('[data-belge-ad]')).toHaveValue('');
    await expect(page.locator('[data-belge-ad-yaz]')).toHaveText('');
  });

  test('sayfa cihaz hafızasına yazmaz: kayıt bayt bayt aynı kalır', async ({ page }) => {
    const durum = JSON.stringify(durumKur(ID5));
    await page.addInitScript(([k, d]) => localStorage.setItem(k, d), [ANAHTAR, durum]);
    await page.goto('/tr/calisma-belgesi/');
    await page.locator('.belge-liste input').nth(2).uncheck();
    await page.locator('[data-belge-hepsi]').click();
    expect(await page.evaluate((k) => localStorage.getItem(k), ANAHTAR)).toBe(durum);
    expect((await page.evaluate(() => Object.keys(localStorage))).sort()).toEqual([ANAHTAR, 'ulucamiiEgitimDili'].sort());
  });
});

test.describe('yazdırma', () => {
  test('yazdırma ortamında yalnız kâğıt görünür; çerçeve ve logo vektördür, piksel görsel yok', async ({ page }) => {
    await tohumla(page, durumKur(ID5));
    await page.goto('/tr/calisma-belgesi/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-belge-kagit]')).toBeVisible();
    for (const s of ['.ust', '.alt', '.belge-giris', '.belge-panel']) await expect(page.locator(s)).toBeHidden();
    const gorseller = await page.evaluate(() => [...document.querySelectorAll('img, picture, canvas, video')].map((e) => `${e.tagName} ${e.getAttribute('src') ?? ''}`));
    for (const g of gorseller) expect(g, 'piksel görsel').toMatch(/^IMG \/logo\/.*\.svg$/);
    const arka = await page.evaluate(() => [...document.querySelectorAll('.belge, .belge *')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b !== 'none'));
    expect(arka).toEqual([]);
    // Kâğıt beyaz, mürekkep koyu: koyu tema yazdırmada da (kâğıt jetonları sabit).
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
    expect(await page.locator('[data-belge-kagit]').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
  });

  const pdfOku = async (page, dil, idler) => {
    await page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durumKur(idler)]);
    await page.goto(`/${dil}/calisma-belgesi/`);
    await page.fill('[data-belge-ad]', 'Örnek Ad');
    await page.emulateMedia({ media: 'print' });
    return page.pdf({ preferCSSPageSize: true, printBackground: true });
  };
  const sayfaSayisi = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  const piksel = (pdf) => {
    // pdfimages varsa onunla (kesin), yoksa PDF nesnelerinde /Subtype /Image aranır.
    const dosya = join(tmpdir(), `belge-test-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
    writeFileSync(dosya, pdf);
    try {
      const cikti = execFileSync('pdfimages', ['-list', dosya], { encoding: 'utf8' }).trim().split('\n');
      return cikti.length - 2;
    } catch {
      return (pdf.toString('latin1').match(/\/Subtype\s*\/Image/g) ?? []).length;
    } finally { rmSync(dosya, { force: true }); }
  };
  const A4 = (pdf) => {
    const m = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf.toString('latin1'));
    return m && Math.abs(Number(m[1]) - 595.3) < 1 && Math.abs(Number(m[2]) - 841.9) < 1;
  };

  for (const dil of ['tr', 'fr']) {
    test(`${dil}: PDF — A4, 5 ezberde tek sayfa, piksel görsel yok`, async ({ page }, ti) => {
      test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
      const pdf = await pdfOku(page, dil, ID5);
      expect(A4(pdf)).toBe(true);
      expect(sayfaSayisi(pdf)).toBe(1);
      expect(piksel(pdf)).toBe(0);
    });
  }

  test('PDF — 12 ezber (Fransızca) hâlâ tek sayfa; 40 ezber temiz çok sayfa ve yine piksel görsel yok', async ({ page, browser }, ti) => {
    test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
    const hepsi = SAYFALI.map((o) => o.id);
    const fr12 = await pdfOku(page, 'fr', hepsi.slice(0, 12));
    expect(sayfaSayisi(fr12)).toBe(1);
    expect(piksel(fr12)).toBe(0);
    const baglam = await browser.newContext({ baseURL: KOK });
    const sayfa = await baglam.newPage();
    await sayfa.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    const cok = await pdfOku(sayfa, 'tr', hepsi.slice(0, 40));
    expect(sayfaSayisi(cok)).toBeGreaterThanOrEqual(2);
    expect(sayfaSayisi(cok)).toBeLessThanOrEqual(3);
    expect(piksel(cok)).toBe(0);
    await baglam.close();
  });
});

test.describe('erişilebilirlik ve yeniden akış', () => {
  for (const dil of DILLER) {
    test(`${dil}: iki temada axe (boş durum ve dolu), 320 px yatay taşma yok`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(`/${dil}/calisma-belgesi/`);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page), `boş ${colorScheme}`).toBe(true);
        const bos = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(bos.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `boş ${colorScheme}`).toEqual([]);
      }
      await tohumla(page, durumKur(ID5));
      await page.goto(`/${dil}/calisma-belgesi/`);
      await page.fill('[data-belge-ad]', 'Ayşe Öztürk');
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page), `dolu ${colorScheme}`).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `dolu ${colorScheme}`).toEqual([]);
      }
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('320 px: çok ezberde de yatay taşma yok; ad alanı ve düğmeler dokunulabilir boyda', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await tohumla(page, durumKur(SAYFALI.map((o) => o.id).slice(0, 40)));
    await page.goto('/de/calisma-belgesi/');
    await page.fill('[data-belge-ad]', 'Ein sehr langer Name, der die Zeile eigentlich sprengen müsste und sprengen müsste');
    expect(await tasmaYok(page)).toBe(true);
    for (const s of ['[data-belge-ad]', '[data-belge-hepsi]', '[data-belge-hicbiri]', '[data-belge-yazdir]']) {
      const kutu = await page.locator(s).boundingBox();
      expect(kutu.height, s).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('bağlantılar', () => {
  for (const dil of DILLER) {
    test(`${dil}: alt bilgide, «Bugün tekrar» bandında ve madde sayfasında belgeye bağlantı var`, async ({ page }) => {
      await tohumla(page, durumKur(ID5));
      await page.goto(`/${dil}/`);
      await expect(page.locator(`footer a[href="/${dil}/calisma-belgesi/"]`)).toHaveCount(1);
      await expect(page.locator(`[data-tekrar] a[href="/${dil}/calisma-belgesi/"]`)).toBeVisible();
      await page.goto(`/${dil}/calis/s-ihlas/`);
      await expect(page.locator(`.belge-bag a[href="/${dil}/calisma-belgesi/"]`)).toBeVisible();
    });
  }

  test('basılı ezber kartında belge bağlantısı basılmaz', async ({ page }) => {
    await page.goto('/tr/calis/s-ihlas/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.belge-bag')).toBeHidden();
  });
});
