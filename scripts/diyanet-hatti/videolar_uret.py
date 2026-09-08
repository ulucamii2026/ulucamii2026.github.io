# -*- coding: utf-8 -*-
"""Diyanet «İslam Nedir?» serisini src/data/diyanet-videolar.json'a yazar.
   Kaynak: dijital.diyanet.gov.tr site haritası + YouTube oEmbed (canlılık ve başlık)."""
import json, re, urllib.parse, io, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SITE = [urllib.parse.unquote(x.strip()) for x in io.open('sitemap-urls.txt', encoding='utf-8') if '/video/' in x]
OEM = {d['id']: d for d in json.load(io.open('islam-nedir.json', encoding='utf-8'))}

kayit = {}
for x in SITE:
    p = x.split('/video/')[1].split('/')
    if p[1] != 'islam-nedir-':
        continue
    kayit[p[-1]] = {'slug': p[0], 'seriId': p[2], 'videoId': p[3], 'sayfa': x}

GRUPLAR = [
    ('baslarken', (1, 4)),
    ('inanc', (5, 12)),
    ('ibadet', (13, 22)),
    ('cagri', (23, 28)),
    ('musluman', (29, 37)),
]
def grup(no):
    for ad, (a, b) in GRUPLAR:
        if a <= no <= b:
            return ad
    return 'ek'

bolumler, ekler = [], []
for vid, k in kayit.items():
    o = OEM.get(vid)
    if not o or not o.get('canli'):
        print('atlandi (olu ya da denetlenmemis):', vid, k['slug'])
        continue
    baslik = re.sub(r'\s*-\s*İslam Nedir\?\s*$', '', o['baslik']).strip()
    m = re.match(r'^islam-nedir-37_(\d+)-', k['slug'])
    kt = {'id': vid, 'baslik': baslik, 'sayfa': k['sayfa']}
    if m:
        kt['no'] = int(m.group(1))
        kt['grup'] = grup(kt['no'])
        bolumler.append(kt)
    else:
        ekler.append(kt)

bolumler.sort(key=lambda k: k['no'])
ekler.sort(key=lambda k: k['baslik'])
veri = {
    'kaynak': 'dijital.diyanet.gov.tr — «İslam Nedir?» serisi; videolar YouTube «Diyanet Dijital» kanalında',
    'seriSayfasi': 'https://dijital.diyanet.gov.tr/Kitaplik/video?seri=islam-nedir-',
    'dil': 'tr',
    'denetim': '2026-09-08',
    'bolumler': bolumler,
    'ekler': ekler,
}
io.open('D:/app/ulucamii-site/src/data/diyanet-videolar.json', 'w', encoding='utf-8').write(
    json.dumps(veri, ensure_ascii=False, indent=1) + '\n')
print(f'{len(bolumler)} bölüm, {len(ekler)} ek video')
