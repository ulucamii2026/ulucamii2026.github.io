/** Ortak haftalık çalışma: hoca formu ve veli önizlemesi aynı kayıt sözleşmesini kullanır. */
export type OdevDil = 'tr' | 'fr' | 'en';
export type OdevMetin = Record<OdevDil, string>;
export type OdevPlanGunu = { tarih: string; hafta: number; dersler: { konu: string; kod: string; ezber: string[] }[] };
export type OdevHaftasi = { hafta: number; tarih: string; gunler: OdevPlanGunu[] };
export type HaftalikOdev = { tarih: string; hafta: number; ezber: OdevMetin; odev: OdevMetin; etkinlikler: string[]; materyal: string; yayin: boolean; guncelleme?: string };
export const ODEV_DILLERI: OdevDil[] = ['tr', 'fr', 'en'];
export const bosOdevMetni = (): OdevMetin => ({ tr: '', fr: '', en: '' });
/** Veli portalındaki mevcut dil yedeği: istenen dil → Fransızca → Türkçe. */
export const odevMetni = (metin: Partial<OdevMetin> | undefined, dil: OdevDil) => metin?.[dil] || metin?.fr || metin?.tr || '';
export function odevHaftalari(gunler: OdevPlanGunu[]): OdevHaftasi[] {
  const sirali = [...gunler].filter(g => g.dersler.length).sort((a, b) => a.tarih.localeCompare(b.tarih));
  return [...new Set(sirali.map(g => g.hafta))].map(hafta => {
    const gunler = sirali.filter(g => g.hafta === hafta);
    return { hafta, tarih: gunler[0].tarih, gunler };
  });
}
export const planEzberleri = (hafta: OdevHaftasi) => [...new Set(hafta.gunler.flatMap(g => g.dersler.flatMap(d => d.ezber)).filter(Boolean))];
export function odevTaslagi(hafta: OdevHaftasi, mevcut?: Partial<HaftalikOdev>, materyal = ''): HaftalikOdev {
  return {
    tarih: hafta.tarih, hafta: hafta.hafta,
    ezber: { ...bosOdevMetni(), tr: planEzberleri(hafta).join('\n'), ...mevcut?.ezber },
    odev: { ...bosOdevMetni(), ...mevcut?.odev },
    etkinlikler: [...(mevcut?.etkinlikler || [])], materyal: mevcut?.materyal ?? materyal,
    yayin: mevcut?.yayin === true, guncelleme: mevcut?.guncelleme,
  };
}
export const ODEV_KALIPLARI: { id: string; ad: string; metin: OdevMetin; yok?: boolean }[] = [
  { id: 'tekrar', ad: 'Konuyu birlikte tekrar', metin: { tr: 'Bu hafta işlediğimiz konuları evde birlikte tekrar edin.', fr: 'Revoyez ensemble à la maison les sujets travaillés cette semaine.', en: 'Review this week’s topics together at home.' } },
  { id: 'okuma', ad: 'Kısa okuma çalışması', metin: { tr: 'Hocanın verdiği bölümü kısa tekrarlarla okuyun; zorlandığınız yeri sonraki derste sorun.', fr: 'Relisez le passage donné par l’enseignant en courtes séances ; posez vos questions au prochain cours.', en: 'Read the passage assigned by the teacher in short sessions; ask about difficult parts next lesson.' } },
  { id: 'ezber', ad: 'Ezberi pekiştirme', metin: { tr: 'Verilen ezberi veli portalındaki kayıtla dinleyip tekrar edin; sonraki derste hocaya dinletin.', fr: 'Écoutez et répétez la mémorisation demandée avec l’enregistrement du portail des parents ; récitez-la à l’enseignant au prochain cours.', en: 'Listen to and repeat the assigned memorisation using the parent portal recording; recite it to the teacher next lesson.' } },
  { id: 'anlat', ad: 'Öğrendiğini anlatsın', metin: { tr: 'Çocuğunuzdan öğrendiği bir konuyu kendi sözleriyle anlatmasını isteyin.', fr: 'Invitez votre enfant à expliquer un sujet appris avec ses propres mots.', en: 'Ask your child to explain one topic they learned in their own words.' } },
  { id: 'canta', ad: 'Ders çantasını hazırlama', metin: { tr: 'Bir sonraki ders için kitabını, defterini ve kalemini birlikte hazırlayın.', fr: 'Préparez ensemble le livre, le cahier et le crayon pour le prochain cours.', en: 'Prepare the book, notebook and pencil together for the next lesson.' } },
  { id: 'yok', ad: 'Bu hafta ödev yok', yok: true, metin: { tr: 'Bu hafta için ek ödev yok.', fr: 'Pas de devoir supplémentaire cette semaine.', en: 'No additional homework this week.' } },
];
/** Yalnız tanımlı cümleler değişir; hocanın diğer metni ve çevirileri korunur. */
export function odevKalibiSec(metin: OdevMetin, id: string): OdevMetin {
  const k = ODEV_KALIPLARI.find(x => x.id === id);
  if (!k) return metin;
  const kaldir = metin.tr.includes(k.metin.tr);
  return Object.fromEntries(ODEV_DILLERI.map(dil => {
    let s = metin[dil];
    const cikar = kaldir ? [k] : ODEV_KALIPLARI.filter(x => k.yok || x.yok);
    for (const x of cikar) s = s.split(x.metin[dil]).join('').replace(/ {2,}/g, ' ').trim();
    if (!kaldir && !s.includes(k.metin[dil])) s = [s, k.metin[dil]].filter(Boolean).join('\n');
    return [dil, s];
  })) as OdevMetin;
}
export function odevHatasi(k: HaftalikOdev, etkinlikKimlikleri: string[]): string {
  if (ODEV_DILLERI.some(d => k.ezber[d].length > 1000 || k.odev[d].length > 1000)) return 'Ezber ve ödev alanları en fazla 1000 karakter olabilir.';
  if (k.etkinlikler.length > 3 || new Set(k.etkinlikler).size !== k.etkinlikler.length || k.etkinlikler.some(id => !etkinlikKimlikleri.includes(id))) return 'En fazla üç farklı etkinlik seçin.';
  if (k.materyal && !/^https?:\/\//i.test(k.materyal)) return 'Materyal bağlantısı http:// veya https:// ile başlamalı.';
  if (k.yayin && ![...Object.values(k.ezber), ...Object.values(k.odev), k.materyal, ...k.etkinlikler].some(x => x.trim())) return 'Yayımlamak için ezber, ödev, materyal veya etkinlik ekleyin.';
  return '';
}
