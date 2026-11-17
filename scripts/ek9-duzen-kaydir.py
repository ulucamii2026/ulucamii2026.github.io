"""EK-9 ön yüz şablonunu «imza yeri» düzenine (EK9_DUZEN = 2) kaydırır; yalnız konum değişir.

Kullanım:
  python scripts/ek9-duzen-kaydir.py kaynak.pdf hedef.pdf     # kaydırır ve doğrular
  python scripts/ek9-duzen-kaydir.py --denetle belge.pdf      # yalnız hangi düzende olduğunu söyler (1 ya da 2)

Şablon Diyanet'in hazır PDF'idir; üretici kaynağı yoktur. Bu yüzden içerik akışındaki bloklar yerinde kaydırılır:
metin matrisi (Tm) y'leri, başlık ayracı, vesikalık çerçevesi, noktalı ad çizgisi ve kurum çizikleri. Süsleme çerçevesi ve
orta filigran akışın ilk bölümünde durur ve DOKUNULMAZ. Her şey vektör kalır (görüntü yok). Kaymalar docs/EK9-IMZA-YERI-DUZENI.md
tablosundaki değerlerdir (pt, üst kenardan; eksi = yukarı). 0,983158 çarpanı şablonun metin bölümündeki cm ölçeğidir.
"""
import argparse
import re
import sys
from decimal import Decimal
from pathlib import Path

import pikepdf
import pymupdf

OLCEK = Decimal("0.983158")           # metin bölümündeki cm ölçeği (y yukarı doğru)
# Kayma değerleri: üst kenardan pt; eksi = yukarı, artı = aşağı.
KAYMA_UST = Decimal("-6.5")           # başlık, ayraç, unvan, vesikalık çerçevesi, noktalı çizgi, Türkçe paragraf, Türkçe çizikler
KAYMA_INGILIZCE = Decimal("-10.25")   # İngilizce paragraf ve İngilizce çizikler
KAYMA_YETKILI = Decimal("8")          # «Diyanet İşleri Başkanlığı Yetkilisi» iki etiket satırı (şahit etiketleri YERİNDE)
SAYFA_YUKSEKLIK = Decimal("595.2756")
# Düzen ayırt etmek için: İngilizce paragrafın ilk satırı (üstten, pt). 1 → ≈345,2 ; 2 → ≈334,9
INGILIZCE_ILK_SATIR = ("Have applied", {1: 345.2, 2: 345.2 + float(KAYMA_INGILIZCE)})


def duzen_bul(pdf: Path) -> int:
    belge = pymupdf.open(pdf)
    try:
        yer = belge[0].search_for(INGILIZCE_ILK_SATIR[0])
        if not yer:
            raise ValueError("İngilizce paragraf bulunamadı: bu bir EK-9 ön yüzü değil.")
        ust = yer[0].y0 - 0.1  # search_for kutusu ≈ satır kutusu
        # satır kutusu üstü: 1. düzen 345.2 (bbox), 2. düzen 334.95 (bbox)
        for no, beklenen in INGILIZCE_ILK_SATIR[1].items():
            if abs(ust - beklenen) < 2.5:
                return no
        raise ValueError(f"Tanınmayan düzen (İngilizce ilk satır y={ust:.2f}).")
    finally:
        belge.close()


def _f(d: Decimal) -> bytes:
    """Şablonun kendi yazımına uygun sayı: en çok 5 ondalık, sondaki sıfırlar atılır."""
    t = format(d.quantize(Decimal("0.00001")), "f").rstrip("0").rstrip(".")
    return t.encode()


def _tek(veri: bytes, eski: bytes, yeni: bytes) -> bytes:
    if veri.count(eski) != 1:
        raise ValueError(f"Beklenen içerik tam bir kez bulunamadı: {eski[:50]!r} ({veri.count(eski)})")
    return veri.replace(eski, yeni)


def kaydir(kaynak: Path, hedef: Path) -> None:
    """İçerik akışları METİN olarak düzenlenir (yalnız ilgili sayılar); ham yazım korunur. cizikleriBoya() ve
    tests/ihtida-contract.test.mjs bu yazımı (.08 .2 .48 RG, «x y m / x y l / .8 w») arar."""
    if duzen_bul(kaynak) != 1:
        raise ValueError("Kaynak 1. düzende değil; çift kaydırma engellendi.")
    pdf = pikepdf.open(kaynak)
    akislar = list(pdf.pages[0].Contents)
    dy = lambda ust_kayma: -ust_kayma / OLCEK       # ölçekli bölümde y farkı
    dy_mutlak = lambda ust_kayma: -ust_kayma        # ölçeksiz küçük akışlarda y farkı
    degisen = {"Tm": 0, "cizgi": 0, "cerceve": 0, "kurum": 0}

    # --- ana akış: Tm satırları ve üç çizgi/çerçeve --------------------------------------------------------------
    ana = max(akislar, key=lambda a: len(a.read_bytes()))
    veri = ana.read_bytes()
    sinir = veri.index(b"BT 1 0 0 1 397.2636 444.06 Tm")        # filigran/süs bölümü bunun ÖNCESİNDE kalır, dokunulmaz
    bas, son = veri[:sinir], veri[sinir:]

    def tm(m):
        x, y = Decimal(m.group(2).decode()), Decimal(m.group(3).decode())
        if y > 260:
            kayma = KAYMA_UST                  # başlık, ayraç, İHTİDA BELGESİ başlığı, Türkçe paragraf
        elif 200 < y <= 260:
            kayma = KAYMA_INGILIZCE            # İngilizce paragraf
        elif 150 < y <= 200 and 300 < x < 350:
            kayma = KAYMA_YETKILI              # yetkili etiketleri (şahit etiketleri x≈150 ve 605: yerinde)
        else:
            return m.group(0)
        degisen["Tm"] += 1
        return m.group(1) + m.group(2) + b" " + _f(y + dy(kayma)) + m.group(4)

    son = re.sub(rb"(1 0 0 1 )([\d.]+) ([\d.]+)( Tm)", tm, son)
    k = dy(KAYMA_UST)
    for eski, yeni in (
        (b"n 424.4 452.56 m 424.4 412.96 l S", b"n 424.4 %s m 424.4 %s l S" % (_f(Decimal("452.56") + k), _f(Decimal("412.96") + k))),
        (b"n 344 331.06 m 513.2 331.06 l S", b"n 344 %s m 513.2 %s l S" % (_f(Decimal("331.06") + k), _f(Decimal("331.06") + k))),
        (b"n 643.4 324.76 53.7 67.4 re S", b"n 643.4 %s 53.7 67.4 re S" % _f(Decimal("324.76") + k)),
    ):
        son = _tek(son, eski, yeni)
        degisen["cerceve" if b" re " in eski else "cizgi"] += 1
    ana.write(bas + son)

    # --- küçük akışlar: kurum çizikleri (ölçeksiz mutlak y) ---------------------------------------------------------
    for a in akislar:
        if a is ana:
            continue
        ham = a.read_bytes()
        yeni = ham
        for eski_y, kayma in ((b"305.89607", KAYMA_UST), (b"244.35034", KAYMA_INGILIZCE)):
            if eski_y in yeni:
                yeni = yeni.replace(eski_y, _f(Decimal(eski_y.decode()) + dy_mutlak(kayma)))
        if yeni != ham:
            a.write(yeni)
            degisen["kurum"] += 1
    pdf.save(hedef, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.disable)
    pdf.close()
    print(f"kaydırıldı: Tm {degisen['Tm']}, çizgi {degisen['cizgi']}, çerçeve {degisen['cerceve']}, kurum çizik akışı {degisen['kurum']}")


def _bbox_ozeti(pdf: Path):
    d = pymupdf.open(pdf)
    s = d[0]
    metin = [(round(b[0], 2), round(b[1], 2), round(b[2], 2), round(b[3], 2), b[4][:28]) for b in s.get_text("words")]
    cizim = [(round(x["rect"].x0, 2), round(x["rect"].y0, 2), round(x["rect"].x1, 2), round(x["rect"].y1, 2), x["type"], len(x["items"])) for x in s.get_drawings()]
    gorsel = s.get_images()
    d.close()
    return metin, cizim, gorsel


def dogrula(kaynak: Path, hedef: Path) -> bool:
    mk, ck, gk = _bbox_ozeti(kaynak)
    mh, ch, gh = _bbox_ozeti(hedef)
    ok = True
    if gk or gh:
        print("HATA: görüntü var", gk, gh); ok = False
    if len(mk) != len(mh) or len(ck) != len(ch):
        print("HATA: öğe sayısı değişti", len(mk), len(mh), len(ck), len(ch)); return False
    sayac = {}
    for a, b in zip(mk, mh):
        dx, dy_ = round(b[0] - a[0], 2), round(b[3] - a[3], 2)
        if abs(dx) > .005 or abs(b[2] - a[2] - dx) > .005 or abs((b[1] - a[1]) - dy_) > .01 or a[4] != b[4]:
            print("HATA: metin x/boyut/içerik değişti", a, b); ok = False
        sayac.setdefault(dy_, []).append(a[4])
    for a, b in zip(ck, ch):
        dy_ = round(b[1] - a[1], 2)
        if abs(b[0] - a[0]) > .005 or abs((b[3] - a[3]) - dy_) > .01 or a[4:] != b[4:]:
            print("HATA: çizim x/boyut değişti", a, b); ok = False
        sayac.setdefault(("cizim", dy_), []).append(a[:4])
    for anahtar, liste in sorted(sayac.items(), key=lambda t: str(t[0])):
        print("Δy", anahtar, "→", len(liste), "öğe", liste[:2])
    return ok


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--denetle", type=Path)
    p.add_argument("kaynak", nargs="?", type=Path)
    p.add_argument("hedef", nargs="?", type=Path)
    a = p.parse_args()
    if a.denetle:
        print(duzen_bul(a.denetle)); sys.exit(0)
    kaydir(a.kaynak, a.hedef)
    sys.exit(0 if dogrula(a.kaynak, a.hedef) else 1)
