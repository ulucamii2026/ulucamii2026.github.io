/**
 * Gizlilik sayfası (egitim.ulucamii.be/<dil>/gizlilik/, 11 Kasım 2026) çerçeve metinleri. Sayfanın ASIL metni ana sitenin
 * src/content/sayfalar/<dil>/gizlilik.md dosyasından gelir (kopyalanmaz); burada yalnız başlık, giriş ve bağlantı etiketleri vardır.
 * Türkçe «siz»; Fransızca «vous», Hollandaca «u», Almanca «Sie». Fransızca metin düz boşlukla yazılır, `fransizTipografi` ince boşluk koyar.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface GizlilikMetinleri {
  baslik: string;
  aciklama: string;
  giris: string;
  tamMetin: string;
  tamMetinNot: string;
  iletisimBaslik: string;
  iletisimNot: string;
}

const GIZLILIK: Record<Dil, GizlilikMetinleri> = {
  tr: {
    baslik: 'Gizlilik',
    aciklama: 'İlim Yolu ve Ezber Kilimi’nde kişisel verilerin nasıl ele alındığı: hesapsız kullanım, isteğe bağlı hesap, çocuk hesapları ve haklarınız.',
    giris: 'Bu sayfa, tam gizlilik metninin İlim Yolu’nu ve hesapları ilgilendiren bölümlerini gösterir. Metin, ulucamii.be’deki gizlilik metniyle aynı kaynaktan gelir; ikisi birbirinden ayrılmaz.',
    tamMetin: 'Tam gizlilik metnini ulucamii.be’de okuyun',
    tamMetinNot: 'Web sitesi, kayıt formları, veli portalı ve diğer hizmetler için tam metin orada.',
    iletisimBaslik: 'İletişim',
    iletisimNot: 'Sorularınız ve haklarınızı kullanmak için:',
  },
  fr: {
    baslik: 'Confidentialité',
    aciklama: 'Comment les données personnelles sont traitées dans le Chemin du savoir et le kilim de mémorisation : usage sans compte, compte facultatif, comptes d’enfants et vos droits.',
    giris: 'Cette page présente les parties de la notice de confidentialité complète qui concernent le Chemin du savoir et les comptes. Le texte provient de la même source que la notice publiée sur ulucamii.be ; les deux ne peuvent donc pas diverger.',
    tamMetin: 'Lire la notice complète sur ulucamii.be',
    tamMetinNot: 'La notice complète couvre aussi le site web, les formulaires d’inscription, le portail des parents et les autres services.',
    iletisimBaslik: 'Contact',
    iletisimNot: 'Pour toute question ou pour exercer vos droits :',
  },
  en: {
    baslik: 'Privacy',
    aciklama: 'How personal data is handled in Path of Knowledge and the memorisation kilim: use without an account, optional account, children’s accounts and your rights.',
    giris: 'This page shows the parts of the full privacy notice that concern Path of Knowledge and accounts. The text comes from the same source as the notice on ulucamii.be, so the two cannot drift apart.',
    tamMetin: 'Read the full privacy notice on ulucamii.be',
    tamMetinNot: 'The full notice also covers the website, registration forms, the parents’ portal and other services.',
    iletisimBaslik: 'Contact',
    iletisimNot: 'For questions or to exercise your rights:',
  },
  nl: {
    baslik: 'Privacy',
    aciklama: 'Hoe persoonsgegevens worden verwerkt in Weg van kennis en de memorisatiekelim: gebruik zonder account, optioneel account, kinderaccounts en uw rechten.',
    giris: 'Deze pagina toont de delen van de volledige privacyverklaring die Weg van kennis en accounts aangaan. De tekst komt uit dezelfde bron als de verklaring op ulucamii.be, zodat beide nooit uit elkaar lopen.',
    tamMetin: 'Lees de volledige privacyverklaring op ulucamii.be',
    tamMetinNot: 'De volledige verklaring dekt ook de website, de inschrijvingsformulieren, het ouderportaal en andere diensten.',
    iletisimBaslik: 'Contact',
    iletisimNot: 'Voor vragen of om uw rechten uit te oefenen:',
  },
  de: {
    baslik: 'Datenschutz',
    aciklama: 'Wie personenbezogene Daten im Weg des Wissens und im Memorier-Kelim behandelt werden: Nutzung ohne Konto, optionales Konto, Kinderkonten und Ihre Rechte.',
    giris: 'Diese Seite zeigt die Teile der vollständigen Datenschutzerklärung, die den Weg des Wissens und die Konten betreffen. Der Text stammt aus derselben Quelle wie die Erklärung auf ulucamii.be, beide können also nicht auseinanderlaufen.',
    tamMetin: 'Vollständige Datenschutzerklärung auf ulucamii.be lesen',
    tamMetinNot: 'Die vollständige Erklärung betrifft auch die Website, die Anmeldeformulare, das Elternportal und weitere Dienste.',
    iletisimBaslik: 'Kontakt',
    iletisimNot: 'Bei Fragen oder zur Ausübung Ihrer Rechte:',
  },
};

const HAZIR: Record<Dil, GizlilikMetinleri> = {
  ...GIZLILIK,
  fr: Object.fromEntries(Object.entries(GIZLILIK.fr).map(([k, v]) => [k, fransizTipografi(v)])) as unknown as GizlilikMetinleri,
};

export const gizlilikMetinleri = (dil: Dil): GizlilikMetinleri => HAZIR[dil];
