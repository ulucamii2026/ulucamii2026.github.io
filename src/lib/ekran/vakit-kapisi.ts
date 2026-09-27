/**
 * Cami ekranının vakit akışı (/ekran/vakitler.json) için Diyanet kapısı — 27 Eylül 2026.
 *
 * KALICI KURAL: vakitler yalnız Diyanet İşleri Başkanlığı verisidir (ilçe 11890, M.FAMENNE). Kaynağı
 * Diyanet olmayan ya da başka ilçenin dosyası derlemeyi durdurur (src/lib/icerik.ts → namazVakitleri()
 * ile aynı karar). Biçimi/sırası bozuk ya da mükerrer bir gün yayımlanmaz ve hesapla onarılmaz: ekran
 * o gün "Namaz vakitleri güncellenemedi" der. Ekran internetsiz haftalarca çalışabilsin diye sitedeki
 * 46 günlük pencere yerine dünden itibaren eldeki bütün günler verilir.
 */
import { SIRA, type Gun } from '../namaz.ts';

export const DIYANET_ILCE = '11890';
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
const TARIH = /^\d{4}-\d{2}-\d{2}$/;

export interface VakitKaynagi {
  kaynak: string;
  kaynakTuru?: string;
  ilce: string;
  ilceAdi?: string;
  guncelleme: string;
  gunler: Gun[];
}

export interface EkranVakitleri {
  kaynak: string;
  kaynakTuru: 'diyanet';
  ilce: string;
  ilceAdi?: string;
  guncelleme: string;
  gunler: Gun[];
  /** Yayımlanmayan (bozuk ya da mükerrer) günler; site denetimi bunları raporlar. */
  atlanan: string[];
}

/** Altı vakit HH:MM biçiminde ve imsak < güneş < öğle < ikindi < akşam < yatsı sırasında mı */
export function gunGecerliMi(g: Gun): boolean {
  if (!TARIH.test(g.tarih) || typeof g.hicri !== 'string') return false;
  for (let i = 0; i < SIRA.length; i++) {
    const saat = g[SIRA[i]];
    if (typeof saat !== 'string' || !SAAT.test(saat)) return false;
    if (i > 0 && !(g[SIRA[i - 1]] < saat)) return false;
  }
  return true;
}

const oncekiGun = (tarih: string): string =>
  new Date(Date.parse(tarih + 'T12:00:00Z') - 86_400_000).toISOString().slice(0, 10);

export function ekranVakitleri(veri: VakitKaynagi, bugun: string): EkranVakitleri {
  if (veri.kaynakTuru !== 'diyanet') {
    throw new Error(`EKRAN VAKİTLERİ REDDEDİLDİ: kaynakTuru="${veri.kaynakTuru ?? 'yok'}" (beklenen: "diyanet"). Build durduruldu.`);
  }
  if (veri.ilce !== DIYANET_ILCE) {
    throw new Error(`EKRAN VAKİTLERİ REDDEDİLDİ: ilçe "${veri.ilce}" (beklenen: "${DIYANET_ILCE}", M.FAMENNE). Build durduruldu.`);
  }
  const dun = oncekiGun(bugun);
  const aday = veri.gunler.filter((g) => typeof g.tarih === 'string' && g.tarih >= dun);
  const sayi = new Map<string, number>();
  for (const g of aday) sayi.set(g.tarih, (sayi.get(g.tarih) ?? 0) + 1);
  const atlanan = new Set<string>();
  const gunler: Gun[] = [];
  for (const g of [...aday].sort((a, b) => a.tarih.localeCompare(b.tarih))) {
    if ((sayi.get(g.tarih) ?? 0) > 1 || !gunGecerliMi(g)) { atlanan.add(g.tarih); continue; }
    gunler.push({ tarih: g.tarih, hicri: g.hicri, imsak: g.imsak, gunes: g.gunes, ogle: g.ogle, ikindi: g.ikindi, aksam: g.aksam, yatsi: g.yatsi });
  }
  if (gunler.length < 7) {
    throw new Error(`EKRAN VAKİTLERİ REDDEDİLDİ: dünden itibaren yalnız ${gunler.length} geçerli gün var. Build durduruldu.`);
  }
  return { kaynak: veri.kaynak, kaynakTuru: 'diyanet', ilce: veri.ilce, ilceAdi: veri.ilceAdi, guncelleme: veri.guncelleme, gunler, atlanan: [...atlanan].sort() };
}
