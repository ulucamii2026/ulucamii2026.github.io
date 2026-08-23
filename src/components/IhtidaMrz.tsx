/** İhtida Başvuru Formu — MRZ (Machine Readable Zone) ayrıştırıcı.
 *  Saf mantık dosyası (JSX yok); "Ihtida*" dosya adı kuralına uymak için .tsx uzantılı.
 *
 *  Kur'an kursu kayıt sistemindeki assets/kimlik.js'in 2. bölümünden (ICAO 9303 MRZ
 *  çözümlemesi) TypeScript'e taşınmış ve genişletilmiştir:
 *   - TD1 (3×30 — Belçika eID, Türk kimlik kartı, oturum kartı) — kaynak mantık aynen
 *   - TD3 (2×44 — pasaport) — kaynak mantık aynen
 *   - TD2 (2×36 — bazı oturum kartları/vizeler) — bu dosyada YENİ eklendi
 *   - geçerlilik (son kullanma) tarihi çıkarımı — bu dosyada YENİ eklendi
 *   - T.C. Kimlik No / Belçika Rijksregister No ayrımı, opsiyonel veri alanından
 *     iki farklı kontrol algoritmasıyla sınanır — bu dosyada YENİ eklendi
 *   - 3 harfli uyruk kodunun (ISO 3166-1 alpha-3) Türkçe görünen ada çevrilmesi — YENİ
 *
 *  Yalnızca ICAO kontrol haneleri (mod 7-3-1 ağırlıklı) doğrulanan alanlar döner;
 *  doğrulanamayan bir belge için tüm fonksiyon null döner — yanlış veriyle formu
 *  doldurmaktansa hiç doldurmamak yeğlenir. */

export type MrzBicim = 'TD1' | 'TD2' | 'TD3';
export type MrzCinsiyet = 'erkek' | 'kadin' | '';

export interface MrzSonuc {
  bicim: MrzBicim;
  soyad: string;
  adlar: string;
  dogumTarihi: string;        // YYYY-MM-DD
  gecerlilikTarihi: string;   // YYYY-MM-DD veya ''
  cinsiyet: MrzCinsiyet;
  uyrukKodu: string;          // ISO 3166-1 alpha-3, ör. "TUR"
  uyrukAdi: string;           // Türkçe görünen ad, eşleşme yoksa uyrukKodu
  belgeNo: string;            // belge numarası (kontrol hanesi geçtiyse doldurulur)
  tcKimlikNo: string;         // opsiyonel veri T.C. algoritmasını geçerse
  rijksregisterNo: string;    // opsiyonel veri Belçika algoritmasını geçerse (biçimlendirilmiş)
}

const AGIRLIK = [7, 3, 1];
const HARF_RAKAM: Record<string, string> = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', B: '8', G: '6' };

/** ICAO 9303 kontrol hanesi (mod 7-3-1 ağırlıklı toplam mod 10). */
export function kontrolHanesi(metin: string): string {
  let toplam = 0;
  for (let i = 0; i < metin.length; i += 1) {
    const c = metin.charAt(i);
    let d: number;
    if (c === '<') d = 0;
    else if (c >= '0' && c <= '9') d = c.charCodeAt(0) - 48;
    else if (c >= 'A' && c <= 'Z') d = c.charCodeAt(0) - 55;
    else return '';
    toplam += d * AGIRLIK[i % 3];
  }
  return String(toplam % 10);
}

/** Sayısal olması gereken alanlarda tipik OCR karışmalarını düzeltir (O→0, I→1 vb.). */
function sayisallastir(metin: string): string {
  let sonuc = '';
  for (let i = 0; i < metin.length; i += 1) {
    const c = metin.charAt(i);
    sonuc += (c >= '0' && c <= '9') || c === '<' ? c : (HARF_RAKAM[c] || c);
  }
  return sonuc;
}

const RAKAM_HARF: Record<string, string> = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 8: 'B', 6: 'G' };

/** Yalnızca harf olabilecek alanlarda (ad/soyad satırı, uyruk kodu) tersi OCR
 *  karışmasını düzeltir (0→O, 1→I vb.) — bu alanlarda ICAO'ya göre rakam ASLA
 *  geçerli değildir, dolayısıyla görülen her rakam bir OCR hatasıdır. Gerçek OCR
 *  testinde ("ITA" → "1TA") bu düzeltme gerekli olduğu görüldü. */
function alfabetiklestir(metin: string): string {
  let sonuc = '';
  for (let i = 0; i < metin.length; i += 1) {
    const c = metin.charAt(i);
    sonuc += (c >= 'A' && c <= 'Z') || c === '<' ? c : (RAKAM_HARF[c] || c);
  }
  return sonuc;
}

function mrzSatirlari(metin: string): string[] {
  return String(metin || '')
    .toUpperCase()
    .split(/\r?\n/)
    .map((s) => s.replace(/[^A-Z0-9<]/g, ''))
    .filter((s) => s.length >= 26);
}

/** YYMMDD → YYYY-MM-DD. Yüzyıl, geleceğe düşmeyecek şekilde seçilir. */
function tarihCevir(yymmdd: string): string {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const ay = Number(yymmdd.slice(2, 4));
  const gun = Number(yymmdd.slice(4, 6));
  if (ay < 1 || ay > 12 || gun < 1 || gun > 31) return '';
  const buYil = new Date().getFullYear();
  let yil = 2000 + yy;
  if (yil > buYil) yil = 1900 + yy;
  const iki = (n: number) => (n < 10 ? '0' : '') + n;
  return `${yil}-${iki(ay)}-${iki(gun)}`;
}

/** Geçerlilik (son kullanma) tarihi için: MRZ'de yüzyıl belirsizdir, ama belge
 *  numaralarının süresi doğum tarihinin aksine SIRAT olarak geleceğe düşer;
 *  bu yüzden burada "geçmişe düşürme" kuralı UYGULANMAZ, ham 20YY kabul edilir. */
function gecerlilikCevir(yymmdd: string): string {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const ay = Number(yymmdd.slice(2, 4));
  const gun = Number(yymmdd.slice(4, 6));
  if (ay < 1 || ay > 12 || gun < 1 || gun > 31) return '';
  const iki = (n: number) => (n < 10 ? '0' : '') + n;
  return `${2000 + yy}-${iki(ay)}-${iki(gun)}`;
}

/** Belçika rijksregisternummer: 11 hane, son iki hane 97 tümleyeni (eski/yeni yüzyıl). */
function rijksregisterGecerliMi(onbir: string): boolean {
  if (!/^\d{11}$/.test(onbir)) return false;
  const govde = onbir.slice(0, 9);
  const kontrol = Number(onbir.slice(9, 11));
  const eski = 97 - (Number(govde) % 97);
  const yeni = 97 - (Number(`2${govde}`) % 97);
  return kontrol === eski || kontrol === yeni;
}

function rijksregisterBicimle(onbir: string): string {
  return `${onbir.slice(0, 2)}.${onbir.slice(2, 4)}.${onbir.slice(4, 6)}-${onbir.slice(6, 9)}.${onbir.slice(9, 11)}`;
}

/** T.C. Kimlik No algoritması (nüfus ve vatandaşlık işleri — 11 hanenin son ikisi). */
function tcKimlikGecerliMi(onbir: string): boolean {
  if (!/^[0-9]{11}$/.test(onbir)) return false;
  const d = onbir.split('').map(Number);
  if (d[0] === 0) return false;
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const d10 = (((oddSum * 7) - evenSum) % 10 + 10) % 10;
  if (d10 !== d[9]) return false;
  const toplam10 = d.slice(0, 10).reduce((a, b) => a + b, 0);
  return toplam10 % 10 === d[10];
}

function adAyir(satir: string): { soyad: string; adlar: string } {
  const temiz = String(satir || '').replace(/<+$/, '');
  const parcalar = temiz.split('<<');
  const soyad = (parcalar[0] || '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();
  const adlar = (parcalar.slice(1).join(' ') || '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();
  return { soyad, adlar };
}

/** MRZ tümü büyük harf ve aksansızdır. Soyad resmî belgelerdeki gibi büyük kalır,
 *  adlar baş harfi büyük yazılır; Türkçe/aksanlı harfleri başvuran elle düzeltsin. */
function adBicimle(metin: string): string {
  return metin.split(' ').map((k) => (k ? k.charAt(0) + k.slice(1).toLowerCase() : k)).join(' ');
}

/** ISO 3166-1 alpha-3 → Türkçe görünen ülke/uyruk adı. Sık görülenler kapsanır;
 *  eşleşme yoksa MRZ kodu aynen döner (alan yine de elle düzeltilebilir). */
const UYRUK_ADLARI: Record<string, string> = {
  TUR: 'Türkiye', BEL: 'Belçika', FRA: 'Fransa', NLD: 'Hollanda', DEU: 'Almanya',
  ITA: 'İtalya', ESP: 'İspanya', GBR: 'Birleşik Krallık', IRL: 'İrlanda', PRT: 'Portekiz',
  MAR: 'Fas', DZA: 'Cezayir', TUN: 'Tunus', EGY: 'Mısır', SYR: 'Suriye', IRQ: 'Irak',
  IRN: 'İran', PAK: 'Pakistan', AFG: 'Afganistan', ALB: 'Arnavutluk', BIH: 'Bosna-Hersek',
  MKD: 'Kuzey Makedonya', XKX: 'Kosova', SRB: 'Sırbistan', ROU: 'Romanya', BGR: 'Bulgaristan',
  GRC: 'Yunanistan', POL: 'Polonya', RUS: 'Rusya', UKR: 'Ukrayna', SOM: 'Somali', SEN: 'Senegal',
  NGA: 'Nijerya', GIN: 'Gine', MLI: 'Mali', CMR: 'Kamerun', COD: 'Kongo Demokratik Cumhuriyeti',
  USA: 'Amerika Birleşik Devletleri', CAN: 'Kanada', BRA: 'Brezilya', CHE: 'İsviçre',
  AUT: 'Avusturya', LUX: 'Lüksemburg', SWE: 'İsveç', NOR: 'Norveç', DNK: 'Danimarka',
  FIN: 'Finlandiya', AZE: 'Azerbaycan', GEO: 'Gürcistan', ARM: 'Ermenistan', KAZ: 'Kazakistan',
};

function uyrukAdiCoz(kod: string): string { return UYRUK_ADLARI[kod] || kod; }

/** Opsiyonel veri alanındaki 11 haneyi T.C. Kimlik No veya Belçika rijksregister
 *  algoritmasıyla sınar; ikisi de tutmazsa boş döner (uydurma numara forma yazılmaz). */
function kisiselNumarayiCoz(opsiyonel: string): { tcKimlikNo: string; rijksregisterNo: string } {
  const onbir = sayisallastir(opsiyonel).replace(/</g, '').slice(0, 11);
  if (onbir.length === 11 && tcKimlikGecerliMi(onbir)) return { tcKimlikNo: onbir, rijksregisterNo: '' };
  if (onbir.length === 11 && rijksregisterGecerliMi(onbir)) return { tcKimlikNo: '', rijksregisterNo: rijksregisterBicimle(onbir) };
  return { tcKimlikNo: '', rijksregisterNo: '' };
}

function cinsiyetCoz(harf: string): MrzCinsiyet {
  return harf === 'F' ? 'kadin' : (harf === 'M' ? 'erkek' : '');
}

// ---------------------------------------------------------------- TD1 (3×30)
function td1Ayristir(satirlar: string[]): MrzSonuc | null {
  const l1 = (`${satirlar[0]}<<<<<`).slice(0, 30);
  const l2 = (`${satirlar[1]}<<<<<`).slice(0, 30);
  const l3 = (`${satirlar[2]}<<<<<`).slice(0, 30);
  if (l3.indexOf('<<') < 0) return null;

  const dogum = sayisallastir(l2.slice(0, 6));
  if (kontrolHanesi(dogum) !== sayisallastir(l2.slice(6, 7))) return null; // zorunlu kapı
  const dogumTarihi = tarihCevir(dogum);
  if (!dogumTarihi) return null;

  const ad = adAyir(alfabetiklestir(l3));
  if (!ad.soyad) return null;

  const cinsiyetHarfi = l2.charAt(7);
  const gecerlilik = sayisallastir(l2.slice(8, 14));
  const gecerlilikGecerli = kontrolHanesi(gecerlilik) === sayisallastir(l2.slice(14, 15));

  const belgeNoHam = l1.slice(5, 14);
  const belgeNo = belgeNoHam.replace(/</g, '');
  const belgeGecerli = kontrolHanesi(belgeNoHam) === sayisallastir(l1.slice(14, 15));
  const opsiyonel = l1.slice(15, 30);
  const kisisel = kisiselNumarayiCoz(opsiyonel);

  const uyrukKodu = alfabetiklestir(l2.slice(15, 18)).replace(/</g, '');

  return {
    bicim: 'TD1',
    soyad: ad.soyad,
    adlar: adBicimle(ad.adlar),
    dogumTarihi,
    gecerlilikTarihi: gecerlilikGecerli ? gecerlilikCevir(gecerlilik) : '',
    cinsiyet: cinsiyetCoz(cinsiyetHarfi),
    uyrukKodu,
    uyrukAdi: uyrukAdiCoz(uyrukKodu),
    belgeNo: belgeGecerli ? belgeNo : '',
    tcKimlikNo: kisisel.tcKimlikNo,
    rijksregisterNo: kisisel.rijksregisterNo,
  };
}

// ---------------------------------------------------------------- TD2 (2×36)
function td2Ayristir(satirlar: string[]): MrzSonuc | null {
  const l1 = (`${satirlar[0]}<<<<<`).slice(0, 36);
  const l2 = (`${satirlar[1]}<<<<<`).slice(0, 36);
  if (l1.indexOf('<<') < 0) return null;

  const dogum = sayisallastir(l2.slice(13, 19));
  if (kontrolHanesi(dogum) !== sayisallastir(l2.slice(19, 20))) return null;
  const dogumTarihi = tarihCevir(dogum);
  if (!dogumTarihi) return null;

  const ad = adAyir(alfabetiklestir(l1.slice(5)));
  if (!ad.soyad) return null;

  const belgeNoHam = l2.slice(0, 9);
  const belgeNo = belgeNoHam.replace(/</g, '');
  const belgeGecerli = kontrolHanesi(belgeNoHam) === sayisallastir(l2.slice(9, 10));
  const cinsiyetHarfi = l2.charAt(20);
  const gecerlilik = sayisallastir(l2.slice(21, 27));
  const gecerlilikGecerli = kontrolHanesi(gecerlilik) === sayisallastir(l2.slice(27, 28));
  const opsiyonel = l2.slice(28, 35);
  const kisisel = kisiselNumarayiCoz(opsiyonel);
  const uyrukKodu = alfabetiklestir(l2.slice(10, 13)).replace(/</g, '');

  return {
    bicim: 'TD2',
    soyad: ad.soyad,
    adlar: adBicimle(ad.adlar),
    dogumTarihi,
    gecerlilikTarihi: gecerlilikGecerli ? gecerlilikCevir(gecerlilik) : '',
    cinsiyet: cinsiyetCoz(cinsiyetHarfi),
    uyrukKodu,
    uyrukAdi: uyrukAdiCoz(uyrukKodu),
    belgeNo: belgeGecerli ? belgeNo : '',
    tcKimlikNo: kisisel.tcKimlikNo,
    rijksregisterNo: kisisel.rijksregisterNo,
  };
}

// ---------------------------------------------------------------- TD3 (2×44 — pasaport)
function td3Ayristir(satirlar: string[]): MrzSonuc | null {
  const l1 = (`${satirlar[0]}<<<<<`).slice(0, 44);
  const l2 = (`${satirlar[1]}<<<<<`).slice(0, 44);
  if (l1.indexOf('<<') < 0) return null;

  const dogum = sayisallastir(l2.slice(13, 19));
  if (kontrolHanesi(dogum) !== sayisallastir(l2.slice(19, 20))) return null;
  const dogumTarihi = tarihCevir(dogum);
  if (!dogumTarihi) return null;

  const ad = adAyir(alfabetiklestir(l1.slice(5)));
  if (!ad.soyad) return null;

  const belgeNoHam = l2.slice(0, 9);
  const belgeNo = belgeNoHam.replace(/</g, '');
  const belgeGecerli = kontrolHanesi(belgeNoHam) === sayisallastir(l2.slice(9, 10));
  const cinsiyetHarfi = l2.charAt(20);
  const gecerlilik = sayisallastir(l2.slice(21, 27));
  const gecerlilikGecerli = kontrolHanesi(gecerlilik) === sayisallastir(l2.slice(27, 28));
  const opsiyonel = l2.slice(28, 42);
  const kisisel = kisiselNumarayiCoz(opsiyonel);
  const uyrukKodu = alfabetiklestir(l2.slice(10, 13)).replace(/</g, '');

  return {
    bicim: 'TD3',
    soyad: ad.soyad,
    adlar: adBicimle(ad.adlar),
    dogumTarihi,
    gecerlilikTarihi: gecerlilikGecerli ? gecerlilikCevir(gecerlilik) : '',
    cinsiyet: cinsiyetCoz(cinsiyetHarfi),
    uyrukKodu,
    uyrukAdi: uyrukAdiCoz(uyrukKodu),
    belgeNo: belgeGecerli ? belgeNo : '',
    tcKimlikNo: kisisel.tcKimlikNo,
    rijksregisterNo: kisisel.rijksregisterNo,
  };
}

/** OCR çıktısından MRZ'yi bulup ayrıştırır. Sırasıyla TD1 (3×30), TD2 (2×36),
 *  TD3 (2×44) dener; ilk ICAO-doğrulanan sonucu döner, yoksa null. */
export function mrzAyristir(metin: string): MrzSonuc | null {
  const satirlar = mrzSatirlari(metin);

  const ucluk = satirlar.filter((s) => s.length >= 28 && s.length <= 32);
  for (let i = 0; i + 3 <= ucluk.length; i += 1) {
    const sonuc = td1Ayristir(ucluk.slice(i, i + 3));
    if (sonuc) return sonuc;
  }

  const otuzalti = satirlar.filter((s) => s.length >= 34 && s.length <= 38);
  for (let i = 0; i + 2 <= otuzalti.length; i += 1) {
    const sonuc = td2Ayristir(otuzalti.slice(i, i + 2));
    if (sonuc) return sonuc;
  }

  const ikilik = satirlar.filter((s) => s.length >= 42 && s.length <= 46);
  for (let i = 0; i + 2 <= ikilik.length; i += 1) {
    const sonuc = td3Ayristir(ikilik.slice(i, i + 2));
    if (sonuc) return sonuc;
  }

  return null;
}
