/**
 * İlim Yolu bilgi kartları (Dilim 2): src/data/ilim-yolu/kartlar/<kod>.json derleme anında okunur (doğrulama: tests/ilim-yolu-bilgi-kartlari.test.mjs).
 * Kartlar kimliğe göre sıralıdır; `kartBul` kimlikten kartı verir.
 */
import type { BilgiKarti, KartDosyasi } from '@ortak/lib/ilim-yolu/bilgi-kartlari';

const DOSYALAR = import.meta.glob<KartDosyasi>('../../../src/data/ilim-yolu/kartlar/*.json', { eager: true, import: 'default' });

export const KARTLAR: readonly BilgiKarti[] = Object.values(DOSYALAR)
  .flatMap((d) => d.kartlar)
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const HARITA = new Map(KARTLAR.map((k) => [k.id, k]));
export const kartBul = (id: string): BilgiKarti | undefined => HARITA.get(id);
