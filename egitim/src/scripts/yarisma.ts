/**
 * Bilgi Yarışması giriş sayfasının davranışı (10 Kasım 2026): seçime göre kaç soru olduğunu yazar ve «Başlatın» bağlantısını ayar + tohumla
 * günceller (ayar adres çubuğunun `#` kısmında gider; sunucuya, depoya, hesaba hiçbir şey yazılmaz). Soru yoksa bağlantı devre dışı kalır.
 * CSP: satır içi betik/stil yok; DOM'a yalnız `textContent` yazılır.
 */
import { BICIMLER, KONULAR, type Konu } from '@ortak/lib/yarisma/tipler';
import { ADETLER, SEVIYELER, ayarYaz, havuz, type Ayar, type Kunye, type Seviye } from '@ortak/lib/yarisma/tur';
import { doldur } from './kip-ortak';

interface Veri { ozet: Kunye[]; oynaYolu: string; m: { sayim: string; sayimAz: string; sayimYok: string } }

const kok = document.querySelector<HTMLElement>('[data-ya-hub]');
if (kok) {
  let veri: Veri | null = null;
  try { veri = JSON.parse(kok.dataset.veri ?? '') as Veri; } catch { veri = null; }
  const bag = kok.querySelector<HTMLAnchorElement>('[data-basla]');
  const sayimYeri = kok.querySelector<HTMLElement>('[data-sayim]');
  const tohum = Math.floor(Math.random() * 0xffffffff).toString(36);

  const secili = (ad: string): string => kok.querySelector<HTMLInputElement>(`input[name="${ad}"]:checked`)?.value ?? '';
  const ayarOku = (): Ayar => {
    const b = secili('bicim');
    const sev = secili('seviye') as Seviye;
    const adet = Number(secili('adet'));
    return {
      bicim: b === 'karisik' || (BICIMLER as readonly string[]).includes(b) ? (b as Ayar['bicim']) : 'karisik',
      konular: [...kok.querySelectorAll<HTMLInputElement>('input[name="konu"]:checked')].map((x) => x.value).filter((x): x is Konu => (KONULAR as readonly string[]).includes(x)),
      seviye: SEVIYELER.includes(sev) ? sev : '1-2',
      adet: (ADETLER as readonly number[]).includes(adet) ? adet : 10,
      tohum,
    };
  };

  const yenile = () => {
    if (!veri || !bag) return;
    const a = ayarOku();
    const n = havuz(veri.ozet, a).length;
    const yok = n === 0;
    bag.href = `${veri.oynaYolu}#${ayarYaz(a)}`;
    bag.setAttribute('aria-disabled', yok ? 'true' : 'false');
    bag.classList.toggle('devre-disi', yok);
    if (sayimYeri) sayimYeri.textContent = yok ? veri.m.sayimYok : doldur(n < a.adet ? veri.m.sayimAz : veri.m.sayim, { n });
  };
  kok.addEventListener('change', yenile);
  bag?.addEventListener('click', (o) => { if (bag.getAttribute('aria-disabled') === 'true') o.preventDefault(); });
  yenile();
}

