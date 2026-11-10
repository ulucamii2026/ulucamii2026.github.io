#!/usr/bin/env node
/**
 * İlim Yolu bilgi kartı seslendirmelerini içe alır (10 Kasım 2026).
 *
 *   node scripts/kart-ses-al.mjs [--kaynak <klasör>] [--kuru]
 *
 * Kaynak (varsayılan `D:\sesli-anlatim\ilim-yolu-kartlar`): `MANIFEST.json` (dizi: {id, lang, file, seconds, bytes, sha256}) ve `{tr,fr}/<id>.mp3`.
 * Her kayıt doğrulanır (kart kimliği var, dil tr/fr, dosya MP3, bayt ve sha256 tutuyor), sonra `public/media/ses/kart/<dil>/<id>.mp3` yoluna kopyalanır
 * ve `src/data/ilim-yolu/kart-ses.json` o klasördeki dosyalardan (sha256 ile) YENİDEN üretilir. Bozuk kayıt varsa hiçbir şey yazılmaz (çıkış 1).
 * Kaynak klasöre dokunulmaz (yalnız okunur). `--kuru`: yalnız doğrular ve ne yapılacağını yazar.
 * Test: tests/ilim-yolu-kart-ses.test.mjs (aynı `ice_al` işlevini geçici klasörlerle sınar).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TABAN = '/media/ses/kart';
const DILLER = ['tr', 'fr'];
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
  const hedefKlasor = join(kok, 'public', ...TABAN.split('/').filter(Boolean));
  const manifestYolu = join(kok, 'src/data/ilim-yolu/kart-ses.json');
  const kaynakManifest = JSON.parse(readFileSync(join(kaynak, 'MANIFEST.json'), 'utf8'));
  if (!Array.isArray(kaynakManifest)) throw new Error('MANIFEST.json bir dizi olmalı');
  const hatalar = [];
  const secilen = [];
  const goruldu = new Set();
  for (const k of kaynakManifest) {
    const ad = `${k?.lang}/${k?.id}`;
    if (!KIMLIK.test(String(k?.id)) || !kartlar.has(k.id)) { hatalar.push(`${ad}: kart kimliği yok`); continue; }
    if (!DILLER.includes(k.lang)) { hatalar.push(`${ad}: dil tr/fr değil`); continue; }
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = process.argv.slice(2);
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
