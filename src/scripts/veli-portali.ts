/**
 * Veli portalı tarayıcı uygulaması (6 Eyl 2026). Sunucu yok: Firebase Auth + Firestore (lite) doğrudan tarayıcıdan.
 * Akış: e-posta bağlantısı → (ilk kez) şifre belirleme → pano; sonraki girişler e-posta + şifre. Veri erişimi
 * firebase/firestore.rules ile sınırlı (veli yalnız aileler/{e-posta}.ogrenciler listesindeki öğrencileri okur).
 */
import type { Dil } from '../i18n/ui';
import { veliMetni, yerlestir, type VeliMetin } from '../i18n/veli';
import { temizleHtml, metniSadelestir, zenginMi } from '../lib/zengin-metin';

type Ders = { no: number; kod: string; alan: string; konu: string; ezber: string[] };
type PlanGun = { tarih: string; hafta: number; dersler: Ders[] };
type Veri = { donem: string; gunler: PlanGun[]; materyalGunleri: string[]; materyalYolu: string; gizlilikYolu: string; kursYolu: string; dilYollari: Record<Dil, string> };
type Ogrenci = { ref: string; ad: string; soyad: string; durum?: string };
type DurumTip = 'var' | 'yok' | 'mazeret' | 'gec';
// Yoklama artık gün başına DERS DERS tutulur: dersler = { "1": durum, "2": durum, "3": durum } (gün-içi sıra → durum).
// Eski belgeler tek `durum` taşıyordu; okuyucular geriye-dönük uyumlu (o durumu üç derse de uygular).
type Yoklama = { ref: string; tarih: string; dersler?: Record<string, DurumTip>; durum?: DurumTip; not?: string };
type Ilerleme = { kuranAdim?: number; ezber?: Record<string, 'ogrendi' | 'tekrar' | 'baslamadi'>; alanlar?: Record<string, number>; hocaNotu?: string; guncelleme?: string };
type Degerlendirme = { tarih: string; alan: string; olcut?: string; derece?: number; not?: string };
type Not = { tarih: string; metin: string };
type Odev = { tarih: string; hafta?: number; ezber?: Record<string, string>; odev?: Record<string, string>; materyal?: string; yayin: boolean };
type Duyuru = { tarih: string; baslik: Record<string, string>; metin: Record<string, string>; yayin: boolean };
type Bildirim = { id?: string; ref: string; tur: string; tarih?: string; metin: string; okundu: boolean; zaman?: { toDate?: () => Date } | string; yanit?: string; yanitZaman?: { toDate?: () => Date } | string };

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const yerel: Record<Dil, string> = { tr: 'tr-TR', fr: 'fr-BE', en: 'en-GB' };
const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
const gunEkle = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export async function veliPortali(): Promise<void> {
  const kok = document.getElementById('veli-portal');
  const veriEl = document.getElementById('veli-veri');
  if (!kok || !veriEl) return;
  const dil = (kok.dataset.dil as Dil) || 'tr';
  const m: VeliMetin = veliMetni(dil);
  const veri = JSON.parse(veriEl.textContent || '{}') as Veri;
  const tarihYaz = (iso: string, sec: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
    iso ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', ...sec }).format(new Date(iso.slice(0, 10) + 'T12:00:00')) : '';
  const cok = (o: Record<string, string> | undefined) => (o ? (o[dil] || o.fr || o.tr || '') : '');
  // Duyuru/ödev metnindeki https bağlantılarını tıklanabilir yapar (önce kaçış, sonra bağlantı; sondaki noktalama bağlantıya girmez)
  const bagla = (s: string) => esc(s).replace(/https?:\/\/[^\s<]*[^\s<.,;:!?)]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  // Duyuru metni: zengin editör HTML'i ise sanitize; düz metin (eski) ise kaçış + bağlantı + satır sonu.
  // zenginMi ile kesin ayrım — «a<b olacak» gibi düz metin yanlışlıkla HTML sanılıp yutulmaz.
  const duyuruHtml = (s: string) => zenginMi(s) ? temizleHtml(s) : bagla(s).replace(/\n/g, '<br>');
  // Uzunluk/kırpma için düz metin biçimi (zengin ise etiketleri at, düz ise olduğu gibi).
  const duyuruDuz = (s: string) => (zenginMi(s) ? metniSadelestir(s) : s).replace(/\s+/g, ' ').trim();
  const alanAdi = (kod: string) => (m.alan as Record<string, string>)[kod] || kod;
  // Bir yoklama gününü ders ders normalleştirir (yeni `dersler` haritası ya da eski tek `durum`dan).
  const dersDurumlari = (y: Yoklama): { sira: string; durum: DurumTip }[] => {
    const h = y.dersler && typeof y.dersler === 'object' ? y.dersler : (y.durum ? { '1': y.durum, '2': y.durum, '3': y.durum } : {});
    return Object.keys(h).filter((s) => h[s]).sort().map((s) => ({ sira: s, durum: h[s] }));
  };

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
    kilit: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    zarf: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    ok: '<path d="M9 5l7 7-7 7"/>',
    disari: '<path d="M7 17L17 7M8.5 7H17v8.5"/>',
    cikis: '<path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M17 8l4 4-4 4M9.5 12H21"/>',
    kalem: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5z"/><path d="M14 7l3 3"/>',
    geri: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-1.5"/>',
  };
  const simge = (ad: string) => `<svg class="simge" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SIMGELER[ad] || ''}</svg>`;
  const bosDurum = (ikon: string, metin: string) => `<p class="bos">${simge(ikon)}<span>${esc(metin)}</span></p>`;

  const [{ firebaseUygulamasi }, auth, fs] = await Promise.all([import('../lib/firebase'), import('firebase/auth'), import('firebase/firestore/lite')]);
  const app = firebaseUygulamasi();
  const a = auth.getAuth(app);
  a.languageCode = dil;
  const db = fs.getFirestore(app);
  const sayfaAdresi = location.origin + location.pathname;

  const hataMetni = (e: unknown): string => {
    const kod = (e as { code?: string })?.code || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login-credentials/.test(kod)) return m.hataGiris;
    if (/invalid-email|missing-email/.test(kod)) return m.hataEposta;
    if (/weak-password/.test(kod)) return m.hataSifre;
    if (/too-many-requests|quota-exceeded/.test(kod)) return m.hataCok;
    if (/invalid-action-code|expired-action-code/.test(kod)) return m.hataBag;
    if (/network-request-failed/.test(kod)) return m.hataAg;
    return yerlestir(m.hataGenel, { mesaj: kod || String((e as Error)?.message || e) });
  };
  const mesaj = (form: HTMLElement, metin: string, tur: 'hata' | 'basari' | '' = '') => {
    const p = form.querySelector<HTMLElement>('[data-mesaj]'); if (!p) return;
    p.textContent = metin; p.className = 'not ' + tur; p.hidden = !metin;
  };
  const mesgul = (form: HTMLFormElement, durum: boolean) => form.querySelectorAll<HTMLButtonElement>('button').forEach((b) => { b.disabled = durum; });

  /* ---------------------------------------------------------------- giriş ekranı */
  const girisEkrani = (onMesaj = '') => {
    kok.innerHTML = `
      <div class="giris-sar">
        ${onMesaj ? `<p class="not basari">${esc(onMesaj)}</p>` : ''}
        <div class="giris-hos">
          <span class="simge-cerceve">${simge('ogrenci')}</span>
          <p>${esc(m.girisHos)}</p>
        </div>
        <form class="giris-kart" data-form="giris" novalidate>
          <h2>${simge('kilit')}${esc(m.girisBaslik)}</h2>
          <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
          <label>${esc(m.sifre)}<input type="password" name="sifre" required autocomplete="current-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.girisYap)}</button></div>
        </form>
        <details class="ilk-giris">
          <summary>${simge('ok')}<span>${esc(m.ilkKez)}</span></summary>
          <div class="govde">
            <form class="giris-kart" data-form="bag" novalidate>
              <p class="kucuk">${esc(m.bagAciklama)}</p>
              <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
              <p data-mesaj hidden class="not"></p>
              <div class="satir-dugmeler"><button type="submit" class="dugme dugme-iznik">${simge('zarf')}${esc(m.bagGonder)}</button><button type="button" class="dugme dugme-ikincil" data-eylem="sifremiUnuttum">${esc(m.sifremiUnuttum)}</button></div>
            </form>
          </div>
        </details>
      </div>`;
    const kayitli = localStorage.getItem('veliEposta');
    if (kayitli) kok.querySelectorAll<HTMLInputElement>('input[name=eposta]').forEach((i) => { i.value = kayitli; });
  };

  const bagTamamlaEkrani = () => {
    kok.innerHTML = `
      <div class="giris-sar">
        <form class="giris-kart" data-form="bagTamamla" novalidate>
          <h2>${simge('zarf')}${esc(m.girisBaslik)}</h2>
          <p class="kucuk">${esc(m.bagTamamla)}</p>
          <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.bagOnayla)}</button></div>
        </form>
      </div>`;
  };

  const sifreEkrani = (zorunluDegil: boolean) => {
    kok.innerHTML = `
      <div class="giris-sar">
        <div class="giris-hos"><span class="simge-cerceve">${simge('kilit')}</span><p>${esc(m.sifreBelirleA)}</p></div>
        <form class="giris-kart" data-form="sifreBelirle" novalidate>
          <h2>${simge('kilit')}${esc(m.sifreBelirleBaslik)}</h2>
          <label>${esc(m.sifre)}<input type="password" name="sifre" required minlength="8" autocomplete="new-password"></label>
          <label>${esc(m.sifreTekrar)}<input type="password" name="sifre2" required minlength="8" autocomplete="new-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler">
            <button type="submit" class="dugme dugme-birincil">${esc(m.kaydet)}</button>
            ${zorunluDegil ? `<button type="button" class="dugme dugme-ikincil" data-eylem="atla">${esc(m.atla)}</button>` : ''}
          </div>
        </form>
      </div>`;
  };

  /* ---------------------------------------------------------------- pano */
  type Durum = { eposta: string; aile: { ogrenciler: string[]; dil?: string; sifreVar?: boolean;
      /* kitapSecim: öğrenci ref'i → {secim: 'var'|'satin'|'fotokopi', zaman}. Veli kendi belgesine yazar
         (firestore.rules aileler update izin listesinde). Hoca ekranı bu haritayı okuyup hazırlık yapar. */
      kitapSecim?: Record<string, { secim: string; zaman: string }> }; ogrenciler: Ogrenci[]; secili: number;
    odevler: Odev[]; duyurular: Duyuru[]; bildirimler: Bildirim[]; cocuk: Record<string, { yoklama: Yoklama[]; ilerleme: Ilerleme | null; degerlendirme: Degerlendirme[]; notlar: Not[] }> };
  let durum: Durum | null = null;
  let duzenlenenBildirim: string | null = null; // veli bir gönderdiği mesajı düzenliyorsa id'si

  const veriYukle = async (user: { email: string | null }): Promise<Durum | null> => {
    const eposta = (user.email || '').toLowerCase();
    const aileSnap = await fs.getDoc(fs.doc(db, 'aileler', eposta));
    if (!aileSnap.exists()) return null;
    const aile = aileSnap.data() as Durum['aile'];
    const refler = aile.ogrenciler || [];
    const ogrSnaps = await Promise.all(refler.map((r) => fs.getDoc(fs.doc(db, 'ogrenciler', r))));
    const ogrenciler = ogrSnaps.filter((s) => s.exists()).map((s) => ({ ref: s.id, ...(s.data() as Omit<Ogrenci, 'ref'>) }));
    const [odevSnap, duyuruSnap, bildirimSnap] = await Promise.all([
      fs.getDocs(fs.query(fs.collection(db, 'odevler'), fs.where('yayin', '==', true))),
      fs.getDocs(fs.query(fs.collection(db, 'duyurular'), fs.where('yayin', '==', true))),
      fs.getDocs(fs.query(fs.collection(db, 'bildirimler'), fs.where('eposta', '==', eposta))),
    ]);
    const d: Durum = {
      eposta, aile, ogrenciler, secili: 0,
      odevler: odevSnap.docs.map((x) => x.data() as Odev).sort((x, y) => y.tarih.localeCompare(x.tarih)),
      duyurular: duyuruSnap.docs.map((x) => x.data() as Duyuru).sort((x, y) => y.tarih.localeCompare(x.tarih)),
      bildirimler: bildirimSnap.docs.map((x) => ({ id: x.id, ...(x.data() as Bildirim) })),
      cocuk: {},
    };
    await Promise.all(ogrenciler.map((o) => cocukYukle(d, o.ref)));
    return d;
  };

  const cocukYukle = async (d: Durum, ref: string) => {
    const [yok, ile, deg, not] = await Promise.all([
      fs.getDocs(fs.query(fs.collection(db, 'yoklama'), fs.where('ref', '==', ref))),
      fs.getDoc(fs.doc(db, 'ilerleme', ref)),
      fs.getDocs(fs.query(fs.collection(db, 'degerlendirme'), fs.where('ref', '==', ref))),
      fs.getDocs(fs.query(fs.collection(db, 'notlar'), fs.where('ref', '==', ref), fs.where('veliyeGorunur', '==', true))),
    ]);
    d.cocuk[ref] = {
      yoklama: yok.docs.map((x) => x.data() as Yoklama).sort((x, y) => x.tarih.localeCompare(y.tarih)),
      ilerleme: ile.exists() ? (ile.data() as Ilerleme) : null,
      degerlendirme: deg.docs.map((x) => x.data() as Degerlendirme).sort((x, y) => y.tarih.localeCompare(x.tarih)),
      notlar: not.docs.map((x) => x.data() as Not).sort((x, y) => y.tarih.localeCompare(x.tarih)),
    };
  };

  const kuranSirasi = veri.gunler.flatMap((g) => g.dersler.filter((x) => x.kod === 'kuran').map((x) => ({ tarih: g.tarih, konu: x.konu }))).filter((x, i, d) => d.findIndex((y) => y.konu === x.konu) === i); // her Kur'an konusu bir adım (ilk işlendiği gün)

  const panoCiz = () => {
    if (!durum) return;
    const d = durum; const bugun = bugunISO();
    const pzt = gunEkle(bugun, -((new Date(bugun + 'T12:00:00Z').getUTCDay() + 6) % 7)); const paz = gunEkle(pzt, 6);
    const o = d.ogrenciler[d.secili]; const c = o ? d.cocuk[o.ref] : null;
    const haftaGunleri = veri.gunler.filter((g) => g.tarih >= pzt && g.tarih <= paz);
    const siradaki = veri.gunler.find((g) => g.tarih > bugun);
    const haftaOdev = d.odevler.find((x) => x.tarih >= pzt && x.tarih <= paz);
    const yk = c ? c.yoklama : []; const say = { var: 0, yok: 0, mazeret: 0, gec: 0 } as Record<string, number>; let toplamDers = 0; yk.forEach((y) => dersDurumlari(y).forEach((p) => { say[p.durum] = (say[p.durum] || 0) + 1; toplamDers++; }));
    const ile = c?.ilerleme || null;
    const kuranNo = ile?.kuranAdim ?? -1; const kuranKonu = kuranNo >= 0 && kuranSirasi[kuranNo] ? kuranSirasi[kuranNo].konu : '';
    const yuzde = kuranNo >= 0 ? Math.round(((kuranNo + 1) / kuranSirasi.length) * 100) : 0;
    const gelecekGunler = veri.gunler.filter((g) => g.tarih >= bugun).slice(0, 10);
    const dereceAdi = (n: number) => (m.derece as Record<string, string>)[String(n)] || String(n);

    const durumAd = (k: string) => (m.durum as Record<string, string>)[k] || k;
    const kunyeler: { ikon: string; deger: string; etiket: string }[] = [];
    if (toplamDers) kunyeler.push({ ikon: 'takvim', deger: `${say.var}/${toplamDers}`, etiket: m.ozetDevam });
    if (kuranNo >= 0 && kuranSirasi[kuranNo]) kunyeler.push({ ikon: 'grafik', deger: `${kuranNo + 1}/${kuranSirasi.length}`, etiket: m.ozetKuran });
    if (haftaGunleri.length) kunyeler.push({ ikon: 'kitap', deger: yerlestir(m.dersSayi, { n: haftaGunleri.reduce((s, g) => s + g.dersler.length, 0) }), etiket: m.ozetHafta });
    else if (siradaki) kunyeler.push({ ikon: 'kitap', deger: tarihYaz(siradaki.tarih, { day: 'numeric', month: 'short' }), etiket: m.ozetHafta });
    const bas = (ikon: string, baslik: string, sag = '') => `<div class="bolum-bas">${simge(ikon)}<h2>${esc(baslik)}</h2>${sag ? `<span class="sag">${esc(sag)}</span>` : ''}</div>`;
    /* Ders kitabı / materyal kartı: her öğrenci için tek seferlik üç seçenek. Yanıtlanmamış öğrenci
       varsa kart vurgulu ve en üstte durur; hepsi yanıtlanınca özet satırlarına iner. */
    const kitapKarti = () => {
      const sec = d.aile.kitapSecim || {};
      const eksik = d.ogrenciler.some((x) => !sec[x.ref]);
      const adlar = m.kitapSecildi as Record<string, string>;
      const satirlar = d.ogrenciler.map((x) => {
        const v = sec[x.ref];
        return `<div class="kitap-satir${v ? '' : ' acik'}">
          <span class="ks-ad">${simge('ogrenci')}<b>${esc(x.ad)} ${esc(x.soyad)}</b></span>
          ${v
            ? `<span class="ks-yanit"><span class="rozet ogrendi">${esc(adlar[v.secim] || v.secim)}</span>
                 <button type="button" class="kucuk-dugme" data-kitap-degistir="${esc(x.ref)}">${simge('kalem')}${esc(m.kitapDegistir)}</button></span>`
            : `<span class="ks-secenek">
                 <button type="button" class="ks-dugme" data-kitap="var" data-ref="${esc(x.ref)}">${esc(m.kitapVar)}</button>
                 <button type="button" class="ks-dugme" data-kitap="satin" data-ref="${esc(x.ref)}">${esc(m.kitapSatin)}</button>
                 <button type="button" class="ks-dugme" data-kitap="fotokopi" data-ref="${esc(x.ref)}">${esc(m.kitapFoto)}</button>
               </span>`}
        </div>`;
      }).join('');
      return `<section class="bolum genis kitap-kart${eksik ? ' oncelik' : ''}" id="kitap">
        ${bas('kitap', m.kitapBaslik, eksik ? m.kitapBekliyor : '')}
        <p class="kucuk">${esc(m.kitapA)}</p>
        ${satirlar}
        <div class="kitap-bilgi">
          <p class="kucuk"><b>${esc(m.kitapSatin)}</b> — ${esc(m.kitapSatinNot)}</p>
          <p class="kitap-baglar">
            <a class="ic-bag" href="https://zsu-shop.de" target="_blank" rel="noopener">${esc(m.kitapSatinBag)}${simge('disari')}</a>
            <a class="ic-bag" href="https://www.ditib-akademie.de/cg1/" target="_blank" rel="noopener">${esc(m.kitapCg1)}${simge('disari')}</a>
            <a class="ic-bag" href="https://www.ditib-akademie.de/cg2/" target="_blank" rel="noopener">${esc(m.kitapCg2)}${simge('disari')}</a>
          </p>
          <p class="kucuk"><b>${esc(m.kitapFoto)}</b> — ${esc(m.kitapFotoNot)}</p>
        </div>
      </section>`;
    };
    const duzen = duzenlenenBildirim ? d.bildirimler.find((b) => b.id === duzenlenenBildirim) || null : null;
    // Mazeret düzenlenirken orijinal tarih gelecek penceresinin dışına düşmüşse seçeneklerin başına
    // eklenir; yoksa hiçbir <option> selected olmaz, tarayıcı sessizce ilk günü gösterir ve kaydeder.
    const bildirTarihleri = duzen?.tarih && !gelecekGunler.some((g) => g.tarih === duzen.tarih)
      ? [duzen.tarih, ...gelecekGunler.map((g) => g.tarih)]
      : gelecekGunler.map((g) => g.tarih);

    kok.innerHTML = `
      <div class="pano-hero">
        <div class="hero-serit" aria-hidden="true"></div>
        <div class="hero-ust">
          <p class="selam"><small>${esc(m.hosgeldin)}</small><span class="cocuk-adi">${o ? esc(o.ad) + ' ' + esc(o.soyad) : esc(d.eposta)}</span></p>
          <button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${simge('cikis')}${esc(m.cikis)}</button>
        </div>
        ${kunyeler.length ? `<div class="kunye-serit">${kunyeler.map((k) => `<div class="kunye">${simge(k.ikon)}<div><span class="k-deger">${esc(k.deger)}</span><span class="k-etiket">${esc(k.etiket)}</span></div></div>`).join('')}</div>` : ''}
      </div>
      ${d.ogrenciler.length > 1 ? `<div class="cocuk-sec" role="tablist" aria-label="${esc(m.cocuklar)}">
        ${d.ogrenciler.map((x, i) => `<button type="button" role="tab" class="cocuk-dugme" aria-selected="${i === d.secili}" data-sec="${i}">${simge('ogrenci')}${esc(x.ad)} ${esc(x.soyad)}</button>`).join('')}
      </div>` : ''}
      <div class="bolumler">
        ${kitapKarti()}
        <section class="bolum oncelik genis">
          ${bas('kitap', m.buHafta, `${tarihYaz(pzt)} – ${tarihYaz(paz)}${haftaGunleri[0] ? ' · ' + yerlestir(m.hafta, { n: haftaGunleri[0].hafta }) : ''}`)}
          ${haftaGunleri.length ? `<div>${haftaGunleri.map((g) => `<div class="hafta-gun"><span class="g-tarih">${esc(tarihYaz(g.tarih, { weekday: 'long', day: 'numeric', month: 'short' }))}</span>
              <span class="g-dersler">${g.dersler.map((x) => `<span class="g-ders"><span class="g-no">${x.no}.</span> ${esc(alanAdi(x.kod))}: <span lang="tr">${esc(x.konu)}</span></span>`).join('')}
              ${g.dersler.some((x) => x.ezber.length) ? `<span class="rozet ogrendi">${esc(m.ezber)}: <span lang="tr">${esc(g.dersler.flatMap((x) => x.ezber).join(', '))}</span></span>` : ''}
              ${veri.materyalGunleri.includes(g.tarih) ? `<a class="ic-bag" href="${esc(veri.materyalYolu)}#g-${g.tarih}">${esc(m.materyal)}${simge('disari')}</a>` : ''}</span></div>`).join('')}</div>` : ''}
          ${haftaOdev ? `<h3>${esc(m.ezber)}</h3><p style="white-space:pre-line">${bagla(cok(haftaOdev.ezber) || '—')}</p>
            <h3>${esc(m.odev)}</h3><p style="white-space:pre-line">${bagla(cok(haftaOdev.odev) || '—')}</p>
            ${haftaOdev.materyal ? `<p style="margin-top:.7rem"><a class="ic-bag" href="${esc(haftaOdev.materyal)}">${esc(m.materyal)}${simge('disari')}</a></p>` : ''}` : bosDurum('kitap', m.odevYok)}
          ${siradaki ? `<p class="kucuk" style="margin-top:1rem;display:flex;align-items:center;gap:.45rem">${simge('takvim')}<span><b>${esc(m.siradakiDers)}:</b> ${esc(tarihYaz(siradaki.tarih, { weekday: 'long', day: 'numeric', month: 'long' }))}</span></p>` : ''}
        </section>

        <section class="bolum">
          ${bas('takvim', m.yoklama)}
          ${yk.length ? `<p class="kucuk">${esc(yerlestir(m.yoklamaBilgi, { n: toplamDers }))}</p>
            <div class="devam-ozet"><span><b>${say.var}</b> ${esc(durumAd('var'))}</span>${say.yok ? `<span><b>${say.yok}</b> ${esc(durumAd('yok'))}</span>` : ''}${say.mazeret ? `<span><b>${say.mazeret}</b> ${esc(durumAd('mazeret'))}</span>` : ''}${say.gec ? `<span><b>${say.gec}</b> ${esc(durumAd('gec'))}</span>` : ''}</div>
            <div class="yoklama-liste">${yk.slice().reverse().slice(0, 10).map((y) => { const gun = veri.gunler.find((gg) => gg.tarih === y.tarih); const pd = dersDurumlari(y); return `<div class="yoklama-gun"><span class="yg-tarih">${esc(tarihYaz(y.tarih, { weekday: 'short', day: 'numeric', month: 'short' }))}</span><div class="yg-dersler">${pd.map((p) => { const ders = gun && gun.dersler ? gun.dersler.find((dd) => String(dd.no) === p.sira) : null; const ad = ders ? alanAdi(ders.kod) : yerlestir(m.dersNo, { n: p.sira }); return `<span class="ders-kayit"><span class="dk-ad"><span class="dk-no">${esc(p.sira)}</span>${esc(ad)}</span><span class="rozet ${p.durum}">${esc(durumAd(p.durum))}</span></span>`; }).join('')}</div>${y.not ? `<p class="yg-not">${simge('not')}<span>${esc(y.not)}</span></p>` : ''}</div>`; }).join('')}</div>`
            : bosDurum('takvim', m.yoklamaYok)}
        </section>

        <section class="bolum">
          ${bas('grafik', m.ilerleme, ile && ile.guncelleme ? tarihYaz(ile.guncelleme, { day: 'numeric', month: 'short' }) : '')}
          ${ile ? `
            ${kuranKonu ? `<h3>${esc(m.kuranAdim)}</h3><div class="ilerleme-not"><b lang="tr">${esc(kuranKonu)}</b><span class="kucuk">${kuranNo + 1}/${kuranSirasi.length}</span></div><div class="cubuk"><span style="width:${yuzde}%"></span></div>` : ''}
            ${ile.ezber && Object.keys(ile.ezber).length ? `<h3>${esc(m.ezberler)}</h3><ul class="liste">${Object.entries(ile.ezber).map(([ad, dr]) => `<li><span lang="tr">${esc(ad)}</span><span class="rozet ${esc(dr)}">${esc((m.ezberDurum as Record<string, string>)[dr] || dr)}</span></li>`).join('')}</ul>` : ''}
            ${ile.alanlar && Object.keys(ile.alanlar).length ? `<h3>${esc(m.alanlar)}</h3><div class="dereceler">${Object.entries(ile.alanlar).map(([k, n]) => `<div class="derece"><b>${esc(alanAdi(k))}</b><span class="pipler" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="pip ${i < n ? 'dolu' : ''}"></span>`).join('')}</span><span class="d-ad">${esc(dereceAdi(n))}</span></div>`).join('')}</div>` : ''}
            ${ile.hocaNotu ? `<h3>${esc(m.hocaNotu)}</h3><p style="white-space:pre-line">${esc(ile.hocaNotu)}</p>` : ''}`
            : bosDurum('grafik', m.ilerlemeYok)}
        </section>

        <section class="bolum">
          ${bas('yildiz', m.degerlendirme)}
          ${c && c.degerlendirme.length ? `<ul class="liste">${c.degerlendirme.map((x) => `<li><span class="kucuk">${esc(tarihYaz(x.tarih))}</span><b>${esc(alanAdi(x.alan))}</b>${x.olcut ? `<span lang="tr">${esc(x.olcut)}</span>` : ''}${x.derece ? `<span class="rozet derece">${esc(dereceAdi(x.derece))}</span>` : ''}${x.not ? `<span class="kucuk" style="flex-basis:100%">${esc(x.not)}</span>` : ''}</li>`).join('')}</ul>` : bosDurum('yildiz', m.degerlendirmeYok)}
        </section>

        <section class="bolum">
          ${bas('not', m.notlar)}
          ${c && c.notlar.length ? `<ul class="liste">${c.notlar.map((x) => `<li><span class="kucuk">${esc(tarihYaz(x.tarih))}</span><span style="white-space:pre-line;flex-basis:100%">${esc(x.metin)}</span></li>`).join('')}</ul>` : bosDurum('not', m.notYok)}
        </section>

        <section class="bolum genis">
          ${bas('duyuru', m.duyurular)}
          ${d.duyurular.length ? d.duyurular.slice(0, 10).map((x) => { const g = cok(x.metin); const uzun = duyuruDuz(g).length > 240; return `<article class="duyuru${uzun ? ' uzun' : ''}"><span class="d-tarih">${esc(tarihYaz(x.tarih, { day: 'numeric', month: 'long' }))}</span><h3>${esc(cok(x.baslik))}</h3><div class="d-govde">${duyuruHtml(g)}</div><button type="button" class="d-devam" data-devam>${esc(m.devaminiOku)}</button></article>`; }).join('') : bosDurum('duyuru', m.duyuruYok)}
        </section>

        <section class="bolum">
          ${bas('gonder', m.bildir)}
          <p class="kucuk">${esc(m.bildirA)}</p>
          <form data-form="bildir" novalidate class="${duzen ? 'duzenleme' : ''}">
            ${duzen ? `<p class="duzen-not">${simge('kalem')}<span>${esc(m.mesajDuzenle)}</span></p>` : ''}
            <label>${esc(m.ogrenci)}<select name="ref">${d.ogrenciler.map((x) => `<option value="${esc(x.ref)}" ${x.ref === (duzen ? duzen.ref : o?.ref) ? 'selected' : ''}>${esc(x.ad)} ${esc(x.soyad)}</option>`).join('')}</select></label>
            <label>${esc(m.bildir)}<select name="tur">${Object.entries(m.bildirTur).map(([k, v]) => `<option value="${k}" ${duzen && duzen.tur === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
            <label data-tarih-alani>${esc(m.bildirTarih)}<select name="tarih">${bildirTarihleri.map((gt) => `<option value="${gt}" ${duzen && duzen.tarih === gt ? 'selected' : ''}>${esc(tarihYaz(gt, { weekday: 'long', day: 'numeric', month: 'long' }))}</option>`).join('')}</select></label>
            <label>${esc(m.bildirMetin)}<textarea name="metin" maxlength="1000" required>${duzen ? esc(duzen.metin) : ''}</textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${simge('gonder')}${esc(duzen ? m.guncelle : m.gonder)}</button>${duzen ? `<button type="button" class="dugme dugme-ikincil" data-eylem="bildirVazgec">${esc(m.vazgec)}</button>` : ''}</div>
          </form>
          ${d.bildirimler.length ? `<h3>${esc(m.bildirimlerim)}</h3><ul class="liste mesajlar">${d.bildirimler.slice().sort((x, y) => zamanMs(y) - zamanMs(x)).slice(0, 8).map((x) => `<li><span class="kucuk">${esc(zamanYaz(x))}</span><b>${esc((m.bildirTur as Record<string, string>)[x.tur] || x.tur)}</b>${x.tarih ? `<span class="kucuk">${esc(tarihYaz(x.tarih))}</span>` : ''}<span class="rozet ${x.yanit ? 'ogrendi' : x.okundu ? 'gec' : 'mazeret'}">${esc(x.yanit ? m.yanitlandi : x.okundu ? m.okundu : m.okunmadi)}</span><span class="m-metin">${esc(x.metin)}</span>${x.yanit ? `<div class="hoca-yanit"><span class="hy-bas">${simge('gonder')}${esc(m.hocaYaniti)}${x.yanitZaman ? ` · ${esc(zamanZ(x.yanitZaman))}` : ''}</span><p>${esc(x.yanit)}</p></div>` : ''}${!x.okundu && x.id ? `<span class="msj-eylem"><button type="button" class="kucuk-dugme" data-bildir-duzelt="${esc(x.id)}">${simge('kalem')}${esc(m.duzelt)}</button><button type="button" class="kucuk-dugme sil" data-bildir-sil="${esc(x.id)}">${simge('geri')}${esc(m.geriAl)}</button></span>` : ''}</li>`).join('')}</ul>` : ''}
        </section>

        <section class="bolum">
          ${bas('ayar', m.hesap)}
          <label>${esc(m.dil)}<select name="dil" data-dil-sec>${(['tr', 'fr', 'en'] as Dil[]).map((x) => `<option value="${x}" ${x === dil ? 'selected' : ''}>${x === 'tr' ? 'Türkçe' : x === 'fr' ? 'Français' : 'English'}</option>`).join('')}</select></label>
          <p class="kucuk" style="margin:.9rem 0 .1rem">${esc(m.girisBilgisi)}</p>
          <p style="margin:0;font-weight:600;overflow-wrap:anywhere">${esc(d.eposta)}</p>
          <details class="katlanir" style="margin-top:.95rem">
            <summary>${simge('kilit')}<span>${esc(m.sifreDegistir)}</span></summary>
            <form data-form="sifreDegistir" novalidate class="govde">
              <p class="kucuk" style="margin-top:0">${esc(m.sifreDegistirA)}</p>
              <label>${esc(m.yeniSifre)}<input type="password" name="sifre" minlength="8" required autocomplete="new-password"></label>
              <p data-mesaj hidden class="not"></p>
              <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${esc(m.kaydet)}</button></div>
            </form>
          </details>
        </section>
      </div>`;
    const turSec = kok.querySelector<HTMLSelectElement>('select[name=tur]'); const tarihAlani = kok.querySelector<HTMLElement>('[data-tarih-alani]');
    const tarihGoster = () => { if (tarihAlani && turSec) tarihAlani.hidden = turSec.value !== 'mazeret'; };
    turSec?.addEventListener('change', tarihGoster); tarihGoster();
  };
  const zamanMs = (b: Bildirim) => { const z = b.zaman as { toDate?: () => Date } | string | undefined; return typeof z === 'string' ? Date.parse(z) : z?.toDate ? z.toDate().getTime() : 0; };
  const zamanYaz = (b: Bildirim) => { const ms = zamanMs(b); return ms ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };
  const zamanZ = (z: { toDate?: () => Date } | string | undefined) => { const ms = typeof z === 'string' ? Date.parse(z) : z?.toDate ? z.toDate().getTime() : 0; return ms ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };

  const kayitYokEkrani = () => {
    kok.innerHTML = `<div class="giris-sar"><div class="giris-kart"><p class="not hata">${esc(m.kayitYok)}</p><div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${simge('cikis')}${esc(m.cikis)}</button></div></div></div>`;
  };

  const panoyaGec = async (user: { email: string | null }, onMesaj = '') => {
    kok.innerHTML = `<p class="not">${esc(m.yukleniyor)}</p>`;
    try {
      durum = await veriYukle(user);
    } catch (e) {
      kok.innerHTML = `<p class="not hata">${esc(hataMetni(e))}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${esc(m.cikis)}</button>`; return;
    }
    if (!durum) { kayitYokEkrani(); return; }
    panoCiz();
    if (onMesaj) kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(onMesaj)}</p>`);
    if (durum.aile.dil !== dil) fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { dil, sonGiris: new Date().toISOString() }).catch(() => {});
    else fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { sonGiris: new Date().toISOString() }).catch(() => {});
  };

  /* ---------------------------------------------------------------- olaylar */
  kok.addEventListener('click', async (ev) => {
    const devamBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-devam]');
    if (devamBtn) { const art = devamBtn.closest('.duyuru'); if (art) { const acik = art.classList.toggle('acik'); devamBtn.textContent = acik ? m.dahaAz : m.devaminiOku; } return; }
    const kitapBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-kitap]');
    if (kitapBtn && durum) {
      const ref = kitapBtn.dataset.ref as string;
      const secim = kitapBtn.dataset.kitap as string;
      // Nokta yollu alan adı kullanılmaz: öğrenci ref'i tire içerir (UC-2026-0001) ve Firestore
      // alan yolu olarak geçersizdir. Harita bütün olarak yazılır.
      const yeni = { ...(durum.aile.kitapSecim || {}), [ref]: { secim, zaman: new Date().toISOString() } };
      try {
        await fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { kitapSecim: yeni });
        durum.aile.kitapSecim = yeni; panoCiz();
        kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(m.kitapTesekkur)}</p>`);
      } catch (e) { kok.insertAdjacentHTML('afterbegin', `<p class="not hata">${esc(hataMetni(e))}</p>`); }
      return;
    }
    const kitapDegBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-kitap-degistir]');
    if (kitapDegBtn && durum) {
      const ref = kitapDegBtn.dataset.kitapDegistir as string;
      const yeni = { ...(durum.aile.kitapSecim || {}) };
      delete yeni[ref];
      try {
        await fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { kitapSecim: yeni });
        durum.aile.kitapSecim = yeni; panoCiz();
        kok.querySelector('#kitap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) { kok.insertAdjacentHTML('afterbegin', `<p class="not hata">${esc(hataMetni(e))}</p>`); }
      return;
    }
    const silBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-bildir-sil]');
    if (silBtn && durum) {
      const id = silBtn.dataset.bildirSil as string;
      if (!confirm(m.geriAlOnay)) return;
      try {
        await fs.deleteDoc(fs.doc(db, 'bildirimler', id));
        durum.bildirimler = durum.bildirimler.filter((b) => b.id !== id);
        if (duzenlenenBildirim === id) duzenlenenBildirim = null;
        panoCiz(); kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(m.geriAlindi)}</p>`);
      } catch (e) { kok.insertAdjacentHTML('afterbegin', `<p class="not hata">${esc(hataMetni(e))}</p>`); }
      return;
    }
    const duzeltBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-bildir-duzelt]');
    if (duzeltBtn && durum) {
      duzenlenenBildirim = duzeltBtn.dataset.bildirDuzelt as string;
      panoCiz();
      kok.querySelector<HTMLElement>('form[data-form=bildir]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const hedef = (ev.target as HTMLElement).closest<HTMLElement>('[data-eylem], [data-sec]');
    if (!hedef) return;
    if (hedef.dataset.eylem === 'cikis') { await auth.signOut(a); localStorage.removeItem('veliEposta'); durum = null; duzenlenenBildirim = null; girisEkrani(); return; }
    if (hedef.dataset.eylem === 'bildirVazgec') { duzenlenenBildirim = null; panoCiz(); return; }
    if (hedef.dataset.eylem === 'atla' && a.currentUser) { await panoyaGec(a.currentUser); return; }
    if (hedef.dataset.eylem === 'sifremiUnuttum') {
      const form = hedef.closest('form') as HTMLFormElement; const eposta = (form.querySelector('input[name=eposta]') as HTMLInputElement).value.trim().toLowerCase();
      mesaj(form, '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) { mesaj(form, m.hataEposta, 'hata'); return; }
      try { mesgul(form, true); await auth.sendPasswordResetEmail(a, eposta, { url: sayfaAdresi }); localStorage.setItem('veliEposta', eposta); mesaj(form, yerlestir(m.sifreSifirlaGonderildi, { eposta }), 'basari'); }
      catch (e) { mesaj(form, hataMetni(e), 'hata'); } finally { mesgul(form, false); }
      return;
    }
    if (hedef.dataset.sec !== undefined && durum) { durum.secili = Number(hedef.dataset.sec); panoCiz(); }
  });
  kok.addEventListener('change', async (ev) => {
    const sec = (ev.target as HTMLElement).closest<HTMLSelectElement>('[data-dil-sec]');
    if (sec && durum) {
      const yeni = sec.value as Dil;
      await fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { dil: yeni }).catch(() => {});
      if (veri.dilYollari?.[yeni]) location.href = veri.dilYollari[yeni];
    }
  });
  kok.addEventListener('submit', async (ev) => {
    const form = (ev.target as HTMLElement).closest<HTMLFormElement>('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const fd = new FormData(form); const al = (k: string) => String(fd.get(k) || '').trim();
    mesaj(form, '');
    try {
      mesgul(form, true);
      switch (form.dataset.form) {
        case 'giris': {
          const eposta = al('eposta').toLowerCase(); const sifre = al('sifre');
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) throw { code: 'auth/invalid-email' };
          localStorage.setItem('veliEposta', eposta);
          const kb = await auth.signInWithEmailAndPassword(a, eposta, sifre);
          await panoyaGec(kb.user); break;
        }
        case 'bag': {
          const eposta = al('eposta').toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) throw { code: 'auth/invalid-email' };
          await auth.sendSignInLinkToEmail(a, eposta, { url: sayfaAdresi, handleCodeInApp: true });
          localStorage.setItem('veliEposta', eposta);
          mesaj(form, yerlestir(m.bagGonderildi, { eposta }), 'basari'); break;
        }
        case 'bagTamamla': {
          const eposta = al('eposta').toLowerCase();
          await bagIleGir(eposta); break;
        }
        case 'sifreBelirle': {
          const s1 = al('sifre'), s2 = al('sifre2');
          if (s1.length < 8) throw { code: 'auth/weak-password' };
          if (s1 !== s2) { mesaj(form, m.sifreUyusmaz, 'hata'); break; }
          if (!a.currentUser) break;
          await auth.updatePassword(a.currentUser, s1);
          await fs.setDoc(fs.doc(db, 'aileler', (a.currentUser.email || '').toLowerCase()), { sifreVar: true }, { merge: true }).catch(() => {});
          await panoyaGec(a.currentUser, m.sifreDegisti); break;
        }
        case 'sifreDegistir': {
          const s1 = al('sifre');
          if (s1.length < 8) throw { code: 'auth/weak-password' };
          if (!a.currentUser) break;
          try {
            await auth.updatePassword(a.currentUser, s1);
            mesaj(form, m.sifreDegisti, 'basari'); form.reset();
          } catch (e) {
            if ((e as { code?: string })?.code === 'auth/requires-recent-login') {
              await auth.sendPasswordResetEmail(a, a.currentUser.email || '', { url: sayfaAdresi });
              mesaj(form, m.yenidenGiris, 'basari');
            } else throw e;
          }
          break;
        }
        case 'bildir': {
          if (!durum) break;
          const tur = al('tur'); const ref = al('ref'); const metin = al('metin');
          if (!metin) { mesaj(form, m.bildirMetin, 'hata'); break; }
          const ogr = durum.ogrenciler.find((x) => x.ref === ref);
          const ogrenciAd = ogr ? `${ogr.ad} ${ogr.soyad}` : '';
          const tarih = tur === 'mazeret' ? al('tarih') : null;
          if (duzenlenenBildirim) {
            const dbid = duzenlenenBildirim;
            await fs.updateDoc(fs.doc(db, 'bildirimler', dbid), { ref, tur, metin: metin.slice(0, 1000), ogrenciAd, dil, tarih });
            const yer = durum.bildirimler.find((b) => b.id === dbid);
            if (yer) { yer.ref = ref; yer.tur = tur; yer.metin = metin; yer.tarih = tarih || undefined; }
            duzenlenenBildirim = null;
            panoCiz(); kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(m.guncellendi)}</p>`); break;
          }
          const kayit: Record<string, unknown> = { ref, tur, metin: metin.slice(0, 1000), eposta: durum.eposta, okundu: false, zaman: fs.serverTimestamp(),
            ogrenciAd, dil };
          if (tur === 'mazeret') kayit.tarih = tarih;
          const yeni = await fs.addDoc(fs.collection(db, 'bildirimler'), kayit);
          durum.bildirimler.push({ id: yeni.id, ref, tur, metin, okundu: false, tarih: tarih || undefined, zaman: new Date().toISOString() });
          panoCiz(); kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(m.gonderildi)}</p>`); break;
        }
      }
    } catch (e) {
      mesaj(form, hataMetni(e), 'hata');
    } finally {
      if (form.isConnected) mesgul(form, false);
    }
  });

  const bagIleGir = async (eposta: string) => {
    const kb = await auth.signInWithEmailLink(a, eposta, location.href);
    localStorage.setItem('veliEposta', eposta);
    history.replaceState(null, '', sayfaAdresi);
    const aileSnap = await fs.getDoc(fs.doc(db, 'aileler', eposta)).catch(() => null);
    if (aileSnap && aileSnap.exists() && !(aileSnap.data() as { sifreVar?: boolean }).sifreVar) sifreEkrani(true);
    else await panoyaGec(kb.user);
  };

  /* ---------------------------------------------------------------- başlangıç */
  if (auth.isSignInWithEmailLink(a, location.href)) {
    const kayitli = (localStorage.getItem('veliEposta') || '').toLowerCase();
    if (kayitli) {
      try { await bagIleGir(kayitli); return; } catch (e) { girisEkrani(); mesaj(kok.querySelector('form[data-form=bag]') as HTMLElement, hataMetni(e), 'hata'); return; }
    }
    bagTamamlaEkrani(); return;
  }
  auth.onAuthStateChanged(a, (user) => {
    if (user) { if (!durum) panoyaGec(user); }
    else { durum = null; girisEkrani(); }
  });
}
