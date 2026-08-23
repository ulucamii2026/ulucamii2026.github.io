import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse as yamlParse } from 'yaml';

const dil = z.enum(['tr', 'fr']);

/** Duyurular / haberler — src/content/duyurular/{tr,fr}/slug.md (Sveltia: i18n multiple_folders) */
const duyurular = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/duyurular' }),
  schema: z.object({
    baslik: z.string(),
    tarih: z.coerce.date(),
    ozet: z.string().max(300).optional(),
    kapak: z.string().optional(),
    kapakAlt: z.string().optional(),
    galeri: z.array(z.object({ dosya: z.string(), kucuk: z.string().optional(), alt: z.string().optional() })).default([]),
    etiketler: z.array(z.string()).default([]),
    oneCikan: z.boolean().default(false),
    taslak: z.boolean().default(false),
  }),
});

/** Etkinlikler ve afişler — src/content/etkinlikler/{tr,fr}/slug.md */
const etkinlikler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/etkinlikler' }),
  schema: z.object({
    baslik: z.string(),
    baslangic: z.coerce.date(),
    bitis: z.coerce.date().optional(),
    saat: z.string().optional(),
    yer: z.string().optional(),
    afis: z.string().optional(),
    afisKucuk: z.string().optional(),
    galeri: z.array(z.object({ dosya: z.string(), kucuk: z.string().optional(), alt: z.string().optional() })).default([]),
    ozet: z.string().max(300).optional(),
    kategori: z.enum(['bayram', 'kandil', 'ramazan', 'kurban', 'bagis', 'kurs', 'yarisma', 'genel']).default('genel'),
    taslak: z.boolean().default(false),
  }),
});

/** Uzun sayfa metinleri — src/content/sayfalar/{tr,fr}/{hakkimizda,kurankursu,bagis,uyelik,konsolosluk,gizlilik,kunye}.md */
const sayfalar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sayfalar' }),
  schema: z.object({
    baslik: z.string(),
    altBaslik: z.string().optional(),
    aciklama: z.string().max(200).optional(),
    kapak: z.string().optional(),
    guncelleme: z.coerce.date().optional(),
  }),
});

/** Site ayarları (tek dosya) — src/content/ayarlar/site.yaml */
const ayarlar = defineCollection({
  loader: file('./src/content/ayarlar/site.yaml', { parser: (text) => [{ id: 'site', ...yamlParse(text).site }] }),
  schema: z.object({
    id: z.string(),
    dernekAdi: z.string(),
    kisaltma: z.string(),
    kbo: z.string(),
    hukukiForm: z.string(),
    adres: z.object({ sokak: z.string(), posta: z.string(), sehir: z.string(), ulke: z.string() }),
    gps: z.object({ enlem: z.number(), boylam: z.number() }),
    telefon: z.object({ dinGorevlisi: z.string(), cami: z.string() }),
    eposta: z.string().optional(),
    banka: z.object({ iban: z.string(), bic: z.string(), banka: z.string(), hesapAdi: z.string() }),
    cumaSaati: z.string().optional(),
    kursKayitLinki: z.string().url().optional(),
    servisler: z.object({ basvuru: z.string().default('') }).default({ basvuru: '' }),
    heroMesajlar: z.array(z.object({ metin: z.object({ tr: z.string(), fr: z.string(), en: z.string().optional() }), sayfa: z.string().optional(), baglanti: z.string().optional() })).default([]),
    imsakiyePdf: z.string().url().optional(),
    sosyal: z.object({ facebook: z.string().url().optional(), instagram: z.string().url().optional(), youtube: z.string().url().optional() }).default({}),
    konsolosluk: z.object({
      ad: z.string(), santral: z.string(), acil: z.string(), cagriMerkezi: z.string(), eposta: z.string(), web: z.string().url(), randevu: z.string().url(), edevlet: z.string().url(),
    }),
    haftalikProgram: z.array(z.object({
      gun: z.number().int().min(1).max(7),
      baslik: z.object({ tr: z.string(), fr: z.string() }),
      saat: z.object({ tr: z.string(), fr: z.string() }),
      sayfa: z.string().optional(),
    })).default([]),
    cenaze: z.object({
      fonAd: z.string(), fonAcil: z.string(), fonMesai: z.string(), fonEposta: z.string(), fonWeb: z.string().url(), fonAdres: z.string(),
      belediyeNufus: z.string(), belediyeGenel: z.string(), belediyeEposta: z.string(), belediyeGenelEposta: z.string().optional(),
      mezarlikAd: z.string(), mezarlikAdres: z.string(), saniportEposta: z.string().optional(),
    }).optional(),
  }),
});

/** Galeri — src/content/galeri/galeri.yaml (liste) */
const galeri = defineCollection({
  loader: file('./src/content/galeri/galeri.yaml', { parser: (text) => yamlParse(text).galeri }),
  schema: z.object({
    id: z.string(),
    dosya: z.string(),
    kucuk: z.string().optional(),
    alt: z.object({ tr: z.string(), fr: z.string() }),
    tarih: z.string().optional(),
    sira: z.number().default(100),
  }),
});

/** Vefat haberleri / Rahmetle anıyoruz — src/content/vefat/slug.md (dilden bağımsız; metin tr/fr alanlı) */
const vefat = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/vefat' }),
  schema: z.object({
    ad: z.string(),
    vefat: z.coerce.date(),
    dogumYili: z.number().int().optional(),
    memleket: z.string().optional(),
    foto: z.string().optional(),
    cenazeNamazi: z.object({ tarih: z.coerce.date().optional(), saat: z.string().optional(), yer: z.string().optional() }).optional(),
    defin: z.string().optional(),
    taziye: z.string().optional(),
    metin: z.object({ tr: z.string().optional(), fr: z.string().optional() }).optional(),
    taslak: z.boolean().default(false),
  }),
});

/** Hutbeler — src/content/hutbeler/YYYY-MM-DD-slug.md (dilden bağımsız; başlık/özet tr-fr, PDF'ler public/media/hutbeler/) */
const hutbeler = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/hutbeler' }),
  schema: z.object({
    baslik: z.object({ tr: z.string(), fr: z.string().optional() }),
    tarih: z.coerce.date(),
    pdf: z.object({ tr: z.string().optional(), fr: z.string().optional() }).default({}),
    ozet: z.object({ tr: z.string().optional(), fr: z.string().optional() }).optional(),
    kaynak: z.string().optional(),
    taslak: z.boolean().default(false),
  }),
});

/** Afişler — src/content/afisler/slug.md (dilden bağımsız; görseller public/media/afisler/) */
const afisler = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/afisler' }),
  schema: z.object({
    baslik: z.object({ tr: z.string(), fr: z.string().optional() }),
    tarih: z.coerce.date(),
    gorsel: z.string(),
    kucuk: z.string().optional(),
    kaynak: z.enum(['ulucamii', 'bdv', 'diyanet', 'diger']).default('ulucamii'),
    kategori: z.enum(['kampanya', 'program', 'egitim', 'hac-umre', 'kurban', 'zekat', 'cenaze', 'ramazan', 'diger']).default('diger'),
    link: z.string().optional(),
    taslak: z.boolean().default(false),
  }),
});

export const collections = { duyurular, etkinlikler, sayfalar, ayarlar, galeri, vefat, hutbeler, afisler };
export { dil };
