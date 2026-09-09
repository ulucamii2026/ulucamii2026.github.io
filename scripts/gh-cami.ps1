# Token yalnız bu süreçte kullanılır, ekrana/dosyaya yazılmaz.
$ErrorActionPreference = 'Stop'
if ($args.Count -eq 0 -or $args[0] -in @('auth', 'config', 'extension')) {
    throw 'GitHub oturumunu değiştirmeyin. Örnek: scripts/gh-cami.ps1 api user --jq .login'
}
$oldToken = $env:GH_TOKEN
$oldGithubToken = $env:GITHUB_TOKEN
$oldHost = $env:GH_HOST
$oldRepo = $env:GH_REPO
try {
    # Ortamdaki kişisel token, kayıtlı dernek token'ının seçimini etkilemesin.
    $env:GH_TOKEN = $null
    $env:GITHUB_TOKEN = $null
    $env:GH_HOST = 'github.com'
    $token = & gh auth token --hostname github.com --user ulucamii2026 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $token) { throw 'Dernek GitHub oturumu bulunamadı; kişisel hesaba geçilmedi.' }
    $env:GH_TOKEN = ($token -join '').Trim()
    $env:GH_REPO = 'ulucamii2026/ulucamii2026.github.io'
    $who = & gh api user --jq .login 2>$null
    if ($LASTEXITCODE -ne 0 -or $who -ne 'ulucamii2026') { throw 'GitHub dernek kimliği doğrulanamadı.' }
    & gh @args
    $resultCode = $LASTEXITCODE
} finally {
    $token = $null
    $env:GH_TOKEN = $oldToken
    $env:GITHUB_TOKEN = $oldGithubToken
    $env:GH_HOST = $oldHost
    $env:GH_REPO = $oldRepo
}
exit $resultCode
