#!/usr/bin/env python3
"""Seviye testi — soruların sesli okuma kliplerini Gemini TTS ile üretir (sürdürülebilir, yeniden başlatılabilir).

    node scripts/seviye-ses-metin.mjs --is-listesi D:/sesli-anlatim/seviye-testi/is-listesi.json
    py -3.14 scripts/seviye-ses-uret.py D:/sesli-anlatim/seviye-testi/is-listesi.json [--azami 50] [--is 3]
    node scripts/seviye-ses-metin.mjs --manifest

Kurallar (bkz. ~/.claude/CLAUDE.md, beceri `sesli-anlatim`):
  * Anahtarlar YALNIZ ortak havuzdan okunur (C:/Users/<kullanıcı>/.gemini-tts, keypool.load_keys: ölü ve
    ücretli anahtarlar elenir). Bu depoya, günlüğe ya da çıktıya anahtar YAZILMAZ; havuz durumuna dokunulmaz.
  * Metin ve ses arşivi D:/sesli-anlatim/seviye-testi altındadır; siteye giden kopya public/media/ses/seviye.
  * `--vertex`: ücretsiz havuzun günlük kotası dolduğunda kalan klipler Vertex AI üzerinden (GCP projesi `tedris-pro`, kotasız; kullanıcının
    7 Eyl 2026 izni) AYNI model ve AYNI sesle üretilir. Kimlik: gcloud ADC — belirteç yalnız bellekte tutulur, hiçbir yere yazılmaz.
  * Üretilmiş ses Arapça okumaz — metni kuran `src/lib/seviye-testi/sesli-okuma.ts` Arap harfli metni eler.
"""
import argparse, base64, importlib.util, json, os, shutil, subprocess, sys, threading, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

MODELLER = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]
# Üslup talimatı ile okunacak metin AÇIKÇA ayrılır: düz «…oku: <metin>» kalıbında model kısa metinlerde
# talimatı da seslendiriyordu (20 karakterlik soru 14–24 sn çıkıyordu — 21 Eyl 2026). Başlıklı kalıpta
# yalnız TRANSCRIPT bölümü okunur.
USLUP = {
    "tr": "Dil: Türkçe. Sakin, sıcak ve net bir ses; tane tane, orta tempo; sınav sorusunu okuyan bir öğretmen gibi. Şıklar arasında kısa duraklama.",
    "fr": "Langue : français. Voix calme, chaleureuse et claire ; rythme posé ; comme un enseignant qui lit une question d'examen. Courte pause entre les réponses.",
    "en": "Language: English. Calm, warm and clear voice; measured pace; like a teacher reading out a test question. Short pause between the options.",
    "nl": "Taal: Nederlands (Belgisch-Nederlandse uitspraak). Rustige, warme en duidelijke stem; bedaard tempo; zoals een leerkracht die een toetsvraag voorleest. Korte pauze tussen de antwoorden.",
    "de": "Sprache: Deutsch. Ruhige, warme und klare Stimme; gemessenes Tempo; wie eine Lehrkraft, die eine Prüfungsfrage vorliest. Kurze Pause zwischen den Antworten.",
}


def istem(dil, metin):
    # Kısa metinde model notları da okuyabiliyor (denemelerin ~üçte biri); 3 saniyelik klipte üslup notuna
    # gerek yok — yalnız metin gönderilir.
    if len(metin) < 90:
        return metin
    satirlar =["### DIRECTOR'S NOTES", USLUP[dil],
                "Read ONLY the transcript below, exactly as written. Do not read these notes aloud.",
                "", "### TRANSCRIPT", metin]
    return chr(10).join(satirlar)


ARSIV = Path(os.environ.get("SEVIYE_SES_ARSIV", "D:/sesli-anlatim/seviye-testi"))


def havuz_anahtarlari():
    yol = Path(os.environ.get("GEMINI_KEYPOOL", Path.home() / ".claude/skills/ocr-pdf/keypool.py"))
    spec = importlib.util.spec_from_file_location("keypool", yol)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.load_keys()


class Donusum:
    """Anahtar sırası. İki ayrı durum tutulur (21 Eyl 2026 dersi: her 429'u «bitti» saymak havuzu dakikalar
    içinde tüketip işi kilitliyordu):
      * dakikalık sınır (429 «per minute») → anahtar o modelde 65 sn dinlenir, sonra yeniden kullanılır;
      * günlük sınır / yetki yok / boş yanıt → anahtar bu koşuda o modelde bir daha denenmez."""

    def __init__(self, anahtarlar):
        self.anahtarlar = anahtarlar
        self.bitti = {m: set() for m in MODELLER}
        self.dinlen = {m: {} for m in MODELLER}
        self.i = 0
        self.kilit = threading.Lock()
        self.hiz_kilidi = threading.Lock()
        self.sonraki = 0.0

    def sira_bekle(self, aralik=3.5):
        """Genel hız sınırı: anahtarlar aynı projeleri paylaşır, dakikalık kota ORTAKTIR. Bütün işçiler toplamda
        `aralik` saniyede bir istek atar (429 yanıtları da kotadan yer — işçiler anahtarları hızla dolaşınca
        sınırı kendileri tüketiyordu)."""
        with self.hiz_kilidi:
            simdi = time.time()
            bekle = max(0.0, self.sonraki - simdi)
            self.sonraki = max(simdi, self.sonraki) + aralik
        if bekle:
            time.sleep(bekle)

    def fren(self, saniye=25):
        with self.hiz_kilidi:
            self.sonraki = max(self.sonraki, time.time() + saniye)

    def sec(self, model):
        """(anahtar, bekleme) döner: anahtar yoksa en yakın uyanışa kadar beklenecek süre; hepsi bittiyse (None, None)."""
        with self.kilit:
            simdi = time.time()
            for _ in range(len(self.anahtarlar)):
                k = self.anahtarlar[self.i % len(self.anahtarlar)]
                self.i += 1
                if k in self.bitti[model] or self.dinlen[model].get(k, 0) > simdi:
                    continue
                return k, 0
            uyanis = [t for k, t in self.dinlen[model].items() if k not in self.bitti[model]]
            return (None, max(1.0, min(uyanis) - simdi)) if uyanis else (None, None)

    def bitir(self, model, anahtar):
        with self.kilit:
            self.bitti[model].add(anahtar)

    def dinlendir(self, model, anahtar, saniye=65):
        with self.kilit:
            self.dinlen[model][anahtar] = time.time() + saniye

    def ozet(self):
        with self.kilit:
            return " · ".join(f"{m.split('-')[1]}: {len(self.anahtarlar) - len(self.bitti[m])} anahtar açık" for m in MODELLER)


def tts(anahtar, model, ses, metin):
    govde = json.dumps({
        "contents": [{"parts": [{"text": metin}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
                             "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": ses}}}},
    }).encode("utf-8")
    istek = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=govde, headers={"Content-Type": "application/json", "x-goog-api-key": anahtar})
    with urllib.request.urlopen(istek, timeout=90) as y:
        veri = json.load(y)
    for aday in veri.get("candidates", []):
        for parca in aday.get("content", {}).get("parts", []):
            ham = parca.get("inlineData", {}).get("data")
            if ham:
                return base64.b64decode(ham)
    return b""


VERTEX_PROJE = os.environ.get("SES_VERTEX_PROJE", "tedris-pro")
VERTEX_BOLGELER = ["global", "us-central1"]          # iki bölge dönüşümlü: dakikalık kota ikiye katlanır
_vertex = {"belirtec": "", "an": 0.0, "sira": 0}
_vertex_kilit = threading.Lock()


def vertex_belirtec():
    with _vertex_kilit:
        if time.time() - _vertex["an"] > 1800:      # ADC belirteci 1 saat geçerli; yarım saatte bir tazelenir
            gcloud = shutil.which("gcloud") or shutil.which("gcloud.cmd")
            if not gcloud:
                sys.exit("gcloud bulunamadı (Vertex yolu için gerekli)")
            r = subprocess.run([gcloud, "auth", "application-default", "print-access-token"], capture_output=True, text=True)
            if r.returncode != 0 or not r.stdout.strip():
                sys.exit("ADC belirteci alınamadı: gcloud auth application-default login")
            _vertex["belirtec"], _vertex["an"] = r.stdout.strip(), time.time()
        _vertex["sira"] += 1
        return _vertex["belirtec"], VERTEX_BOLGELER[_vertex["sira"] % len(VERTEX_BOLGELER)]


def tts_vertex(model, ses, metin):
    belirtec, bolge = vertex_belirtec()
    koken = "aiplatform.googleapis.com" if bolge == "global" else f"{bolge}-aiplatform.googleapis.com"
    govde = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": metin}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
                             "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": ses}}}},
    }).encode("utf-8")
    istek = urllib.request.Request(
        f"https://{koken}/v1/projects/{VERTEX_PROJE}/locations/{bolge}/publishers/google/models/{model}:generateContent",
        data=govde, headers={"Content-Type": "application/json", "Authorization": f"Bearer {belirtec}"})
    with urllib.request.urlopen(istek, timeout=120) as y:
        veri = json.load(y)
    for aday in veri.get("candidates", []):
        for parca in aday.get("content", {}).get("parts", []):
            ham = parca.get("inlineData", {}).get("data")
            if ham:
                return base64.b64decode(ham)
    return b""


def uret_vertex(klip, ses, gunluk):
    """Vertex yolu: anahtar dönüşümü yok; 429/5xx'te kısa bekleyip öteki bölgeyle yeniden dener. Süre denetimi aynıdır."""
    hedef = Path(klip["hedef"])
    arsiv = ARSIV / klip["dil"] / f"{klip['kimlik']}.mp3"
    karakter = len(klip["metin"])
    for model in MODELLER[:1] + ["gemini-2.5-flash-tts"]:
        for deneme in range(8):
            try:
                pcm = tts_vertex(model, ses, istem(klip["dil"], klip["metin"]))
            except urllib.error.HTTPError as h:
                if h.code in (400, 403, 404):
                    break
                time.sleep(4 + 3 * deneme)
                continue
            except Exception:
                time.sleep(3)
                continue
            saniye = len(pcm) / 48000
            if not pcm or saniye < max(1.0, karakter / 28) or saniye > karakter / 6 + 4:
                gunluk(f"  ! {klip['dil']}/{klip['kimlik']} süre tutarsız ({saniye:.1f} sn, {karakter} karakter) — yeniden")
                continue
            mp3_yaz(pcm, arsiv)
            hedef.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(arsiv, hedef)
            return f"vertex {model.split('-')[1]} · {saniye:.1f} sn"
    return None


def mp3_yaz(pcm, hedef):
    hedef.parent.mkdir(parents=True, exist_ok=True)
    gecici = hedef.with_suffix(".tmp.mp3")
    # Baştaki/sondaki boşluk kırpılır, ses düzeyi klipler arasında eşitlenir; konuşma için 40 kb/sn mono yeter.
    suzgec = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,"
              "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25,areverse,"
              "loudnorm=I=-18:TP=-2:LRA=11")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "pipe:0",
                    "-af", suzgec, "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "40k",
                    "-map_metadata", "-1", str(gecici)], input=pcm, check=True)
    os.replace(gecici, hedef)


def uret(klip, ses, donusum, gunluk):
    hedef = Path(klip["hedef"])
    arsiv = ARSIV / klip["dil"] / f"{klip['kimlik']}.mp3"
    (ARSIV / klip["dil"]).mkdir(parents=True, exist_ok=True)
    (ARSIV / klip["dil"] / f"{klip['kimlik']}.txt").write_text(klip["metin"], encoding="utf-8")
    if arsiv.exists() and arsiv.stat().st_size > 2000:      # önceki koşudan kalmış: yalnız kopyala
        hedef.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(arsiv, hedef)
        return "arşivden"
    karakter = len(klip["metin"])
    if donusum is None:
        return uret_vertex(klip, ses, gunluk)
    for model in MODELLER:
        deneme = 0
        while deneme < 60:
            anahtar, bekle = donusum.sec(model)
            if anahtar is None:
                if bekle is None:
                    break                                   # bu modelde açık anahtar kalmadı → sıradaki model
                time.sleep(min(bekle, 30))
                continue
            deneme += 1
            donusum.sira_bekle()
            try:
                pcm = tts(anahtar, model, ses, istem(klip["dil"], klip["metin"]))
            except urllib.error.HTTPError as h:
                try:
                    ileti = json.load(h).get("error", {}).get("message", "")
                except Exception:
                    ileti = ""
                if h.code == 429 and "per min" in ileti.lower():
                    donusum.dinlendir(model, anahtar)       # dakikalık sınır: 65 sn sonra yeniden
                    donusum.fren()                          # kota ortak: herkes 25 sn dursun
                elif h.code in (429, 403, 400, 404):
                    donusum.bitir(model, anahtar)           # günlük sınır / yetki yok: bu koşuda bu modelde denenmez
                else:
                    time.sleep(2)
                continue
            except Exception:
                time.sleep(2)
                continue
            if not pcm:
                donusum.bitir(model, anahtar)               # boş yanıt: bu anahtarın projesi bu modeli vermiyor
                continue
            saniye = len(pcm) / 48000
            # Boş ya da akla yatmayan süre (yarıda kesilmiş / talimatı da okumuş) → başka anahtarla yeniden.
            if saniye < max(1.0, karakter / 28) or saniye > karakter / 6 + 4:
                gunluk(f"  ! {klip['dil']}/{klip['kimlik']} süre tutarsız ({saniye:.1f} sn, {karakter} karakter) — yeniden")
                continue
            donusum.dinlendir(model, anahtar, 21)           # anahtar başına dakikada en çok ~3 istek
            mp3_yaz(pcm, arsiv)
            hedef.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(arsiv, hedef)
            return f"{model.split('-')[1]} · {saniye:.1f} sn"
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("is_listesi")
    p.add_argument("--azami", type=int, default=0, help="en çok bu kadar klip (0 = hepsi)")
    p.add_argument("--is", dest="isci", type=int, default=3, help="eşzamanlı istek")
    p.add_argument("--vertex", action="store_true", help="ücretsiz havuz yerine Vertex AI (tedris-pro, ADC) — kota dolduğunda kalanlar için")
    a = p.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg bulunamadı")
    veri = json.loads(Path(a.is_listesi).read_text(encoding="utf-8"))
    klipler = veri["klipler"][: a.azami or None]
    donusum = None if a.vertex else Donusum(havuz_anahtarlari())
    kilit = threading.Lock()
    sayac = {"tamam": 0, "kaldi": 0}

    def gunluk(s):
        with kilit:
            print(s, flush=True)

    def isle(k):
        sonuc = uret(k, veri["ses"], donusum, gunluk)
        with kilit:
            sayac["tamam" if sonuc else "kaldi"] += 1
            n = sayac["tamam"] + sayac["kaldi"]
        gunluk(f"[{n}/{len(klipler)}] {k['dil']}/{k['kimlik']} → {sonuc or 'ÜRETİLEMEDİ (kota?)'}")
        if n % 20 == 0 and donusum is not None:
            gunluk('    ' + donusum.ozet())

    gunluk(f"{len(klipler)} klip üretilecek · ses {veri['ses']} · {a.isci} eşzamanlı istek")
    with ThreadPoolExecutor(max_workers=a.isci) as hav:
        list(hav.map(isle, klipler))
    gunluk(f"BİTTİ: {sayac['tamam']} üretildi, {sayac['kaldi']} kaldı. Ardından: node scripts/seviye-ses-metin.mjs --manifest")
    sys.exit(0 if sayac["kaldi"] == 0 else 3)


if __name__ == "__main__":
    main()
