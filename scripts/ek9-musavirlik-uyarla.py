"""EK-9'da yalnız Müşavirlik seçeneğini bırakır; metinleri silmeden alternatifleri çizer.

Kullanım: python scripts/ek9-musavirlik-uyarla.py kaynak.pdf hedef.pdf
Boş şablona veya EK-9 ile başlayan bir belge paketine uygulanabilir.
"""
import argparse
from pathlib import Path

import pymupdf


def uyarla(kaynak: Path, hedef: Path):
    belge = pymupdf.open(kaynak)
    sayfa = belge[0]
    secenekler = ["Müftülüğümüze/", "/ Ataşeliğimize", "Muftiate/", "/Attaché"]
    korunanlar = ["Müşavirliğimize", "Office of the Counsellor"]
    if any(not sayfa.search_for(metin) for metin in korunanlar):
        raise ValueError("Beklenen EK-9 kurum metni bulunamadı; belge değiştirilmedi.")
    cizgiler = []
    for secenek in secenekler:
        parcalar = sayfa.search_for(secenek)
        if not parcalar or any(abs(p.y0 - parcalar[0].y0) > 1 for p in parcalar):
            raise ValueError("EK-9 seçenekleri beklenen satırda değil; belge değiştirilmedi.")
        kutu = pymupdf.Rect(parcalar[0])
        for parca in parcalar[1:]:
            kutu |= parca
        y = (kutu.y0 + kutu.y1) / 2
        cizgiler.append((kutu.x0 + .25, y, kutu.x1 - .25, y))
    onceki = [
        (c[1].x, c[1].y, c[2].x, c[2].y)
        for d in sayfa.get_drawings() for c in d["items"] if c[0] == "l"
    ]
    for x0, y0, x1, y1 in cizgiler:
        if any(all(abs(a - b) < .1 for a, b in zip((x0, y0, x1, y1), eski)) for eski in onceki):
            continue
        sayfa.draw_line((x0, y0), (x1, y1), color=(.08, .2, .48), width=.8, overlay=True)
    veri = belge.tobytes(garbage=4, deflate=True)
    belge.close()
    hedef.write_bytes(veri)
    print("Müşavirlik seçimi uygulandı: Türkçe ve İngilizce 4 alternatif çizildi.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kaynak", type=Path)
    parser.add_argument("hedef", type=Path)
    args = parser.parse_args()
    uyarla(args.kaynak, args.hedef)
