// PDF metin katmanını okumanın TEK yolu (12 Eylül 2026).
//
// Neden ayrı bir yardımcı — iki ayrı tuzak aynı yerde birleşiyordu:
//
// 1. KODLAMA. Testler `pdftotext <dosya> -` çağırıp çıktıyı UTF-8 sayıyordu. Poppler,
//    stdout'a yazarken `-enc` verilmezse metni Windows'un yerel kod sayfasına (CP1252)
//    çeviriyor. Türkçe ı/ş/ğ/İ o kod sayfasında yok — sessizce düşüyor; ç/ö/ü ise CP1252
//    baytına dönüşüp UTF-8 okunduğunda bozuluyor. Üretilen PDF'ler kusursuz olduğu hâlde
//    `npm run dogrula` iki testte kırmızı kalıyordu (PDF içeriği PyMuPDF ve
//    `pdftotext -enc UTF-8` ile birebir doğru çıkıyor).
//
// 2. HANGİ pdftotext. Bu makinede iki tane var: Git Bash'in `/mingw64/bin` altındaki
//    **Xpdf 4.06** ve WinGet ile kurulan **Poppler 25.07**. `-bbox-layout` (dilekçenin
//    sayfa kenarına taşmadığını ölçen koordinat kapısı) yalnız Poppler'da var. Hangisinin
//    bulunacağı kabuğun PATH sırasına bağlıydı: PowerShell'de Poppler, Git Bash'te Xpdf.
//    Yani aynı test, aynı depoda, kabuğa göre geçiyor ya da patlıyordu.
//
// Kural: PDF metni bu fonksiyondan başka bir yolla okunmaz. `-enc UTF-8` pazarlık konusu
// değildir; motor Poppler olarak sabitlenir; bulunamazsa test sessizce zayıflamaz, açık
// mesajla durur. Çağrı `cmd.exe` ÜZERİNDEN GEÇMEZ: kabuk aracı olunca yolu tırnaklamak
// gerekiyor, `cmd /s /c` ise yalnız en baştaki ve en sondaki tırnağı atıyor; tırnaklar
// dosya adının içinde kalıp «I/O Error: Couldn't open file» veriyordu. argv doğrudan
// verilince boşluklu yol da kendiliğinden doğru geçer.
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** PATH dışındaki bilinen Poppler kurulumları (WinGet, Chocolatey, elle kurulum). */
const BILINEN_YOLLAR = [
  `${process.env.LOCALAPPDATA ?? ''}\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftotext.exe`,
  'C:\\Program Files\\poppler\\Library\\bin\\pdftotext.exe',
  'C:\\ProgramData\\chocolatey\\bin\\pdftotext.exe',
];

let _motor;

/** Poppler sürümlü pdftotext'i bulur; yoksa ne yapılacağını söyleyerek durur. */
function popplerBul() {
  if (_motor) return _motor;
  const adaylar = [process.env.PDFTOTEXT, 'pdftotext', ...BILINEN_YOLLAR].filter(Boolean);
  const denenen = [];
  for (const aday of adaylar) {
    // DİKKAT: Poppler `-v` sürümünü stderr'e, Xpdf stdout'a yazar ve çıkış kodları da
    // tutarsızdır. Bu yüzden execFileSync değil spawnSync: iki akım da, çıkış kodu ne
    // olursa olsun okunur. (İlk sürüm yalnız stdout'a bakıyordu ve Poppler'ı ıskalıyordu.)
    const sonuc = spawnSync(aday, ['-v'], { encoding: 'utf8' });
    const surum = `${sonuc.stdout ?? ''}${sonuc.stderr ?? ''}`.trim();
    if (sonuc.error || !surum) { denenen.push(`${aday}: çalıştırılamadı`); continue; }
    if (/poppler/i.test(surum)) { _motor = aday; return _motor; }
    denenen.push(`${aday}: ${surum.split('\n')[0].trim()} (Poppler değil)`);
  }
  throw new Error(
    'Poppler sürümlü pdftotext bulunamadı; PDF metin kapıları çalıştırılamaz.\n' +
    'Kurulum: winget install oschwartz10612.Poppler — ya da PDFTOTEXT ortam değişkeniyle tam yolu verin.\n' +
    `Denenenler:\n  ${denenen.join('\n  ')}\n` +
    'Not: Git Bash\'in /mingw64/bin altındaki Xpdf 4.06 sürümü -bbox-layout desteklemez.',
  );
}

/**
 * @param {string|URL} dosya  PDF yolu (mutlak, göreli ya da file:// URL)
 * @param {string[]} [ekArgumanlar]  pdftotext seçenekleri (ör. ['-f','1','-l','1'] veya ['-bbox-layout'])
 * @returns {string} PDF'in metin katmanı (UTF-8)
 */
export function pdfMetni(dosya, ekArgumanlar = []) {
  const yol = dosya instanceof URL || String(dosya).startsWith('file:')
    ? fileURLToPath(dosya)
    : String(dosya);
  return execFileSync(popplerBul(), ['-enc', 'UTF-8', ...ekArgumanlar, yol, '-'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}
