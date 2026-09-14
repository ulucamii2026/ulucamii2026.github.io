import type { Firestore } from "firebase/firestore/lite";
import {
  defterDeposu,
  defterAlanlari,
  dersDurumlari,
  ozDurumlari,
  gunYoklamasi,
  gunDefterOzeti,
  topluGelmediYaz,
  yoklamaCelismesi,
  gelmediMi,
  GELMEDI_NOTU,
  YOKLAMA_DURUMU,
  type DefterDersi,
  type DersKaydi,
} from "../lib/ders-defteri";
import { bultenEsc as e } from "./bulten-gorunumu";
import {
  ceviriDeposu,
  ceviriGuncel,
  defterKaydiniCevir,
  topluGelmediCevirisiYaz,
  type CeviriDili,
  type DefterCevirisi,
  type MakineCevirici,
} from "../lib/defter-ceviri";
import {
  ALAN_BICIMI,
  defterKaliplari,
  hazirKayitlar,
  hazirKaydiUygula,
  kalipDegistir,
  kalipVar,
  sayacaGoreSirala,
  type KalipAlani,
} from "../lib/defter-kaliplari";

type Ogr = { ref: string; ad: string; soyad: string };
export function dersDefteri(
  root: HTMLElement,
  opt: {
    db: Firestore;
    ogrenciler: Ogr[];
    katalog: DefterDersi[];
    bugun: string;
    /** Öğrenci kartındaki «Ders defterini aç» ile gelen öğrenci: panel bu öğrenci seçili açılır. */
    baslangicRef?: string;
    /** 14 Eyl 2026 (Rıdvan): velinin iletişim dili Türkçe değilse kayıt kaydedilince çevirisi de yazılır
     *  (dersDefteri/{ref}/ceviriler). hedefDil(ref) → 'fr' | null; makine = serbest cümleler için çeviri ucu. */
    ceviri?: { hedefDil: (ref: string) => CeviriDili | null; makine: MakineCevirici };
  },
) {
  const ac = new AbortController();
  let kapali = false,
    token = 0,
    ref = "",
    id = "",
    kayitlar: DersKaydi[] = [],
    kirli = false,
    mesgul = false,
    mesaj = "",
    yuklendi = false;
  /* 12 Eyl 2026 — yoklama bağlantısı. Defter o güne kadar yoklamadan habersizdi: gelmeyen
     öğrencinin kaydı da elle doldurulmak zorundaydı ve hoca 12 Eylül'de «gelmedi.»,
     «Derse katılmadı.», «Ya, işte yoktu.» gibi cümleleri 30 kez yazdı. Artık gün açılırken
     o günün yoklaması okunur; durum ve kanonik not oradan gelir, hoca yalnız düzeltir. */
  let yoklama: Record<string, Record<string, string>> = {};
  let yoklamaTarihi = "";
  let yoklamaHatasi = false;
  const yoklamaDurumu = (r: string, sira: number) => yoklama[r]?.[String(sira)] || "";
  /* Hoca doğrudan dijitale yazıyorsa her kayıtta menüyü değiştirmesin; son seçim hatırlanır.
     Eski varsayılan «kagit» idi ve 12 Eylül'ün 45 kaydının 6'sı yanlış kaynakla kaydedildi. */
  const girisAnahtar = "ulucamii-defter-giris";
  const girisOku = (): DersKaydi["giris"] => {
    try {
      return localStorage.getItem(girisAnahtar) === "kagit" ? "kagit" : "dijital";
    } catch {
      return "dijital";
    }
  };
  const girisYaz = (v: string) => {
    try {
      localStorage.setItem(girisAnahtar, v === "kagit" ? "kagit" : "dijital");
    } catch {
      /* gizli pencerede yazılamaz; varsayılan kullanılır */
    }
  };
  /* 14 Eyl 2026 — «dokuna dokuna» doldurma (Rıdvan: «hazır kalıplar olsun … tek tek el ile yazmak
     yerine»). Kalıp metinleri src/lib/defter-kaliplari.ts'te; burada yalnız ekrana bağlanır.
     · Kullanım sayacı cihazda kalır: çok kullanılan kalıp grubun başına gelir (yeniden çizimde;
       dokunurken çipler yer değiştirmez).
     · Son kayıt önbelleği: aynı dersin en son KAYDEDİLEN notları (ders kimliğiyle) cihazda tutulur;
       «Son kayıtla aynı» düğmesi sıradaki öğrencide boş alanlara kopyalar — 13 Eylül'de aynı ödev
       cümlesi 5 öğrenciye tek tek yazılmıştı. Gelmeyen öğrencinin kaydı önbelleğe alınmaz. */
  const sayacAnahtar = "ulucamii-defter-kalip-sayac";
  const sonAnahtar = "ulucamii-defter-son-kayit";
  const depoOku = <T,>(anahtar: string, varsayilan: T): T => {
    try {
      return { ...varsayilan, ...JSON.parse(localStorage.getItem(anahtar) || "{}") } as T;
    } catch {
      return varsayilan;
    }
  };
  const depoYaz = (anahtar: string, deger: unknown) => {
    try {
      localStorage.setItem(anahtar, JSON.stringify(deger));
    } catch {
      /* gizli pencere: kalıplar yine çalışır, yalnız hatırlanmaz */
    }
  };
  let sayac = depoOku<Record<string, number>>(sayacAnahtar, {});
  const sayacArtir = (metin: string) => {
    sayac = { ...sayac, [metin]: (sayac[metin] || 0) + 1 };
    depoYaz(sayacAnahtar, sayac);
  };
  type SonKayit = Partial<Pick<DersKaydi, "durum" | "calisma" | "odev" | "sonraki" | "okunan" | "dikkat" | "grup">> & { zaman?: number };
  const sonKayitOku = (dersId: string): SonKayit | null =>
    depoOku<Record<string, SonKayit>>(sonAnahtar, {})[dersId] || null;
  const sonKayitYaz = (k: DersKaydi) => {
    if (gelmediMi(k.durum)) return;
    const hepsi = depoOku<Record<string, SonKayit>>(sonAnahtar, {});
    hepsi[k.id] = { durum: k.durum, calisma: k.calisma, odev: k.odev, sonraki: k.sonraki, okunan: k.okunan, dikkat: k.dikkat, grup: k.grup, zaman: Date.now() };
    const kalanlar = Object.keys(hepsi)
      .sort((a, b) => (hepsi[b].zaman || 0) - (hepsi[a].zaman || 0))
      .slice(0, 40);
    depoYaz(sonAnahtar, Object.fromEntries(kalanlar.map((i) => [i, hepsi[i]])));
  };
  /** Metin alanı içeriğe göre uzar; çipler eklerken kaydırma çubuğu çıkmaz. */
  const buyut = (ta: HTMLTextAreaElement) => {
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight + 2}px`;
  };
  const hepsiniBuyut = () => root.querySelectorAll<HTMLTextAreaElement>("[data-dd-form] textarea").forEach(buyut);
  const sonrakiDers = (d: DefterDersi) => {
    const i = opt.katalog.findIndex((x) => x.id === d.id);
    return i >= 0 ? opt.katalog[i + 1] || null : null;
  };
  const gunler = [...new Set(opt.katalog.map((d) => d.tarih))];
  let tarih = gunler.find((t) => t >= opt.bugun) || gunler.at(-1) || "";
  if (opt.baslangicRef && opt.ogrenciler.some((o) => o.ref === opt.baslangicRef)) {
    ref = opt.baslangicRef;
    id = opt.katalog.find((x) => x.tarih === tarih)?.id || "";
  }
  /* Günün defter ilerlemesi (14 Eyl 2026): öğrenci → o gün yazılmış ders kimlikleri. Gün açılınca
     bir kez okunur (öğrenci başına küçük sorgu); kayıt sonrası yerinde güncellenir. Seçim listesinde
     ✓ / ◐ işareti ve «7/15 öğrenci tamam» satırı buradan gelir; sıradaki eksik öğrenciye tek dokunuş. */
  let gunDefter: Record<string, string[]> = {};
  let gunDefterTarihi = "";
  const gunDersSayisi = () => opt.katalog.filter((x) => x.tarih === tarih).length;
  const ogrDurumu = (r: string): "tamam" | "kismen" | "bos" => {
    const n = (gunDefter[r] || []).length;
    return n === 0 ? "bos" : n >= gunDersSayisi() ? "tamam" : "kismen";
  };
  const siradakiEksik = () => opt.ogrenciler.find((o) => ogrDurumu(o.ref) !== "tamam") || null;
  const adi = () => {
    const o = opt.ogrenciler.find((x) => x.ref === ref);
    return o ? `${o.ad} ${o.soyad}` : ref;
  };
  const ders = () => opt.katalog.find((x) => x.id === id);
  /* ── Çeviri (14 Eyl 2026): kalıp cümleler yerel Fransızca, serbest cümleler makine; yarım çeviri yazılmaz. ── */
  let ceviriler: DefterCevirisi[] = [];
  const YONTEM_ADI = { kalip: "kalıp cümleler", makine: "makine çevirisi", karma: "kalıp + makine" } as const;
  const hedefDil = () => (ref && opt.ceviri ? opt.ceviri.hedefDil(ref) : null);
  const ceviriSatiri = () => {
    const dil = hedefDil();
    if (!dil || !id) return "";
    const k = kayitlar.find((x) => x.id === id);
    const c = ceviriler.find((x) => x.id === `${id}_${dil}`);
    const guncel = !!k && !!c && ceviriGuncel(k, c);
    const durum = !k ? "kaydedince yapılır" : guncel ? `kayıtlı ✓ (${YONTEM_ADI[c!.yontem]})` : c ? "eski — kayıt değişti" : "yok";
    return `<span>Veli dili <b>Fransızca</b> · çeviri: ${e(durum)}</span>${k && !guncel ? `<button type="button" class="kucuk-dugme" data-dd-cevir ${mesgul ? "disabled" : ""}>Şimdi çevir</button>` : ""}`;
  };
  const CEVRILIYOR = "Çevriliyor…";
  const ceviriNotu = (m: string) => {
    mesaj = mesaj && mesaj !== CEVRILIYOR ? `${mesaj} ${m}` : m;
    const p = root.querySelector("[data-dd-durum]");
    if (p) p.textContent = mesaj;
    const c = root.querySelector("[data-dd-ceviri]");
    if (c) c.innerHTML = ceviriSatiri();
  };
  /** Kaydedilen kaydın çevirisi (kaydetmeyi bekletmez). Başarısızsa kayıt Türkçe kalır; «Şimdi çevir» ve bülten aktarımı uyarır. */
  const ceviriYaz = async (k: DersKaydi, r: string) => {
    const dil = opt.ceviri?.hedefDil(r);
    const d = opt.katalog.find((x) => x.id === k.id);
    if (!dil || !d || !opt.ceviri) return;
    try {
      const c = await defterKaydiniCevir(k, d, sonrakiDers(d), dil, opt.ceviri.makine);
      await ceviriDeposu(opt.db, r).kaydet(c);
      if (kapali) return;
      if (r === ref) ceviriler = [...ceviriler.filter((x) => x.id !== c.id), c];
      ceviriNotu(`Fransızca çevirisi kaydedildi (${YONTEM_ADI[c.yontem]}).`);
    } catch {
      if (kapali) return;
      ceviriNotu("Fransızca çevirisi yapılamadı; «Şimdi çevir» ile ya da bülten aktarımında yeniden denenir.");
    }
  };
  const ayrilabilir = () =>
    !mesgul &&
    (!kirli ||
      confirm(
        "Kaydedilmemiş ders notu var. Kaydetmeden ayrılmak istiyor musunuz?",
      ));
  const secenek = (values: Record<string, string>, sec: string) =>
    Object.entries(values)
      .map(
        ([k, v]) =>
          `<option value="${e(k)}" ${sec === k ? "selected" : ""}>${e(v)}</option>`,
      )
      .join("");
  const varsayilan = (d: DefterDersi): DersKaydi => ({
    id: d.id,
    donem: "2026-2027",
    tarih: d.tarih,
    sira: d.sira,
    no: d.no,
    sayfa: d.sayfa,
    konu: d.konu,
    kaynak: d.kaynak,
    grup: "",
    // Yoklamada «Yok»/«Mazeretli» ise durum oradan gelir; hoca isterse menüden değiştirir.
    durum: (YOKLAMA_DURUMU[yoklamaDurumu(ref, d.sira)] || "") as DersKaydi["durum"],
    giris: girisOku(),
    calisma: "",
    okunan: "",
    dikkat: "",
    oz: "",
    odev: "",
    sonraki: "",
    surum: 0,
  });
  const al = () => {
    const d = ders();
    if (!d) return null;
    const eski = kayitlar.find((k) => k.id === id) || varsayilan(d);
    const form = root.querySelector<HTMLFormElement>("[data-dd-form]");
    if (!form) return eski;
    const fd = new FormData(form);
    return {
      ...eski,
      ...Object.fromEntries(
        [
          "grup",
          "durum",
          "giris",
          "calisma",
          "okunan",
          "dikkat",
          "oz",
          "odev",
          "sonraki",
        ].map((k) => [k, String(fd.get(k) || "").trim()]),
      ),
    } as DersKaydi;
  };
  const ciz = (taslak?: DersKaydi) => {
    if (kapali) return;
    const d = ders(),
      k =
        taslak ||
        kayitlar.find((k) => k.id === id) ||
        (d ? varsayilan(d) : null);
    const gun = opt.katalog.filter((x) => x.tarih === tarih);
    const gelmedi = gelmediMi(k?.durum || "");
    const kaliplar = d ? defterKaliplari(d, sonrakiDers(d)) : null;
    const hazirlar = d ? hazirKayitlar(d, sonrakiDers(d)) : [];
    const sonKayit = d ? sonKayitOku(d.id) : null;
    /* Kalıp çipleri: metin alanının hemen altında, grup başlıklarıyla. Dokunuş cümleyi ekler,
       ikinci dokunuş geri alır (aria-pressed). Gelmeyen öğrencide çip yok — kanonik not yeter. */
    const kalipSatiri = (key: KalipAlani, deger: string) => {
      const gruplar = kaliplar?.[key] || [];
      if (!gruplar.length || gelmedi) return "";
      return `<div class="dd-kaliplar" role="group" aria-label="${e(defterAlanlari[key].ad)} için hazır kalıplar">${gruplar
        .map(
          (g) =>
            `<div class="dd-kalip-grup"><span class="dd-kalip-ad">${e(g.ad)}</span>${sayacaGoreSirala(g.kaliplar, sayac)
              .map(
                (x) =>
                  `<button type="button" class="dd-kalip" data-dd-kalip="${key}" data-metin="${e(x.metin)}" aria-pressed="${kalipVar(deger, x.metin)}" title="${e(x.metin)}">${e(x.etiket)}</button>`,
              )
              .join("")}</div>`,
        )
        .join("")}</div>`;
    };
    const alan = (key: keyof typeof defterAlanlari) => {
      const f = defterAlanlari[key];
      // Gelmeyen derste çalışma notu zorunlu değil; boş bırakılırsa kanonik cümle yazılır.
      const zorunlu = key === "calisma" && !gelmedi;
      const ipucu =
        key === "calisma" && gelmedi
          ? `Boş bırakabilirsiniz: «${GELMEDI_NOTU[k!.durum]}» yazılır.`
          : gelmedi
            ? "Kısa notunuzu yazın…"
            : "Aşağıdaki kalıplara dokunun ya da kendi notunuzu yazın…";
      const deger = String(k?.[key] || "");
      return `<label>${f.ad}<textarea name="${key}" maxlength="${f.max}" ${zorunlu ? "required" : ""} rows="${key === "calisma" ? 4 : 2}" placeholder="${e(ipucu)}">${e(deger)}</textarea></label>${kalipSatiri(key, deger)}`;
    };
    /* Hazır kayıt: tek dokunuşla durum + standart notlar (yalnız boş alanlar). «Son kayıtla aynı»
       bu ders için en son kaydedilen notları kopyalar — sınıfın ortak ödevi bir kez yazılır. */
    const hazirBar = () =>
      gelmedi || !hazirlar.length
        ? ""
        : `<div class="dd-hazir" role="group" aria-label="Hazır kayıt"><span class="dd-kalip-ad">Hazır kayıt</span><div class="dd-hazir-dugmeler">${hazirlar
            .map(
              (h) =>
                `<button type="button" class="dd-hazir-dugme" data-dd-hazir="${e(h.id)}" title="${e(h.aciklama)}">${e(h.etiket)}</button>`,
            )
            .join("")}${
            sonKayit && !gelmediMi(sonKayit.durum || "")
              ? `<button type="button" class="dd-hazir-dugme dd-hazir-onceki" data-dd-oncekinden title="Bu ders için en son kaydedilen notları (durum, çalışma, ödev, sonraki adım) boş alanlara kopyalar.">Son kayıtla aynı</button>`
              : ""
          }</div><p class="kucuk">Tek dokunuşla durum ve standart notlar gelir; dolu alanlara dokunulmaz. Sonra istediğinizi düzenleyin.</p></div>`;
    const YOK_ADI: Record<string, string> = { var: "Var", yok: "Yok", mazeret: "Mazeretli", gec: "Geç" };
    const yokRozet = (sira: number) => {
      const y = yoklamaDurumu(ref, sira);
      return y ? `<span class="dd-yok dd-yok-${y}">${YOK_ADI[y] || y}</span>` : "";
    };
    const topluDugme = () => {
      const n = gelmeyenDersler().length;
      if (!n || yoklamaHatasi) return "";
      return `<div class="dd-toplu"><button type="button" data-dd-toplu ${mesgul ? "disabled" : ""}>Gelmeyenlerin defterini doldur <small>${n} ders</small></button><p class="kucuk">Yoklamada «Yok» veya «Mazeretli» işaretli dersler için kayıt açar. Zaten kaydı olan derse dokunmaz.</p></div>`;
    };

    root.innerHTML = `<h2>Ders Defteri</h2><p>Kâğıttaki notlarınız, aynı dersin dijital kaydında.</p><div class="dd-secim"><label>Öğrenci<select data-dd-ogr ${mesgul ? "disabled" : ""}><option value="">Öğrenci seçin</option>${opt.ogrenciler.map((o) => { const y = [1, 2, 3].map((s) => yoklama[o.ref]?.[String(s)] || "").filter(Boolean); const hepsi = y.length === 3 && y.every((x) => x === y[0]) ? y[0] : ""; const dz = ogrDurumu(o.ref); const isaret = dz === "tamam" ? " ✓" : dz === "kismen" ? ` ◐ ${(gunDefter[o.ref] || []).length}/${gunDersSayisi()}` : ""; return `<option value="${e(o.ref)}" ${ref === o.ref ? "selected" : ""}>${e(o.ad + " " + o.soyad)}${isaret}${hepsi && hepsi !== "var" ? ` — ${e(YOK_ADI[hepsi] || hepsi)}` : ""}</option>`; }).join("")}</select></label><label>Ders günü<select data-dd-gun ${mesgul ? "disabled" : ""}>${gunler.map((t) => `<option value="${t}" ${t === tarih ? "selected" : ""}>${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "short" }).format(new Date(t + "T12:00:00Z"))}</option>`).join("")}</select></label></div>${(() => { if (!gunDefterTarihi || !gunDersSayisi()) return ""; const say = { tamam: 0, kismen: 0, bos: 0 }; opt.ogrenciler.forEach((o) => { say[ogrDurumu(o.ref)]++; }); const eksik = siradakiEksik(); return `<p class="dd-gun-ozet" data-dd-gun-ozet><span><b>${say.tamam}/${opt.ogrenciler.length}</b> öğrencinin günlük defteri tamam</span>${say.kismen ? `<span>${say.kismen} kısmen</span>` : ""}${say.bos ? `<span>${say.bos} başlanmadı</span>` : ""}${eksik ? `<button type="button" class="kucuk-dugme" data-dd-siradaki ${mesgul ? "disabled" : ""}>Sıradaki eksik: ${e(eksik.ad)}</button>` : '<span class="rozet var">Günün defteri tamam</span>'}</p>`; })()}<p data-dd-durum role="status" tabindex="-1">${e(mesaj)}</p>${yoklamaHatasi ? '<p class="dd-uyari" data-dd-yoklama-hata>Bu günün yoklaması okunamadı; durum kendiliğinden doldurulmadı.</p>' : ""}${topluDugme()}${ref && !yuklendi && !mesgul ? '<button type="button" data-dd-yenile>Yeniden dene</button>' : ""}${ref && yuklendi ? `<nav class="dd-dersler" aria-label="Günün dersleri">${gun.map((x) => `<button type="button" data-dd-ders="${x.id}" aria-pressed="${x.id === id}" ${mesgul ? "disabled" : ""}>${x.sira}. ders <span>${e(x.konu)}</span><small>${kayitlar.some((k) => k.id === x.id) ? "Kayıtlı" : "Henüz kayıt yok"}</small>${yokRozet(x.sira)}</button>`).join("")}</nav>` : ""}${
      ref && yuklendi && d && k
        ? `<div class="dd-baslik"><h3>${e(d.konu)}</h3>${(() => { const y = yoklamaDurumu(ref, d.sira); return y ? `<p class="dd-yoklama dd-yok-${y}" data-dd-yoklama>Yoklama: <strong>${e(YOK_ADI[y] || y)}</strong>${gelmedi ? " · dersin durumu buna göre seçildi" : ""}</p>` : ""; })()}${hedefDil() ? `<p class="dd-ceviri" data-dd-ceviri>${ceviriSatiri()}</p>` : ""}<p>Basılı defter: <strong>${d.sayfa}. sayfa</strong> · ${d.hafta}. hafta · Ders no: ${d.no}</p><details><summary>Basılı plandaki hedef ve etkinlik</summary><p>${e(d.goal_tr)}</p><p lang="fr">${e(d.goal_fr)}</p><p>${e(d.prompt_tr)}</p><p lang="fr">${e(d.prompt_fr)}</p>${d.hedef_a_tr ? `<p><strong>A grubu · ${e(d.hedef_a_tr)}</strong></p><p lang="fr">${e(d.hedef_a_fr)}</p>` : ""}<p>Kaynak: ${e(d.kaynak)}</p><p>Basılı plan dersin işlendiği veya öğrencinin başardığı anlamına gelmez.</p></details></div><form data-dd-form><fieldset ${mesgul ? "disabled" : ""}><legend class="sr-only">${e(adi())} ders kaydı</legend>${hazirBar()}<label class="dd-durum-secim">Dersin durumu<select name="durum" required>${secenek({ "": "Seçin…", ...dersDurumlari }, k.durum)}</select></label>${(() => { const c = yoklamaCelismesi(k.durum, yoklamaDurumu(ref, d.sira)); return c ? `<p class="dd-uyari" data-dd-celiski>${e(c)} Kaydetmenizi engellemez; hangisi doğruysa onu düzeltin.</p>` : ""; })()}${alan("calisma")}${alan("odev")}<details class="dd-ayrinti"><summary>Diğer defter alanları · isteğe bağlı</summary><label>Notun kaynağı<select name="giris">${secenek({ dijital: "Doğrudan dijitale yazıyorum", kagit: "Kâğıt defterden aktarıyorum" }, k.giris)}</select></label>${d.kod === "kuran" ? `<label>Bugünkü grubu<select name="grup">${secenek({ "": "İşaretlenmedi", A: "A grubu", B: "B grubu" }, k.grup)}</select></label>${alan("okunan")}${alan("dikkat")}` : '<input type="hidden" name="grup" value=""><input type="hidden" name="okunan" value=""><input type="hidden" name="dikkat" value="">'}${alan("sonraki")}<label>Öğrencinin “Bugün nasıl ilerledim?” işareti<select name="oz">${secenek(ozDurumlari, k.oz)}</select></label><p class="dd-aciklama">Öğrencinin kâğıttaki beyanını aktarın. Bu alan öğretmen başarı notu veya yoklama değildir. Yoklama ve ilerleme kendi menülerinde tutulur.</p></details><div class="dd-kaydet"><button type="submit" value="kaydet">Kaydet</button><button type="submit" value="sonraki">Kaydet ve sonraki<span class="dd-uzun"> derse geç</span></button></div></fieldset></form><div class="bulten-eylemler"><button type="button" data-dd-yenile ${mesgul ? "disabled" : ""}>Sunucudaki kaydı yeniden yükle</button><button type="button" data-dd-kopyala ${mesgul ? "disabled" : ""}>Notları kopyala</button></div><details class="dd-arsiv"><summary>Dijital arşiv · ${kayitlar.length} kayıt</summary><p>Yalnız ${e(adi())} için kaydedilmiş dersler. Kayıtlar hoca ekranına özeldir; veliye paylaşmak için Bülten · İdare bölümünde haftanın notlarını aktarın.</p><div class="bulten-eylemler"><button type="button" data-dd-indir>Arşivi indir (JSON)</button><button type="button" data-dd-yazdir>Kaydedilmiş dersleri yazdır / PDF</button></div><ul>${
            [...kayitlar]
              .reverse()
              .map(
                (x) =>
                  `<li><button type="button" data-dd-arsiv="${e(x.id)}">${e(x.tarih)} · ${x.sira}. ders · ${e(x.konu)}<small>${dersDurumlari[x.durum]} · sürüm ${x.surum}</small></button></li>`,
              )
              .join("") || "<li>İlk kayıttan sonra burada görünecek.</li>"
          }</ul></details>`
        : ""
    }`;
    hepsiniBuyut();
  };
  const yukle = async () => {
    const t = ++token;
    const gun = tarih;
    mesgul = true;
    yuklendi = false;
    mesaj = ref ? "Ders defteri yükleniyor…" : "Ders günü yoklaması okunuyor…";
    ciz();
    try {
      // Yoklama okunamazsa defter yine açılır; yalnız otomatik doldurma devre dışı kalır.
      const [r, y, gd, cv] = await Promise.all([
        ref ? defterDeposu(opt.db, ref).liste() : Promise.resolve([] as DersKaydi[]),
        yoklamaTarihi === gun
          ? Promise.resolve(yoklama)
          : gunYoklamasi(opt.db, gun).catch(() => null),
        gunDefterTarihi === gun
          ? Promise.resolve(gunDefter)
          : gunDefterOzeti(opt.db, opt.ogrenciler.map((o) => o.ref), gun).catch(() => null),
        ref && opt.ceviri?.hedefDil(ref)
          ? ceviriDeposu(opt.db, ref).liste().catch(() => [] as DefterCevirisi[])
          : Promise.resolve([] as DefterCevirisi[]),
      ]);
      if (t !== token || kapali) return;
      if (y) {
        yoklama = y;
        yoklamaTarihi = gun;
        yoklamaHatasi = false;
      } else yoklamaHatasi = true;
      if (gd) {
        gunDefter = gd;
        gunDefterTarihi = gun;
      }
      kayitlar = r;
      ceviriler = cv;
      kirli = false;
      yuklendi = Boolean(ref);
      mesaj = !ref
        ? ""
        : r.some((k) => k.id === id)
          ? "Sunucudaki kayıt açıldı."
          : "Bu ders için henüz kayıt yok.";
    } catch {
      if (t === token)
        mesaj =
          "Kayıtlar alınamadı. Bağlantınızı kontrol edip yeniden deneyin.";
    } finally {
      if (t === token) {
        mesgul = false;
        ciz();
      }
    }
  };
  /** Yoklamada «Yok»/«Mazeretli» işaretli dersler (toplu doldurmanın adayları). */
  const gelmeyenDersler = () =>
    opt.katalog
      .filter((d) => d.tarih === tarih)
      .flatMap((d) =>
        opt.ogrenciler
          .map((o) => ({
            ref: o.ref,
            ad: `${o.ad} ${o.soyad}`,
            ders: d,
            durum: YOKLAMA_DURUMU[yoklamaDurumu(o.ref, d.sira)],
          }))
          .filter((x) => Boolean(x.durum)),
      );
  root.addEventListener(
    "input",
    (ev) => {
      if ((ev.target as HTMLElement).closest("[data-dd-form]")) {
        kirli = true;
        const p = root.querySelector("[data-dd-durum]");
        if (p) p.textContent = "Kaydedilmemiş değişiklik var.";
        const ta = ev.target as HTMLTextAreaElement;
        if (ta.tagName === "TEXTAREA") {
          buyut(ta);
          // Hoca elle silerse çipin basılı görünümü de düşer (ve tersi).
          root
            .querySelectorAll<HTMLButtonElement>(`[data-dd-kalip="${ta.name}"]`)
            .forEach((c) => c.setAttribute("aria-pressed", String(kalipVar(ta.value, c.dataset.metin || ""))));
        }
      }
    },
    { signal: ac.signal },
  );
  root.addEventListener(
    "change",
    (ev) => {
      const t = ev.target as HTMLSelectElement;
      if (t.closest("[data-dd-form]")) {
        kirli = true;
        if (t.name === "giris") girisYaz(t.value);
        // Durum değişince yoklama uyarısı, zorunluluk ve ipucu metni yeniden hesaplanır.
        if (t.name === "durum") {
          const taslak = al();
          if (taslak) {
            ciz(taslak);
            root.querySelector<HTMLElement>("[name=durum]")?.focus();
          }
        }
        return;
      }
      if (!t.matches("[data-dd-ogr],[data-dd-gun]")) return;
      if (!ayrilabilir()) {
        t.value = t.matches("[data-dd-ogr]") ? ref : tarih;
        return;
      }
      kirli = false;
      if (t.matches("[data-dd-ogr]")) {
        ref = t.value;
        kayitlar = [];
        id = opt.katalog.find((x) => x.tarih === tarih)?.id || "";
        if (ref) void yukle();
        else {
          yuklendi = false;
          mesaj = "";
          ciz();
        }
      } else {
        tarih = t.value;
        id = opt.katalog.find((x) => x.tarih === tarih)?.id || "";
        mesaj = "";
        void yukle(); // yeni günün yoklaması okunmadan durum kendiliğinden dolmaz
      }
    },
    { signal: ac.signal },
  );
  root.addEventListener(
    "click",
    async (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!b || mesgul) return;
      /* Kalıp çipi: metin alanında yerinde ekle/çıkar; sayfa yeniden çizilmez (imleç ve kaydırma
         durur, çipler yer değiştirmez). Sayaç yalnız eklemede artar. */
      if (b.dataset.ddKalip) {
        const key = b.dataset.ddKalip as KalipAlani;
        const metin = b.dataset.metin || "";
        const ta = root.querySelector<HTMLTextAreaElement>(`[data-dd-form] textarea[name="${key}"]`);
        if (!ta || !metin) return;
        const vardi = kalipVar(ta.value, metin);
        ta.value = kalipDegistir(ta.value, metin, ALAN_BICIMI[key]);
        b.setAttribute("aria-pressed", String(!vardi));
        if (!vardi) sayacArtir(metin);
        kirli = true;
        buyut(ta);
        const p = root.querySelector("[data-dd-durum]");
        if (p) p.textContent = "Kaydedilmemiş değişiklik var.";
        return;
      }
      if (b.dataset.ddHazir || b.hasAttribute("data-dd-oncekinden")) {
        const d = ders();
        const k = al();
        if (!d || !k) return;
        const hazir = b.dataset.ddHazir
          ? hazirKayitlar(d, sonrakiDers(d)).find((x) => x.id === b.dataset.ddHazir)
          : (() => {
              const s = sonKayitOku(d.id);
              return s && s.durum && !gelmediMi(s.durum)
                ? { id: "onceki", etiket: "Son kayıtla aynı", aciklama: "", durum: s.durum, alanlar: { calisma: s.calisma || "", odev: s.odev || "", sonraki: s.sonraki || "", okunan: s.okunan || "", dikkat: s.dikkat || "" } }
                : undefined;
            })();
        if (!hazir) return;
        const { taslak, atlanan } = hazirKaydiUygula(k, hazir);
        kirli = true;
        mesaj = atlanan.length
          ? `${hazir.etiket}: uygulandı; dolu alanlara dokunulmadı (${atlanan.map((a) => defterAlanlari[a].ad.split(" ·")[0]).join(", ")}). Kaydetmeyi unutmayın.`
          : `${hazir.etiket}: uygulandı. Gerekirse düzenleyip kaydedin.`;
        ciz(taslak);
        root.querySelector<HTMLElement>("[name=calisma]")?.focus();
        return;
      }
      if (b.dataset.ddDers || b.dataset.ddArsiv) {
        if (!ayrilabilir()) return;
        const yeni = opt.katalog.find(
          (x) => x.id === (b.dataset.ddDers || b.dataset.ddArsiv),
        );
        if (!yeni) return;
        id = yeni.id;
        tarih = yeni.tarih;
        kirli = false;
        mesaj = "";
        ciz();
        root.querySelector<HTMLElement>("[name=durum]")?.focus();
      }
      if (b.hasAttribute("data-dd-yenile")) {
        if (ayrilabilir()) {
          yoklamaTarihi = "";
          gunDefterTarihi = "";
          void yukle();
        }
      }
      if (b.hasAttribute("data-dd-cevir")) {
        const k = kayitlar.find((x) => x.id === id);
        if (!k || !ref) return;
        mesaj = CEVRILIYOR;
        ciz();
        await ceviriYaz(k, ref);
        return;
      }
      if (b.hasAttribute("data-dd-siradaki")) {
        /* Sıradaki eksik öğrenci: listede defteri tamamlanmamış ilk öğrenci, ilk EKSİK dersiyle açılır. */
        const o = siradakiEksik();
        if (!o || !ayrilabilir()) return;
        const eksikDers = opt.katalog.find((x) => x.tarih === tarih && !(gunDefter[o.ref] || []).includes(x.id));
        ref = o.ref;
        id = eksikDers?.id || opt.katalog.find((x) => x.tarih === tarih)?.id || "";
        kayitlar = [];
        kirli = false;
        mesaj = "";
        void yukle();
        return;
      }
      if (b.hasAttribute("data-dd-toplu")) {
        if (!ayrilabilir()) return;
        const hepsi = gelmeyenDersler();
        if (!hepsi.length) return;
        const t = ++token;
        mesgul = true;
        mesaj = "Gelmeyenlerin kayıtları kontrol ediliyor…";
        ciz();
        try {
          // Var olan kayda ASLA dokunulmaz: önce her adayın kayıtları okunur, yalnız
          // eksik olanlar yazılır. (Kural da korur: mevcut belgeye surum:1 ile yazılamaz.)
          const refler = [...new Set(hepsi.map((x) => x.ref))];
          const mevcut = new Map<string, Set<string>>();
          for (const r of refler)
            mevcut.set(
              r,
              new Set(
                (r === ref ? kayitlar : await defterDeposu(opt.db, r).liste()).map(
                  (k) => k.id,
                ),
              ),
            );
          if (t !== token || kapali) return;
          const yazilacak = hepsi.filter(
            (x) => !mevcut.get(x.ref)!.has(x.ders.id),
          );
          if (!yazilacak.length) {
            mesgul = false;
            mesaj = "Gelmeyen derslerin hepsinin kaydı zaten var; hiçbir şey yazılmadı.";
            ciz();
            root.querySelector<HTMLElement>("[data-dd-durum]")?.focus();
            return;
          }
          const kisi = new Set(yazilacak.map((x) => x.ref)).size;
          if (
            !confirm(
              `${yazilacak.length} ders kaydı açılacak (${kisi} öğrenci). ` +
                "Yoklamada «Yok»/«Mazeretli» işaretli ve henüz kaydı olmayan dersler için " +
                "durum ve standart not yazılır. Var olan kayıtlara dokunulmaz. Devam edilsin mi?",
            )
          ) {
            mesgul = false;
            mesaj = "";
            ciz();
            return;
          }
          mesaj = "Kayıtlar açılıyor…";
          ciz();
          await topluGelmediYaz(
            opt.db,
            yazilacak.map((x) => ({ ref: x.ref, ders: x.ders, durum: x.durum! })),
          );
          if (opt.ceviri) {
            // Kanonik not kalıptır: Fransızca aileler için çeviri belgesi de açılır (makine yok).
            const cv = opt.ceviri;
            await topluGelmediCevirisiYaz(
              opt.db,
              yazilacak.flatMap((x) => {
                const dil = cv.hedefDil(x.ref);
                return dil ? [{ ref: x.ref, kayitId: x.ders.id, durum: x.durum!, dil }] : [];
              }),
            ).catch(() => {
              /* çeviri yazılamazsa kayıtlar yine açıldı; «Şimdi çevir» tamamlar */
            });
          }
          if (t !== token || kapali) return;
          mesgul = false;
          const ozet = `${yazilacak.length} ders kaydı açıldı (${kisi} öğrenci). Var olan kayıtlara dokunulmadı.`;
          gunDefterTarihi = ""; // günün ilerlemesi yeniden okunur (açılan kayıtlar sayıma girsin)
          await yukle(); // açılan kayıtlar seçili öğrencide ve günün özetinde görünsün
          if (kapali) return;
          mesaj = ozet; // yukle() kendi mesajını yazar; özet onun üstüne konur
          ciz();
          root.querySelector<HTMLElement>("[data-dd-durum]")?.focus();
        } catch {
          if (t !== token || kapali) return;
          mesgul = false;
          mesaj =
            "Toplu doldurma tamamlanamadı; hiçbir kayıt yazılmamış olabilir. Sayfayı yenileyip yeniden deneyin.";
          ciz();
        }
      }
      if (b.hasAttribute("data-dd-kopyala")) {
        const k = al();
        if (!k) return;
        try {
          await navigator.clipboard.writeText(
            Object.entries(defterAlanlari)
              .map(([key, f]) => `${f.ad}: ${k[key as keyof DersKaydi]}`)
              .join("\n"),
          );
          mesaj = "Notlar panoya kopyalandı.";
        } catch {
          mesaj = "Kopyalanamadı. Metin alanından seçerek kopyalayabilirsiniz.";
        }
        const p = root.querySelector("[data-dd-durum]");
        if (p) p.textContent = mesaj;
      }
      if (b.hasAttribute("data-dd-indir")) {
        const blob = new Blob(
          [
            JSON.stringify(
              { donem: "2026-2027", ogrenci: { ref, ad: adi() }, kayitlar },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        );
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "Ders-Defteri-" + ref + ".json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      if (b.hasAttribute("data-dd-yazdir")) defterYazdir(kayitlar, adi());
    },
    { signal: ac.signal },
  );
  root.addEventListener(
    "submit",
    async (ev) => {
      const f = ev.target as HTMLFormElement;
      if (!f.matches("[data-dd-form]")) return;
      ev.preventDefault();
      if (mesgul) return;
      const k = al();
      if (!k) return;
      const sonraki =
        (ev as SubmitEvent).submitter?.getAttribute("value") === "sonraki";
      const t = token;
      mesgul = true;
      mesaj = "Kaydediliyor…";
      ciz(k);
      try {
        const saved = await defterDeposu(opt.db, ref).kaydet(k, k.surum);
        if (kapali || token !== t) return;
        kayitlar = [...kayitlar.filter((x) => x.id !== saved.id), saved].sort(
          (a, b) => a.id.localeCompare(b.id),
        );
        sonKayitYaz(saved); // «Son kayıtla aynı» için: aynı dersin en son notları cihazda kalır
        if (gunDefterTarihi === saved.tarih && !(gunDefter[ref] || []).includes(saved.id)) gunDefter[ref] = [...(gunDefter[ref] || []), saved.id].sort();
        kirli = false;
        mesaj = "Dijital ders defterine kaydedildi.";
        void ceviriYaz(saved, ref); // veli dili Fransızca ise; kaydetmeyi ve «sonraki»ye geçişi bekletmez
        if (sonraki) {
          /* 12 Eyl 2026: gün bitince ertesi güne değil, AYNI günün ilk dersinde SONRAKİ
             ÖĞRENCİye geçilir. Hocanın gerçek iş birimi «bir ders günü, on beş öğrenci»;
             eskiden son dersten sonra aynı öğrencinin bir sonraki hafta sonuna atlıyordu. */
          const gunDersleri = opt.katalog.filter((x) => x.tarih === tarih);
          const next = gunDersleri[gunDersleri.findIndex((x) => x.id === id) + 1];
          if (next) id = next.id;
          else {
            const sira = opt.ogrenciler.findIndex((o) => o.ref === ref);
            const sonrakiOgr = opt.ogrenciler[sira + 1];
            if (sonrakiOgr && gunDersleri.length) {
              ref = sonrakiOgr.ref;
              id = gunDersleri[0].id;
              kayitlar = [];
              mesgul = false;
              await yukle(); // sonraki öğrencinin kayıtları
              if (kapali) return;
              mesaj = `Kaydedildi. Sıradaki öğrenci: ${adi()}.`;
              ciz();
              root.querySelector<HTMLElement>("[name=durum]")?.focus();
              return;
            }
            mesaj = "Kaydedildi. Bu günün son kaydı tamamlandı.";
          }
        }
        mesgul = false;
        ciz();
        root
          .querySelector<HTMLElement>(
            sonraki ? "[name=durum]" : "[data-dd-durum]",
          )
          ?.focus();
      } catch (err) {
        if (kapali || token !== t) return;
        mesgul = false;
        kirli = true;
        mesaj = (err as Error).message?.includes("başka bir ekranda")
          ? (err as Error).message
          : "Kaydedilemedi. Notlarınız ekranda duruyor; bağlantınızı kontrol edip tekrar kaydedin.";
        ciz(k);
      }
    },
    { signal: ac.signal },
  );
  window.addEventListener(
    "beforeunload",
    (ev) => {
      if (kirli || mesgul) {
        ev.preventDefault();
        ev.returnValue = "";
      }
    },
    { signal: ac.signal },
  );
  void yukle(); // öğrenci seçilmeden önce de günün yoklaması okunsun (toplu doldurma için)
  return {
    ayrilabilir,
    temizle: () => {
      kapali = true;
      token++;
      ac.abort();
    },
  };
}

export function defterYazdir(kayitlar: DersKaydi[], ad: string) {
  if (!kayitlar.length) return;
  const frame = document.createElement("iframe");
  frame.className = "bulten-baski";
  frame.title = "Dijital ders defteri çıktısı";
  frame.srcdoc = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Ders Defteri — ${e(ad)}</title><style>@page{size:A4;margin:18mm}body{font:12pt/1.55 Arial,sans-serif;color:#202c2b}h1{font:24pt Georgia,serif}h2{font-size:17pt}h3{font-size:12pt;margin-bottom:2mm}p{white-space:pre-wrap;overflow-wrap:anywhere;margin-top:0}.ders{break-before:page}section{break-inside:avoid}.bilgi{font-size:10pt;border-block:1px solid #bbb;padding:4mm 0}</style></head><body><h1>Dijital ders defteri</h1><h2>${e(ad)}</h2><p>2026–2027 · ${kayitlar.length} kayıtlı ders</p><p>Bu çıktı dijitale girilmiş notları içerir. Kâğıttaki çizimlerin ve ıslak imzaların taraması değildir.</p>${kayitlar
    .map(
      (k) =>
        `<article class="ders"><h2>${e(k.konu)}</h2><p class="bilgi">${e(k.tarih)} · ${k.sira}. ders · Basılı sayfa ${k.sayfa} · ${dersDurumlari[k.durum]} · Sürüm ${k.surum}<br>${k.giris === "kagit" ? "Kâğıttan aktarıldı" : "Dijital giriş"}${k.grup ? " · Grup " + e(k.grup) : ""}</p>${Object.entries(
          defterAlanlari,
        )
          .filter(([key]) => k[key as keyof DersKaydi])
          .map(
            ([key, f]) =>
              `<section><h3>${f.ad}</h3><p>${e(k[key as keyof DersKaydi])}</p></section>`,
          )
          .join(
            "",
          )}<p>Öğrencinin işareti: ${ozDurumlari[k.oz]}</p><p>Kaynak: ${e(k.kaynak)}</p></article>`,
    )
    .join("")}</body></html>`;
  frame.onload = () => {
    frame.contentWindow?.addEventListener("afterprint", () => frame.remove(), {
      once: true,
    });
    frame.contentWindow?.print();
  };
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 120000);
}
