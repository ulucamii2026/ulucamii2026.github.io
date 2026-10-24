/**
 * Bilgi maddesi sayfasının metinleri (24 Ekim 2026): kaynaklı sayılı liste, taslak/onay notları ve «Gizle ve söyle» ile «Sırala»
 * çalışma kipleri. Sıralama ve «Nasıl geçti?» metinleri sina.ts ile kip.ts'ten gelir; burada yalnız bilgi sayfasına özgü olanlar
 * durur. Tarayıcıda çizilen dizelerde (`m` içine giren) Fransız tipografisi derlemede middleware'den gelmez: boşlukları burada
 * yazarız (U+00A0 iki nokta ve tırnak içinde). Dinî metin değil, arayüz metnidir (dinî metin
 * src/data/ezber/bilgi/*.json'dadır). en/nl/de metinleri docs/DIL-NL-DE.md'ye göre yazılmıştır (nl «u», de «Sie»).
 */
import type { Dil } from '@ortak/i18n/ui';
import type { KaynakRolu } from '@ortak/lib/ezber/bilgi-metni';

export interface BilgiYazilari {
  aciklama: string; baslik: string; sayi: string;
  /** İki nokta: Fransızcada önünde bölünmez boşluk (middleware yalnız «boşluk + :» çiftini dönüştürür). */
  ik: string;
  onayBekliyor: string; taslakNotu: string; taslakRozet: string;
  kaynak: string; roller: Record<KaynakRolu, string>; sayfa: string; kunye: string; arapca: string;
  /** Hadisin Diyanet hadis yayınındaki çevirisi (yalnız Türkçe sayfada, kitabın cümlesinden farklıysa çizilir). */
  diyanet: string;
  /** Tarayıcıda çizilen (kip) metinler. */
  sekmeGizle: string; sekmeSirala: string; gizleYonerge: string;
  goster: string; gizle: string; maddeGoster: string; maddeGizle: string; hepsiniGoster: string; hepsiniGizle: string;
  gizliKalan: string; hepsiAcik: string; bolum: string;
}

const NB = '\u00a0';

export const BILGI: Record<Dil, BilgiYazilari> = {
  tr: {
    ik: ':',
    aciklama: 'Kaynaklı liste; metne bakmadan söylemeyi ve sıraya koymayı deneyin.', baslik: 'Liste', sayi: '{n} madde',
    onayBekliyor: 'Liste Diyanet kaynaklarından alınmıştır. Hoca incelemesi bekleniyor.',
    taslakNotu: '', taslakRozet: 'taslak',
    kaynak: 'Kaynak', roller: { metin: 'Metin', fr: 'Fransızca', ar: 'Arapça', dogrulama: 'Karşılaştırıldığı' }, sayfa: 's.', kunye: 'Künye', diyanet: 'Diyanet çevirisi', arapca: 'Arapça',
    sekmeGizle: 'Gizle ve söyle', sekmeSirala: 'Sırala', gizleYonerge: 'Önce maddeyi kendiniz söyleyin, sonra “Göster” ile kontrol edin.',
    goster: 'Göster', gizle: 'Gizle', maddeGoster: '{n}. maddeyi göster', maddeGizle: '{n}. maddeyi gizle', hepsiniGoster: 'Hepsini göster', hepsiniGizle: 'Hepsini gizle',
    gizliKalan: 'Gizli madde: {n}', hepsiAcik: 'Hepsi açık.', bolum: 'Bölüm',
  },
  fr: {
    ik: `${NB}:`,
    aciklama: 'Liste avec sources ; essayez de la dire de mémoire et de la remettre dans l’ordre.', baslik: 'Liste', sayi: `{n}${NB}éléments`,
    onayBekliyor: 'Liste reprise des sources de la Diyanet ; relecture par l’enseignant en attente.',
    taslakNotu: '', taslakRozet: 'à relire',
    kaynak: 'Sources', roller: { metin: 'Texte', fr: 'Français', ar: 'Arabe', dogrulama: 'Comparé avec' }, sayfa: 'p.', kunye: 'Référence', diyanet: 'Traduction de la Diyanet', arapca: 'Arabe',
    sekmeGizle: 'Cacher et dire', sekmeSirala: 'Remettre en ordre', gizleYonerge: `Dites d’abord l’élément à voix haute, puis vérifiez avec «${NB}Montrer${NB}».`,
    goster: 'Montrer', gizle: 'Cacher', maddeGoster: 'Montrer l’élément {n}', maddeGizle: 'Cacher l’élément {n}', hepsiniGoster: 'Tout montrer', hepsiniGizle: 'Tout cacher',
    gizliKalan: `Éléments cachés${NB}: {n}`, hepsiAcik: 'Tout est affiché.', bolum: 'Partie',
  },
  en: {
    ik: ':',
    aciklama: 'A list with sources; try saying it from memory and putting it in order.', baslik: 'List', sayi: '{n} items',
    onayBekliyor: 'List taken from Diyanet sources; teacher review pending.',
    taslakNotu: 'This English text is a draft translated from the Turkish and French sources. It is not official and will be reviewed by the teacher.', taslakRozet: 'draft',
    kaynak: 'Sources', roller: { metin: 'Text', fr: 'French', ar: 'Arabic', dogrulama: 'Compared with' }, sayfa: 'p.', kunye: 'Reference', diyanet: 'Diyanet translation', arapca: 'Arabic',
    sekmeGizle: 'Hide and say', sekmeSirala: 'Put in order', gizleYonerge: 'First say the item aloud, then check it with “Show”.',
    goster: 'Show', gizle: 'Hide', maddeGoster: 'Show item {n}', maddeGizle: 'Hide item {n}', hepsiniGoster: 'Show all', hepsiniGizle: 'Hide all',
    gizliKalan: 'Hidden items: {n}', hepsiAcik: 'Everything is showing.', bolum: 'Section',
  },
  nl: {
    ik: ':',
    aciklama: 'Een lijst met bronnen; probeer ze uit het hoofd te zeggen en in de juiste volgorde te zetten.', baslik: 'Lijst', sayi: '{n} onderdelen',
    onayBekliyor: 'Lijst overgenomen uit Diyanet-bronnen; nalezing door de leerkracht volgt.',
    taslakNotu: 'Deze Nederlandse tekst is een conceptvertaling van de Turkse en Franse bronnen. Hij is niet officieel en wordt nog nagelezen door de leerkracht.', taslakRozet: 'concept',
    kaynak: 'Bronnen', roller: { metin: 'Tekst', fr: 'Frans', ar: 'Arabisch', dogrulama: 'Vergeleken met' }, sayfa: 'p.', kunye: 'Bronvermelding', diyanet: 'Vertaling van de Diyanet', arapca: 'Arabisch',
    sekmeGizle: 'Verbergen en zeggen', sekmeSirala: 'In volgorde zetten', gizleYonerge: 'Zeg eerst het onderdeel hardop en controleer het daarna met “Tonen”.',
    goster: 'Tonen', gizle: 'Verbergen', maddeGoster: 'Onderdeel {n} tonen', maddeGizle: 'Onderdeel {n} verbergen', hepsiniGoster: 'Alles tonen', hepsiniGizle: 'Alles verbergen',
    gizliKalan: 'Verborgen onderdelen: {n}', hepsiAcik: 'Alles is zichtbaar.', bolum: 'Onderdeel',
  },
  de: {
    ik: ':',
    aciklama: 'Eine Liste mit Quellen; versuchen Sie, sie auswendig zu sagen und in die richtige Reihenfolge zu bringen.', baslik: 'Liste', sayi: '{n} Punkte',
    onayBekliyor: 'Liste aus Diyanet-Quellen übernommen; Durchsicht durch die Lehrkraft steht aus.',
    taslakNotu: 'Dieser deutsche Text ist ein Entwurf, übersetzt aus den türkischen und französischen Quellen. Er ist nicht amtlich und wird noch von der Lehrkraft geprüft.', taslakRozet: 'Entwurf',
    kaynak: 'Quellen', roller: { metin: 'Text', fr: 'Französisch', ar: 'Arabisch', dogrulama: 'Verglichen mit' }, sayfa: 'S.', kunye: 'Nachweis', diyanet: 'Übersetzung der Diyanet', arapca: 'Arabisch',
    sekmeGizle: 'Verdecken und sagen', sekmeSirala: 'Ordnen', gizleYonerge: 'Sagen Sie den Punkt zuerst laut und prüfen Sie ihn dann mit „Zeigen“.',
    goster: 'Zeigen', gizle: 'Verdecken', maddeGoster: 'Punkt {n} zeigen', maddeGizle: 'Punkt {n} verdecken', hepsiniGoster: 'Alle zeigen', hepsiniGizle: 'Alle verdecken',
    gizliKalan: 'Verdeckte Punkte: {n}', hepsiAcik: 'Alles ist sichtbar.', bolum: 'Abschnitt',
  },
};

export const bilgiYazilari = (dil: Dil): BilgiYazilari => BILGI[dil];
