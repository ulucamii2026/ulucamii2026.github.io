/**
 * Veli mazereti → yoklama → ders defteri tutarlılık denetimi
 * (hoca hesabıyla, salt okuma; `--duzelt` ile onarır).
 *
 * 1. KALICI KURAL — veli mazereti her zaman kabul edilir
 *   `bildirimler` içinde `tur: 'mazeret'` ve `tarih: <ders günü>` olan bir veli mesajı varsa,
 *   o öğrencinin o günkü dersleri `mazeret` sayılır. Betik yoklamada «yok» kalmış dersleri
 *   bulur; `--duzelt` bunları `mazeret` yapar ve `veliMazereti` izini yazar.
 *   Dokunulmayanlar: «var»/«gec» (çocuk mazerete rağmen gelmiş) ve hocanın kural uygulandıktan
 *   SONRA bilerek «yok»a çevirdiği ders (`veliMazereti` listesinde olanlar). Aynı kural hoca
 *   ekranında da işler (src/lib/ders-defteri.ts → mazeretKuraliniUygula).
 *
 * 2. YOKLAMA → DERS DEFTERİ
 *   Her `dersDefteri/{ref}/kayitlar/{tarih}_{sıra}` kaydı için o günün `yoklama/{ref}_{tarih}`
 *   belgesindeki aynı sıranın durumuna bakar:
 *     yoklama «yok»     → defter durumu `gelmedi`     olmalı
 *     yoklama «mazeret» → defter durumu `mazeretli`   olmalı
 *     yoklama «var/gec» → defter durumu işlenmiş bir durum olmalı (islendi/kismen/ertelendi)
 *   Ayrıca yoklamada gelmemiş sayılıp defteri hiç açılmamış dersleri (eksik kayıt) listeler.
 *
 * NEDEN
 *   12 Eylül 2026'da 45 kaydın 30'u gelmeyen öğrencilere aitti ve hepsi `islendi` yazılmıştı:
 *   ders o öğrenciye İŞLENMİŞ görünüyordu. `gelmedi`/`mazeretli` durumları o gün eklendi
 *   (src/lib/ders-defteri.ts); bu betik hem eski kayıtları onarır hem de tekrarını yakalar.
 *
 * KULLANIM
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/defter-yoklama-denetim.mjs            # rapor
 *   HOCA_EPOSTA=… HOCA_SIFRE=… node scripts/defter-yoklama-denetim.mjs --duzelt   # durumu düzeltir
 *
 *   `--duzelt` yalnız yoklamanın `dersler`/`veliMazereti` alanlarını ve defterin `durum` alanını
 *   değiştirir; hocanın yazdığı metinlere (calisma, odev, okunan, dikkat, sonraki, yoklama notu)
 *   dokunmaz, eksik defter kaydı AÇMAZ (onu hoca ekranındaki «Gelmeyenlerin defterini doldur»
 *   düğmesi yapar) ve hiç alınmamış yoklamayı oluşturmaz.
 *
 * ÇIKIŞ KODU: tutarsızlık kaldıysa 1.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const DUZELT = process.argv.includes('--duzelt');
const { HOCA_EPOSTA, HOCA_SIFRE } = process.env;
if (!HOCA_EPOSTA || !HOCA_SIFRE) {
  console.error('HOCA_EPOSTA ve HOCA_SIFRE ortam değişkenleri gerekli (dernek hoca hesabı).');
  process.exit(2);
}
const BEKLENEN = { yok: 'gelmedi', mazeret: 'mazeretli' };
const ISLENMIS = new Set(['islendi', 'kismen', 'ertelendi']);

/* Yapılandırma tek kaynaktan okunur (src/lib/firebase.ts). Değerler gizli değildir — tarayıcıya
   zaten iner, güvenlik firestore.rules'a dayanır — ama ikinci bir kopya tutulmaz. */
const kaynak = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const alan = (ad) => kaynak.match(new RegExp(`${ad}:\\s*'([^']+)'`))?.[1];
const app = initializeApp({
  apiKey: alan('apiKey'),
  authDomain: alan('authDomain'),
  projectId: alan('projectId'),
});
await signInWithEmailAndPassword(getAuth(app), HOCA_EPOSTA, HOCA_SIFRE);
const db = getFirestore(app);

const ogrenciler = (await getDocs(collection(db, 'ogrenciler'))).docs.map((d) => ({ ref: d.id, ...d.data() }));
const adi = (r) => { const o = ogrenciler.find((x) => x.ref === r); return o ? `${o.ad} ${o.soyad}` : r; };

const yoklamaBelgeleri = (await getDocs(collection(db, 'yoklama'))).docs.map((d) => {
  const v = d.data();
  return {
    id: d.id,
    ref: v.ref || d.id.split('_')[0],
    tarih: v.tarih,
    dersler: v.dersler && typeof v.dersler === 'object'
      ? { ...v.dersler }
      : v.durum ? { 1: v.durum, 2: v.durum, 3: v.durum } : {},
    veliMazereti: Array.isArray(v.veliMazereti) ? v.veliMazereti : [],
  };
});

/* ── 1. KALICI KURAL: veliden gelen mazeret her zaman kabul edilir ───────────────────────────── */
const mazeretGunleri = new Set(
  (await getDocs(collection(db, 'bildirimler'))).docs
    .map((d) => d.data())
    .filter((b) => b.tur === 'mazeret' && b.tarih && b.ref)
    .map((b) => `${b.ref}|${b.tarih}`),
);
const mazeretBulgulari = [];
for (const y of yoklamaBelgeleri) {
  if (!mazeretGunleri.has(`${y.ref}|${y.tarih}`)) continue;
  const oto = new Set(y.veliMazereti);
  const siralar = Object.keys(y.dersler).filter((s) => y.dersler[s] === 'yok' && !oto.has(s));
  // `y` referansı korunur: düzeltme sonrası aşağıdaki defter denetimi güncel hâli görsün.
  if (siralar.length) mazeretBulgulari.push({ y, siralar, oto });
}
if (!mazeretBulgulari.length) console.log('TEMİZ: veli mazereti olan hiçbir ders «Yok» kalmamış.');
else {
  console.log(`\nVELİ MAZERETİ VARKEN «YOK» İŞARETLİ — ${mazeretBulgulari.length} gün:`);
  for (const b of mazeretBulgulari)
    console.log(`  ${b.y.tarih}  ${adi(b.y.ref).padEnd(22)} ders ${b.siralar.join(', ')} → mazeret`);
}
if (DUZELT && mazeretBulgulari.length) {
  for (const b of mazeretBulgulari) {
    for (const s of b.siralar) { b.y.dersler[s] = 'mazeret'; b.oto.add(s); }
    b.y.veliMazereti = [...b.oto].sort();
    await updateDoc(doc(db, 'yoklama', b.y.id), {
      dersler: b.y.dersler, veliMazereti: b.y.veliMazereti, zaman: serverTimestamp(),
    });
  }
  console.log(`${mazeretBulgulari.length} günün yoklaması mazeretli olarak düzeltildi.`);
}

const yoklama = {};
for (const y of yoklamaBelgeleri) (yoklama[y.ref] ??= {})[y.tarih] = y.dersler;
const bulgular = [];
const eksikler = [];
let kayitSayisi = 0;

for (const o of ogrenciler) {
  for (const d of (await getDocs(collection(db, 'dersDefteri', o.ref, 'kayitlar'))).docs) {
    const k = d.data();
    kayitSayisi += 1;
    const y = yoklama[o.ref]?.[k.tarih]?.[String(k.sira)];
    if (!y) continue;
    const beklenen = BEKLENEN[y];
    if (beklenen && k.durum !== beklenen) bulgular.push({ ref: o.ref, id: d.id, y, eski: k.durum, yeni: beklenen, surum: k.surum });
    else if (!beklenen && !ISLENMIS.has(k.durum))
      console.log(`UYARI  ${o.ref} ${d.id}: yoklama «${y}» ama defter «${k.durum}» — elle bakın (otomatik düzeltilmez).`);
  }
  // Yoklamada gelmemiş sayılıp defteri hiç açılmamış dersler
  const kayitli = new Set((await getDocs(collection(db, 'dersDefteri', o.ref, 'kayitlar'))).docs.map((d) => d.id));
  for (const [tarih, dersler] of Object.entries(yoklama[o.ref] || {}))
    for (const [sira, durum] of Object.entries(dersler))
      if (BEKLENEN[durum] && !kayitli.has(`${tarih}_${sira}`)) eksikler.push(`${o.ref} ${tarih}_${sira} (${durum})`);
}

console.log(`\nDers defteri kaydı: ${kayitSayisi} · yoklaması olan öğrenci: ${Object.keys(yoklama).length}`);
if (!bulgular.length) console.log('TEMİZ: her defter kaydının durumu yoklamayla uyumlu.');
else {
  console.log(`\nYOKLAMAYLA ÇELİŞEN DURUM — ${bulgular.length} kayıt:`);
  for (const b of bulgular) console.log(`  ${b.id}  ${adi(b.ref).padEnd(22)} yoklama=${b.y.padEnd(8)} ${b.eski} → ${b.yeni}`);
}
if (eksikler.length) console.log(`\nDEFTERİ AÇILMAMIŞ ${eksikler.length} ders (hoca ekranındaki toplu doldurma düğmesi açar):\n  ${eksikler.join('\n  ')}`);

if (DUZELT && bulgular.length) {
  for (const b of bulgular)
    await updateDoc(doc(db, 'dersDefteri', b.ref, 'kayitlar', b.id), {
      durum: b.yeni, surum: b.surum + 1, guncelleme: serverTimestamp(),
    });
  console.log(`\n${bulgular.length} kaydın durumu düzeltildi. Hocanın yazdığı metinlere dokunulmadı.`);
  process.exit(0);
}
process.exit(bulgular.length || mazeretBulgulari.length ? 1 : 0);
