/**
 * İlim Yolu hesapları — hoca ekranı «İlim Yolu» sekmesi (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Ortak kararlar» 4).
 * Hoca burada öğrenciye çocuk hesabı açar, kare kodlu kart basar ya da yeniler (kayıp kart iptali), şifreyi yeniler,
 * bütün oturumları kapatır ve yetişkin öğrenciye bağlama kodu verir. Sunucu: Cloud Functions callable'ları (europe-west1);
 * `firebase/functions` ve `qrcode` yalnız bu sekme açılınca (kare kod: yalnız baskıda) yüklenir, hoca ekranının ilk paketi büyümez.
 *
 * GİZLİLİK (kalıcı): şifre, kart adresi ve bağlama kodu yalnız bu sayfanın belleğinde, gösterildikleri pencere ya da baskı
 * görünümü açıkken yaşar. localStorage/sessionStorage/IndexedDB'ye, konsola ya da Firestore'a yazılmaz; pencere kapanınca
 * DOM'dan silinir. Kart adresi hemen kare koda çevrilir, metin olarak tutulmaz ve kartta yazılmaz (sır adresin içindedir).
 * Kartta öğrencinin adı soyadı yazar (Rıdvan'ın kararı); ad soyad yalnız baskıda kullanılır, sunucuya gönderilmez.
 * Kart adresi yalnız `cocukHesabiAc` ve `kartYenile` yanıtında gelir: var olan hesabın kartını basmak, kartı yenilemek demektir
 * (eski kart geçersiz olur; hoca bunu onay penceresinde görür).
 */
import type { FirebaseApp } from 'firebase/app';
import { kareKodSvg, type KareKodMatrisi } from '../lib/ezber/kare-kod';

export type IlimOgrencisi = { ref: string; ad: string; soyad: string; dil?: string; durum?: string };
/** `ogrenciHesaplariListe` satırı: kayıt varsa hesap vardır; `cocuk` false ise yetişkin kendi hesabını bağlamıştır. */
export type OgrenciHesabi = { ref: string; kullaniciAdi?: string; cocuk: boolean; kartSurum?: number; yetiskinAd?: string; olusturma?: unknown };
export interface IlimYoluSecenek {
  app: FirebaseApp;
  /** Bütün öğrenciler (pasifler dâhil; panel yalnız aktifleri ve hesabı olan pasifleri gösterir). */
  ogrenciler: () => readonly IlimOgrencisi[];
  /** Öğrenci kartındaki «İlim Yolu sekmesinde aç» ile gelen öğrenci: satırı vurgulanır. */
  baslangicRef?: string;
}

const BOLGE = 'europe-west1';
const KART_SAYFA = 8; // A4'e 2 × 4 kart (85 × 55 mm)
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const adSoyad = (o: IlimOgrencisi) => `${o.ad} ${o.soyad}`.trim();

const SIMGE: Record<string, string> = {
  kart: '<rect x="2.5" y="5" width="19" height="14" rx="1.6"/><path d="M6 10h5M6 13.5h3.5"/><path d="M14.5 9.2h4v4h-4z"/>',
  yazici: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/>',
  yenile: '<path d="M20 11.5A8 8 0 0 0 5.6 6.6L4 8.5"/><path d="M4 3.8v4.7h4.7"/><path d="M4 12.5a8 8 0 0 0 14.4 4.9l1.6-1.9"/><path d="M20 20.2v-4.7h-4.7"/>',
  anahtar: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  cikis: '<path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M17 8l4 4-4 4M9.5 12H21"/>',
  bag: '<path d="M9.5 13.5a4 4 0 0 0 5.5 0l3-3a4 4 0 0 0-5.5-5.5l-1 1"/><path d="M14.5 10.5a4 4 0 0 0-5.5 0l-3 3a4 4 0 0 0 5.5 5.5l1-1"/>',
  ekle: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
};
const simge = (ad: string) => `<svg class="simge" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${SIMGE[ad] || ''}</svg>`;
/* Kartın üst şeridi: kilim «göz» baklavaları (saf vektör, baskıda da çıkar; arka plan rengi basılmayabilir). */
const KILIM_SERIT = `<svg class="iy-serit" viewBox="0 0 170 6" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="170" height="6" fill="#134420"/>${
  Array.from({ length: 17 }, (_, i) => `<path d="M${i * 10 + 5} 0.8l3.6 2.2-3.6 2.2-3.6-2.2z" fill="#f7f3ea"/>`).join('')}</svg>`;

/* ───────────── sunucu çağrıları ───────────── */
type Cagirici = <T>(ad: string, veri?: Record<string, unknown>) => Promise<T>;
let cagiriciSozu: Promise<Cagirici> | null = null;
/** Callable çağırıcı: `firebase/functions` ilk çağrıda yüklenir. Kimlik belirteci aynı uygulamanın Auth'undan kendiliğinden eklenir. */
function cagirici(app: FirebaseApp): Promise<Cagirici> {
  cagiriciSozu ||= import('firebase/functions').then((f) => {
    const fns = f.getFunctions(app, BOLGE);
    return async <T,>(ad: string, veri?: Record<string, unknown>) => (await f.httpsCallable<Record<string, unknown> | undefined, T>(fns, ad)(veri)).data;
  }).catch((e: unknown) => { cagiriciSozu = null; throw e; });
  return cagiriciSozu;
}

let kareKodSozu: Promise<(metin: string) => string> | null = null;
/** Kart adresinden saf vektör kare kod (SVG yol; piksel yok). `qrcode` yalnız baskıda yüklenir. */
function kareKodcu(): Promise<(metin: string) => string> {
  kareKodSozu ||= import('qrcode').then((m) => {
    const q = ((m as { default?: unknown }).default ?? m) as { create(t: string, o: { errorCorrectionLevel: string }): { modules: KareKodMatrisi } };
    return (t: string) => kareKodSvg(q.create(t, { errorCorrectionLevel: 'M' }).modules, 'iy-kare');
  }).catch((e: unknown) => { kareKodSozu = null; throw e; });
  return kareKodSozu;
}

const HATA: Record<string, string> = {
  'already-exists': 'Bu öğrencinin zaten bir İlim Yolu hesabı var. Listeyi yenileyin.',
  'not-found': 'Öğrenci ya da hesabı bulunamadı. Listeyi yenileyip yeniden deneyin.',
  'failed-precondition': 'Bu işlem bu öğrenci için şu an yapılamıyor (hesabı yok ya da yetişkin hesabı bağlı olabilir). Listeyi yenileyin.',
  'permission-denied': 'Bu işlem için yetkiniz yok. Hoca hesabıyla girdiğinizden emin olun.',
  unauthenticated: 'Oturumunuz sona ermiş. Çıkış yapıp yeniden girin.',
  'resource-exhausted': 'Çok sık deneme yapıldı. Birkaç dakika bekleyip yeniden deneyin.',
  'invalid-argument': 'Sunucu isteği kabul etmedi. Sayfayı yenileyip yeniden deneyin.',
  unavailable: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.',
  'deadline-exceeded': 'Sunucu zamanında yanıt vermedi. Biraz sonra yeniden deneyin.',
  // İstemci, ağ kopukluğunu da «internal» olarak bildirir.
  internal: 'Sunucuya ulaşılamadı ya da sunucuda bir sorun oluştu. Bağlantınızı kontrol edip yeniden deneyin; sürerse yöneticiye (info@ulucamii.be) bildirin.',
};
/** Sunucu ya da ağ hatası → sade Türkçe. Hata ayrıntısı ekrana dökülmez (sunucu iletisi İngilizce ve teknik olabilir). */
export function hataMetni(e: unknown): string {
  const kod = String((e as { code?: string })?.code || '').replace(/^functions\//, '');
  if (kod === 'yanit') return 'Sunucudan beklenmeyen bir yanıt geldi. Sayfayı yenileyip yeniden deneyin.';
  return HATA[kod] || 'Beklenmeyen bir hata oldu. Yeniden deneyin; sürerse yöneticiye (info@ulucamii.be) bildirin.';
}
const yanitHatasi = () => Object.assign(new Error('beklenmeyen yanıt'), { code: 'yanit' });
const metinMi = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const kartAdresi = (v: unknown): string => { if (!metinMi(v) || !/^https:\/\/[^\s]+$/.test(v)) throw yanitHatasi(); return v; };

const tarihYaz = (v: unknown) => {
  const t = v as { toDate?: () => Date; seconds?: number; _seconds?: number } | string | number | undefined;
  const ms = typeof t === 'number' ? t : typeof t === 'string' ? Date.parse(t) : t?.toDate ? t.toDate().getTime() : (t?.seconds ?? t?._seconds ?? NaN) * 1000;
  return Number.isFinite(ms) ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Brussels', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms)) : '';
};

/* ───────────── yazdırma ───────────── */
/**
 * Yazdırma kabı: ekrandaki pencere (dialog) değil, bu kap basılır (üst katmandaki pencereler sayfalara bölünmez).
 * Yazdırma bitince ya da panel kapanınca silinir; içinde kare kod/şifre olduğu için sayfada bekletilmez.
 */
let yazdirmaKabi: HTMLElement | null = null;
function yazdirmaTemizle(): void {
  yazdirmaKabi?.remove(); yazdirmaKabi = null;
  document.documentElement.classList.remove('iy-yazdiriliyor');
}
function yazdir(html: string): void {
  yazdirmaTemizle();
  const kap = document.createElement('div');
  kap.className = 'iy-yazdirma'; kap.lang = 'tr'; kap.setAttribute('aria-hidden', 'true');
  kap.innerHTML = html;
  document.body.append(kap); yazdirmaKabi = kap;
  document.documentElement.classList.add('iy-yazdiriliyor');
  window.addEventListener('afterprint', yazdirmaTemizle, { once: true });
  window.print();
}

type Kart = { ad: string; svg: string };
/** A4 sayfaları: sayfa başına 8 kart (2 × 4), kesim çizgileri kesik çizgi. Kart: ad soyad, «İlim Yolu», kare kod, TR + FR yönerge. */
export function kartSayfalariHtml(kartlar: readonly Kart[]): string {
  const sayfalar: Kart[][] = [];
  for (let i = 0; i < kartlar.length; i += KART_SAYFA) sayfalar.push(kartlar.slice(i, i + KART_SAYFA));
  return sayfalar.map((s, i) => `<div class="iy-sayfa-kutu"><p class="iy-sayfa-etiket">Sayfa ${i + 1} / ${sayfalar.length} · ${s.length} kart</p>
    <div class="iy-sayfa"><div class="iy-izgara">${s.map((k) => `<div class="iy-hucre"><article class="iy-kart">
      ${KILIM_SERIT}
      <div class="iy-kart-govde">
        <div class="iy-kart-sol">
          <p class="iy-marka">İlim Yolu<span lang="fr">Chemin du savoir</span></p>
          <p class="iy-kart-ad">${esc(k.ad)}</p>
          <p class="iy-yonerge">Kare kodu telefonla okut, giriş yap<span lang="fr">Scanne le code pour te connecter</span></p>
        </div>
        <div class="iy-kart-kod">${k.svg}</div>
      </div></article></div>`).join('')}</div></div></div>`).join('');
}

type Fis = { baslik: string; ad: string; satirlar: [string, string][]; yonerge: string; yonergeFr: string; not: string };
const fisHtml = (f: Fis) => `<section class="iy-fis">
  ${KILIM_SERIT}
  <p class="iy-marka">İlim Yolu<span lang="fr">Chemin du savoir</span></p>
  <h1>${esc(f.baslik)}</h1>
  <p class="iy-fis-ad">${esc(f.ad)}</p>
  <dl>${f.satirlar.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  <p>${esc(f.yonerge)}</p><p lang="fr">${esc(f.yonergeFr)}</p>
  <p class="iy-fis-not">${esc(f.not)}</p></section>`;

/* ───────────── panel ───────────── */
export function ilimYoluPaneli(kok: HTMLElement, s: IlimYoluSecenek): { temizle(): void; ayrilabilir(): boolean } {
  const ac = new AbortController();
  let hesaplar: Map<string, OgrenciHesabi> | null = null;
  let listeHatasi = '';
  let islem = ''; // çalışan işlemin adı; doluyken bütün eylem düğmeleri kapalı ve sekme değiştirilemez
  let vurgu = s.baslangicRef || '';
  const secili = new Set<string>();
  const acikPencereler = new Set<HTMLDialogElement>();
  let pencereSayac = 0;
  let canli = true;
  let sonOdak = ''; // son dokunulan denetim: yeniden çizimde ve pencere kapanınca odak oraya döner

  kok.innerHTML = `<div class="iy-ust"><h2>${simge('kart')}İlim Yolu hesapları</h2>
      <button type="button" class="kucuk-dugme" data-iy="yenile" data-odak="yenile">${simge('yenile')}Listeyi yenile</button></div>
    <p class="iy-bilgi">Çocuklara hesabı hoca açar: kullanıcı adı + kısa şifre ve kare kodlu kart. Yetişkin öğrenci kendi hesabını açar ve
      «Bağlama kodu» ile kurs kaydına bağlar. Şifre ve kart yalnız bir kez gösterilir; hiçbir yere kaydedilmez.</p>
    <div data-iy-govde><p class="not" role="status">Hesaplar yükleniyor…</p></div>
    <p class="iy-mesaj" data-iy-mesaj role="status" aria-live="polite" hidden></p>`;
  const govde = kok.querySelector<HTMLElement>('[data-iy-govde]')!;
  const mesajEl = kok.querySelector<HTMLElement>('[data-iy-mesaj]')!;
  const mesaj = (metin: string, tur: 'hata' | 'basari' | '' = '') => {
    mesajEl.textContent = metin; mesajEl.hidden = !metin;
    mesajEl.className = 'iy-mesaj not' + (tur ? ' ' + tur : '');
  };

  const gorunenler = () => s.ogrenciler().filter((o) => o.durum !== 'pasif' || hesaplar?.has(o.ref));
  const cocukMu = (ref: string) => Boolean(hesaplar?.get(ref)?.cocuk);

  const satirHtml = (o: IlimOgrencisi) => {
    const h = hesaplar?.get(o.ref);
    const ad = esc(adSoyad(o));
    const kapali = islem ? ' disabled' : '';
    const dugme = (eylem: string, ikon: string, metin: string, ek = '') =>
      `<button type="button" class="kucuk-dugme${ek}" data-iy="${eylem}" data-ref="${esc(o.ref)}" data-odak="${eylem}-${esc(o.ref)}" aria-label="${esc(metin)} — ${ad}"${kapali}${islem === `${eylem}:${o.ref}` ? ' data-mesgul="1"' : ''}>${simge(ikon)}${esc(metin)}</button>`;
    const durum = !h ? '<span class="rozet">Hesap yok</span>'
      : h.cocuk ? `<span class="rozet var">Çocuk hesabı açık</span>${h.kullaniciAdi ? `<span class="iy-kullanici">@${esc(h.kullaniciAdi)}</span>` : ''}`
        : `<span class="rozet gec">Yetişkin hesabı bağlı</span>${h.kullaniciAdi || h.yetiskinAd ? `<span class="iy-kullanici">@${esc(h.kullaniciAdi || h.yetiskinAd)}</span>` : ''}`;
    const eylemler = !h
      ? dugme('ac', 'ekle', 'Çocuk hesabı aç') + dugme('bag', 'bag', 'Bağlama kodu (yetişkin)')
      : h.cocuk
        ? dugme('bas', 'yazici', 'Kartı bas') + dugme('kartYenile', 'yenile', 'Kartı yenile') + dugme('sifre', 'anahtar', 'Şifreyi yenile') + dugme('oturum', 'cikis', 'Oturumları kapat', ' iy-tehlike')
        : '<span class="kucuk">Öğrenci kendi hesabıyla bağlandı.</span>';
    return `<li class="iy-satir${o.ref === vurgu ? ' secili' : ''}" data-iy-satir="${esc(o.ref)}">
      <div class="iy-kimlik">
        ${h?.cocuk ? `<input type="checkbox" class="iy-sec" data-iy-sec="${esc(o.ref)}" data-odak="sec-${esc(o.ref)}" aria-label="Kart baskısına seç — ${ad}"${secili.has(o.ref) ? ' checked' : ''}${kapali}>` : '<span class="iy-sec-yer" aria-hidden="true"></span>'}
        <span class="iy-ad"><b>${ad}</b>${o.durum === 'pasif' ? ' <span class="rozet">pasif</span>' : ''}<span class="kucuk ogr-ref">${esc(o.ref)}</span></span>
        <span class="iy-durum">${durum}</span>
      </div>
      <div class="iy-eylemler">${eylemler}</div></li>`;
  };

  const ciz = () => {
    if (!canli) return;
    const aktif = document.activeElement as HTMLElement | null;
    const odak = aktif?.closest<HTMLElement>('[data-odak]')?.dataset.odak || (!aktif || aktif === document.body ? sonOdak : '');
    if (!hesaplar) {
      govde.innerHTML = listeHatasi
        ? `<p class="not hata" role="alert">${esc(listeHatasi)}</p><button type="button" class="dugme dugme-ikincil" data-iy="yenile" data-odak="tekrar">Yeniden dene</button>`
        : '<p class="not" role="status">Hesaplar yükleniyor…</p>';
    } else {
      const liste = gorunenler();
      for (const r of [...secili]) if (!cocukMu(r)) secili.delete(r);
      const cocuklar = liste.filter((o) => cocukMu(o.ref));
      const hepsi = cocuklar.length > 0 && cocuklar.every((o) => secili.has(o.ref));
      const say = { yok: liste.filter((o) => !hesaplar!.has(o.ref)).length, cocuk: cocuklar.length, yetiskin: liste.filter((o) => hesaplar!.get(o.ref)?.cocuk === false).length };
      govde.innerHTML = `<p class="iy-ozet"><span><b>${say.cocuk}</b> çocuk hesabı</span><span><b>${say.yetiskin}</b> yetişkin bağlı</span><span><b>${say.yok}</b> hesapsız</span></p>
        <div class="iy-baski-arac">
          <label class="iy-hepsi"><input type="checkbox" data-iy-hepsi data-odak="hepsi"${hepsi ? ' checked' : ''}${!cocuklar.length || islem ? ' disabled' : ''}> Bütün çocuk hesaplarını seç</label>
          <button type="button" class="dugme dugme-birincil" data-iy="topluBas" data-odak="topluBas"${!secili.size || islem ? ' disabled' : ''}${islem === 'topluBas' ? ' data-mesgul="1"' : ''}>${simge('yazici')}Seçilenlerin kartını bas (${secili.size})</button>
          <p class="kucuk">Her A4 sayfaya 8 kart sığar. Basılan her kart yenilenir: öğrencinin eski kartı hemen geçersiz olur.</p>
        </div>
        ${liste.length ? `<ul class="iy-liste">${liste.map(satirHtml).join('')}</ul>` : '<p class="kucuk">Aktif öğrenci yok.</p>'}`;
    }
    if (odak) govde.querySelector<HTMLElement>(`[data-odak="${CSS.escape(odak)}"]`)?.focus();
  };

  const listeYukle = async (): Promise<boolean> => {
    listeHatasi = '';
    try {
      const c = await cagirici(s.app);
      const v = await c<unknown>('ogrenciHesaplariListe');
      if (!Array.isArray(v)) throw yanitHatasi();
      hesaplar = new Map(v.filter((x): x is OgrenciHesabi => Boolean(x) && metinMi((x as OgrenciHesabi).ref)).map((x) => [x.ref, { ...x, cocuk: x.cocuk === true }]));
      return true;
    } catch (e) {
      if (!hesaplar) listeHatasi = `İlim Yolu hesapları alınamadı. ${hataMetni(e)}`;
      else mesaj(`Liste yenilenemedi. ${hataMetni(e)}`, 'hata');
      return false;
    }
  };

  /* ───── pencereler (yerel <dialog>: odak hapsi ve Esc tarayıcıdan; window.confirm kullanılmaz) ───── */
  const pencere = (html: string, sinif = ''): { d: HTMLDialogElement; id: string } => {
    const id = `iy-pencere-${++pencereSayac}`;
    const d = document.createElement('dialog');
    d.className = `iy-dialog portal hoca ${sinif}`.trim(); d.lang = 'tr';
    d.setAttribute('aria-labelledby', `${id}-baslik`);
    d.innerHTML = html.replaceAll('{id}', id);
    document.body.append(d); acikPencereler.add(d);
    d.addEventListener('close', () => {
      acikPencereler.delete(d); d.remove();
      // Pencere açılmadan önceki düğme yeniden çizimle değişmiş olabilir: odak panelde aynı denetime döner.
      const a = document.activeElement;
      if (canli && !acikPencereler.size && (!a || a === document.body) && sonOdak) kok.querySelector<HTMLElement>(`[data-odak="${CSS.escape(sonOdak)}"]`)?.focus();
    }, { once: true });
    d.showModal();
    return { d, id };
  };
  const onayla = (baslik: string, metin: string, evet: string): Promise<boolean> => new Promise((coz) => {
    const { d } = pencere(`<form method="dialog" class="iy-pencere-ic">
      <h2 id="{id}-baslik">${esc(baslik)}</h2><p>${esc(metin)}</p>
      <div class="satir-dugmeler"><button type="submit" value="hayir" class="dugme dugme-ikincil" autofocus>Vazgeç</button>
      <button type="submit" value="evet" class="dugme dugme-birincil" data-iy-onay>${esc(evet)}</button></div></form>`, 'iy-onay');
    d.addEventListener('close', () => coz(d.returnValue === 'evet'), { once: true });
  });

  /** Tek seferlik gizli bilgi penceresi (şifre, bağlama kodu). Kapanınca içerik DOM'dan silinir; bir daha gösterilmez. */
  const gizliGoster = (o: { baslik: string; ad: string; satirlar: [string, string][]; uyari: string; fis: Fis; kart?: () => Promise<void> }) => {
    const { d } = pencere(`<div class="iy-pencere-ic">
      <h2 id="{id}-baslik">${esc(o.baslik)}</h2><p class="iy-pencere-ad">${esc(o.ad)}</p>
      <dl class="iy-gizli">${o.satirlar.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd><code data-iy-gizli>${esc(v)}</code></dd></div>`).join('')}</dl>
      <p class="not iy-uyari" role="note">${esc(o.uyari)}</p>
      <div class="satir-dugmeler">
        <button type="button" class="dugme dugme-ikincil" data-iy-p="yazdir">${simge('yazici')}Yazdır</button>
        ${o.kart ? `<button type="button" class="dugme dugme-ikincil" data-iy-p="kart">${simge('kart')}Kartı bas</button>` : ''}
        <button type="button" class="dugme dugme-birincil" data-iy-p="kapat" autofocus>Kapat</button>
      </div></div>`, 'iy-gizli-pencere');
    d.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-iy-p]');
      if (!b) return;
      if (b.dataset.iyP === 'yazdir') yazdir(fisHtml(o.fis));
      else if (b.dataset.iyP === 'kart') void o.kart?.();
      else { silGizli(); d.close(); }
    });
    // <dialog> 'close' olayı eşzamansız gelir; gizli metin kapatma anında, olayı beklemeden DOM'dan silinir.
    const silGizli = () => d.querySelectorAll('[data-iy-gizli]').forEach((e) => { e.textContent = ''; });
    d.addEventListener('cancel', silGizli);
    d.addEventListener('close', () => { o.satirlar.length = 0; o.fis.satirlar.length = 0; o.kart = undefined; yazdirmaTemizle(); }, { once: true });
  };

  /** Kart baskı görünümü (ekranda önizleme); «Yazdır» aynı sayfaları yazdırma kabına koyar. Kapanınca kartlar silinir. */
  const baskiGoster = (kartlar: Kart[], basarisiz: string[]) => {
    const sayfaSayisi = Math.ceil(kartlar.length / KART_SAYFA);
    const { d } = pencere(`<div class="iy-pencere-ic">
      <div class="iy-onizleme-ust"><h2 id="{id}-baslik">Kart baskısı · ${kartlar.length} kart · ${sayfaSayisi} sayfa</h2>
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-birincil" data-iy-p="yazdir" autofocus>${simge('yazici')}Yazdır</button>
        <button type="button" class="dugme dugme-ikincil" data-iy-p="kapat">Kapat</button></div></div>
      ${basarisiz.length ? `<p class="not hata" role="alert">${esc(basarisiz.length)} kart yenilenemedi; bu öğrencilerin eski kartı geçerli kalır: ${esc(basarisiz.join(' · '))}</p>` : ''}
      <p class="not iy-uyari" role="note">Bu kartların eski kartları artık geçersiz. Kartlar yalnız şimdi basılabilir: pencere kapanınca kart bağlantıları silinir;
        yeniden basmak için kartı yeniden yenilemek gerekir. Yazıcıda ölçek «%100 / gerçek boyut» olsun.</p>
      <div class="iy-sayfalar">${kartSayfalariHtml(kartlar)}</div></div>`, 'iy-onizleme');
    d.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-iy-p]');
      if (!b) return;
      if (b.dataset.iyP === 'yazdir') yazdir(`<div class="iy-sayfalar">${kartSayfalariHtml(kartlar)}</div>`);
      else d.close();
    });
    d.addEventListener('close', () => { kartlar.length = 0; yazdirmaTemizle(); }, { once: true });
  };

  /* ───── eylemler ───── */
  const ogrenci = (ref: string) => s.ogrenciler().find((o) => o.ref === ref);
  /** Bir işlem çalışırken düğmeler kapanır; panel kapandıysa sonuç gösterilmez (sır zaten gösterilmeden düşer). */
  const calistir = async (ad: string, is: () => Promise<void>) => {
    if (islem) return;
    islem = ad; mesaj(''); ciz();
    try { await is(); } catch (e) { if (canli) mesaj(hataMetni(e), 'hata'); } finally { islem = ''; if (canli) ciz(); }
  };
  const kartYenile = async (c: Cagirici, ref: string, kod: (t: string) => string): Promise<Kart> => {
    const o = ogrenci(ref); if (!o) throw Object.assign(new Error('öğrenci yok'), { code: 'not-found' });
    const r = await c<{ kartUrl?: unknown }>('kartYenile', { ref });
    return { ad: adSoyad(o), svg: kod(kartAdresi(r?.kartUrl)) };
  };
  const sifreFisi = (o: IlimOgrencisi, kullaniciAdi: string, sifre: string, baslik: string): Fis => ({
    baslik, ad: adSoyad(o), satirlar: [['Kullanıcı adı', kullaniciAdi], ['Şifre', sifre]],
    yonerge: 'egitim.ulucamii.be adresine gir, kullanıcı adın ve şifrenle giriş yap ya da kartındaki kare kodu telefonla okut.',
    yonergeFr: 'Va sur egitim.ulucamii.be et connecte-toi avec ton nom d’utilisateur et ton mot de passe, ou scanne le code de ta carte.',
    not: 'Bu kâğıdı güvenli bir yerde saklayın. Şifre unutulursa hoca yenisini verir.',
  });

  const eylem = async (ad: string, ref: string) => {
    const o = ogrenci(ref); if (!o) return;
    const isim = adSoyad(o);
    if (ad === 'ac') await calistir(`ac:${ref}`, async () => {
      const c = await cagirici(s.app);
      const dil = DILLER.includes(String(o.dil)) ? String(o.dil) : 'tr';
      const r = await c<{ uid?: unknown; kullaniciAdi?: unknown; sifre?: unknown; kartUrl?: unknown }>('cocukHesabiAc', { ref, dil });
      if (!metinMi(r?.kullaniciAdi) || !metinMi(r?.sifre)) throw yanitHatasi();
      let kartUrl: string | null = metinMi(r.kartUrl) ? r.kartUrl : null;
      let svg = ''; // kart adresi ilk «Kartı bas»ta kare koda çevrilir ve bırakılır; pencere açıkken önizleme yeniden açılabilir
      hesaplar?.set(ref, { ref, kullaniciAdi: r.kullaniciAdi, cocuk: true, kartSurum: 1 });
      if (!canli) return;
      mesaj(`${isim} için çocuk hesabı açıldı: @${r.kullaniciAdi}.`, 'basari');
      gizliGoster({
        baslik: 'Çocuk hesabı açıldı', ad: isim, satirlar: [['Kullanıcı adı', r.kullaniciAdi], ['Şifre', r.sifre]],
        uyari: 'Şifre yalnız şimdi gösterilir; bir daha gösterilmez ve hiçbir yere kaydedilmez. Yazdırın ya da not edin. Kartı da şimdi basın; pencere kapanınca kart bağlantısı silinir (sonra «Kartı bas» kartı yenileyerek basar). Şifre unutulursa «Şifreyi yenile».',
        fis: sifreFisi(o, r.kullaniciAdi, r.sifre, 'Giriş bilgileri'),
        kart: kartUrl ? async () => {
          try { if (!svg) { const kod = await kareKodcu(); svg = kod(kartAdresi(kartUrl)); kartUrl = null; } baskiGoster([{ ad: isim, svg }], []); }
          catch (e) { mesaj(hataMetni(e), 'hata'); }
        } : undefined,
      });
    });
    else if (ad === 'sifre') {
      if (!(await onayla('Şifre yenilensin mi?', `${isim}: eski şifre hemen geçersiz olur. Yeni şifre yalnız bir kez gösterilir. Kart girişi etkilenmez.`, 'Şifreyi yenile'))) return;
      await calistir(`sifre:${ref}`, async () => {
        const c = await cagirici(s.app);
        const r = await c<{ sifre?: unknown }>('cocukSifreYenile', { ref });
        if (!metinMi(r?.sifre)) throw yanitHatasi();
        if (!canli) return;
        const kullaniciAdi = hesaplar?.get(ref)?.kullaniciAdi || '';
        mesaj(`${isim} için yeni şifre oluşturuldu.`, 'basari');
        gizliGoster({
          baslik: 'Yeni şifre', ad: isim, satirlar: [...(kullaniciAdi ? [['Kullanıcı adı', kullaniciAdi] as [string, string]] : []), ['Şifre', r.sifre]],
          uyari: 'Bu şifre yalnız şimdi gösterilir; bir daha gösterilmez ve hiçbir yere kaydedilmez. Yazdırın ya da not edin.',
          fis: sifreFisi(o, kullaniciAdi, r.sifre, 'Yeni giriş bilgileri'),
        });
      });
    } else if (ad === 'oturum') {
      if (!(await onayla('Bütün oturumlar kapatılsın mı?', `${isim}: bütün cihazlardaki girişler kapanır (en geç bir saat içinde). Öğrenci yeniden girmek için kartını ya da şifresini kullanır.`, 'Oturumları kapat'))) return;
      await calistir(`oturum:${ref}`, async () => {
        const c = await cagirici(s.app);
        const r = await c<{ ok?: unknown }>('cocukOturumKapat', { ref });
        if (r?.ok !== true) throw yanitHatasi();
        mesaj(`${isim}: bütün oturumlar kapatıldı.`, 'basari');
      });
    } else if (ad === 'kartYenile') {
      if (!(await onayla('Kart yenilensin mi?', `${isim}: eski kart hemen geçersiz olur (kayıp kart böyle iptal edilir). Yeni kartı hemen basabilirsiniz; şifre değişmez.`, 'Kartı yenile'))) return;
      await calistir(`kartYenile:${ref}`, async () => {
        const [c, kod] = await Promise.all([cagirici(s.app), kareKodcu()]);
        const k = await kartYenile(c, ref, kod);
        if (!canli) return;
        mesaj(`${isim}: eski kart iptal edildi.`, 'basari');
        const { d } = pencere(`<div class="iy-pencere-ic"><h2 id="{id}-baslik">Eski kart iptal edildi</h2><p class="iy-pencere-ad">${esc(isim)}</p>
          <p class="not iy-uyari" role="note">Yeni kartı şimdi basın: pencere kapanınca yeni kartın bağlantısı silinir (gerekirse kartı yeniden yenileyip basarsınız).</p>
          <div class="satir-dugmeler"><button type="button" class="dugme dugme-birincil" data-iy-p="kart" autofocus>${simge('yazici')}Yeni kartı bas</button>
          <button type="button" class="dugme dugme-ikincil" data-iy-p="kapat">Kapat</button></div></div>`, 'iy-gizli-pencere');
        const kartlar = [k];
        d.addEventListener('click', (ev) => {
          const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-iy-p]');
          if (!b) return;
          if (b.dataset.iyP === 'kart' && kartlar.length) { const kopya = [...kartlar]; kartlar.length = 0; d.close(); baskiGoster(kopya, []); }
          else d.close();
        });
        d.addEventListener('close', () => { kartlar.length = 0; }, { once: true });
      });
    } else if (ad === 'bas') {
      if (!(await onayla('Kart basılsın mı?', `${isim}: basmak için kart yenilenir; eski kart geçersiz olur. Şifre değişmez.`, 'Kartı yenile ve bas'))) return;
      await calistir(`bas:${ref}`, async () => {
        const [c, kod] = await Promise.all([cagirici(s.app), kareKodcu()]);
        const k = await kartYenile(c, ref, kod);
        if (canli) baskiGoster([k], []);
      });
    } else if (ad === 'bag') await calistir(`bag:${ref}`, async () => {
      const c = await cagirici(s.app);
      const r = await c<{ kod?: unknown; bitis?: unknown }>('bagKoduUret', { ref });
      if (!metinMi(r?.kod)) throw yanitHatasi();
      if (!canli) return;
      const bitis = tarihYaz(r.bitis);
      const satirlar: [string, string][] = [['Bağlama kodu', r.kod], ...(bitis ? [['Son geçerlilik', bitis] as [string, string]] : [])];
      gizliGoster({
        baslik: 'Bağlama kodu', ad: isim, satirlar: [...satirlar],
        uyari: 'Kod tek kullanımlıktır ve yalnız şimdi gösterilir. Yetişkin öğrenci egitim.ulucamii.be\'de kendi hesabıyla girip bu kodu yazınca hesabı kurs kaydına bağlanır.',
        fis: {
          baslik: 'Kurs kaydını bağlama', ad: isim, satirlar: [...satirlar],
          yonerge: 'egitim.ulucamii.be adresinde kendi hesabınızla giriş yapın ve bu bağlama kodunu yazın. Kod tek kullanımlıktır.',
          yonergeFr: 'Connectez-vous à votre compte sur egitim.ulucamii.be et saisissez ce code de liaison. Le code est à usage unique.',
          not: 'Kodu kimseyle paylaşmayın.',
        },
      });
    });
  };

  const topluBas = async () => {
    const refler = gorunenler().map((o) => o.ref).filter((r) => secili.has(r) && cocukMu(r));
    if (!refler.length) return;
    if (!(await onayla('Kartlar basılsın mı?', `${refler.length} öğrencinin kartı yenilenecek: eski kartlar hemen geçersiz olur. Şifreler değişmez. Kartlar ${Math.ceil(refler.length / KART_SAYFA)} A4 sayfaya basılır.`, 'Kartları yenile ve bas'))) return;
    await calistir('topluBas', async () => {
      const [c, kod] = await Promise.all([cagirici(s.app), kareKodcu()]);
      const kartlar: Kart[] = []; const basarisiz: string[] = [];
      for (const [i, ref] of refler.entries()) {
        if (!canli) return;
        mesaj(`Kartlar yenileniyor: ${i + 1}/${refler.length}…`);
        try { kartlar.push(await kartYenile(c, ref, kod)); }
        catch (e) { const o = ogrenci(ref); basarisiz.push(`${o ? adSoyad(o) : ref} (${hataMetni(e)})`); }
      }
      if (!canli) return;
      secili.clear();
      if (!kartlar.length) { mesaj(`Hiçbir kart yenilenemedi. ${basarisiz.join(' · ')}`, 'hata'); return; }
      mesaj(`${kartlar.length} kart yenilendi${basarisiz.length ? `, ${basarisiz.length} kart yenilenemedi` : ''}.`, basarisiz.length ? 'hata' : 'basari');
      baskiGoster(kartlar, basarisiz);
    });
  };

  kok.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-iy]');
    if (!b || islem || (b as HTMLButtonElement).disabled) return;
    const ad = b.dataset.iy || '';
    sonOdak = b.dataset.odak || '';
    if (ad === 'yenile') { listeHatasi = ''; void calistir('yenile', async () => { if (await listeYukle() && canli) mesaj('Liste yenilendi.', 'basari'); }); return; }
    if (ad === 'topluBas') { void topluBas(); return; }
    if (b.dataset.ref) void eylem(ad, b.dataset.ref);
  }, { signal: ac.signal });
  kok.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement;
    sonOdak = t.dataset.odak || '';
    if (t.matches('[data-iy-sec]')) { const r = t.dataset.iySec!; if (t.checked) secili.add(r); else secili.delete(r); ciz(); }
    else if (t.matches('[data-iy-hepsi]')) { for (const o of gorunenler()) if (cocukMu(o.ref)) { if (t.checked) secili.add(o.ref); else secili.delete(o.ref); } ciz(); }
  }, { signal: ac.signal });

  void (async () => {
    await listeYukle();
    ciz();
    if (vurgu) {
      const satir = govde.querySelector<HTMLElement>(`[data-iy-satir="${CSS.escape(vurgu)}"]`);
      satir?.scrollIntoView({ block: 'center' });
      satir?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
      vurgu = '';
    }
  })();

  return {
    /** Çalışan işlem ya da açık pencere varken (gösterilen şifre, basılmamış kart) sekme değişmez. */
    ayrilabilir: () => !islem && acikPencereler.size === 0,
    temizle: () => {
      canli = false; ac.abort();
      for (const d of [...acikPencereler]) d.close();
      acikPencereler.clear(); secili.clear(); hesaplar = null;
      yazdirmaTemizle();
    },
  };
}
