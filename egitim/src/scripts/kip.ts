/**
 * Madde sayfasındaki çalışma kipleri (Faz 2c, 24 Ekim 2026): Arapça yazı boyutu ve «Bağlayarak ezberle» / «Kademeli gizle»
 * sekmeleri. Kip ekranları ilk açılışta ayrı parça olarak yüklenir (sayfa açılışı hafif kalır); JavaScript yoksa çalışma
 * bölümü gizli kalır, metin ve meâl okunur. Tercihler yalnız bu tarayıcıda (src/lib/ezber/cihaz.ts) tutulur ve hocanın
 * verdiği basamağı değiştirmez. Veri (Arapça metin, bölüm sesleri, metinler) sayfadan `data-veri` ile gelir.
 */
import { AR_ENAZ, AR_ENCOK, arBoyutuAyarla, maddeAyari, maddeyiGuncelle, oku, yaz, type CihazDurumu, type Depo } from '@ortak/lib/ezber/cihaz';
import { sesSahibiKur, type Baglam, type Kip, type KipVeri } from './kip-ortak';

const depo = (): Depo | null => {
  try { return window.localStorage; } catch { return null; }
};
let cihaz: CihazDurumu = oku(depo());
const kaydetCihaz = () => { yaz(depo(), cihaz); };

// Arapça yazı boyutu: A− / A+ (sayfadaki metin ve kip ekranları); CSS `data-ar-olcek` özniteliğinden okur.
const sayfa = document.querySelector<HTMLElement>('.madde');
const arKutu = document.querySelector<HTMLElement>('[data-ar-boyut]');
if (sayfa) {
  sayfa.dataset.arOlcek = String(cihaz.ar);
  if (arKutu) {
    arKutu.hidden = false;
    const azalt = arKutu.querySelector<HTMLButtonElement>('[data-ar-azalt]')!;
    const arttir = arKutu.querySelector<HTMLButtonElement>('[data-ar-arttir]')!;
    const guncelle = () => {
      sayfa.dataset.arOlcek = String(cihaz.ar);
      azalt.disabled = cihaz.ar <= AR_ENAZ;
      arttir.disabled = cihaz.ar >= AR_ENCOK;
    };
    azalt.addEventListener('click', () => { cihaz = arBoyutuAyarla(cihaz, cihaz.ar - 1); kaydetCihaz(); guncelle(); });
    arttir.addEventListener('click', () => { cihaz = arBoyutuAyarla(cihaz, cihaz.ar + 1); kaydetCihaz(); guncelle(); });
    guncelle();
  }
}

const kok = document.querySelector<HTMLElement>('[data-kip]');
if (kok) {
  let veri: KipVeri;
  try {
    veri = JSON.parse(kok.dataset.veri ?? '') as KipVeri;
  } catch {
    veri = null as unknown as KipVeri;
  }
  if (veri?.bolumler?.length) basla(kok, veri);
}

function basla(kok: HTMLElement, veri: KipVeri) {
  const m = veri.m;
  const sekmeler = [...kok.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const paneller = new Map<Kip, HTMLElement>();
  for (const s of sekmeler) {
    const p = kok.querySelector<HTMLElement>(`[data-kip-panel="${s.dataset.kipSekme}"]`);
    if (p) paneller.set(s.dataset.kipSekme as Kip, p);
  }
  const hata = document.createElement('p');
  hata.className = 'kip-hata';
  hata.setAttribute('role', 'alert');
  hata.hidden = true;
  kok.append(hata);
  const ses = sesSahibiKur(() => { hata.textContent = m.sesHata; hata.hidden = false; });
  ses.dinle(() => { if (ses.caliyor) hata.hidden = true; });

  const baglam: Baglam = {
    veri,
    ses,
    ayar: () => maddeAyari(cihaz, veri.id),
    kaydet: (kismi) => { cihaz = maddeyiGuncelle(cihaz, veri.id, kismi, Date.now()); kaydetCihaz(); },
    gec: (kip) => { void ac(kip, true); },
  };

  const yuklendi = new Set<Kip>();
  async function ac(kip: Kip, odak = false, hatirla = true) {
    ses.durdur();
    hata.hidden = true;
    for (const s of sekmeler) {
      const bu = s.dataset.kipSekme === kip;
      s.setAttribute('aria-selected', String(bu));
      s.tabIndex = bu ? 0 : -1;
      const p = paneller.get(s.dataset.kipSekme as Kip);
      if (p) p.hidden = !bu;
      if (bu && odak) s.focus({ preventScroll: true });
    }
    if (hatirla) baglam.kaydet({ kip });
    const panel = paneller.get(kip);
    if (!panel || yuklendi.has(kip)) return;
    yuklendi.add(kip);
    try {
      const mod = kip === 'zincir' ? await import('./kip-zincir') : await import('./kip-gizle');
      mod.kur(panel, baglam);
    } catch {
      yuklendi.delete(kip);
      panel.textContent = m.yuklenemedi;
    }
  }

  sekmeler.forEach((s, i) => {
    s.addEventListener('click', () => { void ac(s.dataset.kipSekme as Kip); });
    s.addEventListener('keydown', (e) => {
      const git = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? sekmeler.length - 1 : -1;
      if (git < 0) return;
      e.preventDefault();
      const hedef = sekmeler[(git + sekmeler.length) % sekmeler.length];
      void ac(hedef.dataset.kipSekme as Kip, true);
    });
  });

  // Kayıtlı sekme açılır; tek parçalı maddede zincir kurulamayacağından doğrudan «Kademeli gizle» açılır.
  const kayitli = baglam.ayar().kip;
  kok.hidden = false;
  void ac(veri.bolumler.length < 2 ? 'gizle' : kayitli, false, false);
}
