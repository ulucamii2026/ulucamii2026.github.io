/** İhtida Başvuru Formu — TR/FR metin sözlüğü + seçenek listeleri.
 *  Saf veri dosyası (JSX yok); .tsx uzantısı yalnızca "Ihtida*" dosya adı kuralına uymak içindir. */

export type FormDil = 'tr' | 'fr';

export interface SecenekOgesi { deger: string; etiket: Record<FormDil, string> }

export const CINSIYET_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'kadin', etiket: { tr: 'Kadın', fr: 'Femme' } },
  { deger: 'erkek', etiket: { tr: 'Erkek', fr: 'Homme' } },
];

export const ONCEKI_DIN_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'hristiyan-katolik', etiket: { tr: 'Hristiyan — Katolik', fr: 'Chrétien — Catholique' } },
  { deger: 'hristiyan-protestan', etiket: { tr: 'Hristiyan — Protestan', fr: 'Chrétien — Protestant' } },
  { deger: 'hristiyan-ortodoks', etiket: { tr: 'Hristiyan — Ortodoks', fr: 'Chrétien — Orthodoxe' } },
  { deger: 'musevi', etiket: { tr: 'Musevi', fr: 'Juif' } },
  { deger: 'inancsiz', etiket: { tr: 'İnançsız / Ateist', fr: 'Sans religion / Athée' } },
  { deger: 'diger', etiket: { tr: 'Diğer', fr: 'Autre' } },
];

export const OGRENIM_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'ilkogretim', etiket: { tr: 'İlköğretim', fr: 'Primaire' } },
  { deger: 'lise', etiket: { tr: 'Lise', fr: 'Secondaire' } },
  { deger: 'onlisans', etiket: { tr: 'Ön lisans', fr: 'Bachelier (court)' } },
  { deger: 'lisans', etiket: { tr: 'Lisans', fr: 'Bachelier / Master' } },
  { deger: 'lisansustu', etiket: { tr: 'Lisansüstü', fr: 'Études supérieures (3e cycle)' } },
];

export const MEDENI_HAL_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'bekar', etiket: { tr: 'Bekâr', fr: 'Célibataire' } },
  { deger: 'evli', etiket: { tr: 'Evli', fr: 'Marié(e)' } },
  { deger: 'bosanmis', etiket: { tr: 'Boşanmış', fr: 'Divorcé(e)' } },
  { deger: 'dul', etiket: { tr: 'Dul', fr: 'Veuf / Veuve' } },
];

export const TOREN_DILI_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'tr', etiket: { tr: 'Türkçe', fr: 'Turc' } },
  { deger: 'fr', etiket: { tr: 'Fransızca', fr: 'Français' } },
  { deger: 'nl', etiket: { tr: 'Felemenkçe', fr: 'Néerlandais' } },
  { deger: 'en', etiket: { tr: 'İngilizce', fr: 'Anglais' } },
];

export const HABERDAR_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'arkadas', etiket: { tr: 'Arkadaş / Tanıdık', fr: 'Ami(e) / Connaissance' } },
  { deger: 'internet', etiket: { tr: 'İnternet / Site', fr: 'Internet / Site web' } },
  { deger: 'sosyal-medya', etiket: { tr: 'Sosyal medya', fr: 'Réseaux sociaux' } },
  { deger: 'cami', etiket: { tr: 'Camiye daha önce geldim', fr: 'Déjà visité la mosquée' } },
  { deger: 'diger', etiket: { tr: 'Diğer', fr: 'Autre' } },
];

export const BELGE_TURU_SECENEKLERI: SecenekOgesi[] = [
  { deger: 'kimlik', etiket: { tr: 'Kimlik kartı (ön + arka gerekli)', fr: 'Carte d’identité (recto + verso requis)' } },
  { deger: 'pasaport', etiket: { tr: 'Pasaport (yalnızca kimlik sayfası)', fr: 'Passeport (page d’identité uniquement)' } },
];

export const ADIM_BASLIKLARI: Record<FormDil, string[]> = {
  tr: ['Hoş Geldiniz', 'Kimlik Bilgileri', 'İletişim ve Adres', 'Tören Tercihi', 'Belge Yükleme', 'Rıza Metni', 'İmza', 'Özet ve Gönder'],
  fr: ['Bienvenue', 'Informations personnelles', 'Contact et adresse', 'Préférences pour la cérémonie', 'Documents à joindre', 'Consentement', 'Signature', 'Résumé et envoi'],
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
  adSoyad: string;
  cinsiyet: string;
  dogumTarihi: string;
  dogumYeri: string;
  uyruk: string;
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

export function metinler(dil: FormDil): Metinler {
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

      adSoyad: 'Nom et prénom',
      cinsiyet: 'Genre',
      dogumTarihi: 'Date de naissance',
      dogumYeri: 'Lieu de naissance',
      uyruk: 'Nationalité',
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

      rizaBaslik: 'Consentement RGPD (EK-10)',
      rizaOzet: 'Dans le cadre de ma démarche de conversion, j’autorise expressément que les données à caractère personnel ou sensibles (y compris ma religion) que je partage soient obtenues, traitées, enregistrées et conservées de manière sécurisée, conformément à l’article 4 de la loi turque n° 6698, et transmises aux autorités compétentes (Conseiller des Affaires religieuses / Présidence des Affaires religieuses). Je reconnais avoir reçu les informations nécessaires et avoir lu et compris ce texte.',
      rizaTamMetin: 'Lire le texte complet (EK-10, 4 langues) ↗',
      rizaOnay: 'J’ai lu et j’accepte le texte de consentement ci-dessus.',
      hurIradeOnay: 'Je déclare vouloir embrasser l’islam de mon plein gré, sans aucune pression.',
      fotografIzniBaslik: 'Photo / témoignage',
      fotografIzniMetin: 'Par défaut, votre histoire personnelle n’est jamais partagée publiquement. Vous pouvez toutefois autoriser la mosquée à utiliser votre photo ou votre témoignage (uniquement si vous le souhaitez).',
      fotografIzniOnay: 'J’autorise l’utilisation de ma photo/mon témoignage par la mosquée (facultatif).',
      gdprNot: 'Vos données sont traitées uniquement pour la délivrance de l’attestation de conversion et la communication avec les autorités compétentes.',

      imzaBaslik: 'Signature manuscrite',
      imzaAciklama: 'Signez avec votre doigt, votre souris ou un stylet dans le cadre ci-dessous.',
      imzaTemizle: 'Effacer',
      imzaGeriAl: 'Annuler le dernier trait',
      imzaYenidenImzala: 'Signer à nouveau',
      imzaBos: 'Veuillez apposer votre signature.',
      imzaKisa: 'Le trait est trop court — veuillez signer plus clairement.',

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

    adSoyad: 'Adı Soyadı',
    cinsiyet: 'Cinsiyet',
    dogumTarihi: 'Doğum tarihi',
    dogumYeri: 'Doğum yeri',
    uyruk: 'Uyruk',
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

    rizaBaslik: 'KVKK Açık Rıza Metni (EK-10)',
    rizaOzet: 'İhtida işlemlerim kapsamında paylaştığım kişisel veya özel nitelikli kişisel verilerimin (din bilgisi dahil), 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 4. maddesindeki ilkelere uygun şekilde elde edilmesine, işlenmesine, kaydedilmesine, güvenli şekilde saklanmasına ve ilgili resmî makamlarla (Din Hizmetleri Müşavirliği/Diyanet İşleri Başkanlığı) paylaşılmasına açıkça rıza gösteriyorum. Bu konuda gerekli aydınlatmanın yapıldığını, metni okuyup anladığımı kabul ediyorum.',
    rizaTamMetin: 'Tam metni oku (EK-10, 4 dilli) ↗',
    rizaOnay: 'Yukarıdaki rıza metnini okudum ve kabul ediyorum.',
    hurIradeOnay: 'Kendi hür irademle, hiçbir baskı olmadan İslam dinine girmek istediğimi beyan ederim.',
    fotografIzniBaslik: 'Fotoğraf / hikâye paylaşımı',
    fotografIzniMetin: 'Varsayılan olarak kişisel hikâyeniz asla kamuya açık şekilde paylaşılmaz. Dilerseniz camimizin fotoğrafınızı/hikâyenizi kullanmasına izin verebilirsiniz (yalnızca isterseniz).',
    fotografIzniOnay: 'Fotoğrafımın/hikâyemin cami tarafından kullanılmasına izin veriyorum (opsiyonel).',
    gdprNot: 'Verileriniz yalnızca İhtida Belgesi düzenleme ve ilgili resmî makamlarla iletişim amacıyla işlenir.',

    imzaBaslik: 'El ile imza',
    imzaAciklama: 'Aşağıdaki kutu içine parmağınızla, farenizle veya kalemle imzanızı atın.',
    imzaTemizle: 'Temizle',
    imzaGeriAl: 'Son çizgiyi geri al',
    imzaYenidenImzala: 'Yeniden imzala',
    imzaBos: 'Lütfen imzanızı atın.',
    imzaKisa: 'Çizgi çok kısa — lütfen daha belirgin imzalayın.',

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
