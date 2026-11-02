// İlk içe aktarım: ortak.ts setGlobalOptions'ı çağırır (europe-west1, maxInstances: 2); bütün işlev tanımları ondan sonra gelir.
import './ortak';
import { onRequest } from 'firebase-functions/v2/https';
import pkg from '../package.json';

// Yer tutucu: dağıtım hattını ve /api/saglik yönlendirmesini sınar. Kişisel veri yok.
export const saglik = onRequest({ cors: false }, (_istek, yanit) => {
  yanit.set('Cache-Control', 'no-store');
  yanit.json({ ok: true, surum: pkg.version });
});

// İlim Yolu Dilim 1 — hesaplar (docs/ILIM-YOLU.md).
export { kullaniciAdiAl, hesabimiSil, hesapSilmeIptal, silmeTara, hareketsizTara } from './hesap';
export { cocukHesabiAc, kartYenile, cocukSifreYenile, cocukOturumKapat, cocukGiris, kartGiris } from './cocuk';
export { bagKoduUret, hesabiBagla, ogrenciHesaplariListe, portalSilmeTetik } from './bag';
