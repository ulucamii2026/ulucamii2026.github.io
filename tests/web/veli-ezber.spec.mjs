import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mektepAc } from './helpers/mektep.mjs';

/* Ezber Kilimi Faz 1d (27 Eyl 2026) — veli portalında «Ezber Kilimi», öğrenci kipinde «Kilimim».
   İnceleme odakları: (1) geçiş betiği koşmadan önce veli eski listesini görmeye devam eder, (2) okuma reddedilince
   sayfa çökmez, eski liste kalır, (3) olaylar zamana göre yeniden eskiye ve sınırlı gelir, geçiş olayı görünmez,
   (4) velinin dili Fransızcaysa her satır Fransızca, (5) telefonda taşma yok. Sahte lite SDK: tests/web/helpers/mektep.mjs. */

const oge = (basamak, sonrakiKontrol = '', ek = {}) => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 1, ...ek });
const olay = (id, ezber, tur, zaman, ek = {}) => ({
  id, ezber, tur, kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 1, zorla: false, tarih: zaman.slice(0, 10), zaman, ...ek,
});
const DURUM = { 's-fatiha': oge(3, '2026-10-10'), 'd-euzu-besmele': oge(4), 'd-kelime-i-tevhid': oge(2, '2026-09-26'), 's-ihlas': oge(1) };
// Kasıtlı olarak sırasız: sayfa zamana göre yeniden eskiye dizmeli.
const OLAYLAR = [
  olay('o2', 's-ihlas', 'atama', '2026-09-12T09:00:00Z'),
  olay('o3', 'd-euzu-besmele', 'gecis', '2026-09-06T08:00:00Z', { basamakSonra: 2 }),
  olay('o1', 's-fatiha', 'dinleme', '2026-09-13T09:30:00Z', { kalite: 'tam', notlar: ['med'], basamakOnce: 2, basamakSonra: 3 }),
  olay('o4', 'd-kelime-i-tevhid', 'dinleme', '2026-09-12T09:10:00Z', { kalite: 'az', basamakOnce: 1, basamakSonra: 2 }),
];
const ESKI = { id: 'TEST-1', ezber: { 'Fâtiha': 'ogrendi' }, guncelleme: '2026-09-10' };

async function veliAc(page, context, { durum = DURUM, olaylar = OLAYLAR, eski = null, dil = 'tr', ogrenci = false, students, ek = [], ezberHata = false } = {}) {
  if (ezberHata) await page.addInitScript(() => { window.__ezberHata = true; });
  const records = {
    ezberDurum: [...(durum ? [{ id: 'TEST-1', ogeler: durum }] : []), ...ek],
    'ezberDurum/TEST-1/olaylar': olaylar,
    ...(eski ? { ilerleme: [eski] } : {}),
  };
  await mektepAc(page, context, { dil, ogrenci, records, ...(students ? { students } : {}) });
}
const eskiListe = (page, baslik = 'Ezberler') => page.locator('.bolum h3', { hasText: new RegExp(`^${baslik}$`) });

test('Veli: kilim «Bu hafta»dan sonra; özet, yumuşak dilli dinlemeler, kalıp not; eski liste gizli; şerit listesi 81 madde', async ({ page, context }) => {
  await veliAc(page, context, { eski: ESKI });
  const kart = page.locator('[data-ezber-kilim="veli"]');
  await expect(kart).toBeVisible();
  expect(await kart.evaluate((el) => el.previousElementSibling?.querySelector('h2')?.textContent)).toBe('Bu hafta');
  await expect(kart.locator('h2')).toHaveText('Ezber Kilimi');
  await expect(kart.locator('svg.ezber-kilim .kl-oge')).toHaveCount(81);
  await expect(kart.locator('.kilim-ozet')).toContainText('4/81 metin başladı');
  const satirlar = kart.locator('.kilim-dinlemeler li');
  await expect(satirlar).toHaveCount(3);
  await expect(satirlar.nth(0)).toContainText('Fâtiha Sûresi');
  await expect(satirlar.nth(0)).toContainText('çok güzel okudu');
  await expect(satirlar.nth(0)).toContainText('Uzatmalara (med) dikkat edelim.');
  await expect(satirlar.nth(1)).toContainText('küçük düzeltmelerle geçti');
  await expect(satirlar.nth(2)).toContainText('çalışmaya başladı');
  await expect(kart.locator('.kilim-dinlemeler')).not.toContainText('Eûzü-Besmele');
  await expect(eskiListe(page)).toHaveCount(0);
  // Metin karşılığı: katlanır liste, her madde kilimdeki dokusu ve basamak adıyla.
  const liste = kart.locator('details.kilim-seritler');
  await liste.locator('summary').click();
  await expect(liste.locator('.kl-maddeler li')).toHaveCount(81);
  await expect(liste.locator('li[data-id="s-fatiha"] .kl-basamak')).toHaveText('Pekişti');
  await expect(liste.locator('li[data-id="d-euzu-besmele"] .kl-basamak')).toHaveText('Kalıcı');
  await expect(liste.locator('.kl-serit-kutu').first().locator('h4')).toContainText('1 · İlk adım: iman ve besmele');
  // Listedeki işaretler aynı sayfadaki kilimin sembollerine bağlı.
  const cozulmeyen = await kart.evaluate((el) => [...el.querySelectorAll('use')].map((u) => u.getAttribute('href').slice(1)).filter((id) => !document.getElementById(id)));
  expect(cozulmeyen).toEqual([]);
});

test('Kilim görünürken yalnız eski ezber listesi olan İlerleme kartı boş kalmaz: boş durum yazar', async ({ page, context }) => {
  await veliAc(page, context, { eski: ESKI });
  const ilerleme = page.locator('.bolum', { has: page.locator('h2', { hasText: /^İlerleme$/ }) });
  await expect(ilerleme.locator('.bos')).toContainText('Hocanız değerlendirme yaptıkça');
  await expect(ilerleme.locator('.bolum-bas .sag')).toHaveCount(0);
  await expect(eskiListe(page)).toHaveCount(0);
});

test('Fransızca veli: başlık, özet, dinleme ve kalıp not Fransızca', async ({ page, context }) => {
  await veliAc(page, context, { dil: 'fr' });
  const kart = page.locator('[data-ezber-kilim="veli"]');
  await expect(kart.locator('h2')).toHaveText('Kilim de mémorisation');
  await expect(kart.locator('.kilim-ozet')).toContainText('4/81 textes commencés');
  await expect(kart).toContainText('Dernières récitations');
  await expect(kart.locator('.kilim-dinlemeler li').first()).toContainText('très bien récité');
  await expect(kart.locator('.kilim-dinlemeler li').first()).toContainText('Faisons attention aux allongements (madd).');
  await expect(kart).not.toContainText('çok güzel');
});

test('Geçişten önce: yeni kayıt yok, eski listede ezber var → kilim yok, eski liste yerinde', async ({ page, context }) => {
  await veliAc(page, context, { durum: null, olaylar: [], eski: ESKI });
  await expect(eskiListe(page)).toHaveCount(1);
  await expect(page.locator('[data-ezber-kilim]')).toHaveCount(0);
});

test('Hiç kayıt yok: boş kilim ve beklenti cümlesi; dinleme başlığı açılmaz', async ({ page, context }) => {
  await veliAc(page, context, { durum: null, olaylar: [] });
  const kart = page.locator('[data-ezber-kilim="veli"]');
  await expect(kart.locator('.kilim-ozet')).toHaveText('Henüz ezber kaydı yok. Hoca dinledikçe kilim dokunacak.');
  await expect(kart.locator('.kl-oge[data-basamak="0"]')).toHaveCount(81);
  await expect(kart).not.toContainText('Son dinlemeler');
});

test('Okuma reddedilirse: sayfa açılır, kartta hata iletisi, eski liste yerinde', async ({ page, context }) => {
  await veliAc(page, context, { eski: ESKI, ezberHata: true });
  const kart = page.locator('[data-ezber-kilim="hata"]');
  await expect(kart).toContainText('Ezber kilimi şu an yüklenemedi');
  await expect(kart.locator('svg.ezber-kilim')).toHaveCount(0);
  await expect(eskiListe(page)).toHaveCount(1);
  await expect(page.locator('.bolum', { hasText: 'Yoklama' }).first()).toBeVisible();
});

test('İki çocuk: sekme değişince kilim o çocuğun kaydını gösterir', async ({ page, context }) => {
  const students = [{ ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe' }, { ref: 'TEST-2', ad: 'İkinci', soyad: 'Örnek' }];
  // İkinci çocuğun kaydı: yalnız Fâtiha, Kalıcı.
  await veliAc(page, context, { students, ek: [{ id: 'TEST-2', ogeler: { 's-fatiha': oge(4, '', { kalite: 'tam', surum: 4 }) } }] });
  const kart = page.locator('[data-ezber-kilim="veli"]');
  await expect(kart.locator('.kilim-ozet')).toContainText('4/81');
  await page.locator('#cocuk-sekme-1').click();
  await expect(kart.locator('.kilim-ozet')).toContainText('1/81');
  await expect(kart.locator('svg.ezber-kilim')).toHaveAttribute('data-onek', 'kl-v1');
});

test('Öğrenci kipi: «Kilimim» Ezber Odası\'ndan sonra; dinleme geçmişi ve liste yok', async ({ page, context }) => {
  await veliAc(page, context, { ogrenci: true });
  const kart = page.locator('[data-ezber-kilim="ogrenci"]');
  await expect(kart).toBeVisible();
  expect(await kart.evaluate((el) => el.previousElementSibling?.classList.contains('ezber-odasi-kart'))).toBe(true);
  await expect(kart.locator('h2')).toHaveText('Kilimim');
  await expect(kart.locator('svg.ezber-kilim .kl-oge')).toHaveCount(81);
  await expect(kart).not.toContainText('Son dinlemeler');
  await expect(kart.locator('details')).toHaveCount(0);
});

test('Ezber Odası çiplerinde basamak işareti; ekran okuyucu adı; başlanmamış ve geçiş öncesinde işaret yok', async ({ page, context }) => {
  await veliAc(page, context, { ogrenci: true, durum: { ...DURUM, 'd-salli': oge(2, '2026-10-10') } });
  const cip = (id) => page.locator(`.sure-cip-btn[data-ezber-id="${id}"] .cip-basamak`);
  await expect(cip('fatiha')).toHaveAttribute('data-basamak', '3');
  await expect(cip('fatiha').locator('.sr-only')).toHaveText(' · Pekişti');
  await expect(cip('ihlas')).toHaveAttribute('data-basamak', '1');
  await expect(cip('salli-barik')).toHaveCount(0);
  await expect(cip('kevser')).toHaveCount(0);
  const ad = await page.locator('.sure-cip-btn[data-ezber-id="fatiha"]').evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim());
  expect(ad).toContain('Pekişti');
});

test('Geçişten önce Ezber Odası çiplerinde işaret yok', async ({ page, context }) => {
  await veliAc(page, context, { ogrenci: true, durum: null, olaylar: [], eski: ESKI });
  await expect(page.locator('.sure-cip-btn .cip-basamak')).toHaveCount(0);
  await expect(page.locator('[data-ezber-kilim]')).toHaveCount(0);
});

test('İki temada erişilebilir; telefonda taşma yok; ekran görüntüleri', async ({ page, context }, info) => {
  await veliAc(page, context, { eski: ESKI });
  const kart = page.locator('[data-ezber-kilim="veli"]');
  await kart.locator('details.kilim-seritler summary').click();
  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; document.documentElement.classList.toggle('dark', t === 'dark'); }, tema);
    const axe = await new AxeBuilder({ page }).include('[data-ezber-kilim]').analyze();
    expect(axe.violations, tema).toEqual([]);
    expect(await kart.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), `${tema} kart taşması`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tema} sayfa taşması`).toBe(true);
    await kart.screenshot({ path: info.outputPath(`veli-kilim-${tema}.png`) });
  }
});

test('Öğrenci kipi iki temada erişilebilir: «Kilimim» ve işaretli çipler; ekran görüntüleri', async ({ page, context }, info) => {
  await veliAc(page, context, { ogrenci: true });
  const kart = page.locator('[data-ezber-kilim="ogrenci"]');
  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; document.documentElement.classList.toggle('dark', t === 'dark'); }, tema);
    const axe = await new AxeBuilder({ page }).include('[data-ezber-kilim="ogrenci"]').include('.sure-cipler-bar').analyze();
    expect(axe.violations, tema).toEqual([]);
    expect(await kart.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), `${tema} kart taşması`).toBe(true);
    await kart.screenshot({ path: info.outputPath(`kilimim-${tema}.png`) });
    await page.locator('.sure-cipler-bar').screenshot({ path: info.outputPath(`oda-cipleri-${tema}.png`) });
  }
});
