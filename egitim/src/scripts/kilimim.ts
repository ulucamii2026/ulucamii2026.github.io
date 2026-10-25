/**
 * Kilimim · kendi çalışmam (25 Ekim 2026): bu cihazdaki çalışma kaydından (src/lib/ezber/cihaz.ts) kilimin dokularını ve metin karşılığını
 * doldurur. Yalnız OKUR: cihaz hafızasına hiçbir şey yazılmaz, ağa hiçbir istek atılmaz. Hocanın basamağına çevrilmez: dokular
 * src/lib/ezber/kilimim.ts'teki kendi ölçeğinden gelir. İsteğe bağlı ad yalnız kâğıttaki metin düğümünde durur (depoya, adrese, çereze
 * yazılmaz). Kilim sunucuda boş çizilmiştir; burada yalnız sınıf ve metin değişir. DOM elle güncellenir, `innerHTML` yok (CSP).
 */
import { oku, type Depo } from '@ortak/lib/ezber/cihaz';
import { kendiMaddeler, kendiOzeti, type KendiMadde } from '@ortak/lib/ezber/kilimim';
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { doldur } from './kip-ortak';

interface Veri {
  dil: string;
  yerel: string;
  sira: string[];
  adlar: Record<string, string>;
  m: { doku: [string, string, string, string]; ozetBasladi: string; ozetTakvim: string; ozetGun: string; sayfasiz: string; sonCalisma: string; duzenleme: string };
}

const kok = document.querySelector<HTMLElement>('[data-kilimim]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: bölüm gizli kalır, sayfa yine açıklamayı gösterir */
  }
}

function kur(kok: HTMLElement, veri: Veri) {
  const m = veri.m;
  const sor = <T extends HTMLElement>(s: string): T => {
    const e = kok.querySelector<T>(s);
    if (!e) throw new Error(`öğe yok: ${s}`);
    return e;
  };

  let depo: Depo | null = null;
  try { depo = window.localStorage; } catch { depo = null; }
  const d = oku(depo);
  const bugun = yerelGun(new Date());
  const maddeler = kendiMaddeler(d, veri.sira).filter((x) => veri.adlar[x.id]);
  const ozet = kendiOzeti(maddeler, d.gunler, bugun);

  // Hiç çalışma kaydı yoksa boş durum (kilim çizilmez, çünkü gösterilecek bir şey yok).
  if (ozet.basladi === 0) {
    sor('[data-km-bos]').hidden = false;
    kok.hidden = false;
    return;
  }

  const tarihYaz = (t: string) => new Intl.DateTimeFormat(veri.yerel, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${t}T12:00:00Z`));
  const durumYazisi = (x: KendiMadde) => m.doku[x.doku].replace('{b}', String(x.basamak));
  const kayit = new Map<string, KendiMadde>(maddeler.map((x) => [x.id, x]));

  // ——— Kilim: dokular ve her hücrenin başlığı («ad, kendi durumu») ———
  for (const g of kok.querySelectorAll<SVGGElement>('svg.kl-kendi g.kl-oge[data-id]')) {
    const x = kayit.get(g.dataset.id ?? '');
    if (!x) continue; // çalışma sayfası olmayan madde: sunucudaki «çalışma sayfası yok» başlığı kalır
    g.dataset.doku = String(x.doku);
    g.querySelector('use')?.setAttribute('class', `kl-m kl-k${x.doku}`);
    const baslik = g.querySelector('title');
    if (baslik) baslik.textContent = `${veri.adlar[x.id]}, ${durumYazisi(x)}`;
  }

  // Hücreye fare/dokunmayla tıklayınca çalışma sayfasına gidilir (klavye ve ekran okuyucu için gerçek bağlantılar aşağıdaki listededir).
  kok.querySelector('svg.kl-kendi')?.addEventListener('click', (e) => {
    const href = (e.target as Element).closest<SVGGElement>('g.kl-oge[data-href]')?.dataset.href;
    if (href && href.startsWith('/')) window.location.assign(href);
  });

  // ——— Özet (kilimin altı ve SVG açıklaması) ———
  const satirlar = [doldur(m.ozetBasladi, { n: ozet.basladi, m: ozet.toplam }), doldur(m.ozetTakvim, { n: ozet.takvimde }), doldur(m.ozetGun, { k: ozet.gun })];
  const ozetListe = sor('[data-km-ozet]');
  [...ozetListe.querySelectorAll('li')].forEach((li, i) => { li.textContent = satirlar[i] ?? ''; });
  const aciklama = kok.querySelector('svg.kl-kendi > desc');
  if (aciklama) aciklama.textContent = satirlar.join(' · ');

  // ——— Metin karşılığı: şerit şerit ———
  for (const li of kok.querySelectorAll<HTMLLIElement>('.km-maddeler li[data-id]')) {
    const x = kayit.get(li.dataset.id ?? '');
    if (!x) continue;
    li.dataset.doku = String(x.doku);
    li.querySelector('use')?.setAttribute('class', `kl-m kl-k${x.doku}`);
    const durum = li.querySelector('.km-durum');
    if (durum) durum.textContent = x.doku > 0 && x.son ? `${durumYazisi(x)} · ${doldur(m.sonCalisma, { t: tarihYaz(x.son) })}` : durumYazisi(x);
  }
  for (const sayac of kok.querySelectorAll<HTMLElement>('[data-km-sayac]')) {
    const liler = [...(sayac.closest('.km-serit-kutu')?.querySelectorAll<HTMLLIElement>('li[data-id]') ?? [])];
    const basladi = liler.filter((li) => Number(li.dataset.doku) > 0).length;
    sayac.textContent = `${basladi} / ${liler.length}`;
  }

  // ——— Ad (yalnız bellek), tarih ve yazdırma ———
  const adGirdi = sor<HTMLInputElement>('[data-km-ad]');
  const adYaz = sor('[data-km-ad-yaz]');
  adGirdi.addEventListener('input', () => { adYaz.textContent = adGirdi.value.trim(); });
  sor('[data-km-tarih]').textContent = doldur(m.duzenleme, { t: tarihYaz(bugun) });
  sor<HTMLButtonElement>('[data-km-yazdir]').addEventListener('click', () => window.print());

  sor('[data-km-dolu]').hidden = false;
  kok.hidden = false;
}

