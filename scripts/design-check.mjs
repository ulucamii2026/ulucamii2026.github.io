#!/usr/bin/env node
/** Tasarım kapısını tek komutla çalıştırır; canlıya yayın yapmaz. */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const json = process.argv.includes('--json');
const checks = [
  ['token', 'scripts/design-token-check.mjs'],
  ['medya', 'scripts/design-media-check.mjs'],
];
let failed = false;
const reports = [];
for (const [label, script] of checks) {
  const args = [resolve(ROOT, script)];
  if (json) args.push('--json');
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: json ? 'pipe' : 'inherit', encoding: 'utf8', windowsHide: true });
  if (json) {
    let report;
    try { report = JSON.parse(result.stdout || '{}'); } catch { report = { raw: result.stdout || '' }; }
    reports.push({ label, code: result.status ?? 1, report });
    if (result.stderr) process.stderr.write(result.stderr);
  }
  if (result.error || result.status !== 0) {
    failed = true;
    if (result.error) console.error(`${label} denetimi başlatılamadı: ${result.error.message}`);
  }
}
if (json) console.log(JSON.stringify({ ok: !failed, checks: reports }, null, 2));
if (failed) {
  console.error('Tasarım kapısı başarısız: yukarıdaki hatalar düzeltilmeli.');
  process.exitCode = 1;
} else {
  console.log('Tasarım kapısı başarılı: token ve medya sözleşmeleri geçerli.');
}
