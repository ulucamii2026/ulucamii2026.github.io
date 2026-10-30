"""Suret filigranının GAS'ta gömülen yazı tiplerini alt kümeyle üretir: Lora Regular ve Bold → public/fonts/suret/.

30 Eki 2026 (v45): Apps Script'te fontkit'in alt küme yazıcısı çalışmadığı için (Node akışı/timer ister) GAS, yazı tiplerini tam
gömüyor; başvurana giden suret bu yüzden Lora'nın iki kesimini (~2 × 134 KB) belgede zaten bulunan kopyalarına ek olarak bir kez
daha taşıyordu. Suretin metinleri sabit ve Latin harfli olduğundan alt küme derleme öncesinde, burada, fontTools ile bir kez
alınır; cmap korunur, pdf-lib onu `subset: false` ile olduğu gibi gömer. Kapsam: Temel Latin, Latin-1, Latin Genişletilmiş-A
(Türkçe ı İ ş Ş ğ Ğ dâhil), genel noktalama (– — ‘ ’ “ ” • … ‹ ›), dar bölünmez boşluk ve €. Fransızca, Felemenkçe ve Almanca
harfler de içindedir. GSUB/GPOS ve ipucu tabloları atılır (pdf-lib çıktıya kerning ya da bitişik harf yazmaz): her kesim
~33 KB. Kapsamı tests/suret-yazi-tipi.test.mjs denetler (SURET_METNI'nin her harfi alt kümede olmalı).

Kullanım (site kökünden): python scripts/suret-yazi-tipi.py   → çıktı bayt bayt tekrarlanır; değişmediyse yeniden yazılmaz.
Lora: SIL OFL 1.1 (Cyreal); alt küme de aynı lisansla dağıtılır (public/fonts/ihtida-fontlari.md).
"""
import hashlib
import io
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

KOK = Path(__file__).resolve().parents[1]
KAYNAK = KOK / "public" / "fonts"
HEDEF = KAYNAK / "suret"
ARALIKLAR = [(0x20, 0x7E), (0xA0, 0xFF), (0x100, 0x17F), (0x2010, 0x2027), (0x2030, 0x203A), (0x202F, 0x202F), (0x20AC, 0x20AC)]


def alt_kume(kaynak: Path) -> bytes:
    font = TTFont(kaynak, recalcTimestamp=False)   # yoksa save() head.modified'a o anki saati yazar: her koşu farklı dosya
    secenek = subset.Options()
    secenek.layout_features = []      # pdf-lib çıktıya kerning/bitişik harf yazmaz; GSUB/GPOS yalnız yer kaplar
    secenek.hinting = False           # yarı saydam filigran ve küçük şerit: ipucu tablolarına gerek yok
    secenek.name_IDs = ["*"]
    secenek.name_languages = ["*"]
    secenek.notdef_outline = True
    secenek.recalc_timestamp = False
    alt = subset.Subsetter(options=secenek)
    alt.populate(unicodes=[u for a, b in ARALIKLAR for u in range(a, b + 1)])
    alt.subset(font)
    tampon = io.BytesIO()
    font.save(tampon)
    return tampon.getvalue()


def main():
    HEDEF.mkdir(exist_ok=True)
    for ad in ("Lora-Regular", "Lora-Bold"):
        veri = alt_kume(KAYNAK / f"{ad}.ttf")
        cikti = HEDEF / f"{ad}-suret.ttf"
        eski = cikti.read_bytes() if cikti.exists() else b""
        if eski != veri:
            cikti.write_bytes(veri)
        print(f"{cikti.relative_to(KOK).as_posix()}: {len(veri)} bayt (kaynak {(KAYNAK / f'{ad}.ttf').stat().st_size}) "
              f"sha256 {hashlib.sha256(veri).hexdigest()[:16]}{' (değişmedi)' if eski == veri else ''}")


if __name__ == "__main__":
    sys.exit(main())
