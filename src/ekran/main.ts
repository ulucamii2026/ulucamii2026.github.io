/**
 * Cami ekranı istemcisi — /ekran/ekran.js (27 Eylül 2026).
 * scripts/ekran-derle.mjs bu dosyayı eski Android TV WebView'lerine (Chromium 70) uygun pakete çevirir.
 * Saat ve takvim Brüksel'e göredir, cihazın saat diliminden bağımsızdır (src/lib/namaz.ts → TZ).
 * Veri: /ekran/vakitler.json, /ekran/akis.json, /ekran/icerik.json (10 dakikada bir tazelenir).
 */
import { hicriCevir } from '../i18n/hicri.ts';
import { bugunTarih, TZ } from '../lib/namaz.ts';
import { brukselSaat, donmeOku, saatGecerliMi, temaSec, vakitGorunumu } from '../lib/ekran/secim.ts';
import { alan, yaz } from './gorunum.ts';
import { METIN } from './metinler.ts';
import { olcekKur } from './olcek.ts';
import { vakitleriCiz } from './vakitler.ts';
import { tazele, sonrakiTazelemeMs, type EkranVerisi } from './veri.ts';

interface SayfaVerisi {
  cami: { tr: string; fr: string };
  vakit: Record<'tr' | 'fr', Record<string, string>>;
  gps: { enlem: number; boylam: number };
}

const sayfa = JSON.parse(document.getElementById('ekran-veri')?.textContent || '{}') as SayfaVerisi;
const parametre = new URLSearchParams(location.search);
const ekran = document.getElementById('ekran') as HTMLElement;
olcekKur(ekran, donmeOku(parametre.get('don')));
yaz('cami-tr', sayfa.cami.tr);
yaz('cami-fr', sayfa.cami.fr);

const veri: EkranVerisi = { vakit: null, akis: null, icerik: null };
let ilkTazelemeBitti = false;
const TARIH_TR = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const TARIH_FR = new Intl.DateTimeFormat('fr-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const iki = (n: number): string => (n < 10 ? '0' : '') + n;

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
  } finally {
    setTimeout(() => { void veriDongusu(); }, sonrakiTazelemeMs(veri));
  }
}

saniyelik();
void veriDongusu();
