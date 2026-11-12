import type { Firestore } from "firebase/firestore/lite";
import { basiliDefterSayfasi } from "../lib/basili-defter";
import {
  defterDeposu,
  defterAlanlari,
  gunYoklamasi,
  gunDefterOzeti,
  topluGelmediYaz,
  defterEksikleri,
  katalogGunleri,
  type DefterEksikleri,
  type EksikKayit,
  yoklamaCelismesi,
  gelmediMi,
  GELMEDI_NOTU,
  YOKLAMA_DURUMU,
  type DefterDersi,
  type DersKaydi,
} from "../lib/ders-defteri";
import { bultenEsc as e, baskiAlaniYazdir } from "./bulten-gorunumu";
import { hocaDili, hocaYerel } from "../i18n/hoca";
import { tD } from "../i18n/hoca-metin/defter";
import { hazirKayitAciklamasi, hazirKayitEtiketi, kalipEtiketi, kalipGrupAdi } from "../i18n/hoca-metin/defter-kaliplari";
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
  mantikliKalipSec,
  kalipVar,
  sayacaGoreSirala,
  type KalipAlani,
} from "../lib/defter-kaliplari";

type Ogr = { ref: string; ad: string; soyad: string; durum?: string };
/* Arayüz adları (12 Kasım 2026): enum değerleri (islendi, yok, …) olduğu gibi kalır, yalnız ekranda görünen ad çevrilir.
   Dil sayfa yüklenirken sabitlenir; bu sabitler modül yüklenirken güvenle hesaplanır. */
const DURUM_ADI: Record<string, string> = {
  islendi: tD("durum.islendi"),
  kismen: tD("durum.kismen"),
  ertelendi: tD("durum.ertelendi"),
  gelmedi: tD("durum.gelmedi"),
  mazeretli: tD("durum.mazeretli"),
};
const OZ_ADI: Record<string, string> = { "": tD("oz.bos"), tekrar: tD("oz.tekrar"), destek: tD("oz.destek"), kendim: tD("oz.kendim") };
const YOK_ADI: Record<string, string> = { var: tD("yok.var"), yok: tD("yok.yok"), mazeret: tD("yok.mazeret"), gec: tD("yok.gec") };
const ALAN_ADI: Record<keyof typeof defterAlanlari, string> = {
  calisma: tD("alan.calisma"),
  okunan: tD("alan.okunan"),
  dikkat: tD("alan.dikkat"),
  odev: tD("alan.odev"),
  sonraki: tD("alan.sonraki"),
};
const YONTEM_ADI = { kalip: tD("ceviri.yontem.kalip"), makine: tD("ceviri.yontem.makine"), karma: tD("ceviri.yontem.karma") } as const;
const CEVRILIYOR = tD("ceviri.cevriliyor");
/** «N. ders» (tek anahtar: liste, başlık, yazdırma). */
const dersNo = (n: number) => tD("ders.sira", { n });
export function dersDefteri(
  root: HTMLElement,
  opt: {
    db: Firestore;
    ogrenciler: Ogr[];
    katalog: DefterDersi[];
    bugun: string;
    /** Öğrenci kartındaki «Ders defterini aç» ile gelen öğrenci: panel bu öğrenci seçili açılır. */
    baslangicRef?: string;
    /** Haftalık çalışma planından aynı ders gününe geçiş. */
    baslangicTarih?: string;
    /** Doldurulmamış defterler (14 Eyl 2026): panel bu görünümle açılır; hoca ekranı hesapladıysa hazır gelir ve
     *  her değişiklik geri bildirilir (başlıktaki sayı). */
    baslangicEksik?: boolean;
    eksikler?: DefterEksikleri | null;
    eksikDegisti?: (e: DefterEksikleri) => void;
    /** 14 Eyl 2026 (Rıdvan): velinin iletişim dili Türkçe değilse kayıt kaydedilince çevirisi de yazılır
     *  (dersDefteri/{ref}/ceviriler). hedefDil(ref) → 'fr' | null; makine = serbest cümleler için çeviri ucu. */
    ceviri?: { hedefDil: (ref: string) => CeviriDili | null; makine: MakineCevirici };
    /** 27 Eyl 2026 (Ezber Kilimi): «Ezber dinlendi» — seçili öğrenci için ezber dinleme paneli (hoca-ezber.ts) bu kaba
     *  gömülür; kaydedilen dinlemenin cümlesi «Bugün sınıfta» alanına eklenir, geri alınınca çıkar. */
    ezberDinle?: (
      kap: HTMLElement,
      ogrenci: Ogr,
      yardim: { tarih: string; cumleEklendi: (tr: string) => void; cumleKaldirildi: (tr: string) => void; kapat: () => void },
    ) => Promise<{ temizle(): void }>;
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
  /* Ezber dinleme (27 Eyl 2026): defter yeniden çizilince kap gider; önce kapatılır (canlı dinleme sızmasın). */
  let ezberGomulu: { temizle(): void } | undefined;
  let ezberSayac = 0;
  const ezberKapat = () => {
    ezberSayac++;
    ezberGomulu?.temizle();
    ezberGomulu = undefined;
    const kap = root.querySelector<HTMLElement>("[data-dd-ezber-kap]");
    if (kap) {
      kap.hidden = true;
      kap.innerHTML = "";
    }
    root.querySelector("[data-dd-ezber]")?.setAttribute("aria-expanded", "false");
  };
  const calismaAlani = () => root.querySelector<HTMLTextAreaElement>('[data-dd-form] textarea[name="calisma"]');
  const calismaDegisti = (ta: HTMLTextAreaElement, bilgi: string) => {
    kirli = true;
    buyut(ta);
    root
      .querySelectorAll<HTMLButtonElement>('[data-dd-kalip="calisma"]')
      .forEach((c) => c.setAttribute("aria-pressed", String(kalipVar(ta.value, c.dataset.metin || ""))));
    const p = root.querySelector("[data-dd-durum]");
    if (p) p.textContent = bilgi;
  };
  const ezberCumlesiEkle = (tr: string) => {
    const ta = calismaAlani();
    if (!ta) return;
    const yeni = ta.value.trim() ? `${ta.value.trim()} ${tr}` : tr;
    if (yeni.length > ta.maxLength) {
      const p = root.querySelector("[data-dd-durum]");
      if (p) p.textContent = tD("ezber.sigmadi");
      return;
    }
    ta.value = yeni;
    calismaDegisti(ta, tD("ezber.eklendi"));
  };
  const ezberCumlesiCikar = (tr: string) => {
    const ta = calismaAlani();
    const i = ta ? ta.value.lastIndexOf(tr) : -1;
    if (!ta || i < 0) return;
    ta.value = `${ta.value.slice(0, i)} ${ta.value.slice(i + tr.length)}`.replace(/\s{2,}/g, " ").trim();
    calismaDegisti(ta, tD("ezber.cikarildi"));
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
  const gunler = [...new Set(opt.katalog.map((d) => d.tarih))].sort();
  let ogrArama = "";
  const aramaMetni = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");
  const ogrEslesenler = () => opt.ogrenciler.filter((o) => aramaMetni(`${o.ad} ${o.soyad}`).includes(aramaMetni(ogrArama.trim())));
  const yakinGun = gunler.includes(opt.bugun) ? opt.bugun : gunler.findLast((g) => g < opt.bugun) || gunler[0];
  const ogrAramaSonuclari = () => {
    const liste = ogrEslesenler();
    return `<p class="kucuk" role="status">${liste.length ? tD("arama.sayi", { n: liste.length }) : tD("arama.yok")}</p>${liste.map((o) => `<button type="button" class="kucuk-dugme" data-dd-ogr-git="${e(o.ref)}" ${mesgul ? "disabled" : ""}>${e(o.ad + " " + o.soyad)}</button>`).join("")}`;
  };
  const secimGezintisi = (tur: "ogr" | "gun") => {
    const liste = tur === "ogr" ? opt.ogrenciler.map((o) => o.ref) : gunler;
    const i = liste.indexOf(tur === "ogr" ? ref : tarih);
    return `<div class="dd-gezinti" role="group" aria-label="${tD(tur === "ogr" ? "gez.ogr.aria" : "gez.gun.aria")}"><button type="button" class="kucuk-dugme" data-dd-${tur}-git="${e(liste[i - 1] || "")}" ${mesgul || i <= 0 ? "disabled" : ""}>${tD(tur === "ogr" ? "gez.ogr.onceki" : "gez.gun.onceki")}</button><button type="button" class="kucuk-dugme" data-dd-${tur}-git="${e(liste[i + 1] || "")}" ${mesgul || i >= liste.length - 1 ? "disabled" : ""}>${tD(tur === "ogr" ? "gez.ogr.sonraki" : "gez.gun.sonraki")}</button>${tur === "gun" && yakinGun ? `<button type="button" class="kucuk-dugme" data-dd-gun-git="${yakinGun}" ${mesgul || tarih === yakinGun ? "disabled" : ""}>${yakinGun === opt.bugun ? tD("gez.bugun") : tD("gez.songun")}</button>` : ""}</div>`;
  };
  let tarih = gunler.find((t) => t >= opt.bugun) || gunler.at(-1) || "";
  if (opt.baslangicTarih && gunler.includes(opt.baslangicTarih)) tarih = opt.baslangicTarih;
  if (opt.baslangicRef && opt.ogrenciler.some((o) => o.ref === opt.baslangicRef)) {
    ref = opt.baslangicRef;
    id = opt.katalog.find((x) => x.tarih === tarih)?.id || "";
  }
  /* Günün defter ilerlemesi (14 Eyl 2026): öğrenci → o gün yazılmış ders kimlikleri. Gün açılınca
     bir kez okunur (öğrenci başına küçük sorgu); kayıt sonrası yerinde güncellenir. Seçim listesinde
     ✓ / ◐ işareti ve «7/15 öğrenci tamam» satırı buradan gelir; sıradaki eksik öğrenciye tek dokunuş. */
  let gunDefter: Record<string, string[]> = {};
  let gunDefterTarihi = "";
  /* ── Doldurulmamış defterler (14 Eyl 2026, Rıdvan: «hangi gün hangi öğrencinin hangi dersi doldurulmamış, tek
     ekranda göreyim; ekran beni yönlendirsin»). Liste görünümü gün → öğrenci → ders; dokunuş defteri o kayıtla
     açar ve listedeki KALAN eksikler bir kuyruk olur: «Kaydet ve sonraki» sıradaki eksiğe gider. Kaydedilen /
     toplu açılan ders yerelde düşer (yeniden okuma yok); hoca ekranı başlıktaki sayıyı `eksikDegisti` ile alır. ── */
  let gorunum: "defter" | "eksikler" = opt.baslangicEksik ? "eksikler" : "defter";
  let eksik: DefterEksikleri | null = opt.eksikler || null;
  let eksikMesgul = false,
    eksikHata = "",
    eksikNot = "",
    defterTazele = false,
    kuyrukAktif = false;
  let kuyruk: EksikKayit[] = [];
  const YOK_ETIKET = YOK_ADI;
  const aktifler = () => opt.ogrenciler.filter((o) => o.durum !== "pasif");
  const ogrAdi = (r: string) => {
    const o = opt.ogrenciler.find((x) => x.ref === r);
    return o ? `${o.ad} ${o.soyad}` : r;
  };
  const gunEtiketi = (t: string) =>
    new Date(`${t}T12:00:00`).toLocaleDateString(hocaYerel(), { weekday: "long", day: "numeric", month: "long" });
  const gunKisa = (t: string) => new Date(`${t}T12:00:00`).toLocaleDateString(hocaYerel(), { day: "numeric", month: "short" });
  const eksikleriYukle = async () => {
    eksikMesgul = true;
    eksikHata = "";
    ciz();
    try {
      const e2 = await defterEksikleri(opt.db, aktifler().map((o) => o.ref), katalogGunleri(opt.katalog), opt.bugun);
      if (kapali) return;
      eksik = e2;
      opt.eksikDegisti?.(e2);
    } catch {
      if (!kapali) eksikHata = tD("eksik.hesaplanamadi");
    } finally {
      if (!kapali) {
        eksikMesgul = false;
        ciz();
      }
    }
  };
  /** Kaydedilen ya da toplu açılan ders eksik listesinden düşer; sayılar yeniden hesaplanır. */
  const eksikDus = (r: string, dersId: string) => {
    if (!eksik) return;
    let degisti = false;
    for (const g of eksik.gunler) {
      const i = g.eksikler.findIndex((x) => x.ref === r && x.id === dersId);
      if (i < 0) continue;
      const [x] = g.eksikler.splice(i, 1);
      g.dolu++;
      if (x.yoklama === "yok" || x.yoklama === "mazeret") eksik.gelmeyen--;
      degisti = true;
    }
    kuyruk = kuyruk.filter((x) => !(x.ref === r && x.id === dersId));
    if (!degisti) return;
    eksik.toplam = eksik.gunler.reduce((n, g) => n + g.eksikler.length, 0);
    eksik.ogrenciler = [...new Set(eksik.gunler.flatMap((g) => g.eksikler.map((x) => x.ref)))];
    opt.eksikDegisti?.(eksik);
  };
  const eksikSirasi = () => (eksik ? eksik.gunler.flatMap((g) => g.eksikler) : []);
  /** Defteri belli öğrenci/gün/dersle açar (seçim menülerinin yaptığı iş). */
  const defteriAc = (r: string, dersId: string) => {
    ref = r;
    tarih = opt.katalog.find((x) => x.id === dersId)?.tarih || tarih;
    id = dersId;
    kayitlar = [];
    kirli = false;
    mesaj = "";
    gorunum = "defter";
    void yukle();
  };
  const kuyrukBaslat = (x: EksikKayit) => {
    const s = eksikSirasi();
    const i = s.findIndex((y) => y.ref === x.ref && y.id === x.id);
    kuyruk = i >= 0 ? s.slice(i + 1) : [];
    kuyrukAktif = true;
    defteriAc(x.ref, x.id);
  };
  const eksikSatiri = () => {
    const sonrakiEksik = kuyruk[0];
    return `<p class="dd-eksik-satir" data-dd-eksik-satir><button type="button" class="kucuk-dugme" data-dd-eksikler-ac ${mesgul ? "disabled" : ""}>${tD("eksik.ac")}${eksik ? ` <b>${eksik.toplam}</b>` : ""}</button>${
      kuyrukAktif
        ? sonrakiEksik
          ? `<span>${tD("kuyruk.siradakiHtml", { ad: e(ogrAdi(sonrakiEksik.ref)), tarih: e(gunKisa(sonrakiEksik.tarih)), ders: dersNo(sonrakiEksik.sira) })}</span><button type="button" class="kucuk-dugme" data-dd-kuyruk-sonraki ${mesgul ? "disabled" : ""}>${tD("kuyruk.sonraki")}</button>`
          : `<span>${tD("kuyruk.bitti")}</span>`
        : ""
    }</p>`;
  };
  const eksiklerHtml = () => {
    const ek = eksik;
    const kilit = eksikMesgul ? "disabled" : "";
    let govde = "";
    if (!ek) govde = eksikHata ? `<p class="dd-uyari" role="status">${e(eksikHata)}</p>` : `<p class="not" role="status">${tD("eksik.hesaplaniyor")}</p>`;
    else if (!ek.toplam) govde = `<p class="not" role="status">${tD("eksik.tam", { n: ek.gunler.length })}</p>`;
    else
      govde = ek.gunler
        .filter((g) => g.eksikler.length)
        .map((g) => {
          const gelmeyen = g.eksikler.filter((x) => x.yoklama === "yok" || x.yoklama === "mazeret").length;
          const ogrenciler = [...new Set(g.eksikler.map((x) => x.ref))];
          return `<section class="dd-eksik-gun" data-dd-eksik-gun="${e(g.tarih)}"><h4>${e(gunEtiketi(g.tarih))} · ${tD("hafta.no", { n: g.hafta })} <small>${tD("eksik.gunOzet", { dolu: g.dolu, beklenen: g.beklenen, eksik: g.eksikler.length })}</small></h4>${
            !g.yoklamaVar ? `<p class="kucuk">${tD("eksik.yoklamaYok")}</p>` : ""
          }${
            gelmeyen ? `<p><button type="button" class="kucuk-dugme" data-dd-eksik-toplu="${e(g.tarih)}" ${kilit}>${tD("eksik.topluAc", { n: gelmeyen })}</button> <span class="kucuk">${tD("eksik.topluNot")}</span></p>` : ""
          }<ul class="dd-eksik-liste">${ogrenciler
            .map(
              (r) =>
                `<li><b>${e(ogrAdi(r))}</b><div class="dd-eksik-dersler">${g.eksikler
                  .filter((x) => x.ref === r)
                  .map(
                    (x) =>
                      `<button type="button" class="dd-eksik-ders${x.yoklama ? ` dd-yok-${e(x.yoklama)}` : ""}" data-dd-eksik="${e(x.ref)}" data-dd-eksik-ders="${e(x.id)}" ${kilit}><span>${dersNo(x.sira)} · ${e(x.konu)}</span><small>${x.yoklama ? tD("eksik.yoklama", { durum: e(YOK_ETIKET[x.yoklama] || x.yoklama) }) : tD("eksik.yoklamaIsaretsiz")}</small></button>`,
                  )
                  .join("")}</div></li>`,
            )
            .join("")}</ul></section>`;
        })
        .join("");
    const bosGunler = ek?.bosGunler.length
      ? `<p class="kucuk" data-dd-eksik-bos>${tD("eksik.bosGunler", { gunler: ek.bosGunler.map((g) => e(gunEtiketi(g))).join(", ") })}</p>`
      : "";
    const ozet = ek
      ? `<b>${tD("eksik.ozetKayit", { n: ek.toplam })}</b><span>${tD("eksik.ozetGun", { n: ek.gunler.filter((g) => g.eksikler.length).length })}</span><span>${tD("say.ogrenci", { n: ek.ogrenciler.length })}</span>${ek.gelmeyen ? `<span>${tD("eksik.ozetGelmedi", { n: ek.gelmeyen })}</span>` : ""}`
      : "";
    return `<h2>${tD("baslik")}</h2><div class="dd-eksik-bas"><h3>${tD("eksik.ac")}</h3><p class="kucuk">${tD("eksik.aciklama")}</p></div><div class="dd-eksik-ozet" data-dd-eksik-ozet>${ozet}<span class="dd-eksik-eylemler">${
      ek && ek.toplam ? `<button type="button" class="kucuk-dugme" data-dd-eksik-basla ${kilit}>${tD("eksik.basla")}</button>` : ""
    }<button type="button" class="kucuk-dugme" data-dd-eksik-yenile ${kilit}>${tD("eksik.yenile")}</button><button type="button" class="kucuk-dugme" data-dd-eksik-kapat ${kilit}>${tD("eksik.kapat")}</button></span></div>${
      eksikNot || (ek && eksikHata) ? `<p class="dd-durum" role="status" data-dd-eksik-durum>${e(eksikNot || eksikHata)}</p>` : ""
    }${govde}${bosGunler}`;
  };
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
  const hedefDil = () => (ref && opt.ceviri ? opt.ceviri.hedefDil(ref) : null);
  const ceviriSatiri = () => {
    const dil = hedefDil();
    if (!dil || !id) return "";
    const k = kayitlar.find((x) => x.id === id);
    const c = ceviriler.find((x) => x.id === `${id}_${dil}`);
    const guncel = !!k && !!c && ceviriGuncel(k, c);
    const durum = !k ? tD("ceviri.kaydedinceYapilir") : guncel ? tD("ceviri.kayitli", { yontem: YONTEM_ADI[c!.yontem] }) : c ? tD("ceviri.eski") : tD("ceviri.yok");
    return `<span>${tD("ceviri.veliDiliHtml", { durum: e(durum) })}</span>${k && !guncel ? `<button type="button" class="kucuk-dugme" data-dd-cevir ${mesgul ? "disabled" : ""}>${tD("ceviri.simdi")}</button>` : ""}`;
  };
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
      ceviriNotu(tD("ceviri.kaydedildi", { yontem: YONTEM_ADI[c.yontem] }));
    } catch {
      if (kapali) return;
      ceviriNotu(tD("ceviri.yapilamadi"));
    }
  };
  const ayrilabilir = () =>
    !mesgul &&
    (!kirli ||
      confirm(
        tD("ayrilma.onay"),
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
    ezberKapat();
    if (gorunum === "eksikler") {
      root.innerHTML = eksiklerHtml();
      return;
    }
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
      /* Türkçe dışı arayüzde: çevrilmiş etiket + altında KAYDEDİLECEK Türkçe cümle (soluk, lang="tr"). Türkçede çıktı eskisiyle aynı. */
      const kalipIci = (x: { etiket: string; metin: string }) =>
        hocaDili() === "tr"
          ? e(x.etiket)
          : `<span class="dd-kalip-govde"><span>${e(kalipEtiketi(x.etiket))}</span><span class="dd-kalip-tr" lang="tr">${e(x.metin)}</span></span>`;
      return `<div class="dd-kaliplar" role="group" aria-label="${tD("kalip.aria", { alan: e(ALAN_ADI[key]) })}">${gruplar
        .map(
          (g) =>
            `<div class="dd-kalip-grup"><span class="dd-kalip-ad">${e(kalipGrupAdi(g.ad))}</span>${sayacaGoreSirala(g.kaliplar, sayac)
              .map(
                (x) =>
                  `<button type="button" class="dd-kalip" data-dd-kalip="${key}" data-metin="${e(x.metin)}" aria-pressed="${kalipVar(deger, x.metin)}" title="${e(x.metin)}">${kalipIci(x)}</button>`,
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
          ? tD("alan.ipucuGelmediBos", { not: GELMEDI_NOTU[k!.durum] ?? "" })
          : gelmedi
            ? tD("alan.ipucuGelmedi")
            : tD("alan.ipucu");
      const deger = String(k?.[key] || "");
      const ezberSatiri =
        key === "calisma" && !gelmedi && opt.ezberDinle
          ? `<div class="dd-kaliplar dd-ezber-satir"><div class="dd-kalip-grup"><span class="dd-kalip-ad">${tD("ezber.etiket")}</span><button type="button" class="dd-kalip dd-ezber-dugme" data-dd-ezber aria-expanded="false" aria-controls="dd-ezber-kap">${tD("ezber.dugme")}</button></div></div><div class="ez-kok ez-gomulu" id="dd-ezber-kap" data-dd-ezber-kap hidden></div>`
          : "";
      return `<label>${ALAN_ADI[key]}<textarea name="${key}" maxlength="${f.max}" ${zorunlu ? "required" : ""} rows="${key === "calisma" ? 4 : 2}" placeholder="${e(ipucu)}">${e(deger)}</textarea></label>${kalipSatiri(key, deger)}${ezberSatiri}`;
    };
    /* Hazır kayıt: tek dokunuşla durum + standart notlar (yalnız boş alanlar). «Son kayıtla aynı»
       bu ders için en son kaydedilen notları kopyalar — sınıfın ortak ödevi bir kez yazılır. */
    const hazirBar = () =>
      gelmedi || !hazirlar.length
        ? ""
        : `<div class="dd-hazir" role="group" aria-label="${tD("hazir.baslik")}"><span class="dd-kalip-ad">${tD("hazir.baslik")}</span><div class="dd-hazir-dugmeler">${hazirlar
            .map(
              (h) =>
                `<button type="button" class="dd-hazir-dugme" data-dd-hazir="${e(h.id)}" title="${e(hazirKayitAciklamasi(h, sonrakiDers(d!)?.konu))}">${e(hazirKayitEtiketi(h))}</button>`,
            )
            .join("")}${
            sonKayit && !gelmediMi(sonKayit.durum || "")
              ? `<button type="button" class="dd-hazir-dugme dd-hazir-onceki" data-dd-oncekinden title="${tD("hazir.oncekiAcik")}">${tD("hazir.onceki")}</button>`
              : ""
          }</div><p class="kucuk">${tD("hazir.not")}</p></div>`;
    /** Yoklama ile defter durumu çelişiyorsa (lib karar verir) çevrilmiş uyarı metni; çelişki yoksa boş. */
    const celiskiMetni = (durum: string, y: string | undefined) =>
      yoklamaCelismesi(durum, y) ? tD("celiski", { yoklama: YOK_ADI[y!] ?? "", ders: DURUM_ADI[durum] ?? "" }) : "";
    const yokRozet = (sira: number) => {
      const y = yoklamaDurumu(ref, sira);
      return y ? `<span class="dd-yok dd-yok-${y}">${YOK_ADI[y] || y}</span>` : "";
    };
    const topluDugme = () => {
      const n = gelmeyenDersler().length;
      if (!n || yoklamaHatasi) return "";
      return `<div class="dd-toplu"><button type="button" data-dd-toplu ${mesgul ? "disabled" : ""}>${tD("toplu.dugme")} <small>${tD("say.ders", { n })}</small></button><p class="kucuk">${tD("toplu.aciklama")}</p></div>`;
    };

    root.innerHTML = `<h2>${tD("baslik")}</h2><p>${tD("giris.aciklama")}</p>${eksikSatiri()}<div class="dd-secim"><div class="dd-secim-alan"><label>${tD("ara.etiket")}<input type="search" data-dd-ara value="${e(ogrArama)}" placeholder="${tD("ara.yerTutucu")}" autocomplete="off" ${mesgul ? "disabled" : ""}></label><div class="dd-arama-sonuc" data-dd-arama-sonuc ${ogrArama.trim() ? "" : "hidden"}>${ogrArama.trim() ? ogrAramaSonuclari() : ""}</div><label>${tD("sec.ogrenci")}<select data-dd-ogr ${mesgul ? "disabled" : ""}><option value="">${tD("sec.ogrenciSec")}</option>${opt.ogrenciler.map((o) => { const y = [1, 2, 3].map((s) => yoklama[o.ref]?.[String(s)] || "").filter(Boolean); const hepsi = y.length === 3 && y.every((x) => x === y[0]) ? y[0] : ""; const dz = ogrDurumu(o.ref); const isaret = dz === "tamam" ? " ✓" : dz === "kismen" ? ` ◐ ${(gunDefter[o.ref] || []).length}/${gunDersSayisi()}` : ""; return `<option value="${e(o.ref)}" ${ref === o.ref ? "selected" : ""}>${e(o.ad + " " + o.soyad)}${isaret}${hepsi && hepsi !== "var" ? ` — ${e(YOK_ADI[hepsi] || hepsi)}` : ""}</option>`; }).join("")}</select></label>${secimGezintisi("ogr")}</div><div class="dd-secim-alan"><label>${tD("sec.gun")}<select data-dd-gun ${mesgul ? "disabled" : ""}>${gunler.map((t) => `<option value="${t}" ${t === tarih ? "selected" : ""}>${new Intl.DateTimeFormat(hocaYerel(), { day: "numeric", month: "long", weekday: "short" }).format(new Date(t + "T12:00:00Z"))}</option>`).join("")}</select></label>${secimGezintisi("gun")}<p class="kucuk">${tD("sec.gunNot")}</p></div></div>${(() => { if (!gunDefterTarihi || !gunDersSayisi()) return ""; const say = { tamam: 0, kismen: 0, bos: 0 }; opt.ogrenciler.forEach((o) => { say[ogrDurumu(o.ref)]++; }); const eksik = siradakiEksik(); return `<p class="dd-gun-ozet" data-dd-gun-ozet><span>${tD("gunozet.tamamHtml", { tamam: say.tamam, toplam: opt.ogrenciler.length })}</span>${say.kismen ? `<span>${tD("gunozet.kismen", { n: say.kismen })}</span>` : ""}${say.bos ? `<span>${tD("gunozet.baslanmadi", { n: say.bos })}</span>` : ""}${eksik ? `<button type="button" class="kucuk-dugme" data-dd-siradaki ${mesgul ? "disabled" : ""}>${tD("gunozet.siradaki", { ad: e(eksik.ad) })}</button>` : `<span class="rozet var">${tD("gunozet.tamam")}</span>`}</p>`; })()}<p data-dd-durum role="status" tabindex="-1">${e(mesaj)}</p>${yoklamaHatasi ? `<p class="dd-uyari" data-dd-yoklama-hata>${tD("yoklama.okunamadi")}</p>` : ""}${topluDugme()}${ref && !yuklendi && !mesgul ? `<button type="button" data-dd-yenile>${tD("yeniden.dene")}</button>` : ""}${ref && yuklendi ? `<nav class="dd-dersler" aria-label="${tD("dersler.aria")}">${gun.map((x) => `<button type="button" data-dd-ders="${x.id}" aria-pressed="${x.id === id}" ${mesgul ? "disabled" : ""}>${dersNo(x.sira)} <span>${e(x.konu)}</span><small>${kayitlar.some((k) => k.id === x.id) ? tD("dersler.kayitli") : tD("dersler.kayitYok")}</small>${yokRozet(x.sira)}</button>`).join("")}</nav>` : ""}${
      ref && yuklendi && d && k
        ? `<div class="dd-baslik"><h3>${e(d.konu)}</h3>${(() => { const y = yoklamaDurumu(ref, d.sira); return y ? `<p class="dd-yoklama dd-yok-${y}" data-dd-yoklama>${tD("yoklama.etiketHtml", { durum: e(YOK_ADI[y] || y) })}${gelmedi ? ` · ${tD("yoklama.durumSecildi")}` : ""}</p>` : ""; })()}${hedefDil() ? `<p class="dd-ceviri" data-dd-ceviri>${ceviriSatiri()}</p>` : ""}<p>${tD("baski.satirHtml", { sayfa: basiliDefterSayfasi(d), hafta: d.hafta, no: d.no })}</p><details><summary>${tD("plan.ozet")}</summary><p>${e(d.goal_tr)}</p><p lang="fr">${e(d.goal_fr)}</p><p>${e(d.prompt_tr)}</p><p lang="fr">${e(d.prompt_fr)}</p>${d.hedef_a_tr ? `<p><strong>${tD("plan.agrubu", { hedef: e(d.hedef_a_tr) })}</strong></p><p lang="fr">${e(d.hedef_a_fr)}</p>` : ""}<p>${tD("kaynak.satir", { kaynak: e(d.kaynak) })}</p><p>${tD("plan.uyari")}</p></details></div><form data-dd-form><fieldset ${mesgul ? "disabled" : ""}><legend class="sr-only">${tD("form.legend", { ad: e(adi()) })}</legend>${hazirBar()}${gelmedi ? "" : `<p class="dd-aciklama">${tD("form.cakismaNot")}</p>${hocaDili() === "tr" ? "" : `<p class="dd-aciklama">${tD("kalip.turkceNot")}</p>`}`}<label class="dd-durum-secim">${tD("form.durum")}<select name="durum" required>${secenek({ "": tD("durum.sec"), ...DURUM_ADI }, k.durum)}</select></label>${(() => { const c = celiskiMetni(k.durum, yoklamaDurumu(ref, d.sira)); return c ? `<p class="dd-uyari" data-dd-celiski>${e(c)} ${tD("celiski.not")}</p>` : ""; })()}${alan("calisma")}${alan("odev")}<details class="dd-ayrinti"><summary>${tD("form.ayrinti")}</summary><label>${tD("form.kaynak")}<select name="giris">${secenek({ dijital: tD("form.giris.dijital"), kagit: tD("form.giris.kagit") }, k.giris)}</select></label>${d.kod === "kuran" ? `<label>${tD("form.grup")}<select name="grup">${secenek({ "": tD("oz.bos"), A: tD("form.grup.a"), B: tD("form.grup.b") }, k.grup)}</select></label>${alan("okunan")}${alan("dikkat")}` : '<input type="hidden" name="grup" value=""><input type="hidden" name="okunan" value=""><input type="hidden" name="dikkat" value="">'}${alan("sonraki")}<label>${tD("form.oz")}<select name="oz">${secenek(OZ_ADI, k.oz)}</select></label><p class="dd-aciklama">${tD("form.ozNot")}</p></details><div class="dd-kaydet"><button type="submit" value="kaydet">${tD("form.kaydet")}</button><button type="submit" value="sonraki">${tD("form.kaydetSonraki")}<span class="dd-uzun"> ${tD("form.derseGec")}</span></button></div></fieldset></form><div class="bulten-eylemler"><button type="button" data-dd-yenile ${mesgul ? "disabled" : ""}>${tD("form.yenile")}</button><button type="button" data-dd-kopyala ${mesgul ? "disabled" : ""}>${tD("form.kopyala")}</button></div><details class="dd-arsiv"><summary>${tD("arsiv.baslik", { n: kayitlar.length })}</summary><p>${tD("arsiv.aciklama", { ad: e(adi()) })}</p><div class="bulten-eylemler"><button type="button" data-dd-indir>${tD("arsiv.indir")}</button><button type="button" data-dd-yazdir>${tD("arsiv.yazdir")}</button></div><ul>${
            [...kayitlar]
              .reverse()
              .map(
                (x) =>
                  `<li><button type="button" data-dd-arsiv="${e(x.id)}">${e(x.tarih)} · ${dersNo(x.sira)} · ${e(x.konu)}<small>${tD("arsiv.altSatir", { durum: DURUM_ADI[x.durum], surum: x.surum })}</small></button></li>`,
              )
              .join("") || `<li>${tD("arsiv.bos")}</li>`
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
    mesaj = ref ? tD("yukleniyor.defter") : tD("yukleniyor.yoklama");
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
          ? tD("yuklendi.var")
          : tD("yuklendi.yok");
    } catch {
      if (t === token)
        mesaj =
          tD("yukle.hata");
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
      if ((ev.target as HTMLElement).closest(".ez-kok")) return;
      if ((ev.target as HTMLElement).matches("[data-dd-ara]")) {
        ogrArama = (ev.target as HTMLInputElement).value;
        const sonuclar = root.querySelector<HTMLElement>("[data-dd-arama-sonuc]");
        if (sonuclar) {
          sonuclar.hidden = !ogrArama.trim();
          sonuclar.innerHTML = ogrArama.trim() ? ogrAramaSonuclari() : "";
        }
        return;
      }
      if ((ev.target as HTMLElement).closest("[data-dd-form]")) {
        kirli = true;
        const p = root.querySelector("[data-dd-durum]");
        if (p) p.textContent = tD("kirli");
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
      if (t.closest(".ez-kok")) return;
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
        ogrArama = "";
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
      if (!b || mesgul || b.closest(".ez-kok")) return;
      if (b.hasAttribute("data-dd-ezber")) {
        const kap = root.querySelector<HTMLElement>("[data-dd-ezber-kap]");
        const o = opt.ogrenciler.find((x) => x.ref === ref);
        if (!kap || !o || !opt.ezberDinle) return;
        if (!kap.hidden) {
          ezberKapat();
          return;
        }
        const benim = ++ezberSayac;
        kap.hidden = false;
        kap.innerHTML = `<p class="ez-bilgi" role="status">${tD("ezber.aciliyor")}</p>`;
        b.setAttribute("aria-expanded", "true");
        try {
          const g = await opt.ezberDinle(kap, o, { tarih, cumleEklendi: ezberCumlesiEkle, cumleKaldirildi: ezberCumlesiCikar, kapat: () => { ezberKapat(); b.focus(); } });
          if (benim !== ezberSayac || !kap.isConnected) g.temizle();
          else ezberGomulu = g;
        } catch {
          if (benim === ezberSayac && kap.isConnected) kap.innerHTML = `<p class="not hata" role="status">${tD("ezber.acilamadi")}</p>`;
        }
        return;
      }
      if (b.hasAttribute("data-dd-ogr-git") || b.hasAttribute("data-dd-gun-git")) {
        const ogrenci = b.hasAttribute("data-dd-ogr-git");
        const select = root.querySelector<HTMLSelectElement>(ogrenci ? "[data-dd-ogr]" : "[data-dd-gun]");
        const deger = ogrenci ? b.dataset.ddOgrGit : b.dataset.ddGunGit;
        if (!select || !deger) return;
        select.value = deger;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
      /* Kalıp çipi: metin alanında yerinde ekle/çıkar; sayfa yeniden çizilmez (imleç ve kaydırma
         durur, çipler yer değiştirmez). Sayaç yalnız eklemede artar. */
      if (b.dataset.ddKalip) {
        const key = b.dataset.ddKalip as KalipAlani;
        const metin = b.dataset.metin || "";
        const ta = root.querySelector<HTMLTextAreaElement>(`[data-dd-form] textarea[name="${key}"]`);
        if (!ta || !metin) return;
        const d = ders();
        if (!d) return;
        const kaliplar = defterKaliplari(d, sonrakiDers(d))[key].flatMap((g) => g.kaliplar);
        const secilen = kaliplar.find((x) => x.metin === metin);
        if (!secilen) return;
        const vardi = kalipVar(ta.value, metin);
        const sonuc = mantikliKalipSec(ta.value, secilen, kaliplar, ALAN_BICIMI[key]);
        if (sonuc.metin.length > ta.maxLength) {
          const p = root.querySelector("[data-dd-durum]");
          if (p) p.textContent = tD("kalip.sinir");
          return;
        }
        ta.value = sonuc.metin;
        root.querySelectorAll<HTMLButtonElement>(`[data-dd-kalip="${key}"]`).forEach((c) =>
          c.setAttribute("aria-pressed", String(kalipVar(ta.value, c.dataset.metin || ""))));
        if (!vardi) sayacArtir(metin);
        kirli = true;
        buyut(ta);
        const p = root.querySelector("[data-dd-durum]");
        if (p) p.textContent = sonuc.kaldirilan.length
          ? tD("kalip.yerine", { eski: sonuc.kaldirilan.map(kalipEtiketi).join(", "), yeni: kalipEtiketi(secilen.etiket) })
          : tD("kirli");
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
                ? { id: "onceki", etiket: tD("hazir.onceki"), aciklama: "", durum: s.durum, alanlar: { calisma: s.calisma || "", odev: s.odev || "", sonraki: s.sonraki || "", okunan: s.okunan || "", dikkat: s.dikkat || "" } }
                : undefined;
            })();
        if (!hazir) return;
        const { taslak, atlanan } = hazirKaydiUygula(k, hazir);
        kirli = true;
        const hazirAdi = hazirKayitEtiketi(hazir);
        mesaj = atlanan.length
          ? tD("hazir.uygulandiDolu", { etiket: hazirAdi, alanlar: atlanan.map((a) => ALAN_ADI[a].split(" ·")[0]).join(", ") })
          : tD("hazir.uygulandi", { etiket: hazirAdi });
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
      if (b.hasAttribute("data-dd-eksikler-ac")) {
        if (!ayrilabilir()) return;
        gorunum = "eksikler";
        kuyrukAktif = false;
        kuyruk = [];
        eksikNot = "";
        if (!eksik && !eksikMesgul) void eksikleriYukle();
        else ciz();
        return;
      }
      if (b.hasAttribute("data-dd-eksik-kapat")) {
        gorunum = "defter";
        if (ref && defterTazele) {
          defterTazele = false;
          void yukle();
        } else ciz();
        return;
      }
      if (b.hasAttribute("data-dd-eksik-yenile")) {
        if (!eksikMesgul) void eksikleriYukle();
        return;
      }
      if (b.hasAttribute("data-dd-eksik-basla")) {
        const ilk = eksikSirasi()[0];
        if (ilk && !eksikMesgul) kuyrukBaslat(ilk);
        return;
      }
      if (b.hasAttribute("data-dd-eksik")) {
        const x = eksikSirasi().find((y) => y.ref === b.getAttribute("data-dd-eksik") && y.id === b.getAttribute("data-dd-eksik-ders"));
        if (x && !eksikMesgul) kuyrukBaslat(x);
        return;
      }
      if (b.hasAttribute("data-dd-kuyruk-sonraki")) {
        if (!ayrilabilir()) return;
        const n = kuyruk.shift();
        if (n) defteriAc(n.ref, n.id);
        else {
          kuyrukAktif = false;
          ciz();
        }
        return;
      }
      if (b.hasAttribute("data-dd-eksik-toplu")) {
        /* Gelmeyenlerin o günkü eksik kayıtları tek işlemde açılır (yalnız create; kural var olan belgeyi korur). */
        const t0 = b.getAttribute("data-dd-eksik-toplu") || "";
        const adaylar = (eksik?.gunler.find((g) => g.tarih === t0)?.eksikler || []).filter((x) => x.yoklama === "yok" || x.yoklama === "mazeret");
        const girdiler = adaylar.flatMap((x) => {
          const d0 = opt.katalog.find((k) => k.id === x.id);
          return d0 ? [{ ref: x.ref, ders: d0, durum: YOKLAMA_DURUMU[x.yoklama] }] : [];
        });
        if (!girdiler.length || eksikMesgul) return;
        const kisi = new Set(girdiler.map((x) => x.ref)).size;
        if (
          !confirm(
            tD("eksik.onay", { n: girdiler.length, ogr: tD("say.ogrenci", { n: kisi }) }),
          )
        )
          return;
        eksikMesgul = true;
        eksikHata = "";
        eksikNot = "";
        ciz();
        try {
          await topluGelmediYaz(opt.db, girdiler);
          if (opt.ceviri) {
            const cv = opt.ceviri;
            await topluGelmediCevirisiYaz(
              opt.db,
              girdiler.flatMap((x) => {
                const dil = cv.hedefDil(x.ref);
                return dil ? [{ ref: x.ref, kayitId: x.ders.id, durum: x.durum, dil }] : [];
              }),
            ).catch(() => {
              /* çeviri yazılamazsa kayıtlar yine açıldı; «Şimdi çevir» tamamlar */
            });
          }
          if (kapali) return;
          for (const x of girdiler) eksikDus(x.ref, x.ders.id);
          gunDefterTarihi = "";
          defterTazele = true;
          eksikNot = tD("toplu.acildi", { n: girdiler.length, ogr: tD("say.ogrenci", { n: kisi }) });
        } catch {
          if (kapali) return;
          eksikHata = tD("eksik.topluHata");
        } finally {
          if (!kapali) {
            eksikMesgul = false;
            ciz();
          }
        }
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
        mesaj = tD("toplu.kontrol");
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
            mesaj = tD("toplu.hepsiVar");
            ciz();
            root.querySelector<HTMLElement>("[data-dd-durum]")?.focus();
            return;
          }
          const kisi = new Set(yazilacak.map((x) => x.ref)).size;
          if (
            !confirm(
              tD("toplu.onay", { n: yazilacak.length, ogr: tD("say.ogrenci", { n: kisi }) }),
            )
          ) {
            mesgul = false;
            mesaj = "";
            ciz();
            return;
          }
          mesaj = tD("toplu.aciliyor");
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
          const ozet = tD("toplu.acildi", { n: yazilacak.length, ogr: tD("say.ogrenci", { n: kisi }) });
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
            tD("toplu.hata");
          ciz();
        }
      }
      if (b.hasAttribute("data-dd-kopyala")) {
        const k = al();
        if (!k) return;
        try {
          await navigator.clipboard.writeText(
            Object.entries(defterAlanlari)
              .map(([key]) => `${ALAN_ADI[key as keyof typeof defterAlanlari]}: ${k[key as keyof DersKaydi]}`)
              .join("\n"),
          );
          mesaj = tD("kopya.tamam");
        } catch {
          mesaj = tD("kopya.hata");
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
      mesaj = tD("kayit.kaydediliyor");
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
        mesaj = tD("kayit.tamam");
        eksikDus(ref, saved.id);
        void ceviriYaz(saved, ref); // veli dili Fransızca ise; kaydetmeyi ve «sonraki»ye geçişi bekletmez
        if (sonraki && kuyrukAktif) {
          /* Eksik kuyruğu (14 Eyl 2026): listeden gelindiyse sıradaki eksik kayda gidilir — gün ve öğrenci değişebilir. */
          const n = kuyruk.shift();
          if (n) {
            ref = n.ref;
            tarih = n.tarih;
            id = n.id;
            kayitlar = [];
            mesgul = false;
            await yukle();
            if (kapali) return;
            mesaj = tD("kayit.siradakiEksik", { ad: adi(), tarih: gunKisa(n.tarih), ders: dersNo(n.sira) });
            ciz();
            root.querySelector<HTMLElement>("[name=durum]")?.focus();
            return;
          }
          kuyrukAktif = false;
          mesaj = tD("kayit.kuyrukBitti");
        } else if (sonraki) {
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
              mesaj = tD("kayit.siradakiOgrenci", { ad: adi() });
              ciz();
              root.querySelector<HTMLElement>("[name=durum]")?.focus();
              return;
            }
            mesaj = tD("kayit.gunBitti");
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
        /* Çakışma iletisi lib'den Türkçe gelir (aynı metin sözlükte `kayit.cakisma`); eşleştirme metne bağlı kaldığı için dokunulmadı. */
        mesaj = (err as Error).message?.includes("başka bir ekranda")
          ? tD("kayit.cakisma")
          : tD("kayit.hata");
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
  if (gorunum === "eksikler" && !eksik) void eksikleriYukle();
  return {
    ayrilabilir,
    temizle: () => {
      kapali = true;
      token++;
      ezberKapat();
      ac.abort();
    },
  };
}

export function defterYazdir(kayitlar: DersKaydi[], ad: string) {
  if (!kayitlar.length) return;
  baskiAlaniYazdir(
    "baski-defter",
    `<h1>${tD("yazdir.baslik")}</h1><h2>${e(ad)}</h2><p>${tD("yazdir.ozet", { n: kayitlar.length })}</p><p>${tD("yazdir.not")}</p>${kayitlar
      .map(
        (k) =>
          `<article class="ders"><h2>${e(k.konu)}</h2><p class="bilgi">${tD("yazdir.bilgi", { tarih: e(k.tarih), ders: dersNo(k.sira), sayfa: basiliDefterSayfasi(k), durum: DURUM_ADI[k.durum], surum: k.surum })}<br>${k.giris === "kagit" ? tD("yazdir.kagit") : tD("yazdir.dijital")}${k.grup ? " · " + tD("yazdir.grup", { g: e(k.grup) }) : ""}</p>${Object.entries(
            defterAlanlari,
          )
            .filter(([key]) => k[key as keyof DersKaydi])
            .map(
              ([key]) =>
                `<section><h3>${ALAN_ADI[key as keyof typeof defterAlanlari]}</h3><p>${e(k[key as keyof DersKaydi])}</p></section>`,
            )
            .join(
              "",
            )}<p>${tD("yazdir.isaret", { oz: OZ_ADI[k.oz] })}</p><p>${tD("kaynak.satir", { kaynak: e(k.kaynak) })}</p></article>`,
      )
      .join("")}`,
    hocaDili(),
    tD("yazdir.pencere", { ad }),
  );
}
