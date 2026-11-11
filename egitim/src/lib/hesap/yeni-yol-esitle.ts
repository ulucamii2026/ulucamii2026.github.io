/**
 * İlim Yolu — 12 haftalık yolun ilerlemesinin hesapla eşitlenmesi (11 Kasım 2026). `ibadet-esitle.ts` ile aynı düzen, ayrı ve DAHA KAPALI belge:
 * `kullanicilar/{uid}/ozel/yol12` (yalnız sahibi okur/yazar). Cihaz kopyası (`ulucamii:yeniyol:cihaz:v1:u:<özet>`) bulutla bit düzeyinde VEYA ile
 * birleşir (src/lib/ilim-yolu/yeni-yol-ilerleme.ts: en çok 12 anahtar); okuma–birleştirme–yazma tek işlemde. Değişiklik yoksa yazılmaz; çevrim
 * dışıysa cihaz kopyası kalır. Anonim kopya (`ANAHTAR`) kendiliğinden hesaba katılmaz: hesapsız yapılan çalışma hesapsız kalır.
 */
import { ANAHTAR, ayniMi, birlestir, BELGE, bulutYuku, kullaniciAnahtari, oku, temizle, yaz } from '@ortak/lib/ilim-yolu/yeni-yol-ilerleme';
import type { IlimFirebase } from '../firebase-istemci';
import type { EsitlemeSecenek, EsitlemeSonucu } from './esitle';
import { oturumOzeti, tarayiciDeposu, uidOzeti } from './isaret';

const hataKodu = (e: unknown) => String((e as { code?: unknown } | null)?.code ?? '').replace(/^firestore\//, '');
const cevrimiciMi = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Bu cihazda ilerlemenin okunup yazılacağı anahtar: girişliyse kullanıcının, değilse anonim. */
export function yolAnahtari(depo: Parameters<typeof oturumOzeti>[0]): string {
  const ozet = oturumOzeti(depo);
  return ozet ? kullaniciAnahtari(ozet) : ANAHTAR;
}

export async function yolEsitle(f: IlimFirebase, o: EsitlemeSecenek = {}): Promise<EsitlemeSonucu> {
  const u = f.auth.currentUser;
  if (!u) return { durum: 'oturum-yok' };
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const anahtar = kullaniciAnahtari(await uidOzeti(u.uid));
  if (!(o.cevrimici ?? cevrimiciMi)()) return { durum: 'cevrimdisi' };
  const ref = f.fs.doc(f.db, 'kullanicilar', u.uid, 'ozel', BELGE);
  try {
    const { birlesik, yazildi } = await f.fs.runTransaction(f.db, async (tx) => {
      const snap = await tx.get(ref);
      const bulut = snap.exists() ? temizle(snap.data()) : null;
      const birlesik = birlestir(oku(depo, anahtar), bulut);
      const yazilacak = bulut ? !ayniMi(birlesik, bulut) : Object.keys(birlesik.maddeler).length > 0;
      if (yazilacak) tx.set(ref, bulutYuku(birlesik, f.fs.serverTimestamp()));
      return { birlesik, yazildi: yazilacak };
    });
    // İşlem sürerken sayfa yeni işaret yazmış olabilir: cihazı bir daha okuyup birleştirerek yaz (VEYA kaybettirmez).
    yaz(depo, birlestir(oku(depo, anahtar), birlesik), anahtar);
    return { durum: 'tamam', yazildi, madde: Object.values(birlesik.maddeler).reduce((n, d) => n + (d?.length ?? 0), 0) };
  } catch (e) {
    const kod = hataKodu(e);
    return kod === 'unavailable' || kod === 'deadline-exceeded' ? { durum: 'cevrimdisi' } : { durum: 'hata', kod: kod || 'bilinmeyen' };
  }
}
