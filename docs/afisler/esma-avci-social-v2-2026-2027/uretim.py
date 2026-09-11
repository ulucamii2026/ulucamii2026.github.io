# -*- coding: utf-8 -*-
"""
Esma Avcı — Telefon Odaklı Sosyal Medya Afişleri v2 (2026–2027)
Üretim Motoru: HTML5/CSS3 + Chrome/Edge Headless Renderer

8 Konu x 2 Format (1080x1350 Akış, 1080x1920 Hikâye) = 16 PNG
"""

import os
import sys
import subprocess
from PIL import Image

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KAYNAKLAR_DIR = os.path.join(BASE_DIR, "kaynaklar")
TEMP_HTML_DIR = os.path.join(BASE_DIR, ".temp_html")
os.makedirs(TEMP_HTML_DIR, exist_ok=True)

# Tarayıcı yolu tespiti
def get_browser_path():
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for p in chrome_paths:
        if os.path.exists(p):
            return p
    raise RuntimeError("Headless Chrome veya Edge bulunamadı!")

BROWSER_PATH = get_browser_path()
print(f"[Renderer] Tarayıcı bulundu: {BROWSER_PATH}")

# 8 Konunun Tanımları
POSTERS = [
    {
        "id": "00",
        "slug": "00-haftalik-bulusmalar",
        "bg": "bg-00-haftalik-bulusmalar.jpg",
        "eyebrow": "ESMA AVCI · 2026–2027 BULUŞMALARI",
        "title": "HAFTALIK BULUŞMALAR",
        "theme_color": "#1B4DFF",
        "theme_light": "#EFF4FF",
        "pill1_bg": "#1B4DFF",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "📍 Namur & Marche Ulu Camii",
        "pill2_bg": "#FEF08A",
        "pill2_fg": "#1E3A8A",
        "pill2_text": "👥 Hanımlar · Gençler · Öğrenciler",
        "blocks": [
            {
                "title": "Dersler & Sohbetler",
                "desc": "Kur’an-ı Kerim, tefsir, hadis, ilmihal, siyer ve tecvit dersleri"
            },
            {
                "title": "Haftalık Program Günleri",
                "desc": "Pazartesi, Çarşamba, Perşembe, Cuma ve Hafta Sonu buluşmaları"
            },
            {
                "title": "Manevi Danışmanlık (MDR)",
                "desc": "Randevulu birebir görüşme, samimi dertleşme ve rehberlik"
            }
        ],
        "cta": "Gönül soframıza ve ilim meclisimize tüm hanım kardeşlerimiz davetlidir.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "01",
        "slug": "01-pazartesi-hanimlar",
        "bg": "bg-01-pazartesi-hanimlar.jpg",
        "eyebrow": "NAMUR CAMİİ · PAZARTESİ BULUŞMASI",
        "title": "PAZARTESİ HANIMLAR",
        "theme_color": "#2D5A43",
        "theme_light": "#EBF4EE",
        "pill1_bg": "#2D5A43",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "🕒 Her Pazartesi · 10.30 – 16.00",
        "pill2_bg": "#E2EDE6",
        "pill2_fg": "#1C3B2B",
        "pill2_text": "📍 Namur Camii",
        "blocks": [
            {
                "title": "Kur’an-ı Kerim & Tecvit",
                "desc": "Doğru tilavet, ezber takibi, tecvit kaideleri ve mukabele dersi"
            },
            {
                "title": "İlmihal & Siyer Dersleri",
                "desc": "Günlük ibadet esasları, İslam ahlakı ve Peygamberimizin hayatı"
            },
            {
                "title": "Sohbet & Birebir Görüşme",
                "desc": "Gönül sohbeti, hasbihal ve randevulu manevi rehberlik imkânı"
            }
        ],
        "cta": "Haftaya Kur'an-ı Kerim'in bereketi ve samimi sohbetlerle başlayalım.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "02",
        "slug": "02-persembe-hanimlar",
        "bg": "bg-02-persembe-hanimlar.jpg",
        "eyebrow": "NAMUR CAMİİ · PERŞEMBE BULUŞMASI",
        "title": "PERŞEMBE HANIMLAR",
        "theme_color": "#D44A32",
        "theme_light": "#FFF1EE",
        "pill1_bg": "#D44A32",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "🕒 Her Perşembe · 10.30 – 16.00",
        "pill2_bg": "#FFE8E0",
        "pill2_fg": "#7C2D12",
        "pill2_text": "📍 Namur Camii",
        "blocks": [
            {
                "title": "Kur’an-ı Kerim & Tefsir",
                "desc": "Âyet-i kerimelerin derin anlamı, tefsir dersi ve hayata yansımaları"
            },
            {
                "title": "Hadis-i Şerif & Vaaz",
                "desc": "Nebevî ahlak pınarı, haftalık vaaz ve samimi gönül sohbeti"
            },
            {
                "title": "Dua & Birebir Görüşme",
                "desc": "Cuma öncesi dua meclisi ve randevulu manevi danışmanlık"
            }
        ],
        "cta": "İlmin ve duanın huzur veren meclisinde buluşmak üzere bekliyoruz.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "03",
        "slug": "03-carsamba-marche-bulusmasi",
        "bg": "bg-03-carsamba-marche.jpg",
        "eyebrow": "MARCHE-EN-FAMENNE ULU CAMİİ",
        "title": "ÇARŞAMBA MARCHE BULUŞMASI",
        "theme_color": "#D95B0F",
        "theme_light": "#FFF7ED",
        "pill1_bg": "#D95B0F",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "🕒 Her Çarşamba · 10.30 – 16.00",
        "pill2_bg": "#FEF3C7",
        "pill2_fg": "#78350F",
        "pill2_text": "📍 Marche-en-Famenne Ulu Camii",
        "blocks": [
            {
                "title": "Katılımcı Grubu",
                "desc": "Hanımlar ve Genç Kızlar için ortak gelişim ve buluşma günü"
            },
            {
                "title": "Kur’an, İlmihal & Siyer",
                "desc": "Tecvitli okuma, ezber takibi, temel dinî bilgiler ve siyer dersi"
            },
            {
                "title": "Hasbihal, Dua & Soru-Cevap",
                "desc": "Birlikte dua meclisi, samimi sohbet ve merak edilen dinî sorular"
            }
        ],
        "cta": "Marche-en-Famenne Ulu Camii'nde ilim ve muhabbet sofrasına davetlisiniz.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "04",
        "slug": "04-cuma-genc-kizlar",
        "bg": "bg-04-cuma-genc-kizlar.jpg",
        "eyebrow": "NAMUR CAMİİ · GENÇLİK BULUŞMASI",
        "title": "CUMA GENÇ KIZLAR",
        "theme_color": "#0284C7",
        "theme_light": "#F0F9FF",
        "pill1_bg": "#0284C7",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "🕒 Her Cuma Akşamı · 18.30 – 20.30",
        "pill2_bg": "#CCFBF1",
        "pill2_fg": "#0F766E",
        "pill2_text": "📍 Namur Camii",
        "blocks": [
            {
                "title": "Kur’an-ı Kerim & Ezber",
                "desc": "Tecvitli okuma, sûre ezberleri ve âyetlerin gençliğe mesajları"
            },
            {
                "title": "Gençlik Sohbeti & Hasbihal",
                "desc": "Gençlerin zihnini meşgul eden konular, dertleşme ve samimi ortam"
            },
            {
                "title": "Dua & Manevi Güç",
                "desc": "Haftanın yorgunluğunu unutturan Cuma akşamı maneviyat meclisi"
            }
        ],
        "cta": "Haftanın yorgunluğunu geride bırakıp gençlik enerjimizle buluşalım.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "05",
        "slug": "05-hafta-sonu-kiz-ogrenciler",
        "bg": "bg-05-hafta-sonu-kiz-ogrenciler.jpg",
        "eyebrow": "NAMUR CAMİİ · HAFTA SONU KURSU",
        "title": "HAFTA SONU KIZ ÖĞRENCİLER",
        "theme_color": "#2563EB",
        "theme_light": "#EFF6FF",
        "pill1_bg": "#2563EB",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "🕒 Cumartesi & Pazar · 10.00 – 13.00",
        "pill2_bg": "#FEF08A",
        "pill2_fg": "#1E3A8A",
        "pill2_text": "📍 Namur Camii · 7 Yaş ve Üzeri",
        "blocks": [
            {
                "title": "Kur’an-ı Kerim & Elifba",
                "desc": "Sıfırdan Kur'an okuma, tecvit kaideleri ve temel sûre ezberleri"
            },
            {
                "title": "İtikat & İbadet Esasları",
                "desc": "İmanın şartları, abdest ve namaz eğitimi, temel dinî bilgiler"
            },
            {
                "title": "Siyer & Güzel Ahlak",
                "desc": "Peygamber sevgisi, saygı, nezaket ve örnek ahlak bilinci"
            }
        ],
        "cta": "Evlatlarımızın kalbine Kur'an sevgisini ve güzel ahlakı neşeyle aşılıyoruz.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "06",
        "slug": "06-birebir-gorusme-mdr",
        "bg": "bg-06-birebir-gorusme-mdr.jpg",
        "eyebrow": "MANEVİ DANIŞMANLIK VE REHBERLİK (MDR)",
        "title": "BİREBİR GÖRÜŞME / MDR",
        "theme_color": "#6D597A",
        "theme_light": "#F8F6F9",
        "pill1_bg": "#6D597A",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "🕒 Pazartesi & Perşembe · Randevulu",
        "pill2_bg": "#E2EDE6",
        "pill2_fg": "#1C3B2B",
        "pill2_text": "📍 Namur Camii",
        "blocks": [
            {
                "title": "Mahrem & Güvenli Ortam",
                "desc": "Birebir, gizlilik esasına dayalı samimi ve güvenli danışmanlık"
            },
            {
                "title": "Manevi Destek & Rehberlik",
                "desc": "Hayatın dönüm noktalarında dinî, ahlaki ve manevi rehberlik desteği"
            },
            {
                "title": "Randevu Bilgilendirmesi",
                "desc": "Size uygun gün ve saati belirlemek için lütfen iletişime geçiniz"
            }
        ],
        "cta": "Gönül dünyanızı dinlemek ve manevi destek sunmak için buradayız.",
        "footer": "ESMA AVCI · 2026–2027"
    },
    {
        "id": "07",
        "slug": "07-haftalik-akis",
        "bg": "bg-07-haftalik-akis.jpg",
        "eyebrow": "ESMA AVCI · 2026–2027 DÖNEMİ",
        "title": "HAFTALIK AKIŞ",
        "theme_color": "#1E3A8A",
        "theme_light": "#EEF2FF",
        "pill1_bg": "#1E3A8A",
        "pill1_fg": "#FFFFFF",
        "pill1_text": "📅 6 Günlük Ders & Sohbet Programı",
        "pill2_bg": "#FEF3C7",
        "pill2_fg": "#1E3A8A",
        "pill2_text": "📍 Namur & Marche-en-Famenne",
        "blocks": [
            {
                "title": "Pazartesi & Çarşamba",
                "desc": "Pzt: Hanımlar (10.30–16.00 · Namur) | Çrş: Marche Buluşması (10.30–16.00)"
            },
            {
                "title": "Perşembe & Cuma",
                "desc": "Prş: Hanımlar (10.30–16.00 · Namur) | Cum: Genç Kızlar (18.30–20.30 · Namur)"
            },
            {
                "title": "Hafta Sonu & Haftalık İzin",
                "desc": "Cmt & Paz: Kız Öğrenciler (10.00–13.00 · Namur) | Salı: Haftalık İzin"
            }
        ],
        "cta": "Kendinize ve ailenize en uygun programı seçip buluşmalarımıza katılabilirsiniz.",
        "footer": "ESMA AVCI · 2026–2027"
    }
]

def render_html(item, format_type):
    """
    format_type: 'akis' (1080x1350) veya 'hikaye' (1080x1920)
    """
    is_story = (format_type == "hikaye")
    width = 1080
    height = 1920 if is_story else 1350

    # Güvenli alan ve ölçüler
    # Hikâyede üst/alt 220px güvenli alan
    pad_top = 230 if is_story else 80
    pad_bottom = 230 if is_story else 80
    
    # Kart iç ölçüleri
    card_width = 920
    card_padding = "56px 52px" if is_story else "48px 46px"
    card_radius = "44px"
    
    # Başlık boyutu
    title_words = item["title"].split()
    if len(item["title"]) > 22:
        title_size = "76px" if is_story else "70px"
    elif len(item["title"]) > 16:
        title_size = "84px" if is_story else "78px"
    else:
        title_size = "94px" if is_story else "86px"

    bg_img_path = os.path.join(KAYNAKLAR_DIR, item["bg"]).replace(os.sep, "/")

    blocks_html = ""
    for b in item["blocks"]:
        blocks_html += f"""
        <div class="block">
          <div class="block-title">{b['title']}</div>
          <div class="block-desc">{b['desc']}</div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>{item['title']} - {format_type}</title>
<style>
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }}

  body {{
    width: {width}px;
    height: {height}px;
    overflow: hidden;
    position: relative;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    background-color: #FAFAF9;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: {pad_top}px 80px {pad_bottom}px 80px;
  }}

  .bg-layer {{
    position: absolute;
    top: 0;
    left: 0;
    width: {width}px;
    height: {height}px;
    background-image: url('file:///{bg_img_path}');
    background-size: cover;
    background-position: center center;
    z-index: 1;
  }}

  /* Zemin hafif yumuşatıcı parlaklık */
  .vignette-layer {{
    position: absolute;
    top: 0;
    left: 0;
    width: {width}px;
    height: {height}px;
    background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
    z-index: 2;
    pointer-events: none;
  }}

  /* Ana Kart */
  .card {{
    position: relative;
    z-index: 3;
    width: {card_width}px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: {card_radius};
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    box-shadow: 
      0 20px 40px -15px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.03),
      0 2px 8px rgba(0, 0, 0, 0.04);
    padding: {card_padding};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    {"height: 1440px;" if is_story else "min-height: 1160px;"}
  }}

  .header-group {{
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}

  .eyebrow {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: {item['theme_color']};
    text-transform: uppercase;
  }}

  .eyebrow::before {{
    content: "";
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: {item['theme_color']};
  }}

  .main-title {{
    font-size: {title_size};
    font-weight: 900;
    color: #0F172A;
    line-height: 1.06;
    letter-spacing: -0.025em;
    text-transform: uppercase;
  }}

  /* Saat & Konum Rozetleri */
  .pills-container {{
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
  }}

  .pill {{
    display: inline-flex;
    align-items: center;
    padding: {"14px 24px" if is_story else "12px 22px"};
    border-radius: 9999px;
    font-size: {"32px" if is_story else "29px"};
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }}

  .pill-1 {{
    background-color: {item['pill1_bg']};
    color: {item['pill1_fg']};
  }}

  .pill-2 {{
    background-color: {item['pill2_bg']};
    color: {item['pill2_fg']};
    border: 1px solid rgba(0, 0, 0, 0.06);
  }}

  /* Bilgi Blokları */
  .blocks-container {{
    display: flex;
    flex-direction: column;
    gap: {"16px" if is_story else "14px"};
    margin-top: {"18px" if is_story else "12px"};
  }}

  .block {{
    background: #F8FAFC;
    border-radius: 20px;
    padding: {"18px 22px" if is_story else "15px 20px"};
    border-left: 6px solid {item['theme_color']};
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }}

  .block-title {{
    font-size: {"34px" if is_story else "31px"};
    font-weight: 700;
    color: #1E293B;
    line-height: 1.2;
  }}

  .block-desc {{
    font-size: {"28px" if is_story else "26px"};
    font-weight: 500;
    color: #475569;
    line-height: 1.34;
  }}

  /* Alt Kısım: CTA ve Footer */
  .footer-group {{
    display: flex;
    flex-direction: column;
    gap: {"14px" if is_story else "10px"};
    margin-top: {"18px" if is_story else "10px"};
  }}

  .cta-box {{
    background: {item['theme_light']};
    border-radius: 18px;
    padding: {"16px 20px" if is_story else "14px 18px"};
    text-align: center;
    color: {item['theme_color']};
    font-size: {"28px" if is_story else "26px"};
    font-weight: 700;
    line-height: 1.3;
    border: 1px dashed {item['theme_color']}44;
  }}

  .footer-text {{
    text-align: center;
    font-size: {"22px" if is_story else "20px"};
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #94A3B8;
    text-transform: uppercase;
  }}
</style>
</head>
<body>
  <div class="bg-layer"></div>
  <div class="vignette-layer"></div>
  <div class="card">
    <div class="header-group">
      <div class="eyebrow">{item['eyebrow']}</div>
      <h1 class="main-title">{item['title']}</h1>
      <div class="pills-container">
        <div class="pill pill-1">{item['pill1_text']}</div>
        <div class="pill pill-2">{item['pill2_text']}</div>
      </div>
    </div>

    <div class="blocks-container">
      {blocks_html}
    </div>

    <div class="footer-group">
      <div class="cta-box">{item['cta']}</div>
      <div class="footer-text">{item['footer']}</div>
    </div>
  </div>
</body>
</html>
"""
    return html

def main():
    print("=== ESMA AVCI SOSYAL MEDYA AFİŞLERİ V2 ÜRETİMİ BAŞLADI ===")
    print(f"Hedef Klasör: {BASE_DIR}")
    
    total_generated = 0
    results = []

    for item in POSTERS:
        for fmt in ["akis", "hikaye"]:
            filename = f"{item['slug']}-{fmt}.png"
            out_path = os.path.join(BASE_DIR, filename)
            html_content = render_html(item, fmt)
            
            temp_html_file = os.path.join(TEMP_HTML_DIR, f"{item['slug']}-{fmt}.html")
            with open(temp_html_file, "w", encoding="utf-8") as f:
                f.write(html_content)

            w = 1080
            h = 1920 if fmt == "hikaye" else 1350

            cmd = [
                BROWSER_PATH,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                f"--window-size={w},{h}",
                f"--screenshot={out_path}",
                f"file:///{temp_html_file.replace(os.sep, '/')}",
            ]

            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0:
                print(f"[HATA] {filename} üretilemedi: {res.stderr}")
                continue

            if os.path.exists(out_path):
                im = Image.open(out_path)
                size_str = f"{im.size[0]}x{im.size[1]}"
                kb_size = os.path.getsize(out_path) // 1024
                expected = (w, h)
                status = "BAŞARILI" if im.size == expected else "BOYUT HATASI"
                print(f"[{status}] {filename} -> {size_str} ({kb_size} KB)")
                total_generated += 1
                results.append({
                    "file": filename,
                    "size": size_str,
                    "kb": kb_size,
                    "ok": (im.size == expected)
                })
            else:
                print(f"[EKSİK] {filename} bulunamadı!")

    print(f"\nToplam {total_generated} / 16 dosya üretildi.")
    all_ok = all(r["ok"] for r in results) and len(results) == 16
    if all_ok:
        print("TÜM AFİŞLER VE BOYUTLAR EKSİKSİZ VE HATASIZ DOĞRULANDI!")
    else:
        print("DİKKAT: Bazı afişlerde boyut uyumsuzluğu var!")

if __name__ == "__main__":
    main()
