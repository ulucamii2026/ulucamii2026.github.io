import { test, expect } from '@playwright/test';

const model = {
  surum: 1, guncelleme: '2026-09-09T12:00:00Z', kurum: { ad: 'Sentetik Ulu Camii', sehir: 'Namur' },
  kayitlar: [
    { ref: 'IH-2099-0001', defterNo: '', adSoyad: 'Bekleyen Örnek', basvuruTarihi: '2026-09-09', ihtidaTarihi: '', durum: 'bekliyor', camiAdi: 'Sentetik Cami', camiSehir: 'Namur' },
    { ref: 'IH-2099-0002', defterNo: '12', adSoyad: 'Tamamlanan Örnek', basvuruTarihi: '2026-09-08', ihtidaTarihi: '2026-09-08', durum: 'tamamlandi', camiAdi: 'Sentetik Cami', camiSehir: 'Namur', ek9No: 'EK9-TEST' },
  ],
};

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401' ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
});

async function moduluKur(page, durum = '') {
  await page.goto('/tr/');
  await page.addStyleTag({ url: '/admin/panel.css' });
  await page.evaluate(async ({ defter, durum }) => {
    document.querySelector('main').innerHTML = '<section id="basvurular"><h2>Başvurular</h2></section>';
    window.defterIstekleri = []; window.defterGonderileri = []; window.defterModeli = defter; window.defterDurum = durum;
    const { ihtidaDefteriKur } = await import('/admin/ihtida-defteri-panel.js');
    ihtidaDefteriKur({
      gasIstek: async (islem, parametreler = {}) => {
        window.defterIstekleri.push({ islem, parametreler });
        if (islem === 'ihtida-defteri') return { ok: true, defter: window.defterModeli, durum: window.defterDurum };
        if (islem === 'ihtida-defteri-dosya') return { ok: true, base64: 'VGVzdA==', mime: 'application/pdf', ad: `ihtida-defteri.${parametreler.format}` };
        return { ok: false, hata: 'Sentetik hata' };
      },
      gasPost: async veri => { window.defterGonderileri.push(veri); return { ok: true }; },
    });
  }, { defter: model, durum });
}

test('İhtida Defteri ilk açılışa kadar ağ istemez; bekleyen ve tamamlanan kayıtları ayırır', async ({ page, isMobile }, info) => {
  await moduluKur(page);
  await expect(page.locator('#ihtida-defteri')).toBeVisible();
  expect(await page.evaluate(() => window.defterIstekleri)).toEqual([]);

  await page.locator('#ihtida-defteri summary').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.defterIstekleri.length)).toBe(1);
  await expect(page.locator('#ihtida-defteri')).toContainText('Bekleyen başvurular');
  await expect(page.locator('[data-defter-kayit="IH-2099-0001"]')).toContainText('Bekliyor');
  await expect(page.locator('[data-defter-kayit="IH-2099-0001"]')).not.toContainText('Defter no:');
  await expect(page.locator('[data-defter-kayit="IH-2099-0002"]')).toContainText('Defter no: 12');
  await expect(page.locator('[data-defter-kayit="IH-2099-0002"]')).toContainText('08.09.2026');
  await expect(page.locator('#ihtida-defteri')).toContainText('DHYS’nin yerine geçmez');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (isMobile) await page.locator('#ihtida-defteri').screenshot({ path: info.outputPath('ihtida-defteri-mobil.png') });
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => /defter/i.test(k)))).toEqual([]);
});

test('Merasim, Müşavirlik ve teslim durumları gereken gerçek tarih olmadan kaydedilmez', async ({ page }) => {
  await moduluKur(page);
  await page.locator('#ihtida-defteri summary').click();
  await page.locator('[data-defter-duzen="IH-2099-0001"]').click();
  const dialog = page.getByRole('dialog', { name: 'İhtida Defteri kaydı' });
  await expect(dialog.locator('#defter-durum option[value="musavirlikte"]')).toHaveJSProperty('disabled', true);
  await expect(dialog).toContainText('Önce merasim tarihini girip doğrulamayı kaydedin');
  await dialog.locator('#defter-durum').selectOption('tamamlandi');
  await dialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(dialog).toContainText('tarih ve doğrulama kutusu gereklidir');
  expect(await page.evaluate(() => window.defterGonderileri)).toEqual([]);

  await dialog.locator('#defter-ihtida-tarihi').fill('2026-09-09');
  await dialog.locator('input[name="merasimOnayi"]').check();
  await dialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.defterGonderileri.length)).toBe(1);
  expect(await page.evaluate(() => window.defterGonderileri[0])).toMatchObject({
    tur: 'ihtida-defteri-guncelle', ref: 'IH-2099-0001', durum: 'tamamlandi', merasimDogrulandi: true, ihtidaTarihi: '2026-09-09',
  });

  await page.locator('[data-defter-duzen="IH-2099-0002"]').click();
  const ikinci = page.getByRole('dialog', { name: 'İhtida Defteri kaydı' });
  await ikinci.locator('#defter-durum').selectOption('musavirlikte');
  await ikinci.getByRole('button', { name: 'Kaydet' }).click();
  await expect(ikinci).toContainText('gerçek gönderim tarihi gereklidir');
  await ikinci.locator('#defter-gonderim').fill('2026-09-10');
  await ikinci.locator('#defter-durum').selectOption('teslim-edildi');
  await ikinci.getByRole('button', { name: 'Kaydet' }).click();
  await expect(ikinci).toContainText('teslim tarihi gereklidir');
});

test('Dosyalar güncellenirken indirmenin kapalı kaldığını ve Yenile ile geri açıldığını bildirir', async ({ page }) => {
  await moduluKur(page, 'guncelleniyor');
  await page.locator('#ihtida-defteri summary').click();
  await expect(page.getByRole('button', { name: 'Word indir' })).toBeDisabled();
  await expect(page.locator('[data-defter-durum]')).toContainText('PDF ve Word dosyaları güncelleniyor');
  await page.evaluate(() => { window.defterDurum = ''; });
  await page.getByRole('button', { name: /Yenile/ }).click();
  await expect(page.getByRole('button', { name: 'Word indir' })).toBeEnabled();
});

test('Word ve PDF yalnız açılmış defterden indirilir; sade hata geri bildirimi korunur', async ({ page }) => {
  await moduluKur(page);
  const word = page.getByRole('button', { name: 'Word indir', includeHidden: true });
  await expect(word).toBeDisabled();
  await page.locator('#ihtida-defteri summary').click();
  await expect(word).toBeEnabled();
  await word.focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'PDF indir' }).click();
  await expect.poll(() => page.evaluate(() => window.defterIstekleri.filter(i => i.islem === 'ihtida-defteri-dosya').length)).toBe(2);
  expect(await page.evaluate(() => window.defterIstekleri.filter(i => i.islem === 'ihtida-defteri-dosya').map(i => i.parametreler.format))).toEqual(['docx', 'pdf']);
});

