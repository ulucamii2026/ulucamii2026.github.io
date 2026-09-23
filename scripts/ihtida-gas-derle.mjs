/** 23 Eyl 2026: v40 (kayıt/ihtida uçlarına sunucu tarafı hacim sınırı + tuzak alan) — 21 Eyl 2026: v39 (site dilleri + nl/de; seviye testi form sürümü 2: yer bilgisi ve isteğe bağlı paylaşım onayları) — 20 Eyl 2026: v38 (seviye tespit testi `tur:'seviye'`, `olcek` e-posta bloğu) — 14 Eyl 2026 (3): v36 (veli-cuma özellikleri cuma başına tek kayıt + bakım ucu; ayar ekranı yeniden düzenlenebilir) — 14 Eyl 2026 (2): v35 (çeviri motoru Gemini + Google Translate yedeği) — 14 Eyl 2026: v34 (ders defteri çevirisi ucu `tur: 'cevir'`) — 13 Eyl 2026: v31 (v30 kurumsal e-posta kimliği + iletişim bloğu düzeltmesi) tam PDF paketiyle derler. Ağsız, tekrarlanabilir GAS dağıtım dosyası. Hiçbir özel belge/anahtar içermez. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { kimlikDenetle } from './kimlik-uret.mjs';
const kimlikKontrol = await kimlikDenetle();
if (kimlikKontrol.hatalar.length) throw new Error('Önce npm run kimlik:uret: ' + kimlikKontrol.hatalar.join(', '));
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
// v38: seviye tespit testinin bankası, puanlaması ve metinleri sunucuya tek kaynaktan gider.
const seviye = await build({ entryPoints: [fileURLToPath(new URL('src/lib/seviye-testi/gas-giris.ts', root))], bundle: true, write: false, format: 'iife', globalName: 'SeviyeTesti', target: 'es2020', minify: true });
const parts = await Promise.all(['scripts/apps-script/kimlik-sabitler.gs', 'scripts/apps-script/ulucamii-Kod-v40.gs', 'scripts/apps-script/ihtida-paket-isleri.gs', 'scripts/apps-script/ihtida-defteri-isleri.gs', 'scripts/apps-script/veli-mail-listesi.gs', 'scripts/apps-script/veli-eposta-sablon.gs', 'scripts/apps-script/veli-cuma.gs', 'scripts/apps-script/seviye-testi-isleri.gs', 'public/vendor/pdf-lib.min.js', 'public/vendor/fontkit.umd.min.js'].map(oku));
const output = new URL('.codex/cikti/gas/ulucamii-v40.gs', root);
await mkdir(new URL('.', output), { recursive: true });
await writeFile(output, parts.join('\n;\n') + '\n;\n' + built.outputFiles[0].text + '\n;\n' + defter.outputFiles[0].text + '\n;\n' + seviye.outputFiles[0].text + '\nvar IHTIDA_PDF_KAYNAKLARI = ' + JSON.stringify(encoded) + ';\n');
console.log('GAS v40 derlendi; kimlik sabitleri, kod, açık şablonlar ve fontlar.');
