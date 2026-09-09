// Yalnız yerel geliştirme: kişisel tarayıcı profili/çerez kullanmaz.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const fullBrowser = chromium.executablePath();
const headlessBrowser = process.platform === 'win32'
  ? fullBrowser.replace(/chromium-(\d+)/, 'chromium_headless_shell-$1').replace(/chrome-win64[\\/]chrome\.exe$/, 'chrome-headless-shell-win64/chrome-headless-shell.exe')
  : fullBrowser;
if (!existsSync(headlessBrowser)) throw new Error('Playwright Chromium eksik. npx --no-install playwright install chromium çalıştırın.');
const child = spawn(process.execPath, [
  fileURLToPath(new URL('../node_modules/@playwright/mcp/cli.js', import.meta.url)),
  '--headless', '--isolated', '--block-service-workers',
  '--timeout-navigation', '15000',
  '--executable-path', headlessBrowser,
  '--allowed-origins', ['127.0.0.1', 'localhost', '[::1]'].flatMap(host => [4321, 4399, 4401].map(port => `http://${host}:${port}`)).join(';'),
  '--output-dir', fileURLToPath(new URL('../.playwright-mcp', import.meta.url)),
], { cwd: root, stdio: 'inherit', windowsHide: true });
child.on('error', () => { console.error('Yerel Playwright MCP başlatılamadı. npm ci çalıştırın.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
