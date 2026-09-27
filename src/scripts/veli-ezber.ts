/**
 * Veli portalında «Ezber Kilimi» kartı ve öğrenci kipinde «Kilimim» (27 Eylül 2026, Faz 1d). Portal paketinden ayrı parça
 * olarak yüklenir; katalog ve motifler yalnız gerektiğinde iner. Okuma: `ezberDurum/{ref}` ve son 20 olay (lite SDK,
 * kurallarda `veliOkur`). Okunamazsa `null` döner: kart hata iletisini gösterir, eski ilerleme listesi yerinde kalır.
 * Veli hocanın düğme adını değil yumuşak karşılığını, kalıp notları kendi dilinde okur. Kurallar: docs/EZBER-KILIMI.md.
 */
import type { Dil } from '../i18n/ui';
import { ezberDurumuOku, gorunenBasamak, olayOku, type Basamak, type EzberOlayi, type OgeDurumu } from '../lib/ezber/durum';
import { basamakIsareti } from '../lib/ezber/isaret';
import { eskiKimliktenYeni } from '../lib/ezber/katalog';
import { kilimLejanti, kilimOzeti, kilimSvg, motifIsareti } from '../lib/ezber/kilim';
import { BASAMAK_ADLARI, KILIM_METINLERI } from '../lib/ezber/metinler';
import { veliDinlemeleri, veliSeritleri, type VeliSeridi } from '../lib/ezber/veli';

type Lite = typeof import('firebase/firestore/lite');

export interface VeliEzberi {
  readonly ogeler: Readonly<Record<string, OgeDurumu>>;
  /** Yeniden eskiye; bozuk ve katalog dışı olaylar düşmüştür. */
  readonly olaylar: readonly EzberOlayi[];
}

/** Durum belgesi ve son olaylar; kural reddi ya da bağlantı hatasında `null`. */
export async function veliEzberiYukle(fs: Lite, db: ReturnType<Lite['getFirestore']>, ref: string, sinir = 20): Promise<VeliEzberi | null> {
  try {
    const [durum, olaylar] = await Promise.all([
      fs.getDoc(fs.doc(db, 'ezberDurum', ref)),
      fs.getDocs(fs.query(fs.collection(db, 'ezberDurum', ref, 'olaylar'), fs.orderBy('zaman', 'desc'), fs.limit(sinir))),
    ]);
    return {
      ogeler: durum.exists() ? ezberDurumuOku(durum.data()) : {},
      olaylar: olaylar.docs.flatMap((x) => {
        const o = olayOku(x.data());
        return o ? [o] : [];
      }),
    };
  } catch (e) {
    console.warn('Ezber kilimi okunamadı:', e);
    return null;
  }
}

export type EzberGorunumu = 'kilim' | 'eski' | 'hata';

/**
 * Yeni kayıt varsa ya da hiç kayıt yoksa kilim; yeni kayıt yok ama eski ilerleme listesinde ezber varsa (geçiş betiği
 * henüz koşmadı) yalnız eski liste; okuma hatasında hata iletisi, eski liste de yerinde kalır.
 */
export function ezberGorunumu(ez: VeliEzberi | null, eskiVar: boolean): EzberGorunumu {
  if (!ez) return 'hata';
  return !Object.keys(ez.ogeler).length && eskiVar ? 'eski' : 'kilim';
}

/** Portalın kendi parçaları: bölüm başlığı, boş durum, simge, tarih. */
export interface KartYardimi {
  readonly dil: Dil;
  readonly bas: (ikon: string, baslik: string, sag?: string) => string;
  readonly bosDurum: (ikon: string, metin: string) => string;
  readonly simge: (ad: string) => string;
  readonly tarihYaz: (iso: string) => string;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const K = KILIM_METINLERI;

/** Şeridin metin karşılığı: ad, başlanan sayısı, ödüller ve her madde kilimdeki dokusuyla. */
function seritHtml(s: VeliSeridi, onek: string, dil: Dil): string {
  const oduller = [s.rozet ? K.rozet[dil] : '', s.muhur ? K.muhur[dil] : '', s.altin ? K.altin[dil] : ''].filter(Boolean);
  return `<div class="kl-serit-kutu" data-serit="${esc(s.anahtar)}">
    <h4><span>${esc(s.ad)}</span><span class="kl-sayac">${s.baslanan}/${s.maddeler.length} ${esc(K.madde[dil])}</span></h4>
    ${oduller.length ? `<p class="kl-oduller">${oduller.map((x) => `<span class="rozet kl-odul-rozet">${esc(x)}</span>`).join('')}</p>` : ''}
    <ul class="kl-maddeler">${s.maddeler.map((x) => `<li data-id="${esc(x.id)}" data-basamak="${x.basamak}">${motifIsareti(onek, s.motif, x.basamak)}<span class="kl-madde-ad">${esc(x.ad)}</span><span class="kl-basamak kl-t${x.basamak}">${esc(x.basamakAdi)}</span></li>`).join('')}</ul>
  </div>`;
}

const ozetMetni = (ez: VeliEzberi, dil: Dil) => (Object.keys(ez.ogeler).length ? kilimOzeti(ez.ogeler, dil) : K.bos[dil]);

/** Veli görünümü: kilim, özet, son dinlemeler, açıklama ve katlanır şerit listesi. `ez` yoksa hata iletisi. */
export function veliKilimKarti(ez: VeliEzberi | null, onek: string, y: KartYardimi): string {
  const dil = y.dil;
  if (!ez) return `<section class="bolum r-kiremit genis kilim-kart" data-ezber-kilim="hata">${y.bas('kilim', K.baslik[dil])}${y.bosDurum('kilim', K.hata[dil])}</section>`;
  const dinlemeler = veliDinlemeleri(ez.olaylar, dil);
  const kayitVar = Object.keys(ez.ogeler).length > 0;
  return `<section class="bolum r-kiremit genis kilim-kart" data-ezber-kilim="veli">
    ${y.bas('kilim', K.baslik[dil])}
    <p class="kucuk kilim-aciklama">${esc(K.aciklama[dil])}</p>
    <div class="kilim-duzen">
      <div class="kilim-cizim">${kilimSvg(ez.ogeler, { onek, dil, baslik: K.baslik[dil] })}</div>
      <div class="kilim-yan">
        <p class="kilim-ozet">${esc(ozetMetni(ez, dil))}</p>
        ${kayitVar || dinlemeler.length ? `<h3>${esc(K.sonDinlemeler[dil])}</h3>
        ${dinlemeler.length ? `<ul class="liste kilim-dinlemeler">${dinlemeler.map((x) => `<li><span class="kucuk">${esc(y.tarihYaz(x.tarih))}</span><b>${esc(x.ad)}</b><span>${esc(x.metin)}</span>${x.notlar.length ? `<span class="kucuk kl-notlar">${x.notlar.map(esc).join(' ')}</span>` : ''}</li>`).join('')}</ul>`
          : `<p class="kucuk">${esc(K.dinlemeYok[dil])}</p>`}` : ''}
        <h3>${esc(K.lejant[dil])}</h3>
        ${kilimLejanti({ onek, dil, baslik: K.baslik[dil] })}
      </div>
    </div>
    <details class="katlanir kilim-seritler">
      <summary>${y.simge('liste')}<h3>${esc(K.seritSerit[dil])}</h3></summary>
      <div class="govde">${veliSeritleri(ez.ogeler, dil).map((s) => seritHtml(s, onek, dil)).join('')}</div>
    </details>
  </section>`;
}

/** Öğrenci kipi: çocuk kendi kilimine bakar; dinleme geçmişi ve liste yok. */
export function ogrenciKilimKarti(ez: VeliEzberi, onek: string, y: KartYardimi): string {
  const dil = y.dil;
  return `<section class="bolum r-kiremit genis kilim-kart kilimim" data-ezber-kilim="ogrenci">
    ${y.bas('kilim', K.kilimim[dil])}
    <div class="kilim-duzen">
      <div class="kilim-cizim">${kilimSvg(ez.ogeler, { onek, dil, baslik: K.kilimim[dil] })}</div>
      <div class="kilim-yan">
        <p class="kilim-ozet">${esc(ozetMetni(ez, dil))}</p>
        <p class="kucuk">${esc(K.aciklama[dil])}</p>
        <h3>${esc(K.lejant[dil])}</h3>
        ${kilimLejanti({ onek, dil, baslik: K.kilimim[dil] })}
      </div>
    </div>
  </section>`;
}

/**
 * Ezber Odası maddesinin (eski `ezber-verisi.ts` kimliği) kilimdeki basamağı. Oda kimlikleri değişmez; katalog karşılığı
 * `eski-kimlikler.json` → `ezberListesi`. Bileşik maddede (Salli + Bârik, iki Rabbenâ) en düşük basamak: ikisi de
 * okunmadan madde okunmuş sayılmaz. Karşılığı olmayan Oda maddesinde `null`.
 */
export function odaBasamagi(ez: VeliEzberi, odaId: string): Basamak | null {
  const idler = eskiKimliktenYeni('ezberListesi', odaId);
  return idler.length ? (Math.min(...idler.map((id) => gorunenBasamak(ez.ogeler, id))) as Basamak) : null;
}

/** Oda çipindeki işaret (hoca tablosundakinin aynısı) ve ekran okuyucu için basamak adı; başlanmamışta boş. */
export function odaIsareti(ez: VeliEzberi, odaId: string, dil: Dil): string {
  const b = odaBasamagi(ez, odaId);
  if (!b) return '';
  return `<span class="cip-basamak" data-basamak="${b}">${basamakIsareti(b)}<span class="sr-only"> · ${esc(BASAMAK_ADLARI[b][dil])}</span></span>`;
}
