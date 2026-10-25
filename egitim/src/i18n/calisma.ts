import type { Dil } from '@ortak/i18n/ui';

type VakitMetinleri = Readonly<Record<string, string>>;

interface CalismaMetinleri {
  baslik: string; giris: string; ac: string; geri: string; bolum: string;
  tumu: string; parca: string; tekrar: string; bir: string; uc: string;
  hiz: string; normal: string; yavas: string; sira: string; siraYok: string; sira1: string; sira15: string; sira2: string; baslat: string;
  duraklat: string; surdur: string; durdur: string; hazir: string; bitti: string;
  bekliyor: string; hata: string; kaynak: string; kaynakAciklama: string;
  parcasiz: string; ilerleme: string; js: string;
  /** Ezan vakit seçimi (25 Ekim 2026; katalog `ses.secenekler`): grup başlığı, vakit başına not ve yalnız sabah ezanı için kaynaklı cümle.
   *  Anahtarlar seçenek kimlikleridir (sabah, ogle, ikindi, aksam, yatsi); kimliği olmayan seçenek not almaz. */
  vakitBaslik: string; vakitNotu: VakitMetinleri; vakitEk: Readonly<Record<string, { metin: string; kunye: string }>>;
  /** Yapay ses (katalogda `ses.yapay`, 24 Ekim 2026): görünür etiket ve açıklama. Diyanet kaydı olmayan Kur'an dışı metinlerde çalarken zorunlu. */
  yapayAd: string; yapayNot: string;
}

const METINLER: Record<Dil, CalismaMetinleri> = {
  tr: {
    baslik: 'Dinle ve tekrarla', giris: 'Bir bölümü dinleyin, ardından sesli tekrar edin. Hazır olduğunuzda sıradaki bölüme geçin.',
    ac: 'Çalış', geri: 'Ezber Kilimi’ne dön', bolum: 'Dinlenecek bölüm', tumu: 'Bütün bölümler sırayla', parca: 'Bölüm',
    tekrar: 'Her bölümü dinleme sayısı', bir: '1 kez', uc: '3 kez', hiz: 'Dinleme hızı', normal: 'Normal · 1×', yavas: 'Yavaş · 0,75×',
    sira: 'Senin sıran: her dinleyişten sonra tekrar için bekleme', siraYok: 'Bekleme yok', sira1: 'Dinleme süresi kadar', sira15: 'Dinleme süresinin 1,5 katı', sira2: 'Dinleme süresinin 2 katı', baslat: 'Dinlemeye başla', duraklat: 'Duraklat', surdur: 'Devam et',
    durdur: 'Başa dön', hazir: 'Hazır. Dinlemeyi siz başlatırsınız.', bitti: 'Dinleme tamamlandı. Dilerseniz yeniden çalışabilirsiniz.',
    bekliyor: 'Şimdi siz tekrarlayın.', hata: 'Ses çalınamadı. Bağlantınızı kontrol edip yeniden başlatın.',
    kaynak: 'Diyanet ses kaynağı', kaynakAciklama: 'Bu çalışmada Diyanet İşleri Başkanlığı’nın kayıtlarını dinlersiniz.',
    parcasiz: 'Bu madde tek kayıt olarak dinlenir.', ilerleme: 'Evdeki bu çalışma, hocanın verdiği ezber basamağını değiştirmez.',
    js: 'Çalışma düğmeleri için JavaScript’i etkinleştirin. Kaydı doğrudan da açabilirsiniz.', vakitBaslik: 'Ezanın vakti',
    vakitNotu: { sabah: 'Bu kayıt sabah ezanıdır.', ogle: 'Bu kayıt öğle ezanıdır.', ikindi: 'Bu kayıt ikindi ezanıdır.', aksam: 'Bu kayıt akşam ezanıdır.', yatsi: 'Bu kayıt yatsı ezanıdır.' },
    vakitEk: { sabah: { metin: 'Sabah ezanında “Hayye ale’l-felâh” denildikten sonra iki defa “es-salâtü hayrün mine’n-nevm” (Namaz uykudan hayırlıdır) denilir.', kunye: 'Kaynak: Diyanet İlmihali I, s. 267.' } },
    yapayAd: 'Yapay ses',
    yapayNot: 'Bu madde için Diyanet’in ses kaydı yoktur. Dinlediğiniz ses bilgisayarla üretilmiştir; okunuşu hocanızdan da dinleyin.',
  },
  fr: {
    baslik: 'Écouter et répéter', giris: 'Écoutez un passage, puis répétez-le à voix haute. Passez au suivant à votre rythme.',
    ac: 'Travailler', geri: 'Revenir au kilim', bolum: 'Passage à écouter', tumu: 'Tous les passages dans l’ordre', parca: 'Passage',
    tekrar: 'Écoutes de chaque passage', bir: '1 fois', uc: '3 fois', hiz: 'Vitesse d’écoute', normal: 'Normale · 1×', yavas: 'Lente · 0,75×',
    sira: 'À vous : pause pour répéter après chaque écoute', siraYok: 'Aucune pause', sira1: 'Aussi longue que l’écoute', sira15: '1,5 fois l’écoute', sira2: '2 fois l’écoute', baslat: 'Commencer l’écoute', duraklat: 'Mettre en pause', surdur: 'Reprendre',
    durdur: 'Revenir au début', hazir: 'Prêt. Vous choisissez quand commencer.', bitti: 'Écoute terminée. Vous pouvez recommencer.',
    bekliyor: 'À vous de répéter.', hata: 'Le son ne peut pas être lu. Vérifiez votre connexion et recommencez.',
    kaynak: 'Source audio de la Diyanet', kaynakAciklama: 'Vous écoutez des enregistrements de la Présidence des Affaires religieuses (Diyanet).',
    parcasiz: 'Ce texte est proposé en un seul enregistrement.', ilerleme: 'Ce travail à la maison ne change pas l’étape validée par l’enseignant.',
    js: 'Activez JavaScript pour les commandes. Vous pouvez aussi ouvrir directement l’enregistrement.', vakitBaslik: 'Heure de prière de l’adhan',
    vakitNotu: {
      sabah: 'Cet enregistrement est l’appel à la prière de l’aube.', ogle: 'Cet enregistrement est l’appel à la prière de midi.',
      ikindi: 'Cet enregistrement est l’appel à la prière de l’après-midi.', aksam: 'Cet enregistrement est l’appel à la prière du coucher du soleil.',
      yatsi: 'Cet enregistrement est l’appel à la prière de la nuit.',
    },
    vakitEk: { sabah: { metin: 'Dans l’adhan de l’aube, après « Hayye ale’l-felâh », on dit deux fois « es-salâtü hayrün mine’n-nevm » (La prière est meilleure que le sommeil).', kunye: 'Source : Diyanet İlmihali I, p. 267.' } },
    yapayAd: 'Voix de synthèse',
    yapayNot: 'La Diyanet ne propose pas d’enregistrement pour ce texte. La voix que vous entendez est générée par ordinateur ; écoutez aussi la récitation de votre enseignant.',
  },
  en: {
    baslik: 'Listen and repeat', giris: 'Listen to a passage, then repeat it aloud. Move to the next passage at your own pace.',
    ac: 'Practise', geri: 'Back to the kilim', bolum: 'Passage to listen to', tumu: 'All passages in order', parca: 'Passage',
    tekrar: 'Plays per passage', bir: 'Once', uc: '3 times', hiz: 'Playback speed', normal: 'Normal · 1×', yavas: 'Slow · 0.75×',
    sira: 'Your turn: pause to repeat after each playback', siraYok: 'No pause', sira1: 'As long as the recording', sira15: '1.5 times the recording', sira2: '2 times the recording', baslat: 'Start listening', duraklat: 'Pause', surdur: 'Resume',
    durdur: 'Back to the start', hazir: 'Ready. You choose when to start.', bitti: 'Listening complete. You can practise again.',
    bekliyor: 'Your turn to repeat.', hata: 'The audio could not be played. Check your connection and start again.',
    kaynak: 'Diyanet audio source', kaynakAciklama: 'These recordings come from the Presidency of Religious Affairs (Diyanet).',
    parcasiz: 'This item is available as one recording.', ilerleme: 'This practice at home does not change the stage confirmed by your teacher.',
    js: 'Enable JavaScript to use the controls. You can also open the recording directly.', vakitBaslik: 'Prayer time of the adhan',
    vakitNotu: {
      sabah: 'This recording is the dawn call to prayer.', ogle: 'This recording is the noon call to prayer.', ikindi: 'This recording is the afternoon call to prayer.',
      aksam: 'This recording is the sunset call to prayer.', yatsi: 'This recording is the night call to prayer.',
    },
    vakitEk: { sabah: { metin: 'In the dawn adhan, after “Hayye ale’l-felâh” is said, “es-salâtü hayrün mine’n-nevm” (Prayer is better than sleep) is said twice.', kunye: 'Source: Diyanet İlmihali I, p. 267.' } },
    yapayAd: 'Synthetic voice',
    yapayNot: 'The Diyanet has no recording of this text. The voice you hear is computer-generated; listen to your teacher’s recitation as well.',
  },
  nl: {
    baslik: 'Luisteren en herhalen', giris: 'Luister naar een passage en herhaal die hardop. Ga op uw eigen tempo naar de volgende passage.',
    ac: 'Oefenen', geri: 'Terug naar de kelim', bolum: 'Passage om te beluisteren', tumu: 'Alle passages op volgorde', parca: 'Passage',
    tekrar: 'Aantal luisterbeurten per passage', bir: '1 keer', uc: '3 keer', hiz: 'Afspeelsnelheid', normal: 'Normaal · 1×', yavas: 'Langzaam · 0,75×',
    sira: 'Uw beurt: pauze om te herhalen na elke luisterbeurt', siraYok: 'Geen pauze', sira1: 'Even lang als de opname', sira15: '1,5 keer de opname', sira2: '2 keer de opname', baslat: 'Begin met luisteren', duraklat: 'Pauzeren', surdur: 'Doorgaan',
    durdur: 'Terug naar het begin', hazir: 'Klaar. U kiest wanneer u begint.', bitti: 'Luisteren voltooid. U kunt opnieuw oefenen.',
    bekliyor: 'Nu is het uw beurt om te herhalen.', hata: 'Het geluid kan niet worden afgespeeld. Controleer uw verbinding en begin opnieuw.',
    kaynak: 'Audiobron van Diyanet', kaynakAciklama: 'U luistert naar opnamen van het Presidium voor Religieuze Zaken (Diyanet).',
    parcasiz: 'Dit onderdeel is beschikbaar als één opname.', ilerleme: 'Thuis oefenen verandert de door de leerkracht bevestigde stap niet.',
    js: 'Schakel JavaScript in voor de bediening. U kunt de opname ook rechtstreeks openen.', vakitBaslik: 'Gebedstijd van de adhan',
    vakitNotu: {
      sabah: 'Dit is de oproep tot het ochtendgebed.', ogle: 'Dit is de oproep tot het middaggebed.', ikindi: 'Dit is de oproep tot het namiddaggebed.',
      aksam: 'Dit is de oproep tot het avondgebed.', yatsi: 'Dit is de oproep tot het nachtgebed.',
    },
    vakitEk: { sabah: { metin: 'In de adhan van het ochtendgebed wordt, nadat „Hayye ale’l-felâh” is gezegd, tweemaal „es-salâtü hayrün mine’n-nevm” (Het gebed is beter dan slaap) gezegd.', kunye: 'Bron: Diyanet İlmihali I, p. 267.' } },
    yapayAd: 'Synthetische stem',
    yapayNot: 'Van Diyanet bestaat geen opname van deze tekst. De stem die u hoort is door een computer gegenereerd; luister ook naar de voordracht van uw leerkracht.',
  },
  de: {
    baslik: 'Hören und wiederholen', giris: 'Hören Sie einen Abschnitt und wiederholen Sie ihn laut. Gehen Sie in Ihrem eigenen Tempo zum nächsten Abschnitt.',
    ac: 'Üben', geri: 'Zurück zum Kelim', bolum: 'Abschnitt zum Anhören', tumu: 'Alle Abschnitte der Reihe nach', parca: 'Abschnitt',
    tekrar: 'Wiedergaben pro Abschnitt', bir: '1 Mal', uc: '3 Mal', hiz: 'Wiedergabegeschwindigkeit', normal: 'Normal · 1×', yavas: 'Langsam · 0,75×',
    sira: 'Sie sind dran: Pause zum Wiederholen nach jeder Wiedergabe', siraYok: 'Keine Pause', sira1: 'So lang wie die Aufnahme', sira15: '1,5-mal so lang wie die Aufnahme', sira2: 'Doppelt so lang wie die Aufnahme', baslat: 'Anhören starten', duraklat: 'Pausieren', surdur: 'Fortsetzen',
    durdur: 'Zurück zum Anfang', hazir: 'Bereit. Sie entscheiden, wann es losgeht.', bitti: 'Wiedergabe beendet. Sie können erneut üben.',
    bekliyor: 'Jetzt sind Sie mit dem Wiederholen dran.', hata: 'Die Aufnahme konnte nicht abgespielt werden. Prüfen Sie Ihre Verbindung und starten Sie erneut.',
    kaynak: 'Diyanet-Audioquelle', kaynakAciklama: 'Sie hören Aufnahmen des Präsidiums für Religionsangelegenheiten (Diyanet).',
    parcasiz: 'Dieser Inhalt ist als eine Aufnahme verfügbar.', ilerleme: 'Das Üben zu Hause ändert die von der Lehrkraft bestätigte Stufe nicht.',
    js: 'Aktivieren Sie JavaScript für die Steuerung. Sie können die Aufnahme auch direkt öffnen.', vakitBaslik: 'Gebetszeit des Adhan',
    vakitNotu: {
      sabah: 'Diese Aufnahme ist der Gebetsruf zum Morgengebet.', ogle: 'Diese Aufnahme ist der Gebetsruf zum Mittagsgebet.', ikindi: 'Diese Aufnahme ist der Gebetsruf zum Nachmittagsgebet.',
      aksam: 'Diese Aufnahme ist der Gebetsruf zum Abendgebet.', yatsi: 'Diese Aufnahme ist der Gebetsruf zum Nachtgebet.',
    },
    vakitEk: { sabah: { metin: 'Beim Adhan zum Morgengebet wird, nachdem „Hayye ale’l-felâh“ gesprochen wurde, zweimal „es-salâtü hayrün mine’n-nevm“ (Das Gebet ist besser als der Schlaf) gesprochen.', kunye: 'Quelle: Diyanet İlmihali I, S. 267.' } },
    yapayAd: 'Synthetische Stimme',
    yapayNot: 'Von der Diyanet gibt es keine Aufnahme dieses Textes. Die Stimme, die Sie hören, wurde vom Computer erzeugt; hören Sie auch den Vortrag Ihrer Lehrkraft.',
  },
};

export const calismaMetinleri = (dil: Dil): CalismaMetinleri => METINLER[dil];
