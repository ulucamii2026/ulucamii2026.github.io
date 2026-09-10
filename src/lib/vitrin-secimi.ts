/** Vitrin arşiv değildir: tarih sınırı Brüksel takvim gününe göre değerlendirilir. */
export interface VitrinAdayi {
  id: string; baslik: string; ozet: string; gorsel: string; href: string;
  tarih: Date; tur: 'duyuru' | 'afis'; dil: string;
  vitrin?: 'otomatik' | 'goster' | 'gizle'; vitrinSon?: Date;
  oneCikan?: boolean; oneCikanSon?: Date;
}

const brusselsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Brussels',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const gun = (d: Date) => brusselsFormatter.format(d);

const takvimGunuFarki = (bugunStr: string, hedefStr: string) => {
  const ms1 = Date.parse(bugunStr + 'T00:00:00Z');
  const ms2 = Date.parse(hedefStr + 'T00:00:00Z');
  return Math.round((ms1 - ms2) / 86400000);
};

const isFallbackGorsel = (g?: string) => !g || g === '/media/vitrin/egitim-veli-portali.webp';

function adayiSec(mevcut: VitrinAdayi, yeni: VitrinAdayi): VitrinAdayi {
  // Ortak görsel paylaşımında detaylı duyuru korunmalı (afiş daha yeni tarihli olsa bile)
  if (mevcut.tur !== yeni.tur) {
    return mevcut.tur === 'duyuru' ? mevcut : yeni;
  }
  const pA = Number(Boolean(mevcut.oneCikan || mevcut.vitrin === 'goster'));
  const pB = Number(Boolean(yeni.oneCikan || yeni.vitrin === 'goster'));
  if (pA !== pB) return pA > pB ? mevcut : yeni;
  const tA = mevcut.tarih.getTime();
  const tB = yeni.tarih.getTime();
  if (tA !== tB) return tA > tB ? mevcut : yeni;
  return mevcut.id <= yeni.id ? mevcut : yeni;
}

export function vitrinSec(adaylar: VitrinAdayi[], simdi = new Date(), adet = 6) {
  if (adet <= 0) return [];
  const bugun = gun(simdi);

  const filtrelenmis = adaylar.filter(a => {
    const son = a.vitrinSon ?? a.oneCikanSon;
    const aGun = gun(a.tarih);
    if (a.vitrin === 'gizle') return false;
    if (aGun > bugun) return false;
    if (son && gun(son) < bugun) return false;
    if (a.vitrin === 'goster' || a.oneCikan) return true;
    const fark = takvimGunuFarki(bugun, aGun);
    return fark >= 0 && fark <= 90;
  });

  // Ortak görsel dedup: aynı görsel duyuru ve afişte varsa detaylı duyuru korunur.
  // Fallback görselleri dedup anahtarına girmez (href kullanılır).
  const tekilHarita = new Map<string, VitrinAdayi>();
  for (const a of filtrelenmis) {
    const anahtar = isFallbackGorsel(a.gorsel) ? `href:${a.href}` : `gorsel:${a.gorsel}`;
    const mevcut = tekilHarita.get(anahtar);
    if (!mevcut) {
      tekilHarita.set(anahtar, a);
    } else {
      tekilHarita.set(anahtar, adayiSec(mevcut, a));
    }
  }

  const pool = Array.from(tekilHarita.values()).sort((a, b) => {
    const pA = Number(Boolean(a.oneCikan || a.vitrin === 'goster'));
    const pB = Number(Boolean(b.oneCikan || b.vitrin === 'goster'));
    if (pA !== pB) return pB - pA;
    // Havuzda herhangi öncelikli duyuru varsa ilk sırada öncelikli duyuru yer almalı:
    // Öncelikliler arasında duyurular afişlerin önünde yer alır.
    if (pA && pB && a.tur !== b.tur) return a.tur === 'duyuru' ? -1 : 1;
    const tA = a.tarih.getTime();
    const tB = b.tarih.getTime();
    if (tA !== tB) return tB - tA;
    if (a.tur !== b.tur) return a.tur === 'duyuru' ? -1 : 1;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  });

  if (pool.length === 0) return [];
  if (adet === 1) return [pool[0]];

  const result: VitrinAdayi[] = [pool[0]];
  const R = pool.slice(1);
  const C = Math.min(adet - 1, R.length);

  if (C > 0) {
    const rAfisCount = R.filter(x => x.tur === 'afis').length;
    const rDuyuruCount = R.length - rAfisCount;

    const afis0 = result[0].tur === 'afis' ? 1 : 0;

    const min_req = Math.max(0, 1 - afis0);
    let min_afis = Math.min(C, Math.min(min_req, rAfisCount));
    min_afis = Math.max(min_afis, C - rDuyuruCount);

    const max_allowed = Math.max(min_afis, 2 - afis0);
    const max_afis = Math.max(min_afis, Math.min(max_allowed, rAfisCount));

    let picked_afis = 0;
    let picked_duyuru = 0;

    for (const item of R) {
      if (picked_afis + picked_duyuru === C) break;

      if (item.tur === 'afis') {
        if (picked_afis < max_afis) {
          picked_afis++;
          result.push(item);
        }
      } else {
        const remaining_slots = C - (picked_afis + picked_duyuru + 1);
        const needed_afis = Math.max(0, min_afis - picked_afis);
        if (remaining_slots >= needed_afis) {
          picked_duyuru++;
          result.push(item);
        }
      }
    }
  }

  return result;
}
