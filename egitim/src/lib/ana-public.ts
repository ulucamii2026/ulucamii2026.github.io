/**
 * Ana sitenin `public/` klasörü (kök `public/`): derleme sırasında bazı sayfalar orada duran dosyaların varlığına bakar (ör. hadis sesleri).
 * `process.cwd()`'ye dayanmaz (npm komutu kökten de egitim/'den de çalışabilir) ve Astro derleme parçalarında `import.meta.url` güvenilmez:
 * bu yüzden birkaç aday denenir; hiçbiri bulunmazsa SESSİZCE boş dönmek yerine derleme düşer.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ISARET = 'media/ses/hadisler';

export function anaPublic(): string {
  const adaylar = [
    resolve(process.cwd(), 'public'),
    resolve(process.cwd(), '..', 'public'),
    fileURLToPath(new URL('../../../public', import.meta.url)),
    fileURLToPath(new URL('../../../../public', import.meta.url)),
  ];
  const bulunan = adaylar.find((d) => existsSync(resolve(d, ISARET)));
  if (!bulunan) throw new Error(`ana sitenin public/ klasörü bulunamadı (${ISARET}); denenenler: ${adaylar.join(' | ')}`);
  return bulunan;
}
