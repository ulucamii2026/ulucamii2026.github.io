/**
 * GoatCounter istatistiklerini derleme zamanında çeker → src/data/istatistik.json
 *
 * Neden: vaaz listesinde «kaç kez okundu» ve «en çok okunanlar» için sayfa başına ayrı
 * istemci isteği atmak (150+ istek) hem yavaş hem savurgan. Sayılar derlemede bir kez alınır;
 * site zaten her gün 03:30 UTC'de yeniden yayımlandığı için veri günlük tazelenir.
 * Okuma sayfasındaki anlık sayaç (components/Goruntulenme.astro) bundan bağımsızdır.
 *
 * Belirteç: GOATCOUNTER_TOKEN ortam değişkeni (yalnız «Read statistics» yetkisi).
 * Depoda YOKTUR — GitHub Actions sırrı. Belirteç yoksa ya da uç nokta erişilemezse
 * dosyaya dokunulmaz; site sayısız çalışır (özellik sessizce kapanır).
 *
 * Kullanım: node scripts/istatistik-cek.mjs
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEDEF = join(KOK, 'src/data/istatistik.json');
const UC = 'https://ulucamii.goatcounter.com/api/v0';
const BASLANGIC = '2026-08-01T00:00:00Z'; // sitenin yayına girdiği ay
const belirtec = process.env.GOATCOUNTER_TOKEN;

const bitir = (mesaj) => { console.log(`istatistik-cek: ${mesaj} — mevcut dosyaya dokunulmadı`); process.exit(0); };

if (!belirtec) bitir('GOATCOUNTER_TOKEN yok');

const getir = async (yol) => {
  const y = await fetch(UC + yol, {
    headers: { Authorization: `Bearer ${belirtec}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!y.ok) throw new Error(`${yol} → HTTP ${y.status}`);
  return y.json();
};

/* 🛑 GÜVENLİK (12 Eyl 2026): GoatCounter yolu SORGU DİZESİYLE birlikte veriyor ve bu dosya
   herkese açık depoda duruyor. Veli portalı ile hoca ekranının Firebase e-posta giriş
   bağlantıları (`/tr/veli-portali/?apiKey=…&oobCode=…`) böylece iki kez bu JSON'a düşmüştü:
   `oobCode` tek kullanımlık OTURUM AÇMA anahtarıdır, yayımlanması hesap devralma riskidir.
   Bu yüzden yol artık daima sorgu dizesinden ve çapadan arındırılır. Yan faydası: aynı
   sayfanın farklı sorgularla bölünen sayımları birleşir. Olay adları (indir-pdf/… gibi)
   yol değildir, dokunulmaz. */
const yolNormalle = (yol) => String(yol ?? '').split('#')[0].split('?')[0] || '/';

try {
  /* Uç nokta bir turda en çok 100 yol verir ve sayfalama «exclude_paths» ile yapılır:
     görülen path_id'ler dışlanınca bir sonraki 100 gelir. Olaylar (indir-pdf/… gibi) ayrı tutulur. */
  const yollar = {};
  const olaylar = {};
  const gorulen = [];
  for (let tur = 0; tur < 20; tur++) {
    const p = new URLSearchParams({ start: BASLANGIC, limit: '100', daily: 'true' });
    if (gorulen.length) p.set('exclude_paths', gorulen.join(',')); // virgüllü liste: tekrarlı parametre uzun URL'de 400 veriyor
    const veri = await getir(`/stats/hits?${p}`);
    for (const h of veri.hits ?? []) {
      const hedef = h.event ? olaylar : yollar;
      const anahtar = h.event ? h.path : yolNormalle(h.path);
      hedef[anahtar] = (hedef[anahtar] ?? 0) + h.count;
      gorulen.push(String(h.path_id));
    }
    if (!veri.more || !(veri.hits ?? []).length) break;
  }

  const toplam = Object.values(yollar).reduce((a, b) => a + b, 0);
  if (!Object.keys(yollar).length) bitir('uçtan boş liste geldi');

  const cikti = {
    guncelleme: new Date().toISOString().slice(0, 10),
    baslangic: BASLANGIC.slice(0, 10),
    toplam,
    yollar: Object.fromEntries(Object.entries(yollar).sort((a, b) => b[1] - a[1])),
    olaylar: Object.fromEntries(Object.entries(olaylar).sort((a, b) => b[1] - a[1])),
  };
  const onceki = existsSync(HEDEF) ? readFileSync(HEDEF, 'utf8') : '';
  const yeni = JSON.stringify(cikti, null, 1) + '\n';
  if (onceki !== yeni) writeFileSync(HEDEF, yeni);
  console.log(`istatistik-cek: ${Object.keys(yollar).length} yol, ${Object.keys(olaylar).length} olay, toplam ${toplam}`);
} catch (e) {
  bitir(String(e.message ?? e).slice(0, 120));
}
