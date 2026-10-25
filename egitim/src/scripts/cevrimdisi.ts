/**
 * Madde sayfasındaki «İnternetsiz çalışmak için kaydet» kutusu (25 Ekim 2026). Kutu `hidden` gelir; service worker etkinleşip tarayıcı Cache API'yi
 * sunuyorsa açılır (engelli ya da eski tarayıcıda hiç görünmez, sayfa olduğu gibi çalışır). TEK düğme üç iş yapar (kaydet → vazgeç → sil); aynı
 * öğe kaldığı için odak kaybolmaz. Duyurular `role="status"` satırından gider; görünen ilerleme çubuğu ve sayaç ekran okuyucudan gizlidir
 * (her dosyada konuşmasın diye duyuru yalnız başlangıçta, çeyrekte, yarıda, bitişte ve hatada). Kayıt cihazdan çıkmaz: kütüphane yalnız Cache API kullanır.
 */
import { destekleniyor, boyutYaz, kayitBayti, kayitOku, maddeyiKaydet, maddeyiSil, swHazir, type Ilerleme } from '../lib/cevrimdisi-istemci';
import { doldur, type KayitDili } from '../lib/cevrimdisi-ortak';

interface Veri {
  id: string;
  dil: KayitDili;
  ad: string;
  yol: string;
  sesler: string[];
  yerel: string;
  m: Record<'kaydet' | 'vazgec' | 'sil' | 'silEtiket' | 'baslangic' | 'baslangicSessiz' | 'ilerleme' | 'bitti' | 'bittiSessiz'
    | 'kayitli' | 'silindi' | 'vazgecildi' | 'hata' | 'hataKota', string>;
}

const kok = document.querySelector<HTMLElement>('[data-cd]');
if (kok && destekleniyor()) void baslat(kok);

async function baslat(kok: HTMLElement): Promise<void> {
  const v = JSON.parse(kok.dataset.veri ?? '{}') as Veri;
  const { m } = v;
  const dugme = kok.querySelector<HTMLButtonElement>('[data-cd-dugme]')!;
  const kayitli = kok.querySelector<HTMLElement>('[data-cd-kayitli]')!;
  const kayitliMetin = kok.querySelector<HTMLElement>('[data-cd-kayitli-metin]')!;
  const alan = kok.querySelector<HTMLElement>('[data-cd-ilerleme-alan]')!;
  const cubuk = kok.querySelector<HTMLProgressElement>('[data-cd-ilerleme]')!;
  const sayac = kok.querySelector<HTMLElement>('[data-cd-sayac]')!;
  const durum = kok.querySelector<HTMLElement>('[data-cd-durum]')!;
  const cevrimdisiNot = kok.querySelector<HTMLElement>('[data-cd-cevrimdisi]')!;
  let mod: 'kaydet' | 'vazgec' | 'sil' = 'kaydet';
  let iptal: AbortController | null = null;
  let isleniyor = false;
  const sesli = v.sesler.length > 0;

  const bildir = (metin: string) => { durum.textContent = metin; };
  const baglanti = () => {
    const yok = !navigator.onLine;
    cevrimdisiNot.hidden = !yok;
    // Çevrim dışıyken yeni kayıt başlatılamaz (indirilecek bir şey yok); kayıtlıysa «Sil» çalışır (yerel).
    dugme.disabled = yok && mod === 'kaydet';
  };
  const modAyarla = (yeni: typeof mod) => {
    mod = yeni;
    dugme.dataset.mod = yeni;
    dugme.textContent = yeni === 'kaydet' ? m.kaydet : yeni === 'vazgec' ? m.vazgec : m.sil;
    dugme.classList.toggle('birincil', yeni === 'kaydet');
    dugme.classList.toggle('ikincil', yeni !== 'kaydet');
    if (yeni === 'sil') dugme.setAttribute('aria-label', doldur(m.silEtiket, { ad: v.ad }));
    else dugme.removeAttribute('aria-label');
    kayitli.hidden = yeni !== 'sil';
    alan.hidden = yeni !== 'vazgec';
    baglanti();
  };
  const ilerlemeGoster = (i: Ilerleme) => {
    cubuk.max = i.toplam;
    cubuk.value = i.yapilan;
    sayac.textContent = doldur(m.ilerleme, { y: i.yapilan, t: i.toplam, boyut: boyutYaz(i.bayt, v.yerel) });
  };
  const kayitliYaz = (bayt: number) => { kayitliMetin.textContent = `${m.kayitli} · ${boyutYaz(bayt, v.yerel)}`; };

  // Etkin SW yoksa (engelli, kaydedilemedi) söz hiç çözülmez: kutu gizli kalır. Etkinleşince künyeye bakılır.
  await swHazir();
  const mevcut = await kayitOku(v.dil, v.id).catch(() => null);
  if (mevcut) { kayitliYaz(kayitBayti(mevcut)); modAyarla('sil'); } else modAyarla('kaydet');
  kok.hidden = false;
  window.addEventListener('online', baglanti);
  window.addEventListener('offline', baglanti);
  window.addEventListener('pagehide', () => iptal?.abort());

  dugme.addEventListener('click', async () => {
    if (mod === 'vazgec') { iptal?.abort(); return; }
    if (isleniyor) return;
    isleniyor = true;
    try {
      if (mod === 'sil') {
        await maddeyiSil(v.dil, v.id);
        modAyarla('kaydet');
        bildir(m.silindi);
        return;
      }
      iptal = new AbortController();
      let sonCeyrek = 0;
      ilerlemeGoster({ yapilan: 0, toplam: 1 + v.sesler.length, bayt: 0 });
      modAyarla('vazgec');
      bildir(sesli ? doldur(m.baslangic, { n: v.sesler.length }) : m.baslangicSessiz);
      try {
        const k = await maddeyiKaydet({ id: v.id, dil: v.dil, ad: v.ad, yol: v.yol, sesler: v.sesler }, (i) => {
          ilerlemeGoster(i);
          const ceyrek = Math.floor((4 * i.yapilan) / i.toplam);
          if (ceyrek > sonCeyrek && i.yapilan < i.toplam) {
            sonCeyrek = ceyrek;
            bildir(doldur(m.ilerleme, { y: i.yapilan, t: i.toplam, boyut: boyutYaz(i.bayt, v.yerel) }));
          }
        }, iptal.signal);
        kayitliYaz(kayitBayti(k));
        modAyarla('sil');
        bildir(doldur(sesli ? m.bitti : m.bittiSessiz, { boyut: boyutYaz(kayitBayti(k), v.yerel) }));
      } catch (hata) {
        modAyarla('kaydet');
        const e = hata as { name?: string; kod?: string };
        bildir(e.name === 'AbortError' ? m.vazgecildi : e.kod === 'kota' ? m.hataKota : m.hata);
      }
    } finally {
      iptal = null;
      isleniyor = false;
    }
  });
}

export {};
