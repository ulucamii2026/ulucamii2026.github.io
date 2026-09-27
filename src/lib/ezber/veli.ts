/**
 * Ezber Kilimi — veli görünümünün saf yardımcıları (27 Eylül 2026, Faz 1d): son dinlemelerin yumuşak dilli satırları
 * ve kilimin metin karşılığı olan şerit listesi. Beş dilde; öğrenci adı hiçbir satıra girmez. Veli hocanın düğme
 * adını («Tekrar gelsin») görmez, karşılığını görür («Bir kez daha çalışalım»); geçiş olayları (eski kayıttan
 * taşıma) listelenmez. Kurallar: docs/EZBER-KILIMI.md.
 */
import type { Dil } from '../../i18n/ui';
import { KATALOG, ezberBul } from './katalog';
import { bolumOzetleri, gorunenBasamak, type Basamak, type EzberOlayi, type Kalite, type OgeDurumu } from './durum';
import { BASAMAK_ADLARI, KALITE_VELI, KILIM_METINLERI, durakAdi, notMetni } from './metinler';
import { SERIT_MOTIFI, kilimSeritleri } from './kilim';
import type { MotifAdi } from './motifler';

export interface VeliDinlemesi {
  readonly tarih: string;
  readonly ad: string;
  /** «çok güzel okudu», «çalışmaya başladı», «hoca kaydı güncelledi (Pekişti)». */
  readonly metin: string;
  /** Kalıp notların velinin dilindeki cümleleri (bilinmeyen anahtar atlanır). */
  readonly notlar: readonly string[];
}

const kucukBasla = (t: string, dil: Dil) => t.charAt(0).toLocaleLowerCase(dil) + t.slice(1);

/** Olaylar yeniden eskiye sıralı gelir; en çok `sinir` satır. */
export function veliDinlemeleri(olaylar: readonly EzberOlayi[], dil: Dil, sinir = 5): VeliDinlemesi[] {
  const sonuc: VeliDinlemesi[] = [];
  for (const o of olaylar) {
    if (sonuc.length >= sinir) break;
    const m = ezberBul(o.ezber);
    if (!m || o.tur === 'gecis') continue;
    const metin = o.tur === 'dinleme' && o.kalite ? kucukBasla(KALITE_VELI[o.kalite as Kalite][dil], dil)
      : o.tur === 'atama' ? KILIM_METINLERI.basladi[dil]
      : `${KILIM_METINLERI.guncellendi[dil]} (${BASAMAK_ADLARI[o.basamakSonra][dil]})`;
    const notlar = o.tur === 'dinleme' ? o.notlar.map((n) => notMetni(n, dil)).filter((x): x is string => Boolean(x)) : [];
    sonuc.push({ tarih: o.tarih, ad: m.ad[dil], metin, notlar });
  }
  return sonuc;
}

export interface VeliSeridi {
  readonly anahtar: string;
  /** «1 · İlk adım: iman ve besmele», «8.2 · Amme cüzü · 2. durak», «Kenar suyu». */
  readonly ad: string;
  /** Şeridin kilimdeki motifi (listede aynı doku gösterilir). */
  readonly motif: MotifAdi;
  readonly odullu: boolean;
  readonly rozet: boolean;
  readonly muhur: boolean;
  readonly altin: boolean;
  /** Kaydı olan (≥ Çalışıyor) madde sayısı. */
  readonly baslanan: number;
  readonly maddeler: readonly { readonly id: string; readonly ad: string; readonly basamak: Basamak; readonly basamakAdi: string }[];
}

/** Kilimin şeritleri (1–7, Amme durakları) ve en sonda kenar suyu; madde sırası katalog sırası. */
export function veliSeritleri(ogeler: Readonly<Record<string, OgeDurumu>>, dil: Dil): VeliSeridi[] {
  const ozetler = bolumOzetleri(ogeler);
  const kenar = ozetler.filter((o) => o.bolum.seviye === 'kenar');
  return [...kilimSeritleri(ozetler), ...kenar].map((oz) => {
    const b = oz.bolum;
    const seviyeAdi = KATALOG.seviyeler.find((x) => x.kimlik === b.seviye)?.ad[dil] ?? String(b.seviye);
    const ad = b.seviye === 'kenar' ? seviyeAdi : b.durak !== undefined ? `${b.anahtar} · ${seviyeAdi} · ${durakAdi(b.durak, dil)}` : `${b.anahtar} · ${seviyeAdi}`;
    const maddeler = b.ogeler.flatMap((id) => {
      const m = ezberBul(id);
      if (!m) return [];
      const basamak = gorunenBasamak(ogeler, id);
      return [{ id, ad: m.ad[dil], basamak, basamakAdi: BASAMAK_ADLARI[basamak][dil] }];
    });
    return { anahtar: b.anahtar, ad, motif: SERIT_MOTIFI[b.seviye], odullu: b.odullu, rozet: oz.rozet, muhur: oz.sertifika, altin: oz.altin,
      baslanan: maddeler.filter((x) => x.basamak > 0).length, maddeler };
  });
}
