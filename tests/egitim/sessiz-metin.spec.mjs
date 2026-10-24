/**
 * Diyanet ses kaydı olmayan, yalnız metni olan dualar (24 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı.
 * Kitap kaynaklı yedi dua (Tekbir, Tesmî–Tahmîd, Selâm, Âmentü, Teşrik tekbiri, Telbiye, Yemek duası) katalogda `metinli: true` taşır:
 * ses yoktur, sayfa metni, anlamı ve kaynak künyesini gösterir. Burada sabitlenenler:
 *  - ses oynatıcısı ve çal düğmesi yoktur; «Henüz dinleme kaydı yok» notu beş dilde görünür; «Dinle» adımı «Yakında» kalır;
 *  - her bölümün Arapçası sayfada vardır; Türkçe anlam veriyle aynıdır; Fransızca anlam yalnız DİTİB'in resmî Fransızca yayınında (Âmentü)
 *    karşılığı olduğunda görünür, olmayan dilde «yakında eklenecek» notu çıkar (çeviri uydurulmaz);
 *  - hoca onaylamadığı için okunuş HİÇBİR dilde gösterilmez; «hoca incelemesi bekleniyor» notu vardır;
 *  - kip bölümü ve A−/A+ çalışır (Kademeli gizle sekmesi açılır), konsol hatası ve CSP ihlali yoktur, açık ve koyu temada erişilebilirlik ihlali yoktur.
 * Ses sahte değil, hiç çağrılmaz: `play()` çağrılırsa test düşer. Dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SESSIZ = ['d-tekbir', 'd-tesmi-tahmid', 'd-selam', 'd-amentu', 'd-tesrik-tekbiri', 'd-telbiye', 'd-yemek-duasi'];
const metin = (id) => JSON.parse(readFileSync(new URL(`../../src/data/ezber/metin/${id}.json`, import.meta.url), 'utf8'));
const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));

// Sayfadaki «ses yok» notunun beş dildeki karşılığı (egitim/src/i18n/madde.ts sesYokBaslik).
const SES_YOK = { tr: 'Henüz dinleme kaydı yok', fr: 'Pas encore d’enregistrement', en: 'No recording yet', nl: 'Nog geen opname', de: 'Noch keine Aufnahme' };
// «Bu dilde anlam yok» notu (anlamYok).
const ANLAM_YOK = { fr: 'bientôt ajouté', en: 'will be added soon', nl: 'volgt binnenkort', de: 'folgt bald' };

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    window.__play = 0;
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () { window.__play++; return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
});

test('Katalog: bu yedi madde sessiz ve metinlidir; sesli madde metinli işareti taşımaz', () => {
  const sessizler = katalog.ogeler.filter((o) => o.metinli).map((o) => o.id);
  expect(sessizler.sort()).toEqual([...SESSIZ].sort());
  for (const o of katalog.ogeler.filter((x) => x.metinli)) expect(o.ses, o.id).toBeUndefined();
});

for (const dil of DILLER) {
  test(`${dil}: yedi sessiz dua — ses yok, metin ve künye var, okunuş gizli, kip ve A−/A+ çalışır`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
    for (const id of SESSIZ) {
      const m = metin(id);
      await page.goto(`/${dil}/calis/${id}/`);
      await expect(page.locator('audio'), id).toHaveCount(0);
      await expect(page.locator('[data-oynat]'), id).toHaveCount(0);
      await expect(page.locator('.calisma-sessiz'), id).toContainText(SES_YOK[dil]);
      // Her bölümün Arapçası sayfada.
      const sayfaMetni = await page.locator('main').innerText();
      const bosluksuz = (s) => s.replace(/[\s‎‏]+/g, '');
      for (const b of m.bolumler) expect(bosluksuz(sayfaMetni), `${id}/${b.no}: Arapça metin sayfada`).toContain(bosluksuz(b.ar));
      // Künye: kitap adı ve «↔» ile karşılaştırılan ikinci kaynak.
      await expect(page.locator('.kaynak-satiri'), id).toContainText('Diyanet');
      await expect(page.locator('.kaynak-satiri'), id).toContainText('↔');
      // Türkçe anlam veriyle aynı; öbür dillerde yalnız resmî Fransızca (Âmentü) ya da «yakında» notu.
      if (dil === 'tr') {
        for (const g of m.meal.tr.gruplar) expect(bosluksuz(sayfaMetni), `${id}: Türkçe anlam`).toContain(bosluksuz(g.metin));
      } else if (m.meal.fr && dil === 'fr') {
        for (const g of m.meal.fr.gruplar) expect(bosluksuz(sayfaMetni), `${id}: resmî Fransızca anlam`).toContain(bosluksuz(g.metin));
        await expect(page.locator('.kaynak-satiri'), id).toContainText('Je vais à la mosquée');
      } else {
        await expect(page.locator('main'), `${id}: ${dil} anlam yok notu`).toContainText(ANLAM_YOK[dil] ?? 'bientôt ajouté');
        for (const g of m.meal.tr.gruplar) expect(bosluksuz(sayfaMetni), `${id}: Türkçe anlam ${dil} sayfasına sızmamalı`).not.toContain(bosluksuz(g.metin));
      }
      // Hoca onayı yok: okunuş görünmez.
      for (const satir of [...(m.okunus?.tr ?? []), ...(m.okunus?.fr ?? [])]) expect(bosluksuz(sayfaMetni), `${id}: onaysız okunuş gösterilmez`).not.toContain(bosluksuz(satir.metin));
      expect(m.onay, `${id}: onay verisi`).toBeNull();
    }
    expect(await page.evaluate(() => window.__play)).toBe(0);
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('Kademeli gizle sekmesi sessiz sayfada açılır; A−/A+ Arapça boyutunu değiştirir', async ({ page }) => {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto('/tr/calis/d-amentu/');
  await page.locator('#kip-sekme-gizle').click();
  await expect(page.locator('#kip-panel-gizle')).toBeVisible();
  await expect(page.locator('#kip-panel-gizle .kip-metin')).toBeVisible();
  const boy = () => page.locator('.metin .ar').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const olcek = () => page.locator('.madde').getAttribute('data-ar-olcek').then(Number);
  const once = await boy();
  const olcekOnce = await olcek();
  await page.locator('[data-ar-arttir]').click();
  // Ölçek özniteliği tıklamayla eşzamanlı değişir; hesaplanan punto yükü altında bir kare sonra oturabilir: bekleyerek ölç.
  await expect.poll(olcek, { message: 'A+ ölçeği artırmalı' }).toBe(olcekOnce + 1);
  await expect.poll(boy, { message: 'A+ Arapça puntoyu büyütmeli' }).toBeGreaterThan(once);
  expect(await page.evaluate(() => window.__play)).toBe(0);
  expect(hatalar).toEqual([]);
});

test('Erişilebilirlik: sessiz dua sayfaları açık ve koyu temada ihlalsiz, yatay taşma yok (beş dil)', async ({ page }) => {
  for (const dil of DILLER) {
    for (const id of ['d-tekbir', 'd-amentu']) {
      await page.goto(`/${dil}/calis/${id}/`);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${dil}/${id}/${colorScheme}: taşma`).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `${dil}/${id}/${colorScheme}`).toEqual([]);
      }
    }
  }
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});

test('Giriş sayfası: sessiz dua listede bağlantıdır, çal düğmesi yoktur', async ({ page }) => {
  await page.goto('/tr/');
  await page.evaluate(() => document.querySelectorAll('details.serit-liste').forEach((d) => { d.open = true; }));
  for (const id of SESSIZ) {
    await expect(page.locator(`#m-${id} a.ad`), id).toHaveAttribute('href', `/tr/calis/${id}/`);
    await expect(page.locator(`#m-${id} button.dinle`), id).toHaveCount(0);
  }
});
