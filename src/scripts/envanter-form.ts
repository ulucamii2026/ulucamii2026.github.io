/** Mühtedi Hizmetleri Envanteri — sayfa davranışı (1 Ekim 2026; /envanter/, yalnız Türkçe).
 *
 *  1. Sayfa açılınca Apps Script sağlık yanıtı okunur (kişisel veri taşımayan GET). Form YALNIZ
 *     `envanter.acik === true`, veri sorumlusu dolu ve servis sürümü ≥ 42 iken <template>'ten DOM'a konur;
 *     aksi hâlde (erişilemezse de) «Form henüz açılmadı ya da kapandı…» iletisi görünür ve hiçbir POST yapılmaz.
 *     Gönderimden hemen önce çekirdek aynı denetimi yeniden yapar (data-asgari-servis-bayrak="envanter.acik").
 *  2. Veri sorumlusu metni sağlık yanıtından gelir ve textContent ile yazılır (HTML yorumlanmaz).
 *  3. Adlı bildirim satırlarını bu betik kurar (en çok 40); gövdeye DİZİ olarak girer. Satırlar, aday bilgileri
 *     ve onay kutuları taslağa yazılmaz (form-cekirdek.ts → hassasAlan). Gizli/kodlu satır işaretlenince
 *     ad, telefon ve e-posta hemen temizlenir.
 *  Sözleşme: src/lib/envanter/sozlesme.ts · sunucu: scripts/apps-script/envanter-isleri.gs
 */
import { formuBaslat, telefonNormalle, deger, doldur, type Veriler } from './form-cekirdek';
import { formAdimlariniBaslat } from './form-adimlari';
import { telefonAlaniniBagla } from './telefon-bicim';
import {
  ONAY_SURUMU, ASGARI_SERVIS_SURUMU, LISTEDE_YOK, GOREVLI_DILLERI, IHTIDA_YILLARI, CINSIYETLER, BELGE_DURUMLARI,
  YAS_GRUPLARI, TERCIH_DILLERI, DURUM_ALANLARI, FAALIYETLER, GONULLU_ALANLARI,
} from '../lib/envanter/sabitler';

interface Cami { id: string; ad: string; bolge: string }
interface BetikMetni {
  kisi: { satir: string; eklendi: string; kaldirildi: string; sayac: string; iletisimHata: string; dogumYiliHata: string };
  azamiKisi: number;
  iletisimEnAz: string;
  camiOnce: string;
  secin: string;
  listedeYok: string;
  listedeYokDeger: string;
  pilotYok: string;
  kisiSayisi: string;
  sonGun: string;
}

export interface EnvanterDurumu { acik: boolean; veriSorumlusu: string; kapanis: string | null }

const KAPALI: EnvanterDurumu = { acik: false, veriSorumlusu: '', kapanis: null };

/** Sağlık yanıtı → durum. Kuşkuda kapalı: yanıt, sürüm, bayrak ve veri sorumlusu birlikte doğru olmalı. */
export function durumYorumla(httpOk: boolean, yanit: unknown): EnvanterDurumu {
  const d = (yanit && typeof yanit === 'object' ? yanit : {}) as Record<string, unknown>;
  const e = (d.envanter && typeof d.envanter === 'object' ? d.envanter : {}) as Record<string, unknown>;
  const vs = typeof e.veriSorumlusu === 'string' ? e.veriSorumlusu.trim() : '';
  const acik = httpOk && d.ok === true && Number(d.surum || 0) >= ASGARI_SERVIS_SURUMU && e.acik === true && vs !== '';
  if (!acik) return KAPALI;
  const kapanis = typeof e.kapanis === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.kapanis) ? e.kapanis : null;
  return { acik, veriSorumlusu: vs, kapanis };
}

async function durumAl(uc: string): Promise<EnvanterDurumu> {
  if (!uc) return KAPALI;
  // Google'ın geçici ağ/zaman aşımı hatası, açık formu ilk istekte kapalı göstermesin.
  // Gerçek kapalı/eski/geçersiz sağlık yanıtı hemen kapalı kalır; yalnız ağ hatası yeniden denenir.
  for (let deneme = 0; deneme < 2; deneme++) {
    const denetleyici = new AbortController();
    const zaman = window.setTimeout(() => denetleyici.abort(), 20_000);
    try {
      const yanit = await fetch(uc, { mode: 'cors', redirect: 'follow', cache: 'no-store', signal: denetleyici.signal });
      if ((yanit.status >= 500 || yanit.status === 429) && deneme === 0) continue;
      return durumYorumla(yanit.ok, await yanit.json());
    } catch {
      if (deneme === 1) return KAPALI;
    } finally {
      window.clearTimeout(zaman);
    }
  }
  return KAPALI;
}

function tarihYaz(gun: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${gun}T00:00:00Z`));
  } catch { return gun; }
}

/* ---------- cami seçimleri (bölgeye göre) ---------- */

function camiSecimleriniKur(form: HTMLFormElement, camiler: Cami[], metin: BetikMetni) {
  const bolge = form.querySelector<HTMLSelectElement>('select[data-bolge-secimi]');
  const gorevli = form.querySelector<HTMLSelectElement>('select[data-cami-secimi="gorevli"]');
  const pilot = form.querySelector<HTMLSelectElement>('select[data-cami-secimi="pilot"]');
  if (!bolge) return;
  const kur = (secim: HTMLSelectElement, listedeYok: boolean) => {
    const onceki = secim.value;
    const b = bolge.value;
    const bos = listedeYok ? (b ? metin.secin : metin.camiOnce) : metin.pilotYok;
    secim.replaceChildren(new Option(bos, ''));
    for (const c of camiler) if (c.bolge === b) secim.add(new Option(c.ad, c.id));
    if (listedeYok && b) secim.add(new Option(metin.listedeYok, metin.listedeYokDeger));
    secim.value = Array.from(secim.options).some((o) => o.value === onceki) ? onceki : '';
  };
  const yenile = () => { if (gorevli) kur(gorevli, true); if (pilot) kur(pilot, false); };
  // Taslak geri yüklenirken bölge önce gelir (DOM sırası): bu dinleyici çekirdekten ÖNCE kurulur ki
  // caminin kayıtlı değeri seçenekler hazırken yazılabilsin.
  bolge.addEventListener('change', yenile);
  yenile();
}

/* ---------- adlı bildirim satırları ---------- */

/** Yeni satırın .yardim/.hata paragraflarını alanlara bağlar (çekirdeğin hataIdleriKur eşleniği). */
function erisimKur(kap: HTMLElement) {
  kap.querySelectorAll<HTMLElement>('[data-alan]').forEach((alanKabi) => {
    const girdiler = Array.from(alanKabi.querySelectorAll<HTMLElement>('input[name], select[name], textarea[name]'));
    if (!girdiler.length) return;
    const taban = (girdiler[0].id || 'env-alan').replace(/[^a-zA-Z0-9_-]/g, '-');
    const idler: string[] = [];
    const yardim = alanKabi.querySelector<HTMLElement>('.yardim');
    const hata = alanKabi.querySelector<HTMLElement>('.hata');
    if (yardim) { yardim.id ||= `${taban}-yardim`; idler.push(yardim.id); }
    if (hata) { hata.id ||= `${taban}-hata`; idler.push(hata.id); }
    if (idler.length) girdiler.forEach((g) => g.setAttribute('aria-describedby', idler.join(' ')));
  });
}

function kisiYoneticisi(kok: HTMLElement, form: HTMLFormElement, metin: BetikMetni) {
  const kap = form.querySelector<HTMLElement>('[data-kisiler]');
  const sablon = kok.querySelector<HTMLTemplateElement>('template[data-kisi-sablon]');
  const ekle = form.querySelector<HTMLButtonElement>('[data-kisi-ekle]');
  if (!kap || !sablon || !ekle) return { guncelle() { /* satır bölümü yok */ } };
  const bos = form.querySelector<HTMLElement>('[data-kisi-bos]');
  const sayac = form.querySelector<HTMLElement>('[data-kisi-sayac]');
  const azamiNot = form.querySelector<HTMLElement>('[data-kisi-azami]');
  const duyuru = form.querySelector<HTMLElement>('[data-kisi-duyuru]');
  const buYil = new Date().getFullYear();
  let sira = 0;

  const satirlar = () => Array.from(kap.querySelectorAll<HTMLElement>('[data-kisi]'));
  const guncelle = () => {
    const liste = satirlar();
    liste.forEach((s, i) => {
      const baslik = s.querySelector<HTMLElement>('[data-kisi-baslik]');
      if (baslik) baslik.textContent = doldur(metin.kisi.satir, { n: i + 1 });
    });
    if (bos) bos.hidden = liste.length > 0;
    if (sayac) sayac.textContent = doldur(metin.kisi.sayac, { n: liste.length, azami: metin.azamiKisi });
    ekle.disabled = liste.length >= metin.azamiKisi;
    if (azamiNot) azamiNot.hidden = liste.length < metin.azamiKisi;
  };

  ekle.addEventListener('click', () => {
    if (satirlar().length >= metin.azamiKisi) return;
    const n = String(++sira);
    const parca = sablon.content.cloneNode(true) as DocumentFragment;
    parca.querySelectorAll('*').forEach((el) => {
      for (const at of Array.from(el.attributes)) {
        if (at.value.includes('__N__')) el.setAttribute(at.name, at.value.replaceAll('__N__', n));
      }
    });
    const satir = parca.querySelector<HTMLElement>('[data-kisi]');
    if (!satir) return;
    // Doğum yılının üst sınırı derleme yılı değil, bugünün yılıdır.
    const dogum = satir.querySelector<HTMLInputElement>('[data-kisi-dogum]');
    if (dogum) { dogum.dataset.azami = String(buYil); dogum.dataset.hataMetni = doldur(metin.kisi.dogumYiliHata, { yil: buYil }); }
    erisimKur(satir);
    kap.append(parca);
    satir.querySelectorAll<HTMLInputElement>('input[data-tur="telefon"]').forEach((a) => telefonAlaniniBagla(a));
    guncelle();
    // Çekirdeğin «change» dinleyicisi koşullu blokları (gizli/açık) uygular ve özeti yeniler.
    satir.querySelector('[data-kisi-gizli]')?.dispatchEvent(new Event('change', { bubbles: true }));
    if (duyuru) duyuru.textContent = doldur(metin.kisi.eklendi, { n: satirlar().length });
    satir.querySelector<HTMLInputElement>('[data-kisi-ad]')?.focus();
  });

  kap.addEventListener('click', (e) => {
    const dugme = (e.target as HTMLElement).closest('[data-kisi-kaldir]');
    const satir = dugme?.closest<HTMLElement>('[data-kisi]');
    if (!satir) return;
    const i = satirlar().indexOf(satir);
    satir.remove();
    guncelle();
    form.dispatchEvent(new Event('change', { bubbles: true }));
    if (duyuru) duyuru.textContent = metin.kisi.kaldirildi;
    const kalan = satirlar();
    const sonraki = kalan[i] ?? kalan[i - 1];
    (sonraki?.querySelector<HTMLElement>('[data-kisi-ad]:not(:disabled), input:not(:disabled)') ?? ekle).focus();
  });

  // Gizli/kodlu kayıt işaretlenince ad, telefon, e-posta yalnız gizlenmez, TEMİZLENİR.
  // Bu dinleyici kapta (çekirdeğin form dinleyicisinden önce) çalışır; ardından çekirdek alanları devre dışı bırakır.
  kap.addEventListener('change', (e) => {
    const kutu = e.target as HTMLInputElement;
    if (!kutu.matches?.('[data-kisi-gizli]') || !kutu.checked) return;
    kutu.closest('[data-kisi]')?.querySelectorAll<HTMLInputElement>('input[name$=".ad"], input[name$=".telefon"], input[name$=".eposta"]').forEach((a) => {
      a.value = '';
      a.removeAttribute('aria-invalid');
    });
  });

  // «Taslağı sil ve boş başla» formu sıfırlar: satırlar da kaldırılır.
  form.addEventListener('reset', () => { kap.replaceChildren(); guncelle(); });
  guncelle();
  return { guncelle };
}

/* ---------- gövde, özet, ek doğrulama ---------- */

function metinAl(v: Veriler, yol: string): string {
  return String(deger(v, yol) ?? '').trim();
}

function govdeKur(form: HTMLFormElement, v: Veriler): Record<string, unknown> {
  const m = (yol: string) => metinAl(v, yol);
  const evet = (yol: string) => deger(v, yol) === true;
  const tel = (yol: string) => { const t = m(yol); return t ? telefonNormalle(t) ?? t : ''; };
  // Boş = bilinmiyor (null). Geçersiz yazım olduğu gibi gider; sunucu reddeder (istemci zaten engeller).
  const sayi = (yol: string) => { const t = m(yol); return t === '' ? null : (/^\d+$/.test(t) ? Number(t) : t); };
  const cami = m('gorevli.cami');
  const statu = m('gorevli.statu');
  const diller = GOREVLI_DILLERI.filter((d) => evet(`gorevli.diller.${d}`));
  const kisiler = Array.from(form.querySelectorAll<HTMLElement>('[data-kisi]')).map((satir) => {
    const k = (alan: string) => `kisiler.${satir.dataset.kisi}.${alan}`;
    const gizli = evet(k('gizli'));
    return {
      gizli,
      kod: gizli ? m(k('kod')) : '',
      ad: gizli ? '' : m(k('ad')),
      telefon: gizli ? '' : tel(k('telefon')),
      eposta: gizli ? '' : m(k('eposta')),
      cinsiyet: m(k('cinsiyet')),
      dogumYili: sayi(k('dogumYili')),
      dil: m(k('dil')),
      ihtidaYili: m(k('ihtidaYili')),
      belge: m(k('belge')),
      izin: evet(k('izin')),
    };
  });
  const aVar = m('aday.a.var');
  const bSecim = m('aday.b.secim');
  const pilot = m('aday.c.cami');
  const belgeVar = m('belge.var');
  return {
    onaySurumu: form.dataset.onaySurumu || ONAY_SURUMU,
    onay: { bilgilendirme: evet('onay.bilgilendirme'), izin: evet('onay.izin') },
    gorevli: {
      ad: m('gorevli.ad'),
      bolge: m('gorevli.bolge'),
      cami,
      camiSerbest: cami === LISTEDE_YOK ? m('gorevli.camiSerbest') : '',
      statu,
      statuAciklama: statu === 'diger' ? m('gorevli.statuAciklama') : '',
      telefon: tel('gorevli.telefon'),
      eposta: m('gorevli.eposta'),
      diller,
      digerDil: diller.includes('diger') ? m('gorevli.digerDil') : '',
    },
    sayilar: {
      ihtida: Object.fromEntries(IHTIDA_YILLARI.map((y) => [y, Object.fromEntries(CINSIYETLER.map((c) => [c, sayi(`sayilar.ihtida.${y}.${c}`)]))])),
      belge: Object.fromEntries(BELGE_DURUMLARI.map((b) => [b, sayi(`sayilar.belge.${b}`)])),
      yas: Object.fromEntries(YAS_GRUPLARI.map((y) => [y, sayi(`sayilar.yas.${y}`)])),
      dil: Object.fromEntries(TERCIH_DILLERI.map((d) => [d, sayi(`sayilar.dil.${d}`)])),
    },
    kisiler,
    durum: Object.fromEntries(DURUM_ALANLARI.map((d) => [d, sayi(`durum.${d}`)])),
    faaliyet: { ...Object.fromEntries(FAALIYETLER.map((f) => [f, evet(`faaliyet.${f}`)])), materyal: m('faaliyet.materyal') },
    gonullu: Object.fromEntries(GONULLU_ALANLARI.map((g) => [g, sayi(`gonullu.${g}`)])),
    aday: {
      a: aVar === 'evet'
        ? { var: aVar, ad: m('aday.a.ad'), telefon: tel('aday.a.telefon'), eposta: m('aday.a.eposta'), neden: m('aday.a.neden'), izin: evet('aday.a.izin') }
        : { var: aVar },
      b: bSecim === 'baskasi' ? { secim: bSecim, ad: m('aday.b.ad'), cami: m('aday.b.cami') } : { secim: bSecim },
      c: { cami: pilot, gerekce: pilot ? m('aday.c.gerekce') : '' },
      d: { irtibat: m('aday.d.irtibat') },
    },
    belge: belgeVar === 'evet' ? { var: belgeVar, adet: sayi('belge.adet'), iletilebilir: m('belge.iletilebilir') } : { var: belgeVar },
    gorus: m('gorus'),
    web: '',
  };
}

function ozetKur(v: Veriler, form: HTMLFormElement, metin: BetikMetni): Record<string, string> {
  const m = (yol: string) => metinAl(v, yol);
  const camiSecimi = form.querySelector<HTMLSelectElement>('select[name="gorevli.cami"]');
  const cami = m('gorevli.cami') === LISTEDE_YOK ? m('gorevli.camiSerbest')
    : (camiSecimi?.value ? camiSecimi.selectedOptions[0]?.textContent?.trim() ?? '' : '');
  let toplam = 0, yazildi = false;
  for (const y of IHTIDA_YILLARI) for (const c of CINSIYETLER) {
    const t = m(`sayilar.ihtida.${y}.${c}`);
    if (/^\d+$/.test(t)) { toplam += Number(t); yazildi = true; }
  }
  const kisiSayisi = form.querySelectorAll('[data-kisi]').length;
  return {
    gorevli: [m('gorevli.ad'), m('gorevli.bolge')].filter(Boolean).join(' · '),
    cami,
    toplam: yazildi ? String(toplam) : '',
    kisi: kisiSayisi ? doldur(metin.kisiSayisi, { n: kisiSayisi }) : '',
    aday: m('aday.a.var') === 'evet' ? m('aday.a.ad') : '',
  };
}

function ekDogrula(v: Veriler, form: HTMLFormElement, metin: BetikMetni): Array<[string, string]> {
  const m = (yol: string) => metinAl(v, yol);
  const hatalar: Array<[string, string]> = [];
  if (!m('gorevli.telefon') && !m('gorevli.eposta')) hatalar.push(['gorevli.telefon', metin.iletisimEnAz]);
  form.querySelectorAll<HTMLElement>('[data-kisi]').forEach((satir) => {
    const n = satir.dataset.kisi;
    if (deger(v, `kisiler.${n}.gizli`) === true) return;
    if (!m(`kisiler.${n}.telefon`) && !m(`kisiler.${n}.eposta`)) hatalar.push([`kisiler.${n}.telefon`, metin.kisi.iletisimHata]);
  });
  if (m('aday.a.var') === 'evet' && !m('aday.a.telefon') && !m('aday.a.eposta')) hatalar.push(['aday.a.telefon', metin.iletisimEnAz]);
  return hatalar;
}

/* ---------- giriş ---------- */

function formuKur(kok: HTMLElement, durum: EnvanterDurumu) {
  const onizleme = kok.dataset.onizleme === 'true';
  const sablon = kok.querySelector<HTMLTemplateElement>('template[data-envanter-sablon]');
  const yer = kok.querySelector<HTMLElement>('[data-form-yeri]');
  if (!sablon || !yer) throw new Error('envanter-sablon-yok');
  yer.append(sablon.content.cloneNode(true));
  const form = yer.querySelector<HTMLFormElement>('form[data-form="envanter"]');
  if (!form) throw new Error('envanter-form-yok');
  const metin = JSON.parse(kok.querySelector('script[data-metin-envanter]')?.textContent || '{}') as BetikMetni;
  const camiler = JSON.parse(kok.querySelector('script[data-camiler]')?.textContent || '[]') as Cami[];

  const vs = form.querySelector<HTMLElement>('[data-veri-sorumlusu]');
  if (vs) vs.textContent = durum.veriSorumlusu;
  const sonGun = form.querySelector<HTMLElement>('[data-son-gun]');
  if (sonGun && durum.kapanis) { sonGun.textContent = doldur(metin.sonGun, { tarih: tarihYaz(durum.kapanis) }); sonGun.hidden = false; }

  camiSecimleriniKur(form, camiler, metin);
  const kisiler = kisiYoneticisi(kok, form, metin);
  const cekirdek = formuBaslat(form, {
    onizleme,
    govde: (v) => govdeKur(form, v),
    ozet: (v, f) => ozetKur(v, f, metin),
    ekDogrula: (v, f) => ekDogrula(v, f, metin),
  });
  formAdimlariniBaslat(form, cekirdek.dogrulaBolum);
  kisiler.guncelle();
  if (onizleme) {
    form.querySelector('[data-ornek-doldur]')?.addEventListener('click', () => {
      form.reset();
      const yaz = (ad: string, deger: string | boolean) => {
        const alan = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${ad}"]${typeof deger === 'string' ? ':not([type=radio])' : ''}`);
        const radio = form.querySelector<HTMLInputElement>(`input[type=radio][name="${ad}"][value="${String(deger)}"]`);
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
        else if (alan) {
          if (typeof deger === 'boolean' && alan instanceof HTMLInputElement) alan.checked = deger;
          else alan.value = String(deger);
          alan.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      const ornek: Record<string, string | boolean> = {
        'gorevli.ad': 'Örnek Görevli TESTOGLU', 'gorevli.bolge': 'Namur', 'gorevli.cami': 'ulucamii-marche',
        'gorevli.statu': 'baokk', 'gorevli.eposta': 'gorevli@example.test', 'gorevli.diller.tr': true, 'gorevli.diller.fr': true,
        'sayilar.ihtida.2026.kadin': '2', 'sayilar.ihtida.2026.erkek': '1', 'sayilar.belge.aldi': '2',
        'sayilar.belge.istiyor': '1', 'sayilar.yas.18-alti': '1', 'sayilar.yas.26-40': '2',
        'sayilar.dil.fr': '2', 'sayilar.dil.nl': '1', 'durum.egitimIsteyen': '2', 'durum.kardesAileIsteyen': '1',
        'faaliyet.dersSohbet': true, 'faaliyet.bulusmaIftar': true, 'faaliyet.materyal': 'Kurgusal örnek: beş dilde başlangıç kitapçığı.',
        'gonullu.kadin': '1', 'gonullu.erkek': '1', 'gonullu.kardesAile': '1',
        'aday.a.var': 'evet', 'aday.a.ad': 'Kurgusal Üye Adayı', 'aday.a.eposta': 'aday@example.test',
        'aday.a.neden': 'Kurgusal örnek: kardeş aile ve eğitim çalışmalarına katkı.',
        'aday.b.secim': 'baskasi', 'aday.b.ad': 'Kurgusal Bölge Adayı', 'aday.b.cami': 'Örnek cami',
        'aday.c.cami': 'ulucamii-marche', 'aday.c.gerekce': 'Kurgusal örnek: eğitim ve gönüllü desteği.',
        'aday.d.irtibat': 'evet', 'belge.var': 'evet', 'belge.adet': '2', 'belge.iletilebilir': 'evet',
        'gorus': 'Bu bilgiler yalnız ön yüzü incelemek için oluşturulmuş kurgusal örneklerdir.',
      };
      Object.entries(ornek).forEach(([ad, deger]) => yaz(ad, deger));
      for (const gizli of [false, true]) {
        form.querySelector<HTMLButtonElement>('[data-kisi-ekle]')?.click();
        const satir = Array.from(form.querySelectorAll<HTMLElement>('[data-kisi]')).at(-1);
        if (!satir) continue;
        const k = `kisiler.${satir.dataset.kisi}`;
        yaz(`${k}.gizli`, gizli);
        if (gizli) yaz(`${k}.kod`, 'M-DEMO-01');
        else { yaz(`${k}.ad`, 'Kurgusal Kişi'); yaz(`${k}.eposta`, 'kisi@example.test'); }
        yaz(`${k}.cinsiyet`, gizli ? 'kadin' : 'erkek'); yaz(`${k}.dil`, 'fr');
        yaz(`${k}.ihtidaYili`, '2026'); yaz(`${k}.belge`, 'aldi');
      }
      const duyuru = form.querySelector<HTMLElement>('[data-ornek-duyuru]');
      if (duyuru) duyuru.textContent = 'Kurgusal örnek dolduruldu. İzin kutuları otomatik işaretlenmez; örnek gönderim için onları ayrıca işaretleyiniz.';
      const tumu = form.querySelector<HTMLButtonElement>('[data-adim-tumu]');
      if (tumu?.getAttribute('aria-pressed') !== 'true') tumu?.click();
      form.querySelector<HTMLElement>('#env-ad')?.focus({ preventScroll: true });
    });
  }
}

export function envanterSayfasiniBaslat() {
  const kok = document.querySelector<HTMLElement>('[data-envanter]');
  if (!kok || kok.dataset.kuruldu) return;
  kok.dataset.kuruldu = '1';
  const yukleniyor = kok.querySelector<HTMLElement>('[data-durum-yukleniyor]');
  const kapali = kok.querySelector<HTMLElement>('[data-durum-kapali]');
  const kapaliGoster = () => {
    if (yukleniyor) yukleniyor.hidden = true;
    if (kapali) kapali.hidden = false;
  };
  const durum = kok.dataset.onizleme === 'true'
    ? Promise.resolve({ acik: true, veriSorumlusu: 'Ulu Camii Derneği (örnek senaryo)', kapanis: null })
    : durumAl(kok.dataset.uc || '');
  void durum.then((durum) => {
    if (!durum.acik) { kapaliGoster(); return; }
    try {
      formuKur(kok, durum);
      if (yukleniyor) yukleniyor.hidden = true;
    } catch (hata) {
      console.error(hata);
      kok.querySelector('[data-form-yeri]')?.replaceChildren();
      kapaliGoster();
    }
  });
}
