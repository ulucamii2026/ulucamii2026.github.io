/**
 * Çocuk hesabı (Dilim 1; docs/ILIM-YOLU.md «Ortak kararlar» 4): e-postasız Auth kullanıcısı `c_<20 base32>`, yetki {rol:'cocuk', ref}.
 * Giriş iki yoldan: kullanıcı adı + şifre (/api/cocuk-giris) ya da basılı kart (/api/kart-giris); ikisi de custom token döner.
 * Gizli veri yalnız gizli/cocuk/hesaplar/{uid} (kurallar: istemciye kapalı): şifrenin scrypt özeti + tuzu, kart sırrının SHA-256
 * özeti, hata sayacı ve kilit. Düz şifre ve kart sırrı hiçbir yere yazılmaz, günlüğe girmez; yalnız hocaya bir kez döner.
 */
import { onCall, onRequest, HttpsError, type Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import * as logger from 'firebase-functions/logger';
import { createHash, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import { gecerliMi, oneri } from '../../src/lib/ilim-yolu/kullanici-adi';
import { ayrilmisMi } from './ayrilmis';
import { adMusait } from './hesap';
import { KELIMELER } from './kelimeler';
import {
  db, auth, FieldValue, Timestamp, CAGRI, KOKENLER, kokenIzinli, DAKIKA, SAAT, BASE32, dilMi, refAl, hocaGerekli,
  rastgeleDize, rastgeleB64, kullaniciYok,
} from './ortak';

const KART_KOK = 'https://egitim.ulucamii.be/k/#';
const HATA_SINIRI = 8; // kullanıcı adı başına; sonra 15 dk kilit
const KILIT_SURESI = 15 * DAKIKA;
const IP_SINIRI = 30; // IP başına saatte hatalı deneme
const GOVDE_SINIRI = 2048;
const gizliRef = (uid: string) => db.doc(`gizli/cocuk/hesaplar/${uid}`);

// ── Şifre ────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** «kedi-limon-42»: iki farklı kelime + iki rakam. Girişte büyük/küçük harf, boşluk ve tire önemsizdir (sifreDuz). */
export function sifreUret(): string {
  const a = randomInt(KELIMELER.length);
  let b = randomInt(KELIMELER.length - 1);
  if (b >= a) b++;
  return `${KELIMELER[a]}-${KELIMELER[b]}-${String(randomInt(100)).padStart(2, '0')}`;
}
const sifreDuz = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
function sifreOzeti(sifre: string, tuz: Buffer): Promise<Buffer> {
  return new Promise((coz, red) => scrypt(sifreDuz(sifre), tuz, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    (hata, ozet) => (hata ? red(hata) : coz(ozet))));
}
async function sifreAlanlari(sifre: string) {
  const tuz = randomBytes(16);
  return { sifreOzeti: (await sifreOzeti(sifre, tuz)).toString('base64'), tuz: tuz.toString('base64') };
}

// ── Kart ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// kartId: 72 bit (arama anahtarı), sır: 128 bit. Özet sürüme bağlıdır: yenilenen kartın eski sırrı yeni sürümle hiç tutmaz.
const kartOzeti = (surum: number, sir: string) => createHash('sha256').update(`${surum}.${sir}`).digest('hex');
function kartUret(surum: number) {
  const kartId = rastgeleB64(9);
  const sir = rastgeleB64(16);
  return { kartId, kartOzeti: kartOzeti(surum, sir), kartSurum: surum, kartUrl: `${KART_KOK}${kartId}.${sir}` };
}

// ── Kullanıcı adı önerisi ────────────────────────────────────────────────────────────────────────────────────────────
/** Öğrencinin ilk adından (ogrenciler/{ref}.ad'ın ilk kelimesi) taban: «Ayşe Nur» → «ayse». Kısa adın 0 dolgusu atılır. */
function adTabani(ad: unknown): string {
  const ilk = String(ad ?? '').trim().split(/\s+/)[0] ?? '';
  const taban = oneri(ilk).replace(/0+$/, '').slice(0, 21).replace(/[._-]+$/, '');
  const ornek = `${taban}00`;
  return taban && gecerliMi(ornek).ok && !ayrilmisMi(ornek) ? taban : 'ogrenci';
}
function adAdaylari(taban: string): string[] {
  const adaylar = new Set<string>();
  while (adaylar.size < 6) adaylar.add(taban + String(randomInt(100)).padStart(2, '0'));
  while (adaylar.size < 10) adaylar.add(taban + String(randomInt(100, 1000)));
  return [...adaylar];
}

// ── Hoca callable'ları ───────────────────────────────────────────────────────────────────────────────────────────────
export const cocukHesabiAc = onCall(CAGRI, async (istek) => {
  await hocaGerekli(istek);
  const ref = refAl(istek.data);
  const dilGirdi = (istek.data as { dil?: unknown }).dil;
  if (dilGirdi !== undefined && !dilMi(dilGirdi)) throw new HttpsError('invalid-argument', 'gecersiz-istek', { neden: 'dil' });
  const ogrRef = db.doc(`ogrenciler/${ref}`);
  const ohRef = db.doc(`ogrenciHesaplari/${ref}`);
  const silmeRef = db.doc(`portalSilme/${ref}`);
  const [ogr, oh, silme] = await db.getAll(ogrRef, ohRef, silmeRef);
  if (!ogr.exists) throw new HttpsError('not-found', 'ogrenci-yok');
  if (silme.exists) throw new HttpsError('failed-precondition', 'kayit-kapali');
  if (oh.get('cocukUid')) throw new HttpsError('already-exists', 'hesap-var');
  const dil = dilGirdi ?? (dilMi(ogr.get('dil')) ? ogr.get('dil') : 'tr');
  const taban = adTabani(ogr.get('ad'));

  const uid = `c_${rastgeleDize(BASE32, 20)}`;
  const sifre = sifreUret();
  const sifreler = await sifreAlanlari(sifre);
  const kart = kartUret(1);
  await auth.createUser({ uid });
  let kullaniciAdi: string;
  try {
    await auth.setCustomUserClaims(uid, { rol: 'cocuk', ref });
    kullaniciAdi = await db.runTransaction(async (tx) => {
      const simdi = Date.now();
      const adaylar = adAdaylari(taban);
      const [oh2, silme2, ...adlar] = await tx.getAll(ohRef, silmeRef, ...adaylar.map((a) => db.doc(`kullaniciAdlari/${a}`)));
      if (oh2.get('cocukUid')) throw new HttpsError('already-exists', 'hesap-var');
      if (silme2.exists) throw new HttpsError('failed-precondition', 'kayit-kapali');
      const sira = adlar.findIndex((s) => adMusait(s, uid, simdi));
      if (sira < 0) throw new HttpsError('aborted', 'ad-bulunamadi');
      const ad = adaylar[sira];
      const zaman = FieldValue.serverTimestamp();
      tx.set(db.doc(`kullaniciAdlari/${ad}`), { uid, zaman });
      tx.set(db.doc(`kullanicilar/${uid}`), { ad, tur: 'cocuk', ref, dil, olusturma: zaman });
      tx.set(gizliRef(uid), {
        kullaniciAdi: ad, ref, ...sifreler, kartId: kart.kartId, kartOzeti: kart.kartOzeti, kartSurum: kart.kartSurum, hatalar: 0,
      });
      tx.set(ohRef, { cocukUid: uid, kullaniciAdi: ad, kartSurum: kart.kartSurum, ...(oh2.get('olusturma') ? {} : { olusturma: zaman }) }, { merge: true });
      return ad;
    });
  } catch (e) {
    await auth.deleteUser(uid).catch(() => undefined); // yarım kalan Auth kullanıcısı bırakılmaz
    throw e;
  }
  logger.info('cocukHesabiAc', { uid });
  return { uid, kullaniciAdi, sifre, kartUrl: kart.kartUrl };
});

/** Öğrencinin çocuk hesabı (yoksa hata; öğrenci silinince portalSilmeTetik kaydı tümden siler). */
async function cocukUid(ref: string): Promise<string> {
  const oh = await db.doc(`ogrenciHesaplari/${ref}`).get();
  const uid = oh.get('cocukUid');
  if (typeof uid !== 'string' || !uid) throw new HttpsError('not-found', 'hesap-yok');
  return uid;
}

export const kartYenile = onCall(CAGRI, async (istek) => {
  await hocaGerekli(istek);
  const ref = refAl(istek.data);
  const uid = await cocukUid(ref);
  const kartUrl = await db.runTransaction(async (tx) => {
    const g = await tx.get(gizliRef(uid));
    if (!g.exists) throw new HttpsError('not-found', 'hesap-yok');
    const kart = kartUret((Number(g.get('kartSurum')) || 0) + 1);
    tx.update(gizliRef(uid), { kartId: kart.kartId, kartOzeti: kart.kartOzeti, kartSurum: kart.kartSurum });
    tx.set(db.doc(`ogrenciHesaplari/${ref}`), { kartSurum: kart.kartSurum }, { merge: true });
    return kart.kartUrl;
  });
  await auth.revokeRefreshTokens(uid); // eski kartla açılmış oturumlar da kapanır
  return { kartUrl };
});

export const cocukSifreYenile = onCall(CAGRI, async (istek) => {
  await hocaGerekli(istek);
  const uid = await cocukUid(refAl(istek.data));
  const sifre = sifreUret();
  await gizliRef(uid).update({ ...(await sifreAlanlari(sifre)), hatalar: 0, kilitBitis: FieldValue.delete() });
  return { sifre };
});

export const cocukOturumKapat = onCall(CAGRI, async (istek) => {
  await hocaGerekli(istek);
  await auth.revokeRefreshTokens(await cocukUid(refAl(istek.data)));
  return { ok: true };
});

// ── Giriş uçları (Hosting rewrite: /api/cocuk-giris, /api/kart-giris) ───────────────────────────────────────────────
type Govde = Record<string, unknown>;
const gonder = (yanit: Response, durum: number, govde: object) => { yanit.status(durum).json(govde); };

/** Yöntem, köken, içerik türü ve boyut kapısı. Geçerse JSON gövdesini döner; geçmezse yanıtı yazar ve null döner. */
function girisKapisi(istek: Request, yanit: Response): Govde | null {
  yanit.set('Cache-Control', 'no-store');
  if (istek.method !== 'POST') { yanit.set('Allow', 'POST'); gonder(yanit, 405, { hata: 'gecersiz' }); return null; }
  if (!kokenIzinli(istek.get('origin'))) { gonder(yanit, 403, { hata: 'gecersiz' }); return null; }
  if (!istek.is('application/json')) { gonder(yanit, 415, { hata: 'gecersiz' }); return null; }
  const boy = istek.rawBody?.length ?? Number(istek.get('content-length') ?? 0);
  if (boy > GOVDE_SINIRI) { gonder(yanit, 413, { hata: 'gecersiz' }); return null; }
  const govde = istek.body as unknown;
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) { gonder(yanit, 400, { hata: 'gecersiz' }); return null; }
  return govde as Govde;
}

// IP yalnız HMAC-SHA256(sunucu tuzu, IP) olarak saklanır; tuz gizli/ipTuzu'da (istemciye kapalı), ilk kullanımda üretilir.
let ipTuzu: Buffer | undefined;
async function ipAnahtari(istek: Request): Promise<string> {
  if (!ipTuzu) {
    const ref = db.doc('gizli/ipTuzu');
    let s = await ref.get();
    if (!s.exists) {
      await ref.create({ tuz: randomBytes(32).toString('base64') }).catch((e: { code?: number }) => { if (e.code !== 6) throw e; });
      s = await ref.get();
    }
    ipTuzu = Buffer.from(String(s.get('tuz')), 'base64');
  }
  // shortcut: X-Forwarded-For'un ilk değeri Hosting'den gelen istemci IP'sidir; işlevin run.app adresine doğrudan gelen biri bunu
  // taklit edebilir. Asıl koruma kullanıcı adı kilidi + 128 bitlik kart sırrı; canlıda başlıklar görülünce sağlamlaştırılır.
  const ip = istek.get('x-forwarded-for')?.split(',')[0]?.trim() || istek.ip || 'bilinmiyor';
  return createHmac('sha256', ipTuzu).update(ip).digest('hex');
}
const ipRef = (anahtar: string) => db.doc(`gizli/giris/ipler/${anahtar}`);
/** IP kilitliyse kilidin bitişi (ms). */
async function ipKilidi(anahtar: string): Promise<number | null> {
  const s = await ipRef(anahtar).get();
  const pencere = s.get('pencere');
  if (!(pencere instanceof Timestamp) || pencere.toMillis() + SAAT <= Date.now()) return null;
  return Number(s.get('sayi')) >= IP_SINIRI ? pencere.toMillis() + SAAT : null;
}
async function ipHatasi(anahtar: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const s = await tx.get(ipRef(anahtar));
    const simdi = Date.now();
    const pencere = s.get('pencere');
    const acik = pencere instanceof Timestamp && pencere.toMillis() + SAAT > simdi;
    const bas = acik ? pencere.toMillis() : simdi;
    // bitis: Firestore TTL ilkesi için (isteğe bağlı; yoksa belge yalnız bir sonraki pencerede sıfırlanır).
    tx.set(ipRef(anahtar), { sayi: (acik ? Number(s.get('sayi')) || 0 : 0) + 1, pencere: Timestamp.fromMillis(bas), bitis: Timestamp.fromMillis(bas + SAAT) });
  });
}

/** Doğrulanmış çocuğa custom token: hesap kapalıysa (portalSilme) null. Son giriş zamanı sunucuda yazılır. */
async function tokenVer(uid: string): Promise<string | null> {
  let kullanici;
  try { kullanici = await auth.getUser(uid); } catch (e) { if (kullaniciYok(e)) return null; throw e; }
  if (kullanici.disabled) return null;
  const token = await auth.createCustomToken(uid, { ...kullanici.customClaims }); // {rol:'cocuk', ref}
  await db.doc(`kullanicilar/${uid}`).set({ sonGiris: FieldValue.serverTimestamp() }, { merge: true });
  return token;
}

const kilitYaniti = (yanit: Response, bitis: number) => gonder(yanit, 429, { hata: 'kilit', bitis: new Date(bitis).toISOString() });

// Kullanıcı adı + şifre. scrypt her denetimde 16 MiB ister: varsayılan 80 eşzamanlı istek 256 MiB'lık örneği taşırırdı; 4 × 16 MiB
// + Node/Admin SDK tabanı sığar (2 örnekle saniyede onlarca giriş — kurs için bol).
export const cocukGiris = onRequest({ cors: KOKENLER, concurrency: 4 }, async (istek, yanit) => {
  const govde = girisKapisi(istek, yanit);
  if (!govde) return;
  const { kullaniciAdi, sifre } = govde;
  if (typeof kullaniciAdi !== 'string' || typeof sifre !== 'string' || kullaniciAdi.length > 64 || !sifre || sifre.length > 64) {
    gonder(yanit, 400, { hata: 'gecersiz' });
    return;
  }
  const ipA = await ipAnahtari(istek);
  const ipBitis = await ipKilidi(ipA);
  if (ipBitis) { kilitYaniti(yanit, ipBitis); return; }

  const ad = gecerliMi(kullaniciAdi);
  const adSnap = ad.ok ? await db.doc(`kullaniciAdlari/${ad.ad}`).get() : undefined;
  const uid = adSnap?.exists && !adSnap.get('birakildi') ? String(adSnap.get('uid')) : '';
  const g = uid.startsWith('c_') ? await gizliRef(uid).get() : undefined;
  if (!g?.exists) {
    await sifreOzeti(sifre, randomBytes(16)); // var olmayan adda da aynı süre: ad yoklaması yapılamasın
    await ipHatasi(ipA);
    gonder(yanit, 401, { hata: 'yanlis' });
    return;
  }
  const kilit = g.get('kilitBitis');
  if (kilit instanceof Timestamp && kilit.toMillis() > Date.now()) { kilitYaniti(yanit, kilit.toMillis()); return; }

  const beklenen = Buffer.from(String(g.get('sifreOzeti')), 'base64');
  const gelen = await sifreOzeti(sifre, Buffer.from(String(g.get('tuz')), 'base64'));
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) {
    const bitis = await db.runTransaction(async (tx) => {
      const s = await tx.get(gizliRef(uid));
      const hatalar = (Number(s.get('hatalar')) || 0) + 1;
      if (hatalar < HATA_SINIRI) { tx.update(gizliRef(uid), { hatalar }); return null; }
      const son = Date.now() + KILIT_SURESI;
      tx.update(gizliRef(uid), { hatalar: 0, kilitBitis: Timestamp.fromMillis(son) });
      return son;
    });
    await ipHatasi(ipA);
    if (bitis) kilitYaniti(yanit, bitis); else gonder(yanit, 401, { hata: 'yanlis' });
    return;
  }
  if (Number(g.get('hatalar')) || g.get('kilitBitis')) await gizliRef(uid).update({ hatalar: 0, kilitBitis: FieldValue.delete() });
  const token = await tokenVer(uid);
  if (!token) { gonder(yanit, 401, { hata: 'yanlis' }); return; }
  gonder(yanit, 200, { token });
});

const KART_ID = /^[A-Za-z0-9_-]{12}$/;
const KART_SIR = /^[A-Za-z0-9_-]{22}$/;
export const kartGiris = onRequest({ cors: KOKENLER }, async (istek, yanit) => {
  const govde = girisKapisi(istek, yanit);
  if (!govde) return;
  const { kartId, sir } = govde;
  if (typeof kartId !== 'string' || typeof sir !== 'string' || !KART_ID.test(kartId) || !KART_SIR.test(sir)) {
    gonder(yanit, 400, { hata: 'gecersiz' });
    return;
  }
  const ipA = await ipAnahtari(istek);
  const ipBitis = await ipKilidi(ipA);
  if (ipBitis) { kilitYaniti(yanit, ipBitis); return; }
  const bulunan = await db.collection('gizli/cocuk/hesaplar').where('kartId', '==', kartId).limit(1).get();
  const g = bulunan.docs[0];
  const beklenen = Buffer.from(g ? String(g.get('kartOzeti')) : '', 'hex');
  const gelen = Buffer.from(kartOzeti(Number(g?.get('kartSurum')) || 0, sir), 'hex');
  if (!g || beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) {
    await ipHatasi(ipA);
    gonder(yanit, 401, { hata: 'yanlis' });
    return;
  }
  const token = await tokenVer(g.id);
  if (!token) { gonder(yanit, 401, { hata: 'yanlis' }); return; }
  gonder(yanit, 200, { token });
});
