import nodeTest from 'node:test';
const test = (name, fn) => nodeTest(name, { skip: process.platform !== 'win32' }, fn);
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const originalScriptPath = path.resolve(__dirname, '../scripts/oto-kaydet.ps1');

function runScript(scriptPath, cwd, env = process.env) {
  return spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    {
      cwd,
      env,
      encoding: 'utf8',
      windowsHide: true
    }
  );
}

function createSyntheticRepo() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oto-kaydet-test-'));
  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'pipe' });
  execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: tempDir, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.name', 'Test Runner'], { cwd: tempDir, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.email', 'test@example.test'], { cwd: tempDir, stdio: 'pipe' });

  const scriptsDir = path.join(tempDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.copyFileSync(originalScriptPath, path.join(scriptsDir, 'oto-kaydet.ps1'));

  fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'src', 'index.js'), '// initial');
  fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"test-repo"}');
  execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'pipe' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: tempDir, stdio: 'pipe' });

  return tempDir;
}

function cleanDir(dir) {
  const resolved = path.resolve(dir);
  const tempRoot = path.resolve(os.tmpdir()) + path.sep;
  assert.ok(resolved.startsWith(tempRoot) && path.basename(resolved).startsWith('oto-kaydet-'));
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Windows dosya kilitlerinde sessizce devam et
  }
}

test('Repo path ve çalışma dizini denetimi: Git reposu olmayan dizinde fail-closed durur', () => {
  const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oto-kaydet-nongit-'));
  try {
    const scriptsDir = path.join(nonGitDir, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    const targetScript = path.join(scriptsDir, 'oto-kaydet.ps1');
    fs.copyFileSync(originalScriptPath, targetScript);

    const res = runScript(targetScript, nonGitDir);
    assert.notEqual(res.status, 0, 'Git reposu olmayan dizinde betik hata vermeli');
    assert.match(res.stderr, /Git deposu|git/i);
  } finally {
    cleanDir(nonGitDir);
  }
});

test('Repo path ve çalışma dizini denetimi: Alt dizinden çalıştırıldığında fail-closed durur', () => {
  const tempRepo = createSyntheticRepo();
  try {
    const scriptsDir = path.join(tempRepo, 'scripts');
    const targetScript = path.join(scriptsDir, 'oto-kaydet.ps1');

    // Çalışma dizini repo kökü yerine scripts/ olarak veriliyor
    const res = runScript(targetScript, scriptsDir);
    assert.notEqual(res.status, 0, 'Repo kökü dışından çalıştırıldığında betik hata vermeli');
    assert.match(res.stderr, /depo kok dizininde calistirilabilir/i);
  } finally {
    cleanDir(tempRepo);
  }
});

test('Repo path ve çalışma dizini denetimi: Başka bir repo içerisinden çağrıldığında fail-closed durur', () => {
  const tempRepo1 = createSyntheticRepo();
  const tempRepo2 = createSyntheticRepo();
  try {
    // tempRepo1'deki betiği tempRepo2 içinde çalıştır
    const scriptFromRepo1 = path.join(tempRepo1, 'scripts', 'oto-kaydet.ps1');
    const res = runScript(scriptFromRepo1, tempRepo2);
    assert.notEqual(res.status, 0, 'Farklı bir repodan çağrıldığında betik hata vermeli');
    assert.match(res.stderr, /uyusmuyor/i);
  } finally {
    cleanDir(tempRepo1);
    cleanDir(tempRepo2);
  }
});

test('Hassas dosya denetimi: .env veya kilit/anahtar dosyası tespit edildiğinde fail-closed durur', () => {
  const tempRepo = createSyntheticRepo();
  try {
    const targetScript = path.join(tempRepo, 'scripts', 'oto-kaydet.ps1');

    // Hem geçerli kaynakta hem de hassas dosyada değişiklik yap
    fs.appendFileSync(path.join(tempRepo, 'src', 'index.js'), '\nconsole.log("new code");');
    fs.writeFileSync(path.join(tempRepo, '.env'), 'SECRET_KEY=12345');

    const res = runScript(targetScript, tempRepo);
    assert.notEqual(res.status, 0, 'Hassas dosya varken betik hata koduyla çıkmalı');
    assert.match(res.stderr, /Hassas veya gecici dosya tespit edildi/i);

    // Hiçbir commit yapılmamış olmalı (son commit hala initial commit olmalı)
    const lastCommitMsg = execFileSync('git', ['log', '-1', '--pretty=%B'], { cwd: tempRepo, encoding: 'utf8' }).trim();
    assert.equal(lastCommitMsg, 'initial commit');

    // Index'te hiçbir şey sahnelenmemiş olmalı
    const staged = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: tempRepo, encoding: 'utf8' }).trim();
    assert.equal(staged, '', 'Hassas dosya durumunda hiçbir dosya sahnelenmemeli');
  } finally {
    cleanDir(tempRepo);
  }
});

test('Önceden sahnelenmiş (pre-staged) değişiklik denetimi: Önceden stage edilmiş dosya varsa fail-closed durur', () => {
  const tempRepo = createSyntheticRepo();
  try {
    const targetScript = path.join(tempRepo, 'scripts', 'oto-kaydet.ps1');

    // Bir dosyayı manuel olarak stage et
    fs.writeFileSync(path.join(tempRepo, 'baska-dosya.txt'), 'onemli taslak');
    execFileSync('git', ['add', 'baska-dosya.txt'], { cwd: tempRepo, stdio: 'pipe' });

    // Kaynak dosyada da değişiklik olsun
    fs.appendFileSync(path.join(tempRepo, 'src', 'index.js'), '\n// yeni degisiklik');

    const res = runScript(targetScript, tempRepo);
    assert.notEqual(res.status, 0, 'Önceden sahnelenmiş değişiklik varken betik hata vermeli');
    assert.match(res.stderr, /Onceden sahnelenmis/i);

    // Yeni bir commit yapılmamış olmalı
    const lastCommitMsg = execFileSync('git', ['log', '-1', '--pretty=%B'], { cwd: tempRepo, encoding: 'utf8' }).trim();
    assert.equal(lastCommitMsg, 'initial commit');
  } finally {
    cleanDir(tempRepo);
  }
});

test('Değişiklik yok denetimi: Temiz çalışma ağacında güvenle ve sıfır kodla çıkar', () => {
  const tempRepo = createSyntheticRepo();
  try {
    const targetScript = path.join(tempRepo, 'scripts', 'oto-kaydet.ps1');

    const res = runScript(targetScript, tempRepo);
    assert.equal(res.status, 0, 'Değişiklik yokken başarıyla çıkmalı');
    assert.match(res.stdout, /bulunmuyor/i);

    const lastCommitMsg = execFileSync('git', ['log', '-1', '--pretty=%B'], { cwd: tempRepo, encoding: 'utf8' }).trim();
    assert.equal(lastCommitMsg, 'initial commit');
  } finally {
    cleanDir(tempRepo);
  }
});

test('Yalnızca belirlenmiş kaynak yollarını kaydeder: Harici dosyalar stage veya commit edilmez', () => {
  const tempRepo = createSyntheticRepo();
  try {
    const targetScript = path.join(tempRepo, 'scripts', 'oto-kaydet.ps1');

    // Hem src/ içinde hem de harici bir dosyada değişiklik yap
    fs.appendFileSync(path.join(tempRepo, 'src', 'index.js'), '\n// izin verilen degisiklik');
    fs.writeFileSync(path.join(tempRepo, 'alakasiz-dosya.txt'), 'bu dosya commit edilmemeli');

    const res = runScript(targetScript, tempRepo);
    assert.equal(res.status, 0, 'İzin verilen kaynak değişikliği başarıyla commit edilmeli');
    assert.match(res.stdout, /Ilerleme basariyla kaydedildi/i);

    // Son commit içeriğini denetle
    const committedFiles = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
      cwd: tempRepo,
      encoding: 'utf8'
    }).trim().split(/\r?\n/);

    assert.ok(committedFiles.includes('src/index.js'), 'src/index.js commit edilmiş olmalı');
    assert.ok(!committedFiles.includes('alakasiz-dosya.txt'), 'alakasiz-dosya.txt commit EDİLMEMİŞ olmalı');

    // alakasiz-dosya.txt hala untracked olarak kalmalı
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: tempRepo, encoding: 'utf8' });
    assert.match(status, /\?\? alakasiz-dosya\.txt/);
  } finally {
    cleanDir(tempRepo);
  }
});

test('Git commit hatası denetimi: Commit başarısız olursa başarı yazmaz ve hata koduyla çıkar', () => {
  const tempRepo = createSyntheticRepo();
  try {
    const targetScript = path.join(tempRepo, 'scripts', 'oto-kaydet.ps1');

    fs.appendFileSync(path.join(tempRepo, 'src', 'index.js'), '\n// yeni kod');

    // Commit işlemini başarısız kılmak için pre-commit hook ekle
    const hooksDir = path.join(tempRepo, '.git', 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(hookPath, '#!/bin/sh\nexit 1\n');

    const res = runScript(targetScript, tempRepo);
    assert.notEqual(res.status, 0, 'Commit başarısız olduğunda betik sıfır olmayan çıkış kodu vermeli');
    assert.doesNotMatch(res.stdout, /Ilerleme basariyla kaydedildi/i);
  } finally {
    cleanDir(tempRepo);
  }
});

for (const file of ['src/yeni/.env', 'docs/yeni/token.json', 'public/yeni/private.pem']) {
  test(`Yeni klasördeki hassas dosya kayda alınmaz: ${file}`, () => {
    const repo = createSyntheticRepo();
    try {
      const hedef = path.join(repo, file);
      fs.mkdirSync(path.dirname(hedef), { recursive: true });
      fs.writeFileSync(hedef, 'SENTETIK_TEST');
      const sonuc = runScript(path.join(repo, 'scripts/oto-kaydet.ps1'), repo);
      assert.notEqual(sonuc.status, 0);
      assert.match(sonuc.stderr, /Hassas veya gecici dosya tespit edildi/);
      assert.equal(execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: repo, encoding: 'utf8' }).trim(), '');
      assert.equal(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), '1');
    } finally { cleanDir(repo); }
  });
}

/* 12 Eyl 2026: marka kimliği (logo) dosyaları otomatik kayda ALINMAZ, ama betiği de
   durdurmaz. O gün public/media/logo altındaki sekiz dosya başka bir oturumda kurumsal
   kimlik paketinden gelen temizlenmiş sürümlerle değiştirilmiş olarak çalışma ağacında
   duruyordu; betik public/ dizinini bütünüyle sahnelediği için bir sonraki otomatik
   kayıt onları incelenmeden commit edecekti. Fail-closed yapmak ise logolar elle commit
   edilene kadar İLGİSİZ işlerin otomatik kaydını da kırıyordu. */
test('Logo değişikliği kayda alınmaz ama ilgisiz iş kaydedilmeye devam eder', () => {
  const repo = createSyntheticRepo();
  try {
    const logo = path.join(repo, 'public/media/logo/ulu-camii-logo.svg');
    fs.mkdirSync(path.dirname(logo), { recursive: true });
    fs.writeFileSync(logo, '<svg><!-- yeniden cizildi --></svg>');
    fs.appendFileSync(path.join(repo, 'src', 'index.js'), '\n// ilgisiz yeni kod');

    const sonuc = runScript(path.join(repo, 'scripts/oto-kaydet.ps1'), repo);
    assert.equal(sonuc.status, 0, sonuc.stderr);
    assert.match(sonuc.stdout, /ATLANDI \(marka kimligi/);

    const kayitli = execFileSync('git', ['show', '--name-only', '--format=', 'HEAD'],
      { cwd: repo, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
    assert.ok(kayitli.includes('src/index.js'), `ilgisiz iş kaydedilmeli: ${kayitli.join(', ')}`);
    assert.ok(!kayitli.some((y) => y.includes('media/logo')),
      `logo commit edilmemeli: ${kayitli.join(', ')}`);
    assert.match(execFileSync('git', ['status', '--porcelain', '--untracked-files=all',
      '--', 'public/media/logo'], { cwd: repo, encoding: 'utf8' }), /ulu-camii-logo\.svg/);
  } finally { cleanDir(repo); }
});

test('Yalnız logo değişmişse hiçbir şey kaydedilmez', () => {
  const repo = createSyntheticRepo();
  try {
    const logo = path.join(repo, 'public/media/logo/kuran-kursu-logo.svg');
    fs.mkdirSync(path.dirname(logo), { recursive: true });
    fs.writeFileSync(logo, '<svg><!-- yalniz logo --></svg>');

    const sonuc = runScript(path.join(repo, 'scripts/oto-kaydet.ps1'), repo);
    assert.equal(sonuc.status, 0, sonuc.stderr);
    assert.match(sonuc.stdout, /ATLANDI \(marka kimligi/);
    assert.doesNotMatch(sonuc.stdout, /Ilerleme basariyla kaydedildi/);
    assert.equal(execFileSync('git', ['rev-list', '--count', 'HEAD'],
      { cwd: repo, encoding: 'utf8' }).trim(), '1');
  } finally { cleanDir(repo); }
});

test('Tasarım token dosyası gizli erişim anahtarı sanılmaz', () => {
  const repo = createSyntheticRepo();
  try {
    fs.mkdirSync(path.join(repo, 'src/styles'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'src/styles/design-tokens.css'), ':root { --renk: blue; }');
    const sonuc = runScript(path.join(repo, 'scripts/oto-kaydet.ps1'), repo);
    assert.equal(sonuc.status, 0, sonuc.stderr);
  } finally { cleanDir(repo); }
});
