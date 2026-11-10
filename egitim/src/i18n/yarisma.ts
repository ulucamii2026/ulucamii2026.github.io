/**
 * İlim Yolu «Bilgi Yarışması» arayüz metinleri (10 Kasım 2026): sınıfça tek ekranda oynanan yarışmanın düğmeleri, yönergeleri ve
 * geri bildirimleri. Beş dil `Beşli` demetiyle zorunlu (eksik dil derlemeyi durdurur; docs/DIL-NL-DE.md). Türkçe «siz»; Fransızca «vous»,
 * Hollandaca «u», Almanca «Sie». Dinî cümle YOKTUR: sorular src/data/yarisma/sorular.json'dan olduğu gibi gelir. «Puan» sözü yalnız
 * «ortak puan» (sınıfın tek puanı) anlamındadır; «skor», «sıralama», «yanlış» ve «kaybettiniz» kullanılmaz. `{n}`-türü yer tutucular
 * `doldur` ile; Fransızcada noktalama öncesi boşluk `fransizTipografi` ile düzelir.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

type Beşli<T = string> = readonly [T, T, T, T, T];
const SIRA: readonly Dil[] = ['tr', 'fr', 'en', 'nl', 'de'];

const H = {
  ad: ['Bilgi Yarışması', 'Concours de connaissances', 'Knowledge Quiz', 'Kennisquiz', 'Wissensquiz'],
  hubAciklama: [
    'Sınıfça tek ekranda birlikte oynanan bilgi yarışması: sınav, sıralama, gruplama, eşleştirme ve gizemli kutu. Tek bir ortak puan vardır.',
    'Un concours de connaissances à jouer ensemble en classe sur un seul écran : questions, mise en ordre, classement en groupes, association et boîte mystère. Un seul score commun.',
    'A knowledge quiz the class plays together on one screen: questions, ordering, sorting, matching and a mystery box. There is one shared class score.',
    'Een kennisquiz die de klas samen op één scherm speelt: vragen, ordenen, indelen, koppelen en een mysteriedoos. Er is één gezamenlijke klassenscore.',
    'Ein Wissensquiz, das die Klasse gemeinsam auf einem Bildschirm spielt: Fragen, Ordnen, Sortieren, Zuordnen und eine Geheimbox. Es gibt eine gemeinsame Klassenpunktzahl.',
  ],
  hubLead: [
    'Sınıfça birlikte oynayın: öğretmenin telefonu ya da projeksiyon tek ekrandır, sınıf birlikte karar verir. Sınıfın tek bir ortak puanı vardır; kişisel puan, sıralama ve takma ad yoktur.',
    'Jouez ensemble en classe : le téléphone de l’enseignant ou le projecteur sert d’écran unique et la classe décide en commun. La classe n’a qu’un seul score commun ; il n’y a ni score personnel, ni classement, ni pseudonyme.',
    'Play together as a class: the teacher’s phone or the projector is the single screen, and the class decides together. The class has one shared score; there are no personal scores, rankings or nicknames.',
    'Speel samen als klas: de telefoon van de leerkracht of de projector is het enige scherm en de klas beslist samen. De klas heeft één gezamenlijke score; er zijn geen persoonlijke scores, ranglijsten of bijnamen.',
    'Spielen Sie gemeinsam als Klasse: Das Handy der Lehrkraft oder der Beamer ist der einzige Bildschirm, und die Klasse entscheidet zusammen. Die Klasse hat eine gemeinsame Punktzahl; es gibt keine persönlichen Punkte, Ranglisten oder Spitznamen.',
  ],
  kaydedilmez: [
    'Hiçbir şey kaydedilmez ve hesap gerekmez; sayfayı yenilerseniz oyun baştan başlar.',
    'Rien n’est enregistré et aucun compte n’est nécessaire ; si vous rechargez la page, la partie recommence.',
    'Nothing is saved and no account is needed; if you reload the page, the game starts over.',
    'Er wordt niets opgeslagen en een account is niet nodig; als u de pagina herlaadt, begint het spel opnieuw.',
    'Es wird nichts gespeichert und kein Konto ist nötig; wenn Sie die Seite neu laden, beginnt das Spiel von vorn.',
  ],
  jsGerek: [
    'Yarışma için tarayıcınızda JavaScript açık olmalıdır.',
    'Pour le concours, JavaScript doit être activé dans votre navigateur.',
    'JavaScript must be turned on in your browser for the quiz.',
    'Voor de quiz moet JavaScript in uw browser aanstaan.',
    'Für das Quiz muss JavaScript in Ihrem Browser eingeschaltet sein.',
  ],
  ayarBaslik: ['Oyunu hazırlayın', 'Préparez la partie', 'Set up the game', 'Bereid het spel voor', 'Spiel vorbereiten'],
  bicimEtiket: ['Soru biçimi', 'Type de question', 'Question type', 'Vraagtype', 'Fragetyp'],
  konuEtiket: ['Konular', 'Thèmes', 'Topics', 'Onderwerpen', 'Themen'],
  seviyeEtiket: ['Yaş grubu', 'Groupe d’âge', 'Age group', 'Leeftijdsgroep', 'Altersgruppe'],
  adetEtiket: ['Tur sayısı', 'Nombre de manches', 'Number of rounds', 'Aantal rondes', 'Anzahl der Runden'],
  adetBirim: ['{n} tur', '{n} manches', '{n} rounds', '{n} rondes', '{n} Runden'],
  sayim: ['Bu seçimde {n} soru var.', 'Cette sélection contient {n} questions.', 'This selection has {n} questions.', 'In deze selectie zitten {n} vragen.', 'In dieser Auswahl gibt es {n} Fragen.'],
  sayimAz: [
    'Bu seçimde {n} soru var; oyun en çok {n} tur sürer.',
    'Cette sélection contient {n} questions ; la partie durera au plus {n} manches.',
    'This selection has {n} questions; the game will last at most {n} rounds.',
    'In deze selectie zitten {n} vragen; het spel duurt hoogstens {n} rondes.',
    'In dieser Auswahl gibt es {n} Fragen; das Spiel dauert höchstens {n} Runden.',
  ],
  sayimYok: [
    'Bu seçimde soru yok. Başka bir konu, biçim ya da yaş grubu seçin.',
    'Cette sélection ne contient aucune question. Choisissez un autre thème, type ou groupe d’âge.',
    'There are no questions in this selection. Choose another topic, type or age group.',
    'In deze selectie zitten geen vragen. Kies een ander onderwerp, type of leeftijdsgroep.',
    'In dieser Auswahl gibt es keine Fragen. Wählen Sie ein anderes Thema, einen anderen Typ oder eine andere Altersgruppe.',
  ],
  basla: ['Başlatın', 'Commencer', 'Start', 'Starten', 'Starten'],
  kisayolBaslik: ['Klavye kısayolları', 'Raccourcis clavier', 'Keyboard shortcuts', 'Sneltoetsen', 'Tastenkürzel'],
  kisayollar: [
    ['1–4 ya da A–D: seçenek seçer', 'Enter ya da Boşluk: Kontrol, ipucu ya da sonraki tur', '→ ya da N: sonraki tur', '←: bir tur geri (o turun puanı geri alınır)', 'F: tam ekran', 'Gruplamada 1 ve 2: kutu seçer'],
    ['1–4 ou A–D : choisit une réponse', 'Entrée ou Espace : vérifier, indice ou manche suivante', '→ ou N : manche suivante', '← : une manche en arrière (son score est retiré)', 'F : plein écran', 'Dans le classement en groupes, 1 et 2 : choisit la boîte'],
    ['1–4 or A–D: choose an answer', 'Enter or Space: check, clue or next round', '→ or N: next round', '←: one round back (its score is taken back)', 'F: full screen', 'When sorting into groups, 1 and 2: choose the box'],
    ['1–4 of A–D: kies een antwoord', 'Enter of spatie: controleren, hint of volgende ronde', '→ of N: volgende ronde', '←: één ronde terug (de score van die ronde vervalt)', 'F: volledig scherm', 'Bij indelen in groepen, 1 en 2: kies de doos'],
    ['1–4 oder A–D: wählt eine Antwort', 'Enter oder Leertaste: prüfen, Hinweis oder nächste Runde', '→ oder N: nächste Runde', '←: eine Runde zurück (deren Punkte werden zurückgenommen)', 'F: Vollbild', 'Beim Sortieren in Gruppen, 1 und 2: wählt die Box'],
  ] as Beşli<readonly string[]>,
  // Oyun
  sinifimiz: ['Sınıfımız', 'Notre classe', 'Our class', 'Onze klas', 'Unsere Klasse'],
  ortakPuan: ['Ortak puan', 'Score commun', 'Shared score', 'Gezamenlijke score', 'Gemeinsame Punkte'],
  turSayaci: ['Tur {n} / {m}', 'Manche {n} / {m}', 'Round {n} / {m}', 'Ronde {n} / {m}', 'Runde {n} / {m}'],
  bosHavuz: ['Bu ayarlarda soru yok.', 'Aucune question avec ces réglages.', 'There are no questions with these settings.', 'Geen vragen met deze instellingen.', 'Mit diesen Einstellungen gibt es keine Fragen.'],
  ayarlaraDon: ['Ayarlara dönün', 'Retour aux réglages', 'Back to settings', 'Terug naar de instellingen', 'Zurück zu den Einstellungen'],
  kontrol: ['Kontrol', 'Vérifier', 'Check', 'Controleren', 'Prüfen'],
  sonraki: ['Sonraki tur', 'Manche suivante', 'Next round', 'Volgende ronde', 'Nächste Runde'],
  turGeri: ['Bir tur geri', 'Une manche en arrière', 'One round back', 'Eén ronde terug', 'Eine Runde zurück'],
  geriYapildi: ['Bir tur geri alındı; ortak puan düzeltildi.', 'Manche annulée ; le score commun est corrigé.', 'Round undone; the shared score is corrected.', 'Ronde ongedaan gemaakt; de gezamenlijke score is aangepast.', 'Runde zurückgenommen; die gemeinsame Punktzahl wurde korrigiert.'],
  sonucuGor: ['Sonucu görün', 'Voir le résultat', 'See the result', 'Bekijk het resultaat', 'Ergebnis ansehen'],
  sonrakiIpucu: ['Sonraki ipucu', 'Indice suivant', 'Next clue', 'Volgende hint', 'Nächster Hinweis'],
  tamEkran: ['Tam ekran', 'Plein écran', 'Full screen', 'Volledig scherm', 'Vollbild'],
  tamEkranKapat: ['Tam ekrandan çıkın', 'Quitter le plein écran', 'Exit full screen', 'Volledig scherm verlaten', 'Vollbild beenden'],
  dogru: ['Doğru', 'Juste', 'Correct', 'Juist', 'Richtig'],
  tekrar: ['Tekrar deneyin', 'Essayez encore', 'Try again', 'Probeer opnieuw', 'Versuchen Sie es noch einmal'],
  birlikteOgrendik: ['Birlikte öğrendik', 'Nous avons appris ensemble', 'We learned together', 'Samen geleerd', 'Gemeinsam gelernt'],
  dogruGosterildi: ['Doğru cevap gösterildi.', 'La bonne réponse est affichée.', 'The right answer is shown.', 'Het juiste antwoord wordt getoond.', 'Die richtige Antwort wird angezeigt.'],
  puanArtti: ['Bu turda ortak puana +{n}.', 'Cette manche rapporte +{n} au score commun.', 'This round adds +{n} to the shared score.', 'Deze ronde voegt +{n} toe aan de gezamenlijke score.', 'Diese Runde bringt +{n} zur gemeinsamen Punktzahl.'],
  puanYok: ['Bu turda ortak puan yok; ama birlikte öğrendik.', 'Pas de points cette manche, mais nous avons appris ensemble.', 'No points this round, but we learned together.', 'Geen punten deze ronde, maar we hebben samen geleerd.', 'Keine Punkte in dieser Runde, aber wir haben gemeinsam gelernt.'],
  secenek: ['Seçenek {h}: {m}', 'Réponse {h} : {m}', 'Option {h}: {m}', 'Antwoord {h}: {m}', 'Antwort {h}: {m}'],
  elendi: ['elendi', 'écartée', 'ruled out', 'afgevallen', 'ausgeschieden'],
  dogruCevapEtiket: ['Doğru cevap', 'Bonne réponse', 'Right answer', 'Juist antwoord', 'Richtige Antwort'],
  yonQuiz: [
    'Sınıfça karar verin: bir seçeneği seçin, sonra «Kontrol»e basın.',
    'Décidez en classe : choisissez une réponse, puis appuyez sur « Vérifier ».',
    'Decide together: choose an answer, then press “Check”.',
    'Beslis samen: kies een antwoord en druk dan op “Controleren”.',
    'Entscheiden Sie gemeinsam: Wählen Sie eine Antwort und drücken Sie dann „Prüfen“.',
  ],
  yonSiralama: [
    'Parçaları doğru sıraya dizin. Her satırdaki yukarı ve aşağı düğmelerini ya da ↑ ↓ tuşlarını kullanın, sonra «Kontrol»e basın.',
    'Mettez les éléments dans le bon ordre. Utilisez les boutons haut et bas de chaque ligne ou les touches ↑ ↓, puis appuyez sur « Vérifier ».',
    'Put the parts in the right order. Use the up and down buttons on each row or the ↑ ↓ keys, then press “Check”.',
    'Zet de onderdelen in de juiste volgorde. Gebruik de knoppen omhoog en omlaag bij elke rij of de toetsen ↑ ↓ en druk dan op “Controleren”.',
    'Bringen Sie die Teile in die richtige Reihenfolge. Nutzen Sie die Pfeiltasten nach oben und unten in jeder Zeile oder die Tasten ↑ ↓ und drücken Sie dann „Prüfen“.',
  ],
  yonGruplama: [
    'Bir kartı seçin, sonra gideceği kutuyu seçin (ya da 1 ve 2 tuşlarına basın). Hepsi yerleşince «Kontrol»e basın.',
    'Choisissez une carte, puis la boîte où elle va (ou appuyez sur 1 et 2). Quand tout est placé, appuyez sur « Vérifier ».',
    'Choose a card, then the box it belongs in (or press 1 and 2). When all are placed, press “Check”.',
    'Kies een kaart en dan de doos waar ze in hoort (of druk op 1 en 2). Zijn alle kaarten geplaatst, druk dan op “Controleren”.',
    'Wählen Sie eine Karte und dann die Box, in die sie gehört (oder drücken Sie 1 und 2). Sind alle platziert, drücken Sie „Prüfen“.',
  ],
  yonEslestirme: [
    'Soldan bir parça seçin, sonra sağdan eşini seçin. Hepsi eşleşince «Kontrol»e basın.',
    'Choisissez un élément à gauche, puis son pendant à droite. Quand tout est associé, appuyez sur « Vérifier ».',
    'Choose a part on the left, then its match on the right. When all are matched, press “Check”.',
    'Kies links een onderdeel en rechts het bijpassende. Is alles gekoppeld, druk dan op “Controleren”.',
    'Wählen Sie links ein Teil und rechts das passende. Sind alle zugeordnet, drücken Sie „Prüfen“.',
  ],
  yonGizemli: [
    'İpuçlarından kutudaki konuyu bulun. Ne kadar az ipucuyla bulursanız ortak puan o kadar yüksek olur. Bir seçeneği seçip «Kontrol»e basın.',
    'Trouvez le thème de la boîte grâce aux indices. Moins il en faut, plus le score commun est élevé. Choisissez une réponse et appuyez sur « Vérifier ».',
    'Find the topic in the box from the clues. The fewer clues you need, the higher the shared score. Choose an answer and press “Check”.',
    'Vind aan de hand van de hints het onderwerp in de doos. Hoe minder hints u nodig hebt, hoe hoger de gezamenlijke score. Kies een antwoord en druk op “Controleren”.',
    'Finden Sie anhand der Hinweise das Thema in der Box. Je weniger Hinweise Sie brauchen, desto höher die gemeinsame Punktzahl. Wählen Sie eine Antwort und drücken Sie „Prüfen“.',
  ],
  yukari: ['Yukarı taşıyın', 'Monter', 'Move up', 'Omhoog', 'Nach oben'],
  asagi: ['Aşağı taşıyın', 'Descendre', 'Move down', 'Omlaag', 'Nach unten'],
  konum: ['{ad}, {n}. sırada', '{ad}, en position {n}', '{ad}, position {n}', '{ad}, op plaats {n}', '{ad}, an Position {n}'],
  yerinde: ['Yerinde', 'À sa place', 'In place', 'Op zijn plaats', 'Am richtigen Platz'],
  havuz: ['Kartlar', 'Cartes', 'Cards', 'Kaarten', 'Karten'],
  kutuAd: ['{n}. kutu: {ad}', 'Boîte {n} : {ad}', 'Box {n}: {ad}', 'Doos {n}: {ad}', 'Box {n}: {ad}'],
  kartSecili: ['seçili', 'sélectionnée', 'selected', 'geselecteerd', 'ausgewählt'],
  kutuyaKoydu: ['{m}, {n}. kutuya konuldu', '{m} : placée dans la boîte {n}', '{m} placed in box {n}', '{m} in doos {n} gelegd', '{m} in Box {n} gelegt'],
  geriAl: ['Kartlara geri alın: {m}', 'Remettre parmi les cartes : {m}', 'Return to the cards: {m}', 'Terug naar de kaarten: {m}', 'Zurück zu den Karten: {m}'],
  solSutun: ['Sol', 'Gauche', 'Left', 'Links', 'Links'],
  sagSutun: ['Sağ', 'Droite', 'Right', 'Rechts', 'Rechts'],
  eslesti: ['{n}. çift', 'Paire {n}', 'Pair {n}', 'Paar {n}', 'Paar {n}'],
  kutuAlt: ['Kapalı gizemli kutu', 'Boîte mystère fermée', 'Closed mystery box', 'Gesloten mysteriedoos', 'Geschlossene Geheimbox'],
  ipucuNo: ['İpucu {n}', 'Indice {n}', 'Clue {n}', 'Hint {n}', 'Hinweis {n}'],
  ipucuSayi: ['{n} ipucu açık', '{n} indice(s) ouvert(s)', '{n} clue(s) open', '{n} hint(s) open', '{n} Hinweis(e) offen'],
  yeniIpucu: ['Yeni bir ipucu açıldı.', 'Un nouvel indice est ouvert.', 'A new clue has opened.', 'Er is een nieuwe hint geopend.', 'Ein neuer Hinweis wurde geöffnet.'],
  turBasladi: ['{tur}: {bicim}.', '{tur} : {bicim}.', '{tur}: {bicim}.', '{tur}: {bicim}.', '{tur}: {bicim}.'],
  turKaro: ['{n}. tur: {p} puan', 'Manche {n} : {p} point(s)', 'Round {n}: {p} point(s)', 'Ronde {n}: {p} punt(en)', 'Runde {n}: {p} Punkt(e)'],
  sonBaslik: ['Tamamladınız!', 'Terminé !', 'All done!', 'Klaar!', 'Geschafft!'],
  sonPuan: ['Sınıfımızın ortak puanı', 'Le score commun de notre classe', 'Our class’s shared score', 'De gezamenlijke score van onze klas', 'Die gemeinsame Punktzahl unserer Klasse'],
  bantIlk: [
    'Birlikte çok şey öğrendik. Bir dahaki sefere daha da güzel olacak!',
    'Nous avons beaucoup appris ensemble. La prochaine fois sera encore mieux !',
    'We learned a lot together. Next time will be even better!',
    'We hebben samen veel geleerd. De volgende keer wordt het nog mooier!',
    'Wir haben gemeinsam viel gelernt. Beim nächsten Mal wird es noch schöner!',
  ],
  bantOrta: [
    'Güzel bir iş birliği oldu. Sınıfça çok şey biliyorsunuz!',
    'Belle collaboration ! Ensemble, vous savez beaucoup de choses !',
    'Lovely teamwork. Together you know a lot!',
    'Mooie samenwerking. Samen weet u veel!',
    'Schöne Zusammenarbeit. Gemeinsam wissen Sie viel!',
  ],
  bantYuksek: [
    'Harika bir ekip çalışması! Sınıfça çok iyi biliyorsunuz.',
    'Magnifique travail d’équipe ! Vous savez très bien, ensemble.',
    'Wonderful teamwork! You know this very well together.',
    'Prachtig teamwork! Samen weet u dit heel goed.',
    'Tolle Teamarbeit! Gemeinsam wissen Sie das sehr gut.',
  ],
  ayniOyun: ['Aynı oyunu yeniden oynayın', 'Rejouer la même partie', 'Play the same game again', 'Hetzelfde spel opnieuw spelen', 'Dasselbe Spiel noch einmal spielen'],
  yeniOyun: ['Yeni bir oyun başlatın', 'Commencer une nouvelle partie', 'Start a new game', 'Een nieuw spel starten', 'Ein neues Spiel starten'],
  geri: ['Bilgi Yarışması', 'Concours de connaissances', 'Knowledge Quiz', 'Kennisquiz', 'Wissensquiz'],
  anaKartGit: ['Yarışmaya girin', 'Accéder au concours', 'Go to the quiz', 'Naar de quiz', 'Zum Quiz'],
  hocaNotu: [
    'Sınıfta kullanmadan önce soruları bir gözden geçirmeniz iyi olur. Bir sorun görürseniz imamımıza söyleyin.',
    'Avant de l’utiliser en classe, relisez les questions. Si vous voyez un problème, dites-le à notre imam.',
    'Before using it in class, it is a good idea to look the questions over. If you see a problem, tell our imam.',
    'Bekijk de vragen vóór gebruik in de klas even. Ziet u een probleem, laat het dan aan onze imam weten.',
    'Bevor Sie es im Unterricht einsetzen, sehen Sie die Fragen am besten durch. Wenn Ihnen etwas auffällt, sagen Sie es unserem Imam.',
  ],
} satisfies Record<string, Beşli | Beşli<readonly string[]>>;

const BICIM = {
  karisik: ['Karışık', 'Mixte', 'Mixed', 'Gemengd', 'Gemischt'],
  quiz: ['Sınav', 'Questions à choix', 'Multiple choice', 'Meerkeuze', 'Multiple Choice'],
  siralama: ['Sıralama', 'Mise en ordre', 'Ordering', 'Ordenen', 'Ordnen'],
  gruplama: ['Gruplama', 'Classement en groupes', 'Sorting into groups', 'Indelen in groepen', 'In Gruppen sortieren'],
  eslestirme: ['Eşleştirme', 'Association', 'Matching', 'Koppelen', 'Zuordnen'],
  gizemli: ['Gizemli kutu', 'Boîte mystère', 'Mystery box', 'Mysteriedoos', 'Geheimbox'],
} satisfies Record<string, Beşli>;

const KONU = {
  itikat: ['İman (itikat)', 'Foi (‘aqîda)', 'Faith (creed)', 'Geloof (aqida)', 'Glaube (Aqida)'],
  ibadet: ['İbadet', 'Adoration', 'Worship', 'Aanbidding', 'Gottesdienst'],
  siyer: ['Siyer', 'Biographie du Prophète', 'The Prophet’s life', 'Het leven van de Profeet', 'Das Leben des Propheten'],
  ahlak: ['Ahlak', 'Éthique', 'Ethics', 'Ethiek', 'Ethik'],
  kuran: ['Kur’an bilgisi', 'Connaissance du Coran', 'Knowledge of the Quran', 'Kennis van de Koran', 'Koranwissen'],
} satisfies Record<string, Beşli>;

const SEVIYE = {
  '1': ['Küçükler', 'Les plus jeunes', 'Younger', 'Jongsten', 'Jüngere'],
  '1-2': ['Orta yaş', 'Âge moyen', 'Middle', 'Middelste groep', 'Mittlere Gruppe'],
  '2-3': ['Büyükler', 'Les plus âgés', 'Older', 'Oudsten', 'Ältere'],
} satisfies Record<string, Beşli>;

type Anahtarlar<T> = { [K in keyof T]: T[K] extends Beşli<infer U> ? U : never };
type Cozulmus = Anahtarlar<typeof H> & {
  bicim: Record<keyof typeof BICIM, string>;
  konu: Record<keyof typeof KONU, string>;
  seviye: Record<keyof typeof SEVIYE, string>;
};

const fr = (s: string, dil: Dil): string => (dil === 'fr' ? fransizTipografi(s) : s);
const cozMetin = (b: Beşli, dil: Dil): string => fr(b[SIRA.indexOf(dil)], dil);
const cozMap = <K extends string>(m: Record<K, Beşli>, dil: Dil): Record<K, string> =>
  Object.fromEntries(Object.entries<Beşli>(m).map(([k, b]) => [k, cozMetin(b, dil)])) as Record<K, string>;

export type YarismaMetinleri = Cozulmus;

const onbellek = new Map<Dil, Cozulmus>();
export function yarismaMetinleri(dil: Dil): YarismaMetinleri {
  const var_ = onbellek.get(dil);
  if (var_) return var_;
  const duz = Object.fromEntries(
    Object.entries(H).map(([k, v]) => {
      const b = v as Beşli<string | readonly string[]>;
      const secilen = b[SIRA.indexOf(dil)];
      return [k, typeof secilen === 'string' ? fr(secilen, dil) : (secilen as readonly string[]).map((s) => fr(s, dil))];
    }),
  );
  const r = { ...duz, bicim: cozMap(BICIM, dil), konu: cozMap(KONU, dil), seviye: cozMap(SEVIYE, dil) } as unknown as Cozulmus;
  onbellek.set(dil, r);
  return r;
}

/** Test için: her anahtarın beş dilde dolu olduğu ham tablolar. */
export const YARISMA_HAM = { H, BICIM, KONU, SEVIYE } as const;

export const doldur = (s: string, d: Readonly<Record<string, string | number>>): string => s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));
