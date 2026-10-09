/** Parça başına tekrar; kullanıcı başlatmadan ağ/ses yok. Her kayıt kendi olay oturumunu taşır. */
const kok = document.querySelector<HTMLElement>('[data-calisma]');
if (kok) {
  const bolum = kok.querySelector<HTMLSelectElement>('[data-bolum]')!;
  const tekrar = kok.querySelector<HTMLSelectElement>('[data-tekrar]')!;
  const hiz = kok.querySelector<HTMLSelectElement>('[data-hiz]')!;
  const bekle = kok.querySelector<HTMLInputElement>('[data-bekle]')!;
  const oynat = kok.querySelector<HTMLButtonElement>('[data-oynat]')!;
  const durdur = kok.querySelector<HTMLButtonElement>('[data-durdur]')!;
  const durum = kok.querySelector<HTMLElement>('[data-durum]')!;
  const parcalar = [...bolum.options].filter((o) => o.dataset.adres).map((o) => o.dataset.adres!);
  let ses: HTMLAudioElement | null = null;
  let oturum = 0;
  let oynatmaKomutu = 0;
  let zamanlayici: ReturnType<typeof setTimeout> | undefined;
  let caliyor = false;
  let ara = false;
  let basladi = false;
  let sira = 0;
  let tur = 1;
  let kuyruk: number[] = [];
  const metin = (ad: string) => kok.dataset[ad] ?? '';
  const arayiSil = () => { clearTimeout(zamanlayici); zamanlayici = undefined; };
  const sayac = () => `${metin('parca')} ${kuyruk[sira] + 1} / ${parcalar.length} · ${tur} / ${tekrar.value}`;
  const temizle = () => {
    oturum++;
    arayiSil();
    ses?.pause();
    if (ses) { ses.removeAttribute('src'); ses.load(); }
    ses = null;
  };
  const sifirla = (mesaj = metin('hazir')) => {
    temizle(); caliyor = false; ara = false; basladi = false; sira = 0; tur = 1;
    oynat.textContent = metin('baslat'); durdur.disabled = true; durum.textContent = mesaj;
  };
  const hata = (o: number) => { if (o === oturum) sifirla(metin('hata')); };
  const cal = () => {
    const simdiki = ses;
    if (!simdiki) return;
    const o = oturum;
    const komut = ++oynatmaKomutu;
    simdiki.playbackRate = Number(hiz.value);
    simdiki.play().then(() => {
      // Geç tamamlanan play() duraklatılmış ya da değiştirilmiş kaydı yeniden başlatmasın.
      if (o !== oturum || !caliyor) simdiki.pause();
    }).catch(() => { if (caliyor && komut === oynatmaKomutu) hata(o); });
  };
  const kaydiAc = () => {
    temizle();
    const o = oturum;
    const kayit = new Audio();
    ses = kayit;
    kayit.preload = 'none';
    kayit.src = parcalar[kuyruk[sira]];
    kayit.addEventListener('error', () => hata(o));
    kayit.addEventListener('ended', () => {
      if (o !== oturum || !caliyor) return;
      if (bekle.checked) {
        ara = true; durum.textContent = `${sayac()} · ${metin('bekliyor')}`;
        zamanlayici = setTimeout(ilerle, 3000);
      } else ilerle();
    });
    durum.textContent = sayac(); cal();
  };
  const ilerle = () => {
    if (!caliyor) return;
    arayiSil(); ara = false;
    if (tur < Number(tekrar.value)) tur++;
    else { tur = 1; sira++; }
    if (sira >= kuyruk.length) { sifirla(metin('bitti')); return; }
    kaydiAc();
  };
  oynat.addEventListener('click', () => {
    if (caliyor) {
      oynatmaKomutu++;
      caliyor = false; arayiSil(); ses?.pause(); oynat.textContent = metin('surdur');
      durum.textContent = `${sayac()} · ${metin('duraklat')}`;
      return;
    }
    caliyor = true; durdur.disabled = false; oynat.textContent = metin('duraklat');
    if (!basladi) {
      kuyruk = bolum.value === 'all' ? parcalar.map((_, i) => i) : [Number(bolum.value)];
      basladi = true; kaydiAc();
    } else if (ara) {
      if (bekle.checked) {
        durum.textContent = `${sayac()} · ${metin('bekliyor')}`;
        zamanlayici = setTimeout(ilerle, 3000);
      } else ilerle();
    } else { durum.textContent = sayac(); cal(); }
  });
  durdur.addEventListener('click', () => sifirla());
  // Bölüm/tekrar değişince yeni seçim kullanıcı başlatana dek sessiz kalır.
  bolum.addEventListener('change', () => sifirla());
  tekrar.addEventListener('change', () => sifirla());
  hiz.addEventListener('change', () => { if (ses) ses.playbackRate = Number(hiz.value); });
  bekle.addEventListener('change', () => {
    if (!bekle.checked && ara && caliyor) ilerle();
  });
  window.addEventListener('pagehide', () => sifirla());
  kok.querySelector<HTMLFieldSetElement>('[data-ayarlar]')!.disabled = false;
  oynat.disabled = false;
}
