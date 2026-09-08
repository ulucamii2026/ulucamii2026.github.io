# -*- coding: utf-8 -*-
"""dijital.diyanet.gov.tr — bütün e-kitapların üstverisini toplar (site haritasından)."""
import re, json, html, os, urllib.request, urllib.parse, time

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'}
CIK = 'tum-ekitaplar.json'

urls = [u.strip() for u in open('sm.txt', encoding='utf-8') if '/e-kitap/' in u]
print('e-kitap:', len(urls), flush=True)

var = {}
if os.path.exists(CIK):
    var = {r['id']: r for r in json.load(open(CIK, encoding='utf-8'))}
    print('önceki kayıt:', len(var), flush=True)


def kitapSayfasi(u):
    """Site haritasındaki /e-kitap/slug/yazar/kategori/id -> /Kitaplik/kategori/slug?id=N.
    Slug zaten kısmen kodlu olabilir ((7%20)); önce çöz, sonra tek kez kodla."""
    p = u.split('/')
    q = lambda x: urllib.parse.quote(urllib.parse.unquote(x))
    return 'https://dijital.diyanet.gov.tr/Kitaplik/%s/%s?id=%s' % (q(p[-2]), q(p[-4]), p[-1])


def alan(h, ad):
    """Künye tablosu: <td>Basım Dili</td><td>Fransızca</td> biçiminde."""
    m = re.search(ad + r'\s*</t[dh]>\s*<t[dh][^>]*>\s*([^<]{1,80})', h)
    return html.unescape(m.group(1)).strip() if m else None


out = []
for i, u in enumerate(urls):
    kid = u.rstrip('/').split('/')[-1]
    if kid in var and var[kid].get('pdf'):
        out.append(var[kid]); continue
    adres = kitapSayfasi(u)
    try:
        h = urllib.request.urlopen(urllib.request.Request(adres, headers=UA), timeout=40).read().decode('utf-8', 'replace')
    except Exception as e:
        out.append({'id': kid, 'url': u, 'hata': str(e)}); continue
    if 'Sayfa Bulunamad' in h:
        out.append({'id': kid, 'url': u, 'olu': True}); continue

    def g(pat):
        m = re.search(pat, h, re.S)
        return html.unescape(m.group(1)).strip() if m else None

    rec = {
        'id': kid, 'url': u, 'sayfaUrl': adres,
        'baslikTr': (g(r'<title>(.*?)</title>') or '').split('|')[0].strip(),
        'kategori': u.split('/')[-2],
        'dil': alan(h, 'Basım Dili'),
        'yazar': alan(h, 'Yazar'),
        'isbn': alan(h, 'ISBN'),
        'pdf': g(r'href="(/File/Download\?[^"]+)"'),
        'epub': g(r'href="(/File/EpubDownload\?[^"]+)"'),
        'hakkinda': g(r'KİTAP HAKKINDA</[^>]*>\s*(?:<[^>]*>\s*)*([^<]{20,1500})'),
    }
    out.append(rec)
    if i % 25 == 0:
        print(i, kid, rec['dil'], rec['baslikTr'][:40], flush=True)
        json.dump(out, open(CIK, 'w', encoding='utf-8'), ensure_ascii=False)
    time.sleep(0.08)

json.dump(out, open(CIK, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
canli = [r for r in out if r.get('pdf')]
print('BITTI', len(out), 'kayıt,', len(canli), 'canlı')
from collections import Counter
print(Counter(r.get('dil') for r in canli).most_common(30))
