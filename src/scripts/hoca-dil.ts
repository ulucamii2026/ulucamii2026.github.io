/**
 * Hoca ekranı dil seçici (12 Kasım 2026): ekranın üstünde küçük, klavyeyle kullanılan bir seçim kutusu (tr · fr · en · nl · de).
 * Seçim cihazda saklanır (src/i18n/hoca.ts) ve sayfa yeniden yüklenir: ekranın bütün parçaları aynı dille baştan çizilir.
 * Seçici `#hoca-ekrani`nın DIŞINDA durur; ekran her yeniden çizildiğinde (innerHTML) kaybolmaz. Satır içi betik/stil yok (CSP aynı).
 */
import { HOCA_DILLERI, HOCA_DIL_ADI, hocaDili, hocaDiliKaydet, hocaDiliUygula } from '../i18n/hoca';
import { tc } from '../i18n/hoca-metin/cekirdek';
import type { Dil } from '../i18n/ui';

export function hocaDiliBaslat(kok: HTMLElement): void {
  hocaDiliUygula();
  const dil = hocaDili();
  if (dil !== 'tr') { const y = kok.querySelector<HTMLElement>('p.not'); if (y) y.textContent = tc('yukleniyor'); }
  if (document.getElementById('hoca-dil')) return;
  const kutu = document.createElement('div');
  kutu.className = 'hoca-dil';
  kutu.id = 'hoca-dil';
  const etiket = document.createElement('label');
  etiket.htmlFor = 'hoca-dil-sec';
  etiket.textContent = tc('dil.etiket');
  const sec = document.createElement('select');
  sec.id = 'hoca-dil-sec';
  for (const d of HOCA_DILLERI) {
    const o = document.createElement('option');
    o.value = d; o.lang = d; o.textContent = HOCA_DIL_ADI[d]; o.selected = d === dil;
    sec.append(o);
  }
  sec.addEventListener('change', () => {
    const yeni = sec.value as Dil;
    if (yeni === hocaDili()) return;
    hocaDiliKaydet(yeni);
    location.reload();
  });
  kutu.append(etiket, sec);
  kok.before(kutu);
}
