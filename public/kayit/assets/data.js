(function () {
  'use strict';

  const app = window.KayitApp = window.KayitApp || {};

  app.declaration = {
    tr: "Yukarıdaki bilgiler tarafımdan doldurulmuş olup, velisi olduğum öğrencinin Kurumunuzun belirlediği kurallar çerçevesinde 'Kur'an-ı Kerim ve Temel Dini Bilgiler Kursu'na kaydının yapılmasını arz ederim. Ayrıca öğrencinin kurs kurallarına uyacağını ve veli olarak üzerime düşen sorumluluklarımı yerine getireceğimi beyan ederim.",
    fr: "Je certifie avoir rempli moi-même les informations ci-dessus et demande l’inscription de l’élève dont je suis le représentant légal au « Cours de Coran et de connaissances religieuses fondamentales », dans le respect des règles fixées par votre établissement. Je déclare également que l’élève respectera le règlement du cours et que j’assumerai les responsabilités qui m’incombent en tant que représentant légal.",
    en: "I certify that I have filled in the information above myself and request the enrolment of the student for whom I am the legal guardian in the ‘Qur’an and Basic Religious Knowledge Course’, in accordance with the rules set by your institution. I further declare that the student will observe the course rules and that I will fulfil the responsibilities incumbent upon me as legal guardian."
  };

  app.contract = {
    tr: {
      title: 'KURS-VELİ SÖZLEŞMESİ',
      student: {
        title: 'ÖĞRENCİNİN SORUMLULUKLARI',
        intro: 'Kurslarımızda eğitim gören öğrencilerin; dini, milli, ahlaki ve insani değerleri benimseyen; ailesini, vatanını ve milletini seven, insan hak ve hukukuna saygılı; sorumluluk duygusuna sahip bireyler olarak yetişmesi hedeflenmektedir.',
        lead: 'Bu doğrultuda öğrencilerin sorumlulukları şunlardır;',
        items: [
          'Cami ve kurs kurallarına uymak,',
          'Kursa ve derslere düzenli olarak devam etmek, derslere zamanında gelmek,',
          'Kursunu ve kurs eşyasını kendi öz malı gibi korumak, zarar verdiklerinde tazmin etmek,',
          'Doğru sözlü, dürüst, erdemli ve çalışkan olmak; din, dil, ırk ve cinsiyet ayrımı yapmamak,',
          'Zararlı, bölücü, yıkıcı, siyasi ve ideolojik amaçlı faaliyetlere katılmamak, bunlarla ilgili amblem, afiş, rozet, yayın ve benzerlerini taşımamak ve bulundurmamak, bilişim ve iletişim araçlarını böyle amaçlar için kullanmamak,',
          'Yöneticilere, öğreticilere, görevlilere, arkadaşlarına ve çevresindeki diğer kişilere karşı saygılı ve nazik davranmak; kaba söz ve davranışlarda bulunmamak, değerbilirlik, hoşgörü, sabır, özgürlük, adalet ve dayanışmadan yana davranış göstermek, küçükleri ve yaşlıları korumak, engelliler ile yardıma muhtaç durumda olanlara yardımcı olmak,',
          'Sağlığa zararlı ve bağımlılık yapan maddeler ile her çeşit kumar oyunlarından ve bu tür oyunların oynandığı ortamlardan uzak durmak.',
          'Cami ve kursta yararlanılan alanların tertipli, düzenli ve temiz kullanmak,',
          'Cami ve kursta düzenlenen etkinliklere imkânlar ölçüsünde katılmak,'
        ]
      },
      guardian: {
        title: 'VELİNİN SORUMLULUKLARI',
        items: [
          'Öğrencinin kursa, zamanında, öğrenmeye hazır, kılık-kıyafet kurallarına uygun bir şekilde gelmesini sağlamak,',
          'Kursun duyuru ve yayınlarını takip etmek,',
          'Kurs yönetimi ile iletişim halinde olmak ve veli toplantılarına katılmak,',
          'Kurs tarafından düzenlenen sosyal etkinliklere destek vermek ve katılmak,',
          'İhtiyaç duyduğunda öğrencinin ödevlerine katkı sağlamak, gerekli yardımda bulunmak ve destek vermek,',
          'Öğrencinin derslerine, okumaya ve araştırmaya daha fazla zaman ayırması için televizyon seyretme ve oyun oynama saatlerini düzenlemek.',
          'Öğrencinin kursta yaptıkları ve öğrendikleri hakkında öğrenci ile günün değerlendirmesini yapmak,',
          'Öğrencinin uyku ve dinlenme saatlerine dikkat etmek,',
          'Kursun düzenleyeceği aile eğitim seminerlerine katılmak,',
          'Öğrencinin, kurs kurallarına uyması için gerekli önlemleri almak,',
          'Öğrencinin ruhsal ve fiziksel durumundaki değişmeler hakkında kursa zamanında bilgi vermek,',
          'Kursun ücretsiz olduğunu; ders kitaplarının (Camiye Gidiyorum 1–2, Temel Dinî Bilgiler) ve defter, kalem gibi ders materyallerinin temininin velinin sorumluluğunda olduğunu kabul etmek.'
        ]
      },
      classroom: {
        title: 'SINIF İÇİ KURALLAR',
        items: [
          'Derslere zamanında gelmek ve zamanında girmek,',
          'Ders başlamadan, hazırlıklarını tamamlamış olarak hocasını beklemek,',
          'Ders bitiminde hocasının izni ile teneffüse çıkmak,',
          'Derse girerken ders kitap ve materyallerini yanında bulundurmak,',
          'Ders işlenirken dersini takip etmek ve derse katılım sağlamak,',
          'Derste söz alarak konuşmak,',
          'Sınıfta ders dışında herhangi bir şey ile ilgilenmemek,',
          'Hocasından izin almadan sınıftan dışarı çıkmamak,',
          'Sınıfını temiz ve düzenli tutmak,',
          'Derste düzgün ve derli toplu oturmak ve izinsiz ayakta dolaşmamak,',
          'Sınıfın huzurunu bozacak, dersin işlenmesine mani olacak hal ve hareketlerde bulunmamak,',
          'Diğer öğrencileri rahatsız etmemek ve onlarla uyum içinde olmak,',
          'Hocalarına karşı saygılı olmak,',
          'Sınıf öğreticileri bu kuralların dışında kendi sınıfları için öğrencileri ile başka kurallar da oluşturabileceklerdir.'
        ]
      },
      closing: 'Kurs yöneticisi, yukarıdaki kurallar ile bunlara uyulmaması durumunda karşılaşabilecekleri disiplin işlemleri hakkında öğrencileri ve velilerini mevcut iletişim araçlarından birini kullanarak bilgilendirir.'
    },
    fr: {
      title: 'CONTRAT COURS–PARENT',
      student: {
        title: 'RESPONSABILITÉS DE L’ÉLÈVE',
        intro: 'Notre objectif est que les élèves suivant nos cours deviennent des personnes qui adoptent les valeurs religieuses, nationales, morales et humaines, qui aiment leur famille, leur patrie et leur nation, qui respectent les droits humains et le droit, et qui possèdent le sens des responsabilités.',
        lead: 'Dans cette perspective, les responsabilités des élèves sont les suivantes :',
        items: [
          'Respecter les règles de la mosquée et du cours ;',
          'Suivre régulièrement le cours et les leçons et arriver à l’heure ;',
          'Préserver le cours et son matériel comme ses propres biens et indemniser les dommages causés ;',
          'Être sincère, honnête, vertueux et travailleur ; ne pratiquer aucune discrimination fondée sur la religion, la langue, l’origine ou le sexe ;',
          'Ne pas participer à des activités nuisibles, séparatistes, destructrices, politiques ou idéologiques ; ne pas porter ni conserver d’emblèmes, d’affiches, de badges, de publications ou d’objets similaires qui s’y rapportent et ne pas utiliser les moyens informatiques et de communication à de telles fins ;',
          'Se comporter avec respect et courtoisie envers les responsables, les enseignants, le personnel, les camarades et toute autre personne de son entourage ; ne pas tenir de propos ni adopter de comportements grossiers ; agir en faveur de la reconnaissance d’autrui, de la tolérance, de la patience, de la liberté, de la justice et de la solidarité ; protéger les plus jeunes et les personnes âgées et aider les personnes handicapées ou dans le besoin ;',
          'Se tenir à l’écart des substances nocives pour la santé et créant une dépendance, de toute forme de jeux d’argent ainsi que des lieux où ils sont pratiqués.',
          'Utiliser de manière ordonnée, soignée et propre les espaces de la mosquée et du cours mis à disposition ;',
          'Participer, dans la mesure de ses possibilités, aux activités organisées à la mosquée et au cours.'
        ]
      },
      guardian: {
        title: 'RESPONSABILITÉS DU PARENT OU REPRÉSENTANT LÉGAL',
        items: [
          'Veiller à ce que l’élève arrive au cours à l’heure, prêt à apprendre et dans une tenue conforme aux règles ;',
          'Suivre les annonces et publications du cours ;',
          'Rester en contact avec la direction du cours et participer aux réunions de parents ;',
          'Soutenir les activités sociales organisées par le cours et y participer ;',
          'Lorsque cela est nécessaire, contribuer aux devoirs de l’élève, lui apporter l’aide nécessaire et le soutenir ;',
          'Organiser les heures de télévision et de jeux afin que l’élève consacre davantage de temps à ses leçons, à la lecture et à la recherche.',
          'Faire avec l’élève le bilan de sa journée sur ce qu’il a fait et appris au cours ;',
          'Veiller aux heures de sommeil et de repos de l’élève ;',
          'Participer aux séminaires de formation familiale organisés par le cours ;',
          'Prendre les mesures nécessaires pour que l’élève respecte les règles du cours ;',
          'Informer le cours en temps utile de tout changement dans l’état psychologique ou physique de l’élève ;',
          'Reconnaître que le cours est gratuit et que l’achat des manuels (Camiye Gidiyorum 1–2, Temel Dinî Bilgiler) ainsi que des fournitures scolaires (cahier, stylo, etc.) est à la charge du parent ou représentant légal.'
        ]
      },
      classroom: {
        title: 'RÈGLES DE LA CLASSE',
        items: [
          'Arriver aux leçons et entrer en classe à l’heure ;',
          'Avant le début de la leçon, avoir terminé ses préparatifs et attendre son enseignant ;',
          'À la fin de la leçon, ne sortir en récréation qu’avec l’autorisation de l’enseignant ;',
          'Avoir avec soi les livres et le matériel nécessaires en entrant en classe ;',
          'Suivre la leçon et y participer pendant son déroulement ;',
          'Demander la parole avant de parler ;',
          'Ne s’occuper d’aucune autre chose pendant la leçon ;',
          'Ne pas sortir de la classe sans l’autorisation de l’enseignant ;',
          'Maintenir la classe propre et ordonnée ;',
          'S’asseoir correctement et de manière ordonnée et ne pas circuler debout sans autorisation ;',
          'Ne pas adopter d’attitudes ou de comportements troublant la tranquillité de la classe ou empêchant le bon déroulement de la leçon ;',
          'Ne pas déranger les autres élèves et vivre en harmonie avec eux ;',
          'Être respectueux envers les enseignants ;',
          'En plus de ces règles, les enseignants pourront établir avec leurs élèves d’autres règles propres à leur classe.'
        ]
      },
      closing: 'Le responsable du cours informe les élèves et leurs parents, au moyen de l’un des outils de communication disponibles, des règles ci-dessus et des mesures disciplinaires auxquelles ils peuvent être confrontés en cas de non-respect.'
    },
    en: {
      title: 'COURSE–PARENT CONTRACT',
      student: {
        title: 'RESPONSIBILITIES OF THE STUDENT',
        intro: 'Our aim is that the students attending our courses grow into individuals who embrace religious, national, moral and human values; who love their family, their country and their nation; who respect human rights and the rule of law; and who possess a sense of responsibility.',
        lead: 'Accordingly, the responsibilities of the students are as follows:',
        items: [
          'To observe the rules of the mosque and of the course;',
          'To attend the course and the lessons regularly and to arrive on time;',
          'To look after the course premises and equipment as if they were their own property and to make good any damage caused;',
          'To be truthful, honest, virtuous and hard-working; and to make no distinction on grounds of religion, language, race or sex;',
          'Not to take part in harmful, divisive, destructive, political or ideological activities; not to carry or keep emblems, posters, badges, publications or similar items relating to them; and not to use information and communication devices for such purposes;',
          'To behave respectfully and courteously towards the administrators, teachers, staff, fellow students and everyone else around them; not to use coarse language or behaviour; to act in favour of appreciation of others, tolerance, patience, freedom, justice and solidarity; to protect the young and the elderly; and to help people with disabilities and those in need;',
          'To stay away from substances that are harmful to health or addictive, from all forms of gambling and from the places where such games are played.',
          'To keep the areas used at the mosque and at the course tidy, orderly and clean;',
          'To take part, as far as possible, in the activities organised at the mosque and at the course.'
        ]
      },
      guardian: {
        title: 'RESPONSIBILITIES OF THE PARENT OR LEGAL GUARDIAN',
        items: [
          'To ensure that the student comes to the course on time, ready to learn and dressed in accordance with the rules;',
          'To follow the announcements and publications of the course;',
          'To stay in contact with the course management and to attend parents’ meetings;',
          'To support and take part in the social activities organised by the course;',
          'To contribute to the student’s homework where needed, to give the necessary help and to provide support;',
          'To manage television and gaming hours so that the student devotes more time to lessons, reading and research.',
          'To review the day with the student, discussing what they did and learned at the course;',
          'To pay attention to the student’s sleep and rest hours;',
          'To attend the family education seminars organised by the course;',
          'To take the necessary measures so that the student observes the course rules;',
          'To inform the course in good time of any change in the student’s psychological or physical condition;',
          'To acknowledge that the course is free of charge and that obtaining the textbooks (Camiye Gidiyorum 1–2, Temel Dinî Bilgiler) and the class materials such as a notebook and a pen is the responsibility of the parent or legal guardian.'
        ]
      },
      classroom: {
        title: 'CLASSROOM RULES',
        items: [
          'To arrive at lessons and enter the classroom on time;',
          'To have completed their preparations before the lesson begins and to wait for their teacher;',
          'To leave for the break at the end of the lesson only with the teacher’s permission;',
          'To bring the necessary books and materials when entering the classroom;',
          'To follow the lesson and take part in it while it is being taught;',
          'To ask permission before speaking;',
          'Not to occupy themselves with anything unrelated to the lesson in class;',
          'Not to leave the classroom without the teacher’s permission;',
          'To keep their classroom clean and tidy;',
          'To sit properly and in an orderly manner and not to walk about without permission;',
          'Not to behave in ways that disturb the peace of the classroom or prevent the lesson from being taught;',
          'Not to disturb the other students and to live in harmony with them;',
          'To be respectful towards their teachers;',
          'In addition to these rules, class teachers may establish further rules with their students for their own classes.'
        ]
      },
      closing: 'The course administrator informs the students and their parents, using one of the available means of communication, of the rules above and of the disciplinary measures they may face in the event of non-compliance.'
    }
  };

  /* Okullar iki grupta: once Marche-en-Famenne belediyesi (merkez ve koyleri:
     Aye, Hargimont, Hollogne, Humain, Marloie, On, Roy, Verdenne, Waha),
     sonra cevre belediyeler. `tur` alani sinif listesini belirler. */
  app.schools = [
    // ---------------- Marche-en-Famenne ----------------
    { ad: "Athénée Royal (ARMBB) – Section fondamentale", grup: 'marche', tur: 'fondamental' },
    { ad: "École communale d'Aye", grup: 'marche', tur: 'fondamental' },
    { ad: "École communale de Hargimont", grup: 'marche', tur: 'fondamental' },
    { ad: "École communale de Hollogne", grup: 'marche', tur: 'fondamental' },
    { ad: "École communale de Humain", grup: 'marche', tur: 'fondamental' },
    { ad: "École communale d'On", grup: 'marche', tur: 'fondamental' },
    { ad: "École communale de Waha", grup: 'marche', tur: 'fondamental' },
    { ad: "École fondamentale libre d'On", grup: 'marche', tur: 'fondamental' },
    { ad: "École libre Saint-Antoine (Marloie)", grup: 'marche', tur: 'fondamental' },
    { ad: "École libre Saint-Martin", grup: 'marche', tur: 'fondamental' },
    { ad: "École libre Saint-Remacle (Aye)", grup: 'marche', tur: 'fondamental' },
    { ad: "Institut Notre-Dame – Fondamental", grup: 'marche', tur: 'fondamental' },
    { ad: "Institut médico-pédagogique de Marloie – Primaire spécialisé", grup: 'marche', tur: 'fondamental' },
    { ad: "Athénée Royal (ARMBB) – Enseignement secondaire", grup: 'marche', tur: 'secondaire' },
    { ad: "Institut Saint-Roch", grup: 'marche', tur: 'secondaire' },
    { ad: "Institut Sainte-Julie", grup: 'marche', tur: 'secondaire' },
    { ad: "Institut Saint-Laurent", grup: 'marche', tur: 'secondaire' },
    { ad: "Institut d'enseignement spécialisé de Marloie", grup: 'marche', tur: 'secondaire' },
    { ad: "CEFA – Marche-en-Famenne", grup: 'marche', tur: 'secondaire' },
    // ---------------- cevre belediyeler ----------------
    { ad: "Athénée Royal (ARMBB) – Section fondamentale (Barvaux-sur-Ourthe)", grup: 'cevre', tur: 'fondamental' },
    { ad: "Athénée Royal (ARMBB) – Section fondamentale (Bomal-sur-Ourthe)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale d'Ambly (Nassogne)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Bande (Nassogne)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Barvaux-sur-Ourthe (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Bomal-sur-Ourthe (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Borlon (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Champlon (Tenneville)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Forrières (Nassogne)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Grune (Nassogne)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Hampteau (Hotton)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Heyd (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Hotton", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale d'Izier (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Nassogne", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Petithan (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Rendeux", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Somme-Leuze – Implantation de Bonsin", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Somme-Leuze – Implantation de Heure", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Somme-Leuze – Implantation de Noiseux", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Somme-Leuze – Implantation de Somme-Leuze", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Tenneville", grup: 'cevre', tur: 'fondamental' },
    { ad: "École communale de Tohogne (Durbuy)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École Enrico Macias (Hotton)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École fondamentale libre de Bourdon (Hotton)", grup: 'cevre', tur: 'fondamental' },
    { ad: "École fondamentale libre de Nassogne", grup: 'cevre', tur: 'fondamental' },
    { ad: "École fondamentale libre Hotton-Melreux – Implantation de Hotton", grup: 'cevre', tur: 'fondamental' },
    { ad: "École fondamentale libre Hotton-Melreux – Implantation de Melreux", grup: 'cevre', tur: 'fondamental' },
    { ad: "École libre « La P'tite École » (Rendeux)", grup: 'cevre', tur: 'fondamental' },
    { ad: "Athénée Royal (ARMBB) – Enseignement secondaire (Bomal-sur-Ourthe)", grup: 'cevre', tur: 'secondaire' },
    { ad: "Institut du Sacré-Cœur (Barvaux-sur-Ourthe)", grup: 'cevre', tur: 'secondaire' }
  ];

  /* Sinif seviyeleri — okulun turune gore acilir listeye doldurulur. */
  app.classLevels = {
    fondamental: [
      { v: 'M1', tr: 'Anaokulu 1. yıl', fr: '1re maternelle', en: '1st year nursery' },
      { v: 'M2', tr: 'Anaokulu 2. yıl', fr: '2e maternelle', en: '2nd year nursery' },
      { v: 'M3', tr: 'Anaokulu 3. yıl', fr: '3e maternelle', en: '3rd year nursery' },
      { v: 'P1', tr: 'İlkokul 1. sınıf', fr: '1re primaire', en: '1st year primary' },
      { v: 'P2', tr: 'İlkokul 2. sınıf', fr: '2e primaire', en: '2nd year primary' },
      { v: 'P3', tr: 'İlkokul 3. sınıf', fr: '3e primaire', en: '3rd year primary' },
      { v: 'P4', tr: 'İlkokul 4. sınıf', fr: '4e primaire', en: '4th year primary' },
      { v: 'P5', tr: 'İlkokul 5. sınıf', fr: '5e primaire', en: '5th year primary' },
      { v: 'P6', tr: 'İlkokul 6. sınıf', fr: '6e primaire', en: '6th year primary' }
    ],
    secondaire: [
      { v: 'S1', tr: 'Ortaöğretim 1. sınıf', fr: '1re secondaire', en: '1st year secondary' },
      { v: 'S2', tr: 'Ortaöğretim 2. sınıf', fr: '2e secondaire', en: '2nd year secondary' },
      { v: 'S3', tr: 'Ortaöğretim 3. sınıf', fr: '3e secondaire', en: '3rd year secondary' },
      { v: 'S4', tr: 'Ortaöğretim 4. sınıf', fr: '4e secondaire', en: '4th year secondary' },
      { v: 'S5', tr: 'Ortaöğretim 5. sınıf', fr: '5e secondaire', en: '5th year secondary' },
      { v: 'S6', tr: 'Ortaöğretim 6. sınıf', fr: '6e secondaire', en: '6th year secondary' },
      { v: 'S7', tr: 'Ortaöğretim 7. sınıf', fr: '7e secondaire', en: '7th year secondary' }
    ]
  };

}());
