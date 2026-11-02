/**
 * İlim Yolu — cihazdaki ezber çalışmasının hesapla eşitlenmesi (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Cihazdaki ilerlemenin
 * hesaba taşınması»).
 *
 * Kaynak her zaman cihazdır: sayfalar ilerlemeyi `cihaz.ts` ile `etkinAnahtar()`a (girişliyken kullanıcının anahtarı
 * `ulucamii:ezber:cihaz:v1:u:<uid özeti>`) yazar; bu modül o kopyayı `kullanicilar/{uid}/calisma/ezber` ile birleştirir
 * (`birlestir`: madde başına yeni `son` kazanır, günler birleşir, 120 madde sınırı). Okuma–birleştirme–yazma TEK işlemde
 * (Firestore lite transaction): iki cihaz aynı anda eşitlerse biri yeniden dener, kimsenin çalışması ezilmez. Buluta yalnız
 * kuralın izin verdiği alanlar gider (`v, ar, maddeler, gunler, guncelleme`; `guncelleme` = sunucu zamanı). Değişiklik yoksa
 * yazılmaz. Çevrim dışıysa hiçbir şey kaybolmaz: cihaz kopyası yerinde kalır, bir sonraki eşitleme gönderir.
 *
 * Anonim çalışma (`ANAHTAR`) kendiliğinden hesaba geçmez: girişten sonra `giristeEsitle` «Bu cihazdaki N madde hesabınıza
 * eklensin mi?» kararını döndürür (soruyu sayfa sorar). «Evet»te anonim kayıt kullanıcının kopyasına katılır ve ancak bu kopya
 * yazıldıktan sonra silinir; «Hayır»da anonim kayıt olduğu gibi kalır (çıkış yapınca yine görünür).
 */
import { ANAHTAR, birlestir, bos, kullaniciAnahtari, oku, temizle, yaz, type CihazDurumu, type Depo } from '@ortak/lib/ezber/cihaz';
import type { IlimFirebase } from '../firebase-istemci';
import { isaretKoy, tarayiciDeposu, uidOzeti } from './isaret';

/** `kullanicilar/{uid}/calisma/{ad}` — Dilim 1'de yalnız ezber. */
export const CALISMA_BELGESI = 'ezber';
/** `visibilitychange` sonrası bekleme (art arda sekme değiştirmede tek eşitleme). */
export const ESITLEME_BEKLEMESI = 1500;

export type EsitlemeSonucu =
  | { readonly durum: 'tamam'; readonly yazildi: boolean; readonly madde: number }
  | { readonly durum: 'oturum-yok' }
  | { readonly durum: 'cevrimdisi' }
  | { readonly durum: 'hata'; readonly kod: string };

export type GirisKarari =
  | { readonly tur: 'tamam'; readonly sonuc: EsitlemeSonucu }
  /** Sayfa sorar: «Bu cihazdaki `n` madde hesabınıza eklensin mi?» ve cevabı `cevapla`ya verir. */
  | { readonly tur: 'sor'; readonly n: number; cevapla(ekle: boolean): Promise<EsitlemeSonucu> };

export interface EsitlemeSecenek {
  readonly depo?: Depo | null;
  /** Şimdiki an (ms); ileri saatli cihazın kaydı buna çekilir (`birlestir`). */
  readonly simdi?: number;
  /** Bağlantı var mı (varsayılan `navigator.onLine`). */
  readonly cevrimici?: () => boolean;
}

/** Buluta giden yük: YALNIZ kuralın izin verdiği alanlar (firebase/firestore.rules `calismaGecerli`). */
export function bulutYuku(d: CihazDurumu, guncelleme: unknown) {
  return {
    v: d.v,
    ar: d.ar,
    maddeler: Object.fromEntries(Object.entries(d.maddeler).map(([id, a]) => [id, { ...a }])),
    gunler: [...d.gunler],
    guncelleme,
  };
}

/** Karşılaştırma için sıra bağımsız biçim (Firestore harita alanlarının sırasını korumaz). */
const kanonik = (d: CihazDurumu) => JSON.stringify([d.v, d.ar, d.gunler, Object.keys(d.maddeler).sort().map((id) => [id, d.maddeler[id]])]);
const hataKodu = (e: unknown) => String((e as { code?: unknown } | null)?.code ?? '').replace(/^firestore\//, '');
const cevrimiciMi = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Anonim kayıttaki maddelerden hesaba gerçekten bir şey katacak olanların sayısı (çalışılmış ve hesaptakinden yeni ya da yok). */
export function eklenecekSayisi(anonim: CihazDurumu, hesap: CihazDurumu): number {
  return Object.entries(anonim.maddeler).filter(([id, a]) => a.son > 0 && !(hesap.maddeler[id]?.son >= a.son)).length;
}

/**
 * Girişli kullanıcının cihaz kopyasını bulutla birleştirir ve iki yere de yazar. Oturum yoksa ya da çevrim dışıysa hiçbir şey
 * yazılmaz (cihaz kopyası olduğu gibi kalır).
 */
export async function esitle(f: IlimFirebase, o: EsitlemeSecenek = {}): Promise<EsitlemeSonucu> {
  const u = f.auth.currentUser;
  if (!u) return { durum: 'oturum-yok' };
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const simdi = o.simdi ?? Date.now();
  const anahtar = kullaniciAnahtari(await uidOzeti(u.uid));
  if (!(o.cevrimici ?? cevrimiciMi)()) return { durum: 'cevrimdisi' };
  const ref = f.fs.doc(f.db, 'kullanicilar', u.uid, 'calisma', CALISMA_BELGESI);
  try {
    const { birlesik, yazildi } = await f.fs.runTransaction(f.db, async (tx) => {
      const snap = await tx.get(ref);
      const bulut = snap.exists() ? temizle(snap.data()) : null;
      const birlesik = birlestir(oku(depo, anahtar), bulut, simdi);
      const yazilacak = bulut ? kanonik(birlesik) !== kanonik(bulut) : Object.keys(birlesik.maddeler).length > 0 || birlesik.gunler.length > 0;
      if (yazilacak) tx.set(ref, bulutYuku(birlesik, f.fs.serverTimestamp()));
      return { birlesik, yazildi: yazilacak };
    });
    // İşlem sürerken sayfa yeni çalışma yazmış olabilir: cihazı bir daha okuyup birleştirerek yaz (yeni `son` kazanır).
    yaz(depo, birlestir(oku(depo, anahtar), birlesik, simdi), anahtar);
    return { durum: 'tamam', yazildi, madde: Object.keys(birlesik.maddeler).length };
  } catch (e) {
    const kod = hataKodu(e);
    return kod === 'unavailable' || kod === 'deadline-exceeded' ? { durum: 'cevrimdisi' } : { durum: 'hata', kod: kod || 'bilinmeyen' };
  }
}

/**
 * Gerçek bir girişten hemen sonra (form, Google, kart; oturumun sayfa açılışında geri gelmesi DEĞİL): oturum işaretini koyar,
 * bu cihazda anonim çalışma hesaba bir şey katacaksa kararı sayfaya bırakır, yoksa doğrudan eşitler.
 */
export async function giristeEsitle(f: IlimFirebase, o: EsitlemeSecenek = {}): Promise<GirisKarari> {
  const u = f.auth.currentUser;
  if (!u) return { tur: 'tamam', sonuc: { durum: 'oturum-yok' } };
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const simdi = o.simdi ?? Date.now();
  const ozet = await uidOzeti(u.uid);
  isaretKoy(depo, ozet);
  const anahtar = kullaniciAnahtari(ozet);
  const anonim = oku(depo, ANAHTAR);
  // Bu cihazda hesabın kopyası yoksa Arapça yazı boyutu tercihi anonim kayıttan gelir (giriş yapınca yazı boyutu değişmesin).
  let kopyaVar = false;
  try { kopyaVar = depo?.getItem(anahtar) != null; } catch { /* depo kapalı */ }
  if (!kopyaVar) yaz(depo, { ...bos(), ar: anonim.ar }, anahtar);
  const esitleO = { ...o, depo, simdi };
  if (!Object.keys(anonim.maddeler).length) return { tur: 'tamam', sonuc: await esitle(f, esitleO) };

  // Sayım için bulut okunur; okunamazsa (bağlantı) yalnız bu cihazdaki hesap kopyasıyla sayılır.
  let bulut: unknown = null;
  try {
    const s = await f.fs.getDoc(f.fs.doc(f.db, 'kullanicilar', u.uid, 'calisma', CALISMA_BELGESI));
    bulut = s.exists() ? s.data() : null;
  } catch { /* çevrim dışı: aşağıdaki eşitleme de sonra yeniden denenir */ }
  const n = eklenecekSayisi(anonim, birlestir(oku(depo, anahtar), bulut, simdi));
  if (!n) return { tur: 'tamam', sonuc: await esitle(f, esitleO) };
  return {
    tur: 'sor',
    n,
    async cevapla(ekle: boolean) {
      if (ekle) {
        const katildi = yaz(depo, birlestir(oku(depo, anahtar), oku(depo, ANAHTAR), simdi), anahtar);
        if (katildi) {
          try { depo?.removeItem?.(ANAHTAR); } catch { /* depo kapalı */ }
        }
      }
      return esitle(f, esitleO);
    },
  };
}

/**
 * Sekme gizlenince ve yeniden görününce (bekletmeli) eşitler; aynı anda tek eşitleme, arada gelen istek sonra bir kez daha
 * çalışır. Durdurmak için dönen işlevi çağırın (çıkışta).
 */
export function esitlemeyiBaslat(
  f: IlimFirebase,
  o: EsitlemeSecenek & {
    readonly belge?: Pick<Document, 'addEventListener' | 'removeEventListener'>;
    readonly bekleme?: number;
    readonly sonuc?: (s: EsitlemeSonucu) => void;
  } = {},
): () => void {
  const belge = o.belge ?? document;
  let zaman: ReturnType<typeof setTimeout> | undefined;
  let calisiyor = false;
  let yine = false;
  const calis = async (): Promise<void> => {
    if (calisiyor) { yine = true; return; }
    calisiyor = true;
    try {
      const s = await esitle(f, { depo: o.depo, cevrimici: o.cevrimici });
      o.sonuc?.(s);
    } finally {
      calisiyor = false;
    }
    if (yine) { yine = false; await calis(); }
  };
  const dinle = () => {
    clearTimeout(zaman);
    zaman = setTimeout(() => void calis(), o.bekleme ?? ESITLEME_BEKLEMESI);
  };
  belge.addEventListener('visibilitychange', dinle);
  return () => {
    clearTimeout(zaman);
    belge.removeEventListener('visibilitychange', dinle);
  };
}
