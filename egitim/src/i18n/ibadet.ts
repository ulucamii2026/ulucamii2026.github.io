/**
 * İlim Yolu «Abdest ve Namaz» metinleri (10 Kasım 2026): arayüz, çizim adları ve adım adları. Beş dil `Record<Dil, …>` ile zorunlu
 * (docs/DIL-NL-DE.md). Türkçe «siz»; Fransızca «vous», Hollandaca «u», Almanca «Sie». Dinî hüküm cümlesi YOKTUR: adımların metni, hükmü ve
 * kaynağı src/data/ibadet/*.json'dan olduğu gibi gelir. Terimler veri dosyasındaki sözlükle uyumludur (rük‘û/secde/ka‘de…).
 * `{n}`-türü yer tutucular `doldur` ile doldurulur. Fransızcada noktalama öncesi boşluk `fransizTipografi` ile düzelir.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

type Beşli = readonly [string, string, string, string, string];
const SIRA: readonly Dil[] = ['tr', 'fr', 'en', 'nl', 'de'];
const sec = (b: Beşli, dil: Dil): string => fransizTipografi2(b[SIRA.indexOf(dil)], dil);
const fransizTipografi2 = (s: string, dil: Dil): string => (dil === 'fr' ? fransizTipografi(s) : s);

/** Çizim (SVG) kısa adları; aynı zamanda metin alternatifinin içeriği. Abdest adımlarının adı da buradan gelir (çizim 1–1). */
const CIZIM_ADI: Readonly<Record<string, Beşli>> = {
  'abdest-niyet': ['Niyet ve besmele', 'Intention et basmala', 'Intention and basmala', 'Intentie en basmala', 'Absicht und Basmala'],
  'abdest-eller': ['Elleri yıkama', 'Laver les mains', 'Washing the hands', 'De handen wassen', 'Hände waschen'],
  'abdest-dis': ['Dişleri temizleme', 'Nettoyer les dents', 'Cleaning the teeth', 'De tanden reinigen', 'Zähne reinigen'],
  'abdest-agiz': ['Ağzı çalkalama', 'Se rincer la bouche', 'Rinsing the mouth', 'De mond spoelen', 'Mund ausspülen'],
  'abdest-burun': ['Buruna su çekme', 'Aspirer l’eau par le nez', 'Sniffing water into the nose', 'Water in de neus trekken', 'Wasser in die Nase ziehen'],
  'abdest-yuz': ['Yüzü yıkama', 'Laver le visage', 'Washing the face', 'Het gezicht wassen', 'Das Gesicht waschen'],
  'abdest-kollar': ['Kolları yıkama', 'Laver les bras', 'Washing the arms', 'De armen wassen', 'Die Arme waschen'],
  'abdest-bas': ['Başı mesh etme', 'Essuyer la tête (masḥ)', 'Wiping the head (mash)', 'Over het hoofd strijken (mash)', 'Über den Kopf wischen (Mash)'],
  'abdest-kulak': ['Kulakları mesh etme', 'Essuyer les oreilles', 'Wiping the ears', 'Over de oren strijken', 'Die Ohren abwischen'],
  'abdest-boyun': ['Boynu mesh etme', 'Essuyer la nuque', 'Wiping the neck', 'Over de nek strijken', 'Den Nacken abwischen'],
  'abdest-ayak': ['Ayakları yıkama', 'Laver les pieds', 'Washing the feet', 'De voeten wassen', 'Die Füße waschen'],
  'abdest-sehadet': ['Şehâdet getirme', 'Prononcer la chahada', 'Reciting the shahada', 'De sjahada uitspreken', 'Das Glaubensbekenntnis sprechen'],
  'ui-kible': ['Kıbleye dönme', 'Se tourner vers la qibla', 'Facing the qibla', 'Naar de qibla keren', 'Sich zur Kibla wenden'],
  'ui-su': ['Su', 'Eau', 'Water', 'Water', 'Wasser'],
  'ui-seccade': ['Seccade', 'Tapis de prière', 'Prayer mat', 'Gebedskleedje', 'Gebetsteppich'],
  'ui-sirala': ['Sıralama', 'Mise en ordre', 'Ordering', 'Ordenen', 'Ordnen'],
  'ui-eslestir': ['Eşleştirme', 'Association', 'Matching', 'Koppelen', 'Zuordnen'],
  'ui-tamam': ['Tamam', 'Terminé', 'Done', 'Klaar', 'Erledigt'],
  'namaz-niyet': ['Niyet ve kıbleye dönüş', 'Intention, face à la qibla', 'Intention, facing the qibla', 'Intentie, naar de qibla gericht', 'Absicht, zur Kibla gewandt'],
  'namaz-iftitah': ['İftitah tekbiri', 'Takbir d’ouverture', 'Opening takbir', 'Openingstakbier', 'Eröffnungs-Takbir'],
  'namaz-kiyam': ['Kıyam (ayakta durma)', 'Qiyâm (station debout)', 'Qiyam (standing)', 'Qiyam (staan)', 'Qiyam (Stehen)'],
  'namaz-ruku': ['Rükû', 'Inclinaison (rükû)', 'Bowing (ruku‘)', 'Buiging (roekoe‘)', 'Verbeugung (Ruku‘)'],
  'namaz-kavme': ['Kavme (rükûdan doğrulma)', 'Kavme (se redresser après le rükû)', 'Qawma (rising from the bow)', 'Qawma (oprichten na de buiging)', 'Qawma (Aufrichten nach der Verbeugung)'],
  'namaz-secde': ['Secde', 'Prosternation (secde)', 'Prostration (sajda)', 'Prosternatie (sadjda)', 'Niederwerfung (Sadschda)'],
  'namaz-celse': ['Celse (iki secde arası oturuş)', 'Celse (assise brève)', 'Jalsa (short sitting)', 'Djalsa (korte zit)', 'Dschalsa (kurzes Sitzen)'],
  'namaz-kade': ['Ka‘de (oturuş)', 'Ka‘de (assise)', 'Qa‘da (sitting)', 'Qa‘da (zit)', 'Qa‘da (Sitzen)'],
  'namaz-selam-sag': ['Sağa selâm', 'Salut à droite', 'Salaam to the right', 'Saluut naar rechts', 'Friedensgruß nach rechts'],
  'namaz-selam-sol': ['Sola selâm', 'Salut à gauche', 'Salaam to the left', 'Saluut naar links', 'Friedensgruß nach links'],
};

/** Namaz adımlarının kısa adları (çizim adından farklı olanlar; kalanı çizim adından gelir). */
const NAMAZ_ADIM_ADI: Readonly<Record<string, Beşli>> = {
  'nm-03': ['Elleri bağlama', 'Placer les mains l’une sur l’autre', 'Placing the hands', 'De handen over elkaar leggen', 'Die Hände übereinanderlegen'],
  'nm-04': ['Sübhâneke', 'Soubhânaka', 'Subhanaka', 'Soebhanaka', 'Subhanaka'],
  'nm-05': ['Eûzü ve besmele', 'Istiâdha et basmala', 'Ta‘awwudh and basmala', 'Ta‘awwoedh en basmala', 'Ta‘awwudh und Basmala'],
  'nm-06': ['Fâtiha ve sûre (zamm-ı sûre)', 'Fâtiha et sourate', 'Fatiha and a surah', 'Fatiha en een soera', 'Fatiha und eine Sure'],
  'nm-09': ['Birinci secde', 'Première prosternation', 'First prostration', 'Eerste prosternatie', 'Erste Niederwerfung'],
  'nm-11': ['İkinci secde', 'Seconde prosternation', 'Second prostration', 'Tweede prosternatie', 'Zweite Niederwerfung'],
  'nm-12': ['Ka‘de ve Tahiyyât', 'Qa‘da et Tahiyyât', 'Qa‘da and Tahiyyat', 'Qa‘da en Tahiyyat', 'Qa‘da und Tahiyyat'],
  'nm-13': ['Salavat', 'Salawât', 'Salawat', 'Salawat', 'Salawat'],
  'nm-14': ['Dua', 'Invocation (doua)', 'Supplication (dua)', 'Smeekbede (doea)', 'Bittgebet (Dua)'],
};

/** Adım/çizim kısa adı; çizim adı bulunamazsa hata (veri–metin uyumunu derleme zamanında yakalar). */
export function cizimAdi(dil: Dil, cizim: string): string {
  const b = CIZIM_ADI[cizim];
  if (!b) throw new Error(`çizim adı yok: ${cizim}`);
  return sec(b, dil);
}
export function adimAdi(dil: Dil, adimId: string, cizim: string): string {
  const b = NAMAZ_ADIM_ADI[adimId];
  return b ? sec(b, dil) : cizimAdi(dil, cizim);
}
export const CIZIM_ADLARI: readonly string[] = Object.keys(CIZIM_ADI);
export const ADIM_ADI_KIMLIKLERI: readonly string[] = Object.keys(NAMAZ_ADIM_ADI);

export interface IbadetMetinleri {
  ad: string;
  hubAciklama: string;
  hubLead: string;
  cizimNotu: string;
  hocaNotu: string;
  kaynak: string;
  /** «Çizim: {ad}» (figürlerin metin alternatifi) */
  cizimAlt: string;
  bolumTamam: string;
  basla: string;
  tamamlandi: string;
  abdestBaslik: string;
  namazBaslik: string;
  devam: string;
  abdestOzet: string;
  namazOzet: string;
  vakitlerBaslik: string;
  vakitlerMetin: string;
  vakitOzet: string;
  /** Konu sayfaları */
  geri: string;
  abdestAciklama: string;
  abdestLead: string;
  namazAciklama: string;
  namazLead: string;
  ogrenBaslik: string;
  ogrenMetin: string;
  adimSayaci: string;
  onceki: string;
  sonraki: string;
  hepsiniGoster: string;
  adimAdim: string;
  ogrendim: string;
  ogrendimOldu: string;
  kaydedilemedi: string;
  hukum: string;
  kadin: string;
  not: string;
  duaCalis: string;
  fiil: { iftitah: string; ruku: string; secde: string };
  /** {fiil} */
  kismiNot: string;
  jsGerek: string;
  /** Sıralama */
  siralaBaslik: string;
  siralaAbdest: string;
  siralaNamaz: string;
  siralaVakit: string;
  kontrolEt: string;
  yenidenKaristir: string;
  yukari: string;
  asagi: string;
  /** {ad} {n} {m} */
  konum: string;
  siraSonuc: string;
  siraTam: string;
  dogruYerde: string;
  yanlisYerde: string;
  /** Eşleştirme */
  eslesBaslik: string;
  eslesYonerge: string;
  eslesNo: string;
  secili: string;
  eslesSonuc: string;
  eslesTam: string;
  eslesEksik: string;
  yeniTur: string;
  dogruEslesme: string;
  yanlisEslesme: string;
  /** Seçim (hüküm / rek‘at sayısı) */
  hukumBaslik: string;
  hukumYonerge: string;
  hukumVakitBaslik: string;
  secimYok: string;
  dogru: string;
  /** {c} */
  yanlis: string;
  secimSonuc: string;
  secimTam: string;
  vakitSayiBaslik: string;
  vakitSayiYonerge: string;
  /** {n} */
  rekat: string;
  /** Namaz sayfası */
  rekatBaslik: string;
  rekatMetin: string;
  grup: { ilk: string; ikinci: string; ucuncu: string; son: string };
  kural: string;
  kuralBaslik: string;
  vakitTabloBaslik: string;
  sutun: { vakit: string; once: string; farz: string; sonra: string };
  yok: string;
  ayrinti: string;
  vitirNot: string;
  /** Vakit sayfası */
  vakitSayfaAciklama: string;
  vakitSayfaLead: string;
  /** {ad} */
  vakitAd: string;
  birimler: { once: string; farz: string; sonra: string };
  semaBaslik: string;
  semaMetin: string;
  /** {n} */
  rekatNo: string;
  sonOturusEtiketi: string;
  ilkOturusEtiketi: string;
  hatirlatma: string;
  digerVakitler: string;
}

const TR: IbadetMetinleri = {
  ad: 'Abdest ve Namaz',
  hubAciklama: 'Abdestin ve namazın adımlarını çizimlerle öğrenin; sıralama ve eşleştirme alıştırmalarıyla pekiştirin.',
  hubLead: 'Adımları sırayla öğrenin, sonra alıştırmalarla kendinizi sınayın. Puan ve sıralama yoktur; yalnız hangi bölümleri tamamladığınız görünür.',
  cizimNotu: 'Çizimlerdeki figürler bilerek yüzsüz ve sadedir; yalnızca duruşu ve hareketi göstermek içindir.',
  hocaNotu: 'Sorularınız için hocanıza veya camimizin imamına danışabilirsiniz.',
  kaynak: 'Kaynak',
  cizimAlt: 'Çizim: {ad}',
  bolumTamam: '{n} / {m} bölüm tamamlandı',
  basla: 'Başla',
  tamamlandi: 'Tamamlandı',
  abdestBaslik: 'Abdest',
  namazBaslik: 'Namaz',
  devam: 'Devam et',
  abdestOzet: 'Abdestin on üç adımı: farzları, sünnetleri ve âdâbı.',
  namazOzet: 'Namazın adımları, rek‘at kuralları ve vakitler.',
  vakitlerBaslik: 'Beş vakit namaz',
  vakitlerMetin: 'Her vaktin farz ve sünnet rek‘atları ve kılınış sırası.',
  vakitOzet: 'Farz ve sünnet rek‘atları',
  geri: 'Abdest ve Namaz',
  abdestAciklama: 'Abdestin adımları: çizimlerle öğrenin, sıralayın ve eşleştirin.',
  abdestLead: 'Abdestin adımlarını sırayla öğrenin. Her adımda hükmü (farz, sünnet, âdâp), kaynağını ve varsa duasını görürsünüz.',
  namazAciklama: 'Namazın adımları ve rek‘at kuralları: çizimlerle öğrenin, sıralayın ve eşleştirin.',
  namazLead: 'Önce adımları, sonra rek‘at düzenini ve vakitleri öğrenin. Duaların yanındaki bağlantıdan Diyanet kaydını dinleyebilirsiniz.',
  ogrenBaslik: 'Adım adım öğrenin',
  ogrenMetin: 'Her adımda çizim, hüküm ve kaynak vardır.',
  adimSayaci: 'Adım {n} / {m}',
  onceki: 'Önceki adım',
  sonraki: 'Sonraki adım',
  hepsiniGoster: 'Tüm adımları göster',
  adimAdim: 'Adım adım göster',
  ogrendim: 'Bu bölümü öğrendim',
  ogrendimOldu: 'Kaydedildi: bu bölümü öğrendiniz.',
  kaydedilemedi: 'Kaydedilemedi; tarayıcınızın depolaması kapalı olabilir.',
  hukum: 'Hüküm',
  kadin: 'Kadınlar için',
  not: 'Not',
  duaCalis: 'Dinle ve çalış: {ad}',
  fiil: { iftitah: 'iftitah tekbiri', ruku: 'rükû', secde: 'secde' },
  kismiNot: 'Bu etiket yalnızca «{fiil}» içindir. Aynı adımdaki diğer ayrıntıların hükmü farklı olabilir (sünnet veya vâcip).',
  jsGerek: 'Alıştırmalar için tarayıcınızda JavaScript açık olmalıdır.',
  siralaBaslik: 'Sıraya dizin',
  siralaAbdest: 'Abdestin adımlarını doğru sıraya koyun. Bir adımı oklarla yukarı veya aşağı taşıyın.',
  siralaNamaz: 'İlk rek‘atın adımlarını doğru sıraya koyun. Bir adımı oklarla yukarı veya aşağı taşıyın.',
  siralaVakit: 'Bu vakitte namazların kılınış sırasına dizin. Oklarla yukarı veya aşağı taşıyın.',
  kontrolEt: 'Kontrol et',
  yenidenKaristir: 'Yeniden karıştır',
  yukari: 'Yukarı taşı',
  asagi: 'Aşağı taşı',
  konum: '{ad}: {n} / {m}. sırada',
  siraSonuc: '{n} / {m} adım doğru yerde.',
  siraTam: 'Doğru! Sıra tamam.',
  dogruYerde: 'doğru yerde',
  yanlisYerde: 'yanlış yerde',
  eslesBaslik: 'Adımı çizimle eşleştirin',
  eslesYonerge: 'Önce soldan bir adım, sonra sağdan ona uyan çizimi seçin. Bir eşleşmeyi bozmak için eşleşen öğeye yeniden dokunun.',
  eslesNo: 'eşleşme {n}',
  secili: 'seçili',
  eslesSonuc: '{n} / {m} eşleşme doğru.',
  eslesTam: 'Doğru! Hepsi eşleşti.',
  eslesEksik: 'Önce bütün öğeleri eşleştirin.',
  yeniTur: 'Yeni tur',
  dogruEslesme: 'doğru',
  yanlisEslesme: 'yanlış',
  hukumBaslik: 'Hükmü seçin',
  hukumYonerge: 'Her satır için hükmünü seçin.',
  hukumVakitBaslik: 'Bölümün hükmünü seçin',
  secimYok: 'Önce her satırda bir seçenek işaretleyin.',
  dogru: 'Doğru.',
  yanlis: 'Yanlış. Doğrusu: {c}',
  secimSonuc: '{n} / {m} doğru.',
  secimTam: 'Doğru! Hepsi doğru.',
  vakitSayiBaslik: 'Kaç rek‘at farz?',
  vakitSayiYonerge: 'Her vakit için farz rek‘at sayısını seçin.',
  rekat: '{n} rek‘at',
  rekatBaslik: 'Rek‘at rek‘at namaz',
  rekatMetin: 'Her rek‘atta hangi adımların olduğunu görün. Üçüncü ve dördüncü rek‘atta Fâtiha için kuralı da okuyun.',
  grup: { ilk: 'İlk rek‘at', ikinci: 'İkinci rek‘at', ucuncu: 'Üçüncü ve dördüncü rek‘at', son: 'Son oturuş' },
  kural: 'Kural',
  kuralBaslik: 'Rek‘at kuralları',
  vakitTabloBaslik: 'Vakitler ve rek‘at sayıları',
  sutun: { vakit: 'Vakit', once: 'Farzdan önce', farz: 'Farz', sonra: 'Farzdan sonra' },
  yok: 'yok',
  ayrinti: 'Vakit sayfası',
  vitirNot: 'Vitir: Hanefî mezhebine göre.',
  vakitSayfaAciklama: '{ad} namazının farz ve sünnet rek‘atları, kılınış sırası ve rek‘at düzeni.',
  vakitSayfaLead: 'Bu vaktin rek‘atlarını, hükümlerini ve farzın rek‘at rek‘at kılınışını öğrenin.',
  vakitAd: '{ad} namazı',
  birimler: { once: 'Farzdan önce', farz: 'Farz', sonra: 'Farzdan sonra' },
  semaBaslik: 'Farzın kılınışı',
  semaMetin: 'Farzın her rek‘atında hangi adımlar vardır?',
  rekatNo: '{n}. rek‘at',
  sonOturusEtiketi: 'son oturuşla biter',
  ilkOturusEtiketi: 'ilk oturuşla biter',
  hatirlatma: 'Hatırlatma',
  digerVakitler: 'Diğer vakitler',
};

const FR: IbadetMetinleri = {
  ad: 'Ablutions et prière',
  hubAciklama: 'Apprenez les étapes du woudou’ et de la prière avec des illustrations, puis exercez-vous à les ordonner et à les associer.',
  hubLead: 'Apprenez les étapes dans l’ordre, puis testez-vous avec les exercices. Il n’y a ni points ni classement : vous voyez seulement les parties que vous avez terminées.',
  cizimNotu: 'Les personnages des illustrations n’ont volontairement pas de visage ; ils servent uniquement à montrer la posture et le geste.',
  hocaNotu: 'Pour vos questions, adressez-vous à votre enseignant ou à l’imam de notre mosquée.',
  kaynak: 'Source',
  cizimAlt: 'Illustration : {ad}',
  bolumTamam: '{n} / {m} parties terminées',
  basla: 'Commencer',
  tamamlandi: 'Terminé',
  abdestBaslik: 'Les ablutions (woudou’)',
  namazBaslik: 'La prière (salât)',
  devam: 'Continuer',
  abdestOzet: 'Les treize étapes des ablutions : obligations, sunna et bonnes manières.',
  namazOzet: 'Les étapes de la prière, la règle des rak‘a et les horaires.',
  vakitlerBaslik: 'Les cinq prières',
  vakitlerMetin: 'Les rak‘a obligatoires et surérogatoires de chaque prière et leur ordre.',
  vakitOzet: 'Rak‘a obligatoires et sunna',
  geri: 'Ablutions et prière',
  abdestAciklama: 'Les étapes des ablutions : apprenez avec des illustrations, ordonnez et associez.',
  abdestLead: 'Apprenez les étapes des ablutions dans l’ordre. Pour chaque étape, vous voyez son statut (fard, sunna, adab), sa source et, s’il y en a une, son invocation.',
  namazAciklama: 'Les étapes de la prière et la règle des rak‘a : apprenez avec des illustrations, ordonnez et associez.',
  namazLead: 'Apprenez d’abord les étapes, puis l’organisation des rak‘a et les horaires. Le lien à côté des invocations vous permet d’écouter l’enregistrement de la Diyanet.',
  ogrenBaslik: 'Apprendre pas à pas',
  ogrenMetin: 'Chaque étape comporte une illustration, son statut et sa source.',
  adimSayaci: 'Étape {n} / {m}',
  onceki: 'Étape précédente',
  sonraki: 'Étape suivante',
  hepsiniGoster: 'Afficher toutes les étapes',
  adimAdim: 'Afficher pas à pas',
  ogrendim: 'J’ai appris cette partie',
  ogrendimOldu: 'Enregistré : vous avez appris cette partie.',
  kaydedilemedi: 'Impossible d’enregistrer ; le stockage de votre navigateur est peut-être désactivé.',
  hukum: 'Statut',
  kadin: 'Pour les femmes',
  not: 'Remarque',
  duaCalis: 'Écouter et réviser : {ad}',
  fiil: { iftitah: 'takbir d’ouverture', ruku: 'rükû', secde: 'secde' },
  kismiNot: 'Cette mention ne concerne que « {fiil} ». Les autres détails de la même étape peuvent avoir un statut différent (sunna ou wâjib).',
  jsGerek: 'JavaScript doit être activé dans votre navigateur pour les exercices.',
  siralaBaslik: 'Remettre dans l’ordre',
  siralaAbdest: 'Remettez les étapes des ablutions dans le bon ordre. Déplacez une étape vers le haut ou le bas avec les flèches.',
  siralaNamaz: 'Remettez les étapes de la première rak‘a dans le bon ordre. Déplacez une étape vers le haut ou le bas avec les flèches.',
  siralaVakit: 'Remettez dans l’ordre dans lequel on accomplit les prières de ce moment. Utilisez les flèches vers le haut ou le bas.',
  kontrolEt: 'Vérifier',
  yenidenKaristir: 'Mélanger à nouveau',
  yukari: 'Monter',
  asagi: 'Descendre',
  konum: '{ad} : position {n} sur {m}',
  siraSonuc: '{n} / {m} étapes bien placées.',
  siraTam: 'Bravo ! L’ordre est correct.',
  dogruYerde: 'bien placée',
  yanlisYerde: 'mal placée',
  eslesBaslik: 'Associer l’étape à l’illustration',
  eslesYonerge: 'Choisissez d’abord une étape à gauche, puis l’illustration correspondante à droite. Pour défaire une association, touchez à nouveau l’élément associé.',
  eslesNo: 'association {n}',
  secili: 'sélectionné',
  eslesSonuc: '{n} / {m} associations correctes.',
  eslesTam: 'Bravo ! Tout est associé.',
  eslesEksik: 'Associez d’abord tous les éléments.',
  yeniTur: 'Nouveau tour',
  dogruEslesme: 'correct',
  yanlisEslesme: 'incorrect',
  hukumBaslik: 'Choisir le statut',
  hukumYonerge: 'Choisissez le statut de chaque ligne.',
  hukumVakitBaslik: 'Choisir le statut de chaque partie',
  secimYok: 'Cochez d’abord une option sur chaque ligne.',
  dogru: 'Correct.',
  yanlis: 'Incorrect. La bonne réponse : {c}',
  secimSonuc: '{n} / {m} correctes.',
  secimTam: 'Bravo ! Tout est correct.',
  vakitSayiBaslik: 'Combien de rak‘a obligatoires ?',
  vakitSayiYonerge: 'Choisissez le nombre de rak‘a obligatoires de chaque prière.',
  rekat: '{n} rak‘a',
  rekatBaslik: 'La prière rak‘a par rak‘a',
  rekatMetin: 'Voyez quelles étapes composent chaque rak‘a. Pour les troisième et quatrième rak‘a, lisez aussi la règle concernant la Fâtiha.',
  grup: { ilk: 'Première rak‘a', ikinci: 'Deuxième rak‘a', ucuncu: 'Troisième et quatrième rak‘a', son: 'Dernière assise' },
  kural: 'Règle',
  kuralBaslik: 'Règles des rak‘a',
  vakitTabloBaslik: 'Les prières et leurs rak‘a',
  sutun: { vakit: 'Prière', once: 'Avant le fard', farz: 'Fard', sonra: 'Après le fard' },
  yok: 'aucune',
  ayrinti: 'Page de la prière',
  vitirNot: 'Witr : selon l’école hanafite.',
  vakitSayfaAciklama: 'Les rak‘a obligatoires et surérogatoires de la prière de {ad}, leur ordre et l’organisation des rak‘a.',
  vakitSayfaLead: 'Apprenez les rak‘a de cette prière, leur statut et le déroulement du fard rak‘a par rak‘a.',
  vakitAd: 'Prière de {ad}',
  birimler: { once: 'Avant le fard', farz: 'Fard', sonra: 'Après le fard' },
  semaBaslik: 'Déroulement du fard',
  semaMetin: 'Quelles étapes trouve-t-on dans chaque rak‘a du fard ?',
  rekatNo: 'Rak‘a {n}',
  sonOturusEtiketi: 'se termine par l’assise finale',
  ilkOturusEtiketi: 'se termine par la première assise',
  hatirlatma: 'Rappel',
  digerVakitler: 'Les autres prières',
};

const EN: IbadetMetinleri = {
  ad: 'Ablution and Prayer',
  hubAciklama: 'Learn the steps of wudu and prayer with illustrations, then practise ordering and matching them.',
  hubLead: 'Learn the steps in order, then test yourself with the exercises. There are no points or rankings; you only see which parts you have completed.',
  cizimNotu: 'The figures in the drawings deliberately have no faces; they only show the posture and the movement.',
  hocaNotu: 'For your questions, you can ask your teacher or the imam of our mosque.',
  kaynak: 'Source',
  cizimAlt: 'Drawing: {ad}',
  bolumTamam: '{n} of {m} parts completed',
  basla: 'Start',
  tamamlandi: 'Completed',
  abdestBaslik: 'Ablution (wudu)',
  namazBaslik: 'The prayer (salah)',
  devam: 'Continue',
  abdestOzet: 'The thirteen steps of wudu: obligatory acts, sunnah and etiquette.',
  namazOzet: 'The steps of the prayer, the rak‘a rules and the prayer times.',
  vakitlerBaslik: 'The five daily prayers',
  vakitlerMetin: 'The obligatory and sunnah rak‘as of each prayer and their order.',
  vakitOzet: 'Obligatory and sunnah rak‘as',
  geri: 'Ablution and Prayer',
  abdestAciklama: 'The steps of wudu: learn with drawings, put them in order and match them.',
  abdestLead: 'Learn the steps of wudu in order. For each step you see its ruling (fard, sunnah, adab), its source and, where there is one, its supplication.',
  namazAciklama: 'The steps of the prayer and the rak‘a rules: learn with drawings, put them in order and match them.',
  namazLead: 'First learn the steps, then the rak‘a structure and the prayer times. The link next to each supplication lets you listen to the Diyanet recording.',
  ogrenBaslik: 'Learn step by step',
  ogrenMetin: 'Each step has a drawing, its ruling and its source.',
  adimSayaci: 'Step {n} of {m}',
  onceki: 'Previous step',
  sonraki: 'Next step',
  hepsiniGoster: 'Show all steps',
  adimAdim: 'Show step by step',
  ogrendim: 'I have learned this part',
  ogrendimOldu: 'Saved: you have learned this part.',
  kaydedilemedi: 'Could not be saved; your browser’s storage may be turned off.',
  hukum: 'Ruling',
  kadin: 'For women',
  not: 'Note',
  duaCalis: 'Listen and practise: {ad}',
  fiil: { iftitah: 'opening takbir', ruku: 'ruku‘', secde: 'sajda' },
  kismiNot: 'This label applies only to “{fiil}”. Other details in the same step may have a different ruling (sunnah or wajib).',
  jsGerek: 'JavaScript must be enabled in your browser for the exercises.',
  siralaBaslik: 'Put in order',
  siralaAbdest: 'Put the steps of wudu in the right order. Move a step up or down with the arrows.',
  siralaNamaz: 'Put the steps of the first rak‘a in the right order. Move a step up or down with the arrows.',
  siralaVakit: 'Put the parts of this prayer in the order in which they are prayed. Move them up or down with the arrows.',
  kontrolEt: 'Check',
  yenidenKaristir: 'Shuffle again',
  yukari: 'Move up',
  asagi: 'Move down',
  konum: '{ad}: position {n} of {m}',
  siraSonuc: '{n} of {m} steps are in the right place.',
  siraTam: 'Correct! The order is right.',
  dogruYerde: 'in the right place',
  yanlisYerde: 'in the wrong place',
  eslesBaslik: 'Match the step to the drawing',
  eslesYonerge: 'First choose a step on the left, then the matching drawing on the right. To undo a match, touch the matched item again.',
  eslesNo: 'match {n}',
  secili: 'selected',
  eslesSonuc: '{n} of {m} matches are correct.',
  eslesTam: 'Correct! Everything is matched.',
  eslesEksik: 'Match all the items first.',
  yeniTur: 'New round',
  dogruEslesme: 'correct',
  yanlisEslesme: 'wrong',
  hukumBaslik: 'Choose the ruling',
  hukumYonerge: 'Choose the ruling for each row.',
  hukumVakitBaslik: 'Choose the ruling of each part',
  secimYok: 'First tick one option in every row.',
  dogru: 'Correct.',
  yanlis: 'Not quite. The answer is: {c}',
  secimSonuc: '{n} of {m} correct.',
  secimTam: 'Correct! All of them are right.',
  vakitSayiBaslik: 'How many obligatory rak‘as?',
  vakitSayiYonerge: 'Choose the number of obligatory rak‘as for each prayer.',
  rekat: '{n} rak‘a',
  rekatBaslik: 'The prayer, rak‘a by rak‘a',
  rekatMetin: 'See which steps make up each rak‘a. For the third and fourth rak‘a, also read the rule about the Fatiha.',
  grup: { ilk: 'First rak‘a', ikinci: 'Second rak‘a', ucuncu: 'Third and fourth rak‘a', son: 'Final sitting' },
  kural: 'Rule',
  kuralBaslik: 'Rak‘a rules',
  vakitTabloBaslik: 'Prayer times and number of rak‘as',
  sutun: { vakit: 'Prayer', once: 'Before the fard', farz: 'Fard', sonra: 'After the fard' },
  yok: 'none',
  ayrinti: 'Prayer page',
  vitirNot: 'Witr: according to the Hanafi school.',
  vakitSayfaAciklama: 'The obligatory and sunnah rak‘as of the {ad} prayer, their order and the rak‘a structure.',
  vakitSayfaLead: 'Learn the rak‘as of this prayer, their rulings and how the fard is prayed rak‘a by rak‘a.',
  vakitAd: '{ad} prayer',
  birimler: { once: 'Before the fard', farz: 'Fard', sonra: 'After the fard' },
  semaBaslik: 'How the fard is prayed',
  semaMetin: 'Which steps does each rak‘a of the fard contain?',
  rekatNo: 'Rak‘a {n}',
  sonOturusEtiketi: 'ends with the final sitting',
  ilkOturusEtiketi: 'ends with the first sitting',
  hatirlatma: 'Reminder',
  digerVakitler: 'Other prayers',
};

const NL: IbadetMetinleri = {
  ad: 'Wassing en gebed',
  hubAciklama: 'Leer de stappen van de woedoe en het gebed met tekeningen en oefen met ordenen en koppelen.',
  hubLead: 'Leer de stappen op volgorde en test uzelf daarna met de oefeningen. Er zijn geen punten of ranglijsten; u ziet alleen welke onderdelen u hebt afgerond.',
  cizimNotu: 'De figuren in de tekeningen hebben bewust geen gezicht; ze tonen alleen de houding en de beweging.',
  hocaNotu: 'Voor uw vragen kunt u terecht bij uw leraar of de imam van onze moskee.',
  kaynak: 'Bron',
  cizimAlt: 'Tekening: {ad}',
  bolumTamam: '{n} van {m} onderdelen afgerond',
  basla: 'Beginnen',
  tamamlandi: 'Afgerond',
  abdestBaslik: 'De wassing (woedoe)',
  namazBaslik: 'Het gebed (salaat)',
  devam: 'Verdergaan',
  abdestOzet: 'De dertien stappen van de woedoe: verplichtingen, sunna en fatsoensnormen.',
  namazOzet: 'De stappen van het gebed, de regels voor de rak‘a en de gebedstijden.',
  vakitlerBaslik: 'De vijf dagelijkse gebeden',
  vakitlerMetin: 'De verplichte en sunna-rak‘a’s van elk gebed en hun volgorde.',
  vakitOzet: 'Verplichte en sunna-rak‘a’s',
  geri: 'Wassing en gebed',
  abdestAciklama: 'De stappen van de woedoe: leer met tekeningen, breng in volgorde en koppel.',
  abdestLead: 'Leer de stappen van de woedoe op volgorde. Bij elke stap ziet u de status (fard, sunna, adab), de bron en, indien aanwezig, de smeekbede.',
  namazAciklama: 'De stappen van het gebed en de regels voor de rak‘a: leer met tekeningen, breng in volgorde en koppel.',
  namazLead: 'Leer eerst de stappen, daarna de opbouw van de rak‘a en de gebedstijden. Via de link bij een smeekbede luistert u naar de opname van de Diyanet.',
  ogrenBaslik: 'Leer stap voor stap',
  ogrenMetin: 'Bij elke stap hoort een tekening, de status en de bron.',
  adimSayaci: 'Stap {n} van {m}',
  onceki: 'Vorige stap',
  sonraki: 'Volgende stap',
  hepsiniGoster: 'Alle stappen tonen',
  adimAdim: 'Stap voor stap tonen',
  ogrendim: 'Ik heb dit onderdeel geleerd',
  ogrendimOldu: 'Opgeslagen: u hebt dit onderdeel geleerd.',
  kaydedilemedi: 'Opslaan is niet gelukt; de opslag van uw browser staat mogelijk uit.',
  hukum: 'Status',
  kadin: 'Voor vrouwen',
  not: 'Opmerking',
  duaCalis: 'Beluisteren en oefenen: {ad}',
  fiil: { iftitah: 'openingstakbier', ruku: 'roekoe‘', secde: 'sadjda' },
  kismiNot: 'Dit label geldt alleen voor ‘{fiil}’. Andere details in dezelfde stap kunnen een andere status hebben (sunna of wadjib).',
  jsGerek: 'Voor de oefeningen moet JavaScript in uw browser aanstaan.',
  siralaBaslik: 'Zet in de juiste volgorde',
  siralaAbdest: 'Zet de stappen van de woedoe in de juiste volgorde. Verplaats een stap met de pijlen omhoog of omlaag.',
  siralaNamaz: 'Zet de stappen van de eerste rak‘a in de juiste volgorde. Verplaats een stap met de pijlen omhoog of omlaag.',
  siralaVakit: 'Zet de onderdelen van dit gebed in de volgorde waarin ze worden gebeden. Verplaats ze met de pijlen omhoog of omlaag.',
  kontrolEt: 'Controleren',
  yenidenKaristir: 'Opnieuw husselen',
  yukari: 'Omhoog',
  asagi: 'Omlaag',
  konum: '{ad}: positie {n} van {m}',
  siraSonuc: '{n} van {m} stappen staan op de juiste plaats.',
  siraTam: 'Goed zo! De volgorde klopt.',
  dogruYerde: 'op de juiste plaats',
  yanlisYerde: 'op de verkeerde plaats',
  eslesBaslik: 'Koppel de stap aan de tekening',
  eslesYonerge: 'Kies eerst links een stap en dan rechts de bijpassende tekening. Raak een gekoppeld onderdeel opnieuw aan om de koppeling te verbreken.',
  eslesNo: 'koppeling {n}',
  secili: 'geselecteerd',
  eslesSonuc: '{n} van {m} koppelingen kloppen.',
  eslesTam: 'Goed zo! Alles is gekoppeld.',
  eslesEksik: 'Koppel eerst alle onderdelen.',
  yeniTur: 'Nieuwe ronde',
  dogruEslesme: 'juist',
  yanlisEslesme: 'onjuist',
  hukumBaslik: 'Kies de status',
  hukumYonerge: 'Kies bij elke regel de status.',
  hukumVakitBaslik: 'Kies de status van elk onderdeel',
  secimYok: 'Kies eerst bij elke regel een optie.',
  dogru: 'Juist.',
  yanlis: 'Onjuist. Het juiste antwoord: {c}',
  secimSonuc: '{n} van {m} juist.',
  secimTam: 'Goed zo! Alles is juist.',
  vakitSayiBaslik: 'Hoeveel verplichte rak‘a’s?',
  vakitSayiYonerge: 'Kies bij elk gebed het aantal verplichte rak‘a’s.',
  rekat: '{n} rak‘a',
  rekatBaslik: 'Het gebed, rak‘a voor rak‘a',
  rekatMetin: 'Bekijk uit welke stappen elke rak‘a bestaat. Lees bij de derde en vierde rak‘a ook de regel over de Fatiha.',
  grup: { ilk: 'Eerste rak‘a', ikinci: 'Tweede rak‘a', ucuncu: 'Derde en vierde rak‘a', son: 'Laatste zit' },
  kural: 'Regel',
  kuralBaslik: 'Regels voor de rak‘a',
  vakitTabloBaslik: 'Gebedstijden en aantal rak‘a’s',
  sutun: { vakit: 'Gebed', once: 'Vóór de fard', farz: 'Fard', sonra: 'Na de fard' },
  yok: 'geen',
  ayrinti: 'Pagina van het gebed',
  vitirNot: 'Witr: volgens de hanafitische school.',
  vakitSayfaAciklama: 'De verplichte en sunna-rak‘a’s van het {ad}-gebed, hun volgorde en de opbouw van de rak‘a.',
  vakitSayfaLead: 'Leer de rak‘a’s van dit gebed, hun status en hoe de fard rak‘a voor rak‘a wordt gebeden.',
  vakitAd: '{ad}-gebed',
  birimler: { once: 'Vóór de fard', farz: 'Fard', sonra: 'Na de fard' },
  semaBaslik: 'Hoe de fard wordt gebeden',
  semaMetin: 'Welke stappen bevat elke rak‘a van de fard?',
  rekatNo: 'Rak‘a {n}',
  sonOturusEtiketi: 'eindigt met de laatste zit',
  ilkOturusEtiketi: 'eindigt met de eerste zit',
  hatirlatma: 'Ter herinnering',
  digerVakitler: 'Andere gebeden',
};

const DE: IbadetMetinleri = {
  ad: 'Waschung und Gebet',
  hubAciklama: 'Lernen Sie die Schritte von Wudu und Gebet mit Zeichnungen und üben Sie das Ordnen und Zuordnen.',
  hubLead: 'Lernen Sie die Schritte der Reihe nach und testen Sie sich dann mit den Übungen. Es gibt keine Punkte und keine Rangliste; Sie sehen nur, welche Teile Sie abgeschlossen haben.',
  cizimNotu: 'Die Figuren in den Zeichnungen haben bewusst kein Gesicht; sie zeigen nur die Haltung und die Bewegung.',
  hocaNotu: 'Bei Fragen wenden Sie sich an Ihre Lehrkraft oder den Imam unserer Moschee.',
  kaynak: 'Quelle',
  cizimAlt: 'Zeichnung: {ad}',
  bolumTamam: '{n} von {m} Teilen abgeschlossen',
  basla: 'Beginnen',
  tamamlandi: 'Abgeschlossen',
  abdestBaslik: 'Die Waschung (Wudu)',
  namazBaslik: 'Das Gebet (Salat)',
  devam: 'Weitermachen',
  abdestOzet: 'Die dreizehn Schritte des Wudu: Pflichten, Sunna und Anstand.',
  namazOzet: 'Die Schritte des Gebets, die Regeln für die Rak‘a und die Gebetszeiten.',
  vakitlerBaslik: 'Die fünf täglichen Gebete',
  vakitlerMetin: 'Die verpflichtenden und die Sunna-Rak‘a jedes Gebets und ihre Reihenfolge.',
  vakitOzet: 'Pflicht- und Sunna-Rak‘a',
  geri: 'Waschung und Gebet',
  abdestAciklama: 'Die Schritte des Wudu: mit Zeichnungen lernen, ordnen und zuordnen.',
  abdestLead: 'Lernen Sie die Schritte des Wudu der Reihe nach. Bei jedem Schritt sehen Sie den Rang (Fard, Sunna, Adab), die Quelle und, falls vorhanden, das Bittgebet.',
  namazAciklama: 'Die Schritte des Gebets und die Regeln für die Rak‘a: mit Zeichnungen lernen, ordnen und zuordnen.',
  namazLead: 'Lernen Sie zuerst die Schritte, dann den Aufbau der Rak‘a und die Gebetszeiten. Über den Link neben einem Bittgebet hören Sie die Aufnahme der Diyanet.',
  ogrenBaslik: 'Schritt für Schritt lernen',
  ogrenMetin: 'Zu jedem Schritt gehören eine Zeichnung, der Rang und die Quelle.',
  adimSayaci: 'Schritt {n} von {m}',
  onceki: 'Voriger Schritt',
  sonraki: 'Nächster Schritt',
  hepsiniGoster: 'Alle Schritte anzeigen',
  adimAdim: 'Schritt für Schritt anzeigen',
  ogrendim: 'Ich habe diesen Teil gelernt',
  ogrendimOldu: 'Gespeichert: Sie haben diesen Teil gelernt.',
  kaydedilemedi: 'Speichern nicht möglich; der Speicher Ihres Browsers ist möglicherweise ausgeschaltet.',
  hukum: 'Rang',
  kadin: 'Für Frauen',
  not: 'Hinweis',
  duaCalis: 'Anhören und üben: {ad}',
  fiil: { iftitah: 'Eröffnungs-Takbir', ruku: 'Ruku‘', secde: 'Sadschda' },
  kismiNot: 'Diese Kennzeichnung gilt nur für „{fiil}“. Andere Einzelheiten im selben Schritt können einen anderen Rang haben (Sunna oder Wadschib).',
  jsGerek: 'Für die Übungen muss JavaScript in Ihrem Browser eingeschaltet sein.',
  siralaBaslik: 'In die richtige Reihenfolge bringen',
  siralaAbdest: 'Bringen Sie die Schritte des Wudu in die richtige Reihenfolge. Verschieben Sie einen Schritt mit den Pfeilen nach oben oder unten.',
  siralaNamaz: 'Bringen Sie die Schritte der ersten Rak‘a in die richtige Reihenfolge. Verschieben Sie einen Schritt mit den Pfeilen nach oben oder unten.',
  siralaVakit: 'Bringen Sie die Teile dieses Gebets in die Reihenfolge, in der sie gebetet werden. Verschieben Sie sie mit den Pfeilen nach oben oder unten.',
  kontrolEt: 'Prüfen',
  yenidenKaristir: 'Neu mischen',
  yukari: 'Nach oben',
  asagi: 'Nach unten',
  konum: '{ad}: Position {n} von {m}',
  siraSonuc: '{n} von {m} Schritten stehen an der richtigen Stelle.',
  siraTam: 'Richtig! Die Reihenfolge stimmt.',
  dogruYerde: 'an der richtigen Stelle',
  yanlisYerde: 'an der falschen Stelle',
  eslesBaslik: 'Schritt und Zeichnung zuordnen',
  eslesYonerge: 'Wählen Sie zuerst links einen Schritt und dann rechts die passende Zeichnung. Zum Aufheben einer Zuordnung berühren Sie den zugeordneten Eintrag erneut.',
  eslesNo: 'Zuordnung {n}',
  secili: 'ausgewählt',
  eslesSonuc: '{n} von {m} Zuordnungen sind richtig.',
  eslesTam: 'Richtig! Alles ist zugeordnet.',
  eslesEksik: 'Ordnen Sie zuerst alle Einträge zu.',
  yeniTur: 'Neue Runde',
  dogruEslesme: 'richtig',
  yanlisEslesme: 'falsch',
  hukumBaslik: 'Den Rang wählen',
  hukumYonerge: 'Wählen Sie in jeder Zeile den Rang.',
  hukumVakitBaslik: 'Den Rang jedes Teils wählen',
  secimYok: 'Wählen Sie zuerst in jeder Zeile eine Option.',
  dogru: 'Richtig.',
  yanlis: 'Falsch. Richtig ist: {c}',
  secimSonuc: '{n} von {m} richtig.',
  secimTam: 'Richtig! Alles stimmt.',
  vakitSayiBaslik: 'Wie viele Pflicht-Rak‘a?',
  vakitSayiYonerge: 'Wählen Sie bei jedem Gebet die Zahl der Pflicht-Rak‘a.',
  rekat: '{n} Rak‘a',
  rekatBaslik: 'Das Gebet, Rak‘a für Rak‘a',
  rekatMetin: 'Sehen Sie, aus welchen Schritten jede Rak‘a besteht. Lesen Sie bei der dritten und vierten Rak‘a auch die Regel zur Fatiha.',
  grup: { ilk: 'Erste Rak‘a', ikinci: 'Zweite Rak‘a', ucuncu: 'Dritte und vierte Rak‘a', son: 'Letztes Sitzen' },
  kural: 'Regel',
  kuralBaslik: 'Regeln für die Rak‘a',
  vakitTabloBaslik: 'Gebetszeiten und Zahl der Rak‘a',
  sutun: { vakit: 'Gebet', once: 'Vor dem Fard', farz: 'Fard', sonra: 'Nach dem Fard' },
  yok: 'keine',
  ayrinti: 'Seite des Gebets',
  vitirNot: 'Witr: nach der hanafitischen Rechtsschule.',
  vakitSayfaAciklama: 'Die Pflicht- und Sunna-Rak‘a des {ad}-Gebets, ihre Reihenfolge und der Aufbau der Rak‘a.',
  vakitSayfaLead: 'Lernen Sie die Rak‘a dieses Gebets, ihren Rang und den Ablauf des Fard Rak‘a für Rak‘a.',
  vakitAd: '{ad}-Gebet',
  birimler: { once: 'Vor dem Fard', farz: 'Fard', sonra: 'Nach dem Fard' },
  semaBaslik: 'Ablauf des Fard',
  semaMetin: 'Welche Schritte enthält jede Rak‘a des Fard?',
  rekatNo: 'Rak‘a {n}',
  sonOturusEtiketi: 'endet mit dem letzten Sitzen',
  ilkOturusEtiketi: 'endet mit dem ersten Sitzen',
  hatirlatma: 'Zur Erinnerung',
  digerVakitler: 'Andere Gebete',
};

function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (deger && typeof deger === 'object') return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, fransizca(v)])) as T;
  return deger;
}
const HAZIR: Record<Dil, IbadetMetinleri> = { tr: TR, fr: fransizca(FR), en: EN, nl: NL, de: DE };
export const ibadetMetinleri = (dil: Dil): IbadetMetinleri => HAZIR[dil];
export const doldur = (s: string, d: Readonly<Record<string, string | number>>): string => s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));
