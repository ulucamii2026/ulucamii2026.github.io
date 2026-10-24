/**
 * Basılı ezber kartı metinleri (Faz 2e, 24 Ekim 2026): «Kartı yazdır» düğmesi ve yalnız kâğıtta görünen satırlar. Dinî metin
 * değil, arayüz metnidir. Kartın kendisi madde sayfasıdır; yazdırma stili egitim/src/styles/kart.css'tedir.
 */
import type { Dil } from '@ortak/i18n/ui';

export interface KartMetinleri {
  /** Sayfadaki düğme. */
  yazdir: string;
  /** Kâğıt üstündeki küçük başlık şeridi (kurs adının yanında). */
  kart: string;
  /** Kare kodun altındaki yönerge. */
  okut: string;
}

const KART: Record<Dil, KartMetinleri> = {
  tr: { yazdir: 'Kartı yazdır', kart: 'Ezber kartı', okut: 'Dinlemek ve çalışmak için kare kodu telefonunuzla okutun.' },
  fr: { yazdir: 'Imprimer la fiche', kart: 'Fiche de mémorisation', okut: 'Scannez le code avec votre téléphone pour écouter et travailler.' },
  en: { yazdir: 'Print the card', kart: 'Memorisation card', okut: 'Scan the code with your phone to listen and practise.' },
  nl: { yazdir: 'Kaart afdrukken', kart: 'Memoriseerkaart', okut: 'Scan de code met uw telefoon om te luisteren en te oefenen.' },
  de: { yazdir: 'Karte drucken', kart: 'Lernkarte zum Auswendiglernen', okut: 'Scannen Sie den Code mit Ihrem Telefon, um zuzuhören und zu üben.' },
};

export const kartMetinleri = (dil: Dil): KartMetinleri => KART[dil];
