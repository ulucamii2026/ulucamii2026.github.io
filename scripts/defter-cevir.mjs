/**
 * Ders defteri çevirisi — toplu tamamlama (hoca hesabıyla). Hoca ekranı her kayıtta çeviriyi kendisi yazar
 * (src/scripts/ders-defteri.ts); bu betik ekran açılmadan önce yazılmış kayıtları, çevirisi başarısız olanları ve
 * kayıt değişince eskiyen çevirileri kapatır. Aynı kütüphane, aynı belge biçimi (src/lib/defter-ceviri.ts):
 * kalıp cümleler yerel Fransızca, serbest cümleler Apps Script çeviri ucu (tur: 'cevir', hoca kimliğiyle).
 *
 * Hedef öğrenciler: `ogrenciler.dil === 'fr'` ya da ailelerinden birinin iletişim dili Fransızca.
 * Yarım çeviri asla yazılmaz: makine katmanı başarısızsa kayıt atlanır ve listelenir.
 *
 * KULLANIM
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/defter-cevir.mjs                 # kuru: neyin çevrileceğini listeler
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/defter-cevir.mjs --yaz           # çevirir ve yazar
 *   … --ref UC-2026-0016 [--ref …]                                            # yalnız bu öğrenciler
 *   … --kalip                                                                 # makine yok: yalnız kalıp cümlelerden oluşan kayıtlar
 *
 * ÇIKIŞ KODU: 0 (tamam ya da eksik yok), 1 (çevrilemeyen kaldı), 2 (yapılandırma).
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const YAZ = process.argv.includes('--yaz');
const KALIP = process.argv.includes('--kalip');
const REFLER = process.argv.flatMap((a, i, arr) => (a === '--ref' && arr[i + 1] ? [arr[i + 1]] : []));
const { HOCA_EPOSTA, HOCA_SIFRE } = process.env;
if (!HOCA_EPOSTA || !HOCA_SIFRE) {
  console.error('HOCA_EPOSTA ve HOCA_SIFRE ortam değişkenleri gerekli (dernek hoca hesabı).');
  process.exit(2);
}

/* Kütüphane tarayıcı için yazıldı (uzantısız içe aktarmalar); Node için esbuild ile tek dosyaya derlenir. */
mkdirSync('node_modules/.cache', { recursive: true });
const paket = resolve('node_modules/.cache/defter-cevir-cli.mjs');
await build({
  stdin: { contents: 'export * from "./src/lib/defter-ceviri.ts"; export * from "./src/lib/ceviri-servisi.ts";', resolveDir: process.cwd() },
  outfile: paket, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const lib = await import(pathToFileURL(paket).href);

/* Yapılandırma tek kaynaktan (src/lib/firebase.ts, site.yaml) — diğer defter betikleriyle aynı yol. */
const kaynak = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const alan = (ad) => kaynak.match(new RegExp(`${ad}:\\s*'([^']+)'`))?.[1];
const uc = readFileSync(new URL('../src/content/ayarlar/site.yaml', import.meta.url), 'utf8')
  .match(/^\s+basvuru:\s*["']?(https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec)/m)?.[1];
if (!uc) { console.error('site.yaml → servisler.basvuru adresi bulunamadı.'); process.exit(2); }
const app = initializeApp({ apiKey: alan('apiKey'), authDomain: alan('authDomain'), projectId: alan('projectId') });
const auth = getAuth(app);
await signInWithEmailAndPassword(auth, HOCA_EPOSTA, HOCA_SIFRE);
const db = getFirestore(app);
const katalog = JSON.parse(readFileSync(new URL('../src/data/ders-defteri-2026-2027.json', import.meta.url), 'utf8'));
const dersById = new Map(katalog.map((d) => [d.id, d]));
const sonrakiDers = (d) => katalog[katalog.findIndex((x) => x.id === d.id) + 1] || null;
const makine = KALIP
  ? async () => { throw Error('kalip-modu'); }
  : lib.makineCevirici(uc, () => auth.currentUser.getIdToken());

const oku = async (kol) => (await getDocs(collection(db, kol))).docs.map((d) => ({ id: d.id, ...d.data() }));
const [ogrenciler, aileler] = await Promise.all([oku('ogrenciler'), oku('aileler')]);
const frAile = new Set(aileler.filter((a) => a.iletisimDili === 'fr' || a.dil === 'fr').flatMap((a) => a.ogrenciler || []));
const hedef = ogrenciler
  .filter((o) => (o.dil === 'fr' || frAile.has(o.id)) && (!REFLER.length || REFLER.includes(o.id)))
  .sort((a, b) => a.id.localeCompare(b.id));
console.log(`Fransızca aile: ${hedef.length} öğrenci${REFLER.length ? ` (süzgeç: ${REFLER.join(', ')})` : ''}. Kip: ${YAZ ? 'YAZ' : 'kuru'}${KALIP ? ' · yalnız kalıp' : ''}.`);

let toplam = 0, guncel = 0, yazilan = 0;
const kalan = [];
for (const o of hedef) {
  const [kayitlar, ceviriler] = await Promise.all([oku(`dersDefteri/${o.id}/kayitlar`), oku(`dersDefteri/${o.id}/ceviriler`)]);
  const c = new Map(ceviriler.map((x) => [x.id, x]));
  for (const k of kayitlar.sort((a, b) => a.id.localeCompare(b.id))) {
    toplam++;
    const mevcut = c.get(lib.ceviriKimligi(k.id, 'fr'));
    if (lib.ceviriGuncel(k, mevcut)) { guncel++; continue; }
    const d = dersById.get(k.id);
    if (!d) { kalan.push(`${o.id} ${k.id} (katalogda yok)`); continue; }
    const parcalar = lib.kaydinParcalari(k, d, sonrakiDers(d));
    const serbest = Object.values(parcalar).flat().filter((p) => !p.fr).map((p) => p.tr);
    const etiket = `${o.id} ${k.id} · ${k.durum} · ${serbest.length ? `${serbest.length} serbest cümle` : 'yalnız kalıp'}${mevcut ? ` · eski çeviri (sürüm ${mevcut.kaynakSurum} → ${k.surum})` : ''}`;
    if (!YAZ) { console.log('  çevrilecek:', etiket); continue; }
    try {
      const ceviri = await lib.defterKaydiniCevir(k, d, sonrakiDers(d), 'fr', makine);
      await lib.ceviriDeposu(db, o.id).kaydet(ceviri);
      yazilan++;
      console.log('  yazıldı  :', etiket, `→ ${ceviri.yontem}`);
    } catch (e) {
      kalan.push(`${etiket} — ${e?.message || e}`);
    }
  }
}
console.log(`\nToplam ${toplam} kayıt; güncel çeviri ${guncel}; ${YAZ ? `yazılan ${yazilan}` : `çevrilecek ${toplam - guncel}`}; çevrilemeyen ${kalan.length}.`);
for (const k of kalan) console.log('  KALAN:', k);
if (!YAZ) console.log('Yazmak için --yaz ekleyin.');
process.exit(YAZ && kalan.length ? 1 : 0);
