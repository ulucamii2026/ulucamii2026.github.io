/**
 * Ana sayfada kurs kaydına bağlı hesabın (çocuk ya da bağlama koduyla bağlanmış yetişkin) birleşik kilimi (2 Kasım 2026; docs/ILIM-YOLU.md «Birleşik
 * kilim»). Hocanın basamağı dolgudur; öğrencinin kendi çalışması (cihaz kopyası) yalnız hocanın basamağı ≤ 1 olan hücrede yeşil dokuyla üstüne biner.
 * Hocanın kaydı `ezberDurum/{ref}` ve son 20 olaydan okunur (kural `ogrenciOkur`; yazılamaz; src/lib/hesap/ogretmen-kaydi.ts). Okunamazsa kendi
 * kilimi olduğu gibi kalır ve kısa bir not çıkar. Bu dosya `ana.ts`ten TEMBEL yüklenir: kilim çizicisi ve katalog yalnız kurs hesaplarının paketine girer.
 * DOM elle kurulur (`innerHTML` yok; CSP): SVG ve lejant `DOMParser` ile ayrıştırılıp içe aktarılır.
 */
import type { Dil } from '@ortak/i18n/ui';
import { oku, type Depo } from '@ortak/lib/ezber/cihaz';
import { kilimLejanti, kilimSvg } from '@ortak/lib/ezber/kilim';
import { kendiMaddeler, kendiOzeti } from '@ortak/lib/ezber/kilimim';
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { kalipDoldur } from '../i18n/sablon';
import type { IlimFirebase } from '../lib/firebase-istemci';
import { etkinAnahtar } from '../lib/hesap/isaret';
import { ogretmenGorunumu, ogretmenKaydiOku } from '../lib/hesap/ogretmen-kaydi';
import type { Kullanici } from '../lib/hesap/oturum';
import type { AnaVeri } from './ana';

export async function hocaKilimi(kok: HTMLElement, veri: AnaVeri, f: IlimFirebase, k: Kullanici, depo: Depo | null): Promise<void> {
  const il = veri.il;
  const bolum = kok.querySelector<HTMLElement>('[data-hoca]');
  const durum = kok.querySelector<HTMLElement>('[data-hoca-durum]');
  const satirlar = kok.querySelector<HTMLElement>('[data-hoca-satirlari]');
  const kutu = kok.querySelector<HTMLElement>('[data-kilim-kutu]');
  if (!bolum || !durum || !satirlar || !kutu) return;

  const kayit = await ogretmenKaydiOku(f, k).catch(() => null);
  if (!kayit) {
    bolum.hidden = false;
    durum.textContent = il.hocaYok;
    return;
  }
  const dil = veri.dil as Dil;
  const kendi = oku(depo, etkinAnahtar(depo));
  const g = ogretmenGorunumu(kayit, kendi, dil);
  const ozet = kendiOzeti(kendiMaddeler(g.kendi, veri.sira), g.kendi.gunler, yerelGun(new Date()));
  const secenek = {
    onek: 'kl-birlesik', dil, baslik: il.birlesikBaslik,
    birlesik: { kendi: g.kendi, dokuAdlari: veri.km.doku, ozet: kalipDoldur(il.birlesikOzet, ozet.basladi) },
  };

  // Kilim + lejant: kendi kipindeki çizim, birleşik kiple değişir.
  const svg = new DOMParser().parseFromString(kilimSvg(g.ogeler, secenek), 'image/svg+xml').documentElement;
  const lejant = new DOMParser().parseFromString(kilimLejanti(secenek), 'text/html').body;
  const lejantKutusu = document.createElement('div');
  lejantKutusu.append(...[...lejant.childNodes].map((n) => document.importNode(n, true)));
  kutu.replaceChildren(document.importNode(svg, true), lejantKutusu);
  kutu.dataset.birlesik = '';
  const baslik = kok.querySelector<HTMLElement>('#kilim-baslik');
  if (baslik) baslik.textContent = il.hocaBaslik;
  const alt = kok.querySelector<HTMLElement>('[data-kilim-alt]');
  if (alt) alt.textContent = il.hocaAciklama;

  // Metin karşılığı: şerit şerit hocanın kaydı + son notlar (kilim görsel; bu liste ekran okuyucu ve klavye içindir).
  const tarih = (t: string) => (/^\d{4}-\d{2}-\d{2}/.test(t)
    ? new Intl.DateTimeFormat(veri.yerel, { day: 'numeric', month: 'long' }).format(new Date(`${t.slice(0, 10)}T12:00:00Z`))
    : t);
  const ogeler: HTMLElement[] = [];
  const ekle = (metin: string, kalin = false) => {
    const li = document.createElement('li');
    if (kalin) { const b = document.createElement('b'); b.textContent = metin; li.append(b); } else li.textContent = metin;
    ogeler.push(li);
  };
  ekle(il.hocaSeritler, true);
  for (const s of g.seritler) ekle(`${s.ad}: ${s.baslanan} / ${s.maddeler.length}`);
  if (g.dinlemeler.length) {
    ekle(il.hocaSon, true);
    for (const d of g.dinlemeler) ekle(`${tarih(d.tarih)} · ${d.ad}: ${d.metin}${d.notlar.length ? ` (${d.notlar.join('; ')})` : ''}`);
  }
  satirlar.replaceChildren(...ogeler);
  durum.textContent = '';
  bolum.hidden = false;
}
