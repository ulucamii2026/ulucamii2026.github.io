/**
 * Ezber Kilimi — kilim çizici (27 Eylül 2026, Faz 1d). Katalog ve öğrencinin durumundan tek bir satır içi SVG üretir;
 * veli portalı (öğrenci ve veli görünümü) ve ileride hoca kartı, baskı ve platform aynı çiziciyi kullanır. Saf: DOM
 * bilmez, dize döndürür.
 *
 * Yapı (gerçek kilim gibi):
 *   - Alan: 12 şerit — seviye 1–7 ve Amme'nin 5 durağı (8.1–8.5). Her madde şeridinin motifiyle bir kez dokunur;
 *     az maddeli şeritte motiflerin arasına küçük «ara» baklavaları girer.
 *   - Şeridin solunda rozet yuvası (bütün maddeler ≥ Hocaya okudu), sağında mühür yuvası (≥ Pekişti); bütün maddeler
 *     Kalıcı ise şerit altın kenarla çevrilir. Kazanılmamış yuva soluk kalır (dokunacak yer).
 *   - Kenar suyu: çerçevedeki koçboynuzu bordürü; seviye dışı 13 madde bordürün üstünde muska motifiyle dokunur.
 *   - Üst ve altta saçak (çözgü uçları).
 * Basamak dolgusu (renk tek başına bilgi taşımaz, biçim de değişir): 0 kesik çözgü çizgisi · 1 düz çizgi · 2 çizgi +
 * yarı saydam dolgu · 3 dolu · 4 dolu altın + çerçeve. Renkler CSS'te (`src/styles/ezber-kilim.css`, `.ezber-kilim`).
 *
 * Amme durakları ayrı şerit olunca alan kareye yakındır (12 × 12 hücre); bu yüzden telefonda ve masaüstünde tek
 * yerleşim yeter (plandaki yatay/dikey ayrımı gerekmedi). SVG `role="img"`dır; metin karşılığı sayfadaki listedir.
 * Kimlikler `onek` ile başlar (aynı sayfada birden çok kilim). Kurallar: docs/EZBER-KILIMI.md.
 */
import type { Dil } from '../../i18n/ui';
import { KATALOG, ezberBul, type Seviye } from './katalog';
import { bolumOzetleri, gorunenBasamak, type Basamak, type Bolum, type BolumOzeti, type OgeDurumu } from './durum';
import { BASAMAK_ADLARI, KILIM_METINLERI } from './metinler';
import { MOTIFLER, type MotifAdi } from './motifler';

/** Şeridin motifi (Codex çizimleri, src/assets/cizim/ezber-kilim). */
export const SERIT_MOTIFI: Readonly<Record<Seviye, MotifAdi>> = Object.freeze({
  1: 'hatem', 2: 'su-yolu', 3: 'mihrap', 4: 'bereket', 5: 'goz', 6: 'pitrak', 7: 'kandil', 8: 'hayat-agaci', kenar: 'muska',
});

const C = 32; // hücre
const M = 24; // motif
const P = (C - M) / 2;
const NMAX = 10; // bir şeritte en çok madde (8.1: 10 sûre)
const K = C; // kenar suyu kalınlığı
const S = 14; // saçak boyu
const FW = (NMAX + 2) * C; // rozet yuvası + maddeler + mühür yuvası

export interface KilimSecenek {
  /** Kimlik öneki: küçük harfle başlar; harf, rakam, tire (ör. «kl-test-1»). */
  readonly onek: string;
  readonly dil: Dil;
  /** Erişilebilir ad (ör. «Örnek Talebe — Ezber Kilimi»). */
  readonly baslik: string;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const n2 = (x: number) => String(Math.round(x * 100) / 100);

/** Kilimin alan şeritleri: 1–7 ve Amme durakları (bütün Amme ve kenar suyu ayrı). */
export function kilimSeritleri(ozetler: readonly BolumOzeti[] = bolumOzetleri({})): BolumOzeti[] {
  return ozetler.filter((o) => o.bolum.seviye !== 'kenar' && !(o.bolum.seviye === 8 && o.bolum.durak === undefined));
}

/** Kısa özet (SVG açıklaması ve bölüm alt başlığı): basamak sayıları, rozet ve mühür. */
export function kilimOzeti(ogeler: Readonly<Record<string, OgeDurumu>>, dil: Dil): string {
  const say = [0, 0, 0, 0, 0];
  for (const o of KATALOG.ogeler) say[gorunenBasamak(ogeler, o.id)]++;
  const seritler = kilimSeritleri(bolumOzetleri(ogeler));
  const parca = ([1, 2, 3, 4] as const).filter((b) => say[b]).map((b) => `${BASAMAK_ADLARI[b][dil]} ${say[b]}`);
  const rozet = seritler.filter((x) => x.rozet).length;
  const muhur = seritler.filter((x) => x.sertifika).length;
  return [`${KATALOG.ogeler.length - say[0]}/${KATALOG.ogeler.length} ${KILIM_METINLERI.madde[dil]}`, ...parca,
    ...(rozet ? [`${KILIM_METINLERI.rozet[dil]} ${rozet}`] : []), ...(muhur ? [`${KILIM_METINLERI.muhur[dil]} ${muhur}`] : [])].join(' · ');
}

const kucukIsaret = (ic: string) => `<svg class="kl-lejant-isaret" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${ic}</svg>`;

/**
 * Tek motifin küçük işareti, kilimdeki dokusuyla (açıklama ve şerit listesi). Süstür (`aria-hidden`); basamağı yanındaki
 * metin söyler. Aynı sayfadaki kilimin sembollerine başvurur: `onek` o kilimin öneki olmalı.
 */
export function motifIsareti(onek: string, motif: MotifAdi, b: Basamak): string {
  return kucukIsaret(`${b === 4 ? '<rect x="1" y="1" width="30" height="30" class="kl-b4-cerceve"/>' : ''}<use href="#${onek}-m-${motif}" x="4" y="4" width="24" height="24" class="kl-m kl-b${b}"/>`);
}

/**
 * Kilimin yanındaki açıklama: beş basamağın dokusu ve üç ödül. Aynı sayfadaki kilimin sembollerine başvurur (aynı
 * `onek`); küçük çizimler süstür, adı yanındaki metin taşır.
 */
export function kilimLejanti(s: KilimSecenek): string {
  const on = s.onek;
  const kucuk = kucukIsaret;
  const motif = (b: Basamak) => motifIsareti(on, SERIT_MOTIFI[1], b);
  const odul = (ad: 'rozet' | 'muhur') => kucuk(`<use href="#${on}-m-${ad}" x="4" y="4" width="24" height="24" class="kl-odul kl-${ad} kazanildi"/>`);
  const satir = (isaret: string, ad: string, anlam?: string) => `<li>${isaret}<span>${anlam ? `<b>${esc(ad)}</b> · ${esc(anlam)}` : esc(ad)}</span></li>`;
  const d = s.dil;
  return `<ul class="kilim-lejant">${([0, 1, 2, 3, 4] as Basamak[]).map((b) => satir(motif(b), BASAMAK_ADLARI[b][d])).join('')}`
    + satir(odul('rozet'), KILIM_METINLERI.rozet[d], KILIM_METINLERI.rozetAnlam[d])
    + satir(odul('muhur'), KILIM_METINLERI.muhur[d], KILIM_METINLERI.muhurAnlam[d])
    + satir(kucuk('<rect x="2" y="8" width="28" height="16" class="kl-altin"/>'), KILIM_METINLERI.altin[d], KILIM_METINLERI.altinAnlam[d])
    + '</ul>';
}

export function kilimSvg(ogeler: Readonly<Record<string, OgeDurumu>>, s: KilimSecenek): string {
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(s.onek)) throw new Error(`Geçersiz kilim öneki: ${String(s.onek)}.`);
  const on = s.onek;
  const ozetler = bolumOzetleri(ogeler);
  const seritler = kilimSeritleri(ozetler);
  const kenar = ozetler.find((o) => o.bolum.seviye === 'kenar')?.bolum;
  const FH = seritler.length * C;
  const W = FW + 2 * K;
  const H = FH + 2 * K + 2 * S;
  const x0 = K;
  const y0 = S + K;
  const kullanilan = new Set<MotifAdi>(['kenar-kocboynuzu', 'kenar-kose', 'rozet', 'muhur', ...Object.values(SERIT_MOTIFI)]);
  const defs = [...kullanilan].sort().map((ad) => `<symbol id="${on}-m-${ad}" viewBox="${MOTIFLER[ad].kutu}">${MOTIFLER[ad].icerik}</symbol>`).join('');
  const use = (ad: MotifAdi, x: number, y: number, w: number, h: number, sinif: string, ek = '') =>
    `<use href="#${on}-m-${ad}" x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" class="${sinif}"${ek}/>`;
  const oge = (id: string, cx: number, cy: number, motif: MotifAdi) => {
    const m = ezberBul(id);
    if (!m) return '';
    const b: Basamak = gorunenBasamak(ogeler, id);
    const x = cx - M / 2;
    const y = cy - M / 2;
    return `<g class="kl-oge" data-id="${esc(id)}" data-basamak="${b}"><title>${esc(`${m.ad[s.dil]} — ${BASAMAK_ADLARI[b][s.dil]}`)}</title>`
      + `${b === 4 ? `<rect x="${n2(x - 3)}" y="${n2(y - 3)}" width="${M + 6}" height="${M + 6}" class="kl-b4-cerceve"/>` : ''}`
      + `${use(motif, x, y, M, M, `kl-m kl-b${b}`)}</g>`;
  };

  const parcalar: string[] = [];
  // Saçak (çözgü uçları): üstte ve altta.
  const sacak: string[] = [];
  for (let x = 6; x <= W - 6; x += 6) sacak.push(`M${x} 0V${S}M${x} ${H - S}V${H}`);
  parcalar.push(`<path class="kl-sacak" d="${sacak.join('')}"/>`);
  // Kenar suyu zemini ve bordür.
  parcalar.push(`<rect class="kl-kenar-zemin" x="0" y="${S}" width="${W}" height="${FH + 2 * K}"/>`);
  const T = 16; // bordür biriminin yüksekliği (120 × 60 → 32 × 16)
  for (let i = 0; i < FW / C; i++) {
    const x = x0 + i * C;
    parcalar.push(use('kenar-kocboynuzu', x, S + (K - T) / 2, C, T, 'kl-bordur'));
    parcalar.push(use('kenar-kocboynuzu', x, S + K + FH + (K - T) / 2, C, T, 'kl-bordur', ` transform="rotate(180 ${n2(x + C / 2)} ${n2(S + K + FH + K / 2)})"`));
  }
  for (let i = 0; i < FH / C; i++) {
    const cy = y0 + i * C + C / 2;
    parcalar.push(use('kenar-kocboynuzu', K / 2 - C / 2, cy - T / 2, C, T, 'kl-bordur', ` transform="rotate(-90 ${n2(K / 2)} ${n2(cy)})"`));
    parcalar.push(use('kenar-kocboynuzu', W - K / 2 - C / 2, cy - T / 2, C, T, 'kl-bordur', ` transform="rotate(90 ${n2(W - K / 2)} ${n2(cy)})"`));
  }
  for (const [x, y] of [[0, S], [W - K, S], [0, H - S - K], [W - K, H - S - K]]) parcalar.push(use('kenar-kose', x + P, y + P, M, M, 'kl-kose'));
  // Kenar suyu maddeleri: saat yönünde üst (4), sağ (3), alt (3, sağdan sola), sol (3, alttan üste).
  if (kenar) {
    const ids = kenar.ogeler;
    const dagit = [Math.ceil(ids.length * 4 / 13), 0, 0, 0];
    const kalanSay = ids.length - dagit[0];
    dagit[1] = Math.ceil(kalanSay / 3);
    dagit[2] = Math.ceil((kalanSay - dagit[1]) / 2);
    dagit[3] = kalanSay - dagit[1] - dagit[2];
    let i = 0;
    const koy = (cx: number, cy: number) => {
      const id = ids[i++];
      parcalar.push(`<rect class="kl-kenar-oge-zemin" x="${n2(cx - C / 2)}" y="${n2(cy - C / 2)}" width="${C}" height="${C}"/>`);
      parcalar.push(oge(id, cx, cy, SERIT_MOTIFI.kenar));
    };
    for (let k = 0; k < dagit[0]; k++) koy(x0 + (k + 0.5) * FW / dagit[0], S + K / 2);
    for (let k = 0; k < dagit[1]; k++) koy(W - K / 2, y0 + (k + 0.5) * FH / dagit[1]);
    for (let k = 0; k < dagit[2]; k++) koy(x0 + FW - (k + 0.5) * FW / dagit[2], H - S - K / 2);
    for (let k = 0; k < dagit[3]; k++) koy(K / 2, y0 + FH - (k + 0.5) * FH / dagit[3]);
  }
  // Alan: şeritler.
  seritler.forEach((oz, r) => {
    const b: Bolum = oz.bolum;
    const y = y0 + r * C;
    const cy = y + C / 2;
    const motif = SERIT_MOTIFI[b.seviye];
    parcalar.push(`<g class="kl-serit" data-serit="${esc(b.anahtar)}"${oz.rozet ? ' data-rozet=""' : ''}${oz.sertifika ? ' data-muhur=""' : ''}${oz.altin ? ' data-altin=""' : ''}>`);
    parcalar.push(`<rect class="kl-zemin kl-zemin-${r % 2}" x="${x0}" y="${y}" width="${FW}" height="${C}"/>`);
    if (r) parcalar.push(`<path class="kl-ayrac" d="M${x0} ${y}h${FW}"/>`);
    const n = b.ogeler.length;
    const aralik = (NMAX * C) / n;
    const bas = x0 + C;
    b.ogeler.forEach((id, i) => {
      parcalar.push(oge(id, bas + (i + 0.5) * aralik, cy, motif));
      if (i < n - 1 && aralik >= 2 * C) {
        const ax = bas + (i + 1) * aralik;
        parcalar.push(`<path class="kl-ara" d="M${n2(ax)} ${cy - 4}l4 4-4 4-4-4z"/>`);
      }
    });
    parcalar.push(use('rozet', x0 + P, y + P, M, M, `kl-odul kl-rozet${oz.rozet ? ' kazanildi' : ''}`));
    parcalar.push(use('muhur', x0 + FW - C + P, y + P, M, M, `kl-odul kl-muhur${oz.sertifika ? ' kazanildi' : ''}`));
    if (oz.altin) parcalar.push(`<rect class="kl-altin" x="${x0 + 1.5}" y="${y + 1.5}" width="${FW - 3}" height="${C - 3}"/>`);
    parcalar.push('</g>');
  });
  parcalar.push(`<rect class="kl-cerceve" x="${x0}" y="${y0}" width="${FW}" height="${FH}"/>`);
  parcalar.push(`<rect class="kl-cerceve kl-dis" x="0.75" y="${S + 0.75}" width="${W - 1.5}" height="${FH + 2 * K - 1.5}"/>`);

  return `<svg class="ezber-kilim" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${on}-b ${on}-a" data-onek="${on}">`
    + `<title id="${on}-b">${esc(s.baslik)}</title><desc id="${on}-a">${esc(kilimOzeti(ogeler, s.dil))}</desc>`
    + `<defs>${defs}</defs>${parcalar.join('')}</svg>`;
}
