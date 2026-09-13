import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export function epostaRender(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('veli-eposta-json');
  const c = vm.createContext({});
  for (const dosya of ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs']) {
    vm.runInContext(readFileSync(new URL('./apps-script/' + dosya, import.meta.url), 'utf8'), c, { filename: dosya, timeout: 1000 });
  }
  const secenekler = {};
  for (const alan of ['kurum', 'dugme', 'gorseller', 'liste', 'altNot', 'onIzleme']) {
    if (Object.hasOwn(data, alan)) secenekler[alan] = data[alan];
  }
  return Object.hasOwn(data, 'bloklar')
    ? c.veliEpostaZengin(data.bloklar, data.dil, data.baslik, secenekler)
    : c.veliEpostaDuzMetin(data.metin, data.dil, data.baslik, secenekler);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let data;
    try { data = JSON.parse(readFileSync(0, 'utf8')); } catch { throw new Error('veli-eposta-json'); }
    process.stdout.write(epostaRender(data));
  } catch (hata) { process.stderr.write('E-posta üretilemedi: ' + hata.message + '\n'); process.exitCode = 1; }
}
