import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { ekranDuyurulari, EKRANLAR } from '../src/lib/ekran/akis.ts';
import { gorselSurumu, publicDosyasi } from '../src/lib/ekran/gorsel-surumu.ts';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { gorselOrani } from '../src/lib/ekran/gorsel-orani.ts';

const d = (id, data) => ({ id, data: { baslik: 'Başlık ' + id, tarih: new Date('2026-09-20'), taslak: false, ekranHedef: [], ...data } });

test('TR ve FR duyuru slugdan eşlenir; yalnız ekranda işaretli olan girer', () => {
  const s = ekranDuyurulari([
    d('tr/kermes', { ekranda: true, ozet: 'Kermes pazar günü.' }),
    d('fr/kermes', { ekranda: true, baslik: 'Kermesse', ozet: 'Kermesse dimanche.' }),
    d('tr/eski-haber', { ekranda: false }),
  ], '2026-09-27', 30);
  assert.equal(s.length, 1);
  assert.equal(s[0].id, 'kermes');
  assert.deepEqual(s[0].tr, { baslik: 'Başlık tr/kermes', metin: 'Kermes pazar günü.' });
  assert.deepEqual(s[0].fr, { baslik: 'Kermesse', metin: 'Kermesse dimanche.' });
});

test('ekran metni özetten önce gelir, boş bırakılmışsa özet; taslak ve süresi dolan duyuru girmez', () => {
  const s = ekranDuyurulari([
    d('tr/a', { ekranda: true, ozet: 'Uzun özet', ekranMetni: 'Kısa ekran metni' }),
    d('tr/b', { ekranda: true, taslak: true }),
    d('tr/c', { ekranda: true, ekranSon: new Date('2026-09-26') }),
    d('tr/d', { ekranda: true, ozet: 'Özet kalır', ekranMetni: '  ' }),
  ], '2026-09-27', 30);
  assert.deepEqual(s.map((x) => x.id), ['a', 'd']);
  assert.equal(s[0].tr.metin, 'Kısa ekran metni');
  assert.equal(s[1].tr.metin, 'Özet kalır');
});

test('son gün boşsa başlangıçtan itibaren varsayılan gün sayısı kadar (başlangıç dâhil) gösterilir', () => {
  const [x] = ekranDuyurulari([d('tr/a', { ekranda: true, ekranBaslangic: new Date('2026-09-25') })], '2026-09-27', 30);
  assert.equal(x.baslangic, '2026-09-25');
  assert.equal(x.son, '2026-10-24');
  assert.deepEqual(ekranDuyurulari([d('tr/a', { ekranda: true, ekranBaslangic: new Date('2026-08-01') })], '2026-09-27', 30), []);
});

test('hedef ekranlar ve kapak görseli akışa taşınır; FR yoksa yalnız TR', () => {
  const [x] = ekranDuyurulari([d('tr/a', { ekranda: true, ekranHedef: ['kadin'], kapak: '/media/duyurular/a.webp' })], '2026-09-27', 30);
  assert.deepEqual(x.hedef, ['kadin']);
  assert.equal(x.gorsel, '/media/duyurular/a.webp');
  assert.equal(x.fr, undefined);
});

// Ekran kimlikleri iki yerde yazılı: kodda (EKRANLAR, şema ve ?ekran= parametresi) ve CMS formunda (config.yml →
// ekranHedef seçenekleri). Biri değişip öteki unutulursa CMS'in yazdığı hedef şemadan geçmez ya da hiçbir ekrana
// düşmez; bu test iki listeyi eşit tutar.
test("CMS formundaki ekran seçenekleri EKRANLAR ile aynı", () => {
  const config = parse(readFileSync(new URL('../public/admin/icerik/config.yml', import.meta.url), 'utf8'));
  const bulunan = [];
  (function tara(x) {
    if (Array.isArray(x)) { for (const o of x) tara(o); return; }
    if (!x || typeof x !== 'object') return;
    if (x.name === 'ekranHedef' && Array.isArray(x.options)) bulunan.push(x.options.map((o) => (typeof o === 'object' ? o.value : o)));
    for (const k of Object.keys(x)) tara(x[k]);
  })(config);
  assert.ok(bulunan.length > 0, 'config.yml içinde ekranHedef alanı bulunamadı');
  for (const secenekler of bulunan) assert.deepEqual(secenekler, [...EKRANLAR]);
});

// Duyuru görseli aynı adla yeniden yüklenirse (CMS aynı dosya adının üstüne yazar ya da afiş yerinde yenilenir) ekranın
// SW'si onu önbellekten vermeye devam ederdi: akıştaki adres görselin içerik özetiyle (?v=) sürümlenir, yeni bayt yeni
// adres (ve yeni slayt turu) demektir. Dış adresler ve bulunamayan dosyalar olduğu gibi kalır.
test('duyuru görseli adresi içerik özetiyle sürümlenir; dış adres ve bulunamayan dosya olduğu gibi kalır', () => {
  const dosyalar = { '/media/duyurular/kermes.webp': Buffer.from('ilk afiş') };
  const oku = (yol) => dosyalar[yol] ?? null;
  const ilk = gorselSurumu('/media/duyurular/kermes.webp', oku);
  assert.match(ilk, /^\/media\/duyurular\/kermes\.webp\?v=[0-9a-f]{8}$/);
  assert.equal(gorselSurumu('/media/duyurular/kermes.webp', oku), ilk, 'aynı bayt → aynı adres');
  dosyalar['/media/duyurular/kermes.webp'] = Buffer.from('düzeltilmiş afiş');
  assert.notEqual(gorselSurumu('/media/duyurular/kermes.webp', oku), ilk, 'değişen bayt → yeni adres');
  assert.equal(gorselSurumu('/media/duyurular/yok.webp', oku), '/media/duyurular/yok.webp', 'bulunamayan dosya');
  for (const dis of ['https://ornek.org/afis.webp', '//cdn.ornek.org/afis.webp']) assert.equal(gorselSurumu(dis, oku), dis, dis);
  assert.equal(gorselSurumu(undefined, oku), undefined);
  const ozet = createHash('sha256').update('düzeltilmiş afiş').digest('hex').slice(0, 8);
  assert.equal(gorselSurumu('/media/duyurular/kermes.webp', oku), '/media/duyurular/kermes.webp?v=' + ozet, 'özet: dosya baytlarının SHA-256’sının ilk 8 hanesi');
  assert.equal(gorselSurumu('/media/duyurular/kermes.webp?boyut=740', oku), '/media/duyurular/kermes.webp?boyut=740&v=' + ozet, 'var olan sorgu korunur');
});

test('gerçek dosya public/ altından okunur; public dışına çıkan yol okunmaz', () => {
  const logo = readFileSync(new URL('../public/media/logo/ulu-camii-logo.svg', import.meta.url));
  const v = createHash('sha256').update(logo).digest('hex').slice(0, 8);
  assert.equal(gorselSurumu('/media/logo/ulu-camii-logo.svg', publicDosyasi), '/media/logo/ulu-camii-logo.svg?v=' + v);
  assert.equal(publicDosyasi('/../package.json'), null);
});

test('ekran başlığı sitedeki başlıktan önce gelir; boş ya da yalnız boşluksa sitedeki başlık', () => {
  const s = ekranDuyurulari([
    d('tr/a', { ekranda: true, baslik: 'Çok uzun site başlığı', ekranBasligi: 'Kısa başlık', ozet: 'Özet' }),
    d('tr/b', { ekranda: true, ekranBasligi: '  ', ozet: 'Özet' }),
  ], '2026-09-27', 30);
  assert.deepEqual(s.map((x) => x.tr.baslik).sort(), ['Başlık tr/b', 'Kısa başlık']);
});

test('ekrana sığmayan duyuru akışa girmez; kimliği ve aşımı raporlanır; ekran başlığı onu kurtarır', () => {
  const dusen = [];
  const s = ekranDuyurulari([
    d('tr/uzun', { ekranda: true, ozet: 'a'.repeat(181) }),
    d('tr/uzun-baslik', { ekranda: true, baslik: 'b'.repeat(61), ozet: 'kısa' }),
    d('tr/kurtarilmis', { ekranda: true, baslik: 'b'.repeat(61), ekranBasligi: 'Kısa', ozet: 'kısa' }),
  ], '2026-09-27', 30, dusen);
  assert.deepEqual(s.map((x) => x.id), ['kurtarilmis']);
  assert.deepEqual(dusen, ['uzun (ekrana sığmaz: TR metin 181/180)', 'uzun-baslik (ekrana sığmaz: TR başlık 61/60)']);
});

test('görsel oranı derlemede okunur: dikey afiş, EXIF ile döndürülmüş fotoğraf; dış adres, olmayan ya da bozuk dosya undefined', async () => {
  const png = await sharp({ create: { width: 700, height: 1000, channels: 3, background: '#888888' } }).png().toBuffer();
  assert.equal(await gorselOrani('/media/a.png', () => png), 0.7);
  const jpg = await sharp({ create: { width: 1000, height: 700, channels: 3, background: '#888888' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  assert.equal(await gorselOrani('/media/b.jpg', () => jpg), 0.7);
  assert.equal(await gorselOrani('https://ornek.org/a.png', () => png), undefined);
  assert.equal(await gorselOrani('/media/yok.png', () => null), undefined);
  assert.equal(await gorselOrani('/media/bozuk.png', () => new Uint8Array([1, 2, 3])), undefined);
});

/* Gece kapanması (23 Ekim 2026): kabuk yeni kuralı uygular — kapanmaSaati'ne kadar açık; o saatte yatsıdan beri
   yatsiSonrasiEnAzDk geçmediyse gecKapanmaSaati'ne kadar. /ekran/akis.json'a `ayar` olduğu gibi yazıldığı için alanlar
   ekran.yaml → Astro şeması → akış zincirinde kaybolmamalı; eski kabuklar için kapanmaDk/acilmaDk de kalır. */
const SA_DK = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SA_DK_24 = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;
const dakika = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
const ayarYaml = parse(readFileSync(new URL('../src/content/ayarlar/ekran.yaml', import.meta.url), 'utf8')).ekran;

test('ekran.yaml gece: yeni üç alan geçerli ve tutarlı; eski kapanmaDk/acilmaDk eski kabuklar için aynen kalır', () => {
  const g = ayarYaml.gece;
  assert.equal(g.kapanmaDk, 60);
  assert.equal(g.acilmaDk, 30);
  assert.equal(typeof g.kapanmaSaati, 'string', 'YAML tırnaklı olmalı ("23:00"); tırnaksız 23:00 sayıya çözülür');
  assert.equal(typeof g.gecKapanmaSaati, 'string');
  assert.match(g.kapanmaSaati, SA_DK);
  assert.match(g.gecKapanmaSaati, SA_DK_24);
  assert.ok(Number.isInteger(g.yatsiSonrasiEnAzDk) && g.yatsiSonrasiEnAzDk >= 0 && g.yatsiSonrasiEnAzDk <= 240);
  assert.deepEqual([g.kapanmaSaati, g.gecKapanmaSaati, g.yatsiSonrasiEnAzDk], ['23:00', '24:00', 60]);
  assert.ok(dakika(g.gecKapanmaSaati) > dakika(g.kapanmaSaati), 'geç kapanma saati kapanma saatinden sonra');
});

test('gece alanları şemada, CMS’te ve akış tipinde tanımlı; CMS kalıpları SS:DD sınırlarını uygular', () => {
  const sema = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
  const tip = readFileSync(new URL('../src/ekran/veri.ts', import.meta.url), 'utf8');
  const cms = parse(readFileSync(new URL('../public/admin/icerik/config.yml', import.meta.url), 'utf8'));
  const bul = (dugum, ad) => {
    if (Array.isArray(dugum)) { for (const x of dugum) { const b = bul(x, ad); if (b) return b; } return null; }
    if (dugum && typeof dugum === 'object') {
      if (dugum.name === ad && dugum.widget) return dugum;
      for (const v of Object.values(dugum)) { const b = bul(v, ad); if (b) return b; }
    }
    return null;
  };
  for (const ad of ['kapanmaSaati', 'gecKapanmaSaati', 'yatsiSonrasiEnAzDk']) {
    assert.match(sema, new RegExp(`\\b${ad}:`), `${ad} Astro şemasında`);
    assert.match(tip, new RegExp(`\\b${ad}\\?:`), `${ad} veri.ts tipinde isteğe bağlı`);
    const alan = bul(cms, ad);
    assert.ok(alan, `${ad} CMS’te`);
    assert.equal(alan.required, false, `${ad} CMS’te isteğe bağlı`);
  }
  const kalip = (ad) => new RegExp(bul(cms, ad).pattern[0]);
  const k = kalip('kapanmaSaati'), gk = kalip('gecKapanmaSaati');
  for (const iyi of ['', '00:00', '23:00', '23:59']) assert.match(iyi, k, `kapanmaSaati ${JSON.stringify(iyi)}`);
  for (const kotu of ['24:00', '9:00', '23:60', '2300', '23:00:00', ' 23:00']) assert.doesNotMatch(kotu, k, `kapanmaSaati ${JSON.stringify(kotu)}`);
  for (const iyi of ['', '00:00', '23:59', '24:00']) assert.match(iyi, gk, `gecKapanmaSaati ${JSON.stringify(iyi)}`);
  for (const kotu of ['24:01', '25:00', '9:00', '23:60', '24:00:00']) assert.doesNotMatch(kotu, gk, `gecKapanmaSaati ${JSON.stringify(kotu)}`);
  const dk = bul(cms, 'yatsiSonrasiEnAzDk');
  assert.deepEqual([dk.min, dk.max, dk.value_type], [0, 240, 'int']);
  // Eski alan CMS’te kalır ama yalnız eski uygulamalar için olduğunu söyler.
  assert.match(bul(cms, 'kapanmaDk').label, /eski ekran uygulamaları/);
});

test('derlenmiş dist/ekran/akis.json gece ayarlarını yeni üç alanla birlikte taşır', { skip: !existsSync(new URL('../dist/ekran/akis.json', import.meta.url)) && 'dist yok — önce `npm run build`; tarama atlandı' }, () => {
  const akis = JSON.parse(readFileSync(new URL('../dist/ekran/akis.json', import.meta.url), 'utf8'));
  assert.deepEqual(akis.ayar.gece, ayarYaml.gece);
  assert.equal(akis.ayar.gece.kapanmaSaati, '23:00');
  assert.equal(akis.ayar.gece.gecKapanmaSaati, '24:00');
  assert.equal(akis.ayar.gece.yatsiSonrasiEnAzDk, 60);
});
