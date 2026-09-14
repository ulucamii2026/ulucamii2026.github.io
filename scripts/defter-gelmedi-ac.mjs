/**
 * Gelmeyen öğrencilerin açılmamış ders defteri kayıtlarını açar — hoca ekranındaki
 * «Gelmeyenlerin defterini doldur» düğmesinin komut satırı eşi (hoca hesabıyla).
 *
 * Kaynak kural: yoklamada «yok» → defter `gelmedi`, «mazeret» → `mazeretli` (YOKLAMA_DURUMU);
 * yazma işi kütüphanedeki `topluGelmediYaz` ile yapılır (src/lib/ders-defteri.ts), yani belge
 * biçimi ekranla birebir aynıdır (standart not, giris «dijital», surum 1). VAR OLAN KAYDA ASLA
 * DOKUNULMAZ: adaylar önce okunur, yalnız eksik olanlar yazılır. `scripts/defter-yoklama-denetim.mjs`
 * «DEFTERİ AÇILMAMIŞ n ders» diyorsa eksikleri bu betik kapatır.
 *
 * NEDEN: 1. hafta (5–6 Eyl 2026) hoca ekranından önce işlendi; gelmeyen dört öğrencinin 16 dersi
 * defterde hiç açılmamıştı (14 Eyl 2026). Hoca ekranı 12 Eyl'den beri bunu düğmeyle yapıyor.
 *
 * KULLANIM
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/defter-gelmedi-ac.mjs                 # kuru: yalnız listeler
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/defter-gelmedi-ac.mjs --yaz           # yazar
 *   … --tarih 2026-09-05 [--tarih 2026-09-06]                                     # yalnız bu günler
 *
 * ÇIKIŞ KODU: 0 (yazıldı ya da eksik yok), 2 (yapılandırma), 1 (hata).
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { topluGelmediYaz, YOKLAMA_DURUMU, GELMEDI_NOTU } from '../src/lib/ders-defteri.ts';

const YAZ = process.argv.includes('--yaz');
const TARIHLER = process.argv.flatMap((a, i, arr) => (a === '--tarih' && arr[i + 1] ? [arr[i + 1]] : []));
const { HOCA_EPOSTA, HOCA_SIFRE } = process.env;
if (!HOCA_EPOSTA || !HOCA_SIFRE) {
  console.error('HOCA_EPOSTA ve HOCA_SIFRE ortam değişkenleri gerekli (dernek hoca hesabı).');
  process.exit(2);
}

/* Yapılandırma tek kaynaktan (src/lib/firebase.ts) — defter-yoklama-denetim.mjs ile aynı yol. */
const kaynak = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const alan = (ad) => kaynak.match(new RegExp(`${ad}:\\s*'([^']+)'`))?.[1];
const app = initializeApp({ apiKey: alan('apiKey'), authDomain: alan('authDomain'), projectId: alan('projectId') });
await signInWithEmailAndPassword(getAuth(app), HOCA_EPOSTA, HOCA_SIFRE);
const db = getFirestore(app);

/* Katalog: ekranın kullandığı ders listesi (id = tarih_sira). */
const katalog = JSON.parse(readFileSync(new URL('../src/data/ders-defteri-2026-2027.json', import.meta.url), 'utf8'));
const dersById = new Map(katalog.map((d) => [d.id, d]));

const ogrenciler = (await getDocs(collection(db, 'ogrenciler'))).docs.map((d) => ({ ref: d.id, ...d.data() }));
const adi = (r) => { const o = ogrenciler.find((x) => x.ref === r); return o ? `${o.ad} ${o.soyad}` : r; };

const yoklama = (await getDocs(collection(db, 'yoklama'))).docs
  .map((d) => { const v = d.data(); return { ref: v.ref || d.id.split('_')[0], tarih: v.tarih || d.id.split('_')[1], dersler: v.dersler && typeof v.dersler === 'object' ? v.dersler : v.durum ? { 1: v.durum, 2: v.durum, 3: v.durum } : {} }; })
  .filter((y) => !TARIHLER.length || TARIHLER.includes(y.tarih));

/* Adaylar: ekranın gelmeyenDersler() kuralı — yoklama durumu YOKLAMA_DURUMU'nda olan her ders. */
const adaylar = [];
for (const y of yoklama)
  for (const [sira, durumY] of Object.entries(y.dersler)) {
    const durum = YOKLAMA_DURUMU[durumY];
    if (!durum) continue;
    const ders = dersById.get(`${y.tarih}_${sira}`);
    if (!ders) { console.warn(`katalogda yok: ${y.tarih}_${sira} (${adi(y.ref)})`); continue; }
    adaylar.push({ ref: y.ref, ders, durum });
  }

/* Var olan kayda ASLA dokunulmaz: önce her adayın kayıtları okunur. */
const mevcut = new Map();
for (const r of new Set(adaylar.map((a) => a.ref)))
  mevcut.set(r, new Set((await getDocs(collection(db, 'dersDefteri', r, 'kayitlar'))).docs.map((d) => d.id)));
const yazilacak = adaylar.filter((a) => !mevcut.get(a.ref).has(a.ders.id))
  .sort((a, b) => a.ref.localeCompare(b.ref) || a.ders.id.localeCompare(b.ders.id));

console.log(`yoklama günü-öğrenci: ${yoklama.length} · gelmeyen ders adayı: ${adaylar.length} · zaten kayıtlı: ${adaylar.length - yazilacak.length}`);
if (!yazilacak.length) { console.log('Eksik yok: gelmeyen derslerin hepsinin kaydı var.'); process.exit(0); }
console.log(`AÇILACAK ${yazilacak.length} ders kaydı (${new Set(yazilacak.map((x) => x.ref)).size} öğrenci):`);
for (const x of yazilacak) console.log(`  ${x.ref} ${x.ders.id}  ${adi(x.ref).padEnd(22)} ${x.durum.padEnd(9)} «${GELMEDI_NOTU[x.durum]}»  ${x.ders.konu}`);
if (!YAZ) { console.log('Kuru çalışma — hiçbir şey yazılmadı. Yazmak için --yaz.'); process.exit(0); }

const n = await topluGelmediYaz(db, yazilacak.map((x) => ({ ref: x.ref, ders: x.ders, durum: x.durum })));
console.log(`${n} ders kaydı açıldı. Var olan kayıtlara dokunulmadı.`);
