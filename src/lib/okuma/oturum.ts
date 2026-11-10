/**
 * İlim Yolu · Kur'an Okuma «Bugünkü çalışma» kurucusu (10 Kasım 2026). Saf ve belirleyici: aynı ilerleme ve gün her zaman aynı oturumu verir.
 * Hedef 10–15 dakika (madde başına ≈ 60–90 sn): en çok 5 tekrar (vadesi gelen, en eski önce) + 4–6 yeni madde (seçilen adımın sıradaki
 * görülmemişleri, adım bitince aynı izin sonraki adımı). «Gecikti» yoktur: birikim ne kadar büyük olursa olsun yalnız en eski 5 gelir.
 * Oturum madde sayısıyla sınırlıdır; sayfa «Bitir»i her an gösterir.
 * Tarayıcı paketine yalnız bu dosya, ilerleme.ts ve tekrar.ts girer: yol içeriği (yol.ts, ecouter.json) buraya bağlanmaz; adım yapısı `plan` olarak
 * verilir (kimlikler `<adım>-<sıra>` olduğundan adım başına madde sayısı yeter).
 */
import { goruldu, maddeKimligi, vade, vadeGeldi, type OkumaIlerleme } from './ilerleme';

export const TEKRAR_AZAMI = 5;
export const YENI_ENAZ = 4;
export const YENI_ENCOK = 6;
export const HEDEF = 10;

export interface PlanAdim {
  readonly id: string;
  readonly iz: 'elifba' | 'mushaf';
  /** Adımdaki madde sayısı (kimlikler `<id>-0` … `<id>-<n-1>`). */
  readonly n: number;
}
export interface Oturum {
  readonly tekrar: readonly string[];
  readonly yeni: readonly string[];
  /** Çalışma sırası: önce tekrarlar, sonra yeniler. */
  readonly sira: readonly string[];
  /** Yenilerin geldiği adım; hepsi bittiyse `null`. */
  readonly adim: string | null;
}

const idler = (a: PlanAdim): string[] => Array.from({ length: a.n }, (_, i) => maddeKimligi(a.id, i));

/** Bu izde henüz hiç görülmemiş madde bulunan ilk adım (yoksa `null`). */
export function siradakiAdim(il: OkumaIlerleme, plan: readonly PlanAdim[], iz: PlanAdim['iz']): string | null {
  return plan.find((a) => a.iz === iz && idler(a).some((id) => !goruldu(il, id)))?.id ?? null;
}

export function oturumKur(il: OkumaIlerleme, bugun: string, plan: readonly PlanAdim[], adim?: string | null): Oturum {
  const secili = adim && plan.some((a) => a.id === adim) ? adim : (siradakiAdim(il, plan, 'elifba') ?? siradakiAdim(il, plan, 'mushaf'));
  const vadesi = plan
    .flatMap(idler)
    .filter((id) => vadeGeldi(il, id, bugun))
    .sort((a, b) => ((vade(il, a) ?? '') < (vade(il, b) ?? '') ? -1 : (vade(il, a) ?? '') > (vade(il, b) ?? '') ? 1 : 0)); // eşitte yol sırası korunur (sıralama kararlı)
  const tekrar = vadesi.slice(0, TEKRAR_AZAMI);
  const kac = Math.min(YENI_ENCOK, Math.max(YENI_ENAZ, HEDEF - tekrar.length));
  const yeni: string[] = [];
  if (secili) {
    const bas = plan.findIndex((a) => a.id === secili);
    for (const a of plan.slice(bas).filter((x) => x.iz === plan[bas].iz)) {
      for (const id of idler(a)) {
        if (yeni.length >= kac) break;
        if (!goruldu(il, id)) yeni.push(id);
      }
      if (yeni.length >= kac) break;
    }
  }
  return { tekrar, yeni, sira: [...tekrar, ...yeni], adim: secili };
}
