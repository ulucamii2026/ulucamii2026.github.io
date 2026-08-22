import { useEffect, useState } from 'preact/hooks';

export interface Gun { tarih: string; hicri: string; imsak: string; gunes: string; ogle: string; ikindi: string; aksam: string; yatsi: string }
interface Props {
  gunler: Gun[];
  dil: 'tr' | 'fr';
  etiketler: Record<'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'siradaki' | 'kalan' | 'hicri', string>;
  kompakt?: boolean;
}
const SIRA = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
type Vakit = (typeof SIRA)[number];

/** Brüksel saatine göre "YYYY-MM-DD" ve dakika-of-day */
function simdi() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  const saat = Number(g('hour')) % 24;
  return { tarih: `${g('year')}-${g('month')}-${g('day')}`, dakika: saat * 60 + Number(g('minute')), saniye: Number(g('second')) };
}
const dk = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

export default function NamazVakitleri({ gunler, dil, etiketler, kompakt = false }: Props) {
  const [an, setAn] = useState(simdi());
  useEffect(() => { const id = setInterval(() => setAn(simdi()), 1000); return () => clearInterval(id); }, []);
  const bugun = gunler.find((g) => g.tarih === an.tarih) ?? gunler.find((g) => g.tarih >= an.tarih) ?? gunler[0];
  if (!bugun) return null;
  const yarinIdx = gunler.findIndex((g) => g.tarih === bugun.tarih) + 1;
  const yarin = gunler[yarinIdx];
  // sıradaki vakit (güneş hariç)
  let siradaki: { vakit: Vakit; kalanDk: number } | null = null;
  for (const v of SIRA) {
    if (v === 'gunes') continue;
    if (dk(bugun[v]) > an.dakika) { siradaki = { vakit: v, kalanDk: dk(bugun[v]) - an.dakika }; break; }
  }
  if (!siradaki && yarin) siradaki = { vakit: 'imsak', kalanDk: 24 * 60 - an.dakika + dk(yarin.imsak) };
  const kalanStr = siradaki ? `${Math.floor(siradaki.kalanDk / 60)} sa ${String(siradaki.kalanDk % 60).padStart(2, '0')} dk` : '';
  const tarihStr = new Intl.DateTimeFormat(dil === 'tr' ? 'tr-TR' : 'fr-BE', { timeZone: 'Europe/Brussels', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(bugun.tarih + 'T12:00:00'));
  return (
    <div class={kompakt ? '' : 'kart p-5 sm:p-6'}>
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p class="font-serif text-lg font-semibold capitalize">{tarihStr}</p>
        <p class="etiket">{etiketler.hicri}: <span class="normal-case tracking-normal">{bugun.hicri}</span></p>
      </div>
      <ul class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3" role="list">
        {SIRA.map((v) => {
          const aktif = siradaki?.vakit === v;
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
          <span class="etiket">{etiketler.siradaki}:</span> <strong class="text-(--metin)">{etiketler[siradaki.vakit]} {bugun.tarih === an.tarih && siradaki.vakit === 'imsak' && dk(bugun.imsak) <= an.dakika ? yarin?.imsak : bugun[siradaki.vakit]}</strong> · <span class="mono">{kalanStr}</span> {etiketler.kalan}
        </p>
      )}
    </div>
  );
}
