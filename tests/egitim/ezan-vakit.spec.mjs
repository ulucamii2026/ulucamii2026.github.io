/**
 * Ezan vakit seçimi (25 Ekim 2026; katalog `ses.secenekler`): /<dil>/calis/d-ezan/ sayfasında beş vaktin Diyanet kaydı, erişilebilir
 * radyo grubu (Çini Panosu çipleri), seçimle kaynağın değişmesi, sabaha özgü kaynaklı not ve JavaScript'siz bağlantılar.
 * Ses ulucamii.be'den gelir; burada ağ kapalı ve play() taklit edilir (calisma.spec.mjs ile aynı düzen): yeni dört dosyanın
 * canlı sitede bulunmasına dayanılmaz, yalnız adresin biçimi ve CSP uyumu sınanır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const EZAN = katalog.ogeler.find((o) => o.id === 'd-ezan');
const SECENEKLER = EZAN.ses.secenekler;
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const ANA = 'https://ulucamii.be';
const SIRA = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'];
const ADRES = Object.fromEntries(SECENEKLER.map((s) => [s.id, `${ANA}${s.yol}`]));
// Sayfada görünen vakit notları (src/i18n/calisma.ts ile aynı olmalı; çeviri değişirse bilerek burada da değişir).
const NOT = {
  tr: { sabah: 'Bu kayıt sabah ezanıdır.', ogle: 'Bu kayıt öğle ezanıdır.', ikindi: 'Bu kayıt ikindi ezanıdır.', aksam: 'Bu kayıt akşam ezanıdır.', yatsi: 'Bu kayıt yatsı ezanıdır.' },
  fr: { sabah: 'l’appel à la prière de l’aube', ogle: 'l’appel à la prière de midi', ikindi: 'l’appel à la prière de l’après-midi', aksam: 'l’appel à la prière du coucher du soleil', yatsi: 'l’appel à la prière de la nuit' },
  en: { sabah: 'the dawn call to prayer', ogle: 'the noon call to prayer', ikindi: 'the afternoon call to prayer', aksam: 'the sunset call to prayer', yatsi: 'the night call to prayer' },
  nl: { sabah: 'het ochtendgebed', ogle: 'het middaggebed', ikindi: 'het namiddaggebed', aksam: 'het avondgebed', yatsi: 'het nachtgebed' },
  de: { sabah: 'zum Morgengebet', ogle: 'zum Mittagsgebet', ikindi: 'zum Nachmittagsgebet', aksam: 'zum Abendgebet', yatsi: 'zum Nachtgebet' },
};
const GRUP = { tr: 'Ezanın vakti', fr: 'Heure de prière de l’adhan', en: 'Prayer time of the adhan', nl: 'Gebedstijd van de adhan', de: 'Gebetszeit des Adhan' };
const KUNYE = { tr: 'Kaynak: Diyanet İlmihali I, s. 267.', fr: 'Source : Diyanet İlmihali I, p. 267.', en: 'Source: Diyanet İlmihali I, p. 267.', nl: 'Bron: Diyanet İlmihali I, p. 267.', de: 'Quelle: Diyanet İlmihali I, S. 267.' };

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__sesler = []; window.__kayitlar = []; window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
    HTMLMediaElement.prototype.play = function () { window.__ses = this; window.__kayitlar.push(this); window.__sesler.push({ src: this.src, hiz: this.playbackRate }); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () { this.__duraklatildi = true; };
  });
});

const bitir = (page) => page.evaluate(() => window.__ses.dispatchEvent(new Event('ended')));
const sesler = (page) => page.evaluate(() => window.__sesler.map((s) => s.src));
const radyo = (page, id) => page.locator(`input[name="vakit"][value="${id}"]`);
/** Görünen (gizli olmayan) tek vakit notu bloğunun kimliği. */
const gorunenNot = (page) => page.locator('[data-vakit-not]:not([hidden])').evaluateAll((b) => b.map((x) => x.dataset.vakitNot));

test('katalog: beş seçenek, sıra sabah·öğle·ikindi·akşam·yatsı; tam sabahtır', () => {
  expect(SECENEKLER.map((s) => s.id)).toEqual(SIRA);
  expect(EZAN.ses.tam).toBe('/media/ses/dualar/ezan.mp3');
  expect(SECENEKLER[0].yol).toBe(EZAN.ses.tam);
});

test('seçim yalnız Ezan sayfasında var; başka maddede (tek kayıtlı, parçalı, Kur’an) ne grup ne vakit notu', async ({ page }) => {
  for (const id of ['d-kamet', 'd-ezan-duasi', 'd-euzu-besmele', 's-fatiha', 'd-amentu']) {
    await page.goto(`/tr/calis/${id}/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-vakit], [data-vakit-secenek], [data-vakit-not], .vakit-baglantilar'), id).toHaveCount(0);
  }
  await page.goto('/tr/calis/d-ezan/');
  await expect(page.locator('[data-vakit]')).toHaveCount(1);
  await expect(page.locator('input[name="vakit"]')).toHaveCount(5);
});

for (const dil of DILLER) {
  test(`${dil}: grup adlı ve görünür; beş çip katalog etiketiyle; sabah işaretli; sabah notu ve kaynaklı cümle; seçince not değişir`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.goto(`/${dil}/calis/d-ezan/`);
    const grup = page.getByRole('group', { name: GRUP[dil] });
    await expect(grup).toBeVisible();
    const radyolar = grup.getByRole('radio');
    await expect(radyolar).toHaveCount(5);
    for (const s of SECENEKLER) {
      const r = grup.getByRole('radio', { name: s.ad[dil], exact: true });
      await expect(r).toHaveCount(1);
      await expect(r).toHaveAttribute('value', s.id);
    }
    expect(await radyolar.evaluateAll((r) => r.map((x) => x.value))).toEqual(SIRA);
    await expect(radyo(page, 'sabah')).toBeChecked();
    expect(await gorunenNot(page)).toEqual(['sabah']);
    // Sabah: vakit notu + yalnız sabaha özgü kaynaklı cümle ve künye.
    const bolum = page.locator('[data-vakit-not="sabah"]');
    await expect(bolum.locator('.vakit-notu')).toContainText(NOT[dil].sabah);
    await expect(bolum.locator('.vakit-ek')).toContainText('es-salâtü hayrün mine’n-nevm');
    await expect(bolum.locator('.vakit-ek')).toContainText('Hayye ale’l-felâh');
    await expect(bolum.locator('.vakit-kunye')).toHaveText(KUNYE[dil]);
    if (dil === 'tr') await expect(bolum.locator('.vakit-ek')).toHaveText('Sabah ezanında “Hayye ale’l-felâh” denildikten sonra iki defa “es-salâtü hayrün mine’n-nevm” (Namaz uykudan hayırlıdır) denilir.');
    // Başka vakit: kendi notu görünür, sabah cümlesi ve künyesi yok (başka dinî metin eklenmez).
    for (const id of SIRA.slice(1)) {
      await radyo(page, id).check();
      expect(await gorunenNot(page), id).toEqual([id]);
      const kutu = page.locator(`[data-vakit-not="${id}"]`);
      await expect(kutu.locator('.vakit-notu')).toContainText(NOT[dil][id]);
      await expect(kutu.locator('.vakit-ek, .vakit-kunye')).toHaveCount(0);
      await expect(page.locator('.vakit-ek:visible, .vakit-kunye:visible')).toHaveCount(0);
    }
    await radyo(page, 'sabah').check();
    await expect(page.locator('.vakit-ek:visible')).toHaveCount(1);
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test(`${dil}: iki temada erişilebilirlik (axe) ve yatay taşma yok`, async ({ page }) => {
    await page.goto(`/${dil}/calis/d-ezan/`);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const id of ['sabah', 'yatsi']) {
        await radyo(page, id).check();
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `${colorScheme} ${id}`).toEqual([]);
      }
    }
  });
}

test('seçim kaynağı değiştirir ve çalmayı durdurur; seçim tek başına ağ/ses başlatmaz; her vakit kendi adresinden çalar', async ({ page }) => {
  await page.goto('/tr/calis/d-ezan/');
  await page.locator('[data-sira]').selectOption('0');
  // Seçim değişikliği tek başına ses nesnesi açmaz (kullanıcı başlatmadan ses yok).
  await radyo(page, 'ogle').check();
  expect(await sesler(page)).toEqual([]);
  await radyo(page, 'sabah').check();
  await page.locator('[data-oynat]').click();
  expect(await sesler(page)).toEqual([ADRES.sabah]);
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  // Çalarken başka vakit: eski kayıt susar, çalar başa döner, yeni kayıt kullanıcı başlatana dek çalmaz.
  await radyo(page, 'ogle').check();
  expect(await page.evaluate(() => window.__kayitlar[0].__duraklatildi === true && window.__kayitlar[0].getAttribute('src') === null)).toBe(true);
  await expect(page.locator('[data-oynat]')).toHaveText('Dinlemeye başla');
  await expect(page.locator('[data-durdur]')).toBeDisabled();
  await expect(page.locator('.calisma-durum')).toContainText('Öğle · Uşşak');
  await expect(page.locator('.calisma-durum')).toContainText('Hazır');
  expect(await sesler(page)).toEqual([ADRES.sabah]);
  // Eski kaydın geç gelen «ended» olayı yeni seçimi başlatmaz.
  await page.evaluate(() => window.__kayitlar[0].dispatchEvent(new Event('ended')));
  expect(await sesler(page)).toEqual([ADRES.sabah]);
  await page.locator('[data-oynat]').click();
  expect(await sesler(page)).toEqual([ADRES.sabah, ADRES.ogle]);
  // Beş vaktin hepsi kendi adresiyle (sıra: ikindi, akşam, yatsı, sonra sabaha dönüş).
  for (const id of ['ikindi', 'aksam', 'yatsi', 'sabah']) {
    await radyo(page, id).check();
    await page.locator('[data-oynat]').click();
    expect((await sesler(page)).at(-1), id).toBe(ADRES[id]);
  }
  expect(await sesler(page)).toEqual(['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi', 'sabah'].map((id) => ADRES[id]));
  // Bölüm seçicisi tek kayıtlı kalır ve çalan adres seçili vakti izler.
  await expect(page.locator('[data-bolum] option')).toHaveCount(1);
  expect(await page.locator('[data-bolum] option').getAttribute('data-adres')).toBe(ADRES.sabah);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});

test('duraklatılmış ya da «senin sıran» beklemesindeki çalma vakit değişince tamamen sıfırlanır', async ({ page }) => {
  await page.clock.install();
  await page.goto('/tr/calis/d-ezan/');
  await page.locator('[data-oynat]').click();
  await page.evaluate(() => Object.defineProperty(window.__ses, 'duration', { value: 10, configurable: true }));
  await bitir(page);
  await expect(page.locator('.calisma-durum')).toContainText('Şimdi siz');
  await expect(page.locator('[data-calisma]')).toHaveAttribute('data-senin-siran', '');
  await radyo(page, 'aksam').check();
  await expect(page.locator('[data-calisma]')).not.toHaveAttribute('data-senin-siran');
  await expect(page.locator('[data-sira-ilerleme]')).not.toHaveAttribute('data-aktif');
  await page.clock.fastForward(20_000);
  expect(await sesler(page)).toEqual([ADRES.sabah]); // bekleme zamanlayıcısı iptal: yeni kayıt kendiliğinden başlamaz
  // Duraklatılmış çalma: «Devam et» yerine yeni seçim için «Dinlemeye başla».
  await page.locator('[data-oynat]').click();
  await page.locator('[data-oynat]').click();
  await expect(page.locator('[data-oynat]')).toHaveText('Devam et');
  await radyo(page, 'yatsi').check();
  await expect(page.locator('[data-oynat]')).toHaveText('Dinlemeye başla');
  await page.locator('[data-oynat]').click();
  expect((await sesler(page)).at(-1)).toBe(ADRES.yatsi);
});

test('tekrar, hız ve «senin sıran» ayarları vakit değişince korunur ve yeni kayıt için işler', async ({ page }) => {
  await page.goto('/tr/calis/d-ezan/');
  await page.locator('[data-hiz]').selectOption('0.75');
  await page.locator('[data-tekrar]').selectOption('3');
  await page.locator('[data-sira]').selectOption('0');
  await radyo(page, 'yatsi').check();
  await expect(page.locator('[data-hiz]')).toHaveValue('0.75');
  await expect(page.locator('[data-tekrar]')).toHaveValue('3');
  await expect(page.locator('[data-sira]')).toHaveValue('0');
  await page.locator('[data-oynat]').click();
  expect(await page.evaluate(() => window.__sesler[0].hiz)).toBe(0.75);
  await bitir(page); await bitir(page);
  expect(await sesler(page)).toEqual([ADRES.yatsi, ADRES.yatsi, ADRES.yatsi]); // 3 kez dinleme, hep yatsı kaydı
  await bitir(page);
  await expect(page.locator('.calisma-durum')).toContainText('tamamlandı');
  // Hız seçimi çalarken de anında uygulanır (yeni vakitte).
  await radyo(page, 'ikindi').check();
  await page.locator('[data-oynat]').click();
  await page.locator('[data-hiz]').selectOption('1');
  expect(await page.evaluate(() => window.__ses.playbackRate)).toBe(1);
  expect((await sesler(page)).at(-1)).toBe(ADRES.ikindi);
});

test('klavye: oklarla vakit seçilir, odak çipin yanında görünür; seçim çalmayı durdurur', async ({ page }, info) => {
  test.skip(info.project.name !== 'masaustu-chromium', 'klavye oklarıyla radyo gezinmesi masaüstü profilinde sınanır');
  await page.goto('/tr/calis/d-ezan/');
  await page.locator('[data-sira]').selectOption('0');
  await page.locator('[data-oynat]').click();
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  await radyo(page, 'sabah').focus();
  await page.keyboard.press('ArrowDown');
  await expect(radyo(page, 'ogle')).toBeChecked();
  await expect(radyo(page, 'ogle')).toBeFocused();
  await expect(page.locator('[data-oynat]')).toHaveText('Dinlemeye başla');
  expect(await gorunenNot(page)).toEqual(['ogle']);
  // Odak halkası görünür: çipin (kardeş span) dış çizgisi.
  const halka = await radyo(page, 'ogle').evaluate((r) => { const s = getComputedStyle(r.nextElementSibling); return { stil: s.outlineStyle, kalinlik: parseFloat(s.outlineWidth) }; });
  expect(halka.stil).toBe('solid');
  expect(halka.kalinlik).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(radyo(page, 'yatsi')).toBeChecked();
  await page.keyboard.press('ArrowDown'); // gruptan taşmaz, başa sarar
  await expect(radyo(page, 'sabah')).toBeChecked();
  await page.keyboard.press('ArrowUp');
  await expect(radyo(page, 'yatsi')).toBeChecked();
  // Sekme grubun tek durağıdır (işaretli radyo); ardından ayar kutularına geçilir.
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-bolum]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(radyo(page, 'yatsi')).toBeFocused();
  await page.locator('[data-oynat]').click();
  expect((await sesler(page)).at(-1)).toBe(ADRES.yatsi);
});

for (const dil of ['tr', 'fr', 'de']) {
  test(`${dil}: 320 px ekranda çipler taşmaz, her çipin hedefi ≥ 24 px, etiket kesilmez`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`/${dil}/calis/d-ezan/`);
    await expect(page.locator('[data-vakit]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const olcu = await page.locator('.vakit-secenek').evaluateAll((l) => l.map((x) => {
      const k = x.getBoundingClientRect(); const s = x.querySelector('span');
      return { sol: k.left, sag: k.right, yuk: k.height, tasma: s.scrollWidth > s.clientWidth + 1 };
    }));
    expect(olcu).toHaveLength(5);
    for (const o of olcu) {
      expect(o.sol).toBeGreaterThanOrEqual(0);
      expect(o.sag).toBeLessThanOrEqual(320);
      expect(o.yuk).toBeGreaterThanOrEqual(24);
      expect(o.tasma).toBe(false);
    }
  });
}

test('giriş listesi, hâfız sesi ve «Kendini sına» sabah kaydında kalır; çalışma kipi verisi vakit seçiminden etkilenmez', async ({ page }) => {
  await page.goto('/tr/');
  expect(await page.locator('#m-d-ezan button.dinle').getAttribute('data-ses')).toBe(ADRES.sabah);
  expect(await page.locator('#m-d-ezan').locator('[data-vakit], input[type="radio"]').count()).toBe(0);
  await page.goto('/tr/calis/d-ezan/');
  const veri = JSON.parse(await page.locator('[data-kip]').getAttribute('data-veri'));
  expect(veri.hafiz).toEqual([ADRES.sabah]);
  await radyo(page, 'yatsi').check();
  expect(JSON.parse(await page.locator('[data-kip]').getAttribute('data-veri')).hafiz).toEqual([ADRES.sabah]);
});

test('JavaScript kapalıyken grup gizli, çal düğmeleri kapalı; beş kayıt doğrudan bağlantıdır', async ({ browser }) => {
  const baglam = await browser.newContext({ baseURL: KOK, javaScriptEnabled: false });
  const sayfa = await baglam.newPage();
  try {
    for (const dil of DILLER) {
      await sayfa.goto(`/${dil}/calis/d-ezan/`);
      await expect(sayfa.locator('[data-vakit]'), dil).toBeHidden();
      await expect(sayfa.locator('[data-oynat]')).toBeDisabled();
      const baglar = sayfa.locator('.vakit-baglantilar a');
      await expect(baglar, dil).toHaveCount(5);
      expect(await baglar.evaluateAll((a) => a.map((x) => x.getAttribute('href'))), dil).toEqual(SIRA.map((id) => ADRES[id]));
      // Bağlantı adı madde adı + vakit etiketi; ekran okuyucu hangi kaydın hangisi olduğunu bilir.
      const adlar = await baglar.evaluateAll((a) => a.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
      SECENEKLER.forEach((s, i) => { expect(adlar[i], `${dil} ${s.id}`).toContain(s.ad[dil]); expect(adlar[i]).toContain(EZAN.ad[dil].slice(0, 5)); });
      // Varsayılan (sabah) not görünür, öbürleri gizli kalır.
      expect(await gorunenNot(sayfa)).toEqual(['sabah']);
    }
    // Tek kayıtlı maddede eski tek bağlantı korunur.
    await sayfa.goto('/tr/calis/d-kamet/');
    await expect(sayfa.locator('.vakit-baglantilar')).toHaveCount(0);
    await expect(sayfa.locator('[data-calisma] a[href$="kamet.mp3"]')).toHaveAttribute('href', `${ANA}/media/ses/dualar/kamet.mp3`);
  } finally {
    await baglam.close();
  }
});

test('CSP: beş kaydın adresi media-src içinde (ihlal yok); başka köken engellenir; sayfa konsolu temiz', async ({ page }, info) => {
  test.skip(info.project.name !== 'masaustu-chromium', 'başlıklar cihazdan bağımsız');
  const yanit = await page.goto('/tr/calis/d-ezan/');
  const csp = yanit.headers()['content-security-policy'];
  const mediaSrc = csp.split(';').map((x) => x.trim()).find((x) => x.startsWith('media-src'));
  expect(mediaSrc).toBe(`media-src ${ANA} blob:`);
  for (const adres of Object.values(ADRES)) expect(mediaSrc.split(' ')).toContain(new URL(adres).origin);
  const ihlal = await page.evaluate(async (adresler) => {
    const sonuc = {};
    for (const adres of adresler) {
      window.__csp = [];
      const a = new Audio();
      a.preload = 'auto';
      await new Promise((bitti) => { a.addEventListener('error', bitti, { once: true }); setTimeout(bitti, 3000); a.src = adres; a.load(); });
      await new Promise((r) => setTimeout(r, 120));
      sonuc[adres] = window.__csp.filter((x) => x.startsWith('media-src')).length;
    }
    return sonuc;
  }, [...Object.values(ADRES), 'https://example.com/ezan-ogle.mp3']);
  for (const adres of Object.values(ADRES)) expect(ihlal[adres], adres).toBe(0);
  expect(ihlal['https://example.com/ezan-ogle.mp3']).toBeGreaterThan(0);
});
