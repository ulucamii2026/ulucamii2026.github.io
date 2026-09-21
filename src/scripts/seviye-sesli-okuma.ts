/** Seviye testi — soruyu sesli dinleme (okumakta zorlananlar için; 21 Eyl 2026).
 *
 *  Soru metnine ya da yanındaki hoparlör düğmesine dokununca o sorunun ÖNCEDEN üretilmiş klibi çalar
 *  (public/media/ses/seviye/<dil>/<kimlik>.mp3 — dış sunucuya istek yok). Klibi olmayan soruda düğme
 *  hiç basılmaz. Aynı soruya ikinci dokunuş durdurur; şık seçilince okuma susar.
 *
 *  Aşamalı geliştirme: bu betik hata verirse form aynen çalışır. Doğruluk bilgisi yoktur; klip bütün
 *  şıkları aynı tonda okur. Arapça ibareler bu seslerde OKUNMAZ (yalnız Diyanet sesleri — `[data-ses]`). */

export function sesliOkumayiBaslat(form: HTMLFormElement): void {
  const dugmeler = form.querySelectorAll<HTMLButtonElement>('button[data-oku]');
  if (!dugmeler.length) return;
  let calar: HTMLAudioElement | null = null;
  let acik: HTMLButtonElement | null = null;

  const bitir = () => {
    if (!acik) return;
    acik.removeAttribute('data-caliyor');
    acik.setAttribute('aria-pressed', 'false');
    acik.closest('fieldset')?.removeAttribute('data-okunuyor');
    acik = null;
  };
  const sus = () => { calar?.pause(); bitir(); };

  const cal = (dugme: HTMLButtonElement) => {
    const ayni = acik === dugme;
    sus();
    if (ayni) return;                                   // ikinci dokunuş yalnız durdurur
    if (!calar) {
      calar = new Audio();
      calar.preload = 'none';
      calar.addEventListener('ended', bitir);
      calar.addEventListener('error', bitir);
    }
    acik = dugme;
    dugme.setAttribute('data-caliyor', '1');
    dugme.setAttribute('aria-pressed', 'true');
    dugme.closest('fieldset')?.setAttribute('data-okunuyor', '1');
    calar.src = dugme.dataset.oku ?? '';
    // Öteki çalar (Diyanet «Dinle» düğmesi) sussun: iki ses üst üste binmez.
    form.dispatchEvent(new CustomEvent('st:ses', { detail: 'oku' }));
    void calar.play().catch(bitir);
  };

  form.addEventListener('click', (olay) => {
    const hedef = olay.target as HTMLElement;
    const dugme = hedef.closest<HTMLButtonElement>('button[data-oku]');
    if (dugme) { cal(dugme); return; }
    // Soru metninin kendisine dokunmak da okutur (metin seçerken değil).
    const baslik = hedef.closest<HTMLElement>('legend');
    const bagli = baslik?.querySelector<HTMLButtonElement>('button[data-oku]');
    if (bagli && !String(getSelection?.() ?? '')) cal(bagli);
  });
  // Cevap verilince, adım değişince ya da öteki çalar başlayınca okuma susar.
  form.addEventListener('change', (olay) => { if ((olay.target as HTMLElement).matches('input[type="radio"], input[type="checkbox"]')) sus(); });
  form.addEventListener('form:adim', sus);
  form.addEventListener('st:ses', (olay) => { if ((olay as CustomEvent<string>).detail !== 'oku') sus(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') sus(); });
}
