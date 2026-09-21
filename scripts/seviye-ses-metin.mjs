#!/usr/bin/env node
/** Seviye testi — sesli okuma klipleri: iş listesi, manifest ve güncellik denetimi.
 *
 *    node scripts/seviye-ses-metin.mjs --is-listesi <dosya.json>   üretilecek kliplerin listesi (eksikler)
 *    node scripts/seviye-ses-metin.mjs --manifest                   src/data/seviye-sesler.json yeniden yazılır
 *    node scripts/seviye-ses-metin.mjs --denetle                    manifest güncel mi, yetim/boş dosya var mı
 *
 *  Klip kimliği seslendirilen metnin özetidir (dil + ses sürümü + metin): soru metni değişirse eski
 *  klip kendiliğinden devre dışı kalır, yanlış metin okunmaz. Sesleri `scripts/seviye-ses-uret.py` üretir.
 *  Manifest YALNIZ diskte bulunan klipleri listeler; klibi olmayan soruda dinleme düğmesi hiç çıkmaz. */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEYAN, EZBER, MADDELER } from '../src/lib/seviye-testi/index.ts';
import { beyanOkumaMetni, ezberOkumaMetni, maddeOkumaMetni } from '../src/lib/seviye-testi/sesli-okuma.ts';
import { seviyeMetinleri } from '../src/i18n/seviye-testi.ts';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const SES_KLASORU = join(KOK, 'public', 'media', 'ses', 'seviye');
const MANIFEST = join(KOK, 'src', 'data', 'seviye-sesler.json');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
/** Ses, üslup ya da metin kalıbı değişirse artırılır: bütün klipler yeniden üretilir. */
export const SES_SURUMU = 1;
export const SES_ADI = 'Iapetus';

const kimlik = (dil, metin) => createHash('sha256').update(`${dil}\n${SES_SURUMU}\n${metin}`, 'utf8').digest('hex').slice(0, 16);

export function klipler() {
  const liste = [];
  for (const dil of DILLER) {
    const m = seviyeMetinleri[dil];
    const ekle = (id, metin) => { if (metin) liste.push({ dil, id, kimlik: kimlik(dil, metin), metin }); };
    for (const madde of MADDELER) if (!madde.emekli) ekle(madde.id, maddeOkumaMetni(madde, dil, m.soru.bilmiyorum));
    for (const b of BEYAN) ekle(b.id, beyanOkumaMetni(b, dil));
    for (const e of EZBER) ekle(e.id, ezberOkumaMetni(e, dil, m.ezber.durumlar));
  }
  return liste;
}

const dosya = (k) => join(SES_KLASORU, k.dil, `${k.kimlik}.mp3`);
const var_ = (k) => existsSync(dosya(k)) && statSync(dosya(k)).size > 2000;

function manifestUret() {
  const diller = Object.fromEntries(DILLER.map((d) => [d, {}]));
  for (const k of klipler()) if (var_(k)) diller[k.dil][k.id] = k.kimlik;
  return `${JSON.stringify({ surum: SES_SURUMU, ses: SES_ADI, diller }, null, 1)}\n`;
}

const arg = process.argv.slice(2);
if (arg[0] === '--is-listesi') {
  const tum = klipler();
  const benzersiz = [...new Map(tum.map((k) => [`${k.dil}/${k.kimlik}`, k])).values()];
  const eksik = benzersiz.filter((k) => !var_(k)).map(({ dil, kimlik: kim, metin }) => ({ dil, kimlik: kim, metin, hedef: join(SES_KLASORU, dil, `${kim}.mp3`) }));
  writeFileSync(arg[1], JSON.stringify({ ses: SES_ADI, klipler: eksik }, null, 1), 'utf8');
  console.log(`Soru: ${tum.length} · benzersiz klip: ${benzersiz.length} · eksik: ${eksik.length} → ${arg[1]}`);
} else if (arg[0] === '--manifest') {
  writeFileSync(MANIFEST, manifestUret(), 'utf8');
  const tum = klipler();
  console.log(`Manifest yazıldı: ${tum.filter(var_).length} / ${tum.length} sorunun klibi var.`);
} else if (arg[0] === '--denetle') {
  const hatalar = [];
  const beklenen = manifestUret();
  if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf8').replace(/\r\n/g, '\n') !== beklenen) hatalar.push('src/data/seviye-sesler.json güncel değil → npm run seviye:ses -- --manifest');
  const kullanilan = new Set(klipler().map((k) => `${k.dil}/${k.kimlik}.mp3`));
  for (const dil of DILLER) {
    const klasor = join(SES_KLASORU, dil);
    if (!existsSync(klasor)) continue;
    for (const ad of readdirSync(klasor)) if (!kullanilan.has(`${dil}/${ad}`)) hatalar.push(`Yetim klip (hiçbir soru kullanmıyor): public/media/ses/seviye/${dil}/${ad}`);
  }
  const tum = klipler();
  const eksik = tum.filter((k) => !var_(k));
  if (hatalar.length) { console.error(hatalar.join('\n')); process.exit(1); }
  console.log(`Sesli okuma klipleri güncel: ${tum.length - eksik.length} / ${tum.length} soru seslendirilmiş${eksik.length ? ` (eksik ${eksik.length}: düğme yalnız klibi olan soruda çıkar)` : ''}.`);
} else {
  console.error('Kullanım: --is-listesi <dosya> | --manifest | --denetle');
  process.exit(2);
}
