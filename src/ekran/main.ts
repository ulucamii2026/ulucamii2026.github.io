/**
 * Cami ekranı istemcisi — /ekran/ekran.js (27 Eylül 2026).
 * scripts/ekran-derle.mjs bu dosyayı eski Android TV WebView'lerine (Chromium 70) uygun pakete çevirir.
 * Saat ve takvim Brüksel'e göredir, cihazın saat diliminden bağımsızdır (src/lib/namaz.ts → TZ).
 * Veri: /ekran/vakitler.json, /ekran/akis.json, /ekran/icerik.json (10 dakikada bir tazelenir; duyuru akışı
 * ayrıca 3 dakikada bir yoklanır — src/ekran/veri.ts → AKIS_ARALIGI_MS).
 */
import { hicriCevir } from '../i18n/hicri.ts';
import { bugunTarih, TZ } from '../lib/namaz.ts';
import { brukselSaat, donmeOku, duzenOku, ekranIdOku, saatGecerliMi, slaytListesi, slaytSuresi, temaSec, TUR_HEDEF_SN, vakitGorunumu, type Slayt, type SlaytAyari } from '../lib/ekran/secim.ts';
import { alan, yaz } from './gorunum.ts';
import { METIN, VAKIT_ADLARI } from './metinler.ts';
import { olcekKur } from './olcek.ts';
import { dokunmatikKipiOku, dokunmatikKur } from './dokunmatik.ts';
import { vakitleriCiz } from './vakitler.ts';
import { bosCiz, levhaSigdir, slaytCiz } from './slaytlar.ts';
import { havaAdresi, havaCoz, havaSimgesi, havaTazeMi, SIMGE_YOLLARI, type HavaDurumu } from './hava.ts';
import { akisTazele, AKIS_ARALIGI_MS, birlesikDuyurular, duyuruAnahtari, tazele, sonrakiTazelemeMs, type EkranVerisi } from './veri.ts';
import { kabukKur, type KabukDurumu } from './kabuk.ts';
import { renderKur } from './render.ts';

interface SayfaVerisi {
  cami: { tr: string; fr: string };
  vakit: Record<'tr' | 'fr', Record<string, string>>;
  /** Hava için caminin konumu (site.yaml → gps); sayfa verisi bozuksa yoktur ve hava hiç gösterilmez. */
  gps?: { enlem: number; boylam: number };
  /** Sitedeki sabit Cuma namazı saati (SS:DD) ya da boş; src/pages/ekran/index.astro doğrular. */
  cumaSaati?: string;
}

/** Sayfa verisi (#ekran-veri) eksik ya da bozuksa (ör. önbellekteki eski iskelet ile yeni paket) açılış çökmez,
 *  güvenli varsayılanlar kullanılır: cami adı boş kalır, vakit adları ekranın kendi kopyasından gelir
 *  (metinler.ts → VAKIT_ADLARI), saat ve Diyanet vakitleri yine çalışır; konum yoksa hava gösterilmez (uydurma
 *  bir konumun havası yerine hiç). */
function sayfaVerisiOku(): SayfaVerisi {
  const bos: SayfaVerisi = { cami: { tr: '', fr: '' }, vakit: VAKIT_ADLARI, cumaSaati: '' };
  try {
    const x = JSON.parse(document.getElementById('ekran-veri')?.textContent || 'null') as Partial<SayfaVerisi> | null;
    if (!x || typeof x !== 'object') return bos;
    const metin = (s: unknown): string => (typeof s === 'string' ? s : '');
    return {
      cami: x.cami ? { tr: metin(x.cami.tr), fr: metin(x.cami.fr) } : bos.cami,
      vakit: x.vakit && x.vakit.tr && x.vakit.fr ? x.vakit : bos.vakit,
      gps: x.gps && typeof x.gps.enlem === 'number' && typeof x.gps.boylam === 'number' ? x.gps : undefined,
      cumaSaati: typeof x.cumaSaati === 'string' && /^\d{2}:\d{2}$/.test(x.cumaSaati) ? x.cumaSaati : '',
    };
  } catch (hata) {
    console.error(hata);
    return bos;
  }
}

const sayfa = sayfaVerisiOku();
const parametre = new URLSearchParams(location.search);
const ekran = document.getElementById('ekran') as HTMLElement;
const render = renderKur(window);
let dakikaSaglikli = false;
let slaytSaglikli = true;
let slaytGozlemSonu = performance.now() + 60_000;
const ekranId = ekranIdOku(parametre.get('ekran'));
const dokunmatik = dokunmatikKipiOku(parametre.get('kip'));
// Düzen pencere boyutuyla değişebilir (ör. döndürülmüş pencere): vakit bloğu yeniden çizilir, slayt sığdırılır; geri çağrı açılışta çalışmaz (durum henüz kurulmadı).
const yenidenOlc = (): void => {
  dakikalik(new Date());
  const slayt = alan('slayt');
  if (slayt && (dokunmatik || typeof ResizeObserver !== 'function')) levhaSigdir(slayt);
};
if (dokunmatik) dokunmatikKur(ekran, yenidenOlc);
else olcekKur(ekran, donmeOku(parametre.get('don')), duzenOku(parametre.get('duzen')), yenidenOlc);
/* Slayt alanının boyutu değişince (pencere, döndürme, Cuma satırı) levha yeniden sığdırılır. ResizeObserver
   Chromium 64+; yoksa olcekKur geri çağrısı ve Cuma satırı denetimi yedektir (yalnız o zaman çalışır: tek tetikçi).
   Sığdırma yalnız --olcek'i değiştirir, alanın kendi boyutunu değil (flex: 1 / ızgara satırı): gözlemci kendini
   yeniden tetiklemez. */
try {
  const slaytAlani = alan('slayt');
  if (!dokunmatik && slaytAlani && typeof ResizeObserver === 'function') new ResizeObserver(() => { levhaSigdir(slaytAlani); }).observe(slaytAlani);
} catch (hata) {
  console.error(hata);
}

/** İlk slayttan önce Arapça yüzler yüklenir (en çok 3 sn): ilk levha yedek yazı tipiyle ölçülüp sonra taşmasın.
 *  Yüklenemese de açılış sürer (levhaSigdir yazı tipi gelince yeniden sığdırır). */
const ARAPCA_YUZLER = ['Ekran Kuran', 'Ekran Metin'];
/** arapcaYukle() bittiği an (performance.now; saat atlamalarından etkilenmez). Sığmayan slaytı «yazı tipleri
 *  yükleniyor» diye gösterme istisnası (sonrakiSlayt) bu andan en çok YAZI_TIPI_TOLERANSI_MS sürer. */
let arapcaHazirAni = 0;
const YAZI_TIPI_TOLERANSI_MS = 10_000;
function arapcaYukle(): Promise<void> {
  const fonts = document.fonts;
  if (!fonts || typeof fonts.load !== 'function') return Promise.resolve();
  const yukle = Promise.all(ARAPCA_YUZLER.map((y) => fonts.load('32px "' + y + '"', 'بسم'))).then(() => undefined, () => undefined);
  return Promise.race([yukle, new Promise<void>((r) => { setTimeout(r, 3000); })]);
}

yaz('cami-tr', sayfa.cami.tr);
yaz('cami-fr', sayfa.cami.fr);

const veri: EkranVerisi = { vakit: null, akis: null, icerik: null };
/** Kabuktan itilen duyurular (src/ekran/kabuk.ts, window.UluKabukAl). Kabuk yoksa hiç dolmaz: sayfa bugünkü gibi çalışır. */
const kabuk: KabukDurumu = { rev: -1, duyurular: [] };
let ilkTazelemeBitti = false;
const TARIH_TR = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const TARIH_FR = new Intl.DateTimeFormat('fr-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const iki = (n: number): string => (n < 10 ? '0' : '') + n;

let hava: HavaDurumu | null = null;
/** Üst bantta dış hava; 3 saatten eskiyse gizlenir ve içi boşaltılır (bayat simge/sıcaklık DOM'da kalmaz). SVG ve
 *  sayı sabit/sayısal olduğu için innerHTML güvenli. Sayı ile birim arasında dar bölünmez boşluk (U+202F). */
function havaCiz(): void {
  const kutu = alan('hava');
  const h = hava;
  if (!kutu) return;
  if (!havaTazeMi(h, Date.now())) { kutu.hidden = true; kutu.innerHTML = ''; return; }
  kutu.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SIMGE_YOLLARI[havaSimgesi(h.kod)]}</svg><span>${h.sicaklik}\u202F°C</span><small>Open-Meteo</small>`;
  kutu.hidden = false;
}

/** Dakikada bir ve her veri tazelemesinden sonra yeniden çizilenler. Sayfa aylarca yeniden yüklenmeden
 *  açık kalır: burada çıkan tek bir istisna (ör. bozuk bir gün kaydı) saati de durdurmasın diye
 *  hiçbir zaman çağırana fırlatılmaz. */
function dakikalik(simdi: Date): void {
  try {
    const gecerli = saatGecerliMi(simdi);
    yaz('tarih-tr', gecerli ? TARIH_TR.format(simdi) : '');
    yaz('tarih-fr', gecerli ? TARIH_FR.format(simdi) : '');
    const bugun = bugunTarih(simdi);
    const gun = gecerli && veri.vakit ? veri.vakit.gunler.filter((g) => g.tarih === bugun)[0] : undefined;
    yaz('hicri-tr', gun ? gun.hicri : '');
    yaz('hicri-fr', gun ? hicriCevir(gun.hicri, 'fr') : '');
    const gorunum = gecerli && veri.vakit ? vakitGorunumu(veri.vakit.gunler, simdi) : null;
    const kok = alan('vakitler');
    if (kok && (veri.vakit || ilkTazelemeBitti)) {
      const cumaliydi = kok.classList.contains('cumali');
      vakitleriCiz(kok, gorunum, sayfa.vakit, gecerli, sayfa.cumaSaati || '', ekran.getAttribute('data-duzen') === 'yatay');
      // Cuma satırı açılıp kapanınca (Perşembe→Cuma gece yarısı ve ertesi gün) vakit alanı 10u uzar/kısalır, slayt
      // alanı tersine değişir: ekrandaki slayt yeni alana hemen yeniden sığdırılır, yoksa altı sonraki slayta dek
      // (≤ 30 sn) kırpılırdı. ResizeObserver yoksa (eski WebView) yedek olarak levhaSigdir burada çağrılır.
      const slayt = alan('slayt');
      if (slayt && typeof ResizeObserver !== 'function' && kok.classList.contains('cumali') !== cumaliydi) levhaSigdir(slayt);
    }
    ekran.setAttribute('data-tema', temaSec(gorunum ? gorunum.gun : undefined, simdi));
    havaCiz();
    dakikaSaglikli = true;
  } catch (hata) {
    dakikaSaglikli = false;
    console.error(hata);
  }
}

let sonDakika = -1;
function saniyelik(): void {
  try {
    const simdi = new Date();
    if (saatGecerliMi(simdi)) {
      const s = brukselSaat(simdi);
      yaz('saat-sd', iki(s.sa) + ':' + iki(s.dk));
      yaz('saat-sn', ':' + iki(s.sn));
      ekran.classList.remove('saat-yok');
    } else {
      yaz('saat-sd', METIN.saatYok.tr + ' · ' + METIN.saatYok.fr);
      yaz('saat-sn', '');
      ekran.classList.add('saat-yok');
    }
    const dakika = Math.floor(simdi.getTime() / 60_000);
    if (dakika !== sonDakika) {
      sonDakika = dakika;
      dakikalik(simdi);
    }
    // A live timer alone is not proof: count only after clock/date/prayer DOM work and required nodes exist.
    if (dakikaSaglikli && slaytSaglikli && performance.now() <= slaytGozlemSonu && document.contains(ekran) && alan('saat-sd') && alan('saat-sn') && alan('vakitler') && alan('slayt')) render.ilerle();
  } finally {
    setTimeout(saniyelik, 1000 - (Date.now() % 1000) + 15);
  }
}

async function veriDongusu(): Promise<void> {
  try {
    await tazele(veri);
    ilkTazelemeBitti = true;
    dakikalik(new Date());
    if (!slaytBasladi) {
      slaytBasladi = true;
      await arapcaYukle();
      arapcaHazirAni = performance.now();
      sonrakiSlayt();
    }
  } finally {
    setTimeout(() => { void veriDongusu(); }, sonrakiTazelemeMs(veri));
  }
}

/* Duyuru akışı 3 dakikada bir ayrıca yoklanır (üç akışın tam tazelemesi yukarıda 10 dakikada bir sürer):
   yeni duyuru en geç ~3 dk + bir slayt sonra ekranda. Ayrı ve bağımsız bir döngüdür — duvar saatine değil
   setTimeout gecikmesine dayanır, kutunun saati geri atlasa da durmaz. Duyuruları değişen akışı slayt döngüsü
   kendisi fark eder (sonrakiSlayt → turAnahtari); burada yalnız veri tazelenir. Sonraki koşu finally'de. */
async function akisDongusu(): Promise<void> {
  try {
    await akisTazele(veri);
  } finally {
    setTimeout(() => { void akisDongusu(); }, AKIS_ARALIGI_MS);
  }
}

/* Slayt turu: bu ekrana özel duyurular, ortak duyurular, günün ayeti, hadisi, duası ve Esmâ'sı (tur uzarsa dilimlenir; src/lib/ekran/secim.ts).
   Tur bitince ya da duyuruları değişmiş bir akış gelince liste yeni veriyle yeniden kurulur; süre metin
   uzunluğundan (ekran.yaml → slayt).
   Sayfa aylarca yeniden yüklenmeden açık kalır: burada çıkan tek bir istisna (ör. `referans` alanı eksik
   bir CMS kaydı) turu asla sonsuza dek durdurmasın diye hiçbir zaman çağırana fırlatılmaz; her koşulda
   (başarı ya da hata) bir sonraki slayt zamanlanır. */
const VARSAYILAN_SLAYT: SlaytAyari = { tabanSn: 8, karakterSn: 0.05, enAzSn: 10, enCokSn: 30 };
let tur: Slayt[] = [];
let sira = 0;
let slaytBasladi = false;
/** Kaçıncı tur (manevi blok dilimlemesi; secim.ts → slaytListesi). Tur sonuna gelince artar; yeni duyuru akışı
 *  yüzünden erken kurulan tur sayılmaz. */
let turNo = 0;
/** Geçerli turun kurulduğu duyuru listesinin anahtarı (veri.ts → duyuruAnahtari). Duyuruları değişmiş bir akış
 *  geldiyse (akisDongusu) tur, sonuna kadar beklenmeden SONRAKİ slaytta yeniden kurulur; ekrandaki slayt süresini
 *  normal doldurmuştur. Yalnız derleme damgası değişen akış (her yayın) turu baştan başlatmaz. */
let turAnahtari: string | undefined;
/** Sıradaki slayt zamanlayıcısı (sonrakiSlayt → finally): kabuk yeni liste ittiğinde iptal edilip hemen yeniden kurulur. */
let slaytZamanlayici: ReturnType<typeof setTimeout> | undefined;
let otomatikGecis = !dokunmatik;
let sonSureMs = 15_000;
const zamanlayiciIptal = (): void => {
  if (slaytZamanlayici !== undefined) clearTimeout(slaytZamanlayici);
  slaytZamanlayici = undefined;
};
/* Gözlem sınırı yalnız bir geçiş beklendiğinde konur: elle okuma kipinde ya da gizli sayfada slayt döngüsü bilerek
   bekler, takılmış sayılmaz (yoksa renderer sayacı süre + 30 sn sonra durur ve kabuk sağlıklı sayfayı donmuş sanar).
   Çizim hatası slaytSaglikli ile, ana iş parçacığının durması saniyelik ile yine yakalanır. */
function slaytZamanla(): void {
  zamanlayiciIptal();
  if (otomatikGecis && (!dokunmatik || !document.hidden)) {
    slaytZamanlayici = setTimeout(sonrakiSlayt, sonSureMs);
    slaytGozlemSonu = performance.now() + sonSureMs + 30_000;
  } else {
    slaytGozlemSonu = Infinity;
  }
}
if (dokunmatik) {
  ekran.querySelector('[data-dokun="sonraki"]')?.addEventListener('click', () => {
    if (slaytBasladi) { zamanlayiciIptal(); sonrakiSlayt(); }
  });
  const otomatik = ekran.querySelector('[data-dokun="otomatik"]');
  otomatik?.addEventListener('click', () => {
    otomatikGecis = !otomatikGecis;
    otomatik.setAttribute('aria-pressed', String(otomatikGecis));
    if (slaytBasladi) slaytZamanla();
  });
  document.addEventListener('visibilitychange', () => { if (slaytBasladi) slaytZamanla(); });
}
/** Tabanda da sığmadığı için atlanan slayt sayısı (teşhis; slayt alanında data-atlanan). */
let atlanan = 0;
/** Turu (yeniden) kurar: bitmiş bir turdan sonra turNo artar, sira başa döner. */
function turKur(kok: HTMLElement): void {
  if (sira >= tur.length && tur.length > 0) turNo++;
  const ayar = veri.akis?.ayar;
  const icerik = veri.icerik;
  tur = slaytListesi(
    { duyurular: birlesikDuyurular(veri.akis, kabuk.duyurular), ayetler: icerik?.ayetler ?? [], hadisler: icerik?.hadisler ?? [], dualar: icerik?.dualar ?? [], esmalar: icerik?.esmalar ?? [] },
    ekranId, bugunTarih(new Date()), turNo,
    { turHedefSn: ayar?.turHedefSn ?? TUR_HEDEF_SN, slayt: ayar?.slayt ?? VARSAYILAN_SLAYT },
  );
  sira = 0;
  turAnahtari = duyuruAnahtari(veri.akis, kabuk.duyurular);
  kok.setAttribute('data-atlanan', String(atlanan));
}
function sonrakiSlayt(): void {
  let sureMs = 15_000;
  let cizildi = false;
  try {
    const kok = alan('slayt');
    if (!kok) return;
    if (sira >= tur.length || duyuruAnahtari(veri.akis, kabuk.duyurular) !== turAnahtari) turKur(kok);
    // Okunur taban kuralı: tabanda da sığmayan slayt atlanır. Turun kalanında sığan kalmadıysa (ama bu çağrıda en az
    // bir slayt atlandıysa) tur bir kez yeniden kurulur ve seçim bir kez daha yapılır; «Hoş geldiniz» yalnız yeni turda
    // da sığan slayt yoksa (yani tüm slaytlar atlanmışsa) çizilir. Çağrı başına en çok bir yeniden kurma: döngü donmaz.
    // İstisna: yazı tipleri hâlâ yükleniyorsa ölçüm yedek yazı tipiyle yapılmıştır ve yanıltıcı olabilir; slayt
    // atlanmaz, gösterilir (ölçüldüğü gibi) ve yazı tipleri gelince levhaSigdir yeniden sığdırır (o zaman gerçekten
    // sığmıyorsa sonraki turda atlanır). İstisna sınırlıdır: yazı tipleri hazırlık beklemesinden sonra
    // YAZI_TIPI_TOLERANSI_MS'den uzun yükleniyorsa slayt normal atlanır.
    let atlananCagri = 0;
    const sec = (): Slayt | undefined => {
      while (sira < tur.length) {
        const aday = tur[sira++];
        slaytCiz(kok, aday);
        if (levhaSigdir(kok).sigdi || (document.fonts && document.fonts.status === 'loading' && performance.now() - arapcaHazirAni < YAZI_TIPI_TOLERANSI_MS)) return aday;
        atlanan++;
        atlananCagri++;
        kok.setAttribute('data-atlanan', String(atlanan));
        console.warn('[ekran] slayt ekrana sığmadı, atlandı: ' + aday.tur + ' ' + aday.oge.id);
      }
      return undefined;
    };
    let s = sec();
    if (!s && atlananCagri > 0) {
      turKur(kok);
      s = sec();
    }
    if (!s) {
      bosCiz(kok, sayfa.cami);
      cizildi = true;
      return;
    }
    sureMs = slaytSuresi(s.karakter, veri.akis?.ayar.slayt ?? VARSAYILAN_SLAYT) * 1000;
    // Bozuk bir `ayar.slayt` (ör. önbellekteki eski paket + yeni şemalı akış) NaN ya da 0 verir; setTimeout(…, NaN)
    // 0 ms demektir ve slaytlar durmadan yeniden çizilirdi.
    if (!(sureMs >= 1000)) sureMs = 15_000;
    cizildi = true;
  } catch (hata) {
    console.error(hata);
  } finally {
    slaytSaglikli = cizildi;
    sonSureMs = sureMs;
    slaytZamanla();
  }
}

/** Bir sonraki koşu finally'de zamanlanır: fetch ya da JSON çözümü patlasa bile aylarca kapanmayan bu sayfa hava döngüsünü tek bir istisna yüzünden asla kaybetmemeli. */
async function havaDongusu(): Promise<void> {
  const denetim = new AbortController();
  const zamanlayici = setTimeout(() => denetim.abort(), 30_000);
  try {
    const gps = sayfa.gps;
    if (gps) {
      const yanit = await fetch(havaAdresi(gps.enlem, gps.boylam), { cache: 'no-cache', signal: denetim.signal });
      const h = yanit.ok ? havaCoz(await yanit.json(), Date.now()) : null;
      if (h) hava = h;
    }
  } catch {
    /* ağ yok ya da 30 sn'de yanıt gelmedi: son değer 3 saat daha gösterilir */
  } finally {
    clearTimeout(zamanlayici);
    try { havaCiz(); } catch (hata) { console.error(hata); }
    setTimeout(() => { void havaDongusu(); }, 30 * 60_000);
  }
}

/* İnternetsiz açılış için service worker (src/ekran/sw.ts). Yeni sürüm denetimi 6 saatte bir; yeni SW
   denetimi devralınca sayfa bir kez yenilenir (ilk kurulumda değil). Kutu aylarca yeniden yüklenmeden
   çalışır: bu blokta çıkan senkron bir istisna (sandbox'lı/opak bir kiosk kabuğunda SW API'si) saati ve
   veri döngüsünü hiç başlatmadan ekranı boş bırakmasın diye tamamı try/catch içinde. */
try {
  // Depolama baskısında Chrome kökeni (SW ve önbellekleri) topluca silebilir; kutu bir sonraki internetsiz
  // açılışta Chrome'un hata sayfasını gösterirdi. Kalıcı depolama açılışta bir kez istenir (Chrome 55+);
  // tarayıcı reddederse ya da desteklemezse hiçbir şey değişmez.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch((hata) => console.error(hata));
  if ('serviceWorker' in navigator) {
    // `denetciVardi` SABİT değil: kutunun İLK kurulumunda henüz denetleyici yoktur (false), ama SONRAKİ
    // her sürüm güncellemesinde bu artık true olmalı — yoksa güncelleme hiç yenilenmez, sayfa aylarca
    // eski paketi belleğinden çalıştırmaya devam eder (yeni SW eski önbelleği çoktan silmiş olsa bile).
    let denetciVardi = !!navigator.serviceWorker.controller;
    let yenileniyor = false; // en fazla bir kez yenile
    navigator.serviceWorker
      .register('/ekran/sw.js', { scope: '/ekran/' })
      .catch((hata) => console.error(hata));
    setInterval(() => {
      // register() zaten var olan kaydı yan etkisiz döner, silinmişse (depolama tahliyesi, başarısız ilk
      // kurulum) yeniden oluşturur — yalnız update() çağırmak kayıt kaybolduğunda sonsuza dek sessizce
      // reddederdi.
      navigator.serviceWorker
        .register('/ekran/sw.js', { scope: '/ekran/' })
        .then((kayit) => kayit.update())
        .catch((hata) => console.error(hata));
    }, 6 * 3_600_000);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (denetciVardi && !yenileniyor) { yenileniyor = true; location.reload(); }
      denetciVardi = true;
    });
  }
} catch (hata) {
  console.error(hata);
}

/* Kabuk yeni bir duyuru listesi ittiğinde ekrandaki slaytın bitmesi beklenmez (slayt 10–30 sn sürer; imam duyurusu
   «birkaç saniyede» görünmeli): 1,5 sn'lik sönümlemeyle (art arda değişiklikler tek yeniden kurma) sıradaki slayt hemen
   çizilir ve tur yeni listeyle kurulur. Duyuru içeriği değişmediyse (yalnız rev arttı) slayt kesilmez. İlk slayt henüz
   başlamadıysa yapılacak bir şey yok: turKur kabuk listesini zaten kullanır. */
let kabukBekleme: ReturnType<typeof setTimeout> | undefined;
kabukKur(window, kabuk, () => {
  if (kabukBekleme !== undefined) clearTimeout(kabukBekleme);
  kabukBekleme = setTimeout(() => {
    kabukBekleme = undefined;
    if (!slaytBasladi || duyuruAnahtari(veri.akis, kabuk.duyurular) === turAnahtari) return;
    if (slaytZamanlayici !== undefined) clearTimeout(slaytZamanlayici);
    sonrakiSlayt();
  }, 1500);
});

saniyelik();
void veriDongusu();
setTimeout(() => { void akisDongusu(); }, AKIS_ARALIGI_MS); // ilk tam tazeleme duyuru akışını zaten getirir
void havaDongusu();
