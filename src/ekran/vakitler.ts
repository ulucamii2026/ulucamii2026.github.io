/** Alt bölüm: altı vakit (TR · FR adlarıyla), sıradaki vakit vurgusu ve iki dilli geri sayım. */
import { SIRA, sureMetni, type Vakit } from '../lib/namaz.ts';
import type { VakitGorunumu } from '../lib/ekran/secim.ts';
import { el } from './gorunum.ts';
import { METIN, VAKIT_ADLARI } from './metinler.ts';

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
 *  toplanma saatidir; ekran onu yalnız yazar, hiçbir vakit hesaplamaz ya da türetmez.
 *
 *  `yatay`: yatay düzende (#ekran[data-duzen=yatay]) sıradaki vakit satırı büyük bir blok olur ve geri sayımı kendi
 *  içinde taşır (dikeyde geri sayım satırların altında ayrı durur). Yatsıdan sonra sıradaki vakit yarının imsakıdır:
 *  dikey düzen onu vurgulamaz, yatay blok yarının imsak saatini «Yarın · Demain» etiketiyle gösterir. */
export function vakitleriCiz(kok: HTMLElement, v: VakitGorunumu | null, ad: VakitAdlari, saatGecerli: boolean, cumaSaati = '', yatay = false): void {
  kok.textContent = '';
  const cumaSatiri = saatGecerli && !!v && v.cuma && cumaSaati !== '';
  kok.classList.toggle('cumali', cumaSatiri); // ek satır için vakit alanı biraz uzar (ekran.css)
  if (!saatGecerli) return uyari(kok, METIN.saatYok);
  if (!v) return uyari(kok, METIN.vakitYok);
  const cumaOgle = v.cuma && cumaSaati === '';
  // Sayfa verisinde bir ad eksikse anahtar anahtar ekranın güvenli varsayılanı (metinler.ts → VAKIT_ADLARI), o da
  // yoksa boş metin yazılır; ekrana hiçbir koşulda "undefined" çıkmaz.
  const sozluk = (dil: 'tr' | 'fr', anahtar: string): string => ad[dil][anahtar] ?? VAKIT_ADLARI[dil][anahtar] ?? '';
  const adi = (dil: 'tr' | 'fr', vakit: Vakit, uzun = false): string =>
    uzun && vakit === 'gunes' ? METIN.gunesUzun[dil]
      : cumaOgle && vakit === 'ogle' ? sozluk(dil, uzun ? 'cumaUzun' : 'cuma') : sozluk(dil, vakit);
  const vurgu = v.siradaki && (yatay || !v.siradaki.yarinMi) ? v.siradaki.vakit : null;
  const yarinSaat = yatay && v.siradaki && v.siradaki.yarinMi ? v.siradaki.saat : null; // yarının imsakı (yatsıdan sonra)
  for (const vakit of SIRA) {
    const satir = el('div', vakit === vurgu ? 'vakit siradaki' : 'vakit');
    satir.setAttribute('data-vakit', vakit);
    const adKutusu = el('span', 'ad');
    adKutusu.appendChild(el('b', '', adi('tr', vakit)));
    const fr = el('i', '', adi('fr', vakit));
    fr.setAttribute('lang', 'fr');
    adKutusu.appendChild(fr);
    satir.appendChild(adKutusu);
    // Yatsıdan sonraki vurgulu imsak satırı yarının imsakını gösterir; bugünün imsak saati o satırda yanıltırdı.
    const yarinSatiri = yarinSaat !== null && vakit === vurgu;
    if (yarinSatiri) {
      const yarin = el('small', 'yarin'); // « · » ayırıcısı ekran.css'te (.hicri::before gibi)
      yarin.appendChild(el('span', '', METIN.yarin.tr));
      const yarinFr = el('span', 'fr', METIN.yarin.fr);
      yarinFr.setAttribute('lang', 'fr');
      yarin.appendChild(yarinFr);
      adKutusu.appendChild(yarin);
    }
    satir.appendChild(el('span', 'deger', yarinSatiri && yarinSaat !== null ? yarinSaat : v.gun[vakit]));
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
  // Yatayda geri sayım vurgulu satırın içine girer (.deger'den sonra); vurgulu satır yoksa (veri boşluğu)
  // ya da dikeyde satırların altında kalır. Her durumda tek .geri-sayim vardır.
  const blok = yatay ? kok.querySelector('.vakit.siradaki') : null;
  (blok || kok).appendChild(sayim);
  if (cumaSatiri) {
    const cuma = el('div', 'cuma-saati');
    cuma.appendChild(el('b', '', `${sozluk('tr', 'cumaUzun')} ${cumaSaati}`));
    const fr = el('span', 'fr', `${sozluk('fr', 'cumaUzun')} ${cumaSaati}`);
    fr.setAttribute('lang', 'fr');
    cuma.appendChild(fr);
    kok.appendChild(cuma);
  }
}
