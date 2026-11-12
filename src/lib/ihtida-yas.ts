/** İhtida başvurusunda en küçük yaş — istemci tarafı (12 Kasım 2026, din görevlisi kararı: «18 yaşından küçükler başvuru yapamasın»).
 *  Sunucudaki karşılığı: scripts/apps-script/ulucamii-Kod-v48.gs → IHTIDA_ASGARI_YAS / ihtidaYasKontrol (aynı kural, ayrı sabit).
 *  Yaş, başvuru günü (Europe/Brussels) esas alınarak hesaplanır; tarihler «yyyy-MM-dd» metni olarak karşılaştırılır, saat dilimi kayması olmaz. */
export const IHTIDA_ASGARI_YAS = 18;

export type IhtidaYasDurumu = 'tamam' | 'format' | 'gelecek' | 'yas-siniri';

/** Başvuru günü: Europe/Brussels takvim günü (tarayıcının saat diliminden bağımsız). */
export function brukselBugun(simdi: Date = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(simdi);
  const al = (t: string) => p.find(x => x.type === t)?.value ?? '';
  return `${al('year')}-${al('month')}-${al('day')}`;
}

function gecerliTarih(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** 18. yaş günü. 29 Şubat doğumlu kişinin 18. yılı artık yıl değilse yaş günü 1 Mart sayılır (18 yaşı 1 Mart'ta doldurur). */
export function yasGunu(dogumIso: string, yas: number = IHTIDA_ASGARI_YAS): string {
  const yil = +dogumIso.slice(0, 4) + yas;
  let ay = dogumIso.slice(5, 7), gun = dogumIso.slice(8, 10);
  const artik = (yil % 4 === 0 && yil % 100 !== 0) || yil % 400 === 0;
  if (ay === '02' && gun === '29' && !artik) { ay = '03'; gun = '01'; }
  return `${String(yil).padStart(4, '0')}-${ay}-${gun}`;
}

/** Tam 18. yaş günü kabul, bir gün eksik ret. Geçersiz ya da gelecekteki tarih «yas-siniri» sayılmaz (alanın kendi hatası gösterilir). */
export function ihtidaYasDurumu(dogumIso: string, bugunIso: string = brukselBugun()): IhtidaYasDurumu {
  const dogum = String(dogumIso ?? '').trim();
  if (!gecerliTarih(dogum)) return 'format';
  if (dogum > bugunIso) return 'gelecek';
  return bugunIso < yasGunu(dogum) ? 'yas-siniri' : 'tamam';
}
