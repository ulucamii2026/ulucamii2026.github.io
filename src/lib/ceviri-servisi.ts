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
  if (!j.ok || !Array.isArray(j.ceviriler) || j.ceviriler.length !== parti.length) throw Error("ceviri-yanit");
  return j.ceviriler.map((x) => String(x ?? ""));
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
