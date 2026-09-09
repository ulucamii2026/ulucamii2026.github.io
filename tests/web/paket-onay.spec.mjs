import { test, expect } from '@playwright/test';

const REF = 'IH-2099-9999';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const hedef = new URL(route.request().url()).origin;
    if (hedef === 'http://127.0.0.1:4401') return route.continue();
    return route.abort();
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

async function kurGeciciOturum(page) {
  await page.addInitScript(() => {
    localStorage.setItem('sveltia-cms.user', JSON.stringify({ token: 'test-token' }));
    localStorage.setItem('panel-oturum', JSON.stringify({ baslangic: Date.now() }));
    sessionStorage.setItem('panel-sirlar', JSON.stringify({ gh: 'test-token', gas: 'test-key' }));
  });
}

function paketHazirlamaModulYaz(page, moduleBody) {
  return page.route('**/admin/ek9-hazirlik.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `export async function ek9HazirlikAc() { return ${moduleBody}; }
      export function sahitUnvani() { return ''; }`
  }));
}

async function basvuruListesiMock(page, cevapFonksiyon) {
  const istekler = [];
  let onaySayaci = 0;
  const varsayilanOnay = { ok: true, paket: { ref: REF, revizyon: 1, sayfa: 6, pdfId: 'test-paket-file-12345', durum: 'sirada', alicilar: [] } };
  await page.route('https://script.google.com/**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      if (payload.tur === 'ihtida-paket-onay') {
        istekler.push(payload);
        const cevap = cevapFonksiyon ? await cevapFonksiyon(onaySayaci) : varsayilanOnay;
        onaySayaci++;
        if (cevap === null) return route.abort('failed');
        return route.fulfill({ json: cevap || varsayilanOnay });
      }
      if (payload.tur === 'ihtida-paket-tekrar') return route.fulfill({ json: { ok: true } });
      return route.fulfill({ json: { ok: true, surum: 25 } });
    }

    const islem = new URL(request.url()).searchParams.get('islem');
    if (islem === 'liste') return route.fulfill({
      json: { ok: true, surum: 25, kayitlar: { basliklar: [], satirlar: [] }, ihtidalar: {
        basliklar: ['Zaman damgası', 'Referans', 'Adı Soyadı', 'E-posta', 'PDF bağlantısı', 'Durum', 'Tam paket PDF'],
        satirlar: [['09.09.2026 12:00', REF, 'Deniz Örnek', 'deniz@example.test', 'https://drive.google.com/file/d/test-summary-file-123/view', 'Yeni başvuru', 'https://drive.google.com/file/d/test-packet-file-12345/view']],
      } }
    });
    if (islem === 'belge') return route.fulfill({ json: { ok: true, kayit: { 'Zaman damgası': '09.09.2026 12:00' }, basvuranImza: '' } });
    if (islem === 'ihtida-paket-durum') return route.fulfill({ json: varsayilanOnay });
    return route.fulfill({ json: { ok: true, surum: 25 } });
  });

  return istekler;
}

async function paketButonu(page) {
  await page.goto('/admin/#basvurular');
  await page.locator('#sekme-ihtida').click();
  const dugme = page.locator(`[data-ihtida-paket="${REF}"]`);
  await expect(dugme).toBeVisible();
  return dugme;
}

test('Paket onayı başarılı olduğunda buton eski metnine ve kullanılabilir duruma döner', async ({ page }) => {
  await kurGeciciOturum(page);
  let yanitiSerbestBirak;
  const yanitBekle = new Promise(resolve => { yanitiSerbestBirak = resolve; });
  const paketCagrilari = await basvuruListesiMock(page, async () => { await yanitBekle; });
  await paketHazirlamaModulYaz(page, `{
    belgeTuru: 'kimlik', beyanTarihi: '2026-09-09',
    adSoyad: 'Deniz Örnek', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', ihtidaSebebi: 'Kendi araştırmam',
    ihtidaTarihi: '2026-09-08', sahitler: [{ ad: 'Birinci Şahit' }, { ad: 'İkinci Şahit' }]
  }`);

  const dugme = await paketButonu(page);
  const eskiMetin = await dugme.textContent();
  await dugme.click();
  try {
    await expect.poll(() => paketCagrilari.length).toBe(1);
    await expect(dugme).toBeDisabled();
    await expect(dugme).toHaveText('Paket arşive ve gönderim sırasına alınıyor…');
  } finally { yanitiSerbestBirak(); }
  await expect(dugme).toHaveText(eskiMetin);
  await expect(dugme).toBeEnabled();
  expect(paketCagrilari).toHaveLength(1);
});

test('İptal edilen paket onayı sonrası buton eski metin ve kullanılabilir duruma döner', async ({ page }) => {
  await kurGeciciOturum(page);
  const paketCagrilari = await basvuruListesiMock(page);
  await paketHazirlamaModulYaz(page, 'undefined');
  const dugme = await paketButonu(page);
  const eskiMetin = await dugme.textContent();
  await dugme.click();
  await expect(dugme).toHaveText(eskiMetin);
  await expect(dugme).toBeEnabled();
  expect(paketCagrilari).toHaveLength(0);
});

test('Belirsiz ağ yanıtı sonrası yeniden tıklamada aynı işlem anahtarı korunur', async ({ page }) => {
  await kurGeciciOturum(page);
  const cevaplar = [
    null,
    { ok: true, paket: { ref: REF, revizyon: 2, sayfa: 6, pdfId: 'test-packet-file-12345', durum: 'sirada', alicilar: [] } },
  ];
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
  const paketCagrilari = await basvuruListesiMock(page, (index) => cevaplar[index]);
  await paketHazirlamaModulYaz(page, `{
    belgeTuru: 'kimlik', beyanTarihi: '2026-09-09',
    adSoyad: 'Deniz Örnek', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', ihtidaSebebi: 'Kendi araştırmam',
    ihtidaTarihi: '2026-09-08', sahitler: [{ ad: 'Birinci Şahit' }, { ad: 'İkinci Şahit' }]
  }`);
  const dugme = await paketButonu(page);
  const eskiMetin = await dugme.textContent();
  await dugme.click();
  await expect(dugme).toHaveText(eskiMetin);
  await expect(dugme).toBeEnabled();
  await dugme.click();
  await expect(dugme).toHaveText(eskiMetin);
  await expect(dugme).toBeEnabled();
  expect(paketCagrilari).toHaveLength(2);
  expect(paketCagrilari[0].islemAnahtari).toBe(paketCagrilari[1].islemAnahtari);
});
