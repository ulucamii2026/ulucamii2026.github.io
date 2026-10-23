/** İhtida formu — şahit imzası (23 Ekim 2026, Rıdvan KAYAHAN).
 *
 *  Mühtedi KENDİ şahitlerini seçtiyse ve şahitler o an yanındaysa, her şahit adının altındaki alana
 *  kendi imzasını atabilir. Alan İSTEĞE BAĞLIDIR: boş bırakılırsa başvuru bugünkü gibi ilerler, EK-9'daki
 *  şahit alanı boş basılır, hiçbir engel ya da uyarı çıkmaz (yalnız tek satırlık nötr bir not vardır).
 *
 *  Kurallar:
 *   - Pano, başvuranın imza bileşeninin aynısıdır (imzaBlokuKur): vektör çizgi + saydam PNG, aynı sınırlar.
 *   - İmza atıldıysa şahidin adı ve kendi onay kutusu (açık rıza) ZORUNLUDUR; yoksa gönderim durur.
 *   - İmza ve onay TASLAĞA yazılmaz (onay alanı `onay.` ile başlar; tuval zaten alan değildir).
 *   - Şahit seçimi «camiye bırak»a dönerse, cami değişirse ya da form sıfırlanırsa çizimler silinir:
 *     başka bir kişinin imzası görünmez biçimde gönderime taşınmaz.
 *   - Gönderim gövdesine yalnız imzalı şahidin satırına `imza`, `imzaVektor`, `riza` eklenir; imzasız şahit
 *     satırı eskisi gibi yalnız `{ ad }` kalır. */
import { imzaBlokuKur, type ImzaBloku } from './ihtida-gorseller';

export interface SahitImzaMetinleri { hataRiza: string; hataAd: string; imzali: string }

export interface SahitImzasi { imza: string; imzaVektor?: string; riza: true }

/** Sunucu `gorselGecerli` ile aynı alt sınır (Base64 gövdesi 400 karakter): daha küçük çizim imza sayılmaz. */
const PNG_ALT_SINIR = 500;

export const SAHIT_SIFIRLA_OLAYI = 'ucf:sahit-imza-sifirla';

export function sahitImzalariniBaslat(form: HTMLFormElement, m: SahitImzaMetinleri) {
  const degisti = () => form.dispatchEvent(new Event('change', { bubbles: true }));
  const sahitler = [1, 2].map((no) => {
    const kap = form.querySelector<HTMLElement>(`[data-sahit-imza="${no}"]`);
    const ad = form.querySelector<HTMLInputElement>(`#i-sahit-${no}`);
    const riza = form.querySelector<HTMLInputElement>(`#i-sahit-${no}-riza`);
    const blok: ImzaBloku | null = imzaBlokuKur(kap?.querySelector<HTMLElement>('[data-sahit-imza-kutu]') ?? null, null, degisti);
    return { no, ad, riza, blok };
  });

  /** Şahit alanları açık mı (kendi şahit seçilmiş, alanlar devre dışı değil)? */
  const etkin = (s: (typeof sahitler)[number]) => !!s.ad && !s.ad.disabled && !!s.riza && !s.riza.disabled;
  const cizim = (s: (typeof sahitler)[number]) => {
    if (!etkin(s) || !s.blok || s.blok.bosMu()) return null;
    const png = s.blok.veri();
    if (png.length < PNG_ALT_SINIR) return null;                    // sunucunun reddedeceği kadar küçük karalama
    return { png, vektor: s.blok.vektor() };
  };

  const sifirla = () => {
    for (const s of sahitler) {
      s.blok?.sifirla();
      if (s.riza) { s.riza.checked = false; s.riza.removeAttribute('aria-invalid'); }
    }
  };

  // Şahit alanları kapanınca (cami şahitlerine dönüş) ya da cami değişince çizimler silinir.
  form.querySelector<HTMLInputElement>('#i-sahit-ekle')?.addEventListener('change', (e) => {
    if (!(e.target as HTMLInputElement).checked) sifirla();
  });
  form.addEventListener(SAHIT_SIFIRLA_OLAYI, sifirla);

  return {
    /** Gönderim gövdesi için: imzalı şahitlerin ekleri (imzasız ya da koşulları eksik şahit için null). */
    veri(): Array<SahitImzasi | null> {
      return sahitler.map((s) => {
        const c = cizim(s);
        if (!c || !s.riza?.checked || !s.ad?.value.trim()) return null;
        return { imza: c.png, ...(c.vektor ? { imzaVektor: c.vektor } : {}), riza: true as const };
      });
    },
    /** İmza atılmış ama ad ya da onay eksikse hata çifti döner; imzasız şahit için ASLA hata vermez. */
    dogrula(): Array<[string, string]> {
      const hatalar: Array<[string, string]> = [];
      for (const s of sahitler) {
        if (!cizim(s)) continue;
        if (!s.ad?.value.trim()) hatalar.push([`sahit.${s.no}`, m.hataAd]);
        if (!s.riza?.checked) hatalar.push([`onay.sahitRiza${s.no}`, m.hataRiza]);
      }
      return hatalar;
    },
    /** Özet satırı için: adın yanına «(imzalı)» notu. */
    imzaliMi: (no: number): boolean => {
      const s = sahitler[no - 1];
      return !!s && !!cizim(s) && !!s.riza?.checked && !!s.ad?.value.trim();
    },
    etiket: m.imzali,
    sifirla,
  };
}
