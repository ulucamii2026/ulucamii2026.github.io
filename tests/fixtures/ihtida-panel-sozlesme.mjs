/**
 * Ihtida panelinin `basvuruAl` sözleşmesinin DOĞRULAYICI tarafı: test sabitesi (fixture).
 * Kaynak: panel deposu D:/tmp/ihtida-dilim5, commit d92c79ec (functions/src/dosya-saf.ts + saf.ts + enumlar.ts + basvuru.ts).
 * Yalnız silinebilir TypeScript tür bildirimleri çıkarıldı ve cami kataloğu bu sitenin kataloğundan okunur; mantık satır satır aynıdır.
 * Panelde bu mantık değişirse bu dosya GÜNCELLENİR (iki taraf birlikte yürümeli); testler gerçek Firebase'e bağlanmaz.
 *
 * Bilinen kayma (katalog): bu sitenin kataloğunda olup panel kataloğunda OLMAYAN kimlikler KATALOG_PANELDE_YOK'ta;
 * panel onları 400 (camiId) ile reddeder.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const DILLER = ['fr', 'nl', 'de', 'en', 'tr', 'ar'];
export const CINSIYETLER = ['K', 'E'];
export const UYRUKLAR = ['be', 'fr', 'nl', 'de', 'gb', 'diger'];
export const KATALOG_PANELDE_YOK = ['de-koepel-camii-borgerhout'];
export const BASVURU_IZINLI_ALANLAR = ['ref', 'zaman', 'dil', 'cinsiyet', 'dogumYili', 'dogumTarihi', 'uyruk', 'camiId', 'torenDili', 'rizaSurum', 'ad', 'eposta'];
export const BASVURU_REF = /^IH-\d{4}-\d{4,6}$/;
export const IMZA_PENCERE_MS = 5 * 60_000;
export const EN_BUYUK_GOVDE = 16 * 1024;

export class GirdiHatasi extends Error { constructor(alan) { super(`gecersiz:${alan}`); this.alan = alan; } }

const katalog = JSON.parse(readFileSync(new URL('../../public/data/belcika-camileri.json', import.meta.url), 'utf8'));
const CAMILER = new Map(katalog.camiler.filter((c) => !KATALOG_PANELDE_YOK.includes(c.id)).map((c) => [c.id, { postaKodu: c.postaKodu, sehir: c.sehir }]));

const GUN_BICIMI = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' });
export const bugunGun = (ms) => GUN_BICIMI.format(new Date(ms));
const takvimGunuMu = (y, a, g) => {
  if (!Number.isInteger(y) || !Number.isInteger(a) || !Number.isInteger(g) || y < 1900 || y > 2200 || a < 1 || a > 12 || g < 1) return false;
  return g <= new Date(Date.UTC(y, a, 0)).getUTCDate();
};

// ── imza ──
export const imzaHesapla = (anahtar, zaman, nonce, govde) => {
  if (typeof anahtar !== 'string' || anahtar.length < 32) throw new Error('imza-anahtari-gecersiz');
  return createHmac('sha256', anahtar).update(`${zaman}\n${nonce}\n${govde}`).digest('hex');
};
export function imzaDogrula(anahtar, b, govde, simdiMs) {
  const { zaman, nonce, imza } = b;
  if (typeof zaman !== 'string' || !/^\d{13}$/.test(zaman)) return { ok: false, neden: 'zaman-bicimi' };
  if (typeof nonce !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(nonce)) return { ok: false, neden: 'nonce-bicimi' };
  if (typeof imza !== 'string' || !/^[0-9a-f]{64}$/.test(imza)) return { ok: false, neden: 'imza-bicimi' };
  const beklenen = Buffer.from(imzaHesapla(anahtar, zaman, nonce, govde), 'hex');
  if (!timingSafeEqual(beklenen, Buffer.from(imza, 'hex'))) return { ok: false, neden: 'imza' };
  const z = Number(zaman);
  if (Math.abs(simdiMs - z) > IMZA_PENCERE_MS) return { ok: false, neden: 'zaman-penceresi' };
  return { ok: true, nonce, zamanMs: z };
}

// ── girdi doğrulama (saf.ts epostaAl, dosya-saf.ts tamAdAl / basvuruAyikla) ──
function epostaAl(v) {
  if (typeof v !== 'string') throw new GirdiHatasi('eposta');
  const e = v.trim().toLowerCase();
  if (e.length > 254 || !/^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,24}$/.test(e)) throw new GirdiHatasi('eposta');
  return e;
}
function tamAdAl(v) {
  if (typeof v !== 'string') throw new GirdiHatasi('ad');
  const a = v.normalize('NFC').replace(/\s+/g, ' ').trim();
  const n = [...a].length;
  if (n < 2 || n > 120 || !/^\p{L}[\p{L}\p{M} .'’-]*$/u.test(a)) throw new GirdiHatasi('ad');
  return a;
}
function bolgeTuret(postaKodu) {
  const p = Number(postaKodu);
  if (!Number.isInteger(p)) return null;
  if (p >= 4000 && p < 5000) return 'liege';
  if (p >= 5000 && p < 6000) return 'namurLux';
  if (p >= 6000 && p < 6600) return 'hainaut';
  if (p >= 6600 && p < 7000) return 'namurLux';
  if (p >= 7000 && p < 8000) return 'hainaut';
  return null;
}
const secenek = (v, liste, alan) => {
  if (typeof v !== 'string' || !liste.includes(v)) throw new GirdiHatasi(alan);
  return v;
};
function dogumTarihiCoz(v) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const tr = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);
  const p = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : tr ? [Number(tr[3]), Number(tr[2]), Number(tr[1])] : null;
  if (!p || !takvimGunuMu(p[0], p[1], p[2])) throw new GirdiHatasi('dogumTarihi');
  return p;
}
export function yasHesapla(y, a, g, simdiMs) {
  const [yy, aa, gg] = bugunGun(simdiMs).split('-').map(Number);
  return yy - y - (aa < a || (aa === a && gg < g) ? 1 : 0);
}

/** Panelin `basvuruAyikla` işlevi (JSON.parse edilmiş gövde). Sonuç: {kucuk:true} | {kapsamDisi:true} | {veri}. Hata: GirdiHatasi (panelde 400). */
export function basvuruAyikla(govde, simdiMs) {
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) throw new GirdiHatasi('govde');
  const g = govde;
  const al = (k) => (Object.prototype.hasOwnProperty.call(g, k) ? g[k] : undefined);
  const refDeger = al('ref');
  if (typeof refDeger !== 'string' || !BASVURU_REF.test(refDeger)) throw new GirdiHatasi('ref');
  const ref = refDeger;
  let yil; let yas = null;
  const t = al('dogumTarihi'); const y0 = al('dogumYili');
  if (t !== undefined) {
    if (typeof t !== 'string') throw new GirdiHatasi('dogumTarihi');
    const [ty, ta, tg] = dogumTarihiCoz(t);
    if (y0 !== undefined && y0 !== ty) throw new GirdiHatasi('dogumYili');
    yil = ty; yas = yasHesapla(ty, ta, tg, simdiMs);
  } else {
    if (typeof y0 !== 'number' || !Number.isInteger(y0)) throw new GirdiHatasi('dogumYili');
    yil = y0;
  }
  const buYil = Number(bugunGun(simdiMs).slice(0, 4));
  if (yil < 1900 || yil > buYil) throw new GirdiHatasi('dogumYili');
  const kucuk = yas !== null ? yas < 18 : buYil - yil < 19;
  if (kucuk) return { kucuk: true, ref };
  const dil = secenek(al('dil'), DILLER, 'dil');
  const cinsiyet = secenek(al('cinsiyet'), CINSIYETLER, 'cinsiyet');
  const uyruk = secenek(al('uyruk'), UYRUKLAR, 'uyruk');
  const torenDili = secenek(al('torenDili'), DILLER, 'torenDili');
  const camiId = al('camiId');
  if (typeof camiId !== 'string' || !CAMILER.has(camiId)) throw new GirdiHatasi('camiId');
  const rizaSurum = al('rizaSurum');
  if (typeof rizaSurum !== 'string' || !/^[A-Za-z0-9._-]{1,32}$/.test(rizaSurum)) throw new GirdiHatasi('rizaSurum');
  let zamanMs = simdiMs;
  const z = al('zaman');
  if (z !== undefined) {
    const ms = typeof z === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(z) ? Date.parse(z) : NaN;
    if (!Number.isFinite(ms) || ms > simdiMs + 86_400_000 || ms < simdiMs - 400 * 86_400_000) throw new GirdiHatasi('zaman');
    zamanMs = ms;
  }
  const ad = tamAdAl(al('ad'));
  const eposta = epostaAl(al('eposta'));
  const c = CAMILER.get(camiId);
  if (bolgeTuret(c.postaKodu) === null) return { kucuk: false, kapsamDisi: true };
  return { kucuk: false, kapsamDisi: false, veri: { ref, zamanMs, dil, cinsiyet, dogumYili: yil, uyruk, camiId, torenDili, rizaSurum, ad, eposta } };
}

/**
 * Panelin HTTP kapısının (basvuru.ts) saf özeti: gövde boyutu, imza, sonra gövde ayıklama → durum kodu.
 * Kill-switch (503) ve nonce tekrarı (401) panelin veritabanına bağlıdır; burada `acik` ve `kullanilmisNonce` ile taklit edilir.
 */
export function basvuruKapisi({ anahtar, basliklar, ham, simdiMs, acik = true, kullanilmisNonce = new Set() }) {
  if (Buffer.byteLength(ham) > EN_BUYUK_GOVDE) return { durum: 413 };
  const im = imzaDogrula(anahtar, { zaman: basliklar['x-ihtida-zaman'], nonce: basliklar['x-ihtida-nonce'], imza: basliklar['x-ihtida-imza'] }, ham, simdiMs);
  if (!im.ok) return { durum: 401, neden: im.neden };
  if (!acik) return { durum: 503 };
  if (kullanilmisNonce.has(im.nonce)) return { durum: 401, neden: 'nonce' };
  kullanilmisNonce.add(im.nonce);
  let s;
  try { s = basvuruAyikla(JSON.parse(ham), simdiMs); } catch (e) { if (e instanceof GirdiHatasi) return { durum: 400, alan: e.alan }; return { durum: 400, alan: 'govde' }; }
  if (s.kucuk) return { durum: 200, saklandi: false };
  if (s.kapsamDisi) return { durum: 422 };
  return { durum: 200, saklandi: true, veri: s.veri };
}
