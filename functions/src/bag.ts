/**
 * Kurs bağı (Dilim 1): hoca tek kullanımlık bağlama kodu üretir, kursa kayıtlı yetişkin kendi İlim Yolu hesabını bu kodla
 * öğrenci kaydına (ref) bağlar → token'a `ref` yetkisi (istemci token'ı tazeler). Hoca listesi ve öğrenci kaydı silinince
 * (ogrenciler/{ref}) çocuk hesabının kapatılması, yetişkin bağının çözülmesi de burada.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { hesabiTamamenSil } from './hesap';
import * as logger from 'firebase-functions/logger';
import {
  db, auth, FieldValue, Timestamp, CAGRI, GUN, CROCKFORD, refAl, hocaGerekli, dogrulanmisGerekli, rastgeleDize, sha256, iso,
  kullaniciYok,
} from './ortak';

const KOD_SURESI = 14 * GUN;
const KOD = /^[0-9A-HJKMNP-TV-Z]{8}$/;
/** Elle yazılan kod: büyük harf, boşluk/tire atılır; Crockford okuması (I, L → 1; O → 0). */
const kodDuz = (k: unknown) => String(k ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');

export const bagKoduUret = onCall(CAGRI, async (istek) => {
  const hoca = await hocaGerekli(istek);
  const ref = refAl(istek.data);
  const [ogr, silme] = await db.getAll(db.doc(`ogrenciler/${ref}`), db.doc(`portalSilme/${ref}`));
  if (!ogr.exists) throw new HttpsError('not-found', 'ogrenci-yok');
  if (silme.exists) throw new HttpsError('failed-precondition', 'kayit-kapali');
  const kod = rastgeleDize(CROCKFORD, 8);
  const bitis = Timestamp.fromMillis(Date.now() + KOD_SURESI);
  // Kodun kendisi saklanmaz; belge kimliği SHA-256 özetidir.
  await db.doc(`bagKodlari/${sha256(kod)}`).create({ ref, bitis, kullanildi: false, uretenHoca: hoca });
  return { kod, bitis: bitis.toDate().toISOString() };
});

/** Yetişkinin kurs bağını çözer: token'dan `ref` yetkisi, profilden ref (tur → genel). Hesap yoksa sessiz geçer. */
export async function yetiskinBaginiCoz(uid: string): Promise<void> {
  try {
    const { ref: _ref, ...kalan } = (await auth.getUser(uid)).customClaims ?? {};
    await auth.setCustomUserClaims(uid, Object.keys(kalan).length ? kalan : null);
  } catch (e) { if (!kullaniciYok(e)) throw e; }
  const profil = db.doc(`kullanicilar/${uid}`);
  if ((await profil.get()).get('ref')) await profil.update({ ref: FieldValue.delete(), tur: 'genel' });
}

export const hesabiBagla = onCall(CAGRI, async (istek) => {
  const { uid } = dogrulanmisGerekli(istek);
  const kod = kodDuz((istek.data as { kod?: unknown } | null)?.kod);
  if (!KOD.test(kod)) throw new HttpsError('invalid-argument', 'gecersiz-kod', { neden: 'bicim' });
  const kodRef = db.doc(`bagKodlari/${sha256(kod)}`);
  const profilRef = db.doc(`kullanicilar/${uid}`);
  const { ref, onceki } = await db.runTransaction(async (tx) => {
    const k = await tx.get(kodRef);
    if (!k.exists) throw new HttpsError('not-found', 'gecersiz-kod', { neden: 'yok' });
    if (k.get('kullanildi')) throw new HttpsError('failed-precondition', 'gecersiz-kod', { neden: 'kullanildi' });
    const bitis = k.get('bitis');
    if (!(bitis instanceof Timestamp) || bitis.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'gecersiz-kod', { neden: 'suresi-doldu' });
    const ref = String(k.get('ref'));
    const ohRef = db.doc(`ogrenciHesaplari/${ref}`);
    const [oh, ogr, silme, profil] = await tx.getAll(ohRef, db.doc(`ogrenciler/${ref}`), db.doc(`portalSilme/${ref}`), profilRef);
    // Kod üretildikten sonra öğrenci silindiyse ya da idari işlem sürüyorsa bağ kurulmaz.
    if (!ogr.exists || silme.exists) throw new HttpsError('failed-precondition', 'gecersiz-kod', { neden: 'kapali' });
    const mevcut = profil.get('ref');
    if (mevcut && mevcut !== ref) throw new HttpsError('failed-precondition', 'baska-kayit', { neden: 'baska-kayit' });
    const zaman = FieldValue.serverTimestamp();
    tx.update(kodRef, { kullanildi: true, kullanan: uid, kullanimZamani: zaman });
    tx.set(profilRef, { ref, tur: 'kursYetiskin', ...(profil.get('olusturma') ? {} : { olusturma: zaman }) }, { merge: true });
    tx.set(ohRef, { yetiskinUid: uid, yetiskinAd: String(profil.get('ad') ?? ''), ...(oh.get('olusturma') ? {} : { olusturma: zaman }) }, { merge: true });
    const eski = oh.get('yetiskinUid');
    return { ref, onceki: typeof eski === 'string' && eski !== uid ? eski : '' };
  });
  const kullanici = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...kullanici.customClaims, ref });
  // Hoca aynı kayda yeni kod verdiyse (ör. yetişkin hesabını kaybetti) bağ yeni hesaba geçer; eskisinin yetkisi kalkar.
  if (onceki) await yetiskinBaginiCoz(onceki);
  return { ref };
});

export const ogrenciHesaplariListe = onCall(CAGRI, async (istek) => {
  await hocaGerekli(istek);
  const s = await db.collection('ogrenciHesaplari').get();
  return s.docs.map((d) => {
    const v = d.data();
    return {
      ref: d.id,
      ...(typeof v.kullaniciAdi === 'string' ? { kullaniciAdi: v.kullaniciAdi } : {}),
      cocuk: Boolean(v.cocukUid),
      ...(typeof v.kartSurum === 'number' ? { kartSurum: v.kartSurum } : {}),
      ...(typeof v.yetiskinAd === 'string' && v.yetiskinAd ? { yetiskinAd: v.yetiskinAd } : {}),
      olusturma: iso(v.olusturma) ?? null,
    };
  });
});

/*
 * Öğrenci kaydı silinince çocuk hesabı BÜTÜNÜYLE silinir (Auth, profil + çalışma, kullanıcı adı, gizli özetler; gizlilik
 * metni: «kurstan ayrılınca hesap kapanır, veriler silinir»), ogrenciHesaplari/{ref} kaldırılır (yeniden eklenen öğrenciye
 * yeni hesap açılabilsin), yetişkin bağı çözülür (yetişkinin hesabı kendisinindir, silinmez). Tetik ogrenciler/{ref} SİLİNMESİDİR: hoca ekranının «portal
 * kayıtlarını sil» işlemi (src/lib/portal-idare.ts, kapsam «tum») öğrenci profilini siler. portalSilme/{ref} yalnız o işlemin
 * KİLİDİDİR: «yalnız ev çalışmaları» silmede de açılır, iş bitince (ya da iptalde) kalkar; ona bağlansaydı kursa devam eden
 * çocuğun hesabı kapanırdı. Kilit sürerken hesap/kod işlemleri yine reddedilir. Tekrar tetiklenirse zararsız.
 */
export const portalSilmeTetik = onDocumentDeleted('ogrenciler/{ref}', async (olay) => {
  const ohRef = db.doc(`ogrenciHesaplari/${olay.params.ref}`);
  // Olay gecikmeli gelebilir: öğrenci bu arada yeniden eklendiyse (kayıt defteri aktarımı) hiçbir şey kapatılmaz.
  const [oh, ogr] = await db.getAll(ohRef, db.doc(`ogrenciler/${olay.params.ref}`));
  if (!oh.exists || ogr.exists) return;
  const cocukUid = oh.get('cocukUid');
  if (typeof cocukUid === 'string' && cocukUid) {
    await hesabiTamamenSil(cocukUid);
    await db.doc(`gizli/cocuk/hesaplar/${cocukUid}`).delete();
  }
  const yetiskinUid = oh.get('yetiskinUid');
  if (typeof yetiskinUid === 'string' && yetiskinUid) await yetiskinBaginiCoz(yetiskinUid);
  await ohRef.delete();
  logger.info('portalSilmeTetik', { cocuk: Boolean(cocukUid), yetiskin: Boolean(yetiskinUid) });
});
