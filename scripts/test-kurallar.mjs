import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') || 'PATH';
// Test hesabı için ADC veya üretim token'ı kullanılmaz.
for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_TOKEN', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT', 'FIRESTORE_EMULATOR_HOST']) delete env[key];
const cache = join(homedir(), '.codex', 'tools', 'temurin-jre-21');
const javaHomes = [env.ULUCAMII_JAVA_HOME,
  ...(existsSync(cache) ? readdirSync(cache).map(name => join(cache, name)) : []), env.JAVA_HOME].filter(Boolean);
let java = 'java';
for (const home of javaHomes) {
  const candidate = join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!existsSync(candidate)) continue;
  const version = spawnSync(candidate, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (Number((version.stderr + version.stdout).match(/version "(\d+)/)?.[1]) >= 21) {
    env.JAVA_HOME = home; env[pathKey] = join(home, 'bin') + delimiter + (env[pathKey] || ''); java = candidate; break;
  }
}
const version = spawnSync(java, ['-version'], { env, encoding: 'utf8', windowsHide: true });
const javaMajor = Number((version.stderr ?? '').match(/version "(\d+)/)?.[1]);
if (!Number.isFinite(javaMajor) || javaMajor < 21 || version.error || version.status !== 0) {
  throw new Error('Java 21+ gerekli. docs/CODEX-CALISMA.md içindeki ULUCAMII_JAVA_HOME yönergesini izleyin.');
}
const firebase = env.ULUCAMII_FIREBASE_CLI || (process.platform === 'win32'
  ? join(env.APPDATA, 'npm', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')
  : '/usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js');
if (!existsSync(firebase)) throw new Error('Firebase CLI bulunamadı; ULUCAMII_FIREBASE_CLI ile firebase.js yolunu belirtin.');
// Başkasının çalışan emülatör verisini clearFirestore ile silme.
for (const port of [8185, 4485, 4585, 9150]) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`${port} portu kullanımda. Var olan süreci kapatmadım; test başlamadı.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
console.log('Yalıtılmış Firestore testi: demo-ulucamii / 127.0.0.1:8185. Canlı veriye bağlantı yok.');
const child = spawn(process.execPath, [firebase, 'emulators:exec', '--config', 'firebase.emulators.json',
  '--project', 'demo-ulucamii', '--only', 'firestore', `"${process.execPath}" --test tests/kurallar/firestore.test.mjs`],
{ cwd: root, env, stdio: 'inherit', windowsHide: true });
child.on('error', () => { console.error('Firebase emülatörü başlatılamadı.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
