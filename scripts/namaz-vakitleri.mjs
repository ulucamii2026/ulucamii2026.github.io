// Diyanet namaz vakitleri — Marche-en-Famenne (ilçe ID 11890) → src/data/namaz-vakitleri.json
// Kaynak: ezanvakti.emushaf.net (Diyanet verisinin birebir yansıması). Yedek: Aladhan method=13.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const ILCE = '11890';
const OUT = new URL('../src/data/namaz-vakitleri.json', import.meta.url);
const r = await fetch(`https://ezanvakti.emushaf.net/vakitler/${ILCE}`, { headers: { 'User-Agent': 'ulucamii-site/1.0' } });
if (!r.ok) throw new Error('ezanvakti HTTP ' + r.status);
const raw = await r.json();
// Alanlar: MiladiTarihKisa (dd.MM.yyyy), Imsak, Gunes, Ogle, Ikindi, Aksam, Yatsi, HicriTarihUzun, AyinSekliURL
const gunler = raw.map(g => ({
  tarih: (() => { const k = (g.MiladiTarihKisaIso8601 || g.MiladiTarihKisa || ''); const m = k.match(/^(\d{2})\.(\d{2})\.(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : k.slice(0, 10); })(),
  hicri: g.HicriTarihUzun ?? g.HicriTarihKisa ?? '',
  imsak: g.Imsak, gunes: g.Gunes, ogle: g.Ogle, ikindi: g.Ikindi, aksam: g.Aksam, yatsi: g.Yatsi,
}));
let eski = [];
if (existsSync(OUT)) { try { eski = JSON.parse(readFileSync(OUT, 'utf8')).gunler ?? []; } catch {} }
// Eski kayıtlarla birleştir (tarih anahtarı), yeni veri önceliklidir
const map = new Map(eski.map(g => [g.tarih, g]));
for (const g of gunler) map.set(g.tarih, g);
const bugun = new Date().toISOString().slice(0, 10);
const hepsi = [...map.values()].filter(g => g.tarih >= new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)).sort((a, b) => a.tarih.localeCompare(b.tarih));
writeFileSync(OUT, JSON.stringify({ kaynak: 'Diyanet İşleri Başkanlığı — Marche-en-Famenne (ilçe 11890) via ezanvakti.emushaf.net', guncelleme: new Date().toISOString(), ilce: ILCE, gunler: hepsi }, null, 1));
console.log(`yazıldı: ${hepsi.length} gün (${hepsi[0]?.tarih} → ${hepsi.at(-1)?.tarih}), bugün ${bugun}`);
