/**
 * `/<dil>/cevrimdisi/` sayfası (25 Ekim 2026): hem çevrim dışı YEDEK sayfa (service worker, açılamayan sayfa yerine bunu verir) hem kayıt yönetimi.
 * Cache API'den okur, hiçbir şey göndermez: (1) kaydedilen maddeler boyutlarıyla, tek tek «Sil»; (2) bu cihazda açılmış öteki sayfalar (bağlantı);
 * (3) «Hepsini sil» (önce sayfa içi onay). Satırlar DOM yöntemleriyle kurulur (CSP: satır içi betik/stil yok, innerHTML yok). Bağlantı durumu
 * `role="status"` satırında yazılır. Sayfa yedek olarak başka bir adres için gösterildiyse (adres bu sayfanın kendi adresi değilse) açıklama çıkar.
 */
import { acilanSayfalar, boyutYaz, destekleniyor, hepsiniSil, kayitBayti, kayitlariOku, maddeyiSil, toplamBayt, type Kayit } from '../lib/cevrimdisi-istemci';
import { cevrimdisiYolu, doldur } from '../lib/cevrimdisi-ortak';

interface Veri {
  dil: string;
  yerel: string;
  m: Record<'kayitSilindi' | 'sil' | 'silEtiket' | 'ozet' | 'hepsiSilindi' | 'bagVar' | 'bagYok', string>;
}

const kok = document.querySelector<HTMLElement>('[data-cd-sayfa]');
if (kok) void baslat(kok);

async function baslat(kok: HTMLElement): Promise<void> {
  const v = JSON.parse(kok.dataset.veri ?? '{}') as Veri;
  const { m } = v;
  const sec = <T extends HTMLElement>(ad: string) => kok.querySelector<T>(`[data-cd-${ad}]`)!;
  const bag = sec('bag');
  const durum = sec('durum');
  const alan = sec('alan');
  const liste = sec<HTMLUListElement>('kayitlar');
  const bos = sec('bos');
  const ozet = sec('ozet');
  const acilanAlan = sec('acilan-alan');
  const acilanListe = sec<HTMLUListElement>('acilanlar');
  const acilanYok = sec('acilan-yok');
  const hepsi = sec<HTMLButtonElement>('hepsi');
  const onay = sec('onay');
  const evet = sec<HTMLButtonElement>('evet');
  const vazgec = sec<HTMLButtonElement>('vazgec');
  const baslik = sec('kayitlar-baslik');

  // Yedek sayfa başka bir adres için mi gösteriliyor?
  if (location.pathname !== cevrimdisiYolu(v.dil)) sec('istenen').hidden = false;

  const baglantiYaz = () => { bag.textContent = navigator.onLine ? m.bagVar : m.bagYok; };
  baglantiYaz();
  window.addEventListener('online', baglantiYaz);
  window.addEventListener('offline', baglantiYaz);

  if (!destekleniyor()) { sec('desteklenmiyor').hidden = false; return; }

  const satir = (k: Kayit): HTMLLIElement => {
    const li = document.createElement('li');
    li.className = 'cd-satir';
    const ad = document.createElement('a');
    ad.href = k.yol;
    ad.lang = k.dil;
    ad.textContent = k.ad;
    const bilgi = document.createElement('span');
    bilgi.className = 'cd-boyut';
    bilgi.textContent = boyutYaz(kayitBayti(k), v.yerel);
    const dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'secim';
    dugme.textContent = m.sil;
    dugme.setAttribute('aria-label', doldur(m.silEtiket, { ad: k.ad }));
    dugme.addEventListener('click', async () => {
      const sonraki = (li.nextElementSibling?.querySelector('a') ?? li.previousElementSibling?.querySelector('a')) as HTMLElement | null;
      dugme.disabled = true;
      await maddeyiSil(k.dil, k.id);
      durum.textContent = doldur(m.kayitSilindi, { ad: k.ad });
      await yenile();
      (sonraki && sonraki.isConnected ? sonraki : baslik).focus();
    });
    li.append(ad);
    if (k.dil !== v.dil) {
      const etiket = document.createElement('span');
      etiket.className = 'cd-dil';
      etiket.textContent = k.dil.toUpperCase();
      li.append(etiket);
    }
    li.append(bilgi, dugme);
    return li;
  };

  async function yenile(): Promise<void> {
    const kayitlar = await kayitlariOku();
    liste.replaceChildren(...kayitlar.map(satir));
    bos.hidden = kayitlar.length > 0;
    liste.hidden = kayitlar.length === 0;
    ozet.textContent = kayitlar.length ? doldur(m.ozet, { n: kayitlar.length, boyut: boyutYaz(toplamBayt(kayitlar), v.yerel) }) : '';
    hepsi.hidden = !onay.hidden;
    const acilan = await acilanSayfalar(v.dil, new Set(kayitlar.map((k) => k.yol)));
    acilanListe.replaceChildren(...acilan.map((a) => {
      const li = document.createElement('li');
      const bagl = document.createElement('a');
      bagl.href = a.yol;
      bagl.textContent = a.baslik;
      li.append(bagl);
      return li;
    }));
    acilanYok.hidden = acilan.length > 0;
    acilanListe.hidden = acilan.length === 0;
    alan.hidden = false;
    acilanAlan.hidden = false;
    hepsi.disabled = kayitlar.length === 0 && acilan.length === 0;
  }

  hepsi.addEventListener('click', () => { onay.hidden = false; hepsi.hidden = true; evet.focus(); });
  vazgec.addEventListener('click', () => { onay.hidden = true; hepsi.hidden = false; hepsi.focus(); });
  evet.addEventListener('click', async () => {
    evet.disabled = true;
    await hepsiniSil();
    onay.hidden = true;
    evet.disabled = false;
    durum.textContent = m.hepsiSilindi;
    await yenile();
    baslik.focus();
  });

  await yenile();
}

export {};
