/**
 * İlim Yolu «Yeni Müslüman yolu» hesap akışları (11 Kasım 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı, gerçek CSP altında, dış ağ kesik.
 * Girişli durum emülatörsüz SAHTE istemciyle kurulur: saklı oturum (IndexedDB) tohumlanır, Auth `accounts:lookup` ve Firestore REST uçları
 * `page.route` ile bellekte yanıtlanır (gerçek Firebase'e hiçbir istek gitmez). Sabitlenenler:
 *  - girişli + cihazda hesapta olmayan işaret → BİR kez «hesabınıza ekleyelim mi?»; sorulmadan buluta yazılmaz; evet = birleşim (hesaptakiler silinmez),
 *    anonim kopya kalkar; «şimdi değil» hatırlanır ve yenilemede yeniden sorulmaz; Esc = şimdi değil; klavye ve odak;
 *  - «İşaretlerimi silin»: onay paneli (alert/confirm yok), odak «Vazgeçin»de, Esc iptal eder; onayda cihaz ve hesap belgesi silinir, boş durum + duyuru;
 *  - hesapsız silme yalnız cihazı temizler ve Firebase yüklemez; iki dilde (tr, fr) metinler; CSP ihlali 0; axe.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

const KOK = 'http://127.0.0.1:4402';
const API_ANAHTARI = 'AIzaSyDQUXxjs_SovTuAx1hyfW9nhd7bDUdcXfk';
const UID = 'u-sahte-yol-1';
const OZET = createHash('sha256').update(UID).digest('hex').slice(0, 32);
const ANON = 'ilim:y12:v1';
const HESAP = `${ANON}:u:${OZET}`;
const DURUM = `ilim:y12:d:v1:u:${OZET}`;
const BELGE = `kullanicilar/${UID}/ozel/yol12`;

test.use({ viewport: { width: 360, height: 800 } });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = () => `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ user_id: UID, sub: UID, iat: 1, exp: 4102444800, firebase: { sign_in_provider: 'password' } })}.x`;
const CORS = { 'access-control-allow-origin': KOK, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };

/** Firestore REST değerleri ↔ düz nesne (yalnız bu belgenin biçimi: v, maddeler{hNN: dize}, guncelleme). */
const alanlar = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { stringValue: v }]));
const duzle = (f) => Object.fromEntries(Object.entries(f?.maddeler?.mapValue?.fields ?? {}).map(([k, v]) => [k, v.stringValue]));

/** Sahte Firebase: `bulut.doc` = null | { maddeler }. `istekler`: yapılan Firestore işlemleri. */
async function sahteBulut(context, { maddeler = null } = {}) {
  const bulut = { doc: maddeler ? { ...maddeler } : null, islemler: [] };
  await context.route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firestore\.googleapis\.com/, async (r) => {
    const req = r.request();
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    const url = req.url();
    if (/accounts:lookup/.test(url)) {
      return r.fulfill({ headers: CORS, body: JSON.stringify({ users: [{ localId: UID, email: 'yol@example.test', emailVerified: true, providerUserInfo: [{ providerId: 'password', federatedId: 'yol@example.test', email: 'yol@example.test', rawId: 'yol@example.test' }], lastLoginAt: '1', createdAt: '1' }] }) });
    }
    if (/securetoken/.test(url)) return r.fulfill({ headers: CORS, body: JSON.stringify({ access_token: jwt(), id_token: jwt(), refresh_token: 'r', expires_in: '3600', user_id: UID }) });
    const govde = req.postData() ? JSON.parse(req.postData()) : {};
    if (/:beginTransaction/.test(url)) return r.fulfill({ headers: CORS, body: JSON.stringify({ transaction: 'dHg=' }) });
    if (/:batchGet/.test(url)) {
      bulut.islemler.push('oku');
      const ad = `projects/ulucamii-portal/databases/(default)/documents/${BELGE}`;
      const sonuc = bulut.doc ? { found: { name: ad, fields: { v: { integerValue: '1' }, maddeler: { mapValue: { fields: alanlar(bulut.doc) } } }, createTime: '2026-11-11T00:00:00Z', updateTime: '2026-11-11T00:00:00Z' }, readTime: '2026-11-11T00:00:00Z' } : { missing: ad, readTime: '2026-11-11T00:00:00Z' };
      return r.fulfill({ headers: CORS, body: JSON.stringify([sonuc]) });
    }
    if (/:commit/.test(url)) {
      for (const w of govde.writes ?? []) {
        // Yalnız bu yolun belgesi sayılır (profil `sonGiris` damgası gibi başka yazımlar `diger`).
        const ad = w.delete ?? w.update?.name ?? '';
        if (!ad.endsWith(`/${BELGE}`)) bulut.islemler.push('diger');
        else if (w.delete) { bulut.islemler.push('sil'); bulut.doc = null; }
        else if (w.update) { bulut.islemler.push('yaz'); bulut.doc = duzle(w.update.fields); }
      }
      return r.fulfill({ headers: CORS, body: JSON.stringify({ writeResults: (govde.writes ?? []).map(() => ({ updateTime: '2026-11-11T00:00:01Z' })), commitTime: '2026-11-11T00:00:01Z' }) });
    }
    if (/:rollback/.test(url)) return r.fulfill({ headers: CORS, body: '{}' });
    return r.abort();
  });
  return bulut;
}

/** Saklı Auth oturumu (IndexedDB) + oturum işareti + isteğe bağlı cihaz kopyaları. */
const tohumla = (context, { anonim, hesap, durum } = {}) => context.addInitScript(([apiKey, uid, ozet, anon, hes, dur, anonAnahtar, hesapAnahtar, durumAnahtar, jeton]) => {
  localStorage.setItem('ilimYolu:oturum', ozet);
  if (!sessionStorage.getItem('__tohum')) {
    sessionStorage.setItem('__tohum', '1');
    if (anon) localStorage.setItem(anonAnahtar, JSON.stringify(anon));
    if (hes) localStorage.setItem(hesapAnahtar, JSON.stringify(hes));
    if (dur) localStorage.setItem(durumAnahtar, JSON.stringify(dur));
  }
  const kullanici = {
    uid, email: 'yol@example.test', emailVerified: true, displayName: null, isAnonymous: false, photoURL: null, phoneNumber: null, tenantId: null,
    providerData: [{ providerId: 'password', uid: 'yol@example.test', displayName: null, email: 'yol@example.test', phoneNumber: null, photoURL: null }],
    stsTokenManager: { refreshToken: 'r', accessToken: jeton, expirationTime: Date.now() + 3_000_000 },
    createdAt: '1', lastLoginAt: '1', apiKey, appName: 'ilim',
  };
  const ac = indexedDB.open('firebaseLocalStorageDb', 1);
  ac.onupgradeneeded = () => ac.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
  ac.onsuccess = () => { ac.result.transaction('firebaseLocalStorage', 'readwrite').objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:ilim`, value: kullanici }); };
}, [API_ANAHTARI, UID, OZET, anonim ?? null, hesap ?? null, durum ?? null, ANON, HESAP, DURUM, jwt()]);

const istekler = [];
test.beforeEach(async ({ context }) => {
  istekler.length = 0;
  await context.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.origin === KOK) return r.continue();
    istekler.push(u.href);
    return r.abort();
  });
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const depo = (page, a) => page.evaluate((k) => localStorage.getItem(k), a);
const IL = (maddeler) => ({ v: 1, maddeler });
const YOL = (dil) => `/${dil}/yollar/yeni-musluman/`;

for (const dil of ['tr', 'fr']) {
  test(`${dil}: girişli + cihazda hesapta olmayan işaret → bir kez sorulur; evet = birleşim, hesaptakiler silinmez, anonim kalkar`, async ({ page, context }) => {
    const bulut = await sahteBulut(context, { maddeler: { h02: '0001', h09: '1' } });
    await tohumla(context, { anonim: IL({ h01: '1', h03: '001' }) });
    await page.goto(YOL(dil));
    const panel = page.locator('[data-yy-teklif] [data-soru]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-soru-evet]')).toBeFocused();
    await expect(panel).toContainText(dil === 'tr' ? 'Bu cihazdaki işaretleri hesabınıza ekleyelim mi?' : 'Ajouter à votre compte les repères de cet appareil');
    expect(bulut.islemler, 'sorulmadan buluta yazılmadı').not.toContain('yaz');
    expect(bulut.doc.h01).toBeUndefined();
    await page.screenshot({ path: `test-results/egitim/yy-teklif-${dil}.png`, fullPage: false });
    await panel.locator('[data-soru-evet]').click();
    await expect(panel).toBeHidden();
    await expect(page.locator('[data-yy-bilgi]')).toContainText(dil === 'tr' ? 'eklendi' : 'ajoutés');
    await expect(page.locator('[data-yy-bilgi]')).toBeFocused();
    await expect.poll(() => bulut.doc?.h01).toBe('1');
    expect(bulut.doc).toMatchObject({ h01: '1', h02: '0001', h03: '001', h09: '1' });
    expect(await depo(page, ANON)).toBeNull();
    expect(JSON.parse(await depo(page, HESAP)).maddeler).toMatchObject({ h01: '1', h02: '0001', h03: '001' });
    await expect(page.locator('li[data-hafta="h02"]')).toHaveAttribute('data-tamam', '1');
    await page.reload();
    await expect(panel).toBeHidden();
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    // Firebase Auth SDK'sı Google oturum betiğini (apis.google.com) ister; kesik ağda iptal olur. Başka dış istek yok.
    expect(istekler.filter((u) => new URL(u).hostname !== 'apis.google.com')).toEqual([]);
  });
}

test('«şimdi değil» (düğme ve Esc) hatırlanır: yenilemede sorulmaz, anonim kopya cihazda kalır, buluta HİÇ yazılmaz; yeni işaret gelince yeniden sorulur', async ({ page, context }) => {
  const bulut = await sahteBulut(context, { maddeler: { h02: '0001' } });
  await tohumla(context, { anonim: IL({ h01: '1' }) });
  await page.goto(YOL('tr'));
  const panel = page.locator('[data-yy-teklif] [data-soru]');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.locator('[data-yy-bilgi]')).toContainText('yalnız bu cihazda kalıyor');
  expect(JSON.parse(await depo(page, DURUM))).toEqual({ s: 1 });
  expect(JSON.parse(await depo(page, ANON)).maddeler).toEqual({ h01: '1' });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(panel).toBeHidden();
  expect(bulut.islemler).not.toContain('yaz');
  expect(bulut.doc).toEqual({ h02: '0001' });
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ v: 1, maddeler: { h01: '1', h05: '001' } })), ANON);
  await page.reload();
  await expect(panel).toBeVisible();
  await panel.locator('[data-soru-hayir]').click();
  expect(JSON.parse(await depo(page, DURUM))).toEqual({ s: 2 });
});

test('girişli ama cihazda yeni işaret yok → soru yok', async ({ page, context }) => {
  await sahteBulut(context, { maddeler: { h02: '0001' } });
  await tohumla(context, { hesap: IL({ h02: '0001' }) });
  await page.goto(YOL('tr'));
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-yy-teklif] [data-soru]')).toBeHidden();
  await expect(page.locator('li[data-hafta="h02"]')).toHaveAttribute('data-tamam', '1');
});

for (const dil of ['tr', 'fr']) {
  test(`${dil}: hesapsız silme: onay paneli, odak vazgeçte, Esc iptal; onayda cihaz temizlenir, boş durum ve duyuru; Firebase yüklenmez; alert/confirm yok`, async ({ page }) => {
    const iletisimler = [];
    page.on('dialog', (d) => { iletisimler.push(d.type()); void d.dismiss(); });
    await page.addInitScript(([a]) => { if (!sessionStorage.getItem('__t')) { sessionStorage.setItem('__t', '1'); localStorage.setItem(a, JSON.stringify({ v: 1, maddeler: { h01: '0001', h02: '1' } })); } }, [ANON]);
    await page.goto(YOL(dil));
    await expect(page.locator('li[data-hafta="h01"]')).toHaveAttribute('data-tamam', '1');
    const dugme = page.locator('[data-yy-sil]');
    await expect(dugme).toHaveText(dil === 'tr' ? 'Bu cihazdaki izleri silin' : 'Effacer les traces sur cet appareil');
    // Eski sürümün bıraktığı sayfa kopyası + «kaydet» künyesi ve ilgisiz bir sayfa kopyası: yalnız yola ait olanlar silinir.
    await page.evaluate(async () => {
      const c = await caches.open('ezber-kabuk-deneme');
      for (const y of ['/tr/yollar/yeni-musluman/h05/', '/fr/yollar/yeni-musluman/', '/tr/ezber/']) await c.put(location.origin + y, new Response('x'));
      await (await caches.open('ezber-kayit-v1')).put('/cevrimdisi-kayit/tr/yeni-musluman', new Response('{}'));
    });
    await page.evaluate(() => localStorage.setItem('ulucamii:yeniyol:cihaz:v1', '{"v":1,"maddeler":{"h03":"1"}}'));
    await dugme.click();
    const panel = page.locator('[data-yy-sil-panel] [data-soru]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-soru-hayir]')).toBeFocused();
    await expect(panel.locator('[data-soru-metin]')).toHaveText(dil === 'tr' ? 'Bu cihazdaki izler silinsin mi?' : 'Effacer les traces sur cet appareil ?');
    await page.screenshot({ path: `test-results/egitim/yy-sil-${dil}.png` });
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(dugme).toBeFocused();
    expect(await depo(page, ANON)).not.toBeNull();
    await dugme.click();
    await panel.locator('[data-soru-evet]').click();
    await expect(panel).toBeHidden();
    await expect(page.locator('[data-yy-bilgi]')).not.toBeEmpty();
    expect(await depo(page, ANON)).toBeNull();
    expect(await page.evaluate(async () => {
      const kalan = [];
      for (const ad of await caches.keys()) for (const i of await (await caches.open(ad)).keys()) kalan.push(new URL(i.url).pathname);
      return kalan.sort();
    })).toEqual(['/tr/ezber/']);
    await expect(page.locator('li[data-hafta="h01"]')).toHaveAttribute('data-tamam', '0');
    await expect(page.locator('[data-yy-ilerleme]')).toHaveText(dil === 'tr' ? '0 / 12 hafta tamamlandı' : /^0\s\/\s12/);
    await expect(page.locator('[data-yy-bilgi]')).toHaveText(dil === 'tr' ? 'Bu cihazdaki izler silindi.' : 'Les traces sur cet appareil ont été effacées.');
    await expect(page.locator('[data-yy-bilgi]')).toBeFocused();
    await page.screenshot({ path: `test-results/egitim/yy-bos-${dil}.png` });
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /^(ilim:y12|ulucamii:yeniyol)/.test(k)))).toEqual([]);
    expect(iletisimler).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    expect(istekler).toEqual([]);
  });
}

test('girişli silme: onaydan sonra cihaz kopyaları ve hesap belgesi silinir; yenilemede işaret geri gelmez', async ({ page, context }) => {
  const bulut = await sahteBulut(context, { maddeler: { h02: '0001', h07: '0003' } });
  await tohumla(context, { anonim: IL({ h01: '1' }), hesap: IL({ h02: '0001' }), durum: { s: 1 } });
  await page.goto(YOL('tr'));
  await expect(page.locator('li[data-hafta="h02"]')).toHaveAttribute('data-tamam', '1');
  await page.locator('[data-yy-sil]').click();
  const panel = page.locator('[data-yy-sil-panel] [data-soru]');
  await expect(panel.locator('[data-soru-not]')).toContainText('hesabınızdaki');
  await panel.locator('[data-soru-evet]').click();
  await expect(page.locator('[data-yy-bilgi]')).toHaveText('Bu cihazdaki izler silindi.');
  expect(bulut.doc).toBeNull();
  expect(bulut.islemler).toContain('sil');
  expect(await depo(page, ANON)).toBeNull();
  expect(await depo(page, HESAP)).toBeNull();
  expect(await depo(page, DURUM)).toBeNull();
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-yy-ilerleme]')).toHaveText('0 / 12 hafta tamamlandı');
  expect(bulut.doc).toBeNull();
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});

test('axe: teklif paneli ve silme paneli açıkken, iki tema', async ({ page, context }) => {
  await sahteBulut(context, {});
  await tohumla(context, { anonim: IL({ h01: '1' }) });
  await page.goto(YOL('tr'));
  const teklif = page.locator('[data-yy-teklif] [data-soru]');
  await expect(teklif).toBeVisible();
  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema });
    const s = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(s.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`), tema).toEqual([]);
  }
  await page.keyboard.press('Escape');
  await page.locator('[data-yy-sil]').click();
  await expect(page.locator('[data-yy-sil-panel] [data-soru]')).toBeVisible();
  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema });
    const s = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(s.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`), tema).toEqual([]);
  }
});
