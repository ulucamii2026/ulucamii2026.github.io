/**
 * Ezber Kilimi seviye tablosu (27 Eylül 2026, Faz 1a): katalogdan Markdown üretir; tek kaynak src/data/ezber/katalog.json.
 * Neden: seviye listesi Rıdvan'ın onayına ve docs/EZBER-KILIMI.md'ye her zaman katalogla aynı hâliyle girsin.
 * Kullanım: npm run ezber:tablo [-- --dil fr]
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-tablo.mjs');
await build({
  stdin: { contents: 'export * from "./src/lib/ezber/katalog.ts";', resolveDir: process.cwd() },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const m = await import(pathToFileURL(outfile).href);

const i = process.argv.indexOf('--dil');
const dil = i > 0 ? process.argv[i + 1] : 'tr';
const plan = JSON.parse(readFileSync('src/data/yillik-plan-2026-2027.json', 'utf8'));
const eski = JSON.parse(readFileSync('src/data/ezber/eski-kimlikler.json', 'utf8'));
const hedef = m.sinifHedefleri(plan);
const TUR = { sure: 'sûre', dua: 'dua', bilgi: 'bilgi' };

const eskiAdlari = (id) =>
  Object.entries(eski).flatMap(([kaynak, tablo]) =>
    Object.entries(tablo).filter(([, idler]) => idler.includes(id)).map(([k]) => (kaynak === 'seviyeTesti' ? k : `eski:${k}`)));
const tarih = (t) => (t ? new Date(`${t}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
const kuranHucresi = (o) => {
  if (!o.kuran) return o.kuranMetni ? 'evet' : '—';
  const [a, b] = o.kuran.ayetler;
  return `${o.kuran.sure}:${a}${a === b ? '' : `–${b}`}`;
};
const sesHucresi = (o) => (o.ses?.tam ? (o.ses.parcalar ? 'tam + âyet âyet' : 'tam') : o.ses?.parcalar ? 'âyet âyet' : 'yok');

const cikti = [];
const toplam = m.KATALOG.ogeler.length;
const sesli = m.KATALOG.ogeler.filter((o) => o.ses).length;
cikti.push(`## Ezber Kilimi — seviye listesi (katalog sürüm ${m.KATALOG.surum}; ${toplam} madde, ${sesli} maddenin Diyanet sesi hazır)`);
for (const s of m.KATALOG.seviyeler) {
  const ogeler = m.seviyeOgeleri(s.kimlik);
  const baslik = s.kimlik === 'kenar' ? 'Kenar suyu' : `${s.kimlik}. şerit`;
  cikti.push('', `### ${baslik} — ${s.ad[dil]} (${ogeler.length})`, '', `_${s.amac[dil]}_`, '',
    '| # | Madde | Tür | Kur\'an | Ses | Sınıf hedefi | Eski kimlik |', '|---|---|---|---|---|---|---|');
  for (const o of ogeler)
    cikti.push(`| ${o.sira} | ${o.ad[dil]} | ${TUR[o.tur]} | ${kuranHucresi(o)} | ${sesHucresi(o)} | ${tarih(hedef[o.id])} | ${eskiAdlari(o.id).join(', ') || '—'} |`);
}
console.log(cikti.join('\n'));
