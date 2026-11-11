#!/usr/bin/env node
/** ulucamii.be → egitim.ulucamii.be taşıma denetimi (Dilim 4 · P7a/P8). Salt okuma; hiçbir şey yazmaz, giriş yapmaz.
 *
 *    node scripts/tasima-canli.mjs https://ulucamii.be                 (CANLI: ana siteye ve gerçek egitim'e gerçek tarayıcıyla gider)
 *    node scripts/tasima-canli.mjs http://127.0.0.1:4401 --yerel       (YEREL: ana site `dist/` önizlemesi; egitim.ulucamii.be istekleri bu betikte
 *                                                                        karşılanır (kısa bir sahte sayfa), başka her dış adres reddedilir)
 *
 *  Denetler: eski adreslerin (5 dil veli + 5 kurs sayfası, /hoca/, /e/, basılı 73 karekod) tarayıcıda GERÇEKTEN egitim'e gittiği; sorgu + çapanın
 *  (sahte `?apiKey=x&oobCode=TEST&mode=signIn#h`) aynen taşındığı; yönlendirme sayfasının egitim ve ulucamii.be DIŞINDA hiçbir adrese istek atmadığı
 *  (sayaç yok, referrer yok: oobCode sızmaz); /e/test/ın ulucamii.be'de kaldığı. Sahte oobCode tek kullanımlıktır ve hiçbir hesaba ait değildir.
 *  Çıkış kodu: 0 hepsi geçti · 1 en az biri düştü.
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const girdi = process.argv[2];
const yerel = process.argv.includes('--yerel');
if (!girdi) { console.error('Kullanım: node scripts/tasima-canli.mjs <ana-site-adresi> [--yerel]'); process.exit(2); }
const ANA = new URL(girdi).origin;
const EGITIM = 'https://egitim.ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KODLAR = JSON.parse(readFileSync(new URL('../tests/fixtures/e-kodlari-basili.json', import.meta.url), 'utf8')).kodlar;
// Eski adres → beklenen egitim adresi (yollar tablosu src/i18n/ui.ts; burada elle yazılı: bu betik kaynaktan bağımsız bir ikinci kanıttır).
const ESKI = {
  tr: { veli: 'veli-portali', kurs: 'kuran-kursu', mufredat: 'kuran-kursu-mufredati', plan: 'yillik-ders-plani', materyal: 'ders-materyalleri', gunluk: 'kurs-gunlugu' },
  fr: { veli: 'portail-parents', kurs: 'ecole-coranique', mufredat: 'programme-ecole-coranique', plan: 'plan-annuel-des-cours', materyal: 'supports-de-cours', gunluk: 'journal-des-cours' },
  en: { veli: 'parents-portal', kurs: 'quran-school', mufredat: 'quran-school-curriculum', plan: 'yearly-lesson-plan', materyal: 'lesson-materials', gunluk: 'course-journal' },
  nl: { veli: 'ouderportaal', kurs: 'koranschool', mufredat: 'leerplan-koranschool', plan: 'jaarplanning-lessen', materyal: 'lesmateriaal', gunluk: 'lesdagboek' },
  de: { veli: 'elternportal', kurs: 'koranschule', mufredat: 'lehrplan-koranschule', plan: 'jahresplan-unterricht', materyal: 'unterrichtsmaterial', gunluk: 'kurstagebuch' },
};
const YENI = { veli: 'veli', kurs: 'kurs', mufredat: 'kurs/mufredat', plan: 'kurs/yillik-plan', materyal: 'kurs/materyaller', gunluk: 'kurs/gunluk' };
const SORGU = '?apiKey=SAHTE&oobCode=TEST&mode=signIn&lang=tr';
const CAPA = '#kontrol';

const sonuclar = [];
const kontrol = (ad, tamam, ayrinti = '') => sonuclar.push({ ad, tamam: Boolean(tamam), ayrinti });

const tarayici = await chromium.launch();
try {
  async function git(adres, { sorgulu = false, kal = false } = {}) {
    const baglam = await tarayici.newContext({ serviceWorkers: 'block' });
    const istekler = [];
    baglam.on('request', (r) => istekler.push(r.url()));
    if (yerel) {
      await baglam.route('**/*', (r) => {
        const u = new URL(r.request().url());
        if (u.origin === ANA) return r.continue();
        if (u.origin === EGITIM) return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>egitim</title>' });
        return r.abort();
      });
    }
    const sayfa = await baglam.newPage();
    const hedef = adres + (sorgulu ? SORGU + CAPA : '');
    await sayfa.goto(hedef, { waitUntil: 'commit' }).catch(() => {});
    // Yönlendirme betik ya da meta ile olur: son adresin egitim'e (ya da yerelde sahte egitim yanıtına) gelmesini bekle.
    if (kal) await sayfa.waitForTimeout(2500); // ana sitede kalması beklenen sayfa
    else await sayfa.waitForURL((u) => u.origin !== ANA, { timeout: 15000 }).catch(() => {});
    await sayfa.waitForLoadState('domcontentloaded').catch(() => {});
    const son = sayfa.url();
    await baglam.close();
    return { son, istekler };
  }
  const yabanci = (istekler) => istekler.filter((u) => { const o = new URL(u).origin; return o !== ANA && o !== EGITIM && !u.startsWith('data:'); });

  for (const d of DILLER) {
    for (const [anahtar, seg] of Object.entries(ESKI[d])) {
      const adres = `${ANA}/${d}/${seg}/`;
      const beklenen = `${EGITIM}/${d}/${YENI[anahtar]}/`;
      const duz = await git(adres);
      kontrol(`${d}/${seg}/ → ${beklenen}`, duz.son === beklenen, duz.son);
      if (anahtar === 'veli' || anahtar === 'kurs') {
        const s = await git(adres, { sorgulu: true });
        kontrol(`${d}/${seg}/ sorgu+çapa aynen taşınır`, s.son === beklenen + SORGU + CAPA, s.son);
        kontrol(`${d}/${seg}/ yönlendirmede üçüncü tarafa istek yok`, yabanci(s.istekler).length === 0, yabanci(s.istekler).join(' '));
      }
    }
  }
  {
    const h = await git(`${ANA}/hoca/`, { sorgulu: true });
    kontrol('/hoca/ → egitim /hoca/ (sorgu+çapa aynen)', h.son === `${EGITIM}/hoca/${SORGU}${CAPA}`, h.son);
    kontrol('/hoca/ yönlendirmesinde üçüncü tarafa istek yok', yabanci(h.istekler).length === 0, yabanci(h.istekler).join(' '));
    const e = await git(`${ANA}/e/`);
    kontrol('/e/ → egitim /e/', e.son === `${EGITIM}/e/`, e.son);
    const kotu = [];
    for (const k of KODLAR.filter((x) => x !== 'test')) {
      const r = await git(`${ANA}/e/${k}/`);
      if (r.son !== `${EGITIM}/e/${k}/`) kotu.push(`${k}→${r.son}`);
    }
    kontrol(`basılı ${KODLAR.length - 1} karekod → egitim /e/<kod>/`, kotu.length === 0, kotu.slice(0, 5).join(' ') || 'tamam');
    const t = await git(`${ANA}/e/test/`, { kal: true });
    kontrol('/e/test/ ulucamii.be’de kalır (egitim’e gitmez)', new URL(t.son).origin === ANA || /test-de-niveau/.test(t.son), t.son);
  }
} finally {
  await tarayici.close();
}

for (const s of sonuclar) console.log(`${s.tamam ? 'GEÇTİ    ' : 'BAŞARISIZ'}  ${s.ad}${s.tamam ? '' : `  [${s.ayrinti}]`}`);
const dusen = sonuclar.filter((s) => !s.tamam).length;
console.log(`\n${sonuclar.length - dusen}/${sonuclar.length} denetim geçti.${dusen ? ` ${dusen} DÜŞTÜ.` : ''}`);
process.exit(dusen ? 1 : 0);
