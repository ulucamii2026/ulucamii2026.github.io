/** Mühtedi Hizmetleri Envanteri — sayfa ve form metinleri (yalnız Türkçe, 1 Ekim 2026).
 *
 *  Form yalnız din görevlilerine yöneliktir ve yalnız Türkçedir; bu yüzden başka dil dosyası yoktur.
 *  Seçeneklerin görünen adları defterde (Apps Script `EnvanterVeri`) de aynen kullanılır: bir adı
 *  değiştirmek yeni satırlarda sütun değerini değiştirir, eski satırlara dokunmaz.
 *  Değer anahtarları: src/lib/envanter/sabitler.ts
 */
import type {
  Statu, GorevliDili, IhtidaYili, Cinsiyet, BelgeDurumu, YasGrubu, TercihDili, DurumAlani, Faaliyet,
  BelgeVar, IrtibatIstegi, AdayBSecimi,
} from '../../lib/envanter/sabitler.ts';

const statu: Record<Statu, string> = {
  baokk: 'BAOKK',
  uip: 'UİP',
  'kisa-sureli': 'Kısa süreli',
  executif: 'Exécutif',
  fahri: 'Fahri',
  emekli: 'Emekli',
  bdv: 'BDV (vakıf) personeli',
  diger: 'Diğer',
};

const gorevliDili: Record<GorevliDili, string> = {
  tr: 'Türkçe', fr: 'Fransızca', nl: 'Felemenkçe', en: 'İngilizce', de: 'Almanca', ar: 'Arapça', diger: 'Diğer',
};

const tercihDili: Record<TercihDili, string> = {
  fr: 'Fransızca', nl: 'Felemenkçe', en: 'İngilizce', de: 'Almanca', tr: 'Türkçe', ar: 'Arapça', diger: 'Diğer',
};

const ihtidaYili: Record<IhtidaYili, string> = {
  '2026': '2026', '2025': '2025', '2024': '2024', '2023': '2023', '2022': '2022', '2021-oncesi': '2021 ve öncesi',
};

const cinsiyet: Record<Cinsiyet, string> = { kadin: 'Kadın', erkek: 'Erkek' };

/** Sayılar bölümündeki belge durumu (kişi sayısı). */
const belgeSayisi: Record<BelgeDurumu, string> = {
  aldi: 'İhtida belgesini alan', almadi: 'İhtida belgesini almayan', istiyor: 'İhtida belgesi almak isteyen',
};

/** Adlı bildirim satırındaki belge durumu (tek kişi). */
const belgeKisi: Record<BelgeDurumu, string> = { aldi: 'Aldı', almadi: 'Almadı', istiyor: 'Almak istiyor' };

const yas: Record<YasGrubu, string> = {
  '18-alti': '18 yaş altı', '18-25': '18-25', '26-40': '26-40', '41-60': '41-60', '60-ustu': '60 üstü',
};

const durum: Record<DurumAlani, string> = {
  duzenliGelen: 'Camiye düzenli gelen',
  irtibatKopan: 'Camiyle irtibatı kopan',
  baskiYasayan: 'Ailevi ya da sosyal baskı yaşayan',
  egitimIsteyen: 'Eğitim almak isteyen',
  kardesAileIsteyen: 'Kardeş Aile isteyen',
  cenazeFonuBilgi: 'Cenaze fonu hakkında bilgi isteyen',
  konyaIsteyen: 'Konya programına katılmak isteyen',
};

const faaliyet: Record<Faaliyet, string> = {
  dersSohbet: 'Ders ya da sohbet',
  acikKapi: 'Açık kapı günü',
  bulusmaIftar: 'Buluşma ya da iftar',
  kadinProgrami: 'Kadınlara yönelik program',
  komite: 'Mühtedi komitesi ya da komisyonu',
};

const belgeVar: Record<BelgeVar, string> = { evet: 'Evet', hayir: 'Hayır', bilmiyorum: 'Bilmiyorum' };
const irtibat: Record<IrtibatIstegi, string> = { evet: 'Evet', hayir: 'Hayır', gorusmek: 'Görüşmek isterim' };
const adayB: Record<AdayBSecimi, string> = {
  yok: 'Hayır / bilmiyorum',
  baskasi: 'Evet, bir personel öneriyorum',
  kendim: 'Kendimi aday gösteriyorum',
};

export const envanterMetin = {
  sayfa: {
    baslik: 'Mühtedi Hizmetleri Envanteri — din görevlileri için',
    kisaBaslik: 'Mühtedi Hizmetleri Envanteri',
    aciklama: 'Belçika Mühtedi Koordinatörlüğünün din görevlilerine yönelik cami envanteri formu.',
    etiket: 'Belçika Mühtedi Koordinatörlüğü',
    altBaslik: 'Belçika’daki camilerimizde Müslüman olan (ihtida eden) kardeşlerimize verilen hizmetlerin envanteri',
  },
  giris: {
    paragraflar: [
      'Bu form, T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği bünyesindeki Belçika Mühtedi Koordinatörlüğü tarafından, kurulması planlanan Belçika Mühtedi Destek Komisyonu’nun çalışmalarına hazırlık için düzenlenmiştir.',
      'Camilerimizle irtibatı olan mühtedi kardeşlerimizin sayısını ve ihtiyaçlarını, camilerimizde yapılan çalışmaları öğrenmek; hizmetleri buna göre planlamak istiyoruz.',
    ],
    noktalar: [
      'Form yaklaşık 3 hafta açık kalır.',
      'Doldurmak yaklaşık 10 dakika sürer.',
      'Her cami için bir form doldurunuz; iki camide görev yapıyorsanız formu iki kez gönderebilirsiniz.',
      'Sayıları bilmiyorsanız boş bırakabilirsiniz. Adlı bildirim isteğe bağlıdır ve yalnız kişinin izniyle yapılır.',
    ],
    iletisim: 'Sorularınız için Rıdvan KAYAHAN’a WhatsApp’tan ulaşabilirsiniz:',
    sahip: 'Formun sahibi: Belçika Mühtedi Koordinatörlüğü (Koordinatör: Rıdvan KAYAHAN), T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği bünyesinde. Form ulucamii.be sitesinde barındırılmaktadır.',
  },
  durum: {
    yukleniyor: 'Formun durumu denetleniyor…',
    kapali: 'Form henüz açılmadı ya da kapandı. Bağlantı, Müşavirliğimizin duyurusuyla açılacaktır.',
    noscript: 'Bu form JavaScript gerektirir. Tarayıcınızda JavaScript’i açıp sayfayı yenileyiniz.',
    sonGun: 'Formun açık kalacağı son gün: {tarih}.',
  },
  adimlar: {
    baslik: 'Form bölümleri',
    ilerleme: 'Form ilerlemesi',
    adim: 'Adım {simdi} / {toplam}',
    adimlar: ['Bilgilendirme', 'Görevli ve cami', 'Sayılar', 'Adlı bildirim', 'Durum ve faaliyetler', 'Adaylar', 'Belgeler ve gönderim'],
    ipuclari: [
      'Önce bilgilendirmeyi okuyup iki kutuyu işaretleyiniz.',
      'Hangi cami için doldurduğunuzu seçiniz.',
      'Bildiğiniz sayıları yazınız; bilmediklerinizi boş bırakınız.',
      'İsteğe bağlıdır: yalnız izni olan kişileri yazınız.',
      'Sayı ve işaretler isteğe bağlıdır.',
      'Aday önerileri isteğe bağlıdır.',
      'Son kontrolü yapıp gönderiniz.',
    ],
    geri: 'Geri',
    ileri: 'Devam',
    kontrol: 'Son kontrole geç',
    tumu: 'Tüm bölümleri göster',
    adimli: 'Adım adım göster',
  },
  bilgi: {
    baslik: '1. Bilgilendirme ve onay',
    maddeler: [
      { baslik: 'Amaç', metin: 'Camilerimizle irtibatı olan mühtedilerin sayısını, ihtiyaçlarını ve camilerimizdeki çalışmaları öğrenmek; Belçika Mühtedi Destek Komisyonu’nun çalışmalarını ve mühtedilere verilecek hizmetleri buna göre planlamak.' },
      { baslik: 'Kim görür', metin: 'Formdaki bilgileri yalnız Belçika Mühtedi Koordinatörü görür. Komisyona ve Müşavirliğe yalnız toplam sayılar sunulur; kişi listesi paylaşılmaz.' },
      { baslik: 'Saklama', metin: 'Adı yazılan kişilere ait bilgiler, form kapandıktan sonra en geç 30 gün içinde çevrim içi ortamdan indirilip silinir. Görevli bilgileri ve sayılar çevrim içi tabloda en çok 6 ay tutulur.' },
      { baslik: 'Haklar', metin: 'Adı yazılan kişi, bilgilerine erişme, bunların düzeltilmesini ve silinmesini isteme hakkına sahiptir. Koordinatör ilk temasta kişiyi bilgilendirir ve iznini teyit eder; izin teyit edilmezse kayıt silinir.' },
    ],
    veriSorumlusu: 'Veri sorumlusu',
    gizlilikBaglanti: 'Gizlilik bildiriminin ilgili bölümü',
    onayBilgi: 'Bilgilendirmeyi okudum.',
    onayIzin: 'Adını yazdığım her kişinin iznini aldım; izni olmayan kişiyi yazmayacağım.',
    onayHata: 'Devam etmek için bu kutuyu işaretleyiniz.',
  },
  gorevli: {
    baslik: '2. Görevli ve cami',
    ad: 'Adınız soyadınız',
    bolge: 'Bölge',
    cami: 'Cami',
    camiOnce: 'Önce bölgeyi seçiniz',
    camiListedeYok: 'Listede yok',
    camiSerbest: 'Caminin adı ve şehri',
    camiYardim: 'Bu form yalnız seçtiğiniz cami içindir. Başka camide de görevliyseniz o cami için ayrıca gönderiniz.',
    statu: 'Statünüz',
    statuAciklama: 'Statünüzü kısaca yazınız',
    telefon: 'Telefon',
    eposta: 'E-posta',
    iletisimYardim: 'Telefon ya da e-postadan en az birini yazınız.',
    diller: 'Konuştuğunuz diller',
    digerDil: 'Diğer dil',
  },
  sayilar: {
    baslik: '3. Sayılar',
    not: 'Caminizle irtibatı olan mühtedilerin sayıları. Bütün alanlar isteğe bağlıdır; bilmediğinizi boş bırakınız. Aynı kişi her tabloda bir kez sayılır.',
    ihtidaBaslik: 'İhtida yılına ve cinsiyete göre',
    yil: 'İhtida yılı',
    belgeBaslik: 'İhtida belgesi durumu',
    yasBaslik: 'Yaş grubu',
    dilBaslik: 'Tercih ettiği dil',
  },
  kisiler: {
    baslik: '4. Adlı bildirim (isteğe bağlı)',
    not: 'Koordinatörün tanışıp destek olabilmesi için mühtedi kardeşlerimizi adıyla bildirebilirsiniz. Yalnız kişinin izniyle yazınız. Adres, kimlik numarası ve fotoğraf istemiyoruz.',
    gizliNotGenel: 'Ailevi baskı riski olan kişiyi adıyla değil, bir kod ya da takma adla yazınız.',
    satir: 'Kişi {n}',
    ekle: 'Kişi ekle',
    kaldir: 'Bu satırı kaldır',
    bos: 'Henüz kimse eklenmedi.',
    azami: 'En çok {azami} kişi yazabilirsiniz.',
    sayac: '{n} / {azami} kişi',
    gizli: 'Ailevi baskı riski — gizli/kodlu kayıt',
    gizliNot: 'Bu kişiye yalnız sizin aracılığınızla ulaşılır. Ad, telefon ve e-posta gönderilmez.',
    kod: 'Kod ya da takma ad',
    ad: 'Ad soyad',
    cinsiyet: 'Cinsiyet',
    dogumYili: 'Doğum yılı',
    telefon: 'Telefon',
    eposta: 'E-posta',
    dil: 'Tercih ettiği dil',
    ihtidaYili: 'İhtida yılı',
    belge: 'İhtida belgesi',
    izin: 'Bu kişinin izniyle yazıyorum.',
    izinHata: 'İzni olmayan kişi yazılamaz. İzin yoksa bu satırı kaldırınız.',
    iletisimHata: 'Telefon ya da e-postadan en az birini yazınız.',
    dogumYiliHata: '1900 ile {yil} arasında bir yıl yazınız.',
    eklendi: 'Kişi {n} eklendi.',
    kaldirildi: 'Satır kaldırıldı.',
  },
  durumBolum: {
    baslik: '5. Durum ve ihtiyaç',
    not: 'Kişi sayısı olarak yazınız; bilmediğinizi boş bırakınız.',
  },
  faaliyet: {
    baslik: '6. Camide yapılanlar',
    soru: 'Caminizde mühtedilere yönelik yapılan çalışmalar',
    materyal: 'Kullandığınız materyaller ve dile göre materyal ihtiyacınız',
  },
  gonullu: {
    baslik: '7. Gönüllüler',
    gonulluSayisi: 'Mühtedilerle ilgilenen gönüllü sayısı',
    kadin: 'Kadın',
    erkek: 'Erkek',
    kardesAile: 'Kardeş Aile olabilecek aile sayısı',
  },
  aday: {
    baslik: '8. Adaylar',
    aSoru: 'Belçika genelinde Müslüman olanlarla ilgilenmeyi görev edinmiş, Diyanet’e ve camilerimize bağlı, kurumumuzda çalışmaya uygun bir Belçikalı Müslüman tanıyor musunuz?',
    aAd: 'Ad soyad',
    aTelefon: 'Telefon',
    aEposta: 'E-posta',
    aNeden: 'Neden uygun?',
    aIzin: 'Bu kişinin izniyle yazıyorum.',
    bSoru: 'Bölgenizde bölge ihtida sorumlusu olabilecek bir BDV (vakıf) personeli var mı?',
    bNot: 'Bölge din hizmetleri koordinatörü bu görev için aday gösterilemez.',
    bAd: 'Personelin adı soyadı',
    bCami: 'Görev yaptığı cami',
    cSoru: 'Bölgenizden bir cami mühtedi dostu pilot cami olarak seçilse hangisi olabilir? Neden?',
    cCami: 'Cami',
    cSecme: 'Öneride bulunmuyorum',
    cGerekce: 'Neden bu cami?',
    dSoru: 'Caminizin mühtedi irtibat kişisi olmak ister misiniz?',
  },
  belge: {
    baslik: '9. Belgeler',
    soru: 'Caminizde daha önce verilmiş ihtida belgesi nüshası ya da ihtida kayıt defteri var mı?',
    adet: 'Yaklaşık kaç adet?',
    iletim: 'Koordinatörlüğe güvenli bir yoldan iletilebilir mi?',
    not: 'Forma dosya yüklemeyiniz; Koordinatör sizinle iletişime geçecektir.',
  },
  gorus: {
    baslik: '10. Görüş ve öneri',
    alan: 'Mühtedilere yönelik hizmetlerle ilgili görüş ve önerileriniz',
  },
  ozet: {
    baslik: 'Son kontrol',
    aciklama: 'Göndermeden önce aşağıdaki bilgileri kontrol ediniz.',
    gorevli: 'Görevli',
    cami: 'Cami',
    toplam: 'İhtida yılına göre yazılan toplam',
    kisi: 'Adlı bildirim',
    kisiSayisi: '{n} kişi',
    aday: 'Komisyon adayı',
    gonder: 'Envanteri gönder',
    sonNot: 'Gönderdikten sonra bir düzeltme gerekirse Koordinatöre WhatsApp’tan yazabilirsiniz.',
    taslakNot: 'Yazdıklarınız bu cihazda taslak olarak saklanır; adlı bildirimler, aday bilgileri ve onay kutuları taslağa yazılmaz.',
  },
  sayi: {
    hata: '{asgari} ile {azami} arasında bir tam sayı yazınız.',
  },
  hata: {
    zamanAsimi: 'Sunucu yanıt vermedi. Tekrar deneyiniz; aynı form iki kez kaydedilmez.',
    sunucu: 'Sunucu formu kabul etmedi (kod: {kod}). Bir süre sonra tekrar deneyiniz ya da Koordinatöre WhatsApp’tan yazınız.',
    isleniyor: 'Formunuz işleniyor. Sonucu görmek için sayfayı açık tutup biraz sonra tekrar deneyiniz.',
    iletisimEnAz: 'Telefon ya da e-postadan en az birini yazınız.',
    // Sayfada örnek numara bile basılmaz (yalnız WhatsApp bağlantısı): ortak metindeki örnekler burada yok.
    telefon: 'Geçerli bir telefon numarası yazınız (Belçika numarası ya da ülke koduyla).',
  },
  sunucu: {
    kapali: 'Form şu anda kapalı. Bilgileriniz gönderilmedi.',
    onayEksik: 'Bilgilendirme ve izin kutuları işaretlenmeden form gönderilemez.',
    surumGecersiz: 'Form güncellendi. Sayfayı yenileyip tekrar deneyiniz; yazdıklarınız bu cihazda saklıdır.',
    gorevliEksik: 'Görevli ve cami bölümünde eksik ya da hatalı bilgi var.',
    camiGecersiz: 'Seçilen cami bölgeyle uyuşmuyor. Bölgeyi ve camiyi yeniden seçiniz.',
    kisiSayisi: 'En çok 40 kişi yazılabilir.',
    kisiIzin: 'Adlı bildirimdeki her satır için kişinin izni işaretlenmelidir.',
    kisiGecersiz: 'Adlı bildirimde eksik ya da hatalı bir satır var.',
    sayiGecersiz: 'Sayılardan biri geçersiz (0 ile 999 arasında tam sayı olmalı).',
    adayGecersiz: 'Aday bölümünde eksik ya da hatalı bilgi var.',
    adayIzin: 'Önerdiğiniz komisyon adayı için «Bu kişinin izniyle yazıyorum» kutusu işaretlenmelidir.',
    alanGecersiz: 'Formda geçersiz bir seçim var. Sayfayı yenileyip tekrar deneyiniz.',
    cokSik: 'Kısa sürede çok sayıda form gönderildi. Birkaç dakika sonra tekrar deneyiniz; yazdıklarınız bu cihazda saklıdır.',
    gunlukSinir: 'Bugün çok sayıda form gönderildi. Yarın tekrar deneyiniz ya da Koordinatöre WhatsApp’tan yazınız.',
    cokBuyuk: 'Form çok uzun. Uzun metinleri kısaltıp tekrar deneyiniz.',
  },
  basari: {
    baslik: 'Teşekkür ederiz',
    metin: 'Envanter formunuz alındı. Koordinatör, gerekli gördüğü durumlarda sizinle iletişime geçecektir.',
    referans: 'Gönderim numaranız',
    ihtidaNot: 'Belgesi olmayan kardeşlerimiz sitemizdeki çevrim içi ihtida başvurusunu doldurabilir:',
    ihtidaBaglanti: 'Çevrim içi ihtida başvurusu',
    yeniForm: 'Başka bir cami için yeni form doldur',
  },
  secenek: {
    statu, gorevliDili, tercihDili, ihtidaYili, cinsiyet, belgeSayisi, belgeKisi, yas, durum, faaliyet, belgeVar, irtibat, adayB,
    evetHayir: { evet: 'Evet', hayir: 'Hayır' },
    secin: 'Seçiniz',
  },
} as const;

export type EnvanterMetinleri = typeof envanterMetin;
