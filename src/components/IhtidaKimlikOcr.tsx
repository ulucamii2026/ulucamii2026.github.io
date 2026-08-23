/** İhtida Başvuru Formu — kimlik/pasaport görsellerinden MRZ okuma motoru.
 *  Saf mantık dosyası (JSX yok); "Ihtida*" dosya adı kuralına uymak için .tsx uzantılı.
 *
 *  Kur'an kursu kayıt sistemindeki assets/kimlik.js'in 3. bölümünden (görüntü hazırlığı +
 *  tesseract.js motoru) TypeScript'e taşınmıştır. Tek fark: tesseract.js burada <script>
 *  enjeksiyonuyla değil, npm paketinin dinamik import'uyla (`await import('tesseract.js')`)
 *  yüklenir — böylece Vite bunu ayrı bir chunk'a çıkarır ve yalnızca bu fonksiyon ilk kez
 *  çağrıldığında (adım geçişinde) indirilir. Worker/çekirdek/dil verisi CDN'den DEĞİL,
 *  bu sitenin kendi `public/vendor/tesseract/` klasöründen sunulur.
 *
 *  Doğruluk için görüntü önişleme: MRZ bandı alttan kırpılır, gri tona indirilir,
 *  histogram tabanlı kontrast gerilir ve 1700px genişliğe büyütülür. Birden çok bant
 *  oranı ve birden çok görsel (ön/arka) sırayla denenir; ilk ICAO-doğrulanan sonuç
 *  kullanılır. Gerçek bir Belçika ikamet kartıyla yapılan yerel testte bu boru hattı
 *  ad/soyad, doğum tarihi, cinsiyet, uyruk ve geçerlilik tarihini kontrol haneleri
 *  dahil doğru okumuştur (bkz. proje notları). */
import { mrzAyristir, type MrzSonuc } from './IhtidaMrz';

const MRZ_KARAKTER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<';
const OCR_EN = 1700;
const BANTLAR = [0.4, 0.55, 1];

const VENDOR_KOK = '/vendor/tesseract';

export interface TaramaIlerleme { yuzde: number; deneme: number; toplamDeneme: number }

let isciSozu: Promise<any> | null = null;
/* tesseract.js'te logger yalnızca worker OLUŞTURULURKEN bağlanır; yeniden kullanılan
 * bir worker'da her tarama çağrısı için farklı bir ilerleme geri çağrımı istiyoruz.
 * Bu yüzden oluşturma anında sabit bir yönlendirici veriyoruz, o da o an aktif olan
 * geri çağrımı çağırıyor. */
let aktifIlerlemeYaz: ((m: any) => void) | null = null;

async function isciAl(): Promise<any> {
  if (isciSozu) return isciSozu;
  isciSozu = (async () => {
    const mod: any = await import('tesseract.js');
    const createWorker = mod.createWorker ?? mod.default?.createWorker;
    const worker = await createWorker('eng', 1, {
      workerPath: `${VENDOR_KOK}/worker.min.js`,
      corePath: `${VENDOR_KOK}/core`,
      langPath: VENDOR_KOK,
      gzip: true,
      logger: (m: any) => aktifIlerlemeYaz?.(m),
    } as any);
    await worker.setParameters({
      tessedit_char_whitelist: MRZ_KARAKTER,
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '0',
    } as any);
    return worker;
  })();
  isciSozu.catch(() => { isciSozu = null; });
  return isciSozu;
}

function dataUrlCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const gorsel = new Image();
    gorsel.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = gorsel.naturalWidth;
      canvas.height = gorsel.naturalHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) { reject(new Error('canvas-baglami-yok')); return; }
      ctx.drawImage(gorsel, 0, 0);
      resolve(canvas);
    };
    gorsel.onerror = () => reject(new Error('gorsel-cozulemedi'));
    gorsel.src = dataUrl;
  });
}

/** Seçilen bandı büyütüp gri tona indirir ve kontrastı gerdirir (MRZ okunurluğu için). */
function ocrHazirla(canvas: HTMLCanvasElement, altOran: number): HTMLCanvasElement {
  const kaynakY = Math.round(canvas.height * (1 - altOran));
  const kaynakB = canvas.height - kaynakY;
  const olcek = OCR_EN / canvas.width;
  const hedef = document.createElement('canvas');
  hedef.width = OCR_EN;
  hedef.height = Math.max(1, Math.round(kaynakB * olcek));
  const ctx = hedef.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, kaynakY, canvas.width, kaynakB, 0, 0, hedef.width, hedef.height);

  const goruntu = ctx.getImageData(0, 0, hedef.width, hedef.height);
  const veri = goruntu.data;
  const histogram = new Uint32Array(256);
  for (let i = 0; i < veri.length; i += 4) {
    const g = (0.299 * veri[i] + 0.587 * veri[i + 1] + 0.114 * veri[i + 2]) | 0;
    veri[i] = veri[i + 1] = veri[i + 2] = g;
    histogram[g] += 1;
  }
  const piksel = veri.length / 4;
  const altSinir = Math.round(piksel * 0.02);
  const ustSinir = Math.round(piksel * 0.98);
  let birikim = 0;
  let dusuk = 0;
  let yuksek = 255;
  for (let g = 0; g < 256; g += 1) {
    birikim += histogram[g];
    if (birikim >= altSinir) { dusuk = g; break; }
  }
  birikim = 0;
  for (let g = 255; g >= 0; g -= 1) {
    birikim += histogram[g];
    if (birikim >= piksel - ustSinir) { yuksek = g; break; }
  }
  const aralik = Math.max(1, yuksek - dusuk);
  for (let i = 0; i < veri.length; i += 4) {
    const g = Math.max(0, Math.min(255, Math.round((veri[i] - dusuk) * 255 / aralik)));
    veri[i] = veri[i + 1] = veri[i + 2] = g;
  }
  ctx.putImageData(goruntu, 0, 0);
  return hedef;
}

/** Verilen görsellerde (öncelik sırasına göre) MRZ arar; ilk ICAO-doğrulanan sonucu döner.
 *  Hiçbiri doğrulanmazsa null — akış durmaz, kullanıcı elle doldurur. */
export async function kimlikTara(
  dataUrlListesi: (string | undefined)[],
  onIlerleme?: (bilgi: TaramaIlerleme) => void,
): Promise<MrzSonuc | null> {
  const gorseller = dataUrlListesi.filter((v): v is string => Boolean(v));
  if (!gorseller.length) return null;

  const toplamDeneme = gorseller.length * BANTLAR.length;
  let deneme = 0;

  const worker = await isciAl();
  aktifIlerlemeYaz = (olay: any) => {
    if (!olay || typeof olay.progress !== 'number') return;
    const yuzde = Math.round(olay.progress * 100);
    onIlerleme?.({ yuzde, deneme, toplamDeneme });
  };

  try {
    for (let g = 0; g < gorseller.length; g += 1) {
      const canvas = await dataUrlCanvas(gorseller[g]);
      for (let b = 0; b < BANTLAR.length; b += 1) {
        deneme += 1;
        onIlerleme?.({ yuzde: 0, deneme, toplamDeneme });
        const hazir = ocrHazirla(canvas, BANTLAR[b]);
        const cikti = await worker.recognize(hazir);
        const sonuc = mrzAyristir(cikti?.data?.text || '');
        if (sonuc) return sonuc;
      }
    }
    return null;
  } finally {
    aktifIlerlemeYaz = null;
  }
}

export async function kimlikTaramaMotoruKapat(): Promise<void> {
  if (!isciSozu) return;
  try { const w = await isciSozu; await w.terminate(); } catch { /* yok say */ }
  isciSozu = null;
}
