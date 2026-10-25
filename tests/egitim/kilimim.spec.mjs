/**
 * Kilimim · kendi çalışmam (25 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı. Kilim, bu cihazdaki çalışma kaydından çizilir;
 * hesap, sunucu ve ağ yoktur. Hocanın verdiği basamak DEĞİLDİR. Burada sabitlenenler:
 *  - beş dilde sayfa açılır (başlık, kanonik adres, hreflang); kayıt yokken boş durum; kayıtla her hücrenin dokusu cihazdaki `son`/`kutu`dan gelir
 *    (0 çalışılmadı · 1 başladım · 2 tekrar takvimine girdi · 3 son basamakta), açıklama ve özet doğru sayar;
 *  - HOCANIN DEĞERLENDİRMESİNE BENZEMEZ: rozet/mühür/altın kenar yok, hocanın basamak adları ve «sertifika» hiçbir dilde geçmez, zorunlu cümle
 *    («Hocanın dinlediği ezberler veli portalındaki kilimde görünür») sayfada ve kâğıtta;
 *  - sayfa cihaz hafızasına YAZMAZ, ağa dış istek atmaz, ad hiçbir istekte geçmez; depolama kapalıyken ve bozuk kayıtta bozulmaz; betik kapalıyken açıklama kalır;
 *  - metin karşılığı (şerit şerit) bağlantılıdır ve klavyeyle gezilir; kilimdeki bağlantılar yalnız fare/dokunma içindir (tab sırasında yok);
 *  - yazdırma: yalnız A4 dikey kâğıt, tek sayfa, piksel görsel YOK (`pdfimages -list`), koyu temada da beyaz kâğıt;
 *  - iki temada axe, 320 px'te yatay taşma yok; alt bilgi, «Bugün tekrar», madde sayfası ve Çalışma Belgesi ile çift yönlü bağlantılar.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KOK = 'http://127.0.0.1:4402';
const SITE = 'https://egitim.ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ANAHTAR = 'ulucamii:ezber:cihaz:v1';
const BUGUN = new Date(2026, 9, 25, 11, 0, 0);
const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const SAYFALI = katalog.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.metinli || o.bilgiMetni);
const SAYFASIZ = katalog.ogeler.filter((o) => !SAYFALI.includes(o));
const ad = (id, dil) => katalog.ogeler.find((o) => o.id === id).ad[dil];

const BASLIK = { tr: 'Kilimim · kendi çalışmam', fr: 'Mon kilim · mon travail personnel', en: 'My kilim · my own practice', nl: 'Mijn kelim · mijn eigen oefening', de: 'Mein Kelim · mein eigenes Üben' };
const FARK = {
  tr: 'Hocanın dinlediği ezberler veli portalındaki kilimde görünür.',
  fr: 'Les textes écoutés par l’enseignant apparaissent dans le kilim du portail des parents.',
  en: 'The texts a teacher has listened to appear in the kilim in the parents’ portal.',
  nl: 'De teksten waarnaar een leerkracht heeft geluisterd, staan in de kelim in het ouderportaal.',
  de: 'Die Texte, denen eine Lehrkraft zugehört hat, erscheinen im Kelim des Elternportals.',
};
// Hocanın basamak adları ve ödül sözcükleri bu sayfada hiçbir dilde geçmez.
const HOCA = /Çalışıyor|Hocaya okudu|Pekişti|Kalıcı|rozet|mühür|sertifika|En apprentissage|Récité|Consolidé|Acquis durablement|insigne|sceau|certificat|Recited to the teacher|Consolidated|Firmly memorised|badge|\bseal\b|certificate|Opgezegd bij|Verstevigd|Blijvend gekend|zegel|certificaat|Beim Lehrer|Gefestigt|Dauerhaft gelernt|Abzeichen|Siegel|Zertifikat/i;
const LEJANT = {
  tr: ['Çalışılmadı', 'Çalışmaya başladım', 'Tekrar takvimine girdi (1–4 / 5)', 'Son tekrar basamağında (5 / 5)'],
  fr: ['Pas encore travaillé', 'J’ai commencé à travailler', 'Entré dans le calendrier de révision (1 à 4 sur 5)', 'À la dernière étape de révision (5 sur 5)'],
  en: ['Not practised yet', 'I have started practising', 'In my review schedule (stage 1–4 of 5)', 'At the last review stage (5 of 5)'],
  nl: ['Nog niet geoefend', 'Ik ben begonnen met oefenen', 'In mijn herhaalschema (stap 1–4 van 5)', 'Op de laatste herhaalstap (5 van 5)'],
  de: ['Noch nicht geübt', 'Ich habe angefangen zu üben', 'In meinem Wiederholungsplan (Stufe 1–4 von 5)', 'Auf der letzten Wiederholungsstufe (5 von 5)'],
};
const norm = (s) => s.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

const an = (g, s = 10) => new Date(2026, 9, g, s, 0, 0).getTime();
// Beklenen dokular: s-ihlas kutu −1 → 1 · s-fatiha kutu 2 → 2 (3 / 5) · s-nas kutu 4 → 3 (5 / 5) · s-felak kutu 0 → 2 (1 / 5) · d-amentu kayıt var, son yok → 0
const KAYIT = {
  's-ihlas': { kutu: -1, son: an(25) }, 's-fatiha': { kutu: 2, son: an(24) }, 's-nas': { kutu: 4, son: an(20) }, 's-felak': { kutu: 0, son: an(22) },
};
const BEKLENEN = { 's-ihlas': 1, 's-fatiha': 2, 's-nas': 3, 's-felak': 2, 's-kevser': 0 };
const durumKur = (kayit = KAYIT, gunler = ['2026-10-12', '2026-10-24', '2026-10-25']) => ({
  v: 1, ar: 1, gunler,
  maddeler: Object.fromEntries(Object.entries(kayit).filter(([id]) => SAYFALI.some((o) => o.id === id)).map(([id, a]) => [id, { kip: 'sina', sonraki: a.kutu >= 0 ? '2026-11-05' : '', ...a }])),
});
const cokluDurum = (n) => durumKur(Object.fromEntries(SAYFALI.slice(0, n).map((o, i) => [o.id, { kutu: ((i % 6) - 1), son: an(25 - (i % 9)) }])));
const tohumla = (page, durum) => page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durum]);
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
  await page.clock.setFixedTime(BUGUN);
});

test.describe('sayfa ve boş durum', () => {
  for (const dil of DILLER) {
    test(`${dil}: açılır, başlık, kanonik adres, hreflang, zorunlu cümle; kayıt yokken boş durum`, async ({ page }) => {
      await page.goto(`/${dil}/kilimim/`);
      await expect(page.locator('h1')).toHaveText(BASLIK[dil]);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/${dil}/kilimim/`);
      expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(6);
      await expect(page.locator('.km-fark')).toHaveText(FARK[dil]);
      await expect(page.locator('[data-km-bos]')).toBeVisible();
      await expect(page.locator('[data-km-dolu]')).toBeHidden();
      await expect(page.locator('[data-km-bos] a.birincil')).toHaveAttribute('href', `/${dil}/calis/s-fatiha/`);
      await expect(page.locator('[data-km-bos] a.ikincil')).toHaveAttribute('href', `/${dil}/#seritler`);
      await expect(page.locator('.km-gizlilik')).toBeVisible();
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('dil geçişi aynı sayfaya gider', async ({ page }) => {
    await page.goto('/tr/kilimim/');
    for (const d of ['fr', 'en', 'nl', 'de']) await expect(page.locator(`.diller a[hreflang="${d}"]`)).toHaveAttribute('href', `/${d}/kilimim/`);
  });

  test('betik kapalıyken açıklama ve zorunlu cümle kalır, kilim bölümü görünmez, JavaScript uyarısı çıkar', async ({ browser }) => {
    const baglam = await browser.newContext({ javaScriptEnabled: false, baseURL: KOK });
    const sayfa = await baglam.newPage();
    await sayfa.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    await sayfa.goto('/tr/kilimim/');
    await expect(sayfa.locator('h1')).toHaveText(BASLIK.tr);
    await expect(sayfa.locator('.km-fark')).toBeVisible();
    await expect(sayfa.locator('[data-kilimim]')).toBeHidden();
    await expect(sayfa.locator('.km-js')).toBeVisible();
    await baglam.close();
  });

  test('depolama kapalıyken ve bozuk kayıtta sayfa bozulmaz, boş durumla açılır; kayıtsız madde ve «son»suz kayıt çalışılmış sayılmaz', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('kapalı', 'SecurityError'); } });
    });
    await page.goto('/tr/kilimim/');
    await expect(page.locator('[data-km-bos]')).toBeVisible();
    const baglam = await page.context().browser().newContext({ baseURL: KOK });
    const p2 = await baglam.newPage();
    await p2.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    await p2.addInitScript(([k]) => localStorage.setItem(k, '{bozuk'), [ANAHTAR]);
    await p2.goto('/tr/kilimim/');
    await expect(p2.locator('[data-km-bos]')).toBeVisible();
    await p2.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durumKur({ 's-ihlas': { kutu: 3, son: 0 }, 'x-yok-boyle-madde': { kutu: 1, son: an(25) } })]);
    await p2.goto('/tr/kilimim/');
    await expect(p2.locator('[data-km-bos]')).toBeVisible();
    await baglam.close();
  });
});

test.describe('kayıtla', () => {
  for (const dil of DILLER) {
    test(`${dil}: hücre dokuları cihazdaki kayıttan gelir; açıklama ve özet doğru; hocanın terimleri yok`, async ({ page }) => {
      await tohumla(page, durumKur());
      await page.goto(`/${dil}/kilimim/`);
      await expect(page.locator('[data-km-dolu]')).toBeVisible();
      await expect(page.locator('[data-km-bos]')).toBeHidden();
      const kilim = page.locator('svg.ezber-kilim.kl-kendi');
      await expect(kilim).toHaveAttribute('role', 'img');
      for (const [id, doku] of Object.entries(BEKLENEN)) {
        const hucre = kilim.locator(`g.kl-oge[data-id="${id}"]`);
        await expect(hucre, id).toHaveAttribute('data-doku', String(doku));
        await expect(hucre.locator('use.kl-m'), id).toHaveClass(new RegExp(`kl-k${doku}\\b`));
      }
      // Her hücrenin başlığı «ad, kendi durumu»; 3 / 5 basamağı ve 5 / 5 yazılır.
      const baslik = async (id) => norm(await kilim.locator(`g.kl-oge[data-id="${id}"] > title`).textContent());
      expect(await baslik('s-fatiha')).toContain(`${norm(ad('s-fatiha', dil))}, `);
      expect(await baslik('s-fatiha')).toContain('3');
      expect(await baslik('s-nas')).toContain('5');
      // Dört dokunun açıklaması sayfa dilinde; ödül yuvası yok.
      expect((await page.locator('.kilim-lejant-kendi li span').allTextContents()).map(norm)).toEqual(LEJANT[dil].map(norm));
      await expect(page.locator('.km-kilim-kutu .kl-odul, .km-kilim-kutu .kl-altin')).toHaveCount(0);
      // Özet: 4 başlanan, 3 takvimde (kutu 0, 2, 4), son üç haftada 3 gün; SVG açıklaması aynı.
      const ozet = norm(await page.locator('[data-km-ozet]').innerText());
      expect(ozet).toContain(`${SAYFALI.length}`);
      expect(await page.locator('[data-km-ozet] li').count()).toBe(3);
      expect(norm(await kilim.locator('> desc').textContent())).toBe(norm((await page.locator('[data-km-ozet] li').allTextContents()).join(' · ')));
      // Hocanın değerlendirmesine ait hiçbir terim sayfanın görünen metninde ya da erişilebilir adlarında yok.
      // Çalışma Belgesi'ne giden bağlantı (başka, kendi çalışmayı belgeleyen sayfa) kapsam dışıdır.
      const gorunen = await page.locator('main').evaluate((e) => { const k = e.cloneNode(true); k.querySelector('.km-bag')?.remove(); return k.textContent + ' ' + [...k.querySelectorAll('title, desc')].map((x) => x.textContent).join(' '); });
      expect(gorunen).not.toMatch(HOCA);
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('tr: özet sayıları birebir (4 başlandı / 3 takvimde / son üç haftada 3 gün) ve kayıtsız hücre «çalışılmadı»', async ({ page }) => {
    await tohumla(page, durumKur());
    await page.goto('/tr/kilimim/');
    await expect(page.locator('[data-km-ozet] li')).toHaveText([`Çalışmaya başlanan ezber: 4 / ${SAYFALI.length}`, 'Tekrar takviminde: 3', 'Son üç haftada çalışılan gün: 3']);
    expect(norm(await page.locator('svg.kl-kendi g.kl-oge[data-id="s-kevser"] > title').textContent())).toBe(`${ad('s-kevser', 'tr')}, çalışılmadı`);
    expect(norm(await page.locator('svg.kl-kendi g.kl-oge[data-id="s-nas"] > title').textContent())).toBe(`${ad('s-nas', 'tr')}, son tekrar basamağında (5 / 5)`);
    expect(norm(await page.locator('svg.kl-kendi g.kl-oge[data-id="s-felak"] > title').textContent())).toBe(`${ad('s-felak', 'tr')}, tekrar takvimine girdi (1 / 5)`);
    // Çalışma sayfası olmayan madde (el ile hocayla çalışılır) kilimde durur ama «çalışılmadı» denmez.
    if (SAYFASIZ[0]) {
      expect(norm(await page.locator(`svg.kl-kendi g.kl-oge[data-id="${SAYFASIZ[0].id}"] > title`).textContent())).toBe(`${ad(SAYFASIZ[0].id, 'tr')}, çalışma sayfası yok`);
    }
  });

  test('metin karşılığı: şerit şerit, her madde kendi durumuyla ve çalışma sayfası bağlantısıyla; sayaçlar kayda uyar', async ({ page }) => {
    await tohumla(page, durumKur());
    await page.goto('/tr/kilimim/');
    await page.locator('.km-seritler > summary').click();
    const li = (id) => page.locator(`.km-maddeler li[data-id="${id}"]`);
    await expect(li('s-fatiha').locator('a.km-madde-ad')).toHaveAttribute('href', '/tr/calis/s-fatiha/');
    await expect(li('s-fatiha')).toHaveAttribute('data-doku', '2');
    expect(norm(await li('s-fatiha').locator('.km-durum').innerText())).toMatch(/^tekrar takvimine girdi \(3 \/ 5\) · son çalışma: 24 Ekim 2026$/);
    expect(norm(await li('s-nas').locator('.km-durum').innerText())).toMatch(/^son tekrar basamağında \(5 \/ 5\) · son çalışma: 20 Ekim 2026$/);
    expect(norm(await li('s-ihlas').locator('.km-durum').innerText())).toMatch(/^çalışmaya başladım · son çalışma: 25 Ekim 2026$/);
    expect(norm(await li('s-kevser').locator('.km-durum').innerText())).toBe('çalışılmadı');
    // Toplam: sayaçlardaki başlananların toplamı 4.
    const sayaclar = (await page.locator('[data-km-sayac]').allTextContents()).map((s) => Number(s.split('/')[0]));
    expect(sayaclar.reduce((a, b) => a + b, 0)).toBe(4);
    // Her madde listede tam bir kez.
    expect(await page.locator('.km-maddeler li').count()).toBe(katalog.ogeler.length);
  });

  test('kilimde odaklanabilir öğe yok (role=img); hücreye tıklayınca çalışma sayfasına gider; klavye listeden', async ({ page }) => {
    await tohumla(page, durumKur());
    await page.goto('/tr/kilimim/');
    expect(await page.locator('svg.kl-kendi g.kl-oge[data-href]').count()).toBe(SAYFALI.length);
    expect(await page.locator('svg.kl-kendi a, svg.kl-kendi [tabindex]').count()).toBe(0);
    // Klavyeyle: Tab ile sayfada ilerlerken kilim içindeki hiçbir bağlantıya odaklanılmaz.
    const odak = new Set();
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      odak.add(await page.evaluate(() => (document.activeElement?.closest('svg.kl-kendi') ? 'kilim' : document.activeElement?.tagName)));
    }
    expect(odak.has('kilim')).toBe(false);
    // Liste klavyeyle açılır ve bağlantıları odaklanabilir.
    await page.locator('.km-seritler > summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.km-seritler')).toHaveAttribute('open', '');
    await page.locator('.km-maddeler li[data-id="s-ihlas"] a').focus();
    await expect(page.locator('.km-maddeler li[data-id="s-ihlas"] a')).toBeFocused();
    // Fareyle kilimdeki hücre.
    await page.locator('svg.kl-kendi g.kl-oge[data-id="s-ihlas"]').click();
    await expect(page).toHaveURL(/\/tr\/calis\/s-ihlas\/$/);
  });
});

test.describe('gizlilik: kayıt ve ad cihazdan çıkmaz, sayfa yazmaz', () => {
  test('ad hiçbir istekte geçmez, depoya ve çereze yazılmaz; yenileyince silinir; kâğıttaki ad satırına gider', async ({ page }) => {
    const AD = 'Zeynep Çelik-Örnek';
    const istekler = [];
    page.on('request', (r) => istekler.push(`${r.method()} ${r.url()} ${r.postData() ?? ''} ${JSON.stringify(r.headers())}`));
    await tohumla(page, durumKur());
    await page.goto('/tr/kilimim/');
    const once = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    await page.fill('[data-km-ad]', AD);
    await expect(page.locator('[data-km-ad-yaz]')).toHaveText(AD);
    await page.locator('.km-seritler > summary').click();
    const sonra = await page.evaluate(() => ({ ls: JSON.stringify({ ...localStorage }), ss: JSON.stringify({ ...sessionStorage }), cerez: document.cookie, adres: location.href, baslik: document.title }));
    expect(sonra.ls).toBe(once);
    expect(sonra.ls).not.toContain('Zeynep');
    expect(sonra.ss).not.toContain('Zeynep');
    expect(sonra.cerez).toBe('');
    expect(sonra.adres).not.toContain('Zeynep');
    expect(sonra.baslik).not.toContain('Zeynep');
    for (const i of istekler) expect(i, 'istek').not.toMatch(/Zeynep|%C3%87elik|Çelik/i);
    expect(istekler.filter((i) => !i.startsWith('GET '))).toEqual([]);
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => ['beacon', 'xmlhttprequest', 'fetch'].includes(e.initiatorType)).length)).toBe(0);
    await page.reload();
    await expect(page.locator('[data-km-ad]')).toHaveValue('');
    await expect(page.locator('[data-km-ad-yaz]')).toHaveText('');
  });

  test('sayfa cihaz hafızasına yazmaz: kayıt bayt bayt aynı; yeni anahtar eklenmez', async ({ page }) => {
    const durum = JSON.stringify(durumKur());
    await page.addInitScript(([k, d]) => localStorage.setItem(k, d), [ANAHTAR, durum]);
    await page.goto('/tr/kilimim/');
    await page.locator('.km-seritler > summary').click();
    await page.fill('[data-km-ad]', 'Ayşe');
    expect(await page.evaluate((k) => localStorage.getItem(k), ANAHTAR)).toBe(durum);
    expect((await page.evaluate(() => Object.keys(localStorage))).sort()).toEqual([ANAHTAR, 'ulucamiiEgitimDili'].sort());
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  });

  test('yazdır düğmesi tarayıcının yazdırma penceresini açar', async ({ page }) => {
    await page.addInitScript(() => { window.__yazdirildi = 0; window.print = () => { window.__yazdirildi++; }; });
    await tohumla(page, durumKur());
    await page.goto('/tr/kilimim/');
    await page.locator('[data-km-yazdir]').click();
    expect(await page.evaluate(() => window.__yazdirildi)).toBe(1);
  });
});

test.describe('yazdırma', () => {
  test('yazdırma ortamında yalnız kâğıt görünür; çerçeve, logo ve kilim vektör; koyu temada da beyaz kâğıt', async ({ page }) => {
    await tohumla(page, durumKur());
    await page.goto('/tr/kilimim/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.km-kagit')).toBeVisible();
    for (const s of ['.ust', '.alt', '.km-giris', '.km-panel', '.km-seritler', '.km-bag']) await expect(page.locator(s)).toBeHidden();
    for (const s of ['.km-baski-ust .belge-baslik', '.km-baski-ust .km-ayrim', '.km-baski-alt .kurum', '.belge-cerceve', 'svg.ezber-kilim', '.kilim-lejant-kendi']) await expect(page.locator(s).first(), s).toBeVisible();
    await expect(page.locator('.km-baski-ust .km-ayrim')).toContainText(FARK.tr);
    await expect(page.locator('.km-baski-alt .kurum')).toContainText('egitim.ulucamii.be');
    const metin = norm(await page.locator('.km-kagit').innerText());
    expect(metin).not.toMatch(/\+32|\d{3} \d{2} \d{2}|imam|Rıdvan|KAYAHAN/i);
    const gorseller = await page.evaluate(() => [...document.querySelectorAll('img, picture, canvas, video')].map((e) => `${e.tagName} ${e.getAttribute('src') ?? ''}`));
    for (const g of gorseller) expect(g, 'piksel görsel').toMatch(/^IMG \/logo\/.*\.svg$/);
    const arka = await page.evaluate(() => [...document.querySelectorAll('.km-kagit, .km-kagit *')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b !== 'none'));
    expect(arka).toEqual([]);
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
    // Azaltılmış harekette her değişim 1 ms'lik geçişle yapılır (cini.css); başsız tarayıcıda kare üretilmediği için geçişi bitirip değeri oku.
    await page.evaluate(() => document.getAnimations().forEach((g) => g.finish()));
    expect(await page.locator('.km-kagit').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
  });

  const pdfOku = async (page, dil, durum) => {
    await page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durum]);
    await page.goto(`/${dil}/kilimim/`);
    await page.fill('[data-km-ad]', 'Örnek Ad Soyad');
    await page.emulateMedia({ media: 'print' });
    return page.pdf({ preferCSSPageSize: true, printBackground: true });
  };
  const sayfaSayisi = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  const piksel = (pdf) => {
    const dosya = join(tmpdir(), `kilimim-test-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
    writeFileSync(dosya, pdf);
    try {
      return execFileSync('pdfimages', ['-list', dosya], { encoding: 'utf8' }).trim().split('\n').length - 2;
    } catch {
      return (pdf.toString('latin1').match(/\/Subtype\s*\/Image/g) ?? []).length;
    } finally { rmSync(dosya, { force: true }); }
  };
  const A4 = (pdf) => {
    const m = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf.toString('latin1'));
    return m && Math.abs(Number(m[1]) - 595.3) < 1 && Math.abs(Number(m[2]) - 841.9) < 1;
  };

  for (const dil of DILLER) {
    test(`${dil}: PDF — A4 dikey, tek sayfa, piksel görsel yok (az kayıt)`, async ({ page }, ti) => {
      test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
      const pdf = await pdfOku(page, dil, durumKur());
      expect(A4(pdf)).toBe(true);
      expect(sayfaSayisi(pdf)).toBe(1);
      expect(piksel(pdf)).toBe(0);
    });
  }

  test('PDF — bütün çalışma sayfalı maddeler çalışılmışken de tek sayfa ve piksel yok (tr, almanca)', async ({ page, browser }, ti) => {
    test.skip(ti.project.name !== 'masaustu-chromium', 'PDF yalnız masaüstü projesinde');
    const tr = await pdfOku(page, 'tr', cokluDurum(SAYFALI.length));
    expect(sayfaSayisi(tr)).toBe(1);
    expect(piksel(tr)).toBe(0);
    const baglam = await browser.newContext({ baseURL: KOK });
    const sayfa = await baglam.newPage();
    await sayfa.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    const de = await pdfOku(sayfa, 'de', cokluDurum(SAYFALI.length));
    expect(sayfaSayisi(de)).toBe(1);
    expect(piksel(de)).toBe(0);
    await baglam.close();
  });
});

test.describe('koyu tema: «çalışılmadı» dokusu (25 Ekim 2026)', () => {
  // Hesaplanan renk (color-mix dâhil) → sRGB; WCAG göreli parlaklık ve karşıtlık oranı.
  // Azaltılmış harekette tema değişimi 1 ms'lik geçiştir (cini.css); başsız tarayıcıda kare olmadığından önce geçişler bitirilir.
  const olc = (page, secici) => page.evaluate((s) => {
    document.getAnimations().forEach((g) => g.finish());
    const rgb = (deger) => {
      const k = document.createElement('canvas'); k.width = k.height = 1;
      const g = k.getContext('2d'); g.fillStyle = '#000'; g.fillStyle = deger; g.fillRect(0, 0, 1, 1);
      return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const oran = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const cizgi = rgb(getComputedStyle(document.querySelector(s.cizgi)).stroke);
    const zeminler = [...document.querySelectorAll(s.zemin)].map((e) => rgb(getComputedStyle(e).fill));
    return { cizgi, zeminler, enAz: Math.min(...zeminler.map((z) => oran(cizgi, z))) };
  }, secici);
  const KILIM = { cizgi: 'svg.kl-kendi use.kl-k0', zemin: 'svg.kl-kendi .kl-zemin-0, svg.kl-kendi .kl-zemin-1' };

  test('koyu temada (sistem tercihi ve elle seçim) çalışılmamış motif çizgisi kilim zemininde en az 3:1; çalışılan dokular yine ayrışır', async ({ page }) => {
    await tohumla(page, durumKur());
    for (const mod of ['sistem', 'elle']) {
      await page.emulateMedia({ colorScheme: mod === 'sistem' ? 'dark' : 'light' });
      await page.goto('/tr/kilimim/');
      if (mod === 'elle') await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
      const r = await olc(page, KILIM);
      expect(r.enAz, `${mod}: ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(3);
      // «Başladım» noktaları (kl-k1) ve dolu dokular yine ikincil mürekkepte: ayrım doku biçiminden, renkten değil.
      expect(await page.locator('svg.kl-kendi use.kl-k1').count()).toBeGreaterThan(0);
      expect(await page.locator('svg.kl-kendi use.kl-k0').count()).toBeGreaterThan(0);
    }
  });

  test('açık temada «çalışılmadı» çizgisi değişmedi (derz-koyu); hocanın kilimi (giriş sayfası örnek kilim, koyu tema) da değişmedi', async ({ page }) => {
    await tohumla(page, durumKur());
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/tr/kilimim/');
    const acik = await olc(page, KILIM);
    expect(acik.cizgi).toEqual([181, 197, 185]);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/tr/');
    // Öğretmenin kilimi `.kl-b0` kullanır ve çözgü rengi derz-koyu (#2D463A) kalır.
    const hoca = await page.evaluate(() => {
      const e = document.querySelector('svg.ezber-kilim:not(.kl-kendi) .kl-b0, svg.ezber-kilim:not(.kl-kendi) .kl-ara');
      const k = document.createElement('canvas'); k.width = k.height = 1;
      const g = k.getContext('2d'); g.fillStyle = e ? (getComputedStyle(e).stroke !== 'none' ? getComputedStyle(e).stroke : getComputedStyle(e).fill) : '#000'; g.fillRect(0, 0, 1, 1);
      return { var: !!e, rgb: [...g.getImageData(0, 0, 1, 1).data].slice(0, 3) };
    });
    expect(hoca.var).toBe(true);
    expect(hoca.rgb).toEqual([45, 70, 58]);
  });
});

test.describe('erişilebilirlik ve yeniden akış', () => {
  for (const dil of DILLER) {
    test(`${dil}: iki temada axe (boş durum ve dolu, liste açık), 320 px yatay taşma yok`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(`/${dil}/kilimim/`);
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page), `boş ${colorScheme}`).toBe(true);
        const bos = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(bos.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `boş ${colorScheme}`).toEqual([]);
      }
      await tohumla(page, durumKur());
      await page.goto(`/${dil}/kilimim/`);
      await page.fill('[data-km-ad]', 'Ayşe Öztürk');
      await page.locator('.km-seritler > summary').click();
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await tasmaYok(page), `dolu ${colorScheme}`).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), `dolu ${colorScheme}`).toEqual([]);
      }
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('320 px: çok kayıtta ve uzun adla da yatay taşma yok; ad alanı ve düğme dokunulabilir boyda', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await tohumla(page, cokluDurum(40));
    await page.goto('/de/kilimim/');
    await page.fill('[data-km-ad]', 'Ein sehr langer Name, der die Zeile eigentlich sprengen müsste und sprengen müsste');
    await page.locator('.km-seritler > summary').click();
    expect(await tasmaYok(page)).toBe(true);
    for (const s of ['[data-km-ad]', '[data-km-yazdir]', '.km-seritler > summary']) {
      expect((await page.locator(s).boundingBox()).height, s).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('bağlantılar', () => {
  for (const dil of DILLER) {
    test(`${dil}: alt bilgide, «Bugün tekrar» bandında, madde sayfasında ve Çalışma Belgesi'nde Kilimim'e; Kilimim'den Çalışma Belgesi'ne`, async ({ page }) => {
      await tohumla(page, durumKur());
      await page.goto(`/${dil}/`);
      await expect(page.locator(`footer a[href="/${dil}/kilimim/"]`)).toHaveCount(1);
      await expect(page.locator(`[data-tekrar] a[href="/${dil}/kilimim/"]`)).toBeVisible();
      await page.goto(`/${dil}/calis/s-ihlas/`);
      await expect(page.locator(`.belge-bag a[href="/${dil}/kilimim/"]`)).toBeVisible();
      await page.goto(`/${dil}/calisma-belgesi/`);
      await expect(page.locator(`.belge-kilimim a[href="/${dil}/kilimim/"]`)).toBeVisible();
      await page.goto(`/${dil}/kilimim/`);
      await expect(page.locator(`.km-bag a[href="/${dil}/calisma-belgesi/"]`)).toBeVisible();
    });
  }

  test('basılı ezber kartında Kilimim bağlantısı basılmaz', async ({ page }) => {
    await page.goto('/tr/calis/s-ihlas/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.belge-bag')).toBeHidden();
  });
});
