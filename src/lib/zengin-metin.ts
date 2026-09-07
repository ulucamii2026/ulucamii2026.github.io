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

const RENK_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$|^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i;
const RENK_ADI = new Set(['red', 'blue', 'green', 'black', 'orange', 'purple', 'teal', 'maroon', 'navy', 'olive', 'brown', 'crimson', 'darkgreen', 'darkblue', 'gray', 'grey']);

function renkGuvenli(deger: string): string | null {
  const v = (deger || '').trim().toLowerCase();
  return v && (RENK_RE.test(v) || RENK_ADI.has(v)) ? v : null;
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
        const renk = renkGuvenli(el.style?.color || '');
        if (renk) (yeni as HTMLElement).style.color = renk;
      }
      gez(el, yeni, doc);
      hedef.appendChild(yeni);
    } else if (tag === 'FONT') {
      // execCommand('foreColor') styleWithCSS kapalıyken (tarayıcı varsayılanı) <font color="…">
      // üretir; güvenli renkli span'a çevir ki renk kayıtta/render'da düşmesin.
      const yeni = doc.createElement('span');
      const renk = renkGuvenli(el.getAttribute('color') || el.style?.color || '');
      if (renk) (yeni as HTMLElement).style.color = renk;
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
