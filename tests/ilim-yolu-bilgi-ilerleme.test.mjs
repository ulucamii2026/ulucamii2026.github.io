/**
 * İlim Yolu Dilim 2 (10 Kasım 2026) — bilgi kartı ilerlemesi (src/lib/ilim-yolu/bilgi-ilerleme.ts). Bağlayıcı: 261 kart en çok 5 anahtara sığar
 * (kuralın 120 sınırı), bit işaretleri geri alınmaz, birleştirme VEYA'dır (değişme, idempotent), bozuk girdi temizlenir, buluta yalnız
 * `v, maddeler, guncelleme` gider, cihaz anahtarı ham uid taşımaz ve eşitleme (egitim/src/lib/hesap/bilgi-esitle.ts) değişiklik yoksa yazmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { BellekDepo, SUNUCU_ZAMANI, kullanici, sahteFirebase, yukle } from './egitim/hesap-sahte.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ilim-yolu-bilgi-ilerleme-test.mjs');
await build({ entryPoints: ['src/lib/ilim-yolu/bilgi-ilerleme.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const m = await import(pathToFileURL(cikti).href);
const esitle = await yukle('ilim-yolu-bilgi-esitle-test', ['hesap/bilgi-esitle', 'hesap/isaret']);

const kartlar = readdirSync('src/data/ilim-yolu/kartlar').filter((a) => a.endsWith('.json'))
  .flatMap((a) => JSON.parse(readFileSync(`src/data/ilim-yolu/kartlar/${a}`, 'utf8')).kartlar);

test('261 kartın hepsi geçerli konuma sahip ve 5 anahtara sığar; hepsini işaretleyince bulut yükü kuralın sınırları içinde kalır', () => {
  assert.equal(kartlar.length, 261);
  let il = m.bos();
  for (const k of kartlar) {
    const konum = m.konum(k.id);
    assert.ok(konum, `${k.id}: konum`);
    assert.equal(konum.kod, k.kod);
    il = m.isaretle(il, k.id, m.OGRENDIM);
  }
  const yuk = m.bulutYuku(il, SUNUCU_ZAMANI);
  assert.deepEqual(Object.keys(yuk).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.ok(Object.keys(yuk.maddeler).length <= 5);
  for (const d of Object.values(yuk.maddeler)) assert.ok(typeof d === 'string' && d.length <= m.AZAMI_UZUNLUK && /^[0-3]+$/.test(d));
  assert.ok(kartlar.every((k) => m.ogrenildi(il, k.id)));
  assert.equal(m.yolSayimi(il, kartlar.map((k) => k.id)).tamam, true);
  // Kural: maddeler bir harita ve ≤ 120 anahtar (firestore.rules calismaGecerli).
  assert.ok(Object.keys(yuk.maddeler).length <= 120);
});

test('bitler tek yönlüdür: işaretlenen geri alınmaz, ikinci bit eklenir, başka kart etkilenmez', () => {
  let il = m.isaretle(m.bos(), 'it-003', m.OGRENDIM);
  assert.equal(m.kartDurumu(il, 'it-003'), 1);
  il = m.isaretle(il, 'it-003', m.OGRENDIM | m.SINAV);
  assert.equal(m.kartDurumu(il, 'it-003'), 3);
  il = m.isaretle(il, 'it-003', 0);
  assert.equal(m.kartDurumu(il, 'it-003'), 3, 'bit 0 hiçbir şeyi silmez');
  assert.equal(m.kartDurumu(il, 'it-002'), 0);
  assert.equal(m.kartDurumu(il, 'it-004'), 0);
  assert.equal(m.kartDurumu(il, 'ku-003'), 0);
  assert.equal(m.isaretle(il, 'x-001', 1), il, 'geçersiz kimlik durumu değiştirmez');
  assert.equal(m.kartDurumu(il, 'x-001'), 0);
});

test('birleştirme: bit düzeyinde VEYA; iki yönde aynı; idempotent; boy farkı korunur', () => {
  const a = m.isaretle(m.isaretle(m.bos(), 'ah-002', 1), 'ah-010', 3);
  const b = m.isaretle(m.isaretle(m.bos(), 'ah-002', 2), 'si-001', 1);
  const s = m.birlestir(a, b);
  assert.equal(m.kartDurumu(s, 'ah-002'), 3);
  assert.equal(m.kartDurumu(s, 'ah-010'), 3);
  assert.equal(m.kartDurumu(s, 'si-001'), 1);
  assert.deepEqual(m.birlestir(b, a), s, 'sıra fark etmez');
  assert.deepEqual(m.birlestir(a, s), s, 'kendi kendine uygulanınca değişmez');
  assert.equal(m.ayniMi(m.birlestir(s, s), s), true);
});

test('temizle: bozuk girdi boş duruma düşer; yabancı kod, kötü karakter ve uzun dize temizlenir', () => {
  for (const kotu of [null, undefined, 5, 'x', [], { maddeler: 'x' }, { maddeler: [] }]) assert.deepEqual(m.temizle(kotu), m.bos());
  const t = m.temizle({ maddeler: { kuran: '01x9', diger: '111', itikat: 'a'.repeat(1000), ibadet: '000', siyer: 7 }, gunler: ['x'] });
  assert.equal(t.maddeler.kuran, '01'.concat('0', '0').replace(/0+$/, ''), 'geçersiz karakter 0 olur, sondaki sıfırlar atılır');
  assert.equal(t.maddeler.diger, undefined);
  assert.equal(t.maddeler.itikat, undefined, 'tamamı geçersiz karakter: boş');
  assert.equal(t.maddeler.ibadet, undefined, 'yalnız sıfır: boş');
  assert.equal(t.maddeler.siyer, undefined);
  assert.equal(t.gunler, undefined);
});

test('cihaz anahtarı: ham uid yazılmaz, özet biçimi zorunlu; oku/yaz gidiş dönüş, bozuk ve kapalı depo sessiz', () => {
  assert.equal(m.kullaniciAnahtari('ab12cd34ef56ab12'), 'ulucamii:bilgi:cihaz:v1:u:ab12cd34ef56ab12');
  for (const kotu of ['', 'AB', 'kısa', 'a/b', 'x'.repeat(65)]) assert.throws(() => m.kullaniciAnahtari(kotu), TypeError);
  const depo = new BellekDepo();
  const il = m.isaretle(m.bos(), 'ku-001', 1);
  assert.equal(m.yaz(depo, il), true);
  assert.deepEqual(m.oku(depo), il);
  depo.setItem(m.ANAHTAR, '{bozuk');
  assert.deepEqual(m.oku(depo), m.bos());
  assert.deepEqual(m.oku(null), m.bos());
  assert.equal(m.yaz(null, il), false);
  assert.equal(m.yaz({ getItem() { return null; }, setItem() { throw new Error('dolu'); } }, il), false);
});

test('eşitleme: hesap kopyasıyla birleşir, ikisine de yazar; değişiklik yoksa yazmaz; oturum yoksa dokunmaz', async () => {
  const depo = new BellekDepo();
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const anahtar = m.kullaniciAnahtari(ozet);
  m.yaz(depo, m.isaretle(m.bos(), 'ku-005', 1), anahtar);
  const { f, k, bulut } = sahteFirebase({ user: kullanici('u-deneme-1'), belgeler: { 'kullanicilar/u-deneme-1/calisma/bilgi': { v: 1, maddeler: { itikat: '010' }, guncelleme: 'eski' } } });
  const sonuc = await esitle.bilgiEsitle(f, { depo, cevrimici: () => true });
  assert.equal(sonuc.durum, 'tamam');
  assert.equal(sonuc.yazildi, true);
  const yerel = m.oku(depo, anahtar);
  assert.equal(m.kartDurumu(yerel, 'ku-005'), 1);
  assert.equal(m.kartDurumu(yerel, 'it-002'), 1);
  const belge = bulut.get('kullanicilar/u-deneme-1/calisma/bilgi');
  assert.deepEqual(Object.keys(belge).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.equal(belge.guncelleme, SUNUCU_ZAMANI);
  assert.equal(belge.maddeler.kuran, '00001', 'kuran 5. kart');
  assert.equal(belge.maddeler.itikat, '01', 'sondaki sıfırlar tutulmaz');
  // İkinci eşitleme: bir şey değişmedi, bulut yazılmaz.
  const ikinci = await esitle.bilgiEsitle(f, { depo, cevrimici: () => true });
  assert.equal(ikinci.durum, 'tamam');
  assert.equal(ikinci.yazildi, false);
  assert.equal(k.yazimlar.length, 1, 'ikinci eşitleme buluta yazmadı');
  // Oturum yok.
  const yok = await esitle.bilgiEsitle(sahteFirebase({ user: null }).f, { depo, cevrimici: () => true });
  assert.equal(yok.durum, 'oturum-yok');
  // Çevrim dışı: cihaz kopyası olduğu gibi kalır.
  const once = JSON.stringify(m.oku(depo, anahtar));
  const dis = await esitle.bilgiEsitle(f, { depo, cevrimici: () => false });
  assert.equal(dis.durum, 'cevrimdisi');
  assert.equal(JSON.stringify(m.oku(depo, anahtar)), once);
});

test('eklenecekSayisi: yalnız hesapta olmayan bit taşıyan kartlar sayılır (VEYA ile uyumlu)', () => {
  const kur = (ik) => ik.reduce((il, [id, bit]) => m.isaretle(il, id, bit), m.bos());
  const anonim = kur([['ku-001', 1], ['ku-002', 3], ['it-001', 2]]);
  assert.equal(m.eklenecekSayisi(anonim, m.bos()), 3);
  assert.equal(m.eklenecekSayisi(m.bos(), anonim), 0, 'anonim boşsa soru yok');
  assert.equal(m.eklenecekSayisi(anonim, anonim), 0, 'zaten hesapta');
  // ku-001 hesapta var; ku-002'nin yalnız öğrendim biti var (sınav biti yeni); it-001 yok → 2.
  const hesap = kur([['ku-001', 1], ['ku-002', 1]]);
  assert.equal(m.eklenecekSayisi(anonim, hesap), 2);
  // Birleştirince artık eklenecek bir şey kalmaz (idempotent).
  assert.equal(m.eklenecekSayisi(anonim, m.birlestir(hesap, anonim)), 0);
  assert.equal(m.eklenecekSayisi('bozuk', null), 0);
});

test('girişte birleştirme kararı: anonim işaret yoksa sorulmaz; yeni işaret varsa sorulur, «evet» VEYA ile katar ve anonimi siler, «hayır» dokunmaz', async () => {
  const k = kullanici('u-deneme-1');
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const anahtar = m.kullaniciAnahtari(ozet);
  const kur = (...ik) => ik.reduce((il, [id, bit]) => m.isaretle(il, id, bit), m.bos());

  // Anonim boş: soru yok, doğrudan eşitlenir.
  const bosDepo = new BellekDepo();
  const s0 = sahteFirebase({ user: k });
  const k0 = await esitle.bilgiGiristeEsitle(s0.f, { depo: bosDepo, cevrimici: () => true });
  assert.equal(k0.tur, 'tamam');

  // Anonim işaret var, bulutta başka kart var: N = anonimin hesapta olmayan kartları.
  const depo = new BellekDepo();
  m.yaz(depo, kur(['ku-001', 1], ['it-001', 3]));
  const s1 = sahteFirebase({ user: k, belgeler: { 'kullanicilar/u-deneme-1/calisma/bilgi': m.bulutYuku(kur(['ku-001', 1], ['ah-001', 1]), SUNUCU_ZAMANI) } });
  const karar = await esitle.bilgiGiristeEsitle(s1.f, { depo, cevrimici: () => true });
  assert.equal(karar.tur, 'sor');
  assert.equal(karar.n, 1, 'yalnız it-001 yeni');
  assert.equal(s1.k.yazimlar.length, 0, 'cevap gelmeden buluta yazılmaz');

  // «Hayır»: anonim kayıt aynen kalır.
  const once = depo.getItem(m.ANAHTAR);
  await karar.cevapla(false);
  assert.equal(depo.getItem(m.ANAHTAR), once);
  assert.equal(m.kartDurumu(m.oku(depo, anahtar), 'it-001'), 0, 'hesaba geçmedi');

  // «Evet»: VEYA ile katılır (bulutun ah-001'i de korunur), anonim silinir, bulut güncellenir.
  const s2 = sahteFirebase({ user: k, belgeler: { 'kullanicilar/u-deneme-1/calisma/bilgi': m.bulutYuku(kur(['ku-001', 1], ['ah-001', 1]), SUNUCU_ZAMANI) } });
  const karar2 = await esitle.bilgiGiristeEsitle(s2.f, { depo, cevrimici: () => true });
  assert.equal(karar2.tur, 'sor');
  const sonuc = await karar2.cevapla(true);
  assert.equal(sonuc.durum, 'tamam');
  assert.equal(depo.getItem(m.ANAHTAR), null, 'anonim kayıt taşındıktan sonra silinir');
  const il = m.oku(depo, anahtar);
  assert.equal(m.kartDurumu(il, 'it-001'), 3);
  assert.equal(m.kartDurumu(il, 'ah-001'), 1);
  const belge = s2.bulut.get('kullanicilar/u-deneme-1/calisma/bilgi');
  assert.equal(belge.maddeler.itikat, '3');
  assert.equal(belge.maddeler.kuran, '1');
  assert.equal(belge.maddeler.ahlak, '1');

  // Anonim işaretin hepsi hesapta zaten varsa sorulmaz.
  const depo3 = new BellekDepo();
  m.yaz(depo3, kur(['ku-001', 1]));
  const s3 = sahteFirebase({ user: k, belgeler: { 'kullanicilar/u-deneme-1/calisma/bilgi': m.bulutYuku(kur(['ku-001', 3]), SUNUCU_ZAMANI) } });
  assert.equal((await esitle.bilgiGiristeEsitle(s3.f, { depo: depo3, cevrimici: () => true })).tur, 'tamam');
  // Oturum yok.
  assert.equal((await esitle.bilgiGiristeEsitle(sahteFirebase({ user: null }).f, { depo, cevrimici: () => true })).tur, 'tamam');
});
