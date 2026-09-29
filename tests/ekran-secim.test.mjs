import test from 'node:test';
import assert from 'node:assert/strict';
import { slaytSuresi, hedefUygunMu, aktifMi, gunNo, gununOgesi, temaSec, saatGecerliMi, brukselSaat, vakitGorunumu, slaytListesi, ekranIdOku, donmeOku, duzenOku } from '../src/lib/ekran/secim.ts';
import { bugunTarih, durumHesapla } from '../src/lib/namaz.ts';
import { readFileSync } from 'node:fs';

process.env.TZ = 'America/New_York';
const DIYANET = JSON.parse(readFileSync(new URL('../src/data/namaz-vakitleri.json', import.meta.url), 'utf8'));
/** Kayıt veride yoksa (ör. yıl verisi henüz gelmemiş) testin kendi asgari kaydı kullanılır. */
const kayit = (tarih, yedek) => DIYANET.gunler.find((g) => g.tarih === tarih) || { tarih, hicri: '', ...yedek };

const AYAR = { tabanSn: 8, karakterSn: 0.05, enAzSn: 10, enCokSn: 30 };
const gun = (tarih, ek = {}) => ({ tarih, hicri: '16 Rebiulahir 1448', imsak: '05:43', gunes: '07:26', ogle: '13:34', ikindi: '16:47', aksam: '19:35', yatsi: '21:04', ...ek });

test('cihaz saat dilimi New York saat dilimine ayarlandı (bayrağın etkili olduğunun kanıtı)', () => {
  assert.equal(new Date('2026-09-27T12:00:00Z').getTimezoneOffset(), 240);
});

test('slayt süresi metin uzunluğuyla artar ve 10–30 sn arasında kalır', () => {
  assert.equal(slaytSuresi(0, AYAR), 10);
  assert.equal(slaytSuresi(200, AYAR), 18);
  assert.equal(slaytSuresi(5000, AYAR), 30);
});

test('hedefsiz duyuru her ekranda, hedefli duyuru yalnız kendi ekranında', () => {
  assert.equal(hedefUygunMu([], 'giris'), true);
  assert.equal(hedefUygunMu(['kadin'], 'kadin'), true);
  assert.equal(hedefUygunMu(['kadin'], 'ana'), false);
});

test('gösterim aralığının iki ucu dâhil', () => {
  const o = { baslangic: '2026-09-27', son: '2026-09-30' };
  assert.equal(aktifMi(o, '2026-09-27'), true);
  assert.equal(aktifMi(o, '2026-09-30'), true);
  assert.equal(aktifMi(o, '2026-10-01'), false);
  assert.equal(aktifMi(o, '2026-09-26'), false);
});

test('günün öğesi aynı gün sabit, ertesi gün sıradaki; yaz saati geçişi sırayı bozmaz', () => {
  const l = ['a', 'b', 'c'];
  assert.equal(gunNo('2026-10-26') - gunNo('2026-10-25'), 1);
  assert.equal(gunNo('2027-03-29') - gunNo('2027-03-28'), 1);
  const bugun = gununOgesi(l, '2026-10-25');
  const yarin = gununOgesi(l, '2026-10-26');
  assert.equal(gununOgesi(l, '2026-10-25'), bugun);
  assert.equal(l.indexOf(yarin), (l.indexOf(bugun) + 1) % 3);
  assert.equal(gununOgesi([], '2026-10-25'), undefined);
});

test('tema güneşten akşama açık, sonra koyu (kış saatine geçilen gün dâhil)', () => {
  const g = gun('2026-10-25', { gunes: '07:45', aksam: '18:00' });
  assert.equal(temaSec(g, new Date('2026-10-25T07:44:59+01:00')), 'koyu');
  assert.equal(temaSec(g, new Date('2026-10-25T07:45:00+01:00')), 'acik');
  assert.equal(temaSec(g, new Date('2026-10-25T17:59:59+01:00')), 'acik');
  assert.equal(temaSec(g, new Date('2026-10-25T18:00:00+01:00')), 'koyu');
  assert.equal(temaSec(undefined, new Date('2026-10-25T12:00:00+01:00')), 'acik');
  assert.equal(temaSec(undefined, new Date('2026-10-25T10:00:00+01:00')), 'acik');
  assert.equal(temaSec(undefined, new Date('2026-10-25T22:00:00+01:00')), 'koyu');
});

test('pilsiz kutuda saat 1970e dönerse güvenilmez sayılır', () => {
  assert.equal(saatGecerliMi(new Date(0)), false);
  assert.equal(saatGecerliMi(new Date('2026-09-27T12:00:00Z')), true);
});

test('Brüksel saati: gece yarısı 00; yaz saati biterken 02:30 iki kez yaşanır', () => {
  assert.deepEqual(brukselSaat(new Date('2026-09-26T22:00:05Z')), { sa: 0, dk: 0, sn: 5 });
  assert.deepEqual(brukselSaat(new Date('2026-10-25T00:30:00Z')), { sa: 2, dk: 30, sn: 0 });
  assert.deepEqual(brukselSaat(new Date('2026-10-25T01:30:00Z')), { sa: 2, dk: 30, sn: 0 });
});

test('bugünün kaydı yoksa vakit görünümü yok; varsa sıradaki vakit ve Cuma bilgisi', () => {
  assert.equal(vakitGorunumu([gun('2026-09-26')], new Date('2026-09-27T10:00:00+02:00')), null);
  const v = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], new Date('2026-09-27T10:00:00+02:00'));
  assert.equal(v.siradaki.vakit, 'ogle');
  assert.equal(v.cuma, false);
  assert.equal(vakitGorunumu([gun('2026-10-02'), gun('2026-10-03')], new Date('2026-10-02T10:00:00+02:00')).cuma, true);
  const gece = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], new Date('2026-09-27T22:00:00+02:00'));
  assert.deepEqual([gece.siradaki.vakit, gece.siradaki.yarinMi], ['imsak', true]);
});

test('vakitGorunumu: "yarın" gerçek takvim günü değilse (veri boşluğu ya da mükerrer gün) sıradaki vakit boşalır; ardışık günde tam dakikayla kalır', () => {
  const bosluk = vakitGorunumu([gun('2026-10-26'), gun('2027-01-01', { imsak: '06:39' })], new Date('2026-10-26T22:00:00+01:00'));
  assert.equal(bosluk.siradaki, null);
  assert.equal(bosluk.gun.tarih, '2026-10-26');

  const mukerrer = vakitGorunumu([gun('2026-09-27'), gun('2026-09-27')], new Date('2026-09-27T22:00:00+02:00'));
  assert.equal(mukerrer.siradaki, null);

  const simdi = new Date('2026-09-27T22:00:00+02:00');
  const ardisik = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], simdi);
  const beklenenKalan = Math.max(0, Math.ceil((new Date('2026-09-28T05:43:00+02:00').getTime() - simdi.getTime()) / 60000));
  assert.deepEqual([ardisik.siradaki.vakit, ardisik.siradaki.yarinMi, ardisik.siradaki.kalanDk], ['imsak', true, beklenenKalan]);
});

test('Cuma ve "bugün" her zaman Brüksel saatiyle belirlenir (cihaz saat dilimi New York olsa bile)', () => {
  const v1 = vakitGorunumu([gun('2026-10-02')], new Date('2026-10-01T22:30:00Z'));
  assert.equal(v1.gun.tarih, '2026-10-02');
  assert.equal(v1.cuma, true);
  const v2 = vakitGorunumu([gun('2026-10-03')], new Date('2026-10-02T22:30:00Z'));
  assert.equal(v2.cuma, false);
});

/* Geri sayım yaz saati geçişini aşar: kalan dakika duvar saati farkı değil, gerçek süredir. Beklenen değer
   açık UTC ofsetleriyle (CEST +02:00, CET +01:00) hesaplanır, brukselTarih'e dayanmaz. */
test('geri sayım kış saatine geçişi aşar: 24 Ekim 2026 22:00 (CEST) → 25 Ekim imsakı (CET)', () => {
  const bugun = kayit('2026-10-24', { imsak: '06:26', gunes: '08:08', ogle: '13:28', ikindi: '16:05', aksam: '18:38', yatsi: '20:07' });
  const yarin = kayit('2026-10-25', { imsak: '05:28', gunes: '07:10', ogle: '12:28', ikindi: '15:03', aksam: '17:36', yatsi: '19:05' });
  const simdi = new Date('2026-10-24T22:00:00+02:00');
  const v = vakitGorunumu([bugun, yarin], simdi);
  const beklenen = (Date.parse(`2026-10-25T${yarin.imsak}:00+01:00`) - simdi.getTime()) / 60_000;
  assert.deepEqual([v.siradaki.vakit, v.siradaki.yarinMi, v.siradaki.saat], ['imsak', true, yarin.imsak]);
  assert.equal(v.siradaki.kalanDk, beklenen);
  assert.equal(beklenen, 60 + (24 * 60 - 22 * 60) + Number(yarin.imsak.slice(0, 2)) * 60 + Number(yarin.imsak.slice(3))); // duvar saati farkı + 1 sa
});

test('geri sayım yaz saatine geçişi aşar: 27 Mart 2027 22:00 (CET) → 28 Mart imsakı (CEST)', () => {
  const bugun = kayit('2027-03-27', { imsak: '04:35', gunes: '06:20', ogle: '12:49', ikindi: '16:15', aksam: '19:08', yatsi: '20:40' });
  const yarin = kayit('2027-03-28', { imsak: '05:33', gunes: '07:18', ogle: '13:49', ikindi: '17:16', aksam: '20:10', yatsi: '21:41' });
  const simdi = new Date('2027-03-27T22:00:00+01:00');
  const v = vakitGorunumu([bugun, yarin], simdi);
  const beklenen = (Date.parse(`2027-03-28T${yarin.imsak}:00+02:00`) - simdi.getTime()) / 60_000;
  assert.deepEqual([v.siradaki.vakit, v.siradaki.yarinMi, v.siradaki.saat], ['imsak', true, yarin.imsak]);
  assert.equal(v.siradaki.kalanDk, beklenen);
  assert.equal(beklenen, -60 + (24 * 60 - 22 * 60) + Number(yarin.imsak.slice(0, 2)) * 60 + Number(yarin.imsak.slice(3))); // duvar saati farkı − 1 sa
});

test('vakit sınırında: bir saniye önce o vakit 1 dakika kalanla, tam anında bir sonraki vakit gösterilir', () => {
  const ogleAni = new Date('2026-09-27T13:34:00+02:00');
  const once = vakitGorunumu([gun('2026-09-27')], new Date(ogleAni.getTime() - 1000));
  assert.equal(once.siradaki.vakit, 'ogle');
  assert.equal(once.siradaki.kalanDk, 1);
  const aninda = vakitGorunumu([gun('2026-09-27')], ogleAni);
  assert.equal(aninda.siradaki.vakit, 'ikindi');
  assert.equal(aninda.siradaki.kalanDk, 193);
});

/* Sabah namazının son vakti güneştir: imsak ile güneş arasında ekran güneşe kalan süreyi gösterir
   (Rıdvan'ın kararı, 28 Eylül 2026). Site (durumHesapla) güneşi sıradaki vakit saymamaya devam eder. */
test('imsak ile güneş arasında sıradaki vakit güneştir; güneş anında öğleye geçer, imsaktan önce imsak kalır', () => {
  const gunler = [gun('2026-09-27'), gun('2026-09-28')];
  const sabah = vakitGorunumu(gunler, new Date('2026-09-27T07:12:00+02:00'));
  assert.deepEqual(sabah.siradaki, { vakit: 'gunes', saat: '07:26', kalanDk: 14, yarinMi: false });
  const birSaniyeOnce = vakitGorunumu(gunler, new Date(new Date('2026-09-27T07:26:00+02:00').getTime() - 1000));
  assert.deepEqual([birSaniyeOnce.siradaki.vakit, birSaniyeOnce.siradaki.kalanDk], ['gunes', 1]);
  const gunesAni = vakitGorunumu(gunler, new Date('2026-09-27T07:26:00+02:00'));
  assert.deepEqual([gunesAni.siradaki.vakit, gunesAni.siradaki.kalanDk], ['ogle', 368]);
  const imsaktanOnce = vakitGorunumu(gunler, new Date('2026-09-27T05:00:00+02:00'));
  assert.deepEqual([imsaktanOnce.siradaki.vakit, imsaktanOnce.siradaki.kalanDk], ['imsak', 43]);
  assert.equal(durumHesapla(gunler, new Date('2026-09-27T07:12:00+02:00')).siradaki.vakit, 'ogle');
});

test('slayt turu: bu ekrana özel duyuru, ortak duyuru, günün ayeti, günün hadisi', () => {
  const du = (id, hedef, son = '2026-10-30') => ({ id, tur: 'duyuru', tr: { baslik: id, metin: 'metin' }, baslangic: '2026-09-01', son, hedef });
  const s = slaytListesi({
    duyurular: [du('ortak', []), du('kadin', ['kadin']), du('giris', ['giris']), du('bitmis', [], '2026-09-20')],
    ayetler: [{ id: 'a1', referans: { tr: 'r', fr: 'r' }, ar: 'ا', tr: 'meal', kaynakTr: 'DİB' }],
    hadisler: [{ id: 'h1', ar: 'ا', tr: 'hadis', kaynak: 'k' }],
  }, 'kadin', '2026-09-27');
  assert.deepEqual(s.map((x) => x.tur + ':' + x.oge.id), ['duyuru:kadin', 'duyuru:ortak', 'ayet:a1', 'hadis:h1']);
  assert.equal(s[0].karakter, 'kadin'.length + 'metin'.length);
});

test('bugunTarih: Brüksel takvim günü sınırları (yaz/kış saati geçişleri dâhil)', () => {
  assert.equal(bugunTarih(new Date('2026-10-24T22:30:00Z')), '2026-10-25');
  assert.equal(bugunTarih(new Date('2026-10-25T22:30:00Z')), '2026-10-25');
  assert.equal(bugunTarih(new Date('2027-03-27T23:30:00Z')), '2027-03-28');
});

test('bugunTarih: kırpılmış ICU en-CA’yı en-US’e düşürse bile doğru kalır (parçalar type ile seçilir)', () => {
  const Orijinal = Intl.DateTimeFormat;
  class Kirpik extends Orijinal {
    constructor(locale, secenek) {
      super(locale === 'en-CA' ? 'en-US' : locale, secenek);
    }
  }
  // @ts-expect-error test amaçlı global yerine geçirme
  Intl.DateTimeFormat = Kirpik;
  try {
    assert.equal(bugunTarih(new Date('2026-09-27T10:00:00Z')), '2026-09-27');
  } finally {
    Intl.DateTimeFormat = Orijinal;
  }
});

test('ekran ve döndürme parametresi güvenli okunur', () => {
  assert.equal(ekranIdOku('kadin'), 'kadin');
  assert.equal(ekranIdOku('<script>'), 'ana');
  assert.equal(ekranIdOku(null), 'ana');
  assert.equal(donmeOku('90'), 90);
  assert.equal(donmeOku('270'), 270);
  assert.equal(donmeOku('45'), 0);
});

test('düzen parametresi yalnız tam "yatay" ya da "dikey" ise zorlar; gerisi otomatik (null)', () => {
  assert.equal(duzenOku('yatay'), 'yatay');
  assert.equal(duzenOku('dikey'), 'dikey');
  for (const bozuk of [null, '', 'YATAY', ' yatay', 'abc', '<script>']) assert.equal(duzenOku(bozuk), null, `otomatik olmalıydı: ${JSON.stringify(bozuk)}`);
});

test('eski içerik akışıyla (dualar ve esmalar yok) tur yine ayet ve hadisle kurulur', () => {
  const s = slaytListesi({
    duyurular: [],
    ayetler: [{ id: 'a1', referans: { tr: 'r', fr: 'r' }, ar: 'ا', tr: 'meal', kaynakTr: 'DİB' }],
    hadisler: [{ id: 'h1', ar: 'ا', tr: 'hadis', kaynak: 'k' }],
  }, 'ana', '2026-09-27');
  assert.deepEqual(s.map((x) => x.tur + ':' + x.oge.id), ['ayet:a1', 'hadis:h1']);
});

const AYET = { id: 'a1', referans: { tr: 'r', fr: 'r' }, ar: 'ا', tr: 'meal', kaynakTr: 'DİB' };
const HADIS = { id: 'h1', ar: 'ا', tr: 'hadis', kaynak: 'k' };
const DUA = { id: 'd1', ar: 'ا', tr: 'dua', kaynak: 'k', kuran: false };
const ESMA = (sira) => ({ id: 'e' + sira, sira, ar: 'ا', okunus: 'o', tr: 'anlam', kaynak: 'k' });
const DU = (id) => ({ id, tur: 'duyuru', tr: { baslik: 'b', metin: 'm' }, baslangic: '2026-09-01', son: '2026-10-30', hedef: [] });
const ON_SN = { tabanSn: 10, karakterSn: 0, enAzSn: 10, enCokSn: 10 };

test('tur: duyurular, ardından manevi blok ayet → hadis → dua → Esmâ', () => {
  const s = slaytListesi({ duyurular: [DU('du')], ayetler: [AYET], hadisler: [HADIS], dualar: [DUA], esmalar: [ESMA(1)] }, 'ana', '2026-09-27');
  assert.deepEqual(s.map((x) => x.tur + ':' + x.oge.id), ['duyuru:du', 'ayet:a1', 'hadis:h1', 'dua:d1', 'esma:e1']);
});

test('günün Esmâ’sı sıralı listeden günle döner: ertesi gün sıradaki isim', () => {
  const esmalar = [ESMA(1), ESMA(2), ESMA(3)];
  const gunun = (t) => slaytListesi({ duyurular: [], ayetler: [], hadisler: [], esmalar }, 'ana', t)[0].oge.sira;
  assert.equal(gunun('2026-09-28'), (gunun('2026-09-27') % 3) + 1);
});

test('tur hedef süreyi aşarsa manevi blok turlara dilimlenir; her tur sıradakilerden başlar, duyuru her turda kalır', () => {
  const girdi = { duyurular: [DU('du')], ayetler: [AYET], hadisler: [HADIS], dualar: [DUA], esmalar: [ESMA(1)] };
  // Duyuru 10 sn; manevi 4 × 10 sn = 40 sn, hedefin kalanı 30 sn → turda 3 manevi slayt.
  const kimlik = (turNo) => slaytListesi(girdi, 'ana', '2026-09-27', turNo, { turHedefSn: 40, slayt: ON_SN }).map((x) => x.oge.id);
  assert.deepEqual(kimlik(0), ['du', 'a1', 'h1', 'd1']);
  assert.deepEqual(kimlik(1), ['du', 'e1', 'a1', 'h1']);
  assert.deepEqual(kimlik(2), ['du', 'd1', 'e1', 'a1']);
});

test('tur hedefe sığıyorsa, ayar yoksa ya da bozuksa manevi blok bütün gösterilir', () => {
  const girdi = { duyurular: [], ayetler: [AYET], hadisler: [HADIS], dualar: [DUA], esmalar: [ESMA(1)] };
  const adet = (tur) => slaytListesi(girdi, 'ana', '2026-09-27', 5, tur).length;
  assert.equal(adet({ turHedefSn: 150, slayt: ON_SN }), 4);
  assert.equal(adet(undefined), 4);
  assert.equal(adet({ turHedefSn: NaN, slayt: ON_SN }), 4);
  assert.equal(adet({ turHedefSn: 150, slayt: { ...ON_SN, tabanSn: NaN } }), 4);
});

test('duyurular hedefi tek başına dolduruyorsa her tur yine en az bir manevi slayt gösterir', () => {
  const girdi = { duyurular: [DU('x'), DU('y'), DU('z')], ayetler: [AYET], hadisler: [HADIS] };
  const s = slaytListesi(girdi, 'ana', '2026-09-27', 0, { turHedefSn: 20, slayt: ON_SN });
  assert.deepEqual(s.map((x) => x.tur), ['duyuru', 'duyuru', 'duyuru', 'ayet']);
});
