// egitim/ uygulamasının derlenmiş çıktısını (egitim/dist) 127.0.0.1:4402'de sunar; Playwright egitim testleri ve
// elle inceleme için. Ana sitenin test sunucusuyla (scripts/test-onizle.mjs, 4401) aynı gerekçeyle programatik API.
import { preview } from 'astro';
import { fileURLToPath } from 'node:url';

const PORT = 4402;
const server = await preview({
  root: fileURLToPath(new URL('../egitim/', import.meta.url)),
  server: { host: '127.0.0.1', port: PORT, open: false },
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
