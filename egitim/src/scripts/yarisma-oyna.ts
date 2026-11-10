/**
 * Bilgi Yarışması oyunu (10 Kasım 2026): sınıfın tek ekranda birlikte oynadığı oyun. Soru bankası sayfayla gelir (`data-veri`, yalnız sayfanın
 * dili; hassas gizemli kutular hiç gelmez); ayarlar ve tohum adres çubuğunun `#` kısmındadır. DEPO YOK: ortak puan, turlar ve seçimler yalnız
 * bellektedir (localStorage / sessionStorage / IndexedDB / ağ yazımı yok); sayfa yenilenince oyun aynı tohumla baştan başlar.
 * Kişi, takma ad, takım ya da sıralama yoktur; «ortak puan» sınıfın tek puanıdır (src/lib/yarisma/puan.ts).
 * Sürükleme yok: her şey düğmedir (klavye ve dokunma). CSP: satır içi betik/stil yok, DOM'a yalnız `textContent` yazılır; durumlar sınıf ve
 * `data-` ile (renk tek başına anlam taşımaz: her durumun yazısı ve kenar biçimi vardır).
 */
import { siraDegerlendir } from '@ortak/lib/ibadet/ibadet-alistirma';
import { EN_COK_KONTROL, bant, dokuma, gizemliPuani, toplamPuan, turPuani } from '@ortak/lib/yarisma/puan';
import { ayarOku, ayarYaz, sunumHazirla, turDagit, type Ayar } from '@ortak/lib/yarisma/tur';
import { gruplamaDegerlendir, tasiSabitli, yanlisCiftleriBosalt } from '@ortak/lib/yarisma/yerlesim';
import type { YerelSoru } from '@ortak/lib/yarisma/veri';
import type { YarismaMetinleri } from '../i18n/yarisma';
import { doldur } from './kip-ortak';

interface Veri { dil: string; sorular: YerelSoru[]; m: YarismaMetinleri }
type Evre = 'soru' | 'geri' | 'son';

interface Tur {
  soru: YerelSoru;
  sira: number[]; // sunum: bkz. tur.ts `Sunum`
  kontrol: number;
  secim: number | null; // quiz / gizemli: görünen seçenek indisi
  elenen: number[]; // görünen indisler
  acik: number; // gizemli: açık ipucu sayısı
  dizi: number[]; // sıralama: dizi[konum] = parçanın asıl sırası
  sabit: boolean[]; // sıralama (konuma göre) ve gruplama (karta göre) ve eşleştirme (çifte göre): yerinde ve kilitli
  yer: number[]; // gruplama: yer[kart] = kutu (−1 havuz)
  kartSec: number | null;
  cevap: (number | null)[]; // eşleştirme: cevap[sol] = seçilen sağ parçanın asıl sırası
  solSec: number | null;
  cozuldu: boolean;
  puan: number | null;
}

const SEKIL = ['▲', '●', '■', '◆'];
const HARF = ['A', 'B', 'C', 'D'];
const DOKU_MOTIF = ['pitrak', 'su-yolu', 'bereket', 'rozet'];

const kok = document.querySelector<HTMLElement>('[data-ya-oyun]');
if (kok) {
  let veri: Veri | null = null;
  try { veri = JSON.parse(kok.dataset.veri ?? '') as Veri; } catch { veri = null; }
  if (veri) oyna(kok, veri);
}

function e<K extends keyof HTMLElementTagNameMap>(etiket: K, sinif?: string, metin?: string, oz?: Record<string, string>): HTMLElementTagNameMap[K] {
  const x = document.createElement(etiket);
  if (sinif) x.className = sinif;
  if (metin !== undefined) x.textContent = metin;
  if (oz) for (const [k, v] of Object.entries(oz)) x.setAttribute(k, v);
  return x;
}
function dugme(sinif: string, metin: string, oz: Record<string, string> = {}): HTMLButtonElement {
  return e('button', sinif, metin, { type: 'button', ...oz });
}

function oyna(oyun: HTMLElement, v: Veri): void {
  const m = v.m;
  const sahne = oyun.querySelector<HTMLElement>('[data-sahne]')!;
  const durumYeri = oyun.querySelector<HTMLElement>('[data-durum]')!;
  const puanYeri = oyun.querySelector<HTMLOutputElement>('[data-puan]')!;
  const turYazi = oyun.querySelector<HTMLElement>('[data-tur-yazi]')!;
  const karolar = oyun.querySelector<HTMLElement>('[data-karolar]')!;
  const kontrolD = oyun.querySelector<HTMLButtonElement>('[data-kontrol]')!;
  const ipucuD = oyun.querySelector<HTMLButtonElement>('[data-ipucu]')!;
  const sonrakiD = oyun.querySelector<HTMLButtonElement>('[data-sonraki]')!;
  const tamD = oyun.querySelector<HTMLButtonElement>('[data-tam]')!;
  puanYeri.setAttribute('aria-live', 'off');

  let ayar: Ayar;
  let turlar: YerelSoru[] = [];
  let i = 0;
  let t: Tur;
  let evre: Evre = 'soru';
  let puanlar: number[] = [];
  let odak: string | null = null;

  const duyur = (s: string) => { durumYeri.textContent = s; };
  const toplam = () => toplamPuan(puanlar);

  /* ——— Başlangıç ——— */
  function hashBaglantilari() {
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[hreflang]')) a.href = `${a.href.split('#')[0]}${location.hash}`;
  }
  function basla() {
    ayar = ayarOku(location.hash);
    const normal = `#${ayarYaz(ayar)}`;
    if (location.hash !== normal) history.replaceState(null, '', normal);
    hashBaglantilari();
    turlar = turDagit(v.sorular, ayar);
    puanlar = [];
    i = 0;
    if (!turlar.length) {
      evre = 'son';
      sahne.replaceChildren(e('h2', 'ya-soru', m.bosHavuz));
      kontrolD.hidden = ipucuD.hidden = sonrakiD.hidden = true;
      turYazi.textContent = '';
      karolar.replaceChildren();
      duyur(m.bosHavuz);
      return;
    }
    turuAc(0);
  }

  function turuAc(n: number) {
    i = n;
    const soru = turlar[n];
    const sunum = sunumHazirla(soru, parcaSayisi(soru), ayar.tohum).sira as number[];
    const say = parcaSayisi(soru);
    t = {
      soru, sira: [...sunum], kontrol: 0, secim: null, elenen: [], acik: 1,
      dizi: soru.format === 'siralama' ? [...sunum] : [], sabit: [], yer: [], kartSec: null, cevap: [], solSec: null, cozuldu: false, puan: null,
    };
    if (soru.format === 'siralama') t.sabit = new Array(say).fill(false);
    if (soru.format === 'gruplama') { t.yer = new Array(say).fill(-1); t.sabit = new Array(say).fill(false); }
    if (soru.format === 'eslestirme') { t.cevap = new Array(say).fill(null); t.sabit = new Array(say).fill(false); }
    evre = 'soru';
    odak = 'baslik';
    ciz();
    duyur(`${doldur(m.turSayaci, { n: n + 1, m: turlar.length })} · ${m.bicim[soru.format]}`);
  }

  function parcaSayisi(s: YerelSoru): number {
    switch (s.format) {
      case 'quiz': case 'gizemli': return s.secenekler.length;
      case 'siralama': return s.ogeler.length;
      case 'gruplama': return s.ogeler.length;
      case 'eslestirme': return s.ciftler.length;
    }
  }

  /* ——— Çizim ——— */
  function ciz() {
    puanYeri.textContent = String(toplam());
    turYazi.textContent = evre === 'son' ? '' : doldur(m.turSayaci, { n: i + 1, m: turlar.length });
    karolar.replaceChildren(...puanlar.map((p, n) => karo(p, n)));
    sahne.replaceChildren();
    if (evre === 'son') { delete sahne.dataset.soruId; sonEkran(); }
    else {
      const s = t.soru;
      sahne.dataset.soruId = s.id;
      sahne.append(e('p', 'ya-bicim', m.bicim[s.format]));
      sahne.append(e('h2', 'ya-soru', s.format === 'quiz' ? s.soru : s.baslik, { tabindex: '-1', 'data-odak': 'baslik' }));
      if (evre === 'soru') sahne.append(e('p', 'ya-yonerge', yonerge(s)));
      if (s.format === 'quiz') cizSecenekler();
      else if (s.format === 'siralama') cizSira();
      else if (s.format === 'gruplama') cizGruplama();
      else if (s.format === 'eslestirme') cizEslestirme();
      else cizGizemli();
    }
    dugmeleriGuncelle();
    if (odak) {
      const hedef = oyun.querySelector<HTMLElement>(`[data-odak="${odak}"]:not([disabled]):not([hidden])`);
      hedef?.focus({ preventScroll: odak !== 'baslik' });
      odak = null;
    }
  }

  const yonerge = (s: YerelSoru): string => ({ quiz: m.yonQuiz, siralama: m.yonSiralama, gruplama: m.yonGruplama, eslestirme: m.yonEslestirme, gizemli: m.yonGizemli })[s.format];

  function karo(puan: number, n: number): HTMLElement {
    const li = e('li', `ya-karo d${dokuma(puan)}`);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const kullan = document.createElementNS(NS, 'use');
    kullan.setAttribute('href', `#mt-${DOKU_MOTIF[dokuma(puan)]}`);
    svg.append(kullan);
    li.append(svg, e('span', 'gorunmez', doldur(m.turKaro, { n: n + 1, p: puan })));
    return li;
  }

  function dugmeleriGuncelle() {
    const soruda = evre === 'soru';
    const s = soruda ? t.soru : null;
    kontrolD.hidden = !soruda;
    ipucuD.hidden = !(soruda && s?.format === 'gizemli' && t.acik < s.ipuclari.length);
    sonrakiD.hidden = evre !== 'geri';
    sonrakiD.textContent = i + 1 >= turlar.length ? m.sonucuGor : m.sonraki;
    if (soruda && s) {
      let hazir = true;
      if (s.format === 'quiz' || s.format === 'gizemli') hazir = t.secim !== null;
      else if (s.format === 'gruplama') hazir = t.yer.every((y) => y >= 0);
      else if (s.format === 'eslestirme') hazir = t.cevap.every((c) => c !== null);
      kontrolD.disabled = !hazir;
    }
    tamD.hidden = !document.fullscreenEnabled;
    tamD.textContent = document.fullscreenElement ? m.tamEkranKapat : m.tamEkran;
    for (const [d, ad] of [[kontrolD, 'kontrol'], [ipucuD, 'ipucu'], [sonrakiD, 'sonraki']] as const) d.dataset.odak = ad;
  }

  /* Sınav ve gizemli kutunun şıkları */
  function secenekListesi(secenekler: string[], dogruGorunen: number): HTMLElement {
    const ul = e('ul', 'ya-secenekler');
    secenekler.forEach((_, k) => {
      const asil = t.sira[k];
      const metin = secenekler[asil];
      const elendi = t.elenen.includes(k);
      const goster = evre === 'geri' && k === dogruGorunen;
      const secili = t.secim === k;
      const li = e('li');
      const b = dugme('ya-sec', '', { 'data-k': String(k), 'data-odak': `k${k}`, 'aria-pressed': secili ? 'true' : 'false' });
      b.dataset.durum = goster ? 'dogru' : elendi ? 'elendi' : secili ? 'secili' : 'bos';
      b.disabled = evre !== 'soru' || elendi;
      b.append(e('span', 'ya-sekil', SEKIL[k % 4], { 'aria-hidden': 'true' }), e('span', 'ya-harf', HARF[k % 4]));
      const yazi = e('span', 'ya-metin');
      if (elendi) { const s = e('s'); s.textContent = metin; yazi.append(s); } else yazi.textContent = metin;
      b.append(yazi);
      if (goster) b.append(e('span', 'ya-etiket', `✓ ${m.dogru}`));
      else if (elendi) b.append(e('span', 'ya-etiket', m.elendi));
      b.setAttribute('aria-label', doldur(m.secenek, { h: HARF[k % 4], m: metin }) + (goster ? ` — ${m.dogru}` : elendi ? ` — ${m.elendi}` : ''));
      li.append(b);
      ul.append(li);
    });
    return ul;
  }
  const ilkSecenek = (n: number): number => [...Array(n).keys()].find((k) => !t.elenen.includes(k)) ?? 0;
  const dogruGorunen = (s: { dogru: number }): number => t.sira.indexOf(s.dogru);

  function cizSecenekler() {
    const s = t.soru;
    if (s.format !== 'quiz') return;
    sahne.append(secenekListesi(s.secenekler, dogruGorunen(s)));
  }

  function cizGizemli() {
    const s = t.soru;
    if (s.format !== 'gizemli') return;
    const ust = e('div', 'ya-gizemli');
    const NS = 'http://www.w3.org/2000/svg';
    const resim = document.createElementNS(NS, 'svg');
    resim.setAttribute('class', 'ya-kutu-resim');
    resim.setAttribute('viewBox', '0 0 120 120');
    resim.setAttribute('role', 'img');
    resim.setAttribute('aria-label', m.kutuAlt);
    const kullan = document.createElementNS(NS, 'use');
    kullan.setAttribute('href', '#ya-kutu');
    resim.append(kullan);
    const liste = e('ol', 'ya-ipuclari');
    for (let n = 0; n < t.acik; n++) {
      const li = e('li', 'ya-ipucu');
      li.append(e('b', 'ya-ipucu-no', doldur(m.ipucuNo, { n: n + 1 })), e('span', 'ya-ipucu-metin', s.ipuclari[n]));
      liste.append(li);
    }
    ust.append(resim, liste);
    sahne.append(ust, secenekListesi(s.secenekler, dogruGorunen(s)));
  }

  /* Sıralama */
  function cizSira() {
    const s = t.soru;
    if (s.format !== 'siralama') return;
    const ol = e('ol', 'ya-sira');
    t.dizi.forEach((asil, pos) => {
      const sabit = t.sabit[pos];
      const li = e('li', 'ya-sira-oge', undefined, { 'data-pos': String(pos), tabindex: evre === 'soru' && !sabit ? '0' : '-1', 'data-odak': `r${pos}` });
      li.dataset.durum = sabit ? 'dogru' : 'bos';
      li.append(e('span', 'ya-no', String(pos + 1), { 'aria-hidden': 'true' }), e('span', 'ya-metin', s.ogeler[asil]));
      if (sabit || evre === 'geri') li.append(e('span', 'ya-etiket', `✓ ${m.yerinde}`));
      if (evre === 'soru' && !sabit) {
        const oklar = e('span', 'ya-oklar');
        oklar.append(
          dugme('ya-ok', '↑', { 'data-yukari': '', 'data-odak': `y${pos}`, 'aria-label': `${m.yukari}: ${s.ogeler[asil]}` }),
          dugme('ya-ok', '↓', { 'data-asagi': '', 'data-odak': `a${pos}`, 'aria-label': `${m.asagi}: ${s.ogeler[asil]}` }),
        );
        li.append(oklar);
      }
      ol.append(li);
    });
    sahne.append(ol);
  }
  function siraTasi(pos: number, yon: -1 | 1, hedefTur: 'r' | 'y' | 'a') {
    const yeni = tasiSabitli(t.dizi, t.sabit, pos, yon);
    const yeniPos = yeni.findIndex((x, k) => x !== t.dizi[k] && x === t.dizi[pos]);
    if (yeniPos < 0) return;
    // Sabit olmayan iki konum yer değiştirdi: sabit bayrakları konuma bağlı olduğundan değişmez.
    t.dizi = yeni;
    odak = `${hedefTur}${yeniPos}`;
    ciz();
    const s = t.soru;
    if (s.format === 'siralama') duyur(doldur(m.konum, { ad: s.ogeler[t.dizi[yeniPos]], n: yeniPos + 1 }));
  }

  /* Gruplama */
  function cizGruplama() {
    const s = t.soru;
    if (s.format !== 'gruplama') return;
    const alan = e('div', 'ya-gruplama');
    const havuz = e('div', 'ya-havuz');
    havuz.append(e('h3', 'ya-alt-baslik', m.havuz));
    const kartlar = e('div', 'ya-kartlar');
    for (const asil of t.sira) {
      if (t.yer[asil] >= 0) continue;
      const secili = t.kartSec === asil;
      const b = dugme('ya-kart', s.ogeler[asil].metin, { 'data-i': String(asil), 'data-odak': `c${asil}`, 'aria-pressed': secili ? 'true' : 'false' });
      b.dataset.durum = secili ? 'secili' : 'bos';
      b.disabled = evre !== 'soru';
      if (secili) b.append(e('span', 'ya-etiket', m.kartSecili));
      kartlar.append(b);
    }
    havuz.append(kartlar);
    const kutular = e('div', 'ya-kutular');
    ([0, 1] as const).forEach((g) => {
      const kutu = e('div', 'ya-kutu', undefined, { 'data-g': String(g) });
      const ad = dugme('ya-kutu-ad', doldur(m.kutuAd, { n: g + 1, ad: s.gruplar[g] }), { 'data-kutu': String(g), 'data-odak': `b${g}` });
      ad.disabled = evre !== 'soru' || t.kartSec === null;
      const liste = e('div', 'ya-kartlar');
      for (const asil of t.sira) {
        if (t.yer[asil] !== g) continue;
        const sabit = t.sabit[asil];
        const b = dugme('ya-kart yerlesti', s.ogeler[asil].metin, { 'data-i': String(asil), 'data-odak': `c${asil}` });
        b.dataset.durum = sabit || evre === 'geri' ? 'dogru' : 'bos';
        b.disabled = evre !== 'soru' || sabit;
        if (!b.disabled) b.setAttribute('aria-label', doldur(m.geriAl, { m: s.ogeler[asil].metin }));
        if (sabit || evre === 'geri') b.append(e('span', 'ya-etiket', `✓ ${m.yerinde}`));
        liste.append(b);
      }
      kutu.append(ad, liste);
      kutular.append(kutu);
    });
    alan.append(havuz, kutular);
    sahne.append(alan);
  }
  function kartiKoy(g: 0 | 1) {
    const s = t.soru;
    if (s.format !== 'gruplama' || t.kartSec === null) return;
    const kart = t.kartSec;
    t.yer[kart] = g;
    t.kartSec = null;
    const siradaki = t.sira.find((x) => t.yer[x] < 0);
    odak = siradaki !== undefined ? `c${siradaki}` : 'kontrol';
    ciz();
    duyur(doldur(m.kutuyaKoydu, { m: s.ogeler[kart].metin, n: g + 1 }));
  }

  /* Eşleştirme */
  function cizEslestirme() {
    const s = t.soru;
    if (s.format !== 'eslestirme') return;
    const alan = e('div', 'ya-esles');
    const sol = e('ol', 'ya-sutun', undefined, { 'aria-label': m.solSutun });
    const sag = e('ol', 'ya-sutun', undefined, { 'aria-label': m.sagSutun });
    s.ciftler.forEach((c, n) => {
      const eslesen = t.cevap[n] !== null;
      const sabit = t.sabit[n];
      const li = e('li');
      const b = dugme('ya-oge', '', { 'data-sol': String(n), 'data-odak': `l${n}` });
      b.dataset.durum = sabit || (evre === 'geri' && eslesen) ? 'dogru' : t.solSec === n ? 'secili' : eslesen ? 'eslesti' : 'bos';
      b.disabled = evre !== 'soru' || sabit;
      b.append(e('span', 'ya-no', String(n + 1), { 'aria-hidden': 'true' }), e('span', 'ya-metin', c.sol));
      if (eslesen) b.append(e('span', 'ya-etiket', doldur(m.eslesti, { n: n + 1 })));
      else if (t.solSec === n) b.append(e('span', 'ya-etiket', m.kartSecili));
      li.append(b);
      sol.append(li);
    });
    t.sira.forEach((asil, p) => {
      const sahibi = t.cevap.findIndex((c) => c === asil);
      const sabit = sahibi >= 0 && t.sabit[sahibi];
      const li = e('li');
      const b = dugme('ya-oge', '', { 'data-sag': String(p), 'data-odak': `s${p}` });
      b.dataset.durum = sabit || (evre === 'geri' && sahibi >= 0) ? 'dogru' : sahibi >= 0 ? 'eslesti' : 'bos';
      b.disabled = evre !== 'soru' || sabit;
      b.append(e('span', 'ya-metin', s.ciftler[asil].sag));
      if (sahibi >= 0) b.append(e('span', 'ya-etiket', doldur(m.eslesti, { n: sahibi + 1 })));
      li.append(b);
      sag.append(li);
    });
    alan.append(sol, sag);
    sahne.append(alan);
  }
  function eslestirmeTikla(taraf: 'sol' | 'sag', n: number) {
    const s = t.soru;
    if (s.format !== 'eslestirme') return;
    if (taraf === 'sol') {
      if (t.cevap[n] !== null) { t.cevap[n] = null; t.solSec = null; odak = `l${n}`; }
      else { t.solSec = t.solSec === n ? null : n; odak = `l${n}`; }
      ciz();
      return;
    }
    const asil = t.sira[n];
    const sahibi = t.cevap.findIndex((c) => c === asil);
    if (sahibi >= 0) { t.cevap[sahibi] = null; odak = `s${n}`; ciz(); return; }
    if (t.solSec === null) {
      // Sağdan başlanırsa ilk boş sol parçayı seç: tek dokunuşla ilerlemeyi bozmaz.
      return;
    }
    t.cevap[t.solSec] = asil;
    const bos = t.cevap.findIndex((c) => c === null);
    t.solSec = null;
    odak = bos >= 0 ? `l${bos}` : 'kontrol';
    ciz();
    duyur(doldur(m.eslesti, { n: (t.cevap.findIndex((c) => c === asil)) + 1 }));
  }

  /* ——— Kontrol ve sonuç ——— */
  function kontrolEt() {
    if (evre !== 'soru') return;
    const s = t.soru;
    if (s.format === 'quiz') {
      if (t.secim === null) return;
      t.kontrol++;
      if (t.sira[t.secim] === s.dogru) return bitir(true);
      t.elenen.push(t.secim);
      t.secim = null;
      if (t.kontrol >= EN_COK_KONTROL) return bitir(false);
      odak = 'k' + ilkSecenek(s.secenekler.length);
      ciz();
      duyur(m.tekrar);
    } else if (s.format === 'gizemli') {
      if (t.secim === null) return;
      t.kontrol++;
      if (t.sira[t.secim] === s.dogru) return bitir(true);
      t.elenen.push(t.secim);
      t.secim = null;
      if (t.elenen.length >= s.secenekler.length - 1) return bitir(false);
      const yeni = t.acik < s.ipuclari.length;
      if (yeni) t.acik++;
      odak = 'k' + ilkSecenek(s.secenekler.length);
      ciz();
      duyur(yeni ? `${m.tekrar} ${m.yeniIpucu}` : m.tekrar);
    } else if (s.format === 'siralama') {
      t.kontrol++;
      const sonuc = siraDegerlendir(t.dizi);
      if (sonuc.tamam) return bitir(true);
      t.sabit = t.sabit.map((x, k) => x || sonuc.dogru[k]);
      if (t.kontrol >= EN_COK_KONTROL) return bitir(false);
      odak = `r${t.sabit.findIndex((x) => !x)}`;
      ciz();
      duyur(`${m.tekrar} · ${sonuc.yerinde} ${m.yerinde}`);
    } else if (s.format === 'gruplama') {
      t.kontrol++;
      const sonuc = gruplamaDegerlendir(t.yer, s.ogeler.map((o) => o.grup));
      if (sonuc.tamam) return bitir(true);
      sonuc.dogru.forEach((d, k) => { if (d) t.sabit[k] = true; });
      for (const k of sonuc.yanlis) t.yer[k] = -1;
      if (t.kontrol >= EN_COK_KONTROL) return bitir(false);
      odak = `c${t.sira.find((x) => t.yer[x] < 0)}`;
      ciz();
      duyur(m.tekrar);
    } else {
      t.kontrol++;
      if (t.cevap.every((c, k) => c === k)) return bitir(true);
      const { cevap } = yanlisCiftleriBosalt(t.cevap);
      t.cevap.forEach((c, k) => { if (c !== null && c === k) t.sabit[k] = true; });
      t.cevap = cevap;
      if (t.kontrol >= EN_COK_KONTROL) return bitir(false);
      odak = `l${t.cevap.findIndex((c) => c === null)}`;
      ciz();
      duyur(m.tekrar);
    }
  }

  function bitir(cozuldu: boolean) {
    const s = t.soru;
    t.cozuldu = cozuldu;
    if (!cozuldu) {
      // Cevap gösterilir: doğru düzen ekrana gelir.
      if (s.format === 'quiz' || s.format === 'gizemli') { t.secim = dogruGorunen(s); if (s.format === 'gizemli') t.acik = s.ipuclari.length; }
      else if (s.format === 'siralama') { t.dizi = t.dizi.map((_, k) => k); t.sabit = t.sabit.map(() => true); }
      else if (s.format === 'gruplama') { t.yer = s.ogeler.map((o) => o.grup); t.sabit = t.sabit.map(() => true); }
      else { t.cevap = s.ciftler.map((_, k) => k); t.sabit = t.sabit.map(() => true); }
    } else if (s.format === 'quiz' || s.format === 'gizemli') t.secim = dogruGorunen(s);
    const p = s.format === 'gizemli' ? gizemliPuani(t.acik, cozuldu) : turPuani(t.kontrol, cozuldu);
    t.puan = p;
    puanlar.push(p);
    evre = 'geri';
    odak = 'sonraki';
    ciz();
    const ilk = cozuldu ? `✓ ${m.dogru}.` : `${m.birlikteOgrendik}. ${m.dogruGosterildi}`;
    duyur(`${ilk} ${p > 0 ? doldur(m.puanArtti, { n: p }) : m.puanYok} ${m.ortakPuan}: ${toplam()}.`);
  }

  function sonraki() {
    if (evre !== 'geri') return;
    if (i + 1 < turlar.length) return turuAc(i + 1);
    evre = 'son';
    odak = 'baslik';
    ciz();
    duyur(`${m.sonBaslik} ${m.sonPuan}: ${toplam()}. ${bantMetni()}`);
  }

  const bantMetni = (): string => ({ ilk: m.bantIlk, orta: m.bantOrta, yuksek: m.bantYuksek })[bant(toplam(), turlar.length)];

  function sonEkran() {
    sahne.append(e('h2', 'ya-soru', m.sonBaslik, { tabindex: '-1', 'data-odak': 'baslik' }));
    const kutu = e('div', 'ya-son');
    kutu.append(e('p', 'ya-son-ad', m.sonPuan), e('p', 'ya-son-sayi', String(toplam())), e('p', 'ya-bant', bantMetni()));
    const eylem = e('div', 'ya-cubuk');
    const ayni = dugme('dugme birincil ya-dugme', m.ayniOyun, { 'data-odak': 'ayni' });
    const yeni = dugme('dugme ikincil ya-dugme', m.yeniOyun, { 'data-odak': 'yeni' });
    ayni.addEventListener('click', () => basla());
    yeni.addEventListener('click', () => { location.hash = ayarYaz({ ...ayar, tohum: Math.floor(Math.random() * 0xffffffff).toString(36) }); });
    eylem.append(ayni, yeni);
    sahne.append(kutu, eylem);
  }

  /* ——— Olaylar ——— */
  kontrolD.addEventListener('click', kontrolEt);
  sonrakiD.addEventListener('click', sonraki);
  ipucuD.addEventListener('click', () => {
    const s = t.soru;
    if (evre !== 'soru' || s.format !== 'gizemli' || t.acik >= s.ipuclari.length) return;
    t.acik++;
    odak = t.acik < s.ipuclari.length ? 'ipucu' : 'k' + ilkSecenek(s.secenekler.length);
    ciz();
    duyur(m.yeniIpucu);
  });
  const tamEkranDegistir = () => {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };
  tamD.addEventListener('click', tamEkranDegistir);
  document.addEventListener('fullscreenchange', () => { tamD.textContent = document.fullscreenElement ? m.tamEkranKapat : m.tamEkran; });

  sahne.addEventListener('click', (o) => {
    const hedef = (o.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!hedef || hedef.disabled || evre !== 'soru') return;
    const s = t.soru;
    if (hedef.dataset.k !== undefined) {
      t.secim = Number(hedef.dataset.k);
      odak = `k${t.secim}`;
      ciz();
    } else if (hedef.hasAttribute('data-yukari') || hedef.hasAttribute('data-asagi')) {
      const pos = Number(hedef.closest<HTMLElement>('[data-pos]')?.dataset.pos);
      siraTasi(pos, hedef.hasAttribute('data-yukari') ? -1 : 1, hedef.hasAttribute('data-yukari') ? 'y' : 'a');
    } else if (s.format === 'gruplama') {
      if (hedef.dataset.kutu !== undefined) kartiKoy(Number(hedef.dataset.kutu) as 0 | 1);
      else if (hedef.dataset.i !== undefined) {
        const k = Number(hedef.dataset.i);
        if (t.yer[k] >= 0) { t.yer[k] = -1; t.kartSec = k; odak = `c${k}`; }
        else { t.kartSec = t.kartSec === k ? null : k; odak = `c${k}`; }
        ciz();
      }
    } else if (s.format === 'eslestirme') {
      if (hedef.dataset.sol !== undefined) eslestirmeTikla('sol', Number(hedef.dataset.sol));
      else if (hedef.dataset.sag !== undefined) eslestirmeTikla('sag', Number(hedef.dataset.sag));
    }
  });

  // Sıralamada satır odaktayken ↑/↓ satırı taşır.
  sahne.addEventListener('keydown', (o) => {
    const satir = (o.target as HTMLElement).closest<HTMLElement>('.ya-sira-oge');
    if (!satir || evre !== 'soru' || (o.key !== 'ArrowUp' && o.key !== 'ArrowDown') || o.altKey || o.ctrlKey || o.metaKey) return;
    o.preventDefault();
    o.stopPropagation();
    const dugmeMi = (o.target as HTMLElement).tagName === 'BUTTON';
    siraTasi(Number(satir.dataset.pos), o.key === 'ArrowUp' ? -1 : 1, dugmeMi ? ((o.target as HTMLElement).hasAttribute('data-yukari') ? 'y' : 'a') : 'r');
  });

  document.addEventListener('keydown', (o) => {
    if (o.defaultPrevented || o.altKey || o.ctrlKey || o.metaKey) return;
    const hedef = o.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(hedef.tagName) || hedef.isContentEditable) return;
    const anahtar = o.key.length === 1 ? o.key.toLowerCase() : o.key;
    const dugmedeMi = ['BUTTON', 'A', 'SUMMARY'].includes(hedef.tagName);
    if (anahtar === 'f') { o.preventDefault(); tamEkranDegistir(); return; }
    if (evre === 'geri') {
      if (anahtar === 'ArrowRight' || anahtar === 'n' || ((anahtar === 'Enter' || anahtar === ' ') && !dugmedeMi)) { o.preventDefault(); sonraki(); }
      return;
    }
    if (evre !== 'soru') return;
    const s = t.soru;
    // Seçili şıkta Enter / Boşluk: onaylar («Kontrol»); seçili değilse düğmenin kendi işi (seçmek) sürer.
    if (hedef.classList.contains('ya-sec') && hedef.getAttribute('aria-pressed') === 'true' && (anahtar === 'Enter' || anahtar === ' ')) { o.preventDefault(); if (!kontrolD.disabled) kontrolEt(); return; }
    if (s.format === 'quiz' || s.format === 'gizemli') {
      const k = '1234'.includes(anahtar) && anahtar.length === 1 ? Number(anahtar) - 1 : 'abcd'.includes(anahtar) && anahtar.length === 1 ? anahtar.charCodeAt(0) - 97 : -1;
      if (k >= 0 && k < s.secenekler.length && !t.elenen.includes(k)) { o.preventDefault(); t.secim = k; odak = `k${k}`; ciz(); return; }
    }
    if (s.format === 'gruplama' && t.kartSec !== null) {
      const g = anahtar === '1' || anahtar === 'ArrowLeft' ? 0 : anahtar === '2' || anahtar === 'ArrowRight' ? 1 : -1;
      if (g >= 0) { o.preventDefault(); kartiKoy(g as 0 | 1); return; }
    }
    if ((anahtar === 'Enter' || anahtar === ' ') && !dugmedeMi) {
      o.preventDefault();
      if (anahtar === ' ' && s.format === 'gizemli' && !ipucuD.hidden) ipucuD.click();
      else if (!kontrolD.disabled) kontrolEt();
    }
  });

  window.addEventListener('hashchange', basla);

  // Projeksiyonda ekranın sönmemesi için: destek yoksa ya da reddedilirse sessizce geçilir.
  const ekranKilidi = async () => {
    try { await (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<unknown> } }).wakeLock?.request('screen'); } catch { /* desteklenmiyor */ }
  };
  void ekranKilidi();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void ekranKilidi(); });

  basla();
}
