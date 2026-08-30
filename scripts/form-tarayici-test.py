# -*- coding: utf-8 -*-
"""Yeni kayıt + ihtida formlarının tarayıcı testi. Önce `npx astro build && npx astro preview --port 4321`; uç nokta taklit edilir (gerçek gönderim yok). Çıktılar D:/tmp/form-test/ (klasörü oluşturun)."""
import sys, json, time, urllib.request
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

KOK = "http://localhost:4321"
OUT = r"D:/tmp/form-test"
EXEC_PARCA = "script.google.com/macros"
GONDERILEN = []

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
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True, "ref": "UC-2026-9999", "tekrar": False}))
    else:
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True}))

sonuclar = []
def kontrol(ad, kosul):
    sonuclar.append((ad, bool(kosul))); print(("OK   " if kosul else "HATA ") + ad)

with sync_playwright() as p:
    tarayici = p.chromium.launch()
    for cihaz, vp in (("masaustu", {"width": 1280, "height": 900}), ("mobil", {"width": 390, "height": 844})):
        ctx = tarayici.new_context(viewport=vp, device_scale_factor=1, locale="tr-BE")
        pg = ctx.new_page()
        konsol = []
        pg.on("console", lambda m: konsol.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: konsol.append(f"pageerror: {e}"))
        pg.route("**/macros/**", taklit)
        pg.goto(KOK + "/kayit/", wait_until="networkidle")
        pg.screenshot(path=f"{OUT}/kayit-{cihaz}.png", full_page=True)

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
        pg.fill("#k-veli-eposta", "veli@example.org"); pg.fill("#k-adres", "Rue de la Station 12"); pg.fill("#k-posta", "6900")
        pg.check("#k-saglik-evet")
        kontrol(f"[{cihaz}] sağlık notu alanı açıldı", pg.locator("#k-saglik-not").is_visible())
        pg.fill("#k-saglik-not", "Fıstık alerjisi"); pg.check("#k-saglik-riza")
        pg.check("#k-goruntu-hayir")
        kontrol(f"[{cihaz}] kurallar kutusu kaydırılmadan onay kilitli", pg.locator("#k-onay-kurallar").is_disabled())
        pg.evaluate("document.getElementById('k-kurallar-kutu').scrollTop = 99999"); pg.wait_for_timeout(200)
        kontrol(f"[{cihaz}] kaydırınca onay açıldı", pg.locator("#k-onay-kurallar").is_enabled())
        pg.check("#k-onay-kurallar"); pg.check("#k-onay-gizlilik")
        pg.fill("#k-imza", "Fatma Testoglu")   # aksansız yazım eşleşmeli
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
        kontrol(f"[{cihaz}] gövde: kimlik alanı YOK", "kimlikNo" not in json.dumps(g) and "pdfBase64" not in g and "images" not in g)
        kontrol(f"[{cihaz}] gövde boyutu küçük ({len(json.dumps(g))} B)", len(json.dumps(g)) < 3000)
        # kardeş kaydı
        with pg.expect_navigation():
            pg.click("[data-basari] a[href='?kardes=1']")
        pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(300)
        kontrol(f"[{cihaz}] kardeş kaydında veli hazır", pg.input_value("#k-veli-ad") == "Fatma Testoğlu" and pg.input_value("#k-ad") == "")
        kontrol(f"[{cihaz}] konsol temiz (goatcounter/geçiş uyarıları hariç)", not [k for k in konsol if "goatcounter" not in k and "Transition was skipped" not in k])
        if konsol: print("  konsol:", konsol[:5])
        ctx.close()

    # Fransızca sayfa ve ihtida
    ctx = tarayici.new_context(viewport={"width": 390, "height": 844}, locale="fr-BE")
    pg = ctx.new_page(); konsol = []
    pg.on("pageerror", lambda e: konsol.append(str(e)))
    pg.route("**/macros/**", taklit)
    pg.goto(KOK + "/tr/", wait_until="networkidle"); pg.wait_for_timeout(500)
    print("  ana sayfa pageerror:", konsol); konsol.clear()
    pg.goto(KOK + "/kayit/fr/", wait_until="networkidle")
    kontrol("FR kayıt sayfası Fransızca", "Inscription" in pg.title() or "inscription" in pg.content().lower())
    pg.goto(KOK + "/tr/ihtida-basvurusu/", wait_until="networkidle")
    pg.screenshot(path=f"{OUT}/ihtida-mobil.png", full_page=True)
    pg.click("button[type=submit]"); pg.wait_for_timeout(1500)
    kontrol("ihtida boş gönderim hataları", pg.locator(".hata:not([hidden])").count() >= 10)
    pg.fill("#i-ad", "Jean Testoglu"); pg.check("#i-cins-erkek"); pg.fill("#i-dogum", "1990-05-20"); pg.fill("#i-dogum-yeri", "Namur, Belçika")
    pg.fill("#i-uyruk", "Belçika"); pg.fill("#i-anne", "Marie"); pg.fill("#i-baba", "Pierre"); pg.select_option("#i-medeni", "bekar")
    pg.fill("#i-ogrenim", "Lisans"); pg.fill("#i-meslek", "Öğretmen"); pg.fill("#i-eposta", "jean@example.org"); pg.fill("#i-telefon", "+32 471 00 00 00")
    pg.fill("#i-adres", "Rue Haute 3, 6900 Marche-en-Famenne"); pg.fill("#i-onceki-din", "Katolik"); pg.select_option("#i-toren-dili", "fr")
    pg.check("#i-onay-riza"); pg.check("#i-onay-ek10"); pg.check("#i-onay-gizlilik"); pg.fill("#i-beyan", "JEAN TESTOGLU")
    pg.click("button[type=submit]")
    pg.wait_for_selector("[data-basari]:not([hidden])", timeout=8000)
    g = GONDERILEN[-1]
    kontrol("ihtida gövde", g.get("tur") == "ihtida" and g["basvuran"]["adSoyad"] == "Jean Testoglu" and g["sahitler"] == [{"ad": ""}, {"ad": ""}] and g["onay"]["acikRiza"] is True)
    kontrol("ihtida gövdesinde kimlik/görsel yok", not any(k in json.dumps(g) for k in ("tcKimlik", "ulusalNo", "belgeNo", "vesikalik", "Base64", "imza")))
    kontrol("ihtida konsol temiz", not konsol)
    pg.screenshot(path=f"{OUT}/ihtida-mobil-basari.png", full_page=True)
    ctx.close(); tarayici.close()

basarisiz = [a for a, b in sonuclar if not b]
print(f"\nTOPLAM {len(sonuclar)} kontrol, başarısız {len(basarisiz)}: {basarisiz}")
