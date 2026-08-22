import { useEffect, useState } from 'preact/hooks';
import { hicriCevir } from '../i18n/hicri';

export interface Gun { tarih: string; hicri: string; imsak: string; gunes: string; ogle: string; ikindi: string; aksam: string; yatsi: string }
interface Props {
  gunler: Gun[];
  dil: 'tr' | 'fr';
  etiketler: Record<'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'siradaki' | 'kalan' | 'hicri', string>;
  kompakt?: boolean;
}
const SIRA = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
type Vakit = (typeof SIRA)[number];
const TZ = 'Europe/Brussels';

/** Brüksel duvar saatine göre bugünün tarihi (YYYY-MM-DD) */
function bugunTarih(simdi: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(simdi);
}
/** Brüksel'deki "tarih + HH:MM" duvar saatini gerçek bir Date'e çevirir (yaz/kış saati dâhil, iki geçişli) */
function brukselTarih(tarih: string, hm: string): Date {
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
function sureMetni(dk: number, dil: 'tr' | 'fr'): string {
  const sa = Math.floor(dk / 60), d = dk % 60;
  if (dil === 'fr') return sa > 0 ? `${sa} h ${String(d).padStart(2, '0')}` : `${d} min`;
  return sa > 0 ? `${sa} sa ${String(d).padStart(2, '0')} dk` : `${d} dk`;
}

export default function NamazVakitleri({ gunler, dil, etiketler, kompakt = false }: Props) {
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setSimdi(new Date()), 1000); return () => clearInterval(id); }, []);
  if (!gunler.length) return null;
  const bugunStr = bugunTarih(simdi);
  const sirali = [...gunler].sort((a, b) => a.tarih.localeCompare(b.tarih));
  let idx = sirali.findIndex((g) => g.tarih === bugunStr);
  let eski = false;
  if (idx < 0) {
    idx = sirali.findIndex((g) => g.tarih > bugunStr);
    if (idx < 0) { idx = sirali.length - 1; eski = true; } // veri penceresi dolmuş: son günü göster + uyarı
  }
  const bugun = sirali[idx];
  const yarin = sirali[idx + 1];
  // sıradaki vakit (güneş doğuşu namaz vakti değil)
  let siradaki: { vakit: Vakit; saat: string; kalanDk: number } | null = null;
  if (!eski) {
    for (const v of SIRA) {
      if (v === 'gunes') continue;
      const t = brukselTarih(bugun.tarih, bugun[v]);
      if (t.getTime() > simdi.getTime()) { siradaki = { vakit: v, saat: bugun[v], kalanDk: Math.ceil((t.getTime() - simdi.getTime()) / 60000) }; break; }
    }
    if (!siradaki && yarin) {
      const t = brukselTarih(yarin.tarih, yarin.imsak);
      siradaki = { vakit: 'imsak', saat: yarin.imsak, kalanDk: Math.max(0, Math.ceil((t.getTime() - simdi.getTime()) / 60000)) };
    }
  }
  const tarihStr = new Intl.DateTimeFormat(dil === 'tr' ? 'tr-TR' : 'fr-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(bugun.tarih + 'T12:00:00'));
  const uyari = dil === 'tr' ? 'Vakit tablosu güncellenmeyi bekliyor — lütfen cami ilan panosundaki çizelgeye bakınız.' : 'Le tableau des horaires attend une mise à jour — veuillez consulter l’affichage à la mosquée.';
  return (
    <div class={kompakt ? '' : 'kart p-5 sm:p-6'}>
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p class="font-serif text-lg font-semibold capitalize">{tarihStr}</p>
        <p class="etiket">{etiketler.hicri}: <span class="normal-case tracking-normal">{hicriCevir(bugun.hicri, dil)}</span></p>
      </div>
      {eski && <p class="uyari text-sm mb-4" role="status">{uyari}</p>}
      <ul class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3" role="list">
        {SIRA.map((v) => {
          const aktif = siradaki?.vakit === v && !(v === 'imsak' && siradaki.saat !== bugun.imsak);
          return (
            <li class={`text-center border rounded-(--radius-kose) py-3 px-1 ${aktif ? 'border-(--vurgu) bg-(--vurgu)/8' : 'border-(--cizgi)'}`} aria-current={aktif ? 'time' : undefined}>
              <span class={`etiket block ${aktif ? 'etiket-vurgu' : ''}`}>{etiketler[v]}</span>
              <span class="rakam block text-2xl sm:text-[1.7rem] mt-1">{bugun[v]}</span>
            </li>
          );
        })}
      </ul>
      {siradaki && (
        <p class="mt-4 text-sm text-(--metin-2)">
          <span class="etiket">{etiketler.siradaki}:</span> <strong class="text-(--metin)">{etiketler[siradaki.vakit]} {siradaki.saat}</strong> · <span class="mono">{sureMetni(siradaki.kalanDk, dil)}</span> {etiketler.kalan}
        </p>
      )}
    </div>
  );
}
