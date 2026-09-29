/** Ekran levhasının kaynak satırları (A alt projesi). İçerik doğrulaması (icerik.ts, bütçe ölçümü) ve çizici
 *  (src/ekran/slaytlar.ts) aynı dizeyi kullanır: ölçülen ile ekranda görünen aynıdır. */
export interface Referans { tr: string; fr: string }

/** «İnşirah, 94/5-6» ve «Ach-Charh, 94:5-6»: aralık tireyle; TR'de eğik çizgi, FR'de iki nokta. */
export function referans(sureAdi: Referans, sure: number, ayetler: number[]): Referans {
  const ek = ayetler.length > 1 ? `${ayetler[0]}-${ayetler[ayetler.length - 1]}` : String(ayetler[0]);
  return { tr: `${sureAdi.tr}, ${sure}/${ek}`, fr: `${sureAdi.fr}, ${sure}:${ek}` };
}

/** Ayet ve Kur'an duası: «TR referans · FR referans — TR meal kaynağı»; FR meal gösteriliyorsa « · FR meal kaynağı». */
export function ayetKaynagi(a: { referans: Referans; kaynakTr: string; fr?: string; kaynakFr?: string }): string {
  return `${a.referans.tr} · ${a.referans.fr} — ${a.kaynakTr}${a.fr && a.kaynakFr ? ' · ' + a.kaynakFr : ''}`;
}
