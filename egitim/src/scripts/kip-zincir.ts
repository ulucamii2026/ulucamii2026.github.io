/**
 * Adım 3, «Bağlayarak ezberle» (Faz 2c): birimler (âyet ya da dua bölümü) tek tek zincire eklenir. Karar mantığı
 * `src/lib/ezber/zincir.ts`'tedir (saf, testli); burası yalnız çizer. Çocuk her halkada önce dinler, sonra yeni parçaya
 * bakarak ve öncekileri ezberden okur, en sonda hepsine bakıp kendini yoklar. Sonucu çocuk kendi seçer: uygulama
 * doğruluğu ölçmez ve hocanın verdiği basamağı değiştirmez.
 */
import { baslangic, birimHali, gec, gruplar, halkalar, type BirimHali, type Durum, type Halka, type Olay } from '@ortak/lib/ezber/zincir';
import { dugme, doldur, el, kisimSecici, type Baglam, type Bolum } from './kip-ortak';

function birim(bl: Bolum, hali: BirimHali, yeni: boolean): HTMLElement {
  const p = el('p', `kip-birim${yeni ? ' yeni' : ''}${hali === 'gizli' ? ' gizli' : ''}`);
  p.dir = 'rtl';
  if (hali === 'tam') {
    p.lang = 'ar';
    p.append(bl.ar);
  } else {
    p.setAttribute('aria-hidden', 'true');
    p.append(el('span', 'cizgi c6'));
  }
  if (bl.etiket) {
    const no = el('span', 'kip-no', bl.etiket);
    no.setAttribute('aria-hidden', 'true');
    p.append(' ', no);
  }
  return p;
}

export function kur(panel: HTMLElement, b: Baglam): void {
  const { veri, ses } = b;
  const m = veri.m;
  const n = veri.bolumler.length;
  if (n < 2) {
    panel.append(el('p', 'kip-not', m.tekParca), dugme(m.gizleGec, 'dugme birincil', () => b.gec('gizle')));
    return;
  }

  const ilk = b.ayar();
  const gr = gruplar(n, ilk.boy);
  let gi = Math.min(ilk.grup, gr.length - 1);
  let sondan = ilk.sondan;
  let liste: Halka[] = [];
  let d: Durum = baslangic();
  const kurGrup = () => {
    const g = gr[gi];
    liste = halkalar(g.son - g.bas, sondan, g.bas);
    d = baslangic();
  };
  kurGrup();

  // Ses düğmeleri: aynı anda tek kayıt (kip-ortak.ts); etiket çalarken «Sesi durdur» olur.
  let sahip: HTMLButtonElement | null = null;
  let sesDugmeleri: { x: HTMLButtonElement; etiket: string }[] = [];
  ses.dinle(() => {
    for (const { x, etiket } of sesDugmeleri) x.textContent = ses.caliyor && sahip === x ? m.sesDurdur : etiket;
  });
  const sesDugmesi = (etiket: string, adresler: string[]): HTMLButtonElement => {
    const x = dugme(etiket, 'dugme ikincil', () => {
      if (ses.caliyor && sahip === x) { ses.durdur(); return; }
      sahip = x;
      ses.cal(adresler);
    });
    sesDugmeleri.push({ x, etiket });
    return x;
  };
  const adres = (i: number) => veri.bolumler[i].ses;
  const sesVar = veri.bolumler.some((x) => x.ses);

  const ayarlar = el('div', 'kip-ayarlar');
  const secici = kisimSecici(veri, gr, gi, (i) => { gi = i; kurGrup(); b.kaydet({ grup: gi }); ciz(false); });
  if (secici) ayarlar.append(secici);
  const sondanKutu = el('label', 'kip-onay');
  const sondanGirdi = el('input');
  sondanGirdi.type = 'checkbox';
  sondanGirdi.checked = sondan;
  sondanGirdi.addEventListener('change', () => { sondan = sondanGirdi.checked; kurGrup(); b.kaydet({ sondan }); ciz(false); });
  sondanKutu.append(sondanGirdi, m.sondan);
  ayarlar.append(sondanKutu);

  const halkaP = el('p', 'kip-halka');
  const noktalar = el('div', 'kip-noktalar');
  noktalar.setAttribute('aria-hidden', 'true');
  const yonerge = el('p', 'kip-yonerge');
  yonerge.setAttribute('role', 'status');
  const metin = el('div', 'kip-metin');
  const eylem = el('div', 'kip-eylem');
  const sesNot = el('p', 'kip-not', m.sesYok);
  sesNot.hidden = sesVar;

  const git = (o: Olay) => { d = gec(d, liste.length, o); ciz(true); };

  function ciz(odak: boolean) {
    ses.durdur();
    sesDugmeleri = [];
    sahip = null;
    const bitti = d.evre === 'bitti';
    const h = liste[Math.min(d.halka, liste.length - 1)];
    halkaP.textContent = doldur(m.halka, { k: bitti ? liste.length : d.halka + 1, n: liste.length });
    noktalar.replaceChildren(...liste.map((_, i) => {
      const nokta = el('span', 'nokta');
      nokta.dataset.durum = bitti || i < d.halka ? 'bitti' : i === d.halka ? 'simdi' : 'bekliyor';
      return nokta;
    }));
    yonerge.textContent = bitti ? m.bitti : d.evre === 'yeni' ? m.evreYeni : d.evre === 'sen' ? m.evreSen : m.evreKontrol;
    metin.replaceChildren(...h.kapsam.map((i) => birim(veri.bolumler[i], birimHali(i, h.yeni, d.evre), !bitti && i === h.yeni)));

    const satir: HTMLElement[] = [];
    if (d.evre === 'yeni') {
      if (adres(h.yeni)) satir.push(sesDugmesi(m.dinleYeni, [adres(h.yeni)!]));
      satir.push(dugme(m.hazirim, 'dugme birincil', () => git('hazir')));
    } else if (d.evre === 'sen') {
      satir.push(dugme(m.yenidenDinle, 'dugme ikincil', () => git('tekrar')));
      satir.push(dugme(m.kontrolEt, 'dugme birincil', () => git('kontrol')));
    } else if (d.evre === 'kontrol') {
      const adresler = h.kapsam.map(adres).filter((a): a is string => Boolean(a));
      if (adresler.length) satir.push(sesDugmesi(m.dinleHepsi, adresler));
      const grup = el('div', 'kip-sonuc');
      grup.setAttribute('role', 'group');
      grup.setAttribute('aria-label', m.nasil);
      grup.append(el('p', 'kip-soru', m.nasil));
      const dugmeler = el('div', 'kip-dugmeler');
      dugmeler.append(dugme(m.tam, 'dugme birincil', () => git('tam')), dugme(m.az, 'dugme ikincil', () => git('az')), dugme(m.tekrar, 'dugme ikincil', () => git('tekrar')));
      grup.append(dugmeler);
      satir.push(grup);
    } else {
      satir.push(dugme(m.basaDon, 'dugme ikincil', () => { kurGrup(); ciz(true); }));
      if (gi + 1 < gr.length) satir.push(dugme(m.sonrakiKisim, 'dugme ikincil', () => { gi++; kurGrup(); b.kaydet({ grup: gi }); sec(); ciz(true); }));
      satir.push(dugme(m.gizleGec, 'dugme birincil', () => b.gec('gizle')));
    }
    eylem.replaceChildren(...satir);
    if (odak) (eylem.querySelector<HTMLElement>('.birincil') ?? eylem.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
  }
  // «Sonraki kısım» düğmesi grubu değiştirince seçicideki gösterim de güncellenir.
  function sec() {
    const s = secici?.querySelector('select');
    if (s) s.value = String(gi);
  }

  ciz(false);
  panel.append(ayarlar, halkaP, noktalar, yonerge, metin, eylem, sesNot);
}
