/**
 * Cami ekranının saf karar fonksiyonları — hem derlemede hem ekranın kendisinde (src/ekran/*) çalışır.
 * DOM ve ağ kullanmaz; node:test ile doğrudan sınanır (tests/ekran-secim.test.mjs). 27 Eylül 2026.
 * İstemci paketi Chromium 70'e iner: burada .at(), Object.fromEntries, replaceAll gibi API'ler kullanılmaz.
 */
import { brukselTarih, bugunTarih, durumHesapla, haftaGunu, TZ, type Gun, type Vakit } from '../namaz.ts';
import { EKRANLAR, type EkranDuyuru, type EkranId } from './akis.ts';
import { duyuruDilleri, duyuruParcalari, type DuyuruParcasi } from './butce.ts';
import type { EkranAyet, EkranBilgi, EkranDua, EkranHadis, EkranKart, EkranSoz, TemaId } from './icerik.ts';

export interface SlaytAyari { tabanSn: number; karakterSn: number; enAzSn: number; enCokSn: number }

/** Süre = taban + karakter başına ek süre × karakter; [enAz, enÇok] aralığına sıkıştırılır (saniye). */
export function slaytSuresi(karakter: number, a: SlaytAyari): number {
  const ham = a.tabanSn + a.karakterSn * Math.max(0, karakter);
  return Math.min(a.enCokSn, Math.max(a.enAzSn, ham));
}

/** Hedefi boş duyuru bütün ekranlarda, dolu olan yalnız listelenen ekranlarda görünür. */
export const hedefUygunMu = (hedef: readonly string[], ekran: EkranId): boolean => hedef.length === 0 || hedef.indexOf(ekran) >= 0;

/** Gösterim aralığı Brüksel takvim günüyle, iki uç dâhil. */
export const aktifMi = (o: { baslangic: string; son: string }, bugun: string): boolean => o.baslangic <= bugun && bugun <= o.son;

/** Takvim gününün 1970'ten beri sırası; 12:00 UTC üzerinden hesaplandığı için yaz/kış saatinden etkilenmez. */
export const gunNo = (tarih: string): number => Math.floor(Date.parse(tarih + 'T12:00:00Z') / 86_400_000);

/** Güneş vaktinden akşam vaktine kadar açık tema; geri kalan saatlerde koyu. Günün verisi yoksa (veri kesintisi)
 *  sabit Brüksel saat aralığına (07:00–19:00) göre açık/koyu seçilir — cami ekranı geceleri bembeyaz kalmasın
 *  diye; bu bir tema tercihidir, namaz vakti hesabı değildir. */
export function temaSec(gun: Gun | undefined, simdi: Date): 'acik' | 'koyu' {
  if (!gun) {
    const sa = brukselSaat(simdi).sa;
    return sa >= 7 && sa < 19 ? 'acik' : 'koyu';
  }
  const t = simdi.getTime();
  return t >= brukselTarih(gun.tarih, gun.gunes).getTime() && t < brukselTarih(gun.tarih, gun.aksam).getTime() ? 'acik' : 'koyu';
}

/** Kutularda saat pili yok: elektrik kesilip internet de yoksa saat 1970'e (ya da yayından önceki bir ana) dönebilir.
 *  Saate iki kuralla güvenilir:
 *  1) `EN_ERKEN_GECERLI`'den eskiyse güvenilmez (pilsiz kutu, 1970/2025 gibi bariz bayat saat).
 *  2) Ekranın daha önce GÖRDÜĞÜ en yeni sunucu zamanından (`sonSunucuMs`, HTTP Date başlığı) `SAAT_GERI_TOLERANS_MS`'den
 *     fazla geride kalırsa güvenilmez: saat geriye gitmiş demektir. 9 Ekim 2026'da pilsiz bir TV 2026-09-28T22:23Z
 *     saatiyle açıldı; 1. kuralı geçtiği için ağ saati düzeltene dek yanlış saat ve tarihi geçerliymiş gibi gösterdi.
 *  `sonSunucuMs` 0 ya da verilmemişse yalnız 1. kural işler. */
export const EN_ERKEN_GECERLI = Date.parse('2026-09-01T00:00:00Z');
/** Saklı ya da başlıktaki işaretin üst sınırı: bu andaki ve ötesindeki değer bozuk sayılır, kilide sokmasın diye. */
export const EN_GEC_GECERLI = Date.parse('2100-01-01T00:00:00Z');
export const SAAT_GERI_TOLERANS_MS = 10 * 60_000;
export const saatGecerliMi = (simdi: Date, sonSunucuMs = 0): boolean => {
  const t = simdi.getTime();
  return t >= EN_ERKEN_GECERLI && (sonSunucuMs <= 0 || t >= sonSunucuMs - SAAT_GERI_TOLERANS_MS);
};

/** İşaret güncelleme kuralı: tek başına gelen eski `Date` (SW bayat önbelleği) işareti düşürmez;
 *  düşüş yalnız taze sunucu zamanı cihaz saatiyle uyuşup ikisi birden işaretten sapınca olur,
 *  yani bozuk olanın işaret olduğu anlaşılınca. */
export function isaretGuncelle(sonMs: number, sunucuMs: number | null, cihazMs: number): number {
  if (sunucuMs === null || typeof sunucuMs !== 'number' || !isFinite(sunucuMs)) return sonMs;
  if (sunucuMs > sonMs) return sunucuMs;
  if (sunucuMs < sonMs - SAAT_GERI_TOLERANS_MS && Math.abs(cihazMs - sunucuMs) <= SAAT_GERI_TOLERANS_MS) return sunucuMs;
  return sonMs;
}

/** Turun günü: saat güvenilirse cihaz günü, değilse son görülen sunucu günü (kilitte yanlış gün olmasın diye);
 *  işaret de yoksa elde cihaz günü kalır. */
export function turGunu(simdi: Date, sonSunucuMs: number): string {
  if (saatGecerliMi(simdi, sonSunucuMs)) return bugunTarih(simdi);
  if (sonSunucuMs > 0) return bugunTarih(new Date(sonSunucuMs));
  return bugunTarih(simdi);
}

/** HTTP `Date` başlığını (RFC 7231 IMF-fixdate, ör. `Fri, 09 Oct 2026 16:49:41 GMT`) milisaniyeye çevirir.
 *  Boş, bozuk, `EN_ERKEN_GECERLI`'den eski ya da `EN_GEC_GECERLI`'ndeki ve ötesindeki başlık null döner:
 *  bayat ya da gelecekten gelen bir sunucu/ara katman işareti yükseltemez. */
export function sunucuSaatiCoz(baslik: string | null): number | null {
  if (!baslik) return null;
  const ms = Date.parse(baslik);
  return isFinite(ms) && ms >= EN_ERKEN_GECERLI && ms < EN_GEC_GECERLI ? ms : null;
}

const SAAT_PARCALARI = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** Brüksel duvar saati; bazı tarayıcıların gece yarısı için verdiği "24" 0'a çevrilir. */
export function brukselSaat(t: Date): { sa: number; dk: number; sn: number } {
  const parcalar = SAAT_PARCALARI.formatToParts(t);
  const al = (tur: string): number => {
    for (const p of parcalar) if (p.type === tur) return Number(p.value);
    return 0;
  };
  return { sa: al('hour') % 24, dk: al('minute'), sn: al('second') };
}

export interface VakitGorunumu {
  gun: Gun;
  siradaki: { vakit: Vakit; saat: string; kalanDk: number; yarinMi: boolean } | null;
  cuma: boolean;
}

/** Bugünün Diyanet kaydı yoksa null: ekran başka bir günün vakitlerini ASLA bugünün gibi göstermez, hesaplamaz.
 *  `durumHesapla` (namaz.ts) "yarın" için listedeki BİR SONRAKİ KAYDI alır; veri boşluğu (ör. 26 Ekim'den
 *  1 Ocak'a atlayan kayıtlar) ya da mükerrer günlü bir kayıtta bu, gerçek yarın değildir. Böyle durumda
 *  sıradaki vakit gösterilmez (bugünün satırı kalır, geri sayım ve vurgu olmaz). */
export function vakitGorunumu(gunler: Gun[], simdi: Date): VakitGorunumu | null {
  const bugun = bugunTarih(simdi);
  let gun: Gun | undefined;
  for (const g of gunler) if (g.tarih === bugun) { gun = g; break; }
  if (!gun) return null;
  const durum = durumHesapla(gunler, simdi);
  let siradaki = durum ? durum.siradaki : null;
  if (durum && siradaki && siradaki.yarinMi && (!durum.yarin || gunNo(durum.yarin.tarih) !== gunNo(bugun) + 1)) siradaki = null;
  /* Sabah namazının son vakti güneştir: imsak ile güneş arasında ekran güneşe kalan süreyi gösterir (28 Eylül 2026
     kararı). durumHesapla güneşi atlar ve bu aralıkta öğleyi verir; site bu davranışla kalır, yalnız ekran ayrışır. */
  const gunesAni = brukselTarih(gun.tarih, gun.gunes).getTime();
  if (siradaki && siradaki.vakit === 'ogle' && !siradaki.yarinMi && simdi.getTime() < gunesAni) {
    siradaki = { vakit: 'gunes', saat: gun.gunes, kalanDk: Math.ceil((gunesAni - simdi.getTime()) / 60000), yarinMi: false };
  }
  return { gun, siradaki, cuma: haftaGunu(simdi) === 5 };
}

/** Manevi dizideki öğenin kaynağı: ayet, hadis, dua ya da tema kartı (kartın çeşidi ne olursa olsun `kart`). Kimlikler
 *  yalnız kendi listesinde tekildir (icerik.ts → mukerrerDenetcisi): ayet `a1` ile kart `a1` ayrı öğelerdir. */
export type ManeviTur = 'ayet' | 'hadis' | 'dua' | 'kart';
export const MANEVI_TURLERI: readonly ManeviTur[] = ['ayet', 'hadis', 'dua', 'kart'];
/** Manevi dizide bir öğenin adresi. Ekranın imleci (son gösterilen ya da atlanan öğe) bununla saklanır. */
export interface ManeviImleci { tur: ManeviTur; id: string }

export type Slayt =
  /** `parca` duyurunun bu slayttaki bölümü (src/lib/ekran/butce.ts → duyuruParcalari); yoksa bütün diller tek levha. */
  | { tur: 'duyuru'; oge: EkranDuyuru; parca?: DuyuruParcasi; karakter: number; imlec?: undefined }
  /** `tema` doluysa slayt bir tema kartıdır: üst başlık «Âyet-i Kerîme» yerine temanın adı olur. `imlec` manevi
   *  slaytlarda (ayet, hadis, dua, tema kartı) dizideki yeridir; duyuruda yoktur. */
  | { tur: 'ayet'; oge: EkranAyet; karakter: number; tema?: TemaId; imlec?: ManeviImleci }
  | { tur: 'hadis'; oge: EkranHadis; karakter: number; tema?: TemaId; imlec?: ManeviImleci }
  | { tur: 'dua'; oge: EkranDua; karakter: number; imlec?: ManeviImleci }
  | { tur: 'bilgi'; oge: EkranBilgi; karakter: number; tema: TemaId; imlec?: ManeviImleci }
  | { tur: 'soz'; oge: EkranSoz; karakter: number; tema: TemaId; imlec?: ManeviImleci };

/** Slayt turunun girdisi. `dualar` önbellekteki A öncesi, `kartlar` 19 Ekim 2026 öncesi icerik.json'da yoktur: boş
 *  sayılır (eski akıştaki `esmalar` alanı artık okunmaz). */
export interface SlaytGirdisi {
  duyurular: EkranDuyuru[];
  ayetler: EkranAyet[];
  hadisler: EkranHadis[];
  dualar?: EkranDua[];
  kartlar?: EkranKart[];
}

/** Bir turun hedef süresi, sn (ekran.yaml → turHedefSn). Akışta yoksa (önbellekteki eski akış) bu kullanılır. */
export const TUR_HEDEF_SN = 150;
export interface TurAyari { turHedefSn: number; slayt: SlaytAyari }

const uz = (...parcalar: (string | undefined)[]): number => {
  let t = 0;
  for (const p of parcalar) t += p ? p.length : 0;
  return t;
};

/** Duyuru slaytında okunan metnin uzunluğu (en uzun dil): afiş slaytı metinsizse yalnız başlıklar. */
function duyuruKarakteri(d: EkranDuyuru, p: DuyuruParcasi): number {
  const diller = p.yerlesim === 'levha' ? p.diller : duyuruDilleri(d);
  const metinli = p.yerlesim === 'levha' || p.metinli;
  let enCok = 0;
  for (const dil of diller) {
    const m = d[dil];
    if (m) enCok = Math.max(enCok, metinli ? uz(m.baslik, m.metin) : uz(m.baslik));
  }
  return enCok;
}

/** Ekranın manevi dizideki konumu (slaytListesi'ne dışarıdan verilir; depo okuma/yazma main.ts'tedir).
 *  `imlec`: son gösterilen ya da sığmadığı için atlanan manevi öğe. Dizide varsa tur hemen ardındaki öğeden başlar.
 *  Yoksa (depo yok/boş, öğe artık dizide değil) `simdiMs` yedek başlangıcı verir: ekran hiç kapanmasaydı bu anda
 *  hangi turdaydı sayılır, yani yeniden yükleme her seferinde baştan başlamaz. Biri de yoksa 0. */
export interface ManeviKonum { imlec?: ManeviImleci | null; simdiMs?: number }

/** Depoda saklanan imleç metni (JSON); bozuk, boş ya da tanınmayan bir çeşit null verir. */
export function imlecCoz(ham: string | null | undefined): ManeviImleci | null {
  if (!ham) return null;
  try {
    const x = JSON.parse(ham) as { tur?: unknown; id?: unknown } | null;
    if (x && typeof x === 'object' && typeof x.id === 'string' && x.id !== '' && MANEVI_TURLERI.indexOf(x.tur as ManeviTur) >= 0) return { tur: x.tur as ManeviTur, id: x.id };
  } catch {
    /* bozuk metin: imleç yok sayılır */
  }
  return null;
}
export const imlecYazisi = (i: ManeviImleci): string => JSON.stringify({ tur: i.tur, id: i.id });

/** Yedek başlangıç: `turHedefSn`'lik turların epoch'tan beri sırası × tur başına öğe sayısı (mod n). */
function yedekBaslangic(n: number, adet: number, turHedefSn: number, simdiMs: number | undefined): number {
  if (typeof simdiMs !== 'number' || !isFinite(simdiMs) || !(turHedefSn > 0)) return 0;
  const turSirasi = Math.floor(simdiMs / (turHedefSn * 1000));
  return (((turSirasi * adet) % n) + n) % n;
}

/** Tur hedef süreyi aşarsa manevi dizi turlara bölünür: her tur imlecin ardındaki `adet` öğeyi gösterir (sarmal),
 *  duyurular her turda kalır. adet = duyurulardan kalan süreye sığan manevi slayt sayısı; en az 1, en çok n − 1.
 *  Ayar yoksa ya da bozuksa (NaN) ve dizi hedefe sığıyorsa dizi bütün (baştan) gösterilir. */
function maneviDilimi(manevi: Slayt[], duyurular: Slayt[], konum?: ManeviKonum, tur?: TurAyari): Slayt[] {
  const n = manevi.length;
  if (!tur || n < 2) return manevi;
  const sure = (s: Slayt): number => slaytSuresi(s.karakter, tur.slayt);
  let duyuruSn = 0;
  for (const s of duyurular) duyuruSn += sure(s);
  let maneviSn = 0;
  for (const s of manevi) maneviSn += sure(s);
  if (!(duyuruSn + maneviSn > tur.turHedefSn)) return manevi;
  const sigan = Math.floor((tur.turHedefSn - duyuruSn) / (maneviSn / n));
  const adet = sigan >= 1 ? Math.min(sigan, n - 1) : 1;
  let bas = -1;
  const imlec = konum && konum.imlec;
  if (imlec) {
    for (let i = 0; i < n; i++) {
      const m = manevi[i].imlec;
      if (m && m.tur === imlec.tur && m.id === imlec.id) { bas = (i + 1) % n; break; }
    }
  }
  if (bas < 0) bas = yedekBaslangic(n, adet, tur.turHedefSn, konum && konum.simdiMs);
  const dilim: Slayt[] = [];
  for (let i = 0; i < adet; i++) dilim.push(manevi[(bas + i) % n]);
  return dilim;
}

const enUzun = (o: { ar?: string; tr: string; fr?: string }): number => Math.max(uz(o.ar), uz(o.tr), uz(o.fr));

/** Tema kartının slaytı: kartın çeşidi slayt türü olur, tema üst başlığa gider. */
function kartSlayti(k: EkranKart): Slayt {
  const imlec: ManeviImleci = { tur: 'kart', id: k.oge.id };
  switch (k.cesit) {
    case 'ayet': return { tur: 'ayet', oge: k.oge, tema: k.tema, karakter: enUzun(k.oge), imlec };
    case 'hadis': return { tur: 'hadis', oge: k.oge, tema: k.tema, karakter: enUzun(k.oge), imlec };
    case 'bilgi': return { tur: 'bilgi', oge: k.oge, tema: k.tema, karakter: Math.max(uz(k.oge.baslik.tr, k.oge.tr), uz(k.oge.baslik.fr, k.oge.fr)), imlec };
    default: return { tur: 'soz', oge: k.oge, tema: k.tema, karakter: enUzun(k.oge), imlec };
  }
}

/** Bütün manevi öğeler tek dizide: çeşitler arasında dönülür (ayet, hadis, dua, tema kartı, ayet, …); kısa liste
 *  bitince dönüş kalan listelerle sürer. Her listenin kendi (kaynak) sırası korunur, dizi hep aynı girdiden aynı çıkar. */
export function maneviSirasi(girdi: SlaytGirdisi): Slayt[] {
  const ayetler = girdi.ayetler, hadisler = girdi.hadisler, dualar = girdi.dualar || [], kartlar = girdi.kartlar || [];
  const dizi: Slayt[] = [];
  const en = Math.max(ayetler.length, hadisler.length, dualar.length, kartlar.length);
  for (let i = 0; i < en; i++) {
    if (i < ayetler.length) dizi.push({ tur: 'ayet', oge: ayetler[i], karakter: enUzun(ayetler[i]), imlec: { tur: 'ayet', id: ayetler[i].id } });
    if (i < hadisler.length) dizi.push({ tur: 'hadis', oge: hadisler[i], karakter: enUzun(hadisler[i]), imlec: { tur: 'hadis', id: hadisler[i].id } });
    if (i < dualar.length) dizi.push({ tur: 'dua', oge: dualar[i], karakter: enUzun(dualar[i]), imlec: { tur: 'dua', id: dualar[i].id } });
    if (i < kartlar.length) dizi.push(kartSlayti(kartlar[i]));
  }
  return dizi;
}

/** Bir tur: bu ekrana özel duyurular, ortak duyurular, ardından manevi diziden sıradaki öğeler (bütün ayet, hadis, dua
 *  ve tema kartları; maneviSirasi). Duyuru, ekrana sığma kuralına göre bir ya da iki slayt olur (TR ve FR ayrı; afiş ve
 *  ardından metin). Boş kategori atlanır. Okuma süresi en uzun dildeki metne göre hesaplanır (izleyici tek dil okur).
 *  `tur` verilirse manevi dizi turun hedef süresine göre dilimlenir; dilim `konum.imlec`in ardından başlar. */
export function slaytListesi(girdi: SlaytGirdisi, ekran: EkranId, bugun: string, tur?: TurAyari, konum?: ManeviKonum): Slayt[] {
  const gecerli = girdi.duyurular.filter((d) => aktifMi(d, bugun) && hedefUygunMu(d.hedef, ekran));
  const sirali = gecerli.filter((d) => d.hedef.length > 0).concat(gecerli.filter((d) => d.hedef.length === 0));
  const liste: Slayt[] = [];
  for (const d of sirali) {
    for (const parca of duyuruParcalari(d)) liste.push({ tur: 'duyuru', oge: d, parca, karakter: duyuruKarakteri(d, parca) });
  }
  return liste.concat(maneviDilimi(maneviSirasi(girdi), liste, konum, tur));
}

export const ekranIdOku = (deger: string | null): EkranId =>
  (EKRANLAR as readonly string[]).indexOf(deger || '') >= 0 ? (deger as EkranId) : 'ana';

export const donmeOku = (deger: string | null): 0 | 90 | 270 => (deger === '90' ? 90 : deger === '270' ? 270 : 0);

/** Tuval düzeni: dikey 9:16 ya da yatay 16:9. */
export type Duzen = 'dikey' | 'yatay';

/** `?duzen=yatay|dikey` düzeni zorlar; tam eşleşmeyen her değer (yok, büyük harf, boşluk, saçma) otomatik seçim demektir —
 *  yanlış yazılmış bir adres ekranı bozmasın, alan oranından seçilsin. */
export const duzenOku = (deger: string | null): Duzen | null => (deger === 'yatay' || deger === 'dikey' ? deger : null);
