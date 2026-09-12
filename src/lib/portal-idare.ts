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

type Belge = { yol: string; veri: Record<string, unknown> };
export type Envanter = {
  ref: string;
  belgeler: Belge[];
  aileler: Belge[];
  sayilar: Record<string, number>;
};
const sirali = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sirali)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, x]) => [k, sirali(x)]),
        )
      : v;
export const envanterIzi = (x: unknown) => JSON.stringify(sirali(x));
const kokler: Record<string, string> = {
  yoklama: "Yoklama",
  degerlendirme: "Değerlendirme",
  notlar: "Hoca notları",
  bildirimler: "Veli bildirimleri",
};

/** Salt okunur döküm. Alt koleksiyonlar açıkça listelenir; üst belge silinince kendiliğinden silinmezler. */
export async function portalEnvanteri(
  db: Firestore,
  ref: string,
): Promise<Envanter> {
  if (!ref || ref.includes("/")) throw Error("Öğrenci seçimi geçersiz.");
  const belgeler: Belge[] = [],
    sayilar: Record<string, number> = {};
  const al = async (yol: string, ad: string, filtre = false) => {
    const c = collection(db, yol);
    const s = await getDocs(filtre ? query(c, where("ref", "==", ref)) : c);
    const gelen = s.docs.map((d) => ({
      yol: yol + "/" + d.id,
      veri: d.data(),
    }));
    belgeler.push(...gelen);
    sayilar[ad] = gelen.length;
    return gelen;
  };
  await Promise.all(Object.entries(kokler).map(([y, ad]) => al(y, ad, true)));
  await al(`evCalismalari/${ref}/etkinlikler`, "Evde çalışma");
  const bultenler = await al(`bultenler/${ref}/haftalar`, "Haftalık bülten");
  let okumalar = 0;
  await Promise.all(
    bultenler.map(async (b) => {
      const r = await al(b.yol + "/okumalar", b.yol);
      okumalar += r.length;
      delete sayilar[b.yol];
    }),
  );
  sayilar["Bülten okuma bildirimleri"] = okumalar;
  for (const [y, ad] of [
    ["ogrenciler", "Öğrenci profili"],
    ["ilerleme", "Ders ilerlemesi"],
  ]) {
    const r = await getDoc(doc(db, y, ref));
    sayilar[ad] = r.exists() ? 1 : 0;
    if (r.exists()) belgeler.push({ yol: y + "/" + ref, veri: r.data()! });
  }
  const a = await getDocs(
    query(
      collection(db, "aileler"),
      where("ogrenciler", "array-contains", ref),
    ),
  );
  return {
    ref,
    belgeler: belgeler.sort((a, b) => a.yol.localeCompare(b.yol)),
    aileler: a.docs
      .map((d) => ({ yol: "aileler/" + d.id, veri: d.data() }))
      .sort((a, b) => a.yol.localeCompare(b.yol)),
    sayilar,
  };
}

/** İncelenen kayıtlar tek işlemde silinir. Değişen dökümde ve 400 belge üstünde hiçbir kayıt silinmez. */
export async function portalKayitlariniSil(
  db: Firestore,
  once: Envanter,
  kapsam: "ev" | "tum",
) {
  const kilit = doc(db, "portalSilme", once.ref),
    islem = crypto.randomUUID();
  await runTransaction(db, async (tx) => {
    const s = await tx.get(kilit);
    if (s.exists())
      throw Error(
        "Bu öğrenci için başka bir idari işlem sürüyor. İşlem tamamlanınca yeniden deneyin.",
      );
    tx.set(kilit, { islem, zaman: serverTimestamp() });
  });
  try {
    const simdi = await portalEnvanteri(db, once.ref);
    if (envanterIzi(simdi) !== envanterIzi(once))
      throw Error(
        "Kayıtlar incelemeden sonra değişti. Dökümü yeniden yükleyip kontrol edin; hiçbir kayıt silinmedi.",
      );
    const hedef = once.belgeler.filter(
      (b) =>
        kapsam === "tum" ||
        b.yol.startsWith(`evCalismalari/${once.ref}/etkinlikler/`),
    );
    const aileler = kapsam === "tum" ? once.aileler : [];
    if (hedef.length + aileler.length + 1 > 400)
      throw Error(
        "Bu döküm tek işlem için fazla büyük. Hiçbir kayıt silinmedi; yönetici tarafından arşivli bakım gerekiyor.",
      );
    await runTransaction(db, async (tx) => {
      const kontrol = await tx.get(kilit);
      if (kontrol.data()?.islem !== islem)
        throw Error("İdari işlem kilidi değişti; işlem durduruldu.");
      const butun = [...hedef, ...aileler];
      const son = [];
      for (const b of butun) son.push(await tx.get(doc(db, b.yol)));
      if (
        son.some(
          (s, i) =>
            !s.exists() || envanterIzi(s.data()) !== envanterIzi(butun[i].veri),
        )
      )
        throw Error(
          "Kayıtlar değişti. Dökümü yeniden yükleyin; hiçbir kayıt silinmedi.",
        );
      for (const b of hedef) tx.delete(doc(db, b.yol));
      for (const b of aileler) {
        const data = b.veri;
        const kitap = {
          ...((data.kitapSecim as Record<string, unknown>) || {}),
        };
        delete kitap[once.ref];
        tx.update(doc(db, b.yol), {
          ogrenciler: (data.ogrenciler as string[]).filter(
            (r) => r !== once.ref,
          ),
          kitapSecim: kitap,
        });
      }
      tx.delete(kilit);
    });
    return hedef.length;
  } finally {
    // Bağlantı kesilirse kilit korunur. Hoca döküm ekranından kontrollü olarak kaldırabilir.
    await runTransaction(db, async (tx) => {
      const s = await tx.get(kilit);
      if (s.exists() && s.data()!.islem === islem) tx.delete(kilit);
    }).catch(() => {});
  }
}

export async function portalKilitKaldir(db: Firestore, ref: string) {
  const r = doc(db, "portalSilme", ref);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(r);
    if (!s.exists()) return;
    const zaman = s.data()!.zaman?.toDate?.()?.getTime();
    if (!zaman || Date.now() - zaman < 15 * 60 * 1000)
      throw Error(
        "Devam eden işlemi korumak için kilit ilk 15 dakika kaldırılamaz.",
      );
    tx.delete(r);
  });
}

/** Öğrenci ile aile bağlantısı birlikte değişir; kayıtlı aile dili ve diğer çocuklar korunur. */
export async function portalVeliBagi(
  db: Firestore,
  ref: string,
  eposta: string,
  ekle: boolean,
) {
  const ep = eposta.trim().toLowerCase();
  if (
    !ref ||
    ref.includes("/") ||
    ep.includes("/") ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ep)
  )
    throw Error("Öğrenci veya veli bilgisi geçersiz.");
  return runTransaction(db, async (tx) => {
    const o = doc(db, "ogrenciler", ref),
      a = doc(db, "aileler", ep);
    const kilit = await tx.get(doc(db, "portalSilme", ref));
    const ogr = await tx.get(o),
      aile = await tx.get(a);
    if (kilit.exists())
      throw Error(
        "Öğrencinin idari işlemi sürüyor. Tamamlanınca yeniden deneyin.",
      );
    if (!ogr.exists())
      throw Error("Öğrenci kaydı bulunamadı. Listeyi yenileyin.");
    const d = ogr.data()!,
      v = (d.veliler || []) as string[];
    const veliler = ekle ? [...new Set([...v, ep])] : v.filter((x) => x !== ep);
    const data = aile.exists() ? aile.data()! : {};
    const refs = (data.ogrenciler || []) as string[];
    const ogrenciler = ekle
      ? [...new Set([...refs, ref])]
      : refs.filter((x) => x !== ref);
    tx.update(o, { veliler });
    if (aile.exists()) {
      const kitap = { ...(data.kitapSecim || {}) };
      if (!ekle) delete kitap[ref];
      tx.update(a, { ogrenciler, ...(!ekle ? { kitapSecim: kitap } : {}) });
    } else if (ekle) {
      tx.set(a, {
        ogrenciler,
        ...(["tr", "fr", "en"].includes(d.dil) ? { dil: d.dil } : {}),
      });
    }
    return veliler;
  });
}
