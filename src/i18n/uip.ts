/** Uluslararası İlahiyat Programı (UİP) sayfası — üç dilli metin.
 *
 * Kaynak: 2026 UİP Tanıtım ve Başvuru Kılavuzu (T.C. Diyanet İşleri Başkanlığı, 40 s.; sayfa
 * numaraları köşeli ayraçla), 2026 broşürleri (FR/EN/DE), Brüksel Büyükelçiliği Sosyal İşler
 * Müşavirliğinin 27.02.2024 tarihli dağıtım yazısı ve diyanet.be. Erişim: 3 Eylül 2026.
 * Kural: kılavuzda olmayan rakam (burs tutarı, Belçika'ya özel öğrenci sayısı, 2027 tarihi) yazılmaz.
 * Yer tutucular: {{son}}, {{baslangic}}, {{donem}} — Uip.astro'da doldurulur.
 * Fransızca ve İngilizce sözlükler ayrı dosyalarda (uip-fr.ts, uip-en.ts); yapı bu dosyadaki arayüzle sabittir. */
import type { Dil } from './ui';
import { fr } from './uip-fr';
import { en } from './uip-en';

export interface UipMetin {
  etiket: string; baslik: string; alt: string; metaAciklama: string;
  durum: { kapandi: string; acik: string; yakinda: string; takip: string; kilavuz: string; basvuruDugmesi: string };
  ozet: Array<{ sayi: string; ad: string; not: string }>;
  nedir: { baslik: string; p1: string; p2: string; amacBaslik: string; amaclar: string[] };
  imkan: { baslik: string; alt: string; kartlar: Array<{ baslik: string; metin: string }>; kapsamDisi: string; teminat: string; stajBaslik: string; staj: string[]; tamamlayiciBaslik: string; tamamlayici: string[]; sosyalBaslik: string; sosyal: string[] };
  fakulte: { baslik: string; alt: string; liste: Array<{ ad: string; sehir: string; yil: string }>; diploma: string; katilim: string };
  sart: { baslik: string; alt: string; liste: string[]; not: string };
  takvim: { baslik: string; alt: string; islem: string; tarih: string; satirlar: Array<[string, string]> };
  adim: { baslik: string; alt: string; liste: Array<{ baslik: string; metin: string }>; mulakatBaslik: string; mulakat: string; konuBaslik: string; konular: string[]; sonuc: string };
  belcika: { baslik: string; p1: string; adimlar: string[]; camiBaslik: string; cami: string[]; musavirlik: { ad: string; adres: string; telEtiket: string; not: string } };
  belge: { baslik: string; basvuruBaslik: string; basvuru: string[]; kayitBaslik: string; kayit: string[]; not: string };
  taahhut: { baslik: string; alt: string; liste: string[]; pdf: string };
  kariyer: { baslik: string; alt: string; liste: Array<{ baslik: string; metin: string }>; udyipBaslik: string; udyip: string; udyipPdf: string };
  sss: { baslik: string; liste: Array<{ s: string; c: string }> };
  ekler: { baslik: string; alt: string; belgeler: Array<{ ad: string; aciklama: string; href: string; boyut: string }>; baglantiBaslik: string; baglantilar: Array<{ ad: string; href: string }>; ilgiliBaslik: string; ilgili: string; afisAlt: string; afisUip: string; afisBurs: string };
  iletisim: { baslik: string; alt: string; dinGorevlisi: string; cami: string; adres: string; bdv: string; musavirlik: string; eposta: string; mesai: string };
  kaynak: { baslik: string; metin: string };
}

export const tr: UipMetin = {
  etiket: 'Diyanet İşleri Başkanlığı · 2006’dan bu yana',
  baslik: 'Uluslararası İlahiyat Programı (UİP)',
  alt: 'Belçika’da liseyi bitiren gençler için Türkiye’nin altı ilahiyat fakültesinde burslu lisans eğitimi: barınma, yemek ve harç Diyanet tarafından karşılanır; mezunlar yurt dışında din görevlisi, akademisyen ve rehber olarak hizmet eder.',
  metaAciklama: 'Uluslararası İlahiyat Programı (UİP): Diyanet bursuyla Türkiye’de ilahiyat lisansı. Şartlar, takvim, başvuru adımları, belgeler, Belçika’daki süreç ve Marche-en-Famenne Ulu Camii’nin desteği.',
  durum: {
    kapandi: '{{donem}} dönemi başvuruları {{son}} tarihinde kapandı. Bir sonraki dönemin tarihleri Diyanet İşleri Başkanlığınca her yıl şubat ayı civarında yeni kılavuzla ilan edilir; duyurulur duyurulmaz bu sayfada ve camimizde paylaşılacaktır. Bu arada din görevlimizle tanışabilir, mülakat hazırlığına (Kur’an okuma, dinî bilgiler) şimdiden başlayabilirsiniz.',
    acik: '{{donem}} dönemi başvuruları açık — son gün {{son}}. Belgelerinizi son güne bırakmayın; tavsiye mektubu için din görevlimizle erken görüşün.',
    yakinda: '{{donem}} dönemi başvuruları {{baslangic}} tarihinde açılıyor. Şimdiden belgelerinizi hazırlayabilir ve din görevlimizle görüşebilirsiniz.',
    takip: 'Diyanet duyuruları',
    kilavuz: 'Kılavuzu indir (PDF)',
    basvuruDugmesi: 'Çevrim içi başvuru sayfası',
  },
  ozet: [
    { sayi: '6', ad: 'ilahiyat fakültesi', not: 'Ankara · İstanbul · Konya · Bursa' },
    { sayi: '4 yıl', ad: 'lisans eğitimi', not: '+ hazırlık sınıfı' },
    { sayi: '387', ad: 'burslu öğrenci', not: '14 ülkeden (2026)' },
    { sayi: '1.243', ad: 'mezun', not: '20 yılda' },
  ],
  video: {
    baslik: 'Tanıtım filmi',
    alt: 'Diyanet İşleri Başkanlığının UİP tanıtım filmi; Belçika Diyanet Vakfı’nın (diyanet.be) ana sayfasında yayımlanan sürüm. Video, siz oynatana kadar yüklenmez.',
    kaynak: 'Kaynak: Diyanet İşleri Başkanlığı · diyanet.be · 9 dk',
    digerBaslik: 'Diğer videolar',
    tdv: 'Türkiye Diyanet Vakfı — Uluslararası İlahiyat Programı',
    diyanettv: 'Diyanet TV — Uluslararası İlahiyat’ta Yeni Dönem',
    eksen: 'Diyanet TV “Eksen İnsan” 121. bölüm: Uluslararası İlahiyat Programı (52 dk, YouTube)',
  },
  nedir: {
    baslik: 'Program nedir?',
    p1: 'Uluslararası İlahiyat Programı, Diyanet İşleri Başkanlığının başlattığı ve koordine ettiği bir burs programıdır. Yurt dışında yaşayan Türk gençlerine ve Türkiye kökenli olmayan adaylara, Türkiye’deki ilahiyat fakültelerinde lisans düzeyinde dinî yükseköğrenim imkânı sağlar [Kılavuz 2026, s. 3]. 2006’da Ankara Üniversitesi İlahiyat Fakültesinde başlayan program bugün altı fakültede yürütülmektedir.',
    p2: 'Şartları taşıyan ve mülakatta başarılı olan adaylar kontenjan dâhilinde fakültelere yerleştirilir; öğrenciler fakültenin müfredatını takip eder ve mezuniyette İlahiyat Lisans Diploması alır. Bursu, barınmayı ve öğrenim giderlerini Türkiye Diyanet Vakfı karşılar; Belçika Diyanet Vakfı da bölgedeki öğrencilere ek destek sunar.',
    amacBaslik: 'Programın beş amacı',
    amaclar: [
      'Avrupa’da yaşayan toplumun dinî ve kültürel ihtiyaçlarını yakından bilen bir din hizmetleri kadrosu yetiştirmek.',
      'Örgün ve yaygın din eğitimini doğru yöntemlerle sunabilen eğitimciler yetiştirmek.',
      'Toplumsal uyum süreçlerinde rehberlik edebilecek insanlar yetiştirmek.',
      'Ön yargıları giderecek doğru dinî bilgiyi ortaya koyabilen bir kadro oluşturmak.',
      'Din bilimleri alanında nitelikli akademik insan kaynağı yetiştirmek.',
    ],
  },
  imkan: {
    baslik: 'Neler sağlanır?',
    alt: 'Kayıt yapılıp taahhütname imzalandıktan sonra öğrenci şu desteklerden yararlanır [Kılavuz 2026, s. 5-8]:',
    kartlar: [
      { baslik: 'Burs', metin: 'Aylık maddi destek (tutar her yıl Başkanlıkça belirlenir; kılavuzda rakam verilmez).' },
      { baslik: 'Barınma', metin: 'Türkiye Diyanet Vakfı yurtlarında ücretsiz konaklama; eğitim-öğretim yılı boyunca.' },
      { baslik: 'Yemek', metin: 'İaşe desteği (yurt ve fakülte yemekhaneleri).' },
      { baslik: 'Öğrenim harcı', metin: 'Fakültenin temel eğitim giderleri Başkanlıkça karşılanır.' },
    ],
    kapsamDisi: 'Kapsam dışı: ulaşım (uçak bileti), kitap-kırtasiye ve sağlık sigortası öğrenciye aittir [s. 6].',
    teminat: 'Kesin kayıtta öğrenciden 1.000 € teminat alınır; programı burslu olarak tamamlayana iade edilir, programı yarıda bırakan veya taahhütnameye aykırılık nedeniyle çıkarılana iade edilmez [s. 20].',
    stajBaslik: 'Mesleki eğitim ve staj',
    staj: [
      'Camide din hizmeti uygulaması: imamlık, müezzinlik, cuma ve hutbe.',
      'Kur’an kursu uygulamaları; vaaz ve dinî hitabet.',
      'Manevi destek stajı: cezaevi, huzurevi, çocuk evi, hastane, gençlik merkezi.',
      'Müftülük uygulamaları (Alo Fetva nöbeti, Aile ve Dinî Rehberlik Bürosu), cenaze hizmetleri.',
      'Yaz tatilinde bulunduğu ülkede, müşavirlik koordinesiyle cami ve dernek stajı; sonunda staj belgesi.',
    ],
    tamamlayiciBaslik: 'Tamamlayıcı eğitim (katılım zorunlu)',
    tamamlayici: ['Arapça kursları', 'Kur’an-ı Kerim ve tecvid', 'Temel İslam bilimleri dersleri (tefsir, hadis, fıkıh, kelam)', 'Dinî mûsikî', 'Tematik seminerler ve atölyeler'],
    sosyalBaslik: 'Sosyo-kültürel hayat',
    sosyal: ['Geziler, yaz ve kış kampları', 'Öğrenci kulübü etkinlikleri', 'Gönüllülük projeleri', 'Mezuniyet programları'],
  },
  fakulte: {
    baslik: 'Altı ilahiyat fakültesi',
    alt: 'Eğitim dili Türkçedir; ihtiyaç hâlinde İngilizce ilahiyat programına yerleştirme yapılabilir. Lisans eğitimi hazırlık hariç 4 yıldır (8 dönem). Hazırlık sınıfı zorunlu ve Arapça ağırlıklıdır; Türkçe bilmeyen öğrenciler ayrıca bir yıl Türkçe hazırlık görür [Kılavuz 2026, s. 10].',
    liste: [
      { ad: 'Ankara Üniversitesi İlahiyat Fakültesi', sehir: 'Ankara', yil: '2006' },
      { ad: 'Marmara Üniversitesi İlahiyat Fakültesi', sehir: 'İstanbul', yil: '2007' },
      { ad: 'İstanbul Üniversitesi İlahiyat Fakültesi', sehir: 'İstanbul', yil: '2011' },
      { ad: 'Necmettin Erbakan Üniversitesi İlahiyat Fakültesi', sehir: 'Konya', yil: '2012' },
      { ad: 'Uludağ Üniversitesi İlahiyat Fakültesi', sehir: 'Bursa', yil: '2012' },
      { ad: '29 Mayıs Üniversitesi İlahiyat Fakültesi', sehir: 'İstanbul', yil: '2012' },
    ],
    diploma: 'Programı başarıyla tamamlayanlara İlahiyat Lisans Diploması verilir. Bölümler: Temel İslam Bilimleri, Felsefe ve Din Bilimleri, İslam Tarihi ve Sanatları [s. 10-11].',
    katilim: 'Programa katılım yılı',
  },
  sart: {
    baslik: 'Kimler başvurabilir?',
    alt: '2026 kılavuzundaki başvuru şartları [s. 14-15]; her yıl yeni kılavuzla yeniden ilan edilir.',
    liste: [
      'Yurt dışında liseyi bitirmiş ya da son sınıfta okuyor olmak (diploma Türkiye’deki lise diplomasına denk sayılmalıdır).',
      'Yaşadığı ülkenin vatandaşı, çifte vatandaş, mavi kart sahibi ya da sürekli oturum sahibi olmak.',
      '1 Ocak {{donem}} itibarıyla 25 yaşından gün almamış olmak.',
      'Bekâr olmak.',
      'Türkiye’de bir ilahiyat programında okumamış ve okumuyor olmak.',
      'Daha önce programa kabul edilip ilişiği kesilmemiş ya da mazeretsiz kayıt yaptırmamış olmak.',
    ],
    not: 'Yalnızca Türkiye Cumhuriyeti vatandaşı olanlar, T.C. Millî Eğitim Bakanlığı lise diploması sahipleri ve Açık Öğretim Lisesi mezunları bu programa başvuramaz [s. 15]. Başvurularda yükseköğretim kurumlarının “Yurt Dışından Öğrenci Kabulüne İlişkin Esaslar”ı uygulanır.',
  },
  takvim: {
    baslik: '{{donem}} başvuru takvimi',
    alt: 'Kılavuz 2026, s. 15 ve 18-19. Bir sonraki dönemin tarihleri yayımlanmadı; geçmiş yıllarda başvurular şubat sonunda açılıp mayıs sonunda kapandı.',
    islem: 'İşlem', tarih: 'Tarih',
    satirlar: [
      ['Çevrim içi başvuru ve belge teslimi', '23 Şubat – 29 Mayıs 2026'],
      ['Ön değerlendirme', 'Mayıs – Haziran'],
      ['Mülakat (bulunduğunuz ülkede, yüz yüze veya çevrim içi)', 'Haziran'],
      ['Sonuçların ilanı', 'Temmuz'],
      ['Türkiye’ye gidiş, oryantasyon, ders başlangıcı', 'Ağustos – Eylül'],
    ],
  },
  adim: {
    baslik: 'Başvuru nasıl yapılır?',
    alt: 'Altı adım [Kılavuz 2026, s. 16-17]. Belgeler teslim edilene kadar başvuru numaranızla bilgilerinizi güncelleyebilirsiniz.',
    liste: [
      { baslik: 'Çevrim içi form', metin: 'Diyanet’in başvuru sayfasında (dibbys.diyanet.gov.tr) formu doldurun; e-posta adresinizi doğru yazın, mülakat daveti bu adrese gelir.' },
      { baslik: 'Belgeleri yükleyin', metin: 'Diploma veya öğrenci belgesi, denklik belgesi, kimlik/pasaport, oturum belgesi ve imzalı taahhütnameyi sisteme yükleyin.' },
      { baslik: 'Tavsiye mektubu', metin: 'Tavsiye mektubunun aday bölümünü doldurup din görevlimize verin; din görevlisi kendi bölümünü doldurur ve mektubu kapalı zarfla Müşavirliğe bizzat ulaştırır.' },
      { baslik: 'Elden teslim', metin: 'Belgelerin fotokopileri, başvuru formunun çıktısı, taahhütname ve bir fotoğrafı Brüksel’deki Sosyal İşler Müşavirliğine teslim edin.' },
      { baslik: 'Onay', metin: 'Müşavirlik ön incelemeden sonra başvurunuzu sistemde etkinleştirir.' },
      { baslik: 'Süreyi kaçırmayın', metin: 'Son günden sonra ulaşan başvurular geçersiz sayılır.' },
    ],
    mulakatBaslik: 'Mülakat',
    mulakat: 'Başkanlığın ön değerlendirmesini geçen adaylar mülakata çağrılır; tarih ve yer e-postayla bildirilir ve Müşavirlikten de öğrenilebilir. Mülakat, adayın yaşadığı ülkede yüz yüze ya da çevrim içi yapılır; gerekirse başka bir ülkedeki merkeze davet edilebilir [s. 18-19].',
    konuBaslik: 'Mülakat konuları',
    konular: ['Kur’an-ı Kerim (yüzünden okuma ve ezber)', 'Dinî bilgiler (inanç, ibadet, fıkıh, siyer, ahlak)', 'Genel kültür', 'Türkçe ifade becerisi', 'Akademik ilgi'],
    sonuc: 'Sonuçlar başvuru sayfasında aday numarasıyla açıklanır; Müşavirlikten de öğrenilebilir.',
  },
  belcika: {
    baslik: 'Belçika’da süreç ve camimizin desteği',
    p1: 'Belçika’da başvurular T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği (Din Hizmetleri) üzerinden yürütülür. Müşavirliğin dernek başkanlarına ve din görevlilerine gönderdiği yazıya göre süreç şöyle işler [Müşavirlik yazısı, 27 Şubat 2024]:',
    adimlar: [
      'Program cami ve derneklerde cemaate duyurulur; ilgilenenlere kılavuz verilir.',
      'Tavsiye mektubunun birinci bölümünü aday, ikinci ve üçüncü bölümünü din görevlisi doldurur; mektup kapalı zarfla Müşavirliğe ulaştırılır.',
      'Bursluluk taahhütnamesi adaya imzalatılır.',
      'Başvuru çevrim içi yapılır; istenen belgeler son güne kadar Müşavirliğe teslim edilir.',
    ],
    camiBaslik: 'Ulu Camii’nde size nasıl yardımcı oluruz?',
    cami: [
      'Din görevlimiz programı, şartları ve mülakat konularını sizinle birebir görüşür.',
      'Tavsiye mektubunun din görevlisi bölümünü doldurur ve mektubu Müşavirliğe ulaştırır.',
      'Belgelerinizi birlikte gözden geçirir, eksikleri son günden önce tamamlamanıza yardım ederiz.',
      'Mülakata hazırlık için Kur’an okuma ve dinî bilgiler konusunda birlikte çalışırız.',
    ],
    musavirlik: {
      ad: 'T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği',
      adres: 'Rue Montoyer 4, 1000 Bruxelles',
      telEtiket: 'Telefon',
      not: 'İletişim bilgileri Müşavirliğin 27 Şubat 2024 tarihli yazısından alınmıştır; gitmeden önce arayarak teyit edin.',
    },
  },
  belge: {
    baslik: 'İstenen belgeler',
    basvuruBaslik: 'Başvuruda sisteme yüklenir [s. 16]',
    basvuru: [
      'Lise diploması (mezunlar için).',
      'Lise diploması denklik belgesi (Büyükelçilik Eğitim Müşavirliğinden).',
      'Son sınıf öğrencileri için öğrenci belgesi ve not dökümü.',
      'Geçerli kimlik kartı veya pasaport sureti.',
      'Sürekli oturum belgesi (yaşadığı ülkenin vatandaşı olmayanlar için).',
      'İmzalı bursluluk taahhütnamesi.',
    ],
    kayitBaslik: 'Kesin kayıtta, Türkiye’de ve şahsen [s. 20]',
    kayit: [
      'Lise diplomasının aslı ve noter ya da dış temsilcilik onaylı Türkçe çevirisi.',
      'Lise diploması denklik belgesi.',
      'Pasaport ve kimlik kartının aslı ile fotokopisi.',
      'Öğrenim vizesi (çifte vatandaş veya mavi kart sahibi olmayanlar için).',
      '12 adet vesikalık fotoğraf.',
    ],
    not: 'Posta ile kayıt kabul edilmez; eksik veya onaysız belgeyle kayıt yapılmaz. Şartları taşımadığı sonradan anlaşılan adayın, mülakatı kazanmış olsa bile kaydı yapılmaz.',
  },
  taahhut: {
    baslik: 'Bursluluk taahhütnamesi',
    alt: 'Programa kabul edilen öğrenci şu hususları kabul eder (2026 kılavuzu, s. 23 — özet):',
    liste: [
      'Yerleştirildiği fakültede öğrenimine devam eder; mevzuat dışı yatay geçiş istemez.',
      'Fakültenin ve programın yönetmeliklerine uyar.',
      'Bağımlılık yapan madde kullanmaz, ahlak kurallarına uyar.',
      'Başkanlıkça belirlenen yurtta kalır; aksi izne bağlıdır.',
      'Eğitim, staj ve seminer programlarına katılır.',
      'Siyasi ve ideolojik örgütlenmelerden uzak durur.',
      'Öğrenimi yarıda bırakırsa programa bir daha dönemez.',
      'Teminat bedelini yatırıp taahhütnameyi imzalayarak desteklerden yararlanmaya başlar.',
      'Kesin kayıttan sonra ayrılırsa ya da kurallara aykırılıkla çıkarılırsa teminat iade edilmez.',
      'Desteklerin kesilmesi Burs Programları Prosedürü ve Öğrenci Talimatnamesi’ne göre yürütülür.',
    ],
    pdf: 'Taahhütnamenin tam metni (PDF, kılavuz s. 23)',
  },
  kariyer: {
    baslik: 'Mezuniyetten sonra',
    alt: 'Kılavuzun sıraladığı yollar [s. 13-14]:',
    liste: [
      { baslik: 'Yurt dışında din görevliliği', metin: 'Sınavla; başarılı olanlar kendi ülkelerinde, şartları taşıyorlarsa başka bir ülkede görev alabilir.' },
      { baslik: 'Dinî Yüksek İhtisas', metin: 'Mülakatla seçilenler ihtisas merkezlerinde eğitime devam eder; mezunlar yurt dışına sözleşmeli din görevlisi olarak atanır.' },
      { baslik: 'Cami rehberliği', metin: 'Yabancı dil yeterliği arandığından UİP mezunları avantajlıdır; camileri ziyaret eden yabancılara rehberlik.' },
      { baslik: 'Diyanet uzmanlığı', metin: 'Din İşleri Yüksek Kurulu Uzmanlığı ve Diyanet İşleri Uzmanlığı, uzman yardımcılığından sonra sınavla.' },
      { baslik: 'Lisansüstü eğitim', metin: 'Yurt içinde veya dışında yüksek lisans ve doktora; TDV bursu mümkündür.' },
      { baslik: 'Öğretmenlik ve diğer', metin: 'Formasyon alanlar din kültürü, imam hatip meslek dersleri ve Arapça öğretmenliği yapabilir.' },
    ],
    udyipBaslik: 'Uluslararası Dinî Yüksek İhtisas Programı (UDYİP)',
    udyip: 'UİP’in devamı niteliğindeki ayrı bir programdır: dinî yükseköğrenim mezunlarına Arapça hazırlık ve temel İslam bilimlerinde ihtisas eğitimi verir (2026 duyurusuna göre toplam 33 ay; 35 yaş sınırı; başvuru 9 Şubat – 3 Nisan 2026).',
    udyipPdf: 'UDYİP 2026 duyurusu (PDF)',
  },
  sss: {
    baslik: 'Sık sorulan sorular',
    liste: [
      { s: 'Kimler başvurabilir?', c: 'Yurt dışında liseyi bitirmiş ya da son sınıfta olan, yaşadığı ülkenin vatandaşı, çifte vatandaş, mavi kart sahibi ya da sürekli oturumu bulunan, 25 yaşını doldurmamış, bekâr ve Türkiye’de ilahiyat okumamış adaylar.' },
      { s: 'Yalnızca Türk vatandaşları mı başvurabilir?', c: 'Hayır, tam tersi: yalnızca Türkiye Cumhuriyeti vatandaşı olanlar ve Türkiye’de lise bitirenler başvuramaz. Belçika vatandaşı ya da sürekli oturumu olan her aday, Türkiye kökenli olsun olmasın başvurabilir.' },
      { s: 'Türkçe bilmek şart mı?', c: 'Mülakat konularından biri Türkçe ifade becerisidir; ancak Türkçe bilmeyen öğrenciler için bir yıllık Türkçe hazırlık sınıfı vardır. Eğitim dili Türkçedir.' },
      { s: 'Başvuru nereden yapılır?', c: 'Diyanet’in başvuru sayfasından çevrim içi yapılır; ardından belgeler Brüksel’deki Sosyal İşler Müşavirliğine elden teslim edilir.' },
      { s: 'Cami görevlisinin rolü nedir?', c: 'Tavsiye mektubunun kendi bölümünü doldurup mektubu kapalı zarfla Müşavirliğe ulaştırır; belgeleri ve mülakat hazırlığını sizinle birlikte gözden geçirir.' },
      { s: 'Mülakat nerede yapılır?', c: 'Adayın yaşadığı ülkede, yüz yüze ya da çevrim içi. Gerekirse başka bir ülkedeki merkeze davet edilebilir.' },
      { s: 'Program ücretli mi?', c: 'Öğrenim harcı, barınma ve yemek Diyanet tarafından karşılanır; aylık burs verilir. Kayıtta 1.000 € teminat alınır ve programı tamamlayana iade edilir. Uçak bileti, kitap ve sağlık sigortası öğrenciye aittir.' },
      { s: 'Eğitim kaç yıl sürer?', c: 'Lisans 4 yıldır; buna zorunlu hazırlık sınıfı, Türkçe bilmeyenler için ayrıca bir yıl Türkçe hazırlık eklenir.' },
      { s: 'Mezun olunca Belçika’ya din görevlisi olarak dönülebilir mi?', c: 'Kılavuz, sınavda başarılı olan mezunların kendi ülkelerinde din görevlisi olarak çalışabileceğini belirtir; atama sınav ve kadro şartına bağlıdır.' },
      { s: 'Bir sonraki başvuru dönemi ne zaman?', c: 'Resmî tarih yayımlanmadı. Geçmiş yıllarda başvurular şubat sonunda açılıp mayıs sonunda kapandı; kesin tarihler Diyanet’in yeni kılavuzuyla ilan edilecek ve bu sayfada güncellenecektir.' },
      { s: 'Kız öğrenciler de başvurabilir mi?', c: 'Evet. Program karmadır; kılavuzda kız öğrenciler için Ankara ve 29 Mayıs kız yurtları, erkek öğrenciler için Bursa ve Konya erkek yurtları ayrı ayrı listelenir (2026 kılavuzu, s. 5).' },
      { s: 'Bu yıl kabul edilmezsem tekrar başvurabilir miyim?', c: 'Evet. Kılavuz yalnızca daha önce kabul edilip ilişiği kesilenlerin veya kazanıp mazeretsiz kayıt yaptırmayanların tekrar başvuramayacağını söyler [Kılavuz 2026, s. 15, madde 5]; mülakatta bu yıl seçilemeyen adaylar için bir sonraki dönemde başvurma engeli yoktur.' },
    ],
  },
  ekler: {
    baslik: 'Belgeler ve bağlantılar',
    alt: 'Başvuru usul ve esaslarını içeren resmî belgeler. Kılavuz web için sıkıştırılmıştır; aslı diyanet.be’de yayımlanmıştır.',
    belgeler: [
      { ad: '2026 UİP Tanıtım ve Başvuru Kılavuzu', aciklama: 'Diyanet İşleri Başkanlığı · 40 sayfa · şartlar, takvim, adımlar, belgeler, taahhütname, fakülteler, kariyer', href: '/belgeler/uip/uip-tanitim-ve-basvuru-kilavuzu-2026.pdf', boyut: 'PDF · 2,5 MB' },
      { ad: 'Bursluluk Taahhütnamesi (2026)', aciklama: 'Kılavuzun 23. sayfası · başvuruda imzalanıp sisteme yüklenir', href: '/belgeler/uip/bursluluk-taahhutnamesi-2026.pdf', boyut: 'PDF · 72 KB' },
      { ad: 'Tavsiye Mektubu (örnek, 2024 sürümü)', aciklama: 'Aday ve din görevlisi bölümleri · güncel sürümünü din görevlimizden ya da Müşavirlikten alınız', href: '/belgeler/uip/tavsiye-mektubu-2024-ornek.pdf', boyut: 'PDF · 50 KB' },
      { ad: 'Broşür 2026 — Fransızca', aciklama: 'Programme international de théologie · 2 sayfa', href: '/belgeler/uip/uip-brosur-2026-fr.pdf', boyut: 'PDF · 825 KB' },
      { ad: 'Broşür 2026 — İngilizce', aciklama: 'International Divinity Program · 2 sayfa', href: '/belgeler/uip/uip-brosur-2026-en.pdf', boyut: 'PDF · 826 KB' },
      { ad: 'Broşür 2026 — Almanca', aciklama: 'Internationales Theologieprogramm · 2 sayfa', href: '/belgeler/uip/uip-brosur-2026-de.pdf', boyut: 'PDF · 820 KB' },
      { ad: 'UDYİP 2026 duyurusu', aciklama: 'Uluslararası Dinî Yüksek İhtisas Programı · mezuniyet sonrası ihtisas', href: '/belgeler/uip/udyip-duyuru-2026.pdf', boyut: 'PDF · 708 KB' },
    ],
    baglantiBaslik: 'Resmî bağlantılar',
    baglantilar: [
      { ad: 'Çevrim içi başvuru sayfası (dibbys.diyanet.gov.tr)', href: 'https://dibbys.diyanet.gov.tr/IKYS/Sinav/KurumDisi/DisIliskiler/UIPBasvuru.aspx' },
      { ad: 'Diyanet Dış İlişkiler — UİP 2026 duyurusu', href: 'https://disiliskiler.diyanet.gov.tr/Detay/619/uluslararas%C4%B1-ilahiyat-program%C4%B1-2026-y%C4%B1l%C4%B1-ba%C5%9Fvurular%C4%B1' },
      { ad: 'Belçika Diyanet Vakfı — UİP başvuruları', href: 'https://www.diyanet.be/Anasayfa/xBlog/ArticleID/3337/UP-BAVURULARI-BALIYOR' },
      { ad: 'Kılavuzun aslı (diyanet.be, 22 MB)', href: 'https://www.diyanet.be/Portals/0/xBlog/uploads/2026/2/13/2026UIPTanitimveBasvuruKilavuzu(1).pdf' },
      { ad: 'Belçika Diyanet Vakfı — eğitim bursu (Fitre-Zekât Fonu)', href: 'https://www.diyanet.be/Burs' },
      { ad: 'Diyanet İşleri Başkanlığı duyuruları', href: 'https://www.diyanet.gov.tr' },
      { ad: 'Türkiye Diyanet Vakfı', href: 'https://www.diyanetvakfi.org.tr' },
    ],
    ilgiliBaslik: 'İlgili burs: Diyanet Bursları (TDV)',
    ilgili: 'Türkiye Diyanet Vakfı’nın uluslararası öğrencilere yönelik “Diyanet Bursları” programı, imam hatip lisesi, ilahiyat lisans ve lisansüstü düzeylerinde ayrı bir başvuru takvimiyle yürütülür (2026 başvuruları 15 Ocak – 28 Şubat). Ayrıntı ve başvuru: diyanetburslari.tdv.org.',
    afisAlt: 'Afişler (büyütmek için tıklayın)',
    afisUip: '2026 UİP başvuru afişi (Belçika Diyanet Vakfı)',
    afisBurs: 'Diyanet Bursları 2026 afişi',
  },
  iletisim: {
    baslik: 'Bilgi ve başvuru desteği',
    alt: 'Programla ilgilenen gençler ve aileleri camimize gelebilir ya da din görevlimizi arayabilir. Görüşme ücretsizdir; tavsiye mektubu için erken davranın.',
    dinGorevlisi: 'Din görevlisi', cami: 'Cami', adres: 'Adres', bdv: 'Belçika Diyanet Vakfı', musavirlik: 'Sosyal İşler Müşavirliği', eposta: 'E-posta', mesai: 'hafta içi 09.00–12.30 / 14.00–17.00',
  },
  kaynak: {
    baslik: 'Kaynaklar',
    metin: 'Bu sayfadaki bilgiler T.C. Diyanet İşleri Başkanlığının 2026 UİP Tanıtım ve Başvuru Kılavuzu (40 s.), 2026 UİP broşürleri (FR/EN/DE), T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliğinin 27 Şubat 2024 tarihli dağıtım yazısı, UDYİP 2026 duyurusu ve diyanet.be’den derlenmiştir (erişim: 3 Eylül 2026). Şartlar ve tarihler her yıl yeni kılavuzla değişebilir; bağlayıcı olan Diyanet’in güncel kılavuzudur.',
  },
};

export const uipMetin: Record<Dil, UipMetin> = { tr, fr, en };
