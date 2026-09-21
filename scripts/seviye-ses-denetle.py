#!/usr/bin/env python3
"""Seviye testi — sesli okuma kliplerinin İÇERİK denetimi: her klip yazıya dökülür, okunması gereken metinle
karşılaştırılır. Talimatı da okuyan, yarıda kesilen ya da başka şey söyleyen klip bulunur.

    py -3.14 scripts/seviye-ses-denetle.py [--sil] [--is 4] [--yalniz tr]

`--sil`: bozuk klibi hem siteden hem arşivden siler (ardından seviye-ses-uret.py yeniden üretir).
Anahtarlar yalnız ortak havuzdan okunur; hiçbir yere yazılmaz. Sonuçlar arşivde `denetim.json`da tutulur:
aynı klip ikinci kez sorulmaz.
"""
import argparse, base64, difflib, importlib.util, json, os, re, shutil, subprocess, sys, threading, time, unicodedata, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
SITE = KOK / "public" / "media" / "ses" / "seviye"
ARSIV = Path(os.environ.get("SEVIYE_SES_ARSIV", "D:/sesli-anlatim/seviye-testi"))
KAYIT = ARSIV / "denetim.json"
MODEL = "gemini-2.5-flash"
SIZINTI = re.compile(r"director|transcript|notes|talimat|ogretmen gibi|enseignant qui lit|teacher reading|sakin sicak|voix calme|calm warm", re.I)


def anahtarlar():
    yol = Path(os.environ.get("GEMINI_KEYPOOL", Path.home() / ".claude/skills/ocr-pdf/keypool.py"))
    spec = importlib.util.spec_from_file_location("keypool", yol)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.load_keys()


def sade(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("ı", "i")
    return re.sub(r"[^a-z0-9\s]", " ", s).split()


SAYI = {"1": ["bir", "un", "one"], "2": ["iki", "deux", "two"], "3": ["uc", "trois", "three"],
        "4": ["dort", "quatre", "four"], "5": ["bes", "cinq", "five"], "6": ["alti", "six", "six"]}


_vertex = {"belirtec": "", "an": 0.0, "kilit": threading.Lock()}


def vertex_belirtec():
    """`--vertex`: ücretsiz havuzun günlük kotası dolduğunda döküm Vertex AI (GCP `tedris-pro`, gcloud ADC) üzerinden yapılır; belirteç yalnız bellekte."""
    with _vertex["kilit"]:
        if time.time() - _vertex["an"] > 1800:
            gcloud = shutil.which("gcloud") or shutil.which("gcloud.cmd")
            r = subprocess.run([gcloud, "auth", "application-default", "print-access-token"], capture_output=True, text=True) if gcloud else None
            if not r or r.returncode != 0 or not r.stdout.strip():
                sys.exit("ADC belirteci alınamadı (gcloud auth application-default login)")
            _vertex["belirtec"], _vertex["an"] = r.stdout.strip(), time.time()
        return _vertex["belirtec"]


def yaziya_dok(mp3, liste, sira):
    if liste is None:                                   # Vertex yolu
        govde = json.dumps({"contents": [{"role": "user", "parts": [
            {"text": "Transcribe this audio verbatim in its original language. Output only the transcript, nothing else."},
            {"inlineData": {"mimeType": "audio/mp3", "data": base64.b64encode(mp3).decode()}}]}],
            "generationConfig": {"temperature": 0}}).encode()
        for deneme in range(6):
            try:
                r = urllib.request.Request(
                    f"https://aiplatform.googleapis.com/v1/projects/{os.environ.get('SES_VERTEX_PROJE', 'tedris-pro')}/locations/global/publishers/google/models/{MODEL}:generateContent",
                    data=govde, headers={"Content-Type": "application/json", "Authorization": f"Bearer {vertex_belirtec()}"})
                with urllib.request.urlopen(r, timeout=120) as y:
                    v = json.load(y)
                return "".join(p.get("text", "") for p in v["candidates"][0]["content"]["parts"])
            except (urllib.error.HTTPError, urllib.error.URLError, KeyError, IndexError, TimeoutError):
                time.sleep(3 + 2 * deneme)
        return None
    govde = json.dumps({"contents": [{"parts": [
        {"text": "Transcribe this audio verbatim in its original language. Output only the transcript, nothing else."},
        {"inlineData": {"mimeType": "audio/mp3", "data": base64.b64encode(mp3).decode()}}]}],
        "generationConfig": {"temperature": 0}}).encode()
    for _ in range(len(liste)):
        with sira["kilit"]:
            k = liste[sira["i"] % len(liste)]
            sira["i"] += 1
        try:
            r = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                       data=govde, headers={"Content-Type": "application/json", "x-goog-api-key": k})
            with urllib.request.urlopen(r, timeout=120) as y:
                v = json.load(y)
            return "".join(p.get("text", "") for p in v["candidates"][0]["content"]["parts"])
        except (urllib.error.HTTPError, urllib.error.URLError, KeyError, IndexError, TimeoutError):
            continue
    return None


def degerlendir(metin, dokum):
    # Sayılar İKİ TARAFTA da rakama indirilir: döküm «1, 2» yazar, metin «Un : … Fajr 2» der. Yalnız dökümü çevirmek, rakam dolu sorularda
    # (rekât sayıları) doğru klibi «bozuk» gösteriyordu (21 Eyl 2026 yanlış alarmı).
    rakam = {s: r for r, sozler in SAYI.items() for s in sozler}
    a, b = [rakam.get(w, w) for w in sade(metin)], [rakam.get(w, w) for w in sade(dokum)]
    oran = difflib.SequenceMatcher(None, a, b).ratio()
    fazla = len(b) - len(a)
    sizinti = bool(SIZINTI.search(" ".join(sade(dokum)))) and not SIZINTI.search(" ".join(a))
    bozuk = sizinti or fazla > max(4, len(a) * 0.15) or fazla < -max(3, len(a) * 0.15) or oran < 0.6
    return {"oran": round(oran, 2), "fazla": fazla, "sizinti": sizinti, "bozuk": bozuk}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sil", action="store_true")
    p.add_argument("--is", dest="isci", type=int, default=4)
    p.add_argument("--yalniz", default="")
    p.add_argument("--vertex", action="store_true", help="dökümü Vertex AI üzerinden yap (ücretsiz havuz tükendiğinde)")
    a = p.parse_args()
    kayit = json.loads(KAYIT.read_text(encoding="utf-8")) if KAYIT.exists() else {}
    liste = None if a.vertex else anahtarlar()
    sira = {"i": 0, "kilit": threading.Lock()}
    kilit = threading.Lock()
    dosyalar = sorted(f for f in SITE.glob("*/*.mp3") if not a.yalniz or f.parent.name == a.yalniz)

    def isle(f):
        ad = f"{f.parent.name}/{f.stem}"
        imza = f"{ad}:{f.stat().st_size}"
        if kayit.get(ad, {}).get("imza") == imza:
            return
        metin_yolu = ARSIV / f.parent.name / f"{f.stem}.txt"
        if not metin_yolu.exists():
            return
        dokum = yaziya_dok(f.read_bytes(), liste, sira)
        if dokum is None:
            with kilit:
                print(f"? {ad}: yazıya dökülemedi (kota?) — sonra yeniden denenir", flush=True)
            return
        s = degerlendir(metin_yolu.read_text(encoding="utf-8"), dokum)
        s["imza"] = imza
        if s["bozuk"]:
            s["dokum"] = dokum[:300]
        with kilit:
            kayit[ad] = s
            KAYIT.write_text(json.dumps(kayit, ensure_ascii=False, indent=1), encoding="utf-8")
            if s["bozuk"]:
                print(f"✗ {ad}: benzerlik {s['oran']} · kelime farkı {s['fazla']:+d}{' · TALİMAT SIZMIŞ' if s['sizinti'] else ''}", flush=True)

    with ThreadPoolExecutor(max_workers=a.isci) as hav:
        list(hav.map(isle, dosyalar))

    mevcut = {f"{f.parent.name}/{f.stem}" for f in dosyalar}
    bozuk = sorted(ad for ad, s in kayit.items() if s.get("bozuk") and ad in mevcut)
    denetlenen = sum(1 for ad in mevcut if ad in kayit)
    print(f"Denetlenen: {denetlenen} / {len(dosyalar)} · bozuk: {len(bozuk)}")
    if a.sil:
        for ad in bozuk:
            dil, kimlik = ad.split("/")
            for yol in (SITE / dil / f"{kimlik}.mp3", ARSIV / dil / f"{kimlik}.mp3"):
                yol.unlink(missing_ok=True)
            kayit.pop(ad, None)
        KAYIT.write_text(json.dumps(kayit, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"Silindi: {len(bozuk)} klip (yeniden üretilecek).")
    sys.exit(1 if bozuk and not a.sil else 0)


if __name__ == "__main__":
    main()
