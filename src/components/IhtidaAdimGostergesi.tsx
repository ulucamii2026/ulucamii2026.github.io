/** İhtida Başvuru Formu — numaralı adım göstergesi (tamamlanan / aktif / bekleyen).
 *  Saf görsel bileşen; asıl erişilebilir duyuru (aria-live) IhtidaFormu.tsx'teki
 *  metin etikette kalır, bu yüzden liste aria-hidden'dır. */
interface Props { adim: number; toplam: number }

function OnayIsareti() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export default function IhtidaAdimGostergesi({ adim, toplam }: Props) {
  return (
    <ol class="flex items-center overflow-x-auto -mx-1 px-1 py-0.5" aria-hidden="true">
      {Array.from({ length: toplam }, (_, i) => {
        const tamamlandi = i < adim;
        const aktif = i === adim;
        return (
          <li class="flex items-center shrink-0" key={i}>
            <span
              class={
                'flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[11px] sm:text-xs font-semibold shrink-0 border-2 transition-colors '
                + (tamamlandi
                  ? 'bg-(--vurgu) border-(--vurgu) text-white'
                  : aktif
                    ? 'border-(--vurgu) text-(--vurgu) bg-(--zemin)'
                    : 'border-(--cizgi) text-(--metin-2) bg-(--zemin)')
              }
            >
              {tamamlandi ? <OnayIsareti /> : i + 1}
            </span>
            {i < toplam - 1 && (
              <span class={'h-0.5 w-3.5 sm:w-6 shrink-0 transition-colors ' + (tamamlandi ? 'bg-(--vurgu)' : 'bg-(--cizgi)')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
