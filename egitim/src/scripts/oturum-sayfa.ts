/**
 * Her sayfadaki oturum köprüsü (Taban.astro): oturum işareti varsa Firebase'i yükler ve cihaz kopyasını hesapla eşitler; işaret yoksa HİÇBİR ŞEY
 * indirmez (anonim sayfa Firebase'siz kalır). Hesap sayfaları ve `/k/` oturumu kendisi yönetir: <html data-oturum-yok> varsa bu betik durur.
 */
import { acilisEsitlemesi } from './oturum-ortak';

if (!document.documentElement.hasAttribute('data-oturum-yok')) void acilisEsitlemesi();

export {};
