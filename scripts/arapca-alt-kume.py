# -*- coding: utf-8 -*-
"""
Ana sayfadaki SABİT Arapça satırlar için minik bir Amiri alt kümesi üretir.

Neden: Amiri'nin Arapça alt kümesi 108 KB'dır ve ana sayfada tek bir selam satırı için indiriliyordu
(4 Eylül 2026 ölçümü: sayfa ağırlığının ~%14'ü). Üstelik yazı tipi geç geldiği için satır bir
fallback yazı tipiyle çizilip sonra yeniden akıyor, hero'nun altındaki her şeyi kaydırıyordu
(ölçülen CLS payı 0,036 — sayfanın en büyük düzen kayması).

Çözüm: bu iki satır CMS'ten DÜZENLENMEZ, kodda sabittir. Yalnız onların glifleriyle ~5 KB'lık ayrı
bir yazı tipi ("Amiri Ana") üretilir, sabit adla public/fonts/ altına konur ve ana sayfada
preload edilir. Böylece ana sayfa tam Amiri'yi hiç istemez; âyet/hadis levhası olan öbür sayfalar
(cami adabı, yönetim kurulu, vefat sayfası) tam Amiri'yi kullanmaya devam eder.

DİKKAT: Aşağıdaki metinler değişirse bu betik yeniden çalıştırılmalıdır, yoksa eksik glifler
sistem yazı tipine düşer. Metinler `src/pages/[lang]/index.astro` ve `src/components/VefatBandi.astro`
içindekilerle birebir aynı olmalıdır.

Çalıştırma:  py -3.14 scripts/arapca-alt-kume.py
"""
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parents[1]
KAYNAK = KOK / "node_modules" / "@fontsource" / "amiri" / "files" / "amiri-arabic-400-normal.woff2"
HEDEF = KOK / "public" / "fonts" / "amiri-ana.woff2"

METINLER = [
    # Ana sayfa hero selamı — src/pages/[lang]/index.astro
    "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ",
    # Vefat bandı âyeti — src/components/VefatBandi.astro
    "إِنَّا لِلّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
]

def main() -> int:
    if not KAYNAK.exists():
        print(f"KAYNAK YOK: {KAYNAK}\n(npm install çalıştırılmış olmalı)", file=sys.stderr)
        return 1
    HEDEF.parent.mkdir(parents=True, exist_ok=True)
    glifler = sorted({ch for metin in METINLER for ch in metin})
    kodlar = ",".join(f"U+{ord(ch):04X}" for ch in glifler)
    print(f"{len(glifler)} benzersiz karakter: {kodlar}")

    komut = [
        sys.executable, "-m", "fontTools.subset", str(KAYNAK),
        f"--unicodes={kodlar}",
        # Arapça şekillenmesi bu tablolara bağlıdır: biçim seçimi (init/medi/fina/isol), bitişme
        # (rlig/liga/calt), birleşim (ccmp), hareke yerleşimi (mark/mkmk/curs). Amiri'nin bağlamsal
        # alternatifleri çok olduğu için dosyanın büyüklüğünü asıl bunlar belirler: "*" ile 27,8 KB,
        # bu dar listeyle 27,6 KB — yani kazanç gliflerden değil, karakter sayısını daraltmaktan gelir
        # (106 KB → 27,6 KB). Listeyi daha da kısmak şekillenmeyi bozar, denenip vazgeçildi.
        "--layout-features=ccmp,init,medi,fina,isol,rlig,liga,calt,mark,mkmk,curs,locl",
        "--flavor=woff2",
        "--no-hinting",
        "--desubroutinize",
        f"--output-file={HEDEF}",
    ]
    sonuc = subprocess.run(komut, capture_output=True, text=True)
    if sonuc.returncode != 0:
        print(sonuc.stdout, sonuc.stderr, file=sys.stderr)
        return sonuc.returncode
    print(f"{HEDEF.relative_to(KOK)}  {KAYNAK.stat().st_size / 1024:.0f} KB → {HEDEF.stat().st_size / 1024:.1f} KB")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
