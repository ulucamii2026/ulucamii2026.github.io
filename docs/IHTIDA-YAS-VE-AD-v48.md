# İhtida formu: 18 yaş sınırı ve ayrı Ad / Soyad alanları (Apps Script v48)

Durum: dalda hazır (`dilekce-tarih`), **yayınlanmadı**. Yayın sırası: önce Apps Script v48 dağıtılır, sonra site.

## 1. 18 yaşından küçükler başvuru yapamaz (din görevlisi kararı, 12 Kasım 2026)

- Yaş sınırı tek sabit: istemci `src/lib/ihtida-yas.ts` → `IHTIDA_ASGARI_YAS`, sunucu `ulucamii-Kod-v48.gs` → `IHTIDA_ASGARI_YAS` (18).
- Yaş, **başvuru günü (Europe/Brussels)** esas alınarak hesaplanır; tarihler `yyyy-MM-dd` metni olarak karşılaştırılır.
  Tam 18. yaş günü kabul, bir gün eksik ret. 29 Şubat doğumlu kişi, 18. yılı artık yıl değilse 1 Mart'ta 18 olur.
- İstemci: geçerli bir doğum tarihi 18 yaşından küçük yaş gösterirse doğum tarihi alanının altında bilgi kutusu açılır
  (`role="status"`, `aria-live="polite"`) ve gönderim / sonraki adım engellenir. Boş ya da geçersiz tarih olağan alan hatasıdır.
  Metin: `ihtida.kisi.yasAltiBilgi` (beş dil; Türkçe ana metin Rıdvan'ın onayladığı cümleler). Metin yalnız bu çevrim içi başvuruyla
  ilgilidir; iletişim yalnız `info@ulucamii.be` ve camidir.
- Sunucu: `ihtidaDogrulaV2` → `ihtidaYasKontrol`. Doğrulama `ihtidaPostIsleV2`'nin en başında çalışır; yani ref (IH-YYYY-NNNN) ayrılmadan,
  kilit alınmadan, defter satırı, Drive dosyası, PDF ve e-posta üretilmeden reddedilir.
  Kodlar: `yas-siniri` (18'den küçük), `basvuran-dogum-tarihi-gecersiz` (eksik/geçersiz), `basvuran-yas-disi` (gelecek ya da 120 yaş üstü).
  Form `yas-siniri` kodunu aynı bilgi metnine çevirir.
- Var olan kayıtlara dokunulmaz: `ihtidaDogrulaV2` yalnız yeni başvuruda çağrılır; belge yenileme/paket üretimi yaşa bakmaz.
- Panel: EK-9 hazırlık penceresi (`public/admin/ek9-hazirlik.js` → `ihtidaYasUyarisi`) kayıttaki doğum tarihi başvuru tarihinde
  18'den küçükse **uyarı** gösterir; belge yine hazırlanabilir. İhtida Defteri süreç penceresinde doğum tarihi yoktur, uyarı orada yok.
- Testler: `tests/ihtida-yas-ad.test.mjs`, `tests/web/ihtida.spec.mjs` (yaş kutusu, tr/fr/en, açık/koyu tema).

## 2. «Ad Soyad» iki alana bölündü

- Form alanları `basvuran.ad` (Ad / Prénom / First name / Voornaam / Vorname) ve `basvuran.soyad` (Soyad / Nom / Surname / Achternaam / Nachname);
  `autocomplete` `given-name` / `family-name`. Şahit adı alanları bölünmedi.
- Belgelere ve deftere giden «Ad SOYAD» değeri **tek yerde** kurulur: `ihtidaAdSoyadHazirla` (sunucu), `soyadBuyuk` ile yerel-duyarlı büyük harf.
  Defter sütunu eklenmedi/değişmedi; eski kayıtlar çözümlenmez.
- Geriye uyum: yalnız `basvuran.adSoyad` gönderen eski önbellekli sayfa aynen kabul edilir (değer değiştirilmez).
  Yeni sayfa en az servis sürümü 48 ister (`data-asgari-servis-surumu`), yani site sunucudan önce yayınlanırsa form «sistem güncelleniyor» der.
- Eski taslaklar (localStorage `basvuran.adSoyad`) formu bozmaz; iki alan boş kalır, değer bölünmeye çalışılmaz.
- «Okudum / beyan» alanı `data-esle="basvuran.ad basvuran.soyad"` ile ad + soyadın birleşimiyle eşleşir.

## Not

`dilim4-p7` ve `dilim5-yansitma` dalları da dosyayı v48'e adlandırıyor; bu iş birleşince onlar **v49** olmalıdır.
