/**
 * Makine çevirisi ucu — derneğin Apps Script'i (`tur: 'cevir'`, v34, 14 Eyl 2026).
 *
 * Tarayıcı (hoca ekranı) ve CLI (scripts/defter-cevir.mjs) aynı işlevi kullanır: Firebase kimlik belirteci
 * gövdeye konur, Apps Script belirteci Identity Toolkit'te doğrular ve `hocalar/{uid}` belgesi varsa çevirir
 * (LanguageApp, tr → hedef). Veli/öğrenci adı istemci tarafında hiçbir zaman eklenmez; yalnız verilen metinler
 * gider. Yanıt sırası korunur; sayı tutmazsa hata (yarım çeviri kaydedilmez, bkz. defter-ceviri.ts).
 *
 * Uç adresi sayfa verisinden gelir (`ceviriUcu` = site.yaml → servisler.basvuru); adres yoksa makine katmanı
 * «kapalı» sayılır ve yalnız kalıp cümleler çevrilir.
 *
 * Yeniden deneme (14 Eyl 2026 canlı ölçüm): Apps Script POST yanıtı 302 ile echo adresine yönlenir; bu adres ara sıra
 * 404 döner ya da yönlendirme doGet'e düşüp sağlık JSON'u (`servis`, `surum`) gelir. Bunlar geçici sunucu sapmalarıdır:
 * aynı parti kısa aralıkla en çok üç kez denenir. Ucun bilinçli hata kodları (`ceviri-kapali`, `yetkisiz`,
 * `metin-uzunlugu`…) kalıcıdır, yeniden denenmez.
 */
import type { CeviriDili, MakineCevirici } from "./defter-ceviri";

export const CEVIRI_METIN_AZAMI = 20;
export const CEVIRI_KARAKTER_AZAMI = 1800;
export const CEVIRI_DENEME = 3;

/**
 * Ad gizleme (14 Eyl 2026, 2): makineye giden metinde öğrenci/veli adı bulunmaz. Verilen adların her sözcüğü
 * (2 harften uzun) sözcük sınırında aranır ve [[n]] yer tutucusuna çevrilir; çeviri döndükten sonra yer tutucular
 * yazıldığı biçimiyle geri konur. Türkçe ek («Tayyip'in» → «[[1]]'in») korunur.
 * Kurallar (canlı ön izlemeden çıkan dersler):
 *  - Yalnız BÜYÜK harfle başlayan geçişler ad sayılır («Tayyip», «TAYYİP»; «temel bilgiler» değil) — Türkçe İ/ı eşlemesi
 *    harf sınıfıyla kurulur (/i bayrağı İ↔i, I↔ı bilmez).
 *  - AD_DEGIL listesindeki sözcükler (ad da olsa cümlede sıradan anlam taşıyan «temel», «melek», «Ramazan»; Diyanet
 *    çevirisinin «le prophète Muhammad» diyebilmesi için «Muhammed») hiç maskelenmez — «les temel informations» olmasın.
 *  - Geri koyma toleranslıdır ([[ 1 ]], [ [1] ]); motor tanımadığımız bir yer tutucu üretirse (adı kendisi
 *    anonimleştirdiyse) çeviri HATA sayılır — yer tutucu veliye gitmez, kayıt «çevrilemedi» kalır.
 */
export const AD_DEGIL = new Set([
  "temel", "ramazan", "muhammed", "muhammet", "melek", "emir", "kerem", "sevgi", "nur", "can", "umut", "barış", "deniz",
  "güneş", "yıldız", "gül", "ışık", "kaya", "demir", "kurt", "aslan", "doğan", "şahin", "çelik", "yaşar", "yağmur",
  "bulut", "toprak", "çiçek", "bal", "ege", "ata", "akın", "petek", "şehri", "sehri", "mert", "eren", "berat", "kadir",
  "bayram", "cuma", "sabah", "aydın", "evren", "cihan", "dünya", "hayat", "zafer", "murat", "tan", "yavuz", "onur",
]);
const YER_TUTUCU = /\[\s*\[\s*(\d+)\s*\]\s*\]/g;
export function adGizleyici(adlar: () => string[], secenek: { yaygin?: Set<string> } = {}): (makine: MakineCevirici) => MakineCevirici {
  const yaygin = secenek.yaygin ?? AD_DEGIL;
  return (makine) => async (metinler, dil) => {
    const kucuk = (s: string) => s.toLocaleLowerCase("tr");
    const sozcukler = [...new Set(adlar().flatMap((a) => a.split(/\s+/)).map((s) => s.trim()).filter((s) => s.length > 2 && !yaygin.has(kucuk(s))))]
      .sort((a, b) => b.length - a.length);
    const kacis = (c: string) => c.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
    const harf = (c: string) => { const k = [...new Set([c, c.toLocaleLowerCase("tr"), c.toLocaleUpperCase("tr")])]; return k.length === 1 ? kacis(c) : `[${k.map(kacis).join("")}]`; };
    const ilkHarf = (c: string) => { const k = [...new Set([c.toLocaleUpperCase("tr")])]; return k.length === 1 ? kacis(k[0]) : `[${k.map(kacis).join("")}]`; };
    const sozcukDeseni = (w: string) => [...w].map((c, i) => (i === 0 ? ilkHarf(c) : harf(c))).join("");
    const bulunan: string[] = []; // yer tutucu numarası → yazıldığı biçim (ilk görülen)
    let gizli = metinler;
    if (sozcukler.length) {
      const desen = new RegExp(`(^|[^\\p{L}\\p{N}])(${sozcukler.map(sozcukDeseni).join("|")})(?![\\p{L}\\p{N}])`, "gu");
      gizli = metinler.map((m) =>
        m.replace(desen, (_, on: string, ad: string) => {
          let i = bulunan.findIndex((b) => kucuk(b) === kucuk(ad));
          if (i < 0) { bulunan.push(ad); i = bulunan.length - 1; }
          return `${on}[[${i + 1}]]`;
        }),
      );
    }
    const cevrilen = await makine(gizli, dil);
    if (!Array.isArray(cevrilen) || cevrilen.length !== gizli.length || cevrilen.some(c => typeof c !== "string" || !c.trim()))
      throw new Error("ceviri-yanit");
    return cevrilen.map((c, i) => {
      // Her ad kendi kaynak satırında kalmalı; başka öğrencinin adı taşınamaz veya sessizce silinemez.
      const beklenen = new Set([...gizli[i].matchAll(YER_TUTUCU)].map(m => Number(m[1])));
      const gorulen = new Set<number>();
      const geri = c.replace(YER_TUTUCU, (_t, n: string) => {
        const no = Number(n);
        gorulen.add(no);
        return beklenen.has(no) ? (bulunan[no - 1] ?? "\u0000") : "\u0000";
      });
      if (geri.includes("\u0000")) throw new Error("yer-tutucu-bilinmiyor"); // motor ad uydurdu/anonimleştirdi → yarım çeviri yazılmaz
      if ([...beklenen].some(no => !gorulen.has(no))) throw new Error("yer-tutucu-eksik");
      return geri;
    });
  };
}
const BEKLE_MS = 400;

class KaliciHata extends Error {}
const bekle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function partiCevir(uc: string, kimlik: () => Promise<string>, fetchFn: typeof fetch, parti: string[], dil: CeviriDili): Promise<string[]> {
  const idToken = await kimlik();
  const r = await fetchFn(uc, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ tur: "cevir", idToken, hedef: dil, metinler: parti }),
    redirect: "follow",
    cache: "no-store",
  });
  if (!r.ok) throw Error(`ceviri-http-${r.status}`);
  const j = (await r.json()) as { ok?: boolean; hata?: string; ceviriler?: unknown };
  if (j.ok === false && typeof j.hata === "string" && j.hata) throw new KaliciHata(`ceviri-${j.hata}`);
  if (j.ok !== true || !Array.isArray(j.ceviriler) || j.ceviriler.length !== parti.length ||
    j.ceviriler.some(x => typeof x !== "string" || !x.trim())) throw Error("ceviri-yanit");
  return j.ceviriler;
}

export function makineCevirici(
  uc: string | undefined,
  kimlik: () => Promise<string>,
  fetchFn: typeof fetch = (...a) => fetch(...a),
): MakineCevirici {
  return async (metinler: string[], dil: CeviriDili) => {
    if (!metinler.length) return [];
    if (!uc) throw Error("ceviri-ucu-yok");
    const sonuc: string[] = [];
    // Apps Script gövde sınırı: parti parti gönderilir (20 metin / 1800 karakter).
    for (let i = 0; i < metinler.length; i += CEVIRI_METIN_AZAMI) {
      const parti = metinler.slice(i, i + CEVIRI_METIN_AZAMI);
      if (parti.some((m) => m.length > CEVIRI_KARAKTER_AZAMI)) throw Error("ceviri-metin-uzun");
      let son: unknown;
      for (let deneme = 1; deneme <= CEVIRI_DENEME; deneme++) {
        try {
          sonuc.push(...(await partiCevir(uc, kimlik, fetchFn, parti, dil)));
          son = null;
          break;
        } catch (e) {
          if (e instanceof KaliciHata) throw e;
          son = e;
          if (deneme < CEVIRI_DENEME) await bekle(BEKLE_MS * deneme);
        }
      }
      if (son) throw son;
    }
    return sonuc;
  };
}
