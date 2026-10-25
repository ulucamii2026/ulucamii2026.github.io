/**
 * Ders günü ezber takvimi (25 Ekim 2026): kurs projesindeki «ezber köşesi» planından (tek kaynak) platformun okuduğu türev dosyayı üretir.
 *
 *   Kaynak : D:/ulu-camii-kuran-kursu/veri/ezber-kosesi-2026-2027.json  (kurs projesi; bu depoda DEĞİL, yalnız okunur)
 *   Türev  : src/data/ezber/ders-takvimi-2026-2027.json                  (depoda; platform ve testler bunu okur)
 *
 * Türev dosya yalnız VELİYE ve ÇOCUĞA gösterilecek alanları taşır: tarih, gün, kip ve beş ezber listesi (yeni, pekiştirme, dinleme, plan,
 * kalıcı). Kaynaktaki öğreticiye ait alanlar (`not`, `plan_konusu`, `bireysel`, `karar`, `ayarlar` ve bütün öteki alanlar) BİLEREK kopyalanmaz:
 * öğreticinin adını ve bireysel dinleme listesini içerirler. Yalnız beyaz listedeki alanlar alınır; kaynağa yeni bir alan eklenirse
 * kendiliğinden dışarıda kalır (uyarı basılır). «Diğer derslerin ezberi» türev dosyada YOKTUR: yıllık plandan derleme anında hesaplanır
 * (egitim/src/lib/ders-takvimi.ts).
 *
 * Kullanım:
 *   node scripts/ezber-ders-takvimi.mjs                    → türev dosyayı yazar (içerik değişmediyse dosyaya dokunmaz)
 *   node scripts/ezber-ders-takvimi.mjs --denetle          → kaynak yerelde varsa ve türev dosya eskiyse hata verir; kaynak yoksa (CI) atlar
 *   node scripts/ezber-ders-takvimi.mjs --kaynak <yol>     → kaynak yolunu verir (ya da EZBER_KOSESI_KAYNAK ortam değişkeni)
 *   node scripts/ezber-ders-takvimi.mjs --hedef <yol>      → türev dosyanın yolunu verir (yalnız testler için; varsayılan depodaki dosya)
 *
 * Güncel sayılma ölçüsü: `uretim` HARİÇ her şey (kaynağın SHA-256'sı dâhil) yeniden üretilenle aynı olmalı. Kaynağın yalnız öğretici alanları
 * değişse bile özet değişir; bu durumda betiği bir kez çalıştırmak yeter (liste aynı kalır, yalnız özet güncellenir).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
export const HEDEF = join(KOK, 'src/data/ezber/ders-takvimi-2026-2027.json');
export const KATALOG = join(KOK, 'src/data/ezber/katalog.json');
export const VARSAYILAN_KAYNAK = 'D:/ulu-camii-kuran-kursu/veri/ezber-kosesi-2026-2027.json';
/** Türev dosyada yazılan kaynak tanımı: kişisel bir mutlak yol değil, projenin göreli adı. */
export const KAYNAK_ADI = 'ulu-camii-kuran-kursu/veri/ezber-kosesi-2026-2027.json';

export const KIPLER = Object.freeze(['kose', 'plan-ezber', 'tekrar', 'tam-ders']);
/** Maddesi `{id, ayet?, bolum?}` olan listeler ve yalnız kimlik dizisi olan listeler (türev dosyadaki sıra). */
export const NESNE_LISTELERI = Object.freeze(['yeni', 'pekistir', 'dinleme']);
export const KIMLIK_LISTELERI = Object.freeze(['plan', 'kalici']);
/** Kaynakta bilinen, bilerek kopyalanmayan gün alanları (öğreticiye ait); bunların dışındaki bilinmeyen alan uyarı verir. */
const BILINEN_DISARIDA = new Set(['not', 'plan_konusu', 'bireysel']);
const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const TARIH = /^(\d{4})-(\d{2})-(\d{2})$/;
const tamSayi = (x) => Number.isInteger(x) && x >= 1;

/** Takvim gününün haftanın günü (UTC takvimi, yaz saati kaymaz). */
export function gunAdi(tarih) {
  const [, y, a, g] = TARIH.exec(tarih);
  return GUN_ADLARI[new Date(Date.UTC(Number(y), Number(a) - 1, Number(g))).getUTCDay()];
}

function maddeTemizle(x, nerede) {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id) throw new Error(`${nerede}: madde {id} olmalı.`);
  const cikti = { id: x.id };
  if (x.ayet !== undefined) {
    if (!Array.isArray(x.ayet) || x.ayet.length !== 2 || !x.ayet.every(tamSayi) || x.ayet[0] > x.ayet[1]) throw new Error(`${nerede}: ${x.id} ayet [başlangıç, bitiş] olmalı.`);
    cikti.ayet = [x.ayet[0], x.ayet[1]];
  }
  if (x.bolum !== undefined) {
    if (!tamSayi(x.bolum)) throw new Error(`${nerede}: ${x.id} bolum pozitif tam sayı olmalı.`);
    cikti.bolum = x.bolum;
  }
  return cikti;
}

/**
 * Kaynak metinden türev nesne. `katalogKimlikleri` verilirse her kimliğin kataloğda bulunması şart. `uretim` çağıran verir (testlerde sabit).
 * Hata → fırlatır; kaynakta olmayan gün alanı beyaz listeye eklenmez.
 */
export function takvimUret(kaynakMetni, { katalogKimlikleri, uretim, uyar = () => {} } = {}) {
  const kaynak = JSON.parse(kaynakMetni);
  if (!Array.isArray(kaynak.gunler) || !kaynak.gunler.length) throw new Error('Kaynakta gunler[] yok.');
  const gunler = [];
  let onceki = '';
  for (const g of kaynak.gunler) {
    const nerede = g.tarih ?? '(tarihsiz gün)';
    if (typeof g.tarih !== 'string' || !TARIH.test(g.tarih)) throw new Error(`${nerede}: tarih YYYY-AA-GG olmalı.`);
    if (g.tarih <= onceki) throw new Error(`${nerede}: günler artan ve tekil sırada olmalı (önceki ${onceki}).`);
    onceki = g.tarih;
    if (g.gun !== gunAdi(g.tarih)) throw new Error(`${nerede}: «${g.gun}» o günün adı değil (${gunAdi(g.tarih)}).`);
    if (!KIPLER.includes(g.kip)) throw new Error(`${nerede}: bilinmeyen kip «${g.kip}».`);
    const gun = { tarih: g.tarih, gun: g.gun, kip: g.kip };
    for (const ad of NESNE_LISTELERI) {
      if (g[ad] === undefined) continue;
      if (!Array.isArray(g[ad])) throw new Error(`${nerede}: ${ad} dizi olmalı.`);
      const liste = g[ad].map((x) => maddeTemizle(x, `${nerede}.${ad}`));
      if (liste.length) gun[ad] = liste;
    }
    for (const ad of KIMLIK_LISTELERI) {
      if (g[ad] === undefined) continue;
      if (!Array.isArray(g[ad]) || !g[ad].every((x) => typeof x === 'string' && x)) throw new Error(`${nerede}: ${ad} kimlik dizisi olmalı.`);
      if (g[ad].length) gun[ad] = [...g[ad]];
    }
    for (const k of Object.keys(g)) {
      if (['tarih', 'gun', 'kip', ...NESNE_LISTELERI, ...KIMLIK_LISTELERI].includes(k) || BILINEN_DISARIDA.has(k)) continue;
      uyar(`${nerede}: bilinmeyen kaynak alanı «${k}» türev dosyaya alınmadı.`);
    }
    gunler.push(gun);
  }
  if (katalogKimlikleri) {
    for (const g of gunler) {
      for (const ad of [...NESNE_LISTELERI, ...KIMLIK_LISTELERI]) {
        for (const x of g[ad] ?? []) {
          const id = typeof x === 'string' ? x : x.id;
          if (!katalogKimlikleri.has(id)) throw new Error(`${g.tarih}.${ad}: «${id}» kataloğda yok.`);
        }
      }
    }
  }
  return {
    kaynak: KAYNAK_ADI,
    kaynakSha256: createHash('sha256').update(kaynakMetni).digest('hex'),
    uretim,
    gunler,
  };
}

/** Dosya metni: üst alanlar satır satır, her gün tek satır (diff okunur kalır). Sonda yeni satır. */
export function takvimMetni(t) {
  const gunSatirlari = t.gunler.map((g) => `    ${JSON.stringify(g)}`).join(',\n');
  return `{\n  "kaynak": ${JSON.stringify(t.kaynak)},\n  "kaynakSha256": ${JSON.stringify(t.kaynakSha256)},\n  "uretim": ${JSON.stringify(t.uretim)},\n  "gunler": [\n${gunSatirlari}\n  ]\n}\n`;
}

/** Brüksel takvim günü (YYYY-AA-GG). */
export function brukselBugun(simdi = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(simdi).map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** `uretim` hariç içerik karşılaştırması için kanonik metin. */
const uretimsiz = (t) => takvimMetni({ ...t, uretim: '' });

function katalogKimlikleriOku() {
  return new Set(JSON.parse(readFileSync(KATALOG, 'utf8')).ogeler.map((o) => o.id));
}

function secenek(argumanlar, ad) {
  const i = argumanlar.indexOf(ad);
  if (i < 0) return undefined;
  if (!argumanlar[i + 1]) throw new Error(`${ad} bir yol ister.`);
  return argumanlar[i + 1];
}
const kaynakYolu = (argumanlar) => secenek(argumanlar, '--kaynak') ?? (process.env.EZBER_KOSESI_KAYNAK || VARSAYILAN_KAYNAK);

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argumanlar = process.argv.slice(2);
  const denetle = argumanlar.includes('--denetle');
  const yol = kaynakYolu(argumanlar);
  const hedef = secenek(argumanlar, '--hedef') ?? HEDEF;
  if (!existsSync(yol)) {
    if (denetle) {
      console.log(`Ders takvimi: kaynak bu makinede yok (${yol}); güncellik denetimi atlandı (CI'da beklenen durum).`);
      process.exit(0);
    }
    console.error(`Kaynak bulunamadı: ${yol}\n--kaynak <yol> ya da EZBER_KOSESI_KAYNAK ile verin.`);
    process.exit(2);
  }
  const yeni = takvimUret(readFileSync(yol, 'utf8'), { katalogKimlikleri: katalogKimlikleriOku(), uretim: brukselBugun(), uyar: (m) => console.warn(`UYARI ${m}`) });
  const mevcut = (() => { try { return JSON.parse(readFileSync(hedef, 'utf8')); } catch { return null; } })();
  const ayni = mevcut !== null && uretimsiz(mevcut) === uretimsiz(yeni);
  if (denetle) {
    if (!ayni) {
      console.error(`${hedef === HEDEF ? 'src/data/ezber/ders-takvimi-2026-2027.json' : hedef} kaynakla aynı değil (eski ya da eksik): node scripts/ezber-ders-takvimi.mjs`);
      process.exit(1);
    }
    console.log(`Ders takvimi güncel (${yeni.gunler.length} gün, kaynak özeti ${yeni.kaynakSha256.slice(0, 12)}…).`);
  } else if (ayni) {
    console.log(`Ders takvimi zaten güncel (${yeni.gunler.length} gün); dosyaya dokunulmadı.`);
  } else {
    writeFileSync(hedef, takvimMetni(yeni));
    console.log(`Yazıldı: ${hedef === HEDEF ? 'src/data/ezber/ders-takvimi-2026-2027.json' : hedef} (${yeni.gunler.length} gün, kaynak özeti ${yeni.kaynakSha256.slice(0, 12)}…).`);
  }
}
