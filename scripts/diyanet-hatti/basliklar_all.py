# -*- coding: utf-8 -*-
"""Canlı e-kitaplar için boyut + (Türkçe olmayanlarda) ilk sayfa metni ve sayfa sayısı."""
import json, os, re, subprocess, urllib.request, urllib.parse, time

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'}
KOK = 'pdfall'
CIK = 'ekitap-detay.json'
BOYUT_SINIRI = 80 * 1024 * 1024
os.makedirs(KOK, exist_ok=True)

ham = json.load(open('tum-ekitaplar.json', encoding='utf-8'))
canli = [r for r in ham if r.get('pdf')]
onceki = {r['id']: r for r in json.load(open(CIK, encoding='utf-8'))} if os.path.exists(CIK) else {}

def tam(rel):
    rel = rel.replace('&amp;', '&')
    yol, _, sorgu = rel.partition('?')
    par = urllib.parse.parse_qsl(sorgu, keep_blank_values=True)
    return 'https://dijital.diyanet.gov.tr' + yol + '?' + urllib.parse.urlencode(par)

def istek(url, ek=None):
    r = urllib.request.Request(url, headers={**UA, **(ek or {})})
    for d in range(3):
        try:
            return urllib.request.urlopen(r, timeout=90)
        except Exception as e:
            if d == 2: raise
            time.sleep(2 * (d + 1))

out = []
for i, r in enumerate(canli):
    kid = r['id']
    if kid in onceki and onceki[kid].get('boyut'):
        out.append(onceki[kid]); continue
    kayit = dict(r)
    kayit['pdfUrl'] = tam(r['pdf'])
    kayit['epubUrl'] = tam(r['epub']) if r.get('epub') else None
    try:
        c = istek(kayit['pdfUrl'], {'Range': 'bytes=0-1023'})
        bas = c.read(1024); cr = c.headers.get('content-range'); c.close()
        kayit['pdfMi'] = bas[:4] == b'%PDF'
        kayit['boyut'] = int(cr.split('/')[1]) if cr and '/' in cr else None
    except Exception as e:
        kayit['boyut'] = None; kayit['pdfMi'] = False; kayit['hataBoyut'] = str(e)[:60]

    turkce = (kayit.get('dil') or '').startswith('Türkçe')
    if kayit.get('pdfMi') and not turkce and kayit.get('boyut') and kayit['boyut'] < BOYUT_SINIRI:
        f = f'{KOK}/{kid}.pdf'
        if not os.path.exists(f) or os.path.getsize(f) != kayit['boyut']:
            try:
                with istek(kayit['pdfUrl']) as resp, open(f, 'wb') as o:
                    while True:
                        b = resp.read(1 << 20)
                        if not b: break
                        o.write(b)
            except Exception as e:
                kayit['hataIndir'] = str(e)[:60]
        if os.path.exists(f) and abs(os.path.getsize(f) - (kayit['boyut'] or 0)) <= 1024:
            try:
                t = subprocess.run(['pdfinfo', f], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
                mm = re.search(r'Pages:\s*(\d+)', t)
                kayit['sayfa'] = int(mm.group(1)) if mm else None
            except Exception: pass
            try:
                s = subprocess.run(['pdftotext', '-f', '1', '-l', '3', '-layout', f, '-'],
                                   capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
                kayit['ilkSayfa'] = re.sub(r'\n{3,}', '\n\n', s)[:900]
            except Exception: pass
        else:
            kayit['kesik'] = True
    out.append(kayit)
    if i % 20 == 0:
        print(i, kid, kayit.get('dil'), (kayit.get('boyut') or 0) // 1024, 'KB', flush=True)
        json.dump(out, open(CIK, 'w', encoding='utf-8'), ensure_ascii=False)

json.dump(out, open(CIK, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('BITTI', len(out), 'kayıt; kesik:', sum(1 for r in out if r.get('kesik')))
