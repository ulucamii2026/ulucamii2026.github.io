/**
 * Hoca ekranı tarayıcı uygulaması (6 Eyl 2026) — yalnız Türkçe. Firebase Auth + Firestore (lite), sunucu yok.
 * Yetki: hocalar/{uid} belgesi (firebase/firestore.rules → hoca()). Bu ekran veli portalının (veli-portali.ts) veri
 * modelini besler: yoklama/{ref}_{tarih}, ilerleme/{ref}, degerlendirme, notlar, odevler/{tarih}, duyurular, bildirimler.
 * Kişisel veri en azda tutulur (ad, soyad, veli e-postası, dil); kimlik numarası, adres, fotoğraf asla girilmez.
 */
import { temizleHtml, metniSadelestir, zenginMi } from '../lib/zengin-metin';
import { portalTercihleri } from '../lib/portal-tercihleri';

type Ders = { no: number; kod: string; alan: string; konu: string; ezber: string[] };
type PlanGun = { tarih: string; hafta: number; gun: string; dersler: Ders[] };
type Veri = { donem: string; gunler: PlanGun[]; materyalGunleri: string[]; materyalYolu: string; veliYollari: Record<string, string> };
type Ogr = { ref: string; ad: string; soyad: string; veliler?: string[]; dil?: string; durum?: string; grup?: string; kayitRef?: string };
type Aile = { eposta: string; ogrenciler: string[]; dil?: string; iletisimDili?: string; adSoyad?: string; sifreVar?: boolean; sonGiris?: string;
  /* Veli portalındaki «Ders kitabı ve materyal» kartının yanıtı: öğrenci ref'i → {secim, zaman} */
  kitapSecim?: Record<string, { secim: string; zaman: string }> };
type Yok = { ref: string; tarih: string; dersler?: Record<string, string>; durum?: string; not?: string };
type Ilerleme = { kuranAdim?: number; ezber?: Record<string, string>; alanlar?: Record<string, number>; hocaNotu?: string; guncelleme?: string; rozet?: string };
type Kayit = Record<string, unknown> & { id: string };

const ALANLAR: Record<string, string> = { kuran: 'Kur’an-ı Kerim', itikat: 'İtikat', ibadet: 'İbadet', siyer: 'Siyer', ahlak: 'Ahlak', genel: 'Genel' };
const DURUMLAR: Record<string, string> = { var: 'Var', yok: 'Yok', mazeret: 'Mazeretli', gec: 'Geç' };
const EZBER_DURUM: Record<string, string> = { '': '—', baslamadi: 'Başlamadı', tekrar: 'Tekrar ediyor', ogrendi: 'Öğrendi' };
const DERECE: Record<string, string> = { '0': '—', '1': 'Zayıf', '2': 'Gelişmeli', '3': 'Orta', '4': 'İyi', '5': 'Çok iyi' }; // kurs yoklama-değerlendirme şablonuyla aynı ölçek (1 = zayıf … 5 = çok iyi)
const OLCUTLER = ['Mahreç', 'Hareke / Med', 'Tecvid', 'Akıcılık', 'Ezber', 'Harf tanıma', 'Hece okuma', 'Dua / sure ezberi'];
const TUR: Record<string, string> = { mazeret: 'Mazeret', iletisim: 'İletişim', soru: 'Soru' };
const KITAP_ADI: Record<string, string> = { var: 'kitabı var', satin: 'satın alacak', fotokopi: 'fotokopi · 10 €' };
const DIL_ADI: Record<string, string> = { tr: 'Türkçe', fr: 'Fransızca', en: 'İngilizce' };
const GAS = 'https://script.google.com/macros/s/AKfycbz2cgLbdHmx9ejuk4euzybGbpDro0UAEjzjwl86tMdRtz05Pp5WI1JUZT374y_lb4J8BQ/exec';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
const tarihYaz = (iso: string, sec: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Brussels', ...sec }).format(new Date(iso.slice(0, 10) + 'T12:00:00')) : '';
const trBuyuk = (s: string) => s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
const trBaslik = (s: string) => s.split(/\s+/).filter(Boolean).map((w) => { const k = w === trBuyuk(w) ? w.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase() : w; return k.charAt(0).replace('i', 'İ').toUpperCase() + k.slice(1); }).join(' ');
const secenekler = (o: Record<string, string>, secili: string) => Object.entries(o).map(([k, v]) => `<option value="${esc(k)}" ${k === secili ? 'selected' : ''}>${esc(v)}</option>`).join('');
const zamanMs = (z: unknown) => { const t = z as { toDate?: () => Date } | string | undefined; return typeof t === 'string' ? Date.parse(t) : t?.toDate ? t.toDate().getTime() : 0; };
const zamanYaz = (z: unknown) => { const ms = zamanMs(z); return ms ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };

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
  cevir: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.3-3.7-8.5S9.6 5.8 12 3.5z"/>',
};
const simge = (ad: string) => `<svg class="simge" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${SIMGELER[ad] || ''}</svg>`;
const bosDurum = (ikon: string, metin: string) => `<p class="bos">${simge(ikon)}<span>${esc(metin)}</span></p>`;

export async function hocaEkrani(): Promise<void> {
  const kok = document.getElementById('hoca-ekrani');
  const veriEl = document.getElementById('hoca-veri');
  if (!kok || !veriEl) return;
  const veri = JSON.parse(veriEl.textContent || '{}') as Veri;
  const kuranSirasi = veri.gunler.flatMap((g) => g.dersler.filter((x) => x.kod === 'kuran').map((x) => ({ tarih: g.tarih, konu: x.konu }))).filter((x, i, d) => d.findIndex((y) => y.konu === x.konu) === i); // her Kur'an konusu bir adım (ilk işlendiği gün)
  const ezberListesi = [...new Set(veri.gunler.flatMap((g) => g.dersler.flatMap((x) => x.ezber)))];
  const ezberHaftasi: Record<string, number> = {}; veri.gunler.forEach((g) => g.dersler.forEach((d) => d.ezber.forEach((e) => { if (ezberHaftasi[e] == null || g.hafta < ezberHaftasi[e]) ezberHaftasi[e] = g.hafta; }))); // her ezber maddesinin ilk işlendiği hafta (öğrenci kartında ileri haftalar katlanır)
  const haftalar = veri.gunler.filter((g, i, d) => d.findIndex((y) => y.hafta === g.hafta) === i).map((g) => ({ hafta: g.hafta, tarih: g.tarih, gunler: veri.gunler.filter((x) => x.hafta === g.hafta) })); // tarih = haftanın İLK ders günü (odevler/{tarih} belge kimliği)

  const [{ firebaseUygulamasi }, auth, fs] = await Promise.all([import('../lib/firebase'), import('firebase/auth'), import('firebase/firestore/lite')]);
  const app = firebaseUygulamasi();
  const a = auth.getAuth(app);
  a.languageCode = 'tr';
  const db = fs.getFirestore(app);
  const sayfaAdresi = location.origin + location.pathname;
  const hata = (e: unknown) => { const kod = (e as { code?: string })?.code || ''; return kod ? `Hata: ${kod}` : `Hata: ${(e as Error)?.message || e}`; };
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
  const girisEkrani = (onMesaj = '') => {
    kok.innerHTML = `${onMesaj ? `<p class="not basari">${esc(onMesaj)}</p>` : ''}
      <div class="giris-izgara">
        <form class="kutu" data-form="giris" novalidate>
          <h2>Hoca girişi</h2>
          <label>E-posta<input type="email" name="eposta" required autocomplete="username"></label>
          <label>Şifre<input type="password" name="sifre" required autocomplete="current-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">Giriş yap</button><button type="button" class="dugme dugme-ikincil" data-eylem="sifremiUnuttum">Şifremi unuttum</button></div>
        </form>
        <form class="kutu" data-form="bag" novalidate>
          <h2>İlk giriş (şifresiz)</h2>
          <p class="kucuk">E-postanıza tek kullanımlık giriş bağlantısı gönderilir; açınca şifrenizi belirlersiniz. Şifreniz varsa soldaki formu ve «Şifremi unuttum»u kullanın (Google günde en fazla 5 giriş bağlantısı gönderir).</p>
          <label>E-posta<input type="email" name="eposta" required autocomplete="username"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">Bağlantı gönder</button></div>
        </form>
      </div>`;
    const kayitli = portalTercihleri.getItem('hocaEposta');
    if (kayitli) kok.querySelectorAll<HTMLInputElement>('input[name=eposta]').forEach((i) => { i.value = kayitli; });
  };
  const bagTamamlaEkrani = () => {
    kok.innerHTML = `<form class="kutu" data-form="bagTamamla" style="max-width:32rem" novalidate>
      <h2>Girişi tamamla</h2><p class="kucuk">Bağlantıyı başka bir cihazda açtınız; e-postanızı yazın.</p>
      <label>E-posta<input type="email" name="eposta" required autocomplete="username"></label>
      <p data-mesaj hidden class="not"></p>
      <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">Devam</button></div></form>`;
  };
  const sifreEkrani = () => {
    kok.innerHTML = `<form class="kutu" data-form="sifreBelirle" style="max-width:32rem" novalidate>
      <h2>Şifre belirle</h2><p class="kucuk">Sonraki girişlerde e-posta + bu şifre kullanılır (en az 8 karakter).</p>
      <label>Şifre<input type="password" name="sifre" required minlength="8" autocomplete="new-password"></label>
      <label>Şifre (tekrar)<input type="password" name="sifre2" required minlength="8" autocomplete="new-password"></label>
      <p data-mesaj hidden class="not"></p>
      <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">Kaydet</button><button type="button" class="dugme dugme-ikincil" data-eylem="atla">Şimdilik atla</button></div></form>`;
  };

  /* ---------------------------------------------------------------- durum */
  type Durum = {
    uid: string; ad: string; sekme: string; ogrenciler: Ogr[]; aileler: Aile[]; tarih: string; yoklama: Record<string, { dersler: Record<string, string>; not: string }>;
    secili: string; ilerleme: Ilerleme | null; degerlendirme: Kayit[]; notlar: Kayit[]; hafta: number; odevler: Kayit[]; duyurular: Kayit[]; bildirimler: Kayit[]; yukleniyor?: boolean;
  };
  let S: Durum | null = null;
  let duzenlenenDuyuru: string | null = null; // hoca bir duyuruyu düzenliyorsa id'si (yeni duyuru formu düzenleme kipine geçer)
  const col = (ad: string) => fs.collection(db, ad);
  const kayitlar = async (ad: string, ...kosullar: ReturnType<typeof fs.where>[]) => (await fs.getDocs(kosullar.length ? fs.query(col(ad), ...kosullar) : col(ad))).docs.map((x) => ({ id: x.id, ...x.data() } as Kayit));

  const varsayilanTarih = () => { const b = bugunISO(); return veri.gunler.find((g) => g.tarih === b)?.tarih || [...veri.gunler].reverse().find((g) => g.tarih <= b)?.tarih || veri.gunler[0].tarih; };
  const varsayilanHafta = () => { const b = bugunISO(); const bu = veri.gunler.find((g) => g.tarih >= b); return bu ? bu.hafta : haftalar[haftalar.length - 1].hafta; };

  const yukle = async (user: { uid: string }) => {
    const h = await fs.getDoc(fs.doc(db, 'hocalar', user.uid));
    if (!h.exists()) { kok.innerHTML = `<p class="not hata">Bu hesap hoca olarak tanımlı değil. Yönetici (info@ulucamii.be) hesabınızı tanımladıktan sonra tekrar girin.</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">Çıkış</button>`; return; }
    const [ogr, aile] = await Promise.all([kayitlar('ogrenciler'), kayitlar('aileler')]);
    S = {
      uid: user.uid, ad: String((h.data() as { ad?: string }).ad || ''), sekme: 'yoklama',
      ogrenciler: ogr.map((o) => ({ ...(o as unknown as Ogr), ref: o.id })).sort((x, y) => (x.soyad + x.ad).localeCompare(y.soyad + y.ad, 'tr')),
      aileler: (aile as unknown as Aile[]).map((x) => ({ ...x, eposta: (x as unknown as Kayit).id as string })),
      tarih: varsayilanTarih(), yoklama: {}, secili: '', ilerleme: null, degerlendirme: [], notlar: [], hafta: varsayilanHafta(), odevler: [], duyurular: [], bildirimler: [],
    };
    await yoklamaYukle();
    ciz();
  };
  const yoklamaYukle = async () => {
    if (!S) return; const k = await kayitlar('yoklama', fs.where('tarih', '==', S.tarih));
    S.yoklama = {}; (k as unknown as Yok[]).forEach((y) => { const ders = y.dersler && typeof y.dersler === 'object' ? { ...y.dersler } : (y.durum ? { '1': y.durum, '2': y.durum, '3': y.durum } : {}); S!.yoklama[y.ref] = { dersler: ders, not: y.not || '' }; });
  };
  const ogrenciYukle = async (ref: string) => {
    if (!S) return;
    const [ile, deg, not] = await Promise.all([fs.getDoc(fs.doc(db, 'ilerleme', ref)), kayitlar('degerlendirme', fs.where('ref', '==', ref)), kayitlar('notlar', fs.where('ref', '==', ref))]);
    S.secili = ref; S.ilerleme = ile.exists() ? (ile.data() as Ilerleme) : null;
    S.degerlendirme = deg.sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
    S.notlar = not.sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
  };
  const sekmeYukle = async (ad: string) => {
    if (!S) return;
    if (ad === 'odev') S.odevler = (await kayitlar('odevler')).sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
    if (ad === 'duyuru') S.duyurular = (await kayitlar('duyurular')).sort((x, y) => String(y.tarih).localeCompare(String(x.tarih)));
    if (ad === 'bildirim') S.bildirimler = (await kayitlar('bildirimler')).sort((x, y) => zamanMs(y.zaman) - zamanMs(x.zaman));
    if (ad === 'aile') S.aileler = ((await kayitlar('aileler')) as unknown as Aile[]).map((x) => ({ ...x, eposta: (x as unknown as Kayit).id as string }));
  };
  const ogrAdi = (ref: string) => { const o = S?.ogrenciler.find((x) => x.ref === ref); return o ? `${o.ad} ${o.soyad}` : ref; };

  /* ---------------------------------------------------------------- çizim */
  const SEKMELER: Record<string, string> = { yoklama: 'Yoklama', ogrenci: 'Öğrenciler', odev: 'Ezber · Ödev', duyuru: 'Duyurular', bildirim: 'Veli bildirimleri', aile: 'Aileler · Davet', hesap: 'Hesap' };
  const ciz = () => {
    if (!S) return;
    const aktif = S.ogrenciler.filter((o) => o.durum !== 'pasif');
    let govde = '';
    if (S.sekme === 'yoklama') {
      const g = veri.gunler.find((x) => x.tarih === S!.tarih);
      const gunDersler = g ? g.dersler : [];
      govde = `<section class="bolum">
        <h2>${simge('takvim')}Yoklama</h2>
        <div class="izgara-2">
          <label>Ders günü<select data-yoklama-tarih>${veri.gunler.map((x) => `<option value="${x.tarih}" ${x.tarih === S!.tarih ? 'selected' : ''}>${esc(tarihYaz(x.tarih, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${x.hafta}. hafta</option>`).join('')}</select></label>
          <div><label>&nbsp;</label><button type="button" class="dugme dugme-ikincil" data-eylem="hepsiVar">Tümünü «geldi» işaretle</button></div>
        </div>
        ${gunDersler.length ? `<p class="kucuk">${gunDersler.map((d) => `<b>${esc(String(d.no))}.</b> ${esc(ALANLAR[d.kod] || d.kod)}: ${esc(d.konu)}`).join(' · ')}</p><p class="kucuk">Her öğrencinin üç dersi ayrı ayrı işaretlenir; yalnız işaretlenen dersler kaydedilir.</p>` : '<p class="kucuk">Bu gün ders yok (tatil).</p>'}
        ${S.yukleniyor ? '<p class="not">Yükleniyor…</p>' : ''}
        <div ${S.yukleniyor ? 'hidden' : ''}>${aktif.map((o) => { const y = S!.yoklama[o.ref] || { dersler: {}, not: '' }; return `<div class="yk-satir">
            <div class="yk-ogr"><b>${esc(o.ad)} ${esc(o.soyad)}</b> ${o.grup ? `<span class="kucuk">${esc(o.grup)}</span>` : ''}</div>
            ${gunDersler.map((d) => { const sr = String(d.no); return `<div class="yk-ders">
              <span class="yk-ders-et"><span class="yk-ders-no">${esc(sr)}</span>${esc(ALANLAR[d.kod] || d.kod)}</span>
              <div class="yk-dugmeler">${Object.entries(DURUMLAR).map(([k, v]) => `<button type="button" class="yk-dugme ${k}" aria-pressed="${y.dersler[sr] === k}" data-yok="${esc(o.ref)}" data-ders="${esc(sr)}" data-durum="${k}" aria-label="${esc(o.ad)} ${esc(o.soyad)} — ${esc(sr)}. ders — ${esc(v)}">${v}</button>`).join('')}</div>
            </div>`; }).join('')}
            <input type="text" placeholder="Gün için not (isteğe bağlı)" data-yok-not="${esc(o.ref)}" value="${esc(y.not)}" maxlength="200" style="margin-top:.5rem">
          </div>`; }).join('')}</div>
        ${aktif.length ? '' : bosDurum('ogrenci', 'Aktif öğrenci yok.')}
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-birincil" data-eylem="yoklamaKaydet">Yoklamayı kaydet</button><span class="kucuk">Hiç ders işaretlenmemiş öğrenci için kayıt yazılmaz.</span></div>
      </section>`;
    } else if (S.sekme === 'ogrenci') {
      const o = S.ogrenciler.find((x) => x.ref === S!.secili);
      const pasifSay = S.ogrenciler.filter((x) => x.durum === 'pasif').length;
      govde = `<section class="bolum"><h2>${simge('ogrenci')}Öğrenciler <span class="kucuk">(${S.ogrenciler.length - pasifSay} aktif${pasifSay ? ` · ${pasifSay} pasif` : ''})</span></h2>
        <ul class="liste ogr-liste">${S.ogrenciler.map((x) => `<li class="${x.ref === S!.secili ? 'secili' : ''}"><button type="button" class="baglanti-dugme buyu ogr-ad" data-ogr="${esc(x.ref)}"${x.ref === S!.secili ? ' aria-current="true"' : ''}><b>${esc(x.ad)} ${esc(x.soyad)}</b></button>${x.grup ? `<span class="rozet grup">${esc(x.grup)}</span>` : ''}<span class="kucuk">${(x.veliler || []).length} veli</span>${x.durum === 'pasif' ? '<span class="rozet">pasif</span>' : ''}<span class="kucuk ogr-ref">${esc(x.ref)}</span></li>`).join('')}</ul>
        <p class="kucuk" style="margin-top:.6rem">Bir öğrenciyi seçince ilerleme, değerlendirme ve notları açılır. Yeni öğrenci: «Aileler · Davet» → «Kayıt defterinden yenile».</p></section>`;
      if (o) {
        const ile = S.ilerleme || {};
        const buHafta = varsayilanHafta();
        const ezberSatir = (e: string) => `<tr><td>${esc(e)}</td><td><select name="ezber:${esc(e)}">${secenekler(EZBER_DURUM, (ile.ezber || {})[e] || '')}</select></td></tr>`;
        const ezberBu = ezberListesi.filter((e) => (ezberHaftasi[e] ?? 99) <= buHafta || Boolean((ile.ezber || {})[e]));
        const ezberSonra = ezberListesi.filter((e) => !ezberBu.includes(e));
        govde += `<section class="bolum" id="ogrenci-karti">
          <h2>${simge('ogrenci')}${esc(o.ad)} ${esc(o.soyad)} <span class="kucuk">${esc(o.ref)} · ${esc(DIL_ADI[o.dil || ''] || o.dil || '')}</span></h2>
          <form data-form="ogrenciAyar" class="izgara-3">
            <label>Durum<select name="durum">${secenekler({ aktif: 'Aktif', pasif: 'Pasif' }, o.durum === 'pasif' ? 'pasif' : 'aktif')}</select></label>
            <label>Grup / sınıf<input type="text" name="grup" value="${esc(o.grup || '')}" maxlength="40"></label>
            <div><label>&nbsp;</label><button type="submit" class="dugme dugme-ikincil">Kaydet</button></div>
            <p data-mesaj hidden class="not" style="grid-column:1/-1"></p>
          </form>

          <h3>${simge('aile')}Veliler (e-posta)</h3>
          <ul class="liste">${(o.veliler || []).map((e) => `<li><span class="buyu">${esc(e)}</span><button type="button" class="baglanti-dugme" data-veli-sil="${esc(e)}">kaldır</button></li>`).join('') || '<li class="kucuk">Veli e-postası yok.</li>'}</ul>
          <form data-form="veliEkle" class="satir-dugmeler"><input type="email" name="eposta" placeholder="veli@ornek.be" required style="flex:1 1 14rem"><button type="submit" class="dugme dugme-ikincil">Veli ekle</button><p data-mesaj hidden class="not" style="flex-basis:100%"></p></form>

          <h3>${simge('grafik')}İlerleme</h3>
          <form data-form="ilerleme">
            <label>Kur’an’da gelinen adım<select name="kuranAdim"><option value="-1">—</option>${kuranSirasi.map((k, i) => `<option value="${i}" ${ile.kuranAdim === i ? 'selected' : ''}>${i + 1}. ${esc(k.konu)} (${esc(tarihYaz(k.tarih, { day: 'numeric', month: 'short' }))})</option>`).join('')}</select></label>
            <label style="margin-top:.9rem">Ezber / sûre durumu</label>
            <div class="kaydirilir"><table class="tablo"><thead><tr><th>Ezber</th><th>Durum</th></tr></thead><tbody>
              ${ezberBu.map(ezberSatir).join('') || '<tr><td colspan="2" class="kucuk">Bu haftaya kadar planda ezber maddesi yok.</td></tr>'}
            </tbody></table></div>
            ${ezberSonra.length ? `<details class="katlanir mini"><summary>${simge('takvim')}<span>İleri haftaların ezberleri (${ezberSonra.length})</span></summary><div class="govde kaydirilir"><table class="tablo"><tbody>${ezberSonra.map(ezberSatir).join('')}</tbody></table></div></details>` : ''}
            <label style="margin-top:1rem">Alan değerlendirmesi <span class="kucuk">· 1 zayıf – 5 çok iyi</span></label>
            <div class="izgara-3">${['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak'].map((k) => `<label>${esc(ALANLAR[k])}<select name="alan:${k}">${secenekler(DERECE, String((ile.alanlar || {})[k] || 0))}</select></label>`).join('')}</div>
            <label style="margin-top:.8rem">Hocanın Tebrik / Takdir Rozeti <span class="kucuk">· Öğrenci odasında parlar</span>
              <select name="rozet">
                <option value="">— Rozet seçilmedi —</option>
                <option value="yildiz" ${ile.rozet === 'yildiz' ? 'selected' : ''}>⭐ Haftanın Yıldız Talebesi</option>
                <option value="ezber" ${ile.rozet === 'ezber' ? 'selected' : ''}>📖 Ezber &amp; Sûre Şampiyonu</option>
                <option value="ahlak" ${ile.rozet === 'ahlak' ? 'selected' : ''}>🌸 Güzel Ahlâk ve Nezaket</option>
                <option value="gayret" ${ile.rozet === 'gayret' ? 'selected' : ''}>🏆 Üstün Gayret ve Azim</option>
                <option value="devam" ${ile.rozet === 'devam' ? 'selected' : ''}>🏅 Düzenli Devam ve Disiplin</option>
              </select>
            </label>
            <label>Hoca notu (veliye ve öğrenci odasına görünür)<textarea name="hocaNotu" maxlength="1000">${esc(ile.hocaNotu || '')}</textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">İlerlemeyi kaydet</button>${ile.guncelleme ? `<span class="kucuk">Son güncelleme ${esc(tarihYaz(ile.guncelleme))}</span>` : ''}</div>
          </form>

          <h3>${simge('yildiz')}Değerlendirmeler</h3>
          <ul class="liste">${S.degerlendirme.map((d) => `<li><span class="kucuk">${esc(tarihYaz(String(d.tarih)))}</span><b>${esc(ALANLAR[String(d.alan)] || d.alan)}</b><span class="buyu">${esc(d.olcut || '')}</span><span class="rozet">${esc(DERECE[String(d.derece)] || '')}</span><span class="kucuk">${esc(d.not || '')}</span><button type="button" class="baglanti-dugme" data-sil="degerlendirme" data-id="${esc(d.id)}">sil</button></li>`).join('') || '<li class="kucuk">Henüz değerlendirme yok.</li>'}</ul>
          <form data-form="degerlendirme" class="izgara-3">
            <label>Tarih<input type="date" name="tarih" value="${bugunISO()}" required></label>
            <label>Alan<select name="alan">${secenekler(ALANLAR, 'kuran')}</select></label>
            <label>Derece (1 zayıf – 5 çok iyi)<select name="derece">${secenekler(DERECE, '4')}</select></label>
            <label style="grid-column:1/-1">Ölçüt / konu<input type="text" name="olcut" maxlength="120" list="olcut-listesi" placeholder="örn. Mahreç, Tecvid, Fâtiha ezberi"><datalist id="olcut-listesi">${OLCUTLER.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></label>
            <label style="grid-column:1/-1">Not<input type="text" name="not" maxlength="300"></label>
            <div><button type="submit" class="dugme dugme-ikincil">Değerlendirme ekle</button></div>
            <p data-mesaj hidden class="not" style="grid-column:1/-1"></p>
          </form>

          <h3>${simge('not')}Notlar</h3>
          <ul class="liste">${S.notlar.map((n) => `<li><span class="kucuk">${esc(tarihYaz(String(n.tarih)))}</span><span class="buyu" style="white-space:pre-line">${esc(n.metin)}</span><span class="rozet">${n.veliyeGorunur ? 'veliye görünür' : 'yalnız hoca'}</span><button type="button" class="baglanti-dugme" data-sil="notlar" data-id="${esc(n.id)}">sil</button></li>`).join('') || '<li class="kucuk">Henüz not yok.</li>'}</ul>
          <form data-form="not">
            <div class="izgara-2"><label>Tarih<input type="date" name="tarih" value="${bugunISO()}" required></label><label class="satir" style="margin-top:1.9rem"><input type="checkbox" name="veliyeGorunur" checked> Veliye görünür</label></div>
            <label>Not<textarea name="metin" maxlength="1000" required></textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">Not ekle</button></div>
          </form>
        </section>`;
      }
    } else if (S.sekme === 'odev') {
      const h = haftalar.find((x) => x.hafta === S!.hafta) || haftalar[0];
      const mevcut = S.odevler.find((x) => x.tarih === h.tarih);
      const planEzber = [...new Set(h.gunler.flatMap((g) => g.dersler.flatMap((d) => d.ezber)))];
      const ez = (mevcut?.ezber as Record<string, string> | undefined) || {}; const od = (mevcut?.odev as Record<string, string> | undefined) || {};
      const materyalVar = h.gunler.some((g) => veri.materyalGunleri.includes(g.tarih));
      const idx = haftalar.findIndex((x) => x.hafta === h.hafta);
      const gecenVar = haftalar.slice(0, idx).some((x) => S!.odevler.some((o) => o.tarih === x.tarih));
      const frVar = Boolean(ez.fr || od.fr);
      govde = `<section class="bolum"><h2>${simge('kitap')}Haftalık ezber ve ödev</h2>
        <label>Hafta<select data-hafta>${haftalar.map((x) => `<option value="${x.hafta}" ${x.hafta === h.hafta ? 'selected' : ''}>${x.hafta}. hafta · ${esc(x.gunler.map((g) => tarihYaz(g.tarih, { day: 'numeric', month: 'short' })).join(' – '))}${S!.odevler.some((o) => o.tarih === x.tarih) ? ' ✓' : ''}</option>`).join('')}</select></label>
        <p class="kucuk plan-ozet">${h.gunler.map((g) => `<b>${esc(tarihYaz(g.tarih, { weekday: 'long' }))}:</b> ${g.dersler.map((d) => esc(d.konu)).join(' · ')}`).join('<br>')}</p>
        <form data-form="odev">
          <p class="kucuk">${mevcut ? 'Bu hafta için kayıt var; düzenleyip yeniden kaydedin.' : 'Ezber, yıllık planınızdan otomatik dolduruldu; gerekirse değiştirin. Fransızca boşsa velilere Türkçe metin gösterilir.'}</p>
          ${gecenVar ? `<div class="satir-dugmeler" style="margin:0 0 .3rem"><button type="button" class="kucuk-dugme" data-eylem="odevKopyala">${simge('kopyala')}Geçen haftadan kopyala</button></div>` : ''}
          <label>Ezber (TR)<textarea name="ezberTr" maxlength="1000">${esc(ez.tr ?? planEzber.join('\n'))}</textarea></label>
          <label>Ödev (TR)<textarea name="odevTr" maxlength="1000" placeholder="Örn. sunumları tekrar edin; sayfa … çalışın">${esc(od.tr || '')}</textarea></label>
          <details class="katlanir mini"${frVar ? ' open' : ''}><summary>${simge('cevir')}<span>Fransızca çeviri (isteğe bağlı)</span></summary><div class="govde">
            <label>Ezber (FR)<textarea name="ezberFr" maxlength="1000">${esc(ez.fr || '')}</textarea></label>
            <label>Ödev (FR)<textarea name="odevFr" maxlength="1000">${esc(od.fr || '')}</textarea></label>
          </div></details>
          <label>Materyal bağlantısı<input type="url" name="materyal" value="${esc(mevcut?.materyal ?? (materyalVar ? location.origin + veri.materyalYolu + '#g-' + h.gunler.find((g) => veri.materyalGunleri.includes(g.tarih))!.tarih : ''))}"></label>
          <label class="satir"><input type="checkbox" name="yayin" ${mevcut ? (mevcut.yayin ? 'checked' : '') : 'checked'}> Velilere yayınla</label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">Kaydet</button>${mevcut ? `<button type="button" class="baglanti-dugme" data-sil="odevler" data-id="${esc(mevcut.id)}">bu haftanın kaydını sil</button>` : ''}</div>
        </form></section>`;
    } else if (S.sekme === 'duyuru') {
      const duz = duzenlenenDuyuru ? S.duyurular.find((d) => d.id === duzenlenenDuyuru) : null;
      const dBas = (duz?.baslik as Record<string, string>) || {}; const dMet = (duz?.metin as Record<string, string>) || {};
      const za = (ad: string, etiket: string, deger: string, gerekli = false) => `<div class="zengin-alan"><span class="za-et">${etiket}</span>
        <div class="za-arac" role="group" aria-label="${etiket} biçimlendirme">
          <button type="button" class="za-b" data-zk="bold" title="Kalın"><b>B</b></button><button type="button" class="za-b" data-zk="italic" title="İtalik"><i>I</i></button><button type="button" class="za-b" data-zk="underline" title="Altı çizili"><u>U</u></button>
          <span class="za-ayr"></span>
          <button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#b5452b" title="Kiremit" style="color:#b5452b">A</button><button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#1f5f8b" title="Mavi" style="color:#1f5f8b">A</button><button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#2f6d3c" title="Yeşil" style="color:#2f6d3c">A</button><button type="button" class="za-b za-renk" data-zk="foreColor" data-renk="#24201c" title="Varsayılan renk" style="color:#24201c">A</button>
          <span class="za-ayr"></span>
          <button type="button" class="za-b" data-zk="createLink" title="Bağlantı ekle"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.5 13.5a4 4 0 0 0 5.5 0l3-3a4 4 0 0 0-5.5-5.5l-1 1"/><path d="M14.5 10.5a4 4 0 0 0-5.5 0l-3 3a4 4 0 0 0 5.5 5.5l1-1"/></svg></button>
          <span class="za-ayr"></span>
          ${['🕌', '📖', '📅', '✅', '⭐', '❗', '🤲', '🎉'].map((e) => `<button type="button" class="za-b za-emoji" data-zk="emoji" data-emoji="${e}" title="Ekle">${e}</button>`).join('')}
        </div>
        <div class="za-yaz" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${etiket}" data-zengin="${ad}"${gerekli ? ' data-gerekli="1"' : ''}>${zenginMi(deger || '') ? temizleHtml(deger || '') : esc(deger || '').replace(/\n/g, '<br>')}</div>
      </div>`;
      govde = `<section class="bolum"><h2>${simge('duyuru')}Duyurular</h2>
        ${S.duyurular.map((d) => { const b = d.baslik as Record<string, string>; const m = d.metin as Record<string, string>; return `<div class="duyuru${d.id === duzenlenenDuyuru ? ' duzenlenen' : ''}"><div class="duyuru-ust"><span class="kucuk">${esc(tarihYaz(String(d.tarih)))}</span> <span class="rozet ${d.yayin ? 'var' : ''}">${d.yayin ? 'yayında' : 'taslak'}</span><span class="duyuru-eylem"><button type="button" class="baglanti-dugme" data-duyuru-duzelt="${esc(d.id)}">düzenle</button> <button type="button" class="baglanti-dugme" data-yayin="duyurular" data-id="${esc(d.id)}" data-deger="${d.yayin ? '0' : '1'}">${d.yayin ? 'yayından kaldır' : 'yayınla'}</button> <button type="button" class="baglanti-dugme" data-sil="duyurular" data-id="${esc(d.id)}">sil</button></span></div><b>${esc(b?.tr || '')}</b>${b?.fr ? ` <span class="kucuk">· ${esc(b.fr)}</span>` : ''}<p>${esc(zenginMi(m?.tr || '') ? metniSadelestir(m?.tr || '') : (m?.tr || ''))}</p></div>`; }).join('') || '<p class="kucuk">Henüz duyuru yok.</p>'}
        <h3>${duz ? simge('kalem') + 'Duyuruyu düzenle' : simge('duyuru') + 'Yeni duyuru'}</h3>
        <form data-form="duyuru" class="${duz ? 'duzenleme' : ''}">
          ${duz ? `<p class="duzen-not">${simge('kalem')}<span>Var olan bir duyuruyu düzenliyorsunuz.</span></p>` : ''}
          <label>Tarih<input type="date" name="tarih" value="${esc(duz ? String(duz.tarih) : bugunISO())}" required></label>
          <div class="izgara-3"><label>Başlık (TR)<input type="text" name="baslikTr" maxlength="120" value="${esc(dBas.tr || '')}" required></label><label>Titre (FR)<input type="text" name="baslikFr" maxlength="120" value="${esc(dBas.fr || '')}"></label><label>Title (EN)<input type="text" name="baslikEn" maxlength="120" value="${esc(dBas.en || '')}"></label></div>
          <div class="izgara-zengin">${za('metinTr', 'Metin (TR)', dMet.tr, true)}${za('metinFr', 'Texte (FR)', dMet.fr)}${za('metinEn', 'Text (EN)', dMet.en)}</div>
          <label class="satir"><input type="checkbox" name="yayin" ${duz ? (duz.yayin ? 'checked' : '') : 'checked'}> ${duz ? 'Yayında' : 'Hemen yayınla'}</label>
          <p class="kucuk">Fransızca/İngilizce boşsa velilere Türkçe metin gösterilir.</p>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${duz ? 'Değişikliği kaydet' : 'Duyuruyu kaydet'}</button>${duz ? '<button type="button" class="dugme dugme-ikincil" data-eylem="duyuruVazgec">Vazgeç</button>' : ''}</div>
        </form></section>`;
    } else if (S.sekme === 'bildirim') {
      const turRozet: Record<string, string> = { mazeret: 'mazeret', iletisim: 'var', soru: 'gec' };
      const okunmamis = S.bildirimler.filter((b) => !b.okundu).length;
      govde = `<section class="bolum"><h2>${simge('zarf')}Veli bildirimleri <span class="kucuk">(${okunmamis} okunmamış · ${S.bildirimler.length} toplam)</span></h2>
        ${S.bildirimler.map((b) => { const y = b.yanit ? String(b.yanit) : ''; return `<article class="bildirim-kart${b.okundu ? ' okundu' : ' yeni'}">
          <div class="bk-ust"><span class="rozet ${turRozet[String(b.tur)] || ''}">${esc(TUR[String(b.tur)] || b.tur)}</span><b class="bk-ogr">${esc(ogrAdi(String(b.ref)))}</b>${b.tarih ? `<span class="rozet">${esc(tarihYaz(String(b.tarih), { weekday: 'short', day: 'numeric', month: 'short' }))}</span>` : ''}${b.okundu ? '' : '<span class="bk-nokta" title="okunmamış"></span>'}<span class="kucuk bk-zaman">${esc(zamanYaz(b.zaman))}</span></div>
          <p class="bk-metin">${esc(b.metin)}</p>
          <p class="kucuk bk-eposta">${simge('zarf')}<a href="mailto:${esc(b.eposta)}">${esc(b.eposta)}</a></p>
          ${y ? `<div class="bk-yanit"><span class="bk-yanit-bas">${simge('gonder')}Yanıtınız · ${esc(zamanYaz(b.yanitZaman))}</span><p>${esc(y)}</p></div>` : ''}
          <div class="bk-yanit-form">
            <textarea aria-label="Veliye yanıt" data-yanit-metin="${esc(b.id)}" rows="2" maxlength="1000" placeholder="${y ? 'Yanıtı güncelleyin…' : 'Veliye kısa bir yanıt yazın…'}">${esc(y)}</textarea>
            <div class="bk-eylem"><button type="button" class="dugme dugme-birincil" data-yanitla="${esc(b.id)}">${simge('gonder')}${y ? 'Yanıtı güncelle' : 'Yanıtla'}</button><button type="button" class="baglanti-dugme" data-okundu="${esc(b.id)}" data-deger="${b.okundu ? '0' : '1'}">${b.okundu ? 'okunmadı yap' : 'okundu işaretle'}</button><button type="button" class="baglanti-dugme sil-bag" data-sil="bildirimler" data-id="${esc(b.id)}">sil</button></div>
          </div>
        </article>`; }).join('') || bosDurum('zarf', 'Henüz veli bildirimi yok. Veliler mazeret, iletişim değişikliği ya da soru gönderdiğinde burada görünür.')}
      </section>`;
    } else if (S.sekme === 'aile') {
      const kitapSay = { var: 0, satin: 0, fotokopi: 0, yok: 0 };
      for (const f of S.aileler) for (const r of f.ogrenciler || []) {
        const v = (f.kitapSecim || {})[r];
        if (v && v.secim in kitapSay) kitapSay[v.secim as keyof typeof kitapSay]++; else kitapSay.yok++;
      }
      govde = `<section class="bolum"><h2>${simge('aile')}Aileler <span class="kucuk">(${S.aileler.length})</span></h2>
        <p class="kucuk"><b>Ders kitabı durumu:</b> ${kitapSay.var} kitabı var · ${kitapSay.satin} satın alacak · ${kitapSay.fotokopi} fotokopi (10 €) · ${kitapSay.yok} yanıt yok</p>
        <p class="kucuk">«Davet gönder»: veliye kendi dilinde tek kullanımlık giriş bağlantısı e-postalanır; veli bağlantıyı açıp şifresini belirler. Google'ın ücretsiz planı günde en fazla <b>5</b> davet e-postası gönderir; toplu davet için yönetici betiği (info@ulucamii.be üzerinden) kullanılır.</p>
        <ul class="liste">${S.aileler.map((f) => `<li><span class="buyu"><b>${esc(f.eposta)}</b><br><span class="kucuk">${esc(f.adSoyad || '')} · ${esc(DIL_ADI[f.dil || ''] || f.dil || '')} · ${esc((f.ogrenciler || []).map(ogrAdi).join(', '))}</span></span>
          <span class="rozet">${f.sifreVar ? 'şifre belirledi' : 'henüz girmedi'}</span>${f.sonGiris ? `<span class="kucuk">son giriş ${esc(tarihYaz(f.sonGiris))}</span>` : ''}
          <span class="kucuk">${(f.ogrenciler || []).map((r) => { const v = (f.kitapSecim || {})[r]; return `${esc(ogrAdi(r))}: <span class="rozet ${v ? (v.secim === 'var' ? 'ogrendi' : v.secim === 'fotokopi' ? 'gec' : 'mazeret') : ''}">${esc(v ? (KITAP_ADI[v.secim] || v.secim) : 'kitap yanıtı yok')}</span>`; }).join(' · ')}</span>
          <button type="button" class="dugme dugme-ikincil" data-davet="${esc(f.eposta)}" data-dil="${esc(f.iletisimDili || f.dil || '')}">Davet gönder</button></li>`).join('') || '<li class="kucuk">Aile yok.</li>'}</ul>
        <p data-ust-mesaj hidden class="not"></p>
        <h3>Kayıt defteri</h3>
        <p class="kucuk">Online kayıt defterindeki güncel öğrencileri (ad, soyad, veli e-postası, dil) portala aktarır; başka veri aktarılmaz. Var olan kayıtlar korunur.</p>
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-eylem="iceAktar">Kayıt defterinden yenile</button></div></section>`;
    } else if (S.sekme === 'hesap') {
      govde = `<section class="bolum"><h2>${simge('ayar')}Hesap</h2><p>${esc(S.ad)} · <span class="kucuk">${esc(a.currentUser?.email || '')}</span></p>
        <form data-form="sifreDegistir" style="max-width:28rem"><label>Yeni şifre<input type="password" name="sifre" minlength="8" required autocomplete="new-password"></label><p data-mesaj hidden class="not"></p>
        <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">Şifreyi değiştir</button></div></form>
        <p class="kucuk" style="margin-top:1rem">Veli portalı: <a href="${esc(veri.veliYollari.tr)}">${esc(location.origin + veri.veliYollari.tr)}</a></p></section>`;
    }
    const SEKME_IKON: Record<string, string> = { yoklama: 'takvim', ogrenci: 'ogrenci', odev: 'kitap', duyuru: 'duyuru', bildirim: 'zarf', aile: 'aile', hesap: 'ayar' };
    kok.innerHTML = `<div class="hoca-hero"><div class="hero-serit" aria-hidden="true"></div>
        <p class="etiket etiket-vurgu">Hoca ekranı · ${esc(veri.donem)} dönemi</p>
        <div class="hero-ust"><p class="selam"><small class="kucuk">Hoş geldiniz</small><span class="ad">${esc(S.ad)}</span></p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${simge('cikis')}Çıkış</button></div>
      </div>
      <div class="sekmeler" role="tablist" aria-label="Bölümler">${Object.entries(SEKMELER).map(([k, v]) => `<button type="button" role="tab" id="hoca-tab-${k}" class="sekme" aria-selected="${k === S!.sekme}" aria-controls="hoca-panel" tabindex="${k === S!.sekme ? '0' : '-1'}" data-sekme="${k}">${simge(SEKME_IKON[k] || 'ayar')}<span>${v}</span></button>`).join('')}</div>
      <div id="hoca-panel" role="tabpanel" aria-labelledby="hoca-tab-${S.sekme}">${govde}</div>`;
  };

  /* ---------------------------------------------------------------- olaylar */
  const bagIleGir = async (eposta: string) => {
    const kb = await auth.signInWithEmailLink(a, eposta, location.href);
    portalTercihleri.setItem('hocaEposta', eposta); history.replaceState(null, '', sayfaAdresi);
    const h = await fs.getDoc(fs.doc(db, 'hocalar', kb.user.uid)).catch(() => null);
    if (h && h.exists() && !(h.data() as { sifreVar?: boolean }).sifreVar) sifreEkrani(); else await yukle(kb.user);
  };
  const sekmeyeGec = async (ad: string) => { if (!S) return; S.sekme = ad; duzenlenenDuyuru = null; kok.innerHTML = '<p class="not">Yükleniyor…</p>'; await sekmeYukle(ad); ciz(); };

  kok.addEventListener('mousedown', (ev) => { if ((ev.target as HTMLElement).closest('.za-arac')) ev.preventDefault(); });
  kok.addEventListener('click', async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-eylem],[data-sekme],[data-yok],[data-ogr],[data-sil],[data-yayin],[data-okundu],[data-yanitla],[data-duyuru-duzelt],[data-davet],[data-veli-sil],[data-zk]');
    if (!el) return;
    try {
      if (el.dataset.eylem === 'cikis') { await auth.signOut(a); S = null; girisEkrani(); return; }
      if (el.dataset.eylem === 'atla' && a.currentUser) { await yukle(a.currentUser); return; }
      if (el.dataset.eylem === 'sifremiUnuttum') {
        const form = el.closest('form') as HTMLFormElement; const ep = (form.querySelector('input[name=eposta]') as HTMLInputElement).value.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ep)) { mesaj(form, 'Geçerli bir e-posta yazın.', 'hata'); return; }
        await auth.sendPasswordResetEmail(a, ep, { url: sayfaAdresi }); portalTercihleri.setItem('hocaEposta', ep);
        mesaj(form, `Şifre sıfırlama bağlantısı gönderildi: ${ep}. Bağlantıyı açıp yeni şifrenizi belirleyin, sonra giriş yapın.`, 'basari'); return;
      }
      if (el.dataset.sekme) { const ad = el.dataset.sekme; await sekmeyeGec(ad); kok.querySelector<HTMLElement>('#hoca-tab-' + ad)?.focus(); return; }
      if (!S) return;
      if (el.dataset.zk) {
        const yaz = el.closest('.zengin-alan')?.querySelector<HTMLElement>('.za-yaz'); if (!yaz) return;
        yaz.focus();
        try {
          const zk = el.dataset.zk;
          if (zk === 'emoji') document.execCommand('insertText', false, el.dataset.emoji || '');
          else if (zk === 'foreColor') document.execCommand('foreColor', false, el.dataset.renk || '#24201c');
          else if (zk === 'createLink') { const u = (prompt('Bağlantı adresi (https://…):') || '').trim(); if (/^https?:\/\//i.test(u)) document.execCommand('createLink', false, u); }
          else document.execCommand(zk);
        } catch { /* execCommand desteklenmiyorsa yoksay */ }
        return;
      }
      if (el.dataset.yok) { const ref = el.dataset.yok; const sr = el.dataset.ders || '1'; const d = el.dataset.durum || ''; const y = S.yoklama[ref] || { dersler: {}, not: '' }; y.dersler[sr] = y.dersler[sr] === d ? '' : d; S.yoklama[ref] = y;
        el.parentElement!.querySelectorAll<HTMLElement>('.yk-dugme').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.durum === y.dersler[sr]))); return; }
      if (el.dataset.eylem === 'hepsiVar') { const gun = veri.gunler.find((x) => x.tarih === S!.tarih); const siras = (gun ? gun.dersler : []).map((d) => String(d.no)); S.ogrenciler.filter((o) => o.durum !== 'pasif').forEach((o) => { const ders: Record<string, string> = {}; siras.forEach((s) => { ders[s] = 'var'; }); S!.yoklama[o.ref] = { dersler: ders, not: S!.yoklama[o.ref]?.not || '' }; }); ciz(); return; }
      if (el.dataset.eylem === 'yoklamaKaydet') {
        kok.querySelectorAll<HTMLInputElement>('[data-yok-not]').forEach((i) => { const ref = i.dataset.yokNot!; const not = i.value.trim(); const y = S!.yoklama[ref]; if (y) y.not = not; else if (not) S!.yoklama[ref] = { dersler: {}, not }; });
        const b = fs.writeBatch(db); let n = 0;
        for (const [ref, y] of Object.entries(S.yoklama)) {
          const id = fs.doc(db, 'yoklama', `${ref}_${S.tarih}`);
          const dersler: Record<string, string> = {}; for (const s of Object.keys(y.dersler)) if (y.dersler[s]) dersler[s] = y.dersler[s];
          if (Object.keys(dersler).length || y.not) { b.set(id, { ref, tarih: S.tarih, dersler, not: y.not || '', kaydeden: S.uid, zaman: fs.serverTimestamp() }); n++; } else b.delete(id);
        }
        await b.commit(); ustMesaj(`${n} öğrencinin yoklaması kaydedildi (${tarihYaz(S.tarih)}).`, 'basari'); return;
      }
      if (el.dataset.ogr) { kok.querySelector('#ogrenci-karti')?.remove(); await ogrenciYukle(el.dataset.ogr); ciz(); kok.querySelector('#ogrenci-karti')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (el.dataset.sil) { if (!confirm('Silinsin mi?')) return; await fs.deleteDoc(fs.doc(db, el.dataset.sil, el.dataset.id!));
        if (S.sekme === 'ogrenci') await ogrenciYukle(S.secili); else await sekmeYukle(S.sekme); ciz(); ustMesaj('Silindi.', 'basari'); return; }
      if (el.dataset.yayin) { await fs.updateDoc(fs.doc(db, el.dataset.yayin, el.dataset.id!), { yayin: el.dataset.deger === '1' }); await sekmeYukle(S.sekme); ciz(); return; }
      if (el.dataset.okundu) { await fs.updateDoc(fs.doc(db, 'bildirimler', el.dataset.okundu), { okundu: el.dataset.deger === '1' }); await sekmeYukle('bildirim'); ciz(); return; }
      if (el.dataset.yanitla) { const kart = el.closest('.bildirim-kart'); const ta = kart?.querySelector<HTMLTextAreaElement>('[data-yanit-metin]'); const metin = (ta?.value || '').trim();
        if (!metin) { ustMesaj('Önce yanıt metnini yazın.', 'hata'); ta?.focus(); return; }
        (el as HTMLButtonElement).disabled = true;
        await fs.updateDoc(fs.doc(db, 'bildirimler', el.dataset.yanitla), { yanit: metin.slice(0, 1000), yanitZaman: fs.serverTimestamp(), okundu: true });
        await sekmeYukle('bildirim'); ciz(); ustMesaj('Yanıt gönderildi; veli portalında görünecek.', 'basari'); return; }
      if (el.dataset.duyuruDuzelt) { duzenlenenDuyuru = el.dataset.duyuruDuzelt; ciz(); kok.querySelector('form[data-form=duyuru]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (el.dataset.eylem === 'duyuruVazgec') { duzenlenenDuyuru = null; ciz(); return; }
      if (el.dataset.eylem === 'odevKopyala') {
        const i = haftalar.findIndex((x) => x.hafta === S!.hafta);
        const onceki = haftalar.slice(0, i).reverse().find((x) => S!.odevler.some((o) => o.tarih === x.tarih));
        const rec = onceki ? S.odevler.find((o) => o.tarih === onceki.tarih) : undefined;
        if (!rec) { ustMesaj('Kopyalanacak önceki hafta kaydı yok.', 'hata'); return; }
        const ez = (rec.ezber as Record<string, string>) || {}; const od = (rec.odev as Record<string, string>) || {};
        const setV = (n: string, v: string) => { const t = kok.querySelector<HTMLTextAreaElement>(`form[data-form=odev] [name=${n}]`); if (t) t.value = v; };
        setV('ezberTr', ez.tr || ''); setV('ezberFr', ez.fr || ''); setV('odevTr', od.tr || ''); setV('odevFr', od.fr || '');
        if (ez.fr || od.fr) { const dd = kok.querySelector<HTMLDetailsElement>('form[data-form=odev] details'); if (dd) dd.open = true; }
        ustMesaj(`${onceki!.hafta}. haftanın ezber/ödevi forma kopyalandı; düzenleyip kaydedin.`, 'basari'); return; }
      if (el.dataset.davet) {
        const ep = el.dataset.davet; const dil = el.dataset.dil || '';
        if (!['tr', 'fr', 'en'].includes(dil)) { ustMesaj('Davet göndermeden önce velinin iletişim dilini doğrulayınız.', 'hata'); return; }
        (el as HTMLButtonElement).disabled = true;
        a.languageCode = dil;
        try { await auth.sendSignInLinkToEmail(a, ep, { url: location.origin + (veri.veliYollari[dil] || veri.veliYollari.tr), handleCodeInApp: true }); }
        finally { a.languageCode = 'tr'; (el as HTMLButtonElement).disabled = false; }
        await fs.setDoc(fs.doc(db, 'aileler', ep), { davet: new Date().toISOString() }, { merge: true }).catch(() => {});
        ustMesaj(`Davet gönderildi: ${ep} (${DIL_ADI[dil] || dil}).`, 'basari'); return;
      }
      if (el.dataset.veliSil) { const ep = el.dataset.veliSil; const o = S.ogrenciler.find((x) => x.ref === S!.secili); if (!o || !confirm(`${ep} bu öğrenciden kaldırılsın mı?`)) return;
        await fs.updateDoc(fs.doc(db, 'ogrenciler', o.ref), { veliler: fs.arrayRemove(ep) });
        await fs.setDoc(fs.doc(db, 'aileler', ep), { ogrenciler: fs.arrayRemove(o.ref) }, { merge: true });
        o.veliler = (o.veliler || []).filter((x) => x !== ep); ciz(); return; }
      if (el.dataset.eylem === 'iceAktar') { (el as HTMLButtonElement).disabled = true; ustMesaj('Kayıt defteri okunuyor…'); await iceAktar(); (el as HTMLButtonElement).disabled = false; return; }
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
    ev.preventDefault(); const ad = keys[h]; sekmeyeGec(ad).then(() => kok.querySelector<HTMLElement>('#hoca-tab-' + ad)?.focus());
  });
  kok.addEventListener('change', async (ev) => {
    const t = ev.target as HTMLSelectElement;
    if (!S) return;
    if (t.matches('[data-yoklama-tarih]')) { S.tarih = t.value; S.yoklama = {}; S.yukleniyor = true; ciz(); await yoklamaYukle(); S.yukleniyor = false; ciz(); } // yükleme bitmeden tıklanan işaretler kaybolmasın diye liste önce kapatılır
    if (t.matches('[data-hafta]')) { S.hafta = Number(t.value); ciz(); }
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
    const dugmeler = form.querySelectorAll<HTMLButtonElement>('button'); dugmeler.forEach((b) => { b.disabled = true; });
    mesaj(form, '');
    try {
      switch (form.dataset.form) {
        case 'giris': { const ep = al('eposta').toLowerCase(); portalTercihleri.setItem('hocaEposta', ep); const kb = await auth.signInWithEmailAndPassword(a, ep, al('sifre')); await yukle(kb.user); break; }
        case 'bag': { const ep = al('eposta').toLowerCase(); await auth.sendSignInLinkToEmail(a, ep, { url: sayfaAdresi, handleCodeInApp: true }); portalTercihleri.setItem('hocaEposta', ep); mesaj(form, `Bağlantı gönderildi: ${ep}. E-postanızı (gereksiz klasörü dâhil) kontrol edin.`, 'basari'); break; }
        case 'bagTamamla': await bagIleGir(al('eposta').toLowerCase()); break;
        case 'sifreBelirle': { const s1 = al('sifre'); if (s1.length < 8 || s1 !== al('sifre2')) { mesaj(form, 'Şifreler uyuşmuyor ya da 8 karakterden kısa.', 'hata'); break; }
          if (!a.currentUser) break; await auth.updatePassword(a.currentUser, s1); await fs.setDoc(fs.doc(db, 'hocalar', a.currentUser.uid), { sifreVar: true }, { merge: true }).catch(() => {}); await yukle(a.currentUser); break; }
        case 'sifreDegistir': { if (!a.currentUser) break;
          try { await auth.updatePassword(a.currentUser, al('sifre')); mesaj(form, 'Şifre değiştirildi.', 'basari'); form.reset(); }
          catch (e) { if ((e as { code?: string })?.code === 'auth/requires-recent-login') { await auth.sendPasswordResetEmail(a, a.currentUser.email || '', { url: sayfaAdresi }); mesaj(form, 'Güvenlik için şifre değişikliği e-posta üzerinden yapılır; e-postanıza şifre sıfırlama bağlantısı gönderildi.', 'basari'); } else throw e; }
          break; }
        case 'ogrenciAyar': { if (!S) break; const o = S.ogrenciler.find((x) => x.ref === S!.secili); if (!o) break;
          await fs.updateDoc(fs.doc(db, 'ogrenciler', o.ref), { durum: al('durum'), grup: al('grup') }); o.durum = al('durum'); o.grup = al('grup'); mesaj(form, 'Kaydedildi.', 'basari'); break; }
        case 'veliEkle': { if (!S) break; const o = S.ogrenciler.find((x) => x.ref === S!.secili); const ep = al('eposta').toLowerCase(); if (!o || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ep)) { mesaj(form, 'Geçerli bir e-posta yazın.', 'hata'); break; }
          await fs.updateDoc(fs.doc(db, 'ogrenciler', o.ref), { veliler: fs.arrayUnion(ep) });
          await fs.setDoc(fs.doc(db, 'aileler', ep), { ogrenciler: fs.arrayUnion(o.ref), dil: o.dil || 'tr', guncelleme: new Date().toISOString() }, { merge: true });
          o.veliler = [...new Set([...(o.veliler || []), ep])]; ciz(); ustMesaj(`${ep} eklendi. «Aileler · Davet» sekmesinden davet gönderebilirsiniz.`, 'basari'); break; }
        case 'ilerleme': { if (!S) break; const ref = S.secili; const ezber: Record<string, string> = {}; const alanlar: Record<string, number> = {};
          for (const [k, v] of fd.entries()) { const val = String(v); if (k.startsWith('ezber:') && val) ezber[k.slice(6)] = val; if (k.startsWith('alan:') && Number(val) > 0) alanlar[k.slice(5)] = Number(val); }
          const kayit: Ilerleme & { kaydeden: string } = { kuranAdim: Number(al('kuranAdim')), ezber, alanlar, hocaNotu: al('hocaNotu'), rozet: al('rozet'), guncelleme: bugunISO(), kaydeden: S.uid };
          await fs.setDoc(fs.doc(db, 'ilerleme', ref), kayit); S.ilerleme = kayit; mesaj(form, 'İlerleme kaydedildi.', 'basari'); break; }
        case 'degerlendirme': { if (!S) break;
          await fs.addDoc(col('degerlendirme'), { ref: S.secili, tarih: al('tarih'), alan: al('alan'), olcut: al('olcut'), derece: Number(al('derece')) || 0, not: al('not'), kaydeden: S.uid, zaman: fs.serverTimestamp() });
          await ogrenciYukle(S.secili); ciz(); ustMesaj('Değerlendirme eklendi.', 'basari'); break; }
        case 'not': { if (!S) break;
          await fs.addDoc(col('notlar'), { ref: S.secili, tarih: al('tarih'), metin: al('metin'), veliyeGorunur: fd.get('veliyeGorunur') === 'on', kaydeden: S.uid, zaman: fs.serverTimestamp() });
          await ogrenciYukle(S.secili); ciz(); ustMesaj('Not eklendi.', 'basari'); break; }
        case 'odev': { if (!S) break; const h = haftalar.find((x) => x.hafta === S!.hafta) || haftalar[0];
          await fs.setDoc(fs.doc(db, 'odevler', h.tarih), { tarih: h.tarih, hafta: h.hafta, ezber: { tr: al('ezberTr'), fr: al('ezberFr') }, odev: { tr: al('odevTr'), fr: al('odevFr') }, materyal: al('materyal'), yayin: fd.get('yayin') === 'on', kaydeden: S.uid, guncelleme: new Date().toISOString() });
          await sekmeYukle('odev'); ciz(); ustMesaj(`${h.hafta}. hafta kaydedildi.`, 'basari'); break; }
        case 'duyuru': { if (!S) break;
          const zengin = (k: string) => { const el = form.querySelector<HTMLElement>(`[data-zengin="${k}"]`); return el ? temizleHtml(el.innerHTML) : ''; };
          if (!metniSadelestir(zengin('metinTr'))) { mesaj(form, 'Türkçe metin gerekli.', 'hata'); break; }
          const duyuruVeri = { tarih: al('tarih'), baslik: { tr: al('baslikTr'), fr: al('baslikFr'), en: al('baslikEn') }, metin: { tr: zengin('metinTr'), fr: zengin('metinFr'), en: zengin('metinEn') }, yayin: fd.get('yayin') === 'on' };
          if (duzenlenenDuyuru) { await fs.updateDoc(fs.doc(db, 'duyurular', duzenlenenDuyuru), { ...duyuruVeri, guncelleme: new Date().toISOString() }); duzenlenenDuyuru = null; await sekmeYukle('duyuru'); ciz(); ustMesaj('Duyuru güncellendi.', 'basari'); }
          else { await fs.addDoc(col('duyurular'), { ...duyuruVeri, kaydeden: S.uid, zaman: fs.serverTimestamp() }); await sekmeYukle('duyuru'); ciz(); ustMesaj('Duyuru kaydedildi.', 'basari'); }
          break; }
      }
    } catch (e) { mesaj(form, hata(e), 'hata'); }
    finally { if (form.isConnected) dugmeler.forEach((b) => { b.disabled = false; }); }
  });

  /* ---------------------------------------------------------------- kayıt defterinden içe aktarma (portal-yonetim.py ice-aktar ile aynı kurallar) */
  const iceAktar = async () => {
    if (!S) return;
    const ayar = await fs.getDoc(fs.doc(db, 'ayarlar', 'portal'));
    const anahtar = (ayar.data() as { gasAnahtari?: string } | undefined)?.gasAnahtari;
    const atlanan = new Set<string>(((ayar.data() as { atlanan?: string[] } | undefined)?.atlanan) || []); // ayarlar/portal.atlanan: mükerrer/deneme kayıtlar (portal-yonetim.py ile aynı)
    const epostaDuzelt = ((ayar.data() as { epostaDuzelt?: Record<string, string> } | undefined)?.epostaDuzelt) || {}; // defterde yanlış yazılmış veli e-postaları → doğrusu
    if (!anahtar) { ustMesaj('ayarlar/portal.gasAnahtari yok.', 'hata'); return; }
    const j = await (await fetch(`${GAS}?islem=liste&anahtar=${encodeURIComponent(anahtar)}`)).json() as { ok?: boolean; kayitlar?: { basliklar: string[]; satirlar: string[][] } };
    if (!j.ok || !j.kayitlar) { ustMesaj('Kayıt defteri okunamadı.', 'hata'); return; }
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
      const s = guncel[k]; const epHam = al(s, 'Veli e-posta').toLowerCase(); const ep = epostaDuzelt[epHam] || epHam; const dil = (al(s, 'İletişim dili') || al(s, 'Form dili') || 'tr').toLowerCase();
      if (!S.ogrenciler.some((o) => o.ref === k)) yeni++;
      const mevcut = S.ogrenciler.find((o) => o.ref === k);
      const adAlanlari = mevcut && (mevcut as { adSabit?: boolean }).adSabit ? {} : { ad: trBaslik(al(s, 'Öğrenci adı')), soyad: trBuyuk(al(s, 'Öğrenci soyadı')) }; // adSabit: ad/soyad portalda düzeltildi, defterden ezilmez
      b.set(fs.doc(db, 'ogrenciler', k), { ...adAlanlari, veliler: fs.arrayUnion(ep), dil, kayitRef: al(s, 'Referans'), guncelleme: simdi, ...(mevcut ? {} : { durum: 'aktif', grup: '' }) }, { merge: true });
      const iletisimDili = al(s, 'İletişim dili').toLowerCase();
      if (ep) b.set(fs.doc(db, 'aileler', ep), { ogrenciler: fs.arrayUnion(k), dil, ...(['tr', 'fr'].includes(iletisimDili) ? { iletisimDili, iletisimDiliKaynagi: 'kayit-formu' } : {}), adSoyad: trBaslik(al(s, 'Veli adı soyadı')), guncelleme: simdi }, { merge: true });
    }
    await b.commit();
    const ogr = await kayitlar('ogrenciler');
    S.ogrenciler = ogr.map((o) => ({ ...(o as unknown as Ogr), ref: o.id })).sort((x, y) => (x.soyad + x.ad).localeCompare(y.soyad + y.ad, 'tr'));
    await sekmeYukle('aile'); ciz(); ustMesaj(`Kayıt defteri aktarıldı: ${Object.keys(guncel).length} öğrenci (${yeni} yeni).`, 'basari');
  };

  /* ---------------------------------------------------------------- başlangıç */
  if (auth.isSignInWithEmailLink(a, location.href)) {
    const kayitli = (portalTercihleri.getItem('hocaEposta') || '').toLowerCase();
    if (kayitli) { try { await bagIleGir(kayitli); return; } catch (e) { girisEkrani(); mesaj(kok.querySelector('form[data-form=bag]'), hata(e), 'hata'); return; } }
    bagTamamlaEkrani(); return;
  }
  auth.onAuthStateChanged(a, (user) => { if (user) { if (!S) yukle(user).catch((e) => { kok.innerHTML = `<p class="not hata">${esc(hata(e))}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">Çıkış</button>`; }); } else { S = null; girisEkrani(); } });
}
