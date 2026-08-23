import { useEffect, useState } from 'preact/hooks';
import { hicriCevir } from '../i18n/hicri';
import { SIRA, TZ, durumHesapla, sureMetni, type Gun, type Vakit } from '../lib/namaz';
import type { Dil } from '../i18n/ui';

export type { Gun };
interface Props {
  gunler: Gun[];
  dil: Dil;
  etiketler: Record<'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'siradaki' | 'kalan' | 'hicri', string>;
  kompakt?: boolean;
  /** Ana sayfadaki vurgulu varyant: daha büyük rakamlar, zeminsiz */
  vurgulu?: boolean;
  cumaEtiket?: string;
  cumaSaati?: string;
}

/** sureMetni yalnız tr/fr biliyor (src/lib/namaz.ts kapsam dışı) — İngilizce burada yerelce eklenir. */
function sureMetniYerel(dk: number, dil: Dil): string {
  if (dil === 'en') {
    const sa = Math.floor(dk / 60), d = dk % 60;
    return sa > 0 ? `${sa}h ${String(d).padStart(2, '0')}m` : `${d} min`;
  }
  return sureMetni(dk, dil);
}

export default function NamazVakitleri({ gunler, dil, etiketler, kompakt = false, vurgulu = false, cumaEtiket, cumaSaati }: Props) {
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setSimdi(new Date()), 1000); return () => clearInterval(id); }, []);
  const d = durumHesapla(gunler, simdi);
  if (!d) return null;
  const { bugun, eski, siradaki } = d;
  const tarihStr = new Intl.DateTimeFormat(dil === 'tr' ? 'tr-TR' : dil === 'en' ? 'en-GB' : 'fr-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(bugun.tarih + 'T12:00:00'));
  const uyari = dil === 'tr' ? 'Vakit tablosu güncellenmeyi bekliyor — lütfen cami ilan panosundaki çizelgeye bakınız.' : dil === 'en' ? 'The prayer schedule is awaiting an update — please check the notice board at the mosque.' : 'Le tableau des horaires attend une mise à jour — veuillez consulter l’affichage à la mosquée.';
  // Rakam boyutu kutunun kendi genişliğine bağlı (container query): 5 karakterlik saat ~2,6em → 31cqw hiçbir genişlikte taşmaz
  const rakam = vurgulu ? 'text-[min(1.6rem,31cqw)] sm:text-[min(2.1rem,31cqw)] tracking-tight' : 'text-[min(1.7rem,31cqw)]';
  return (
    <div class={kompakt || vurgulu ? '' : 'kart p-5 sm:p-6'}>
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p class="font-serif text-lg sm:text-xl font-semibold capitalize">{tarihStr}</p>
        <p class="etiket">{etiketler.hicri}: <span class="normal-case tracking-normal">{hicriCevir(bugun.hicri, dil)}</span></p>
      </div>
      {eski && <p class="uyari text-sm mb-4" role="status">{uyari}</p>}
      <ul class={`grid grid-cols-3 gap-2 sm:gap-3 ${vurgulu ? 'md:grid-cols-6' : 'sm:grid-cols-6'}`} role="list">
        {SIRA.map((v: Vakit) => {
          const aktif = !!siradaki && siradaki.vakit === v && !siradaki.yarinMi;
          return (
            <li class={`@container min-w-0 text-center border rounded-(--radius-kose) py-3 px-1 transition-colors ${aktif ? 'border-(--vurgu) bg-(--vurgu)/8 shadow-[0_8px_24px_-16px_var(--vurgu)]' : 'border-(--cizgi)'} ${vurgulu ? 'bg-(--zemin)/70' : ''}`} aria-current={aktif ? 'time' : undefined}>
              <span class={`etiket block ${aktif ? 'etiket-vurgu' : ''}`}>{etiketler[v]}</span>
              <span class={`rakam block mt-1 leading-none whitespace-nowrap ${rakam}`}>{bugun[v]}</span>
            </li>
          );
        })}
      </ul>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-(--metin-2)">
        {siradaki && (
          <p>
            <span class="etiket">{etiketler.siradaki}:</span> <strong class="text-(--metin)">{etiketler[siradaki.vakit]} {siradaki.saat}</strong> · <span class="mono">{sureMetniYerel(siradaki.kalanDk, dil)}</span> {etiketler.kalan}
          </p>
        )}
        {cumaEtiket && cumaSaati && <p><span class="etiket">{cumaEtiket}:</span> <strong class="text-(--metin) mono">{cumaSaati}</strong></p>}
      </div>
    </div>
  );
}
