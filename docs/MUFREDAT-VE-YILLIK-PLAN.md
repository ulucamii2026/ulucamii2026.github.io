# Kur'an kursu müfredatı ve yıllık plan — site tarafı konu notu

Güncelleme: 24 Eylül 2026. Bu not, yıllık plan ya da müfredat değiştiğinde sitede **neyin, hangi sırayla** güncellendiğini
anlatır; Claude, Codex ve agy oturumları aynı keşfi tekrarlamasın diye yazıldı. Hesap ve yayın kuralları [AGENTS.md](../AGENTS.md),
yayın kanıtları [YAYIN-KAYITLARI.md](YAYIN-KAYITLARI.md) içindedir. Teknik ayrıntılı belge (özel arşiv):
`D:/app/marche-cami-sitesi/dokumanlar/19_MUFREDAT_HATTI_VE_YILLIK_PLAN.md` §13.

## 24 Eylül 2026'da ne yapıldı (özet)

Kullanıcı (kurs sorumlusu) müfredatın ders kitaplarına göre yeniden kurulmasını istedi ve yeni planı onayladı; **26 Eylül 2026'dan
itibaren** geçerli. Eski planda Temel Dinî Bilgiler sayfa numaralarının hepsi yanlıştı, 16 derste aynı sayfa aralığı tekrar
ediyordu, Oruç/Kurban/Mübarek geceler mevsiminden sonra işleniyordu, Siyer üç kez başa dönüyordu.

- **Plan:** İtikat/İbadet/Siyer/Ahlak dersleri Camiye Gidiyorum 1-2 ve Temel Dinî Bilgiler sayfalarına göre yeniden sıralandı;
  Kur'an satırının **konu sırası aynı**, yalnız `kaynak` alanına Elifbâ sayfası geldi. Tarih, saat ve alan sayıları değişmedi
  (87 gün / 261 ders · kuran 87 · itikat 44 · ibadet 44 · siyer 43 · ahlak 43). Beyyine, Zilzâl, Âdiyât, Kâria, Tekâsür, Hümeze
  dersleri bilinçli olarak **sayfasız** («Elifbâ / Kur'an-ı Kerim»).
- **`kaynak` biçimi (standart, ayrıştırıcılar buna güvenir):** `Camiye Gidiyorum 1 s. 85–90` · `Temel Dinî Bilgiler s. 151–160` ·
  `Elifbâ s. 6`; birden çok kitap `;` ile; özel programlarda sonek `(Ramazan özel programı)` / `(Kurban Bayramı özel programı)`,
  tekrar derslerinde `(tekrar)`. Sayfa = kitap MD'sindeki `<!-- s. N -->` (kurs projesi `veri/kitaplar/*/INDEX.md`; kitap metinleri
  telif gereği **siteye/depoya girmez**).
- **Uyarlanan ünite:** TDB «Vatan ve Milletimize Karşı Görevlerimiz I-II» 3 dersten 2'ye indi, çerçevesi «Yaşadığımız ülkeye ve
  topluma karşı görevlerimiz» (askerlik, şehitlik, bayrak kısımları alınmadı).
- **Sunum kapağı:** her ders sunumunun ilk slaydında «Kitabımızı açalım / Ouvrons notre livre: <kitap> · s. a–b» satırı var
  (kurs projesi kuralı, 24 Eylül 2026). 26-27 Eylül ve 3-4 Ekim sunumları bu satırla yeniden yüklendi.

## Plan değişince siteye giden bağımlılar (hepsi birlikte güncellenir)

| Site dosyası | Ne tutar | Nasıl güncellenir |
|---|---|---|
| `src/data/yillik-plan-2026-2027.json` | Gün gün plan (konu, kaynak, kazanım, özet, etkinlik, ezber, rozet) | `D:/app/marche-cami-sitesi/mufredat/yillik-plan-cikar.py` (elle **düzenlenmez**; biçim `indent=1`) |
| `src/data/mufredat-2026-2027.html`, `mufredat-meta.json`, `public/belgeler/kuran-kursu/{mufredat-2026-2027.html, …Mufredat-2026-2027.pdf}`, `docs/kuran-kursu-*.md` | Müfredat sayfası/PDF | `mufredat-uret.py`; PDF sayfa sayısı `mufredat-meta.json` → düğme metni (elle yazılmaz) |
| `src/data/ders-defteri-2026-2027.json` | Hoca ekranı ders defteri: her dersin konu, kaynak, `goal_tr/fr`, `prompt_tr/fr`, `mode` | Kurs projesi `veri/mufredat-revizyon/site/uygula.py` (konu/kaynak plandan; konusu değişen dersin hedef/etkinliği `cikti.json`'dan) |
| `src/data/konular-fr.json`, `konular-en.json`, `src/data/ders-konu-fr.ts` | Ders başlıklarının FR/EN karşılığı (kurs günlüğü, veli portalı, FR bülten) | Aynı betik; **plandaki her başlığın karşılığı olmak zorunda** (`npm run test:gunluk`, `tests/defter-ceviri.test.mjs`). Eski anahtarlar silinmez (geçmiş defter kayıtları) |
| `src/data/ders-materyalleri.json` | Günlük sunum/plan dosyaları (Release `ders-<tarih>`) | Kurs projesi `scripts/site-materyal-yayinla.py <gün>` |
| Apps Script Drive kopyası «Ulu Camii Kuran Kursu 2026-2027 Mufredat.pdf» | Kayıt formu e-postasının müfredat eki | `mufredatEki()` **önce Drive kopyasını** kullanır → PDF değişince `POST {tur:"mufredat-yukle", anahtar, base64}` (panel anahtarı), sonra `?islem=mufredat-sina` ile `drive == uzunluk` doğrula |

Kurs tarafındaki eşleri (aynı işte): `D:/ulu-camii-kuran-kursu/veri/yillik-plan-2026-2027.json` ve
`belgeler/ogrenci-defteri-2026-2027/yillik-plan.json` (site JSON'uyla **MD5 eşit** tutulur), `…/konular-fr.json`,
`…/ders-etkinlikleri-v2.json`, `veri/yillik-plan-ozetli-2026-2027.md`, `veri/mufredat-2026-2027.md`.

## Tekrar yapılacaksa sıra

1. Kaynak Word/HTML/`ozet-nihai.json` — klasör artık OneDrive'da değil:
   `D:/koordinatörlük/Arsiv_Cami_ve_Koordinatorluk_OneDrive/01_Marche_en_Famenne_Ulu_Camii/Ulu Camii Kuran Kursu/2026-2027 Mufredat ve Yillik Plan/`
   (betikler OneDrive yolu yoksa buraya düşer). Toplu değişiklik: `mufredat/revizyon-uygula.py [--kuru]` (iskelet + içerik JSON'u
   kurs projesi `veri/mufredat-revizyon/`; önce tarihli yedek `D:/ulu-camii-kuran-kursu-yedek/2026-09-mufredat-revizyonu/`).
2. `py -3.14 yillik-plan-cikar.py` → çapraz kontrol «ders fark 0» olmalı; `py -3.14 mufredat-uret.py`.
3. Kurs projesi: `python scripts/kitap/mufredat_denetle.py veri/yillik-plan-2026-2027.json` (İHLAL 0), yeni başlıklar/dersler için
   çeviri+etkinlik (`site/cikti.json`) → `python veri/mufredat-revizyon/site/uygula.py`.
4. Site: `npm run check` + `npm run dogrula` + `py -3.14 ~/.claude/skills/ulucamii-site/scripts/mufredat-test.py <kök>`.
5. Commit/push → deploy → canlı kontrol → GAS `mufredat-yukle` → kayıtlar (`YAYIN-KAYITLARI.md`, kurs `belgeler/YAYIN-KAYITLARI.md`, iki `DEVAM.md`).

## Bilinen durumlar ve tuzaklar

- `mufredat-test.py` kaydırma takibi / mobil özet / yapışkan başlık kontrolleri (5 adet) 24 Eylül öncesi canlı sitede de
  kalıyordu — bu değişiklikle ilgisiz; PDF sayfa sayısı kontrolü artık `mufredat-meta.json`'dan okur (önce sabit 43'tü; yeni PDF 41 s.).
- Kurs günlüğü (`/tr/kurs-gunlugu/`) yalnız geçmiş haftaları + sıradaki ders gününü gösterir; gelecek başlıkların orada
  görünmemesi normaldir.
- `ders-defteri-2026-2027.json` `sayfa` alanı basılı defterle **+4 kayık** (bilinen, düzeltilmedi; `ulucamii-site` becerisi «BEKLEYEN DÜZELTME»).
- Öğrenci defterleri (kurs projesi, Sürüm 3) 24 Eylül itibarıyla yeni plana göre **yeniden üretilmedi**; girdileri hazır.
- Yayın kanıtı: [YAYIN-KAYITLARI.md](YAYIN-KAYITLARI.md) «24 Eylül 2026»; içerik commit'i `a4b802b`, deploy run `36041808956`.
