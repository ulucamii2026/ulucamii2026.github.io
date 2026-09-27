// Ziyaretçinin bu platformda en son kullandığı dil: kök sayfa (/) bir sonraki gelişte oraya gönderir.
const dil = document.documentElement.dataset.dil;
if (dil) {
  try {
    localStorage.setItem('ulucamiiEgitimDili', dil);
  } catch {
    /* gizli sekme ya da depolama kapalı: kök sayfa tarayıcı diline bakar */
  }
}
