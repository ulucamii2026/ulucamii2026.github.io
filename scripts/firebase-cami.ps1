$ErrorActionPreference = 'Stop'
if ($args.Count -eq 0 -or $args[0] -match '^(login|logout|use|login:add|login:use|login:ci)$') {
    throw 'Oturum değiştirmek yasak. Örnek: scripts/firebase-cami.ps1 projects:list'
}
foreach ($argument in $args) {
    if ($argument -match '^(--(account|project|token)(=|$)|-P($|=)|--$)') {
        throw 'Hesap/proje/token bu sarmalayıcıda değiştirilemez.'
    }
}
$firebaseCmd = (Get-Command firebase.cmd -ErrorAction Stop).Source
$oldToken = $env:FIREBASE_TOKEN
$oldAdc = $env:GOOGLE_APPLICATION_CREDENTIALS
try {
    $env:FIREBASE_TOKEN = $null
    $env:GOOGLE_APPLICATION_CREDENTIALS = $null
    & $firebaseCmd @args --account ulucamii2026@gmail.com --project ulucamii-portal
    $resultCode = $LASTEXITCODE
} finally {
    $env:FIREBASE_TOKEN = $oldToken
    $env:GOOGLE_APPLICATION_CREDENTIALS = $oldAdc
}
exit $resultCode
