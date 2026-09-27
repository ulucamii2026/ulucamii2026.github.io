# -*- coding: utf-8 -*-
"""
Atkinson Hyperlegible Next — egitim.ulucamii.be'nin Latin yazı tipi (27 Eylül 2026, Ezber Kilimi Faz 1e).

Kaynak: Braille Institute / Google Fonts «Atkinson Hyperlegible Next» 2.001, değişken (wght 200–800) düz ve italik
(egitim/fontlar/kaynak/atkinson/, SIL Open Font License 1.1; ayrılmış yazı tipi adı YOK — alt küme adını korur).
Neden bu font (karşılaştırma: egitim/docs/DESIGN.md «Yazı»): okumayı yeni öğrenen çocuk, yaşlı ve ikinci dilinde
okuyan veli için harfleri birbirinden ayrışacak biçimde çizilmiş; tr, fr, en, nl, de ve okunuş işaretlerinin
(â î û ā ğ ı İ ş ç œ ß ë) hepsini kapsar; Ulu Nesih'in hat ritminden açıkça ayrılır (Kur'an metni ile rehber metin iki
ayrı ses).

Küme: Latin temel + Latin-1 + Latin Genişletilmiş-A + birleşen işaretler + noktalama; fontta olmayan kod noktası
atlanır. Değişken eksen (wght) ve bütün OpenType özellikleri (kern, locl TUR, case, tnum, frac…) korunur.

Çalıştırma (depo kökünden):  py -3.14 egitim/scripts/atkinson-uret.py
Çıktı: egitim/public/fonts/atkinson-next.woff2, atkinson-next-italik.woff2, atkinson-next-OFL.txt, atkinson-next.json
"""
import hashlib
import io
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

KOK = Path(__file__).resolve().parents[1]
KAYNAK = KOK / 'fontlar' / 'kaynak' / 'atkinson'
HEDEF = KOK / 'public' / 'fonts'
DOSYALAR = {
    'atkinson-next.woff2': ('AtkinsonHyperlegibleNext[wght].ttf',
                            '5a455d1cfa099b601ab70751bb9673e8fe1854dc4500c80e1a220d0d75e31745'),
    'atkinson-next-italik.woff2': ('AtkinsonHyperlegibleNext-Italic[wght].ttf',
                                   'ce9cffed32742ad2d9238c561a93220385e5934cdc02b8eb4097a50efa957dc6'),
}


def aralik(a: int, b: int) -> list[int]:
    return list(range(a, b + 1))


KUME = sorted(set(
    aralik(0x0020, 0x007E) + aralik(0x00A0, 0x00FF) + aralik(0x0100, 0x017F)
    + aralik(0x02B0, 0x02FF)      # değiştirici harfler (ʼ ˆ ˜ …)
    + aralik(0x0300, 0x036F)      # birleşen işaretler (okunuşta harf + işaret)
    + aralik(0x1E00, 0x1EFF)      # Latin Genişletilmiş Ek (ḥ ṣ ṭ … fontta varsa)
    + aralik(0x2000, 0x206F)      # genel noktalama (– — ‘ ’ “ ” „ … · ‹ ›, ince boşluklar)
    + [0x20AC, 0x2116, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2713, 0x25CF]
))


def sha256(veri: bytes) -> str:
    return hashlib.sha256(veri).hexdigest()


def uret(kaynak: Path) -> bytes:
    f = TTFont(io.BytesIO(kaynak.read_bytes()), recalcTimestamp=False)
    sec = subset.Options()
    sec.layout_features = ['*']
    sec.flavor = 'woff2'
    sec.hinting = False
    sec.name_IDs = ['*']
    sec.name_languages = ['*']
    sec.notdef_outline = True
    alt = subset.Subsetter(options=sec)
    alt.populate(unicodes=KUME)
    alt.subset(f)
    cikti = io.BytesIO()
    f.flavor = 'woff2'
    f.save(cikti)
    return cikti.getvalue()


def main() -> int:
    kayit = {'ad': 'Atkinson Hyperlegible Next', 'lisans': 'SIL Open Font License 1.1 (ayrılmış ad yok)', 'dosyalar': []}
    HEDEF.mkdir(parents=True, exist_ok=True)
    for hedef_ad, (kaynak_ad, beklenen) in DOSYALAR.items():
        kaynak = KAYNAK / kaynak_ad
        ozet = sha256(kaynak.read_bytes())
        if ozet != beklenen:
            print(f'KAYNAK DEĞİŞMİŞ: {kaynak} ({ozet}); yeni sürümse karşılaştırmayı yinele.', file=sys.stderr)
            return 1
        veri = uret(kaynak)
        (HEDEF / hedef_ad).write_bytes(veri)
        kayit['dosyalar'].append({'kaynak': f'egitim/fontlar/kaynak/atkinson/{kaynak_ad}', 'kaynak_sha256': ozet,
                                  'cikti': f'egitim/public/fonts/{hedef_ad}', 'bayt': len(veri), 'sha256': sha256(veri)})
        print(f'{hedef_ad}: {len(veri) / 1024:.1f} KB')
    (HEDEF / 'atkinson-next-OFL.txt').write_bytes((KAYNAK / 'OFL.txt').read_bytes())
    kayit['kume'] = f'{len(KUME)} kod noktası (fontta olmayanlar atlanır)'
    (HEDEF / 'atkinson-next.json').write_text(json.dumps(kayit, ensure_ascii=False, indent=1) + '\n', encoding='utf-8',
                                              newline='\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
