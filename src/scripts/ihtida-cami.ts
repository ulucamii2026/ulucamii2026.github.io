import { adNormalle } from './form-cekirdek';
import type { CamiMetinleri } from '../i18n/cami-secimi';

export interface CamiBilgisi { id: string; ad: string; sehir: string; postaKodu: string; adres: string; kurum: string }
const VARSAYILAN = 'ulucamii-marche';

/** Arama adayları kayıtlı seçimi değiştirmez; yalnız açık seçim düğmesi değiştirir. */
export function camiSeciminiBaslat(form: HTMLFormElement) {
  const camiler = JSON.parse(form.querySelector('[data-cami-katalog]')?.textContent || '[]') as CamiBilgisi[];
  const m = JSON.parse(form.querySelector('[data-cami-metin]')?.textContent || '{}') as CamiMetinleri;
  const kimlik = form.querySelector<HTMLInputElement>('input[name="camiId"]')!;
  const ara = form.querySelector<HTMLInputElement>('#i-cami-ara')!;
  const liste = form.querySelector<HTMLSelectElement>('#i-cami-liste')!;
  const detay = form.querySelector<HTMLDetailsElement>('[data-cami-degistir]')!;
  const dugme = form.querySelector<HTMLButtonElement>('[data-cami-sec]')!;
  const sahitSecim = form.querySelector<HTMLInputElement>('#i-sahit-ekle')!;
  const sahitler = [1, 2].map(i => form.querySelector<HTMLInputElement>(`#i-sahit-${i}`)!);
  const yardim = form.querySelector<HTMLElement>('#i-sahit-yardim')!;
  const eskiYardim = yardim.textContent || '';
  const farkli = () => kimlik.value !== VARSAYILAN;
  const ad = (c: CamiBilgisi) => `${c.ad} · ${c.sehir}`;
  const alan = (key: string) => form.querySelector<HTMLInputElement>(`[name="camiDiger.${key}"]`)?.value.trim() || '';
  const veri = (): CamiBilgisi => {
    if (kimlik.value === 'diger') return { id: 'diger', ad: alan('ad'), sehir: alan('sehir'), postaKodu: alan('postaKodu'), adres: alan('adres'), kurum: '' };
    const bulunan = camiler.find(c => c.id === kimlik.value);
    return bulunan ? { id: bulunan.id, ad: bulunan.ad, sehir: bulunan.sehir, postaKodu: bulunan.postaKodu, adres: bulunan.adres, kurum: bulunan.kurum }
      : { id: kimlik.value, ad: '', sehir: '', postaKodu: '', adres: '', kurum: '' };
  };
  const gorunumuYenile = () => {
    const c = veri();
    form.querySelector('[data-cami-ad]')!.textContent = c.ad ? ad(c) : m.digerOzet;
    form.querySelector('[data-cami-adres]')!.textContent = [c.adres, [c.postaKodu, c.sehir].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const diger = farkli();
    form.querySelector<HTMLElement>('[data-sahit-secim]')!.hidden = diger;
    form.querySelectorAll<HTMLElement>('[data-sahit-istege]').forEach(el => { el.hidden = diger; });
    form.querySelector<HTMLElement>('[data-sahit-2-zorunlu]')!.hidden = !diger;
    sahitler[1].required = diger;
    yardim.textContent = diger ? m.sahit : eskiYardim;
    if (diger && !sahitSecim.checked) {
      sahitSecim.checked = true;
      sahitSecim.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  const filtrele = () => {
    const aranan = adNormalle(ara.value).split(/\s+/).filter(Boolean);
    const adaylar = camiler.filter(c => {
      const metin = adNormalle(`${c.ad} ${c.sehir} ${c.postaKodu}`);
      return aranan.every(kelime => metin.includes(kelime));
    });
    liste.replaceChildren(...adaylar.map(c => new Option(`${c.ad} — ${c.postaKodu} ${c.sehir}`, c.id)));
    if (adaylar.some(c => c.id === kimlik.value)) liste.value = kimlik.value;
    else if (adaylar.length) liste.selectedIndex = 0;
    liste.disabled = !adaylar.length;
    dugme.disabled = !adaylar.length;
    form.querySelector('[id="i-cami-sonuc"]')!.textContent = adaylar.length ? m.sonuc.replace('{sayi}', String(adaylar.length)) : m.bulunamadi;
  };
  const sec = (id: string) => {
    if (id !== 'diger' && !camiler.some(c => c.id === id)) return;
    if (kimlik.value !== id) {
      // Başka caminin önceki şahitleri yeni camiye sessizce taşınmaz.
      sahitler.forEach(input => { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); });
      sahitSecim.checked = id !== VARSAYILAN;
    }
    kimlik.value = id;
    gorunumuYenile();
    kimlik.dispatchEvent(new Event('change', { bubbles: true }));
    kimlik.dispatchEvent(new Event('input', { bubbles: true }));
    detay.open = false;
    if (id === 'diger') form.querySelector<HTMLInputElement>('#i-cami-ad')?.focus();
    else detay.querySelector('summary')?.focus();
  };
  ara.addEventListener('input', filtrele);
  ara.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); liste.focus(); } });
  liste.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); sec(liste.value); } });
  dugme.addEventListener('click', () => sec(liste.value));
  form.querySelector('[data-cami-elle]')!.addEventListener('click', () => sec('diger'));
  detay.addEventListener('keydown', event => { if (event.key === 'Escape') { detay.open = false; detay.querySelector('summary')?.focus(); } });
  sahitSecim.addEventListener('change', () => { if (farkli() && !sahitSecim.checked) { sahitSecim.checked = true; } });
  form.addEventListener('input', event => { if ((event.target as HTMLInputElement).name?.startsWith('camiDiger.')) gorunumuYenile(); });
  form.addEventListener('reset', () => queueMicrotask(() => {
    kimlik.value = VARSAYILAN; ara.value = ''; detay.open = false;
    gorunumuYenile(); filtrele();
    kimlik.dispatchEvent(new Event('change', { bubbles: true }));
  }));
  return {
    veri, farkli,
    hazir: () => { gorunumuYenile(); filtrele(); },
    dogrula: (): Array<[string, string]> => {
      const hatalar: Array<[string, string]> = [];
      if (!veri().ad && kimlik.value !== 'diger') { detay.open = true; hatalar.push(['camiId', m.secimHata]); }
      if (kimlik.value === 'diger' && !/^[1-9]\d{3}$/.test(alan('postaKodu'))) hatalar.push(['camiDiger.postaKodu', m.postaHata]);
      if (farkli()) {
        sahitler.forEach(input => { if (!input.value.trim()) hatalar.push([input.name, m.sahitEksik]); });
        if (sahitler[0].value.trim() && adNormalle(sahitler[0].value) === adNormalle(sahitler[1].value)) hatalar.push(['sahit.2', m.sahitAyni]);
      }
      return hatalar;
    },
    ozet: () => { const c = veri(); return [c.ad, c.adres, c.postaKodu, c.sehir].filter(Boolean).join(' · '); },
  };
}
