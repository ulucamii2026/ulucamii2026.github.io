/**
 * Dış hava — Open-Meteo (anahtarsız; CC BY 4.0, ekranda "Open-Meteo" ibaresi). 30 dakikada bir alınır;
 * 3 saatten eski veri gösterilmez (bayat sıcaklık yerine hiç). Konum: site.yaml → gps.
 * Simgeler saf vektördür (SVG yol verisi), raster kullanılmaz.
 */
export interface HavaDurumu { sicaklik: number; kod: number; alinan: number }
export type HavaSimgesi = 'gunes' | 'parcali' | 'bulut' | 'sis' | 'yagmur' | 'kar' | 'firtina';

export const havaAdresi = (enlem: number, boylam: number): string =>
  `https://api.open-meteo.com/v1/forecast?latitude=${enlem}&longitude=${boylam}&current=temperature_2m,weather_code&timezone=Europe%2FBrussels`;

export function havaCoz(govde: unknown, alinan: number): HavaDurumu | null {
  const c = (govde as { current?: { temperature_2m?: unknown; weather_code?: unknown } } | null)?.current;
  if (!c || typeof c.temperature_2m !== 'number' || typeof c.weather_code !== 'number') return null;
  return { sicaklik: Math.round(c.temperature_2m), kod: c.weather_code, alinan };
}

export const havaTazeMi = (h: HavaDurumu | null, simdi: number): h is HavaDurumu => !!h && simdi - h.alinan <= 3 * 3_600_000;

/** WMO kodu: 0 açık, 1–2 parçalı, 3 kapalı, 45/48 sis, 71–77 ve 85–86 kar, 95+ fırtına, kalanı yağış. */
export function havaSimgesi(kod: number): HavaSimgesi {
  if (kod === 0) return 'gunes';
  if (kod === 1 || kod === 2) return 'parcali';
  if (kod === 3) return 'bulut';
  if (kod === 45 || kod === 48) return 'sis';
  if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return 'kar';
  if (kod >= 95) return 'firtina';
  return 'yagmur';
}

const BULUT = 'M7 17h10.5a3.8 3.8 0 0 0 .4-7.6A5.8 5.8 0 0 0 6.7 11 3.1 3.1 0 0 0 7 17z';
export const SIMGE_YOLLARI: Record<HavaSimgesi, string> = {
  gunes: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  parcali: '<circle cx="8.5" cy="8.5" r="3.3"/><path d="M8.5 2.6v1.3M2.6 8.5h1.3M4.3 4.3l.9.9M12.7 4.3l-.9.9"/><path d="M9.5 19h8a3.3 3.3 0 0 0 .3-6.6 5 5 0 0 0-9.4 1.3A2.7 2.7 0 0 0 9.5 19z"/>',
  bulut: `<path d="${BULUT}"/>`,
  sis: '<path d="M4 9h16M3 13h18M5 17h14"/>',
  yagmur: `<path d="${BULUT}"/><path d="M9 19.5l-1 2.5M13 19.5l-1 2.5M17 19.5l-1 2.5"/>`,
  kar: `<path d="${BULUT}"/><path d="M9 20.5h.01M13 21.5h.01M17 20.5h.01"/>`,
  firtina: `<path d="${BULUT}"/><path d="M13 17.5l-2 3h3l-2 3"/>`,
};
