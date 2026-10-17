/** Ekim 2026 formlarının alan yerleşimi (pt, SOL ÜST köşeden; alanın alt kenarı yazı/imza çizgisidir).
 *
 * Kaynak: Mühtedi Koordinatörlüğünün form klasörlerindeki yerlesim.json dosyaları
 * (02_Formlar_ve_Resmi_Belgeler\EK-10 Açık Rıza Metni (2026-10)\ ve …\İhtida Belgesi Talep Dilekçesi (2026-10)\).
 * Şablonlar sitede public/belgeler/ihtida/ altındadır; form yeniden üretilirse şablon VE bu dosya birlikte güncellenir
 * (tests/ihtida-belge-2026-10.test.mjs şablondaki çizgilerin bu kutularla örtüştüğünü denetler).
 */
export const EK10_2026_10 = {
  surum: '2026-10',
  sablon: '/belgeler/ihtida/ek10-acik-riza-metni-2026-10.pdf',
  sayfalar: [
    { diller: ['tr', 'en'], alanlar: { tarih: [53.82, 759.42, 155.87, 793.43], ad: [175.71, 759.42, 348.11, 793.43], imza: [367.95, 759.42, 543.69, 793.43] } },
    { diller: ['fr', 'nl'], alanlar: { tarih: [53.82, 759.42, 155.87, 793.43], ad: [175.71, 759.42, 348.11, 793.43], imza: [367.95, 759.42, 543.69, 793.43] } },
  ],
};

export const DILEKCE_2026_10 = {
  surum: '2026-10',
  sablon: '/belgeler/ihtida/ihtida-talep-dilekcesi-2026-10.pdf',
  sayfalar: [
    {
      diller: ['tr', 'en'],
      alanlar: {
        ad: [39.68, 178.21, 280.63, 199.43], dogum_tarihi: [297.63, 178.21, 418.1, 199.43], dogum_yeri: [435.11, 178.21, 555.59, 199.43],
        adres: [39.68, 215.21, 555.59, 236.44], eposta: [39.68, 252.22, 289.13, 273.45], telefon: [306.13, 252.22, 555.59, 273.45],
        cami: [39.68, 321.11, 372.28, 342.33], ihtida_tarihi: [389.29, 321.11, 555.59, 342.33], cami_adresi: [39.68, 358.11, 555.59, 379.34],
        donus_cami: [39.68, 607.15, 205.98, 628.37], donus_adres: [222.98, 607.15, 555.59, 628.37],
        yer_tarih: [53.82, 759.42, 218.23, 793.43], imza_ad: [235.23, 759.42, 362.29, 793.43], imza: [379.29, 759.42, 543.69, 793.43],
      },
    },
    {
      diller: ['fr', 'nl'],
      alanlar: {
        ad: [39.68, 187.2, 280.63, 208.42], dogum_tarihi: [297.63, 187.2, 418.1, 208.42], dogum_yeri: [435.11, 187.2, 555.59, 208.42],
        adres: [39.68, 224.2, 555.59, 245.43], eposta: [39.68, 261.21, 289.13, 282.43], telefon: [306.13, 261.21, 555.59, 282.43],
        cami: [39.68, 330.09, 372.28, 351.32], ihtida_tarihi: [389.29, 330.09, 555.59, 351.32], cami_adresi: [39.68, 367.1, 555.59, 388.32],
        donus_cami: [39.68, 607.15, 205.98, 628.37], donus_adres: [222.98, 607.15, 555.59, 628.37],
        yer_tarih: [53.82, 759.42, 218.23, 793.43], imza_ad: [235.23, 759.42, 362.29, 793.43], imza: [379.29, 759.42, 543.69, 793.43],
      },
    },
  ],
};
