/**
 * Firebase istemcisi — veli portalı ve hoca ekranı (6 Eyl 2026).
 * Proje: ulucamii-portal (dernek hesabı ulucamii2026@gmail.com, Spark planı, Firestore europe-west1).
 * Bu değerler gizli DEĞİLDİR (tarayıcıya iner); güvenlik tümüyle firebase/firestore.rules'a dayanır.
 * Yalnız portal/hoca sayfalarında dinamik import ile yüklenir; diğer sayfalara Firebase kodu girmez.
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

export function firebaseUygulamasi(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(FIREBASE_YAPILANDIRMA);
}
