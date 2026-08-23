/** Namaz vakti yardımcıları — istemci ve sunucu tarafında ortak (Brüksel saati, DST güvenli) */
export interface Gun { tarih: string; hicri: string; imsak: string; gunes: string; ogle: string; ikindi: string; aksam: string; yatsi: string }
export const SIRA = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type Vakit = (typeof SIRA)[number];
export const TZ = 'Europe/Brussels';

export function bugunTarih(simdi: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(simdi);
}

/** Brüksel'deki "tarih + HH:MM" duvar saatini gerçek Date'e çevirir (iki geçişli ofset; yaz/kış saati dâhil) */
export function brukselTarih(tarih: string, hm: string): Date {
  const [y, mo, d] = tarih.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  const tahmin = Date.UTC(y, mo - 1, d, h, mi);
  const ofset = (t: number) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(t));
    const g = (k: string) => Number(p.find((x) => x.type === k)!.value);
    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute')) - t;
  };
  const ilk = tahmin - ofset(tahmin);
  return new Date(tahmin - ofset(ilk));
}

export function sureMetni(dk: number, dil: 'tr' | 'fr'): string {
  const sa = Math.floor(dk / 60), d = dk % 60;
  if (dil === 'fr') return sa > 0 ? `${sa} h ${String(d).padStart(2, '0')}` : `${d} min`;
  return sa > 0 ? `${sa} sa ${String(d).padStart(2, '0')} dk` : `${d} dk`;
}

export interface Durum { bugun: Gun; yarin?: Gun; eski: boolean; siradaki: { vakit: Vakit; saat: string; kalanDk: number; yarinMi: boolean } | null }

/** Bugünün kaydı ve sıradaki vakit */
export function durumHesapla(gunler: Gun[], simdi: Date): Durum | null {
  if (!gunler.length) return null;
  const bugunStr = bugunTarih(simdi);
  const sirali = [...gunler].sort((a, b) => a.tarih.localeCompare(b.tarih));
  let idx = sirali.findIndex((g) => g.tarih === bugunStr);
  let eski = false;
  if (idx < 0) { idx = sirali.findIndex((g) => g.tarih > bugunStr); if (idx < 0) { idx = sirali.length - 1; eski = true; } }
  const bugun = sirali[idx], yarin = sirali[idx + 1];
  let siradaki: Durum['siradaki'] = null;
  if (!eski) {
    for (const v of SIRA) {
      if (v === 'gunes') continue;
      const t = brukselTarih(bugun.tarih, bugun[v]);
      if (t.getTime() > simdi.getTime()) { siradaki = { vakit: v, saat: bugun[v], kalanDk: Math.ceil((t.getTime() - simdi.getTime()) / 60000), yarinMi: false }; break; }
    }
    if (!siradaki && yarin) {
      const t = brukselTarih(yarin.tarih, yarin.imsak);
      siradaki = { vakit: 'imsak', saat: yarin.imsak, kalanDk: Math.max(0, Math.ceil((t.getTime() - simdi.getTime()) / 60000)), yarinMi: true };
    }
  }
  return { bugun, yarin, eski, siradaki };
}

/** Brüksel'de haftanın günü: 1 = Pazartesi … 7 = Pazar */
export function haftaGunu(simdi: Date): number {
  const g = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(simdi);
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[g] ?? 1;
}
