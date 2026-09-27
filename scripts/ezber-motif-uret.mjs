/**
 * Ezber Kilimi motifleri (27 Eylül 2026, Faz 1d): src/assets/cizim/ezber-kilim/*.svg → src/lib/ezber/motifler.ts.
 *
 * Neden: kilim çizici (src/lib/ezber/kilim.ts) saf TypeScript'tir; aynı modülü hem Astro/Vite hem esbuild (testler,
 * sahte portal) paketler ve `?raw` içe aktarımı esbuild'de çalışmaz. Çizimler Codex'in saf vektör çıktısıdır ve renk
 * taşımaz: kilim, maddeyi basamağına göre kendisi boyar (çözgü, çizgi, yarı dolu, dolu, altın). Kaynaklar
 * `npm run denetim:svg` ile denetlenir; bu betik yalnız biçimi ayıklar (<title> atılır, viewBox ve şekiller kalır) ve
 * renk, sınıf, kimlik gibi bir nitelik görürse durur.
 *
 * Kullanım:
 *   node scripts/ezber-motif-uret.mjs            → modülü yazar
 *   node scripts/ezber-motif-uret.mjs --denetle  → modül kaynaklarla aynı değilse hata verir (test bunu da yapar)
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KAYNAK = join(KOK, 'src/assets/cizim/ezber-kilim');
export const HEDEF = join(KOK, 'src/lib/ezber/motifler.ts');

const IZINLI = { path: ['d', 'fill-rule'], polygon: ['points', 'fill-rule'], rect: ['x', 'y', 'width', 'height'] };

/** «motif-1-hatem.svg» → «hatem», «motif-kenar-muska.svg» → «muska», «kenar-kose.svg» → «kenar-kose». */
export function motifAdi(dosya) {
  return dosya.replace(/\.svg$/, '').replace(/^motif-(?:\d+-|kenar-)?/, '');
}

/** Bir çizimin viewBox'ı ve renksiz şekilleri (tek satır). */
export function motifAyikla(svg, dosya = 'çizim') {
  const kutu = svg.match(/<svg\b[^>]*\bviewBox="([\d.\s-]+)"/)?.[1]?.trim().replace(/\s+/g, ' ');
  if (!kutu) throw new Error(`${dosya}: viewBox yok.`);
  const govde = svg.replace(/<\?xml[^>]*>/, '').replace(/<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<title>[^<]*<\/title>/, '').trim();
  const sekiller = [];
  const kalan = govde.replace(/<(path|polygon|rect)\b([^>]*?)\/>/g, (_, ad, nitelikler) => {
    const n = [...nitelikler.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v.trim().replace(/\s+/g, ' ')]);
    for (const [k] of n) if (!IZINLI[ad].includes(k)) throw new Error(`${dosya}: <${ad}> üzerinde izinsiz nitelik «${k}» (kilim rengi kendisi verir).`);
    sekiller.push(`<${ad} ${n.map(([k, v]) => `${k}="${v}"`).join(' ')}/>`);
    return '';
  });
  if (kalan.trim()) throw new Error(`${dosya}: path, polygon ve rect dışında öğe var: ${kalan.trim().slice(0, 80)}`);
  if (!sekiller.length) throw new Error(`${dosya}: şekil yok.`);
  return { kutu, icerik: sekiller.join('') };
}

/** Üretilecek TypeScript modülünün tam metni (dosya adına göre sıralı; aynı kaynak → aynı çıktı). */
export function motifModulu(klasor = KAYNAK) {
  const dosyalar = readdirSync(klasor).filter((f) => f.endsWith('.svg')).sort();
  const satirlar = dosyalar.map((f) => {
    const { kutu, icerik } = motifAyikla(readFileSync(join(klasor, f), 'utf8'), f);
    return `  ${JSON.stringify(motifAdi(f))}: { kutu: ${JSON.stringify(kutu)}, icerik: ${JSON.stringify(icerik)} },`;
  });
  return `/* ÜRETİLDİ — elle düzenlemeyin: node scripts/ezber-motif-uret.mjs
   Kaynak: src/assets/cizim/ezber-kilim/*.svg (Codex saf vektör çizimleri, 27 Eylül 2026; npm run denetim:svg).
   Şekiller renk taşımaz; kilim.ts maddeyi basamağına göre boyar. */
export interface Motif {
  /** viewBox */
  readonly kutu: string;
  /** Renksiz şekiller (path / polygon / rect). */
  readonly icerik: string;
}

export const MOTIFLER = Object.freeze({
${satirlar.join('\n')}
}) satisfies Readonly<Record<string, Motif>>;

export type MotifAdi = keyof typeof MOTIFLER;
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const metin = motifModulu();
  if (process.argv.includes('--denetle')) {
    const mevcut = (() => { try { return readFileSync(HEDEF, 'utf8'); } catch { return ''; } })();
    if (mevcut !== metin) {
      console.error('src/lib/ezber/motifler.ts kaynak çizimlerle aynı değil: node scripts/ezber-motif-uret.mjs');
      process.exit(1);
    }
    console.log('Ezber motifleri güncel.');
  } else {
    writeFileSync(HEDEF, metin);
    console.log(`Yazıldı: src/lib/ezber/motifler.ts (${readdirSync(KAYNAK).filter((f) => f.endsWith('.svg')).length} motif).`);
  }
}
