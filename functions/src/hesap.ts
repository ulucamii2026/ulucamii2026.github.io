/**
 * Hesap: kullanıcı adı, hesap silme (30 gün bekletme) ve hareketsiz hesap taraması. docs/ILIM-YOLU.md «Ortak kararlar» 3,
 * Dilim 1 «Fonksiyonlar». Çocuk hesapları bu yollara girmez: adını hoca açar, silinmesi kurs kaydına bağlıdır (portalSilme).
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { gecerliMi } from '../../src/lib/ilim-yolu/kullanici-adi';
import { ayrilmisMi } from './ayrilmis';
import { db, auth, FieldValue, Timestamp, CAGRI, GUN, yetiskinGerekli, iso, kullaniciYok } from './ortak';

const AD_ARALIGI = 30 * GUN; // ad değişikliği en çok 30 günde bir; bırakılan ad 30 gün eski sahibine ayrılı kalır
const SILME_BEKLEME = 30 * GUN;

/**
 * kullaniciAdlari/{ad} bu uid'ye verilebilir mi: belge yok; ya da zaten bu uid'nin (kendi adı ya da kendi bıraktığı ad); ya da
 * başkasının bıraktığı adın 30 günü dolmuş.
 */
export function adMusait(snap: DocumentSnapshot, uid: string, simdi: number): boolean {
  if (!snap.exists) return true;
  if (snap.get('uid') === uid) return true;
  const bitis = snap.get('bitis');
  return Boolean(snap.get('birakildi')) && bitis instanceof Timestamp && bitis.toMillis() <= simdi;
}

export const kullaniciAdiAl = onCall(CAGRI, async (istek) => {
  const { uid } = yetiskinGerekli(istek);
  const sonuc = gecerliMi(String((istek.data as { ad?: unknown } | null)?.ad ?? ''));
  if (!sonuc.ok) throw new HttpsError('invalid-argument', 'gecersiz-ad', { neden: sonuc.neden });
  const yeni = sonuc.ad;
  if (ayrilmisMi(yeni)) throw new HttpsError('invalid-argument', 'gecersiz-ad', { neden: 'ayrilmis' });

  await db.runTransaction(async (tx) => {
    const simdi = Date.now();
    const profilRef = db.doc(`kullanicilar/${uid}`);
    const yeniRef = db.doc(`kullaniciAdlari/${yeni}`);
    const [profil, yeniSnap] = await tx.getAll(profilRef, yeniRef);
    const eski = profil.get('ad') as string | undefined;
    if (eski === yeni) return;
    const eskiRef = eski ? db.doc(`kullaniciAdlari/${eski}`) : undefined;
    const eskiSnap = eskiRef ? await tx.get(eskiRef) : undefined;
    if (eski) {
      const degisti = profil.get('adDegisti');
      if (degisti instanceof Timestamp && degisti.toMillis() + AD_ARALIGI > simdi) {
        throw new HttpsError('resource-exhausted', 'ad-degisikligi-sinirli', { sonraki: new Date(degisti.toMillis() + AD_ARALIGI).toISOString() });
      }
    }
    if (!adMusait(yeniSnap, uid, simdi)) throw new HttpsError('already-exists', 'ad-alinmis');
    tx.set(yeniRef, { uid, zaman: FieldValue.serverTimestamp() });
    // Eski ad 30 gün yalnız bu uid'ye ayrılı kalır (yanlışlıkla değiştirene geri dönüş; taklide karşı).
    if (eskiRef && eskiSnap?.get('uid') === uid) {
      tx.set(eskiRef, { uid, birakildi: Timestamp.fromMillis(simdi), bitis: Timestamp.fromMillis(simdi + AD_ARALIGI) });
    }
    tx.set(profilRef, {
      ad: yeni,
      sonGiris: FieldValue.serverTimestamp(),
      ...(eski ? { adDegisti: FieldValue.serverTimestamp() } : {}),
      ...(profil.get('tur') ? {} : { tur: 'genel' }),
      ...(profil.get('olusturma') ? {} : { olusturma: FieldValue.serverTimestamp() }),
    }, { merge: true });
  });
  return { ad: yeni };
});

export const hesabimiSil = onCall(CAGRI, async (istek) => {
  const { uid } = yetiskinGerekli(istek);
  const silinecek = Timestamp.fromMillis(Date.now() + SILME_BEKLEME);
  await db.doc(`kullanicilar/${uid}`).set({ silinecek }, { merge: true });
  return { silinecek: silinecek.toDate().toISOString() };
});

export const hesapSilmeIptal = onCall(CAGRI, async (istek) => {
  const { uid } = yetiskinGerekli(istek);
  const ref = db.doc(`kullanicilar/${uid}`);
  if ((await ref.get()).get('silinecek')) await ref.update({ silinecek: FieldValue.delete() });
  return { ok: true };
});

/**
 * Bir yetişkin hesabını bütünüyle siler: Auth kullanıcısı (önce: yeni giriş olmasın), kullanicilar/{uid} ve alt koleksiyonları,
 * uid'nin bütün kullaniciAdlari kayıtları (bırakılmış adlar dahil), paylasimlar/{uid}, bekleyen e-postaları ve kurs bağı.
 * Yarıda kalırsa bir sonraki tarama kaldığı yerden sürdürür (kullanicilar belgesi en son silinir).
 */
export async function hesabiTamamenSil(uid: string): Promise<void> {
  try { await auth.deleteUser(uid); } catch (e) { if (!kullaniciYok(e)) throw e; }
  const profil = await db.doc(`kullanicilar/${uid}`).get();
  const ref = profil.get('ref');
  if (typeof ref === 'string' && ref) {
    const ohRef = db.doc(`ogrenciHesaplari/${ref}`);
    await db.runTransaction(async (tx) => {
      const oh = await tx.get(ohRef);
      if (oh.get('yetiskinUid') === uid) tx.update(ohRef, { yetiskinUid: FieldValue.delete(), yetiskinAd: FieldValue.delete() });
    });
  }
  const [adlar, kuyruk] = await Promise.all([
    db.collection('kullaniciAdlari').where('uid', '==', uid).get(),
    db.collection('epostaKuyrugu').where('uid', '==', uid).get(),
  ]);
  const yigin = db.batch();
  for (const d of [...adlar.docs, ...kuyruk.docs]) yigin.delete(d.ref);
  yigin.delete(db.doc(`paylasimlar/${uid}`));
  await yigin.commit();
  await db.recursiveDelete(db.doc(`kullanicilar/${uid}`));
}

// Her gün 03:00 (Brüksel): silme tarihi gelen hesaplar. Çocuk hesabı atlanır (hoca/portalSilme yolu).
export const silmeTara = onSchedule({ schedule: '0 3 * * *', timeZone: 'Europe/Brussels' }, async () => {
  const gelen = await db.collection('kullanicilar').where('silinecek', '<=', Timestamp.now()).limit(200).get();
  let silinen = 0;
  let atlanan = 0;
  for (const d of gelen.docs) {
    if (d.get('tur') === 'cocuk') { atlanan++; continue; }
    await hesabiTamamenSil(d.id);
    silinen++;
  }
  logger.info('silmeTara', { silinen, atlanan });
});

/**
 * Her ayın 1'i 04:00 (Brüksel): 24 aydır girmeyen hesaba uyarı (epostaKuyrugu; gönderen Dilim 2'de), uyarıdan 30 gün sonra hâlâ
 * girmemişse silme. VARSAYILAN KURU ÇALIŞMA: yalnız sayılar günlüğe yazılır; ILIM_SIL_GERCEK=1 olmadan hiçbir şey değişmez.
 */
export const hareketsizTara = onSchedule({ schedule: '0 4 1 * *', timeZone: 'Europe/Brussels' }, async () => {
  const gercek = process.env.ILIM_SIL_GERCEK === '1';
  const simdi = new Date();
  const sinir = new Date(simdi);
  sinir.setUTCMonth(sinir.getUTCMonth() - 24);
  const sayac = { uyarilacak: 0, silinecek: 0, geriDonen: 0, atlanan: 0 };

  const eskiler = await db.collection('kullanicilar').where('sonGiris', '<', Timestamp.fromDate(sinir)).limit(500).get();
  const yigin = db.batch();
  for (const d of eskiler.docs) {
    if (d.get('tur') === 'cocuk' || d.get('silinecek') || d.get('hareketsizUyari')) { sayac.atlanan++; continue; }
    sayac.uyarilacak++;
    if (!gercek) continue;
    yigin.set(d.ref, { hareketsizUyari: FieldValue.serverTimestamp() }, { merge: true });
    yigin.set(db.collection('epostaKuyrugu').doc(), { tur: 'hareketsiz', uid: d.id, dil: d.get('dil') ?? 'tr', zaman: FieldValue.serverTimestamp() });
  }
  if (gercek) await yigin.commit();

  const uyarilanlar = await db.collection('kullanicilar')
    .where('hareketsizUyari', '<=', Timestamp.fromMillis(simdi.getTime() - 30 * GUN)).limit(200).get();
  for (const d of uyarilanlar.docs) {
    const son = d.get('sonGiris');
    const uyari = d.get('hareketsizUyari') as Timestamp;
    if (son instanceof Timestamp && son.toMillis() > uyari.toMillis()) {
      sayac.geriDonen++;
      if (gercek) await d.ref.update({ hareketsizUyari: FieldValue.delete() });
    } else if (d.get('tur') !== 'cocuk') {
      sayac.silinecek++;
      if (gercek) await hesabiTamamenSil(d.id);
    }
  }
  logger.info('hareketsizTara', { kuru: !gercek, sinir: iso(Timestamp.fromDate(sinir)), ...sayac });
});
