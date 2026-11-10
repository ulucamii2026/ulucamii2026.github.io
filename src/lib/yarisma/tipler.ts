/**
 * Bilgi Yarışması soru türleri ve sabitleri (JSON verisi OLMADAN: sayfa betikleri bunu içe aktarırken 5 dilli banka pakete girmesin). Banka, kartlardan ve src/data/ibadet'ten
 * `scripts/yarisma-uret.mjs` ile üretilir (elle düzenlenmez); buradaki kod hüküm ÜRETMEZ, yalnız veriyi sunar. Sınıf bir ekranda birlikte
 * oynar: kişi, ad ya da puan kaydı yoktur (docs/ILIM-YOLU.md, «Bilgi Yarışması»).
 */
import type { Dil } from '../../i18n/ui';

export type Biçim = 'quiz' | 'siralama' | 'gruplama' | 'eslestirme' | 'gizemli';
export type Konu = 'itikat' | 'ibadet' | 'siyer' | 'ahlak' | 'kuran';
export type Metin = Readonly<Record<Dil, string>>;

interface Temel { readonly id: string; readonly topic: Konu; readonly altKonu?: string; readonly level: 1 | 2 | 3; readonly kaynak: readonly string[] }
export interface QuizSorusu extends Temel { readonly format: 'quiz'; readonly soru: Metin; readonly secenekler: readonly Metin[]; readonly dogru: number }
export interface SiralamaSorusu extends Temel { readonly format: 'siralama'; readonly baslik: Metin; /** DOĞRU sıra. */ readonly ogeler: readonly Metin[] }
export interface GruplamaSorusu extends Temel { readonly format: 'gruplama'; readonly baslik: Metin; readonly gruplar: readonly [Metin, Metin]; readonly ogeler: readonly { readonly metin: Metin; readonly grup: 0 | 1 }[] }
export interface EslestirmeSorusu extends Temel { readonly format: 'eslestirme'; readonly baslik: Metin; readonly ciftler: readonly { readonly sol: Metin; readonly sag: Metin }[] }
export interface GizemliSorusu extends Temel { readonly format: 'gizemli'; readonly baslik: Metin; readonly ipuclari: readonly Metin[]; readonly secenekler: readonly Metin[]; readonly dogru: number }
export type Soru = QuizSorusu | SiralamaSorusu | GruplamaSorusu | EslestirmeSorusu | GizemliSorusu;

export const BICIMLER: readonly Biçim[] = ['quiz', 'siralama', 'gruplama', 'eslestirme', 'gizemli'];
export const KONULAR: readonly Konu[] = ['itikat', 'ibadet', 'siyer', 'ahlak', 'kuran'];


/**
 * Karışık bir sınıfta paylaşılan ekrana uygun görülmeyen gizemli kutular (imam gözden geçirene kadar varsayılan havuzun DIŞINDA ve sayfaya
 * hiç gönderilmez): yar-m-004 (Peygamberimizin son hastalığı ve vefatı), yar-m-022 (gusül: cünüplük, hayız, nifas). Soru metni değiştirilmedi.
 */
export const HASSAS: ReadonlySet<string> = new Set(['yar-m-004', 'yar-m-022']);
