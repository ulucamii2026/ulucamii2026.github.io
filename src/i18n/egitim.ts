import type { Dil } from './ui';

type EgitimMetni = {
  baslik: string; giris: string; dilNotu: string; baslangic: string;
  test: string; ilkDers: string; rehber: string; destek: string;
  bolumler: [string, string, string]; aciklamalar: [string, string, string];
  ara: string; ornek: string; sayac: string; bos: string; kaynak: string; qr: string;
};

export const EGITIM: Record<Dil, EgitimMetni> = {
  tr: {
    baslik: 'Dinimi Öğreniyorum',
    giris: 'İslâm’ı yeni tanıyan, Kur’an okumayı öğrenmek veya temel bilgilerini geliştirmek isteyen herkes için. Dersler ücretsizdir; kitap, karekod ya da üyelik gerekmez.',
    dilNotu: 'Ders başlıkları ve oynatıcı Türkçedir; tilavetler Arapçadır. Kitaptan aktarılan okunuş ve anlam metinleri Fransızca olarak işaretlenmiştir.',
    baslangic: 'Öğrenmeye başlayın', test: 'Seviyemi öğrenmek istiyorum', ilkDers: 'İlk ders: Arap harfleri', rehber: 'İslâm’ı tanıma rehberi', destek: 'Eğitim için bizimle iletişime geçin',
    bolumler: ['Kur’an okumayı öğrenme', 'Sûreler ve âyetler', 'Namaz ve dualar'],
    aciklamalar: ['Harfler, harekeler ve okuma alıştırmaları. Alfabeden başlayıp kendi hızınızda ilerleyin.', 'Sûrelerin tamamını veya kaydı bulunan âyetleri tek tek dinleyin.', 'Namazda okunan metinleri ve duaları dinleyip tekrar edin.'],
    ara: 'Ders ara', ornek: 'Alphabet, fatha, Fatiha…', sayac: 'ders', bos: 'Ders bulunamadı. Başka bir kelime deneyin veya aramayı temizleyin.', kaynak: 'Resmî Diyanet kayıtları', qr: 'Kitabınızdaki karekodlar aynı dersleri açmaya devam eder.',
  },
  fr: {
    baslik: 'Apprendre ma religion',
    giris: 'Pour toute personne qui découvre l’islam, souhaite apprendre à lire le Coran ou approfondir ses connaissances. Les cours sont gratuits, sans livre, sans code QR et sans inscription.',
    dilNotu: 'Les titres et le lecteur sont en français, les récitations en arabe. Les transcriptions et les traductions du manuel sont en français.',
    baslangic: 'Commencer à apprendre', test: 'Évaluer mon niveau', ilkDers: 'Premier cours : les lettres arabes', rehber: 'Découvrir l’islam', destek: 'Nous contacter pour un accompagnement',
    bolumler: ['Apprendre à lire', 'Sourates et versets', 'Prière et invocations'],
    aciklamalar: ['Lettres, voyelles et exercices de lecture. Commencez par l’alphabet, puis avancez à votre rythme.', 'Écoutez une récitation entière ou reprenez les versets un à un lorsque les enregistrements sont disponibles.', 'Retrouvez les invocations et les paroles de la prière pour les écouter et les répéter.'],
    ara: 'Rechercher un cours', ornek: 'Alphabet, fatḥa, Fâtiḥa…', sayac: 'cours', bos: 'Aucun cours trouvé. Essayez un autre mot ou effacez votre recherche.', kaynak: 'Enregistrements officiels de la Diyanet', qr: 'Les codes QR de votre livre ouvrent toujours les mêmes cours.',
  },
  en: {
    baslik: 'Learning My Religion',
    giris: 'For anyone discovering Islam, learning to read the Qur’an or developing their basic knowledge. Lessons are free; no book, QR code or account is needed.',
    dilNotu: 'Lesson titles and the player are in English; recitations are in Arabic. Transcriptions and meanings from the handbook are labelled as French.',
    baslangic: 'Start learning', test: 'Assess my level', ilkDers: 'First lesson: Arabic letters', rehber: 'Discover Islam', destek: 'Contact us for learning support',
    bolumler: ['Learn to read', 'Surahs and verses', 'Prayer and supplications'],
    aciklamalar: ['Letters, vowel marks and reading exercises. Start with the alphabet and learn at your own pace.', 'Listen to complete recitations or individual verses where recordings are available.', 'Listen to and repeat the words of prayer and supplications.'],
    ara: 'Find a lesson', ornek: 'Alphabet, fatha, Fatiha…', sayac: 'lessons', bos: 'No lessons found. Try another word or clear your search.', kaynak: 'Official Diyanet recordings', qr: 'The QR codes in your book still open the same lessons.',
  },
  nl: {
    baslik: 'Mijn geloof leren kennen',
    giris: 'Voor iedereen die de islam ontdekt, de Koran wil leren lezen of zijn basiskennis wil verdiepen. De lessen zijn gratis; een boek, QR-code of account is niet nodig.',
    dilNotu: 'De lestitels en de speler zijn in het Nederlands; de recitaties zijn in het Arabisch. Transcripties en betekenissen uit het handboek zijn als Frans aangeduid.',
    baslangic: 'Begin met leren', test: 'Mijn niveau bepalen', ilkDers: 'Eerste les: Arabische letters', rehber: 'De islam ontdekken', destek: 'Neem contact op voor begeleiding',
    bolumler: ['Leren lezen', 'Soera’s en verzen', 'Gebed en smeekbeden'],
    aciklamalar: ['Letters, klinkertekens en leesoefeningen. Begin met het alfabet en leer in uw eigen tempo.', 'Luister naar volledige recitaties of afzonderlijke verzen wanneer er opnamen beschikbaar zijn.', 'Luister naar de woorden van het gebed en de smeekbeden en herhaal ze.'],
    ara: 'Een les zoeken', ornek: 'Alphabet, fatha, Fatiha…', sayac: 'lessen', bos: 'Geen lessen gevonden. Probeer een ander woord of wis uw zoekopdracht.', kaynak: 'Officiële opnamen van Diyanet', qr: 'De QR-codes in uw boek openen nog steeds dezelfde lessen.',
  },
  de: {
    baslik: 'Meine Religion kennenlernen',
    giris: 'Für alle, die den Islam kennenlernen, den Koran lesen lernen oder ihre Grundkenntnisse vertiefen möchten. Die Kurse sind kostenlos; ein Buch, QR-Code oder Benutzerkonto ist nicht erforderlich.',
    dilNotu: 'Kurstitel und Player sind auf Deutsch, Rezitationen auf Arabisch. Umschriften und Bedeutungen aus dem Lehrbuch sind als Französisch gekennzeichnet.',
    baslangic: 'Mit dem Lernen beginnen', test: 'Mein Niveau bestimmen', ilkDers: 'Erster Kurs: arabische Buchstaben', rehber: 'Den Islam kennenlernen', destek: 'Kontakt für Lernbegleitung',
    bolumler: ['Lesen lernen', 'Suren und Verse', 'Gebet und Bittgebete'],
    aciklamalar: ['Buchstaben, Vokalzeichen und Leseübungen. Beginnen Sie mit dem Alphabet und lernen Sie in Ihrem eigenen Tempo.', 'Hören Sie vollständige Rezitationen oder einzelne Verse, soweit Aufnahmen verfügbar sind.', 'Hören und wiederholen Sie die Gebetstexte und Bittgebete.'],
    ara: 'Einen Kurs suchen', ornek: 'Alphabet, fatha, Fatiha…', sayac: 'Kurse', bos: 'Keine Kurse gefunden. Versuchen Sie ein anderes Wort oder löschen Sie Ihre Suche.', kaynak: 'Offizielle Aufnahmen von Diyanet', qr: 'Die QR-Codes in Ihrem Buch öffnen weiterhin dieselben Kurse.',
  },
};
