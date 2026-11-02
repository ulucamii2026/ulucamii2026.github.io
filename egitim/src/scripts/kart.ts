/**
 * Kare kodlu kartla giriş (`/k/#<kartId>.<sır>`, 2 Kasım 2026). BU DOSYANIN İLK İŞİ sırrı adresten silmektir (`adrestenKartAl`: `history.replaceState`);
 * hiçbir ağ isteği, günlük ya da depo bundan önce çalışmaz. Sır yalnız bu betiğin belleğinde yaşar. Sonra Firebase yüklenir ve `kartlaGir` çağrılır;
 * başarıda ana sayfaya gidilir (bu cihazdaki anonim çalışma varsa önce «hesabına eklensin mi?» sorulur). Bu sayfa dil bağımsızdır: dil cihazdan seçilir.
 */
import { adrestenKartAl, kartlaGir } from '../lib/hesap/kart-giris';

const kart = adrestenKartAl();

type Metin = Record<string, unknown> & { cocukHata: { sunucu: string; kilit: string; ag?: string }; ag: string };
interface KartVeri { diller: Record<string, Metin>; kodlar: Record<string, string> }
const sor = <T extends Element>(secici: string): T => {
  const e = document.querySelector<T>(secici);
  if (!e) throw new Error(`öğe yok: ${secici}`);
  return e;
};

const veri = JSON.parse(sor<HTMLElement>('[data-veri]').dataset.veri ?? '{}') as KartVeri;
const dil = (() => {
  const adaylar: string[] = [];
  try { adaylar.push(localStorage.getItem('ulucamiiEgitimDili') ?? ''); } catch { /* depo kapalı */ }
  adaylar.push(...(navigator.languages ?? [navigator.language]).map((d) => String(d).slice(0, 2).toLowerCase()));
  return adaylar.find((d) => d in veri.diller) ?? 'tr';
})();
const m = veri.diller[dil];
const s = (anahtar: string) => String(m[anahtar] ?? '');
document.documentElement.lang = veri.kodlar[dil] ?? dil;
document.title = `${s('kartBaslik')} — İlim Yolu`;
sor('[data-baslik]').textContent = s('kartBaslik');
sor<HTMLAnchorElement>('[data-ana]').href = `/${dil}/`;
sor('[data-ana]').textContent = s('kartAnaSayfa');
sor<HTMLAnchorElement>('[data-kodla]').href = `/${dil}/hesap/giris/?yontem=kurs`;
sor('[data-kodla]').textContent = s('kartKodlaGir');

const durum = sor<HTMLElement>('[data-durum]');
const hata = sor<HTMLElement>('[data-hata]');
function bitirHata(metin: string) {
  durum.textContent = '';
  hata.textContent = metin;
  sor<HTMLElement>('[data-baglantilar]').hidden = false;
}

async function giris() {
  if (!kart) {
    bitirHata(s('kartYok'));
    return;
  }
  durum.textContent = s('kartGiriyor');
  const { firebaseYukle } = await import('../lib/firebase-istemci');
  let f;
  try {
    f = await firebaseYukle();
  } catch {
    bitirHata(s('ag'));
    return;
  }
  const r = await kartlaGir(f, kart);
  if (!r.ok) {
    if (r.neden === 'yanlis') bitirHata(s('kartYanlis'));
    else if (r.neden === 'gecersiz') bitirHata(s('kartGecersiz'));
    else if (r.neden === 'ag') bitirHata(s('ag'));
    else if (r.neden === 'kilit') {
      const dk = Math.max(1, Math.ceil(((r.bitis ? Date.parse(r.bitis) : NaN) - Date.now()) / 60000) || 15);
      const sure = new Intl.NumberFormat(veri.kodlar[dil], { style: 'unit', unit: dk >= 90 ? 'hour' : 'minute', unitDisplay: 'long' }).format(dk >= 90 ? Math.round(dk / 60) : dk);
      bitirHata(m.cocukHata.kilit.replace('{0}', sure));
    } else bitirHata(m.cocukHata.sunucu);
    return;
  }
  // Bu cihazda anonim çalışma varsa sor (çocuk kartı da paylaşılan cihazda anonim çalışmış olabilir), sonra ana sayfaya.
  const { giristeEsitle } = await import('../lib/hesap/esitle');
  const { evetHayir } = await import('./hesap-ortak');
  durum.textContent = s('kartTamam');
  try {
    const karar = await giristeEsitle(f);
    if (karar.tur === 'sor') {
      const ekle = await evetHayir(sor<HTMLElement>('[data-soru]'), {
        metin: s('esitleSor').replace('{0}', String(karar.n)), not: s('esitleNot'), evet: s('esitleEvet'), hayir: s('esitleHayir'),
      });
      await karar.cevapla(ekle);
    }
  } catch { /* eşitleme sonra, ana sayfa açılışında yeniden denenir */ }
  location.replace(`/${dil}/`);
}

void giris();
