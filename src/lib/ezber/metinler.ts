/**
 * Ezber Kilimi — ekran metinleri (27 Eylül 2026, Faz 1c). Basamak adları, kalitenin hoca etiketi ve veliye giden
 * yumuşak karşılığı, veliye giden kalıp notları ve defter cümlesi. Veliye giden her metin beş dilde (tr, fr, en, nl,
 * de); öğrenci adı hiçbir kalıba girmez (kayıtta cinsiyet de yok: cümleler cinsiyetsiz kurulur). Fransızca terimler
 * veli portalıyla aynı: «l’enseignant», «mémorisation». Kurallar: docs/EZBER-KILIMI.md.
 */
import type { Dil } from '../../i18n/ui';
import { KATALOG, ezberBul, type BesDil } from './katalog';
import { KALITELER, type Basamak, type Kalite } from './durum';

export const BASAMAK_ADLARI: Readonly<Record<Basamak, BesDil>> = Object.freeze({
  0: { tr: 'Başlanmadı', fr: 'Pas encore commencé', en: 'Not started yet', nl: 'Nog niet begonnen', de: 'Noch nicht begonnen' },
  1: { tr: 'Çalışıyor', fr: 'En apprentissage', en: 'Learning', nl: 'Aan het leren', de: 'Wird gelernt' },
  2: { tr: 'Hocaya okudu', fr: 'Récité à l’enseignant', en: 'Recited to the teacher', nl: 'Opgezegd bij de leraar', de: 'Beim Lehrer vorgetragen' },
  3: { tr: 'Pekişti', fr: 'Consolidé', en: 'Consolidated', nl: 'Verstevigd', de: 'Gefestigt' },
  4: { tr: 'Kalıcı', fr: 'Acquis durablement', en: 'Firmly memorised', nl: 'Blijvend gekend', de: 'Dauerhaft gelernt' },
});

/** Hoca ekranındaki üç büyük düğme. */
export const KALITE_ETIKETI: Readonly<Record<Kalite, string>> = Object.freeze({ tam: 'Tam', az: 'Az hatalı', tekrar: 'Tekrar gelsin' });

/** Veliye giden yumuşak karşılık (karar: «Çok güzel okudu», «Küçük düzeltmelerle geçti», «Bir kez daha çalışalım»). */
export const KALITE_VELI: Readonly<Record<Kalite, BesDil>> = Object.freeze({
  tam: { tr: 'Çok güzel okudu', fr: 'Très bien récité', en: 'Recited very well', nl: 'Heel mooi opgezegd', de: 'Sehr schön vorgetragen' },
  az: { tr: 'Küçük düzeltmelerle geçti', fr: 'Réussi avec de petites corrections', en: 'Passed with small corrections', nl: 'Geslaagd met kleine verbeteringen', de: 'Mit kleinen Korrekturen bestanden' },
  tekrar: { tr: 'Bir kez daha çalışalım', fr: 'Travaillons-le encore une fois', en: 'Let’s practise it once more', nl: 'Laten we het nog één keer oefenen', de: 'Üben wir es noch einmal' },
});

export interface NotKalibi {
  /** Firestore'a giden anahtar (kural: `^[a-z0-9-]{1,40}$`). Bir kez yayına girince anlamı değişmez. */
  readonly anahtar: string;
  /** Hoca ekranındaki kısa çip adı. */
  readonly etiket: string;
  /** Veliye giden cümle. */
  readonly metin: BesDil;
}

/** Veliye giden kalıp notları: kısa, yumuşak, uygulanabilir; ad ve cinsiyet yok. Sıra = ekrandaki sıra. */
export const NOT_KALIPLARI: readonly NotKalibi[] = Object.freeze([
  { anahtar: 'akici', etiket: 'Akıcı', metin: {
    tr: 'Akıcı ve güzel bir okuyuştu.', fr: 'Une récitation fluide et belle.', en: 'A fluent, beautiful recitation.',
    nl: 'Een vlotte, mooie recitatie.', de: 'Ein flüssiger, schöner Vortrag.' } },
  { anahtar: 'mahrec', etiket: 'Mahreç', metin: {
    tr: 'Harfleri yerinden çıkarmaya biraz daha özen gösterelim.', fr: 'Soignons encore un peu la prononciation des lettres (makhraj).',
    en: 'Let’s take a little more care with how the letters are pronounced (makhraj).', nl: 'Laten we nog wat beter letten op de uitspraak van de letters (makhraj).',
    de: 'Achten wir noch etwas mehr auf die Aussprache der Buchstaben (Machradsch).' } },
  { anahtar: 'med', etiket: 'Med', metin: {
    tr: 'Uzatmalara (med) dikkat edelim.', fr: 'Faisons attention aux allongements (madd).', en: 'Let’s pay attention to the elongations (madd).',
    nl: 'Laten we letten op de verlengingen (madd).', de: 'Achten wir auf die Dehnungen (Madd).' } },
  { anahtar: 'sira', etiket: 'Sıra', metin: {
    tr: 'Sırayı evde birlikte tekrar edelim.', fr: 'Révisons ensemble l’enchaînement à la maison.', en: 'Let’s go over the order together at home.',
    nl: 'Laten we thuis samen de volgorde herhalen.', de: 'Wiederholen wir die Reihenfolge gemeinsam zu Hause.' } },
  { anahtar: 'son-kisim', etiket: 'Son kısım', metin: {
    tr: 'Başı çok iyi; son kısmını birlikte pekiştirelim.', fr: 'Le début est très bien ; consolidons ensemble la fin.',
    en: 'The beginning is very good; let’s strengthen the ending together.', nl: 'Het begin is heel goed; laten we samen het einde verstevigen.',
    de: 'Der Anfang ist sehr gut; festigen wir gemeinsam das Ende.' } },
  { anahtar: 'dinleyerek', etiket: 'Dinleyerek', metin: {
    tr: 'Evde kaydı dinleyerek birkaç kez tekrar etmek çok yardımcı olur.', fr: 'À la maison, répéter quelques fois en écoutant l’enregistrement aide beaucoup.',
    en: 'At home, repeating it a few times while listening to the recording helps a lot.', nl: 'Thuis een paar keer herhalen terwijl je naar de opname luistert, helpt veel.',
    de: 'Zu Hause ein paar Mal wiederholen und dabei die Aufnahme hören, hilft sehr.' } },
  { anahtar: 'anlam', etiket: 'Anlamı', metin: {
    tr: 'Anlamını birlikte konuşursanız daha kolay kalır.', fr: 'En parler ensemble du sens aide à mieux retenir.',
    en: 'Talking about the meaning together helps it stay.', nl: 'Samen over de betekenis praten helpt om het te onthouden.',
    de: 'Gemeinsam über die Bedeutung zu sprechen hilft beim Behalten.' } },
  { anahtar: 'gayret', etiket: 'Gayret', metin: {
    tr: 'Gayreti için teşekkür ederiz.', fr: 'Merci pour les efforts fournis.', en: 'Thank you for the effort.',
    nl: 'Bedankt voor de inzet.', de: 'Danke für den Einsatz.' } },
] satisfies NotKalibi[]);

const notDizini = new Map(NOT_KALIPLARI.map((n) => [n.anahtar, n]));
/** Bilinmeyen (eski ya da kaldırılmış) anahtar gösterilmez. */
export function notMetni(anahtar: string, dil: Dil): string | null {
  return notDizini.get(anahtar)?.metin[dil] ?? null;
}
export function notKalibi(anahtar: string): NotKalibi | undefined {
  return notDizini.get(anahtar);
}

/**
 * Defter bağlantısı: «Ezber dinlendi» çipiyle deftere eklenen cümle ve Fransızcası. Cümle katalog adından kurulur;
 * Fransızca aileye bülten çevirisi bu sözlükten gelir (makineye gitmez).
 */
export function defterCumlesi(id: string, kalite: Kalite): { tr: string; fr: string } {
  const o = ezberBul(id);
  if (!o) throw new Error(`Katalogda olmayan ezber kimliği: ${String(id)}.`);
  if (!KALITELER.includes(kalite)) throw new Error(`Geçersiz kalite: ${String(kalite)}.`);
  return {
    tr: `Ezber — ${o.ad.tr}: ${KALITE_VELI[kalite].tr.toLocaleLowerCase('tr')}.`,
    fr: `Mémorisation — ${o.ad.fr} : ${KALITE_VELI[kalite].fr.charAt(0).toLocaleLowerCase('fr')}${KALITE_VELI[kalite].fr.slice(1)}.`,
  };
}

/** Bütün defter cümleleri (katalog × kalite), Türkçe → Fransızca: defter çevirisinin kalıp sözlüğüne girer. */
export function defterSozlugu(): Record<string, string> {
  const s: Record<string, string> = {};
  for (const o of KATALOG.ogeler)
    for (const k of KALITELER) {
      const c = defterCumlesi(o.id, k);
      s[c.tr] = c.fr;
    }
  return s;
}

