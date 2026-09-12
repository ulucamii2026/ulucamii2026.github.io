import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore/lite";
import type { Dil } from "../i18n/ui";

export type BultenMetni = {
  ders: string;
  odev: string;
  getir: string;
  not: string;
};
export type Bulten = {
  id: string;
  tarih: string;
  hafta: number;
  dil: Dil;
  metin: BultenMetni;
  yayin: boolean;
  surum: number;
};
export type BultenOkuma = {
  surum: number;
  zaman?: { toDate?: () => Date };
  kagit?: boolean;
};
export const bultenSinirlari = {
  ders: 2200,
  odev: 1200,
  getir: 400,
  not: 1000,
};
export const bultenYolu = (ref: string) =>
  ["bultenler", ref, "haftalar"] as const;
export const bultenIdGecerli = (id: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(id) &&
  !Number.isNaN(Date.parse(id + "T12:00:00Z")) &&
  new Date(id + "T12:00:00Z").toISOString().slice(0, 10) === id;

export function bultenDeposu(db: Firestore, ref: string) {
  const yol = bultenYolu(ref);
  return {
    async liste(hoca = false): Promise<Bulten[]> {
      const c = collection(db, ...yol);
      const s = await getDocs(hoca ? c : query(c, where("yayin", "==", true)));
      return s.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Bulten)
        .sort((a, b) => b.tarih.localeCompare(a.tarih));
    },
    async okumalar(id: string): Promise<Record<string, BultenOkuma>> {
      const s = await getDocs(collection(db, ...yol, id, "okumalar"));
      return Object.fromEntries(
        s.docs.map((d) => [d.id, d.data() as BultenOkuma]),
      );
    },
    async okuma(id: string, ep: string): Promise<BultenOkuma | null> {
      const s = await getDoc(doc(db, ...yol, id, "okumalar", ep.toLowerCase()));
      return s.exists() ? (s.data() as BultenOkuma) : null;
    },
    async kaydet(b: Omit<Bulten, "surum">, beklenen: number): Promise<Bulten> {
      if (
        !bultenIdGecerli(b.id) ||
        b.id !== b.tarih ||
        !["tr", "fr", "en"].includes(b.dil) ||
        !Number.isInteger(b.hafta) ||
        b.hafta < 1 ||
        b.hafta > 54
      )
        throw Error("Bültenin hafta bilgisi geçersiz.");
      for (const [k, max] of Object.entries(bultenSinirlari))
        if (
          typeof b.metin[k as keyof BultenMetni] !== "string" ||
          b.metin[k as keyof BultenMetni].length > max
        )
          throw Error("Bülten metni izin verilen uzunluğu aşıyor.");
      if (!b.metin.ders.trim())
        throw Error("Bu haftanın ders içeriğini yazın.");
      return runTransaction(db, async (tx) => {
        const r = doc(db, ...yol, b.id);
        const eski = await tx.get(r);
        if ((eski.exists() ? eski.data()!.surum : 0) !== beklenen)
          throw Error(
            "Bülten başka bir ekranda değişti. Haftayı yeniden seçip güncel metni açın.",
          );
        const sonuc = { ...b, surum: beklenen + 1 };
        const { id: _, ...data } = sonuc;
        tx.set(r, { ...data, guncelleme: serverTimestamp() });
        return sonuc;
      });
    },
    async okudum(b: Bulten, ep: string) {
      await runTransaction(db, async (tx) => {
        const belge = await tx.get(doc(db, ...yol, b.id));
        if (
          !belge.exists() ||
          !belge.data()!.yayin ||
          belge.data()!.surum !== b.surum
        )
          throw Error("BULTEN_DEGISTI");
        const r = doc(db, ...yol, b.id, "okumalar", ep.toLowerCase());
        const once = await tx.get(r);
        if (once.exists() && once.data()!.surum === b.surum) return;
        tx.set(r, { surum: b.surum, zaman: serverTimestamp() });
      });
    },
  };
}
