import { hocaDiliBaslat } from './hoca-dil';
import { hocaOdevi } from './hoca-odev';
import { kitaplarHtml, hocaKitaplari } from './hoca-kitaplari';
import { ETKINLIKLER } from '../lib/ogrenme-icerigi';
import { odevHaftalari, type HaftalikOdev } from '../lib/haftalik-odev';
import { ogrenmeDeposu } from '../lib/ogrenme-bulut';
import type { Tekrar } from '../lib/ogrenme-ilerleme';
import { hocaBulteni } from './hoca-bulten';
import { portalVeliBagi } from '../lib/portal-idare';
import { defterVeliEpostasi } from '../lib/defter-eposta';
import { mazeretKuraliniUygula, MAZERET_KURALI, defterEksikleri, katalogGunleri, type YoklamaGunu, type DefterEksikleri } from '../lib/ders-defteri';
import { ezberDurumuOku, katalogSirasi, kontrolSirasi, type OgeDurumu } from '../lib/ezber/durum';
import { ezberBul } from '../lib/ezber/katalog';
import { BASAMAK_ADLARI } from '../lib/ezber/metinler';
import { hocaDili, hocaYerel } from '../i18n/hoca';
import { tE as t } from '../i18n/hoca-metin/ekran';
import { tc } from '../i18n/hoca-metin/cekirdek';
/**
 * Hoca ekranı tarayıcı uygulaması (6 Eyl 2026) — yalnız Türkçe. Firebase Auth + Firestore (lite), sunucu yok.
 * Yetki: hocalar/{uid} belgesi (firebase/firestore.rules → hoca()). Bu ekran veli portalının (veli-portali.ts) veri
 * modelini besler: yoklama/{ref}_{tarih}, ilerleme/{ref}, degerlendirme, notlar, odevler/{tarih}, duyurular, bildirimler.
 * Kişisel veri en azda tutulur (ad, soyad, veli e-postası, dil); kimlik numarası, adres, fotoğraf asla girilmez.
 */
import { temizleHtml, metniSadelestir, zenginMi } from '../lib/zengin-metin';
import { portalTercihleri } from '../lib/portal-tercihleri';
import { mfaGerekli, girisCozumleyici } from '../lib/hoca-mfa'; // 12 Kasım 2026: isteğe bağlı iki adımlı doğrulama (TOTP); arayüz ./hoca-mfa tembel yüklenir

type Ders = { no: number; kod: string; alan: string; konu: string; ezber: string[] };
type PlanGun = { tarih: string; hafta: number; gun: string; dersler: Ders[] };
import { makineCevirici, adGizleyici } from '../lib/ceviri-servisi';
/** Çalışan düğme: devre dışı + data-mesgul (bekleme imleci yalnız burada; bitmiş durum düğmeleri yalnız disabled). */
const mesgulYap = (b: HTMLButtonElement, d: boolean) => { b.disabled = d; if (d) b.dataset.mesgul = '1'; else delete b.dataset.mesgul; };
type Veri = { donem: string; gunler: PlanGun[]; materyalGunleri: string[]; materyalYolu: string; veliYollari: Record<string, string>; ceviriUcu?: string };
type Ogr = { ref: string; ad: string; soyad: string; veliler?: string[]; dil?: string; durum?: string; grup?: string; kayitRef?: string };
type Aile = { eposta: string; ogrenciler: string[]; dil?: string; iletisimDili?: string; adSoyad?: string; sifreVar?: boolean; sonGiris?: string;
  /* Veli portalındaki «Ders kitabı ve materyal» kartının yanıtı: öğrenci ref'i → {secim, zaman} */
  kitapSecim?: Record<string, { secim: string; zaman: string }> };
type Yok = { ref: string; tarih: string; dersler?: Record<string, string>; durum?: string; not?: string; veliMazereti?: string[] };
type Ilerleme = { kuranAdim?: number; ezber?: Record<string, string>; alanlar?: Record<string, number>; hocaNotu?: string; guncelleme?: string; rozet?: string };
type Kayit = Record<string, unknown> & { id: string };

const ALANLAR: Record<string, string> = { kuran: t('alan.kuran'), itikat: t('alan.itikat'), ibadet: t('alan.ibadet'), siyer: t('alan.siyer'), ahlak: t('alan.ahlak'), genel: t('alan.genel') };
const DURUMLAR: Record<string, string> = { var: t('durum.var'), yok: t('durum.yok'), mazeret: t('durum.mazeret'), gec: t('durum.gec') };
const DERECE: Record<string, string> = { '0': '—', '1': t('derece.1'), '2': t('derece.2'), '3': t('derece.3'), '4': t('derece.4'), '5': t('derece.5') }; // kurs yoklama-değerlendirme şablonuyla aynı ölçek (1 = zayıf … 5 = çok iyi)
const OLCUTLER = ['Mahreç', 'Hareke / Med', 'Tecvid', 'Akıcılık', 'Ezber', 'Harf tanıma', 'Hece okuma', 'Dua / sure ezberi'];
const TUR: Record<string, string> = { mazeret: t('tur.mazeret'), iletisim: t('tur.iletisim'), soru: t('tur.soru') };
const KITAP_ADI: Record<string, string> = { var: t('kitap.var'), satin: t('kitap.satin'), fotokopi: t('kitap.fotokopi') };
const DIL_ADI: Record<string, string> = { tr: t('dilad.tr'), fr: t('dilad.fr'), en: t('dilad.en') };
/** Veli mazereti kuralı iletisi: Türkçe metin kaynağı src/lib/ders-defteri.ts (paylaşılan); diğer diller sözlükten. */
const mazeretKurali = () => (hocaDili() === 'tr' ? MAZERET_KURALI : t('yk.mazeretKurali'));
const GAS = 'https://script.google.com/macros/s/AKfycbz2cgLbdHmx9ejuk4euzybGbpDro0UAEjzjwl86tMdRtz05Pp5WI1JUZT374y_lb4J8BQ/exec';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
const tarihYaz = (iso: string, sec: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat(hocaYerel(), { timeZone: 'Europe/Brussels', ...sec }).format(new Date(iso.slice(0, 10) + 'T12:00:00')) : '';
const trBuyuk = (s: string) => s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
const trBaslik = (s: string) => s.split(/\s+/).filter(Boolean).map((w) => { const k = w === trBuyuk(w) ? w.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase() : w; return k.charAt(0).replace('i', 'İ').toUpperCase() + k.slice(1); }).join(' ');
const secenekler = (o: Record<string, string>, secili: string) => Object.entries(o).map(([k, v]) => `<option value="${esc(k)}" ${k === secili ? 'selected' : ''}>${esc(v)}</option>`).join('');
const zamanMs = (z: unknown) => { const t = z as { toDate?: () => Date } | string | undefined; return typeof t === 'string' ? Date.parse(t) : t?.toDate ? t.toDate().getTime() : 0; };
const zamanYaz = (z: unknown) => { const ms = zamanMs(z); return ms ? new Intl.DateTimeFormat(hocaYerel(), { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };

/* çizili tek-çizgi ikonlar (currentColor; craft: emoji/glyph değil) */
const SIMGELER: Record<string, string> = {
  takvim: '<rect x="3" y="4.5" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  grafik: '<path d="M4 4v16h16"/><path d="M7.5 14.5l3-3.5 2.5 2 4.5-6"/>',
  yildiz: '<path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8z"/>',
  not: '<path d="M20 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4v3.5L13.5 16H20a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/>',
  duyuru: '<path d="M4 10v4h3l7 4V6l-7 4H4z"/><path d="M17.5 9a3.5 3.5 0 0 1 0 6"/>',
  gonder: '<path d="M21 3L3 10.6l7 2.5L12.5 20 21 3z"/><path d="M10 13.1L21 3"/>',
  ayar: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
  kitap: '<path d="M12 6.5C10.5 5 8 4.6 4 5.1v12.8c4-.5 6.5-.1 8 1.4 1.5-1.5 4-1.9 8-1.4V5.1c-4-.5-6.5-.1-8 1.4z"/><path d="M12 6.5v12.2"/>',
  ogrenci: '<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11.2V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-3.8"/>',
  aile: '<circle cx="9" cy="8.5" r="3"/><path d="M3.8 19c0-2.9 2.3-4.6 5.2-4.6s5.2 1.7 5.2 4.6"/><path d="M15.5 6.2a3 3 0 0 1 .2 5.7M16.8 14.6c2.3.4 3.7 1.9 3.7 4.4"/>',
  kilit: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  zarf: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
  cikis: '<path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M17 8l4 4-4 4M9.5 12H21"/>',
  kalem: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2 4 20z"/><path d="M13.5 6.5l4 4"/>',
  kopyala: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M6 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1"/>',
  geri: '<path d="M9 14L4 9.5 9 5"/><path d="M4 9.5h10a5 5 0 0 1 0 10h-2"/>',
  /* 27 Eyl 2026 — Ezber Kilimi: iç içe baklava (dokuma «göz» motifi). */
  ezber: '<path d="M12 2.8l7.6 9.2-7.6 9.2L4.4 12z"/><path d="M12 8.2l3.1 3.8-3.1 3.8-3.1-3.8z"/>',
  /* 2 Kasım 2026 — İlim Yolu: kare kodlu öğrenci kartı. */
  kart: '<rect x="2.5" y="5" width="19" height="14" rx="1.6"/><path d="M6 10h5M6 13.5h3.5"/><path d="M14.5 9.2h4v4h-4z"/>',
  cevir: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.3-3.7-8.5S9.6 5.8 12 3.5z"/>',
};
const simge = (ad: string) => `<svg class="simge" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${SIMGELER[ad] || ''}</svg>`;
const bosDurum = (ikon: string, metin: string) => `<p class="bos">${simge(ikon)}<span>${esc(metin)}</span></p>`;

export async function hocaEkrani(): Promise<void> {
  const kok = document.getElementById('hoca-ekrani');
  const veriEl = document.getElementById('hoca-veri');
  if (!kok || !veriEl) return;
  hocaDiliBaslat(kok); // 12 Kasım 2026: arayüz dili (tr varsayılan) + dil seçici; metinler src/i18n/hoca-metin/
  const veri = JSON.parse(veriEl.textContent || '{}') as Veri;
  const kuranSirasi = veri.gunler.flatMap((g) => g.dersler.filter((x) => x.kod === 'kuran').map((x) => ({ tarih: g.tarih, konu: x.konu }))).filter((x, i, d) => d.findIndex((y) => y.konu === x.konu) === i); // her Kur'an konusu bir adım (ilk işlendiği gün)
  const haftalar = odevHaftalari(veri.gunler); // Tek kayıt anahtarı: haftanın ilk gerçek ders günü.

  const [{ firebaseUygulamasi }, auth, fs] = await Promise.all([import('../lib/firebase'), import('firebase/auth'), import('firebase/firestore/lite')]);
  const app = firebaseUygulamasi();
  const a = auth.getAuth(app);
  /* 14 Eyl 2026 (Rıdvan): veli dili Fransızca olan öğrencinin defter kaydı Fransızca da saklanır ve bülteni Fransızca
     kurulur (ders-defteri.ts, hoca-bulten.ts). Dil: öğrenci belgesi ya da ailelerinden birinin iletişim dili. */
  const hedefDil = (ref: string): 'fr' | null => {
    if (!S) return null;
    const o = S.ogrenciler.find((x) => x.ref === ref);
    const aile = S.aileler.some((f) => (f.ogrenciler || []).includes(ref) && (f.iletisimDili === 'fr' || f.dil === 'fr'));
    return o?.dil === 'fr' || aile ? 'fr' : null;
  };
  const ceviri = { hedefDil, makine: adGizleyici(() => S ? [...S.ogrenciler.flatMap((o) => [o.ad, o.soyad]), ...S.aileler.map((x) => x.adSoyad || '')] : [])(makineCevirici(veri.ceviriUcu, async () => { const u = a.currentUser; if (!u) throw Error('oturum-yok'); return u.getIdToken(); })) };
  a.languageCode = 'tr';
  const db = fs.getFirestore(app);
  const sayfaAdresi = location.origin + location.pathname;
  const hata = (e: unknown) => { const kod = (e as { code?: string })?.code || ''; return kod ? t('ortak.hata', { ayrinti: kod }) : t('ortak.hata', { ayrinti: String((e as Error)?.message || e) }); };
  const mesaj = (form: HTMLElement | null, metin: string, tur: 'hata' | 'basari' | '' = '') => {
    const p = form?.querySelector<HTMLElement>('[data-mesaj]'); if (!p) { if (metin) ustMesaj(metin, tur); return; }
    p.textContent = metin; p.className = 'not ' + tur; p.hidden = !metin;
  };
  const durumBolge = document.getElementById('hoca-durum');
  let durumZaman = 0;
  const ustMesaj = (metin: string, tur: 'hata' | 'basari' | '' = '') => {
    const el = durumBolge; if (!el) return;
    window.clearTimeout(durumZaman);
    el.className = 'portal-durum' + (tur ? ' ' + tur : '');
    el.textContent = metin; el.hidden = !metin;
    if (metin) durumZaman = window.setTimeout(() => { el.hidden = true; el.textContent = ''; }, 6000);
  };

  /* ---------------------------------------------------------------- giriş */
  let girisNotu = ''; // oturum güvenlik gereği kapandıysa (örn. iki adımlı doğrulama kapatılınca) giriş ekranında gösterilen ileti
  const girisEkrani = (onMesaj = girisNotu) => {
    kok.innerHTML = `${onMesaj ? `<p class="not basari">${esc(onMesaj)}</p>` : ''}
      <div class="giris-izgara">
        <form class="kutu" data-form="giris" novalidate>
          <h2>${t('giris.baslik')}</h2>
          <label>${t('giris.eposta')}<input type="email" name="eposta" required autocomplete="username"></label>
          <label>${t('giris.sifre')}<input type="password" name="sifre" required autocomplete="current-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${t('giris.gir')}</button><button type="button" class="dugme dugme-ikincil" data-eylem="sifremiUnuttum">${t('giris.unuttum')}</button></div>
        </form>
        <form class="kutu" data-form="bag" novalidate>
          <h2>${t('giris.bagBaslik')}</h2>
          <p class="kucuk">${t('giris.bagAciklama', { unuttum: t('giris.unuttum') })}</p>
          <label>${t('giris.eposta')}<input type="email" name="eposta" required autocomplete="username"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${t('giris.bagGonder')}</button></div>
        </form>
      </div>`;
    const kayitli = portalTercihleri.getItem('hocaEposta');
    if (kayitli) kok.querySelectorAll<HTMLInputElement>('input[name=eposta]').forEach((i) => { i.value = kayitli; });
  };
  const bagTamamlaEkrani = () => {
    kok.innerHTML = `<form class="kutu ps-form-dar" data-form="bagTamamla" novalidate>
      <h2>${t('giris.tamamla')}</h2><p class="kucuk">${t('giris.baskaCihaz')}</p>
      <label>${t('giris.eposta')}<input type="email" name="eposta" required autocomplete="username"></label>
      <p data-mesaj hidden class="not"></p>
      <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${t('giris.devam')}</button></div></form>`;
  };
  const sifreEkrani = () => {
    kok.innerHTML = `<form class="kutu ps-form-dar" data-form="sifreBelirle" novalidate>
      <h2>${t('giris.sifreBelirle')}</h2><p class="kucuk">${t('giris.sifreAciklama')}</p>
      <label>${t('giris.sifre')}<input type="password" name="sifre" required minlength="8" autocomplete="new-password"></label>
      <label>${t('giris.sifreTekrar')}<input type="password" name="sifre2" required minlength="8" autocomplete="new-password"></label>
      <p data-mesaj hidden class="not"></p>
      <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${t('ortak.kaydet')}</button><button type="button" class="dugme dugme-ikincil" data-eylem="atla">${t('giris.atla')}</button></div></form>`;
  };

  /* ---------------------------------------------------------------- durum */
  type Durum = {
    uid: string; ad: string; sekme: string; ogrenciler: Ogr[]; aileler: Aile[]; tarih: string; yoklama: YoklamaGunu; eksikler: DefterEksikleri | null;
    evCalismasi?:Record<string,Tekrar>|null; secili: string; ilerleme: Ilerleme | null; degerlendirme: Kayit[]; notlar: Kayit[]; hafta: number; odevler: Kayit[]; duyurular: Kayit[]; bildirimler: Kayit[]; yukleniyor?: boolean;
    /** Seçili ders gününe ait veli mazeretleri (yoklama ekranındaki şerit). */
    gunMazeretleri: Kayit[];
    /** Mazeret kuralının bu açılışta kendiliğinden işaretlediği öğrenciler (kaydedilmeyi bekler). */
    mazeretKuraliDegisen: string[];
    /** Veli mazereti bildirilmiş bütün ders günleri — gün listesinde işaretlenir. */
    mazeretGunleri: string[];
    /** Okunmamış veli bildirimi sayısı (sekme rozeti + günün özeti). */
    okunmamis: number;
    /** Seçili öğrencinin dönem devam özeti: gün sayısı + var/yok/mazeret/gec ders sayıları. */
    devam: Record<string, number> | null;
    /** Seçili öğrencinin ezber durumu (ezberDurum/{ref}; Ezber Kilimi, 27 Eyl 2026). null: okunamadı. */
    ezber: Record<string, OgeDurumu> | null;
  };
  let S: Durum | null = null;
  let bultenTemizle: (()=>void)|undefined;
  let kitaplariTemizle: (()=>void)|undefined;
  let defterPanel: {ayrilabilir:()=>boolean;temizle:()=>void}|undefined;
  let odevPanel: ReturnType<typeof hocaOdevi> | undefined;
  const odevKapat=()=>{odevPanel?.temizle();odevPanel=undefined;};
  let defterOnTarih='';
  let defterYukleme=0;
  let defterOnSecim=''; // öğrenci kartındaki «Ders defterini aç» ile gelen öğrenci (defter paneli açılınca seçili gelir)
  let defterOnEksik=false; // başlıktaki «doldurulmamış defter kaydı» ile gelindi: panel liste görünümüyle açılır
  const defterKapat=()=>{defterYukleme++;defterPanel?.temizle();defterPanel=undefined;};
  /* 27 Eyl 2026 — Ezber Kilimi «Ezber» sekmesi (src/scripts/hoca-ezber.ts): tam Firestore SDK'sı yalnız bu parçada. */
  let ezberPanel: { ayrilabilir: () => boolean; temizle: () => void } | undefined;
  let ezberYukleme = 0;
  let ezberOnSecim = ''; // öğrenci kartındaki «Ezber sekmesinde aç» ile gelen öğrenci
  const ezberKapat = () => { ezberYukleme++; ezberPanel?.temizle(); ezberPanel = undefined; };
  /* 1 Kasım 2026 — Online envanter «Envanter» sekmesi (src/scripts/hoca-envanter.ts). Öğrenci kipi açıkken ayrilabilir() false:
     sekme değişmez, çıkış ve arka plan yeniden çizimi katmanı kapatmaz (yalnız 2 saniyelik basılı tutma çıkarır). */
  let envanterPanel: { ayrilabilir: () => boolean; temizle: () => void } | undefined;
  let envanterYukleme = 0;
  const envanterKapat = () => { envanterYukleme++; envanterPanel?.temizle(); envanterPanel = undefined; };
  const envanterKilitli = () => Boolean(envanterPanel && !envanterPanel.ayrilabilir());
  /* 2 Kasım 2026 — İlim Yolu hesapları «İlim Yolu» sekmesi (src/scripts/hoca-ilim-yolu.ts; firebase/functions yalnız orada).
     İşlem sürerken ya da tek seferlik şifre/kart penceresi açıkken ayrilabilir() false: sekme değişmez, arka plan çizimi kapatmaz. */
  let ilimPanel: { ayrilabilir: () => boolean; temizle: () => void } | undefined;
  let ilimYukleme = 0;
  let ilimOnSecim = ''; // öğrenci kartındaki «İlim Yolu sekmesinde aç» ile gelen öğrenci
  const ilimKapat = () => { ilimYukleme++; ilimPanel?.temizle(); ilimPanel = undefined; };
  const ilimKilitli = () => Boolean(ilimPanel && !ilimPanel.ayrilabilir());
  let duzenlenenDuyuru: string | null = null; // hoca bir duyuruyu düzenliyorsa id'si (yeni duyuru formu düzenleme kipine geçer)
  const col = (ad: string) => fs.collection(db, ad);
  const kayitlar = async (ad: string, ...kosullar: ReturnType<typeof fs.where>[]) => (await fs.getDocs(kosullar.length ? fs.query(col(ad), ...kosullar) : col(ad))).docs.map((x) => ({ id: x.id, ...x.data() } as Kayit));

  const varsayilanTarih = () => { const b = bugunISO(); return veri.gunler.find((g) => g.tarih === b)?.tarih || [...veri.gunler].reverse().find((g) => g.tarih <= b)?.tarih || veri.gunler[0].tarih; };
  const varsayilanHafta = () => { const b = bugunISO(); const bu = veri.gunler.find((g) => g.tarih >= b); return bu ? bu.hafta : haftalar[haftalar.length - 1].hafta; };

  /* Doldurulmamış defterler (14 Eyl 2026): giriş sonrası arka planda hesaplanır, başlıkta sayı + bağlantı olur;
     defter paneli aynı veriyi alır ve her kayıtta geri bildirir. Katalog tembel yüklenir (defter sekmesiyle aynı parça). */
  const heroEksikHtml = () => {
    const e = S?.eksikler;
    if (!e) return `<span data-hero-eksik>${t('hero.eksikHesap')}</span>`;
    if (!e.toplam) return `<span data-hero-eksik>${t('hero.eksikYok')}</span>`;
    return `<button type="button" class="baglanti-dugme" data-defter-eksik data-hero-eksik>${t('hero.eksikVar', { n: e.toplam, gun: e.gunler.filter((g) => g.eksikler.length).length, ogr: e.ogrenciler.length })}</button>`;
  };
  const heroEksikCiz = () => { const el = kok.querySelector<HTMLElement>('[data-hero-eksik]'); if (el) el.outerHTML = heroEksikHtml(); };
  const eksikleriHesapla = async () => {
    const durum = S; if (!durum) return;
    try {
      const katalog = (await import('../data/ders-defteri-2026-2027.json')).default;
      const e = await defterEksikleri(db, durum.ogrenciler.filter((o) => o.durum !== 'pasif').map((o) => o.ref), katalogGunleri(katalog), bugunISO());
      if (S !== durum) return;
      durum.eksikler = e; heroEksikCiz();
    } catch { const el = kok.querySelector<HTMLElement>('[data-hero-eksik]'); if (el && S === durum) el.textContent = t('hero.eksikHata'); }
  };
  const yukle = async (user: { uid: string }) => {
    const h = await fs.getDoc(fs.doc(db, 'hocalar', user.uid));
    if (!h.exists()) { kok.innerHTML = `<p class="not hata">${t('hata.hocaDegil')}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${t('ortak.cikis')}</button>`; return; }
    const [ogr, aile] = await Promise.all([kayitlar('ogrenciler'), kayitlar('aileler')]);
    S = {
      uid: user.uid, ad: String((h.data() as { ad?: string }).ad || ''), sekme: 'yoklama',
      ogrenciler: ogr.map((o) => ({ ...(o as unknown as Ogr), ref: o.id })).sort((x, y) => (x.soyad + x.ad).localeCompare(y.soyad + y.ad, 'tr')),
      aileler: (aile as unknown as Aile[]).map((x) => ({ ...x, eposta: (x as unknown as Kayit).id as string })),
      tarih: varsayilanTarih(), yoklama: {}, eksikler: null, gunMazeretleri: [], mazeretKuraliDegisen: [], mazeretGunleri: [], secili: '', ilerleme: null, degerlendirme: [], notlar: [], hafta: varsayilanHafta(), odevler: [], duyurular: [], bildirimler: [], okunmamis: 0, devam: null, ezber: null,
    };
    /* Kural geçmiş günleri de kapsar: hoca yoklamayı kaydettikten SONRA gelen bir mazeret ancak
       o gün yeniden açılınca işlenir. Bu yüzden mazeret bildirilmiş bütün günler gün listesinde
       işaretlenir — hoca hangi güne dönmesi gerektiğini görür. */
    S!.mazeretGunleri = [...new Set(
      (await kayitlar('bildirimler', fs.where('tur', '==', 'mazeret')).catch(() => [] as Kayit[]))
        .map((b) => String(b.tarih || '')).filter(Boolean),
    )];
    S!.okunmamis = (await kayitlar('bildirimler', fs.where('okundu', '==', false)).catch(() => [] as Kayit[])).length;
    await yoklamaYukle();
    ciz();
    void eksikleriHesapla();
    const bosta = (f: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(() => f(), { timeout: 8000 }) : window.setTimeout(f, 3000));
    bosta(() => { void import('./hoca-ezber').then((m) => m.ezberOnYukle(app)).catch(() => {}); });
  };
  const yoklamaYukle = async () => {
    if (!S) return;
    /* 12 Eyl 2026 — veli mazeretleri yoklama ekranına bağlandı. O güne kadar veli portaldan
       mazeret bildiriyor, bildirim «Veli bildirimleri» sekmesinde okunmamış duruyor, hoca ise
       yoklamada aynı öğrenciyi «Yok» (mazeretsiz) işaretliyordu: 12 Eylül'de üç öğrenci
       (Tahir, Ramazan, Rana Betül) böyle işaretlendi ve defterlerine sitemli notlar düştü. */
    const [k, m] = await Promise.all([
      kayitlar('yoklama', fs.where('tarih', '==', S.tarih)),
      kayitlar('bildirimler', fs.where('tarih', '==', S.tarih)).catch(() => [] as Kayit[]),
    ]);
    if (!S) return;
    S.yoklama = {}; (k as unknown as Yok[]).forEach((y) => { const ders = y.dersler && typeof y.dersler === 'object' ? { ...y.dersler } : (y.durum ? { '1': y.durum, '2': y.durum, '3': y.durum } : {}); S!.yoklama[y.ref] = { dersler: ders, not: y.not || '', veliMazereti: Array.isArray(y.veliMazereti) ? y.veliMazereti : undefined }; });
    S.gunMazeretleri = m.filter((x) => x.tur === 'mazeret').sort((x, y) => zamanMs(y.zaman) - zamanMs(x.zaman));
    /* KALICI KURAL: veli mazereti her zaman kabul edilir (src/lib/ders-defteri.ts). Kural burada,
       gün her açıldığında uygulanır; hoca tıklamak zorunda değil. Yazma yine «Yoklamayı kaydet»le. */
    const gun = veri.gunler.find((x) => x.tarih === S!.tarih);
    const aktifRef = new Set(S.ogrenciler.filter((o) => o.durum !== 'pasif').map((o) => o.ref));
    const sonuc = mazeretKuraliniUygula(
      S.yoklama,
      S.gunMazeretleri.map((x) => String(x.ref || '')).filter((r) => aktifRef.has(r)),
      (gun ? gun.dersler : []).map((d) => String(d.no)),
    );
    S.yoklama = sonuc.yoklama;
    S.mazeretKuraliDegisen = sonuc.degisen;
  };
  let ogrenciIstek=0;
  const ogrenciYukle = async (ref: string) => {
    if (!S) return;
    const istek=++ogrenciIstek;const sahibi=S;
    const [ile, deg, not, ev, yk, ez] = await Promise.all([fs.getDoc(fs.doc(db, 'ilerleme', ref)), kayitlar('degerlendirme', fs.where('ref', '==', ref)), kayitlar('notlar', fs.where('ref', '==', ref)), ogrenmeDeposu(db,ref).oku().catch(()=>null), kayitlar('yoklama', fs.where('ref', '==', ref)).catch(() => [] as Kayit[]),
      fs.getDoc(fs.doc(db, 'ezberDurum', ref)).then((x) => (x.exists() ? ezberDurumuOku(x.data()) : {})).catch(() => null)]);
    if(S!==sahibi||istek!==ogrenciIstek)return;S.evCalismasi=ev;S.ezber=ez;
    /* Devam özeti (14 Eyl 2026): öğrenci kartının başında dönemin yoklama dağılımı — hangi çocuğun devamsızlığı
       birikiyor, hoca ilerleme formuna inmeden görsün. */
    const devam: Record<string, number> = { gun: 0, var: 0, yok: 0, mazeret: 0, gec: 0 };
    for (const y of yk as unknown as Yok[]) { const ders = y.dersler && typeof y.dersler === 'object' ? y.dersler : (y.durum ? { '1': y.durum, '2': y.durum, '3': y.durum } : {}); const v = Object.values(ders).filter(Boolean); if (v.length) devam.gun++; for (const x of v) devam[x] = (devam[x] || 0) + 1; }
    S.devam = devam;
    S.secili = ref; S.ilerleme = ile.exists() ? (ile.data() as Ilerleme) : null;
    S.degerlendirme = deg.sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
    S.notlar = not.sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
  };
  const sekmeYukle = async (ad: string) => {
    if (!S) return;
    if (ad === 'odev') S.odevler = (await kayitlar('odevler')).sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
    if (ad === 'duyuru') S.duyurular = (await kayitlar('duyurular')).sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
    if (ad === 'bildirim') { S.bildirimler = (await kayitlar('bildirimler')).sort((x, y) => zamanMs(y.zaman) - zamanMs(x.zaman)); S.okunmamis = S.bildirimler.filter((b) => !b.okundu).length; }
    if (ad === 'aile') S.aileler = ((await kayitlar('aileler')) as unknown as Aile[]).map((x) => ({ ...x, eposta: (x as unknown as Kayit).id as string }));
  };
  const ogrAdi = (ref: string) => { const o = S?.ogrenciler.find((x) => x.ref === ref); return o ? `${o.ad} ${o.soyad}` : ref; };

  /* ---------------------------------------------------------------- çizim */
  /* Sıra = ders gününün iş akışı (14 Eyl 2026): yoklama → defter → haftalık ödev → veli bildirimleri (rozetli);
     sonra daha seyrek işler. */
  /* 27 Eyl 2026: «Ezber» sekmesi defterden hemen sonra (sınıfta dinleme); eski «Ezber · Ödev» haftalık ödevdir. */
  const SEKMELER: Record<string, string> = { yoklama: t('sekme.yoklama'), defter: t('sekme.defter'), ezber: t('sekme.ezber'), envanter: t('sekme.envanter'), odev: t('sekme.odev'), kitaplar: t('sekme.kitaplar'), bildirim: t('sekme.bildirim'), ogrenci: t('sekme.ogrenci'), ilim: t('sekme.ilim'), bulten: t('sekme.bulten'), duyuru: t('sekme.duyuru'), aile: t('sekme.aile'), hesap: t('sekme.hesap') };
  /** Günün canlı yoklama özeti (14 Eyl 2026): kaç ders işaretli, dağılım, kaç ders boş. */
  const yoklamaOzeti = (gunDersler: Ders[]) => {
    if (!S || !gunDersler.length) return '';
    const aktif = S.ogrenciler.filter((o) => o.durum !== 'pasif');
    const say: Record<string, number> = { var: 0, yok: 0, mazeret: 0, gec: 0 };
    let isaretli = 0; const toplam = aktif.length * gunDersler.length;
    for (const o of aktif) for (const d of gunDersler) { const v = S.yoklama[o.ref]?.dersler[String(d.no)] || ''; if (v) { isaretli++; say[v] = (say[v] || 0) + 1; } }
    const eksik = toplam - isaretli;
    return `<span>${t('yk.ozetIsaretliHtml', { isaretli, toplam })}</span>${Object.entries(DURUMLAR).map(([k, v]) => `<span>${esc(v)} <b>${say[k] || 0}</b></span>`).join('')}${eksik ? `<span class="eksik">${t('yk.ozetIsaretsizHtml', { n: eksik })}</span>` : `<span class="tamam">${t('yk.ozetTamam')}</span>`}`;
  };
  const ciz = () => {
    if (!S || envanterKilitli() || ilimKilitli()) return; /* öğrenci kipi / tek seferlik pencere açıkken arka plan yeniden çizimi kapatmasın */
    bultenTemizle?.();
    kitaplariTemizle?.();
    odevKapat();
    defterKapat();
    ezberKapat(); envanterKapat(); ilimKapat();
    const aktif = S.ogrenciler.filter((o) => o.durum !== 'pasif');
    let govde = '';
    if (S.sekme === 'yoklama') {
      const g = veri.gunler.find((x) => x.tarih === S!.tarih);
      const gunDersler = g ? g.dersler : [];
      govde = `<section class="bolum">
        <h2>${simge('takvim')}${t('sekme.yoklama')}</h2>
        <div class="izgara-2">
          <label>${t('yk.dersGunu')}<select data-yoklama-tarih>${veri.gunler.map((x) => `<option value="${x.tarih}" ${x.tarih === S!.tarih ? 'selected' : ''}>${esc(tarihYaz(x.tarih, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${t('hero.hafta', { n: x.hafta })}${S!.mazeretGunleri.includes(x.tarih) ? ' · ' + t('yk.veliMazereti') : ''}</option>`).join('')}</select></label>
          <div><label>&nbsp;</label><button type="button" class="dugme dugme-ikincil" data-eylem="hepsiVar">${t('yk.hepsiVar')}</button></div>
        </div>
        ${gunDersler.length ? `<p class="kucuk">${gunDersler.map((d) => `<b>${esc(String(d.no))}.</b> ${esc(ALANLAR[d.kod] || d.kod)}: ${esc(d.konu)}`).join(' · ')}</p><p class="kucuk">${t('yk.ipucu', { gec: DURUMLAR.gec, var: DURUMLAR.var })}</p><p class="yk-ozet" data-yk-ozet aria-live="polite">${yoklamaOzeti(gunDersler)}</p>` : `<p class="kucuk">${t('yk.gunYok')}</p>`}
        ${S.yukleniyor ? `<p class="not">${tc('yukleniyor')}</p>` : ''}
        ${!S.yukleniyor && S.gunMazeretleri.length ? `<div class="mazeret-serit" data-mazeret-serit>
          <h3>${simge('zarf')}${t('yk.mazeretBaslik', { n: S.gunMazeretleri.length })}</h3>
          <p class="kucuk"><b>${t('yk.kalici')}</b> ${t('yk.kaliciMetin', { mazeret: DURUMLAR.mazeret, sekme: SEKMELER.bildirim })}</p>
          ${S.mazeretKuraliDegisen.length ? `<p class="mazeret-oto" data-mazeret-oto>${esc(mazeretKurali())} <b>${t('yk.ogrSay', { n: S.mazeretKuraliDegisen.length })}</b> — ${t('yk.kaydedilmedi', { kaydet: t('yk.kaydet') })}</p>` : ''}
          <ul class="liste">${S.gunMazeretleri.map((m) => { const r = String(m.ref || ''); const hepsiMazeret = gunDersler.length > 0 && gunDersler.every((d) => (S!.yoklama[r]?.dersler || {})[String(d.no)] === 'mazeret'); return `<li>
            <div><b>${esc(ogrAdi(r))}</b>${m.okundu ? '' : `<span class="rozet">${t('yk.okunmadi')}</span>`}<span class="kucuk"> · ${esc(zamanYaz(m.zaman))}</span></div>
            <p class="mazeret-metin">${esc(String(m.metin || ''))}</p>
            <button type="button" class="dugme dugme-ikincil" data-mazeret-uygula="${esc(r)}" ${hepsiMazeret ? 'disabled' : ''}>${hepsiMazeret ? t('yk.isaretlendi') : t('yk.gunuIsaretle')}</button>
          </li>`; }).join('')}</ul>
        </div>` : ''}
        <div ${S.yukleniyor ? 'hidden' : ''}>${aktif.map((o) => { const y = S!.yoklama[o.ref] || { dersler: {}, not: '' }; return `<div class="yk-satir">
            <div class="yk-ogr"><b>${esc(o.ad)} ${esc(o.soyad)}</b> ${o.grup ? `<span class="kucuk">${esc(o.grup)}</span>` : ''}</div>
            ${gunDersler.map((d) => { const sr = String(d.no); return `<div class="yk-ders">
              <span class="yk-ders-et"><span class="yk-ders-no">${esc(sr)}</span>${esc(ALANLAR[d.kod] || d.kod)}</span>
              <div class="yk-dugmeler">${Object.entries(DURUMLAR).map(([k, v]) => `<button type="button" class="yk-dugme ${k}" aria-pressed="${y.dersler[sr] === k}" data-yok="${esc(o.ref)}" data-ders="${esc(sr)}" data-durum="${k}" aria-label="${t('yk.dugmeAria', { ad: `${esc(o.ad)} ${esc(o.soyad)}`, no: esc(sr), durum: esc(v) })}">${v}</button>`).join('')}</div>
            </div>`; }).join('')}
            <details class="yk-not"${y.not ? ' open' : ''}><summary>${y.not ? t('yk.gunNotu') : t('yk.gunNotuEkle')}</summary><input type="text" placeholder="${t('yk.notYer')}" data-yok-not="${esc(o.ref)}" value="${esc(y.not)}" maxlength="200" aria-label="${t('yk.notAria', { ad: `${esc(o.ad)} ${esc(o.soyad)}` })}"></details>
          </div>`; }).join('')}</div>
        ${aktif.length ? '' : bosDurum('ogrenci', t('yk.aktifYok'))}
        <div class="satir-dugmeler yk-kaydet"><button type="button" class="dugme dugme-birincil" data-eylem="yoklamaKaydet">${t('yk.kaydet')}</button><span class="kucuk">${t('yk.kayitYazilmaz')}</span></div>
      </section>`;
    } else if (S.sekme === 'ogrenci') {
      const o = S.ogrenciler.find((x) => x.ref === S!.secili);
      const pasifSay = S.ogrenciler.filter((x) => x.durum === 'pasif').length;
      govde = `<section class="bolum"><h2>${simge('ogrenci')}${t('sekme.ogrenci')} <span class="kucuk">(${t('ogr.aktifSay', { n: S.ogrenciler.length - pasifSay })}${pasifSay ? ` · ${t('ogr.pasifSay', { n: pasifSay })}` : ''})</span></h2>
        <ul class="liste ogr-liste">${S.ogrenciler.map((x) => `<li class="${x.ref === S!.secili ? 'secili' : ''}"><button type="button" class="baglanti-dugme buyu ogr-ad" data-ogr="${esc(x.ref)}"${x.ref === S!.secili ? ' aria-current="true"' : ''}><b>${esc(x.ad)} ${esc(x.soyad)}</b></button>${x.grup ? `<span class="rozet grup">${esc(x.grup)}</span>` : ''}<span class="kucuk">${t('ogr.veliSay', { n: (x.veliler || []).length })}</span>${x.durum === 'pasif' ? `<span class="rozet">${t('ogr.pasif')}</span>` : ''}<span class="kucuk ogr-ref">${esc(x.ref)}</span></li>`).join('')}</ul>
        <p class="kucuk ps-ust-06">${t('ogr.ipucu', { sekme: SEKMELER.aile, dugme: t('aile.iceAktar') })}</p></section>`;
      if (o) {
        const ile = S.ilerleme || {};
        /* Ezber özeti (27 Eyl 2026): basamak sayıları + kontrol günü gelenler; dinleme ve düzeltme «Ezber» sekmesinde. */
        const ezberOzeti = (() => {
          const ez = S!.ezber;
          if (ez === null) return `<span>${t('ogr.ezberAlinamadi')}</span>`;
          const say = [0, 0, 0, 0, 0];
          for (const d of Object.values(ez)) say[d.basamak]++;
          const vade = kontrolSirasi(ez, bugunISO()).length;
          if (!say.some(Boolean)) return `<span>${t('ogr.ezberYok')}</span>`;
          return ([1, 2, 3, 4] as const).map((b) => `<span>${esc(BASAMAK_ADLARI[b][hocaDili()])} <b>${say[b]}</b></span>`).join('') + (vade ? `<span class="ogr-ezber-vade">${t('ogr.ezberVadeHtml', { n: vade })}</span>` : '');
        })();
        govde += `<section class="bolum" id="ogrenci-karti">
          <div class="ps-baslik-satir">
            <h2>${simge('ogrenci')}${esc(o.ad)} ${esc(o.soyad)} <span class="kucuk">${esc(o.ref)} · ${esc(DIL_ADI[o.dil || ''] || o.dil || '')}</span></h2>
            <button type="button" class="dugme dugme-ikincil kucuk-dugme" data-eylem="whatsappKarneKopyala" data-ogr="${esc(o.ref)}">
              📱 ${t('ogr.karneKopyala')}
            </button>
          </div>
          <p class="devam-satir" data-devam>${S.devam && S.devam.gun ? `<span>${t('ogr.devamGunHtml', { n: S.devam.gun })}</span>${Object.entries(DURUMLAR).map(([k, v]) => `<span>${esc(v)} <b>${S!.devam![k] || 0}</b></span>`).join('')}` : `<span>${t('ogr.yoklamaYok')}</span>`}<button type="button" class="kucuk-dugme" data-defter-ac="${esc(o.ref)}">${simge('kitap')}${t('ogr.defteriAc')}</button></p>
          <form data-form="ogrenciAyar" class="izgara-3">
            <label>${t('ogr.durum')}<select name="durum">${secenekler({ aktif: t('ogr.durumAktif'), pasif: t('ogr.durumPasif') }, o.durum === 'pasif' ? 'pasif' : 'aktif')}</select></label>
            <label>${t('ogr.grup')}<input type="text" name="grup" value="${esc(o.grup || '')}" maxlength="40"></label>
            <div><label>&nbsp;</label><button type="submit" class="dugme dugme-ikincil">${t('ortak.kaydet')}</button></div>
            <p data-mesaj hidden class="not ps-izgara-tam"></p>
          </form>

          <h3>${simge('aile')}${t('ogr.veliler')}</h3>
          <ul class="liste">${(o.veliler || []).map((e) => `<li><span class="buyu">${esc(e)}</span><button type="button" class="baglanti-dugme" data-veli-sil="${esc(e)}">${t('ogr.kaldir')}</button></li>`).join('') || `<li class="kucuk">${t('ogr.veliYok')}</li>`}</ul>
          <form data-form="veliEkle" class="satir-dugmeler"><input type="email" name="eposta" placeholder="veli@ornek.be" required class="ps-esnek-14"><button type="submit" class="dugme dugme-ikincil">${t('ogr.veliEkle')}</button><p data-mesaj hidden class="not ps-basis-tam"></p></form>

          <section class="bolum" data-ev-calismasi><h3>${t('ogr.evBaslik')}</h3><p class="kucuk">${t('ogr.evAciklama')}</p>
          ${S.evCalismasi===null?`<p class="not hata">${t('ogr.evAlinamadi')}</p>`:Object.keys(S.evCalismasi||{}).length?`<ul class="liste">${Object.entries(S.evCalismasi||{}).sort((a,b)=>b[1].son.localeCompare(a[1].son)).map(([id,r])=>`<li><span class="buyu"><b>${esc(ETKINLIKLER.find(e=>e.id===id)?.baslik[hocaDili()]||id)}</b><br><span class="kucuk">${esc(tarihYaz(r.son))} · ${{destek:t('ogr.ev.destek'),tekrar:t('ogr.ev.tekrar'),rahat:t('ogr.ev.rahat')}[r.cevap]}</span></span></li>`).join('')}</ul>`:`<p class="kucuk">${t('ogr.evYok')}</p>`}</section>
          <h3>${simge('ezber')}${t('sekme.ezber')}</h3>
          <p class="devam-satir" data-ogr-ezber>${ezberOzeti}<button type="button" class="kucuk-dugme" data-ezber-ac="${esc(o.ref)}">${simge('ezber')}${t('ogr.ezberAc')}</button></p>
          <h3>${simge('kart')}${t('ogr.ilimBaslik')}</h3>
          <p class="devam-satir"><span>${t('ogr.ilimAciklama')}</span><button type="button" class="kucuk-dugme" data-ilim-ac="${esc(o.ref)}">${simge('kart')}${t('ogr.ilimAc')}</button></p>
          <h3>${simge('grafik')}${t('ogr.ilerleme')}</h3>
          <form data-form="ilerleme">
            <label>${t('ogr.kuranAdim')}<select name="kuranAdim"><option value="-1">—</option>${kuranSirasi.map((k, i) => `<option value="${i}" ${ile.kuranAdim === i ? 'selected' : ''}>${i + 1}. ${esc(k.konu)} (${esc(tarihYaz(k.tarih, { day: 'numeric', month: 'short' }))})</option>`).join('')}</select></label>
            <label class="ps-ust-1">${t('ogr.alanDeg')} <span class="kucuk">${t('ogr.olcekIpucu')}</span></label>
            <div class="izgara-3">${['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak'].map((k) => `<label>${esc(ALANLAR[k])}<select name="alan:${k}">${secenekler(DERECE, String((ile.alanlar || {})[k] || 0))}</select></label>`).join('')}</div>
            <label class="ps-ust-08">${t('ogr.rozet')} <span class="kucuk">${t('ogr.rozetIpucu')}</span>
              <select name="rozet">
                <option value="">${t('ogr.rozetYok')}</option>
                <option value="yildiz" ${ile.rozet === 'yildiz' ? 'selected' : ''}>⭐ ${t('rozet.yildiz')}</option>
                <option value="ezber" ${ile.rozet === 'ezber' ? 'selected' : ''}>📖 ${esc(t('rozet.ezber'))}</option>
                <option value="ahlak" ${ile.rozet === 'ahlak' ? 'selected' : ''}>🌸 ${t('rozet.ahlak')}</option>
                <option value="gayret" ${ile.rozet === 'gayret' ? 'selected' : ''}>🏆 ${t('rozet.gayret')}</option>
                <option value="devam" ${ile.rozet === 'devam' ? 'selected' : ''}>🏅 ${t('rozet.devam')}</option>
              </select>
            </label>
            <label>${t('ogr.hocaNotu')}<textarea name="hocaNotu" maxlength="1000">${esc(ile.hocaNotu || '')}</textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${t('ogr.ilerlemeKaydet')}</button>${ile.guncelleme ? `<span class="kucuk">${t('ogr.sonGuncelleme', { tarih: esc(tarihYaz(ile.guncelleme)) })}</span>` : ''}</div>
          </form>

          <h3>${simge('yildiz')}${t('ogr.degBaslik')}</h3>
          <ul class="liste">${S.degerlendirme.map((d) => `<li><span class="kucuk">${esc(tarihYaz(String(d.tarih)))}</span><b>${esc(ALANLAR[String(d.alan)] || d.alan)}</b><span class="buyu">${esc(d.olcut || '')}</span><span class="rozet">${esc(DERECE[String(d.derece)] || '')}</span><span class="kucuk">${esc(d.not || '')}</span><button type="button" class="baglanti-dugme" data-sil="degerlendirme" data-id="${esc(d.id)}">${t('ortak.sil')}</button></li>`).join('') || `<li class="kucuk">${t('ogr.degYok')}</li>`}</ul>
          <form data-form="degerlendirme" class="izgara-3">
            <label>${t('ortak.tarih')}<input type="date" name="tarih" value="${bugunISO()}" required></label>
            <label>${t('ogr.alan')}<select name="alan">${secenekler(ALANLAR, 'kuran')}</select></label>
            <label>${t('ogr.derece')}<select name="derece">${secenekler(DERECE, '4')}</select></label>
            <label class="ps-izgara-tam">${t('ogr.olcut')}<input type="text" name="olcut" maxlength="120" list="olcut-listesi" placeholder="${t('ogr.olcutYer')}"><datalist id="olcut-listesi">${OLCUTLER.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></label>
            <label class="ps-izgara-tam">${t('ortak.not')}<input type="text" name="not" maxlength="300"></label>
            <div><button type="submit" class="dugme dugme-ikincil">${t('ogr.degEkle')}</button></div>
            <p data-mesaj hidden class="not ps-izgara-tam"></p>
          </form>

          <h3>${simge('not')}${t('ogr.notlar')}</h3>
          <ul class="liste">${S.notlar.map((n) => `<li><span class="kucuk">${esc(tarihYaz(String(n.tarih)))}</span><span class="buyu ps-satir-koru">${esc(n.metin)}</span><span class="rozet">${n.veliyeGorunur ? t('ogr.veliyeGorunur') : t('ogr.yalnizHoca')}</span><button type="button" class="baglanti-dugme" data-sil="notlar" data-id="${esc(n.id)}">${t('ortak.sil')}</button></li>`).join('') || `<li class="kucuk">${t('ogr.notYok')}</li>`}</ul>
          <form data-form="not">
            <div class="izgara-2"><label>${t('ortak.tarih')}<input type="date" name="tarih" value="${bugunISO()}" required></label><label class="satir ps-ust-19"><input type="checkbox" name="veliyeGorunur" checked> ${t('ogr.veliyeGorunurBuyuk')}</label></div>
            <label>${t('ortak.not')}<textarea name="metin" maxlength="1000" required></textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${t('ogr.notEkle')}</button></div>
          </form>
        </section>`;
      }
    } else if (S.sekme === 'odev') {
      govde = '<section class="bolum hoca-odev" data-hoca-odev></section>';
    } else if (S.sekme === 'duyuru') {
      const duz = duzenlenenDuyuru ? S.duyurular.find((d) => d.id === duzenlenenDuyuru) : null;
      const dBas = (duz?.baslik as Record<string, string>) || {}; const dMet = (duz?.metin as Record<string, string>) || {};
      const za = (ad: string, etiket: string, deger: string, gerekli = false) => `<div class="zengin-alan"><span class="za-et">${etiket}</span>
        <div class="za-arac" role="group" aria-label="${t('duy.bicimlendirme', { etiket })}">
          <button type="button" class="za-b" data-zk="bold" title="${t('duy.kalin')}"><b>B</b></button><button type="button" class="za-b" data-zk="italic" title="${t('duy.italik')}"><i>I</i></button><button type="button" class="za-b" data-zk="underline" title="${t('duy.altiCizili')}"><u>U</u></button>
          <span class="za-ayr"></span>
          <button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#b5452b" title="${t('duy.kiremit')}">A</button><button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#1f5f8b" title="${t('duy.mavi')}">A</button><button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#2f6d3c" title="${t('duy.yesil')}">A</button><button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#24201c" title="${t('duy.varsayilanRenk')}">A</button>
          <span class="za-ayr"></span>
          <button type="button" class="za-b" data-zk="createLink" title="${t('duy.baglantiEkle')}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.5 13.5a4 4 0 0 0 5.5 0l3-3a4 4 0 0 0-5.5-5.5l-1 1"/><path d="M14.5 10.5a4 4 0 0 0-5.5 0l-3 3a4 4 0 0 0 5.5 5.5l1-1"/></svg></button>
          <span class="za-ayr"></span>
          ${['🕌', '📖', '📅', '✅', '⭐', '❗', '🤲', '🎉'].map((e) => `<button type="button" class="za-b za-emoji" data-zk="emoji" data-emoji="${e}" title="${t('duy.ekle')}">${e}</button>`).join('')}
        </div>
        <div class="za-yaz" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${etiket}" data-zengin="${ad}"${gerekli ? ' data-gerekli="1"' : ''}>${zenginMi(deger || '') ? temizleHtml(deger || '') : esc(deger || '').replace(/\n/g, '<br>')}</div>
      </div>`;
      govde = `<section class="bolum"><h2>${simge('duyuru')}${t('sekme.duyuru')}</h2>
        ${S.duyurular.map((d) => { const b = d.baslik as Record<string, string>; const m = d.metin as Record<string, string>; return `<div class="duyuru${d.id === duzenlenenDuyuru ? ' duzenlenen' : ''}"><div class="duyuru-ust"><span class="kucuk">${esc(tarihYaz(String(d.tarih)))}</span> <span class="rozet ${d.yayin ? 'var' : ''}">${d.yayin ? t('duy.yayinda') : t('duy.taslak')}</span><span class="duyuru-eylem"><button type="button" class="baglanti-dugme" data-duyuru-duzelt="${esc(d.id)}">${t('duy.duzenle')}</button> <button type="button" class="baglanti-dugme" data-yayin="duyurular" data-id="${esc(d.id)}" data-deger="${d.yayin ? '0' : '1'}">${d.yayin ? t('duy.yayindanKaldir') : t('duy.yayinla')}</button> <button type="button" class="baglanti-dugme" data-sil="duyurular" data-id="${esc(d.id)}">${t('ortak.sil')}</button></span></div><b>${esc(b?.tr || '')}</b>${b?.fr ? ` <span class="kucuk">· ${esc(b.fr)}</span>` : ''}<p>${esc(zenginMi(m?.tr || '') ? metniSadelestir(m?.tr || '') : (m?.tr || ''))}</p></div>`; }).join('') || `<p class="kucuk">${t('duy.yok')}</p>`}
        <h3>${duz ? simge('kalem') + t('duy.duzenleBaslik') : simge('duyuru') + t('duy.yeni')}</h3>
        <form data-form="duyuru" class="${duz ? 'duzenleme' : ''}">
          ${duz ? `<p class="duzen-not">${simge('kalem')}<span>${t('duy.duzenliyorsunuz')}</span></p>` : ''}
          <label>${t('ortak.tarih')}<input type="date" name="tarih" value="${esc(duz ? String(duz.tarih) : bugunISO())}" required></label>
          <div class="izgara-3"><label>${t('duy.baslikTr')}<input type="text" name="baslikTr" maxlength="120" value="${esc(dBas.tr || '')}" required></label><label>${t('duy.baslikFr')}<input type="text" name="baslikFr" maxlength="120" value="${esc(dBas.fr || '')}"></label><label>${t('duy.baslikEn')}<input type="text" name="baslikEn" maxlength="120" value="${esc(dBas.en || '')}"></label></div>
          <div class="izgara-zengin">${za('metinTr', t('duy.metinTr'), dMet.tr, true)}${za('metinFr', t('duy.metinFr'), dMet.fr)}${za('metinEn', t('duy.metinEn'), dMet.en)}</div>
          <label class="satir"><input type="checkbox" name="yayin" ${duz ? (duz.yayin ? 'checked' : '') : 'checked'}> ${duz ? t('duy.yayindaBuyuk') : t('duy.hemenYayinla')}</label>
          <p class="kucuk">${t('duy.dilIpucu')}</p>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${duz ? t('duy.degisiklikKaydet') : t('duy.kaydet')}</button>${duz ? `<button type="button" class="dugme dugme-ikincil" data-eylem="duyuruVazgec">${t('duy.vazgec')}</button>` : ''}</div>
        </form></section>`;
    } else if (S.sekme === 'bildirim') {
      const turRozet: Record<string, string> = { mazeret: 'mazeret', iletisim: 'var', soru: 'gec' };
      const okunmamis = S.bildirimler.filter((b) => !b.okundu).length;
      govde = `<section class="bolum"><h2>${simge('zarf')}${t('sekme.bildirim')} <span class="kucuk">${t('bil.sayilar', { okunmamis, toplam: S.bildirimler.length })}</span></h2>
        ${S.bildirimler.map((b) => { const y = b.yanit ? String(b.yanit) : ''; return `<article class="bildirim-kart${b.okundu ? ' okundu' : ' yeni'}">
          <div class="bk-ust"><span class="rozet ${turRozet[String(b.tur)] || ''}">${esc(TUR[String(b.tur)] || b.tur)}</span><b class="bk-ogr">${esc(ogrAdi(String(b.ref)))}</b>${b.tarih ? `<span class="rozet">${esc(tarihYaz(String(b.tarih), { weekday: 'short', day: 'numeric', month: 'short' }))}</span>` : ''}${b.okundu ? '' : `<span class="bk-nokta" title="${t('bil.okunmamisTitle')}"></span>`}<span class="kucuk bk-zaman">${esc(zamanYaz(b.zaman))}</span></div>
          <p class="bk-metin">${esc(b.metin)}</p>
          <p class="kucuk bk-eposta">${simge('zarf')}<a href="mailto:${esc(b.eposta)}">${esc(b.eposta)}</a></p>
          ${y ? `<div class="bk-yanit"><span class="bk-yanit-bas">${simge('gonder')}${t('bil.yanitiniz', { zaman: esc(zamanYaz(b.yanitZaman)) })}</span><p>${esc(y)}</p></div>` : ''}
          <div class="bk-yanit-form">
            <textarea aria-label="${t('bil.yanitAria')}" data-yanit-metin="${esc(b.id)}" rows="2" maxlength="1000" placeholder="${y ? t('bil.yanitGuncelleYer') : t('bil.yanitYazYer')}">${esc(y)}</textarea>
            <div class="bk-eylem"><button type="button" class="dugme dugme-birincil" data-yanitla="${esc(b.id)}">${simge('gonder')}${y ? t('bil.yanitGuncelle') : t('bil.yanitla')}</button><button type="button" class="baglanti-dugme" data-okundu="${esc(b.id)}" data-deger="${b.okundu ? '0' : '1'}">${b.okundu ? t('bil.okunmadiYap') : t('bil.okunduIsaretle')}</button><button type="button" class="baglanti-dugme sil-bag" data-sil="bildirimler" data-id="${esc(b.id)}">${t('ortak.sil')}</button></div>
          </div>
        </article>`; }).join('') || bosDurum('zarf', t('bil.yok'))}
      </section>`;
    } else if (S.sekme === 'aile') {
      const kitapSay = { var: 0, satin: 0, fotokopi: 0, yok: 0 };
      for (const f of S.aileler) for (const r of f.ogrenciler || []) {
        const v = (f.kitapSecim || {})[r];
        if (v && v.secim in kitapSay) kitapSay[v.secim as keyof typeof kitapSay]++; else kitapSay.yok++;
      }
      govde = `<section class="bolum"><h2>${simge('aile')}${t('aile.baslik')} <span class="kucuk">(${S.aileler.length})</span></h2>
        <p class="kucuk"><b>${t('aile.kitapBaslik')}</b> ${t('aile.kitapDurumu', { v: kitapSay.var, s: kitapSay.satin, f: kitapSay.fotokopi, y: kitapSay.yok })}</p>
        <p class="kucuk">${t('aile.davetAciklamaHtml', { dugme: t('aile.davetGonder') })}</p>
        <ul class="liste">${S.aileler.map((f) => `<li><span class="buyu"><b>${esc(f.eposta)}</b><br><span class="kucuk">${esc(f.adSoyad || '')} · ${esc(DIL_ADI[f.dil || ''] || f.dil || '')} · ${esc((f.ogrenciler || []).map(ogrAdi).join(', '))}</span></span>
          <span class="rozet">${f.sifreVar ? t('aile.sifreVar') : t('aile.girmedi')}</span>${f.sonGiris ? `<span class="kucuk">${t('aile.sonGiris', { tarih: esc(tarihYaz(f.sonGiris)) })}</span>` : ''}
          <span class="kucuk">${(f.ogrenciler || []).map((r) => { const v = (f.kitapSecim || {})[r]; return `${esc(ogrAdi(r))}: <span class="rozet ${v ? (v.secim === 'var' ? 'ogrendi' : v.secim === 'fotokopi' ? 'gec' : 'mazeret') : ''}">${esc(v ? (KITAP_ADI[v.secim] || v.secim) : t('kitap.yok'))}</span>`; }).join(' · ')}</span>
          <button type="button" class="dugme dugme-ikincil" data-davet="${esc(f.eposta)}" data-dil="${esc(f.iletisimDili || f.dil || '')}">${t('aile.davetGonder')}</button></li>`).join('') || `<li class="kucuk">${t('aile.yok')}</li>`}</ul>
        <p data-ust-mesaj hidden class="not"></p>
        <h3>${t('aile.kayitDefteri')}</h3>
        <p class="kucuk">${t('aile.kayitAciklama')}</p>
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-eylem="iceAktar">${t('aile.iceAktar')}</button></div></section>`;
    } else if (S.sekme === 'envanter') {
      govde = `<section class="bolum env-kok" data-hoca-envanter><p class="not" role="status">${t('panel.envanterHazir')}</p></section>`;
    } else if (S.sekme === 'ezber') {
      govde = `<section class="bolum ez-kok" data-hoca-ezber><p class="not" role="status">${t('panel.ezberHazir')}</p></section>`;
    } else if (S.sekme === 'ilim') {
      govde = `<section class="bolum iy-kok" data-hoca-ilim-yolu><p class="not" role="status">${t('panel.ilimHazir')}</p></section>`;
    } else if (S.sekme === 'defter') {
      govde = `<section class="haftalik-bulten ders-defteri" data-ders-defteri><p role="status">${t('panel.defterHazir')}</p></section>`;
    } else if (S.sekme === 'bulten') {
      govde = '<section class="haftalik-bulten" data-hoca-bulten></section>';
    } else if (S.sekme === 'kitaplar') {
      govde = kitaplarHtml();
    } else if (S.sekme === 'hesap') {
      govde = `<section class="bolum"><h2>${simge('ayar')}${t('sekme.hesap')}</h2><p>${esc(S.ad)} · <span class="kucuk">${esc(a.currentUser?.email || '')}</span></p>
        <form data-form="sifreDegistir" class="ps-form-dar-28"><label>${t('hesap.yeniSifre')}<input type="password" name="sifre" minlength="8" required autocomplete="new-password"></label><p data-mesaj hidden class="not"></p>
        <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${t('hesap.degistir')}</button></div></form>
        <p class="kucuk ps-ust-1">${t('hesap.veliPortali')} <a href="${esc(veri.veliYollari.tr)}">${esc(location.origin + veri.veliYollari.tr)}</a></p></section>`;
    }
    const SEKME_IKON: Record<string, string> = { yoklama: 'takvim', defter: 'kitap', ezber: 'ezber', envanter: 'kitap', kitaplar: 'kitap', ogrenci: 'ogrenci', ilim: 'kart', odev: 'kitap', duyuru: 'duyuru', bildirim: 'zarf', aile: 'aile', hesap: 'ayar' };
    /* Günün özeti (14 Eyl 2026): büyük sayfa başlığı yerine, hocanın ilk bakışta gördüğü şey — bugün (ya da sıradaki)
       ders günü, hafta, üç ders, aktif öğrenci sayısı ve okunmamış veli bildirimi. */
    const gunBilgi = (() => {
      const b = bugunISO();
      const g = veri.gunler.find((x) => x.tarih === b) || veri.gunler.find((x) => x.tarih > b) || veri.gunler[veri.gunler.length - 1];
      if (!g) return '';
      const bugunMu = g.tarih === b;
      return `<div class="hero-gun" data-hero-gun><p class="hg-tarih"><b>${esc(tarihYaz(g.tarih, { weekday: 'long', day: 'numeric', month: 'long' }))}</b> · ${t('hero.hafta', { n: g.hafta })}<span class="rozet ${bugunMu ? 'var' : ''}">${bugunMu ? t('hero.bugun') : t('hero.siradaki')}</span></p>
        <p class="hg-dersler">${g.dersler.map((d) => `<b>${esc(String(d.no))}.</b> ${esc(ALANLAR[d.kod] || d.kod)}: ${esc(d.konu)}`).join(' · ')}</p>
        <p class="hg-sayilar"><span>${t('hero.aktifOgr', { n: aktif.length })}</span>${S!.okunmamis ? `<button type="button" class="baglanti-dugme" data-sekme="bildirim">${t('hero.okunmamis', { n: S!.okunmamis })}</button>` : `<span>${t('hero.okunmamisYok')}</span>`}${heroEksikHtml()}</p></div>`;
    })();
    kok.innerHTML = `<div class="hoca-hero"><div class="hero-serit" aria-hidden="true"></div>
        <div class="hero-ust"><div><p class="etiket etiket-vurgu">${t('hero.etiket', { donem: esc(veri.donem) })}</p><h1 class="hero-baslik">${t('hero.baslik')} <span class="kucuk">· ${esc(S.ad)}</span></h1></div><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${simge('cikis')}${t('ortak.cikis')}</button></div>
        ${gunBilgi}
      </div>
      <div class="sekmeler" role="tablist" aria-label="${t('sekme.bolumler')}">${Object.entries(SEKMELER).map(([k, v]) => `<button type="button" role="tab" id="hoca-tab-${k}" class="sekme" aria-selected="${k === S!.sekme}" aria-controls="hoca-panel" tabindex="${k === S!.sekme ? '0' : '-1'}" data-sekme="${k}">${simge(SEKME_IKON[k] || 'ayar')}<span>${v}</span>${k === 'bildirim' && S!.okunmamis ? `<span class="sekme-sayi"><span class="sr-only">${t('sekme.okunmamis')}</span>${S!.okunmamis}</span>` : ''}</button>`).join('')}</div>
      <div id="hoca-panel" role="tabpanel" aria-labelledby="hoca-tab-${S.sekme}">${govde}</div>`;
    if (S.sekme === 'hesap') { // İki adımlı doğrulama bölümü (12 Kasım 2026): Hesap sekmesinin ilk bölümünün ardına eklenir; Auth çoklu faktör yüzeyi yoksa eklenmez
      const bolum = kok.querySelector<HTMLElement>('#hoca-panel > section.bolum'), durum = S;
      if (bolum) void import('./hoca-mfa').then((m) => { if (S === durum && bolum.isConnected) m.mfaHesapBolumu(bolum, { m: auth, a, oturumKapandi: oturumSonu }); }).catch(() => {});
    }
    const kitapRoot=kok.querySelector<HTMLElement>('[data-hoca-kitaplari]');
    if(kitapRoot) kitaplariTemizle=hocaKitaplari(kitapRoot,async id=>{
      if(!S || !a.currentUser || a.currentUser.uid!==S.uid) throw new Error('hoca-oturumu');
      // Firestore lite getDoc daima sunucudan okur; ayarlar yalnız hocalara açıktır.
      const snapshot=await fs.getDoc(fs.doc(db,'ayarlar','hocaKitaplari'));
      return String(snapshot.data()?.anahtarlar?.[id] ?? '');
    });
    const odevRoot=kok.querySelector<HTMLElement>('[data-hoca-odev]');
    if(odevRoot){
      const durum=S;
      odevPanel=hocaOdevi(odevRoot,{
        gunler:veri.gunler,hafta:S.hafta,bugun:bugunISO(),kayitlar:S.odevler as Partial<HaftalikOdev>[],
        materyalGunleri:veri.materyalGunleri,materyalYolu:veri.materyalYolu,ogrenciler:S.ogrenciler,cevir:ceviri.makine,
        haftaDegisti:h=>{if(S===durum)S.hafta=h;},
        kaydet:async k=>{await fs.setDoc(fs.doc(db,'odevler',k.tarih),{...k,kaydeden:durum.uid});if(S===durum)S.odevler=[...S.odevler.filter(x=>x.tarih!==k.tarih),{id:k.tarih,...k}];},
        sil:async tarih=>{await fs.deleteDoc(fs.doc(db,'odevler',tarih));if(S===durum)S.odevler=S.odevler.filter(x=>x.tarih!==tarih);},
        git:async(ad,deger)=>{
          if(ad==='defter')defterOnTarih=deger||'';
          if(ad==='ogrenci'&&deger)await ogrenciYukle(deger);
          await sekmeyeGec(ad,true);
          kok.querySelector<HTMLElement>('#hoca-tab-'+ad)?.focus();
        },
      });
    }
    const bultenRoot=kok.querySelector<HTMLElement>('[data-hoca-bulten]');
    if(bultenRoot)bultenTemizle=hocaBulteni(bultenRoot,{db,ogrenciler:S.ogrenciler,gunler:veri.gunler,hafta:S.hafta,ceviri,silindi:ref=>{if(S){S.ogrenciler=S.ogrenciler.filter(o=>o.ref!==ref);if(S.secili===ref)S.secili='';}}});
    const defterRoot=kok.querySelector<HTMLElement>('[data-ders-defteri]');
    if(defterRoot){
      const durum=S, yukleme=defterYukleme;
      const ac=async()=>{
        try{
          const [mod,katalog]=await Promise.all([import('./ders-defteri'),import('../data/ders-defteri-2026-2027.json')]);
          if(yukleme!==defterYukleme||S!==durum||!defterRoot.isConnected)return;
          defterPanel=mod.dersDefteri(defterRoot,{db,ogrenciler:durum.ogrenciler,katalog:katalog.default,bugun:new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels'}).format(new Date()),baslangicRef:defterOnSecim,baslangicTarih:defterOnTarih,baslangicEksik:defterOnEksik,eksikler:durum.eksikler,eksikDegisti:(e)=>{durum.eksikler=e;heroEksikCiz();},ceviri,
            /* 27 Eyl 2026 — «Ezber dinlendi»: dinleme defterin gününe yazılır (geçmiş ders sonradan dolduruluyorsa o gün; gelecek gün olmaz). */
            ezberDinle:async(kap,ogrenci,{tarih,...yardim})=>{const m=await import('./hoca-ezber');const bugun=bugunISO();return m.ezberDinlemesi(kap,{app,ogrenci,gunler:veri.gunler,bugun:tarih&&tarih<bugun?tarih:bugun,...yardim});}});
          defterOnSecim='';defterOnTarih='';defterOnEksik=false;
        }catch{
          if(yukleme!==defterYukleme||!defterRoot.isConnected)return;
          defterRoot.innerHTML=`<p role="status">${t('panel.defterHata')}</p><button type="button" data-defter-tekrar>${t('ortak.yenidenDene')}</button>`;
          defterRoot.querySelector('[data-defter-tekrar]')?.addEventListener('click',()=>{void ac();},{once:true});
        }
      };void ac();
    }
    envanterMontaj();
    ilimMontaj();
    const ezberRoot = kok.querySelector<HTMLElement>('[data-hoca-ezber]');
    if (ezberRoot) {
      const durum = S, yukleme = ezberYukleme, baslangicRef = ezberOnSecim;
      ezberOnSecim = '';
      const ac = async () => {
        try {
          const mod = await import('./hoca-ezber');
          if (yukleme !== ezberYukleme || S !== durum || !ezberRoot.isConnected) return;
          ezberPanel = mod.ezberPaneli(ezberRoot, { app, ogrenciler: () => durum.ogrenciler.filter((o) => o.durum !== 'pasif'), yoklama: gununYoklamasi, gunler: veri.gunler, bugun: bugunISO(), baslangicRef: baslangicRef || undefined });
        } catch {
          if (yukleme !== ezberYukleme || !ezberRoot.isConnected) return;
          ezberRoot.innerHTML = `<p class="not hata" role="status">${t('panel.ezberHata')}</p><button type="button" class="dugme dugme-ikincil" data-ezber-tekrar>${t('ortak.yenidenDene')}</button>`;
          ezberRoot.querySelector('[data-ezber-tekrar]')?.addEventListener('click', () => { void ac(); }, { once: true });
        }
      };
      void ac();
    }
  };
  /** Envanter sekmesinin bağlanması: tam SDK'lı panel tembel yüklenir (Ezber ile aynı kalıp). */
  const envanterMontaj = () => {
    const envanterRoot = kok.querySelector<HTMLElement>('[data-hoca-envanter]');
    if (!envanterRoot || !S) return;
    const durum = S, yukleme = envanterYukleme;
    const ac = async () => {
      try {
        const mod = await import('./hoca-envanter');
        if (yukleme !== envanterYukleme || S !== durum || !envanterRoot.isConnected) return;
        envanterPanel = mod.envanterPaneli(envanterRoot, { app, ogrenciler: () => durum.ogrenciler.filter((o) => o.durum !== 'pasif'), bugun: bugunISO(), uid: () => durum.uid });
      } catch {
        if (yukleme !== envanterYukleme || !envanterRoot.isConnected) return;
        envanterRoot.innerHTML = `<p class="not hata" role="status">${t('panel.envanterHata')}</p><button type="button" class="dugme dugme-ikincil" data-envanter-tekrar>${t('ortak.yenidenDene')}</button>`;
        envanterRoot.querySelector('[data-envanter-tekrar]')?.addEventListener('click', () => { void ac(); }, { once: true });
      }
    };
    void ac();
  };
  /** İlim Yolu sekmesinin bağlanması: panel ve firebase/functions tembel yüklenir (Envanter ile aynı kalıp). */
  const ilimMontaj = () => {
    const ilimRoot = kok.querySelector<HTMLElement>('[data-hoca-ilim-yolu]');
    if (!ilimRoot || !S) return;
    const durum = S, yukleme = ilimYukleme, baslangicRef = ilimOnSecim;
    ilimOnSecim = '';
    const ac = async () => {
      try {
        const mod = await import('./hoca-ilim-yolu');
        if (yukleme !== ilimYukleme || S !== durum || !ilimRoot.isConnected) return;
        ilimPanel = mod.ilimYoluPaneli(ilimRoot, { app, ogrenciler: () => durum.ogrenciler, baslangicRef: baslangicRef || undefined });
      } catch {
        if (yukleme !== ilimYukleme || !ilimRoot.isConnected) return;
        ilimRoot.innerHTML = `<p class="not hata" role="status">${t('panel.ilimHata')}</p><button type="button" class="dugme dugme-ikincil" data-ilim-tekrar>${t('ortak.yenidenDene')}</button>`;
        ilimRoot.querySelector('[data-ilim-tekrar]')?.addEventListener('click', () => { void ac(); }, { once: true });
      }
    };
    void ac();
  };
  /** Ezber sekmesinin «Bugün» listesi: günün yoklaması (ekranda işaretli ama kaydedilmemiş olan da sayılır). */
  const gununYoklamasi = async (tarih: string): Promise<Record<string, string[]> | null> => {
    if (!S) return null;
    const dolu = (d: Record<string, string> | undefined) => Object.values(d || {}).filter(Boolean);
    if (S.tarih === tarih && Object.values(S.yoklama).some((y) => dolu(y.dersler).length)) return Object.fromEntries(Object.entries(S.yoklama).map(([r, y]) => [r, dolu(y.dersler)]));
    const k = (await kayitlar('yoklama', fs.where('tarih', '==', tarih))) as unknown as Yok[];
    if (!k.length) return null;
    return Object.fromEntries(k.map((y) => [y.ref, dolu(y.dersler && typeof y.dersler === 'object' ? y.dersler : (y.durum ? { '1': y.durum } : {}))]));
  };

  /* ---------------------------------------------------------------- olaylar */
  /** E-posta bağlantısı ya da (iki adımlı doğrulamadan sonra) kod ile girişin ortak sonu: şifre henüz belirlenmediyse şifre ekranı, değilse ekran. */
  const bagSonrasi = async (user: { uid: string }) => {
    const h = await fs.getDoc(fs.doc(db, 'hocalar', user.uid)).catch(() => null);
    if (h && h.exists() && !(h.data() as { sifreVar?: boolean }).sifreVar) sifreEkrani(); else await yukle(user);
  };
  const bagIleGir = async (eposta: string) => {
    let kb;
    try { kb = await auth.signInWithEmailLink(a, eposta, location.href); }
    catch (e) {
      if (!mfaGerekli(e)) throw e;
      portalTercihleri.setItem('hocaEposta', eposta); history.replaceState(null, '', sayfaAdresi); // bağlantı tek kullanımlıktır: yenilemede yeniden denenmesin
      await mfaIste(e, bagSonrasi); return;
    }
    portalTercihleri.setItem('hocaEposta', eposta); history.replaceState(null, '', sayfaAdresi);
    await bagSonrasi(kb.user);
  };
  /** İki adımlı doğrulama (TOTP) sınaması: şifre/bağlantı doğrulandı ama hesapta kayıtlı faktör var → 6 haneli kod ekranı. */
  const mfaIste = async (hataNesnesi: unknown, devam: (user: { uid: string }) => Promise<void>) => {
    const m = await import('./hoca-mfa');
    m.mfaKodEkrani(kok, { cozumleyici: girisCozumleyici(auth, a, hataNesnesi), devam, geri: () => girisEkrani() });
  };
  /** Oturum kapandı (ör. son iki adımlı doğrulama faktörü kaldırılınca Firebase oturumu düşürür): paneller kapanır, ileti giriş ekranında görünür. */
  const oturumSonu = (ileti: string) => { girisNotu = ileti; bultenTemizle?.(); kitaplariTemizle?.(); odevKapat(); defterKapat(); ezberKapat(); envanterKapat(); ilimKapat(); S = null; girisEkrani(); };
  const sekmeyeGec = async (ad: string, odevOnayli=false) => { if (!S || (!odevOnayli&&odevPanel&&!odevPanel.ayrilabilir()) || (defterPanel&&!defterPanel.ayrilabilir()) || envanterKilitli() || ilimKilitli()) { kok.querySelector<HTMLElement>('#hoca-tab-' + S?.sekme)?.focus(); return false; } bultenTemizle?.(); kitaplariTemizle?.(); odevKapat(); defterKapat(); ezberKapat(); envanterKapat(); ilimKapat(); S.sekme = ad; duzenlenenDuyuru = null; kok.innerHTML = `<p class="not">${tc('yukleniyor')}</p>`; await sekmeYukle(ad); ciz(); return true; };

  kok.addEventListener('mousedown', (ev) => { if ((ev.target as HTMLElement).closest('.za-arac')) ev.preventDefault(); });
  kok.addEventListener('click', async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-eylem],[data-sekme],[data-yok],[data-ogr],[data-sil],[data-yayin],[data-okundu],[data-yanitla],[data-duyuru-duzelt],[data-davet],[data-veli-sil],[data-zk],[data-mazeret-uygula],[data-defter-ac],[data-defter-eksik],[data-ezber-ac],[data-ilim-ac]');
    if (!el) return;
    try {
      if (el.dataset.eylem === 'cikis') { if((odevPanel&&!odevPanel.ayrilabilir())||(defterPanel&&!defterPanel.ayrilabilir())||envanterKilitli()||ilimKilitli())return; bultenTemizle?.(); kitaplariTemizle?.(); odevKapat(); defterKapat(); ezberKapat(); envanterKapat(); ilimKapat(); await auth.signOut(a); S = null; girisEkrani(); return; }
      if (el.dataset.eylem === 'atla' && a.currentUser) { await yukle(a.currentUser); return; }
      if (el.dataset.eylem === 'sifremiUnuttum') {
        const form = el.closest('form') as HTMLFormElement; const ep = (form.querySelector('input[name=eposta]') as HTMLInputElement).value.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ep)) { mesaj(form, t('mesaj.epostaGecersiz'), 'hata'); return; }
        await auth.sendPasswordResetEmail(a, ep, { url: sayfaAdresi }); portalTercihleri.setItem('hocaEposta', ep);
        mesaj(form, t('mesaj.sifreSifirGitti', { ep }), 'basari'); return;
      }
      if (el.dataset.sekme) { const ad = el.dataset.sekme; if(await sekmeyeGec(ad))kok.querySelector<HTMLElement>('#hoca-tab-' + ad)?.focus(); return; }
      if (el.dataset.defterAc) { defterOnSecim = el.dataset.defterAc; if (await sekmeyeGec('defter')) kok.querySelector<HTMLElement>('#hoca-tab-defter')?.focus(); return; }
      if (el.dataset.ezberAc) { ezberOnSecim = el.dataset.ezberAc; if (await sekmeyeGec('ezber')) kok.querySelector<HTMLElement>('#hoca-tab-ezber')?.focus(); return; }
      if (el.dataset.ilimAc) { ilimOnSecim = el.dataset.ilimAc; if (!(await sekmeyeGec('ilim'))) ilimOnSecim = ''; return; } // odak panelde vurgulanan öğrencinin ilk düğmesine gider
      if (el.hasAttribute('data-defter-eksik')) { defterOnEksik = true; if (await sekmeyeGec('defter')) kok.querySelector<HTMLElement>('#hoca-tab-defter')?.focus(); return; }
      if (!S) return;
      if (el.dataset.zk) {
        const yaz = el.closest('.zengin-alan')?.querySelector<HTMLElement>('.za-yaz'); if (!yaz) return;
        yaz.focus();
        try {
          const zk = el.dataset.zk;
          if (zk === 'emoji') document.execCommand('insertText', false, el.dataset.emoji || '');
          else if (zk === 'foreColor') document.execCommand('foreColor', false, el.dataset.renk || '#24201c');
          else if (zk === 'createLink') { const u = (prompt(t('duy.baglantiSor')) || '').trim(); if (/^https?:\/\//i.test(u)) document.execCommand('createLink', false, u); }
          else document.execCommand(zk);
        } catch { /* execCommand desteklenmiyorsa yoksay */ }
        return;
      }
      if (el.dataset.yok) { const ref = el.dataset.yok; const sr = el.dataset.ders || '1'; const d = el.dataset.durum || ''; const y = S.yoklama[ref] || { dersler: {}, not: '' }; y.dersler[sr] = y.dersler[sr] === d ? '' : d; S.yoklama[ref] = y;
        const isaretle = (s: string) => kok.querySelectorAll<HTMLElement>(`[data-yok="${ref}"][data-ders="${s}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.durum === y.dersler[s])));
        isaretle(sr);
        /* Akıllı varsayılan (14 Eyl 2026): günün İLK dersi işaretlenince öğrencinin BOŞ kalan dersleri de aynı
           işaretlenir («Geç» → sonrakiler «Var»). Dolu ders asla ezilmez; hoca tek tek değiştirebilir. */
        const gun = veri.gunler.find((x) => x.tarih === S!.tarih); const siralar = (gun ? gun.dersler : []).map((x) => String(x.no));
        const yeni = y.dersler[sr];
        if (yeni && sr === siralar[0]) for (const s of siralar.slice(1)) if (!y.dersler[s]) { y.dersler[s] = yeni === 'gec' ? 'var' : yeni; isaretle(s); }
        const oz = kok.querySelector('[data-yk-ozet]'); if (oz) oz.innerHTML = yoklamaOzeti(gun ? gun.dersler : []);
        return; }
      if (el.dataset.mazeretUygula) {
        // Yalnız ekranda işaretler; kayıt yine «Yoklamayı kaydet» ile yazılır (hoca son sözü söyler).
        const ref = el.dataset.mazeretUygula;
        const gun = veri.gunler.find((x) => x.tarih === S!.tarih);
        const y = S.yoklama[ref] || { dersler: {}, not: '' };
        const oto = new Set(y.veliMazereti || []);
        (gun ? gun.dersler : []).forEach((d) => { y.dersler[String(d.no)] = 'mazeret'; oto.add(String(d.no)); });
        S.yoklama[ref] = { ...y, veliMazereti: [...oto].sort() }; ciz();
        ustMesaj(t('mesaj.mazeretIsaretli', { ad: ogrAdi(ref) }));
        return;
      }
      if (el.dataset.eylem === 'hepsiVar') { const gun = veri.gunler.find((x) => x.tarih === S!.tarih); const siras = (gun ? gun.dersler : []).map((d) => String(d.no)); S.ogrenciler.filter((o) => o.durum !== 'pasif').forEach((o) => { const ders: Record<string, string> = {}; siras.forEach((s) => { ders[s] = 'var'; }); S!.yoklama[o.ref] = { dersler: ders, not: S!.yoklama[o.ref]?.not || '', veliMazereti: S!.yoklama[o.ref]?.veliMazereti }; }); S.mazeretKuraliDegisen = []; ciz(); return; }
      if (el.dataset.eylem === 'yoklamaKaydet') {
        kok.querySelectorAll<HTMLInputElement>('[data-yok-not]').forEach((i) => { const ref = i.dataset.yokNot!; const not = i.value.trim(); const y = S!.yoklama[ref]; if (y) y.not = not; else if (not) S!.yoklama[ref] = { dersler: {}, not }; });
        // 🛑 20 Eyl 2026: Firestore GÜVENLİK KURALLARI bir batch'te en çok 20 BELGE ERİŞİMİ
        // değerlendirir. yoklama/{id} kuralı her belge için islemeAcik(ref) → portalSilme/{ref}
        // bakar (her öğrenci ayrı belge = N erişim) + hoca() → hocalar/{uid} (hepsinde aynı, 1 kez
        // sayılır). Sınıf 20 öğrenciye çıkınca 21 > 20 oldu ve BÜTÜN batch «Missing or insufficient
        // permissions» ile reddedildi — hoca hiçbir yoklamayı kaydedemedi. Ölçüm (gerçek hoca
        // kimliğiyle): 19 belge → HTTP 200, 20 belge → HTTP 403. Bu yüzden yazımlar paketlenir.
        // Paket boyutu 15: erişim tavanına 4 belgelik pay bırakır, sınıf büyüse de çalışır.
        const YOKLAMA_PAKET = 15;
        type YokIslem = { id: ReturnType<typeof fs.doc>; veri?: Record<string, unknown> };
        const islemler: YokIslem[] = [];
        for (const [ref, y] of Object.entries(S.yoklama)) {
          const id = fs.doc(db, 'yoklama', `${ref}_${S.tarih}`);
          const dersler: Record<string, string> = {}; for (const s of Object.keys(y.dersler)) if (y.dersler[s]) dersler[s] = y.dersler[s];
          // veliMazereti: kuralın hangi dersleri kendiliğinden işaretlediği. Hoca sonradan «Yok»a
          // çevirirse kural o dersi bir daha geri almasın diye kaydedilir (bkz. mazeretKuraliniUygula).
          const oto = (y.veliMazereti || []).filter((s) => dersler[s]);
          if (Object.keys(dersler).length || y.not) islemler.push({ id, veri: { ref, tarih: S.tarih, dersler, not: y.not || '', ...(oto.length ? { veliMazereti: oto } : {}), kaydeden: S.uid, zaman: fs.serverTimestamp() } });
          else islemler.push({ id });
        }
        let n = 0;
        for (let i = 0; i < islemler.length; i += YOKLAMA_PAKET) {
          const b = fs.writeBatch(db);
          for (const is of islemler.slice(i, i + YOKLAMA_PAKET)) { if (is.veri) { b.set(is.id, is.veri); n++; } else b.delete(is.id); }
          await b.commit();
        }
        S.mazeretKuraliDegisen = []; ciz();
        ustMesaj(t('mesaj.yoklamaKaydedildi', { n, tarih: tarihYaz(S.tarih) }), 'basari'); return;
      }
      // 27 Eyl 2026: karne düğmesi de data-ogr taşır; eylemli düğme öğrenci seçimi sayılmaz (karne hiç kopyalanmıyordu).
      if (el.dataset.ogr && !el.dataset.eylem) { kok.querySelector('#ogrenci-karti')?.remove(); await ogrenciYukle(el.dataset.ogr); ciz(); kok.querySelector('#ogrenci-karti')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (el.dataset.eylem === 'whatsappKarneKopyala') {
        const ref = el.dataset.ogr;
        const ogr = S?.ogrenciler.find((x) => x.ref === ref);
        if (!ogr) return;
        const ile = S?.ilerleme || {};
        const kuranKonu = ile.kuranAdim != null && kuranSirasi[ile.kuranAdim] ? kuranSirasi[ile.kuranAdim].konu : '—';
        const frMi = ogr.dil === 'fr';
        /* 27 Eyl 2026 — Ezber Kilimi: karne ezberDurum'dan; «Hocaya okudu» ve üstü, katalog sırasıyla, veli dilinde. */
        const dil = frMi ? 'fr' : 'tr';
        const ezberler = Object.entries(S?.ezber || {}).filter(([id, d]) => d.basamak >= 2 && ezberBul(id)).sort(([x], [y]) => katalogSirasi(x) - katalogSirasi(y))
          .map(([id, d]) => `${ezberBul(id)!.ad[dil]} (${BASAMAK_ADLARI[d.basamak][dil]})`).join(', ') || '—';
        const rozetAd = ile.rozet ? ({ yildiz: '⭐ Haftanın Yıldız Talebesi', ezber: '📖 Ezber & Sûre Şampiyonu', ahlak: '🌸 Güzel Ahlâk ve Nezaket', gayret: '🏆 Üstün Gayret ve Azim', devam: '🏅 Düzenli Devam ve Disiplin' } as Record<string, string>)[ile.rozet] || ile.rozet : '';
        const hocaNot = ile.hocaNotu || '';

        const karneMetni = frMi
          ? `🌟 *${ogr.ad} ${ogr.soyad} — Bilan hebdomadaire du Mektep*\n` +
            `📖 *Coran:* ${kuranKonu}\n` +
            `🎯 *Mémorisation:* ${ezberler}\n` +
            (rozetAd ? `🏅 *Badge d’honneur:* ${rozetAd}\n` : '') +
            (hocaNot ? `💬 *Remarque de l’enseignant:* ${hocaNot}\n` : '') +
            `\n🕌 École Coranique de la Mosquée Ulu de Marche-en-Famenne`
          : `🌟 *${ogr.ad} ${ogr.soyad} — Mektep Durum Özeti*\n` +
            `📖 *Kur’an:* ${kuranKonu}\n` +
            `🎯 *Ezber & Sûre:* ${ezberler}\n` +
            (rozetAd ? `🏅 *Tebrik Rozeti:* ${rozetAd}\n` : '') +
            (hocaNot ? `💬 *Hoca Notu:* ${hocaNot}\n` : '') +
            `\n🕌 Marche-en-Famenne Ulu Camii Mektebi`;

        try {
          await navigator.clipboard.writeText(karneMetni);
          ustMesaj(t('mesaj.karneKopyalandi', { ad: `${ogr.ad} ${ogr.soyad}` }), 'basari');
        } catch {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(karneMetni)}`, '_blank');
        }
        return;
      }
      if (el.dataset.sil) { if (!confirm(t('mesaj.silinsinMi'))) return; await fs.deleteDoc(fs.doc(db, el.dataset.sil, el.dataset.id!));
        if (S.sekme === 'ogrenci') await ogrenciYukle(S.secili); else await sekmeYukle(S.sekme); ciz(); ustMesaj(t('mesaj.silindi'), 'basari'); return; }
      if (el.dataset.yayin) { await fs.updateDoc(fs.doc(db, el.dataset.yayin, el.dataset.id!), { yayin: el.dataset.deger === '1' }); await sekmeYukle(S.sekme); ciz(); return; }
      if (el.dataset.okundu) { await fs.updateDoc(fs.doc(db, 'bildirimler', el.dataset.okundu), { okundu: el.dataset.deger === '1' }); await sekmeYukle('bildirim'); ciz(); return; }
      if (el.dataset.yanitla) { const kart = el.closest('.bildirim-kart'); const ta = kart?.querySelector<HTMLTextAreaElement>('[data-yanit-metin]'); const metin = (ta?.value || '').trim();
        if (!metin) { ustMesaj(t('bil.yanitYaz'), 'hata'); ta?.focus(); return; }
        mesgulYap(el as HTMLButtonElement, true);
        await fs.updateDoc(fs.doc(db, 'bildirimler', el.dataset.yanitla), { yanit: metin.slice(0, 1000), yanitZaman: fs.serverTimestamp(), okundu: true });
        await sekmeYukle('bildirim'); ciz(); ustMesaj(t('bil.yanitGitti'), 'basari'); return; }
      if (el.dataset.duyuruDuzelt) { duzenlenenDuyuru = el.dataset.duyuruDuzelt; ciz(); kok.querySelector('form[data-form=duyuru]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (el.dataset.eylem === 'duyuruVazgec') { duzenlenenDuyuru = null; ciz(); return; }
      if (el.dataset.davet) {
        const ep = el.dataset.davet; const dil = el.dataset.dil || '';
        if (!['tr', 'fr', 'en'].includes(dil)) { ustMesaj(t('aile.davetDilSor'), 'hata'); return; }
        mesgulYap(el as HTMLButtonElement, true);
        a.languageCode = dil;
        try { await auth.sendSignInLinkToEmail(a, ep, { url: location.origin + (veri.veliYollari[dil] || veri.veliYollari.tr), handleCodeInApp: true }); }
        finally { a.languageCode = 'tr'; mesgulYap(el as HTMLButtonElement, false); }
        await fs.setDoc(fs.doc(db, 'aileler', ep), { davet: new Date().toISOString() }, { merge: true }).catch(() => {});
        ustMesaj(t('aile.davetGitti', { ep, dil: DIL_ADI[dil] || dil }), 'basari'); return;
      }
      if (el.dataset.veliSil) { const ep = el.dataset.veliSil; const o = S.ogrenciler.find((x) => x.ref === S!.secili); if (!o || !confirm(t('mesaj.veliKaldirOnay', { ep }))) return;
        o.veliler = await portalVeliBagi(db,o.ref,ep,false); ciz(); return; }
      if (el.dataset.eylem === 'iceAktar') { mesgulYap(el as HTMLButtonElement, true); ustMesaj(t('aile.okunuyor')); await iceAktar(); mesgulYap(el as HTMLButtonElement, false); return; }
    } catch (e) { ustMesaj(hata(e), 'hata'); }
  });

  kok.addEventListener('keydown', (ev) => {
    const tab = (ev.target as HTMLElement).closest<HTMLElement>('[role=tab]');
    if (!tab || !S) return;
    const keys = Object.keys(SEKMELER); const cur = keys.indexOf(S.sekme); let h = -1;
    if (ev.key === 'ArrowRight') h = (cur + 1) % keys.length;
    else if (ev.key === 'ArrowLeft') h = (cur - 1 + keys.length) % keys.length;
    else if (ev.key === 'Home') h = 0;
    else if (ev.key === 'End') h = keys.length - 1;
    else return;
    ev.preventDefault(); const ad = keys[h]; sekmeyeGec(ad).then(ok => {if(ok)kok.querySelector<HTMLElement>('#hoca-tab-' + ad)?.focus();});
  });
  kok.addEventListener('change', async (ev) => {
    const t = ev.target as HTMLSelectElement;
    if (!S) return;
    if (t.matches('[data-yoklama-tarih]')) { S.tarih = t.value; S.yoklama = {}; S.gunMazeretleri = []; S.mazeretKuraliDegisen = []; S.yukleniyor = true; ciz(); await yoklamaYukle(); S.yukleniyor = false; ciz(); } // yükleme bitmeden tıklanan işaretler kaybolmasın diye liste önce kapatılır

  });

  kok.addEventListener('submit', async (ev) => {
    const form = (ev.target as HTMLElement).closest<HTMLFormElement>('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const fd = new FormData(form);
    // Şifre aynen iletilir; boşluklar da şifrenin parçasıdır.
    const al = (k: string) => {
      const deger = String(fd.get(k) || '');
      return k === 'sifre' || k === 'sifre2' ? deger : deger.trim();
    };
    const dugmeler = form.querySelectorAll<HTMLButtonElement>('button'); dugmeler.forEach((b) => mesgulYap(b, true));
    mesaj(form, ''); girisNotu = '';
    try {
      switch (form.dataset.form) {
        case 'giris': { const ep = al('eposta').toLowerCase(); portalTercihleri.setItem('hocaEposta', ep); try { const kb = await auth.signInWithEmailAndPassword(a, ep, al('sifre')); await yukle(kb.user); } catch (e) { if (!mfaGerekli(e)) throw e; await mfaIste(e, yukle); } break; }
        case 'bag': { const ep = al('eposta').toLowerCase(); await auth.sendSignInLinkToEmail(a, ep, { url: sayfaAdresi, handleCodeInApp: true }); portalTercihleri.setItem('hocaEposta', ep); mesaj(form, t('mesaj.bagGitti', { ep }), 'basari'); break; }
        case 'bagTamamla': await bagIleGir(al('eposta').toLowerCase()); break;
        case 'sifreBelirle': { const s1 = al('sifre'); if (s1.length < 8 || s1 !== al('sifre2')) { mesaj(form, t('mesaj.sifreUyusmuyor'), 'hata'); break; }
          if (!a.currentUser) break; await auth.updatePassword(a.currentUser, s1); await fs.setDoc(fs.doc(db, 'hocalar', a.currentUser.uid), { sifreVar: true }, { merge: true }).catch(() => {}); await yukle(a.currentUser); break; }
        case 'sifreDegistir': { if (!a.currentUser) break;
          try { await auth.updatePassword(a.currentUser, al('sifre')); mesaj(form, t('mesaj.sifreDegisti'), 'basari'); form.reset(); }
          catch (e) { if ((e as { code?: string })?.code === 'auth/requires-recent-login') { await auth.sendPasswordResetEmail(a, a.currentUser.email || '', { url: sayfaAdresi }); mesaj(form, t('mesaj.sifreEposta'), 'basari'); } else throw e; }
          break; }
        case 'ogrenciAyar': { if (!S) break; const o = S.ogrenciler.find((x) => x.ref === S!.secili); if (!o) break;
          await fs.updateDoc(fs.doc(db, 'ogrenciler', o.ref), { durum: al('durum'), grup: al('grup') }); o.durum = al('durum'); o.grup = al('grup'); mesaj(form, t('mesaj.kaydedildi'), 'basari'); break; }
        case 'veliEkle': { if (!S) break; const o = S.ogrenciler.find((x) => x.ref === S!.secili); const ep = al('eposta').toLowerCase(); if (!o || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ep)) { mesaj(form, t('mesaj.epostaGecersiz'), 'hata'); break; }
          o.veliler = await portalVeliBagi(db,o.ref,ep,true); ciz(); ustMesaj(t('mesaj.veliEklendi', { ep, sekme: SEKMELER.aile }), 'basari'); break; }
        case 'ilerleme': { if (!S) break; const ref = S.secili; const alanlar: Record<string, number> = {};
          /* 27 Eyl 2026 (Ezber Kilimi): eski ezber tablosu formdan kalktı. ilerleme/{ref}.ezber geçişin kaynağıdır ve salt
             okunur korunur; setDoc belgeyi bütün yazdığı için okunan değer aynen geri yazılır (docs/EZBER-KILIMI.md). */
          const ezber: Record<string, string> = { ...(S.ilerleme?.ezber || {}) };
          for (const [k, v] of fd.entries()) { const val = String(v); if (k.startsWith('alan:') && Number(val) > 0) alanlar[k.slice(5)] = Number(val); }
          const kayit: Ilerleme & { kaydeden: string } = { kuranAdim: Number(al('kuranAdim')), ezber, alanlar, hocaNotu: al('hocaNotu'), rozet: al('rozet'), guncelleme: bugunISO(), kaydeden: S.uid };
          await fs.setDoc(fs.doc(db, 'ilerleme', ref), kayit); S.ilerleme = kayit; mesaj(form, t('mesaj.ilerlemeKaydedildi'), 'basari'); break; }
        case 'degerlendirme': { if (!S) break;
          await fs.addDoc(col('degerlendirme'), { ref: S.secili, tarih: al('tarih'), alan: al('alan'), olcut: al('olcut'), derece: Number(al('derece')) || 0, not: al('not'), kaydeden: S.uid, zaman: fs.serverTimestamp() });
          await ogrenciYukle(S.secili); ciz(); ustMesaj(t('mesaj.degEklendi'), 'basari'); break; }
        case 'not': { if (!S) break;
          await fs.addDoc(col('notlar'), { ref: S.secili, tarih: al('tarih'), metin: al('metin'), veliyeGorunur: fd.get('veliyeGorunur') === 'on', kaydeden: S.uid, zaman: fs.serverTimestamp() });
          await ogrenciYukle(S.secili); ciz(); ustMesaj(t('mesaj.notEklendi'), 'basari'); break; }
        case 'duyuru': { if (!S) break;
          const zengin = (k: string) => { const el = form.querySelector<HTMLElement>(`[data-zengin="${k}"]`); return el ? temizleHtml(el.innerHTML) : ''; };
          if (!metniSadelestir(zengin('metinTr'))) { mesaj(form, t('duy.trGerekli'), 'hata'); break; }
          const duyuruVeri = { tarih: al('tarih'), baslik: { tr: al('baslikTr'), fr: al('baslikFr'), en: al('baslikEn') }, metin: { tr: zengin('metinTr'), fr: zengin('metinFr'), en: zengin('metinEn') }, yayin: fd.get('yayin') === 'on' };
          if (duzenlenenDuyuru) { await fs.updateDoc(fs.doc(db, 'duyurular', duzenlenenDuyuru), { ...duyuruVeri, guncelleme: new Date().toISOString() }); duzenlenenDuyuru = null; await sekmeYukle('duyuru'); ciz(); ustMesaj(t('duy.guncellendi'), 'basari'); }
          else { await fs.addDoc(col('duyurular'), { ...duyuruVeri, kaydeden: S.uid, zaman: fs.serverTimestamp() }); await sekmeYukle('duyuru'); ciz(); ustMesaj(t('duy.kaydedildi'), 'basari'); }
          break; }
      }
    } catch (e) { mesaj(form, hata(e), 'hata'); }
    finally { if (form.isConnected) dugmeler.forEach((b) => mesgulYap(b, false)); }
  });

  /* ---------------------------------------------------------------- kayıt defterinden içe aktarma (portal-yonetim.py ice-aktar ile aynı kurallar) */
  const iceAktar = async () => {
    if (!S) return;
    const ayar = await fs.getDoc(fs.doc(db, 'ayarlar', 'portal'));
    const anahtar = (ayar.data() as { gasAnahtari?: string } | undefined)?.gasAnahtari;
    const atlanan = new Set<string>(((ayar.data() as { atlanan?: string[] } | undefined)?.atlanan) || []); // ayarlar/portal.atlanan: mükerrer/deneme kayıtlar (portal-yonetim.py ile aynı)
    const epostaDuzelt = ((ayar.data() as { epostaDuzelt?: Record<string, string> } | undefined)?.epostaDuzelt) || {}; // defterde yanlış yazılmış veli e-postaları → doğrusu; '@'siz değer (ör. «gecersiz-geri-donuyor») = adres geri dönüyor, bağ kurulmaz (10 Eki 2026)
    if (!anahtar) { ustMesaj(t('aile.gasYok'), 'hata'); return; }
    const j = await (await fetch(`${GAS}?islem=liste&anahtar=${encodeURIComponent(anahtar)}`)).json() as { ok?: boolean; kayitlar?: { basliklar: string[]; satirlar: string[][] } };
    if (!j.ok || !j.kayitlar) { ustMesaj(t('aile.okunamadi'), 'hata'); return; }
    const ix: Record<string, number> = {}; j.kayitlar.basliklar.forEach((h, i) => { ix[h] = i; });
    const al = (s: string[], k: string) => String(s[ix[k]] ?? '').trim();
    const kokRef = (r: string) => r.replace(/-R\d+$/i, ''); const surum = (r: string) => Number((/-R(\d+)$/i.exec(r) || [])[1] || 1);
    const guncel: Record<string, string[]> = {};
    for (const s of j.kayitlar.satirlar) {
      const ref = al(s, 'Referans'); if (!ref) continue;
      if (trBuyuk(al(s, 'Öğrenci soyadı') + al(s, 'Öğrenci adı')).includes('TESTOGLU') || kokRef(ref) === 'UC-2026-0003' || atlanan.has(kokRef(ref))) continue;
      const k = kokRef(ref); if (!guncel[k] || surum(ref) > surum(al(guncel[k], 'Referans'))) guncel[k] = s;
    }
    const b = fs.writeBatch(db); const simdi = new Date().toISOString(); let yeni = 0;
    for (const k of Object.keys(guncel).sort()) {
      const s = guncel[k]; const ep = defterVeliEpostasi(al(s, 'Veli e-posta'), epostaDuzelt); const dil = (al(s, 'İletişim dili') || al(s, 'Form dili') || 'tr').toLowerCase();
      if (!S.ogrenciler.some((o) => o.ref === k)) yeni++;
      const mevcut = S.ogrenciler.find((o) => o.ref === k);
      const adAlanlari = mevcut && (mevcut as { adSabit?: boolean }).adSabit ? {} : { ad: trBaslik(al(s, 'Öğrenci adı')), soyad: trBuyuk(al(s, 'Öğrenci soyadı')) }; // adSabit: ad/soyad portalda düzeltildi, defterden ezilmez
      b.set(fs.doc(db, 'ogrenciler', k), { ...adAlanlari, ...(ep ? { veliler: fs.arrayUnion(ep) } : {}), dil, kayitRef: al(s, 'Referans'), guncelleme: simdi, ...(mevcut ? {} : { durum: 'aktif', grup: '' }) }, { merge: true });
      const iletisimDili = al(s, 'İletişim dili').toLowerCase();
      if (ep) b.set(fs.doc(db, 'aileler', ep), { ogrenciler: fs.arrayUnion(k), dil, ...(['tr', 'fr'].includes(iletisimDili) ? { iletisimDili, iletisimDiliKaynagi: 'kayit-formu' } : {}), adSoyad: trBaslik(al(s, 'Veli adı soyadı')), guncelleme: simdi }, { merge: true });
    }
    await b.commit();
    const ogr = await kayitlar('ogrenciler');
    S.ogrenciler = ogr.map((o) => ({ ...(o as unknown as Ogr), ref: o.id })).sort((x, y) => (x.soyad + x.ad).localeCompare(y.soyad + y.ad, 'tr'));
    await sekmeYukle('aile'); ciz(); ustMesaj(t('aile.aktarildi', { n: Object.keys(guncel).length, yeni }), 'basari');
  };

  /* ---------------------------------------------------------------- başlangıç */
  if (auth.isSignInWithEmailLink(a, location.href)) {
    const kayitli = (portalTercihleri.getItem('hocaEposta') || '').toLowerCase();
    if (kayitli) { try { await bagIleGir(kayitli); return; } catch (e) { girisEkrani(); mesaj(kok.querySelector('form[data-form=bag]'), hata(e), 'hata'); return; } }
    bagTamamlaEkrani(); return;
  }
  auth.onAuthStateChanged(a, (user) => { if (user) { if (!S) yukle(user).catch((e) => { kok.innerHTML = `<p class="not hata">${esc(hata(e))}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${t('ortak.cikis')}</button>`; }); } else { bultenTemizle?.(); kitaplariTemizle?.(); odevKapat(); defterKapat(); ezberKapat(); ilimKapat(); S = null; girisEkrani(); } });
}
