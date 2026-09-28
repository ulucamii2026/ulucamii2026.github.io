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

/** `cumaSaati`: sitedeki sabit Cuma namazı saati (SS:DD) ya da boş. Site ile aynı kural
 *  (src/components/NamazVakitleri.tsx): boşsa Cuma günü (Brüksel) öğle satırı "Cuma" olur ve geri sayım Cuma'ya
 *  göre konuşur; doluysa öğle satırı, vurgusu ve geri sayımı öğle olarak kalır, geri sayımın altında ayrı bir
 *  "Cuma namazı SS:DD" satırı (TR + FR alt alta) çıkar. Diğer günlerde ek satır yoktur. Bu saat cemaatin
 *  toplanma saatidir; ekran onu yalnız yazar, hiçbir vakit hesaplamaz ya da türetmez. */
export function vakitleriCiz(kok: HTMLElement, v: VakitGorunumu | null, ad: VakitAdlari, saatGecerli: boolean, cumaSaati = ''): void {
  kok.textContent = '';
  const cumaSatiri = saatGecerli && !!v && v.cuma && cumaSaati !== '';
  kok.classList.toggle('cumali', cumaSatiri); // ek satır için vakit alanı biraz uzar (ekran.css)
  if (!saatGecerli) return uyari(kok, METIN.saatYok);
  if (!v) return uyari(kok, METIN.vakitYok);
  const cumaOgle = v.cuma && cumaSaati === '';
  const adi = (dil: 'tr' | 'fr', vakit: Vakit, uzun = false): string =>
    cumaOgle && vakit === 'ogle' ? ad[dil][uzun ? 'cumaUzun' : 'cuma'] : ad[dil][vakit];
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
  if (cumaSatiri) {
    const cuma = el('div', 'cuma-saati');
    cuma.appendChild(el('b', '', `${ad.tr.cumaUzun} ${cumaSaati}`));
    const fr = el('span', 'fr', `${ad.fr.cumaUzun} ${cumaSaati}`);
    fr.setAttribute('lang', 'fr');
    cuma.appendChild(fr);
    kok.appendChild(cuma);
  }
}
