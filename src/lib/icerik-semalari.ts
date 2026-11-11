/**
 * İçerik koleksiyonu şemaları — ana site (src/content.config.ts) ile egitim (egitim/src/content.config.ts) AYNI şemayı kullanır (Dilim 4 / P5a):
 * kurs sayfaları iki sitede aynı kaynak dosyalardan (src/content/sayfalar, ayarlar, materyaller) okunur; şema tek yerde durur, böylece ikisi ayrışmaz.
 * Ekran koleksiyonları (cami ekranı) ve diğerleri ana sitede kalır.
 */
import { z } from 'astro:content';

/** Uzun sayfa metinleri — src/content/sayfalar/{tr,fr,en,nl,de}/{hakkimizda,kurankursu,bagis,uyelik,konsolosluk,gizlilik,kunye}.md */
export const sayfalarSemasi = z.object({
  baslik: z.string(),
  altBaslik: z.string().optional(),
  aciklama: z.string().max(200).optional(),
  kapak: z.string().optional(),
  guncelleme: z.coerce.date().optional(),
});

/** Site ayarları (tek dosya) — src/content/ayarlar/site.yaml */
export const ayarlarSemasi = z.object({
  id: z.string(),
  dernekAdi: z.string(),
  kisaltma: z.string(),
  kbo: z.string(),
  hukukiForm: z.string(),
  adres: z.object({ sokak: z.string(), posta: z.string(), sehir: z.string(), ulke: z.string() }),
  gps: z.object({ enlem: z.number(), boylam: z.number() }),
  telefon: z.object({ dinGorevlisi: z.string(), cami: z.string() }),
  eposta: z.string().optional(),
  epostaDinGorevlisi: z.string().optional(),
  whatsapp: z.object({ kullanici: z.string(), numara: z.string() }).optional(),
  banka: z.object({ iban: z.string(), bic: z.string(), banka: z.string(), hesapAdi: z.string() }),
  cumaSaati: z.string().optional(),
  kursKayitLinki: z.string().url().optional(),
  servisler: z.object({ basvuru: z.string().default('') }).default({ basvuru: '' }),
  /* metin: tr/fr zorunlu, en/nl/de isteğe bağlı — mesajları Sveltia'dan kurul giriyor,
     eksik dil DuyuruSeridi içinde fr'ye düşer (21 Eyl 2026: nl+de eklendi). */
  heroMesajlar: z.array(z.object({ metin: z.object({ tr: z.string(), fr: z.string(), en: z.string().optional(), nl: z.string().optional(), de: z.string().optional() }), sayfa: z.string().optional(), baglanti: z.string().optional(), baslangic: z.coerce.date().optional(), son: z.coerce.date().optional() })).default([]),
  imsakiyePdf: z.string().url().optional(),
  sosyal: z.object({ facebook: z.string().url().optional(), instagram: z.string().url().optional(), youtube: z.string().url().optional(), whatsappTopluluk: z.string().url().optional() }).default({}),
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
    fonAd: z.string(), fonAcil: z.string(), fonMesai: z.string(), fonEposta: z.string(), fonWeb: z.string().url(), fonKayitWeb: z.string().url().optional(), fonAdres: z.string(),
    fonFaks: z.string().optional(), fonYonetmelik: z.string().url().optional(), fonCocukKayitWeb: z.string().url().optional(), fonAdresDegisikligiWeb: z.string().url().optional(),
    belediyeNufus: z.string(), belediyeGenel: z.string(), belediyeEposta: z.string(), belediyeGenelEposta: z.string().optional(),
    mezarlikAd: z.string(), mezarlikAdres: z.string(), saniportEposta: z.string().optional(),
  }).optional(),
});

/** Ders materyalleri — güne bağlı olmayan kalıcı belgeler (ezber kartı, alıştırma, tablo, rehber…); src/content/materyaller/*.md */
export const materyallerSemasi = z.object({
  baslik: z.object({ tr: z.string(), fr: z.string().optional(), en: z.string().optional() }),
  aciklama: z.object({ tr: z.string().optional(), fr: z.string().optional(), en: z.string().optional() }).optional(),
  tarih: z.coerce.date(),
  donem: z.string().optional(),
  kategori: z.enum(['ezber', 'alistirma', 'tablo', 'rehber', 'sinav', 'ses', 'video', 'kitap', 'defter', 'diger']).default('diger'),
  alan: z.enum(['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak', 'genel']).default('genel'),
  dosya: z.string().optional(),
  link: z.string().optional(),
  boyut: z.number().optional(),
  taslak: z.boolean().default(false),
}).refine((d) => Boolean(d.dosya || d.link), { message: 'dosya ya da link zorunlu' });
