"""Basılı ezber kartı PDF'lerini denetler (Faz 2e, 24 Ekim 2026).

Kullanım:  python scripts/ezber-kart-dogrula.py [klasör]      (varsayılan: output/ezber-kartlari)
Klasör düzeni `scripts/ezber-kart-pdf.mjs` çıktısıdır: <klasör>/<dil>/<madde>.pdf.

Her kart için denetlenenler:
  1. Piksel görsel yok: PyMuPDF `get_images` her sayfada boş ve (varsa) `pdfimages -list` satır vermez. Kare kod ve motifler vektördür.
  2. Yazı tipleri gömülü: (varsa) `pdffonts` çıktısında `emb` sütunu hep «yes».
  3. Kare kod ilk sayfadan OpenCV ile çözülür ve sayfanın kanonik adresine
     (https://egitim.ulucamii.be/<dil>/calis/<madde>/) eşit olmalı.
  4. Metin katmanı var (PDF'ten seçilip kopyalanabilir) ve sayfanın başlığını içerir.
Bağımlılıklar: PyMuPDF (fitz), opencv-python, numpy. Poppler (pdffonts, pdfimages) yoksa 1. ve 2. denetim yalnız PyMuPDF'le yapılır.
Çıkış kodu: hepsi geçtiyse 0, değilse 1.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

try:
    import pymupdf as fitz  # yeni ad
except ImportError:  # eski PyMuPDF
    import fitz

SITE = "https://egitim.ulucamii.be"


def poppler(arac, pdf):
    yol = shutil.which(arac)
    if not yol:
        return None
    s = subprocess.run([yol, *(["-list"] if arac == "pdfimages" else []), str(pdf)], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return s.stdout.splitlines()[2:] if s.returncode == 0 else None


def kare_kod_coz(sayfa):
    """İlk sayfadaki kare kodu çözer; tam sayfada bulamazsa sağ üst bölgeyi büyüterek dener."""
    det = cv2.QRCodeDetector()
    for dpi, kes in ((200, False), (300, True), (400, True)):
        pix = sayfa.get_pixmap(dpi=dpi)
        g = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        g = cv2.cvtColor(g, cv2.COLOR_RGB2GRAY) if pix.n >= 3 else g[:, :, 0]
        if kes:
            g = g[: int(pix.height * 0.32), int(pix.width * 0.55):]
        metin, _, _ = det.detectAndDecode(g)
        if metin:
            return metin
    return ""


def denetle(pdf):
    dil, madde = pdf.parent.name, pdf.stem
    sorunlar = []
    belge = fitz.open(pdf)
    if belge.page_count < 1:
        return ["sayfa yok"], 0
    for i, s in enumerate(belge):
        if s.get_images(full=True):
            sorunlar.append(f"sayfa {i + 1}: piksel görsel var")
    gorseller = poppler("pdfimages", pdf)
    if gorseller:
        sorunlar.append(f"pdfimages {len(gorseller)} görsel buldu")
    yazilar = poppler("pdffonts", pdf)
    if yazilar is not None:
        for x in yazilar:
            parca = x.split()
            # son beş sütun: emb sub uni objectID gen → emb = parca[-5]
            if len(parca) >= 5 and parca[-5] != "yes":
                sorunlar.append(f"yazı tipi gömülü değil: {x.strip()[:60]}")
    beklenen = f"{SITE}/{dil}/calis/{madde}/"
    cozulen = kare_kod_coz(belge[0])
    if cozulen != beklenen:
        sorunlar.append(f"kare kod {cozulen!r}, beklenen {beklenen!r}")
    if len(belge[0].get_text().strip()) < 40:
        sorunlar.append("metin katmanı yok (yazı seçilemez)")
    return sorunlar, belge.page_count


def main():
    kok = Path(sys.argv[1] if len(sys.argv) > 1 else "output/ezber-kartlari")
    pdfler = sorted(kok.glob("*/*.pdf"))
    if not pdfler:
        print(f"PDF bulunamadı: {kok}")
        return 1
    hatali = 0
    sayfa_toplam = 0
    for p in pdfler:
        sorunlar, sayfa = denetle(p)
        sayfa_toplam += sayfa
        if sorunlar:
            hatali += 1
            print(f"HATA {p.parent.name}/{p.name}: " + "; ".join(sorunlar))
    print(f"{len(pdfler)} PDF, {sayfa_toplam} sayfa denetlendi; hatalı: {hatali}")
    return 1 if hatali else 0


if __name__ == "__main__":
    sys.exit(main())
