/**
 * Haftalık e-posta (Dilim 2; docs/ILIM-YOLU.md «Haftalık e-posta»). Burada yalnız KUYRUK yazılır; gönderim Apps Script'te
 * (scripts/apps-script/ilim-yolu-eposta.gs, 10 dakikada bir). Çocuk hesabı (e-postasız) hiç girmez.
 *  - haftalikKuyruk: saatlik, Brüksel saati; tercihi uyan kullanıcı için epostaKuyrugu/h_<uid>_<ISO hafta> (create → tekrar çalışma
 *    aynı belgeyi yazamaz; gönderilen belge de TTL'e (bitis, 7 gün) kadar kalır, bu yüzden aynı hafta ikinci kez kuyruğa girmez).
 *  - abonelikCik: HMAC imzalı tek tıkla çıkış (/api/abonelik-cik; List-Unsubscribe + List-Unsubscribe-Post).
 * Sır: ABONELIK_SIRRI (Functions secret; koda girmez).
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { db, auth, FieldValue, Timestamp, GUN, kullaniciYok } from './ortak';
import { tokenUret, tokenDogrula } from '../../src/lib/ilim-yolu/abonelik-imza';
import { abonelikSayfasi, dilSec, epostaDiliMi, kuyrukKimligi, ozetle, zamanUygunMu } from '../../src/lib/ilim-yolu/eposta';

const ABONELIK_SIRRI = defineSecret('ABONELIK_SIRRI');
/** E-postadaki bağlantıların kökü (kullanıcıya görünen adres; Hosting rewrite /api/abonelik-cik bu siteye bağlıdır). */
export const SITE = 'https://egitim.ulucamii.be';
const KUYRUK_OMRU = 7 * GUN;
const SAYFA = 300;
const ALREADY_EXISTS = 6;

type Tercih = { haftalik?: unknown; gun?: unknown; saat?: unknown };

export const haftalikKuyruk = onSchedule(
  { schedule: '0 * * * *', timeZone: 'Europe/Brussels', region: 'europe-west1', maxInstances: 2, timeoutSeconds: 300, secrets: [ABONELIK_SIRRI] },
  async (olay) => {
    // Referans an: zamanlayıcının planlı saati (geç başlasa da doğru saati sayar); yoksa şimdi.
    const planli = Date.parse(olay.scheduleTime);
    const simdi = Number.isFinite(planli) ? planli : Date.now();
    const sirr = ABONELIK_SIRRI.value();
    const sayac = { taranan: 0, yazilan: 0, tekrar: 0, atlanan: 0 };

    let son: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    for (;;) {
      let sorgu = db.collection('kullanicilar').where('tercihler.haftalik', '==', true).orderBy('__name__').limit(SAYFA);
      if (son) sorgu = sorgu.startAfter(son);
      const sayfa = await sorgu.get();
      if (sayfa.empty) break;
      for (const d of sayfa.docs) {
        sayac.taranan++;
        const uid = d.id;
        const tur = d.get('tur');
        const tercih = d.get('tercihler') as Tercih | undefined;
        // Çocuk hesabı (e-postasız), silinmek üzere olan hesap ve zamanı gelmemiş tercih atlanır.
        if (tur === 'cocuk' || uid.startsWith('c_') || d.get('silinecek') || tercih?.haftalik !== true || !zamanUygunMu(tercih, simdi)) { sayac.atlanan++; continue; }
        let kullanici;
        try { kullanici = await auth.getUser(uid); } catch (e) { if (kullaniciYok(e)) { sayac.atlanan++; continue; } throw e; }
        if (!kullanici.email || !kullanici.emailVerified) { sayac.atlanan++; continue; }

        const calisma = await db.collection(`kullanicilar/${uid}/calisma`).get();
        const belge = (ad: string) => calisma.docs.find((c) => c.id === ad)?.data();
        const ozet = ozetle({ ezber: belge('ezber'), bilgi: belge('bilgi'), yol: belge('yol') }, simdi);
        const dil = epostaDiliMi(d.get('dil')) ? d.get('dil') : 'tr';
        const ad = typeof d.get('ad') === 'string' ? d.get('ad') : '';
        try {
          await db.doc(`epostaKuyrugu/${kuyrukKimligi(uid, simdi)}`).create({
            tur: 'haftalik', uid, eposta: kullanici.email, dil, ad, ozet,
            baglanti: `${SITE}/${dil}/`,
            abonelik: `${SITE}/api/abonelik-cik?k=${tokenUret(uid, sirr, simdi)}`,
            durum: 'bekliyor', deneme: 0,
            zaman: FieldValue.serverTimestamp(), bitis: Timestamp.fromMillis(simdi + KUYRUK_OMRU),
          });
          sayac.yazilan++;
        } catch (e) {
          if ((e as { code?: number }).code !== ALREADY_EXISTS) throw e;
          sayac.tekrar++;
        }
      }
      son = sayfa.docs[sayfa.docs.length - 1];
      if (sayfa.size < SAYFA) break;
    }
    logger.info('haftalikKuyruk', sayac);
  },
);

/**
 * Abonelikten çıkış. YALNIZ POST (RFC 8058 `List-Unsubscribe=One-Click`; ya da onay sayfasının fetch'i) tercihler.haftalik = false
 * yapar. GET durum DEĞİŞTİRMEZ: posta tarayıcıları bağlantıları önceden açar; geçerli belirteçli GET onay sayfasına yönlenir
 * (SITE/<dil>/abonelik-cik/#<belirteç>; belirteç parça olarak gider, sunucu günlüğüne ve Referer'e girmez).
 * Yinelenen çağrı zararsızdır. Sayfa sıkı CSP ile uyumlu düz HTML'dir. Bilinmeyen/silinmiş hesap da «tamam» döner (hesap varlığı sızmaz).
 */
export const abonelikCik = onRequest({ cors: false, region: 'europe-west1', maxInstances: 2, secrets: [ABONELIK_SIRRI] }, async (istek, yanit) => {
  yanit.set({
    'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff',
    'Content-Type': 'text/html; charset=utf-8',
  });
  if (istek.method !== 'GET' && istek.method !== 'POST') { yanit.set('Allow', 'GET, POST').status(405).send(abonelikSayfasi('tr', 'gecersiz')); return; }
  const dilBaslik = dilSec(istek.get('accept-language'));
  const belirtec = typeof istek.query.k === 'string' ? istek.query.k : '';
  const k = tokenDogrula(belirtec, ABONELIK_SIRRI.value(), Date.now());
  if (!k.ok) { yanit.status(400).send(abonelikSayfasi(dilBaslik, 'gecersiz')); return; }
  if (istek.method === 'GET') { yanit.redirect(302, `${SITE}/${dilBaslik}/abonelik-cik/#${belirtec}`); return; }
  const ref = db.doc(`kullanicilar/${k.uid}`);
  const profil = await ref.get();
  if (profil.exists && profil.get('tercihler.haftalik') !== false) {
    try { await ref.update({ 'tercihler.haftalik': false }); } catch (e) { if ((e as { code?: number }).code !== 5) throw e; }
  }
  const dil = epostaDiliMi(profil.get('dil')) ? profil.get('dil') : dilBaslik;
  logger.info('abonelikCik', { var: profil.exists });
  yanit.status(200).send(abonelikSayfasi(dil, 'tamam'));
});
