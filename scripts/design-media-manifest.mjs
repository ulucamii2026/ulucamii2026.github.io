#!/usr/bin/env node
/** Sharp denetiminden deterministik, kaynak kodda kullanılmayan medya kataloğu üretir. */
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const check = spawnSync(process.execPath, [join(ROOT, 'scripts', 'design-media-check.mjs'), '--json'], {
  cwd: ROOT, encoding: 'utf8', windowsHide: true,
});
if (check.error) throw check.error;
let report;
try { report = JSON.parse(check.stdout); } catch (error) {
  throw new Error(`Medya denetimi JSON üretmedi: ${error instanceof Error ? error.message : String(error)}`);
}
if (report.errors.length) {
  console.error(JSON.stringify(report.errors, null, 2));
  process.exitCode = 1;
} else {
  const manifest = {
    schemaVersion: 1,
    root: 'public/media',
    assets: report.assets.sort((a, b) => a.path.localeCompare(b.path, 'en')),
  };
  const destination = join(ROOT, 'docs', 'design', 'media-manifest.json');
  await mkdir(resolve(destination, '..'), { recursive: true });
  await writeFile(destination, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Medya manifesti yazıldı: ${manifest.assets.length} raster varlık → ${destination}`);
}
