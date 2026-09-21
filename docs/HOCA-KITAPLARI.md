# Hoca portalında ders kitapları

21 Eylül 2026. Kullanıcı dört yerel PDF'nin **hoca ekranından indirilebilmesini** istedi.
`/hoca/ → Ders kitapları`: Camiye Gidiyorum 1–2, Fransızca Belçika ve Türkçe vektörel sürümler.
Kaynak PDF'ler değiştirilmez; indirme sonunda SHA-256 ile birebir eşitlik aranır.

## Erişim ve dosyalar

- Düz PDF'ler herkese açık Git deposuna veya Release'e konmaz. Yayınlanan 21 `.bin` parçası
  AES-256-GCM ile şifrelidir; açık PDF içeriği taşımaz.
- Her kitap bağımsız 32 bayt anahtar, her parça bağımsız 12 bayt rastgele IV kullanır.
  Parça düzeni: IV + şifreli içerik + GCM etiketi. AAD: `<kitap-id>:<sıfırdan-parça-no>`.
  En büyük düz parça 16 MiB. Anahtar yalnız dernek Firestore'undaki `ayarlar/hocaKitaplari`
  belgesinin `anahtarlar` alanında; `kitap-id → hex anahtar` eşlemesi.
- Mevcut Firestore `ayarlar` kuralı yalnız `hocalar/{uid}` kaydı bulunan oturumlara okuma
  izni verir. Yeni kullanıcı, rol, genel okuma kuralı veya ücretli depolama servisi açılmaz.
- `src/scripts/hoca-kitaplari.ts`: anahtar her indirmede Firestore lite `getDoc` ile sunucudan
  alınır. Anahtarlar localStorage/IndexedDB'ye yazılmaz. Parçalar ardışık indirilir, şifreli
  parça özeti ve GCM doğrulanır; tamamının boyutu ve kaynak PDF özeti tutmadan indirme sunulmaz.
  Hata yeniden denenebilir; iptal, sekme değişimi ve çıkış süren indirmeyi sonlandırır.
- `src/data/hoca-kitaplari.json`: yalnız kitap adı, sayfa, boyut, dosya adı, özet ve şifreli
  yolları içerir. Anahtarlar, kaynak düz PDF'ler ve gerçek kişi verileri bu dosyaya girmez.
- Kitabı indirmeye yetkili hoca dosyayı cihazına kaydedebilir; indirilmiş kopyayı uzaktan
  geri çekme iddiası yoktur.

## Doğrulama ve bakım

- `tests/hoca-kitaplari.test.mjs`: bütün şifreli dosyaların varlığı/özeti/boyutu; doğru çözüm,
  yanlış anahtar, bozuk içerik, farklı AAD ve iptal. `npm run test:ogrenme` içine dahildir.
- `tests/kurallar/firestore.test.mjs`: hoca okuyabilir; veli, rolü olmayan hesap ve ziyaretçi
  anahtarları okuyamaz/yazamaz. Yalnız `demo-ulucamii` emülatörü kullanılır.
- `tests/web/hoca-kitaplari.spec.mjs`: dört indirme, izin hatası, yeniden deneme, mobil taşma,
  açık/koyu tema ve erişilebilirlik. Testlerde gerçek kişi/üretim anahtarı yoktur.
- Bu çalışma alanındaki `.codex/kitap-hazirla.py`, `.codex/kitap-yayin.py` ve
  `.codex/kitap-tarayici.mjs` ilk yükleme ve gerçek dosya eşitliği doğrulamasının özel yardımcılarıdır.
  `.codex/hoca-kitap-anahtarlar.json` Git dışında kalır; içeriği hiçbir rapora/loga kopyalanmaz.
  Yenilemede önce dosyalar ve testler hazırlanır, tek özel anahtar belgesi güncellenir,
  Pages yayını ve dört canlı indirme doğrulanır. Eski anahtar körlemesine değiştirilmez.

| Kitap | Sürüm | Sayfa | Bayt |
|---|---|---:|---:|
| Camiye Gidiyorum 1 | Fransızca Belçika | 228 | 119508776 |
| Camiye Gidiyorum 1 | Türkçe vektörel | 227 | 47574147 |
| Camiye Gidiyorum 2 | Fransızca Belçika | 270 | 94836992 |
| Camiye Gidiyorum 2 | Türkçe vektörel | 270 | 63422630 |
