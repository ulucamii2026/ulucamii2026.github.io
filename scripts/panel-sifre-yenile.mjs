/**
 * Panel giriş şifresini sınar veya yeniler.
 *
 * NEDEN: 25 Ağustos 2026'da panel anahtarı rotasyonundan sonra girişte "Kullanıcı adı veya
 * şifre hatalı" hatası alındı. Şifreli paketin kendisi sağlam (rotasyon commit'i, depo ve
 * canlı site birebir aynı) — sorun, paketi açan kullanıcı adı + şifre çiftinde. Rotasyon
 * betiği şifreyi GİZLİ soruyordu ve TEK KEZ; ekranda görünmediği için yazım hatası fark
 * edilmeden pakete işlenmiş olabilir. Bu betik hem o tahmini sınar hem de şifreyi
 * doğrulamalı biçimde yeniler.
 *
 * KULLANIM
 *   node scripts/panel-sifre-yenile.mjs --dene   Depodaki paketi bir kullanıcı adı + şifre ile
 *                                                açmayı dener. Hiçbir şey değiştirmez.
 *   node scripts/panel-sifre-yenile.mjs --dene --canli
 *                                                Aynısını CANLI sitedeki sayfayla yapar. Yeni
 *                                                şifre yerelde çalışıp canlıda çalışmıyorsa
 *                                                değişiklik henüz yayınlanmamış demektir.
 *   node scripts/panel-sifre-yenile.mjs          Paketi YENİ şifreyle yeniden şifreler.
 *                                                Şifre iki kez sorulur, eşleşmezse durur.
 *                                                DEĞİŞİKLİK YAYINLANANA KADAR canlı panelde
 *                                                eski şifre geçerlidir — commit + push şart.
 *
 * GİZLİLİK: şifre ekrana yazılmaz, dosyaya kaydedilmez, komut satırına geçirilmez.
 * Sırların düz metin hâli D:\tmp\panel_paket.json içindedir; bu betik onu yalnız okur.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pbkdf2Sync, createCipheriv, randomBytes, webcrypto } from 'node:crypto';
import { createInterface } from 'node:readline';

const PAKET = 'D:\\tmp\\panel_paket.json';
const GIRIS = 'public/admin/giris.html';
const ITER = 600000;
const DENE = process.argv.includes('--dene');
const CANLI = process.argv.includes('--canli');
if (CANLI && !DENE) { console.error('HATA: --canli yalnız --dene ile kullanılır (canlı sayfaya yazılamaz).'); process.exit(2); }

const b64 = (s) => Buffer.from(s, 'base64');

/** Gizli okuma — yazılanlar ekranda görünmez. */
function gizliSor(soru) {
  return new Promise((coz) => {
    const ara = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const yaz = ara._writeToOutput?.bind(ara);
    ara._writeToOutput = function (m) { if (m.includes(soru)) yaz?.(m); else yaz?.(''); };
    ara.question(soru, (c) => { ara.close(); process.stdout.write('\n'); coz(c); });
  });
}
function sor(soru) {
  return new Promise((coz) => {
    const ara = createInterface({ input: process.stdin, output: process.stdout });
    ara.question(soru, (c) => { ara.close(); coz(c); });
  });
}

/** Paketi verilen kullanıcı adı + şifreyle açmayı dener (tarayıcıdaki yolun aynısı). */
async function coz(blok, kullanici, sifre) {
  const anahtarMetni = `${kullanici.trim().toLowerCase()} ${sifre}`;
  const enc = new TextEncoder();
  const km = await webcrypto.subtle.importKey('raw', enc.encode(anahtarMetni), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(blok.salt), iterations: blok.iter, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return new TextDecoder().decode(
    await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(blok.iv) }, key, b64(blok.ct)));
}

/** Şifredeki görünmez tuzakları bildirir (terminal kodlaması, baştaki/sondaki boşluk). */
function sifreUyarilari(s) {
  const uyari = [];
  if (s !== s.trim()) uyari.push('başında veya sonunda boşluk var');
  if (/[^ -~]/.test(s)) uyari.push('ASCII dışı karakter içeriyor (ı ş ğ ü ö ç gibi) — terminal ile tarayıcı bunları farklı kodlayabilir');
  if (s.length < 8) uyari.push('8 karakterden kısa');
  return uyari;
}

const html = CANLI
  ? await (await fetch(`https://ulucamii.be/admin/giris.html?onbellek=${process.pid}${Math.round(process.uptime() * 1e6)}`, { cache: 'no-store' })).text()
  : readFileSync(GIRIS, 'utf8');
if (CANLI) console.log('\n(CANLI sitedeki giriş sayfası okundu — depodaki dosya değil.)');
const eslesme = html.match(/const SIFRELI = (\{.*?\});/s);
if (!eslesme) { console.error('HATA: giris.html içinde SIFRELI bloğu bulunamadı.'); process.exit(2); }
const sifreli = JSON.parse(eslesme[1]);

if (DENE) {
  console.log('\nMevcut paket SINANACAK — hiçbir şey değiştirilmeyecek.\n');
  const kullanici = (await sor('Kullanıcı adı : ')).trim();
  const sifre = await gizliSor('Şifre         : ');
  const uyari = sifreUyarilari(sifre);
  try {
    const acik = await coz(sifreli, kullanici, sifre);
    const paket = acik.trim().startsWith('{') ? JSON.parse(acik) : { gh: acik };
    console.log('\n  ACILDI — bu kullanıcı adı ve şifre DOĞRU.');
    console.log('     Pakette bulunanlar:', Object.keys(paket).join(', '));
    console.log('     Panele bu bilgilerle girebilirsiniz. Giriş yine olmuyorsa tarayıcı');
    console.log('     önbelleği eskidir: giriş sayfasını Ctrl+F5 ile yenileyin.\n');
  } catch {
    console.log('\n  ACILMADI — bu kullanıcı adı + şifre çifti paketi çözmüyor.');
    if (uyari.length) console.log('     Dikkat: girdiğiniz şifrede ' + uyari.join('; ') + '.');
    console.log('     Başka bir yazım deneyin (şifrede büyük/küçük harf önemlidir),');
    console.log('     ya da şifreyi yenileyin: node scripts/panel-sifre-yenile.mjs\n');
    process.exitCode = 1;
  }
} else {
  if (!existsSync(PAKET)) {
    console.error(`\nHATA: ${PAKET} yok. Paket olmadan yeniden şifreleme yapılamaz.\n`);
    process.exit(2);
  }
  const paket = JSON.parse(readFileSync(PAKET, 'utf8'));
  if (!paket.gh) { console.error('HATA: pakette `gh` (GitHub anahtarı) yok.'); process.exit(2); }

  /* Terminalden şifre almak, tarayıcıdaki girişle arada bir kodlama farkı doğurabilir ve
     gizli girişte bu görünmez. Tarayıcı aracı aynı kod yolunu kullandığı için tercih edilir. */
  console.log('\n  ── DİKKAT ────────────────────────────────────────────────────');
  console.log('  Şifre burada terminalden alınır; yazdığınız ekranda görünmez.');
  console.log('  Daha güvenli yol, şifreyi tarayıcıda belirlemektir:');
  console.log('    https://ulucamii.be/admin/sifre-araci.html');
  console.log('  Orada şifre, giriş sayfasıyla BİREBİR aynı kod yolundan geçer.');
  console.log('  ──────────────────────────────────────────────────────────────');
  const onay = (await sor('  Yine de terminalden devam edilsin mi? (evet/hayır) : ')).trim().toLowerCase();
  if (!/^(e|evet|y|yes)$/.test(onay)) {
    console.log('\n  Vazgeçildi — hiçbir şey değişmedi. Tarayıcı aracını kullanın.\n');
    process.exit(0);
  }

  console.log('\nPanel erişim paketi YENİ bir şifreyle yeniden şifrelenecek.');
  console.log('Şifre iki kez sorulacak; ikisi aynı değilse hiçbir şey değişmez.\n');
  const kullanici = (await sor('Kullanıcı adı      : ')).trim();
  const sifre1 = await gizliSor('Yeni şifre         : ');
  const sifre2 = await gizliSor('Yeni şifre (tekrar): ');

  if (!kullanici || !sifre1) { console.error('\nHATA: kullanıcı adı ve şifre gerekli.\n'); process.exit(1); }
  if (sifre1 !== sifre2) {
    console.error('\n  İKİ ŞİFRE AYNI DEĞİL — hiçbir şey değiştirilmedi.');
    console.error('     (Rotasyonda şifre tek kez soruluyordu; hata bu yüzden fark edilememişti.)\n');
    process.exit(1);
  }
  const uyari = sifreUyarilari(sifre1);
  if (uyari.length) {
    console.log('\n  UYARI: şifrede ' + uyari.join('; ') + '.');
    const devam = (await sor('  Yine de devam edilsin mi? (evet/hayır) : ')).trim().toLowerCase();
    if (!/^(e|evet|y|yes)$/.test(devam)) { console.log('\n  Vazgeçildi, hiçbir şey değişmedi.\n'); process.exit(0); }
  }

  const anahtarMetni = `${kullanici.trim().toLowerCase()} ${sifre1}`;
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = pbkdf2Sync(Buffer.from(anahtarMetni, 'utf8'), salt, ITER, 32, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const govde = JSON.stringify(paket);
  const ct = Buffer.concat([cipher.update(govde, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  const blok = JSON.stringify({ v: 1, iter: ITER, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') });

  // Yazmadan ÖNCE geri çözerek doğrula — tarayıcının kullanacağı yolun aynısıyla.
  const geri = await coz(JSON.parse(blok), kullanici, sifre1);
  if (geri !== govde) { console.error('\nHATA: doğrulama başarısız — dosya DEĞİŞTİRİLMEDİ.\n'); process.exit(3); }

  const yeniHtml = html.replace(/const SIFRELI = \{.*?\};/s, `const SIFRELI = ${blok};`);
  if (yeniHtml === html) { console.error('\nHATA: giris.html içindeki blok değiştirilemedi.\n'); process.exit(3); }
  // Sırların düz metin hâli sayfaya sızmamalı.
  for (const deger of Object.values(paket)) {
    if (String(deger).length > 8 && yeniHtml.includes(String(deger))) {
      console.error('\nHATA: sır DÜZ METİN olarak sayfada görünüyor — dosya yazılmadı.\n');
      process.exit(3);
    }
  }
  writeFileSync(GIRIS, yeniHtml, 'utf8');

  console.log('\n--------------------------------------------------------------');
  console.log('  Paket yeni şifreyle şifrelendi ve geri çözülerek DOĞRULANDI.');
  console.log('');
  console.log('  Sırada: değişikliğin yayınlanması (Claude yapacak).');
  console.log('  Yayın bitince panele YENİ şifrenizle girin; sayfayı Ctrl+F5 ile yenileyin.');
  console.log('--------------------------------------------------------------\n');
}
