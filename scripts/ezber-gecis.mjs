/**
 * Ezber Kilimi — eski ezber kayıtlarının geçişi (27 Eylül 2026, Faz 1b). Hoca ekranının `ilerleme/{ref}.ezber` alanını
 * (plan dizesi → baslamadi/tekrar/ogrendi) yeni `ezberDurum/{ref}` belgesine katalog kimliğiyle taşır. Hoca hesabıyla
 * çalışır; Firestore kuralları her yazımı doğrular. Mantık tek yerde: src/lib/ezber/depo.ts `eskiKayitlariTasi`
 * (emülatör testi: tests/kurallar/firestore.test.mjs). Kurallar: docs/EZBER-KILIMI.md «Eski kayıtların geçişi».
 *
 * Ne zaman: yeni hoca «Ezber» sekmesi yayına alındığı gün, kurallar canlıdayken; önce KURU çalıştırılır.
 * Kurallar: ogrendi → Hocaya okudu (kontrol +7 gün) · tekrar → Çalışıyor · baslamadi → kayıt açılmaz. Yeni sistemde
 * kaydı olan madde ezilmez; eski alan silinmez. Eşleşmeyen dize ya da tanınmayan değer varsa HİÇBİR ŞEY yazılmaz.
 *
 * KULLANIM
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/ezber-gecis.mjs          # kuru: yalnız sayılar
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/ezber-gecis.mjs --yaz    # yazar (yinelenebilir; kalanı tamamlar)
 *
 * Çıktı yalnız sayılar ve plan dizeleridir: öğrenci kimliği ya da adı yazılmaz.
 * ÇIKIŞ KODU: 0 (tamam) · 1 (engel ya da yazılamayan kayıt) · 2 (yapılandırma).
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, terminate } from 'firebase/firestore';

const YAZ = process.argv.includes('--yaz');
const { HOCA_EPOSTA, HOCA_SIFRE } = process.env;
if (!HOCA_EPOSTA || !HOCA_SIFRE) {
  console.error('HOCA_EPOSTA ve HOCA_SIFRE ortam değişkenleri gerekli (dernek hoca hesabı).');
  process.exit(2);
}

/* Kütüphane tarayıcı için yazıldı (uzantısız içe aktarmalar); Node için esbuild ile tek dosyaya derlenir. */
mkdirSync('node_modules/.cache', { recursive: true });
const paket = resolve('node_modules/.cache/ezber-gecis-cli.mjs');
await build({
  stdin: { contents: 'export * from "./src/lib/ezber/depo.ts";', resolveDir: process.cwd() },
  outfile: paket, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const { eskiKayitlariTasi } = await import(pathToFileURL(paket).href);

/* Yapılandırma tek kaynaktan (src/lib/firebase.ts) — defter betikleriyle aynı yol. */
const kaynak = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const alan = (ad) => kaynak.match(new RegExp(`${ad}:\\s*'([^']+)'`))?.[1];
const app = initializeApp({ apiKey: alan('apiKey'), authDomain: alan('authDomain'), projectId: alan('projectId') });
await signInWithEmailAndPassword(getAuth(app), HOCA_EPOSTA, HOCA_SIFRE);
const db = getFirestore(app);
const bugun = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());

const s = await eskiKayitlariTasi(db, bugun, { yaz: YAZ });
console.log(`Ezber geçişi (${bugun}) — kip: ${YAZ ? 'YAZ' : 'kuru'}`);
console.log(`  taranan öğrenci ${s.ogrenci} · eski ezber kaydı olan ${s.ezberli}`);
console.log(`  yazılacak madde ${s.yazilacak.length} (Hocaya okudu ${s.basamaklar[2]} · Çalışıyor ${s.basamaklar[1]})`);
console.log(`  yeni sistemde zaten olan (atlandı) ${s.atlanan} · bilerek karşılıksız ${s.karsiliksiz}`);
console.log(`  hocanın geçişten sonra kaldırdığı (yeniden yazılmaz) ${s.gecmisli}`);
for (const k of s.eslesmeyen) console.log('  ENGEL — eşleşmeyen plan dizesi:', k);
for (const k of s.bilinmeyenDurum) console.log('  ENGEL — tanınmayan durum değeri, dize:', k);
const engel = s.eslesmeyen.length + s.bilinmeyenDurum.length;
if (engel) console.log('Hiçbir kayıt yazılmadı. Eşlemeyi src/data/ezber/ altında ekleyin, `npm run test:ezber` yeşil olunca yeniden çalıştırın.');
if (YAZ) {
  console.log(`  yazılan ${s.yazilan} · yazılamayan ${s.hatali}`);
  const kodlar = [...new Set(s.hatalar)];
  if (kodlar.length) console.log('  hata kodları:', kodlar.join(', '), '— betiği yeniden çalıştırmak kalanı tamamlar.');
} else if (!engel) console.log('Yazmak için --yaz ekleyin.');
await terminate(db);
process.exit(engel || s.hatali ? 1 : 0);
