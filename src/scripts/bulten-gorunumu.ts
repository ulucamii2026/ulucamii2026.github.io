import type { Dil } from "../i18n/ui";
import { bultenMetni } from "../i18n/bulten";
import { bultenDeposu, type Bulten } from "../lib/haftalik-bulten";
import type { Firestore } from "firebase/firestore/lite";

export const bultenEsc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function bultenIcerik(b: Bulten, ad: string, dil: Dil) {
  const m = bultenMetni(dil),
    e = bultenEsc;
  return `<article class="bulten-sayfa" lang="${e(b.dil)}"><header><p class="bulten-kurum">Ulu Camii · Marche-en-Famenne</p><h3>${e(ad)}</h3><p>${e(m.hafta)} ${b.hafta} · ${e(b.tarih)} · ${e(m.surum)} ${b.surum}${!b.yayin ? " · " + e(m.taslak) : ""}</p>${b.dil !== dil ? `<p lang="${dil}">${e(m.dil)}: ${e(bultenMetni(b.dil).dilAdi)}</p>` : ""}</header>${(["ders", "odev", "getir", "not"] as const).map((k) => `<section><h4 lang="${dil}">${e(m[k])}</h4><p>${e(b.metin[k] || m.bos)}</p></section>`).join("")}<footer><p>${e(m.aileNot)}</p><div class="bulten-yazi-alani"></div><p>${e(m.imza)}</p><div class="bulten-imza-alani"></div></footer></article>`;
}
/**
 * Yazdırma: sayfa içi yazdırma alanı (CSP: srcdoc/document.write + <style> engellenir).
 * Alan yalnız yazdırırken görünür, sayfanın geri kalanı gizlenir; kurallar src/styles/baski.css'tedir
 * (`@media print`, sınıf `baski-<ad>`). Yazdırma bitince (afterprint) alan ve başlık geri alınır.
 */
export function baskiAlaniYazdir(sinif: string, icerikHtml: string, dil: string, baslik: string) {
  document.querySelectorAll(".baski-alani").forEach((x) => x.remove());
  const kab = document.createElement("div");
  kab.className = `baski-alani ${sinif}`;
  kab.lang = dil;
  kab.innerHTML = icerikHtml;
  document.body.appendChild(kab);
  const eskiBaslik = document.title;
  document.title = baslik;
  document.documentElement.classList.add("baski-modu");
  let bitti = false;
  const bitir = () => {
    if (bitti) return;
    bitti = true;
    window.removeEventListener("afterprint", bitir);
    document.documentElement.classList.remove("baski-modu");
    document.title = eskiBaslik;
    kab.remove();
  };
  window.addEventListener("afterprint", bitir);
  window.setTimeout(bitir, 300000);
  window.print();
}
export function bultenYazdir(b: Bulten, ad: string, dil: Dil) {
  const m = bultenMetni(dil);
  baskiAlaniYazdir(
    "baski-bulten",
    `<h1>${bultenEsc(m.baslik)}</h1>${bultenIcerik(b, ad, dil)}<p class="dip">${bultenEsc(m.imzaAciklama)}</p>`,
    dil,
    `${m.baslik} — ${ad}`,
  );
}
export function veliBulteni(
  root: HTMLElement,
  opts: { db: Firestore; ref: string; eposta: string; ad: string; dil: Dil },
): () => void {
  const m = bultenMetni(opts.dil),
    e = bultenEsc,
    depo = bultenDeposu(opts.db, opts.ref),
    ac = new AbortController();
  let kapali = false,
    istek = 0,
    kayitlar: Bulten[] = [],
    secili = "",
    okundu = false,
    mesaj = "",
    mesgul = false;
  const ciz = () => {
    if (kapali) return;
    const b = kayitlar.find((x) => x.id === secili);
    root.innerHTML = `<h2>${e(m.baslik)}</h2><p>${e(m.aciklama)}</p>${kayitlar.length ? `<label>${e(m.hafta)}<select data-bulten-hafta>${kayitlar.map((x) => `<option value="${e(x.id)}" ${x.id === secili ? "selected" : ""}>${e(x.tarih)} · ${x.hafta}</option>`).join("")}</select></label>` : ""}<p role="status" data-bulten-durum>${e(mesaj)}</p>${b ? `${bultenIcerik(b, opts.ad, opts.dil)}<p class="bulten-aciklama">${e(m.imzaAciklama)}</p><div class="bulten-eylemler"><button type="button" data-bulten-yazdir>${e(m.yazdir)}</button><button type="button" data-bulten-oku ${mesgul || okundu ? "disabled" : ""}>${e(mesgul ? m.kaydediliyor : okundu ? m.okundu : m.okudum)}</button></div>` : !mesaj ? `<p>${e(m.yok)}</p>` : ""}<button type="button" class="bulten-yenile" data-bulten-yenile ${mesgul ? "disabled" : ""}>${e(m.yeniden)}</button>`;
  };
  const okumaYukle = async (token: number) => {
    const b = kayitlar.find((x) => x.id === secili);
    okundu = false;
    if (!b) return;
    const r = await depo.okuma(b.id, opts.eposta);
    if (token !== istek || kapali) return;
    okundu = r?.surum === b.surum;
  };
  const yukle = async () => {
    const token = ++istek;
    mesaj = m.yukle;
    ciz();
    try {
      const liste = await depo.liste();
      if (token !== istek || kapali) return;
      kayitlar = liste;
      secili = liste.some((x) => x.id === secili) ? secili : liste[0]?.id || "";
      await okumaYukle(token);
      if (token !== istek || kapali) return;
      mesaj = "";
    } catch {
      if (token !== istek || kapali) return;
      mesaj = m.hata;
    }
    ciz();
  };
  root.addEventListener(
    "change",
    async (ev) => {
      if (!(ev.target as HTMLElement).matches("[data-bulten-hafta]")) return;
      secili = (ev.target as HTMLSelectElement).value;
      const token = ++istek;
      mesgul = true;
      mesaj = "";
      okundu = false;
      ciz();
      try {
        await okumaYukle(token);
      } catch {
        if (token === istek) mesaj = m.hata;
      } finally {
        if (token === istek) {
          mesgul = false;
          ciz();
          root.querySelector<HTMLElement>("[data-bulten-hafta]")?.focus();
        }
      }
    },
    { signal: ac.signal },
  );
  root.addEventListener(
    "click",
    async (ev) => {
      const t = (ev.target as HTMLElement).closest("button");
      if (!t || mesgul) return;
      if (t.hasAttribute("data-bulten-yenile")) {
        await yukle();
        return;
      }
      const b = kayitlar.find((x) => x.id === secili);
      if (!b) return;
      if (t.hasAttribute("data-bulten-yazdir")) {
        bultenYazdir(b, opts.ad, opts.dil);
        return;
      }
      if (t.hasAttribute("data-bulten-oku")) {
        const token = ++istek;
        mesgul = true;
        mesaj = "";
        ciz();
        try {
          await depo.okudum(b, opts.eposta);
          if (token === istek) {
            okundu = true;
            mesaj = m.okundu;
          }
        } catch (err) {
          if (token === istek)
            mesaj =
              (err as Error).message === "BULTEN_DEGISTI"
                ? m.degisti
                : m.kayitHata;
        } finally {
          if (token === istek) {
            mesgul = false;
            ciz();
            root.querySelector<HTMLElement>("[data-bulten-yenile]")?.focus();
          }
        }
      }
    },
    { signal: ac.signal },
  );
  void yukle();
  return () => {
    kapali = true;
    istek++;
    ac.abort();
  };
}
