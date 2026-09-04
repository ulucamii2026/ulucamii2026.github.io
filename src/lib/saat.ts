import { useEffect, useState } from 'preact/hooks';

/**
 * Dakika sınırına hizalı saat — namaz adacıklarının ortak nabzı.
 *
 * Neden: iki adacık da `setInterval(..., 1000)` ile saniyede bir tüm ağacı yeniden çiziyordu, oysa
 * gösterilen en küçük birim DAKİKA ("2 sa 09 dk kaldı"). Saniyede bir render, telefonda boşuna
 * CPU ve pil harcıyordu (4 Eylül 2026 performans denetimi).
 *
 * Hizalama önemli: gecikme her seferinde bir sonraki tam dakikaya göre hesaplanır (+250 ms güvenlik
 * payı), böylece vurgulu vakit tam saat başında değişir — sabit 60 sn'lik aralıkta sapma birikirdi.
 * Sekme geri gelince (visibilitychange) hemen tazelenir: telefon saatlerce uykudayken timer'lar
 * kısılır ve dönüşte ekranda eski vakit kalırdı.
 */
export function useDakikaSaati(): Date {
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => {
    let zaman = 0;
    const kur = () => {
      const gecikme = 60_000 - (Date.now() % 60_000) + 250;
      zaman = window.setTimeout(() => { setSimdi(new Date()); kur(); }, gecikme);
    };
    kur();
    const tazele = () => { if (!document.hidden) setSimdi(new Date()); };
    document.addEventListener('visibilitychange', tazele);
    return () => { window.clearTimeout(zaman); document.removeEventListener('visibilitychange', tazele); };
  }, []);
  return simdi;
}
