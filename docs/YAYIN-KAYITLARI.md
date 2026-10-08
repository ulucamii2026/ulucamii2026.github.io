# Web yayını kayıtları

Kalıcı kural: [AGENTS.md](../AGENTS.md). Tarihler Europe/Brussels saat dilimindedir.
Kayıtlar içerik yayınının kanıtıdır; sırf kayıt güncelleyen belge commit'i yeni içerik yayını değildir.
Kaynak proje: `D:/ulu-camii-kuran-kursu`; kurs indeksi `belgeler/YAYIN-KAYITLARI.md`.

## 8 Ekim 2026 (2) — «Affetmek ve Öfkeyi Kontrol Etmek»: gece sahnesi yenilendi, danışma hatları çıkarıldı

- Zaman: 8 Ekim 2026 22:03 (commit + push) – 22:06:43 (deploy) – 22:07:47 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının aynı akşamki iki talebi: «gecenin affı» sahnesi için «biz müslümanlar evde ayakkabı ile gezmeyiz, ayrıca dua oturuşu biraz tuhaf olmuş, gereğini yap» ve «vaaz dışında danışma hattı numaraları vs. olmasın».
- Görsel: `gece-istigfar` sahnesi Higgsfield Nano Banana Pro 2K'da sınırsız haktan yeniden üretildi (4 bakış açısı, kredi düşmedi; 3. sürüm seçildi). Yeni sahnede adam çoraplı, ortamda ayakkabı yok; seccadede topukları üzerinde oturuyor (teşehhüd oturuşu), avuçları göğüs hizasında açık ve bitişik, başında takke var. Alt metin buna göre güncellendi. Diğer 14 sahnenin WebP dosyaları bayt bayt aynı kaldı.
- Danışma hatları: web'deki «Güvenlik önce gelir» kutusu (dört numara ve `tel:` bağlantıları), kaynakçadaki «Belçika yardım hatları» satırı ve bu kutunun stilleri (`vz-guvenlik`, `vz-hatlar`) kaldırıldı. Word/PDF kürsü nüshasının 8. sayfasındaki aynı kutu da çıkarıldı ve nüsha yeniden üretildi (14 sayfa, 14 yer imi, `SpellingErrors` 0, başlıklar 2–14. sayfalarda). Vaazın kendi cümlesi («yardım hatlarına, uzmanlara ve hukukî yollara başvurmak … emaneti korumaktır») yerinde kaldı. Ön bilgide kelime sayısı 3.290 → 3.260.
- Değişen yollar (8 dosya): `public/media/vaazlar/affetmek-ve-ofkeyi-kontrol-etmek/gece-istigfar-{240,480,960,1600}.webp`, `public/vaazlar/affetmek-ve-ofkeyi-kontrol-etmek.{docx,pdf}`, `src/content/vaazlar/affetmek-ve-ofkeyi-kontrol-etmek.md`, `src/styles/vaaz-sahne.css`.
- İçerik commit'i `9651e13` (push `973b0d4..9651e13`; ayrı çalışma ağacı `D:/tmp/ulucamii-vaaz-gece-20261008`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37836661110> — **success** (build + deploy).
- Yerel doğrulama: `astro check` 0 hata / 0 uyarı; `npm run design:check` geçti; `npm run build` 1908 sayfa. `web_kontrol.mjs` yerel ve canlı: 6 görünüm taşmasız, axe 0 ihlal, 26 görsel, 21 nass, 7 söz, 5 adım; sayfa gövdesinde `tel:` bağlantısı ve danışma hattı numarası 0 (denetime yeni kural olarak eklendi); 63/63 dosya SHA-256 eşit; 4 komşu sayfa 200.
- Canlı dosya özetleri: `.docx` (383.931 B) `2b8cfada8d523e1c262a8e12da75b697ebebdb0c1af0063137a829e5f43e3247`; `.pdf` (4.848.318 B) `9ed761f26bdd5c558b7cd89c4c9f903351b8bcf56fedf737e6c730fb5d64eb78`; `gece-istigfar-1600.webp` `b6ffde27d8f7157e499bba7edb6a7773d8a4f6b2b9b292be7cfd96fd7259210c`.
- Sınırlar: GitHub Pages görselleri 10 dakika önbellekte tutar (`max-age=600`); sayfayı o sırada açmış olanlar eski sahneyi en çok 10 dakika görebilir. Bu kayıt commit'i ayrı belge commit'idir.

## 8 Ekim 2026 — «Affetmek ve Öfkeyi Kontrol Etmek» vaazı (9 Ekim Cuma) ve bağımsız vz-* vaaz sahnesi

- Zaman: 8 Ekim 2026 21:19:33 (commit) – ≈21:19:55 (push; Pages çalışması 21:19:58'de başladı) – 21:23:30 (deploy) – 21:24:29 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının 8 Ekim talimatı (vaazı mükemmelleştir, «önceki haftalarda yaptığımız gibi web sitemizde yayınlayalım», görsellerle süsle, Higgsfield kullan; «tamamen bağımsız yeni bir yapı geliştirebilirsin … bütün yetki ve karar sende»). Vaaz oturumunda yayın, vaaz-mukemmel §1.D istisnasıyla kullanıcının seçimiyle yapıldı.
- Kapsam: yeni ve ayrı sayfa [/tr/vaaz/affetmek-ve-ofkeyi-kontrol-etmek/](https://ulucamii.be/tr/vaaz/affetmek-ve-ofkeyi-kontrol-etmek/) (kategori `ahlak`, 3.290 kelime). Eski `affetmek-ve-ofkeyi-yutmak` ve `-2` sayfaları olduğu gibi kaldı. Künyede yalnız «Kürsü İmam-Hatibi»; taslak sahibine atıf yok (kullanıcı kararı). Hatip notları web'e alınmadı.
- Değişen yollar (66 dosya, +659 satır): `src/content/vaazlar/affetmek-ve-ofkeyi-kontrol-etmek.md`, `src/styles/vaaz-sahne.css` (yeni), `src/pages/[lang]/vaaz/[slug].astro` (tek satır stil import'u), `public/vaazlar/affetmek-ve-ofkeyi-kontrol-etmek.{docx,pdf}`, `public/media/vaazlar/affetmek-ve-ofkeyi-kontrol-etmek/` (15 sahne × 240/480/960/1600 WebP = 60 + `kapak-og.webp` 1200×630).
- Yeni yapı (`vz-*`, geçen haftaların `vaaz-gorseller.css` sınıflarından bağımsız; markdown içinde düz HTML, JavaScript yok): açılış sahnesi, «dört ana fikir», 11 duraklı görselli «vaazın yolculuğu» haritası, bölüm sahneleri + numaralı rozetli başlıklar, 21 âyet/hadis/dua kartı (tür, konu, Arapça `lang="ar"`, meal, künye), dört kavram kartı, Âl-i İmrân 134 üç basamağı, «iki meşru yol» terazisi, güvenlik notu (Belçika danışma hatları; aynı akşam kullanıcı kararıyla kaldırıldı, bkz. 8 Ekim (2)), kalpler arası mesafe şeması, beş adımlı nebevî reçete, gurbet durum satırları, temsilî hikâye kutuları, «küslük üç günü geçmesin» çizelgesi, yedi söz kartı (PDF 13. sayfaya bağlantı), hatim duası ve klavyeyle açılan kaynakça. Açık/koyu tema, ≤640 ve ≤380 px düzeni, azaltılmış hareket ve yazdırma düzeni var.
  Ders: sayfanın kapsamlı kuralları (`.vaaz-govde[data-astro-cid-…] ul/h3` = 0,2,1) aynı özgüllükteki bileşen kurallarını ezdi (liste girintileri, ara başlıklar). Bütün `vz-*` seçicileri `div.vaaz-govde` önekiyle (0,2,2+) yazıldı; yeni bileşen eklenirken bu önek korunmalı.
- Görseller: 15 temsilî sahne Higgsfield Nano Banana Pro 2K ile üretildi (16 kredi + 14 üretim etkin sınırsız haktan, satın alma yok); tarihî mekân sahnelerinde kişi yok, peygamber/sahâbe tasviri yok. Tarifler ve rötuşlar kaynak klasörde `gorseller/URETIM-TARIFLERI.json`.
- İçerik commit'i `9c905ae` (push `2d12806..9c905ae`; ayrı çalışma ağacı `D:/tmp/ulucamii-vaaz-20261009`, dal `vaaz/affetmek-20261009`; ana ağaçtaki başka oturumların commit'lenmemiş işlerine dokunulmadı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37831140834> — **success** (build + deploy).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run design:check` geçti (yalnız önceden var olan yinelenen medya uyarıları); `npx astro build` 1908 sayfa. `npm run dogrula:codex` zinciri `test:ihtida` adımında ortam hatasıyla durdu (varsayılan `py` yorumlayıcısında `pymupdf` yok; vaazla ilgisiz, Python ortamına dokunulmadı); zincirin geri kalanı (`test:kayit` … `test:ekran`) ve `test:web` (817 test) tek tek çalıştırıldı, hepsi geçti. Son CSS düzeltmesinden sonra `check`, `design:check`, derleme ve sayfa denetimi yeniden çalıştırıldı.
- Sayfa denetimi (`web_kontrol.mjs`, yerel ve canlı aynı sonuç): 1440 açık/koyu, 768, 390 açık/koyu, 320 → yatay taşma yok, JS hatası yok, 26 görsel yüklü (harita küçük resimleri `alt=""`, diğerleri açıklamalı, hepsi `srcset`), 11 harita bağlantısı hedefli ve ≥44 px, 21 nass kartı, etiketsiz Arapça 0, 7 söz, 5 adım, 4 yardım hattı, hatip notu 0, yasak sözcük (kişi adları, kurum adı, «irşat ve vaaz») 0; klavyeyle `#yedi-soz` çapası ve «Vaazın bölümlerine dön»; axe WCAG 2.1 AA 0 ihlal (kaynakça açıkken); betik kapalıyken `#hatim-duasi` geçişi; og:image 1200×630.
- Canlı doğrulama: [TR](https://ulucamii.be/tr/vaaz/affetmek-ve-ofkeyi-kontrol-etmek/), [FR](https://ulucamii.be/fr/vaaz/affetmek-ve-ofkeyi-kontrol-etmek/), `/tr/vaazlar/`, `/tr/vaaz/gurbette-cami/`, `/tr/vaaz/affetmek-ve-ofkeyi-yutmak/` 200. 63/63 dosya (2 indirme + 61 WebP, 10,35 MB) canlıdan indirildi, SHA-256 yerel dosyayla eşit.
  `affetmek-ve-ofkeyi-kontrol-etmek.docx` (384.246 B): `0052b67604beae932e783b0256a772fa4e3800a258a9858ae5423dccee78975d`; `.pdf` (4.854.493 B): `4bc1f2f5c7905b78d75785f804c6ca4b4be2ec39b00a6743543c614ef36cf4bd`; `kapak-og.webp`: `e56b154e25732b57b6a058da90dddbaa9bebac9ecc5e7647789d87493fa1f58a`.
- Kaynak ve kanıt: `D:/hutbeler ve vaazlar/kaynak-affetmek-20261009/` (`YAYIN-VE-KALITE.md`, `web/web_uret.py`, `web/web_kontrol.mjs`, `web/kontrol/` ekran görüntüleri ve JSON). vaaz-mukemmel skill'i §7 tablosuna satır eklendi.
- Sınırlar: FR/EN çevirisi yok: FR adresi önceki vaazlarda olduğu gibi «Les sermons sont actuellement disponibles uniquement en turc» notunu ve Türkçe sayfaya bağlantıyı gösterir (canlıda doğrulandı). Sosyal ağ önizlemesi (WhatsApp/Facebook kartı) gerçek paylaşımla denenmedi. Görsel inceleme 1440 ve 390 px açık/koyu tam sayfa görüntüleriyle yapıldı; gerçek telefon cihazında denenmedi. Bu kayıt commit'i ayrı belge commit'idir; asıl içerik yayını yukarıdaki SHA/run'dır.

## 7 Ekim 2026 (4) — 17–19 Ekim kurs materyalleri (19 Ekim sonbahar tatili ilâve Pazartesi dahil)

- Zaman: 7 Ekim 2026 13:35:43–13:36:20 (Release yüklemesi) – 13:36:37 (push) – 13:39:16 (deploy) – 13:47 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının 7 Ekim talimatı («bütün yetki ve onay sende, full otonom ilerle»); üretim ve yayın aynı oturum zincirinden yapıldı.
- Kapsam: yalnız `src/data/ders-materyalleri.json` (12 → 15 gün; başka satır değişmedi). 17 Ekim Lâmelif + Fâtiha 5–7 ezber, İtikat tekrar, İbadet «Dua ve şükür»; 18 Ekim Hemze + Fâtiha pekiştirme, Siyer «Peygamberler», Ahlak «Dostluk ve kardeşlik»; 19 Ekim Üstün + tekrar köşesi, İtikat «Melekler ve kader», İbadet tekrar. Her gün: Word planı PDF'i, 3 öğrenci + 3 öğretici sunumu (pptx + PDF), hızlı başlangıç eki.
- Release `ders-2026-10-17` (14 dosya, 27,7 MB), `ders-2026-10-18` (14 dosya, 30,7 MB), `ders-2026-10-19` (14 dosya, 26,4 MB), `site-materyal-yayinla.py` ile dernek hesabından; indirme adları tarihli (`2026-10-17-Sunum-1-Kuran-i-Kerim.pptx`). Önce `--yukleme-yok` ile JSON yazıldı ve derlendi, sonra tam çalıştırma (JSON değişmedi) ve hemen push.
- İçerik commit'i `ed099ee` (push `94da5dc..ed099ee`; ayrı çalışma ağacı `D:/tmp/ulucamii-kurs-20261017-19`, ana ağaçtaki başka oturumun commit'lenmemiş işlerine dokunulmadı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37615243188> — **success** (build + deploy).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1903 sayfa; `npm run denetim` çıkış 0 (yalnız önceden var olan iki «orta» bulgu). `dist`'te TR/FR/EN sayfada üç günün kartı birer kez, 14'er tarihli bağlantı; din görevlisi numarası metin olarak 0 dosya (yalnız izinli `wa.me` bağlantısı ve WhatsApp düğmesinin `data-whatsapp` özniteliği).
  ⚠️ `npx astro build` tek başına başarısız olur (`ekran-sw-damgasi` kancası `/ekran/ekran.css`'i bulamaz); `npm run build` önce `scripts/ekran-derle.mjs` çalıştırır — yayın öncesi derlemede `npm run build` kullanılmalı.
- Canlı doğrulama: [TR](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-17), [FR](https://ulucamii.be/fr/supports-de-cours/), [EN](https://ulucamii.be/en/lesson-materials/) 200; her sayfada `g-2026-10-17`, `g-2026-10-18`, `g-2026-10-19` birer kez ve 14'er bağlantı. 42/42 canlı indirme SHA-256 yerel arşivle eşit; 42/42 Release `digest` eşit; 36/36 yerel OneDrive eşit.
- Yayın öncesi kapılar: öğrenci sunumlarında `sunum-denetle.py` 0 bulgu; `denetim.py --sert` 17 ve 19 TEMİZ, 18 İHLAL 0 · UYARI 1 (bilinen 17,5 pt FR satırı); COM yerleşim 18/18 temiz; 90 gömülü oyun geçti; kişisel veri taraması (PPTX metni, sunucu notları, PDF'ler) telefon/e-posta/hoca adı/öğrenci tam adı 0.
- Kaynak rapor: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-10-17-19.md`. Kurs yayın indeksi ve DEVAM aynı oturumda güncellendi.
- Sınırlar: fiziksel projeksiyon/hoparlör ve gerçek fare tıklamasıyla gösteri denenmedi (COM tetik/yerleşim doğrulandı); OneDrive bulut eşitlemesi doğrulanmadı. Bu kayıt commit'i ayrı belge commit'idir; asıl içerik yayını yukarıdaki SHA/run'dır.

## 7 Ekim 2026 (3) — indirme adları tarihle başlıyor (12 gün, 138 dosya)

- Zaman: 7 Ekim 2026 10:14:09–10:16:16 (Release eklerinin yeniden adlandırılması) – 10:16:19 (push) – 10:18:59 (deploy) – 10:19:26 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının 7 Ekim isteği («dosyaların isminde hâlâ tarih yer almıyor … kullanıcı web sitemize girip dosyaları tek tek indirdiğinde indirilen dosyalar arasında herhangi bir karmaşa olmasın»).
- Kapsam: yalnız `src/data/ders-materyalleri.json` — 138 `dosya` + 138 `url` satırı, başka alan değişmedi. İndirme adı artık `YYYY-AA-GG-<ad>`: `2026-10-10-Sunum-1-Kuran-i-Kerim.pptx`, `2026-10-10-Ders-Plani.pdf` (eski `Ders-Plani-2026-10-10.pdf`; tarih ikinci kez yazılmaz), `2026-10-10-Ogretici-Sunum-1-….pdf`, `2026-10-10-Derse-Hizli-Baslangic.pdf`. Sayfa bileşenleri yalnız `url` kullandığı için kod değişmedi.
- Yöntem: kurs projesindeki `scripts/site-materyal-yayinla.py` artık yayın adını `yayin_adi()` ile üretir. Sürümde eski tarihsiz adla duran dosyanın GitHub `digest` değeri yereldekiyle aynıysa `PATCH releases/assets/{id}` ile yerinde yeniden adlandırılır (yükleme yok), farklıysa silinip tarihli adla yüklenir. Bu yayında 138 dosya yeniden adlandırıldı, 0 yükleme, 0 silme. Atlama ölçütü artık ad + SHA-256 (eskiden ad + boyut + yükleme tarihi).
- Sıra (kırık bağlantı süresini kısaltmak için): önce `--yukleme-yok` ile JSON yazıldı ve derlendi, commit'lendi; sonra tam çalıştırma ve hemen push. Eski adlı bağlantılar 10:14:09 ile 10:18:59 arasında (en çok ≈ 5 dk) 404 verdi.
- İçerik commit'i `b7144cb` (push `cd47d10..b7144cb`; ayrı çalışma ağacı `D:/tmp/ulucamii-tarihli-ad-20261007`, ana ağaçtaki başka oturumun commit'lenmemiş işlerine dokunulmadı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37592663743> — **success** (build + deploy).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1903 sayfa; `npm run denetim` çıkış 0 (yalnız önceden var olan iki «orta» bulgu). `dist`'te 138 farklı Release bağlantısı, tarihsiz 0; din görevlisi numarası 0 dosya. JSON dışında kaynakta (`src`, `docs`, `public`, `scripts`) eski adla doğrudan bağlantı yok.
- Canlı doğrulama: [TR](https://ulucamii.be/tr/ders-materyalleri/), [FR](https://ulucamii.be/fr/supports-de-cours/), [EN](https://ulucamii.be/en/lesson-materials/) 200; her sayfada 138 bağlantı, hepsi tarihli, din görevlisi numarası yok. 12 sürümde yalnız beklenen 138 tarihli ad var (fazla 0, eksik 0, tarihsiz 0); 138/138 `digest` yerel SHA-256 ile eşit; 138/138 bağlantı HEAD 200, boyut eşit ve `Content-Disposition: attachment; filename=<tarihli ad>` (tarayıcının kaydedeceği ad tarihli).
- Kaynak rapor: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-10-07-TARIHLI-DOSYA-ADLARI.md`. Kurs yayın indeksi ve DEVAM aynı oturumda güncellendi.
- Sınırlar: eski tarihsiz adlarla dışarıda paylaşılmış doğrudan dosya bağlantıları artık 404 verir (veli e-postaları dosyaya değil materyal sayfasına bağlandığı için etkilenmez). Arşiv (`dersler/`) ve OneDrive adları değişmedi. Bu kayıt commit'i ayrı belge commit'idir; asıl içerik yayını yukarıdaki SHA/run'dır.

## 7 Ekim 2026 (2) — ses seviyesi regülasyonu + eski oyun düğmesi onarımı (12 gün, geriye dönük)

- Zaman: 7 Ekim 2026 09:31–09:35 (Release yüklemesi) – 09:40 (push) – 09:43:04 (deploy) – 09:47 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının 7 Ekim açık talimatı («ses dosyalarının ses seviyelerinde de regülasyon yap … geriye dönük düzeltme yap paylaşılan materyallerde … bütün yetki ve karar sende»); yayın bu yüzden üretim oturumundan yapıldı.
- Kapsam: yalnız `src/data/ders-materyalleri.json` (45 dosya boyutu). Yayımlanmış 12 günün (5 Eylül – 11 Ekim) 36 öğrenci sunumu: her gömülü ses −16 LUFS çalma yüksekliğine getirildi (Diyanet hafız kaydı yalnız kazanç aldı), PowerPoint çalma düzeyi her seste %80. Önce hafız sesi anlatımdan 9–13 dB kısık duyuluyordu. Ayrıca 20, 26, 27 Eylül'de 10 oyun slaytının «Cevabı göster» düğmesi onarıldı ve bu 9 sunumun PDF'i yenilendi.
- İçerik commit'i `09a094a` (push `a6cb39d..09a094a`; ayrı çalışma ağacı `D:/tmp/ulucamii-ses-seviye-20261007`, ana ağaçtaki başka oturumun commit'lenmemiş işlerine dokunulmadı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37588764422> — **success** (build + deploy).
- Release'ler: `ders-2026-09-05` … `ders-2026-10-11` (12 etiket), 45 dosya yeniden yüklendi (36 pptx + 9 PDF), 93 dosya değişmediği için atlandı; toplam 138 dosya.
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1903 sayfa; `npm run denetim` çıkış 0 (yalnız önceden var olan iki «orta» bulgu). `dist`'te din görevlisi numarası 0 dosya.
- Canlı doğrulama: [TR](https://ulucamii.be/tr/ders-materyalleri/), [FR](https://ulucamii.be/fr/supports-de-cours/), [EN](https://ulucamii.be/en/lesson-materials/) 200; her sayfada 12 gün, 138 bağlantı, din görevlisi numarası yok. 138/138 Release dosyasının GitHub `digest` değeri yerel SHA-256 ile eşit; 138/138 bağlantı 200 ve boyut eşit; 30/30 dosya (20, 26, 27 Eylül + 10, 11 Ekim sunumları ve PDF'leri) canlıdan indirildi, SHA-256 eşit. OneDrive 84/84 yerel eşit.
- Yayın öncesi kapılar: `oyun-denetle.py` 89 gömülü oyun geçti; onarılan 9 sunumda `sunum-denetle.py` 0 bulgu, COM yerleşim 9/9 temiz, `denetim.py` öncesiyle birebir; yeni PDF'lerde kişisel veri taraması 0 bulgu.
- Kaynak rapor: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-10-07-SES-SEVIYESI.md`. Kurs yayın indeksi ve DEVAM aynı oturumda güncellendi.
- Sınırlar: sitenin kendi ses kütüphanesi (`public/media/ses`, 1596 dosya) da dengesiz (âyet medyan −19,3, sûre −21,2, elifbâ −14,1 LUFS) ama Diyanet kaynağına sha256 ile bağlı ve CI testli olduğu için bu yayında dokunulmadı; öneri: oynatıcıda dosya başına kazanç (WebAudio `GainNode`). Fiziksel sınıf cihazı ve gömülü YouTube sesi denetlenmedi. Bu kayıt commit'i ayrı belge commit'idir; asıl içerik yayını yukarıdaki SHA/run'dır.

## 7 Ekim 2026 — 10–11 Ekim kurs materyalleri (ezber dersi + kalıcı ezber köşesi)

- Zaman: 7 Ekim 2026 07:13 (Release) – 07:17 (push) – 07:19:51 (deploy) – 07:20 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının 7 Ekim sabahı açık yayın talimatı («bu materyalleri web sitesinde yayımla… bütün yetki ve karar sende»); bu yüzden yayın üretim oturumunda yapıldı.
- Kapsam: yalnız `src/data/ders-materyalleri.json` (12 gün). 10 Ekim Kur'an dersi baştan sona ezber dersi (Kilim 1. şerit + Fâtiha 1–4); 11 Ekim'den itibaren her Kur'an dersinin son 8–10 dakikası ezber köşesi. Her gün: Word planı (docx + PDF), 3 öğrenci + 3 öğretici sunumu (pptx + PDF), hızlı başlangıç eki.
- İçerik commit'i `dec8ad6a7c3d4f13d2bcbb9d3d2dd6431cc5b1ec` (push `4a47ea3..dec8ad6`; ayrı çalışma ağacı `D:/tmp/ulucamii-kurs-20261010-11`, ana ağaçtaki başka oturumun commit'lenmemiş işlerine dokunulmadı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37575545217> — **success** (build + deploy).
- Release `ders-2026-10-10` (14 dosya, 31,3 MB) ve `ders-2026-10-11` (14 dosya, 27,4 MB), `site-materyal-yayinla.py` ile dernek hesabından.
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1903 sayfa; `npm run denetim` çıkış 0 (yalnız önceden var olan iki «orta» bulgu). `dist`'te TR/FR/EN sayfada iki günün kartı ve 14'er bağlantı; din görevlisi numarası 0 dosya.
- Canlı doğrulama: [TR](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-10), [FR](https://ulucamii.be/fr/supports-de-cours/), [EN](https://ulucamii.be/en/lesson-materials/) 200; her sayfada `g-2026-10-10` ve `g-2026-10-11` birer kez, 14'er bağlantı; 10 Ekim kartı «Ezber dersi · İlk şerit ve Fâtiha». 28/28 indirme SHA-256 yerel dosyayla eşit; 24/24 yerel OneDrive eşit.
- Yayın öncesi kişisel veri taraması (PDF + PPTX metni, sunucu notları dahil): telefon, e-posta ve hoca adı bulgusu yok; ad kalıbı eşleşmeleri yalnız sıradan bir Türkçe sözcükteydi, kişisel veri değil.
- Karar: yıllık plan değişmediği için sitedeki yıllık plan gün kartı 10 Ekim'i hâlâ «Bitişmeyen Harfler» gösterir; plan elle düzenlenmez, materyal sayfası gerçek konuyu gösterir (kurs kuralı: harf konusu 11 Ekim tekrar dersine katıldı).
- Kaynak rapor: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-10-10-11-EZBER.md`. Kurs yayın indeksi ve DEVAM aynı oturumda güncellendi.
- Sınırlar: fiziksel projeksiyon/hoparlör ve gerçek fare tıklamasıyla gösteri denenmedi (COM tetik/yerleşim doğrulandı); 11 Ekim Ahlak «Kâbe'nin Yolları» ilahisi baştan sona insan tarafından dinlenmedi; OneDrive bulut eşitlemesi doğrulanmadı. Bu kayıt commit'i ayrı belge commit'idir; asıl içerik yayını yukarıdaki SHA/run'dır.

## 5 Ekim 2026 — /kitap/ gizli kitap paylaşım sayfası

- Zaman: 5 Ekim 2026 ≈ 00:21 (push) – 00:24 (deploy) – 00:35 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.**
  Dayanak: kullanıcının 4 Ekim gece isteği. Hoca portalındaki dört «Camiye Gidiyorum» PDF'i Müşavirlikten Vahi Bey bağlantıya tıklayarak, yazıdaki karekodla da (2026/23 sayılı yazının Ek-4'ü) indirebilmeli. Erişim yolu olarak kullanıcı «gizli paylaşım bağlantısı» seçeneğini seçti; portal hesabı açılmadı.
- Kapsam: `src/pages/kitap/index.astro` (yeni; noindex, tekDil), `src/scripts/kitap-paylasim.ts` (yeni), `src/data/kitap-paylasim.json` (yeni; AES-GCM sarmalı, açık anahtar yok), `src/scripts/hoca-kitaplari.ts` (isteğe bağlı ekran metni parametresi; hoca ekranının metni değişmedi), `tests/kitap-paylasim.test.mjs` + `package.json` `test:ogrenme`, `tests/web/kitap-paylasim.spec.mjs`, `docs/HOCA-KITAPLARI.md`, `docs/PROJE-HAFIZASI.md`.
- İçerik commit'i `2129ed8` (push `492612b..2129ed8`; ayrı çalışma ağacından, ana ağaçtaki başka oturumun commit'lenmemiş işlerine dokunulmadı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37239685170> — **success** (00:24:03).
- Yerel doğrulama:
  - `npm run check` 0 hata / 0 uyarı; `npm run build` ve `npm run denetim` temiz (yalnız önceden var olan iki «orta» bulgu); `dist/sitemap-0.xml`'de `/kitap/` 0.
  - `npm run test:ogrenme` 13/13 (3 yeni test); `kitap-paylasim.spec` 4/4 ve `hoca-kitaplari.spec` 2/2 (masaüstü + mobil); tam `npm run test:web` 805 geçti, 0 başarısız, 101 atlandı.
  - `dogrula` zincirinde `test:ihtida`'nın iki testi düştü: `py` başlatıcısı bu makinede pymupdf'siz bir yorumlayıcıya (`D:/app/Ihtisas2027/Python/…`) bağlı. Pymupdf'li Python314'e geçici yönlendirmeyle `test:ihtida` dahil zincirin atlanan 12 alt testi geçti. Ortam sorunu; bu değişiklikle ilgisi yok.
  - Gerçek paylaşım anahtarıyla dört kitap yerelde çözüldü; SHA-256 değerleri kaynak klasördeki `SHA256.txt` ile birebir.
- Canlı doğrulama:
  - `/kitap/` 200, `noindex, nofollow`; site haritasında yok; 25/25 şifreli parça erişilebilir (206).
  - Anahtarsız açılış «yok», yanlış anahtar «paylasim-anahtar» durumunu gösterdi; gerçek bağlantıyla 4 düğme çıktı.
  - FR2 (`cg2-fr-20260928`) Chromium'da indirildi (7 sn); SHA-256 `SHA256.txt` ile eşit. Betik Git dışı `.codex/kitap-paylasim-canli.mjs`; tarayıcı kapatıldı, indirilen dosya silindi.
- Açık sınırlar:
  - Bağlantıya ya da karekodun fotoğrafına sahip olan herkes indirebilir.
  - `--kapat` sayfayı kapatır, ama sarmal Git geçmişinde kalır; gerçek iptal kitap anahtarı yenilemesiyle olur.
  - Diğer üç kitap canlıda tarayıcıyla indirilmedi; parçaları canlıda erişilebilir ve aynı sarmalla yerelde birebir çözüldü.
  - Tam bağlantı ve paylaşım anahtarı yalnız Git dışı `.codex/kitap-paylasim-anahtar.json` içindedir.

## 3 Ekim 2026 (4) — vaaz revizyonu 4. parti: 12 vaaz + 6 vaazda hadis Arapçası

- Zaman: 3 Ekim 2026 ≈ 09:38 (push) – 09:42 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.** Yöntem 1. parti kaydıyla aynı. Codex modeli 08:49'dan beri kullanıcı kararıyla `gpt-6.1-sol`, efor high, Fast (`service_tier="priority"`); bu partinin metinleri çoğunlukla `gpt-6-astra`/xhigh ile yazıldı (`durustluk-en-buyuk-fazilettir` son turunu yeni modelle tamamladı), çizimlerin 10'u yeni modelle yapıldı.
- Kapsam (yeni, 12): `anne-ve-baba-hakki`, `bakara-suresi-177-ayet-baglaminda-iyilik-nedir`, `batil-inanc-ve-hurafelerden-sakinma`, `berat-kandili-ve-tevbe`, `camilerin-maddi-ve-manevi-imari`, `camilerin-maddi-ve-manevi-imari-2`, `camilerin-maddi-ve-manevi-imari-3`, `cennete-giden-yollar-salih-ameller`, `cocuklarimizi-severek-ve-egiterek-buyutelim`, `dil-kultur-ve-kimlik`, `dinin-diregi-namaz`, `durustluk-en-buyuk-fazilettir`. Her biri 13 bölüm, 14 sayfalık Word/PDF, 2–3 SVG çizim + paylaşım kartı.
- Kapsam (düzeltme, 6): daha önce yayımlanan vaazlarda doğrudan alıntı yapılan 8 hadisin boş kalan Arapça lafzı yerel hadis derlemesinden birebir eklendi (`dogrula.py` artık Arapçasız hadisi uyarı olarak gösteriyor): `adab-i-muaseret-gorgu-kurallari` (Tirmizî 2002), `adab-ve-erkaniyla-cuma-namazi` (Müslim 865, Buhârî 935, Müslim 233c; 14 sayfaya sığması için s.11–12'den iki paragraf ve iki cümle çıkarıldı), `ahlak-ve-istikamet-dogruluk-ve-durustluk` (Buhârî 2079), `aile-en-guvenli-yuvamiz-2` (Müslim 1437a), `aile-insanin-dunyadaki-cenneti` (Tirmizî 3895), `akrabalik-iliskileri` (Tirmizî 658; s.8'den iki cümle ve tekrar eden kapanış cümlesi çıkarıldı). Anlam özeti verilen rivayetler Arapçasız kaldı (doğrudan alıntı değil).
- İçerik commit'i `d963bdb` (push `53dfa90..d963bdb`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37106967156> — **success** (09:40:43).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1902 sayfa; Playwright `tests/web/vaazlar.spec.mjs` 6/6; `dist`'te din görevlisi telefonu 0.
- Canlı doğrulama: 18 sayfa 200, her birinde 13 bölüm başlığı, og `kapak-og.webp`, din görevlisi telefonu 0; 36 indirme SHA-256 yerel kopyayla eşit; 68 medya dosyası 200 ve içerik eşit; cuma sayfasında eklenen Arapça lafız canlıda görünüyor. Ayrıntı: `D:/vaaz-revizyon/rapor/canli-parti4.txt`.
- Açık sınırlar: toplam 33/146 vaaz yenilendi; kalanlar sonraki partilerde.

## 3 Ekim 2026 (3) — vaaz revizyonu 3. parti: 6 vaaz

- Zaman: 3 Ekim 2026 ≈ 08:45 (kullanıcının «3. partiyi yayınla» talimatı) – 09:05 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.** Yöntem 1. parti kaydıyla aynı; bu altı vaaz `gpt-6-astra`/xhigh ile yazıldı ve çizildi (Codex modeli 08:49'da kullanıcı kararıyla `gpt-6.1-sol`, high, Fast katmanına geçti; bu partiye etkisi yok).
- Kapsam: `aile-en-guvenli-yuvamiz` («Evimiz Bir Sığınak Olsun: Canı ve Gönlü Korumak»), `aileyi-ayakta-tutan-degerler` («Zor Günlerde Aile: Sabır, Şükür ve Geçim Ahlakı»), `akrabalik-iliskileri` («Sıla-i Rahim: Uzakta da Akraba Kalabilmek»), `allah-in-rizasi-anne-babanin-rizasindadir` («Anne Baba Rızası: İyilikte İtaat, İnançta Sadakat»), `allah-yolunda-malla-ve-canla-mucadele` («Allah Yolunda Gayret: Malımızla, Vaktimizle, Bütün Varlığımızla»), `anne-baba-cennetin-iki-kapisi` («Anne Babamız Yaşlanırken: Bakımda Sabır, Ayrılıkta Vefa»). Kardeş vaazlarla ortak kıssa/hadisler hedefli yeniden yazımla ayrıştırıldı (Ebû Talha → akrabalık; Hz. Ömer'in Hayber vakfı → Allah yolunda; Esmâ hadisi → anne baba rızası; aile vaazında Ebû Dâvûd 4843, Arapçası sunnah.com'dan doğrulanarak eklendi). Her biri 13 bölüm, 14 sayfalık Word/PDF, 3 SVG çizim + paylaşım kartı.
- İçerik commit'i `b8bad67` (push `1f48aee..b8bad67`; push öncesi `git fetch`, deponun otomatik bakımı (repack) bitene kadar beklediği için sonlandırıldı, push bakım kapalı yapıldı). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37104874657> — **success** (09:02:55).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1902 sayfa; Playwright `tests/web/vaazlar.spec.mjs` 6/6; `dist`'te din görevlisi telefonu 0.
- Canlı doğrulama: 6 sayfa 200, her birinde 13 bölüm başlığı, og `kapak-og.webp`, din görevlisi telefonu 0; 12 indirme SHA-256 yerel kopyayla eşit; 24 medya dosyası 200 ve içerik eşit. Ayrıntı: `D:/vaaz-revizyon/rapor/canli-parti3.txt`.
- Açık sınırlar: toplam 21/146 vaaz yayında; kalanlar sonraki partilerde.

## 3 Ekim 2026 (2) — vaaz revizyonu 2. parti: 4 vaaz

- Zaman: 3 Ekim 2026 ≈ 05:45 (push) – 05:48 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.** Dayanak ve yöntem: aşağıdaki 1. parti kaydıyla aynı (Codex yazar/çizer, Claude editör; `D:/vaaz-revizyon/`).
- Kapsam: `ahirete-iman` («Âhiretin Durakları: Son Nefesten Ebedî Hayata»), `aile-en-guvenli-yuvamiz-2` («Ailede Sözün Emaneti: Dinlemek, Danışmak, Anlaşmak»), `aile-insanin-dunyadaki-cenneti` («Nikâhın Emaneti: Eş Olmak, Sevmek ve Vefa Göstermek»), `aile-toplumun-temeli` («Aileden Topluma: Nesilleri Birlikte Gözetmek»). Aile kümesi vaazları ortak delil denetiminden sonra ayrı açılara yeniden yazıldı. Her biri 13 bölüm, 14 sayfalık Word/PDF, 3 SVG çizim + paylaşım kartı. Şablon değişikliği yok.
- İçerik commit'i `7be2904` (push `fefd490..7be2904`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37094212732> — **success** (05:46:56).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1902 sayfa; Playwright `tests/web/vaazlar.spec.mjs` 6/6; `dist`'te din görevlisi telefonu 0.
- Canlı doğrulama: 4 sayfa 200, her birinde 13 bölüm başlığı, og `kapak-og.webp`, din görevlisi telefonu 0; 8 indirme SHA-256 yerel kopyayla eşit; 16 medya dosyası 200 ve içerik eşit. Ayrıntı: `D:/vaaz-revizyon/rapor/canli-parti2.txt`.
- Açık sınırlar: 05:38'de Claude Code, makinede bellek kritik düzeye düştüğü için yazım ve çizim kuyruklarını durdurdu; kuyruklar kullanıcı onayıyla daha düşük eşzamanlılıkla yeniden başlatılacak. Kalan vaazlar sonraki partilerde.

## 3 Ekim 2026 — vaaz revizyonu 1. parti: 11 vaaz v4 standardında yenilendi

- Zaman: 3 Ekim 2026 ≈ 05:20 (push) – 05:24 (canlı doğrulama), Europe/Brussels. **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının «web sitemizde yayınladığımız bütün vaazları codex cli kullanarak revize et … kontrol ve yetki sende … full otonom ilerle» hedefi ve «son haftalarda yayınlanan vaazlardan daha da kaliteli» isteği; bu oturum yayın oturumu olarak yürütülüyor.
- Yöntem: metinleri Codex CLI (`gpt-6-astra`, xhigh) yazdı ve çizdi; Claude editör olarak her vaazı okudu, kardeş vaazlarla delil/kıssa çakışmasını denetledi, gerekirse hedefli yeniden yazım yaptırdı ve onayladı. Bağlayıcı ölçü `D:/vaaz-revizyon/STANDART.md` (v4, §2a hitabet), otomatik kapı `araclar/dogrula.py`; Word 14 sayfa Word COM ile ölçüldü. Üretim hattı ve editör notları depo dışında: `D:/vaaz-revizyon/` (`rapor/inceleme.md`, `rapor/NOTLAR.md`).
- Kapsam (11 vaaz; her biri web metni 13 bölüm, 14 sayfalık Word/PDF, 2–3 özgün SVG çizim ve kapaktan üretilmiş 1200×630 WebP paylaşım kartı): `kadere-iman-ve-tevekkul`, `vatan-sevgisi-imandandir`, `abdest-ve-gusul`, `adab-i-muaseret-gorgu-kurallari`, `adab-ve-erkaniyla-cuma-namazi`, `ahiret-inanci`, `ahiret-yolcusuna-son-gorevlerimiz`, `affetmek-ve-ofkeyi-yutmak`, `affetmek-ve-ofkeyi-yutmak-2`, `ahlak-ve-istikamet-dogruluk-ve-durustluk`, `ramazan-ayi-ve-kur-an` (yeni).
- Kaldırılan: `the-month-of-ramadan-and-the-qur-an` (İngilizce makine çevirisi vaaz; `.md`, `.docx`, `.pdf`). Beş dildeki eski adres `astro.config.mjs` yönlendirmesiyle `/…/vaaz/ramazan-ayi-ve-kur-an/`'a gider.
- Şablon: `src/content.config.ts` (vaazlar şemasına isteğe bağlı `kapak`, `kapakAlt`), `src/pages/[lang]/vaaz/[slug].astro` (Türkçe sayfanın og görseli kapak kartı), `src/styles/vaaz-gorseller.css` (şiir, alıntı, SVG oranı). Uygulama tablolarında başlık yalnız figcaption'da görünür; tabloya `aria-label` verilir (çift başlık giderildi).
- İçerik commit'i `3fa26323f461f2546b2d91afb34eabf66a5a565e` (82 dosya; push `c591e08..3fa2632`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37092881202> — build + deploy **success** (05:22:37).
- Yerel doğrulama: `npm run check` 0 hata / 0 uyarı; `npm run build` 1902 sayfa; Playwright `tests/web/vaazlar.spec.mjs` 6/6; geçici erişilebilirlik denetimi (commit edilmedi, silindi) 3 vaaz × 2 görünüm: 13 bölüm başlığı, bütün SVG'ler 200/`image/svg+xml`, axe WCAG 2.1 AA ihlali 0, yatay taşma 0, JS hatası 0; `dist`'te din görevlisi telefonu 0.
- Canlı doğrulama: 11 sayfa 200, her birinde 13 bölüm başlığı, og görseli `kapak-og.webp`, din görevlisi telefonu 0; 22 indirme (docx+pdf) SHA-256 yerel kopyayla eşit; 39 medya dosyası 200 ve içerik eşit; beş dildeki eski Ramazan adresi 200 + meta refresh doğru hedefe; eski PDF 404; `/tr/vaazlar/` listesinde yeni vaaz var, eskisi yok. Ayrıntı: `D:/vaaz-revizyon/rapor/canli-parti1.txt`.
- Açık sınırlar: kalan ≈135 vaaz partiler hâlinde aynı hatla yenilenecek; her parti ayrı kayıtla. Fransızca/İngilizce sayfalar Türkçe vaaza dil uyarısıyla bağlanır (çeviri yok). Hadis numaraları Codex tarafından `D:/ihtisas` arşivi ve sunnah.com ile doğrulandı, editör örneklem denetimi yaptı; her atıf tek tek insan gözüyle sınanmadı.

## 2 Ekim 2026 — 3–4 Ekim kurs materyalleri ve öğrenciye özel veli bilgilendirmesi

- Zaman: 2026-10-02T20:17:48.337681+02:00, Europe/Brussels. Kullanıcının açık yayın ve ayrı öğrenci e-postası talimatı.
- Kapsam: `src/data/ders-materyalleri.json`; iki günün plan, öğrenci/öğretici sunumları, PDF ve yeni hızlı başlangıç rehberleri. Eski oyun yönergeleri, siyer anlatımları ve 8 ses kaydı düzeltildi. Öğrenci/veli verisi Git’e alınmadı.
- İçerik commit’i `e841a5c4e80fd6d834ced7d796108d56815244fd`; [Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37044999440) **success**. Release `ders-2026-10-03` ve `ders-2026-10-04`, 14’er dosya. Yükleme → push → deploy → canlı doğrulama tamamlandı.
- Canlı [TR](https://ulucamii.be/tr/ders-materyalleri/), [FR](https://ulucamii.be/fr/supports-de-cours/), [EN](https://ulucamii.be/en/lesson-materials/) 200. 28/28 indirme SHA-256 eşit; 24/24 yerel OneDrive eşit.
- Kalite: `npm run dogrula:codex` bütün kapılar geçti; nihai metadata sonrası ek build/denetim geçti. Materyal denetimleri temiz; 12 PPTX/276 slayt COM taşma 0, 8 oyun tetikleri doğru, 138 ses hash’i eşit; PDF görsel inceleme yapıldı.
- İletişim: 21 öğrenci için 21 ayrı mesaj (13 TR/8 FR); 21/21 kurum Bcc kopyası teyitli. Bu, alıcının okuma teyidi değildir.
- Kaynak rapor: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-10-02-HAFTASONU.md`; teknik kanıtlar `D:/ulu-camii-kuran-kursu/scratchpad/haftasonu-2026-10-03-04/`. Kurs yayın indeksi ve DEVAM aynı oturumda güncellendi.
- Sınırlar: fiziksel projeksiyon/hoparlör ve gerçek fare tıklaması denenmedi; COM zamanlama/yerleşim doğrulandı. Videolarda otomatik içerik incelemesi kullanıldı. OneDrive bulut eşitlemesi doğrulanmadı. Bu kayıt commit’i ayrı belge commit’idir; asıl içerik yayını yukarıdaki SHA/run’dır.

## 30 Eylül 2026 (2) — iki otomasyon deneme ihtida başvurusunun canlıdan silinmesi (IH-2026-0004, IH-2026-0005)

- Zaman: 30 Eylül 2026 ≈10:07–10:13 (Europe/Brussels). Durum: **canlı veri temizliği tamamlandı ve doğrulandı**; site/GAS kodu yayını yok, `/exec` dağıtımı değişmedi (sürüm 41). Dayanak: kullanıcının «admin panelinde hâlâ iki test kaydı gözüküyor… yok et, test kaydı kalmasın» talimatı.
- Hedefler: IH-2026-0004 («TEST OTOMASYON - Gerçek başvuru değildir», 09.09.2026 08:18) ve IH-2026-0005 («TEST V27 - Gerçek başvuru değildir», 09.09.2026 10:23); ikisi de dernek altyapı adresiyle gönderilmişti. Gerçek başvuru IH-2026-0003 ile IH-2026-0001/0002'ye dokunulmadı.
- Yöntem: 29 Eylül'deki araç (`~/.claude/skills/ulucamii-site/scripts/ihtida-basvuru-sil/`, depo dışı), hedefler ve beklenen sürüm (41) güncellendi; yerel sahte sınama geçti. Editör kaynağı v41 dağıtımında yeniden okunan kopyayla birebir aynıydı → yedek `D:/tmp/gas/ihtida-sil-oncesi-20260930-100749.gs`. KURU: satır 5 ve 6, her ref için 7 beklenen dosya, beklenmeyen dosya/kuyruk özelliği/iç defter kaydı yok. GERÇEK: 14 dosya `silindi-deneme-2026-09-30 ` önekiyle yeniden adlandırılıp çöpe (30 gün geri alınabilir), satırlar silindi. Geçici fonksiyon kaldırıldı; editör kaynağı işlem öncesiyle birebir aynı.
- Bağımsız doğrulama: `?islem=liste` → ihtida 5 → 3 satır, «TEST» adlı satır 0; kayıt 25, seviye 3 değişmedi; `ihtida-paket-durum` IH-2026-0004/0005 için `null`; `ihtida-defteri` `guncel`, IH-2026-0001…0003; sağlık `surum:41`.
- 1 Ekim 2026 tekrar kontrolü: sağlık sürüm 42 (envanter yayını); ihtida 3, kayıt 25, seviye 3; iç defter güncel ve IH-2026-0001…0003; IH-2026-0004 için paket yok. Bu kontrol yeni kayıt, e-posta veya dağıtım oluşturmadı.
- 1 Ekim 2026 belge tamamlama: kullanıcı onayıyla yerel dal güncellendi; bu temizlik kaydı, ihtida işletme notu ve Apps Script README canlı v42/örnek önizleme kararıyla eşlendi. `npm run dogrula:codex` çıkış 0: Node 576/576, 0 başarısız; ana site 796 geçti / 96 atlandı; eğitim 46 geçti / 2 atlandı. Belge commit’i `[skip ci]`; uygulama veya GAS yayını değildir.
- Açık sınırlar: (1) En büyük numara artık IH-2026-0003 → **bir sonraki gerçek başvuru `IH-2026-0004` alır** (aşağıdaki kaydın «IH-2026-0006» beklentisinin yerine geçer); v41'in çöpteki aynı ref dosyalarını atlaması o başvuruda canlı olarak ilk kez sınanır. (2) Deneme e-postaları info@, imam@ ve ulucamii2026@gmail.com kutularında duruyor; bu temizlik onları silmez.

## 30 Eylül 2026 — silinen ihtida numarasının yeniden verilmesi: eski dosyalar karışmasın (Apps Script v41)

- Zaman: 29 Eylül 2026 ≈ 23:15 (deneme başvurularının silinmesi) – 30 Eylül 2026 ≈ 07:37 (Europe/Brussels). Durum: **GAS canlıda, depo yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının «bugün girilen son iki ihtida başvurusu test için yapıldı… kontrol ettikten sonra sil» talimatı (29 Eylül) ve «düzeltmeleri canlıya al» onayı (30 Eylül). Silme sırasında bulunan hata dar kapsamda düzeltildi.
- **A. Deneme başvurularının canlıdan silinmesi (29 Eylül gecesi):** IH-2026-0006 (15:39) ve IH-2026-0007 (15:48). Canlı GAS'ta tek başvuruyu silen uç olmadığı için editöre geçici bir fonksiyon eklendi; önce KURU çalıştı (satır 7 ve 8, 6 + 7 dosya listelendi), sonra gerçek silme yapıldı ve fonksiyon geri kaldırıldı (editör kaynağı işlem öncesiyle birebir aynı; `/exec` dağıtımı değişmedi). Korumalar: ad + e-posta + zaman parmak izi, beklenmeyen ref adlı dosya/işlenen paket/defter numarası varsa durma, defter tablosu asla hedef değil. Sonuç: defter 7 → 5 satır (kayıt 25, seviye 3 değişmedi); 13 Drive dosyası `silindi-deneme-2026-09-29 ` önekiyle yeniden adlandırılıp çöpe (30 gün geri alınabilir); `IHTIDA_PAKET_IS_IH-2026-0007` özelliği silindi; iç defter yeniden üretildi (IH-2026-0001…0003). Araç: `~/.claude/skills/ulucamii-site/scripts/ihtida-basvuru-sil/` (depo dışı). Bağımsız doğrulama: `?islem=liste`, `ihtida-paket-durum` (iki ref için `paket:null`), `ihtida-defteri`.
- **B. Hata düzeltmesi (v41):** `referansMaxBul` defterdeki en büyük numara + 1 verdiği için son satırlar silinince aynı `IH-YYYY-NNNN` sonraki başvuruya yeniden verilir. Drive `getFilesByName` çöptekileri de döndürdüğünden (1) `ihtidaGorselleriOku` çöpteki eski deneme görselini okuyabiliyor, (2) `ihtidaPaketIsDosyasi` çöpteki eski «tamam» iş dosyasının arkasında yeni işi göremeyebiliyordu; (3) `test-temizle` bir IH- satırını silerken görselleri, iş dosyasını, paket PDF'ini ve kuyruk özelliğini bırakıyordu. Artık ilk ikisi ada birebir eşleşen ve çöpte olmayan dosyayı seçer; üçüncüsü `ihtidaRefIzleriniCopeAt` ile aynı ref'in izlerini kaldırır. Başka davranış değişmedi.
- Değişen yollar: `scripts/apps-script/ulucamii-Kod-v40.gs` → `ulucamii-Kod-v41.gs` (`git mv`), `scripts/apps-script/ihtida-paket-isleri.gs`, `scripts/apps-script/README.md`, `scripts/apps-script/veli-mail-listesi.gs` (yorum), `scripts/ihtida-gas-derle.mjs`, `scripts/pdf-onizleme.mjs`, `tests/ihtida-paket-akis.test.mjs` (iki yeni test: eski kodla kırmızı, yeniyle yeşil), sürüm/yol güncellenen 10 test, `docs/IHTIDA-OTOMASYON-v25.md`, `docs/KAYIT-ZORUNLU-BELGELER.md`.
- Apps Script **v41** (önce GAS, sonra depo): `GAS_HEADLESS=1 py -3.14 D:/tmp/gas/dagit_v41.py`. `--kuru` okumasında canlı kaynak v40 dağıtımında yeniden okunan kopyayla ve silme öncesi yedekle birebir aynıydı (8 494 361 karakter) → `v41-oncesi-dogrulanmis.gs`. Paket 8 642 135 bayt, SHA-256 `23d2140839febf4b…212478b2b`; yeniden okunan kod paketle birebir aynı; «Nouvelle version» ile ≈07:32'de **sürüm 41 canlıda** (önceki dağıtım: Google sürüm 54, 23 Eylül 14:44). Sağlık GET: `surum:41`, `basvuruSiniri/kayitKimlik/kayitImza/kayitBelgeleriZorunlu/kayitDuzelt/defterCeviri/ihtidaPaketHazir/ihtidaDefteriHazir/ihtidaCamiSecimi/seviyeTesti:true`. Dağıtım öncesi ve sonrası salt okunur temel karşılaştırması: bayraklar, satır sayıları (ihtida 5 · kayıt 25 · seviye 3), paket durumları ve iç defter **aynı**.
- İçerik commit'i `07db9ab` (19 dosya; push `c47dbc5..07db9ab`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36674014581> — build + deploy **success** (05:36 UTC).
- Yerel doğrulama: `npm run dogrula:codex` çıkış 0 — `npm run check` 0 hata / 0 uyarı (394 dosya); node testleri 558 geçti / 0 kaldı (`test:ihtida`, `test:kayit`, `test:duzelt`, `test:gas-ceviri`, `test:seviye`, `test:kimlik`, `test:veli-eposta` dâhil); Playwright `test:web` 778 geçti / 96 atlandı; eğitim platformu 46 geçti / 2 atlandı. Site denetimi 1905 sayfa / 2892 iç bağlantı. İlk koşu `test:web` yerine `build` adımında düştü: kilit dosyasındaki `@fontsource/scheherazade-new`, `@fontsource/noto-naskh-arabic`, `fontkit` bu makinede kurulu değildi (`ekran-derle` ENOENT); `npm install` ile kuruldu, `package.json`/kilit dosyası değişmedi, ikinci koşu temiz.
- Canlı doğrulama: `/tr/`, `/tr/ihtida-basvurusu/`, `/fr/demande-de-conversion/`, `/kayit/`, `/hoca/` 200; kök `/` dil yönlendirmesi (meta refresh `/tr/`); Apps Script sağlık `surum:41`.
- Açık sınırlar: (1) v41 düzeltmesi yerel sahte Drive/Sheets testleriyle sınandı; gerçek başvurunun belge ve görselleri henüz gözlemlenmedi. IH-2026-0004/0005 de 30 Eylül yaklaşık 10:10'da silindiğinden sonraki gerçek başvuru için beklenen numara artık `IH-2026-0004` (yukarıdaki ikinci temizlik kaydı). (2) Başvuru/Drive temizliği e-posta kopyalarını silmez. (3) IH-2026-0001/0002 bu işlemlerin hedefi değildir. (4) Çöpteki dosyaların saklama süresi 30 gündür.

## 29 Eylül 2026 (2) — cami ekranı levhası: iç kenar boşluğu ve Kur'an satırında durak işareti payı

- Zaman: 29 Eylül 2026 ≈ 11:40–12:25 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının «iki küçük görünüm sorununu düzelt» talimatı (aynı günkü TV denetiminde görülen iki kusur).
- Kapsam: `src/ekran/slaytlar.ts` — sığdırma, slayt alanının yanında içindeki slaytın taşmasını da ölçer (alanın kaydırma boyu kendi alt boşluğuna taşanı görmüyordu; 214 gerçek slaytın 172'si alt kenara dayanıyordu); Kur'an yüzünde durak işaretlerinin satır kutusundan taşan mürekkep yükselişi canvas ile ölçülüp üst dolgu (em) olarak verilir. `src/ekran/ekran.css` — ölçüm yapılamayan tarayıcı için `.3em` sabit pay. `tests/web/ekran.spec.mjs` — iki yeni test (iki satırlık kaynaklı Kur'an duası; Şems 91/9-10), taban kapısı ve Cuma testi iç taşmayı da denetler; kalibrasyon, ayetler FR'siz yayımlandığı sürece ayet profilini FR'siz ölçer.
- İçerik commit'i `e38d665`. Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36549867509> — **success**.
- Testler: `npm run check` 0 hata / 0 uyarı; `npm run dogrula` çıkış 0 (`test:ekran` 147 / 0); Playwright `tests/web/ekran.spec.mjs` masaüstü 90 geçti / 3 atlandı. Onaylı 214 slayt 1280×720 yatayda: sığmayan 0, iç taşma 0, en küçük ölçek 1,070. Kalibrasyon: tüm profillerde f ≥ 1,058, bütçeler değişmedi.
- Canlı doğrulama: `/ekran/` 200; canlı `ekran.js` yeni ölçümü taşıyor; Polaroid TV YENILE sonrası düzeltilmiş levhayı gösteriyor.
- Açık sınırlar: ayetlere FR meâli eklenirse kalibrasyon yeniden çalıştırılmalı (ayet profili o zaman FR'li ölçülür).

## 29 Eylül 2026 — cami ekranı: sağ alt levha, duyurular ve onaylı manevi içerik (A alt projesi)

- Zaman: 29 Eylül 2026 10:55–11:10 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının «bütün karar ve yetki sende, full otonom ilerle» talimatı (plan ve spec: ekran A alt projesi); dinî içerik kullanıcının onay sayfasında 204 kaydı tek tek onaylamasıyla (`durum: imam-onayli`, `onayTarihi: 2026-09-29`) yayına girdi.
- Kapsam (kod, `b2ab968`…`4b3582e`): sağ alt panelde tek ölçekli, ortalı «levha» — iki yönlü sığdırma araması, karakter bütçeleri (kalibre edildi), sığmayan slaydı atlama ve tur sonunda yeniden kurma; günün ayeti, hadisi, duası ve Esmâ-i Hüsnâ levhaları; duyurularda ekran başlığı, 90/180 karakter kuralı (TR ve FR ayrı slayt), afişli duyuruda sağ sütun sınırı; Kur'an için Scheherazade New, Arapça metin için Noto Naskh Arabic (OFL, `/ekran/fonts/`), glif kapsama kapısı; yol haritası `docs/EKRAN-YOL-HARITASI.md`.
- Kapsam (içerik, `4642560`): `src/data/ekran/` — 40 ayet (Diyanet mushafı + Kur'an Yolu Meali; Fransızca yok), 25 hadis (DİB «Hadislerle İslam»; Fransızca DİB «40 Hadis» kitapçıkları), 40 dua (Kur'an ve hadis duaları), 99 Esmâ-i Hüsnâ. Hadis duaları ile Esmâ'nın Fransızcası resmî karşılık olmadığı için hazırlanmış çeviridir ve onaylandı.
- Deploy: kod <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36545784188> — **success** (10:57:22); içerik <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36546394016> — **success** (11:04:03).
- Testler (her iki push öncesi): `npm run check` 0 hata / 0 uyarı; `npm run dogrula` çıkış 0 (`test:ekran` 147 geçti / 0 kaldı); Playwright `tests/web/ekran.spec.mjs` masaüstü 88 geçti / 3 atlandı (koşullu). İlk push'ta derlenen `icerik.json` yalnız sitedeki 10 onaylı hadisi taşıdı (taslak sızmadı). Onaylı içerikle bütçe kalibrasyonu: tüm profillerde f ≥ 1,058, bütçeler değişmedi.
- Canlı doğrulama: `/ekran/` 200; `/ekran/akis.json` `ayar.turHedefSn` var; `/ekran/icerik.json` ayet 40 · hadis 35 · dua 40 · Esmâ 99 · eksik 0.
- Açık sınırlar: TV üzerinde görsel denetim ayrı yapılacak; ayetlerin Fransızcası basılı meâlden sonra eklenebilir.

## 24 Eylül 2026 (3) — kod yorumlarındaki kişi adı kaldırıldı

- Zaman: 24 Eylül 2026 23:15–23:27 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının «tamam devam et» onayı (bir önceki kaydın «açık sınırlar» bulgusu).
- Kapsam: `src/layouts/Base.astro` satır içi betik yorumu («… (Rıdvan'ınki dâhil)» → «(yöneticininki dâhil)») — derlenmiş 1889 sayfanın hepsinin kaynağında görünüyordu; `public/admin/panel.js` iki geliştirici yorumu («Rıdvan bildirdi» → «yönetici bildirdi»). Davranış değişikliği yok (`node --check` geçti).
- Bilerek dokunulmayanlar: ihtida formu metinlerindeki şahit adı (imam, şahit olarak), teşekkür duyuruları ve müfredattaki «Rıdvan meleği» — bunlar bile bile konmuş içeriktir.
- İçerik commit'i `cfb853e`. Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36061274105> — **success** (23:26:31).
- Doğrulama: `npx astro build` 1890 sayfa; `dist`'te iki ifadeden 0 eşleşme; canlıda `/tr/`, `/tr/vaaz/gurbette-komsuluk/`, `/admin/panel.js` 0 eşleşme.

## 24 Eylül 2026 (2) — «Gurbette Komşuluk» vaazı (25 Eylül Cuma) yayımlandı

- Zaman: 24 Eylül 2026 ≈ 22:40 (istek) – 23:02 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının vaaz oturumundaki açık talimatı («web sitemizde bu vaazı yayınla»; vaaz skill'inin «yayın ayrı oturumda» kuralı hatırlatıldı, kullanıcı «bu oturumda yayınla, notları bütün oturumların görebileceği yerlere yaz» dedi).
- Kapsam: `vaazlar` koleksiyonuna yeni vaaz — web okuma sayfası + indirilebilir Word/PDF (14 sayfa, Avrupa Kürsü Vaaz ve İrşat Rehberi biçimi). Kategori `toplum`, ~3 300 kelime. Kürsü nüshasındaki künye/zamanlama/kavram tabloları ve «hatip notu» kutuları web sayfasına alınmadı.
- Değişen dosyalar: `src/content/vaazlar/gurbette-komsuluk.md`, `public/vaazlar/gurbette-komsuluk.{docx,pdf}`. Üretim: `~/.claude/skills/vaaz-mukemmel/scripts/{ornek_komsuluk.py, vaaz_lib.py}`; Markdown `scripts/docx_to_md.py` ile docx'ten türetildi (elle yazılmadı).
- İçerik commit'i `97f52ff` (push `0216ef4..97f52ff`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36058544951> — **success** (23:01:44).
- Canlı doğrulama: `https://ulucamii.be/tr/vaaz/gurbette-komsuluk/` 200; `/vaazlar/gurbette-komsuluk.docx` 61 991 B ve `.pdf` 4 750 456 B, SHA-256 yerel kopyayla eşit; `/tr/vaazlar/` listesinde görünüyor.
- Testler: `npm run check` 0 hata / 0 uyarı; `npx astro build` 1890 sayfa; derlenmiş sayfada imam telefonu 0; 390 ve 1280 px'te yatay taşma 0 (Playwright). Word belgesinde metinli 480 run'ın hepsi dil etiketli (tr-TR/ar-SA), PDF'te raster görsel 0.
- Tam zincir: `npm run dogrula` 25 Eylül 2026 ≈ 00:05'te sonradan koşturuldu — çıkış 0; 1890 sayfa derlendi, site denetimi 1899 sayfa / 2892 iç bağlantı temiz, node testleri 181 geçti / 0 kaldı.
- Açık sınırlar: Hadis atıfları araştırma ajanıyla doğrulandı; Kurtubî V/188, Kur'an Yolu II/65-66 ve Ebû Dâvûd Et'ime 9 kullanıcının özgün metninden aynen alındı. Ek bulgu (bu yayından bağımsız): site genelindeki bir satır içi yorum her sayfada kullanıcının adını içeriyor («animasyon efektleri… (Rıdvan'ınki dâhil)») — aynı gece (3) numaralı kayıtla temizlendi.

## 24 Eylül 2026 — Kur'an kursu müfredatı ders kitaplarına göre yenilendi (26 Eylül'den itibaren)

- Zaman: 24 Eylül 2026 ≈ 20:05 (istek) – 20:35 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının yeni yıllık planı onaylayıp «web sitesindeki sunumlar, müfredat, her şey güncellensin» demesi (kurs üretim oturumundan, kullanıcının açık isteğiyle).
- Kapsam: yıllık plan (İtikat/İbadet/Siyer/Ahlak Camiye Gidiyorum 1-2 + Temel Dinî Bilgiler sayfalarına göre, Kur'an satırı Elifbâ sayfası; 87 gün / 261 ders), müfredat sayfası + bağımsız HTML + PDF (43 → 41 s.) + MD, hoca ekranı ders defteri verisi (261 konu/kaynak, 89 dersin hedef/etkinliği), 84 yeni başlığın FR/EN sözlüğü, 26-27 Eyl ve 3-4 Eki sunumlarının kapakta kitap/sayfa satırlı yeni sürümleri.
- Değişen dosyalar: `src/data/{yillik-plan-2026-2027.json, mufredat-2026-2027.html, mufredat-meta.json, ders-defteri-2026-2027.json, konular-fr.json, konular-en.json, ders-konu-fr.ts, ders-materyalleri.json}`, `public/belgeler/kuran-kursu/{mufredat-2026-2027.html, Ulu-Camii-Kuran-Kursu-Mufredat-2026-2027.pdf}`, `docs/kuran-kursu-{mufredati,yillik-plan-ozetli}-2026-2027.md`. Üretici: `D:/app/marche-cami-sitesi/mufredat/` (`revizyon-uygula.py` yeni; `yillik-plan-cikar.py` artık `indent=1` yazar).
- İçerik commit'i `a4b802b` (push `41eddc0..a4b802b`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36041808956> — **success** (20:33).
- Release: `ders-2026-09-26`, `-09-27`, `-10-03`, `-10-04` — her birine 12 dosya (1'i güncel, atlandı). Canlı indirme: 24/24 sunum dosyası SHA-256 eşit; müfredat PDF'i canlı = yerel (611 028 B). Kayıt formu eki: Apps Script `mufredat-yukle` → Drive kopyası 611 028 B (`mufredat-sina` doğruladı).
- Testler: `npm run check` 0 hata; `npm run dogrula` geçti; `mufredat-test.py` 52/57 (kalan 5 kaydırma testi canlıda da aynı, önceden var; sabit «43 sayfa» kontrolü `mufredat-meta.json`'dan okunur hâle getirildi). OneDrive: 28/28 dosya eşit.
- Açık sınırlar: öğrenci defterleri yeniden üretilmedi; hoca ekranı `sayfa` +4 kayması bu yayında ele alınmadı. Ayrıntı: kurs projesi `belgeler/YAYIN-RAPORU-2026-09-24-MUFREDAT-REVIZYONU.md`.

## 23 Eylül 2026 (2) — hoca portalındaki Camiye Gidiyorum kitapları A4 baskı sürümleriyle yenilendi

- Zaman: 23 Eylül 2026 21:55 (istek) – 22:12 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («hoca portalındaki kitapları güncelle bu dosyadaki en güncel versiyonları ile, eskileri at gitsin»).
- Kapsam: `/hoca/ → Ders kitapları` bölümündeki dört PDF, kullanıcının teslim klasöründeki (`Downloads/Camiye Gidiyorum/Güncel Kitaplar`, 22–23 Eylül A4 ev yazıcısı baskı hazırlığı; klasördeki `BASKI_NOTLARI.md` + `SHA256.txt`) sürümlerle değiştirildi: TR1 228 s. / 87 384 744 B (eski 227 s.), FR1 228 s. / 97 003 740 B, TR2 270 s. / 119 001 909 B, FR2 270 s. / 69 277 461 B. Kaynak özetleri klasördeki `SHA256.txt` ile birebir. Kimlikler `…-20260921` → `…-20260923`; eski 21 şifreli parça silindi, 25 yeni AES-256-GCM parçası ve her kitap için yeni bağımsız anahtar üretildi. Açık PDF, anahtar ve kişisel veri Git'e girmedi. Mekanizma, Firestore kuralı ve hoca rolü değişmedi ([HOCA-KITAPLARI.md](HOCA-KITAPLARI.md)).
- Değişen dosyalar: `public/media/hoca-kitaplari/` (−21 / +25 `.bin`), `src/data/hoca-kitaplari.json`, `docs/HOCA-KITAPLARI.md`. Yardımcılar (Git dışı, `.codex/`): `kitap-yenile-20260923.py`, `kitap-yayin-20260923.py`, `kitap-tarayici.mjs`; eski anahtar dosyası `hoca-kitap-anahtarlar-eski-20260921.json` olarak yerelde yedeklendi, ardından 22:20'de kullanıcının «eski verileri temizle» talimatıyla 21 Eylül'e ait önizleme/ekran görüntüsü/günlük dosyalarıyla birlikte silindi (eski parçalar artık hiçbir anahtarla çözülemez).
- İçerik commit'i `48decb4` (32 dosya; push `e7d5a88..48decb4`, ≈356 MB). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35913987429> — build + deploy **success** (22:10:59). Yerel `dist` 744 MB (Pages 1 GB sınırının altında); GitHub depo boyutu yenileme öncesi ≈766 MB, sonrası ≈1,1 GB (eski parçalar geçmişte kalır; anahtarları silindiği için çözülemez).
- Yerel doğrulama: `.codex/kitap-yayin-20260923.py` dört kitabı parçalardan çözüp kaynak PDF özetiyle eşledi; `npm run test:ogrenme` 10/10; `npm run build` 1885 sayfa; `tests/web/hoca-kitaplari.spec.mjs` 2/2 (masaüstü + mobil, axe açık/koyu, taşma yok); önizlemeden (4401) gerçek tarayıcı indirmesi 4/4 SHA-256 eşleşti (`kitap-tarayici-sonuc-20260923.json`, ekran görüntüleri `.codex/kitaplar-{mobile,desktop}-20260923.png`).
- Firestore (dernek, `ayarlar/hocaKitaplari`): önce eski ∪ yeni 8 anahtar (sürüm 2, canlı site kesintisiz), yayın ve canlı doğrulama sonrası yalnız yeni 4 anahtar (sürüm 3); yazım sonrası geri okundu; oturumsuz erişim 401/403.
- Canlı doğrulama (22:11–22:14, `--canli`): 25 parça `https://ulucamii.be` üzerinden indirildi, dört PDF özeti eşleşti (`.codex/kitap-canli-20260923.log`); eski `…-20260921` parçaları canlıda yok (HEAD ≠ 200); `/hoca/` betiklerinde yalnız yeni kimlikler.
- Açık sınırlar: fiziksel cihazda hoca hesabıyla indirme denenmedi (aynı kod yolu Playwright ile doğrulandı). Kitap içeriği bu işte incelenmedi; `BASKI_NOTLARI.md`'deki «karar sizde olan küçük eklemeler» ve bilinen sınırlar kullanıcıya aittir. Depo her yenilemede ≈350 MB büyür; sık yenileme gerekirse parçalar için Release/ayrı depo düşünülmeli.
## 23 Eylül 2026 — kayıt ve ihtida uçlarına sunucu tarafı hacim sınırı (Apps Script v40)

- Zaman: 23 Eylül 2026 14:00–15:05 (Europe/Brussels, CEST). Durum: **GAS canlıda, site yayımlandı ve canlı doğrulandı.** Dayanak: koordinatörlük oturumundan gelen görev (herkese açık `kayit`/`ihtida` POST uçlarında sunucu tarafı hacim sınırı yoktu; bot defteri, Drive'ı ve Brevo kotasını doldurabilirdi).
- Kapsam: `AYAR_BASVURU_SINIRI` (tek yapılandırma, dosyanın başında): tür başına 10 dakikada 10 yeni kayıt → `cok-sik`; günde kayıt 60 / ihtida 20 → `gunluk-sinir`; aynı e-posta (küçük harf, kırpılmış) günde 3 → `eposta-gunluk-sinir`. Sayım `basvuruSinirKodu()` ile v2 defterindeki gerçek satırlardan (zaman damgası + e-posta sütunu), `LockService` kilidi içinde ve `gonderimAnahtari` tekrar denetiminden SONRA yapılır → yinelenen istek hiç engellenmez/sayılmaz. Tuzak alan `web` (formdaki görünmez alan) doluysa gövde doğrulamadan önce `bos-istek` ile reddedilir; gerçek istemci bu alanı zaten göndermez. `console.warn` satırlarında kişisel veri yok. Sağlık yanıtında `basvuruSiniri: true`. Başka davranış değişmedi.
- İstemci: `src/i18n/formlar/{tipler,tr,fr,en,nl,de}.ts` → `hata.yogunluk` (beş dil; «Bugün çok sayıda başvuru alındı… info@ulucamii.be»); `KayitFormu.astro` ve `IhtidaFormu.astro` üç kodu bu iletiye bağlar.
- Değişen yollar: `scripts/apps-script/ulucamii-Kod-v39.gs` → `ulucamii-Kod-v40.gs` (`git mv`, depo düzeni), `scripts/apps-script/README.md`, `scripts/apps-script/veli-mail-listesi.gs` (yorum), `scripts/ihtida-gas-derle.mjs`, `scripts/pdf-onizleme.mjs`, `package.json` (`test:kayit`), `tests/basvuru-siniri.test.mjs` (yeni, 13 sınama), sürüm/yol güncellenen 10 test, `docs/KAYIT-ZORUNLU-BELGELER.md`.
- Apps Script **v40** (önce GAS, sonra site): `D:/tmp/gas/dagit_v40.py`. `--kuru` okumasında canlı kaynak 21 Eylül v39 dağıtımında yeniden okunan kopyayla birebir aynıydı (8 490 265 karakter) → `v40-oncesi-dogrulanmis.gs`. Yeni paketin canlı v39'dan farkı yalnız bu değişiklik (63 satır). Paket 8 639 834 bayt, SHA-256 `512a607334552b79…febdcc53b`; yeniden okunan kod paketle birebir aynı; «Nouvelle version» ile 14:45'te **sürüm 40 canlıda**. Sağlık GET: `surum:40`, `basvuruSiniri:true`, `kayitKimlik/kayitImza/kayitBelgeleriZorunlu/kayitDuzelt/defterCeviri/ihtidaPaketHazir/ihtidaDefteriHazir/seviyeTesti:true`, `ceviriMotoru:gemini`, `seviyeBankaSurumu:1`. Canlı kayıt/ihtida uçlarına deneme başvurusu GÖNDERİLMEDİ.
- İçerik commit'i: `d9bd48b` (25 dosya). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35864015422> — build + deploy **success** (13:02 UTC).
- Yerel doğrulama: `npm run dogrula` çıkış 0 (build 1894 sayfa; `test:kayit` 23/23, `test:ihtida` 33/33, `test:duzelt` 6/6, `test:gas-ceviri` 6/6, `test:seviye` 51/51, `test:kimlik` 31/31 …); ayrıca `test:veli-eposta` 58/58; `npm run check` 0 hata 0 uyarı; `npm run test:web` Playwright **616/616**.
- Canlı doğrulama: `/kayit/`, `/kayit/fr/`, `/tr/ihtida-basvurusu/`, `/fr/demande-de-conversion/`, `/en/conversion-application/`, `/nl/aanvraag-bekering/`, `/de/antrag-konversion/` yeni hata kodlarını taşıyor; imam numarası metinde yok.
- Açık sınırlar: (1) aynı e-postayla günde 3 kayıt sınırı, dört ve daha çok çocuğunu aynı gün kaydeden bir veliyi durdurur — veli yerelleştirilmiş iletiyle info@ adresine yönlendirilir; gerekirse `AYAR_BASVURU_SINIRI.kayit.epostaGunlukSinir` artırılıp GAS yeniden dağıtılır. (2) Sınır, defterden silinen (ör. `test-temizle`) satırları saymaz. (3) Site denetimindeki «fr dilinde 73 sayfa eksik» orta bulgusu bu değişiklikten bağımsızdır (sayfa eklenip çıkarılmadı).

## 21 Eylül 2026 (11) — görünür besmele ve dinleme derslerinde hata avı

- Zaman: `2026-09-21T23:06:42+02:00` (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.**
- Kullanıcı: Asr'da âyetlerin üzerinde besmele hücresi ve diğer derslerde benzer hata avı.
- İlk içerik `7ca0e2e11ab78ba429011ff726bc3dec488b23a8` (9 dosya), son kaydırma
  düzeltmesi `6840174c3c16e0b2a13e0e03179160a19143263c` (3 dosya); toplam 9 farklı yol. İlk
  [deploy](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35654145461)
  22:58:28+02:00'da doğrulandı; ardından 372 sayfalık canlı kontrol geçti. Dernek kimliği `ulucamii2026` doğrulandı;
  pull --rebase, push ve [Pages yayını](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35654892416) başarılı. Release: 0; yeni ses/PDF: 0.
- Asr dâhil 13 sûre ve `e81/e85/e86` rehberli okumasında ayrı, numarasız, ortalı ve
  dokunulabilir besmele hücresi. Fâtiha ve `e76` içinde mevcut besmele çiftlenmiyor;
  âyet numaraları değişmedi. Beş dil, klavye, sıralı dinleme ve betiksiz ses erişimi çalışır.
  Dört rehberli sûre dersinde uzun âyetler tam genişlikte gösterilir.
- Âyetü’l-Kürsî hücresi yalnız Bakara 255 kaydını çalar; tam kayıt eûzü–besmele–âyet
  sırasını korur. Tekrar arası sırasında kip kapatıldığında bekleyen sesin yeniden
  başlaması düzeltildi. İlerleme çubuğu genişlik yerine transform ile güncellenir.
  Uzun hücrede ilk satırı sabit başlık arkasına bırakan kaydırma payı düzeltildi;
  yerelde ve canlıda başlık/ilk Arapça satır koordinatlarıyla doğrulandı.
- Kaynak üretici `motor/site-veri-uret.mjs` besmele/metinSesi alanlarını üretir.
  `icerik/web-okunus.json`, 7 dersteki önceki 11 web okunuş düzeltmesini korur.
  `--denetle`: 74 kod, 815 öge, site JSON'uyla birebir eşleşme; dosya yazmaz.
  Kaynak kitap metinleri/PDF'leri değiştirilmedi.
- Metin: 14 sûredeki 71 âyet güncel Diyanet mushafıyla karşılaştırıldı; NFC ve boşluk
  normalleştirmesi dışında Arapça metinler aynı (harekeler korunarak karşılaştırıldı).
  Kaynak örneği: [Asr mushafı](https://kuran.diyanet.gov.tr/mushaf/kuran-tefsir-1/asr-suresi-103/ayet-1/diyanet-isleri-baskanligi-meali-1).
- Ses: resmî Osman Şahin `1_1.mp3` ve `2_255.mp3` yeniden indirilip yerelle eşleştirildi.
  Besmele SHA-256 `ce2f8701f14fb41028cfe9fc92daac454d3657baf9ccc147857425cc58809145`;
  Bakara 255 `1d62b8de5e45bfd13f88319f26c665144eb2913d58fde75c1222b7d5e6d330d8`.
  `ecouter.json` SHA-256 `f358a4b940a9ff0066f5fc47e8243bd79c8a32ee4179590c019e19468d50c372`.
- Kalite: `npm run dogrula:codex` tüm aşamaları geçti; **614/614** tarayıcı, 42 güvenlik,
  58 veli e-postası, 14 otomatik kayıt, 10 öğrenme/kitap testi. Ses regresyonu **6/6**.
  Son tip kontrolü 0 hata/0 uyarı. Son görünüm ve kaydırma değişikliklerinden sonra build
  (1.885 sayfa) ve ilgili iki test dosyası **88/88** yeniden geçti. 485 eğitim iç bağlantısı sağlam.
  320 px açık/1280 px koyu temada 8 görünüm; metin ortalaması, taşma, gerçek ses çözümleme ve
  axe serious/critical kontrolü geçti. Görseller incelendi. Impeccable 0 bulgu;
  yeni bastırma yok. Önceki genel site denetiminin 2 orta/58 düşük kaydı kapsam dışıdır.
- Canlı: 372 eğitim/QR HTML sayfası ve 2 ses özeti doğrulandı. Beş dilde Asr tam kayıt,
  besmele ve ilk âyet gerçekten oynadı (15 oynatma); numaralar 1–2–3. Rehberli Kevser
  genişliği ve Âyetü’l-Kürsî hücresinin ses yolu ayrıca 320 px canlı tarayıcıda doğrulandı.
  URL'ler: https://ulucamii.be/tr/audio/asr/ · https://ulucamii.be/e/asr/ ·
  https://ulucamii.be/tr/muhtedi-egitimi/ . 74 basılı QR adresi korunuyor.
- Değişen yollar: `src/components/SesliDers.astro`, `src/data/ecouter.json`,
  `src/i18n/dinleme.ts`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`,
  `src/styles/ecouter.css`, `tests/ecouter-ses.test.mjs`, `tests/web/ecouter.spec.mjs`,
  `docs/DINLEME-SAYFALARI.md`. Yerel kanıtlar `.codex/besmele-denetim/`.
- Açık sınır: fiziksel iPhone/Safari testi ve bütün kayıtların baştan sona bağımsız
  insan dinleme denetimi yapılmadı. Bu tur mevcut resmî sesleri değiştirmedi.

## 21 Eylül 2026 (10) — sûre/dua ses düzeltmeleri ve hocaya özel kitap indirme

- Zaman: `2026-09-21T20:02:52+02:00` (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.**
- Kullanıcı: Asr'da besmele eksikliğinin ve benzer kusurların giderilmesi; Arapça metnin
  ortalanıp hücreye dokunarak dinlenmesi; dört güncel kitabın hoca portalından indirilmesi.
- İçerik commit'i `e2e14d0ceee038b55366939b0fb748af71c2d965`; 63 dosya. Dernek kimliği `ulucamii2026` doğrulandı;
  pull --rebase, push ve [Pages yayını](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35635411859) başarılı. Release: 0.
- Asr dâhil 13 sûrede besmele eksikti. Fâtiha ve Âyetü'l-Kürsî dâhil 15 tam kayıt resmî
  Osman Şahin âyetlerinden yeniden üretildi: eûzü → tek besmele → âyetler. Eski ham MP3
  birleştirmesinin başlık hataları PCM çözümleme/birleştirme/kodlamayla giderildi.
- Kunut 1'in son cümlesi eski 23,76 sn kesiminde Kunut 2'ye geçmişti; içerik ve sessizlik
  doğrulanarak sınır 29,4 sn yapıldı. Sabah ibaresi bulunan ezan metni resmî sabah ezanıyla
  eşleştirildi. Uzun ezan duasındaki iki ibare web metnine/okunuşuna/anlamına eklendi.
  Kamet için otomatik analizdeki 6 başlangıç tekbiri iddiası bağımsız dökümde doğrulanmadı
  (başta 4, sonda 2); resmî kayıt korunmuştur. Arapça TTS/üçüncü taraf ses kullanılmadı.
- Arapça hücre ortalı ve tamamı düğme; dokunma/Enter/Boşluk, etkin simge ve aria-pressed.
  Bölüm kaydı olmayan duanın bütün metni tek hücrede kendi tam sesine bağlanır. 74 basılı
  QR adresi ve 365 dil/ders yolu değişmedi. Önbellek sürümü 3, ezber odası da güncellendi.
- `/hoca/ → Ders kitapları`: dört PDF, 21 AES-256-GCM parçası; açık PDF veya anahtar Git'e
  girmedi. Yalnız `ayarlar/hocaKitaplari` özel belgesi yazıldı ve geri okunarak doğrulandı.
  Mevcut canlı Firestore kuralları yerelde sınananla birebir aynı; kural/rol değişikliği yok.
  Ziyaretçi, veli ve hoca rolü olmayan hesap erişimi reddedildi (emülatör); canlı oturumsuz
  anahtar okuma reddedildi. Tarayıcıda dört gerçek PDF indirilip kaynak özetiyle eşleştirildi.
  - `cg1-fr-20260921`: 228 sayfa, 119508776 bayt, SHA-256 `750d7a0759637e6d3dd32095d132d1f137babdc0e4ade9a95ef7f36436b5559a`.
  - `cg1-tr-20260921`: 227 sayfa, 47574147 bayt, SHA-256 `4814a8f6f3d9cd40fb121ab9df1b3d5c8772a9d1a31252507951c13a80c5a160`.
  - `cg2-fr-20260921`: 270 sayfa, 94836992 bayt, SHA-256 `d1e56722873195763d208194d0940df7208b9f883b6b2fdffc9ce77af083a969`.
  - `cg2-tr-20260921`: 270 sayfa, 63422630 bayt, SHA-256 `1f734c4dc409df102db2d0892a1d0c53a7780fea8b53876398b10d99772eff91`.
- Doğrulama: `npm run dogrula:codex` çalıştırıldı. İlk tam tarayıcı turu 588/592 geçti;
  dört başarısız beklenti eski ses sürümü ve eski sekme sırasıydı. Bunlar düzeltildi;
  ilgili dört dosyanın **80/80** testi yeniden geçti. Öğrenme testi dosya yolundaki sürüm
  parametresini ayıracak şekilde düzeltildi; **10/10** geçti. Kural **42/42**, veli e-postası
  **58/58**, otomatik kayıt **14/14**, son ses regresyonu **5/5**. Son tip kontrolü 0 hata/
  0 uyarı; son derleme 1.885 sayfa; site denetiminde yeni kritik hata yok. Önceden var olan
  2 orta/58 düşük bilgi kaydı bu işte genişletilmedi. Değişen arayüzde Impeccable 0 bulgu;
  bastırma eklenmedi. 485 eğitim iç bağlantısı ve 18 dış Diyanet PDF bağlantısı sağlam.
- Ses kanıtı: 26/26 tam kayıt ffmpeg `-xerror` kontrolünden geçti; 26/26 canlı MP3 yerel
  SHA-256 ile eşleşti. Asr, Fâtiha, İhlâs ve düzeltilen dualar için ayrı ses dökümleri
  incelendi; kaynak, sıra, PCM ve MP3 özetleri `docs/dinleme-ses-kaynaklari.json` içindedir.
- Canlı: 374 HTML + 3 önceki varlık kontrolü; beş dilde gerçek tarayıcı Asr tam ses/âyet
  hücresi oynadı, hizalama doğru ve yatay taşma yok. Dört kitabın 21 canlı parçası indirilip
  çözülünce kaynak PDF'lerin tüm SHA-256 değerleri eşleşti. Kampanya PDF'si ve özel imzalı
  tutanak önceki özetleriyle aynı; yeni kişisel belge yayımlanmadı.
- Değişen yollar: `src/components/SesliDers.astro`, `src/styles/ecouter.css`,
  `src/data/{ecouter,hoca-kitaplari}.json`, `src/i18n/dinleme.ts`, `src/lib/ezber-verisi.ts`,
  `src/scripts/{hoca-ekrani,hoca-kitaplari}.ts`, `scripts/sure-ses-uret.py`,
  `public/media/ses/{sureler,ayet,dualar}`, `public/media/hoca-kitaplari`, `package.json`,
  ilgili 7 test dosyası ve `docs/{DINLEME-SAYFALARI,OGRENCI-MODU-PORTAL,HOCA-KITAPLARI,PROJE-HAFIZASI}.md`.
- Açık sınırlar: fiziksel iPhone/Safari denenmedi. Her sesin her kelimesi bağımsız insan
  uzman tarafından dinlenmedi; otomatik döküm tek başına kesin kaynak sayılmadı.
  Kitaplar cihazda açılabilen kaynak PDF'lerle aynıdır; baskı/akademik redaksiyon yapılmadı.
  İndirme yetkisi olan hocanın kaydettiği kopyayı geri çekme iddiası yoktur.

## 21 Eylül 2026 (9) — Dinimi Öğreniyorum ve eğitim yardımı kampanyası

- Zaman: `2026-09-21T18:55:05+02:00` (Europe/Brussels). Durum: **yayımlandı ve canlı doğrulandı**.
- Kullanıcı, beş dilde eğitim hata avı, kapsayıcı başlık, resmî kampanya yayını ve özel imzalı tutanak istedi.
- İçerik commit'i `ff875f57626a9edcc542861cfb4abacb76221f8e`; pull --rebase ve push tamamlandı. Deploy <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35628304909> **success**.
- Release 0; içerik commit'inde 27 dosya. 1 resmî PDF (125.916 bayt); SHA-256
  `99fc9e1407b0773ff317b4cdaf89c527a174398bd8964f04dc2f9e37009c7658`.
- Eğitim başlığı TR/FR/EN/NL/DE dillerinde **Dinimi Öğreniyorum** karşılıklarıyla değişti.
  73 dersin beş dilde toplam 365 karşılığı, dil koruyan bağlantılar/arama/oynatıcı, yerel hata
  mesajları ve 14 ek yerel dilde Diyanet kitap bağlantısı var. 74 eski QR rotası korundu.
  Eski oynatma isteğinin gecikmiş hatası yeni sesi durdurmuyor.
- `npm run dogrula:codex`: **8/8**; Playwright **590/590**. Derleme 1.885 sayfa.
  18 resmî Diyanet PDF bağlantısı canlı doğrulandı. Beş dilde mobil/açık ve masaüstü/koyu
  görünüm, Almanca 320 px ve TR/FR kampanya görselleri incelendi; taşma yok. Impeccable 0 bulgu;
  bastırma eklenmedi. Kampanya vitrin sırasını değiştirdiği için 6 ana sayfa referansı güncellendi.
- Canlı kontrol: **374 HTML** (365 ders, 5 merkez, /e/, /e/test/, 2 kampanya)
  başlık/dil/ses kontrolleri geçti. PDF ve iki örnek ses için **3/3 SHA-256** yerelle aynı.
- Canlı adresler: <https://ulucamii.be/tr/muhtedi-egitimi/>,
  <https://ulucamii.be/tr/audio/fatha/>, <https://ulucamii.be/e/fatha/>,
  <https://ulucamii.be/tr/duyurular/egitim-yardimi-kampanyasi-2026/>,
  <https://ulucamii.be/fr/annonces/egitim-yardimi-kampanyasi-2026/>,
  <https://ulucamii.be/belgeler/egitim-yardimi-kampanyasi-2026-09-21.pdf>.
- Kaynak proje `D:/koordinatörlük`: yayın kaydı ve DEVAM güncellendi. Başkan ve din görevlisi
  imzalı tutanak yalnız özel çıktı klasöründedir; web deposunda yoktur. Tahsilat ve aktarım
  henüz gerçekleşmediğinden tutar, sayım ve dekont alanları boş bırakıldı. Üçüncü kişiye gönderim yok.
- Sınırlar: kitaptan gelen Fransızca okunuş/anlamlar açıkça etiketlenerek korunur; yeni meal
  üretilmez. Fiziksel telefon/Safari ve tüm seslerin insan tarafından dinlenmesi yapılmadı.
- Ayrıntı: `docs/EGITIM-DIL-DENETIMI-2026-09-21.md`; kanıtlar `.codex/egitim-son-kalite.log`,
  `.codex/egitim-canli-sonuc.json`, `.codex/egitim-gorsel/`.
- Değişen yollar:
  - `docs/DINLEME-SAYFALARI.md`
  - `docs/EGITIM-DIL-DENETIMI-2026-09-21.md`
  - `docs/PROJE-HAFIZASI.md`
  - `public/belgeler/egitim-yardimi-kampanyasi-2026-09-21.pdf`
  - `src/components/SesliDers.astro`
  - `src/components/SesliDersDizini.astro`
  - `src/content/duyurular/fr/egitim-yardimi-kampanyasi-2026.md`
  - `src/content/duyurular/tr/egitim-yardimi-kampanyasi-2026.md`
  - `src/i18n/dinleme.ts`
  - `src/i18n/egitim-kitaplari.ts`
  - `src/i18n/egitim.ts`
  - `src/i18n/ui.ts`
  - `src/i18n/utils.ts`
  - `src/lib/ecouter.ts`
  - `src/pages/[lang]/audio/[kod].astro`
  - `src/pages/e/[kod].astro`
  - `src/pages/e/index.astro`
  - `src/sayfalar/MuhtediEgitimi.astro`
  - `src/scripts/ecouter.ts`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-en-dark-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-en-light-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-fr-dark-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-fr-light-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-tr-dark-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-tr-light-masaustu-chromium-win32.png`
  - `tests/web/ecouter.spec.mjs`
  - `tests/web/egitim-diller.spec.mjs`


## 21 Eylül 2026 (8) — son tasarım uyarısı kapatıldı; proje devri tamamlandı

- Zaman `2026-09-21T16:53:13+02:00` (Europe/Brussels); durum **yayımlandı ve canlı doğrulandı**.
  Kullanıcının “her şeyi bitir” kapanışı ve tekrarlanan denetim bulgusu üzerine,
  önceki yayında açık bırakılan ilerleme çubuğu animasyonu da giderildi.
- Tek değişiklik `src/styles/ecouter.css`: `.ec-cubuk > span` üzerindeki
  `transition: width .2s linear` kaldırıldı. Dolgu ses süresine göre güncellenir;
  hareket azaltma tercihi dışında da genişlik animasyonu yoktur. Uyarı bastırılmadı.
- İçerik commit'i `01ae56b02f69bc888b3adc7aaac9bbf445ea21ca`; push tamamlandı. Deploy <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35614930192> **success**.
  Release 0; değişen içerik dosyası 1 CSS. SHA-256 `76b6b6387c34f947395d717110701d0ae93808c2d095c2928927994ccabf5f02`.
- `npm run dogrula:codex` 8/8; Playwright 564/564. Ek yerel/canlı gerçek ses kontrolünde
  Fâtiha kaydının yarısında dolgu %50, computed transition süresi `0s`; görünüm incelendi.
  Canlı adres <https://ulucamii.be/e/fatiha/>; eğitim <https://ulucamii.be/tr/muhtedi-egitimi/>.
- Kanıtlar: `.codex/dinleme-animasyon-kalite.log`, `dinleme-animasyon-yerel.json`,
  `dinleme-animasyon-canli.json` ve aynı adlı PNG'ler.
- (7) numaralı kayıttaki açık animasyon uyarısı bu yayınla kapandı. Bildirilen üç
  benzersiz tasarım bulgusu da giderildi; ignore eklenmedi. İçerik, ses/QR adresleri
  ve özel PDF değişmedi. İki `DEVAM.md` ve kaynak kitap kalite raporu güncellendi.
- Sınır: fiziksel telefon/Safari ve bütün seslerin insan tarafından dinlenmesi yapılmadı.
  Bu görevde bekleyen uygulama veya yayın yoktur.

## 21 Eylül 2026 (7) — eğitim kutularında dar kapsamlı tasarım düzeltmesi

- Zaman: `2026-09-21T16:24:59.633033+02:00` (Europe/Brussels). Kullanıcının tasarım denetimi geri bildirimi
  kapsamında **yayımlandı ve canlı doğrulandı**.
- `src/styles/ecouter.css`: `.eg-takip` ve `.eg-uygulama` üzerindeki dekoratif yan
  çizgiler kaldırıldı (iki satır). Mevcut zemin, içerik ve işlevler korundu.
- Triage: yinelenen raporda üç benzersiz bulgu vardı. İki yeni `side-tab` düzeltildi.
  `layout-transition` (`.ec-cubuk > span`, `transition: width .2s linear`) başlangıç
  commit'i `13624c2` içinde de bulunduğundan önceden var olan bulgu olarak bırakıldı;
  bu görsel düzeltmede kapsam genişletilmedi. **Bastırma/ignore eklenmedi.**
- İçerik commit'i `151352c50ee57ffd31d7c46cd62b36f2c1ad36cb`; push tamamlandı. Deploy <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35611599948> **success**.
  Release: 0; değişen içerik dosyası: 1 CSS. SHA-256: `90094db0600fd7d59e68e29803ebd599731c90831be4076d983336b343cf400c`.
- Kalite: `npm run dogrula:codex` 8/8; Playwright 564/564. Yerel mobil açık/masaüstü
  koyu görseller incelendi. Canlı aynı iki ölçekte 9 kutunun yan çizgisi 0 px,
  taşma yok, 8 bölüm ve 73 ders korundu. Kayıtlar `.codex/dinleme-tasarim-*.json/log/png`.
- Canlı: <https://ulucamii.be/tr/muhtedi-egitimi/>,
  <https://ulucamii.be/fr/formation-nouveaux-musulmans/>.
- Önceki yayın (6) içindeki 56 ses düzeltmesi ve 74 QR adresi değişmedi. Kaynak
  kitap kalite raporu ve iki projenin `DEVAM.md` kayıtları güncellendi.
  Sınır: önceden mevcut ilerleme animasyonu uyarısı açık; yeni fiziksel telefon testi yok.

## 21 Eylül 2026 (6) — Yeni Müslümanlar eğitim platformu ve Elifbâ ses düzeltmesi

- Zaman: 21 Eylül 2026 öğleden sonra; canlı kontrol `2026-09-21T16:05:00.539675+02:00` (Europe/Brussels, CEST).
  Durum: **yayımlandı ve canlı doğrulandı**. Kullanıcı, fetha ses hatasının ve benzerlerinin
  düzeltilmesini, kitap karekodları korunarak derslerin herkese açılmasını ve yeni
  Müslümanlar için ayrıntılı bir eğitim platformunun tam otonom kurulmasını istedi.
- Platform: beş dilde sekiz öğrenme bölümü, 24 çalışma konusu, sekiz uygulama,
  günlük çalışma önerisi, dört SSS, dört resmî Fransızca Diyanet PDF kaynağı,
  çok dilli kütüphane ve mevcut seviye testi/iletişim bağlantıları. İsteğe bağlı ilerleme
  işaretleri yalnız cihazda saklanır; üyelik, yeni sunucu kaydı veya veri toplama yoktur.
- 73 sesli ders `/e/` üzerinden aramalı/kategorili dizinde ve bütün eğitim merkezlerinde
  erişilebilir; indexlenebilir ve site haritasındadır. Ders açıklamaları FR, tilavetler AR;
  rehber TR/FR/EN/NL/DE. 74 basılı QR adresi sabit; `/e/test/` yönlendirmesi korunur.
- Ses: yanlış klasör/numaralandırmadan gelen 28 yalın harf + 28 fetha dosyası resmî Diyanet
  asıllarıyla değiştirildi. 787 Elifbâ yolu / 759 benzersiz resmî URL bayt eşitliği ve
  41 bölümde 787 metin–ses bağı kontrol edildi. `e09` aynı kayıtta okunan kısa–uzun
  heceleri 28 çift düğmede gösterir. Ses URL'leri JS ve betiksiz erişimde `?v=2` kullanır.
- Değişen yollar: `src/sayfalar/MuhtediEgitimi.astro`, `src/i18n/egitim.ts`,
  `src/i18n/egitim-rehberi.ts`, `src/scripts/muhtedi-egitimi.ts`,
  `src/components/SesliDersDizini.astro`, `src/pages/e/index.astro`, `src/pages/e/[kod].astro`,
  `src/pages/[lang]/[sayfa]/index.astro`, `src/components/Header.astro`, `src/i18n/ui.ts`,
  `src/layouts/Base.astro`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`,
  `src/styles/ecouter.css`, `src/data/ecouter.json`, 56 `public/media/ses/elifba/` MP3,
  `scripts/indir-elifba-ustun.ps1`, `scripts/elifba-ses-denetle.py`, `package.json`,
  `tests/ecouter-ses.test.mjs`, `tests/fixtures/elifba-resmi-eslesmeler.json`,
  `tests/web/ecouter.spec.mjs`, `docs/dinleme-ses-kaynaklari.json`,
  `docs/DINLEME-SAYFALARI.md`, `docs/PROJE-HAFIZASI.md`.
- İçerik commit'i `413f013ab7bd8aa9d9a8a50430ec275dd9d2acc5` — 80 dosya; push tamamlandı. Release: **0** (yeni Release
  gerekmiyor; 56 ses Git deposu üzerinden). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35609410527> — build/deploy **success**.
- Yerel kalite: `npm run dogrula:codex` **8/8 geçti**, çıkış 0; Astro 303 dosyada
  0 hata/0 uyarı, 1588 sayfa; Playwright **564/564**, buna eğitim/dinleme **38** senaryosu
  dahil. Yeni ses regresyonları 3/3. Bütün 856 kullanılan ses Chromium AudioContext ile
  çözümlendi, hata 0. Mobil/masaüstü, açık/koyu, klavye, JavaScript kapalı ve engelli
  depolama kontrolleri geçti; görseller gözle incelendi.
- Canlı kontrol: **80/80** adres HTTP 200 (5 merkez + dizin + 74 QR); 56/56 düzeltilmiş
  MP3 SHA-256 yerel/resmî manifestle eşleşti. Beş merkezde 8 bölüm/73 ders, arama,
  ilerleme kalıcılığı ve mobil taşma kontrol edildi. Fetha `be.mp3?v=2` gerçek tarayıcı
  oynatması başarılı (1.110204 saniye, medya hatası yok).
- Canlı adresler: <https://ulucamii.be/tr/muhtedi-egitimi/>,
  <https://ulucamii.be/fr/formation-nouveaux-musulmans/>,
  <https://ulucamii.be/en/learning-new-muslims/>,
  <https://ulucamii.be/nl/onderwijs-nieuwe-moslims/>,
  <https://ulucamii.be/de/unterricht-neue-muslime/>, <https://ulucamii.be/e/>,
  <https://ulucamii.be/e/fatha/>.
- SHA-256: `src/data/ecouter.json` = `bfa1e50341283772f3449e204ab26b17a44906c93684617c1bf15092ceff6ebe`;
  kaynak manifesti = `8215dea311cea7b458bd44dbaf9c21d86ba8a1faf0385817a19bb130c2af7281`.
  Dosya başına ses özetleri manifesttedir. Özel kaynak PDF değişmedi; 766 sayfa,
  99 karekod / 74 kod, hata 0; başlangıç/son SHA-256 eşitliği doğrulandı.
- Kaynak kitap projesindeki katalog/doğrulama/üretici, kalite raporu ve `DEVAM.md`
  güncellendi. Özel kitap ve kişisel bilgiler siteye yüklenmedi. Yerel kanıtlar
  `.codex/dinleme-platform-kalite.log`, `dinleme-canli-sonuc.json`,
  `dinleme-canli-tarayici.json`; kaynak raporu `inceleme/WEB-SES-DUZELTMESI-2026-09-21.md`.
- Sınırlar: bütün kayıtlar kıraat hocası tarafından tek tek dinlenmedi; fiziksel
  telefon/Safari testi yapılmadı. Kaynak kitapların bağlantıları doğrulandı;
  Diyanet'in ileride değiştirebileceği dış adresler site denetiminin dışındadır.

## 21 Eylül 2026 (5) — site dilleri: Flemenkçe (nl) + Almanca (de); seviye testi form sürümü 2 (Apps Script v39)

- Zaman: 21 Eylül 2026 sabah (istek) – 14:40 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («camimiz bundan sonra Flemenkçe ve Almanca da olsun, iki dil daha ekle»; seviye testi için «Flemenkçe ve Almanca… seslendirme vesaire her şey olsun» + başvuranın yeri, en yakın Diyanet camisi, görevliyi tanıma, ataşelik bilgisi ve iki paylaşım onayı).
- Kapsam: site dilleri tr, fr, en + **nl** (Belçika Flemenkçesi, u-biçimi) ve **de** (Sie-biçimi) — `src/i18n/ui.ts` tek kaynak, yollar, menü, hreflang (`nl-BE`, `de-BE`), bayraklar, paylaşım kartları (`scripts/og-kart-uret.mjs`), veli portalı manifestleri, 11 içerik sayfası × 2 dil, formlar, veli portalı arayüzü, UİP, seviye testi bankası ve arayüzü. Yasak kalıp `dil === 'tr' ? … : dil === 'en' ? … : …` bütün bileşenlerde `Record<Dil, …>` oldu. Saklanan içerik (duyuru, etkinlik, vaaz, ders defteri) TR+FR kalır; nl/de sayfaları ziyaretçinin dilinde not gösterir. Kılavuz: [DIL-NL-DE.md](DIL-NL-DE.md).
- Seviye testi **form sürümü 2**: «yer ve yerel destek» bölümü (ülke, şehir/posta kodu, bilinen en yakın Diyanet camisi, görevliyi tanıma, Müşavirlik/Ataşelik bilgisi) + **iki ayrı, isteğe bağlı, işaretsiz gelen** paylaşım onayı (yerel din görevlisi / Müşavirlik-Ataşelik; GDPR md. 9/2-a, AEA dışı md. 49/1-a). Otomatik aktarım YOKTUR; hoca raporu ve panel «ONAY VERDİ / VERMEDİ» gösterir. Ders dili seçenekleri beş. `RIZA_SURUMU = 2026-09-21` ([arşiv](seviye-testi/riza-arsivi.md)); gizlilik sayfası beş dilde güncellendi.
- Sesli okuma: nl + de 2 × 126 klip (Gemini TTS `gemini-3.1-flash-tts-preview`, ses `Iapetus`; nl'nin bir bölümü ortak havuzdan, kalanı ve de Vertex AI `tedris-pro`). 630 klibin tamamı yazıya dökülerek denetlendi: 1 bozuk klip silinip yeniden üretildi → bozuk 0; manifest 695/695 soru.
- Apps Script **v39** (önce GAS, sonra site): `scripts/apps-script/ulucamii-Kod-v39.gs` (`SITE_DILLERI`, beş dilli sözlükler; tr/fr/en çıktıları eşdeğerlik sınamasıyla birebir) + `seviye-testi-isleri.gs` (deftere SONA 8 sütun; sürüm 1 gövdesi geçişte kabul). Dağıtım `D:/tmp/gas/dagit_v39.py`: `--kuru` okumasında canlı kaynak 20 Eylül v38 dağıtımında kaydedilen kopyayla birebir aynıydı; yazım sonrası yeniden okunan kod paketle birebir aynı; paket 8 635 586 bayt, SHA-256 `2c466100343feb64…449e99c9`; 14:09'da **sürüm 39 canlıda**. Sağlık: `surum:39`, `seviyeTesti:true`, `seviyeBankaSurumu:1`, eski bayrakların tamamı aynen.
- İçerik commit'i: `9ce231e` (439 dosya; dal `dil-nl-de` → `main` hızlı ileri sarma, push `e363cb5..9ce231e`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35598056348> — build + deploy **success**.
- Yerel doğrulama: `npx astro check` 0 hata; `npm run build` 1582 sayfa; `npm run denetim` yüksek=0 orta=0 (53 eski düşük başlık seviyesi bulgusu kapsam dışı); `npm run dogrula:codex` 8/8 aşama, çıkış 0 (Codex CLI ile bağımsız koşu): birim testleri başarısız 0 (`test:seviye` 51/51, `test:kimlik` 31/31, `test:ihtida` 33/33, `test:veli-eposta` 58/58, `test:kurallar` 41/41 …), Playwright **552/552**; nl/de görsel kontrol 68 görüntü (360/768/1280, açık/koyu, açık menüler) — sayfa ve metin taşması 0; 360 px'te nl/de marka adı kırpılması giderildi (tr/fr/en değişmedi).
- Canlı doğrulama (14:25–14:40, `.codex/canli-dogrula-nlde.py`, 48/48): beş dil ana sayfa 200 + doğru `lang` + hreflang (tr, fr-BE, en, nl-BE, de-BE, x-default) + paylaşım kartları 200 + imam numarası metinde yok; `/nl/niveautest/`, `/de/einstufungstest/`, `/tr/seviye-tespit-testi/` → form sürümü 2, asgari servis 39, yer bölümü + iki isteğe bağlı onay, cevap anahtarı HTML'de yok, 126'şar klip düğmesi, ilk klipler 200 `audio/mpeg`; portal manifestleri, nl/de gizlilik ve namaz sayfaları 200; site haritasında nl=1047, de=1047 adres.
- Canlı uçtan uca deneme: Almanca form, soyad TESTOGLU, deneme adresi dernek kutusu → `ST-2026-0003`, Almanca sonuç ekranı; defterde yeni sütunlar dolu (ülke DE, ataşelik onayı «Evet», yerel görevli onayı «Hayır», ders dili `de`), Durum `katilimci-eposta-gonderildi | imam-eposta-gonderildi`; kayıt `seviye-sil` ile TEK BAŞINA silindi (`silinen: 1`), gerçek 2 kayıt yerinde. `test-temizle` kullanılmadı.
- Açık sınırlar: nl/de çevirilerinde imamın kararına bırakılan yazım noktaları (kh/ch, «sjahada», çocuk içeriklerinde u↔je, `kb04` «uw/jouw Heer» vb.) `DEVAM.md`'de; âyet/hadis anlam çevirileri «gözden geçirilecek» listesinde; UİP nl/de yazılı görselleri yok (İngilizce görsele düşer); nl/de hadis MP3'leri yok; defterde «Rıza sürümü» hücresini Sheets tarihe çeviriyor (`21.09.2026 00:00` — v38'den beri böyle, kozmetik); imam@ ve info@ kutularındaki deneme iletileri elle silinecek.
## 21 Eylül 2026 (4) — seviye testi: soruyu sesli dinleme (3 dil × 126 klip)

- Zaman: 20 Eylül 22:30 (istek) – 21 Eylül 2026 08:40 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («sorunun üzerine tıklayınca… sesli okuma olsun. Sesleri API key havuzumuz ile üret… en iyi modelleri kullan»; 21 Eylül sabahı: «yap dediğim yapmadığın ne varsa hepsini yap»).
- Kapsam (yalnız ön yüz + statik ses; Apps Script v38 ve veri sözleşmesi değişmedi): her sorunun yanında hoparlör düğmesi; soru metnine ya da düğmeye dokununca önceden üretilmiş klip çalar, ikinci dokunuş durdurur; şık seçilince, adım değişince ve Diyanet «Dinle» düğmesi başlayınca susar. Bilgi sorularında kök + şıklar + «Bilmiyorum», okuma bölümünde **yalnız soru kökü** okunur; üretilmiş ses Arapça harf/hece/âyet OKUMAZ (Arap harfli metin klibe girmez), Kur'an/Elifbâ sesi yalnız resmî Diyanet. Klibi olmayan soruda düğme basılmaz.
- Ses üretimi: Gemini TTS (`gemini-3.1-flash-tts-preview`, ses `Iapetus`); anahtarlar yalnız ortak havuzdan, depoya yazılmadı. Ücretsiz havuzun günlük kotası dolunca üretimin ve içerik denetiminin son bölümü Vertex AI ile tamamlandı (`--vertex`, GCP `tedris-pro`, kullanıcının 7 Eylül 2026 izni; yalnız herkese açık soru metinleri gönderildi, kişisel veri yok). Her klip yazıya dökülüp metniyle karşılaştırıldı: **378 denetlendi, bozuk 0**; manifest 417/417 soru–dil eşlemesi. Metin ve ses arşivi `D:/sesli-anlatim/seviye-testi`.
- Aynı işte düzeltilenler: ses denetçisi sayıları yalnız dökümde rakama çeviriyordu → rekât sorularında doğru klibi «bozuk» gösteriyordu (iki taraf da rakama indirildi); klavye odak testi yeni sıraya göre güncellendi (hoparlör düğmesi ilk şıktan önce).
- Değişen yollar (392 dosya): `src/components/formlar/{SeviyeSoru,SeviyeTestiFormu}.astro`, `src/scripts/{seviye-form,seviye-sesli-okuma}.ts`, `src/lib/seviye-testi/sesli-okuma.ts`, `src/i18n/seviye-testi.ts`, `src/styles/seviye-testi.css`, `src/data/seviye-sesler.json`, `public/media/ses/seviye/{tr,fr,en}/*.mp3` (378 klip, 49 MB), `scripts/seviye-ses-{metin.mjs,uret.py,denetle.py}`, `package.json` (`seviye:ses`), `tests/web/seviye-testi.spec.mjs`, `docs/SEVIYE-TESTI.md` §8.
- İçerik commit'i `dc0a894` (namaz vakti veri commit'i `a61dfb1` üstüne alındı); Release kullanılmadı. [Pages 35568925725](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35568925725) başarılı (08:33).
- Testler (yayın öncesi, yerel, 08:12–08:30): `npm run dogrula:codex` çıkış 0 — design:check, check (0 hata), dogrula (980 sayfa), **test:web 532/532**, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ.
- Canlı doğrulama (08:38, **gönderimsiz**): üç dil sayfası HTTP 200, her birinde 139 hoparlör düğmesi; 3 × 126 klip adresi HTTP 200 (`audio/mp3`); gerçek tarayıcıda (Chromium) düğmeye tıklayınca `aria-pressed="true"` ve klip isteği 206 (tr/fr/en); iki klibin canlı SHA-256 özeti yerelle aynı (`03ed7024eb642e4e…`, `d7452ad44612525b…`).
- Açık sınırlar: klipler yapay sestir (Türkçe/Fransızca/İngilizce soru metni); soru metni değişirse kimlik değişir ve klip yeniden üretilmelidir (`docs/SEVIYE-TESTI.md` §8 sırası); ücretsiz havuz günde sınırlı klip üretir — toplu yenilemede `--vertex`.

## 21 Eylül 2026 (3) — dinleme sayfaları `/e/<kod>/` (ders kitabı kare kodlarının hedefi)

- Zaman: 21 Eylül 2026 03:10 – 05:05 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının kişiye özel ders kitabı talimatı («içeriğinde kare kodlar olsun, sesli dinlemeler için kullanılabilsin… full otonom ilerle»); kare kodların çalışması için sayfaların yayında olması gerekir.
- Kapsam: 74 kod → 74 Fransızca sayfa (`noindex, nofollow`, site haritası dışı, kanonik adres yok). 14 sûre âyet âyet (71 satır sesi) + bütün kayıt; Sübhâneke, Tahiyyât, Salli, Bârik, Rabbenâ (2), Kunut (2), ezan, kamet, ezan duası; Elifbâ ve tecvid aşamaları (843 öge); `test` kodu seviye testine yönlendirir. Sayfalarda **kişisel veri yok**; kod kişiyi değil içeriği adlandırır. Kaynak proje özeldir ve depoya girmez.
- Ses kaynakları (yalnız resmî Diyanet; hepsi yerelde): mushaf kaydı Hafız Osman Şahin (`webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_OsmanSahin/`), Namaz Portalı (`namaz.diyanet.gov.tr`), Elifbâ portalı (`kuran.diyanet.gov.tr/elifba`). Her dosyanın kaynak adresi ve SHA-256 özeti: `docs/dinleme-ses-kaynaklari.json`.
- Aynı yayında mevcut sistemde düzeltilen: `public/media/ses/dualar/{subhaneke,tahiyyat,sallibarik}.mp3` dosyalarının kaynağı belgesizdi → resmî Namaz Portalı kayıtlarıyla değiştirildi (öğrenci ezber sayfası bu dosyaları zamanlamasız, bütün olarak çalar; süreler 17,4→13,9 / 41,0→33,0 / 57,5→40,1 sn).
- Yayından ÖNCE yakalanan üretim kusuru: üreteç tek âyetin bölümlerine (Âyetü'l-Kürsî) satır numarasını âyet numarası sanıp Bakara 1–2'nin sesini bağlamıştı; satır sesi artık yalnız tam sûrede ve sûre boyunca tek kayıttan bağlanır, `tests/web/ecouter.spec.mjs` içindeki bekçi testi tekrarını engeller. Harf sayfalarında portalın noktasız yazdığı yâ' düşüyordu (27/28) → 28/28, kitap sırası.
- Değişen yollar (720 dosya): `src/pages/e/[kod].astro`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`, `src/styles/ecouter.css`, `src/data/ecouter.json`, `tests/web/ecouter.spec.mjs`, `docs/DINLEME-SAYFALARI.md`, `docs/dinleme-ses-kaynaklari.json`, `public/media/ses/ayet/` (71), `public/media/ses/dualar/` (9 yeni + 3 değişen), `public/media/ses/elifba/k/` (≈ 23 MB).
- İçerik commit'i `2d09f07`; Release kullanılmadı. [Pages 35551772695](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35551772695) başarılı.
- Testler (yayın öncesi, yerel): `npm run check` 0 hata / 0 uyarı; `npm run build` 980 sayfa; `tests/web/ecouter.spec.mjs` 26/26; tam `playwright test` 530 geçti / 2 kaldı — kalan ikisi (`seviye-testi.spec.mjs:481`, odak beklentisi) çalışma ağacında duran, **bu yayına girmeyen** «soruyu sesli dinleme» çalışmasına ait; `npm run dogrula:codex` içindeki tek kırmızı da aynı çalışmanın ses listesi (`seviye-sesler.json` güncel değil — klip üretimi sürüyor). Öteki kapılar GEÇTİ.
- Canlı doğrulama: 74 sayfa + 884 ses adresi HTTP 200 (`text/html` / `audio/mp3`), bilinmeyen kod 404, `sitemap-0.xml` içinde `/e/` adresi 0; iki dosyanın canlı SHA-256 özeti yerelle aynı (`64c76f36d86811ed…`, `9818f1ad7a4e1682…`); gerçek tarayıcıda (390 px) `/e/fatiha/` 2. âyet ve `/e/lettres-7/` yâ' **gerçekten çaldı** (`currentTime` ilerledi, `aria-pressed="true"`), konsol hatası 0.
- Açık sınırlar: Âmentü, şehâdet, tevhid, yemek/uyku duaları, tesbihat ve kısa namaz formülleri için resmî Diyanet kaydı bulunamadı → kare kodsuz (kitapta «imamla tekrarlayın»); basılmış kitaptaki kod kalıcı adrestir — yayımlanmış kod silinmez, başka içeriğe bağlanmaz.

## 21 Eylül 2026 (2) — seviye testi: tek e-posta, telefon biçimi, titreme ve iniş düzeltmeleri

- Zaman: 21 Eylül 2026 00:25 – 01:10 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık talimatı («Bunları düzelt, yayınla»).
- İlk gerçek başvuru aynı gece geldi (`ST-2026-0001`, 00:02; iki e-posta da gönderildi) — kullanıcı geri bildirimi bu başvurunun ardından verildi. Kayıtta kişisel veri tutulmaz.
- Kapsam (yalnız ön yüz; Apps Script v38 değişmedi): (1) e-posta TEK kez yazılır, yaygın alan adı yazım hatasında «Şunu mu demek istediniz…?» önerisi (TR/FR/EN); (2) telefon alanları yalnız rakam kabul eder ve yazarken «+32 470 12 34 56» biçimine girer — ortak çekirdekte, seviye + kayıt + ihtida formlarında; gövdeye giden değer yine boşluksuz E.164; (3) **titreme**: alt şerit yapışınca içindeki taslak notu gizleniyor, şeridin boyu 110↔71 px oynuyor ve formun sonundaki ~40 px'lik bantta 1,2 sn'de 34 yapış/çöz döngüsü kuruluyordu → not şeridin dışına alındı, aynı ölçüm 1; (4) kısa ekranda (ör. 1366×640) adıma inişte adım paneli + alt şerit içeriğe 70 px bırakıyordu → yer < 240 px ise doğrudan bölüme inilir (ortak adım motoru; ihtida formu da yararlanır); (5) koyu temada atlanan basamağın kesik çizgisi okunur oldu.
- Değişen dosyalar: `src/scripts/telefon-bicim.ts` (yeni), `src/scripts/form-cekirdek.ts`, `src/scripts/form-adimlari.ts`, `src/scripts/seviye-form.ts`, `src/components/formlar/SeviyeTestiFormu.astro`, `src/i18n/seviye-testi.ts`, `src/styles/seviye-testi.css`, `tests/telefon-bicim.test.mjs` (yeni, 6 test), `tests/web/seviye-testi.spec.mjs` (+3 senaryo: iniş, titreme, e-posta/telefon), `package.json`, `docs/SEVIYE-TESTI.md`.
- İçerik commit'i `3f5ed97`; Release kullanılmadı. [Pages 35543472762](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35543472762) başarılı.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` çıkış 0 — **test:web 504/504**, öteki bütün kapılar GEÇTİ; `npm run test:seviye` 50/50 + döküm güncel; kayıt ve ihtida form testleri 116/116 (telefon biçimlendirici bağlıyken).
- Canlı doğrulama (gerçek tarayıcı, 1366×640, **gönderimsiz — POST kesildi**), üç dilde: tekrar alanı yok (0), öneri görünür ve `ornek@gmial.com` → `ornek@gmail.com` düzeliyor, `04x70-12 34ab56` → `+32 470 12 34 56`, kararsız bantta `data-yapisik` değişimi **0**, sayfa hatası yok.
- Açık sınırlar: ek animasyon eklenmedi (öncelik hatalardaydı); soruyu sesli dinleme ayrı yayın olarak hazırlanıyor (bkz. sonraki kayıt).

## 21 Eylül 2026 — seviye testi: etkileşim ve hareket katmanı

- Zaman: 20 Eylül 23:50 – 21 Eylül 2026 00:20 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık talimatı («ön izleme göstermene gerek yok… ne gerekiyorsa yap, yayınla»).
- Kapsam (yalnız ön yüz; Apps Script v38 değişmedi, veri sözleşmesi aynı): seçim anı (mürekkep dolumu, çizilen onay işareti, «cevaplandı» rozeti; «Bilmiyorum» aynı onayı alır ve artık soluk gösterilmez), otomatik ilerleme + `role="switch"` anahtarı (odak taşımaz, klavye seçiminde devreye girmez), masaüstünde 1–4 / 0 kısayolları, yapışkan alt şerit (adım sayacı, ilerleme çubuğu, kalan süre, tek `aria-live` bölgesinde eşik cümleleri), Kur'an merdiveni (kilim baklavası düğümleri, basamak tamamlanınca kıvılcım, atlanan basamak kesik çizgili), Arapça ibarelerde mürekkep belirişi, ses çalarken ekolayzır, adım geçiş hareketi, «Teste başla» / «Kaldığım yerden devam et», sonuç ekranında sırayla dolan çubuklar + 1,8 sn'lik kilim konfetisi. İstemcide doğruluk bilgisi yoktur; hiçbir hareket doğru/yanlış ima etmez. `prefers-reduced-motion` altında tümü kapalı; betik hata verse de form aynen çalışır.
- Değişen dosyalar: `src/scripts/seviye-etkilesim.ts` (yeni), `src/scripts/seviye-form.ts`, `src/scripts/form-adimlari.ts` (geriye uyumlu tek ek: `form:adim` olayı), `src/styles/seviye-testi.css`, `src/i18n/seviye-testi.ts` (TR/FR/EN 14 metin), `src/components/formlar/SeviyeTestiFormu.astro`, `tests/web/seviye-testi.spec.mjs` (+9 senaryo).
- İçerik commit'i `cf34fd0`; Release kullanılmadı. [Pages 35540452564](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35540452564) başarılı.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` çıkış 0 — design:check, check (0 hata / 0 uyarı), dogrula, **test:web 500/500**, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ; `npm run test:seviye` 44/44 + döküm güncel; `npm run denetim` yüksek/orta bulgu yok.
- Canlı doğrulama (gerçek tarayıcı, 390 px dokunmatik bağlam, **gönderimsiz — POST kesildi**): üç dilde «Teste başla» düğmesi, merdiven, anahtar ve alt şerit yerinde; şık seçilince `data-cevaplandi` işaretlendi; şerit metinleri yerelleşmiş («Bu adım: 1 / 33 · yaklaşık 28 dk kaldı» / «Cette étape : 1 / 33 · environ 28 min restantes» / «This step: 1 / 33 · about 28 min left»); sayfa hatası yok; sayfa kaynağında `"dogru"` izi 0.
- Açık sınırlar: kaydırırken görünür kalan küçük merdiven sürümü yapılmadı (isteğe bağlıydı); 49 düşük «başlık seviyesi atlanıyor» bulgusu eski sayfalarda duruyor (bu yayının kapsamı dışında).

## 20 Eylül 2026 — yetişkinler için Kur'an ve dinî bilgi seviye tespit testi (Apps Script v38)

- Zaman: 20 Eylül 2026, 21:55–22:10 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık yayın onayı (aynı oturumda, soru-yanıtla teyit edildi).
- Kapsam: üç dilli test sayfası (`/tr/seviye-tespit-testi/`, `/fr/test-de-niveau/`, `/en/level-assessment/`), «Eğitim» menüsü + ihtida sayfasında «Nereden başlamalıyım?» kartı + Kur'an kursu sayfasında yetişkin satırı; soru bankası sürüm 1 (112 madde + 14 ezber + 13 öz beyan, üç bağımsız doğrulamadan geçti); sunucu yetkili puanlama; defter + iki e-posta (rapor yalnız `imam@ulucamii.be`, yedek kanal kapalı); panelde «Seviye testleri» sekmesi; gizlilik politikası ×3 yeni bölüm; TR + FR duyuru. Ayrıntı: [Seviye testi](SEVIYE-TESTI.md).
- Aynı yayında mevcut sistemde düzeltilenler: `panelYetkiTamam` gömülü yer tutucuyu anahtar sayıyordu; `ihtidaV2AnahtarBul` önbellek kesintisinde başvuruyu düşürüyordu; 20 KiB gövde sınırı bayt yerine UTF-16 birimi sayıyordu; form çekirdeği iç içe koşullu blokları yeniden açamıyordu; Elifbâ şedde metinleri NFC değildi (veri + aktarım betiği + test kapısı); ihtida başarı panelinde koyu tema kontrastı 2:1 → 6,4:1; panelde yetki hatasında asılı kalan not; ihtida formunda hiç görünmeyen ölü ok işaretlemesi.
- Aşama 1 — Apps Script: `D:/tmp/gas/dagit_v38.py` (`--kuru` → canlı editör kaynağı yerel v37 derlemesiyle bayt bayt aynı, dernek hesabı doğrulandı; sonra `GAS_HEADLESS=1`). Paket `.codex/cikti/gas/ulucamii-v38.gs` 8 542 627 bayt (LF), SHA-256 `eb7befcac583b577e7ad20d23c3eac867632e27da7ef8fca8be137efba4453c6`; yeniden okunan kaynak paketle birebir aynı; **mevcut dağıtıma yeni sürüm** (adres değişmedi). Yerel yedek `D:/tmp/gas/v38-oncesi-20260920-215735-389322.gs`. Sağlık: `surum:38 · seviyeTesti:true · seviyeBankaSurumu:1`; `kayitKimlik`, `kayitImza`, `kayitBelgeleriZorunlu`, `kayitDuzelt`, `defterCeviri`, `ihtidaPaketHazir`, `ihtidaDefteriHazir`, `ihtidaCamiSecimi` aynen `true`.
- Aşama 2 — site: içerik commit'i `b4140913882b68877b30522ca0419bb14e37b80c` (`main`'e ileri sarma). [Pages 35534070441](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35534070441) başarılı. Release kullanılmadı.
- Aşama 3 — canlı doğrulama: üç adres + `/admin/seviye-panel.js` HTTP 200; `hreflang` tr/fr/en/x-default; sayfa kaynağında `"dogru"` izi 0; `data-asgari-servis-surumu="38"`; ana sayfa menüsü ve ihtida kartı canlı. İki gerçek deneme (soyad TESTOGLU, deneme adresi dernek kutusu): `ST-2026-0001` (FR) ve `ST-2026-0002` (TR) — sonuç ekranı K3 + «B» programı (beklenen), defter damgası ikisinde de `katilimci-eposta-gonderildi | imam-eposta-gonderildi`; info@ gelen kutusunda **yalnız** iki katılımcı iletisi (doğru dilde, `Reply-To: imam@ulucamii.be`), hoca raporu info@'ya düşmedi; `liste` yanıtında `seviyeler` 29 sütun, gizli sütun (Cevaplar, Gönderim anahtarı, Not) yok; `seviye-detay` raporu döndürdü; gömülü yer tutucu anahtar canlıda `yetki` ile reddedildi.
- Temizlik: iki deneme kaydı `seviye-sil` ile **tek tek** silindi (`silinen:1` ×2); seviye defteri 0 satır; kayıt defteri 25, ihtida defteri 5 satır — dokunulmadı. `test-temizle` bilerek kullanılmadı (öteki defterlere de dokunur). Açık: `imam@` kutusundaki iki deneme raporu ile info@ kutusundaki iki deneme iletisi elle silinecek; ilk gerçek katılımcı yeniden `ST-2026-0001` numarasını alır.
- Aşama 4 — duyuru: `src/content/duyurular/{tr,fr}/seviye-tespit-testi-2026.md` taslaktan çıkarıldı (öne çıkan, 25 Ekim 2026'ya kadar); commit `a6e6f1c0a77cb33b2a0d446045082256b99a0b98`; [Pages 35534574905](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35534574905) başarılı; `/tr/duyurular/seviye-tespit-testi-2026/` ve `/fr/annonces/seviye-tespit-testi-2026/` HTTP 200, ana sayfa vitrininde görünüyor.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` — design:check, check (0 hata), dogrula, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ; test:web 476 geçti + 6 beklenen görsel taban çizgisi farkı (ihtida kartı) güncellendi → `design-visual` 24/24; duyurudan sonra ana sayfa taban çizgileri de güncellendi (24/24). `npm run test:seviye` 44/44 + döküm güncel; `seviye-testi` + `seviye-panel` + `ihtida` tarayıcı testleri 62/62; `npm run denetim` yüksek/orta bulgu yok (49 düşük, hepsi eski sayfalarda).
- Açık sınırlar: katılımcıdan ses kaydı alınmaz — akıcılık/mahreç ilk yüz yüze derste teyit edilir; duyurunun EN sürümü, Facebook/afiş kapsam dışı; cevap anahtarı herkese açık depoda durur (sayfa HTML'ine basılmaz).

## 20 Eylül 2026 — örnek defterler ve ders kitapları (kalıcı materyaller)

- Zaman: 20 Eylül 2026, 11:18–11:25 (Europe/Brussels, CEST). Durum: yayımlandı ve canlı doğrulandı. Kullanıcının açık yayın talimatı.
- Kapsam: «Ders Materyalleri → Kalıcı materyaller» bölümüne beş kayıt. İki PDF depoda (`public/media/materyaller/`): `Ornek-Mesk-Defteri-2026-2027.pdf` (64 s., 180 768 bayt) ve `Ornek-Ders-ve-Iletisim-Defteri-2026-2027.pdf` (324 s., boş şablon, 1 476 520 bayt). Üç ders kitabı **yalnız resmî ücretsiz kaynağa bağlantıyla**: Camiye Gidiyorum 1 ve 2 → DİTİB Akademi (`/cg1/`, `/cg2/`), Temel Dinî Bilgiler → `dijital.diyanet.gov.tr` e-kitap 4218 (bağlantılar yayından önce HTTP 200).
- Değişen dosyalar: `src/content/materyaller/{ornek-mesk-defteri-2026-2027,ornek-ders-ve-iletisim-defteri-2026-2027,camiye-gidiyorum-1,camiye-gidiyorum-2,temel-dini-bilgiler}.md`; yeni materyal türleri `kitap` ve `defter` — `src/content.config.ts`, `src/sayfalar/DersMateryalleri.astro` (TR/FR/EN etiket), `public/admin/icerik/config.yml` birlikte.
- İçerik commit'i `e822d0110c3cc9b2d1e286e92c1ee7cd2bce4871`; Release kullanılmadı (dosyalar ≤ 15 MB). [Pages 35501947723](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35501947723): build ve deploy başarılı.
- Testler: `npm run check` 0 hata / 0 uyarı (259 dosya); `npm run dogrula` çıkış 0, başarısız test yok; `npm run denetim:cms` çıkış 0. Günlükler: `D:/tmp/materyal-{check,dogrula,cms}.log`.
- Canlı doğrulama: `/tr/ders-materyalleri/`, `/fr/supports-de-cours/`, `/en/lesson-materials/` HTTP 200, beş kayıt üç dilde görünüyor; iki PDF HTTP 200 `application/pdf`, indirilen dosyaların SHA-256'sı kaynakla eşleşti (`69588ecd99b7e98e…`, `b754fad8dac498b1…`). Sayfada din görevlisi hattı: 0.
- Kişisel veri taraması (yayından önce): iki PDF'te 98 öğrenci/veli/hoca ad sözcüğü, `UC-…` kayıt numarası, e-posta ve telefon arandı — yalnız cami hattı, `info@` ve `imam@ulucamii.be` var; ad ve kayıt numarası yok.
- Açık sınır — **kitap PDF'leri yüklenmedi**: kullanıcı Camiye Gidiyorum 1-2 PDF'lerinin de yayımlanmasını istedi. Yerel dosyalar incelendi: Türkçe kaynaklar DİTİB Akademi çevrim içi okuyucusundan alınmış sayfa görüntüleri (jsPDF, metin katmanı yok); kitaplar ISBN'li ve satışta, içlerinde DİTİB'e lisanslı Shutterstock fotoğrafları var; Fransızca sürümler kursun kendi çevirisi olduğu hâlde kapakta «DITIB | DITIB Verlag — VERSION FRANÇAISE», 2. kitabın künyesinde «Fondation Diyanet de Belgique» ibaresi taşıyor. Bu depo herkese açık ve sitenin kendisi olduğundan yükleme kullanıcının teyidine bırakıldı; 29 Ağustos 2026 kararı («kitap PDF'i dağıtılmaz — telif») yürürlükte kaldı. Kaynak proje kaydı: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-09-20-ORNEK-DEFTERLER-VE-KITAPLAR.md`.
- OneDrive: kapsam dışı (örnek defterlerin tek kopyası D sürücüsündedir; 19 Eylül kararı).

## 19 Eylül 2026 — Belçika’dan dergi aboneliği araştırması

- Kullanıcı talebiyle TR/FR/EN yayın rehberi güncellendi; içerik commit'i `2b54e7c`.
- [Pages 35459124981](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35459124981): build ve deploy başarılı; üç canlı rehber HTTP 200, yeni resmî birim/teslimat şartları/e-posta bağlantıları doğrulandı.
- Yurt dışı birimi, üç adımlı başvuru ve örnek bilgi talebi eklendi. Portal üyeliğinin Belçika teslimat onayı olmadığı açıklandı. Güncel avro bedeli/posta ücreti teyit edilemedi; eski tarifeler kullanılmadı.
- `npm run dogrula:codex`: sekiz kapı geçti; 448 tarayıcı testi başarılı. Ek 12 rehber kontrolü (üç dil, iki genişlik, iki tema): taşma ve axe ihlali yok; masaüstü TR ve mobil FR ekran görüntüleri incelendi.
- Kanıtlar: `D:/tmp/ulucamii-belcika-abonelik-dogrulama-20260919.log`, `D:/tmp/abone-gorsel-20260919.json`, `D:/tmp/abone-canli-20260919.json`.
- Kaynaklar ve doğrulama sınırı: [Belçika araştırması](BELCIKA-DERGI-ABONELIGI.md). Abonelik açılmadı, ödeme yapılmadı, e-posta gönderilmedi.

## 19 Eylül 2026 — Diyanet içerikleri ve site hata düzeltmeleri

- Durum: yayımlandı ve canlı doğrulandı. Kullanıcının açık içerik/yayın talimatı.
- İçerik/teknik commit: `82871f2`; görsel referans ve son denetim: `d0c0d8f`.
- [Pages 35456237657](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35456237657): build ve deploy başarılı.
- [Hac kayıtları](https://ulucamii.be/tr/duyurular/2027-hac-kayitlari-devam-ediyor/): ön kayıt ve kesin kayıt son günü 30 Ekim. Ortak tarih kaynağı ve hizmet sayfaları düzeltildi; eski duyurular güncel takvime yönlendiriyor.
- [Taif ziyaretli Aralık umresi](https://ulucamii.be/tr/duyurular/taif-ziyaretli-aralik-umresi/): 20 Aralık–1 Ocak, son başvuru 20 Kasım; mevcut duyuru yenilendi.
- [Salih GÖR / Müşavirlik](https://ulucamii.be/tr/musavirlik-salih-gor/): TR/FR/EN kalıcı tanıtım; göreve başlama 20 Nisan 2026.
- [Yeni eğitim yılı mesajı](https://ulucamii.be/tr/duyurular/yeni-egitim-yili-birlikte-ogreniyoruz/): Diyanet'in 14 Eylül mesajından hareketle yerel kursa uyarlama.
- [Dergi aboneliği ve ücretsiz erişim](https://ulucamii.be/tr/diyanet-yayinlari-rehberi/): TR/FR/EN rehber, resmî dış abonelik temsilcilikleri/e-postaları ve anonim PDF erişimi. Belçika güncel ücret/posta bedeli açıkça doğrulanamadığından fiyat vaadi yok.
- [İslam İlmihali tanıtımı](https://ulucamii.be/tr/duyurular/diyanet-islam-ilmihali-tanitimi/): resmî tanıtım ve ürün künyesi; ücretsiz PDF iddiası yok.
- Teknik düzeltmeler: CMS alan eşleştirmesi, çeviride ad bütünlüğü/yanıt kontrolü, personel kartı kontrastı ve kenarlığı, geniş tabloda klavye erişimi.
- Doğrulama: toplu kapının web dışındaki adımları geçti; 442 web testi ve içerik nedeniyle yenilenen 6 görsel referans. Son rebase/build ardından normal modda 110/110 web testi; ek 54 içerik/görünüm kontrolü. Build: 900 sayfa.
- Canlı: 25/25 sayfa/dosya kontrolü; `govde.js` ve CMS yapılandırması SHA-256 eşit, çeviri paketindeki yeni kontrol mevcut. Kanıt: `D:/tmp/site-yayin-dogrulama-20260919.json`.
- Ayrıntılar ve sınırlar: [19 Eylül denetimi](HATA-AVI-2026-09-19.md). Öğrenci dosyaları ve özel işlem betikleri bu yayına alınmadı.

## 19 Eylül 2026 — 19–20 Eylül öğretici materyalleri

- Durum: tamamlandı. Önceki oturumun doğrulanmış sonucu bu kalıcı indekse aktarıldı.
- İçerik commit'i: `5b8bd5fd3979eaa6f6251672b8acaf373c13e9bb`.
- Değişen site dosyası: `src/data/ders-materyalleri.json`.
- Release: `ders-2026-09-19`, `ders-2026-09-20`; her birinde 13 dosya
  (plan PDF, üç öğrenci PPTX/PDF, üç öğretici PPTX/PDF).
- [Pages 35433895620](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35433895620): başarılı.
- Canlı [19 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-19),
  [20 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-20); TR/FR/EN bağlantı kontrolü geçti.
- `npm run dogrula:codex`: sekiz kapı ve 424 tarayıcı testi geçti.
  Yayın dosyalarının HTTP/SHA-256 eşitliği 26/26; mobil/masaüstü ve açık/koyu tema kontrolü geçti.
- Kaynak rapor: `belgeler/KALITE-DENETIMI-2026-09-19.md`.
  Kanıt: `scratchpad/denetim-2026-09-19/`.
- Sınır: fiziksel baskı/projeksiyon ve bütün ses/video içeriğinin yeniden dinleme/izleme provası yapılmadı.

## 19 Eylül 2026 — 26–27 Eylül öğretici materyalleri

- Durum: tamamlandı. Önceki oturumun doğrulanmış sonucu bu kalıcı indekse aktarıldı.
- İçerik commit'i: `fcc71bf3dfa4328c9e0539390f6384d30a1d62d0`.
- Değişen site dosyası: `src/data/ders-materyalleri.json`.
- Release: `ders-2026-09-26`, `ders-2026-09-27`; her birinde 13 güncel ve benzersiz dosya.
- [Pages 35440883908](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35440883908): başarılı.
- Canlı [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26),
  [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27).
- 134 öğretici slaydı öğrenciyle 1:1; notlar öğrenci PPTX'e işlendi. Altı öğretici PPTX/PDF.
  PowerPoint ölçümünde öğrenci/öğretici taşması 0; kaynak, süre, dil/punto denetimleri geçti.
- `npm run dogrula:codex`: sekiz kapı ve 424 tarayıcı testi geçti.
  Yayın dosyalarının HTTP/SHA-256 eşitliği 26/26; OneDrive yerel eşitliği 22/22.
  TR/FR/EN, 320/390/1440 px, açık/koyu tema kontrolleri geçti.
- Kaynak rapor: `belgeler/KALITE-DENETIMI-2026-09-26-27.md`.
  Kanıt: `scratchpad/hafta-2026-09-26/`.
- Sınır: fiziksel sınıf provası ve videoların baştan sona tekrar izlenmesi yapılmadı;
  OneDrive kanıtı yerel kopyadır, bulut eşitleme makbuzu değildir.

## 19 Eylül 2026 — 3–4 Ekim öğretici materyalleri ve yayın kayıt düzeni

Durum: tamamlandı. Son kayıt: 2026-09-19T17:01:40+02:00 (Europe/Brussels).

- İçerik commit'i: `8edf0232e6f3659fb61fbabea6702662249c9b57`.
- [Pages 35450386608](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35450386608): başarılı; canlı yayın ayrıca doğrulandı.
- Kalite kapılarının tümü geçti: ilk `dogrula:codex` koşusunda yedi kapı başarılı;
  iki klavye hatası `src/styles/global.css` içinde azaltılmış hareket kaydırmasıyla
  düzeltildi. Yeniden derleme, iki hedef test ve tam `test:web` tekrarı başarılı: 424/424.
  İlk başarısız koşu `site-kalite.log`, son başarılı koşu `site-web-final.log` içinde korunur.
- Dört Release'te 13'er benzersiz dosya; 52/52 indirme HTTP 200 ve SHA-256 eşleşmesi.
- Canlı TR/FR/EN: gün başına 13 bağlantı, altısı öğretici; 320/390/1440 px taşma yok.
  Açık/koyu tema ciddi/kritik erişilebilirlik ihlali 0; klavye erişimi başarılı.
- OneDrive yerel 44/44 dosya eşleşmesi; üretim/yerleşim/kaynak kontrolleri temiz.
- Canlı: [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26),
  [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27),
  [3 Ekim](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-03),
  [4 Ekim](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-04).

İşlem günü/saat dilimi: 19 Eylül 2026, Europe/Brussels.

- 3–4 Ekim: altı öğretici PPTX/PDF, toplam 138 slayt ve öğrenci sunucu notları tamamlandı.
- 26–27 Eylül ve 3–4 Ekim öğrenci PDF'lerinde video kapakları korundu.
  4 Ekim planı metin kaybı olmadan 16 sayfadan 14 sayfaya düzenlendi.
- Dört Release: `ders-2026-09-26`, `ders-2026-09-27`, `ders-2026-10-03`,
  `ders-2026-10-04`. Gün başına 13 dosya; 52/52 HTTP 200 ve SHA-256 eşleşmesi.
- OneDrive yerel kopyaları: 44/44 SHA-256 eşleşmesi.
- Altı öğrenci ve altı öğretici sunumunun PowerPoint yerleşimi temiz;
  dil/punto/not eşleşmesi ve sert materyal kapıları geçti.
- Yerel TR/FR/EN sayfalarında dört günün her birinde 13 dosya, altısı öğretici bağlantısı.
  320/390/1440 px taşma yok; açık/koyu tema ciddi/kritik erişilebilirlik ihlali yok;
  klavye erişimi çalışıyor.
- Site değişiklikleri: `src/data/ders-materyalleri.json`, `AGENTS.md`,
  `docs/PROJE-HAFIZASI.md`, `docs/YAYIN-KAYITLARI.md`, `src/styles/global.css`.
  Son dosyada azaltılmış hareket tercihi kök kaydırıcıya da uygulanır;
  kayıt sonrası klavyeyle kardeş kaydı bağlantısına geçerken ekran odağı izler.
- Kurs raporu: `belgeler/KALITE-DENETIMI-2026-10-03-04.md`;
  kanıt: `scratchpad/hafta-2026-10-03/`.
- Sınırlar: fiziksel sınıf provası, bütün seslerin yeniden dinlenmesi ve videoların
  baştan sona tekrar izlenmesi yapılmadı; OneDrive kanıtı yerel kopyadır.

Kayıt tamamlandı; salt devir belgesi commit’i bu içerik yayınına referans verir.

Kalıcı kural `AGENTS.md`, başvuru `docs/PROJE-HAFIZASI.md` ve bu dosyadır.
Kurs tarafında `AGENTS.md`, `CLAUDE.md`, `DEVAM.md`, `belgeler/YAYIN-KAYITLARI.md`
aynı kayıt düzenine bağlanır. İzole çalışma kopyası:
`D:/tmp/ulucamii-ogretici-yayin-20260919`; ana repodaki başka oturum değişiklikleri korunur.

## 19 Eylül 2026 — slayda gömülü oyunlar (20 Eylül–4 Ekim)

- Kapsam: 20/26/27 Eylül, 3/4 Ekim; 15 öğrenci ve 15 öğretici PPTX/PDF, beş plan PDF. Gün başına 13, toplam 65 Release dosyası.
- Sınıf oyunlarında ayrı kart/çıktı ve fiziksel hazırlık kaldırıldı; 18 oyun yerel PowerPoint cevap tetiğiyle sunuma gömüldü. Öğretici metinleri, sunucu notları, planlar ve 23 kısa TR/FR anlatım eşleştirildi; yedi resmî Diyanet FR kaynak bağlantısı eklendi.
- Kaynak proje: `D:/ulu-camii-kuran-kursu`; rapor `belgeler/KALITE-DENETIMI-GOMULU-OYUN-2026-09-19.md`; kanıt `scratchpad/oyun-2026-09-20/`.
- Site değişikliği: `src/data/ders-materyalleri.json`; adlar sabit, sürüm çoğaltılmadı.
- Portalın 19 Eylül haftalık tekrar notunda yalnız `odevler/2026-09-19.ezber.tr` alanındaki kart seçeneği kitap/defterle değiştirildi; eşzamanlı değişiklik önkoşulu ve canlı geri okuma doğrulandı. Diğer kayıtlar değiştirilmedi.
- İçerik commit'i `61bde97dcf563b04c3968c43f9eb6aceff147ae0`; Pages [35455560570](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35455560570) başarılı.
- Yayın sonrası kanıt: 65/65 canlı Release indirmesi HTTP 200 ve SHA-256 eşleşmesi; OneDrive yerel 55/55 SHA-256 eşleşmesi. TR/FR/EN canlı ve yerel kontrollerde her gün 13 bağlantı, altısı öğretici; 320/390/1440 px taşma 0, açık/koyu temada ciddi/kritik ihlal 0 ve klavye odağı geçer.
- Özel veli iletileri ve öğrenciye özel meşk defterleri kamuya açık yayına dahil edilmedi; kişisel bilgiler bu depoya alınmadı.

## 25 Eylül 2026 — Eğitim Kampanyası duyurusu (cuma sonrası yardım + 2027 hac hatırlatması)

- Tarih/saat: 25 Eylül 2026, 13:37 (Europe/Brussels) push; Pages yayını ~13:40.
- Kapsam: Müşavirliğin 21.09.2026 tarihli E-83253331-814-8175167 sayılı yazısı ve Müşavir Beyin 25 Eylül mesajı üzerine TR + FR duyuru `egitim-kampanyasi-2026` (kapak görseli, bugün vurgusu, Müşavirlik aktarım hesabı, resmî yazı PDF bağlantısı, 2027 hac kayıtları hatırlatması → `2027-hac-kayitlari-devam-ediyor`). 21 Eylül'deki `egitim-yardimi-kampanyasi-2026` duyurusu bununla birleştirildi; eski adres beş dilde `astro.config.mjs → redirects` ile yeni duyuruya yönlenir.
- Değişen yollar: `src/content/duyurular/{tr,fr}/egitim-kampanyasi-2026.md` (yeni), `src/content/duyurular/{tr,fr}/egitim-yardimi-kampanyasi-2026.md` (silindi), `astro.config.mjs`, `public/media/afisler/egitim-kampanyasi-2026{,-thumb}.webp` (SHA-256 `b0839ba0d8296c8e…` / `004f581a1c775333…`), ana sayfa görsel temel resimleri (6 PNG).
- İçerik commit'i `7675c6a42a97fbe659183a26b0dff2802d452849`; Pages [36130405303](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36130405303) başarılı.
- Testler: `npm run dogrula:codex` tamamı geçti (web 616/616; önceki koşuda yalnız ana sayfa görsel temel resimleri yeni gündem kartı nedeniyle farklıydı, `--update-snapshots` ile yenilendi).
- Canlı kontrol: `/tr/duyurular/egitim-kampanyasi-2026/`, `/fr/annonces/egitim-kampanyasi-2026/`, kapak WebP → HTTP 200; başlık, IBAN ve «30 Ekim 2026» metni sayfada; eski TR adresi `url=/tr/duyurular/egitim-kampanyasi-2026/` yönlendirmesi veriyor; `/tr/` ana sayfa gündeminde duyuru var.
- Sosyal medya: Facebook «Mosquée Ulu Camii» profilinde TR+FR gönderi (1080×1350 görsel, Public, zaman tünelinde doğrulandı) ve 24 saatlik durum (1080×1920). Görsellerin kaynağı oturum çalışma alanındaki HTML/Playwright üreticisi; depoya alınmadı.
- Açık sınırlar: duyuru 26 Eylül'de öne çıkandan düşer (`oneCikanSon`/`vitrinSon`). Toplanan tutar ve havale dekontu dernek başkanlığında; siteye yazılmaz.


## 26 Eylül 2026 — 26–27 Eylül derslerine hızlı başlangıç rehberi

- Tarih/saat: 2026-09-26T11:11:23+02:00, Europe/Brussels (+02:00); kullanıcının iki günü geliştirme ve webde güncelleme talimatı.
- Kapsam: iki günlük plan PDF'si 15→16 sayfa; TR/FR kitap/sayfa, hazırlık ve kısa değerlendirme rehberi eklendi. Aynı rehber ayrı PDF olarak sunuldu; sunumlar ve sesler değişmedi.
- Site dosyası: `src/data/ders-materyalleri.json`. Kaynak: `D:/ulu-camii-kuran-kursu/scripts/ders-plani-2026-09-26.js`, `ders-plani-2026-09-27.js`, `hizli-baslangic-pdf.py`, `onedrive-kopyala.sh`; iki günün plan DOCX/PDF ve ekler klasörleri.
- İçerik commit'i `43cc77d9aa9a2fa0f1cb487418672913cf84e548`; [Pages 36231817134](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36231817134) başarılı. Hazırlık → Release yükleme → push → başarılı deploy → canlı sayfa doğrulaması tamamlandı.
- Release etiketleri `ders-2026-09-26`, `ders-2026-09-27`; her biri 14 dosya. Gün başına güncel plan PDF + yeni rehber yüklendi, 12 mevcut dosya korundu. 28/28 canlı indirme HTTP 200 ve SHA-256 yerel dosyayla eşit.
- Canlı [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26), [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27); TR/FR/EN sayfalarda her güne 14 bağlantı ve bir rehber doğrulandı.
- Kontroller: materyal denetimleri temiz; 134 öğrenci/öğretici slayt eşleşmesi, 7 gömülü oyun denetimi, 32 plan sayfası ve altı sunum görsel incelemesi. OneDrive yerel 24/24 SHA-256 eşit; bulut eşitlemesi ayrıca teyit edilmedi.
- `npm run dogrula:codex`: design:check, check, dogrula, kurallar, veli-eposta, oto-kaydet, ogrenme geçti. Web 604 geçti / 12 ana sayfa görsel temel resim karşılaştırması başarısız; komut exit 1. Eski resimde ilk sıradaki din görevlisi sınav duyurusunun `vitrinSon`/`oneCikanSon` değeri 25 Eylül olduğundan 26 Eylül'de kurs duyurusu ilk sıraya geldi; gerçek/temel görüntüler karşılaştırılarak doğrulandı. Kapsam dışı temel resimler değiştirilmedi.
- Açık sınır: sınıfta fiziksel ses/projeksiyon ve güncel PowerPoint canlı tıklama denemesi yapılmadı. Kişisel veli/öğrenci verisi yayına dahil edilmedi.
- Kaynak rapor: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-09-26-HIZLI-BASLANGIC.md`; kanıt `scratchpad/hazirlik-2026-09-26/`. Kurs yayın indeksi ve DEVAM.md güncellendi. Bu kaydın belge commit'i ayrı izlenir.

## 26 Eylül 2026 (2) — veli portalı kuralları: e-postaya dayanan roller doğrulanmış e-posta ister

- Tarih/saat: 2026-09-26T23:39:07+02:00, Europe/Brussels; yalnız Firestore kural yayını (site/Pages yayını yok). Kullanıcının onayı («üçüne de evet»); Ezber Kilimi Faz 0 güvenlik denetiminin bulgusu.
- Kapsam: `aile()` ile `aileler` okuma/sahip güncellemesi ve `bildirimler` okuma/silme dalları artık `email_verified == true` ister (`dogrulanmis()`). Kapanan açık: hesap açma herkese açık olduğundan, henüz giriş yapmamış bir velinin adresiyle herkese açık web anahtarı üzerinden doğrulanmamış şifreli hesap açılıp aile rolü (çocuk verisine okuma) alınabiliyordu. uid'ye bağlı hoca rolü değişmedi.
- Değişen yollar: `firebase/firestore.rules` (SHA-256 `e77c4ecb1940d339…`), `tests/kurallar/firestore.test.mjs` (+2 test).
- İçerik commit'i `d6f791db75c7df7fa8eb4b986ef26ef817a151f2` (dal `ezber-kilimi`, çalışma ağacı `D:/tmp/ulucamii-ezber-kilimi`); aynı yama yerel `main`'e `ffd250b69b4f8946c1613fdb5dea3210503bb768` olarak alındı (`cherry-pick -x`, dosyalar birebir), böylece `main`'den yapılacak sonraki `npm run firebase:kurallar` düzeltmeyi geri almaz. Push yapılmadı.
- Yayın: `scripts/firebase-cami.ps1 deploy --only firestore:rules` (dernek hesabı; dizinler değişmediği için dahil edilmedi); önce `--dry-run` sunucu derlemesi temiz. Önceki kural kümesi 14 Eylül 2026 10:18'den beri yürürlükteydi ve `main` (`f10d03d`) ile birebir aynıydı.
- Yayın öncesi salt okunur sayım (yalnız sayı): 15 aile belgesi; 6 aile hesabı var, hepsinin e-postası doğrulanmış; 9 aile henüz giriş yapmamış (açık bu adresler için vardı); doğrulanmamış aile hesabı 0; ne aile ne hoca olan hesap 0. Kötüye kullanım izi yok; düzeltme hiçbir meşru veliyi dışarıda bırakmıyor.
- Testler: `npm run test:kurallar` eski kurallarla 43/44 (yeni «doğrulanmamış hesap» testi düşüyor = açığın kanıtı), yeni kurallarla 44/44. Faz 0 koşusu: design:check, check, dogrula, veli-eposta 58/58, oto-kaydet, ogrenme 10/10 geçti; web 604 geçti / 12 ana sayfa görsel temel resmi tarihe bağlı başarısız (bir önceki kayıttaki aynı sorun).
- Canlı kontrol 11/11: yürürlükteki kural kümesi dosyayla birebir; geçici `.test` hesabı (doğrulanmamış) → `aileler/<kendi adresi>` okuma, `bildirimler` ve `duyurular` sorguları 403 (düzeltmeden önce ilk ikisi izinliydi); geçici hesap yönetici API'siyle silindi ve silindiği sorgulandı; doğrulanmış sınama velisi → aynı üç erişim 200.
- Açık sınırlar: aileler öz güncelleme alanlarında ve hocanın yazdığı koleksiyonlarda tip/boyut doğrulaması yok (Ezber Kilimi Faz 1b'de ele alınacak). İstemci hesabı yalnız e-posta bağlantısıyla açar (doğrulanmış sayılır); ileride e-posta+şifreyle hesap açma eklenirse doğrulama e-postası akışı da gerekir. Kişisel veri kayda ve raporlara yazılmadı.

## 27 Eylül 2026 — Ezber Kilimi Faz 1: kurallar, hoca «Ezber» sekmesi, veli kilimi, Ezber Odası işaretleri

- Tarih/saat: 2026-09-27, Europe/Brussels (+02:00); kural yayını ≈15.15, push 15.18, Pages 15.18–15.20, canlı kontrol ve geçiş kuru koşusu 15.21–15.23. Rıdvan'ın «ne gerekiyorsa yap» talimatıyla onaylanan plan: kural yayını, `main`'e push, geçiş.
- Kapsam: Ezber Kilimi Faz 1a–1e (`ezber-kilimi` dalı, çalışma ağacı `D:/tmp/ulucamii-ezber-kilimi`): tek ezber kataloğu (81 madde), `ezberDurum` veri modeli ve kuralları, hoca ekranında «Ezber» sekmesi (Bugün/Tekrar/Tablo, dinleme paneli, geri al), veli portalında Ezber Kilimi kartı ve öğrenci kipinde «Kilimim», Ezber Odası çiplerinde basamak işaretleri; `egitim/` tasarım taslakları (siteye girmez); ana sayfa görsel testlerinin tarih bağımsız maskesi. Yerel `main`'de bekleyen `ffd250b` (26 Eylül kural düzeltmesi; canlıda zaten yürürlükteydi) ve `3130f39` (onun yayın kaydı) da bu push'la uzak depoya geçti.
- İçerik commit'i: `5b63366` (`origin/main` `ed3f6cc` birleştirmesi: 27 Eylül namaz vakitleri). Push `ed3f6cc..5b63366` (hızlı ileri).
- Kurallar: `npm run firebase:kurallar -- --dry-run` sunucu derlemesi temiz → `npm run firebase:kurallar` («released rules firebase/firestore.rules to cloud.firestore», «Deploy complete!»; dizin dosyası değişmedi, aynen yeniden yazıldı). Dosya SHA-256 `7e9917b260de45bf…`. Yayından önce yürürlükteki kural kümesi 26 Eylül yayınıyla bayt bayt aynıydı (`e77c4ecb…`, 26 Eylül 21:39 UTC).
- Pages: [36321927828](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36321927828) başarılı (13:18:17Z–13:20:27Z).
- Canlı kontrol (salt okuma, herkese açık dosyalar): `/hoca/`, `/tr/veli-portali/`, `/fr/portail-parents/`, `/en/parents-portal/` HTTP 200. Bağlanan 16 paket tarandı: `hoca-ezber.DOV1ewqJ.js` ve `veli-ezber.Cn8Qy_iK.js` dahil 12 paket yerel derlemeyle bayt bayt aynı. Hoca ve veli giriş paketleri ile ders defteri paketinin adı farklı çıktı: boyları aynı, fark yalnız içe aktarma sırası ve küçültülmüş değişken adları (CI Linux, yerel Windows derlemesi). Taramadaki tek 404 betiğin yanlış eşleşmesi (`katalog.schema.json` dizesi), sitede böyle bir dosya aranmıyor.
- Geçiş: `scripts/ezber-gecis.mjs` kuru koşu (hoca hesabıyla, kurallardan geçerek; çıktı yalnız sayı): taranan öğrenci 3, eski ezber kaydı olan 0, yazılacak 0, engel 0. Yazacak kayıt olmadığından `--yaz` çalıştırılmadı. Yeni sistem hoca «Ezber» sekmesinden kayıt açtıkça dolar.
- Testler (`5b63366`, `npm run dogrula:codex`, çıkış 0): design:check, check, dogrula (kimlik 31, ezber 58, svg 10, ihtida 33, kayıt 23, düzelt 6, günlük 4, kalıplar 10, çeviri 10, eksik 2, gas-çeviri 6, seviye 51, dinleme 7; derleme ve site denetimi), web 664/664, kurallar 54/54, veli-eposta 58/58, oto-kaydet 14/14, öğrenme 10/10. Görsel spec ayrıca iki koşuda 24/24.
- Açık sınırlar: yayından sonra yürürlükteki kural kümesinin dosyayla bayt bayt karşılaştırması o sırada yapılamadı (otomatik izin denetimi bu okumayı reddetti); aynı akşam 20.26'da yapıldı: kural kümesi `8e30e838…` (13:16:40Z), canlı ve yerel sha256 `7e9917b260de45bf…`, «birebir: True» (bkz. «27 Eylül 2026 (4)»). Hoca ekranı ve veli portalında gerçek hesapla canlı tıklama sınaması yapılmadı (gerçek öğrenci verisi görüntülenmez). egitim.ulucamii.be Hosting/DNS/Auth adımları ayrı onaydadır. Ana depodaki `D:/app/ulucamii-site` çalışma kopyasına bu oturumdan dokunulmadı; orada `git pull --ff-only` yeter. Kişisel veri kayda yazılmadı.

## 27 Eylül 2026 (2) — egitim.ulucamii.be yayında (Ezber Kilimi girişi, Firebase Hosting); Faz 1f ana sitede

- Tarih/saat: 2026-09-27, Europe/Brussels (+02:00). Hosting sitesi 17.47, ilk yayın 17.49, web.app canlı denetimi 17.50, özel alan adı 17.50, bNamed DNS kaydı 17.58, `main` push 18.00, Pages 18.01–18.03, alan adı canlı denetimi 18.15 (geçerli sertifikayla); Firebase sertifika durumu 19.50'de `CERT_ACTIVE`, uptime yoklaması 20.01'de `main`'de (bkz. «27 Eylül 2026 (3)»). Rıdvan'ın onayladığı plan («egitim.ulucamii.be canlıya alınmasını planla, devam et»): Hosting sitesi ve yayın, özel alan adı, bNamed'de yalnız Firebase'in istediği kayıt, `main`'e push.
- Kapsam — egitim.ulucamii.be (yeni; Firebase Hosting sitesi `ulucamii-egitim`, proje `ulucamii-portal`, Spark): Ezber Kilimi giriş sayfası beş dilde (`/tr/`, `/fr/`, `/en/`, `/nl/`, `/de/`), kökte dil yönlendirmesi, 404, simgeler, beş paylaşım kartı, `robots.txt`, site haritası; `firebase.json`'daki sıkı CSP ve güvenlik başlıkları; HTML `no-cache`, `_astro` bir yıl, yazı tipleri bir hafta. Sesler ana siteden (`https://ulucamii.be/media/ses/…`), Hosting kotasını harcamaz.
- Kapsam — ulucamii.be (Pages): Faz 1f ve barındırma commit'leri `main`'e geçti. Sitede görünen tek değişiklik veli kilimindeki madde başlığı virgülü (yeni paket `veli-ezber.CUuodZ9n.js`).
- İçerik commit'leri: `e9efb5a` (Faz 1f `egitim/` iskeleti), `8e483ad` (Hosting yapılandırması, CSP, simgeler, paylaşım kartı, site haritası). Push `6d75307..8e483ad` (hızlı ileri).
- Hosting: `npm run egitim:yayinla` (astro check + derleme + `test:egitim` + dernek sarmalayıcısıyla `deploy --only hosting:ulucamii-egitim`): 29 dosya yüklendi, «release complete». Sürüm `0d447d32acfe6076` (API kaydı: 31 dosya, 794 116 bayt; yayını yapan `ulucamii2026@gmail.com`), yayın 15:49:53Z.
- Özel alan adı: firebase-tools 15.30.1'de komut olmadığından Hosting REST API v1beta1 `customDomains` ile eklendi (beceri betiği `egitim-alan-adi.py ekle`; işlem `c2eb245c-4f23-4e76-97ef-e123592786fa`, 15:50:50Z). Firebase'in istediği tek kayıt: CNAME `egitim` → `ulucamii-egitim.web.app` (sahipliği de bu kayıt kanıtlar; A/TXT istenmedi).
- DNS (bNamed, dernek hesabı, 15:58Z): CNAME `egitim` → `ulucamii-egitim.web.app.` eklendi («Mise à jour continué avec succès»). Kayıt sayısı 19 → 20. Sayfa yeniden yüklenerek karşılaştırıldı: öbür 19 kayıt (GitHub Pages A/AAAA, Purelymail MX/SPF/DKIM/DMARC, Brevo DKIM/TXT, `ihtida` CNAME) birebir aynı. Cloudflare ve Google DoH 18.00'de, beş yetkili ad sunucusu 18.08'de yeni kaydı veriyordu (TTL 901). Oturum kapatıldı.
- Sertifika: Firebase'in ilk DNS denetimi kayıttan 7 sn önceydi (15:58:24Z; olumsuz yanıt SOA gereği 901 sn önbellekte). 16:08:55Z denetimi kaydı buldu → 16:10Z `HOST_ACTIVE` + `OWNERSHIP_ACTIVE` → 16:15Z `CERT_PROPAGATING` → 17:50Z yoklamasında `CERT_ACTIVE` (17:45Z'de hâlâ yayılıyordu; yayılma yaklaşık 1,5 saat; `egitim-alan-adi.py bekle` üç durumu etkin görünce 0 ile çıktı). Sunulan sertifika: Google Trust Services WR3 (kök GTS Root R1), yalnız `egitim.ulucamii.be`, geçerlilik 27 Eylül 2026 15:12Z – 26 Aralık 2026 15:51Z (90 gün; Firebase kendisi yeniler), TLS 1.3, doğrulama başarılı.
- Pages: [36331647342](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36331647342) başarılı (build 16:00:59Z–16:02:22Z, deploy 16:02:25Z–16:03:38Z).
- Canlı kontrol — `npm run egitim:canli -- https://ulucamii-egitim.web.app` 33/33 (15:50:17Z) ve `npm run egitim:canli -- https://egitim.ulucamii.be` 33/33 (16:15:50Z): beş güvenlik başlığı `firebase.json` ile birebir, HSTS (Hosting; özel alan adında `max-age=31556926`, web.app'te ayrıca `includeSubDomains; preload`), önbellek süreleri, `/tr` → `/tr/` 301, 404, kök, `robots.txt`, site haritası (5 adres), simgeler ve beş kart; tarayıcıda beş dilde CSP ihlali ve konsol hatası 0; gerçek sesle çal düğmesi (`https://ulucamii.be/media/ses/ayet/1-0.mp3` 206, çalıyor); fr-BE kök yönlendirmesi `/fr/`.
- Canlı kontrol — ana site (salt okuma): `/hoca/` ve üç veli portalı sayfası HTTP 200. Bağlanan 16 paketin 12'si yerel derlemeyle bayt bayt aynı; `veli-ezber.CUuodZ9n.js` ve `hoca-ezber.DOV1ewqJ.js` bunların içinde. Hoca ve veli giriş paketleri ile ders defteri paketinin adı CI (Linux) derlemesinde farklı; önceki kayıttaki durumun aynısı. Tek 404, betiğin `katalog.schema.json` dizesini yanlış eşleştirmesi. Kök CSS `Base.By4CExX6.css` canlıda ve yerelde aynı.
- Uptime: «Eğitim sitesi» yoklaması (`https://egitim.ulucamii.be/tr/`, beklenen metin «Ezber») `.github/workflows/uptime.yml`'e `CERT_ACTIVE` görüldükten sonra ayrı commit'le eklendi: `edb5ce3`, push 20.01 (bekletmenin gerekçesi: sertifika yayılırken bir uç sunucu eski sertifikayı verirse sahte uyarı e-postası giderdi). Eklemeden önce aynı yoklama elle denendi: 200, TLS doğrulaması başarılı, «Ezber» var. İlk zamanlanmış koşunun sonucu «27 Eylül 2026 (3)» kaydında.
- Testler (`8e483ad`, `npm run dogrula:codex`, çıkış 0): 10/10 adım; web 664/664; egitim birim 15/15, ekran 46 + 2 bilinçli atlama; kurallar 54/54.
- Açık sınırlar: Auth yetkili alanı ve `authDomain` Faz 3'e kaldı (egitim'de giriş yok). Ana siteden bağlantı ve duyuru yok; karar Rıdvan'da (bağlantı aynı akşam Rıdvan'ın isteğiyle eklendi: «27 Eylül 2026 (3)»; duyuru yok). Egitim'de ziyaret sayacı yok (GoatCounter'ın `/tr/` yolları ana siteyle çakışır). Hosting yayını elle (`npm run egitim:yayinla`); Actions ile yayın yok. Kişisel veri kayda yazılmadı.

## 27 Eylül 2026 (3) — ana siteden egitim.ulucamii.be bağlantısı (menü, altbilgi, Kur'an kursu kartı); uptime yoklaması

- Tarih/saat: 2026-09-27, Europe/Brussels (+02:00). Push 20.01, Pages 20.01–20.03, canlı kontrol 20.04. Rıdvan: «ana siteye egitim.ulucamii.be bağlantısı ekle» (aynı oturumdaki «ne gerekiyorsa yap, full otonom» talimatıyla yayın dahil). Uptime satırı, «27 Eylül 2026 (2)» kaydındaki `CERT_ACTIVE` koşuluna bağlı bekleyen adımdır.
- Kapsam — ulucamii.be (Pages), beş dilde üç yer: (1) menünün «Eğitim» grubunda «Ders günlüğü»nden sonra platformun başlığıyla madde — «Ezber Kilimi ↗» (FR «Kilim de mémorisation», EN «Memorisation kilim», NL «Memorisatiekelim», DE «Memorier-Kelim»); ekran okuyucu alan adını da okur; (2) altbilgi «Bağlantılar»da `egitim.ulucamii.be ↗`; (3) Kur'an kursu sayfasının yan sütununda kısa tanıtımlı kart ve alan adlı düğme. Hedef ziyaretçinin dilindeki giriş sayfası (`https://egitim.ulucamii.be/<dil>/`); adres yalnız `src/i18n/utils.ts`'te. Duyuru yayımlanmadı. egitim.ulucamii.be'nin kendisi değişmedi (Hosting yayını yok).
- Değişen yollar: `src/i18n/utils.ts`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/sayfalar/KuranKursu.astro`, `tests/web/site.spec.mjs`; ayrıca `.github/workflows/uptime.yml`.
- İçerik commit'leri: `114c1e4` (bağlantılar), `edb5ce3` (uptime yoklaması «Eğitim sitesi»: `https://egitim.ulucamii.be/tr/` → 200 ve «Ezber»). Push `8cf78d6..114c1e4` (hızlı ileri).
- Pages: [36339078609](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36339078609) başarılı (build 18:01:16Z–18:02:39Z, deploy 18:02:43Z–18:03:10Z).
- Canlı kontrol (18:04:25Z, salt okuma) 20/20: beş dilde ana sayfa ve Kur'an kursu sayfası HTTP 200; bağlantı sayısı yerel derlemeyle aynı (ana sayfada 3: masaüstü menü, mobil menü, altbilgi; kurs sayfasında 4: ayrıca kart); kök CSS `Base.By4CExX6.css` canlıda ve yerelde aynı (değişmedi); beş hedef adres (`https://egitim.ulucamii.be/<dil>/`) HTTP 200.
- Uptime ilk zamanlanmış koşusu: BEKLENİYOR.
- Testler (`114c1e4` içeriği, `npm run dogrula:codex`, çıkış 0): design:check, check, dogrula (kimlik 31, ezber 58, svg 10, ihtida 33, kayıt 23, düzelt 6, günlük 4, kalıplar 10, çeviri 10, eksik 2, gas-çeviri 6, seviye 51, dinleme 7; derleme ve site denetimi), web 674/674 (10'u yeni: «egitim.ulucamii.be bağlantısı», beş dil × masaüstü/mobil: menü maddesi görünür ve erişilebilir adı doğru, altbilgi, kurs kartı, yatay taşma yok), egitim birim 15/15 ve ekran 46 + 2 bilinçli atlama, kurallar 54/54, veli-eposta 58/58, oto-kaydet 14/14, öğrenme 10/10. Görsel inceleme: açılır menü (TR/FR açık, TR koyu), mobil menü (TR), kurs kartı (TR/FR masaüstü, NL mobil), altbilgi (TR/FR masaüstü, NL mobil).
- Açık sınırlar: menü maddesinin adı platformun şimdiki tek bölümüdür (Ezber Kilimi); platform ikinci bölümünü açınca genel bir ad verilecek. Duyuru kararı: Faz 2 madde sayfalarıyla (bkz. «27 Eylül 2026 (4)»). Ana depodaki `D:/app/ulucamii-site` çalışma kopyasına dokunulmadı (`git pull --ff-only` yeter). Kişisel veri kayda yazılmadı.

## 27 Eylül 2026 (4) — Fransızca sayfalarda Fransız yazım kuralı; tarihlerde ay adı küçük; namaz gün kartı taşması; iş akışı saatleri

- Tarih/saat: 2026-09-27, Europe/Brussels (+02:00). Push 21.05, Pages 21.05–21.07, canlı kontrol 21.08. Rıdvan: «ne yapman gerekiyorsa yap, bütün yetki ve karar sende» (önceki rapordaki açık kalemler ve bekleyen kararlar; yayın dahil).
- Kapsam — ulucamii.be (Pages):
  1. Fransız yazım kuralı (yeni): Fransızca sayfalarda «;», «!», «?» öncesindeki düz boşluk ince bölünmez boşluğa (U+202F), «:» öncesindeki ve «…» tırnaklarının iç kenarındaki düz boşluk bölünmez boşluğa (U+00A0) döner; noktalama satır başına düşmez. Derleme anında Astro ara katmanıyla (`src/middleware.ts` → `src/lib/fransiz-tipografi.ts`), yalnız metin düğümlerinde: etiket ve öznitelikler, yorumlar, `script`/`style`/`textarea` içeriği ve `pre`/`code`/`template`/`astro-island` altı olduğu gibi kalır; boşluk yoksa eklenmez. Sayfa dili `<html lang="fr…">`'den okunur (`/e/<kod>/` kısa kod sayfaları dahil). Kural egitim.ulucamii.be ile aynı. Etki: 379 Fransızca sayfanın 216'sı; 691 ince, 1 482 bölünmez boşluk.
  2. Mevcut hata — tarihlerde büyük harf: CSS'in sözcük başı büyük harf dönüşümü her sözcüğü büyütüyordu («Dimanche 27 Septembre», «Zondag 27 September»); Fransızca ve Felemenkçede ay adı küçük yazılır. Artık yalnız ilk harf, dile duyarlı (`src/i18n/utils.ts` → `ilkHarfBuyuk`): namaz adacığı, namaz sayfası gün kartları, irşat, ders materyalleri. Tek sözcüklük ay ve gün etiketleri olduğu gibi kaldı. Namaz adacığında Fransızca «Hégire :» (bölünmez boşluk; adacık metni derleme dönüşümünün dışındadır).
  3. Mevcut hata — namaz gün kartı: namaz sayfasının mobil gün kartında etiket ve saat üç sütunlu hücreye sığmayınca saat yandaki hücreye taşıyordu (360 px'te Türkçe dahil her dilde; 390 px'te «MAGHRIB» saati «ISHA» hücresine). Hücre artık sarılır, saat sağa yaslı alt satıra geçer; Almanca «Sonnenaufgang» ve Felemenkçe «Zonsopgang» yumuşak tireyle bölünür (`src/i18n/ui.ts`).
  4. İş akışı saatleri: uptime yoklaması `*/30` yerine her saatin 13. ve 43. dakikasında. 21–27 Eylül ölçümü: 60 zamanlanmış koşu, ortanca aralık 2,5 saat, en uzun 6 saat (GitHub zamanlanmış koşuları yoğun saat başı ve yarım saatlerde geciktirip düşürüyor). Günlük yayına 23.11 UTC koşusu eklendi: 03.30 koşusu 23 Eylül'den beri 5–6 saat geç başlıyordu; «bugün» Europe/Brussels'e göre hesaplandığından Brüksel gece yarısından sonraki ilk koşu yeter; 03.30 yedek olarak kaldı.
  5. Kararlar (belgeler): Salât-ı ümmiye Ezber Kilimi kataloğuna eklenmez (`docs/EZBER-KILIMI.md` «Onay durumu» 5; metin TDV İslâm Ansiklopedisi ile doğrulandı; 24 Eylül revizyonundan, `a4b802b`, beri yıllık planda yok; planın salavat ezberi Salli ve Bârik katalogda). egitim.ulucamii.be duyurusu Faz 2 madde sayfalarıyla yapılacak (`docs/EGITIM-PLATFORMU.md`; 81 maddenin 27'si sesli, metin ve çalışma kipleri Faz 2'de).
- Değişen yollar: yeni `src/lib/fransiz-tipografi.ts`, `src/middleware.ts`, `tests/fransiz-tipografi.test.mjs`; değişen `package.json` (`test:tipografi`, `dogrula`'da derlemeden sonra), `src/i18n/utils.ts`, `src/i18n/ui.ts`, `src/components/NamazVakitleri.tsx`, `src/sayfalar/Namaz.astro`, `src/sayfalar/Irsat.astro`, `src/sayfalar/DersMateryalleri.astro`, `tests/web/site.spec.mjs`, `.github/workflows/uptime.yml`, `.github/workflows/deploy.yml`, `docs/EZBER-KILIMI.md`, `docs/EGITIM-PLATFORMU.md`.
- İçerik commit'leri: `c152cab` (iş akışı saatleri), `6b4d2cf` (Fransız yazım kuralı), `5f960f5` (tarih büyük harfi, gün kartı), `f8db3ca` (karar belgeleri). Push `6330c8b..f8db3ca` (hızlı ileri).
- Pages: [36343070668](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36343070668) başarılı (build 19:05:33Z–19:06:57Z, deploy 19:07:00Z–19:07:30Z).
- Canlı kontrol (19:08Z, salt okuma), hepsi tamam: `/fr/`, `/fr/ecole-coranique/`, `/fr/horaires-de-priere/`, `/fr/contact/`, `/e/asr/` HTTP 200 ve Fransızca; dönüşüm canlı sayfaya yeniden uygulandığında hiçbir şey değişmiyor (dönüşmemiş metin yok). Canlıda her sayfada yerelden bir fazla U+202F var: CI derlemesindeki ziyaret sayacının fr-BE binlik ayırıcısı («1 191 pages vues»; yerel derlemede sayaç verisi yok). `/tr/`'de U+202F yok. FR ve NL namaz sayfalarında gün adı büyük, ay adı küçük; DE «Sonnenaufgang» yumuşak tireli; gün kartı hücresi sarılır. Kök CSS `Base.U71mI1sJ.css` canlıda ve yerelde aynı (öncesi `Base.By4CExX6.css`; fark yalnız kullanılmayan büyük harf yardımcı sınıfının düşmesi ve kart hücresinin yeni aralık sınıfı). «27 Eylül 2026 (3)» kaydının egitim bağlantı denetimi yeniden koşturuldu: hepsi tamam.
- Kural karşılaştırması («27 Eylül 2026» Faz 1 kaydındaki açık kalem): 20.26'da `kural-karsilastir.py` (salt okuma, dernek hesabı) → yürürlükteki kural kümesi `8e30e838-a21a-4efb-b0d7-e9851a192cd4` (oluşturma 13:16:40Z), canlı ve yerel SHA-256 `7e9917b260de45bf…`, «birebir: True».
- Testler (`f8db3ca` içeriği, `npm run dogrula:codex`, çıkış 0): design:check, check, dogrula (kimlik 31, ezber 58, svg 10, tipografi 7 (yeni), ihtida 33, kayıt 23, düzelt 6, günlük 4, kalıplar 10, çeviri 10, eksik 2, gas-çeviri 6, seviye 51, dinleme 7; derleme ve site denetimi), web 688/688 (14'ü yeni: FR ve NL tarihlerinde büyük harfli ay adı yok — `innerText` ile, CSS dönüşümü dahil — iki dil × masaüstü/mobil; 360 px'te gün kartı hücresinde etiket ve saat sığar, üst üste binmez — beş dil × masaüstü/mobil), egitim birim 15/15 ve ekran 46 + 2 bilinçli atlama, kurallar 54/54, veli-eposta 58/58, oto-kaydet 14/14, öğrenme 10/10. Görsel inceleme: FR ana sayfa, Kur'an kursu, `/e/asr/` ve namaz sayfası (masaüstü/mobil); namaz gün kartı 360 px'te TR, FR, DE; NL kart masaüstü.
- Açık sınırlar: istemci tarafında üretilen metinler (Preact adacıkları, veli portalı ve hoca ekranı betikleri) derleme dönüşümünün dışında; oradaki Fransızca metinler elle düzeltilir. Saat değişikliklerinin etkisi sonraki günlerde ölçülecek (uptime aralıkları; 23.11 UTC yayın koşusunun başlama saati). Türkçe 360 px gün kartında bazı hücreler iki satıra iner (okunaklı, taşma yok). Ana depodaki `D:/app/ulucamii-site` çalışma kopyasına dokunulmadı (`git pull --ff-only` yeter). firebase-tools güncellemesi ertelendi. Kişisel veri kayda yazılmadı.

## 28 Eylül 2026 — hoca portalındaki Camiye Gidiyorum kitapları 28 Eylül sürümüyle yenilendi (yalnız ön kapaklar)

- Zaman: 28 Eylül 2026 07:05 (istek) – 08:15 (Europe/Brussels, CEST). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («bu kitapları hoca portalındaki kitaplar güncellenecek, bunlar güncel»; dört PDF yolu verildi).
- Kapsam: `/hoca/ → Ders kitapları` bölümündeki dört PDF, teslim klasörünün (`Downloads/Camiye Gidiyorum/Güncel Kitaplar`) 28 Eylül sürümüyle değiştirildi. Klasördeki `BASKI_NOTLARI.md`'ye göre yalnız ön kapaklar değişti (TR ve FR kapak tasarımı eşleştirildi, üst-alt beyaz şeritler giderildi); diğer sayfalar aynı. TR1 228 s. / 88 648 802 B, FR1 228 s. / 99 477 220 B, TR2 270 s. / 120 541 855 B, FR2 270 s. / 72 302 208 B. Kaynak özetleri klasördeki `SHA256.txt` ile birebir; dört ön kapak görsel olarak denetlendi. Kimlikler `…-20260923` → `…-20260928`; eski 25 şifreli parça silindi, 25 yeni AES-256-GCM parçası ve her kitap için yeni bağımsız anahtar üretildi. Açık PDF, anahtar ve kişisel veri Git'e girmedi. Mekanizma, Firestore kuralı ve hoca rolü değişmedi ([HOCA-KITAPLARI.md](HOCA-KITAPLARI.md)).
- Değişen dosyalar: `public/media/hoca-kitaplari/` (−25 / +25 `.bin`), `src/data/hoca-kitaplari.json`, `docs/HOCA-KITAPLARI.md`. Yardımcılar (Git dışı, `.codex/`): `kitap-yenile-20260928.py`, `kitap-yayin-20260928.py` (23 Eylül betiklerinden yalnız tarih sabitleri değişti), `kitap-tarayici.mjs` (çıktı adları 20260928); eski anahtar dosyası `hoca-kitap-anahtarlar-eski-20260923.json` olarak yerelde yedeklendi; kullanıcı kararı bize bırakınca («bütün yetki ve karar senin») 23 Eylül'e ait yardımcı ve çıktı dosyalarıyla birlikte silindi.
- İçerik commit'i `e901389` (37 dosya; `origin/main`'in 58 yeni commit'i üzerine rebase, çakışma yok; push `d3dbb5c..e901389`, ≈380 MB). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36383985757> — **success** (05:57:21 UTC = 07:57 CEST). Yerel `dist` 757 MB (Pages 1 GB sınırının altında). GitHub depo boyutu API'ye göre ≈1,46 GiB (23 Eylül sonrası ≈1,1 GB).
- Yerel doğrulama: `.codex/kitap-yayin-20260928.py` dört kitabı parçalardan çözüp kaynak PDF özetiyle eşledi; `npm run test:ogrenme` 10/10 (rebase öncesi ve sonrası); `npm run build` 1890 sayfa; `tests/web/hoca-kitaplari.spec.mjs` 2/2 (masaüstü + mobil, axe); önizlemeden (4401) gerçek tarayıcı indirmesi 4/4 SHA-256 eşleşti (`kitap-tarayici-sonuc-20260928.json`, ekran görüntüleri `.codex/kitaplar-{mobile,desktop}-20260928.png`). 4401 portu başka bir oturumun tam Playwright koşusundaydı; ona dokunulmadı, port boşalınca testler çalıştırıldı ve bu işin önizleme sunucusu kapatıldı.
- Firestore (dernek, `ayarlar/hocaKitaplari`): önce eski ∪ yeni 8 anahtar (sürüm 4, canlı site kesintisiz), yayın ve canlı doğrulama sonrası yalnız yeni 4 anahtar (sürüm 5); yazım sonrası geri okundu; oturumsuz erişim 401/403.
- Canlı doğrulama (`--canli`): 25 parça `https://ulucamii.be` üzerinden indirildi, dört PDF özeti eşleşti (`.codex/kitap-canli-20260928.log`); eski `…-20260923` parçaları canlıda yok (HEAD ≠ 200); `/hoca/` betiklerinde yalnız yeni dört kimlik.
- Açık sınırlar: fiziksel cihazda hoca hesabıyla indirme denenmedi (aynı kod yolu Playwright ile doğrulandı). Kitap içeriği bu işte incelenmedi (yalnız ön kapaklar görsel olarak). Eski 25 parça Git geçmişinde kalır ama hiçbir anahtarla çözülemez (Firestore'dan ve yerelden silindi). Depo boyutu kararı [HOCA-KITAPLARI.md](HOCA-KITAPLARI.md) «Depo boyutu kararı»nda: geçmiş yeniden yazılmaz; Release dosyaları CORS başlığı göndermediği için elendi; sonraki yenilemede parçalar ayrı bir Pages deposuna taşınır.

## 1 Ekim 2026 — Mühtedi Hizmetleri Envanteri kapalı yayımlandı; Apps Script v42

- Zaman: 01.10.2026 13:24 · Europe/Brussels (CEST). **GAS canlıda, form KAPALI.** Dayanak: sahibin 01.10.2026 onayı ve tam otonom devam yetkisi; açılış Müşavir onayıyla.
- Kapsam: yalnız Türkçe /envanter/; noindex, menüde/site haritasında yok; sayfada telefon metni/telefon bağlantısı yok. envanter-isleri.gs + EnvanterVeri paketi; ENVANTER_AYAR ve ENVANTER_TABLO_ID; 64 KiB gövde sınırı, 30/10 dakika ve 200/gün sınırı, e-posta gönderimi yok. Silme günü geçince Bildirim satırları, 183 günden eski Görevli satırları temizlenir; Sheets sürüm geçmişi ayrı kapanış işi olarak kalıcı dosya silmeyi gerektirir. Beş gizlilik sayfasında Saha envanteri bölümü.
- Değişen yollar: src/pages/envanter/, src/components/formlar/EnvanterFormu.astro, src/scripts/envanter-form.ts, src/lib/envanter/, src/i18n/formlar/envanter-tr.ts, src/data/envanter-bolgeleri.json; scripts/apps-script/envanter-isleri.gs, ulucamii-Kod-v42.gs, veli-mail-listesi.gs; GAS derleyicisi, ortak form çekirdeği/düzen/stiller, beş gizlilik sayfası, ilgili testler ve README.
- İçerik commit'i: 9b6f62e21d56aaf11d2daae77448310461422eaf (1c8b89a günlük namaz verisi üzerine çakışmasız rebase; push hızlı ileri). Dernek GitHub/Google kimliği doğrulandı.
- Pages: https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36854541510 — completed / success (build + deploy).
- GAS paketi: 8700829 B; SHA-256 f5b1ae21456e98dee444d86e313b5fa62999b4fe796801d88969a8b6f4bb4aa1. Editöre yazım sonrası yeniden okuma paketle birebir aynı. Canlı sağlık: surum 42, envanter.acik false, veriSorumlusu/kapanis null. ENVANTER_AYAR yazılmadı.
- Önceki kaynak kapısı: ilk fc bayt karşılaştırması LF/CRLF nedeniyle farklı çıktı. 5469 satır sonu dışında hiçbir fark yok; normalize edilmiş dosyada fc çıkış 0. Normalize SHA-256 23d2140839febf4bf66fdeae3018c62beaec49ada7d9f5050f19faa212478b2b. Sahibin tam otonom devam onayıyla bu kanıt esas alındı; canlı kod değişikliği yoktu. Ham kaynaklar ve kanıtlar D:/tmp/gas/ altında korundu.
- Bu oturum doğrulaması: build 1892 sayfa, check 0 hata/0 uyarı (300 ipucu), test:envanter 18/18, envanter Playwright 8/8. Devirdeki önceki doğrulamalar: diğer form Playwright 132/132 ve Node 561/561; bu oturum tekrar çalıştırılmadı. Tam test:web/dogrula:codex çalıştırılmadı.
- Canlı https://ulucamii.be/envanter/ HTTP 200, noindex true, tel: false; robots.txt içindeki sitemap-index.xml ve sitemap-0.xml kontrol edildi: /envanter/ yok. Mobil 390 px ve masaüstü 1440 px gerçek canlı tarayıcıda kapalı mesajı görünür, form oluşmuyor, yatay taşma yok. Ekran görüntüleri D:/tmp/gas/envanter-canli-{mobil,masaustu}.png.
- Açık sınır: Rıdvan'a fiziksel telefon kontrolü isteği iletildi; yanıt henüz alınmadı. Canlı TESTOGLU gönderimi yapılmadı; açılış günü yapılır. Açılış, erişim paylaşımı ve kalıcı silme işleri Müşavir onayından sonra E kapsamında.


## 1 Ekim 2026 — envanter açılışı ve geçici sağlık ağ hatasında yeniden deneme

- Zaman: 01.10.2026 15:59 (Europe/Brussels); durum: **GAS v42/açık, site yayımlandı ve canlı doğrulandı**. Dayanak: sahibin formu bağlantıya sahip herkesin görüp doldurmasına açma talimatı ve kurum seçimi dahil tam karar yetkisi. Bu kayıt kurumsal duyuru/Müşavirlik onayı alınmış olduğu iddiası taşımaz.
- Pilot veri sorumlusu **Ulu Camii Derneği**. `ENVANTER_AYAR`: açık; son kabul 22.10.2026, kalıcı silme son günü 21.11.2026. Ayar kaydı yeniden okunarak doğrulandı; sağlık `surum=42, envanter.acik=true`. Bu yayında GAS kaynak/dağıtım sürümü değişmedi.
- Kamuya açık form: https://ulucamii.be/envanter/ . Google/site hesabı gerekmez; noindex, menü ve site haritası dışı düzen sürer. Cevap tablosu yayımlanmadı: klasör ve tablo paylaşım penceresinde **Kısıtlı / yalnız dernek hesabı** doğrulandı. Dosya/klasör kimliği ve cevaplar bu kayda yazılmadı.
- Gerçek Google sağlık isteği bazı yüklemelerde 20 saniyelik ağ zaman aşımı nedeniyle kapalı görünüm oluşturdu. `src/scripts/envanter-form.ts` artık yalnız sayfa açılışında sağlık GET’ini ağ hatası/zaman aşımı/429/5xx halinde bir kez yeniden dener. Geçerli kapalı/eski/geçersiz yanıt açığa çevrilmez; iki hata halinde kapalı kalır. Gönderim davranışı değişmedi.
- Değişen yollar: `src/scripts/envanter-form.ts`, `tests/web/envanter.spec.mjs`, `docs/ENVANTER-FORMU.md`, `docs/PROJE-HAFIZASI.md`. İçerik commit’i `08e66cf8b0cc884b857ced8edc50981bfc62fff9`. Pages [koşusu](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36871632839) **completed/success**, aynı içerik SHA’sı doğrulandı.
- `npm run dogrula:codex`: **10/10 aşama GEÇTİ**, exit 0. Ana derleme **1892 sayfa**; tip denetimi **0 hata / 0 uyarı / 300 mevcut ipucu**. Genel web koşusu **790 geçti / 96 atlandı (886 toplam)**; atlananlar geçmiş test koşullarıdır, geçmiş gibi gösterilmedi. Envanter **12/12** mobil/masaüstü test; yeni ağ ve 503→gerçek kapalı senaryoları dahil. Eğitim derlemesi 7 sayfa; eğitim tarayıcı testi 46 geçti. Backend, güvenlik, veli e-postası, oto kayıt ve öğrenme aşamaları geçti. Testler canlı kişisel veriye bağlanmadı.
- Canlı kontroller: anonim mobil/masaüstü açık form, Ulu Camii Derneği ve 22 Ekim satırı, HTTP200/noindex/tel yok/yatay taşma yok; bir kurgusal gönderim başarıyla kaydedildi, taslak silindi; test temizliği sonrası iki kez test artığı 0. İlk temizlik yanıtının ağ/JSON sorunu nedeniyle kaç satır sildiği sayısı iddia edilmedi. Yayın sonrası ilk sağlık GET’i kontrollü kesilince ikinci GET gerçek servisten açık formu getirdi (POST yok). Son normal mobil/masaüstü yüklemesi ilk seferde geçti.
- Kaynak projenin süreç/devir/yapılacaklar kayıtları ve 9 sayfalık hazırlık notu güncellendi; ikiz hash’i doğrulandı. Kapanış ve kalıcı silme için özel takvim hatırlatmaları oluşturulup yeniden okundu. Hatırlatma, gelecekte kalıcı silmeyi otomatik yapmaz; satır temizliği de Sheets sürüm geçmişini silmez.
- Açık sınırlar: fiziksel telefon kontrolü yapılmadı; mobil tarayıcı emülasyonu kullanıldı. Kurumsal gruba hiçbir mesaj gönderilmedi; bağlantıyı sahibi / Müşavirlik paylaşır. Gelecekte kapanış ve kalıcı silme takibi gerekir.

## 01.10.2026 17:05 — Envanter örnek önizlemesi (Europe/Brussels, UTC+02:00)

- Açık yayın yetkisi: sahibin son talimatı ve adres seçimi; https://ulucamii.be/envanter/ artık oturumsuz kurgusal önizleme. Bütün mevcut bölümler/aday önerileri/izin kontrolleri kullanılabilir. Kurgusal doldurma/temizleme ve EV-ORNEK-0001 sonucu; izinler otomatik işaretlenmez. Gerçek kayıt onay sonrasıdır.
- Önizleme ucu boş: sağlık/gönderim isteği yok; form taslağı okunmaz/yazılmaz/silinmez. URL parametresi gerçek modu açamaz. GAS v42 kodu değişmedi; ENVANTER_AYAR.acik=0 kaydedildi, yeniden okuma ve canlı sağlıkla doğrulandı. Yeni gerçek açılışta veri sorumlusu ve takvim teyit edilir; önceki pilot tarihleri tarihçedir.
- İçerik commit'i 2e6d238a2cba4b2d1bef4297773ef1bcd5d2e733. Pages https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36880391734 — **success**.
- Tam dogrula:codex **10/10**; genel tarayıcı **796 geçti / 96 atlandı**, örnek **6/6**, gerçek akışın sahte servisle uyumluluğu **12/12**. Derleme 1.892 sayfa; tip kontrolü 0 hata/0 uyarı.
- Anonim canlı mobil/masaüstü: HTTP200; örnek doldurma/izin engeli/sonuç çalışır; form servis isteği 0, depo değişikliği 0, JS hatası 0. Standart GoatCounter sayfa sayacı ayrı denetlendi; form alanı/kurgusal kayıt değeri taşımıyor. Açık/koyu ekranlar incelendi. Türkçe/noindex, menü/sitemap dışında ve telefonsuz kapsam korundu.
- Kaynaklar: src/pages/envanter/index.astro; src/components/formlar/EnvanterFormu.astro; src/scripts/envanter-form.ts; src/scripts/form-cekirdek.ts; tests/web/envanter.spec.mjs; tests/web/envanter-ornek.spec.mjs; docs/ENVANTER-FORMU.md. Ana checkout dosyalarına dokunulmadı; D:/tmp/ulucamii-envanter kullanıldı. Kanıt: D:/tmp/gas/envanter-ornek-dogrula-son.log, envanter-kapatma-sonuc.json, envanter-ornek-canli-kontrol.json ve örnek ekranları.

## 1.10.2026 19:46 — Camiler ve Din Görevlileri Haftası 2026: web ve Facebook (Europe/Brussels, CEST / UTC+02:00)

- Yetki: kullanıcının açık talimatı, web sitesi ve cami Facebook hesabında içerik üretip yayımlama; kararlar tam yetkiyle devredildi. **Web yayımlandı ve canlı doğrulandı; Facebook paylaşıldı ve yeniden okunarak doğrulandı.**
- Kapsam: “Aynı Saf, Aynı Gönül” başlıklı Türkçe ve Fransızca teşekkür yazıları, iki web kapağı ve küçük kopyaları; Facebook için özgün iki dilli 1080 × 1350 görsel ve metin. Fotoğraf caminin kendi arşivinden (`src/assets/foto/ic-mekan.jpg`); kurumsal ana logo özeti doğrulandı. Diyanet’in 2026 “Cami ve Sosyal Hayat” teması resmî açılış haberiyle doğrulandı; Belçika Diyanet Vakfının 1 Ekim Reel’inin açıklaması ve üç karesi incelendi, kaynak bağlantısı verildi. Yeni etkinlik/saat veya kişi adı eklenmedi.
- Değişen yollar (6 dosya): `src/content/duyurular/{tr,fr}/camiler-ve-din-gorevlileri-haftasi-2026.md`; `public/media/duyurular/camiler-haftasi-2026-{tr,fr}{,-thumb}.webp`. Mevcut tasarım ve içerik şeması kullanıldı. Ana sayfada `vitrin: goster` ve `oneCikan: true`, son gün **7 Ekim 2026 dahil**; sonra duyuru arşivinde kalır. EN/NL/DE sitenin mevcut, açıkça belirtilen Fransızca içerik yedeğini kullanır.
- İçerik commit’i: `c73ba42f04323f91f6ccbcb34c46ac15c0978b5a`; push `f3c5d4c..c73ba42`, dernek kimliği `ulucamii2026`. Release yok (0); 2 yazı + 4 WebP, yerel derleme **1.897 sayfa**. [Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36900640430): **success**, build ve deploy tamamlandı.
- Canlı denetim: 2026-10-01T17:39:37.139Z, 7 HTML isteği + 4 görsel HTTP 200. [Türkçe yazı](https://ulucamii.be/tr/duyurular/camiler-ve-din-gorevlileri-haftasi-2026/) ve [Fransızca yazı](https://ulucamii.be/fr/annonces/camiler-ve-din-gorevlileri-haftasi-2026/) ile EN/NL/DE yolları açıldı; TR/FR ana sayfa vitrininde içerik bulundu. TR/FR mobil ve masaüstünde gerçek tarayıcıyla kapak yüklemesi, başlık ve taşmasız yerleşim doğrulandı. Dört görsel canlı/yerel SHA-256 birebir.
- Görsel özetleri: [{"file":"camiler-haftasi-2026-tr.webp","bytes":257180,"sha256":"428c42b0caf84f0395dc4ad591afee1170d58d924fc9c824565cba529ffb7912"},{"file":"camiler-haftasi-2026-tr-thumb.webp","bytes":18558,"sha256":"4c56fcc3aa2d321c6ea88670bb2acc1839f8f40997b76921e94ad228f8d1ef1b"},{"file":"camiler-haftasi-2026-fr.webp","bytes":263220,"sha256":"5fd2555c090be61a68eb32512e8af37eeca70c715d476f78f7ceb89448b0a286"},{"file":"camiler-haftasi-2026-fr-thumb.webp","bytes":19564,"sha256":"2fdff132eecb37543c494e12b7ece59c90fb17a3f45adc1ecec151b4ff928c4b"},{"file":"facebook-tr-fr.png","bytes":814971,"sha256":"d8c6dbdc19b7667858cac52213a852b1a578270dd6feb8e302d9c819c4abb70d"}].
- Facebook: cami kimliği **Mosquée Ulu Camii**, profil 61591465715992, kitle **Public**. [Gönderi](https://www.facebook.com/permalink.php?story_fbid=pfbid02vhRcoAnyzHxbSWdPMveBEAKsdiwfVysxsV5CJht9SpGANFBLJ7XxM8bHt6LRdk7Tl&id=61591465715992). Yeniden açılan zaman tünelinde iki dil, fotoğraf ve iki yazıya giden gerçek bağlantı hedefleri doğrulandı. Facebook bağlantı metnini kısalttığından URL doğrulaması bağlantı hedefinden yapıldı; ilk paylaşım betiğinin dar görünüm kontrolü yanlış negatifti, yeniden paylaşım yapılmadı.
- Testler: `npm run dogrula:codex` çıkış 0, **10/10** kapı geçti. Ana web **796 geçti / 96 mevcut bilinçli atlama**; eğitim ekranı **46 geçti / 2 mevcut bilinçli atlama**, eğitim birim 15/15; kurallar 54/54, veli e-posta 58/58, oto-kaydet 14/14, öğrenme 10/10. Tip kontrolü 0 hata / 0 uyarı; tasarım denetimi, içerik denetimleri ve `git diff --check` geçti. Ek inceleme: 5 dil yolu 390 px, açık/koyu TR/FR, lightbox ve Escape; kaynak/iç bağlantılar; Impeccable mekanik denetimi boş bulgu listesi.
- Kaynak ve kanıt arşivi: `D:/app/marche-cami-sitesi/camiler-haftasi-2026/` — yazılar, düzenlenebilir HTML’ler, görsel üreticisi, Facebook metin/PNG, `dogrula-codex.log`, `canli-dogrulama.json`, `facebook-dogrulama.json`, `dosya-ozetleri.json`, canlı ekranlar, `YAYIN-VE-KALITE.md`, `DEVAM.md`.
- Açık sınırlar: fiziksel telefon/Safari denenmedi; mobil doğrulama Chromium emülasyonu. Reel’in konuşma transkripti çıkarılmadı, video yeniden yüklenmedi. Gelecekteki 8 Ekim görünümü mevcut tarih filtreleri ve günlük derleme mekanizmasına bağlı. Yeni bir e-posta, form veya backend veri işlemi yapılmadı. Önceden mevcut ana checkout değişiklikleri korunarak güncel `origin/main` üzerinde ayrı yönetilen çalışma kopyası kullanıldı. Bu işin önizleme sunucusu kapatıldı; hesap tarayıcıları kapatıldı. Bu kayıt commit’i `[skip ci]` ile asıl içerik yayınına bağlanır.

## 01.10.2026 22:21 — Gurbette Cami vaazı (Europe/Brussels, CEST / UTC+02:00)

- Yetki: kullanıcı vaazın mükemmelleştirilmesini, Avrupa’daki cemaate uyarlanmasını, aynı oturumda web’de yayımlanmasını ve görsel materyallerle zenginleştirilmesini açıkça istedi; kararları tam yetkiyle devretti. **Vaaz yayımlandı ve canlı doğrulandı.** Tebrik/paylaşım mesajı kullanıcıya hazırlandı; hiçbir kişiye veya gruba gönderilmedi.
- [Vaaz](https://ulucamii.be/tr/vaaz/gurbette-cami/): **Gurbette Cami: İmanımızın Yurdu, Birbirimizin Emaneti**; 2 Ekim 2026 Cuma için 14 sayfalık anonim kürsü nüshası. İlk kuşağa vefa, kuşaklar arası bağ, gençler ve hanımların katılımı, yalnızlık ve dayanışma, komşuluk ahlâkı, din görevlileri ve gönüllülere teşekkür; yedi maddelik cami kardeşliği sözü ve kapanış duası. Kaynak taslak yerelde korundu; yeni DOCX/PDF ayrı dosyalardır.
- Kaynak araştırması: 12 âyet bağlamı, Buhârî/Müslim rivayetleri, TDV Cami/Suffe maddeleri ve 2026 haftası resmî kaynakları. Kesinleştirilemeyen isim, mekân, sabit Suffe sayısı ve kıssa ayrıntıları çıkarıldı. Serbest dua ve kısmi alıntılar açıkça belirtildi. İlgili kaynaklar web kaynakçasında ve yerel `KAYNAKLAR-VE-TASHIHLER.md` dosyasında. Ek otomatik hadis lafız denetimi 403 nedeniyle kullanılmadı; araştırma web aracıyla açılan kaynaklar üzerinden yapıldı.
- Değişen 8 dosya: `src/content/vaazlar/gurbette-cami.md`, `public/vaazlar/gurbette-cami.{docx,pdf}`, `public/media/vaazlar/gurbette-cami/{gonul-yurdu,nesiller-koprusu,camiden-hayata}.svg`, `src/styles/vaaz-gorseller.css`, `src/pages/[lang]/vaaz/[slug].astro` (tek stil import’u). 1 vaaz + 2 indirme + 3 özgün vektör görsel; 5 öğretici figür, şemalar ve beş satırlık uygulama tablosu; klavyeyle açılan kaynakça. Var olan tasarım korundu. Özel kürsü hazırlık sayfası/hatip notları web gövdesine alınmadı. Web gövdesi temel vaaz metniyle birebir bütünlük kontrolünden geçti.
- İçerik commit’i `d0591ca557b8f1e5327ea478632bcdfcc4459a5f`; dernek kimliği `ulucamii2026`, push `9877efc..d0591ca`; Release yok (0). [Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36920415188): **success**, build ve deploy tamamlandı. Yerel son derleme **1.902 sayfa**.
- Yerel `npm run dogrula:codex`: çıkış 0, **10/10** kapı geçti. Ana web **796 geçti / 96 mevcut atlama**; eğitim tarayıcı **46 geçti / 2 mevcut atlama**, eğitim birim 15/15; güvenlik kuralları 54/54, veli e-posta 58/58, oto-kaydet 14/14, öğrenme 10/10. Tip kontrolü 0 hata/0 uyarı; tasarım denetimi 0 hata; `git diff --check` geçti. Genel site denetimindeki mevcut iki orta ve 58 düşük bulgu bu yayının dosyalarından kaynaklanmıyor.
- Canlı denetim: `2026-10-01T20:21:38.507Z`; 1440 px açık, 390 px açık/koyu, 320 px açık dört görünümde HTTP 200, 0 yatay taşma, 0 JS hatası, 0 axe bulgusu, 3 görsel yüklenmiş/alternatif metinli; kaynakça klavyeyle açıldı. Türkçe vaaz listesinde bulundu; FR/EN/NL/DE detay yolları HTTP 200 (mevcut Türkçe içerik uyarısı). İki indirme ve üç SVG canlıdan alınıp SHA-256 ile birebir eşleştirildi.
- Canlı dosya özetleri: `gurbette-cami.docx`: `961744fdf1eedc8420f5a2bad00c3d90a8646075151c78ddcb83bc9cfd2ce390`; `gurbette-cami.pdf`: `fe403dab854c19041545d946364835dac7fe33dc825ab866b5bf1647d18f2153`; `gonul-yurdu.svg`: `e72f80058878df344288f20dd274ceafac5188407141cfa4f798f640414cc9c1`; `nesiller-koprusu.svg`: `7d50d0809a53444b5e92cbe0f5db547dea7409b5124f6f4f964946c01acdead4`; `camiden-hayata.svg`: `9089d6baaeb949c4a548d57d29fac5ea96067e2e3df11564fefd01511fbef412`.
- Belge kontrolü: Word COM ölçümü ve PDF 14 A4 sayfa; bütün sayfalar görsel denetlendi, taşma yok; Türkçe `tr-TR`, Arapça `ar-SA`, Arapça Amiri 22,5–24 punto. PDF/Word’de kişisel hazırlayan adı yok.
- Kanıt arşivi: `D:/hutbeler ve vaazlar/kaynak-gurbette-cami-20261002/`; düzenlenebilir üreticiler, kaynak/tashih raporu, sayfa görselleri, yerel/canlı tarayıcı ekranları, `dogrula-codex.log`, `son-derleme.log`, `deploy-sonuc.json`, `canli-web-kalite.json`, `dosya-ozetleri.json`, `YAYIN-VE-KALITE.md` ve `DEVAM.md`. Ana checkout’taki diğer çalışmalar korundu; ayrı `D:/tmp/ulucamii-vaaz-20261001` çalışma kopyası kullanıldı.
- Sınırlar: dijital belge ve Chromium masaüstü/mobil emülasyon denetimi yapıldı; fiziksel baskı ve fiziksel telefon/Safari denenmedi. Yeni e-posta, mesaj gönderimi, backend veri işlemi veya yeni etkinlik duyurusu yok. Kayıt commit’i `[skip ci]` ile bu içerik dağıtımına bağlanır.

## 01.10.2026 23:13 — Gurbette Cami: profesyonel görsel serisi (Europe/Brussels, CEST / UTC+02:00)

- Yetki: kullanıcı yayımlanmış vaazın görsellerini çoğaltıp tamamını profesyonel seviyeye çıkarmayı istedi; aynı vaazın yayın yetkisi sürüyor. **Yenilenen görsel anlatım yayımlandı ve canlı doğrulandı.**
- [Vaaz](https://ulucamii.be/tr/vaaz/gurbette-cami/): önceki 3 basit çizimin yerine 6 yüksek ayrıntılı özgün sahne — karşılama, nesiller arasında emanet, aile/ilim, yalnızlığı paylaşma, komşuluk, hizmete vefa. Yerleşik image_gen ile üretildi; tümünün kişiler/mimari/kompozisyon/renk uyumu incelendi. 1672×941 px kaynaklar yerelde korunuyor; sahneler temsili ve bu bilgi sayfada açık. Gerçek cami/kişi/etkinlik fotoğrafı iddiası yok.
- 9 öğretici görsel bölüm: 6 resim, hizmet şeması, beş satırlık dayanışma tablosu ve yeni yedi söz uygulama yolu. Açılış resmi başlığın/indirme bölümünün ardından; açıklamalar, kuşak ve gündelik hayat şemaları, tablo ve karar yolu mevcut Kilim Kartografyası font/paletiyle geliştirildi. Esas vaaz metni, bütün figürler çıkarılarak birebir karşılaştırıldı ve korundu. DOCX/PDF değişmedi.
- Değişen 20 dosya: `src/content/vaazlar/gurbette-cami.md`, `src/styles/vaaz-gorseller.css`; `public/media/vaazlar/gurbette-cami/{gonul-yurdu,nesiller-emaneti,ilim-ve-aile,yalnizliga-merhamet,camiden-komsuluga,hizmete-vefa}-v2-{480,960,1600}.webp` (18). Her resimde `srcset/sizes`, doğru ölçüler, alternatif metin; ilk resim eager/high, devamı lazy. Büyütme yapılmadı; tüm varyantların toplamı 3,461,784 B. Tarayıcı ekranına uygun tek varyantı ister. Release yok (0).
- İçerik commit’i `7dee59e675460a3c238a7ad78d23998344470a7c`, dernek kimliği ulucamii2026. [Pages](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36926766281) **success**; build ve deploy tamamlandı. Yerel derleme 1.902 sayfa.
- Yerel tam kalite `npm run dogrula:codex`: çıkış 0, 10/10 kapı; ana web 796 geçti / 96 mevcut atlama; eğitim tarayıcı 46 geçti / 2 mevcut atlama, eğitim birim 15/15; kurallar 54/54, veli e-posta 58/58, oto-kaydet 14/14, öğrenme 10/10. Tip kontrolü 0 hata/0 uyarı. Impeccable mekanik denetimi `[]`; `git diff --check` geçti. Masaüstü, mobil açık/koyu tüm 9 bölüm tek toplu görsel turda incelendi; UI düzeltme gerektiren bulgu yok.
- Canlı kontrol `2026-10-01T21:13:00.189Z`: 1440 px açık, 390 px açık/koyu ve 320 px açık; mobil 2× piksel yoğunluğu. 6 resim yüklenmiş, üçer boyutlu, doğal oranlı ve alternatif metinli; 9 figür/7 karar; 0 yatay taşma, 0 JS hatası, 0 axe bulgusu. Kaynakça Enter ile açılır. Türkçe liste ve FR/EN/NL/DE detay yolları HTTP200; mevcut Türkçe içerik uyarısı korunur.
- Canlı 18 WebP ve değişmeyen iki indirme HTTP200/SHA-256 birebir. Görsel özetleri: `gonul-yurdu-v2-480.webp` `03a3eea1a8c600621aee35f45aca609f1e3750b9dc78a6db8e6af730ba033448`; `gonul-yurdu-v2-960.webp` `ed1f65624252f11e027bd8888f39f09ff8e28963d64ad752f77235802db81fed`; `gonul-yurdu-v2-1600.webp` `56be53896c7256522da97852daf4b2ea9ee88cb349d018523c573af43a9d157c`; `nesiller-emaneti-v2-480.webp` `7e673d34d706e3ff9aea8ac2eef0fa9dd8c74bfea36767340ba5bd399e982c95`; `nesiller-emaneti-v2-960.webp` `bf252f311230c1b74396ddf8fa8ea244daf414d8c893930ca4f7d8104c3da7f2`; `nesiller-emaneti-v2-1600.webp` `9babd30d3603a810063725898358ba5b03f192002022d8222d02baf705ff25f6`; `ilim-ve-aile-v2-480.webp` `47af9a2b3a36aec7d6584ccba77b7e5869c48d4e9427c834694e3427dc425565`; `ilim-ve-aile-v2-960.webp` `e8f9561b1ebfac075d24f240153358d23533a9012d3388b3492d98115a588e81`; `ilim-ve-aile-v2-1600.webp` `91d53cf19cb47edb3e686118ad1fbb9d2190d01d8e1ac4b5a8008a85dfe84c7e`; `yalnizliga-merhamet-v2-480.webp` `8baef6d153edfea9eea1e3ce05ec49a5ae6b9212eae8284fc344e8a65e204a98`; `yalnizliga-merhamet-v2-960.webp` `a4b6f905410673cf474ed5e91c2d78b8beb899b796cb16c30fb3c5a4ef66255c`; `yalnizliga-merhamet-v2-1600.webp` `bdc75498f6127de59d060e23f8115319532fe0b4625bff3ea8c7a57f173cddc4`; `camiden-komsuluga-v2-480.webp` `55da32d623ef245a46f65af82b66d01299f4491f9f3a25edc610bb015fb9b6aa`; `camiden-komsuluga-v2-960.webp` `b4710e6f6ee82ae61d46713dc2765d442d645609cf5a79f5c6a16a10455de996`; `camiden-komsuluga-v2-1600.webp` `bcd72f05215357e5b5dcf1c1f300dbb3ae097a30f7568df656d0d6d53e3c5088`; `hizmete-vefa-v2-480.webp` `7c55b2652e8576625941e466a0a578c67d2b7e8cbd7d9dce50bf286e86d70c1d`; `hizmete-vefa-v2-960.webp` `cfe8821a07c355fd4e7e80738b7413aa931fe531a462a01ea71e570b333b05cc`; `hizmete-vefa-v2-1600.webp` `63b9780cb97f56286c379379096c9f655945ed090e51f65cc119679c3df17e29`.
- Kanıt/kaynak: `D:/hutbeler ve vaazlar/kaynak-gurbette-cami-20261002/gorseller-v2/`: `URETIM-TARIFLERI.json`, `ozgun-png/`, üretici, boyut/hash kayıtları, metin koruma kanıtı, yerel/canlı tarayıcı kayıtları ve ekranları, üç kontrol panosu, tam kalite logu, dağıtım sonucu, `YAYIN-VE-KALITE.md`, `DEVAM.md`. Ana checkout ve diğer çalışmalar korundu; aynı ayrı çalışma kopyası kullanıldı.
- Sınırlar: gerçek masaüstü/telefon/Safari cihazı denenmedi; Chromium ve mobil emülasyon kullanıldı. Bütün resimler özgün temsili üretimdir. Backend, hesap politikası ve mesaj gönderimi değişmedi. Salt yayın kaydı commit’i `[skip ci]` ile bu içerik dağıtımına bağlanır.

## 01.10.2026 23:51 — Gurbette Cami: metin ve okuma ergonomisi (Europe/Brussels)

- Yetki: kullanıcının ikinci mükemmelleştirme turu talebi; aynı vaaz için önceki açık yayın yetkisi sürüyor. [Güncel vaaz](https://ulucamii.be/tr/vaaz/gurbette-cami/) **yayımlandı ve canlı doğrulandı**.
- Girişte çok dillilik ve yeni nesillerin yaşadığı ülkeye aidiyeti daha kapsayıcı anlatıldı; genç hitabında “Sorunla” yerine “Sorularınla” kullanıldı; kapanıştaki telefon cümlesi doğal konuşma diline getirildi. Üç değişiklik web/Word/PDF'de eşitlendi. Yeni dinî/tarihî iddia eklenmedi; 19 Arapça blok, önceden doğrulanmış kaynakça, 6 özgün sanat eseri ve 9 öğretici figür korundu.
- Web: 13 bölümlük açılır gezinme listesi, klavye odağı/başlık hedefleri, bölümlere dönüş; sakin büyük/küçük harf düzeni; yedi söze noktalama ve ayrı kalın başlık. Betik kapalıyken bölüm geçişleri çalışır. Türkçe bağlantının og:image ve Article image bilgisi aynı temsili açılış resmini kullanır; diğer vaazların kapak davranışı korunur. Sosyal uygulamaların kendi önizleme önbelleği denenmedi.
- Word/PDF: 14 A4 sayfa, 13 ana başlık sayfa 2–14; tr-TR ve ar-SA dil etiketleri, anonim künye. PDF'ye 14 yer imi eklendi; tüm sayfaların piksel içeriği yer imi eklemeden önce/sonra aynı. Tam belge renderleri görsel incelendi. Önceki sürümler özel kaynak arşivinde tutuldu; kullanıcının asıl taslağı korunuyor.
- Değişen 5 içerik dosyası: `src/content/vaazlar/gurbette-cami.md`, `src/styles/vaaz-gorseller.css`, `src/pages/[lang]/vaaz/[slug].astro`, `public/vaazlar/gurbette-cami.docx`, `public/vaazlar/gurbette-cami.pdf`. Yeni resim dosyası 0, indirilebilir belge 2, Release 0. İçerik commit'i `c93ae2877e6c2f7be484768249b464d8abaf3d97`; dernek kimliği ulucamii2026.
- [Pages çalışması](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/36930963692) **success**; içerik SHA'sı eşleşti. Tam yerel kalite `npm run dogrula:codex`: 10/10 kapı, çıkış 0; tip kontrolü 0 hata/0 uyarı. Tasarım hook'unda bulgu yok; `git diff --check` geçti.
- Yerel ve canlı: 1440 px açık/koyu, 768 px açık, 390 px açık/koyu, 320 px açık; 6 görünüm. 0 yatay taşma/JS hatası/axe bulgusu, 13 geçerli bölüm bağlantısı ve 44 px dokunma hedefleri; klavye odağı ve bölüm dönüşü geçti. JavaScript kapalı native gezinme geçti. Türkçe liste, FR/EN/NL/DE yönlendirme sayfaları ve komşuluk vaazı HTTP200. Canlı zaman `2026-10-01T21:51:01.733Z`.
- Canlı 18 mevcut WebP + 2 güncel belge HTTP200 ve SHA-256 eşleşti. Word `e563071ee5f5855dc7254842bd369cc65e784c90f11c3164076dcad96706d4fc`; PDF `662ce5c61d636dcf5d52ec6022d26610112d33204606a678ca8bcb9cca8706b6`. Canlı indirmeler: [Word](https://ulucamii.be/vaazlar/gurbette-cami.docx), [PDF](https://ulucamii.be/vaazlar/gurbette-cami.pdf).
- Üretici/kanıt: `D:/hutbeler ve vaazlar/kaynak-gurbette-cami-20261002/mukemmellestirme-v3/`: editoryal önce/sonra, belge/yer imi/metin eşliği, sayfa renderleri, yerel/canlı tarayıcı kayıtları ve ekranları, tam kalite logu ve deploy sonucu. Eski v1/v2 üreticileri son düzeni geri alabilir; güncel üreticiler v3'tedir.
- Sınır: dijital belge/Chromium ve mobil emülasyon kontrolü yapıldı; fiziksel baskı, fiziksel telefon ve Safari denenmedi. Gönderi/e-posta/mesaj gönderilmedi. Kayıt commit'i `[skip ci]` ile bu içerik dağıtımına bağlanır.

## 2026-10-03T11:59:21.997118+02:00 — 3–4 Ekim: altı ders sunumunun yenilenmesi (Europe/Brussels)

- Kullanıcının ayrıntılı inceleme, tasarımı yenileme ve diğer derslere aynı şekilde devam etme talebi; önceki açık web yayın yetkisi kapsamında tamamlandı.
- Altı öğrenci sunumu: 155 slayt; altı öğretici sunumu: 155 eşleşen slayt; 31 slayt içi oyun/sınav. Büyük harf ve kavram kartları, görsel karşılaştırmalar, hata dedektifi, karar haritası ve çıkış bileti; iki dilde anlatım ve öğretici notları eşlendi. İki Word/PDF plan ile hızlı başlangıçlar yenilendi.
- Oyunlarda arka plana tıklayarak slayt ilerleme kapatıldı. 31 oyun, üretildiği anda oyun XML'i kaynaklarla birebir eşleşen dış medyasız kopyada gerçek PowerPoint gösterisiyle kontrol edildi: cevap önce gizli, düğmeye fareyle tıklanınca aynı slaytta iki dilde görünür; slayt geçişleri alt-sol Sonraki Slayt kontrolüyle yapıldı. İkinci slaytta klavyeyle geçiş sonrası otomasyonun fare odağı bağlam menüsü aç/kapat ile yenilendi; 3–31 fare kontrolleri normal çalıştı. Cumartesi Sunum-3 slayt16'daki altı seçenek metninin çift numarası ayrıca giderildi; zamanlama, yerleşim ve medya değişmediği ZIP farkıyla doğrulandı, PDF yenilendi. Üretim ve denetim betikleri güncellendi.
- İçerik commit'i `229f9fbc041224cdadec8a98281a0cab9c0af4e1`. [Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37114693342) **success**; SHA eşleşmesi doğrulandı. `src/data/ders-materyalleri.json` güncellendi. Release `ders-2026-10-03` ve `ders-2026-10-04`: 14+14 dosya; toplam 28 canlı indirme SHA-256 eşit. [Cumartesi](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-03), [Pazar](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-04); TR/FR/EN sayfaları HTTP200 ve gün başına 14 bağlantı doğrulandı.
- Kalite: tam `npm run dogrula:codex` başarılı; son dosya boyutu verisi için hedefli derleme/denetim; 310 slaytta gerçek PowerPoint ölçümü 0 taşma, öğretici eşleşmesi 0 ihlal, iki gün sert denetim temiz; 155/155 gömülü ses hash eşit ve her sunum 480 saniye altında. PDF montajları görsel incelendi. Yerel OneDrive 24/24 hash eşit.
- Kaynak/kanıt: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-10-03-SUNUM-YENILEME.md`; `scratchpad/haftasonu-yenileme-2026-10-03/` altındaki kalite, oyun gösterisi, son dosya, ses, OneDrive ve canlı doğrulama kayıtları. İzole site kopyası `D:/tmp/ulucamii-kurs-20261003-04`; ilgisiz ana çalışma değişiklikleri korundu.
- Sınırlar: fiziksel sınıf projeksiyonu/hoparlörü, OneDrive bulut eşitlemesi ve haricî video oynatma bu gösteri testinin kapsamı dışında. Önceki 21 veli e-postası tekrar gönderilmedi; kişisel veri yayımlanmadı. Bu kayıt için belge commit'i içerik yayını değildir.

## 2026-10-06T19:56:19+02:00 — Cami ekranı B3: dokunmatik okuma kipi ve render ilerleme protokolü (Europe/Brussels, CEST / UTC+02:00)

- Yetki: kullanıcının 6 Ekim 2026 akşamı verdiği «B3 aşamalarını tamamla; bütün yetki ve karar sende» talimatı. Kapsam yalnız `/ekran/` paketi; site sayfaları, içerik ve namaz vakti verisi değişmedi.
- Değişiklik: telefon/tablet için açık, uyarlanır dokunmatik okuma kipi; filo hedeflemesinin SDK anlık görüntülerinden doğrulanması (test); başarılı DOM döngülerinden render ilerleme bildirimi (`UluRenderDurumu`, Android kabuğu bunu güncelleme sağlık kanıtı olarak okur). Üç commit `42f183d`, `ca84434`, `25d78ed`; içerik commit'i `25d78ed33793c907c51df64a376175b808e32d51`. 13 dosya, +447/−8. Release 0, yeni indirilebilir dosya 0.
- [Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37507074219) **success** (17:53:45Z–17:56:19Z); dağıtılan SHA içerik commit'iyle eşleşti. Dernek kimliği ulucamii2026.
- Kalite: `test:ekran` 168/168; `check` 0 hata/0 uyarı; `build` çıkış 0; Playwright 816 geçti/112 atlandı, çıkış 0. `dogrula` içindeki ihtida adımı ilk koşuda yerel Python başlatıcısının yanlış ortamı göstermesi yüzünden düştü (kodla ilgisiz); doğru Python paket yoluyla kalan 12/12 adım yeniden koşuldu ve geçti.
- Canlı: [ekran](https://ulucamii.be/ekran/) HTTP200; canlı `ekran.js` render protokolünü içeriyor; `/ekran/vakitler.json` `kaynakTuru=diyanet`, ilçe 11890, 397 gün (2026-10-05…2027-12-31). Yenileme gönderilen üç saha ekranı 18:00–18:02Z arasında `renderer=ilerliyor` bildirdi.
- Sınırlar: dokunmatik kipin fiziksel tablette uzun süreli kullanımı ve 14 günlük dayanıklılık ölçümü ayrı B3 adımlarıdır. Kişisel veri, telefon numarası veya anahtar yayımlanmadı. Bu kayıt için belge commit'i içerik yayını değildir.

## 2026-10-06T22:05:47+02:00 — Cami ekranı B3: dokunmatik okuma kipinde sahte renderer donması giderildi (Europe/Brussels, CEST / UTC+02:00)

- Yetki: kullanıcının 6 Ekim 2026 akşamı verdiği «B3 aşamalarını tamamla; bütün yetki ve karar sende» talimatı. Kapsam yalnız `/ekran/` paketi; site sayfaları, içerik ve namaz vakti verisi değişmedi.
- Bulgu: dokunmatik okuma kipinde otomatik slayt geçişi varsayılan olarak kapalı olduğu için sonraki slayt hiç zamanlanmıyordu; slayt gözlem sınırı (süre + 30 sn) açılıştan yaklaşık bir dakika sonra doluyor, render ilerleme sayacı duruyor ve Android kabuğu sağlıklı sayfayı donmuş sayıp renderer'ı birkaç dakikada bir yeniden başlatıyordu (telefon kipindeki saha ekranında 20 dakikada 5 yeniden başlama). TV kipi etkilenmiyordu.
- Değişiklik: gözlem sınırı yalnız bir geçiş zamanlandığında konur; elle okuma ya da gizli sayfada kaldırılır. Çizim hatası ve ana iş parçacığının durması yine ilerlemeyi keser. Yeni Playwright testi (elle okuma kipinde 4 dk bekleyen slayt sayacı durdurmaz; otomatik geçişe dönünce sayaç sürer) önce eski derlemede kırmızı (4 dk'da +40), düzeltmeyle yeşil. İçerik commit'i `9241bb4` (2 dosya, +23/−2). Release 0, yeni indirilebilir dosya 0.
- [Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/37523476912) **success** (20:02:56Z–20:05:47Z); dağıtılan SHA içerik commit'iyle eşleşti. Dernek kimliği ulucamii2026.
- Kalite: `test:ekran` 168/168; `check` 0 hata/0 uyarı; `dogrula` tek koşuda çıkış 0 (ihtida adımı için yerel Python paket yolu geçici olarak verildi; kodla ilgisiz ortam sorunu); `build` çıkış 0; Playwright 817 geçti/113 atlandı, çıkış 0.
- Canlı: [ekran](https://ulucamii.be/ekran/) HTTP200. Başsız tarayıcı ve sahte saatle canlı adreste: dokunmatik kipte 4 dk boyunca sayaç +240 ve slayt yerinde (yayından önce aynı ölçüm +40'ta duruyordu); TV kipinde sayaç +240, slaytlar otomatik geçti. `/ekran/vakitler.json` `kaynakTuru=diyanet`, ilçe 11890, 397 gün.
- Sınırlar: saha ekranı gece kipinde olduğu için cihaz üzerindeki doğrulama sabah açılışından sonraki renderer sayaçlarıyla yapılacak. Kişisel veri, telefon numarası veya anahtar yayımlanmadı. Bu kayıt için belge commit'i içerik yayını değildir.

