// Faz 1e taslakları, adım 1/3: gerçek katalogdan ve yıllık plandan taslak verisini, uydurma bir öğrencinin örnek
// kilimini ve lejantını üretir. Ara çıktı (Git dışı): node_modules/.cache/egitim-taslak/.
// Çalıştırma (depo kökünden): node egitim/docs/taslaklar/uretim/veri.mjs → derle.mjs → ekran.mjs
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CIKTI = 'node_modules/.cache/egitim-taslak';
mkdirSync(CIKTI, { recursive: true });
await build({ entryPoints: ['egitim/docs/taslaklar/uretim/giris.ts'], bundle: true, format: 'esm', platform: 'node',
  outfile: `${CIKTI}/paket.mjs`, logLevel: 'warning' });
const m = await import(pathToFileURL(`${CIKTI}/paket.mjs`).href + `?t=${Date.now()}`);

const plan = JSON.parse(readFileSync('src/data/yillik-plan-2026-2027.json', 'utf8'));
const hedef = m.sinifHedefleri(plan);
const K = m.KATALOG;

// Pano sıraları: 1–7 ve Amme'nin 5 durağı (kilimle aynı düzen); kenar suyu ayrı.
const siralar = [];
for (const sv of [1, 2, 3, 4, 5, 6, 7]) {
  const tanim = K.seviyeler.find((s) => s.kimlik === sv);
  siralar.push({ anahtar: String(sv), etiket: String(sv), seviye: sv, ad: tanim.ad.tr, amac: tanim.amac.tr, motif: m.SERIT_MOTIFI[sv],
    ogeler: m.seviyeOgeleri(sv).map((o) => oge(o)) });
}
const amme = K.seviyeler.find((s) => s.kimlik === 8);
for (let d = 1; d <= 5; d++) {
  siralar.push({ anahtar: `8.${d}`, etiket: `A${d}`, seviye: 8, durak: d, ad: m.durakAdi(d, 'tr'), amac: amme.amac.tr, motif: m.SERIT_MOTIFI[8],
    ogeler: m.seviyeOgeleri(8).filter((o) => o.durak === d).map((o) => oge(o)) });
}
const kenarTanim = K.seviyeler.find((s) => s.kimlik === 'kenar');
const kenar = { ad: kenarTanim.ad.tr, amac: kenarTanim.amac.tr, motif: m.SERIT_MOTIFI.kenar, ogeler: m.seviyeOgeleri('kenar').map((o) => oge(o)) };
const seviyeler = K.seviyeler.map((s) => ({ kimlik: s.kimlik, ad: s.ad.tr, amac: s.amac.tr, fr: s.ad.fr }));

function oge(o) {
  return { id: o.id, ad: o.ad.tr, fr: o.ad.fr, tur: o.tur, ses: Boolean(o.ses), hedef: hedef[o.id] ?? null, durak: o.durak ?? null, not: o.not?.tr ?? null };
}

// Örnek öğrenci (uydurma): kilimin dört basamağı da görünsün.
const g = (basamak, kalite = 'tam', sonraki = '') => ({ basamak, kalite, notlar: [], sonrakiKontrol: sonraki, surum: 1 });
const ornek = {
  'd-euzu-besmele': g(4), 'd-kelime-i-tevhid': g(4), 'd-kelime-i-sehadet': g(4), 'b-imanin-sartlari': g(4), 'b-islamin-sartlari': g(4),
  'b-abdestin-farzlari': g(3, 'tam', '2026-11-14'), 'b-guslun-farzlari': g(3, 'tam', '2026-11-14'), 'b-teyemmumun-farzlari': g(3, 'az', '2026-11-21'),
  'd-abdest-niyeti': g(3, 'tam', '2026-11-14'), 'b-namazin-farzlari': g(2, 'az', '2026-10-24'), 'd-namaz-niyeti': g(2, 'tam', '2026-10-24'),
  'd-tekbir': g(4), 'd-subhaneke': g(2, 'tam', '2026-10-24'),
  's-fatiha': g(2, 'tam', '2026-10-24'), 's-ihlas': g(1, 'tekrar', '2026-10-24'), 's-kevser': g(1, '', ''),
  'd-yemek-duasi': g(3, 'tam', '2026-11-07'),
};
const kilim = m.kilimSvg(ornek, { onek: 'kl-ornek', dil: 'tr', baslik: 'Deniz Örnek — Ezber Kilimi (örnek veri)' });
const lejant = m.kilimLejanti({ onek: 'kl-ornek', dil: 'tr', baslik: '' });
const ozet = m.kilimOzeti(ornek, 'tr');
const isaretler = [0, 1, 2, 3, 4].map((b) => ({ b, ad: m.BASAMAK_ADLARI[b].tr, svg: m.basamakIsareti(b) }));
const motifler = Object.fromEntries(Object.entries(m.MOTIFLER).map(([ad, x]) => [ad, x]));
const kaliteVeli = Object.fromEntries(Object.entries(m.KALITE_VELI).map(([k, v]) => [k, v.tr]));
const notlar = m.NOT_KALIPLARI.map((n) => ({ anahtar: n.anahtar, tr: m.notMetni(n.anahtar, 'tr') }));

writeFileSync(`${CIKTI}/veri.json`, JSON.stringify({ seviyeler, siralar, kenar, isaretler, motifler, kaliteVeli, notlar,
  kilimOzeti: ozet, basamakAdlari: m.BASAMAK_ADLARI, sayi: K.ogeler.length }, null, 1));
writeFileSync(`${CIKTI}/kilim-ornek.svg`, kilim);
writeFileSync(`${CIKTI}/kilim-lejant.html`, lejant);
console.log('madde', K.ogeler.length, '| sıra', siralar.map((s) => `${s.etiket}:${s.ogeler.length}`).join(' '), '| kenar', kenar.ogeler.length);
console.log('hedefli', Object.keys(hedef).length, '| örnek özet:', ozet);
console.log('fatiha hedef', hedef['s-fatiha'], '| motifler', Object.keys(motifler).join(','));
console.log('notlar', notlar.map((n) => n.anahtar).join(','));
