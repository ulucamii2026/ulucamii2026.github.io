/** İhtida formunun belge bölümü (8 Eylül 2026): vesikalık fotoğraf, kimlik belgesinin ön/arka
 *  yüzü ve ekranda çizilen imza.
 *
 *  Neden burada: EK-9 İhtida Belgesi bir vesikalık fotoğraf ile başvuranın imzasını taşır; belge ve
 *  ekleri hem camimizde hem T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği'nde saklanır.
 *  Bu bölüm YALNIZ ihtida formundadır — çocuk kayıt formu kimlik/görsel/imza toplamaz.
 *
 *  Tasarım kararları:
 *   - Görseller tarayıcıda küçültülür (en uzun kenar 1600 px, JPEG); ağa ham fotoğraf gitmez.
 *   - Görseller ve imza TASLAĞA (localStorage) YAZILMAZ. Sekme kapanırsa yeniden seçilir;
 *     kimlik görüntüsünü cihazda bırakmamak bilinçli bir tercihtir.
 *   - Her kutunun gizli bir <input name="gorsel.*"> çapası vardır: değeri hep boştur, yalnızca
 *     çekirdeğin hata yazma/kaydırma düzeneği bir ada bağlanabilsin diye durur.
 *   - İmza atamayan için «imzaYok» kaçış kapısı: alan boş bırakılır, tören günü ıslak imza atılır.
 */

export interface BelgeMetinleri {
  isleniyor: string;
  hazir: string;                    // {boyut}
  hataTur: string;
  hataBoyut: string;                // {mb}
  hataOkunamadi: string;
  hataImza: string;
  hataEksik: string;                // {ad}
  vesikalik: string;
  kimlikOn: string;
  kimlikArka: string;
  imza: string;
  onizleme: string;
}

export interface GorselPaketi {
  vesikalik: string;
  kimlikOn: string;
  kimlikArka: string;
  imza: string;
}

export interface GorselYonetici {
  /** Gönderim gövdesine konacak veri URL'leri (boşlar boş dizedir). */
  paket(): GorselPaketi;
  /** [alan adı, hata metni] — çekirdeğin ekDogrula sözleşmesi. */
  dogrula(): Array<[string, string]>;
  /** Özet listesi için tek satır. */
  ozet(): string;
  /** Taslak silinince her şeyi boşaltır. */
  sifirla(): void;
}

const AZAMI_GIRIS_MB = 12;              // ham dosya sınırı
const UZUN_KENAR = 1600;                // küçültme hedefi
const HEDEF_BAYT = 900 * 1024;          // bunun altına inene kadar kalite düşürülür
const IMZA_AZAMI_EN = 900;
const IMZA_RENK = '#1d3f6e';            // mavi kalem — resmî belgelerdeki gibi

function baytBicim(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function veriBoyutu(veriUrl: string): number {
  const i = veriUrl.indexOf(',');
  return i < 0 ? 0 : Math.round((veriUrl.length - i - 1) * 0.75);
}

function doldur(metin: string, degerler: Record<string, string | number>): string {
  return metin.replace(/\{(\w+)\}/g, (_, k) => (k in degerler ? String(degerler[k]) : `{${k}}`));
}

/** Dosyayı çizilebilir bir kaynağa çevirir; EXIF dönüşü uygulanır. */
async function kaynakAc(dosya: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(dosya, { imageOrientation: 'from-image' });
    } catch { /* eski tarayıcı ya da desteklenmeyen biçim → <img> yoluna düş */ }
  }
  const url = URL.createObjectURL(dosya);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((coz, at) => {
      img.onload = () => coz();
      img.onerror = () => at(new Error('okunamadi'));
      img.src = url;
    });
    return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
  } finally {
    // Çizim bitmeden serbest bırakılırsa Chrome boş kare veriyor; bırakmayı ertele.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** En uzun kenarı UZUN_KENAR'a indirir, JPEG'e çevirir, hedef boyuta inene dek kaliteyi düşürür. */
async function gorseliKucult(dosya: File): Promise<string> {
  const kaynak = await kaynakAc(dosya);
  const gEn = kaynak.width, gBoy = kaynak.height;
  if (!gEn || !gBoy) throw new Error('okunamadi');
  let olcek = Math.min(1, UZUN_KENAR / Math.max(gEn, gBoy));
  let veri = '';
  for (const kalite of [0.82, 0.72, 0.62, 0.52]) {
    const en = Math.max(1, Math.round(gEn * olcek));
    const boy = Math.max(1, Math.round(gBoy * olcek));
    const tuval = document.createElement('canvas');
    tuval.width = en; tuval.height = boy;
    const c = tuval.getContext('2d');
    if (!c) throw new Error('okunamadi');
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, en, boy);                    // saydam PNG'ler beyaz zemine otursun
    c.drawImage(kaynak, 0, 0, en, boy);
    veri = tuval.toDataURL('image/jpeg', kalite);
    if (veriBoyutu(veri) <= HEDEF_BAYT) break;
    if (kalite <= 0.62) olcek *= 0.8;             // kalite düşürmek yetmiyorsa boyutu küçült
  }
  const kapat = (kaynak as ImageBitmap).close;
  if (typeof kapat === 'function') kapat.call(kaynak);
  return veri;
}

/* ------------------------------------------------------------------ yükleme kutuları */

interface Kutu {
  anahtar: keyof GorselPaketi;
  veri: string;
  hataYaz(metin: string | null): void;
  temizle(): void;
}

function kutuKur(kap: HTMLElement, m: BelgeMetinleri, degisti: () => void): Kutu {
  const anahtar = (kap.dataset.gorsel || '') as keyof GorselPaketi;
  const dosyaGirdi = kap.querySelector<HTMLInputElement>('input[type=file]');
  const onizleme = kap.querySelector<HTMLImageElement>('[data-onizleme]');
  const bos = kap.querySelector<HTMLElement>('[data-bos]');
  const durum = kap.querySelector<HTMLElement>('[data-durum]');
  const kaldir = kap.querySelector<HTMLButtonElement>('[data-kaldir]');
  const secEtiket = kap.querySelector<HTMLElement>('[data-sec]');
  const hata = kap.querySelector<HTMLElement>('.hata');

  const hataYaz = (metin: string | null) => {
    if (hata) { hata.textContent = metin ?? ''; hata.hidden = !metin; }
    kap.classList.toggle('alan-hatali', !!metin);
    if (metin) dosyaGirdi?.setAttribute('aria-invalid', 'true');
    else dosyaGirdi?.removeAttribute('aria-invalid');
  };

  const kutu: Kutu = { anahtar, veri: '', hataYaz, temizle: () => {} };

  const ciz = () => {
    const varMi = !!kutu.veri;
    if (onizleme) {
      onizleme.hidden = !varMi;
      if (varMi) { onizleme.src = kutu.veri; onizleme.alt = m.onizleme; } else onizleme.removeAttribute('src');
    }
    if (bos) bos.hidden = varMi;
    if (kaldir) kaldir.hidden = !varMi;
    if (secEtiket) secEtiket.textContent = varMi ? (secEtiket.dataset.degistir || '') : (secEtiket.dataset.sec || '');
    kap.dataset.dolu = varMi ? '1' : '';
  };

  dosyaGirdi?.addEventListener('change', async () => {
    const dosya = dosyaGirdi.files?.[0];
    if (!dosya) return;
    hataYaz(null);
    if (dosya.type && !/^image\//i.test(dosya.type)) { hataYaz(m.hataTur); dosyaGirdi.value = ''; return; }
    if (dosya.size > AZAMI_GIRIS_MB * 1024 * 1024) {
      hataYaz(doldur(m.hataBoyut, { mb: (dosya.size / 1024 / 1024).toFixed(1) }));
      dosyaGirdi.value = '';
      return;
    }
    if (durum) durum.textContent = m.isleniyor;
    kap.dataset.mesgul = '1';
    try {
      kutu.veri = await gorseliKucult(dosya);
      if (durum) durum.textContent = doldur(m.hazir, { boyut: baytBicim(veriBoyutu(kutu.veri)) });
    } catch {
      kutu.veri = '';
      if (durum) durum.textContent = '';
      hataYaz(m.hataOkunamadi);
    } finally {
      kap.dataset.mesgul = '';
      dosyaGirdi.value = '';                      // aynı dosya yeniden seçilebilsin
      ciz();
      degisti();
    }
  });

  kutu.temizle = () => {
    kutu.veri = '';
    if (durum) durum.textContent = '';
    hataYaz(null);
    ciz();
  };

  kaldir?.addEventListener('click', () => {
    kutu.temizle();
    degisti();
    dosyaGirdi?.focus();
  });

  ciz();
  return kutu;
}

/* ------------------------------------------------------------------ imza kanvası */

interface Nokta { x: number; y: number }

function imzaKur(kap: HTMLElement, cizildi: () => void) {
  const tuval = kap.querySelector<HTMLCanvasElement>('canvas');
  const c = tuval?.getContext('2d');
  if (!tuval || !c) return null;

  const cizgiler: Nokta[][] = [];
  let aktif: Nokta[] | null = null;
  let oran = 1;

  const yenidenCiz = () => {
    c.setTransform(oran, 0, 0, oran, 0, 0);
    c.clearRect(0, 0, tuval.width / oran, tuval.height / oran);
    c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = IMZA_RENK; c.fillStyle = IMZA_RENK;
    cizgileriCiz(c);
  };

  const cizgileriCiz = (hedef: CanvasRenderingContext2D) => {
    for (const cizgi of cizgiler) {
      if (cizgi.length === 1) {
        hedef.beginPath();
        hedef.arc(cizgi[0].x, cizgi[0].y, 1.4, 0, Math.PI * 2);
        hedef.fill();
        continue;
      }
      hedef.beginPath();
      hedef.moveTo(cizgi[0].x, cizgi[0].y);
      for (let i = 1; i < cizgi.length; i++) hedef.lineTo(cizgi[i].x, cizgi[i].y);
      hedef.stroke();
    }
  };

  const boyutla = () => {
    const en = Math.max(240, Math.round(tuval.clientWidth));
    const boy = Math.max(120, Math.round(tuval.clientHeight));
    oran = Math.min(3, window.devicePixelRatio || 1);
    if (tuval.width === Math.round(en * oran) && tuval.height === Math.round(boy * oran)) return;
    tuval.width = Math.round(en * oran);
    tuval.height = Math.round(boy * oran);
    yenidenCiz();
  };

  const nokta = (e: PointerEvent): Nokta => {
    const k = tuval.getBoundingClientRect();
    return { x: e.clientX - k.left, y: e.clientY - k.top };
  };

  tuval.addEventListener('pointerdown', (e) => {
    if (tuval.hasAttribute('data-kapali')) return;
    e.preventDefault();
    try { tuval.setPointerCapture(e.pointerId); } catch { /* yok say */ }
    aktif = [nokta(e)];
    cizgiler.push(aktif);
    yenidenCiz();
  });
  tuval.addEventListener('pointermove', (e) => {
    if (!aktif) return;
    e.preventDefault();
    aktif.push(nokta(e));
    yenidenCiz();
  });
  const bitir = () => { if (aktif) { aktif = null; cizildi(); } };
  tuval.addEventListener('pointerup', bitir);
  tuval.addEventListener('pointercancel', bitir);
  tuval.addEventListener('pointerleave', bitir);

  if (typeof ResizeObserver === 'function') new ResizeObserver(boyutla).observe(tuval);
  else window.addEventListener('resize', boyutla);
  requestAnimationFrame(boyutla);

  /** Tek dokunuşluk kazalar imza sayılmasın: en az bir gerçek çizgi aranır. */
  const bosMu = () => !cizgiler.some((cizgi) => cizgi.length > 3);

  /** Saydam PNG; boş kenarlar kırpılır, kenarlara 6 px pay bırakılır. */
  const png = (): string => {
    if (bosMu()) return '';
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const cizgi of cizgiler) {
      for (const p of cizgi) {
        if (p.x < x0) x0 = p.x;
        if (p.y < y0) y0 = p.y;
        if (p.x > x1) x1 = p.x;
        if (p.y > y1) y1 = p.y;
      }
    }
    const pay = 6;
    x0 = Math.max(0, x0 - pay); y0 = Math.max(0, y0 - pay);
    x1 = Math.min(tuval.width / oran, x1 + pay); y1 = Math.min(tuval.height / oran, y1 + pay);
    const en = Math.max(8, x1 - x0), boy = Math.max(8, y1 - y0);
    const k = Math.min(2, IMZA_AZAMI_EN / en);
    const dis = document.createElement('canvas');
    dis.width = Math.round(en * k);
    dis.height = Math.round(boy * k);
    const dc = dis.getContext('2d');
    if (!dc) return '';
    dc.setTransform(k, 0, 0, k, 0, 0);
    dc.translate(-x0, -y0);
    dc.lineWidth = 2.4; dc.lineCap = 'round'; dc.lineJoin = 'round';
    dc.strokeStyle = IMZA_RENK; dc.fillStyle = IMZA_RENK;
    cizgileriCiz(dc);
    return dis.toDataURL('image/png');
  };

  return {
    bosMu,
    png,
    temizle: () => { cizgiler.length = 0; aktif = null; yenidenCiz(); cizildi(); },
    kilit: (kapali: boolean) => {
      if (kapali) tuval.setAttribute('data-kapali', '1'); else tuval.removeAttribute('data-kapali');
      tuval.setAttribute('aria-disabled', kapali ? 'true' : 'false');
    },
  };
}

/* ------------------------------------------------------------------ ana giriş */

export function gorselleriBaslat(form: HTMLFormElement, m: BelgeMetinleri): GorselYonetici | null {
  const bolum = form.querySelector<HTMLElement>('[data-belgeler]');
  if (!bolum) return null;

  const degisti = () => form.dispatchEvent(new Event('change', { bubbles: true }));
  const kutular = Array.from(bolum.querySelectorAll<HTMLElement>('[data-gorsel]')).map((k) => kutuKur(k, m, degisti));
  const bul = (a: keyof GorselPaketi) => kutular.find((k) => k.anahtar === a);

  const imzaKap = bolum.querySelector<HTMLElement>('[data-imza]');
  const imza = imzaKap ? imzaKur(imzaKap, degisti) : null;
  const imzaHata = imzaKap?.querySelector<HTMLElement>('.hata') ?? null;
  const imzaYok = form.querySelector<HTMLInputElement>('input[name="imzaYok"]');

  imzaKap?.querySelector<HTMLButtonElement>('[data-imza-temizle]')?.addEventListener('click', () => imza?.temizle());

  const imzaDurumu = () => {
    const kapali = !!imzaYok?.checked;
    imza?.kilit(kapali);
    imzaKap?.classList.toggle('imza-kapali', kapali);
    if (kapali && imzaHata) { imzaHata.textContent = ''; imzaHata.hidden = true; }
  };
  imzaYok?.addEventListener('change', imzaDurumu);
  imzaDurumu();

  const belgeTuru = () => form.querySelector<HTMLInputElement>('input[name="belgeTuru"]:checked')?.value || 'kimlik';

  const paket = (): GorselPaketi => ({
    vesikalik: bul('vesikalik')?.veri || '',
    kimlikOn: bul('kimlikOn')?.veri || '',
    kimlikArka: belgeTuru() === 'kimlik' ? (bul('kimlikArka')?.veri || '') : '',
    imza: imzaYok?.checked ? '' : (imza?.png() || ''),
  });

  const dogrula = (): Array<[string, string]> => {
    const hatalar: Array<[string, string]> = [];
    const gerekli: Array<[keyof GorselPaketi, string, string]> = [
      ['vesikalik', 'gorsel.vesikalik', m.vesikalik],
      ['kimlikOn', 'gorsel.kimlikOn', m.kimlikOn],
    ];
    if (belgeTuru() === 'kimlik') gerekli.push(['kimlikArka', 'gorsel.kimlikArka', m.kimlikArka]);
    for (const [anahtar, ad, baslik] of gerekli) {
      const k = bul(anahtar);
      if (!k) continue;
      const eksik = !k.veri;
      k.hataYaz(eksik ? doldur(m.hataEksik, { ad: baslik }) : null);
      if (eksik) hatalar.push([ad, doldur(m.hataEksik, { ad: baslik })]);
    }
    if (!imzaYok?.checked && imza?.bosMu()) {
      if (imzaHata) { imzaHata.textContent = m.hataImza; imzaHata.hidden = false; }
      hatalar.push(['imzaYok', m.hataImza]);
    } else if (imzaHata) { imzaHata.textContent = ''; imzaHata.hidden = true; }
    return hatalar;
  };

  const ozet = (): string => {
    const p = paket();
    const parcalar: string[] = [];
    if (p.vesikalik) parcalar.push(m.vesikalik);
    if (p.kimlikOn) parcalar.push(m.kimlikOn);
    if (p.kimlikArka) parcalar.push(m.kimlikArka);
    if (p.imza) parcalar.push(m.imza);
    return parcalar.join(' · ');
  };

  const sifirla = () => {
    for (const k of kutular) k.temizle();
    imza?.temizle();
    imzaDurumu();
  };

  return { paket, dogrula, ozet, sifirla };
}
