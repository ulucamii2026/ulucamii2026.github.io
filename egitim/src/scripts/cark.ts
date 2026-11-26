/**
 * Sesli Çarkıfelek istemcisi (26 Kasım 2026): seçili Elifbâ/Tecvid/Kur'an destesinden (9 Diyanet sesli deste) veya
 * Sınıf Bilgi Soruları destesinden (5 konu, 450+ onaylı soru) rastgele madde çeker, 8 dilimli SVG çarkını `transform`
 * özniteliğiyle çevirir (CSP temiz: satır içi stil yok), ardından resmî Diyanet MP3 kaydını çalar veya şıklı soruyu açar.
 * Hiçbir veri localStorage / sessionStorage / ağa yazılmaz.
 */
import type { CarkDeste, CarkOkumaDeste, CarkSoruDeste } from '../i18n/cark';

type MaddeSatiri = [ar: string, onek: number, dosya: string, vurgu: number[][] | 0, etiket: number];
type SoruSatiri = [soru: string, secenekler: string[], dogru: number];
interface Veri {
  onek: string[];
  etiket: string[];
  desteler: Record<CarkOkumaDeste, MaddeSatiri[]>;
  soruDesteleri: Record<CarkSoruDeste, SoruSatiri[]>;
  m: Record<
    | 'kalan' | 'cevir' | 'donuyor' | 'dinle' | 'durdur' | 'yavas' | 'normal'
    | 'cevabiGoster' | 'dogruTebrik' | 'tekrarDene'
    | 'havuzBitti' | 'cikarildi' | 'sifirlandi' | 'sesHata' | 'ilkDurum',
    string
  >;
}
interface Oge {
  tur: 'okuma' | 'soru';
  indis: number;
  dilimEtiket: string;
  ar?: string;
  ses?: string;
  etiket?: string;
  soru?: string;
  secenekler?: string[];
  dogru?: number;
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
  const okumaAlan = sor<HTMLElement>('[data-okuma-alan]');
  const arEl = sor<HTMLElement>('[data-ar]');
  const etiketEl = sor<HTMLElement>('[data-etiket]');
  const soruAlan = sor<HTMLElement>('[data-soru-alan]');
  const soruMetinEl = sor<HTMLElement>('[data-soru-metin]');
  const soruSiklarEl = sor<HTMLElement>('[data-soru-siklar]');
  const cevapGosterBtn = sor<HTMLButtonElement>('[data-cevap-goster]');
  const durumEl = sor<HTMLElement>('[data-durum]');
  const dinleBtn = sor<HTMLButtonElement>('[data-dinle]');
  const dinleYazi = sor<HTMLElement>('[data-dinle-yazi]');
  const yavasBtn = sor<HTMLButtonElement>('[data-yavas]');
  const cikarBtn = sor<HTMLButtonElement>('[data-cikar]');
  const sifirlaBtn = sor<HTMLButtonElement>('[data-sifirla]');
  const desteBtnler = [...kok.querySelectorAll<HTMLButtonElement>('[data-deste]')];
  const takimPuanEls = [...kok.querySelectorAll<HTMLOutputElement>('[data-takim-puan]')];
  const takimArtiBtnler = [...kok.querySelectorAll<HTMLButtonElement>('[data-takim-arti]')];
  const takimSifirlaBtn = sor<HTMLButtonElement>('[data-takim-sifirla]');
  const m = v.m;

  let aktifDeste: CarkDeste = 'o1';
  let kalanIndisler: number[] = [];
  let gosterilenDilimler: Oge[] = [];
  let seciliOge: Oge | null = null;
  let aci = 0;
  let donuyor = false;
  let yavas = false;
  let takimPuanlari = [0, 0];

  const isSoruDestesi = (kod: CarkDeste): kod is CarkSoruDeste => kod.startsWith('s-');
  const desteUzunlugu = (kod: CarkDeste): number =>
    isSoruDestesi(kod) ? (v.soruDesteleri[kod]?.length ?? 0) : (v.desteler[kod]?.length ?? 0);

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

  // Web Audio tık + iniş çanı + kutlama sesi (0 depolama, 0 ağ)
  let sesCtx: AudioContext | null = null;
  const efektCal = (tur: 'tik' | 'inis' | 'dogru') => {
    if (!efektKutu.checked) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      sesCtx ??= new Ctx();
      if (sesCtx.state === 'suspended') void sesCtx.resume();
      const notalar = tur === 'tik' ? [680] : tur === 'dogru' ? [523.25, 659.25, 783.99] : [523.25, 659.25];
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

  const kisalt = (ar: string): string => {
    const parca = ar.trim().split(/\s+/);
    return parca.length <= 2 ? ar : `${parca[0]} ${parca[1]}…`;
  };

  const ogeGetir = (kod: CarkDeste, indis: number): Oge | null => {
    if (isSoruDestesi(kod)) {
      const satir = v.soruDesteleri[kod]?.[indis];
      if (!satir) return null;
      return {
        tur: 'soru',
        indis,
        dilimEtiket: `? ${indis + 1}`,
        soru: satir[0],
        secenekler: satir[1],
        dogru: satir[2],
      };
    }
    const satir = v.desteler[kod]?.[indis];
    if (!satir) return null;
    return {
      tur: 'okuma',
      indis,
      dilimEtiket: kisalt(satir[0]),
      ar: satir[0],
      ses: v.onek[satir[1]] + satir[2],
      etiket: v.etiket[satir[4]] ?? '',
    };
  };

  const cevabiAc = (o: Oge) => {
    if (o.tur !== 'soru') return;
    [...soruSiklarEl.querySelectorAll<HTMLButtonElement>('button')].forEach((b) => {
      const idx = Number(b.dataset.sikIdx);
      b.dataset.durum = idx === o.dogru ? 'dogru' : 'elendi';
      b.disabled = true;
    });
    cevapGosterBtn.disabled = true;
  };

  const sonucYaz = (o: Oge | null) => {
    seciliOge = o;
    if (!o) {
      okumaAlan.hidden = false;
      soruAlan.hidden = true;
      arEl.textContent = '—';
      arEl.removeAttribute('data-uzun');
      etiketEl.textContent = '';
      dinleBtn.disabled = true;
      cikarBtn.disabled = true;
      return;
    }
    if (o.tur === 'soru') {
      okumaAlan.hidden = true;
      soruAlan.hidden = false;
      soruMetinEl.textContent = o.soru ?? '';
      soruSiklarEl.replaceChildren();
      (o.secenekler ?? []).forEach((metin, k) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ck-soru-sik';
        btn.dataset.k = String(k % 4);
        btn.dataset.sikIdx = String(k);
        btn.textContent = `${['A', 'B', 'C', 'D'][k % 4]}. ${metin}`;
        btn.addEventListener('click', () => {
          if (k === o.dogru) {
            efektCal('dogru');
            durumEl.textContent = m.dogruTebrik;
            cevabiAc(o);
          } else {
            btn.dataset.durum = 'elendi';
            btn.disabled = true;
            durumEl.textContent = m.tekrarDene;
          }
        });
        li.appendChild(btn);
        soruSiklarEl.appendChild(li);
      });
      cevapGosterBtn.disabled = false;
      cikarBtn.disabled = !kalanIndisler.includes(o.indis);
      return;
    }
    okumaAlan.hidden = false;
    soruAlan.hidden = true;
    const ar = o.ar ?? '';
    arEl.textContent = ar;
    if (ar.length > 14) arEl.setAttribute('data-uzun', '1');
    else arEl.removeAttribute('data-uzun');
    etiketEl.textContent = o.etiket ?? '';
    dinleBtn.disabled = false;
    cikarBtn.disabled = !kalanIndisler.includes(o.indis);
  };

  const carkCiz = (ornekOge?: Oge) => {
    const kaynak = kalanIndisler.map((i) => ogeGetir(aktifDeste, i)!).filter(Boolean);
    const toplam = desteUzunlugu(aktifDeste);
    if (!kaynak.length) {
      gosterilenDilimler = [];
      govde.replaceChildren();
      const bos = svgOge('circle', { cx: '200', cy: '200', r: '186', fill: '#E3D5BD', stroke: '#2B1B14', 'stroke-width': '2.5' });
      govde.appendChild(bos);
      govde.setAttribute('transform', 'rotate(0 200 200)');
      aci = 0;
      cevirBtn.disabled = true;
      sayac.textContent = doldur(m.kalan, { n: 0, m: toplam });
      return;
    }
    const karisik = [...kaynak];
    for (let i = karisik.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [karisik[i], karisik[j]] = [karisik[j], karisik[i]];
    }
    const dilimler = karisik.slice(0, 8);
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
      const yazi = svgOge('text', {
        x: '200',
        y: n === 1 ? '100' : '76',
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        class: 'ck-dilim-yazi',
        transform: `rotate(${dAci.toFixed(2)} 200 200)`,
      });
      if (o.tur === 'soru') yazi.setAttribute('data-soru', '1');
      else if (o.dilimEtiket.length > 7) yazi.setAttribute('data-uzun', '1');
      yazi.textContent = o.dilimEtiket;
      g.appendChild(yazi);
      govde.appendChild(g);
    });
    cevirBtn.disabled = false;
    sayac.textContent = doldur(m.kalan, { n: kalanIndisler.length, m: toplam });
  };

  const desteKur = (kod: CarkDeste) => {
    durdur();
    aktifDeste = kod;
    desteBtnler.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deste === kod)));
    const len = desteUzunlugu(kod);
    kalanIndisler = Array.from({ length: len }, (_, i) => i);
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
      efektCal('inis');
      if (hedef.tur === 'okuma') {
        durumEl.textContent = hedef.etiket ?? '';
        if (hedef.ses) diyanetCal(hedef.ses);
      } else {
        durumEl.textContent = m.ilkDurum;
      }
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
    else if (seciliOge?.tur === 'okuma' && seciliOge.ses) diyanetCal(seciliOge.ses);
  });

  yavasBtn.addEventListener('click', () => {
    yavas = !yavas;
    yavasBtn.setAttribute('aria-pressed', String(yavas));
    yavasBtn.textContent = yavas ? m.normal : m.yavas;
    ses.defaultPlaybackRate = ses.playbackRate = yavas ? 0.8 : 1;
  });

  cevapGosterBtn.addEventListener('click', () => {
    if (seciliOge?.tur === 'soru') {
      cevabiAc(seciliOge);
      durumEl.textContent = seciliOge.secenekler?.[seciliOge.dogru ?? 0] ?? '';
    }
  });

  cikarBtn.addEventListener('click', () => {
    if (donuyor || !seciliOge) return;
    kalanIndisler = kalanIndisler.filter((x) => x !== seciliOge!.indis);
    cikarBtn.disabled = true;
    carkCiz();
    durumEl.textContent = kalanIndisler.length ? m.cikarildi : m.havuzBitti;
  });

  sifirlaBtn.addEventListener('click', () => {
    if (donuyor) return;
    const len = desteUzunlugu(aktifDeste);
    kalanIndisler = Array.from({ length: len }, (_, i) => i);
    carkCiz(seciliOge ?? undefined);
    cikarBtn.disabled = !seciliOge;
    durumEl.textContent = m.sifirlandi;
  });

  const takimCiz = () => {
    takimPuanEls.forEach((el) => {
      const idx = Number(el.dataset.takimPuan);
      el.textContent = String(takimPuanlari[idx] ?? 0);
    });
  };
  takimArtiBtnler.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.takimArti);
      if (idx === 0 || idx === 1) {
        takimPuanlari[idx] += 1;
        takimCiz();
        efektCal('dogru');
      }
    });
  });
  takimSifirlaBtn.addEventListener('click', () => {
    takimPuanlari = [0, 0];
    takimCiz();
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Space') {
      if (tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault();
      cevir();
    } else if ((e.key === 'r' || e.key === 'R') && seciliOge?.tur === 'okuma' && seciliOge.ses) {
      diyanetCal(seciliOge.ses);
    }
  });

  desteKur('o1');
}
