/**
 * Bilgi maddesi sayfasının çalışma kipleri (24 Ekim 2026): «Gizle ve söyle» (her madde noktalı çizgiyle gizlenir, çocuk önce
 * söyler, sonra «Göster»e dokunur), «Sırala» (sıra anlamlıysa; ↑ ↓ düğmeleri ya da Alt + ok, fare sürüklemesi gerekmez) ve
 * «Nasıl geçti?» özdeğerlendirmesi. Puan, sıralama ve doğru/yanlış sesi yoktur; sonuç yalnız bu cihazda tutulur ve sonraki
 * tekrar önerisini belirler (src/lib/ezber/tekrar.ts), hocanın verdiği basamağı değiştirmez. Liste sayfada sunucuda yazılıdır
 * (JavaScript olmadan da okunur); bu betik yalnız çalışma bölümünü açar. DOM elle kurulur ve yalnız `textContent`, sınıf ve
 * öznitelik kullanır: Hosting'in CSP'si satır içi stil ve betiğe izin vermez. Veri `data-veri` ile gelir.
 */
import { AR_ENAZ, AR_ENCOK, arBoyutuAyarla, calismaGunuIsle, maddeAyari, maddeyiGuncelle, oku, yaz, type CihazDurumu, type Depo } from '@ortak/lib/ezber/cihaz';
import { farkliSira, rastgele, siraDogru, yerindeSayisi } from '@ortak/lib/ezber/oyun';
import { gunFarki, sonrakiTekrar, tarihMi, yerelGun, type TekrarSonucu } from '@ortak/lib/ezber/tekrar';
import { doldur, dugme, el } from './kip-ortak';

type Kip = 'gizle' | 'sirala';
interface Madde { readonly no: number; readonly metin: string }
interface Grup { readonly kimlik: string; readonly ad: string; readonly maddeler: readonly Madde[] }
type Yazilar = Readonly<Record<string, string>>;
interface Veri { readonly id: string; readonly sirali: boolean; readonly gruplar: readonly Grup[]; readonly m: Yazilar }

const depo = (): Depo | null => {
  try { return window.localStorage; } catch { return null; }
};
// Her değişiklikten önce depodan taze okunur: sayfadaki başka betik (kip.ts) kendi kopyasını tutar, ezilmesin.
const guncelle = (f: (d: CihazDurumu) => CihazDurumu): CihazDurumu => {
  const yeni = f(oku(depo()));
  yaz(depo(), yeni);
  return yeni;
};

const yeniTohum = () => rastgele(Math.floor(Math.random() * 4294967296));

/** «yarın (Pazar 25 Ekim)» gibi: göreli ifade ve tarih sayfa dilinde; Intl yoksa tarih sade yazılır. */
function oneriMetni(sablon: string, sonraki: string, bugun: string): string {
  let ne = sonraki;
  let tarih = sonraki;
  try {
    const dil = document.documentElement.lang || 'tr';
    const [y, a, g] = sonraki.split('-').map(Number);
    tarih = new Intl.DateTimeFormat(dil, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, a - 1, g));
    ne = new Intl.RelativeTimeFormat(dil, { numeric: 'auto' }).format(gunFarki(bugun, sonraki), 'day');
  } catch { /* tanınmayan dil ya da Intl yok: sade tarih */ }
  return doldur(sablon, { ne, tarih });
}

// Arapça yazı boyutu (A− / A+): kip.ts'in aynı düğmeleri çalışma kiplerine bağlıdır, bu sayfada kendi kutusu var.
function arBoyutu() {
  const sayfa = document.querySelector<HTMLElement>('.madde');
  const kutu = document.querySelector<HTMLElement>('[data-bilgi-ar-boyut]');
  if (!sayfa || !kutu) return;
  const azalt = kutu.querySelector<HTMLButtonElement>('[data-bilgi-azalt]')!;
  const arttir = kutu.querySelector<HTMLButtonElement>('[data-bilgi-arttir]')!;
  const goster = (ar: number) => {
    sayfa.dataset.arOlcek = String(ar);
    azalt.disabled = ar <= AR_ENAZ;
    arttir.disabled = ar >= AR_ENCOK;
  };
  kutu.hidden = false;
  goster(oku(depo()).ar);
  azalt.addEventListener('click', () => goster(guncelle((d) => arBoyutuAyarla(d, d.ar - 1)).ar));
  arttir.addEventListener('click', () => goster(guncelle((d) => arBoyutuAyarla(d, d.ar + 1)).ar));
}
arBoyutu();

const kok = document.querySelector<HTMLElement>('[data-bilgi-kip]');
if (kok) {
  let veri: Veri | null = null;
  try { veri = JSON.parse(kok.dataset.veri ?? '') as Veri; } catch { veri = null; }
  if (veri?.gruplar?.length) basla(kok, veri);
}

function basla(kok: HTMLElement, veri: Veri) {
  const m = veri.m;
  const hata = kok.querySelector<HTMLElement>('[data-bilgi-hata]');
  try {
    const paneller = new Map<Kip, HTMLElement>();
    for (const p of kok.querySelectorAll<HTMLElement>('[data-bilgi-panel]')) paneller.set(p.dataset.bilgiPanel as Kip, p);
    const gizle = paneller.get('gizle');
    if (!gizle) return;
    kurGizle(gizle, veri);
    const sirala = paneller.get('sirala');
    if (sirala) kurSirala(sirala, veri);
    kurNasil(kok.querySelector<HTMLElement>('[data-bilgi-nasil]'), veri);

    const sekmeler = [...kok.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const ac = (kip: Kip, odak = false) => {
      for (const s of sekmeler) {
        const bu = s.dataset.bilgiSekme === kip;
        s.setAttribute('aria-selected', String(bu));
        s.tabIndex = bu ? 0 : -1;
        const p = paneller.get(s.dataset.bilgiSekme as Kip);
        if (p) p.hidden = !bu;
        if (bu && odak) s.focus({ preventScroll: true });
      }
    };
    sekmeler.forEach((s, i) => {
      s.addEventListener('click', () => ac(s.dataset.bilgiSekme as Kip));
      s.addEventListener('keydown', (e) => {
        const git = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? sekmeler.length - 1 : null;
        if (git === null) return; // ok/Home/End dışındaki tuşlar (ARIA sekme düzeni)
        e.preventDefault();
        ac(sekmeler[(git + sekmeler.length) % sekmeler.length].dataset.bilgiSekme as Kip, true);
      });
    });
    kok.hidden = false;
  } catch {
    if (hata) { hata.textContent = m.yuklenemedi; hata.hidden = false; }
    kok.hidden = false;
  }
}

/** Bugünü «çalışılan gün» sayar (hafta çubuğu için). */
const calistim = () => { guncelle((d) => calismaGunuIsle(d, yerelGun(new Date()))); };

// ——— Gizle ve söyle ———
interface GizliOge { gizli: boolean; no: number; ad: HTMLElement; cizgi: HTMLElement; dugme: HTMLButtonElement; etiket: string }

function kurGizle(panel: HTMLElement, veri: Veri) {
  const m = veri.m;
  const durum = el('p', 'kip-durum');
  durum.setAttribute('role', 'status');
  durum.setAttribute('aria-live', 'polite');
  const ogeler: GizliOge[] = [];
  const guncelleDurum = () => {
    const kalan = ogeler.filter((o) => o.gizli).length;
    durum.textContent = kalan === 0 ? m.hepsiAcik : doldur(m.gizliKalan, { n: kalan });
  };
  const ayarla = (o: GizliOge, acik: boolean) => {
    o.gizli = !acik;
    o.ad.hidden = !acik;
    o.cizgi.hidden = acik;
    o.dugme.textContent = acik ? m.gizle : m.goster;
    o.dugme.setAttribute('aria-label', `${o.etiket}${doldur(acik ? m.maddeGizle : m.maddeGoster, { n: o.no })}`);
  };

  const govde = el('div', 'bilgi-oyun');
  for (const g of veri.gruplar) {
    const kap = el('div', 'bilgi-grup');
    if (g.ad) kap.append(el('h4', 'bilgi-grup-ad', g.ad));
    const ol = el('ol', 'bilgi-liste bilgi-oyun-liste');
    ol.setAttribute('role', 'list');
    for (const x of g.maddeler) {
      const li = el('li', 'bilgi-madde');
      li.append(el('span', 'bilgi-no', String(x.no)));
      const icerik = el('div', 'bilgi-icerik');
      const ad = el('p', 'bilgi-ad', x.metin);
      // Noktalı çizginin uzunluğu cevabı ele verecek kadar değil, yalnız satırı doldurmak içindir (dört kademe).
      const cizgi = el('span', `cizgi c${x.metin.length <= 14 ? 3 : x.metin.length <= 40 ? 4 : x.metin.length <= 90 ? 5 : 6}`);
      cizgi.setAttribute('aria-hidden', 'true');
      icerik.append(ad, cizgi);
      const o: GizliOge = { gizli: true, no: x.no, ad, cizgi, dugme: undefined as unknown as HTMLButtonElement, etiket: g.ad ? `${g.ad}: ` : '' };
      o.dugme = dugme('', 'secim bilgi-ac', () => { ayarla(o, o.gizli); guncelleDurum(); });
      ayarla(o, false);
      li.append(icerik, o.dugme);
      ogeler.push(o);
      ol.append(li);
    }
    kap.append(ol);
    govde.append(kap);
  }
  const hepsi = (acik: boolean) => { for (const o of ogeler) ayarla(o, acik); guncelleDurum(); };
  const eylem = el('div', 'kip-eylem');
  eylem.append(
    dugme(m.hepsiniGoster, 'dugme ikincil', () => { hepsi(true); calistim(); }),
    dugme(m.hepsiniGizle, 'dugme ikincil', () => hepsi(false)),
  );
  hepsi(false);
  panel.append(el('p', 'kip-not', m.gizleYonerge), eylem, govde, durum);
}

// ——— Sırala ———
function kurSirala(panel: HTMLElement, veri: Veri) {
  const m = veri.m;
  const uygun = veri.gruplar.filter((g) => g.maddeler.length >= 3);
  if (!uygun.length) return;
  let gi = 0;
  const mesajKutusu = el('p', 'kip-durum');
  mesajKutusu.setAttribute('role', 'status');
  mesajKutusu.setAttribute('aria-live', 'polite');
  const alan = el('div', 'sina-alan');

  let secici: HTMLElement | null = null;
  if (uygun.length > 1) {
    secici = el('label', 'kip-alan', m.bolum);
    const s = el('select');
    uygun.forEach((g, i) => {
      const o = el('option', '', g.ad);
      o.value = String(i);
      s.append(o);
    });
    s.addEventListener('change', () => { gi = Number(s.value); tur(); });
    secici.append(s);
  }

  function tur() {
    const g = uygun[gi];
    const parcalar = g.maddeler.map((x) => x.metin);
    const k = parcalar.length;
    let sira = farkliSira(k, yeniTohum());
    let kontrol = false;
    mesajKutusu.textContent = '';
    const liste = el('ol', 'sina-sira');
    liste.setAttribute('role', 'list');

    const ciz = () => {
      liste.replaceChildren(...sira.map((p, i) => {
        const li = el('li', 'sina-oge');
        li.dataset.i = String(i);
        li.append(el('span', 'sina-no', String(i + 1)), el('span', 'bilgi-parca', parcalar[p]));
        if (kontrol && p === i) {
          li.classList.add('dogru');
          li.append(el('span', 'sina-isaret', `✓ ${m.dogruYerde}`));
        }
        const tasi = el('span', 'sina-tasi');
        const yukari = dugme('↑', 'secim', () => tasiAdim(i, -1));
        yukari.dataset.yon = '-1';
        yukari.disabled = i === 0;
        yukari.setAttribute('aria-label', doldur(m.yukari, { n: i + 1 }));
        const asagi = dugme('↓', 'secim', () => tasiAdim(i, 1));
        asagi.dataset.yon = '1';
        asagi.disabled = i === k - 1;
        asagi.setAttribute('aria-label', doldur(m.asagi, { n: i + 1 }));
        tasi.append(yukari, asagi);
        li.append(tasi);
        return li;
      }));
    };
    function tasiAdim(i: number, yon: number) {
      const j = i + yon;
      if (j < 0 || j >= k) return;
      [sira[i], sira[j]] = [sira[j], sira[i]];
      kontrol = false;
      mesajKutusu.textContent = '';
      ciz();
      const hedef = liste.querySelector<HTMLButtonElement>(`li[data-i="${j}"] button[data-yon="${yon}"]`);
      const yedek = liste.querySelector<HTMLButtonElement>(`li[data-i="${j}"] button[data-yon="${-yon}"]`);
      (hedef && !hedef.disabled ? hedef : yedek)?.focus();
    }
    liste.addEventListener('keydown', (e) => {
      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      const li = (e.target as Element).closest<HTMLElement>('li[data-i]');
      if (!li) return;
      e.preventDefault();
      tasiAdim(Number(li.dataset.i), e.key === 'ArrowUp' ? -1 : 1);
    });

    const eylem = el('div', 'kip-eylem');
    eylem.append(
      dugme(m.kontrolEt, 'dugme birincil', () => {
        kontrol = true;
        ciz();
        calistim();
        mesajKutusu.textContent = siraDogru(sira) ? m.siraTamam : `${doldur(m.yerinde, { y: yerindeSayisi(sira), n: k })} ${m.siraDevam}`;
      }),
      dugme(m.cevapGoster, 'dugme ikincil', () => {
        sira = sira.map((_, i) => i);
        kontrol = true;
        ciz();
        mesajKutusu.textContent = doldur(m.yerinde, { y: k, n: k });
      }),
      dugme(m.yeniTur, 'dugme ikincil', tur),
    );
    ciz();
    alan.replaceChildren(el('p', 'kip-yonerge', m.siralaYonerge), liste, eylem);
  }
  tur();
  panel.append(...(secici ? [secici] : []), alan, mesajKutusu);
}

// ——— Nasıl geçti? ———
function kurNasil(kutu: HTMLElement | null, veri: Veri) {
  if (!kutu) return;
  const m = veri.m;
  const grup = el('div', 'kip-sonuc');
  grup.setAttribute('role', 'group');
  grup.setAttribute('aria-label', m.sinaNasil);
  const oneri = el('p', 'kip-durum');
  oneri.setAttribute('role', 'status');
  const oneriNot = el('p', 'kip-not', m.oneriNot);
  oneriNot.hidden = true;
  const gunDurumu = () => {
    const ay = maddeAyari(oku(depo()), veri.id);
    const bugun = yerelGun(new Date());
    if (!tarihMi(ay.sonraki)) { oneri.textContent = ''; return; }
    oneri.textContent = ay.sonraki <= bugun ? m.tekrarGunu : oneriMetni(m.kayitliOneri, ay.sonraki, bugun);
  };
  const yanit = (s: TekrarSonucu) => {
    const bugun = yerelGun(new Date());
    const yeni = sonrakiTekrar(maddeAyari(oku(depo()), veri.id).kutu, s, bugun);
    guncelle((d) => calismaGunuIsle(maddeyiGuncelle(d, veri.id, { kutu: yeni.kutu, sonraki: yeni.sonraki }, Date.now()), bugun));
    const bas = s === 'tam' ? m.yanitTam : s === 'az' ? m.yanitAz : m.yanitTekrar;
    oneri.textContent = `${bas} ${oneriMetni(m.oneri, yeni.sonraki, bugun)}`;
    oneriNot.hidden = false;
  };
  const dugmeler = el('div', 'kip-dugmeler');
  dugmeler.append(dugme(m.tam, 'dugme birincil', () => yanit('tam')), dugme(m.az, 'dugme ikincil', () => yanit('az')), dugme(m.tekrar, 'dugme ikincil', () => yanit('tekrar')));
  grup.append(el('p', 'kip-soru', m.sinaNasil), dugmeler);
  gunDurumu();
  kutu.append(grup, oneri, oneriNot);
}
