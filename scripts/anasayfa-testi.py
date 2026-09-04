# -*- coding: utf-8 -*-
"""
Ana sayfa etkileşim ve erişilebilirlik denetimi — 4 Eylül 2026'da eklenen davranışların
gerilemesini yakalamak için. Otomatik testtir, çıkış kodu 0 = hepsi geçti.

Denetlenenler:
  · WCAG 2.2.2 (Pause, Stop, Hide) — duraklat düğmesi hem hero slaydını hem duyuru şeridini
    gerçekten durduruyor mu, tercih yeniden yüklemede korunuyor mu
  · prefers-reduced-motion: reduce diyen ziyaretçide otomatik hareketin VARSAYILAN olarak durması
  · WCAG 2.5.8 — 24x24 px altında dokunma hedefi kalmaması (sr-only atlama bağlantısı muaf)
  · yatay taşma olmaması (360-390 px)
  · başlık hiyerarşisi: tek h1, düzey atlaması yok

Kullanım (önce `npx astro build`, sonra ayrı bir kabukta `npx astro preview --port 4399`):
    py -3.14 scripts/anasayfa-testi.py [http://localhost:4399/tr/]
"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4399/tr/"
gecti, kaldi = [], []
def kontrol(ad, kosul, ek=""):
    (gecti if kosul else kaldi).append(ad + (f" ({ek})" if ek else ""))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)

    # 1) Varsayılan: hareket açık, düğme "durdur" durumunda
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="tr-TR")
    pg = ctx.new_page(); pg.goto(URL, wait_until="load"); pg.wait_for_timeout(1200)
    kontrol("varsayılan hareket açık", pg.evaluate("document.documentElement.dataset.hareket") == "acik")
    d = pg.locator("#hero-duraklat")
    kontrol("duraklat düğmesi var", d.count() == 1)
    kontrol("aria-pressed=false", d.get_attribute("aria-pressed") == "false")

    # 2) Slayt kendiliğinden ilerliyor mu (8 sn tempo)
    ilk = pg.evaluate("document.querySelector('#hero-slayt .hero-kare.aktif')?.dataset.slayt")
    pg.wait_for_timeout(9500)
    ikinci = pg.evaluate("document.querySelector('#hero-slayt .hero-kare.aktif')?.dataset.slayt")
    kontrol("slayt otomatik ilerliyor", ilk != ikinci, f"{ilk} → {ikinci}")

    # 3) Duraklat → hem slayt hem şerit durmalı
    d.click(); pg.wait_for_timeout(400)
    kontrol("duraklat sonrası aria-pressed=true", d.get_attribute("aria-pressed") == "true")
    kontrol("kök öğe durdu", pg.evaluate("document.documentElement.dataset.hareket") == "durdu")
    kare0 = pg.evaluate("document.querySelector('#hero-slayt .hero-kare.aktif')?.dataset.slayt")
    mesaj0 = pg.evaluate("document.querySelector('#duyuru-seridi .serit-mesaj.aktif')?.dataset.mesaj")
    pg.wait_for_timeout(11000)
    kare1 = pg.evaluate("document.querySelector('#hero-slayt .hero-kare.aktif')?.dataset.slayt")
    mesaj1 = pg.evaluate("document.querySelector('#duyuru-seridi .serit-mesaj.aktif')?.dataset.mesaj")
    kontrol("duraklatınca slayt durdu", kare0 == kare1, f"{kare0} = {kare1}")
    kontrol("duraklatınca şerit durdu", mesaj0 == mesaj1, f"{mesaj0} = {mesaj1}")

    # 4) Tercih kalıcı mı
    pg.reload(wait_until="load"); pg.wait_for_timeout(900)
    kontrol("tercih yeniden yüklemede korunuyor", pg.evaluate("document.documentElement.dataset.hareket") == "durdu")
    ctx.close()

    # 5) prefers-reduced-motion: varsayılan DURMUŞ olmalı
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce", locale="tr-TR")
    pg = ctx.new_page(); pg.goto(URL, wait_until="load"); pg.wait_for_timeout(900)
    kontrol("hareket-azalt varsayılanı durmuş", pg.evaluate("document.documentElement.dataset.hareket") == "durdu")
    ctx.close()

    # 6) Dokunma hedefleri ve odak — mobil
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="tr-TR")
    pg = ctx.new_page(); pg.goto(URL, wait_until="load"); pg.wait_for_timeout(1200)
    kucuk = pg.evaluate("""() => {
      const kotu = [];
      for (const el of document.querySelectorAll('a[href], button')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (el.matches('.sr-only')) continue; // atlama bağlantısı: odaklanınca büyür
        if (r.width < 24 || r.height < 24) kotu.push((el.tagName + '.' + String(el.className || '').slice(0, 40)) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      return kotu.slice(0, 10);
    }""")
    kontrol("24x24 altı dokunma hedefi yok", len(kucuk) == 0, "; ".join(kucuk))
    # yatay taşma
    tasma = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    kontrol("yatay taşma yok", tasma <= 0, f"{tasma}px")
    # başlık hiyerarşisi
    basliklar = pg.evaluate("[...document.querySelectorAll('h1,h2,h3,h4')].map(h => h.tagName)")
    atlama = [f"{basliklar[i]}→{basliklar[i+1]}" for i in range(len(basliklar) - 1)
              if int(basliklar[i+1][1]) - int(basliklar[i][1]) > 1]
    kontrol("başlık düzeyi atlaması yok", len(atlama) == 0, ", ".join(atlama))
    kontrol("tek h1", basliklar.count("H1") == 1, str(basliklar.count("H1")))
    ctx.close()
    b.close()

for g in gecti: print("  ✓", g)
for k in kaldi: print("  ✗", k)
print(f"\n{len(gecti)} geçti, {len(kaldi)} kaldı")
sys.exit(1 if kaldi else 0)
