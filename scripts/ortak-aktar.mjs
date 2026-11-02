#!/usr/bin/env node
/**
 * Paylaşılan öğrenme yolu modülünü (paylasilan/ogrenme-yolu/) ihtida platformuna kopyalar (İlim Yolu Dilim 3,
 * docs/ILIM-YOLU.md «Ortak kararlar» 1). Tek kaynak bu depodur; ihtida tarafındaki kopya elle değiştirilmez.
 *
 *   node scripts/ortak-aktar.mjs [--hedef D:/app/ihtida-platform] [--prova]
 *
 * Kopyalamadan önce her dosya taranır; tek bir eşleşme bile kopyayı durdurur:
 *  - hedef deponun izlenmeyen yerel listesi `<hedef>/.yerel/yasak-terimler.txt` (satır başına bir düzenli ifade, `#` yorum).
 *    Liste yoksa aktarım YAPILMAZ (kapalı başarısızlık): terimler herkese açık bir depoya yazılmamalı.
 *  - yerleşik denetimler: kurum adı (ulu camii), telefon numarası, e-posta adresi.
 * Kopya `<hedef>/src/ortak/ogrenme-yolu/` klasörüne gider (önce boşaltılır) ve yanına `SURUM.json` yazılır: dosya başına
 * SHA-256 + kaynak commit. İhtida tarafında `scripts/ortak-dogrula.mjs` bu özetleri derlemeden önce denetler.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(new URL('../', import.meta.url)));
const YERLESIK = [
  { ad: 'kurum adı', re: /ulu\s*camii/i },
  { ad: 'telefon', re: /\+?\d[\d ./-]{7,}\d/, urlHaric: true },
  { ad: 'e-posta', re: /[\w.+-]+@[\w-]+\.[\w.]+/, urlHaric: true },
];

function arg(ad, varsayilan) {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : varsayilan;
}

export function listeOku(yol) {
  if (!existsSync(yol)) return null;
  return readFileSync(yol, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'))
    .map((s) => ({ ad: 'yasak terim', re: new RegExp(s, 'iu') }));
}

function dosyalar(klasor) {
  return readdirSync(klasor).flatMap((ad) => {
    const yol = join(klasor, ad);
    return statSync(yol).isDirectory() ? dosyalar(yol) : [yol];
  }).sort();
}

/** Eşleşmeleri `dosya:satır (kural)` olarak döner; eşleşen metni yazmaz (günlüğe de terim düşmesin). */
export function tara(kaynak, kurallar) {
  const bulgular = [];
  for (const yol of dosyalar(kaynak)) {
    const satirlar = readFileSync(yol, 'utf8').split(/\r?\n/);
    satirlar.forEach((satir, i) => {
      const urlsuz = satir.replace(/https?:\/\/\S+/g, ' '); // adres içindeki sayı dizileri telefon sayılmaz
      for (const k of kurallar) if (k.re.test(k.urlHaric ? urlsuz : satir)) bulgular.push(`${relative(kaynak, yol)}:${i + 1} (${k.ad})`);
    });
  }
  return bulgular;
}

export function aktar({ kaynak, hedef, prova = false, commit = 'bilinmiyor' }) {
  const liste = listeOku(join(hedef, '.yerel', 'yasak-terimler.txt'));
  if (!liste) return { ok: false, neden: 'liste-yok' };
  if (!existsSync(kaynak)) return { ok: false, neden: 'kaynak-yok' };
  const bulgular = tara(kaynak, [...YERLESIK, ...liste]);
  if (bulgular.length) return { ok: false, neden: 'tarama', bulgular };
  const ozetler = Object.fromEntries(dosyalar(kaynak).map((yol) => [
    relative(kaynak, yol).split('\\').join('/'), createHash('sha256').update(readFileSync(yol)).digest('hex'),
  ]));
  const varis = join(hedef, 'src', 'ortak', 'ogrenme-yolu');
  if (!prova) {
    rmSync(varis, { recursive: true, force: true });
    for (const ad of Object.keys(ozetler)) {
      mkdirSync(dirname(join(varis, ad)), { recursive: true });
      writeFileSync(join(varis, ad), readFileSync(join(kaynak, ad)));
    }
    writeFileSync(join(varis, 'SURUM.json'), `${JSON.stringify({ kaynakCommit: commit, dosyalar: ozetler }, null, 2)}\n`);
  }
  return { ok: true, dosyaSayisi: Object.keys(ozetler).length, varis };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const hedef = resolve(arg('--hedef', 'D:/app/ihtida-platform'));
  let commit = 'bilinmiyor';
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: KOK, encoding: 'utf8' }).trim();
    const kirli = execFileSync('git', ['status', '--porcelain', '--', 'paylasilan/ogrenme-yolu'], { cwd: KOK, encoding: 'utf8' }).trim();
    if (kirli) commit += '+yerel-degisiklik';
  } catch { /* git yoksa commit «bilinmiyor» kalır */ }
  const sonuc = aktar({ kaynak: join(KOK, 'paylasilan', 'ogrenme-yolu'), hedef, prova: process.argv.includes('--prova'), commit });
  if (!sonuc.ok) {
    console.error(sonuc.neden === 'liste-yok'
      ? `Yasak terim listesi yok: ${join(hedef, '.yerel', 'yasak-terimler.txt')}. Aktarım yapılmadı.`
      : sonuc.neden === 'tarama' ? `Tarama ${sonuc.bulgular.length} eşleşme buldu; aktarım yapılmadı:\n  ${sonuc.bulgular.join('\n  ')}`
        : `Aktarım yapılmadı: ${sonuc.neden}`);
    process.exit(1);
  }
  console.log(`${process.argv.includes('--prova') ? 'Prova (yazılmadı)' : 'Aktarıldı'}: ${sonuc.dosyaSayisi} dosya → ${sonuc.varis}`);
}
