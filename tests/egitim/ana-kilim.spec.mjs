/**
 * İlim Yolu ana sayfasındaki küçük «Kilimin» (girişli görünüm, 2 Kasım 2026). Hata: tıklama hedefi (`.kl-hedef`) ve koyu tema çizgi kuralları yalnız Kilimim
 * sayfasının CSS'indeydi; ana sayfada hedef dikdörtgenleri varsayılan SİYAH dolguyla çıktı ve hücreler siyah blok göründü. Bu test, ana sayfadaki kilimin
 * Kilimim sayfasındakiyle aynı boyayı aldığını iki temada denetler: hedef şeffaf, tarama deseni çizgi (dolgu yok), doku sınıfları dolgusuz/siyahsız.
 */
import { test, expect } from '@playwright/test';

const KOK = 'http://127.0.0.1:4402';
const OZET = 'a'.repeat(32);

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.addInitScript(([ozet]) => {
    const simdi = Date.now();
    const gun = (n) => new Date(simdi - n * 864e5).toISOString().slice(0, 10);
    const ids = ['s-fatiha', 's-ihlas', 's-felak', 's-nas', 'd-subhaneke', 'd-salli', 'd-ettehiyyatu'];
    const maddeler = Object.fromEntries(ids.map((id, i) => [id, { kip: 'zincir', seviye: i % 5, seri: 0, boy: 5, grup: 0, sondan: false, dinleyici: false, kutu: i % 4, sonraki: gun(-3), son: simdi - i * 36e5 }]));
    localStorage.setItem('ilimYolu:oturum', ozet);
    localStorage.setItem(`ulucamii:ezber:cihaz:v1:u:${ozet}`, JSON.stringify({ v: 1, ar: 1, gunler: [gun(0)], maddeler }));
  }, [OZET]);
});

for (const tema of ['light', 'dark']) {
  test(`ana sayfa kilimi (${tema}): tıklama hedefleri şeffaf, tarama desenleri çizgi, hiçbir hücre siyah dolgulu değil`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
    await page.goto('/tr/');
    // Firebase saklı oturumu bulamayınca işareti siler; görünümü sınama için geri aç.
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.documentElement.setAttribute('data-oturum', '1'));
    const kilim = page.locator('[data-kilim-kutu] svg.ezber-kilim.kl-kendi');
    await expect(kilim).toBeVisible();
    const sonuc = await kilim.evaluate((s) => {
      const siyah = (v) => v === 'rgb(0, 0, 0)';
      const oge = (e) => getComputedStyle(e);
      const hedefler = [...s.querySelectorAll('.kl-hedef')].map((e) => oge(e).fill);
      const desenler = [...s.querySelectorAll('pattern path')].map((e) => ({ fill: oge(e).fill, stroke: oge(e).stroke }));
      const dokular = [...s.querySelectorAll('g.kl-oge use')].map((u) => ({ c: u.getAttribute('class'), fill: oge(u).fill, stroke: oge(u).stroke }));
      return {
        hedefSayisi: hedefler.length,
        siyahHedef: hedefler.filter(siyah).length,
        hedefler: [...new Set(hedefler)],
        desenler,
        siyahDoku: dokular.filter((d) => siyah(d.fill)).length,
        dokuSayisi: dokular.length,
        k3Cizgi: dokular.filter((d) => /kl-k[23]/.test(d.c)).every((d) => d.stroke !== 'none'),
      };
    });
    expect(sonuc.hedefSayisi).toBeGreaterThan(50);
    expect(sonuc.siyahHedef).toBe(0);
    expect(sonuc.hedefler).toEqual(['rgba(0, 0, 0, 0)']);
    expect(sonuc.desenler.length).toBe(2);
    for (const d of sonuc.desenler) {
      expect(d.fill).toBe('none');
      expect(d.stroke).not.toBe('none');
      expect(d.stroke).not.toBe('rgb(0, 0, 0)');
    }
    expect(sonuc.siyahDoku).toBe(0);
    expect(sonuc.k3Cizgi).toBe(true);
  });
}

/**
 * Giriş yapmış ana sayfa — bilgi yolları (11 Kasım 2026): «Bugün»de en son çalışılan kart yolunun sıradaki kartı, «Kaldığınız yer» ve «Yolunuz» en yeni
 * çalışmaya (Ezber ya da kart yolu) gider, başlanmış yolların kartı ilerlemeyi gösterir, rozet sayısı rozetler sayfasına bağlanır. Yeni Müslüman yolunun
 * cihaz kaydı (ilim:y12:v1) sayfaya hiçbir iz bırakmaz ve değişmez. Veri yalnız cihazdan gelir; 360 px, iki tema.
 */
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

// Yol sırası (src/lib/ilim-yolu/yollar.ts yolKartlari: ilk işlenme günü, sonra kimlik); ilerleme dizesi ise kimlik numarasına göre dizilir (ib-001 → 0. karakter).
const kartIdleri = (kod) => JSON.parse(readFileSync(`src/data/ilim-yolu/kartlar/${kod}.json`, 'utf8')).kartlar
  .sort((x, y) => (x.ilkDers < y.ilkDers ? -1 : x.ilkDers > y.ilkDers ? 1 : 0) || (x.id < y.id ? -1 : 1)).map((k) => k.id);
const IBADET = kartIdleri('ibadet');
const AHLAK = kartIdleri('ahlak');
const ilkN = (n) => new Set(Array.from({ length: n }, (_, i) => `ib-${String(i + 1).padStart(3, '0')}`));
const siradaki = (n) => IBADET.find((id) => !ilkN(n).has(id));
const Y12 = JSON.stringify({ v: 1, ham: 'ayrilmis-deneme' });

/** `ezberMs`: Ezber'deki en son çalışmanın zamanı; `isaretMs`: son kart işaretinin zamanı. */
async function tohumla(context, { ibadetSayisi, ezberMs, isaretMs, ahlakTamam = false }) {
  await context.addInitScript(([ozet, ib, ah, ezber, isaret, ahlakHepsi, y12]) => {
    const maddeler = { 's-fatiha': { kip: 'zincir', seviye: 1, seri: 0, boy: 5, grup: 0, sondan: false, dinleyici: false, kutu: 1, sonraki: '2099-01-01', son: ezber } };
    localStorage.setItem('ilimYolu:oturum', ozet);
    localStorage.setItem(`ulucamii:ezber:cihaz:v1:u:${ozet}`, JSON.stringify({ v: 1, ar: 1, gunler: [], maddeler }));
    const kartlar = { ibadet: '1'.repeat(ib) };
    if (ahlakHepsi) kartlar.ahlak = '1'.repeat(ah);
    localStorage.setItem(`ulucamii:bilgi:cihaz:v1:u:${ozet}`, JSON.stringify({ v: 1, maddeler: kartlar }));
    if (isaret) localStorage.setItem(`ulucamii:bilgi:son:v1:u:${ozet}`, JSON.stringify({ id: `ib-${String(ib).padStart(3, '0')}`, ms: isaret }));
    localStorage.setItem('ilim:y12:v1', y12);
  }, [OZET, ibadetSayisi, AHLAK.length, ezberMs, isaretMs, ahlakTamam, Y12]);
}
async function ac(page, tema) {
  await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/tr/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.documentElement.setAttribute('data-oturum', '1'));
}

for (const tema of ['light', 'dark']) {
  test(`ana sayfa bilgi yolları (${tema}): kart en yeniyse Bugün, Kaldığınız yer ve Yolunuz o yola gider; kart yolu kartı ilerlemeyi söyler`, async ({ page, context }) => {
    await tohumla(context, { ibadetSayisi: 2, ezberMs: 1000, isaretMs: Date.now() });
    await ac(page, tema);
    const sonraki = siradaki(2);
    await expect(page.locator('[data-bugun-kart-liste]')).toBeVisible();
    await expect(page.locator('[data-bugun-kart-baglanti]')).toHaveAttribute('href', `/tr/ogren/${sonraki}/`);
    await expect(page.locator('[data-bugun-kart-alt]')).toContainText('sıradaki kart');
    await expect(page.locator('[data-yolun-baglanti]')).toHaveAttribute('href', '/tr/yollar/plan-ibadet/');
    await expect(page.locator('[data-yolun-ad]')).toHaveText('İbadet');
    await expect(page.locator('[data-kaldigin-baglanti]')).toHaveAttribute('href', `/tr/ogren/${sonraki}/`);
    const kart = page.locator('[data-bilgi-yol="plan-ibadet"]');
    await expect(kart).toBeVisible();
    await expect(kart.locator('[data-bilgi-durum]')).toContainText(`2 / ${IBADET.length} öğrenildi`);
    await expect(kart.locator('[data-bilgi-baglanti]')).toHaveAttribute('href', `/tr/ogren/${sonraki}/`);
    expect(await kart.locator('[data-serit]').getAttribute('width')).toBe(`${Math.round((100 * 2) / IBADET.length)}%`);
    for (const diger of ['plan-kuran', 'plan-itikat', 'plan-siyer', 'plan-ahlak']) await expect(page.locator(`[data-bilgi-yol="${diger}"]`)).toBeHidden();
    await expect(page.locator('[data-rozet-satiri]')).toBeHidden();
    // Yeni Müslüman yolu: sayfada ilerleme izi yok, cihaz kaydı dokunulmamış
    expect(await page.locator('.iy-yol.yeni .durum').count()).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('ilim:y12:v1'))).toBe(Y12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const ihlal = (await new AxeBuilder({ page }).include('[data-ana-girisli]').withTags(['wcag2a', 'wcag2aa']).analyze()).violations;
    expect(ihlal.map((v) => v.id)).toEqual([]);
  });
}

test('ana sayfa: Ezber daha yeniyse Yolunuz Ezber\'e gider, ama Bugün yine sıradaki kartı gösterir', async ({ page, context }) => {
  await tohumla(context, { ibadetSayisi: 1, ezberMs: Date.now() + 5000, isaretMs: 1000 });
  await ac(page, 'light');
  await expect(page.locator('[data-yolun-baglanti]')).toHaveAttribute('href', '/tr/ezber/');
  await expect(page.locator('[data-bugun-kart-baglanti]')).toHaveAttribute('href', `/tr/ogren/${siradaki(1)}/`);
});

test('ana sayfa: tamamlanan yolun rozeti sayılır ve rozetler sayfasına bağlanır; tamam yolun kartı yola bakın der', async ({ page, context }) => {
  await tohumla(context, { ibadetSayisi: 1, ezberMs: 1000, isaretMs: Date.now(), ahlakTamam: true });
  await ac(page, 'light');
  await expect(page.locator('[data-rozet-satiri]')).toBeVisible();
  await expect(page.locator('[data-rozet-sayisi]')).toContainText('Kazandığınız rozet: ');
  await expect(page.locator('[data-rozet-satiri] a')).toHaveAttribute('href', '/tr/yollar/rozetler/');
  const ahlak = page.locator('[data-bilgi-yol="plan-ahlak"]');
  await expect(ahlak).toBeVisible();
  await expect(ahlak.locator('[data-bilgi-durum]')).toHaveText('Rozet kazanıldı');
  await expect(ahlak.locator('[data-bilgi-baglanti]')).toHaveAttribute('href', '/tr/yollar/plan-ahlak/');
});

test('ana sayfa: kart ilerlemesi yokken bilgi bölümleri görünmez, Yolunuz Ezber kalır', async ({ page }) => {
  await ac(page, 'light');
  await expect(page.locator('[data-bugun-kart-liste]')).toBeHidden();
  await expect(page.locator('[data-rozet-satiri]')).toBeHidden();
  await expect(page.locator('[data-yolun-baglanti]')).toHaveAttribute('href', '/tr/ezber/');
});
