import { cumaHatirlatmasi, type Gun } from '../lib/namaz';
import { useDakikaSaati } from '../lib/saat';

/**
 * Cuma namazı hatırlatma bandı (1 Kasım 2026 yönetim kararı: Cuma saati hatırlatması Facebook'ta ve sitede).
 * Perşembe bütün gün «Yarın Cuma», Cuma günü namazdan bir saat sonrasına kadar «Bugün Cuma» yazar; öbür
 * günler hiçbir şey basmaz. Gün ve saat tarayıcıda hesaplanır (derleme saatine bağlı değil); saat Diyanet
 * öğle vaktidir ya da sitede girilmiş sabit Cuma saati (lib/namaz → cumaVakti). Veri yoksa bant çıkmaz.
 */
interface Props {
  cumalar: Array<Pick<Gun, 'tarih' | 'ogle'>>;
  sabit?: string;
  /** «{saat}» yer tutuculu başlıklar ve hutbe satırı (ui.ts → namaz.cumaYarin / cumaBugun / cumaHutbe) */
  metinler: { yarin: string; bugun: string; hutbe: string };
  sinif?: string;
}

export default function CumaHatirlatma({ cumalar, sabit, metinler, sinif = '' }: Props) {
  const simdi = useDakikaSaati();
  const h = cumaHatirlatmasi(cumalar, simdi, sabit);
  if (!h) return null;
  const [once, sonra] = (h.tur === 'yarin' ? metinler.yarin : metinler.bugun).split('{saat}');
  return (
    <p class={`cuma-hatirlatma flex items-start gap-3 rounded-(--radius-kose) border border-(--vurgu)/45 bg-(--vurgu)/8 px-4 py-3 text-(--metin) ${sinif}`} role="status" data-tur={h.tur}>
      {/* Hilal: Cuma'nın sade işareti (kalp ya da insan figürü yok). */}
      <svg class="mt-0.5 h-5 w-5 shrink-0 text-(--vurgu)" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M14.5 3.2a9 9 0 1 0 6.3 14.6A7.4 7.4 0 0 1 14.5 3.2Z" />
      </svg>
      <span>
        <strong class="font-semibold">{once}<span class="mono">{h.saat}</span>{sonra}</strong>
        <span class="text-(--metin-2)"> · {metinler.hutbe}</span>
      </span>
    </p>
  );
}
