/** Ağsız, tekrarlanabilir GAS dağıtım dosyası. Hiçbir özel belge/anahtar içermez. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const oku = p => readFile(new URL(p, root), 'utf8');
const assets = {
  sablonBytes: 'public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf',
  ek10SablonBytes: 'public/belgeler/ihtida/ek10-kvkk-acik-riza-metni.pdf',
  ek10V1SablonBytes: 'public/belgeler/ihtida/ek10-kvkk-acik-riza-metni-v1.pdf',
  fontBytes: 'public/fonts/Lora-Regular.ttf', fontKalinBytes: 'public/fonts/Lora-Bold.ttf',
  fontKaligrafiBytes: 'public/fonts/GreatVibes-Regular.ttf', fontElYazisiBytes: 'public/fonts/Caveat-Medium.ttf',
};
const encoded = {};
for (const [name, path] of Object.entries(assets)) encoded[name] = (await readFile(new URL(path, root))).toString('base64');
const built = await build({ entryPoints: [fileURLToPath(new URL('scripts/apps-script/ihtida-pdf-entry.js', root))], bundle: true, write: false, format: 'iife', globalName: 'IhtidaPdf', target: 'es2020', minify: true });
const defter = await build({ entryPoints: [fileURLToPath(new URL('public/admin/ihtida-defteri.js', root))], bundle: true, write: false, format: 'iife', globalName: 'IhtidaDefteri', target: 'es2020', minify: true });
const parts = await Promise.all(['scripts/apps-script/ulucamii-Kod-v28.gs', 'scripts/apps-script/ihtida-paket-isleri.gs', 'scripts/apps-script/ihtida-defteri-isleri.gs', 'public/vendor/pdf-lib.min.js', 'public/vendor/fontkit.umd.min.js'].map(oku));
const output = new URL('.codex/cikti/gas/ulucamii-v28.gs', root);
await mkdir(new URL('.', output), { recursive: true });
await writeFile(output, parts.join('\n;\n') + '\n;\n' + built.outputFiles[0].text + '\n;\n' + defter.outputFiles[0].text + '\nvar IHTIDA_PDF_KAYNAKLARI = ' + JSON.stringify(encoded) + ';\n');
console.log('GAS v28 derlendi; yalnız kod, açık şablonlar ve fontlar.');
