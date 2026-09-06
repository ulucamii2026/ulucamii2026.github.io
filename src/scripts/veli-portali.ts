/**
 * Veli portalı tarayıcı uygulaması (6 Eyl 2026). Sunucu yok: Firebase Auth + Firestore (lite) doğrudan tarayıcıdan.
 * Akış: e-posta bağlantısı → (ilk kez) şifre belirleme → pano; sonraki girişler e-posta + şifre. Veri erişimi
 * firebase/firestore.rules ile sınırlı (veli yalnız aileler/{e-posta}.ogrenciler listesindeki öğrencileri okur).
 */
import type { Dil } from '../i18n/ui';
import { veliMetni, yerlestir, type VeliMetin } from '../i18n/veli';

type Ders = { no: number; kod: string; alan: string; konu: string; ezber: string[] };
type PlanGun = { tarih: string; hafta: number; dersler: Ders[] };
type Veri = { donem: string; gunler: PlanGun[]; materyalGunleri: string[]; materyalYolu: string; gizlilikYolu: string; kursYolu: string; dilYollari: Record<Dil, string> };
type Ogrenci = { ref: string; ad: string; soyad: string; durum?: string };
type Yoklama = { ref: string; tarih: string; durum: 'var' | 'yok' | 'mazeret' | 'gec'; not?: string };
type Ilerleme = { kuranAdim?: number; ezber?: Record<string, 'ogrendi' | 'tekrar' | 'baslamadi'>; alanlar?: Record<string, number>; hocaNotu?: string; guncelleme?: string };
type Degerlendirme = { tarih: string; alan: string; olcut?: string; derece?: number; not?: string };
type Not = { tarih: string; metin: string };
type Odev = { tarih: string; hafta?: number; ezber?: Record<string, string>; odev?: Record<string, string>; materyal?: string; yayin: boolean };
type Duyuru = { tarih: string; baslik: Record<string, string>; metin: Record<string, string>; yayin: boolean };
type Bildirim = { id?: string; ref: string; tur: string; tarih?: string; metin: string; okundu: boolean; zaman?: { toDate?: () => Date } | string };

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
    new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', ...sec }).format(new Date(iso.slice(0, 10) + 'T12:00:00'));
  const cok = (o: Record<string, string> | undefined) => (o ? (o[dil] || o.fr || o.tr || '') : '');
  // Duyuru/ödev metnindeki https bağlantılarını tıklanabilir yapar (önce kaçış, sonra bağlantı; sondaki noktalama bağlantıya girmez)
  const bagla = (s: string) => esc(s).replace(/https?:\/\/[^\s<]*[^\s<.,;:!?)]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const alanAdi = (kod: string) => (m.alan as Record<string, string>)[kod] || kod;

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
      ${onMesaj ? `<p class="not basari">${esc(onMesaj)}</p>` : ''}
      <div class="giris-izgara">
        <form class="kutu" data-form="giris" novalidate>
          <h2>${esc(m.girisBaslik)}</h2>
          <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
          <label>${esc(m.sifre)}<input type="password" name="sifre" required autocomplete="current-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.girisYap)}</button><button type="button" class="dugme dugme-ikincil" data-eylem="sifremiUnuttum">${esc(m.sifremiUnuttum)}</button></div>
        </form>
        <form class="kutu" data-form="bag" novalidate>
          <h2>${esc(m.bagBaslik)}</h2>
          <p class="kucuk">${esc(m.bagAciklama)}</p>
          <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${esc(m.bagGonder)}</button></div>
        </form>
      </div>`;
    const kayitli = localStorage.getItem('veliEposta');
    if (kayitli) kok.querySelectorAll<HTMLInputElement>('input[name=eposta]').forEach((i) => { i.value = kayitli; });
  };

  const bagTamamlaEkrani = () => {
    kok.innerHTML = `
      <form class="kutu" data-form="bagTamamla" style="max-width:32rem" novalidate>
        <h2>${esc(m.girisBaslik)}</h2>
        <p class="kucuk">${esc(m.bagTamamla)}</p>
        <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
        <p data-mesaj hidden class="not"></p>
        <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.bagOnayla)}</button></div>
      </form>`;
  };

  const sifreEkrani = (zorunluDegil: boolean) => {
    kok.innerHTML = `
      <form class="kutu" data-form="sifreBelirle" style="max-width:32rem" novalidate>
        <h2>${esc(m.sifreBelirleBaslik)}</h2>
        <p class="kucuk">${esc(m.sifreBelirleA)}</p>
        <label>${esc(m.sifre)}<input type="password" name="sifre" required minlength="8" autocomplete="new-password"></label>
        <label>${esc(m.sifreTekrar)}<input type="password" name="sifre2" required minlength="8" autocomplete="new-password"></label>
        <p data-mesaj hidden class="not"></p>
        <div class="satir-dugmeler">
          <button type="submit" class="dugme dugme-birincil">${esc(m.kaydet)}</button>
          ${zorunluDegil ? `<button type="button" class="dugme dugme-ikincil" data-eylem="atla">${esc(m.atla)}</button>` : ''}
        </div>
      </form>`;
  };

  /* ---------------------------------------------------------------- pano */
  type Durum = { eposta: string; aile: { ogrenciler: string[]; dil?: string; sifreVar?: boolean }; ogrenciler: Ogrenci[]; secili: number;
    odevler: Odev[]; duyurular: Duyuru[]; bildirimler: Bildirim[]; cocuk: Record<string, { yoklama: Yoklama[]; ilerleme: Ilerleme | null; degerlendirme: Degerlendirme[]; notlar: Not[] }> };
  let durum: Durum | null = null;

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
    const yk = c ? c.yoklama : []; const say = { var: 0, yok: 0, mazeret: 0, gec: 0 } as Record<string, number>; yk.forEach((y) => { say[y.durum] = (say[y.durum] || 0) + 1; });
    const ile = c?.ilerleme || null;
    const kuranNo = ile?.kuranAdim ?? -1; const kuranKonu = kuranNo >= 0 && kuranSirasi[kuranNo] ? kuranSirasi[kuranNo].konu : '';
    const yuzde = kuranNo >= 0 ? Math.round(((kuranNo + 1) / kuranSirasi.length) * 100) : 0;
    const gelecekGunler = veri.gunler.filter((g) => g.tarih >= bugun).slice(0, 10);
    const dereceAdi = (n: number) => (m.derece as Record<string, string>)[String(n)] || String(n);

    kok.innerHTML = `
      <div class="ust">
        <div><p class="etiket etiket-vurgu">${esc(m.hosgeldin)}</p><p class="kucuk">${esc(d.eposta)}</p></div>
        <button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${esc(m.cikis)}</button>
      </div>
      ${d.ogrenciler.length > 1 ? `<div class="sekmeler" role="tablist" aria-label="${esc(m.cocuklar)}">
        ${d.ogrenciler.map((x, i) => `<button type="button" role="tab" class="sekme" aria-selected="${i === d.secili}" data-sec="${i}">${esc(x.ad)} ${esc(x.soyad)}</button>`).join('')}
      </div>` : ''}
      ${o ? `<h2 style="margin:0 0 1rem">${esc(m.ogrenci)}: ${esc(o.ad)} ${esc(o.soyad)}</h2>` : ''}
      <div class="bolumler">
        <section class="bolum genis">
          <h2>${esc(m.buHafta)} <span class="kucuk">· ${esc(tarihYaz(pzt))} – ${esc(tarihYaz(paz))}${haftaGunleri[0] ? ' · ' + esc(yerlestir(m.hafta, { n: haftaGunleri[0].hafta })) : ''}</span></h2>
          ${haftaGunleri.length ? `<ul class="liste">${haftaGunleri.map((g) => `<li><b>${esc(tarihYaz(g.tarih, { weekday: 'long', day: 'numeric', month: 'short' }))}</b>
              <span>${g.dersler.map((x) => `${x.no}. ${esc(alanAdi(x.kod))}: <span lang="tr">${esc(x.konu)}</span>`).join(' · ')}</span>
              ${g.dersler.some((x) => x.ezber.length) ? `<span class="rozet">${esc(m.ezber)}: <span lang="tr">${esc(g.dersler.flatMap((x) => x.ezber).join(', '))}</span></span>` : ''}
              ${veri.materyalGunleri.includes(g.tarih) ? `<a href="${esc(veri.materyalYolu)}#g-${g.tarih}">${esc(m.materyal)} →</a>` : ''}</li>`).join('')}</ul>` : ''}
          ${haftaOdev ? `<h3>${esc(m.ezber)}</h3><p style="white-space:pre-line">${bagla(cok(haftaOdev.ezber) || '—')}</p>
            <h3>${esc(m.odev)}</h3><p style="white-space:pre-line">${bagla(cok(haftaOdev.odev) || '—')}</p>
            ${haftaOdev.materyal ? `<p><a href="${esc(haftaOdev.materyal)}">${esc(m.materyal)} →</a></p>` : ''}` : `<p class="kucuk">${esc(m.odevYok)}</p>`}
          ${siradaki ? `<p class="kucuk" style="margin-top:.8rem"><b>${esc(m.siradakiDers)}:</b> ${esc(tarihYaz(siradaki.tarih, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>` : ''}
        </section>

        <section class="bolum">
          <h2>${esc(m.yoklama)}</h2>
          ${yk.length ? `<p class="kucuk">${esc(yerlestir(m.yoklamaOzet, say))}</p>
            <div class="yoklama-izgara">${yk.map((y) => `<div class="gun-kutu ${y.durum}" title="${esc((m.durum as Record<string, string>)[y.durum])}${y.not ? ' · ' + esc(y.not) : ''}"><b>${esc(tarihYaz(y.tarih, { day: 'numeric' }))}</b>${esc(tarihYaz(y.tarih, { month: 'short' }))}<br><span class="kucuk">${esc((m.durum as Record<string, string>)[y.durum])}</span></div>`).join('')}</div>`
            : `<p class="kucuk">${esc(m.yoklamaYok)}</p>`}
        </section>

        <section class="bolum">
          <h2>${esc(m.ilerleme)}</h2>
          ${ile ? `
            ${kuranKonu ? `<h3>${esc(m.kuranAdim)}</h3><p lang="tr"><b>${esc(kuranKonu)}</b> <span class="kucuk">(${kuranNo + 1}/${kuranSirasi.length})</span></p><div class="cubuk"><span style="width:${yuzde}%"></span></div>` : ''}
            ${ile.ezber && Object.keys(ile.ezber).length ? `<h3>${esc(m.ezberler)}</h3><ul class="liste">${Object.entries(ile.ezber).map(([ad, dr]) => `<li><span lang="tr">${esc(ad)}</span><span class="rozet ${esc(dr)}">${esc((m.ezberDurum as Record<string, string>)[dr] || dr)}</span></li>`).join('')}</ul>` : ''}
            ${ile.alanlar && Object.keys(ile.alanlar).length ? `<h3>${esc(m.alanlar)}</h3><div class="dereceler">${Object.entries(ile.alanlar).map(([k, n]) => `<div class="derece"><b>${esc(alanAdi(k))}</b><span class="noktalar" aria-hidden="true">${'●'.repeat(n)}${'○'.repeat(Math.max(0, 5 - n))}</span> <span class="kucuk">${esc(dereceAdi(n))}</span></div>`).join('')}</div>` : ''}
            ${ile.hocaNotu ? `<h3>${esc(m.hocaNotu)}</h3><p style="white-space:pre-line">${esc(ile.hocaNotu)}</p>` : ''}
            ${ile.guncelleme ? `<p class="kucuk">${esc(tarihYaz(ile.guncelleme, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>` : ''}`
            : `<p class="kucuk">${esc(m.ilerlemeYok)}</p>`}
        </section>

        <section class="bolum">
          <h2>${esc(m.degerlendirme)}</h2>
          ${c && c.degerlendirme.length ? `<ul class="liste">${c.degerlendirme.map((x) => `<li><span class="kucuk">${esc(tarihYaz(x.tarih))}</span><b>${esc(alanAdi(x.alan))}</b>${x.olcut ? `<span lang="tr">${esc(x.olcut)}</span>` : ''}${x.derece ? `<span class="rozet">${esc(dereceAdi(x.derece))}</span>` : ''}${x.not ? `<span class="kucuk">${esc(x.not)}</span>` : ''}</li>`).join('')}</ul>` : `<p class="kucuk">${esc(m.degerlendirmeYok)}</p>`}
        </section>

        <section class="bolum">
          <h2>${esc(m.notlar)}</h2>
          ${c && c.notlar.length ? `<ul class="liste">${c.notlar.map((x) => `<li><span class="kucuk">${esc(tarihYaz(x.tarih))}</span><span style="white-space:pre-line">${esc(x.metin)}</span></li>`).join('')}</ul>` : `<p class="kucuk">${esc(m.notYok)}</p>`}
        </section>

        <section class="bolum">
          <h2>${esc(m.duyurular)}</h2>
          ${d.duyurular.length ? d.duyurular.slice(0, 10).map((x) => `<div class="duyuru"><span class="kucuk">${esc(tarihYaz(x.tarih, { day: 'numeric', month: 'long' }))}</span><br><b>${esc(cok(x.baslik))}</b><p>${bagla(cok(x.metin))}</p></div>`).join('') : `<p class="kucuk">${esc(m.duyuruYok)}</p>`}
        </section>

        <section class="bolum">
          <h2>${esc(m.bildir)}</h2>
          <p class="kucuk">${esc(m.bildirA)}</p>
          <form data-form="bildir" novalidate>
            <label>${esc(m.ogrenci)}<select name="ref">${d.ogrenciler.map((x) => `<option value="${esc(x.ref)}" ${x.ref === o?.ref ? 'selected' : ''}>${esc(x.ad)} ${esc(x.soyad)}</option>`).join('')}</select></label>
            <label>${esc(m.bildir)}<select name="tur">${Object.entries(m.bildirTur).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
            <label data-tarih-alani>${esc(m.bildirTarih)}<select name="tarih">${gelecekGunler.map((g) => `<option value="${g.tarih}">${esc(tarihYaz(g.tarih, { weekday: 'long', day: 'numeric', month: 'long' }))}</option>`).join('')}</select></label>
            <label>${esc(m.bildirMetin)}<textarea name="metin" maxlength="1000" required></textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.gonder)}</button></div>
          </form>
          ${d.bildirimler.length ? `<h3>${esc(m.bildirimlerim)}</h3><ul class="liste">${d.bildirimler.slice().sort((x, y) => zamanMs(y) - zamanMs(x)).slice(0, 8).map((x) => `<li><span class="kucuk">${esc(zamanYaz(x))}</span><b>${esc((m.bildirTur as Record<string, string>)[x.tur] || x.tur)}</b>${x.tarih ? `<span>${esc(tarihYaz(x.tarih))}</span>` : ''}<span class="rozet">${esc(x.okundu ? m.okundu : m.okunmadi)}</span><span class="kucuk" style="flex-basis:100%">${esc(x.metin)}</span></li>`).join('')}</ul>` : ''}
        </section>

        <section class="bolum">
          <h2>${esc(m.hesap)}</h2>
          <label>${esc(m.dil)}<select name="dil" data-dil-sec>${(['tr', 'fr', 'en'] as Dil[]).map((x) => `<option value="${x}" ${x === dil ? 'selected' : ''}>${x === 'tr' ? 'Türkçe' : x === 'fr' ? 'Français' : 'English'}</option>`).join('')}</select></label>
          <form data-form="sifreDegistir" novalidate>
            <label>${esc(m.yeniSifre)}<input type="password" name="sifre" minlength="8" required autocomplete="new-password"></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${esc(m.sifreDegistir)}</button></div>
          </form>
          <p class="kucuk" style="margin-top:.8rem"><a href="${esc(veri.gizlilikYolu)}">${esc(m.gizlilik)}</a></p>
        </section>
      </div>`;
    const turSec = kok.querySelector<HTMLSelectElement>('select[name=tur]'); const tarihAlani = kok.querySelector<HTMLElement>('[data-tarih-alani]');
    const tarihGoster = () => { if (tarihAlani && turSec) tarihAlani.hidden = turSec.value !== 'mazeret'; };
    turSec?.addEventListener('change', tarihGoster); tarihGoster();
  };
  const zamanMs = (b: Bildirim) => { const z = b.zaman as { toDate?: () => Date } | string | undefined; return typeof z === 'string' ? Date.parse(z) : z?.toDate ? z.toDate().getTime() : 0; };
  const zamanYaz = (b: Bildirim) => { const ms = zamanMs(b); return ms ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };

  const kayitYokEkrani = () => {
    kok.innerHTML = `<div class="kutu" style="max-width:40rem"><p class="not hata">${esc(m.kayitYok)}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${esc(m.cikis)}</button></div>`;
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
    const hedef = (ev.target as HTMLElement).closest<HTMLElement>('[data-eylem], [data-sec]');
    if (!hedef) return;
    if (hedef.dataset.eylem === 'cikis') { await auth.signOut(a); localStorage.removeItem('veliEposta'); durum = null; girisEkrani(); return; }
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
          const kayit: Record<string, unknown> = { ref, tur, metin: metin.slice(0, 1000), eposta: durum.eposta, okundu: false, zaman: fs.serverTimestamp(),
            ogrenciAd: ogr ? `${ogr.ad} ${ogr.soyad}` : '', dil };
          if (tur === 'mazeret') kayit.tarih = al('tarih');
          const yeni = await fs.addDoc(fs.collection(db, 'bildirimler'), kayit);
          durum.bildirimler.push({ id: yeni.id, ref, tur, metin, okundu: false, tarih: kayit.tarih as string | undefined, zaman: new Date().toISOString() });
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
