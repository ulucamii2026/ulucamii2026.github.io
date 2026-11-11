/**
 * İlim Yolu «Yeni Müslüman yolu» metinleri (11 Kasım 2026): yalnız arayüz. Haftaların, adımların, soruların ve kaynakların metni
 * paylasilan/ogrenme-yolu/icerik.json'dan olduğu gibi gelir (tek kaynak; burada kopyası yoktur). Beş dil `Record<Dil, …>` ile zorunlu
 * (docs/DIL-NL-DE.md). Türkçe «siz»; Fransızca «vous», Hollandaca «u», Almanca «Sie». Dinî hüküm cümlesi yoktur. Fransızca metin kaynakta
 * düz boşlukla yazılır; `yeniYolMetinleri('fr')` ince/bölünmez boşluk koyar. Yer tutucular `doldur` ile doldurulur.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface YeniYolMetinleri {
  /** Yol adı (dizin kartı ve başlık). */
  ad: string;
  aciklama: string;
  ustEtiket: string;
  /** Yol kartı: «12 hafta · 8 adım». */
  kartOzet: string;
  haftalarBaslik: string;
  adimlarBaslik: string;
  adimlarGiris: string;
  haftaEtiketi: string;
  adimEtiketi: string;
  /** «{n} / {m} hafta tamamlandı» */
  ilerleme: string;
  /** Cihaz + hesap saklama notu: tam olarak neyin nerede tutulduğunu söyler. */
  saklamaNotu: string;
  basla: string;
  devam: string;
  tamamlandi: string;
  baslanmadi: string;
  /** «{n} / 2 soru doğru» */
  soruSayim: string;
  hedef: string;
  yap: string;
  yapildi: string;
  yapildiDugme: string;
  sorular: string;
  sorularGiris: string;
  dogru: string;
  yanlis: string;
  dogruBulundu: string;
  denetle: string;
  secimYok: string;
  kaynaklar: string;
  kaynakNotu: string;
  videoBaslik: string;
  videoYukle: string;
  videoNot: string;
  videoBaglanti: string;
  haftayiTamamla: string;
  haftaTamamlandi: string;
  haftaIpucu: string;
  platformdaCalisin: string;
  onceki: string;
  sonraki: string;
  tumHaftalar: string;
  yollarBaglantisi: string;
  adimdakiHaftalar: string;
  adimaBagli: string;
  bitisBaslik: string;
  bitisMetin: string;
  jsGerek: string;
  /** Dizin kartındaki düğme. */
  yolaBak: string;
}

const TR: YeniYolMetinleri = {
  ad: 'Yeni Müslüman yolu',
  aciklama: 'Yeni Müslümanlar için 12 haftalık, 8 adımlı sade yol: kısa metinler, küçük uygulamalar, sorular ve Diyanet kaynakları.',
  ustEtiket: '12 hafta · 8 adım',
  kartOzet: '12 hafta · 8 adım · her haftada iki soru',
  haftalarBaslik: 'On iki hafta',
  adimlarBaslik: 'Sekiz adım',
  adimlarGiris: 'Her hafta bir adıma bağlıdır. Bir adımı seçerek o adımın haftalarını görebilirsiniz.',
  haftaEtiketi: 'Hafta',
  adimEtiketi: 'Adım',
  ilerleme: '{n} / {m} hafta tamamlandı',
  saklamaNotu: 'İşaretleriniz bu cihazda, tarayıcınızda durur. Giriş yaptıysanız yalnız sizin görebildiğiniz özel bir kayda da eşitlenir; hocalar, haftalık e-posta ve raporlar bu kaydı görmez. Yalnız hafta ve soru işaretleri tutulur; cevaplarınızın metni tutulmaz.',
  basla: 'Yola başlayın',
  devam: 'Haftaya git',
  tamamlandi: 'Tamamlandı',
  baslanmadi: 'Henüz başlanmadı',
  soruSayim: '{n} / 2 soru doğru',
  hedef: 'Hedef',
  yap: 'Bu haftanın uygulaması',
  yapildi: 'Uygulama yapıldı',
  yapildiDugme: 'Uygulamayı yaptım',
  sorular: 'Kendinizi deneyin',
  sorularGiris: 'İstediğiniz kadar deneyebilirsiniz. Doğru cevabı bulduğunuzda işaret kaydedilir.',
  dogru: 'Doğru.',
  yanlis: 'Doğru değil; bir daha deneyin.',
  dogruBulundu: 'Bu soru tamam.',
  denetle: 'Cevabı denetle',
  secimYok: 'Önce bir seçenek seçin.',
  kaynaklar: 'Kaynaklar',
  kaynakNotu: 'Bağlantılar dış sitelere gider ve yeni sekmede açılır.',
  videoBaslik: 'Diyanet videosu',
  videoYukle: 'Videoyu oynat',
  videoNot: 'Oynat düğmesine basana kadar YouTube’dan hiçbir şey yüklenmez.',
  videoBaglanti: 'YouTube’da aç',
  haftayiTamamla: 'Haftayı tamamladım',
  haftaTamamlandi: 'Hafta tamamlandı',
  haftaIpucu: 'İsterseniz önce soruları ve uygulamayı deneyin; sıra size aittir.',
  platformdaCalisin: 'Bu konuyu platformda da çalışın',
  onceki: 'Önceki hafta',
  sonraki: 'Sonraki hafta',
  tumHaftalar: 'Tüm haftalar',
  yollarBaglantisi: 'Tüm yollar',
  adimdakiHaftalar: 'Bu adımdaki haftalar',
  adimaBagli: 'Bağlı olduğu adım',
  bitisBaslik: 'On iki hafta tamam',
  bitisMetin: 'Öğrendiklerinizi toparladınız. Sıradaki küçük hedefi seçerken yakınınızdaki bir din görevlisiyle konuşabilirsiniz.',
  jsGerek: 'İşaretlemek ve ilerlemenizi görmek için JavaScript gerekir; metinler onsuz da okunur.',
  yolaBak: 'Yola bakın',
};

const FR: YeniYolMetinleri = {
  ad: 'Chemin des nouveaux musulmans',
  aciklama: 'Un chemin simple en 12 semaines et 8 étapes pour les nouveaux musulmans : textes courts, petits exercices, questions et sources de la Diyanet.',
  ustEtiket: '12 semaines · 8 étapes',
  kartOzet: '12 semaines · 8 étapes · deux questions par semaine',
  haftalarBaslik: 'Douze semaines',
  adimlarBaslik: 'Huit étapes',
  adimlarGiris: 'Chaque semaine appartient à une étape. Choisissez une étape pour voir ses semaines.',
  haftaEtiketi: 'Semaine',
  adimEtiketi: 'Étape',
  ilerleme: '{n} / {m} semaines terminées',
  saklamaNotu: 'Vos repères restent sur cet appareil, dans votre navigateur. Si vous êtes connecté(e), ils sont aussi synchronisés dans un enregistrement privé que vous seul(e) pouvez voir ; les enseignants, l’e-mail hebdomadaire et les rapports n’y ont pas accès. Seuls les repères de semaine et de question sont conservés, pas le texte de vos réponses.',
  basla: 'Commencer le chemin',
  devam: 'Aller à la semaine',
  tamamlandi: 'Terminé',
  baslanmadi: 'Pas encore commencé',
  soruSayim: '{n} / 2 questions réussies',
  hedef: 'Objectif',
  yap: 'L’exercice de la semaine',
  yapildi: 'Exercice fait',
  yapildiDugme: 'J’ai fait l’exercice',
  sorular: 'Testez-vous',
  sorularGiris: 'Vous pouvez réessayer autant de fois que vous voulez. Le repère est enregistré dès que vous trouvez la bonne réponse.',
  dogru: 'Correct.',
  yanlis: 'Incorrect ; essayez encore.',
  dogruBulundu: 'Question réussie.',
  denetle: 'Vérifier la réponse',
  secimYok: 'Choisissez d’abord une réponse.',
  kaynaklar: 'Sources',
  kaynakNotu: 'Les liens mènent à des sites externes et s’ouvrent dans un nouvel onglet.',
  videoBaslik: 'Vidéo de la Diyanet',
  videoYukle: 'Lire la vidéo',
  videoNot: 'Rien n’est chargé depuis YouTube tant que vous n’avez pas appuyé sur le bouton de lecture.',
  videoBaglanti: 'Ouvrir sur YouTube',
  haftayiTamamla: 'J’ai terminé la semaine',
  haftaTamamlandi: 'Semaine terminée',
  haftaIpucu: 'Si vous voulez, essayez d’abord les questions et l’exercice ; vous avancez à votre rythme.',
  platformdaCalisin: 'Étudiez aussi ce sujet sur la plateforme',
  onceki: 'Semaine précédente',
  sonraki: 'Semaine suivante',
  tumHaftalar: 'Toutes les semaines',
  yollarBaglantisi: 'Tous les chemins',
  adimdakiHaftalar: 'Les semaines de cette étape',
  adimaBagli: 'Étape correspondante',
  bitisBaslik: 'Les douze semaines sont terminées',
  bitisMetin: 'Vous avez fait le tour de ce que vous avez appris. Pour choisir le prochain petit objectif, vous pouvez en parler avec un agent du culte près de chez vous.',
  jsGerek: 'JavaScript est nécessaire pour cocher et voir votre progression ; les textes se lisent sans lui.',
  yolaBak: 'Voir le chemin',
};

const EN: YeniYolMetinleri = {
  ad: 'New Muslim path',
  aciklama: 'A simple 12-week, 8-step path for new Muslims: short texts, small exercises, questions and Diyanet sources.',
  ustEtiket: '12 weeks · 8 steps',
  kartOzet: '12 weeks · 8 steps · two questions each week',
  haftalarBaslik: 'Twelve weeks',
  adimlarBaslik: 'Eight steps',
  adimlarGiris: 'Each week belongs to one step. Choose a step to see its weeks.',
  haftaEtiketi: 'Week',
  adimEtiketi: 'Step',
  ilerleme: '{n} / {m} weeks completed',
  saklamaNotu: 'Your marks stay on this device, in your browser. If you are signed in, they are also synced to a private record that only you can see; teachers, the weekly e-mail and reports cannot see it. Only week and question marks are kept, not the text of your answers.',
  basla: 'Start the path',
  devam: 'Go to the week',
  tamamlandi: 'Completed',
  baslanmadi: 'Not started yet',
  soruSayim: '{n} / 2 questions correct',
  hedef: 'Goal',
  yap: 'This week’s exercise',
  yapildi: 'Exercise done',
  yapildiDugme: 'I did the exercise',
  sorular: 'Test yourself',
  sorularGiris: 'You can try as often as you like. The mark is saved once you find the right answer.',
  dogru: 'Correct.',
  yanlis: 'Not correct; try again.',
  dogruBulundu: 'Question done.',
  denetle: 'Check answer',
  secimYok: 'Choose an option first.',
  kaynaklar: 'Sources',
  kaynakNotu: 'Links go to external sites and open in a new tab.',
  videoBaslik: 'Diyanet video',
  videoYukle: 'Play video',
  videoNot: 'Nothing is loaded from YouTube until you press play.',
  videoBaglanti: 'Open on YouTube',
  haftayiTamamla: 'I completed the week',
  haftaTamamlandi: 'Week completed',
  haftaIpucu: 'If you like, try the questions and the exercise first; the pace is yours.',
  platformdaCalisin: 'Also study this topic on the platform',
  onceki: 'Previous week',
  sonraki: 'Next week',
  tumHaftalar: 'All weeks',
  yollarBaglantisi: 'All paths',
  adimdakiHaftalar: 'Weeks in this step',
  adimaBagli: 'Related step',
  bitisBaslik: 'Twelve weeks done',
  bitisMetin: 'You have gathered what you learned. When choosing the next small goal, you can talk with an imam near you.',
  jsGerek: 'JavaScript is needed to tick items and see your progress; the texts can be read without it.',
  yolaBak: 'See the path',
};

const NL: YeniYolMetinleri = {
  ad: 'Weg voor nieuwe moslims',
  aciklama: 'Een eenvoudige weg van 12 weken en 8 stappen voor nieuwe moslims: korte teksten, kleine oefeningen, vragen en bronnen van de Diyanet.',
  ustEtiket: '12 weken · 8 stappen',
  kartOzet: '12 weken · 8 stappen · elke week twee vragen',
  haftalarBaslik: 'Twaalf weken',
  adimlarBaslik: 'Acht stappen',
  adimlarGiris: 'Elke week hoort bij een stap. Kies een stap om de bijbehorende weken te zien.',
  haftaEtiketi: 'Week',
  adimEtiketi: 'Stap',
  ilerleme: '{n} / {m} weken afgerond',
  saklamaNotu: 'Uw markeringen blijven op dit toestel, in uw browser. Bent u ingelogd, dan worden ze ook gesynchroniseerd met een privégegeven dat alleen u kunt zien; docenten, de wekelijkse e-mail en rapporten zien het niet. Alleen week- en vraagmarkeringen worden bewaard, niet de tekst van uw antwoorden.',
  basla: 'Begin de weg',
  devam: 'Naar de week',
  tamamlandi: 'Afgerond',
  baslanmadi: 'Nog niet begonnen',
  soruSayim: '{n} / 2 vragen goed',
  hedef: 'Doel',
  yap: 'De oefening van deze week',
  yapildi: 'Oefening gedaan',
  yapildiDugme: 'Ik heb de oefening gedaan',
  sorular: 'Test uzelf',
  sorularGiris: 'U kunt zo vaak proberen als u wilt. De markering wordt bewaard zodra u het juiste antwoord vindt.',
  dogru: 'Juist.',
  yanlis: 'Niet juist; probeer het nog eens.',
  dogruBulundu: 'Vraag klaar.',
  denetle: 'Antwoord controleren',
  secimYok: 'Kies eerst een antwoord.',
  kaynaklar: 'Bronnen',
  kaynakNotu: 'De links leiden naar externe sites en openen in een nieuw tabblad.',
  videoBaslik: 'Diyanet-video',
  videoYukle: 'Video afspelen',
  videoNot: 'Er wordt niets van YouTube geladen zolang u niet op afspelen drukt.',
  videoBaglanti: 'Openen op YouTube',
  haftayiTamamla: 'Ik heb de week afgerond',
  haftaTamamlandi: 'Week afgerond',
  haftaIpucu: 'Als u wilt, probeer eerst de vragen en de oefening; het tempo is aan u.',
  platformdaCalisin: 'Bestudeer dit onderwerp ook op het platform',
  onceki: 'Vorige week',
  sonraki: 'Volgende week',
  tumHaftalar: 'Alle weken',
  yollarBaglantisi: 'Alle wegen',
  adimdakiHaftalar: 'De weken van deze stap',
  adimaBagli: 'Bijbehorende stap',
  bitisBaslik: 'Twaalf weken klaar',
  bitisMetin: 'U hebt samengevat wat u geleerd hebt. Voor het volgende kleine doel kunt u met een imam bij u in de buurt praten.',
  jsGerek: 'JavaScript is nodig om af te vinken en uw voortgang te zien; de teksten zijn ook zonder te lezen.',
  yolaBak: 'Bekijk de weg',
};

const DE: YeniYolMetinleri = {
  ad: 'Weg für neue Muslime',
  aciklama: 'Ein einfacher Weg in 12 Wochen und 8 Schritten für neue Muslime: kurze Texte, kleine Übungen, Fragen und Quellen der Diyanet.',
  ustEtiket: '12 Wochen · 8 Schritte',
  kartOzet: '12 Wochen · 8 Schritte · jede Woche zwei Fragen',
  haftalarBaslik: 'Zwölf Wochen',
  adimlarBaslik: 'Acht Schritte',
  adimlarGiris: 'Jede Woche gehört zu einem Schritt. Wählen Sie einen Schritt, um seine Wochen zu sehen.',
  haftaEtiketi: 'Woche',
  adimEtiketi: 'Schritt',
  ilerleme: '{n} / {m} Wochen abgeschlossen',
  saklamaNotu: 'Ihre Markierungen bleiben auf diesem Gerät in Ihrem Browser. Wenn Sie angemeldet sind, werden sie zusätzlich mit einem privaten Eintrag abgeglichen, den nur Sie sehen können; Lehrkräfte, die wöchentliche E-Mail und Berichte sehen ihn nicht. Gespeichert werden nur Wochen- und Fragenmarkierungen, nicht der Text Ihrer Antworten.',
  basla: 'Den Weg beginnen',
  devam: 'Zur Woche',
  tamamlandi: 'Abgeschlossen',
  baslanmadi: 'Noch nicht begonnen',
  soruSayim: '{n} / 2 Fragen richtig',
  hedef: 'Ziel',
  yap: 'Die Übung dieser Woche',
  yapildi: 'Übung gemacht',
  yapildiDugme: 'Ich habe die Übung gemacht',
  sorular: 'Testen Sie sich',
  sorularGiris: 'Sie können so oft versuchen, wie Sie möchten. Die Markierung wird gespeichert, sobald Sie die richtige Antwort finden.',
  dogru: 'Richtig.',
  yanlis: 'Nicht richtig; versuchen Sie es noch einmal.',
  dogruBulundu: 'Frage erledigt.',
  denetle: 'Antwort prüfen',
  secimYok: 'Wählen Sie zuerst eine Antwort.',
  kaynaklar: 'Quellen',
  kaynakNotu: 'Die Links führen zu externen Seiten und öffnen in einem neuen Tab.',
  videoBaslik: 'Diyanet-Video',
  videoYukle: 'Video abspielen',
  videoNot: 'Von YouTube wird nichts geladen, bis Sie auf Abspielen drücken.',
  videoBaglanti: 'Auf YouTube öffnen',
  haftayiTamamla: 'Ich habe die Woche abgeschlossen',
  haftaTamamlandi: 'Woche abgeschlossen',
  haftaIpucu: 'Wenn Sie möchten, probieren Sie zuerst die Fragen und die Übung; das Tempo bestimmen Sie.',
  platformdaCalisin: 'Dieses Thema auch auf der Plattform vertiefen',
  onceki: 'Vorherige Woche',
  sonraki: 'Nächste Woche',
  tumHaftalar: 'Alle Wochen',
  yollarBaglantisi: 'Alle Wege',
  adimdakiHaftalar: 'Die Wochen dieses Schritts',
  adimaBagli: 'Zugehöriger Schritt',
  bitisBaslik: 'Zwölf Wochen geschafft',
  bitisMetin: 'Sie haben das Gelernte zusammengefasst. Für das nächste kleine Ziel können Sie mit einem Imam in Ihrer Nähe sprechen.',
  jsGerek: 'Zum Abhaken und für die Fortschrittsanzeige ist JavaScript nötig; die Texte lassen sich auch ohne lesen.',
  yolaBak: 'Weg ansehen',
};

function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (deger && typeof deger === 'object') return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, fransizca(v)])) as T;
  return deger;
}
const HAZIR: Record<Dil, YeniYolMetinleri> = { tr: TR, fr: fransizca(FR), en: EN, nl: NL, de: DE };
export const yeniYolMetinleri = (dil: Dil): YeniYolMetinleri => HAZIR[dil];
