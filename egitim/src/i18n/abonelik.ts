/**
 * Haftalık e-postadan çıkış onay sayfası (/<dil>/abonelik-cik/) metinleri. Beş dil; Türkçe «siz», Fransızca vous, Felemenkçe u, Almanca Sie.
 * Sonuç metinleri sunucunun kendi sayfasıyla (src/lib/ilim-yolu/eposta.ts SAYFA) aynı sözleri kullanır.
 */
import type { Dil } from '@ortak/i18n/ui';

export interface AbonelikMetinleri {
  readonly baslik: string;
  readonly aciklama: string;
  readonly lead: string;
  readonly dugme: string;
  readonly gonderiliyor: string;
  readonly tamamBaslik: string;
  readonly tamamMetin: string;
  readonly gecersizBaslik: string;
  readonly gecersizMetin: string;
  readonly agHatasi: string;
  readonly tokenYokMetin: string;
  readonly hesapBaglantisi: string;
}

const M: Record<Dil, AbonelikMetinleri> = {
  tr: {
    baslik: 'Haftalık e-postayı durdur',
    aciklama: 'İlim Yolu haftalık özet e-postasını durdurma onayı.',
    lead: 'Düğmeye bastığınızda İlim Yolu haftalık özet e-postasını artık almayacaksınız.',
    dugme: 'Haftalık e-postayı durdur',
    gonderiliyor: 'Gönderiliyor…',
    tamamBaslik: 'Haftalık e-posta kapatıldı',
    tamamMetin: 'İlim Yolu haftalık özet e-postasını artık almayacaksınız. Dilediğiniz zaman hesabınızdaki ayarlardan yeniden açabilirsiniz.',
    gecersizBaslik: 'Bağlantı geçersiz',
    gecersizMetin: 'Bu bağlantı geçersiz ya da süresi dolmuş. Haftalık e-postayı hesabınızdaki ayarlardan kapatabilirsiniz.',
    agHatasi: 'Bağlantı kurulamadı. İnternetinizi denetleyip düğmeye yeniden basın.',
    tokenYokMetin: 'Bu sayfaya e-postadaki bağlantıyla gelmelisiniz. Haftalık e-postayı hesabınızdaki ayarlardan da kapatabilirsiniz.',
    hesapBaglantisi: 'Hesap ayarlarını aç',
  },
  fr: {
    baslik: 'Arrêter le courriel hebdomadaire',
    aciklama: 'Confirmation de l’arrêt du résumé hebdomadaire d’İlim Yolu.',
    lead: 'En appuyant sur le bouton, vous ne recevrez plus le résumé hebdomadaire d’İlim Yolu.',
    dugme: 'Arrêter le courriel hebdomadaire',
    gonderiliyor: 'Envoi en cours…',
    tamamBaslik: 'Courriel hebdomadaire désactivé',
    tamamMetin: 'Vous ne recevrez plus le résumé hebdomadaire d’İlim Yolu. Vous pouvez le réactiver à tout moment dans les paramètres de votre compte.',
    gecersizBaslik: 'Lien invalide',
    gecersizMetin: 'Ce lien est invalide ou a expiré. Vous pouvez désactiver le courriel hebdomadaire dans les paramètres de votre compte.',
    agHatasi: 'Connexion impossible. Vérifiez votre connexion internet, puis appuyez de nouveau sur le bouton.',
    tokenYokMetin: 'Vous devez arriver sur cette page par le lien du courriel. Vous pouvez aussi désactiver le courriel hebdomadaire dans les paramètres de votre compte.',
    hesapBaglantisi: 'Ouvrir les paramètres du compte',
  },
  en: {
    baslik: 'Stop the weekly e-mail',
    aciklama: 'Confirmation to stop the weekly İlim Yolu summary e-mail.',
    lead: 'When you press the button, you will no longer receive the weekly İlim Yolu summary.',
    dugme: 'Stop the weekly e-mail',
    gonderiliyor: 'Sending…',
    tamamBaslik: 'Weekly e-mail turned off',
    tamamMetin: 'You will no longer receive the weekly İlim Yolu summary. You can turn it back on at any time in your account settings.',
    gecersizBaslik: 'Invalid link',
    gecersizMetin: 'This link is invalid or has expired. You can turn off the weekly e-mail in your account settings.',
    agHatasi: 'Could not connect. Check your internet connection and press the button again.',
    tokenYokMetin: 'You need to reach this page through the link in the e-mail. You can also turn off the weekly e-mail in your account settings.',
    hesapBaglantisi: 'Open account settings',
  },
  nl: {
    baslik: 'Wekelijkse e-mail stoppen',
    aciklama: 'Bevestiging om het wekelijkse İlim Yolu-overzicht te stoppen.',
    lead: 'Als u op de knop drukt, ontvangt u het wekelijkse İlim Yolu-overzicht niet meer.',
    dugme: 'Wekelijkse e-mail stoppen',
    gonderiliyor: 'Bezig met verzenden…',
    tamamBaslik: 'Wekelijkse e-mail uitgezet',
    tamamMetin: 'U ontvangt het wekelijkse İlim Yolu-overzicht niet meer. U kunt het op elk moment weer aanzetten in de instellingen van uw account.',
    gecersizBaslik: 'Ongeldige link',
    gecersizMetin: 'Deze link is ongeldig of verlopen. U kunt de wekelijkse e-mail uitzetten in de instellingen van uw account.',
    agHatasi: 'Geen verbinding. Controleer uw internetverbinding en druk opnieuw op de knop.',
    tokenYokMetin: 'U moet deze pagina openen via de link in de e-mail. U kunt de wekelijkse e-mail ook uitzetten in de instellingen van uw account.',
    hesapBaglantisi: 'Accountinstellingen openen',
  },
  de: {
    baslik: 'Wöchentliche E-Mail beenden',
    aciklama: 'Bestätigung zum Beenden der wöchentlichen İlim-Yolu-Zusammenfassung.',
    lead: 'Wenn Sie die Schaltfläche drücken, erhalten Sie die wöchentliche İlim-Yolu-Zusammenfassung nicht mehr.',
    dugme: 'Wöchentliche E-Mail beenden',
    gonderiliyor: 'Wird gesendet…',
    tamamBaslik: 'Wöchentliche E-Mail ausgeschaltet',
    tamamMetin: 'Sie erhalten die wöchentliche İlim-Yolu-Zusammenfassung nicht mehr. Sie können sie jederzeit in den Einstellungen Ihres Kontos wieder einschalten.',
    gecersizBaslik: 'Ungültiger Link',
    gecersizMetin: 'Dieser Link ist ungültig oder abgelaufen. Sie können die wöchentliche E-Mail in den Einstellungen Ihres Kontos ausschalten.',
    agHatasi: 'Verbindung fehlgeschlagen. Prüfen Sie Ihre Internetverbindung und drücken Sie die Schaltfläche erneut.',
    tokenYokMetin: 'Sie müssen diese Seite über den Link in der E-Mail öffnen. Sie können die wöchentliche E-Mail auch in den Einstellungen Ihres Kontos ausschalten.',
    hesapBaglantisi: 'Kontoeinstellungen öffnen',
  },
};

export const abonelikMetinleri = (dil: Dil): AbonelikMetinleri => M[dil];
