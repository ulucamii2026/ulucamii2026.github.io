/**
 * Parça başına tekrar; kullanıcı başlatmadan ağ/ses yok. Her kayıt kendi olay oturumunu taşır.
 * «Senin sıran» arası (Faz 2e): hâfız bir bölümü bitirince çocuk tekrar eder; bekleme sabit 3 sn değil, kaydın süresinin
 * katıdır (×1 / ×1,5 / ×2 ya da hiç), hesap src/lib/ezber/sira.ts'te. Bekleme sürerken ince bir çubuk dolar (ekran okuyucudan
 * gizli; durum yazısı zaten «Şimdi siz tekrarlayın» der). Seçim kutusunu «Yok» yapmak beklemeyi hemen geçer.
 * Ezan vakit seçimi (25 Ekim 2026, dosyanın sonunda): radyo grubu çalınacak kaydı ve notu değiştirir, çalmayı durdurur.
 */
import { siraKatsayisi, siraSuresiMs } from '@ortak/lib/ezber/sira';

const kok = document.querySelector<HTMLElement>('[data-calisma]');
if (kok) {
  const bolum = kok.querySelector<HTMLSelectElement>('[data-bolum]')!;
  const tekrar = kok.querySelector<HTMLSelectElement>('[data-tekrar]')!;
  const hiz = kok.querySelector<HTMLSelectElement>('[data-hiz]')!;
  const siraSec = kok.querySelector<HTMLSelectElement>('[data-sira]')!;
  const ilerleme = kok.querySelector<HTMLProgressElement>('[data-sira-ilerleme]');
  const oynat = kok.querySelector<HTMLButtonElement>('[data-oynat]')!;
  const durdur = kok.querySelector<HTMLButtonElement>('[data-durdur]')!;
  const durum = kok.querySelector<HTMLElement>('[data-durum]')!;
  const parcalar = [...bolum.options].filter((o) => o.dataset.adres).map((o) => o.dataset.adres!);
  let ses: HTMLAudioElement | null = null;
  let oturum = 0;
  let oynatmaKomutu = 0;
  let zamanlayici: ReturnType<typeof setTimeout> | undefined;
  let cubukSayaci: ReturnType<typeof setInterval> | undefined;
  /** Son biten kaydın süresi (sn; ölçülemediyse NaN) ve ondan hesaplanan bekleme (ms). */
  let sonSure = Number.NaN;
  let araMs = 0;
  let caliyor = false;
  let ara = false;
  let basladi = false;
  let sira = 0;
  let tur = 1;
  let kuyruk: number[] = [];
  const metin = (ad: string) => kok.dataset[ad] ?? '';
  const arayiSil = () => {
    clearTimeout(zamanlayici);
    zamanlayici = undefined;
    clearInterval(cubukSayaci);
    cubukSayaci = undefined;
    kok.removeAttribute('data-senin-siran');
    if (ilerleme) { ilerleme.value = 0; ilerleme.removeAttribute('data-aktif'); }
  };
  const bekleSuresi = () => siraSuresiMs(sonSure, siraKatsayisi(siraSec.value), Number(hiz.value));
  // Bekleme: süre dolunca ilerle(); çubuk her 100 ms'de bir dolar. Süre 0 ise hiç beklenmez.
  const bekleBaslat = () => {
    if (araMs <= 0) { ilerle(); return; }
    arayiSil();
    ara = true;
    durum.textContent = `${sayac()} · ${metin('bekliyor')}`;
    kok.setAttribute('data-senin-siran', '');
    if (ilerleme) {
      const bas = Date.now();
      const sure = araMs;
      ilerleme.value = 0;
      ilerleme.setAttribute('data-aktif', '');
      cubukSayaci = setInterval(() => { ilerleme.value = Math.min(1, (Date.now() - bas) / sure); }, 100);
    }
    zamanlayici = setTimeout(ilerle, araMs);
  };
  // Madde sayfası (madde.ts) çalan bölümü metinde işaretler: -1 = çalma bitti.
  const duyur = (parca: number) => kok.dispatchEvent(new CustomEvent('calisma:parca', { detail: parca }));
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
    duyur(-1);
  };
  const hata = (o: number) => { if (o === oturum) sifirla(metin('hata')); };
  const cal = () => {
    const simdiki = ses;
    if (!simdiki) return;
    const o = oturum;
    const komut = ++oynatmaKomutu;
    simdiki.playbackRate = Number(hiz.value);
    // Sayfada tek ses: çalışma kipleri (kip-ortak.ts) bu olayı duyunca kendi kaydını keser.
    document.dispatchEvent(new CustomEvent('ezber:ses-basladi', { detail: 'calisma' }));
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
      sonSure = kayit.duration;
      araMs = bekleSuresi();
      bekleBaslat();
    });
    durum.textContent = sayac(); duyur(kuyruk[sira]); cal();
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
      bekleBaslat();
    } else { durum.textContent = sayac(); cal(); }
  });
  durdur.addEventListener('click', () => sifirla());
  // Bölüm/tekrar değişince yeni seçim kullanıcı başlatana dek sessiz kalır.
  bolum.addEventListener('change', () => sifirla());
  tekrar.addEventListener('change', () => sifirla());
  hiz.addEventListener('change', () => { if (ses) ses.playbackRate = Number(hiz.value); });
  // Seçim bekleme sürerken değişirse yeni süreyle yeniden başlar; «Yok» beklemeyi hemen geçer. Duraklatılmışsa yalnız süre güncellenir.
  siraSec.addEventListener('change', () => {
    araMs = bekleSuresi();
    if (ara && caliyor) bekleBaslat();
  });
  window.addEventListener('pagehide', () => sifirla());
  // Çalışma kiplerinden biri ses başlatırsa bu çalar durur (calisma zamanlaması değişmez).
  document.addEventListener('ezber:ses-basladi', (e) => {
    if ((e as CustomEvent<string>).detail !== 'calisma' && (caliyor || basladi)) sifirla();
  });
  // Metindeki âyet düğmesi o bölümü baştan çalar (madde.ts).
  kok.addEventListener('calisma:cal', (e) => {
    const deger = String((e as CustomEvent<number>).detail);
    if (![...bolum.options].some((o) => o.value === deger)) return;
    bolum.value = deger;
    sifirla();
    oynat.click();
  });
  // Ezan vakit seçimi (25 Ekim 2026; katalog `ses.secenekler`): seçim yalnız çalınacak kaydı ve notu değiştirir. Çalan kayıt hemen
  // durur (yeni kayıt, kullanıcı başlatana dek sessiz kalır); tekrar, hız ve «senin sıran» ayarları aynen sürer. Grup JavaScript
  // olmadan gizlidir (sayfa o durumda beş kaydı doğrudan bağlantı olarak verir). Tarayıcı form durumunu geri yüklerse (autocomplete
  // kapalı olsa da) açılışta işaretli seçenek esas alınır.
  const vakitGrubu = kok.querySelector<HTMLElement>('[data-vakit]');
  const vakitler = [...kok.querySelectorAll<HTMLInputElement>('[data-vakit-secenek]')];
  if (vakitGrubu && vakitler.length && parcalar.length === 1) {
    const notlar = [...kok.querySelectorAll<HTMLElement>('[data-vakit-not]')];
    const kayitOpsiyonu = [...bolum.options].find((o) => o.dataset.adres);
    const vakitUygula = (secenek: HTMLInputElement) => {
      parcalar[0] = secenek.dataset.adres!;
      if (kayitOpsiyonu) kayitOpsiyonu.dataset.adres = secenek.dataset.adres!;
      for (const not of notlar) not.hidden = not.dataset.vakitNot !== secenek.value;
    };
    for (const secenek of vakitler) {
      secenek.addEventListener('change', () => {
        if (!secenek.checked) return;
        sifirla(`${secenek.dataset.ad}. ${metin('hazir')}`);
        vakitUygula(secenek);
      });
    }
    const secili = vakitler.find((r) => r.checked) ?? vakitler[0];
    secili.checked = true;
    vakitUygula(secili);
    vakitGrubu.hidden = false;
  }
  kok.querySelector<HTMLFieldSetElement>('[data-ayarlar]')!.disabled = false;
  oynat.disabled = false;
}
