/**
 * Hoca ekranı — iki adımlı doğrulama arayüzü (12 Kasım 2026): (1) girişte 6 haneli kod sınaması, (2) Hesap sekmesinde aç/kapat bölümü.
 * Mantık src/lib/hoca-mfa.ts'te; metinler src/i18n/hoca-metin/mfa.ts (5 dil). Bu özellik İSTEMCİDE ve İSTEĞE BAĞLIDIR:
 * hesapta kayıtlı faktör yoksa giriş eskisi gibidir; kurallarda zorlama yoktur (docs/HOCA-IKINCI-DOGRULAMA.md).
 * Gizli anahtar ve kodlar yalnız bellekte ve ekrandadır: günlüğe, Firestore'a, localStorage'a yazılmaz; kare kod yerelde çizilir.
 * CSP (egitim): satır içi stil / data: görseli yok; kare kod satır içi SVG'dir (src/lib/ezber/kare-kod.ts).
 */
import type * as FirebaseAuth from 'firebase/auth';
import { kareKodSvg, type KareKodMatrisi } from '../lib/ezber/kare-kod';
import {
  KOD_DESENI, kodTemizle, mfaHataTuru, kayitliFaktorler, kayitBaslat, faktorKaldir,
  type AuthModulu, type GirisCozumleyici, type KayitTaslagi, type KayitliFaktor, type MfaHataTuru,
} from '../lib/hoca-mfa';
import { tM as t } from '../i18n/hoca-metin/mfa';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const HATA_METNI: Record<Exclude<MfaHataTuru, 'genel'>, Parameters<typeof t>[0]> = {
  kod: 'mfa.hataKod', yenidenGiris: 'mfa.hataYenidenGiris', eposta: 'mfa.hataEposta', kapali: 'mfa.hataKapali',
  oturum: 'mfa.hataOturum', sure: 'mfa.hataSure', yogun: 'mfa.hataYogun', ag: 'mfa.hataAg',
};
/** Hata iletisi: bilinen türler çevrilmiş açıklama; bilinmeyen yalnız Firebase hata KODUNU gösterir (ileti metni değil). */
export function mfaHataMetni(e: unknown): string {
  const tur = mfaHataTuru(e);
  return tur === 'genel' ? t('mfa.hataGenel', { ayrinti: (e as { code?: string } | null)?.code || 'hata' }) : t(HATA_METNI[tur]);
}

const mesgul = (b: HTMLButtonElement, d: boolean) => { b.disabled = d; if (d) b.dataset.mesgul = '1'; else delete b.dataset.mesgul; };
const kodAlani = (govde: string, id: string) => `<label>${govde}<input type="text" name="kod" id="${id}" inputmode="numeric" pattern="[0-9 ]*" autocomplete="one-time-code" maxlength="10" required aria-describedby="${id}-mesaj"></label>`;
type IletiTuru = 'hata' | 'basari' | 'bilgi'; // bilgi: yansız görünüm (başarı ya da hata biçimi taşımaz)
const iletiSinifi = (tur?: IletiTuru) => 'not' + (tur === 'hata' || tur === 'basari' ? ' ' + tur : '');
/** İletiyi yazar; aynı formdaki kod girdisine hata varken aria-invalid koyar, ileti silinince kaldırır. */
const mesajYaz = (p: HTMLElement | null, metin: string, tur: IletiTuru = 'hata') => {
  if (!p) return; p.textContent = metin; p.className = iletiSinifi(tur); p.hidden = !metin;
  const g = p.closest('form')?.querySelector<HTMLInputElement>('input[name=kod]');
  if (g) { if (metin && tur === 'hata') g.setAttribute('aria-invalid', 'true'); else g.removeAttribute('aria-invalid'); }
};
/** Yazmaya başlanınca (düzeltilince) aria-invalid kalkar. */
const duzeltinceTemizle = (g: HTMLInputElement) => g.addEventListener('input', () => g.removeAttribute('aria-invalid'));

/* ---------------------------------------------------------------- giriş sınaması */
export type KodEkraniSecenek = {
  /** `girisCozumleyici()` çıktısı; null: hesapta desteklenen ikinci adım yok. */
  cozumleyici: GirisCozumleyici | null;
  /** Giriş tamamlanınca (hoca ekranını yükler). */
  devam: (user: { uid: string }) => Promise<void>;
  /** «Girişe dön»; ileti verilirse (ikinci adım oturumu doldu) giriş ekranında yansız bilgi olarak görünür. */
  geri: (ileti?: string) => void;
  /** Kod doğru girildi ama ekran yüklenemedi: hoca ekranının mevcut yükleme hatası yolu (kod hatası olarak gösterilmez). */
  yuklemeHatasi: (e: unknown) => void;
};

/** Şifre (ya da e-posta bağlantısı) doğrulandıktan sonra 6 haneli kodu isteyen küçük adım. `kok` içeriğini değiştirir. */
export function mfaKodEkrani(kok: HTMLElement, o: KodEkraniSecenek): void {
  if (!o.cozumleyici) {
    kok.innerHTML = `<div class="kutu ps-form-dar" data-mfa-giris><h2>${t('mfa.giris.baslik')}</h2><p class="not hata" role="alert">${t('mfa.giris.destek')}</p>
      <div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-mfa-geri>${t('mfa.giris.geri')}</button></div></div>`;
    kok.querySelector('[data-mfa-geri]')?.addEventListener('click', () => o.geri(), { once: true });
    return;
  }
  const coz = o.cozumleyici;
  kok.innerHTML = `<form class="kutu ps-form-dar" data-mfa-giris novalidate aria-labelledby="mfa-giris-baslik">
      <h2 id="mfa-giris-baslik">${t('mfa.giris.baslik')}</h2><p class="kucuk">${t('mfa.giris.aciklama')}</p>
      ${kodAlani(t('mfa.kod'), 'mfa-giris-kod')}
      <p id="mfa-giris-kod-mesaj" data-mesaj hidden class="not" role="alert"></p>
      <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${t('mfa.giris.dogrula')}</button><button type="button" class="dugme dugme-ikincil" data-mfa-geri>${t('mfa.giris.geri')}</button></div>
    </form>`;
  const form = kok.querySelector<HTMLFormElement>('form[data-mfa-giris]')!;
  const girdi = form.querySelector<HTMLInputElement>('input[name=kod]')!;
  const mesaj = form.querySelector<HTMLElement>('[data-mesaj]');
  form.querySelector('[data-mfa-geri]')?.addEventListener('click', () => o.geri(), { once: true });
  duzeltinceTemizle(girdi);
  girdi.focus();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const kod = kodTemizle(girdi.value);
    if (!KOD_DESENI.test(kod)) { mesajYaz(mesaj, t('mfa.hataBicim')); girdi.focus(); return; }
    const dugmeler = form.querySelectorAll<HTMLButtonElement>('button'); dugmeler.forEach((b) => mesgul(b, true));
    mesajYaz(mesaj, '');
    try {
      let kb: { user: { uid: string } };
      try { kb = await coz.coz(kod); }
      catch (e) { // yalnız kod/ikinci adım hataları burada; yükleme hatası aşağıda ayrı
        if (!form.isConnected) return;
        if (mfaHataTuru(e) === 'sure') { o.geri(mfaHataMetni(e)); return; } // oturum doldu: kod yazdırmak boşuna, girişe dön
        mesajYaz(mesaj, mfaHataMetni(e));
        girdi.value = ''; girdi.focus();
        return;
      }
      try { await o.devam(kb.user); } catch (e) { if (form.isConnected) o.yuklemeHatasi(e); } // kod doğruydu: yanlış-kod iletisi gösterilmez
    } finally {
      if (form.isConnected) dugmeler.forEach((b) => mesgul(b, false));
    }
  });
}

/* ---------------------------------------------------------------- Hesap sekmesi bölümü */
export type HesapBolumuSecenek = {
  /** Firebase Auth modülü (`import * as auth from 'firebase/auth'`). */
  m: AuthModulu;
  a: FirebaseAuth.Auth;
  /** Oturum güvenlik gereği kapandıysa (ör. son faktör kaldırılınca) giriş ekranına dön; ileti giriş ekranında görünür. */
  oturumKapandi: (ileti: string) => void;
};

let kareKodSozu: Promise<(metin: string) => string> | null = null;
/** otpauth:// adresinden saf vektör kare kod. `qrcode` yalnız burada (bölüm kayıt adımına geçince) yüklenir; adres dışarı gönderilmez. */
function kareKodcu(): Promise<(metin: string) => string> {
  kareKodSozu ||= import('qrcode').then((m) => {
    const q = ((m as { default?: unknown }).default ?? m) as { create(t: string, o: { errorCorrectionLevel: string }): { modules: KareKodMatrisi } };
    return (adres: string) => kareKodSvg(q.create(adres, { errorCorrectionLevel: 'M' }).modules, 'mfa-kare');
  }).catch((e: unknown) => { kareKodSozu = null; throw e; });
  return kareKodSozu;
}

/** Gizli anahtarı 4'lü öbeklerle gösterir (okunur); kopyalanınca boşluklar uygulamada sorun çıkarmaz. */
const anahtarYaz = (s: string) => s.replace(/(.{4})/g, '$1 ').trim();

/**
 * Hesap sekmesindeki ilk bölümün (`panel`) ardına «İki adımlı doğrulama» bölümünü ekler. Auth modülü çoklu faktör yüzeyini
 * vermiyorsa ya da kayıtlı faktörler okunamıyorsa hiçbir şey eklemez (sayfa eskisi gibi kalır).
 */
let sonBolum: { bolum: HTMLElement; uid: string; kayitta: () => boolean } | null = null;
export function mfaHesapBolumu(panel: HTMLElement, o: HesapBolumuSecenek): void {
  const kullanici = o.a.currentUser;
  if (!kullanici) return;
  let faktorler: KayitliFaktor[];
  try { faktorler = kayitliFaktorler(o.m, kullanici); } catch { return; }

  /* Yarım kalan kayıt (Hesap sekmesi yeniden çizilince bölüm sıfırlanır): gizli anahtar bilerek bellekte TUTULMAZ; sessizce yutulmasın diye
     bir sonraki bölüm açılışında açıkça bildirilir. */
  const onceki = sonBolum;
  const yarimKaldi = !!onceki && !onceki.bolum.isConnected && onceki.kayitta() && onceki.uid === kullanici.uid;

  const bolum = document.createElement('section');
  bolum.className = 'bolum';
  bolum.setAttribute('data-mfa', '');
  panel.insertAdjacentElement('afterend', bolum);

  type Evre = 'ozet' | 'kaldirOnay' | 'hazirlaniyor' | 'kayit';
  let evre: Evre = 'ozet';
  let taslak: KayitTaslagi | null = null;
  let kareKod = '';
  let ileti: { metin: string; tur: IletiTuru } | null = null;
  let isNo = 0; // eski (iptal edilmiş) isteklerin ekranı bozmaması için
  sonBolum = { bolum, uid: kullanici.uid, kayitta: () => evre === 'kayit' || evre === 'hazirlaniyor' };
  if (yarimKaldi) ileti = { metin: t('mfa.yarimKaldi'), tur: 'bilgi' };

  const ciz = (odak = '') => {
    const iletiHtml = `<p id="mfa-mesaj" data-mesaj class="${iletiSinifi(ileti?.tur)}" role="${ileti?.tur === 'hata' ? 'alert' : 'status'}" ${ileti ? '' : 'hidden'}>${esc(ileti?.metin ?? '')}</p>`;
    let govde = `<h2>${t('mfa.baslik')}</h2><p class="kucuk">${t('mfa.aciklama')}</p>`;
    if (evre === 'kayit' && taslak) {
      govde += `<p>${t('mfa.adim1')}</p>
        ${kareKod ? `<div class="mfa-kare-kap" role="img" aria-label="${esc(t('mfa.karekodEtiket'))}">${kareKod}</div>` : ''}
        <p class="kucuk">${t('mfa.elleGir')}</p>
        <p><span class="kucuk">${t('mfa.anahtar')}:</span> <code class="mfa-anahtar" data-mfa-anahtar translate="no">${esc(anahtarYaz(taslak.anahtar))}</code></p>
        <p class="kucuk"><a href="${esc(taslak.uri)}" data-mfa-baglanti>${t('mfa.baglanti')}</a></p>
        <form data-mfa-kayit class="ps-form-dar-28" novalidate>
          <p>${t('mfa.adim2')}</p>
          ${kodAlani(t('mfa.kod'), 'mfa-kod')}
          ${iletiHtml}
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${t('mfa.ekle')}</button><button type="button" class="dugme dugme-ikincil" data-mfa-vazgec>${t('mfa.vazgec')}</button></div>
        </form>`;
    } else if (evre === 'kaldirOnay') {
      govde += `<p class="kucuk" role="status">${t('mfa.durumAcik', { ad: esc(faktorler.map((f) => f.ad).join(', ')) })}</p>
        <div role="group" aria-labelledby="mfa-kapat-soru"><p id="mfa-kapat-soru" class="not hata">${t('mfa.kapatSor')}</p>${iletiHtml}
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-mfa-kapat-onay>${t('mfa.kapatOnay')}</button><button type="button" class="dugme dugme-birincil" data-mfa-vazgec>${t('mfa.vazgec')}</button></div></div>`;
    } else if (evre === 'hazirlaniyor') {
      govde += `<p class="kucuk" role="status">${t('mfa.hazirlaniyor')}</p>`;
    } else {
      const acik = faktorler.length > 0;
      govde += `<p role="status" class="kucuk"><span class="rozet ${acik ? 'var' : ''}">${acik ? t('mfa.durumAcik', { ad: esc(faktorler.map((f) => f.ad).join(', ')) }) : t('mfa.durumKapali')}</span></p>
        ${iletiHtml}
        <div class="satir-dugmeler">${acik
          ? `<button type="button" class="dugme dugme-ikincil" data-mfa-kapat>${t('mfa.kapat')}</button>`
          : `<button type="button" class="dugme dugme-ikincil" data-mfa-ac>${t('mfa.ac')}</button>`}</div>`;
    }
    bolum.innerHTML = govde;
    const kg = bolum.querySelector<HTMLInputElement>('input[name=kod]'); if (kg) duzeltinceTemizle(kg);
    if (ileti?.tur === 'hata') kg?.setAttribute('aria-invalid', 'true');
    if (odak) bolum.querySelector<HTMLElement>(odak)?.focus();
  };

  const bitir = (metin = '', tur: IletiTuru = 'basari') => { evre = 'ozet'; taslak = null; kareKod = ''; ileti = metin ? { metin, tur } : null; };

  bolum.addEventListener('click', async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-mfa-ac],button[data-mfa-kapat],button[data-mfa-kapat-onay],button[data-mfa-vazgec]');
    if (!el || !bolum.contains(el)) return;
    const no = ++isNo;
    if (el.hasAttribute('data-mfa-vazgec')) { bitir(); ciz(faktorler.length ? '[data-mfa-kapat]' : '[data-mfa-ac]'); return; }
    if (el.hasAttribute('data-mfa-kapat')) { ileti = null; evre = 'kaldirOnay'; ciz('[data-mfa-vazgec]'); return; }
    const user = o.a.currentUser;
    if (!user) return;
    if (el.hasAttribute('data-mfa-kapat-onay')) {
      mesgul(el, true);
      try {
        for (const f of faktorler) await faktorKaldir(o.m, user, f.uid);
        faktorler = kayitliFaktorler(o.m, user);
        bitir(t('mfa.kapandi')); ciz('[data-mfa-ac]');
      } catch (e) {
        if (mfaHataTuru(e) === 'oturum') { o.oturumKapandi(mfaHataMetni(e)); return; } // son faktör kalkınca Firebase oturumu kapatabilir
        if (!bolum.isConnected) return;
        ileti = { metin: mfaHataMetni(e), tur: 'hata' }; ciz('[data-mfa-vazgec]');
      }
      return;
    }
    /* aç: gizli anahtar üret (SDK: getSession → generateSecret), kare kodu yerelde çiz */
    ileti = null; evre = 'hazirlaniyor'; ciz();
    try {
      const t1 = await kayitBaslat(o.m, user);
      let kk = '';
      try { kk = (await kareKodcu())(t1.uri); } catch { /* kare kod çizilemedi: yalnız anahtar + bağlantı gösterilir */ }
      if (no !== isNo || !bolum.isConnected) return;
      taslak = t1; kareKod = kk; evre = 'kayit'; ciz('#mfa-kod');
    } catch (e) {
      if (no !== isNo || !bolum.isConnected) return;
      bitir(mfaHataMetni(e), 'hata'); ciz('[data-mfa-ac]');
    }
  });

  bolum.addEventListener('submit', async (ev) => {
    const form = (ev.target as HTMLElement).closest<HTMLFormElement>('form[data-mfa-kayit]');
    if (!form || !taslak) return;
    ev.preventDefault();
    const girdi = form.querySelector<HTMLInputElement>('input[name=kod]')!;
    const kod = kodTemizle(girdi.value);
    const mesaj = form.querySelector<HTMLElement>('[data-mesaj]');
    if (!KOD_DESENI.test(kod)) { mesajYaz(mesaj, t('mfa.hataBicim')); girdi.focus(); return; }
    const user = o.a.currentUser;
    if (!user) return;
    const dugmeler = form.querySelectorAll<HTMLButtonElement>('button'); dugmeler.forEach((b) => mesgul(b, true));
    mesajYaz(mesaj, '');
    try {
      await taslak.bitir(kod);
      faktorler = kayitliFaktorler(o.m, user);
      bitir(t('mfa.acildi')); ciz('[data-mfa-kapat]');
    } catch (e) {
      if (!form.isConnected) return;
      mesajYaz(mesaj, mfaHataMetni(e));
      if (mfaHataTuru(e) === 'kod') { girdi.value = ''; girdi.focus(); }
    } finally {
      if (form.isConnected) dugmeler.forEach((b) => mesgul(b, false));
    }
  });

  ciz();
}
