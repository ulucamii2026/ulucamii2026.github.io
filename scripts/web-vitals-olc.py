# -*- coding: utf-8 -*-
"""
Sayfa hız ölçümü — yavaş telefon benzetimi (4x kısık CPU, 1,6 Mbit, 150 ms gecikme).
LCP, CLS (kayan öğelerle birlikte), DOM hazır/yük süreleri ve kaynak ağırlığını türe göre basar.

4 Eylül 2026'daki ana sayfa çalışmasının ölçüm aracı: başlangıçta LCP 5,1 sn / 1370 KB idi;
hero görsellerinin AVIF'e geçirilmesi, namaz verisi penceresinin daraltılması ve Arapça yazı
tipinin alt kümelenmesiyle LCP ~1 sn / 680 KB'a indi. Değişiklikten sonra yeniden çalıştırın.

Kullanım:
    py -3.14 scripts/web-vitals-olc.py http://localhost:4399/tr/     (yerel derleme)
    py -3.14 scripts/web-vitals-olc.py https://ulucamii.be/tr/       (canlı)
"""
import sys, json
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

URL = sys.argv[1] if len(sys.argv) > 1 else "https://ulucamii.be/tr/"

JS = """
() => new Promise((cz) => {
  const s = { lcp: 0, cls: 0, lcpEl: '' };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { s.lcp = e.startTime; s.lcpEl = (e.element && (e.element.tagName + '.' + (e.element.className||'').toString().slice(0,60))) || ''; } })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    s.kaynaklar = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) {
      s.cls += e.value;
      for (const k of (e.sources || [])) {
        const n = k.node;
        s.kaynaklar.push({ p: e.value.toFixed(4), el: n ? (n.tagName || n.nodeName) + '.' + String(n.className || '').slice(0, 70) : '?' });
      }
    } }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
  setTimeout(() => cz(s), 6000);
})
"""

with sync_playwright() as p:
    tr = p.chromium.launch(headless=True, args=["--enable-precise-memory-info"])
    ctx = tr.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                         user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36")
    pg = ctx.new_page()
    kaynaklar = []
    pg.on("response", lambda r: kaynaklar.append((r.url, r.request.resource_type)))
    cdp = ctx.new_cdp_session(pg)
    cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 150,
             "downloadThroughput": int(1.6 * 1024 * 1024 / 8), "uploadThroughput": int(750 * 1024 / 8)})
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    pg.goto(URL, wait_until="load", timeout=90000)
    v = pg.evaluate(JS)
    print("LCP  : %.0f ms  (%s)" % (v["lcp"], v["lcpEl"]), flush=True)
    print("CLS  : %.4f" % v["cls"], flush=True)
    for k in (v.get("kaynaklar") or [])[:8]:
        print("   kayma %s → %s" % (k["p"], k["el"]), flush=True)
    nav = pg.evaluate("() => { const n = performance.getEntriesByType('navigation')[0]; return n ? {dcl:n.domContentLoadedEventEnd, load:n.loadEventEnd} : null; }")
    print("DCL  : %.0f ms · load: %.0f ms" % (nav["dcl"], nav["load"]), flush=True)
    boyut = pg.evaluate("""() => {
      const r = performance.getEntriesByType('resource');
      const grup = {};
      let toplam = 0;
      for (const x of r) { const t = x.initiatorType === 'css' || /\\.woff2?$/.test(x.name) ? 'font/css' : x.initiatorType;
        grup[t] = (grup[t]||0) + (x.transferSize||0); toplam += x.transferSize||0; }
      return { grup, toplam, adet: r.length };
    }""")
    print("Kaynak sayisi: %d · toplam transfer: %.0f KB" % (boyut["adet"], boyut["toplam"] / 1024), flush=True)
    for k, v2 in sorted(boyut["grup"].items(), key=lambda x: -x[1]):
        print("   %-12s %7.0f KB" % (k, v2 / 1024), flush=True)
    ctx.close(); tr.close()
