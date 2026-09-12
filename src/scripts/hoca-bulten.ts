import type { Firestore } from "firebase/firestore/lite";
import { collection, getDocs, query, where } from "firebase/firestore/lite";
import {
  bultenDeposu,
  bultenSinirlari,
  type Bulten,
  type BultenMetni,
} from "../lib/haftalik-bulten";
import {
  portalEnvanteri,
  portalKayitlariniSil,
  portalKilitKaldir,
  type Envanter,
} from "../lib/portal-idare";
import { bultenIcerik, bultenYazdir, bultenEsc as e } from "./bulten-gorunumu";
import type { Dil } from "../i18n/ui";

type Ogr = { ref: string; ad: string; soyad: string; durum?: string };
type Gun = {
  tarih: string;
  hafta: number;
  dersler: { konu: string; ezber: string[] }[];
};
export function hocaBulteni(
  root: HTMLElement,
  opt: {
    db: Firestore;
    ogrenciler: Ogr[];
    gunler: Gun[];
    hafta: number;
    silindi?: (ref: string) => void;
  },
): () => void {
  const ac = new AbortController();
  let kapali = false,
    istek = 0,
    mesgul = false,
    mesaj = "",
    env: Envanter | null = null;
  let ref = "",
    hafta = opt.hafta,
    b: Bulten | null = null,
    okumalar: Record<string, { surum: number }> = {};
  const haftalar = opt.gunler.filter(
    (g, i, a) => a.findIndex((x) => x.hafta === g.hafta) === i,
  );
  const ad = () => {
    const o = opt.ogrenciler.find((x) => x.ref === ref);
    return o ? `${o.ad} ${o.soyad}` : ref;
  };
  const secici = () =>
    `<div class="izgara-2"><label>Öğrenci<select data-hb-ogr ${mesgul ? "disabled" : ""}><option value="">Öğrenci seçin</option>${opt.ogrenciler.map((o) => `<option value="${e(o.ref)}" ${o.ref === ref ? "selected" : ""}>${e(o.ad + " " + o.soyad)}${o.durum === "pasif" ? " · pasif" : ""}</option>`).join("")}</select></label><label>Ders haftası<select data-hb-hafta ${mesgul ? "disabled" : ""}>${haftalar.map((h) => `<option value="${h.hafta}" ${h.hafta === hafta ? "selected" : ""}>${h.hafta}. hafta · ${h.tarih}</option>`).join("")}</select></label></div>`;
  const ciz = () => {
    if (kapali) return;
    root.innerHTML = `<h2>Bülten · İdari işlemler</h2><p>Haftanın derslerini aileye aktarın; yazılı bülten ile portal takibini birlikte yürütün.</p>${secici()}${ref ? `<button type="button" data-hb-yenile ${mesgul ? "disabled" : ""}>Bülteni yeniden yükle</button>` : ""}<p data-hb-durum role="status">${e(mesaj)}</p>${
      b
        ? `<form data-hb-form><fieldset ${mesgul ? "disabled" : ""}><legend>${e(ad())} · ${b.hafta}. hafta</legend><p>${b.surum ? `${b.yayin ? "Yayımlanmış" : "Taslak"} bülten · sürüm ${b.surum}` : "Yeni bülten · henüz kaydedilmedi"}</p><p class="bulten-aciklama">Ders planı Türkçe aktarılır. İçerik dilini değiştirdiğinizde metinleri de o dilde hazırlayın. Kayıtlı taslaklar kendiliğinden değişmez.</p><label>İçerik dili<select name="dil">${(["tr", "fr", "en"] as const).map((d) => `<option value="${d}" ${b!.dil === d ? "selected" : ""}>${{ tr: "Türkçe", fr: "Fransızca", en: "İngilizce" }[d]}</option>`).join("")}</select></label>${Object.entries(
            {
              ders: "Bu haftanın dersleri",
              odev: "Evde birlikte tekrar · kitap / sayfa",
              getir: "Getirilecek kitap ve malzemeler",
              not: "Aileye kısa not · güçlü yön ve sonraki adım",
            },
          )
            .map(
              ([k, ad]) =>
                `<label>${ad}<textarea name="${k}" maxlength="${bultenSinirlari[k as keyof BultenMetni]}" ${k === "ders" ? "required" : ""}>${e(b!.metin[k as keyof BultenMetni])}</textarea></label>`,
            )
            .join(
              "",
            )}<div class="bulten-eylemler"><button type="button" data-hb-onizle>Önizle</button><button type="submit" name="islem" value="taslak">Taslak kaydet</button><button type="submit" name="islem" value="yayin">Kaydet ve veliye göster</button></div><p class="bulten-aciklama">Yayımlama yalnız portalda görünürlük sağlar; e-posta göndermez. Değişiklik yeni sürüm oluşturur ve yeniden okunması gerekir.</p></fieldset></form><details class="bulten-onizleme"><summary>Bülten önizlemesi ve çıktı</summary><div data-hb-onizleme>${bultenIcerik(b, ad(), b.dil)}</div><button type="button" data-hb-yazdir ${mesgul ? "disabled" : ""}>Yazdır / PDF kaydet</button></details><h3>Velilerin okuma durumu</h3>${
            Object.keys(okumalar).length
              ? `<ul class="bulten-envanter">${Object.entries(okumalar)
                  .map(
                    ([ep, r]) =>
                      `<li><span>${e(ep)}</span><span>${r.surum === b!.surum ? "Son sürümü okudu" : "Önceki sürümü okudu"}</span></li>`,
                  )
                  .join("")}</ul>`
              : "<p>Bu bülten için henüz okuma bildirimi yok.</p>"
          }`
        : ""
    }${
      ref
        ? `<details class="bulten-onizleme" data-hb-idare><summary>İdari kayıt dökümü ve temizlik</summary><p>Önce seçili öğrencinin kayıtlarını inceleyin. İndirilen dosya kişisel veriler içerir; yalnız dernek arşivinde saklayın.</p><button type="button" data-hb-tara ${mesgul ? "disabled" : ""}>Kayıt dökümünü yükle</button>${
            env
              ? `<h3>${e(ad())} · ${e(ref)}</h3><ul class="bulten-envanter">${Object.entries(
                  env.sayilar,
                )
                  .map(
                    ([k, n]) =>
                      `<li><span>${e(k)}</span><strong>${n}</strong></li>`,
                  )
                  .join(
                    "",
                  )}</ul><p>${env.aileler.length} veli bağlantısı. Diğer öğrenciler ve ortak veli hesapları korunur.</p><button type="button" data-hb-indir>Seçili öğrencinin dökümünü indir</button><form data-hb-sil><fieldset ${mesgul ? "disabled" : ""}><legend>Kontrollü silme</legend><label>İşlem kapsamı<select name="kapsam"><option value="ev">Yalnız evde çalışma kayıtları</option><option value="tum">Öğrencinin tüm portal kayıtları ve veli bağlantıları</option></select></label><p>“Tüm portal kayıtları” öğrenci profilini, yoklama, ilerleme, değerlendirme, not, bildirim, ev çalışması ve bültenleri siler. Geri alma düğmesi yoktur. Google giriş hesabı, asıl kayıt defteri, gönderilmiş e-postalar ve cihazlardaki dosyalar bu işlemin kapsamı dışındadır. Asıl kayıt defteri değişmezse sonraki aktarım öğrenciyi yeniden oluşturabilir.</p><label>Onay için öğrenci kodunu yazın: ${e(ref)}<input name="onay" autocomplete="off" required></label><button type="submit" class="bulten-tehlike">İncelenen kayıtları sil</button></fieldset></form>`
              : ""
          }<p class="bulten-aciklama">Kesilen bir işlem nedeniyle kayıtlar kilitli kaldıysa en az 15 dakika sonra kilidi kaldırıp dökümü yeniden inceleyin.</p><button type="button" data-hb-kilit ${mesgul ? "disabled" : ""}>Yarım kalan işlem kilidini kaldır</button></details>`
        : ""
    }`;
  };
  const formOku = (yayin = b?.yayin ?? false): Bulten | null => {
    if (!b) return null;
    const f = root.querySelector<HTMLFormElement>("[data-hb-form]");
    if (!f) return b;
    const d = new FormData(f);
    return {
      ...b,
      dil: d.get("dil") as Dil,
      yayin,
      metin: Object.fromEntries(
        Object.keys(bultenSinirlari).map((k) => [
          k,
          String(d.get(k) || "").trim(),
        ]),
      ) as BultenMetni,
    };
  };
  const yukle = async () => {
    const token = ++istek;
    b = null;
    env = null;
    okumalar = {};
    mesaj = ref ? "Bülten yükleniyor…" : "";
    ciz();
    if (!ref) return;
    const r = ref,
      h = haftalar.find((x) => x.hafta === hafta);
    if (!h) return;
    try {
      const depo = bultenDeposu(opt.db, r);
      const liste = await depo.liste(true);
      if (token !== istek || kapali) return;
      let yeni = liste.find((x) => x.id === h.tarih) || null;
      let yeniOkumalar = {};
      if (yeni) yeniOkumalar = await depo.okumalar(yeni.id);
      else {
        const s = await getDocs(
          query(collection(opt.db, "odevler"), where("tarih", "==", h.tarih)),
        );
        const o = s.docs[0]?.data();
        const gunler = opt.gunler.filter((g) => g.hafta === h.hafta);
        yeni = {
          id: h.tarih,
          tarih: h.tarih,
          hafta: h.hafta,
          dil: "tr",
          surum: 0,
          yayin: false,
          metin: {
            ders: gunler
              .map(
                (g) => g.tarih + "\n" + g.dersler.map((d) => d.konu).join("\n"),
              )
              .join("\n\n"),
            odev:
              [o?.odev?.tr, o?.ezber?.tr].filter(Boolean).join("\n") ||
              [
                ...new Set(
                  gunler.flatMap((g) => g.dersler.flatMap((d) => d.ezber)),
                ),
              ].join("\n"),
            getir: "",
            not: "",
          },
        };
      }
      if (token !== istek || kapali) return;
      b = yeni;
      okumalar = yeniOkumalar;
      mesaj = "";
      ciz();
    } catch {
      if (token === istek && !kapali) {
        mesaj =
          "Bülten alınamadı. Öğrenciyi veya haftayı yeniden seçerek deneyin.";
        ciz();
      }
    }
  };
  root.addEventListener(
    "change",
    (ev) => {
      const t = ev.target as HTMLSelectElement;
      if (mesgul) return;
      if (t.matches("[data-hb-ogr]")) {
        ref = t.value;
        void yukle();
      }
      if (t.matches("[data-hb-hafta]")) {
        hafta = Number(t.value);
        void yukle();
      }
    },
    { signal: ac.signal },
  );
  root.addEventListener(
    "click",
    async (ev) => {
      const t = (ev.target as HTMLElement).closest("button");
      if (!t || mesgul) return;
      if (t.hasAttribute("data-hb-yenile")) {
        void yukle();
        return;
      }
      if (t.hasAttribute("data-hb-onizle")) {
        const yeni = formOku();
        if (
          yeni &&
          b &&
          (JSON.stringify(yeni.metin) !== JSON.stringify(b.metin) ||
            yeni.dil !== b.dil)
        )
          yeni.yayin = false;
        if (!yeni) return;
        const p = root.querySelector<HTMLElement>("[data-hb-onizleme]");
        if (p) p.innerHTML = bultenIcerik(yeni, ad(), yeni.dil);
        const det = root.querySelector<HTMLDetailsElement>(".bulten-onizleme");
        if (det) {
          det.open = true;
          det.scrollIntoView({ block: "start" });
        }
        return;
      }
      if (t.hasAttribute("data-hb-yazdir")) {
        const yeni = formOku();
        if (
          yeni &&
          b &&
          (JSON.stringify(yeni.metin) !== JSON.stringify(b.metin) ||
            yeni.dil !== b.dil)
        )
          yeni.yayin = false;
        if (yeni) bultenYazdir(yeni, ad(), yeni.dil);
        return;
      }
      if (t.hasAttribute("data-hb-indir") && env) {
        const url = URL.createObjectURL(
          new Blob(
            [
              JSON.stringify(
                {
                  ...env,
                  aileler: env.aileler.map((a) => ({
                    yol: a.yol,
                    veri: { ogrenciler: [env!.ref] },
                  })),
                },
                null,
                2,
              ),
            ],
            { type: "application/json" },
          ),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "Portal-kayit-dokumu-" + ref + ".json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      if (t.hasAttribute("data-hb-tara") || t.hasAttribute("data-hb-kilit")) {
        b = formOku(b?.yayin) || b;
        mesgul = true;
        mesaj = "İşlem sürüyor…";
        ciz();
        try {
          if (t.hasAttribute("data-hb-kilit"))
            await portalKilitKaldir(opt.db, ref);
          env = await portalEnvanteri(opt.db, ref);
          mesaj = "Kayıt dökümü hazır. Henüz hiçbir kayıt silinmedi.";
        } catch (err) {
          mesaj = (err as Error).message || "Kayıt dökümü alınamadı.";
        } finally {
          mesgul = false;
          ciz();
          const d = root.querySelector<HTMLDetailsElement>("[data-hb-idare]");
          if (d) d.open = true;
        }
      }
    },
    { signal: ac.signal },
  );
  root.addEventListener(
    "submit",
    async (ev) => {
      const f = ev.target as HTMLFormElement;
      if (!f.matches("[data-hb-form],[data-hb-sil]")) return;
      ev.preventDefault();
      if (mesgul) return;
      const d = new FormData(f);
      const token = istek;
      if (f.matches("[data-hb-sil]")) {
        if (!env || String(d.get("onay")).trim() !== ref) {
          mesaj = "Öğrenci kodu eşleşmedi. Hiçbir kayıt silinmedi.";
          const p = root.querySelector("[data-hb-durum]");
          if (p) p.textContent = mesaj;
          return;
        }
        const kapsam = d.get("kapsam") === "tum" ? "tum" : "ev";
        if (
          !confirm(
            `${ad()} (${ref}): ${kapsam === "tum" ? "tüm portal kayıtları" : "evde çalışma kayıtları"} kalıcı olarak silinecek. Devam edilsin mi?`,
          )
        )
          return;
        mesgul = true;
        mesaj = "İncelenen kayıtlar işleniyor…";
        ciz();
        try {
          const n = await portalKayitlariniSil(opt.db, env, kapsam);
          if (kapali || token !== istek) return;
          env = null;
          mesaj = `${n} kayıt silindi. Diğer öğrencilerin kayıtları korundu.`;
          if (kapsam === "tum") {
            opt.silindi?.(ref);
            opt.ogrenciler = opt.ogrenciler.filter((o) => o.ref !== ref);
            ref = "";
            b = null;
          }
        } catch (err) {
          mesaj = (err as Error).message;
        } finally {
          mesgul = false;
          ciz();
        }
        return;
      }
      const yeni = formOku(
        (ev as SubmitEvent).submitter?.getAttribute("value") === "yayin",
      );
      if (!yeni || !b) return;
      const beklenen = b.surum;
      mesgul = true;
      mesaj = "Bülten kaydediliyor…";
      b = yeni;
      ciz();
      try {
        const sonuc = await bultenDeposu(opt.db, ref).kaydet(yeni, beklenen);
        if (kapali || token !== istek) return;
        b = sonuc;
        mesaj = b.yayin
          ? "Bülten yayımlandı; veli portalında görülebilir."
          : "Taslak kaydedildi; veliye görünmez.";
      } catch (err) {
        mesaj = (err as Error).message;
      } finally {
        mesgul = false;
        ciz();
      }
    },
    { signal: ac.signal },
  );
  ciz();
  return () => {
    kapali = true;
    istek++;
    ac.abort();
  };
}
