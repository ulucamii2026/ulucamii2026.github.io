// egitim/ uygulamasının derlenmiş çıktısını (egitim/dist) 127.0.0.1:4402'de sunar; Playwright egitim testleri ve
// elle inceleme için. Ana sitenin test sunucusuyla (scripts/test-onizle.mjs, 4401) aynı gerekçeyle programatik API.
// Hosting'deki güvenlik başlıkları (firebase.json, egitim sitesinin `**` kuralı: CSP, nosniff…) burada da gönderilir;
// ekran testleri gerçek CSP altında koşar. firebase.json yalnız okunur, canlıya bağlanılmaz.
import { readFileSync } from 'node:fs';
import { preview } from 'astro';
import { fileURLToPath } from 'node:url';

const PORT = 4402;
const hosting = [JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8')).hosting].flat();
const egitim = hosting.find((h) => h?.public === 'egitim/dist');
const genel = egitim?.headers?.find((k) => k.source === '**');
if (!genel) throw new Error('firebase.json: egitim/dist sitesinin `**` başlık kuralı bulunamadı.');
const headers = Object.fromEntries(genel.headers.map(({ key, value }) => [key, value]));

const server = await preview({
  root: fileURLToPath(new URL('../egitim/', import.meta.url)),
  server: { host: '127.0.0.1', port: PORT, open: false, headers },
});
if (server.port !== PORT) {
  await server.stop();
  throw new Error(`${PORT} portu kullanımda; başka porta veya sunucuya geçilmedi.`);
}
const keepAlive = setInterval(() => {}, 60_000);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  clearInterval(keepAlive);
  await server.stop(); process.exit(0);
});
await new Promise(() => {});
