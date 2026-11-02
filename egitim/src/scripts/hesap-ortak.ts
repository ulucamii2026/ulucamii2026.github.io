/**
 * Hesap sayfalarının ortak parçası (giriş, kayıt, hesabım; 2 Kasım 2026). Hesap sayfaları oturumu kendileri yönetir (Taban `oturum={false}`):
 * Firebase burada, sayfa açılınca yüklenir (anonim ana sayfa ve çalışma sayfaları yüklemez). Metinler sayfanın `data-veri` JSON'undan gelir
 * (src/i18n/hesap.ts, işlevler `{0}` kalıbı); DOM elle kurulur, `innerHTML` yok (CSP).
 *
 *  - `veriOku`, `sor`, `durumYaz`: sayfa verisi, zorunlu öğe, `role="status"/"alert"` alanları.
 *  - `authMetni`, `cocukMetni`, `cagriMetni`, `adHatasi`: sunucu ve Firebase hata kodlarının dostça cümleleri.
 *  - `adAdimi`: kullanıcı adı alanı (canlı biçim denetimi + öneri + sunucuya kaydet); kayıt ve hesabım sayfaları paylaşır.
 *  - `girisSonrasi`: gerçek bir girişten sonra `giristeEsitle`; cihazdaki çalışma varsa «hesabına eklensin mi?» sorulur.
 *  - `sekmeler`, `sifreGoster`: ARIA sekme grubu (ok tuşlarıyla) ve şifre göster/gizle.
 */
import type { Dil } from '@ortak/i18n/ui';
import { gecerliMi, oneri } from '@ortak/lib/ilim-yolu/kullanici-adi';
import type { HesapMetinleri } from '../i18n/hesap';
import { kalipDoldur, type Sablonlu } from '../i18n/sablon';
import { firebaseYukle, type IlimFirebase } from '../lib/firebase-istemci';
import { giristeEsitle } from '../lib/hesap/esitle';
import type { CocukGirisSonucu } from '../lib/hesap/kart-giris';
import { kullaniciAdiAl, profilGetir, profilYaz, type CagriHatasi } from '../lib/hesap/profil';
import type { AuthNedeni } from '../lib/hesap/oturum';

export type HesapSablon = Sablonlu<HesapMetinleri>;
export interface SayfaVeri {
  dil: Dil;
  yerel: string;
  m: HesapSablon;
  /** Sayfaya özgü ek veriler (ör. gizlilik adresi). */
  ek?: Record<string, string>;
}

export function veriOku(): SayfaVeri {
  const kok = document.querySelector<HTMLElement>('[data-veri]');
  return JSON.parse(kok?.dataset.veri ?? '{}') as SayfaVeri;
}

export function sor<T extends Element>(secici: string, kok: ParentNode = document): T {
  const e = kok.querySelector<T>(secici);
  if (!e) throw new Error(`öğe yok: ${secici}`);
  return e;
}

/** Durum/hata alanına metin yazar (boş metin alanı gizler); ekran okuyucuya `role` ile bildirilir. */
export function durumYaz(el: Element, metin: string, tur: '' | 'hata' | 'iyi' = ''): void {
  el.textContent = metin;
  el.classList.toggle('hata', tur === 'hata');
  el.classList.toggle('iyi', tur === 'iyi');
}

export const tarihYaz = (v: SayfaVeri, iso: string): string => {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso : new Intl.DateTimeFormat(v.yerel, { day: 'numeric', month: 'long', year: 'numeric' }).format(t);
};

export const authMetni = (v: SayfaVeri, neden: AuthNedeni | string): string =>
  (v.m.authHata as Record<string, string>)[neden] ?? v.m.authHata.bilinmeyen;

/** «15 dakika» / «2 saat» (kilit süresi). */
function sureMetni(v: SayfaVeri, bitis: string | undefined): string {
  const dk = Math.max(1, Math.ceil(((bitis ? Date.parse(bitis) : NaN) - Date.now()) / 60000) || 15);
  const [deger, birim] = dk >= 90 ? [Math.round(dk / 60), 'hour'] : [dk, 'minute'];
  return new Intl.NumberFormat(v.yerel, { style: 'unit', unit: birim, unitDisplay: 'long' }).format(deger);
}

export function cocukMetni(v: SayfaVeri, s: Exclude<CocukGirisSonucu, { ok: true }>): string {
  if (s.neden === 'kilit') return kalipDoldur(v.m.cocukHata.kilit, sureMetni(v, s.bitis));
  return v.m.cocukHata[s.neden];
}

export function cagriMetni(v: SayfaVeri, h: CagriHatasi, tablo: Record<string, string>): string {
  if (h.neden === 'ag') return v.m.ag;
  if (h.neden === 'oturum-yok') return v.m.authHata['oturum-yok'];
  return tablo[h.neden] ?? v.m.bilinmeyen;
}

/** Kullanıcı adı alma/değiştirme hatalarının cümlesi (`gecersiz-ad`/alt, `ad-alinmis`, `ad-degisikligi-sinirli`…). */
export function adHatasi(v: SayfaVeri, h: CagriHatasi): string {
  const sv = v.m.adSunucu;
  if (h.neden === 'ad-alinmis') return sv.alinmis;
  if (h.neden === 'ad-degisikligi-sinirli') return kalipDoldur(sv.sinirli, h.sonraki ? tarihYaz(v, h.sonraki) : '—');
  if (h.neden === 'yetki-yok') return sv.yetki;
  if (h.neden === 'gecersiz-ad') return h.alt === 'ayrilmis' ? sv.ayrilmis : (v.m.adHata as Record<string, string>)[h.alt ?? ''] ?? sv.gecersiz;
  return cagriMetni(v, h, {});
}

export async function sayfaFirebase(): Promise<IlimFirebase> {
  return firebaseYukle();
}

/** ARIA sekme grubu: tıklama, ← → Home End; yalnız seçilen panel görünür. `ilkDeger` verilen sekme açılır. */
export function sekmeler(kok: HTMLElement, ilk = 0): (i: number) => void {
  const dugmeler = [...kok.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const paneller = dugmeler.map((d) => sor<HTMLElement>(`#${d.getAttribute('aria-controls')}`, document));
  const sec = (i: number, odak = false) => {
    dugmeler.forEach((d, j) => {
      d.setAttribute('aria-selected', String(i === j));
      d.tabIndex = i === j ? 0 : -1;
      paneller[j].hidden = i !== j;
    });
    if (odak) dugmeler[i].focus();
  };
  dugmeler.forEach((d, i) => {
    d.addEventListener('click', () => sec(i));
    d.addEventListener('keydown', (e) => {
      const son = dugmeler.length - 1;
      const hedef = e.key === 'ArrowRight' ? (i === son ? 0 : i + 1)
        : e.key === 'ArrowLeft' ? (i === 0 ? son : i - 1)
          : e.key === 'Home' ? 0 : e.key === 'End' ? son : -1;
      if (hedef < 0) return;
      e.preventDefault();
      sec(hedef, true);
    });
  });
  sec(ilk);
  return sec;
}

/** Şifre göster/gizle düğmesi (`aria-pressed`, etiket değişir). */
export function sifreGoster(dugme: HTMLButtonElement, girdi: HTMLInputElement, v: SayfaVeri): void {
  dugme.setAttribute('aria-label', v.m.sifreGoster);
  dugme.addEventListener('click', () => {
    const goster = girdi.type === 'password';
    girdi.type = goster ? 'text' : 'password';
    dugme.setAttribute('aria-pressed', String(goster));
    dugme.setAttribute('aria-label', goster ? v.m.sifreGizle : v.m.sifreGoster);
  });
}

/** Evet/hayır paneli (`[data-soru]`): metni yazar, odağı ilk düğmeye alır ve seçimi bekler. */
export function evetHayir(panel: HTMLElement, o: { metin: string; not?: string; evet: string; hayir: string }): Promise<boolean> {
  const metin = sor<HTMLElement>('[data-soru-metin]', panel);
  const not = sor<HTMLElement>('[data-soru-not]', panel);
  const evet = sor<HTMLButtonElement>('[data-soru-evet]', panel);
  const hayir = sor<HTMLButtonElement>('[data-soru-hayir]', panel);
  metin.textContent = o.metin;
  not.textContent = o.not ?? '';
  not.hidden = !o.not;
  evet.textContent = o.evet;
  hayir.textContent = o.hayir;
  panel.hidden = false;
  evet.focus();
  return new Promise((coz) => {
    const bitir = (cevap: boolean) => {
      evet.removeEventListener('click', e1);
      hayir.removeEventListener('click', h1);
      panel.hidden = true;
      coz(cevap);
    };
    const e1 = () => bitir(true);
    const h1 = () => bitir(false);
    evet.addEventListener('click', e1);
    hayir.addEventListener('click', h1);
  });
}

/**
 * Gerçek bir girişten sonra (form, Google, kart): oturum işareti konur ve bu cihazdaki anonim çalışma hesaba bir şey katacaksa
 * «Bu cihazdaki N madde hesabına eklensin mi?» sorulur (cevap `cevapla`ya gider); yoksa doğrudan eşitlenir.
 */
export async function girisSonrasi(f: IlimFirebase, v: SayfaVeri, panel: HTMLElement | null): Promise<void> {
  const karar = await giristeEsitle(f);
  if (karar.tur === 'sor') {
    const ekle = panel
      ? await evetHayir(panel, { metin: kalipDoldur(v.m.esitleSor, karar.n), not: v.m.esitleNot, evet: v.m.esitleEvet, hayir: v.m.esitleHayir })
      : false;
    await karar.cevapla(ekle);
  }
}

/** Girişten sonra gidilecek yer: kullanıcı adı yoksa hesap sayfası (zorunlu ad adımı), varsa ana sayfa. */
export async function girisSonrasiYol(f: IlimFirebase, v: SayfaVeri, cocuk = false): Promise<string> {
  const p = await profilGetir(f).catch(() => null);
  return cocuk || p?.ad ? `/${v.dil}/` : `/${v.dil}/hesap/`;
}

export interface AdAdimi {
  /** Alan sıfırlanır ve odaklanır. */
  odakla(): void;
}

/**
 * Kullanıcı adı alanı. Canlı: yazdıkça biçim denetlenir (uygun → «@ad biçimi uygun», değilse nedeni; Türkçe harfli adlarda «Şunu deneyebilirsin»
 * önerisi). «Kaydet»te sunucu çağrılır; hata dostça gösterilir. Başarıda profile sayfanın dili de yazılır (haftalık e-posta o dilde gelsin; en iyi çaba).
 */
export function adAdimi(kok: HTMLElement, f: IlimFirebase, v: SayfaVeri, bitti: (ad: string) => void): AdAdimi {
  const girdi = sor<HTMLInputElement>('[data-ad-girdi]', kok);
  const durum = sor<HTMLElement>('[data-ad-durum]', kok);
  const oneriDugme = sor<HTMLButtonElement>('[data-ad-oneri]', kok);
  const hata = sor<HTMLElement>('[data-ad-hata]', kok);
  const dugme = sor<HTMLButtonElement>('[data-ad-kaydet]', kok);
  let mesgul = false;

  const guncelle = () => {
    const ham = girdi.value;
    oneriDugme.hidden = true;
    durumYaz(hata, '');
    if (!ham.trim()) {
      durum.hidden = true;
      girdi.removeAttribute('aria-invalid');
      return;
    }
    durum.hidden = false;
    const s = gecerliMi(ham);
    girdi.setAttribute('aria-invalid', String(!s.ok));
    durum.classList.toggle('hata', !s.ok);
    if (s.ok) {
      durum.textContent = kalipDoldur(v.m.adUygun, s.ad);
      return;
    }
    durum.textContent = v.m.adHata[s.neden];
    const o = oneri(ham);
    if (o && gecerliMi(o).ok && o !== ham.trim().toLowerCase()) {
      oneriDugme.textContent = kalipDoldur(v.m.adOneri, o);
      oneriDugme.dataset.oneri = o;
      oneriDugme.hidden = false;
    }
  };
  girdi.addEventListener('input', guncelle);
  oneriDugme.addEventListener('click', () => {
    girdi.value = oneriDugme.dataset.oneri ?? '';
    guncelle();
    girdi.focus();
  });

  kok.addEventListener('submit', (e) => {
    e.preventDefault();
    void (async () => {
      if (mesgul) return;
      const s = gecerliMi(girdi.value);
      if (!s.ok) {
        guncelle();
        girdi.focus();
        return;
      }
      mesgul = true;
      dugme.disabled = true;
      durumYaz(hata, '');
      const r = await kullaniciAdiAl(f, s.ad);
      mesgul = false;
      dugme.disabled = false;
      if (!r.ok) {
        durumYaz(hata, adHatasi(v, r), 'hata');
        girdi.focus();
        return;
      }
      void profilYaz(f, { dil: v.dil }).catch(() => undefined);
      bitti(r.ad);
    })();
  });
  return { odakla: () => girdi.focus() };
}
