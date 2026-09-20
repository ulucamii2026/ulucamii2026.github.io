/** Kayıt ve ihtida formlarının ortak çekirdeği (30 Ağustos 2026 yeniden yazımı).
 *
 *  İlkeler: kimlik numarası sorulmaz; görsel verisi yalnız form yöneticisinin belleğinde tutulur.
 *  Doğrulama tarayıcıda (hızlı geri bildirim) + sunucuda (bağlayıcı). Taslak bu cihazda
 *  localStorage'da tutulur; onay kutuları taslaktan geri yüklenmez (her seferinde bilinçli
 *  işaretlenir). Aynı gönderim iki kez kaydedilmez: taslakla birlikte bir gönderim anahtarı
 *  (UUID) saklanır ve sunucu bu anahtarı tanır.
 *
 *  DOM sözleşmesi (Astro bileşenleri bunu üretir):
 *   <form data-form="kayit|ihtida" data-dil data-uc data-sir data-taslak novalidate>
 *     [data-alan]  → kapsayıcı; içinde name'li alan, .yardim ve .hata (aria-live)
 *     data-tur="eposta|telefon|tarih|metin"  data-esle="<başka alan adı>"  data-yas-min/max
 *     [data-kosul="<alan>=<değer>"] → koşullu blok (gizliyken içindeki alanlar disabled)
 *     [data-kaydir] + [data-kaydir-kilit] → sonuna kadar kaydırılmadan işaretlenemeyen kutu
 *     [data-ozet] içindeki [data-ozet-alan="anahtar"] [data-ozet-deger]
 *     [data-mesaj] genel uyarı; [data-basari] başarı paneli ([data-ref], [data-eposta-metin])
 *     script[type=application/json][data-metin] → hata/ileti sözlüğü
 */

export type Veriler = Record<string, unknown>;

export interface FormSecenekleri {
  /** Toplanan alanlardan sunucu gövdesini kurar (tur/sir/dil/anahtar çekirdek ekler). */
  govde(veriler: Veriler): Record<string, unknown>;
  /** Özet listesini doldurur; anahtar → görüntülenecek metin. */
  ozet(veriler: Veriler, form: HTMLFormElement): Record<string, string>;
  /** Formun kendi ek doğrulaması: [alan adı, hata metni] listesi. */
  ekDogrula?(veriler: Veriler, form: HTMLFormElement, metin: Metinler, bolumler?: HTMLElement[]): Array<[string, string]>;
  /** Başarı sonrası ek iş (ör. kardeş kaydı için veli bilgisini saklamak). */
  basarida?(veriler: Veriler, ref: string, yanit?: Record<string, unknown>): void;
  /** Sayfa yüklenince (taslak geri yüklendikten sonra) çağrılır. */
  hazir?(form: HTMLFormElement, veriler: Veriler): void;
}

export interface Metinler {
  hata: Record<string, string>;
  basari: Record<string, string>;
  taslakGeriYuklendi: string;
  taslakSilindi: string;
  evet: string;
  hayir: string;
  bosDeger: string;
  taslakHassasNot?: string;
  taslakGuvence?: string;
  taslakKaydedilemedi?: string;
}

const ZAMAN_ASIMI_MS = 60_000;
// Kullanıcı "hareketi azalt" tercih ettiyse otomatik kaydırma animasyonlarını kapat.
const AZALTILMIS_HAREKET = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function doldur(metin: string, degerler: Record<string, string | number>): string {
  return metin.replace(/\{(\w+)\}/g, (_, k) => (k in degerler ? String(degerler[k]) : `{${k}}`));
}

/* ---------- yardımcılar ---------- */

export function telefonNormalle(ham: string): string | null {
  let s = ham.trim().replace(/[\s().\- ]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^0\d{8,9}$/.test(s)) s = '+32' + s.slice(1);          // Belçika yerel biçim
  if (!/^\+\d{8,15}$/.test(s)) return null;
  return s;
}

export function epostaGecerli(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(s.trim());
}

export function adNormalle(s: string): string {
  return s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i').replace(/[^a-z0-9]/g, '');
}

export function yasHesapla(tarih: string, bugun = new Date()): number | null {
  const d = new Date(tarih + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return null;
  let yas = bugun.getFullYear() - d.getFullYear();
  const m = bugun.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && bugun.getDate() < d.getDate())) yas--;
  return yas;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export type Alan = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function alanlar(form: HTMLFormElement): Alan[] {
  return Array.from(form.querySelectorAll<Alan>('input[name], select[name], textarea[name]'))
    .filter((a) => a.type !== 'submit' && a.type !== 'button');
}

/** name="a.b.c" → iç içe nesne; checkbox → boolean; radio → seçili değer; metinler kırpılır. */
export function verileriTopla(form: HTMLFormElement): Veriler {
  const sonuc: Veriler = {};
  const yaz = (yol: string, deger: unknown) => {
    const parcalar = yol.split('.');
    let hedef: Record<string, unknown> = sonuc;
    for (let i = 0; i < parcalar.length - 1; i++) {
      const p = parcalar[i];
      if (typeof hedef[p] !== 'object' || hedef[p] === null) hedef[p] = {};
      hedef = hedef[p] as Record<string, unknown>;
    }
    hedef[parcalar[parcalar.length - 1]] = deger;
  };
  const gorulen = new Set<string>();
  for (const a of alanlar(form)) {
    if (a.disabled) continue;
    if (a instanceof HTMLInputElement && a.type === 'radio') {
      if (gorulen.has(a.name)) continue;
      gorulen.add(a.name);
      const secili = form.querySelector<HTMLInputElement>(`input[type=radio][name="${CSS.escape(a.name)}"]:checked`);
      yaz(a.name, secili ? secili.value : '');
    } else if (a instanceof HTMLInputElement && a.type === 'checkbox') {
      yaz(a.name, a.checked);
    } else {
      yaz(a.name, a.value.trim());
    }
  }
  return sonuc;
}

export function deger(veriler: Veriler, yol: string): unknown {
  return yol.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Veriler)[k] : undefined), veriler);
}

/* ---------- hata gösterimi ---------- */

function alanKabi(alan: Element): HTMLElement | null {
  return alan.closest<HTMLElement>('[data-alan]');
}

function hataYaz(form: HTMLFormElement, ad: string, metin: string | null) {
  const alan = form.querySelector<Alan>(`[name="${CSS.escape(ad)}"]`);
  if (!alan) return;
  const kap = alanKabi(alan);
  const hata = kap?.querySelector<HTMLElement>('.hata');
  const hedefler = alan.type === 'radio' || alan.type === 'checkbox'
    ? Array.from(form.querySelectorAll<Alan>(`[name="${CSS.escape(ad)}"]`)) : [alan];
  for (const h of hedefler) {
    if (metin) h.setAttribute('aria-invalid', 'true'); else h.removeAttribute('aria-invalid');
  }
  if (hata) { if (hata.textContent !== (metin ?? '')) hata.textContent = metin ?? ''; hata.hidden = !metin; }
  kap?.classList.toggle('alan-hatali', !!metin);
}

function tumHatalariTemizle(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('.hata').forEach((h) => { h.textContent = ''; h.hidden = true; });
  form.querySelectorAll('[aria-invalid]').forEach((a) => a.removeAttribute('aria-invalid'));
  form.querySelectorAll('.alan-hatali').forEach((k) => k.classList.remove('alan-hatali'));
}

/** Tek alanı doğrular; hata metni döner (yoksa null). */
export function alanDogrula(form: HTMLFormElement, alan: Alan, veriler: Veriler, m: Metinler): string | null {
  if (alan.disabled) return null;
  const ad = alan.name;
  const tur = alan.dataset.tur;
  let v: string;
  if (alan instanceof HTMLInputElement && alan.type === 'radio') {
    const secili = form.querySelector<HTMLInputElement>(`input[type=radio][name="${CSS.escape(ad)}"]:checked`);
    if (alan.required && !secili) return m.hata.zorunlu;
    return null;
  }
  if (alan instanceof HTMLInputElement && alan.type === 'checkbox') {
    if (alan.required && !alan.checked) return alan.dataset.hataMetni || m.hata.zorunlu;
    return null;
  }
  v = alan.value.trim();
  if (alan.required && !v) return m.hata.zorunlu;
  if (!v) return null;
  const maks = Number(alan.getAttribute('maxlength'));
  if (maks > 0 && v.length > maks) return doldur(m.hata.uzun, { max: maks });
  if (tur === 'eposta' && !epostaGecerli(v)) return m.hata.eposta;
  if (tur === 'telefon' && !telefonNormalle(v)) return m.hata.telefon;
  if (tur === 'tarih') {
    const yas = yasHesapla(v);
    if (yas === null) return m.hata.tarih;
    const min = Number(alan.dataset.yasMin ?? 0), max = Number(alan.dataset.yasMax ?? 130);
    if (yas < min || yas > max) return doldur(m.hata.yas, { min, max });
  }
  if (alan.dataset.esle) {
    const hedef = String(deger(veriler, alan.dataset.esle) ?? '');
    if (adNormalle(hedef) !== adNormalle(v)) return m.hata.imzaEslesmiyor;
  }
  return null;
}

/* ---------- koşullu bloklar ---------- */

function kosullariUygula(form: HTMLFormElement) {
  // İç içe koşullu bloklarda (seviye testi: bölüm atlama → basamak atlama) dış blok açılırken iç
  // bloğun kutusu hâlâ devre dışı olduğu için tek turda görünür olamıyordu: devre dışı alan
  // verileriTopla'ya girmez, iç koşul de "boş" okurdu. Durum değiştiği sürece veriler yeniden
  // toplanıp uygulanır; tek katmanlı formlarda ikinci tur hiçbir şeyi değiştirmez.
  for (let tur = 0; tur < 3; tur++) {
    const veriler = verileriTopla(form);
    let degisti = false;
    form.querySelectorAll<HTMLElement>('[data-kosul]').forEach((blok) => {
      const [ad, beklenen] = (blok.dataset.kosul || '').split('=');
      const mevcut = deger(veriler, ad);
      const acik = typeof mevcut === 'boolean' ? String(mevcut) === beklenen : String(mevcut ?? '') === beklenen;
      if (blok.hidden === acik) degisti = true;
      blok.hidden = !acik;
      blok.querySelectorAll<Alan>('input, select, textarea').forEach((a) => {
        if (a.disabled === acik) degisti = true;
        a.disabled = !acik;
      });
    });
    if (!degisti) return;
  }
}

/* ---------- kaydırma kilidi ---------- */

function kaydirmaKilidiKur(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-kaydir]').forEach((kutu) => {
    if (kutu.dataset.kilitKurulu) { kutu.dispatchEvent(new Event('scroll')); return; }
    kutu.dataset.kilitKurulu = '1';
    const kilit = form.querySelector<HTMLInputElement>(`[data-kaydir-kilit="${kutu.id}"]`);
    if (!kilit) return;
    const not = form.querySelector<HTMLElement>(`[data-kaydir-not="${kutu.id}"]`);
    const kontrol = (yenidenOlc = false) => {
      if (!kutu.clientHeight) return;
      const sonda = kutu.scrollHeight - kutu.scrollTop - kutu.clientHeight < 24 || kutu.scrollHeight <= kutu.clientHeight + 4;
      // 13 Eyl 2026: Okuma kararı iki formda da KALICI. Kayıtta boyut değişiminde yeniden
      // ölçmek (yenidenOlc) canlıda onayı siliyordu: telefon döndürme, klavye, geç yüklenen
      // yazı tipi ya da tam sayfa ekran görüntüsü kutuyu yeniden akıtınca scrollTop sondan
      // ayrılıyor, kutu kilitlenip işaretli onay boşalıyordu (13 Eyl canlı sınama, UC-2026-0018
      // öncesi iki zaman aşımı). Kutu görünmezken (clientHeight 0) zaten karar verilmez.
      void yenidenOlc;
      const okundu = sonda || kutu.dataset.okundu === '1';
      const degisti = kilit.disabled === okundu;
      kilit.disabled = !okundu; kutu.dataset.okundu = okundu ? '1' : '';
      if (!okundu) kilit.checked = false;
      if (not) not.hidden = okundu;
      if (degisti) {
        if (okundu) { kilit.removeAttribute('aria-invalid'); kilit.closest('[data-alan]')?.classList.add('okuma-tamam'); }
        form.dispatchEvent(new CustomEvent('form:okuma'));
      }
    };
    kilit.disabled = kutu.dataset.okundu !== '1';
    kutu.addEventListener('scroll', () => kontrol(), { passive: true });
    // Kutu görünür olunca (ör. sekme dönüşü) ölç; görünmezken clientHeight 0 → yanlış açılmasın.
    const ilk = () => { if (kutu.clientHeight > 0) kontrol(true); };
    requestAnimationFrame(ilk);
    if (typeof ResizeObserver === 'function') {
      const gozlemci = new ResizeObserver(ilk);
      gozlemci.observe(kutu);
      Array.from(kutu.children).forEach((el) => gozlemci.observe(el));
    }
    window.addEventListener('resize', ilk);
    kilit.closest('[data-alan]')?.addEventListener('click', () => {
      if (kilit.disabled) { kutu.scrollIntoView({ behavior: AZALTILMIS_HAREKET ? 'auto' : 'smooth', block: 'center' }); not?.classList.add('dikkat'); }
    });
  });
}

/* ---------- taslak ---------- */

interface Taslak { surum: 2; zaman: number; anahtar: string; alanlar: Record<string, string> }

function taslakOku(anahtar: string, gun = 30): Taslak | null {
  try {
    const ham = localStorage.getItem(anahtar);
    if (!ham) return null;
    const t = JSON.parse(ham) as Taslak;
    // Bozuk/yarım kalmış depolama formun açılışını ve gönderimini durdurmasın.
    if (!t || t.surum !== 2 || !t.alanlar || typeof t.alanlar !== 'object' || Array.isArray(t.alanlar)) return null;
    if (!Number.isFinite(t.zaman) || t.zaman <= 0 || !Object.values(t.alanlar).every(v => typeof v === 'string')) return null;
    if (t.anahtar !== undefined && typeof t.anahtar !== 'string') return null;
    if (Date.now() - t.zaman > gun * 86400000) return null;          // Belirlenen ömrü aşan taslak atılır
    return t;
  } catch { return null; }
}

function hassasAlan(ad: string): boolean {
  return ad.startsWith('onay.') || ad === 'saglik.not' || ad.startsWith('gorsel.') || ad === 'kimlik.on' || ad === 'kimlik.arka';
}

function taslakYaz(anahtar: string, form: HTMLFormElement, gonderimAnahtari: string): boolean {
  const alanlarKayit: Record<string, string> = {};
  for (const a of alanlar(form)) {
    if (hassasAlan(a.name) || a.type === 'file') continue;
    if (a.disabled) continue;                                          // gizli koşullu blok (ör. sağlık notu) taslağa yazılmaz
    if (a instanceof HTMLInputElement && a.type === 'radio') { if (a.checked) alanlarKayit[a.name] = a.value; continue; }
    if (a instanceof HTMLInputElement && a.type === 'checkbox') { alanlarKayit[a.name] = a.checked ? '1' : ''; continue; }
    alanlarKayit[a.name] = a.value;
  }
  try { localStorage.setItem(anahtar, JSON.stringify({ surum: 2, zaman: Date.now(), anahtar: gonderimAnahtari, alanlar: alanlarKayit } satisfies Taslak)); return true; } catch { return false; }
}

export function alanlariDoldur(form: HTMLFormElement, degerler: Record<string, string>) {
  for (const a of alanlar(form)) {
    if (!(a.name in degerler)) continue;
    const v = degerler[a.name];
    if (a instanceof HTMLInputElement && a.type === 'radio') a.checked = a.value === v;
    else if (a instanceof HTMLInputElement && a.type === 'checkbox') a.checked = v === '1';
    else a.value = v;
    a.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/* ---------- ana giriş ---------- */

/** Her [data-alan] kabındaki .yardim/.hata paragraflarına kararlı id verir ve içindeki
 *  alanları aria-describedby ile bu id'lere bağlar (ekran okuyucu hata metnini duysun diye). */
function hataIdleriKur(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-alan]').forEach((kap) => {
    const hata = kap.querySelector<HTMLElement>('.hata');
    const yardim = kap.querySelector<HTMLElement>('.yardim');
    const alanlarBu = Array.from(kap.querySelectorAll<Alan>('input[name], select[name], textarea[name]'));
    if (!alanlarBu.length) return;
    const taban = (alanlarBu[0].id || alanlarBu[0].name).replace(/[^a-zA-Z0-9_-]/g, '-');
    const idler: string[] = [];
    if (yardim) { if (!yardim.id) yardim.id = `${taban}-yardim`; idler.push(yardim.id); }
    if (hata) { if (!hata.id) hata.id = `${taban}-hata`; idler.push(hata.id); }
    if (!idler.length) return;
    for (const a of alanlarBu) {
      const mevcut = (a.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      const birlesik = Array.from(new Set([...mevcut, ...idler])).join(' ');
      a.setAttribute('aria-describedby', birlesik);
    }
  });
}

/** [data-sayac] textarea'ları için canlı «yazılan / azami» sayacı (aynı [data-alan] içindeki [data-sayac-metin]).
 *  Görsel yardımcıdır (aria-hidden); ekran okuyucu sınırı alanın maxlength'inden öğrenir. */
function sayaclariKur(form: HTMLFormElement) {
  form.querySelectorAll<HTMLTextAreaElement>('textarea[data-sayac]').forEach((ta) => {
    const kutu = ta.closest('[data-alan]')?.querySelector<HTMLElement>('[data-sayac-metin]');
    const azami = ta.maxLength > 0 ? ta.maxLength : 0;
    if (!kutu || !azami) return;
    const yaz = () => { kutu.textContent = `${ta.value.length} / ${azami}`; kutu.dataset.yakin = azami - ta.value.length <= 60 ? '1' : ''; };
    ta.addEventListener('input', yaz);
    form.addEventListener('reset', () => setTimeout(yaz, 0));
    yaz();
  });
}

export function formuBaslat(form: HTMLFormElement, sec: FormSecenekleri) {
  hataIdleriKur(form);
  const m = JSON.parse(form.querySelector('script[data-metin]')?.textContent || '{}') as Metinler;
  const taslakAnahtari = form.dataset.taslak || `ulucamii:${form.dataset.form}:v2`;
  const mesaj = form.querySelector<HTMLElement>('[data-mesaj]');
  const taslakNotu = form.querySelector<HTMLElement>('[data-taslak-not]');
  const gonderDugme = form.querySelector<HTMLButtonElement>('button[type=submit]');
  const taslakSilDugme = form.querySelector<HTMLButtonElement>('[data-taslak-sil]');
  let gonderimAnahtari = uuid();
  let gonderiliyor = false;
  let taslakDegisti = false;

  const mesajGoster = (metin: string | null, tur: 'hata' | 'bilgi' = 'hata', kaydir = true) => {
    if (!mesaj) return;
    mesaj.hidden = !metin; mesaj.textContent = metin ?? ''; mesaj.dataset.tur = tur;
    if (metin && kaydir) mesaj.scrollIntoView({ behavior: AZALTILMIS_HAREKET ? 'auto' : 'smooth', block: 'center' });
  };

  // Taslak
  const taslak = taslakOku(taslakAnahtari, Number(form.dataset.taslakGun) || 30);
  if (taslak) {
    alanlariDoldur(form, Object.fromEntries(Object.entries(taslak.alanlar).filter(([ad]) => !hassasAlan(ad))));
    gonderimAnahtari = taslak.anahtar || gonderimAnahtari;
    if (taslakNotu) taslakNotu.hidden = false;
    const bilgi = taslakNotu?.querySelector<HTMLElement>('[data-taslak-metin]');
    if (bilgi) bilgi.textContent = `${m.taslakGeriYuklendi} ${new Intl.DateTimeFormat(form.dataset.dil, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(taslak.zaman)}. ${m.taslakHassasNot ?? ''}`;
    // Eski taslakta kalmış hassas alanları da cihazdan kaldır.
    taslakYaz(taslakAnahtari, form, gonderimAnahtari);
  }
  sayaclariKur(form);
  form.querySelector<HTMLButtonElement>('[data-taslak-sil]')?.addEventListener('click', () => {
    if (gonderiliyor) return;
    window.clearTimeout(zamanlayici);
    try { localStorage.removeItem(taslakAnahtari); } catch { /* yok say */ }
    form.reset(); gonderimAnahtari = uuid(); taslakDegisti = false;
    form.querySelectorAll<HTMLElement>('[data-kaydir]').forEach((k) => { k.dataset.okundu = ''; k.scrollTop = 0; });
    kosullariUygula(form); kaydirmaKilidiKur(form); tumHatalariTemizle(form);
    if (taslakNotu) taslakNotu.hidden = true;
    mesajGoster(m.taslakSilindi, 'bilgi');
    setTimeout(() => mesajGoster(null), 4000);
    ozetGuncelle();
  });
  let zamanlayici: number | undefined;
  let odakZamanlayici: number | undefined;
  const odagiIptalEt = () => { window.clearTimeout(odakZamanlayici); odakZamanlayici = undefined; };
  const odagiPlanla = (hedef: HTMLElement | null | undefined) => {
    odagiIptalEt();
    if (!hedef) return;
    if (AZALTILMIS_HAREKET) { hedef.focus({ preventScroll: true }); return; }
    const oncekiOdak = document.activeElement;
    odakZamanlayici = window.setTimeout(() => {
      odakZamanlayici = undefined;
      if (hedef.isConnected && !hedef.matches(':disabled') && document.activeElement === oncekiOdak) hedef.focus({ preventScroll: true });
    }, 350);
  };
  // Kullanıcı düzeltmeye veya başka alana yazmaya başladığında eski hata odağı çalınmaz.
  for (const olay of ['pointerdown', 'keydown', 'focusin']) form.addEventListener(olay, odagiIptalEt);
  form.addEventListener('input', (e) => {
    taslakDegisti = true;
    odagiIptalEt();
    window.clearTimeout(zamanlayici);
    if (!form.hidden) zamanlayici = window.setTimeout(() => taslakYaz(taslakAnahtari, form, gonderimAnahtari), 400);
    // Hatalı işaretlenmiş alan düzelirken uyarı hemen kalkar; böylece bir sonraki dokunuşta
    // (odak değişince) sayfa düzeni kaymaz — kayan düzen dokunuşu boşa düşürüyordu.
    const hedef = e.target as Alan;
    if (hedef?.name && hedef.getAttribute('aria-invalid') === 'true') {
      hataYaz(form, hedef.name, alanDogrula(form, hedef, verileriTopla(form), m));
    }
  });
  // Son tuş ile sayfadan ayrılma arasındaki 400 ms'de taslak kaybolmasın.
  window.addEventListener('pagehide', () => {
    window.clearTimeout(zamanlayici);
    if (!form.hidden && taslakDegisti) taslakYaz(taslakAnahtari, form, gonderimAnahtari);
  });

  // Koşullar + kilit + canlı doğrulama
  kosullariUygula(form);
  form.addEventListener('change', (e) => {
    taslakDegisti = true;
    kosullariUygula(form);
    const hedef = e.target as Alan;
    if (hedef?.name) {
      const h = alanDogrula(form, hedef, verileriTopla(form), m);
      hataYaz(form, hedef.name, h);
    }
    ozetGuncelle();
    window.clearTimeout(zamanlayici);
    if (!form.hidden) zamanlayici = window.setTimeout(() => taslakYaz(taslakAnahtari, form, gonderimAnahtari), 400);
  });
  form.addEventListener('focusout', (e) => {
    const hedef = e.target as Alan;
    if (hedef?.name && !(hedef instanceof HTMLInputElement && (hedef.type === 'radio' || hedef.type === 'checkbox'))) {
      hataYaz(form, hedef.name, alanDogrula(form, hedef, verileriTopla(form), m));
    }
  });
  kaydirmaKilidiKur(form);

  // Özet
  function ozetGuncelle() {
    const kap = form.querySelector<HTMLElement>('[data-ozet]');
    if (!kap) return;
    const degerler = sec.ozet(verileriTopla(form), form);
    kap.querySelectorAll<HTMLElement>('[data-ozet-alan]').forEach((satir) => {
      const d = degerler[satir.dataset.ozetAlan || ''];
      const hedef = satir.querySelector<HTMLElement>('[data-ozet-deger]');
      if (hedef) hedef.textContent = d && d.trim() ? d : m.bosDeger;
    });
  }
  ozetGuncelle();
  /* Özetteki "Düzenle" çapası bölümü görünüme getirir ama tek başına odak taşımaz; klavye ve ekran
     okuyucu kullanıcısı için hedef bölümdeki ilk alana odaklanılır (gönderim hatası kalıbıyla aynı). */
  form.querySelector<HTMLElement>('[data-ozet]')?.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const bolum = document.getElementById(a.getAttribute('href')!.slice(1));
    const ilk = bolum?.querySelector<Alan>('input:not([type="hidden"]):not([tabindex="-1"]), select, textarea');
    odagiPlanla(ilk);
  });
  sec.hazir?.(form, verileriTopla(form));

  // Adımlı form da gönderimle aynı doğrulamayı kullanır. Gizlenen adımlar devre dışı
  // bırakılmaz; son gönderimde bütün alanlar yine denetlenir.
  function dogrulaBolum(bolumler?: HTMLElement[]) {
    const veriler = verileriTopla(form);
    const kapsamda = (a: Element) => !bolumler || bolumler.some(b => b.contains(a));
    const hatalar: Array<[string, string]> = [];
    for (const a of alanlar(form)) {
      if (!kapsamda(a)) continue;
      if (a.type === 'radio' && hatalar.some(([ad]) => ad === a.name)) continue;
      const h = alanDogrula(form, a, veriler, m);
      hataYaz(form, a.name, h);
      if (h && !hatalar.some(([ad]) => ad === a.name)) hatalar.push([a.name, h]);
    }
    for (const [ad, h] of sec.ekDogrula?.(veriler, form, m, bolumler) ?? []) {
      const alan = form.querySelector(`[name="${CSS.escape(ad)}"]`);
      if (alan && kapsamda(alan)) { hatalar.push([ad, h]); hataYaz(form, ad, h); }
    }
    if (hatalar.length) {
      const alan = form.querySelector<Alan>(`[name="${CSS.escape(hatalar[0][0])}"]`);
      form.dispatchEvent(new CustomEvent('form:hata', { detail: { alan } }));
      const kap = alan?.closest<HTMLElement>('[data-alan]');
      kap?.scrollIntoView({ behavior: AZALTILMIS_HAREKET ? 'auto' : 'smooth', block: 'center' });
      const odak = alan?.disabled && alan.dataset.kaydirKilit ? document.getElementById(alan.dataset.kaydirKilit)
        : alan?.type === 'hidden' ? kap?.querySelector<Alan>('input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)') : alan;
      odagiPlanla(odak);
    }
    return hatalar.length === 0;
  }

  // Gönderim
  form.addEventListener('submit', async (e) => {
    if (e.defaultPrevented) return;
    e.preventDefault();
    if (gonderiliyor || form.hidden) return;
    odagiIptalEt();
    tumHatalariTemizle(form); mesajGoster(null);
    const veriler = verileriTopla(form);
    if ((form.querySelector<HTMLInputElement>('input[name="web"]')?.value ?? '').trim() !== '') {
      // Honeypot doldurulmuş: bot. Kullanıcıya normal başarı görünümü göster, sunucuya istek atma.
      basariGoster(form, 'BOT-' + Date.now().toString(36), '', m);
      return;
    }
    if (!dogrulaBolum()) {
      mesajGoster(m.hata.formHatali, 'hata', false);
      return;
    }
    const kaydedildi = taslakYaz(taslakAnahtari, form, gonderimAnahtari);
    const guvence = kaydedildi ? m.taslakGuvence : m.taslakKaydedilemedi;
    const gonderimHatasi = (metin: string) => mesajGoster([metin, guvence].filter(Boolean).join(' '));
    if (!navigator.onLine) { gonderimHatasi(m.hata.cevrimdisi); return; }

    const govde = { ...sec.govde(veriler), tur: form.dataset.form, sir: form.dataset.sir, formSurumu: Number(form.dataset.formSurumu) || (form.dataset.form === 'kayit' ? 3 : 2), dil: form.dataset.dil, gonderimAnahtari };
    gonderiliyor = true;
    window.clearTimeout(zamanlayici);
    if (taslakSilDugme) taslakSilDugme.disabled = true;
    taslakYaz(taslakAnahtari, form, gonderimAnahtari);
    const dugmeMetni = gonderDugme?.textContent ?? '';
    if (gonderDugme) { gonderDugme.disabled = true; gonderDugme.textContent = m.basari.gonderiliyor || '…'; }
    form.setAttribute('aria-busy', 'true');
    type Sonuc = { [anahtar: string]: unknown; ok?: boolean; ref?: string; hata?: string; tekrar?: boolean; kopyaGitti?: boolean; durum?: number };
    // Her deneme kendi zaman aşımını taşır; aynı gonderimAnahtari ile yinelenen istek sunucuda
    // ikinci kayıt açmaz (tekrar:true ya da işlem sürüyorsa kayit-isleniyor döner).
    const gonder = async (sureMs: number): Promise<Sonuc> => {
      const denetleyici = new AbortController();
      const zamanAsimi = window.setTimeout(() => denetleyici.abort(), sureMs);
      try {
        const yanit = await fetch(form.dataset.uc || '', {
          method: 'POST', mode: 'cors', redirect: 'follow', signal: denetleyici.signal,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(govde),
        });
        const metin = await yanit.text();
        let sonuc: Sonuc = {};
        try { sonuc = JSON.parse(metin); } catch { sonuc = { ok: false, hata: 'yanit-json-degil' }; }
        return { ...sonuc, durum: yanit.status, ok: yanit.ok && sonuc.ok === true };
      } finally { window.clearTimeout(zamanAsimi); }
    };
    const bekle = (ms: number) => new Promise<void>((coz) => window.setTimeout(coz, ms));
    try {
      const asgariSurum = Number(form.dataset.asgariServisSurumu || 0);
      if (asgariSurum) {
        // Yeni alanları eski servis sessizce düşürmesin. Bu GET kişisel veri taşımaz.
        const saglikDenetleyici = new AbortController();
        const saglikZamani = window.setTimeout(() => saglikDenetleyici.abort(), ZAMAN_ASIMI_MS);
        try {
          const saglik = await fetch(form.dataset.uc || '', { mode: 'cors', redirect: 'follow', cache: 'no-store', signal: saglikDenetleyici.signal });
          const durum = await saglik.json();
          const bayrak = form.dataset.asgariServisBayrak;
          if (!saglik.ok || !durum.ok || Number(durum.surum || 0) < asgariSurum || (form.dataset.form === 'ihtida' && durum.ihtidaPaketHazir !== true) || (!!bayrak && durum[bayrak] !== true)) {
            mesajGoster(m.hata.servisHazirDegil);
            return;
          }
        } finally { window.clearTimeout(saglikZamani); }
      }
      // 13 Eyl 2026 (canlı ölçüm): PDF + Drive + e-posta bazen 60 sn'yi aşıyor. İlk deneme
      // zaman aşımına düşer ya da sunucu «kayit-isleniyor» derse veliye «tekrar deneyin»
      // demek yerine aynı anahtarla en çok 8 kez, 8 sn arayla yoklanır; sonuç gelince
      // başarı ekranı açılır. Yoklamalar tükenirse mesaj kalır, düğme yeniden açılır.
      let sonuc: Sonuc;
      let bekliyor = false;
      try { sonuc = await gonder(ZAMAN_ASIMI_MS); }
      catch (err) { if ((err as Error)?.name !== 'AbortError') throw err; sonuc = { ok: false, hata: 'kayit-isleniyor' }; bekliyor = true; }
      for (let deneme = 0; !sonuc.ok && (sonuc.hata === 'kayit-isleniyor' || bekliyor) && deneme < 8; deneme++) {
        mesajGoster(m.hata.isleniyor, 'bilgi', deneme === 0);
        await bekle(8_000);
        try { sonuc = await gonder(30_000); bekliyor = false; }
        catch (err) { if ((err as Error)?.name !== 'AbortError') throw err; sonuc = { ok: false, hata: 'kayit-isleniyor' }; bekliyor = true; }
      }
      if (!sonuc.ok || !sonuc.ref) {
        gonderimHatasi(sonuc.hata === 'kayit-isleniyor' ? (bekliyor ? m.hata.zamanAsimi : m.hata.isleniyor) : (m.hata['sunucu:' + sonuc.hata] || doldur(m.hata.sunucu, { kod: sonuc.hata || String(sonuc.durum ?? '') })));
        return;
      }
      window.clearTimeout(zamanlayici);
      try { localStorage.removeItem(taslakAnahtari); } catch { /* yok say */ }
      sec.basarida?.(veriler, sonuc.ref, sonuc);
      basariGoster(form, sonuc.ref, String(deger(veriler, form.dataset.epostaAlani || '') ?? ''), m, sonuc.kopyaGitti);
    } catch (err) {
      gonderimHatasi((err as Error)?.name === 'AbortError' ? m.hata.zamanAsimi : m.hata.ag);
    } finally {
      gonderiliyor = false;
      if (taslakSilDugme) taslakSilDugme.disabled = false;
      form.removeAttribute('aria-busy');
      if (gonderDugme) { gonderDugme.disabled = false; gonderDugme.textContent = dugmeMetni; }
    }
  });
  return { dogrulaBolum };
}

function basariGoster(form: HTMLFormElement, ref: string, eposta: string, m: Metinler, kopyaGitti?: boolean) {
  const panel = document.querySelector<HTMLElement>('[data-basari]');
  if (!panel) return;
  panel.querySelectorAll<HTMLElement>('[data-ref]').forEach((el) => { el.textContent = ref; });
  const ep = panel.querySelector<HTMLElement>('[data-eposta-metin]');
  if (ep) ep.textContent = kopyaGitti === false && m.basari.epostaGitmedi ? m.basari.epostaGitmedi : doldur(m.basari.epostaGitti, { eposta });
  form.hidden = true;
  document.querySelectorAll<HTMLElement>('[data-form-ust]').forEach((el) => { el.hidden = true; });
  panel.hidden = false;
  panel.setAttribute('tabindex', '-1');
  panel.scrollIntoView({ behavior: AZALTILMIS_HAREKET ? 'auto' : 'smooth', block: 'start' });
  panel.focus({ preventScroll: true });
  form.dispatchEvent(new CustomEvent('form:basari'));
}
