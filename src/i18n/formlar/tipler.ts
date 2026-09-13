/** Kayıt ve ihtida formlarının metin şeması — üç dil aynı anahtarları taşır (tr.ts / fr.ts / en.ts).
    30 Ağustos 2026: formlar kimlik numarası, kimlik kopyası, görsel veya imza toplamıyordu.
    8 EYLÜL 2026 — Rıdvan'ın kararıyla İHTİDA formu için bu geri alındı: vesikalık, kimlik belgesinin
    ön/arka yüzü ve çizilen imza formda alınır (EK-9 ve Müşavirlik dosyası için). KAYIT formu (çocuk
    kaydı) 13 Eylül 2026 v3'te açık rızayla kimlik ön/arka görseli alır; numara, OCR ve imza kanvası yoktur. */

export interface OrtakMetinler {
  zorunluIsaret: string;           // "zorunlu alan" — yıldızın erişilebilir adı
  istegeBagli: string;
  gonder: string;
  gonderiliyor: string;
  anasayfa: string;
  taslakGeriYuklendi: string;
  taslakSil: string;
  taslakSilindi: string;
  ozetBaslik: string;
  ozetAciklama: string;
  ozetDuzenle: string;
  bosDeger: string;                // özet listesinde boş bırakılan alan
  evet: string;
  hayir: string;
  seciniz: string;
  hata: {
    zorunlu: string;
    eposta: string;
    telefon: string;
    tarih: string;
    yas: string;                   // {min} {max} yer tutucuları
    uzun: string;                  // {max}
    imzaEslesmiyor: string;
    kurallarKaydir: string;
    formHatali: string;            // gönderim öncesi genel uyarı
    cevrimdisi: string;
    ag: string;
    sunucu: string;                // {kod}
    zamanAsimi: string;
    servisHazirDegil: string;
  };
  basari: {
    baslik: string;
    referans: string;
    epostaGitti: string;           // {eposta}
    spamNotu: string;
    iletisim: string;              // {eposta} {telefon}
  };
  gizlilikKutu: {
    baslik: string;
    metin: string;                 // kısa bildirim (tam sayfa bağlantısı ayrı)
    baglanti: string;
    gizlilikOkudum: string;
    gizlilikSayfa: string;
  };
}

export interface KayitV3Metinler {
  ray: string;
  bolum: string;
  yari: string;
  son: string;
  yas: string;
  okuma: string;
  okundu: string;
  eksikler: string;
  tamam: string;
  kopyala: string;
  kopyalandi: string;
  kopyaHata: string;
  adimlar: string;
  giris: string;
  taslakNot: string;
  temizle: string;
  guvence: string;
  kaydedilemedi: string;
  gonderiliyor: string;
  epostaGitmedi: string;
  dilNot: string;
  kimlik: string;
  amac: string;
  kabul: string;
  on: string;
  arka: string;
  sec: string;
  degistir: string;
  kaldir: string;
  yanimda: string;
  simdi: string;
  sonra: string;
  sonraSec: string;
  eposta: string;
  whatsapp: string;
  elden: string;
  riza: string;
  yenile: string;
  ozetOn: string;
  ozetIki: string;
  ozetEposta: string;
  ozetWhatsapp: string;
  ozetElden: string;
  alindi: string;
  epostaAdim: string;
  epostaDugme: string;
  whatsappDugme: string;
  eldenAdim: string;
  sonradan: string;
  konu: string;
  whatsappMetin: string;
  gizlilik: string;
  cipler: { ogrenci: string; okul: string; veli: string; acil: string; saglik: string; kurallar: string; kimlik: string; ozet: string };
}

export interface KayitMetinler {
  v3: KayitV3Metinler;
  sayfaBaslik: string;
  sayfaAciklama: string;           // meta description
  ustEtiket: string;
  giris: string;                   // formun üstündeki kısa açıklama
  sureNotu: string;                // "yaklaşık 5 dakika"
  bolum: {
    ogrenci: string; okul: string; veli: string; acil: string; saglik: string; kurallar: string; ozet: string;
  };
  ogrenci: {
    ad: string; soyad: string; cinsiyet: string; kiz: string; erkek: string; dogumTarihi: string; dogumTarihiYardim: string;
  };
  okul: {
    okul: string; okulYardim: string; grupMarche: string; grupCevre: string; diger: string; okulDiger: string;
    sinif: string; sinifYardim: string; onceOkul: string;
    kursDurumu: string; yeni: string; devam: string;
  };
  veli: {
    yakinlik: string; anne: string; baba: string; vasi: string; adSoyad: string; cep: string; cepYardim: string;
    eposta: string; epostaYardim: string; adres: string; adresYardim: string; postaKodu: string; sehir: string;
    iletisimDili: string; dilTr: string; dilFr: string;
  };
  acil: { aciklama: string; adSoyad: string; cep: string };
  saglik: {
    aciklama: string; altSaglik: string; altGoruntu: string;
    soru: string; not: string; notYardim: string; riza: string; goruntuSoru: string; goruntuSosyalSoru: string; goruntuAciklama: string;
  };
  kurallar: {
    baslik: string; aciklama: string; kaydirNotu: string; kutu: string;
    imzaEtiket: string; imzaYardim: string;
    ogrenciBaslik: string; ogrenci: string[]; veliBaslik: string; veli: string[]; kitapNotu: string;
  };
  ozet: {
    ogrenci: string; okul: string; sinif: string; veli: string; iletisim: string; acil: string; saglik: string; goruntu: string; goruntuSosyal: string;
  };
  basari: { kardes: string; kardesAciklama: string; sonrakiAdimlar: string };
}

export interface IhtidaMetinler {
  sayfaBaslik: string;
  sayfaAciklama: string;
  ustEtiket: string;
  giris: string;
  paketBildirimi: string;
  kimlikNotu: string;              // 8 Eyl 2026: formda hangi belgelerin istendiğini ve nerede saklanacağını anlatır
  bolum: { kisi: string; durum: string; iletisim: string; ihtida: string; belgeler: string; riza: string; ozet: string };
  kisi: {
    adSoyad: string; adSoyadYardim: string; cinsiyet: string; kadin: string; erkek: string;
    dogumTarihi: string; dogumYeri: string; dogumYeriYardim: string; uyruk: string; anneAdi: string; babaAdi: string;
  };
  durum: {
    medeniHali: string; bekar: string; evli: string; dul: string; bosanmis: string;
    ogrenim: string; ogrenimYardim: string; meslek: string;
  };
  iletisim: { eposta: string; telefon: string; adres: string; adresYardim: string; postaKodu: string; sehir: string; ulke: string };
  teslimat: { baslik: string; aciklama: string; cami: string; adres: string; adresNotu: string };
  ihtida: {
    oncekiDin: string; oncekiDinYardim: string; sebep: string; sebepYardim: string; yeniIsim: string; yeniIsimYardim: string;
    torenDili: string; dilTr: string; dilFr: string; dilEn: string; dilAr: string;
    torenTarihi: string; torenTarihiYardim: string;
    sahitler: string; sahitlerYardim: string; sahitEkle: string; sahitCami: string; sahit1: string; sahit2: string;
    nasilHaberdar: string; ekNot: string; ekNotYardim: string;
  };
  /** 8 Eylül 2026'da eklendi: EK-9 ve resmî dosya için istenen görseller. */
  belgeler: {
    aciklama: string;
    belgeTuru: string; kimlikKarti: string; pasaport: string;
    vesikalik: string; vesikalikYardim: string;
    kimlikOn: string; kimlikOnYardim: string;
    kimlikArka: string; kimlikArkaYardim: string;
    sec: string; degistir: string; kaldir: string; onizleme: string;
    isleniyor: string; hazir: string;              // {boyut}
    imza: string; imzaYardim: string; imzaTemizle: string;
    imzaYok: string; imzaYokYardim: string;
    hataTur: string; hataBoyut: string; hataOkunamadi: string; hataImza: string; hataEksik: string;
  };
  riza: {
    acikRiza: string; ek10: string; ek10Baglanti: string; gizlilik: string; fotoIzni: string; fotoAciklama: string;
    gorselRiza: string; gorselRizaYardim: string;
    beyanBaslik: string; beyanMetin: string; beyanEtiket: string; beyanYardim: string;
  };
  ozet: { kisi: string; dogum: string; uyruk: string; aile: string; durum: string; iletisim: string; din: string; toren: string; sahitler: string; belgeler: string };
  basari: { sonrakiAdimlar: string };
}

export interface FormMetinleri { ortak: OrtakMetinler; kayit: KayitMetinler; ihtida: IhtidaMetinler }
