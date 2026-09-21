/**
 * Dinleme sayfası çalar — /e/<kod>/ (21 Eylül 2026).
 *
 * Tek bir paylaşılan `Audio` nesnesi (`preload="none"`, DOM'a eklenmez) bütün sayfayı çalar:
 * büyük «tamamını dinle» düğmesi, satır satır âyet ve Elifbâ kareleri aynı çalarla sıraya girer,
 * böylece iki ses asla üst üste binmez.
 *
 * Kipler: hız (0,75× / 1×) ve «Répéter» localStorage'da saklanır (kapalı depolamada sessizce
 * varsayılana düşer); «Répéter» açıkken parça 3 kez çalınır ve aralar klibin kendi uzunluğu
 * kadar susulur — öğrenen dinler, sonra sesli tekrarlar. «Lecture continue» parçaları sırayla
 * oynatır. Hareket azaltma tercihinde kaydırma anîdir.
 *
 * Bu betik olmadan da sesler erişilebilir: sayfadaki <noscript> bloğu doğrudan bağlantı verir.
 * Sözleşme: docs/DINLEME-SAYFALARI.md
 */
import { EC_ANAHTAR, EC_METIN, EC_TEKRAR_SAYISI } from '../lib/ecouter';

type Tercih = { hiz: number; tekrar: boolean };

const GECERLI_HIZ = [0.75, 1];

function tercihOku(): Tercih {
  try {
    const ham = JSON.parse(localStorage.getItem(EC_ANAHTAR) || '{}') as Partial<Tercih>;
    return { hiz: GECERLI_HIZ.includes(Number(ham.hiz)) ? Number(ham.hiz) : 1, tekrar: ham.tekrar === true };
  } catch {
    return { hiz: 1, tekrar: false };
  }
}

function sureBicim(saniye: number): string {
  if (!Number.isFinite(saniye) || saniye < 0) return EC_METIN.sureBos;
  const tam = Math.floor(saniye);
  return `${Math.floor(tam / 60)}:${String(tam % 60).padStart(2, '0')}`;
}

export function dinlemeyiBaslat(): void {
  const kok = document.querySelector<HTMLElement>('[data-ecouter]');
  if (!kok) return;
  const tamDugme = kok.querySelector<HTMLButtonElement>('button[data-ec-tam]');
  const parcalar = Array.from(kok.querySelectorAll<HTMLButtonElement>('button[data-ec-cal]'));
  if (!tamDugme && parcalar.length === 0) return;

  const hizDugmeleri = Array.from(kok.querySelectorAll<HTMLButtonElement>('button[data-ec-hiz]'));
  const tekrarDugme = kok.querySelector<HTMLButtonElement>('button[data-ec-tekrar]');
  const zincirDugme = kok.querySelector<HTMLButtonElement>('button[data-ec-zincir]');
  const durumKutu = kok.querySelector<HTMLElement>('[data-ec-durum]');
  const dolgu = kok.querySelector<HTMLElement>('[data-ec-dolgu]');
  const gecenKutu = kok.querySelector<HTMLElement>('[data-ec-gecen]');
  const toplamKutu = kok.querySelector<HTMLElement>('[data-ec-toplam]');
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)');

  const tercih = tercihOku();
  let calar: HTMLAudioElement | null = null;
  let acik: HTMLButtonElement | null = null;
  let kalanTekrar = 0;
  let bekleme = 0;
  let zincir = false;

  const tercihYaz = () => {
    try { localStorage.setItem(EC_ANAHTAR, JSON.stringify(tercih)); } catch { /* depolama kapalı */ }
  };
  const durum = (metin: string) => { if (durumKutu) durumKutu.textContent = metin; };

  const calarAl = (): HTMLAudioElement => {
    if (calar) return calar;
    const yeni = new Audio();
    yeni.preload = 'none';
    yeni.addEventListener('loadedmetadata', () => {
      yeni.playbackRate = tercih.hiz;
      if (acik === tamDugme && toplamKutu) toplamKutu.textContent = sureBicim(yeni.duration);
    });
    yeni.addEventListener('timeupdate', ilerleme);
    yeni.addEventListener('ended', bitti);
    yeni.addEventListener('error', hata);
    calar = yeni;
    return yeni;
  };

  function ilerleme(): void {
    if (!calar || acik !== tamDugme) return;
    const oran = Number.isFinite(calar.duration) && calar.duration > 0 ? calar.currentTime / calar.duration : 0;
    if (dolgu) dolgu.style.width = `${Math.min(100, Math.max(0, oran * 100))}%`;
    if (gecenKutu) gecenKutu.textContent = sureBicim(calar.currentTime);
  }

  function isaretle(dugme: HTMLButtonElement, aktif: boolean): void {
    dugme.setAttribute('aria-pressed', aktif ? 'true' : 'false');
    const kap = dugme.closest<HTMLElement>('[data-ec-parca]');
    if (!kap) return;
    if (aktif) { kap.setAttribute('data-caliyor', '1'); kap.setAttribute('aria-current', 'true'); }
    else { kap.removeAttribute('data-caliyor'); kap.removeAttribute('aria-current'); }
  }

  function durdur(): void {
    if (bekleme) { clearTimeout(bekleme); bekleme = 0; }
    kalanTekrar = 0;
    calar?.pause();
    if (acik) isaretle(acik, false);
    acik = null;
    if (dolgu) dolgu.style.width = '0%';
    if (gecenKutu) gecenKutu.textContent = EC_METIN.sureSifir;
  }

  function hata(): void {
    durdur();
    durum(EC_METIN.hata);
  }

  function gorunure(dugme: HTMLButtonElement): void {
    const kap = dugme.closest<HTMLElement>('[data-ec-parca]');
    kap?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: azHareket.matches ? 'auto' : 'smooth' });
  }

  function bitti(): void {
    if (!calar || !acik) return;
    // «Répéter»: aynı parça yeniden çalınır; ara, klibin kendi uzunluğu kadardır.
    if (kalanTekrar > 0) {
      kalanTekrar -= 1;
      const uzunluk = Number.isFinite(calar.duration) && calar.duration > 0 ? (calar.duration * 1000) / tercih.hiz : 1200;
      bekleme = window.setTimeout(() => {
        bekleme = 0;
        if (!calar || !acik) return;
        calar.currentTime = 0;
        void calar.play().catch(hata);
      }, Math.max(300, uzunluk));
      return;
    }
    // «Lecture continue»: sıradaki parçaya geç (bütün sûreyi çalan düğme zincire girmez).
    if (zincir && acik !== tamDugme) {
      const sonraki = parcalar[parcalar.indexOf(acik) + 1];
      if (sonraki) { cal(sonraki); return; }
    }
    durdur();
  }

  function cal(dugme: HTMLButtonElement): void {
    const ayniydi = acik === dugme;
    durdur();
    if (ayniydi) return;                       // ikinci dokunuş yalnız durdurur
    const kaynak = dugme.dataset.ses;
    if (!kaynak) return;
    durum('');
    acik = dugme;
    isaretle(dugme, true);
    kalanTekrar = tercih.tekrar ? EC_TEKRAR_SAYISI - 1 : 0;
    const ses = calarAl();
    if (toplamKutu && dugme === tamDugme) toplamKutu.textContent = EC_METIN.sureBos;
    ses.src = kaynak;
    ses.playbackRate = tercih.hiz;
    gorunure(dugme);
    void ses.play().then(() => { ses.playbackRate = tercih.hiz; }).catch(hata);
  }

  /* Ok işlevi: `kok` daraltması (null değil) kapanışa böyle taşınır. */
  const hizAyarla = (deger: number): void => {
    tercih.hiz = GECERLI_HIZ.includes(deger) ? deger : 1;
    kok.dataset.hiz = String(tercih.hiz);
    for (const d of hizDugmeleri) d.setAttribute('aria-pressed', Number(d.dataset.ecHiz) === tercih.hiz ? 'true' : 'false');
    if (calar) calar.playbackRate = tercih.hiz;
    tercihYaz();
  };

  const tekrarAyarla = (acikMi: boolean): void => {
    tercih.tekrar = acikMi;
    tekrarDugme?.setAttribute('aria-pressed', acikMi ? 'true' : 'false');
    if (acikMi) kok.dataset.tekrar = '1'; else delete kok.dataset.tekrar;
    if (acik) kalanTekrar = acikMi ? EC_TEKRAR_SAYISI - 1 : 0;
    tercihYaz();
  };

  for (const dugme of [...parcalar, ...(tamDugme ? [tamDugme] : [])]) {
    dugme.addEventListener('click', () => cal(dugme));
  }
  for (const d of hizDugmeleri) d.addEventListener('click', () => hizAyarla(Number(d.dataset.ecHiz)));
  tekrarDugme?.addEventListener('click', () => tekrarAyarla(!tercih.tekrar));
  zincirDugme?.addEventListener('click', () => {
    zincir = !zincir;
    zincirDugme.setAttribute('aria-pressed', zincir ? 'true' : 'false');
    if (zincir) kok.dataset.zincir = '1'; else delete kok.dataset.zincir;
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') durdur(); });

  // Saklanan tercihler sayfa açılır açılmaz uygulanır (düğme durumları HTML'de varsayılandadır).
  hizAyarla(tercih.hiz);
  tekrarAyarla(tercih.tekrar);
  kok.dataset.ecHazir = '1';
}
