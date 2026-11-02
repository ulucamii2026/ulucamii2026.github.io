// esbuild ile tek dosyaya paketler: ../src/lib/** içindeki saf kod da içeri alınabilir.
// firebase-admin / firebase-functions paketlenmez; dağıtımda npm ile kurulur (dependencies).
import { build } from 'esbuild';
import { statSync } from 'node:fs';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['firebase-admin', 'firebase-admin/*', 'firebase-functions', 'firebase-functions/*'],
  sourcemap: false,
  logLevel: 'warning',
});
console.log(`functions/lib/index.js: ${statSync('lib/index.js').size} bayt`);
