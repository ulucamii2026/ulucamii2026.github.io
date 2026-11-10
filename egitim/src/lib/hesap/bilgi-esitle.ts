/**
 * İlim Yolu — bilgi kartları ilerlemesinin hesapla eşitlenmesi (Dilim 2, 10 Kasım 2026). `esitle.ts` ile aynı düzen, ayrı belge:
 * `kullanicilar/{uid}/calisma/bilgi`. Cihaz kopyası (`ulucamii:bilgi:cihaz:v1:u:<özet>`) bulutla bit düzeyinde VEYA ile birleşir
 * (src/lib/ilim-yolu/bilgi-ilerleme.ts: sıkıştırılmış kodlama, ≤ 5 anahtar); okuma–birleştirme–yazma tek işlemde. Değişiklik yoksa
 * yazılmaz; çevrim dışıysa cihaz kopyası kalır. Anonim kopya (`ANAHTAR`) kendiliğinden hesaba katılmaz: hesapsız yapılan çalışma
 * hesapsız kalır; girişten hemen sonra `bilgiGiristeEsitle` «Bu cihazdaki N işaret hesabınıza eklensin mi?» kararını sayfaya bırakır (Ezber'deki `giristeEsitle` gibi).
 */
import { ANAHTAR, ayniMi, birlestir, bulutYuku, CALISMA_BELGESI, eklenecekSayisi, kullaniciAnahtari, oku, temizle, yaz } from '@ortak/lib/ilim-yolu/bilgi-ilerleme';
import type { IlimFirebase } from '../firebase-istemci';
import type { EsitlemeSecenek, EsitlemeSonucu } from './esitle';
import { oturumOzeti, tarayiciDeposu, uidOzeti } from './isaret';

const hataKodu = (e: unknown) => String((e as { code?: unknown } | null)?.code ?? '').replace(/^firestore\//, '');
const cevrimiciMi = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Bu cihazda kartların okunup yazılacağı anahtar: girişliyse kullanıcının, değilse anonim. */
export function bilgiAnahtari(depo: Parameters<typeof oturumOzeti>[0]): string {
  const ozet = oturumOzeti(depo);
  return ozet ? kullaniciAnahtari(ozet) : ANAHTAR;
}

export async function bilgiEsitle(f: IlimFirebase, o: EsitlemeSecenek = {}): Promise<EsitlemeSonucu> {
  const u = f.auth.currentUser;
  if (!u) return { durum: 'oturum-yok' };
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const anahtar = kullaniciAnahtari(await uidOzeti(u.uid));
  if (!(o.cevrimici ?? cevrimiciMi)()) return { durum: 'cevrimdisi' };
  const ref = f.fs.doc(f.db, 'kullanicilar', u.uid, 'calisma', CALISMA_BELGESI);
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

export type BilgiGirisKarari =
  | { readonly tur: 'tamam'; readonly sonuc: EsitlemeSonucu }
  /** Sayfa sorar: «Bu cihazdaki `n` işaret hesabınıza eklensin mi?» ve cevabı `cevapla`ya verir. */
  | { readonly tur: 'sor'; readonly n: number; cevapla(ekle: boolean): Promise<EsitlemeSonucu> };

/**
 * Gerçek bir girişten hemen sonra (Ezber'in `giristeEsitle`ından SONRA çağrılır; o oturum işaretini koymuştur): bu cihazdaki anonim kart
 * işaretleri hesaba yeni bir şey katacaksa kararı sayfaya bırakır, yoksa doğrudan eşitler. «Evet»te anonim kopya bit düzeyinde VEYA ile
 * hesabın kopyasına katılır ve ancak o kopya yazıldıktan sonra silinir; «Hayır»da anonim kopya olduğu gibi kalır.
 */
export async function bilgiGiristeEsitle(f: IlimFirebase, o: EsitlemeSecenek = {}): Promise<BilgiGirisKarari> {
  const u = f.auth.currentUser;
  if (!u) return { tur: 'tamam', sonuc: { durum: 'oturum-yok' } };
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const anahtar = kullaniciAnahtari(await uidOzeti(u.uid));
  const anonim = oku(depo, ANAHTAR);
  if (!Object.keys(anonim.maddeler).length) return { tur: 'tamam', sonuc: await bilgiEsitle(f, o) };
  // Sayım için bulut okunur; okunamazsa (bağlantı) yalnız bu cihazdaki hesap kopyasıyla sayılır.
  let bulut: unknown = null;
  try {
    const s = await f.fs.getDoc(f.fs.doc(f.db, 'kullanicilar', u.uid, 'calisma', CALISMA_BELGESI));
    bulut = s.exists() ? s.data() : null;
  } catch { /* çevrim dışı: eşitleme sonra yeniden denenir */ }
  const n = eklenecekSayisi(anonim, birlestir(oku(depo, anahtar), bulut));
  if (!n) return { tur: 'tamam', sonuc: await bilgiEsitle(f, o) };
  return {
    tur: 'sor',
    n,
    async cevapla(ekle: boolean) {
      if (ekle && yaz(depo, birlestir(oku(depo, anahtar), oku(depo, ANAHTAR)), anahtar)) {
        try { depo?.removeItem?.(ANAHTAR); } catch { /* depo kapalı */ }
      }
      return bilgiEsitle(f, o);
    },
  };
}
