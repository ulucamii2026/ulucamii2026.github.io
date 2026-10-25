/**
 * Çevrim dışı çalışma ve ana ekrana ekleme (25 Ekim 2026) — gerçek Chromium'da, derlenmiş çıktıya ve gerçek service worker'a karşı. Dış ağ kapalıdır;
 * yalnız ulucamii.be/media/ses/ isteklerine depodaki dosyalar (CORS başlıklı, gerçek sunucu gibi `audio/mp3`) verilir. Çevrim dışı kipi (`cevrimdisiYap`)
 * hem tarayıcının ağını keser (`context.setOffline`) hem de bu sahte ses sunucusunu susturur: `route.fulfill` ağ katmanına inmediği için ayrıca
 * kapatılmazsa ses çevrim dışıyken de sahte sunucudan gelir ve önbellekten geldiği kanıtlanamazdı. Burada sabitlenenler:
 *  - service worker kayıt olur, sayfayı denetler, sürümlü kabuk önbelleğini ve altı yedek sayfayı doldurur; SW yokken (engelli) kutu hiç görünmez;
 *  - «İnternetsiz çalışmak için kaydet»: sayfa ve BÜTÜN sesler (tam, parçalar) tam 200 yanıt olarak ses önbelleğine girer (boyutları dosyayla aynı),
 *    künye yazılır; çevrim dışı yeniden yükleme sayfayı önbellekten açar, çalar gerçekten çalar, Range isteği doğru 206 ile (Content-Range, Content-Length,
 *    Accept-Ranges) yanıtlanır; sessiz bilgi maddesi yalnız sayfayı kaydeder;
 *  - KAYITSIZ ses önbelleğe girmez: çevrimiçi çalınan kaydedilmemiş maddenin sesi ses önbelleğine (ezber-ses-v1) hiçbir şey yazmaz, tarayıcı sesi her zamanki gibi
 *    Range'li akış olarak alır (tam inmesi beklenmez), çevrim dışıyken çalmaz; ses önbelleğine yalnız kaydet akışı yazar;
 *  - hata ve iptal: tek ses 404 verince kayıt tamamlanmaz (künye yok, o denemede yazılan sesler geri alınır), «Vazgeç» indirmeyi keser ve geri alır;
 *  - ağ önce: çevrimiçiyken HTML ağdan gelir ve önbellek tazelenir; çevrim dışı son ağ kopyası açılır;
 *  - yedek sayfa: kayıtsız adres çevrim dışı yerelleştirilmiş yönetim sayfasını açar (adres dili, yoksa tarayıcı dili), kayıtlı maddeler listelenir ve açılır;
 *  - yönetim: kayıt boyutuyla listelenir, tek tek silinir (ses başka kayıtta kullanılmıyorsa gider; iki maddenin ORTAK dosyası biri silinince kalır, son
 *    kullanan silinince gider), «Hepsini sil» önce onay ister ve her şeyi temizler;
 *  - yeni SW kurulunca eski sürümlü önbellek silinir, ses ve kayıt önbelleği KALIR;
 *  - klavyeyle kullanılır (Enter, odak düğmede kalır), duyurular role=status satırından gider; beş dilde metinler; iki temada axe; 320 px taşma yok;
 *  - uygulama bildirimi Chromium'un kendi çözümleyicisinden hatasız geçer ve uygulama kurulabilir; CSP ihlali yok; giriş sayfası ve alt bilgi bağlantıları.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readFileSync, statSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const SES_KOKU = 'https://ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KAYDET = { tr: 'İnternetsiz çalışmak için kaydet', fr: 'Enregistrer pour travailler hors ligne', en: 'Save for offline study', nl: 'Opslaan om offline te oefenen', de: 'Zum Offline-Üben speichern' };
const SAYFA_BASLIK = { tr: 'Çevrim dışı çalışma', fr: 'Travail hors ligne', en: 'Offline study', nl: 'Offline oefenen', de: 'Offline üben' };
const HEPSINI_SIL = { tr: 'Hepsini sil', fr: 'Tout supprimer', en: 'Delete all', nl: 'Alles verwijderen', de: 'Alles löschen' };
const sesDosyasi = (yol) => new URL(`../../public${yol}`, import.meta.url);

test.use({ serviceWorkers: 'allow' });

/** ulucamii.be/media/ses/ isteklerinin kaydı (yol, Range başlığı): her testte sıfırlanır (bir işçide testler art arda koşar). */
let sesIstekleri = [];
/** Çevrim dışı kipi: sahte ses sunucusu da yanıt vermez (aşağıda). */
let agKapali = false;
const cevrimdisiYap = async (context, kapali) => {
  agKapali = kapali;
  await context.setOffline(kapali);
};

test.beforeEach(async ({ context }) => {
  sesIstekleri = [];
  agKapali = false;
  await context.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.origin === KOK) return r.continue();
    if (u.origin === SES_KOKU && u.pathname.startsWith('/media/ses/')) {
      if (agKapali) return r.abort('internetdisconnected');
      const dosya = sesDosyasi(u.pathname);
      if (!existsSync(dosya)) return r.fulfill({ status: 404, body: 'yok' });
      const govde = readFileSync(dosya);
      const ortak = { 'access-control-allow-origin': '*', 'accept-ranges': 'bytes', 'content-type': 'audio/mp3' };
      sesIstekleri.push({ yol: u.pathname, range: r.request().headers().range ?? null });
      const aralik = /^bytes=(\d+)-(\d*)$/.exec(r.request().headers().range ?? '');
      if (aralik) {
        const bas = Number(aralik[1]);
        const son = aralik[2] ? Math.min(Number(aralik[2]), govde.length - 1) : govde.length - 1;
        return r.fulfill({ status: 206, headers: { ...ortak, 'content-range': `bytes ${bas}-${son}/${govde.length}`, 'content-length': String(son - bas + 1) }, body: govde.subarray(bas, son + 1) });
      }
      return r.fulfill({ status: 200, headers: { ...ortak, 'content-length': String(govde.length) }, body: govde });
    }
    return r.abort();
  });
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
});

const swDenetliyor = (page) => page.waitForFunction(() => navigator.serviceWorker.controller !== null);
const kutu = (page) => page.locator('[data-cd]');
const dugme = (page) => page.locator('[data-cd-dugme]');
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const csp = (page) => page.evaluate(() => window.__csp);
/** Madde sayfasını açar, service worker sayfayı denetleyene kadar bekler (kutu bundan sonra görünür). */
async function ac(page, id = 's-ihlas', dil = 'tr') {
  await page.goto(`/${dil}/calis/${id}/`);
  await swDenetliyor(page);
  await expect(kutu(page)).toBeVisible();
}
async function kaydet(page) {
  await dugme(page).click();
  await expect(dugme(page)).toHaveAttribute('data-mod', 'sil', { timeout: 20_000 });
}
/** Bütün önbellekler: ad → [{ url, durum, tur, bayt }] (gövde okunarak). */
const onbellekler = (page) => page.evaluate(async () => {
  const sonuc = {};
  for (const ad of await caches.keys()) {
    const c = await caches.open(ad);
    sonuc[ad] = await Promise.all((await c.keys()).map(async (i) => {
      const r = await c.match(i);
      return { url: i.url.replace(location.origin, ''), durum: r.status, tur: r.type, ct: r.headers.get('content-type'), bayt: (await r.clone().arrayBuffer()).byteLength };
    }));
  }
  return sonuc;
});
const kabukAdi = (o) => Object.keys(o).find((a) => a.startsWith('ezber-kabuk-'));
/** Kayıt önbelleğindeki künyeler; SW'nin «kayıtlı sayfaları yeni sürümde yeniden aldım» işaretçisi künye değildir. */
const kunyeler = (o) => (o['ezber-kayit-v1'] ?? []).filter((x) => !x.url.endsWith('/_yenilenen-surum'));

test.describe('service worker ve kayıt kutusu', () => {
  test('SW kayıt olur ve sayfayı denetler; sürümlü kabuk altı yedek sayfayla dolar; kalıcı önbellekler boş başlar', async ({ page }) => {
    await page.goto('/tr/');
    await swDenetliyor(page);
    const kayit = await page.evaluate(async () => {
      const k = await navigator.serviceWorker.getRegistration();
      return { kapsam: k.scope, betik: k.active?.scriptURL, durum: k.active?.state };
    });
    expect(kayit).toEqual({ kapsam: `${KOK}/`, betik: `${KOK}/sw.js`, durum: 'activated' });
    const o = await onbellekler(page);
    expect(kabukAdi(o)).toMatch(/^ezber-kabuk-[0-9a-f]{16}$/);
    const yollar = o[kabukAdi(o)].map((x) => x.url);
    for (const y of ['/', ...DILLER.map((d) => `/${d}/cevrimdisi/`)]) expect(yollar, y).toContain(y);
    expect(o[kabukAdi(o)].every((x) => x.durum === 200)).toBe(true);
    expect(await csp(page)).toEqual([]);
  });

  test('Uygulama bildirimi Chromium çözümleyicisinden hatasız geçer; uygulama kurulabilir', async ({ page, context }) => {
    await page.goto('/tr/');
    await swDenetliyor(page);
    const cdp = await context.newCDPSession(page);
    const bildirim = await cdp.send('Page.getAppManifest');
    expect(bildirim.errors).toEqual([]);
    expect(bildirim.url).toBe(`${KOK}/manifest.webmanifest`);
    const m = JSON.parse(bildirim.data);
    expect(m).toMatchObject({ display: 'standalone', start_url: '/', scope: '/', theme_color: '#134420', background_color: '#134420' });
    expect(m.icons.map((i) => `${i.sizes}:${i.purpose}`)).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
    const kurulum = await cdp.send('Page.getInstallabilityErrors');
    expect(kurulum.installabilityErrors).toEqual([]);
  });

  test('SW yokken (engelli ya da eski tarayıcı) kutu hiç görünmez; sayfa olduğu gibi çalışır', async ({ browser }) => {
    const baglam = await browser.newContext({ serviceWorkers: 'block' });
    await baglam.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    const sayfa = await baglam.newPage();
    await sayfa.goto(`${KOK}/tr/calis/s-ihlas/`);
    await expect(sayfa.locator('h1')).toBeVisible();
    await expect(sayfa.locator('[data-calisma]')).toBeVisible();
    await sayfa.waitForTimeout(500);
    await expect(kutu(sayfa)).toBeHidden();
    await baglam.close();
  });

  for (const dil of DILLER) {
    test(`${dil}: kutu SW etkinleşince açılır, düğme ve bağlantı yerelleştirilmiş`, async ({ page }) => {
      await ac(page, 's-ihlas', dil);
      await expect(dugme(page)).toHaveText(KAYDET[dil]);
      await expect(dugme(page)).toHaveAttribute('data-mod', 'kaydet');
      await expect(page.locator('[data-cd] .cd-bag a')).toHaveAttribute('href', `/${dil}/cevrimdisi/`);
      await expect(page.locator('[data-cd-kayitli]')).toBeHidden();
      expect(await csp(page)).toEqual([]);
    });
  }
});

test.describe('kaydet, çevrim dışı aç, sil', () => {
  test('kaydet: sayfa ve bütün sesler tam 200 yanıt olarak girer (boyutlar dosyayla aynı), künye yazılır, duyuru role=status’tan gider', async ({ page }) => {
    await ac(page);
    const veri = JSON.parse(await kutu(page).getAttribute('data-veri'));
    expect(veri.sesler).toHaveLength(5); // tam kayıt + dört âyet
    const depoOnce = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
    await expect(page.locator('[data-cd-durum]')).toHaveAttribute('role', 'status');
    await dugme(page).click();
    await expect(dugme(page)).toHaveAttribute('data-mod', 'vazgec'); // indirme sürerken vazgeçilebilir
    await expect(dugme(page)).toHaveAttribute('data-mod', 'sil', { timeout: 20_000 });
    await expect(dugme(page)).toHaveText('Sil');
    await expect(dugme(page)).toHaveAttribute('aria-label', 'Bu cihazdaki kaydı sil: İhlâs Sûresi');
    await expect(page.locator('[data-cd-kayitli]')).toBeVisible();
    await expect(page.locator('[data-cd-kayitli-metin]')).toContainText(/^Bu cihazda kayıtlı · .*(KB|MB)/);
    await expect(page.locator('[data-cd-durum]')).toContainText('Kaydedildi. Bu madde artık internetsiz de açılır ve çalar. Toplam:');
    await expect(page.locator('[data-cd-ilerleme-alan]')).toBeHidden();

    const o = await onbellekler(page);
    const ses = o['ezber-ses-v1'];
    expect(ses.map((x) => x.url).sort()).toEqual(veri.sesler.slice().sort());
    for (const s of ses) {
      expect(s.durum, s.url).toBe(200);
      expect(s.tur, s.url).not.toBe('opaque'); // opak yanıt (no-cors, durum 0, boyutu bilinmez) asla saklanmaz
      expect(s.ct, s.url).toBe('audio/mpeg'); // GitHub Pages’in audio/mp3’ü standart türe çevrilmiş (iOS Safari)
      expect(s.bayt, s.url).toBe(statSync(sesDosyasi(new URL(s.url).pathname)).size);
    }
    expect(Object.keys(o).sort()).toEqual(['ezber-kabuk-' + kabukAdi(o).slice(12), 'ezber-kayit-v1', 'ezber-ses-v1'].sort());
    expect(o[kabukAdi(o)].map((x) => x.url)).toContain('/tr/calis/s-ihlas/');
    const kayitlar = await page.evaluate(async () => {
      const c = await caches.open('ezber-kayit-v1');
      return Promise.all((await c.keys()).filter((i) => !i.url.endsWith('/_yenilenen-surum')).map(async (i) => ({ anahtar: new URL(i.url).pathname, k: await (await c.match(i)).json() })));
    });
    expect(kayitlar).toHaveLength(1);
    expect(kayitlar[0].anahtar).toBe('/cevrimdisi-kayit/tr/s-ihlas');
    expect(Object.keys(kayitlar[0].k).sort()).toEqual(['ad', 'dil', 'id', 'sayfaBayt', 'sesler', 'tarih', 'v', 'yol']); // kişisel veri yok
    expect(kayitlar[0].k).toMatchObject({ v: 1, id: 's-ihlas', dil: 'tr', ad: 'İhlâs Sûresi', yol: '/tr/calis/s-ihlas/' });
    expect(kayitlar[0].k.sayfaBayt).toBeGreaterThan(10_000);
    expect(kayitlar[0].k.sesler.map((s) => s.y).sort()).toEqual(veri.sesler.slice().sort());
    expect(kayitlar[0].k.sesler.every((s) => s.b > 0)).toBe(true);
    expect(await csp(page)).toEqual([]);
    // Cihazın öteki hafızası dokunulmadı: bu iş yalnız Cache API kullanır.
    expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))).toBe(depoOnce);
  });

  test('çevrim dışı: kayıtlı sayfa önbellekten açılır, çalar gerçekten çalar, Range isteği doğru 206 ile yanıtlanır', async ({ page, context }) => {
    await page.addInitScript(() => {
      window.__sesler = [];
      const oynat = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...a) { window.__sesler.push(this); return oynat.apply(this, a); };
    });
    await ac(page);
    await kaydet(page);
    await cevrimdisiYap(context, true);
    await page.reload();
    await expect(page.locator('h1')).toContainText('İhlâs');
    await expect(kutu(page)).toBeVisible();
    await expect(dugme(page)).toHaveAttribute('data-mod', 'sil'); // kayıt cihazda kalıcı
    await expect(dugme(page)).toBeEnabled();
    // Sayfanın kendi çaları internetsiz çalar.
    await expect(page.locator('[data-oynat]')).toBeEnabled();
    await page.locator('[data-oynat]').click();
    await page.waitForFunction(() => window.__sesler.length > 0 && window.__sesler[0].currentTime > 0.3 && !window.__sesler[0].error, null, { timeout: 15_000 });
    await page.locator('[data-durdur]').click();
    // Range: ses önbellekten doğru bayt aralığıyla verilir.
    const ses = (await onbellekler(page))['ezber-ses-v1'][0];
    const boyut = ses.bayt;
    const yanit = await page.evaluate(async (adres) => {
      const r = await fetch(`https://ulucamii.be${adres}`, { headers: { Range: 'bytes=10-19' }, mode: 'cors' });
      const t = await fetch(`https://ulucamii.be${adres}`, { headers: { Range: 'bytes=-8' }, mode: 'cors' });
      const gecersiz = await fetch(`https://ulucamii.be${adres}`, { headers: { Range: 'bytes=99999999-' }, mode: 'cors' });
      const tam = await fetch(`https://ulucamii.be${adres}`, { mode: 'cors' });
      const al = async (x) => ({ durum: x.status, cr: x.headers.get('content-range'), cl: x.headers.get('content-length'), ar: x.headers.get('accept-ranges'), tur: x.headers.get('content-type'), bayt: (await x.arrayBuffer()).byteLength });
      return { aralik: await al(r), son: await al(t), gecersiz: await al(gecersiz), tam: await al(tam) };
    }, new URL(ses.url, SES_KOKU).pathname);
    expect(yanit.aralik).toEqual({ durum: 206, cr: `bytes 10-19/${boyut}`, cl: '10', ar: 'bytes', tur: 'audio/mpeg', bayt: 10 });
    expect(yanit.son).toEqual({ durum: 206, cr: `bytes ${boyut - 8}-${boyut - 1}/${boyut}`, cl: '8', ar: 'bytes', tur: 'audio/mpeg', bayt: 8 });
    expect(yanit.gecersiz.durum).toBe(416);
    expect(yanit.gecersiz.cr).toBe(`bytes */${boyut}`);
    expect(yanit.tam).toEqual({ durum: 200, cr: null, cl: String(boyut), ar: 'bytes', tur: 'audio/mpeg', bayt: boyut });
    expect(await csp(page)).toEqual([]);
  });

  test('kaydedilmemiş maddenin sesi çevrimiçi çalınınca ses önbelleğine hiçbir şey yazılmaz; tarayıcı sesi Range’li akış olarak alır; çevrim dışı çalmaz', async ({ page, context }) => {
    await page.addInitScript(() => {
      window.__sesler = [];
      const oynat = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...a) { window.__sesler.push(this); return oynat.apply(this, a); };
    });
    await ac(page);
    await expect(page.locator('[data-oynat]')).toBeEnabled();
    await page.locator('[data-oynat]').click();
    await page.waitForFunction(() => window.__sesler.length > 0 && window.__sesler[0].currentTime > 0.3 && !window.__sesler[0].error, null, { timeout: 15_000 });
    await page.locator('[data-durdur]').click();
    // SW araya girmemiş gibi: ağdaki ses istekleri tarayıcının kendi (Range’li) akış istekleridir; tam dosyayı arka planda indiren istek yok.
    expect(sesIstekleri.length).toBeGreaterThan(0);
    expect(sesIstekleri.filter((i) => !i.range)).toEqual([]);
    // Ses önbelleği ne dolu ne de var (kayıt hiç yapılmadı).
    const o = await onbellekler(page);
    expect(Object.keys(o)).not.toContain('ezber-ses-v1');
    expect(kunyeler(o)).toEqual([]);
    // Gezilen sayfanın HTML önbelleği değişmedi: SW denetimindeki ikinci açılışta sayfa kabuk önbelleğine girer (ses yine girmez).
    await page.reload();
    await expect.poll(async () => { const k = await onbellekler(page); return k[kabukAdi(k)].map((x) => x.url); }).toContain('/tr/calis/s-ihlas/');
    expect(Object.keys(await onbellekler(page))).not.toContain('ezber-ses-v1');
    // Çevrim dışı: çalınan dosya SW önbelleğinde yok. HTTP önbelleğini atlayan istek (cache: 'no-store') ağa gitmek zorundadır ve başarısız olur;
    // sayfa tarafında kayıtsız sesin çevrim dışı çalamayacağı böyle sabitlenir (tarayıcının kendi disk önbelleği bundan bağımsızdır).
    const calinan = sesIstekleri[0].yol;
    await cevrimdisiYap(context, true);
    const sonuc = await page.evaluate(async (adres) => {
      try { await fetch(adres, { mode: 'cors', cache: 'no-store' }); return 'geldi'; } catch { return 'hata'; }
    }, `${SES_KOKU}${calinan}`);
    expect(sonuc).toBe('hata');
    await expect(page.locator('h1')).toBeVisible(); // sayfa bozulmadı (HTML önbellekten)
    expect(await csp(page)).toEqual([]);
  });

  test('sessiz bilgi maddesi yalnız sayfayı kaydeder; ses önbelleği oluşmaz', async ({ page }) => {
    await ac(page, 'b-secme-hadisler');
    expect(JSON.parse(await kutu(page).getAttribute('data-veri')).sesler).toEqual([]);
    await kaydet(page);
    await expect(page.locator('[data-cd-durum]')).toContainText('Kaydedildi. Bu sayfa artık internetsiz de açılır. Toplam:');
    const o = await onbellekler(page);
    expect(o['ezber-ses-v1'] ?? []).toEqual([]);
    expect(kunyeler(o)).toHaveLength(1);
  });

  test('tek ses 404 verirse kayıt tamamlanmaz: künye ve bozuk dosya yok, düğme geri gelir, hata duyurulur', async ({ page }) => {
    await page.route('**/media/ses/ayet/112-3.mp3', (r) => r.fulfill({ status: 404, body: 'yok', headers: { 'access-control-allow-origin': '*' } }));
    // SW kendi isteklerini bağlam düzeyinde yapar; aynı hatayı orada da ver.
    await page.context().route('**/media/ses/ayet/112-3.mp3', (r) => r.fulfill({ status: 404, body: 'yok', headers: { 'access-control-allow-origin': '*' } }));
    await ac(page);
    await dugme(page).click();
    await expect(page.locator('[data-cd-durum]')).toContainText('Kaydedilemedi. İnternet bağlantınızı denetleyip yeniden deneyin.', { timeout: 20_000 });
    await expect(dugme(page)).toHaveAttribute('data-mod', 'kaydet');
    await expect(page.locator('[data-cd-kayitli]')).toBeHidden();
    const o = await onbellekler(page);
    expect(kunyeler(o)).toEqual([]);
    // Üçüncü dosyaya gelinceye kadar tam kayıt ve ilk âyet yazılmıştı: künyesiz, silinemez dosya kalmasın diye geri alındı.
    expect(o['ezber-ses-v1'] ?? []).toEqual([]);
  });

  test('«Vazgeç» indirmeyi keser: kayıt yok, ilerleme gizlenir, vazgeçildi duyurulur', async ({ page }) => {
    // Üçüncü ses (112-2) yavaş gelir: sayfa + tam kayıt + 112-1 yazıldıktan sonra «Vazgeç»e basılır.
    const yavas = async (r) => { await new Promise((c) => setTimeout(c, 4000)); return r.fallback(); };
    await page.context().route('**/media/ses/ayet/112-2.mp3', yavas);
    await ac(page);
    await dugme(page).click();
    await expect(dugme(page)).toHaveAttribute('data-mod', 'vazgec');
    await expect(dugme(page)).toHaveText('Vazgeç');
    await expect(page.locator('[data-cd-ilerleme-alan]')).toBeVisible();
    await expect(page.locator('[data-cd-sayac]')).toContainText('3 / 6 dosya');
    expect((await onbellekler(page))['ezber-ses-v1']).toHaveLength(2); // yazılmış, henüz künyesiz
    await dugme(page).click();
    await expect(dugme(page)).toHaveAttribute('data-mod', 'kaydet');
    await expect(page.locator('[data-cd-durum]')).toContainText('Vazgeçildi.');
    await expect(page.locator('[data-cd-ilerleme-alan]')).toBeHidden();
    const o = await onbellekler(page);
    expect(kunyeler(o)).toEqual([]);
    expect(o['ezber-ses-v1'] ?? []).toEqual([]); // vazgeçilen kaydın sesleri geri alındı
  });

  test('klavye: Enter ile kaydedilir ve silinir, odak aynı düğmede kalır', async ({ page }) => {
    await ac(page);
    await dugme(page).focus();
    await page.keyboard.press('Enter');
    await expect(dugme(page)).toHaveAttribute('data-mod', 'sil', { timeout: 20_000 });
    expect(await page.evaluate(() => document.activeElement?.matches('[data-cd-dugme]'))).toBe(true);
    await page.keyboard.press('Enter');
    await expect(dugme(page)).toHaveAttribute('data-mod', 'kaydet');
    await expect(page.locator('[data-cd-durum]')).toContainText('Kayıt silindi.');
    expect(await page.evaluate(() => document.activeElement?.matches('[data-cd-dugme]'))).toBe(true);
    const o = await onbellekler(page);
    expect(kunyeler(o)).toEqual([]);
    expect(o['ezber-ses-v1'] ?? []).toEqual([]); // başka kayıt kullanmadığı için sesler de gitti
    expect(o[kabukAdi(o)].map((x) => x.url)).not.toContain('/tr/calis/s-ihlas/');
  });

  test('çevrim dışıyken kayıtsız maddede düğme kapalı ve neden yazılı; kayıtlıda Sil çalışır', async ({ page, context }) => {
    await ac(page);
    await cevrimdisiYap(context, true);
    await expect(dugme(page)).toBeDisabled();
    await expect(page.locator('[data-cd-cevrimdisi]')).toBeVisible();
    await expect(page.locator('[data-cd-cevrimdisi]')).toContainText(/internet bağlantınız yok/);
    await cevrimdisiYap(context, false);
    await expect(dugme(page)).toBeEnabled();
    await expect(page.locator('[data-cd-cevrimdisi]')).toBeHidden();
  });

  test('ağ önce: çevrimiçiyken HTML ağdan gelir ve önbellek tazelenir; çevrim dışı son ağ kopyası açılır', async ({ page, context }) => {
    let surum = 1;
    await context.route(`${KOK}/tr/kartlar/`, async (r) => {
      const yanit = await r.fetch();
      let govde = await yanit.text();
      if (surum === 2) govde = govde.replace('<title>', '<title>YENI ');
      return r.fulfill({ response: yanit, body: govde });
    });
    await page.goto('/tr/');
    await swDenetliyor(page);
    await page.goto('/tr/kartlar/');
    expect(await page.title()).not.toContain('YENI');
    surum = 2;
    await page.reload();
    expect(await page.title()).toContain('YENI');
    await cevrimdisiYap(context, true);
    await page.reload();
    expect(await page.title()).toContain('YENI');
  });

  test('yeni SW kurulunca eski sürümlü önbellek silinir; ses ve kayıt önbelleği kalır', async ({ page }) => {
    await ac(page);
    await kaydet(page);
    await page.evaluate(async () => { await (await caches.open('ezber-kabuk-eskisurum')).put('/eski/', new Response('eski')); });
    expect(Object.keys(await onbellekler(page))).toContain('ezber-kabuk-eskisurum');
    // SW'yi kaldır ve yeniden kur: install + activate yeniden çalışır.
    await page.evaluate(async () => { for (const k of await navigator.serviceWorker.getRegistrations()) await k.unregister(); });
    await page.reload();
    await swDenetliyor(page);
    await expect.poll(async () => Object.keys(await onbellekler(page)).sort().join()).not.toContain('eskisurum');
    const o = await onbellekler(page);
    expect(o['ezber-ses-v1']).toHaveLength(5);
    expect(kunyeler(o)).toHaveLength(1);
    expect(kabukAdi(o)).toMatch(/^ezber-kabuk-[0-9a-f]{16}$/);
    expect(o[kabukAdi(o)].map((x) => x.url)).toEqual(expect.arrayContaining(['/', '/tr/cevrimdisi/']));
  });
});

test.describe('yedek sayfa ve yönetim', () => {
  test('kayıtsız adres çevrim dışı yedek sayfayı açar (adres dili); kayıtlı madde listelenir ve açılır', async ({ page, context }) => {
    await ac(page);
    await kaydet(page);
    await cevrimdisiYap(context, true);
    await page.goto('/tr/calis/s-fatiha/'); // kayıtlı değil, hiç açılmadı
    await expect(page.locator('h1')).toHaveText('Çevrim dışı çalışma');
    await expect(page.locator('[data-cd-istenen]')).toBeVisible();
    await expect(page.locator('[data-cd-bag]')).toContainText('İnternet bağlantısı yok');
    const satir = page.locator('[data-cd-kayitlar] li');
    await expect(satir).toHaveCount(1);
    await expect(satir.locator('a')).toHaveText('İhlâs Sûresi');
    await expect(satir.locator('.cd-boyut')).toContainText(/(KB|MB)/);
    await expect(page.locator('[data-cd-ozet]')).toContainText('1 madde');
    await satir.locator('a').click();
    await expect(page).toHaveURL(`${KOK}/tr/calis/s-ihlas/`);
    await expect(page.locator('h1')).toContainText('İhlâs');
    await expect(page.locator('[data-calisma]')).toBeVisible();
    expect(await csp(page)).toEqual([]);
  });

  for (const dil of ['fr', 'en', 'nl', 'de']) {
    test(`${dil}: kayıtsız adres kendi dilinde yedek sayfayı açar`, async ({ page, context }) => {
      await page.goto(`/${dil}/`);
      await swDenetliyor(page);
      await cevrimdisiYap(context, true);
      await page.goto(`/${dil}/calis/s-fatiha/`);
      await expect(page.locator('h1')).toHaveText(SAYFA_BASLIK[dil]);
      await expect(page.locator('html')).toHaveAttribute('data-dil', dil);
      await expect(page.locator('[data-cd-bos]')).toBeVisible();
    });
  }

  test('adres dili yoksa tarayıcının dil sırası seçer (Almanca tarayıcı), olmayan dil İngilizceye düşer', async ({ browser }) => {
    for (const [yerel, beklenen] of [['de-DE', 'de'], ['ja-JP', 'en']]) {
      const baglam = await browser.newContext({ serviceWorkers: 'allow', locale: yerel });
      await baglam.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
      const sayfa = await baglam.newPage();
      await sayfa.goto(`${KOK}/en/`);
      await swDenetliyor(sayfa);
      await baglam.setOffline(true);
      await sayfa.goto(`${KOK}/tamamen-bilinmeyen-yol/`);
      await expect(sayfa.locator('h1')).toHaveText(SAYFA_BASLIK[beklenen]);
      await baglam.close();
    }
  });

  test('yönetim: kayıt tek tek silinir (ses başka kayıtta kullanılmıyorsa gider), duyuru role=status’tan gider, odak başlığa döner', async ({ page }) => {
    await ac(page, 's-ihlas');
    await kaydet(page);
    await ac(page, 's-nas');
    await kaydet(page);
    await page.goto('/tr/cevrimdisi/');
    const satir = page.locator('[data-cd-kayitlar] li');
    await expect(satir).toHaveCount(2);
    await expect(page.locator('[data-cd-ozet]')).toContainText('2 madde');
    await expect(page.locator('[data-cd-bos]')).toBeHidden();
    await page.getByRole('button', { name: 'Bu cihazdaki kaydı sil: İhlâs Sûresi' }).click();
    await expect(satir).toHaveCount(1);
    await expect(page.locator('[data-cd-durum]')).toContainText('İhlâs Sûresi kaydı silindi.');
    await expect(page.locator('[data-cd-durum]')).toHaveAttribute('role', 'status');
    const o = await onbellekler(page);
    expect(kunyeler(o)).toHaveLength(1);
    expect((o['ezber-ses-v1'] ?? []).every((s) => !s.url.includes('112-') && !s.url.includes('ihlas'))).toBe(true);
    expect((o['ezber-ses-v1'] ?? []).length).toBeGreaterThan(0); // Nâs’ın sesleri durur
    await page.getByRole('button', { name: /^Bu cihazdaki kaydı sil: / }).click();
    await expect(satir).toHaveCount(0);
    await expect(page.locator('[data-cd-bos]')).toBeVisible();
    await expect(page.locator('[data-cd-ozet]')).toHaveText('');
    expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-cd-kayitlar-baslik'))).toBe(true);
    expect(await csp(page)).toEqual([]);
  });

  // d-euzu-besmele (eûzü 1-0 ve besmele 1-1) ile s-alak-1-5 (aynı ikisi + beş âyet) aynı iki dosyayı paylaşır; paylaşım tests/ezber-cevrimdisi.test.mjs’te doğrulanır.
  const PAYLASAN = { kucuk: 'd-euzu-besmele', buyuk: 's-alak-1-5', ortak: ['/media/ses/ayet/1-0.mp3', '/media/ses/ayet/1-1.mp3'] };
  const sesYollariOnbellekte = async (page) => ((await onbellekler(page))['ezber-ses-v1'] ?? []).map((x) => new URL(x.url).pathname).sort();
  const satiriSil = async (page, id) => {
    await page.locator('[data-cd-kayitlar] li', { has: page.locator(`a[href="/tr/calis/${id}/"]`) }).getByRole('button').click();
    await expect(page.locator(`[data-cd-kayitlar] a[href="/tr/calis/${id}/"]`)).toHaveCount(0);
  };

  test('iki madde aynı ses dosyalarını paylaşırsa büyüğünün silinmesi ortak dosyaları götürmez; son kullanan silinince gider', async ({ page, context }) => {
    await ac(page, PAYLASAN.buyuk);
    await kaydet(page);
    await ac(page, PAYLASAN.kucuk);
    await kaydet(page);
    expect(await sesYollariOnbellekte(page)).toHaveLength(7); // ortak ikisi bir kez durur: 5 âyet + eûzü + besmele
    await page.goto('/tr/cevrimdisi/');
    await expect(page.locator('[data-cd-kayitlar] li')).toHaveCount(2);
    await satiriSil(page, PAYLASAN.buyuk);
    expect(await sesYollariOnbellekte(page)).toEqual(PAYLASAN.ortak); // yalnız büyüğe özgü beş âyet gitti, ortaklar kaldı
    // Kalan madde çevrim dışı hâlâ doğru 206 ile çalar.
    await cevrimdisiYap(context, true);
    const aralik = await page.evaluate(async (adres) => {
      const r = await fetch(adres, { headers: { Range: 'bytes=0-9' }, mode: 'cors' });
      return { durum: r.status, cr: r.headers.get('content-range'), bayt: (await r.arrayBuffer()).byteLength };
    }, `${SES_KOKU}${PAYLASAN.ortak[1]}`);
    expect(aralik.durum).toBe(206);
    expect(aralik.cr).toMatch(/^bytes 0-9\/\d+$/);
    expect(aralik.bayt).toBe(10);
    await cevrimdisiYap(context, false);
    await satiriSil(page, PAYLASAN.kucuk);
    expect(await sesYollariOnbellekte(page)).toEqual([]); // son kullanan da gidince ortak dosyalar da gitti
    expect(kunyeler(await onbellekler(page))).toEqual([]);
  });

  test('ortak dosyaları paylaşan iki maddeden küçüğü silinirse hiçbir ses gitmez (büyük madde hepsini kullanıyor); büyüğü silinince hepsi gider', async ({ page }) => {
    await ac(page, PAYLASAN.kucuk);
    await kaydet(page);
    await ac(page, PAYLASAN.buyuk);
    await kaydet(page);
    expect(await sesYollariOnbellekte(page)).toHaveLength(7);
    await page.goto('/tr/cevrimdisi/');
    await satiriSil(page, PAYLASAN.kucuk);
    expect(await sesYollariOnbellekte(page)).toHaveLength(7);
    await satiriSil(page, PAYLASAN.buyuk);
    expect(await sesYollariOnbellekte(page)).toEqual([]);
  });

  test('«Hepsini sil»: önce onay sorar; vazgeçilebilir; onaylanınca kayıtlar, sesler ve açılmış sayfalar gider, yedek sayfalar kalır', async ({ page }) => {
    await ac(page, 's-ihlas');
    await kaydet(page);
    await page.goto('/tr/kartlar/'); // kaydedilmeden açılmış sayfa
    await page.goto('/tr/cevrimdisi/');
    await expect(page.locator('[data-cd-acilanlar] a')).not.toHaveCount(0);
    await expect(page.locator('[data-cd-onay]')).toBeHidden();
    await page.locator('[data-cd-hepsi]').click();
    await expect(page.locator('[data-cd-onay]')).toBeVisible();
    await expect(page.locator('[data-cd-evet]')).toBeFocused();
    await page.locator('[data-cd-vazgec]').click();
    await expect(page.locator('[data-cd-onay]')).toBeHidden();
    await expect(page.locator('[data-cd-hepsi]')).toBeFocused();
    expect(Object.keys(await onbellekler(page))).toContain('ezber-kayit-v1'); // vazgeçince hiçbir şey silinmedi
    await page.locator('[data-cd-hepsi]').click();
    await page.locator('[data-cd-evet]').click();
    await expect(page.locator('[data-cd-kayitlar] li')).toHaveCount(0);
    await expect(page.locator('[data-cd-acilanlar] li')).toHaveCount(0);
    await expect(page.locator('[data-cd-durum]')).toHaveText('Bütün kayıtlar silindi.');
    const o = await onbellekler(page);
    expect(kunyeler(o)).toEqual([]);
    expect(o['ezber-ses-v1'] ?? []).toEqual([]);
    const yollar = o[kabukAdi(o)].map((x) => x.url);
    for (const y of ['/', ...DILLER.map((d) => `/${d}/cevrimdisi/`)]) expect(yollar, y).toContain(y);
    expect(yollar.filter((y) => y.endsWith('/'))).toHaveLength(6); // yalnız önyüklenen yedek sayfalar
  });

  test('beş dilde yönetim sayfası: başlık, «Hepsini sil» ve boş durum; bağlantı durumu çevrim dışıyken değişir', async ({ page, context }) => {
    for (const dil of DILLER) {
      await page.goto(`/${dil}/cevrimdisi/`);
      await swDenetliyor(page);
      await expect(page.locator('h1')).toHaveText(SAYFA_BASLIK[dil]);
      await expect(page.locator('[data-cd-bos]')).toBeVisible();
      await expect(page.locator('[data-cd-hepsi]')).toBeDisabled();
      await expect(page.locator('[data-cd-hepsi]')).toHaveText(HEPSINI_SIL[dil]);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    }
    await page.goto('/tr/cevrimdisi/');
    await swDenetliyor(page);
    await expect(page.locator('[data-cd-bag]')).toHaveText('İnternet bağlantısı var.');
    await cevrimdisiYap(context, true);
    await expect(page.locator('[data-cd-bag]')).toContainText('İnternet bağlantısı yok');
  });
});

test.describe('erişilebilirlik ve yerleşim', () => {
  for (const tema of ['light', 'dark']) {
    test(`${tema}: axe — madde sayfası (kayıt kutusu kayıtsız ve kayıtlı), yönetim ve yedek sayfa 0 ihlal`, async ({ page, context }) => {
      await page.emulateMedia({ colorScheme: tema });
      const tara = async (ad) => {
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => `${ad}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      };
      await ac(page);
      await tara('madde (kayıtsız)');
      await kaydet(page);
      await tara('madde (kayıtlı)');
      await page.goto('/tr/cevrimdisi/');
      await expect(page.locator('[data-cd-kayitlar] li')).toHaveCount(1);
      await tara('yönetim (kayıtlı)');
      await page.locator('[data-cd-hepsi]').click();
      await tara('yönetim (onay)');
      await page.locator('[data-cd-vazgec]').click();
      await cevrimdisiYap(context, true);
      await page.goto('/tr/calis/s-fatiha/');
      await expect(page.locator('[data-cd-istenen]')).toBeVisible();
      await tara('yedek sayfa');
    });
  }

  for (const dil of ['fr', 'de']) {
    test(`${dil}: 320 px — madde kutusu, yönetim ve yedek sayfa yatay taşmaz`, async ({ page, context }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await ac(page, 's-ihlas', dil);
      expect(await tasmaYok(page), 'madde (kayıtsız)').toBe(true);
      await kaydet(page);
      expect(await tasmaYok(page), 'madde (kayıtlı)').toBe(true);
      await page.goto(`/${dil}/cevrimdisi/`);
      await expect(page.locator('[data-cd-kayitlar] li')).toHaveCount(1);
      await expect(page.locator('[data-cd-ozet]')).toContainText(/: 1 · /); // sayıdan bağımsız özet biçimi (Fransızcada «1 textes» yok)
      expect(await tasmaYok(page), 'yönetim').toBe(true);
      await page.locator('[data-cd-hepsi]').click();
      expect(await tasmaYok(page), 'yönetim (onay)').toBe(true);
      await cevrimdisiYap(context, true);
      await page.goto(`/${dil}/calis/s-fatiha/`);
      expect(await tasmaYok(page), 'yedek sayfa').toBe(true);
      // Dokunma hedefleri en az 44 px.
      for (const secici of ['[data-cd-kayitlar] button', '[data-cd-hepsi]', '[data-cd-evet]']) {
        const kutuOlcu = await page.locator(secici).first().boundingBox().catch(() => null);
        if (kutuOlcu) expect(kutuOlcu.height, secici).toBeGreaterThanOrEqual(43.5);
      }
    });
  }
});

test.describe('giriş sayfası ve alt bilgi bağlantıları', () => {
  test.use({ serviceWorkers: 'block' });
  for (const dil of DILLER) {
    test(`${dil}: giriş sayfasındaki «Kendi çalışmanız için» bloğu ve alt bilgi çevrim dışı sayfaya bağlanır; araç döşemesi hâlâ üç`, async ({ page }) => {
      await page.goto(`/${dil}/`);
      await expect(page.locator('a.arac')).toHaveCount(3);
      await expect(page.locator('.arac-cevrimdisi a')).toHaveAttribute('href', `/${dil}/cevrimdisi/`);
      await expect(page.locator('footer .don a[href$="/cevrimdisi/"]')).toHaveAttribute('href', `/${dil}/cevrimdisi/`);
      const baglanti = page.locator('.arac-cevrimdisi a');
      await baglanti.click();
      await expect(page.locator('h1')).toHaveText(SAYFA_BASLIK[dil]);
      // SW yokken sayfa yine de açılır; kayıt desteklenmiyorsa ya da kayıt yoksa yalnız boş durum görünür, hata yok.
      await expect(page.locator('[data-cd-bos]:not([hidden]), [data-cd-desteklenmiyor]:not([hidden])')).toHaveCount(1);
    });
  }
});
