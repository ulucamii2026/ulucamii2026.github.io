import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore/lite";

export type DefterDersi = {
  id: string;
  tarih: string;
  sira: number;
  no: number;
  hafta: number;
  sayfa: number;
  konu: string;
  kaynak: string;
  kod: string;
  goal_tr: string;
  goal_fr: string;
  prompt_tr: string;
  prompt_fr: string;
  hedef_a_tr?: string;
  hedef_a_fr?: string;
};
export type DersKaydi = {
  id: string;
  donem: string;
  tarih: string;
  sira: number;
  no: number;
  sayfa: number;
  konu: string;
  kaynak: string;
  grup: "" | "A" | "B";
  durum: "islendi" | "kismen" | "ertelendi" | "gelmedi" | "mazeretli";
  giris: "kagit" | "dijital";
  calisma: string;
  okunan: string;
  dikkat: string;
  oz: "tekrar" | "destek" | "kendim" | "";
  odev: string;
  sonraki: string;
  surum: number;
  guncelleme?: unknown;
};
export const defterAlanlari = {
  calisma: { ad: "Çalışmam · yazdığım / anlattığım", max: 1800 },
  okunan: { ad: "Okuduğum bölüm / bireysel hedef", max: 400 },
  dikkat: { ad: "Dikkat edeceğim nokta", max: 400 },
  odev: { ad: "Ödevim ve tekrarım · kitap / sayfa", max: 1000 },
  sonraki: { ad: "Hocamla sonraki adım", max: 600 },
};
export const dersDurumlari = {
  islendi: "İşlendi",
  kismen: "Kısmen işlendi",
  ertelendi: "Ertelendi",
  gelmedi: "Öğrenci gelmedi",
  mazeretli: "Mazeretli — gelmedi",
};
/* 12 Eyl 2026: `gelmedi` ve `mazeretli` eklendi. Öncesinde yalnız üç durum vardı; gelmeyen
   öğrencinin kaydı da `islendi` işaretleniyordu — yani ders o öğrenciye İŞLENMİŞ görünüyordu.
   12 Eylül'ün 45 kaydının 30'u böyleydi ve hoca «gelmedi.», «Derse katılmadı.», «Ya, işte
   yoktu.» gibi 15'ten fazla farklı cümleyi elle yazmıştı. Artık yoklamadan türetiliyor. */
export const YOKLAMA_DURUMU: Record<string, DersKaydi["durum"]> = {
  yok: "gelmedi",
  mazeret: "mazeretli",
};
/** Gelmeyen öğrenci için kanonik çalışma notu. Hoca boş bırakırsa depo bunu yazar. */
export const GELMEDI_NOTU: Partial<Record<DersKaydi["durum"], string>> = {
  gelmedi: "Derse gelmedi.",
  mazeretli: "Mazereti bildirildi; derse gelmedi.",
};
export const gelmediMi = (durum: string) => durum === "gelmedi" || durum === "mazeretli";
/** Yoklama ile defter kaydı çelişiyor mu? Çelişki engellenmez, yalnız uyarılır. */
export function yoklamaCelismesi(durum: string, yoklama: string | undefined) {
  if (!yoklama || !durum) return "";
  if (gelmediMi(durum) && (yoklama === "var" || yoklama === "gec"))
    return `Yoklamada «${yoklama === "gec" ? "Geç" : "Var"}» işaretli ama ders «${dersDurumlari[durum as keyof typeof dersDurumlari]}» kaydediliyor.`;
  if (!gelmediMi(durum) && (yoklama === "yok" || yoklama === "mazeret"))
    return `Yoklamada «${yoklama === "yok" ? "Yok" : "Mazeretli"}» işaretli ama ders «${dersDurumlari[durum as keyof typeof dersDurumlari]}» kaydediliyor.`;
  return "";
}
export const ozDurumlari = {
  "": "İşaretlenmedi",
  tekrar: "Tekrar edeceğim",
  destek: "Destekle yaptım",
  kendim: "Kendim yaptım",
};
export function defterDeposu(db: Firestore, ref: string) {
  return {
    async liste(): Promise<DersKaydi[]> {
      const s = await getDocs(collection(db, "dersDefteri", ref, "kayitlar"));
      return s.docs
        .map((d) => ({ ...d.data(), id: d.id }) as DersKaydi)
        .sort((a, b) => a.id.localeCompare(b.id));
    },
    async kaydet(girdi: DersKaydi, beklenen: number): Promise<DersKaydi> {
      // Gelmeyen öğrencide hoca çalışma notunu boş bırakabilir; kanonik cümle burada yazılır
      // (Firestore kuralı boş `calisma` kabul etmez ve her hoca farklı cümle yazmasın diye).
      const k: DersKaydi = {
        ...girdi,
        calisma: girdi.calisma.trim() || GELMEDI_NOTU[girdi.durum] || "",
      };
      if (
        k.id !== k.tarih + "_" + k.sira ||
        ![1, 2, 3].includes(k.sira) ||
        !k.calisma.trim() ||
        !Object.keys(dersDurumlari).includes(k.durum) ||
        !["kagit", "dijital"].includes(k.giris)
      )
        throw Error("Dersin durumunu ve çalışma notunu doldurun.");
      for (const [alan, { max }] of Object.entries(defterAlanlari))
        if (
          typeof k[alan as keyof DersKaydi] !== "string" ||
          String(k[alan as keyof DersKaydi]).length > max
        )
          throw Error("Not, izin verilen uzunluğu aşıyor.");
      return runTransaction(db, async (tx) => {
        const r = doc(db, "dersDefteri", ref, "kayitlar", k.id);
        const once = await tx.get(r);
        if ((once.exists() ? once.data()!.surum : 0) !== beklenen)
          throw Error(
            "Bu ders başka bir ekranda değişti. Notunuzu kopyalayıp kaydı yeniden yükleyin.",
          );
        const sonuc = { ...k, surum: beklenen + 1 };
        const { id: _, guncelleme: __, ...data } = sonuc;
        tx.set(r, { ...data, guncelleme: serverTimestamp() });
        return sonuc;
      });
    },
  };
}

/**
 * Bir ders gününün yoklaması: öğrenci ref'i → { sıra (1-3) → 'var' | 'yok' | 'mazeret' | 'gec' }.
 * `dersler` alanı 6 Eylül'den önceki kayıtlarda yok; o kayıtlarda tek `durum` üç derse yayılır
 * (hoca ekranındaki yoklamaYukle ile aynı kural).
 */
export async function gunYoklamasi(db: Firestore, tarih: string) {
  const s = await getDocs(
    query(collection(db, "yoklama"), where("tarih", "==", tarih)),
  );
  const out: Record<string, Record<string, string>> = {};
  for (const d of s.docs) {
    const v = d.data() as {
      ref?: string;
      dersler?: Record<string, string>;
      durum?: string;
    };
    const ref = v.ref || d.id.split("_")[0];
    out[ref] =
      v.dersler && typeof v.dersler === "object"
        ? { ...v.dersler }
        : v.durum
          ? { 1: v.durum, 2: v.durum, 3: v.durum }
          : {};
  }
  return out;
}

export type TopluGirdi = { ref: string; ders: DefterDersi; durum: DersKaydi["durum"] };
/**
 * Gelmeyen öğrencilerin o günkü defter kayıtlarını tek işlemde açar. VAR OLAN KAYDA DOKUNMAZ
 * (yalnız `create`; hocanın yazdığı bir not asla ezilmez) ve yoklamada gelmemiş sayılmayan
 * öğrenciyi hiç yazmaz. 12 Eylül'de bu 30 kaydın elle yazılması demekti.
 */
export async function topluGelmediYaz(
  db: Firestore,
  girdiler: TopluGirdi[],
): Promise<number> {
  if (!girdiler.length) return 0;
  const yigin = writeBatch(db);
  for (const { ref, ders: d, durum } of girdiler) {
    if (!gelmediMi(durum)) throw Error("Toplu doldurma yalnız gelmeyen dersler içindir.");
    yigin.set(doc(db, "dersDefteri", ref, "kayitlar", d.id), {
      donem: "2026-2027",
      tarih: d.tarih,
      sira: d.sira,
      no: d.no,
      sayfa: d.sayfa,
      konu: d.konu,
      kaynak: d.kaynak,
      grup: "",
      durum,
      giris: "dijital",
      calisma: GELMEDI_NOTU[durum]!,
      okunan: "",
      dikkat: "",
      oz: "",
      odev: "",
      sonraki: "",
      surum: 1,
      guncelleme: serverTimestamp(),
    });
  }
  await yigin.commit();
  return girdiler.length;
}

/** Bilinçli hoca eylemiyle bülten taslağına aktarılır; yoklama veya başarı notu üretmez. */
export function defterdenBulten(kayitlar: DersKaydi[]) {
  const rows = [...kayitlar].sort((a, b) => a.id.localeCompare(b.id));
  const et = (k: DersKaydi) => `${k.tarih} · ${k.sira}. ders · ${k.konu}`;
  const ders = rows
    .map((k) =>
      // Gelmeyen derste kanonik not durumun tekrarıdır; bültende iki kez yazılmaz.
      k.calisma === GELMEDI_NOTU[k.durum]
        ? `${et(k)}\n${dersDurumlari[k.durum]}`
        : `${et(k)}\n${dersDurumlari[k.durum]}: ${k.calisma}`,
    )
    .join("\n\n");
  const odev = rows
    .filter((k) => k.odev)
    .map((k) => `${et(k)}\n${k.odev}`)
    .join("\n\n");
  const not = rows
    .filter((k) => k.sonraki)
    .map((k) => `${et(k)}\n${k.sonraki}`)
    .join("\n\n");
  if (!rows.length)
    throw Error("Seçilen hafta için kayıtlı ders defteri notu yok.");
  if (ders.length > 2200 || odev.length > 1200 || not.length > 1000)
    throw Error(
      "Haftanın notları bültene tek seferde aktarmak için uzun. Ders defteri arşivinden gereken kısa özeti bültene yazın; hiçbir metin kesilmedi.",
    );
  return { ders, odev, not };
}
