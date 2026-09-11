# Ulu Camii - Otomatik Ilerleme Kaydi (Local Checkpoint)
# Bu betik yalniz yerel git commit olusturur; asla git push veya canli yayin yapmaz.
$ErrorActionPreference = 'Stop'

$status = (git status --porcelain)
if (-not $status) {
    Write-Host "Kaydedilecek yeni bir ilerleme veya degisiklik bulunmuyor." -ForegroundColor Cyan
    exit 0
}

# Hassas dosya veya kilit denetimi
$blockedPatterns = @('\.env', '\.lock', 'firebase-debug\.log', 'credentials', 'token', 'secret')
$changedLines = $status -split "
" | Where-Object { $_.Trim() -ne '' }
$riskyFiles = @()

foreach ($line in $changedLines) {
    $file = $line.Substring(3).Trim()
    foreach ($pattern in $blockedPatterns) {
        if ($file -match $pattern) {
            $riskyFiles += $file
        }
    }
}

if ($riskyFiles.Count -gt 0) {
    Write-Warning "Hassas veya gecici dosya tespit edildi: $($riskyFiles -join ', ')"
}

$now = Get-Date -Format "yyyy-MM-dd HH:mm"
git add src/ public/ docs/ package.json
$staged = (git diff --cached --name-only)

if (-not $staged) {
    Write-Host "Sahnelenen degisiklik yok." -ForegroundColor Yellow
    exit 0
}

$commitMsg = "wip: otomatik ilerleme kaydi ($now)"
git commit -m $commitMsg

$commitHash = (git rev-parse --short HEAD)
Write-Host "Ilerleme basariyla kaydedildi [$commitHash]: $commitMsg" -ForegroundColor Green
Write-Host "Etkilenen dosya sayisi: $(($staged -split "
").Count)" -ForegroundColor Gray
