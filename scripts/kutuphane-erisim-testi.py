# -*- coding: utf-8 -*-
"""Fransızca kaynak zinciri: ihtida sayfası → dile göre derin bağlantı → kütüphane →
   PDF okuma / EPUB indirme. İndirme GERÇEKTEN oluyor mu, Playwright'ın download olayıyla ölçülür."""
import sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright
KOK = "http://localhost:4399"
sonuc = []
def k(ad, kosul, ek=''):
    sonuc.append(bool(kosul)); print(("OK   " if kosul else "HATA ") + ad + (('  ' + str(ek)) if ek else ''))

with sync_playwright() as p:
    t = p.chromium.launch()
    ctx = t.new_context(viewport={"width": 1280, "height": 900}, locale="fr-BE", accept_downloads=True)
    pg = ctx.new_page()
    pg.goto(KOK + "/fr/conversion-a-l-islam/", wait_until="networkidle")

    dugme = pg.locator("#diyanet-kutuphanesi .bant-eylem a").first
    metin = dugme.inner_text()
    k("ihtida bandında dile özel düğme", "français" in metin, metin)
    k("düğme sayıyı veriden alıyor", re.search(r"\((\d+)\)", metin) and int(re.search(r"\((\d+)\)", metin).group(1)) == 37, metin)
    hedef = dugme.get_attribute("href")
    k("derin bağlantı dil çapası taşıyor", hedef.endswith("#kitaplik-fr"), hedef)

    # bandın kendisinde okuma/indirme düğmeleri
    ilk = pg.locator("#diyanet-kutuphanesi .kitap").first
    # DİKKAT: .kitap'ta content-visibility:auto var — görünür alana girmeden inner_text() boş döner.
    k("bantta «Lire (PDF)»", "Lire (PDF)" in ilk.locator("a.dugme-birincil").text_content())
    pdfBag = ilk.locator("a.dugme-birincil").get_attribute("href")
    k("PDF bağlantısı Diyanet sunucusunda", pdfBag.startswith("https://dijital.diyanet.gov.tr/File/Download"), pdfBag[:60])

    dugme.click()
    pg.wait_for_load_state("networkidle")
    k("kütüphane sayfası açıldı", "/fr/bibliotheque-diyanet/" in pg.url, pg.url)
    grup = pg.locator("details#kitaplik-fr")
    k("Fransızca grubu açık geldi", grup.get_attribute("open") is not None)
    k("Fransızca grupta 37 kitap", grup.locator(".kitap").count() == 37, grup.locator(".kitap").count())

    epub = grup.locator(".kitap a.dugme-ikincil").first
    k("EPUB düğmesi «Télécharger»", "Télécharger" in epub.text_content(), epub.text_content()[:40])
    epubBag = epub.get_attribute("href")
    k("EPUB bağlantısı Diyanet sunucusunda", epubBag.startswith("https://dijital.diyanet.gov.tr/File/EpubDownload"), epubBag[:60])

    # gerçek indirme denemesi (dış ağ)
    try:
        with pg.expect_download(timeout=45000) as bekle:
            pg.evaluate("(u) => { const a=document.createElement('a'); a.href=u; a.click(); }", epubBag)
        d = bekle.value
        k("EPUB gerçekten iniyor", d.suggested_filename.lower().endswith(".epub"), d.suggested_filename)
    except Exception as e:
        k("EPUB gerçekten iniyor", False, str(e)[:80])
    t.close()
print(f"\nTOPLAM {len(sonuc)} kontrol, başarısız {sonuc.count(False)}")
