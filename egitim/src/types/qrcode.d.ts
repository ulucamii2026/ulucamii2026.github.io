// `qrcode` paketinin tür bildirimi yok (kök src/types/qrcode.d.ts ana siteye ait ve egitim projesinin dışında kalır).
// Yalnız kullanılan yüzey: basılı ezber kartının kare kodu için matris (egitim/src/lib/kare-kod.ts).
declare module 'qrcode' {
  interface BitMatrix {
    readonly size: number;
    get(satir: number, sutun: number): number;
  }
  const qr: {
    create(metin: string, secenekler?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): { readonly modules: BitMatrix; readonly version: number };
  };
  export default qr;
}
