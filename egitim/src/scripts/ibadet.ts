/**
 * «Abdest ve Namaz» sayfalarının davranışı (10 Kasım 2026): giriş sayfasındaki ilerleme sayıları, adım adım öğrenme, sıralama, eşleştirme ve
 * seçim alıştırmaları. Sayfa içeriği ve doğru yanıtlar sunucuda çizilir; burada yalnız etkileşim var. Sürükleme yok: sıralama yukarı/aşağı
 * düğmeleriyle, eşleştirme dokun-seç-dokun ile, seçim yerel radyo düğmeleriyle yapılır (klavye ve ekran okuyucu tam çalışır). Hareket
 * yalnız kaydırmadır ve «azaltılmış hareket» tercihinde kapanır. CSP: satır içi betik/stil yok; metinler `data-veri` ile gelir, DOM'a yalnız
 * `textContent` yazılır. Sonuç yalnız «tamam» ve «hatasız tamam» bitleridir (puan/sıralama yok); cihaza yazılır, girişliyse hesapla eşitlenir.
 */
import { eslestirDegerlendir, karisikSira, karistir, rastgele, secimDegerlendir, siraDegerlendir, sonucBiti, tasi, turSec } from '@ortak/lib/ibadet/ibadet-alistirma';
import { TAMAM, konuMu, konuSayimi, durum, type Konu, type Slot } from '@ortak/lib/ilim-yolu/ibadet-ilerleme';
import { bulutlaEsitle, ibadetIsaretle, ibadetOku } from './ibadet-ortak';
import { doldur } from './kip-ortak';

const yeniTohum = () => rastgele(Math.floor(Math.random() * 4294967296));
const azHareket = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sor = <T extends HTMLElement>(kok: ParentNode, s: string): T | null => kok.querySelector<T>(s);
const hepsi = <T extends HTMLElement>(kok: ParentNode, s: string): T[] => [...kok.querySelectorAll<T>(s)];
function veriOku<T>(kok: HTMLElement): T | null {
  try { return JSON.parse(kok.dataset.veri ?? '') as T; } catch { return null; }
}

/** Sayfadaki «tamamlandı» rozetlerini cihaz kaydına göre günceller. */
function rozetleriYenile() {
  const il = ibadetOku();
  for (const kok of hepsi(document, '[data-ib-ogren],[data-ib-sirala],[data-ib-esles],[data-ib-secim]')) {
    const konu = kok.dataset.konu;
    const slot = (kok.dataset.slot ?? 'ogren') as Slot;
    const rozet = sor(kok, '[data-tamam]');
    if (rozet && konuMu(konu)) rozet.hidden = (durum(il, konu, slot) & TAMAM) === 0;
  }
  for (const kart of hepsi(document, '[data-konu-kart]')) {
    const konu = kart.dataset.konuKart;
    if (!konuMu(konu)) continue;
    const s = konuSayimi(il, konu);
    kart.dataset.tamam = s.tamam ? '1' : '0';
  }
}
const esitleVeYenile = () => { void bulutlaEsitle(() => { rozetleriYenile(); hubYaz(); }); };

/** Çalışmayı kaydeder; yazım başarısını döner. */
function kaydet(konu: Konu, slot: Slot, bit: number): boolean {
  const { yazildi } = ibadetIsaretle(konu, slot, bit);
  rozetleriYenile();
  hubYaz();
  esitleVeYenile();
  return yazildi;
}

// ——— Giriş sayfası ———
function hubYaz() {
  const hub = sor(document, '[data-ibadet-hub]');
  if (!hub) return;
  const v = veriOku<{ m: { bolumTamam: string }; toplamlar: Record<string, number> }>(hub);
  if (!v) return;
  const il = ibadetOku();
  for (const kart of hepsi(hub, '[data-konu-kart]')) {
    const konu = kart.dataset.konuKart;
    const yazi = sor(kart, '[data-sayim]');
    if (!yazi || !konuMu(konu)) continue;
    const s = konuSayimi(il, konu);
    yazi.textContent = doldur(v.m.bolumTamam, { n: s.tamamlanan, m: s.toplam });
  }
}

// ——— Adım adım öğrenme ———
function ogrenKur(kok: HTMLElement) {
  const v = veriOku<{ konu: string; m: Record<string, string> }>(kok);
  if (!v || !konuMu(v.konu)) return;
  const konu = v.konu;
  const durumSatiri = sor(kok, '[data-ogrendim-durum]');
  const dugme = sor<HTMLButtonElement>(kok, '[data-ogrendim]');
  const goster = (yazildi = true) => {
    const ogrenildi = (durum(ibadetOku(), konu, 'ogren') & TAMAM) !== 0;
    dugme?.setAttribute('aria-pressed', String(ogrenildi));
    if (durumSatiri) {
      durumSatiri.classList.toggle('hata', !yazildi);
      durumSatiri.textContent = !yazildi ? v.m.kaydedilemedi : ogrenildi ? v.m.ogrendimOldu : '';
    }
  };
  goster();
  dugme?.addEventListener('click', () => { goster(kaydet(konu, 'ogren', TAMAM)); });

  const adimlar = hepsi<HTMLElement>(kok, '[data-adim]');
  const gezgin = sor(kok, '[data-gezgin]');
  if (!adimlar.length || !gezgin) return;
  const onceki = sor<HTMLButtonElement>(gezgin, '[data-onceki]')!;
  const sonraki = sor<HTMLButtonElement>(gezgin, '[data-sonraki]')!;
  const sayac = sor(gezgin, '[data-sayac]')!;
  const tumu = sor<HTMLButtonElement>(gezgin, '[data-hepsi]')!;
  const n = adimlar.length;
  let i = 0;
  let liste = typeof matchMedia === 'function' ? !matchMedia('(max-width: 40rem)').matches : true;
  gezgin.hidden = false;
  const ciz = () => {
    adimlar.forEach((li, k) => { li.hidden = !liste && k !== i; });
    sayac.hidden = liste;
    onceki.hidden = liste;
    sonraki.hidden = liste;
    onceki.disabled = i === 0;
    sonraki.disabled = i === n - 1;
    sayac.textContent = doldur(v.m.adimSayaci, { n: i + 1, m: n });
    tumu.setAttribute('aria-pressed', String(liste));
    tumu.textContent = liste ? v.m.adimAdim : v.m.hepsiniGoster;
  };
  const git = (k: number) => { i = Math.max(0, Math.min(n - 1, k)); ciz(); };
  onceki.addEventListener('click', () => git(i - 1));
  sonraki.addEventListener('click', () => git(i + 1));
  tumu.addEventListener('click', () => { liste = !liste; ciz(); });
  ciz();
  // Adım bağlantıları (rek‘at düzeninden ve vakit sayfalarından): ilgili adımı göster ve kaydır.
  const adimaGit = (id: string): boolean => {
    const k = adimlar.findIndex((li) => li.id === id);
    if (k < 0) return false;
    i = k;
    ciz();
    adimlar[k].scrollIntoView({ block: 'start', behavior: azHareket() ? 'auto' : 'smooth' });
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#adim-"]');
    if (!a) return;
    const id = a.hash.slice(1);
    if (a.pathname !== location.pathname) return;
    if (adimaGit(id)) e.preventDefault();
  });
  if (location.hash.startsWith('#adim-')) adimaGit(location.hash.slice(1));
}

// ——— Sıralama ———
function siralaKur(kok: HTMLElement) {
  const v = veriOku<{ konu: string; slot: string; m: Record<string, string> }>(kok);
  const liste = sor<HTMLOListElement>(kok, '[data-liste]');
  if (!v || !liste || !konuMu(v.konu)) return;
  const konu = v.konu;
  const slot = v.slot as Slot;
  const ogeler = hepsi<HTMLLIElement>(liste, '.ib-sira-oge');
  const n = ogeler.length;
  const durumSatiri = sor(kok, '[data-durum]')!;
  const duyuru = document.createElement('p');
  duyuru.className = 'gorunmez';
  duyuru.setAttribute('role', 'status');
  kok.append(duyuru);
  let sira: number[] = [];
  let hata = 0;

  const isaretleriSil = () => {
    for (const o of ogeler) { o.removeAttribute('data-sonuc'); const s = sor(o, '[data-oge-sonuc]'); if (s) s.textContent = ''; }
    durumSatiri.textContent = '';
  };
  const ciz = (odak?: { oge: HTMLElement; yon: 'yukari' | 'asagi' }) => {
    liste.append(...sira.map((k) => ogeler[k]));
    sira.forEach((k, pos) => {
      const o = ogeler[k];
      const no = sor(o, '[data-no]');
      if (no) no.textContent = String(pos + 1);
      const yk = sor<HTMLButtonElement>(o, '[data-yukari]')!;
      const as = sor<HTMLButtonElement>(o, '[data-asagi]')!;
      yk.disabled = pos === 0;
      as.disabled = pos === n - 1;
    });
    if (odak) {
      const ilk = sor<HTMLButtonElement>(odak.oge, odak.yon === 'yukari' ? '[data-yukari]' : '[data-asagi]')!;
      const yedek = sor<HTMLButtonElement>(odak.oge, odak.yon === 'yukari' ? '[data-asagi]' : '[data-yukari]')!;
      (ilk.disabled ? yedek : ilk).focus();
    }
  };
  const karistirYeni = () => { sira = karisikSira(n, yeniTohum()); hata = 0; isaretleriSil(); ciz(); };

  kok.dataset.hazir = '';
  karistirYeni();
  sor<HTMLButtonElement>(kok, '[data-yeniden]')?.addEventListener('click', () => { karistirYeni(); });
  for (const o of ogeler) {
    for (const yon of ['yukari', 'asagi'] as const) {
      sor<HTMLButtonElement>(o, `[data-${yon}]`)!.addEventListener('click', () => {
        const pos = sira.indexOf(ogeler.indexOf(o));
        sira = tasi(sira, pos, yon === 'yukari' ? -1 : 1);
        isaretleriSil();
        ciz({ oge: o, yon });
        duyuru.textContent = doldur(v.m.konum, { ad: o.dataset.ad ?? '', n: sira.indexOf(ogeler.indexOf(o)) + 1, m: n });
      });
    }
  }
  sor<HTMLButtonElement>(kok, '[data-kontrol]')?.addEventListener('click', () => {
    const s = siraDegerlendir(sira);
    sira.forEach((k, pos) => {
      const o = ogeler[k];
      const dogru = s.dogru[pos];
      o.dataset.sonuc = dogru ? 'dogru' : 'yanlis';
      const y = sor(o, '[data-oge-sonuc]');
      if (y) y.textContent = dogru ? v.m.dogruYerde : v.m.yanlisYerde;
    });
    if (s.tamam) {
      const yazildi = kaydet(konu, slot, sonucBiti(true, hata));
      durumSatiri.textContent = yazildi ? v.m.siraTam : `${v.m.siraTam} ${v.m.kaydedilemedi}`;
    } else {
      hata++;
      durumSatiri.textContent = doldur(v.m.siraSonuc, { n: s.yerinde, m: s.toplam });
    }
  });
}

// ——— Eşleştirme ———
function eslesKur(kok: HTMLElement) {
  const v = veriOku<{ konu: string; slot: string; adet: number; m: Record<string, string> }>(kok);
  const solUl = sor<HTMLUListElement>(kok, '[data-sol]');
  const sagUl = sor<HTMLUListElement>(kok, '[data-sag]');
  if (!v || !solUl || !sagUl || !konuMu(v.konu)) return;
  const konu = v.konu;
  const slot = v.slot as Slot;
  const solLi = hepsi<HTMLLIElement>(solUl, ':scope > li');
  const sagLi = hepsi<HTMLLIElement>(sagUl, ':scope > li');
  const n = solLi.length;
  const solB = solLi.map((li) => sor<HTMLButtonElement>(li, '[data-sol-oge]')!);
  const sagB = sagLi.map((li) => sor<HTMLButtonElement>(li, '[data-sag-oge]')!);
  for (const b of sagB) b.dataset.alt = b.getAttribute('aria-label') ?? '';
  const durumSatiri = sor(kok, '[data-durum]')!;
  let aktif: number[] = [];
  let cevap: (number | null)[] = Array(n).fill(null);
  let secili: { taraf: 'sol' | 'sag'; i: number } | null = null;
  let hata = 0;
  const numara = (g: number) => aktif.indexOf(g) + 1;

  const isaretleriSil = () => {
    for (const b of [...solB, ...sagB]) { b.removeAttribute('data-sonuc'); const s = sor(b, '[data-oge-sonuc]'); if (s) s.textContent = ''; }
  };
  const ciz = () => {
    for (let g = 0; g < n; g++) {
      const sagEs = cevap.indexOf(g); // g. sağ öğeye bağlı sol öğe
      const solRozet = sor(solB[g], '[data-rozet]')!;
      const sagRozet = sor(sagB[g], '[data-rozet]')!;
      solRozet.textContent = cevap[g] !== null ? doldur(v.m.eslesNo, { n: numara(g) }) : '';
      sagRozet.textContent = sagEs >= 0 ? doldur(v.m.eslesNo, { n: numara(sagEs) }) : '';
      sagB[g].setAttribute('aria-label', sagEs >= 0 ? `${sagB[g].dataset.alt}, ${sagRozet.textContent}` : (sagB[g].dataset.alt ?? ''));
      const solSecili = secili?.taraf === 'sol' && secili.i === g;
      const sagSecili = secili?.taraf === 'sag' && secili.i === g;
      solB[g].setAttribute('aria-pressed', String(solSecili || cevap[g] !== null));
      sagB[g].setAttribute('aria-pressed', String(sagSecili || sagEs >= 0));
      solB[g].dataset.durum = solSecili ? 'secili' : cevap[g] !== null ? 'eslesti' : '';
      sagB[g].dataset.durum = sagSecili ? 'secili' : sagEs >= 0 ? 'eslesti' : '';
    }
  };
  const degisti = () => { isaretleriSil(); durumSatiri.textContent = ''; ciz(); };
  const tikla = (taraf: 'sol' | 'sag', g: number) => {
    // Eşleşmiş öğeye dokunmak eşleşmeyi bozar.
    const bagliSol = taraf === 'sol' ? (cevap[g] !== null ? g : -1) : cevap.indexOf(g);
    if (bagliSol >= 0) {
      cevap[bagliSol] = null;
      secili = null;
      return degisti();
    }
    if (secili && secili.taraf !== taraf) {
      const sol = taraf === 'sol' ? g : secili.i;
      const sag = taraf === 'sag' ? g : secili.i;
      cevap[sol] = sag;
      secili = null;
      return degisti();
    }
    secili = secili && secili.taraf === taraf && secili.i === g ? null : { taraf, i: g };
    degisti();
  };
  solB.forEach((b, g) => b.addEventListener('click', () => tikla('sol', g)));
  sagB.forEach((b, g) => b.addEventListener('click', () => tikla('sag', g)));

  const yeniTur = () => {
    const r = yeniTohum();
    aktif = turSec(n, v.adet, r);
    cevap = Array(n).fill(null);
    secili = null;
    hata = 0;
    const gorunur = new Set(aktif);
    solLi.forEach((li, g) => { li.hidden = !gorunur.has(g); });
    sagLi.forEach((li, g) => { li.hidden = !gorunur.has(g); });
    sagUl.append(...karistir(aktif, r).map((g) => sagLi[g]), ...sagLi.filter((_, g) => !gorunur.has(g)));
    degisti();
  };
  kok.dataset.hazir = '';
  yeniTur();
  sor<HTMLButtonElement>(kok, '[data-yeni]')?.addEventListener('click', yeniTur);
  sor<HTMLButtonElement>(kok, '[data-kontrol]')?.addEventListener('click', () => {
    if (aktif.some((g) => cevap[g] === null)) { durumSatiri.textContent = v.m.eslesEksik; return; }
    const alt = aktif.map((g) => (cevap[g] === null ? null : aktif.indexOf(cevap[g] as number)));
    const s = eslestirDegerlendir(alt);
    aktif.forEach((g, p) => {
      const dogru = s.dogru[p];
      const sag = cevap[g] as number;
      for (const b of [solB[g], sagB[sag]]) {
        b.dataset.sonuc = dogru ? 'dogru' : 'yanlis';
        const y = sor(b, '[data-oge-sonuc]');
        if (y) y.textContent = dogru ? v.m.dogruEslesme : v.m.yanlisEslesme;
      }
    });
    if (s.tamam) {
      const yazildi = kaydet(konu, slot, sonucBiti(true, hata));
      durumSatiri.textContent = yazildi ? v.m.eslesTam : `${v.m.eslesTam} ${v.m.kaydedilemedi}`;
    } else {
      hata++;
      durumSatiri.textContent = doldur(v.m.eslesSonuc, { n: s.dogru.filter(Boolean).length, m: aktif.length });
    }
  });
}

// ——— Seçim ———
function secimKur(kok: HTMLElement) {
  const v = veriOku<{ konu: string; slot: string; adet: number; m: Record<string, string> }>(kok);
  if (!v || !konuMu(v.konu)) return;
  const konu = v.konu;
  const slot = v.slot as Slot;
  const satirlar = hepsi<HTMLFieldSetElement>(kok, '[data-satir]');
  const durumSatiri = sor(kok, '[data-durum]')!;
  let gorunen: number[] = satirlar.map((_, k) => k);
  let hata = 0;
  const temizle = () => {
    for (const f of satirlar) {
      f.removeAttribute('data-sonuc');
      const g = sor(f, '[data-geri]');
      if (g) g.textContent = '';
    }
    durumSatiri.textContent = '';
  };
  const yeniTur = () => {
    gorunen = turSec(satirlar.length, v.adet, yeniTohum());
    const set = new Set(gorunen);
    satirlar.forEach((f, k) => {
      f.hidden = !set.has(k);
      for (const r of hepsi<HTMLInputElement>(f, 'input[type="radio"]')) r.checked = false;
    });
    hata = 0;
    temizle();
  };
  kok.dataset.hazir = '';
  yeniTur();
  sor<HTMLButtonElement>(kok, '[data-yeni]')?.addEventListener('click', yeniTur);
  kok.addEventListener('change', temizle);
  sor<HTMLButtonElement>(kok, '[data-kontrol]')?.addEventListener('click', () => {
    const secimler = gorunen.map((k) => {
      const r = sor<HTMLInputElement>(satirlar[k], 'input:checked');
      return r ? Number(r.value) : -1;
    });
    const dogrular = gorunen.map((k) => Number(sor<HTMLInputElement>(satirlar[k], 'input[data-dogru]')?.value ?? -1));
    const s = secimDegerlendir(secimler, dogrular);
    if (s.eksik > 0) { durumSatiri.textContent = v.m.secimYok; return; }
    gorunen.forEach((k, p) => {
      const f = satirlar[k];
      f.dataset.sonuc = s.dogru[p] ? 'dogru' : 'yanlis';
      const g = sor(f, '[data-geri]');
      if (!g) return;
      const dogruYazi = sor(f, 'input[data-dogru]')?.closest('label')?.textContent?.trim() ?? '';
      g.textContent = s.dogru[p] ? v.m.dogru : doldur(v.m.yanlis, { c: dogruYazi });
    });
    if (s.tamam) {
      const yazildi = kaydet(konu, slot, sonucBiti(true, hata));
      durumSatiri.textContent = yazildi ? v.m.secimTam : `${v.m.secimTam} ${v.m.kaydedilemedi}`;
    } else {
      hata++;
      durumSatiri.textContent = doldur(v.m.secimSonuc, { n: s.dogru.filter(Boolean).length, m: gorunen.length });
    }
  });
}

for (const k of hepsi(document, '[data-ib-ogren]')) ogrenKur(k);
for (const k of hepsi(document, '[data-ib-sirala]')) siralaKur(k);
for (const k of hepsi(document, '[data-ib-esles]')) eslesKur(k);
for (const k of hepsi(document, '[data-ib-secim]')) secimKur(k);
rozetleriYenile();
hubYaz();
esitleVeYenile();
