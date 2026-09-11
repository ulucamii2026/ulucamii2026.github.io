import sys
from pathlib import Path
from PIL import Image
import fitz

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

slugs = [
    "00-ai-genel-tanitim",
    "01-ai-hanimlar-pazartesi",
    "02-ai-hanimlar-persembe",
    "03-ai-marche-carsamba",
    "04-ai-genc-kizlar-cuma",
    "05-ai-kiz-cocuklari-hafta-sonu",
    "06-ai-birebir-gorusme",
    "07-ai-haftalik-program-ozeti",
]

print("=== PNG VE PDF ÇIKTI DENETİMİ ===")
all_ok = True
for s in slugs:
    png_p = Path(f"{s}.png")
    pdf_p = Path(f"{s}.pdf")

    if not png_p.exists():
        print(f"[X] EKSİK PNG: {png_p}")
        all_ok = False
    else:
        im = Image.open(png_p)
        status = "OK" if im.size == (1080, 1350) else "BOYUT HATASI"
        print(f"  [PNG] {png_p.name:<32} {im.size[0]}x{im.size[1]} ({status})")
        if status != "OK":
            all_ok = False

    if not pdf_p.exists():
        print(f"[X] EKSİK PDF: {pdf_p}")
        all_ok = False
    else:
        doc = fitz.open(pdf_p)
        status = "OK" if len(doc) == 1 else "SAYFA HATASI"
        print(f"  [PDF] {pdf_p.name:<32} Sayfa: {len(doc)} ({status})")
        if status != "OK":
            all_ok = False

preview_p = Path("onizleme.jpg")
if preview_p.exists():
    im = Image.open(preview_p)
    print(f"  [ÖNİZLEME] {preview_p.name:<28} {im.size[0]}x{im.size[1]} (OK)")

print("-" * 50)
print("SONUÇ:", "TÜM DOSYALAR DOĞRULANDI" if all_ok else "HATALAR BULUNDU")
