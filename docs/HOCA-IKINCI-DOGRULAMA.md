# Hoca hesabı — isteğe bağlı ikinci doğrulama adımı (TOTP)

Karar: 12 Kasım 2026 (site sahibi). Tek hoca hesabına doğrulayıcı uygulamayla (Google Authenticator, Microsoft Authenticator vb.) ikinci giriş adımı.
SMS değil: maliyet, bölge izni ve SIM değiştirme riski yok. **Bu aşama yalnız istemcidir ve isteğe bağlıdır; hiçbir şeyi zorlamaz.**

## Ne yapıldı

- **Giriş sınaması** (`src/scripts/hoca-ekrani.ts` → `src/scripts/hoca-mfa.ts`): şifre ile giriş **ve** e-posta bağlantısıyla giriş `auth/multi-factor-auth-required`
  hatasını yakalar; 6 haneli kod ekranı açılır (sayısal klavye, `autocomplete="one-time-code"`, yanlış/süresi dolmuş kodda açık ileti, «Girişe dön»).
  Kod doğrulanınca eskisi gibi hoca ekranı yüklenir. **Kayıtlı faktörü olmayan hesap bugünkü gibi girer** (kod ekranı çıkmaz).
- **Açma/kapatma** (Hesap sekmesi, «İki adımlı doğrulama» bölümü): durum (kapalı/açık), açma = gizli anahtar üret → kare kod + elle girilecek anahtar +
  `otpauth://` bağlantısı → ilk kod → kayıt. Kapatma sayfa içi onayla (tarayıcı `confirm()` yok).
- **Kare kod yerelde çizilir** (depodaki `qrcode` paketi + `src/lib/ezber/kare-kod.ts`, satır içi SVG). Gizli anahtar hiçbir dış adrese gitmez; günlüğe,
  Firestore'a ve `localStorage`'a yazılmaz. Telefonun kendi ekranındaki kare kod taranamayacağı için anahtar ve bağlantı her zaman gösterilir.
- **Proje ayarı kapalıyken** açma düğmesi «henüz açılmadı» der (`auth/operation-not-allowed`); ekran bozulmaz. İstemci bu yüzden proje ayarından önce yayımlanabilir.
- Metinler beş dilde (`src/i18n/hoca-metin/mfa.ts`, `Record<Dil,…>` eşitliği ve `tests/hoca-metin-esitlik.test.mjs`).
- Çağrılar (Firebase JS SDK 12.19, [web TOTP belgesi](https://firebase.google.com/docs/auth/web/totp-mfa)): `getMultiFactorResolver`, `TotpMultiFactorGenerator.assertionForSignIn`,
  `resolver.resolveSignIn`; `multiFactor(user).getSession`, `TotpMultiFactorGenerator.generateSecret`, `assertionForEnrollment`, `multiFactor(user).enroll`, `unenroll`.
  Mantık: `src/lib/hoca-mfa.ts` (Auth modülü dışarıdan verilir; firebase tembel yüklemesi bozulmaz).
- **Kurallarda ve sunucuda değişiklik YOK** (`firebase/firestore.rules`, functions): MFA'sız oturum bugünkü gibi `hoca()` sayılır.

## Sınama

- `npm run test:hoca-mfa` (mantık, beş dil eşitliği, CSP kalıpları); `tests/web/hoca-mfa.spec.mjs` (kod ekranı, açma, kapatma, «henüz açılmadı», tr/de/fr, 360 px, axe).
- **Auth emülatörü TOTP'yi desteklemiyor** (firebase-tools 15.33: yalnız telefon/SMS faktörü). Bu yüzden Firebase Auth modülü sahtelenir (`tests/web/helpers/mektep.mjs`).
  Gerçek SDK + sunucu davranışı **canlı projede** (aşağıdaki 2. adımdan sonra) imamın hesabıyla ilk kez sınanır; o ana kadar kanıtlanmış sayılmaz.

## Yayın sırası (her adım ayrı onay; ders günü değil, Pazartesi–Perşembe arası)

1. **İstemciyi yayımla** (ulucamii.be ve egitim.ulucamii.be). Proje ayarı kapalı olduğu için görünür tek değişiklik Hesap sekmesindeki bölümdür; giriş değişmez.
2. **Koordinatör, imamın onayıyla**, `ulucamii-portal` projesinde Identity Platform'a yükseltir ve TOTP'yi açar (Authentication → Sign-in method → Multi-factor).
   Yalnız dernek araçlarıyla (`scripts/firebase-cami.ps1` ve dernek Google hesabı). Salt okunur ön kontrol: mevcut MFA ayarı ve hocanın `enrolledFactors` durumu.
3. **İmam kendi telefonunda** uygulamayı kurar, hoca ekranında Hesap → «İki adımlı doğrulamayı aç» der, kodu doğrular; sonra çıkış yapıp yeniden girerek kod adımını dener.
   Kayıt için yakın zamanda giriş yapmış olmak gerekir (`auth/requires-recent-login` ise çıkış-giriş sonrası tekrar). Kayıtta hesabın e-postası doğrulanmış olmalıdır
   (`auth/unverified-email` ise bir kez e-posta bağlantısıyla giriş yapılır).
4. **Ancak bundan sonra, ayrı bir iş olarak** kurallarda isteğe bağlı kontrol düşünülür (`request.auth.token.firebase.sign_in_second_factor == 'totp'`). Önce emülatörde
   (kurallar testi, Auth tokenı elle üretilerek) ve e-posta bağlantısıyla girişin MFA davranışı sınanmadan yazılmaz: bağlantıyla girişte ikinci adımın sunucuda
   gerçekten istenip istenmediği **henüz doğrulanmadı**. Zorlama açılırsa MFA'sız her oturum (bağlantı dâhil) veri göremez; bu yüzden kilitlenme riski yüksektir.

## Telefon kaybolursa (kurtarma)

- Tek hoca hesabı olduğundan **zorlamadan önce bu yol denenmiş olmalıdır**. Yönetici, dernek araçlarıyla hesabın kayıtlı faktörlerini temizler.
  - **Resmî belgede yazan** (https://firebase.google.com/docs/auth/admin/manage-mfa-users, «Removing a secondary factor», Admin SDK Node.js): ikinci adımları tümüyle kaldırmak için
    `updateUser(uid, { multiFactor: { enrolledFactors: null } })`; belge «`null` ya da boş dizi» der. `enrolledFactors` listesi verilince kullanıcının mevcut ikinci
    adımlarının hepsi silinip liste ile değiştirilir. SDK API başvurusunda (`MultiFactorUpdateSettings`) alan `UpdateMultiFactorInfoRequest[] | null` türündedir; `null` temizlemedir.
  - **Doğrulanmadı — ilk denemede test hesabıyla sınanacak:** belgedeki örnekler telefon (SMS) faktörüne göredir; TOTP faktörünün aynı çağrıyla kaldırıldığı belgede ayrıca
    yazmıyor. Python Admin SDK ya da `portal-yonetim.py` yoluyla aynı işlemin yapılıp yapılamayacağı da doğrulanmadı.
  - **Doğrulanmadı:** Firebase Console'da kullanıcı başına ikinci adımı silen bir düğme olduğuna dair belge bulunamadı; bu yola güvenilmez.
  - Hesap yeniden yalnız şifreyle girer; imam yeni telefonda 3. adımı yineler.
- Faktör kaldırmak son faktörse Firebase oturumu düşürebilir (`auth/user-token-expired`): ekran giriş ekranına döner ve iletiyi orada gösterir.
- Zorlama açıldıktan sonra yönetici betiği (`portal-yonetim.py`, Admin API) çalışmaya devam eder; imam ise bu temizlik olmadan giremez. Zorlamayı açmadan önce bu temizliği
  **test hesabında** deneyin (canlı hesapta değil).

## Yapılmayanlar / bilinmeyenler

- Kural zorlaması, SMS, yedek (ikinci) faktör ekranı, kurtarma kodları, veli portalı ve egitim ilim uygulaması için ikinci adım: yok.
- Canlı projenin MFA/Identity Platform durumu okunmadı; TOTP'nin e-posta bağlantısıyla girişte istenip istenmediği ve gerçek SDK akışı canlıda sınanmadı.
- Gizli anahtar ekranda düz metin olarak görünür (kare kodla aynı bilgi); ekran görüntüsü alınıp saklanmamalıdır.
- Not: faktör kaydı sırasında Firebase açık oturumları kapatabilir (SDK bunu arka uç kararına bağlar: «oturumlar iptal edilebilir»); imam telefon ve bilgisayardaki oturumları yeniden açmak zorunda kalabilir. Kesin davranış canlıda sınanmadı.
