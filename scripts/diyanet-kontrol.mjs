/**
 * Diyanet kütüphanesi bağlantı denetimi (dijital.diyanet.gov.tr).
 *
 * NE DENETLER
 *   src/data/diyanet-yayinlar.json içindeki her kayıt için:
 *     1. Ürün sayfası (sayfaUrl) — 200 dönmeli VE "Sayfa Bulunamadı" içermemeli.
 *        (Diyanet olmayan kitap için de 200 döner, gövdeye bakmak şart.)
 *     2. PDF (pdf) — ilk 1 KB %PDF ile başlamalı, Content-Range toplam boyutu vermeli,
 *        son 1 KB'de %%EOF bulunmalı.
 *     3. EPUB (epub, varsa) — ilk baytlar ZIP imzası (PK) olmalı.
 *
 * NEDEN BÖYLE
 *   - HEAD isteği bu sunucuda 405 döner; GET şart.
 *   - Site haritasındaki 49 Fransızca kaydın 11'i 8 Eyl 2026'da çoktan ölüydü; ölü ürün
 *     sayfası HTTP 200 + "Sayfa Bulunamadı!" gövdesi döndürüyor, koda bakmak yetmiyor.
 *   - Cami broşürü (id=510) 1,7 MB bildirip gövdeyi 21 KB'de kesiyordu (üç bağımsız
 *     denemede aynı). Aralık istekleri sağlam cevap verdiği hâlde tam indirme kesiliyor —
 *     bu yüzden listeye alınmadı. Aynı arıza başka bir kitapta çıkarsa `--tam` yakalar.
 *
 * KULLANIM
 *   node scripts/diyanet-kontrol.mjs          bütün kayıtlar, aralık istekleriyle (~7 dk, ~1 MB)
 *   node scripts/diyanet-kontrol.mjs --dil fr  yalnız bir dilin kayıtları (hızlı gözden geçirme)
 *   node scripts/diyanet-kontrol.mjs --tam    her PDF'i baştan sona indirip bayt sayar
 *                                                (~450 MB — elle, ayda bir yeter)
 *   node scripts/diyanet-kontrol.mjs --ayrinti  çalışanları da yazar
 *
 * ÇIKIŞ KODU: sorunlu kayıt varsa 1.
 */
import { readFileSync } from 'node:fs';

const TAM = process.argv.includes('--tam');
const DIL_SUZ = (process.argv.find((a) => a.startsWith('--dil=')) || '').slice(6)
  || (process.argv.includes('--dil') ? process.argv[process.argv.indexOf('--dil') + 1] : '');
const AYRINTI = process.argv.includes('--ayrinti');
const ZAMAN_ASIMI = 60000;
const ARA = 300;
const BASLIK = { 'User-Agent': 'Mozilla/5.0 (compatible; UluCamiiLinkCheck/1.0; +https://ulucamii.be)' };

const veri = JSON.parse(readFileSync(new URL('../src/data/diyanet-yayinlar.json', import.meta.url), 'utf8'));
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/* Ağ hataları aralıklı olur: --tam koşusunda arka arkaya onlarca MB indirilince sunucu
   ilk isteklerde CONNECT_TIMEOUT verebiliyor (8 Eyl 2026'da ilk dört kayıtta oldu, aynı
   adresler hızlı denetimde sorunsuzdu). Bu yüzden her istek artan beklemeyle üç kez denenir. */
async function iste(adres, ekBaslik = {}) {
  let sonHata = null;
  for (let deneme = 1; deneme <= 3; deneme++) {
    const kontrol = new AbortController();
    const sayac = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI);
    try {
      return await fetch(adres, { redirect: 'follow', signal: kontrol.signal, headers: { ...BASLIK, ...ekBaslik } });
    } catch (e) {
      sonHata = e;
      if (deneme < 3) await bekle(3000 * deneme);
    } finally {
      clearTimeout(sayac);
    }
  }
  throw sonHata;
}

/** Gövdeyi sonuna kadar okur ve yalnız bayt sayar (belleğe almaz). */
async function baytSay(cevap) {
  let n = 0;
  for await (const parca of cevap.body) n += parca.length;
  return n;
}

const sorunlar = [];
const not = (kayit, mesaj) => sorunlar.push(`${kayit.id} · ${kayit.baslik} — ${mesaj}`);

/* --dil verilmezse bütün diller denetlenir. */
const kayitlar = DIL_SUZ ? veri.yayinlar.filter((k) => k.dilKodu === DIL_SUZ) : veri.yayinlar;
if (DIL_SUZ && !kayitlar.length) {
  console.error(`«${DIL_SUZ}» dilinde kayıt yok. Diller: ${veri.diller.map((d) => d.kod).join(', ')}`);
  process.exit(2);
}

console.log(`\nDiyanet kütüphanesi — ${kayitlar.length} kayıt${DIL_SUZ ? ` (dil: ${DIL_SUZ})` : ''}${TAM ? ' (TAM indirme)' : ''}\n`);

for (const k of kayitlar) {
  const satir = [];
  try {
    /* 1 — ürün sayfası */
    const s = await iste(k.sayfaUrl);
    const govde = await s.text();
    if (!s.ok) not(k, `ürün sayfası ${s.status}`);
    else if (/Sayfa Bulunamad/i.test(govde)) not(k, 'ürün sayfası yayından kalkmış (Sayfa Bulunamadı)');
    else satir.push('sayfa ✓');

    /* 2 — PDF */
    const bas = await iste(k.pdf, { Range: 'bytes=0-1023' });
    const ilk = Buffer.from(await bas.arrayBuffer());
    if (!ilk.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      not(k, `PDF başlığı %PDF değil (kod ${bas.status})`);
    } else {
      const aralik = bas.headers.get('content-range'); // "bytes 0-1023/3073878"
      const toplam = aralik ? Number(aralik.split('/')[1]) : null;
      if (!toplam) {
        not(k, 'sunucu Content-Range vermedi, boyut doğrulanamadı');
      } else {
        if (k.boyut && Math.abs(toplam - k.boyut) > 1024) {
          not(k, `boyut değişmiş: veri ${k.boyut}, sunucu ${toplam} — sayfa sayısı da güncellenmeli`);
        }
        const kuyruk = await iste(k.pdf, { Range: `bytes=${Math.max(0, toplam - 1024)}-${toplam - 1}` });
        const son = Buffer.from(await kuyruk.arrayBuffer());
        if (!son.includes('%%EOF')) not(k, 'PDF sonunda %%EOF yok — dosya bozuk olabilir');
        else satir.push(`pdf ✓ ${(toplam / 1048576).toFixed(1)} MB`);

        if (TAM) {
          const tumu = await iste(k.pdf);
          const gelen = await baytSay(tumu);
          if (Math.abs(gelen - toplam) > 1024) not(k, `tam indirme kesildi: ${gelen}/${toplam} bayt (id=510 arızası)`);
          else satir.push('tam ✓');
        }
      }
    }

    /* 3 — EPUB */
    if (k.epub) {
      const e = await iste(k.epub, { Range: 'bytes=0-15' });
      const b = Buffer.from(await e.arrayBuffer());
      if (b.subarray(0, 2).toString() !== 'PK') not(k, `EPUB ZIP değil (kod ${e.status})`);
      else satir.push('epub ✓');
    }
  } catch (e) {
    not(k, `ağ hatası: ${e?.cause?.code || e?.name || e}`);
  }

  if (AYRINTI) console.log(`  ${k.id.padEnd(6)} ${satir.join(' · ')}  ${k.baslik}`);
  await bekle(ARA);
}

console.log('');
if (sorunlar.length) {
  console.log(`SORUNLU KAYIT: ${sorunlar.length}`);
  for (const s of sorunlar) console.log('  ' + s);
  console.log('\nDüzeltme: kaydı src/data/diyanet-yayinlar.json içinden çıkarın ya da');
  console.log('dijital.diyanet.gov.tr üzerinde yeni adresini bulup güncelleyin.');
} else {
  console.log(`Bütün kayıtlar sağlam (${kayitlar.length}/${kayitlar.length}).`);
}
process.exit(sorunlar.length ? 1 : 0);
