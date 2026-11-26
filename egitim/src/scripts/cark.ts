/**
 * Sesli Çarkıfelek istemcisi (26 Kasım 2026): sınıf tahtasında veya telefonda seçili Elifbâ/Tecvid/Kur'an destesinden rastgele madde çeker,
 * 8 dilimli SVG çarkını `transform` özniteliğiyle çevirir (CSP temiz: satır içi stil yok), ardından resmî Diyanet MP3 kaydını çalar.
 * Hiçbir veri localStorage / sessionStorage / ağa yazılmaz.
 */
import type { CarkDeste } from '../i18n/cark';

type MaddeSatiri = [ar: string, onek: number, dosya: string, vurgu: number[][] | 0, etiket: number];
interface Veri {
  onek: string[];
  etiket: string[];
  desteler: Record<CarkDeste, MaddeSatiri[]>;
  m: Record<'kalan' | 'cevir' | 'donuyor' | 'dinle' | 'durdur' | 'yavas' | 'normal' | 'havuzBitti' | 'cikarildi' | 'sifirlandi' | 'sesHata' | 'ilkDurum', string>;
}
interface Oge {
  indis: number;
  ar: string;
  ses: string;
  etiket: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const RENKLER = ['#9B2C22', '#1F4E8C', '#1E6B52', '#B56D0A', '#0E6375', '#6E2B62', '#C04D1F', '#295B9E'] as const;

const kok = document.querySelector<HTMLElement>('[data-cark]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* sunucu HTML'i yine görünür kalır */
  }
}

const doldur = (s: string, d: Record<string, string | number>): string =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));

function svgOge<K extends keyof SVGElementTagNameMap>(ad: K, oz: Record<string, string> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, ad);
  for (const [k, v] of Object.entries(oz)) el.setAttribute(k, v);
  return el;
}

function dilimYolu(i: number, n: number): string {
  if (n === 1) return 'M 200 14 A 186 186 0 1 1 199.9 14 Z';
  const step = (2 * Math.PI) / n;
  const a0 = -Math.PI / 2 - step / 2 + i * step;
  const a1 = a0 + step;
  const r = 186;
  const x0 = 200 + r * Math.cos(a0);
  const y0 = 200 + r * Math.sin(a0);
  const x1 = 200 + r * Math.cos(a1);
  const y1 = 200 + r * Math.sin(a1);
  const large = step > Math.PI ? 1 : 0;
  return `M 200 200 L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function kur(kok: HTMLElement, v: Veri): void {
  const sor = <T extends Element>(s: string): T => kok.querySelector<T>(s)!;
  const govde = sor<SVGGElement>('[data-cark-govde]');
  const sayac = sor<HTMLElement>('[data-sayac]');
  const cevirBtn = sor<HTMLButtonElement>('[data-cevir]');
  const efektKutu = sor<HTMLInputElement>('[data-efekt]');
  const arEl = sor<HTMLElement>('[data-ar]');
  const etiketEl = sor<HTMLElement>('[data-etiket]');
  const durumEl = sor<HTMLElement>('[data-durum]');
  const dinleBtn = sor<HTMLButtonElement>('[data-dinle]');
  const dinleYazi = sor<HTMLElement>('[data-dinle-yazi]');
  const yavasBtn = sor<HTMLButtonElement>('[data-yavas]');
  const cikarBtn = sor<HTMLButtonElement>('[data-cikar]');
  const sifirlaBtn = sor<HTMLButtonElement>('[data-sifirla]');
  const desteBtnler = [...kok.querySelectorAll<HTMLButtonElement>('[data-deste]')];
  const m = v.m;

  let aktifDeste: CarkDeste = 'o1';
  let kalanIndisler: number[] = [];
  let gosterilenDilimler: Oge[] = [];
  let seciliOge: Oge | null = null;
  let aci = 0;
  let donuyor = false;
  let yavas = false;

  // Resmî Diyanet ses çaları (yalnız src üzerinden)
  const ses = new Audio();
  ses.preload = 'none';
  let caliyor = false;

  const dugmeDurum = (dur: boolean) => {
    caliyor = dur;
    dinleBtn.toggleAttribute('data-caliyor', dur);
    dinleYazi.textContent = dur ? m.durdur : m.dinle;
  };
  const durdur = () => {
    ses.pause();
    dugmeDurum(false);
  };
  const diyanetCal = (url: string) => {
    if (!url) return;
    ses.src = url;
    ses.defaultPlaybackRate = ses.playbackRate = yavas ? 0.8 : 1;
    dugmeDurum(true);
    ses.play().catch((e: unknown) => {
      if ((e as { name?: string })?.name === 'AbortError') return;
      dugmeDurum(false);
      // Otomatik çalma engellenirse kullanıcı «Diyanet sesiyle dinle»ye basabilir
      if (e instanceof Error && e.name !== 'NotAllowedError') {
        durumEl.textContent = m.sesHata;
      }
    });
  };
  ses.addEventListener('ended', () => dugmeDurum(false));
  ses.addEventListener('error', () => {
    if (caliyor) {
      dugmeDurum(false);
      durumEl.textContent = m.sesHata;
    }
  });

  // Web Audio tık + iniş çanı (0 depolama, 0 ağ)
  let sesCtx: AudioContext | null = null;
  const efektCal = (tur: 'tik' | 'inis') => {
    if (!efektKutu.checked) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      sesCtx ??= new Ctx();
      if (sesCtx.state === 'suspended') void sesCtx.resume();
      const notalar = tur === 'tik' ? [680] : [523.25, 659.25];
      notalar.forEach((f, idx) => {
        if (!sesCtx) return;
        const osc = sesCtx.createOscillator();
        const gain = sesCtx.createGain();
        const t0 = sesCtx.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t0);
        gain.gain.setValueAtTime(tur === 'tik' ? 0.03 : 0.055, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + (tur === 'tik' ? 0.04 : 0.22));
        osc.connect(gain);
        gain.connect(sesCtx.destination);
        osc.start(t0);
        osc.stop(t0 + (tur === 'tik' ? 0.05 : 0.24));
      });
    } catch {
      /* ses efektini desteklemeyen ortamda sessiz kal */
    }
  };

  const ogeGetir = (kod: CarkDeste, indis: number): Oge | null => {
    const satir = v.desteler[kod]?.[indis];
    if (!satir) return null;
    return { indis, ar: satir[0], ses: v.onek[satir[1]] + satir[2], etiket: v.etiket[satir[4]] ?? '' };
  };

  const kisalt = (ar: string): string => {
    const parca = ar.trim().split(/\s+/);
    return parca.length <= 2 ? ar : `${parca[0]} ${parca[1]}…`;
  };

  const sonucYaz = (o: Oge | null) => {
    seciliOge = o;
    if (!o) {
      arEl.textContent = '—';
      arEl.removeAttribute('data-uzun');
      etiketEl.textContent = '';
      dinleBtn.disabled = true;
      cikarBtn.disabled = true;
      return;
    }
    arEl.textContent = o.ar;
    if (o.ar.length > 14) arEl.setAttribute('data-uzun', '1');
    else arEl.removeAttribute('data-uzun');
    etiketEl.textContent = o.etiket;
    dinleBtn.disabled = false;
    cikarBtn.disabled = !kalanIndisler.includes(o.indis);
  };

  const carkCiz = (ornekOge?: Oge) => {
    const kaynak = kalanIndisler.map((i) => ogeGetir(aktifDeste, i)!).filter(Boolean);
    if (!kaynak.length) {
      gosterilenDilimler = [];
      govde.replaceChildren();
      const bos = svgOge('circle', { cx: '200', cy: '200', r: '186', fill: '#E3D5BD', stroke: '#2B1B14', 'stroke-width': '2.5' });
      govde.appendChild(bos);
      govde.setAttribute('transform', 'rotate(0 200 200)');
      aci = 0;
      cevirBtn.disabled = true;
      sayac.textContent = doldur(m.kalan, { n: 0, m: v.desteler[aktifDeste].length });
      return;
    }
    // Çarkta en fazla 8 dilim göster: hedef öğe varsa ilk dilimlerden birine yerleştir
    const karisik = [...kaynak];
    for (let i = karisik.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [karisik[i], karisik[j]] = [karisik[j], karisik[i]];
    }
    let dilimler = karisik.slice(0, 8);
    if (ornekOge && !dilimler.some((x) => x.indis === ornekOge.indis)) {
      dilimler[0] = ornekOge;
    }
    gosterilenDilimler = dilimler;
    govde.replaceChildren();
    const n = dilimler.length;
    dilimler.forEach((o, i) => {
      const g = svgOge('g');
      g.appendChild(svgOge('path', {
        d: dilimYolu(i, n),
        fill: RENKLER[i % RENKLER.length],
        stroke: '#FFFAF0',
        'stroke-width': '2.5',
      }));
      const dAci = (360 / n) * i;
      const yaziMetin = kisalt(o.ar);
      const yazi = svgOge('text', {
        x: '200',
        y: n === 1 ? '100' : '76',
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        class: 'ck-dilim-yazi',
        transform: `rotate(${dAci.toFixed(2)} 200 200)`,
      });
      if (yaziMetin.length > 7) yazi.setAttribute('data-uzun', '1');
      yazi.textContent = yaziMetin;
      g.appendChild(yazi);
      govde.appendChild(g);
    });
    cevirBtn.disabled = false;
    sayac.textContent = doldur(m.kalan, { n: kalanIndisler.length, m: v.desteler[aktifDeste].length });
  };

  const desteKur = (kod: CarkDeste) => {
    durdur();
    aktifDeste = kod;
    desteBtnler.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deste === kod)));
    kalanIndisler = (v.desteler[kod] ?? []).map((_, i) => i);
    const ilk = ogeGetir(kod, 0);
    carkCiz(ilk ?? undefined);
    aci = 0;
    govde.setAttribute('transform', 'rotate(0 200 200)');
    sonucYaz(ilk);
    durumEl.textContent = m.ilkDurum;
  };

  const cevir = () => {
    if (donuyor) return;
    if (!kalanIndisler.length) {
      durumEl.textContent = m.havuzBitti;
      return;
    }
    durdur();
    donuyor = true;
    cevirBtn.disabled = true;
    cevirBtn.textContent = m.donuyor;
    durumEl.textContent = m.donuyor;

    const rastgele = kalanIndisler[Math.floor(Math.random() * kalanIndisler.length)];
    const hedef = ogeGetir(aktifDeste, rastgele)!;
    carkCiz(hedef);
    const dilimIndisi = gosterilenDilimler.findIndex((x) => x.indis === hedef.indis);
    const dilimAci = 360 / gosterilenDilimler.length;
    // Dilim i merkezi saat 12 yönüne göre (i * dilimAci) açısındadır; tepe oku saat 12 (0°)'dedir.
    const hedefMod = ((360 - dilimIndisi * dilimAci) % 360 + 360) % 360;
    const basAci = aci;
    const suAnkiMod = ((basAci % 360) + 360) % 360;
    const kalanFark = ((hedefMod - suAnkiMod) % 360 + 360) % 360;
    const bitisAci = basAci + 4 * 360 + kalanFark;

    const azalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bitir = () => {
      aci = bitisAci;
      govde.setAttribute('transform', `rotate(${aci.toFixed(2)} 200 200)`);
      donuyor = false;
      cevirBtn.disabled = false;
      cevirBtn.textContent = m.cevir;
      sonucYaz(hedef);
      durumEl.textContent = `${hedef.etiket}`;
      efektCal('inis');
      diyanetCal(hedef.ses);
    };

    if (azalt) {
      bitir();
      return;
    }

    const sure = 2100;
    const t0 = performance.now();
    let sonTik = Math.floor(basAci / dilimAci);
    const adim = (simdi: number) => {
      const p = Math.min(1, (simdi - t0) / sure);
      const e = 1 - Math.pow(1 - p, 3);
      aci = basAci + (bitisAci - basAci) * e;
      govde.setAttribute('transform', `rotate(${aci.toFixed(2)} 200 200)`);
      const tik = Math.floor(aci / dilimAci);
      if (tik !== sonTik) {
        sonTik = tik;
        efektCal('tik');
      }
      if (p < 1) requestAnimationFrame(adim);
      else bitir();
    };
    requestAnimationFrame(adim);
  };

  desteBtnler.forEach((b) => {
    b.addEventListener('click', () => {
      if (donuyor) return;
      const kod = b.dataset.deste as CarkDeste | undefined;
      if (kod) desteKur(kod);
    });
  });

  cevirBtn.addEventListener('click', cevir);

  dinleBtn.addEventListener('click', () => {
    if (caliyor) durdur();
    else if (seciliOge) diyanetCal(seciliOge.ses);
  });

  yavasBtn.addEventListener('click', () => {
    yavas = !yavas;
    yavasBtn.setAttribute('aria-pressed', String(yavas));
    yavasBtn.textContent = yavas ? m.normal : m.yavas;
    ses.defaultPlaybackRate = ses.playbackRate = yavas ? 0.8 : 1;
  });

  cikarBtn.addEventListener('click', () => {
    if (donuyor || !seciliOge) return;
    kalanIndisler = kalanIndisler.filter((x) => x !== seciliOge!.indis);
    cikarBtn.disabled = true;
    if (!kalanIndisler.length) {
      carkCiz();
      durumEl.textContent = m.havuzBitti;
    } else {
      carkCiz();
      durumEl.textContent = m.cikarildi;
    }
  });

  sifirlaBtn.addEventListener('click', () => {
    if (donuyor) return;
    kalanIndisler = (v.desteler[aktifDeste] ?? []).map((_, i) => i);
    carkCiz(seciliOge ?? undefined);
    cikarBtn.disabled = !seciliOge;
    durumEl.textContent = m.sifirlandi;
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Space') {
      if (tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault();
      cevir();
    } else if ((e.key === 'r' || e.key === 'R') && seciliOge) {
      diyanetCal(seciliOge.ses);
    }
  });

  desteKur('o1');
}
