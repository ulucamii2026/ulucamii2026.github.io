/**
 * Basılı ezber kartının kare kodu (Faz 2e, 24 Ekim 2026): QR matrisinden SAF VEKTÖR çizim. Her koşu (aynı satırda yan yana
 * karanlık modüller) tek bir dolu dikdörtgendir; piksel, görsel dosyası ya da dış kaynak yoktur, bu yüzden Chromium'un "PDF
 * olarak yazdır"ı kodu vektör yol olarak yazar ve istenen büyüklükte keskin basılır. Matrisi `qrcode` paketi üretir (hata
 * düzeltme M); bu modül yalnız onu SVG'ye çevirir ve saf olduğundan testle sabitlenir: yoldan matris geri kurulabilir
 * (tests/ezber-kare-kod.test.mjs). Sessiz bölge (kenar) QR şartnamesindeki gibi 4 modüldür ve beyaz zeminde çizilir:
 * sayfa zemini renkli olsa da kod okunur kalır.
 */

export interface KareKodMatrisi {
  readonly size: number;
  get(satir: number, sutun: number): number | boolean;
}

export const KARE_KOD_KENAR = 4;

/** Karanlık modüllerin yatay koşuları: `M x y h w v1 h-w z` dikdörtgenleri, kenar payı eklenmiş koordinatla. */
export function kareKodYolu(m: KareKodMatrisi, kenar = KARE_KOD_KENAR): string {
  const parcalar: string[] = [];
  for (let y = 0; y < m.size; y++) {
    let x = 0;
    while (x < m.size) {
      if (!m.get(y, x)) { x++; continue; }
      const bas = x;
      while (x < m.size && m.get(y, x)) x++;
      parcalar.push(`M${bas + kenar} ${y + kenar}h${x - bas}v1h-${x - bas}z`);
    }
  }
  return parcalar.join('');
}

/** Kare kodun SVG metni (satır içi basılır). Süstür: adres kartta yazıyla da verilir, bu yüzden ekran okuyucudan gizlidir. */
export function kareKodSvg(m: KareKodMatrisi, sinif = 'kare-kod', kenar = KARE_KOD_KENAR): string {
  const boy = m.size + 2 * kenar;
  return `<svg class="${sinif}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boy} ${boy}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<rect width="${boy}" height="${boy}" fill="#ffffff"/><path fill="#000000" d="${kareKodYolu(m, kenar)}"/></svg>`;
}

/** Yolu (kareKodYolu çıktısı) matrise geri çevirir: testte "kod, qrcode paketinin matrisiyle birebir aynı" denetimi için. */
export function yoldanMatris(yol: string, boy: number, kenar = KARE_KOD_KENAR): number[][] {
  const matris = Array.from({ length: boy }, () => Array<number>(boy).fill(0));
  for (const [, x, y, w] of yol.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    for (let i = 0; i < Number(w); i++) matris[Number(y) - kenar][Number(x) - kenar + i] = 1;
  }
  return matris;
}
