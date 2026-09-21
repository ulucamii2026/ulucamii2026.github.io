/** Seviye testi — profil alanlarının izinli değerleri ve hoca raporu için Türkçe etiketleri.
 *
 *  Sunucu (paket `SeviyeTesti`) gelen gövdeyi bu listelere göre doğrular; arayüz seçenekleri
 *  `src/i18n/seviye-testi.ts` içindedir ve `deger` alanları bu listelerle birebir aynı olmalıdır
 *  (tests/seviye-banka.test.mjs denetler). Hoca raporu her zaman Türkçedir.
 */
export const PROFIL_DEGERLERI = {
  yasAraligi: ['18-25', '26-40', '41-60', '60+', 'belirtmedi'],
  cinsiyet: ['kadin', 'erkek', 'belirtmedi'],
  muslumanlik: ['henuz', '0-1', '1-5', '5+', 'dogustan'],
  oncekiEgitim: ['hic', 'kendi', 'aile', 'kurs', 'okul'],
  hedefler: ['namaz', 'kuranOkuma', 'tecvid', 'inanc', 'gunluk', 'ezber', 'cocuk'],
  /** DERS dili: katılımcının dersi almak istediği dil. 21 Eyl 2026 (form sürümü 2): teste Avrupa'nın her yerinden katılınıyor ve
   *  eğitim katılımcıya en yakın yerde planlanabiliyor → Flemenkçe ve Almanca da seçilebilir (din görevlimiz bu dillerde ders vermez;
   *  seçim, yerel görevliye yönlendirme için bilgidir). Etiketler { is a shell keyword. */
  dersDili: ['tr', 'fr', 'en', 'nl', 'de'],
  gunler: ['pzt', 'sal', 'car', 'per', 'cum', 'cmt', 'paz'],
  dilim: ['sabah', 'ogleden-sonra', 'aksam'],
  bicim: ['yuzyuze', 'cevrimici', 'farketmez'],
} as const;

export type ProfilAlani = keyof typeof PROFIL_DEGERLERI;
/** Tek seçimli (zorunlu) ve çok seçimli (isteğe bağlı) alanlar. */
export const PROFIL_TEKLI: ProfilAlani[] = ['yasAraligi', 'cinsiyet', 'muslumanlik', 'oncekiEgitim', 'dersDili', 'bicim'];
export const PROFIL_COKLU: ProfilAlani[] = ['hedefler', 'gunler', 'dilim'];

export const PROFIL_SINIRLARI = { adSoyad: 120, eposta: 160, telefon: 20, not: 500 } as const;

export const PROFIL_ETIKETLERI_TR: Record<ProfilAlani, { ad: string; degerler: Record<string, string> }> = {
  yasAraligi: { ad: 'Yaş aralığı', degerler: { '18-25': '18–25', '26-40': '26–40', '41-60': '41–60', '60+': '60 ve üzeri', belirtmedi: 'Belirtmedi' } },
  cinsiyet: { ad: 'Cinsiyet', degerler: { kadin: 'Kadın', erkek: 'Erkek', belirtmedi: 'Belirtmedi' } },
  muslumanlik: {
    ad: 'İslâm’la geçmişi',
    degerler: { henuz: 'Henüz Müslüman değil, İslâm’ı tanımak istiyor', '0-1': 'Bir yıldan kısa süredir Müslüman', '1-5': '1–5 yıldır Müslüman', '5+': '5 yıldan uzun süredir Müslüman (sonradan)', dogustan: 'Müslüman ailede doğmuş' },
  },
  oncekiEgitim: {
    ad: 'Önceki dinî eğitim',
    degerler: { hic: 'Hiç almamış', kendi: 'Kendi kendine (kitap, internet, uygulama)', aile: 'Aile ya da arkadaş çevresinden', kurs: 'Cami ya da kursta', okul: 'Okul ya da üniversitede' },
  },
  hedefler: {
    ad: 'Beklentileri',
    degerler: { namaz: 'Namaz kılmayı öğrenmek', kuranOkuma: 'Kur’an okumayı öğrenmek', tecvid: 'Kur’an’ı daha güzel okumak (tecvid)', inanc: 'İnancını anlamak ve derinleştirmek', gunluk: 'Günlük hayatta helal–haram', ezber: 'Sûre ve dua ezberlemek', cocuk: 'Çocuklarına öğretebilmek' },
  },
  dersDili: { ad: 'Ders dili tercihi', degerler: { tr: 'Türkçe', fr: 'Fransızca', en: 'İngilizce', nl: 'Flemenkçe', de: 'Almanca' } },
  gunler: { ad: 'Uygun günler', degerler: { pzt: 'Pazartesi', sal: 'Salı', car: 'Çarşamba', per: 'Perşembe', cum: 'Cuma', cmt: 'Cumartesi', paz: 'Pazar' } },
  dilim: { ad: 'Uygun saatler', degerler: { sabah: 'Sabah', 'ogleden-sonra': 'Öğleden sonra', aksam: 'Akşam' } },
  bicim: { ad: 'Ders biçimi', degerler: { yuzyuze: 'Camide yüz yüze', cevrimici: 'Çevrim içi', farketmez: 'Fark etmez' } },
};

/** Hoca raporunda kullanılan Türkçe kısa adlar. */
export const OKUMA_DUZEYLERI_TR = [
  'K0 — Harfleri henüz bilmiyor',
  'K1 — Harfleri tanıyor',
  'K2 — Harfleri kelime içinde tanıyor',
  'K3 — Harekeli heceleri okuyor',
  'K4 — Cezm, şedde, tenvin ve medleri okuyor',
  'K5 — Kelime ve âyet okuyor',
] as const;
export const EZBER_DURUMLARI_TR = ['Bilmiyor', 'Bakarak okuyor', 'Ezbere biliyor'] as const;
