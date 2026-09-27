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

/* Zaman aşımı AbortController ile kurulur (Chrome 66+); AbortSignal.timeout Chrome 103 ister ve
   eski WebView'de yoktur. Tek zamanlayıcı hem fetch()'i hem yanit.json()'ı kapsar (abort, yanıt
   gövdesinin okunmasını da reddeder) ve finally'de temizlenir — sızıntı bırakmaz. */
async function getir<T>(yol: string, gecerli: (x: unknown) => x is T, zamanAsimiMs: number): Promise<T | null> {
  const denetleyici = new AbortController();
  const zamanlayici = setTimeout(() => denetleyici.abort(), zamanAsimiMs);
  try {
    const yanit = await fetch(yol, { cache: 'no-cache', signal: denetleyici.signal });
    if (!yanit.ok) return null;
    const govde: unknown = await yanit.json();
    return gecerli(govde) ? govde : null;
  } catch {
    return null;
  } finally {
    clearTimeout(zamanlayici);
  }
}

export async function tazele(v: EkranVerisi, zamanAsimiMs = 30_000): Promise<void> {
  const [vakit, akis, icerik] = await Promise.all([
    getir('/ekran/vakitler.json', vakitGecerli, zamanAsimiMs),
    getir('/ekran/akis.json', akisGecerli, zamanAsimiMs),
    getir('/ekran/icerik.json', icerikGecerli, zamanAsimiMs),
  ]);
  if (vakit) v.vakit = vakit;
  if (akis) v.akis = akis;
  if (icerik) v.icerik = icerik;
}

/** Bir akış hâlâ hiç gelmediyse (kutu Wi-Fi ayağa kalkmadan önce açıldıysa) bir dakika sonra yeniden
 *  dener; hepsi doluysa normal 10 dakikalık tazeleme aralığına döner. */
export function sonrakiTazelemeMs(v: EkranVerisi): number {
  return v.vakit === null || v.akis === null || v.icerik === null ? 60_000 : 10 * 60_000;
}
