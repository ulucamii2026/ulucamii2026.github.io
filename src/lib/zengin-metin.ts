/**
 * Zengin metin (duyuru) beyaz-liste temizleyicisi — kalın/italik/altı çizili/renkli/bağlantı/emoji.
 *
 * Hoca güvenilir bir yazar olsa da metin HEM yazılırken (hoca ekranı) HEM render edilirken
 * (veli portalı) temizlenir — savunma derinliği. `DOMParser` ile ayrıştırma inert'tir: script
 * çalışmaz, kaynak (img/link) yüklenmez. Yalnız TARAYICIDA çalışır (DOMParser gerektirir);
 * bu yüzden yalnız istemci betiklerinden (veli-portali.ts, hoca-ekrani.ts) içe aktarılır.
 */

// DIV/P: contenteditable satır sonlarını (blok) korumak için izinli (temiz, özniteliksiz)
const IZINLI = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'A', 'SPAN', 'UL', 'OL', 'LI', 'P', 'DIV']);
// İçeriğiyle birlikte tamamen atılan etiketler (metni bile korunmaz)
const AT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'MATH', 'LINK', 'META', 'HEAD', 'TITLE', 'IMG']);

// CSP (egitim.ulucamii.be: style-src 'self'): `style=` özniteliği engellenir. Bu yüzden renk, çıktıda
// `span.zr-<ad>` sınıfı olarak yazılır (src/styles/portal-sinif.css). Eski kayıtlardaki
// `style="color:…"` / `<font color>` render sırasında bu sınıflara çevrilir; sınıf listesi dışındaki
// güvenli bir renk RGB uzaklığı en yakın sınıfa eşlenir.
const RENK_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$|^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i;

/** sınıf adı → [r,g,b]. portal-sinif.css'teki .zr-* ile birebir aynı olmalı. */
export const RENK_PALETI: Record<string, readonly [number, number, number]> = {
  kiremit: [0xb5, 0x45, 0x2b], mavi: [0x1f, 0x5f, 0x8b], yesil: [0x2f, 0x6d, 0x3c], koyu: [0x24, 0x20, 0x1c],
  red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], black: [0, 0, 0], orange: [255, 165, 0], purple: [128, 0, 128],
  teal: [0, 128, 128], maroon: [128, 0, 0], navy: [0, 0, 128], olive: [128, 128, 0], brown: [165, 42, 42],
  crimson: [220, 20, 60], darkgreen: [0, 100, 0], darkblue: [0, 0, 139], gray: [128, 128, 128],
};
const RENK_ADI_ESLE: Record<string, string> = { grey: 'gray' };
const RENK_ADI = new Set([...Object.keys(RENK_PALETI), ...Object.keys(RENK_ADI_ESLE)].filter((k) => !['kiremit', 'mavi', 'yesil', 'koyu'].includes(k)));

function renkGuvenli(deger: string): string | null {
  const v = (deger || '').trim().toLowerCase();
  return v && (RENK_RE.test(v) || RENK_ADI.has(v)) ? v : null;
}

function rgbCoz(v: string): readonly [number, number, number] | null {
  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)) as unknown as [number, number, number];
  m = /^#([0-9a-f]{6})$/.exec(v);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  m = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(v);
  if (m) return [Math.min(255, +m[1]), Math.min(255, +m[2]), Math.min(255, +m[3])];
  const ad = RENK_ADI_ESLE[v] || v;
  return RENK_PALETI[ad] || null;
}

/** Güvenli bir renk değerini `zr-<ad>` sınıf adına çevirir (yoksa null). */
export function renkSinifi(deger: string): string | null {
  const v = renkGuvenli(deger);
  const rgb = v && rgbCoz(v);
  if (!rgb) return null;
  let en = '', enUzak = Infinity;
  for (const [ad, p] of Object.entries(RENK_PALETI)) {
    const u = (p[0] - rgb[0]) ** 2 + (p[1] - rgb[1]) ** 2 + (p[2] - rgb[2]) ** 2;
    if (u < enUzak) { en = ad; enUzak = u; }
  }
  return 'zr-' + en;
}

/**
 * Bir öğenin rengini okur: `style` özniteliğinden metin olarak (CSP'li inert belgede `el.style` güvenilmez),
 * yoksa `el.style.color`; `<font color>` için `color` özniteliği.
 */
export function renkOku(el: Element): string {
  const st = el.getAttribute('style') || '';
  const m = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(st);
  if (m) return m[1].trim();
  return (el as HTMLElement).style?.color || el.getAttribute('color') || '';
}

function anchorTemizle(kaynak: HTMLAnchorElement, yeni: HTMLAnchorElement): void {
  const href = (kaynak.getAttribute('href') || '').trim();
  // yalnız http(s)/mailto; boşluk/tırnak/açılı ayraç içeren (enjeksiyon) href reddedilir
  if (/^(https?:|mailto:)/i.test(href) && !/[\s"'<>`]/.test(href)) {
    yeni.setAttribute('href', href);
    yeni.setAttribute('target', '_blank');
    yeni.setAttribute('rel', 'noopener nofollow');
  }
}

function gez(kaynak: Node, hedef: Node, doc: Document): void {
  kaynak.childNodes.forEach((n) => {
    if (n.nodeType === 3 /* TEXT */) {
      hedef.appendChild(doc.createTextNode(n.textContent || ''));
      return;
    }
    if (n.nodeType !== 1 /* ELEMENT */) return;
    const el = n as HTMLElement;
    const tag = el.tagName;
    if (AT.has(tag)) return; // içeriğiyle birlikte at
    if (IZINLI.has(tag)) {
      const yeni = doc.createElement(tag.toLowerCase());
      if (tag === 'A') anchorTemizle(el as HTMLAnchorElement, yeni as HTMLAnchorElement);
      else if (tag === 'SPAN') {
        const sinif = renkSinifi(renkOku(el));
        const eski = (el.getAttribute('class') || '').split(/\s+/).find((c) => /^zr-[a-z]+$/.test(c) && RENK_PALETI[c.slice(3)]);
        const k = sinif || eski;
        if (k) yeni.setAttribute('class', k);
      }
      gez(el, yeni, doc);
      hedef.appendChild(yeni);
    } else if (tag === 'FONT') {
      // execCommand('foreColor') styleWithCSS kapalıyken (tarayıcı varsayılanı) <font color="…">
      // üretir; güvenli renkli span'a çevir ki renk kayıtta/render'da düşmesin.
      const yeni = doc.createElement('span');
      const sinif = renkSinifi(renkOku(el));
      if (sinif) yeni.setAttribute('class', sinif);
      gez(el, yeni, doc);
      hedef.appendChild(yeni);
    } else {
      gez(el, hedef, doc); // izinsiz ama zararsız etiket: kendini at, içeriğini koru
    }
  });
}

/** Beyaz-liste dışını temizleyip güvenli HTML döndürür (yalnız izinli etiket/öznitelik kalır). */
export function temizleHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString('<body><div>' + html + '</div></body>', 'text/html');
  const kaynak = doc.body.firstElementChild;
  const hedef = doc.createElement('div');
  if (kaynak) gez(kaynak, hedef, doc);
  return hedef.innerHTML;
}

/** Etiketleri atıp düz metin döndürür (liste önizlemesi / arama / boş kontrolü için). */
export function metniSadelestir(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Metinde görünür içerik var mı (yalnız boş etiket/boşluk değil). */
export function bosMu(html: string): boolean {
  return metniSadelestir(html).length === 0;
}

/**
 * Metin zengin editörden gelen HTML mi, yoksa eski textarea'dan gelen düz metin mi?
 * Editörün innerHTML'i özel karakteri her zaman HTML varlığına (`&lt;`) çevirir ve biçim/satır için
 * kapanış etiketi ya da `<br>` içerir; eski düz metinde bunların hiçbiri bulunmaz. Bu ayrım olmadan
 * "a<b olacak" gibi düz bir cümle yanlışlıkla HTML sanılıp `temizleHtml`'e verilir ve sahte etiketten
 * sonrası sessizce yutulur (veri kaybı). Kapanış etiketi/`<br>`/varlık — üçü de düz metinde olmaz.
 */
export function zenginMi(html: string): boolean {
  return /<\/[a-z]|<br\s*\/?>|&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i.test(html || '');
}
