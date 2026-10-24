/**
 * Çalışma kipleri metinleri (Faz 2c, 24 Ekim 2026): «Bağlayarak ezberle» ve «Kademeli gizle». Metinler düz dizedir ve sayfaya
 * `data-veri` içinde JSON olarak gider (işlev taşınamaz); değişken yerleri `{ad}` biçimindedir, kip betiği doldurur.
 * Fransız tipografisi derlemede middleware'den gelir. Dinî metin değil, arayüz metnidir.
 */
import type { Dil } from '@ortak/i18n/ui';

export interface KipMetinleri {
  baslik: string; sekmeler: string; arBoyutu: string; arKucult: string; arBuyut: string; yuklenemedi: string;
  birimAyet: string; birimBolum: string; birimAyetK: string; birimBolumK: string;
  kisim: string; aralik: string; tek: string; sondan: string; tekParca: string; sesYok: string; gizleGec: string;
  halka: string; evreYeni: string; evreSen: string; evreKontrol: string;
  hazirim: string; kontrolEt: string; dinleYeni: string; dinleHepsi: string; yenidenDinle: string; sesDurdur: string; sesHata: string;
  nasil: string; tam: string; az: string; tekrar: string;
  bitti: string; basaDon: string; sonrakiKisim: string;
  seviye: string; seviyeler: readonly string[]; seviyeDurum: string; ipucu: string; kelimeAc: string; yenidenGizle: string; acik: string;
  dinleyici: string; dinleyiciAciklama: string; takildi: string; sonrakiBirim: string;
  seviyeYukseldi: string; seviyeDustu: string; seviyeAyni: string; seriArtti: string; tamamlandi: string;
}

const METINLER: Record<Dil, KipMetinleri> = {
  tr: {
    baslik: 'Şimdi çalış', sekmeler: 'Çalışma kipi', arBoyutu: 'Arapça yazı boyutu', arKucult: 'Arapça yazıyı küçült', arBuyut: 'Arapça yazıyı büyüt',
    yuklenemedi: 'Çalışma ekranı yüklenemedi. Sayfayı yenileyin.',
    birimAyet: 'Âyet', birimBolum: 'Bölüm', birimAyetK: 'âyet', birimBolumK: 'bölüm',
    kisim: 'Çalışılacak kısım', aralik: '{birim} {a}–{b}', tek: '{birim} {a}', sondan: 'Sondan başla',
    tekParca: 'Bu madde tek parçadır; kurulacak bir zincir yok. Kademeli gizle ile çalışın.',
    sesYok: 'Bu maddede parça parça kayıt yok. Kaydın tamamını yukarıdaki dinleme bölümünden dinleyebilirsiniz.',
    gizleGec: 'Kademeli gizleye geç',
    halka: 'Halka {k} / {n}', evreYeni: 'Yeni parçayı dinleyin, sonra sesli tekrar edin.',
    evreSen: 'Senin sıran: yeni parçaya bakarak okuyun; öncekileri ezberden okuyun.', evreKontrol: 'Şimdi hepsine bakın ve kendinizi yoklayın.',
    hazirim: 'Okumaya hazırım', kontrolEt: 'Kontrol et', dinleYeni: 'Yeni parçayı dinle', dinleHepsi: 'Hepsini dinle', yenidenDinle: 'Yeniden dinle',
    sesDurdur: 'Sesi durdur', sesHata: 'Ses çalınamadı. Bağlantınızı kontrol edin.',
    nasil: 'Nasıl geçti?', tam: 'Tam', az: 'Az takıldım', tekrar: 'Bir daha',
    bitti: 'Zincir tamam. Şimdi Kademeli gizle ile devam edebilirsiniz.', basaDon: 'Baştan başla', sonrakiKisim: 'Sonraki kısım',
    seviye: 'Düzey', seviyeler: ['Tam metin', 'İki kelimeden biri gizli', 'Yalnız ilk harfler', 'Boş; işaretler görünür', 'Tamamen boş'],
    seviyeDurum: 'Düzey {d}: {ad}. Art arda tam: {s} / 2.', ipucu: 'İpucu', kelimeAc: 'Kelimeyi aç', yenidenGizle: 'Yeniden gizle', acik: 'Açık kelime: {a} / {n}',
    dinleyici: 'Dinleyici kipi',
    dinleyiciAciklama: 'Okuyan kişi takılınca «Takıldı»ya basın: önce o parçanın kaydı (varsa) çalar, sonra kelimeler tek tek açılır.',
    takildi: 'Takıldı', sonrakiBirim: 'Sonrakine geç: {birim} {n}',
    seviyeYukseldi: 'Yeni düzey: {d}. {ad}.', seviyeDustu: 'Bir düzey geri: {d}. {ad}.', seviyeAyni: 'Aynı düzeyde devam.',
    seriArtti: 'Güzel: art arda tam {s} / 2.',
    tamamlandi: 'Tamamlandı. Bu madde için kademeli gizleme bitti; hazır olunca hocana oku.',
  },
  fr: {
    baslik: 'Travailler maintenant', sekmeler: 'Mode de travail', arBoyutu: 'Taille de l’écriture arabe', arKucult: 'Réduire l’écriture arabe', arBuyut: 'Agrandir l’écriture arabe',
    yuklenemedi: 'L’écran de travail n’a pas pu se charger. Rechargez la page.',
    birimAyet: 'Verset', birimBolum: 'Partie', birimAyetK: 'verset', birimBolumK: 'partie',
    kisim: 'Passage à travailler', aralik: '{birim} {a}–{b}', tek: '{birim} {a}', sondan: 'Commencer par la fin',
    tekParca: 'Ce contenu est d’un seul tenant : il n’y a pas de chaîne à construire. Travaillez-le avec « Masquer peu à peu ».',
    sesYok: 'Ce contenu n’a pas d’enregistrement par partie. Écoutez l’enregistrement complet dans la section d’écoute ci-dessus.',
    gizleGec: 'Passer à « Masquer peu à peu »',
    halka: 'Maillon {k} / {n}', evreYeni: 'Écoutez le nouveau passage, puis répétez-le à voix haute.',
    evreSen: 'À vous : lisez le nouveau passage en le regardant, et les précédents de mémoire.', evreKontrol: 'Regardez maintenant le tout et vérifiez-vous.',
    hazirim: 'Je suis prêt à réciter', kontrolEt: 'Vérifier', dinleYeni: 'Écouter le nouveau passage', dinleHepsi: 'Tout écouter', yenidenDinle: 'Réécouter',
    sesDurdur: 'Arrêter le son', sesHata: 'Le son ne peut pas être lu. Vérifiez votre connexion.',
    nasil: 'Comment cela s’est-il passé ?', tam: 'Parfait', az: 'Quelques hésitations', tekrar: 'Encore une fois',
    bitti: 'La chaîne est complète. Continuez maintenant avec « Masquer peu à peu ».', basaDon: 'Recommencer', sonrakiKisim: 'Passage suivant',
    seviye: 'Niveau', seviyeler: ['Texte complet', 'Un mot sur deux masqué', 'Premières lettres seulement', 'Vide ; repères visibles', 'Entièrement vide'],
    seviyeDurum: 'Niveau {d} : {ad}. Réussites de suite : {s} / 2.', ipucu: 'Indice', kelimeAc: 'Révéler le mot', yenidenGizle: 'Masquer à nouveau', acik: 'Mots visibles : {a} / {n}',
    dinleyici: 'Mode écoute',
    dinleyiciAciklama: 'Quand la personne qui récite hésite, appuyez sur « Hésitation » : d’abord l’enregistrement du passage (s’il existe), puis les mots s’affichent un à un.',
    takildi: 'Hésitation', sonrakiBirim: 'Passer au suivant : {birim} {n}',
    seviyeYukseldi: 'Nouveau niveau : {d}. {ad}.', seviyeDustu: 'Un niveau en arrière : {d}. {ad}.', seviyeAyni: 'On reste au même niveau.',
    seriArtti: 'Bien : {s} / 2 réussites de suite.',
    tamamlandi: 'Terminé. Le masquage progressif est achevé pour ce contenu ; récitez-le à l’enseignant quand vous êtes prêt.',
  },
  en: {
    baslik: 'Practise now', sekmeler: 'Practice mode', arBoyutu: 'Arabic text size', arKucult: 'Make the Arabic text smaller', arBuyut: 'Make the Arabic text larger',
    yuklenemedi: 'The practice screen could not be loaded. Reload the page.',
    birimAyet: 'Verse', birimBolum: 'Part', birimAyetK: 'verse', birimBolumK: 'part',
    kisim: 'Section to practise', aralik: '{birim} {a}–{b}', tek: '{birim} {a}', sondan: 'Start from the end',
    tekParca: 'This item is a single piece, so there is no chain to build. Practise it with “Fade the text”.',
    sesYok: 'This item has no recording per part. You can listen to the whole recording in the listening section above.',
    gizleGec: 'Go to “Fade the text”',
    halka: 'Link {k} / {n}', evreYeni: 'Listen to the new part, then repeat it aloud.',
    evreSen: 'Your turn: read the new part while looking at it, and the earlier parts from memory.', evreKontrol: 'Now look at everything and check yourself.',
    hazirim: 'I am ready to recite', kontrolEt: 'Check', dinleYeni: 'Listen to the new part', dinleHepsi: 'Listen to all', yenidenDinle: 'Listen again',
    sesDurdur: 'Stop the sound', sesHata: 'The sound could not be played. Check your connection.',
    nasil: 'How did it go?', tam: 'Perfect', az: 'A few slips', tekrar: 'Once more',
    bitti: 'The chain is complete. Now continue with “Fade the text”.', basaDon: 'Start over', sonrakiKisim: 'Next section',
    seviye: 'Level', seviyeler: ['Full text', 'Every second word hidden', 'First letters only', 'Blank; markers visible', 'Completely blank'],
    seviyeDurum: 'Level {d}: {ad}. Perfect in a row: {s} / 2.', ipucu: 'Hint', kelimeAc: 'Reveal the word', yenidenGizle: 'Hide again', acik: 'Visible words: {a} / {n}',
    dinleyici: 'Listener mode',
    dinleyiciAciklama: 'When the reciter gets stuck, press “Stuck”: first the recording of that part plays (if there is one), then the words appear one by one.',
    takildi: 'Stuck', sonrakiBirim: 'Next: {birim} {n}',
    seviyeYukseldi: 'New level: {d}. {ad}.', seviyeDustu: 'One level back: {d}. {ad}.', seviyeAyni: 'Staying at the same level.',
    seriArtti: 'Good: {s} / 2 perfect in a row.',
    tamamlandi: 'Done. Fading is complete for this item; recite it to your teacher when you are ready.',
  },
  nl: {
    baslik: 'Nu oefenen', sekmeler: 'Oefenwijze', arBoyutu: 'Grootte van de Arabische tekst', arKucult: 'Arabische tekst kleiner maken', arBuyut: 'Arabische tekst groter maken',
    yuklenemedi: 'Het oefenscherm kon niet worden geladen. Laad de pagina opnieuw.',
    birimAyet: 'Vers', birimBolum: 'Deel', birimAyetK: 'vers', birimBolumK: 'deel',
    kisim: 'Gedeelte om te oefenen', aralik: '{birim} {a}–{b}', tek: '{birim} {a}', sondan: 'Begin aan het einde',
    tekParca: 'Dit onderdeel bestaat uit één stuk, dus er is geen ketting te bouwen. Oefen het met “Stap voor stap verbergen”.',
    sesYok: 'Van dit onderdeel is geen opname per deel. Luister naar de hele opname in het luistergedeelte hierboven.',
    gizleGec: 'Naar “Stap voor stap verbergen”',
    halka: 'Schakel {k} / {n}', evreYeni: 'Luister naar het nieuwe stuk en herhaal het dan hardop.',
    evreSen: 'Uw beurt: lees het nieuwe stuk met de tekst erbij en de eerdere stukken uit het hoofd.', evreKontrol: 'Kijk nu naar alles en controleer uzelf.',
    hazirim: 'Ik ben klaar om te reciteren', kontrolEt: 'Controleren', dinleYeni: 'Nieuw stuk beluisteren', dinleHepsi: 'Alles beluisteren', yenidenDinle: 'Opnieuw luisteren',
    sesDurdur: 'Geluid stoppen', sesHata: 'Het geluid kon niet worden afgespeeld. Controleer uw verbinding.',
    nasil: 'Hoe ging het?', tam: 'Helemaal goed', az: 'Een paar haperingen', tekrar: 'Nog een keer',
    bitti: 'De ketting is compleet. Ga nu verder met “Stap voor stap verbergen”.', basaDon: 'Opnieuw beginnen', sonrakiKisim: 'Volgend gedeelte',
    seviye: 'Niveau', seviyeler: ['Volledige tekst', 'Om het andere woord verborgen', 'Alleen de eerste letters', 'Leeg; markeringen zichtbaar', 'Helemaal leeg'],
    seviyeDurum: 'Niveau {d}: {ad}. Achter elkaar goed: {s} / 2.', ipucu: 'Hint', kelimeAc: 'Woord tonen', yenidenGizle: 'Opnieuw verbergen', acik: 'Zichtbare woorden: {a} / {n}',
    dinleyici: 'Luisterstand',
    dinleyiciAciklama: 'Hapert de reciterende persoon, druk dan op “Hapert”: eerst klinkt de opname van dat deel (als die er is), daarna verschijnen de woorden een voor een.',
    takildi: 'Hapert', sonrakiBirim: 'Volgende: {birim} {n}',
    seviyeYukseldi: 'Nieuw niveau: {d}. {ad}.', seviyeDustu: 'Een niveau terug: {d}. {ad}.', seviyeAyni: 'Op hetzelfde niveau doorgaan.',
    seriArtti: 'Goed: {s} / 2 keer achter elkaar goed.',
    tamamlandi: 'Klaar. Het verbergen is voor dit onderdeel voltooid; draag het voor aan de leerkracht als u klaar bent.',
  },
  de: {
    baslik: 'Jetzt üben', sekmeler: 'Übungsart', arBoyutu: 'Größe der arabischen Schrift', arKucult: 'Arabische Schrift verkleinern', arBuyut: 'Arabische Schrift vergrößern',
    yuklenemedi: 'Der Übungsbildschirm konnte nicht geladen werden. Laden Sie die Seite neu.',
    birimAyet: 'Vers', birimBolum: 'Teil', birimAyetK: 'Vers', birimBolumK: 'Teil',
    kisim: 'Abschnitt zum Üben', aralik: '{birim} {a}–{b}', tek: '{birim} {a}', sondan: 'Am Ende beginnen',
    tekParca: 'Dieser Inhalt besteht aus einem Stück, es gibt keine Kette zu bilden. Üben Sie ihn mit „Schrittweise ausblenden“.',
    sesYok: 'Für diesen Inhalt gibt es keine Aufnahme pro Teil. Hören Sie die ganze Aufnahme im Hörbereich oben.',
    gizleGec: 'Zu „Schrittweise ausblenden“',
    halka: 'Glied {k} / {n}', evreYeni: 'Hören Sie den neuen Teil und sprechen Sie ihn laut nach.',
    evreSen: 'Sie sind dran: Lesen Sie den neuen Teil mit Blick auf den Text, die früheren Teile auswendig.', evreKontrol: 'Sehen Sie sich jetzt alles an und prüfen Sie sich selbst.',
    hazirim: 'Ich bin bereit zu rezitieren', kontrolEt: 'Prüfen', dinleYeni: 'Neuen Teil anhören', dinleHepsi: 'Alles anhören', yenidenDinle: 'Noch einmal hören',
    sesDurdur: 'Ton anhalten', sesHata: 'Der Ton konnte nicht abgespielt werden. Prüfen Sie Ihre Verbindung.',
    nasil: 'Wie ist es gelaufen?', tam: 'Ganz richtig', az: 'Kleine Hänger', tekrar: 'Noch einmal',
    bitti: 'Die Kette ist vollständig. Machen Sie jetzt mit „Schrittweise ausblenden“ weiter.', basaDon: 'Von vorn beginnen', sonrakiKisim: 'Nächster Abschnitt',
    seviye: 'Stufe', seviyeler: ['Voller Text', 'Jedes zweite Wort ausgeblendet', 'Nur Anfangsbuchstaben', 'Leer; Markierungen sichtbar', 'Ganz leer'],
    seviyeDurum: 'Stufe {d}: {ad}. Hintereinander richtig: {s} / 2.', ipucu: 'Hinweis', kelimeAc: 'Wort aufdecken', yenidenGizle: 'Wieder ausblenden', acik: 'Sichtbare Wörter: {a} / {n}',
    dinleyici: 'Zuhörmodus',
    dinleyiciAciklama: 'Wenn die rezitierende Person stockt, drücken Sie „Hängt“: Zuerst läuft die Aufnahme dieses Teils (falls vorhanden), dann erscheinen die Wörter einzeln.',
    takildi: 'Hängt', sonrakiBirim: 'Weiter: {birim} {n}',
    seviyeYukseldi: 'Neue Stufe: {d}. {ad}.', seviyeDustu: 'Eine Stufe zurück: {d}. {ad}.', seviyeAyni: 'Auf derselben Stufe weitermachen.',
    seriArtti: 'Gut: {s} / 2 hintereinander richtig.',
    tamamlandi: 'Geschafft. Das Ausblenden ist für diesen Inhalt abgeschlossen; sprechen Sie ihn der Lehrkraft vor, wenn Sie bereit sind.',
  },
};

export function kipMetinleri(dil: Dil): KipMetinleri {
  return METINLER[dil];
}
