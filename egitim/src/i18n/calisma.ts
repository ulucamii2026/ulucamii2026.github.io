import type { Dil } from '@ortak/i18n/ui';

interface CalismaMetinleri {
  baslik: string; giris: string; ac: string; geri: string; bolum: string;
  tumu: string; parca: string; tekrar: string; bir: string; uc: string;
  hiz: string; normal: string; yavas: string; bekle: string; baslat: string;
  duraklat: string; surdur: string; durdur: string; hazir: string; bitti: string;
  bekliyor: string; hata: string; kaynak: string; kaynakAciklama: string;
  parcasiz: string; ilerleme: string; js: string; ezan: string;
}

const METINLER: Record<Dil, CalismaMetinleri> = {
  tr: {
    baslik: 'Dinle ve tekrarla', giris: 'Bir bölümü dinleyin, ardından sesli tekrar edin. Hazır olduğunuzda sıradaki bölüme geçin.',
    ac: 'Çalış', geri: 'Ezber Kilimi’ne dön', bolum: 'Dinlenecek bölüm', tumu: 'Bütün bölümler sırayla', parca: 'Bölüm',
    tekrar: 'Her bölümü dinleme sayısı', bir: '1 kez', uc: '3 kez', hiz: 'Dinleme hızı', normal: 'Normal · 1×', yavas: 'Yavaş · 0,75×',
    bekle: 'Her dinleyişten sonra tekrar için 3 saniye bekle', baslat: 'Dinlemeye başla', duraklat: 'Duraklat', surdur: 'Devam et',
    durdur: 'Başa dön', hazir: 'Hazır. Dinlemeyi siz başlatırsınız.', bitti: 'Dinleme tamamlandı. Dilerseniz yeniden çalışabilirsiniz.',
    bekliyor: 'Şimdi siz tekrarlayın.', hata: 'Ses çalınamadı. Bağlantınızı kontrol edip yeniden başlatın.',
    kaynak: 'Diyanet ses kaynağı', kaynakAciklama: 'Bu çalışmada Diyanet İşleri Başkanlığı’nın kayıtlarını dinlersiniz.',
    parcasiz: 'Bu madde tek kayıt olarak dinlenir.', ilerleme: 'Evdeki bu çalışma, hocanın verdiği ezber basamağını değiştirmez.',
    js: 'Çalışma düğmeleri için JavaScript’i etkinleştirin. Kaydı doğrudan da açabilirsiniz.', ezan: 'Bu kayıt sabah ezanıdır.',
  },
  fr: {
    baslik: 'Écouter et répéter', giris: 'Écoutez un passage, puis répétez-le à voix haute. Passez au suivant à votre rythme.',
    ac: 'Travailler', geri: 'Revenir au kilim', bolum: 'Passage à écouter', tumu: 'Tous les passages dans l’ordre', parca: 'Passage',
    tekrar: 'Écoutes de chaque passage', bir: '1 fois', uc: '3 fois', hiz: 'Vitesse d’écoute', normal: 'Normale · 1×', yavas: 'Lente · 0,75×',
    bekle: 'Attendre 3 secondes après chaque écoute pour répéter', baslat: 'Commencer l’écoute', duraklat: 'Mettre en pause', surdur: 'Reprendre',
    durdur: 'Revenir au début', hazir: 'Prêt. Vous choisissez quand commencer.', bitti: 'Écoute terminée. Vous pouvez recommencer.',
    bekliyor: 'À vous de répéter.', hata: 'Le son ne peut pas être lu. Vérifiez votre connexion et recommencez.',
    kaynak: 'Source audio de la Diyanet', kaynakAciklama: 'Vous écoutez des enregistrements de la Présidence des Affaires religieuses (Diyanet).',
    parcasiz: 'Ce texte est proposé en un seul enregistrement.', ilerleme: 'Ce travail à la maison ne change pas l’étape validée par l’enseignant.',
    js: 'Activez JavaScript pour les commandes. Vous pouvez aussi ouvrir directement l’enregistrement.', ezan: 'Cet enregistrement est l’appel à la prière de l’aube.',
  },
  en: {
    baslik: 'Listen and repeat', giris: 'Listen to a passage, then repeat it aloud. Move to the next passage at your own pace.',
    ac: 'Practise', geri: 'Back to the kilim', bolum: 'Passage to listen to', tumu: 'All passages in order', parca: 'Passage',
    tekrar: 'Plays per passage', bir: 'Once', uc: '3 times', hiz: 'Playback speed', normal: 'Normal · 1×', yavas: 'Slow · 0.75×',
    bekle: 'Wait 3 seconds after each playback to repeat aloud', baslat: 'Start listening', duraklat: 'Pause', surdur: 'Resume',
    durdur: 'Back to the start', hazir: 'Ready. You choose when to start.', bitti: 'Listening complete. You can practise again.',
    bekliyor: 'Your turn to repeat.', hata: 'The audio could not be played. Check your connection and start again.',
    kaynak: 'Diyanet audio source', kaynakAciklama: 'These recordings come from the Presidency of Religious Affairs (Diyanet).',
    parcasiz: 'This item is available as one recording.', ilerleme: 'This practice at home does not change the stage confirmed by your teacher.',
    js: 'Enable JavaScript to use the controls. You can also open the recording directly.', ezan: 'This recording is the dawn call to prayer.',
  },
  nl: {
    baslik: 'Luisteren en herhalen', giris: 'Luister naar een passage en herhaal die hardop. Ga op uw eigen tempo naar de volgende passage.',
    ac: 'Oefenen', geri: 'Terug naar de kelim', bolum: 'Passage om te beluisteren', tumu: 'Alle passages op volgorde', parca: 'Passage',
    tekrar: 'Aantal luisterbeurten per passage', bir: '1 keer', uc: '3 keer', hiz: 'Afspeelsnelheid', normal: 'Normaal · 1×', yavas: 'Langzaam · 0,75×',
    bekle: 'Na elke luisterbeurt 3 seconden wachten om te herhalen', baslat: 'Begin met luisteren', duraklat: 'Pauzeren', surdur: 'Doorgaan',
    durdur: 'Terug naar het begin', hazir: 'Klaar. U kiest wanneer u begint.', bitti: 'Luisteren voltooid. U kunt opnieuw oefenen.',
    bekliyor: 'Nu is het uw beurt om te herhalen.', hata: 'Het geluid kan niet worden afgespeeld. Controleer uw verbinding en begin opnieuw.',
    kaynak: 'Audiobron van Diyanet', kaynakAciklama: 'U luistert naar opnamen van het Presidium voor Religieuze Zaken (Diyanet).',
    parcasiz: 'Dit onderdeel is beschikbaar als één opname.', ilerleme: 'Thuis oefenen verandert de door de leerkracht bevestigde stap niet.',
    js: 'Schakel JavaScript in voor de bediening. U kunt de opname ook rechtstreeks openen.', ezan: 'Dit is de oproep tot het ochtendgebed.',
  },
  de: {
    baslik: 'Hören und wiederholen', giris: 'Hören Sie einen Abschnitt und wiederholen Sie ihn laut. Gehen Sie in Ihrem eigenen Tempo zum nächsten Abschnitt.',
    ac: 'Üben', geri: 'Zurück zum Kelim', bolum: 'Abschnitt zum Anhören', tumu: 'Alle Abschnitte der Reihe nach', parca: 'Abschnitt',
    tekrar: 'Wiedergaben pro Abschnitt', bir: '1 Mal', uc: '3 Mal', hiz: 'Wiedergabegeschwindigkeit', normal: 'Normal · 1×', yavas: 'Langsam · 0,75×',
    bekle: 'Nach jeder Wiedergabe 3 Sekunden zum Wiederholen warten', baslat: 'Anhören starten', duraklat: 'Pausieren', surdur: 'Fortsetzen',
    durdur: 'Zurück zum Anfang', hazir: 'Bereit. Sie entscheiden, wann es losgeht.', bitti: 'Wiedergabe beendet. Sie können erneut üben.',
    bekliyor: 'Jetzt sind Sie mit dem Wiederholen dran.', hata: 'Die Aufnahme konnte nicht abgespielt werden. Prüfen Sie Ihre Verbindung und starten Sie erneut.',
    kaynak: 'Diyanet-Audioquelle', kaynakAciklama: 'Sie hören Aufnahmen des Präsidiums für Religionsangelegenheiten (Diyanet).',
    parcasiz: 'Dieser Inhalt ist als eine Aufnahme verfügbar.', ilerleme: 'Das Üben zu Hause ändert die von der Lehrkraft bestätigte Stufe nicht.',
    js: 'Aktivieren Sie JavaScript für die Steuerung. Sie können die Aufnahme auch direkt öffnen.', ezan: 'Diese Aufnahme ist der Gebetsruf zum Morgengebet.',
  },
};

export const calismaMetinleri = (dil: Dil): CalismaMetinleri => METINLER[dil];
