import { hicriCevir } from '../i18n/hicri';
import { durumHesapla, sureMetni, type Gun } from '../lib/namaz';
import { useDakikaSaati } from '../lib/saat';
import type { Dil } from '../i18n/ui';

/** sureMetni yalnız tr/fr biliyor (src/lib/namaz.ts kapsam dışı) — İngilizce burada yerelce eklenir. */
function sureMetniYerel(dk: number, dil: Dil): string {
  if (dil === 'en') {
    const sa = Math.floor(dk / 60), d = dk % 60;
    return sa > 0 ? `${sa}h ${String(d).padStart(2, '0')}m` : `${d} min`;
  }
  return sureMetni(dk, dil);
}

/** Hero altı tek satırlık canlı şerit: sıradaki vakit + geri sayım + hicrî tarih */
interface Props { gunler: Gun[]; dil: Dil; etiketler: Record<string, string> }
export default function SiradakiVakit({ gunler, dil, etiketler }: Props) {
  /* Dakikada bir, tam dakika sınırında tazelenir — gösterilen en küçük birim dakika olduğu için
     saniyelik render boşunaydı (bkz. src/lib/saat.ts). */
  const simdi = useDakikaSaati();
  const d = durumHesapla(gunler, simdi);
  if (!d || !d.siradaki) return null;
  const { siradaki, bugun } = d;
  return (
    <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm sm:text-base drop-shadow-[0_1px_8px_rgba(0,0,0,.5)]" aria-live="off">
      <span class="etiket text-(--color-ochre-acik)">{etiketler.siradaki}</span>
      <span class="font-serif font-semibold text-lg sm:text-xl">{etiketler[siradaki.vakit]} <span class="mono">{siradaki.saat}</span></span>
      <span class="text-(--color-krem)/85"><span class="mono">{sureMetniYerel(siradaki.kalanDk, dil)}</span> {etiketler.kalan}</span>
      <span class="hidden sm:inline text-(--color-krem)/65">·</span>
      <span class="hidden sm:inline text-(--color-krem)/85">{hicriCevir(bugun.hicri, dil)}</span>
    </p>
  );
}
