/**
 * İlim Yolu · Kur'an Okuma ilerlemesi (10 Kasım 2026). Saf ve ağsız: depo bir parametredir.
 *
 * SIKIŞTIRILMIŞ KODLAMA. `kullanicilar/{uid}/calisma/okuma` belgesinin kuralı en çok 120 `maddeler` anahtarına izin verir; yüzlerce
 * madde için anahtar açılamaz. Bu yüzden adım başına (o1…o9) TEK dize tutulur: dizenin `n`. üçlüsü adımın `n`. maddesinin durumudur.
 * Üçlü = 1 hane kutu (`0` hiç çalışılmadı, `1`…`5` = tekrar.ts kutusu 0…4) + 2 hane taban-36 gün (2026-09-01'den beri geçen gün).
 * Sonraki tekrar günü saklanmaz: son gün + KUTU_GUN[kutu]. Kayıt sırası (maddenin adımdaki yeri) yol.ts'te yalnız sona eklenerek
 * büyür; sıra değişirse eski kayıtlar kayar (tests/okuma-veri.test.mjs parmak izi bunu yakalar).
 * Birleştirme (iki cihaz): her madde için «daha yeni gün kazanır; aynı günde daha düşük kutu kazanır (temkinli)». Bu bir tam sıralamanın
 * en büyüğünü almaktır, yani değişmeli, birleşmeli ve kendi kendine uygulanınca değişmez; zaman damgası gerekmez.
 */
import type { Depo } from '../ezber/cihaz';
import { KUTU_GUN, gunEkle, gunFarki, tarihMi, sonrakiTekrar, type TekrarSonucu } from '../ezber/tekrar';

export const ANAHTAR = 'ulucamii:okuma:cihaz:v1';
/** `kullanicilar/{uid}/calisma/{ad}` */
export const CALISMA_BELGESI = 'okuma';
export const ADIM_DESENI = /^o[1-9]$/;
/** Bir adımdaki en çok madde sayısı (dize uzunluğu 3 katı). */
export const AZAMI_MADDE = 400;
export const TABAN_GUN = '2026-09-01';
const UID_OZETI = /^[a-z0-9]{8,64}$/;
const UCLU = /^[0-5][0-9a-z]{2}$/;

export interface OkumaIlerleme {
  readonly v: 1;
  /** Adım (o1…) → üçlü dizisi (boş dizeler tutulmaz). */
  readonly maddeler: Readonly<Record<string, string>>;
}
export interface MaddeDurumu { readonly kutu: number; readonly gun: string }

export const bos = (): OkumaIlerleme => ({ v: 1, maddeler: {} });

/** Madde kimliği `o3-17` → adım ve 0 tabanlı sıra; geçersizse `null`. */
export function konum(id: string): { adim: string; sira: number } | null {
  const e = /^(o[1-9])-(\d{1,3})$/.exec(id);
  if (!e) return null;
  const sira = Number(e[2]);
  return sira < AZAMI_MADDE ? { adim: e[1], sira } : null;
}
export const maddeKimligi = (adim: string, sira: number): string => `${adim}-${sira}`;

const gunKodu = (gun: string): string => {
  const n = Math.min(Math.max(gunFarki(TABAN_GUN, gun), 0), 36 * 36 - 1);
  return n.toString(36).padStart(2, '0');
};
const gunCoz = (kod: string): string => gunEkle(TABAN_GUN, parseInt(kod, 36));
const ucluAl = (dize: string, sira: number): string => {
  const u = dize.slice(sira * 3, sira * 3 + 3);
  return UCLU.test(u) && u[0] !== '0' ? u : '000';
};

/** Maddenin durumu; hiç çalışılmadıysa `null`. */
export function durum(il: OkumaIlerleme, id: string): MaddeDurumu | null {
  const k = konum(id);
  if (!k) return null;
  const u = ucluAl(il.maddeler[k.adim] ?? '', k.sira);
  return u === '000' ? null : { kutu: Number(u[0]) - 1, gun: gunCoz(u.slice(1)) };
}
export const goruldu = (il: OkumaIlerleme, id: string): boolean => durum(il, id) !== null;
/** Maddenin sonraki tekrar günü; hiç çalışılmadıysa `null`. */
export function vade(il: OkumaIlerleme, id: string): string | null {
  const d = durum(il, id);
  return d ? gunEkle(d.gun, KUTU_GUN[d.kutu]) : null;
}
export const vadeGeldi = (il: OkumaIlerleme, id: string, bugun: string): boolean => {
  const v = vade(il, id);
  return v !== null && v <= bugun;
};

/** Bir üçlünün sıralama anahtarı: önce gün, sonra DÜŞÜK kutu üstün. `'000'` en küçüktür. */
const sirala = (u: string): number => (u === '000' ? -1 : parseInt(u.slice(1), 36) * 10 + (5 - Number(u[0])));

/** Bir sonuç işler: `tam` kutuyu bir artırır, `az` aynı kutuda tutar, `tekrar` başa alır (tekrar.ts ile aynı). Yeni nesne döner. */
export function isaretle(il: OkumaIlerleme, id: string, sonuc: TekrarSonucu, bugun: string): OkumaIlerleme {
  const k = konum(id);
  if (!k || !tarihMi(bugun)) return il;
  const eskiKutu = durum(il, id)?.kutu ?? -1;
  const yeni = `${sonrakiTekrar(eskiKutu, sonuc, bugun).kutu + 1}${gunKodu(bugun)}`;
  const eski = il.maddeler[k.adim] ?? '';
  const bosluk = Math.max(0, (k.sira + 1) * 3 - eski.length);
  const dizi = eski + '000'.repeat(Math.ceil(bosluk / 3));
  return { v: 1, maddeler: { ...il.maddeler, [k.adim]: dizi.slice(0, k.sira * 3) + yeni + dizi.slice(k.sira * 3 + 3) } };
}

/** Bilinmeyen kaynaktan (depo, bulut) güvenli durum kurar: yalnız o1…o9, yalnız geçerli üçlüler, uzunluk sınırlı, boşlar atılır. */
export function temizle(ham: unknown): OkumaIlerleme {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) return bos();
  const m = (ham as { maddeler?: unknown }).maddeler;
  if (typeof m !== 'object' || m === null || Array.isArray(m)) return bos();
  const cikti: Record<string, string> = {};
  for (const [adim, d] of Object.entries(m)) {
    if (!ADIM_DESENI.test(adim) || typeof d !== 'string') continue;
    let s = '';
    for (let i = 0; i < AZAMI_MADDE && i * 3 < d.length; i++) s += ucluAl(d, i);
    s = s.replace(/(000)+$/, '');
    if (s) cikti[adim] = s;
  }
  return { v: 1, maddeler: cikti };
}

/** İki durumu madde madde birleştirir (değişmeli, birleşmeli, idempotent). */
export function birlestir(a: unknown, b: unknown): OkumaIlerleme {
  const x = temizle(a);
  const y = temizle(b);
  const cikti: Record<string, string> = {};
  for (const adim of new Set([...Object.keys(x.maddeler), ...Object.keys(y.maddeler)])) {
    const p = x.maddeler[adim] ?? '';
    const q = y.maddeler[adim] ?? '';
    const n = Math.max(p.length, q.length) / 3;
    let s = '';
    for (let i = 0; i < n; i++) {
      const u = ucluAl(p, i);
      const w = ucluAl(q, i);
      s += sirala(u) >= sirala(w) ? u : w;
    }
    if (s) cikti[adim] = s;
  }
  return { v: 1, maddeler: cikti };
}

export const ayniMi = (a: OkumaIlerleme, b: OkumaIlerleme): boolean => {
  const adimlar = new Set([...Object.keys(a.maddeler), ...Object.keys(b.maddeler)]);
  return [...adimlar].every((k) => (a.maddeler[k] ?? '') === (b.maddeler[k] ?? ''));
};

/** Girişli kullanıcının cihaz kopyasının anahtarı (ham uid yazılmaz; özet hesap/isaret.ts'ten gelir). */
export function kullaniciAnahtari(uidOzeti: string): string {
  if (typeof uidOzeti !== 'string' || !UID_OZETI.test(uidOzeti)) throw new TypeError('uid özeti [a-z0-9]{8,64} olmalı');
  return `${ANAHTAR}:u:${uidOzeti}`;
}

export function oku(depo: Depo | null | undefined, anahtar: string = ANAHTAR): OkumaIlerleme {
  try {
    const ham = depo?.getItem(anahtar);
    return ham ? temizle(JSON.parse(ham)) : bos();
  } catch {
    return bos();
  }
}
export function yaz(depo: Depo | null | undefined, il: OkumaIlerleme, anahtar: string = ANAHTAR): boolean {
  try {
    if (!depo) return false;
    depo.setItem(anahtar, JSON.stringify(temizle(il)));
    return true;
  } catch {
    return false;
  }
}

/** Buluta giden yük: YALNIZ kuralın izin verdiği alanlar (`v, maddeler, guncelleme`). */
export const bulutYuku = (il: OkumaIlerleme, guncelleme: unknown) => ({ v: 1, maddeler: { ...temizle(il).maddeler }, guncelleme });

/** Hesaba gerçekten yeni bir şey katacak anonim madde sayısı (anonimin birleşimde kazandığı, hesapta olmayan maddeler). */
export function eklenecekSayisi(anonim: unknown, hesap: unknown): number {
  const x = temizle(anonim);
  const y = temizle(hesap);
  let n = 0;
  for (const adim of Object.keys(x.maddeler)) {
    const p = x.maddeler[adim];
    const q = y.maddeler[adim] ?? '';
    for (let i = 0; i < p.length / 3; i++) if (ucluAl(p, i) !== '000' && sirala(ucluAl(p, i)) > sirala(ucluAl(q, i))) n++;
  }
  return n;
}

/** Verilen maddelerin kaçı en az bir kez çalışıldı. */
export function sayim(il: OkumaIlerleme, idler: readonly string[]): { goruldu: number; toplam: number } {
  return { goruldu: idler.filter((id) => goruldu(il, id)).length, toplam: idler.length };
}
