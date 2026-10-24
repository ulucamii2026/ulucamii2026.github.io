/**
 * Bilgi maddeleri hoca inceleme sayfası (24 Ekim 2026): iman şartları, farzlar, Ülü'l-azm, dört halife ve hadis seçkileri.
 * Dua metinlerinin incelemesi (scripts/ezber-inceleme.mjs) ile aynı düzen: tek yazdırılabilir sayfa, hocanın işaretleyeceği
 * kutular. Burada her madde beş dilde, kaynak künyesiyle, hadislerde Diyanet yayınındaki karşılık ve ifade farkıyla,
 * doğrulanamadığı için sayfaya ALINMAYANLARLA ve nedenleriyle görünür. Hoca onayı dosyaya `--onayla` ile işlenir.
 *
 *   node scripts/ezber-bilgi.mjs                      docs/ezber-bilgi-inceleme/ezber-bilgi-inceleme.html
 *   node scripts/ezber-bilgi.mjs --pdf                aynı klasöre PDF de yazar (Playwright Chromium)
 *   node scripts/ezber-bilgi.mjs --cikti <klasör>
 *   node scripts/ezber-bilgi.mjs --onayla hepsi       onay kaydı: tarih = bugün, kapsam = tr
 *   node scripts/ezber-bilgi.mjs --onayla b-ulul-azm,b-dort-halife --kapsam tr,fr
 *
 * Onay dil dil verilir: hoca Türkçeyi okuduysa `tr`, Fransızcayı da okuduysa `tr,fr`. En, nl, de her zaman Türkçeden çevrilmiş
 * taslaktır; ana dili konuşan biri okuyup onaylamadıkça `--kapsam`a yazılmaz. Onay satırı silinirse (`onay: null`) sayfa yine
 * «hoca incelemesi bekleniyor» der. Yazı tipi (Ulu Nesih) HTML'e gömülür; ağ gerekmez.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (ad) => { const i = process.argv.indexOf(ad); return i < 0 ? undefined : process.argv[i + 1]; };
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KLASOR_VERI = 'src/data/ezber/bilgi';
const katalog = JSON.parse(readFileSync('src/data/ezber/katalog.json', 'utf8'));
const dosyalar = readdirSync(KLASOR_VERI).filter((d) => /^b-.*\.json$/.test(d));
const okuHam = (d) => readFileSync(`${KLASOR_VERI}/${d}`, 'utf8');
const sira = new Map(katalog.ogeler.map((o, i) => [o.id, i]));
const oge = (id) => katalog.ogeler.find((o) => o.id === id);
const yerelGun = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

// ——— Onay kaydı ———
const onayla = arg('--onayla');
if (onayla) {
  const kapsam = (arg('--kapsam') ?? 'tr').split(',').map((s) => s.trim()).filter(Boolean);
  if (!kapsam.length || kapsam.some((d) => !DILLER.includes(d))) { console.error(`--kapsam ${DILLER.join(', ')} dillerinden olmalı (örnek: tr,fr).`); process.exit(1); }
  const kimlikler = onayla === 'hepsi' ? dosyalar.map((d) => d.slice(0, -5)) : onayla.split(',').map((s) => s.trim());
  const bilinmeyen = kimlikler.filter((k) => !dosyalar.includes(`${k}.json`));
  if (bilinmeyen.length) { console.error(`Bilinmeyen madde: ${bilinmeyen.join(', ')}`); process.exit(1); }
  for (const k of kimlikler) {
    const yol = `${KLASOR_VERI}/${k}.json`;
    const ham = okuHam(`${k}.json`);
    const b = JSON.parse(ham);
    // Dosya biçimi (iki boşluk girinti, sonda satır sonu) korunur; başka biçimde ise dokunulmaz.
    if (`${JSON.stringify(b, null, 2)}\n` !== ham) { console.error(`${k}: dosya biçimi beklenenden farklı, onay işlenmedi.`); process.exit(1); }
    b.onay = { tarih: yerelGun(), kapsam };
    writeFileSync(yol, `${JSON.stringify(b, null, 2)}\n`);
    console.log(`onaylandı: ${k} (${kapsam.join(', ')}, ${b.onay.tarih})`);
  }
  console.log('Şimdi `npm run egitim:yayinla` ile sayfaları yeniden yayınlayın.');
  process.exit(0);
}

// ——— İnceleme sayfası ———
const KLASOR = resolve(arg('--cikti') ?? 'docs/ezber-bilgi-inceleme');
const veriler = dosyalar.map((d) => JSON.parse(okuHam(d))).sort((a, b) => sira.get(a.id) - sira.get(b.id));
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = readFileSync('egitim/public/fonts/ulu-nesih.woff2').toString('base64');
const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const ROL = { metin: 'Metin', fr: 'Fransızca', ar: 'Arapça', dogrulama: 'Karşılaştırıldığı' };
const ROL_SIRASI = ['metin', 'fr', 'ar', 'dogrulama'];

const durum = (b) => {
  const taslak = new Set(b.taslak);
  const onayli = new Set(b.onay?.kapsam ?? []);
  return DILLER.map((d) => `${d.toUpperCase()}: ${onayli.has(d) ? 'onaylı' : taslak.has(d) ? 'taslak' : 'bekliyor'}`).join(' · ');
};

const satir = (b, x, no) => {
  const taslakFr = x.taslak?.includes('fr') ? ' <span class="rozet">çalışma çevirisi</span>' : '';
  const dgr = x.dogrulama
    ? `<div class="dgr"><b>Diyanet karşılığı:</b> ${e(x.dogrulama.kaynak)}${x.dogrulama.metin ? `<br><i>${e(x.dogrulama.metin)}</i>` : ''}${x.dogrulama.fark ? `<br><b>Fark:</b> ${e(x.dogrulama.fark)}` : ''}</div>`
    : '';
  return `
      <tr>
        <td class="no">${no}</td>
        <td class="tr">${e(x.ad.tr)}${x.ar ? `<div class="ar" lang="ar" dir="rtl">${e(x.ar)}</div>` : ''}${x.kunye ? `<div class="kunye">Künye: ${e(x.kunye)}</div>` : ''}${dgr}</td>
        <td class="fr" lang="fr">${e(x.ad.fr)}${taslakFr}</td>
        <td class="tas"><span lang="en">${e(x.ad.en)}</span><br><span lang="nl">${e(x.ad.nl)}</span><br><span lang="de">${e(x.ad.de)}</span></td>
      </tr>`;
};

const kart = (b) => {
  const o = oge(b.id);
  const gruplar = b.gruplar?.length ? b.gruplar : [{ kimlik: '', ad: null }];
  const govde = gruplar.map((g) => {
    const maddeler = b.maddeler.filter((x) => (g.kimlik ? x.grup === g.kimlik : true));
    const baslik = g.ad ? `<tr class="grup"><td colspan="4">${e(g.ad.tr)} · <span lang="fr">${e(g.ad.fr)}</span> · <span lang="en">${e(g.ad.en)}</span> · <span lang="nl">${e(g.ad.nl)}</span> · <span lang="de">${e(g.ad.de)}</span></td></tr>` : '';
    return baslik + maddeler.map((x, i) => satir(b, x, i + 1)).join('');
  }).join('');
  const kaynaklar = [...b.kaynaklar].sort((p, q) => ROL_SIRASI.indexOf(p.rol) - ROL_SIRASI.indexOf(q.rol))
    .map((k) => `<li><b>${e(ROL[k.rol])}:</b> ${e(k.ad)}, ${k.sayfa ? `s. ${e(k.sayfa)}` : e(k.bolum)}</li>`).join('');
  const alinmayan = (b.alinmayan ?? []).map((a) => `<tr><td>${e(a.metin)}</td><td>${e(a.neden)}</td><td>${e(a.kaynak ?? '')}</td></tr>`).join('');
  return `
  <section class="kart">
    <h2>${e(o.ad.tr)} <small>${e(b.id)}</small></h2>
    <p class="durum">Sayfada: ${b.sirali ? 'sıralı liste («Sırala» oyunu var)' : 'sırasız liste (yalnız «Gizle ve söyle»)'} · Dil durumu: ${e(durum(b))}</p>
    <table><thead><tr><th>No</th><th>Türkçe (kaynak metin)</th><th>Fransızca</th><th>English · Nederlands · Deutsch (taslak)</th></tr></thead><tbody>${govde}</tbody></table>
    ${b.not ? `<p class="not"><b>Sayfadaki not:</b> ${e(b.not.tr)}<br><span lang="fr">${e(b.not.fr)}</span></p>` : ''}
    <h3>Kaynaklar</h3><ul>${kaynaklar}</ul>
    ${alinmayan ? `<h3>Kitapta olup sayfaya ALINMAYANLAR (doğrulanamadı)</h3><table class="alinmayan"><thead><tr><th>Metin</th><th>Neden alınmadı</th><th>Kitap</th></tr></thead><tbody>${alinmayan}</tbody></table>` : ''}
    <p class="onay">Hoca onayı: ☐ Türkçe metin &nbsp; ☐ Fransızca &nbsp; ☐ Kaynak künyeleri &nbsp;·&nbsp; Tarih: ____________ &nbsp; Not: ____________________________</p>
  </section>`;
};

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ezber Kilimi — bilgi maddeleri incelemesi</title>
<style>
@font-face { font-family: "Ulu Nesih"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
:root { color-scheme: light; --yesil: #134420; --gri: #555; }
body { font: 15px/1.5 "Segoe UI", system-ui, sans-serif; color: #1b1b1b; background: #fff; max-width: 1040px; margin: 1.5rem auto; padding: 0 1.2rem; }
h1 { font-size: 1.6rem; color: var(--yesil); margin: 0 0 .3rem; }
h2 { font-size: 1.2rem; color: var(--yesil); margin: 0 0 .3rem; } h2 small { color: var(--gri); font-weight: 400; font-size: .8rem; margin-left: .5rem; }
h3 { font-size: .95rem; margin: .8rem 0 .2rem; }
.giris { background: #f1f5ef; border-left: 4px solid var(--yesil); padding: .7rem 1rem; margin-bottom: 1.2rem; }
.kart { border: 1px solid #c8d3c4; border-radius: 8px; padding: .9rem 1rem; margin-bottom: 1.2rem; }
h2, h3 { break-after: avoid; } tr { break-inside: avoid; }
.durum { color: var(--gri); font-size: .85rem; margin: 0 0 .4rem; }
table { width: 100%; border-collapse: collapse; margin-top: .4rem; }
th, td { border-top: 1px solid #dde4da; padding: .4rem .5rem; vertical-align: top; text-align: left; }
th { font-size: .8rem; color: var(--gri); border-top: 0; }
td.no { width: 2rem; color: var(--gri); }
td.tr { width: 36%; font-weight: 600; } td.fr { width: 28%; } td.tas { width: 33%; font-size: .82rem; color: #444; }
tr.grup td { background: #f1f5ef; font-weight: 700; color: var(--yesil); }
.ar { font-family: "Ulu Nesih", serif; font-size: 1.6rem; line-height: 1.8; text-align: right; font-weight: 400; }
.kunye { font-weight: 400; font-size: .85rem; color: var(--gri); }
.dgr { font-weight: 400; font-size: .8rem; color: #333; margin-top: .3rem; padding: .3rem .5rem; background: #fafaf5; border-left: 3px solid #c9a227; }
.rozet { font-size: .72rem; background: #f1f5ef; color: var(--gri); padding: 0 .35rem; border-radius: 4px; }
.not { font-size: .85rem; color: #333; margin: .6rem 0 0; }
ul { margin: .2rem 0 0 1.1rem; padding: 0; } li { margin-bottom: .2rem; font-size: .88rem; }
.alinmayan td, .alinmayan th { font-size: .8rem; }
.onay { font-size: .9rem; margin: .7rem 0 0; padding-top: .5rem; border-top: 1px dashed #b9c4b5; }
@media print { body { margin: 0; max-width: none; font-size: 11.5px; } .ar { font-size: 1.4rem; } }
</style></head><body>
<h1>Ezber Kilimi — bilgi maddeleri incelemesi</h1>
<div class="giris"><p><b>Ne yapılacak?</b> Her listeyi Camiye Gidiyorum / Temel Dinî Bilgiler kitabındaki sayfayla karşılaştırın: sıra, sayı, yazım. Metin kitaptan alındı ve
bir ikinci Diyanet kaynağıyla (Temel Dinî Bilgiler, İlmihal, Dînî Kavramlar Sözlüğü, Hadislerle İslam, Riyâzü’s-Sâlihîn) karşılaştırıldı; ikisi uyuşmayan satır alınmadı ve nedeni
«ALINMAYANLAR» tablosunda yazılıdır. Hadislerde kitaptaki cümle ile Diyanet yayınındaki cümle arasındaki fark gösterilir (anlam aynıysa sayfada kitabın cümlesi durur).
Fransızca resmî baskıdan alındı; baskıda tam karşılığı olmayan satırlar «çalışma çevirisi» diye işaretlidir. English, Nederlands ve Deutsch Türkçeden çevrilmiş TASLAKTIR; sayfada öyle yazılıdır ve resmî diye sunulmaz.
Onaydan önce her sayfa «hoca incelemesi bekleniyor» der.</p>
<p>Hazırlanma: ${e(bugun)} · ${veriler.length} madde · Onay komutu (hoca onayladıktan sonra): <code>node scripts/ezber-bilgi.mjs --onayla hepsi</code> (yalnız Türkçe),
<code>--onayla hepsi --kapsam tr,fr</code> ya da <code>--onayla b-ulul-azm,b-dort-halife</code>. Ardından <code>npm run egitim:yayinla</code>.</p></div>
${veriler.map(kart).join('\n')}
</body></html>
`;

mkdirSync(KLASOR, { recursive: true });
const yol = resolve(KLASOR, 'ezber-bilgi-inceleme.html');
writeFileSync(yol, html);
console.log('yazıldı', yol, `(${veriler.length} madde)`);

if (process.argv.includes('--pdf')) {
  const { chromium } = await import('playwright');
  const tarayici = await chromium.launch();
  try {
    const sayfa = await tarayici.newPage();
    await sayfa.goto(`file:///${yol.replace(/\\/g, '/')}`, { waitUntil: 'load' });
    await sayfa.evaluate(() => document.fonts.ready);
    const pdf = resolve(KLASOR, 'ezber-bilgi-inceleme.pdf');
    await sayfa.pdf({ path: pdf, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
    console.log('yazıldı', pdf);
  } finally { await tarayici.close(); }
}
