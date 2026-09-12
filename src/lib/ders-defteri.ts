import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
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
  durum: "islendi" | "kismen" | "ertelendi";
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
};
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
    async kaydet(k: DersKaydi, beklenen: number): Promise<DersKaydi> {
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

/** Bilinçli hoca eylemiyle bülten taslağına aktarılır; yoklama veya başarı notu üretmez. */
export function defterdenBulten(kayitlar: DersKaydi[]) {
  const rows = [...kayitlar].sort((a, b) => a.id.localeCompare(b.id));
  const et = (k: DersKaydi) => `${k.tarih} · ${k.sira}. ders · ${k.konu}`;
  const ders = rows
    .map((k) => `${et(k)}\n${dersDurumlari[k.durum]}: ${k.calisma}`)
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
