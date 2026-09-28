/**
 * Cami ekranı istemcisi — /ekran/ekran.js (27 Eylül 2026).
 * scripts/ekran-derle.mjs bu dosyayı eski Android TV WebView'lerine (Chromium 70) uygun pakete çevirir.
 * Saat ve takvim Brüksel'e göredir, cihazın saat diliminden bağımsızdır (src/lib/namaz.ts → TZ).
 * Veri: /ekran/vakitler.json, /ekran/akis.json, /ekran/icerik.json (10 dakikada bir tazelenir; duyuru akışı
 * ayrıca 3 dakikada bir yoklanır — src/ekran/veri.ts → AKIS_ARALIGI_MS).
 */
import { hicriCevir } from '../i18n/hicri.ts';
import { bugunTarih, TZ } from '../lib/namaz.ts';
import { brukselSaat, donmeOku, ekranIdOku, saatGecerliMi, slaytListesi, slaytSuresi, temaSec, vakitGorunumu, type Slayt, type SlaytAyari } from '../lib/ekran/secim.ts';
import { alan, yaz } from './gorunum.ts';
import { METIN } from './metinler.ts';
import { olcekKur } from './olcek.ts';
import { vakitleriCiz } from './vakitler.ts';
import { bosCiz, sigdir, slaytCiz } from './slaytlar.ts';
import { havaAdresi, havaCoz, havaSimgesi, havaTazeMi, SIMGE_YOLLARI, type HavaDurumu } from './hava.ts';
import { akisTazele, AKIS_ARALIGI_MS, tazele, sonrakiTazelemeMs, type EkranVerisi } from './veri.ts';

interface SayfaVerisi {
  cami: { tr: string; fr: string };
  vakit: Record<'tr' | 'fr', Record<string, string>>;
  gps: { enlem: number; boylam: number };
}

const sayfa = JSON.parse(document.getElementById('ekran-veri')?.textContent || '{}') as SayfaVerisi;
const parametre = new URLSearchParams(location.search);
const ekran = document.getElementById('ekran') as HTMLElement;
const ekranId = ekranIdOku(parametre.get('ekran'));
olcekKur(ekran, donmeOku(parametre.get('don')));
yaz('cami-tr', sayfa.cami.tr);
yaz('cami-fr', sayfa.cami.fr);

const veri: EkranVerisi = { vakit: null, akis: null, icerik: null };
let ilkTazelemeBitti = false;
const TARIH_TR = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const TARIH_FR = new Intl.DateTimeFormat('fr-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const iki = (n: number): string => (n < 10 ? '0' : '') + n;

let hava: HavaDurumu | null = null;
/** Üst bantta dış hava; 3 saatten eskiyse gizlenir. SVG ve sayı sabit/sayısal olduğu için innerHTML güvenli. */
function havaCiz(): void {
  const kutu = alan('hava');
  const h = hava;
  if (!kutu) return;
  if (!havaTazeMi(h, Date.now())) { kutu.hidden = true; return; }
  kutu.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SIMGE_YOLLARI[havaSimgesi(h.kod)]}</svg><span>${h.sicaklik}°C</span><small>Open-Meteo</small>`;
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
    if (kok && (veri.vakit || ilkTazelemeBitti)) vakitleriCiz(kok, gorunum, sayfa.vakit, gecerli);
    ekran.setAttribute('data-tema', temaSec(gorunum ? gorunum.gun : undefined, simdi));
    havaCiz();
  } catch (hata) {
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
      sonrakiSlayt();
    }
  } finally {
    setTimeout(() => { void veriDongusu(); }, sonrakiTazelemeMs(veri));
  }
}

/* Duyuru akışı 3 dakikada bir ayrıca yoklanır (üç akışın tam tazelemesi yukarıda 10 dakikada bir sürer):
   yeni duyuru en geç ~3 dk + bir slayt sonra ekranda. Ayrı ve bağımsız bir döngüdür — duvar saatine değil
   setTimeout gecikmesine dayanır, kutunun saati geri atlasa da durmaz. Yeni derlemeli akışı slayt döngüsü
   kendisi fark eder (sonrakiSlayt → turDerlemesi); burada yalnız veri tazelenir. Sonraki koşu finally'de. */
async function akisDongusu(): Promise<void> {
  try {
    await akisTazele(veri);
  } finally {
    setTimeout(() => { void akisDongusu(); }, AKIS_ARALIGI_MS);
  }
}

/* Slayt turu: bu ekrana özel duyurular, ortak duyurular, günün ayeti, günün hadisi (src/lib/ekran/secim.ts).
   Tur bitince ya da yeni derlemeli bir duyuru akışı gelince liste yeni veriyle yeniden kurulur; süre metin
   uzunluğundan (ekran.yaml → slayt).
   Sayfa aylarca yeniden yüklenmeden açık kalır: burada çıkan tek bir istisna (ör. `referans` alanı eksik
   bir CMS kaydı) turu asla sonsuza dek durdurmasın diye hiçbir zaman çağırana fırlatılmaz; her koşulda
   (başarı ya da hata) bir sonraki slayt zamanlanır. */
const VARSAYILAN_SLAYT: SlaytAyari = { tabanSn: 8, karakterSn: 0.05, enAzSn: 10, enCokSn: 30 };
let tur: Slayt[] = [];
let sira = 0;
let slaytBasladi = false;
/** Geçerli turun kurulduğu duyuru akışının derleme damgası. Yeni derlemeli bir akış geldiyse (akisDongusu)
 *  tur, sonuna kadar beklenmeden SONRAKİ slaytta yeniden kurulur; ekrandaki slayt süresini normal doldurmuştur. */
let turDerlemesi: string | undefined;
function sonrakiSlayt(): void {
  let sureMs = 15_000;
  try {
    const kok = alan('slayt');
    if (!kok) return;
    const derleme = veri.akis ? veri.akis.derleme : undefined;
    if (sira >= tur.length || derleme !== turDerlemesi) {
      tur = slaytListesi({ duyurular: veri.akis?.duyurular ?? [], ayetler: veri.icerik?.ayetler ?? [], hadisler: veri.icerik?.hadisler ?? [] }, ekranId, bugunTarih(new Date()));
      sira = 0;
      turDerlemesi = derleme;
    }
    const s = tur[sira++];
    if (!s) {
      bosCiz(kok, sayfa.cami);
      return;
    }
    slaytCiz(kok, s);
    sigdir(kok);
    sureMs = slaytSuresi(s.karakter, veri.akis?.ayar.slayt ?? VARSAYILAN_SLAYT) * 1000;
  } catch (hata) {
    console.error(hata);
  } finally {
    setTimeout(sonrakiSlayt, sureMs);
  }
}

/** Bir sonraki koşu finally'de zamanlanır: fetch ya da JSON çözümü patlasa bile aylarca kapanmayan bu sayfa hava döngüsünü tek bir istisna yüzünden asla kaybetmemeli. */
async function havaDongusu(): Promise<void> {
  const denetim = new AbortController();
  const zamanlayici = setTimeout(() => denetim.abort(), 30_000);
  try {
    const yanit = await fetch(havaAdresi(sayfa.gps.enlem, sayfa.gps.boylam), { cache: 'no-cache', signal: denetim.signal });
    const h = yanit.ok ? havaCoz(await yanit.json(), Date.now()) : null;
    if (h) hava = h;
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

saniyelik();
void veriDongusu();
setTimeout(() => { void akisDongusu(); }, AKIS_ARALIGI_MS); // ilk tam tazeleme duyuru akışını zaten getirir
void havaDongusu();
