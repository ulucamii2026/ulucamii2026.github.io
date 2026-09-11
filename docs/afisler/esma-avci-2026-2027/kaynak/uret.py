from pathlib import Path
import html, subprocess, sys

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
OUT = ROOT
CHROME = Path(r'C:\Program Files\Google\Chrome\Application\chrome.exe')
if not CHROME.exists():
    CHROME = Path(r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')

POSTERS = [
    {
        'slug': '00-esma-avci-genel-tanitim',
        'eyebrow': 'NAMUR BÖLGESİ · 2026–2027',
        'title': 'Esma AVCI Hoca Hanım',
        'subtitle': 'Hanımlar, genç kızlar ve kız çocukları için düzenli ders, sohbet ve rehberlik programı.',
        'kind': 'cover',
        'footer': 'Namur Camii · Marche-en-Famenne Ulu Camii',
    },
    {
        'slug': '01-hanimlar-pazartesi',
        'eyebrow': 'HANIMLAR · NAMUR CAMİİ',
        'title': 'Kur’an ve tilavet',
        'subtitle': 'Düzenli öğrenme, tekrar ve gönülden sohbet için haftanın ilk buluşması.',
        'kind': 'schedule',
        'day': 'PAZARTESİ',
        'time': '10.30 – 16.00',
        'venue': 'Namur Camii',
        'audience': 'Hanımlar',
        'items': ['Kur’an-ı Kerim', 'Ezber ve Tecvit', 'İlmihal ve Siyer', 'Sohbet', 'Birebir görüşme'],
        'footer': 'Görev yeri: Namur Camii',
    },
    {
        'slug': '02-hanimlar-persembe',
        'eyebrow': 'HANIMLAR · NAMUR CAMİİ',
        'title': 'Tefsir, hadis ve vaaz',
        'subtitle': 'Bilgimizi derinleştiren, sorularımıza birlikte cevap aradığımız haftalık program.',
        'kind': 'schedule',
        'day': 'PERŞEMBE',
        'time': '10.30 – 16.00',
        'venue': 'Namur Camii',
        'audience': 'Hanımlar',
        'items': ['Kur’an-ı Kerim', 'Tefsir', 'Hadis', 'Dua', 'Vaaz', 'Birebir görüşme'],
        'footer': 'Görev yeri: Namur Camii',
    },
    {
        'slug': '03-marche-carsamba-programi',
        'eyebrow': 'HANIMLAR & GENÇ KIZLAR · MARCHE-EN-FAMENNE',
        'title': 'Kur’an, dua ve soru-cevap',
        'subtitle': 'Hanımlar ve genç kızlarla Kur’an’ın rehberliğinde buluşuyoruz.',
        'kind': 'schedule',
        'day': 'ÇARŞAMBA',
        'time': '10.30 – 16.00',
        'venue': 'Marche-en-Famenne Ulu Camii',
        'audience': 'Hanımlar · Genç kızlar',
        'items': ['Kur’an-ı Kerim', 'Ezber ve Tecvit', 'İlmihal ve Siyer', 'Dua', 'Soru-cevap'],
        'footer': 'Görev yeri: Marche-en-Famenne Ulu Camii',
    },
    {
        'slug': '04-genc-kizlar-cuma',
        'eyebrow': 'GENÇ KIZLAR · NAMUR CAMİİ',
        'title': 'Kur’an ve hasbihal',
        'subtitle': 'Genç kızlarımızla Kur’an’ın rehberliğinde samimi ve canlı bir akşam.',
        'kind': 'schedule',
        'day': 'CUMA',
        'time': '18.30 – 20.30',
        'venue': 'Namur Camii',
        'audience': 'Genç kızlar',
        'items': ['Kur’an-ı Kerim', 'Ezber', 'Dua', 'Sohbet', 'Gençlerle Hasbihal'],
        'footer': 'Görev yeri: Namur Camii',
    },
    {
        'slug': '05-kiz-cocuklari-hafta-sonu',
        'eyebrow': 'HAFTA SONU KUR’AN KURSU · NAMUR CAMİİ',
        'title': 'Kız çocukları için Kur’an kursu',
        'subtitle': 'Kur’an-ı Kerim ve temel dinî bilgilerle, yaşa uygun ve düzenli bir öğrenme ortamı.',
        'kind': 'schedule',
        'day': 'CUMARTESİ & PAZAR',
        'time': '10.00 – 13.00',
        'venue': 'Namur Camii',
        'audience': 'Kız öğrenciler · 7+ yaş',
        'items': ['Kur’an-ı Kerim', 'İtikat', 'İbadet', 'Siyer', 'Ahlak'],
        'footer': 'Namur Camii yönetimiyle koordineli hafta sonu programı',
    },
    {
        'slug': '06-mdr-birebir-gorusme',
        'eyebrow': 'MANEVİ DANIŞMANLIK VE REHBERLİK',
        'title': 'Birebir görüşme',
        'subtitle': 'Dinî ve manevi konularda konuşmak, soru sormak ve rehberlik almak için görüşme imkânı.',
        'kind': 'mdr',
        'day': 'PAZARTESİ & PERŞEMBE',
        'time': '10.30 – 16.00',
        'venue': 'Namur Camii',
        'audience': 'Hanımlar',
        'items': ['Birebir görüşme', 'Soru ve cevaplar', 'Manevi rehberlik'],
        'footer': 'Hanımlar programı içinde · Namur Camii',
    },
    {
        'slug': '07-haftalik-program-ozeti',
        'eyebrow': 'ESMA AVCI HOCAMIZLA · NAMUR BÖLGESİ',
        'title': 'Haftalık çalışma programı',
        'subtitle': 'Görev yerleri ve hedef kitleleriyle birlikte haftanın tamamı.',
        'kind': 'overview',
        'footer': 'Güncel bilgiler için ilgili cami yönetiminin duyurularını takip edin.',
    },
]


def esc(value):
    return html.escape(value, quote=True)


def mark_svg():
    return '''<svg class="mark" viewBox="0 0 170 170" aria-hidden="true"><circle cx="85" cy="85" r="70" fill="none" stroke="#f6c58f" stroke-width="2" opacity=".85"/><circle cx="85" cy="85" r="57" fill="#f6c58f" opacity=".11"/><path d="M85 22l11 47 47 16-47 16-11 47-11-47-47-16 47-16z" fill="none" stroke="#f6c58f" stroke-width="2" opacity=".75"/><text x="85" y="96" text-anchor="middle" fill="#fff6eb" font-family="Work,Arial,sans-serif" font-weight="700" font-size="26" letter-spacing="2">EA</text></svg>'''


def texture_svg():
    return '''<svg class="texture" viewBox="0 0 1080 1350" aria-hidden="true"><defs><pattern id="dots" width="54" height="54" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="#f6c58f" opacity=".22"/><circle cx="31" cy="28" r="1" fill="#72d1c0" opacity=".16"/></pattern><linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c58f" stop-opacity=".18"/><stop offset=".6" stop-color="#72d1c0" stop-opacity=".04"/><stop offset="1" stop-color="#f07c67" stop-opacity=".2"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#dots)"/><path d="M-80 1030C180 900 340 1160 620 990s360-20 540-100v460H-80Z" fill="url(#wash)"/><path d="M-40 1160C180 1050 360 1240 615 1090c178-104 300-120 530-62" fill="none" stroke="#f6c58f" stroke-width="3" opacity=".6"/><circle cx="890" cy="180" r="220" fill="#72d1c0" opacity=".06"/></svg>'''


def item_rows(items):
    return ''.join(f'<li><span class="num">{i:02d}</span><span>{esc(x)}</span></li>' for i,x in enumerate(items,1))


def mini(day,time,title,detail,variant=''):
    return f'<div class="mini {variant}"><div class="mini-day">{esc(day)}</div><div class="mini-time">{esc(time)}</div><div class="mini-title">{esc(title)}</div><div class="mini-detail">{esc(detail)}</div></div>'


def body(p):
    if p['kind'] == 'cover':
        return '''<div class="cover-stage"><div class="cover-tag">HAFTALIK ÇALIŞMA PROGRAMI</div><div class="cover-route"><span>NAMUR CAMİİ</span><i></i><span>MARCHE-EN-FAMENNE ULU CAMİİ</span></div><div class="cover-sentence">İlim, güzel ahlâk ve kardeşlik için birlikte öğreniyoruz.</div><div class="cover-stripe"><span>HANIMLAR</span><span>GENÇ KIZLAR</span><span>KIZ ÇOCUKLARI</span></div></div>'''
    if p['kind'] in ('schedule','mdr'):
        return f'''<div class="event"><div class="event-top"><div><div class="event-day">{esc(p['day'])}</div><div class="event-venue">{esc(p['venue'])}</div><div class="event-audience">{esc(p['audience'])}</div></div><div class="event-time">{esc(p['time'])}</div></div><div class="list-card"><ul>{item_rows(p['items'])}</ul></div></div>'''
    return '''<div class="overview-grid">'''+mini('PAZARTESİ','10.30–16.00','Hanımlar','Namur Camii · Kur’an, ezber, tecvit, ilmihal, siyer, sohbet')+mini('ÇARŞAMBA','10.30–16.00','Hanımlar & genç kızlar','Marche-en-Famenne Ulu Camii · Kur’an, dua, soru-cevap','mint')+mini('PERŞEMBE','10.30–16.00','Hanımlar','Namur Camii · Tefsir, hadis, dua, vaaz, birebir görüşme','mint')+mini('CUMA','18.30–20.30','Genç kızlar','Namur Camii · Kur’an, ezber, dua, sohbet, hasbihal')+mini('HAFTA SONU','10.00–13.00','Kız öğrenciler · 7+','Namur Camii · Kur’an kursu','mint')+'''<div class="mini off"><div class="mini-day">SALI</div><div class="mini-time">İZİN</div><div class="mini-title">Haftalık izin günü</div><div class="mini-detail">Program dışında dinlenme ve hazırlık.</div></div></div>'''


def doc(p):
    return f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>{esc(p['title'])}</title><style>
@font-face{{font-family:Work;src:url('fonts/WorkSans-Regular.ttf') format('truetype');font-weight:400}}@font-face{{font-family:Work;src:url('fonts/WorkSans-Bold.ttf') format('truetype');font-weight:700}}@font-face{{font-family:Lora;src:url('fonts/Lora-Regular.ttf') format('truetype');font-weight:400}}@font-face{{font-family:Lora;src:url('fonts/Lora-Bold.ttf') format('truetype');font-weight:700}}
@page{{size:1080px 1350px;margin:0}}*{{box-sizing:border-box}}html,body{{margin:0;width:1080px;height:1350px;background:#241441}}body{{overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.poster{{position:relative;width:1080px;height:1350px;overflow:hidden;background:linear-gradient(145deg,#241441 0%,#34205d 58%,#211038 100%);color:#fff6eb;font-family:Work,Arial,sans-serif}}.texture{{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}}.edge{{position:absolute;inset:34px;border:1px solid rgba(246,197,143,.45);border-radius:30px;pointer-events:none}}.edge:after{{content:"";position:absolute;inset:11px;border:1px solid rgba(114,209,192,.2);border-radius:21px}}.content{{position:relative;z-index:2;height:100%;padding:66px 78px 55px;display:flex;flex-direction:column}}.brand{{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}}.mark{{width:116px;height:116px;display:block;filter:drop-shadow(0 8px 18px rgba(0,0,0,.22))}}.brand-meta{{margin-left:auto;text-align:right;padding-top:10px;max-width:710px}}.eyebrow{{font-size:18px;letter-spacing:2.8px;font-weight:700;color:#f6c58f;line-height:1.25}}.brand-line{{margin-top:13px;font-size:14px;letter-spacing:2px;color:#b9e7dc;font-weight:700}}.rule{{height:1px;background:linear-gradient(90deg,#f6c58f,rgba(246,197,143,.05));margin:31px 0 40px}}.hero{{max-width:900px}}.kicker{{font-size:18px;letter-spacing:3.5px;font-weight:700;color:#f6c58f;margin-bottom:22px}}h1{{font-family:Lora,Georgia,serif;font-weight:700;font-size:69px;line-height:1.06;letter-spacing:-1.4px;margin:0;max-width:920px;color:#fffaf4}}.subtitle{{font-size:25px;line-height:1.43;margin:26px 0 0;max-width:865px;color:#f2eee8}}.cover-stage{{margin-top:92px;display:flex;flex-direction:column;gap:28px}}.cover-tag{{align-self:flex-start;border:1px solid rgba(246,197,143,.85);border-radius:999px;padding:13px 23px;color:#f6c58f;font-size:17px;letter-spacing:2.8px;font-weight:700;background:rgba(246,197,143,.06)}}.cover-route{{display:flex;align-items:center;flex-wrap:wrap;gap:16px;font-size:20px;letter-spacing:1.8px;font-weight:700;color:#fff6eb}}.cover-route i{{width:7px;height:7px;background:#72d1c0;border-radius:50%;display:inline-block}}.cover-sentence{{font-family:Lora,Georgia,serif;font-size:31px;line-height:1.38;color:#f6c58f;max-width:710px;margin-top:13px}}.cover-stripe{{display:flex;gap:13px;flex-wrap:wrap;margin-top:22px}}.cover-stripe span{{padding:12px 17px;border-radius:9px;background:#f07c67;color:#241441;font-size:16px;letter-spacing:1.7px;font-weight:700}}.event{{margin-top:65px}}.event-top{{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;padding-bottom:24px;border-bottom:1px solid rgba(246,197,143,.38)}}.event-day{{font-size:29px;letter-spacing:3px;color:#f6c58f;font-weight:700}}.event-venue{{font-family:Lora,Georgia,serif;font-size:31px;line-height:1.2;margin-top:13px;color:#fffaf4;max-width:630px}}.event-audience{{margin-top:9px;font-size:18px;color:#b9e7dc;letter-spacing:1.5px;font-weight:700}}.event-time{{font-family:Lora,Georgia,serif;white-space:nowrap;font-size:52px;line-height:1;color:#fffaf4}}.list-card{{margin-top:38px;padding:31px 36px 35px;border:1px solid rgba(246,197,143,.34);border-radius:24px;background:rgba(21,10,40,.42);box-shadow:0 18px 40px rgba(0,0,0,.18)}}ul{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:22px 34px}}li{{display:flex;align-items:flex-start;gap:15px;font-size:24px;line-height:1.25;color:#fffaf4}}.num{{min-width:31px;padding-top:4px;color:#72d1c0;font-size:15px;font-weight:700;letter-spacing:1px}}.overview-grid{{margin-top:58px;display:grid;grid-template-columns:1fr 1fr;gap:19px}}.mini{{padding:25px 26px 27px;min-height:203px;border-radius:20px;border:1px solid rgba(246,197,143,.5);background:rgba(21,10,40,.4)}}.mini.mint{{border-color:rgba(114,209,192,.5);background:rgba(114,209,192,.1)}}.mini.off{{border-color:rgba(240,124,103,.55);background:rgba(240,124,103,.1)}}.mini-day{{font-size:16px;letter-spacing:2px;font-weight:700;color:#f6c58f}}.mini-time{{font-family:Lora,Georgia,serif;font-size:32px;margin:11px 0 13px;color:#fffaf4}}.mini-title{{font-family:Lora,Georgia,serif;font-size:27px;line-height:1.15;color:#fffaf4}}.mini-detail{{font-size:16px;line-height:1.35;color:#e2e9e4;margin-top:9px}}.footer{{margin-top:auto;padding-top:30px;display:flex;justify-content:space-between;align-items:flex-end;gap:26px;border-top:1px solid rgba(246,197,143,.28)}}.footer-main{{font-size:19px;line-height:1.35;color:#f2eee8;max-width:730px}}.footer-mark{{text-align:right;font-size:15px;line-height:1.25;letter-spacing:2px;color:#72d1c0;font-weight:700}}@media(max-width:700px){{}}
</style></head><body><main class="poster">{texture_svg()}<div class="edge"></div><div class="content"><div class="brand">{mark_svg()}<div class="brand-meta"><div class="eyebrow">{esc(p['eyebrow'])}</div><div class="brand-line">BÖLGESEL EĞİTİM · DERS · REHBERLİK</div></div></div><div class="rule"></div><section class="hero"><div class="kicker">ESMA AVCI HOCAMIZLA</div><h1>{esc(p['title'])}</h1><p class="subtitle">{esc(p['subtitle'])}</p>{body(p)}</section><footer class="footer"><div class="footer-main">{esc(p['footer'])}</div><div class="footer-mark">NAMUR BÖLGESİ<br>2026–2027</div></footer></div></main></body></html>'''


def main():
    if not CHROME.exists(): raise SystemExit('Chrome bulunamadı')
    for p in POSTERS:
        hp=SRC/f"{p['slug']}.html"; hp.write_text(doc(p),encoding='utf-8')
        png=OUT/f"{p['slug']}.png"; pdf=OUT/f"{p['slug']}.pdf"
        for target, extra in [(png,[f'--screenshot={png}','--window-size=1080,1350']),(pdf,[f'--print-to-pdf={pdf}'])]:
            cmd=[str(CHROME),'--headless=new','--disable-gpu','--hide-scrollbars','--no-pdf-header-footer','--allow-file-access-from-files','--virtual-time-budget=9000','--run-all-compositor-stages-before-draw']+extra+['file:///'+hp.as_posix()]
            result=subprocess.run(cmd,capture_output=True,text=True)
            if result.returncode: print(result.stdout,result.stderr,file=sys.stderr); raise SystemExit(f'Üretim başarısız: {target}')
        print('OK',p['slug'])
if __name__=='__main__': main()
