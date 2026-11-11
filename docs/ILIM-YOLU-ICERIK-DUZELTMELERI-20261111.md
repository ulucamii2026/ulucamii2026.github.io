# İlim Yolu — 12 haftalık öğrenme yolu: denetim düzeltmeleri ve onay (11 Kasım 2026)

Kapsam: `paylasilan/ogrenme-yolu/icerik.json` (12 hafta, 8 adım, 5 dil), `tests/ogrenme-yolu-icerik.test.mjs`.
Sonuç: iki denetimin bütün bulguları uygulandı, bütün `durum` alanları `taslak` → `onayli` yapıldı (12 hafta × 5 dil = 60 alan).

## Onay ve yöntem (imamın sonradan okuması için)

- Onay yetkisi: Rıdvan (imam ve sitenin sahibi) 11 Kasım 2026'da «full otonom ilerle, ne gerekiyorsa yap lütfen» dedi;
  içerik kararı koordinatöre bırakıldı. Taslak etiketi bu yetkiyle kaldırıldı.
- İki denetim **makine destekli** yapıldı (insan imam okuması değil): Türkçe dinî denetim yerel Diyanet arşivine
  (Diyanet İlmihali I, DİYK fetvaları, Kur'an Yolu, TDV İslâm Ansiklopedisi, Hadislerle İslam) karşı; fr/en/nl/de çeviri
  denetimi Türkçe özgüne ve platformun onaylı terimlerine karşı. Denetim raporları (depo dışı): `D:\tmp\ilim-yolu-arastirma\ogrenme-yolu-denetim-tr.md`
  ve `ogrenme-yolu-denetim-ceviri.md`; uygulayan betik `uygula-duzeltmeler.mjs` (aynı klasör).
- İmam isterse sonradan okuyup değiştirebilir: yeni bir yazım için yalnız `icerik.json` değiştirilir, ardından `npm run ortak:aktar`.

## 1. Türkçe dinî düzeltmeler (D-01…D-07)

| Kod | Yer | Değişiklik | Kaynak |
|---|---|---|---|
| D-01 | h06 metin | Namaz şartlarına «örtünme (setr-i avret)» eklendi (6 şart) | Diyanet İlmihali I, Namazın farzları s. 227 |
| D-02 | h11 metin + soru h11-1 doğru şık | «sadaka … genellikle gönüllü olarak verilen yardımdır» | TDV İslâm Ansiklopedisi, SADAKA |
| D-03 | h10 metin | «Sahur, tan yeri ağarmadan (imsaktan) önce yenen yemek» | Diyanet İlmihali I, Oruç s. 381, 402 |
| D-04 | h12-2 künye | Buhârî 69 yerine «Enbiyâ 21/7 (Diyanet meâli)» (soru «bilmeyene sorma» konusu) | Kur'an Yolu, Enbiyâ 21/7 |
| D-05 | h08, h09 bağlantı | Kesik Nahl adresi tam hâline getirildi (aşağıda) | tarayıcıda açılıp doğrulandı |
| D-06 | h06-1 künye | Müslim 8a yerine «Diyanet İlmihali I, Namaz (Namazın farzları ve vakitleri)» | Diyanet İlmihali I |
| D-07 | h06 metin sonu | Mezhep etiketi «Bu bilgiler Diyanet İlmihali'ne göre (Hanefî) verilmiştir.» | h05 ile aynı ilke |

Anlamı değiştiren D-01, D-02, D-03 ve D-07 dört yabancı dile de taşındı (sözlük terimleriyle). D-07'de h06 fr metni
900 karakter sınırına yakın olduğu için Fransızca etiket kısa tutuldu: «Selon la Diyanet (école hanéfite).» (h06 fr = 896).
Eklenen yeni hüküm yok; hiçbir düzeltme denetim raporunun dışına çıkmadı.

## 2. Çeviri düzeltmeleri (47 bulgu, alan sayıları)

Değişen metin alanı (durum alanları hariç): fr 22, en 20, nl 29, de 32 (Türkçe 4). Kararlar:

- «Allah» her dilde (Dieu/God/Gott yok); şehâdette «geen god is behalve Allah», «no deity but Allah», «keinen Gott außer Allah».
- Peygamber adından sonra ilk anışta (h03) onaylı kartlardaki selam kalıbı: fr «(paix sur lui)», en «(peace be upon him)»,
  nl «(vrede zij met hem)», de «(Friede sei mit ihm)». Türkçede metin zaten «Hz. Muhammed» diyor; değişmedi. Şehâdet
  cümlesindeki ad (h01) formül olduğu için kalıpsız bırakıldı.
- Hollandaca ad yazımı: «Muhammad» (kartlarda 33/10 çoğunluk).
- Almanca «Religionsbeauftragter» → «Imam» (9 yer); abdest için tek etiket «Waschung (Wudu)», boy abdesti «Ganzwaschung (Ghusl)».
- Hollandaca secde «neerknielen» → «prosternatie (sadjda)» (anlam düzeltmesi, soru şıkkı dâhil).
- h06'ya beş namazın adı: fr fajr/dhuhr/‘asr/maghrib/‘ichâ’; en Fajr/Dhuhr/Asr/Maghrib/Isha; nl Fadjr/Dhoehr/Asr/Maghrib/Isja;
  de Fadschr/Dhuhr/Asr/Maghrib/Ischa.
- Kader: en «destiny (qadar)», nl «het lot (qadar)», de «die Vorherbestimmung (Qadar)»; sünnet: sunnah/sunna/Sunna;
  hidjrakalender / Hidschra-Kalender; Ramadan büyük harf (nl); ghusl/tayammum yazımı; Almanca Ikhlas, Dua, Lehrkraft.
- Fransızca dilbilgisi (h01, h09), dar bölünmez boşluk, «un enseignant», «actes d'adoration», «mémoriser», «Porter cela seul(e)».
- Kıble ilk anışta açıklandı (fr, nl). Bütün `metin` alanları ≤ 900, `giris` ≤ 600 (test denetler).

Uygulanmayan bulgu yok. Not: h04 için ayrıca «ilk anış» selam kalıbı önerilmişti, ama denetim tablosu yalnız h03 metnini
listeliyordu; yalnız h03 uygulandı.

## 3. Bağlantılar ve videolar

- Nahl 16/125 (h08, h09): `…/Nahl-suresi/2026/125-` kesikti ve tarayıcıda sure listesine düşüyordu; `…/2026/125-ayet-tefsiri`
  Nahl 125. âyet tefsir sayfasını açıyor (Diyanet meâli «Rabbinin yoluna hikmetle ve güzel öğütle davet et…»).
- `kuran.diyanet.gov.tr/mushaf` (h04, h07) `…/kuran` adresine yönlendiriyordu; doğrudan `…/kuran` yapıldı.
- Bakara 256, Lokmân 14–15 ve İhlâs 1 tefsir bağlantıları tarayıcıda açıldı: ilgili âyet sayfasına gidiyor.
  Öteki 14 bağlantı (TDV İslâm Ansiklopedisi, Diyanet PDF'leri, sunnah.com) HTTP 200 verdi; PDF içerikleri bu çalışmada okunmadı.
- 21 YouTube videosu (tr/en, h01–h11) oEmbed ile soruldu: hepsi yaşıyor; kanallar «Diyanet Dijital» (tr) ve
  «Diyanet Publications» (en), başlıklar «İslam Nedir?» serisi ve haftanın konusuyla uyumlu. Videoların içeriği izlenmedi.
- Hiçbir bağlantı kaldırılmadı.

## 4. Açık sınırlar

- Fransızca PDF'lerin (Diyanet) içeriği Türkçe arşivde olmadığından içerik yönünden doğrulanmadı.
- Lokmân 31/14–15 künyesi (h09-2) güvenlik sorusu için dolaylı; Bakara 2/256 yeterli olabilir (tercih, hata değil; değişmedi).
- Hafta sırası ile adım numaraları farkı bilinçli tasarım (giriş «sırayı değiştirebilirsiniz» diyor).
- Bu içerik ulucamii.be sayfalarında gösterilmez; yalnız ihtida.ulucamii.be (12 hafta · 8 adım sayfaları) ondan beslenir.

## 3. Kur'an bilgi kartları: dil denetimi düzeltmeleri (akşam, 11 Kasım 2026)

Kapsam: `src/data/ilim-yolu/kartlar/kuran.json` (87 kart, 117 mini soru), `egitim/src/i18n/ilim.ts`. Commit `46371e9f`.
Yöntem: başka bir modelin 75 bulgusu iddia sayıldı, tek tek doğrulandı; ayrıntılı karar tablosu (depo dışı):
`D:\tmp\ilim-yolu-arastirma\dil-denetimi-uygulama-20261111.md`. Sonuç: 71 satır uygulandı, 3 reddedildi, 1 ses yenilemesine bekliyor.

- **Özetten çıkmayan sorular (7 soru, 5 dilde) yeniden yazıldı:** ku-045-2, 048-1, 048-2, 050-2, 055-1, 055-2, 081-2.
  Özetlere bilgi EKLENMEDİ. Yeni sorular özetteki cümleyle cevaplanır (ör. ku-048: «hangi kuralları gösteririz?», ku-055: «hangi anahtar kelimeleri buluruz?»).
- **Şıklar:** ku-030-1, 043-1, 050-1, 051-2 doğru şıkkı kısaltıldı/dengelendi; ku-049-2 ve ku-081-1'den özette olmayan ek kısım atıldı.
- **Dil hataları:** TR ku-019-1 («harekeyi»), ku-014-1, ku-056-2 («doldururuz»); FR ku-010, 021, 034, 057, 024 (şık); NL ku-002, 048 (başlık), 049, 050 (başlık), 053-2, 061; DE ku-001, 005, 033 (özet), 049 (özet), 054; EN ku-033 (özet), 045; `ilim.ts` DE «Hören».
- **Reddedilenler:** ku-001 FR «regarder à» (geçerli Fransızca), ku-006 FR «son son» (üslup), `ilim.ts` NL «Eén» (Groene Boekje: büyük harf aksan almaz).
- **Dokunulmadı:** tecvid/Arapça terimler (imam incelemesi bekliyor); tüm TR/FR başlık ve özetler (kart sesleri metinle eşleşik kalsın).
- **Ses yenilemesi gerekir (TR/FR metni değişecek, ses yeniden üretilmeli):**
  1. ku-056 TR özet son cümle: «Sınıf hatim çizelgesini birlikte doldururuz.» (şimdi «dolduruz»)
  2. ku-019 FR özet: «Nous répétons la lecture du fatha, du kasra et du damma sans les confondre, avec le bon son et la bonne forme de bouche.» (şimdi «de la fatha»)
  3. ku-024 FR başlık: «Consolidation du soukoun et de la chadda» (şimdi «Consolidation de la sukûn»)
- İmama gözlem: birkaç soruda doğru şık hâlâ çeldiricilerden ~1,6 kat uzun (ör. ku-037-1, 062-1, 087-1); sonraki turda dengelenebilir.
