# -*- coding: utf-8 -*-
"""Türkçe olmayan e-kitapların PDF'lerini paralel indirir (başlık çıkarımı için)."""
import json, os, urllib.request, urllib.parse, threading, queue, time

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'}
KOK = 'pdfall'
IS_PARCACIGI = 5
SINIR = 80 * 1024 * 1024
os.makedirs(KOK, exist_ok=True)


def tam(rel):
    rel = rel.replace('&amp;', '&')
    yol, _, sorgu = rel.partition('?')
    return 'https://dijital.diyanet.gov.tr' + yol + '?' + urllib.parse.urlencode(
        urllib.parse.parse_qsl(sorgu, keep_blank_values=True))


ham = json.load(open('tum-ekitaplar.json', encoding='utf-8'))
hedef = [r for r in ham if r.get('pdf') and not (r.get('dil') or '').startswith('Türkçe') and r.get('dil')]
print('hedef:', len(hedef), flush=True)

kuyruk = queue.Queue()
for r in hedef:
    kuyruk.put(r)

kilit = threading.Lock()
sayac = {'ok': 0, 'atla': 0, 'hata': 0}


def isci():
    while True:
        try:
            r = kuyruk.get_nowait()
        except queue.Empty:
            return
        f = f"{KOK}/{r['id']}.pdf"
        try:
            if os.path.exists(f) and os.path.getsize(f) > 1024:
                with kilit: sayac['atla'] += 1
                continue
            url = tam(r['pdf'])
            gecici = f + '.tmp'
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as resp:
                uzunluk = int(resp.headers.get('Content-Length') or 0)
                if uzunluk > SINIR:
                    with kilit: sayac['atla'] += 1
                    continue
                with open(gecici, 'wb') as o:
                    while True:
                        b = resp.read(1 << 20)
                        if not b: break
                        o.write(b)
            os.replace(gecici, f)
            with kilit:
                sayac['ok'] += 1
                if sayac['ok'] % 20 == 0:
                    print('indirilen', sayac['ok'], 'atlanan', sayac['atla'], 'hata', sayac['hata'], flush=True)
        except Exception as e:
            with kilit: sayac['hata'] += 1
        finally:
            kuyruk.task_done()


bas = time.time()
isciler = [threading.Thread(target=isci, daemon=True) for _ in range(IS_PARCACIGI)]
for t in isciler: t.start()
for t in isciler: t.join()
print('BITTI', sayac, '%.0f sn' % (time.time() - bas))
