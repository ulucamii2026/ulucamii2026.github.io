/**
 * «Kendini sına» ve «Bugün tekrar» metinleri (Faz 2d, 24 Ekim 2026). Kip metinlerinin (kip.ts) yanında durur ve onlarla birlikte
 * sayfaya `data-veri` içinde JSON olarak gider (işlev taşınamaz); değişken yerleri `{ad}` biçimindedir, betik doldurur.
 * Fransız tipografisi derlemede middleware'den gelir. Oyunlarda puan, sıralama ve doğru/yanlış sesi yoktur: sonuç yalnız
 * çocuğun kendi değerlendirmesine girdidir ve «sonraki tekrar önerisi»ni belirler (hocanın verdiği basamağı değiştirmez).
 */
import type { Dil } from '@ortak/i18n/ui';

export interface SinaMetinleri {
  sinaGiris: string; oyunlar: string; oyunSirala: string; oyunEksik: string; oyunHangi: string; oyunKayit: string;
  sinaKisa: string; hangiYok: string; yeniTur: string;
  siralaYonerge: string; yukari: string; asagi: string; yerinde: string; siraTamam: string; siraDevam: string; cevapGoster: string; dogruYerde: string;
  eksikYonerge: string; soruNo: string; eksikEtiket: string; dogruCevap: string; yanlisCevap: string; dogruSecenek: string; sonrakiSoru: string; bitirOyun: string; dogruSayi: string;
  hangiYonerge: string; sesiCal: string;
  oyunAnlam: string; anlamYonerge: string; anlamArapca: string; anlamMeal: string; anlamEsti: string; anlamEsmedi: string; anlamHepsi: string;
  anlamGoster: string; anlamGosterildi: string; anlamEslendi: string; anlamEsleti: string; anlamNot: string;
  kayitBaslik: string; kayitAciklama: string; kayitBasla: string; kayitDur: string; kayitSuruyor: string; kayitHazir: string;
  kayitDinle: string; kayitHafiz: string; kayitSil: string; kayitYok: string; kayitIzin: string; kayitBekle: string; kayitHata: string;
  sinaNasil: string; yanitTam: string; yanitAz: string; yanitTekrar: string; oneri: string; oneriNot: string; tekrarGunu: string; kayitliOneri: string;
}

const SINA: Record<Dil, SinaMetinleri> = {
  tr: {
    sinaGiris: 'Metne bakmadan ne kadar hatırlıyorsunuz? Puan ve sıralama yok; sonuç yalnız bir sonraki tekrar için öneri verir.',
    oyunlar: 'Bir oyun seçin', oyunSirala: 'Sırala', oyunEksik: 'Eksik kelime', oyunHangi: 'Hangi âyet?', oyunKayit: 'Kendi sesim',
    sinaKisa: 'Bu madde bu oyun için çok kısa. Başka bir oyun seçin.', hangiYok: 'Bu oyun için âyet âyet kayıt gerekir; bu maddede yok.', yeniTur: 'Yeni tur',
    siralaYonerge: 'Parçaları doğru sıraya koyun. Taşımak için ↑ ↓ düğmelerini ya da Alt + ok tuşlarını kullanın.',
    yukari: '{n}. parçayı yukarı taşı', asagi: '{n}. parçayı aşağı taşı', yerinde: 'Yerinde olan parça: {y} / {n}',
    siraTamam: 'Hepsi doğru sırada.', siraDevam: 'Düzeltip yeniden kontrol edebilirsiniz.', cevapGoster: 'Doğru sırayı göster', dogruYerde: 'doğru yerde',
    eksikYonerge: 'Eksik kelime hangisi?', soruNo: 'Soru {k} / {n}', eksikEtiket: 'eksik kelime', dogruCevap: 'Doğru.', yanlisCevap: 'Doğru seçenek işaretlendi.',
    sonrakiSoru: 'Sonraki soru', bitirOyun: 'Bitir', dogruSayi: 'Doğru: {d} / {n}',
    dogruSecenek: 'Doğru seçenek:',
    hangiYonerge: 'Dinleyin, sonra hangi âyet olduğunu seçin.', sesiCal: 'Dinle',
    oyunAnlam: 'Anlamla eşleştir', anlamYonerge: 'Bir bölümü seçin, sonra anlamını seçin. Eşleşenler aynı numarayla işaretlenir.',
    anlamArapca: 'Arapça bölümler', anlamMeal: 'Anlamlar', anlamEsti: 'Eşleşti. Kalan: {n}.', anlamEsmedi: 'Bu ikisi eşleşmedi; başka bir anlam deneyin.',
    anlamHepsi: 'Hepsi eşleşti.', anlamGoster: 'Eşleşmeleri göster', anlamGosterildi: 'Doğru eşleşmeler gösterildi.', anlamEslendi: 'eşleşti', anlamEsleti: 'Bölüm {n} ile eşleşti',
    anlamNot: 'Anlamlar bu sayfadaki metinden alınır; kaynağı metnin altındaki künyede yazar.',
    kayitBaslik: 'Kendi sesinizi kaydedin',
    kayitAciklama: 'Ezberden okuyun, kaydınızı dinleyin, sonra hafızın okuyuşuyla karşılaştırın. Kayıt yalnız bu sayfada kalır; hiçbir yere gönderilmez ve sayfayı kapatınca silinir.',
    kayitBasla: 'Kaydı başlat', kayitDur: 'Kaydı durdur', kayitSuruyor: 'Kayıt sürüyor… (en çok 3 dakika)', kayitHazir: 'Kayıt hazır.',
    kayitDinle: 'Kaydımı dinle', kayitHafiz: 'Hafızın okuyuşunu dinle', kayitSil: 'Kaydı sil',
    kayitYok: 'Bu tarayıcı ses kaydını desteklemiyor.', kayitBekle: 'Mikrofon izni bekleniyor… Tarayıcıdaki izin penceresine bakın.', kayitIzin: 'Mikrofon izni verilmedi. Tarayıcının adres çubuğundan izin verebilirsiniz.', kayitHata: 'Kayıt başlatılamadı.',
    sinaNasil: 'Ezberden okuduktan sonra: nasıl geçti?', yanitTam: 'Güzel.', yanitAz: 'Olur.', yanitTekrar: 'Sorun değil.',
    oneri: 'Sonraki tekrar önerisi: {ne} ({tarih}).',
    oneriNot: 'Bu yalnız bir öneridir; hocanın verdiği basamak değişmez. Hazır olunca hocana oku.',
    tekrarGunu: 'Bu madde için tekrar günü geldi.', kayitliOneri: 'Bu madde için tekrar önerisi: {ne} ({tarih}).',
  },
  fr: {
    sinaGiris: 'Vous souvenez-vous du texte sans le regarder ? Il n’y a ni points ni classement : le résultat sert seulement à vous conseiller quand réviser.',
    oyunlar: 'Choisissez un jeu', oyunSirala: 'Remettre dans l’ordre', oyunEksik: 'Mot manquant', oyunHangi: 'Quel verset ?', oyunKayit: 'Ma voix',
    sinaKisa: 'Ce contenu est trop court pour ce jeu. Choisissez-en un autre.', hangiYok: 'Ce jeu demande un enregistrement par verset ; ce contenu n’en a pas.', yeniTur: 'Nouveau tour',
    siralaYonerge: 'Remettez les passages dans le bon ordre. Déplacez-les avec les boutons ↑ ↓ ou avec Alt + flèches.',
    yukari: 'Monter le passage {n}', asagi: 'Descendre le passage {n}', yerinde: 'Passages à la bonne place : {y} / {n}',
    siraTamam: 'Tout est dans le bon ordre.', siraDevam: 'Corrigez, puis vérifiez à nouveau.', cevapGoster: 'Montrer l’ordre correct', dogruYerde: 'à la bonne place',
    eksikYonerge: 'Quel est le mot manquant ?', soruNo: 'Question {k} / {n}', eksikEtiket: 'mot manquant', dogruCevap: 'Bonne réponse.', yanlisCevap: 'La bonne réponse est indiquée.',
    sonrakiSoru: 'Question suivante', bitirOyun: 'Terminer', dogruSayi: 'Bonnes réponses : {d} / {n}',
    dogruSecenek: 'Bonne réponse :',
    hangiYonerge: 'Écoutez, puis choisissez de quel verset il s’agit.', sesiCal: 'Écouter',
    oyunAnlam: 'Associer au sens', anlamYonerge: 'Choisissez un passage, puis son sens. Les paires trouvées portent le même numéro.',
    anlamArapca: 'Passages en arabe', anlamMeal: 'Sens', anlamEsti: 'Bonne association. Il en reste : {n}.', anlamEsmedi: 'Ces deux éléments ne vont pas ensemble ; essayez un autre sens.',
    anlamHepsi: 'Toutes les paires sont trouvées.', anlamGoster: 'Montrer les paires', anlamGosterildi: 'Les bonnes paires sont affichées.', anlamEslendi: 'associé', anlamEsleti: 'associé au passage {n}',
    anlamNot: 'Les sens viennent du texte de cette page ; la source est indiquée sous le texte.',
    kayitBaslik: 'Enregistrez votre voix',
    kayitAciklama: 'Récitez de mémoire, écoutez votre enregistrement, puis comparez-le avec celui du récitant. L’enregistrement reste sur cette page : il n’est envoyé nulle part et disparaît quand vous fermez la page.',
    kayitBasla: 'Commencer l’enregistrement', kayitDur: 'Arrêter l’enregistrement', kayitSuruyor: 'Enregistrement en cours… (3 minutes au maximum)', kayitHazir: 'Enregistrement prêt.',
    kayitDinle: 'Écouter mon enregistrement', kayitHafiz: 'Écouter le récitant', kayitSil: 'Supprimer l’enregistrement',
    kayitYok: 'Ce navigateur ne permet pas d’enregistrer le son.', kayitBekle: 'En attente de l’autorisation du microphone… Consultez la fenêtre d’autorisation du navigateur.', kayitIzin: 'L’accès au microphone n’a pas été autorisé. Vous pouvez l’autoriser depuis la barre d’adresse du navigateur.', kayitHata: 'L’enregistrement n’a pas pu démarrer.',
    sinaNasil: 'Après avoir récité de mémoire : comment cela s’est-il passé ?', yanitTam: 'Très bien.', yanitAz: 'D’accord.', yanitTekrar: 'Pas de souci.',
    oneri: 'Révision conseillée : {ne} ({tarih}).',
    oneriNot: 'Ce n’est qu’un conseil : l’étape donnée par l’enseignant ne change pas. Récitez-lui quand vous êtes prêt.',
    tekrarGunu: 'C’est le jour de réviser ce contenu.', kayitliOneri: 'Révision conseillée pour ce contenu : {ne} ({tarih}).',
  },
  en: {
    sinaGiris: 'How much do you remember without looking? There are no points or rankings; the result only suggests when to review.',
    oyunlar: 'Choose a game', oyunSirala: 'Put in order', oyunEksik: 'Missing word', oyunHangi: 'Which verse?', oyunKayit: 'My voice',
    sinaKisa: 'This item is too short for this game. Choose another one.', hangiYok: 'This game needs a recording for each verse; this item has none.', yeniTur: 'New round',
    siralaYonerge: 'Put the parts in the right order. Move them with the ↑ ↓ buttons or Alt + arrow keys.',
    yukari: 'Move part {n} up', asagi: 'Move part {n} down', yerinde: 'Parts in the right place: {y} / {n}',
    siraTamam: 'Everything is in the right order.', siraDevam: 'Fix it and check again.', cevapGoster: 'Show the correct order', dogruYerde: 'in the right place',
    eksikYonerge: 'Which word is missing?', soruNo: 'Question {k} / {n}', eksikEtiket: 'missing word', dogruCevap: 'Correct.', yanlisCevap: 'The correct answer is marked.',
    sonrakiSoru: 'Next question', bitirOyun: 'Finish', dogruSayi: 'Correct: {d} / {n}',
    dogruSecenek: 'Correct answer:',
    hangiYonerge: 'Listen, then choose which verse it was.', sesiCal: 'Listen',
    oyunAnlam: 'Match the meaning', anlamYonerge: 'Choose a passage, then choose its meaning. Matched pairs get the same number.',
    anlamArapca: 'Arabic passages', anlamMeal: 'Meanings', anlamEsti: 'Matched. Left: {n}.', anlamEsmedi: 'These two do not go together; try another meaning.',
    anlamHepsi: 'All pairs matched.', anlamGoster: 'Show the pairs', anlamGosterildi: 'The correct pairs are shown.', anlamEslendi: 'matched', anlamEsleti: 'matched with passage {n}',
    anlamNot: 'The meanings come from the text on this page; the source is given under the text.',
    kayitBaslik: 'Record your voice',
    kayitAciklama: 'Recite from memory, listen to your recording, then compare it with the reciter. The recording stays on this page: it is sent nowhere and disappears when you close the page.',
    kayitBasla: 'Start recording', kayitDur: 'Stop recording', kayitSuruyor: 'Recording… (3 minutes at most)', kayitHazir: 'Recording ready.',
    kayitDinle: 'Listen to my recording', kayitHafiz: 'Listen to the reciter', kayitSil: 'Delete the recording',
    kayitYok: 'This browser cannot record sound.', kayitBekle: 'Waiting for microphone permission… Check the browser’s permission prompt.', kayitIzin: 'Microphone access was not allowed. You can allow it from the browser’s address bar.', kayitHata: 'Recording could not start.',
    sinaNasil: 'After reciting from memory: how did it go?', yanitTam: 'Well done.', yanitAz: 'All right.', yanitTekrar: 'No problem.',
    oneri: 'Suggested review: {ne} ({tarih}).',
    oneriNot: 'This is only a suggestion: the stage your teacher gave does not change. Recite to your teacher when you are ready.',
    tekrarGunu: 'It is time to review this item.', kayitliOneri: 'Suggested review for this item: {ne} ({tarih}).',
  },
  nl: {
    sinaGiris: 'Hoeveel weet u nog zonder te kijken? Er zijn geen punten of ranglijsten; de uitkomst stelt alleen voor wanneer u herhaalt.',
    oyunlar: 'Kies een spel', oyunSirala: 'In volgorde zetten', oyunEksik: 'Ontbrekend woord', oyunHangi: 'Welk vers?', oyunKayit: 'Mijn stem',
    sinaKisa: 'Dit onderdeel is te kort voor dit spel. Kies een ander spel.', hangiYok: 'Dit spel heeft een opname per vers nodig; dit onderdeel heeft die niet.', yeniTur: 'Nieuwe ronde',
    siralaYonerge: 'Zet de stukken in de juiste volgorde. Verplaats ze met de knoppen ↑ ↓ of met Alt + pijltjestoetsen.',
    yukari: 'Stuk {n} omhoog', asagi: 'Stuk {n} omlaag', yerinde: 'Stukken op de juiste plaats: {y} / {n}',
    siraTamam: 'Alles staat in de juiste volgorde.', siraDevam: 'Pas het aan en controleer opnieuw.', cevapGoster: 'Juiste volgorde tonen', dogruYerde: 'op de juiste plaats',
    eksikYonerge: 'Welk woord ontbreekt?', soruNo: 'Vraag {k} / {n}', eksikEtiket: 'ontbrekend woord', dogruCevap: 'Goed.', yanlisCevap: 'Het juiste antwoord is gemarkeerd.',
    sonrakiSoru: 'Volgende vraag', bitirOyun: 'Afronden', dogruSayi: 'Goed: {d} / {n}',
    dogruSecenek: 'Juiste keuze:',
    hangiYonerge: 'Luister en kies welk vers het was.', sesiCal: 'Luisteren',
    oyunAnlam: 'Betekenis koppelen', anlamYonerge: 'Kies een passage en kies daarna de betekenis ervan. Gekoppelde paren krijgen hetzelfde nummer.',
    anlamArapca: 'Arabische passages', anlamMeal: 'Betekenissen', anlamEsti: 'Gekoppeld. Nog te gaan: {n}.', anlamEsmedi: 'Deze twee horen niet bij elkaar; probeer een andere betekenis.',
    anlamHepsi: 'Alle paren zijn gekoppeld.', anlamGoster: 'Paren tonen', anlamGosterildi: 'De juiste paren worden getoond.', anlamEslendi: 'gekoppeld', anlamEsleti: 'gekoppeld aan passage {n}',
    anlamNot: 'De betekenissen komen uit de tekst op deze pagina; de bron staat onder de tekst.',
    kayitBaslik: 'Neem uw stem op',
    kayitAciklama: 'Reciteer uit het hoofd, luister naar uw opname en vergelijk die met de reciteur. De opname blijft op deze pagina: ze wordt nergens naartoe gestuurd en verdwijnt als u de pagina sluit.',
    kayitBasla: 'Opname starten', kayitDur: 'Opname stoppen', kayitSuruyor: 'Opname loopt… (maximaal 3 minuten)', kayitHazir: 'Opname klaar.',
    kayitDinle: 'Mijn opname beluisteren', kayitHafiz: 'De reciteur beluisteren', kayitSil: 'Opname verwijderen',
    kayitYok: 'Deze browser kan geen geluid opnemen.', kayitBekle: 'Wachten op toestemming voor de microfoon… Kijk naar het toestemmingsvenster van de browser.', kayitIzin: 'Toegang tot de microfoon is niet toegestaan. U kunt dit toestaan via de adresbalk van de browser.', kayitHata: 'De opname kon niet starten.',
    sinaNasil: 'Na het reciteren uit het hoofd: hoe ging het?', yanitTam: 'Mooi.', yanitAz: 'Prima.', yanitTekrar: 'Geen probleem.',
    oneri: 'Voorgestelde herhaling: {ne} ({tarih}).',
    oneriNot: 'Dit is slechts een voorstel: de stap die de leerkracht heeft gegeven verandert niet. Draag voor aan de leerkracht als u klaar bent.',
    tekrarGunu: 'Het is tijd om dit onderdeel te herhalen.', kayitliOneri: 'Voorgestelde herhaling voor dit onderdeel: {ne} ({tarih}).',
  },
  de: {
    sinaGiris: 'Wie viel wissen Sie, ohne hinzusehen? Es gibt keine Punkte und keine Rangliste; das Ergebnis schlägt nur vor, wann Sie wiederholen.',
    oyunlar: 'Spiel wählen', oyunSirala: 'In Reihenfolge bringen', oyunEksik: 'Fehlendes Wort', oyunHangi: 'Welcher Vers?', oyunKayit: 'Meine Stimme',
    sinaKisa: 'Dieser Inhalt ist für dieses Spiel zu kurz. Wählen Sie ein anderes.', hangiYok: 'Dieses Spiel braucht eine Aufnahme pro Vers; dieser Inhalt hat keine.', yeniTur: 'Neue Runde',
    siralaYonerge: 'Bringen Sie die Teile in die richtige Reihenfolge. Verschieben Sie sie mit den Tasten ↑ ↓ oder mit Alt + Pfeiltasten.',
    yukari: 'Teil {n} nach oben', asagi: 'Teil {n} nach unten', yerinde: 'Teile an der richtigen Stelle: {y} / {n}',
    siraTamam: 'Alles steht in der richtigen Reihenfolge.', siraDevam: 'Korrigieren Sie und prüfen Sie erneut.', cevapGoster: 'Richtige Reihenfolge zeigen', dogruYerde: 'an der richtigen Stelle',
    eksikYonerge: 'Welches Wort fehlt?', soruNo: 'Frage {k} / {n}', eksikEtiket: 'fehlendes Wort', dogruCevap: 'Richtig.', yanlisCevap: 'Die richtige Antwort ist markiert.',
    sonrakiSoru: 'Nächste Frage', bitirOyun: 'Beenden', dogruSayi: 'Richtig: {d} / {n}',
    dogruSecenek: 'Richtige Auswahl:',
    hangiYonerge: 'Hören Sie zu und wählen Sie, welcher Vers es war.', sesiCal: 'Anhören',
    oyunAnlam: 'Bedeutung zuordnen', anlamYonerge: 'Wählen Sie einen Abschnitt und dann seine Bedeutung. Zugeordnete Paare tragen dieselbe Nummer.',
    anlamArapca: 'Arabische Abschnitte', anlamMeal: 'Bedeutungen', anlamEsti: 'Zugeordnet. Noch offen: {n}.', anlamEsmedi: 'Diese beiden gehören nicht zusammen; versuchen Sie eine andere Bedeutung.',
    anlamHepsi: 'Alle Paare sind zugeordnet.', anlamGoster: 'Paare zeigen', anlamGosterildi: 'Die richtigen Paare werden angezeigt.', anlamEslendi: 'zugeordnet', anlamEsleti: 'zugeordnet zu Abschnitt {n}',
    anlamNot: 'Die Bedeutungen stammen aus dem Text dieser Seite; die Quelle steht unter dem Text.',
    kayitBaslik: 'Nehmen Sie Ihre Stimme auf',
    kayitAciklama: 'Rezitieren Sie auswendig, hören Sie Ihre Aufnahme an und vergleichen Sie sie mit dem Rezitator. Die Aufnahme bleibt auf dieser Seite: Sie wird nirgendwohin gesendet und verschwindet, wenn Sie die Seite schließen.',
    kayitBasla: 'Aufnahme starten', kayitDur: 'Aufnahme beenden', kayitSuruyor: 'Aufnahme läuft… (höchstens 3 Minuten)', kayitHazir: 'Aufnahme bereit.',
    kayitDinle: 'Meine Aufnahme anhören', kayitHafiz: 'Den Rezitator anhören', kayitSil: 'Aufnahme löschen',
    kayitYok: 'Dieser Browser kann keinen Ton aufnehmen.', kayitBekle: 'Warte auf die Mikrofonfreigabe… Beachten Sie die Anfrage des Browsers.', kayitIzin: 'Der Zugriff auf das Mikrofon wurde nicht erlaubt. Sie können ihn in der Adressleiste des Browsers erlauben.', kayitHata: 'Die Aufnahme konnte nicht gestartet werden.',
    sinaNasil: 'Nach dem Auswendig-Rezitieren: Wie ist es gelaufen?', yanitTam: 'Sehr gut.', yanitAz: 'In Ordnung.', yanitTekrar: 'Kein Problem.',
    oneri: 'Vorgeschlagene Wiederholung: {ne} ({tarih}).',
    oneriNot: 'Das ist nur ein Vorschlag: Die von der Lehrkraft vergebene Stufe ändert sich nicht. Tragen Sie vor, wenn Sie bereit sind.',
    tekrarGunu: 'Es ist Zeit, diesen Inhalt zu wiederholen.', kayitliOneri: 'Vorgeschlagene Wiederholung für diesen Inhalt: {ne} ({tarih}).',
  },
};

export function sinaMetinleri(dil: Dil): SinaMetinleri {
  return SINA[dil];
}

/** Giriş sayfasındaki «Bugün tekrar» bandı. Çoğul için iki kalıp: tek madde (`bir`) ve birden çok (`cok`); `yok` sıfır içindir. */
export interface TekrarMetinleri {
  baslik: string; bir: string; cok: string; yok: string; hafta1: string; haftaN: string; liste: string; not: string; ac: string;
}

const TEKRAR: Record<Dil, TekrarMetinleri> = {
  tr: {
    baslik: 'Bugün tekrar', bir: 'Bugün tekrar edilecek: 1 madde', cok: 'Bugün tekrar edilecek: {n} madde', yok: 'Bugün tekrar günü olan madde yok.',
    hafta1: 'Bu hafta 1 gün çalıştınız.', haftaN: 'Bu hafta {k} gün çalıştınız.', liste: 'Bugün tekrar edilecek maddeler',
    not: 'Bu liste yalnız bu cihazdaki çalışmanıza dayanır; hocanın verdiği basamağı değiştirmez.', ac: 'Çalış',
  },
  fr: {
    baslik: 'À réviser aujourd’hui', bir: 'À réviser aujourd’hui : 1 contenu', cok: 'À réviser aujourd’hui : {n} contenus', yok: 'Aucun contenu à réviser aujourd’hui.',
    hafta1: 'Vous avez travaillé 1 jour cette semaine.', haftaN: 'Vous avez travaillé {k} jours cette semaine.', liste: 'Contenus à réviser aujourd’hui',
    not: 'Cette liste repose uniquement sur votre travail sur cet appareil ; elle ne change pas l’étape donnée par l’enseignant.', ac: 'Travailler',
  },
  en: {
    baslik: 'Review today', bir: 'To review today: 1 item', cok: 'To review today: {n} items', yok: 'Nothing to review today.',
    hafta1: 'You practised 1 day this week.', haftaN: 'You practised {k} days this week.', liste: 'Items to review today',
    not: 'This list is based only on your practice on this device; it does not change the stage your teacher gave.', ac: 'Practise',
  },
  nl: {
    baslik: 'Vandaag herhalen', bir: 'Vandaag te herhalen: 1 onderdeel', cok: 'Vandaag te herhalen: {n} onderdelen', yok: 'Vandaag niets te herhalen.',
    hafta1: 'U hebt deze week 1 dag geoefend.', haftaN: 'U hebt deze week {k} dagen geoefend.', liste: 'Onderdelen om vandaag te herhalen',
    not: 'Deze lijst is alleen gebaseerd op uw oefening op dit apparaat; ze verandert de stap van de leerkracht niet.', ac: 'Oefenen',
  },
  de: {
    baslik: 'Heute wiederholen', bir: 'Heute zu wiederholen: 1 Inhalt', cok: 'Heute zu wiederholen: {n} Inhalte', yok: 'Heute ist nichts zu wiederholen.',
    hafta1: 'Sie haben diese Woche an 1 Tag geübt.', haftaN: 'Sie haben diese Woche an {k} Tagen geübt.', liste: 'Heute zu wiederholende Inhalte',
    not: 'Diese Liste beruht nur auf Ihrem Üben auf diesem Gerät; sie ändert die von der Lehrkraft vergebene Stufe nicht.', ac: 'Üben',
  },
};

export function tekrarMetinleri(dil: Dil): TekrarMetinleri {
  return TEKRAR[dil];
}
