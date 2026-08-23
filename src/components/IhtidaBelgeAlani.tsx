/** İhtida Başvuru Formu — belge/fotoğraf yükleme alanı: sürükle-bırak + kamera + galeri,
 *  önizleme kartı ve durum etiketi. Kur'an kursu kayıt sistemindeki upload-panel deseninin
 *  site tasarım diliyle (Kilim Kartografyası: .kart-kagit, .etiket, .dugme*) yeniden kurulmuş
 *  hâlidir. Saf görsel/etkileşim bileşeni — dosya sıkıştırma mantığı IhtidaFormu.tsx'te kalır. */
import { useId, useState } from 'preact/hooks';
import type { JSX } from 'preact';

interface Props {
  etiket: string;
  deger: string;
  hata?: string;
  zorunlu?: boolean;
  isleniyor: boolean;
  kameraEtiketi: string;
  galeriEtiketi: string;
  kaldirEtiketi: string;
  surukleBirakEtiketi: string;
  henuzEklenmediEtiketi: string;
  gorselEklendiEtiketi: string;
  isleniyorEtiketi: string;
  onSecildi: (file: File) => void;
  onKaldir: () => void;
}

function KameraIkonu() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.5 5 10 3h4l1.5 2H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}
function GaleriIkonu() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9" r="1.6" />
      <path d="m21 15-5.5-5.5L7 18" />
    </svg>
  );
}

export default function IhtidaBelgeAlani({
  etiket, deger, hata, zorunlu, isleniyor,
  kameraEtiketi, galeriEtiketi, kaldirEtiketi, surukleBirakEtiketi,
  henuzEklenmediEtiketi, gorselEklendiEtiketi, isleniyorEtiketi,
  onSecildi, onKaldir,
}: Props) {
  const [surukleniyor, setSurukleniyor] = useState(false);
  const kameraId = useId();
  const galeriId = useId();
  const hataId = useId();

  function dosyaSec(e: JSX.TargetedEvent<HTMLInputElement>) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) onSecildi(f);
    (e.target as HTMLInputElement).value = '';
  }

  function birak(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) {
    e.preventDefault();
    setSurukleniyor(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onSecildi(f);
  }

  return (
    <div class="grid gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="etiket">{etiket}{zorunlu && ' *'}</span>
        <span class={`text-xs rounded-full px-2 py-0.5 border ${deger ? 'border-(--vurgu-2) text-(--vurgu-2)' : 'border-(--cizgi) text-(--metin-2)'}`}>
          {isleniyor ? isleniyorEtiketi : (deger ? gorselEklendiEtiketi : henuzEklenmediEtiketi)}
        </span>
      </div>

      {deger ? (
        <div class="kart-kagit p-2 flex items-center gap-3">
          <img src={deger} alt="" class="h-20 w-20 object-cover rounded-(--radius-kose) border border-(--cizgi) shrink-0" />
          <div class="flex flex-wrap gap-2">
            <label for={kameraId} class="dugme dugme-ikincil min-h-11 cursor-pointer text-sm">
              <KameraIkonu />{kameraEtiketi}
            </label>
            <button type="button" class="dugme dugme-ikincil min-h-11 text-sm" onClick={onKaldir}>{kaldirEtiketi}</button>
            {/* aria-hidden: erişilebilir ad/durum yukarıdaki etiket üzerinden verilir — aksi hâlde
                ekran okuyucu aynı düğmeyi (label + gizli input) iki kez duyurur. */}
            <input id={kameraId} type="file" accept="image/*" capture="environment" class="sr-only" aria-hidden="true" onChange={dosyaSec} tabIndex={-1} />
          </div>
        </div>
      ) : (
        <div
          class="kart-kagit grid gap-3 place-items-center text-center p-5 transition-colors"
          style={{
            borderWidth: '2px',
            borderStyle: 'dashed',
            borderColor: surukleniyor ? 'var(--vurgu-2)' : 'var(--cizgi-etkilesim)',
            background: surukleniyor ? 'var(--zemin-3)' : 'var(--zemin)',
          }}
          onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
          onDragLeave={() => setSurukleniyor(false)}
          onDrop={birak}
        >
          <p class="text-sm text-(--metin-2)">{isleniyor ? isleniyorEtiketi : surukleBirakEtiketi}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <label for={kameraId} tabIndex={0} role="button"
              aria-required={zorunlu ? true : undefined} aria-invalid={hata ? true : undefined} aria-describedby={hata ? hataId : undefined}
              class="dugme dugme-ikincil min-h-11 cursor-pointer text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (document.getElementById(kameraId) as HTMLInputElement)?.click(); } }}>
              <KameraIkonu />{kameraEtiketi}
            </label>
            <label for={galeriId} tabIndex={0} role="button"
              aria-required={zorunlu ? true : undefined} aria-invalid={hata ? true : undefined} aria-describedby={hata ? hataId : undefined}
              class="dugme dugme-ikincil min-h-11 cursor-pointer text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (document.getElementById(galeriId) as HTMLInputElement)?.click(); } }}>
              <GaleriIkonu />{galeriEtiketi}
            </label>
          </div>
          {/* aria-hidden: erişilebilir ad, zorunluluk ve hata durumu yukarıdaki etiketler
              üzerinden verilir — aksi hâlde ekran okuyucu aynı düğmeyi iki kez duyurur. */}
          <input id={kameraId} type="file" accept="image/*" capture="environment" class="sr-only" aria-hidden="true" onChange={dosyaSec} tabIndex={-1} />
          <input id={galeriId} type="file" accept="image/*" class="sr-only" aria-hidden="true" onChange={dosyaSec} tabIndex={-1} />
        </div>
      )}
      {hata && <span id={hataId} class="text-sm text-(--vurgu)" role="alert">{hata}</span>}
    </div>
  );
}
