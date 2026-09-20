/** Kur'an ve dinî bilgi seviye tespit testi — arayüz metinleri (TR/FR/EN; anahtar eşliği tipten zorunlu).
 *
 *  Soru metinleri burada DEĞİL: `src/lib/seviye-testi/sorular/*.ts`. Sonuç ekranı ve e-posta metinleri:
 *  `src/lib/seviye-testi/metinler.ts`. Genel form metinleri (hata, gönder, taslak): `src/i18n/formlar`.
 *  Rıza metni değişirse RIZA_SURUMU artırılır ve eski metin docs/seviye-testi/riza-arsivi.md'ye taşınır.
 */
import type { Dil } from './ui';

export const RIZA_SURUMU = '2026-09-20';

type Secenek = { deger: string; ad: string };

export interface SeviyeMetinleri {
  sayfa: { etiket: string; baslik: string; altBaslik: string; aciklama: string };
  giris: { paragraflar: string[]; noktalar: string[]; cocukNotu: string; cocukBaglanti: string; noscript: string };
  adimlar: {
    baslik: string; ilerleme: string; adimlar: string[]; ipuclari: string[];
    adim: string; geri: string; ileri: string; kontrol: string; tumu: string; adimli: string;
  };
  profil: {
    baslik: string; not: string;
    adSoyad: string; eposta: string; epostaYardim: string; epostaTekrar: string; epostaEslesmiyor: string;
    telefon: string; telefonYardim: string;
    yasAraligi: string; yasSecenekleri: Secenek[];
    cinsiyet: string; cinsiyetSecenekleri: Secenek[];
    muslumanlik: string; muslumanlikSecenekleri: Secenek[];
    oncekiEgitim: string; oncekiEgitimSecenekleri: Secenek[];
    hedefler: string; hedeflerYardim: string; hedefSecenekleri: Secenek[];
    dersDili: string; dersDiliSecenekleri: Secenek[];
    gunler: string; gunSecenekleri: Secenek[];
    dilim: string; dilimSecenekleri: Secenek[];
    bicim: string; bicimSecenekleri: Secenek[];
    ekNot: string; ekNotYardim: string;
  };
  onay: { baslik: string; yas18: string; riza: string; bilgilendirme: string[]; gizlilikBaglanti: string; ortakCihaz: string };
  soru: { bilmiyorum: string; zorunlu: string; atla: string; atlaYardim: string; mezhepNotu: string };
  okuma: {
    baslik: string; giris: string; harfBilmiyorum: string; harfBilmiyorumYardim: string;
    basamaklar: [string, string, string, string, string]; basamakAtla: string;
    dinle: string; tekrarDinle: string; sesHatasi: string; yazimNotu: string; beyanBaslik: string;
  };
  bolumler: Record<'kuranBilgi' | 'itikat' | 'namaz' | 'ibadet' | 'siyer' | 'ahlak', { baslik: string; giris: string }>;
  ezber: { baslik: string; giris: string; durumlar: [string, string, string] };
  uygulama: { baslik: string; giris: string };
  ozet: { baslik: string; giris: string; cevaplanan: string; atlanan: string; duzenle: string; gonder: string; sonNot: string };
  taslak: { not: string };
  sonuc: { baslik: string; referans: string; epostaNotu: string; kuranBaslik: string; alanBaslik: string; anasayfa: string };
  hata: { gunlukSinir: string; epostaGunlukSinir: string; hazirDegil: string };
}

export const seviyeMetinleri: Record<Dil, SeviyeMetinleri> = {
  tr: {
    sayfa: {
      etiket: 'Yetişkinler için',
      baslik: 'Kur’an ve Dinî Bilgi Seviye Tespiti',
      altBaslik: 'Nereden başlayacağınızı birlikte belirleyelim: size özel eğitim için ilk adım.',
      aciklama: 'Yeni Müslüman olanlar ve temel dinî bilgilerini geliştirmek isteyen yetişkinler için Kur’an okuma ve dinî bilgi seviye tespit testi. Sonuca göre camimizde size özel eğitim planlanır.',
    },
    giris: {
      paragraflar: [
        'İslâm’ı yeni seçtiyseniz ya da Müslüman olduğunuz hâlde Kur’an okumayı ve temel dinî bilgileri baştan, düzenli biçimde öğrenmek istiyorsanız doğru yerdesiniz. Camimizde size özel — bire bir — eğitim planlıyoruz; bunun için önce sizi tanımamız gerekiyor.',
        'Bu test bir sınav değildir. Not verilmez, kimseyle kıyaslanmazsınız. Amaç yalnızca nereden başlayacağımızı doğru belirlemektir.',
      ],
      noktalar: [
        'Yaklaşık 30–35 dakika sürer; yarıda bırakıp aynı cihazdan daha sonra devam edebilirsiniz.',
        'Önce Kur’an okuma, ardından inanç, ibadet, Peygamberimizin hayatı ve ahlak bölümleri gelir.',
        'Bilmediğiniz soruda «Bilmiyorum»u seçin; hiç bilmediğiniz bölümü tümüyle atlayabilirsiniz. Tahmin etmeyin — doğru tespit size daha çok yarar.',
        'Sonucunuzun özeti e-postanıza gelir; ayrıntılı hâlini yalnız din görevlimiz görür.',
        'Din görevlimiz en geç bir hafta içinde sizinle iletişime geçer. Eğitim ücretsizdir.',
      ],
      cocukNotu: 'Bu test 18 yaş ve üzeri içindir. Çocuklar ve gençler için Kur’an kursumuza kayıt yaptırabilirsiniz:',
      cocukBaglanti: 'Kur’an kursu',
      noscript: 'Bu testi doldurabilmek için tarayıcınızda JavaScript açık olmalıdır.',
    },
    adimlar: {
      baslik: 'Adımlar', ilerleme: 'Test ilerlemesi',
      adimlar: ['Tanışma', 'Kur’an okuma', 'Kur’an bilgisi', 'İnanç', 'Namaz', 'Diğer ibadetler', 'Siyer', 'Ahlak', 'Uygulama', 'Özet'],
      ipuclari: [
        'Önce sizi tanıyalım; bilgileriniz yalnız din görevlimize ulaşır.',
        'Arap harflerini ve okumayı basamak basamak yokluyoruz. Bilmediğiniz basamağı atlayabilirsiniz.',
        'Kur’an hakkında genel bilgiler ve ezbere bildiğiniz sûre ve dualar.',
        'İnanç esasları. Bilmediğiniz soruda «Bilmiyorum»u seçin.',
        'Abdest, temizlik ve namaz.',
        'Oruç, zekât, hac, kurban ve günlük hayatta helal–haram.',
        'Peygamberimizin hayatı ve diğer peygamberler.',
        'Güzel ahlak ve günlük hayatın âdâbı.',
        'Burada doğru ya da yanlış yok: ibadetleri bugün ne ölçüde yapabildiğinizi soruyoruz.',
        'Yanıtlarınızı gözden geçirin ve gönderin.',
      ],
      adim: 'Adım {simdi} / {toplam}', geri: 'Geri', ileri: 'Devam', kontrol: 'Özete geç',
      tumu: 'Bütün testi tek sayfada göster', adimli: 'Adım adım göster',
    },
    profil: {
      baslik: 'Sizi tanıyalım',
      not: 'Yıldızlı alanlar zorunludur. Kimlik numarası, adres ya da doğum tarihi istemiyoruz.',
      adSoyad: 'Adınız ve soyadınız',
      eposta: 'E-posta adresiniz', epostaYardim: 'Sonucunuzun özeti bu adrese gönderilir.',
      epostaTekrar: 'E-posta adresiniz (tekrar)', epostaEslesmiyor: 'İki e-posta adresi aynı olmalı.',
      // Örnek numara yalnız alanın placeholder'ındadır: gövde metnindeki her numara, ayarlarda
      // tanımlı olmayan telefon olarak site denetimine takılıyor (scripts/site-denetim.mjs).
      telefon: 'Telefon ya da WhatsApp numaranız', telefonYardim: 'İsteğe bağlı. Yazarsanız size daha kolay ulaşırız.',
      yasAraligi: 'Yaş aralığınız',
      yasSecenekleri: [
        { deger: '18-25', ad: '18–25' }, { deger: '26-40', ad: '26–40' }, { deger: '41-60', ad: '41–60' },
        { deger: '60+', ad: '60 ve üzeri' }, { deger: 'belirtmedi', ad: 'Belirtmek istemiyorum' },
      ],
      cinsiyet: 'Cinsiyetiniz',
      cinsiyetSecenekleri: [{ deger: 'kadin', ad: 'Kadın' }, { deger: 'erkek', ad: 'Erkek' }, { deger: 'belirtmedi', ad: 'Belirtmek istemiyorum' }],
      muslumanlik: 'İslâm’la yolculuğunuz',
      muslumanlikSecenekleri: [
        { deger: 'henuz', ad: 'Henüz Müslüman değilim, İslâm’ı tanımak istiyorum' },
        { deger: '0-1', ad: 'Bir yıldan kısa süredir Müslümanım' },
        { deger: '1-5', ad: '1–5 yıldır Müslümanım' },
        { deger: '5+', ad: '5 yıldan uzun süredir Müslümanım (sonradan Müslüman oldum)' },
        { deger: 'dogustan', ad: 'Müslüman bir ailede doğdum' },
      ],
      oncekiEgitim: 'Daha önce dinî eğitim aldınız mı?',
      oncekiEgitimSecenekleri: [
        { deger: 'hic', ad: 'Hayır, hiç almadım' },
        { deger: 'kendi', ad: 'Kendi kendime öğrendim (kitap, internet, uygulama)' },
        { deger: 'aile', ad: 'Ailemden ya da arkadaşlarımdan öğrendim' },
        { deger: 'kurs', ad: 'Camide ya da bir kursta ders aldım' },
        { deger: 'okul', ad: 'Okulda ya da üniversitede eğitim aldım' },
      ],
      hedefler: 'Bu eğitimden beklentiniz', hedeflerYardim: 'Birden fazla seçebilirsiniz.',
      hedefSecenekleri: [
        { deger: 'namaz', ad: 'Namaz kılmayı öğrenmek' },
        { deger: 'kuranOkuma', ad: 'Kur’an okumayı öğrenmek' },
        { deger: 'tecvid', ad: 'Kur’an’ı daha güzel okumak (tecvid)' },
        { deger: 'inanc', ad: 'İnancımı anlamak ve derinleştirmek' },
        { deger: 'gunluk', ad: 'Günlük hayatta helal–haramı öğrenmek' },
        { deger: 'ezber', ad: 'Sûre ve dua ezberlemek' },
        { deger: 'cocuk', ad: 'Çocuklarıma öğretebilmek' },
      ],
      dersDili: 'Dersleri hangi dilde almak istersiniz?',
      dersDiliSecenekleri: [{ deger: 'tr', ad: 'Türkçe' }, { deger: 'fr', ad: 'Fransızca' }, { deger: 'en', ad: 'İngilizce' }],
      gunler: 'Size uygun günler',
      gunSecenekleri: [
        { deger: 'pzt', ad: 'Pazartesi' }, { deger: 'sal', ad: 'Salı' }, { deger: 'car', ad: 'Çarşamba' }, { deger: 'per', ad: 'Perşembe' },
        { deger: 'cum', ad: 'Cuma' }, { deger: 'cmt', ad: 'Cumartesi' }, { deger: 'paz', ad: 'Pazar' },
      ],
      dilim: 'Günün hangi saatleri?',
      dilimSecenekleri: [{ deger: 'sabah', ad: 'Sabah' }, { deger: 'ogleden-sonra', ad: 'Öğleden sonra' }, { deger: 'aksam', ad: 'Akşam' }],
      bicim: 'Ders biçimi',
      bicimSecenekleri: [{ deger: 'yuzyuze', ad: 'Camide yüz yüze' }, { deger: 'cevrimici', ad: 'Çevrim içi (görüntülü)' }, { deger: 'farketmez', ad: 'Fark etmez' }],
      ekNot: 'Eklemek istediğiniz bir şey var mı?', ekNotYardim: 'İsteğe bağlı. Yalnız din görevlimiz okur.',
    },
    onay: {
      baslik: 'Onaylar',
      yas18: '18 yaşından büyüğüm.',
      riza: 'Dinî inancıma ve dinî bilgi düzeyime ilişkin yanıtlarımın, bana özel eğitim planlanması amacıyla Ulu Camii derneği tarafından işlenmesine ve din görevlisine iletilmesine açıkça rıza veriyorum.',
      bilgilendirme: [
        'Veri sorumlusu: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).',
        'Yanıtlarınız özel nitelikli veridir; yalnız açık rızanızla işlenir (GDPR md. 9/2-a). Ayrıntılı sonucu yalnız din görevlimiz görür; üçüncü kişilerle paylaşılmaz.',
        'Kayıt derneğin Google hesabındaki herkese kapalı bir defterde en fazla 24 ay saklanır ve süre sonunda kendiliğinden silinir. E-postalar Brevo (Fransa) üzerinden gönderilir.',
        'Rızanızı dilediğiniz an geri alabilir, verilerinizin silinmesini isteyebilirsiniz: imam@ulucamii.be',
      ],
      gizlilikBaglanti: 'Gizlilik politikasının ilgili bölümü',
      ortakCihaz: 'Yanıtlarınız, testi tamamlayana kadar yalnız bu cihazın tarayıcısında taslak olarak tutulur (en fazla 14 gün). Ortak bir bilgisayar kullanıyorsanız işiniz bitince «Taslağı sil» düğmesine basın.',
    },
    soru: {
      bilmiyorum: 'Bilmiyorum',
      zorunlu: 'Lütfen bir şık seçin; emin değilseniz «Bilmiyorum»u işaretleyin.',
      atla: 'Bu bölümü atla — bu konuda henüz bilgim yok',
      atlaYardim: 'İşaretlerseniz bu bölümün soruları kapanır; eğitime bu konunun en başından başlarız.',
      mezhepNotu: 'Bu soru Hanefî mezhebine göre sorulmuştur; başka bir mezhebe göre öğrendiyseniz bildiğiniz cevabı işaretleyin — düzeyinizi etkilemez.',
    },
    okuma: {
      baslik: 'Kur’an-ı Kerim okuma',
      giris: 'Arap harflerinden başlayıp âyet okumaya kadar beş basamak var. Her basamakta altı kısa soru bulunur. Bazı sorularda bir harf ya da kelime görürsünüz, bazılarında bir ses dinlersiniz.',
      harfBilmiyorum: 'Arap harflerini hiç bilmiyorum',
      harfBilmiyorumYardim: 'İşaretlerseniz bu bölüm kapanır; eğitime harflerden başlarız. Bu çok doğaldır.',
      basamaklar: ['1. basamak — Harfleri tanıma', '2. basamak — Harflerin kelime içindeki yazılışı', '3. basamak — Harekeler (üstün, esre, ötre)', '4. basamak — Cezm, şedde, tenvin ve uzatma', '5. basamak — Kelime ve âyet okuma'],
      basamakAtla: 'Bu basamağı bilmiyorum, geç',
      dinle: 'Sesi dinle', tekrarDinle: 'Tekrar dinle', sesHatasi: 'Ses yüklenemedi. Bağlantınızı denetleyip tekrar deneyin ya da «Bilmiyorum»u seçin.',
      yazimNotu: 'Okunuşlar Türkçe yazımla verilmiştir (ör. بَ = «be», شَ = «şe»).',
      beyanBaslik: 'Kendi değerlendirmeniz',
    },
    bolumler: {
      kuranBilgi: { baslik: 'Kur’an bilgisi', giris: 'Kur’an-ı Kerim hakkında genel bilgiler; son sorular tecvid kavramlarıyla ilgilidir.' },
      itikat: { baslik: 'İnanç esasları', giris: 'İslâm’ın inanç esaslarıyla ilgili sorular.' },
      namaz: { baslik: 'Temizlik ve namaz', giris: 'Abdest, gusül, teyemmüm ve namazla ilgili sorular.' },
      ibadet: { baslik: 'Oruç, zekât, hac ve günlük hayat', giris: 'Diğer ibadetler ve günlük hayatta helal–haram.' },
      siyer: { baslik: 'Peygamberimizin hayatı', giris: 'Hz. Muhammed’in (s.a.s.) hayatı ve diğer peygamberler.' },
      ahlak: { baslik: 'Ahlak ve âdâb', giris: 'Güzel ahlak, kul hakkı ve günlük hayatın âdâbı.' },
    },
    ezber: {
      baslik: 'Ezbere bildikleriniz',
      giris: 'Aşağıdaki sûre ve dualardan her biri için size en yakın durumu işaretleyin.',
      durumlar: ['Henüz bilmiyorum', 'Bakarak okuyabilirim', 'Ezbere biliyorum'],
    },
    uygulama: { baslik: 'Günlük uygulama', giris: 'Burada doğru ya da yanlış cevap yok. Size en yakın olanı içtenlikle işaretleyin; kimse sizi yargılamayacak.' },
    ozet: {
      baslik: 'Özet ve gönderim',
      giris: 'Göndermeden önce bilgilerinizi gözden geçirin. Bir bölüme dönmek için yanındaki «Düzenle»ye basın.',
      cevaplanan: '{n} / {toplam} soru yanıtlandı', atlanan: 'Atlanan bölümler: {liste}', duzenle: 'Düzenle',
      gonder: 'Testi gönder',
      sonNot: 'Gönderdiğinizde sonucunuzun özeti e-postanıza, ayrıntılı hâli yalnız din görevlimize ulaşır.',
    },
    taslak: { not: 'Yanıtlarınız bu cihazda taslak olarak saklandı; kaldığınız yerden devam edebilirsiniz.' },
    sonuc: {
      baslik: 'Teşekkür ederiz — testiniz bize ulaştı',
      referans: 'Referans numaranız',
      epostaNotu: 'Bu özetin bir kopyası {eposta} adresine gönderildi. Gelen kutunuzda göremezseniz istenmeyen (spam) klasörüne bakın.',
      kuranBaslik: 'Kur’an-ı Kerim okuma', alanBaslik: 'Dinî bilgiler', anasayfa: 'Ana sayfaya dön',
    },
    hata: {
      gunlukSinir: 'Bugün çok sayıda test gönderildi. Yanıtlarınız bu cihazda saklı; lütfen yarın yeniden gönderin.',
      epostaGunlukSinir: 'Bu e-posta adresiyle bugün en fazla sayıda gönderim yapıldı. Lütfen yarın yeniden deneyin ya da imam@ulucamii.be adresine yazın.',
      hazirDegil: 'Test hizmeti şu an güncelleniyor. Yanıtlarınız bu cihazda saklı; lütfen biraz sonra yeniden deneyin.',
    },
  },

  fr: {
    sayfa: {
      etiket: 'Pour les adultes',
      baslik: 'Test de niveau : Coran et connaissances religieuses',
      altBaslik: 'Déterminons ensemble par où commencer : la première étape d’une formation faite pour vous.',
      aciklama: 'Test de niveau en lecture du Coran et en connaissances religieuses pour les personnes nouvellement converties et les adultes qui souhaitent apprendre les bases de l’islam. Notre mosquée prépare ensuite une formation personnalisée.',
    },
    giris: {
      paragraflar: [
        'Vous venez d’embrasser l’islam, ou vous êtes musulman(e) et vous souhaitez apprendre — depuis le début et de façon structurée — à lire le Coran et les bases de la religion ? Vous êtes au bon endroit. Notre mosquée propose une formation individuelle ; pour la préparer, nous avons d’abord besoin de vous connaître.',
        'Ce test n’est pas un examen. Il n’y a pas de note et vous n’êtes comparé(e) à personne. Il sert uniquement à bien choisir le point de départ.',
      ],
      noktalar: [
        'Il dure environ 30 à 35 minutes ; vous pouvez l’interrompre et le reprendre plus tard sur le même appareil.',
        'Il commence par la lecture du Coran, puis viennent la foi, le culte, la vie du Prophète et l’éthique.',
        'Si vous ne connaissez pas une réponse, choisissez « Je ne sais pas » ; vous pouvez aussi passer entièrement une partie que vous ne connaissez pas. Ne devinez pas : un résultat fidèle vous sera plus utile.',
        'Vous recevez un résumé de votre résultat par e-mail ; seul notre imam voit le détail.',
        'Notre imam vous contacte au plus tard dans un délai d’une semaine. La formation est gratuite.',
      ],
      cocukNotu: 'Ce test s’adresse aux personnes de 18 ans et plus. Pour les enfants et les jeunes, vous pouvez les inscrire à notre école coranique :',
      cocukBaglanti: 'École coranique',
      noscript: 'JavaScript doit être activé dans votre navigateur pour remplir ce test.',
    },
    adimlar: {
      baslik: 'Étapes', ilerleme: 'Progression du test',
      adimlar: ['Présentation', 'Lecture du Coran', 'Le Coran', 'Foi', 'Prière', 'Autres cultes', 'Vie du Prophète', 'Éthique', 'Pratique', 'Résumé'],
      ipuclari: [
        'Faisons d’abord connaissance ; vos informations ne parviennent qu’à notre imam.',
        'Nous vérifions l’alphabet arabe et la lecture, palier par palier. Vous pouvez passer un palier que vous ne connaissez pas.',
        'Connaissances générales sur le Coran, puis les sourates et invocations que vous connaissez par cœur.',
        'Les fondements de la foi. Si vous ne savez pas, choisissez « Je ne sais pas ».',
        'Ablutions, purification et prière.',
        'Jeûne, zakât, pèlerinage, sacrifice, et le licite et l’illicite au quotidien.',
        'La vie du Prophète et les autres prophètes.',
        'Le bon comportement et les bonnes manières au quotidien.',
        'Ici, pas de bonne ou de mauvaise réponse : nous demandons où vous en êtes aujourd’hui dans la pratique.',
        'Relisez vos réponses et envoyez.',
      ],
      adim: 'Étape {simdi} / {toplam}', geri: 'Retour', ileri: 'Continuer', kontrol: 'Aller au résumé',
      tumu: 'Afficher tout le test sur une page', adimli: 'Afficher étape par étape',
    },
    profil: {
      baslik: 'Faisons connaissance',
      not: 'Les champs marqués d’un astérisque sont obligatoires. Nous ne demandons ni numéro d’identité, ni adresse, ni date de naissance.',
      adSoyad: 'Vos prénom et nom',
      eposta: 'Votre adresse e-mail', epostaYardim: 'Le résumé de votre résultat sera envoyé à cette adresse.',
      epostaTekrar: 'Votre adresse e-mail (à nouveau)', epostaEslesmiyor: 'Les deux adresses e-mail doivent être identiques.',
      telefon: 'Votre numéro de téléphone ou WhatsApp', telefonYardim: 'Facultatif. Il nous permet de vous joindre plus facilement.',
      yasAraligi: 'Votre tranche d’âge',
      yasSecenekleri: [
        { deger: '18-25', ad: '18–25 ans' }, { deger: '26-40', ad: '26–40 ans' }, { deger: '41-60', ad: '41–60 ans' },
        { deger: '60+', ad: '60 ans et plus' }, { deger: 'belirtmedi', ad: 'Je préfère ne pas le préciser' },
      ],
      cinsiyet: 'Vous êtes',
      cinsiyetSecenekleri: [{ deger: 'kadin', ad: 'Une femme' }, { deger: 'erkek', ad: 'Un homme' }, { deger: 'belirtmedi', ad: 'Je préfère ne pas le préciser' }],
      muslumanlik: 'Votre parcours avec l’islam',
      muslumanlikSecenekleri: [
        { deger: 'henuz', ad: 'Je ne suis pas encore musulman(e), je souhaite découvrir l’islam' },
        { deger: '0-1', ad: 'Je suis musulman(e) depuis moins d’un an' },
        { deger: '1-5', ad: 'Je suis musulman(e) depuis 1 à 5 ans' },
        { deger: '5+', ad: 'Je suis musulman(e) depuis plus de 5 ans (converti(e))' },
        { deger: 'dogustan', ad: 'Je suis né(e) dans une famille musulmane' },
      ],
      oncekiEgitim: 'Avez-vous déjà suivi un enseignement religieux ?',
      oncekiEgitimSecenekleri: [
        { deger: 'hic', ad: 'Non, jamais' },
        { deger: 'kendi', ad: 'J’ai appris par moi-même (livres, internet, applications)' },
        { deger: 'aile', ad: 'J’ai appris auprès de ma famille ou d’amis' },
        { deger: 'kurs', ad: 'J’ai suivi des cours dans une mosquée ou une association' },
        { deger: 'okul', ad: 'J’ai étudié à l’école ou à l’université' },
      ],
      hedefler: 'Ce que vous attendez de cette formation', hedeflerYardim: 'Plusieurs choix possibles.',
      hedefSecenekleri: [
        { deger: 'namaz', ad: 'Apprendre à accomplir la prière' },
        { deger: 'kuranOkuma', ad: 'Apprendre à lire le Coran' },
        { deger: 'tecvid', ad: 'Mieux lire le Coran (tajwid)' },
        { deger: 'inanc', ad: 'Comprendre et approfondir ma foi' },
        { deger: 'gunluk', ad: 'Connaître le licite et l’illicite au quotidien' },
        { deger: 'ezber', ad: 'Mémoriser des sourates et des invocations' },
        { deger: 'cocuk', ad: 'Pouvoir transmettre à mes enfants' },
      ],
      dersDili: 'Dans quelle langue souhaitez-vous suivre les cours ?',
      dersDiliSecenekleri: [{ deger: 'tr', ad: 'Turc' }, { deger: 'fr', ad: 'Français' }, { deger: 'en', ad: 'Anglais' }],
      gunler: 'Les jours qui vous conviennent',
      gunSecenekleri: [
        { deger: 'pzt', ad: 'Lundi' }, { deger: 'sal', ad: 'Mardi' }, { deger: 'car', ad: 'Mercredi' }, { deger: 'per', ad: 'Jeudi' },
        { deger: 'cum', ad: 'Vendredi' }, { deger: 'cmt', ad: 'Samedi' }, { deger: 'paz', ad: 'Dimanche' },
      ],
      dilim: 'À quel moment de la journée ?',
      dilimSecenekleri: [{ deger: 'sabah', ad: 'Le matin' }, { deger: 'ogleden-sonra', ad: 'L’après-midi' }, { deger: 'aksam', ad: 'Le soir' }],
      bicim: 'Forme des cours',
      bicimSecenekleri: [{ deger: 'yuzyuze', ad: 'À la mosquée, en présentiel' }, { deger: 'cevrimici', ad: 'En ligne (visioconférence)' }, { deger: 'farketmez', ad: 'Peu importe' }],
      ekNot: 'Souhaitez-vous ajouter quelque chose ?', ekNotYardim: 'Facultatif. Seul notre imam le lira.',
    },
    onay: {
      baslik: 'Consentements',
      yas18: 'J’ai plus de 18 ans.',
      riza: 'Je consens expressément à ce que mes réponses, qui concernent mes convictions religieuses et mon niveau de connaissances religieuses, soient traitées par l’association Ulu Camii et transmises à l’imam afin de préparer une formation qui me soit adaptée.',
      bilgilendirme: [
        'Responsable du traitement : Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).',
        'Vos réponses sont des données sensibles ; elles ne sont traitées qu’avec votre consentement explicite (RGPD, art. 9.2.a). Seul notre imam voit le résultat détaillé ; rien n’est communiqué à des tiers.',
        'L’enregistrement est conservé 24 mois au maximum dans un registre non public du compte Google de l’association, puis supprimé automatiquement. Les e-mails sont envoyés via Brevo (France).',
        'Vous pouvez retirer votre consentement et demander la suppression de vos données à tout moment : imam@ulucamii.be',
      ],
      gizlilikBaglanti: 'La section correspondante de la politique de confidentialité',
      ortakCihaz: 'Tant que le test n’est pas envoyé, vos réponses sont gardées comme brouillon uniquement dans le navigateur de cet appareil (14 jours au maximum). Sur un ordinateur partagé, appuyez sur « Supprimer le brouillon » quand vous avez terminé.',
    },
    soru: {
      bilmiyorum: 'Je ne sais pas',
      zorunlu: 'Veuillez choisir une réponse ; en cas de doute, cochez « Je ne sais pas ».',
      atla: 'Passer cette partie — je n’ai pas encore de connaissances sur ce sujet',
      atlaYardim: 'Si vous cochez cette case, les questions de cette partie se ferment ; nous commencerons ce sujet depuis le début.',
      mezhepNotu: 'Cette question est posée selon l’école hanafite ; si vous avez appris selon une autre école, cochez la réponse que vous connaissez — elle n’influence pas votre niveau.',
    },
    okuma: {
      baslik: 'Lecture du Coran',
      giris: 'Cinq paliers, des lettres de l’alphabet arabe jusqu’à la lecture d’un verset. Chaque palier compte six questions courtes. Parfois vous voyez une lettre ou un mot, parfois vous écoutez un son.',
      harfBilmiyorum: 'Je ne connais pas du tout les lettres arabes',
      harfBilmiyorumYardim: 'Si vous cochez cette case, cette partie se ferme ; nous commencerons par les lettres. C’est tout à fait normal.',
      basamaklar: ['Palier 1 — Reconnaître les lettres', 'Palier 2 — La forme des lettres dans le mot', 'Palier 3 — Les voyelles brèves (fatha, kasra, damma)', 'Palier 4 — Soukoun, chadda, tanwin et prolongation', 'Palier 5 — Lire des mots et des versets'],
      basamakAtla: 'Je ne connais pas ce palier, passer',
      dinle: 'Écouter le son', tekrarDinle: 'Réécouter', sesHatasi: 'Le son n’a pas pu être chargé. Vérifiez votre connexion et réessayez, ou choisissez « Je ne sais pas ».',
      yazimNotu: 'Les prononciations sont écrites à la française (p. ex. بَ = « ba », شَ = « cha »).',
      beyanBaslik: 'Votre propre évaluation',
    },
    bolumler: {
      kuranBilgi: { baslik: 'Connaissance du Coran', giris: 'Connaissances générales sur le Coran ; les dernières questions portent sur les notions de tajwid.' },
      itikat: { baslik: 'Fondements de la foi', giris: 'Questions sur les fondements de la foi en islam.' },
      namaz: { baslik: 'Purification et prière', giris: 'Questions sur les ablutions, la grande ablution, le tayammum et la prière.' },
      ibadet: { baslik: 'Jeûne, zakât, pèlerinage et vie quotidienne', giris: 'Les autres actes de culte, et le licite et l’illicite au quotidien.' },
      siyer: { baslik: 'Vie du Prophète', giris: 'La vie du Prophète Muhammad (paix et salut sur lui) et les autres prophètes.' },
      ahlak: { baslik: 'Éthique et bonnes manières', giris: 'Le bon comportement, les droits d’autrui et les bonnes manières au quotidien.' },
    },
    ezber: {
      baslik: 'Ce que vous connaissez par cœur',
      giris: 'Pour chacune des sourates et invocations ci-dessous, cochez ce qui vous correspond le mieux.',
      durumlar: ['Pas encore', 'Je peux la lire avec le texte', 'Je la connais par cœur'],
    },
    uygulama: { baslik: 'La pratique au quotidien', giris: 'Ici, il n’y a ni bonne ni mauvaise réponse. Cochez sincèrement ce qui vous correspond ; personne ne vous jugera.' },
    ozet: {
      baslik: 'Résumé et envoi',
      giris: 'Avant d’envoyer, relisez vos informations. Pour revenir à une partie, appuyez sur « Modifier ».',
      cevaplanan: '{n} / {toplam} questions ont reçu une réponse', atlanan: 'Parties passées : {liste}', duzenle: 'Modifier',
      gonder: 'Envoyer le test',
      sonNot: 'À l’envoi, le résumé de votre résultat arrive dans votre boîte e-mail ; seul notre imam en reçoit le détail.',
    },
    taslak: { not: 'Vos réponses ont été gardées comme brouillon sur cet appareil ; vous pouvez reprendre là où vous vous étiez arrêté(e).' },
    sonuc: {
      baslik: 'Merci — votre test nous est bien parvenu',
      referans: 'Votre numéro de référence',
      epostaNotu: 'Une copie de ce résumé a été envoyée à {eposta}. Si vous ne la voyez pas, regardez dans le dossier des indésirables (spam).',
      kuranBaslik: 'Lecture du Coran', alanBaslik: 'Connaissances religieuses', anasayfa: 'Retour à l’accueil',
    },
    hata: {
      gunlukSinir: 'De très nombreux tests ont été envoyés aujourd’hui. Vos réponses restent enregistrées sur cet appareil ; veuillez renvoyer le test demain.',
      epostaGunlukSinir: 'Le nombre maximal d’envois pour cette adresse e-mail est atteint aujourd’hui. Veuillez réessayer demain ou écrire à imam@ulucamii.be.',
      hazirDegil: 'Le service du test est en cours de mise à jour. Vos réponses restent enregistrées sur cet appareil ; veuillez réessayer dans un moment.',
    },
  },

  en: {
    sayfa: {
      etiket: 'For adults',
      baslik: 'Level Assessment: Qur’an and Religious Knowledge',
      altBaslik: 'Let us work out together where to begin: the first step towards teaching made for you.',
      aciklama: 'A level assessment in Qur’an reading and religious knowledge for new Muslims and adults who want to learn the basics of Islam. Our mosque then plans personal teaching based on the result.',
    },
    giris: {
      paragraflar: [
        'Have you recently embraced Islam, or are you a Muslim who would like to learn — from the beginning and in an orderly way — how to read the Qur’an and the basics of the religion? You are in the right place. Our mosque offers one-to-one teaching; to plan it, we first need to get to know you.',
        'This test is not an exam. There is no mark and you are not compared with anyone. Its only purpose is to choose the right starting point.',
      ],
      noktalar: [
        'It takes about 30–35 minutes; you can stop and continue later on the same device.',
        'It starts with reading the Qur’an, followed by faith, worship, the life of the Prophet and ethics.',
        'If you do not know an answer, choose “I don’t know”; you can also skip a whole part you do not know. Please do not guess — an accurate result will help you more.',
        'You receive a summary of your result by e-mail; only our imam sees the details.',
        'Our imam will contact you within one week at the latest. The teaching is free of charge.',
      ],
      cocukNotu: 'This test is for people aged 18 and over. Children and young people can be enrolled in our Qur’an school:',
      cocukBaglanti: 'Qur’an school',
      noscript: 'JavaScript must be enabled in your browser to fill in this test.',
    },
    adimlar: {
      baslik: 'Steps', ilerleme: 'Test progress',
      adimlar: ['About you', 'Reading the Qur’an', 'The Qur’an', 'Faith', 'Prayer', 'Other worship', 'Life of the Prophet', 'Ethics', 'Practice', 'Summary'],
      ipuclari: [
        'First, let us get to know you; your information reaches only our imam.',
        'We check the Arabic alphabet and reading, rung by rung. You can skip a rung you do not know.',
        'General knowledge about the Qur’an, then the surahs and supplications you know by heart.',
        'The foundations of faith. If you do not know, choose “I don’t know”.',
        'Ablution, purification and prayer.',
        'Fasting, zakat, pilgrimage, sacrifice, and the lawful and unlawful in daily life.',
        'The life of the Prophet and the other prophets.',
        'Good character and everyday manners.',
        'There is no right or wrong here: we ask where you are in your practice today.',
        'Review your answers and send.',
      ],
      adim: 'Step {simdi} / {toplam}', geri: 'Back', ileri: 'Continue', kontrol: 'Go to summary',
      tumu: 'Show the whole test on one page', adimli: 'Show step by step',
    },
    profil: {
      baslik: 'About you',
      not: 'Fields marked with an asterisk are required. We do not ask for an ID number, an address or a date of birth.',
      adSoyad: 'Your first and last name',
      eposta: 'Your e-mail address', epostaYardim: 'The summary of your result will be sent to this address.',
      epostaTekrar: 'Your e-mail address (again)', epostaEslesmiyor: 'The two e-mail addresses must be identical.',
      telefon: 'Your phone or WhatsApp number', telefonYardim: 'Optional. It makes it easier for us to reach you.',
      yasAraligi: 'Your age range',
      yasSecenekleri: [
        { deger: '18-25', ad: '18–25' }, { deger: '26-40', ad: '26–40' }, { deger: '41-60', ad: '41–60' },
        { deger: '60+', ad: '60 and over' }, { deger: 'belirtmedi', ad: 'I prefer not to say' },
      ],
      cinsiyet: 'You are',
      cinsiyetSecenekleri: [{ deger: 'kadin', ad: 'A woman' }, { deger: 'erkek', ad: 'A man' }, { deger: 'belirtmedi', ad: 'I prefer not to say' }],
      muslumanlik: 'Your journey with Islam',
      muslumanlikSecenekleri: [
        { deger: 'henuz', ad: 'I am not a Muslim yet; I would like to discover Islam' },
        { deger: '0-1', ad: 'I have been a Muslim for less than a year' },
        { deger: '1-5', ad: 'I have been a Muslim for 1–5 years' },
        { deger: '5+', ad: 'I have been a Muslim for more than 5 years (I converted)' },
        { deger: 'dogustan', ad: 'I was born into a Muslim family' },
      ],
      oncekiEgitim: 'Have you had any religious education before?',
      oncekiEgitimSecenekleri: [
        { deger: 'hic', ad: 'No, never' },
        { deger: 'kendi', ad: 'I taught myself (books, internet, apps)' },
        { deger: 'aile', ad: 'I learnt from family or friends' },
        { deger: 'kurs', ad: 'I took lessons at a mosque or an association' },
        { deger: 'okul', ad: 'I studied at school or university' },
      ],
      hedefler: 'What you expect from this teaching', hedeflerYardim: 'You can choose more than one.',
      hedefSecenekleri: [
        { deger: 'namaz', ad: 'To learn how to pray' },
        { deger: 'kuranOkuma', ad: 'To learn to read the Qur’an' },
        { deger: 'tecvid', ad: 'To read the Qur’an better (tajwid)' },
        { deger: 'inanc', ad: 'To understand and deepen my faith' },
        { deger: 'gunluk', ad: 'To know what is lawful and unlawful in daily life' },
        { deger: 'ezber', ad: 'To memorise surahs and supplications' },
        { deger: 'cocuk', ad: 'To be able to teach my children' },
      ],
      dersDili: 'In which language would you like the lessons?',
      dersDiliSecenekleri: [{ deger: 'tr', ad: 'Turkish' }, { deger: 'fr', ad: 'French' }, { deger: 'en', ad: 'English' }],
      gunler: 'Days that suit you',
      gunSecenekleri: [
        { deger: 'pzt', ad: 'Monday' }, { deger: 'sal', ad: 'Tuesday' }, { deger: 'car', ad: 'Wednesday' }, { deger: 'per', ad: 'Thursday' },
        { deger: 'cum', ad: 'Friday' }, { deger: 'cmt', ad: 'Saturday' }, { deger: 'paz', ad: 'Sunday' },
      ],
      dilim: 'What time of day?',
      dilimSecenekleri: [{ deger: 'sabah', ad: 'Morning' }, { deger: 'ogleden-sonra', ad: 'Afternoon' }, { deger: 'aksam', ad: 'Evening' }],
      bicim: 'Lesson format',
      bicimSecenekleri: [{ deger: 'yuzyuze', ad: 'At the mosque, in person' }, { deger: 'cevrimici', ad: 'Online (video call)' }, { deger: 'farketmez', ad: 'Either is fine' }],
      ekNot: 'Is there anything you would like to add?', ekNotYardim: 'Optional. Only our imam will read it.',
    },
    onay: {
      baslik: 'Consents',
      yas18: 'I am over 18 years old.',
      riza: 'I give my explicit consent for my answers, which concern my religious beliefs and my level of religious knowledge, to be processed by the Ulu Camii association and passed on to the imam in order to plan teaching suited to me.',
      bilgilendirme: [
        'Data controller: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).',
        'Your answers are special-category data; they are processed only with your explicit consent (GDPR art. 9(2)(a)). Only our imam sees the detailed result; nothing is shared with third parties.',
        'The record is kept for 24 months at most in a non-public ledger in the association’s Google account and is then deleted automatically. E-mails are sent through Brevo (France).',
        'You can withdraw your consent and ask for your data to be deleted at any time: imam@ulucamii.be',
      ],
      gizlilikBaglanti: 'The relevant section of the privacy policy',
      ortakCihaz: 'Until the test is sent, your answers are kept as a draft only in this device’s browser (14 days at most). On a shared computer, press “Delete draft” when you have finished.',
    },
    soru: {
      bilmiyorum: 'I don’t know',
      zorunlu: 'Please choose an answer; if in doubt, tick “I don’t know”.',
      atla: 'Skip this part — I do not know this subject yet',
      atlaYardim: 'If you tick this box, the questions of this part close; we will start this subject from the beginning.',
      mezhepNotu: 'This question is asked according to the Hanafi school; if you learnt according to another school, tick the answer you know — it does not affect your level.',
    },
    okuma: {
      baslik: 'Reading the Qur’an',
      giris: 'Five rungs, from the letters of the Arabic alphabet to reading a verse. Each rung has six short questions. Sometimes you see a letter or a word, sometimes you listen to a sound.',
      harfBilmiyorum: 'I do not know the Arabic letters at all',
      harfBilmiyorumYardim: 'If you tick this box, this part closes; we will begin with the letters. That is perfectly normal.',
      basamaklar: ['Rung 1 — Recognising the letters', 'Rung 2 — Letter shapes inside a word', 'Rung 3 — Short vowels (fatha, kasra, damma)', 'Rung 4 — Sukun, shadda, tanwin and lengthening', 'Rung 5 — Reading words and verses'],
      basamakAtla: 'I do not know this rung, skip',
      dinle: 'Listen', tekrarDinle: 'Listen again', sesHatasi: 'The sound could not be loaded. Check your connection and try again, or choose “I don’t know”.',
      yazimNotu: 'Pronunciations are written in English spelling (e.g. بَ = “ba”, شَ = “sha”).',
      beyanBaslik: 'Your own assessment',
    },
    bolumler: {
      kuranBilgi: { baslik: 'Knowledge of the Qur’an', giris: 'General knowledge about the Qur’an; the last questions are about tajwid concepts.' },
      itikat: { baslik: 'Foundations of faith', giris: 'Questions about the foundations of faith in Islam.' },
      namaz: { baslik: 'Purification and prayer', giris: 'Questions about ablution, the full bath (ghusl), tayammum and prayer.' },
      ibadet: { baslik: 'Fasting, zakat, pilgrimage and daily life', giris: 'The other acts of worship, and the lawful and unlawful in daily life.' },
      siyer: { baslik: 'Life of the Prophet', giris: 'The life of Prophet Muhammad (peace be upon him) and the other prophets.' },
      ahlak: { baslik: 'Ethics and good manners', giris: 'Good character, the rights of others and everyday manners.' },
    },
    ezber: {
      baslik: 'What you know by heart',
      giris: 'For each surah and supplication below, tick what describes you best.',
      durumlar: ['Not yet', 'I can read it from the text', 'I know it by heart'],
    },
    uygulama: { baslik: 'Daily practice', giris: 'There is no right or wrong answer here. Tick sincerely what describes you best; nobody will judge you.' },
    ozet: {
      baslik: 'Summary and sending',
      giris: 'Before sending, review your information. To go back to a part, press “Edit”.',
      cevaplanan: '{n} / {toplam} questions answered', atlanan: 'Parts skipped: {liste}', duzenle: 'Edit',
      gonder: 'Send the test',
      sonNot: 'When you send it, the summary of your result arrives in your inbox; only our imam receives the details.',
    },
    taslak: { not: 'Your answers were saved as a draft on this device; you can continue where you left off.' },
    sonuc: {
      baslik: 'Thank you — we have received your test',
      referans: 'Your reference number',
      epostaNotu: 'A copy of this summary was sent to {eposta}. If you cannot see it, check your spam folder.',
      kuranBaslik: 'Reading the Qur’an', alanBaslik: 'Religious knowledge', anasayfa: 'Back to the home page',
    },
    hata: {
      gunlukSinir: 'A very large number of tests were sent today. Your answers are saved on this device; please send the test again tomorrow.',
      epostaGunlukSinir: 'The maximum number of submissions for this e-mail address has been reached today. Please try again tomorrow or write to imam@ulucamii.be.',
      hazirDegil: 'The test service is being updated. Your answers are saved on this device; please try again in a moment.',
    },
  },
};
