/**
 * Ses ve şifreli kitap parçaları (/media/ses/*, /media/hoca-kitaplari/*) tek kaynaktan, ulucamii.be'de durur.
 * ulucamii.be ve localhost'ta '' (aynı köken, davranış değişmez); başka kökende (egitim.ulucamii.be) mutlak adres.
 * Görseller (/media/mektep/*) göreli kalır; onlar yeni kökene kopyalanır.
 */
export const SES_KOKEN_ANA = 'https://ulucamii.be';

export function sesKokeniBul(host: string | undefined): string {
  if (!host) return '';
  const h = host.toLowerCase();
  if (h === 'ulucamii.be' || h === 'www.ulucamii.be' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return '';
  return SES_KOKEN_ANA;
}

export const SES_KOKEN: string = sesKokeniBul(typeof location !== 'undefined' ? location.hostname : undefined);

/** `/media/...` gibi köke bağlı bir yolu doğru kökene çevirir (mutlak adres olduğu gibi kalır; çift önek olmaz). */
export const medyaYolu = (yol: string): string => (yol.startsWith('/') && !yol.startsWith('//') ? SES_KOKEN + yol : yol);
