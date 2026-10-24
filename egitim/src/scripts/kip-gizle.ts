/**
 * Adım 4, «Kademeli gizle» (Faz 2c): metin beş düzeyde adım adım gizlenir (tam → iki kelimeden biri → ilk harfler → boş →
 * işaretsiz boş). Karar mantığı `src/lib/ezber/gizleme.ts`'tedir (saf, testli); burası yalnız çizer. Gizli kelimeler
 * `aria-hidden`'dır ve odak almaz; klavye ve ekran okuyucu kullanıcısı «İpucu» ve «Kelimeyi aç» düğmeleriyle çalışır,
 * canlı bölge yalnız sayıyı ve sonucu söyler (gizli kelimenin kendisini değil). Düzey ve seri bu cihazda hatırlanır.
 * «Dinleyici kipi»: okuyan kişiyi izleyen yetişkin ilk harflere bakar, takılınca «Takıldı»ya basar.
 */
import { acikSayisi, bir_adim_ac, cizgiBoyu, gorunumler, ilerle, ilkHarf, isaretGoster, kelimeler, sonrakiGizli, takildi, tamamlandi, SEVIYELER, type Acilma, type Gorunum, type Seviye, type Sonuc } from '@ortak/lib/ezber/gizleme';
import { gruplar } from '@ortak/lib/ezber/zincir';
import { birimAdi, doldur, dugme, el, kisimSecici, type Baglam } from './kip-ortak';

function kelimeEl(w: string, hal: Gorunum, bolum: number, sira: number): HTMLElement {
  if (hal === 'tam') return el('span', 'kelime', w);
  const s = el('span', `kelime gizli ${hal}`);
  s.dataset.b = String(bolum);
  s.dataset.j = String(sira);
  s.setAttribute('aria-hidden', 'true');
  if (hal === 'ilk') s.append(ilkHarf(w));
  s.append(el('span', `cizgi c${cizgiBoyu(w)}`));
  return s;
}

export function kur(panel: HTMLElement, b: Baglam): void {
  const { veri, ses } = b;
  const m = veri.m;
  const n = veri.bolumler.length;
  const ay = b.ayar();
  let seviye: Seviye = ay.seviye;
  let seri = ay.seri;
  let dinleyici = ay.dinleyici;
  const gr = gruplar(n, ay.boy);
  let gi = Math.min(ay.grup, gr.length - 1);
  const kel = veri.bolumler.map((x) => kelimeler(x.ar));
  let acilma: Acilma[][] = kel.map((k) => k.map(() => 0 as Acilma));
  let konum = gr[gi].bas;
  let basis = 0;
  const etkin = (): Seviye => (dinleyici ? 2 : seviye);
  const kaydet = () => b.kaydet({ seviye, seri, dinleyici, grup: gi });
  const sifirlaAcilma = () => { acilma = kel.map((k) => k.map(() => 0 as Acilma)); };

  const ayarlar = el('div', 'kip-ayarlar');
  const secici = kisimSecici(veri, gr, gi, (i) => {
    gi = i; konum = gr[gi].bas; basis = 0; sifirlaAcilma(); kaydet(); ciz();
  });
  if (secici) ayarlar.append(secici);

  const seviyeKutu = el('div', 'kip-seviye-kutu');
  const seviyeGrup = el('div', 'kip-seviye');
  seviyeGrup.setAttribute('role', 'group');
  seviyeGrup.setAttribute('aria-label', m.seviye);
  const seviyeDugmeleri = SEVIYELER.map((s) => {
    const x = dugme(String(s), 'secim kip-seviye-dugme', () => {
      seviye = s; seri = 0; sifirlaAcilma(); kaydet(); ciz(); mesaj('');
    });
    x.setAttribute('aria-label', `${m.seviye} ${s}: ${m.seviyeler[s]}`);
    return x;
  });
  seviyeGrup.append(...seviyeDugmeleri);
  const seviyeSatiri = el('p', 'kip-seviye-satiri');
  seviyeKutu.append(seviyeGrup, seviyeSatiri);

  const dinleyiciDugmesi = dugme(m.dinleyici, 'secim', () => {
    dinleyici = !dinleyici; konum = gr[gi].bas; basis = 0; sifirlaAcilma(); kaydet(); ciz(); mesaj('');
  });
  const dinleyiciNot = el('p', 'kip-not', m.dinleyiciAciklama);
  const araclar = el('div', 'kip-araclar');
  araclar.append(dinleyiciDugmesi);

  const sayac = el('p', 'kip-sayac');
  const metin = el('div', 'kip-metin');
  const eylem = el('div', 'kip-eylem');
  const sonucKutu = el('div', 'kip-sonuc');
  sonucKutu.setAttribute('role', 'group');
  sonucKutu.setAttribute('aria-label', m.nasil);
  const sonucDugmeleri = el('div', 'kip-dugmeler');
  const sonuc = (s: Sonuc) => {
    const once = seviye;
    const yeni = ilerle({ seviye, seri }, s);
    seviye = yeni.seviye; seri = yeni.seri;
    const ileti = seviye > once ? doldur(m.seviyeYukseldi, { d: seviye, ad: m.seviyeler[seviye] })
      : seviye < once ? doldur(m.seviyeDustu, { d: seviye, ad: m.seviyeler[seviye] })
      : s !== 'tam' ? m.seviyeAyni
      : tamamlandi(yeni) ? m.tamamlandi : doldur(m.seriArtti, { s: seri });
    sifirlaAcilma(); kaydet(); b.calistim(); ciz(); mesaj(ileti);
  };
  sonucDugmeleri.append(dugme(m.tam, 'dugme birincil', () => sonuc('tam')), dugme(m.az, 'dugme ikincil', () => sonuc('az')), dugme(m.tekrar, 'dugme ikincil', () => sonuc('tekrar')));
  sonucKutu.append(el('p', 'kip-soru', m.nasil), sonucDugmeleri);

  const durum = el('p', 'kip-durum');
  durum.setAttribute('role', 'status');
  const mesaj = (s: string) => { durum.textContent = s; };

  const ipucuDugmesi = dugme(m.ipucu, 'dugme ikincil', () => ac(false));
  const acDugmesi = dugme(m.kelimeAc, 'dugme ikincil', () => ac(true));
  const gizleDugmesi = dugme(m.yenidenGizle, 'dugme ikincil', () => { sifirlaAcilma(); ciz(); mesaj(''); });
  const takildiDugmesi = dugme(m.takildi, 'dugme birincil', () => {
    const bl = veri.bolumler[konum];
    const ip = takildi(basis, kel[konum].length, Boolean(bl.ses));
    basis++;
    if (ip.tur === 'ses' && bl.ses) { ses.cal([bl.ses]); return; }
    if (ip.tur === 'kelime') {
      const j = sonrakiGizli(gorunumler(kel[konum].length, 2, acilma[konum]));
      if (j >= 0) { acilma[konum][j] = 2; ciz(); }
    }
  });
  const sonrakiDugmesi = dugme('', 'dugme ikincil', () => {
    if (konum + 1 >= gr[gi].son) return;
    konum++; basis = 0; ciz();
  });

  /** Gruptaki ilk açık olmayan kelimeyi bir adım (ipucu) ya da tamamen (kelimeyi aç) açar. */
  function ac(tam: boolean) {
    const g = gr[gi];
    const sev = etkin();
    for (let i = g.bas; i < g.son; i++) {
      const j = sonrakiGizli(gorunumler(kel[i].length, sev, acilma[i]));
      if (j < 0) continue;
      acilma[i][j] = tam ? 2 : bir_adim_ac(acilma[i][j]);
      ciz();
      return;
    }
  }

  // Kelimeye dokunmak da onu bir adım açar (fare ve dokunma); klavye için yukarıdaki düğmeler var.
  metin.addEventListener('click', (e) => {
    const s = (e.target as Element).closest<HTMLElement>('.kelime.gizli');
    if (!s) return;
    const i = Number(s.dataset.b);
    const j = Number(s.dataset.j);
    acilma[i][j] = bir_adim_ac(acilma[i][j]);
    ciz();
  });

  function ciz() {
    ses.durdur();
    const g = gr[gi];
    const sev = etkin();
    let acik = 0;
    let toplam = 0;
    let gizliVar = false;
    const paragraflar: HTMLElement[] = [];
    for (let i = g.bas; i < g.son; i++) {
      const h = gorunumler(kel[i].length, sev, acilma[i]);
      acik += acikSayisi(h);
      toplam += h.length;
      if (h.some((x) => x !== 'tam')) gizliVar = true;
      const p = el('p', `kip-birim${dinleyici && i === konum ? ' simdiki' : ''}`);
      p.lang = 'ar';
      p.dir = 'rtl';
      h.forEach((hal, j) => {
        if (j) p.append(' ');
        p.append(kelimeEl(kel[i][j], hal, i, j));
      });
      if (isaretGoster(sev) && veri.bolumler[i].etiket) {
        const no = el('span', 'kip-no', veri.bolumler[i].etiket);
        no.setAttribute('aria-hidden', 'true');
        p.append(' ', no);
      }
      paragraflar.push(p);
    }
    metin.replaceChildren(...paragraflar);
    sayac.textContent = doldur(m.acik, { a: acik, n: toplam });
    seviyeDugmeleri.forEach((x, s) => x.setAttribute('aria-pressed', String(s === seviye)));
    seviyeSatiri.textContent = doldur(m.seviyeDurum, { d: seviye, ad: m.seviyeler[seviye], s: seri });
    dinleyiciDugmesi.setAttribute('aria-pressed', String(dinleyici));
    dinleyiciNot.hidden = !dinleyici;
    seviyeKutu.hidden = dinleyici;
    sonucKutu.hidden = dinleyici;
    ipucuDugmesi.hidden = dinleyici;
    acDugmesi.hidden = dinleyici;
    takildiDugmesi.hidden = !dinleyici;
    sonrakiDugmesi.hidden = !dinleyici;
    ipucuDugmesi.disabled = !gizliVar;
    acDugmesi.disabled = !gizliVar;
    sonrakiDugmesi.disabled = konum + 1 >= g.son;
    sonrakiDugmesi.textContent = doldur(m.sonrakiBirim, { birim: birimAdi(veri), n: veri.bolumler[Math.min(konum + 1, g.son - 1)].no });
  }

  eylem.append(ipucuDugmesi, acDugmesi, gizleDugmesi, takildiDugmesi, sonrakiDugmesi);
  ciz();
  panel.append(ayarlar, seviyeKutu, araclar, dinleyiciNot, sayac, metin, eylem, sonucKutu, durum);
}
