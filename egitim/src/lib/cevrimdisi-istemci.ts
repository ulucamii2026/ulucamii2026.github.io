/**
 * Çevrim dışı çalışma — SAYFA tarafı (25 Ekim 2026): madde sayfasındaki kaydetme kutusu (scripts/cevrimdisi.ts) ve `/<dil>/cevrimdisi/`
 * yönetim sayfası (scripts/cevrimdisi-liste.ts) bu kütüphaneyi kullanır. Service worker (src/sw/sw.ts) ile ortak adlar ve biçimler
 * lib/cevrimdisi-ortak.ts'tedir. Hiçbir kişisel veri yazılmaz: künye yalnız madde kimliği, dil, ad (kataloğun adı), yol ve boyutlardır.
 *
 * Akış: (1) SW'ye «bu sayfayı ve dosyalarını al» denir (HTML + CSS/JS/kip parçaları/yazı tipleri; SW ömrü kısa ve ilerleme sayfada
 * olduğu için SES dosyalarını sayfa kendisi sırayla indirir); (2) her ses `fetch` + kalıcı ses önbelleğine yazma — ses önbelleğine YALNIZ bu akış
 * yazar (service worker yazmaz: kayıtsız ses olduğu gibi ağdan akar); (3) en sonda künye yazılır. Künye yoksa madde «kayıtlı» sayılmaz. Kayıt
 * yarıda kesilir ya da hata verirse bu denemede yazılan sesler geri alınır (başka bir künyede kullanılanlar hariç): önbellekte künyesiz, silinemez
 * dosya kalmaz.
 */
import {
  KABUK_ONEKI, KAYIT_ONBELLEGI, SES_ONBELLEGI, DILLER, cevrimdisiYolu, kayitAnahtari, kayitAnahtariMi, sayfaAnahtari, sesTuru,
  type Kayit, type KayitDili,
} from './cevrimdisi-ortak';

export type { Kayit };

/** Tarayıcı bu özellikleri taşıyor mu (güvenli bağlam, Cache API, service worker). */
export const destekleniyor = (): boolean =>
  typeof window !== 'undefined' && window.isSecureContext && 'caches' in window && 'serviceWorker' in navigator;

/** Cihazdaki künyeler (en yeni önce). Bozuk künye atlanır. */
export async function kayitlariOku(): Promise<Kayit[]> {
  const onbellek = await caches.open(KAYIT_ONBELLEGI);
  const sonuc: Kayit[] = [];
  for (const istek of await onbellek.keys()) {
    if (!kayitAnahtariMi(new URL(istek.url).pathname)) continue;
    try {
      const k = (await (await onbellek.match(istek))!.json()) as Kayit;
      if (k && k.v === 1 && typeof k.id === 'string' && typeof k.yol === 'string' && Array.isArray(k.sesler)) sonuc.push(k);
    } catch {
      /* bozuk künye: yok say */
    }
  }
  return sonuc.sort((a, b) => b.tarih.localeCompare(a.tarih));
}

export async function kayitOku(dil: string, id: string): Promise<Kayit | null> {
  const onbellek = await caches.open(KAYIT_ONBELLEGI);
  const yanit = await onbellek.match(kayitAnahtari(dil, id));
  if (!yanit) return null;
  try {
    const k = (await yanit.json()) as Kayit;
    return k && k.v === 1 ? k : null;
  } catch {
    return null;
  }
}

export const kayitBayti = (k: Kayit): number => k.sayfaBayt + k.sesler.reduce((t, s) => t + s.b, 0);

/** Birden çok künyenin toplamı: aynı ses dosyası (eûzü/besmele gibi ortak kayıtlar) bir kez sayılır. */
export function toplamBayt(kayitlar: readonly Kayit[]): number {
  const sesler = new Map<string, number>();
  let sayfa = 0;
  for (const k of kayitlar) {
    sayfa += k.sayfaBayt;
    for (const s of k.sesler) sesler.set(s.y, s.b);
  }
  return sayfa + [...sesler.values()].reduce((t, b) => t + b, 0);
}

/** `7340032` → «7 MB» (sayfa dilinin ondalık ayracıyla). Küçük boyutlar KB. */
export function boyutYaz(bayt: number, yerel: string): string {
  const mb = bayt / (1024 * 1024);
  const bicim = (n: number, birim: string) => `${new Intl.NumberFormat(yerel, { maximumFractionDigits: n >= 10 ? 0 : 1 }).format(n)} ${birim}`;
  return mb >= 0.95 ? bicim(mb, 'MB') : bicim(Math.max(1, bayt / 1024), 'KB');
}

/** SW etkinleşmiş mi (kayıt hazır). Kayıt hiç yoksa (SW engelli ya da kaydedilemedi) söz asla çözülmez: kutu gizli kalır. */
export const swHazir = (): Promise<ServiceWorkerRegistration> => navigator.serviceWorker.ready;

const MESAJ_ZAMAN_ASIMI_MS = 90_000;

/** SW'ye `sayfa-kaydet` der; yanıt `MessageChannel` portundan gelir. */
export async function sayfayiKaydet(yol: string): Promise<number> {
  const kayit = await swHazir();
  const hedef = kayit.active;
  if (!hedef) throw new Error('service worker etkin değil');
  return new Promise<number>((coz, red) => {
    const kanal = new MessageChannel();
    const sayac = setTimeout(() => red(new Error('zaman aşımı')), MESAJ_ZAMAN_ASIMI_MS);
    kanal.port1.onmessage = (o: MessageEvent<{ tamam: boolean; bayt?: number; hata?: string }>) => {
      clearTimeout(sayac);
      if (o.data?.tamam) coz(o.data.bayt ?? 0);
      else red(Object.assign(new Error('sayfa alınamadı'), { kod: o.data?.hata === 'kota' ? 'kota' : 'ag' }));
    };
    hedef.postMessage({ tur: 'sayfa-kaydet', yol }, [kanal.port2]);
  });
}

/** Ses dosyasını kalıcı ses önbelleğine alır (zaten varsa yeniden indirmez). `fetch` service worker'dan geçer; kayıtsız ses olduğu gibi ağa gider, yanıt
 *  burada okunur. Yalnız tam 200 ve bildirilen uzunlukla tutarlı gövde yazılır. `yeni`: bu çağrıda önbelleğe yeni bir dosya yazıldı mı. */
export async function sesiAl(adres: string, iptal: AbortSignal): Promise<{ bayt: number; yeni: boolean }> {
  const onbellek = await caches.open(SES_ONBELLEGI);
  const var_ = await onbellek.match(adres);
  if (var_) return { bayt: Number(var_.headers.get('content-length')) || (await var_.blob()).size, yeni: false };
  const yanit = await fetch(adres, { mode: 'cors', credentials: 'omit', signal: iptal });
  if (yanit.status !== 200) throw new Error(`ses alınamadı: ${yanit.status}`);
  const blob = await yanit.blob();
  const beklenen = Number(yanit.headers.get('content-length'));
  if (blob.size === 0 || (beklenen > 0 && beklenen !== blob.size)) throw new Error('ses eksik indi');
  await onbellek.put(adres, new Response(blob, { status: 200, headers: { 'Content-Type': sesTuru(yanit.headers.get('content-type')), 'Content-Length': String(blob.size), 'Accept-Ranges': 'bytes' } }));
  return { bayt: blob.size, yeni: true };
}

export interface KaydedilecekMadde { id: string; dil: KayitDili; ad: string; yol: string; sesler: readonly string[] }
export interface Ilerleme { yapilan: number; toplam: number; bayt: number }

/** Yarım kalan kayıtta yazılan sesleri siler; başka bir kayıtlı maddenin künyesinde geçenler (aynı dosyayı paylaşan maddeler) kalır. */
async function sesleriGeriAl(adresler: readonly string[]): Promise<void> {
  if (!adresler.length) return;
  try {
    const kullanilan = new Set((await kayitlariOku()).flatMap((k) => k.sesler.map((x) => x.y)));
    const ses = await caches.open(SES_ONBELLEGI);
    for (const a of adresler) if (!kullanilan.has(a)) await ses.delete(a);
  } catch (hata) {
    console.error(hata);
  }
}

/** Maddeyi kaydeder: sayfa (SW), sonra sesler sırayla; en sonda künye. İptalde `AbortError`, kota dolunca `kod: 'kota'` ile reddeder. */
export async function maddeyiKaydet(madde: KaydedilecekMadde, ilerle: (i: Ilerleme) => void, iptal: AbortSignal): Promise<Kayit> {
  const toplam = 1 + madde.sesler.length;
  let bayt = 0;
  const yazilan: string[] = []; // bu denemede ses önbelleğine yeni yazılanlar (yarım kalırsa geri alınır)
  try {
    const sayfaBayt = await sayfayiKaydet(madde.yol);
    bayt += sayfaBayt;
    ilerle({ yapilan: 1, toplam, bayt });
    const sesler: Kayit['sesler'] = [];
    for (const adres of madde.sesler) {
      if (iptal.aborted) throw new DOMException('iptal', 'AbortError');
      const { bayt: b, yeni } = await sesiAl(adres, iptal);
      if (yeni) yazilan.push(adres);
      sesler.push({ y: adres, b });
      bayt += b;
      ilerle({ yapilan: 1 + sesler.length, toplam, bayt });
    }
    const kayit: Kayit = { v: 1, id: madde.id, dil: madde.dil, ad: madde.ad, yol: madde.yol, sayfaBayt, sesler, tarih: new Date().toISOString() };
    await (await caches.open(KAYIT_ONBELLEGI)).put(
      kayitAnahtari(madde.dil, madde.id),
      new Response(JSON.stringify(kayit), { headers: { 'Content-Type': 'application/json' } }),
    );
    // Tarayıcıdan, bu sitenin önbelleğini yer daraldığında silmemesini ister (Chrome sessizce karar verir; Firefox tek sefer sorabilir). Sonuç beklenmez.
    try { void navigator.storage?.persist?.(); } catch { /* desteklenmiyor */ }
    return kayit;
  } catch (hata) {
    await sesleriGeriAl(yazilan);
    if (iptal.aborted) throw new DOMException('iptal', 'AbortError');
    if ((hata as { name?: string })?.name === 'QuotaExceededError') throw Object.assign(new Error('kota'), { kod: 'kota' });
    throw hata;
  }
}

/** Sürümlü (kabuk) önbelleklerin adları: yalnız güncel sürüm kalır, ama silerken hepsine bakmak eski kalıntıyı da temizler. */
async function kabukAdlari(): Promise<string[]> {
  return (await caches.keys()).filter((a) => a.startsWith(KABUK_ONEKI));
}

/** Maddenin kaydını siler: künye, başka kayıtta kullanılmayan sesler ve açılmış sayfanın HTML'i. Dosya adları (CSS, yazı tipi) başka sayfalarla
 *  ortaktır, yeni SW sürümünde kendiliğinden temizlenir. */
export async function maddeyiSil(dil: string, id: string): Promise<void> {
  const kayit = await kayitOku(dil, id);
  const onbellek = await caches.open(KAYIT_ONBELLEGI);
  await onbellek.delete(kayitAnahtari(dil, id));
  if (!kayit) return;
  const kullanilan = new Set((await kayitlariOku()).flatMap((k) => k.sesler.map((s) => s.y)));
  const ses = await caches.open(SES_ONBELLEGI);
  for (const s of kayit.sesler) if (!kullanilan.has(s.y)) await ses.delete(s.y);
  const anahtar = sayfaAnahtari(new URL(kayit.yol, location.origin));
  for (const ad of await kabukAdlari()) await (await caches.open(ad)).delete(anahtar);
}

/** Bütün künyeleri, kalıcı ses önbelleğini ve açılmış sayfaların HTML'ini siler (çevrim dışı yedek sayfalar ve kök kalır). */
export async function hepsiniSil(): Promise<void> {
  await caches.delete(KAYIT_ONBELLEGI);
  await caches.delete(SES_ONBELLEGI);
  const korunan = new Set(['/', ...DILLER.map((d) => cevrimdisiYolu(d))]);
  for (const ad of await kabukAdlari()) {
    const onbellek = await caches.open(ad);
    for (const istek of await onbellek.keys()) {
      const yol = new URL(istek.url).pathname;
      if (yol.endsWith('/') && !korunan.has(yol)) await onbellek.delete(istek);
    }
  }
}

export interface AcilanSayfa { yol: string; baslik: string }

/** Bu cihazda açılmış (HTML'i önbellekte) bu dildeki sayfalar; kayıtlı maddeler ve çevrim dışı sayfanın kendisi hariç. Başlık, önbellekteki HTML'in `<title>`'ından. */
export async function acilanSayfalar(dil: string, haric: ReadonlySet<string>): Promise<AcilanSayfa[]> {
  const sonuc = new Map<string, AcilanSayfa>();
  const onek = `/${dil}/`;
  for (const ad of await kabukAdlari()) {
    const onbellek = await caches.open(ad);
    for (const istek of await onbellek.keys()) {
      const yol = new URL(istek.url).pathname;
      if (!yol.startsWith(onek) || !yol.endsWith('/') || yol === cevrimdisiYolu(dil) || haric.has(yol) || sonuc.has(yol)) continue;
      const yanit = await onbellek.match(istek);
      if (!yanit) continue;
      const metin = await yanit.text();
      const baslik = /<title>([^<]*)<\/title>/.exec(metin)?.[1]?.replace(/\s+—\s+[^—]*$/, '').trim();
      sonuc.set(yol, { yol, baslik: baslik ? cozHtml(baslik) : yol });
    }
  }
  return [...sonuc.values()].sort((a, b) => a.baslik.localeCompare(b.baslik, dil));
}

/** `<title>` içindeki HTML karakter kodlarını (&amp; &#39; gibi) düz metne çevirir; etiket yorumlamaz. */
function cozHtml(s: string): string {
  return new DOMParser().parseFromString(s, 'text/html').body.textContent ?? s;
}
