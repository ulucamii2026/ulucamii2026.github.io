/**
 * Hoca inceleme sayfası (Faz 2b, 24 Ekim 2026): dua metinlerinin tamamı tek yazdırılabilir sayfada. Hoca Arapçayı, anlamı
 * ve okunuşu Diyanet kaydını dinleyerek gözden geçirir; onay `node scripts/ezber-dua-cek.mjs --onayla <id|hepsi>` ile
 * dosyaya işlenir. Onaylanmamış metin sayfada «hoca incelemesi bekleniyor» notuyla görünür (egitim/…/[id].astro).
 *
 *   node scripts/ezber-inceleme.mjs                 docs/ezber-metin-inceleme/ezber-metin-inceleme.html
 *   node scripts/ezber-inceleme.mjs --pdf           aynı klasöre PDF de yazar (Playwright Chromium)
 *   node scripts/ezber-inceleme.mjs --cikti <klasör>
 *
 * Yazı tipi (Ulu Nesih) HTML'e gömülür; ses oynatıcıları ulucamii.be'deki Diyanet kayıtlarına bağlanır (internet gerekir).
 * Diyanet kaydı olmayan dualarda (tekbir, tesmî–tahmîd, selâm, âmentü, teşrik tekbiri, telbiye, yemek duası) oynatıcı yerine
 * «ses kaydı yok» notu çıkar: o kartlar yazılı Diyanet kitaplarıyla karşılaştırılır (kaynak satırı).
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (ad) => { const i = process.argv.indexOf(ad); return i < 0 ? undefined : process.argv[i + 1]; };
const KLASOR = resolve(arg('--cikti') ?? 'docs/ezber-metin-inceleme');
const katalog = JSON.parse(readFileSync('src/data/ezber/katalog.json', 'utf8'));
const metinKlasoru = 'src/data/ezber/metin';
const metinler = readdirSync(metinKlasoru).filter((d) => /^d-.*\.json$/.test(d)).map((d) => JSON.parse(readFileSync(`${metinKlasoru}/${d}`, 'utf8'))).filter((m) => !m.kuran);
const sira = new Map(katalog.ogeler.map((o, i) => [o.id, i]));
metinler.sort((a, b) => sira.get(a.id) - sira.get(b.id));
const oge = (id) => katalog.ogeler.find((o) => o.id === id);
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = readFileSync('egitim/public/fonts/ulu-nesih.woff2').toString('base64');
const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

// Anlam grubu birden çok bölümü kapsayabilir (ör. âmentü 4 anlam / 5 bölüm): grubun ilk bölümünde rowspan ile yazılır.
const anlamHucresi = (dilMeali, no, sinif) => {
  if (!dilMeali) return '';
  const g = dilMeali.gruplar.find((x) => x.ayetler[0] === no);
  if (g) return `<td class="${sinif}" rowspan="${g.ayetler[1] - g.ayetler[0] + 1}">${e(g.metin)}</td>`;
  return '';
};
// Hocanın özellikle bakması gereken, veriden çıkarılamayan notlar (kaynağa sadakat gereği metne dokunulmadı).
const HOCA_NOTU = {
  'd-euzu-besmele': 'Eûzü ve Besmele, Diyanet mushafındaki üç âyetten sözcük sözcük birleştirildi (kaynak satırında âyet ve kelime numaraları var); bu birleşik yazım tek bir yerde bu sırayla geçmez. Türkçe anlam ve okunuş Diyanet kitaplarından aynen alındı.',
  'd-tesrik-tekbiri': 'Türkçe anlamın sonunda «Allah’ içindir» yazıyor: Dinî Kavramlar Sözlüğü’nde böyle basılmış (olası yazım kusuru). Kaynağa sadık kalmak için aynen bırakıldı; onay öncesi karar sizin.',
  'd-yemek-duasi': 'Arapça ve Türkçe anlam, Hadislerle İslam’daki Ebû Dâvûd/Tirmizî rivayetinden (kaynak satırı) alındı; harf iskeleti Tecrid-i Sarih’teki rivayetle karşılaştırıldı. Okunuş ve Fransızca anlam Diyanet kaynaklarında bulunmadığı için yoktur.',
};
const kart = (m) => {
  const o = oge(m.id);
  const fr = m.meal.fr;
  const satirlar = m.bolumler.map((b, i) => `
    <tr>
      <td class="no">${b.no}</td>
      <td class="ar" lang="ar" dir="rtl">${e(b.ar)}</td>
      <td class="ok">${e(m.okunus?.tr?.[i]?.metin ?? '—')}</td>
      ${anlamHucresi(m.meal.tr, b.no, 'an')}${anlamHucresi(fr, b.no, 'fr')}
    </tr>`).join('');
  const duz = (m.duzeltmeler ?? []).map((d) => `<li><span class="ar" lang="ar" dir="rtl">${e(d.bul)}</span> → <span class="ar" lang="ar" dir="rtl">${e(d.yerine)}</span><br>${e(d.neden)}</li>`).join('');
  const zor = m.zor.map((z) => `<li><b>${/[؀-ۿ]/.test(z.kelime) ? `<span class="ar" lang="ar" dir="rtl">${e(z.kelime)}</span>` : e(z.kelime)}</b>${z.not ? ` — ${e(z.not)}` : ''}</li>`).join('');
  const oynatici = (yol) => `<audio controls preload="none" src="https://ulucamii.be${e(yol)}"></audio>`;
  const ses = o.ses?.tam ? `${o.ses.yapay ? '<p class="ses-yok"><b>Yapay ses</b> (Diyanet kaydı yok; sayfada «Yapay ses» etiketiyle görünür).</p>' : ''}${oynatici(o.ses.tam)}`
    : o.ses?.parcalar?.length ? o.ses.parcalar.map(oynatici).join(' ')
      : '<p class="ses-yok"><b>Ses kaydı yok.</b> Bu duanın Diyanet ses kaydı bulunmuyor; sayfada ses de çalınmaz. Metni, anlamı ve okunuşu aşağıdaki kaynak satırındaki Diyanet kitaplarıyla karşılaştırın.</p>';
  return `
  <section class="kart">
    <h2>${e(o.ad.tr)} <small>${e(m.id)}</small></h2>
    ${ses}
    ${HOCA_NOTU[m.id] ? `<p class="ses-yok"><b>Hoca için not.</b> ${e(HOCA_NOTU[m.id])}</p>` : ''}
    <table><thead><tr><th>No</th><th>Arapça</th><th>Okunuş (Türkçe usulü)</th><th>Anlam (Türkçe)</th>${fr ? '<th>Anlam (Fransızca)</th>' : ''}</tr></thead><tbody>${satirlar}</tbody></table>
    ${duz ? `<h3>Portal kaydında yapılan düzeltmeler</h3><ul>${duz}</ul>` : ''}
    ${zor ? `<h3>Dikkat notları</h3><ul>${zor}</ul>` : ''}
    <p class="kaynak">Arapça: ${e(m.kaynak.ar)} (${e(m.kaynak.alindi)}). Anlam: ${e(m.meal.tr.kaynak)}.${fr ? ` Fransızca: ${e(fr.kaynak)}.` : ''}</p>
    <p class="onay">Hoca onayı: ☐ Arapça &nbsp; ☐ Anlam &nbsp; ☐ Okunuş &nbsp;·&nbsp; Tarih: ____________ &nbsp; Not: ____________________________</p>
  </section>`;
};

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ezber Kilimi — dua metinleri incelemesi</title>
<style>
@font-face { font-family: "Ulu Nesih"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
:root { color-scheme: light; --yesil: #134420; --gri: #555; }
body { font: 15px/1.5 "Segoe UI", system-ui, sans-serif; color: #1b1b1b; background: #fff; max-width: 1000px; margin: 1.5rem auto; padding: 0 1.2rem; }
h1 { font-size: 1.6rem; color: var(--yesil); margin: 0 0 .3rem; }
h2 { font-size: 1.2rem; color: var(--yesil); margin: 0 0 .5rem; } h2 small { color: var(--gri); font-weight: 400; font-size: .8rem; margin-left: .5rem; }
h3 { font-size: .95rem; margin: .8rem 0 .2rem; }
.giris { background: #f1f5ef; border-left: 4px solid var(--yesil); padding: .7rem 1rem; margin-bottom: 1.2rem; }
.kart { border: 1px solid #c8d3c4; border-radius: 8px; padding: .9rem 1rem; margin-bottom: 1.2rem; break-inside: avoid; }
table { width: 100%; border-collapse: collapse; margin-top: .5rem; }
th, td { border-top: 1px solid #dde4da; padding: .45rem .5rem; vertical-align: top; text-align: left; }
th { font-size: .8rem; color: var(--gri); border-top: 0; }
td.no { width: 2rem; color: var(--gri); }
.ses-yok { background: #fff7e6; border-left: 3px solid #b8860b; padding: .35rem .6rem; margin: .3rem 0; font-size: .85rem; }
td.fr { width: 20%; }
.ar { font-family: "Ulu Nesih", serif; font-size: 1.7rem; line-height: 1.9; }
td.ar { text-align: right; width: 32%; }
td.ok { font-style: italic; width: 20%; }
ul { margin: .2rem 0 0 1.1rem; padding: 0; } li { margin-bottom: .35rem; } li .ar { font-size: 1.2rem; line-height: 1.6; }
audio { width: 100%; max-width: 420px; height: 34px; }
.kaynak { color: var(--gri); font-size: .8rem; margin: .7rem 0 .2rem; }
.onay { font-size: .9rem; margin: .5rem 0 0; padding-top: .5rem; border-top: 1px dashed #b9c4b5; }
@media print { body { margin: 0; max-width: none; font-size: 11.5px; } audio { display: none; } .ar { font-size: 1.45rem; } .kart { page-break-inside: avoid; } }
</style></head><body>
<h1>Ezber Kilimi — dua metinleri incelemesi</h1>
<div class="giris"><p><b>Ne yapılacak?</b> Her dua için Diyanet kaydı varsa dinleyin; yoksa metni kartın altındaki kaynak satırındaki Diyanet kitabıyla karşılaştırın. Arapçayı, anlamı ve okunuşu denetleyin.
Namaz dualarının Arapçası Diyanet’in namaz sitesinden alındı; portal kaydındaki yazım kusurları ve yapılan düzeltmeler kartın altında yazılıdır. Portalda bulunmayan dualar (tekbir, tesmî–tahmîd, selâm, âmentü, teşrik tekbiri, telbiye, yemek duası, kelime-i tevhid/şehâdet, Eûzü–Besmele)
Diyanet’in basılı kitaplarından alındı ve harf iskeleti ikinci bir Diyanet kaynağıyla karşılaştırıldı; kaynak satırında ana kaynak ile (↔ işaretinden sonra) karşılaştırılan kaynaklar adıyla ve sayfasıyla yazılıdır.
Anlam ve okunuş Diyanet kaynaklarından aynen alındı. Fransızca anlam yalnız DİTİB’in resmî Fransızca yayınında (<i>Je vais à la mosquée</i>) karşılığı olan dualarda görünür; yoksa Fransızca sayfa Türkçe anlamla yetinir.
Onaydan önce metin sayfada «hoca incelemesi bekleniyor» notuyla görünür; okunuş onaylanana kadar hiç gösterilmez.</p>
<p>Hazırlanma: ${e(bugun)} · ${metinler.length} dua · Onay komutu (hoca onayladıktan sonra): <code>node scripts/ezber-dua-cek.mjs --onayla hepsi</code> ya da <code>--onayla d-subhaneke,d-salli</code>.</p></div>
${metinler.map(kart).join('\n')}
</body></html>
`;

mkdirSync(KLASOR, { recursive: true });
const yol = resolve(KLASOR, 'ezber-metin-inceleme.html');
writeFileSync(yol, html);
console.log('yazıldı', yol, `(${metinler.length} dua)`);

if (process.argv.includes('--pdf')) {
  const { chromium } = await import('playwright');
  const tarayici = await chromium.launch();
  try {
    const sayfa = await tarayici.newPage();
    await sayfa.goto(`file:///${yol.replace(/\\/g, '/')}`, { waitUntil: 'load' });
    await sayfa.evaluate(() => document.fonts.ready);
    const pdf = resolve(KLASOR, 'ezber-metin-inceleme.pdf');
    await sayfa.pdf({ path: pdf, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
    console.log('yazıldı', pdf);
  } finally { await tarayici.close(); }
}
