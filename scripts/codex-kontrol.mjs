// Salt okunur keşif: Codex sohbeti/turn'ü veya yaşam döngüsü kancası başlatmaz.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { preview } from 'astro';

const root = fileURLToPath(new URL('../', import.meta.url));
function rpc(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
  let id = 0;
  const pending = new Map();
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.method) {
      if (message.id !== undefined) {
        const result = message.method === 'roots/list' ? { roots: [{ uri: pathToFileURL(root).href, name: 'ulucamii-site' }] }
          : message.method === 'ping' ? {} : null;
        send(result === null
          ? { jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Method not supported' } }
          : { jsonrpc: '2.0', id: message.id, result });
      }
      return;
    }
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id); clearTimeout(task.timer);
    if (message.error) task.reject(new Error(`RPC hata kodu: ${message.error.code}`));
    else task.resolve(message.result);
  });
  const rejectAll = () => {
    for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error('RPC süreci erken kapandı.')); }
    pending.clear();
  };
  child.on('error', rejectAll); child.on('exit', rejectAll);
  const send = value => child.stdin.write(JSON.stringify(value) + '\n');
  return {
    notify: (method, params = {}) => send({ jsonrpc: '2.0', method, params }),
    request(method, params = {}) {
      return new Promise((resolve, reject) => {
        const current = ++id;
        const timer = setTimeout(() => { pending.delete(current); reject(new Error(`${method} zaman aşımı.`)); }, 30_000);
        pending.set(current, { resolve, reject, timer });
        send({ jsonrpc: '2.0', id: current, method, params });
      });
    },
    async close() {
      child.stdin.end(); lines.close();
      if (child.exitCode !== null) return;
      await new Promise(resolve => {
        const timer = setTimeout(() => { child.kill(); resolve(); }, 2500);
        child.once('exit', () => { clearTimeout(timer); resolve(); });
      });
    },
  };
}

const codexPath = process.env.ULUCAMII_CODEX_BIN || join(homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', '@openai', 'codex',
  'node_modules', '@openai', 'codex-win32-x64', 'vendor', 'x86_64-pc-windows-msvc', 'bin', 'codex.exe');
const codex = rpc(codexPath, ['app-server', '--listen', 'stdio://']);
try {
  await codex.request('initialize', { clientInfo: { name: 'ulucamii_readonly_check', version: '1.0.0' }, capabilities: { experimentalApi: true } });
  codex.notify('initialized');
  const { config } = await codex.request('config/read', { cwd: root, includeLayers: false });
  assert.equal(config.features.apps, false, 'Kişisel uygulamalar kapalı olmalı.');
  assert.equal(config.mcp_servers.ulucamii_browser.enabled, true);
  for (const name of ['firebase', 'github', 'playwright']) assert.equal(config.mcp_servers[name].enabled, false);
  assert.equal(config.model_reasoning_effort, 'high');
  const skills = await codex.request('skills/list', { cwds: [root] });
  const entry = skills.data[0];
  assert.equal(entry.errors.length, 0, 'Beceri keşfinde hata var.');
  for (const name of ['ulucamii-site', 'impeccable', 'openai-docs']) assert(entry.skills.some(s => s.name === name && s.enabled), `${name} keşfedilemedi.`);
  const hooks = await codex.request('hooks/list', { cwds: [root] });
  const localHooks = hooks.data[0].hooks;
  assert(localHooks.some(h => h.key.endsWith('hooks.json:pre_tool_use:0:0') && h.enabled === true), 'Gizli bilgi kontrolü açık kalmalı.');
  // Eski kancaları tanılama adına çalıştırma; kapsam guard'ını statik doğrula.
  for (const name of ['router-guard', 'rogue-process-guard']) {
    const source = readFileSync(join(homedir(), '.codex', 'hooks', `${name}.ps1`), 'utf8');
    const guardAt = source.indexOf('$camiScope =');
    assert(guardAt >= 0 && guardAt < source.indexOf('$ErrorActionPreference'), `${name} erken kapsam kontrolü eksik.`);
    assert(source.includes("$camiScope -ieq 'D:\\app\\ulucamii-site'"));
    // SessionStart stdout'una düz bilgi metni yazılmaz; Codex bunu JSON sanıyordu.
    const erkenDonus = source.slice(guardAt, source.indexOf('$ErrorActionPreference'));
    assert.match(erkenDonus, /\{\s*return\s*\}/);
    assert.doesNotMatch(erkenDonus, /Write-(?:Host|Output)/i);
  }
  console.log(`Codex proje ayarları, hesap ayrımı ve kancalar doğrulandı; ${entry.skills.length} beceri, 0 keşif hatası.`);
} finally { await codex.close(); }

const server = await preview({ root, server: { host: '127.0.0.1', port: 4401, open: false } });
let browser;
let probeRequests = 0;
const probe = createServer((_request, response) => {
  probeRequests++;
  response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
  response.end('Yerel ağ süzgeci denemesi');
});
try {
  assert.equal(server.port, 4401, 'Test portu kullanımda.');
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const probeUrl = `http://127.0.0.1:${probe.address().port}/`;
  browser = rpc(process.execPath, ['scripts/codex-browser.mjs']);
  await browser.request('initialize', { protocolVersion: '2024-11-05', capabilities: { roots: { listChanged: false } }, clientInfo: { name: 'ulucamii_mcp_check', version: '1.0.0' } });
  browser.notify('notifications/initialized');
  const catalog = await browser.request('tools/list');
  assert(catalog.tools.some(tool => tool.name === 'browser_navigate'));
  console.log('Playwright MCP araç listesi alındı; yerel sayfa açılıyor.');
  const result = await browser.request('tools/call', { name: 'browser_navigate', arguments: { url: 'http://127.0.0.1:4401/tr/' } });
  assert.notEqual(result.isError, true, 'Playwright MCP yerel sayfayı açamadı.');
  console.log('Playwright MCP sayfası açıldı; dış ağ engeli sınanıyor.');
  const check = await browser.request('tools/call', { name: 'browser_evaluate', arguments: {
    function: `async () => ({ lang: document.documentElement.lang, externalBlocked: await fetch('${probeUrl}', {signal: AbortSignal.timeout(5000)}).then(() => false, error => error.name === 'TypeError') })`,
  } });
  assert.notEqual(check.isError, true);
  const output = check.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
  assert.match(output, /"lang":\s*"tr"/);
  assert.match(output, /"externalBlocked":\s*true/);
  assert.equal(probeRequests, 0, 'İzin listesi dışındaki yerel sunucuya istek ulaştı.');
  console.log(`Yerel Playwright MCP: ${catalog.tools.length} araç, tarayıcı açılışı ve dış ağ engeli doğrulandı.`);
} finally {
  if (browser) {
    try { await browser.request('tools/call', { name: 'browser_close', arguments: {} }); } catch {}
    await browser.close();
  }
  await server.stop();
  await new Promise(resolve => probe.close(resolve));
}
