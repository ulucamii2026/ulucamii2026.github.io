/**
 * «Kartı yazdır» (Faz 2e): düğme yalnız JavaScript varken görünür ve tarayıcının yazdır penceresini açar. Kartın düzeni
 * egitim/src/styles/kart.css'teki yazdırma stilindendir; telefonda "PDF olarak kaydet" de aynı yoldan çalışır.
 */
const dugme = document.querySelector<HTMLButtonElement>('[data-yazdir]');
if (dugme) {
  dugme.hidden = false;
  dugme.addEventListener('click', () => window.print());
}
