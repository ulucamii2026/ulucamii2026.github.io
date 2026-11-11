/** Eğitim rehberi ve menüsü (ana site) — ESKİ /e/ dinleme testleri 11 Kasım 2026 (Dilim 4 / P7) egitim taşımasıyla çıkarıldı: ilgili sayfalar yönlendirme sayfası oldu; ayrıntılı oynatıcı testleri git geçmişinde (egitim’de 4 test: tests/egitim/ecouter.spec.mjs). */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { EC_METIN, EC_TEKRAR_SAYISI, ecParcaAdi } from '../../src/lib/ecouter.ts';
import { yollar } from '../../src/i18n/ui.ts';
import { EGITIM } from '../../src/i18n/egitim.ts';
import { dersYolu, DINLEME } from '../../src/i18n/dinleme.ts';

const VERI = JSON.parse(readFileSync(new URL('../../src/data/ecouter.json', import.meta.url), 'utf8'));
const KODLAR = VERI.kodlar;
const FATIHA = KODLAR.fatiha;
const FATHA = KODLAR.fatha;
const YONLENDIRME = KODLAR.test;
const SESLI_KARELER = (FATHA.ogeler ?? []).filter((o) => o.ses);

/* ---------- ortak yardımcılar ---------- */

/** Çalar taklidi. `bitir` açıkken her klip kısa sürede `ended` verir (tekrar/zincir senaryoları). */
async function calarTaklidi(page, { bitir = false, sure = 0.05 } = {}) {
  await page.addInitScript(({ bitir, sure }) => {
    window.__calinan = [];
    window.__hiz = [];
    Object.defineProperty(HTMLMediaElement.prototype, 'duration', { get() { return sure; }, configurable: true });
    HTMLMediaElement.prototype.play = function play() {
      window.__calinan.push(this.src);
      window.__hiz.push(this.playbackRate);
      if (bitir) setTimeout(() => this.dispatchEvent(new Event('ended')), 15);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {};
  }, { bitir, sure });
}

const calinanlar = (page) => page.evaluate(() => window.__calinan.map((u) => new URL(u).pathname));

async function sayfayiAc(page, kod) {
  await page.goto(`/e/${kod}/`);
  await expect(page.locator('.ec-sayfa')).toBeVisible();
}

async function sonluAnimasyonlariBekle(page) {
  await page.evaluate(async () => {
    const liste = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(liste.map((a) => a.finished.catch(() => {})));
  });
}

async function ciddiAxe(page, kapsamlar) {
  let olcum = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  for (const kapsam of kapsamlar) olcum = olcum.include(kapsam);
  const sonuc = await olcum.analyze();
  return sonuc.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
    .map((v) => ({ id: v.id, hedefler: v.nodes.map((n) => n.target) }));
}

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

test('Beş dilin eğitim menüsü herkese açık ders dizinine bağlanır', async ({ page }) => {
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    await page.goto(`/${dil}/`);
    const href = `/${dil}/${yollar.muhtediEgitimi[dil]}/`;
    await expect(page.locator(`header a[href="${href}"]`).first()).toHaveAttribute('href', href);
    await page.goto(href);
    await expect(page.locator('main h1')).toHaveText(EGITIM[dil].baslik);
    await expect(page.locator('[data-ec-cours] a')).toHaveCount(73);
    await expect(page.locator('.eg-ders')).toHaveCount(8);
    await expect(page.locator('.eg-ders-icerik .eg-uygulama')).toHaveCount(8);
    expect(await page.locator('#kaynak-kitaplar .ec-cours a').count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('.eg-soru')).toHaveCount(4);
    await expect(page.locator('[data-ec-cours] a').first()).toHaveAttribute('lang', dil);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ulucamii.be${href}`);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(6);
    await page.getByLabel(EGITIM[dil].ara).fill('fatha');
    await expect(page.locator(`[data-ec-cours] a[href="${dersYolu(dil, 'fatha')}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('Eğitim çalışma işaretleri cihazda saklanır, diller arasında korunur ve yalnız kendi kaydı silinir', async ({ page }) => {
  await page.goto('/tr/muhtedi-egitimi/');
  const first = page.locator('[data-eg-tamam]').first();
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await expect(page.locator('[data-eg-sayac]')).toContainText('1 / 8');
  await page.reload();
  await expect(first).toBeChecked();
  await page.goto('/fr/formation-nouveaux-musulmans/');
  await expect(first).toBeChecked();
  await page.evaluate(() => localStorage.setItem('unrelated-test', 'keep'));
  await page.locator('[data-eg-sifirla]').click();
  await expect(first).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('unrelated-test'))).toBe('keep');
  await page.reload();
  await expect(page.locator('[data-eg-sayac]')).toContainText('0 / 8');
  const second = page.locator('.eg-ders summary').nth(1);
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.eg-ders').nth(1)).toHaveAttribute('open', '');
  expect(await ciddiAxe(page, ['.ec-catalogue'])).toEqual([]);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  expect(await ciddiAxe(page, ['.ec-catalogue'])).toEqual([]);
});

test('Eğitim kaydı engellendiğinde dersler ve geçici takip çalışır', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
    Storage.prototype.removeItem = () => { throw new Error('blocked'); };
  });
  await page.goto('/tr/muhtedi-egitimi/');
  await page.locator('[data-eg-tamam]').first().check();
  await expect(page.locator('[data-eg-sayac]')).toContainText('1 / 8');
  await expect(page.locator('[data-eg-kayit]')).toContainText('kayda izin vermiyor');
  await page.locator('[data-eg-sifirla]').click();
  await expect(page.locator('[data-eg-sayac]')).toContainText('0 / 8');
  await page.getByLabel('Ders ara').fill('fatha');
  await expect(page.locator('[data-ec-cours] a[href="/tr/audio/fatha/"]')).toBeVisible();
});

test('Eğitim rehberi JavaScript olmadan açılır ve bütün içerik erişilebilir kalır', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route('**/*', (r) => r.request().url().startsWith('http://127.0.0.1:4401/') ? r.continue() : r.abort());
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4401/tr/muhtedi-egitimi/');
  await expect(page.locator('[data-eg-takip]')).not.toBeVisible();
  await expect(page.locator('[data-ec-cours] a')).toHaveCount(73);
  await page.locator('.eg-ders summary').nth(2).click();
  await expect(page.locator('.eg-ders').nth(2).locator('.eg-uygulama')).toBeVisible();
  await page.locator('.eg-soru summary').first().click();
  await expect(page.locator('.eg-soru p').first()).toBeVisible();
  await context.close();
});
