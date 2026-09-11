#!/usr/bin/env node
/** Görsel sözleşmenin dosyalarda gerçekten mevcut olduğunu hızlıca doğrular. */
import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const jsonOutput = process.argv.includes('--json');
const requiredFiles = [
  'docs/design/DESIGN.md',
  'docs/design/surfaces/ana-sayfa.md',
  'docs/design/surfaces/ihtida.md',
  'docs/design/surfaces/veli-portali.md',
  'docs/design/media-manifest.json',
  'src/styles/tokens.css',
];
const requiredAliases = [
  '--surface-page', '--surface-raised', '--surface-muted', '--text-primary',
  '--text-secondary', '--border-subtle', '--border-strong', '--accent-action',
  '--accent-link', '--focus-ring', '--content-max', '--motion-standard', '--motion-reveal',
];
const errors = [];
const warnings = [];
const contents = new Map();

for (const file of requiredFiles) {
  const path = join(ROOT, file);
  try {
    await access(path);
    contents.set(file, await readFile(path, 'utf8'));
  } catch {
    errors.push(`${file}: dosya yok veya okunamıyor`);
  }
}

const global = await readFile(join(ROOT, 'src', 'styles', 'global.css'), 'utf8').catch(() => '');
const tokens = contents.get('src/styles/tokens.css') ?? '';
const mediaManifest = contents.get('docs/design/media-manifest.json') ?? '';
if (mediaManifest) {
  try {
    const parsed = JSON.parse(mediaManifest);
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.assets)) errors.push('media-manifest.json: şema veya assets dizisi geçersiz');
  } catch {
    errors.push('media-manifest.json: geçerli JSON değil');
  }
}
for (const alias of requiredAliases) {
  if (!tokens.includes(`${alias}:`)) errors.push(`tokens.css: ${alias} takma adı eksik`);
}
for (const marker of ['@theme', '--font-serif', '--font-sans', ':focus-visible', 'prefers-reduced-motion']) {
  if (!global.includes(marker)) errors.push(`global.css: ${marker} sözleşmesi eksik`);
}
if (/https?:\/\/[^\s)]*(?:fonts\.googleapis|use\.typekit|fonts\.bunny)/i.test(`${global}\n${tokens}`)) {
  errors.push('Yerel yazı tipi kuralı: harici font URL’si bulundu');
}
if (!global.includes('@import "./tokens.css"')) warnings.push('global.css: tokens.css importu farklı yazımla olabilir; elle kontrol edin');
if (!contents.get('docs/design/DESIGN.md')?.includes('Kilim Kartografyası')) warnings.push('DESIGN.md: mevcut görsel dünya adı bulunamadı');

const result = { files: requiredFiles.length, aliases: requiredAliases.length, errors, warnings };
if (jsonOutput) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Tasarım token denetimi: ${errors.length} hata | ${warnings.length} uyarı`);
  for (const message of errors) console.log(`HATA  ${message}`);
  for (const message of warnings) console.log(`UYARI ${message}`);
}
process.exitCode = errors.length ? 1 : 0;
