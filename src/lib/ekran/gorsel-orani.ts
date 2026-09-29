/**
 * Cami ekranı duyuru görselinin en/boy oranı — YALNIZ derleme anında (src/pages/ekran/akis.json.ts). sharp kullanır;
 * ekran paketine (src/ekran/, akis.ts) girmemelidir. Ekran afiş kutusunu görsel yüklenmeden bu oranla boyutlar
 * (src/ekran/slaytlar.ts → afisBoyutla): görsel gelince yerleşim zıplamaz.
 */
import sharp from 'sharp';
import { publicDosyasi } from './gorsel-surumu.ts';

/** Site içi görselin genişlik ÷ yükseklik oranı, 3 ondalık. EXIF ile döndürülmüş fotoğrafta (yön 5–8) döndürülmüş
 *  hâlinin oranı. Dış adres, bulunamayan ya da okunamayan dosyada undefined: çağıran varsayılanı kullanır. */
export async function gorselOrani(gorsel: string, oku: (yol: string) => Uint8Array | null = publicDosyasi): Promise<number | undefined> {
  if (!gorsel || gorsel.charAt(0) !== '/' || gorsel.charAt(1) === '/') return undefined;
  const bayt = oku(gorsel.split('?')[0]);
  if (!bayt) return undefined;
  try {
    const m = await sharp(bayt).metadata();
    if (!m.width || !m.height) return undefined;
    const donuk = (m.orientation || 1) >= 5;
    return Math.round((donuk ? m.height / m.width : m.width / m.height) * 1000) / 1000;
  } catch {
    return undefined;
  }
}
