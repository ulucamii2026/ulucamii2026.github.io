/**
 * Çocuk şifresi kelime listesi (Dilim 1): iki kelime + iki rakam (ör. «kedi-limon-42»). Kısa, somut, çocuğun tanıdığı Türkçe
 * kelimeler; doğru yazımı zaten ASCII olanlar seçildi (ı ş ğ ü ö ç içerenler yok, «gunes» gibi bozuk yazım yok).
 * Bilinçli olarak dışarıda: dinî kavramlar (rastgele bir kelimeyle yan yana düşmesin), çalgılar, oyun zarı, hakaret olarak da
 * kullanılan hayvan adları. ~230 kelime² × 100 ≈ 5,3 milyon olasılık; kaba denemeye karşı asıl koruma kilitlenmedir.
 * Liste değişirse tests/fonksiyonlar/cocuk-hesabi.test.mjs şifre biçimini (a-z, 3–8 harf) yeniden doğrular.
 */
export const KELIMELER: readonly string[] = [
  // yiyecek
  'elma', 'armut', 'kiraz', 'karpuz', 'limon', 'muz', 'erik', 'incir', 'nar', 'ayva', 'kavun', 'hurma', 'ananas', 'mango',
  'domates', 'patates', 'biber', 'mantar', 'lahana', 'ispanak', 'turp', 'roka', 'nane', 'kekik', 'bal', 'peynir', 'ekmek',
  'simit', 'pide', 'kek', 'lokum', 'helva', 'pilav', 'ayran', 'zeytin', 'salata', 'bezelye', 'fasulye', 'ceviz', 'badem',
  'kestane', 'avokado',
  // hayvan
  'kedi', 'kuzu', 'aslan', 'kaplan', 'zebra', 'panda', 'tavuk', 'horoz', 'kelebek', 'balina', 'yunus', 'ahtapot', 'penguen',
  'tilki', 'sincap', 'geyik', 'koala', 'lama', 'kartal', 'leylek', 'hindi', 'fil', 'kunduz', 'kirpi', 'timsah', 'karides',
  'midye', 'civciv', 'ceylan', 'kanarya', 'flamingo', 'pelikan', 'jaguar', 'leopar', 'puma', 'kanguru', 'tukan', 'fok', 'mors',
  'gergedan',
  // doğa
  'deniz', 'bulut', 'orman', 'nehir', 'ada', 'kum', 'kaya', 'toprak', 'yaprak', 'lale', 'papatya', 'zambak', 'nergis',
  'karanfil', 'tohum', 'fidan', 'bahar', 'yaz', 'sabah', 'gece', 'mehtap', 'ufuk', 'vadi', 'tepe', 'kale', 'kule', 'liman',
  'sahil', 'dalga', 'inci', 'mercan', 'kristal', 'elmas', 'yakut', 'firuze', 'kar', 'dere', 'kutup', 'volkan', 'gezegen',
  'uydu', 'galaksi', 'ekvator',
  // eşya
  'kalem', 'kitap', 'defter', 'silgi', 'cetvel', 'masa', 'lamba', 'saat', 'anahtar', 'top', 'balon', 'oyuncak', 'bebek',
  'araba', 'tren', 'gemi', 'roket', 'robot', 'zil', 'radyo', 'harita', 'pusula', 'fener', 'mum', 'kumbara', 'sepet', 'kova',
  'tabak', 'bardak', 'tencere', 'demlik', 'fincan', 'bere', 'mont', 'ceket', 'terlik', 'yorgan', 'kilim', 'perde', 'ayna',
  'tarak', 'sabun', 'havlu', 'boya', 'resim', 'tuval', 'sandal', 'yelken', 'kano', 'paten', 'kaykay', 'tahta', 'yapboz',
  'misket', 'kukla', 'mozaik', 'kurdele', 'rozet', 'madalya', 'kupa', 'bayrak', 'rakam', 'vazo', 'testi', 'kutu', 'zarf',
  'pul', 'kart', 'posta',
  // renk
  'mavi', 'mor', 'pembe', 'turuncu', 'beyaz', 'siyah', 'gri', 'bordo', 'lacivert', 'eflatun', 'krem', 'bej',
  // diğer
  'dost', 'oyun', 'masal', 'hikaye', 'bilmece', 'hazine', 'macera', 'rota', 'yol', 'park', 'okul', 'ders', 'sanat', 'bilim',
  'fikir', 'umut', 'sevgi', 'selam', 'bereket', 'hediye', 'huzur', 'ilim', 'irfan', 'edep',
];
