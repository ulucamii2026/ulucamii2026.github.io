/**
 * Dilim 4 taşıması (P7a/P7b): veli portalı, hoca ekranı, Kur'an kursu sayfaları ve /e/<kod>/ sesli dersleri egitim.ulucamii.be'ye taşındı.
 * Bu dosya tek anahtardır. TASIMA_ACIK true iken: (a) ulucamii.be'deki eski adreslerin derlenmiş çıktısı derleme sonunda yönlendirme sayfasıyla
 * değişir (astro.config.mjs → entegrasyon «egitim-yonlendirme»; sayfa: lib/egitim-yonlendir-html.ts), (b) yol() (i18n/utils.ts) taşınan sayfalar için egitim adresi verir.
 * false yapılınca eski sayfalar (sayfalar/Veli, KuranKursu, Mufredat, YillikPlan, DersMateryalleri, KursGunlugu, pages/hoca, pages/e) aynen yayınlanır ve
 * bağlantılar eski yerel adreslere döner: geri alma = bu tek satır + yeniden derleme. Eski bileşenler taşımadan bir hafta sonra silinir
 * (docs/ILIM-YOLU.md «Dilim 4 · geçiş»). Yönlendirme sayfaları ve basılı karekodlar sonsuza dek kalır.
 */
import type { Dil, SayfaAnahtari } from '../i18n/ui';

export const TASIMA_ACIK = true;

export const EGITIM_KOKU = 'https://egitim.ulucamii.be';

/** Ana site sayfa anahtarı → egitim yolu (dil önekinden sonrası). egitim/src/lib/kurs-yollari.ts ile aynı tablo (test: tasima-yonlendirme). */
export const EGITIM_SAYFALARI: Partial<Record<SayfaAnahtari, string>> = {
  kurankursu: 'kurs',
  mufredat: 'kurs/mufredat',
  yillikplan: 'kurs/yillik-plan',
  dersmateryalleri: 'kurs/materyaller',
  kursgunlugu: 'kurs/gunluk',
  veli: 'veli',
};

/** Hesap taşıyan sayfalar: oturum ve cihaz verisi köken bazlıdır; yönlendirme sayfasında bekleyen yazım uyarısı çıkabilir. */
export const HESAP_SAYFALARI: readonly SayfaAnahtari[] = ['veli'];

/** Taşınan sayfanın egitim adresi (sonu `/`); taşınmamış anahtar için undefined. */
export function egitimAdresi(dil: Dil, anahtar: SayfaAnahtari): string | undefined {
  const y = EGITIM_SAYFALARI[anahtar];
  return y ? `${EGITIM_KOKU}/${dil}/${y}/` : undefined;
}

export const egitimHocaAdresi = `${EGITIM_KOKU}/hoca/`;
export const egitimSesliDersAdresi = (kod: string): string => `${EGITIM_KOKU}/e/${kod}/`;

export interface Yonlendirme {
  /** dist/ içindeki dosya (kök dizine göre, `/` ile): üzerine yönlendirme sayfası yazılır. */
  dosya: string;
  hedef: string;
  dil: Dil;
  hesap: boolean;
}

/**
 * Yönlendirme sayfasına dönüşecek ulucamii.be sayfalarının tam listesi: 5 dil × 6 sayfa, /hoca/, /e/ ve her basılı karekod.
 * `kodlar`: src/data/ecouter.json'un `kodlar` nesnesi; ulucamii.be'ye giden kod (`test` → seviye testi, `yonlendir` dolu) ulucamii.be'de kalır.
 * Yazma işi astro.config.mjs'teki `egitim-yonlendirme` entegrasyonundadır (derleme sonunda, site haritasından ÖNCE):
 * eski sayfa bileşenleri yerinde derlenir, çıktıları bu sayfalarla değişir → bileşenlerin CSS/JS'i yönlendirme sayfasına sızmaz.
 */
export function yonlendirmeler(yollar: Record<string, Record<Dil, string>>, diller: readonly Dil[], kodlar: Record<string, { yonlendir?: string }>): Yonlendirme[] {
  const liste: Yonlendirme[] = [];
  for (const dil of diller) {
    for (const anahtar of Object.keys(EGITIM_SAYFALARI) as SayfaAnahtari[]) {
      liste.push({ dosya: `${dil}/${yollar[anahtar][dil]}/index.html`, hedef: egitimAdresi(dil, anahtar)!, dil, hesap: HESAP_SAYFALARI.includes(anahtar) });
    }
  }
  liste.push({ dosya: 'hoca/index.html', hedef: egitimHocaAdresi, dil: 'tr', hesap: true });
  liste.push({ dosya: 'e/index.html', hedef: `${EGITIM_KOKU}/e/`, dil: 'fr', hesap: false });
  for (const [kod, icerik] of Object.entries(kodlar)) if (!icerik.yonlendir) liste.push({ dosya: `e/${kod}/index.html`, hedef: egitimSesliDersAdresi(kod), dil: 'fr', hesap: false });
  return liste;
}
