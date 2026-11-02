/**
 * Ayrılmış ve uygunsuz kullanıcı adları (yalnız sunucuda; tarayıcı paketine girmez). docs/ILIM-YOLU.md «Ortak kararlar» 3.
 * Girdi: kullanici-adi.ts gecerliMi'den geçmiş ad ([a-z0-9._-]). Üç denetim:
 *  1. ayraçsız biçim (ulu.camii → ulucamii) tam olarak ayrılmış bir adsa;
 *  2. ayraçsız biçim kurum adı ya da uzun, belirsizliği olmayan bir küfür İÇERİYORSA;
 *  3. ad ayraç/rakamla bölününce bir parça ayrılmış ad ya da kısa bir küfürse (kısa kelimeler yalnız tam parça olarak:
 *     «pute» computer'da, «bite» website'ta, «nazi» Nazif'te geçer).
 */
const AYRILMIS = new Set([
  'admin', 'administrator', 'hoca', 'imam', 'ulucamii', 'ilimyolu', 'destek', 'bdv', 'diyanet', 'yonetim', 'yonetici',
  'moderator', 'root', 'test', 'null', 'undefined', 'system', 'sistem', 'support', 'guvenlik', 'security', 'resmi', 'official',
  'staff', 'noreply', 'webmaster', 'postmaster', 'abuse', 'iletisim', 'contact', 'anonim', 'anonymous', 'musavir', 'musavirlik',
]);

// Ayraçsız adın içinde geçmesi yeterli olanlar: kurum adları (karar) + uzun küfürler (TR/FR/EN/NL/DE).
const ICERIR = [
  'ulucamii', 'diyanet', 'imam', 'hoca',
  'orospu', 'siktir', 'amcik', 'pezevenk', 'gerizekali', 'serefsiz', 'yarrak', 'kahpe', 'kaltak', 'gavat',
  'connard', 'connasse', 'salope', 'encule', 'enfoire', 'couille',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger', 'nigga', 'whore', 'porno', 'hitler',
  'klootzak', 'godverdomme',
  'scheisse', 'scheiss', 'fotze', 'wichser', 'arschloch', 'schlampe', 'ficken', 'hurensohn', 'missgeburt',
];

// Yalnız tam parça olarak reddedilenler (kısa ya da başka kelimelerin içinde masumca geçenler).
const PARCA = new Set([
  'amk', 'aq', 'sik', 'sikis', 'got', 'yarak', 'ibne', 'pic', 'salak', 'aptal', 'mal',
  'pute', 'merde', 'batard', 'nique', 'niquer', 'pd', 'bite',
  'cunt', 'dick', 'cock', 'pussy', 'slut', 'sex', 'nazi', 'rape', 'porn',
  'kut', 'lul', 'hoer', 'kanker', 'mongool', 'tering',
  'hure', 'fick', 'nutte', 'spast',
]);

export function ayrilmisMi(ad: string): boolean {
  const duz = ad.replace(/[._-]/g, '');
  if (AYRILMIS.has(duz)) return true;
  if (ICERIR.some((k) => duz.includes(k))) return true;
  return ad.split(/[._\-0-9]+/).some((p) => p && (AYRILMIS.has(p) || PARCA.has(p)));
}
