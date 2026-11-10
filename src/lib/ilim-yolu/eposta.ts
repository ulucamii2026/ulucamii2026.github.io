/**
 * İlim Yolu haftalık e-posta — SAF mantık (Dilim 2, 10 Kasım 2026; docs/ILIM-YOLU.md «Haftalık e-posta»). Yan etkisi yok: zaman,
 * hafta kimliği, ilerleme özeti ve abonelikten çıkış sayfası metinleri. `functions/src/eposta.ts` kullanır; testler
 * `tests/fonksiyonlar/eposta-saf.test.mjs`. Tarayıcı paketine girmez.
 */
export const EPOSTA_DILLERI = ['tr', 'fr', 'en', 'nl', 'de'] as const;
export type EpostaDili = (typeof EPOSTA_DILLERI)[number];
export const epostaDiliMi = (d: unknown): d is EpostaDili => typeof d === 'string' && (EPOSTA_DILLERI as readonly string[]).includes(d);

export const BRUKSEL = 'Europe/Brussels';
const SAAT_MS = 3_600_000;
const GUN_MS = 24 * SAAT_MS;
/** Tercih varsayılanı (egitim/src/scripts/hesap.ts ile aynı): Pazar 18.00. gun: 0 = Pazar … 6 = Cumartesi. */
export const VARSAYILAN_GUN = 0;
export const VARSAYILAN_SAAT = 18;

const bicimleyici = new Intl.DateTimeFormat('en-GB', {
  timeZone: BRUKSEL, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
});

export interface BrukselZamani {
  /** `YYYY-AA-GG` (Brüksel takvimi). */
  readonly tarih: string;
  readonly saat: number;
  /** 0 = Pazar … 6 = Cumartesi. */
  readonly gun: number;
}

/** Anın Brüksel yerel tarihi, saati ve haftanın günü (yaz/kış saati dahil; Intl saat dilimi verisinden). */
export function bruksel(ms: number): BrukselZamani {
  const p: Record<string, string> = {};
  for (const x of bicimleyici.formatToParts(new Date(ms))) p[x.type] = x.value;
  const y = Number(p.year), a = Number(p.month), g = Number(p.day);
  return {
    tarih: `${p.year}-${p.month}-${p.day}`,
    saat: Number(p.hour) % 24,
    gun: new Date(Date.UTC(y, a - 1, g)).getUTCDay(),
  };
}

/** ISO 8601 hafta kimliği (`2026-W45`), `YYYY-AA-GG` tarihinden. Pazartesi başlar; hafta yılı Perşembe'nin yılıdır. */
export function isoHafta(tarih: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tarih);
  if (!m) throw new RangeError('tarih YYYY-AA-GG olmalı');
  const [y, a, g] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const pazartesiSayisi = (new Date(Date.UTC(y, a - 1, g)).getUTCDay() + 6) % 7; // Pzt = 0
  const persembe = new Date(Date.UTC(y, a - 1, g + 3 - pazartesiSayisi));
  const yil = persembe.getUTCFullYear();
  const hafta = Math.floor((persembe.getTime() - Date.UTC(yil, 0, 1)) / GUN_MS / 7) + 1;
  return `${yil}-W${String(hafta).padStart(2, '0')}`;
}

/**
 * Bu çalışmada eşleşecek Brüksel saatleri. Normalde yalnız şimdiki saat. İlkbaharda saat 02.00'dan 03.00'a atlar: 02.00 hiç
 * yaşanmaz, o saati seçen kullanıcı o hafta atlanmasın diye atlama günü 03.00 çalışması 02'yi de kapsar. Sonbaharda 02.00 iki kez
 * yaşanır; ikisi de eşleşir, kuyruk kimliği (kullanıcı + hafta) tekrarı engeller.
 */
export function haftalikSaatler(ms: number): number[] {
  const simdi = bruksel(ms), onceki = bruksel(ms - SAAT_MS);
  const saatler = [simdi.saat];
  if (onceki.tarih === simdi.tarih && simdi.saat - onceki.saat === 2) saatler.push(onceki.saat + 1);
  return saatler;
}

const tam = (x: unknown, enAz: number, enCok: number): x is number => typeof x === 'number' && Number.isInteger(x) && x >= enAz && x <= enCok;

/** Kullanıcının seçtiği gün/saat şimdiki Brüksel anına uyuyor mu (eksik değerler varsayılan: Pazar 18). */
export function zamanUygunMu(tercih: { gun?: unknown; saat?: unknown } | null | undefined, ms: number): boolean {
  const gun = tam(tercih?.gun, 0, 6) ? tercih.gun : VARSAYILAN_GUN;
  const saat = tam(tercih?.saat, 0, 23) ? tercih.saat : VARSAYILAN_SAAT;
  return bruksel(ms).gun === gun && haftalikSaatler(ms).includes(saat);
}

/** Kuyruk belge kimliği: kullanıcı + ISO haftası. Aynı hafta ikinci çalışma aynı kimliği üretir (create → ALREADY_EXISTS). */
export function kuyrukKimligi(uid: string, ms: number): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new RangeError('uid biçimi geçersiz');
  return `h_${uid}_${isoHafta(bruksel(ms).tarih)}`;
}

export type SonrakiAdim = 'tekrar' | 'ezber' | 'bilgi' | 'yol' | 'devam';
export interface Ozet {
  /** Son 7 gün (bugün dahil) içinde çalışılan farklı gün sayısı. */
  readonly gun: number;
  /** Üç çalışma belgesindeki toplam madde sayısı. */
  readonly madde: number;
  /** Tekrar günü gelmiş ezber maddesi sayısı. */
  readonly tekrar: number;
  readonly sonraki: SonrakiAdim;
}
type Belge = { maddeler?: unknown; gunler?: unknown } | null | undefined;
const TARIH = /^\d{4}-\d{2}-\d{2}$/;
const maddeler = (b: Belge): Record<string, unknown> => {
  const m = b?.maddeler;
  return m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>) : {};
};

/**
 * `kullanicilar/{uid}/calisma/{ezber|bilgi|yol}` belgelerinden kısa özet. Belgeleri istemci yazar (kural biçimi denetler) ama burada
 * yine savunmacıyız: bozuk alan sayılmaz. Sonraki adım sırası: tekrarı gelen madde → hiç ezber yok → hiç bilgi yok → hiç yol yok → devam.
 */
export function ozetle(b: { ezber?: Belge; bilgi?: Belge; yol?: Belge }, ms: number): Ozet {
  const bugun = bruksel(ms).tarih;
  const [y, a, g] = bugun.split('-').map(Number);
  const son7 = new Set<string>();
  for (let i = 0; i < 7; i++) son7.add(new Date(Date.UTC(y, a - 1, g - i)).toISOString().slice(0, 10));
  const gunler = new Set<string>();
  for (const belge of [b.ezber, b.bilgi, b.yol]) {
    const l = belge?.gunler;
    if (Array.isArray(l)) for (const x of l) if (typeof x === 'string' && TARIH.test(x) && son7.has(x)) gunler.add(x);
  }
  const ezber = maddeler(b.ezber);
  let tekrar = 0;
  for (const m of Object.values(ezber)) {
    const s = (m as { sonraki?: unknown } | null)?.sonraki;
    if (typeof s === 'string' && TARIH.test(s) && s <= bugun) tekrar++;
  }
  const sayi = [ezber, maddeler(b.bilgi), maddeler(b.yol)].map((m) => Object.keys(m).length);
  const sonraki: SonrakiAdim = tekrar > 0 ? 'tekrar' : sayi[0] === 0 ? 'ezber' : sayi[1] === 0 ? 'bilgi' : sayi[2] === 0 ? 'yol' : 'devam';
  return { gun: gunler.size, madde: sayi[0] + sayi[1] + sayi[2], tekrar, sonraki };
}

/** `Accept-Language` başlığından desteklenen ilk dil (yoksa Türkçe). */
export function dilSec(baslik: unknown): EpostaDili {
  for (const parca of String(baslik ?? '').split(',')) {
    const kod = parca.split(';')[0].trim().toLowerCase().split('-')[0];
    if (epostaDiliMi(kod)) return kod;
  }
  return 'tr';
}

interface SayfaMetni { readonly baslik: string; readonly metin: string; readonly baglanti: string }
const SAYFA: Record<'tamam' | 'gecersiz', Record<EpostaDili, SayfaMetni>> = {
  tamam: {
    tr: { baslik: 'Haftalık e-posta kapatıldı', metin: 'İlim Yolu haftalık özet e-postasını artık almayacaksınız. Dilediğiniz zaman hesabınızdaki ayarlardan yeniden açabilirsiniz.', baglanti: 'Hesap ayarlarını aç' },
    fr: { baslik: 'Courriel hebdomadaire désactivé', metin: 'Vous ne recevrez plus le résumé hebdomadaire d’İlim Yolu. Vous pouvez le réactiver à tout moment dans les paramètres de votre compte.', baglanti: 'Ouvrir les paramètres du compte' },
    en: { baslik: 'Weekly e-mail turned off', metin: 'You will no longer receive the weekly İlim Yolu summary. You can turn it back on at any time in your account settings.', baglanti: 'Open account settings' },
    nl: { baslik: 'Wekelijkse e-mail uitgezet', metin: 'U ontvangt het wekelijkse İlim Yolu-overzicht niet meer. U kunt het op elk moment weer aanzetten in de instellingen van uw account.', baglanti: 'Accountinstellingen openen' },
    de: { baslik: 'Wöchentliche E-Mail ausgeschaltet', metin: 'Sie erhalten die wöchentliche İlim-Yolu-Zusammenfassung nicht mehr. Sie können sie jederzeit in den Einstellungen Ihres Kontos wieder einschalten.', baglanti: 'Kontoeinstellungen öffnen' },
  },
  gecersiz: {
    tr: { baslik: 'Bağlantı geçersiz', metin: 'Bu bağlantı geçersiz ya da süresi dolmuş. Haftalık e-postayı hesabınızdaki ayarlardan kapatabilirsiniz.', baglanti: 'Hesap ayarlarını aç' },
    fr: { baslik: 'Lien invalide', metin: 'Ce lien est invalide ou a expiré. Vous pouvez désactiver le courriel hebdomadaire dans les paramètres de votre compte.', baglanti: 'Ouvrir les paramètres du compte' },
    en: { baslik: 'Invalid link', metin: 'This link is invalid or has expired. You can turn off the weekly e-mail in your account settings.', baglanti: 'Open account settings' },
    nl: { baslik: 'Ongeldige link', metin: 'Deze link is ongeldig of verlopen. U kunt de wekelijkse e-mail uitzetten in de instellingen van uw account.', baglanti: 'Accountinstellingen openen' },
    de: { baslik: 'Ungültiger Link', metin: 'Dieser Link ist ungültig oder abgelaufen. Sie können die wöchentliche E-Mail in den Einstellungen Ihres Kontos ausschalten.', baglanti: 'Kontoeinstellungen öffnen' },
  },
};

/**
 * Abonelikten çıkış onay sayfası. Sıkı CSP (`default-src 'none'; style-src 'self'`, form-action 'none') altında çalışır: satır içi
 * stil ve betik YOK, form YOK; yalnız anlamsal HTML ve bir bağlantı. Dil kodu doğrulanmış sabit listeden gelir (enjeksiyon yok).
 */
export function abonelikSayfasi(dil: EpostaDili, sonuc: 'tamam' | 'gecersiz'): string {
  const s = SAYFA[sonuc][dil];
  return `<!doctype html>\n<html lang="${dil}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<meta name="color-scheme" content="light dark"><meta name="robots" content="noindex"><title>${s.baslik} · İlim Yolu</title></head>`
    + `<body><main><h1>${s.baslik}</h1><p>${s.metin}</p><p><a href="/${dil}/hesap/">${s.baglanti}</a></p></main></body></html>\n`;
}
