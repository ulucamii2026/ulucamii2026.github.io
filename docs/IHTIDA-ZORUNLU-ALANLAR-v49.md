# İhtida başvurusu: EK-9 alanları boş gitmesin (v49, 16 Kasım 2026)

Gerekçe: DHYS boş alanlı kaydı reddediyor (Vahi Bey, 12 Kasım); basılı EK-9'larda «Bildirilmedi / Non communiqué» çıkıyordu. Rıdvan KAYAHAN 16 Kasım 2026'da onayladı. **Yayın ayrı onaya bağlıdır** (push, Pages, Apps Script v49 dağıtımı yapılmadı).

## Kurallar
- **İhtida sebebi zorunlu:** en az 10 karakter ve en az 5 harf (her alfabe, Unicode `\p{L}`).
- **EK-9 kişisel metinleri** (doğum yeri, uyruk, anne adı, baba adı, öğrenim, meslek, önceki din): en az 2 Unicode harf. «..», «-», «—», «x», «?» geçmez; «Bilinmiyor», «Inconnu», «Onbekend», «Unknown», «Étudiante», «Sans emploi» geçer. Ad ve soyad bu kuralın dışındadır.
- Formda anne/baba adı altında «Bilmiyorsanız “Bilinmiyor” yazınız.», meslek altında «Öğrenci / Çalışmıyor» ipucu (TR/FR/EN/NL/DE).
- **Yönetim penceresi (EK-9 hazırlığı):** sekiz EK-9 alanı ve sebep zorunlu; boş ya da yer tutucu değerle kaydedilemez/son nüsha üretilemez. Eski boş kayıtlar yeniden onaylanırken tamamlanmalıdır; eski belgeler okunmaya devam eder (`ek9.js` «Bildirilmedi» yedeği durur).

## Kodda üç kopya (birlikte değiştir)
`src/lib/ihtida-metin.ts` (istemci) · `scripts/apps-script/ulucamii-Kod-v51.gs` (`ihtidaKisiMetniTamam`, `ihtidaSebepTamam`) · `public/admin/ek9-hazirlik.js` (`ek9AlanTamam`, `ek9SebepTamam`, `ek9Eksikleri`; sunucu paketi bu dosyayı da derler, `ihtida-paket-isleri.gs` → `ihtidaPaketOnayIsle`).

## Sürüm
`SURUM = 49`; sayfa `data-asgari-servis-surumu="49"` (eski servis varsa form «sistem güncelleniyor» der, veri gönderilmez). Sağlık yanıtı `ihtidaKisiMetniDenetimi`, `ihtidaEk9Zorunlu`. Eski önbellekli sayfanın tek alanlı `adSoyad` gövdesi çalışmaya devam eder.

## Test
`tests/ihtida-zorunlu-v49.test.mjs` (11 test), `npm run test:ihtida`.
