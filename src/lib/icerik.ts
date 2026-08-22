import { getCollection, getEntry } from 'astro:content';
import type { Dil } from '../i18n/ui';
import namazJson from '../data/namaz-vakitleri.json';

export const dilYollari = () => [{ params: { lang: 'tr' } }, { params: { lang: 'fr' } }];

/** Koleksiyon id'si "tr/slug" biçiminde; dile göre süz ve slug'ı ayıkla */
function dilSuz<T extends { id: string }>(liste: T[], dil: Dil) {
  return liste.filter((e) => e.id.startsWith(dil + '/')).map((e) => ({ ...e, slug: e.id.slice(dil.length + 1) }));
}

export async function duyurular(dil: Dil) {
  const hepsi = await getCollection('duyurular', ({ data }) => !data.taslak);
  return dilSuz(hepsi, dil).sort((a, b) => b.data.tarih.getTime() - a.data.tarih.getTime());
}

export async function etkinlikler(dil: Dil) {
  const hepsi = await getCollection('etkinlikler', ({ data }) => !data.taslak);
  return dilSuz(hepsi, dil).sort((a, b) => b.data.baslangic.getTime() - a.data.baslangic.getTime());
}

export async function yaklasanEtkinlikler(dil: Dil, adet = 3) {
  const simdi = Date.now() - 864e5; // dün dahil
  const liste = (await etkinlikler(dil)).filter((e) => (e.data.bitis ?? e.data.baslangic).getTime() >= simdi);
  return liste.sort((a, b) => a.data.baslangic.getTime() - b.data.baslangic.getTime()).slice(0, adet);
}

export async function sayfa(dil: Dil, ad: string) {
  return getEntry('sayfalar', `${dil}/${ad}`);
}

export async function siteAyarlari() {
  return (await getEntry('ayarlar', 'site'))!.data;
}

export async function vefatlar() {
  const hepsi = await getCollection('vefat', ({ data }) => !data.taslak);
  return hepsi.sort((a, b) => b.data.vefat.getTime() - a.data.vefat.getTime());
}

export async function galeri() {
  return (await getCollection('galeri')).sort((a, b) => a.data.sira - b.data.sira);
}

export type NamazGunu = (typeof namazJson)['gunler'][number];
export function namazVakitleri() {
  return namazJson as { kaynak: string; guncelleme: string; ilce: string; gunler: NamazGunu[] };
}

export function bugunBrussels(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
