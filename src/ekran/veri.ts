/**
 * Ekranın üç akışı: /ekran/vakitler.json, akis.json, icerik.json. Hatalı ya da geçersiz bir yanıt son
 * sağlam veriyi SİLMEZ — deploy arızasında ya da internet kesildiğinde ekran boşalmaz.
 */
import type { EkranVakitleri } from '../lib/ekran/vakit-kapisi.ts';
import type { EkranDuyuru } from '../lib/ekran/akis.ts';
import type { EkranIcerik } from '../lib/ekran/icerik.ts';
import type { SlaytAyari } from '../lib/ekran/secim.ts';

export interface AkisGovdesi {
  derleme: string;
  ayar: { slayt: SlaytAyari; gece: { kapanmaDk: number; acilmaDk: number }; duyuruVarsayilanGun: number };
  duyurular: EkranDuyuru[];
}
export type IcerikGovdesi = EkranIcerik & { derleme: string };
export interface EkranVerisi { vakit: EkranVakitleri | null; akis: AkisGovdesi | null; icerik: IcerikGovdesi | null }

const nesne = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

export function vakitGecerli(x: unknown): x is EkranVakitleri {
  return nesne(x) && x.kaynakTuru === 'diyanet' && x.ilce === '11890' && Array.isArray(x.gunler) && x.gunler.length > 0;
}
export function akisGecerli(x: unknown): x is AkisGovdesi {
  return nesne(x) && Array.isArray(x.duyurular) && nesne(x.ayar) && nesne(x.ayar.slayt);
}
export function icerikGecerli(x: unknown): x is IcerikGovdesi {
  return nesne(x) && Array.isArray(x.ayetler) && Array.isArray(x.hadisler);
}

async function getir<T>(yol: string, gecerli: (x: unknown) => x is T): Promise<T | null> {
  try {
    const yanit = await fetch(yol, { cache: 'no-cache' });
    if (!yanit.ok) return null;
    const govde: unknown = await yanit.json();
    return gecerli(govde) ? govde : null;
  } catch {
    return null;
  }
}

export async function tazele(v: EkranVerisi): Promise<void> {
  const [vakit, akis, icerik] = await Promise.all([
    getir('/ekran/vakitler.json', vakitGecerli),
    getir('/ekran/akis.json', akisGecerli),
    getir('/ekran/icerik.json', icerikGecerli),
  ]);
  if (vakit) v.vakit = vakit;
  if (akis) v.akis = akis;
  if (icerik) v.icerik = icerik;
}
