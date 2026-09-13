# -*- coding: utf-8 -*-
"""Yeni kayıt + ihtida formlarının tarayıcı testi. Önce `npx astro build && npx astro preview --port 4321`; uç nokta taklit edilir (gerçek gönderim yok). Çıktılar .codex/cikti/form-test/ altındadır. Dış ağ kapalıdır; tüm gönderimler taklittir."""
import os, sys, json, time, urllib.request
from urllib.parse import urlsplit
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

# Sunucu adresi ONIZLEME ile değiştirilebilir: `astro preview` arka plan kipinde
# 4399'a bağlanıyor, elle başlatınca 4321'e.
KOK = os.environ.get("ONIZLEME", "http://localhost:4399").rstrip("/")
if urlsplit(KOK).hostname not in ("localhost", "127.0.0.1", "::1"):
    sys.exit("Test yalnız localhost üzerinde çalışır.")
OUT = 'D:/tmp/form-test'
Path(OUT).mkdir(parents=True, exist_ok=True)

def agi_yalit(ctx):
    def yonlendir(route):
        u = urlsplit(route.request.url)
        if u.netloc == urlsplit(KOK).netloc:
            route.continue_()
        elif u.hostname == "ulucamii.goatcounter.com":
            route.fulfill(status=200, content_type="application/json", body='{"count":"0"}')
        else:
            route.abort()
    ctx.route("**/*", yonlendir)
    ctx.route_web_socket("**/*", lambda ws: ws.close())
EXEC_PARCA = "script.google.com/macros"
GONDERILEN = []
KOPYA_GITTI = True

for i in range(40):
    try:
        urllib.request.urlopen(KOK + "/kayit/", timeout=3); break
    except Exception:
        time.sleep(1)
else:
    sys.exit("preview sunucusu yok")

def taklit(route, request):
    if request.method == "POST":
        try: GONDERILEN.append(json.loads(request.post_data))
        except Exception: GONDERILEN.append({"HAM": request.post_data})
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True, "ref": "UC-2026-9999", "tekrar": False, "kopyaGitti": KOPYA_GITTI}))
    else:
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True, "surum": 29, "ihtidaPaketHazir": True}))

def testPng(yol, en, boy, renk):
    """PIL olmadan geçerli bir RGB PNG üretir (görsel yükleme testleri için)."""
    import zlib, struct
    ham = b"".join(b"\x00" + bytes(renk) * en for _ in range(boy))
    def bolum(tur, veri):
        return struct.pack(">I", len(veri)) + tur + veri + struct.pack(">I", zlib.crc32(tur + veri) & 0xFFFFFFFF)
    with open(yol, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n"
                + bolum(b"IHDR", struct.pack(">IIBBBBB", en, boy, 8, 2, 0, 0, 0))
                + bolum(b"IDAT", zlib.compress(ham, 6))
                + bolum(b"IEND", b""))
    return yol

def imzaCiz(pg, secici):
    pg.locator(secici).scroll_into_view_if_needed()
    """Kanvasa fareyle gerçek bir çizgi çizer (imzaYok için üç noktadan fazlası gerekir)."""
    kutu = pg.locator(secici).bounding_box()
    x0, y0 = kutu["x"] + 30, kutu["y"] + kutu["height"] * 0.6
    pg.mouse.move(x0, y0)
    pg.mouse.down()
    for i in range(1, 14):
        pg.mouse.move(x0 + i * 9, y0 - (18 if i % 2 else -12))
    pg.mouse.up()

sonuclar = []
def kontrol(ad, kosul):
    sonuclar.append((ad, bool(kosul))); print(("OK   " if kosul else "HATA ") + ad)

def kayitDoldur(pg):
    pg.fill('#k-ad', 'ayşe'); pg.fill('#k-soyad', 'TESTOGLU'); pg.check('#k-cins-kiz')
    pg.fill('#k-dogum', '2017-03-15'); pg.select_option('#k-okul', label="École communale d'Aye")
    pg.select_option('#k-sinif', 'P3'); pg.check('#k-kurs-yeni'); pg.check('#k-yak-anne')
    pg.fill('#k-veli-ad', 'anne-Marie ışık'); pg.fill('#k-veli-cep', '0470123456')
    pg.fill('#k-veli-eposta', 'v3@example.test'); pg.fill('#k-adres', 'Rue Exemple 12'); pg.fill('#k-posta', '6990')
    pg.check('#k-saglik-hayir'); pg.check('#k-goruntu-hayir'); pg.check('#k-goruntu-sosyal-hayir')
    pg.locator('#k-kurallar-kutu').evaluate('(e) => { e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event("scroll")); }')
    pg.check('#k-onay-kurallar'); pg.check('#k-onay-gizlilik'); pg.fill('#k-imza', 'annemarieisik')

def ekran(pg, dosya):
    pg.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
    pg.wait_for_timeout(250)
    pg.screenshot(path=dosya, full_page=True, animations='disabled')

with sync_playwright() as p:
    tarayici = p.chromium.launch()
    for cihaz, vp in (("masaustu", {"width": 1280, "height": 900}), ("mobil", {"width": 390, "height": 844})):
        ctx = tarayici.new_context(viewport=vp, device_scale_factor=1, locale="tr-BE", service_workers="block", reduced_motion='reduce')
        agi_yalit(ctx)
        pg = ctx.new_page()
        konsol = []
        pg.on("console", lambda m: konsol.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: konsol.append(f"pageerror: {e}"))
        pg.route("**/macros/**", taklit)
        pg.goto(KOK + "/kayit/", wait_until="networkidle")
        ekran(pg, f"{OUT}/kayit-{cihaz}.png")

        # 1) boş gönderim → hatalar
        pg.click("button[type=submit]")
        pg.wait_for_timeout(1200)   # yumuşak kaydırma bitsin
        hata_sayisi = pg.locator(".hata:not([hidden])").count()
        kontrol(f"[{cihaz}] boş gönderimde hata mesajları ({hata_sayisi})", hata_sayisi >= 8)
        kontrol(f"[{cihaz}] genel uyarı görünür", pg.locator("[data-mesaj]").is_visible())

        # 2) doldur
        pg.fill("#k-ad", "Ayşe"); pg.fill("#k-soyad", "TESTOGLU")
        pg.check("#k-cins-kiz"); pg.fill("#k-dogum", "2017-03-15")
        kontrol(f"[{cihaz}] sınıf listesi okul seçilmeden kapalı", pg.locator("#k-sinif").is_disabled())
        pg.select_option("#k-okul", label="Institut Saint-Roch")
        secenekler = pg.locator("#k-sinif option").all_text_contents()
        kontrol(f"[{cihaz}] ortaöğretim okulunda S sınıfları ({len(secenekler)})", any("6" in s for s in secenekler) and not any("Anaokulu" in s for s in secenekler))
        pg.select_option("#k-okul", label="École communale d'Aye")
        secenekler = pg.locator("#k-sinif option").all_text_contents()
        kontrol(f"[{cihaz}] temel eğitim okulunda anaokulu/ilkokul sınıfları", any("Anaokulu" in s for s in secenekler))
        pg.select_option("#k-sinif", "P3"); pg.check("#k-kurs-yeni")
        pg.check("#k-yak-anne"); pg.fill("#k-veli-ad", "Fatma Testoğlu"); pg.fill("#k-veli-cep", "0470 12 34 56")
        pg.fill("#k-veli-eposta", "veli@example.test"); pg.fill("#k-adres", "Rue de la Station 12"); pg.fill("#k-posta", "6900")
        pg.check("#k-saglik-evet")
        kontrol(f"[{cihaz}] sağlık notu alanı açıldı", pg.locator("#k-saglik-not").is_visible())
        pg.fill("#k-saglik-not", "Fıstık alerjisi"); pg.check("#k-saglik-riza")
        pg.check("#k-goruntu-hayir")
        pg.check("#k-goruntu-sosyal-hayir")   # ayrı sosyal medya izni (25 Ağu 2026'da eklendi)
        kontrol(f"[{cihaz}] kurallar kutusu kaydırılmadan onay kilitli", pg.locator("#k-onay-kurallar").is_disabled())
        pg.evaluate("document.getElementById('k-kurallar-kutu').scrollTop = 99999"); pg.wait_for_timeout(200)
        kontrol(f"[{cihaz}] kaydırınca onay açıldı", pg.locator("#k-onay-kurallar").is_enabled())
        pg.check("#k-onay-kurallar"); pg.check("#k-onay-gizlilik")
        pg.fill("#k-imza", "Fatma Testoglu")   # aksansız yazım eşleşmeli
        onYol = testPng(f"{OUT}/test-kayit-on.png", 640, 400, (150, 180, 210))
        pg.set_input_files("#k-g-kimlik-on", onYol)
        pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]')
        pg.check('#k-kimlik-riza')
        pg.wait_for_timeout(500)
        taslak = pg.evaluate("localStorage.getItem('ulucamii:kayit:v2') || ''")
        kontrol(f"[{cihaz}] taslakta sağlık notu ve görsel yok", 'saglik.not' not in taslak and 'data:image' not in taslak and 'Fıstık' not in taslak)
        kontrol(f"[{cihaz}] kimlik gizli girdileri boş ve önizleme blob", pg.input_value('#k-kimlik-on') == '' and pg.locator('[data-gorsel="kimlikOn"] img').get_attribute('src').startswith('blob:'))
        kontrol(f"[{cihaz}] ilerleme yüzde 100", pg.locator('#k-ilerleme [role=progressbar]').get_attribute('aria-valuenow') == '100')
        kontrol(f"[{cihaz}] tamamlanan kimlik kartı hata durumundan çıkar", pg.locator('#b-kimlik').get_attribute('data-durum') == 'tamam')
        ozet = pg.locator("[data-ozet-alan=ogrenci] [data-ozet-deger]").text_content()
        kontrol(f"[{cihaz}] özet öğrenci dolu ({ozet})", "Ayşe" in ozet and "15.03.2017" in ozet)
        pg.click("button[type=submit]")
        try:
            pg.wait_for_selector("[data-basari]:not([hidden])", timeout=8000)
        except Exception:
            print("  MESAJ:", pg.locator("[data-mesaj]").text_content(), "| hatalar:", pg.locator(".hata:not([hidden])").all_text_contents()[:5]); raise
        kontrol(f"[{cihaz}] başarı paneli + referans", "UC-2026-9999" in pg.locator("[data-basari] [data-ref]").first.text_content())
        pg.screenshot(path=f"{OUT}/kayit-{cihaz}-basari.png", full_page=True)
        g = GONDERILEN[-1]
        kontrol(f"[{cihaz}] gövde: tur/sir/dil/anahtar", g.get("tur") == "kayit" and g.get("sir") == "ULUCAMII-KAYIT-2026" and g.get("dil") == "tr" and len(g.get("gonderimAnahtari", "")) > 20)
        kontrol(f"[{cihaz}] gövde: telefon E.164 {g['veli']['cep']}", g["veli"]["cep"] == "+32470123456")
        kontrol(f"[{cihaz}] gövde: sağlık ve rıza", g["saglik"] == {"var": True, "not": "Fıstık alerjisi"} and g["onay"]["saglikRiza"] is True and g["goruntuIzni"] is False)
        kontrol(f"[{cihaz}] gövde: kimlik numarası ve eski PDF alanları YOK", "kimlikNo" not in json.dumps(g) and "pdfBase64" not in g and "images" not in g)
        kontrol(f"[{cihaz}] gövde: v3, ön yüz JPEG, arka boş ve rıza", g['formSurumu'] == 3 and g['kimlik']['yol'] == 'yukle' and g['kimlik']['on'].startswith('data:image/jpeg;base64,') and len(g['kimlik']['on']) >= 2048 and g['kimlik']['arka'] == '' and g['onay']['kimlikRiza'] is True)
        # v3'te yalnız görsel dışındaki mevcut sözleşmenin küçük kalması beklenir.
        hafif = {**g, 'kimlik': {**g['kimlik'], 'on': '', 'arka': ''}}
        kontrol(f"[{cihaz}] görsel dışı gövde küçük ({len(json.dumps(hafif))} B)", len(json.dumps(hafif)) < 3000)
        kontrol(f"[{cihaz}] başarıda kimlik alındı ve kopyalama düğmesi", 'alındı' in pg.locator('[data-kimlik-adim]').inner_text() and pg.locator('[data-ref-kopyala]').is_visible())
        pg.screenshot(path=f"{OUT}/kayit-v3-basari-{vp['width']}.png", full_page=True)
        # kardeş kaydı
        with pg.expect_navigation():
            pg.click("[data-basari] a[href='?kardes=1']")
        pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(300)
        kontrol(f"[{cihaz}] kardeş kaydında veli hazır", pg.input_value("#k-veli-ad") == "Fatma Testoğlu" and pg.input_value("#k-ad") == "")
        kontrol(f"[{cihaz}] konsol temiz (goatcounter/geçiş uyarıları hariç)", not [k for k in konsol if "goatcounter" not in k and "Transition was skipped" not in k])
        if konsol: print("  konsol:", konsol[:5])
        ctx.close()

    # v3: alternatif teslim yolları, taslak mahremiyeti, etkileşim ve ekran boyutları.
    for yol in ('elden', 'whatsapp', 'eposta'):
        ctx = tarayici.new_context(viewport={'width': 360, 'height': 800}, locale='tr-BE', service_workers='block', reduced_motion='reduce')
        agi_yalit(ctx); pg = ctx.new_page(); konsol = []
        pg.on('pageerror', lambda e: konsol.append(str(e)))
        pg.on('console', lambda m: konsol.append(m.text) if m.type == 'error' else None)
        pg.route('**/macros/**', taklit)
        pg.goto(KOK + '/kayit/', wait_until='networkidle')
        kayitDoldur(pg)
        kontrol(f'[{yol}] ad baş harfi ve telefon biçimi', pg.input_value('#k-ad') == 'Ayşe' and pg.input_value('#k-veli-ad') == 'Anne-Marie Işık' and pg.input_value('#k-veli-cep') == '+32 470 12 34 56')
        kontrol(f'[{yol}] posta kodu şehri tamamlar', pg.input_value('#k-sehir') == 'Hotton')
        pg.fill('#k-sehir', 'Namur'); pg.fill('#k-posta', '6900')
        kontrol(f'[{yol}] özel şehir korunur', pg.input_value('#k-sehir') == 'Namur')
        if yol == 'elden':
            # Görseller ve sağlık notu mevcutken kaydet/yenile: eski hassas taslağı da temizle.
            pg.check('#k-saglik-evet'); pg.fill('#k-saglik-not', 'Yalnız açık sayfada'); pg.check('#k-saglik-riza')
            pg.set_input_files('#k-g-kimlik-on', onYol); pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]')
            pg.wait_for_timeout(600)
            kontrol('taslak sağlık notunu ve görseli saklamaz', pg.evaluate("() => { const s=localStorage.getItem('ulucamii:kayit:v2'); return !!s && !s.includes('saglik.not') && !s.includes('data:image') && !s.includes('onay.'); }"))
            pg.evaluate("() => { const s=JSON.parse(localStorage.getItem('ulucamii:kayit:v2')); s.alanlar['saglik.not']='ESKI-HASSAS'; s.alanlar['onay.kimlikRiza']='1'; localStorage.setItem('ulucamii:kayit:v2', JSON.stringify(s)); }")
            pg.reload(wait_until='networkidle')
            kontrol('eski taslak sağlık ve rızayı geri yüklemez', pg.input_value('#k-saglik-not') == '' and not pg.is_checked('#k-kimlik-riza') and not pg.evaluate("localStorage.getItem('ulucamii:kayit:v2').includes('ESKI-HASSAS')"))
            kontrol('taslak zamanı ve hassas veri açıklaması görünür', pg.locator('[data-taslak-not]').is_visible() and ':' in pg.locator('[data-taslak-metin]').inner_text() and 'Sağlık' in pg.locator('[data-taslak-metin]').inner_text())
            kontrol('yenilemede fotoğraf tekrar seçilmeli', pg.locator('[data-gorsel="kimlikOn"]').get_attribute('data-dolu') != '1')
            kayitDoldur(pg)
        pg.check('#k-kimlik-sonra'); pg.check('#k-kimlik-' + yol)
        kontrol(f'[{yol}] yükleme kutuları gizli', not pg.locator('[data-kimlik-yukleme]').is_visible())
        if yol == 'elden':
            kontrol('elden yolunda rıza gizli ve devre dışı', pg.locator('#k-kimlik-riza').is_disabled() and not pg.locator('[data-kimlik-riza]').is_visible())
        else:
            once = len(GONDERILEN); pg.click('button[type=submit]'); pg.wait_for_timeout(500)
            kontrol(f'[{yol}] rızasız gönderim engellenir', len(GONDERILEN) == once and pg.locator('#k-kimlik-riza').get_attribute('aria-invalid') == 'true')
            pg.check('#k-kimlik-riza')
        pg.wait_for_timeout(500)
        kontrol(f'[{yol}] ilerleme 100 ve eksik yok', pg.locator('#k-ilerleme [role=progressbar]').get_attribute('aria-valuenow') == '100' and pg.locator('[data-eksikler] li').count() == 0)
        if yol == 'elden':
            for genislik in (360, 390, 768, 1280):
                pg.set_viewport_size({'width': genislik, 'height': 900})
                pg.evaluate('window.scrollTo(0, 0)')
                ekran(pg, f'{OUT}/kayit-v3-{genislik}.png')
                kontrol(f'{genislik}px yatay taşma yok', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            pg.set_viewport_size({'width': 390, 'height': 844})
            pg.evaluate("document.documentElement.dataset.theme='dark'")
            ekran(pg, f'{OUT}/kayit-v3-karanlik-390.png')
            pg.evaluate("document.documentElement.dataset.theme='light'")
            pg.locator('#k-ilerleme a[href="#b-veli"]').click(); pg.wait_for_timeout(650)
            kontrol('ray alan odağını örtmez', pg.evaluate("document.activeElement.getBoundingClientRect().top >= document.querySelector('#k-ilerleme').getBoundingClientRect().bottom"))
            pg.locator('#k-kurallar-kutu').evaluate('(e) => { e.style.maxHeight="none"; e.style.height="2000px"; }')
            pg.wait_for_timeout(150)
            pg.locator('#k-kurallar-kutu').evaluate('(e) => { e.style.height="120px"; }')
            pg.wait_for_timeout(150)
            kontrol('boyut değişiminde yeniden taşan kurallar onayı kilitlenir', pg.locator('#k-onay-kurallar').is_disabled() and not pg.is_checked('#k-onay-kurallar'))
            pg.locator('#k-kurallar-kutu').evaluate('(e) => { e.style.height=""; e.style.maxHeight=""; }')
            pg.wait_for_timeout(150)
            pg.locator('#k-kurallar-kutu').evaluate('(e) => { e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event("scroll")); }')
            pg.check('#k-onay-kurallar')
        KOPYA_GITTI = yol != 'eposta'
        pg.click('button[type=submit]'); pg.wait_for_selector('[data-basari]:not([hidden])')
        g = GONDERILEN[-1]
        kontrol(f'[{yol}] v3 gövdesinde yol doğru, görseller boş', g['formSurumu'] == 3 and g['kimlik'] == {'yol': yol, 'on': '', 'arka': ''} and g['onay']['kimlikRiza'] == (yol != 'elden'))
        if yol == 'whatsapp':
            link = pg.locator('[data-kimlik-baglanti]')
            kontrol('WhatsApp başarı bağlantısı referansı taşır, numara metinde yok', link.get_attribute('href').startswith('https://wa.me/') and 'UC-2026-9999' in link.get_attribute('href') and '471' not in link.inner_text())
        if yol == 'eposta':
            kontrol('PDF kopyası gönderilemedi mesajı dürüst', 'gönderilemedi' in pg.locator('[data-eposta-metin]').inner_text())
            kontrol('e-posta bağlantısı referansı taşır', 'UC-2026-9999' in pg.locator('[data-kimlik-baglanti]').get_attribute('href'))
        ekran(pg, f'{OUT}/kayit-v3-basari-{yol}.png')
        kontrol(f'[{yol}] konsol hatası yok', not konsol)
        ctx.close()
    KOPYA_GITTI = True

    # Normal hareket, geç biten görsel ve sunucu hatasından aynı anahtarla yeniden deneme.
    ctx = tarayici.new_context(viewport={'width': 390, 'height': 844}, locale='tr-BE', service_workers='block')
    agi_yalit(ctx); pg = ctx.new_page(); konsol = []
    pg.on('pageerror', lambda e: konsol.append(str(e)))
    pg.add_init_script("""const coz = window.createImageBitmap.bind(window); window.createImageBitmap = async (f, o) => {
        const b = await coz(f, o); if (f.name === 'bekleyen.png') await new Promise(r => window.gorseliBitir = r); return b; };""")
    pg.route('**/macros/**', taklit); pg.goto(KOK + '/kayit/', wait_until='networkidle')
    kayitDoldur(pg)
    pg.set_input_files('#k-g-kimlik-on', onYol); pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]')
    pg.set_input_files('#k-g-kimlik-on', {'name':'bekleyen.png','mimeType':'image/png','buffer':Path(onYol).read_bytes()})
    pg.wait_for_function("typeof window.gorseliBitir === 'function'")
    pg.check('#k-kimlik-sonra'); pg.check('#k-kimlik-elden'); pg.evaluate('window.gorseliBitir()'); pg.wait_for_timeout(150)
    pg.check('#k-kimlik-simdi')
    kontrol('geç biten fotoğraf yol değişiminden sonra geri gelmez', pg.locator('[data-gorsel="kimlikOn"]').get_attribute('data-dolu') != '1')
    pg.set_input_files('#k-g-kimlik-on', onYol); pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]')
    pg.locator('[data-gorsel="kimlikOn"] [data-kaldir]').click()
    kontrol('fotoğraf kaldırma önizlemeyi ve belleği temizler', not pg.locator('[data-gorsel="kimlikOn"] img').is_visible() and pg.input_value('#k-kimlik-on') == '')
    buyuk = testPng(f'{OUT}/test-kayit-buyuk.png', 2400, 1800, (180, 190, 200))
    pg.set_input_files('#k-g-kimlik-on', buyuk); pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]')
    kontrol('büyük görsel 1600 piksele küçülür', pg.locator('[data-gorsel="kimlikOn"] img').evaluate('(e) => Math.max(e.naturalWidth,e.naturalHeight)') == 1600)
    kontrol('kimlik data URL hiçbir DOM alanına yazılmaz', pg.locator('form[data-form=kayit]').evaluate("e => !e.outerHTML.includes('data:image')"))
    pg.check('#k-kimlik-riza')
    def hataTaklit(route, request):
        if request.method == 'POST': GONDERILEN.append(json.loads(request.post_data))
        route.fulfill(status=200, content_type='application/json', body='{"ok":false,"hata":"test-gecici"}')
    pg.route('**/macros/**', hataTaklit); pg.click('button[type=submit]')
    pg.wait_for_function("document.querySelector('[data-mesaj]').textContent.includes('test-gecici')")
    oncekiAnahtar = GONDERILEN[-1]['gonderimAnahtari']
    kontrol('gönderim hatasında kayıtlı taslak güvencesi', 'Taslağınız kayıtlı' in pg.locator('[data-mesaj]').inner_text() and pg.locator('button[type=submit]').is_enabled())
    pg.unroute('**/macros/**', hataTaklit); pg.click('button[type=submit]'); pg.wait_for_selector('[data-basari]:not([hidden])')
    kontrol('yeniden deneme aynı gönderim anahtarını kullanır', GONDERILEN[-1]['gonderimAnahtari'] == oncekiAnahtar)
    kontrol('normal harekette konfeti başlar', pg.locator('.k-konfeti').count() == 1)
    pg.wait_for_timeout(600)
    kontrol('başarı işareti yapışkan başlığın altında görünür', pg.evaluate("document.querySelector('.k-buyuk-onay').getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().bottom"))
    pg.wait_for_timeout(2150)
    kontrol('konfeti iki saniyede kaldırılır', pg.locator('.k-konfeti').count() == 0)
    ctx.grant_permissions(['clipboard-read','clipboard-write'])
    pg.click('[data-ref-kopyala]')
    kontrol('referans kopyalanır', pg.evaluate('navigator.clipboard.readText()') == 'UC-2026-9999')
    ekran(pg, f'{OUT}/kayit-v3-basari.png')
    kontrol('normal hareket konsol hatası yok', not konsol)
    ctx.close()

    for dil in ('fr', 'en'):
        ctx = tarayici.new_context(viewport={'width': 360, 'height': 800}, locale=dil, service_workers='block', reduced_motion='reduce')
        agi_yalit(ctx); pg = ctx.new_page(); konsol = []
        pg.on('pageerror', lambda e: konsol.append(str(e)))
        pg.route('**/macros/**', taklit); pg.goto(KOK + '/kayit/' + dil + '/', wait_until='networkidle')
        kayitDoldur(pg)
        kontrol(f'{dil}: sekiz bölüm ve dil anahtarları', pg.locator('.ucf-bolum').count() == 8 and len(pg.locator('#h-kimlik').inner_text()) > 8)
        if dil == 'en':
            kontrol('EN iletişim dili açıklaması ve yalnız TR/FR seçenekleri', 'E-mails are sent in Turkish or French' in pg.locator('#b-veli').inner_text() and pg.locator('[name="veli.iletisimDili"]').count() == 2)
        pg.fill('#k-dogum', '2025-01-01'); pg.locator('#k-ad').focus()
        kontrol(f'{dil}: uygun olmayan yaş reddedilir', pg.locator('#k-dogum').get_attribute('aria-invalid') == 'true')
        pg.fill('#k-dogum', '2017-03-15')
        kontrol(f'{dil}: hata yazarken anında temizlenir', pg.locator('#k-dogum').get_attribute('aria-invalid') is None)
        pg.set_input_files('#k-g-kimlik-on', onYol); pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]')
        pg.set_input_files('#k-g-kimlik-arka', onYol); pg.wait_for_selector('[data-gorsel="kimlikArka"][data-dolu="1"]')
        kontrol(f'{dil}: iki görsel özette görünür', '+' in pg.locator('[data-ozet-alan="kimlik"]').inner_text())
        pg.check('#k-kimlik-riza'); pg.wait_for_timeout(500)
        kontrol(f'{dil}: 100 ilerleme ve yatay taşma yok', pg.locator('#k-ilerleme [role=progressbar]').get_attribute('aria-valuenow') == '100' and pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        ekran(pg, f'{OUT}/kayit-v3-{dil}-360.png')
        pg.click('button[type=submit]'); pg.wait_for_selector('[data-basari]:not([hidden])')
        kontrol(f'{dil}: iki JPEG ve iletişim dili korunur', GONDERILEN[-1]['dil'] == dil and GONDERILEN[-1]['veli']['iletisimDili'] == 'fr' and GONDERILEN[-1]['kimlik']['arka'].startswith('data:image/jpeg;base64,'))
        kontrol(f'{dil}: azaltılmış harekette konfeti ve animasyon yok', pg.locator('.k-konfeti').count() == 0 and pg.evaluate("document.querySelector('.k-basari').getAnimations({subtree:true}).length === 0"))
        kontrol(f'{dil}: konsol hatası yok', not konsol)
        ctx.close()

    # Fransızca sayfa ve ihtida
    ctx = tarayici.new_context(viewport={"width": 390, "height": 844}, locale="fr-BE", service_workers="block", reduced_motion='reduce')
    agi_yalit(ctx)
    pg = ctx.new_page(); konsol = []
    pg.on("pageerror", lambda e: konsol.append(str(e)))
    pg.route("**/macros/**", taklit)
    pg.goto(KOK + "/tr/", wait_until="networkidle"); pg.wait_for_timeout(500)
    print("  ana sayfa pageerror:", konsol); konsol.clear()
    pg.goto(KOK + "/kayit/fr/", wait_until="networkidle")
    kontrol("FR kayıt sayfası Fransızca", "Inscription" in pg.title() or "inscription" in pg.content().lower())
    pg.goto(KOK + "/tr/ihtida-basvurusu/", wait_until="networkidle")
    pg.click('[data-adim-tumu]')  # ihtidanın mevcut tam-form görünümünü kullan
    pg.screenshot(path=f"{OUT}/ihtida-mobil.png", full_page=True)
    pg.click("button[type=submit]"); pg.wait_for_timeout(1500)
    kontrol("ihtida boş gönderim hataları", pg.locator(".hata:not([hidden])").count() >= 10)
    pg.fill("#i-ad", "Jean Testoglu"); pg.check("#i-cins-erkek"); pg.fill("#i-dogum", "1990-05-20"); pg.fill("#i-dogum-yeri", "Namur, Belçika")
    pg.fill("#i-uyruk", "Belçika"); pg.fill("#i-anne", "Marie"); pg.fill("#i-baba", "Pierre"); pg.select_option("#i-medeni", "bekar")
    pg.fill("#i-ogrenim", "Lisans"); pg.fill("#i-meslek", "Öğretmen"); pg.fill("#i-eposta", "jean@example.test"); pg.fill("#i-telefon", "+32 471 00 00 00")
    pg.fill("#i-adres", "Rue Haute 3"); pg.fill("#i-posta-kodu", "6900"); pg.fill("#i-sehir", "Marche-en-Famenne"); pg.fill("#i-ulke", "Belçika"); pg.fill("#i-onceki-din", "Katolik"); pg.select_option("#i-toren-dili", "fr")
    pg.check("#i-onay-riza"); pg.check("#i-onay-ek10"); pg.check("#i-onay-gizlilik"); pg.check("#i-onay-gorsel")
    pg.fill("#i-beyan", "JEAN TESTOGLU")

    # --- 5. bölüm: belgeler ve imza (8 Eylül 2026) ---------------------------------
    vesikalikYol = testPng(f"{OUT}/test-vesikalik.png", 300, 400, (200, 170, 140))
    onYol = testPng(f"{OUT}/test-kimlik-on.png", 640, 400, (150, 180, 210))
    arkaYol = testPng(f"{OUT}/test-kimlik-arka.png", 640, 400, (180, 200, 150))
    kontrol("kimlik arka yüzü kimlik kartında görünür", pg.locator('[data-gorsel="kimlikArka"]').is_visible())
    pg.check("#i-belge-pasaport"); pg.wait_for_timeout(200)
    kontrol("pasaportta arka yüz gizlenir", not pg.locator('[data-gorsel="kimlikArka"]').is_visible())
    pg.check("#i-belge-kimlik"); pg.wait_for_timeout(200)

    pg.set_input_files("#i-g-vesikalik", vesikalikYol)
    pg.wait_for_selector('[data-gorsel="vesikalik"][data-dolu="1"]', timeout=8000)
    pg.set_input_files("#i-g-kimlik-on", onYol)
    pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]', timeout=8000)
    pg.set_input_files("#i-g-kimlik-arka", arkaYol)
    pg.wait_for_selector('[data-gorsel="kimlikArka"][data-dolu="1"]', timeout=8000)
    kontrol("önizleme görünür", pg.locator('[data-gorsel="vesikalik"] img[data-onizleme]').is_visible())

    # İmzasız gönderim reddedilmeli
    pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
    kontrol("imzasız gönderim engellendi", pg.locator("[data-basari]").get_attribute("hidden") is not None
            and pg.locator('[data-imza] .hata:not([hidden])').count() == 1)
    imzaCiz(pg, "[data-imza] canvas")
    pg.check('#i-onay-imza')
    pg.wait_for_timeout(200)

    taslakHam = pg.evaluate("() => localStorage.getItem('ulucamii:ihtida:v2') || ''")
    kontrol("görseller taslağa yazılmaz", "data:image" not in taslakHam and len(taslakHam) < 4000)
    ozetBelge = pg.locator('[data-ozet-alan="belgeler"] [data-ozet-deger]').inner_text()
    kontrol("özette belgeler satırı dolu", "fotoğraf" in ozetBelge.lower() and "İmza" in ozetBelge)

    pg.click("button[type=submit]")
    pg.wait_for_selector("[data-basari]:not([hidden])", timeout=15000)
    g = GONDERILEN[-1]
    kontrol("ihtida gövde", g.get("tur") == "ihtida" and g["basvuran"]["adSoyad"] == "Jean Testoglu" and g["sahitler"] == [] and g["sahitSecimi"] == "cami" and g["onay"]["acikRiza"] is True)
    kontrol("ihtida formSurumu 2 olarak korunur", g.get("formSurumu") == 2)
    kontrol("ihtida gövdesinde kimlik NUMARASI yok", not any(k in json.dumps(g) for k in ("tcKimlik", "ulusalNo", "kimlikNo", "rijksregister")))
    gors = g.get("gorseller") or {}
    kontrol("vesikalık gönderildi", gors.get("vesikalik", "").startswith("data:image/jpeg;base64,") and len(gors["vesikalik"]) > 500)
    kontrol("kimlik ön yüzü gönderildi", gors.get("kimlikOn", "").startswith("data:image/jpeg;base64,"))
    kontrol("kimlik arka yüzü gönderildi", gors.get("kimlikArka", "").startswith("data:image/jpeg;base64,"))
    kontrol("imza PNG olarak gönderildi", gors.get("imza", "").startswith("data:image/png;base64,") and len(gors["imza"]) > 500)
    kontrol("belge türü ve imza bayrağı", g.get("belgeTuru") == "kimlik" and g.get("imzaYok") is False)
    kontrol("görsel açık rızası", g["onay"].get("gorselRiza") is True)
    kontrol("ihtida konsol temiz", not konsol)
    pg.screenshot(path=f"{OUT}/ihtida-mobil-basari.png", full_page=True)
    # EK-9 zincirinin sonraki halkası bu gövdeyi kullanır: scripts/ek9-imza-zinciri.mjs
    with open(f"{OUT}/ihtida-govde.json", "w", encoding="utf-8") as f:
        json.dump(g, f, ensure_ascii=False)

    # --- İmza atamayanlar için kaçış kapısı + pasaport yolu ------------------------
    pg.goto(KOK + "/tr/ihtida-basvurusu/", wait_until="networkidle")
    pg.evaluate("() => localStorage.removeItem('ulucamii:ihtida:v2')")
    pg.reload(wait_until="networkidle")
    pg.click('[data-adim-tumu]')
    pg.fill("#i-ad", "Anna Testoglu"); pg.check("#i-cins-kadin"); pg.fill("#i-dogum", "1988-03-02"); pg.fill("#i-dogum-yeri", "Liège, Belçika")
    pg.fill("#i-uyruk", "Belçika"); pg.fill("#i-anne", "Sofie"); pg.fill("#i-baba", "Luc"); pg.select_option("#i-medeni", "evli")
    pg.fill("#i-ogrenim", "Lise"); pg.fill("#i-meslek", "Hemşire"); pg.fill("#i-eposta", "anna@example.test"); pg.fill("#i-telefon", "+32 471 00 00 01")
    pg.fill("#i-adres", "Rue Basse 1"); pg.fill("#i-posta-kodu", "6900"); pg.fill("#i-sehir", "Marche-en-Famenne"); pg.fill("#i-ulke", "Belçika"); pg.fill("#i-onceki-din", "Protestan"); pg.select_option("#i-toren-dili", "fr")
    pg.check("#i-belge-pasaport")
    pg.set_input_files("#i-g-vesikalik", vesikalikYol); pg.wait_for_selector('[data-gorsel="vesikalik"][data-dolu="1"]', timeout=8000)
    pg.set_input_files("#i-g-kimlik-on", onYol); pg.wait_for_selector('[data-gorsel="kimlikOn"][data-dolu="1"]', timeout=8000)
    pg.check("#i-imza-yok")
    pg.check("#i-onay-riza"); pg.check("#i-onay-ek10"); pg.check("#i-onay-gizlilik"); pg.check("#i-onay-gorsel")
    pg.fill("#i-beyan", "ANNA TESTOGLU")
    pg.click("button[type=submit]")
    pg.wait_for_selector("[data-basari]:not([hidden])", timeout=15000)
    g2 = GONDERILEN[-1]
    kontrol("pasaportta arka yüz boş gider", (g2.get("gorseller") or {}).get("kimlikArka") == "")
    kontrol("imzaYok işaretliyken imza boş", g2.get("imzaYok") is True and (g2.get("gorseller") or {}).get("imza") == "")
    kontrol("imzaYok akışı konsol temiz", not konsol)
    ctx.close(); tarayici.close()

basarisiz = [a for a, b in sonuclar if not b]
print(f"\nTOPLAM {len(sonuclar)} kontrol, başarısız {len(basarisiz)}: {basarisiz}")
sys.exit(1 if basarisiz else 0)
