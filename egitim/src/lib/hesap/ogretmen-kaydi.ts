/**
 * Öğrencinin kendi sayfasında hocanın kaydı (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Birleşik kilim»). Kurs kaydına bağlı
 * hesap (çocuk hesabı ya da bağlama koduyla bağlanmış yetişkin; token'da `ref`) `ezberDurum/{ref}` ve son 20 olayı okur
 * (kural `ogrenciOkur`; yazamaz). Okuma veli portalınınkiyle aynıdır (`veliEzberiYukle`, src/scripts/veli-ezber.ts).
 *
 * `ogretmenGorunumu` saftır: birleşik kilimin girdisi (hocanın maddeleri + kendi çalışma kaydı) ve hoca notlarının çocuk dilindeki
 * satırları (`veliSeritleri`, `veliDinlemeleri`; hocanın düğme adı değil yumuşak karşılığı, öğrenci adı hiçbir satırda yok).
 * Sayfa kilimi şöyle çizer: `kilimSvg(g.ogeler, { onek, dil, baslik, birlesik: { kendi: g.kendi, dokuAdlari, ozet } })`.
 */
import type { Dil } from '@ortak/i18n/ui';
import { temizle, type CihazDurumu } from '@ortak/lib/ezber/cihaz';
import type { OgeDurumu } from '@ortak/lib/ezber/durum';
import { kilimOzeti } from '@ortak/lib/ezber/kilim';
import { veliDinlemeleri, veliSeritleri, type VeliDinlemesi, type VeliSeridi } from '@ortak/lib/ezber/veli';
import { veliEzberiYukle, type VeliEzberi } from '@ortak/scripts/veli-ezber';
import type { IlimFirebase } from '../firebase-istemci';

/** Okunacak olay sayısı (veli portalıyla aynı). */
export const OLAY_SINIRI = 20;

export interface OgretmenGorunumu {
  /** Hocanın maddeleri: `kilimSvg`'nin ilk girdisi. */
  readonly ogeler: Readonly<Record<string, OgeDurumu>>;
  /** Kendi çalışma kaydı (temizlenmiş): `birlesik.kendi`. */
  readonly kendi: CihazDurumu;
  /** Kilimin metin karşılığı: şerit şerit hocanın basamağı. */
  readonly seritler: readonly VeliSeridi[];
  /** Son dinlemeler, çocuk dilinde (en çok `sinir`). */
  readonly dinlemeler: readonly VeliDinlemesi[];
  /** Hocanın kaydının kısa özeti (SVG açıklaması). */
  readonly ozet: string;
}

/** Kurs kaydı yoksa (`ref` boş) okumaz: `null`. Okuma reddedilir ya da bağlantı yoksa da `null` (sayfa yalnız kendi kilimini çizer). */
export function ogretmenKaydiOku(f: IlimFirebase, kullanici: { readonly ref: string }, sinir = OLAY_SINIRI): Promise<VeliEzberi | null> {
  if (!kullanici.ref) return Promise.resolve(null);
  return veliEzberiYukle(f.fs, f.db, kullanici.ref, sinir);
}

/** Hocanın kaydı (yoksa boş) + kendi çalışma kaydı → birleşik kilim girdisi ve çocuk dilindeki satırlar. */
export function ogretmenGorunumu(kayit: VeliEzberi | null, kendi: unknown, dil: Dil, sinir = 5): OgretmenGorunumu {
  const ogeler = kayit?.ogeler ?? {};
  return {
    ogeler,
    kendi: temizle(kendi),
    seritler: veliSeritleri(ogeler, dil),
    dinlemeler: veliDinlemeleri(kayit?.olaylar ?? [], dil, sinir),
    ozet: kilimOzeti(ogeler, dil),
  };
}
