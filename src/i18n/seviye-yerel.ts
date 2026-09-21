/** Seviye tespit testi — «Nereden başvuruyorsunuz?» bölümünün arayüz metinleri (TR/FR/EN/NL/DE; 21 Eyl 2026, form sürümü 2).
 *
 *  Değer listeleri ve ülke adları tek kaynaktan gelir: `src/lib/seviye-testi/yerel.ts` (sunucu da onu doğrular).
 *  İki paylaşım onayı İSTEĞE BAĞLIDIR, işaretsiz gelir, taslağa yazılmaz ve testi göndermek için şart değildir.
 *  Metinleri değişirse `RIZA_SURUMU` (seviye-testi.ts) yeni tarihle damgalanır, eski metin docs/seviye-testi/riza-arsivi.md'ye taşınır.
 */
import type { Dil } from './ui';

export type SeviyeYerelMetinleri = {
  baslik: string;
  giris: string;
  ulke: string;
  ulkeSec: string;
  sehir: string;
  sehirYardim: string;
  camiBiliyor: string;
  yakinCami: string;
  yakinCamiYardim: string;
  gorevliTaniyor: string;
  ateselikBilgisi: string;
  ateselikYardim: string;
  evet: string;
  hayir: string;
  onayBaslik: string;
  onayGiris: string;
  onayYerelGorevli: string;
  onayAteselik: string;
  onayNot: string;
  ozetYer: string;
};

export const seviyeYerelMetinleri: Record<Dil, SeviyeYerelMetinleri> = {
  tr: {
    baslik: 'Nereden başvuruyorsunuz?',
    giris: 'Bu teste Avrupa’nın her yerinden katılabilirsiniz. Eğitiminizi size en yakın yerde planlayabilmemiz için birkaç kısa soru:',
    ulke: 'Yaşadığınız ülke',
    ulkeSec: 'Seçiniz…',
    sehir: 'Şehir ve posta kodu',
    sehirYardim: 'Örnek: 6900 Marche-en-Famenne',
    camiBiliyor: 'Size en yakın Diyanet camisini biliyor musunuz?',
    yakinCami: 'Size en yakın Diyanet camisi',
    yakinCamiYardim: 'Caminin adını ve şehrini yazabilirsiniz. Bilmiyorsanız boş bırakınız; size biz bildiririz.',
    gorevliTaniyor: 'O caminin din görevlisini tanıyor musunuz?',
    ateselikBilgisi: 'Yaşadığınız ülkedeki Din Hizmetleri Müşavirliği ya da Ataşeliğinden haberdar mısınız?',
    ateselikYardim: 'Türkiye Cumhuriyeti büyükelçilik ve başkonsolosluklarında görev yapan, Diyanet’e bağlı din hizmetleri birimidir.',
    evet: 'Evet',
    hayir: 'Hayır',
    onayBaslik: 'Yerel destek için paylaşım (isteğe bağlı)',
    onayGiris: 'Bu iki kutu isteğe bağlıdır; işaretlemeden de testi gönderebilirsiniz. İşaretlemezseniz bilgileriniz ve sonucunuz yalnız din görevlimizde kalır.',
    onayYerelGorevli: 'Adımın, iletişim bilgilerimin ve test sonucumun, eğitimimin bana en yakın yerde planlanabilmesi için bana en yakın Diyanet camisinin din görevlisiyle paylaşılmasına ve o görevlinin benimle iletişim kurmasına açıkça rıza veriyorum.',
    onayAteselik: 'Adımın, iletişim bilgilerimin ve test sonucumun, yaşadığım ülkedeki Din Hizmetleri Müşavirliği / Ataşeliği ile, yerel eğitim imkânlarının düzenlenebilmesi amacıyla paylaşılmasına açıkça rıza veriyorum.',
    onayNot: 'Bu rızaları dilediğiniz an geri alabilirsiniz: imam@ulucamii.be',
    ozetYer: 'Ülke ve şehir',
  },
  fr: {
    baslik: 'D’où nous écrivez-vous ?',
    giris: 'Ce test est ouvert partout en Europe. Quelques questions brèves pour que votre formation puisse être organisée au plus près de chez vous :',
    ulke: 'Pays de résidence',
    ulkeSec: 'Choisir…',
    sehir: 'Ville et code postal',
    sehirYardim: 'Exemple : 6900 Marche-en-Famenne',
    camiBiliyor: 'Connaissez-vous la mosquée Diyanet la plus proche de chez vous ?',
    yakinCami: 'La mosquée Diyanet la plus proche de chez vous',
    yakinCamiYardim: 'Indiquez son nom et sa ville. Si vous ne la connaissez pas, laissez vide : nous vous l’indiquerons.',
    gorevliTaniyor: 'Connaissez-vous l’imam de cette mosquée ?',
    ateselikBilgisi: 'Avez-vous connaissance du Conseiller ou de l’Attaché aux affaires religieuses de votre pays de résidence ?',
    ateselikYardim: 'Il s’agit du service des affaires religieuses, rattaché au Diyanet, auprès des ambassades et consulats généraux de Türkiye.',
    evet: 'Oui',
    hayir: 'Non',
    onayBaslik: 'Partage pour un accompagnement local (facultatif)',
    onayGiris: 'Ces deux cases sont facultatives ; vous pouvez envoyer le test sans les cocher. Dans ce cas, vos informations et votre résultat restent auprès de notre imam uniquement.',
    onayYerelGorevli: 'Je consens expressément à ce que mon nom, mes coordonnées et le résultat de mon test soient communiqués à l’imam de la mosquée Diyanet la plus proche de chez moi, et à ce que celui-ci me contacte, afin que ma formation puisse être organisée près de chez moi.',
    onayAteselik: 'Je consens expressément à ce que mon nom, mes coordonnées et le résultat de mon test soient communiqués au Conseiller / à l’Attaché aux affaires religieuses de mon pays de résidence, afin que des possibilités de formation locales puissent être organisées.',
    onayNot: 'Vous pouvez retirer ces consentements à tout moment : imam@ulucamii.be',
    ozetYer: 'Pays et ville',
  },
  en: {
    baslik: 'Where are you writing from?',
    giris: 'This test is open to people anywhere in Europe. A few short questions so that your teaching can be arranged as close to you as possible:',
    ulke: 'Country of residence',
    ulkeSec: 'Choose…',
    sehir: 'Town and postcode',
    sehirYardim: 'Example: 6900 Marche-en-Famenne',
    camiBiliyor: 'Do you know the Diyanet mosque nearest to you?',
    yakinCami: 'The Diyanet mosque nearest to you',
    yakinCamiYardim: 'You can write its name and town. If you do not know it, leave this empty — we will tell you.',
    gorevliTaniyor: 'Do you know the imam of that mosque?',
    ateselikBilgisi: 'Are you aware of the Counsellor or Attaché for Religious Affairs in your country of residence?',
    ateselikYardim: 'This is the religious services office, attached to the Diyanet, at the embassies and consulates general of Türkiye.',
    evet: 'Yes',
    hayir: 'No',
    onayBaslik: 'Sharing for local support (optional)',
    onayGiris: 'These two boxes are optional; you can send the test without ticking them. If you leave them unticked, your details and your result stay with our imam only.',
    onayYerelGorevli: 'I give my explicit consent for my name, my contact details and my test result to be shared with the imam of the Diyanet mosque nearest to me, and for that imam to contact me, so that my teaching can be arranged close to where I live.',
    onayAteselik: 'I give my explicit consent for my name, my contact details and my test result to be shared with the Counsellor / Attaché for Religious Affairs in my country of residence, so that local teaching can be organised.',
    onayNot: 'You can withdraw these consents at any time: imam@ulucamii.be',
    ozetYer: 'Country and town',
  },
  nl: {
    baslik: 'Van waaruit schrijft u ons?',
    giris: 'Deze test staat open voor iedereen in Europa. Enkele korte vragen, zodat uw opleiding zo dicht mogelijk bij u kan worden georganiseerd:',
    ulke: 'Land waar u woont',
    ulkeSec: 'Kies…',
    sehir: 'Gemeente en postcode',
    sehirYardim: 'Voorbeeld: 6900 Marche-en-Famenne',
    camiBiliyor: 'Kent u de Diyanet-moskee die het dichtst bij u ligt?',
    yakinCami: 'De Diyanet-moskee die het dichtst bij u ligt',
    yakinCamiYardim: 'U kunt de naam en de gemeente noteren. Kent u ze niet, laat dit dan leeg: wij laten het u weten.',
    gorevliTaniyor: 'Kent u de imam van die moskee?',
    ateselikBilgisi: 'Bent u op de hoogte van de Raad of de Attaché voor Religieuze Zaken in het land waar u woont?',
    ateselikYardim: 'Dat is de dienst voor religieuze zaken, verbonden aan de Diyanet, bij de ambassades en consulaten-generaal van Turkije.',
    evet: 'Ja',
    hayir: 'Nee',
    onayBaslik: 'Delen voor lokale begeleiding (facultatief)',
    onayGiris: 'Deze twee vakjes zijn facultatief; u kunt de test ook versturen zonder ze aan te kruisen. In dat geval blijven uw gegevens en uw resultaat uitsluitend bij onze imam.',
    onayYerelGorevli: 'Ik geef uitdrukkelijk toestemming dat mijn naam, mijn contactgegevens en mijn testresultaat worden gedeeld met de imam van de Diyanet-moskee die het dichtst bij mij ligt, en dat die imam contact met mij opneemt, zodat mijn opleiding dicht bij mijn woonplaats kan worden georganiseerd.',
    onayAteselik: 'Ik geef uitdrukkelijk toestemming dat mijn naam, mijn contactgegevens en mijn testresultaat worden gedeeld met de Raad / Attaché voor Religieuze Zaken van het land waar ik woon, zodat lokale opleidingsmogelijkheden kunnen worden georganiseerd.',
    onayNot: 'U kunt deze toestemmingen op elk moment intrekken: imam@ulucamii.be',
    ozetYer: 'Land en gemeente',
  },
  de: {
    baslik: 'Von wo aus schreiben Sie uns?',
    giris: 'Dieser Test steht Menschen in ganz Europa offen. Einige kurze Fragen, damit Ihr Unterricht möglichst in Ihrer Nähe organisiert werden kann:',
    ulke: 'Land, in dem Sie wohnen',
    ulkeSec: 'Bitte wählen…',
    sehir: 'Ort und Postleitzahl',
    sehirYardim: 'Beispiel: 6900 Marche-en-Famenne',
    camiBiliyor: 'Kennen Sie die Ihnen nächstgelegene Diyanet-Moschee?',
    yakinCami: 'Die Ihnen nächstgelegene Diyanet-Moschee',
    yakinCamiYardim: 'Sie können Namen und Ort der Moschee angeben. Wenn Sie sie nicht kennen, lassen Sie das Feld leer – wir nennen sie Ihnen.',
    gorevliTaniyor: 'Kennen Sie den Imam dieser Moschee?',
    ateselikBilgisi: 'Ist Ihnen der Botschaftsrat oder Attaché für religiöse Angelegenheiten in Ihrem Wohnsitzland bekannt?',
    ateselikYardim: 'Das ist die der Diyanet angeschlossene Stelle für religiöse Dienste bei den Botschaften und Generalkonsulaten der Türkei.',
    evet: 'Ja',
    hayir: 'Nein',
    onayBaslik: 'Weitergabe für Unterstützung vor Ort (freiwillig)',
    onayGiris: 'Diese beiden Kästchen sind freiwillig; Sie können den Test auch absenden, ohne sie anzukreuzen. Dann bleiben Ihre Angaben und Ihr Ergebnis ausschließlich bei unserem Imam.',
    onayYerelGorevli: 'Ich willige ausdrücklich ein, dass mein Name, meine Kontaktdaten und mein Testergebnis an den Imam der mir nächstgelegenen Diyanet-Moschee weitergegeben werden und dass dieser Imam Kontakt mit mir aufnimmt, damit mein Unterricht in der Nähe meines Wohnorts organisiert werden kann.',
    onayAteselik: 'Ich willige ausdrücklich ein, dass mein Name, meine Kontaktdaten und mein Testergebnis an den Botschaftsrat / Attaché für religiöse Angelegenheiten meines Wohnsitzlandes weitergegeben werden, damit Unterrichtsangebote vor Ort organisiert werden können.',
    onayNot: 'Sie können diese Einwilligungen jederzeit widerrufen: imam@ulucamii.be',
    ozetYer: 'Land und Ort',
  },
};
