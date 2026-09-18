# DEVİR NOTU — 18 Eylül 2026 (Hac 2027 Kayıtları Devam Ediyor Duyurusu)

**Tarih:** 18 Eylül 2026, 15:55  
**İş:** Belçika Diyanet Vakfı 2027 Hac Ön Kayıt Hatırlatma Duyurusu ve Afişinin Web Sitesinde Yayınlanması  
**Yayın Dalı:** `main` (commit `9a04908`)  
**GitHub Actions Run:** `35341872241` (Başarılı)  
**Canlı Doğrulama:** HTTP 200 OK  

---

## 1. Yapılan İşlem ve İçerik

* **Kaynak:** Belçika Diyanet Vakfı resmi duyurusu ve WhatsApp afişi (`WhatsApp Image 2026-09-18 at 09.17.45.jpeg`).
* **Önemli Bilgiler:**
  * Son Başvuru Tarihi: 30 Ekim 2026 (Kontenjan dolması halinde tarih beklenmeden sistem kapatılacaktır).
  * 3 kişilik oda kişi başı € 9.750, 2 kişilik oda kişi başı € 10.250.
  * Uçuşlar: Gidiş 27–29 Nisan 2027, Dönüş 22–25 Mayıs 2027.
  * Parkur: İstanbul gidiş-dönüş € 200 indirim, Brüksel gidiş + 6 ay içinde İstanbul dönüş € 200 ilave.
  * Şartlar: En az 10.05.2028 geçerli T.C. pasaportu, en az 10.07.2027 geçerli Belçika oturum kartı, ACW 135 Y uluslararası sarı menenjit aşı kartı.
  * Başvuru: `www.diyanet.be/onkayit` ve afiş üzerindeki QR kod.

## 2. Dosyalar ve Değişiklikler

* **Medya:**
  * `public/media/afisler/bdv-2027-hac-kayitlari-devam-ediyor.webp` (274 KB)
  * `public/media/afisler/bdv-2027-hac-kayitlari-devam-ediyor-thumb.webp` (51 KB)
* **İçerik:**
  * `src/content/duyurular/tr/2027-hac-kayitlari-devam-ediyor.md` (TR duyuru, `oneCikan: true`)
  * `src/content/duyurular/fr/2027-hac-kayitlari-devam-ediyor.md` (FR duyuru, `oneCikan: true`)
  * `src/content/afisler/bdv-2027-hac-kayitlari-devam-ediyor.md` (`vitrin: goster`, `vitrinSon: 2026-10-30`)
  * `src/content/afisler/hac-2027-guncel-takvim.md` (`vitrin: gizle`)
  * `src/content/duyurular/tr/2027-hac-on-kayitlari-sona-erdi.md` (`oneCikan: false`)
  * `src/content/duyurular/fr/2027-hac-on-kayitlari-sona-erdi.md` (`oneCikan: false`)
  * `src/content/ayarlar/site.yaml` (hero ticker metni güncellendi)
* **Görsel Regresyon Testleri:**
  * `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-*` (24/24 ekran görüntüsü baseline'ı yeni vitrin ile güncellendi)

## 3. Doğrulama ve Yayın

* `npm run dogrula:codex`: 8/8 kapı GEÇTİ (design:check, check, dogrula [885 sayfa], test:web [424 test], test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme).
* Git commit ve push `ulucamii2026` yetkisiyle tamamlandı.
* GitHub Pages iş akışı başarıyla derlendi ve canlıda teyit edildi:
  * https://ulucamii.be/tr/duyurular/2027-hac-kayitlari-devam-ediyor/
  * https://ulucamii.be/fr/annonces/2027-hac-kayitlari-devam-ediyor/
  * https://ulucamii.be/media/afisler/bdv-2027-hac-kayitlari-devam-ediyor.webp
