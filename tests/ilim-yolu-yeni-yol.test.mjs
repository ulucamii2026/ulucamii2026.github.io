/**
 * İlim Yolu «Yeni Müslüman yolu» (11 Kasım 2026). Bağlayıcı: (1) ilerleme modeli (src/lib/ilim-yolu/yeni-yol-ilerleme.ts): hafta başına dört bit işareti,
 * 12 anahtar, geri alınmaz, VEYA birleşir, buluta yalnız `v, maddeler, guncelleme` gider, belge `ozel/yol12`; (2) veri eşlemesi: 12 hafta × 8 adım × 5 dil
 * paylaşılan icerik.json'dan, hepsi `onayli`, platform bağlantılarının hedefleri var, video yalnız tr/en; (3) yasak terimler ve telefon yok;
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
const esitle = await yukle('yeni-yol-esitle-test', ['hesap/yeni-yol-esitle', 'hesap/isaret']);
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

test('video: yalnız tr/en dilinde, 11 karakterli kimlik; diğer dillerde yok', () => {
  for (const h of v.HAFTALAR) {
    for (const d of ['fr', 'nl', 'de']) assert.equal(v.videoKimligi(h, d), undefined, `${h.id}.${d}`);
    for (const d of ['tr', 'en']) { const id = v.videoKimligi(h, d); if (id !== undefined) assert.match(id, /^[\w-]{11}$/); }
  }
  assert.ok(v.HAFTALAR.some((h) => v.videoKimligi(h, 'tr')));
  assert.ok(v.HAFTALAR.some((h) => v.videoKimligi(h, 'en')));
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

test('derlenmiş çıktı (varsa): 5 dil × (dizin + 12 hafta + 8 adım) var, canonical + 6 hreflang (5 dil + x-default), telefon ve yasak terim yok, videoda yalnız tr/en, YouTube iframe\'i yok', { skip: !existsSync('egitim/dist/tr/yollar/yeni-musluman/index.html') }, () => {
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
    assert.equal(/data-yy-video=/.test(h01), d === 'tr' || d === 'en', `${d} video düğmesi`);
  }
});
