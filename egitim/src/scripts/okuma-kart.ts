/**
 * Kur'an Okuma çalışma ekranı (10 Kasım 2026): «Dinle → tekrar et → işaretle» döngüsü. İki kip, aynı ekran:
 *  - oturum (`/okuma/bugun/`, isteğe bağlı `?adim=o2`): vadesi gelen tekrarlar + sıradaki yeni maddeler (src/lib/okuma/oturum.ts);
 *  - ders (`?ders=o2-d1`): o dersin bütün maddeleri, sırayla.
 * Madde ve ses verisi sunucuda `data-veri` ile gelir (lib/okuma-veri.ts); metinler DOM'a yalnız `textContent` ile yazılır (CSP: satır içi betik/stil yok).
 * Tek ses nesnesi çalar; "Yavaş" çalma hızını 0.8 yapar. Uygulama okuyuşu DEĞERLENDİRMEZ: üç işaret dürüst özdeğerlendirmedir. İşaretler
 * hemen cihaza yazılır (src/lib/okuma/ilerleme.ts); oturum varsa kısa gecikmeyle ve bitişte hesapla eşitlenir.
 */
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { oturumKur, type PlanAdim } from '@ortak/lib/okuma/oturum';
import { goruldu, konum } from '@ortak/lib/okuma/ilerleme';
import { doldur } from './kip-ortak';
import { bulutlaEsitle, okumaIsaretle, okumaOku } from './okuma-ortak';

type Satir = [string, number, string, number[][] | 0, number];
interface Yuk {
  plan: PlanAdim[]; onek: string[]; etiket: string[]; o: Record<string, Satir[]>;
  d: Record<string, { a: string; f: number; n: number; ad: string }>;
  m: Record<'dinle' | 'durdur' | 'yavas' | 'normal' | 'dogru' | 'takildim' | 'tekrar' | 'maddeNo' | 'yeni' | 'tekrarRozet' | 'sonuc' | 'sonucMetin' | 'sonucBos' | 'sesHata' | 'kaydedilemedi' | 'dersBitti', string>;
}
interface Madde { id: string; ar: string; ses: string; v: number[][] | 0; etiket: string; yeni: boolean }

const kok = document.querySelector<HTMLElement>('[data-okuma-calis]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Yuk);
  } catch {
    /* veri okunamadı: sayfadaki yönlendirme bağlantıları yine çalışır */
  }
}

function kur(kok: HTMLElement, yuk: Yuk) {
  const sor = <T extends HTMLElement>(s: string): T => kok.querySelector<T>(s)!;
  const kart = sor('[data-kart]');
  const arEl = sor('[data-ar]');
  const etiketEl = sor('[data-etiket]');
  const rozet = sor('[data-rozet]');
  const dinle = sor<HTMLButtonElement>('[data-dinle]');
  const dinleYazi = sor('[data-dinle-yazi]');
  const yavasDugme = sor<HTMLButtonElement>('[data-yavas]');
  const isaretler = [...kok.querySelectorAll<HTMLButtonElement>('[data-sonuc]')];
  const ilerleme = sor<HTMLProgressElement>('[data-ilerleme]');
  const sayac = sor('[data-sayac]');
  const durum = sor('[data-durum]');
  const bitti = sor('[data-bitti]');
  const baslik = sor('[data-baslik]');
  const m = yuk.m;
  const q = new URLSearchParams(location.search);
  const bugun = yerelGun(new Date());

  const maddeAl = (id: string, yeni: boolean): Madde | null => {
    const k = konum(id);
    const s = k && yuk.o[k.adim]?.[k.sira];
    if (!s) return null;
    return { id, ar: s[0], ses: yuk.onek[s[1]] + s[2], v: s[3], etiket: yuk.etiket[s[4]] ?? '', yeni };
  };

  // ——— Kuyruk ———
  let il = okumaOku();
  const dersKimligi = q.get('ders');
  const ders = dersKimligi ? yuk.d[dersKimligi] : undefined;
  let kuyruk: Madde[];
  if (ders) {
    baslik.textContent = ders.ad;
    kuyruk = Array.from({ length: ders.n }, (_, i) => `${ders.a}-${ders.f + i}`).map((id) => maddeAl(id, !goruldu(il, id))).filter((x): x is Madde => x !== null);
  } else {
    const o = oturumKur(il, bugun, yuk.plan, q.get('adim'));
    kuyruk = [...o.tekrar.map((id) => maddeAl(id, false)), ...o.yeni.map((id) => maddeAl(id, true))].filter((x): x is Madde => x !== null);
  }

  // ——— Ses ———
  const ses = new Audio();
  ses.preload = 'none';
  let yavas = false;
  let calan = false;
  const dugmeGoster = (caliyor: boolean) => {
    calan = caliyor;
    dinle.toggleAttribute('data-caliyor', caliyor);
    dinleYazi.textContent = caliyor ? m.durdur : m.dinle;
  };
  const durdur = () => { ses.pause(); dugmeGoster(false); };
  const cal = (adres: string) => {
    durum.textContent = '';
    ses.src = adres;
    ses.defaultPlaybackRate = ses.playbackRate = yavas ? 0.8 : 1;
    dugmeGoster(true);
    ses.play().catch((e: unknown) => {
      if ((e as { name?: string })?.name === 'AbortError') return;
      dugmeGoster(false);
      durum.textContent = m.sesHata;
    });
  };
  ses.addEventListener('ended', () => dugmeGoster(false));
  ses.addEventListener('error', () => { if (calan) { dugmeGoster(false); durum.textContent = m.sesHata; } });

  // ——— Gösterim ———
  let i = 0;
  let calisilan = 0;
  const yaz = (hedef: HTMLElement, metin: string, vurgu: number[][] | 0) => {
    hedef.textContent = '';
    if (!vurgu) { hedef.textContent = metin; return; }
    let son = 0;
    for (const [bas, bit] of vurgu) {
      if (bas > son) hedef.append(metin.slice(son, bas));
      const mark = document.createElement('mark');
      mark.className = 'ok-vurgu';
      mark.textContent = metin.slice(bas, bit);
      hedef.append(mark);
      son = bit;
    }
    if (son < metin.length) hedef.append(metin.slice(son));
  };
  const goster = (odak: boolean) => {
    const x = kuyruk[i];
    if (!x) return bitir();
    durdur();
    yaz(arEl, x.ar, x.v);
    arEl.toggleAttribute('data-uzun', x.ar.length > 26);
    etiketEl.textContent = x.etiket;
    etiketEl.hidden = !x.etiket;
    rozet.textContent = x.yeni ? m.yeni : m.tekrarRozet;
    rozet.dataset.tur = x.yeni ? 'yeni' : 'tekrar';
    const metin = doldur(m.maddeNo, { i: i + 1, n: kuyruk.length });
    sayac.textContent = metin;
    ilerleme.max = kuyruk.length;
    ilerleme.value = i;
    ilerleme.setAttribute('aria-valuetext', metin);
    durum.textContent = '';
    if (odak) dinle.focus();
  };
  let esitlemeSayaci = 0;
  const bulutSonra = () => {
    window.clearTimeout(esitlemeSayaci);
    esitlemeSayaci = window.setTimeout(() => { void bulutlaEsitle(); }, 4000);
  };
  const bitir = () => {
    durdur();
    window.clearTimeout(esitlemeSayaci);
    void bulutlaEsitle();
    kart.hidden = true;
    ilerleme.value = ilerleme.max;
    bitti.hidden = false;
    const baslikEl = bitti.querySelector<HTMLElement>('[data-bitti-baslik]');
    const metinEl = bitti.querySelector<HTMLElement>('[data-bitti-metin]');
    const yeniden = bitti.querySelector<HTMLElement>('[data-yeniden]');
    if (!kuyruk.length) {
      if (baslikEl) baslikEl.textContent = m.sonuc;
      if (metinEl) metinEl.textContent = m.sonucBos;
    } else {
      if (baslikEl) baslikEl.textContent = ders && calisilan >= kuyruk.length ? m.dersBitti : m.sonuc;
      if (metinEl) metinEl.textContent = doldur(m.sonucMetin, { n: calisilan });
    }
    if (yeniden) yeniden.hidden = !ders;
    (baslikEl ?? bitti).setAttribute('tabindex', '-1');
    (baslikEl ?? bitti).focus();
  };
  const isle = (sonuc: 'tam' | 'az' | 'tekrar') => {
    const x = kuyruk[i];
    if (!x || kart.hidden) return;
    const { il: yeni, yazildi } = okumaIsaretle(x.id, sonuc, bugun);
    il = yeni;
    calisilan++;
    i++;
    bulutSonra();
    if (i >= kuyruk.length) {
      if (!yazildi) durum.textContent = m.kaydedilemedi;
      return bitir();
    }
    goster(true);
    if (!yazildi) durum.textContent = m.kaydedilemedi;
    else cal(kuyruk[i].ses); // işaret tıklaması bir kullanıcı eylemidir: sonraki kayıt hemen çalabilir
  };

  // ——— Olaylar ———
  dinle.addEventListener('click', () => {
    if (calan) return durdur();
    const x = kuyruk[i];
    if (x) cal(x.ses);
  });
  yavasDugme.addEventListener('click', () => {
    yavas = !yavas;
    yavasDugme.setAttribute('aria-pressed', String(yavas));
    ses.defaultPlaybackRate = ses.playbackRate = yavas ? 0.8 : 1;
  });
  for (const d of isaretler) d.addEventListener('click', () => isle(d.dataset.sonuc as 'tam' | 'az' | 'tekrar'));
  sor('[data-bitir]').addEventListener('click', bitir);
  bitti.querySelector('[data-yeniden]')?.addEventListener('click', () => location.reload());
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || kart.hidden) return;
    const hedef = e.target as HTMLElement | null;
    if (hedef && /^(INPUT|SELECT|TEXTAREA)$/.test(hedef.tagName)) return;
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      isle(e.key === '1' ? 'tam' : e.key === '2' ? 'az' : 'tekrar');
    } else if (e.key === ' ' && hedef && !/^(BUTTON|A|SUMMARY)$/.test(hedef.tagName)) {
      e.preventDefault();
      dinle.click();
    }
  });
  window.addEventListener('pagehide', () => { ses.pause(); });

  yavasDugme.textContent = m.yavas;
  if (!kuyruk.length) {
    kart.hidden = true;
    bitir();
    return;
  }
  kart.hidden = false;
  goster(false);
}
