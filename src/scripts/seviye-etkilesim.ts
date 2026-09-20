/** Seviye tespit testi — etkileşim ve hareket katmanı (20 Eylül 2026).
 *
 *  Bu modül yalnız DENEYİM katmanıdır. Doğrulama, taslak ve gönderim çekirdekte kalır
 *  (form-cekirdek.ts); adım motoru form-adimlari.ts'tedir. Buradaki hiçbir şey o akışı
 *  engellemez: başlatma seviye-form.ts içinde try/catch ile sarılıdır, modül hiç
 *  çalışmazsa form bugünkü gibi doldurulur ve gönderilir.
 *
 *  Değişmez: istemcide doğruluk bilgisi YOKTUR ve olmayacaktır. Hiçbir hareket
 *  «doğru/yanlış» ima etmez; ödüllendirilen şey cevaplamak ve ilerlemektir —
 *  «Bilmiyorum» da tam değerinde bir cevaptır ve aynı onay hareketini alır.
 *
 *  Hareket sözleşmesi: yalnız `transform`/`opacity` (çizilen çizgide `stroke-dashoffset`)
 *  canlandırılır, düzen kaymaz; `prefers-reduced-motion: reduce` altında bütün hareket
 *  kapalıdır (durum değişimi yine görünür), süsler `aria-hidden` + `pointer-events:none`.
 *  Ekran okuyucuya yalnız tek bir `aria-live` bölgesi ve yalnız eşik anlarında konuşur.
 *  Karar ve sözleşme: docs/SEVIYE-TESTI.md
 */
import { doldur } from './form-cekirdek';

/** Sayfaya gömülü `script[data-metin-seviye]` içindeki `etkilesim` bloğu (src/i18n/seviye-testi.ts). */
export interface EtkilesimMetni {
  basla: string; devam: string;
  otoIlerle: string; otoIlerleYardim: string; klavyeIpucu: string;
  adimSayaci: string; adimIlerlemesi: string; kalanSure: string;
  yarisiTamam: string; adimTamam: string;
  merdivenBaslik: string; basamakDurum: string; basamakAtlandi: string; merdivenKapali: string;
}

/* ---------- hareket ölçüleri ---------- */

const SAKIN = 'cubic-bezier(.16, 1, .3, 1)';        // sitenin mevcut yumuşak çıkışı
const YAY = 'cubic-bezier(.34, 1.12, .64, 1)';      // hafif yaylanma; zıplama değil
const OTO_GECIKME = 450;                            // seçimden sonraki nefes payı
const SORU_SANIYE = 12;                             // kalan süre kestirimi: soru başına
const OTO_ANAHTAR = 'ulucamii:seviye:oto-ilerle';

const hareketSorgusu = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
/** Kullanıcı hareketi azaltmışsa: konfeti/kıvılcım hiç kurulmaz, kaydırma anında olur. */
const kisik = () => hareketSorgusu?.matches === true;

/** Tek seferlik, geriye dolgu yapan canlandırma; azaltılmış harekette hiç başlamaz. */
function canlandir(el: Element, kareler: Keyframe[], sure: number, gecikme = 0, egri = SAKIN) {
  if (kisik() || typeof el.animate !== 'function') return null;
  return el.animate(kareler, { duration: sure, delay: gecikme, easing: egri, fill: 'backwards' });
}

function kaydir(el: Element, blok: ScrollLogicalPosition = 'center') {
  el.scrollIntoView({ behavior: kisik() ? 'auto' : 'smooth', block: blok });
}

/* ---------- kilim baklavası (eşkenar dörtgen) ---------- */

/** Site paletinden sırayla dönen jetonlar; konfeti ve kıvılcım aynı dilden konuşur. */
const BAKLA_RENKLERI = ['var(--color-kiremit)', 'var(--color-ochre)', 'var(--color-adacayi)', 'var(--color-iznik)'];

/** `n` parçalı, kendini DOM'dan kaldıran baklava süsü; azaltılmış harekette hiç oluşturulmaz. */
function kivilcimSac(kap: HTMLElement, adet = 6) {
  if (kisik()) return;
  const sus = document.createElement('span');
  sus.className = 'st-kivilcim';
  sus.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < adet; i++) {
    const parca = document.createElement('i');
    parca.style.setProperty('--aci', `${(360 / adet) * i}deg`);
    parca.style.background = BAKLA_RENKLERI[i % BAKLA_RENKLERI.length];
    sus.append(parca);
  }
  kap.append(sus);
  window.setTimeout(() => sus.remove(), 900);
}

/* ---------- soru durumu ---------- */

type Soru = HTMLElement;

/** Açık (atlanmamış, kapalı adımda olmayan) soru kutuları. */
function acikSorular(kapsam: ParentNode): Soru[] {
  return Array.from(kapsam.querySelectorAll<Soru>('fieldset[data-soru]')).filter((kutu) => {
    const ilk = kutu.querySelector<HTMLInputElement>('input[type="radio"]');
    return !!ilk && !ilk.disabled;
  });
}

const cevapli = (kutu: Soru) => !!kutu.querySelector('input[type="radio"]:checked');

/* ---------- giriş ---------- */

export function etkilesimiBaslat(form: HTMLFormElement, metin: EtkilesimMetni) {
  if (!metin || !metin.adimSayaci) return;                 // metinler gelmediyse hiçbir şey basma

  const serit = form.querySelector<HTMLElement>('[data-adim-eylemler]');
  const ileriDugme = form.querySelector<HTMLButtonElement>('[data-adim-ileri]');
  const sayacKutu = form.querySelector<HTMLElement>('[data-serit-olcum]');
  const sayacMetni = form.querySelector<HTMLElement>('[data-serit-sayac]');
  const sureMetni = form.querySelector<HTMLElement>('[data-serit-sure]');
  const cubukKutu = form.querySelector<HTMLElement>('[data-serit-cubuk]');
  const cubukDolgu = form.querySelector<HTMLElement>('[data-serit-dolgu]');
  const duyuru = form.querySelector<HTMLElement>('[data-serit-duyuru]');

  let adim = 0, toplamAdim = 1, hepsi = false;
  let adimBolumleri: HTMLElement[] = [];
  let sonPointer = 0;
  let otoZamanlayici: number | undefined;
  const esikGorulen = new Set<string>();
  const tamamlananAdimlar = new Set<number>();
  const tamamBasamaklar = new Set<number>();
  const dinlenmisSesler = new WeakSet<HTMLElement>();

  const gercekDokunus = () => Date.now() - sonPointer < 700;
  form.addEventListener('pointerdown', () => { sonPointer = Date.now(); }, { capture: true, passive: true });

  /* ——— otomatik ilerleme tercihi (cihazda saklanır) ——— */
  let otoIlerle = true;
  try { otoIlerle = localStorage.getItem(OTO_ANAHTAR) !== '0'; } catch { /* depolama kapalı: varsayılan açık */ }
  const otoIlerleYaz = (acik: boolean) => {
    otoIlerle = acik;
    try { localStorage.setItem(OTO_ANAHTAR, acik ? '1' : '0'); } catch { /* yok say */ }
  };

  /* ——— adım şeridinin altındaki ayar satırı ——— */
  {
    const altSatir = form.querySelector<HTMLElement>('[data-adimlar] .ucf-adim-alt');
    if (altSatir) {
      const anahtar = document.createElement('button');
      const kutu = document.createElement('div');
      kutu.className = 'st-ayar';
      anahtar.type = 'button';
      anahtar.className = 'st-anahtar';
      anahtar.setAttribute('role', 'switch');
      anahtar.setAttribute('aria-checked', String(otoIlerle));
      anahtar.dataset.otoIlerle = '';
      const yuva = document.createElement('span');
      yuva.className = 'st-anahtar-yuva';
      yuva.setAttribute('aria-hidden', 'true');
      yuva.append(document.createElement('span'));
      const etiket = document.createElement('span');
      etiket.textContent = metin.otoIlerle;
      anahtar.append(yuva, etiket);
      anahtar.addEventListener('click', () => {
        otoIlerleYaz(anahtar.getAttribute('aria-checked') !== 'true');
        anahtar.setAttribute('aria-checked', String(otoIlerle));
      });
      const yardim = document.createElement('p');
      yardim.className = 'st-ayar-yardim';
      yardim.id = 'st-oto-yardim';
      yardim.textContent = metin.otoIlerleYardim;
      anahtar.setAttribute('aria-describedby', yardim.id);
      const klavye = document.createElement('p');
      klavye.className = 'st-klavye';
      klavye.textContent = metin.klavyeIpucu;
      kutu.append(anahtar, klavye, yardim);
      altSatir.append(kutu);
    }
  }

  /* ——— 1. Seçim anı: işaretleri tazele ——— */

  let tazelemeIstegi = 0;
  const tazele = () => {
    window.cancelAnimationFrame(tazelemeIstegi);
    tazelemeIstegi = window.requestAnimationFrame(() => {
      for (const kutu of form.querySelectorAll<Soru>('fieldset[data-soru]')) {
        if (cevapli(kutu)) kutu.setAttribute('data-cevaplandi', '1');
        else kutu.removeAttribute('data-cevaplandi');
      }
      merdiveniTazele();
      seridiTazele();
      adimSeridiniTazele();
    });
  };

  /* ——— 2. Otomatik ilerleme ——— */

  /** Aynı adımdaki sıradaki CEVAPSIZ soru; yoksa null. Odak ASLA taşınmaz, yalnız kaydırılır. */
  function sonrakiEksik(simdiki: Soru | null): Soru | null {
    const kapsam = adimBolumleri.length && !hepsi ? adimBolumleri : [form];
    const liste = kapsam.flatMap((b) => acikSorular(b));
    const yer = simdiki ? liste.indexOf(simdiki) : -1;
    for (let i = yer + 1; i < liste.length; i++) if (!cevapli(liste[i])) return liste[i];
    for (let i = 0; i <= yer && i < liste.length; i++) if (!cevapli(liste[i])) return liste[i];
    return null;
  }

  function otoIlerlet(kutu: Soru) {
    window.clearTimeout(otoZamanlayici);
    otoZamanlayici = window.setTimeout(() => {
      const hedef = sonrakiEksik(kutu);
      if (hedef) {
        kaydir(hedef);
        if (!kisik()) {
          hedef.setAttribute('data-vurgu', '1');
          window.setTimeout(() => hedef.removeAttribute('data-vurgu'), 620);
        }
        return;
      }
      // Adımın son sorusu: alt şeritteki «Devam» tek seferlik nabız atar.
      if (ileriDugme && !ileriDugme.hidden && !kisik()) {
        ileriDugme.setAttribute('data-nabiz', '1');
        window.setTimeout(() => ileriDugme.removeAttribute('data-nabiz'), 560);
      }
    }, OTO_GECIKME);
  }

  form.addEventListener('change', (olay) => {
    const hedef = olay.target as HTMLElement | null;
    tazele();
    if (!(hedef instanceof HTMLInputElement) || hedef.type !== 'radio') return;
    const kutu = hedef.closest<Soru>('fieldset[data-soru]');
    if (!kutu) return;
    const dokunus = olay.isTrusted && gercekDokunus();
    if (dokunus) { try { navigator.vibrate?.(8); } catch { /* titreşim yoksa yok say */ } }
    if (dokunus && otoIlerle) otoIlerlet(kutu);
  });

  /* ——— 3. Klavye kısayolları ——— */

  const yaziAlani = (el: Element | null): boolean => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
    return el instanceof HTMLInputElement && !['radio', 'checkbox', 'button', 'submit', 'range'].includes(el.type);
  };

  /** Etkin soru: odağın içinde olduğu soru; yoksa görünür alandaki ilk cevapsız soru. */
  function etkinSoru(): Soru | null {
    const odak = document.activeElement;
    const odaktaki = odak instanceof HTMLElement ? odak.closest<Soru>('fieldset[data-soru]') : null;
    if (odaktaki) return odaktaki;
    const kapsam = adimBolumleri.length && !hepsi ? adimBolumleri : [form];
    const liste = kapsam.flatMap((b) => acikSorular(b)).filter((k) => !cevapli(k));
    const gorunur = liste.find((k) => {
      const kutu = k.getBoundingClientRect();
      return kutu.bottom > 0 && kutu.top < window.innerHeight;
    });
    return gorunur ?? liste[0] ?? null;
  }

  document.addEventListener('keydown', (olay) => {
    if (form.hidden || olay.ctrlKey || olay.altKey || olay.metaKey || olay.repeat) return;
    if (!/^[0-4]$/.test(olay.key)) return;
    if (yaziAlani(olay.target as Element) || yaziAlani(document.activeElement)) return;
    const kutu = etkinSoru();
    if (!kutu) return;
    const siklar = Array.from(kutu.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
    if (!siklar.length) return;
    const bilmiyorum = siklar.find((s) => s.value === '-1') ?? null;
    const secim = olay.key === '0' ? bilmiyorum : siklar.filter((s) => s !== bilmiyorum)[Number(olay.key) - 1];
    if (!secim) return;
    olay.preventDefault();
    sonPointer = 0;                                   // klavye seçimi otomatik ilerleme başlatmaz
    secim.checked = true;
    secim.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ——— 4. Yapışkan alt şerit ——— */

  /** Adımın soru sayacı, ince çubuğu, kalan süresi ve eşik cümleleri. */
  function seridiTazele() {
    if (!serit || !sayacKutu) return;
    const kapsam = adimBolumleri.length ? adimBolumleri : [];
    const liste = kapsam.flatMap((b) => acikSorular(b));
    const cevaplanan = liste.filter(cevapli).length;
    const goster = !hepsi && liste.length > 0;
    sayacKutu.hidden = !goster;
    if (cubukKutu) cubukKutu.hidden = !goster;
    if (goster) {
      if (sayacMetni) sayacMetni.textContent = doldur(metin.adimSayaci, { n: cevaplanan, toplam: liste.length });
      if (cubukDolgu) cubukDolgu.style.setProperty('--oran', String(cevaplanan / liste.length));
    }
    // Kalan süre bütün testten hesaplanır; son adımda (özet) gizlidir.
    if (sureMetni) {
      const eksik = acikSorular(form).filter((k) => !cevapli(k)).length;
      const sonAdim = adim >= toplamAdim - 1;
      sureMetni.hidden = hepsi || sonAdim || eksik === 0;
      if (!sureMetni.hidden) sureMetni.textContent = doldur(metin.kalanSure, { dk: Math.ceil((eksik * SORU_SANIYE) / 60) });
    }
    if (!goster || !duyuru) return;
    const esik = cevaplanan >= liste.length ? 'tam' : cevaplanan * 2 >= liste.length ? 'yari' : '';
    const iz = `${adim}:${esik}`;
    if (!esik || esikGorulen.has(iz)) return;
    esikGorulen.add(iz);
    duyuru.textContent = esik === 'tam' ? metin.adimTamam : metin.yarisiTamam;
  }

  /* ——— Adım şeridi: tamamlanan adımlar ——— */

  const eksikVar = (bolum: HTMLElement) => Array.from(bolum.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]'))
    .some((a) => {
      if (a.disabled || !a.required) return false;
      if (a instanceof HTMLInputElement && a.type === 'radio') return !form.querySelector(`input[type="radio"][name="${CSS.escape(a.name)}"]:checked`);
      if (a instanceof HTMLInputElement && a.type === 'checkbox') return !a.checked;
      return !a.value.trim();
    });

  const adimSeciciler = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-adim-sec]'));
  const adimGruplari = adimSeciciler.map((d) => (d.dataset.adimBolumler ?? '').split(/\s+/).filter(Boolean)
    .map((id) => form.querySelector<HTMLElement>(`#${id}`)).filter((e): e is HTMLElement => !!e));

  function adimSeridiniTazele() {
    adimSeciciler.forEach((dugme, i) => {
      const tamam = adimGruplari[i].length > 0 && !adimGruplari[i].some(eksikVar);
      if (tamam === (dugme.dataset.tamam === '1')) return;
      if (tamam) {
        dugme.dataset.tamam = '1';
        // Kıvılcım konumlanmış kaba asılır: `.ucf-adim-listesi li` zaten `position: relative`.
        if (!tamamlananAdimlar.has(i)) { tamamlananAdimlar.add(i); kivilcimSac(dugme.parentElement ?? dugme, 6); }
      } else {
        delete dugme.dataset.tamam;
        tamamlananAdimlar.delete(i);
      }
    });
  }

  /* ——— 5. Kur'an merdiveni ——— */

  const okumaBolumu = form.querySelector<HTMLElement>('#b-okuma');
  const basamaklar = okumaBolumu ? Array.from(okumaBolumu.querySelectorAll<HTMLElement>('.st-basamak')) : [];
  let merdiven: HTMLElement | null = null;
  let merdivenNotu: HTMLElement | null = null;
  const dugumler: { dugme: HTMLButtonElement; dolgu: HTMLElement; sayi: HTMLElement; onayYolu: SVGPathElement }[] = [];

  if (okumaBolumu && basamaklar.length === 5) {
    merdiven = document.createElement('div');
    merdiven.className = 'st-merdiven';
    merdiven.dataset.merdiven = '';
    const yol = document.createElement('ol');
    yol.className = 'st-merdiven-yol';
    yol.setAttribute('aria-label', metin.merdivenBaslik);
    basamaklar.forEach((basamak, i) => {
      const hucre = document.createElement('li');
      const dugme = document.createElement('button');
      dugme.type = 'button';
      dugme.className = 'st-dugum';
      dugme.dataset.basamak = String(i + 1);
      // Düğme metinsizdir: görünen sayı ve oran süs katmanındadır (aria-hidden),
      // erişilebilir ad tek kaynaktan — «2. basamak — 4 / 6 soru cevaplandı» — gelir.
      dugme.addEventListener('click', () => kaydir(basamak, 'start'));
      const gorsel = document.createElement('span');
      gorsel.className = 'st-dugum-gorsel';
      gorsel.setAttribute('aria-hidden', 'true');
      const bakla = document.createElement('span');
      bakla.className = 'st-dugum-bakla';
      const cerceve = document.createElement('span');
      cerceve.className = 'st-dugum-kap';
      const dolgu = document.createElement('span');
      dolgu.className = 'st-dugum-dolgu';
      cerceve.append(dolgu);
      const onay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      onay.setAttribute('viewBox', '0 0 24 24');
      onay.setAttribute('class', 'st-dugum-onay');
      const onayYolu = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      onayYolu.setAttribute('d', 'M7 12.4 10.4 16 17.2 8.6');
      onay.append(onayYolu);
      bakla.append(cerceve, onay);
      const no = document.createElement('span');
      no.className = 'st-dugum-no';
      no.textContent = String(i + 1);
      const sayi = document.createElement('span');
      sayi.className = 'st-dugum-sayi';
      gorsel.append(bakla, no, sayi);
      hucre.append(dugme, gorsel);
      yol.append(hucre);
      dugumler.push({ dugme, dolgu, sayi, onayYolu });
    });
    merdivenNotu = document.createElement('p');
    merdivenNotu.className = 'st-merdiven-not';
    merdivenNotu.textContent = metin.merdivenKapali;
    merdivenNotu.hidden = true;
    merdiven.append(yol, merdivenNotu);
    const atlaKutusu = okumaBolumu.querySelector<HTMLElement>('.st-atla');
    atlaKutusu?.after(merdiven);
  }

  function merdiveniTazele() {
    if (!merdiven) return;
    const kapali = form.querySelector<HTMLInputElement>('input[name="atla.okuma"]')?.checked === true;
    merdiven.toggleAttribute('data-kapali', kapali);
    if (merdivenNotu) merdivenNotu.hidden = !kapali;
    basamaklar.forEach((basamak, i) => {
      const dugum = dugumler[i];
      if (!dugum) return;
      const atlandi = form.querySelector<HTMLInputElement>(`input[name="okumaAtla.b${i + 1}"]`)?.checked === true;
      const liste = Array.from(basamak.querySelectorAll<Soru>('fieldset[data-soru]'));
      const toplam = liste.length;
      const sayi = liste.filter(cevapli).length;
      const oran = toplam ? sayi / toplam : 0;
      const tamam = !atlandi && !kapali && toplam > 0 && sayi === toplam;
      dugum.dolgu.style.setProperty('--oran', String(kapali || atlandi ? 0 : oran));
      dugum.sayi.textContent = atlandi ? metin.basamakAtlandi : `${sayi} / ${toplam}`;
      dugum.dugme.toggleAttribute('data-atlandi', atlandi);
      dugum.dugme.toggleAttribute('data-tamam', tamam);
      dugum.dugme.disabled = kapali;                   // bölüm atlandıysa basamak görünmüyor

      const ad = doldur(metin.basamakDurum, { no: i + 1, n: sayi, toplam });
      dugum.dugme.setAttribute('aria-label', atlandi ? `${ad} — ${metin.basamakAtlandi}` : ad);
      if (tamam && !tamamBasamaklar.has(i)) {
        tamamBasamaklar.add(i);
        canlandir(dugum.onayYolu, [{ strokeDashoffset: 22 }, { strokeDashoffset: 0 }], 360, 60);
        kivilcimSac(dugum.dugme.parentElement ?? dugum.dugme, 6);
      }
      if (!tamam) tamamBasamaklar.delete(i);
    });
  }

  /* ——— 6. Arapça ve ses ——— */

  if ('IntersectionObserver' in window) {
    const arapcaGozcu = new IntersectionObserver((girdiler) => {
      for (const girdi of girdiler) {
        if (!girdi.isIntersecting) continue;
        arapcaGozcu.unobserve(girdi.target);
        if (kisik()) continue;
        girdi.target.classList.add('st-murekkep');
        window.setTimeout(() => girdi.target.classList.remove('st-murekkep'), 520);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    form.querySelectorAll('.st-goster').forEach((el) => arapcaGozcu.observe(el));

    // Hiç dinlenmemiş düğme görünür alana ilk girdiğinde tek seferlik davet halkası.
    const sesGozcu = new IntersectionObserver((girdiler) => {
      for (const girdi of girdiler) {
        if (!girdi.isIntersecting) continue;
        sesGozcu.unobserve(girdi.target);
        const dugme = girdi.target as HTMLElement;
        if (kisik() || dinlenmisSesler.has(dugme)) continue;
        dugme.setAttribute('data-davet', '1');
        window.setTimeout(() => dugme.removeAttribute('data-davet'), 1500);
      }
    }, { threshold: 0.6 });
    form.querySelectorAll<HTMLElement>('button[data-ses]').forEach((d) => sesGozcu.observe(d));
  }

  // Ekolayzır düğmenin İÇİNE konmaz: etiket «Tekrar dinle» olurken textContent siliniyor.
  form.querySelectorAll<HTMLElement>('.st-ses').forEach((satir) => {
    const dugme = satir.querySelector<HTMLElement>('button[data-ses]');
    if (!dugme) return;
    const eko = document.createElement('span');
    eko.className = 'st-ekolayzir';
    eko.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) eko.append(document.createElement('i'));
    dugme.after(eko);
    dugme.addEventListener('click', () => { dinlenmisSesler.add(dugme); dugme.removeAttribute('data-davet'); });
  });

  /* ——— 7. Adım geçişi ——— */

  form.addEventListener('form:adim', (olay) => {
    const ayrinti = (olay as CustomEvent<{ adim: number; toplam: number; hepsi: boolean; bolumler: HTMLElement[] }>).detail;
    if (!ayrinti) return;
    const onceki = adim;
    const ilkKurulum = adimBolumleri.length === 0;
    adim = ayrinti.adim; toplamAdim = ayrinti.toplam; hepsi = ayrinti.hepsi;
    adimBolumleri = ayrinti.bolumler ?? [];
    if (!hepsi && !ilkKurulum && adim !== onceki) {
      const yon = adim > onceki ? 16 : -16;
      adimBolumleri.forEach((bolum, i) => canlandir(bolum,
        [{ opacity: 0, transform: `translateX(${yon}px)` }, { opacity: 1, transform: 'none' }], 220, i * 60));
    }
    window.clearTimeout(otoZamanlayici);
    tazele();
  });

  /* ——— 8. Giriş: «Teste başla» ——— */

  {
    const girisKutu = document.querySelector<HTMLElement>('[data-form-ust] .st-noktalar');
    const ilkAlan = form.querySelector<HTMLInputElement>('#st-ad');
    if (girisKutu && ilkAlan) {
      const taslakVar = form.querySelector<HTMLElement>('[data-taslak-not]')?.hidden === false;
      const eylem = document.createElement('p');
      eylem.className = 'st-giris-eylem';
      const dugme = document.createElement('button');
      dugme.type = 'button';
      dugme.className = 'dugme dugme-birincil st-basla';
      dugme.textContent = taslakVar ? metin.devam : metin.basla;
      // Kullanıcının kendi eylemi: odak taşınabilir.
      dugme.addEventListener('click', () => {
        const hedef = form.querySelector<HTMLElement>('[data-adimlar]') ?? form;
        kaydir(hedef, 'start');
        window.setTimeout(() => ilkAlan.focus({ preventScroll: true }), kisik() ? 0 : 320);
      });
      eylem.append(dugme);
      girisKutu.after(eylem);
      if (!kisik()) {
        Array.from(girisKutu.children).forEach((madde, i) =>
          canlandir(madde, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], 320, 60 * i));
        canlandir(eylem, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], 320, 60 * girisKutu.children.length);
      }
    }
  }

  /* ——— 9. Sonuç ekranı ——— */

  form.addEventListener('form:basari', () => {
    const panel = document.querySelector<HTMLElement>('[data-basari]');
    if (!panel || panel.hidden) return;
    const baslik = panel.querySelector('h2');
    // Başlıktaki ✓: metin simgesi yerine çizilen SVG (yalnız betik varken).
    if (baslik && !panel.dataset.onay) {
      const onay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      onay.setAttribute('viewBox', '0 0 32 32');
      onay.setAttribute('class', 'st-onay-ciz');
      onay.setAttribute('aria-hidden', 'true');
      onay.setAttribute('focusable', 'false');
      const halka = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halka.setAttribute('cx', '16'); halka.setAttribute('cy', '16'); halka.setAttribute('r', '15');
      const yol = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      yol.setAttribute('d', 'M9.5 16.5 14 21l8.5-9');
      onay.append(halka, yol);
      baslik.prepend(onay);
      panel.dataset.onay = 'ciz';
      canlandir(yol, [{ strokeDashoffset: 20 }, { strokeDashoffset: 0 }], 420, 120);
    }
    const sonuc = panel.querySelector<HTMLElement>('[data-sonuc]');
    if (!sonuc || sonuc.hidden) return;

    // Çubuklar sırayla dolar: Kur'an önce, sonra alanlar; segmentler soldan sağa.
    const cubuklar = [panel.querySelector<HTMLElement>('[data-okuma-cubuk]'),
      ...Array.from(panel.querySelectorAll<HTMLElement>('[data-alan-liste] .st-cubuk'))].filter((c): c is HTMLElement => !!c);
    cubuklar.forEach((cubuk, i) => {
      cubuk.querySelectorAll<HTMLElement>('span[data-dolu]').forEach((parca, j) => {
        canlandir(parca, [{ transform: 'scaleX(0)' }, { transform: 'none' }], 260, 160 + i * 120 + j * 70, YAY);
      });
    });
    const programKarti = sonuc.querySelector<HTMLElement>('.st-sonuc-bolum:last-of-type');
    if (programKarti) canlandir(programKarti, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], 320, 160 + cubuklar.length * 120);

    konfetiSac(panel);
  });

  /** 24 parçalı kilim baklavası konfetisi; 1,8 sn sonra kendini DOM'dan kaldırır. */
  function konfetiSac(panel: HTMLElement) {
    if (kisik()) return;
    const kap = document.createElement('div');
    kap.className = 'st-konfeti';
    kap.setAttribute('aria-hidden', 'true');
    // Düşüş yolu görünür alanla sınırlanır: uzun panelde 1,8 sn'de 2000 px'lik yol
    // telaşlı görünüyordu; sakin bir hız için pay en çok bir ekran boyudur.
    const dusus = Math.min(panel.offsetHeight + 80, window.innerHeight + 120);
    for (let i = 0; i < 24; i++) {
      const parca = document.createElement('i');
      parca.style.left = `${4 + (i * 92) / 24 + (i % 3) * 1.5}%`;
      parca.style.background = BAKLA_RENKLERI[i % BAKLA_RENKLERI.length];
      parca.style.setProperty('--dus', `${dusus}px`);
      parca.style.setProperty('--kay', `${((i % 5) - 2) * 14}px`);
      parca.style.setProperty('--don', `${((i % 4) - 2) * 160}deg`);
      parca.style.animationDelay = `${(i % 8) * 45}ms`;
      kap.append(parca);
    }
    panel.prepend(kap);
    window.setTimeout(() => kap.remove(), 2200);
  }

  /* ——— Yapışkanlık: şerit ekranın altına yaslandığında taslak notu susar ——— */

  if (serit && 'IntersectionObserver' in window) {
    const nobetci = document.createElement('div');
    nobetci.className = 'st-serit-nobetci';
    nobetci.setAttribute('aria-hidden', 'true');
    serit.after(nobetci);
    new IntersectionObserver(([girdi]) => {
      serit.toggleAttribute('data-yapisik', !girdi.isIntersecting);
    }, { threshold: 0 }).observe(nobetci);
  }

  /* ——— Açılış durumu ——— */

  if (sayacKutu) sayacKutu.hidden = true;
  if (cubukKutu) cubukKutu.hidden = true;
  form.dataset.etkilesim = '1';
  tazele();
}
