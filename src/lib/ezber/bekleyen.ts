/**
 * Ezber Kilimi — telefonda bekleyen ezber yazımlarının küçük defteri (27 Eylül 2026, bağımsız inceleme D1). Firestore'un
 * kalıcı önbelleği, bağlantısız dokunulup sayfası kapatılan yazımı sonraki açılışta gönderir; sunucu o yazımı reddederse
 * (araya başka telefon girdi, öğrencinin kaydı kilitlendi) bunu bildirecek bir söz kalmamıştır. Defter her yazımı olay
 * kimliğiyle tutar; bu oturumda onay ya da ret gelince çıkarır. Açılışta önceki oturumlardan kalanların olayı sunucuda
 * aranır: olay yoksa yazım reddedilmiştir, «kayıp» listesine geçer ve hoca kapatana kadar ekranda söylenir.
 * Yalnız hocanın telefonunda (localStorage); öğrenci ve madde kimliği taşır, ad taşımaz. Depolama kapalıysa (gizli
 * sekme) defter tutulmaz, ekran yine çalışır. Ekran: src/scripts/hoca-ezber.ts · belge: docs/EZBER-KILIMI.md.
 */
export interface BekleyenYazim {
  readonly ref: string;
  readonly olayId: string;
  /** Katalog kimliği. */
  readonly id: string;
  readonly tur: string;
  readonly kalite: string;
  /** Dokunuş anı (ms). */
  readonly zaman: number;
}
export type YerelDepo = Pick<Storage, 'getItem' | 'setItem'>;

export const BEKLEYEN_ANAHTARI = 'ulucamii.ezber.bekleyen.v1';
export const KAYIP_ANAHTARI = 'ulucamii.ezber.kayip.v1';
/** Defterde en çok bu kadar kayıt kalır (en yeniler); bir dönemin bağlantısız dersleri için bol. */
export const BEKLEYEN_SINIRI = 200;

const dizi = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 200;
const gecerli = (x: unknown): x is BekleyenYazim => {
  const o = x as Record<string, unknown> | null;
  return Boolean(o && typeof o === 'object' && dizi(o.ref) && !String(o.ref).includes('/') && dizi(o.olayId)
    && dizi(o.id) && dizi(o.tur) && typeof o.kalite === 'string' && Number.isFinite(o.zaman));
};

function oku(depo: YerelDepo | null, anahtar: string): BekleyenYazim[] {
  try {
    const v: unknown = JSON.parse(depo?.getItem(anahtar) || '[]');
    return Array.isArray(v) ? v.filter(gecerli) : [];
  } catch {
    return [];
  }
}
function yaz(depo: YerelDepo | null, anahtar: string, liste: readonly BekleyenYazim[]): void {
  try {
    depo?.setItem(anahtar, JSON.stringify(liste.slice(-BEKLEYEN_SINIRI)));
  } catch {
    /* Depolama dolu ya da kapalı: defter tutulmaz. */
  }
}

export const bekleyenler = (depo: YerelDepo | null): BekleyenYazim[] => oku(depo, BEKLEYEN_ANAHTARI);
export const kayiplar = (depo: YerelDepo | null): BekleyenYazim[] => oku(depo, KAYIP_ANAHTARI);

/** Yazım kuyruğa girerken (aynı olay yeniden gelirse sona taşınır). */
export function bekleyenEkle(depo: YerelDepo | null, y: BekleyenYazim): void {
  yaz(depo, BEKLEYEN_ANAHTARI, [...bekleyenler(depo).filter((x) => x.olayId !== y.olayId), y]);
}
/** Bu oturumda sonuç geldi ya da olay «Geri al» ile silinecek. */
export function bekleyenCikar(depo: YerelDepo | null, olayId: string): void {
  const l = bekleyenler(depo);
  if (l.some((x) => x.olayId === olayId)) yaz(depo, BEKLEYEN_ANAHTARI, l.filter((x) => x.olayId !== olayId));
}
export function kayiplariKapat(depo: YerelDepo | null): void {
  yaz(depo, KAYIP_ANAHTARI, []);
}

/**
 * Önceki oturumlardan kalanları denetler; bekleyen yazımlar gönderildikten sonra çağrılır. Olayı sunucuda olan defterden
 * düşer; olmayan kayıp listesine geçer (bir kez). Ağ hatasında kayıt defterde kalır, sonraki açılışta yeniden sorulur.
 * `bekleme`den taze kayıt ve (verilirse) `yalniz` dışındaki kayıt sorulmaz: başka sekmede ya da bu oturumda hâlâ
 * gidiyor olabilir. Yeni bulunan kayıpları döndürür.
 */
export async function kayiplariBul(depo: YerelDepo | null, olayVar: (y: BekleyenYazim) => Promise<boolean>,
  secenek: { simdi?: number; bekleme?: number; yalniz?: ReadonlySet<string> } = {}): Promise<BekleyenYazim[]> {
  const sinir = (secenek.simdi ?? Date.now()) - (secenek.bekleme ?? 60_000);
  const yeni: BekleyenYazim[] = [];
  for (const y of bekleyenler(depo)) {
    if (y.zaman > sinir || (secenek.yalniz && !secenek.yalniz.has(y.olayId))) continue;
    let var_: boolean;
    try {
      var_ = await olayVar(y);
    } catch {
      continue;
    }
    if (!var_) {
      const k = kayiplar(depo);
      if (!k.some((x) => x.olayId === y.olayId)) yaz(depo, KAYIP_ANAHTARI, [...k, y]);
      yeni.push(y);
    }
    bekleyenCikar(depo, y.olayId);
  }
  return yeni;
}
