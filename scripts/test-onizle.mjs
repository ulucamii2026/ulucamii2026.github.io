// Astro CLI'nin ajan algılamasıyla arka plana geçmesini ve mevcut önizlemenin
// kilidiyle çakışmasını önlemek için desteklenen programatik API kullanılır.
import { preview } from 'astro';
import { fileURLToPath } from 'node:url';

const server = await preview({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { host: '127.0.0.1', port: 4401, open: false },
});
if (server.port !== 4401) {
  await server.stop();
  throw new Error('4401 portu kullanımda; başka porta veya sunucuya geçilmedi.');
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await server.stop(); process.exit(0);
});
