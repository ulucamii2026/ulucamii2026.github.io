/**
 * Panel API anahtarını (UCP-…) yeniler.
 *
 * NEDEN: 25 Ağustos 2026'da Apps Script kodu depoya alınırken panel anahtarı yaklaşık yarım
 * saat public depoda kaldı (commit f8555b3 → 074b792). Anahtar koddan çıkarıldı ve Script
 * Properties'e taşındı, ama git geçmişinde duruyor. Bu betik anahtarı değiştirir.
 *
 * GİZLİLİK: şifre gizli sorulur (ekrana yazılmaz), yeni anahtar da ekrana BASILMAZ —
 * `D:\tmp\yeni-panel-anahtari.txt` dosyasına yazılır. Böylece ne şifre ne de yeni anahtar
 * terminal geçmişine ya da bir sohbete düşer.
 *
 * NE YAPAR
 *   1. Yeni bir UCP-… anahtarı üretir (16 bayt rastgele).
 *   2. Erişim paketindeki `gas` değerini günceller.
 *   3. Paketi kullanıcı adı + şifreyle yeniden şifreleyip `public/admin/giris.html` içine yazar
 *      ve WebCrypto ile kendi kendini doğrular.
 *   4. Yeni anahtarı yukarıdaki dosyaya yazar.
 *
 * KULLANIM
 *   node scripts/panel-anahtar-rotasyon.mjs
 *   (kullanıcı adı ve şifre sorulur; şifre yazarken ekranda görünmez)
 *
 * SONRASI — SIRA ÖNEMLİ
 *   a) Apps Script → Proje ayarları → Komut dosyası özellikleri → PANEL_ANAHTARI = yeni değer
 *      → kaydet. Bu andan itibaren panel kısa süre "yetkisiz" der; (b) bitince düzelir.
 *   b) git add -A && git commit && git push  → yayın bitince panele YENİDEN GİRİŞ yapın.
 *   c) Doğrulama: eski anahtarla /exec?islem=liste&anahtar=<ESKİ> → "yetkisiz",
 *      yeni anahtarla → {"ok":true,…}
 *   d) `D:\tmp\yeni-panel-anahtari.txt` dosyasını silin.
 *
 * Apps Script kodunda anahtarın kendisi YOKTUR (yer tutucu durur); yalnız Script Properties
 * değişir — yeniden dağıtım gerekmez.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const PAKET = process.argv[2] || 'D:\\tmp\\panel_paket.json';
const ANAHTAR_DOSYASI = 'D:\\tmp\\yeni-panel-anahtari.txt';

/** Terminalden gizli okuma: yazılanlar ekrana basılmaz. */
function gizliSor(soru) {
  return new Promise((coz) => {
    const arayuz = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const yaz = arayuz._writeToOutput?.bind(arayuz);
    arayuz._writeToOutput = function (metin) {
      if (metin.includes(soru)) yaz?.(metin);
      else yaz?.('');
    };
    arayuz.question(soru, (cevap) => { arayuz.close(); process.stdout.write('\n'); coz(cevap); });
  });
}
function sor(soru) {
  return new Promise((coz) => {
    const arayuz = createInterface({ input: process.stdin, output: process.stdout });
    arayuz.question(soru, (cevap) => { arayuz.close(); coz(cevap); });
  });
}

const paket = JSON.parse(readFileSync(PAKET, 'utf8'));
if (!paket.gh) { console.error('HATA: pakette `gh` (GitHub anahtarı) yok — panel bu paketle açılamaz.'); process.exit(2); }

console.log('\nPanel erişim paketi yeniden şifrelenecek.');
console.log('Panele giriş yaparken kullandığınız kullanıcı adı ve şifre isteniyor.\n');
const kullanici = (await sor('Kullanıcı adı : ')).trim();
const sifre = await gizliSor('Şifre         : ');
if (!kullanici || !sifre) { console.error('HATA: kullanıcı adı ve şifre gerekli.'); process.exit(1); }

const eski = paket.gas || '(yok)';
const yeni = 'UCP-' + randomBytes(16).toString('hex');
paket.gas = yeni;
writeFileSync(PAKET, JSON.stringify(paket, null, 2), 'utf8');

// giris.html'e şifreli olarak yaz (aynı PBKDF2/AES-GCM parametreleri; betik kendini doğrular)
execFileSync(process.execPath, ['scripts/admin-sifrele.mjs', kullanici, sifre, PAKET], { stdio: 'inherit' });

const html = readFileSync('public/admin/giris.html', 'utf8');
if (html.includes(yeni) || html.includes(eski)) {
  console.error('\nUYARI: giris.html içinde anahtar DÜZ METİN görünüyor — şifreleme beklendiği gibi çalışmamış.');
  process.exit(3);
}

writeFileSync(ANAHTAR_DOSYASI, yeni + '\n', 'utf8');
console.log('\n--------------------------------------------------------------');
console.log('  Paket yeniden şifrelendi. Yeni anahtar ekrana yazılmadı;');
console.log('  şu dosyada duruyor: ' + ANAHTAR_DOSYASI);
console.log('');
console.log('  Sırada: Apps Script → PANEL_ANAHTARI güncellemesi, sonra commit + push.');
console.log('  Bu adımları Claude yapabilir — dosyayı okuyup devam edecek.');
console.log('--------------------------------------------------------------\n');
