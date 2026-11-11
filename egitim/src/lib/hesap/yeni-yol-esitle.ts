/**
 * İlim Yolu — 12 haftalık yolun ilerlemesinin hesapla eşitlenmesi (11 Kasım 2026). `ibadet-esitle.ts` ile aynı düzen, ayrı ve DAHA KAPALI belge:
 * `kullanicilar/{uid}/ozel/yol12` (yalnız sahibi okur/yazar). Cihaz kopyası (`ilim:y12:v1:u:<özet>`) bulutla bit düzeyinde VEYA ile
 * birleşir (src/lib/ilim-yolu/yeni-yol-ilerleme.ts: en çok 12 anahtar); okuma–birleştirme–yazma tek işlemde. Değişiklik yoksa yazılmaz; çevrim
 * dışıysa cihaz kopyası kalır. Anonim kopya (`ANAHTAR`) kendiliğinden hesaba katılmaz: hesapsız yapılan çalışma hesapsız kalır.
 */
import type { Depo } from '@ortak/lib/ezber/cihaz';
import { ANAHTAR, ayniMi, eskiAnahtar, birlestir, BELGE, bulutYuku, durumAnahtari, durumOku, durumYaz, eklenecekSayisi, kullaniciAnahtari, oku, temizle, yaz } from '@ortak/lib/ilim-yolu/yeni-yol-ilerleme';
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
    // Cihazda «işaretlerimi sil» yapılıp hesaptaki belge silinememişse önce o silinir; birleştirilseydi bulut kopyası cihaza geri dönerdi.
    const dk = durumAnahtari(await uidOzeti(u.uid));
    const d0 = durumOku(depo, dk);
    if (d0.sil) {
      await f.fs.deleteDoc(ref);
      durumYaz(depo, dk, { ...d0, sil: undefined });
    }
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

export type YolTeklifi =
  | { readonly tur: 'yok' }
  /** Sayfa sorar: «Bu cihazdaki işaretleri hesabınıza ekleyelim mi?» (`n` = hesapta olmayan işaret sayısı) ve cevabı `cevapla`ya verir. */
  | { readonly tur: 'sor'; readonly n: number; cevapla(ekle: boolean): Promise<EsitlemeSonucu | null> };

/**
 * Girişli kullanıcı yolu açtığında: bu cihazın anonim işaretleri hesapta olmayan bir şey taşıyorsa BİR kez sorulur; sessiz yükleme yoktur
 * (ortak cihazda işaretler başkasına ait olabilir). «Evet»: anonim kopya VEYA ile hesabın cihaz kopyasına katılır, ancak o yazıldıktan sonra
 * anonim kopya silinir, sonra bulutla eşitlenir; hesaptaki hiçbir işaret silinmez. «Şimdi değil»: anonim kopya olduğu gibi kalır ve aynı
 * sayıda yeniden sorulmaz (`durum.s`). Bekleyen hesap silmesi varsa (`durum.sil`) bulut kopyası önce silinmeden sayım yapılmaz.
 */
export async function yolTeklif(f: IlimFirebase, o: EsitlemeSecenek = {}): Promise<YolTeklifi> {
  const u = f.auth.currentUser;
  if (!u) return { tur: 'yok' };
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const ozet = await uidOzeti(u.uid);
  const anahtar = kullaniciAnahtari(ozet);
  const dk = durumAnahtari(ozet);
  const anonim = oku(depo, ANAHTAR);
  if (!Object.keys(anonim.maddeler).length) return { tur: 'yok' };
  let bulut: unknown = null;
  if (!durumOku(depo, dk).sil) {
    try {
      const s = await f.fs.getDoc(f.fs.doc(f.db, 'kullanicilar', u.uid, 'ozel', BELGE));
      bulut = s.exists() ? s.data() : null;
    } catch { /* çevrim dışı: yalnız cihazdaki hesap kopyasıyla sayılır */ }
  }
  const n = eklenecekSayisi(anonim, birlestir(oku(depo, anahtar), bulut));
  if (!n || n <= (durumOku(depo, dk).s ?? 0)) return { tur: 'yok' };
  return {
    tur: 'sor',
    n,
    async cevapla(ekle: boolean) {
      if (!ekle) { durumYaz(depo, dk, { ...durumOku(depo, dk), s: n }); return null; }
      if (!yaz(depo, birlestir(oku(depo, anahtar), oku(depo, ANAHTAR)), anahtar)) return { durum: 'hata', kod: 'depo' };
      try { depo?.removeItem?.(ANAHTAR); } catch { /* depo kapalı */ }
      durumYaz(depo, dk, { ...durumOku(depo, dk), s: undefined });
      return yolEsitle(f, o);
    },
  };
}

export type YolSilmeSonucu = { readonly bulut: 'yok' | 'silindi' | 'bekliyor' };

/**
 * «İşaretlerimi silin»: bu cihazdaki anonim kopya ve (girişliyse) hesabın cihaz kopyası silinir; girişliyse hesaptaki `ozel/yol12` de silinir.
 * Bulut silinemezse (çevrim dışı, hata, oturum düşmüş) `durum.sil` konur ve sonraki `yolEsitle` önce belgeyi siler: silinen işaret geri gelmez.
 * Cihaz kısmı her koşulda hemen yapılır.
 */
export async function yolSil(f: IlimFirebase | null, o: EsitlemeSecenek = {}): Promise<YolSilmeSonucu> {
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const ozet = oturumOzeti(depo) ?? (f?.auth.currentUser ? await uidOzeti(f.auth.currentUser.uid) : null);
  cihazdanSil(depo, ANAHTAR);
  if (!ozet) return { bulut: 'yok' };
  cihazdanSil(depo, kullaniciAnahtari(ozet));
  const dk = durumAnahtari(ozet);
  durumYaz(depo, dk, { sil: true });
  const u = f?.auth.currentUser;
  if (!f || !u || (await uidOzeti(u.uid)) !== ozet || !(o.cevrimici ?? cevrimiciMi)()) return { bulut: 'bekliyor' };
  try {
    await f.fs.deleteDoc(f.fs.doc(f.db, 'kullanicilar', u.uid, 'ozel', BELGE));
    durumYaz(depo, dk, {});
    return { bulut: 'silindi' };
  } catch {
    return { bulut: 'bekliyor' };
  }
}

/** Çıkışta: hesabın işaret kopyası cihazdan kalkar (`durum` anahtarı yalnız sayı/bayrak taşır, işaret taşımaz; kalır). */
export function yolCihazTemizle(depo: Depo | null | undefined, ozet: string): void {
  cihazdanSil(depo, kullaniciAnahtari(ozet));
}

/** Bir cihaz anahtarını ve ilk sürümdeki eski adını siler. */
function cihazdanSil(depo: Depo | null | undefined, anahtar: string): void {
  for (const a of [anahtar, eskiAnahtar(anahtar)]) {
    try { depo?.removeItem?.(a); } catch { /* depo kapalı */ }
  }
}
