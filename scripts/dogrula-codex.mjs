import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Bu betiği npm run dogrula:codex ile başlatın.');
const results = [];
async function run(task) {
  console.log(`\nKalite kapısı: ${task}`);
  const code = await new Promise(resolve => {
    const child = spawn(process.execPath, [npm, 'run', task], { cwd: root, stdio: 'inherit', windowsHide: true });
    child.once('error', () => resolve(1));
    child.once('exit', code => resolve(code ?? 1));
  });
  results.push({ task, code });
  return code;
}
await run('check');
const build = await run('dogrula');
if (build === 0) await run('test:web');
else { results.push({ task: 'test:web (güncel build yok; atlandı)', code: 1 }); }
// Web hatası, bağımsız güvenlik testlerinin çalışmasını engellemez.
await run('test:kurallar');
await run('test:veli-eposta');
console.log('\nToplu sonuç:');
for (const result of results) console.log(`${result.code === 0 ? 'GEÇTİ' : 'BAŞARISIZ'} — ${result.task}`);
console.log('Bu komut yayın veya canlı veri değişikliği yapmaz.');
process.exitCode = results.some(result => result.code !== 0) ? 1 : 0;
