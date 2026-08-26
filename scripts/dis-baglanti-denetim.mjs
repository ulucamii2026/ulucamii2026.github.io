/**
 * Dış bağlantı denetimi — dist/ içindeki site dışı adresleri yoklar.
 *
 * NEDEN: site-denetim.mjs yalnız site içi bağlantıları ölçer (ağ gerektirmez). Dış adresler
 * sessizce ölür: 26 Ağustos 2026'da MSB'nin "Dövizle Askerlik İşlemleri" sayfası 404 dönüyordu
 * ve üç dilde de konsolosluk sayfasında duruyordu — kimse tıklamadan fark edilmezdi.
 *
 * KULLANIM
 *   node scripts/dis-baglanti-denetim.mjs           dist/ üzerinde çalışır
 *   node scripts/dis-baglanti-denetim.mjs --ayrinti çalışan adresleri de yazar
 *
 * ÇIKIŞ KODU: kırık bağlantı varsa 1 (iş akışı kırmızıya boyanır), yoksa 0.
 *
 * YANLIŞ POZİTİF NOTU: bazı kamu siteleri bot isteklerini 403 ile geri çevirir ya da
 * Node'un sertifika deposu ara sertifikayı tanımaz (diyanet.tv böyle). Bu iki durum
 * "şüpheli" sayılır, kırık sayılmaz — gerçek kırıklar 404/410 ve bağlantı hatalarıdır.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AYRINTI = process.argv.includes('--ayrinti');
const KOK = 'dist';
const ZAMAN_ASIMI = 20000;
const ARA = 250; // kamu sitelerini yormamak için istekler arası bekleme

/** Site kendi adresleri ve şema/standart adresleri denetim dışıdır. */
const ATLA = /ulucamii\.be|schema\.org|w3\.org|googleusercontent|gstatic|googleapis|^https?:\/\/localhost/;

if (!existsSync(KOK)) {
  console.error('dist/ yok — önce `npm run build`');
  process.exit(2);
}

function htmlDosyalari(dizin) {
  const cikti = [];
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) cikti.push(...htmlDosyalari(yol));
    else if (ad.endsWith('.html')) cikti.push(yol);
  }
  return cikti;
}

/** Adres → onu içeren sayfalar (hangi sayfayı düzelteceğini bilmek için). */
const adresler = new Map();
for (const dosya of htmlDosyalari(KOK)) {
  const html = readFileSync(dosya, 'utf8');
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const ham = m[1].replace(/&amp;/g, '&').split('#')[0];
    // JS şablonu içindeki adresler (panel kodu) çalışma zamanında üretilir, denetlenmez.
    if (ham.includes('${') || ATLA.test(ham)) continue;
    if (!adresler.has(ham)) adresler.set(ham, new Set());
    adresler.get(ham).add(dosya.replace(/\\/g, '/'));
  }
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const BASLIK = { 'User-Agent': 'Mozilla/5.0 (compatible; UluCamiiLinkCheck/1.0; +https://ulucamii.be)' };

async function birDeneme(adres) {
  const kontrol = new AbortController();
  const sayac = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI);
  try {
    let y = await fetch(adres, { method: 'HEAD', redirect: 'follow', signal: kontrol.signal, headers: BASLIK });
    // HEAD desteklemeyen sunucular için GET'e düş
    if (y.status === 405 || y.status === 501 || y.status === 404) {
      y = await fetch(adres, { method: 'GET', redirect: 'follow', signal: kontrol.signal, headers: BASLIK });
    }
    return { kod: y.status };
  } catch (e) {
    const sebep = e?.cause?.code || e?.name || String(e);
    return { kod: 0, sebep: String(sebep).slice(0, 40) };
  } finally {
    clearTimeout(sayac);
  }
}

/* Ağ hataları ARALIKLI olur: 26 Ağustos 2026'da diyanet.gov.tr aynı denetimin başında 200,
   sonunda ECONNRESET döndü (tarayıcı da aynısını yaşadı, birkaç dakika sonra düzeldi).
   Tek denemeyle "kırık" demek 381 sayfayı yanlışlıkla suçlamak olurdu — bu yüzden ağ
   hataları ve 5xx artan beklemeyle üç kez denenir. Kalıcı 404/410 ilk denemede bellidir. */
async function yokla(adres) {
  let son = null;
  for (let deneme = 1; deneme <= 3; deneme++) {
    son = await birDeneme(adres);
    const gecici = son.kod === 0 || son.kod === 429 || son.kod >= 500;
    if (!gecici) return son;
    if (deneme < 3) await bekle(2000 * deneme);
  }
  return { ...son, tekrarlandi: true };
}

console.log(`\nDış bağlantı denetimi — ${adresler.size} benzersiz adres\n`);

const kirik = [];
const supheli = [];
for (const [adres, sayfalar] of adresler) {
  const { kod, sebep } = await yokla(adres);
  const kisa = adres.length > 72 ? adres.slice(0, 71) + '…' : adres;
  if (kod >= 200 && kod < 400) {
    if (AYRINTI) console.log(`  ${String(kod).padEnd(5)} ${kisa}`);
  } else if (kod === 403 || kod === 429 || kod === 0 || kod >= 500) {
    /* Bot koruması, sertifika zinciri ya da üç denemede de geçmeyen ağ hatası: sunucu
       tarayıcıda çalışıyor olabilir. Kırık saymıyoruz, elle bakılmak üzere işaretliyoruz. */
    supheli.push([adres, kod || sebep, [...sayfalar]]);
    console.log(`  ${String(kod || sebep || 'AG').padEnd(5)} ${kisa}   (şüpheli — elle bakılmalı)`);
  } else {
    kirik.push([adres, kod || sebep, [...sayfalar]]);
    console.log(`  ${String(kod || 'HATA').padEnd(5)} ${kisa}   <<< KIRIK`);
  }
  await bekle(ARA);
}

console.log('');
if (kirik.length) {
  console.log(`KIRIK BAĞLANTI: ${kirik.length}`);
  for (const [adres, kod, sayfalar] of kirik) {
    console.log(`  ${adres}  (${kod})`);
    for (const s of sayfalar.slice(0, 4)) console.log(`      ${s}`);
    if (sayfalar.length > 4) console.log(`      … ve ${sayfalar.length - 4} sayfa daha`);
  }
}
if (supheli.length) console.log(`\nŞüpheli (bot koruması / sertifika): ${supheli.length} — tarayıcıda doğrulayın.`);
if (!kirik.length && !supheli.length) console.log('Bütün dış bağlantılar çalışıyor.');

process.exit(kirik.length ? 1 : 0);
