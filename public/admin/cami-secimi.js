import katalog from '../data/belcika-camileri.json' with { type: 'json' };

export const VARSAYILAN_CAMI = Object.freeze({
  id: 'ulucamii-marche', ad: 'Ulu Camii', sehir: 'Marche-en-Famenne',
  postaKodu: '6900', adres: 'Thier des Corbeaux 14', kurum: 'BDV',
});

const metin = (deger, azami = 160) => {
  const sonuc = String(deger ?? '').trim().replace(/\s+/g, ' ');
  return sonuc && sonuc.length <= azami ? sonuc : '';
};

/** Katalog camileri yalnız kimlikten çözülür; istemcinin adres kopyası güvenilir değildir. */
export function camiCoz(girdi) {
  if (girdi === undefined || girdi === null) return { ...VARSAYILAN_CAMI };
  if (!girdi || typeof girdi !== 'object') return null;
  const id = metin(girdi.id, 120);
  if (!id) return null;
  if (id === 'diger') {
    const ad = metin(girdi.ad, 120), sehir = metin(girdi.sehir, 80), postaKodu = metin(girdi.postaKodu, 4), adres = metin(girdi.adres, 200);
    if (!ad || !sehir || !/^[1-9][0-9]{3}$/.test(postaKodu) || !adres) return null;
    return { id, ad, sehir, postaKodu, adres, kurum: metin(girdi.kurum, 80) || 'Diğer' };
  }
  const bulunan = (katalog.camiler || []).find((cami) => cami.id === id);
  if (!bulunan) return null;
  return {
    id: bulunan.id, ad: bulunan.ad, sehir: bulunan.sehir,
    postaKodu: bulunan.postaKodu, adres: bulunan.adres, kurum: bulunan.kurum || '',
  };
}

export const baskaCamiMi = (kayit) => (kayit?.['Cami kimliği'] || kayit?.cami?.id || VARSAYILAN_CAMI.id) !== VARSAYILAN_CAMI.id;
export const camiAdresi = (cami) => [cami?.adres, cami?.postaKodu, cami?.sehir].filter(Boolean).join(', ');
