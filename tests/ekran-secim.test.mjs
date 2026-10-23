import test from 'node:test';
import assert from 'node:assert/strict';
import { slaytSuresi, hedefUygunMu, aktifMi, gunNo, temaSec, saatGecerliMi, SAAT_GERI_TOLERANS_MS, sunucuSaatiCoz, isaretGuncelle, turGunu, EN_GEC_GECERLI, brukselSaat, vakitGorunumu, slaytListesi, maneviSirasi, imlecCoz, imlecYazisi, ekranIdOku, donmeOku, duzenOku } from '../src/lib/ekran/secim.ts';
import { bugunTarih, durumHesapla } from '../src/lib/namaz.ts';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

process.env.TZ = 'America/New_York';
const DIYANET = JSON.parse(readFileSync(new URL('../src/data/namaz-vakitleri.json', import.meta.url), 'utf8'));
const FILO_BYTES=readFileSync(new URL('./fixtures/filo-b3.json',import.meta.url));
const FILO=JSON.parse(FILO_BYTES);
const FILO_SDK=process.env.CAMIPANO_FILO_KANIT ? JSON.parse(readFileSync(process.env.CAMIPANO_FILO_KANIT,'utf8')) : null;
if(FILO_SDK) {
  assert.equal(FILO_SDK.schema,1);
  assert.equal(FILO_SDK.fixtureSha256,createHash('sha256').update(FILO_BYTES).digest('hex'));
  assert.deepEqual(FILO_SDK.devices.map(d=>[d.uid,d.ekranId]),FILO.devices.map(d=>[d.uid,d.ekranId]));
  assert.ok(FILO_SDK.devices.every(d=>d.source==='server'));
}
const filoGirdisi=d=>({duyurular:FILO_SDK ? FILO_SDK.devices.find(x=>x.uid===d.uid).announcements :
  FILO.announcements.filter(x=>x.durum==='yayinda'),ayetler:[],hadisler:[],dualar:[],kartlar:[]});
const filoIds=(girdi,ekran,tarih='2026-10-05')=>slaytListesi(girdi,ekran,tarih).map(x=>x.oge.id);

test('three distinct fleet identities show common announcement on all and targeted announcement on exactly one',()=>{
  assert.equal(new Set(FILO.devices.map(d=>d.uid)).size,3);
  const output=FILO.devices.map(d=>filoIds(filoGirdisi(d),d.ekranId));
  for(let i=0;i<output.length;i++)assert.deepEqual(output[i],[`fixture_${FILO.devices[i].ekranId}_only`,'fixture_common']);
  assert.equal(output.filter(ids=>ids.includes('fixture_common')).length,3);
  for(const d of FILO.devices)assert.equal(output.filter(ids=>ids.includes(`fixture_${d.ekranId}_only`)).length,1);
  assert.equal(output.filter(ids=>ids.includes('fixture_draft')).length,0);
});

test('same published snapshot is reprojected on explicit target change without retaining another display slide',()=>{
  const shared=filoGirdisi(FILO.devices[0]);const before=JSON.stringify(shared);
  for(const d of [...FILO.devices].reverse())assert.deepEqual(filoIds(shared,d.ekranId),[`fixture_${d.ekranId}_only`,'fixture_common']);
  assert.deepEqual(filoIds(shared,'ana'),['fixture_ana_only','fixture_common']);
  assert.equal(JSON.stringify(shared),before);
});

test('cached fleet announcements expire at next local calendar date instead of persisting yesterday slides',()=>{
  for(const d of FILO.devices) {
    const input=filoGirdisi(d);
    assert.equal(filoIds(input,d.ekranId,'2026-10-31').length,2);
    assert.deepEqual(filoIds(input,d.ekranId,'2026-11-01'),[]);
    assert.deepEqual(filoIds(input,d.ekranId,'2026-09-30'),[]);
  }
});
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

test('takvim günü sırası ardışık günlerde 1 artar; yaz saati geçişi sırayı bozmaz', () => {
  assert.equal(gunNo('2026-10-26') - gunNo('2026-10-25'), 1);
  assert.equal(gunNo('2027-03-29') - gunNo('2027-03-28'), 1);
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

const SUNUCU_MS = Date.parse('2026-10-09T11:09:00Z');

test('saat geri toleransı 10 dakikadır', () => {
  assert.equal(SAAT_GERI_TOLERANS_MS, 10 * 60_000);
});

test('saat sunucu işaretinden tam 10 dakika geride ise geçerli, 1 ms daha geride ise geçersiz', () => {
  assert.equal(saatGecerliMi(new Date(SUNUCU_MS - SAAT_GERI_TOLERANS_MS), SUNUCU_MS), true);
  assert.equal(saatGecerliMi(new Date(SUNUCU_MS - SAAT_GERI_TOLERANS_MS - 1), SUNUCU_MS), false);
});

test('saat sunucu işaretinin ilerisindeyse ya da aynıysa geçerli', () => {
  assert.equal(saatGecerliMi(new Date(SUNUCU_MS), SUNUCU_MS), true);
  assert.equal(saatGecerliMi(new Date(SUNUCU_MS + 3_600_000), SUNUCU_MS), true);
});

test('sunucu işareti 0 ya da verilmemişse eski davranış korunur', () => {
  const eski = new Date('2026-09-28T22:23:00Z');
  assert.equal(saatGecerliMi(eski), true);
  assert.equal(saatGecerliMi(eski, 0), true);
  assert.equal(saatGecerliMi(new Date(0), 0), false);
});

test('Polaroid olayı: 28 Eylül saati, 9 Ekim sunucu işaretine göre geçersiz', () => {
  assert.equal(saatGecerliMi(new Date('2026-09-28T22:23:00Z'), SUNUCU_MS), false);
});

test('1 Eylül 2026 sınırından eski saat sunucu işaretiyle de geçersiz kalır', () => {
  assert.equal(saatGecerliMi(new Date('2026-08-31T23:59:59Z'), Date.parse('2026-08-31T23:59:59Z')), false);
  assert.equal(saatGecerliMi(new Date(0), SUNUCU_MS), false);
});

test('sunucuSaatiCoz: geçerli HTTP Date başlığını milisaniyeye çevirir', () => {
  assert.equal(sunucuSaatiCoz('Fri, 09 Oct 2026 16:49:41 GMT'), Date.UTC(2026, 9, 9, 16, 49, 41));
});

test('sunucuSaatiCoz: bozuk, boş ve null başlık null verir', () => {
  assert.equal(sunucuSaatiCoz('dün akşam'), null);
  assert.equal(sunucuSaatiCoz(''), null);
  assert.equal(sunucuSaatiCoz('   '), null);
  assert.equal(sunucuSaatiCoz(null), null);
});

test('sunucuSaatiCoz: 1 Eylül 2026 öncesi tarih null verir', () => {
  assert.equal(sunucuSaatiCoz('Thu, 01 Jan 1970 00:00:00 GMT'), null);
  assert.equal(sunucuSaatiCoz('Sat, 26 Jul 2025 13:22:00 GMT'), null);
  assert.equal(sunucuSaatiCoz('Tue, 01 Sep 2026 00:00:00 GMT'), Date.UTC(2026, 8, 1));
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
   (imamın kararı, 28 Eylül 2026). Site (durumHesapla) güneşi sıradaki vakit saymamaya devam eder. */
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

test('eski içerik akışıyla (dualar ve kartlar yok) tur yine ayet ve hadisle kurulur', () => {
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
const KART = (n, cesit = 'soz', tema = 'emek') => ({ cesit, tema, oge: cesit === 'bilgi' ? { id: 'k' + n, baslik: { tr: 'b', fr: 'b' }, tr: 'bilgi', fr: 'info', kaynak: 'k' } : { id: 'k' + n, tr: 'söz', kaynak: 'k' } });
const DU = (id) => ({ id, tur: 'duyuru', tr: { baslik: 'b', metin: 'm' }, baslangic: '2026-09-01', son: '2026-10-30', hedef: [] });
const ON_SN = { tabanSn: 10, karakterSn: 0, enAzSn: 10, enCokSn: 10 };

test('tur: duyurular, ardından manevi dizi ayet → hadis → dua → tema kartı', () => {
  const s = slaytListesi({ duyurular: [DU('du')], ayetler: [AYET], hadisler: [HADIS], dualar: [DUA], kartlar: [KART(1)] }, 'ana', '2026-09-27');
  assert.deepEqual(s.map((x) => x.tur + ':' + x.oge.id), ['duyuru:du', 'ayet:a1', 'hadis:h1', 'dua:d1', 'soz:k1']);
  assert.equal(s[4].tema, 'emek');
  assert.equal('tema' in s[1], false, 'sade ayet temasızdır');
});

/* Manevi dizi (23 Ekim 2026): her gün bütün ayet, hadis, dua ve tema kartları sırayla; bir günün tek öğesi yok. */
const AY = (n) => ({ ...AYET, id: 'a' + n });
const HA = (n) => ({ ...HADIS, id: 'h' + n });
const DUAL = (n) => ({ ...DUA, id: 'd' + n });
const kimlikler = (s) => s.map((x) => x.oge.id);
/** a0 h0 d0 k0 | a1 h1 k1 | a2 k2 | k3 — dualar ve hadisler erken biter, ayet daha sonra, kartlar en son. */
const ESIT_OLMAYAN = { duyurular: [], ayetler: [AY(0), AY(1), AY(2)], hadisler: [HA(0), HA(1)], dualar: [DUAL(0)], kartlar: [KART(0), KART(1), KART(2), KART(3)] };
const SIRA = ['a0', 'h0', 'd0', 'k0', 'a1', 'h1', 'k1', 'a2', 'k2', 'k3'];

test('manevi dizi: çeşitler arasında döner; kısa liste bitince kalanlarla sürer; her listenin kendi sırası korunur', () => {
  assert.deepEqual(kimlikler(maneviSirasi(ESIT_OLMAYAN)), SIRA);
  // Bütün öğeler bir kez: gün başına bir ayet/hadis/dua/kart değil, listelerin tamamı.
  assert.equal(maneviSirasi(ESIT_OLMAYAN).length, 3 + 2 + 1 + 4);
  // Aynı girdi her zaman aynı diziyi verir (rastgelelik ve gün bağımlılığı yok).
  assert.deepEqual(kimlikler(slaytListesi(ESIT_OLMAYAN, 'ana', '2026-09-27')), SIRA);
  assert.deepEqual(kimlikler(slaytListesi(ESIT_OLMAYAN, 'ana', '2027-01-05')), SIRA);
});

test('manevi dizi: tek çeşitli girdi, eksik dualar/kartlar (eski akış) ve boş girdi', () => {
  assert.deepEqual(kimlikler(maneviSirasi({ duyurular: [], ayetler: [AY(0), AY(1)], hadisler: [] })), ['a0', 'a1']);
  assert.deepEqual(kimlikler(maneviSirasi({ duyurular: [], ayetler: [], hadisler: [], kartlar: [KART(5), KART(6)] })), ['k5', 'k6']);
  assert.deepEqual(maneviSirasi({ duyurular: [], ayetler: [], hadisler: [] }), []);
});

test('manevi slaytın imleci çeşit + kimliktir; tema kartı çeşidi ne olursa olsun «kart» sayılır; duyurunun imleci yoktur', () => {
  const s = slaytListesi({ duyurular: [DU('du')], ayetler: [AYET], hadisler: [HADIS], dualar: [DUA], kartlar: [{ cesit: 'ayet', tema: 'sabir', oge: { ...AYET, id: 'ka' } }, KART(1)] }, 'ana', '2026-09-27');
  assert.deepEqual(s.map((x) => x.imlec ? x.imlec.tur + ':' + x.imlec.id : '-'), ['-', 'ayet:a1', 'hadis:h1', 'dua:d1', 'kart:ka', 'kart:k1']);
});

test('kimlik çakışması: ayet a1 ile aynı kimlikli tema kartı ayrı öğelerdir, imleç çeşitle birlikte aranır', () => {
  const girdi = { duyurular: [], ayetler: [AY(1), AY(2)], hadisler: [], kartlar: [{ cesit: 'soz', tema: 'emek', oge: { id: 'a1', tr: 'söz', kaynak: 'k' } }] };
  assert.deepEqual(maneviSirasi(girdi).map((x) => (x.imlec.tur + ':' + x.imlec.id)), ['ayet:a1', 'kart:a1', 'ayet:a2']);
  const tur = { turHedefSn: 25, slayt: ON_SN }; // 3 × 10 sn > 25 → tur başına 2 öğe (sigan 2, en çok n − 1)
  assert.deepEqual(kimlikler(slaytListesi(girdi, 'ana', '2026-09-27', tur, { imlec: { tur: 'ayet', id: 'a1' } })), ['a1', 'a2']);
  assert.deepEqual(kimlikler(slaytListesi(girdi, 'ana', '2026-09-27', tur, { imlec: { tur: 'kart', id: 'a1' } })), ['a2', 'a1']);
});

test('tema kartının çeşidi slayt türü olur; tema slayta taşınır, okuma süresi en uzun dile göre', () => {
  const ayetKarti = { cesit: 'ayet', tema: 'sabir', oge: AYET };
  const hadisKarti = { cesit: 'hadis', tema: 'ilim', oge: HADIS };
  const turu = (k) => { const [s] = slaytListesi({ duyurular: [], ayetler: [], hadisler: [], kartlar: [k] }, 'ana', '2026-09-27'); return s.tur + ':' + s.tema + ':' + s.karakter; };
  assert.equal(turu(ayetKarti), 'ayet:sabir:4');
  assert.equal(turu(hadisKarti), 'hadis:ilim:5');
  assert.equal(turu(KART(1, 'bilgi', 'terbiye')), 'bilgi:terbiye:6'); // «b» + «bilgi»
  assert.equal(turu(KART(1, 'soz', 'birlikte')), 'soz:birlikte:3');
});

test('tur hedef süreyi aşarsa dizi turlara dilimlenir; her tur imlecin ardından başlar, duyuru her turda kalır', () => {
  const girdi = { ...ESIT_OLMAYAN, duyurular: [DU('du')] };
  // Duyuru 10 sn; manevi 10 × 10 sn = 100 sn, hedefin kalanı 30 sn → turda 3 manevi slayt.
  const tur = { turHedefSn: 40, slayt: ON_SN };
  const kim = (imlec) => kimlikler(slaytListesi(girdi, 'ana', '2026-09-27', tur, { imlec }));
  assert.deepEqual(kim(null), ['du', 'a0', 'h0', 'd0'], 'imleç yoksa (ve an verilmediyse) baştan');
  assert.deepEqual(kim({ tur: 'dua', id: 'd0' }), ['du', 'k0', 'a1', 'h1']);
  assert.deepEqual(kim({ tur: 'hadis', id: 'h1' }), ['du', 'k1', 'a2', 'k2']);
});

test('imleç turdan tura ilerler: dizinin sonunda başa sarar ve her öğe tam bir kez gösterilir', () => {
  const tur = { turHedefSn: 30, slayt: ON_SN }; // duyurusuz: turda 3 öğe
  let imlec = null;
  const turlar = [];
  for (let i = 0; i < 4; i++) {
    const s = slaytListesi(ESIT_OLMAYAN, 'ana', '2026-09-27', tur, { imlec });
    turlar.push(kimlikler(s));
    imlec = s[s.length - 1].imlec;
  }
  assert.deepEqual(turlar, [['a0', 'h0', 'd0'], ['k0', 'a1', 'h1'], ['k1', 'a2', 'k2'], ['k3', 'a0', 'h0']], '4. tur dizinin sonundan başa sarar');
  assert.deepEqual([].concat(...turlar.slice(0, 3)).concat(turlar[3][0]), SIRA, 'ilk üç tur + dördüncünün ilk öğesi = dizinin tamamı, tekrarsız');
});

test('imleçteki öğe dizinin son öğesiyse sıradaki tur baştan başlar', () => {
  const s = slaytListesi(ESIT_OLMAYAN, 'ana', '2026-09-27', { turHedefSn: 30, slayt: ON_SN }, { imlec: { tur: 'kart', id: 'k3' } });
  assert.deepEqual(kimlikler(s), ['a0', 'h0', 'd0']);
});

test('sığmadığı için atlanan öğe de geçilmiş sayılır: imleç onda olsa bile tur onun ardından sürer', () => {
  // main.ts sığmayan slaytın imlecini de ilerletir; slaytListesi imleçteki öğeyi bir daha göstermez.
  const s = slaytListesi(ESIT_OLMAYAN, 'ana', '2026-09-27', { turHedefSn: 30, slayt: ON_SN }, { imlec: { tur: 'dua', id: 'd0' } });
  assert.equal(kimlikler(s).indexOf('d0'), -1);
  assert.deepEqual(kimlikler(s), ['k0', 'a1', 'h1']);
});

test('imleç yoksa ya da dizide değilse zamana bağlı deterministik başlangıç; yeniden yükleme her seferinde 0’dan başlamaz', () => {
  const tur = { turHedefSn: 30, slayt: ON_SN }; // 10 öğe, turda 3
  const kim = (konum) => kimlikler(slaytListesi(ESIT_OLMAYAN, 'ana', '2026-09-27', tur, konum));
  const BIR_TUR = 30_000;
  // Epoch'tan beri k. tur → başlangıç = (k × 3) mod 10.
  assert.deepEqual(kim({ simdiMs: 7 * BIR_TUR + 5_000 }), [SIRA[(7 * 3) % 10], SIRA[(7 * 3 + 1) % 10], SIRA[(7 * 3 + 2) % 10]]);
  assert.deepEqual(kim({ simdiMs: 8 * BIR_TUR }), [SIRA[(8 * 3) % 10], SIRA[(8 * 3 + 1) % 10], SIRA[(8 * 3 + 2) % 10]]);
  // Aynı an aynı sonuç; ardışık turlar ardışık dilimler.
  assert.deepEqual(kim({ simdiMs: 7 * BIR_TUR + 29_999 }), kim({ simdiMs: 7 * BIR_TUR }));
  // Depodaki kimlik artık dizide yoksa (içerik kaldırıldı) ya da imleç null ise yedek devreye girer.
  const yedek = kim({ simdiMs: 7 * BIR_TUR });
  assert.deepEqual(kim({ imlec: { tur: 'ayet', id: 'yok-artik' }, simdiMs: 7 * BIR_TUR }), yedek);
  assert.deepEqual(kim({ imlec: null, simdiMs: 7 * BIR_TUR }), yedek);
  // Dizide bulunan imleç, yedek anı olsa bile ağır basar.
  assert.deepEqual(kim({ imlec: { tur: 'dua', id: 'd0' }, simdiMs: 7 * BIR_TUR }), ['k0', 'a1', 'h1']);
  // Bozuk an ya da an yoksa 0.
  for (const bozuk of [undefined, NaN, Infinity]) assert.deepEqual(kim({ simdiMs: bozuk }), ['a0', 'h0', 'd0']);
});

test('tur hedefe sığıyorsa dizinin tamamı baştan gösterilir; imleç ve an yok sayılır, ayar yoksa ya da bozuksa da bütün gösterilir', () => {
  const girdi = { duyurular: [], ayetler: [AYET], hadisler: [HADIS], dualar: [DUA], kartlar: [KART(1)] };
  const konum = { imlec: { tur: 'dua', id: 'd1' }, simdiMs: 123_456_789 };
  const sonuc = (tur) => kimlikler(slaytListesi(girdi, 'ana', '2026-09-27', tur, konum));
  const TAMAMI = ['a1', 'h1', 'd1', 'k1'];
  assert.deepEqual(sonuc({ turHedefSn: 150, slayt: ON_SN }), TAMAMI);
  assert.deepEqual(sonuc(undefined), TAMAMI);
  assert.deepEqual(sonuc({ turHedefSn: NaN, slayt: ON_SN }), TAMAMI);
  assert.deepEqual(sonuc({ turHedefSn: 150, slayt: { ...ON_SN, tabanSn: NaN } }), TAMAMI);
  // Tek öğeli dizi dilimlenmez.
  assert.deepEqual(kimlikler(slaytListesi({ duyurular: [], ayetler: [AYET], hadisler: [] }, 'ana', '2026-09-27', { turHedefSn: 1, slayt: ON_SN }, konum)), ['a1']);
});

test('duyurular hedefi tek başına dolduruyorsa her tur yine en az bir manevi slayt gösterir', () => {
  const girdi = { duyurular: [DU('x'), DU('y'), DU('z')], ayetler: [AYET], hadisler: [HADIS] };
  const s = slaytListesi(girdi, 'ana', '2026-09-27', { turHedefSn: 20, slayt: ON_SN });
  assert.deepEqual(s.map((x) => x.tur), ['duyuru', 'duyuru', 'duyuru', 'ayet']);
});

test('büyük havuz (~500 öğe): bir tur hedef süreye yakın kalır, ardışık turlar dizinin tamamını tekrarsız dolaşır', () => {
  const kartlar = []; for (let i = 0; i < 314; i++) kartlar.push(KART(i, i % 4 === 0 ? 'bilgi' : 'soz'));
  const girdi = { duyurular: [DU('du')], ayetler: Array.from({ length: 60 }, (_, i) => AY(i)), hadisler: Array.from({ length: 80 }, (_, i) => HA(i)), dualar: Array.from({ length: 40 }, (_, i) => DUAL(i)), kartlar };
  const toplam = 60 + 80 + 40 + 314;
  const tur = { turHedefSn: 150, slayt: ON_SN };
  let imlec = null;
  const gorulen = [];
  let turSayisi = 0;
  while (gorulen.length < toplam && turSayisi < 1000) {
    const s = slaytListesi(girdi, 'ana', '2026-09-27', tur, { imlec });
    assert.equal(s[0].oge.id, 'du');
    assert.equal(s.length - 1, 14, 'duyuru 10 sn + 14 × 10 sn = hedef 150 sn');
    for (const x of s.slice(1)) gorulen.push(x.imlec.tur + ':' + x.imlec.id);
    imlec = s[s.length - 1].imlec;
    turSayisi++;
  }
  const ilk = gorulen.slice(0, toplam);
  assert.equal(new Set(ilk).size, toplam, 'bir dolaşımda hiçbir öğe iki kez gelmez');
  assert.deepEqual(ilk, maneviSirasi(girdi).map((x) => x.imlec.tur + ':' + x.imlec.id), 'dolaşım dizinin sırasıdır');
  assert.equal(turSayisi, Math.ceil(toplam / 14));
});

test('imleç metni: gidiş-dönüş; bozuk, boş ve tanınmayan çeşit null verir', () => {
  const i = { tur: 'kart', id: 'k-s-017' };
  assert.deepEqual(imlecCoz(imlecYazisi(i)), i);
  for (const t of ['ayet', 'hadis', 'dua', 'kart']) assert.deepEqual(imlecCoz(imlecYazisi({ tur: t, id: 'x' })), { tur: t, id: 'x' });
  for (const bozuk of [null, undefined, '', '   ', 'a1', '{', '[]', 'null', '{"tur":"ayet"}', '{"tur":"ayet","id":""}', '{"tur":"ayet","id":7}', '{"tur":"esma","id":"x"}', '{"tur":"__proto__","id":"x"}']) {
    assert.equal(imlecCoz(bozuk), null, `null olmalıydı: ${JSON.stringify(bozuk)}`);
  }
});

test('duyuru parçaları: 90’ı aşan iki dilli metin ayrı iki slayt; afişli uzun metin afiş + levha; sığmayan düşer', () => {
  const du = (id, ek) => ({ id, tur: 'duyuru', baslangic: '2026-09-01', son: '2026-10-30', hedef: [], ...ek });
  const s = slaytListesi({ duyurular: [
    du('iki', { tr: { baslik: 'b', metin: 'a'.repeat(100) }, fr: { baslik: 'b', metin: 'c'.repeat(120) } }),
    du('afis', { gorsel: '/a.png', tr: { baslik: 'b', metin: 'a'.repeat(50) } }),
    du('uzun', { tr: { baslik: 'b', metin: 'a'.repeat(181) } }),
  ], ayetler: [], hadisler: [] }, 'ana', '2026-09-27');
  assert.deepEqual(s.map((x) => x.oge.id + ':' + JSON.stringify(x.parca)), [
    'iki:{"yerlesim":"levha","diller":["tr"]}', 'iki:{"yerlesim":"levha","diller":["fr"]}',
    'afis:{"yerlesim":"afis-sol","metinli":false}', 'afis:{"yerlesim":"levha","diller":["tr"]}',
  ]);
  // Süre, o slaytta okunan metinden: afiş slaytında yalnız başlık.
  assert.deepEqual(s.map((x) => x.karakter), [101, 121, 1, 51]);
});

// Bozuk işaret sayfayı kilitlemesin diye sıfırlama yalnız taze sunucu zamanı cihaz saatiyle uyuşunca olur.
test('isaretGuncelle: yükseltir, küçük geri adımı yoksayar', () => {
  assert.equal(isaretGuncelle(SUNUCU_MS, SUNUCU_MS + 60_000, SUNUCU_MS + 60_000), SUNUCU_MS + 60_000);
  assert.equal(isaretGuncelle(SUNUCU_MS, SUNUCU_MS - 60_000, SUNUCU_MS), SUNUCU_MS);
});

test('isaretGuncelle: cihaz uyuşunca bozuk işareti sıfırlar (devasa ve +6 saat)', () => {
  const simdi = Date.parse('2026-10-09T12:00:00Z');
  assert.equal(isaretGuncelle(9999999999999, simdi, simdi), simdi);
  assert.equal(isaretGuncelle(simdi + 6 * 3_600_000, simdi, simdi), simdi);
});

test('isaretGuncelle: cihaz uyuşmazsa bayat önbellek işareti düşürmez (28 Eyl cihaz, 20 Eyl önbellek)', () => {
  const cihaz = Date.parse('2026-09-28T22:23:00Z');
  const onbellek = Date.parse('2026-09-20T12:00:00Z');
  assert.equal(isaretGuncelle(SUNUCU_MS, onbellek, cihaz), SUNUCU_MS);
});

test('isaretGuncelle: null, NaN ve Infinity işareti değiştirmez', () => {
  assert.equal(isaretGuncelle(SUNUCU_MS, null, SUNUCU_MS), SUNUCU_MS);
  assert.equal(isaretGuncelle(SUNUCU_MS, NaN, SUNUCU_MS), SUNUCU_MS);
  assert.equal(isaretGuncelle(SUNUCU_MS, Infinity, SUNUCU_MS), SUNUCU_MS);
});

test('turGunu: saat güvenilirse cihaz günü, değilse işaret günü, işaret yoksa cihaz günü', () => {
  const guvenli = new Date('2026-10-09T12:00:00Z');
  assert.equal(turGunu(guvenli, SUNUCU_MS), bugunTarih(guvenli));
  // Günlerce çevrimdışı kalan doğru saat işaretten ileridedir: tur işaretin değil cihazın gününe kurulur.
  const ileride = new Date('2026-10-12T08:00:00Z');
  assert.equal(turGunu(ileride, SUNUCU_MS), '2026-10-12');
  const geride = new Date('2026-09-28T22:23:00Z');
  assert.equal(saatGecerliMi(geride, SUNUCU_MS), false);
  assert.equal(turGunu(geride, SUNUCU_MS), bugunTarih(new Date(SUNUCU_MS)));
  assert.equal(turGunu(geride, SUNUCU_MS), '2026-10-09');
  const issiz = new Date(0);
  assert.equal(turGunu(issiz, 0), bugunTarih(issiz));
});

test('sunucuSaatiCoz: 2100 ve sonrası null verir', () => {
  assert.equal(EN_GEC_GECERLI, Date.parse('2100-01-01T00:00:00Z'));
  assert.equal(sunucuSaatiCoz('Sat, 01 Jan 2100 00:00:00 GMT'), null);
  assert.equal(sunucuSaatiCoz('Mon, 01 Jan 2101 00:00:00 GMT'), null);
  assert.ok(sunucuSaatiCoz('Thu, 31 Dec 2099 23:59:59 GMT') !== null);
});
