import yayinlar from '../data/diyanet-yayinlar.json';
import type { Dil } from './ui';
const secimler: Record<Dil, string[]> = {
  tr: ['4206', '394', '2286'], fr: [], en: ['3628', '4201', '5115', '3627'],
  nl: ['3620', '4559', '4719', '3619'], de: ['3611', '4191', '3613'],
};
export function egitimKitaplari(dil: Dil) {
  return secimler[dil].map(id => {
    const kitap = yayinlar.yayinlar.find(k => k.id === id && k.dilKodu === dil);
    if (!kitap) throw new Error(`Eğitim kitabı bulunamadı: ${dil}/${id}`);
    return {ad: id === '4719' ? 'Basiskennis over islam' : kitap.baslik, href:kitap.pdf};
  });
}
export const KITAP_NOTU: Record<Dil, string> = {
  tr: 'Türkçe Diyanet yayınlarıyla başlayabilirsiniz. Kitabın Fransızca kaynakları da PDF · FR etiketiyle ayrıca sunulmuştur.',
  fr: 'Ces PDF gratuits sont des publications de la Diyanet en français. Notre bibliothèque propose aussi des ouvrages dans d’autres langues.',
  en: 'Start with these Diyanet publications in English. The handbook’s French resources are also available, labelled PDF · FR.',
  nl: 'Begin met deze Nederlandstalige Diyanet-publicaties. De Franse bronnen van het handboek zijn ook beschikbaar met het label PDF · FR.',
  de: 'Beginnen Sie mit diesen deutschsprachigen Diyanet-Publikationen. Die französischen Quellen des Lehrbuchs sind zusätzlich mit PDF · FR gekennzeichnet.',
};
