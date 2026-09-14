// pdf-onizleme.mjs — Node'da ulucamii-Kod-v34.gs içindeki SAF PDF şablon
// fonksiyonlarını (pdfHtmlKayit, pdfHtmlIhtida) çalıştırıp örnek HTML çıktısı üretir.
//
// Yöntem: .gs dosyasının TAMAMI `new Function(...)` ile bir fonksiyon gövdesi olarak
// çalıştırılır (import/export yok, düz script). Dosya, üst seviyede yalnız `PANEL`
// sabitini kurarken bir GAS API'sine (PropertiesService) dokunur; bu ve script'in
// kullandığı diğer GAS küresel nesneleri (SpreadsheetApp, DriveApp, MailApp, GmailApp,
// Utilities, LockService, ContentService, UrlFetchApp, CacheService) burada "sihirli
// güdük" (magic stub) nesnelerle doldurulur: hangi özelliğe erişilirse erişilsin ya da
// nasıl çağrılırsa çağrılsın asla hata FIRLATMAZ, hep başka bir güdük döndürür. Böylece
// dosyanın yüklenmesi (üst seviye kod) güvenle tamamlanır ve pdfHtmlKayit/pdfHtmlIhtida
// (ki bunlar SAF'tır — hiç GAS API'si çağırmaz) gerçek girdilerle çalıştırılabilir.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GS_YOLU = path.join(__dirname, "apps-script", "ulucamii-Kod-v34.gs");
// Çıktı klasörü: CIKTI ortam değişkeni ya da D:\tmp\pdf-onizleme (13 Eyl 2026'ya kadar eski bir scratchpad yoluydu).
const CIKTI_KLASORU = process.env.CIKTI || "D:\\tmp\\pdf-onizleme";
mkdirSync(CIKTI_KLASORU, { recursive: true });

/** v33: örnek «ekranda çizilmiş imza» — saydam PNG, mavi mürekkep (formdaki tuvalin ürettiği biçim). */
async function ornekImzaPng() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">'
    + '<path d="M14 88 C 40 20, 70 20, 90 70 S 130 110, 150 60 S 190 10, 210 62 S 250 108, 280 58 S 330 20, 350 70 S 390 96, 408 40" '
    + 'fill="none" stroke="#1d3f6e" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M60 96 L 380 92" fill="none" stroke="#1d3f6e" stroke-width="3" stroke-linecap="round"/></svg>';
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "data:image/png;base64," + png.toString("base64");
}

/** Ne şekilde erişilirse erişilsin çökmeyen, kendini yansıtan bir "güdük" (stub) üretir. */
function magicStub(ad) {
  const fn = function () {};
  const handler = {
    get(_target, prop) {
      if (prop === "toString") return () => `[gudum ${ad}]`;
      if (prop === "then") return undefined; // Promise sanılmasın
      if (prop === Symbol.toPrimitive) return () => "";
      if (typeof prop === "symbol") return undefined;
      return magicStub(`${ad}.${String(prop)}`);
    },
    apply() {
      return magicStub(`${ad}()`);
    },
    construct() {
      return magicStub(`new ${ad}`);
    },
  };
  return new Proxy(fn, handler);
}

const GUDUK_ADLARI = [
  "SpreadsheetApp", "DriveApp", "MailApp", "GmailApp",
  "Utilities", "LockService", "PropertiesService",
  "ContentService", "UrlFetchApp", "CacheService",
];
for (const ad of GUDUK_ADLARI) {
  globalThis[ad] = magicStub(ad);
}

// 13 Eyl 2026: v30+ kimlik sabitlerini (KIMLIK) ayrı dosyadan alır; önce o yüklenir.
const kaynak = readFileSync(path.join(__dirname, "apps-script", "kimlik-sabitler.gs"), "utf8") + "\n" + readFileSync(GS_YOLU, "utf8");
const donduren = kaynak + "\nreturn { pdfHtmlKayit: pdfHtmlKayit, pdfHtmlIhtida: pdfHtmlIhtida, SURUM: SURUM };";

let modul;
try {
  const fabrika = new Function(donduren);
  modul = fabrika();
} catch (hata) {
  console.error("YUKLEME HATASI:", hata);
  process.exit(1);
}

if (typeof modul.pdfHtmlKayit !== "function" || typeof modul.pdfHtmlIhtida !== "function") {
  console.error("pdfHtmlKayit veya pdfHtmlIhtida bulunamadı.");
  process.exit(1);
}
console.log("Yüklendi — SURUM:", modul.SURUM);

/* ---------------- Örnek veri: KAYIT (fr form dili, sağlık notu var) ---------------- */
const ornekKayit = {
  tur: "kayit",
  sir: "ULUCAMII-KAYIT-2026",
  formSurumu: 3,
  dil: "fr",
  imza: await ornekImzaPng(),          // v33: çizilen imza PDF'in 2. sayfasındaki imza alanına basılır
  imzaYok: false,
  gonderimAnahtari: "onizleme-kayit-0000000000000001",
  ogrenci: {
    ad: "Yusuf Ömer", soyad: "Şahin-Öztürk",
    cinsiyet: "erkek",
    dogumTarihi: "2016-04-12",
    okul: "diger", okulDiger: "École Communale de Marche",
    sinif: "P4",
    kursDurumu: "devam",
  },
  veli: {
    yakinlik: "baba",
    adSoyad: "İbrahim Şahin-Öztürk",
    cep: "+32470123456",
    eposta: "ibrahim.ornek@example.com",
    adres: "Rue de la Gare 5",
    postaKodu: "6900",
    sehir: "Marche-en-Famenne",
    iletisimDili: "fr",
  },
  acil: { adSoyad: "Ayşe Şahin-Öztürk", cep: "+32472985073" },
  saglik: { var: true, not: "Fıstık alerjisi var; acil durumda EpiPen çantasında." },
  goruntuIzni: true,
  goruntuSosyalIzni: false,
  onay: {
    kurallar: true,
    gizlilik: true,
    saglikRiza: true,
    elektronikImza: "İbrahim Şahin-Öztürk",
  },
};
const metaKayit = { ref: "UC-2026-0042", zaman: "30.08.2026 18:24", dil: "fr" };

/* ---------------- Örnek veri: İHTİDA (fr form dili, iki şahit) ---------------- */
const ornekIhtida = {
  tur: "ihtida",
  sir: "ULUCAMII-IHTIDA-2026",
  formSurumu: 2,
  dil: "fr",
  gonderimAnahtari: "onizleme-ihtida-000000000000001",
  basvuran: {
    adSoyad: "Camille Dubois",
    cinsiyet: "kadin",
    dogumTarihi: "1994-11-03",
    dogumYeri: "Liège, Belçika",
    uyruk: "Belçika",
    anneAdi: "Élodie",
    babaAdi: "Marc",
    medeniHali: "bekar",
    ogrenimDurumu: "Lisans",
    meslek: "Hemşire",
    oncekiDin: "Katolik",
    ihtidaSebebi: "Uzun süredir İslam'ı araştırıyorum; Kur'an okumaya başladıktan sonra kalben karar verdim.",
    yeniIsim: "Meryem",
    eposta: "camille.ornek@example.com",
    telefon: "+32498112233",
    adres: "Avenue Reine Astrid 21, 6900 Marche-en-Famenne",
    torenDili: "fr",
    torenTarihi: "Eylül 2026 içinde bir Cuma",
    nasilHaberdar: "Bir arkadaşım aracılığıyla",
    ekNot: "Törene annem de katılmak istiyor.",
  },
  sahitler: [{ ad: "Fatma Yıldız" }, { ad: "" }],
  fotografIzni: false,
  onay: {
    acikRiza: true,
    ek10: true,
    gizlilik: true,
    beyan: "Camille Dubois",
  },
};
const metaIhtida = { ref: "IH-2026-0007", zaman: "30.08.2026 19:05", dil: "fr" };

const htmlKayit = modul.pdfHtmlKayit(ornekKayit, metaKayit);
const htmlIhtida = modul.pdfHtmlIhtida(ornekIhtida, metaIhtida);
// v33: aynı kaydın «ekranda imza atamıyorum» hâli — imza alanında el yazısı ad + kursta kalemle imzalar notu.
const htmlKayitImzasiz = modul.pdfHtmlKayit({ ...ornekKayit, imza: "", imzaYok: true }, metaKayit);

for (const [ad, html] of [["kayıt", htmlKayit], ["kayıt-imzasız", htmlKayitImzasiz], ["ihtida", htmlIhtida]]) {
  if (typeof html !== "string" || html.length < 500) {
    console.error(`${ad} şablonu boş/çok kısa döndü (${typeof html}, ${html && html.length})`);
    process.exit(1);
  }
  if (!html.includes("<!DOCTYPE html")) {
    console.error(`${ad} şablonu DOCTYPE içermiyor`);
    process.exit(1);
  }
}

const kayitYolu = path.join(CIKTI_KLASORU, "pdf-onizleme-kayit.html");
const kayitImzasizYolu = path.join(CIKTI_KLASORU, "pdf-onizleme-kayit-imzasiz.html");
const ihtidaYolu = path.join(CIKTI_KLASORU, "pdf-onizleme-ihtida.html");
writeFileSync(kayitYolu, htmlKayit, "utf8");
writeFileSync(kayitImzasizYolu, htmlKayitImzasiz, "utf8");
writeFileSync(ihtidaYolu, htmlIhtida, "utf8");

console.log("kayıt imza görseli var mı   :", htmlKayit.includes('class="imza-gorsel" src="data:image/png;base64,'));
console.log("imzasız hâlde el yazısı ad  :", !htmlKayitImzasiz.includes('class="imza-gorsel"') && htmlKayitImzasiz.includes("kalemle imzalayaca"));
console.log("kayıt HTML uzunluğu :", htmlKayit.length, "→", kayitYolu, "|", kayitImzasizYolu);
console.log("ihtida HTML uzunluğu:", htmlIhtida.length, "→", ihtidaYolu);
console.log("Türkçe karakter sınaması (kayıt) :", htmlKayit.includes("Şahin-Öztürk") && htmlKayit.includes("İbrahim"));
console.log("Türkçe karakter sınaması (ihtida):", htmlIhtida.includes("İslam") || htmlIhtida.includes("beyan"));
console.log("TAMAM");
