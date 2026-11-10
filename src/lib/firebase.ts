/**
 * Firebase istemcisi — veli portalı ve hoca ekranı (6 Eyl 2026).
 * Proje: ulucamii-portal (dernek hesabı ulucamii2026@gmail.com, Spark planı, Firestore europe-west1).
 * Bu değerler gizli DEĞİLDİR (tarayıcıya iner); güvenlik tümüyle firebase/firestore.rules'a dayanır.
 * Yalnız portal/hoca sayfalarında dinamik import ile yüklenir; diğer sayfalara Firebase kodu girmez.
 *
 * egitim.ulucamii.be derlemesi (egitim/astro.config.mjs → `PUBLIC_UYGULAMA='egitim'`): egitim'in Hosting CSP'si `frame-src 'self'` olduğundan
 * `ulucamii-portal.firebaseapp.com` giriş çerçevesi yüklenemez; bu yüzden egitim'de egitim alan adlı `ilim` uygulaması döner
 * (egitim/src/lib/firebase-istemci.ts ile aynı ad ve alan: tek oturum). Ana site (ulucamii.be) derlemesinde bayrak yoktur ve davranış aynen kalır.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

export const FIREBASE_YAPILANDIRMA = {
  apiKey: 'AIzaSyDQUXxjs_SovTuAx1hyfW9nhd7bDUdcXfk',
  authDomain: 'ulucamii-portal.firebaseapp.com',
  projectId: 'ulucamii-portal',
  storageBucket: 'ulucamii-portal.firebasestorage.app',
  messagingSenderId: '349745995690',
  appId: '1:349745995690:web:48c8028f45e5c5fe4155d3',
};

/** egitim derlemesindeki uygulama adı ve Auth alanı (egitim/src/lib/firebase-istemci.ts: UYGULAMA_ADI, AUTH_ALANI). */
export const EGITIM_UYGULAMA_ADI = 'ilim';
export const EGITIM_AUTH_ALANI = 'egitim.ulucamii.be';

export function firebaseUygulamasi(): FirebaseApp {
  if (import.meta.env.PUBLIC_UYGULAMA === 'egitim') {
    return getApps().find((x) => x.name === EGITIM_UYGULAMA_ADI) ?? initializeApp({ ...FIREBASE_YAPILANDIRMA, authDomain: EGITIM_AUTH_ALANI }, EGITIM_UYGULAMA_ADI);
  }
  return getApps().length ? getApp() : initializeApp(FIREBASE_YAPILANDIRMA);
}
