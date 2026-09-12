"""Diyanet'in cezm/şedde örneklerini metin ve ses eşleşmesini koruyarak aktarır."""
import concurrent.futures
import hashlib
import json
import sys
from pathlib import Path
from urllib.request import urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://kuran.diyanet.gov.tr/elifba/'
HARFLER = 'elif be te se cim ha hi dal zel ra ze sin sin2 sad dad ti zi ayn gayn fe kaf kef lam mim nun he vav ye'.split()


def oku(url):
    with urlopen(url, timeout=30) as response:
        return response.read()


def ders(tur, bolum, sayi):
    kaynak = BASE + f'templates/dersler/eb/{tur}/{bolum}.html'
    html = BeautifulSoup(oku(kaynak).decode('utf-8-sig'), 'html.parser')
    ornekler = []
    for n in range(1, sayi + 1):
        el = html.select_one(f'[data-sound="btn_{n}"]')
        if el is None:
            raise ValueError(f'Eksik resmî örnek: {tur}/{n}')
        ornekler.append({
            'id': HARFLER[n - 1] if tur == 'cezm' else str(n),
            'metin': ' '.join(el.get_text(' ', strip=True).split()),
            'kaynak': BASE + f'data/sound/elifba/{tur}/{bolum}/btn_{n}.mp3',
            'sesUrl': f'/media/ses/elifba/{tur}/{n}.mp3',
        })
    return {'kaynak': kaynak, 'ornekler': ornekler}


def indir(ornek):
    veri = oku(ornek['kaynak'])
    if len(veri) < 1000 or not (veri[:3] == b'ID3' or veri[0] == 255):
        raise ValueError(f'MP3 olmayan yanıt: {ornek["kaynak"]}')
    return ornek, veri


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    veri = {'cezm': ders('cezm', 'kavrama', 28), 'sedde': ders('sedde', 'uygulama', 18)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        # Tüm yanıtlar doğrulanmadan mevcut dosyalara dokunulmaz.
        sonuclar = list(pool.map(indir, [o for d in veri.values() for o in d['ornekler']]))
    for ornek, ses in sonuclar:
        hedef = ROOT / 'public' / ornek['sesUrl'].lstrip('/')
        hedef.parent.mkdir(parents=True, exist_ok=True)
        hedef.write_bytes(ses)
        ornek['sha256'] = hashlib.sha256(ses).hexdigest()
    (ROOT / 'src/data/elifba-alistirmalari.json').write_text(
        json.dumps(veri, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(sonuclar)} resmî metin/ses çifti aktarıldı.')
