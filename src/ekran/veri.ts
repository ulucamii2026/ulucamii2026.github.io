/**
 * Ekranın üç akışı: /ekran/vakitler.json, akis.json, icerik.json. Hatalı ya da geçersiz bir yanıt son
 * sağlam veriyi SİLMEZ — deploy arızasında ya da internet kesildiğinde ekran boşalmaz.
 */
import type { EkranVakitleri } from '../lib/ekran/vakit-kapisi.ts';
import type { EkranDuyuru } from '../lib/ekran/akis.ts';
import type { EkranIcerik } from '../lib/ekran/icerik.ts';
import { sunucuSaatiCoz, type SlaytAyari } from '../lib/ekran/secim.ts';

export interface AkisGovdesi {
  derleme: string;
  /** turHedefSn A'dan önceki akışta yoktur (önbellekteki eski akış): main.ts → TUR_HEDEF_SN. */
  ayar: { slayt: SlaytAyari; gece: { kapanmaDk: number; acilmaDk: number }; duyuruVarsayilanGun: number; turHedefSn?: number };
  duyurular: EkranDuyuru[];
}
/** Önbellekteki eski icerik.json'da (A öncesi) `dualar` ve `esmalar` yoktur; ikisi isteğe bağlı okunur. */
export type IcerikGovdesi = Omit<EkranIcerik, 'dualar' | 'esmalar'> & Partial<Pick<EkranIcerik, 'dualar' | 'esmalar'>> & { derleme: string };
export interface EkranVerisi { vakit: EkranVakitleri | null; akis: AkisGovdesi | null; icerik: IcerikGovdesi | null }

const nesne = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

export function vakitGecerli(x: unknown): x is EkranVakitleri {
  return nesne(x) && x.kaynakTuru === 'diyanet' && x.ilce === '11890' && Array.isArray(x.gunler) && x.gunler.length > 0;
}
export function akisGecerli(x: unknown): x is AkisGovdesi {
  return nesne(x) && Array.isArray(x.duyurular) && nesne(x.ayar) && nesne(x.ayar.slayt);
}
/** `dualar` ve `esmalar` yoksa (eski akış) geçerli; varsa dizi olmalı: bozuk alan turu çökertmesin. */
const diziYaDaYok = (x: unknown): boolean => x === undefined || Array.isArray(x);
export function icerikGecerli(x: unknown): x is IcerikGovdesi {
  return nesne(x) && Array.isArray(x.ayetler) && Array.isArray(x.hadisler) && diziYaDaYok(x.dualar) && diziYaDaYok(x.esmalar);
}

/* Sunucu saati yüksek su işareti: ekranın gördüğü en yeni sunucu zamanı (HTTP Date). Cihaz saati bundan 10 dakikadan
   fazla geride kalırsa sayfa saate güvenmez (src/lib/ekran/secim.ts → saatGecerliMi). localStorage'da saklanır ki
   elektrik kesilip internet gelmeden açılan kutu da son bilinen zamanı bilsin. Depo yoksa ya da fırlatırsa bellekte
   çalışmaya devam eder. */
const DEPO_ANAHTARI = 'ekran.sonSunucuSaati';
/** Flaş yıpranması: depoya yalnız kayıtlı değer en az bu kadar büyüyünce yazılır. */
const DEPO_YAZIM_ESIGI_MS = 60_000;

function depodanOku(): number {
  try {
    const ham = localStorage.getItem(DEPO_ANAHTARI);
    const ms = ham === null ? 0 : Number(ham);
    return isFinite(ms) && ms > 0 ? ms : 0;
  } catch {
    return 0;
  }
}

let sonSunucuMs = depodanOku();
let depodakiMs = sonSunucuMs;

export function sonSunucuSaati(): number {
  return sonSunucuMs;
}

/** İşareti yalnız yükseltir, asla düşürmez; null, NaN ve Infinity yok sayılır. */
export function sunucuSaatiniKaydet(ms: number | null): void {
  if (ms === null || typeof ms !== 'number' || !isFinite(ms) || ms <= sonSunucuMs) return;
  sonSunucuMs = ms;
  if (ms - depodakiMs < DEPO_YAZIM_ESIGI_MS) return;
  try {
    localStorage.setItem(DEPO_ANAHTARI, String(ms));
    depodakiMs = ms;
  } catch {
    /* depo yok, dolu ya da kapalı: bellekteki işaret yeter */
  }
}

/* Zaman aşımı AbortController ile kurulur (Chrome 66+); AbortSignal.timeout Chrome 103 ister ve
   eski WebView'de yoktur. Tek zamanlayıcı hem fetch()'i hem yanit.json()'ı kapsar (abort, yanıt
   gövdesinin okunmasını da reddeder) ve finally'de temizlenir — sızıntı bırakmaz. */
async function getir<T>(yol: string, gecerli: (x: unknown) => x is T, zamanAsimiMs: number): Promise<T | null> {
  const denetleyici = new AbortController();
  const zamanlayici = setTimeout(() => denetleyici.abort(), zamanAsimiMs);
  try {
    const yanit = await fetch(yol, { cache: 'no-cache', signal: denetleyici.signal });
    if (!yanit.ok) return null;
    const govde: unknown = await yanit.json();
    if (!gecerli(govde)) return null;
    // Yalnız doğrulanmış gövdeden sonra: captive portal ya da ara katman sayfası işareti oynatamaz. SW'nin sunduğu
    // bayat önbellek yanıtı eski Date taşır; işaret hiç düşmediği için zararsızdır.
    sunucuSaatiniKaydet(sunucuSaatiCoz(yanit.headers.get('Date')));
    return govde;
  } catch {
    return null;
  } finally {
    clearTimeout(zamanlayici);
  }
}

export async function tazele(v: EkranVerisi, zamanAsimiMs = 30_000): Promise<void> {
  const [vakit, akis, icerik] = await Promise.all([
    getir('/ekran/vakitler.json', vakitGecerli, zamanAsimiMs),
    getir('/ekran/akis.json', akisGecerli, zamanAsimiMs),
    getir('/ekran/icerik.json', icerikGecerli, zamanAsimiMs),
  ]);
  if (vakit) v.vakit = vakit;
  if (akis) v.akis = akis;
  if (icerik) v.icerik = icerik;
}

/** Bir akış hâlâ hiç gelmediyse (kutu Wi-Fi ayağa kalkmadan önce açıldıysa) bir dakika sonra yeniden
 *  dener; hepsi doluysa normal 10 dakikalık tazeleme aralığına döner. */
export function sonrakiTazelemeMs(v: EkranVerisi): number {
  return v.vakit === null || v.akis === null || v.icerik === null ? 60_000 : 10 * 60_000;
}

/** Duyuru akışı ayrıca 3 dakikada bir yoklanır (src/ekran/main.ts → akisDongusu). Faz 1 çıkış ölçütü: CMS'te
 *  işaretlenen duyuru ≤ 15 dk'da ekranda — yayın ~3 dk + yoklama ≤ 3 dk + ekrandaki slaytın kalanı ≤ 30 sn.
 *  Vakit (~60 KB) ve içerik akışı 10 dakikada kalır: SW her başarılı yanıtı önbelleğe yeniden yazar, büyük
 *  akışı 3 dakikada bir yazmak kutunun flaş belleğini boşuna yıpratır. akis.json ~200 B'tır. */
export const AKIS_ARALIGI_MS = 3 * 60_000;

/** Slayt turunun yeniden kurulup kurulmayacağına karar veren kararlı anahtar (src/ekran/main.ts → sonrakiSlayt):
 *  duyuru listesinin kendisi — kimlik, TR/FR metin, görsel, gösterim aralığı, hedef ekranlar. `derleme` BİLEREK
 *  dışarıda: her yayında değişir (src/pages/ekran/akis.json.ts → derleme anı; günde 2–4 yayın) ve her yayın turu
 *  baştan başlatırdı. Ekran ayarı (slayt süresi) da dışarıda; süre her slaytta akıştan yeniden okunur. Liste aynı
 *  kurucudan (src/lib/ekran/akis.ts) aynı alan sırasıyla gelir, JSON metni kararlıdır. Akış yoksa undefined. */
/** Kabuktan itilen duyurular (src/ekran/kabuk.ts) anahtara girer; `rev` girmez:
 *  aynı içerikli yeni yük turu baştan başlatmaz. */
export function duyuruAnahtari(a: AkisGovdesi | null, kabuk: readonly EkranDuyuru[] = []): string | undefined {
  const akis = a ? JSON.stringify(a.duyurular) : undefined;
  if (kabuk.length === 0) return akis;
  return (akis === undefined ? '' : akis) + '|kabuk|' + JSON.stringify(kabuk);
}

/** Tur için duyuru listesi: kabuktan (Firestore) itilenler önce, akis.json duyuruları sonra. Kimlikler `fs:` önekli
 *  olduğundan çakışmaz; hedef ve tarih süzmesi slaytListesi'nindir. */
export function birlesikDuyurular(a: AkisGovdesi | null, kabuk: readonly EkranDuyuru[]): EkranDuyuru[] {
  return kabuk.concat(a ? a.duyurular : []);
}

/** Yalnız duyuru akışını tazeler; hatalı ya da geçersiz yanıt son sağlam akışı silmez (tazele ile aynı kural). */
export async function akisTazele(v: EkranVerisi, zamanAsimiMs = 30_000): Promise<void> {
  const akis = await getir('/ekran/akis.json', akisGecerli, zamanAsimiMs);
  if (akis) v.akis = akis;
}
