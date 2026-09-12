/**
 * Dinî gün kapısı (12 Eylül 2026).
 *
 * Neden: yıllık planın kendi içinde tuttuğu dinî gün işaretleri elle yazılıyordu ve
 * denetlenmiyordu. 12 Eylül 2026'da Diyanet'in resmî listesiyle karşılaştırıldığında
 * planın YAZDIĞI her iddia doğru çıktı (Kurban Bayramı arifesi 15 Mayıs, 1. gün
 * 16 Mayıs 2027 — Diyanet tablosuyla birebir), ama HİÇ YAZMADIĞI yedi ders günü
 * bulundu: resmî bir dinî günün hemen ardına düşen hafta sonu dersleri işaretsizdi.
 * Hoca o derse girerken bir uyarı almıyor, defter ve haftalık bülten üreticileri de
 * o günü anamıyordu.
 *
 * Bu betik iki şeyi denetler:
 *   1. Planın yazdığı dinî gün iddiaları resmî listeyle çelişiyor mu? (ÇELİŞKİ → hata)
 *   2. Resmî bir dinî günün kendisine ya da ardındaki ilk ders gününe denk gelen ders
 *      günleri işaretli mi? (İŞARETSİZ → hata)
 *
 * Kaynak yalnız `src/data/diyanet-dini-gunler.json`; tarih hesabı YAPILMAZ (CLAUDE.md).
 *
 * Kullanım: node scripts/dini-gun-kapisi.mjs        → rapor + çıkış kodu
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(readFileSync(join(KOK, 'src/data/yillik-plan-2026-2027.json'), 'utf8'));
const resmi = JSON.parse(readFileSync(join(KOK, 'src/data/diyanet-dini-gunler.json'), 'utf8'));

const dersGunleri = plan.gunler
  .filter((g) => (g.dersler ?? []).length > 0)
  .map((g) => g.tarih)
  .sort();

const metniOf = (g) => [g.not ?? '', ...(g.rozetler ?? []).map((r) => r.metin ?? '')].join(' ');
const gunOf = (t) => plan.gunler.find((g) => g.tarih === t);

/** Verilen tarihten sonraki (ya da o tarihteki) ilk ders günü. */
const ilkDersGunu = (tarih) => dersGunleri.find((t) => t >= tarih);

/* Diyanet tablosu ile planın yazımı her zaman birebir aynı kelimeyi kullanmıyor
   (tablo «AREFE», plan «Kurban Bayramı arifesi»; tablo «Mirac», metin «Miraç»).
   Bu yüzden her olay için kabul edilen yazım kümesi tutulur. */
const ANAHTARLAR = {
  'Üç ayların başlangıcı': ['üç aylar'],
  'Regaib Kandili': ['regaib', 'regâib'],
  'Mirac Kandili': ['mirac', 'miraç'],
  'Berat Kandili': ['berat', 'berât'],
  'Ramazan başlangıcı': ['ramazan'],
  'Kadir Gecesi': ['kadir'],
  Arefe: ['arefe', 'arife'],
  'Hicrî yılbaşı': ['hicrî yılbaşı', 'hicri yılbaşı', 'muharrem'],
  'Aşure günü': ['aşure'],
};
/** Bayram günleri için ortak anahtar: «Ramazan Bayramı (2. gün)» → bayram adı. */
const anahtarlariOf = (ad) => ANAHTARLAR[ad]
  ?? (/Bayramı/.test(ad) ? [ad.replace(/\s*\(.*\)$/, '').toLocaleLowerCase('tr')] : [ad.split(/[\s(]/)[0].toLocaleLowerCase('tr')]);

const hatalar = [];
const bilgi = [];

/* 1. Resmî listedeki her dinî gün için: o günün kendisi ya da ardındaki ilk ders günü
      işaretli mi? Aynı ders gününe düşen olaylar TEK satırda toplanır (Kurban Bayramı'nın
      dört günü ya da aynı tarihteki «üç aylar + Regaib» dört ayrı uyarı üretmesin). */
const ilk = dersGunleri[0];
const son = dersGunleri[dersGunleri.length - 1];
const hedefler = new Map();                          // ders günü → { eksik[], isaretli[] }
for (const dg of resmi.gunler) {
  if (dg.tarih > son || dg.tarih < ilk) continue;    // ders yılının dışı
  const hedef = ilkDersGunu(dg.tarih);
  if (!hedef) continue;
  const metin = metniOf(gunOf(hedef)).toLocaleLowerCase('tr');
  const kayit = hedefler.get(hedef) ?? { eksik: [], isaretli: [] };
  (anahtarlariOf(dg.ad).some((a) => metin.includes(a)) ? kayit.isaretli : kayit.eksik)
    .push(`${dg.ad}${hedef === dg.tarih ? '' : ` (${dg.tarih})`}`);
  hedefler.set(hedef, kayit);
}
for (const [hedef, { eksik, isaretli }] of [...hedefler].sort()) {
  const g = gunOf(hedef);
  if (isaretli.length) bilgi.push(`${hedef} ✔ ${isaretli.join(', ')}`);
  if (eksik.length) hatalar.push(`${hedef} (${g.gun}) işaretsiz — ${eksik.join(', ')}`);
}

/* 2. Planın kendi yazdığı bayram/arife iddiaları resmî listeyle çelişmiyor mu? */
for (const g of plan.gunler) {
  const metin = metniOf(g);
  for (const kalip of [/Kurban Bayramı arifesi/i, /Kurban Bayramı (\d)\. gün/i, /Ramazan başlangıcı/i]) {
    const m = metin.match(kalip);
    if (!m) continue;
    const beklenen = resmi.gunler.filter((d) => d.tarih === g.tarih);
    if (!beklenen.length) {
      hatalar.push(`${g.tarih} planda «${m[0]}» diyor, resmî listede o tarihte dinî gün yok`);
    }
  }
}

const yazi = [];
yazi.push(`Dinî gün kapısı — kaynak: ${resmi.kaynak} (çekilme ${resmi.cekilme})`);
yazi.push(`ders günü: ${dersGunleri.length} · ders yılı: ${ilk} → ${son}`);
for (const b of bilgi) yazi.push(`  ${b}`);
for (const h of hatalar) yazi.push(`  ✗ ${h}`);
yazi.push(hatalar.length ? `HATA: ${hatalar.length} işaretsiz/çelişkili dinî gün` : 'TEMİZ: dinî gün işaretleri resmî listeyle uyumlu');
console.log(yazi.join('\n'));
process.exit(hatalar.length ? 1 : 0);
