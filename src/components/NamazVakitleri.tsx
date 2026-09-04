import { useMemo } from 'preact/hooks';
import { hicriCevir } from '../i18n/hicri';
import { SIRA, TZ, durumHesapla, haftaGunu, sureMetni, type Gun, type Vakit } from '../lib/namaz';
import { useDakikaSaati } from '../lib/saat';
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
  /** Vakit hücresine sığan kısa Cuma etiketi ("Cuma" / "Vendredi" / "Friday") */
  cumaKisaEtiket?: string;
  /** site.yaml'daki sabit Cuma saati. Boşsa Cuma günü öğle vaktinden TÜRETİLİR (uydurulmaz). */
  cumaSaati?: string;
  /** "Hutbe öğle vaktinde başlar" gibi tek satırlık açıklama */
  cumaAciklama?: string;
}

/** sureMetni yalnız tr/fr biliyor (src/lib/namaz.ts kapsam dışı) — İngilizce burada yerelce eklenir. */
function sureMetniYerel(dk: number, dil: Dil): string {
  if (dil === 'en') {
    const sa = Math.floor(dk / 60), d = dk % 60;
    return sa > 0 ? `${sa}h ${String(d).padStart(2, '0')}m` : `${d} min`;
  }
  return sureMetni(dk, dil);
}

export default function NamazVakitleri({ gunler, dil, etiketler, kompakt = false, vurgulu = false, cumaEtiket, cumaKisaEtiket, cumaSaati, cumaAciklama }: Props) {
  const simdi = useDakikaSaati();
  const d = durumHesapla(gunler, simdi);
  const yerelKod = dil === 'tr' ? 'tr-TR' : dil === 'en' ? 'en-GB' : 'fr-BE';
  /* Intl.DateTimeFormat kurulumu pahalıdır; dile göre bir kez kurulur (her render'da değil). */
  const bicimci = useMemo(
    () => new Intl.DateTimeFormat(yerelKod, { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [yerelKod],
  );
  if (!d) return null;
  const { bugun, eski, siradaki } = d;
  /* UTC öğlen: ziyaretçinin saat dilimi ne olursa olsun Brüksel'de aynı takvim gününe düşer
     (yerel 'T12:00:00' UTC-11 gibi dilimlerde bir gün kaydırıyordu). */
  const gunOrtasi = new Date(bugun.tarih + 'T12:00:00Z');
  const tarihStr = bicimci.format(gunOrtasi);
  const uyari = dil === 'tr' ? 'Vakit tablosu güncellenmeyi bekliyor — lütfen cami ilan panosundaki çizelgeye bakınız.' : dil === 'en' ? 'The prayer schedule is awaiting an update — please check the notice board at the mosque.' : 'Le tableau des horaires attend une mise à jour — veuillez consulter l’affichage à la mosquée.';
  /* Cuma: cemaatin en sık sorduğu saat. Sabit bir Cuma saati girilmemişse (site.yaml → cumaSaati)
     o günün Diyanet ÖĞLE vaktini gösteririz — bu bir varsayım değil, caminin fiilî uygulamasıdır
     ("Öğle vaktinde", site.yaml haftalikProgram). Uydurma bir saat asla yazılmaz. */
  const cumaMi = !eski && haftaGunu(gunOrtasi) === 5;
  const cumaGoster = cumaEtiket && (cumaSaati || cumaMi);
  const cumaDegeri = cumaSaati || (cumaMi ? bugun.ogle : '');
  // Rakam boyutu kutunun kendi genişliğine bağlı (container query): 5 karakterlik saat ~2,6em → 31cqw hiçbir genişlikte taşmaz
  const rakam = vurgulu ? 'text-[min(1.6rem,31cqw)] sm:text-[min(2.1rem,31cqw)] tracking-tight' : 'text-[min(1.7rem,31cqw)]';
  return (
    /* aria-live="off": kalan süre dakika hassasiyetinde ve ekranda kendiliğinden değişiyor;
       ekran okuyucunun her tazelemede araya girmesi istenmez (SiradakiVakit ile aynı karar). */
    <div class={kompakt || vurgulu ? '' : 'kart p-5 sm:p-6'} aria-live="off">
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p class="font-serif text-lg sm:text-xl font-semibold capitalize">{tarihStr}</p>
        <p class="etiket">{etiketler.hicri}: <span class="normal-case tracking-normal">{hicriCevir(bugun.hicri, dil)}</span></p>
      </div>
      {eski && <p class="uyari text-sm mb-4" role="status">{uyari}</p>}
      <ul class={`grid grid-cols-3 gap-2 sm:gap-3 ${vurgulu ? 'md:grid-cols-6' : 'sm:grid-cols-6'}`} role="list">
        {SIRA.map((v: Vakit) => {
          const aktif = !!siradaki && siradaki.vakit === v && !siradaki.yarinMi;
          const cumaHucresi = cumaMi && v === 'ogle' && !cumaSaati;
          return (
            <li class={`@container relative min-w-0 text-center border rounded-(--radius-kose) py-3 px-1 transition-[background-color,border-color,box-shadow] duration-300 ease-out ${aktif ? 'border-(--vurgu-2) bg-(--vurgu-2)/8 shadow-[0_8px_24px_-16px_var(--vurgu-2)]' : cumaHucresi ? 'border-(--vurgu)/55' : 'border-(--cizgi)'} ${vurgulu ? 'bg-(--zemin)/70' : ''}`} aria-current={aktif ? 'time' : undefined}>
              <span class={`etiket block transition-colors duration-300 ease-out ${aktif ? 'text-(--vurgu-2)' : ''}`}>{etiketler[v]}</span>
              <span class={`rakam block mt-1 leading-none whitespace-nowrap ${rakam}`}>{bugun[v]}</span>
              {/* Kısa etiket: uzun hâli ("Cuma namazı") hücreye 9,9 px'e küçültülerek sığıyordu —
                  okunabilirlik alt sınırı (11,5 px) altında kalıyordu. */}
              {cumaHucresi && cumaKisaEtiket && (
                <span class="etiket block mt-1 leading-none text-(--vurgu)">{cumaKisaEtiket}</span>
              )}
            </li>
          );
        })}
      </ul>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-(--metin-2)">
        {/* Vurgulu (ana sayfa) varyantta "sıradaki vakit" satırı YOK: aynı bilgi hero şeridinde ve
            tablodaki vurgulu hücrede zaten var, üçüncü kez tekrarlanmaz (4 Eylül 2026 denetimi). */}
        {siradaki && !vurgulu && (
          <p>
            <span class="etiket">{etiketler.siradaki}:</span> <strong class="text-(--metin)">{etiketler[siradaki.vakit]} {siradaki.saat}</strong> · <span class="mono">{sureMetniYerel(siradaki.kalanDk, dil)}</span> {etiketler.kalan}
          </p>
        )}
        {cumaGoster && (
          <p class={vurgulu ? 'text-(--metin)' : undefined}>
            <span class="etiket etiket-vurgu">{cumaEtiket}:</span> <strong class="text-(--metin) mono">{cumaDegeri}</strong>
            {cumaAciklama && <span class="text-(--metin-2)"> · {cumaAciklama}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
