/**
 * Cami ekranının duyuru akışı (/ekran/akis.json) — 27 Eylül 2026.
 *
 * Sveltia'da TR ve FR duyuru ayrı dosyadır (src/content/duyurular/{tr,fr}/slug.md); ekran ikisini
 * slug'dan eşler ve aynı slaytta alt alta gösterir. Yalnız «Cami ekranında göster» işaretli, taslak
 * olmayan ve gösterim aralığı bitmemiş duyurular girer. Aralık ekranda da yeniden denetlenir
 * (src/lib/ekran/secim.ts → aktifMi): internet kesilse bile süresi dolan duyuru kalkar.
 * Ekrana sığmayan duyuru (başlık > 60 ya da metin > 180 karakter, src/lib/ekran/butce.ts) akışa girmez; derleme uyarır,
 * site denetimi raporlar.
 */
import { duyuruAsimlari, duyuruParcalari } from './butce.ts';

export const EKRANLAR = ['ana', 'giris', 'kadin'] as const;
export type EkranId = (typeof EKRANLAR)[number];

export interface DuyuruGirdisi {
  id: string;
  data: {
    baslik: string;
    tarih: Date;
    ozet?: string;
    kapak?: string;
    taslak: boolean;
    ekranda?: boolean;
    ekranBaslangic?: Date;
    ekranSon?: Date;
    ekranHedef?: readonly EkranId[];
    ekranBasligi?: string;
    ekranMetni?: string;
  };
}

export interface EkranMetni { baslik: string; metin: string }

export interface EkranDuyuru {
  id: string;
  tur: 'duyuru';
  tr?: EkranMetni;
  fr?: EkranMetni;
  gorsel?: string;
  /** Görselin genişlik ÷ yükseklik oranı (derlemede, src/lib/ekran/gorsel-orani.ts): afiş kutusu görsel yüklenmeden
   *  boyutlanır. Yoksa ekran olcu.ts → AFIS_ORANI kullanır. */
  gorselOran?: number;
  /** Brüksel takvim günü, iki uç dâhil */
  baslangic: string;
  son: string;
  /** Boşsa bütün ekranlar */
  hedef: EkranId[];
}

const brukselGunu = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const gunEkle = (tarih: string, gun: number): string =>
  new Date(Date.parse(tarih + 'T12:00:00Z') + gun * 86_400_000).toISOString().slice(0, 10);

/** Ekran başlığı boşsa sitedeki başlık, ekran metni boşsa özet (CMS boş alanı "" ya da boşluk olarak yazabilir). */
function metin(g: DuyuruGirdisi | undefined): EkranMetni | undefined {
  if (!g || g.data.taslak) return undefined;
  return { baslik: (g.data.ekranBasligi || '').trim() || g.data.baslik, metin: (g.data.ekranMetni || '').trim() || (g.data.ozet || '').trim() };
}

/** `dusen` verilirse ekrana sığmadığı için akışa girmeyen duyurular `<slug> (ekrana sığmaz: TR metin 212/180)`
 *  biçiminde oraya yazılır (src/pages/ekran/akis.json.ts uyarır ve akışa ekler). */
export function ekranDuyurulari(girdiler: DuyuruGirdisi[], bugun: string, varsayilanGun: number, dusen?: string[]): EkranDuyuru[] {
  const gruplar = new Map<string, { tr?: DuyuruGirdisi; fr?: DuyuruGirdisi }>();
  for (const g of girdiler) {
    const bolu = g.id.indexOf('/');
    const dil = g.id.slice(0, bolu);
    if (bolu < 1 || (dil !== 'tr' && dil !== 'fr')) continue;
    const slug = g.id.slice(bolu + 1);
    const grup = gruplar.get(slug) ?? {};
    grup[dil] = g;
    gruplar.set(slug, grup);
  }
  const sonuc: EkranDuyuru[] = [];
  for (const [slug, grup] of gruplar) {
    const ana = grup.tr ?? grup.fr;
    if (!ana || !ana.data.ekranda || ana.data.taslak) continue;
    const baslangic = brukselGunu(ana.data.ekranBaslangic ?? ana.data.tarih);
    const son = ana.data.ekranSon ? brukselGunu(ana.data.ekranSon) : gunEkle(baslangic, varsayilanGun - 1);
    if (son < bugun || son < baslangic) continue;
    const d: EkranDuyuru = { id: slug, tur: 'duyuru', tr: metin(grup.tr), fr: metin(grup.fr), gorsel: ana.data.kapak, baslangic, son, hedef: [...(ana.data.ekranHedef ?? [])] };
    if (!duyuruParcalari(d).length) {
      if (dusen) dusen.push(`${slug} (ekrana sığmaz: ${duyuruAsimlari(d).join(', ')})`);
      continue;
    }
    sonuc.push(d);
  }
  return sonuc.sort((a, b) => b.baslangic.localeCompare(a.baslangic) || a.id.localeCompare(b.id));
}
