// Diyanet namaz vakitleri — Marche-en-Famenne (ilçe ID 11890) → src/data/namaz-vakitleri.json
// Kaynak: ezanvakti.emushaf.net (Diyanet verisinin birebir yansıması). Yedek: Aladhan method=13 (uygulandı, aşağıda).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const ILCE = '11890';
const OUT = new URL('../src/data/namaz-vakitleri.json', import.meta.url);
const LAT = 50.2275, LON = 5.3444; // Marche-en-Famenne
let gunler;
try {
  const r = await fetch(`https://ezanvakti.emushaf.net/vakitler/${ILCE}`, { headers: { 'User-Agent': 'ulucamii-site/1.0' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('ezanvakti HTTP ' + r.status);
  const raw = await r.json();
  if (!Array.isArray(raw) || raw.length < 7 || !raw[0].Imsak) throw new Error('ezanvakti beklenmeyen yanıt');
  gunler = raw.map(g => ({
    tarih: (() => { const k = (g.MiladiTarihKisaIso8601 || g.MiladiTarihKisa || ''); const m = k.match(/^(\d{2})\.(\d{2})\.(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : k.slice(0, 10); })(),
    hicri: g.HicriTarihUzun ?? g.HicriTarihKisa ?? '',
    imsak: g.Imsak, gunes: g.Gunes, ogle: g.Ogle, ikindi: g.Ikindi, aksam: g.Aksam, yatsi: g.Yatsi,
  }));
  console.log('kaynak: ezanvakti (Diyanet ilçe ' + ILCE + ')');
} catch (e) {
  // YEDEK: Aladhan, Diyanet yöntemi (method=13) — deneysel; Diyanet resmî verisinden birkaç dakika sapabilir
  console.warn('ezanvakti başarısız, Aladhan yedeğine geçiliyor:', e.message);
  const simdi = new Date();
  const aylar = [[simdi.getUTCFullYear(), simdi.getUTCMonth() + 1], [simdi.getUTCMonth() === 11 ? simdi.getUTCFullYear() + 1 : simdi.getUTCFullYear(), (simdi.getUTCMonth() + 1) % 12 + 1]];
  const HICRI = ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'];
  gunler = [];
  for (const [y, m] of aylar) {
    const r = await fetch(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${LAT}&longitude=${LON}&method=13&timezonestring=Europe/Brussels`, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('Aladhan HTTP ' + r.status);
    const j = await r.json();
    for (const g of j.data) {
      const t = g.timings, hm = (s) => s.slice(0, 5), d = g.date.gregorian.date.split('-'); // DD-MM-YYYY
      gunler.push({ tarih: `${d[2]}-${d[1]}-${d[0]}`, hicri: `${Number(g.date.hijri.day)} ${HICRI[Number(g.date.hijri.month.number) - 1]} ${g.date.hijri.year}`,
        imsak: hm(t.Fajr), gunes: hm(t.Sunrise), ogle: hm(t.Dhuhr), ikindi: hm(t.Asr), aksam: hm(t.Maghrib), yatsi: hm(t.Isha) });
    }
  }
  console.log('kaynak: Aladhan method=13 (YEDEK)');
}
let eski = [];
if (existsSync(OUT)) { try { eski = JSON.parse(readFileSync(OUT, 'utf8')).gunler ?? []; } catch {} }
// Eski kayıtlarla birleştir (tarih anahtarı), yeni veri önceliklidir
const map = new Map(eski.map(g => [g.tarih, g]));
for (const g of gunler) map.set(g.tarih, g);
const bugun = new Date().toISOString().slice(0, 10);
const hepsi = [...map.values()].filter(g => g.tarih >= new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)).sort((a, b) => a.tarih.localeCompare(b.tarih));
writeFileSync(OUT, JSON.stringify({ kaynak: 'Diyanet İşleri Başkanlığı — Marche-en-Famenne (ilçe 11890)', guncelleme: new Date().toISOString(), ilce: ILCE, gunler: hepsi }, null, 1));
console.log(`yazıldı: ${hepsi.length} gün (${hepsi[0]?.tarih} → ${hepsi.at(-1)?.tarih}), bugün ${bugun}`);
