/** Mühtedi Hizmetleri Envanteri — gövde sözleşmesi, sunucu doğrulaması ve defter satırları (1 Ekim 2026).
 *
 *  Saf modüldür: Apps Script API'si ÇAĞRILMAZ, JSON içe aktarılmaz. `npm run ihtida:gas-derle` bu modülü
 *  gas-giris.ts üzerinden `EnvanterVeri` IIFE paketine koyar; aynı kod Node testlerinde de çalışır.
 *
 *  Mahremiyet kuralları (sunucu yetkilidir, istemciye güvenilmez):
 *   · Her adlı satırda `izin === true` şarttır; yoksa gönderimin TAMAMI reddedilir.
 *   · Gizli/kodlu satırda ad, telefon ve e-posta gelse de DÜŞÜRÜLÜR; defterde yalnız kod kalır.
 *   · Adres, kimlik numarası, fotoğraf alanı yoktur; bilinmeyen alanlar yok sayılır, deftere yazılmaz.
 *   · 8a (komisyon adayı) yalnız «evet» ve izinle kabul edilir; «evet» değilse bütün alanları atılır.
 */
import {
  FORM_SURUMU, ONAY_SURUMU, AZAMI_KISI, AZAMI_SAYI, LISTEDE_YOK, BOLGELER, STATULER, GOREVLI_DILLERI,
  IHTIDA_YILLARI, CINSIYETLER, BELGE_DURUMLARI, YAS_GRUPLARI, TERCIH_DILLERI, DURUM_ALANLARI, FAALIYETLER,
  GONULLU_ALANLARI, EVET_HAYIR, BELGE_VAR, IRTIBAT_ISTEGI, ADAY_B_SECIMLERI, SINIR,
  type Bolge, type Statu, type GorevliDili, type IhtidaYili, type Cinsiyet, type BelgeDurumu, type TercihDili,
  type Faaliyet, type BelgeVar, type IrtibatIstegi, type AdayBSecimi,
} from './sabitler.ts';
import { envanterMetin } from '../../i18n/formlar/envanter-tr.ts';

export * from './sabitler.ts';

/* ===================================================================
   Cami tablosu — katalog kimliği → ad, şehir, bölge
   =================================================================== */

export interface EnvanterCamisi { id: string; ad: string; sehir: string; bolge: Bolge }
interface KatalogKaydi { id: string; ad: string; sehir: string }

/** Bölge eşlemesi (src/data/envanter-bolgeleri.json) + katalog (public/data/belcika-camileri.json) → sıralı tablo.
 *  Katalogda bulunmayan ya da bölgesi tanınmayan kimlik ATLANIR (paket yüklenirken hata fırlatmaz);
 *  tutarlılık tests/envanter-gas.test.mjs ile derlemeden önce denetlenir. */
export function camiTablosu(harita: Record<string, string>, katalog: { camiler: KatalogKaydi[] }): EnvanterCamisi[] {
  const sonuc: EnvanterCamisi[] = [];
  for (const [id, bolge] of Object.entries(harita)) {
    const k = katalog.camiler.find((c) => c.id === id);
    if (!k || !(BOLGELER as readonly string[]).includes(bolge)) continue;
    sonuc.push({ id, ad: k.ad, sehir: k.sehir, bolge: bolge as Bolge });
  }
  return sonuc.sort((a, b) => BOLGELER.indexOf(a.bolge) - BOLGELER.indexOf(b.bolge)
    || a.sehir.localeCompare(b.sehir, 'tr') || a.ad.localeCompare(b.ad, 'tr'));
}

/** Görünen ad: «Fatih Camii (Schaerbeek)». Form ve defter aynı biçimi kullanır. */
export function camiEtiketi(c: EnvanterCamisi): string {
  return `${c.ad} (${c.sehir})`;
}

/* ===================================================================
   ENVANTER_AYAR — açık/kapalı kararı (tek yer)
   =================================================================== */

export interface EnvanterAyari { acik: boolean; veriSorumlusu: string | null; kapanis: string | null; silme: string | null }

function gecerliGun(x: unknown): string | null {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  const [y, a, g] = x.split('-').map(Number);
  const d = new Date(Date.UTC(y, a - 1, g));
  return d.getUTCFullYear() === y && d.getUTCMonth() === a - 1 && d.getUTCDate() === g ? x : null;
}

function gunEkle(gun: string, n: number): string {
  const [y, a, g] = gun.split('-').map(Number);
  return new Date(Date.UTC(y, a - 1, g + n)).toISOString().slice(0, 10);
}

/** Script Property ENVANTER_AYAR (JSON metni) + bugünün Brüksel tarihi (YYYY-MM-DD) → karar.
 *  Açık = `acik == 1` VE veri sorumlusu boş olmayan metin VE (kapanış varsa) bugün ≤ kapanış.
 *  Bozuk JSON, bozuk kapanış tarihi ya da eksik alan → KAPALI (kuşkuda kapalı).
 *  `silme` yazılmamışsa kapanıştan 30 gün sonrası kabul edilir (bilgilendirmedeki «en geç 30 gün»). */
export function ayarCoz(ham: unknown, bugun: string): EnvanterAyari {
  let a: Record<string, unknown> | null = null;
  try {
    const cozulen = typeof ham === 'string' && ham.trim() ? JSON.parse(ham) : null;
    a = cozulen && typeof cozulen === 'object' && !Array.isArray(cozulen) ? cozulen : null;
  } catch { a = null; }
  if (!a) return { acik: false, veriSorumlusu: null, kapanis: null, silme: null };
  const vs = typeof a.veriSorumlusu === 'string' && a.veriSorumlusu.trim() ? a.veriSorumlusu.trim().slice(0, 300) : null;
  const kapanis = gecerliGun(a.kapanis);
  const kapanisBozuk = a.kapanis !== undefined && a.kapanis !== null && a.kapanis !== '' && !kapanis;
  const silme = gecerliGun(a.silme) ?? (kapanis ? gunEkle(kapanis, 30) : null);
  const acik = Number(a.acik) === 1 && !!vs && !kapanisBozuk && (!kapanis || bugun <= kapanis) && !!gecerliGun(bugun);
  return { acik, veriSorumlusu: vs, kapanis, silme };
}

/* ===================================================================
   Doğrulama
   =================================================================== */

export interface EnvanterKisisi {
  gizli: boolean; kod: string; ad: string; cinsiyet: Cinsiyet; dogumYili: number | null;
  telefon: string; eposta: string; dil: TercihDili; ihtidaYili: IhtidaYili; belge: BelgeDurumu;
}

export interface EnvanterKaydi {
  gorevli: {
    ad: string; bolge: Bolge; camiId: string; camiAd: string; statu: Statu; statuAciklama: string;
    telefon: string; eposta: string; diller: GorevliDili[]; digerDil: string;
  };
  sayilar: Record<string, number | null>;
  kisiler: EnvanterKisisi[];
  faaliyet: Record<Faaliyet, boolean>;
  materyal: string;
  aday: {
    a: { ad: string; telefon: string; eposta: string; neden: string } | null;
    b: { secim: AdayBSecimi | ''; ad: string; cami: string };
    c: { camiId: string; camiAd: string; gerekce: string };
    d: IrtibatIstegi | '';
  };
  belge: { varMi: BelgeVar | ''; adet: number | null; iletilebilir: '' | 'evet' | 'hayir' };
  gorus: string;
}

export type DogrulamaSonucu = { ok: true; veri: EnvanterKaydi } | { ok: false; hata: string };

/** Sayı alanlarının TEK listesi: gövde yolu + defter başlığı. Doğrulama ve satır bu sırayı izler. */
export interface SayiAlani { yol: string[]; baslik: string }
const S = envanterMetin.secenek;
export const SAYI_ALANLARI: SayiAlani[] = [
  ...IHTIDA_YILLARI.flatMap((y) => CINSIYETLER.map((c) => ({
    yol: ['sayilar', 'ihtida', y, c], baslik: `İhtida ${S.ihtidaYili[y]} — ${S.cinsiyet[c].toLocaleLowerCase('tr')}`,
  }))),
  ...BELGE_DURUMLARI.map((b) => ({ yol: ['sayilar', 'belge', b], baslik: S.belgeSayisi[b] })),
  ...YAS_GRUPLARI.map((y) => ({ yol: ['sayilar', 'yas', y], baslik: `Yaş: ${S.yas[y]}` })),
  ...TERCIH_DILLERI.map((d) => ({ yol: ['sayilar', 'dil', d], baslik: `Tercih dili: ${S.tercihDili[d]}` })),
  ...DURUM_ALANLARI.map((d) => ({ yol: ['durum', d], baslik: S.durum[d] })),
];
/** Gönüllü sayıları faaliyetlerden SONRA gelir (formdaki sıra). */
export const GONULLU_SAYILARI: SayiAlani[] = GONULLU_ALANLARI.map((g) => ({
  yol: ['gonullu', g],
  baslik: g === 'kardesAile' ? 'Kardeş Aile olabilecek aile' : `Gönüllü: ${envanterMetin.gonullu[g].toLocaleLowerCase('tr')}`,
}));

class Gecersiz extends Error {
  kod: string;
  constructor(kod: string) { super(kod); this.kod = kod; }
}

type Nesne = Record<string, unknown>;
const nesneMi = (x: unknown): x is Nesne => !!x && typeof x === 'object' && !Array.isArray(x);
const nesne = (x: unknown): Nesne => (nesneMi(x) ? x : {});

function yolDeger(kok: Nesne, yol: string[]): unknown {
  let o: unknown = kok;
  for (const p of yol) o = nesneMi(o) ? o[p] : undefined;
  return o;
}

/** Metin: yok → ''. Yalnız dize kabul edilir; denetim karakterleri ayıklanır, fazla boşluk tekilleşir. */
function metin(x: unknown, azami: number, kod: string, cokSatir = false): string {
  if (x === undefined || x === null) return '';
  if (typeof x !== 'string') throw new Gecersiz(kod);
  const t = cokSatir
    ? x.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    : x.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length > azami) throw new Gecersiz(kod);
  return t;
}

/** Kişi adı: en az iki harf; rakam ve `< > @ : / * = ;` giremez (adres, e-posta, formül ad alanına sızmasın). */
function kisiAdi(x: unknown, kod: string, zorunlu: boolean): string {
  const t = metin(x, SINIR.ad, kod);
  if (!t) { if (zorunlu) throw new Gecersiz(kod); return ''; }
  if (/[0-9<>@:\/*=;]/.test(t) || (t.match(/\p{L}/gu) ?? []).length < 2) throw new Gecersiz(kod);
  return t;
}

/** tarayıcıdaki telefonNormalle ile aynı kural: Belçika yerel biçimi +32'ye çevrilir, sonuç E.164. */
export function telefonNormalle(ham: string): string | null {
  let s = ham.trim().replace(/[\s().\- ]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^0\d{8,9}$/.test(s)) s = '+32' + s.slice(1);
  return /^\+\d{8,15}$/.test(s) ? s : null;
}

function telefon(x: unknown, kod: string): string {
  const t = metin(x, SINIR.telefon + 10, kod);
  if (!t) return '';
  const n = telefonNormalle(t);
  if (!n) throw new Gecersiz(kod);
  return n;
}

function eposta(x: unknown, kod: string): string {
  const t = metin(x, SINIR.eposta, kod);
  if (!t) return '';
  if (!/^[^\s@<>]+@[^\s@<>]+\.[a-zA-Z]{2,}$/.test(t)) throw new Gecersiz(kod);
  return t;
}

function secim<T extends string>(x: unknown, kume: readonly T[], kod: string, zorunlu: boolean): T | '' {
  if (x === undefined || x === null || x === '') { if (zorunlu) throw new Gecersiz(kod); return ''; }
  if (typeof x !== 'string' || !(kume as readonly string[]).includes(x)) throw new Gecersiz(kod);
  return x as T;
}

/** Sayı: boş → null (bilinmiyor); aksi hâlde 0..AZAMI_SAYI tam sayı. «3» gibi rakam dizesi de kabul edilir. */
function sayi(x: unknown): number | null {
  if (x === undefined || x === null || x === '') return null;
  const n = typeof x === 'number' ? x : (typeof x === 'string' && /^\s*\d{1,4}\s*$/.test(x) ? Number(x) : NaN);
  if (!Number.isInteger(n) || n < 0 || n > AZAMI_SAYI) throw new Gecersiz('sayi-gecersiz');
  return n;
}

function kisiDogrula(ham: unknown, yil: number): EnvanterKisisi {
  const k = 'kisi-gecersiz';
  if (!nesneMi(ham)) throw new Gecersiz(k);
  if (ham.izin !== true) throw new Gecersiz('kisi-izin-eksik');
  const gizli = ham.gizli === true;
  const dogumYili = sayiYil(ham.dogumYili, yil);
  const ortak = {
    cinsiyet: secim(ham.cinsiyet, CINSIYETLER, k, true) as Cinsiyet,
    dogumYili,
    dil: secim(ham.dil, TERCIH_DILLERI, k, true) as TercihDili,
    ihtidaYili: secim(ham.ihtidaYili, IHTIDA_YILLARI, k, true) as IhtidaYili,
    belge: secim(ham.belge, BELGE_DURUMLARI, k, true) as BelgeDurumu,
  };
  if (gizli) {
    const kod = metin(ham.kod, SINIR.kod, k);
    if (!kod || !/^[\p{L}\p{N} ._-]+$/u.test(kod)) throw new Gecersiz(k);
    // Gizli satır: ad, telefon, e-posta gelse de DÜŞÜRÜLÜR.
    return { gizli: true, kod, ad: '', telefon: '', eposta: '', ...ortak };
  }
  const ad = kisiAdi(ham.ad, k, true);
  const tel = telefon(ham.telefon, k);
  const ep = eposta(ham.eposta, k);
  if (!tel && !ep) throw new Gecersiz(k);
  return { gizli: false, kod: '', ad, telefon: tel, eposta: ep, ...ortak };
}

function sayiYil(x: unknown, yil: number): number | null {
  if (x === undefined || x === null || x === '') return null;
  const n = typeof x === 'number' ? x : (typeof x === 'string' && /^\s*\d{4}\s*$/.test(x) ? Number(x) : NaN);
  if (!Number.isInteger(n) || n < 1900 || n > yil) throw new Gecersiz('kisi-gecersiz');
  return n;
}

/** Sunucu doğrulaması. `camiler` = camiTablosu(...); `yil` = bugünün yılı (doğum yılı üst sınırı). */
export function dogrula(ham: unknown, camiler: EnvanterCamisi[], yil: number): DogrulamaSonucu {
  try {
    return { ok: true, veri: dogrulaIc(ham, camiler, yil) };
  } catch (h) {
    if (h instanceof Gecersiz) return { ok: false, hata: h.kod };
    throw h;
  }
}

function dogrulaIc(ham: unknown, camiler: EnvanterCamisi[], yil: number): EnvanterKaydi {
  if (!nesneMi(ham)) throw new Gecersiz('bos-istek');
  const v = ham;
  if (Number(v.formSurumu) !== FORM_SURUMU || v.onaySurumu !== ONAY_SURUMU) throw new Gecersiz('surum-gecersiz');
  const onay = nesne(v.onay);
  if (onay.bilgilendirme !== true || onay.izin !== true) throw new Gecersiz('onay-eksik');

  // 2. Görevli ve cami
  const g = nesne(v.gorevli);
  const ge = 'gorevli-eksik';
  const gorevliAd = kisiAdi(g.ad, ge, true);
  const bolge = secim(g.bolge, BOLGELER, ge, true) as Bolge;
  const camiSecimi = metin(g.cami, 80, ge);
  let camiId = '', camiAd = '';
  if (!camiSecimi) throw new Gecersiz(ge);
  if (camiSecimi === LISTEDE_YOK) {
    camiAd = metin(g.camiSerbest, SINIR.camiSerbest, ge);
    if (camiAd.length < 2) throw new Gecersiz(ge);
  } else {
    const c = camiler.find((x) => x.id === camiSecimi);
    if (!c || c.bolge !== bolge) throw new Gecersiz('cami-gecersiz');
    camiId = c.id; camiAd = camiEtiketi(c);
  }
  const statu = secim(g.statu, STATULER, ge, true) as Statu;
  const statuAciklama = statu === 'diger' ? metin(g.statuAciklama, SINIR.statuAciklama, ge) : '';
  const gTel = telefon(g.telefon, ge), gEp = eposta(g.eposta, ge);
  if (!gTel && !gEp) throw new Gecersiz(ge);
  if (g.diller !== undefined && !Array.isArray(g.diller)) throw new Gecersiz('alan-gecersiz');
  const diller: GorevliDili[] = [];
  for (const d of (g.diller as unknown[] | undefined) ?? []) {
    const s = secim(d, GOREVLI_DILLERI, 'alan-gecersiz', true) as GorevliDili;
    if (!diller.includes(s)) diller.push(s);
  }
  diller.sort((a, b) => GOREVLI_DILLERI.indexOf(a) - GOREVLI_DILLERI.indexOf(b));
  const digerDil = diller.includes('diger') ? metin(g.digerDil, SINIR.digerDil, ge) : '';

  // 3, 5, 7. Sayılar
  const sayilar: Record<string, number | null> = {};
  for (const alan of [...SAYI_ALANLARI, ...GONULLU_SAYILARI]) sayilar[alan.yol.join('.')] = sayi(yolDeger(v, alan.yol));

  // 4. Adlı bildirim
  if (v.kisiler !== undefined && v.kisiler !== null && !Array.isArray(v.kisiler)) throw new Gecersiz('kisi-gecersiz');
  const kisilerHam = (v.kisiler as unknown[] | undefined) ?? [];
  if (kisilerHam.length > AZAMI_KISI) throw new Gecersiz('kisi-sayisi');
  // İzin denetimi önce bütün satırlarda: izinsiz satır, başka satırın biçim hatasından önce raporlanır.
  if (kisilerHam.some((k) => !nesneMi(k) || k.izin !== true)) throw new Gecersiz('kisi-izin-eksik');
  const kisiler = kisilerHam.map((k) => kisiDogrula(k, yil));

  // 6. Faaliyetler
  const f = nesne(v.faaliyet);
  const faaliyet = Object.fromEntries(FAALIYETLER.map((a) => [a, f[a] === true])) as Record<Faaliyet, boolean>;
  const materyal = metin(f.materyal, SINIR.uzunMetin, 'alan-gecersiz', true);

  // 8. Adaylar
  const aday = nesne(v.aday);
  const aa = nesne(aday.a);
  const aVar = secim(aa.var, EVET_HAYIR, 'aday-gecersiz', false);
  let a: EnvanterKaydi['aday']['a'] = null;
  if (aVar === 'evet') {
    if (aa.izin !== true) throw new Gecersiz('aday-izin-eksik');
    const ad = kisiAdi(aa.ad, 'aday-gecersiz', true);
    const tel = telefon(aa.telefon, 'aday-gecersiz'), ep = eposta(aa.eposta, 'aday-gecersiz');
    if (!tel && !ep) throw new Gecersiz('aday-gecersiz');
    a = { ad, telefon: tel, eposta: ep, neden: metin(aa.neden, SINIR.neden, 'aday-gecersiz', true) };
  }
  const ab = nesne(aday.b);
  const bSecim = secim(ab.secim, ADAY_B_SECIMLERI, 'aday-gecersiz', false);
  const b = bSecim === 'baskasi'
    ? { secim: bSecim, ad: kisiAdi(ab.ad, 'aday-gecersiz', true), cami: metin(ab.cami, SINIR.camiSerbest, 'aday-gecersiz') }
    : { secim: bSecim, ad: '', cami: '' };
  const ac = nesne(aday.c);
  const pilotId = metin(ac.cami, 80, 'aday-gecersiz');
  let c = { camiId: '', camiAd: '', gerekce: '' };
  if (pilotId) {
    const cami = camiler.find((x) => x.id === pilotId);
    if (!cami || cami.bolge !== bolge) throw new Gecersiz('aday-gecersiz');
    c = { camiId: cami.id, camiAd: camiEtiketi(cami), gerekce: metin(ac.gerekce, SINIR.gerekce, 'aday-gecersiz', true) };
  }
  const d = secim(nesne(aday.d).irtibat, IRTIBAT_ISTEGI, 'aday-gecersiz', false);

  // 9. Belgeler
  const bl = nesne(v.belge);
  const varMi = secim(bl.var, BELGE_VAR, 'alan-gecersiz', false);
  const belge = varMi === 'evet'
    ? { varMi, adet: sayi(bl.adet), iletilebilir: secim(bl.iletilebilir, EVET_HAYIR, 'alan-gecersiz', false) }
    : { varMi, adet: null, iletilebilir: '' as const };

  // 10. Görüş
  const gorus = metin(v.gorus, SINIR.uzunMetin, 'alan-gecersiz', true);

  return {
    gorevli: { ad: gorevliAd, bolge, camiId, camiAd, statu, statuAciklama, telefon: gTel, eposta: gEp, diller, digerDil },
    sayilar, kisiler, faaliyet, materyal,
    aday: { a, b, c, d },
    belge, gorus,
  };
}

/* ===================================================================
   Defter — iki sekme. Sıra BAĞLAYICIDIR: yeni sütun yalnız SONA eklenir.
   Hücreler Apps Script'te `hucreGuvenli` ile metne sabitlenir (formül enjeksiyonu).
   =================================================================== */

export const GOREVLI_SEKMESI = 'Görevli';
export const BILDIRIM_SEKMESI = 'Bildirim';

export const GOREVLI_BASLIKLARI: string[] = [
  'Zaman', 'Referans', 'Gönderim anahtarı', 'Form sürümü', 'Onay sürümü',
  'Görevli adı', 'Bölge', 'Cami kimliği', 'Cami adı', 'Statü', 'Telefon', 'E-posta', 'Konuştuğu diller',
  ...SAYI_ALANLARI.map((a) => a.baslik),
  ...FAALIYETLER.map((f) => `Faaliyet: ${S.faaliyet[f]}`), 'Materyal ve ihtiyaç',
  ...GONULLU_SAYILARI.map((a) => a.baslik),
  'Adlı bildirim sayısı', 'Gizli/kodlu bildirim sayısı', 'Komisyon adayı bildirildi',
  'Bölge ihtida sorumlusu adayı', 'Aday personelin adı', 'Aday personelin camisi',
  'Pilot cami önerisi', 'Pilot cami gerekçesi', 'Cami irtibat kişisi olmak istiyor',
  'İhtida belgesi/kayıt defteri var', 'Yaklaşık adet', 'Güvenli yoldan iletilebilir', 'Görüş ve öneri',
];

export const BILDIRIM_BASLIKLARI: string[] = [
  'Zaman', 'Referans', 'Gönderim anahtarı', 'Onay sürümü', 'Görevli adı', 'Bölge', 'Cami', 'Satır türü', 'Gizli',
  'Kod', 'Ad soyad', 'Cinsiyet', 'Doğum yılı', 'Telefon', 'E-posta', 'Tercih ettiği dil', 'İhtida yılı', 'Belge durumu',
  'İzin', 'Not',
];

export interface SatirBaglami { zaman: Date; ref: string; anahtar: string }

const EH = (b: boolean) => (b ? 'E' : 'H');
const bosIse = (n: number | null) => (n === null ? '' : n);

export function gorevliSatiri(k: EnvanterKaydi, b: SatirBaglami): unknown[] {
  const g = k.gorevli;
  const statu = S.statu[g.statu] + (g.statuAciklama ? `: ${g.statuAciklama}` : '');
  const diller = g.diller.map((d) => (d === 'diger' && g.digerDil ? `${S.gorevliDili[d]} (${g.digerDil})` : S.gorevliDili[d])).join(', ');
  const satir: unknown[] = [
    b.zaman, b.ref, b.anahtar, FORM_SURUMU, ONAY_SURUMU,
    g.ad, g.bolge, g.camiId || LISTEDE_YOK, g.camiAd, statu, g.telefon, g.eposta, diller,
    ...SAYI_ALANLARI.map((a) => bosIse(k.sayilar[a.yol.join('.')])),
    ...FAALIYETLER.map((f) => EH(k.faaliyet[f])), k.materyal,
    ...GONULLU_SAYILARI.map((a) => bosIse(k.sayilar[a.yol.join('.')])),
    k.kisiler.length, k.kisiler.filter((x) => x.gizli).length, EH(!!k.aday.a),
    k.aday.b.secim ? S.adayB[k.aday.b.secim] : '', k.aday.b.ad, k.aday.b.cami,
    k.aday.c.camiAd, k.aday.c.gerekce, k.aday.d ? S.irtibat[k.aday.d] : '',
    k.belge.varMi ? S.belgeVar[k.belge.varMi] : '', bosIse(k.belge.adet),
    k.belge.iletilebilir ? S.evetHayir[k.belge.iletilebilir] : '', k.gorus,
  ];
  if (satir.length !== GOREVLI_BASLIKLARI.length) throw new Error('envanter: gorevli satiri basliklarla uyusmuyor');
  return satir;
}

export function bildirimSatirlari(k: EnvanterKaydi, b: SatirBaglami): unknown[][] {
  const g = k.gorevli;
  const ortak = [b.zaman, b.ref, b.anahtar, ONAY_SURUMU, g.ad, g.bolge, g.camiAd];
  const satirlar: unknown[][] = k.kisiler.map((x) => [
    ...ortak, 'bildirim', EH(x.gizli), x.kod, x.gizli ? '' : x.ad, S.cinsiyet[x.cinsiyet], x.dogumYili ?? '',
    x.gizli ? '' : x.telefon, x.gizli ? '' : x.eposta, S.tercihDili[x.dil], S.ihtidaYili[x.ihtidaYili], S.belgeKisi[x.belge],
    'E', '',
  ]);
  if (k.aday.a) {
    const a = k.aday.a;
    satirlar.push([...ortak, 'komisyon-adayi', 'H', '', a.ad, '', '', a.telefon, a.eposta, '', '', '', 'E', a.neden]);
  }
  for (const s of satirlar) if (s.length !== BILDIRIM_BASLIKLARI.length) throw new Error('envanter: bildirim satiri basliklarla uyusmuyor');
  return satirlar;
}
