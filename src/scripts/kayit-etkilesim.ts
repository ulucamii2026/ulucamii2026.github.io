/** Kayıt v3: aynı doğrulamayı kullanan tek sayfalık ilerleme ve yardımcı etkileşimler. */
import { alanDogrula, verileriTopla, telefonNormalle, yasHesapla, doldur, type Alan, type Metinler } from './form-cekirdek';
import type { KayitV3Metinler } from '../i18n/formlar/tipler';

const ONAY = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const sehirler: Record<string, string> = {
  '6900': 'Marche-en-Famenne', '6940': 'Durbuy', '6941': 'Bomal-sur-Ourthe', '6950': 'Nassogne',
  '6951': 'Bande', '6960': 'Manhay', '6970': 'Tenneville', '6980': 'La Roche-en-Ardenne',
  '6990': 'Hotton', '6997': 'Érezée', '5580': 'Rochefort', '5570': 'Beauraing', '6920': 'Wellin',
  '6800': 'Libramont-Chevigny', '6600': 'Bastogne', '6660': 'Houffalize',
};

export function kayitEtkilesiminiBaslat(form: HTMLFormElement, m: KayitV3Metinler, kimlikHatalari: () => Array<[string, string]>) {
  const ortak = JSON.parse(form.querySelector('script[data-metin]')?.textContent || '{}') as Metinler;
  const ray = form.querySelector<HTMLElement>('#k-ilerleme')!;
  const yanray = form.querySelector<HTMLElement>('.k-yanray')!;
  const govde = form.querySelector<HTMLElement>('.k-form-govde')!;
  const masaustu = matchMedia('(min-width: 1024px)');
  const ziyaret = new Set<number>();
  const cubuk = ray.querySelector<HTMLElement>('[role="progressbar"]')!;
  const bolumler = Array.from(form.querySelectorAll<HTMLElement>('.ucf-bolum'));
  const cipler = Array.from(ray.querySelectorAll<HTMLAnchorElement>('a'));
  const kisaAdlar = Object.values(m.cipler);
  const tesvik = ray.querySelector<HTMLElement>('[data-tesvik]')!;
  const eksikler = form.querySelector<HTMLElement>('[data-eksikler]')!;
  const eksikBaslik = form.querySelector<HTMLElement>('[data-eksik-baslik]')!;
  const dogum = form.querySelector<HTMLInputElement>('#k-dogum')!;
  const yasCip = form.querySelector<HTMLElement>('[data-yas-cip]')!;
  const kurallar = form.querySelector<HTMLElement>('[data-kaydir]')!;
  const okumaMetin = form.querySelector<HTMLElement>('[data-okuma-yuzde]')!;
  const okumaDuyuru = form.querySelector<HTMLElement>('[data-okuma-duyuru]')!;
  const yaz = (alan: Element, metin: string) => { if (alan.textContent !== metin) alan.textContent = metin; };
  let aktif = 0, yuzde = 0;
  const azalt = matchMedia('(prefers-reduced-motion: reduce)');
  const kaydir = (hedef: HTMLElement) => {
    hedef.scrollIntoView({ behavior: azalt.matches ? 'auto' : 'smooth', block: 'start' });
    hedef.focus({ preventScroll: true });
  };
  const etkinAlan = (ad: string) => {
    let a = form.querySelector<Alan>(`[name="${CSS.escape(ad)}"]`);
    if (a?.type === 'hidden') a = a.closest('[data-alan]')?.querySelector<Alan>('input[type="file"]') ?? a;
    if (a?.disabled && ad === 'onay.kurallar') return kurallar;
    return a;
  };
  const rayYaz = () => {
    yaz(ray.querySelector('[data-ilerleme-metin]')!, doldur(m.bolum, { n: aktif + 1, ad: kisaAdlar[aktif], yuzde }));
    cipler.forEach((a, i) => {
      if (i === aktif) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      bolumler[i].classList.toggle('k-aktif', i === aktif);
    });
    const liste = ray.querySelector('ol')!, cip = cipler[aktif];
    if (!masaustu.matches && (cip.offsetLeft < liste.scrollLeft || cip.offsetLeft + cip.offsetWidth > liste.scrollLeft + liste.clientWidth))
      liste.scrollLeft = Math.max(0, cip.offsetLeft - liste.clientWidth / 2 + cip.offsetWidth / 2);
    const ileti = yuzde === 100 ? m.tamam : aktif === 7 ? m.son : yuzde >= 50 ? m.yari : '';
    if (tesvik.textContent !== ileti) tesvik.textContent = ileti;
  };
  const alanListe = Array.from(form.querySelectorAll<Alan>('input[name], select[name], textarea[name]'))
    .filter(a => a.name !== 'web' && a.type !== 'file');
  const bolumAlanlari = bolumler.map(b => alanListe.filter(a => b.contains(a)));
  const etiket = (a: Alan) => {
    const kap = a.closest('[data-alan]');
    return (kap?.querySelector('legend')?.textContent || form.querySelector(`label[for="${a.id}"]`)?.textContent
      || kap?.querySelector('label')?.textContent || a.name).replace(/\s*\*\s*/g, '').trim();
  };
  let sonEksikler = '';
  const okumaYaz = () => {
    const okuma = kurallar.dataset.okundu === '1' ? 100 : Math.min(99, Math.round(kurallar.scrollTop / Math.max(1, kurallar.scrollHeight - kurallar.clientHeight) * 100));
    // Her kaydırma yüzdesi okunmaz; ekran okuyucu yalnız tamamlanmayı duyar.
    if (okumaMetin.dataset.yuzde !== String(okuma)) {
      okumaMetin.dataset.yuzde = String(okuma);
      okumaMetin.textContent = okuma === 100 ? m.okundu : doldur(m.okuma, { yuzde: okuma });
      if (okuma === 100) okumaMetin.insertAdjacentHTML('beforeend', ONAY);
      form.querySelector<HTMLElement>('.k-okuma-cubuk > span')!.style.transform = `scaleX(${okuma / 100})`;
    }
    yaz(okumaDuyuru, okuma === 100 ? m.okundu : '');
  };
  const guncelle = () => {
    if (form.hidden) return;
    const v = verileriTopla(form);
    const gerekli = alanListe.filter(a => a.required && (!a.disabled || a.hasAttribute('data-kaydir-kilit')));
    const benzersiz = [...new Map(gerekli.map(a => [a.name, a])).values()];
    const hatalar = new Map<string, string>();
    for (const a of alanListe) {
      if (a.disabled) { a.removeAttribute('data-gecerli'); continue; }
      const hata = alanDogrula(form, a, v, ortak);
      if (hata) hatalar.set(a.name, hata);
      const dolu = a instanceof HTMLInputElement && ['checkbox', 'radio'].includes(a.type) ? a.checked : !!a.value.trim();
      a.dataset.gecerli = !hata && dolu ? '1' : '';
    }
    const kilit = form.querySelector<HTMLInputElement>('[data-kaydir-kilit]')!;
    if (kilit.disabled) hatalar.set(kilit.name, ortak.hata.kurallarKaydir);
    for (const [ad, hata] of kimlikHatalari()) hatalar.set(ad, hata);
    const kimlikOn = form.querySelector<HTMLInputElement>('#k-kimlik-on')!;
    if (!kimlikOn.disabled) benzersiz.push(kimlikOn);
    const gecerli = benzersiz.filter(a => !hatalar.has(a.name)).length;
    yuzde = benzersiz.length ? Math.round(gecerli / benzersiz.length * 100) : 0;
    if (hatalar.size && yuzde === 100) yuzde = 99;
    cubuk.setAttribute('aria-valuenow', String(yuzde));
    cubuk.querySelector<HTMLElement>('span')!.style.transform = `scaleX(${yuzde / 100})`;
    const yas = yasHesapla(dogum.value);
    const yasHata = doldur(ortak.hata.yas, { min: dogum.dataset.yasMin!, max: dogum.dataset.yasMax! });
    yaz(yasCip, !dogum.value || yas === null || hatalar.has(dogum.name) ? yasHata : doldur(m.yas, { yas }));
    yasCip.dataset.uygun = dogum.value && !hatalar.has(dogum.name) ? '1' : '';
    for (const [i, bolum] of bolumler.entries()) {
      const kapsamdaki = bolumAlanlari[i].filter(a => !a.disabled || a.hasAttribute('data-kaydir-kilit'));
      const sorun = kapsamdaki.some(a => hatalar.has(a.name));
      const dokunuldu = kapsamdaki.some(a => a instanceof HTMLInputElement && ['checkbox', 'radio'].includes(a.type) ? a.checked : !!a.value);
      const gorunurHata = !!bolum.querySelector('[aria-invalid="true"]:not(:disabled)');
      const durum = i === 7 ? (hatalar.size ? 'devam' : 'tamam') : gorunurHata ? 'hata'
        : i === 3 && !ziyaret.has(i) && !dokunuldu ? 'bos' : !sorun ? 'tamam' : dokunuldu ? 'devam' : 'bos';
      if (bolum.dataset.durum !== durum) {
        bolum.dataset.durum = durum;
        const no = bolum.querySelector<HTMLElement>('h2 .no')!;
        no.setAttribute('aria-hidden', 'true');
        no.innerHTML = durum === 'tamam' ? ONAY : String(i + 1);
        cipler[i].querySelector('[data-cip-no]')!.innerHTML = durum === 'tamam' ? ONAY : String(i + 1);
        cipler[i].dataset.tamam = durum === 'tamam' ? '1' : '';
      }
    }
    const anahtar = JSON.stringify([...hatalar.keys()]);
    if (anahtar !== sonEksikler) {
      sonEksikler = anahtar;
      eksikler.replaceChildren();
      eksikBaslik.textContent = hatalar.size ? `${m.eksikler} (${hatalar.size})` : m.tamam;
      for (const ad of hatalar.keys()) {
        const alan = form.querySelector<Alan>(`[name="${CSS.escape(ad)}"]`);
        if (!alan) continue;
        const li = document.createElement('li'), a = document.createElement('a');
        a.textContent = etiket(alan); a.href = `#${etkinAlan(ad)?.id || alan.id}`;
        a.addEventListener('click', e => { e.preventDefault(); const hedef = etkinAlan(ad); if (hedef) kaydir(hedef); });
        li.append(a); eksikler.append(li);
      }
    }
    okumaYaz();
    rayYaz();
  };
  let kare = 0;
  let girisBekle: number | undefined;
  const planla = () => { window.clearTimeout(girisBekle); cancelAnimationFrame(kare); kare = requestAnimationFrame(guncelle); };
  form.addEventListener('input', () => { window.clearTimeout(girisBekle); girisBekle = window.setTimeout(planla, 120); });
  for (const olay of ['change', 'focusout', 'form:hata', 'form:okuma']) form.addEventListener(olay, planla);
  kurallar.addEventListener('scroll', okumaYaz, { passive: true });
  form.addEventListener('reset', () => { tesvik.textContent = ''; aktif = 0; ziyaret.clear(); planla(); });
  form.addEventListener('focusin', e => {
    const hedef = e.target as HTMLElement, i = bolumler.findIndex(b => b.contains(hedef));
    if (i < 0) return;
    aktif = i; ziyaret.add(i); rayYaz(); planla();
    requestAnimationFrame(() => {
      if (document.activeElement !== hedef) return;
      const gorunen = hedef.matches('input[type="file"]') ? hedef.closest('[data-alan]')?.querySelector<HTMLElement>('.g-sec') || hedef : hedef;
      const ust = masaustu.matches ? (document.querySelector('header')?.getBoundingClientRect().bottom || 0) : ray.getBoundingClientRect().bottom;
      if (gorunen.getBoundingClientRect().top < ust + 8 || gorunen.getBoundingClientRect().bottom > innerHeight)
        gorunen.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  });
  cipler.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault(); aktif = i; ziyaret.add(i); rayYaz(); planla();
    const hedef = bolumler[i].querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button') || bolumler[i];
    kaydir(hedef);
  }));
  let gozlemci: IntersectionObserver | undefined;
  const boyutla = () => {
    const ust = document.querySelector('header')?.getBoundingClientRect().height || 0;
    // Aynı nav taşınır: masaüstünde form önce, mobilde üst ray önce okunur.
    const hedef = masaustu.matches ? yanray : form;
    if (ray.parentElement !== hedef) {
      const odak = ray.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
      hedef.insertBefore(ray, masaustu.matches ? yanray.firstChild : govde);
      odak?.focus({ preventScroll: true });
    }
    ray.style.top = masaustu.matches ? '0px' : `${ust}px`;
    yanray.style.top = `${ust + 16}px`;
    yanray.style.maxHeight = masaustu.matches ? `calc(100dvh - ${ust + 32}px)` : '';
    const pay = ust + (masaustu.matches ? 0 : ray.getBoundingClientRect().height) + 20;
    form.style.setProperty('--kayit-odak-payi', `${pay}px`);
    gozlemci?.disconnect();
    const gorunenler = new Set<HTMLElement>();
    gozlemci = new IntersectionObserver(kayitlar => {
      for (const k of kayitlar) { if (k.isIntersecting) gorunenler.add(k.target as HTMLElement); else gorunenler.delete(k.target as HTMLElement); }
      const gorunen = [...gorunenler].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      if (gorunen.length) { aktif = bolumler.indexOf(gorunen[0]); rayYaz(); }
    }, { rootMargin: `-${Math.min(pay, innerHeight / 2)}px 0px -25% 0px`, threshold: 0 });
    bolumler.forEach(b => gozlemci!.observe(b));
    planla();
  };
  const boyutGozlemci = new ResizeObserver(boyutla);
  boyutGozlemci.observe(ray);
  const baslik = document.querySelector('header'); if (baslik) boyutGozlemci.observe(baslik);
  window.addEventListener('resize', boyutla);
  window.addEventListener('scroll', () => {
    const ust = masaustu.matches ? (document.querySelector('header')?.getBoundingClientRect().bottom || 0) : ray.getBoundingClientRect().bottom;
    if (aktif && bolumler[0].getBoundingClientRect().top > ust + 20) { aktif = 0; rayYaz(); }
  }, { passive: true });
  // Bırakılan dosya mevcut görsel yöneticisinin aynı yarış/sıfırlama korumasından geçer.
  form.querySelectorAll<HTMLElement>('[data-gorsel]').forEach(kap => {
    const kutu = kap.querySelector<HTMLElement>('.g-kutu')!;
    const girdi = kap.querySelector<HTMLInputElement>('input[type="file"]')!;
    kutu.addEventListener('dragover', e => {
      if (girdi.disabled) return;
      e.preventDefault(); kutu.classList.add('dragover');
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    kutu.addEventListener('dragleave', e => { if (!kutu.contains(e.relatedTarget as Node | null)) kutu.classList.remove('dragover'); });
    kutu.addEventListener('drop', e => {
      e.preventDefault(); kutu.classList.remove('dragover');
      if (girdi.disabled || !e.dataTransfer?.files.length) return;
      girdi.files = e.dataTransfer.files;
      girdi.dispatchEvent(new Event('change', { bubbles: true }));
    });
    form.addEventListener('reset', () => kutu.classList.remove('dragover'));
  });
  form.addEventListener('focusout', e => {
    const a = e.target as Alan;
    if (!a?.name) return;
    if (a.dataset.tur === 'telefon') {
      const t = telefonNormalle(a.value);
      if (t) a.value = /^\+32\d{9}$/.test(t) ? t.replace(/^(\+32)(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5') : t;
    }
    if (['ogrenci.ad', 'ogrenci.soyad', 'veli.adSoyad', 'acil.adSoyad'].includes(a.name))
      a.value = a.value.replace(/(^|[\s’'\-])(\p{L})/gu, (_, ayirac, harf: string) => ayirac + harf.toLocaleUpperCase('tr'));
    // Yalnız gerçekten biçimlenen metin change üretir; radyo ve diğer alanlarda ikinci tarama yok.
    if (a.dataset.tur === 'telefon' || ['ogrenci.ad', 'ogrenci.soyad', 'veli.adSoyad', 'acil.adSoyad'].includes(a.name))
      a.dispatchEvent(new Event('change', { bubbles: true }));
  });
  form.querySelector<HTMLInputElement>('#k-posta')!.addEventListener('input', e => {
    const sehir = form.querySelector<HTMLInputElement>('#k-sehir')!, posta = (e.target as HTMLInputElement).value.trim();
    if ((!sehir.value.trim() || sehir.value === 'Marche-en-Famenne') && sehirler[posta]) {
      sehir.value = sehirler[posta]; sehir.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  // Min/max tarih de aynı data-yas kaynağından ve ziyaret gününden türetilir.
  const bugun = new Date(), tarih = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dogum.min = tarih(new Date(bugun.getFullYear() - Number(dogum.dataset.yasMax) - 1, bugun.getMonth(), bugun.getDate() + 1));
  dogum.max = tarih(new Date(bugun.getFullYear() - Number(dogum.dataset.yasMin), bugun.getMonth(), bugun.getDate()));
  form.addEventListener('form:basari', () => konfeti(form));
  boyutla(); guncelle();
}

export function kayitBasarisiniHazirla(form: HTMLFormElement, m: KayitV3Metinler, yol: string, ref: string, ad: string) {
  const panel = document.querySelector<HTMLElement>('.k-basari')!;
  panel.style.scrollMarginTop = `${(document.querySelector('header')?.getBoundingClientRect().height || 0) + 20}px`;
  const baglanti = panel.querySelector<HTMLAnchorElement>('[data-kimlik-baglanti]')!;
  const aciklama = panel.querySelector<HTMLElement>('[data-kimlik-adim]')!;
  aciklama.classList.toggle('k-belge-alindi', yol === 'yukle');
  aciklama.textContent = yol === 'yukle' ? m.alindi : yol === 'elden' ? m.eldenAdim : yol === 'eposta' ? m.epostaAdim : m.whatsapp;
  if (yol === 'yukle') aciklama.insertAdjacentHTML('beforeend', ` ${ONAY}`);
  // Yükleme yolunda «sonradan yüklenmez» notu anlamsız; yalnız e-posta/WhatsApp/elden yollarında gösterilir.
  panel.querySelector<HTMLElement>('[data-kimlik-sonradan]')!.hidden = yol === 'yukle';
  baglanti.hidden = !['eposta', 'whatsapp'].includes(yol);
  if (yol === 'eposta') {
    baglanti.href = `mailto:info@ulucamii.be?subject=${encodeURIComponent(doldur(m.konu, { ref }))}`; baglanti.textContent = m.epostaDugme;
  } else if (yol === 'whatsapp') {
    baglanti.href = `https://wa.me/${(form.dataset.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(doldur(m.whatsappMetin, { ref, ad }))}`;
    baglanti.textContent = m.whatsappDugme; baglanti.target = '_blank'; baglanti.rel = 'noopener';
  }
  const kopyala = panel.querySelector<HTMLButtonElement>('[data-ref-kopyala]')!;
  panel.querySelector<HTMLElement>('[data-kopya-durum]')!.textContent = '';
  kopyala.classList.remove('k-kopyalandi');
  kopyala.onclick = async () => {
    const durum = panel.querySelector<HTMLElement>('[data-kopya-durum]')!;
    try { await navigator.clipboard.writeText(ref); durum.textContent = m.kopyalandi; kopyala.classList.add('k-kopyalandi'); }
    catch {
      const aralik = document.createRange(); aralik.selectNodeContents(panel.querySelector('[data-ref]')!);
      window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(aralik); durum.textContent = m.kopyaHata;
    }
  };
}

/** İki saniye, yerel tuval, ses yok; azaltılmış hareket tercihinde hiç kurulmaz. */
function konfeti(form: HTMLFormElement) {
  const azalt = matchMedia('(prefers-reduced-motion: reduce)');
  if (azalt.matches || document.querySelector('.k-konfeti')) return;
  const tuval = document.createElement('canvas'), c = tuval.getContext('2d');
  if (!c) return;
  tuval.className = 'k-konfeti'; tuval.setAttribute('aria-hidden', 'true');
  tuval.width = innerWidth; tuval.height = innerHeight; document.body.append(tuval);
  const stil = getComputedStyle(form);
  const renkler = ['--color-kiremit', '--color-ochre', '--color-adacayi', '--color-iznik'].map(k => stil.getPropertyValue(k).trim()).filter(Boolean);
  const parcalar = Array.from({ length: 42 }, (_, i) => ({ x: Math.random() * innerWidth, y: -Math.random() * 160, hiz: 80 + Math.random() * 110, donus: Math.random() * 6, renk: renkler[i % renkler.length] }));
  const bas = performance.now();
  const ciz = (simdi: number) => {
    const t = (simdi - bas) / 1000;
    if (t >= 2 || document.hidden || azalt.matches) { tuval.remove(); return; }
    c.clearRect(0, 0, tuval.width, tuval.height); c.globalAlpha = Math.min(1, (2 - t) * 2);
    for (const p of parcalar) {
      c.save(); c.translate(p.x + Math.sin(t * 2 + p.donus) * 30, p.y + t * p.hiz); c.rotate(p.donus + t);
      c.fillStyle = p.renk; c.fillRect(-3, -5, 6, 10); c.restore();
    }
    requestAnimationFrame(ciz);
  };
  requestAnimationFrame(ciz);
}
