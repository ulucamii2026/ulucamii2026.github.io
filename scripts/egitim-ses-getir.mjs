#!/usr/bin/env node
/**
 * egitim CI: git dışı sesleri CANLI egitim sitesinden geri alır ve manifest/künye ile doğrular (11 Kasım 2026).
 *
 *   node scripts/egitim-ses-getir.mjs [--taban https://egitim.ulucamii.be] [--hedef egitim/public] [--kok <depo>] [--esik N]
 *
 * Neden: kart seslendirmesi (≈ 95 MB) ve okuma sesleri (≈ 21 MB) git'te YOK (.gitignore); Hosting her yayında tam sürüm anlık görüntüsüdür.
 * Sesler olmadan derlenip yayınlanan bir CI, canlıdaki sesleri siler. Bu betik her manifest/künye girdisini canlı sitenin kendisinden indirir
 * (yeni bir dağıtım noktası YOK), bayt ve sha256'yı manifestle karşılaştırır; eksik, bozuk ya da yetim sorun varsa çıkış 1 (yayın başlamaz).
 * Geçerli bir dosya hedefte zaten varsa (actions/cache) yeniden indirilmez. Yeni ses ASLA CI'dan girmez: önce yerelde `npm run egitim:yayinla`,
 * sonra manifest commit'i (docs/EGITIM-PLATFORMU.md «Otomatik yayın»). Test: tests/egitim/ses-getir.test.mjs.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TABAN = 'https://egitim.ulucamii.be';

/** Manifestlerden beklenen dosyalar: [{ yol: '/media/ses/…', bayt, sha256 }]. */
export function beklenenler(kok = KOK) {
  const oku = (p) => JSON.parse(readFileSync(join(kok, p), 'utf8'));
  const kart = oku('src/data/ilim-yolu/kart-ses.json');
  const okuma = oku('docs/okuma-ses-kaynaklari-egitim.json');
  const liste = [];
  for (const [id, diller] of Object.entries(kart.kartlar)) for (const [dil, k] of Object.entries(diller)) liste.push({ yol: `${kart.taban}/${dil}/${id}.mp3`, bayt: k.bayt, sha256: k.sha256 });
  for (const [yol, k] of Object.entries(okuma)) liste.push({ yol, bayt: k.bayt, sha256: k.sha256 });
  for (const g of liste) {
    if (!/^\/media\/ses\/(kart|okuma)\/[\p{L}\p{N}_\-/.]+\.mp3$/u.test(g.yol) || g.yol.includes('..')) throw new Error(`manifestte geçersiz yol: ${g.yol}`);
    if (!/^[0-9a-f]{64}$/.test(g.sha256) || !Number.isInteger(g.bayt)) throw new Error(`manifestte geçersiz künye: ${g.yol}`);
  }
  return liste;
}

const sha256 = (veri) => createHash('sha256').update(veri).digest('hex');

/**
 * `getirFn(url)` → { ok, status, arrayBuffer() } (varsayılan fetch). Döner: { toplam, indirilen, onbellekten, hatalar }.
 * Hiçbir koşulda hedefte doğrulanmamış bayt bırakmaz: önce geçici dosyaya yazar, doğrular, sonra adlandırır.
 */
export async function getir({ kok = KOK, hedef = join(kok, 'egitim', 'public'), taban = TABAN, getirFn = fetch, esZamanli = 8, deneme = 3, bekle = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const liste = beklenenler(kok);
  const sonuc = { toplam: liste.length, indirilen: 0, onbellekten: 0, hatalar: [] };
  let sira = 0;
  const isci = async () => {
    for (let g = liste[sira++]; g; g = liste[sira++]) {
      const dosya = join(hedef, ...g.yol.split('/').filter(Boolean));
      if (existsSync(dosya) && statSync(dosya).size === g.bayt && sha256(readFileSync(dosya)) === g.sha256) { sonuc.onbellekten++; continue; }
      let hata = '';
      for (let d = 1; d <= deneme; d++) {
        try {
          const r = await getirFn(`${taban}${g.yol.split('/').map(encodeURIComponent).join('/')}`);
          if (!r.ok) { hata = `HTTP ${r.status}`; if (r.status === 404) break; throw new Error(hata); }
          const veri = Buffer.from(await r.arrayBuffer());
          if (veri.length !== g.bayt) { hata = `bayt tutmuyor (${veri.length} ≠ ${g.bayt})`; break; }
          if (sha256(veri) !== g.sha256) { hata = 'sha256 tutmuyor'; break; }
          mkdirSync(dirname(dosya), { recursive: true });
          writeFileSync(`${dosya}.indiriliyor`, veri);
          renameSync(`${dosya}.indiriliyor`, dosya);
          hata = '';
          sonuc.indirilen++;
          break;
        } catch (h) {
          hata = String(h.message ?? h);
          if (d < deneme) await bekle(500 * d);
        }
      }
      if (hata) sonuc.hatalar.push(`${g.yol}: ${hata}`);
    }
  };
  await Promise.all(Array.from({ length: esZamanli }, isci));
  return sonuc;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = process.argv.slice(2);
  const deger = (ad, v) => (a.includes(ad) ? a[a.indexOf(ad) + 1] : v);
  const kok = resolve(deger('--kok', KOK));
  const taban = deger('--taban', TABAN).replace(/\/$/, '');
  if (!/^https:\/\/(egitim\.ulucamii\.be|ulucamii-egitim\.web\.app)$/.test(taban)) { console.error('Yalnız egitim sitesinin kendi adresi kabul edilir.'); process.exit(2); }
  const hedef = resolve(deger('--hedef', join(kok, 'egitim', 'public')));
  const s = await getir({ kok, hedef, taban });
  console.log(`Ses geri alma: ${s.toplam} dosya, indirilen ${s.indirilen}, önbellekten ${s.onbellekten}, sorun ${s.hatalar.length}.`);
  if (s.hatalar.length) {
    console.error(`Ses geri alma BAŞARISIZ — yayın başlatılmaz.\n${s.hatalar.slice(0, 15).map((h) => `- ${h}`).join('\n')}${s.hatalar.length > 15 ? `\n- … ve ${s.hatalar.length - 15} tane daha` : ''}`);
    process.exit(1);
  }
}
