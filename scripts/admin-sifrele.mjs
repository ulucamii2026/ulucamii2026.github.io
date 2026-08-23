// Admin giriş kapısı için GitHub token'ını kullanıcı adı + şifreyle şifreler (PBKDF2-SHA256 600k → AES-256-GCM)
// Kullanım: node scripts/admin-sifrele.mjs <kullanıcı-adı> <şifre> <token-dosyası>  → public/admin/giris.html içindeki SIFRELI bloğunu günceller
// Tarayıcı tarafı (giris.html) WebCrypto ile aynı parametrelerle çözer; betik yazdıktan sonra WebCrypto ile kendi kendini doğrular.
import { readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, createCipheriv, randomBytes, webcrypto } from 'node:crypto';

const [kullanici, sifre, tokenDosya] = process.argv.slice(2);
if (!kullanici || !sifre || !tokenDosya) { console.error('kullanım: node scripts/admin-sifrele.mjs <kullanıcı> <şifre> <token-dosyası>'); process.exit(1); }
const token = readFileSync(tokenDosya, 'utf8').trim();
const ITER = 600000;
const anahtarMetni = `${kullanici.trim().toLowerCase()} ${sifre}`;
const salt = randomBytes(16), iv = randomBytes(12);
const key = pbkdf2Sync(Buffer.from(anahtarMetni, 'utf8'), salt, ITER, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(Buffer.from(token, 'utf8')), cipher.final(), cipher.getAuthTag()]); // WebCrypto biçimi: şifreli veri + 16 bayt etiket
const blok = JSON.stringify({ v: 1, iter: ITER, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') });
const yol = new URL('../public/admin/giris.html', import.meta.url);
let html = readFileSync(yol, 'utf8');
html = html.replace(/const SIFRELI = \{[^\n]*\};/, () => `const SIFRELI = ${blok};`);
writeFileSync(yol, html);
console.log('giris.html güncellendi · iter', ITER, '· ct', ct.length, 'bayt');

// kendi kendini doğrula — tarayıcıdaki kodla birebir aynı WebCrypto adımları
const S = JSON.parse(readFileSync(yol, 'utf8').match(/const SIFRELI = (\{.*?\});/)[1]);
const d = (s) => Uint8Array.from(Buffer.from(s, 'base64'));
const enc = new TextEncoder();
const km = await webcrypto.subtle.importKey('raw', enc.encode(anahtarMetni), 'PBKDF2', false, ['deriveKey']);
const k2 = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt: d(S.salt), iterations: S.iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
const geri = new TextDecoder().decode(await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: d(S.iv) }, k2, d(S.ct)));
console.log('doğrulama:', geri === token ? 'WebCrypto ile çözüm başarılı' : 'UYUŞMAZLIK');
