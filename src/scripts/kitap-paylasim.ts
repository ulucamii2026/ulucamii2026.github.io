import kitaplar from '../data/hoca-kitaplari.json';
import { kitaplarHtml, hocaKitaplari, type KitapMetni } from './hoca-kitaplari';

/**
 * /kitap/ gizli paylaşım sayfası (4 Ekim 2026). Hoca ekranındaki şifreli kitapları hoca hesabı olmayan
 * muhataba (Müşavirlik) bağlantıyla indirtir. Kitap anahtarları `src/data/kitap-paylasim.json` içinde 16 baytlık
 * paylaşım anahtarıyla sarılıdır; paylaşım anahtarı yalnız adresin `#` kısmındadır (sunucuya ve sayaca gitmez).
 * Anahtar hiçbir depoya yazılmaz. Sarmalın üretimi, kapatılması ve yenilenmesi: docs/HOCA-KITAPLARI.md.
 */
export type PaylasimVerisi = { surum: number; durum?: 'kapali'; olusturma?: string; kitaplar?: string[]; iv?: string; sifreli?: string };

const b64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));

/** Adresin `#` kısmındaki 22 karakterlik base64url paylaşım anahtarı; biçim tutmazsa null. */
export function paylasimAnahtari(hash: string): Uint8Array<ArrayBuffer> | null {
  const m = /^#?([A-Za-z0-9_-]{22})$/.exec(hash.trim());
  if (!m) return null;
  const anahtar = b64u(m[1]);
  return anahtar.length === 16 ? anahtar : null;
}

/** Sarmalı açar: `kitap-id → 64 hane hex anahtar`. Hata kodları: paylasim-kapali | paylasim-anahtar | paylasim-surum. */
export async function anahtarlariAc(v: PaylasimVerisi, anahtar: Uint8Array<ArrayBuffer>): Promise<Record<string, string>> {
  if (v.durum === 'kapali' || !v.iv || !v.sifreli || !v.kitaplar) throw new Error('paylasim-kapali');
  const key = await crypto.subtle.importKey('raw', anahtar, 'AES-GCM', false, ['decrypt']);
  let acik: ArrayBuffer;
  try {
    acik = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64u(v.iv), additionalData: new TextEncoder().encode(`kitap-paylasim:v${v.surum}`) }, key, b64u(v.sifreli));
  } catch {
    throw new Error('paylasim-anahtar');
  }
  const harita = JSON.parse(new TextDecoder().decode(acik)) as Record<string, string>;
  for (const k of kitaplar) if (!/^[0-9a-f]{64}$/.test(harita[k.id] ?? '')) throw new Error('paylasim-surum');
  return harita;
}

const PAYLASIM_METNI: KitapMetni = {
  baslik: 'Kitaplar',
  giris: 'Her kitap ayrı düğmeyle iner. İndirme, bağlantınızın hızına göre birkaç dakika sürebilir.',
  bekle: 'Bağlantı doğrulanıyor…',
  hata: 'Kitap indirilemedi. İnternet bağlantınızı kontrol edip yeniden deneyin.',
};
const DURUM: Record<string, string> = {
  yok: 'Bu sayfa yalnız size iletilen bağlantıyla açılır. Bağlantıyı e-postadan ya da yazıdaki karekoddan eksiksiz açın.',
  'paylasim-anahtar': 'Bağlantı eksik ya da hatalı. E-postadaki bağlantıyı veya yazıdaki karekodu yeniden açın.',
  'paylasim-kapali': 'Bu paylaşım kapatılmıştır. Kitaplar için info@ulucamii.be adresine yazabilirsiniz.',
  'paylasim-surum': 'Kitaplar güncellendiği için bu bağlantı artık geçerli değil. Güncel bağlantı için info@ulucamii.be adresine yazabilirsiniz.',
};

export function kitapPaylasim(kok: HTMLElement, v: PaylasimVerisi): () => void {
  let temizle: (() => void) | undefined;
  let sira = 0;
  const durumYaz = (kod: string) => {
    const p = document.createElement('p');
    p.className = 'not'; p.setAttribute('role', 'alert'); p.dataset.paylasimDurum = kod; p.textContent = DURUM[kod] ?? DURUM['paylasim-anahtar'];
    kok.replaceChildren(p);
  };
  const kur = async () => {
    const benim = ++sira;
    temizle?.(); temizle = undefined;
    const anahtar = paylasimAnahtari(location.hash);
    if (!anahtar) { durumYaz(location.hash.length > 1 ? 'paylasim-anahtar' : 'yok'); return; }
    try {
      const harita = await anahtarlariAc(v, anahtar);
      anahtar.fill(0);
      if (benim !== sira) return;
      kok.innerHTML = kitaplarHtml(PAYLASIM_METNI);
      temizle = hocaKitaplari(kok.querySelector<HTMLElement>('[data-hoca-kitaplari]')!, async id => harita[id], PAYLASIM_METNI);
    } catch (e) {
      if (benim === sira) durumYaz(e instanceof Error ? e.message : 'paylasim-anahtar');
    }
  };
  void kur();
  addEventListener('hashchange', kur);
  return () => { sira++; temizle?.(); removeEventListener('hashchange', kur); };
}
