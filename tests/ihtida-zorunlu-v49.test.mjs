/** İhtida formu — 16 Kasım 2026 (Apps Script v49): EK-9 arka yüzü DHYS'ye boş ulaşmasın.
 *  Vahi Bey 12 Kasım'da DHYS'nin boş alanı reddettiğini bildirdi; basılı EK-9'larda «Bildirilmedi» çıkıyordu.
 *  Kurallar (üç yerde aynı, bu test üçünü birlikte sınar):
 *   - ihtida sebebi zorunlu: en az 10 karakter ve 5 harf (her alfabe);
 *   - EK-9 kişisel metinleri: en az 2 Unicode harf («..», «-», «x», «?», «—» geçmez; «Bilinmiyor», «Inconnu» geçer);
 *   - yönetim penceresinde sekiz EK-9 alanı + sebep zorunlu; sunucu da aynısını uygular.
 *  Ağ, Drive, Sheets ve e-posta yoktur. Kişiler TESTOGLU / .test adresleri. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { camiCoz } from '../public/admin/cami-secimi.js';
import { imzaVektorCoz } from '../public/admin/imza-ciz.js';
import { ek9AlanTamam, ek9SebepTamam, ek9Eksikleri, ek9AlanlariGecerli, EK9_ALANLARI } from '../public/admin/ek9-hazirlik.js';
import { kisiMetniTamam, sebepTamam, harfSay } from '../src/lib/ihtida-metin.ts';
import { build } from 'esbuild';

const paket = await build({ stdin: { contents: "export { tr } from './src/i18n/formlar/tr'; export { fr } from './src/i18n/formlar/fr'; export { en } from './src/i18n/formlar/en'; export { nl } from './src/i18n/formlar/nl'; export { de } from './src/i18n/formlar/de';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const dilMetinleri = await import('data:text/javascript;base64,' + Buffer.from(paket.outputFiles[0].text).toString('base64'));
const kaynak = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v49.gs', 'ihtida-paket-isleri.gs']
  .map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');
const astro = readFileSync(new URL('../src/components/formlar/IhtidaFormu.astro', import.meta.url), 'utf8');

function arkaUc() {
  const c = vm.createContext({ console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy-MM-dd' ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : '16.11.2026 12:00' } });
  vm.runInContext(kaynak, c);
  c.IhtidaPdf = { camiCoz, imzaVektorCoz };
  c.json = x => x;
  return c;
}
const govde = (basvuran = {}) => ({
  sir: 'ULUCAMII-IHTIDA-2026', dil: 'tr', gonderimAnahtari: 'test-zorunlu-2099-0001',
  basvuran: { ad: 'Deniz', soyad: 'Testoglu', cinsiyet: 'kadin', dogumTarihi: '1990-05-20', dogumYeri: 'Namur', uyruk: 'Belçika', anneAdi: 'Anne', babaAdi: 'Baba', medeniHali: 'bekar', ogrenimDurumu: 'Lisans', meslek: 'Öğretmen', oncekiDin: 'Katolik',
    ihtidaSebebi: 'Kendi araştırmam sonucunda karar verdim.', eposta: 'deniz@example.test', telefon: '+32470123456', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belgique', adresSokak: 'Rue du Test 12', postaKodu: '6900', sehir: 'Marche-en-Famenne', ulke: 'Belgique', torenDili: 'tr', ...basvuran },
  teslimat: { yontem: 'cami' }, sahitSecimi: 'cami', sahitler: [],
  fotografIzni: false, belgeTuru: 'pasaport', imzaYok: true,
  gorseller: { vesikalik: 'data:image/png;base64,' + 'A'.repeat(400), kimlikOn: 'data:image/png;base64,' + 'A'.repeat(400), kimlikArka: '', imza: '' },
  onay: { acikRiza: true, ek10: true, ek10Surumu: '2026-09-09', imzaAktarimIzni: false, gizlilik: true, gorselRiza: true, beyan: 'Deniz Testoglu' },
});

const YER_TUTUCULAR = ['', ' ', '.', '..', '...', '-', '—', 'x', 'X', '?', '/', '1', '12', '- -', 'ا'];
const GERCEK_SOZCUKLER = ['Bilinmiyor', 'Inconnu', 'Onbekend', 'Unknown', 'Unbekannt', 'Étudiante', 'Sans emploi', 'Öğrenci', 'Çalışmıyor', 'Li', 'Ng', 'أحمد', 'Иван', '李明', 'Marie-Ève'];

test('2 harf kuralı: istemci yardımcısı, sunucu ve yönetim penceresi aynı tabloyu verir', () => {
  const c = arkaUc();
  for (const d of YER_TUTUCULAR) {
    assert.equal(kisiMetniTamam(d), false, `istemci: «${d}» geçmemeli`);
    assert.equal(c.ihtidaKisiMetniTamam(d), false, `sunucu: «${d}» geçmemeli`);
    assert.equal(ek9AlanTamam(d), false, `pencere: «${d}» geçmemeli`);
  }
  for (const d of GERCEK_SOZCUKLER.filter(x => harfSay(x) >= 2)) {
    assert.equal(kisiMetniTamam(d), true, `istemci: «${d}»`);
    assert.equal(c.ihtidaKisiMetniTamam(d), true, `sunucu: «${d}»`);
    assert.equal(ek9AlanTamam(d), true, `pencere: «${d}»`);
  }
  for (const d of [null, undefined, 5, {}]) assert.equal(c.ihtidaKisiMetniTamam(d), false);
});

test('Sebep kuralı: en az 10 karakter ve 5 harf; üç yerde aynı', () => {
  const c = arkaUc();
  const gecen = ['Huzuru buldum.', 'Kendi araştırmam sonucunda karar verdim.', 'J’ai trouvé la paix', 'Ik vond rust in de islam', 'وجدت الطمأنينة في الإسلام', '  Kısa ama yeterli  '];
  const kalan = ['', '..', '..........', '-----------', '1234567890', 'abcd', 'a b c d e', 'Çok kısa', '....abcd....', '          ', '12345 678 9 .'];
  for (const d of gecen) {
    assert.equal(sebepTamam(d), true, 'istemci: ' + d);
    assert.equal(c.ihtidaSebepTamam(d), true, 'sunucu: ' + d);
    assert.equal(ek9SebepTamam(d), true, 'pencere: ' + d);
  }
  for (const d of kalan) {
    assert.equal(sebepTamam(d), false, 'istemci: «' + d + '»');
    assert.equal(c.ihtidaSebepTamam(d), false, 'sunucu: «' + d + '»');
    assert.equal(ek9SebepTamam(d), false, 'pencere: «' + d + '»');
  }
  assert.equal(c.ihtidaSebepTamam(undefined), false);
});

test('Sunucu: sebep zorunlu; her EK-9 metin alanında yer tutucu reddedilir, gerçek sözcük geçer', () => {
  const c = arkaUc();
  assert.equal(c.ihtidaDogrulaV2(govde()).tamam, true, 'temel gövde geçerli');
  // sebep
  const sebepsiz = govde(); delete sebepsiz.basvuran.ihtidaSebebi;
  assert.equal(c.ihtidaDogrulaV2(sebepsiz).kod, 'basvuran-sebep-eksik');
  assert.equal(c.ihtidaDogrulaV2(govde({ ihtidaSebebi: '' })).kod, 'basvuran-sebep-eksik');
  assert.equal(c.ihtidaDogrulaV2(govde({ ihtidaSebebi: '   ' })).kod, 'basvuran-sebep-eksik');
  assert.equal(c.ihtidaDogrulaV2(govde({ ihtidaSebebi: '..' })).kod, 'basvuran-sebep-gecersiz');
  assert.equal(c.ihtidaDogrulaV2(govde({ ihtidaSebebi: 'kısa' })).kod, 'basvuran-sebep-gecersiz');
  assert.equal(c.ihtidaDogrulaV2(govde({ ihtidaSebebi: 'a'.repeat(601) })).kod, 'basvuran-sebep-uzun');
  assert.equal(c.ihtidaDogrulaV2(govde({ ihtidaSebebi: 'Huzuru buldum.' })).tamam, true);
  // sekiz alan (medeni hâl seçimli)
  const kodlar = { dogumYeri: 'basvuran-dogum-yeri-eksik', uyruk: 'basvuran-uyruk-eksik', anneAdi: 'basvuran-anne-adi-eksik', babaAdi: 'basvuran-baba-adi-eksik',
    ogrenimDurumu: 'basvuran-ogrenim-eksik', meslek: 'basvuran-meslek-eksik', oncekiDin: 'basvuran-onceki-din-eksik' };
  for (const [alan, kod] of Object.entries(kodlar)) {
    for (const d of ['..', '-', '—', '.', 'x', '?', '']) assert.equal(c.ihtidaDogrulaV2(govde({ [alan]: d })).kod, kod, `${alan} = «${d}»`);
    for (const d of ['Bilinmiyor', 'Inconnu', 'Onbekend', 'Unknown', 'Étudiante', 'Sans emploi']) assert.equal(c.ihtidaDogrulaV2(govde({ [alan]: d })).tamam, true, `${alan} = «${d}»`);
  }
  assert.equal(c.ihtidaDogrulaV2(govde({ medeniHali: '..' })).kod, 'basvuran-medeni-hali-gecersiz');
});

test('Sunucu POST: yer tutuculu ya da sebepsiz başvuru ref ayırmadan reddedilir', () => {
  const c = arkaUc();
  let ref = 0, yazim = 0;
  c.referansMaxBul = () => { ref++; return 9999; };
  c.satirEkle = () => { yazim++; };
  c.ihtidaKlasorGetir = () => { yazim++; return { createFile: () => { yazim++; return { getUrl: () => '' }; } }; };
  c.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  c.basvuruSinirKodu = () => '';
  for (const b of [{ babaAdi: '..' }, { meslek: '-' }, { ihtidaSebebi: '' }, { ihtidaSebebi: '..' }]) {
    const s = c.ihtidaPostIsleV2(govde(b));
    assert.equal(s.ok, false, JSON.stringify(b));
  }
  assert.equal(ref, 0, 'ref harcanmadı'); assert.equal(yazim, 0, 'hiçbir şey yazılmadı');
});

test('Eski önbellekli sayfanın tek alanlı adSoyad gövdesi bozulmadı (ad/soyad bu kuraldan etkilenmez)', () => {
  const c = arkaUc();
  const v = govde(); delete v.basvuran.ad; delete v.basvuran.soyad; v.basvuran.adSoyad = 'Deniz Testoglu';
  assert.equal(c.ihtidaDogrulaV2(v).tamam, true);
});

test('Sağlık yanıtı v49 ve yeni denetimi bildirir', () => {
  const c = arkaUc();
  assert.equal(c.SURUM, 49);
  const s = c.doGet({});
  assert.equal(s.surum, 49);
  assert.equal(s.ihtidaKisiMetniDenetimi, true);
  assert.match(astro, /data-asgari-servis-surumu="49"/);
});

// ---- yönetim penceresi ----------------------------------------------------------------------------------------------------------

const TAM_KAYIT = { 'Doğum yeri': 'Namur', 'Uyruk': 'Belçika', 'Anne adı': 'Anne', 'Baba adı': 'Baba', 'Medeni hali': 'bekar', 'Cinsiyet': 'kadin', 'Öğrenim durumu': 'lise', 'Mesleği': 'Öğretmen', 'Önceki din/mezhep': 'hristiyan-katolik', 'İhtida sebebi': 'Huzuru buldum.' };

test('Pencere: eksik ya da yer tutucu EK-9 alanları yakalanır; eski boş kayıt tamamlanana dek üretilemez', () => {
  assert.deepEqual(ek9Eksikleri(TAM_KAYIT), []);
  assert.deepEqual(ek9Eksikleri({}), [...EK9_ALANLARI]);
  assert.deepEqual(ek9Eksikleri({ ...TAM_KAYIT, 'Baba adı': '..', 'Mesleği': '-' }), ['babaAdi', 'meslek']);
  // görevlinin düzeltmesi kayıttaki yer tutucuyu tamamlar; boş düzeltme iyi kaydı bozar
  assert.deepEqual(ek9Eksikleri({ ...TAM_KAYIT, 'Baba adı': '..' }, { babaAdi: 'Bilinmiyor / Inconnu' }), []);
  assert.deepEqual(ek9Eksikleri(TAM_KAYIT, { meslek: '' }), ['meslek']);
  assert.deepEqual(ek9Eksikleri(TAM_KAYIT, { uyruk: '—' }), ['uyruk']);
  // biçim denetimi önceki gibi: boş değer biçim olarak geçerli (eski panel), eksiklik ek9Eksikleri'ndedir
  assert.equal(ek9AlanlariGecerli({ meslek: '' }), true);
});

test('Pencere kaynağı: sekiz alan ve sebep zorunlu, ipucu «Bilinmiyor», «Bildirilmedi» ile boş bırakma önerisi yok', () => {
  const js = readFileSync(new URL('../public/admin/ek9-hazirlik.js', import.meta.url), 'utf8');
  assert.match(js, /required: true, value: ek9Ilk\[alan\]/);
  assert.match(js, /id="ek9-sebep" name="sebep" required minlength="10"/);
  assert.match(js, /ihtidaSebebi: sebepAlani\.value\.trim\(\)/);
  assert.doesNotMatch(js, /Boş bıraktığınız alana/);
  assert.doesNotMatch(js, /isteğe bağlı, başvuranın kendi ifadesi/);
  assert.match(js, /Bilinmiyor \/ Inconnu/);
});

// ---- sunucu: nihai nüsha onayı ----------------------------------------------------------------------------------------------------

test('Sunucu onayı: eksik EK-9 alanı ya da sebep varken nihai nüsha kuyruğa alınmaz', () => {
  const c = arkaUc();
  const gecen = { ihtidaTarihi: '2026-11-10', beyanTarihi: '2026-11-09', adSoyad: 'Deniz Testoglu', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belgique', belgeTuru: 'kimlik',
    sahitler: [{ ad: 'Birinci Örnek' }, { ad: 'İkinci Örnek' }], ihtidaSebebi: 'Huzuru buldum.' };
  const kayitlar = { kayit: { ...TAM_KAYIT, 'Referans': 'IH-2099-9999', 'Cami kimliği': 'ulucamii-marche' } };
  const yaz = [];
  c.IhtidaPdf = { camiCoz, imzaVektorCoz, ek9AlanlariGecerli, ek9Eksikleri, sebepKaynagi: (k, d) => (d && d.ihtidaSebebi != null ? d.ihtidaSebebi : k['İhtida sebebi']) || '' };
  c.panelYetkiTamam = () => true; c.temizAnahtar = () => true;
  c.ihtidaPaketKayit = () => kayitlar;
  c.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  c.ihtidaPaketIsiOku = () => null; c.ihtidaPaketIsiYaz = x => yaz.push(x); c.ihtidaPaketHucre = () => {}; c.ihtidaPaketOzet = x => x;
  const onay = (hazirlik, kayit) => { kayitlar.kayit = { ...TAM_KAYIT, 'Referans': 'IH-2099-9999', 'Cami kimliği': 'ulucamii-marche', ...kayit }; return c.ihtidaPaketOnayIsle({ anahtar: 'x', ref: 'IH-2099-9999', hazirlik, islemAnahtari: 'onay-anahtari-2099' }); };
  assert.equal(onay(gecen).ok, true, 'tam kayıt onaylanır');
  assert.equal(yaz.length, 1);
  const r1 = onay(gecen, { 'Baba adı': '..' });
  assert.equal(r1.hata, 'ek9-alan-eksik'); assert.deepEqual(r1.alanlar, ['babaAdi']);
  assert.equal(onay({ ...gecen, alanlar: { babaAdi: 'Bilinmiyor / Inconnu' } }, { 'Baba adı': '..' }).ok, true, 'görevli tamamlayınca geçer');
  const r2 = onay({ ...gecen, alanlar: { meslek: '' } });
  assert.equal(r2.hata, 'ek9-alan-eksik'); assert.deepEqual(r2.alanlar, ['meslek']);
  assert.equal(onay({ ...gecen, ihtidaSebebi: '' }).hata, 'ek9-sebep-eksik');
  assert.equal(onay({ ...gecen, ihtidaSebebi: '..' }).hata, 'ek9-sebep-eksik');
  const eskiBos = { 'İhtida sebebi': '', 'Anne adı': '', 'Mesleği': '' };
  const { ihtidaSebebi: _, ...sebepsizHazirlik } = gecen;
  assert.equal(onay(sebepsizHazirlik, eskiBos).hata, 'ek9-alan-eksik', 'eski boş kayıt tamamlanmadan üretilmez');
  assert.equal(onay({ ...sebepsizHazirlik, alanlar: { anneAdi: 'Bilinmiyor', meslek: 'Çalışmıyor' }, ihtidaSebebi: 'Huzuru buldum.' }, eskiBos).ok, true, 'tamamlanınca üretilir');
});

// ---- form işaretlemesi ve metinler -------------------------------------------------------------------------------------------------

test('Form işaretlemesi: yedi kişisel alan ve sebep zorunlu + doğrulama türü, ipucu paragrafları, sebep «isteğe bağlı» değil', () => {
  for (const ad of ['dogumYeri', 'uyruk', 'anneAdi', 'babaAdi', 'ogrenimDurumu', 'meslek', 'oncekiDin'])
    assert.match(astro, new RegExp(`name="basvuran\\.${ad}" type="text" required data-tur="kisi-metni" data-hata-metni=\\{h\\.kisi\\.metinHata\\}`), ad);
  assert.match(astro, /<textarea id="i-sebep" name="basvuran\.ihtidaSebebi" required data-tur="sebep" data-hata-metni=\{h\.ihtida\.sebepHata\} minlength="10"/);
  assert.doesNotMatch(astro, /h\.ihtida\.sebep\} <span class="istege"/);
  for (const id of ['i-anne-yardim', 'i-baba-yardim', 'i-meslek-yardim', 'i-sebep-yardim']) assert.match(astro, new RegExp(`id="${id}"`));
  for (const kod of ['basvuran-sebep-eksik', 'basvuran-sebep-gecersiz', 'basvuran-baba-adi-eksik', 'basvuran-meslek-eksik']) assert.match(astro, new RegExp(`'sunucu:${kod}'`));
  const cekirdek = readFileSync(new URL('../src/scripts/form-cekirdek.ts', import.meta.url), 'utf8');
  assert.match(cekirdek, /tur === 'kisi-metni' && !kisiMetniTamam\(v\)/);
  assert.match(cekirdek, /tur === 'sebep' && !sebepTamam\(v\)/);
});

test('Beş dilde hata iletisi, anne/baba ipucu, meslek ipucu ve sebep metinleri var; Fransızcada ince yazım doğru', () => {
  const beklenen = { tr: /Bilinmiyor/, fr: /Inconnu/, en: /Unknown/, nl: /Onbekend/, de: /Unbekannt/ };
  const meslek = { tr: /Öğrenci.*Çalışmıyor/, fr: /Étudiant.*Sans emploi/, en: /Student.*Unemployed/, nl: /Student.*Werkloos/, de: /Student.*Arbeitslos/ };
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    const m = dilMetinleri[dil].ihtida;
    for (const [ad, deger] of [['kisi.metinHata', m.kisi.metinHata], ['kisi.anneBabaYardim', m.kisi.anneBabaYardim], ['durum.meslekYardim', m.durum.meslekYardim], ['ihtida.sebepHata', m.ihtida.sebepHata], ['ihtida.sebepYardim', m.ihtida.sebepYardim]])
      assert.ok(typeof deger === 'string' && deger.length > 15, `${dil}.${ad}`);
    assert.match(m.kisi.anneBabaYardim, beklenen[dil], dil + ' anne/baba ipucu');
    assert.match(m.durum.meslekYardim, meslek[dil], dil + ' meslek ipucu');
    assert.match(m.kisi.metinHata, /\.\./, dil + ': hata iletisi «..» örneğini gösterir');
    assert.doesNotMatch(m.ihtida.sebepYardim, /isteğe bağlı|facultatif|optional|optioneel|optional\b/i, dil + ': sebep artık isteğe bağlı değil');
    assert.match(m.ihtida.sebepHata + m.ihtida.sebepYardim, /10/, dil + ': 10 karakter');
  }
  // Fransızca: ; : ! ? öncesinde ve « » içinde bölünmez boşluk
  for (const ad of [['kisi', 'metinHata'], ['kisi', 'anneBabaYardim'], ['durum', 'meslekYardim'], ['ihtida', 'sebepHata'], ['ihtida', 'sebepYardim']]) {
    const s = dilMetinleri.fr.ihtida[ad[0]][ad[1]];
    assert.doesNotMatch(s, /[^ \s][;:!?]/, `fr ${ad.join('.')}: noktalama öncesi bölünmez boşluk`);
    assert.doesNotMatch(s, / [;:!?»]|« /, `fr ${ad.join('.')}: sıradan boşluk yok`);
    assert.doesNotMatch(s, /«[^ ]|[^ ]»/, `fr ${ad.join('.')}: tırnak içinde bölünmez boşluk`);
  }
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) assert.doesNotMatch(Object.values(dilMetinleri[dil].ihtida.kisi).join(' ') + dilMetinleri[dil].ihtida.sebepHata, /\+32 471 79 46 82/);
});
