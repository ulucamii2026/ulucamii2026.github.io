# -*- coding: utf-8 -*-
"""
Yönetim paneli (public/admin/) için yazı tipi alt kümeleri üretir → public/fonts/panel/.

Neden: panel derlenmeyen tek bir HTML dosyasıdır; sitenin fontsource ile paketlediği
Lora / Work Sans / IBM Plex Mono dosyalarına (karma adlı, dist/_astro/…) ulaşamaz. CSS bu
yazı tiplerini adıyla anıyordu ama hiçbiri yüklenmiyordu — panel Georgia / Segoe UI /
Courier New'a düşüyordu (4 Eylül 2026 ekran görüntüsü: mono etiketler daktilo görünümünde).

fontsource her aileyi karakter kümesine göre AYRI dosyalara böler (latin / latin-ext) ve
Türkçe ikisine yayılır: ı latin'de, İ ş ğ latin-ext'te; Plex Mono'nun latin-ext dosyasında
ASCII bile yoktur. Bu betik iki parçayı fontTools.merge ile tek fonta birleştirir (değişken
fontları önce sabit ağırlığa örnekler), sonra Latin + Latin-Ext + temel noktalamayla alt
kümeler ve woff2 yazar. Sonuç: aile × ağırlık başına TEK dosya, tek @font-face.

Kullanım:  py -3.14 scripts/panel-fontlar-uret.py
Kaynak: node_modules/@fontsource-variable/{lora,work-sans}, node_modules/@fontsource/ibm-plex-mono
(brotli gerekir: py -3.14 -m pip install brotli)
"""
import sys, tempfile
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.merge import Merger
from fontTools import subset

KOK = Path(__file__).resolve().parents[1]
HEDEF = KOK / "public" / "fonts" / "panel"
NM = KOK / "node_modules"

# Latin + Latin-Ext + tipografik noktalama (« » — … ·) + € + ok/onay işaretleri (varsa)
UNICODES = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+0218-021B,U+02C6-02DC,U+2000-2027,U+2030-203A,U+2044,U+20AC,U+2190-2199,U+2212,U+2260,U+25B8,U+25BE,U+260E,U+2713,U+2714,U+2197"
OZELLIKLER = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "tnum", "pnum", "lnum"]

def statik(kaynak: Path, wght, hedef: Path) -> Path:
    """woff2 kaynağı sıkıştırmasız TTF'e aç; değişkense wght'a örnekle."""
    f = TTFont(kaynak)
    if "fvar" in f:
        f = instancer.instantiateVariableFont(f, {"wght": wght}, inplace=False, updateFontNames=False)
    f.flavor = None
    f.save(hedef)
    f.close()   # Windows: açık tanıtıcı geçici dizinin silinmesini engeller
    return hedef

def uret(ad: str, parcalar: list[Path], wght, hedef: Path):
    with tempfile.TemporaryDirectory() as t:
        t = Path(t)
        statikler = [statik(p, wght, t / f"{i}.ttf") for i, p in enumerate(parcalar)]
        birlesik = Merger().merge([str(s) for s in statikler]) if len(statikler) > 1 else TTFont(statikler[0], lazy=False)
        ara = t / "birlesik.ttf"; birlesik.save(ara); birlesik.close()

        sec = subset.Options()
        sec.flavor = "woff2"
        sec.layout_features = OZELLIKLER
        sec.hinting = False
        sec.desubroutinize = True
        sec.notdef_outline = True
        sec.name_IDs = [1, 2, 4, 6]
        font = subset.load_font(str(ara), sec, lazy=False)
        s = subset.Subsetter(sec)
        s.populate(unicodes=subset.parse_unicodes(UNICODES))
        s.subset(font)
        HEDEF.mkdir(parents=True, exist_ok=True)
        subset.save_font(font, str(hedef), sec)
        font.close()
        cm = TTFont(hedef).getBestCmap()
        eksik = [c for c in "AaıİşğüöçÇ€«»—…·" if ord(c) not in cm]
        print(f"  {hedef.name:24} {hedef.stat().st_size/1024:6.1f} KB  glif {len(cm):3}" + (f"  EKSİK: {''.join(eksik)}" if eksik else ""))

def main() -> int:
    if not NM.exists():
        print("node_modules yok — önce npm install", file=sys.stderr); return 1
    lora = NM / "@fontsource-variable" / "lora" / "files"
    ws = NM / "@fontsource-variable" / "work-sans" / "files"
    pm = NM / "@fontsource" / "ibm-plex-mono" / "files"
    print("Lora (değişken → 400, 700)")
    for w in (400, 700):
        uret("Lora", [lora / "lora-latin-wght-normal.woff2", lora / "lora-latin-ext-wght-normal.woff2"], w, HEDEF / f"lora-{w}.woff2")
    print("Work Sans (değişken → 400, 500, 600)")
    for w in (400, 500, 600):
        uret("Work Sans", [ws / "work-sans-latin-wght-normal.woff2", ws / "work-sans-latin-ext-wght-normal.woff2"], w, HEDEF / f"work-sans-{w}.woff2")
    print("IBM Plex Mono (statik 400, 500)")
    for w in (400, 500):
        uret("IBM Plex Mono", [pm / f"ibm-plex-mono-latin-{w}-normal.woff2", pm / f"ibm-plex-mono-latin-ext-{w}-normal.woff2"], None, HEDEF / f"plex-mono-{w}.woff2")
    toplam = sum(p.stat().st_size for p in HEDEF.glob("*.woff2"))
    print(f"TOPLAM {toplam/1024:.0f} KB → {HEDEF.relative_to(KOK)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
