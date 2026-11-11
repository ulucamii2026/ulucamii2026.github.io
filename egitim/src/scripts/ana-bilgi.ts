/**
 * İlim Yolu ana sayfası, bilgi yolları bölümü (11 Kasım 2026): «Bugün» kartındaki sıradaki bilgi kartı, «Kaldığınız yer» / «Yolunuz» (en son çalışılan yol:
 * Ezber ya da bir kart yolu), başlanmış yolların kartları ve rozet sayısı. Veri yalnız cihazdan okunur (kart ilerlemesi, son işaret, Ezber kaydı); ağ yok.
 * «Yeni Müslüman yolu» hiçbir yerde okunmaz ya da anılmaz (gizlilik). DOM'a yalnız `textContent`/öznitelik yazılır (CSP).
 */
import type { CihazDurumu } from '@ortak/lib/ezber/cihaz';
import { rozetSayisi, sonCalisilan, sonYol, yolDurumlari, type AnaYol, type SonKayit } from '@ortak/lib/ilim-yolu/ana-yol';
import type { BilgiIlerleme } from '@ortak/lib/ilim-yolu/bilgi-ilerleme';
import { kalipDoldur } from '../i18n/sablon';

export interface BilgiVeri {
  plan: (AnaYol & { ad: string; motif: string })[];
  alan: AnaYol[];
  bilgiIdler: string[];
  kartAdlari: Record<string, string>;
  sayim: string;
  rozetKazanildi: string;
}

const dolu = (kalip: string, d: Record<string, string | number>) => kalip.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));

function sor<T extends HTMLElement | SVGElement = HTMLElement>(kok: ParentNode, secici: string): T {
  const e = kok.querySelector<T>(secici);
  if (!e) throw new Error(`öğe yok: ${secici}`);
  return e;
}

export function bilgiBolumu(kok: HTMLElement, veri: { dil: string; il: Record<string, string> }, b: BilgiVeri, il: BilgiIlerleme, son: SonKayit | null, ezber: CihazDurumu, ezberMs: number, tarihYaz: (ms: number) => string) {
  const yol = (id: string) => `/${veri.dil}/yollar/${id}/`;
  const kart = (id: string) => `/${veri.dil}/ogren/${id}/`;
  const plan = yolDurumlari(il, b.plan);
  const ad = (id: string) => b.plan.find((p) => p.id === id)?.ad ?? id;

  // Bugün: en son çalışılan kart yolunun sıradaki kartı
  const bugun = sonYol(plan, son);
  const liste = sor(kok, '[data-bugun-kart-liste]');
  const sonraki = bugun?.sonraki ?? null;
  liste.hidden = !bugun || !sonraki;
  if (bugun && sonraki) {
    sor(liste, '[data-bugun-kart-ad]').textContent = b.kartAdlari[sonraki] ?? sonraki;
    sor(liste, '[data-bugun-kart-alt]').textContent = dolu(veri.il.bugunKartAlt, { yol: ad(bugun.id) });
    const a = sor<HTMLAnchorElement>(liste, '[data-bugun-kart-baglanti]');
    a.href = kart(sonraki);
    a.setAttribute('aria-label', `${b.kartAdlari[sonraki] ?? ''}: ${veri.il.bugunKartGit}`);
  }

  // Kaldığınız yer ve Yolunuz: Ezber ile kart yolları arasında en yeni olan
  const sc = sonCalisilan(plan, son, ezberMs);
  const yolunBag = sor<HTMLAnchorElement>(kok, '[data-yolun-baglanti]');
  const motif = sor<SVGUseElement>(kok, '[data-yolun-motif]');
  if (sc?.tur === 'kart') {
    const sira = b.plan.findIndex((p) => p.id === sc.yol.id);
    yolunBag.href = yol(sc.yol.id);
    sor(yolunBag, '[data-yolun-ad]').textContent = ad(sc.yol.id);
    motif.setAttribute('href', `#${b.plan[sira]?.motif ?? 'm-goz'}`);
    sor(kok, '[data-kaldigin-ad]').textContent = sc.son ? (b.kartAdlari[sc.son.id] ?? ad(sc.yol.id)) : ad(sc.yol.id);
    const sonP = sor(kok, '[data-kaldigin-son]');
    sonP.textContent = sc.son ? kalipDoldur(veri.il.kaldiginSon, tarihYaz(sc.son.ms)) : '';
    sonP.hidden = !sc.son;
    const bag = sor<HTMLAnchorElement>(kok, '[data-kaldigin-baglanti]');
    bag.href = sc.yol.sonraki ? kart(sc.yol.sonraki) : yol(sc.yol.id);
    sor(bag, '[data-kaldigin-dugme]').textContent = sc.yol.sonraki ? veri.il.devamEt : veri.il.yolaBak;
  } else {
    yolunBag.href = `/${veri.dil}/ezber/`;
    sor(yolunBag, '[data-yolun-ad]').textContent = veri.il.yolEzberAd;
    motif.setAttribute('href', '#m-goz');
  }

  // Yollarınız: başlanmış kart yollarının kartları
  for (const d of plan) {
    const k = sor(kok, `[data-bilgi-yol="${d.id}"]`);
    k.hidden = d.ogrenilen === 0;
    if (d.ogrenilen === 0) continue;
    sor(k, '[data-serit]').setAttribute('width', `${Math.round((100 * d.ogrenilen) / Math.max(1, d.toplam))}%`);
    sor(k, '[data-bilgi-durum]').textContent = d.tamam ? b.rozetKazanildi : dolu(b.sayim, { n: d.ogrenilen, m: d.toplam });
    const a = sor<HTMLAnchorElement>(k, '[data-bilgi-baglanti]');
    a.href = d.sonraki ? kart(d.sonraki) : yol(d.id);
    a.textContent = d.sonraki ? veri.il.devamEt : veri.il.yolaBak;
    a.setAttribute('aria-label', `${ad(d.id)}: ${a.textContent}`);
  }

  // Rozet sayısı (13 yoldan; Ezber'deki bilgi maddeleri yolu ezber kaydından)
  const bilgiTamam = b.bilgiIdler.length > 0 && b.bilgiIdler.every((id) => (ezber.maddeler[id]?.son ?? 0) > 0);
  const n = rozetSayisi([...plan, ...yolDurumlari(il, b.alan)], bilgiTamam);
  const satir = sor(kok, '[data-rozet-satiri]');
  satir.hidden = n === 0;
  sor(satir, '[data-rozet-sayisi]').textContent = dolu(veri.il.rozetSayisi, { n });
}
