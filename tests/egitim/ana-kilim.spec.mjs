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
