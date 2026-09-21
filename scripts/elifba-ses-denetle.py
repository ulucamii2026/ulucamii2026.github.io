"""Yerel Elifbâ kayıtlarını resmî kaynağın gerçek baytlarıyla karşılaştırır.

Varsayılan salt okunurdur. --onar yalnız doğrulanmış MP3'leri yerinde düzeltir;
önceki dosyalar .codex/elifba-ses-denetimi/yedek altında korunur.
"""
import concurrent.futures
import hashlib
import json
import sys
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/dinleme-ses-kaynaklari.json'
CACHE = ROOT / '.codex/elifba-ses-denetimi'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def kontrol(item):
    path, record = item
    url = record['kaynak']
    cached = CACHE / 'resmi' / (sha(url.encode()) + '.mp3')
    if cached.exists() and '--tazele' not in sys.argv:
        remote = cached.read_bytes()
    else:
        with urlopen(url, timeout=45) as response:
            remote = response.read()
        if len(remote) < 500 or not (remote[:3] == b'ID3' or remote[0] == 255):
            raise ValueError('MP3 olmayan resmî yanıt: ' + url)
        cached.parent.mkdir(parents=True, exist_ok=True)
        cached.write_bytes(remote)
    local = ROOT / 'public' / path.lstrip('/')
    digest = sha(remote)
    return {'yol': path, 'kaynak': url, 'sha256': digest,
            'esit': local.exists() and sha(local.read_bytes()) == digest,
            'manifest_esit': record['sha256'] == digest,
            'onbellek': str(cached)}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    items = [(p, r) for p, r in manifest.items()
             if r['kaynak'].startswith('https://kuran.diyanet.gov.tr/elifba/data/sound/')]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(kontrol, items))
    mismatches = [r for r in results if not r['esit'] or not r['manifest_esit']]
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / 'sonuc.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(results)} resmî kayıt karşılaştırıldı; {len(mismatches)} uyuşmazlık.')
    for r in mismatches:
        print(r['yol'])
    if '--onar' in sys.argv:
        # Bütün indirmeler başarılı olmadan hiçbir yayımlanan dosya değişmez.
        for r in mismatches:
            target = ROOT / 'public' / r['yol'].lstrip('/')
            backup = CACHE / 'yedek' / r['yol'].lstrip('/')
            if target.exists() and not backup.exists():
                backup.parent.mkdir(parents=True, exist_ok=True)
                backup.write_bytes(target.read_bytes())
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(Path(r['onbellek']).read_bytes())
            manifest[r['yol']]['sha256'] = r['sha256']
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'{len(mismatches)} kayıt düzeltildi.')
    elif mismatches:
        sys.exit(1)
