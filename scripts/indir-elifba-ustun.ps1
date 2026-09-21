# Diyanet resmi elifba ustun seslerini indirir
$ErrorActionPreference = 'Stop'
$targetDir = 'public/media/ses/elifba/ustun'
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}
$map = [ordered]@{
    'elif' = 1; 'be' = 2; 'te' = 3; 'se' = 4; 'cim' = 5; 'ha' = 6; 'dal' = 7; 'zel' = 8;
    'ze' = 9; 'sin' = 10; 'sin2' = 11; 'ayn' = 12; 'fe' = 13; 'kef' = 14;
    'lam' = 15; 'mim' = 16; 'nun' = 17; 'he' = 18; 'vav' = 19; 'ye' = 20; 'hi' = 25;
    'ra' = 26; 'gayn' = 27; 'kaf' = 28; 'sad' = 30; 'dad' = 31; 'ti' = 32; 'zi' = 33
}

foreach ($entry in $map.GetEnumerator()) {
    $name = $entry.Key
    $idx = $entry.Value
    # Harf ADLARI değil, resmî fetha sayfasının data-sound kimlikleri (21 Eylül 2026).
    $url = "https://kuran.diyanet.gov.tr/elifba/data/sound/elifba/fetha/fetha/btn_${idx}.mp3"
    $outFile = Join-Path $targetDir "${name}.mp3"
    Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
    $len = (Get-Item $outFile).Length
    Write-Host "$name -> btn_${idx}.mp3 indirildi ($len bytes)"
}
Write-Host "Tamamlandi: 28 adet Diyanet resmi ustun sesi hazir."
