// Namaz vakitleri — YALNIZCA Diyanet İşleri Başkanlığı verisi.
//
// İKİ DİYANET KAYNAĞI, TEK VERİ (30 Ağustos 2026 kararı):
//   1) RESMÎ SAYFA  https://namazvakitleri.diyanet.gov.tr/tr-TR/11890/…  (birincil)
//      Sunucu tarafında üç tablo basar: haftalık (7 gün), aylık (31 gün, bugünden), yıllık
//      (bir sonraki takvim yılının 365 günü). GitHub Actions'tan 200 döner; Belçika'daki
//      bağlantılardan ise açılmaz (bağlantı sıfırlanıyor).
//   2) AYNA         https://ezanvakti.emushaf.net/vakitler/11890  (yedek)
//      Diyanet verisinin JSON aynası, 32 günlük kayan pencere. Belçika'dan çalışır; bulut
//      IP'lerini (GitHub Actions) 403 ile geri çevirir.
//   İkisi de aynı Diyanet takvimidir (30 Ağu 2026'da 29 ortak günde sıfır fark doğrulandı).
//   Betik önce resmî sayfayı, olmazsa aynayı dener; hangisi çalışırsa onun günlerini
//   eldeki Diyanet verisinin ÜZERİNE yazar (taze olan kazanır), eldeki ileri tarihli
//   Diyanet günlerini korur. Böylece Actions'ın günlük çekimi 2027 sonuna kadar veri
//   biriktirir, yerel çekim (ayna) o veriyi silmez.
//
// TASARIM KARARI (24 Ağu 2026, DEĞİŞMEDİ): Hesaplama tabanlı YEDEK KAYNAK YOKTUR.
//   Diyanet verisi hiçbir kaynaktan alınamazsa mevcut JSON'a dokunulmaz, betik hata koduyla
//   çıkar, Actions işi kırmızı olur ve info@'ya uyarı gider. Yanlış vakit yayımlanmaz.
import { writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';

const ILCE = '11890';                  // Diyanet ilçe kimliği — M.FAMENNE (Marche-en-Famenne)
const ILCE_ADI = 'M.FAMENNE';
const OUT = new URL('../src/data/namaz-vakitleri.json', import.meta.url);
const RESMI = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${ILCE}/mfamenne-namaz-vakitleri`;
const AYNA = `https://ezanvakti.emushaf.net/vakitler/${ILCE}`;
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
const AYLAR = { Ocak: 1, Şubat: 2, Mart: 3, Nisan: 4, Mayıs: 5, Haziran: 6, Temmuz: 7, Ağustos: 8, Eylül: 9, Ekim: 10, Kasım: 11, Aralık: 12 };
const UA = 'Mozilla/5.0 (X11; Linux x86_64) ulucamii-site/2.0 (+https://ulucamii.be)';

const bekle = (ms) => new Promise((c) => setTimeout(c, ms));
const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
const gunFarki = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 86400000);
const dkOnce = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') - n * 86400000).toISOString().slice(0, 10);

/** Ortak yeniden deneme sarmalayıcısı. */
async function dene(ad, islev, araliklar) {
  let sonHata;
  for (let i = 0; i <= araliklar.length; i++) {
    try {
      return await islev();
    } catch (e) {
      sonHata = e;
      console.warn(`${ad}: deneme ${i + 1}/${araliklar.length + 1} başarısız — ${e.message}`);
      if (i < araliklar.length) await bekle(araliklar[i]);
    }
  }
  throw sonHata;
}

/** HTML varlık çözümü (sayfada yalnız birkaç tanesi geçiyor). */
const varlikCoz = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

/** Resmî sayfanın tablolarını ayrıştırır: "30 Ağustos 2026 Pazar 17 Rebiulevvel 1448 04:48 06:43 …" */
export function resmiSayfayiAyristir(html) {
  const gunler = new Map();
  for (const [, satir] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const metin = varlikCoz(satir.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const m = metin.match(/^(\d{1,2}) (\S+) (\d{4}) \S+ (.*?) ?((?:[0-2]\d:[0-5]\d ?){6})$/);
    if (!m || !(m[2] in AYLAR)) continue;
    const tarih = `${m[3]}-${String(AYLAR[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    const [imsak, gunes, ogle, ikindi, aksam, yatsi] = m[5].trim().split(/\s+/);
    gunler.set(tarih, { tarih, hicri: m[4].trim(), imsak, gunes, ogle, ikindi, aksam, yatsi });
  }
  return [...gunler.values()].sort((a, b) => a.tarih.localeCompare(b.tarih));
}

async function resmiSayfadanCek() {
  if (process.env.NAMAZ_HTML) return resmiSayfayiAyristir(readFileSync(process.env.NAMAZ_HTML, 'utf8'));
  return dene('resmî sayfa', async () => {
    const r = await fetch(RESMI, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'tr-TR,tr;q=0.9' },
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const gunler = resmiSayfayiAyristir(await r.text());
    if (gunler.length < 7) throw new Error(`sayfa ayrıştırılamadı (${gunler.length} gün) — sayfa yapısı değişmiş olabilir`);
    return gunler;
  }, [10000, 30000]);
}

/** Ayna: Diyanet'in ham JSON kaydını site biçimine çevirir. */
function aynaDonustur(g) {
  const k = g.MiladiTarihKisaIso8601 || g.MiladiTarihKisa || '';
  const m = k.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  return {
    tarih: m ? `${m[3]}-${m[2]}-${m[1]}` : k.slice(0, 10),
    hicri: g.HicriTarihUzun ?? g.HicriTarihKisa ?? '',
    imsak: g.Imsak, gunes: g.Gunes, ogle: g.Ogle, ikindi: g.Ikindi, aksam: g.Aksam, yatsi: g.Yatsi,
  };
}

async function aynadanCek() {
  return dene('ayna', async () => {
    const r = await fetch(AYNA, {
      headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*', 'Accept-Language': 'tr,fr;q=0.8,en;q=0.6' },
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const ham = await r.json();
    if (!Array.isArray(ham) || ham.length < 7) throw new Error('beklenmeyen gövde');
    return ham.map(aynaDonustur).sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [10000, 30000, 60000]);
}

/** Yayımlanmadan önce veri sağlığı: eksik/bozuk veri asla yazılmaz. */
function dogrula(gunler) {
  if (!Array.isArray(gunler) || gunler.length < 7) throw new Error(`yetersiz gün sayısı (${gunler?.length ?? 0})`);
  const bugun = bugunISO();
  for (const g of gunler) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.tarih)) throw new Error(`geçersiz tarih: ${g.tarih}`);
    for (const v of ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi']) {
      if (!SAAT.test(g[v] ?? '')) throw new Error(`geçersiz ${v} (${g.tarih}): ${g[v]}`);
    }
    // sıra denetimi: imsak < güneş < öğle < ikindi < akşam < yatsı
    const dk = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
    const s = [g.imsak, g.gunes, g.ogle, g.ikindi, g.aksam, g.yatsi].map(dk);
    if (!s.every((x, i) => i === 0 || x > s[i - 1])) throw new Error(`vakit sırası bozuk: ${g.tarih}`);
  }
  if (!gunler.some((g) => g.tarih === bugun)) throw new Error(`bugün (${bugun}) veride yok — bayat kaynak`);
  // bugünden itibaren en az 7 gün kesintisiz olmalı (site tablosu bu diziyi gösterir)
  for (let i = 1; i < 7; i++) {
    const t = dkOnce(bugun, -i);
    if (!gunler.some((g) => g.tarih === t)) throw new Error(`bugünden sonraki ${i}. gün (${t}) eksik`);
  }
}

/** Eldeki dosya (yalnız kaynakTuru 'diyanet' ise) — birleştirme tabanı. */
function eldekiVeri() {
  if (!existsSync(OUT)) return null;
  try {
    const d = JSON.parse(readFileSync(OUT, 'utf8'));
    return d.kaynakTuru === 'diyanet' && Array.isArray(d.gunler) ? d : null;
  } catch { return null; }
}

function kalanGun(gunler) {
  const bugun = bugunISO();
  // bugünden başlayan kesintisiz dizinin son günü
  let son = null;
  for (let i = 0; ; i++) {
    const t = dkOnce(bugun, -i);
    if (!gunler.some((g) => g.tarih === t)) break;
    son = t;
  }
  return son ? gunFarki(son, bugun) : null;
}

// ---------------------------------------------------------------- çalıştırma
const eldeki = eldekiVeri();
let taze = null, kaynakAdi = null;
try {
  taze = await resmiSayfadanCek(); kaynakAdi = 'resmî sayfa';
} catch (e1) {
  console.warn('Resmî sayfa alınamadı: ' + e1.message + ' → ayna deneniyor');
  try {
    taze = await aynadanCek(); kaynakAdi = 'ayna';
  } catch (e2) {
    const kalan = eldeki ? kalanGun(eldeki.gunler) : null;
    console.error('HATA: Diyanet namaz vakitleri hiçbir kaynaktan alınamadı — resmî sayfa: ' + e1.message + ' · ayna: ' + e2.message);
    console.error('Mevcut veri korundu (üzerine yazılmadı). İş bilerek başarısız sonlandırılıyor.');
    console.error(kalan === null ? 'DİKKAT: eldeki verinin ömrü okunamadı — dosya elden geçirilmeli.' : `Eldeki Diyanet verisi ${kalan} gün daha yetiyor (son gün dâhil).`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `kalan_gun=${kalan ?? ''}\n`);
    process.exit(1);
  }
}

// Birleştirme: eldeki Diyanet günleri taban, taze günler üstüne (taze kazanır). Dünden eskisi atılır.
const bugun = bugunISO();
const dun = dkOnce(bugun, 1);
const harita = new Map();
for (const g of eldeki?.gunler ?? []) if (g.tarih >= dun) harita.set(g.tarih, g);
let duzeltme = 0, yeni = 0;
for (const g of taze) {
  if (g.tarih < dun) continue;
  const eski = harita.get(g.tarih);
  if (!eski) yeni++;
  else if (['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'].some((v) => eski[v] !== g[v])) {
    duzeltme++;
    console.warn(`Diyanet düzeltmesi ${g.tarih}: ${['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'].map((v) => `${eski[v]}→${g[v]}`).join(' ')}`);
  }
  harita.set(g.tarih, g);
}
const gunler = [...harita.values()].sort((a, b) => a.tarih.localeCompare(b.tarih));

try {
  dogrula(gunler);
} catch (e) {
  console.error('HATA: Diyanet verisi doğrulamayı geçemedi — ' + e.message);
  console.error('Mevcut veri korundu. İş bilerek başarısız sonlandırılıyor.');
  process.exit(1);
}

// dogrula() yalniz 7 gunluk asgariyi zorunlu kilar; asil hedef (icerik.ts) 45 gundur.
// Kisa pencere build'i kirmaz ama gorevliye erken haber verir.
const pencere = kalanGun(gunler);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `pencere_gun=${pencere ?? ''}\n`);
if (pencere !== null && pencere < 45) {
  console.warn(`[namaz] UYARI: kesintisiz pencere yalnız ${pencere} gün (hedef 45)`);
}

const ayniMi = eldeki && JSON.stringify(eldeki.gunler) === JSON.stringify(gunler);
if (ayniMi) {
  console.log(`değişiklik yok: ${gunler.length} gün (${gunler[0].tarih} → ${gunler.at(-1).tarih}) · kontrol kaynağı: ${kaynakAdi}`);
} else {
  const cikti = {
    kaynak: `Diyanet İşleri Başkanlığı — Marche-en-Famenne (ilçe ${ILCE})`,
    kaynakTuru: 'diyanet',           // veri kökeni damgası; 'diyanet' dışında bir değer görülürse veri şüphelidir
    kaynakUc: kaynakAdi === 'resmî sayfa' ? RESMI : AYNA,
    ilce: ILCE,
    ilceAdi: ILCE_ADI,
    guncelleme: new Date().toISOString(),
    gunler,
  };
  writeFileSync(OUT, JSON.stringify(cikti, null, 1));
  console.log(`yazıldı: ${gunler.length} gün (${gunler[0].tarih} → ${gunler.at(-1).tarih}) · kaynak: ${kaynakAdi} · yeni ${yeni}, düzeltme ${duzeltme}`);
}
const b = gunler.find((g) => g.tarih === bugun);
console.log(`bugün ${b.tarih}: imsak ${b.imsak} · güneş ${b.gunes} · öğle ${b.ogle} · ikindi ${b.ikindi} · akşam ${b.aksam} · yatsı ${b.yatsi}`);
console.log(`kesintisiz veri ömrü: ${kalanGun(gunler)} gün · toplam gün: ${gunler.length}`);
