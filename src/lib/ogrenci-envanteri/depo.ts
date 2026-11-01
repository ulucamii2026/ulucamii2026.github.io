/**
 * Online envanter — Firestore bağdaştırıcısı (1 Kasım 2026). Tam SDK (kalıcı yerel önbellek): dokunuş hemen ekrana
 * yansır, bağlantı gelince gönderilir. Her belge için bir `Oturum`: yerel kopya + birikmiş yama; yama en çok saniyede bir
 * tek toplu yazımla gider (`surum` her yazımda +1; kural eski ekranın yazımını reddeder → `ENVANTER_CAKISMA`).
 * Kurallar: firebase/firestore.rules «ogrenciEnvanteri», «ogrenciProgrami», «hocaGunSirasi».
 * Bağlantı sayfası (/neler-biliyorum/#k=…, 1 Kasım 2026 sabahı): aynı depo, yollar «envanterBaglanti/{k}/…» altında.
 */
import {
  collection, deleteField, doc, getDoc, getDocFromServer, onSnapshot, serverTimestamp, writeBatch, type Firestore,
} from 'firebase/firestore';
import {
  bosBelge, belgeKimligi, belgeOku, gunSirasiOku, programOku, type EnvanterBelgesi, type Grup, type GunSirasi, type Program,
} from './model';

export const ENVANTER_CAKISMA = 'ENVANTER_CAKISMA';
const YAZIM_ARALIGI_MS = 1000;
const kodu = (e: unknown) => (e as { code?: string } | null)?.code || '';

/** Koleksiyon yolları: hoca ekranı varsayılanı ya da bağlantı sayfasının «envanterBaglanti/{k}/…» yolları. */
export interface DepoYollari { envanter: string; gunSirasi: string; program: string }
export const HOCA_YOLLARI: DepoYollari = { envanter: 'ogrenciEnvanteri', gunSirasi: 'hocaGunSirasi', program: 'ogrenciProgrami' };

export interface DepoDurumu { hazir: boolean; hata: boolean; bekleyen: boolean; onbellekten: boolean }

type Yama = Record<string, unknown>;
const kopya = <T,>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export interface Oturum {
  /** Yerel (iyimser) kopya; ekran bunu çizer. */
  readonly belge: EnvanterBelgesi;
  /** Belgenin sunucuda/önbellekte kaydı var mı (yoksa ilk değişiklikte oluşturulur). */
  var(): boolean;
  /** Yol boyunca değeri yazar; `undefined` alanı siler. Ekran çizimini çağıran yapar. */
  ayarla(yol: string[], deger: unknown): void;
  /** Birikmiş yamayı hemen gönderir (kip değişimi, çıkış). */
  gonder(): void;
  bekliyor(): boolean;
  /** Yazım hatası (örn. çakışma) olduğunda çağrılır. */
  hataDinle(f: (e: Error) => void): void;
  kapat(): void;
}

export function envanterDeposu(db: Firestore, bugun: string, uid: () => string, yollar: DepoYollari = HOCA_YOLLARI) {
  const belgeler = new Map<string, EnvanterBelgesi>();
  const dinleyiciler = new Set<() => void>();
  const oturumlar = new Set<{ snapshot(): void; kapat(): void; bekliyor(): boolean; gonder(): void }>();
  let gunSirasi: GunSirasi | null = null;
  const durum: DepoDurumu = { hazir: false, hata: false, bekleyen: false, onbellekten: false };
  let birakmalar: (() => void)[] = [];
  const duyur = () => { for (const f of dinleyiciler) f(); };

  const abone = (f: () => void) => {
    dinleyiciler.add(f);
    return () => { dinleyiciler.delete(f); };
  };

  function baslat() {
    if (birakmalar.length) return;
    birakmalar.push(onSnapshot(collection(db, yollar.envanter), { includeMetadataChanges: true }, (s) => {
      belgeler.clear();
      for (const d of s.docs) {
        const b = belgeOku(d.id, d.data());
        if (b) belgeler.set(d.id, b);
      }
      durum.hazir = true; durum.hata = false;
      durum.bekleyen = s.metadata.hasPendingWrites; durum.onbellekten = s.metadata.fromCache;
      for (const o of oturumlar) o.snapshot();
      duyur();
    }, () => { durum.hata = true; duyur(); }));
    birakmalar.push(onSnapshot(doc(db, yollar.gunSirasi, bugun), (s) => {
      gunSirasi = s.exists() ? gunSirasiOku(s.data()) : null;
      duyur();
    }, () => { gunSirasi = null; duyur(); }));
  }

  /** Bir öğrenci + grup için belge oturumu; kayıt yoksa ilk değişiklikte `ref_bugun_grup` oluşturulur. */
  function oturumAc(ref: string, grup: Grup, mevcut?: EnvanterBelgesi): Oturum {
    if (!ref || ref.includes('/')) throw new Error('Öğrenci seçimi geçersiz.');
    const kimlik = mevcut?.id ?? belgeKimligi(ref, bugun, grup);
    let yerel: EnvanterBelgesi = mevcut ? kopya(mevcut) : bosBelge(ref, bugun, grup);
    let varMi = Boolean(mevcut);
    let yama: Yama = {};
    let kirli = false;
    let zamanlayici: ReturnType<typeof setTimeout> | undefined;
    let son = 0;
    let bekleyenSayi = 0;
    let hataF: ((e: Error) => void) | undefined;
    let kapali = false;
    const belgeRef = doc(db, yollar.envanter, kimlik);

    const yamaYaz = (yol: string[], deger: unknown) => {
      let k = yama;
      for (const p of yol.slice(0, -1)) k = (k[p] ??= {}) as Yama;
      k[yol[yol.length - 1]] = deger === undefined ? deleteField() : kopya(deger);
    };
    const yerelYaz = (yol: string[], deger: unknown) => {
      let k = yerel as unknown as Record<string, unknown>;
      for (const p of yol.slice(0, -1)) k = (k[p] ??= {}) as Record<string, unknown>;
      if (deger === undefined) delete k[yol[yol.length - 1]];
      else k[yol[yol.length - 1]] = kopya(deger);
    };

    const gonder = () => {
      if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = undefined; }
      if (!kirli) return;
      const veri: Yama = { ...yama };
      yama = {}; kirli = false;
      const surum = yerel.surum + 1;
      const toplu = writeBatch(db);
      const kimlikAlani: Yama = varMi ? {} : { ref, tarih: yerel.tarih, grup, kaynak: yerel.kaynak };
      toplu.set(belgeRef, { ...kimlikAlani, ...veri, durum: yerel.durum, surum, guncelleme: serverTimestamp(), kaydeden: uid() }, { merge: true });
      yerel.surum = surum; varMi = true; son = Date.now(); bekleyenSayi++;
      toplu.commit().then(() => { bekleyenSayi--; }, async (e) => {
        bekleyenSayi--;
        // Kural sürümü reddettiyse başka bir cihaz araya girmiştir: sunucudaki son hâl yüklenir, yama kaybolur.
        let cakisma = kodu(e) === 'permission-denied';
        try {
          const s = await getDocFromServer(belgeRef);
          const b = s.exists() ? belgeOku(s.id, s.data()) : null;
          if (b) { yerel = kopya(b); } else { cakisma = false; varMi = false; yerel.surum = 0; }
        } catch { /* çevrim dışı: yerel kopya kalır */ }
        hataF?.(new Error(cakisma ? ENVANTER_CAKISMA : (kodu(e) || (e as Error).message)));
      });
    };
    const planla = () => {
      if (zamanlayici || kapali) return;
      zamanlayici = setTimeout(() => { zamanlayici = undefined; gonder(); }, Math.max(250, YAZIM_ARALIGI_MS - (Date.now() - son)));
    };

    const o: Oturum & { snapshot(): void } = {
      get belge(): EnvanterBelgesi { return yerel; },
      var: () => varMi,
      ayarla(yol: string[], deger: unknown) {
        yerelYaz(yol, deger); yamaYaz(yol, deger);
        kirli = true; planla();
      },
      gonder,
      bekliyor: () => kirli || bekleyenSayi > 0,
      hataDinle(f: (e: Error) => void) { hataF = f; },
      snapshot() {
        const uzak = belgeler.get(kimlik);
        if (!uzak) return;
        varMi = true;
        // Yerelde gönderilmemiş yama varsa ona dokunma (iyimser kopya korunur); yoksa sunucudaki hâl geçerli.
        if (!kirli && uzak.surum >= yerel.surum) yerel = kopya(uzak);
      },
      kapat() { gonder(); kapali = true; oturumlar.delete(o); },
    };
    oturumlar.add(o);
    return o;
  }

  /** Günün sırasında bir adımı işaretler (kural yalnız `yapildi` alanına izin verir). */
  async function adimIsaretle(id: string, deger: boolean) {
    const toplu = writeBatch(db);
    toplu.set(doc(db, yollar.gunSirasi, bugun), { yapildi: { [id]: deger } }, { merge: true });
    if (gunSirasi) gunSirasi = { ...gunSirasi, yapildi: { ...gunSirasi.yapildi, [id]: deger } };
    duyur();
    await toplu.commit();
  }

  async function program(ref: string): Promise<Program | null> {
    const s = await getDoc(doc(db, yollar.program, ref));
    return s.exists() ? programOku(s.data()) : null;
  }

  return {
    abone, baslat, oturumAc, adimIsaretle, program,
    belgeler: () => belgeler,
    gunSirasi: () => gunSirasi,
    durum: () => durum,
    bekleyenVar: () => durum.bekleyen || [...oturumlar].some((o) => o.bekliyor()),
    hepsiniGonder: () => { for (const o of oturumlar) o.gonder(); },
    kapat() {
      for (const o of [...oturumlar]) o.kapat();
      for (const b of birakmalar) b();
      birakmalar = []; dinleyiciler.clear();
    },
  };
}
export type EnvanterDeposu = ReturnType<typeof envanterDeposu>;
