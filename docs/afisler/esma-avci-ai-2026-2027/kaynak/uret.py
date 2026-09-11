import html
import os
import subprocess
import sys
from pathlib import Path

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
OUT = ROOT
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
if not CHROME.exists():
    CHROME = Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe")

POSTERS = [
    {
        "slug": "00-ai-genel-tanitim",
        "bg": "assets/hires/bg-00-genel.jpg",
        "eyebrow": "NAMUR & MARCHE BÖLGESİ · 2026–2027",
        "tagline": "BÖLGESEL EĞİTİM & MANEVİ REHBERLİK",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Haftalık Çalışma Programı",
        "subtitle": "Hanımlar, genç kızlar ve kız çocukları için iki merkezde düzenlenen düzenli ders, sohbet ve manevi rehberlik buluşmaları.",
        "kind": "cover",
        "footer_venue": "Görev Yerleri: Namur Camii · Marche-en-Famenne Ulu Camii",
        "footer_note": "NAMUR & MARCHE BÖLGESİ · 2026–2027",
    },
    {
        "slug": "01-ai-hanimlar-pazartesi",
        "bg": "assets/hires/bg-01-pazartesi.jpg",
        "eyebrow": "HANIMLAR BULUŞMASI · NAMUR",
        "tagline": "PAZARTESİ DÜZENLİ DERSLERİ",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Kur’an, İlmihal ve Sohbet",
        "subtitle": "Haftanın ilk gününde Kur’an tilaveti, tecvit ve temel dinî bilgiler eşliğinde gönülden bir hasbihal ortamı.",
        "kind": "schedule",
        "day": "PAZARTESİ",
        "time": "10.30 – 16.00",
        "venue": "Namur Camii",
        "audience": "Hanımlar",
        "items": [
            "Kur’an-ı Kerim Okuma & Tilavet",
            "Ezber ve Tecvit Çalışmaları",
            "İlmihal ve Siyer Dersleri",
            "Gönülden Sohbet & Hasbihal",
            "Birebir Manevi Görüşme (MDR)",
        ],
        "footer_venue": "Görev Yeri: Namur Camii",
        "footer_note": "NAMUR BÖLGESİ · 2026–2027",
    },
    {
        "slug": "02-ai-hanimlar-persembe",
        "bg": "assets/hires/bg-02-persembe.jpg",
        "eyebrow": "HANIMLAR BULUŞMASI · NAMUR",
        "tagline": "PERŞEMBE İLİM & VAAZ",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Tefsir, Hadis ve Vaaz",
        "subtitle": "Âyetlerin mesajını ve Peygamberimizin sünnetini hayatımıza taşıyan derinlikli ilim ve dua dersleri.",
        "kind": "schedule",
        "day": "PERŞEMBE",
        "time": "10.30 – 16.00",
        "venue": "Namur Camii",
        "audience": "Hanımlar",
        "items": [
            "Kur’an-ı Kerim ve Tefsir Dersi",
            "Hadis-i Şerif Okumaları",
            "Dua ve Zikir Vakti",
            "Haftalık Vaaz ve İrşat",
            "Birebir Manevi Görüşme (MDR)",
        ],
        "footer_venue": "Görev Yeri: Namur Camii",
        "footer_note": "NAMUR BÖLGESİ · 2026–2027",
    },
    {
        "slug": "03-ai-marche-carsamba",
        "bg": "assets/hires/bg-03-marche.jpg",
        "eyebrow": "MARCHE-EN-FAMENNE · ULU CAMİİ",
        "tagline": "ÇARŞAMBA DERS & BULUŞMA",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Kur’an, Dua ve Soru-Cevap",
        "subtitle": "Marche-en-Famenne’de hanımlar ve genç kızlarımızla Kur’an rehberliğinde samimi bir ilim ve sohbet halkası.",
        "kind": "schedule",
        "day": "ÇARŞAMBA",
        "time": "10.30 – 16.00",
        "venue": "Marche-en-Famenne Ulu Camii",
        "audience": "Hanımlar & Genç Kızlar",
        "items": [
            "Kur’an-ı Kerim ve Tilavet",
            "Ezber ve Tecvit Eğitimi",
            "İlmihal ve Peygamberimizin Hayatı",
            "Dua ve Tefekkür Vakti",
            "Merak Edilen Sorular & Cevaplar",
        ],
        "footer_venue": "Görev Yeri: Marche-en-Famenne Ulu Camii",
        "footer_note": "MARCHE-EN-FAMENNE · 2026–2027",
    },
    {
        "slug": "04-ai-genc-kizlar-cuma",
        "bg": "assets/hires/bg-04-cuma.jpg",
        "eyebrow": "GENÇ KIZLAR · NAMUR CAMİİ",
        "tagline": "CUMA AKŞAMI BULUŞMALARI",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Kur’an ve Gençlerle Hasbihal",
        "subtitle": "Genç kızlarımızın merak ettiği dinî konuları, hayatı ve değerlerimizi konuştuğumuz sıcak ve canlı bir akşam.",
        "kind": "schedule",
        "day": "CUMA",
        "time": "18.30 – 20.30",
        "venue": "Namur Camii",
        "audience": "Genç Kızlar",
        "items": [
            "Kur’an-ı Kerim Okuma & Ezber",
            "Anlam ve Hayat Rehberliği",
            "Dua ve Manevi Huzur",
            "Gençlerle Samimi Hasbihal",
            "İnanç ve Ahlak Sohbetleri",
        ],
        "footer_venue": "Görev Yeri: Namur Camii",
        "footer_note": "GENÇLİK PROGRAMI · 2026–2027",
    },
    {
        "slug": "05-ai-kiz-cocuklari-hafta-sonu",
        "bg": "assets/hires/bg-05-haftasonu.jpg",
        "eyebrow": "HAFTA SONU KUR’AN KURSU · NAMUR",
        "tagline": "7 YAŞ VE ÜZERİ KIZ ÖĞRENCİLER",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Kız Çocukları İçin Temel Eğitim",
        "subtitle": "Sevgi dolu bir cami ikliminde Kur’an sevgisi, güzel ahlak ve temel dinî bilgilerin yaşa uygun öğretimi.",
        "kind": "schedule",
        "day": "CUMARTESİ & PAZAR",
        "time": "10.00 – 13.00",
        "venue": "Namur Camii",
        "audience": "7 Yaş ve Üzeri Kız Öğrenciler",
        "items": [
            "Kur’an-ı Kerim ve Elifbâ Eğitimi",
            "İtikat (İman Esasları)",
            "İbadet Bilgisi ve Uygulama",
            "Siyer-i Nebî (Peygamberimizin Hayatı)",
            "Güzel Ahlak ve Cami Nezaketi",
        ],
        "footer_venue": "Görev Yeri: Namur Camii (Hafta Sonu Kursu)",
        "footer_note": "ÇOCUK VE GENÇLİK EĞİTİMİ · 2026–2027",
    },
    {
        "slug": "06-ai-birebir-gorusme",
        "bg": "assets/hires/bg-06-birebir.jpg",
        "eyebrow": "MANEVİ DANIŞMANLIK VE REHBERLİK",
        "tagline": "ÖZEL & GÜVENLİ GÖRÜŞME İMKÂNI",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Manevi Danışmanlık ve Birebir Görüşme",
        "subtitle": "Dinî sorularınızı sormak, ailevi ve manevi konularda dertleşmek ve birebir rehberlik almak için özel vakit.",
        "kind": "mdr",
        "day": "PAZARTESİ & PERŞEMBE",
        "time": "10.30 – 16.00",
        "venue": "Namur Camii (Hanımlar Programı İçi)",
        "audience": "Hanımlar",
        "items": [
            "Birebir Özel ve Mahrem Görüşme",
            "Dinî Hükümler ve Sorulara Cevaplar",
            "Manevi Destek ve Manevi Rehberlik",
            "Aile, Evlilik ve Hayat Değerleri",
            "Gönül Dünyamıza Dair Hasbihal",
        ],
        "footer_venue": "Görev Yeri: Namur Camii",
        "footer_note": "MANEVİ REHBERLİK (MDR) · 2026–2027",
    },
    {
        "slug": "07-ai-haftalik-program-ozeti",
        "bg": "assets/hires/bg-07-ozet.jpg",
        "eyebrow": "HAFTALIK ÇALIŞMA PLANI · 2026–2027",
        "tagline": "NAMUR VE MARCHE BÖLGESİ",
        "kicker": "ESMA AVCI HOCA HANIM",
        "title": "Haftalık Program Özeti",
        "subtitle": "Namur Camii ve Marche-en-Famenne Ulu Camii'nde hanımlar, gençler ve çocuklar için haftanın tüm akışı.",
        "kind": "overview",
        "footer_venue": "Görev Yerleri: Namur Camii ve Marche-en-Famenne Ulu Camii",
        "footer_note": "BİLGİ VE KATILIM İÇİN CAMİ YÖNETİMLERİNİ TAKİP EDİNİZ",
    },
]


def esc(value):
    return html.escape(str(value), quote=True)


def monogram_svg():
    return """<div class="emblem">
        <svg viewBox="0 0 100 100" class="emblem-svg" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#f6c58f" stroke-width="1.8" opacity="0.85"/>
            <circle cx="50" cy="50" r="37" fill="rgba(246,197,143,0.06)" stroke="#72d1c0" stroke-width="1" stroke-dasharray="3,3" opacity="0.7"/>
            <path d="M50 12 L53 25 L66 28 L53 31 L50 44 L47 31 L34 28 L47 25 Z" fill="#f6c58f" opacity="0.75"/>
            <text x="50" y="64" text-anchor="middle" fill="#fffaf4" font-family="Work, Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="2.5">EA</text>
        </svg>
        <div class="emblem-text">
            <span class="emblem-name">ESMA AVCI</span>
            <span class="emblem-role">HOCA HANIM</span>
        </div>
    </div>"""


def render_items(items):
    out = []
    for i, item in enumerate(items, 1):
        out.append(f"""<li class="item-row">
            <span class="item-num">{i:02d}</span>
            <span class="item-text">{esc(item)}</span>
        </li>""")
    return "".join(out)


def render_body(p):
    if p["kind"] == "cover":
        return """<div class="cover-stage">
            <div class="venue-split-card">
                <div class="split-col">
                    <div class="split-badge gold">MERKEZ 1</div>
                    <div class="split-title">Namur Camii</div>
                    <div class="split-desc">Pazartesi · Perşembe · Cuma · Hafta Sonu<br>Hanımlar, Genç Kızlar, Kız Çocukları</div>
                </div>
                <div class="split-divider"></div>
                <div class="split-col">
                    <div class="split-badge mint">MERKEZ 2</div>
                    <div class="split-title">Marche Ulu Camii</div>
                    <div class="split-desc">Çarşamba Günleri (10.30–16.00)<br>Hanımlar ve Genç Kızlar</div>
                </div>
            </div>

            <div class="audience-tags">
                <span class="tag tag-coral">HANIMLAR</span>
                <span class="tag tag-mint">GENÇ KIZLAR</span>
                <span class="tag tag-gold">KIZ ÇOCUKLARI (7+)</span>
                <span class="tag tag-glass">BİREBİR GÖRÜŞME (MDR)</span>
            </div>

            <div class="motto-box">
                <div class="motto-quote">“İlim, güzel ahlâk ve manevi rehberlikle, Kur’an-ı Kerim’in aydınlığında buluşuyoruz.”</div>
                <div class="motto-author">2026–2027 Haftalık Çalışma ve Eğitim Dönemi</div>
            </div>
        </div>"""

    if p["kind"] in ("schedule", "mdr"):
        return f"""<div class="event-stage">
            <div class="event-meta-banner">
                <div class="meta-left">
                    <div class="day-chip">{esc(p['day'])}</div>
                    <div class="venue-chip">{esc(p['venue'])}</div>
                    <div class="audience-chip">{esc(p['audience'])}</div>
                </div>
                <div class="time-block">
                    <span class="time-label">DERS SAATİ</span>
                    <span class="time-val">{esc(p['time'])}</span>
                </div>
            </div>

            <div class="program-card">
                <div class="card-header">
                    <span class="card-kicker">PROGRAM İÇERİĞİ VE DERS BAŞLIKLARI</span>
                    <span class="card-badge">NAMUR BÖLGESİ</span>
                </div>
                <ul class="items-list">
                    {render_items(p['items'])}
                </ul>
            </div>
        </div>"""

    # kind == "overview"
    return """<div class="overview-stage">
        <div class="timetable-grid">
            <div class="time-slot gold-slot">
                <div class="slot-head">
                    <span class="slot-day">PAZARTESİ</span>
                    <span class="slot-time">10.30 – 16.00</span>
                </div>
                <div class="slot-venue">Namur Camii · Hanımlar</div>
                <div class="slot-body">Kur’an-ı Kerim, ezber, tecvit, ilmihal, siyer, sohbet, birebir görüşme.</div>
            </div>

            <div class="time-slot off-slot">
                <div class="slot-head">
                    <span class="slot-day">SALI</span>
                    <span class="slot-time">HAFTALIK İZİN</span>
                </div>
                <div class="slot-venue">Resmî İzin Günü</div>
                <div class="slot-body">Program dışında dinlenme ve ders hazırlığı günü.</div>
            </div>

            <div class="time-slot mint-slot">
                <div class="slot-head">
                    <span class="slot-day">ÇARŞAMBA</span>
                    <span class="slot-time">10.30 – 16.00</span>
                </div>
                <div class="slot-venue">Marche-en-Famenne Ulu Camii</div>
                <div class="slot-body">Hanımlar & genç kızlar: Kur’an, ezber, tecvit, ilmihal, siyer, dua, soru-cevap.</div>
            </div>

            <div class="time-slot gold-slot">
                <div class="slot-head">
                    <span class="slot-day">PERŞEMBE</span>
                    <span class="slot-time">10.30 – 16.00</span>
                </div>
                <div class="slot-venue">Namur Camii · Hanımlar</div>
                <div class="slot-body">Kur’an-ı Kerim, tefsir, hadis, dua, vaaz, birebir görüşme.</div>
            </div>

            <div class="time-slot coral-slot">
                <div class="slot-head">
                    <span class="slot-day">CUMA</span>
                    <span class="slot-time">18.30 – 20.30</span>
                </div>
                <div class="slot-venue">Namur Camii · Genç Kızlar</div>
                <div class="slot-body">Kur’an-ı Kerim, ezber, dua, sohbet, gençlerle hasbihal.</div>
            </div>

            <div class="time-slot mint-slot">
                <div class="slot-head">
                    <span class="slot-day">CUMARTESİ & PAZAR</span>
                    <span class="slot-time">10.00 – 13.00</span>
                </div>
                <div class="slot-venue">Namur Camii · 7+ Kız Öğrenciler</div>
                <div class="slot-body">Hafta sonu Kur’an kursu: Kur’an, itikat, ibadet, siyer, ahlak.</div>
            </div>
        </div>
    </div>"""


def render_doc(p):
    return f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>{esc(p['title'])} — Esma Avcı</title>
<style>
@font-face {{
    font-family: 'Work';
    src: url('fonts/WorkSans-Regular.ttf') format('truetype');
    font-weight: 400;
}}
@font-face {{
    font-family: 'Work';
    src: url('fonts/WorkSans-Bold.ttf') format('truetype');
    font-weight: 700;
}}
@font-face {{
    font-family: 'Lora';
    src: url('fonts/Lora-Regular.ttf') format('truetype');
    font-weight: 400;
}}
@font-face {{
    font-family: 'Lora';
    src: url('fonts/Lora-Bold.ttf') format('truetype');
    font-weight: 700;
}}

@page {{
    size: 1080px 1350px;
    margin: 0;
}}

* {{
    box-sizing: border-box;
}}

html, body {{
    margin: 0;
    padding: 0;
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    background: #140922;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}}

.poster-canvas {{
    position: relative;
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    font-family: 'Work', Arial, sans-serif;
    color: #fffaf4;
}}

/* AI BACKGROUND */
.bg-layer {{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    transform: scale(1.01);
}}

/* ATMOSPHERIC SCRIM GRADIENT */
.scrim-layer {{
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(
        180deg,
        rgba(15, 7, 26, 0.72) 0%,
        rgba(18, 9, 32, 0.52) 28%,
        rgba(16, 8, 28, 0.68) 55%,
        rgba(12, 5, 20, 0.94) 100%
    );
    pointer-events: none;
}}

/* ARCHITECTURAL INNER FRAMING */
.frame-outer {{
    position: absolute;
    inset: 32px;
    border: 1.5px solid rgba(246, 197, 143, 0.45);
    border-radius: 28px;
    pointer-events: none;
    z-index: 3;
}}

.frame-inner {{
    position: absolute;
    inset: 42px;
    border: 1px solid rgba(114, 209, 192, 0.25);
    border-radius: 20px;
    pointer-events: none;
    z-index: 3;
}}

/* MAIN CONTENT CONTAINER */
.content-wrap {{
    position: relative;
    z-index: 4;
    height: 100%;
    padding: 62px 76px 54px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}}

/* HEADER BAR */
.header-bar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
}}

.emblem {{
    display: flex;
    align-items: center;
    gap: 16px;
}}

.emblem-svg {{
    width: 68px;
    height: 68px;
    filter: drop-shadow(0 4px 14px rgba(0,0,0,0.45));
}}

.emblem-text {{
    display: flex;
    flex-direction: column;
}}

.emblem-name {{
    font-family: 'Lora', Georgia, serif;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: 2px;
    color: #fffaf4;
    line-height: 1.2;
}}

.emblem-role {{
    font-size: 13px;
    letter-spacing: 2.2px;
    font-weight: 700;
    color: #f6c58f;
    margin-top: 3px;
}}

.header-meta {{
    text-align: right;
}}

.meta-eyebrow {{
    font-size: 16px;
    letter-spacing: 2.8px;
    font-weight: 700;
    color: #f6c58f;
    line-height: 1.25;
}}

.meta-tagline {{
    font-size: 13px;
    letter-spacing: 2.2px;
    color: #72d1c0;
    font-weight: 700;
    margin-top: 6px;
}}

.header-rule {{
    height: 1px;
    background: linear-gradient(90deg, rgba(246, 197, 143, 0.8) 0%, rgba(114, 209, 192, 0.4) 50%, rgba(246, 197, 143, 0.05) 100%);
    margin: 24px 0 32px;
}}

/* HERO SECTION */
.hero-block {{
    max-width: 920px;
}}

.hero-kicker {{
    display: inline-block;
    font-size: 15px;
    letter-spacing: 3.5px;
    font-weight: 700;
    color: #f6c58f;
    padding: 6px 14px;
    border-radius: 6px;
    background: rgba(246, 197, 143, 0.12);
    border: 1px solid rgba(246, 197, 143, 0.35);
    margin-bottom: 18px;
}}

h1.hero-title {{
    font-family: 'Lora', Georgia, serif;
    font-weight: 700;
    font-size: 64px;
    line-height: 1.08;
    letter-spacing: -1.2px;
    margin: 0;
    color: #fffaf4;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.55);
}}

p.hero-sub {{
    font-size: 23px;
    line-height: 1.42;
    margin: 18px 0 0;
    color: #f2eee8;
    max-width: 880px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}}

/* COVER STAGE (00) */
.cover-stage {{
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    gap: 26px;
}}

.venue-split-card {{
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
    background: rgba(18, 9, 30, 0.65);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(246, 197, 143, 0.4);
    border-radius: 22px;
    padding: 28px 34px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3);
}}

.split-col {{
    display: flex;
    flex-direction: column;
    gap: 8px;
}}

.split-badge {{
    align-self: flex-start;
    font-size: 13px;
    letter-spacing: 2.2px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 6px;
}}

.split-badge.gold {{
    background: rgba(246, 197, 143, 0.2);
    color: #f6c58f;
    border: 1px solid rgba(246, 197, 143, 0.45);
}}

.split-badge.mint {{
    background: rgba(114, 209, 192, 0.2);
    color: #72d1c0;
    border: 1px solid rgba(114, 209, 192, 0.45);
}}

.split-title {{
    font-family: 'Lora', Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: #fffaf4;
}}

.split-desc {{
    font-size: 16px;
    line-height: 1.4;
    color: #e2e9e4;
}}

.split-divider {{
    width: 1px;
    background: rgba(246, 197, 143, 0.3);
    margin: 0 28px;
}}

.audience-tags {{
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
}}

.tag {{
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1.6px;
    padding: 12px 20px;
    border-radius: 10px;
}}

.tag-coral {{
    background: #f07c67;
    color: #1a0a2a;
}}

.tag-mint {{
    background: #72d1c0;
    color: #14201c;
}}

.tag-gold {{
    background: #f6c58f;
    color: #241441;
}}

.tag-glass {{
    background: rgba(246, 197, 143, 0.12);
    color: #fffaf4;
    border: 1px solid rgba(246, 197, 143, 0.4);
}}

.motto-box {{
    background: rgba(15, 8, 25, 0.58);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-left: 4px solid #f6c58f;
    border-radius: 0 16px 16px 0;
    padding: 22px 28px;
}}

.motto-quote {{
    font-family: 'Lora', Georgia, serif;
    font-size: 24px;
    line-height: 1.38;
    color: #f6c58f;
    font-style: italic;
}}

.motto-author {{
    font-size: 14px;
    letter-spacing: 1.8px;
    color: #72d1c0;
    font-weight: 700;
    margin-top: 10px;
}}

/* SCHEDULE & MDR STAGE (01-06) */
.event-stage {{
    margin-top: 36px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}}

.event-meta-banner {{
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 20px;
    border-bottom: 1.5px solid rgba(246, 197, 143, 0.4);
}}

.meta-left {{
    display: flex;
    flex-direction: column;
    gap: 10px;
}}

.day-chip {{
    font-size: 32px;
    letter-spacing: 3.2px;
    font-weight: 700;
    color: #f6c58f;
}}

.venue-chip {{
    font-family: 'Lora', Georgia, serif;
    font-size: 32px;
    line-height: 1.18;
    color: #fffaf4;
}}

.audience-chip {{
    font-size: 18px;
    letter-spacing: 1.8px;
    font-weight: 700;
    color: #72d1c0;
}}

.time-block {{
    text-align: right;
}}

.time-label {{
    display: block;
    font-size: 13px;
    letter-spacing: 2.2px;
    font-weight: 700;
    color: #f07c67;
    margin-bottom: 6px;
}}

.time-val {{
    font-family: 'Lora', Georgia, serif;
    font-size: 50px;
    font-weight: 700;
    line-height: 1;
    color: #fffaf4;
    white-space: nowrap;
}}

.program-card {{
    background: rgba(18, 9, 32, 0.62);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1.5px solid rgba(246, 197, 143, 0.36);
    border-radius: 22px;
    padding: 30px 36px 34px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
}}

.card-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(246, 197, 143, 0.2);
}}

.card-kicker {{
    font-size: 14px;
    letter-spacing: 2.5px;
    font-weight: 700;
    color: #f6c58f;
}}

.card-badge {{
    font-size: 13px;
    letter-spacing: 1.8px;
    font-weight: 700;
    color: #72d1c0;
}}

ul.items-list {{
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px 32px;
}}

li.item-row {{
    display: flex;
    align-items: flex-start;
    gap: 14px;
}}

.item-num {{
    font-size: 16px;
    font-weight: 700;
    color: #72d1c0;
    padding-top: 3px;
    letter-spacing: 1px;
    min-width: 28px;
}}

.item-text {{
    font-size: 23px;
    line-height: 1.28;
    color: #fffaf4;
}}

/* TIMETABLE OVERVIEW STAGE (07) */
.overview-stage {{
    margin-top: 28px;
}}

.timetable-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
}}

.time-slot {{
    background: rgba(18, 9, 32, 0.62);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 18px;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 195px;
}}

.time-slot.gold-slot {{
    border: 1.5px solid rgba(246, 197, 143, 0.5);
}}

.time-slot.mint-slot {{
    border: 1.5px solid rgba(114, 209, 192, 0.5);
    background: rgba(18, 28, 28, 0.58);
}}

.time-slot.coral-slot {{
    border: 1.5px solid rgba(240, 124, 103, 0.5);
}}

.time-slot.off-slot {{
    border: 1.5px solid rgba(240, 124, 103, 0.35);
    background: rgba(36, 14, 24, 0.55);
}}

.slot-head {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid rgba(246, 197, 143, 0.2);
    padding-bottom: 8px;
}}

.slot-day {{
    font-size: 16px;
    letter-spacing: 2px;
    font-weight: 700;
    color: #f6c58f;
}}

.slot-time {{
    font-family: 'Lora', Georgia, serif;
    font-size: 22px;
    font-weight: 700;
    color: #fffaf4;
}}

.slot-venue {{
    font-family: 'Lora', Georgia, serif;
    font-size: 22px;
    font-weight: 700;
    color: #fffaf4;
    line-height: 1.2;
}}

.slot-body {{
    font-size: 15px;
    line-height: 1.38;
    color: #e2e9e4;
    margin-top: 4px;
}}

/* FOOTER BAR */
.footer-bar {{
    margin-top: auto;
    padding-top: 26px;
    border-top: 1px solid rgba(246, 197, 143, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
}}

.footer-venue {{
    font-size: 18px;
    line-height: 1.35;
    color: #f2eee8;
    max-width: 680px;
}}

.footer-note {{
    text-align: right;
    font-size: 14px;
    letter-spacing: 2px;
    color: #72d1c0;
    font-weight: 700;
    max-width: 320px;
    line-height: 1.3;
}}
</style>
</head>
<body>
<div class="poster-canvas">
    <img class="bg-layer" src="{esc(p['bg'])}" alt="Arka Plan">
    <div class="scrim-layer"></div>
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>

    <div class="content-wrap">
        <div>
            <header class="header-bar">
                {monogram_svg()}
                <div class="header-meta">
                    <div class="meta-eyebrow">{esc(p['eyebrow'])}</div>
                    <div class="meta-tagline">{esc(p['tagline'])}</div>
                </div>
            </header>

            <div class="header-rule"></div>

            <section class="hero-block">
                <div class="hero-kicker">{esc(p['kicker'])}</div>
                <h1 class="hero-title">{esc(p['title'])}</h1>
                <p class="hero-sub">{esc(p['subtitle'])}</p>
                {render_body(p)}
            </section>
        </div>

        <footer class="footer-bar">
            <div class="footer-venue">{esc(p['footer_venue'])}</div>
            <div class="footer-note">{esc(p['footer_note'])}</div>
        </footer>
    </div>
</div>
</body>
</html>"""


def main():
    if not CHROME.exists():
        print(f"Chrome bulunamadı: {CHROME}", file=sys.stderr)
        sys.exit(1)

    print("Esma Avcı AI Görsel Afiş Seti Üretimi Başlıyor...")
    for p in POSTERS:
        slug = p["slug"]
        html_file = SRC / f"{slug}.html"
        html_file.write_text(render_doc(p), encoding="utf-8")

        png_file = OUT / f"{slug}.png"
        pdf_file = OUT / f"{slug}.pdf"

        # 1. Render PNG (1080x1350)
        cmd_png = [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--window-size=1080,1350",
            f"--screenshot={png_file}",
            f"file:///{html_file.as_posix()}",
        ]
        res_png = subprocess.run(cmd_png, capture_output=True, text=True)
        if res_png.returncode != 0:
            print(f"PNG üretimi başarısız ({slug}):", res_png.stderr, file=sys.stderr)
            sys.exit(1)

        # 2. Render PDF (print-to-pdf)
        cmd_pdf = [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=8000",
            f"--print-to-pdf={pdf_file}",
            f"file:///{html_file.as_posix()}",
        ]
        res_pdf = subprocess.run(cmd_pdf, capture_output=True, text=True)
        if res_pdf.returncode != 0:
            print(f"PDF üretimi başarısız ({slug}):", res_pdf.stderr, file=sys.stderr)
            sys.exit(1)

        png_size = png_file.stat().st_size
        pdf_size = pdf_file.stat().st_size
        print(f"✓ {slug}: PNG ({png_size:,} bayt) | PDF ({pdf_size:,} bayt)")

    print("\nTüm 8 afiş başarıyla üretildi!")


if __name__ == "__main__":
    main()



