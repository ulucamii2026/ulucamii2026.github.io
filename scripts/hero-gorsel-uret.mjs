/**
 * Hero görsellerini yeniden sıkıştırır: her kare için AVIF + WebP, masaüstü ve telefon kadrajı.
 *
 * Neden: 4 Eylül 2026 ölçümünde ana sayfanın LCP'si telefonda (4× yavaş CPU, 1,6 Mbit) 5,1 sn'ydi
 * ve LCP ögesi hero fotoğrafıydı — `hero-1-m.webp` tek başına 172 KB, masaüstü kareleri 320-400 KB'ydi.
 * WebP kalitesi gereğinden yüksekti (~0,17 bayt/piksel). Bu betik aynı kadrajları koruyarak
 * yeniden kodlar ve yanına AVIF koyar; HeroSlayt.astro <picture> ile AVIF'i destekleyene onu verir.
 *
 * Kalite seçimi: hero fotoğrafı iki koyu gradyan katmanının ALTINDA duruyor (HeroSlayt.astro), yani
 * detay kaybı gözle görülmez — 4 Eylül 2026'da q32/q44/kaynak yan yana karşılaştırıldı, q40 seçildi.
 * `effort: 9` şart: aynı kalitede effort 6'ya göre dosya ~%40 daha küçük çıkıyor (ölçüldü).
 *
 * Kadrajlara DOKUNMAZ: kaynak, elle seçilmiş mevcut kırpmalardır (masaüstü 1600×1200 / 1600×900,
 * telefon 840×1493 dikey). Yalnız yeniden sıkıştırılır, yeniden çerçevelenmez.
 *
 * Kullanım:  node scripts/hero-gorsel-uret.mjs [--kalite-avif 40] [--kalite-webp 62] [--kuru]
 *
 * KAYNAK YEDEĞİ: sıkıştırma öncesi sürümler public/media/hero/_kaynak/ altında durur ve her
 * çalıştırma HEP o yedeği kaynak alır — yoksa kayıplı üstüne kayıplı sıkıştırma birikir. Bu klasör
 * .gitignore'dadır (2,4 MB, Pages yayınına girmesin diye); asılları git geçmişindedir. Yeni bir
 * makinede geri getirmek için (8ca8754 = AVIF'e geçişten önceki son commit):
 *     mkdir -p public/media/hero/_kaynak
 *     for f in 1 3 4 5 6 7; do
 *       git show 8ca8754:public/media/hero/hero-$f.webp   > public/media/hero/_kaynak/hero-$f.webp
 *       git show 8ca8754:public/media/hero/hero-$f-m.webp > public/media/hero/_kaynak/hero-$f-m.webp
 *     done
 * Yedek yokken betik çalıştırılırsa MEVCUT (zaten sıkıştırılmış) dosyaları kaynak sanar; bu yüzden
 * o durumda uyarır ve --yeni-kaynak bayrağı ister.
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIZIN = 'public/media/hero';
const YEDEK = join(DIZIN, '_kaynak');
const arg = (ad, varsayilan) => {
  const i = process.argv.indexOf('--' + ad);
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : varsayilan;
};
const KALITE_AVIF = arg('kalite-avif', 40);
const KALITE_WEBP = arg('kalite-webp', 62);
const KURU = process.argv.includes('--kuru');
const kb = (n) => (n / 1024).toFixed(0).padStart(4) + ' KB';

mkdirSync(YEDEK, { recursive: true });

// Kaynak yedeği: yalnız bir kez, ilk çalıştırmada
const kareler = readdirSync(DIZIN).filter((f) => /^hero-\d+(-m)?\.webp$/.test(f)).sort();
const eksikYedek = kareler.filter((f) => !existsSync(join(YEDEK, f)));
if (eksikYedek.length && !process.argv.includes('--yeni-kaynak')) {
  console.error(
    [
      `DURDURULDU: ${eksikYedek.length} karenin kaynak yedeği yok (public/media/hero/_kaynak/).`,
      'Mevcut dosyalar zaten sıkıştırılmış olabilir; onları kaynak almak kaliteyi kalıcı düşürür.',
      'Yedekleri git geçmişinden geri getirin (betiğin başlığındaki komut) ya da gerçekten yeni',
      'kaynak yüklediyseniz --yeni-kaynak ile çalıştırın.',
    ].join('\n'),
  );
  process.exit(1);
}
for (const f of eksikYedek) { copyFileSync(join(DIZIN, f), join(YEDEK, f)); console.log('yedek →', f); }

let oncekiToplam = 0, sonrakiToplam = 0;
for (const f of kareler) {
  const kaynak = join(YEDEK, f);
  const hedefWebp = join(DIZIN, f);
  const hedefAvif = hedefWebp.replace(/\.webp$/, '.avif');
  const m = await sharp(kaynak).metadata();
  const oncekiBoyut = statSync(hedefWebp).size;
  oncekiToplam += oncekiBoyut;
  if (KURU) { console.log(`${f.padEnd(15)} ${m.width}x${m.height}  ${kb(oncekiBoyut)}  (kuru çalışma)`); continue; }

  await sharp(kaynak).webp({ quality: KALITE_WEBP, effort: 6, smartSubsample: true }).toFile(hedefWebp + '.yeni');
  await sharp(kaynak).avif({ quality: KALITE_AVIF, effort: 9, chromaSubsampling: '4:2:0' }).toFile(hedefAvif);
  // .yeni → asıl (sharp aynı dosyaya hem okuyup hem yazamaz)
  copyFileSync(hedefWebp + '.yeni', hedefWebp);
  const { unlinkSync } = await import('node:fs');
  unlinkSync(hedefWebp + '.yeni');

  const w = statSync(hedefWebp).size, a = statSync(hedefAvif).size;
  sonrakiToplam += Math.min(w, a);
  console.log(`${f.padEnd(15)} ${String(m.width + 'x' + m.height).padEnd(10)} webp ${kb(oncekiBoyut)} → ${kb(w)} · avif ${kb(a)}`);
}
if (!KURU) {
  console.log(`\nTOPLAM (AVIF alan tarayıcı için): ${kb(oncekiToplam)} → ${kb(sonrakiToplam)}  (%${Math.round((1 - sonrakiToplam / oncekiToplam) * 100)} tasarruf)`);
}
