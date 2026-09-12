/** Başarı ancak tarayıcı gerçekten kopyalamayı kabul ettiğinde döner. */
export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(metin);
      return true;
    }
  } catch { /* İzin reddedilirse eski tarayıcı yolunu da dene. */ }

  const odak = document.activeElement;
  const secim = window.getSelection();
  const araliklar = secim ? Array.from({ length: secim.rangeCount }, (_, i) => secim.getRangeAt(i).cloneRange()) : [];
  const alan = document.createElement('textarea');
  alan.value = metin;
  alan.readOnly = true;
  alan.style.cssText = 'position:fixed;inset:0 auto auto 0;opacity:0;font-size:16px';
  try {
    document.body.appendChild(alan);
    alan.select();
    alan.setSelectionRange(0, alan.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    alan.remove();
    if (odak instanceof HTMLElement && odak.isConnected) odak.focus({ preventScroll: true });
    if (secim) {
      secim.removeAllRanges();
      araliklar.forEach((aralik) => secim.addRange(aralik));
    }
  }
}
