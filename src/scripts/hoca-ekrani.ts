/**
 * Hoca ekranı tarayıcı uygulaması (6 Eyl 2026) — yalnız Türkçe. Firebase Auth + Firestore (lite), sunucu yok.
 * Yetki: hocalar/{uid} belgesi (firebase/firestore.rules → hoca()). Bu ekran veli portalının (veli-portali.ts) veri
 * modelini besler: yoklama/{ref}_{tarih}, ilerleme/{ref}, degerlendirme, notlar, odevler/{tarih}, duyurular, bildirimler.
 * Kişisel veri en azda tutulur (ad, soyad, veli e-postası, dil); kimlik numarası, adres, fotoğraf asla girilmez.
 */
type Ders = { no: number; kod: string; alan: string; konu: string; ezber: string[] };
type PlanGun = { tarih: string; hafta: number; gun: string; dersler: Ders[] };
type Veri = { donem: string; gunler: PlanGun[]; materyalGunleri: string[]; materyalYolu: string; veliYollari: Record<string, string> };
type Ogr = { ref: string; ad: string; soyad: string; veliler?: string[]; dil?: string; durum?: string; grup?: string; kayitRef?: string };
type Aile = { eposta: string; ogrenciler: string[]; dil?: string; adSoyad?: string; sifreVar?: boolean; sonGiris?: string };
type Yok = { ref: string; tarih: string; durum: string; not?: string };
type Ilerleme = { kuranAdim?: number; ezber?: Record<string, string>; alanlar?: Record<string, number>; hocaNotu?: string; guncelleme?: string };
type Kayit = Record<string, unknown> & { id: string };

const ALANLAR: Record<string, string> = { kuran: 'Kur’an-ı Kerim', itikat: 'İtikat', ibadet: 'İbadet', siyer: 'Siyer', ahlak: 'Ahlak', genel: 'Genel' };
const DURUMLAR: Record<string, string> = { var: 'Var', yok: 'Yok', mazeret: 'Mazeretli', gec: 'Geç' };
const EZBER_DURUM: Record<string, string> = { '': '—', baslamadi: 'Başlamadı', tekrar: 'Tekrar ediyor', ogrendi: 'Öğrendi' };
const DERECE: Record<string, string> = { '0': '—', '1': 'Zayıf', '2': 'Gelişmeli', '3': 'Orta', '4': 'İyi', '5': 'Çok iyi' }; // kurs yoklama-değerlendirme şablonuyla aynı ölçek (1 = zayıf … 5 = çok iyi)
const OLCUTLER = ['Mahreç', 'Hareke / Med', 'Tecvid', 'Akıcılık', 'Ezber', 'Harf tanıma', 'Hece okuma', 'Dua / sure ezberi'];
const TUR: Record<string, string> = { mazeret: 'Mazeret', iletisim: 'İletişim', soru: 'Soru' };
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

export async function hocaEkrani(): Promise<void> {
  const kok = document.getElementById('hoca-ekrani');
  const veriEl = document.getElementById('hoca-veri');
  if (!kok || !veriEl) return;
  const veri = JSON.parse(veriEl.textContent || '{}') as Veri;
  const kuranSirasi = veri.gunler.flatMap((g) => g.dersler.filter((x) => x.kod === 'kuran').map((x) => ({ tarih: g.tarih, konu: x.konu }))).filter((x, i, d) => d.findIndex((y) => y.konu === x.konu) === i); // her Kur'an konusu bir adım (ilk işlendiği gün)
  const ezberListesi = [...new Set(veri.gunler.flatMap((g) => g.dersler.flatMap((x) => x.ezber)))];
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
  const ustMesaj = (metin: string, tur: 'hata' | 'basari' | '' = '') => {
    const p = kok.querySelector<HTMLElement>('[data-ust-mesaj]'); if (!p) return;
    p.textContent = metin; p.className = 'not ' + tur; p.hidden = !metin; p.scrollIntoView({ block: 'nearest' });
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
    const kayitli = localStorage.getItem('hocaEposta');
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
    uid: string; ad: string; sekme: string; ogrenciler: Ogr[]; aileler: Aile[]; tarih: string; yoklama: Record<string, { durum: string; not: string }>;
    secili: string; ilerleme: Ilerleme | null; degerlendirme: Kayit[]; notlar: Kayit[]; hafta: number; odevler: Kayit[]; duyurular: Kayit[]; bildirimler: Kayit[]; yukleniyor?: boolean;
  };
  let S: Durum | null = null;
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
    S.yoklama = {}; (k as unknown as Yok[]).forEach((y) => { S!.yoklama[y.ref] = { durum: y.durum, not: y.not || '' }; });
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
      govde = `<section class="bolum">
        <h2>Yoklama</h2>
        <div class="izgara-2">
          <label>Ders günü<select data-yoklama-tarih>${veri.gunler.map((x) => `<option value="${x.tarih}" ${x.tarih === S!.tarih ? 'selected' : ''}>${esc(tarihYaz(x.tarih, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${x.hafta}. hafta</option>`).join('')}</select></label>
          <div><label>&nbsp;</label><button type="button" class="dugme dugme-ikincil" data-eylem="hepsiVar">Hepsini «var» yap</button></div>
        </div>
        ${g ? `<p class="kucuk">${g.dersler.map((d) => `${d.no}. ${esc(ALANLAR[d.kod] || d.kod)}: ${esc(d.konu)}`).join(' · ')}</p>` : ''}
        ${S.yukleniyor ? '<p class="not">Yükleniyor…</p>' : ''}
        <div ${S.yukleniyor ? 'hidden' : ''}>${aktif.map((o) => { const y = S!.yoklama[o.ref] || { durum: '', not: '' }; return `<div class="yk-satir">
            <div><b>${esc(o.ad)} ${esc(o.soyad)}</b> <span class="kucuk">${esc(o.grup || '')}</span></div>
            <div class="yk-dugmeler">${Object.entries(DURUMLAR).map(([k, v]) => `<button type="button" class="yk-dugme ${k}" aria-pressed="${y.durum === k}" data-yok="${esc(o.ref)}" data-durum="${k}">${v}</button>`).join('')}</div>
            <input type="text" placeholder="Not (isteğe bağlı)" data-yok-not="${esc(o.ref)}" value="${esc(y.not)}" maxlength="200">
          </div>`; }).join('')}</div>
        ${aktif.length ? '' : '<p class="kucuk">Aktif öğrenci yok.</p>'}
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-birincil" data-eylem="yoklamaKaydet">Yoklamayı kaydet</button><span class="kucuk">Seçili olmayan öğrenciler için kayıt yazılmaz.</span></div>
      </section>`;
    } else if (S.sekme === 'ogrenci') {
      const o = S.ogrenciler.find((x) => x.ref === S!.secili);
      govde = `<section class="bolum"><h2>Öğrenciler <span class="kucuk">(${S.ogrenciler.length})</span></h2>
        <ul class="liste">${S.ogrenciler.map((x) => `<li><button type="button" class="baglanti-dugme buyu" data-ogr="${esc(x.ref)}" style="text-align:left"><b>${esc(x.ad)} ${esc(x.soyad)}</b></button><span class="kucuk">${esc(x.ref)}</span><span class="kucuk">${(x.veliler || []).length} veli</span>${x.durum === 'pasif' ? '<span class="rozet">pasif</span>' : ''}</li>`).join('')}</ul>
        <p class="kucuk" style="margin-top:.6rem">Yeni öğrenci: «Aileler · Davet» sekmesinden kayıt defterinden yenile.</p></section>`;
      if (o) {
        const ile = S.ilerleme || {};
        govde += `<section class="bolum" id="ogrenci-karti">
          <h2>${esc(o.ad)} ${esc(o.soyad)} <span class="kucuk">${esc(o.ref)} · ${esc(DIL_ADI[o.dil || ''] || o.dil || '')}</span></h2>
          <form data-form="ogrenciAyar" class="izgara-3">
            <label>Durum<select name="durum">${secenekler({ aktif: 'Aktif', pasif: 'Pasif' }, o.durum === 'pasif' ? 'pasif' : 'aktif')}</select></label>
            <label>Grup / sınıf<input type="text" name="grup" value="${esc(o.grup || '')}" maxlength="40"></label>
            <div><label>&nbsp;</label><button type="submit" class="dugme dugme-ikincil">Kaydet</button></div>
            <p data-mesaj hidden class="not" style="grid-column:1/-1"></p>
          </form>

          <h3>Veliler (e-posta)</h3>
          <ul class="liste">${(o.veliler || []).map((e) => `<li><span class="buyu">${esc(e)}</span><button type="button" class="baglanti-dugme" data-veli-sil="${esc(e)}">kaldır</button></li>`).join('') || '<li class="kucuk">Veli e-postası yok.</li>'}</ul>
          <form data-form="veliEkle" class="satir-dugmeler"><input type="email" name="eposta" placeholder="veli@ornek.be" required style="flex:1 1 14rem"><button type="submit" class="dugme dugme-ikincil">Veli ekle</button><p data-mesaj hidden class="not" style="flex-basis:100%"></p></form>

          <h3>İlerleme</h3>
          <form data-form="ilerleme">
            <label>Kur’an’da gelinen adım<select name="kuranAdim"><option value="-1">—</option>${kuranSirasi.map((k, i) => `<option value="${i}" ${ile.kuranAdim === i ? 'selected' : ''}>${i + 1}. ${esc(k.konu)} (${esc(tarihYaz(k.tarih, { day: 'numeric', month: 'short' }))})</option>`).join('')}</select></label>
            <div class="kaydirilir"><table class="tablo"><thead><tr><th>Ezber</th><th>Durum</th></tr></thead><tbody>
              ${ezberListesi.map((e) => `<tr><td>${esc(e)}</td><td><select name="ezber:${esc(e)}">${secenekler(EZBER_DURUM, (ile.ezber || {})[e] || '')}</select></td></tr>`).join('')}
            </tbody></table></div>
            <div class="izgara-3">${['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak'].map((k) => `<label>${esc(ALANLAR[k])}<select name="alan:${k}">${secenekler(DERECE, String((ile.alanlar || {})[k] || 0))}</select></label>`).join('')}</div>
            <label>Hoca notu (veliye görünür)<textarea name="hocaNotu" maxlength="1000">${esc(ile.hocaNotu || '')}</textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">İlerlemeyi kaydet</button>${ile.guncelleme ? `<span class="kucuk">Son güncelleme ${esc(tarihYaz(ile.guncelleme))}</span>` : ''}</div>
          </form>

          <h3>Değerlendirmeler</h3>
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

          <h3>Notlar</h3>
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
      govde = `<section class="bolum"><h2>Haftalık ezber ve ödev</h2>
        <label>Hafta<select data-hafta>${haftalar.map((x) => `<option value="${x.hafta}" ${x.hafta === h.hafta ? 'selected' : ''}>${x.hafta}. hafta · ${esc(x.gunler.map((g) => tarihYaz(g.tarih, { day: 'numeric', month: 'short' })).join(' – '))}${S!.odevler.some((o) => o.tarih === x.tarih) ? ' ✓' : ''}</option>`).join('')}</select></label>
        <p class="kucuk">${h.gunler.map((g) => `<b>${esc(tarihYaz(g.tarih, { weekday: 'long' }))}:</b> ${g.dersler.map((d) => esc(d.konu)).join(' · ')}`).join('<br>')}</p>
        <form data-form="odev">
          <div class="izgara-2">
            <label>Ezber (TR)<textarea name="ezberTr" maxlength="1000">${esc(ez.tr ?? planEzber.join('\n'))}</textarea></label>
            <label>Ezber (FR)<textarea name="ezberFr" maxlength="1000">${esc(ez.fr || '')}</textarea></label>
            <label>Ödev (TR)<textarea name="odevTr" maxlength="1000">${esc(od.tr || '')}</textarea></label>
            <label>Ödev (FR)<textarea name="odevFr" maxlength="1000">${esc(od.fr || '')}</textarea></label>
          </div>
          <label>Materyal bağlantısı<input type="url" name="materyal" value="${esc(mevcut?.materyal ?? (materyalVar ? location.origin + veri.materyalYolu + '#g-' + h.gunler.find((g) => veri.materyalGunleri.includes(g.tarih))!.tarih : ''))}"></label>
          <label class="satir"><input type="checkbox" name="yayin" ${mevcut ? (mevcut.yayin ? 'checked' : '') : 'checked'}> Velilere yayınla</label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">Kaydet</button>${mevcut ? `<button type="button" class="baglanti-dugme" data-sil="odevler" data-id="${esc(mevcut.id)}">bu haftanın kaydını sil</button>` : ''}</div>
        </form></section>`;
    } else if (S.sekme === 'duyuru') {
      govde = `<section class="bolum"><h2>Duyurular</h2>
        ${S.duyurular.map((d) => { const b = d.baslik as Record<string, string>; const m = d.metin as Record<string, string>; return `<div class="duyuru"><span class="kucuk">${esc(tarihYaz(String(d.tarih)))}</span> <span class="rozet">${d.yayin ? 'yayında' : 'taslak'}</span> <button type="button" class="baglanti-dugme" data-yayin="duyurular" data-id="${esc(d.id)}" data-deger="${d.yayin ? '0' : '1'}">${d.yayin ? 'yayından kaldır' : 'yayınla'}</button> <button type="button" class="baglanti-dugme" data-sil="duyurular" data-id="${esc(d.id)}">sil</button><br><b>${esc(b?.tr || '')}</b>${b?.fr ? ` <span class="kucuk">· ${esc(b.fr)}</span>` : ''}<p>${esc(m?.tr || '')}</p></div>`; }).join('') || '<p class="kucuk">Henüz duyuru yok.</p>'}
        <h3>Yeni duyuru</h3>
        <form data-form="duyuru">
          <label>Tarih<input type="date" name="tarih" value="${bugunISO()}" required></label>
          <div class="izgara-3"><label>Başlık (TR)<input type="text" name="baslikTr" maxlength="120" required></label><label>Titre (FR)<input type="text" name="baslikFr" maxlength="120"></label><label>Title (EN)<input type="text" name="baslikEn" maxlength="120"></label></div>
          <div class="izgara-3"><label>Metin (TR)<textarea name="metinTr" maxlength="2000" required></textarea></label><label>Texte (FR)<textarea name="metinFr" maxlength="2000"></textarea></label><label>Text (EN)<textarea name="metinEn" maxlength="2000"></textarea></label></div>
          <label class="satir"><input type="checkbox" name="yayin" checked> Hemen yayınla</label>
          <p class="kucuk">Fransızca boşsa velilere Türkçe metin gösterilir.</p>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">Duyuruyu kaydet</button></div>
        </form></section>`;
    } else if (S.sekme === 'bildirim') {
      govde = `<section class="bolum"><h2>Veli bildirimleri <span class="kucuk">(${S.bildirimler.filter((b) => !b.okundu).length} okunmamış)</span></h2>
        <ul class="liste">${S.bildirimler.map((b) => `<li style="${b.okundu ? 'opacity:.7' : ''}"><span class="kucuk">${esc(zamanYaz(b.zaman))}</span><b>${esc(TUR[String(b.tur)] || b.tur)}</b><span>${esc(ogrAdi(String(b.ref)))}</span>${b.tarih ? `<span class="rozet">${esc(tarihYaz(String(b.tarih), { weekday: 'short', day: 'numeric', month: 'short' }))}</span>` : ''}<span class="kucuk">${esc(b.eposta)}</span><span class="buyu" style="flex-basis:100%;white-space:pre-line">${esc(b.metin)}</span><button type="button" class="baglanti-dugme" data-okundu="${esc(b.id)}" data-deger="${b.okundu ? '0' : '1'}">${b.okundu ? 'okunmadı yap' : 'okundu'}</button><button type="button" class="baglanti-dugme" data-sil="bildirimler" data-id="${esc(b.id)}">sil</button></li>`).join('') || '<li class="kucuk">Bildirim yok.</li>'}</ul></section>`;
    } else if (S.sekme === 'aile') {
      govde = `<section class="bolum"><h2>Aileler <span class="kucuk">(${S.aileler.length})</span></h2>
        <p class="kucuk">«Davet gönder»: veliye kendi dilinde tek kullanımlık giriş bağlantısı e-postalanır; veli bağlantıyı açıp şifresini belirler. Google'ın ücretsiz planı günde en fazla <b>5</b> davet e-postası gönderir; toplu davet için yönetici betiği (info@ulucamii.be üzerinden) kullanılır.</p>
        <ul class="liste">${S.aileler.map((f) => `<li><span class="buyu"><b>${esc(f.eposta)}</b><br><span class="kucuk">${esc(f.adSoyad || '')} · ${esc(DIL_ADI[f.dil || ''] || f.dil || '')} · ${esc((f.ogrenciler || []).map(ogrAdi).join(', '))}</span></span>
          <span class="rozet">${f.sifreVar ? 'şifre belirledi' : 'henüz girmedi'}</span>${f.sonGiris ? `<span class="kucuk">son giriş ${esc(tarihYaz(f.sonGiris))}</span>` : ''}
          <button type="button" class="dugme dugme-ikincil" data-davet="${esc(f.eposta)}" data-dil="${esc(f.dil || 'tr')}">Davet gönder</button></li>`).join('') || '<li class="kucuk">Aile yok.</li>'}</ul>
        <p data-ust-mesaj hidden class="not"></p>
        <h3>Kayıt defteri</h3>
        <p class="kucuk">Online kayıt defterindeki güncel öğrencileri (ad, soyad, veli e-postası, dil) portala aktarır; başka veri aktarılmaz. Var olan kayıtlar korunur.</p>
        <div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-eylem="iceAktar">Kayıt defterinden yenile</button></div></section>`;
    } else if (S.sekme === 'hesap') {
      govde = `<section class="bolum"><h2>Hesap</h2><p>${esc(S.ad)} · <span class="kucuk">${esc(a.currentUser?.email || '')}</span></p>
        <form data-form="sifreDegistir" style="max-width:28rem"><label>Yeni şifre<input type="password" name="sifre" minlength="8" required autocomplete="new-password"></label><p data-mesaj hidden class="not"></p>
        <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">Şifreyi değiştir</button></div></form>
        <p class="kucuk" style="margin-top:1rem">Veli portalı: <a href="${esc(veri.veliYollari.tr)}">${esc(location.origin + veri.veliYollari.tr)}</a></p></section>`;
    }
    kok.innerHTML = `<div class="ust"><div><p class="etiket etiket-vurgu">Hoş geldiniz, ${esc(S.ad)}</p><p class="kucuk">${esc(veri.donem)} dönemi</p></div><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">Çıkış</button></div>
      <div class="sekmeler" role="tablist">${Object.entries(SEKMELER).map(([k, v]) => `<button type="button" role="tab" class="sekme" aria-selected="${k === S!.sekme}" data-sekme="${k}">${v}</button>`).join('')}</div>
      <p data-ust-mesaj hidden class="not"></p>${govde}`;
  };

  /* ---------------------------------------------------------------- olaylar */
  const bagIleGir = async (eposta: string) => {
    const kb = await auth.signInWithEmailLink(a, eposta, location.href);
    localStorage.setItem('hocaEposta', eposta); history.replaceState(null, '', sayfaAdresi);
    const h = await fs.getDoc(fs.doc(db, 'hocalar', kb.user.uid)).catch(() => null);
    if (h && h.exists() && !(h.data() as { sifreVar?: boolean }).sifreVar) sifreEkrani(); else await yukle(kb.user);
  };
  const sekmeyeGec = async (ad: string) => { if (!S) return; S.sekme = ad; kok.innerHTML = '<p class="not">Yükleniyor…</p>'; await sekmeYukle(ad); ciz(); };

  kok.addEventListener('click', async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-eylem],[data-sekme],[data-yok],[data-ogr],[data-sil],[data-yayin],[data-okundu],[data-davet],[data-veli-sil]');
    if (!el) return;
    try {
      if (el.dataset.eylem === 'cikis') { await auth.signOut(a); S = null; girisEkrani(); return; }
      if (el.dataset.eylem === 'atla' && a.currentUser) { await yukle(a.currentUser); return; }
      if (el.dataset.eylem === 'sifremiUnuttum') {
        const form = el.closest('form') as HTMLFormElement; const ep = (form.querySelector('input[name=eposta]') as HTMLInputElement).value.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ep)) { mesaj(form, 'Geçerli bir e-posta yazın.', 'hata'); return; }
        await auth.sendPasswordResetEmail(a, ep, { url: sayfaAdresi }); localStorage.setItem('hocaEposta', ep);
        mesaj(form, `Şifre sıfırlama bağlantısı gönderildi: ${ep}. Bağlantıyı açıp yeni şifrenizi belirleyin, sonra giriş yapın.`, 'basari'); return;
      }
      if (el.dataset.sekme) { await sekmeyeGec(el.dataset.sekme); return; }
      if (!S) return;
      if (el.dataset.yok) { const ref = el.dataset.yok; const d = el.dataset.durum || ''; const y = S.yoklama[ref] || { durum: '', not: '' }; y.durum = y.durum === d ? '' : d; S.yoklama[ref] = y;
        el.parentElement!.querySelectorAll<HTMLElement>('.yk-dugme').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.durum === y.durum))); return; }
      if (el.dataset.eylem === 'hepsiVar') { S.ogrenciler.filter((o) => o.durum !== 'pasif').forEach((o) => { S!.yoklama[o.ref] = { durum: 'var', not: S!.yoklama[o.ref]?.not || '' }; }); ciz(); return; }
      if (el.dataset.eylem === 'yoklamaKaydet') {
        kok.querySelectorAll<HTMLInputElement>('[data-yok-not]').forEach((i) => { const y = S!.yoklama[i.dataset.yokNot!]; if (y) y.not = i.value.trim(); });
        const b = fs.writeBatch(db); let n = 0;
        for (const [ref, y] of Object.entries(S.yoklama)) {
          const id = fs.doc(db, 'yoklama', `${ref}_${S.tarih}`);
          if (y.durum) { b.set(id, { ref, tarih: S.tarih, durum: y.durum, not: y.not || '', kaydeden: S.uid, zaman: fs.serverTimestamp() }); n++; } else b.delete(id);
        }
        await b.commit(); ustMesaj(`${n} öğrencinin yoklaması kaydedildi (${tarihYaz(S.tarih)}).`, 'basari'); return;
      }
      if (el.dataset.ogr) { kok.querySelector('#ogrenci-karti')?.remove(); await ogrenciYukle(el.dataset.ogr); ciz(); kok.querySelector('#ogrenci-karti')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (el.dataset.sil) { if (!confirm('Silinsin mi?')) return; await fs.deleteDoc(fs.doc(db, el.dataset.sil, el.dataset.id!));
        if (S.sekme === 'ogrenci') await ogrenciYukle(S.secili); else await sekmeYukle(S.sekme); ciz(); ustMesaj('Silindi.', 'basari'); return; }
      if (el.dataset.yayin) { await fs.updateDoc(fs.doc(db, el.dataset.yayin, el.dataset.id!), { yayin: el.dataset.deger === '1' }); await sekmeYukle(S.sekme); ciz(); return; }
      if (el.dataset.okundu) { await fs.updateDoc(fs.doc(db, 'bildirimler', el.dataset.okundu), { okundu: el.dataset.deger === '1' }); await sekmeYukle('bildirim'); ciz(); return; }
      if (el.dataset.davet) {
        const ep = el.dataset.davet; const dil = el.dataset.dil || 'tr'; (el as HTMLButtonElement).disabled = true;
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
    const fd = new FormData(form); const al = (k: string) => String(fd.get(k) || '').trim();
    const dugmeler = form.querySelectorAll<HTMLButtonElement>('button'); dugmeler.forEach((b) => { b.disabled = true; });
    mesaj(form, '');
    try {
      switch (form.dataset.form) {
        case 'giris': { const ep = al('eposta').toLowerCase(); localStorage.setItem('hocaEposta', ep); const kb = await auth.signInWithEmailAndPassword(a, ep, al('sifre')); await yukle(kb.user); break; }
        case 'bag': { const ep = al('eposta').toLowerCase(); await auth.sendSignInLinkToEmail(a, ep, { url: sayfaAdresi, handleCodeInApp: true }); localStorage.setItem('hocaEposta', ep); mesaj(form, `Bağlantı gönderildi: ${ep}. E-postanızı (gereksiz klasörü dâhil) kontrol edin.`, 'basari'); break; }
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
          const kayit: Ilerleme & { kaydeden: string } = { kuranAdim: Number(al('kuranAdim')), ezber, alanlar, hocaNotu: al('hocaNotu'), guncelleme: bugunISO(), kaydeden: S.uid };
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
          await fs.addDoc(col('duyurular'), { tarih: al('tarih'), baslik: { tr: al('baslikTr'), fr: al('baslikFr'), en: al('baslikEn') }, metin: { tr: al('metinTr'), fr: al('metinFr'), en: al('metinEn') }, yayin: fd.get('yayin') === 'on', kaydeden: S.uid, zaman: fs.serverTimestamp() });
          await sekmeYukle('duyuru'); ciz(); ustMesaj('Duyuru kaydedildi.', 'basari'); break; }
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
      const s = guncel[k]; const ep = al(s, 'Veli e-posta').toLowerCase(); const dil = (al(s, 'İletişim dili') || al(s, 'Form dili') || 'tr').toLowerCase();
      if (!S.ogrenciler.some((o) => o.ref === k)) yeni++;
      const mevcut = S.ogrenciler.find((o) => o.ref === k);
      const adAlanlari = mevcut && (mevcut as { adSabit?: boolean }).adSabit ? {} : { ad: trBaslik(al(s, 'Öğrenci adı')), soyad: trBuyuk(al(s, 'Öğrenci soyadı')) }; // adSabit: ad/soyad portalda düzeltildi, defterden ezilmez
      b.set(fs.doc(db, 'ogrenciler', k), { ...adAlanlari, veliler: fs.arrayUnion(ep), dil, kayitRef: al(s, 'Referans'), guncelleme: simdi, ...(mevcut ? {} : { durum: 'aktif', grup: '' }) }, { merge: true });
      if (ep) b.set(fs.doc(db, 'aileler', ep), { ogrenciler: fs.arrayUnion(k), dil, adSoyad: trBaslik(al(s, 'Veli adı soyadı')), guncelleme: simdi }, { merge: true });
    }
    await b.commit();
    const ogr = await kayitlar('ogrenciler');
    S.ogrenciler = ogr.map((o) => ({ ...(o as unknown as Ogr), ref: o.id })).sort((x, y) => (x.soyad + x.ad).localeCompare(y.soyad + y.ad, 'tr'));
    await sekmeYukle('aile'); ciz(); ustMesaj(`Kayıt defteri aktarıldı: ${Object.keys(guncel).length} öğrenci (${yeni} yeni).`, 'basari');
  };

  /* ---------------------------------------------------------------- başlangıç */
  if (auth.isSignInWithEmailLink(a, location.href)) {
    const kayitli = (localStorage.getItem('hocaEposta') || '').toLowerCase();
    if (kayitli) { try { await bagIleGir(kayitli); return; } catch (e) { girisEkrani(); mesaj(kok.querySelector('form[data-form=bag]'), hata(e), 'hata'); return; } }
    bagTamamlaEkrani(); return;
  }
  auth.onAuthStateChanged(a, (user) => { if (user) { if (!S) yukle(user).catch((e) => { kok.innerHTML = `<p class="not hata">${esc(hata(e))}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">Çıkış</button>`; }); } else { S = null; girisEkrani(); } });
}
