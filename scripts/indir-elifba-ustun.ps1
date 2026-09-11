# Diyanet resmi elifba ustun seslerini indirir
$ErrorActionPreference = 'Stop'
$targetDir = 'public/media/ses/elifba/ustun'
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}
$map = [ordered]@{
    'elif' = 1; 'be' = 2; 'te' = 3; 'se' = 4; 'cim' = 5; 'ha' = 6; 'dal' = 7; 'zel' = 8;
    'ra' = 9; 'ze' = 10; 'sin' = 11; 'sin2' = 12; 'ayn' = 13; 'fe' = 14; 'kef' = 15;
    'lam' = 16; 'mim' = 17; 'nun' = 18; 'he' = 19; 'vav' = 20; 'ye' = 21; 'hi' = 22;
    'sad' = 23; 'dad' = 24; 'ti' = 25; 'zi' = 26; 'gayn' = 27; 'kaf' = 28
}

foreach ($entry in $map.GetEnumerator()) {
    $name = $entry.Key
    $idx = $entry.Value
    $url = "https://kuran.diyanet.gov.tr/elifba/data/sound/elifba/harfler/sesleri/btn_${idx}.mp3"
    $outFile = Join-Path $targetDir "${name}.mp3"
    Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
    $len = (Get-Item $outFile).Length
    Write-Host "$name -> btn_${idx}.mp3 indirildi ($len bytes)"
}
Write-Host "Tamamlandi: 28 adet Diyanet resmi ustun sesi hazir."
