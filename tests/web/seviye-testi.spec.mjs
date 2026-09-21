/** Seviye tespit testi sayfası — tarayıcı testleri (20 Eylül 2026).
 *
 *  Sayfanın ucu (`data-uc`) CANLI Apps Script'tir: bütün dış istekler kesilir ve GAS yalnız
 *  `page.route('**\/macros/**')` ile taklit edilir. Rotalar her zaman `page.goto`dan ÖNCE kurulur;
 *  aksi hâlde gerçek kayıt açılır ve gerçek e-posta gider (docs/SEVIYE-TESTI.md §7 «Deneme kaydı»).
 *  Puan tarayıcıda hesaplanmaz: taklit sunucu gövdeyi alır ve gerçek bankayla (`bankaPuanla`)
 *  hesapladığı `sonuc`u döndürür — sonuç paneli bu nesneyle çizilir.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { MADDELER, EZBER, BEYAN, SORU_BANKASI_SURUMU, bankaPuanla } from '../../src/lib/seviye-testi/index.ts';
import { SONUC_METINLERI } from '../../src/lib/seviye-testi/metinler.ts';
import { seviyeMetinleri, RIZA_SURUMU } from '../../src/i18n/seviye-testi.ts';

const yollar = { tr: 'seviye-tespit-testi', fr: 'test-de-niveau', en: 'level-assessment', nl: 'niveautest', de: 'einstufungstest' };
const maddeler = MADDELER.filter((m) => !m.emekli);
const TOPLAM_SORU = maddeler.length + EZBER.length + BEYAN.length;
const TASLAK_ANAHTARI = 'ulucamii:seviye:v1';
const M = seviyeMetinleri.tr;
const S = SONUC_METINLERI.tr;

const SAGLIK = { ok: true, servis: 'ulucamii-alici', surum: 39, seviyeTesti: true, seviyeBankaSurumu: SORU_BANKASI_SURUMU };
const E = M.etkilesim;
/** Okuma adımındaki açık soru sayısı (30 madde + 3 öz beyan) — alt şerit sayacının paydası. */
const OKUMA_SORU = maddeler.filter((m) => m.alan === 'okuma').length + BEYAN.filter((b) => b.kume === 'okuma').length;
const doldurMetin = (kalip, degerler) => kalip.replace(/\{(\w+)\}/g, (_, k) => String(degerler[k]));
/** Belirtilen basamağın maddelerini ilk şıkla işaretleyen seçim haritası (doğruluk aranmaz). */
const basamakSecimi = (no) => Object.fromEntries(
  maddeler.filter((m) => m.alan === 'okuma' && m.basamak === no).map((m) => [`cevaplar.${m.id}`, '0']));

/* ---------- fikstürler (yalnız .test adresi, soyad TESTOGLU) ---------- */

const PROFIL_METIN = {
  'profil.adSoyad': 'Deniz TESTOGLU',
  'profil.eposta': 'deniz@example.test',
  'profil.telefon': '0470000000',   // yerel yazım: alan kendisi «+32 470 00 00 00» yapar
  'yerel.sehir': '6900 Marche-en-Famenne',
};
const PROFIL_SECIM = {
  'profil.yasAraligi': '26-40', 'profil.cinsiyet': 'kadin', 'profil.muslumanlik': '0-1',
  'profil.oncekiEgitim': 'hic', 'profil.dersDili': 'fr', 'profil.bicim': 'yuzyuze',
  // Form sürümü 2 — «Nereden başvuruyorsunuz?» (ilk adımın ikinci bölümü)
  'yerel.camiBiliyor': 'evet', 'yerel.gorevliTaniyor': 'hayir', 'yerel.ateselikBilgisi': 'hayir',
};

/** Varsayılan cevap kuralı: okumada ilk üç basamak doğru, bilgi alanlarında yalnız B1 doğru.
 *  Böylece sonuç «B» programına düşer ve her alanda farklı bir düzey okunur. */
const varsayilanKural = (m) => (m.alan === 'okuma' ? (m.basamak <= 3 ? m.dogru : -1) : (m.basamak === 1 ? m.dogru : -1));

/** Ad → şık değeri haritası; `hepsiniCevapla` bunu tek `page.evaluate` ile işaretler. */
function secimKur(kural = varsayilanKural) {
  const secim = {};
  for (const m of maddeler) secim[`cevaplar.${m.id}`] = String(kural(m));
  for (const e of EZBER) secim[`ezber.${e.id}`] = '2';
  for (const b of BEYAN) secim[`beyan.${b.id}`] = String(Math.min(1, b.secenekler.length - 1));
  return secim;
}

/** Seçimin puanlamaya giden hâli (sunucunun göreceği `cevaplar` nesnesi). */
function cevaplarNesnesi(kural = varsayilanKural, atlananAlanlar = []) {
  const cevaplar = {};
  for (const m of maddeler) if (!atlananAlanlar.includes(m.alan)) cevaplar[m.id] = kural(m);
  return cevaplar;
}

const okumaBeyanlari = new Set(BEYAN.filter((b) => b.kume === 'okuma').map((b) => `beyan.${b.id}`));
const suz = (secim, kabul) => Object.fromEntries(Object.entries(secim).filter(([ad]) => kabul(ad)));
/** Adım gruplarıyla birebir: 0 profil · 1 okuma · 2 Kur'an bilgisi + ezber · … · 8 uygulama · 9 özet. */
function adimSecimleri(secim) {
  const madde = (onek) => (ad) => ad.startsWith(`cevaplar.${onek}`);
  return [
    {},
    suz(secim, (ad) => madde('ok')(ad) || okumaBeyanlari.has(ad)),
    suz(secim, (ad) => madde('kb')(ad) || ad.startsWith('ezber.')),
    suz(secim, madde('it')), suz(secim, madde('nm')), suz(secim, madde('ib')),
    suz(secim, madde('sy')), suz(secim, madde('ah')),
    suz(secim, (ad) => ad.startsWith('beyan.') && !okumaBeyanlari.has(ad)),
    {},
  ];
}

/* ---------- GAS taklidi ---------- */

/** GET → sağlık; POST → gövdeyi yakalar, gerçek bankayla puanlayıp yanıtlar.
 *  `durum.saglik` ve `durum.yanit` test içinde değiştirilebilir (sunucu durumları senaryosu). */
async function gasTaklidi(page) {
  const durum = { gonderilen: [], saglik: { ...SAGLIK }, yanit: null };
  await page.route('**/macros/**', (route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: durum.saglik });
    const govde = route.request().postDataJSON();
    durum.gonderilen.push(govde);
    if (durum.yanit) return route.fulfill({ json: durum.yanit });
    return route.fulfill({ json: { ok: true, ref: 'ST-2099-0001', kopyaGitti: true, sonuc: bankaPuanla({ cevaplar: govde.cevaplar, atla: govde.atla }) } });
  });
  return durum;
}

/* ---------- sayfa yardımcıları ---------- */

async function sayfayiAc(page, dil = 'tr') {
  await page.goto(`/${dil}/${yollar[dil]}/`);
  await expect(page.locator('form[data-form="seviye"]')).toBeVisible();
}

const tumunuGoster = (page) => page.locator('[data-adim-tumu]').click();

async function profilDoldur(page) {
  for (const [ad, deger] of Object.entries(PROFIL_METIN)) {
    await page.locator(`[name="${ad}"]`).fill(deger);
  }
  for (const [ad, deger] of Object.entries(PROFIL_SECIM)) {
    await page.locator(`input[name="${ad}"][value="${deger}"]`).check();
  }
  await page.locator('select[name="yerel.ulke"]').selectOption('BE');
}

/** Yüzlerce tıklama yerine tek turda işaretler; kapalı (disabled) sorulara dokunmaz.
 *  Ortak çekirdek `change` olayını formda dinlediği için tek kabarcıklanan olay yeter. */
async function hepsiniCevapla(page, secim) {
  return page.evaluate((secim) => {
    const form = document.querySelector('form[data-form="seviye"]');
    let son = null, sayi = 0;
    for (const [ad, deger] of Object.entries(secim)) {
      const girdi = form.querySelector(`input[type="radio"][name="${CSS.escape(ad)}"][value="${CSS.escape(deger)}"]`);
      if (!girdi || girdi.disabled) continue;
      girdi.checked = true; son = girdi; sayi++;
    }
    son?.dispatchEvent(new Event('change', { bubbles: true }));
    return sayi;
  }, secim);
}

async function onaylariIsaretle(page) {
  for (const ad of ['onay.yas18', 'onay.riza']) await page.locator(`input[name="${ad}"]`).check();
}

/** Tek sayfa görünümünde bütün testi doldurur (adım adım akış 2. senaryoda sınanır). */
async function testiDoldur(page, secim = secimKur()) {
  await tumunuGoster(page);
  await profilDoldur(page);
  await hepsiniCevapla(page, secim);
  await onaylariIsaretle(page);
}

const gonder = (page) => page.locator('form[data-form="seviye"] button[type="submit"]').click();

async function adimDogrula(page, sira) {
  await expect(page.locator('[data-adim-durum]')).toContainText(new RegExp(`${sira + 1}\\s*/\\s*10`));
  await expect(page.locator('progress[data-adim-ilerleme]')).toHaveAttribute('value', String(sira + 1));
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
    .map((v) => ({ id: v.id, hedefler: v.nodes.map((n) => n.target), ozet: v.nodes.map((n) => n.failureSummary) }));
}

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

/* ---------- 1. Beş dil duman testi ---------- */

for (const [dil, yolu] of Object.entries(yollar)) {
  test(`${dil}: seviye testi sayfası dizine açık açılır ve bankanın tamamını basar`, async ({ page }) => {
    await gasTaklidi(page);
    await sayfayiAc(page, dil);

    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
    // Dizine açık sayfa: robots meta ya yok ya da noindex taşımaz.
    expect(await page.evaluate(() => document.querySelector('meta[name="robots"]')?.content ?? '')).not.toContain('noindex');
    await expect(page.locator('[data-form-ust] .st-noktalar li')).toHaveCount(seviyeMetinleri[dil].giris.noktalar.length);
    // Form v2: yer bilgisi ve beş ders dili; paylaşım varsayılan olarak kapalıdır.
    await expect(page.locator('#b-yerel')).toBeVisible();
    expect(await page.locator('input[name="profil.dersDili"]').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(Object.keys(yollar));
    for (const name of ['onay.yerelGorevli', 'onay.ateselik']) {
      const consent = page.locator(`input[name="${name}"]`);
      await expect(consent).not.toBeChecked();
      await expect(consent).not.toHaveAttribute('required');
    }
    await expect(page.locator('[data-adim-sec]')).toHaveCount(10);
    await expect(page.locator('progress[data-adim-ilerleme]')).toHaveAttribute('max', '10');

    // Doğru şık ve kaynak künyesi derlenmiş HTML'e ASLA çıkmaz.
    const ham = await page.evaluate(async () => (await fetch(location.href)).text());
    expect(ham).not.toMatch(/"dogru"|kaynak:/);

    const gruplar = await page.evaluate(() => new Set(
      Array.from(document.querySelectorAll('input[type="radio"][name^="cevaplar."]')).map((g) => g.name)).size);
    expect(gruplar).toBe(maddeler.length);
    await expect(page.locator('fieldset[data-soru]')).toHaveCount(TOPLAM_SORU);
  });
}

/* ---------- 2. Tam akış ---------- */

test('Adım adım tam akış: doğrulama, özet, gönderim sözleşmesi ve sonuç paneli', async ({ page }) => {
  test.setTimeout(90_000);
  const gas = await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  const secim = secimKur();
  const adimlar = adimSecimleri(secim);

  // Adım 0 — e-posta TEK kez yazılır; yaygın alan adı hatasında öneri çıkar ve tek dokunuşla düzelir.
  await expect(page.locator('[name="profil.epostaTekrar"]')).toHaveCount(0);
  const eposta = page.locator('[name="profil.eposta"]');
  await eposta.fill('deniz@gmial.com');
  await eposta.blur();
  const oneri = page.locator('[data-eposta-oneri]');
  await expect(oneri).toBeVisible();
  await expect(oneri).toContainText('deniz@gmail.com');
  await oneri.locator('[data-eposta-oneri-uygula]').click();
  await expect(eposta).toHaveValue('deniz@gmail.com');
  await expect(oneri).toBeHidden();

  // Telefon: yalnız rakam kabul eder, yazarken «+32 4xx xx xx xx» biçimine girer.
  const telefon = page.locator('[name="profil.telefon"]');
  await telefon.click();
  await expect(telefon).toHaveValue('+32 ');
  await telefon.pressSequentially('04a70-12b34 56xyz');
  await expect(telefon).toHaveValue('+32 470 12 34 56');
  await telefon.fill('');
  await telefon.blur();
  await expect(telefon).toHaveValue('');

  await profilDoldur(page);
  await expect(telefon).toHaveValue('+32 470 00 00 00');
  await expect(oneri).toBeHidden();
  await page.locator('[data-adim-ileri]').click();
  await adimDogrula(page, 1);

  for (let sira = 1; sira <= 8; sira++) {
    // Boş bırakılan banka sorusunda genel «zorunlu» değil, «Bilmiyorum»u hatırlatan metin çıkar.
    await page.locator('[data-adim-ileri]').click();
    await adimDogrula(page, sira);
    const ilkSoru = page.locator('fieldset[data-soru]:visible').first();
    const beyanMi = (await ilkSoru.getAttribute('data-beyan')) !== null;
    await expect(ilkSoru.locator('.hata')).toHaveText(beyanMi ? 'Bu alan zorunludur.' : M.soru.zorunlu);
    await expect(ilkSoru.locator('input[type="radio"]').first()).toBeFocused();
    expect(await hepsiniCevapla(page, adimlar[sira])).toBe(Object.keys(adimlar[sira]).length);
    await page.locator('[data-adim-ileri]').click();
    await adimDogrula(page, sira + 1);
  }

  // Özet: yanıtlanan sayısı, atlanan bölüm yok, ders dili etiketle yazılır.
  await expect(page.locator('[data-ozet-alan="adSoyad"] [data-ozet-deger]')).toHaveText('Deniz TESTOGLU');
  await expect(page.locator('[data-ozet-alan="eposta"] [data-ozet-deger]')).toHaveText('deniz@example.test');
  await expect(page.locator('[data-ozet-alan="dersDili"] [data-ozet-deger]')).toHaveText('Fransızca');
  await expect(page.locator('[data-ozet-alan="cevaplanan"]')).toHaveText(`${TOPLAM_SORU} / ${TOPLAM_SORU} soru yanıtlandı`);
  await expect(page.locator('[data-ozet-alan="atlanan"]')).toHaveText('Atlanan bölümler: —');

  // Onaylar işaretsizken gönderim engellenir.
  await gonder(page);
  await expect(page.locator('[data-mesaj]')).toContainText('Formda eksik veya hatalı alanlar var');
  expect(gas.gonderilen).toHaveLength(0);

  await onaylariIsaretle(page);
  await gonder(page);
  await expect(page.locator('[data-basari]')).toBeVisible();
  expect(gas.gonderilen).toHaveLength(1);

  const v = gas.gonderilen[0];
  expect(v.tur).toBe('seviye');
  expect(v.formSurumu).toBe(2);
  expect(v.yerel).toEqual({ ulke: 'BE', sehir: '6900 Marche-en-Famenne', camiBiliyor: 'evet', yakinCami: '', gorevliTaniyor: 'hayir', ateselikBilgisi: 'hayir' });
  // Paylaşım onayları isteğe bağlıdır: işaretlenmediyse açıkça false gider.
  expect(v.onay.yerelGorevli).toBe(false);
  expect(v.onay.ateselik).toBe(false);
  expect(v.sir).toBe('ULUCAMII-SEVIYE-2026');
  expect(v.dil).toBe('tr');
  expect(typeof v.gonderimAnahtari).toBe('string');
  expect(v.gonderimAnahtari.length).toBeGreaterThan(20);
  expect(v.bankaSurumu).toBe(SORU_BANKASI_SURUMU);
  expect(v.rizaSurumu).toBe(RIZA_SURUMU);
  expect(v.profil.adSoyad).toBe('Deniz TESTOGLU');
  expect(v.profil.eposta).toBe('deniz@example.test');
  expect(v.profil.telefon).toBe('+32470000000');
  expect(v.profil.epostaTekrar).toBeUndefined();
  expect(v.profil.hedefler).toEqual([]);
  expect(v.profil.gunler).toEqual([]);
  expect(v.profil.dilim).toEqual([]);
  expect(v.profil.dersDili).toBe('fr');
  expect(v.onay).toEqual({ yas18: true, riza: true, yerelGorevli: false, ateselik: false });
  expect(v.atla).toEqual({});
  expect(v.okumaAtla).toBeUndefined();
  expect(v.cevaplar).toEqual(cevaplarNesnesi());
  expect(Object.values(v.cevaplar).every(Number.isInteger)).toBe(true);
  expect(v.ezber).toEqual(Object.fromEntries(EZBER.map((e) => [e.id, 2])));
  expect(v.beyan).toEqual(Object.fromEntries(BEYAN.map((b) => [b.id, Math.min(1, b.secenekler.length - 1)])));
  expect(typeof v.meta.sureSn).toBe('number');
  // docs/SEVIYE-TESTI.md §4: gövde 20 KiB'ın altında kalmalı.
  expect(JSON.stringify(v).length).toBeLessThan(20 * 1024);

  // Sonuç paneli sunucunun döndürdüğü `sonuc` ile çizilir.
  const beklenen = bankaPuanla({ cevaplar: cevaplarNesnesi(), atla: {} });
  await expect(page.locator('[data-ref]')).toHaveText('ST-2099-0001');
  await expect(page.locator('[data-eposta-metin]')).toContainText('deniz@example.test');
  await expect(page.locator('[data-sonuc]')).toBeVisible();
  await expect(page.locator('[data-okuma-cubuk]')).toHaveAttribute('aria-label',
    `${S.alanAdlari.okuma}: ${S.okumaDuzeyleri[beklenen.okuma.duzey]} — ${beklenen.okuma.duzey} / 5`);
  await expect(page.locator('[data-okuma-cubuk] span[data-dolu]')).toHaveCount(beklenen.okuma.duzey);
  await expect(page.locator('[data-okuma-metin]')).toHaveText(S.okumaDuzeyleri[beklenen.okuma.duzey]);
  await expect(page.locator('[data-alan-liste] li')).toHaveCount(6);
  await expect(page.locator('[data-alan-liste] li').first())
    .toContainText(S.duzeyAdlari[beklenen.alanlar[0].duzey]);
  await expect(page.locator('[data-alan-liste] .st-cubuk').first())
    .toHaveAttribute('aria-label', new RegExp(`${beklenen.alanlar[0].duzey} / 3$`));
  await expect(page.locator('[data-program-ad]')).toHaveText(S.programlar[beklenen.program].ad);
  await expect(page.locator('.st-sonraki')).toContainText('bir hafta');
  await expect(page.locator('form[data-form="seviye"]')).toBeHidden();
  await expect(page.locator('[data-form-ust]')).toBeHidden();
  expect(await page.evaluate((a) => localStorage.getItem(a), TASLAK_ANAHTARI)).toBeNull();
});

/* ---------- 3. Atlama ---------- */

test('Atlanan bölümün soruları kapanır, öz beyan açık kalır ve gövdeye girmez', async ({ page }) => {
  test.setTimeout(90_000);
  const gas = await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);

  // Tek basamak: yalnız o basamağın soruları kapanır.
  await page.locator('input[name="okumaAtla.b1"]').check();
  await expect(page.locator('input[name="cevaplar.ok01"]').first()).toBeDisabled();
  await expect(page.locator('input[name="cevaplar.ok07"]').first()).toBeEnabled();
  await page.locator('input[name="okumaAtla.b1"]').uncheck();
  await expect(page.locator('input[name="cevaplar.ok01"]').first()).toBeEnabled();

  // «Arap harflerini hiç bilmiyorum»: okuma soruları kapanır, okuma öz beyanı AÇIK kalır.
  await page.locator('input[name="atla.okuma"]').check();
  await expect(page.locator('#b-okuma .st-sorular[data-kosul="atla.okuma=false"]')).toBeHidden();
  await expect(page.locator('input[name="cevaplar.ok01"]').first()).toBeDisabled();
  await expect(page.locator('input[name="cevaplar.ok30"]').first()).toBeDisabled();
  const okumaBeyani = [...okumaBeyanlari][0];
  await expect(page.locator(`input[name="${okumaBeyani}"]`).first()).toBeEnabled();
  await expect(page.locator('#b-okuma .st-beyanlar')).toBeVisible();

  // Bilgi bölümünde «Bu bölümü atla» aynı davranışı gösterir.
  await page.locator('input[name="atla.siyer"]').check();
  await expect(page.locator('#b-siyer .st-sorular[data-kosul="atla.siyer=false"]')).toBeHidden();
  await expect(page.locator('input[name="cevaplar.sy01"]').first()).toBeDisabled();

  await profilDoldur(page);
  const secim = secimKur();
  await hepsiniCevapla(page, secim);
  await onaylariIsaretle(page);

  await expect(page.locator('[data-ozet-alan="atlanan"]')).toHaveText(`Atlanan bölümler: ${M.okuma.baslik}, ${M.bolumler.siyer.baslik}`);
  await gonder(page);
  await expect(page.locator('[data-basari]')).toBeVisible();
  expect(gas.gonderilen).toHaveLength(1);

  const v = gas.gonderilen[0];
  expect(v.atla).toEqual({ okuma: true, siyer: true });
  expect(Object.keys(v.cevaplar).some((id) => id.startsWith('ok') || id.startsWith('sy'))).toBe(false);
  expect(v.cevaplar).toEqual(cevaplarNesnesi(varsayilanKural, ['okuma', 'siyer']));
  expect(Object.keys(v.beyan)).toHaveLength(BEYAN.length);          // okuma beyanı atlanmadı
  expect(v.okumaAtla).toBeUndefined();

  const beklenen = bankaPuanla({ cevaplar: v.cevaplar, atla: v.atla });
  expect(beklenen.okuma.atlandi).toBe(true);
  await expect(page.locator('[data-okuma-metin]')).toHaveText(S.atlandi);
  await expect(page.locator('[data-okuma-cubuk] span[data-dolu]')).toHaveCount(0);
  await expect(page.locator('[data-alan-liste] li').nth(4)).toContainText(S.atlandi);
});

/* ---------- 4. Taslak ---------- */

test('Taslak yanıtları geri getirir, onayları getirmez; silme ve 15 günlük ömür çalışır', async ({ page }) => {
  test.setTimeout(90_000);
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);
  const secim = secimKur();
  await profilDoldur(page);
  await hepsiniCevapla(page, suz(secim, (ad) => ad.startsWith('cevaplar.ok') || okumaBeyanlari.has(ad)));
  await onaylariIsaretle(page);
  await expect.poll(() => page.evaluate((a) => JSON.parse(localStorage.getItem(a) || '{}').alanlar?.['cevaplar.ok01'], TASLAK_ANAHTARI))
    .toBe(secim['cevaplar.ok01']);

  await page.reload();
  await expect(page.locator('[name="profil.adSoyad"]')).toHaveValue('Deniz TESTOGLU');
  await expect(page.locator(`input[name="cevaplar.ok01"][value="${secim['cevaplar.ok01']}"]`)).toBeChecked();
  await expect(page.locator('input[name="profil.dersDili"][value="fr"]')).toBeChecked();
  // Onay kutuları hassas kabul edilir: taslaktan geri gelmez.
  await expect(page.locator('input[name="onay.yas18"]')).not.toBeChecked();
  await expect(page.locator('input[name="onay.riza"]')).not.toBeChecked();
  await expect(page.locator('[data-taslak-not]')).toBeVisible();
  await expect(page.locator('[data-taslak-not]')).toContainText(M.onay.ortakCihaz.slice(0, 40));
  // İlk eksik zorunlu alan Kur'an bilgisi adımındadır (3 / 10).
  await adimDogrula(page, 2);
  await expect(page.locator('#b-kuran-bilgi')).toBeVisible();

  await page.locator('[data-taslak-sil]').click();
  await expect(page.locator('[name="profil.adSoyad"]')).toHaveValue('');
  await expect(page.locator(`input[name="cevaplar.ok01"][value="${secim['cevaplar.ok01']}"]`)).not.toBeChecked();
  await expect(page.locator('[data-taslak-not]')).toBeHidden();
  await expect(page.locator('[data-mesaj]')).toContainText('Taslak silindi');
  expect(await page.evaluate((a) => localStorage.getItem(a), TASLAK_ANAHTARI)).toBeNull();

  // 15 gün önce yazılmış taslak (ömür 14 gün) yüklenmez.
  await page.evaluate((a) => localStorage.setItem(a, JSON.stringify({
    surum: 2, zaman: Date.now() - 15 * 86400000, anahtar: 'eski-anahtar',
    alanlar: { 'profil.adSoyad': 'Eski TESTOGLU' },
  })), TASLAK_ANAHTARI);
  await page.reload();
  await expect(page.locator('[name="profil.adSoyad"]')).toHaveValue('');
  await expect(page.locator('[data-taslak-not]')).toBeHidden();
  await adimDogrula(page, 0);
});

/* ---------- 5. Dinleme düğmesi ---------- */

test('Dinleme düğmesi yerel Diyanet sesini çalar; ses hatasında uyarı gösterir', async ({ page }) => {
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);

  const dugmeler = page.locator('button[data-ses]');
  expect(await dugmeler.count()).toBeGreaterThan(1);
  const ilk = dugmeler.first();
  const yol = await ilk.getAttribute('data-ses');
  expect(yol).toMatch(/^\/media\/ses\/elifba\//);
  expect(await page.evaluate(async (y) => (await fetch(y)).status, yol)).toBe(200);

  await ilk.scrollIntoViewIfNeeded();
  await ilk.click();
  await expect.poll(() => ilk.evaluate((d) => d.dataset.caliyor === '1' || d.textContent.trim() === 'Tekrar dinle')).toBe(true);
  await expect(ilk.locator('xpath=following-sibling::span[@data-ses-durum]')).toHaveText('');
  // Aynı düğmeye ikinci basış çalanı durdurur; etiket «Tekrar dinle» olur.
  await ilk.click();
  await expect(ilk).toHaveText(M.okuma.tekrarDinle);

  const ikinci = dugmeler.nth(1);
  const ikinciYol = await ikinci.getAttribute('data-ses');
  await page.route(`**${ikinciYol}`, (route) => route.fulfill({ status: 404, body: '' }));
  await ikinci.scrollIntoViewIfNeeded();
  await ikinci.click();
  await expect(ikinci.locator('xpath=following-sibling::span[@data-ses-durum]')).toHaveText(M.okuma.sesHatasi);
});

/* ---------- 6. Sunucu durumları ---------- */

test('Servis hazır değilken, günlük sınırda ve bal küpü doluyken veri sunucuya gitmez', async ({ page }) => {
  test.setTimeout(90_000);
  const gas = await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await testiDoldur(page);

  // (a) Sağlık denetimi bayrağı kapalı: POST hiç atılmaz.
  gas.saglik = { ...SAGLIK, seviyeTesti: false };
  await gonder(page);
  await expect(page.locator('[data-mesaj]')).toContainText('Başvuru sistemi şu anda güncelleniyor');
  expect(gas.gonderilen).toHaveLength(0);

  // (b) Günlük sınır: yerelleştirilmiş metin, taslak korunur, düğme yeniden açılır.
  gas.saglik = { ...SAGLIK };
  gas.yanit = { ok: false, hata: 'gunluk-sinir' };
  await gonder(page);
  await expect(page.locator('[data-mesaj]')).toHaveText(M.hata.gunlukSinir);
  expect(gas.gonderilen).toHaveLength(1);
  await expect(page.locator('form[data-form="seviye"] button[type="submit"]')).toBeEnabled();
  await expect(page.locator('form[data-form="seviye"] button[type="submit"]')).toHaveText(M.ozet.gonder);
  expect(await page.evaluate((a) => localStorage.getItem(a), TASLAK_ANAHTARI)).not.toBeNull();

  // (c) Aynı e-postadan günlük sınır.
  gas.yanit = { ok: false, hata: 'eposta-gunluk-sinir' };
  await gonder(page);
  await expect(page.locator('[data-mesaj]')).toHaveText(M.hata.epostaGunlukSinir);
  expect(gas.gonderilen).toHaveLength(2);

  // (d) Bal küpü doluyken istek atılmaz; kullanıcı normal başarı ekranını görür.
  gas.yanit = null;
  await page.locator('input[name="web"]').fill('https://spam.example.test');
  await gonder(page);
  await expect(page.locator('[data-basari]')).toBeVisible();
  await expect(page.locator('[data-ref]')).toContainText(/^BOT-/);
  await expect(page.locator('[data-sonuc]')).toBeHidden();
  expect(gas.gonderilen).toHaveLength(2);
});

/* ---------- 7. Erişilebilirlik ve düzen ---------- */

test('Açılış, okuma, özet ve sonuç ekranı erişilebilir; dar ekranda taşma yok', async ({ page }, info) => {
  test.setTimeout(90_000);
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');

  expect(await ciddiAxe(page, ['main']), 'açılış').toEqual([]);

  // Arapça öğeler dil ve yön taşır; alt küme yazı tipi (.arabic-ana) bu sayfada kullanılmaz.
  await page.locator('[data-adim-sec="1"]').click();
  const arapca = page.locator('#b-okuma .st-arapca').first();
  await expect(arapca).toHaveAttribute('lang', 'ar');
  await expect(arapca).toHaveAttribute('dir', 'rtl');
  expect(await arapca.evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Amiri');
  await expect(page.locator('.arabic-ana')).toHaveCount(0);
  await sonluAnimasyonlariBekle(page);
  expect(await ciddiAxe(page, ['#b-okuma']), 'okuma adımı').toEqual([]);

  // Klavye: radyo grubuna Tab ile girilir, ok tuşu seçer, «Devam» Enter ile çalışır.
  await page.locator('#st-atla-b1').focus();
  await page.keyboard.press('Tab');
  // Klibi olan soruda «sesli oku» düğmesi klavye sırasında radyo grubundan ÖNCE gelir (başlığın içinde durur).
  const okuDugmesi = page.locator('fieldset[data-soru="ok01"] .st-oku');
  if (await okuDugmesi.count()) {
    await expect(okuDugmesi).toBeFocused();
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('#st-ok01-0')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#st-ok01-1')).toBeChecked();
  await page.locator('[data-adim-ileri]').focus();
  await page.keyboard.press('Enter');
  await adimDogrula(page, 1);                       // eksik yanıtlar adımı açık tutar
  await expect(page.locator('fieldset[data-soru="ok02"] .hata')).toHaveText(M.soru.zorunlu);

  // Özet adımı ve sonuç paneli.
  await tumunuGoster(page);
  await profilDoldur(page);
  await hepsiniCevapla(page, secimKur());
  await onaylariIsaretle(page);
  await page.locator('[data-adim-tumu]').click();
  await page.locator('[data-adim-sec="9"]').click();
  await sonluAnimasyonlariBekle(page);
  expect(await ciddiAxe(page, ['#b-ozet', '#b-onay']), 'özet adımı').toEqual([]);

  await page.setViewportSize({ width: 360, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '360 px').toBe(true);
  await page.locator('#b-ozet').screenshot({ path: info.outputPath('seviye-ozet.png') });

  await gonder(page);
  await expect(page.locator('[data-basari]')).toBeVisible();
  await sonluAnimasyonlariBekle(page);
  expect(await ciddiAxe(page, ['[data-basari]']), 'sonuç paneli').toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sonuç 360 px').toBe(true);

  if (info.project.name.includes('mobil')) {
    await page.locator('#tema-dugme').click();
    await sonluAnimasyonlariBekle(page);
    expect(await ciddiAxe(page, ['[data-basari]']), 'sonuç paneli — koyu tema').toEqual([]);
    await page.locator('[data-basari]').screenshot({ path: info.outputPath('seviye-sonuc-koyu.png') });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   8–13. Etkileşim ve hareket katmanı (src/scripts/seviye-etkilesim.ts)

   Playwright'ın genel ayarı `reducedMotion: 'reduce'`tir: aşağıdaki senaryoların
   çoğu bu bağlamda koşar ve durum değişiminin hareketsiz de görünür olduğunu
   doğrular. Hareket gerektirenler kendi `test.use` bloğundadır.
   ════════════════════════════════════════════════════════════════════════════ */

test('Seçim işareti: «Bilmiyorum» aynı onayı alır, taslaktan dönen sorular işaretli gelir', async ({ page }) => {
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);

  const soru = page.locator('fieldset[data-soru="ok01"]');
  await expect(soru).not.toHaveAttribute('data-cevaplandi');
  await page.locator('#st-ok01-1').check();
  await expect(soru).toHaveAttribute('data-cevaplandi', '1');
  // Başlıktaki ✓ rozetinin yeri baştan ayrılmıştır; yalnız görünürlüğü değişir (düzen kaymaz).
  expect(await soru.locator('legend').evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('1');

  // «Bilmiyorum» tam değerinde bir cevaptır: aynı durumu ve aynı rozeti alır, soluk kalmaz.
  const ikinci = page.locator('fieldset[data-soru="ok02"]');
  await page.locator('#st-ok02-yok').check();
  await expect(ikinci).toHaveAttribute('data-cevaplandi', '1');
  expect(await ikinci.locator('legend').evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('1');

  await expect.poll(() => page.evaluate((a) => !!localStorage.getItem(a), TASLAK_ANAHTARI)).toBe(true);
  await page.reload();
  await tumunuGoster(page);
  await expect(page.locator('fieldset[data-soru="ok01"]')).toHaveAttribute('data-cevaplandi', '1');
  await expect(page.locator('fieldset[data-soru="ok02"]')).toHaveAttribute('data-cevaplandi', '1');
});

test('Kısayol: 2 tuşu etkin sorunun 2. şıkkını seçer; e-posta alanına yazılan 2 metin olarak kalır', async ({ page }) => {
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);

  await page.locator('#st-ok01-0').focus();
  await page.keyboard.press('2');
  await expect(page.locator('#st-ok01-1')).toBeChecked();
  await page.keyboard.press('0');
  await expect(page.locator('#st-ok01-yok')).toBeChecked();
  // Değiştirici tuşla basıldığında kısayol karışmaz.
  await page.keyboard.press('Control+3');
  await expect(page.locator('#st-ok01-yok')).toBeChecked();

  const eposta = page.locator('[name="profil.eposta"]');
  await eposta.fill('');
  await eposta.pressSequentially('2');
  await expect(eposta).toHaveValue('2');
});

test('Merdiven: dolan basamak tamam, atlanan basamak «atlandı» olur ve erişilebilir ad doğrudur', async ({ page }) => {
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);

  const dugum = (no) => page.locator(`[data-merdiven] [data-basamak="${no}"]`);
  await expect(page.locator('[data-merdiven] [data-basamak]')).toHaveCount(5);
  await expect(dugum(1)).toHaveAttribute('aria-label', doldurMetin(E.basamakDurum, { no: 1, n: 0, toplam: 6 }));

  expect(await hepsiniCevapla(page, basamakSecimi(1))).toBe(6);
  await expect(dugum(1)).toHaveAttribute('data-tamam', '');
  await expect(dugum(1)).toHaveAttribute('aria-label', doldurMetin(E.basamakDurum, { no: 1, n: 6, toplam: 6 }));
  await expect(dugum(2)).not.toHaveAttribute('data-tamam');

  await page.locator('input[name="okumaAtla.b2"]').check();
  await expect(dugum(2)).toHaveAttribute('data-atlandi', '');
  await expect(dugum(2)).toHaveAttribute('aria-label',
    `${doldurMetin(E.basamakDurum, { no: 2, n: 0, toplam: 6 })} — ${E.basamakAtlandi}`);

  // «Arap harflerini hiç bilmiyorum»: bütün yol soluklaşır ve açıklama görünür.
  await page.locator('input[name="atla.okuma"]').check();
  await expect(page.locator('[data-merdiven]')).toHaveAttribute('data-kapali', '');
  await expect(page.locator('.st-merdiven-not')).toHaveText(E.merdivenKapali);
  await expect(dugum(1)).toBeDisabled();
});

test('Alt şerit: sayaç, kalan süre ve eşik cümleleri güncellenir; tek sayfada gizlenir', async ({ page }) => {
  test.setTimeout(60_000);
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');

  await page.locator('[data-adim-sec="1"]').click();
  const olcum = page.locator('[data-serit-olcum]');
  await expect(olcum).toBeVisible();
  await expect(page.locator('[data-serit-sayac]')).toHaveText(doldurMetin(E.adimSayaci, { n: 0, toplam: OKUMA_SORU }));
  await expect(page.locator('[data-serit-sure]')).toHaveText(/\d+/);

  // Yarısını geçince tek `aria-live` bölgesi eşik cümlesini söyler.
  await hepsiniCevapla(page, { ...basamakSecimi(1), ...basamakSecimi(2), ...basamakSecimi(3) });
  await expect(page.locator('[data-serit-sayac]')).toHaveText(doldurMetin(E.adimSayaci, { n: 18, toplam: OKUMA_SORU }));
  await expect(page.locator('[data-serit-duyuru]')).toHaveText(E.yarisiTamam);

  await hepsiniCevapla(page, {
    ...basamakSecimi(4), ...basamakSecimi(5),
    ...Object.fromEntries(BEYAN.filter((b) => b.kume === 'okuma').map((b) => [`beyan.${b.id}`, '0'])),
  });
  await expect(page.locator('[data-serit-sayac]')).toHaveText(doldurMetin(E.adimSayaci, { n: OKUMA_SORU, toplam: OKUMA_SORU }));
  await expect(page.locator('[data-serit-duyuru]')).toHaveText(E.adimTamam);
  // Tamamlanan adım şeritte ✓ rozeti alır.
  await expect(page.locator('[data-adim-sec="1"]')).toHaveAttribute('data-tamam', '1');

  await tumunuGoster(page);
  await expect(page.locator('[data-adim-eylemler]')).toBeHidden();
});

test('Azaltılmış harekette konfeti ve kıvılcım HİÇ oluşturulmaz; akış aynen çalışır', async ({ page }) => {
  test.setTimeout(90_000);
  const gas = await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await testiDoldur(page);
  await gonder(page);

  await expect(page.locator('[data-basari]')).toBeVisible();
  await expect(page.locator('[data-sonuc]')).toBeVisible();
  expect(gas.gonderilen).toHaveLength(1);
  expect(await page.locator('.st-konfeti').count()).toBe(0);
  expect(await page.locator('.st-kivilcim').count()).toBe(0);
  // Durum yine görünür: çubuklar dolu, başlıktaki onay çizilmiş hâlde durur.
  await expect(page.locator('[data-okuma-cubuk] span[data-dolu]').first()).toBeVisible();
});

test.describe('Hareket açıkken', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Otomatik ilerleme: fare seçimi sıradaki cevapsız soruyu getirir, odak taşınmaz', async ({ page }) => {
    test.setTimeout(60_000);
    await gasTaklidi(page);
    await sayfayiAc(page, 'tr');
    await page.locator('[data-adim-sec="1"]').click();

    await page.locator('#st-ok01-0').scrollIntoViewIfNeeded();
    const once = await page.evaluate(() => window.scrollY);
    await page.locator('#st-ok01-0').click();
    await expect(page.locator('fieldset[data-soru="ok02"]')).toBeInViewport({ timeout: 4000 });
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(once);
    // Odak kullanıcıdan habersiz taşınmaz: hâlâ tıklanan şıktadır.
    await expect(page.locator('#st-ok01-0')).toBeFocused();

    // Anahtar kapatılınca kaydırma olmaz.
    await page.locator('[data-oto-ilerle]').click();
    await expect(page.locator('[data-oto-ilerle]')).toHaveAttribute('aria-checked', 'false');
    await page.locator('#st-ok02-0').scrollIntoViewIfNeeded();
    const kapali = await page.evaluate(() => window.scrollY);
    await page.locator('#st-ok02-0').click();
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.scrollY)).toBe(kapali);

    // Klavye seçimi de kaydırmaz (anahtar yeniden açık olsa bile).
    await page.locator('[data-oto-ilerle]').click();
    await expect(page.locator('[data-oto-ilerle]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('#st-ok03-0').focus();
    await page.waitForTimeout(900);                 // odaklanma kaydırması (smooth) otursun
    const klavye = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('2');
    await expect(page.locator('#st-ok03-1')).toBeChecked();
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.scrollY)).toBe(klavye);
  });

  test('Sonuç ekranı: çubuklar dolu duruma ulaşır, konfeti kendini DOM’dan kaldırır', async ({ page }) => {
    test.setTimeout(90_000);
    await gasTaklidi(page);
    await sayfayiAc(page, 'tr');
    await testiDoldur(page);
    await gonder(page);

    await expect(page.locator('[data-basari]')).toBeVisible();
    await expect(page.locator('.st-konfeti i')).toHaveCount(24);
    await expect(page.locator('.st-konfeti')).toHaveCount(0, { timeout: 6000 });

    await sonluAnimasyonlariBekle(page);
    const dolular = await page.locator('[data-okuma-cubuk] span[data-dolu]').evaluateAll(
      (liste) => liste.map((el) => getComputedStyle(el).transform));
    expect(dolular.length).toBeGreaterThan(0);
    expect(dolular.every((t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
    // Başlıktaki onay çizilen SVG'ye döner (metin simgesi kapanır).
    await expect(page.locator('[data-basari] h2 .st-onay-ciz')).toHaveCount(1);
  });

  test('Etkileşim katmanı başlatmada hata verse de doğrulama ve gönderim çalışır', async ({ page }) => {
    test.setTimeout(90_000);
    const gas = await gasTaklidi(page);
    // Katman kurulurken atılan bir hata (burada Web Animations yok) çekirdeği DURDURMAZ.
    await page.addInitScript(() => {
      Element.prototype.animate = function () { throw new Error('sınama: animate yok'); };
    });
    await sayfayiAc(page, 'tr');
    expect(await page.locator('form[data-form="seviye"]').getAttribute('data-etkilesim')).toBeNull();

    await testiDoldur(page);
    await gonder(page);
    await expect(page.locator('[data-basari]')).toBeVisible();
    expect(gas.gonderilen).toHaveLength(1);
    expect(gas.gonderilen[0].cevaplar).toEqual(cevaplarNesnesi());
  });
});

test('Merdiven, alt şerit ve anahtar görünürken erişilebilir; 360 pikselde taşma yok', async ({ page }) => {
  test.setTimeout(60_000);
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await page.locator('[data-adim-sec="1"]').click();
  await hepsiniCevapla(page, basamakSecimi(1));
  await page.locator('input[name="okumaAtla.b2"]').check();
  await expect(page.locator('[data-merdiven]')).toBeVisible();
  await expect(page.locator('[data-oto-ilerle]')).toBeVisible();
  await expect(page.locator('[data-serit-olcum]')).toBeVisible();
  await sonluAnimasyonlariBekle(page);

  expect(await ciddiAxe(page, ['main']), 'okuma adımı — açık tema').toEqual([]);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await ciddiAxe(page, ['main']), 'okuma adımı — işletim sistemi koyu teması').toEqual([]);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await ciddiAxe(page, ['main']), 'okuma adımı — elle seçilen koyu tema').toEqual([]);

  await page.setViewportSize({ width: 360, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '360 px').toBe(true);
  expect(await page.locator('[data-merdiven]').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'merdiven 360 px').toBe(true);
});

test('Kısa ekranda adıma iniş bölümü gösterir; uzun ekranda adım paneline inilir', async ({ page }) => {
  test.setTimeout(60_000);
  await gasTaklidi(page);
  await page.setViewportSize({ width: 1366, height: 640 });
  await sayfayiAc(page, 'tr');
  await page.locator('[data-adim-sec="1"]').click();
  // Adım paneli + yapışkan şerit 640 pikselde içeriğe yer bırakmaz: bölüm başlığı görünür olmalı.
  await expect(page.locator('#b-okuma h2').first()).toBeInViewport({ ratio: 1, timeout: 4000 });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator('[data-adim-sec="2"]').click();
  await expect(page.locator('[data-adim-durum]')).toBeInViewport({ ratio: 1, timeout: 4000 });
});

test('Formun sonunda alt şerit titremez: yapışıklık yerleşimi değiştirmez', async ({ page }) => {
  test.setTimeout(90_000);
  await gasTaklidi(page);
  await page.setViewportSize({ width: 1366, height: 640 });
  await sayfayiAc(page, 'tr');
  await page.locator('[data-adim-sec="9"]').click();
  await page.locator('.st-serit-nobetci').waitFor({ state: 'attached' });

  // Şerit doğal yerindeyken nöbetçinin belgedeki yeri; sonra kaydırma tam o eşiğin çevresinde BIRAKILIR.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  const dogalY = await page.evaluate(() => document.querySelector('.st-serit-nobetci').getBoundingClientRect().bottom + scrollY);
  let enCok = 0;
  const boylar = new Set();
  for (const kayma of [-40, -28, -16, -8, -2, 4]) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(150);
    const [degisim, boy] = await page.evaluate(async ([y, k]) => {
      const s = document.querySelector('.st-serit');
      let say = 0;
      const g = new MutationObserver((m) => { say += m.length; });
      g.observe(s, { attributes: true, attributeFilter: ['data-yapisik'] });
      scrollTo(0, y - innerHeight + k);
      await new Promise((c) => setTimeout(c, 700));
      g.disconnect();
      return [say, Math.round(s.getBoundingClientRect().height)];
    }, [dogalY, kayma]);
    enCok = Math.max(enCok, degisim);
    boylar.add(boy);
  }
  // Tek geçişte en çok bir yapış + bir çöz olur; 21 Eyl 2026 öncesinde bu sayı 30'u aşıyordu.
  expect(enCok).toBeLessThanOrEqual(2);
  expect(boylar.size, 'şerit yüksekliği yapışıkken de aynı kalır').toBe(1);
});

/* ---------- Sesli okuma (okumakta zorlananlar için) ---------- */

test('Soru metnine ya da hoparlöre dokununca sorunun yerel klibi çalar; cevap verince ve öteki ses başlayınca susar', async ({ page }) => {
  test.setTimeout(60_000);
  // Çalma kararlı olsun: gerçek ses çözücüye bağlı kalmadan hangi dosyanın istendiğini kaydet.
  await page.addInitScript(() => {
    window.__calinan = [];
    HTMLMediaElement.prototype.play = function play() { window.__calinan.push(this.src); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function pause() {};
  });
  await gasTaklidi(page);
  await sayfayiAc(page, 'tr');
  await tumunuGoster(page);

  // Okuma bölümü dışından bir soru: klibi soru kökü + şıkları taşır.
  const soru = page.locator('section.ucf-bolum:not(#b-okuma) fieldset[data-soru]:has(button[data-oku])').first();
  const dugme = soru.locator('button[data-oku]');
  await expect(dugme).toHaveAttribute('aria-label', M.soru.sesliDinle);
  const yol = await dugme.getAttribute('data-oku');
  expect(yol).toMatch(/^\/media\/ses\/seviye\/tr\/[0-9a-f]{16}\.mp3$/);
  const dosya = await page.evaluate(async (y) => { const r = await fetch(y); return { durum: r.status, boy: (await r.arrayBuffer()).byteLength }; }, yol);
  expect(dosya.durum).toBe(200);
  expect(dosya.boy).toBeGreaterThan(5000);

  // 1) Soru METNİNE dokunmak okutur.
  await soru.locator('.st-soru-metin').click();
  await expect(dugme).toHaveAttribute('aria-pressed', 'true');
  await expect(soru).toHaveAttribute('data-okunuyor', '1');
  expect(await page.evaluate(() => window.__calinan.at(-1))).toContain(yol);
  // 2) Aynı düğmeye ikinci dokunuş durdurur.
  await dugme.click();
  await expect(dugme).toHaveAttribute('aria-pressed', 'false');
  await expect(soru).not.toHaveAttribute('data-okunuyor', '1');
  // 3) Cevap verilince okuma susar.
  await dugme.click();
  await expect(dugme).toHaveAttribute('aria-pressed', 'true');
  await soru.locator('input[type="radio"]').first().check({ force: true });
  await expect(dugme).toHaveAttribute('aria-pressed', 'false');
  // 4) Diyanet «Dinle» düğmesi başlayınca sesli okuma susar (iki ses üst üste binmez).
  await dugme.click();
  await expect(dugme).toHaveAttribute('aria-pressed', 'true');
  await page.locator('button[data-ses]').first().click();
  await expect(dugme).toHaveAttribute('aria-pressed', 'false');

  // Üretilmiş ses Arapça OKUMAZ: okuma bölümündeki klipler yalnız soru kökünü taşır (kısa dosya).
  const okumaYolu = await page.locator('#b-okuma fieldset[data-soru] button[data-oku]').first().getAttribute('data-oku');
  if (okumaYolu) {
    const boy = await page.evaluate(async (y) => (await (await fetch(y)).arrayBuffer()).byteLength, okumaYolu);
    expect(boy).toBeLessThan(60_000);
  }
});
