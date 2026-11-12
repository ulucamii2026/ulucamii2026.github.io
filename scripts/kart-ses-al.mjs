#!/usr/bin/env node
/**
 * İlim Yolu bilgi kartı seslendirmelerini içe alır ve denetler (10 Kasım 2026).
 *
 *   node scripts/kart-ses-al.mjs [--kaynak <klasör>] [--kuru]   MP3'leri içe alır, manifesti yeniden üretir
 *   node scripts/kart-ses-al.mjs --denetle [--dist]             manifestteki her dosya var mı, bayt ve sha256 tutuyor mu (egitim:build çalıştırır)
 *
 * Barındırma: sesler egitim Firebase Hosting'in kendi alanında, aynı kökenden çalar: `egitim/public/media/ses/kart/<dil>/<id>.mp3`.
 * O klasör git'te YOK (.gitignore; 98 MB); git'te yalnız `src/data/ilim-yolu/kart-ses.json` (kimlik, dil, süre, bayt, sha256) durur.
 * Temiz klonda dosyalar yoktur: `--denetle` açık iletiyle başarısız olur, egitim derlemesi/yayını durur; geri getirme: bu betik (`--kaynak` ile).
 * Kaynak (varsayılan `D:\sesli-anlatim\ilim-yolu-kartlar`): `MANIFEST.json` (tr/fr) ve `MANIFEST-{en,nl,de}.json` (dizi: {id, lang, file, seconds, bytes, sha256}) ile `{tr,fr,en,nl,de}/<id>.mp3`.
 * Her kayıt doğrulanır (kart kimliği var, dil tr/fr/en/nl/de, dosya MP3, bayt ve sha256 tutuyor), sonra kopyalanır; manifest hedef klasördeki dosyalardan
 * (sha256 ile) YENİDEN üretilir. Bozuk kayıt varsa hiçbir şey yazılmaz (çıkış 1). Kaynak klasöre dokunulmaz. `--kuru`: yalnız doğrular.
 * HARIC: imam onayı bekleyen üç tecvid kartının (ku-044/047/048) fr/en/nl/de sesi (Arapça terimlerin okunuşu) içe alınmaz; o kartlarda bu dillerde «Dinleyin» çıkmaz (en/nl/de'de kaynakta zaten yok).
 * Test: tests/ilim-yolu-kart-ses.test.mjs (aynı işlevleri geçici klasörlerle sınar).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TABAN = '/media/ses/kart';
const PUBLIC = ['egitim', 'public']; // ses dosyalarının yeri: egitim Hosting'in public klasörü (git dışı)
export const HARIC = new Set(['fr', 'en', 'nl', 'de'].flatMap((d) => ['ku-044', 'ku-047', 'ku-048'].map((id) => `${d}/${id}`)));
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KIMLIK = /^[a-z0-9-]+$/;

const sha256 = (yol) => createHash('sha256').update(readFileSync(yol)).digest('hex');
// MP3: ID3 etiketi ya da çerçeve eşzamanı (0xFFEx / 0xFFFx).
const mp3Mi = (yol) => {
  const b = readFileSync(yol);
  return b.length > 4 && ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));
};

/** Kart kimlikleri: src/data/ilim-yolu/kartlar/*.json */
export function kartKimlikleri(kok = KOK) {
  const klasor = join(kok, 'src/data/ilim-yolu/kartlar');
  const idler = new Set();
  for (const ad of readdirSync(klasor).filter((a) => a.endsWith('.json'))) {
    for (const k of JSON.parse(readFileSync(join(klasor, ad), 'utf8')).kartlar) idler.add(k.id);
  }
  return idler;
}

/**
 * İçe alma çekirdeği. `secenek`: { kaynak, kok, kartlar (Set), kuru }. Döner: { kopyalanan, toplam, manifest }; hata varsa fırlatır.
 * `kok`: depo kökü (public/ ve src/ burada); testler geçici klasör verir.
 */
export function ice_al({ kaynak, kok = KOK, kartlar = kartKimlikleri(kok), kuru = false }) {
  const hedefKlasor = join(kok, ...PUBLIC, ...TABAN.split('/').filter(Boolean));
  const manifestYolu = join(kok, 'src/data/ilim-yolu/kart-ses.json');
  // tr/fr: MANIFEST.json; en/nl/de (12 Kasım 2026): MANIFEST-<dil>.json (ek alan `match` yoksayılır); olanlar okunur.
  const kaynakManifest = [];
  for (const ad of ['MANIFEST.json', ...DILLER.map((d) => `MANIFEST-${d}.json`)]) {
    const yol = join(kaynak, ad);
    if (ad !== 'MANIFEST.json' && !existsSync(yol)) continue;
    const dizi = JSON.parse(readFileSync(yol, 'utf8'));
    if (!Array.isArray(dizi)) throw new Error(`${ad} bir dizi olmalı`);
    kaynakManifest.push(...dizi);
  }
  const hatalar = [];
  const secilen = [];
  const goruldu = new Set();
  for (const k of kaynakManifest) {
    if (HARIC.has(`${k?.lang}/${k?.id}`)) continue;
    const ad =`${k?.lang}/${k?.id}`;
    if (!KIMLIK.test(String(k?.id)) || !kartlar.has(k.id)) { hatalar.push(`${ad}: kart kimliği yok`); continue; }
    if (!DILLER.includes(k.lang)) { hatalar.push(`${ad}: dil geçersiz (tr, fr, en, nl, de)`); continue; }
    if (goruldu.has(ad)) { hatalar.push(`${ad}: tekrarlı kayıt`); continue; }
    goruldu.add(ad);
    if (k.file !== `${k.lang}/${k.id}.mp3`) { hatalar.push(`${ad}: dosya yolu beklenen değil (${k.file})`); continue; }
    const yol = join(kaynak, k.file);
    if (!existsSync(yol)) { hatalar.push(`${ad}: dosya yok`); continue; }
    if (!mp3Mi(yol)) { hatalar.push(`${ad}: MP3 değil`); continue; }
    if (statSync(yol).size !== k.bytes) { hatalar.push(`${ad}: bayt tutmuyor`); continue; }
    if (sha256(yol) !== k.sha256) { hatalar.push(`${ad}: sha256 tutmuyor`); continue; }
    secilen.push({ ...k, yol });
  }
  if (hatalar.length) throw new Error(`İçe alma durdu, hiçbir şey yazılmadı:\n- ${hatalar.join('\n- ')}`);

  let kopyalanan = 0;
  if (!kuru) {
    for (const k of secilen) {
      const hedef = join(hedefKlasor, k.lang, `${k.id}.mp3`);
      if (existsSync(hedef) && sha256(hedef) === k.sha256) continue;
      mkdirSync(dirname(hedef), { recursive: true });
      copyFileSync(k.yol, hedef);
      kopyalanan++;
    }
  } else kopyalanan = secilen.length;

  // Manifest: hedef klasördeki dosyalar (kuru kipte: mevcut dosyalar + seçilenler) — sha256 ve bayt dosyadan hesaplanır, süre kaynaktan/önceki manifestten gelir.
  const onceki = existsSync(manifestYolu) ? JSON.parse(readFileSync(manifestYolu, 'utf8')) : { kartlar: {} };
  const sureler = new Map(secilen.map((k) => [`${k.lang}/${k.id}`, k.seconds]));
  const kartlarSon = {};
  const ekle = (dil, id, yol) => {
    const sn = sureler.get(`${dil}/${id}`) ?? onceki.kartlar?.[id]?.[dil]?.sn ?? null;
    (kartlarSon[id] ??= {})[dil] = { bayt: statSync(yol).size, sn: sn === null ? null : Number(sn), sha256: sha256(yol) };
  };
  for (const dil of DILLER) {
    const klasor = join(hedefKlasor, dil);
    if (!existsSync(klasor)) continue;
    for (const dosya of readdirSync(klasor).filter((a) => a.endsWith('.mp3')).sort()) ekle(dil, dosya.replace(/\.mp3$/, ''), join(klasor, dosya));
  }
  if (kuru) for (const k of secilen) ekle(k.lang, k.id, k.yol);
  const siraliKartlar = Object.fromEntries(Object.keys(kartlarSon).sort().map((id) => [id, Object.fromEntries(DILLER.filter((d) => kartlarSon[id][d]).map((d) => [d, kartlarSon[id][d]]))]));
  const manifest = { v: 1, taban: TABAN, kartlar: siraliKartlar };
  if (!kuru) writeFileSync(manifestYolu, `${JSON.stringify(manifest, null, 2)}\n`);
  return { kopyalanan, toplam: secilen.length, manifest };
}

/**
 * Denetim: manifestteki her ses dosyası `<klasör>/<dil>/<id>.mp3` olarak var, bayt ve sha256 tutuyor; klasörde manifestsiz dosya yok;
 * HARIC kayıtlar manifestte yok. `klasor`: varsayılan egitim/public/media/ses/kart; `--dist` egitim/dist/media/ses/kart (derlenmiş çıktı).
 * Döner: hata iletilerinin listesi (boş = tamam).
 */
export function denetle({ kok = KOK, dist = false } = {}) {
  const klasor = join(kok, 'egitim', dist ? 'dist' : 'public', ...TABAN.split('/').filter(Boolean));
  const m = JSON.parse(readFileSync(join(kok, 'src/data/ilim-yolu/kart-ses.json'), 'utf8'));
  const hatalar = [];
  const beklenen = new Set();
  for (const [id, diller] of Object.entries(m.kartlar)) {
    for (const [dil, k] of Object.entries(diller)) {
      const ad = `${dil}/${id}.mp3`;
      beklenen.add(ad);
      if (HARIC.has(`${dil}/${id}`)) { hatalar.push(`${ad}: onay bekleyen kart, manifestte olmamalı`); continue; }
      const yol = join(klasor, ad);
      if (!existsSync(yol)) hatalar.push(`${ad}: dosya yok`);
      else if (statSync(yol).size !== k.bayt) hatalar.push(`${ad}: bayt tutmuyor`);
      else if (sha256(yol) !== k.sha256) hatalar.push(`${ad}: sha256 tutmuyor`);
    }
  }
  for (const dil of DILLER) {
    const d = join(klasor, dil);
    if (existsSync(d)) for (const a of readdirSync(d)) if (!beklenen.has(`${dil}/${a}`)) hatalar.push(`${dil}/${a}: manifestte yok (yetim dosya)`);
  }
  return hatalar;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = process.argv.slice(2);
  if (a.includes('--denetle')) {
    const hatalar = denetle({ dist: a.includes('--dist') });
    if (hatalar.length) {
      const goster = hatalar.slice(0, 12).map((h) => `- ${h}`).join('\n');
      console.error(`Kart seslendirme denetimi BAŞARISIZ (${hatalar.length} sorun). Sesler git'te değildir; manifest ile dosyalar tutmalı.\n${goster}${hatalar.length > 12 ? `\n- … ve ${hatalar.length - 12} tane daha` : ''}\nGeri getirme: node scripts/kart-ses-al.mjs   (kaynak: D:\\sesli-anlatim\\ilim-yolu-kartlar; ayrıntı docs/ILIM-YOLU.md «Kart seslendirmesi»)`);
      process.exit(1);
    }
    console.log(`Kart seslendirme denetimi tamam${a.includes('--dist') ? ' (egitim/dist)' : ''}.`);
    process.exit(0);
  }
  const i = a.indexOf('--kaynak');
  const kaynak = resolve(i >= 0 && a[i + 1] ? a[i + 1] : 'D:/sesli-anlatim/ilim-yolu-kartlar');
  try {
    const s = ice_al({ kaynak, kuru: a.includes('--kuru') });
    console.log(`${a.includes('--kuru') ? '[kuru] ' : ''}Kayıt ${s.toplam}, kopyalanan ${s.kopyalanan}, manifestteki kart ${Object.keys(s.manifest.kartlar).length}`);
  } catch (h) {
    console.error(h.message);
    process.exit(1);
  }
}
