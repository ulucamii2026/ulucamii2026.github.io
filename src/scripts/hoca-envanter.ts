/**
 * Online envanter — hoca ekranı «Envanter» sekmesi (1 Kasım 2026). Yalnız 2. hocanın telefonu: 9–13 yaş öğrenci formu kendisi
 * doldurur (öğrenci kipi: kilitli, tam ekran, tek dokunuş), 5–8 yaşı hoca sorar ve çocuk adına işaretler. Hoca kipi: «Hoca»
 * sütunu, okuma basamağı, notlar, «Bu sayfayı dinledim», isteğe bağlı parmak çizimi. Bugün: `hocaGunSirasi/{tarih}` kuyruğu.
 * Yazım yalnız `s../lib/ogrenci-envanteri/depo.ts` ile (tam SDK, kalıcı önbellek; her dokunuş saniyede en çok bir toplu yazım).
 * Hoca arayüzü beş dilli (src/i18n/hoca-metin/envanter.ts); envanter içeriği (maddeler.json), öğrenci kipi ve ev kipi Türkçe + Fransızca kalır. Değişken her değer `esc` ile kaçırılır.
 * Şartname: D:\ulu-camii-kuran-kursu\belgeler\bireysel-plan-2026-2027\ONLINE-ENVANTER-SPEC.md. Kişisel veri koda girmez.
 */
import type { FirebaseApp } from 'firebase/app';
import { tamFirestore } from '../lib/firebase-tam';
import { ENVANTER_CAKISMA, envanterDeposu, type DepoYollari, type Oturum } from '../lib/ogrenci-envanteri/depo';
import {
  GRUPLAR, MADDELER, TEST_REF, enYeni, ilerleme, rozet, sayfaSatirlari,
  type Bolum, type Grup, type Ikili, type Kutu, type MetinAlani, type Program, type Sayfa, type Satir,
} from '../lib/ogrenci-envanteri/model';
import { hocaYerel } from '../i18n/hoca';
import { tV, tTr } from '../i18n/hoca-metin/envanter';

export type EnvanterOgrencisi = { ref: string; ad: string; soyad: string; durum?: string };
export interface EnvanterPaneliSecenek {
  app: FirebaseApp;
  /** Aktif öğrenciler (soyad-ad sırasıyla; ortak `ogrenciler` koleksiyonundan). */
  ogrenciler: () => readonly EnvanterOgrencisi[];
  bugun: string;
  uid: () => string;
  /** Bağlantı sayfası (/neler-biliyorum/) için «envanterBaglanti/{k}/…» yolları; verilmezse hoca ekranı koleksiyonları. */
  yollar?: DepoYollari;
  /** «Ev kipi» (1 Kasım 2026): velinin tek öğrencilik bağlantısı. Verilirse panel hoca arayüzü yerine tek sayfalık, hoca alanları
   *  olmayan veli formunu çizer (Bugün/Öğrenciler/deneme öğrenci/grup seçimi/kilit katmanı yok). */
  ev?: EvKipi;
}
export interface EvKipi { ref: string; ad: string; grup: Grup; dil: 'tr' | 'fr' }

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const gunYaz = (iso: string, sec: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  iso ? new Intl.DateTimeFormat(hocaYerel(), { timeZone: 'Europe/Brussels', ...sec }).format(new Date(`${iso}T12:00:00Z`)) : '';
/** Fransızca noktalama öncesi kesilmez boşluk (kâğıt formla aynı kural; JSON'daki metinler zaten düzeltilmiş). */
const fr = (s: string) => esc(s);

const SIMGE: Record<string, string> = {
  geri: '<path d="M15 5.5L8.5 12l6.5 6.5"/>',
  onay: '<path d="M5 12.6l4.3 4.3L19 7.2"/>',
  ok: '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  kilit: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  bulut: '<path d="M7.2 18.5h9.6a4.1 4.1 0 0 0 .7-8.1 6 6 0 0 0-11.5-.9 4.5 4.5 0 0 0 1.2 9z"/>',
  bulutYok: '<path d="M7.2 18.5h9.6a4.1 4.1 0 0 0 .7-8.1 6 6 0 0 0-11.5-.9 4.5 4.5 0 0 0 1.2 9z"/><path d="M4 4l16 16"/>',
  uyari: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4.2M12 16.9v.2"/>',
  saat: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
  form: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12.5h7M8.5 16.5h4"/>',
  hedef: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
};
const simge = (ad: string) => `<svg class="simge" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${SIMGE[ad] || ''}</svg>`;

const IS_ADI: Record<string, string> = { form: tV('is.form'), dogrulama: tV('is.dogrulama'), hedef: tV('is.hedef'), ezber: tV('is.ezber'), not: tV('is.not') };
const grupAdi = (g: Grup) => tV(g === '5-8' ? 'grup.58' : 'grup.913');
const ROZET_ADI: Record<string, string> = { eksik: tV('rozet.eksik'), dogrulanacak: tV('rozet.dogrulanacak'), dolu: tV('rozet.dolu') };
const KAYDIRMA = (): ScrollBehavior => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
const CIZIM_SINIRI = 200_000; // veri adresi uzunluğu ≈ 150 kB PNG (kural 210 000)
const EV_YARDIM_ANAHTARI = 'ulucamii-envanter-ev-yardim'; // yardım kartının açık/kapalı durumu (localStorage, isteğe bağlı)
const SUTUN_ANAHTARI = 'ulucamii-envanter-sutun'; // hoca formunda hangi sütun(lar) gösterilsin (localStorage, isteğe bağlı)
const NB = ' '; // Fransızca kesilmez boşluk (« » ve ; ? : ! öncesi)
/** Ev kipi yardım kartı: grup başına TR + FR. Madde 2'deki «Bilmiyorum» etiketi ölçekten (bilgi) gelir. */
const evYardim = (g: Grup) => {
  const bil = MADDELER.olcekler.bilgi[0];
  const trB = `«${bil.tr}»`;
  const frB = `«${NB}${bil.fr}${NB}»`;
  return g === '9-13'
    ? {
      tr: { baslik: 'Nasıl doldurulur?', maddeler: [
        '1. Her satırı oku ve sana en uygun yüzü seç. Doğrusu yanlışı yok.',
        `2. Bilmiyorsan ${trB}u seç; ezberlerini derste hocan dinleyecek.`,
        '3. Cevapların kendiliğinden kaydedilir; ara verebilir, aynı bağlantıdan devam edebilirsin.',
        '4. Bitirince en alttaki «Bitti» düğmesine bas.'] },
      fr: { baslik: `Comment remplir${NB}?`, maddeler: [
        '1. Lis chaque ligne et choisis le visage qui te correspond. Il n’y a pas de bonne ou de mauvaise réponse.',
        `2. Si tu ne sais pas, choisis ${frB}${NB}; ton enseignant écoutera tes récitations en classe.`,
        `3. Tes réponses sont enregistrées automatiquement${NB}; tu peux faire une pause et reprendre avec le même lien.`,
        `4. À la fin, appuie sur «${NB}Terminé${NB}» tout en bas.`] },
    }
    : {
      tr: { baslik: 'Nasıl doldurulur?', maddeler: [
        '1. Her soruyu çocuğunuza okuyun ve onun cevabını işaretleyin. Doğrusu yanlışı yok.',
        `2. Bilmediği bir şey varsa ${trB}u işaretleyin; ezberleri derste hocası dinleyecek.`,
        '3. Cevaplar kendiliğinden kaydedilir; ara verip aynı bağlantıdan devam edebilirsiniz.',
        '4. Sonunda çocuğunuz sevdiği bir şeyi çizebilir; ardından «Bitti» düğmesine basın.'] },
      fr: { baslik: `Comment remplir${NB}?`, maddeler: [
        '1. Lisez chaque question à votre enfant et cochez sa réponse. Il n’y a pas de bonne ou de mauvaise réponse.',
        `2. S’il ne sait pas, cochez ${frB}${NB}; son enseignant écoutera ses récitations en classe.`,
        `3. Les réponses sont enregistrées automatiquement${NB}; vous pouvez faire une pause et reprendre avec le même lien.`,
        `4. À la fin, votre enfant peut dessiner ce qu’il aime${NB}; appuyez ensuite sur «${NB}Terminé${NB}».`] },
    };
};
/** Ev kipinde hoca için yazılmış metin alanlarının veli sürümü (5–8 ilahi alanı «hocam yazar» diyordu). */
const EV_METIN: Record<string, Ikili> = {
  ilahi: { tr: 'Bildiği ilahiler (isterseniz yazın)', fr: 'Chants religieux qu’il connaît (facultatif)' },
};

type Gorunum = 'bugun' | 'liste';
type Sutun = 'ikisi' | 'hoca' | 'ben';
type Filtre = 'kalan' | 'tumu' | 'tamam';
type OgrDurum = 'yok' | 'yarim' | 'tamam';
const OGR_DURUM_ADI: Record<OgrDurum, string> = { yok: tV('liste.durum.yok'), yarim: tV('liste.durum.yarim'), tamam: tV('liste.durum.tamam') };
/** Arama için: küçük harf, aksan ve Türkçe i/ı farkı yok (örn. «ozge» ↔ «Özge», «ibrahim» ↔ «Ibrahim»). */
const arama = (x: string) => x.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
type FormDurumu = {
  ref: string; grup: Grup; oturum: Oturum; sayfa: number; program: Program | null | undefined; programAcik: boolean;
  ogrenciKipi: boolean; bitti: boolean; hedefGoster: boolean;
};

export function envanterPaneli(kok: HTMLElement, s: EnvanterPaneliSecenek): { temizle(): void; ayrilabilir(): boolean } {
  const depo = envanterDeposu(tamFirestore(s.app), s.bugun, s.uid, s.yollar);
  const ac = new AbortController();
  let gorunum: Gorunum = 'bugun';
  let gorunumSecildi = false;
  /** Bağlantı sayfasında (dinleyerek kayıt) varsayılan süzgeç «Kalan»; hoca ekranında eskisi gibi «Tümü». */
  let filtre: Filtre = s.yollar ? 'kalan' : 'tumu';
  let aranan = '';
  let sutun: Sutun = 'ikisi';
  let gecmisVar = false;
  const programlar = new Map<string, Promise<Program | null>>();
  let form: FormDurumu | null = null;
  let bilgi = '';
  let bilgiTur = '';
  let kapali = false;
  let overlay: HTMLElement | null = null;
  const ev = s.ev;
  /** Ev kipinde sayfa dili Fransızca olabilir; Türkçe etiketler yine de tr diye işaretlenir (ekran okuyucu). Hoca ekranında boş. */
  const trL = ev ? ' lang="tr"' : '';
  /** Ev kipi velinin ekranıdır (içerik TR + FR): ortak çizim kodundaki arayüz metni orada Türkçe kalır. Hoca ekranında seçili dil. */
  const T = ev ? tTr : tV;
  let yardimAcik = true;
  let evSonBekleniyor = false;
  try { const k = localStorage.getItem(SUTUN_ANAHTARI); if (k === 'hoca' || k === 'ben') sutun = k; } catch { /* depolama yok: iki sütun */ }
  if (ev) {
    kok.lang = ev.dil === 'fr' ? 'fr' : 'tr';
    try { yardimAcik = localStorage.getItem(EV_YARDIM_ANAHTARI) !== 'kapali'; } catch { /* depolama yok: kart açık başlar */ }
  }

  const ogrenciAdi = (ref: string) => {
    if (ref === TEST_REF) return tV('ogr.deneme');
    const o = s.ogrenciler().find((x) => x.ref === ref);
    return o ? `${o.ad} ${o.soyad}` : ref;
  };
  const satirBilgisi = new Map<string, { satir: Satir; bolum: Bolum }>();
  for (const g of GRUPLAR) for (const sy of MADDELER.gruplar[g].sayfalar) for (const b of sy.bolumler) for (const st of b.satirlar) satirBilgisi.set(st.id, { satir: st, bolum: b });

  /* ───────────── yardımcılar ───────────── */
  type BagAnahtar = 'baglan.limit' | 'baglan.hata' | 'baglan.yukleniyor' | 'baglan.bekliyorKayit' | 'baglan.gonderiliyor' | 'baglan.bekliyorTutulur' | 'baglan.tamam';
  const bagliDurum = (): [string, string, BagAnahtar] => {
    const d = depo.durum();
    const bekle = depo.bekleyenVar();
    if (d.hata) return ['hata', 'uyari', d.hataKodu === 'resource-exhausted' ? 'baglan.limit' : 'baglan.hata'];
    if (!d.hazir) return ['', 'saat', 'baglan.yukleniyor'];
    if (bekle && d.onbellekten) return ['bekliyor', 'bulutYok', 'baglan.bekliyorKayit'];
    if (bekle) return ['', 'bulut', 'baglan.gonderiliyor'];
    if (d.onbellekten) return ['bekliyor', 'bulutYok', 'baglan.bekliyorTutulur'];
    return ['tamam', 'bulut', 'baglan.tamam'];
  };
  /** trKip: veli (ev kipi) ve öğrenci kipi ekranları Türkçe kalır; hoca ekranı seçili dilde. */
  const rozetHtml = (trKip = Boolean(ev)) => {
    const [tur, ikon, anahtar] = bagliDurum();
    return `<span class="env-baglanti ${tur}">${simge(ikon)}<span>${esc((trKip ? tTr : tV)(anahtar))}</span></span>`;
  };
  /** Yapışkan çubuktaki kısa kayıt durumu (telefonda uzun metin sığmaz); ekran okuyucuya canlı bölge. */
  const kisaHtml = () => {
    const [tur, ikon, anahtar] = bagliDurum();
    const kisa = tur === 'hata' ? tV('baglan.kHata') : tur === 'bekliyor' ? tV('baglan.kBekliyor') : anahtar === 'baglan.gonderiliyor' ? tV('baglan.kGonderiliyor') : anahtar === 'baglan.yukleniyor' ? tV('baglan.yukleniyor') : tV('baglan.kTamam');
    return `<span class="env-baglanti ${tur}">${simge(ikon)}<span>${esc(kisa)}</span></span>`;
  };
  const durumGuncelle = () => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-env-baglanti]')) if (kok.contains(el) || overlay?.contains(el)) el.innerHTML = rozetHtml(Boolean(ev) || Boolean(overlay?.contains(el)));
    for (const el of kok.querySelectorAll<HTMLElement>('[data-env-baglanti-kisa]')) el.innerHTML = kisaHtml();
  };
  const bilgiYaz = (m: string, tur = '') => { bilgi = m; bilgiTur = tur; const el = kok.querySelector<HTMLElement>('[data-env-bilgi]'); if (el) { el.textContent = m; el.className = `env-bilgi ${tur}`; el.hidden = !m; } };
  const hataMetni = (e: Error) => (e.message === ENVANTER_CAKISMA
    ? T('hata.cakisma')
    : T('hata.gonderilemedi'));

  /* ───────────── görünümler ───────────── */
  const bugunHtml = () => {
    const sira = depo.gunSirasi();
    if (!sira || !sira.adimlar.length) return `<p class="env-bos">${simge('form')}<span>${tV('bugun.bos', { gun: gunYaz(s.bugun) })}</span></p><button type="button" class="env-dugme birincil" data-env-gorunum="liste">${tV('bugun.listeAc')}</button>`;
    const yapilan = sira.adimlar.filter((a) => sira.yapildi[a.id]).length;
    const hazir = depo.durum().hazir;
    const adimlar = [...sira.adimlar].sort((x, y) => x.saat.localeCompare(y.saat) || x.ders - y.ders);
    return `<p class="env-ozet"><b>${yapilan}/${sira.adimlar.length}</b> ${tV('bugun.adimTamam')}</p><ol class="env-sira">${adimlar.map((a) => {
      const bitti = Boolean(sira.yapildi[a.id]);
      const ad = a.ref ? ogrenciAdi(a.ref) : '';
      const eylem = a.ref && (a.is === 'form' || a.is === 'dogrulama' || a.is === 'hedef')
        ? `<button type="button" class="env-dugme" data-env-ac="${esc(a.ref)}" data-grup="${a.grup ?? ''}" data-env-is="${esc(a.is)}"${hazir ? '' : ' disabled'}>${simge(a.is === 'hedef' ? 'hedef' : 'form')}${a.is === 'hedef' ? tV('bugun.programAc') : tV('bugun.formAc')}</button>` : '';
      return `<li class="env-adim${bitti ? ' bitti' : ''}" data-env-adim="${esc(a.id)}">
        <button type="button" class="env-tik" data-env-tik="${esc(a.id)}" aria-pressed="${bitti}" aria-label="${tV('bugun.tikAria', { ozet: esc(`${a.saat} ${ad} ${a.aciklama_tr}`) })}">${simge('onay')}</button>
        <div class="env-adim-govde"><p class="env-adim-ust"><b>${esc(a.saat)}</b> · ${tV('bugun.ders', { n: a.ders })} · ${esc(IS_ADI[a.is] || a.is)}${a.sure_dk ? ` · ${tV('bugun.dk', { n: a.sure_dk })}` : ''}</p>
          <p class="env-adim-ad">${esc(ad || tV('ogr.sinif'))}${a.grup ? ` <span class="env-grup">${esc(grupAdi(a.grup))}</span>` : ''}</p>
          <p class="env-adim-not">${esc(a.aciklama_tr)}</p>${eylem}</div></li>`;
    }).join('')}</ol>`;
  };

  /** Öğrencinin durumu: hiçbir formu yok → yok · en az biri tamam (hoca «tamam» dedi ya da her satır doğrulandı) → tamam · gerisi yarım. */
  const ogrDurumu = (ref: string): OgrDurum => {
    const bl = GRUPLAR.map((g) => ({ g, b: enYeni(depo.belgeler().values(), ref, g) })).filter((x) => x.b);
    if (!bl.length) return 'yok';
    return bl.some(({ g, b }) => b!.durum === 'tamam' || rozet(b, g) === 'dolu') ? 'tamam' : 'yarim';
  };
  const SIRA_DURUM: Record<OgrDurum, number> = { yarim: 0, yok: 1, tamam: 2 };
  const listeIcerikHtml = () => {
    const tum = s.ogrenciler().map((o) => ({ ref: o.ref, ad: `${o.ad} ${o.soyad}`, d: ogrDurumu(o.ref) }));
    const say = { yok: 0, yarim: 0, tamam: 0 };
    for (const o of tum) say[o.d]++;
    const q = arama(aranan.trim());
    const gorunen = tum
      .filter((o) => (filtre === 'tumu' ? true : filtre === 'tamam' ? o.d === 'tamam' : o.d !== 'tamam') && (!q || arama(o.ad).includes(q)))
      .sort((a, b) => SIRA_DURUM[a.d] - SIRA_DURUM[b.d]);
    const deneme = filtre === 'tumu' && !q ? [{ ref: TEST_REF, ad: tV('ogr.denemeUzun'), d: ogrDurumu(TEST_REF) }] : [];
    const kart = (o: { ref: string; ad: string; d: OgrDurum }) => {
      const belgeler = GRUPLAR.map((g) => ({ g, b: enYeni(depo.belgeler().values(), o.ref, g) }));
      const var_ = belgeler.filter((x) => x.b);
      const rozetler = var_.map(({ g, b }) => {
        const r = rozet(b, g); const i = ilerleme(b, g);
        return `<button type="button" class="env-rozet r-${r}" data-env-ac="${esc(o.ref)}" data-grup="${g}" aria-label="${esc(tV('liste.rozetAria', { ad: o.ad, grup: grupAdi(g), durum: ROZET_ADI[r] }))}">
          <b>${esc(grupAdi(g))}</b><span>${ROZET_ADI[r]}</span><small>${tV('liste.rozetIlerleme', { ben: i.ben, toplam: i.toplam, hoca: i.hoca })}</small></button>`;
      }).join('');
      const baslat = var_.length ? '' : GRUPLAR.map((g) => `<button type="button" class="env-rozet r-yok" data-env-ac="${esc(o.ref)}" data-grup="${g}"><b>${esc(grupAdi(g))}</b><span>${tV('liste.baslat')}</span></button>`).join('');
      return `<li class="env-ogr-kart d-${o.d}" data-env-ogr="${esc(o.ref)}" data-env-ogr-durum="${o.d}"><p class="env-ogr-ad">${esc(o.ad)} <span class="env-ogr-durum d-${o.d}">${OGR_DURUM_ADI[o.d]}</span></p><div class="env-rozetler">${rozetler}${baslat}</div></li>`;
    };
    const bos = !gorunen.length && !deneme.length ? `<p class="env-bos">${simge('form')}<span>${q ? tV('liste.bosAd') : filtre === 'kalan' ? tV('liste.bosKalan') : tV('liste.bosSuzgec')}</span></p>` : '';
    return `<p class="env-ozet" role="status" aria-live="polite" data-env-liste-ozet><b>${tum.length}</b> ${tV('liste.ozetOgrenci', { n: tum.length })} <b>${say.tamam}</b> ${tV('liste.durum.tamam')} · <b>${say.yarim}</b> ${tV('liste.durum.yarim')} · <b>${say.yok}</b> ${tV('liste.durum.yok')}</p>${bos}<ul class="env-liste">${[...gorunen, ...deneme].map(kart).join('')}</ul>`;
  };
  const listeHtml = () => {
    if (!depo.durum().hazir) return `<p class="env-bos">${simge('saat')}<span>${tV('liste.yukleniyor')}</span></p>`;
    const f = (k: Filtre, ad: string) => `<button type="button" class="env-filtre" data-env-filtre="${k}" aria-pressed="${filtre === k}">${ad}</button>`;
    return `<div class="env-arac"><div class="env-filtreler" role="group" aria-label="${tV('liste.suzgec')}">${f('kalan', tV('liste.kalan'))}${f('tumu', tV('liste.tumu'))}${f('tamam', tV('liste.tamam'))}</div>
      <label class="env-ara"><span class="env-gizli">${tV('liste.ara')}</span><input type="search" data-env-ara placeholder="${tV('liste.ara')}" autocomplete="off" enterkeyhint="search" value="${esc(aranan)}"></label></div>
      <div data-env-liste-kap>${listeIcerikHtml()}</div>`;
  };
  const listeYenile = () => { const kap = kok.querySelector<HTMLElement>('[data-env-liste-kap]'); if (kap) kap.innerHTML = listeIcerikHtml(); };

  /* ───────────── satır, kutu, metin parçaları ───────────── */
  const yuzDugmesi = (st: Satir, bolum: Bolum, i: number, sutun: 'ben' | 'hoca', deger: number | undefined, ogrenciKipi: boolean) => {
    const e = MADDELER.olcekler[bolum.olcek][i];
    const sec = deger === i;
    const alan = sutun === 'ben' ? 'data-ben' : 'data-hoca-d';
    return `<button type="button" class="env-yuz ${sutun}${sec ? ' secili' : ''}" ${alan}="${esc(st.id)}" data-deger="${i}" aria-pressed="${sec}" aria-label="${esc(`${st.tr}: ${e.tr}`)}">
      <span class="env-yuz-svg">${MADDELER.yuzler[i]}</span><span class="env-etiket"><b${trL}>${esc(e.tr)}</b>${ogrenciKipi ? `<i lang="fr">${fr(e.fr)}</i>` : ''}</span></button>`;
  };
  const satirHtml = (st: Satir, bolum: Bolum, ogrenciKipi: boolean) => {
    const b = form!.oturum.belge;
    const ad = `<h4 class="env-ad"><span lang="tr">${esc(st.tr)}</span><span class="env-ad-fr" lang="fr">${fr(st.fr)}</span>${st.ar ? `<span class="env-ar" lang="ar" dir="rtl">${esc(st.ar)}</span>` : ''}</h4>`;
    const benSira = [0, 1, 2].map((i) => yuzDugmesi(st, bolum, i, 'ben', b.ben[st.id], ogrenciKipi)).join('');
    if (ogrenciKipi) return `<section class="env-satir" data-satir="${esc(st.id)}">${ad}<div class="env-yuzler" role="group" aria-label="${esc(st.tr)}">${benSira}</div></section>`;
    const hocaSira = [0, 1, 2].map((i) => yuzDugmesi(st, bolum, i, 'hoca', b.hoca[st.id], false)).join('');
    const benBlok = `<p class="env-sutun">${form!.grup === '5-8' ? tV('sutun.ogrenciCocuk') : tV('form.ozOgr')}</p><div class="env-yuzler" role="group" aria-label="${esc(tV('sutun.ogrAria', { satir: st.tr }))}">${benSira}</div>`;
    const hocaBlok = `<p class="env-sutun hoca">${tV('sutun.hoca')}</p><div class="env-yuzler" role="group" aria-label="${esc(tV('sutun.hocaAria', { satir: st.tr }))}">${hocaSira}</div>`;
    return `<section class="env-satir" data-satir="${esc(st.id)}">${ad}${sutun !== 'hoca' ? benBlok : ''}${sutun !== 'ben' ? hocaBlok : ''}</section>`;
  };
  const bolumHtml = (b: Bolum, ogrenciKipi: boolean) => `<div class="env-bolum"><h3 class="env-bolum-bas"><span${trL}>${esc(b.tr)}</span><span class="env-fr" lang="fr">${fr(b.fr)}</span></h3>${b.satirlar.map((st) => satirHtml(st, b, ogrenciKipi)).join('')}</div>`;

  const kutuHtml = (k: Kutu) => {
    const secili = (form!.oturum.belge.kutular[k.anahtar] || []).map(String);
    return `<fieldset class="env-kutu"><legend><span${trL}>${esc(k.tr)}</span><span class="env-fr" lang="fr">${fr(k.fr)}</span></legend><div class="env-secenekler">${k.secenekler.map((o) => {
      const sec = secili.includes(String(o.anahtar));
      return `<button type="button" class="env-secenek${sec ? ' secili' : ''}" data-kutu="${esc(k.anahtar)}" data-sec="${esc(o.anahtar)}" aria-pressed="${sec}"><span class="env-onay">${sec ? simge('onay') : ''}</span><span><b${trL}>${esc(o.tr)}</b>${o.fr !== o.tr ? `<i lang="fr">${fr(o.fr)}</i>` : ''}</span></button>`;
    }).join('')}</div></fieldset>`;
  };
  const metinHtml = (m: MetinAlani) => {
    const v = form!.oturum.belge.metin[m.alan];
    const etiket = `<span${trL}>${esc(m.tr)}</span><span class="env-fr" lang="fr">${fr(m.fr)}</span>`;
    if (m.liste) {
      const dizi = Array.isArray(v) ? v : [];
      return `<fieldset class="env-alan"><legend>${etiket}</legend>${Array.from({ length: m.satir }, (_, i) => `<input type="text" maxlength="160" data-metin="${esc(m.alan)}" data-idx="${i}" value="${esc(dizi[i] ?? '')}" aria-label="${esc(`${m.tr} ${i + 1}`)}">`).join('')}</fieldset>`;
    }
    return `<label class="env-alan">${etiket}<input type="text" maxlength="200" data-metin="${esc(m.alan)}" value="${esc(typeof v === 'string' ? v : '')}"></label>`;
  };

  /* ───────────── hoca formu ───────────── */
  const programHtml = () => {
    const f = form!;
    if (f.program === undefined) return `<p class="env-bilgi">${tV('program.okunuyor')}</p>`;
    if (!f.program) return `<p class="env-bilgi">${tV('program.yok')}</p>`;
    const p = f.program;
    return `<div class="env-program"><p class="env-ozet"><span class="env-grup ${p.durum}">${p.durum === 'onayli' ? tV('program.onayli') : tV('program.taslak')}</span> ${esc(p.donem)}</p>
      ${p.ogrenciye_tr ? `<blockquote class="env-ogrenciye"><p lang="tr">${esc(p.ogrenciye_tr)}</p><p lang="fr">${fr(p.ogrenciye_fr)}</p></blockquote>` : ''}
      ${p.hedefler.map((h) => `<section class="env-hedef"><h4>${esc(h.baslik_tr)} <span class="env-fr" lang="fr">${fr(h.baslik_fr)}</span></h4><p class="env-neden">${esc(h.neden_tr)}</p>
        <ul>${h.haftalar.map((w) => `<li><b>${esc(gunYaz(w.tarih, { day: 'numeric', month: 'long' }))}</b> · ${tV('program.derste')} ${esc(w.derste_tr)} · ${tV('program.evde')} ${esc(w.evde_tr)}${w.hoca_dinler_tr ? ` · <em>${tV('program.hocaDinler')} ${esc(w.hoca_dinler_tr)}</em>` : ''}</li>`).join('')}</ul></section>`).join('')}</div>`;
  };

  const okumaHocaHtml = (g: Grup) => {
    const b = form!.oturum.belge;
    const n = MADDELER.gruplar[g].okuma_adet;
    const dugmeler = (anahtar: string, bas: number, secili: number | undefined) => Array.from({ length: n - bas + 1 }, (_, i) => i + bas)
      .map((i) => `<button type="button" class="env-secenek kucuk${secili === i ? ' secili' : ''}" ${anahtar}="${i}" aria-pressed="${secili === i}"><b>${i}</b></button>`).join('');
    const ticked = (b.kutular.okuma || []).map(Number).filter((x) => x >= 1 && x <= n).sort();
    return `<section class="env-okuma-hoca"><h3 class="env-bolum-bas"><span>${tV('okuma.baslik')}</span></h3>
      <p class="env-sutun hoca">${tV('okuma.dinledigim')}</p><div class="env-secenekler">${dugmeler('data-okuma-bas', 0, b.okuma.basamak)}</div>
      <p class="env-sutun hoca">${tV('okuma.sonraki')}</p><div class="env-secenekler">${dugmeler('data-okuma-sonraki', 1, b.okuma.sonraki)}</div>
      ${b.metin.hoca_basamak ? `<p class="env-bilgi">${tV('okuma.kagit')} ${esc(b.metin.hoca_basamak)}</p>` : ''}
      ${ticked.map((i) => `<label class="env-alan"><span>${tV('okuma.not', { n: i })}</span><input type="text" maxlength="80" data-okuma-not="${i}" value="${esc(b.okuma_notlari[String(i)] ?? '')}"></label>`).join('')}</section>`;
  };

  const notlarHtml = () => {
    const b = form!.oturum.belge;
    const t = (a: string) => (typeof b.metin[a] === 'string' ? (b.metin[a] as string) : '');
    return `<section class="env-notlar"><h3 class="env-bolum-bas"><span>${tV('not.baslik')}</span><span class="env-fr" lang="fr">Note de l’enseignant</span></h3>
      <label class="env-alan"><span>${tV('not.turkce')}</span><textarea rows="4" maxlength="800" data-metin="hoca_notu">${esc(t('hoca_notu'))}</textarea></label>
      <label class="env-alan"><span>${tV('not.fransizca')}</span><textarea rows="3" maxlength="800" data-metin="hoca_notu_fr" lang="fr">${esc(t('hoca_notu_fr'))}</textarea></label>
      <label class="env-alan"><span>${tV('not.dogrulamaTarihi')}</span><input type="text" inputmode="text" maxlength="10" data-metin="dogrulama_tarihi" value="${esc(t('dogrulama_tarihi'))}" placeholder="${esc(s.bugun)}"></label>
      <div class="env-satir-dugmeler"><button type="button" class="env-dugme" data-env-dogrulama-bugun>${tV('not.dogrulamaBugun')}</button>
        <button type="button" class="env-dugme birincil${b.durum === 'tamam' ? ' secili' : ''}" data-env-tamam aria-pressed="${b.durum === 'tamam'}">${simge('onay')}${b.durum === 'tamam' ? tV('not.tamamGeri') : tV('not.tamamYap')}</button></div></section>`;
  };

  const cizimHtml = (sy: Sayfa) => {
    if (!sy.cizim) return '';
    const b = form!.oturum.belge;
    return `<section class="env-cizim"><h3 class="env-bolum-bas"><span${trL}>${esc(sy.cizim.tr)}</span><span class="env-fr" lang="fr">${fr(sy.cizim.fr)}</span></h3>
      <canvas class="env-tuval" width="640" height="360" data-env-tuval aria-label="${T('cizim.aria')}"></canvas>
      <div class="env-satir-dugmeler"><button type="button" class="env-dugme" data-env-cizim-sil><span>${T('cizim.sil')}</span>${ev ? `<span class="env-fr" lang="fr">Effacer le dessin</span>` : ''}</button></div>${b.cizim ? '' : ''}</section>`;
  };

  const sayfaHtml = (sy: Sayfa, g: Grup) => {
    const f = form!;
    const b = f.oturum.belge;
    const son = sy.no === MADDELER.gruplar[g].sayfalar.length;
    const kutular = sy.kutular.filter((k) => k.anahtar !== 'okuma' && k.anahtar !== 'alt');
    const okumaKutu = sy.kutular.filter((k) => k.anahtar === 'okuma' || k.anahtar === 'alt');
    const dinledi = Boolean(b.sayfaDinlendi[String(sy.no)]);
    return `${sy.no === 1 ? okumaHocaHtml(g) : ''}
      ${sayfaSatirlari(sy).length ? sy.bolumler.map((bl) => bolumHtml(bl, false)).join('') : ''}
      ${kutular.map(kutuHtml).join('')}${sy.metin.map(metinHtml).join('')}${okumaKutu.map(kutuHtml).join('')}${cizimHtml(sy)}
      ${son ? notlarHtml() : ''}
      <button type="button" class="env-dugme dinledim${dinledi ? ' secili' : ''}" data-env-dinledim="${sy.no}" aria-pressed="${dinledi}">${simge('onay')}${tV('sayfa.dinledim')}${dinledi ? ' ✓' : ''}</button>
      <div class="env-sayfa-gez">${sy.no > 1 ? `<button type="button" class="env-dugme" data-env-onceki>${simge('geri')}${tV('sayfa.onceki')}</button>` : ''}${son
        ? `<button type="button" class="env-dugme birincil" data-env-geri>${simge('onay')}${tV('sayfa.listeyeDon')}</button>`
        : `<button type="button" class="env-dugme birincil" data-env-sonraki>${tV('sayfa.sonraki')}${simge('ok')}</button>`}</div>`;
  };

  const formHtml = () => {
    const f = form!;
    const sayfalar = MADDELER.gruplar[f.grup].sayfalar;
    const sy = sayfalar.find((x) => x.no === f.sayfa) || sayfalar[0];
    const i = ilerleme(f.oturum.belge, f.grup);
    return `<div class="env-form">
      <div class="env-bar"><button type="button" class="env-dugme geri" data-env-geri>${simge('geri')}${tV('form.liste')}</button>
        <p class="env-baslik"><b>${esc(ogrenciAdi(f.ref))}</b> <span class="env-grup">${esc(grupAdi(f.grup))}</span></p>
        <span class="env-kisa" role="status" aria-live="polite" data-env-baglanti-kisa>${kisaHtml()}</span></div>
      <p class="env-ozet">${tV('form.ozOgr')} <b>${i.ben}/${i.toplam}</b> · ${tV('form.ozHoca')} <b>${i.hoca}/${i.toplam}</b> · ${tV('form.ozSayfa')} <b>${i.dinlenen}/${i.sayfa}</b>${f.oturum.belge.kaynak !== 'online' ? ` · ${tV('form.ozKagit')}` : ''}</p>
      <div class="env-kipler">${f.grup === '9-13' ? `<button type="button" class="env-dugme birincil" data-env-ogr-ac>${simge('kilit')}${tV('form.ogrKipi')}</button>` : `<span class="env-bilgi">${tV('form.kucuk')}</span>`}
        <button type="button" class="env-dugme${f.programAcik ? ' secili' : ''}" data-env-program aria-pressed="${f.programAcik}">${simge('hedef')}${tV('form.program')}</button></div>
      ${f.programAcik ? programHtml() : ''}
      <div class="env-sutun-sec" role="group" aria-label="${tV('form.sutunAria')}"><span class="env-sutun-etiket">${tV('form.goster')}</span>${([['ikisi', tV('form.sutunIkisi')], ['hoca', tV('form.sutunHoca')], ['ben', tV('form.sutunOgr')]] as const).map(([k, ad]) => `<button type="button" class="env-dugme env-sutun-dugme" data-env-sutun="${k}" aria-pressed="${sutun === k}">${ad}</button>`).join('')}</div>
      <nav class="env-sayfalar" aria-label="${tV('form.sayfalarAria')}">${sayfalar.map((x) => `<button type="button" class="env-sayfa-dugme${x.no === sy.no ? ' secili' : ''}" data-env-sayfa="${x.no}" aria-current="${x.no === sy.no}">${x.no}${f.oturum.belge.sayfaDinlendi[String(x.no)] ? ' ✓' : ''}</button>`).join('')}</nav>
      ${sayfaHtml(sy, f.grup)}</div>`;
  };

  /* ───────────── öğrenci kipi (tam ekran, kilitli) ───────────── */
  const ogrenciSatirlari = (g: Grup) => MADDELER.gruplar[g].sayfalar.flatMap((x) => x.bolumler.flatMap((b) => b.satirlar));
  const ogrenciIcerik = () => {
    const f = form!;
    const sayfalar = MADDELER.gruplar[f.grup].sayfalar;
    const kutular = sayfalar.flatMap((x) => x.kutular);
    const tanima = kutular.filter((k) => k.anahtar !== 'okuma' && k.anahtar !== 'alt');
    const okuma = kutular.filter((k) => k.anahtar === 'okuma' || k.anahtar === 'alt');
    const metinler = sayfalar.flatMap((x) => x.metin);
    const bolumler = sayfalar.flatMap((x) => x.bolumler);
    return `<div class="env-ogr-giris"><h2><span>Neler biliyorum?</span><span class="env-fr" lang="fr">Ce que je sais</span></h2>
      <p>Her satırda kendine en uygun yüzü seç. Doğrusu yanlışı yok.</p><p class="env-fr" lang="fr">Sur chaque ligne, choisis le visage qui te correspond. Il n’y a pas de bonne ou de mauvaise réponse.</p></div>
      ${bolumler.map((b) => bolumHtml(b, true)).join('')}
      <div class="env-ogr-ek"><h3 class="env-bolum-bas"><span>Kendimi tanıtıyorum</span><span class="env-fr" lang="fr">Je me présente</span></h3>${tanima.map(kutuHtml).join('')}${metinler.map(metinHtml).join('')}${okuma.map(kutuHtml).join('')}</div>
      <div class="env-bitir"><button type="button" class="env-dugme birincil buyuk" data-env-bitti>${simge('onay')}<span>Bitti</span><span class="env-fr" lang="fr">Terminé</span></button></div>`;
  };
  const ogrenciIlerleme = () => {
    const f = form!;
    const tum = ogrenciSatirlari(f.grup);
    const say = tum.filter((x) => x.id in f.oturum.belge.ben).length;
    return { say, toplam: tum.length, yuzde: tum.length ? Math.round((say / tum.length) * 100) : 0 };
  };
  const ogrenciIlerlemeHtml = () => {
    const p = ogrenciIlerleme();
    return `<div class="env-cubuk" role="progressbar" aria-valuemin="0" aria-valuemax="${p.toplam}" aria-valuenow="${p.say}" aria-label="İlerleme"><span class="yz-${Math.max(0, Math.min(100, Math.round(p.yuzde)))}"></span></div><span class="env-sayac">${p.say}/${p.toplam}</span>`;
  };
  const ogrenciKabuk = () => {
    const f = form!;
    const p = f.program;
    const hedef = p && p.durum === 'onayli';
    const govde = f.hedefGoster && hedef && p
      ? `<div class="env-ogr-son"><h2><span>Benim hedeflerim</span><span class="env-fr" lang="fr">Mes objectifs</span></h2>
          <p class="env-ogr-metin" lang="tr">${esc(p.ogrenciye_tr)}</p><p class="env-ogr-metin env-fr" lang="fr">${fr(p.ogrenciye_fr)}</p>
          <button type="button" class="env-dugme buyuk" data-env-hedef-kapat>${simge('geri')}<span>Geri</span><span class="env-fr" lang="fr">Retour</span></button></div>`
      : f.bitti
        ? `<div class="env-ogr-son"><h2><span>Bitti</span><span class="env-fr" lang="fr">C’est fini</span></h2>
            <p class="env-ogr-metin">Telefonu hocana ver.</p><p class="env-ogr-metin env-fr" lang="fr">Rends le téléphone à ton enseignant.</p>
            ${hedef ? `<button type="button" class="env-dugme birincil buyuk" data-env-hedef>${simge('hedef')}<span>Benim hedeflerim</span><span class="env-fr" lang="fr">Mes objectifs</span></button>` : ''}</div>`
        : `<div class="env-ogr-liste" data-kaydirma>${ogrenciIcerik()}</div>`;
    return `<header class="env-ogr-ust"><button type="button" class="env-kilit" data-env-kilit aria-label="Çıkmak için 2 saniye basılı tut">${simge('kilit')}<span class="env-halka"></span></button>
        <div class="env-ogr-ilerleme" data-env-ilerleme>${f.bitti ? '' : ogrenciIlerlemeHtml()}</div><span class="env-baglanti-kap" data-env-baglanti>${rozetHtml()}</span></header>${govde}`;
  };
  const ogrenciCiz = () => {
    if (!overlay || !form) return;
    const eski = overlay.querySelector<HTMLElement>('[data-kaydirma]');
    const y = eski?.scrollTop ?? 0;
    overlay.innerHTML = ogrenciKabuk();
    const yeni = overlay.querySelector<HTMLElement>('[data-kaydirma]');
    if (yeni) yeni.scrollTop = y;
  };
  const ogrenciKipiAc = () => {
    if (!form || form.grup !== '9-13') return;
    form.ogrenciKipi = true; form.bitti = false; form.hedefGoster = false;
    overlay = document.createElement('div');
    overlay.className = 'env-ogr env-kok';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Neler biliyorum? — öğrenci formu');
    overlay.lang = 'tr';
    document.body.append(overlay);
    document.documentElement.classList.add('env-kilitli');
    baglaOlaylar(overlay);
    ogrenciCiz();
  };
  const ogrenciKipindenCik = () => {
    if (!form) return;
    form.ogrenciKipi = false; form.oturum.gonder();
    overlay?.remove(); overlay = null;
    document.documentElement.classList.remove('env-kilitli');
    ciz();
  };

  /* ───────────── ev kipi (veli bağlantısı, 1 Kasım 2026) ───────────── */
  // Tek sayfa, tek öğrenci: öğrenci kipinin satır çizimi (yalnız «ben» sütunu, TR + FR etiket) yeniden kullanılır; hoca sütunu,
  // okuma basamağı, hoca notları, doğrulama tarihi, «sayfayı dinledim» ve «formu tamamlandı say» hiç çizilmez.
  const evYardimHtml = () => {
    const y = evYardim(ev!.grup);
    const sira: ('tr' | 'fr')[] = ev!.dil === 'fr' ? ['fr', 'tr'] : ['tr', 'fr'];
    return `<details class="env-ev-yardim" data-env-yardim${yardimAcik ? ' open' : ''}>
      <summary>${simge('form')}${sira.map((d) => `<span lang="${d}">${esc(y[d].baslik)}</span>`).join('<span class="env-ev-ayrac" aria-hidden="true"> / </span>')}</summary>
      ${sira.map((d) => `<div class="env-ev-yardim-dil" lang="${d}" data-yardim-dil="${d}">${y[d].maddeler.map((m) => `<p>${esc(m)}</p>`).join('')}</div>`).join('')}</details>`;
  };
  const evIcerik = () => {
    const f = form!;
    const sayfalar = MADDELER.gruplar[f.grup].sayfalar;
    const kutular = sayfalar.flatMap((x) => x.kutular);
    const tanima = kutular.filter((k) => k.anahtar !== 'okuma' && k.anahtar !== 'alt');
    const okuma = kutular.filter((k) => k.anahtar === 'okuma' || k.anahtar === 'alt');
    // hoca için yazılmış metin alanı yalnız veli sürümü varsa gösterilir; yoksa hiç çizilmez
    const metinler = sayfalar.flatMap((x) => x.metin).flatMap((m): MetinAlani[] => (m.hoca ? (EV_METIN[m.alan] ? [{ ...m, ...EV_METIN[m.alan] }] : []) : [m]));
    const cizimli = sayfalar.find((x) => x.cizim);
    const ek = `${tanima.map(kutuHtml).join('')}${metinler.map(metinHtml).join('')}${okuma.map(kutuHtml).join('')}${cizimli ? cizimHtml(cizimli) : ''}`;
    return `${sayfalar.flatMap((x) => x.bolumler).map((b) => bolumHtml(b, true)).join('')}
      <div class="env-ogr-ek env-ev-ek">${f.grup === '9-13' ? '<h3 class="env-bolum-bas"><span lang="tr">Kendimi tanıtıyorum</span><span class="env-fr" lang="fr">Je me présente</span></h3>' : ''}${ek}</div>
      <div class="env-bitir"><button type="button" class="env-dugme birincil buyuk" data-env-ev-bitti>${simge('onay')}<span lang="tr">Bitti</span><span class="env-fr" lang="fr">Terminé</span></button></div>`;
  };
  const evSonHtml = () => {
    const f = form!;
    const bekliyor = depo.bekleyenVar() || f.oturum.bekliyor();
    const yazi = bekliyor
      ? { tr: 'Kayıtlar gönderiliyor… İnternet gelince kendiliğinden gider, sayfayı kapatmayın.', fr: `Envoi en cours… Les réponses partiront dès que la connexion revient${NB}; ne fermez pas la page.` }
      : f.grup === '9-13'
        ? { tr: 'Teşekkürler! Formun hocana ulaştı.', fr: `Merci${NB}! Ton formulaire est bien envoyé à ton enseignant.` }
        : { tr: 'Teşekkürler! Form hocaya ulaştı.', fr: `Merci${NB}! Le formulaire est bien envoyé à l’enseignant.` };
    return `<div class="env-ogr-son env-ev-son" role="status" aria-live="polite" data-env-ev-son="${bekliyor ? 'bekliyor' : 'tamam'}">
      <p class="env-ogr-metin" lang="tr">${esc(yazi.tr)}</p><p class="env-ogr-metin env-fr" lang="fr">${esc(yazi.fr)}</p>
      <button type="button" class="env-dugme buyuk" data-env-ev-geri>${simge('geri')}<span lang="tr">Geri dön, düzelt</span><span class="env-fr" lang="fr">Revenir et corriger</span></button></div>`;
  };
  const evHtml = () => {
    const f = form;
    if (!f) {
      const hata = depo.durum().hata;
      return `<p class="env-bos" role="${hata ? 'alert' : 'status'}">${simge(hata ? 'uyari' : 'saat')}<span>${hata ? 'Form açılamadı (bağlantı ya da yetki). Sayfayı yenileyin.' : 'Yükleniyor…'}</span></p>`;
    }
    return f.bitti ? evSonHtml() : `${evYardimHtml()}<div class="env-ev-form">${evIcerik()}</div>`;
  };
  /** Bitti'den sonra bekleyen yazım bitene kadar son ekranı tazeler (anlık görüntü ile yazım sayacı aynı anda dönmeyebilir). */
  const evSonuBekle = () => {
    if (evSonBekleniyor) return;
    evSonBekleniyor = true;
    const bak = () => {
      if (kapali || !form?.bitti) { evSonBekleniyor = false; return; }
      ciz();
      if (depo.bekleyenVar() || form.oturum.bekliyor()) setTimeout(bak, 600);
      else evSonBekleniyor = false;
    };
    setTimeout(bak, 300);
  };

  /* ───────────── çizim (5–8, parmak) ───────────── */
  const tuvalBaglan = () => {
    const tuval = kok.querySelector<HTMLCanvasElement>('[data-env-tuval]');
    if (!tuval || !form) return;
    const ctx = tuval.getContext('2d');
    if (!ctx) return;
    const f = form;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tuval.width, tuval.height);
    const mevcut = f.oturum.belge.cizim;
    if (mevcut) {
      // CSP: img-src 'data:' gerektirmesin — data adresi elle Blob'a çevrilir, createImageBitmap ile çizilir (blob: da gerekmez).
      const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(mevcut);
      if (m) {
        try {
          const ikili = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
          const bayt = Uint8Array.from(ikili, (c) => c.charCodeAt(0));
          createImageBitmap(new Blob([bayt], { type: m[1] })).then((bmp) => { ctx.drawImage(bmp, 0, 0, tuval.width, tuval.height); bmp.close?.(); }, () => {});
        } catch { /* bozuk kayıt: boş tuval */ }
      }
    }
    ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a3d9e';
    let cizen = false; let degisti = false;
    const nokta = (e: PointerEvent) => { const r = tuval.getBoundingClientRect(); return [(e.clientX - r.left) * (tuval.width / r.width), (e.clientY - r.top) * (tuval.height / r.height)] as const; };
    tuval.addEventListener('pointerdown', (e) => { cizen = true; const [x, y] = nokta(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke(); tuval.setPointerCapture?.(e.pointerId); e.preventDefault(); }, { signal: ac.signal });
    tuval.addEventListener('pointermove', (e) => { if (!cizen) return; const [x, y] = nokta(e); ctx.lineTo(x, y); ctx.stroke(); degisti = true; }, { signal: ac.signal });
    const bitir = () => {
      if (!cizen) return;
      cizen = false;
      if (!degisti) return;
      degisti = false;
      let url = tuval.toDataURL('image/png');
      if (url.length > CIZIM_SINIRI) { // büyükse yarı çözünürlüğe indir
        const k = document.createElement('canvas'); k.width = tuval.width / 2; k.height = tuval.height / 2;
        k.getContext('2d')?.drawImage(tuval, 0, 0, k.width, k.height);
        url = k.toDataURL('image/png');
      }
      if (url.length > CIZIM_SINIRI) { bilgiYaz(T('cizim.cokBuyuk'), 'hata'); return; }
      f.oturum.ayarla(['cizim'], url); durumGuncelle();
    };
    tuval.addEventListener('pointerup', bitir, { signal: ac.signal });
    tuval.addEventListener('pointercancel', bitir, { signal: ac.signal });
  };

  /* ───────────── çizim ve olaylar ───────────── */
  const govdeHtml = () => {
    if (ev) return evHtml();
    if (form) return formHtml();
    return `<div class="env-gorunum" role="group" aria-label="${tV('gorunum.aria')}">
        <button type="button" class="env-gorunum-dugme" data-env-gorunum="bugun" aria-pressed="${gorunum === 'bugun'}">${tV('gorunum.bugun')}</button>
        <button type="button" class="env-gorunum-dugme" data-env-gorunum="liste" aria-pressed="${gorunum === 'liste'}">${tV('gorunum.ogrenciler')}</button></div>
      ${gorunum === 'bugun' ? bugunHtml() : listeHtml()}`;
  };
  const ciz = () => {
    if (kapali) return;
    if (!form && !ev && s.yollar && !gorunumSecildi && depo.durum().siraHazir && (!depo.gunSirasi() || !depo.gunSirasi()!.adimlar.length)) gorunum = 'liste'; // bağlantıda günün sırası yoksa doğrudan öğrenci listesi
    const odak = document.activeElement instanceof HTMLElement && kok.contains(document.activeElement) ? document.activeElement.dataset : undefined;
    const y = ev ? window.scrollY : 0; // ev kipinde tek uzun sayfa: yeniden çizim kaydırma konumunu bozmasın
    kok.querySelector<HTMLElement>('[data-env-govde]')!.innerHTML = govdeHtml();
    if (ev && y) window.scrollTo?.({ top: y });
    if (form) tuvalBaglan();
    if (odak?.envSayfa) kok.querySelector<HTMLElement>(`[data-env-sayfa="${CSS.escape(odak.envSayfa)}"]`)?.focus({ preventScroll: true });
    bilgiYaz(bilgi, bilgiTur); durumGuncelle();
  };
  const metinFokusta = () => document.activeElement instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && (kok.contains(document.activeElement) || Boolean(overlay?.contains(document.activeElement)));

  kok.innerHTML = ev
    ? `<div class="env-ust"><h2 class="env-ev-baslik">${simge('form')}<span lang="tr">Neler biliyorum? · ${esc(ev.ad)}</span> <span class="env-ev-ayrac" aria-hidden="true">/</span> <span class="env-fr" lang="fr">Ce que je sais</span></h2><p class="env-baglanti-kap" data-env-baglanti>${rozetHtml()}</p></div>
    <p class="env-bilgi" data-env-bilgi role="status" aria-live="polite" hidden></p><div class="env-govde" data-env-govde></div>`
    : `<div class="env-ust"><h2>${simge('form')}${tV('baslik')} <span class="kucuk env-gun">${esc(gunYaz(s.bugun))}</span></h2><p class="env-baglanti-kap" data-env-baglanti>${rozetHtml()}</p></div>
    <p class="env-bilgi" data-env-bilgi role="status" aria-live="polite" hidden></p><div class="env-govde" data-env-govde></div>`;

  const formAc = (ref: string, grup: Grup, hedefIs = '') => {
    if (form) { form.oturum.kapat(); form = null; }
    const oturum = depo.oturumAc(ref, grup, enYeni(depo.belgeler().values(), ref, grup));
    oturum.hataDinle((e) => { bilgiYaz(hataMetni(e), e.message === ENVANTER_CAKISMA ? 'hata' : ''); if (form?.oturum === oturum) { if (overlay) ogrenciCiz(); else ciz(); } durumGuncelle(); });
    const f: FormDurumu = { ref, grup, oturum, sayfa: 1, program: undefined, programAcik: hedefIs === 'hedef', ogrenciKipi: false, bitti: false, hedefGoster: false };
    form = f;
    if (s.yollar && !ev && !gecmisVar) { try { history.pushState({ envForm: 1 }, ''); gecmisVar = true; } catch { /* geçmiş yok: geri tuşu sayfadan çıkar */ } }
    bilgiYaz('');
    if (ev) f.program = null; // ev kipinde kişisel program okunmaz/gösterilmez
    else (programlar.get(ref) ?? (() => { const pr = depo.program(ref); programlar.set(ref, pr); pr.catch(() => programlar.delete(ref)); return pr; })()).then((p) => { f.program = p; }, () => { f.program = null; }).finally(() => { if (form === f && !kapali) { if (overlay) ogrenciCiz(); else if (f.programAcik) ciz(); } });
    ciz();
    window.scrollTo?.({ top: 0 });
  };
  const formKapatIc = () => { form?.oturum.kapat(); form = null; ciz(); };
  /** Düğmeyle kapatma: eklenen geçmiş kaydı da geri alınır (yığın temiz kalır). */
  const formKapat = () => { formKapatIc(); if (gecmisVar) { gecmisVar = false; history.back(); } };

  const sonrakiSatir = (satir: Element | null, kapsayici: HTMLElement) => {
    if (!satir) return;
    const tum = [...kapsayici.querySelectorAll('.env-satir')];
    const sonraki = tum[tum.indexOf(satir) + 1];
    (sonraki ?? kapsayici.querySelector('.env-ev-ek,.env-bitir,.env-notlar,.env-dinledim,.dinledim'))?.scrollIntoView({ block: sonraki ? 'center' : 'end', behavior: KAYDIRMA() });
  };
  const satirYenile = (id: string, kapsayici: HTMLElement) => {
    const bilgi_ = satirBilgisi.get(id);
    const eski = kapsayici.querySelector<HTMLElement>(`[data-satir="${CSS.escape(id)}"]`);
    if (!bilgi_ || !eski || !form) return null;
    eski.outerHTML = satirHtml(bilgi_.satir, bilgi_.bolum, Boolean(ev) || Boolean(overlay?.contains(eski)));
    return kapsayici.querySelector<HTMLElement>(`[data-satir="${CSS.escape(id)}"]`);
  };
  const kutuDegistir = (anahtar: string, sec: string) => {
    const f = form!;
    const k = MADDELER.gruplar[f.grup].sayfalar.flatMap((x) => x.kutular).find((x) => x.anahtar === anahtar);
    if (!k) return;
    const secenek = k.secenekler.find((o) => String(o.anahtar) === sec);
    if (!secenek) return;
    const mevcut = f.oturum.belge.kutular[anahtar] || [];
    const var_ = mevcut.map(String).includes(sec);
    const yeni = k.coklu ? (var_ ? mevcut.filter((x) => String(x) !== sec) : [...mevcut, secenek.anahtar]) : (var_ ? [] : [secenek.anahtar]);
    f.oturum.ayarla(['kutular', anahtar], yeni);
  };

  async function isle(ev: Event) {
    const hedef = ev.target as HTMLElement;
    const el = hedef.closest<HTMLElement>('[data-env-gorunum],[data-env-tik],[data-env-ac],[data-env-geri],[data-env-sayfa],[data-ben],[data-hoca-d],[data-kutu],[data-okuma-bas],[data-okuma-sonraki],[data-env-dinledim],[data-env-ogr-ac],[data-env-bitti],[data-env-hedef],[data-env-hedef-kapat],[data-env-program],[data-env-tamam],[data-env-dogrulama-bugun],[data-env-cizim-sil],[data-env-ev-bitti],[data-env-ev-geri],[data-env-filtre],[data-env-sutun],[data-env-sonraki],[data-env-onceki]');
    if (!el) return;
    const kapsayici = (overlay && overlay.contains(el)) ? overlay : kok;
    const d = el.dataset;
    const f = form;
    if (d.envGorunum) { gorunum = d.envGorunum as Gorunum; gorunumSecildi = true; ciz(); return; }
    if (d.envFiltre) { filtre = d.envFiltre as Filtre; ciz(); return; }
    if (d.envSutun) { sutun = d.envSutun as Sutun; try { localStorage.setItem(SUTUN_ANAHTARI, sutun); } catch { /* yoksay */ } ciz(); return; }
    if (d.envTik) { await depo.adimIsaretle(d.envTik, el.getAttribute('aria-pressed') !== 'true').catch(() => bilgiYaz(tV('hata.isaret'), 'hata')); ciz(); return; }
    if (d.envAc !== undefined) {
      const grup = (d.grup === '5-8' || d.grup === '9-13' ? d.grup : null) ?? (GRUPLAR.find((g) => enYeni(depo.belgeler().values(), d.envAc!, g)) ?? '9-13');
      formAc(d.envAc, grup, d.envIs || '');
      return;
    }
    if (!f) return;
    if (d.envGeri !== undefined) { formKapat(); return; }
    if (d.envSayfa) { f.sayfa = Number(d.envSayfa); ciz(); window.scrollTo?.({ top: 0 }); return; }
    if (d.envSonraki !== undefined || d.envOnceki !== undefined) {
      const son = MADDELER.gruplar[f.grup].sayfalar.length;
      f.sayfa = Math.min(son, Math.max(1, f.sayfa + (d.envSonraki !== undefined ? 1 : -1)));
      ciz(); window.scrollTo?.({ top: 0 }); return;
    }
    if (d.ben !== undefined || d.hocaD !== undefined) {
      const sutunAd = d.ben !== undefined ? 'ben' : 'hoca';
      const id = (d.ben ?? d.hocaD)!;
      const deger = Number(d.deger);
      const mevcut = f.oturum.belge[sutunAd][id];
      f.oturum.ayarla([sutunAd, id], mevcut === deger ? undefined : deger);
      const yeni = satirYenile(id, kapsayici);
      if (overlay && kapsayici === overlay) overlay.querySelector<HTMLElement>('[data-env-ilerleme]')!.innerHTML = ogrenciIlerlemeHtml();
      durumGuncelle();
      const ilerle = mevcut !== deger && (sutunAd === 'hoca' || kapsayici === overlay || f.grup === '5-8' || Boolean(ev) || (sutunAd === 'ben' && sutun === 'ben'));
      if (ilerle) sonrakiSatir(yeni, kapsayici);
      yeni?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
      return;
    }
    if (d.kutu) { kutuDegistir(d.kutu, d.sec!); kapsayici === overlay ? ogrenciCiz() : ciz(); durumGuncelle(); return; }
    if (d.okumaBas !== undefined) { f.oturum.ayarla(['okuma', 'basamak'], f.oturum.belge.okuma.basamak === Number(d.okumaBas) ? undefined : Number(d.okumaBas)); ciz(); return; }
    if (d.okumaSonraki !== undefined) { f.oturum.ayarla(['okuma', 'sonraki'], f.oturum.belge.okuma.sonraki === Number(d.okumaSonraki) ? undefined : Number(d.okumaSonraki)); ciz(); return; }
    if (d.envDinledim) { const k = d.envDinledim; f.oturum.ayarla(['sayfaDinlendi', k], !f.oturum.belge.sayfaDinlendi[k]); ciz(); return; }
    if (d.envProgram !== undefined) { f.programAcik = !f.programAcik; ciz(); return; }
    if (d.envOgrAc !== undefined) { ogrenciKipiAc(); return; }
    if (d.envBitti !== undefined) { f.oturum.ayarla(['durum'], 'ogrenci-bitti'); f.bitti = true; f.oturum.gonder(); ogrenciCiz(); overlay?.scrollTo?.({ top: 0 }); return; }
    if (d.envEvBitti !== undefined) { f.oturum.ayarla(['durum'], 'ogrenci-bitti'); f.bitti = true; f.oturum.gonder(); ciz(); window.scrollTo?.({ top: 0 }); evSonuBekle(); return; }
    if (d.envEvGeri !== undefined) { f.bitti = false; ciz(); return; }
    if (d.envHedef !== undefined) { f.hedefGoster = true; ogrenciCiz(); return; }
    if (d.envHedefKapat !== undefined) { f.hedefGoster = false; ogrenciCiz(); return; }
    if (d.envTamam !== undefined) { const yeni = f.oturum.belge.durum === 'tamam' ? 'ogrenci-bitti' : 'tamam'; f.oturum.ayarla(['durum'], yeni); ciz(); return; }
    if (d.envDogrulamaBugun !== undefined) { f.oturum.ayarla(['metin', 'dogrulama_tarihi'], s.bugun); ciz(); return; }
    if (d.envCizimSil !== undefined) { f.oturum.ayarla(['cizim'], undefined); ciz(); return; }
  }
  function metinDegisti(ev: Event) {
    const el = ev.target as HTMLInputElement | HTMLTextAreaElement;
    if (el instanceof HTMLElement && el.dataset.envAra !== undefined) { aranan = (el as HTMLInputElement).value; listeYenile(); return; }
    if (!form || !(el instanceof HTMLElement)) return;
    const d = el.dataset;
    if (d.metin) {
      if (d.idx !== undefined) {
        const gir = Array.from(el.closest('fieldset')!.querySelectorAll<HTMLInputElement>(`[data-metin="${CSS.escape(d.metin)}"]`)).map((x) => x.value.trim());
        while (gir.length && !gir[gir.length - 1]) gir.pop();
        form.oturum.ayarla(['metin', d.metin], gir);
      } else form.oturum.ayarla(['metin', d.metin], el.value.trim());
    } else if (d.okumaNot) {
      form.oturum.ayarla(['okuma_notlari', d.okumaNot], el.value.trim() || undefined);
    } else return;
    durumGuncelle();
  }

  /** Öğrenci kipinden çıkış: kilit düğmesine 2 saniye basılı tut. */
  function kilitBaglan(kap: HTMLElement) {
    let sayac: ReturnType<typeof setTimeout> | undefined;
    const birak = () => { if (sayac) { clearTimeout(sayac); sayac = undefined; } kap.querySelector('[data-env-kilit]')?.classList.remove('basili'); };
    kap.addEventListener('pointerdown', (e) => {
      const k = (e.target as HTMLElement).closest('[data-env-kilit]');
      if (!k) return;
      k.classList.add('basili');
      sayac = setTimeout(() => { sayac = undefined; ogrenciKipindenCik(); }, 2000);
    }, { signal: ac.signal });
    for (const o of ['pointerup', 'pointercancel', 'pointerleave', 'contextmenu']) kap.addEventListener(o, (e) => { if ((e.target as HTMLElement).closest?.('[data-env-kilit]') || o === 'pointerup') birak(); }, { signal: ac.signal, capture: true });
    kap.addEventListener('keydown', (e) => { if ((e.target as HTMLElement).closest('[data-env-kilit]') && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); }, { signal: ac.signal });
  }
  function baglaOlaylar(kap: HTMLElement) {
    kap.addEventListener('click', (e) => { void isle(e); }, { signal: ac.signal });
    kap.addEventListener('input', metinDegisti, { signal: ac.signal });
    if (kap !== kok) kilitBaglan(kap);
  }
  baglaOlaylar(kok);

  const birak = depo.abone(() => {
    if (kapali) return;
    durumGuncelle();
    if (ev) { // ev kipi: ilk anlık görüntüde tek formu aç; son ekran açıksa bekleyen/gönderildi metnini tazele
      if (!form) { if (depo.durum().hazir) formAc(ev.ref, ev.grup); else if (depo.durum().hata) ciz(); } else if (form.bitti) ciz();
      return;
    }
    if (form) return; // açık formu canlı güncelleme yeniden çizmez (yerel kopya iyimser)
    if (metinFokusta()) return;
    ciz();
  });
  window.addEventListener('popstate', () => {
    if (!gecmisVar) return;
    gecmisVar = false;
    if (overlay) { try { history.pushState({ envForm: 1 }, ''); gecmisVar = true; } catch { /* yoksay */ } return; } // öğrenci kipi kilitli: geri tuşu çıkarmaz
    if (form) formKapatIc();
  }, { signal: ac.signal });
  const gorunurDegisti = () => { if (document.visibilityState === 'hidden') depo.hepsiniGonder(); };
  document.addEventListener('visibilitychange', gorunurDegisti, { signal: ac.signal });
  window.addEventListener('pagehide', () => depo.hepsiniGonder(), { signal: ac.signal });
  if (ev) {
    // yardım kartı açık/kapalı durumu (toggle kabarcıklanmaz → yakalama aşaması); depolama yoksa yalnız bellekte kalır
    kok.addEventListener('toggle', (e) => {
      const el = e.target as HTMLDetailsElement;
      if (!el?.matches?.('[data-env-yardim]')) return;
      yardimAcik = el.open;
      try { localStorage.setItem(EV_YARDIM_ANAHTARI, el.open ? 'acik' : 'kapali'); } catch { /* yoksay */ }
    }, { capture: true, signal: ac.signal });
  }
  depo.baslat();
  ciz();

  return {
    temizle() {
      kapali = true;
      depo.hepsiniGonder();
      ac.abort();
      birak();
      overlay?.remove(); overlay = null;
      document.documentElement.classList.remove('env-kilitli');
      depo.kapat();
    },
    ayrilabilir() {
      if (ev) { depo.hepsiniGonder(); return !(depo.bekleyenVar() || form?.oturum.bekliyor()); } // ev kipi: yalnız bekleyen yazım varken uyar
      if (overlay) return false; // öğrenci kipi kilitli: yalnız 2 saniyelik basılı tutma çıkarır
      depo.hepsiniGonder();
      return true;
    },
  };
}

/** Sekme açılmadan önce arka planda yüklenebilir (Ezber ile aynı kalıp); şimdilik yalnız modülü ısıtır. */
export function envanterOnYukle(_app: FirebaseApp): void { /* tam SDK ezber sekmesiyle ortak; ek ısıtma gerekmiyor */ }
