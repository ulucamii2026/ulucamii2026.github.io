# Telefon ve tablet okuma görünümü

Kişisel görünüm açıkça `?kip=dokunmatik` ile seçilir. Ekran kimliği aynı parametrede kalır:
`/ekran/?ekran=ana&kip=dokunmatik`, `giris` veya `kadin`. Bu parametre cihaz rolü,
kiosk veya sunucu yetkisi vermez. Kip verilmezse küçük bir pencere de mevcut TV tuvalidir.
Kişisel kip döndürme ve TV düzeni parametrelerini uygulamaz.

Gerçek sahne genişliği 600 px altında compact, 600–839 px medium, 840 px ve üzerinde
expanded sınıfıdır. Kısa yükseklik 480 px altında ayrıca işaretlenir. Dar pencerede
vakitler içerikten önce gelir; orta pencerede vakitler iki sütun, geniş pencerede
vakitler ve levha yan yanadır. DOM sırası da vakitler → levha olur. İçerik doğal
yüksekliğiyle kaydırılır; klavye ve yön değişimi metni küçültmez. Büyük yazı açıkken
orta ve geniş düzen de tek sütuna döner; metnin yanındaki alan daraltılmaz.

Yerel Work Sans, Ekran Kuran/Ekran Metin yüzleri, `slaytCiz`, `OLCU`, kaynak çizimi,
Kur'an üst payı ve `levhaSigdir` taşma ölçümü ortak kalır. Kişisel kipte ölçek araması
1 ile sınırlıdır; doğal yükseklik TV'nin büyütme tavanına gerekçe olmaz. U birimi
normalde 7 px, büyük yazıda 9,8 px; tarayıcının temel yazı boyutuyla orantılıdır.
Fransızca metin 20,3 px ve kaynak 16,1 px tabanındadır. Afiş aynı görselle, metnin
üzerinde doğal yüksekliğini korur. Taşma sığma gibi gösterilmez. Slayt alanına
kişisel kipte ResizeObserver kurulmaz; doğal boylanma ölçümü geri beslemez.

Otomatik geçiş başlangıçta kapalıdır. Sonraki düğmesi manuel ilerletir; otomatik
geçiş ve büyük yazı düğmeleri `aria-pressed` ile durumlarını bildirir. Düğmeler
48 px altında değildir, gerçek button öğeleridir ve klavye odağı görünürdür.
Otomatik geçiş kişisel sayfa gizliyken durur; kullanıcının seçimi korunarak
görünür olduğunda yeni tam süre başlar. Native duyuru güncellemesi mevcut hedef
filtresiyle yine işlenir. Saat saniyelik canlı bölge duyurusu yapmaz.

Diyanet 11890 vakitleri, Brüksel saati, mevcut önbellek ve eksik gün uyarısı aynıdır.
Bu görünüm ses açmaz veya sistem ayarını değiştirmez. Native uygulamanın açık
telefon/tablet rolüne URL bağlaması ve görünür kullanımda ses tercihi ayrı kabuk
işidir. Yerel tarayıcı testleri gerçek cihaz/TalkBack/kesinti kabulü değildir.
