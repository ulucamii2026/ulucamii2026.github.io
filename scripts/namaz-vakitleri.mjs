// Namaz vakitleri — YALNIZCA Diyanet İşleri Başkanlığı verisi.
// Kaynak: ezanvakti.emushaf.net (Diyanet'in kendi ülke/şehir/ilçe kimliklerini ve takvimini birebir yansıtır;
//         ilçe 11890 = M.FAMENNE — Diyanet'in resmî sayfası da aynı kimliği kullanır:
//         https://namazvakitleri.diyanet.gov.tr/tr-TR/11890/mfamenne-icin-namaz-vakti)
//
// TASARIM KARARI (24 Ağu 2026): Hesaplama tabanlı YEDEK KAYNAK YOKTUR.
//   Daha önce Aladhan (method=13) yedeği vardı; Diyanet ucuna erişilemediği bir günde devreye girdi ve
//   Diyanet takviminden sapan vakitler yayımlandı (yatsıda 7 dk'ya varan fark). İbadet vakti söz konusu
//   olduğunda "yaklaşık doğru" veri kabul edilemez. Bu yüzden Diyanet verisi alınamazsa:
//     - mevcut JSON'a DOKUNULMAZ (elde 4 haftalık geçerli Diyanet verisi zaten vardır),
//     - betik hata kodu ile çıkar → GitHub Actions işi kırmızı olur ve bildirim gider.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const ILCE = '11890';                  // Diyanet ilçe kimliği — M.FAMENNE (Marche-en-Famenne)
const ILCE_ADI = 'M.FAMENNE';
const OUT = new URL('../src/data/namaz-vakitleri.json', import.meta.url);
const UC = `https://ezanvakti.emushaf.net/vakitler/${ILCE}`;
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;

const bekle = (ms) => new Promise((c) => setTimeout(c, ms));
const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());

/** Diyanet ucundan ham listeyi çeker; geçici hatalarda ısrarla yeniden dener.
 *  25 Ağustos 2026: çekim GitHub sunucusundan HTTP 403 aldı (aynı istek başka bir ağdan
 *  her User-Agent ile 200 dönüyor) — yani uç, bulut IP'lerini aralıklı olarak geri
 *  çeviriyor. Üç hızlı deneme bunu aşmaya yetmiyordu; artık 5 deneme ve giderek uzayan
 *  bekleme (10s → 30s → 60s → 120s) uygulanıyor, toplam ~3,5 dakika. Kaynak DEĞİŞMEZ:
 *  yalnız Diyanet. Yine de alınamazsa mevcut Diyanet verisi korunur ve uyarı gider. */
async function diyanetVerisiCek() {
  const DENEME = 5;
  const ARALIK = [10000, 30000, 60000, 120000];
  let sonHata;
  for (let deneme = 1; deneme <= DENEME; deneme++) {
    try {
      const r = await fetch(UC, {
        headers: {
          'User-Agent': 'ulucamii-site/1.0 (+https://ulucamii.be)',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr,fr;q=0.8,en;q=0.6',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      sonHata = e;
      console.warn(`deneme ${deneme}/${DENEME} başarısız: ${e.message}`);
      if (deneme < DENEME) await bekle(ARALIK[deneme - 1]);
    }
  }
  throw sonHata;
}

/** Ham Diyanet kaydını site biçimine çevirir. */
function donustur(g) {
  const k = g.MiladiTarihKisaIso8601 || g.MiladiTarihKisa || '';
  const m = k.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  return {
    tarih: m ? `${m[3]}-${m[2]}-${m[1]}` : k.slice(0, 10),
    hicri: g.HicriTarihUzun ?? g.HicriTarihKisa ?? '',
    imsak: g.Imsak, gunes: g.Gunes, ogle: g.Ogle, ikindi: g.Ikindi, aksam: g.Aksam, yatsi: g.Yatsi,
  };
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
}

let ham;
try {
  ham = await diyanetVerisiCek();
} catch (e) {
  console.error('HATA: Diyanet namaz vakitleri alınamadı — ' + e.message);
  console.error('Mevcut veri korundu (üzerine yazılmadı). İş bilerek başarısız sonlandırılıyor.');
  process.exit(1);
}

const gunler = ham.map(donustur).sort((a, b) => a.tarih.localeCompare(b.tarih));
try {
  dogrula(gunler);
} catch (e) {
  console.error('HATA: Diyanet verisi doğrulamayı geçemedi — ' + e.message);
  console.error('Mevcut veri korundu. İş bilerek başarısız sonlandırılıyor.');
  process.exit(1);
}

// Eski dosyayla BİRLEŞTİRME YOK: dosya yalnız bu çekimdeki Diyanet günlerini içerir.
// (Karışık kaynaklı kayıtların birikmesi, 24 Ağu 2026'daki hatanın taşıyıcısıydı.)
let oncekiKaynak = null;
if (existsSync(OUT)) { try { oncekiKaynak = JSON.parse(readFileSync(OUT, 'utf8')).kaynakTuru ?? null; } catch { /* yok say */ } }

const cikti = {
  kaynak: `Diyanet İşleri Başkanlığı — Marche-en-Famenne (ilçe ${ILCE})`,
  kaynakTuru: 'diyanet',           // veri kökeni damgası; 'diyanet' dışında bir değer görülürse veri şüphelidir
  ilce: ILCE,
  ilceAdi: ILCE_ADI,
  guncelleme: new Date().toISOString(),
  gunler,
};
writeFileSync(OUT, JSON.stringify(cikti, null, 1));
const b = gunler.find((g) => g.tarih === bugunISO());
console.log(`yazıldı: ${gunler.length} gün (${gunler[0].tarih} → ${gunler.at(-1).tarih}) · kaynak: Diyanet ilçe ${ILCE} (${ILCE_ADI})`);
console.log(`bugün ${b.tarih}: imsak ${b.imsak} · güneş ${b.gunes} · öğle ${b.ogle} · ikindi ${b.ikindi} · akşam ${b.aksam} · yatsı ${b.yatsi}`);
if (oncekiKaynak !== 'diyanet') console.log('NOT: önceki dosyanın kaynak damgası "%s" idi; bu çalıştırmayla Diyanet verisine geçildi.', oncekiKaynak ?? 'yok');
