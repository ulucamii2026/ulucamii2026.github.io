/**
 * «Neler biliyorum?» bağlantı sayfası (/neler-biliyorum/#k=<anahtar>) — 1 Kasım 2026 sabahı.
 * Hoca girişi yok; anahtar adresin # kısmında. `envanterBaglanti/{anahtar}` belgesi öğrenci listesini (ref, ad, soyadın
 * baş harfi) ve son kullanma tarihini taşır; form belgeleri `…/kayitlar`, günün sırası `…/gunSirasi/{tarih}`, programlar
 * `…/program/{ref}` altındadır. Panel hoca ekranının Envanter paneliyle aynıdır; iki telefon aynı bağlantıyla farklı
 * öğrencilerde birlikte çalışabilir (aynı formda çakışmayı `surum` kuralı yakalar). Kayıtlar dersten sonra
 * scripts/envanter_baglanti.py (kurs projesi) ile ana `ogrenciEnvanteri` koleksiyonuna aktarılır.
 * «Ev kipi»: bağlantı belgesinde `kip: 'ev'`, `grup` ('5-8' | '9-13') ve `dil` ('tr' | 'fr') varsa bağlantı bir velinindir; panel hoca
 * arayüzü yerine tek öğrencilik veli formunu çizer (bkz. hoca-envanter.ts «ev kipi»). Geçersiz bir ev belgesi hoca arayüzüne
 * DÜŞMEZ, hata iletisi gösterir.
 */
import { doc, getDoc } from 'firebase/firestore';
import { firebaseUygulamasi } from '../lib/firebase';
import { tamFirestore } from '../lib/firebase-tam';
import type { EnvanterOgrencisi, EvKipi } from './hoca-envanter';

const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
const ANAHTAR_BICIMI = /^[A-Za-z0-9_-]{24,64}$/;

function mesaj(kok: HTMLElement, metin: string) {
  kok.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'not';
  p.setAttribute('role', 'alert');
  p.textContent = metin;
  kok.append(p);
}

export async function baglantiEnvanteri() {
  const kok = document.querySelector<HTMLElement>('[data-baglanti-envanter]');
  if (!kok) return;
  const anahtar = new URLSearchParams(location.hash.slice(1)).get('k') || '';
  if (!ANAHTAR_BICIMI.test(anahtar)) {
    mesaj(kok, 'Bu sayfa yalnız size verilen bağlantıyla açılır. Bağlantıyı eksiksiz açtığınızdan emin olun.');
    return;
  }
  const app = firebaseUygulamasi();
  const db = tamFirestore(app);
  let veri: Record<string, unknown> | undefined;
  try {
    const s = await getDoc(doc(db, 'envanterBaglanti', anahtar));
    veri = s.exists() ? s.data() : undefined;
  } catch {
    veri = undefined;
  }
  if (!veri) {
    mesaj(kok, 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeni bağlantıyı 1. hocadan isteyin.');
    return;
  }
  const ham = Array.isArray(veri.ogrenciler) ? veri.ogrenciler : [];
  const ogrenciler: EnvanterOgrencisi[] = ham
    .filter((o): o is { ref: string; ad?: string; soyad?: string } => !!o && typeof (o as { ref?: unknown }).ref === 'string')
    .map((o) => ({ ref: o.ref, ad: String(o.ad || ''), soyad: String(o.soyad || '') }));
  let ev: EvKipi | undefined;
  if (veri.kip === 'ev') {
    const o = ogrenciler[0];
    if (!o || (veri.grup !== '5-8' && veri.grup !== '9-13')) {
      mesaj(kok, 'Bu bağlantı geçersiz. Yeni bağlantıyı 1. hocadan isteyin.');
      return;
    }
    ev = { ref: o.ref, ad: o.ad, grup: veri.grup, dil: veri.dil === 'fr' ? 'fr' : 'tr' };
  }
  kok.innerHTML = '';
  const mod = await import('./hoca-envanter');
  const kok_ = `envanterBaglanti/${anahtar}`;
  const panel = mod.envanterPaneli(kok, {
    app,
    ogrenciler: () => ogrenciler,
    bugun: bugunISO(),
    uid: () => 'baglanti',
    yollar: { envanter: `${kok_}/kayitlar`, gunSirasi: `${kok_}/gunSirasi`, program: `${kok_}/program` },
    ev,
  });
  window.addEventListener('beforeunload', (e) => {
    if (!panel.ayrilabilir()) { e.preventDefault(); }
  });
}
