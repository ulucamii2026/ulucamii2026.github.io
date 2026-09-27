# -*- coding: utf-8 -*-
"""
Ulu Nesih — egitim.ulucamii.be'nin Kur'an ve dua yazı tipi (27 Eylül 2026, Ezber Kilimi Faz 1e).

Kaynak: SIL Global «Scheherazade New» 4.500 (egitim/fontlar/kaynak/, SIL Open Font License 1.1; ayrılmış adlar
«Scheherazade» ve «SIL»). Neden bu font (karşılaştırma: egitim/docs/DESIGN.md «Arapça yazı»):
  - Diyanet'in çevrim içi mushafındaki Türk usulü yazımın (çeker esre U+0656, çeker üstün U+0670, ط ز ع قف sekte
    vakıf işaretleri, U+06EB/06EC halkaları) bütün 62 kod noktasını kapsar; katalogdaki 583 âyet HarfBuzz'la
    hatasız şekillenir (Amiri Quran 4 vakıf işaretini içermez, 14 âyet bozulur).
  - `cv62=1` ile şeddeli esre harfin altına iner (Türk mushaf usulü); cezm varsayılan kapalı dairedir (Diyanet gibi).
    Bu ayar CSS'te verilir: `font-feature-settings: "cv62" 1` (Chrome @font-face tanımında bu tanımlayıcıyı okumaz).

OFL SSS 2.6: webfont için alt küme almak değişikliktir; değiştirilmiş sürüm ayrılmış adı taşıyamaz. Bu yüzden alt küme
«Ulu Nesih» adını alır; telif satırı ve lisans korunur, OFL.txt yazı tipinin yanında yayımlanır.

Küme: Kur'an ve dua metinlerinin bütün Arapça harf ve işaretleri (165 kod noktası; Farsça/Urduca harfler yok). İçerik
büyüse de yeniden üretim gerekmez; yeni bir kod noktası gerekirse KUME'ye eklenip betik yeniden çalıştırılır.

Çalıştırma (depo kökünden):  py -3.14 egitim/scripts/ulu-nesih-uret.py
Çıktı: egitim/public/fonts/ulu-nesih.woff2 + ulu-nesih-OFL.txt + ulu-nesih.json (kaynak ve çıktı özetleri, küme).
"""
import hashlib
import io
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

KOK = Path(__file__).resolve().parents[1]
KAYNAK = KOK / 'fontlar' / 'kaynak' / 'ScheherazadeNew-Regular.ttf'
KAYNAK_SHA256 = '794bac8dc9e83d1d620bc471ea694f5f31d0965ce8006490a79dfc51a2d283b3'  # SIL sürüm 4.500 (15 Nisan 2026)
HEDEF = KOK / 'public' / 'fonts'
AD = 'Ulu Nesih'
PS_AD = 'UluNesih-Regular'


def aralik(a: int, b: int) -> list[int]:
    return list(range(a, b + 1))


KUME = sorted(set(
    aralik(0x0610, 0x061A)      # küçük yüksek işaretler: ط (U+0615), ز (U+0617)…
    + aralik(0x0621, 0x063A)    # harfler
    + aralik(0x0640, 0x065F)    # tatvil, harfler, harekeler, alt elif (U+0656: çeker esre)
    + aralik(0x0660, 0x066D)    # Arap-Hint rakamları, ayraçlar
    + [0x0670, 0x0671]          # üst elif (çeker üstün), vasl elifi
    + aralik(0x06D6, 0x06ED)    # Kur'an işaretleri (vakıf, secde, halkalar)
    + aralik(0x08D3, 0x08FF)    # genişletilmiş Kur'an işaretleri: ع (U+08D6), ق (U+08D7), sekte (U+08DD), قف (U+08DE)
    + [0x060C, 0x061B, 0x061F, 0x06DD, 0x06DE, 0x06E9, 0xFD3E, 0xFD3F, 0xFDF2, 0x25CC, 0x200C, 0x200D, 0x0020, 0x00A0]
))


def sha256(veri: bytes) -> str:
    return hashlib.sha256(veri).hexdigest()


def main() -> int:
    ham = KAYNAK.read_bytes()
    if sha256(ham) != KAYNAK_SHA256:
        print(f'KAYNAK DEĞİŞMİŞ: {KAYNAK} beklenen özet {KAYNAK_SHA256}. Yeni sürümse karşılaştırmayı yinele.', file=sys.stderr)
        return 1
    f = TTFont(io.BytesIO(ham), recalcTimestamp=False)  # aynı kaynak → aynı bayt (özet json'da tutulur)
    cmap = f.getBestCmap()
    eksik = [f'U+{k:04X}' for k in KUME if k not in cmap and k not in (0x200C, 0x200D)]
    if eksik:
        print('Kaynakta olmayan kod noktası:', ', '.join(eksik), file=sys.stderr)
        return 1

    sec = subset.Options()
    sec.layout_features = ['*']          # Arapça şekillenme + cv62 ve öbür karakter değişkeleri kalır
    sec.flavor = 'woff2'
    sec.hinting = False
    sec.desubroutinize = True
    sec.name_IDs = ['*']
    sec.name_languages = ['*']
    sec.drop_tables += ['Silf', 'Glat', 'Gloc', 'Feat', 'Sill', 'Silt']  # Graphite/SIL tabloları: tarayıcılar okumaz
    alt = subset.Subsetter(options=sec)
    alt.populate(unicodes=KUME)
    alt.subset(f)

    # Yeniden adlandırma (OFL: ayrılmış ad değiştirilmiş sürümde kullanılamaz). Telif (0) ve lisans (13, 14) korunur.
    surum = f['name'].getDebugName(5) or ''
    for kayit in list(f['name'].names):
        if kayit.nameID in (1, 16):
            kayit.string = AD
        elif kayit.nameID in (2, 17):
            kayit.string = 'Regular'
        elif kayit.nameID == 4:
            kayit.string = f'{AD} Regular'
        elif kayit.nameID == 6:
            kayit.string = PS_AD
        elif kayit.nameID == 3:
            kayit.string = f'{PS_AD};{surum};ulucamii.be'
        elif kayit.nameID == 5:
            kayit.string = f'{surum}; Ulu Nesih: subset of Scheherazade New, renamed (OFL 1.1)'
        elif kayit.nameID in (18, 21, 22, 25):
            f['name'].names.remove(kayit)
    kalan = [f['name'].getDebugName(i) or '' for i in (1, 3, 4, 6, 16)]
    if any('Scheherazade' in x or 'SIL' in x for x in kalan):
        print('Ayrılmış ad kaldı:', kalan, file=sys.stderr)
        return 1

    cikti = io.BytesIO()
    f.flavor = 'woff2'
    f.save(cikti)
    veri = cikti.getvalue()
    HEDEF.mkdir(parents=True, exist_ok=True)
    (HEDEF / 'ulu-nesih.woff2').write_bytes(veri)
    (HEDEF / 'ulu-nesih-OFL.txt').write_bytes((KAYNAK.parent / 'OFL.txt').read_bytes())
    (HEDEF / 'ulu-nesih.json').write_text(json.dumps({
        'ad': AD,
        'kaynak': {'dosya': 'egitim/fontlar/kaynak/ScheherazadeNew-Regular.ttf', 'surum': surum, 'sha256': KAYNAK_SHA256,
                   'lisans': 'SIL Open Font License 1.1 (ayrılmış adlar: Scheherazade, SIL)'},
        'cikti': {'dosya': 'egitim/public/fonts/ulu-nesih.woff2', 'bayt': len(veri), 'sha256': sha256(veri)},
        'css': {'font-feature-settings': '"cv62" 1', 'neden': 'şeddeli esre harfin altında (Türk mushaf usulü)'},
        'kume': [f'U+{k:04X}' for k in KUME],
    }, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'{AD}: {len(KUME)} kod noktası, {len(veri) / 1024:.1f} KB → {HEDEF.relative_to(KOK.parent)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
