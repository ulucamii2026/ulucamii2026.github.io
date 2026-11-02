/**
 * İlim Yolu ana sayfası (giriş yapmış görünümü; 2 Kasım 2026): «Bugün tekrar», «Kaldığın yer», kilim ve yollar. Veri, kullanıcının cihaz kopyasındandır
 * (`oku(depo, etkinAnahtar(depo))`, src/lib/ezber/cihaz.ts); açılışta oturum varsa hesapla eşitlenir ve bulutta yeni bir şey çıkmışsa sayfa yeniden
 * çizilir. Kurs kaydına bağlı hesapta (çocuk ya da bağlanmış yetişkin) hocanın kaydı da okunur ve birleşik kilim çizilir (scripts/ana-hoca.ts).
 * Ziyaretçi görünümü bu betiğe ihtiyaç duymaz: oturum işareti yoksa Firebase HİÇ yüklenmez ve buradaki tek iş eski çapaları yönlendirmektir.
 * DOM elle kurulur (`innerHTML` yok; CSP).
 */
import { oku, type Depo } from '@ortak/lib/ezber/cihaz';
import { kendiMaddeler, kendiOzeti, type KendiMadde } from '@ortak/lib/ezber/kilimim';
import { bugunTekrar, haftaGunu, yerelGun } from '@ortak/lib/ezber/tekrar';
import { kalipDoldur } from '../i18n/sablon';
import { etkinAnahtar, tarayiciDeposu } from '../lib/hesap/isaret';
import { profilGetir } from '../lib/hesap/profil';
import { acilisEsitlemesi, adiGoster, oturumDurumu } from './oturum-ortak';

export interface AnaVeri {
  dil: string;
  yerel: string;
  sira: string[];
  adlar: Record<string, string>;
  il: Record<string, string>;
  tm: { hafta1: string; haftaN: string };
  km: { doku: [string, string, string, string]; dokuMadde: [string, string, string, string]; ozetBasladi: string; ozetTakvim: string; ozetGun: string; sayfasiz: string };
  baslik: string;
}

// Eski Ezber Kilimi girişi bu adresteydi (#seritler, #m-…, #s-…): çapayla gelen eski bağlantılar yeni adrese gider. Yeni sayfanın kendi çapaları hariç.
const YENI_CAPALAR = new Set(['#yollar', '#nasil', '#kurs', '#ana']);
const dilKodu = document.documentElement.dataset.dil;
if (dilKodu && location.hash && !YENI_CAPALAR.has(location.hash)) {
  location.replace(`/${dilKodu}/ezber/${location.hash}`);
}

const kok = document.querySelector<HTMLElement>('[data-ana-girisli]');
if (kok && document.documentElement.hasAttribute('data-oturum')) {
  try {
    void baslat(kok, JSON.parse(kok.dataset.veri ?? '') as AnaVeri);
  } catch {
    /* veri okunamadı: girişli görünüm boş kalır, ziyaretçi bölümleri yine görünmez; sayfa kırılmaz */
  }
}

function sor<T extends HTMLElement>(kok: ParentNode, secici: string): T {
  const e = kok.querySelector<T>(secici);
  if (!e) throw new Error(`öğe yok: ${secici}`);
  return e;
}

async function baslat(kok: HTMLElement, veri: AnaVeri) {
  let depo: Depo | null = null;
  try { depo = tarayiciDeposu(); } catch { depo = null; }
  const il = veri.il;
  const tarihYaz = (t: string) => new Intl.DateTimeFormat(veri.yerel, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${t}T12:00:00Z`));
  let ad = '';

  const ciz = () => {
    const d = oku(depo, etkinAnahtar(depo));
    const bugun = yerelGun(new Date());
    const maddeler = kendiMaddeler(d, veri.sira).filter((x) => veri.adlar[x.id]);
    const ozet = kendiOzeti(maddeler, d.gunler, bugun);
    const idler = bugunTekrar(d.maddeler, bugun).filter((id) => veri.adlar[id]);
    const planli = Object.values(d.maddeler).some((x) => x.sonraki !== '');
    const hafta = haftaGunu(d.gunler, bugun);

    // Karşılama
    sor(kok, '[data-selam]').textContent = ad ? kalipDoldur(il.selamAd, ad) : il.selam;
    sor(kok, '[data-baslik]').textContent = planli || hafta > 0
      ? (idler.length ? kalipDoldur(il.baslikTekrar, idler.length) : il.baslikYok)
      : il.baslikBos;

    // Bugün tekrar
    const liste = sor<HTMLUListElement>(kok, '[data-tekrar-liste]');
    const sablon = sor<HTMLTemplateElement>(kok, '[data-tekrar-satir]');
    liste.replaceChildren(...idler.slice(0, 12).map((id) => {
      const satir = (sablon.content.cloneNode(true) as DocumentFragment);
      sor(satir, '[data-ad]').textContent = veri.adlar[id];
      const a = sor<HTMLAnchorElement>(satir, '[data-baglanti]');
      a.href = `/${veri.dil}/calis/${id}/`;
      a.setAttribute('aria-label', `${veri.adlar[id]}: ${a.textContent?.trim() ?? ''}`);
      return satir;
    }));
    liste.hidden = idler.length === 0;
    sor(kok, '[data-tekrar-bos]').hidden = idler.length > 0;
    const haftaP = sor(kok, '[data-tekrar-hafta]');
    haftaP.textContent = hafta === 0 ? '' : hafta === 1 ? veri.tm.hafta1 : kalipDoldurAd(veri.tm.haftaN, { k: hafta });
    haftaP.hidden = hafta === 0;

    // Kaldığın yer: son çalışılan madde
    let son: { id: string; ms: number } | null = null;
    for (const x of maddeler) {
      const ms = d.maddeler[x.id]?.son ?? 0;
      if (ms > 0 && (!son || ms > son.ms)) son = { id: x.id, ms };
    }
    const kaldigin = sor<HTMLElement>(kok, '[data-kaldigin-ad]');
    const kaldiginSon = sor(kok, '[data-kaldigin-son]');
    const kaldiginBag = sor<HTMLAnchorElement>(kok, '[data-kaldigin-baglanti]');
    if (son) {
      kaldigin.textContent = veri.adlar[son.id];
      kaldiginSon.textContent = kalipDoldur(il.kaldiginSon, tarihYaz(yerelGun(new Date(son.ms))));
      kaldiginSon.hidden = false;
      kaldiginBag.href = `/${veri.dil}/calis/${son.id}/`;
      sor(kaldiginBag, '[data-kaldigin-dugme]').textContent = il.devamEt;
    }

    // Yollar
    sor(kok, '[data-yol-durum]').textContent = ozet.basladi ? kalipDoldur(il.yolDurumEzber, ozet.basladi) : il.yolDurumYok;

    // Kilim (kendi kipi; hocanın kaydı varsa ana-hoca.ts bunu birleşik kiple değiştirir)
    kilimiDoldur(kok, veri, maddeler, ozet.basladi, kalipDoldurAd(veri.km.ozetBasladi, { n: ozet.basladi, m: ozet.toplam }));
  };

  ciz();

  const durum = await oturumDurumu();
  if (!durum) {
    // Oturum kendiliğinden düşmüş: <html data-oturum> kalktı, ziyaretçi görünümü açıldı.
    return;
  }
  void profilGetir(durum.f).then((p) => {
    if (p?.ad) { ad = p.ad; adiGoster(p.ad); ciz(); }
  }).catch(() => undefined);
  void acilisEsitlemesi().then((s) => { if (s?.durum === 'tamam') ciz(); });

  if (durum.k.ref) {
    try {
      const { hocaKilimi } = await import('./ana-hoca');
      await hocaKilimi(kok, veri, durum.f, durum.k, depo);
    } catch {
      sor(kok, '[data-hoca]').hidden = false;
      sor(kok, '[data-hoca-durum]').textContent = il.hocaYok;
    }
  }
}

/** `{k}` / `{n}` gibi adlı yer tutucular (i18n kalıpları `doldur` biçimindedir). */
function kalipDoldurAd(kalip: string, d: Record<string, string | number>): string {
  return kalip.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));
}

function kilimiDoldur(kok: HTMLElement, veri: AnaVeri, maddeler: KendiMadde[], basladi: number, ozetMetni: string) {
  const alt = sor(kok, '[data-kilim-alt]');
  alt.textContent = basladi ? ozetMetni : veri.il.kilimBos;
  const kilim = kok.querySelector('svg.kl-kendi');
  if (!kilim) return;
  const kayit = new Map(maddeler.map((x) => [x.id, x]));
  for (const g of kilim.querySelectorAll<SVGGElement>('g.kl-oge[data-id]')) {
    const x = kayit.get(g.dataset.id ?? '');
    if (!x) continue;
    g.dataset.doku = String(x.doku);
    g.querySelector('use')?.setAttribute('class', `kl-m kl-k${x.doku}`);
    const baslik = g.querySelector('title');
    if (baslik) baslik.textContent = `${veri.adlar[x.id]}, ${veri.km.dokuMadde[x.doku].replace('{b}', String(x.basamak))}`;
  }
  const aciklama = kilim.querySelector('desc');
  if (aciklama) aciklama.textContent = ozetMetni;
  if (!kilim.hasAttribute('data-tikla')) {
    kilim.setAttribute('data-tikla', '');
    // Hücreye tıklanınca çalışma sayfasına gidilir (klavye ve ekran okuyucu için gerçek bağlantılar «Bugün tekrar» ve Kilimim sayfasındadır).
    kilim.addEventListener('click', (e) => {
      const href = (e.target as Element).closest<SVGGElement>('g.kl-oge[data-href]')?.dataset.href;
      if (href && href.startsWith('/')) window.location.assign(href);
    });
  }
}
