/**
 * Ders günü ezber takvimi — derleme anı birleştirmesi (25 Ekim 2026). Türev takvim (ezber köşesi planı, src/data/ezber/ders-takvimi-2026-2027.json) ile
 * yıllık plandaki «diğer derslerin ezberi» (İtikat, İbadet, Siyer, Ahlak dersleri; `planKimlikleri` ile katalog kimliğine) tek ders günü listesinde
 * birleşir. Giriş sayfasındaki «Derste bu hafta» bandı, /<dil>/takvim/ sayfası ve çalışma sayfalarındaki «Derste:» satırı hepsi buradan okur;
 * saf mantık src/lib/ezber/ders-takvimi.ts'tedir (tarayıcıda da çalışır).
 */
import plan from '@ortak/data/yillik-plan-2026-2027.json';
import { DERS_TAKVIMI } from '@ortak/lib/ezber/ders-takvimi-veri';
import { dersGunleri, digerDersEzberi, haftaSonlari, type DersGunu, type HaftaSonu } from '@ortak/lib/ezber/ders-takvimi';
import { KATALOG, calismaSayfasiVar, ezberBul, planKimlikleri } from '@ortak/lib/ezber/katalog';
import type { Dil } from '@ortak/i18n/ui';

export const DERS_GUNLERI: readonly DersGunu[] = dersGunleri(DERS_TAKVIMI, digerDersEzberi(plan, planKimlikleri));
export const HAFTA_SONLARI: readonly HaftaSonu[] = haftaSonlari(DERS_GUNLERI);

/** Çalışma sayfası olan maddeler: bağlantı yalnız bunlara verilir. */
export const SAYFALI: ReadonlySet<string> = new Set(KATALOG.ogeler.filter(calismaSayfasiVar).map((o) => o.id));

/** Takvimde geçen her kimliğin sayfa dilindeki adı (kimlik katalogda yoksa derleme durur). */
export function takvimAdlari(dil: Dil): Record<string, string> {
  const adlar: Record<string, string> = {};
  for (const g of DERS_GUNLERI) {
    for (const liste of Object.values(g.gruplar)) {
      for (const x of liste) {
        const oge = ezberBul(x.id);
        if (!oge) throw new Error(`ders takvimi: «${x.id}» kataloğda yok`);
        adlar[x.id] = oge.ad[dil];
      }
    }
  }
  return adlar;
}
