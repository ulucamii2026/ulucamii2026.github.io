/**
 * Bilgi kartı sayfası (Dilim 2, 10 Kasım 2026): «Öğrendim» işareti ve mini sınav. Kart ve sorular sunucuda çizilmiştir; burada yalnız davranış var.
 * İşaret cihaza (`etkinAnahtar` kuralı) yazılır, oturum varsa hesapla eşitlenir (scripts/bilgi-ortak.ts). Sınavı doğru çözmek de «öğrendim»
 * sayılır. İşaretler geri alınmaz. Metinler `data-veri` ile gelir (CSP: satır içi betik yok); DOM'a yalnız `textContent` yazılır.
 */
import { OGRENDIM, SINAV, ogrenildi } from '@ortak/lib/ilim-yolu/bilgi-ilerleme';
import { miniSinav } from '@ortak/lib/ilim-yolu/yollar';
import { bilgiIsaretle, bilgiOku, bulutlaEsitle } from './bilgi-ortak';
import { doldur } from './kip-ortak';

interface Veri { id: string; m: { ogrendimOldu: string; kaydedilemedi: string; dogru: string; yanlis: string; secimYok: string; sonucTam: string; sonucEksik: string } }

const kok = document.querySelector<HTMLElement>('[data-kart-sayfa]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: sayfa içeriği yine okunur */
  }
}

function kur(kok: HTMLElement, veri: Veri) {
  const sor = <T extends HTMLElement>(s: string): T | null => kok.querySelector<T>(s);
  const dugme = sor<HTMLButtonElement>('[data-ogrendim]');
  const durum = sor('[data-ogrendim-durum]');

  const goster = (ogrenildi: boolean, yazildi = true) => {
    if (!dugme || !durum) return;
    dugme.setAttribute('aria-pressed', String(ogrenildi));
    durum.classList.toggle('hata', !yazildi);
    durum.textContent = !yazildi ? veri.m.kaydedilemedi : ogrenildi ? veri.m.ogrendimOldu : '';
  };
  const cizim = () => goster(ogrenildi(bilgiOku(), veri.id));
  const isle = (bit: number): boolean => {
    const { yazildi } = bilgiIsaretle(veri.id, bit);
    goster(true, yazildi);
    void bulutlaEsitle(cizim);
    return yazildi;
  };

  cizim();
  void bulutlaEsitle(cizim);
  dugme?.addEventListener('click', () => { isle(OGRENDIM); });

  // ——— Mini sınav ———
  const kontrol = sor<HTMLButtonElement>('[data-kontrol]');
  const yeniden = sor<HTMLButtonElement>('[data-yeniden]');
  const sonuc = sor('[data-sinav-sonuc]');
  const sorular = [...kok.querySelectorAll<HTMLFieldSetElement>('fieldset[data-soru]')];
  if (!kontrol || !sonuc || sorular.length === 0) return;

  const sifirla = () => {
    for (const f of sorular) {
      for (const r of f.querySelectorAll<HTMLInputElement>('input[type="radio"]')) { r.checked = false; r.disabled = false; }
      for (const s of f.querySelectorAll<HTMLElement>('.yl-sik')) s.removeAttribute('data-sonuc');
      const g = f.querySelector<HTMLElement>('[data-geri]');
      if (g) { g.textContent = ''; g.removeAttribute('data-d'); }
    }
    sonuc.textContent = '';
    if (yeniden) yeniden.hidden = true;
    kontrol.hidden = false;
    sorular[0].querySelector<HTMLInputElement>('input')?.focus();
  };
  yeniden?.addEventListener('click', sifirla);

  kontrol.addEventListener('click', () => {
    const secimler = sorular.map((f) => {
      const secili = f.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      return secili ? Number(secili.value) : -1;
    });
    if (secimler.some((s) => s < 0)) { sonuc.textContent = veri.m.secimYok; return; }
    const dogruIndeksler = sorular.map((f) => Number(f.querySelector<HTMLInputElement>('input[data-dogru]')?.value ?? -1));
    const s = miniSinav(dogruIndeksler.map((dogru) => ({ dogru })), secimler);
    sorular.forEach((f, i) => {
      for (const r of f.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
        r.disabled = true;
        const etiket = r.closest<HTMLElement>('.yl-sik');
        if (!etiket) continue;
        if (r.hasAttribute('data-dogru')) etiket.dataset.sonuc = 'dogru';
        else if (r.checked) etiket.dataset.sonuc = 'yanlis';
      }
      const g = f.querySelector<HTMLElement>('[data-geri]');
      if (g) {
        const dogruYazi = f.querySelector<HTMLElement>('input[data-dogru]')?.closest('.yl-sik')?.querySelector('.yazi')?.textContent ?? '';
        g.dataset.d = s.dogru[i] ? 'dogru' : 'yanlis';
        g.textContent = s.dogru[i] ? veri.m.dogru : doldur(veri.m.yanlis, { c: dogruYazi });
      }
    });
    const n = s.dogru.filter(Boolean).length;
    if (s.hepsi) {
      const yazildi = isle(OGRENDIM | SINAV);
      sonuc.textContent = yazildi ? veri.m.sonucTam : `${veri.m.sonucTam} ${veri.m.kaydedilemedi}`;
    } else {
      sonuc.textContent = doldur(veri.m.sonucEksik, { n, m: sorular.length });
    }
    kontrol.hidden = true;
    if (yeniden) { yeniden.hidden = false; yeniden.focus(); }
  });
}
