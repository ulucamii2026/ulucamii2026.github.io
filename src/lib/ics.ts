/** Basit .ics (iCalendar) üretici — etkinlik detay sayfasındaki "Takvime ekle" bağlantısı için.
 *  Sunucu/derleme bağımlılığı yok: üretilen metin data:text/calendar URI ile doğrudan tarayıcıya
 *  verilir. `saat` alanı serbest metin olduğundan (ör. "14:00" veya "14:00-16:00") güvenilir
 *  biçimde yalnız BAŞLANGIÇ saatini ayrıştırır; ayrıştıramazsa tüm-gün etkinlik üretir — yanlış
 *  saat göstermektense "tüm gün" göstermek daha güvenli.
 */

export interface IcsEtkinlik {
  slug: string;
  baslik: string;
  baslangic: Date;
  bitis?: Date;
  saat?: string;
  yer?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function damgaUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** İçerik tarihleri (frontmatter) UTC gece yarısı olarak ayrıştırılır; derleme makinesinin saat
 *  dilimi ne olursa olsun aynı takvim gününü vermek için UTC alanları okunur. */
function tarihYerel(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

export function kacisIcs(metin: string): string {
  return metin.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** "14:00", "14.00", "14:00-16:00" ya da "Yatsı namazı, saat 18.30" gibi serbest metinden İLK
 *  saat:dakika değerini çıkarır (içerikte saat çoğu kez cümlenin ortasında geçer). */
export function saatAyristir(saat: string | undefined): { saat: number; dakika: number } | null {
  const m = saat?.match(/(?:^|\D)(\d{1,2})[:.](\d{2})(?!\d)/);
  if (!m) return null;
  const saatDeger = Number(m[1]);
  const dakikaDeger = Number(m[2]);
  if (saatDeger > 23 || dakikaDeger > 59) return null;
  return { saat: saatDeger, dakika: dakikaDeger };
}

/** y/ay/gün/saat/dakika değerlerini Europe/Brussels YEREL saati olarak yorumlayıp doğru UTC
 *  anına çevirir (DST'ye duyarlı — CET +01:00 / CEST +02:00) — derleme makinesinin sistem saat
 *  dilimine (ör. GitHub Actions runner'ı UTC) bağımlı değildir (sayfa-ozellik#1). `ay` 0 tabanlıdır
 *  (JS Date ile aynı: Ocak=0). */
export function brukselYerelSaatiUtcyeCevir(yil: number, ay: number, gun: number, saat: number, dakika: number): Date {
  const tahminiUtc = Date.UTC(yil, ay, gun, saat, dakika);
  const bicimlendirici = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parcalar: Record<string, string> = {};
  for (const p of bicimlendirici.formatToParts(new Date(tahminiUtc))) parcalar[p.type] = p.value;
  // Intl bazen gece yarısını '24' saati olarak döndürür.
  const saatParcasi = parcalar.hour === '24' ? 0 : Number(parcalar.hour);
  const brukselYorumuUtc = Date.UTC(Number(parcalar.year), Number(parcalar.month) - 1, Number(parcalar.day), saatParcasi, Number(parcalar.minute), Number(parcalar.second));
  const ofsetFarki = brukselYorumuUtc - tahminiUtc;
  return new Date(tahminiUtc - ofsetFarki);
}

/** RFC 5545 §3.1: bir içerik satırı 75 oktetten uzunsa CRLF + tek boşlukla devam satırlarına
 *  katlanır. Çok baytlı UTF-8 karakterin ortasından bölünmez (sayfa-ozellik#5). */
export function katla(satir: string): string {
  const bytes = new TextEncoder().encode(satir);
  if (bytes.length <= 75) return satir;
  const parcalar: string[] = [];
  let start = 0;
  let sinir = 75;
  while (start < bytes.length) {
    let kesim = Math.min(start + sinir, bytes.length);
    // Çok baytlı UTF-8 dizisinin ortasına düşmemek için geri çekil (devam baytları 0b10xxxxxx ile başlar).
    while (kesim < bytes.length && (bytes[kesim] & 0xc0) === 0x80) {
      kesim--;
    }
    parcalar.push(new TextDecoder('utf-8').decode(bytes.subarray(start, kesim)));
    start = kesim;
    sinir = 74; // devam satırındaki tek boşluk da bir oktet sayılır
  }
  return parcalar.join('\r\n ');
}

/** Cuma namazı takvim aboneliği (/cuma.ics, 1 Kasım 2026): verideki her Cuma için bir etkinlik, başlangıç
 *  Cuma vakti (sabit saat ya da Diyanet öğle), süre bir saat, 30 dk önce hatırlatma. Telefon takvimi aboneliği
 *  günlük derlemeyle tazelenir; veri yoksa takvim boş kalır (saat uydurulmaz). */
export function cumaTakvimiUret(cumalar: Array<{ tarih: string; saat: string }>, adres: string, simdi = new Date()): string {
  const satirlar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ulu Camii Marche-en-Famenne//ulucamii.be//CUMA', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Cuma namazı · Prière du vendredi — Ulu Camii', 'X-WR-TIMEZONE:Europe/Brussels',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
  ];
  for (const c of cumalar) {
    const z = saatAyristir(c.saat);
    if (!z) continue;
    const [y, a, g] = c.tarih.split('-').map(Number);
    const bas = brukselYerelSaatiUtcyeCevir(y, a - 1, g, z.saat, z.dakika);
    satirlar.push(
      'BEGIN:VEVENT', `UID:cuma-${c.tarih}@ulucamii.be`, `DTSTAMP:${damgaUtc(simdi)}`,
      `DTSTART:${damgaUtc(bas)}`, `DTEND:${damgaUtc(new Date(bas.getTime() + 3_600_000))}`,
      `SUMMARY:${kacisIcs(`Cuma namazı · Prière du vendredi ${c.saat}`)}`,
      `LOCATION:${kacisIcs(adres)}`,
      `DESCRIPTION:${kacisIcs('Hutbe öğle vaktinde başlar; Türkçe hutbenin ardından Fransızca hutbe okunur.\nLe prêche commence à l’heure de Dhuhr ; un sermon en français suit le sermon en turc.\nhttps://ulucamii.be/')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${kacisIcs('Cuma namazı · Prière du vendredi')}`, 'TRIGGER:-PT30M', 'END:VALARM',
      'END:VEVENT',
    );
  }
  satirlar.push('END:VCALENDAR');
  return satirlar.map(katla).join('\r\n') + '\r\n';
}

export function etkinlikIcsUret(e: IcsEtkinlik, dil: 'tr' | 'fr' | 'en'): string {
  // Çok günlü etkinlikte `saat` çoğu kez tekrarlayan/aralıklı bir programı anlatır
  // (ör. "Cuma günleri, saat 12.00"); tek bir saati hem başlangıca hem bitişe uygulamak
  // haftalarca süren kesintisiz tek bir randevu üretir. Bu durumda tüm-gün dalına düşülür
  // ("yanlış saat göstermektense tüm gün" — bu dosyanın kuralı).
  const cokGunlu = !!e.bitis && e.bitis.getTime() !== e.baslangic.getTime();
  const ayristirilan = cokGunlu ? null : saatAyristir(e.saat);
  const satirlar: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Ulu Camii Marche-en-Famenne//ulucamii.be//${dil.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${e.slug}@ulucamii.be`,
    `DTSTAMP:${damgaUtc(new Date())}`,
  ];
  if (ayristirilan) {
    const bas = brukselYerelSaatiUtcyeCevir(
      e.baslangic.getUTCFullYear(), e.baslangic.getUTCMonth(), e.baslangic.getUTCDate(),
      ayristirilan.saat, ayristirilan.dakika,
    );
    // Saatli tek gün etkinliği: bitiş için 2 saatlik makul varsayılan. Bu dala yalnız `cokGunlu`
    // false iken girilir; yani `bitis` ya yok ya da başlangıçla aynı gün — her iki durumda da ayrı
    // bir bitiş anı yoktur, `bitis`'i başlangıç saatiyle hesaplamak sıfır süreli etkinlik üretirdi.
    const bit = new Date(bas.getTime() + 2 * 60 * 60 * 1000);
    satirlar.push(`DTSTART:${damgaUtc(bas)}`, `DTEND:${damgaUtc(bit)}`);
  } else {
    // Saat ayrıştırılamadı: tüm-gün etkinlik olarak üret. DTEND (VALUE=DATE) dışlayıcıdır, bir gün eklenir.
    const bitTarih = e.bitis ?? e.baslangic;
    const bitSonraki = new Date(bitTarih.getTime() + 24 * 60 * 60 * 1000);
    satirlar.push(`DTSTART;VALUE=DATE:${tarihYerel(e.baslangic)}`, `DTEND;VALUE=DATE:${tarihYerel(bitSonraki)}`);
  }
  satirlar.push(`SUMMARY:${kacisIcs(e.baslik)}`);
  if (e.yer) satirlar.push(`LOCATION:${kacisIcs(e.yer)}`);
  satirlar.push('END:VEVENT', 'END:VCALENDAR');
  return satirlar.map(katla).join('\r\n');
}
