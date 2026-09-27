/** Alt bölüm: altı vakit (TR · FR adlarıyla), sıradaki vakit vurgusu ve iki dilli geri sayım. */
import { SIRA, sureMetni, type Vakit } from '../lib/namaz.ts';
import type { VakitGorunumu } from '../lib/ekran/secim.ts';
import { el } from './gorunum.ts';
import { METIN } from './metinler.ts';

export type VakitAdlari = Record<'tr' | 'fr', Record<string, string>>;

function uyari(kok: HTMLElement, m: { tr: string; fr: string }): void {
  const kutu = el('div', 'vakit-yok');
  kutu.appendChild(el('b', '', m.tr));
  const fr = el('span', 'fr', m.fr);
  fr.setAttribute('lang', 'fr');
  kutu.appendChild(fr);
  kok.appendChild(kutu);
}

export function vakitleriCiz(kok: HTMLElement, v: VakitGorunumu | null, ad: VakitAdlari, saatGecerli: boolean): void {
  kok.textContent = '';
  if (!saatGecerli) return uyari(kok, METIN.saatYok);
  if (!v) return uyari(kok, METIN.vakitYok);
  const adi = (dil: 'tr' | 'fr', vakit: Vakit, uzun = false): string =>
    v.cuma && vakit === 'ogle' ? ad[dil][uzun ? 'cumaUzun' : 'cuma'] : ad[dil][vakit];
  const vurgu = v.siradaki && !v.siradaki.yarinMi ? v.siradaki.vakit : null;
  for (const vakit of SIRA) {
    const satir = el('div', vakit === vurgu ? 'vakit siradaki' : 'vakit');
    satir.setAttribute('data-vakit', vakit);
    const adKutusu = el('span', 'ad');
    adKutusu.appendChild(el('b', '', adi('tr', vakit)));
    const fr = el('i', '', adi('fr', vakit));
    fr.setAttribute('lang', 'fr');
    adKutusu.appendChild(fr);
    satir.appendChild(adKutusu);
    satir.appendChild(el('span', 'deger', v.gun[vakit]));
    kok.appendChild(satir);
  }
  const sayim = el('div', 'geri-sayim');
  const s = v.siradaki;
  if (s) {
    sayim.appendChild(el('b', '', `${adi('tr', s.vakit)} ${METIN.vaktine.tr} ${sureMetni(s.kalanDk, 'tr')}`));
    const fr = el('span', 'fr', `${adi('fr', s.vakit, true)} ${METIN.vaktine.fr} ${sureMetni(s.kalanDk, 'fr')}`);
    fr.setAttribute('lang', 'fr');
    sayim.appendChild(fr);
  }
  kok.appendChild(sayim);
}
