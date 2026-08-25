/**
 * Panel API anahtarını (UCP-…) yeniler.
 *
 * NEDEN: 25 Ağustos 2026'da Apps Script kodu depoya alınırken panel anahtarı yaklaşık yarım
 * saat public depoda kaldı (commit f8555b3 → 074b792). Anahtar koddan çıkarıldı ve Script
 * Properties'e taşındı, ama git geçmişinde duruyor. Bu betik anahtarı değiştirir.
 *
 * NE YAPAR
 *   1. Yeni bir UCP-… anahtarı üretir (16 bayt rastgele, hex).
 *   2. Erişim paketindeki (`gas`) değeri günceller.
 *   3. Paketi kullanıcı adı + şifreyle yeniden şifreleyip `public/admin/giris.html` içine yazar.
 *   4. Yeni anahtarı ekrana basar — Apps Script'e siz gireceksiniz.
 *
 * KULLANIM
 *   node scripts/panel-anahtar-rotasyon.mjs <kullanıcı-adı> <şifre> [paket-dosyası]
 *   (paket dosyası verilmezse D:\tmp\panel_paket.json kullanılır)
 *
 * SONRA — SIRA ÖNEMLİ
 *   a) Apps Script → Proje ayarları → Komut dosyası özellikleri → PANEL_ANAHTARI = <yeni anahtar>
 *      → "Komut dosyası özelliklerini kaydet". Bu andan itibaren panel geçici olarak
 *      "yetkisiz" der; adım (b) tamamlanınca düzelir.
 *   b) git add -A && git commit && git push  → yayın bitince panele YENİDEN GİRİŞ yapın.
 *   c) Doğrulama:
 *      eski anahtarla  /exec?islem=liste&anahtar=<ESKİ>  →  {"ok":false,"hata":"yetkisiz"}
 *      yeni anahtarla  /exec?islem=liste&anahtar=<YENİ>  →  {"ok":true,…}
 *
 * Apps Script kodunda anahtarın kendisi YOKTUR (yer tutucu durur); yalnız Script Properties
 * değişir — yeniden dağıtım gerekmez.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const [kullanici, sifre, paketYolu = 'D:\\tmp\\panel_paket.json'] = process.argv.slice(2);
if (!kullanici || !sifre) {
  console.error('kullanım: node scripts/panel-anahtar-rotasyon.mjs <kullanıcı-adı> <şifre> [paket-dosyası]');
  process.exit(1);
}

const paket = JSON.parse(readFileSync(paketYolu, 'utf8'));
if (!paket.gh) { console.error('HATA: pakette `gh` (GitHub anahtarı) yok — panel bu paketle açılamaz.'); process.exit(2); }

const eski = paket.gas || '(yok)';
const yeni = 'UCP-' + randomBytes(16).toString('hex');
paket.gas = yeni;
writeFileSync(paketYolu, JSON.stringify(paket, null, 2), 'utf8');

// giris.html'e şifreli olarak yaz (aynı PBKDF2/AES-GCM parametreleri)
execFileSync(process.execPath, ['scripts/admin-sifrele.mjs', kullanici, sifre, paketYolu], { stdio: 'inherit' });

const html = readFileSync('public/admin/giris.html', 'utf8');
if (html.includes(yeni) || html.includes(eski)) {
  console.error('\nUYARI: giris.html içinde anahtar DÜZ METİN görünüyor — şifreleme beklendiği gibi çalışmamış.');
  process.exit(3);
}

console.log('\n--------------------------------------------------------------');
console.log('  Eski anahtar : ' + eski);
console.log('  YENİ ANAHTAR : ' + yeni);
console.log('--------------------------------------------------------------');
console.log('  1) Apps Script → Proje ayarları → Komut dosyası özellikleri');
console.log('     PANEL_ANAHTARI = ' + yeni);
console.log('  2) git add -A && git commit -m "Panel anahtari yenilendi" && git push');
console.log('  3) Yayın bitince panele yeniden giriş yapın.');
console.log('--------------------------------------------------------------\n');
