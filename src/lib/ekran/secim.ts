/**
 * Cami ekranının saf karar fonksiyonları — hem derlemede hem ekranın kendisinde (src/ekran/*) çalışır.
 * DOM ve ağ kullanmaz; node:test ile doğrudan sınanır (tests/ekran-secim.test.mjs). 27 Eylül 2026.
 * İstemci paketi Chromium 70'e iner: burada .at(), Object.fromEntries, replaceAll gibi API'ler kullanılmaz.
 */
import { brukselTarih, bugunTarih, durumHesapla, haftaGunu, TZ, type Gun, type Vakit } from '../namaz.ts';
import { EKRANLAR, type EkranDuyuru, type EkranId } from './akis.ts';
import type { EkranAyet, EkranDua, EkranEsma, EkranHadis } from './icerik.ts';

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

/** Listeden "günün öğesi": aynı gün hep aynı, ertesi gün sıradaki. */
export function gununOgesi<T>(liste: readonly T[], tarih: string): T | undefined {
  if (!liste.length) return undefined;
  return liste[((gunNo(tarih) % liste.length) + liste.length) % liste.length];
}

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

/** Kutularda saat pili yok: elektrik kesilip internet de yoksa saat 1970'e dönebilir. Bu andan eskiyse saate güvenilmez. */
export const EN_ERKEN_GECERLI = Date.parse('2026-09-01T00:00:00Z');
export const saatGecerliMi = (simdi: Date): boolean => simdi.getTime() >= EN_ERKEN_GECERLI;

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

export type Slayt =
  | { tur: 'duyuru'; oge: EkranDuyuru; karakter: number }
  | { tur: 'ayet'; oge: EkranAyet; karakter: number }
  | { tur: 'hadis'; oge: EkranHadis; karakter: number }
  | { tur: 'dua'; oge: EkranDua; karakter: number }
  | { tur: 'esma'; oge: EkranEsma; karakter: number };

/** Slayt turunun girdisi. `dualar` ve `esmalar` önbellekteki eski icerik.json'da (A öncesi) yoktur: boş sayılır. */
export interface SlaytGirdisi {
  duyurular: EkranDuyuru[];
  ayetler: EkranAyet[];
  hadisler: EkranHadis[];
  dualar?: EkranDua[];
  esmalar?: EkranEsma[];
}

/** Bir turun hedef süresi, sn (ekran.yaml → turHedefSn). Akışta yoksa (önbellekteki eski akış) bu kullanılır. */
export const TUR_HEDEF_SN = 150;
export interface TurAyari { turHedefSn: number; slayt: SlaytAyari }

const uz = (...parcalar: (string | undefined)[]): number => {
  let t = 0;
  for (const p of parcalar) t += p ? p.length : 0;
  return t;
};

/** Tur hedef süreyi aşarsa manevi blok turlara bölünür: her tur sıradaki `adet` öğeyi gösterir (sarmal; `turNo` ile
 *  kayar), duyurular her turda kalır. adet = duyurulardan kalan süreye sığan manevi slayt sayısı; en az 1, en çok
 *  n − 1. Ayar yoksa ya da bozuksa (NaN) blok bütün gösterilir. */
function maneviDilimi(manevi: Slayt[], duyurular: Slayt[], turNo: number, tur?: TurAyari): Slayt[] {
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
  const bas = (((turNo * adet) % n) + n) % n;
  const dilim: Slayt[] = [];
  for (let i = 0; i < adet; i++) dilim.push(manevi[(bas + i) % n]);
  return dilim;
}

/** Bir tur: bu ekrana özel duyurular, ortak duyurular, ardından manevi blok (günün ayeti, hadisi, duası, Esmâ'sı).
 *  Boş kategori atlanır. Okuma süresi en uzun dildeki metne göre hesaplanır (izleyici tek dil okur). `tur` verilirse
 *  manevi blok turun hedef süresine göre dilimlenir. */
export function slaytListesi(girdi: SlaytGirdisi, ekran: EkranId, bugun: string, turNo = 0, tur?: TurAyari): Slayt[] {
  const gecerli = girdi.duyurular.filter((d) => aktifMi(d, bugun) && hedefUygunMu(d.hedef, ekran));
  const sirali = gecerli.filter((d) => d.hedef.length > 0).concat(gecerli.filter((d) => d.hedef.length === 0));
  const liste: Slayt[] = sirali.map((d) => ({
    tur: 'duyuru' as const,
    oge: d,
    karakter: Math.max(uz(d.tr?.baslik, d.tr?.metin), uz(d.fr?.baslik, d.fr?.metin)),
  }));
  const manevi: Slayt[] = [];
  const ayet = gununOgesi(girdi.ayetler, bugun);
  if (ayet) manevi.push({ tur: 'ayet', oge: ayet, karakter: Math.max(uz(ayet.ar), uz(ayet.tr), uz(ayet.fr)) });
  const hadis = gununOgesi(girdi.hadisler, bugun);
  if (hadis) manevi.push({ tur: 'hadis', oge: hadis, karakter: Math.max(uz(hadis.ar), uz(hadis.tr), uz(hadis.fr)) });
  const dua = gununOgesi(girdi.dualar || [], bugun);
  if (dua) manevi.push({ tur: 'dua', oge: dua, karakter: Math.max(uz(dua.ar), uz(dua.tr), uz(dua.fr)) });
  const esma = gununOgesi(girdi.esmalar || [], bugun);
  if (esma) manevi.push({ tur: 'esma', oge: esma, karakter: Math.max(uz(esma.ar, esma.okunus), uz(esma.tr), uz(esma.fr)) });
  return liste.concat(maneviDilimi(manevi, liste, turNo, tur));
}

export const ekranIdOku = (deger: string | null): EkranId =>
  (EKRANLAR as readonly string[]).indexOf(deger || '') >= 0 ? (deger as EkranId) : 'ana';

export const donmeOku = (deger: string | null): 0 | 90 | 270 => (deger === '90' ? 90 : deger === '270' ? 270 : 0);

/** Tuval düzeni: dikey 9:16 ya da yatay 16:9. */
export type Duzen = 'dikey' | 'yatay';

/** `?duzen=yatay|dikey` düzeni zorlar; tam eşleşmeyen her değer (yok, büyük harf, boşluk, saçma) otomatik seçim demektir —
 *  yanlış yazılmış bir adres ekranı bozmasın, alan oranından seçilsin. */
export const duzenOku = (deger: string | null): Duzen | null => (deger === 'yatay' || deger === 'dikey' ? deger : null);
