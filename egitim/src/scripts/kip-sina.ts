/**
 * Adım 5, «Kendini sına» (Faz 2d, 24 Ekim 2026): üç küçük oyun (Sırala, Eksik kelime, Hangi âyet?), kendi sesini kaydetme ve
 * «Nasıl geçti?» özdeğerlendirmesi. Faz 2e'de dördüncü oyun «Anlamla eşleştir» geldi. Soru üretimi ve doğru yanıt `src/lib/ezber/oyun.ts`'te (saf, tohumlu, testli); sonraki tekrar
 * önerisi `src/lib/ezber/tekrar.ts`'te. Burası yalnız çizer. Karar: doğru ya da yanlış sesi, konfeti, puan ve sıralama yok;
 * sonuç çocuğun kendi değerlendirmesine girdidir ve yalnız bu cihazda tutulur. Tıklama ya da klavye yeter (↑ ↓ düğmeleri,
 * Alt + ok); fare sürüklemesi gerekmez. Ses kaydı yalnız bellekte durur (blob adresi), hiçbir yere gönderilmez, kayıt durunca
 * mikrofon hemen bırakılır.
 */
import { cizgiBoyu, kelimeler } from '@ortak/lib/ezber/gizleme';
import { anlamAdaylari, eksikKelimeSorulari, eslestirmeTuru, farkliSira, hangiAyetSorulari, parcalaKelimeler, rastgele, siraDogru, yerindeSayisi } from '@ortak/lib/ezber/oyun';
import { gunFarki, sonrakiTekrar, tarihMi, yerelGun, type TekrarSonucu } from '@ortak/lib/ezber/tekrar';
import { gruplar } from '@ortak/lib/ezber/zincir';
import { doldur, dugme, el, kisimSecici, type Baglam } from './kip-ortak';

type Oyun = 'sirala' | 'eksik' | 'hangi' | 'anlam' | 'kayit';
const KAYIT_AZAMI_MS = 180_000;
const yeniTohum = () => rastgele(Math.floor(Math.random() * 4294967296));

/** «yarın (Pazar 25 Ekim)» gibi: göreli ifade ve tarih sayfa dilinde; Intl yoksa tarih sade yazılır. */
function oneriMetni(sablon: string, sonraki: string, bugun: string): string {
  let ne = sonraki;
  let tarih = sonraki;
  try {
    const dil = document.documentElement.lang || 'tr';
    const [y, a, g] = sonraki.split('-').map(Number);
    tarih = new Intl.DateTimeFormat(dil, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, a - 1, g));
    ne = new Intl.RelativeTimeFormat(dil, { numeric: 'auto' }).format(gunFarki(bugun, sonraki), 'day');
  } catch { /* tanınmayan dil ya da Intl yok: sade tarih */ }
  return doldur(sablon, { ne, tarih });
}

interface SoruTanimi {
  readonly yonerge: string;
  /** Sorunun üstünde duran öğeler (cümle, dinle düğmesi). */
  readonly ust: readonly HTMLElement[];
  readonly secenekler: readonly string[];
  readonly dogru: number;
  /** Yanıttan sonra çağrılır (eksik kelimeyi cümlede göstermek için). */
  readonly acikla?: () => void;
}

export function kur(panel: HTMLElement, b: Baglam): void {
  const { veri, ses } = b;
  const m = veri.m;
  const n = veri.bolumler.length;
  const gr = gruplar(n, b.ayar().boy);
  let gi = Math.min(b.ayar().grup, gr.length - 1);
  const kel = veri.bolumler.map((x) => kelimeler(x.ar));
  let oyun: Oyun | null = null;
  let kayitiBirak: (() => void) | null = null;

  const durum = el('p', 'kip-durum');
  durum.setAttribute('role', 'status');
  const mesaj = (s: string) => { durum.textContent = s; };
  const alan = el('div', 'sina-alan');

  // ——— Oyun seçimi ———
  const secici = kisimSecici(veri, gr, gi, (i) => { gi = i; b.kaydet({ grup: gi }); if (oyun && oyun !== 'kayit') ac(oyun); });
  const ayarlar = el('div', 'kip-ayarlar');
  if (secici) ayarlar.append(secici);
  const oyunGrubu = el('div', 'kip-seviye sina-oyunlar');
  oyunGrubu.setAttribute('role', 'group');
  oyunGrubu.setAttribute('aria-label', m.oyunlar);
  const oyunDugmeleri = new Map<Oyun, HTMLButtonElement>();
  // «Anlamla eşleştir» yalnız gözden geçirilmiş anlam metni olan sayfa dilinde ve en az iki bloğu olan maddede sunulur
  // (taslak çeviriler doğru yanıt diye öğretilmez: src/lib/ezber/madde-metni.ts anlamBloklari).
  const anlamVar = (veri.anlam?.filter((x) => x.meal.trim()).length ?? 0) >= 2;
  const oyunlar: (readonly [Oyun, string])[] = [['sirala', m.oyunSirala], ['eksik', m.oyunEksik], ['hangi', m.oyunHangi]];
  if (anlamVar) oyunlar.push(['anlam', m.oyunAnlam]);
  oyunlar.push(['kayit', m.oyunKayit]);
  for (const [kod, ad] of oyunlar) {
    const d = dugme(ad, 'secim', () => ac(kod));
    d.dataset.oyun = kod;
    d.setAttribute('aria-pressed', 'false');
    oyunDugmeleri.set(kod, d);
    oyunGrubu.append(d);
  }

  function ac(kod: Oyun) {
    kayitiBirak?.();
    kayitiBirak = null;
    ses.durdur();
    oyun = kod;
    mesaj('');
    for (const [k, d] of oyunDugmeleri) d.setAttribute('aria-pressed', String(k === kod));
    alan.replaceChildren();
    if (kod === 'sirala') siralaKur();
    else if (kod === 'eksik') eksikKur();
    else if (kod === 'hangi') hangiKur();
    else if (kod === 'anlam') anlamKur();
    else kayitKur();
  }
  // Başka sekmeye geçilince açık kayıt (mikrofon) bırakılır ve kayıt ekranı sıfırlanır: dönüşte eski «Kaydı durdur» düğmesi kalmaz.
  b.birak(() => {
    kayitiBirak?.();
    kayitiBirak = null;
    if (oyun === 'kayit') {
      oyun = null;
      for (const x of oyunDugmeleri.values()) x.setAttribute('aria-pressed', 'false');
      alan.replaceChildren();
      mesaj('');
    }
  });

  const yeniTur = () => dugme(m.yeniTur, 'dugme ikincil', () => { if (oyun) ac(oyun); });

  // ——— Sırala ———
  function siralaKur() {
    const g = gr[gi];
    let parcalar = veri.bolumler.slice(g.bas, g.son).map((x) => x.ar);
    if (parcalar.length < 3) parcalar = parcalaKelimeler(kel.slice(g.bas, g.son).flat());
    if (parcalar.length < 2) { alan.append(el('p', 'kip-not', m.sinaKisa)); return; }
    const k = parcalar.length;
    let sira = farkliSira(k, yeniTohum());
    let kontrol = false;
    const liste = el('ol', 'sina-sira');
    liste.setAttribute('role', 'list');

    const ciz = () => {
      liste.replaceChildren(...sira.map((p, i) => {
        const li = el('li', 'sina-oge');
        li.dataset.i = String(i);
        const no = el('span', 'sina-no', String(i + 1));
        no.setAttribute('aria-hidden', 'true');
        const metin = el('span', 'sina-parca', parcalar[p]);
        metin.lang = 'ar';
        metin.dir = 'rtl';
        li.append(no, metin);
        if (kontrol && p === i) {
          li.classList.add('dogru');
          li.append(el('span', 'sina-isaret', `✓ ${m.dogruYerde}`));
        }
        const tasi = el('span', 'sina-tasi');
        const yukari = dugme('↑', 'secim', () => tasiAdim(i, -1));
        yukari.dataset.yon = '-1';
        yukari.disabled = i === 0;
        yukari.setAttribute('aria-label', doldur(m.yukari, { n: i + 1 }));
        const asagi = dugme('↓', 'secim', () => tasiAdim(i, 1));
        asagi.dataset.yon = '1';
        asagi.disabled = i === k - 1;
        asagi.setAttribute('aria-label', doldur(m.asagi, { n: i + 1 }));
        tasi.append(yukari, asagi);
        li.append(tasi);
        return li;
      }));
    };
    function tasiAdim(i: number, yon: number) {
      const j = i + yon;
      if (j < 0 || j >= k) return;
      [sira[i], sira[j]] = [sira[j], sira[i]];
      kontrol = false;
      mesaj('');
      ciz();
      const hedef = liste.querySelector<HTMLButtonElement>(`li[data-i="${j}"] button[data-yon="${yon}"]`);
      const yedek = liste.querySelector<HTMLButtonElement>(`li[data-i="${j}"] button[data-yon="${-yon}"]`);
      (hedef && !hedef.disabled ? hedef : yedek)?.focus();
    }
    liste.addEventListener('keydown', (e) => {
      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      const li = (e.target as Element).closest<HTMLElement>('li[data-i]');
      if (!li) return;
      e.preventDefault();
      tasiAdim(Number(li.dataset.i), e.key === 'ArrowUp' ? -1 : 1);
    });

    const eylem = el('div', 'kip-eylem');
    eylem.append(
      dugme(m.kontrolEt, 'dugme birincil', () => {
        kontrol = true;
        ciz();
        b.calistim();
        mesaj(siraDogru(sira) ? m.siraTamam : `${doldur(m.yerinde, { y: yerindeSayisi(sira), n: k })} ${m.siraDevam}`);
      }),
      dugme(m.cevapGoster, 'dugme ikincil', () => {
        sira = sira.map((_, i) => i);
        kontrol = true;
        ciz();
        mesaj(doldur(m.yerinde, { y: k, n: k }));
      }),
      yeniTur(),
    );
    ciz();
    alan.append(el('p', 'kip-yonerge', m.siralaYonerge), liste, eylem);
  }

  // ——— Çoktan seçmeli soru turu (Eksik kelime, Hangi âyet?) ———
  function soruTuru(sorular: readonly SoruTanimi[]) {
    let k = 0;
    let dogru = 0;
    const kutu = el('div', 'sina-soru');
    alan.append(kutu);

    const bitir = () => {
      b.calistim();
      const ozet = el('p', 'kip-soru', doldur(m.dogruSayi, { d: dogru, n: sorular.length }));
      ozet.tabIndex = -1;
      const eylem = el('div', 'kip-eylem');
      eylem.append(yeniTur());
      kutu.replaceChildren(ozet, eylem);
      mesaj(ozet.textContent ?? '');
      ozet.focus({ preventScroll: true });
    };

    const goster = () => {
      mesaj('');
      const s = sorular[k];
      const baslik = el('p', 'kip-soru', doldur(m.soruNo, { k: k + 1, n: sorular.length }));
      baslik.tabIndex = -1;
      const secenekler = el('div', 'sina-secenekler');
      secenekler.setAttribute('role', 'group');
      secenekler.setAttribute('aria-label', s.yonerge);
      const eylem = el('div', 'kip-eylem');
      const ileri = dugme(k + 1 < sorular.length ? m.sonrakiSoru : m.bitirOyun, 'dugme birincil', () => {
        if (k + 1 < sorular.length) { k++; goster(); } else bitir();
      });
      ileri.hidden = true;
      eylem.append(ileri);
      const dugmeler = s.secenekler.map((metin, i) => {
        const d = dugme(metin, 'secim sina-secenek', () => cevap(i));
        d.lang = 'ar';
        d.dir = 'rtl';
        return d;
      });
      function cevap(i: number) {
        const dogruMu = i === s.dogru;
        if (dogruMu) dogru++;
        dugmeler.forEach((d, x) => {
          d.disabled = true;
          if (x === i) d.setAttribute('aria-pressed', 'true');
          if (x === s.dogru) {
            d.classList.add('dogru');
            const isaret = el('span', 'sina-isaret', '✓');
            isaret.setAttribute('aria-hidden', 'true');
            const okunur = el('span', 'gorunmez', m.dogruSecenek);
            okunur.lang = document.documentElement.lang || 'tr';
            d.prepend(isaret, okunur);
          }
        });
        s.acikla?.();
        mesaj(dogruMu ? m.dogruCevap : m.yanlisCevap);
        ileri.hidden = false;
        ileri.focus({ preventScroll: true });
      }
      secenekler.append(...dugmeler);
      kutu.replaceChildren(baslik, el('p', 'kip-yonerge', s.yonerge), ...s.ust, secenekler, eylem);
      baslik.focus({ preventScroll: true });
    };
    goster();
  }

  // ——— Eksik kelime ———
  function eksikKur() {
    const g = gr[gi];
    const kelG = kel.slice(g.bas, g.son);
    const sorular = eksikKelimeSorulari(kelG, 5, yeniTohum());
    if (!sorular.length) { alan.append(el('p', 'kip-not', m.sinaKisa)); return; }
    soruTuru(sorular.map((s): SoruTanimi => {
      const cumle = el('p', 'sina-cumle');
      cumle.lang = 'ar';
      cumle.dir = 'rtl';
      const bosluk = el('span', 'kelime sina-bos');
      bosluk.setAttribute('role', 'img');
      bosluk.setAttribute('aria-label', m.eksikEtiket);
      bosluk.lang = document.documentElement.lang || 'tr';
      bosluk.append(el('span', `cizgi c${cizgiBoyu(s.dogru)}`));
      kelG[s.bolum].forEach((w, j) => {
        if (j) cumle.append(' ');
        cumle.append(j === s.sira ? bosluk : el('span', 'kelime', w));
      });
      return {
        yonerge: m.eksikYonerge,
        ust: [cumle],
        secenekler: s.secenekler,
        dogru: s.dogruSecenek,
        acikla: () => {
          bosluk.removeAttribute('role');
          bosluk.removeAttribute('aria-label');
          bosluk.replaceChildren(el('span', 'sina-dogru-kelime', s.dogru));
        },
      };
    }));
  }

  // ——— Hangi âyet? ———
  function hangiKur() {
    const g = gr[gi];
    let aralik = Array.from({ length: g.son - g.bas }, (_, i) => g.bas + i);
    if (aralik.length < 3) aralik = Array.from({ length: n }, (_, i) => i);
    const sesli = aralik.filter((i) => veri.bolumler[i].ses);
    const sorular = veri.kuran ? hangiAyetSorulari(sesli, aralik, 5, yeniTohum()) : [];
    if (!sorular.length) { alan.append(el('p', 'kip-not', m.hangiYok)); return; }
    soruTuru(sorular.map((s): SoruTanimi => {
      const adres = veri.bolumler[s.bolum].ses!;
      const dinle = dugme(m.sesiCal, 'dugme ikincil', () => ses.cal([adres]));
      return {
        yonerge: m.hangiYonerge,
        ust: [dinle],
        secenekler: s.secenekler.map((i) => `${veri.bolumler[i].ar} ${veri.bolumler[i].etiket}`.trim()),
        dogru: s.dogruSecenek,
      };
    }));
  }

  // ——— Anlamla eşleştir ———
  // İki sütun: Arapça bölümler (metin sırasında, numaralı) ve anlamlar (karışık). Biri, sonra öbürü seçilir; doğruysa ikisi de
  // aynı numarayla işaretlenir ve kilitlenir. Yanlışta puan, kırmızı ya da ses yoktur: yalnız nazik bir yazı ve yeniden deneme.
  // Düğmeler yerinde değiştirilir (yeniden çizilmez): odak ve ekran okuyucu konumu bozulmaz.
  function anlamKur() {
    const g = gr[gi];
    const bloklar = veri.anlam ?? [];
    const tur = eslestirmeTuru(anlamAdaylari(bloklar, g.bas, g.son), (i) => bloklar[i].meal, 3, yeniTohum());
    if (!tur) { alan.append(el('p', 'kip-not', m.sinaKisa)); return; }
    const dilKodu = document.documentElement.lang || 'tr';
    const arapca = (i: number) => veri.bolumler.slice(bloklar[i].bas, bloklar[i].son).map((x) => (x.etiket ? `${x.ar} ${x.etiket}` : x.ar)).join(' ');
    type Taraf = 'ar' | 'meal';
    const dugmeler = { ar: new Map<number, HTMLButtonElement>(), meal: new Map<number, HTMLButtonElement>() };
    const eslesen = new Set<number>();
    let secili: { taraf: Taraf; blok: number } | null = null;
    const numara = (blok: number) => tur.sol.indexOf(blok) + 1;
    const kalan = () => tur.sol.length - eslesen.size;

    const secimiBirak = () => {
      if (secili) dugmeler[secili.taraf].get(secili.blok)?.setAttribute('aria-pressed', 'false');
      secili = null;
    };
    const isaretle = (blok: number) => {
      eslesen.add(blok);
      for (const taraf of ['ar', 'meal'] as const) {
        const d = dugmeler[taraf].get(blok)!;
        d.classList.add('dogru');
        d.disabled = true;
        d.setAttribute('aria-pressed', 'false');
        const isaret = el('span', 'sina-isaret', '✓');
        isaret.setAttribute('aria-hidden', 'true');
        const okunur = el('span', 'gorunmez', taraf === 'ar' ? m.anlamEslendi : doldur(m.anlamEsleti, { n: numara(blok) }));
        okunur.lang = dilKodu;
        if (taraf === 'ar') {
          d.querySelector('.sina-no')?.after(isaret, okunur);
        } else {
          // Anlam düğmesine karşılığının numarası da yazılır: eşleşme yalnız renkle değil, numarayla da okunur.
          const no = el('span', 'sina-no', String(numara(blok)));
          no.setAttribute('aria-hidden', 'true');
          d.prepend(no, okunur, isaret);
        }
      }
    };
    const eylem = el('div', 'kip-eylem');
    const sonrakiOdak = () => {
      const siradaki = tur.sol.find((x) => !eslesen.has(x));
      (siradaki === undefined ? eylem.querySelector<HTMLButtonElement>('button:last-child') : dugmeler.ar.get(siradaki))?.focus({ preventScroll: true });
    };
    const tikla = (taraf: Taraf, blok: number) => {
      if (eslesen.has(blok)) return;
      if (secili && secili.taraf === taraf) {
        const ayni = secili.blok === blok;
        secimiBirak();
        if (ayni) return;
      }
      if (!secili) {
        secili = { taraf, blok };
        dugmeler[taraf].get(blok)!.setAttribute('aria-pressed', 'true');
        mesaj('');
        return;
      }
      // İkinci seçim öbür sütundan: çift tamamlandı.
      const ar = taraf === 'ar' ? blok : secili.blok;
      const meal = taraf === 'meal' ? blok : secili.blok;
      secimiBirak();
      if (ar !== meal) { mesaj(m.anlamEsmedi); return; }
      isaretle(ar);
      if (kalan() === 0) {
        b.calistim();
        mesaj(m.anlamHepsi);
      } else {
        mesaj(doldur(m.anlamEsti, { n: kalan() }));
      }
      sonrakiOdak();
    };

    const sutun = (taraf: Taraf, kimlikler: readonly number[], baslik: string): HTMLElement => {
      const kutu = el('div', 'anlam-sutun');
      const ad = el('h4', 'anlam-etiket', baslik);
      const liste = el(taraf === 'ar' ? 'ol' : 'ul', 'anlam-liste');
      liste.setAttribute('role', 'list');
      liste.setAttribute('aria-label', baslik);
      for (const blok of kimlikler) {
        const d = dugme('', `secim anlam-ogesi anlam-${taraf}`, () => tikla(taraf, blok));
        d.setAttribute('aria-pressed', 'false');
        const yazi = el('span', 'anlam-metin');
        if (taraf === 'ar') {
          const no = el('span', 'sina-no', String(numara(blok)));
          no.setAttribute('aria-hidden', 'true');
          yazi.lang = 'ar';
          yazi.dir = 'rtl';
          yazi.textContent = arapca(blok);
          d.append(no, yazi);
        } else {
          yazi.lang = dilKodu;
          yazi.textContent = bloklar[blok].meal;
          d.append(yazi);
        }
        dugmeler[taraf].set(blok, d);
        const li = el('li', 'anlam-satir');
        li.append(d);
        liste.append(li);
      }
      kutu.append(ad, liste);
      return kutu;
    };

    eylem.append(
      dugme(m.anlamGoster, 'dugme ikincil', () => {
        secimiBirak();
        for (const blok of tur.sol) if (!eslesen.has(blok)) isaretle(blok);
        mesaj(m.anlamGosterildi);
        sonrakiOdak();
      }),
      yeniTur(),
    );
    const izgara = el('div', 'anlam-izgara');
    izgara.append(sutun('ar', tur.sol, m.anlamArapca), sutun('meal', tur.sag, m.anlamMeal));
    alan.append(el('p', 'kip-yonerge', m.anlamYonerge), izgara, eylem, el('p', 'kip-not', m.anlamNot));
  }

  // ——— Kendi sesini kaydet ———
  function kayitKur() {
    alan.append(el('h4', 'sina-baslik', m.kayitBaslik), el('p', 'kip-not', m.kayitAciklama));
    const destek = typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
    if (!destek) { mesaj(m.kayitYok); return; }
    let akim: MediaStream | null = null;
    let kayitci: MediaRecorder | null = null;
    let parcalar: Blob[] = [];
    let adres: string | null = null;
    let zamanlayici = 0;
    let kayitSuruyor = false;
    /** Sekme değişti ya da sayfa kapandı: izin penceresi sonradan onaylansa bile kayıt başlamaz. */
    let iptal = false;

    const baslat = dugme(m.kayitBasla, 'dugme birincil', () => { void basla(); });
    const durdur = dugme(m.kayitDur, 'dugme birincil', () => dur());
    const dinle = dugme(m.kayitDinle, 'dugme ikincil', () => { if (adres) ses.cal([adres]); });
    const sil = dugme(m.kayitSil, 'dugme ikincil', () => { temizle(); gorunum(); mesaj(''); });
    const hafiz = dugme(m.kayitHafiz, 'dugme ikincil', () => ses.cal(veri.hafiz));
    hafiz.hidden = veri.hafiz.length === 0;
    const eylem = el('div', 'kip-eylem');
    eylem.append(baslat, durdur, dinle, hafiz, sil);

    function gorunum() {
      baslat.hidden = kayitSuruyor || Boolean(adres);
      durdur.hidden = !kayitSuruyor;
      dinle.hidden = kayitSuruyor || !adres;
      sil.hidden = kayitSuruyor || !adres;
      hafiz.disabled = kayitSuruyor;
      hafiz.hidden = veri.hafiz.length === 0;
    }
    function serbest() {
      window.clearTimeout(zamanlayici);
      akim?.getTracks().forEach((t) => t.stop());
      akim = null;
    }
    function temizle() {
      ses.durdur();
      if (adres) { URL.revokeObjectURL(adres); adres = null; }
    }
    function dur() {
      if (kayitci && kayitci.state === 'recording') kayitci.stop();
      else serbest();
    }
    async function basla() {
      iptal = false;
      ses.durdur();
      document.dispatchEvent(new CustomEvent('ezber:ses-basladi', { detail: 'kayit' }));
      temizle();
      mesaj(m.kayitBekle);
      try {
        akim = await navigator.mediaDevices.getUserMedia({ audio: true });
        mesaj('');
      } catch (e) {
        const ad = (e as { name?: string })?.name;
        mesaj(ad === 'NotAllowedError' || ad === 'SecurityError' ? m.kayitIzin : m.kayitHata);
        gorunum();
        return;
      }
      if (iptal) { serbest(); return; }
      try {
        parcalar = [];
        const k = new MediaRecorder(akim);
        kayitci = k;
        k.addEventListener('dataavailable', (e) => { if (e.data.size) parcalar.push(e.data); });
        k.addEventListener('stop', () => {
          serbest();
          kayitSuruyor = false;
          if (parcalar.length) {
            adres = URL.createObjectURL(new Blob(parcalar, { type: k.mimeType || 'audio/webm' }));
            mesaj(m.kayitHazir);
            b.calistim();
          } else {
            mesaj(m.kayitHata);
          }
          parcalar = [];
          gorunum();
        });
        k.start();
        kayitSuruyor = true;
        zamanlayici = window.setTimeout(dur, KAYIT_AZAMI_MS);
        mesaj(m.kayitSuruyor);
        gorunum();
        durdur.focus({ preventScroll: true });
      } catch {
        serbest();
        kayitSuruyor = false;
        mesaj(m.kayitHata);
        gorunum();
      }
    }
    // Çalar başlarsa kayıt durur (hoparlör sesi kayda karışmasın); sekme değişince ya da sayfadan çıkınca kayıt biter ve silinir.
    const calarBasladi = (e: Event) => { if ((e as CustomEvent<string>).detail === 'calisma') dur(); };
    const sayfadanCik = () => { iptal = true; dur(); temizle(); };
    document.addEventListener('ezber:ses-basladi', calarBasladi);
    window.addEventListener('pagehide', sayfadanCik);
    kayitiBirak = () => {
      iptal = true;
      document.removeEventListener('ezber:ses-basladi', calarBasladi);
      window.removeEventListener('pagehide', sayfadanCik);
      dur();
      temizle();
    };
    gorunum();
    alan.append(eylem);
  }

  // ——— Nasıl geçti? ———
  const nasilKutu = el('div', 'kip-sonuc');
  nasilKutu.setAttribute('role', 'group');
  nasilKutu.setAttribute('aria-label', m.sinaNasil);
  const oneri = el('p', 'kip-durum');
  oneri.setAttribute('role', 'status');
  const oneriNot = el('p', 'kip-not', m.oneriNot);
  oneriNot.hidden = true;
  const gunDurumu = () => {
    const ay = b.ayar();
    const bugun = yerelGun(new Date());
    if (!tarihMi(ay.sonraki)) { oneri.textContent = ''; return; }
    oneri.textContent = ay.sonraki <= bugun ? m.tekrarGunu : oneriMetni(m.kayitliOneri, ay.sonraki, bugun);
  };
  const yanit = (s: TekrarSonucu) => {
    const bugun = yerelGun(new Date());
    const yeni = sonrakiTekrar(b.ayar().kutu, s, bugun);
    b.kaydet({ kutu: yeni.kutu, sonraki: yeni.sonraki });
    b.calistim();
    const bas = s === 'tam' ? m.yanitTam : s === 'az' ? m.yanitAz : m.yanitTekrar;
    oneri.textContent = `${bas} ${oneriMetni(m.oneri, yeni.sonraki, bugun)}`;
    oneriNot.hidden = false;
  };
  const nasilDugmeleri = el('div', 'kip-dugmeler');
  nasilDugmeleri.append(dugme(m.tam, 'dugme birincil', () => yanit('tam')), dugme(m.az, 'dugme ikincil', () => yanit('az')), dugme(m.tekrar, 'dugme ikincil', () => yanit('tekrar')));
  nasilKutu.append(el('p', 'kip-soru', m.sinaNasil), nasilDugmeleri);

  gunDurumu();
  panel.append(el('p', 'kip-not', m.sinaGiris), ayarlar, oyunGrubu, alan, durum, nasilKutu, oneri, oneriNot);
}
