/**
 * Çalışma kiplerinin ortak parçaları (Faz 2c): tür tanımları, DOM yardımcıları ve tek ses sahibi. Bütün DOM elle kurulur ve
 * yalnız `textContent`, sınıf ve öznitelik kullanır: Hosting'in CSP'si (`style-src 'self'`, `script-src 'self'`) satır içi
 * stil ve betiğe izin vermez; `innerHTML` de kullanılmaz.
 */
import type { MaddeAyari } from '@ortak/lib/ezber/cihaz';
import type { KipMetinleri } from '../i18n/kip';
import type { SinaMetinleri } from '../i18n/sina';

export type Kip = 'zincir' | 'gizle' | 'sina';
export interface Bolum { readonly no: number; readonly ar: string; readonly etiket: string; readonly ses: string | null }
export interface KipVeri {
  readonly id: string;
  readonly kuran: boolean;
  readonly bolumler: readonly Bolum[];
  /** Maddenin bütün dinleme sırası (hafız kaydı; sûre başındaysa eûzü ve besmele önde): «Kendini sına»da kendi sesini onunla karşılaştırmak içindir. Boş olabilir. */
  readonly hafiz: readonly string[];
  readonly m: KipMetinleri & SinaMetinleri;
}

export interface SesSahibi {
  /** Adresleri sırayla çalar; bitince `bitince` çağrılır. Önceki çalan kesilir. */
  cal(adresler: readonly string[], bitince?: () => void): void;
  durdur(): void;
  readonly caliyor: boolean;
  /** Çalma durumu değişince çağrılır (düğme etiketlerini güncellemek için). */
  dinle(f: () => void): void;
}

export interface Baglam {
  readonly veri: KipVeri;
  readonly ses: SesSahibi;
  ayar(): MaddeAyari;
  kaydet(kismi: Partial<Omit<MaddeAyari, 'son'>>): void;
  /** Öbür kipin sekmesine geçer (zincir bitince «Kademeli gizleye geç»). */
  gec(kip: Kip): void;
  /** Çocuk bir tur çalışmayı bitirdi (sonuç seçti, soruları bitirdi): bugün «çalışılan gün» olarak işlenir. */
  calistim(): void;
  /** Panel gizlenirken (başka sekmeye geçilince) çağrılacak temizleyici; örneğin açık mikrofonu bırakır. */
  birak(f: () => void): void;
}

/** `{ad}` yer tutucularını doldurur. */
export const doldur = (s: string, d: Readonly<Record<string, string | number>>): string => s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));

export function el<K extends keyof HTMLElementTagNameMap>(etiket: K, sinif = '', metin = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(etiket);
  if (sinif) e.className = sinif;
  if (metin) e.textContent = metin;
  return e;
}

export function dugme(metin: string, sinif: string, tikla: () => void): HTMLButtonElement {
  const d = el('button', sinif, metin);
  d.type = 'button';
  d.addEventListener('click', tikla);
  return d;
}

export const birimAdi = (v: KipVeri): string => (v.kuran ? v.m.birimAyetK : v.m.birimBolumK);
const birimBas = (v: KipVeri): string => (v.kuran ? v.m.birimAyet : v.m.birimBolum);

/** Grup seçicinin satırı: «Âyet 1–5» ya da tek birimse «Âyet 7». */
export function aralikEtiketi(v: KipVeri, bas: number, son: number): string {
  const a = v.bolumler[bas].no;
  const b = v.bolumler[son - 1].no;
  return a === b ? doldur(v.m.tek, { birim: birimBas(v), a }) : doldur(v.m.aralik, { birim: birimBas(v), a, b });
}

/** Etiketli seçim kutusu: gruplar birden çoksa bir `select` döner, değilse `null`. */
export function kisimSecici(v: KipVeri, gruplar: readonly { bas: number; son: number }[], secili: number, degisti: (i: number) => void): HTMLElement | null {
  if (gruplar.length < 2) return null;
  const kutu = el('label', 'kip-alan', v.m.kisim);
  const s = el('select');
  gruplar.forEach((g, i) => {
    const o = el('option', '', aralikEtiketi(v, g.bas, g.son));
    o.value = String(i);
    o.selected = i === secili;
    s.append(o);
  });
  s.addEventListener('change', () => degisti(Number(s.value)));
  kutu.append(s);
  return kutu;
}

/** Tek ses sahibi: aynı anda tek kayıt. Çalma başlayınca `ezber:ses-basladi` yayılır; başkası (çalar) başlatırsa kesilir. */
export function sesSahibiKur(hataVer: () => void): SesSahibi {
  let ses: HTMLAudioElement | null = null;
  let oturum = 0;
  let calan = false;
  const dinleyenler: (() => void)[] = [];
  const bildir = () => dinleyenler.forEach((f) => f());
  const sustur = () => {
    oturum++;
    const eski = ses;
    ses = null;
    const idi = calan;
    calan = false;
    if (eski) { eski.pause(); eski.removeAttribute('src'); eski.load(); }
    if (idi) bildir();
  };
  const cal = (adresler: readonly string[], bitince?: () => void) => {
    sustur();
    if (!adresler.length) return;
    const o = oturum;
    calan = true;
    document.dispatchEvent(new CustomEvent('ezber:ses-basladi', { detail: 'kip' }));
    bildir();
    const kuyruk = [...adresler];
    const sirada = () => {
      if (o !== oturum) return;
      const adres = kuyruk.shift();
      if (!adres) { calan = false; ses = null; bildir(); bitince?.(); return; }
      const a = new Audio();
      ses = a;
      a.preload = 'none'; // play() yüklemeyi zaten başlatır; çalmadan ağa çıkılmaz
      a.src = adres;
      a.addEventListener('ended', sirada);
      a.addEventListener('error', () => { if (o === oturum) { sustur(); hataVer(); } });
      a.play().catch((e: unknown) => { if (o === oturum && (e as { name?: string })?.name !== 'AbortError') { sustur(); hataVer(); } });
    };
    sirada();
  };
  document.addEventListener('ezber:ses-basladi', (e) => { if ((e as CustomEvent<string>).detail !== 'kip' && calan) sustur(); });
  window.addEventListener('pagehide', sustur);
  return { cal, durdur: sustur, get caliyor() { return calan; }, dinle: (f) => { dinleyenler.push(f); } };
}
