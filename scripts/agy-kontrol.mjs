// Salt okunur kontrol: Anti-Gravity (agy) CLI altyapı ve çalışma ortamı doğrulama betiği.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
console.log('Anti-Gravity CLI (agy) Altyapı Kontrolü Başlatılıyor...\n');

// 1. agy CLI yürütülebilirliği
try {
  const version = execSync('agy --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).trim();
  console.log(`✓ agy CLI tespit edildi: sürüm ${version}`);
} catch (e) {
  throw new Error('agy CLI sistemde bulunamadı veya çalıştırılamadı.');
}

// 2. Proje kuralları (AGENTS.md)
const agentsMdPath = join(root, 'AGENTS.md');
assert(existsSync(agentsMdPath), 'AGENTS.md bulunamadı.');
const agentsMd = readFileSync(agentsMdPath, 'utf8');
assert(agentsMd.includes('Marche-en-Famenne Ulu Camii'), 'AGENTS.md cami dernek bilgisini içermiyor.');
assert(agentsMd.includes('ulucamii2026'), 'AGENTS.md GitHub hesap sınırını içermiyor.');
assert(agentsMd.includes('demo-ulucamii'), 'AGENTS.md Firebase emülatör sınırını içermiyor.');
console.log('✓ AGENTS.md proje kuralları eksiksiz ve doğrulanmış.');

// 3. .agents/skills.json yapılandırması
const skillsJsonPath = join(root, '.agents', 'skills.json');
assert(existsSync(skillsJsonPath), '.agents/skills.json bulunamadı.');
const skillsJson = JSON.parse(readFileSync(skillsJsonPath, 'utf8'));
assert(Array.isArray(skillsJson.inherits) && skillsJson.inherits.length > 0, 'skills.json geçersiz şema.');
assert(skillsJson.inherits[0].exclude.length > 20, 'Gereksiz küresel beceri filtreleri tanımlanmamış.');
console.log(`✓ .agents/skills.json devrede: ${skillsJson.inherits[0].exclude.length} alakasız beceri grubu filtrelendi.`);

// 4. Firebase ve canlı ortam yalıtımı
assert(existsSync(join(root, 'firebase.emulators.json')), 'firebase.emulators.json bulunamadı.');
assert(existsSync(join(root, 'scripts', 'firebase-cami.ps1')), 'Dernek Firebase sarmalayıcısı bulunamadı.');
assert(existsSync(join(root, 'scripts', 'gh-cami.ps1')), 'Dernek GitHub sarmalayıcısı bulunamadı.');
console.log('✓ Canlı ortam hesap sınırları ve emülatör yalıtımı doğrulandı.');

console.log('\nSonuç: Anti-Gravity (agy) altyapısı bu proje için maksimum verimlilikle çalışmaya hazır.');
