/**
 * Kabuk köprüsü (Android uygulaması → sayfa), B1. Kabuk, Firestore'daki yayındaki duyuruları sayfaya İTER:
 * `window.UluKabukAl("<JSON>")` yalnız kabuktan çağrılır (evaluateJavascript, yalnız izinli adres ve ana çerçeve);
 * sayfanın çağırabileceği yerel bir yöntem (addJavascriptInterface) YOKTUR. Yük:
 *   {"rev": <artan tam sayı>, "duyurular": [{id, tur: "duyuru", tr?, fr?, baslangic, son, hedef}]}
 * Hiçbir belgeye güvenilmez: her öğe ayrı doğrulanır, bozuk olan atlanır, yük bozuksa mevcut liste korunur, hiçbir
 * durumda istisna dışarı sızmaz (sayfa aylarca açık kalır). Burada yalnız BİÇİM denetlenir; karakter bütçesi, tarih
 * ve hedef süzmesi slaytListesi'nindir (src/lib/ekran/secim.ts, butce.ts). Metin textContent ile yazıldığından HTML
 * olarak yorumlanmaz. Kimlikler `fs:` önekiyle çıkar: akis.json kimlikleriyle (slug) çakışmaz.
 */
import { EKRANLAR, type EkranDuyuru, type EkranMetni } from '../lib/ekran/akis.ts';

export const FS_ONEKI = 'fs:';
export const EN_COK_KABUK_DUYURUSU = 30;
const METIN_TAVANI = 500;
const YUK_TAVANI = 200_000;
const KIMLIK = /^[A-Za-z0-9_-]{1,64}$/;
const TARIH = /^\d{4}-\d{2}-\d{2}$/;

export interface KabukYuku { rev: number; duyurular: EkranDuyuru[] }
export interface KabukDurumu { rev: number; duyurular: EkranDuyuru[] }

const nesne = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function dil(x: unknown): EkranMetni | undefined {
  if (!nesne(x)) return undefined;
  const baslik = typeof x.baslik === 'string' ? x.baslik.trim() : '';
  const metin = typeof x.metin === 'string' ? x.metin.trim() : '';
  if (!baslik || !metin || baslik.length > METIN_TAVANI || metin.length > METIN_TAVANI) return undefined;
  return { baslik, metin };
}

/** Tek öğe; geçersizse null. Bir dil bozuksa öteki alınır, ikisi de bozuksa öğe düşer. */
export function kabukDuyurusu(x: unknown): EkranDuyuru | null {
  if (!nesne(x) || x.tur !== 'duyuru') return null;
  if (typeof x.id !== 'string' || !KIMLIK.test(x.id)) return null;
  if (typeof x.baslangic !== 'string' || typeof x.son !== 'string' || !TARIH.test(x.baslangic) || !TARIH.test(x.son)) return null;
  if (!Array.isArray(x.hedef)) return null;
  const hedef: EkranDuyuru['hedef'] = [];
  for (const h of x.hedef) {
    if (typeof h !== 'string' || (EKRANLAR as readonly string[]).indexOf(h) < 0) return null;
    hedef.push(h as EkranDuyuru['hedef'][number]);
  }
  const tr = dil(x.tr);
  const fr = dil(x.fr);
  if (!tr && !fr) return null;
  const d: EkranDuyuru = { id: FS_ONEKI + x.id, tur: 'duyuru', baslangic: x.baslangic, son: x.son, hedef };
  if (tr) d.tr = tr;
  if (fr) d.fr = fr;
  return d;
}

/** Yük (dize ya da zaten çözülmüş nesne) → {rev, duyurular}; yük bozuksa null. Yinelenen kimlikte ilki kalır. */
export function kabukYukunuCoz(yuk: unknown): KabukYuku | null {
  let govde: unknown = yuk;
  if (typeof yuk === 'string') {
    if (yuk.length > YUK_TAVANI) return null;
    try { govde = JSON.parse(yuk); } catch { return null; }
  }
  if (!nesne(govde)) return null;
  const rev = govde.rev;
  if (typeof rev !== 'number' || !Number.isInteger(rev) || rev < 0) return null;
  if (!Array.isArray(govde.duyurular)) return null;
  const gorulen: Record<string, true> = Object.create(null) as Record<string, true>;
  const duyurular: EkranDuyuru[] = [];
  for (const o of govde.duyurular) {
    if (duyurular.length >= EN_COK_KABUK_DUYURUSU) break;
    const d = kabukDuyurusu(o);
    if (!d || gorulen[d.id]) continue;
    gorulen[d.id] = true;
    duyurular.push(d);
  }
  return { rev, duyurular };
}

/** `pencere.UluKabukAl`'ı kurar. Yalnız ÖNCEKİNDEN BÜYÜK rev kabul edilir (kabuk yeniden itse de, eski yük geç gelse de
 *  liste geri gitmez); kabul edilince `durum` güncellenir ve `degisti` bir kez çağrılır. Hiçbir şey fırlatmaz. */
export function kabukKur(pencere: object, durum: KabukDurumu, degisti: () => void): void {
  (pencere as { UluKabukAl?: (yuk: unknown) => void }).UluKabukAl = (yuk: unknown): void => {
    try {
      const g = kabukYukunuCoz(yuk);
      if (!g || g.rev <= durum.rev) return;
      durum.rev = g.rev;
      durum.duyurular = g.duyurular;
      degisti();
    } catch (hata) {
      console.error(hata);
    }
  };
}
