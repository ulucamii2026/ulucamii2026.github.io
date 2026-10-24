/**
 * Bilgi maddesi listeleri (src/data/ezber/bilgi/<id>.json) derleme anında okunur; yalnız madde dosyaları (şema hariç).
 * İçerik ve kurallar: src/lib/ezber/bilgi-metni.ts, tests/ezber-bilgi.test.mjs.
 */
import type { BilgiMetni } from '@ortak/lib/ezber/bilgi-metni';

const DOSYALAR = import.meta.glob<BilgiMetni>('../../../src/data/ezber/bilgi/b-*.json', { eager: true, import: 'default' });

export const BILGI_METINLERI: ReadonlyMap<string, BilgiMetni> = new Map(Object.values(DOSYALAR).map((m) => [m.id, m]));
