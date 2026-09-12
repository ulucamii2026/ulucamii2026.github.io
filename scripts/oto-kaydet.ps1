# Ulu Camii - Otomatik Ilerleme Kaydi (Local Checkpoint)
# Bu betik yalniz yerel git commit olusturur; asla git push veya canli yayin yapmaz.
$ErrorActionPreference = 'Stop'
if (Test-Path variable:PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Fail-Script([string]$message) {
    [Console]::Error.WriteLine("HATA: $message")
    exit 1
}

# 1. Calisma dizini ve Git repo path denetimi (Fail-Closed)
$expectedRepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))

$gitTopLevel = git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($gitTopLevel)) {
    Fail-Script "Gecerli bir Git deposu icinde degilsiniz veya git calistirilamadi."
}

$repoRoot = [System.IO.Path]::GetFullPath($gitTopLevel.Trim())

if ($repoRoot.TrimEnd('\', '/') -ne $expectedRepoRoot.TrimEnd('\', '/')) {
    Fail-Script "Calisilan Git deposu ($repoRoot) ile betigin ait oldugu depo ($expectedRepoRoot) uyusmuyor."
}

$currentDir = [System.IO.Path]::GetFullPath((Get-Location).Path)
if ($currentDir.TrimEnd('\', '/') -ne $repoRoot.TrimEnd('\', '/')) {
    Fail-Script "Betik yalniz depo kok dizininde calistirilabilir. Mevcut dizin: $currentDir, Depo koku: $repoRoot"
}

# 2. Onceden sahnelenmis (pre-staged) degisiklik denetimi (Fail-Closed)
$hasHead = $true
$null = git rev-parse --verify HEAD 2>$null
if ($LASTEXITCODE -ne 0) {
    $hasHead = $false
}

$preStaged = @()
if ($hasHead) {
    $diffCached = git diff --cached --name-only 2>$null
    if ($LASTEXITCODE -ne 0) {
        Fail-Script "'git diff --cached' calistirilamadi."
    }
    if ($diffCached) {
        $preStaged = @($diffCached -split "`r?`n" | Where-Object { $_.Trim() -ne '' })
    }
} else {
    $porcelain = git -c core.quotepath=false status --porcelain=v1 --untracked-files=all 2>$null
    if ($LASTEXITCODE -ne 0) {
        Fail-Script "'git status' calistirilamadi."
    }
    if ($porcelain) {
        $stagedLines = @($porcelain -split "`r?`n" | Where-Object { $_.Length -ge 1 -and $_[0] -match '[MADRCU]' })
        $preStaged = @($stagedLines | ForEach-Object {
            $p = if ($_.Length -gt 3) { $_.Substring(3).Trim() } else { $_.Trim() }
            if ($p -match '->') { $p = ($p -split '->')[-1].Trim() }
            $p.Trim('"', "'")
        })
    }
}

if ($preStaged.Count -gt 0) {
    Fail-Script "Onceden sahnelenmis (staged) degisiklikler bulundu. Guvenlik nedeniyle hicbir islem yapilmadan durduruldu: $($preStaged -join ', ')"
}

# 3. Genel git durumunu al
$status = git -c core.quotepath=false status --porcelain=v1 --untracked-files=all 2>$null
if ($LASTEXITCODE -ne 0) {
    Fail-Script "'git status' komutu basarisiz oldu."
}

if (-not $status) {
    Write-Host "Kaydedilecek yeni bir ilerleme veya degisiklik bulunmuyor." -ForegroundColor Cyan
    exit 0
}

# 4. Hassas dosya veya kilit denetimi (Fail-Closed)
$blockedPatterns = @(
    '(^|/|\\)\.env(\.|$)',
    '\.lock$',
    'firebase-debug\.log',
    'credentials',
    '(^|/)tokens?(\.|$)',
    '(access|refresh|auth)[-_]?token',
    'secret',
    'id_rsa',
    'id_ed25519',
    '\.key$',
    '\.p8$',
    '\.p12$',
    '\.pem$'
)

$changedLines = @($status -split "`r?`n" | Where-Object { $_.Trim() -ne '' })
$riskyFiles = @()

foreach ($line in $changedLines) {
    $filePart = if ($line.Length -gt 3) { $line.Substring(3).Trim() } else { $line.Trim() }
    if ($filePart -match '->') {
        $filePart = ($filePart -split '->')[-1].Trim()
    }
    $cleanPath = $filePart.Trim('"', "'")

    foreach ($pattern in $blockedPatterns) {
        if ($cleanPath -match $pattern) {
            $riskyFiles += $cleanPath
            break
        }
    }
}

if ($riskyFiles.Count -gt 0) {
    Fail-Script "Hassas veya gecici dosya tespit edildi, guvenlik nedeniyle islem durduruldu: $($riskyFiles -join ', ')"
}

# 5. Yalniz bu deponun belirlenmis kaynak yollarini sahnele
$allowedPaths = @('src', 'public', 'docs', 'package.json')
$targetPaths = @()
foreach ($p in $allowedPaths) {
    $fullPath = Join-Path $repoRoot $p
    if (Test-Path $fullPath) {
        $targetPaths += $p
    }
}

if ($targetPaths.Count -eq 0) {
    Write-Host "Belirlenmis kaynak yollarindan hicbiri mevcut degil." -ForegroundColor Yellow
    exit 0
}

# Git add islemi - yalniz belirlenmis yollar
git add -- $targetPaths
if ($LASTEXITCODE -ne 0) {
    Fail-Script "Belirlenmis kaynak yollari sahnelenirken git add basarisiz oldu (Cikis kodu: $LASTEXITCODE)."
}

# Sahnelenen degisiklikleri kontrol et
$staged = git diff --cached --name-only 2>$null
if ($LASTEXITCODE -ne 0) {
    Fail-Script "Sahnelenen degisiklikler okunurken git diff basarisiz oldu."
}

$stagedList = @()
if ($staged) {
    $stagedList = @($staged -split "`r?`n" | Where-Object { $_.Trim() -ne '' })
}

if ($stagedList.Count -eq 0) {
    Write-Host "Sahnelenen degisiklik yok." -ForegroundColor Yellow
    exit 0
}

# 6. Commit olustur ve cikis kodunu denetle
$now = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMsg = "wip: otomatik ilerleme kaydi ($now)"

git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Fail-Script "git commit basarisiz oldu (Cikis kodu: $LASTEXITCODE)."
}

$commitHash = git rev-parse --short HEAD 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($commitHash)) {
    Fail-Script "Commit hash degeri alinamadi."
}

$commitHash = $commitHash.Trim()
Write-Host "Ilerleme basariyla kaydedildi [$commitHash]: $commitMsg" -ForegroundColor Green
Write-Host "Etkilenen dosya sayisi: $($stagedList.Count)" -ForegroundColor Gray
exit 0
