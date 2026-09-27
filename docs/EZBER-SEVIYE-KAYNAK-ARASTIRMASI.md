> Depo kopyası (27 Eylül 2026): Ezber Kilimi seviye listesinin kaynak araştırması; bağımsız Claude alt ajanı, yerel arşiv
> (`D:\ihtisas`) önce, resmî Diyanet siteleri sonra. Kararlar ve uygulanan değişiklikler: [Ezber Kilimi](EZBER-KILIMI.md).

# Ezber Kilimi — Diyanet kaynaklarına göre seviye araştırması

**Tarih:** 27 Eylül 2026 · **Hazırlayan:** Claude (araştırma alt ajanı) · **Kapsam:** yalnız araştırma; depo ve proje
dosyalarında hiçbir değişiklik yapılmadı.
**Karşılaştırılan taslak:** `src/data/ezber/katalog.json` (v1, 77 madde; `docs/EZBER-KILIMI.md`'ye göre Rıdvan
onayı bekliyor) — salt okunur incelendi.

---

## 0. Yöntem, sayfa gösterimi, telif

- Kaynak sırası: önce yerel arşiv `D:\ihtisas` (salt okunur); arşivde bulunmayan Diyanet öğretim programları
  resmî `egitimhizmetleri.diyanet.gov.tr` PDF'lerinden okundu. Başka web kaynağı kullanılmadı. İndirilen kopyalar
  yalnız iş klasöründe: oturumun geçici klasörü (iş bitince silindi) (`p2025.pdf`, `p2026-temel.pdf` …).
- «s.» = basılı sayfa. Basılı sayfa PDF sayfasından farklıysa ikisi birlikte yazıldı («basılı s. 12 / PDF 13»).
  Sayfa numarası olmayan EPUB kaynaklarda (Namaz İlmihali, Temel Dinî Bilgiler, İslâm İlmihali) dosya yolu verildi.
- Tablolarda sûre ve dua adları okunurluk için birleştirildi; programların kendi yazımı yer yer farklıdır
  (Maûn/Mâûn, Âmentu/Âmentü, Fatihâ/Fâtiha, Ayete'l-Kürsî/Âyetü'l-Kürsî …).
- **Telif:** `D:\ihtisas` içeriği (DİA = TDV İSAM; Diyanet yayınları = DİB) yalnız kişisel çalışma içindir.
  Katalog metinleri arşivden kopyalanmamalı: Kur'an metni ve meâli `kuran.diyanet.gov.tr`'den, dua metinleri
  kursun kullandığı basılı Elif-Bâ'dan veya Diyanet'in resmî sayfalarından alınmalı. Bu rapordaki alıntılar kısa
  ve kaynaklıdır.
- Kaynağında görülemeyen her bilgi **«doğrulanamadı»** diye işaretlendi. Bölüm I öneridir; A–H kaynaklı olgulardır.

---

## Özet — en önemli bulgular

1. Diyanet'in ayrı bir **hafta sonu kursu programı yok**. En yakın modeller: çocuklar için **7–10 Yaş (2024)** ve
   **11–14 Yaş (2025)**; yetişkinler için **İhtiyaç Odaklı Temel Öğretim Programı (2026)** ve **Kısa Süreli
   Programlar / Ezber Dersi (2026)**; kademeli (kur) ezber için tek örnek **Camilerde Kur'an Öğretim Programı
   (2010, 3 kur)**.
2. **2025 «Kur'an-ı Kerim ve Temel Dinî Bilgiler Öğretim Programı» lise çağındaki yatılı öğrenciler içindir**
   (s. 4, 8). Sitedeki seviye testinin «sıra bu programı izler» ifadesi (`src/lib/seviye-testi/sorular/ezber.ts`,
   `docs/SEVIYE-TESTI.md` 7. satır) hem hedef kitle hem sıra bakımından tutmuyor.
3. Bütün programların ortak ilkesi: **«namazlarını kılabilecek düzeyde sure ve dua öğrenmelerine öncelik»**
   (7–10 s. 9; 11–14 s. 10) ve sıranın «örnek» olması (7–10 s. 11; 11–14 s. 10; 2025 s. 11). Taslak v1'in
   «namaz kılabilme sırası» mantığı bu ilkeyle uyumlu.
4. Hanefî hükümde namazda dille söylenen **farz** yalnız iftitah tekbiri (Hanefî'de şart) ve kıraattır; Fâtiha,
   zamm-ı sûre, Tahiyyât, selâm ve vitirde kunut **vâcip**; Sübhâneke, Eûzü-Besmele, tesbihler, tesmî-tahmîd,
   salavât ve dualar **sünnet** (Diyanet İlmihali c. 1 s. 240–255, 304–306).
5. Taslakta **tekbir** ve **selâm** maddesi yok; ikisi de kursun Elif-Bâ'sında «Namaz içindeki tesbihat»
   başlığında (s. 38) ve 2025 programında (s. 18) sayılıyor → eklenmesi önerilir.
6. **Kevser'in Seviye 3'e alınması** önerilir: Diyanet'in ilk üçlüsü Fâtiha–İhlâs–Kevser (2010 I. Kur s. 8;
   Yaz 2024 s. 7, 13; 7–10 s. 11). Ayrıca farzın ilk iki rekâtında aynı sûreyi okumak ve mushaf sırasına
   uymamak mekruhtur (İlmihal s. 260) → iki rekâtlık farz için iki sûre gerekir (1. rekât Kevser, 2. rekât İhlâs).
7. **Kunut:** vitirde Ebû Hanîfe'ye göre vâcip; bilmeyen «Rabbenâ âtinâ»yı ya da üç kez «Allâhümmağfir lî» /
   «Yâ Rabbi»yi okur (İlmihal s. 305–306). Diyanet programlarının hepsi Kunut'u Fîl→Nâs bloğundan önce (2010'da
   aynı kurda) veriyor; taslakta Seviye 7'de. En az çözüm: yedek dua Seviye 4'te öğretilsin.
8. **Seviye 7 (10 madde) en ağır seviye.** Gusül ve teyemmüm farzları Seviye 2'ye taşınırsa **32 farz Seviye 2'de
   tamamlanır**, Seviye 7 hafifler.
9. **«Elifbâ s. 34–39» doğrulandı** (kursun Elif-Bâ'sı, DİB 2020, 15. bs.): Hanefî namaz duaları, ezan, kāmet,
   tesbihat ve Âmentü s. 34–39'da; Şâfiî bölümü s. 39'un altı–41. Buna karşılık müfredattaki **«Amme Cüzü
   Satırları — Elifbâ s. 32–33» yanlış**: s. 32 Fâtiha, s. 33 Bakara'nın başıdır.
10. Diyanet kaynakları arasında **metin farkları** var (§I.6): Sübhâneke'deki «ve celle senâük», ezan duasının
    son cümlesi (Beyhakî ziyadesi), «Rabbenâ âtinâ»ya eklenen «bi rahmetike…», Haşr 21–24 / 22–24, teyemmümün
    farz sayısı 2 / 3, meâlle kıraat (İlmihal «öğreninceye kadar caiz», Namaz İlmihali «geçersiz»).
11. **Amme cüzü (78–114): 37 sûre, 564 âyet** (Kur'an Yolu). Taslakta Seviye 8 = 25 sûre, 505 âyet; tek seviye
    için çok büyük → 5 durak önerildi (§I.4).
12. Kenar suyundaki maddelerin `kuranMetni` işaretleri kaynaklarla uyumlu (Rabbişrahlî = Tâhâ 20/25–28 ve
    Alak 1–5 Kur'an; ötekiler Kur'an dışı). Eûzü-Besmele için `true` ihtiyatlı ve ses kuralı için doğru; ancak
    Eûzü formülü âyet değildir, Nahl 16/98'deki emre dayanır.

---

## A. Diyanet öğretim programlarındaki ezber listeleri

**Program dizinleri (resmî):**
- Yaygın din eğitimi programları: https://egitimhizmetleri.diyanet.gov.tr/sayfa/489 — İhtiyaç Odaklı Temel 2026,
  Kısa Süreli 2026, İşitme Engelli 2025, Kur'an-ı Kerim ve Temel Dinî Bilgiler 2025, Yatılı Yaz 2024, Gençliğe
  Yönelik Yaz 2024, Görme Engelli 2023, Gençliğe Yönelik 2021, Mülteciler 2019, Camilerde Kur'an Öğretim Programı 2010.
- Çocukluk dönemi programları: https://egitimhizmetleri.diyanet.gov.tr/sayfa/1034 — 11–14 Yaş 2025, 7–10 Yaş 2024,
  Yaz 2024, 4–6 Yaş Yaz 2024, 4–6 Değerler 2023, 4–6 Kur'an-ı Kerim 2023, 4–6 Kur'an Kursları 2022.
- İki dizinde de ayrı bir «hafta sonu» programı bulunmuyor.

### A.1 2025 «Kur'an-ı Kerim ve Temel Dinî Bilgiler Öğretim Programı»

- URL: https://egitimhizmetleri.diyanet.gov.tr/Documents/Kur%27an-%C4%B1%20Kerim%20ve%20Temel%20Dini%20Bilgiler%20%C3%96%C4%9Fretim%20Program%C4%B1-2025.pdf
- Onay: 05.08.2025, E-6624718. 35 s.; basılı sayfa = PDF sayfası.
- **Hedef kitle:** «Lise çağındaki gençler» ve «yatılı olarak Kur'an ve dini bilgiler eğitimi almayı arzu eden
  öğrencilere yöneliktir» (s. 4); «yatılı olarak uygulanır» (s. 8); 4 yıl × 2 dönem = 8 dönem (s. 10).
- Kazanım 3: «Ezber müfredatında yer alan dua ve sûreleri usulüne uygun ezberler» (s. 5).

| Dönem | Kur'an-ı Kerim dersi ezber listesi | Sayfa |
|---|---|---|
| 1 | Sübhâneke, Tahiyyât, Salli–Bârik, Rabbenâ duaları, Kunut duaları, Âmentü, Yemek duası, Ezan ve kāmet, Tesbihat, Fîl–Nâs arası sûreler (Fâtiha yüzüne okumanın başlangıcıdır; ezber listesinde ayrı madde değildir) | 11–12 |
| 2 | Duhâ, İnşirâh, Tîn, Alak, Kadir, Beyyine, Zilzâl, Âdiyât, Kâria, Tekâsür, Asr, Hümeze | 12 |
| 3 | Bakara 1–5, 255, 285–286; Haşr 22–24 | 13 |
| 4–7 | Yâsîn, Mülk / Nebe, Fetih / Rahmân, Hucurât / Âl-i İmrân 1–9, 102–108, 144–148, 190–194 | 13–14 |
| 8 | En'âm 160–165, Tevbe 111–112, Mü'minûn 1–11, Lokmân 12–19 | 14 |

- Sıra notu: «Ezberlenecek dua/sûrelerin sıralamasında yanda verilen sıra takip edilebileceği gibi öğretici
  tarafından da sıra belirlenebilir.» (s. 11)
- İtikat, 1. dönem: «Kelime-i tevhid ve kelime-i şehâdet» ünitesi (s. 15). İlmihal: namazdaki «Allahü Ekber,
  Semiallahü limen hamideh, Rabbenâ leke'l-hamd, Sübhâne Rabbiye'l-Azîm, Sübhâne Rabbiye'l-A'lâ, Esselâmü Aleyküm
  ve Rahmetullah» ifadelerinin anlamları (s. 18); iftar duası ezberi (s. 19); ezan, kāmet ve tesbihat pratik
  olarak öğretilir (s. 20).
- **Sitedeki uyuşmazlık:** `src/lib/seviye-testi/sorular/ezber.ts` başlığı «Sıra, Diyanet 2025 … ezber
  listesini izler» diyor ve `docs/SEVIYE-TESTI.md` (7. satır) bu programı 18 yaş üstü seviye testine dayanak
  gösteriyor. Oysa (a) program lise çağı yatılı öğrenciler içindir; (b) sitedeki sıra (Eûzü-Besmele, Kelime-i
  şehâdet, Sübhâneke, Fâtiha, Tahiyyât, Salli–Bârik, Rabbenâ, Kunut, Âmentü, Fîl→Tebbet, İhlâs/Felak/Nâs,
  Âyetü'l-Kürsî, Ezan-kāmet, yemek duaları) programın Kur'an ezber listesiyle aynı değil (Eûzü-Besmele ve
  Kelime-i şehâdet bu listede yok; Âyetü'l-Kürsî 3. dönemde; ezan-kāmet ve yemek duası 1. dönemde).
  Yetişkin testi için uygun atıf: 2026 İhtiyaç Odaklı Temel Öğretim Programı (A.3) ya da «Diyanet
  programlarındaki ezber sırasından uyarlanmıştır» ifadesi.

### A.2 Çocuk programları

| Program (onay) | Hedef ve süre | Ezber sırası | Sayfa |
|---|---|---|---|
| **4–6 Yaş Kur'an-ı Kerim** (06.09.2023, E-67567140-256.01-4160565) — basılı = PDF − 2 | okul öncesi | Harf gruplarına bağlı: Besmele + Başarı duası → Sübhâneke → Salli–Bârik, Rabbenâ → Kevser, İhlâs → Fâtiha, Tahiyyât → Nâs, Felak; yüzüne: Fâtiha, Bakara 1–5, 285–286, Haşr 22–24 | s. 5/PDF 7 → s. 6/8 → s. 7/9 → s. 8/10 → s. 9/11 → s. 10/12; yüzüne s. 11/13 |
| **7–10 Yaş** (01.08.2024, E-5315952) | ilkokul çağı, yıl boyu, örgün eğitimle birlikte (s. 4–5); haftada 4/6/8/10/12 saat seçenekleri (s. 7) | Eûzü Besmele; Tekbir ve Salavât; Başarı duası (Rabbi yessir); Sübhâneke; Yemek; Ezan ve kāmet; Ezan duası; Fâtiha; İhlâs; Kevser; Asr; Tahiyyât; Salli–Bârik; Rabbenâ; Âmentü; Kunut; Fîl; Kureyş; Mâûn; Kâfirûn; Nasr; Tebbet; Felak; Nâs; Âyetü'l-Kürsî; Âmene'r-Resûlü; Haşr son üç âyet | liste s. 11; ilkeler s. 9 |
| **11–14 Yaş** (05.08.2025, E-6624671) | 11–14 yaş (hedef kitle ifadesi ayrıca incelenmedi) | Eûzü Besmele; Tekbir ve Salavât; Sübhâneke; Tahiyyât; Salli–Bârik; Rabbenâ; Kunut; Âmentü; Yemek; Ezan ve kāmet; Ezan duası; Fâtiha; Fîl; Kureyş; Mâûn; Kevser; Kâfirûn; Nasr; Tebbet; İhlâs; Felak; Nâs; Âyetü'l-Kürsî; Âmene'r-Resûlü; Haşr son üç; Duhâ; İnşirâh; Asr; Alak; Kadir | liste ve notlar s. 10 |
| **Yaz Kur'an Kursları** (10.05.2024, E-5037779) | iki seviye: «Elif Bâ Seviyesi» / «Yüzüne Seviyesi» (s. 6, ilke 7; s. 7, ilke 9) | Elif-Bâ seviyesi: Eûzü Besmele; Tekbir ve Salavât; Rabbi yessir; Yemek duası; Ezan ve kāmet; Sübhâneke; Tahiyyât; Salli–Bârik; Rabbenâ; Kunut; Âmentü; Fâtiha; İhlâs; Kevser. Yüzüne seviyesi: (eksik dualar dinlenir); Fâtiha; Fîl→Nâs; Ezan ve kāmet; Ezan duası; Bakara 1–5; Âyetü'l-Kürsî; Âmene'r-Resûlü; Haşr son üç | s. 13; s. 15 |
| **Yatılı Yaz** (10.05.2024, E-5037779) | çocuk ve gençler | 4 haftalık: Eûzü Besmele; Rabbi yessir; Tekbir ve Salât-ı Ümmiye; Sübhâneke; Tahiyyât; Salli–Bârik; Rabbenâ âtinâ; Rabbenağfirlî; Yemek; Kunut; Âmentü; Namaz tesbihatı; Fâtiha; Fîl→Nâs; Asr; Kadir; Ezan-kāmet; Ezan duası; Bakara 1–5; 255; 285–286; Haşr son üç. 8 haftalık listeye Yâsîn eklenir | s. 13–14; s. 36–37 |

- 7–10 ilke 8: «Öğrencilerin namazlarını kılabilecek düzeyde sure ve dua öğrenmelerine öncelik verilmelidir.»
  İlke 9: «Ezberlemede güçlük çekilen dua ve sureler olduğunda öğrenci zorlanmamalı kolay ezberleyebileceği bir
  sure/dua öncelenerek süreç kolaylaştırılmalıdır.» (s. 9). Liste notu: «Sure ve dualar örnek olarak
  verilmiştir, … sıralamada değişiklik yapılabilecektir.» (s. 11)
- 11–14 notları (s. 10): aynı öncelik ve kolaylık ilkeleri; anlamlar ve sebeb-i nüzûl «Kur'an Yolu Meâl ve
  Tefsir kitabından» özetlenir; listeyi bitiren «Dûha sûresinden aşağısını» ya da öğreticinin belirleyeceği
  sûre ve aşırları ezberleyebilir.
- Yatılı Yaz: «Tekbir ve salât-ı ümmiye … makamlı olarak seslendirme» (s. 13).

### A.3 Yetişkin ve genel programlar

**İhtiyaç Odaklı Kur'an Kursları Temel Öğretim Programı (2026)**
- URL: https://egitimhizmetleri.diyanet.gov.tr/Documents/%C4%B0htiya%C3%A7%20Odakl%C4%B1%20Kur%27an%20Kurslar%C4%B1%20Temel%20%C3%96%C4%9Fretim%20Program%C4%B1-2026.pdf
- Onay: 21.08.2026, E-8054706; basılı sayfa = PDF − 1. Hedef: «Yetişkinlere yönelik yaygın din eğitimi
  faaliyetlerinin temelini oluşturan …» (Kısa Süreli Programlar 2026, PDF s. 5).
- **Kur'an-ı Kerim-I, ezbere okuma** (basılı s. 12–13 / PDF 13–14): Sübhâneke*, Tahiyyât*, Salli–Bârik*,
  Rabbenâ Âtinâ–Rabbenağfirlî, Kunut*, Âmentü, Ezan-Kāmet, Namaz tesbihâtı, Ezan duası, Yemek duası, Fâtiha,
  Fîl, Kureyş, Mâûn, Kevser, Kâfirûn, Nasr, Tebbet, İhlâs, Felak, Nâs, Bakara 255 (Âyetü'l-Kürsî).
- **Kur'an-ı Kerim-II** (basılı s. 14 / PDF 15): Duhâ, İnşirâh, Tîn, Alak, Kadir, Beyyine, Zilzâl, Âdiyât,
  Kâria, Tekâsür, Asr, Hümeze, Bakara 1–5, Bakara 285–286, **Haşr 21–24**, Yâsîn.
- Aynı bölümün notları: takdim-tehir yapılabilir; «(*) … Şafi mezhebindeki farklı uygulamalara yer verilir»;
  «Kelime-i Tevhid, Kelime-i Şehâdet, Eûzü Besmele, Tekbir, Salâtü Selam gibi ifadelerin de doğru telaffuz
  edilmesi»; ezberlenecek metin önce yüzünden hatasız okunur; kaynak kitap «Tecvidli Elifba Kur'an Öğreniyorum».

**Kısa Süreli Öğretim Programları (2026) — Ezber Dersi Öğretim Programı**
- URL: https://egitimhizmetleri.diyanet.gov.tr/Documents/%C4%B0htiya%C3%A7%20Odakl%C4%B1%20Kur%27an%20Kurslar%C4%B1%20K%C4%B1sa%20S%C3%BCreli%20%C3%96%C4%9Fretim%20Programlar%C4%B1-2026.pdf
  (onay 21.08.2026, E-8054706; Ezber Dersi PDF s. 65; öğrenme alanları PDF s. 70–71).
- Ezber-I: namaz duaları (Sübhâneke, Tahiyyât, Salli–Bârik, Rabbenâ, Kunut, Âmentü, Ezan-Kāmet, Namaz
  tesbihâtı) ve sûreler (Fâtiha, Fîl–Nâs, Bakara 1–5, Âyetü'l-Kürsî, Âmene'r-Resûlü, Haşr 21–24, Duhâ–Hümeze,
  Yâsîn, Mülk, Nebe', Fetih, Rahmân …).
- Ezber-II: aşr-ı şerifler; «Peygamberimizden dualar» (ezan duası, yemek duası, abdest duaları, yolculuk duası,
  evden çıkarken, iftar duası, tuvalet duaları, Seyyidü'l-istiğfâr, hatim duası …); «Peygamberlerin dilinden
  dualar» — bunlardan biri «Hz. Mûsâ (as)'nın Duası (Tâhâ 25–28)» (PDF s. 71).
- İlkeler: ezber anlamla birlikte, «kademeli ve planlı».

**Camilerde Kur'an Öğretim Programı (2010)** — tek kademeli (kur) ezber modeli
- URL: https://egitimhizmetleri.diyanet.gov.tr/Documents/Camilerde%20Kur%27an%20%C3%96%C4%9Fretim%20Program%C4%B1%20-%202010.pdf
  (basılı = PDF).
- Kur'an kursuna gelemeyenler için (s. 3); «3 kur olarak planlanmıştır» (s. 4); kur başına 50 saat = 34 saat
  Kur'an + 16 saat dinî bilgiler; hafta içi veya hafta sonu uygulanabilir (s. 5); genel bakış s. 7.
- **I. Kur** (s. 8, ezber 8 saat): Fâtiha, İhlâs, Kevser (4 saat); Sübhâneke, Ettehiyyâtü, Salli–Bârik,
  Rabbenâ Âtinâ ve Rabbenağfirlî (4 saat) — kursiyer henüz okuyamadığı için şifahî ve tedricî.
- **II. Kur** (s. 9): Fîl, Kureyş, Mâûn, Kâfirûn, Nasr, Tebbet, Felak, Nâs (6 saat); Kunut (1 saat);
  Ezan ve kāmet (1 saat).
- **III. Kur** (s. 10): Bakara 255 (3 saat); Bakara 285–286 (3 saat); Haşr 22–24 (2 saat).

### A.4 Ortak omurga (karşılaştırma)

1. **Giriş formülleri** (çocuk programlarında ilk maddeler): Eûzü-Besmele (7–10, 11–14, Yaz, Yatılı Yaz);
   «Tekbir ve Salavât / Salât-ı Ümmiye» (aynı dört program); Rabbi yessir (4–6, 7–10, Yaz, Yatılı Yaz). Yetişkin
   programında (2026) bunlar ayrı madde değil, «doğru telaffuz» notundadır.
2. **Namaz duaları hep aynı iç sırayla:** Sübhâneke → Tahiyyât → Salli–Bârik → Rabbenâ → Kunut → Âmentü. Tek
   istisna 7–10: Fâtiha–İhlâs–Kevser–Asr Tahiyyât'tan önce, Âmentü Kunut'tan önce.
3. **Sûreler:** Fâtiha + Fîl→Nâs mushaf sırasıyla; çocuk programları ve 2010 I. Kur Fâtiha–İhlâs–Kevser'i öne alır.
4. **Kunut her programda Fîl→Nâs bloğundan önce** (2010'da aynı kurda).
5. **Aşır üçlüsü:** Âyetü'l-Kürsî → Âmene'r-Resûlü (Bakara 285–286) → Haşr son üç (7–10, 11–14, Yaz, Yatılı Yaz,
   2010 III. Kur; 2025 3. dönem; 2026 KK-I/II).
6. **İkinci basamak:** Duhâ→Hümeze (2025 2. dönem; 2026 KK-II; 11–14 notu).
7. Kademeli yapı yalnız 2010'da (3 kur), Yaz 2024'te (2 seviye) ve 2025–2026'da (dönem, KK-I/II) var; hepsi
   sırayı «örnek» sayar ve öğreticiye değiştirme yetkisi verir.

---

## B. Namazdaki metinlerin Hanefî hükmü (Diyanet İlmihali c. 1)

Kaynak: Diyanet İlmihali c. 1 (İman ve İbadetler) — `D:\ihtisas\kaynaklar\diyanet-ilmihal\cilt-1\06-namaz.md`
(«[s. N]» işaretleri sayfa sonunu gösterir). Sünnetler ve vâcipler kitapta numaralı listedir; aşağıda sayfa
numarası yalnız doğrulandığı yerde tekil verildi, öbürlerinde liste aralığı yazıldı.

| Metin | Namazdaki yeri | Hüküm (Hanefî) | Sayfa |
|---|---|---|---|
| Niyet | başlarken | şart (farz). «Niyetin kalp ile yapılması esas olup dil ile söylenmesi şart değildir … dil ile de söylenmesi daha iyi olur ve bu tarzda niyet, çoğunluğa göre müstehaptır.» | s. 227 (on iki farz), s. 239 |
| İftitah tekbiri «Allâhü ekber» | başlangıç | farz; Hanefî'de şart (rükne yakın). Namaza «Allahüekber» lafzıyla başlamak ayrıca vâcip (vâcip 1) | s. 240; vâcipler s. 249–251 |
| Sübhâneke | 1. rekât, tekbirden sonra | sünnet (sünnet 4) | s. 253 |
| Eûzü | yalnız 1. rekât; tek başına kılan ve imam | sünnet (5) | s. 252–255 |
| Besmele | her rekâtta Fâtiha'dan önce (imam ve tek başına kılan) | sünnet (6) | s. 252–255 |
| Kıraat | kıyam | farz (rükün); farzların herhangi iki rekâtında farz, ilk iki rekâtta vâcip. Asgari: «kısa üç âyet veya buna denk bir uzun âyet» (s. 241); «kıraat rüknünün ifası için bir âyetin okunması yeterli görülmüş» (s. 242) | s. 241–242 |
| Fâtiha | kıyam | vâcip (vâcip 2) | s. 249–251 |
| Zamm-ı sûre | Fâtiha'dan sonra | vâcip (3); en az bir kısa sûre (en kısası Kevser) ya da üç kısa âyet | s. 249–251 |
| Âmin | Fâtiha sonunda | sünnet (7) | s. 252–255 |
| Rükû tekbiri | rükûya giderken | sünnet (9) | s. 252–255 |
| «Sübhâne rabbiye'l-azîm» ×3 | rükû | sünnet (10) | s. 252–255 |
| «Semiallâhü limen hamideh» | rükûdan doğrulurken (imam ve tek başına kılan) | sünnet (11) | s. 252–255 |
| «Rabbenâ leke'l-hamd» | doğrulunca | sünnet (12) | s. 252–255 |
| «Sübhâne rabbiye'l-a'lâ» ×3 | secde | sünnet (21) | s. 252–255 |
| Ettehiyyâtü | her iki oturuşta | vâcip (10); gizli okumak sünnet (26); ilk oturuş vâcip (9) | s. 249–251; s. 252–255 |
| Ka'de-i ahîre | son oturuş, teşehhüd miktarı | farz | s. 247–248 |
| Salli–Bârik (salavât) | son oturuş | müekked sünnet (28) | s. 255 |
| Rabbenâ âtinâ / Rabbenağfirlî | salavattan sonra | sünnet: salavattan sonra dua (29) | s. 255 |
| Selâm | sonda | vâcip (11): «es-Selâm» lafzı vâcip, «aleyküm ve rahmetullah» sünnet; başı sağa-sola çevirmek sünnet (30) | s. 249–251 |
| Kunut duaları | vitirin 3. rekâtı | Ebû Hanîfe'ye göre vâcip, İmâmeyn'e göre sünnet (vâcip 14) | s. 249–251; s. 304–306 |
| Teşrik tekbiri | Arefe sabahından bayramın 4. günü ikindiye, 23 vakit farzın ardından | vâcip (Ebû Yûsuf–Muhammed görüşü; fetva bu yönde) | s. 307–308 |
| Namaz sonrası tesbihat | farzdan sonra | c. 1'de ayrı başlık bulunamadı; hüküm DİYK fetvalarında: istiğfar sünnet, Âyetü'l-Kürsî mendup (§E) | — |

**Öğretimi doğrudan etkileyen ek hükümler**
- «Farz namazlarda ilk iki rek'atta Fâtiha'dan sonra aynı sûrenin okunması mekruhtur; nâfile namazlarda mekruh
  değildir.» Ayrıca «Fâtiha'dan sonra okunacak sûrelerde Kur'an'daki sıraya uymamak, meselâ birinci rek'atta
  Kevser sûresini okuduktan sonra ikinci rek'atta Fîl sûresini okumak mekruhtur.» (s. 260)
- Kunut bilmeyen: «Bu duayı okuyamayan kimse "Rabbenâ âtinâ" duasını okur veya üç kere "Allahümmağfir lî" veya
  üç kere "Yâ Rabbi" der.» (s. 305–306)
- Meâlle kıraat: «Hanefî mezhebine göre Arapça'ya dili dönmeyen veya ezberleyemeyen kimseler öğreninceye kadar
  namazda Kur'an'ı (anlamını, meâlini) kendi dillerinde okuyabilirler» (s. 243). Karşı görüş için §I.6/8.
- Türkçe okunuşlarla namazın kılınışı: s. 262–264.
- Abdest farzları s. 197; gusül s. 206; teyemmüm s. 209 (`05-temizlik.md`); oruç niyeti s. 399 (`07-oruc.md`).

---

## C. Elif-Bâ'daki namaz duaları: sayfa, sıra, yazım

### C.1 Kursun Elif-Bâ'sı — «s. 34–39» doğrulandı
- Künye: «Tecvîdli Kur'an-ı Kerim Elif-Bâ'sı», DİB Yayınları 862, Mesleki Kitaplar 61, 15. baskı, Ankara 2020
  (Faruk Salman, Nazif Yılmaz, Nihat Morgül; DİYK 31.05.2007/47); 52 s.; basılı = PDF.
- Dosyalar: Rıdvan’ın yerel Elif-Bâ PDF’i; kurs dökümü
  `D:\ulu-camii-kuran-kursu\veri\kitaplar\elifba\30-namaz-dualari.md` (dizin: s. 34–41). s. 34, 38 ve 39 sayfa
  görüntüsüyle ayrıca doğrulandı.

| Sayfa | Kitaptaki başlık | Not |
|---|---|---|
| 32 | (mushaf sayfası) | Fâtiha |
| 33 | (mushaf sayfası) | Bakara'nın başı |
| 34 | NAMAZ DUALARI — SÜBHANEKE · ETTEHİYYATU · ALLÂHÜMME SALLİ | Sübhâneke'nin Arapçasında «وَجَلَّ ثَنَاؤُكَ» var, açıklama notu yok |
| 35 | ALLÂHÜMME BÂRİK · RABBENÂ ÂTİNÂ · RABBENAĞFİRLÎ · KUNUT 1 | Rabbenağfirlî yalnız İbrâhîm 14/41 |
| 36 | KUNUT 2 · EZAN | |
| 37 | EZAN DUASI · KAMET | ezan duası «اِنَّكَ لَا تُخْلِفُ الْمِيعَادَ» ile bitiyor; kāmet Hanefî/Şâfiî tablosu Latin okunuşlu |
| 38 | NAMAZ İÇİNDEKİ TESBİHAT · NAMAZ SONRASI TESBİHAT | içindeki: tekbir, rükû ×3, semiallâhu…, rabbenâ leke'l-hamd, secde ×3, selâm; sonrası: kısa dizi (§E.2), Âyetü'l-Kürsî yok |
| 39 | ÂMENTÜ DUÂSI · ŞÂFİÎ MEZHEBİNE GÖRE NAMAZ DUALARI (İftitah) | Şâfiî bölümü sayfanın altında başlar |
| 40–41 | Şâfiî: Tahiyyât, Salli–Bârik; Kunut | Şâfiî kunutu Latin okunuşlu |

- **Sıra:** Sübhâneke → Tahiyyât → Salli → Bârik → Rabbenâ âtinâ → Rabbenağfirlî → Kunut 1 → Kunut 2 → Ezan →
  Ezan duası → Kāmet → Namaz içindeki tesbihat → Namaz sonrası tesbihat → Âmentü.
- Hanefî dualarında **Latin harfli okunuş yok** (Arapça + Türkçe anlam). Türkçe okunuş için Diyanet İlmihali
  c. 1 s. 262–264 veya Namaz İlmihali (`…\namaz-ilmihali\027-ii-namaz-icinde-okunacak-dualar.md`) kullanılmalı.
- Taslaktaki adlar (Sübhâneke Duası, Ettehiyyâtü, Allâhümme Salli/Bârik, Rabbenâ Âtinâ, Rabbenağfirlî, Kunut
  duası I/II, Ezan, Kāmet, Ezan duası, Âmentü) bu başlıklarla uyumlu.

### C.2 Diyanet «Elifba Kur'an Öğreniyorum» (DİB Genel Yayın 2498, 3. bs., Temmuz 2024, 28 s.)
- `D:\ihtisas\kaynaklar\diyanet-kitaplik\kuran-kursu-kitapligi\elifba-kuran-ogreniyorum.md`: içindekiler s. 5;
  namaz duaları s. 24 (Sübhâneke — «وَجَلَّ ثَنَٓاؤُ۬كَ» dahil —, Tahiyyât, Salli), s. 25 (Bârik, Rabbenâ Âtinâ,
  Rabbenağfirlî), s. 26 (Kunut 1–2); Şâfiî s. 27–28; s. 3: «Rabbim kolaylaştır, zorlaştırma. Rabbim hayırla
  tamamla!».
- 2026 programlarının kaynak gösterdiği «Tecvidli Elifba Kur'an Öğreniyorum» ile aynı kitap olup olmadığı
  **doğrulanamadı** (içerik listeleri farklı).

### C.3 Bu bölümde çıkan farklar
1. **«ve celle senâük»:** iki Elif-Bâ'da da notsuz var. Namaz İlmihali (027): «"Ve celle senâük" cümlesi sadece
   cenaze namazında okunur.» Temel Dinî Bilgiler (`…\temel-dini-bilgiler\033-namazlarda-okunan-dualar.md`):
   cümle parantez içinde, «NOT: … cenaze namazında okunur.» Diyanet İlmihali'nin kılınış metninde (s. 263) yok.
2. **Ezan duasının son cümlesi:** Elif-Bâ s. 37 «inneke lâ tuhlifu'l-mîâd» ile bitiriyor. Tecrîd-i Sarîh
   (`…\hadis-ve-siyer\tecrid-i-sarih-2\011-kitabul-ezan.md`, 30. dipnot): «Beyhakī'nin rivayetinde duanın sonunda
   bir de إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ … vardır.» Buhârî (Ezân 8) metninde yok; Namaz İlmihali (032) ve Din
   Görevlisi Rehberi (007) Buhârî metnini veriyor.
3. **Müfredat atfı:** `docs/kuran-kursu-mufredati-2026-2027.md` 126, 128, 130. satırlar («Amme Cüzü Satırları»,
   «Akıcılık Çalışması», «Okuma Değerlendirmesi» — «Elifbâ s. 32–33») ve yıllık planda 966, 1022, 1081, 1294,
   1446, 1549. satırlar. s. 32–33'te Amme satırı yok (Fâtiha ve Bakara'nın başı); başlık ya da sayfa düzeltilmeli.
   (Yıllık plandaki «Camiye Gidiyorum 2 s. 34–39» siyer dersidir, ezberle ilgisi yok.)

---

## D. 32 farz

- **Diyanet ifadesi:** Dînî Kavramlar Sözlüğü (DİB), «OTUZ İKİ FARZ», s. 534
  (`D:\ihtisas\kaynaklar\dini-kavramlar-sozlugu\o.md`):
  - **Namazın 12 farzı:** hadesten taharet, necasetten taharet, setrü'l-avret, istikbâl-i kıble, vakit, niyet;
    iftitah tekbiri, kıyam, kıraat, rükû, sücûd, ka'de-i âhire.
  - **İslâm'ın 5 esası:** Sözlük sırasıyla «savm, salât, hac, zekât ve kelime-i şahadet» (arşiv metninde
    «kileme-i şahadet» diye bir dizgi hatası var).
  - **İmanın 6 esası:** Allah, melekler, kitaplar, peygamberler, âhiret günü, kaza ve kader.
  - **Abdestin 4 farzı:** Sözlük: «Elleri ve yüzü yıkamak, kolları dirsekler ile birlikte yıkamak, başı
    meshetmek, ayakları küçük topuklarla birlikte yıkamak.»
  - **Guslün 3 farzı:** ağzı, burnu ve bütün bedeni yıkamak (İlmihal s. 206 aynı; Hanefî/Hanbelî).
  - **Teyemmümün 2 farzı:** «Niyet edip elleri iki defa temiz toprağa vurmak, birincisinde yüzü, ikincisinde
    kolları meshetmek.»
- **Resmî tanım:** DİYK Fetvalar (2018, 4. bs.), no. 815, s. 433 (`D:\ihtisas\kaynaklar\diyk\yayinlar\fetvalar-2018-4-baski.md`):
  «32 farz tabiri, imanın ve İslam'ın şartları ile guslün, abdestin, namazın ve teyemmümün farzlarını ifade
  etmektedir…» (fetvanın konusu: bunlar nikâhın şartı değildir).
- **32 mi 54 mü:** DİA, «İLMİHAL» (Hatice Kelpetin Arpaguş), c. 22, s. 139–141: «otuz iki farz» (akaid ve
  ibadet) ve «elli dört farz» (ahlâk ve görgü ağırlıklı) başlıklı el kitapları yaygındır. DİA'da «ELLİ DÖRT
  FARZ» ve «OTUZ İKİ FARZ» ayrı madde değildir, «İLMİHAL»e gönderilir. Diyanet'in yayımladığı resmî bir **54 farz
  listesi arşivde bulunamadı** → katalogda 32 farz kullanılmalı; 54 farz istenirse kaynağı ayrıca doğrulanmalı.
- **Farklar:**
  - Teyemmüm: Sözlük 2 farz sayar; Diyanet İlmihali «niyet, yüzü meshetmek, kolları dirseklerle birlikte
    meshetmek şeklinde üç farzı vardır» der (s. 209). İçerik aynı, sayım farklı; «32» toplamı ancak 2 sayımıyla tutar.
  - Abdest: Sözlük'teki «Elleri ve yüzü yıkamak» ifadesi yerine İlmihal s. 197'deki ifade (yüzü yıkamak;
    kolları dirseklerle birlikte yıkamak; başı meshetmek; ayakları topuklarla birlikte yıkamak) daha doğrudur.
  - İslâm'ın şartları sırası: Temel Dinî Bilgiler (DİB Yay. 301,
    `…\temel-dini-bilgiler\010-unite-ii-islam.md`): «1. Kelime-i Şehadet Getirmek, 2. Namaz Kılmak, 3. Oruç
    Tutmak, 4. Zekât Vermek, 5. Hacca Gitmek». Katalog bu alışılmış sırayı kullanmalı.
- **Taslaktaki dağılım:** Seviye 1 (iman 6 + İslâm 5), Seviye 2 (abdest 4 + namaz 12), Seviye 7 (gusül 3 +
  teyemmüm 2) = 32 ✓.

---

## E. Farzlardan sonra tesbihat

### E.1 Namaz İlmihali sırası
Kaynak: Namaz İlmihali (İsmail Karagöz–Halil Altuntaş, DİB Yay. 703, 4. bs. 2011) —
`D:\ihtisas\kaynaklar\diyanet-kitaplik\ilmihal-fikih\namaz-ilmihali\028-iii-namaz-sonrasi-yapilacak-dua-ve-zikirler.md`

1. İstiğfar: «Esteğfirullâhe'l-azîmellezî lâ ilâhe illâ hû, el-hayyü'l-kayyûmü ve etûbü ileyh» (Tirmizî,
   Salât 222, no. 299 atfıyla).
2. Salât-ı Münciye — kitap bunun Hz. Peygamber'den gelmediğini belirtir; isteğe bağlıdır.
3. Seyyidü'l-istiğfâr (Buhârî, De'avât 2, 15).
4. «Allâhümme ente's-selâmü ve minke's-selâm. Tebârekte yâ ze'l-celâli ve'l-ikrâm» (Müslim, Mesâcid 135);
   isteğe bağlı olarak «Lâ ilâhe illallâhü vahdehû …» (Tirmizî, Salât 222, no. 298); «alâ Resûlinâ salavât»,
   «Allâhümme salli alâ Muhammed».
5. «Sübhânellâhi ve'l-hamdü lillâhi ve lâ ilâhe illâllâhü vellâhü ekber. Ve lâ havle ve lâ kuvvete illâ
   billâhi'l-aliyyi'l-azîm».
6. Eûzü-Besmele + Âyetü'l-Kürsî (Bakara 2/255).
7. 33 Sübhânallah, 33 Elhamdülillâh, 33 Allâhü ekber (Nesâî, Sehv 95).
8. «Lâ ilâhe illâllâhü vahdehû lâ şerîke leh. Lehü'l-mülkü ve lehü'l-hamdü ve hüve alâ külli şey'in kadîr»
   (Müslim, Mesâcid 146); ardından dua (029).
- Ek (`…\030-vi-yatsi-namazindan-sonra-okunabilecek-dua-icerikl.md`): sabah ve akşamdan sonra Haşr 59/22–24;
  yatsıdan sonra Bakara 2/285–286.

### E.2 Kursun Elif-Bâ'sı, s. 38 («Namaz sonrası tesbihat», kısa dizi)
«Allâhümme ente's-selâm…» → «alâ rasûlinâ salavât» → «Sübhânallâhi ve'l-hamdü lillâhi … ve lâ havle …» →
Sübhânallah / Elhamdülillâh / Allâhü ekber → «Lâ ilâhe illallâhu vahdehû … kadîr» → «sübhâne
rabbiye'l-aliyyi'l-a'le'l-vehhâb». Âyetü'l-Kürsî bu sayfada yok (taslakta ayrı madde: uyumlu).

### E.3 Hükümler
- İstiğfar sünnettir (Müslim, Mesâcid 135 [591]): https://kurul.diyanet.gov.tr/tr/fetva/farz-namazlardan-sonra-estagfirullah-demenin-dayanagi-nedir/0193c42d-5714-7c91-9d1d-6e21d0d9dbf7
- Namazdan sonra Âyetü'l-Kürsî okumak menduptur: https://kurul.diyanet.gov.tr/tr/fetva/namazdan-sonra-ayetul-kursi-okumanin-hukmu-nedir/0193c42d-573d-7ae1-3467-823cf13b7af2
- Tesbihatın müezzin eşliğinde toplu yapılması bid'at değildir: `D:\ihtisas\kaynaklar\diyk\fetvalar\namaz\namazdan-sonraki-tesbihatin-muezzin-esliginde-yapilmasinin.md`
- Kāmetten sonra ezan duası okunması uygun görülmez: DİYK Fetvalar (2018), no. 237, s. 167.
- Diyanet İlmihali c. 1'de namaz sonrası tesbihata ayrılmış başlık bulunamadı (arşiv araması 0 sonuç).

---

## F. Kunut duaları

**Okunuş (Diyanet İlmihali c. 1 s. 305):**
- **Kunut 1:** «Allâhümme! İnnâ nesteînüke ve nestağfiruke ve nestehdîk; ve nü'minü bike ve netûbü ileyke ve
  netevekkelü aleyke ve nüsnî aleyke'l-hayra kullehü neşkuruke, velâ nekfüruk; ve nahleu ve netrukü men yefcüruk.»
- **Kunut 2:** «Allâhümme! İyyâke na'büdü ve leke nüsallî ve nescüdü ve ileyke nes'â ve nahfidü nercû rahmeteke
  ve nahşâ azâbek. İnne azâbeke bi'l-küffâri mülhık.»

**İkinci Diyanet yazımı:** Namaz İlmihali (027) aynı metni farklı imlâyla verir («nesteğfiruke», «nestehdîke»,
«küllehû», «nekfürüke», «nüsalli» …). Katalog tek bir yazım sistemini tutarlı kullanmalı (öneri: Diyanet İlmihali).

**Anlam kaynağı:** kursun Elif-Bâ'sı s. 35 (Kunut 1) ve s. 36 (Kunut 2) Arapçanın altında Türkçe anlam verir;
Namaz İlmihali (027) Türkçe anlamı ve rivayet kaynaklarını verir (İbn Ebî Şeybe, II, 301; Abdürrazzâk, III, 121).
Kur'an metni değildir (taslakta `kuranMetni:false` ✓).

**Hüküm ve yedek:** vitirde Ebû Hanîfe'ye göre vâcip (s. 249–251, 304–306); bilmeyenin yedeği s. 305–306 (§B).
Şâfiî kunutu ayrı bir metindir (Elif-Bâ s. 41, Latin okunuşlu); 2026 programı Şâfiî farklılıklarına yer
verilmesini ister (KK-I notu).

---

## G. Amme cüzü (78–114): Diyanet yazımı, âyet sayısı, taslaktaki yeri

Kaynak: Kur'an Yolu (`D:\ihtisas\kaynaklar\kuran-yolu-tefsiri\078-nebe.md` … `114-nas.md`; başlıklar
kuran.diyanet.gov.tr sûre adlarıyla aynı). «Görevde» sütunu, görevde verilen seviye listesindekileri (Fîl→Nâs,
Kadir, Alak 1–5, Hümeze, Tekâsür, Kâria, Âdiyât, Zilzâl, Beyyine, İnşirâh, Asr) işaretler. «Taslak» sütunu
`katalog.json` v1'deki seviye/sıradır (S = seviye, K = kenar suyu).

| No | Sûre (Kur'an Yolu) | Âyet | Görevde | Taslak v1 | Yazım notu (taslak) |
|---|---|---|---|---|---|
| 78 | Nebe | 40 | — | S8/25 | taslak «Nebe'» |
| 79 | Naziât | 46 | — | S8/24 | taslak «Nâziât» (Kur'an Yolu metin içinde de «Nâziât») |
| 80 | Abese | 42 | — | S8/23 | |
| 81 | Tekvîr | 29 | — | S8/22 | |
| 82 | İnfitâr | 19 | — | S8/21 | |
| 83 | Mutaffifîn | 36 | — | S8/20 | |
| 84 | İnşikâk | 25 | — | S8/19 | taslak «İnşikāk» (ā) |
| 85 | Burûc | 22 | — | S8/18 | |
| 86 | Târık | 17 | — | S8/17 | |
| 87 | A'lâ | 19 | — | S8/16 | taslak «A‘lâ» (Kur'an Yolu metin içinde de «A‘lâ») |
| 88 | Gâşiye | 26 | — | S8/15 | |
| 89 | Fecr | 30 | — | S8/14 | |
| 90 | Beled | 20 | — | S8/13 | |
| 91 | Şems | 15 | — | S8/12 | |
| 92 | Leyl | 21 | — | S8/11 | |
| 93 | Duhâ | 11 | — | S8/10 | |
| 94 | İnşirâh | 8 | ✓ | S6/6 | |
| 95 | Tîn | 8 | — | S8/9 | |
| 96 | Alak | 19 | ✓ (yalnız 1–5) | S8/8 + K/7 (1–5) | çift kayıt bilinçliyse sorun yok |
| 97 | Kadir | 5 | ✓ | S8/7 | |
| 98 | Beyyine | 8 | ✓ | S8/6 | |
| 99 | Zilzâl | 8 | ✓ | S8/5 | |
| 100 | Âdiyât | 11 | ✓ | S8/4 | |
| 101 | Kâria | 11 | ✓ | S8/3 | |
| 102 | Tekâsür | 8 | ✓ | S8/2 | |
| 103 | Asr | 3 | ✓ | S5/2 | |
| 104 | Hümeze | 9 | ✓ | S8/1 | |
| 105 | Fîl | 5 | ✓ | S6/1 | |
| 106 | Kureyş | 4 | ✓ | S6/2 | |
| 107 | Maûn | 7 | ✓ | S6/3 | taslak «Mâûn» |
| 108 | Kevser | 3 | ✓ | S5/1 | |
| 109 | Kâfirûn | 6 | ✓ | S6/4 | |
| 110 | Nasr | 3 | ✓ | S5/3 | |
| 111 | Tebbet | 5 | ✓ | S6/5 | Kur'an Yolu metinde «Leheb» adını da anar; Namaz İlmihali «Leheb» der |
| 112 | İhlâs | 4 | ✓ | S3/2 | |
| 113 | Felak | 5 | ✓ | S5/4 | Temel Dinî Bilgiler «Felâk» |
| 114 | Nâs | 6 | ✓ | S5/5 | |

- **Toplam:** 37 sûre, **564 âyet**. Taslak S8: 25 sûre, 505 âyet; S3–S6'daki 12 Amme sûresi: 59 âyet.
- Taslak S8 mushafın sonundan başına doğru ilerliyor (Hümeze → Nebe). Diyanet'in ikinci basamağı aynı sûreleri
  ileri yönde sıralar (Duhâ → Hümeze; 2025 2. dönem, 2026 KK-II); 11–14 notu «Dûha sûresinden aşağısı» der.
  Çelişki değil, yön farkı: taslaktaki ilk 10 madde (Hümeze…Duhâ) Diyanet'in ikinci basamağıyla aynı küme.

---

## H. Kenar suyu maddeleri: kaynak ve Kur'an metni olup olmadığı

| Taslak kimliği | Metin/konu | Diyanet kaynağı | Kur'an metni mi? | Taslak `kuranMetni` |
|---|---|---|---|---|
| b-ulul-azm | Ülü'l-azm: Nûh, İbrâhim, Mûsâ, Îsâ, Muhammed | Dînî Kavramlar Sözlüğü s. 668 (`ü.md`); DİA «ÜLÜ'l-AZM» (Muhammed Aruçi) c. 42 s. 294–295: tabir Ahkāf 46/35'te geçer, beş isim Ahzâb 33/7 ve Şûrâ 42/13'ten çıkarılır | Hayır (bilgi; liste âyet değil) | false ✓ |
| d-tesrik-tekbiri | «Allâhü ekber Allâhü ekber, lâ ilâhe illallâhü vallâhü ekber, Allâhü ekber ve lillâhi'l-hamd» | Sözlük s. 654 (`t.md`); İlmihal c. 1 s. 307–308 (vâcip, 23 vakit); İslâm İlmihali (`018-viii-namaz.md`) | Hayır | false ✓ |
| d-kadir-gecesi-duasi | «Allâhümme inneke afüvvün tühibbü'l-afve fa'fü annî» | İlmihal c. 1 s. 322 (Tirmizî, Da'avât 84); Riyâzü's-Sâlihîn (DİB) T3513 | Hayır (hadis) | false ✓ |
| d-rabbisrahli | Hz. Mûsâ'nın duası | Tâhâ 20/25–28; Kısa Süreli 2026 Ezber Dersi PDF s. 71; Kur'an Yolu c. 3 | **Evet** | true ✓ |
| d-telbiye | «Lebbeyk Allâhümme lebbeyk …» | İlmihal c. 1 s. 519 (`09-hac-ve-umre.md`) | Hayır (hadis) | false ✓ |
| d-oruc-niyeti | «Niyet ettim Ramazan-ı şerifin yarınki orucuna» | Temel Dinî Bilgiler Ünite VI (`014-unite-vi-oruc.md`); İlmihal c. 1 s. 399: kalben niyet yeterli, dil ile söylemek mendup | Hayır (Türkçe formül; Fransızca da söylenebilir) | false ✓ |
| s-alak-1-5 | Alak 96/1–5 | Kur'an | **Evet** | true ✓ |
| b-secme-hadisler, b-kuran-fazileti-hadisleri | hadis seçkileri | bu araştırmada içerik **incelenmedi**; metin ve numara Diyanet hadis yayınlarından alınmalı | Hayır | false ✓ |
| b-dort-halife | Hz. Ebû Bekir, Ömer, Osman, Ali (632–661) | Sözlük s. 269 «HULEFÂ-İ RÂŞİDÎN» (`h.md`) | Hayır | false ✓ |
| d-yemek-duasi | «Elhamdülillâhillezî et'amenâ ve sekânâ ve cealenâ müslimîn» | Hadislerle İslâm 6 (`…\hadislerle-islam-6\025-…md`, dipnot 1672: Ebû Dâvûd, Et'ıme, 52; Tirmizî, Deavât, 55); Din Görevlisi Rehberi (007: Tirmizî, Deavât, 56 — baskı farkı) | Hayır (hadis) | false ✓ |

**Seviyelerdeki metinlerin Kur'an işareti (ek kontrol):**
- `d-euzu-besmele` = true: Besmele Kur'an'da geçer (Neml 27/30; DİA «BESMELE» c. 5 s. 529–540). Eûzü formülü âyet
  değildir; «Kur'an okuyacağın zaman kovulmuş şeytandan Allah'a sığın» (Nahl 16/98) emrine dayanır, çoğunluğa göre
  müstehaptır (DİA «İSTİÂZE», Muhsin Demirci, c. 23 s. 318–319). `true` ses kuralı için ihtiyatlı ve uygun.
- `d-kelime-i-tevhid` = false ✓: «Bu iki ilke bir arada Kur'an'da bulunmamakla birlikte…» (DİA «KELİME-i TEVHİD»,
  c. 25 s. 214–216); «Lâ ilâhe illallah» ve «Muhammedün rasûlullah» (Feth 48/29) ayrı âyetlerde geçer.
- `d-kelime-i-sehadet` = false ✓ (İslâm İlmihali `010-iv-iman.md`).
- `d-rabbena-atina` = true ✓ (Bakara 2/201; Kur'an Yolu c. 1 s. 318–319). Metin «…ve kınâ azâbe'n-nâr» ile
  bitmeli; İlmihal (s. 263) ve Temel Dinî Bilgiler (033) okunuşundaki «bi rahmetike yâ erhame'r-râhimîn» âyetten değildir.
- `d-rabbenagfirli` = true ✓ (İbrâhîm 14/41; Elif-Bâ s. 35 yalnız 41. âyet; İlmihal kılınışı 14/40–41'i birlikte verir).
- `d-amentu` = false ✓: Sözlük s. 26 — esaslar Kur'an'da (Bakara 2/177, 285; Nisâ 4/136) ve Buhârî ile Müslim'deki
  Cibrîl hadisinde geçer; formül âyet değildir.
- Niyet maddeleri (`d-abdest-niyeti`, `d-namaz-niyeti`, `d-oruc-niyeti`): niyet kalp işidir; dil ile söylemek
  namazda müstehap (İlmihal s. 239), abdestte niyet sünnettir (Temel Dinî Bilgiler `011-unite-iii-temizlik.md`).
  Türkçe formüller (Temel Dinî Bilgiler `012-unite-iv-namaz-i.md`) Arapça ezber metni değildir.

---

## I. ÖNERİ (bu bölüm öneridir; kaynaklı olgular A–H'dedir)

### I.1 Sıralama ilkesi (kaynaklara dayanarak)
1. Önce **farz ve vâcip** okunuşlar, sonra sünnetler (§B).
2. Diyanet önceliği: «namazlarını kılabilecek düzeyde» (7–10 s. 9; 11–14 s. 10).
3. Zorlanılan metin ertelenir, kolay olan öne alınır (7–10 s. 9; 11–14 s. 10).
4. Farzın iki rekâtı için iki ayrı sûre ve mushaf sırası (İlmihal s. 260).
5. Sıra öğreticiye bırakılabilir (bütün programlar) → aşağıdaki öneriler Diyanet'e aykırı değil, uyarlamadır.

### I.2 Taslak v1 değerlendirmesi

| Seviye (v1) | v1 içeriği | Kaynakla uyum | Öneri |
|---|---|---|---|
| 1 İlk adım: iman ve besmele | Eûzü-Besmele; Kelime-i tevhid; Kelime-i şehâdet; İmanın şartları; İslâm'ın şartları | Uyumlu (2026 telaffuz notu; 2025 İtikat s. 15; çocuk programlarının ilk maddeleri) | İslâm'ın şartlarında Temel Dinî Bilgiler sırası (§D) |
| 2 Namaza hazırlık | Abdestin farzları; Abdest niyeti; Namazın farzları; Namaz niyeti; Sübhâneke | Uyumlu | **Tekbir** maddesi eklensin (tek farz tekbir, İlmihal s. 240; Elif-Bâ s. 38; 2026 notu); gusül ve teyemmüm farzları S7'den buraya → 32 farz S2'de tamam; niyet maddelerine «kalben yeterli» notu |
| 3 Kıyam, rükû ve secde | Fâtiha; İhlâs; rükû tesbihi; tesmî-tahmîd; secde tesbihi | Uyumlu | **Kevser S5'ten buraya** (Fâtiha–İhlâs–Kevser; İlmihal s. 260) |
| 4 Oturuş ve selâm | Tahiyyât; Salli; Bârik; Rabbenâ âtinâ; Rabbenağfirlî | Uyumlu (bütün programların iç sırası) | **Selâm** maddesi eklensin (vâcip, s. 249–251; Elif-Bâ s. 38); **kunut yedeği** hoca notu olarak burada (s. 305–306) → S4 sonunda beş vakit + vitir kılınabilir |
| 5 Namaz sûreleri I | Kevser; Asr; Nasr; Felak; Nâs | Kolaydan zora ilkesine uygun | Kevser S3'e gidince yerine **Fîl** (S6'dan): Asr, Fîl, Nasr, Felak, Nâs |
| 6 Namaz sûreleri II | Fîl; Kureyş; Mâûn; Kâfirûn; Tebbet; İnşirâh | Uyumlu; İnşirâh'ı Diyanet Duhâ ile birlikte verir | Kureyş, Mâûn, Kâfirûn, Tebbet, İnşirâh |
| 7 Vitir, tesbihat ve ezan | Kunut 1–2; Âyetü'l-Kürsî; Tesbihat; Ezan; Kāmet; Ezan duası; Âmentü; Guslün farzları; Teyemmümün farzları | **En ağır seviye**; Kunut'u bütün programlar sûrelerden önce verir | Gusül/teyemmüm S2'ye; «Tesbihat» = Elif-Bâ s. 38 dizisi; süre 8 hafta, gerekirse 10 |
| 8 Amme cüzü | 25 sûre, 505 âyet | Diyanet ikinci basamağıyla aynı küme, ters yön | 5 durak (§I.4) |
| Kenar suyu | 11 madde | Kur'an işaretleri doğru | §I.5 |

### I.3 Önerilen düzen — iki seçenek (her seviye 4–8 hafta)

**Seçenek A — asgari değişiklik (v1'in adları korunur)**

| S | Ad | İçerik | Hafta |
|---|---|---|---|
| 1 | İlk adım: iman ve besmele | Eûzü-Besmele; Kelime-i tevhid; Kelime-i şehâdet; İmanın şartları; İslâm'ın şartları | 4 |
| 2 | Namaza hazırlık | Abdestin farzları; Guslün farzları; Teyemmümün farzları; Abdest niyeti; Namazın farzları; Namaz niyeti; **Tekbir**; Sübhâneke | 5–6 |
| 3 | Kıyam, rükû ve secde | Fâtiha; İhlâs; **Kevser**; rükû tesbihi; tesmî-tahmîd; secde tesbihi | 6 |
| 4 | Oturuş ve selâm | Tahiyyât; Salli; Bârik; Rabbenâ âtinâ; Rabbenağfirlî; **Selâm** (+ kunut yedeği notu) | 6–8 |
| 5 | Namaz sûreleri I | Asr; **Fîl**; Nasr; Felak; Nâs | 5–6 |
| 6 | Namaz sûreleri II | Kureyş; Mâûn; Kâfirûn; Tebbet; İnşirâh | 5–6 |
| 7 | Vitir, tesbihat ve ezan | Kunut 1; Kunut 2; Âyetü'l-Kürsî; Tesbihat; Ezan; Kāmet; Ezan duası; Âmentü | 8 (–10) |

Toplam ≈ 40–48 hafta.

**Seçenek B — Diyanet sırasına daha yakın (Kunut öne; sûreler tek blok)**

| S | Ad | İçerik | Hafta |
|---|---|---|---|
| 1–4 | Seçenek A ile aynı | | 21–24 |
| 5 | Vitir ve Âmentü | Kunut 1; Kunut 2; Âmentü; Asr | 6–8 |
| 6 | Namaz sûreleri | Fîl; Kureyş; Mâûn; Kâfirûn; Nasr; Tebbet; Felak; Nâs (8 kısa sûre, 41 âyet) | 8 |
| 7 | Tesbihat ve ezan | Tesbihat; Âyetü'l-Kürsî; Ezan; Kāmet; Ezan duası | 6–8 |

İnşirâh Amme şeridine döner. Dayanak: Kunut'un vâcip oluşu (s. 249–251) ve bütün programlarda Fîl→Nâs'tan önce
gelmesi; Âmentü'nün Kunut'u izlemesi (2025 s. 11–12; 2026 KK-I; 11–14 s. 10).

### I.4 Amme şeridi için 5 durak (taslak sırası korunarak)

| Durak | Sûreler | Sûre | Âyet |
|---|---|---|---|
| 8.1 | Hümeze, Tekâsür, Kâria, Âdiyât, Zilzâl, Beyyine, Kadir, Alak, Tîn, Duhâ | 10 | 98 |
| 8.2 | Leyl, Şems, Beled, Fecr | 4 | 86 |
| 8.3 | Gâşiye, A'lâ, Târık, Burûc | 4 | 84 |
| 8.4 | İnşikâk, Mutaffifîn, İnfitâr, Tekvîr | 4 | 109 |
| 8.5 | Abese, Naziât, Nebe | 3 | 128 |

Durak 8.1 bitince (Asr S5'te, İnşirâh S6'da olduğu için) Diyanet'in ikinci basamağı (Duhâ–Hümeze) tamamlanmış olur.

### I.5 Kenar suyu önerileri
- **Rabbi yessir** eklenebilir (kenar suyu veya S1): 4–6 (s. 5/PDF 7), 7–10 (s. 11), Yaz (s. 13), Yatılı Yaz
  (s. 13) programlarında var. Kur'an metni değil; hadis kaynağı **doğrulanamadı** (geleneksel başlangıç duası).
- **Yemek duası:** Diyanet çekirdek listede veriyor (2026 KK-I; 2025 1. dönem; 7–10'da 5. sırada). Mevsimlik değil
  günlük olduğu için S1–S2'ye alınması düşünülebilir; kenar suyunda kalması da kaynağa aykırı değil.
- **Aşır üçlüsünün eksik iki parçası:** Âmene'r-Resûlü (Bakara 2/285–286) ve Haşr 59/22–24 bütün programlarda
  Âyetü'l-Kürsî'yi izliyor; taslakta yok. Kenar suyuna ya da S7 sonrası isteğe bağlı bir ek olarak konabilir
  (Namaz İlmihali 030: yatsıdan sonra / sabah ve akşamdan sonra okunur).
- **«Tekbir ve Salavât / Salât-ı Ümmiye»** (çocuk programları): metni programlarda yok, **doğrulanamadı**;
  eklenecekse önce metin doğrulanmalı.
- Ezan duası kenar suyuna taşınmamalı: günlük metindir (2026 KK-I; 7–10; 11–14).

### I.6 Kaynak farkları — karar gerekenler
1. **Sübhâneke «ve celle senâük»:** öneri, Temel Dinî Bilgiler modeli (cümle parantezde + «yalnız cenaze
   namazında» notu); ses kaydı seçilirken de buna bakılmalı.
2. **Ezan duasının sonu:** öneri, Buhârî metni esas; Elif-Bâ'daki son cümle «Beyhakî rivayetindeki ek» notuyla
   (ya da kitaptaki gibi bırakılıp not düşülür). Kāmetten sonra okunmaz (fetva 237).
3. **Rabbenâ âtinâ:** `kuranMetni:true` olduğundan metin âyetle bitmeli; «bi rahmetike…» ayrı, isteğe bağlı ek.
4. **Rabbenağfirlî:** Elif-Bâ gibi yalnız 14/41 (İlmihal'in 14/40–41 çiftinden «Rabbic'alnî» kısmı alınmaz).
5. **Haşr 21–24 mü 22–24 mü:** 2026 programları 21–24; 2025, 2010, 4–6 ve «son üç âyet» diyen bütün çocuk
   programları 22–24. Öneri 22–24 (çoğunluk + Namaz İlmihali 030).
6. **Teyemmüm 2 / 3 farz:** «32 farz» sayımında 2 (Sözlük s. 534), açıklamada İlmihal s. 209'daki üç unsur.
7. **Abdest farzlarının ifadesi:** İlmihal s. 197 ifadesi (Sözlük'teki «Elleri ve yüzü yıkamak» değil).
8. **Meâlle kıraat:** İlmihal s. 243 (Hanefî: öğreninceye kadar kendi dilinde okunabilir) ↔ Namaz İlmihali
   (`009-i-namazin-farzlari.md`: «Namazda Kur'ân'ın mealini okumak geçersizdir.»). Fransızca konuşan yeni
   Müslümanlar için önemli; hoca notu gerekli, karar hocanın ve Rıdvan'ın.
9. **Kıraat asgarisi:** s. 241 (kısa üç âyet / bir uzun âyet) ↔ s. 242 (bir âyet yeterli görülmüş); öğretimde
   s. 241 ölçüsü güvenli.
10. **Sûre adı yazımı:** tek ölçü olarak kuran.diyanet.gov.tr / Kur'an Yolu başlıkları; taslakta 4 fark (Nebe',
    İnşikāk, Mâûn, Nâziât — sonuncusu Kur'an Yolu metniyle uyumlu, başlığıyla değil).
11. **Kunut'un yeri:** Seçenek A (S7 + S4'te yedek) ya da Seçenek B (S5).
12. **İnşirâh:** S6'da mı, Amme şeridinde mi.
13. **Sitedeki seviye testi atfı:** `ezber.ts` ve `docs/SEVIYE-TESTI.md`'deki «Diyanet 2025 … ezber listesini
    izler» cümlesi düzeltilmeli (bkz. A.1).
14. **Müfredattaki «Elifbâ s. 32–33 / Amme Cüzü Satırları»** atfı düzeltilmeli (bkz. C.3).

### I.7 Doğrulanamayanlar
- «Tecvidli Elifba Kur'an Öğreniyorum» (2026 programlarının kaynağı) ile arşivdeki 2024 tarihli «Elifba Kur'an
  Öğreniyorum»un aynı kitap olup olmadığı.
- Çocuk programlarındaki «Tekbir ve Salavât / Salât-ı Ümmiye» maddesinin tam metni.
- «Rabbi yessir velâ tuassir, Rabbi temmim bi'l-hayr» duasının hadis kaynağı.
- Kenar suyundaki iki hadis seçkisinin içeriği (incelenmedi).
- Diyanet'in resmî bir «54 farz» listesi (arşivde yok).
- DİA «BESMELE» maddesinin arşivdeki metninde besmelenin Hanefî'ye göre hükmüne dair bölüm bulunamadı; yalnız
  Neml 27/30 atfı kullanıldı.
- Kursun gerçekten 2020 tarihli 15. baskıyı kullandığı, kursun kendi döküm dosyasından (`D:\ulu-camii-kuran-kursu\…\elifba\`)
  çıkarıldı; basılı kitap elde görülmedi.

---

## Kaynakça

**Resmî Diyanet öğretim programları (egitimhizmetleri.diyanet.gov.tr)**
- Dizinler: https://egitimhizmetleri.diyanet.gov.tr/sayfa/489 · https://egitimhizmetleri.diyanet.gov.tr/sayfa/1034
- Kur'an-ı Kerim ve Temel Dinî Bilgiler Öğretim Programı (2025): https://egitimhizmetleri.diyanet.gov.tr/Documents/Kur%27an-%C4%B1%20Kerim%20ve%20Temel%20Dini%20Bilgiler%20%C3%96%C4%9Fretim%20Program%C4%B1-2025.pdf
- İhtiyaç Odaklı Kur'an Kursları Temel Öğretim Programı (2026): https://egitimhizmetleri.diyanet.gov.tr/Documents/%C4%B0htiya%C3%A7%20Odakl%C4%B1%20Kur%27an%20Kurslar%C4%B1%20Temel%20%C3%96%C4%9Fretim%20Program%C4%B1-2026.pdf
- İhtiyaç Odaklı Kur'an Kursları Kısa Süreli Öğretim Programları (2026): https://egitimhizmetleri.diyanet.gov.tr/Documents/%C4%B0htiya%C3%A7%20Odakl%C4%B1%20Kur%27an%20Kurslar%C4%B1%20K%C4%B1sa%20S%C3%BCreli%20%C3%96%C4%9Fretim%20Programlar%C4%B1-2026.pdf
- Camilerde Kur'an Öğretim Programı (2010): https://egitimhizmetleri.diyanet.gov.tr/Documents/Camilerde%20Kur%27an%20%C3%96%C4%9Fretim%20Program%C4%B1%20-%202010.pdf
- Yatılı Yaz Kur'an Kursları Öğretim Programı (2024): https://egitimhizmetleri.diyanet.gov.tr/Documents/Yat%C4%B1l%C4%B1%20Yaz%20Kur%27an%20Kurslar%C4%B1%20%C3%96%C4%9Fretim%20Program%C4%B1-2024.pdf
- Yaz Kur'an Kursları Öğretim Programı (2024): https://egitimhizmetleri.diyanet.gov.tr/Documents/Yaz%20Kur%27an%20Kurslar%C4%B1%20%C3%96%C4%9Fretim%20Program%C4%B1-2024.pdf
- 7–10 Yaş Grubu Kur'an Kursları Öğretim Programı (2024): https://egitimhizmetleri.diyanet.gov.tr/Documents/7-10%20Ya%C5%9F%20Grubu%20Kur%27an%20Kurslar%C4%B1%20%C3%96%C4%9Fretim%20Program%C4%B1-2024.pdf
- 11–14 Yaş Grubu Kur'an Kursları Öğretim Programı (2025): https://egitimhizmetleri.diyanet.gov.tr/Documents/11-14%20Ya%C5%9F%20Grubu%20Kur%27an%20Kurslar%C4%B1%20%C3%96%C4%9Fretim%20Program%C4%B1-2025.pdf
- 4–6 Yaş Grubu Kur'an-ı Kerim Öğretim Programı (2023): https://egitimhizmetleri.diyanet.gov.tr/Documents/4-6%20Ya%C5%9F%20Grubu%20Kur%27an-%C4%B1%20Kerim%20%C3%96%C4%9Fretim%20Program%C4%B1-2023.pdf

**Yerel arşiv (`D:\ihtisas`, salt okunur)**
- Diyanet İlmihali c. 1: `D:\ihtisas\kaynaklar\diyanet-ilmihal\cilt-1\05-temizlik.md`, `06-namaz.md`, `07-oruc.md`, `09-hac-ve-umre.md`
- Namaz İlmihali (DİB Yay. 703): `D:\ihtisas\kaynaklar\diyanet-kitaplik\ilmihal-fikih\namaz-ilmihali\` (009, 027, 028, 029, 030, 031, 032)
- Temel Dinî Bilgiler (DİB Yay. 301): `D:\ihtisas\kaynaklar\diyanet-kitaplik\ilmihal-fikih\temel-dini-bilgiler\` (010, 011, 012, 013, 014, 033, 034)
- İslâm İlmihali (DİB): `D:\ihtisas\kaynaklar\diyanet-kitaplik\ilmihal-fikih\islam-ilmihali\010-iv-iman.md`, `018-viii-namaz.md`
- Dînî Kavramlar Sözlüğü (DİB): `D:\ihtisas\kaynaklar\dini-kavramlar-sozlugu\` (`a.md` s. 26, `h.md` s. 269, `o.md` s. 534, `t.md` s. 654, `ü.md` s. 668)
- DİYK: `D:\ihtisas\kaynaklar\diyk\yayinlar\fetvalar-2018-4-baski.md` (no. 237 s. 167; no. 815 s. 433); `D:\ihtisas\kaynaklar\diyk\fetvalar\namaz\namazdan-sonraki-tesbihatin-muezzin-esliginde-yapilmasinin.md`
- Elifba Kur'an Öğreniyorum (2024): `D:\ihtisas\kaynaklar\diyanet-kitaplik\kuran-kursu-kitapligi\elifba-kuran-ogreniyorum.md`
- Tecrîd-i Sarîh 2: `D:\ihtisas\kaynaklar\diyanet-kitaplik\hadis-ve-siyer\tecrid-i-sarih-2\011-kitabul-ezan.md`
- Din Görevlisi Rehberi: `D:\ihtisas\kaynaklar\diyanet-kitaplik\ilmihal-fikih\din-gorevlisi-rehberi\007-v-farkli-zamanlarda-yapilacak-dua-ornekleri.md`
- Hadislerle İslâm 6: `D:\ihtisas\kaynaklar\diyanet-kitaplik\hadis-ve-siyer\hadislerle-islam-6\025-hz-peygamberin-yemek-adabi-acikmadan-yemezdi-doyma.md`
- Kur'an Yolu: `D:\ihtisas\kaynaklar\kuran-yolu-tefsiri\078-nebe.md` … `114-nas.md`
- DİA (arşiv aracı `dia_ara.py`): «İLMİHAL» c. 22 s. 139–141; «ÜLÜ'l-AZM» c. 42 s. 294–295; «İSTİÂZE» c. 23
  s. 318–319 (https://islamansiklopedisi.org.tr/istiaze); «KELİME-i TEVHİD» c. 25 s. 214–216; «BESMELE» c. 5 s. 529–540

**DİYK çevrim içi fetvalar**
- https://kurul.diyanet.gov.tr/tr/fetva/farz-namazlardan-sonra-estagfirullah-demenin-dayanagi-nedir/0193c42d-5714-7c91-9d1d-6e21d0d9dbf7
- https://kurul.diyanet.gov.tr/tr/fetva/namazdan-sonra-ayetul-kursi-okumanin-hukmu-nedir/0193c42d-573d-7ae1-3467-823cf13b7af2

**Kurs ve proje dosyaları (salt okunur)**
- Kursun Elif-Bâ'sı: Rıdvan’ın yerel Elif-Bâ PDF’i; döküm `D:\ulu-camii-kuran-kursu\veri\kitaplar\elifba\30-namaz-dualari.md`
- Taslak katalog: `D:\tmp\ulucamii-ezber-kilimi\src\data\ezber\katalog.json`; `docs/EZBER-KILIMI.md`
- Müfredat/yıllık plan: `docs/kuran-kursu-mufredati-2026-2027.md`, `docs/kuran-kursu-yillik-plan-ozetli-2026-2027.md`
- Seviye testi: `src/lib/seviye-testi/sorular/ezber.ts`, `docs/SEVIYE-TESTI.md`
