/** İhtida Başvuru Formu — TR/FR/EN metin sözlüğü + seçenek listeleri.
 *  Saf veri dosyası (JSX yok); .tsx uzantısı yalnızca "Ihtida*" dosya adı kuralına uymak içindir. */
import type { Dil } from '../i18n/ui';

/** Geriye dönük uyumluluk için korunan takma ad — site genelindeki `Dil` ile aynıdır. */
export type FormDil = Dil;
export type { Dil };

export interface SecenekOgesi { deger: string; etiket: Record<Dil, string> }

export const CINSIYET_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'kadin', etiket: { tr: 'Kadın', fr: 'Femme', en: 'Female' } },
  { deger: 'erkek', etiket: { tr: 'Erkek', fr: 'Homme', en: 'Male' } },
];

export const ONCEKI_DIN_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'hristiyan-katolik', etiket: { tr: 'Hristiyan — Katolik', fr: 'Chrétien — Catholique', en: 'Christian — Catholic' } },
  { deger: 'hristiyan-protestan', etiket: { tr: 'Hristiyan — Protestan', fr: 'Chrétien — Protestant', en: 'Christian — Protestant' } },
  { deger: 'hristiyan-ortodoks', etiket: { tr: 'Hristiyan — Ortodoks', fr: 'Chrétien — Orthodoxe', en: 'Christian — Orthodox' } },
  { deger: 'musevi', etiket: { tr: 'Musevi', fr: 'Juif', en: 'Jewish' } },
  { deger: 'inancsiz', etiket: { tr: 'İnançsız / Ateist', fr: 'Sans religion / Athée', en: 'No religion / Atheist' } },
  { deger: 'diger', etiket: { tr: 'Diğer', fr: 'Autre', en: 'Other' } },
];

export const OGRENIM_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'ilkogretim', etiket: { tr: 'İlköğretim', fr: 'Primaire', en: 'Primary education' } },
  { deger: 'lise', etiket: { tr: 'Lise', fr: 'Secondaire', en: 'Secondary education' } },
  { deger: 'onlisans', etiket: { tr: 'Ön lisans', fr: 'Bachelier (court)', en: 'Associate degree' } },
  { deger: 'lisans', etiket: { tr: 'Lisans', fr: 'Bachelier / Master', en: 'Bachelor’s / Master’s degree' } },
  { deger: 'lisansustu', etiket: { tr: 'Lisansüstü', fr: 'Études supérieures (3e cycle)', en: 'Postgraduate studies' } },
];

export const MEDENI_HAL_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'bekar', etiket: { tr: 'Bekâr', fr: 'Célibataire', en: 'Single' } },
  { deger: 'evli', etiket: { tr: 'Evli', fr: 'Marié(e)', en: 'Married' } },
  { deger: 'bosanmis', etiket: { tr: 'Boşanmış', fr: 'Divorcé(e)', en: 'Divorced' } },
  { deger: 'dul', etiket: { tr: 'Dul', fr: 'Veuf / Veuve', en: 'Widowed' } },
];

export const TOREN_DILI_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'tr', etiket: { tr: 'Türkçe', fr: 'Turc', en: 'Turkish' } },
  { deger: 'fr', etiket: { tr: 'Fransızca', fr: 'Français', en: 'French' } },
  { deger: 'nl', etiket: { tr: 'Felemenkçe', fr: 'Néerlandais', en: 'Dutch' } },
  { deger: 'en', etiket: { tr: 'İngilizce', fr: 'Anglais', en: 'English' } },
];

export const HABERDAR_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'arkadas', etiket: { tr: 'Arkadaş / Tanıdık', fr: 'Ami(e) / Connaissance', en: 'Friend / Acquaintance' } },
  { deger: 'internet', etiket: { tr: 'İnternet / Site', fr: 'Internet / Site web', en: 'Internet / Website' } },
  { deger: 'sosyal-medya', etiket: { tr: 'Sosyal medya', fr: 'Réseaux sociaux', en: 'Social media' } },
  { deger: 'cami', etiket: { tr: 'Camiye daha önce geldim', fr: 'Déjà visité la mosquée', en: 'Visited the mosque before' } },
  { deger: 'diger', etiket: { tr: 'Diğer', fr: 'Autre', en: 'Other' } },
];

export const BELGE_TURU_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'kimlik', etiket: { tr: 'Kimlik kartı (ön + arka gerekli)', fr: 'Carte d’identité (recto + verso requis)', en: 'ID card (front + back required)' } },
  { deger: 'pasaport', etiket: { tr: 'Pasaport (yalnızca kimlik sayfası)', fr: 'Passeport (page d’identité uniquement)', en: 'Passport (identity page only)' } },
];

/* Sıra: belge yükleme öne alınmıştır (İleri'ye basınca kimlik otomatik taranır ve
 * bir sonraki adım — Kimlik Bilgileri — okunan verilerle önceden doldurulmuş gelir). */
export const ADIM_BASLIKLARI: Record<Dil, string[]> = {
  tr: ['Hoş Geldiniz', 'Belge Yükleme', 'Kimlik Bilgileri', 'İletişim ve Adres', 'Tören Tercihi', 'Rıza Metni', 'İmza', 'Özet ve Gönder'],
  fr: ['Bienvenue', 'Documents à joindre', 'Informations personnelles', 'Contact et adresse', 'Préférences pour la cérémonie', 'Consentement', 'Signature', 'Résumé et envoi'],
  en: ['Welcome', 'Documents to Upload', 'Personal Information', 'Contact & Address', 'Ceremony Preferences', 'Consent', 'Signature', 'Summary & Submit'],
};

export interface Metinler {
  baslik: string;
  girisBaslik: string;
  girisMetin1: string;
  girisMetin2: string;
  girisUyari: string;
  devamEt: string;
  geri: string;
  ileri: string;
  adimSayaci: (simdi: number, toplam: number) => string;

  // kimlik
  soyad: string;
  adlar: string;
  cinsiyet: string;
  dogumTarihi: string;
  dogumYeri: string;
  uyruk: string;
  belgeNo: string;
  ulusalNo: string;
  belgeNoDogrulanamadi: string;
  belgeGecerlilikTarihi: string;
  tcVatandasi: string;
  tcKimlikNo: string;
  oncekiDin: string;
  oncekiDinDiger: string;
  ogrenimDurumu: string;
  anneAdi: string;
  babaAdi: string;
  medeniHali: string;
  meslek: string;
  opsiyonelBolum: string;
  yasUyari: string;
  kimlikBilgileriAciklama: string;
  mrzRozet: string;

  // iletişim
  eposta: string;
  telefon: string;
  adres: string;
  adresYerTutucu: string;

  // tören
  ihtidaSebebi: string;
  ihtidaSebebiYerTutucu: string;
  yeniIsim: string;
  yeniIsimNot: string;
  torenDili: string;
  torenTarihi: string;
  torenTarihiNot: string;
  nasilHaberdar: string;
  ekNot: string;

  // belge yükleme
  belgeYuklemeAciklama: string;
  belgeTuru: string;
  kimlikOn: string;
  kimlikArka: string;
  vesikalik: string;
  dosyaSec: string;
  dosyaDegistir: string;
  dosyaYuklendi: string;
  dosyaYok: string;
  dosyaIsleniyor: string;
  dosyaCokBuyuk: string;
  dosyaGecersiz: string;
  kameraIleCek: string;
  galeridenYukle: string;
  dosyaKaldirEt: string;
  surukleBirak: string;
  henuzEklenmedi: string;
  gorselEklendi: string;

  // MRZ otomatik okuma
  mrzTaraButonu: string;
  mrzTaraniyor: string;
  mrzTaraniyorYuzde: (yuzde: number) => string;
  mrzBasarili: (adet: number) => string;
  mrzBasariliDegisiklikYok: string;
  mrzBasarisiz: string;
  mrzHenuzYok: string;
  duzenle: string;

  // rıza
  rizaBaslik: string;
  rizaOzet: string;
  rizaTamMetin: string;
  rizaOnay: string;
  hurIradeOnay: string;
  fotografIzniBaslik: string;
  fotografIzniMetin: string;
  fotografIzniOnay: string;
  gdprNot: string;

  // imza
  imzaBaslik: string;
  imzaAciklama: string;
  imzaTemizle: string;
  imzaGeriAl: string;
  imzaYenidenImzala: string;
  imzaBos: string;
  imzaKisa: string;
  imzaYazarak: string;
  imzaYazarakEtiket: string;
  imzaYazarakOnay: string;

  // şahitler (isteğe bağlı) — EK-9 belgesindeki "ŞAHİT / WITNESS" alanları
  sahitBaslik: string;
  sahitAciklama: string;
  sahitAc: string;
  sahitAdEtiket: (sira: number) => string;
  sahitImzaBaslik: (sira: number) => string;
  sahitImzaAciklama: string;
  sahitEksikNot: string;
  sahitAdBos: string;
  sahitImzaBos: string;
  sahitOzet: string;
  sahitYok: string;

  // özet
  ozetBaslik: string;
  beyanCumlesi: string;
  gonder: string;
  gonderiliyor: string;
  hazirlaniyor: string;
  tekrarDene: string;

  // hata mesajları
  zorunluAlan: string;
  gecersizEposta: string;
  gecersizTelefon: string;
  gecersizKimlikNo: string;
  onayGerekli: string;

  // gönderim sonucu
  basariBaslik: string;
  basariMetin: (ref: string) => string;
  basariPdfNot: string;
  yeniBasvuru: string;

  // hata / yedek yollar
  gonderimHataBaslik: string;
  servisYokBaslik: string;
  servisYok: string;
  gonderimBasarisiz: string;
  cokBuyuk: string;
  yedekBaslik: string;
  yedekIndir: string;
  yedekEposta: string;
  yedekWhatsapp: string;

  pdfBaslik: string;
  pdfAltBaslik: string;
  pdfOnBasvuruUyari: string;
  pdfBilgilendirme: string;
  pdfIletisim: string;
  pdfFiligran: string;
}

export function metinler(dil: Dil): Metinler {
  if (dil === 'fr') {
    return {
      baslik: 'Demande de conversion à l’islam',
      girisBaslik: 'Avant de commencer',
      girisMetin1: 'Ce formulaire constitue une pré-demande d’attestation de conversion (EK-9). Vos informations sont transmises uniquement à notre mosquée et, si nécessaire, au Conseiller des Affaires sociales de l’Ambassade de Turquie à Bruxelles.',
      girisMetin2: 'Vous pouvez remplir ce formulaire en plusieurs fois : votre brouillon est conservé automatiquement sur cet appareil.',
      girisUyari: 'Ce formulaire est réservé aux personnes majeures (18 ans et plus). Si vous avez moins de 18 ans, veuillez contacter directement notre imam.',
      devamEt: 'Commencer',
      geri: 'Précédent',
      ileri: 'Suivant',
      adimSayaci: (simdi, toplam) => `Étape ${simdi} / ${toplam}`,

      soyad: 'Nom de famille',
      adlar: 'Prénom(s)',
      cinsiyet: 'Genre',
      dogumTarihi: 'Date de naissance',
      dogumYeri: 'Lieu de naissance',
      uyruk: 'Nationalité',
      ulusalNo: 'Numéro national (Registre national)',
      belgeNoDogrulanamadi: 'Lu sur la carte mais non vérifié — veuillez le comparer avec votre carte.',
      belgeNo: 'Numéro de la carte / du document (facultatif)',
      belgeGecerlilikTarihi: 'Date de validité du document (facultatif)',
      tcVatandasi: 'Je suis citoyen(ne) turc(que)',
      tcKimlikNo: 'Numéro d’identité turc (11 chiffres)',
      oncekiDin: 'Religion / confession précédente',
      oncekiDinDiger: 'Précisez',
      ogrenimDurumu: 'Niveau d’études (facultatif)',
      anneAdi: 'Prénom de la mère (facultatif)',
      babaAdi: 'Prénom du père (facultatif)',
      medeniHali: 'État civil (facultatif)',
      meslek: 'Profession (facultatif)',
      opsiyonelBolum: 'Informations complémentaires (facultatif)',
      yasUyari: 'Ce formulaire est réservé aux personnes de 18 ans et plus.',
      kimlikBilgileriAciklama: 'Les informations lisibles sur votre document ont été complétées automatiquement ci-dessous. Merci de vérifier leur exactitude et de compléter les champs manquants.',
      mrzRozet: 'Lu automatiquement',

      eposta: 'E-mail',
      telefon: 'Téléphone (+32...)',
      adres: 'Adresse complète',
      adresYerTutucu: 'Rue, numéro, code postal, ville',

      ihtidaSebebi: 'Pourquoi souhaitez-vous embrasser l’islam ? (facultatif)',
      ihtidaSebebiYerTutucu: 'Quelques phrases suffisent — cela nous aide à préparer la cérémonie.',
      yeniIsim: 'Prénom musulman souhaité (facultatif)',
      yeniIsimNot: 'Le changement de prénom n’est pas obligatoire.',
      torenDili: 'Langue souhaitée pour la cérémonie (facultatif)',
      torenTarihi: 'Date souhaitée pour la cérémonie (facultatif, à titre indicatif)',
      torenTarihiNot: 'La mosquée vous recontactera pour confirmer une date définitive.',
      nasilHaberdar: 'Comment avez-vous connu cette démarche ? (facultatif)',
      ekNot: 'Remarque complémentaire (facultatif)',

      belgeYuklemeAciklama: 'Ajoutez le recto et le verso de votre carte d’identité (ou la page d’identité de votre passeport), ainsi qu’une photo d’identité. En cliquant sur « Suivant », vos informations seront lues automatiquement depuis le document sur cet appareil ; ce qui n’aura pas pu être lu pourra être complété à l’étape suivante.',
      belgeTuru: 'Type de document d’identité',
      kimlikOn: 'Carte d’identité — recto',
      kimlikArka: 'Carte d’identité — verso',
      vesikalik: 'Photo d’identité',
      dosyaSec: 'Choisir un fichier',
      dosyaDegistir: 'Changer le fichier',
      dosyaYuklendi: 'Fichier ajouté',
      dosyaYok: 'Aucun fichier',
      dosyaIsleniyor: 'Traitement en cours…',
      dosyaCokBuyuk: 'Le fichier est trop volumineux (max. 10 Mo).',
      dosyaGecersiz: 'Fichier invalide — utilisez une image (JPG/PNG).',
      kameraIleCek: 'Prendre une photo',
      galeridenYukle: 'Choisir depuis la galerie',
      dosyaKaldirEt: 'Retirer',
      surukleBirak: 'Glissez une image ici ou choisissez un fichier',
      henuzEklenmedi: 'Aucune image ajoutée',
      gorselEklendi: 'Image ajoutée',

      mrzTaraButonu: 'Relire le document',
      mrzTaraniyor: 'Lecture du document en cours…',
      mrzTaraniyorYuzde: (yuzde) => `Lecture du document en cours… ${yuzde} %`,
      mrzBasarili: (adet) => `${adet} champ${adet > 1 ? 's' : ''} rempli${adet > 1 ? 's' : ''} automatiquement depuis votre document.`,
      mrzBasariliDegisiklikYok: 'Document lu ; vos informations étaient déjà complètes.',
      mrzBasarisiz: 'La lecture automatique n’a pas abouti — pas d’inquiétude, complétez simplement les informations ci-dessous à la main.',
      mrzHenuzYok: 'Vos informations n’ont pas encore été lues automatiquement.',
      duzenle: 'Modifier',

      rizaBaslik: 'Consentement RGPD (EK-10)',
      rizaOzet: 'Dans le cadre de ma démarche de conversion, j’autorise expressément que les données à caractère personnel ou sensibles (y compris ma religion) que je partage soient obtenues, traitées, enregistrées et conservées de manière sécurisée, conformément à l’article 4 de la loi turque n° 6698, et transmises aux autorités compétentes (Conseiller des Affaires religieuses / Présidence des Affaires religieuses). Je reconnais avoir reçu les informations nécessaires et avoir lu et compris ce texte.',
      rizaTamMetin: 'Lire le texte complet (EK-10, 4 langues) ↗',
      rizaOnay: 'J’ai lu et j’accepte le texte de consentement ci-dessus.',
      hurIradeOnay: 'Je déclare vouloir embrasser l’islam de mon plein gré, sans aucune pression.',
      fotografIzniBaslik: 'Photo / témoignage',
      fotografIzniMetin: 'Par défaut, votre histoire personnelle n’est jamais partagée publiquement. Vous pouvez toutefois autoriser la mosquée à utiliser votre photo ou votre témoignage (uniquement si vous le souhaitez).',
      fotografIzniOnay: 'J’autorise l’utilisation de ma photo/mon témoignage par la mosquée (facultatif).',
      gdprNot: 'Vos données sont traitées uniquement pour la délivrance de l’attestation de conversion et la communication avec les autorités compétentes.',

      sahitBaslik: 'Témoins (facultatif)',
      sahitAciklama: 'L’attestation de conversion (EK-9) comporte deux emplacements pour les témoins. Si deux personnes vous accompagnent, vous pouvez enregistrer dès maintenant leur nom et leur signature.',
      sahitAc: 'Ajouter des témoins',
      sahitAdEtiket: (sira) => `Nom et prénom du témoin ${sira}`,
      sahitImzaBaslik: (sira) => `Signature du témoin ${sira}`,
      sahitImzaAciklama: 'Le témoin signe lui-même dans le cadre ci-dessous.',
      sahitEksikNot: 'Si vous ne renseignez pas de témoin, les emplacements seront complétés par les responsables de notre mosquée.',
      sahitAdBos: 'Indiquez également le nom du témoin qui a signé.',
      sahitImzaBos: 'Faites signer ce témoin : sans signature, il ne peut pas figurer sur l’attestation.',
      sahitOzet: 'Témoins',
      sahitYok: 'Aucun témoin renseigné — la mosquée s’en charge.',

      imzaBaslik: 'Signature manuscrite',
      imzaAciklama: 'Signez avec votre doigt, votre souris ou un stylet dans le cadre ci-dessous.',
      imzaTemizle: 'Effacer',
      imzaGeriAl: 'Annuler le dernier trait',
      imzaYenidenImzala: 'Signer à nouveau',
      imzaBos: 'Veuillez apposer votre signature.',
      imzaKisa: 'Le trait est trop court — veuillez signer plus clairement.',
      imzaYazarak: 'Vous ne pouvez pas dessiner ? Signez en tapant votre nom',
      imzaYazarakEtiket: 'Nom et prénom (vaut signature)',
      imzaYazarakOnay: 'Utiliser comme signature',

      ozetBaslik: 'Vérifiez vos informations',
      beyanCumlesi: 'Je déclare vouloir, de mon plein gré, embrasser l’islam et je demande respectueusement qu’une attestation de conversion me soit délivrée.',
      gonder: 'Envoyer ma demande',
      gonderiliyor: 'Envoi en cours…',
      hazirlaniyor: 'Préparation du document…',
      tekrarDene: 'Réessayer',

      zorunluAlan: 'Ce champ est obligatoire.',
      gecersizEposta: 'Adresse e-mail invalide.',
      gecersizTelefon: 'Numéro de téléphone invalide (ex. +32 4xx xx xx xx).',
      gecersizKimlikNo: 'Numéro d’identité turc invalide (11 chiffres).',
      onayGerekli: 'Cette case doit être cochée pour continuer.',

      basariBaslik: 'Votre demande a bien été envoyée',
      basariMetin: (ref) => `Numéro de référence : ${ref}. La mosquée vous contactera pour fixer une date de cérémonie.`,
      basariPdfNot: 'Une copie PDF vous a été envoyée par e-mail et transmise à la mosquée.',
      yeniBasvuru: 'Nouvelle demande',

      gonderimHataBaslik: 'L’envoi a échoué',
      servisYokBaslik: 'Envoi en ligne pas encore disponible',
      servisYok: 'Le service d’envoi en ligne n’est pas encore activé. Vous pouvez utiliser les solutions ci-dessous, ou contacter directement la mosquée.',
      gonderimBasarisiz: 'Une erreur est survenue lors de l’envoi. Votre document PDF a bien été créé — utilisez l’une des solutions ci-dessous.',
      cokBuyuk: 'Le document est trop volumineux pour être envoyé. Essayez avec des photos plus légères.',
      yedekBaslik: 'Autres moyens d’envoi',
      yedekIndir: 'Télécharger le PDF',
      yedekEposta: 'Envoyer par e-mail',
      yedekWhatsapp: 'Partager via WhatsApp',

      pdfBaslik: 'Formulaire de pré-demande d’attestation de conversion',
      pdfAltBaslik: 'Attestation de conversion à l’islam',
      pdfOnBasvuruUyari: 'PRÉ-DEMANDE — DOCUMENT NON OFFICIEL',
      pdfBilgilendirme: 'Ce document est une pré-demande. L’attestation officielle de conversion (EK-9) est délivrée après la cérémonie à la mosquée, avec la validation du Conseiller des Affaires sociales de l’Ambassade de Turquie à Bruxelles.',
      pdfIletisim: 'Contact',
      pdfFiligran: 'PRÉ-DEMANDE — NON OFFICIEL',
    };
  }
  if (dil === 'en') {
    return {
      baslik: 'Application for Conversion to Islam',
      girisBaslik: 'Before You Begin',
      girisMetin1: 'This form is a pre-application for the Certificate of Conversion (İhtida Belgesi, Annex EK-9). Your information is shared only with our mosque and, where necessary, with the Counsellor for Social Affairs at the Turkish Embassy in Brussels.',
      girisMetin2: 'You may complete this form over several sessions — your draft is saved automatically on this device.',
      girisUyari: 'This form is only for applicants who are of legal age (18 or older). If you are under 18, please contact our imam directly.',
      devamEt: 'Start',
      geri: 'Back',
      ileri: 'Next',
      adimSayaci: (simdi, toplam) => `Step ${simdi} of ${toplam}`,

      soyad: 'Last name',
      adlar: 'First name(s)',
      cinsiyet: 'Gender',
      dogumTarihi: 'Date of birth',
      dogumYeri: 'Place of birth',
      uyruk: 'Nationality',
      ulusalNo: 'National number (Rijksregister / personal ID no)',
      belgeNoDogrulanamadi: 'Read from the card but not verified — please compare it with your card.',
      belgeNo: 'Card / document number (optional)',
      belgeGecerlilikTarihi: 'Document expiry date (optional)',
      tcVatandasi: 'I am a Turkish citizen',
      tcKimlikNo: 'Turkish national ID number (11 digits)',
      oncekiDin: 'Previous religion / denomination',
      oncekiDinDiger: 'Please specify',
      ogrenimDurumu: 'Level of education (optional)',
      anneAdi: 'Mother’s first name (optional)',
      babaAdi: 'Father’s first name (optional)',
      medeniHali: 'Marital status (optional)',
      meslek: 'Occupation (optional)',
      opsiyonelBolum: 'Additional information (optional)',
      yasUyari: 'This form is only for applicants aged 18 and over.',
      kimlikBilgileriAciklama: 'The information legible on your document has been filled in automatically below. Please check that it is correct and complete any missing fields.',
      mrzRozet: 'Read from ID',

      eposta: 'Email',
      telefon: 'Phone (+32...)',
      adres: 'Full address',
      adresYerTutucu: 'Street, number, postal code, city',

      ihtidaSebebi: 'Why do you wish to embrace Islam? (optional)',
      ihtidaSebebiYerTutucu: 'A few sentences are enough — this helps us prepare for the ceremony.',
      yeniIsim: 'Preferred Muslim name (optional)',
      yeniIsimNot: 'Changing your name is not obligatory.',
      torenDili: 'Preferred language for the ceremony (optional)',
      torenTarihi: 'Preferred date for the ceremony (optional, indicative only)',
      torenTarihiNot: 'The mosque will contact you separately to confirm a definite date.',
      nasilHaberdar: 'How did you hear about this process? (optional)',
      ekNot: 'Additional note (optional)',

      belgeYuklemeAciklama: 'Add the front and back of your ID card (or the identity page of your passport), plus a passport-style photo. When you press “Next”, your information will automatically be read from the document on this device; anything that cannot be read can be completed by hand in the next step.',
      belgeTuru: 'Type of identity document',
      kimlikOn: 'ID card — front',
      kimlikArka: 'ID card — back',
      vesikalik: 'Passport-style photo',
      dosyaSec: 'Choose a file',
      dosyaDegistir: 'Change file',
      dosyaYuklendi: 'File added',
      dosyaYok: 'No file',
      dosyaIsleniyor: 'Processing…',
      dosyaCokBuyuk: 'The file is too large (max. 10 MB).',
      dosyaGecersiz: 'Invalid file — please use an image (JPG/PNG).',
      kameraIleCek: 'Take a photo',
      galeridenYukle: 'Choose from gallery',
      dosyaKaldirEt: 'Remove',
      surukleBirak: 'Drag an image here or choose a file',
      henuzEklenmedi: 'No image added yet',
      gorselEklendi: 'Image added',

      mrzTaraButonu: 'Re-scan document',
      mrzTaraniyor: 'Reading document…',
      mrzTaraniyorYuzde: (yuzde) => `Reading document… ${yuzde}%`,
      mrzBasarili: (adet) => `${adet} field${adet > 1 ? 's' : ''} filled in automatically from your document.`,
      mrzBasariliDegisiklikYok: 'Document read; your information was already complete.',
      mrzBasarisiz: 'Automatic reading was not successful — no problem, simply fill in the information below by hand.',
      mrzHenuzYok: 'Your information has not yet been read automatically.',
      duzenle: 'Edit',

      rizaBaslik: 'Personal Data Protection Consent (KVKK Açık Rıza Metni, EK-10)',
      rizaOzet: 'As part of my conversion process, I expressly consent to the personal and sensitive personal data I share (including information about my religion) being obtained, processed, recorded and securely stored in accordance with Article 4 of Turkish Law No. 6698 on the Protection of Personal Data, and being shared with the relevant authorities (the Counsellor for Religious Affairs / Presidency of Religious Affairs). I acknowledge that I have received the necessary information and that I have read and understood this text.',
      rizaTamMetin: 'Read the full text (EK-10, 4 languages) ↗',
      rizaOnay: 'I have read and accept the consent text above.',
      hurIradeOnay: 'I declare that I wish to embrace Islam of my own free will, without any pressure.',
      fotografIzniBaslik: 'Photo / testimony',
      fotografIzniMetin: 'By default, your personal story is never shared publicly. If you wish, you may allow the mosque to use your photo or testimony (only if you choose to).',
      fotografIzniOnay: 'I allow my photo/testimony to be used by the mosque (optional).',
      gdprNot: 'Your data is processed solely for the purpose of issuing the Certificate of Conversion and communicating with the relevant authorities.',

      sahitBaslik: 'Witnesses (optional)',
      sahitAciklama: 'The conversion certificate (EK-9) has two places for witnesses. If two people are with you, you can record their names and signatures now.',
      sahitAc: 'Add witnesses',
      sahitAdEtiket: (sira) => `Full name of witness ${sira}`,
      sahitImzaBaslik: (sira) => `Signature of witness ${sira}`,
      sahitImzaAciklama: 'The witness signs in the box below.',
      sahitEksikNot: 'If you do not add witnesses, the mosque staff will sign as witnesses.',
      sahitAdBos: 'Please also enter the name of the witness who signed.',
      sahitImzaBos: 'Please collect this witness’s signature: without it they cannot appear on the certificate.',
      sahitOzet: 'Witnesses',
      sahitYok: 'No witnesses entered — the mosque will provide them.',

      imzaBaslik: 'Handwritten signature',
      imzaAciklama: 'Sign with your finger, mouse or stylus in the box below.',
      imzaTemizle: 'Clear',
      imzaGeriAl: 'Undo last stroke',
      imzaYenidenImzala: 'Sign again',
      imzaBos: 'Please provide your signature.',
      imzaKisa: 'The stroke is too short — please sign more clearly.',
      imzaYazarak: 'Can’t draw? Sign by typing your name',
      imzaYazarakEtiket: 'Full name (counts as signature)',
      imzaYazarakOnay: 'Use as signature',

      ozetBaslik: 'Please review your information',
      beyanCumlesi: 'I declare that, of my own free will, I wish to embrace Islam, and I respectfully request that a Certificate of Conversion (İhtida Belgesi) be issued in my name.',
      gonder: 'Submit my application',
      gonderiliyor: 'Sending…',
      hazirlaniyor: 'Preparing document…',
      tekrarDene: 'Try again',

      zorunluAlan: 'This field is required.',
      gecersizEposta: 'Invalid email address.',
      gecersizTelefon: 'Invalid phone number (e.g. +32 4xx xx xx xx).',
      gecersizKimlikNo: 'Invalid Turkish national ID number (11 digits).',
      onayGerekli: 'This box must be checked to continue.',

      basariBaslik: 'Your application has been received',
      basariMetin: (ref) => `Reference number: ${ref}. The mosque will contact you to arrange a ceremony date.`,
      basariPdfNot: 'A PDF copy has been sent to you by email and forwarded to the mosque.',
      yeniBasvuru: 'New application',

      gonderimHataBaslik: 'Submission failed',
      servisYokBaslik: 'Online submission not yet available',
      servisYok: 'The online submission service is not yet active. You can use one of the options below, or contact the mosque directly.',
      gonderimBasarisiz: 'An error occurred while sending. Your PDF document was created successfully — please use one of the options below.',
      cokBuyuk: 'The document is too large to send. Please try again with smaller photos.',
      yedekBaslik: 'Other ways to send',
      yedekIndir: 'Download PDF',
      yedekEposta: 'Send by email',
      yedekWhatsapp: 'Share via WhatsApp',

      pdfBaslik: 'Certificate of Conversion (İhtida Belgesi) — Pre-Application Form',
      pdfAltBaslik: 'Certificate of Conversion to Islam (İhtida Belgesi)',
      pdfOnBasvuruUyari: 'PRE-APPLICATION — NOT AN OFFICIAL DOCUMENT',
      pdfBilgilendirme: 'This document is a pre-application. The official Certificate of Conversion (İhtida Belgesi, Annex EK-9) is issued after the ceremony at our mosque, with the approval of the Counsellor for Social Affairs at the Turkish Embassy in Brussels.',
      pdfIletisim: 'Contact',
      pdfFiligran: 'PRE-APPLICATION — NOT OFFICIAL',
    };
  }
  return {
    baslik: 'İhtida Başvuru Formu',
    girisBaslik: 'Başlamadan önce',
    girisMetin1: 'Bu form, İhtida Belgesi (EK-9) için bir ön başvuru niteliğindedir. Bilgileriniz yalnızca camimize ve gerektiğinde T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği’ne iletilir.',
    girisMetin2: 'Formu birden fazla oturumda doldurabilirsiniz; taslağınız bu cihazda otomatik olarak saklanır.',
    girisUyari: 'Bu form yalnızca reşit (18 yaş ve üzeri) başvuranlar içindir. 18 yaşından küçükseniz lütfen doğrudan din görevlimizle iletişime geçin.',
    devamEt: 'Başla',
    geri: 'Geri',
    ileri: 'İleri',
    adimSayaci: (simdi, toplam) => `Adım ${simdi} / ${toplam}`,

    soyad: 'Soyadı',
    adlar: 'Adı',
    cinsiyet: 'Cinsiyet',
    dogumTarihi: 'Doğum tarihi',
    dogumYeri: 'Doğum yeri',
    uyruk: 'Uyruk',
    ulusalNo: 'Ulusal numara (Rijksregister / kimlik no)',
    belgeNoDogrulanamadi: 'Kimlikten okundu ama doğrulanamadı — lütfen karttaki numarayla karşılaştırın.',
    belgeNo: 'Belge / kart numarası (opsiyonel)',
    belgeGecerlilikTarihi: 'Belgenin geçerlilik tarihi (opsiyonel)',
    tcVatandasi: 'T.C. vatandaşıyım',
    tcKimlikNo: 'T.C. Kimlik No (11 hane)',
    oncekiDin: 'Önceki din / mezhep',
    oncekiDinDiger: 'Belirtiniz',
    ogrenimDurumu: 'Öğrenim durumu (opsiyonel)',
    anneAdi: 'Anne adı (opsiyonel)',
    babaAdi: 'Baba adı (opsiyonel)',
    medeniHali: 'Medeni hâli (opsiyonel)',
    meslek: 'Mesleği (opsiyonel)',
    opsiyonelBolum: 'Ek bilgiler (opsiyonel)',
    yasUyari: 'Bu form yalnızca 18 yaş ve üzeri başvuranlar içindir.',
    kimlikBilgileriAciklama: 'Belgenizden okunabilen bilgiler aşağıda otomatik olarak dolduruldu. Lütfen doğruluğunu kontrol edin ve eksik alanları tamamlayın.',
    mrzRozet: 'Kimlikten okundu',

    eposta: 'E-posta',
    telefon: 'Telefon (+32...)',
    adres: 'Açık adres',
    adresYerTutucu: 'Sokak, numara, posta kodu, şehir',

    ihtidaSebebi: 'İslam’a girme sebebiniz (opsiyonel)',
    ihtidaSebebiYerTutucu: 'Birkaç cümle yeterli — tören hazırlığımıza yardımcı olur.',
    yeniIsim: 'Tercih edilen yeni isim (opsiyonel)',
    yeniIsimNot: 'İsim değiştirmek zorunlu değildir.',
    torenDili: 'Tören için tercih edilen dil (opsiyonel)',
    torenTarihi: 'Tören için tercih edilen tarih (opsiyonel, öneri niteliğinde)',
    torenTarihiNot: 'Kesin tarih için camimiz sizinle ayrıca iletişime geçecektir.',
    nasilHaberdar: 'Bu süreçten nasıl haberdar oldunuz? (opsiyonel)',
    ekNot: 'Eklemek istediğiniz not (opsiyonel)',

    belgeYuklemeAciklama: 'Kimlik kartınızın ön ve arka yüzünü (veya pasaportunuzun kimlik sayfasını) ve bir vesikalık fotoğraf ekleyin. “İleri”ye bastığınızda bilgileriniz bu cihazda otomatik olarak okunmaya çalışılacak; okunamayan bilgileri bir sonraki adımda elle tamamlayabilirsiniz.',
    belgeTuru: 'Kimlik belgesi türü',
    kimlikOn: 'Kimlik kartı — ön yüz',
    kimlikArka: 'Kimlik kartı — arka yüz',
    vesikalik: 'Vesikalık fotoğraf',
    dosyaSec: 'Dosya seç',
    dosyaDegistir: 'Dosyayı değiştir',
    dosyaYuklendi: 'Dosya eklendi',
    dosyaYok: 'Dosya yok',
    dosyaIsleniyor: 'İşleniyor…',
    dosyaCokBuyuk: 'Dosya çok büyük (azami 10 MB).',
    dosyaGecersiz: 'Geçersiz dosya — bir resim (JPG/PNG) kullanın.',
    kameraIleCek: 'Kamera ile çek',
    galeridenYukle: 'Galeriden yükle',
    dosyaKaldirEt: 'Kaldır',
    surukleBirak: 'Görseli buraya sürükleyin veya dosya seçin',
    henuzEklenmedi: 'Henüz görsel eklenmedi',
    gorselEklendi: 'Görsel eklendi',

    mrzTaraButonu: 'Kimliği yeniden tara',
    mrzTaraniyor: 'Kimlik okunuyor…',
    mrzTaraniyorYuzde: (yuzde) => `Kimlik okunuyor… %${yuzde}`,
    mrzBasarili: (adet) => `Kimlikten ${adet} alan otomatik dolduruldu.`,
    mrzBasariliDegisiklikYok: 'Kimlik okundu; bilgileriniz zaten eksiksizdi.',
    mrzBasarisiz: 'Kimlik otomatik okunamadı — sorun değil, aşağıdaki bilgileri elle doldurabilirsiniz.',
    mrzHenuzYok: 'Bilgileriniz henüz otomatik okunmadı.',
    duzenle: 'Düzenle',

    rizaBaslik: 'KVKK Açık Rıza Metni (EK-10)',
    rizaOzet: 'İhtida işlemlerim kapsamında paylaştığım kişisel veya özel nitelikli kişisel verilerimin (din bilgisi dahil), 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 4. maddesindeki ilkelere uygun şekilde elde edilmesine, işlenmesine, kaydedilmesine, güvenli şekilde saklanmasına ve ilgili resmî makamlarla (Din Hizmetleri Müşavirliği/Diyanet İşleri Başkanlığı) paylaşılmasına açıkça rıza gösteriyorum. Bu konuda gerekli aydınlatmanın yapıldığını, metni okuyup anladığımı kabul ediyorum.',
    rizaTamMetin: 'Tam metni oku (EK-10, 4 dilli) ↗',
    rizaOnay: 'Yukarıdaki rıza metnini okudum ve kabul ediyorum.',
    hurIradeOnay: 'Kendi hür irademle, hiçbir baskı olmadan İslam dinine girmek istediğimi beyan ederim.',
    fotografIzniBaslik: 'Fotoğraf / hikâye paylaşımı',
    fotografIzniMetin: 'Varsayılan olarak kişisel hikâyeniz asla kamuya açık şekilde paylaşılmaz. Dilerseniz camimizin fotoğrafınızı/hikâyenizi kullanmasına izin verebilirsiniz (yalnızca isterseniz).',
    fotografIzniOnay: 'Fotoğrafımın/hikâyemin cami tarafından kullanılmasına izin veriyorum (opsiyonel).',
    gdprNot: 'Verileriniz yalnızca İhtida Belgesi düzenleme ve ilgili resmî makamlarla iletişim amacıyla işlenir.',

    sahitBaslik: 'Şahitler (isteğe bağlı)',
    sahitAciklama: 'İhtida Belgesi’nde (EK-9) iki şahit için yer ayrılmıştır. Yanınızda iki kişi varsa adlarını ve imzalarını şimdiden kaydedebilirsiniz.',
    sahitAc: 'Şahit bilgilerini ekle',
    sahitAdEtiket: (sira) => `${sira}. şahidin adı soyadı`,
    sahitImzaBaslik: (sira) => `${sira}. şahidin imzası`,
    sahitImzaAciklama: 'Şahit, aşağıdaki kutuya kendi imzasını atsın.',
    sahitEksikNot: 'Şahit girmezseniz belgedeki şahit alanları camimizin görevlilerince tamamlanır.',
    sahitAdBos: 'İmza atan şahidin adını da yazın.',
    sahitImzaBos: 'Bu şahidin imzasını da alın; imzasız şahit belgeye yazılamaz.',
    sahitOzet: 'Şahitler',
    sahitYok: 'Şahit girilmedi — camimiz tamamlayacak.',

    imzaBaslik: 'El ile imza',
    imzaAciklama: 'Aşağıdaki kutu içine parmağınızla, farenizle veya kalemle imzanızı atın.',
    imzaTemizle: 'Temizle',
    imzaGeriAl: 'Son çizgiyi geri al',
    imzaYenidenImzala: 'Yeniden imzala',
    imzaBos: 'Lütfen imzanızı atın.',
    imzaKisa: 'Çizgi çok kısa — lütfen daha belirgin imzalayın.',
    imzaYazarak: 'Çizemiyor musunuz? Adınızı yazarak imzalayın',
    imzaYazarakEtiket: 'Ad Soyad (imza yerine geçer)',
    imzaYazarakOnay: 'İmza olarak kullan',

    ozetBaslik: 'Bilgilerinizi kontrol edin',
    beyanCumlesi: 'Kendi hür irademle İslam dinine girmek istiyorum. Şahsıma İhtida Belgesi düzenlenmesi hususunda gereğini saygılarımla arz ederim.',
    gonder: 'Başvurumu gönder',
    gonderiliyor: 'Gönderiliyor…',
    hazirlaniyor: 'Belge hazırlanıyor…',
    tekrarDene: 'Tekrar dene',

    zorunluAlan: 'Bu alan zorunludur.',
    gecersizEposta: 'Geçersiz e-posta adresi.',
    gecersizTelefon: 'Geçersiz telefon numarası (örn. +32 4xx xx xx xx).',
    gecersizKimlikNo: 'Geçersiz T.C. Kimlik No (11 hane).',
    onayGerekli: 'Devam etmek için bu kutuyu işaretlemeniz gerekir.',

    basariBaslik: 'Başvurunuz alındı',
    basariMetin: (ref) => `Referans numaranız: ${ref}. Tören tarihini belirlemek için camimiz sizinle iletişime geçecektir.`,
    basariPdfNot: 'PDF kopyası e-posta ile size ve camimize gönderildi.',
    yeniBasvuru: 'Yeni başvuru',

    gonderimHataBaslik: 'Gönderim başarısız oldu',
    servisYokBaslik: 'Online gönderim henüz etkin değil',
    servisYok: 'Online gönderim servisi henüz etkin değil. Aşağıdaki yollardan birini kullanabilir veya doğrudan camimizle iletişime geçebilirsiniz.',
    gonderimBasarisiz: 'Gönderim sırasında bir hata oluştu. PDF belgeniz başarıyla oluşturuldu — aşağıdaki yollardan birini kullanabilirsiniz.',
    cokBuyuk: 'Belge gönderim için çok büyük. Daha küçük fotoğraflarla tekrar deneyin.',
    yedekBaslik: 'Diğer gönderim yolları',
    yedekIndir: 'PDF’i indir',
    yedekEposta: 'E-posta ile gönder',
    yedekWhatsapp: 'WhatsApp ile paylaş',

    pdfBaslik: 'İhtida Belgesi Ön Başvuru Formu',
    pdfAltBaslik: 'İslam’a Giriş (İhtida) Belgesi',
    pdfOnBasvuruUyari: 'ÖN BAŞVURU — RESMÎ DEĞİL',
    pdfBilgilendirme: 'Bu form bir ön başvurudur. Resmî İhtida Belgesi (EK-9), camimizdeki törenin ardından T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği onayıyla düzenlenir.',
    pdfIletisim: 'İletişim',
    pdfFiligran: 'ÖN BAŞVURU — RESMÎ DEĞİL',
  };
}
