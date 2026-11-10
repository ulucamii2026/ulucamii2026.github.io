/**
 * İlim Yolu bilgi yolları metinleri (Dilim 2, 10 Kasım 2026): yol dizini, yol sayfası, bilgi kartı, mini sınav, yerleştirme testi, rozetler ve belge.
 * Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md). Türkçe «siz»; Fransızca «vous», Hollandaca «u», Almanca «Sie». Kartların kendi içeriği
 * (başlık, özet, soru) src/data/ilim-yolu/kartlar/*.json'dadır; buradaki yalnız arayüz metnidir. Dinî hüküm cümlesi yoktur. Fransızca metin
 * kaynakta düz boşlukla yazılır; `yollarMetinleri('fr')` ince/bölünmez boşluk koyar. `{n}`-türü yer tutucular `doldur` ile (kip-ortak) doldurulur.
 */
import type { Dil } from '@ortak/i18n/ui';
import type { PlanKodu } from '@ortak/lib/ilim-yolu/bilgi-kartlari';
import type { AlanKodu } from '@ortak/lib/seviye-testi/tipler';
import { ALANLAR } from '@ortak/lib/ilim-yolu/yollar';
import { ilimMetinleri } from './ilim';
import { fransizTipografi } from './metinler';

export interface YollarMetinleri {
  /** Ortak */
  yollarBaglanti: string;
  taslak: string;
  taslakAciklama: string;
  planAd: Record<PlanKodu, string>;
  bilgiAd: string;
  /** «Basamak {n}» */
  basamak: string;
  /** «{n} / {m} öğrenildi» */
  sayim: string;
  /** «{n} / {m} çalışıldı» (bilgi maddeleri) */
  sayimBilgi: string;
  /** «{n} kart» */
  kartSayisi: string;
  /** «{n} madde» (bilgi maddeleri) */
  maddeSayisi: string;
  rozetKazanildi: string;
  yolaBak: string;

  /** Dizin */
  baslik: string;
  aciklama: string;
  lead: string;
  yerBaslik: string;
  yerMetin: string;
  yerDugme: string;
  planBaslik: string;
  planMetin: string;
  bilgiBaslik: string;
  bilgiMetin: string;
  seviyeBaslik: string;
  seviyeMetin: string;
  rozetBaglanti: string;
  cihazNotu: string;
  jsGerek: string;

  /** Yol sayfası */
  yolUst: string;
  yolKartlar: string;
  tumYollar: string;
  durumOgrenildi: string;
  durumSinav: string;
  durumBekliyor: string;
  bilgiCalisildi: string;
  bilgiBekliyor: string;
  bilgiYolNotu: string;
  yolRozet: string;

  /** Bilgi kartı */
  kartUst: string;
  kitap: string;
  yollari: string;
  ogrendim: string;
  ogrendimOldu: string;
  ogrendimNot: string;
  kaydedilemedi: string;
  sinavBaslik: string;
  sinavYonerge: string;
  sinavYok: string;
  /** «Soru {n} / {m}» */
  soruNo: string;
  kontrolEt: string;
  dogru: string;
  /** «Yanlış. Doğru cevap: {c}» */
  yanlis: string;
  secimYok: string;
  sonucTam: string;
  /** «{n} / {m} doğru.» */
  sonucEksik: string;
  yeniden: string;
  onceki: string;
  sonraki: string;

  /** Yerleştirme testi */
  yBaslik: string;
  yAciklama: string;
  yLead: string;
  yGizlilik: string;
  yBasla: string;
  yNo: string;
  yBilmiyorum: string;
  yIleri: string;
  ySonuc: string;
  /** «{alan} yolunda {b}. basamaktan başlayın.» */
  yOneri: string;
  yAlanlar: string;
  yAlanSatiri: string;
  yYolaGit: string;
  yYeniden: string;
  yNot: string;

  /** Rozetler ve belge */
  rBaslik: string;
  rAciklama: string;
  rLead: string;
  rKazanildi: string;
  /** «Henüz değil · {n} / {m}» */
  rKazanilmadi: string;
  rBelge: string;
  rHicYok: string;
  rGizlilik: string;
  rSecili: string;
  bBaslik: string;
  /** «… {yol} …» */
  bIfade: string;
  bTabloAdi: string;
  bSutunNo: string;
  bSutunKonu: string;
  bSutunDurum: string;
  bDurumOgrenildi: string;
  bDurumSinav: string;
  bDurumCalisildi: string;
  /** «{n} kart» */
  bOzet: string;
  bOzetBilgi: string;
}

const YOLLAR: Record<Dil, YollarMetinleri> = {
  tr: {
    yollarBaglanti: 'Bilgi yolları',
    taslak: 'Taslak',
    taslakAciklama: 'Bu metin henüz hoca tarafından onaylanmadı.',
    planAd: { kuran: 'Kur’an dersleri', itikat: 'İman (itikat)', ibadet: 'İbadet', siyer: 'Siyer', ahlak: 'Ahlak' },
    bilgiAd: 'Bilgi maddeleri',
    basamak: 'Basamak {n}',
    sayim: '{n} / {m} öğrenildi',
    sayimBilgi: '{n} / {m} çalışıldı',
    kartSayisi: '{n} kart',
    maddeSayisi: '{n} madde',
    rozetKazanildi: 'Rozet kazanıldı',
    yolaBak: 'Yola bakın',

    baslik: 'Bilgi yolları',
    aciklama: 'Kur’an kursunun konuları kart ve mini soru olarak; bilgi maddeleri; seviye testinin yedi alanına göre yol. İlerlemenizi siz işaretlersiniz.',
    lead: 'Kurs konularını, bilgi maddelerini ve yedi alanlı seviye yolunu kendi hızınızda izleyin. «Öğrendim» işaretini siz koyarsınız; isterseniz mini soruyla kendinizi denersiniz.',
    yerBaslik: 'Nereden başlayacağınızı öğrenin',
    yerMetin: 'Kısa bir yerleştirme testi çözün; test yalnız bir yol önerir. Cevaplarınız hiçbir yere gönderilmez.',
    yerDugme: 'Teste başlayın',
    planBaslik: 'Kurs konuları',
    planMetin: 'Yıllık plandaki konular. Her biri kısa bir kart; çoğunda iki mini soru var.',
    bilgiBaslik: 'Bilgi maddeleri',
    bilgiMetin: 'İmanın şartları, abdestin farzları gibi sayılı bilgiler. Sayfaları Ezber Kilimi’ndedir.',
    seviyeBaslik: 'Seviye yolu',
    seviyeMetin: 'Seviye testinin yedi alanı. Her alanda kartlar basamak basamak ilerler.',
    rozetBaglanti: 'Rozetlerim ve belge',
    cihazNotu: 'İşaretleriniz bu cihazda saklanır; hesabınıza girdiyseniz hesabınızla da eşitlenir.',
    jsGerek: 'İlerlemenizi göstermek için bu sayfa JavaScript gerektirir.',

    yolUst: 'Bilgi yolu',
    yolKartlar: 'Kartlar',
    tumYollar: 'Bütün yollar',
    durumOgrenildi: 'Öğrenildi',
    durumSinav: 'Öğrenildi · mini soru çözüldü',
    durumBekliyor: 'Henüz işaretlenmedi',
    bilgiCalisildi: 'Çalışıldı',
    bilgiBekliyor: 'Henüz çalışılmadı',
    bilgiYolNotu: 'Bu maddeler Ezber Kilimi’nde çalışılır; burada yalnız çalışıp çalışmadığınız görünür.',
    yolRozet: 'Bu yolun tamamını öğrendiğinizde rozet kazanırsınız.',

    kartUst: 'Bilgi kartı',
    kitap: 'Kitaptaki yeri',
    yollari: 'Bu kart şu yollarda',
    ogrendim: 'Öğrendim',
    ogrendimOldu: 'Bu kartı öğrendim olarak işaretlediniz.',
    ogrendimNot: 'İşareti siz koyarsınız; geri alınmaz.',
    kaydedilemedi: 'İşaret bu cihazda saklanamadı (tarayıcı depolaması kapalı).',
    sinavBaslik: 'Mini sınav',
    sinavYonerge: 'İsterseniz iki soruyla kendinizi deneyin. Zorunlu değildir.',
    sinavYok: 'Bu kartın mini sorusu yok.',
    soruNo: 'Soru {n} / {m}',
    kontrolEt: 'Cevapları kontrol edin',
    dogru: 'Doğru.',
    yanlis: 'Yanlış. Doğru cevap: {c}',
    secimYok: 'Önce her soruda bir şık seçin.',
    sonucTam: 'Hepsi doğru. Kart öğrenildi olarak işaretlendi.',
    sonucEksik: '{n} / {m} doğru. İsterseniz yeniden deneyin.',
    yeniden: 'Yeniden deneyin',
    onceki: 'Önceki kart',
    sonraki: 'Sonraki kart',

    yBaslik: 'Yerleştirme testi',
    yAciklama: 'Kısa bir test çözün, size uygun bilgi yolunu ve başlangıç basamağını öğrenin. Cevaplarınız hiçbir yere gönderilmez.',
    yLead: 'Her alandan birkaç soru gelir; bir basamak geçilmezse üst basamak sorulmaz, böylece test kısa kalır. Sonunda yalnız bir yol önerilir.',
    yGizlilik: 'Gizlilik: Cevaplarınız yalnız bu sayfada, tarayıcınızın belleğinde durur. Hiçbir yere gönderilmez, kaydedilmez; sayfayı kapatınca silinir.',
    yBasla: 'Başlayın',
    yNo: 'Soru {n}',
    yBilmiyorum: 'Bilmiyorum',
    yIleri: 'Sonraki soru',
    ySonuc: 'Önerilen yol',
    yOneri: '{alan} yolunda {b}. basamaktan başlamanızı öneririz.',
    yAlanlar: 'Alan alan sonuç',
    yAlanSatiri: '{alan}: {b}. basamaktan başlayın',
    yYolaGit: 'Bu yola gidin',
    yYeniden: 'Testi yeniden çözün',
    yNot: 'Bu yalnız bir öneridir. Dilediğiniz yoldan başlayabilirsiniz.',

    rBaslik: 'Rozetlerim',
    rAciklama: 'Bir yolun bütün kartlarını öğrendiğinizde o yolun rozetini kazanırsınız; kendi çalışmanızla hazırlanan basılabilir belgeyi alabilirsiniz.',
    rLead: 'Bir yolun bütün kartları öğrenildi olarak işaretlenince rozet kazanılır. Belge, o yolu kendi çalışmanızla öğrendiğinizi gösterir; hocanın dinlediği ezberin sertifikası değildir.',
    rKazanildi: 'Kazanıldı',
    rKazanilmadi: 'Henüz değil · {n} / {m}',
    rBelge: 'Belgesini hazırlayın',
    rHicYok: 'Henüz rozet yok. Bir yolun kartlarını öğrenmeye başlayın.',
    rGizlilik: 'Gizlilik: Belgeye yazdığınız ad hiçbir yere gönderilmez ve kaydedilmez; sayfayı kapatınca silinir.',
    rSecili: 'Hazırlanan belge',
    bBaslik: 'Yol Belgesi',
    bIfade: 'Bu belge, «{yol}» yolundaki aşağıdaki konuların kendi çalışmasıyla, hoca dinlemeden öğrenildiğini gösterir. Ezber Sertifikası yalnız hocanın dinlediği ezberlere verilir.',
    bTabloAdi: 'Öğrenilen konular',
    bSutunNo: 'No',
    bSutunKonu: 'Konu',
    bSutunDurum: 'Durum',
    bDurumOgrenildi: 'Öğrenildi',
    bDurumSinav: 'Öğrenildi · mini soru',
    bDurumCalisildi: 'Çalışıldı',
    bOzet: '{n} konu',
    bOzetBilgi: '{n} madde',
  },
  fr: {
    yollarBaglanti: 'Chemins de connaissance',
    taslak: 'Brouillon',
    taslakAciklama: 'Ce texte n’a pas encore été validé par l’enseignant.',
    planAd: { kuran: 'Cours de Coran', itikat: 'Foi (‘aqîda)', ibadet: 'Adoration', siyer: 'Biographie du Prophète', ahlak: 'Éthique' },
    bilgiAd: 'Notions à connaître',
    basamak: 'Niveau {n}',
    sayim: '{n} sur {m} appris',
    sayimBilgi: '{n} sur {m} travaillés',
    kartSayisi: '{n} fiches',
    maddeSayisi: '{n} notions',
    rozetKazanildi: 'Insigne obtenu',
    yolaBak: 'Voir le chemin',

    baslik: 'Chemins de connaissance',
    aciklama: 'Les thèmes du cours de Coran en fiches et mini-questions ; les notions à connaître ; un chemin selon les sept domaines du test de niveau. Vous cochez vous-même votre progression.',
    lead: 'Suivez les thèmes du cours, les notions à connaître et le chemin de niveau en sept domaines à votre rythme. C’est vous qui cochez « J’ai appris » ; si vous le souhaitez, vous vous testez avec une mini-question.',
    yerBaslik: 'Découvrez par où commencer',
    yerMetin: 'Répondez à un court test de placement ; il ne fait que proposer un chemin. Vos réponses ne sont envoyées nulle part.',
    yerDugme: 'Commencer le test',
    planBaslik: 'Thèmes du cours',
    planMetin: 'Les thèmes du plan annuel. Chacun est une courte fiche ; la plupart ont deux mini-questions.',
    bilgiBaslik: 'Notions à connaître',
    bilgiMetin: 'Des listes comme les piliers de la foi ou les obligations des ablutions. Leurs pages se trouvent dans le Kilim de mémorisation.',
    seviyeBaslik: 'Chemin par niveau',
    seviyeMetin: 'Les sept domaines du test de niveau. Dans chaque domaine, les fiches avancent niveau par niveau.',
    rozetBaglanti: 'Mes insignes et mon attestation',
    cihazNotu: 'Vos marques sont conservées sur cet appareil ; si vous êtes connecté, elles sont aussi synchronisées avec votre compte.',
    jsGerek: 'Cette page a besoin de JavaScript pour afficher votre progression.',

    yolUst: 'Chemin de connaissance',
    yolKartlar: 'Fiches',
    tumYollar: 'Tous les chemins',
    durumOgrenildi: 'Appris',
    durumSinav: 'Appris · mini-question réussie',
    durumBekliyor: 'Pas encore coché',
    bilgiCalisildi: 'Travaillé',
    bilgiBekliyor: 'Pas encore travaillé',
    bilgiYolNotu: 'Ces notions se travaillent dans le Kilim de mémorisation ; ici, vous voyez seulement si vous les avez travaillées.',
    yolRozet: 'Vous obtenez l’insigne de ce chemin quand vous avez appris toutes ses fiches.',

    kartUst: 'Fiche de connaissance',
    kitap: 'Dans le manuel',
    yollari: 'Cette fiche se trouve dans ces chemins',
    ogrendim: 'J’ai appris',
    ogrendimOldu: 'Vous avez marqué cette fiche comme apprise.',
    ogrendimNot: 'C’est vous qui cochez ; la marque ne se retire pas.',
    kaydedilemedi: 'La marque n’a pas pu être conservée sur cet appareil (stockage du navigateur désactivé).',
    sinavBaslik: 'Mini-questionnaire',
    sinavYonerge: 'Si vous le souhaitez, testez-vous avec deux questions. Ce n’est pas obligatoire.',
    sinavYok: 'Cette fiche n’a pas de mini-question.',
    soruNo: 'Question {n} sur {m}',
    kontrolEt: 'Vérifier les réponses',
    dogru: 'Correct.',
    yanlis: 'Incorrect. Bonne réponse : {c}',
    secimYok: 'Choisissez d’abord une réponse à chaque question.',
    sonucTam: 'Tout est correct. La fiche est marquée comme apprise.',
    sonucEksik: '{n} sur {m} correct. Vous pouvez réessayer si vous le souhaitez.',
    yeniden: 'Réessayer',
    onceki: 'Fiche précédente',
    sonraki: 'Fiche suivante',

    yBaslik: 'Test de placement',
    yAciklama: 'Répondez à un court test pour connaître le chemin et le niveau de départ qui vous conviennent. Vos réponses ne sont envoyées nulle part.',
    yLead: 'Quelques questions par domaine ; si un niveau n’est pas réussi, le niveau supérieur n’est pas demandé, ce qui garde le test court. À la fin, un seul chemin est proposé.',
    yGizlilik: 'Confidentialité : vos réponses restent uniquement sur cette page, dans la mémoire de votre navigateur. Elles ne sont ni envoyées ni enregistrées ; elles disparaissent à la fermeture de la page.',
    yBasla: 'Commencer',
    yNo: 'Question {n}',
    yBilmiyorum: 'Je ne sais pas',
    yIleri: 'Question suivante',
    ySonuc: 'Chemin proposé',
    yOneri: 'Nous vous proposons de commencer par le chemin « {alan} », au niveau {b}.',
    yAlanlar: 'Résultat par domaine',
    yAlanSatiri: '{alan} : commencer au niveau {b}',
    yYolaGit: 'Aller à ce chemin',
    yYeniden: 'Refaire le test',
    yNot: 'Ce n’est qu’une suggestion. Vous pouvez commencer par le chemin de votre choix.',

    rBaslik: 'Mes insignes',
    rAciklama: 'Quand vous avez appris toutes les fiches d’un chemin, vous obtenez son insigne et pouvez imprimer une attestation de votre travail personnel.',
    rLead: 'L’insigne s’obtient quand toutes les fiches d’un chemin sont marquées comme apprises. L’attestation indique que vous avez appris ce chemin par votre propre travail ; ce n’est pas le certificat de la mémorisation écoutée par l’enseignant.',
    rKazanildi: 'Obtenu',
    rKazanilmadi: 'Pas encore · {n} sur {m}',
    rBelge: 'Préparer l’attestation',
    rHicYok: 'Aucun insigne pour l’instant. Commencez à apprendre les fiches d’un chemin.',
    rGizlilik: 'Confidentialité : le nom saisi n’est ni envoyé ni enregistré ; il disparaît à la fermeture de la page.',
    rSecili: 'Attestation préparée',
    bBaslik: 'Attestation de parcours',
    bIfade: 'Ce document indique que les thèmes ci-dessous du chemin « {yol} » ont été appris par la personne elle-même, par son propre travail, sans qu’un enseignant l’ait écoutée. Le certificat de mémorisation n’est délivré que pour les textes écoutés par l’enseignant.',
    bTabloAdi: 'Thèmes appris',
    bSutunNo: 'N°',
    bSutunKonu: 'Thème',
    bSutunDurum: 'Statut',
    bDurumOgrenildi: 'Appris',
    bDurumSinav: 'Appris · mini-question',
    bDurumCalisildi: 'Travaillé',
    bOzet: '{n} thèmes',
    bOzetBilgi: '{n} notions',
  },
  en: {
    yollarBaglanti: 'Knowledge paths',
    taslak: 'Draft',
    taslakAciklama: 'This text has not yet been approved by the teacher.',
    planAd: { kuran: 'Quran lessons', itikat: 'Faith (creed)', ibadet: 'Worship', siyer: 'The Prophet’s life', ahlak: 'Ethics' },
    bilgiAd: 'Items to know',
    basamak: 'Step {n}',
    sayim: '{n} of {m} learned',
    sayimBilgi: '{n} of {m} studied',
    kartSayisi: '{n} cards',
    maddeSayisi: '{n} items',
    rozetKazanildi: 'Badge earned',
    yolaBak: 'See the path',

    baslik: 'Knowledge paths',
    aciklama: 'The topics of the Quran course as cards and mini quizzes; items to know; a path by the seven areas of the level test. You mark your own progress.',
    lead: 'Follow the course topics, the items to know and the seven-area level path at your own pace. You tick “I learned it” yourself; if you like, you can test yourself with a mini quiz.',
    yerBaslik: 'Find out where to start',
    yerMetin: 'Take a short placement test; it only suggests a path. Your answers are not sent anywhere.',
    yerDugme: 'Start the test',
    planBaslik: 'Course topics',
    planMetin: 'The topics of the yearly plan. Each is a short card; most have two mini questions.',
    bilgiBaslik: 'Items to know',
    bilgiMetin: 'Counted lists such as the articles of faith or the obligations of ablution. Their pages are in the Memorisation kilim.',
    seviyeBaslik: 'Level path',
    seviyeMetin: 'The seven areas of the level test. In each area the cards go step by step.',
    rozetBaglanti: 'My badges and certificate',
    cihazNotu: 'Your marks are kept on this device; if you are signed in, they are also synced with your account.',
    jsGerek: 'This page needs JavaScript to show your progress.',

    yolUst: 'Knowledge path',
    yolKartlar: 'Cards',
    tumYollar: 'All paths',
    durumOgrenildi: 'Learned',
    durumSinav: 'Learned · mini quiz passed',
    durumBekliyor: 'Not marked yet',
    bilgiCalisildi: 'Studied',
    bilgiBekliyor: 'Not studied yet',
    bilgiYolNotu: 'These items are studied in the Memorisation kilim; here you only see whether you have studied them.',
    yolRozet: 'You earn this path’s badge when you have learned all of its cards.',

    kartUst: 'Knowledge card',
    kitap: 'Where in the book',
    yollari: 'This card is on these paths',
    ogrendim: 'I learned it',
    ogrendimOldu: 'You marked this card as learned.',
    ogrendimNot: 'You set the mark yourself; it cannot be undone.',
    kaydedilemedi: 'The mark could not be stored on this device (browser storage is off).',
    sinavBaslik: 'Mini quiz',
    sinavYonerge: 'If you like, test yourself with two questions. It is not required.',
    sinavYok: 'This card has no mini quiz.',
    soruNo: 'Question {n} of {m}',
    kontrolEt: 'Check the answers',
    dogru: 'Correct.',
    yanlis: 'Incorrect. Correct answer: {c}',
    secimYok: 'First choose an answer for every question.',
    sonucTam: 'All correct. The card is marked as learned.',
    sonucEksik: '{n} of {m} correct. You can try again if you like.',
    yeniden: 'Try again',
    onceki: 'Previous card',
    sonraki: 'Next card',

    yBaslik: 'Placement test',
    yAciklama: 'Take a short test to find the knowledge path and starting step that suit you. Your answers are not sent anywhere.',
    yLead: 'A few questions come from each area; if a step is not passed, the next step is not asked, so the test stays short. At the end, only one path is suggested.',
    yGizlilik: 'Privacy: Your answers stay on this page, in your browser’s memory only. They are not sent or saved; they disappear when you close the page.',
    yBasla: 'Start',
    yNo: 'Question {n}',
    yBilmiyorum: 'I don’t know',
    yIleri: 'Next question',
    ySonuc: 'Suggested path',
    yOneri: 'We suggest starting on the “{alan}” path at step {b}.',
    yAlanlar: 'Result by area',
    yAlanSatiri: '{alan}: start at step {b}',
    yYolaGit: 'Go to this path',
    yYeniden: 'Take the test again',
    yNot: 'This is only a suggestion. You can start on any path you like.',

    rBaslik: 'My badges',
    rAciklama: 'When you have learned all the cards of a path you earn its badge and can print a certificate of your own study.',
    rLead: 'A badge is earned when all cards of a path are marked as learned. The certificate shows that you learned the path through your own study; it is not the memorisation certificate for recitation a teacher listened to.',
    rKazanildi: 'Earned',
    rKazanilmadi: 'Not yet · {n} of {m}',
    rBelge: 'Prepare the certificate',
    rHicYok: 'No badge yet. Start learning the cards of a path.',
    rGizlilik: 'Privacy: The name you type is not sent or saved; it disappears when you close the page.',
    rSecili: 'Prepared certificate',
    bBaslik: 'Path Certificate',
    bIfade: 'This document shows that the topics listed below on the “{yol}” path were learned by the person through their own study, without a teacher listening. The Memorisation Certificate is awarded only for texts that a teacher has listened to.',
    bTabloAdi: 'Topics learned',
    bSutunNo: 'No.',
    bSutunKonu: 'Topic',
    bSutunDurum: 'Status',
    bDurumOgrenildi: 'Learned',
    bDurumSinav: 'Learned · mini quiz',
    bDurumCalisildi: 'Studied',
    bOzet: '{n} topics',
    bOzetBilgi: '{n} items',
  },
  nl: {
    yollarBaglanti: 'Kennispaden',
    taslak: 'Concept',
    taslakAciklama: 'Deze tekst is nog niet door de leerkracht goedgekeurd.',
    planAd: { kuran: 'Koranlessen', itikat: 'Geloof (aqida)', ibadet: 'Aanbidding', siyer: 'Het leven van de Profeet', ahlak: 'Ethiek' },
    bilgiAd: 'Te kennen punten',
    basamak: 'Niveau {n}',
    sayim: '{n} van {m} geleerd',
    sayimBilgi: '{n} van {m} geoefend',
    kartSayisi: '{n} kaarten',
    maddeSayisi: '{n} punten',
    rozetKazanildi: 'Insigne behaald',
    yolaBak: 'Bekijk de weg',

    baslik: 'Kennispaden',
    aciklama: 'De onderwerpen van de Koranles als kaarten en minivragen; te kennen punten; een pad volgens de zeven gebieden van de niveautest. U vinkt uw voortgang zelf af.',
    lead: 'Volg de lesonderwerpen, de te kennen punten en het niveaupad met zeven gebieden in uw eigen tempo. U zet zelf het vinkje “Ik heb het geleerd”; als u wilt, test u zichzelf met een minivraag.',
    yerBaslik: 'Ontdek waar u kunt beginnen',
    yerMetin: 'Maak een korte plaatsingstest; die stelt alleen een pad voor. Uw antwoorden worden nergens naartoe gestuurd.',
    yerDugme: 'Start de test',
    planBaslik: 'Lesonderwerpen',
    planMetin: 'De onderwerpen van het jaarplan. Elk is een korte kaart; de meeste hebben twee minivragen.',
    bilgiBaslik: 'Te kennen punten',
    bilgiMetin: 'Getelde lijsten zoals de geloofsartikelen of de verplichtingen van de wassing. Hun pagina’s staan in het Memorisatiekelim.',
    seviyeBaslik: 'Niveauweg',
    seviyeMetin: 'De zeven gebieden van de niveautest. In elk gebied gaan de kaarten stap voor stap.',
    rozetBaglanti: 'Mijn insignes en bewijs',
    cihazNotu: 'Uw vinkjes worden op dit apparaat bewaard; bent u ingelogd, dan worden ze ook met uw account gesynchroniseerd.',
    jsGerek: 'Deze pagina heeft JavaScript nodig om uw voortgang te tonen.',

    yolUst: 'Kennispad',
    yolKartlar: 'Kaarten',
    tumYollar: 'Alle paden',
    durumOgrenildi: 'Geleerd',
    durumSinav: 'Geleerd · minivragen goed',
    durumBekliyor: 'Nog niet afgevinkt',
    bilgiCalisildi: 'Geoefend',
    bilgiBekliyor: 'Nog niet geoefend',
    bilgiYolNotu: 'Deze punten oefent u in het Memorisatiekelim; hier ziet u alleen of u ze hebt geoefend.',
    yolRozet: 'U behaalt het insigne van dit pad als u alle kaarten hebt geleerd.',

    kartUst: 'Kenniskaart',
    kitap: 'Plaats in het boek',
    yollari: 'Deze kaart staat op deze paden',
    ogrendim: 'Ik heb het geleerd',
    ogrendimOldu: 'U hebt deze kaart als geleerd afgevinkt.',
    ogrendimNot: 'U zet het vinkje zelf; het kan niet ongedaan worden gemaakt.',
    kaydedilemedi: 'Het vinkje kon niet op dit apparaat worden bewaard (browseropslag staat uit).',
    sinavBaslik: 'Minitoets',
    sinavYonerge: 'Als u wilt, test u zichzelf met twee vragen. Het is niet verplicht.',
    sinavYok: 'Deze kaart heeft geen minivraag.',
    soruNo: 'Vraag {n} van {m}',
    kontrolEt: 'Controleer de antwoorden',
    dogru: 'Juist.',
    yanlis: 'Onjuist. Juist antwoord: {c}',
    secimYok: 'Kies eerst bij elke vraag een antwoord.',
    sonucTam: 'Alles juist. De kaart is als geleerd afgevinkt.',
    sonucEksik: '{n} van {m} juist. U kunt het opnieuw proberen.',
    yeniden: 'Probeer opnieuw',
    onceki: 'Vorige kaart',
    sonraki: 'Volgende kaart',

    yBaslik: 'Plaatsingstest',
    yAciklama: 'Maak een korte test om het kennispad en het beginniveau te vinden dat bij u past. Uw antwoorden worden nergens naartoe gestuurd.',
    yLead: 'Per gebied komen enkele vragen; als een niveau niet gehaald wordt, wordt het volgende niet gevraagd, zodat de test kort blijft. Aan het einde wordt maar één pad voorgesteld.',
    yGizlilik: 'Privacy: uw antwoorden blijven alleen op deze pagina, in het geheugen van uw browser. Ze worden niet verstuurd of opgeslagen; ze verdwijnen als u de pagina sluit.',
    yBasla: 'Beginnen',
    yNo: 'Vraag {n}',
    yBilmiyorum: 'Ik weet het niet',
    yIleri: 'Volgende vraag',
    ySonuc: 'Voorgesteld pad',
    yOneri: 'Wij raden u aan te beginnen met het pad “{alan}”, op niveau {b}.',
    yAlanlar: 'Uitslag per gebied',
    yAlanSatiri: '{alan}: begin op niveau {b}',
    yYolaGit: 'Ga naar dit pad',
    yYeniden: 'Doe de test opnieuw',
    yNot: 'Dit is slechts een suggestie. U kunt beginnen met elk pad dat u wilt.',

    rBaslik: 'Mijn insignes',
    rAciklama: 'Als u alle kaarten van een pad hebt geleerd, behaalt u het insigne en kunt u een bewijs van eigen studie afdrukken.',
    rLead: 'Een insigne krijgt u als alle kaarten van een pad als geleerd zijn afgevinkt. Het bewijs toont dat u het pad met eigen studie hebt geleerd; het is niet het memorisatiecertificaat voor wat een leerkracht heeft beluisterd.',
    rKazanildi: 'Behaald',
    rKazanilmadi: 'Nog niet · {n} van {m}',
    rBelge: 'Bewijs opmaken',
    rHicYok: 'Nog geen insigne. Begin met het leren van de kaarten van een pad.',
    rGizlilik: 'Privacy: de ingevulde naam wordt niet verstuurd of opgeslagen; hij verdwijnt als u de pagina sluit.',
    rSecili: 'Opgemaakt bewijs',
    bBaslik: 'Padbewijs',
    bIfade: 'Dit document toont aan dat de onderstaande onderwerpen van het pad “{yol}” door de persoon zelf zijn geleerd, met eigen studie, zonder dat een leerkracht luisterde. Het memorisatiecertificaat wordt alleen uitgereikt voor teksten waarnaar een leerkracht heeft geluisterd.',
    bTabloAdi: 'Geleerde onderwerpen',
    bSutunNo: 'Nr.',
    bSutunKonu: 'Onderwerp',
    bSutunDurum: 'Status',
    bDurumOgrenildi: 'Geleerd',
    bDurumSinav: 'Geleerd · minivraag',
    bDurumCalisildi: 'Geoefend',
    bOzet: '{n} onderwerpen',
    bOzetBilgi: '{n} punten',
  },
  de: {
    yollarBaglanti: 'Wissenswege',
    taslak: 'Entwurf',
    taslakAciklama: 'Dieser Text wurde von der Lehrkraft noch nicht freigegeben.',
    planAd: { kuran: 'Koranunterricht', itikat: 'Glaube (Aqida)', ibadet: 'Gottesdienst', siyer: 'Das Leben des Propheten', ahlak: 'Ethik' },
    bilgiAd: 'Wissenspunkte',
    basamak: 'Stufe {n}',
    sayim: '{n} von {m} gelernt',
    sayimBilgi: '{n} von {m} geübt',
    kartSayisi: '{n} Karten',
    maddeSayisi: '{n} Punkte',
    rozetKazanildi: 'Abzeichen erhalten',
    yolaBak: 'Weg ansehen',

    baslik: 'Wissenswege',
    aciklama: 'Die Themen des Koran-Kurses als Karten und Mini-Fragen; Wissenspunkte; ein Weg nach den sieben Bereichen des Stufentests. Ihren Fortschritt haken Sie selbst ab.',
    lead: 'Folgen Sie den Kursthemen, den Wissenspunkten und dem Stufenweg mit sieben Bereichen in Ihrem eigenen Tempo. Das Häkchen „Gelernt“ setzen Sie selbst; wenn Sie möchten, prüfen Sie sich mit einer Mini-Frage.',
    yerBaslik: 'Finden Sie heraus, wo Sie anfangen',
    yerMetin: 'Lösen Sie einen kurzen Einstufungstest; er schlägt nur einen Weg vor. Ihre Antworten werden nirgendwohin gesendet.',
    yerDugme: 'Test starten',
    planBaslik: 'Kursthemen',
    planMetin: 'Die Themen des Jahresplans. Jedes ist eine kurze Karte; die meisten haben zwei Mini-Fragen.',
    bilgiBaslik: 'Wissenspunkte',
    bilgiMetin: 'Aufzählungen wie die Glaubensartikel oder die Pflichten der Waschung. Ihre Seiten befinden sich im Memorier-Kelim.',
    seviyeBaslik: 'Stufenweg',
    seviyeMetin: 'Die sieben Bereiche des Stufentests. In jedem Bereich gehen die Karten Stufe für Stufe voran.',
    rozetBaglanti: 'Meine Abzeichen und Urkunde',
    cihazNotu: 'Ihre Häkchen werden auf diesem Gerät gespeichert; wenn Sie angemeldet sind, werden sie auch mit Ihrem Konto abgeglichen.',
    jsGerek: 'Diese Seite braucht JavaScript, um Ihren Fortschritt anzuzeigen.',

    yolUst: 'Wissensweg',
    yolKartlar: 'Karten',
    tumYollar: 'Alle Wege',
    durumOgrenildi: 'Gelernt',
    durumSinav: 'Gelernt · Mini-Frage gelöst',
    durumBekliyor: 'Noch nicht abgehakt',
    bilgiCalisildi: 'Geübt',
    bilgiBekliyor: 'Noch nicht geübt',
    bilgiYolNotu: 'Diese Punkte werden im Memorier-Kelim geübt; hier sehen Sie nur, ob Sie sie geübt haben.',
    yolRozet: 'Das Abzeichen dieses Wegs erhalten Sie, wenn Sie alle seine Karten gelernt haben.',

    kartUst: 'Wissenskarte',
    kitap: 'Stelle im Buch',
    yollari: 'Diese Karte liegt auf diesen Wegen',
    ogrendim: 'Gelernt',
    ogrendimOldu: 'Sie haben diese Karte als gelernt markiert.',
    ogrendimNot: 'Das Häkchen setzen Sie selbst; es lässt sich nicht zurücknehmen.',
    kaydedilemedi: 'Das Häkchen konnte auf diesem Gerät nicht gespeichert werden (Browser-Speicher ist aus).',
    sinavBaslik: 'Mini-Test',
    sinavYonerge: 'Wenn Sie möchten, prüfen Sie sich mit zwei Fragen. Es ist nicht verpflichtend.',
    sinavYok: 'Diese Karte hat keine Mini-Frage.',
    soruNo: 'Frage {n} von {m}',
    kontrolEt: 'Antworten prüfen',
    dogru: 'Richtig.',
    yanlis: 'Falsch. Richtige Antwort: {c}',
    secimYok: 'Wählen Sie zuerst bei jeder Frage eine Antwort.',
    sonucTam: 'Alles richtig. Die Karte ist als gelernt markiert.',
    sonucEksik: '{n} von {m} richtig. Sie können es noch einmal versuchen.',
    yeniden: 'Noch einmal versuchen',
    onceki: 'Vorherige Karte',
    sonraki: 'Nächste Karte',

    yBaslik: 'Einstufungstest',
    yAciklama: 'Lösen Sie einen kurzen Test, um den passenden Wissensweg und die Anfangsstufe zu finden. Ihre Antworten werden nirgendwohin gesendet.',
    yLead: 'Pro Bereich kommen einige Fragen; wird eine Stufe nicht bestanden, wird die nächste nicht gefragt, so bleibt der Test kurz. Am Ende wird nur ein Weg vorgeschlagen.',
    yGizlilik: 'Datenschutz: Ihre Antworten bleiben nur auf dieser Seite, im Speicher Ihres Browsers. Sie werden nicht gesendet oder gespeichert; beim Schließen der Seite verschwinden sie.',
    yBasla: 'Starten',
    yNo: 'Frage {n}',
    yBilmiyorum: 'Ich weiß es nicht',
    yIleri: 'Nächste Frage',
    ySonuc: 'Vorgeschlagener Weg',
    yOneri: 'Wir empfehlen, mit dem Weg „{alan}“ auf Stufe {b} zu beginnen.',
    yAlanlar: 'Ergebnis je Bereich',
    yAlanSatiri: '{alan}: mit Stufe {b} beginnen',
    yYolaGit: 'Zu diesem Weg',
    yYeniden: 'Test wiederholen',
    yNot: 'Das ist nur ein Vorschlag. Sie können mit jedem beliebigen Weg beginnen.',

    rBaslik: 'Meine Abzeichen',
    rAciklama: 'Haben Sie alle Karten eines Wegs gelernt, erhalten Sie sein Abzeichen und können eine Urkunde über Ihr eigenes Lernen ausdrucken.',
    rLead: 'Ein Abzeichen gibt es, wenn alle Karten eines Wegs als gelernt markiert sind. Die Urkunde zeigt, dass Sie den Weg durch eigenes Lernen gelernt haben; sie ist nicht das Memorier-Zertifikat für das, was eine Lehrkraft abgehört hat.',
    rKazanildi: 'Erhalten',
    rKazanilmadi: 'Noch nicht · {n} von {m}',
    rBelge: 'Urkunde vorbereiten',
    rHicYok: 'Noch kein Abzeichen. Beginnen Sie, die Karten eines Wegs zu lernen.',
    rGizlilik: 'Datenschutz: Der eingegebene Name wird nicht gesendet oder gespeichert; beim Schließen der Seite verschwindet er.',
    rSecili: 'Vorbereitete Urkunde',
    bBaslik: 'Weg-Urkunde',
    bIfade: 'Dieses Dokument zeigt, dass die unten aufgeführten Themen des Wegs „{yol}“ von der Person durch eigenes Lernen gelernt wurden, ohne dass eine Lehrkraft zugehört hat. Das Memorier-Zertifikat wird nur für Texte vergeben, denen eine Lehrkraft zugehört hat.',
    bTabloAdi: 'Gelernte Themen',
    bSutunNo: 'Nr.',
    bSutunKonu: 'Thema',
    bSutunDurum: 'Status',
    bDurumOgrenildi: 'Gelernt',
    bDurumSinav: 'Gelernt · Mini-Frage',
    bDurumCalisildi: 'Geübt',
    bOzet: '{n} Themen',
    bOzetBilgi: '{n} Punkte',
  },
};

/** Fransızca için noktalama öncesi boşluklar düzeltilir. */
function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (Array.isArray(deger)) return deger.map((x) => fransizca(x)) as T;
  if (deger && typeof deger === 'object') return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, fransizca(v)])) as T;
  return deger;
}
const HAZIR: Record<Dil, YollarMetinleri> = { ...YOLLAR, fr: fransizca(YOLLAR.fr) };
export const yollarMetinleri = (dil: Dil): YollarMetinleri => HAZIR[dil];

/** Yedi alanın adı (ana sayfadaki `alanlar` dizisiyle aynı sıra ve yazım). */
export function alanAdlari(dil: Dil): Record<AlanKodu, string> {
  const il = ilimMetinleri(dil);
  return Object.fromEntries(ALANLAR.map((a, i) => [a, il.alanlar[i]])) as Record<AlanKodu, string>;
}

/** `{ad}` / `{n}` yer tutucularını doldurur (sunucu ve istemci). */
export const doldur = (s: string, d: Readonly<Record<string, string | number>>): string => s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));
