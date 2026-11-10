// Bilgi Yarışması soru bankası üreticisi. Deponun kartlarından/ibadet verisinden okur, sorular.json yazar.
// Çalıştır: node scripts/yarisma-uret.mjs  (src/data/yarisma/sorular.json'u yeniden yazar; elle düzenlenmez).
import fs from 'fs';
import {W,kart,abdest,namaz,LANGS,t,konuOf,soruBul,bas,secenek,dogruSecenek,govde,cum,ilk,adimMetin,sayilarEsit,cumleler} from './yarisma-lib.mjs';

const items=[];
const sayac={quiz:0,siralama:0,gruplama:0,eslestirme:0,gizemli:0};
const KOD={quiz:'q',siralama:'s',gruplama:'g',eslestirme:'e',gizemli:'m'};
function ekle(format,o){sayac[format]++;const id=`yar-${KOD[format]}-${String(sayac[format]).padStart(3,'0')}`;items.push({id,format,...o});return id;}
const uyar=[];

// ---------- 1) QUIZ: kartların mini sorularından (metin birebir, kaynak: soru kimliği) ----------
const quizListe=`
si-001-2 si-002-1 si-004-2 si-005-1 si-005-2 si-007-1 si-012-1 si-012-2 si-013-1 si-014-2 si-017-1 si-020-2 si-021-1 si-022-1 si-023-2 si-028-1 si-029-1 si-030-1 si-034-2 si-038-2 si-040-2 si-042-1 si-041-1
ah-001-2 ah-003-1 ah-003-2 ah-004-1 ah-006-1 ah-010-2 ah-014-2 ah-015-1 ah-016-2 ah-018-2 ah-020-1 ah-027-2 ah-028-2 ah-030-2 ah-034-1 ah-040-1 ah-043-1 ah-002-2 ah-005-2 ah-014-1 ah-007-1
it-001-1 it-001-2 it-002-2 it-003-1 it-004-1 it-005-2 it-008-1 it-009-2 it-010-1 it-011-1 it-012-1 it-013-2 it-019-1 it-020-2 it-022-1 it-025-2 it-027-1 it-028-1 it-030-1 it-041-1 it-043-1
ib-001-1 ib-002-2 ib-003-1 ib-004-2 ib-005-1 ib-005-2 ib-006-1 ib-006-2 ib-007-1 ib-008-1 ib-008-2 ib-009-1 ib-010-1 ib-011-1 ib-011-2 ib-017-1 ib-023-2 ib-029-2 ib-030-1 ib-037-1 ib-041-2 ib-043-2
ku-030-2 ku-050-1 ku-051-2 ku-055-2 ku-081-1 ku-081-2
`.split(/\s+/).filter(Boolean);
const altKonuQ={'ib-002-2':'abdest','ib-003-1':'abdest','ib-005-1':'namaz','ib-005-2':'namaz','ib-008-1':'namaz','ib-011-2':'abdest','ib-037-1':'namaz','ib-043-2':'namaz','ib-017-1':'zekat','ib-029-2':'zekat','ib-009-1':'abdest','ib-010-1':'genel','ib-011-1':'namaz','ib-023-2':'oruc','ib-030-1':'oruc','ib-016-2':'oruc','ib-041-2':'bayram'};
const NEG=/değildir|değil\?|yanlıştır|nelerden biri değil/i;
for(const qid of quizListe){
  const {k,q}=soruBul(qid);
  const bozuk=q.siklar.some(s=>!s||!s.tr||LANGS.some(l=>!s[l]))||q.siklar.length<3;
  if(bozuk){uyar.push('quiz atlandı (seçenek eksik): '+qid);continue;}
  if(NEG.test(q.soru.tr)){uyar.push('quiz atlandı (olumsuz soru): '+qid);continue;}
  const o={topic:konuOf(k.id),level:k.basamak,kaynak:[k.id,qid],soru:{...q.soru},secenekler:q.siklar.map(s=>({...s})),dogru:q.dogru};
  if(altKonuQ[qid])o.altKonu=altKonuQ[qid];
  ekle('quiz',o);
}

// ---------- 2) SIRALAMA ----------
const AB={
 'ab-02':t('Niyet edip besmele çekmek','Faire l’intention et dire la basmala','Make the intention and say the basmala','De intentie maken en de basmala zeggen','Die Absicht fassen und die Basmala sprechen'),
 'ab-03':t('Elleri bileklere kadar yıkamak','Laver les mains jusqu’aux poignets','Wash the hands up to the wrists','De handen tot aan de polsen wassen','Die Hände bis zu den Handgelenken waschen'),
 'ab-04':t('Dişleri temizlemek','Nettoyer les dents','Clean the teeth','De tanden reinigen','Die Zähne reinigen'),
 'ab-05':t('Ağzı çalkalamak','Se rincer la bouche','Rinse the mouth','De mond spoelen','Den Mund ausspülen'),
 'ab-06':t('Buruna su çekmek','Aspirer de l’eau dans le nez','Sniff water into the nose','Water in de neus optrekken','Wasser in die Nase ziehen'),
 'ab-07':t('Yüzü yıkamak','Laver le visage','Wash the face','Het gezicht wassen','Das Gesicht waschen'),
 'ab-08':t('Kolları dirsekle birlikte yıkamak','Laver les bras, coudes compris','Wash the arms, including the elbows','De armen wassen, inclusief de ellebogen','Die Arme samt den Ellbogen waschen'),
 'ab-09':t('Başın dörtte birini meshetmek','Essuyer un quart de la tête','Wipe a quarter of the head','Een kwart van het hoofd afstrijken','Ein Viertel des Kopfes bestreichen'),
 'ab-10':t('Kulakları meshetmek','Essuyer les oreilles','Wipe the ears','De oren afstrijken','Die Ohren bestreichen'),
 'ab-11':t('Boynu meshetmek','Essuyer le cou','Wipe the neck','De nek afstrijken','Den Nacken bestreichen'),
 'ab-12':t('Ayakları topuklarla birlikte yıkamak','Laver les pieds, talons compris','Wash the feet, including the heels','De voeten wassen, inclusief de hielen','Die Füße samt den Fersen waschen'),
 'ab-13':t('Kelime-i şehâdet okumak','Réciter la profession de foi (chahada)','Recite the declaration of faith (shahadah)','De geloofsgetuigenis (sjahada) uitspreken','Das Glaubensbekenntnis (Schahada) sprechen'),
};
const abTur=id=>abdest.adimlar.find(a=>a.id===id).tur;
const nmLabel=id=>{const m=adimMetin(id).metin;if(id==='nm-14'){const o={};for(const l of LANGS)o[l]=bol1(m[l]).replace(/\s*\(.*$/,'').replace(/[.,]+$/,'');return o;}return ilk(m);};
import {bol} from './yarisma-lib.mjs';
function bol1(s){return bol(s)[0];}

const T_ABD=t('Abdestin sırası','L’ordre des ablutions','The order of the ablution','De volgorde van de wassing','Die Reihenfolge der Waschung');
ekle('siralama',{topic:'ibadet',altKonu:'abdest',level:1,kaynak:['ab-02','ab-03','ab-05','ab-06','ab-07'],baslik:t('Abdestin başlangıcı','Le début des ablutions','The start of the ablution','Het begin van de wassing','Der Beginn der Waschung'),ogeler:['ab-02','ab-03','ab-05','ab-06','ab-07'].map(i=>AB[i])});
ekle('siralama',{topic:'ibadet',altKonu:'abdest',level:2,kaynak:['ab-07','ab-08','ab-09','ab-12'],baslik:t('Abdestin farzları','Les obligations (fard) des ablutions','The obligations (fard) of the ablution','De verplichte (fard) delen van de wassing','Die Pflichtteile (Fard) der Waschung'),ogeler:['ab-07','ab-08','ab-09','ab-12'].map(i=>AB[i])});
ekle('siralama',{topic:'ibadet',altKonu:'abdest',level:3,kaynak:['ab-08','ab-09','ab-10','ab-11','ab-12','ab-13'],baslik:t('Abdestin sonu','La fin des ablutions','The end of the ablution','Het einde van de wassing','Das Ende der Waschung'),ogeler:['ab-08','ab-09','ab-10','ab-11','ab-12','ab-13'].map(i=>AB[i])});
ekle('siralama',{topic:'ibadet',altKonu:'namaz',level:2,kaynak:['nm-02','nm-03','nm-04','nm-06'],baslik:t('Namaza başlarken','Au début de la prière','At the start of the prayer','Aan het begin van het gebed','Zu Beginn des Gebets'),ogeler:['nm-02','nm-03','nm-04','nm-06'].map(nmLabel)});
ekle('siralama',{topic:'ibadet',altKonu:'namaz',level:2,kaynak:['nm-07','nm-09','nm-11'],baslik:t('Rükû ve secde','Rukû‘ et prosternation','Bowing and prostration','Roekoe‘ en prosternatie','Ruku‘ und Niederwerfung'),ogeler:['nm-07','nm-09','nm-11'].map(nmLabel)});
ekle('siralama',{topic:'ibadet',altKonu:'namaz',level:3,kaynak:['nm-12','nm-13','nm-14','nm-15','nm-16'],baslik:t('Son oturuş ve selâm','La dernière assise et le salut','The final sitting and the salam','De laatste zit en de groet','Das letzte Sitzen und der Gruß'),ogeler:['nm-12','nm-13','nm-14','nm-15','nm-16'].map(nmLabel)});
// beş vakit (vakitler tablosu)
ekle('siralama',{topic:'ibadet',altKonu:'namaz',level:1,kaynak:namaz.vakitler.map(v=>'namaz:vakit:'+v.id),baslik:t('Beş vakit namaz','Les cinq prières quotidiennes','The five daily prayers','De vijf dagelijkse gebeden','Die fünf täglichen Gebete'),ogeler:namaz.vakitler.map(v=>({...v.ad}))});
// siyer zinciri: si-043-1 doğru şıkkı " – " ile bölünür
{const o=dogruSecenek('si-043-1');const parts={};for(const l of LANGS)parts[l]=o[l].split(' – ');const n=parts.tr.length;if(LANGS.some(l=>parts[l].length!==n))throw new Error('si-043-1 bölünemedi');
 ekle('siralama',{topic:'siyer',level:2,kaynak:['si-043','si-043-1'],baslik:t('Peygamberimizin hayatından olaylar','Événements de la vie du Prophète','Events from the life of the Prophet','Gebeurtenissen uit het leven van de Profeet','Ereignisse aus dem Leben des Propheten'),ogeler:Array.from({length:n},(_,i)=>{const x={};for(const l of LANGS)x[l]=parts[l][i];return x;})});}
// siyer: kart cümleleri (zaman belirteci olan, eşit cümle sayılı kartlar)
for(const [cid,lvl] of [['si-002',1],['si-012',2],['si-013',2],['si-017',2],['si-020',2],['si-029',1]]){
  const n=sayilarEsit(cid);if(n<3)throw new Error('cümle '+cid);
  ekle('siralama',{topic:'siyer',level:lvl,kaynak:[cid],baslik:bas(cid),ogeler:Array.from({length:n},(_,i)=>cum(cid,i)),not:'ogeler kartın cümle sırasıdır; istemci karıştırır'});
}

// ---------- 3) GRUPLAMA (iki gruba ayır) ----------
const FARZ=abdest.terimler.farz,SUN=abdest.terimler.sunnet;
const grup=(ad0,ad1,liste)=>({gruplar:[ad0,ad1],ogeler:liste.map(([m,g])=>({metin:m,grup:g}))});
// abdest: farz / sünnet (tür alanı depodan okunur, elle yazılmaz)
const T_ABD2=t('Abdest: farz mı, sünnet mi?','Les ablutions : obligatoire (fard) ou sunna ?','The ablution: obligatory (fard) or sunnah?','De wassing: verplicht (fard) of sunna?','Die Waschung: Pflicht (Fard) oder Sunna?');
function abdestSet(ids,lvl,bas_){
  const liste=ids.map(i=>{const tur=abTur(i);if(!['farz','sunnet'].includes(tur))throw new Error('tür '+i+' '+tur);return [AB[i],tur==='farz'?0:1];});
  ekle('gruplama',{topic:'ibadet',altKonu:'abdest',level:lvl,kaynak:ids,baslik:bas_,...grup(FARZ,SUN,liste)});
}
abdestSet(['ab-07','ab-08','ab-09','ab-12','ab-03','ab-05','ab-06','ab-10'],2,T_ABD2);
abdestSet(['ab-07','ab-08','ab-12','ab-11','ab-04','ab-02'],2,T_ABD2);
abdestSet(['ab-09','ab-07','ab-03','ab-05','ab-06','ab-11'],1,T_ABD2);
// namaz: farz / sünnet ve farz / vâcip (hüküm alanı depodan okunur)
const nmTur=id=>namaz.adimlar.find(a=>a.id===id).tur;
function namazSet(ids,turA,turB,gA,gB,lvl,bas_){
  const liste=ids.map(i=>{const tur=nmTur(i);if(tur!==turA&&tur!==turB)throw new Error('tür '+i+' '+tur);return [nmLabel(i),tur===turA?0:1];});
  ekle('gruplama',{topic:'ibadet',altKonu:'namaz',level:lvl,kaynak:ids,baslik:bas_,...grup(gA,gB,liste)});
}
namazSet(['nm-02','nm-07','nm-09','nm-03','nm-04','nm-13'],'farz','sunnet',namaz.terimler.farz,namaz.terimler.sunnet,3,t('Namazın bölümleri','Les parties de la prière','The parts of the prayer','De onderdelen van het gebed','Die Teile des Gebets'));
namazSet(['nm-01','nm-07','nm-09','nm-06','nm-15','nm-16'],'farz','vacip',namaz.terimler.farz,namaz.terimler.vacip,3,t('Namazın bölümleri','Les parties de la prière','The parts of the prayer','De onderdelen van het gebed','Die Teile des Gebets'));
// vakitler: farzı 4 rekât olanlar / olmayanlar
{const ad=id=>({...namaz.vakitler.find(v=>v.id===id).ad});
 ekle('gruplama',{topic:'ibadet',altKonu:'namaz',level:2,kaynak:['ogle','ikindi','yatsi','sabah','aksam'].map(i=>'namaz:vakit:'+i),baslik:t('Farz namazların rekât sayısı','Le nombre d’unités (rak‘a) des prières obligatoires','The number of rak‘as in the obligatory prayers','Het aantal rak‘as van de verplichte gebeden','Die Zahl der Rak‘as der Pflichtgebete'),
  ...grup(t('Farzı 4 rekât','4 rak‘as obligatoires','4 obligatory rak‘as','4 verplichte rak‘as','4 Pflicht-Rak‘as'),t('Farzı 2 veya 3 rekât','2 ou 3 rak‘as obligatoires','2 or 3 obligatory rak‘as','2 of 3 verplichte rak‘as','2 oder 3 Pflicht-Rak‘as'),[[ad('ogle'),0],[ad('ikindi'),0],[ad('yatsi'),0],[ad('sabah'),1],[ad('aksam'),1]])});}
// itikat: İslâm'ın şartları / imanın şartları (şıklardan)
{const G0=bas('ib-001'),G1=t('İmanın şartları','Les articles de la foi','The articles of faith','De geloofsartikelen','Die Glaubensartikel');
 ekle('gruplama',{topic:'itikat',level:1,kaynak:['ib-001','it-004','ib-001-2','ib-031-2','it-004-2','it-044-1'],baslik:t('İslâm mı, iman mı?','Islam ou foi ?','Islam or faith?','Islam of geloof?','Islam oder Glaube?'),
  ...grup(G0,G1,[[secenek('ib-001-2',1),0],[secenek('ib-001-2',2),0],[secenek('ib-001-2',3),0],[secenek('ib-031-2',2),0],[secenek('it-004-2',0),1],[secenek('it-004-2',1),1],[secenek('it-044-1',1),1],[secenek('it-044-1',2),1]])});}
// ahlak: güzel davranış / kaçınılacak davranış (şıklardan; bağımsız anlaşılan şıklar)
{const A=t('Güzel davranış','Bonne conduite','Good conduct','Goed gedrag','Gutes Verhalten'),B=t('Yapmamamız gereken','À ne pas faire','What we should not do','Wat we niet moeten doen','Was wir nicht tun sollen');
 ekle('gruplama',{topic:'ahlak',level:1,kaynak:['ah-037-1','ah-015-1','ah-038-2'],baslik:t('Davranışlarımız','Notre comportement','Our behaviour','Ons gedrag','Unser Verhalten'),
  ...grup(A,B,[[secenek('ah-037-1',0),0],[secenek('ah-015-1',1),0],[secenek('ah-038-2',0),0],[secenek('ah-037-1',1),1],[secenek('ah-037-1',2),1],[secenek('ah-015-1',0),1],[secenek('ah-015-1',2),1]])});}
// siyer: hicretten önce / sonra
{const S={
  vahiy:t('İlk vahiy (Hira Mağarası)','La première révélation (grotte de Hira)','The first revelation (cave of Hira)','De eerste openbaring (grot van Hira)','Die erste Offenbarung (Höhle Hira)'),
  huzun:t('Hüzün Yılı','L’année de la tristesse','The Year of Sorrow','Het Jaar van Verdriet','Das Jahr der Trauer'),
  akabe:t('Akabe biatları','Les serments d’Aqaba','The Pledges of Aqaba','De eden van Aqaba','Die Eide von Akaba'),
  ezan:t('İlk ezan','Le premier appel à la prière','The first call to prayer','De eerste adhan','Der erste Gebetsruf'),
  mescid:t('Mescid-i Nebevî’nin yapılması','La construction de la Mosquée du Prophète','The building of the Prophet’s Mosque','De bouw van de Moskee van de Profeet','Der Bau der Prophetenmoschee'),
  hudeybiye:t('Hudeybiye Antlaşması','Le traité de Hudaybiya','The Treaty of Hudaybiyah','Het verdrag van Hudaybiya','Der Vertrag von Hudaibiya'),
  veda:t('Veda Hutbesi','Le sermon d’adieu','The Farewell Sermon','De afscheidspreek','Die Abschiedspredigt')};
 const A=t('Hicretten önce','Avant l’hégire','Before the Hijrah','Vóór de hidjra','Vor der Hidschra'),B=t('Hicretten sonra','Après l’hégire','After the Hijrah','Na de hidjra','Nach der Hidschra');
 ekle('gruplama',{topic:'siyer',level:2,kaynak:['si-004','si-016','si-017','si-018','si-021','si-023','si-028','si-029'],baslik:t('Peygamberimizin hayatı','La vie du Prophète','The life of the Prophet','Het leven van de Profeet','Das Leben des Propheten'),
  ...grup(A,B,[[S.vahiy,0],[S.huzun,0],[S.akabe,0],[S.ezan,1],[bas('si-028'),1],[bas('si-029'),1]])});
 ekle('gruplama',{topic:'siyer',level:3,kaynak:['si-004','si-016','si-017','si-018','si-021','si-034','si-035','si-029'],baslik:t('Peygamberimizin hayatı','La vie du Prophète','The life of the Prophet','Het leven van de Profeet','Das Leben des Propheten'),
  ...grup(A,B,[[S.vahiy,0],[S.huzun,0],[S.akabe,0],[S.mescid,1],[S.hudeybiye,1],[S.veda,1]])});}
// bayramlar
{const R=t('Ramazan Bayramı','L’Aïd al-Fitr (fin du Ramadan)','Eid al-Fitr (end of Ramadan)','Het Suikerfeest (einde van de ramadan)','Das Fest des Fastenbrechens (Ende des Ramadan)'),K=t('Kurban Bayramı','L’Aïd al-Adha (fête du sacrifice)','Eid al-Adha (festival of sacrifice)','Het Offerfeest','Das Opferfest');
 ekle('gruplama',{topic:'ibadet',altKonu:'bayram',level:1,kaynak:['ah-011','ah-008-1','ah-011-1','ib-029','ib-041'],baslik:t('Bayramlarımız','Nos fêtes','Our festivals','Onze feesten','Unsere Feste'),
  ...grup(R,K,[[t('Şevval’in ilk günü','Le premier jour de Shawwâl','The first day of Shawwal','De eerste dag van sjawwal','Der erste Tag von Schawwal'),0],[t('Fitre vermek','Donner la zakât al-fitr','Giving the fitr charity','De fitr-aalmoes geven','Die Fitr-Spende geben'),0],[t('Zilhicce’nin onuncu günü','Le dixième jour de Dhou al-hijja','The tenth day of Dhul-Hijjah','De tiende dag van Dhoe al-hidjdja','Der zehnte Tag von Dhul-Hiddscha'),1],[t('Kurban kesmek','Sacrifier un animal','Offering the sacrifice','Het offer brengen','Das Opfer darbringen'),1]])});}

// ---------- 4) ESLESTIRME ----------
function qaSet(qids,lvl,bas_,topic,alt){
  const ciftler=qids.map(q=>({sol:govde(q),sag:dogruSecenek(q)}));
  const o={topic,level:lvl,kaynak:[...new Set(qids.flatMap(q=>[q.replace(/-\d+$/,''),q]))],baslik:bas_,ciftler};if(alt)o.altKonu=alt;ekle('eslestirme',o);
}
qaSet(['si-001-1','si-004-1','si-020-1','si-023-1'],1,t('Peygamberimizin hayatı','La vie du Prophète','The life of the Prophet','Het leven van de Profeet','Das Leben des Propheten'),'siyer');
qaSet(['si-019-1','si-021-2','si-032-2','si-033-1'],2,t('Peygamberimizin hayatı','La vie du Prophète','The life of the Prophet','Het leven van de Profeet','Das Leben des Propheten'),'siyer');
qaSet(['si-016-1','si-035-1','si-013-2','si-024-1'],2,t('Peygamberimizin hayatı','La vie du Prophète','The life of the Prophet','Het leven van de Profeet','Das Leben des Propheten'),'siyer');
qaSet(['it-008-2','it-014-1','it-015-1','it-040-2'],1,t('Melekler','Les anges','The angels','De engelen','Die Engel'),'itikat');
qaSet(['it-016-1','it-016-2','it-021-1','ib-001-1'],1,t('Sayılar','Les nombres','Numbers','Getallen','Zahlen'),'itikat');
qaSet(['it-003-2','it-029-2','it-020-1','it-038-2'],2,t('Allah’ın isimleri ve peygamberlerin sıfatları','Les noms d’Allah et les qualités des prophètes','The names of Allah and the qualities of the prophets','De namen van Allah en de eigenschappen van de profeten','Die Namen Allahs und die Eigenschaften der Propheten'),'itikat');
qaSet(['it-005-1','it-007-1','it-023-2','it-018-2'],2,t('Kavramlar','Notions','Terms','Begrippen','Begriffe'),'itikat');
qaSet(['ib-020-1','ib-020-2','ib-019-1','ib-019-2'],2,t('Hac','Le hajj','The hajj','De hadj','Die Hadsch'),'ibadet','hac');
qaSet(['ib-002-1','ib-034-1','ib-034-2','ib-015-1'],2,t('Abdest','Les ablutions','The ablution','De wassing','Die Waschung'),'ibadet','abdest');
qaSet(['ib-028-1','ib-024-1','ib-026-1','ib-028-2'],2,t('Oruç ve Ramazan','Le jeûne et le Ramadan','Fasting and Ramadan','Vasten en ramadan','Fasten und Ramadan'),'ibadet','oruc');
qaSet(['ah-011-1','ah-008-1','ah-019-1','ah-019-2'],1,t('Bayramlar ve Hicrî takvim','Les fêtes et le calendrier de l’hégire','The festivals and the Hijri calendar','De feesten en de hidjri-kalender','Die Feste und der Hidschri-Kalender'),'ahlak');
qaSet(['ah-001-1','ah-013-1','ah-036-1','ah-012-1'],1,t('Güzel ahlâk','Le beau caractère','Good character','Goed karakter','Guter Charakter'),'ahlak');
qaSet(['ah-021-1','ah-031-1','ah-022-1','ah-004-2'],2,t('Güzel ahlâk','Le beau caractère','Good character','Goed karakter','Guter Charakter'),'ahlak');
qaSet(['ku-044-1','ku-030-2','ku-048-2','ku-047-1'],3,t('Tecvid','Le tajwîd','Tajwid','Tadjwied','Tadschwid'),'kuran');
// elle kurulan iki küme (it-006 kart metnindeki yazımlar; namaz tablosu)
ekle('eslestirme',{topic:'itikat',level:1,kaynak:['it-006'],baslik:bas('it-006'),ciftler:[
  {sol:t('Tevrat','la Torah','the Torah','de Thora','die Tora'),sag:t('Hz. Musa','Moïse','Moses','Mozes','Moses')},
  {sol:t('Zebur','les Psaumes','the Psalms','de Psalmen','die Psalmen'),sag:t('Hz. Davud','David','David','David','David')},
  {sol:t('İncil','l’Évangile','the Gospel','het Evangelie','das Evangelium'),sag:t('Hz. İsa','Jésus','Jesus','Jezus','Jesus')},
  {sol:t('Kur’an','le Coran','the Qur’an','de Koran','der Koran'),sag:t('Hz. Muhammed','Muhammad','Muhammad','Mohammed','Muhammad')}]});
{const ad=id=>({...namaz.vakitler.find(v=>v.id===id).ad});const n=x=>t(String(x),String(x),String(x),String(x),String(x));
 ekle('eslestirme',{topic:'ibadet',altKonu:'namaz',level:1,kaynak:['sabah','aksam','ogle'].map(i=>'namaz:vakit:'+i),baslik:t('Farz rekât sayıları','Le nombre d’unités obligatoires','The number of obligatory rak‘as','Het aantal verplichte rak‘as','Die Zahl der Pflicht-Rak‘as'),
  ciftler:[{sol:ad('sabah'),sag:n(namaz.vakitler.find(v=>v.id==='sabah').farz)},{sol:ad('aksam'),sag:n(namaz.vakitler.find(v=>v.id==='aksam').farz)},{sol:ad('ogle'),sag:n(namaz.vakitler.find(v=>v.id==='ogle').farz)}]});}

// ---------- 5) GIZEMLI KUTU ----------
const gizem=[ // [cevap kartı, [yanlış kartlar]]
 ['si-029',['si-017','si-033','si-021']],['si-017',['si-029','si-039','si-021']],['si-033',['si-036','si-019','si-029']],['si-039',['si-017','si-033','si-029']],['si-025',['si-039','si-021','si-017']],['si-021',['si-029','si-017','si-033']],['si-002',['si-017','si-029','si-033']],
 ['it-027',['it-041','it-006','it-008']],['it-041',['it-027','it-006','it-009']],['it-006',['it-010','it-041','it-027']],['it-008',['it-006','it-010','it-009']],['it-010',['it-008','it-006','it-009']],['it-030',['it-006','it-010','it-008']],['it-028',['it-006','it-009','it-010']],
 ['ah-019',['ah-014','ah-003','ah-006']],['ah-003',['ah-019','ah-027','ah-014']],['ah-014',['ah-019','ah-003','ah-006']],['ah-006',['ah-019','ah-003','ah-027']],['ah-027',['ah-014','ah-019','ah-006']],
 ['ib-019',['ib-017','ib-033','ib-016']],['ib-017',['ib-019','ib-033','ib-028']],['ib-033',['ib-019','ib-017','ib-016']],['ib-016',['ib-019','ib-017','ib-033']],['ib-028',['ib-019','ib-033','ib-017']]];
const LIM={'si-025':3,'ah-027':3}; // son cümlesi sınıf etkinliği olan kartlar
for(const [cid,yanlis] of gizem){
  const n=sayilarEsit(cid);if(n<3)throw new Error('gizemli cümle '+cid+' '+n);
  const secs0=[bas(cid),...yanlis.map(bas)];const poz=sayac.gizemli%4;const secs=secs0.slice(1);secs.splice(poz,0,secs0[0]);
  const ipuclari=Array.from({length:Math.min(n,LIM[cid]||4)},(_,i)=>cum(cid,i));
  const o={topic:konuOf(cid),level:kart[cid].basamak,kaynak:[cid,...yanlis],baslik:t('Gizemli kutu: hangi konu?','Boîte mystère : quel sujet ?','Mystery box: which topic?','Mysterieuze doos: welk onderwerp?','Geheimnisbox: welches Thema?'),ipuclari,secenekler:secs,dogru:poz};
  if(cid.startsWith('ib-'))o.altKonu={ 'ib-019':'hac','ib-017':'zekat','ib-033':'abdest','ib-016':'genel','ib-028':'oruc'}[cid];
  ekle('gizemli',o);
}

// çıktıyı doğru şıkkı rastgele konuma taşımadan yaz (istemci karıştırır)
fs.writeFileSync(W+'src/data/yarisma/sorular.json',JSON.stringify({surum:1,tarih:'2026-11-10',durum:'onayli',not:'Bütün metinler depodaki kartlardan ve src/data/ibadet verisinden türetilmiştir; yeni dinî bilgi yoktur. İstemci seçenekleri/öğeleri tohumlu karıştırır.',diller:LANGS,biçimler:Object.keys(sayac),sorular:items},null,1).replaceAll('Islam’ın','İslam’ın'));
console.log(JSON.stringify(sayac),'toplam',items.length);
if(uyar.length)console.log('UYARI:\n'+uyar.join('\n'));
