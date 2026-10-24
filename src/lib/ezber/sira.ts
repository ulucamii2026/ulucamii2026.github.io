/**
 * Dinle–tekrarla çaların «senin sıran» arası (Faz 2e, 24 Ekim 2026). Hâfızın bir bölümü okuması bitince çocuk aynı bölümü sesli
 * tekrar eder; bekleme süresi kaydın kendi süresinin katıdır (×1 / ×1,5 / ×2), sabit 3 sn değil: uzun âyette 3 sn yetmez, kısa
 * olanda çok uzar (plan: docs/EGITIM-FAZ2-DINLEME.md «Dilim 2e»). Katsayı 0 ise bekleme yoktur. Süre bilinmiyorsa (kayıt henüz
 * ölçülemedi) eski sabit 3 sn kullanılır. Çalma 0,75× ise kayıt gerçekte daha uzun sürer ve çocuk da öyle tekrarlar: süre hıza bölünür.
 * Süre sınırları: en az 2 sn (çok kısa kayıtta çocuğa soluk alacak zaman), en çok 90 sn (sayfa unutulup beklemesin).
 */

/** Seçilebilir katsayılar; 0 = bekleme yok. Sayfadaki seçenekler bununla birebir aynıdır (testle sabit). */
export const SIRA_KATSAYILARI = [0, 1, 1.5, 2] as const;
export const SIRA_VARSAYILAN = 1;
export const SIRA_YEDEK_MS = 3000;
export const SIRA_ALT_MS = 2000;
export const SIRA_UST_MS = 90_000;

/** Katsayı listede mi (sayfadaki seçim kutusundan gelen metin dahil); değilse varsayılan. */
export function siraKatsayisi(deger: unknown): number {
  // Boş metin Number('') = 0 olurdu ve «bekleme yok» diye okunurdu; bozuk girdi varsayılana gitmeli.
  const n = typeof deger === 'string' ? (deger.trim() ? Number(deger.replace(',', '.')) : Number.NaN) : deger;
  return typeof n === 'number' && (SIRA_KATSAYILARI as readonly number[]).includes(n) ? n : SIRA_VARSAYILAN;
}

/** Bekleme süresi, milisaniye. `sureSn` kaydın saniye cinsinden süresi (ölçülemiyorsa NaN/0/∞ gelebilir). */
export function siraSuresiMs(sureSn: number, katsayi: number, hiz = 1): number {
  if (!(katsayi > 0)) return 0;
  if (!Number.isFinite(sureSn) || sureSn <= 0) return SIRA_YEDEK_MS;
  const ms = (sureSn / (hiz > 0 ? hiz : 1)) * katsayi * 1000;
  return Math.round(Math.min(SIRA_UST_MS, Math.max(SIRA_ALT_MS, ms)));
}
