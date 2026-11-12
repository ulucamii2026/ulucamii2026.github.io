/**
 * İlim Yolu «Yeni Müslüman yolu» (11 Kasım 2026). Bağlayıcı: (1) ilerleme modeli (src/lib/ilim-yolu/yeni-yol-ilerleme.ts): hafta başına dört bit işareti,
 * 12 anahtar, geri alınmaz, VEYA birleşir, buluta yalnız `v, maddeler, guncelleme` gider, belge `ozel/yol12`; (2) veri eşlemesi: 12 hafta × 8 adım × 5 dil
 * paylaşılan icerik.json'dan, hepsi `onayli`, platform bağlantılarının hedefleri var, video tr/en'de kendi dilinde, fr/nl/de'de İngilizce yedek ve notlu; (3) yasak terimler ve telefon yok;
 * (4) CSP yalnız youtube-nocookie.com çerçevesini ekler; (5) kurallarda `calisma` adları değişmedi, yol12 `ozel/` altında; (6) derlenmiş çıktı (varsa).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { BellekDepo, SUNUCU_ZAMANI, kullanici, sahteFirebase, yukle } from './egitim/hesap-sahte.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
async function paketle(giris, ad) {
  const cikti = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ entryPoints: [giris], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
}
const m = await paketle('src/lib/ilim-yolu/yeni-yol-ilerleme.ts', 'yeni-yol-ilerleme-test');
const v = await paketle('egitim/src/lib/yeni-yol.ts', 'yeni-yol-veri-test');
const yollar = await paketle('src/lib/ilim-yolu/yollar.ts', 'yeni-yol-yollar-test');
const esitle = await yukle('yeni-yol-esitle-test', ['hesap/yeni-yol-esitle', 'hesap/isaret', 'hesap/oturum']);
const DIL = ['tr', 'fr', 'en', 'nl', 'de'];
const YASAK = /m[uü][sş]avir|sosyal i[sş]ler|b[uü]y[uü]kel[cç]i|el[cç]ilik|konsolos|ambassade|affaires sociales|conseill|sociale zaken|raadgever|botschaft|embassy|consulat|consulaat|konsulat|social affairs|counsel/i;
const TELEFON = /\+?\d[\d ./-]{7,}\d/;

test('ilerleme: belge yol12 (ozel/); 12 hafta; dört slot; en çok 12 anahtar × 4 karakter', () => {
  assert.equal(m.BELGE, 'yol12');
  assert.deepEqual([...m.HAFTALAR], Array.from({ length: 12 }, (_, i) => 'h' + String(i + 1).padStart(2, '0')));
  assert.deepEqual([...m.SLOTLAR], ['s1', 's2', 'yap', 'tamam']);
  let il = m.bos();
  for (const h of m.HAFTALAR) for (const s of m.SLOTLAR) il = m.isaretle(il, h, s, m.TAMAM | m.HATASIZ);
  const yuk = m.bulutYuku(il, 'zaman');
  assert.deepEqual(Object.keys(yuk).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.equal(Object.keys(yuk.maddeler).length, 12);
  for (const d of Object.values(yuk.maddeler)) assert.equal(d, '3333');
  assert.equal(m.tamamlananHafta(il), 12);
});

test('ilerleme: geri alınmaz; geçersiz hafta/slot durumu değiştirmez; hafta durumu doğru okunur', () => {
  let il = m.isaretle(m.bos(), 'h03', 's2', m.TAMAM);
  assert.equal(m.durum(il, 'h03', 's2'), 1);
  il = m.isaretle(il, 'h03', 's2', m.HATASIZ);
  assert.equal(m.durum(il, 'h03', 's2'), 3);
  assert.equal(m.isaretle(il, 'h03', 's2', 0).maddeler.h03, il.maddeler.h03, 'sıfır bit geri almaz');
  assert.equal(il.maddeler.h03, '03');
  assert.equal(m.isaretle(il, 'h13', 's1', 3), il);
  assert.equal(m.isaretle(il, 'h03', 'x', 3), il);
  assert.deepEqual(m.haftaDurumu(il, 'h03'), { tamam: false, dogru: 1, yapildi: false });
  il = m.isaretle(m.isaretle(il, 'h03', 'yap', 1), 'h03', 'tamam', 1);
  assert.deepEqual(m.haftaDurumu(il, 'h03'), { tamam: true, dogru: 1, yapildi: true });
});

test('ilerleme: birleştirme VEYA, değişmeli ve idempotent; bozuk girdi temizlenir', () => {
  const a = m.isaretle(m.isaretle(m.bos(), 'h01', 's1', 1), 'h02', 'tamam', 3);
  const b = m.isaretle(m.isaretle(m.bos(), 'h01', 's2', 1), 'h02', 'tamam', 1);
  const ab = m.birlestir(a, b);
  assert.deepEqual(ab, m.birlestir(b, a));
  assert.deepEqual(m.birlestir(ab, ab), ab);
  assert.equal(m.durum(ab, 'h01', 's1'), 1);
  assert.equal(m.durum(ab, 'h01', 's2'), 1);
  assert.equal(m.durum(ab, 'h02', 'tamam'), 3);
  const kirli = m.temizle({ maddeler: { h01: '12x9', h02: 5, h99: '111', h03: '0000', h04: '3'.repeat(40), yeniMusluman: '1' } });
  assert.equal(kirli.maddeler.h01, '12');
  assert.deepEqual(Object.keys(kirli.maddeler).sort(), ['h01', 'h04']);
  assert.equal(kirli.maddeler.h04.length, m.AZAMI_UZUNLUK);
  for (const kotu of [null, 5, 'x', [], { maddeler: [] }, { maddeler: 'x' }]) assert.deepEqual(m.temizle(kotu), m.bos());
});

test('depo: okuma/yazma; bozuk JSON ve kapalı depo sessizce boş; cihaz anahtarı ham uid taşımaz', () => {
  const depo = new BellekDepo();
  const il = m.isaretle(m.bos(), 'h05', 's1', 1);
  assert.equal(m.yaz(depo, il), true);
  assert.deepEqual(m.oku(depo), il);
  depo.setItem(m.ANAHTAR, '{bozuk');
  assert.deepEqual(m.oku(depo), m.bos());
  assert.deepEqual(m.oku(null), m.bos());
  assert.equal(m.yaz(null, il), false);
  assert.throws(() => m.kullaniciAnahtari('u-deneme-1'), TypeError);
  assert.equal(m.kullaniciAnahtari('abcdef0123456789'), `${m.ANAHTAR}:u:abcdef0123456789`);
});

test('eşitleme: ozel/yol12 ile birleşir; değişiklik yoksa yazmaz; calisma/ altına HİÇ yazmaz; oturum yoksa dokunmaz', async () => {
  const depo = new BellekDepo();
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const anahtar = m.kullaniciAnahtari(ozet);
  m.yaz(depo, m.isaretle(m.bos(), 'h01', 's1', 1), anahtar);
  const yol = 'kullanicilar/u-deneme-1/ozel/yol12';
  const { f, k, bulut } = sahteFirebase({ user: kullanici('u-deneme-1'), belgeler: { [yol]: { v: 1, maddeler: { h02: '03' }, guncelleme: 'eski' } } });
  const sonuc = await esitle.yolEsitle(f, { depo, cevrimici: () => true });
  assert.equal(sonuc.durum, 'tamam');
  assert.equal(sonuc.yazildi, true);
  const yerel = m.oku(depo, anahtar);
  assert.equal(m.durum(yerel, 'h01', 's1'), 1);
  assert.equal(m.durum(yerel, 'h02', 's2'), 3);
  const belge = bulut.get(yol);
  assert.deepEqual(Object.keys(belge).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.equal(belge.guncelleme, SUNUCU_ZAMANI);
  assert.equal(belge.maddeler.h01, '1');
  assert.equal(belge.maddeler.h02, '03');
  assert.equal(k.yazimlar.length, 1);
  assert.ok([...bulut.keys()].every((y) => !y.includes('/calisma/')), 'calisma/ altına yazılmadı');
  assert.equal((await esitle.yolEsitle(f, { depo, cevrimici: () => true })).yazildi, false);
  assert.equal(k.yazimlar.length, 1, 'ikinci eşitleme buluta yazmadı');
  assert.equal((await esitle.yolEsitle(sahteFirebase({ user: null }).f, { depo, cevrimici: () => true })).durum, 'oturum-yok');
  assert.equal((await esitle.yolEsitle(f, { depo, cevrimici: () => false })).durum, 'cevrimdisi');
  // Anonim kopya hesaba kendiliğinden katılmaz.
  const depo2 = new BellekDepo();
  m.yaz(depo2, m.isaretle(m.bos(), 'h07', 's1', 1));
  const s2 = sahteFirebase({ user: kullanici('u-deneme-2') });
  await esitle.yolEsitle(s2.f, { depo: depo2, cevrimici: () => true });
  assert.equal(s2.bulut.size, 0, 'hesapsız kopya buluta gitmedi');
});

const ON = () => true;
const OFF = () => false;
const YOL = (uid) => `kullanicilar/${uid}/ozel/yol12`;
/** Girişli bir cihaz: oturum işareti + (isteğe bağlı) anonim ve hesap kopyası + bulut belgesi. */
async function kur({ anonim, hesap, bulutMaddeler, uid = 'u-deneme-1' } = {}) {
  const ozet = await esitle.uidOzeti(uid);
  const depo = new BellekDepo();
  esitle.isaretKoy(depo, ozet);
  if (anonim) m.yaz(depo, anonim);
  if (hesap) m.yaz(depo, hesap, m.kullaniciAnahtari(ozet));
  const belgeler = bulutMaddeler ? { [YOL(uid)]: { v: 1, maddeler: bulutMaddeler, guncelleme: 'eski' } } : {};
  const sahte = sahteFirebase({ user: kullanici(uid), belgeler });
  return { depo, ozet, anahtar: m.kullaniciAnahtari(ozet), dk: m.durumAnahtari(ozet), ...sahte, uid };
}
const isr = (...l) => l.reduce((il, [h, s, b = 1]) => m.isaretle(il, h, s, b), m.bos());

test('teklif: eklenecek sayısı yalnız hesapta olmayan bitleri sayar; sıfırsa teklif yok', () => {
  const a = isr(['h01', 's1'], ['h01', 'yap'], ['h02', 'tamam', 3]);
  assert.equal(m.eklenecekSayisi(a, m.bos()), 3);
  assert.equal(m.eklenecekSayisi(a, a), 0);
  assert.equal(m.eklenecekSayisi(a, m.birlestir(a, isr(['h05', 's1']))), 0, 'hesapta fazlası olması sayıyı artırmaz');
  assert.equal(m.eklenecekSayisi(isr(['h02', 'tamam', 1]), isr(['h02', 'tamam', 3])), 0);
  assert.equal(m.eklenecekSayisi(isr(['h02', 'tamam', 3]), isr(['h02', 'tamam', 1])), 1, 'yalnız hatasız biti eksik');
  assert.equal(m.eklenecekSayisi(m.bos(), a), 0);
});

test('teklif: sorulmadan HİÇBİR şey yazılmaz; evet = birleşim, anonim silinir, hesaptaki işaret silinmez; ikinci kez sorulmaz', async () => {
  const c = await kur({ anonim: isr(['h01', 's1'], ['h03', 'yap']), hesap: isr(['h02', 'tamam']), bulutMaddeler: { h02: '0001', h09: '1' } });
  const t = await esitle.yolTeklif(c.f, { depo: c.depo, cevrimici: ON });
  assert.equal(t.tur, 'sor');
  assert.equal(t.n, 2);
  assert.equal(c.k.yazimlar.length, 0, 'soru sırasında buluta yazılmadı');
  assert.equal(c.bulut.get(YOL(c.uid)).maddeler.h01, undefined);
  assert.equal(m.durum(m.oku(c.depo), 'h01', 's1'), 1, 'anonim kopya yerinde');
  const s = await t.cevapla(true);
  assert.equal(s.durum, 'tamam');
  const bulut = c.bulut.get(YOL(c.uid)).maddeler;
  assert.deepEqual({ h01: bulut.h01, h02: bulut.h02, h03: bulut.h03, h09: bulut.h09 }, { h01: '1', h02: '0001', h03: '001', h09: '1' }, 'birleşim; h02 ve h09 silinmedi');
  assert.equal(c.depo.getItem(m.ANAHTAR), null, 'anonim kopya hesaba katıldıktan sonra silindi');
  assert.equal(m.durum(m.oku(c.depo, c.anahtar), 'h03', 'yap'), 1);
  assert.equal((await esitle.yolTeklif(c.f, { depo: c.depo, cevrimici: ON })).tur, 'yok', 'idempotent: bir daha sorulmaz');
});

test('teklif: «şimdi değil» hatırlanır (aynı sayıda yeniden sorulmaz), anonim kopya kalır, yeni işaret gelirse yeniden sorulur; durum anahtarı işaret taşımaz', async () => {
  const c = await kur({ anonim: isr(['h01', 's1'], ['h01', 's2']) });
  const t = await esitle.yolTeklif(c.f, { depo: c.depo, cevrimici: ON });
  assert.equal(t.n, 2);
  assert.equal(await t.cevapla(false), null);
  assert.equal(c.k.yazimlar.length, 0);
  assert.equal(c.bulut.size, 0, 'hiçbir şey yüklenmedi');
  assert.equal(m.durum(m.oku(c.depo), 'h01', 's2'), 1, 'anonim kopya kaldı');
  assert.deepEqual(JSON.parse(c.depo.getItem(c.dk)), { s: 2 });
  assert.equal((await esitle.yolTeklif(c.f, { depo: c.depo, cevrimici: ON })).tur, 'yok', 'nag yok');
  // Başka bir hesap aynı cihazda: karar hesap başınadır.
  esitle.isaretKoy(c.depo, await esitle.uidOzeti('u-deneme-2'));
  assert.equal((await esitle.yolTeklif(sahteFirebase({ user: kullanici('u-deneme-2') }).f, { depo: c.depo, cevrimici: ON })).tur, 'sor');
  esitle.isaretKoy(c.depo, c.ozet);
  m.yaz(c.depo, isr(['h01', 's1'], ['h01', 's2'], ['h04', 'yap']));
  assert.equal((await esitle.yolTeklif(c.f, { depo: c.depo, cevrimici: ON })).n, 3, 'daha fazla işaret → yeniden sorulur');
});

test('teklif: çevrim dışı «evet» cihazda birleşir, anonim silinir, buluta yazılmaz; sonraki eşitleme gönderir; oturum yoksa ya da anonim boşsa teklif yok', async () => {
  const c = await kur({ anonim: isr(['h06', 'tamam']) });
  const t = await esitle.yolTeklif(c.f, { depo: c.depo, cevrimici: OFF });
  assert.equal(t.tur, 'sor');
  assert.equal((await t.cevapla(true)).durum, 'cevrimdisi');
  assert.equal(c.k.yazimlar.length, 0);
  assert.equal(c.depo.getItem(m.ANAHTAR), null);
  assert.equal(m.durum(m.oku(c.depo, c.anahtar), 'h06', 'tamam'), 1, 'cihazdaki hesap kopyasında');
  assert.equal((await esitle.yolEsitle(c.f, { depo: c.depo, cevrimici: ON })).yazildi, true);
  assert.equal(c.bulut.get(YOL(c.uid)).maddeler.h06, '0001');
  assert.equal((await esitle.yolTeklif(sahteFirebase({ user: null }).f, { depo: c.depo })).tur, 'yok');
  assert.equal((await esitle.yolTeklif((await kur()).f, { depo: new BellekDepo() })).tur, 'yok');
});

test('silme: çevrimiçi girişli → anonim + hesap kopyası + bulut belgesi silinir; bekleyen bayrak kalmaz', async () => {
  const c = await kur({ anonim: isr(['h01', 's1']), hesap: isr(['h02', 'tamam']), bulutMaddeler: { h02: '0001' } });
  m.durumYaz(c.depo, c.dk, { s: 1 });
  const r = await esitle.yolSil(c.f, { depo: c.depo, cevrimici: ON });
  assert.deepEqual(r, { bulut: 'silindi' });
  assert.equal(c.depo.getItem(m.ANAHTAR), null);
  assert.equal(c.depo.getItem(c.anahtar), null);
  assert.equal(c.depo.getItem(c.dk), null, 'ne bekleyen silme ne «şimdi değil» kaldı');
  assert.equal(c.bulut.has(YOL(c.uid)), false);
  assert.deepEqual(c.k.yazimlar.map((y) => y.tur), ['delete']);
  assert.equal(m.tamamlananHafta(m.oku(c.depo, c.anahtar)), 0);
});

test('silme: çevrim dışı → cihaz hemen temiz, bulut BEKLER; sonraki eşitleme önce bulutu siler, silinen işaret geri gelmez; yeni işaretler korunur', async () => {
  const c = await kur({ hesap: isr(['h02', 'tamam']), bulutMaddeler: { h02: '0001', h07: '0003' } });
  assert.deepEqual(await esitle.yolSil(c.f, { depo: c.depo, cevrimici: OFF }), { bulut: 'bekliyor' });
  assert.equal(c.depo.getItem(c.anahtar), null);
  assert.deepEqual(JSON.parse(c.depo.getItem(c.dk)), { sil: true });
  assert.equal(c.bulut.has(YOL(c.uid)), true, 'bulut henüz silinmedi');
  assert.equal((await esitle.yolEsitle(c.f, { depo: c.depo, cevrimici: OFF })).durum, 'cevrimdisi');
  assert.notEqual(c.depo.getItem(c.dk), null);
  // Bu arada yeni bir işaret yapılır; sonra bağlantı gelir.
  m.yaz(c.depo, isr(['h01', 's1']), c.anahtar);
  const s = await esitle.yolEsitle(c.f, { depo: c.depo, cevrimici: ON });
  assert.equal(s.durum, 'tamam');
  assert.deepEqual(c.bulut.get(YOL(c.uid)).maddeler, { h01: '1' }, 'eski bulut işaretleri geri gelmedi, yeni işaret gitti');
  assert.deepEqual(m.oku(c.depo, c.anahtar).maddeler, { h01: '1' }, 'cihaza da eski işaret dönmedi');
  assert.equal(c.depo.getItem(c.dk), null, 'bayrak kalktı');
  assert.equal(c.k.yazimlar.filter((y) => y.tur === 'delete').length, 1);
});

test('silme: bulut silinemezse bekler ve eşitleme birleştirmez; hesapsız cihazda yalnız cihaz silinir ve iz kalmaz', async () => {
  const c = await kur({ hesap: isr(['h02', 'tamam']), bulutMaddeler: { h02: '0001' } });
  const eski = c.f.fs.deleteDoc;
  c.f.fs.deleteDoc = async () => { throw Object.assign(new Error('x'), { code: 'unavailable' }); };
  assert.deepEqual(await esitle.yolSil(c.f, { depo: c.depo, cevrimici: ON }), { bulut: 'bekliyor' });
  assert.equal((await esitle.yolEsitle(c.f, { depo: c.depo, cevrimici: ON })).durum, 'cevrimdisi');
  assert.equal(c.bulut.get(YOL(c.uid)).maddeler.h02, '0001');
  assert.equal(c.depo.getItem(c.anahtar), null, 'cihaza birleştirilmedi');
  c.f.fs.deleteDoc = eski;
  assert.equal((await esitle.yolEsitle(c.f, { depo: c.depo, cevrimici: ON })).durum, 'tamam');
  assert.equal(c.bulut.has(YOL(c.uid)), false);
  const depo = new BellekDepo();
  m.yaz(depo, isr(['h01', 's1']));
  assert.deepEqual(await esitle.yolSil(null, { depo }), { bulut: 'yok' });
  assert.deepEqual(depo.anahtarlar(), [], 'hesapsız silmede hiçbir iz kalmaz');
});

test('çıkış: işaretler önce hesaba gider, sonra cihazdan KALKAR (hesaptan gelen hiçbir işaret yerelde kalmaz); eşitlenemezse sormadan silmez', async () => {
  const c = await kur({ hesap: isr(['h02', 'tamam'], ['h03', 's1']), bulutMaddeler: { h09: '1' } });
  m.durumYaz(c.depo, c.dk, { s: 2 });
  const hesapKopya = c.depo.getItem(c.anahtar);
  assert.deepEqual(await esitle.cikisYap(c.f, { depo: c.depo, cevrimici: OFF }), { ok: false, neden: 'esitlenmedi' });
  assert.equal(c.depo.getItem(c.anahtar), hesapKopya, 'çevrim dışıyken silinmedi (gönderilmemiş işaret kaybolmasın)');
  assert.deepEqual(await esitle.cikisYap(c.f, { depo: c.depo, cevrimici: ON }), { ok: true });
  assert.deepEqual(c.bulut.get(YOL(c.uid)).maddeler, { h02: '0001', h03: '1', h09: '1' }, 'önce hesaba gitti');
  assert.deepEqual(c.depo.anahtarlar(), [c.dk], 'cihazda yalnız sayı/bayrak durumu kaldı');
  assert.doesNotMatch(c.depo.getItem(c.dk), /maddeler|h\d\d/, 'durum işaret taşımaz');
  assert.equal(m.oku(c.depo).maddeler.h02, undefined, 'çıkış sonrası anonim okuma hesabın işaretini görmez');
  assert.equal(m.oku(c.depo, c.anahtar).maddeler.h02, undefined);
  const c2 = await kur({ hesap: isr(['h02', 'tamam']) });
  assert.deepEqual(await esitle.cikisYap(c2.f, { depo: c2.depo, zorla: true }), { ok: true });
  assert.deepEqual(c2.depo.anahtarlar(), []);
  const c3 = await kur({ anonim: isr(['h01', 's1']), hesap: isr(['h02', 'tamam']) });
  await esitle.cikisYap(c3.f, { depo: c3.depo, cevrimici: ON });
  assert.equal(m.durum(m.oku(c3.depo), 'h01', 's1'), 1, 'hesapsız yapılan işaretler çıkıştan etkilenmez');
});

test('anahtar: nötr ad (yolu söylemez); eski ad bir kez okunup taşınır ve silinir; çıkış ve silme eski adı da temizler', async () => {
  assert.equal(m.ANAHTAR, 'ilim:y12:v1');
  for (const a of [m.ANAHTAR, m.kullaniciAnahtari('a'.repeat(32)), m.durumAnahtari('a'.repeat(32))]) assert.doesNotMatch(a, /yeni|musluman|yol|ulucamii/i, a);
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const ak = m.kullaniciAnahtari(ozet);
  const depo = new BellekDepo({ [m.ESKI_ANAHTAR]: JSON.stringify({ v: 1, maddeler: { h01: '1' } }), [m.eskiAnahtar(ak)]: JSON.stringify({ v: 1, maddeler: { h02: '0001' } }) });
  assert.equal(m.eskiAnahtar(ak), `ulucamii:yeniyol:cihaz:v1:u:${ozet}`);
  assert.equal(m.oku(depo).maddeler.h01, '1');
  assert.equal(depo.getItem(m.ESKI_ANAHTAR), null, 'eski ad silindi');
  assert.deepEqual(JSON.parse(depo.getItem(m.ANAHTAR)).maddeler, { h01: '1' });
  assert.equal(m.oku(depo, ak).maddeler.h02, '0001');
  assert.equal(depo.getItem(m.eskiAnahtar(ak)), null);
  assert.deepEqual(depo.anahtarlar().sort(), [m.ANAHTAR, ak].sort());
  // Çıkış ve silme eski adı da süpürür.
  esitle.isaretKoy(depo, ozet);
  depo.setItem(m.eskiAnahtar(ak), '{}');
  await esitle.yolSil(null, { depo });
  assert.deepEqual(depo.anahtarlar().filter((a) => /ulucamii:yeniyol|ilim:y12:v1/.test(a)), []);
});

test('veri: 12 hafta, 8 adım, 5 dil; hepsi onayli; sayfa kimlikleri 20; aynı kaynak dosya', () => {
  assert.equal(v.HAFTALAR.length, 12);
  assert.equal(v.ADIMLAR.length, 8);
  assert.deepEqual([...v.SAYFA_KIMLIKLERI], [...v.HAFTALAR.map((h) => h.id), ...Array.from({ length: 8 }, (_, i) => `adim-${i + 1}`)]);
  const ham = JSON.parse(readFileSync('paylasilan/ogrenme-yolu/icerik.json', 'utf8'));
  assert.deepEqual(JSON.parse(JSON.stringify(v.YOL)), ham, 'egitim bu dosyadan okur; kopya yok');
  for (const h of v.HAFTALAR) {
    assert.deepEqual([...m.HAFTALAR].includes(h.id), true);
    for (const d of DIL) {
      assert.equal(h.durum[d], 'onayli', `${h.id}.${d}`);
      assert.ok(h.baslik[d] && h.metin[d] && h.hedef[d] && h.yap[d], `${h.id}.${d} boş alan`);
    }
    assert.equal(h.sorular.length, 2);
  }
  // Her adımda en az bir hafta; adım başlığı beş dilde.
  for (const a of v.ADIMLAR) { assert.ok(v.adimHaftalari(a.no).length >= 1, `adım ${a.no}`); for (const d of DIL) assert.ok(a.baslik[d]); }
  assert.equal(v.adimBul('adim-3').no, 3);
  assert.equal(v.haftaBul('h12').id, 'h12');
  assert.equal(v.haftaBul('h13'), undefined);
});

test('video: tr ve en kendi dilinde; fr, nl, de İngilizce kimliği alır (imamın kararı, 12 Kasım 2026); 11 karakterli kimlik; videosu olmayan hafta hiçbir dilde video göstermez', () => {
  for (const h of v.HAFTALAR) {
    for (const d of DIL) {
      const id = v.videoKimligi(h, d);
      if (h.video === undefined) { assert.equal(id, undefined, `${h.id}.${d}: videosuz hafta`); continue; }
      assert.equal(id, h.video[d === 'tr' ? 'tr' : 'en'], `${h.id}.${d}`);
      assert.match(id, /^[\w-]{11}$/);
    }
    for (const d of ['fr', 'nl', 'de']) assert.equal(v.videoKimligi(h, d), v.videoKimligi(h, 'en'), `${h.id}.${d} İngilizce yedek`);
  }
  assert.equal(v.videoKimligi(v.haftaBul('h12'), 'tr'), undefined);
  for (const d of DIL) assert.equal(v.videoKimligi(v.haftaBul('h12'), d), undefined, `h12.${d}`);
  assert.ok(v.HAFTALAR.some((h) => v.videoKimligi(h, 'tr')));
  assert.ok(v.HAFTALAR.some((h) => v.videoKimligi(h, 'en')));
  // Not yalnız yedek dillerde: tr/en notsuz, fr/nl/de görünür notlu ve İngilizce başlıklı.
  assert.deepEqual(DIL.filter((d) => v.videoIngilizceMi(d)), ['fr', 'nl', 'de']);
  for (const h of v.HAFTALAR) if (h.video) assert.ok(v.videoIngilizceBasligi(h.video.en)?.trim(), `${h.id}: İngilizce video başlığı`);
  assert.equal(v.guvenliBaglanti('http://x.test'), false);
  assert.equal(v.guvenliBaglanti('https://x.test'), true);
});

test('platform bağlantıları: hedef sayfa var, yalnız bilinen haftalar, plan kodları geçerli', () => {
  for (const [hafta, b] of Object.entries(v.PLATFORM_BAGLANTILARI)) {
    assert.ok(v.haftaBul(hafta), hafta);
    const adres = v.platformAdresi(b);
    if (b.tur === 'plan') assert.ok(yollar.TUM_YOLLAR.includes(`plan-${b.kod}`), `${hafta}: plan-${b.kod} yok`);
    if (b.tur === 'ibadet-abdest') assert.ok(existsSync('egitim/src/pages/[dil]/ibadet/abdest.astro'));
    if (b.tur === 'ibadet-namaz') assert.ok(existsSync('egitim/src/pages/[dil]/ibadet/namaz/index.astro'));
    if (b.tur === 'okuma') assert.ok(existsSync('egitim/src/pages/[dil]/okuma/index.astro'));
    assert.match(adres, /^[a-z0-9-]+(\/[a-z0-9-]+)*\/$/);
  }
  // Konusu belirsiz haftalar bağlantısız kalır.
  assert.equal(v.PLATFORM_BAGLANTILARI.h09, undefined);
  assert.equal(v.PLATFORM_BAGLANTILARI.h12, undefined);
});

test('yasak terimler ve telefon: içerik, arayüz metni ve sayfa kaynakları temiz', () => {
  const dosyalar = [
    'paylasilan/ogrenme-yolu/icerik.json', 'egitim/src/i18n/yeni-yol.ts', 'egitim/src/lib/yeni-yol.ts', 'egitim/src/scripts/yeni-yol.ts',
    'egitim/src/pages/[dil]/yollar/yeni-musluman/index.astro', 'egitim/src/pages/[dil]/yollar/yeni-musluman/[sayfa].astro', 'egitim/src/styles/yeni-yol.css',
    'src/lib/ilim-yolu/yeni-yol-ilerleme.ts', 'egitim/src/lib/hesap/yeni-yol-esitle.ts',
  ];
  for (const d of dosyalar) {
    const metin = readFileSync(d, 'utf8').replace(/https?:\/\/\S+/g, ' ');
    assert.doesNotMatch(metin, YASAK, `${d}: yasak terim`);
    if (d.endsWith('.json') || d.endsWith('yeni-yol.ts') && d.includes('i18n')) assert.doesNotMatch(metin, TELEFON, `${d}: telefon benzeri`);
  }
});

test('CSP: yalnız frame-src youtube-nocookie.com eklendi; başka yönerge değişmedi', () => {
  const baslik = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting[0].headers[0].headers.find((x) => x.key === 'Content-Security-Policy').value;
  const yonerge = Object.fromEntries(baslik.split(';').map((s) => s.trim()).filter(Boolean).map((s) => { const [ad, ...d] = s.split(/\s+/); return [ad, d]; }));
  assert.deepEqual(yonerge['frame-src'], ["'self'", 'https://www.youtube-nocookie.com']);
  assert.deepEqual(yonerge['script-src'], ["'self'", 'https://apis.google.com']);
  assert.deepEqual(yonerge['img-src'], ["'self'"]);
  assert.deepEqual(yonerge['default-src'], ["'none'"]);
  assert.doesNotMatch(baslik, /youtube\.com|ytimg|googlevideo/);
});

test('kurallar: calisma adları değişmedi; yol12 yalnız ozel/ altında ve calisma ile bağlantısız', () => {
  const k = readFileSync('firebase/firestore.rules', 'utf8');
  assert.match(k, /function calismaAdi\(\) \{ return ad in \['ezber', 'bilgi', 'yol', 'okuma', 'ibadet'\]; \}/);
  assert.match(k, /belge == 'yol12' && sahip\(uid\) && canli\(uid\) && yol12Gecerli\(\)/);
  assert.doesNotMatch(k.slice(k.indexOf('match /calisma/{ad}'), k.indexOf('match /ozel/{belge}')), /yol12/);
});

test('hoca, haftalık e-posta ve raporlar bu belgeye uzanmaz', () => {
  const kaynaklar = ['functions/src/eposta.ts', 'src/lib/ilim-yolu/eposta.ts', 'src/lib/portal-idare.ts'];
  for (const d of kaynaklar) assert.doesNotMatch(readFileSync(d, 'utf8'), /yol12|yeni-yol|yeniyol/i, d);
  const hocaVeVeli = [];
  const gez = (k) => { for (const a of readdirSync(k)) { const y = join(k, a); statSync(y).isDirectory() ? gez(y) : /hoca|veli/i.test(y) && /\.(ts|astro)$/.test(y) && hocaVeVeli.push(y); } };
  gez('egitim/src');
  for (const d of hocaVeVeli) assert.doesNotMatch(readFileSync(d, 'utf8'), /yol12|yeni-yol|yeniyol/i, d);
});

test('derlenmiş çıktı (varsa): 5 dil × (dizin + 12 hafta + 8 adım) var, canonical + 6 hreflang (5 dil + x-default), telefon ve yasak terim yok, videoda tr/en kendi dilinde, fr/nl/de İngilizce notlu, YouTube iframe\'i yok', { skip: !existsSync('egitim/dist/tr/yollar/yeni-musluman/index.html') }, () => {
  for (const d of DIL) {
    const ana = `egitim/dist/${d}/yollar/yeni-musluman/`;
    for (const s of ['', ...v.SAYFA_KIMLIKLERI.map((k) => `${k}/`)]) {
      const dosya = `${ana}${s}index.html`;
      assert.ok(existsSync(dosya), dosya);
      const html = readFileSync(dosya, 'utf8');
      assert.match(html, new RegExp(`<link rel="canonical" href="https://egitim\\.ulucamii\\.be/${d}/yollar/yeni-musluman/${s}"`));
      assert.equal((html.match(/<link rel="alternate" hreflang=/g) ?? []).length, 6, dosya); // beş dil + x-default
      // Yalnız yolun kendi içeriği (<main>): site altbilgisindeki kurumun genel hattı kapsam dışıdır.
      const govde = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
      const gorunen = govde.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
      assert.doesNotMatch(gorunen, TELEFON, `${dosya}: telefon benzeri`);
      assert.doesNotMatch(govde, /href="tel:/i);
      assert.doesNotMatch(gorunen, YASAK, `${dosya}: yasak terim`);
      assert.doesNotMatch(html, /<iframe/i, 'iframe tıklamadan önce yok');
      assert.doesNotMatch(html, /youtube-nocookie\.com\/embed/i, 'gömme adresi sayfada yok');
    }
    const h01 = readFileSync(`${ana}h01/index.html`, 'utf8');
    assert.match(h01, /data-yy-video="[\w-]{11}"/, `${d} video düğmesi`);
    // fr, nl, de: İngilizce video kimliği + görünür not + lang="en" başlık; tr ve en notsuz.
    const yedek = ['fr', 'nl', 'de'].includes(d);
    assert.equal(h01.includes('data-yy-video-not'), yedek, `${d}: İngilizce notu`);
    assert.equal(/data-yy-video-dil="en"/.test(h01), yedek, `${d}: yedek video işareti`);
    assert.equal(/<span class="yy-video-ad"[^>]*lang="en"/.test(h01) || /<span[^>]*lang="en"[^>]*class="yy-video-ad"/.test(h01), yedek, `${d}: lang="en" video başlığı`);
    if (yedek) assert.ok(h01.includes(`data-yy-video="${v.haftaBul('h01').video.en}"`), `${d}: İngilizce kimlik`);
    const nots = { fr: 'Vidéo en anglais', nl: 'Video in het Engels', de: 'Video auf Englisch' };
    if (yedek) assert.ok(h01.includes(nots[d]), `${d}: not metni`);
    // h12'de video yok (hiçbir dilde).
    assert.doesNotMatch(readFileSync(`${ana}h12/index.html`, 'utf8'), /data-yy-video=/, `${d} h12`);
  }
});
