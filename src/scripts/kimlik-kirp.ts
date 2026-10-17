/** İhtida formu: kimlik kartı ya da pasaport bilgi sayfası fotoğrafını karta kırpar ve dik açıya getirir (17 Eki 2026).
 *
 *  Neden: Müşavirlik paketindeki kimlik fotokopisi sayfası (public/admin/kimlik-sayfa.js) kartı gerçek boyutunda,
 *  köşeleri yuvarlatılmış olarak basar (Mühtedi Koordinatörlüğünün belge-pdf düzeni). Bunun için görüntü yalnız karttan
 *  oluşmalı. Kırpma tarayıcıda yapılır; ağa ham fotoğraf değil yalnız kart görüntüsü gider.
 *  Kenarlar renk ayrımıyla kendiliğinden aranır; kişi dört köşeyi sürükleyerek düzeltir ya da kırpmadan gönderir.
 *  🛑 Kartın üzerindeki hiçbir yazı okunmaz (OCR/MRZ yok): yalnız geometri.
 */

export type BelgeTuru = 'kimlik' | 'pasaport';
export type Nokta = [number, number];
/** Sol üst, sağ üst, sağ alt, sol alt (kaynak görüntünün pikseli). */
export type Dortgen = [Nokta, Nokta, Nokta, Nokta];
/** 300 dpi'da ISO/IEC 7810 ID-1 (85,6 × 54 mm) ve ICAO TD3 bilgi sayfası (125 × 88 mm); kimlik-sayfa.js bu oranları tanır. */
export const HEDEF: Record<BelgeTuru, [number, number]> = { kimlik: [1011, 638], pasaport: [1476, 1039] };

export interface KirpMetinleri {
  baslik: string; yardim: string; yardimPasaport: string;
  uygula: string; ham: string; vazgec: string; dondur: string; duzelt: string;
  bulundu: string; bulunamadi: string; onizleme: string;
  koseler: [string, string, string, string];
  kirpildi: string;                  // {boyut}
}

export interface Goruntu { data: Uint8ClampedArray; width: number; height: number }

/* ------------------------------------------------------------------ geometri (DOM'suz, sınanır) */

/** Birim kareyi dörtgene eşleyen izdüşüm (Heckbert): (u, v) ∈ [0,1]² → kaynak noktası. Katsayılar [a,b,c,d,e,f,g,h]. */
export function izdusum(q: Dortgen): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) return [x1 - x0, x3 - x0, x0, y1 - y0, y3 - y0, y0, 0, 0];
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h];
}

export function izdusumNokta(k: number[], u: number, v: number): Nokta {
  const w = k[6] * u + k[7] * v + 1;
  return [(k[0] * u + k[1] * v + k[2]) / w, (k[3] * u + k[4] * v + k[5]) / w];
}

/** Dörtgeni W × H dikdörtgene açar (çift doğrusal örnekleme). */
export function dogrultVeri(kaynak: Goruntu, q: Dortgen, W: number, H: number): Uint8ClampedArray<ArrayBuffer> {
  const k = izdusum(q);
  const { data, width: sw, height: sh } = kaynak;
  const cikti = new Uint8ClampedArray(W * H * 4);
  const xMax = sw - 1.001, yMax = sh - 1.001;
  for (let y = 0; y < H; y++) {
    const v = (y + 0.5) / H;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const w = k[6] * u + k[7] * v + 1;
      const fx = Math.min(xMax, Math.max(0, (k[0] * u + k[1] * v + k[2]) / w - 0.5));
      const fy = Math.min(yMax, Math.max(0, (k[3] * u + k[4] * v + k[5]) / w - 0.5));
      const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy;
      const i00 = (iy * sw + ix) * 4, i01 = i00 + sw * 4, o = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        const ust = data[i00 + c] * (1 - ax) + data[i00 + 4 + c] * ax;
        const alt = data[i01 + c] * (1 - ax) + data[i01 + 4 + c] * ax;
        cikti[o + c] = ust * (1 - ay) + alt * ay;
      }
      cikti[o + 3] = 255;
    }
  }
  return cikti;
}

const uzaklik = (a: Nokta, b: Nokta) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const alan = (q: Nokta[]) => Math.abs(q.reduce((t, p, i) => { const r = q[(i + 1) % q.length]; return t + p[0] * r[1] - r[0] * p[1]; }, 0)) / 2;

/** Köşeleri saat yönünde sol üstten başlatır; kart dik duruyorsa uzun kenarı üste alır. */
export function sirala(noktalar: Nokta[]): Dortgen {
  const cx = noktalar.reduce((t, p) => t + p[0], 0) / 4, cy = noktalar.reduce((t, p) => t + p[1], 0) / 4;
  const acili = noktalar.map(p => ({ p, a: Math.atan2(p[1] - cy, p[0] - cx) })).sort((x, y) => x.a - y.a);
  const hedef = -3 * Math.PI / 4;
  let bas = 0, enIyi = Infinity;
  acili.forEach((x, i) => { const f = Math.abs(Math.atan2(Math.sin(x.a - hedef), Math.cos(x.a - hedef))); if (f < enIyi) { enIyi = f; bas = i; } });
  let q = [0, 1, 2, 3].map(i => acili[(bas + i) % 4].p) as Dortgen;
  const yatay = (uzaklik(q[0], q[1]) + uzaklik(q[3], q[2])) / 2, dikey = (uzaklik(q[0], q[3]) + uzaklik(q[1], q[2])) / 2;
  if (dikey > yatay * 1.1) q = dondur(q);
  return q;
}

/** Çıktıyı saat yönünde 90° döndürür (sol kenar üste gelir). */
export function dondur(q: Dortgen): Dortgen { return [q[3], q[0], q[1], q[2]]; }

/** Görüntünün kenarlarından içeri pay bırakan başlangıç dörtgeni (kenar bulunamadığında). */
export function varsayilanDortgen(W: number, H: number, oran: number): Dortgen {
  let w = W * 0.84, h = w / oran;
  if (h > H * 0.84) { h = H * 0.84; w = h * oran; }
  const x0 = (W - w) / 2, y0 = (H - h) / 2;
  return [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
}

function ortanca(dizi: number[]): number {
  const s = dizi.slice().sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : 0;
}

/** Toplam en küçük kareler doğrusu: [nokta, birim yön] ya da yetersiz noktada null. */
function dogruUydur(noktalar: Nokta[]): [Nokta, Nokta] | null {
  if (noktalar.length < 8) return null;
  const mx = noktalar.reduce((t, p) => t + p[0], 0) / noktalar.length, my = noktalar.reduce((t, p) => t + p[1], 0) / noktalar.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of noktalar) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const t = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return [[mx, my], [Math.cos(t), Math.sin(t)]];
}

function kesisim(a: [Nokta, Nokta], b: [Nokta, Nokta]): Nokta | null {
  const [[x1, y1], [dx1, dy1]] = a, [[x2, y2], [dx2, dy2]] = b;
  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) < 1e-6) return null;
  const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / det;
  return [x1 + t * dx1, y1 + t * dy1];
}

/** Kartın dört köşesini arar (küçültülmüş görüntüde). Arka plan kenar halkasının ortanca renginden, kart ondan
 *  ayrışan en büyük bölgedir; köşeler ana eksenlere göre uç noktalardan bulunup kenar doğrularının kesişimiyle
 *  inceltilir. Bulamazsa null döner (kişi köşeleri elle yerleştirir). */
export function koseleriBul(g: Goruntu, oran: number = HEDEF.kimlik[0] / HEDEF.kimlik[1]): Dortgen | null {
  const { data, width: W, height: H } = g;
  if (W < 40 || H < 40) return null;
  const n = W * H;
  const halka = Math.max(2, Math.round(Math.min(W, H) * 0.03));
  const kenarlar: [number[], number[], number[]] = [[], [], []];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x >= halka && x < W - halka && y >= halka && y < H - halka) continue;
    const i = (y * W + x) * 4;
    kenarlar[0].push(data[i]); kenarlar[1].push(data[i + 1]); kenarlar[2].push(data[i + 2]);
  }
  const [zr, zg, zb] = kenarlar.map(ortanca);

  // Arka plandan renk uzaklığı → Otsu eşiği → 3×3 çoğunluk süzgeci.
  const fark = new Uint8Array(n), sayim = new Float64Array(256);
  for (let i = 0; i < n; i++) {
    const d = Math.min(255, Math.round(Math.hypot(data[i * 4] - zr, data[i * 4 + 1] - zg, data[i * 4 + 2] - zb)));
    fark[i] = d; sayim[d]++;
  }
  let toplam = 0;
  for (let i = 0; i < 256; i++) toplam += i * sayim[i];
  let wB = 0, sumB = 0, enIyi = -1, esik = 0;
  for (let t = 0; t < 256; t++) {
    wB += sayim[t]; if (!wB) continue;
    const wF = n - wB; if (!wF) break;
    sumB += t * sayim[t];
    const fark2 = wB * wF * (sumB / wB - (toplam - sumB) / wF) ** 2;
    if (fark2 > enIyi) { enIyi = fark2; esik = t; }
  }
  esik = Math.max(esik, 18);
  const ham = new Uint8Array(n);
  for (let i = 0; i < n; i++) ham[i] = fark[i] > esik ? 1 : 0;
  const maske = new Uint8Array(n);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    let s = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += ham[(y + dy) * W + x + dx];
    maske[y * W + x] = s >= 5 ? 1 : 0;
  }

  // En büyük 4-komşulu bölge.
  const etiket = new Int32Array(n), yigin = new Int32Array(n);
  let enBuyuk = 0, enBuyukEtiket = 0, sira = 0;
  for (let i = 0; i < n; i++) {
    if (!maske[i] || etiket[i]) continue;
    sira++;
    let ust = 0, boyut = 0;
    yigin[ust++] = i; etiket[i] = sira;
    while (ust) {
      const j = yigin[--ust]; boyut++;
      const x = j % W;
      for (const k of [j - W, j + W, x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1]) {
        if (k >= 0 && k < n && maske[k] && !etiket[k]) { etiket[k] = sira; yigin[ust++] = k; }
      }
    }
    if (boyut > enBuyuk) { enBuyuk = boyut; enBuyukEtiket = sira; }
  }
  if (enBuyuk < n * 0.15 || enBuyuk > n * 0.97) return null;     // küçük bölge çoğunlukla kartın üstündeki fotoğraftır

  // Dış çevre (kart dışbükeydir: satır/sütun uçları yeter) ve ana eksenler.
  const cevre: Nokta[] = [];
  let mx = 0, my = 0;
  for (let y = 0; y < H; y++) {
    let sol = -1, sag = -1;
    for (let x = 0; x < W; x++) if (etiket[y * W + x] === enBuyukEtiket) { if (sol < 0) sol = x; sag = x; mx += x; my += y; }
    if (sol >= 0) { cevre.push([sol, y]); if (sag !== sol) cevre.push([sag, y]); }
  }
  for (let x = 0; x < W; x++) {
    let ust = -1, alt = -1;
    for (let y = 0; y < H; y++) if (etiket[y * W + x] === enBuyukEtiket) { if (ust < 0) ust = y; alt = y; }
    if (ust >= 0) { cevre.push([x, ust]); if (alt !== ust) cevre.push([x, alt]); }
  }
  mx /= enBuyuk; my /= enBuyuk;
  let cxx = 0, cyy = 0, cxy = 0;
  for (const [x, y] of cevre) { cxx += (x - mx) ** 2; cyy += (y - my) ** 2; cxy += (x - mx) * (y - my); }
  const aci = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
  const u: Nokta = [Math.cos(aci), Math.sin(aci)], v: Nokta = [-Math.sin(aci), Math.cos(aci)];
  const kaba = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([a, b]) => {
    let en: Nokta = cevre[0], deger = -Infinity;
    for (const p of cevre) {
      const d = a * ((p[0] - mx) * u[0] + (p[1] - my) * u[1]) + b * ((p[0] - mx) * v[0] + (p[1] - my) * v[1]);
      if (d > deger) { deger = d; en = p; }
    }
    return en;
  });
  let q = sirala(kaba);

  // Kenar doğrularını uydur, komşu doğruların kesişimiyle köşeleri incelt (yuvarlak köşe payı).
  const kosegen = Math.hypot(W, H);
  const dogrular = q.map((a, i) => {
    const b = q[(i + 1) % 4], L = uzaklik(a, b);
    if (L < 10) return null;
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, tol = Math.max(3, L * 0.025);
    return dogruUydur(cevre.filter(p => {
      const t = ((p[0] - a[0]) * ux + (p[1] - a[1]) * uy) / L;
      return t > 0.12 && t < 0.88 && Math.abs((p[0] - a[0]) * uy - (p[1] - a[1]) * ux) < tol;
    }));
  });
  if (dogrular.every(Boolean)) {
    const ince = q.map((p, i) => kesisim(dogrular[(i + 3) % 4]!, dogrular[i]!));
    if (ince.every((p, i) => p && uzaklik(p, q[i]) < kosegen * 0.06)) q = ince as Dortgen;
  }

  // Denetim: dışbükey, yeterince büyük ve kart oranına yakın.
  const capraz = q.map((p, i) => {
    const a = q[(i + 1) % 4], b = q[(i + 2) % 4];
    return (a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0]);
  });
  if (!capraz.every(c => c > 0) && !capraz.every(c => c < 0)) return null;
  if (alan(q) < n * 0.15) return null;
  const yatay = (uzaklik(q[0], q[1]) + uzaklik(q[3], q[2])) / 2, dikey = (uzaklik(q[0], q[3]) + uzaklik(q[1], q[2])) / 2;
  const r = yatay / dikey;
  if (r < oran / 1.45 || r > oran * 1.45) return null;
  return q.map(([x, y]) => [Math.min(W, Math.max(0, x)), Math.min(H, Math.max(0, y))]) as Dortgen;
}

/* ------------------------------------------------------------------ tarayıcı */

type Kaynak = CanvasImageSource & { width: number; height: number };
const CALISMA_KENAR = 2600;          // düzeltmede kullanılan kaynak çözünürlüğü (kart ~1011 px olacak)
const ARAMA_KENAR = 480;

function tuval(w: number, h: number) {
  const t = document.createElement('canvas');
  t.width = Math.max(1, Math.round(w)); t.height = Math.max(1, Math.round(h));
  const c = t.getContext('2d', { willReadFrequently: true });
  if (!c) throw new Error('okunamadi');
  return { t, c };
}

/** Bir fotoğrafı kırpmaya hazırlar: çalışma kopyası, köşe araması. */
export function hazirla(kaynak: Kaynak, tur: BelgeTuru) {
  const s = Math.min(1, CALISMA_KENAR / Math.max(kaynak.width, kaynak.height));
  const { t, c } = tuval(kaynak.width * s, kaynak.height * s);
  c.fillStyle = '#fff'; c.fillRect(0, 0, t.width, t.height);
  c.drawImage(kaynak, 0, 0, t.width, t.height);
  const calisma: Goruntu = c.getImageData(0, 0, t.width, t.height);
  const a = Math.min(1, ARAMA_KENAR / Math.max(t.width, t.height));
  const kucuk = tuval(t.width * a, t.height * a);
  kucuk.c.drawImage(t, 0, 0, kucuk.t.width, kucuk.t.height);
  const [hw, hh] = HEDEF[tur];
  const bulunan = koseleriBul(kucuk.c.getImageData(0, 0, kucuk.t.width, kucuk.t.height), hw / hh);
  const kx = t.width / kucuk.t.width, ky = t.height / kucuk.t.height;
  const koseler = bulunan ? bulunan.map(([x, y]) => [x * kx, y * ky]) as Dortgen : null;
  return { tuval: t, calisma, koseler };
}

/** Düzeltilmiş kart görüntüsü (JPEG veri URL'i). */
export function kartGoruntusu(calisma: Goruntu, q: Dortgen, tur: BelgeTuru, olcek = 1): string {
  const [W, H] = HEDEF[tur].map(x => Math.round(x * olcek));
  const { t, c } = tuval(W, H);
  c.putImageData(new ImageData(dogrultVeri(calisma, q, W, H), W, H), 0, 0);
  let veri = t.toDataURL('image/jpeg', 0.9);
  if (veri.length > 2_800_000) veri = t.toDataURL('image/jpeg', 0.78);   // sunucu sınırı 3 MB
  return veri;
}

export type KirpKarari = { tur: 'kirp'; koseler: Dortgen } | { tur: 'ham' } | null;

/** Köşe ayarlama penceresi. Köşeler sürüklenir (dokunmatik, fare) ya da odaklanıp ok tuşlarıyla kaydırılır. */
export function kirpmaPenceresi(hazir: ReturnType<typeof hazirla>, tur: BelgeTuru, m: KirpMetinleri, onceki: Dortgen | null): Promise<KirpKarari> {
  return new Promise((coz) => {
    const oncekiOdak = document.activeElement as HTMLElement | null;
    const { tuval: kaynakTuval, calisma } = hazir;
    const SW = kaynakTuval.width, SH = kaynakTuval.height;
    const [hw, hh] = HEDEF[tur];
    let q: Dortgen = (onceki || hazir.koseler || varsayilanDortgen(SW, SH, hw / hh)).map(p => [...p]) as Dortgen;

    const pencere = document.createElement('dialog');
    pencere.className = 'kimlik-kirp';
    pencere.setAttribute('aria-labelledby', 'kimlik-kirp-baslik');
    pencere.innerHTML = `<div class="kk-ic">
      <h2 id="kimlik-kirp-baslik"></h2>
      <p class="kk-yardim" data-yardim></p>
      <p class="kk-durum" data-durum role="status"></p>
      <div class="kk-alan" data-alan><div class="kk-sahne" data-sahne>
        <canvas class="kk-resim" aria-hidden="true"></canvas>
        <svg class="kk-cizgi" aria-hidden="true"><polygon /></svg>
        <canvas class="kk-buyutec" width="120" height="120" aria-hidden="true" hidden></canvas>
      </div></div>
      <div class="kk-alt">
        <figure class="kk-onizleme"><canvas aria-hidden="true"></canvas><figcaption data-onizleme></figcaption></figure>
        <div class="kk-eylem">
          <button type="button" class="dugme dugme-ikincil" data-dondur></button>
          <button type="button" class="dugme dugme-ikincil" data-ham></button>
          <button type="button" class="dugme dugme-ikincil" data-vazgec></button>
          <button type="button" class="dugme dugme-birincil" data-uygula></button>
        </div>
      </div>
    </div>`;
    const $ = <T extends Element>(s: string) => pencere.querySelector<T>(s)!;
    $<HTMLElement>('h2').textContent = m.baslik;
    $<HTMLElement>('[data-yardim]').textContent = tur === 'pasaport' ? m.yardimPasaport : m.yardim;
    $<HTMLElement>('[data-durum]').textContent = hazir.koseler || onceki ? m.bulundu : m.bulunamadi;
    $<HTMLElement>('[data-onizleme]').textContent = m.onizleme;
    $<HTMLButtonElement>('[data-dondur]').textContent = m.dondur;
    $<HTMLButtonElement>('[data-ham]').textContent = m.ham;
    $<HTMLButtonElement>('[data-vazgec]').textContent = m.vazgec;
    $<HTMLButtonElement>('[data-uygula]').textContent = m.uygula;

    const alanKap = $<HTMLElement>('[data-alan]');
    const sahne = $<HTMLElement>('[data-sahne]');
    const resim = $<HTMLCanvasElement>('.kk-resim');
    const svg = $<SVGSVGElement>('.kk-cizgi');
    const cokgen = svg.querySelector('polygon')!;
    const buyutec = $<HTMLCanvasElement>('.kk-buyutec');
    const onizleme = $<HTMLCanvasElement>('.kk-onizleme canvas');
    const tutamaclar = m.koseler.map((ad, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kk-kose'; b.setAttribute('aria-label', ad); b.dataset.kose = String(i);
      sahne.append(b);
      return b;
    });

    let olcek = 1;                         // ekran pikseli / kaynak pikseli
    const yerlestir = () => {
      const ust = Math.max(160, Math.min(window.innerHeight * 0.56, 620));
      const en = Math.max(200, alanKap.clientWidth || 300);
      olcek = Math.min(en / SW, ust / SH);
      const w = Math.round(SW * olcek), h = Math.round(SH * olcek);
      const oran = Math.min(2, window.devicePixelRatio || 1);
      resim.width = Math.round(w * oran); resim.height = Math.round(h * oran);
      resim.style.width = w + 'px'; resim.style.height = h + 'px';
      sahne.style.width = w + 'px'; sahne.style.height = h + 'px';
      resim.getContext('2d')?.drawImage(kaynakTuval, 0, 0, resim.width, resim.height);
      svg.setAttribute('width', String(w)); svg.setAttribute('height', String(h)); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      ciz();
    };
    const ciz = () => {
      cokgen.setAttribute('points', q.map(([x, y]) => `${x * olcek},${y * olcek}`).join(' '));
      tutamaclar.forEach((b, i) => { b.style.left = q[i][0] * olcek + 'px'; b.style.top = q[i][1] * olcek + 'px'; });
    };
    let onizlemeSirada = 0;
    const onizlemeYenile = () => {
      cancelAnimationFrame(onizlemeSirada);
      onizlemeSirada = requestAnimationFrame(() => {
        const W = 240, H = Math.round(240 * hh / hw);
        onizleme.width = W; onizleme.height = H;
        onizleme.getContext('2d')?.putImageData(new ImageData(dogrultVeri(calisma, q, W, H), W, H), 0, 0);
      });
    };
    const buyutecCiz = (i: number) => {
      const c = buyutec.getContext('2d');
      if (!c) return;
      const [x, y] = q[i], r = 22 / Math.max(olcek, 0.05) / 3;      // ekranda ~44 px'lik alan, 3 kat büyük
      c.fillStyle = '#fff'; c.fillRect(0, 0, 120, 120);
      c.drawImage(kaynakTuval, x - r * 2.7, y - r * 2.7, r * 5.4, r * 5.4, 0, 0, 120, 120);
      c.strokeStyle = '#1A3D9E'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(60, 48); c.lineTo(60, 72); c.moveTo(48, 60); c.lineTo(72, 60); c.stroke();
      buyutec.hidden = false;
      buyutec.classList.toggle('sagda', x * olcek < (SW * olcek) / 2);
    };

    // fark: tutamacın tutulduğu nokta ile köşe arasındaki uzaklık; köşe parmağın altına sıçramaz.
    let surukle: { i: number; id: number; fark: Nokta } | null = null;
    const konum = (e: PointerEvent, fark: Nokta = [0, 0]): Nokta => {
      const k = resim.getBoundingClientRect();
      const x = (e.clientX - k.left) / olcek + fark[0], y = (e.clientY - k.top) / olcek + fark[1];
      return [Math.min(SW, Math.max(0, x)), Math.min(SH, Math.max(0, y))];
    };
    tutamaclar.forEach((b, i) => {
      b.addEventListener('pointerdown', (e) => {
        const k = resim.getBoundingClientRect();
        e.preventDefault();
        surukle = { i, id: e.pointerId, fark: [q[i][0] - (e.clientX - k.left) / olcek, q[i][1] - (e.clientY - k.top) / olcek] };
        try { b.setPointerCapture(e.pointerId); } catch { /* yok say */ }
        b.focus({ preventScroll: true }); buyutecCiz(i);
      });
      b.addEventListener('pointermove', (e) => {
        if (!surukle || surukle.id !== e.pointerId) return;
        q[i] = konum(e, surukle.fark); ciz(); buyutecCiz(i);
      });
      const bitir = (e: PointerEvent) => {
        if (!surukle || surukle.id !== e.pointerId) return;
        surukle = null; buyutec.hidden = true; onizlemeYenile();
      };
      b.addEventListener('pointerup', bitir);
      b.addEventListener('pointercancel', bitir);
      b.addEventListener('keydown', (e) => {
        const adim = (e.shiftKey ? 10 : 2) / olcek;
        const yon: Record<string, Nokta> = { ArrowLeft: [-adim, 0], ArrowRight: [adim, 0], ArrowUp: [0, -adim], ArrowDown: [0, adim] };
        const d = yon[e.key];
        if (!d) return;
        e.preventDefault();
        q[i] = [Math.min(SW, Math.max(0, q[i][0] + d[0])), Math.min(SH, Math.max(0, q[i][1] + d[1]))];
        ciz(); onizlemeYenile();
      });
    });

    let sonuc: KirpKarari = null;
    const kapat = (karar: KirpKarari) => { sonuc = karar; pencere.close(); };
    $<HTMLButtonElement>('[data-dondur]').addEventListener('click', () => { q = dondur(q); ciz(); onizlemeYenile(); });
    $<HTMLButtonElement>('[data-ham]').addEventListener('click', () => kapat({ tur: 'ham' }));
    $<HTMLButtonElement>('[data-vazgec]').addEventListener('click', () => kapat(null));
    $<HTMLButtonElement>('[data-uygula]').addEventListener('click', () => {
      const capraz = q.map((p, i) => { const a = q[(i + 1) % 4], b = q[(i + 2) % 4]; return (a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0]); });
      if (!capraz.every(c => c > 0) && !capraz.every(c => c < 0)) { $<HTMLElement>('[data-durum]').textContent = m.bulunamadi; return; }
      kapat({ tur: 'kirp', koseler: q });
    });
    const boyutGozcu = typeof ResizeObserver === 'function' ? new ResizeObserver(() => yerlestir()) : null;
    pencere.addEventListener('close', () => {
      boyutGozcu?.disconnect(); pencere.remove(); oncekiOdak?.focus?.(); coz(sonuc);
    }, { once: true });
    document.body.append(pencere);
    pencere.showModal();
    yerlestir(); onizlemeYenile();
    boyutGozcu?.observe(alanKap);
    $<HTMLButtonElement>('[data-uygula]').focus({ preventScroll: true });
  });
}
