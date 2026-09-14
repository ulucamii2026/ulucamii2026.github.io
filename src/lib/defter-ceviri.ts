/**
 * Ders defteri çevirisi — hoca Türkçe yazar, iletişim dili Fransızca olan aile Fransızca okur.
 *
 * Rıdvan (14 Eyl 2026): «iletişim tercihi fransızca olan velilere benim türkçe olarak doldurduğum ekranlar
 * fransızca olarak kaydedilsin.» Veli ders defterini doğrudan görmez; haftalık bülten defterden üretilir
 * (defterdenBulten). Bu modül defter kaydının çevirisini üretir ve kaydın YANINDA ayrı bir belgede saklar:
 *
 *   dersDefteri/{ref}/ceviriler/{kayitId}_{dil}   → { kayitId, dil, kaynakSurum, yontem, calisma, odev, sonraki, okunan, dikkat }
 *
 * İki katman:
 *   1. KALIP — hoca ekranındaki çip/hazır kayıt cümleleri ve kanonik notlar (defter-kaliplari.ts) burada elle
 *      yazılmış Fransızcayla birebir karşılanır; hiçbir servise gitmez. Cümleler cinsiyetsiz kurulur
 *      («Votre enfant a …», «Sa participation …») çünkü kayıtta çocuğun cinsiyeti yoktur.
 *   2. MAKİNE — hocanın serbest cümleleri (kalıba uymayan parçalar) `makine(metinler)` ile çevrilir; tarayıcıda bu,
 *      derneğin Apps Script'i (`tur: 'cevir'`, Firebase kimliği doğrulanır, Google Translate). Öğrenci adı kalıba
 *      hiç girmez; serbest metinde ad varsa servise gider — bilinçli karar, rapor 46.
 *
 * Kaynak kayıt `surum` değişince çeviri eskir (`kaynakSurum !== surum`) ve yeniden üretilir. Makine katmanı
 * başarısızsa YARIM çeviri yazılmaz (karışık dilli metin veliye gitmesin); kayıt Türkçe kalır, bülten aktarımı
 * uyarır ve «Çeviriyi yenile» / `npm run defter:cevir` tamamlar. Bu modül DOM bilmez; Firestore'a yalnız
 * ceviriDeposu ile dokunur.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from "firebase/firestore/lite";
import type { DefterDersi, DersKaydi } from "./ders-defteri";
import { GELMEDI_NOTU, dersDurumlari } from "./ders-defteri";
import { defterKaliplari, hazirKayitlar } from "./defter-kaliplari";
import konuFrVeri from "../data/ders-konu-fr";

export type CeviriDili = "fr";
export const CEVIRI_DILLERI: CeviriDili[] = ["fr"];
export type CeviriAlani = "calisma" | "odev" | "sonraki" | "okunan" | "dikkat";
export const CEVIRI_ALANLARI: CeviriAlani[] = ["calisma", "odev", "sonraki", "okunan", "dikkat"];
export type CeviriYontemi = "kalip" | "makine" | "karma";
export type DefterCevirisi = {
  id: string;
  kayitId: string;
  dil: CeviriDili;
  kaynakSurum: number;
  yontem: CeviriYontemi;
  calisma: string;
  odev: string;
  sonraki: string;
  okunan: string;
  dikkat: string;
  guncelleme?: unknown;
};
/** Serbest cümleleri çeviren işlev; sırayı korur, uzunluk eşit döner. Tarayıcıda Apps Script, CLI'da aynı uç. */
export type MakineCevirici = (metinler: string[], dil: CeviriDili) => Promise<string[]>;
/** Kural sınırları (Fransızca Türkçeden uzun; kayıt sınırlarının ~1,35 katı). */
export const CEVIRI_SINIRLARI: Record<CeviriAlani, number> = {
  calisma: 2400,
  odev: 1400,
  sonraki: 800,
  okunan: 600,
  dikkat: 600,
};
export const ceviriKimligi = (kayitId: string, dil: CeviriDili) => `${kayitId}_${dil}`;

/* ───────────────────────────── Fransızca tablolar ───────────────────────────── */
const KONU_FR = konuFrVeri as Record<string, string>;
/** Plandaki ders başlığının Fransızcası; sözlükte yoksa Türkçe başlık (özel ad gibi) kalır. */
export const konuFr = (konu: string) => KONU_FR[konu] || konu;
const KAYNAK_FR: Record<string, string> = {
  "Elifbâ / Kur'an-ı Kerim": "Elifbâ / Coran",
  "Ramazan özel programı": "Programme spécial Ramadan",
  "Kurban Bayramı özel programı": "Programme spécial Aïd al-Adha",
  "—": "—",
};
/** Kaynak satırı: kitap adları özel ad olarak kalır; «s.» → «p.», ansiklopedi maddesi Fransızca. */
export const kaynakFr = (kaynak: string) =>
  KAYNAK_FR[kaynak] ??
  kaynak
    .replace(/\bs\. /g, "p. ")
    .replace(/'Tâif' maddesi/g, "article « Tâif »")
    .replace(/\(Çocuk İlmihali\)/g, "(catéchisme pour enfants)");

export const DURUM_FR: Record<DersKaydi["durum"], string> = {
  islendi: "Cours fait",
  kismen: "Cours partiellement fait",
  ertelendi: "Cours reporté",
  gelmedi: "Absence",
  mazeretli: "Absence justifiée",
};
export const GELMEDI_NOTU_FR: Partial<Record<DersKaydi["durum"], string>> = {
  gelmedi: "Absence au cours.",
  mazeretli: "Absence justifiée ; le motif nous a été transmis.",
};
/** Sabit kalıp cümleleri (defter-kaliplari.ts ile birebir; birim testi eşleşmeyi denetler). */
const SABIT_FR: Record<string, string> = {
  // Konu
  "Konuyu iyi kavradı.": "Votre enfant a bien compris le sujet.",
  "Konuyu kısmen kavradı; tekrar gerekiyor.": "Votre enfant a compris le sujet en partie ; une révision est nécessaire.",
  "Zorlandı; birlikte tekrar ettik.": "Votre enfant a eu des difficultés ; nous avons révisé ensemble.",
  "Sorulan sorulara doğru cevap verdi.": "Votre enfant a répondu correctement aux questions posées.",
  // Katılım
  "Derse katılımı güzeldi.": "Sa participation au cours était bonne.",
  "Dersi dikkatle dinledi.": "Votre enfant a écouté le cours avec attention.",
  "Söz alarak derse katıldı.": "Votre enfant a pris la parole et participé au cours.",
  "Çekingendi; cesaretlendirince katıldı.": "Votre enfant était timide ; avec des encouragements, la participation est venue.",
  "Katılımı düşüktü; derse daha çok ilgilenmesi gerekiyor.": "Sa participation était faible ; votre enfant doit s’intéresser davantage au cours.",
  "Dikkati dağınıktı; toparlanınca iyi çalıştı.": "Votre enfant manquait de concentration au début, puis a bien travaillé.",
  "Özgüveni yerinde, elhamdülillah.": "Votre enfant fait preuve de confiance en soi, al-hamdulillah.",
  "Memnunum, elhamdülillah.": "Très bon travail, al-hamdulillah.",
  // Okuma
  "Harfleri tanıdı, seslerini doğru çıkardı.": "Votre enfant a reconnu les lettres et les a prononcées correctement.",
  "Harflerin seslerini karıştırıyor; evde pratik gerekiyor.": "Votre enfant confond les sons des lettres ; de la pratique à la maison est nécessaire.",
  "Okuduğum âyetleri benimle birlikte tekrar etti.": "Votre enfant a répété avec moi les versets que j’ai lus.",
  "Mahreçlere dikkat etmesi gerekiyor.": "Votre enfant doit faire attention aux points d’articulation (makhârij).",
  "Sureyi akıcı okudu.": "Votre enfant a lu la sourate avec fluidité.",
  "Sureyi okuyamadı; tekrar gerekiyor.": "Votre enfant n’a pas réussi à lire la sourate ; une révision est nécessaire.",
  // Gün notu
  "Geç geldi; dersin başını kaçırdı.": "Arrivée en retard ; le début du cours a été manqué.",
  "Ders sonuna doğru yoruldu.": "Vers la fin du cours, la fatigue s’est fait sentir.",
  "Bugün ilk kez katıldı; uyumu iyi.": "Première participation aujourd’hui ; bonne adaptation.",
  "Biraz rahatsızlandı ama ilgisini yitirmedi.": "Votre enfant ne se sentait pas très bien, mais n’a pas perdu son intérêt.",
  // Ödev · tekrar
  "Bugün işlediğimiz konuyu evde birlikte tekrar edin lütfen.": "Merci de réviser ensemble à la maison le sujet travaillé aujourd’hui.",
  "Evde birlikte uygulamalı pratik yapın lütfen.": "Merci de faire ensemble des exercices pratiques à la maison.",
  "Anne-baba olarak yardım edin lütfen.": "En tant que parents, merci de l’aider.",
  "Bu ders için ödev yok.": "Pas de devoir pour ce cours.",
  // Ödev · okuma · ezber
  "Öğrendiği harfleri evde her gün tekrar etsin.": "Que votre enfant révise chaque jour à la maison les lettres apprises.",
  "Elifbâ'yı baştan sona tekrar etsin.": "Que votre enfant révise l’Elifbâ du début à la fin.",
  "Harflerin mahreçlerine (kalın–ince, peltek) dikkat ederek çalışsın.": "Que votre enfant s’exerce en faisant attention aux points d’articulation des lettres (emphatiques, fines, interdentales).",
  "Bugün öğrendiği sureyi/duayı evde ezberlesin.": "Que votre enfant mémorise à la maison la sourate ou l’invocation apprise aujourd’hui.",
  "Ezberini bir sonraki derse kadar pekiştirsin.": "Que votre enfant consolide sa mémorisation d’ici le prochain cours.",
  // Sonraki adım
  "Bu konuyu bir daha tekrar edeceğiz.": "Nous reverrons ce sujet.",
  "Bireysel okuma yapacağız.": "Nous ferons une lecture individuelle.",
  "Veliyle görüşülecek.": "Un entretien avec les parents est prévu.",
  // Kanonik notlar (gelmeyen öğrenci)
  "Derse gelmedi.": GELMEDI_NOTU_FR.gelmedi!,
  "Mazereti bildirildi; derse gelmedi.": GELMEDI_NOTU_FR.mazeretli!,
};
/** Kısa etiket alanları (okunan/dikkat): madde madde. */
const MADDE_FR: Record<string, string> = {
  "Elifbâ harfleri": "Lettres de l’Elifbâ",
  "Fâtiha sûresi": "Sourate Al-Fâtiha",
  "Kısa sûreler": "Sourates courtes",
  Dualar: "Invocations",
  Tekbir: "Takbîr",
  "Kalın–ince harfler": "Lettres emphatiques et fines",
  "Peltek harfler": "Lettres interdentales",
  Mahreç: "Points d’articulation",
  Harekeler: "Voyelles (harakât)",
  "Uzatmalar (med)": "Allongements (madd)",
};
/** Derse bağlı kalıplar: konu/kaynak/sıradaki ders plandan geldiği için tam cümle bilinir. */
function dersSozlugu(d: DefterDersi, sonraki?: DefterDersi | null): Record<string, string> {
  const k = konuFr(d.konu);
  const s: Record<string, string> = {
    [`«${d.konu}» konusunu birlikte işledik.`]: `Nous avons travaillé ensemble le thème « ${k} ».`,
    [`«${d.konu}» konusunu evde tekrarlayın; kendisine sorun, bakalım hatırlayacak mı?`]: `Révisez à la maison le thème « ${k} » ; posez-lui des questions pour voir ce qui a été retenu.`,
    [`«${d.konu}» konusuna başladık; devam edeceğiz.`]: `Nous avons commencé le thème « ${k} » ; nous continuerons.`,
    [`«${d.konu}» konusuna devam.`]: `Suite du thème « ${k} ».`,
    [`«${d.konu}» konusu bugün işlenemedi; sonraki derse ertelendi.`]: `Le thème « ${k} » n’a pas pu être traité aujourd’hui ; il est reporté au prochain cours.`,
    [`Kaynak: ${d.kaynak}.`]: `Source : ${kaynakFr(d.kaynak)}.`,
  };
  if (sonraki) s[`Sıradaki konu: «${sonraki.konu}».`] = `Prochain thème : « ${konuFr(sonraki.konu)} ».`;
  return s;
}
/** Bir dersin tüm kalıp sözlüğü (sabit + derse bağlı). Uzun cümle önce eşleşir. */
export function kalipSozlugu(d: DefterDersi, sonraki?: DefterDersi | null): Record<string, string> {
  return { ...SABIT_FR, ...dersSozlugu(d, sonraki) };
}
/** Birim testi için: bu dersin ekrandaki her kalıp cümlesinin Fransızcası var mı? Eksikleri döndürür. */
export function eksikKaliplar(d: DefterDersi, sonraki?: DefterDersi | null): string[] {
  const s = kalipSozlugu(d, sonraki);
  const eksik: string[] = [];
  const gruplar = defterKaliplari(d, sonraki);
  for (const alan of CEVIRI_ALANLARI)
    for (const g of gruplar[alan])
      for (const k of g.kaliplar) {
        const tablo = alan === "okunan" || alan === "dikkat" ? MADDE_FR : s;
        if (!tablo[k.metin]) eksik.push(k.metin);
      }
  // Hazır kayıt metni birkaç kalıp cümlesidir; gerçek bölümleyici her parçayı tanımalı.
  for (const h of hazirKayitlar(d, sonraki))
    for (const metin of Object.values(h.alanlar))
      for (const p of bolumle(metin, s)) if (!p.fr) eksik.push(p.tr);
  for (const n of Object.values(GELMEDI_NOTU)) if (n && !s[n]) eksik.push(n);
  return [...new Set(eksik)];
}

/* ───────────────────────────── bölümleme (saf) ───────────────────────────── */
export type Parca = { tr: string; fr?: string };
const bosluk = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Cümle alanını kalıp/serbest parçalara ayırır. Kalıp cümleler sözlükten tanınır (ekranda birebir yazıldığı için
 * metinde de birebir durur); aralarda kalan her şey serbest parçadır ve makineye gider.
 */
export function bolumle(metin: string, sozluk: Record<string, string>): Parca[] {
  const m = bosluk(metin || "");
  if (!m) return [];
  const anahtarlar = Object.keys(sozluk).sort((a, b) => b.length - a.length);
  const parcalar: Parca[] = [];
  let pos = 0;
  let serbest = "";
  const serbestiKapat = () => {
    const s = bosluk(serbest);
    if (s) parcalar.push({ tr: s });
    serbest = "";
  };
  while (pos < m.length) {
    if (m[pos] === " ") {
      serbest += " ";
      pos++;
      continue;
    }
    const k = anahtarlar.find((a) => m.startsWith(a, pos) && sinirda(m, pos + a.length));
    if (k) {
      serbestiKapat();
      parcalar.push({ tr: k, fr: sozluk[k] });
      pos += k.length;
      continue;
    }
    // serbest metin: bir sonraki kalıp başlangıcına (ya da metin sonuna) kadar
    let sonraki = m.length;
    for (const a of anahtarlar) {
      const i = m.indexOf(a, pos + 1);
      if (i !== -1 && i < sonraki && sinirda(m, i + a.length) && (m[i - 1] === " " || m[i - 1] === undefined)) sonraki = i;
    }
    serbest += m.slice(pos, sonraki);
    pos = sonraki;
  }
  serbestiKapat();
  return parcalar;
}
const sinirda = (m: string, i: number) => i >= m.length || m[i] === " ";

/** Madde alanı (okunan/dikkat): virgülle ayrılmış maddeler; bilinen madde sözlükten, diğeri makineden. */
export function maddeleriBolumle(metin: string): Parca[] {
  return (metin || "")
    .split(",")
    .map((x) => bosluk(x))
    .filter(Boolean)
    .map((x) => (MADDE_FR[x] ? { tr: x, fr: MADDE_FR[x] } : { tr: x }));
}

/** Kaydın hangi alanlarında serbest metin var? (makine gerekip gerekmediğini söyler) */
export function kaydinParcalari(
  kayit: Pick<DersKaydi, CeviriAlani>,
  d: DefterDersi,
  sonraki?: DefterDersi | null,
): Record<CeviriAlani, Parca[]> {
  const sozluk = kalipSozlugu(d, sonraki);
  return {
    calisma: bolumle(kayit.calisma, sozluk),
    odev: bolumle(kayit.odev, sozluk),
    sonraki: bolumle(kayit.sonraki, sozluk),
    okunan: maddeleriBolumle(kayit.okunan),
    dikkat: maddeleriBolumle(kayit.dikkat),
  };
}
const birlestir = (parcalar: Parca[], madde: boolean) =>
  parcalar
    .map((p) => p.fr ?? p.tr)
    .filter(Boolean)
    .join(madde ? ", " : " ")
    .trim();

/**
 * Kaydın çevirisini üretir. Serbest parçalar tek seferde makineye gider (tekrarlar tek); makine başarısızsa
 * hata fırlatır — yarım çeviri döndürülmez. Yalnız kalıp varsa makine hiç çağrılmaz.
 */
export async function defterKaydiniCevir(
  kayit: DersKaydi,
  d: DefterDersi,
  sonraki: DefterDersi | null | undefined,
  dil: CeviriDili,
  makine: MakineCevirici,
): Promise<Omit<DefterCevirisi, "guncelleme">> {
  const parcalar = kaydinParcalari(kayit, d, sonraki);
  const serbest = [...new Set(CEVIRI_ALANLARI.flatMap((a) => parcalar[a].filter((p) => !p.fr).map((p) => p.tr)))];
  const kalipVar = CEVIRI_ALANLARI.some((a) => parcalar[a].some((p) => p.fr));
  let ceviri = new Map<string, string>();
  if (serbest.length) {
    const sonuc = await makine(serbest, dil);
    if (!Array.isArray(sonuc) || sonuc.length !== serbest.length || sonuc.some((s) => typeof s !== "string" || !s.trim()))
      throw Error("Makine çevirisi eksik döndü.");
    ceviri = new Map(serbest.map((tr, i) => [tr, bosluk(sonuc[i])]));
  }
  const alan = (a: CeviriAlani) =>
    birlestir(parcalar[a].map((p) => (p.fr ? p : { ...p, fr: ceviri.get(p.tr) })), a === "okunan" || a === "dikkat");
  const sonucKaydi = {
    id: ceviriKimligi(kayit.id, dil),
    kayitId: kayit.id,
    dil,
    kaynakSurum: kayit.surum,
    yontem: (serbest.length ? (kalipVar ? "karma" : "makine") : "kalip") as CeviriYontemi,
    calisma: alan("calisma"),
    odev: alan("odev"),
    sonraki: alan("sonraki"),
    okunan: alan("okunan"),
    dikkat: alan("dikkat"),
  };
  if (!sonucKaydi.calisma) sonucKaydi.calisma = DURUM_FR[kayit.durum] + ".";
  for (const a of CEVIRI_ALANLARI)
    if (sonucKaydi[a].length > CEVIRI_SINIRLARI[a]) throw Error("Çeviri, izin verilen uzunluğu aşıyor.");
  return sonucKaydi;
}
/** Çeviri güncel mi? (kayıt sürümü çevrilen sürümle aynıysa) */
export const ceviriGuncel = (kayit: Pick<DersKaydi, "surum">, c?: Pick<DefterCevirisi, "kaynakSurum"> | null) =>
  !!c && c.kaynakSurum === kayit.surum;

/* ───────────────────────────── Firestore ───────────────────────────── */
export function ceviriDeposu(db: Firestore, ref: string) {
  const yol = ["dersDefteri", ref, "ceviriler"] as const;
  return {
    async liste(): Promise<DefterCevirisi[]> {
      const s = await getDocs(collection(db, ...yol));
      return s.docs.map((x) => ({ ...(x.data() as DefterCevirisi), id: x.id }));
    },
    async kaydet(c: Omit<DefterCevirisi, "guncelleme">): Promise<void> {
      const { id, ...veri } = c;
      await setDoc(doc(db, ...yol, id), { ...veri, guncelleme: serverTimestamp() });
    },
  };
}
/** Toplu «gelmedi/mazeretli» kayıtlarının çevirisi: kanonik not → kalıp, makine yok. */
export async function topluGelmediCevirisiYaz(
  db: Firestore,
  girdiler: { ref: string; kayitId: string; durum: DersKaydi["durum"]; dil: CeviriDili }[],
): Promise<number> {
  const uygun = girdiler.filter((g) => GELMEDI_NOTU_FR[g.durum]);
  if (!uygun.length) return 0;
  const yigin = writeBatch(db);
  for (const g of uygun)
    yigin.set(doc(db, "dersDefteri", g.ref, "ceviriler", ceviriKimligi(g.kayitId, g.dil)), {
      kayitId: g.kayitId,
      dil: g.dil,
      kaynakSurum: 1,
      yontem: "kalip",
      calisma: GELMEDI_NOTU_FR[g.durum]!,
      odev: "",
      sonraki: "",
      okunan: "",
      dikkat: "",
      guncelleme: serverTimestamp(),
    });
  await yigin.commit();
  return uygun.length;
}

/* ───────────────────────────── bülten ───────────────────────────── */
/**
 * Haftalık bülten metni — Fransızca. defterdenBulten ile aynı kurallar (kanonik not durumun tekrarıdır, uzunluk
 * sınırı aşılırsa hata) ama etiketler ve konu başlıkları Fransızca; çevirisi güncel olmayan kayıt Türkçe metniyle
 * yazılır ve `eksik` listesinde döner (hoca uyarısı).
 */
export function defterdenBultenFr(
  kayitlar: DersKaydi[],
  ceviriler: DefterCevirisi[],
): { ders: string; odev: string; not: string; eksik: string[] } {
  const rows = [...kayitlar].sort((a, b) => a.id.localeCompare(b.id));
  if (!rows.length) throw Error("Seçilen hafta için kayıtlı ders defteri notu yok.");
  const c = new Map(ceviriler.filter((x) => x.dil === "fr").map((x) => [x.kayitId, x]));
  const eksik: string[] = [];
  const cev = (k: DersKaydi): Pick<DefterCevirisi, CeviriAlani> => {
    const x = c.get(k.id);
    if (x && ceviriGuncel(k, x)) return x;
    eksik.push(k.id);
    return k;
  };
  const et = (k: DersKaydi) => `${k.tarih} · cours ${k.sira} · ${konuFr(k.konu)}`;
  const kanonik = (k: DersKaydi) => k.calisma === GELMEDI_NOTU[k.durum];
  const ders = rows
    .map((k) => (kanonik(k) ? `${et(k)}\n${DURUM_FR[k.durum]}` : `${et(k)}\n${DURUM_FR[k.durum]} : ${cev(k).calisma}`))
    .join("\n\n");
  const odev = rows
    .filter((k) => k.odev)
    .map((k) => `${et(k)}\n${cev(k).odev}`)
    .join("\n\n");
  const not = rows
    .filter((k) => k.sonraki)
    .map((k) => `${et(k)}\n${cev(k).sonraki}`)
    .join("\n\n");
  if (ders.length > 2200 || odev.length > 1200 || not.length > 1000)
    throw Error(
      "Haftanın notları bültene tek seferde aktarmak için uzun. Ders defteri arşivinden gereken kısa özeti bültene yazın; hiçbir metin kesilmedi.",
    );
  return { ders, odev, not, eksik: [...new Set(eksik)] };
}
/** Türkçe durum etiketi → Fransızca (bülten ve ekran rozetleri için). */
export const durumFr = (durum: keyof typeof dersDurumlari) => DURUM_FR[durum];
