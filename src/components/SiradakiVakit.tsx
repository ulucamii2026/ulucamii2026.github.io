import { useEffect, useState } from 'preact/hooks';
import { hicriCevir } from '../i18n/hicri';
import { durumHesapla, sureMetni, type Gun } from '../lib/namaz';

/** Hero altı tek satırlık canlı şerit: sıradaki vakit + geri sayım + hicrî tarih */
interface Props { gunler: Gun[]; dil: 'tr' | 'fr'; etiketler: Record<string, string> }
export default function SiradakiVakit({ gunler, dil, etiketler }: Props) {
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setSimdi(new Date()), 1000); return () => clearInterval(id); }, []);
  const d = durumHesapla(gunler, simdi);
  if (!d || !d.siradaki) return null;
  const { siradaki, bugun } = d;
  return (
    <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm sm:text-base" aria-live="off">
      <span class="etiket text-(--color-ochre-acik)">{etiketler.siradaki}</span>
      <span class="font-serif font-semibold text-lg sm:text-xl">{etiketler[siradaki.vakit]} <span class="mono">{siradaki.saat}</span></span>
      <span class="text-(--color-krem)/80"><span class="mono">{sureMetni(siradaki.kalanDk, dil)}</span> {etiketler.kalan}</span>
      <span class="hidden sm:inline text-(--color-krem)/60">·</span>
      <span class="hidden sm:inline text-(--color-krem)/80">{hicriCevir(bugun.hicri, dil)}</span>
    </p>
  );
}
