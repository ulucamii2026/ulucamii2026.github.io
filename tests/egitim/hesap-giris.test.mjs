/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — giriş mantığı: oturum işareti (hesap/isaret.ts), Firebase yükleyicisi (firebase-istemci.ts),
 * kart ve çocuk girişi (hesap/kart-giris.ts), e-posta/Google oturumu ve çıkış (hesap/oturum.ts). Bağlayıcı: anonim sayfa Firebase
 * yüklemez (statik içe aktarım yok; işaret yoksa yükleyici hiçbir şey indirmez); emülatör yalnız yerel adres + açık bayrakla;
 * kart sırrı adresten HER ŞEYDEN ÖNCE silinir; sunucu yanıtları koda çevrilir; çıkış kullanıcının cihaz kopyasını siler, anonim
 * kayda dokunmaz, eşitlenmemiş çalışma varsa sormadan silmez. Firebase sahtedir (hesap-sahte.mjs).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { BellekDepo, hata, kullanici, sahteFirebase, yukle } from './hesap-sahte.mjs';

const m = await yukle('egitim-hesap-giris-test', ['firebase-istemci', 'hesap/isaret', 'hesap/kart-giris', 'hesap/oturum', '@ortak/lib/ezber/cihaz']);
const OZET = await m.uidOzeti('u-deneme-1');
const KULLANICI = m.kullaniciAnahtari(OZET);
const KART = { kartId: 'AbC_-123456z', sir: 'S'.repeat(11) + '_-' + 'x'.repeat(9) };

test('anonim sayfa Firebase yüklemez: hesap modüllerinde ve yükleyicide statik firebase içe aktarımı yok', () => {
  const dosyalar = ['egitim/src/lib/firebase-istemci.ts', ...readdirSync('egitim/src/lib/hesap').map((d) => `egitim/src/lib/hesap/${d}`)];
  for (const d of dosyalar) {
    const kaynak = readFileSync(d, 'utf8');
    for (const [satir] of kaynak.matchAll(/^import\s(?!type\s)[^;]*from\s+['"][^'"]+['"]/gm)) {
      assert.doesNotMatch(satir, /['"](firebase\/|@ortak\/lib\/firebase['"])/, `${d}: ${satir}`);
    }
  }
  assert.match(readFileSync('egitim/src/lib/hesap/isaret.ts', 'utf8'), /^import \{ ANAHTAR, kullaniciAnahtari, type Depo \} from '@ortak\/lib\/ezber\/cihaz';$/m);
});

test('gerekirseYukle: oturum işareti yoksa hiçbir şey yüklemez', async () => {
  assert.equal(await m.gerekirseYukle(new BellekDepo()), null);
  assert.equal(await m.gerekirseYukle(null), null);
  assert.equal(await m.gerekirseYukle(new BellekDepo({ [m.OTURUM_ANAHTARI]: '1' })), null, 'bozuk işaret oturum sayılmaz');
});

test('emülatör yalnız localhost/127.0.0.1 VE açık bayrakla; yapılandırma egitim alan adıyla, emülatörde demo projesi', () => {
  const bayrak = new BellekDepo({ [m.EMULATOR_BAYRAGI]: '1' });
  assert.equal(m.emulatorMu('localhost', bayrak), true);
  assert.equal(m.emulatorMu('127.0.0.1', bayrak), true);
  assert.equal(m.emulatorMu('egitim.ulucamii.be', bayrak), false, 'canlıda bayrak yanlışlıkla kalsa da');
  assert.equal(m.emulatorMu('localhost', new BellekDepo()), false);
  assert.equal(m.emulatorMu('localhost', new BellekDepo({ [m.EMULATOR_BAYRAGI]: 'true' })), false);
  assert.equal(m.emulatorMu('localhost', { getItem() { throw new Error('kapalı'); } }), false);
  const temel = { apiKey: 'k', authDomain: 'ulucamii-portal.firebaseapp.com', projectId: 'ulucamii-portal', appId: 'a' };
  assert.deepEqual(m.yapilandirma(temel, false), { ...temel, authDomain: 'egitim.ulucamii.be' });
  assert.deepEqual(m.yapilandirma(temel, true), { ...temel, authDomain: 'egitim.ulucamii.be', projectId: 'demo-ulucamii' });
  assert.equal(m.apiAdresi('kart-giris', false), '/api/kart-giris');
  assert.equal(m.apiAdresi('cocuk-giris', true), 'http://127.0.0.1:5185/demo-ulucamii/europe-west1/cocukGiris');
  assert.equal(m.UYGULAMA_ADI, 'ilim');
  assert.equal(m.BOLGE, 'europe-west1');
});

test('oturum işareti: değeri uid özeti; etkin anahtar girişliyken kullanıcının, değilse anonim; bozuk/kapalı depo sessiz', () => {
  const depo = new BellekDepo();
  assert.equal(m.etkinAnahtar(depo), m.ANAHTAR);
  m.isaretKoy(depo, OZET);
  assert.equal(m.oturumOzeti(depo), OZET);
  assert.equal(m.oturumVar(depo), true);
  assert.equal(m.etkinAnahtar(depo), KULLANICI);
  assert.throws(() => m.isaretKoy(depo, 'u-deneme-1'), TypeError, 'ham uid işarete yazılmaz');
  m.isaretKaldir(depo);
  assert.equal(m.etkinAnahtar(depo), m.ANAHTAR);
  const kapali = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.equal(m.oturumOzeti(kapali), null);
  assert.doesNotThrow(() => { m.isaretKoy(kapali, OZET); m.isaretKaldir(kapali); });
  assert.equal(m.etkinAnahtar(kapali), m.ANAHTAR);
});

test('kart adresi: biçim sunucuyla aynı; fragment geçerli olsun olmasın hemen silinir', () => {
  assert.deepEqual(m.kartAyristir(`#${KART.kartId}.${KART.sir}`), KART);
  assert.deepEqual(m.kartAyristir(`${KART.kartId}.${KART.sir}`), KART);
  for (const kotu of ['', '#', `#${KART.kartId}`, `#${KART.kartId}.${KART.sir}.x`, `#${KART.kartId}x.${KART.sir}`, `#${KART.kartId}.${KART.sir.slice(1)}`, `#${KART.kartId}.${KART.sir.slice(1)}=`])
    assert.equal(m.kartAyristir(kotu), null, kotu);

  const gecmis = { state: { s: 1 }, kayit: [], replaceState(st, _b, url) { this.kayit.push([st, url]); } };
  const kart = m.adrestenKartAl({ hash: `#${KART.kartId}.${KART.sir}`, pathname: '/k/', search: '?dil=fr' }, gecmis);
  assert.deepEqual(kart, KART);
  assert.deepEqual(gecmis.kayit, [[{ s: 1 }, '/k/?dil=fr']], 'sır adresten silindi, durum korundu');
  const g2 = { state: null, kayit: [], replaceState(st, _b, url) { this.kayit.push(url); } };
  assert.equal(m.adrestenKartAl({ hash: '#bozuk.sir', pathname: '/k/', search: '' }, g2), null);
  assert.deepEqual(g2.kayit, ['/k/'], 'bozuk fragment de silinir');
  const g3 = { state: null, kayit: [], replaceState() { this.kayit.push('x'); } };
  assert.equal(m.adrestenKartAl({ hash: '', pathname: '/k/', search: '' }, g3), null);
  assert.deepEqual(g3.kayit, [], 'fragment yoksa adrese dokunulmaz');
});

test('giriş ucu yanıtları koda çevrilir', () => {
  assert.deepEqual(m.yanitNedeni(401, { hata: 'yanlis' }), { neden: 'yanlis' });
  assert.deepEqual(m.yanitNedeni(429, { hata: 'kilit', bitis: '2026-11-02T10:15:00.000Z' }), { neden: 'kilit', bitis: '2026-11-02T10:15:00.000Z' });
  assert.deepEqual(m.yanitNedeni(429, { hata: 'kilit', bitis: 'yarın' }), { neden: 'kilit' });
  assert.deepEqual(m.yanitNedeni(429, null), { neden: 'kilit' });
  for (const d of [400, 403, 405, 413, 415]) assert.deepEqual(m.yanitNedeni(d, { hata: 'gecersiz' }), { neden: 'gecersiz' }, String(d));
  for (const d of [500, 502, 503]) assert.deepEqual(m.yanitNedeni(d, null), { neden: 'sunucu' }, String(d));
});

const yanit = (status, govde) => ({ ok: status >= 200 && status < 300, status, json: async () => (govde === undefined ? Promise.reject(new Error('json yok')) : govde) });

test('kartla giriş: istek gövdesi, custom token ile giriş ve oturum işareti; hatalar kod olarak', async () => {
  const { f, k } = sahteFirebase({ user: null });
  const depo = new BellekDepo();
  const istekler = [];
  const getir = async (adres, istek) => { istekler.push([adres, istek]); return yanit(200, { token: 'ozel-token' }); };
  const s = await m.kartlaGir(f, KART, { depo, getir });
  assert.deepEqual(s, { ok: true, uid: 'c_cocuk0000000000000' });
  assert.equal(istekler[0][0], '/api/kart-giris');
  assert.equal(istekler[0][1].method, 'POST');
  assert.equal(istekler[0][1].headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(istekler[0][1].body), KART);
  assert.equal(istekler[0][1].credentials, 'omit');
  assert.deepEqual(k.auth, [['token', 'ozel-token']]);
  assert.equal(m.oturumOzeti(depo), await m.uidOzeti('c_cocuk0000000000000'));
  assert.ok(!depo.anahtarlar().some((a) => depo.getItem(a).includes(KART.sir)), 'sır depoya yazılmaz');

  const dene = async (g) => m.kartlaGir(sahteFirebase({ user: null }).f, KART, { depo: new BellekDepo(), getir: g });
  assert.deepEqual(await dene(async () => yanit(401, { hata: 'yanlis' })), { ok: false, neden: 'yanlis' });
  assert.deepEqual(await dene(async () => yanit(429, { hata: 'kilit', bitis: '2026-11-02T10:15:00.000Z' })), { ok: false, neden: 'kilit', bitis: '2026-11-02T10:15:00.000Z' });
  assert.deepEqual(await dene(async () => yanit(400, { hata: 'gecersiz' })), { ok: false, neden: 'gecersiz' });
  assert.deepEqual(await dene(async () => yanit(500)), { ok: false, neden: 'sunucu' });
  assert.deepEqual(await dene(async () => yanit(200, {})), { ok: false, neden: 'sunucu' }, 'token yoksa');
  assert.deepEqual(await dene(async () => { throw new TypeError('Failed to fetch'); }), { ok: false, neden: 'ag' });
  const f2 = sahteFirebase({ user: null }).f;
  f2.a.signInWithCustomToken = async () => { throw hata('auth/network-request-failed'); };
  assert.deepEqual(await m.kartlaGir(f2, KART, { depo: new BellekDepo(), getir: async () => yanit(200, { token: 't' }) }), { ok: false, neden: 'ag' });
  f2.a.signInWithCustomToken = async () => { throw hata('auth/invalid-custom-token'); };
  assert.deepEqual(await m.kartlaGir(f2, KART, { depo: new BellekDepo(), getir: async () => yanit(200, { token: 't' }) }), { ok: false, neden: 'sunucu' });
});

test('kullanıcı adı + şifre: /api/cocuk-giris; boş ya da 64 karakterden uzun girdi istek atmadan reddedilir', async () => {
  const { f } = sahteFirebase({ user: null });
  const istekler = [];
  const getir = async (adres, istek) => { istekler.push([adres, JSON.parse(istek.body)]); return yanit(200, { token: 't' }); };
  assert.equal((await m.cocukGir(f, { kullaniciAdi: ' Ayse42 ', sifre: 'kedi limon 42' }, { depo: new BellekDepo(), getir })).ok, true);
  assert.deepEqual(istekler, [['/api/cocuk-giris', { kullaniciAdi: 'Ayse42', sifre: 'kedi limon 42' }]]);
  for (const g of [{ kullaniciAdi: '', sifre: 'x' }, { kullaniciAdi: 'a', sifre: '  ' }, { kullaniciAdi: 'a'.repeat(65), sifre: 'x' }, { kullaniciAdi: 'a', sifre: 'x'.repeat(65) }])
    assert.deepEqual(await m.cocukGir(f, g, { getir }), { ok: false, neden: 'gecersiz' });
  assert.equal(istekler.length, 1);
});

test('Auth hataları koda çevrilir', () => {
  const beklenen = {
    'auth/email-already-in-use': 'eposta-kullanimda', 'auth/invalid-email': 'eposta-gecersiz', 'auth/weak-password': 'sifre-zayif',
    'auth/invalid-credential': 'giris-yanlis', 'auth/wrong-password': 'giris-yanlis', 'auth/user-not-found': 'giris-yanlis',
    'auth/too-many-requests': 'cok-deneme', 'auth/network-request-failed': 'ag', 'auth/popup-closed-by-user': 'iptal',
    'auth/cancelled-popup-request': 'iptal', 'auth/user-disabled': 'hesap-kapali', 'auth/account-exists-with-different-credential': 'baska-yontem',
    'auth/requires-recent-login': 'yeniden-giris', 'auth/bilinmeyen-sey': 'bilinmeyen',
  };
  for (const [kod, neden] of Object.entries(beklenen)) assert.equal(m.authNedeni(hata(kod)), neden, kod);
  assert.equal(m.authNedeni(null), 'bilinmeyen');
  assert.equal(m.authNedeni(new Error('x')), 'bilinmeyen');
});

test('kayıt: e-posta kırpılır, doğrulama e-postası sayfanın dilinde gider; gitmezse kayıt yine geçerli', async () => {
  const { f, k } = sahteFirebase({ user: null });
  const depo = new BellekDepo();
  const s = await m.kayitOl(f, { eposta: ' yeni@example.test ', sifre: 'uzun-sifre-1', dil: 'fr', donus: 'https://egitim.ulucamii.be/fr/hesap/', depo });
  assert.equal(s.ok, true);
  assert.equal(s.dogrulamaGitti, true);
  assert.equal(s.kullanici.dogrulanmis, false);
  assert.deepEqual(k.auth, [['kayit', 'yeni@example.test', 'uzun-sifre-1'], ['dogrulama', 'u-yeni', { url: 'https://egitim.ulucamii.be/fr/hesap/' }, 'fr']]);
  assert.equal(m.oturumOzeti(depo), await m.uidOzeti('u-yeni'));
  assert.ok(!depo.anahtarlar().some((a) => /yeni@|uzun-sifre/.test(depo.getItem(a))), 'e-posta ve şifre depoya yazılmaz');

  const s2 = sahteFirebase({ user: null });
  s2.f.a.sendEmailVerification = async () => { throw hata('auth/too-many-requests'); };
  const r2 = await m.kayitOl(s2.f, { eposta: 'b@example.test', sifre: 'x', dil: 'tr', depo: new BellekDepo() });
  assert.equal(r2.ok, true);
  assert.equal(r2.dogrulamaGitti, false);
  const s3 = sahteFirebase({ user: null });
  s3.f.a.createUserWithEmailAndPassword = async () => { throw hata('auth/email-already-in-use'); };
  assert.deepEqual(await m.kayitOl(s3.f, { eposta: 'c@example.test', sifre: 'x', dil: 'tr', depo: new BellekDepo() }), { ok: false, neden: 'eposta-kullanimda' });
});

test('giriş ve yetkiler: rol/ref token yetkisinden; çevrim dışında c_ önekli uid yine çocuk', async () => {
  const { f } = sahteFirebase({ user: null });
  const depo = new BellekDepo();
  const s = await m.girisYap(f, { eposta: ' a@example.test', sifre: 'x', depo });
  assert.equal(s.ok, true);
  assert.equal(s.kullanici.rol, '');
  assert.equal(m.oturumOzeti(depo), await m.uidOzeti('u-sifre'));
  const yetiskin = kullanici('u-bagli', { claims: { ref: 'UC-2026-0022' } });
  assert.deepEqual(await m.kullaniciBilgisi(yetiskin), { uid: 'u-bagli', eposta: 'deneme@example.test', dogrulanmis: true, rol: '', ref: 'UC-2026-0022', saglayicilar: ['password'] });
  const cocuk = kullanici('c_abc', { claims: {}, email: null, saglayicilar: [] });
  cocuk.getIdTokenResult = async () => { throw hata('auth/network-request-failed'); };
  assert.equal((await m.kullaniciBilgisi(cocuk)).rol, 'cocuk');
  const f2 = sahteFirebase({ user: null }).f;
  f2.a.signInWithEmailAndPassword = async () => { throw hata('auth/invalid-credential'); };
  assert.deepEqual(await m.girisYap(f2, { eposta: 'a@example.test', sifre: 'y', depo: new BellekDepo() }), { ok: false, neden: 'giris-yanlis' });
});

test('Google: açılır pencere; engellenirse yönlendirme; kapatılırsa iptal', async () => {
  const { f, k } = sahteFirebase({ user: null });
  const s = await m.googleIleGir(f, { dil: 'nl', depo: new BellekDepo() });
  assert.equal(s.ok && s.kullanici.uid, 'u-google');
  assert.deepEqual(k.auth[0], ['popup', { prompt: 'select_account' }]);
  assert.equal(f.auth.languageCode, 'nl');
  const s2 = sahteFirebase({ user: null });
  s2.f.a.signInWithPopup = async () => { throw hata('auth/popup-blocked'); };
  assert.deepEqual(await m.googleIleGir(s2.f, { dil: 'tr', depo: new BellekDepo() }), { ok: true, yonlendirme: true });
  assert.deepEqual(s2.k.auth, [['yonlendir', { prompt: 'select_account' }]]);
  const s3 = sahteFirebase({ user: null });
  s3.f.a.signInWithPopup = async () => { throw hata('auth/popup-closed-by-user'); };
  assert.deepEqual(await m.googleIleGir(s3.f, { dil: 'tr', depo: new BellekDepo() }), { ok: false, neden: 'iptal' });
  assert.equal(s3.k.auth.length, 0, 'iptalde yönlendirmeye geçilmez');
  // Yönlendirme dönüşü: sonuç varsa işaret konur; yoksa null.
  const s4 = sahteFirebase({ user: null });
  assert.equal(await m.yonlendirmeSonucu(s4.f, { depo: new BellekDepo() }), null);
  s4.f.a.getRedirectResult = async () => ({ user: kullanici('u-donus') });
  const depo = new BellekDepo();
  assert.equal((await m.yonlendirmeSonucu(s4.f, { depo })).kullanici.uid, 'u-donus');
  assert.equal(m.oturumOzeti(depo), await m.uidOzeti('u-donus'));
});

test('şifre sıfırlama ve doğrulamayı yeniden gönderme sayfanın dilinde', async () => {
  const { f, k } = sahteFirebase();
  assert.deepEqual(await m.sifreSifirla(f, { eposta: ' a@example.test ', dil: 'de' }), { ok: true });
  assert.deepEqual(k.auth.at(-1), ['sifirla', 'a@example.test', undefined, 'de']);
  assert.deepEqual(await m.dogrulamaGonder(f, { dil: 'en', donus: 'https://egitim.ulucamii.be/en/hesap/' }), { ok: true });
  assert.deepEqual(k.auth.at(-1), ['dogrulama', 'u-deneme-1', { url: 'https://egitim.ulucamii.be/en/hesap/' }, 'en']);
  f.auth.currentUser = null;
  assert.deepEqual(await m.dogrulamaGonder(f, { dil: 'en' }), { ok: false, neden: 'oturum-yok' });
});

const kayitli = (maddeler) => JSON.stringify({ v: 1, ar: 1, maddeler, gunler: [] });

test('çıkış: önce eşitler, sonra kullanıcının kopyası ve işaret silinir; anonim kayıt kalır', async () => {
  const anonim = kayitli({});
  const depo = new BellekDepo({ [m.ANAHTAR]: anonim, [KULLANICI]: kayitli({ 's-fatiha': { ...m.varsayilanAyar(), son: 1 } }), [m.OTURUM_ANAHTARI]: OZET });
  const { f, k, bulut } = sahteFirebase();
  assert.deepEqual(await m.cikisYap(f, { depo, cevrimici: () => true }), { ok: true });
  assert.ok(bulut.get('kullanicilar/u-deneme-1/calisma/ezber').maddeler['s-fatiha'], 'son çalışma buluta gitti');
  assert.equal(depo.getItem(KULLANICI), null);
  assert.equal(depo.getItem(m.OTURUM_ANAHTARI), null);
  assert.equal(depo.getItem(m.ANAHTAR), anonim);
  assert.deepEqual(k.auth.at(-1), ['cikis']);
});

test('çıkış: eşitlenemezse sormadan silmez; zorla çıkışta siler', async () => {
  const kopya = kayitli({ 's-fatiha': { ...m.varsayilanAyar(), son: 1 } });
  const depo = new BellekDepo({ [KULLANICI]: kopya, [m.OTURUM_ANAHTARI]: OZET });
  const { f, k } = sahteFirebase();
  assert.deepEqual(await m.cikisYap(f, { depo, cevrimici: () => false }), { ok: false, neden: 'esitlenmedi' });
  assert.equal(depo.getItem(KULLANICI), kopya);
  assert.equal(m.oturumOzeti(depo), OZET);
  assert.equal(k.auth.length, 0, 'oturum açık kaldı');
  assert.deepEqual(await m.cikisYap(f, { depo, zorla: true }), { ok: true });
  assert.equal(depo.getItem(KULLANICI), null);
  assert.equal(depo.getItem(m.OTURUM_ANAHTARI), null);
  assert.deepEqual(k.auth, [['cikis']]);
});

test('oturum kendiliğinden düşerse yalnız işaret kalkar, cihaz kopyası korunur; saklı oturum işareti yeniden koyar', async () => {
  const kopya = kayitli({});
  const depo = new BellekDepo({ [KULLANICI]: kopya, [m.OTURUM_ANAHTARI]: OZET });
  const { f, k } = sahteFirebase({ user: null });
  assert.equal(await m.oturumHazir(f, { depo }), null);
  assert.equal(depo.getItem(m.OTURUM_ANAHTARI), null);
  assert.equal(depo.getItem(KULLANICI), kopya);
  f.auth.currentUser = kullanici('u-deneme-1');
  assert.equal((await m.oturumHazir(f, { depo })).uid, 'u-deneme-1');
  assert.equal(m.oturumOzeti(depo), OZET);
  // Başka sekmede çıkış: dinleyici null görür → işaret kalkar.
  const goruler = [];
  const durdur = m.oturumIzle(f, (x) => goruler.push(x), { depo });
  k.dinleyici(null);
  for (let i = 0; i < 10 && !goruler.length; i++) await new Promise((r) => setImmediate(r));
  assert.deepEqual(goruler, [null]);
  assert.equal(depo.getItem(m.OTURUM_ANAHTARI), null);
  durdur();
  assert.equal(k.dinleyici, null);
});
