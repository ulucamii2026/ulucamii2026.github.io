/** Kayıt ve ihtida formlarının metin şeması — üç dil aynı anahtarları taşır (tr.ts / fr.ts / en.ts).
    30 Ağustos 2026 yeniden yazımı: formlar kimlik numarası, kimlik kopyası, görsel veya imza
    toplamaz; metinler de bunu yansıtır. */

export interface OrtakMetinler {
  zorunluIsaret: string;           // "zorunlu alan" — yıldızın erişilebilir adı
  istegeBagli: string;
  gonder: string;
  gonderiliyor: string;
  tekrarDene: string;
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

export interface KayitMetinler {
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
    soru: string; not: string; notYardim: string; riza: string; goruntuSoru: string; goruntuAciklama: string;
  };
  kurallar: {
    baslik: string; aciklama: string; kaydirNotu: string; kutu: string;
    imzaEtiket: string; imzaYardim: string;
    ogrenciBaslik: string; ogrenci: string[]; veliBaslik: string; veli: string[]; kitapNotu: string;
  };
  ozet: {
    ogrenci: string; okul: string; sinif: string; veli: string; iletisim: string; acil: string; saglik: string; goruntu: string;
  };
  basari: { kardes: string; kardesAciklama: string; sonrakiAdimlar: string };
}

export interface IhtidaMetinler {
  sayfaBaslik: string;
  sayfaAciklama: string;
  ustEtiket: string;
  giris: string;
  kimlikNotu: string;              // "kimlik belgesi törende yalnız gösterilir; kopyası alınmaz"
  bolum: { kisi: string; durum: string; iletisim: string; ihtida: string; riza: string; ozet: string };
  kisi: {
    adSoyad: string; adSoyadYardim: string; cinsiyet: string; kadin: string; erkek: string;
    dogumTarihi: string; dogumYeri: string; dogumYeriYardim: string; uyruk: string; anneAdi: string; babaAdi: string;
  };
  durum: {
    medeniHali: string; bekar: string; evli: string; dul: string; bosanmis: string;
    ogrenim: string; ogrenimYardim: string; meslek: string;
  };
  iletisim: { eposta: string; telefon: string; adres: string; adresYardim: string };
  ihtida: {
    oncekiDin: string; oncekiDinYardim: string; sebep: string; sebepYardim: string; yeniIsim: string; yeniIsimYardim: string;
    torenDili: string; dilTr: string; dilFr: string; dilEn: string; dilAr: string;
    torenTarihi: string; torenTarihiYardim: string;
    sahitler: string; sahitlerYardim: string; sahit1: string; sahit2: string;
    nasilHaberdar: string; ekNot: string;
  };
  riza: {
    acikRiza: string; ek10: string; ek10Baglanti: string; gizlilik: string; fotoIzni: string; fotoAciklama: string;
    beyanBaslik: string; beyanMetin: string; beyanEtiket: string; beyanYardim: string;
  };
  ozet: { kisi: string; dogum: string; uyruk: string; aile: string; durum: string; iletisim: string; din: string; toren: string; sahitler: string };
  basari: { sonrakiAdimlar: string };
}

export interface FormMetinleri { ortak: OrtakMetinler; kayit: KayitMetinler; ihtida: IhtidaMetinler }
