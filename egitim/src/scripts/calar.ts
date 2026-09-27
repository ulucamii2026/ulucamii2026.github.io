/**
 * Çal düğmeleri: tek ses nesnesi, aynı anda tek madde. Ses ulucamii.be'den gelir (Diyanet kayıtları, bkz.
 * docs/dinleme-ses-kaynaklari.json); parçalı madde parçaları sırayla çalar. Düğmenin simgesi ve erişilebilir adı
 * birlikte değişir (Dinle ↔ Durdur). Her oynatma bir oturum numarası alır: eski oynatmanın geç gelen olayları
 * (yarıda kesilen yükleme, hata) yenisini durduramaz. Ses açılamazsa durum satırı sayfa dilinde söyler.
 */
const dugmeler = [...document.querySelectorAll<HTMLButtonElement>('button.dinle[data-ses]')];
const durum = document.querySelector<HTMLElement>('[data-ses-durumu]');

if (dugmeler.length) {
  const ses = new Audio();
  ses.preload = 'none';
  let calan: HTMLButtonElement | null = null;
  let kuyruk: string[] = [];
  let oturum = 0;

  const goster = (d: HTMLButtonElement, caliyor: boolean) => {
    d.toggleAttribute('data-caliyor', caliyor);
    d.setAttribute('aria-label', (caliyor ? d.dataset.etiketDurdur : d.dataset.etiketDinle) ?? '');
  };
  const durdur = () => {
    oturum++;
    ses.pause();
    if (calan) goster(calan, false);
    calan = null;
    kuyruk = [];
  };
  const hata = (o: number) => {
    if (o !== oturum) return;
    durdur();
    if (durum) durum.textContent = durum.dataset.hata ?? '';
  };
  const siradaki = (o: number) => {
    if (o !== oturum) return;
    const adres = kuyruk.shift();
    if (!adres) {
      durdur();
      return;
    }
    ses.src = adres;
    ses.play().catch((e: unknown) => {
      if ((e as { name?: string })?.name !== 'AbortError') hata(o);
    });
  };

  ses.addEventListener('ended', () => siradaki(oturum));
  ses.addEventListener('error', () => { if (calan) hata(oturum); });
  for (const d of dugmeler) {
    d.addEventListener('click', () => {
      const ayni = calan === d;
      durdur();
      if (ayni) return;
      calan = d;
      goster(d, true);
      if (durum) durum.textContent = '';
      kuyruk = (d.dataset.ses ?? '').split(' ').filter(Boolean);
      siradaki(oturum);
    });
  }
}
