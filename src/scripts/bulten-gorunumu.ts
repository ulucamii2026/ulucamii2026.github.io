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
export function bultenYazdir(b: Bulten, ad: string, dil: Dil) {
  const frame = document.createElement("iframe");
  frame.title = bultenMetni(dil).baslik;
  frame.className = "bulten-baski";
  const html = `<!doctype html><html lang="${dil}"><head><meta charset="utf-8"><title>${bultenEsc(bultenMetni(dil).baslik)} — ${bultenEsc(ad)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:12pt/1.5 Arial,sans-serif;color:#202c2b;margin:0}header{border-bottom:2px solid #815238;padding-bottom:4mm}h1{font:24pt Georgia,serif;margin:0 0 7mm}h3{font:20pt Georgia,serif;margin:2mm 0}h4{font-size:13pt;margin:5mm 0 1.5mm;color:#653b27}p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}section{break-inside:avoid;padding-bottom:2mm}.bulten-kurum{font-size:10pt}footer{border-top:1px solid #b8b6ad;padding-top:5mm;break-inside:avoid;margin-top:5mm}.bulten-yazi-alani{height:16mm;border-bottom:1px solid #bbb;margin-bottom:4mm}.bulten-imza-alani{height:16mm}.dip{font-size:9pt;margin-top:6mm}</style></head><body><h1>${bultenEsc(bultenMetni(dil).baslik)}</h1>${bultenIcerik(b, ad, dil)}<p class="dip">${bultenEsc(bultenMetni(dil).imzaAciklama)}</p></body></html>`;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
  const sil = () => frame.remove();
  frame.contentWindow?.addEventListener("afterprint", sil, { once: true });
  window.setTimeout(sil, 120000);
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
