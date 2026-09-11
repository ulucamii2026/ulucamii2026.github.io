import os
import urllib.request

# 1. ESRE (KESRA) EŞLEŞTİRMESİ
kesra_map = {
    'elif': 1, 'be': 2, 'te': 3, 'se': 4, 'cim': 5, 'ha': 6, 'dal': 7, 'zel': 8,
    'ra': 9, 'ze': 10, 'sin': 11, 'sin2': 12, 'ayn': 13, 'fe': 14, 'kef': 15,
    'lam': 16, 'mim': 17, 'nun': 18, 'he': 19, 'vav': 20, 'ye': 21,
    'hi': 22, 'gayn': 23, 'kaf': 24, 'sad': 25, 'dad': 26, 'ti': 27, 'zi': 28
}

# 2. ÖTRE (DAMME) EŞLEŞTİRMESİ
damme_map = {
    'elif': 1, 'be': 2, 'te': 3, 'se': 4, 'cim': 5, 'ha': 6, 'dal': 7, 'zel': 8,
    'ze': 9, 'sin': 10, 'sin2': 11, 'ayn': 12, 'fe': 13, 'kef': 14,
    'lam': 15, 'mim': 16, 'nun': 17, 'he': 18, 'vav': 19, 'ye': 20,
    'hi': 21, 'ra': 22, 'gayn': 23, 'kaf': 24, 'sad': 25, 'dad': 26, 'ti': 27, 'zi': 28
}

headers = {'User-Agent': 'Mozilla/5.0'}

def indir(hedef_dizin, baseUrl, mapping):
    os.makedirs(hedef_dizin, exist_ok=True)
    for harf_id, idx in mapping.items():
        out_path = os.path.join(hedef_dizin, f"{harf_id}.mp3")
        url = f"{baseUrl}/btn_{idx}.mp3"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                with open(out_path, 'wb') as f:
                    f.write(data)
            print(f"[OK] {harf_id} -> {url} ({len(data)} bytes)")
        except Exception as e:
            print(f"[HATA] {harf_id} -> {url}: {e}")

print("=== 1. ESRE (KESRA) SESLERİ İNDİRİLİYOR ===")
indir("public/media/ses/elifba/esre", "https://kuran.diyanet.gov.tr/elifba/data/sound/elifba/kesra/kesra", kesra_map)

print("\n=== 2. ÖTRE (DAMME) SESLERİ İNDİRİLİYOR ===")
indir("public/media/ses/elifba/otre", "https://kuran.diyanet.gov.tr/elifba/data/sound/elifba/damme/damme", damme_map)

print("\nTamamlandı!")
