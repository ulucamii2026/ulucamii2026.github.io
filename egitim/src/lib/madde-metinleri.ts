/**
 * Madde metinleri (src/data/ezber/metin/<id>.json) derleme anında okunur; yalnız madde dosyaları (şema hariç).
 * İçerik ve kurallar: src/lib/ezber/madde-metni.ts, tests/ezber-madde-metni.test.mjs.
 */
import type { MaddeMetni } from '@ortak/lib/ezber/madde-metni';

const DOSYALAR = import.meta.glob<MaddeMetni>('../../../src/data/ezber/metin/[sdb]-*.json', { eager: true, import: 'default' });

export const MADDE_METINLERI: ReadonlyMap<string, MaddeMetni> = new Map(Object.values(DOSYALAR).map((m) => [m.id, m]));
