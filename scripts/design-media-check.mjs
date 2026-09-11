#!/usr/bin/env node
/**
 * Yerel tasarım medyasını ve içerikten yapılan /media/ referanslarını denetler.
 * Bu betik yalnızca okur; public/ veya src/content üzerinde değişiklik yapmaz.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MEDIA_DIR = join(ROOT, 'public', 'media');
const CONTENT_DIR = join(ROOT, 'src', 'content');
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp']);
const CONTENT_EXTENSIONS = new Set(['.astro', '.md', '.mdx', '.ts', '.tsx', '.yaml', '.yml', '.json']);
const MAX_WARNING_LINES = 30;
const LARGE_FILE_BYTES = 1.5 * 1024 * 1024;
const VISUAL_PATH = /[\\/]media[\\/](?:hero|vitrin|afisler|duyurular|ihtida|galeri)[\\/]/i;
const jsonOutput = process.argv.includes('--json');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function mapLimit(items, limit, fn) {
  const result = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      result[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, worker));
  return result;
}

function relativePath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

async function sha256(path) {
  const bytes = await readFile(path);
  return createHash('sha256').update(bytes).digest('hex');
}

function addWarning(summary, item) {
  summary.warnings.push(item);
}

function addError(summary, item) {
  summary.errors.push(item);
}

async function inspectAsset(path, summary) {
  const rel = relativePath(path);
  const extension = extname(path).toLowerCase();
  const info = { path: rel, extension };
  try {
    const fileStat = await stat(path);
    info.bytes = fileStat.size;
    info.hash = await sha256(path);
    const metadata = await sharp(path, { animated: extension === '.gif' }).metadata();
    info.width = metadata.width ?? 0;
    info.height = metadata.height ?? 0;
    info.format = metadata.format ?? extension.slice(1);
    if (!info.width || !info.height) addError(summary, `${rel}: görsel ölçüsü okunamadı`);
    if (info.bytes > LARGE_FILE_BYTES) addWarning(summary, `${rel}: ${(info.bytes / 1024 / 1024).toFixed(2)} MiB; WebP/thumb optimizasyonu değerlendirilmeli`);
    if (VISUAL_PATH.test(rel) && (info.width < 320 || info.height < 180)) {
      addWarning(summary, `${rel}: ${info.width}×${info.height}px; vitrinde düşük çözünürlük olabilir`);
    }
  } catch (error) {
    addError(summary, `${rel}: Sharp metadata hatası (${error instanceof Error ? error.message : String(error)})`);
  }
  return info;
}

async function referencedMedia() {
  const files = await walk(CONTENT_DIR);
  const references = [];
  for (const file of files) {
    if (!CONTENT_EXTENSIONS.has(extname(file).toLowerCase())) continue;
    const source = await readFile(file, 'utf8').catch(() => '');
    for (const match of source.matchAll(/\/media\/[\w./%+~:@-]+/g)) {
      const start = match.index ?? 0;
      const prefix = source.slice(Math.max(0, start - 8), start);
      if (prefix.includes('://')) continue;
      const reference = match[0].replace(/[.,;:)\]}]+$/g, '');
      references.push({ source: relativePath(file), reference });
    }
  }
  return references;
}

const summary = {
  mediaFiles: 0,
  rasterFiles: 0,
  skippedFiles: 0,
  referencedFiles: 0,
  duplicateGroups: 0,
  errors: [],
  warnings: [],
};

const allMedia = await walk(MEDIA_DIR);
summary.mediaFiles = allMedia.length;
const rasterFiles = allMedia.filter((path) => IMAGE_EXTENSIONS.has(extname(path).toLowerCase()));
summary.rasterFiles = rasterFiles.length;
summary.skippedFiles = allMedia.length - rasterFiles.length;
const inspected = await mapLimit(rasterFiles, 8, (path) => inspectAsset(path, summary));

const byHash = new Map();
for (const asset of inspected) {
  if (!asset?.hash) continue;
  const group = byHash.get(asset.hash) ?? [];
  group.push(asset.path);
  byHash.set(asset.hash, group);
}
for (const paths of byHash.values()) {
  if (paths.length > 1) {
    summary.duplicateGroups += 1;
    addWarning(summary, `Aynı içerik ${paths.length} dosyada tekrar ediyor: ${paths.slice(0, 4).join(', ')}${paths.length > 4 ? ' …' : ''}`);
  }
}

const references = await referencedMedia();
summary.referencedFiles = new Set(references.map(({ reference }) => reference)).size;
for (const { source, reference } of references) {
  const target = join(ROOT, 'public', reference.slice(1));
  const exists = await stat(target).then(() => true).catch(() => false);
  if (!exists) addError(summary, `${source}: eksik medya yolu ${reference}`);
}

const result = {
  ...summary,
  assets: inspected.filter(Boolean).map(({ path, extension, bytes, hash, width, height, format }) => ({ path, extension, bytes, hash, width, height, format })),
  errors: summary.errors,
  warnings: summary.warnings,
};
if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Tasarım medya denetimi: ${summary.mediaFiles} dosya | ${summary.rasterFiles} raster | ${summary.errors.length} hata | ${summary.warnings.length} uyarı`);
  if (summary.skippedFiles) console.log(`Atlanan raster olmayan medya: ${summary.skippedFiles}`);
  for (const message of summary.errors.slice(0, MAX_WARNING_LINES)) console.log(`HATA  ${message}`);
  for (const message of summary.warnings.slice(0, MAX_WARNING_LINES)) console.log(`UYARI ${message}`);
  if (summary.errors.length + summary.warnings.length > MAX_WARNING_LINES * 2) console.log('… diğer bulgular JSON çıktısında listelenir');
}
process.exitCode = summary.errors.length ? 1 : 0;
