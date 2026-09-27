/**
 * Ezber Kilimi — hoca ekranı «Ezber» sekmesi (27 Eylül 2026, Faz 1c). Hoca sınıfta telefonla dinler, tek dokunuşla
 * işler: «Bugün» (yoklamada gelenler), «Tekrar» (kontrol günü gelenler), «Tablo» (şerit × öğrenci). Dinleme paneli
 * açılır pencere değildir: öğrencinin kartı yerinde açılır; defterdeki «Ezber dinlendi» aynı paneli kullanır
 * (`ezberDinlemesi`). Yazım yalnız `depo.ts` ile (durum + olay tek toplu yazım). Ekran yazımı beklemez: tam SDK'nın
 * kalıcı önbelleği dokunuşu hemen gösterir, bağlantı gelince gönderir; başlıktaki rozet bekleyen kaydı söyler.
 * Bütün metinler Türkçe (hoca ekranı yalnız Türkçe); veliye giden kalıplar beş dilde `metinler.ts`'te. Değişken her
 * değer `esc` ile kaçırılır (öğrenci adı Firestore'dan gelir).
 * Kurallar ve veri modeli: docs/EZBER-KILIMI.md · plan: docs/superpowers/plans/2026-09-27-ezber-kilimi-faz-1c-hoca.md.
 */
import type { FirebaseApp } from 'firebase/app';
import { collection, doc, getDocFromServer, onSnapshot, waitForPendingWrites, type Firestore } from 'firebase/firestore';
import { tamFirestore } from '../lib/firebase-tam';
import { KATALOG, SEVIYE_SIRASI, ezberBul, seviyeOgeleri, sinifHedefleri } from '../lib/ezber/katalog';
import {
  KALITELER,
  NOT_SINIRI,
  ata,
  bolumler,
  dinle,
  duzelt,
  elleBasamak,
  ezberDurumuOku,
  gorunenBasamak,
  kapsayanMaddeler,
  kontrolGeldi,
  kontrolSirasi,
  type Basamak,
  type Bolum,
  type Gecis,
  type Kalite,
  type OgeDurumu,
} from '../lib/ezber/durum';
import { EZBER_CAKISMA, ezberDeposu, type EzberDokunusu } from '../lib/ezber/depo';
import { BASAMAK_ADLARI, KALITE_ETIKETI, NOT_KALIPLARI, defterCumlesi } from '../lib/ezber/metinler';
import { ogrenciOnerisi } from '../lib/ezber/oneri';
import { basamakIsareti } from '../lib/ezber/isaret';
import { bekleyenCikar, bekleyenEkle, bekleyenler, kayiplar, kayiplariBul, kayiplariKapat, type BekleyenYazim } from '../lib/ezber/bekleyen';

export type EzberOgrencisi = { ref: string; ad: string; soyad: string; durum?: string };
export type EzberPlanGunu = { tarih: string; hafta: number; dersler: { ezber?: string[] }[] };
type Sinif = Record<string, Record<string, OgeDurumu>>;

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const gunYaz = (iso: string, sec: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Brussels', ...sec }).format(new Date(`${iso}T12:00:00Z`)) : '';
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const adSoyad = (o: EzberOgrencisi) => `${o.ad} ${o.soyad}`;
/** Basamak işareti; kontrol günü gelen maddede köşede kiremit nokta (CSS). */
const isaret = (b: Basamak, vadeli = false) => `<span class="ez-isaret-kap${vadeli ? ' vadeli' : ''}">${basamakIsareti(b)}</span>`;

/* Çizili tek-çizgi simgeler (hoca ekranıyla aynı ölçü: 24'lük kutu, 1.6 çizgi, currentColor). */
const SIMGE: Record<string, string> = {
  ezber: '<path d="M12 2.8l7.6 9.2-7.6 9.2L4.4 12z"/><path d="M12 8.2l3.1 3.8-3.1 3.8-3.1-3.8z"/>',
  onay: '<path d="M5 12.6l4.3 4.3L19 7.2"/>',
  geri: '<path d="M9 14L4 9.5 9 5"/><path d="M4 9.5h10a5 5 0 0 1 0 10h-2"/>',
  kapat: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  ok: '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  bulut: '<path d="M7.2 18.5h9.6a4.1 4.1 0 0 0 .7-8.1 6 6 0 0 0-11.5-.9 4.5 4.5 0 0 0 1.2 9z"/>',
  bulutYok: '<path d="M7.2 18.5h9.6a4.1 4.1 0 0 0 .7-8.1 6 6 0 0 0-11.5-.9 4.5 4.5 0 0 0 1.2 9z"/><path d="M4 4l16 16"/>',
  saat: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
  uyari: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4.2M12 16.9v.2"/>',
  ata: '<path d="M12 5v14M5 12h14"/>',
};
const simge = (ad: string) => `<svg class="simge" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${SIMGE[ad] || ''}</svg>`;

const kodu = (e: unknown) => (e as { code?: string } | null)?.code || '';
export function ezberHataMetni(e: unknown): string {
  if ((e as Error)?.message === EZBER_CAKISMA) return 'Bu madde o arada başka bir cihazda değişti; ekrandaki güncel durum geçerli. Gerekirse yeniden dinleyin.';
  const k = kodu(e);
  if (k === 'permission-denied') return 'Kaydedilemedi: yetki yok (öğrencinin kaydı idari olarak kilitlenmiş olabilir).';
  if (k === 'unavailable') return 'Kaydedilemedi: sunucuya ulaşılamadı. Bağlantı gelince yeniden deneyin.';
  return `Kaydedilemedi: ${k || (e as Error)?.message || 'bilinmeyen hata'}.`;
}

/* ───────────────────────────── sınıf deposu (tek örnek) ───────────────────────────── */

export interface Dokunus extends EzberDokunusu {
  readonly ref: string;
  /** gidiyor: yerelde yazıldı, sunucu onayı bekleniyor · geri-aliniyor: geri alma yerelde, onay bekleniyor. */
  durum: 'gidiyor' | 'yazildi' | 'hata' | 'geri-aliniyor' | 'geri-alindi';
  hata: string;
  /** Sunucunun yanıtları: yazım ve (başladıysa) geri alma. Defter cümlesi bunlara göre eşitlenir. */
  yazim: 'bekliyor' | 'onay' | 'ret';
  geriAlma?: 'bekliyor' | 'onay' | 'ret';
  /** Deftere eklenen cümle (yalnız defterdeki dinlemede) ve şu an defterde olup olmadığı. */
  cumle?: string;
  cumleDefterde?: boolean;
}

interface SinifDeposu {
  readonly sinif: Sinif;
  durum(): { hazir: boolean; hata: string; onbellekten: boolean; bekleyen: number };
  abone(f: () => void): () => void;
  /** `sonuc`: sunucunun yanıtı gelince (çevrim dışıyken bağlantı gelince) çağrılır. */
  yaz(ref: string, once: OgeDurumu | undefined, gecis: Gecis, bugun: string, sonuc?: () => void): Dokunus;
  geriAl(d: Dokunus, sonuc?: () => void): void;
  /** Önceki oturumlardan kalıp sunucuya ulaşmamış yazımlar (inceleme D1); hoca kapatana kadar söylenir. */
  kayiplar(): readonly BekleyenYazim[];
  kayiplariKapat(): void;
}

/** Telefonun yerel deposu; gizli sekmede ya da kapalıysa `null` (bekleyen yazım defteri tutulmaz, ekran çalışır). */
const yerelDepo = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

let tekDepo: { db: Firestore; depo: SinifDeposu } | null = null;

/**
 * Bütün sınıfın `ezberDurum` belgeleri tek canlı dinlemeyle (öğrenci başına bir belge). Sekme ve defterdeki dinleme
 * aynı depoyu paylaşır; son abone ayrılınca dinleme kapanır (yazım kuyruğu Firestore'da sürer).
 */
function sinifDeposu(db: Firestore): SinifDeposu {
  if (tekDepo?.db === db) return tekDepo.depo;
  const sinif: Sinif = {};
  let hazir = false;
  let hata = '';
  let onbellekten = true;
  let bekleyenBelge = 0;
  let bekleyen = 0;
  const aboneler = new Set<() => void>();
  let birak: (() => void) | null = null;
  const bildir = () => aboneler.forEach((f) => f());
  const baslat = () => {
    birak = onSnapshot(collection(db, 'ezberDurum'), { includeMetadataChanges: true }, (s) => {
      for (const k of Object.keys(sinif)) delete sinif[k];
      for (const d of s.docs) sinif[d.id] = ezberDurumuOku(d.data());
      bekleyenBelge = s.docs.filter((d) => d.metadata.hasPendingWrites).length;
      onbellekten = s.metadata.fromCache;
      hazir = true;
      hata = '';
      bildir();
    }, (e) => {
      hata = kodu(e) || 'hata';
      birak = null;
      bildir();
    });
  };
  /**
   * Sunucu yanıtını dokunuşa işler. Durum yalnız beklenen durumdan ilerler: «Geri al» yazımın onayından önce başladıysa
   * gelen onay ekranı yeniden «Kaydedildi»ye çevirmez. İlk hata iletisi kalır (kök neden; ardından gelen geri alma reddi
   * onu ezmez).
   */
  const izle = (d: Dokunus, p: Promise<unknown>, bekleyenDurum: Dokunus['durum'], basari: Dokunus['durum'], sonuc: (basarili: boolean) => void) => {
    bekleyen++;
    bildir();
    p.then(() => {
      if (d.durum === bekleyenDurum) d.durum = basari;
      sonuc(true);
    }, (e) => {
      if (d.durum !== 'hata') {
        d.durum = 'hata';
        d.hata = ezberHataMetni(e);
      }
      sonuc(false);
    }).finally(() => {
      bekleyen--;
      bildir();
    });
  };
  // Önceki oturumlardan kalan yazımlar (inceleme D1): kuyruktakiler gönderildikten sonra olayları sunucuda aranır;
  // olayı olmayan yazım reddedilmiştir. Yalnız açılışta defterde olanlar sorulur (bu oturumunkiler kendi sözünü izler).
  const ls = yerelDepo();
  const oncekiler = new Set(bekleyenler(ls).map((y) => y.olayId));
  let kayip = kayiplar(ls);
  if (oncekiler.size)
    void waitForPendingWrites(db)
      .then(() => kayiplariBul(ls, async (y) => (await getDocFromServer(doc(db, 'ezberDurum', y.ref, 'olaylar', y.olayId))).exists(), { yalniz: oncekiler }))
      .then((yeni) => {
        if (!yeni.length) return;
        kayip = kayiplar(ls);
        bildir();
      }, () => {});
  const depo: SinifDeposu = {
    sinif,
    durum: () => ({ hazir, hata, onbellekten, bekleyen: Math.max(bekleyen, bekleyenBelge) }),
    abone(f) {
      aboneler.add(f);
      if (!birak) {
        hata = '';
        baslat();
      }
      return () => {
        aboneler.delete(f);
        if (!aboneler.size && birak) {
          birak();
          birak = null;
          hazir = false;
        }
      };
    },
    yaz(ref, once, gecis, bugun, sonuc) {
      const d0 = ezberDeposu(db, ref);
      const olayId = d0.olayKimligi();
      const d: Dokunus = { ref, id: gecis.olay.ezber, once, gecis, olayId, bugun, durum: 'gidiyor', hata: '', yazim: 'bekliyor' };
      bekleyenEkle(ls, { ref, olayId, id: d.id, tur: gecis.olay.tur, kalite: gecis.olay.kalite, zaman: Date.now() });
      izle(d, d0.uygula(gecis, olayId), 'gidiyor', 'yazildi', (basarili) => {
        d.yazim = basarili ? 'onay' : 'ret';
        bekleyenCikar(ls, olayId);
        sonuc?.();
      });
      return d;
    },
    geriAl(d, sonuc) {
      const simdi = sinif[d.ref]?.[d.id];
      d.durum = 'geri-aliniyor';
      d.geriAlma = 'bekliyor';
      bekleyenCikar(ls, d.olayId); // olay silinecek: sonraki açılışta «ulaşmadı» sanılmasın
      izle(d, ezberDeposu(db, d.ref).geriAl(d, simdi), 'geri-aliniyor', 'geri-alindi', (basarili) => {
        d.geriAlma = basarili ? 'onay' : 'ret';
        sonuc?.();
      });
    },
    kayiplar: () => kayip,
    kayiplariKapat() {
      kayiplariKapat(ls);
      kayip = [];
      bildir();
    },
  };
  tekDepo = { db, depo };
  return depo;
}

/**
 * Hoca girişinden sonra boşta çağrılır: tam SDK'yı açar ki önceki oturumdan telefonda kalmış ezber kayıtları (sınıfta
 * bağlantı yokken dokunulup sayfa kapatılmış olabilir) sekme açılmasa da gönderilsin.
 */
export function ezberOnYukle(app: FirebaseApp): void {
  try {
    void waitForPendingWrites(tamFirestore(app)).catch(() => {});
  } catch {
    /* Tam SDK açılamadıysa sekme açılınca yeniden denenir. */
  }
}

/* ───────────────────────────── dinleme katmanı (sekme + defter) ───────────────────────────── */

interface Secim {
  id: string | null;
  notlar: string[];
  zorla: boolean;
  /** Aynı madde az önce işlendiyse «Aynı maddeyi yeniden dinle» düğmeleri yeniden gösterir. */
  yeniden: boolean;
  elleAcik: boolean;
}

interface Katman {
  html(ref: string, ad: string): string;
  /** Tıklanan öğe bu katmanınsa işler ve `true` döner. */
  tikla(el: HTMLElement): boolean;
  degisti(el: HTMLElement): boolean;
  secimYap(ref: string, id: string): void;
  elleAc(ref: string, acik: boolean): void;
  /** Sunucudan sonradan gelen hataları ekran okuyucuya bildirir (yalnız yeni olanları). */
  yeniHatalar(): string[];
}

const SEVIYE_ADI = (s: string) => {
  if (s === 'kenar') return 'Kenar suyu';
  const t = KATALOG.seviyeler.find((x) => String(x.kimlik) === s);
  return t ? `${s} · ${t.ad.tr}` : s;
};

function dinlemeKatmani(o: {
  depo: SinifDeposu;
  bugun: string;
  hedefler: Readonly<Record<string, string>>;
  degisti: (duyuru?: string, odak?: string) => void;
  /** Defter: dinleme kaydedilince cümle eklenir, geri alınınca çıkar. */
  cumleEklendi?: (tr: string) => void;
  cumleKaldirildi?: (tr: string) => void;
}): Katman {
  const secimler = new Map<string, Secim>();
  const sonDokunus = new Map<string, Dokunus>();
  const bildirilenHata = new WeakSet<Dokunus>();
  const { depo, bugun, hedefler } = o;

  const ogeleri = (ref: string) => depo.sinif[ref] || {};
  const varsayilanSecim = (ref: string): string | null => {
    const on = ogrenciOnerisi(ogeleri(ref), bugun, hedefler);
    return on.kontrol[0] ?? on.calisiyor[0] ?? on.siradaki ?? null;
  };
  const secim = (ref: string): Secim => {
    let s = secimler.get(ref);
    if (!s) {
      s = { id: varsayilanSecim(ref), notlar: [], zorla: false, yeniden: false, elleAcik: false };
      secimler.set(ref, s);
    }
    return s;
  };
  const onizle = (ref: string, id: string, k: Kalite): Gecis | null => {
    const s = secim(ref);
    try {
      return dinle(ogeleri(ref)[id], id, k, bugun, { notlar: s.notlar, zorla: s.zorla });
    } catch {
      return null;
    }
  };
  const kontrolMetni = (d: OgeDurumu | undefined) => {
    if (!d || !d.sonrakiKontrol) return '';
    const fark = gunFarki(bugun, d.sonrakiKontrol);
    if (fark > 0) return `kontrol ${gunYaz(d.sonrakiKontrol)} (${fark} gün sonra)`;
    if (fark === 0) return 'kontrol günü bugün';
    return `kontrol günü ${-fark} gün önce geldi`;
  };
  const ozet = (d: Dokunus) => {
    const g = d.gecis;
    const ad = ezberBul(d.id)?.ad.tr || d.id;
    const olay = g.olay;
    if (olay.tur === 'dinleme') {
      const k = KALITE_ETIKETI[olay.kalite as Kalite] || '';
      if (g.islem === 'yaz') {
        const sk = g.durum.sonrakiKontrol;
        return `${ad}: ${k} → ${BASAMAK_ADLARI[g.durum.basamak].tr}${sk ? ` · sonraki kontrol ${gunYaz(sk)}` : ''}`;
      }
      return `${ad}: ${k} · basamak değişmedi (${BASAMAK_ADLARI[olay.basamakOnce].tr})`;
    }
    if (olay.tur === 'atama') return `${ad}: çalışmaya başladı`;
    return g.islem === 'sil' ? `${ad}: kaydı kaldırıldı` : `${ad}: basamak elle «${BASAMAK_ADLARI[olay.basamakSonra].tr}» yapıldı`;
  };
  /**
   * Defter cümlesi dinlemenin kaydını izler (inceleme D2): dinleme kayıtlıysa (reddedilmedi, geri alınmadı ya da geri
   * alma reddedildi) cümle defterde durur, değilse çıkar. Ekran yazımı beklemez; sunucu yanıtı gelince yeniden eşitlenir.
   */
  const cumleEsitle = (d: Dokunus) => {
    if (!d.cumle) return;
    const olmali = d.yazim !== 'ret' && d.geriAlma !== 'bekliyor' && d.geriAlma !== 'onay';
    if (olmali && !d.cumleDefterde) {
      d.cumleDefterde = true;
      o.cumleEklendi?.(d.cumle);
    } else if (!olmali && d.cumleDefterde) {
      d.cumleDefterde = false;
      o.cumleKaldirildi?.(d.cumle);
    }
  };
  const kaydet = (ref: string, gecis: Gecis | null) => {
    if (!gecis) return;
    const once = ogeleri(ref)[gecis.olay.ezber];
    const d = depo.yaz(ref, once, gecis, bugun, () => cumleEsitle(d));
    sonDokunus.set(ref, d);
    const s = secim(ref);
    s.notlar = [];
    s.zorla = false;
    s.yeniden = false;
    s.elleAcik = false;
    if (gecis.olay.tur === 'dinleme' && gecis.olay.kalite && o.cumleEklendi) {
      d.cumle = defterCumlesi(gecis.olay.ezber, gecis.olay.kalite as Kalite).tr;
      cumleEsitle(d);
    }
    o.degisti(`${depo.durum().onbellekten ? 'Telefonda tutuluyor' : 'Kaydedildi'}: ${ozet(d)}.`, `geri-${ref}`);
  };

  const oneriHtml = (ref: string, s: Secim) => {
    const ogeler = ogeleri(ref);
    const on = ogrenciOnerisi(ogeler, bugun, hedefler);
    const liste: { id: string; etiket: string }[] = [
      ...on.kontrol.map((id) => ({ id, etiket: 'kontrol' })),
      ...on.calisiyor.map((id) => ({ id, etiket: 'çalışıyor' })),
      ...(on.siradaki ? [{ id: on.siradaki, etiket: 'sıradaki' }] : []),
    ].slice(0, 6);
    if (s.id && !liste.some((x) => x.id === s.id)) liste.unshift({ id: s.id, etiket: 'seçilen' });
    return liste.map((x) => {
      const m = ezberBul(x.id);
      const b = gorunenBasamak(ogeler, x.id);
      return `<button type="button" class="ez-oneri" aria-pressed="${x.id === s.id}" data-ez-madde="${esc(x.id)}" data-ref="${esc(ref)}" data-odak="madde-${esc(ref)}-${esc(x.id)}">${isaret(b)}<span class="ez-oneri-ad">${esc(m?.ad.tr || x.id)}</span><span class="ez-oneri-et">${esc(x.etiket)}</span></button>`;
    }).join('');
  };
  const baskaHtml = (ref: string, s: Secim) => {
    const ogeler = ogeleri(ref);
    return `<select data-ez-baska="${esc(ref)}" data-odak="baska-${esc(ref)}"><option value="">Katalogdan seçin…</option>${SEVIYE_SIRASI.map((sv) => `<optgroup label="${esc(SEVIYE_ADI(String(sv)))}">${seviyeOgeleri(sv).map((m) => {
      const b = gorunenBasamak(ogeler, m.id);
      return `<option value="${esc(m.id)}"${m.id === s.id ? ' selected' : ''}>${esc(m.ad.tr)}${b ? ` — ${esc(BASAMAK_ADLARI[b].tr)}` : ''}</option>`;
    }).join('')}</optgroup>`).join('')}</select>`;
  };
  const sonucHtml = (ref: string, d: Dokunus, s: Secim, buyuk: boolean) => {
    const st = depo.durum();
    const baslik = d.durum === 'hata' ? d.hata
      : d.durum === 'gidiyor' ? (st.onbellekten ? 'Telefonda tutuluyor; bağlantı gelince gönderilecek.' : 'Kaydediliyor…')
      : d.durum === 'yazildi' ? 'Kaydedildi.'
      : d.durum === 'geri-aliniyor' ? `Geri alındı; ${st.onbellekten ? 'bağlantı gelince gönderilecek.' : 'gönderiliyor…'}`
      : 'Geri alındı.';
    const tur = d.durum === 'hata' ? 'hata' : d.durum.startsWith('geri') ? 'geri' : 'tamam';
    const ikon = simge(tur === 'hata' ? 'uyari' : tur === 'geri' ? 'geri' : 'onay');
    const dugmeler = [
      d.durum === 'gidiyor' || d.durum === 'yazildi' ? `<button type="button" class="ez-ikincil" data-ez-geri="${esc(ref)}" data-odak="geri-${esc(ref)}">${simge('geri')}Geri al</button>` : '',
      buyuk && !s.yeniden && (d.durum === 'gidiyor' || d.durum === 'yazildi') ? `<button type="button" class="ez-ikincil" data-ez-yeniden="${esc(ref)}" data-odak="yeniden-${esc(ref)}">Aynı maddeyi yeniden dinle</button>` : '',
    ].join('');
    return `<div class="ez-sonuc ${tur}${buyuk ? ' buyuk' : ''}" data-ez-sonuc="${esc(ref)}">
      <p class="ez-sonuc-metin">${ikon}<span><b>${esc(baslik)}</b>${d.durum === 'hata' ? '' : ` ${esc(ozet(d))}`}</span></p>
      ${dugmeler ? `<div class="ez-sonuc-dugmeler">${dugmeler}</div>` : ''}
    </div>`;
  };

  return {
    html(ref, ad) {
      const s = secim(ref);
      const ogeler = ogeleri(ref);
      const id = s.id;
      const m = id ? ezberBul(id) : undefined;
      const d = id ? ogeler[id] : undefined;
      const gorunen: Basamak = id ? gorunenBasamak(ogeler, id) : 0;
      const kapsayan = id ? kapsayanMaddeler(id).find((k) => ogeler[k] && ogeler[k].basamak === gorunen && gorunen > (d?.basamak ?? 0)) : undefined;
      const son = sonDokunus.get(ref);
      const ayni = Boolean(son && id && son.id === id);
      const bekleyenOnay = Boolean(son && ayni && !s.yeniden && (son.durum === 'gidiyor' || son.durum === 'yazildi'));
      const vadeli = kontrolGeldi(d, bugun) && (d?.basamak ?? 0) < 4;
      const erken = d && (d.basamak === 2 || d.basamak === 3) && !kontrolGeldi(d, bugun);
      const notDolu = s.notlar.length >= NOT_SINIRI;
      const secilenNotlar = NOT_KALIPLARI.filter((n) => s.notlar.includes(n.anahtar));
      const sonucGoster = son && (ayni || son.durum === 'gidiyor' || son.durum === 'yazildi' || son.durum === 'hata');
      return `<div class="ez-dinle-ic" data-ez-dinle="${esc(ref)}">
        <div class="ez-bolum">
          <p class="ez-etiket" id="ez-madde-${esc(ref)}">Madde<span class="sr-only"> · ${esc(ad)}</span></p>
          <div class="ez-oneriler" role="group" aria-labelledby="ez-madde-${esc(ref)}">${oneriHtml(ref, s) || '<span class="kucuk">Önerilecek madde kalmadı; katalogdan seçin.</span>'}</div>
          <label class="ez-baska"><span>Başka madde</span>${baskaHtml(ref, s)}</label>
        </div>
        ${m ? `<p class="ez-madde-durum">${isaret(gorunen, vadeli)}<span><b>${esc(m.ad.tr)}</b> · ${esc(BASAMAK_ADLARI[gorunen].tr)}${kapsayan ? ` <span class="kucuk">(${esc(ezberBul(kapsayan)?.ad.tr || kapsayan)} kaydından)</span>` : ''}${kontrolMetni(d) ? ` · <span class="${vadeli ? 'ez-vade' : ''}">${esc(kontrolMetni(d))}</span>` : ''}</span></p>
        ${sonucGoster && son ? sonucHtml(ref, son, s, bekleyenOnay) : ''}
        ${bekleyenOnay ? '' : `${erken ? `<label class="ez-zorla"><input type="checkbox" data-ez-zorla="${esc(ref)}" data-odak="zorla-${esc(ref)}"${s.zorla ? ' checked' : ''}><span>Kontrol günü (${esc(gunYaz(d!.sonrakiKontrol))}) gelmedi; «Tam» ve «Az hatalı» yine de ilerletsin</span></label>` : ''}
        <fieldset class="ez-notlar"><legend class="ez-etiket">Veliye not <span class="ez-etiket-ek">isteğe bağlı · en çok ${NOT_SINIRI}</span></legend>
          <div class="ez-not-cipler">${NOT_KALIPLARI.map((n) => {
            const secili = s.notlar.includes(n.anahtar);
            return `<button type="button" class="ez-not" aria-pressed="${secili}" data-ez-not="${esc(n.anahtar)}" data-ref="${esc(ref)}" data-odak="not-${esc(ref)}-${esc(n.anahtar)}"${!secili && notDolu ? ' disabled' : ''} title="${esc(n.metin.tr)}">${secili ? simge('onay') : ''}${esc(n.etiket)}</button>`;
          }).join('')}</div>
          ${secilenNotlar.length ? `<p class="ez-not-onizleme">Veli görecek: ${secilenNotlar.map((n) => `«${esc(n.metin.tr)}»`).join(' ')}</p>` : ''}
        </fieldset>
        <div class="ez-kaliteler" role="group" aria-label="Dinleme sonucu — dokununca kaydedilir">${KALITELER.map((k) => {
          const g = onizle(ref, id!, k);
          const alt = !g ? '' : g.islem === 'yaz' ? `→ ${BASAMAK_ADLARI[g.durum.basamak].tr}` : g.olay.basamakOnce === 4 ? 'Kalıcı; kayda düşülür' : 'Basamak değişmez';
          return `<button type="button" class="ez-k ${k}" data-ez-kalite="${k}" data-ref="${esc(ref)}" data-odak="kalite-${esc(ref)}-${k}"><span class="ez-k-ad">${esc(KALITE_ETIKETI[k])}</span><span class="ez-k-alt">${esc(alt)}</span></button>`;
        }).join('')}</div>`}
        <div class="ez-alt-eylem">
          ${gorunen === 0 && !d && !bekleyenOnay ? `<button type="button" class="ez-ikincil" data-ez-ata="${esc(ref)}" data-odak="ata-${esc(ref)}">${simge('ata')}Dinlemeden çalışmaya başlat</button>` : ''}
          <details class="ez-elle" data-ez-elle-kutu="${esc(ref)}"${s.elleAcik ? ' open' : ''}><summary data-odak="elleac-${esc(ref)}">Basamağı elle düzelt</summary>
            <div class="ez-elle-ic"><label><span>Yeni basamak</span><select data-ez-elle-sec="${esc(ref)}" data-odak="ellesec-${esc(ref)}">${([4, 3, 2, 1, 0] as Basamak[]).map((b) => `<option value="${b}"${b === (d?.basamak ?? 0) ? ' selected' : ''}>${b === 0 ? 'Kaydı kaldır (Başlanmadı)' : esc(BASAMAK_ADLARI[b].tr)}</option>`).join('')}</select></label>
            <button type="button" class="ez-ikincil" data-ez-elle="${esc(ref)}" data-odak="elle-${esc(ref)}">Uygula</button>
            <p class="kucuk">Dinleme sayılmaz; kontrol günü basamaktan yeniden hesaplanır (Hocaya okudu +7, Pekişti +30 gün). Veli geçmişinde «düzeltme» olarak görünür.</p></div>
          </details>
        </div>` : ''}
      </div>`;
    },
    tikla(el) {
      const ref = el.dataset.ref || el.dataset.ezGeri || el.dataset.ezYeniden || el.dataset.ezAta || el.dataset.ezElle || '';
      if (!ref) return false;
      const s = secim(ref);
      try {
        if (el.dataset.ezMadde) {
          s.id = el.dataset.ezMadde;
          s.zorla = false;
          s.yeniden = false;
          o.degisti();
          return true;
        }
        if (el.dataset.ezNot) {
          const k = el.dataset.ezNot;
          s.notlar = s.notlar.includes(k) ? s.notlar.filter((x) => x !== k) : s.notlar.length < NOT_SINIRI ? [...s.notlar, k] : s.notlar;
          o.degisti();
          return true;
        }
        if (el.dataset.ezKalite) {
          if (s.id) kaydet(ref, dinle(ogeleri(ref)[s.id], s.id, el.dataset.ezKalite as Kalite, bugun, { notlar: s.notlar, zorla: s.zorla }));
          return true;
        }
        if (el.dataset.ezAta) {
          if (s.id) kaydet(ref, ata(ogeleri(ref)[s.id], s.id, bugun));
          return true;
        }
        if (el.dataset.ezGeri) {
          const d = sonDokunus.get(ref);
          if (d && (d.durum === 'gidiyor' || d.durum === 'yazildi')) {
            depo.geriAl(d, () => cumleEsitle(d));
            cumleEsitle(d);
            s.yeniden = false;
            o.degisti(`Geri alındı: ${ozet(d)}.`, `kalite-${ref}-tam`);
          }
          return true;
        }
        if (el.dataset.ezYeniden) {
          s.yeniden = true;
          o.degisti(undefined, `kalite-${ref}-tam`);
          return true;
        }
        if (el.dataset.ezElle) {
          const sec = el.closest('.ez-elle')?.querySelector<HTMLSelectElement>('[data-ez-elle-sec]');
          if (!s.id || !sec) return true;
          const once = ogeleri(ref)[s.id];
          const g = duzelt(once, s.id, elleBasamak(Number(sec.value) as Basamak, once, bugun), bugun);
          if (g) kaydet(ref, g);
          else {
            s.elleAcik = false;
            o.degisti('Basamak zaten böyle; değişiklik yok.', `elleac-${ref}`);
          }
          return true;
        }
      } catch (e) {
        o.degisti((e as Error).message);
        return true;
      }
      return false;
    },
    degisti(el) {
      if (el instanceof HTMLSelectElement && el.dataset.ezBaska) {
        if (!el.value) return true;
        const s = secim(el.dataset.ezBaska);
        s.id = el.value;
        s.zorla = false;
        s.yeniden = false;
        o.degisti();
        return true;
      }
      if (el instanceof HTMLInputElement && el.dataset.ezZorla) {
        secim(el.dataset.ezZorla).zorla = el.checked;
        o.degisti();
        return true;
      }
      return false;
    },
    secimYap(ref, id) {
      const s = secim(ref);
      if (s.id !== id) {
        s.id = id;
        s.zorla = false;
        s.yeniden = false;
      }
    },
    elleAc(ref, acik) {
      secim(ref).elleAcik = acik;
    },
    yeniHatalar() {
      const yeni: string[] = [];
      for (const d of sonDokunus.values())
        if (d.durum === 'hata' && !bildirilenHata.has(d)) {
          bildirilenHata.add(d);
          yeni.push(d.hata);
        }
      return yeni;
    },
  };
}

/* ───────────────────────────── ortak çizim ───────────────────────────── */

/** Yeniden çizimde odak ve yatay kaydırma korunur (sınıfta hoca dokunurken ekran zıplamasın). */
function yenidenCiz(kok: HTMLElement, html: string, odakIste: string | null) {
  const aktif = document.activeElement instanceof HTMLElement && kok.contains(document.activeElement)
    ? document.activeElement.closest<HTMLElement>('[data-odak]')?.dataset.odak : undefined;
  const kaydirma = [...kok.querySelectorAll<HTMLElement>('[data-kaydirma]')].map((x) => [x.dataset.kaydirma, x.scrollLeft] as const);
  kok.innerHTML = html;
  for (const [ad, x] of kaydirma) {
    const el = kok.querySelector<HTMLElement>(`[data-kaydirma="${ad}"]`);
    if (el) el.scrollLeft = x;
  }
  const hedef = odakIste ?? aktif;
  if (hedef) kok.querySelector<HTMLElement>(`[data-odak="${CSS.escape(hedef)}"]`)?.focus({ preventScroll: true });
}

function baglantiHtml(depo: SinifDeposu): string {
  const st = depo.durum();
  const [tur, ikon, metin] = st.hata ? ['hata', 'uyari', 'Ezber kayıtları okunamadı']
    : !st.hazir ? ['', 'saat', 'Yükleniyor…']
    : st.bekleyen && st.onbellekten ? ['bekliyor', 'bulutYok', `Bağlantı yok · ${st.bekleyen} kayıt telefonda bekliyor`]
    : st.bekleyen ? ['', 'bulut', `${st.bekleyen} kayıt gönderiliyor…`]
    : st.onbellekten ? ['bekliyor', 'bulutYok', 'Bağlantı yok · kayıtlar telefonda tutulur']
    : ['tamam', 'bulut', 'Bütün kayıtlar gönderildi'];
  return `<span class="ez-baglanti ${tur}">${simge(ikon)}<span>${esc(metin)}</span></span>`;
}

/**
 * Sabit iskelet (başlık, bağlantı rozeti, ekran okuyucu duyurusu) bir kez çizilir; değişken gövde her değişiklikte.
 * Açık bir seçim listesi (telefonun yerel seçicisi) varken gelen canlı güncelleme gövdeyi yeniden çizmez; liste
 * kapanınca çizilir — yoksa hocanın seçimi elinden kayardı.
 */
function iskelet(kok: HTMLElement, basHtml: string, cizGovde: () => string, depo: SinifDeposu, signal: AbortSignal) {
  kok.innerHTML = `${basHtml}<p class="sr-only" data-ez-duyuru role="status" aria-live="polite"></p><div class="ez-govde" data-ez-govde></div>`;
  const govde = kok.querySelector<HTMLElement>('[data-ez-govde]')!;
  const duyuruEl = kok.querySelector<HTMLElement>('[data-ez-duyuru]')!;
  let sonRozet = '';
  let ertelendi = false;
  const rozet = () => {
    const r = kok.querySelector<HTMLElement>('[data-ez-baglanti]');
    const h = baglantiHtml(depo);
    if (r && h !== sonRozet) {
      r.innerHTML = h;
      sonRozet = h;
    }
  };
  /** Kullanıcı eylemi: hemen çizilir; `odak` verilirse odak oraya taşınır. */
  const ciz = (odak: string | null = null) => {
    ertelendi = false;
    rozet();
    yenidenCiz(govde, cizGovde(), odak);
  };
  /** Canlı veri: seçim listesi açıkken ertelenir. */
  const canliCiz = () => {
    rozet();
    if (document.activeElement instanceof HTMLSelectElement && govde.contains(document.activeElement)) {
      ertelendi = true;
      return;
    }
    ciz();
  };
  govde.addEventListener('focusout', () => {
    if (ertelendi) window.setTimeout(() => { if (ertelendi && !signal.aborted) canliCiz(); }, 0);
  }, { signal });
  const duyur = (metin: string) => {
    duyuruEl.textContent = '';
    if (metin) window.setTimeout(() => { duyuruEl.textContent = metin; }, 30);
  };
  return { ciz, canliCiz, duyur };
}

/* ───────────────────────────── «Ezber» sekmesi ───────────────────────────── */

export interface EzberPaneliSecenek {
  app: FirebaseApp;
  /** Aktif öğrenciler (soyad-ad sırasıyla). */
  ogrenciler: () => readonly EzberOgrencisi[];
  /** Günün yoklaması: öğrenci → ders durumları; o gün hiç kayıt yoksa `null`. */
  yoklama: (tarih: string) => Promise<Record<string, string[]> | null>;
  gunler: readonly EzberPlanGunu[];
  bugun: string;
  /** Öğrenci kartındaki «Ezber sekmesinde aç»: bu öğrencinin kartı açık gelir. */
  baslangicRef?: string;
}

type Gorunum = 'bugun' | 'tekrar' | 'tablo';

export function ezberPaneli(kok: HTMLElement, s: EzberPaneliSecenek): { temizle(): void; ayrilabilir(): boolean } {
  const depo = sinifDeposu(tamFirestore(s.app));
  const hedefler = sinifHedefleri({ gunler: s.gunler.map((g) => ({ tarih: g.tarih, dersler: g.dersler })) });
  const gun = s.gunler.find((g) => g.tarih === s.bugun);
  const ac = new AbortController();
  let gorunum: Gorunum = 'bugun';
  let acik = s.baslangicRef || '';
  let yoklama: Record<string, string[]> | null | undefined;
  let tabloHucre: { ref: string; id: string } | null = null;
  let kapali = false;
  const TABLO_BOLUMLERI = bolumler().filter((b) => b.anahtar !== '8');
  let serit = (() => {
    // Varsayılan şerit: bugüne kadar sınıf hedefi olan son maddenin şeridi (yoksa 1).
    const son = Object.entries(hedefler).filter(([, t]) => t <= s.bugun).sort((a, b) => b[1].localeCompare(a[1]) || a[0].localeCompare(b[0]))[0]?.[0];
    return TABLO_BOLUMLERI.find((b) => son && b.ogeler.includes(son))?.anahtar ?? '1';
  })();

  const gunBasligi = gun
    ? `${gunYaz(s.bugun, { weekday: 'long', day: 'numeric', month: 'long' })} · ${gun.hafta}. hafta`
    : gunYaz(s.bugun, { weekday: 'long', day: 'numeric', month: 'long' });
  const { ciz, canliCiz, duyur } = iskelet(kok, `<div class="ez-ust">
      <h2>${simge('ezber')}Ezber <span class="kucuk ez-gun">${esc(gunBasligi)}</span></h2>
      <p class="ez-baglanti-kap" data-ez-baglanti></p>
    </div>`, () => govdeHtml(), depo, ac.signal);
  const katman = dinlemeKatmani({ depo, bugun: s.bugun, hedefler, degisti: (d, odak) => { ciz(odak ?? null); if (d) duyur(d); } });

  const adi = (ref: string) => {
    const o = s.ogrenciler().find((x) => x.ref === ref);
    return o ? adSoyad(o) : ref;
  };
  const geldi = (ref: string) => (yoklama?.[ref] || []).some((v) => v === 'var' || v === 'gec');
  const yoklamaVar = () => Boolean(yoklama && Object.keys(yoklama).length);
  const vadeliler = () => s.ogrenciler().map((o) => ({ o, ids: kontrolSirasi(depo.sinif[o.ref] || {}, s.bugun) })).filter((x) => x.ids.length);
  const maddeAdi = (id: string) => esc(ezberBul(id)?.ad.tr || id);
  /** Tablo sütun başlığı: tireli sözcük bölünmez («Kelime-i» alt satıra «i» bırakmaz). */
  const sutunAdi = (ad: string) => esc(ad).split(' ').map((w) => (w.includes('-') ? `<span class="ez-nw">${w}</span>` : w)).join(' ');

  const kartHtml = (o: EzberOgrencisi, alt: string, etiket = '') => {
    const acikMi = acik === o.ref;
    const vade = kontrolSirasi(depo.sinif[o.ref] || {}, s.bugun).length;
    return `<li class="ez-kart"${acikMi ? ' data-acik' : ''}>
      <button type="button" class="ez-kart-bas" data-ez-ac="${esc(o.ref)}" aria-expanded="${acikMi}" aria-controls="ez-d-${esc(o.ref)}" data-odak="ac-${esc(o.ref)}">
        <span class="ez-kart-ad">${esc(adSoyad(o))}${etiket ? ` <span class="ez-etiket-yan">${esc(etiket)}</span>` : ''}</span>
        <span class="ez-kart-alt">${alt}</span>
        ${vade ? `<span class="ez-rozet">${simge('saat')}${vade} kontrol</span>` : ''}
        <span class="ez-kart-ok">${simge('ok')}</span>
      </button>
      <div class="ez-dinle" id="ez-d-${esc(o.ref)}"${acikMi ? '' : ' hidden'}>${acikMi ? katman.html(o.ref, adSoyad(o)) : ''}</div>
    </li>`;
  };
  const altSatir = (ref: string) => {
    const on = ogrenciOnerisi(depo.sinif[ref] || {}, s.bugun, hedefler);
    const liste = (ids: readonly string[]) => `${ids.slice(0, 2).map(maddeAdi).join(', ')}${ids.length > 2 ? ` +${ids.length - 2}` : ''}`;
    if (on.kontrol.length) return `Kontrol: ${liste(on.kontrol)}`;
    if (on.calisiyor.length) return `Çalışıyor: ${liste(on.calisiyor)}`;
    return on.siradaki ? `Sıradaki: ${maddeAdi(on.siradaki)}` : 'Katalog tamam';
  };

  const bugunHtml = () => {
    const aktif = s.ogrenciler();
    if (!aktif.length) return `<p class="bos">${simge('ezber')}<span>Aktif öğrenci yok.</span></p>`;
    let liste = aktif;
    let not = '';
    if (!gun) not = 'Bugün ders günü değil; bütün aktif öğrenciler gösteriliyor.';
    else if (yoklama === undefined) not = 'Yoklama okunuyor…';
    else if (!yoklamaVar()) not = 'Bugünün yoklaması henüz işaretlenmedi; bütün aktif öğrenciler gösteriliyor.';
    else {
      liste = aktif.filter((o) => geldi(o.ref));
      const gelmeyen = aktif.length - liste.length;
      if (gelmeyen) not = `Yoklamaya göre ${liste.length} öğrenci geldi; gelmeyen ${gelmeyen} öğrencinin kontrolleri «Tekrar»da.`;
    }
    const ekler = acik && !liste.some((o) => o.ref === acik) ? aktif.filter((o) => o.ref === acik) : [];
    return `${not ? `<p class="ez-bilgi">${esc(not)}</p>` : ''}
      <ul class="ez-liste">${[...ekler.map((o) => kartHtml(o, altSatir(o.ref), 'yoklamada yok')), ...liste.map((o) => kartHtml(o, altSatir(o.ref)))].join('')}</ul>`;
  };
  const tekrarHtml = () => {
    const ilk = (x: { o: EzberOgrencisi; ids: string[] }) => depo.sinif[x.o.ref][x.ids[0]].sonrakiKontrol;
    const v = vadeliler().sort((a, b) => ilk(a).localeCompare(ilk(b)));
    if (!v.length) return `<p class="bos">${simge('onay')}<span>Kontrol günü gelen ezber yok.</span></p>`;
    return `<p class="ez-bilgi">Kontrol günü gelen maddeler, en eskisi önce. Karta dokununca ilk madde seçili açılır.</p>
      <ul class="ez-liste">${v.map(({ o, ids }) => {
        const og = depo.sinif[o.ref];
        const alt = ids.slice(0, 3).map((id) => `${maddeAdi(id)} <span class="ez-tarih">${esc(gunYaz(og[id].sonrakiKontrol, { day: 'numeric', month: 'short' }))}</span>`).join(', ') + (ids.length > 3 ? ` +${ids.length - 3}` : '');
        return kartHtml(o, alt, yoklamaVar() && !geldi(o.ref) ? 'bugün yok' : '');
      }).join('')}</ul>`;
  };
  const seritAdi = (x: Bolum) => {
    if (x.durak !== undefined) {
      const kisa = (id: string) => (ezberBul(id)?.ad.tr || id).replace(/ Sûresi$/, '');
      return `8.${x.durak} · Amme ${x.durak}. durak (${kisa(x.ogeler[0])} – ${kisa(x.ogeler[x.ogeler.length - 1])})`;
    }
    return SEVIYE_ADI(String(x.seviye));
  };
  const tabloHtml = () => {
    const b = TABLO_BOLUMLERI.find((x) => x.anahtar === serit) || TABLO_BOLUMLERI[0];
    const aktif = s.ogrenciler();
    const maddeler = b.ogeler.map((id) => ezberBul(id)).filter((m): m is NonNullable<typeof m> => Boolean(m));
    const h = tabloHucre;
    return `<div class="ez-tablo-ust">
        <label class="ez-serit"><span>Şerit</span><select data-ez-serit data-odak="serit">${TABLO_BOLUMLERI.map((x) => `<option value="${esc(x.anahtar)}"${x.anahtar === b.anahtar ? ' selected' : ''}>${esc(seritAdi(x))}</option>`).join('')}</select></label>
        <ul class="ez-lejant" aria-label="İşaretlerin anlamı">${([0, 1, 2, 3, 4] as Basamak[]).map((x) => `<li>${isaret(x)}<span>${esc(BASAMAK_ADLARI[x].tr)}</span></li>`).join('')}<li>${isaret(2, true)}<span>Kontrol günü geldi</span></li></ul>
      </div>
      ${aktif.length ? `<div class="ez-tablo-kap" data-kaydirma="tablo" role="region" aria-label="${esc(seritAdi(b))}: öğrenci ve madde tablosu" tabindex="0">
        <table class="ez-tablo">
          <thead><tr><th scope="col" class="ez-tablo-ogr">Öğrenci</th>${maddeler.map((m) => `<th scope="col" title="${esc(m.ad.tr)}"><span>${sutunAdi(m.ad.tr)}</span></th>`).join('')}</tr></thead>
          <tbody>${aktif.map((o) => {
            const og = depo.sinif[o.ref] || {};
            return `<tr><th scope="row" class="ez-tablo-ogr">${esc(adSoyad(o))}</th>${maddeler.map((m) => {
              const g = gorunenBasamak(og, m.id);
              const vade = kontrolGeldi(og[m.id], s.bugun) && og[m.id].basamak < 4;
              const secili = h?.ref === o.ref && h.id === m.id;
              return `<td><button type="button" class="ez-hucre" aria-pressed="${secili}" data-ez-hucre="${esc(o.ref)}" data-id="${esc(m.id)}" data-odak="hucre-${esc(o.ref)}-${esc(m.id)}" aria-label="${esc(`${adSoyad(o)} — ${m.ad.tr}: ${BASAMAK_ADLARI[g].tr}${vade ? ', kontrol günü geldi' : ''}`)}">${isaret(g, vade)}</button></td>`;
            }).join('')}</tr>`;
          }).join('')}</tbody>
        </table></div>` : `<p class="bos">${simge('ezber')}<span>Aktif öğrenci yok.</span></p>`}
      ${h ? `<div class="ez-tablo-dinle" id="ez-tablo-dinle">
          <div class="ez-tablo-dinle-bas"><h3>${esc(adi(h.ref))}</h3><button type="button" class="ez-ikincil" data-ez-hucre-kapat data-odak="hucrekapat">${simge('kapat')}Kapat</button></div>
          <div class="ez-dinle">${katman.html(h.ref, adi(h.ref))}</div>
        </div>` : '<p class="ez-bilgi">Bir hücreye dokunun: o öğrencinin o maddesi için dinleme ve elle düzeltme aşağıda açılır.</p>'}`;
  };
  const govdeHtml = () => {
    const st = depo.durum();
    const vadeSayi = st.hazir ? vadeliler().reduce((t, x) => t + x.ids.length, 0) : 0;
    const dugme = (g: Gorunum, ad: string, sayi = 0) => `<button type="button" class="ez-gorunum-dugme" aria-pressed="${gorunum === g}" data-ez-gorunum="${g}" data-odak="gorunum-${g}">${ad}${sayi ? `<span class="ez-sayi"><span class="sr-only">, kontrolü gelen madde: </span>${sayi}</span>` : ''}</button>`;
    for (const h of katman.yeniHatalar()) duyur(h);
    const icerik = st.hata ? `<p class="not hata">Ezber kayıtları okunamadı (${esc(st.hata)}). Bağlantınızı kontrol edip sekmeyi yeniden açın.</p>`
      : !st.hazir ? '<p class="ez-bilgi">Ezber kayıtları yükleniyor…</p>'
      : gorunum === 'bugun' ? bugunHtml() : gorunum === 'tekrar' ? tekrarHtml() : tabloHtml();
    return `${kayipHtml()}<div class="ez-gorunum" role="group" aria-label="Görünüm">${dugme('bugun', 'Bugün')}${dugme('tekrar', 'Tekrar', vadeSayi)}${dugme('tablo', 'Tablo')}</div>${icerik}`;
  };
  /** Önceki oturumdan sunucuya ulaşmamış yazımlar (inceleme D1): öğrenci adı ve madde ile, «Anladım» deyince kalkar. */
  const kayipHtml = () => {
    const l = depo.kayiplar();
    if (!l.length) return '';
    const ne = (y: BekleyenYazim) => (y.tur === 'dinleme' ? `dinleme (${KALITE_ETIKETI[y.kalite as Kalite] || y.kalite})`
      : y.tur === 'atama' ? 'çalışmaya başladı' : 'elle düzeltme');
    const ogr = (ref: string) => s.ogrenciler().find((x) => x.ref === ref);
    const zaman = (ms: number) => new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Brussels', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
    return `<div class="ez-sonuc hata ez-kayip" data-ez-kayip>
      <p class="ez-sonuc-metin">${simge('uyari')}<span><b>Önceki bir oturumdan ${l.length} ezber kaydı sunucuya ulaşmadı.</b> O arada başka bir cihazda değişmiş ya da öğrencinin kaydı kilitlenmiş olabilir; gerekirse yeniden dinleyip işleyin.</span></p>
      <ul class="ez-kayip-liste">${l.map((y) => {
        const o = ogr(y.ref);
        return `<li>${esc(o ? adSoyad(o) : 'Kaydı silinmiş öğrenci')} — ${esc(ezberBul(y.id)?.ad.tr || y.id)} · ${esc(ne(y))} · <span class="ez-tarih">${esc(zaman(y.zaman))}</span></li>`;
      }).join('')}</ul>
      <div class="ez-sonuc-dugmeler"><button type="button" class="ez-ikincil" data-ez-kayip-kapat data-odak="kayip-kapat">${simge('onay')}Anladım</button></div>
    </div>`;
  };

  kok.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-ez-gorunum],[data-ez-ac],[data-ez-hucre],[data-ez-hucre-kapat],[data-ez-kayip-kapat],[data-ez-madde],[data-ez-not],[data-ez-kalite],[data-ez-ata],[data-ez-geri],[data-ez-yeniden],[data-ez-elle]');
    if (!el || !kok.contains(el)) return;
    if (el.hasAttribute('data-ez-kayip-kapat')) {
      depo.kayiplariKapat();
      ciz(`gorunum-${gorunum}`);
      return;
    }
    if (el.dataset.ezGorunum) {
      gorunum = el.dataset.ezGorunum as Gorunum;
      ciz(`gorunum-${gorunum}`);
      return;
    }
    if (el.dataset.ezAc) {
      const ref = el.dataset.ezAc;
      acik = acik === ref ? '' : ref;
      if (acik && gorunum === 'tekrar') {
        const ilk = kontrolSirasi(depo.sinif[ref] || {}, s.bugun)[0];
        if (ilk) katman.secimYap(ref, ilk);
      }
      ciz(`ac-${ref}`);
      if (acik) kok.querySelector(`[data-ez-ac="${CSS.escape(ref)}"]`)?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (el.dataset.ezHucre) {
      tabloHucre = { ref: el.dataset.ezHucre, id: el.dataset.id || '' };
      katman.secimYap(tabloHucre.ref, tabloHucre.id);
      ciz(`hucre-${tabloHucre.ref}-${tabloHucre.id}`);
      kok.querySelector('#ez-tablo-dinle')?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (el.hasAttribute('data-ez-hucre-kapat')) {
      const h = tabloHucre;
      tabloHucre = null;
      ciz(h ? `hucre-${h.ref}-${h.id}` : null);
      return;
    }
    katman.tikla(el);
  }, { signal: ac.signal });
  kok.addEventListener('change', (ev) => {
    const el = ev.target as HTMLElement;
    if (el instanceof HTMLSelectElement && el.hasAttribute('data-ez-serit')) {
      serit = el.value;
      tabloHucre = null;
      ciz('serit');
      return;
    }
    katman.degisti(el);
  }, { signal: ac.signal });
  // <details> «toggle» kabarmaz; yakalama evresinde açık/kapalı bilgisi saklanır (yeniden çizimde korunsun).
  kok.addEventListener('toggle', (ev) => {
    const d = ev.target;
    if (d instanceof HTMLDetailsElement && d.dataset.ezElleKutu) katman.elleAc(d.dataset.ezElleKutu, d.open);
  }, { signal: ac.signal, capture: true });

  const birak = depo.abone(() => { if (!kapali) canliCiz(); });
  s.yoklama(s.bugun).then((y) => { yoklama = y; }, () => { yoklama = null; }).finally(() => { if (!kapali) canliCiz(); });
  ciz();
  return {
    temizle() {
      kapali = true;
      ac.abort();
      birak();
    },
    ayrilabilir: () => true,
  };
}

/* ───────────────────────────── defterdeki «Ezber dinlendi» ───────────────────────────── */

export interface EzberDinlemesiSecenek {
  app: FirebaseApp;
  ogrenci: EzberOgrencisi;
  gunler: readonly EzberPlanGunu[];
  bugun: string;
  /** Dinleme kaydedilince deftere eklenecek cümle; geri alınınca çıkarılacak cümle. */
  cumleEklendi: (tr: string) => void;
  cumleKaldirildi: (tr: string) => void;
  kapat: () => void;
}

/** Defter kaydının içinde, seçili öğrenci için aynı dinleme paneli. */
export function ezberDinlemesi(kap: HTMLElement, s: EzberDinlemesiSecenek): { temizle(): void } {
  const depo = sinifDeposu(tamFirestore(s.app));
  const hedefler = sinifHedefleri({ gunler: s.gunler.map((g) => ({ tarih: g.tarih, dersler: g.dersler })) });
  const ac = new AbortController();
  let kapali = false;
  const ref = s.ogrenci.ref;
  const { ciz, canliCiz, duyur } = iskelet(kap, `<div class="ez-ust ez-ust-kucuk">
      <h3>${simge('ezber')}Ezber dinleme · ${esc(adSoyad(s.ogrenci))}</h3>
      <p class="ez-baglanti-kap" data-ez-baglanti></p>
      <button type="button" class="ez-ikincil" data-ez-kapat>${simge('kapat')}Kapat</button>
    </div>`, () => {
    const st = depo.durum();
    for (const h of katman.yeniHatalar()) duyur(h);
    if (st.hata) return `<p class="not hata">Ezber kayıtları okunamadı (${esc(st.hata)}).</p>`;
    if (!st.hazir) return '<p class="ez-bilgi">Ezber kayıtları yükleniyor…</p>';
    const kayip = depo.kayiplar().length;
    return `${kayip ? `<p class="not hata">Önceki bir oturumdan ${kayip} ezber kaydı sunucuya ulaşmadı; ayrıntısı «Ezber» sekmesinde.</p>` : ''}<div class="ez-dinle">${katman.html(ref, adSoyad(s.ogrenci))}</div><p class="ez-bilgi">Kaydedilen dinleme deftere bir cümle olarak eklenir; defteri yine «Kaydet» ile kaydedin.</p>`;
  }, depo, ac.signal);
  const katman = dinlemeKatmani({ depo, bugun: s.bugun, hedefler, degisti: (d, odak) => { ciz(odak ?? null); if (d) duyur(d); }, cumleEklendi: s.cumleEklendi, cumleKaldirildi: s.cumleKaldirildi });
  kap.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-ez-kapat],[data-ez-madde],[data-ez-not],[data-ez-kalite],[data-ez-ata],[data-ez-geri],[data-ez-yeniden],[data-ez-elle]');
    if (!el || !kap.contains(el)) return;
    if (el.hasAttribute('data-ez-kapat')) {
      s.kapat();
      return;
    }
    katman.tikla(el);
  }, { signal: ac.signal });
  kap.addEventListener('change', (ev) => { katman.degisti(ev.target as HTMLElement); }, { signal: ac.signal });
  kap.addEventListener('toggle', (ev) => {
    const d = ev.target;
    if (d instanceof HTMLDetailsElement && d.dataset.ezElleKutu) katman.elleAc(d.dataset.ezElleKutu, d.open);
  }, { signal: ac.signal, capture: true });
  const birak = depo.abone(() => { if (!kapali) canliCiz(); });
  ciz();
  return {
    temizle() {
      kapali = true;
      ac.abort();
      birak();
      kap.innerHTML = '';
    },
  };
}
