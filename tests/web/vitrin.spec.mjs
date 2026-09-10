import { test, expect } from '@playwright/test';
import { vitrinSec } from '../../src/lib/vitrin-secimi.ts';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
});

for (const lang of ['tr', 'fr', 'en']) {
  test(`${lang}: vitrin yayınları, semantik ARIA, inert ve bağlantı bütünlüğü`, async ({ page }) => {
    await page.goto(`/${lang}/`);

    const root = page.locator('.gv-kapsayici');
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute('aria-label');
    await expect(root).toHaveAttribute('role', 'region');
    await expect(root).toHaveAttribute('aria-roledescription', 'carousel');

    const viewport = page.locator('#gv-main-embla');
    await expect(viewport).toBeVisible();
    await expect(viewport).not.toHaveAttribute('aria-roledescription');

    const slides = viewport.locator('.gv-sahne__slide');
    const count = await slides.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Embla 8.6.0: aktif kare açık, inaktif kareler hidden değil inert + aria-hidden
    const slide0 = slides.first();
    await expect(slide0).toHaveAttribute('aria-hidden', 'false');
    await expect(slide0).not.toHaveAttribute('inert');

    for (let i = 1; i < count; i++) {
      const slide = slides.nth(i);
      await expect(slide).toHaveAttribute('aria-hidden', 'true');
      await expect(slide).toHaveAttribute('inert');
    }

    // Afiş görseli tam oran (object-fit: contain)
    const afisler = root.locator('img.gv-afis');
    for (const img of await afisler.all()) {
      expect(await img.evaluate(el => getComputedStyle(el).objectFit)).toBe('contain');
    }

    // İlk afiş görseli öncelikli yükleme (fetchpriority="high", loading="eager")
    const firstImg = slide0.locator('img.gv-afis');
    if (await firstImg.count() > 0) {
      await expect(firstImg).toHaveAttribute('fetchpriority', 'high');
      await expect(firstImg).toHaveAttribute('loading', 'eager');
    }

    // Tüm duyuru/afiş bağlantıları (href) geçerli ve sağlam
    const links = root.locator('.gv-detay-btn');
    for (const link of await links.all()) {
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toContain('undefined');
      expect(href).not.toContain('null');
      expect(href).not.toBe('#');
      expect(href).toMatch(/^(\/|https?:\/\/)/);
    }

    // Küçük önizlemeler (thumbs)
    if (count > 1) {
      const thumbs = page.locator('.gv-thumb');
      await expect(thumbs).toHaveCount(count);
      // Aktif thumb aria-current="true", aria-selected YOK
      await expect(thumbs.first()).toHaveAttribute('aria-current', 'true');
      await expect(thumbs.first()).not.toHaveAttribute('aria-selected');
      for (let i = 1; i < count; i++) {
        // Pasifte aria-current ve aria-selected YOK
        await expect(thumbs.nth(i)).not.toHaveAttribute('aria-current');
        await expect(thumbs.nth(i)).not.toHaveAttribute('aria-selected');
      }
    }

    // Canlı bölge (live region)
    await expect(page.locator('#gv-aria-live')).toHaveAttribute('aria-live', 'polite');
  });
}

test('Vitrin tarihi, gizleme, öncelik ve aynı afişin tekrarını süzer', () => {
  const now = new Date('2026-09-10T12:00:00+02:00');
  const make = (id, extra = {}) => ({
    id, baslik: id, ozet: '', gorsel: `/${id}.webp`, href: `/${id}`,
    tarih: new Date('2026-09-09'), tur: 'afis', dil: 'tr', ...extra,
  });
  const result = vitrinSec([
    make('eski', { tarih: new Date('2025-01-01') }),
    make('yarin', { tarih: new Date('2026-09-11') }),
    make('gizli', { vitrin: 'gizle' }),
    make('bitmis', { vitrin: 'goster', vitrinSon: new Date('2026-09-09') }),
    make('bugun', { vitrinSon: new Date('2026-09-10') }),
    make('oncelik', { oneCikan: true }),
    make('tekrar', { gorsel: '/oncelik.webp' }),
    make('sabit', { tarih: new Date('2025-01-01'), vitrin: 'goster' }),
  ], now);
  expect(result.map(x => x.id)).toEqual(['oncelik', 'sabit', 'bugun']);
  expect(vitrinSec([make('son', { vitrinSon: new Date('2026-09-10') })], new Date('2026-09-10T22:00:00Z'))).toHaveLength(0);
});

test('Vitrin afiş ve duyuru kotaları, adet sınırları ve ortak kapak mantığı', () => {
  const now = new Date('2026-09-10T12:00:00+02:00');
  const make = (id, extra = {}) => ({
    id, baslik: id, ozet: '', gorsel: `/${id}.webp`, href: `/${id}`,
    tarih: new Date('2026-09-09'), tur: 'duyuru', dil: 'tr', ...extra,
  });

  const adaylar = [
    make('afis1', { tur: 'afis' }),
    make('afis2', { tur: 'afis' }),
    make('d1', { oneCikan: true }),
    make('d2', { oneCikan: true }),
    make('d3', { oneCikan: true }),
    make('d4', { oneCikan: true }),
    make('d5', { oneCikan: true }),
    make('d6', { oneCikan: true }),
    make('d7', { oneCikan: true }),
    make('d8', { oneCikan: true }),
  ];

  const secim = vitrinSec(adaylar, now);
  expect(secim.map(x => x.id)).toEqual(['d1', 'd2', 'd3', 'd4', 'd5', 'afis1']);

  const ortak = [
    make('d1', { oneCikan: true, gorsel: '/ortak.webp' }),
    make('d2', { oneCikan: true, gorsel: '/ortak.webp' }),
    make('a1', { tur: 'afis' }),
  ];
  expect(vitrinSec(ortak, now, 2).map(x => x.id)).toEqual(['d1', 'a1']);

  expect(vitrinSec(adaylar, now, 0)).toHaveLength(0);
  expect(vitrinSec(adaylar, now, 1).map(x => x.id)).toEqual(['d1']);
  expect(vitrinSec(adaylar, now, 2).map(x => x.id)).toEqual(['d1', 'afis1']);
});

test('Klavye ve film şeridi ile slayt seçimi, inert ve live region senkronizasyonu', async ({ page }) => {
  await page.goto('/tr/');
  const thumbs = page.locator('.gv-thumb');
  if (await thumbs.count() > 1) {
    const thumb1 = page.locator('.gv-thumb[data-index="1"]');
    await thumb1.focus();
    await thumb1.press('Enter');

    const slide1 = page.locator('.gv-sahne__slide[data-index="1"]');
    const slide0 = page.locator('.gv-sahne__slide[data-index="0"]');

    await expect(slide1).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).not.toHaveAttribute('inert');
    await expect(slide0).toHaveAttribute('aria-hidden', 'true');
    await expect(slide0).toHaveAttribute('inert');

    // Aktif thumb aria-current="true", aria-selected YOK
    await expect(thumb1).toHaveAttribute('aria-current', 'true');
    await expect(thumb1).not.toHaveAttribute('aria-selected');
    // Pasif thumb aria-current ve aria-selected YOK
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-current');
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-selected');

    // Live region aktif başlığı duyurur
    const liveText = await page.locator('#gv-aria-live').textContent();
    expect(liveText).toMatch(/2\s*\/\s*\d+/);
  }
});

test('Native dialog afiş modalı açılır, afiş URL eşleşir, Esc kapatır ve odak döner; açıkken autoplay ilerlemez', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');

  const activeBtn = page.locator('.gv-sahne__slide[data-index="0"] .gv-afis-btn');
  if (await activeBtn.count() > 0) {
    const expectedUrl = await activeBtn.getAttribute('data-afis-url');
    expect(expectedUrl).toBeTruthy();

    await activeBtn.focus();
    await activeBtn.click();

    const dialog = page.locator('#gv-dialog');
    await expect(dialog).toHaveAttribute('open');

    const dialogImg = page.locator('#gv-dialog-img');
    await expect(dialogImg).toHaveAttribute('src', expectedUrl);

    // Dialog açıkken autoplay süresi geçse bile ilerlemez
    await page.clock.runFor(15000);
    await expect(page.locator('.gv-sahne__slide[data-index="0"]')).toHaveAttribute('aria-hidden', 'false');

    // Esc tuşu ile kapatma ve odak kontrolü
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
    await expect(activeBtn).toBeFocused();

    // Kapat butonu ile kapatma doğrulama
    await activeBtn.click();
    await expect(dialog).toHaveAttribute('open');
    await page.locator('.gv-kapat-btn').click();
    await expect(dialog).not.toHaveAttribute('open');
    await expect(activeBtn).toBeFocused();
  }
});

test('Gerçek autoadvance: page.clock ile 10s periyot timer ilerletildiğinde aktif slayt değişir', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');

  // Odak veya hover olmaması için imleci kenara al ve odakları temizle
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  const slide0 = page.locator('.gv-sahne__slide[data-index="0"]');
  const slide1 = page.locator('.gv-sahne__slide[data-index="1"]');

  if (await slide1.count() > 0) {
    await expect(slide0).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).toHaveAttribute('aria-hidden', 'true');

    // 3000ms ilerletildiğinde aktif thumb --gv-progress değeri 0 ile 1 arasında artar
    await page.clock.runFor(3000);
    const thumb0 = page.locator('.gv-thumb[data-index="0"]');
    const progressVal = await thumb0.evaluate(el => parseFloat(el.style.getPropertyValue('--gv-progress') || getComputedStyle(el).getPropertyValue('--gv-progress') || '0'));
    expect(progressVal).toBeGreaterThan(0);
    expect(progressVal).toBeLessThan(1);

    // Kalan süre (7500ms) ilerletilerek 10s periyot tamamlanır (toplam 10.500ms) ve sonraki slayta geçer
    await page.clock.runFor(7500);

    await expect(slide1).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).not.toHaveAttribute('inert');
    await expect(slide0).toHaveAttribute('aria-hidden', 'true');
    await expect(slide0).toHaveAttribute('inert');
    await expect(page.locator('.gv-thumb[data-index="1"]')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.gv-thumb[data-index="1"]')).not.toHaveAttribute('aria-selected');
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-current');
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-selected');

    // Önceki slayt thumb progress değeri sıfırlanır
    const thumb0Reset = await thumb0.evaluate(el => parseFloat(el.style.getPropertyValue('--gv-progress') || getComputedStyle(el).getPropertyValue('--gv-progress') || '0'));
    expect(thumb0Reset).toBe(0);
  }
});

test('Play/pause butonu svg ikonları ve dinamik label durumlarını senkron yönetir; aria-pressed bulunmaz', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');

  const btn = page.locator('#gv-play-pause');
  if (await btn.count() > 0) {
    const durdurLabel = await btn.getAttribute('data-durdur');
    const oynatLabel = await btn.getAttribute('data-oynat');

    // Başlangıçta oynuyor: aria-pressed YOK, dinamik label durdur, pause ikonu görünür
    await expect(btn).not.toHaveAttribute('aria-pressed');
    await expect(btn).toHaveAttribute('aria-label', durdurLabel);
    await expect(btn.locator('.gv-icon-pause')).toBeVisible();
    await expect(btn.locator('.gv-icon-play')).toBeHidden();

    // Tıklandığında durur: hover tetiklenmeden doğrudan tetiklemek için evaluate(el => el.click())
    await btn.evaluate(el => el.click());
    await expect(btn).not.toHaveAttribute('aria-pressed');
    await expect(btn).toHaveAttribute('aria-label', oynatLabel);
    await expect(btn.locator('.gv-icon-pause')).toBeHidden();
    await expect(btn.locator('.gv-icon-play')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('uluCamiiHareket'))).toBe('durdu');

    // Tekrar tıklandığında başlar: aria-pressed YOK, dinamik label durdur, pause ikonu görünür
    await btn.click();
    await expect(btn).not.toHaveAttribute('aria-pressed');
    await expect(btn).toHaveAttribute('aria-label', durdurLabel);
    await expect(btn.locator('.gv-icon-pause')).toBeVisible();
    await expect(btn.locator('.gv-icon-play')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('uluCamiiHareket'))).toBe('acik');
  }
});

test('Klavye odağı girince duraklama: odak vitrine girince durur, odak kalksa da explicit oynata kadar devam etmez, oynat düğmesi odakta da oynatabilir', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');

  await page.mouse.move(0, 0);

  const slide0 = page.locator('.gv-sahne__slide[data-index="0"]');
  const slide1 = page.locator('.gv-sahne__slide[data-index="1"]');
  const playBtn = page.locator('#gv-play-pause');

  if (await slide1.count() > 0 && await playBtn.count() > 0) {
    const durdurLabel = await playBtn.getAttribute('data-durdur');
    const oynatLabel = await playBtn.getAttribute('data-oynat');

    // 1. Vitrin içine klavye odağı girer (örn. detay bağlantısı)
    const detayBtn = slide0.locator('.gv-detay-btn');
    await detayBtn.focus();

    // Klavye odağı girince autoplay durur: 10s periyot (15000ms) aşılsa bile ilerlemez
    await page.clock.runFor(15000);
    await expect(slide0).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).toHaveAttribute('aria-hidden', 'true');

    // 2. Odak vitrinden çıksa bile (blur), açıkça oynatana kadar devam etmez
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.clock.runFor(15000);
    await expect(slide0).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).toHaveAttribute('aria-hidden', 'true');

    // 3. Oynat düğmesi odakta da oynatabilir (play button odağı klavye duraklamasını tetiklemez)
    await playBtn.focus();
    await playBtn.press('Enter');
    await expect(playBtn).toHaveAttribute('aria-label', durdurLabel);
    await expect(playBtn).not.toHaveAttribute('aria-pressed');
    await expect(playBtn.locator('.gv-icon-pause')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('uluCamiiHareket'))).toBe('acik');

    // Açıkça oynatıldıktan sonra 10.500 ms içinde sonraki slayta geçer
    await page.clock.runFor(10500);
    await expect(slide1).toHaveAttribute('aria-hidden', 'false');
    await expect(slide0).toHaveAttribute('aria-hidden', 'true');
  }
});

test('Fare ile hover geçici duraklatır; fare ayrılınca autoplay devam eder', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');

  const slide0 = page.locator('.gv-sahne__slide[data-index="0"]');
  const slide1 = page.locator('.gv-sahne__slide[data-index="1"]');

  if (await slide1.count() > 0) {
    // Fare vitrin sahnesi üzerine getirilir (hover)
    const stage = page.locator('#gv-main-embla');
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    // Hover sırasında 10s periyot (15000ms) aşılsa bile duraklama korunur
    await page.clock.runFor(15000);
    await expect(slide0).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).toHaveAttribute('aria-hidden', 'true');

    // Fare vitrinden ayrıldığında (mouseleave) autoplay otomatik olarak devam eder
    await page.mouse.move(0, 0);
    await page.clock.runFor(10500);
    await expect(slide1).toHaveAttribute('aria-hidden', 'false');
    await expect(slide0).toHaveAttribute('aria-hidden', 'true');
  }
});

test('reduced-motion: başlangıçta autoplay durur ve buton durumu yansıtır', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tr/');
  const btn = page.locator('#gv-play-pause');
  if (await btn.count() > 0) {
    const oynatLabel = await btn.getAttribute('data-oynat');
    await expect(btn).not.toHaveAttribute('aria-pressed');
    await expect(btn).toHaveAttribute('aria-label', oynatLabel);
    await expect(btn.locator('.gv-icon-play')).toBeVisible();
    await expect(btn.locator('.gv-icon-pause')).toBeHidden();
  }
});

test('reduced-motion: kullanıcı play butonuna basınca açık seçimle çalışır', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tr/');
  const btn = page.locator('#gv-play-pause');
  if (await btn.count() > 0) {
    const oynatLabel = await btn.getAttribute('data-oynat');
    const durdurLabel = await btn.getAttribute('data-durdur');
    await expect(btn).not.toHaveAttribute('aria-pressed');
    await expect(btn).toHaveAttribute('aria-label', oynatLabel);

    // Test pause başlangıcında oynat eylemini hover etkisiz force click ile tetikle
    await btn.click({ force: true });
    await expect(btn).not.toHaveAttribute('aria-pressed');
    await expect(btn).toHaveAttribute('aria-label', durdurLabel);
    await expect(btn.locator('.gv-icon-pause')).toBeVisible();
    await expect(btn.locator('.gv-icon-play')).toBeHidden();

    const kayitli = await page.evaluate(() => localStorage.getItem('uluCamiiHareket'));
    expect(kayitli).toBe('acik');
  }
});

test('reduced-motion: dinamik reduce geçişi açık tercihi sıfırlayıp durdurur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');
  const btn = page.locator('#gv-play-pause');
  if (await btn.count() > 0) {
    await page.evaluate(() => {
      localStorage.setItem('uluCamiiHareket', 'acik');
      document.documentElement.dataset.hareket = 'acik';
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(btn).not.toHaveAttribute('aria-pressed');
    const oynatLabel = await btn.getAttribute('data-oynat');
    await expect(btn).toHaveAttribute('aria-label', oynatLabel);
    await expect(btn.locator('.gv-icon-play')).toBeVisible();
    await expect(btn.locator('.gv-icon-pause')).toBeHidden();

    const kayitli = await page.evaluate(() => localStorage.getItem('uluCamiiHareket'));
    expect(kayitli).toBeNull();
  }
});

test('localStorage engelli veya kapalıyken slider JS çökmeden çalışır', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage access denied', 'SecurityError'); },
    });
  });
  await page.goto('/tr/');
  await expect(page.locator('.gv-kapsayici')).toBeVisible();
  await expect(page.locator('.gv-sahne__slide').first()).toHaveAttribute('aria-hidden', 'false');
});

test('Vitrin afiş dışlamama: çok sayıda öncelikli duyuru olsa dahi afiş kotası korunur', () => {
  const now = new Date('2026-09-10T12:00:00+02:00');
  const make = (id, extra = {}) => ({
    id, baslik: id, ozet: '', gorsel: `/${id}.webp`, href: `/${id}`,
    tarih: new Date('2026-09-09'), tur: 'duyuru', dil: 'tr', ...extra,
  });

  const adaylar = [
    make('afis1', { tur: 'afis' }),
    make('afis2', { tur: 'afis' }),
    make('d1', { oneCikan: true }),
    make('d2', { oneCikan: true }),
    make('d3', { oneCikan: true }),
    make('d4', { oneCikan: true }),
    make('d5', { oneCikan: true }),
    make('d6', { oneCikan: true }),
  ];

  const secim = vitrinSec(adaylar, now, 6);
  const afisSayisi = secim.filter(x => x.tur === 'afis').length;
  expect(afisSayisi).toBeGreaterThanOrEqual(1);
  expect(secim.map(x => x.id)).toEqual(['d1', 'd2', 'd3', 'd4', 'd5', 'afis1']);
});

test('Vitrin ortak kapak: afiş daha yeni tarihli olsa dahi ortak kapaklı detaylı duyuru korunur', () => {
  const now = new Date('2026-09-10T12:00:00+02:00');
  const make = (id, extra = {}) => ({
    id, baslik: id, ozet: '', gorsel: `/${id}.webp`, href: `/${id}`,
    tarih: new Date('2026-09-08'), tur: 'duyuru', dil: 'tr', ...extra,
  });

  const adaylar = [
    make('afis_kurban', { tur: 'afis', gorsel: '/kurban-2026.webp', tarih: new Date('2026-09-10') }),
    make('duyuru_kurban', { tur: 'duyuru', gorsel: '/kurban-2026.webp', tarih: new Date('2026-09-08') }),
    make('baska_duyuru', { tur: 'duyuru', gorsel: '/baska.webp', tarih: new Date('2026-09-07') }),
  ];

  const secim = vitrinSec(adaylar, now, 6);
  const ids = secim.map(x => x.id);
  expect(ids).toContain('duyuru_kurban');
  expect(ids).not.toContain('afis_kurban');
});

test('Vitrin fallback görseli dedup anahtarına girmez ve haberleri dışlamaz', () => {
  const now = new Date('2026-09-10T12:00:00+02:00');
  const make = (id, extra = {}) => ({
    id, baslik: id, ozet: '', gorsel: '/media/vitrin/egitim-veli-portali.webp', href: `/${id}`,
    tarih: new Date('2026-09-08'), tur: 'duyuru', dil: 'tr', ...extra,
  });

  const adaylar = [
    make('kurs_kayit', { href: '/kurs-kayit' }),
    make('veli_toplanti', { href: '/veli-toplanti' }),
  ];

  const secim = vitrinSec(adaylar, now, 6);
  expect(secim.map(x => x.id)).toEqual(['kurs_kayit', 'veli_toplanti']);
});

test('Mobil dokunmatik kaydırma: gerçek pointer drag hareketi ile sonraki slayta geçer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tr/');

  const slides = page.locator('.gv-sahne__slide');
  if (await slides.count() > 1) {
    const slide0 = slides.nth(0);
    const slide1 = slides.nth(1);
    await expect(slide0).toHaveAttribute('aria-hidden', 'false');

    const viewport = page.locator('#gv-main-embla');
    const box = await viewport.boundingBox();
    expect(box).not.toBeNull();

    const startX = box.x + box.width * 0.8;
    const startY = box.y + box.height * 0.5;
    const endX = box.x + box.width * 0.2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 12 });
    await page.mouse.up();

    await expect(slide1).toHaveAttribute('aria-hidden', 'false');
    await expect(slide1).not.toHaveAttribute('inert');
    await expect(slide0).toHaveAttribute('aria-hidden', 'true');
    await expect(slide0).toHaveAttribute('inert');
    await expect(page.locator('.gv-thumb[data-index="1"]')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.gv-thumb[data-index="1"]')).not.toHaveAttribute('aria-selected');
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-current');
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-selected');
  }
});

test('JavaScript devre dışıyken ilk slayt ve asıl href okunabilir kalır', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: 'http://127.0.0.1:4401',
  });
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  const page = await context.newPage();
  await page.goto('/tr/');

  const slide0 = page.locator('.gv-sahne__slide[data-index="0"]');
  await expect(slide0).toHaveAttribute('aria-hidden', 'false');
  await expect(slide0).not.toHaveAttribute('inert');

  const baslik = slide0.locator('.gv-baslik');
  await expect(baslik).not.toBeEmpty();

  const detayBtn = slide0.locator('.gv-detay-btn');
  await expect(detayBtn).toBeVisible();
  const href = await detayBtn.getAttribute('href');
  expect(href).toBeTruthy();
  expect(href).not.toContain('undefined');
  expect(href).toMatch(/^(\/|https?:\/\/)/);

  await context.close();
});
