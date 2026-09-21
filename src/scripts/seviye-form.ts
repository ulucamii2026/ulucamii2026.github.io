/** Seviye tespit testi — form davranışı (20 Eylül 2026).
 *
 *  Puan TARAYICIDA hesaplanmaz: doğru şıklar ve kaynak künyeleri sayfaya hiç basılmaz, sonuç
 *  ekranı sunucunun döndürdüğü `sonuc` nesnesiyle çizilir. Veri toplama, taslak ve gönderim ortak
 *  çekirdektedir (form-cekirdek.ts); bölümler ortak adım motoruyla gösterilir (form-adimlari.ts).
 *  Sözleşme ve kararlar: docs/SEVIYE-TESTI.md
 */
import { doldur, formuBaslat, telefonNormalle, type Alan, type Veriler } from './form-cekirdek';
import { formAdimlariniBaslat } from './form-adimlari';
import { etkilesimiBaslat, type EtkilesimMetni } from './seviye-etkilesim';
import { sesliOkumayiBaslat } from './seviye-sesli-okuma';
import type { Sonuc } from '../lib/seviye-testi/tipler.ts';
import type { SonucMetinleri } from '../lib/seviye-testi/metinler.ts';

/** Sayfaya gömülü `script[data-metin-seviye]` (SeviyeTestiFormu.astro). */
interface BetikMetni {
  soruZorunlu: string;
  epostaOneri: string;      // {adres}
  tekrarDinle: string;
  sesHatasi: string;
  cevaplanan: string;   // {n} {toplam}
  atlanan: string;      // {liste}
  toplamSoru: number;
  bolumAdlari: Record<string, string>;
  /** Etkileşim katmanının metinleri; katman yüklenmezse hiç kullanılmaz. */
  etkilesim: EtkilesimMetni;
}

/* ---------- yardımcılar ---------- */

function isaretliler(nesne: unknown): string[] {
  return Object.entries((nesne ?? {}) as Record<string, unknown>).filter(([, d]) => d === true).map(([anahtar]) => anahtar);
}

/** Radyo değerleri metin gelir ("0".."n-1", "-1"); boş bırakılanlar gövdeye girmez. */
function sayilar(nesne: unknown): Record<string, number> {
  const sonuc: Record<string, number> = {};
  for (const [anahtar, deger] of Object.entries((nesne ?? {}) as Record<string, unknown>)) {
    const ham = String(deger ?? '').trim();
    if (!ham) continue;
    const n = Number(ham);
    if (Number.isInteger(n)) sonuc[anahtar] = n;
  }
  return sonuc;
}

/** Açık (atlanmamış) soru kutuları; kapalı bölümün soruları ne doğrulanır ne de sayılır. */
function acikSorular(form: HTMLFormElement) {
  const liste: { ad: string; yanitli: boolean; banka: boolean }[] = [];
  for (const kutu of form.querySelectorAll<HTMLElement>('fieldset[data-soru]')) {
    const ilk = kutu.querySelector<HTMLInputElement>('input[type="radio"]');
    if (!ilk || ilk.disabled) continue;
    liste.push({
      ad: ilk.name,
      yanitli: !!kutu.querySelector('input[type="radio"]:checked'),
      banka: !kutu.hasAttribute('data-beyan'),
    });
  }
  return liste;
}

/** Taslak geri yüklendiyse ilk eksik zorunlu alanın bulunduğu adım. */
function taslaktanAdim(form: HTMLFormElement): number {
  const not = form.querySelector<HTMLElement>('[data-taslak-not]');
  if (!not || not.hidden) return 0;
  const gruplar = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-adim-sec]'))
    .map((dugme) => (dugme.dataset.adimBolumler ?? '').split(/\s+/).filter(Boolean)
      .map((id) => form.querySelector<HTMLElement>(`#${id}`)).filter((e): e is HTMLElement => !!e));
  const eksik = (bolum: HTMLElement) => Array.from(bolum.querySelectorAll<Alan>('input[name], select[name], textarea[name]'))
    .some((a) => {
      if (a.disabled || !a.required) return false;
      if (a instanceof HTMLInputElement && a.type === 'radio') return !form.querySelector(`input[type="radio"][name="${CSS.escape(a.name)}"]:checked`);
      if (a instanceof HTMLInputElement && a.type === 'checkbox') return !a.checked;
      return !a.value.trim();
    });
  const sira = gruplar.findIndex((grup) => grup.some(eksik));
  return sira < 0 ? 0 : sira;
}

/* ---------- e-posta: tek alan + yaygın yazım hatası önerisi ---------- */

/** Adres bir kez yazılır; sonuç yalnız bu adrese gittiği için bilinen alan adı hataları yakalanır. */
const ALAN_ADI_DUZELTME: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.be': 'gmail.com', 'gmail.fr': 'gmail.com', 'googlemail.co': 'googlemail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmil.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com', 'hotmial.be': 'hotmail.be', 'hotmal.be': 'hotmail.be', 'hotmial.fr': 'hotmail.fr',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlok.be': 'outlook.be',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yaho.fr': 'yahoo.fr',
  'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com', 'icoud.com': 'icloud.com',
  'skynet.bee': 'skynet.be', 'skynte.be': 'skynet.be', 'skyent.be': 'skynet.be', 'telenet.bee': 'telenet.be',
  'proximus.bee': 'proximus.be', 'live.bee': 'live.be',
};

export function epostaOnerisi(adres: string): string | null {
  const a = adres.trim();
  const at = a.lastIndexOf('@');
  if (at < 1 || at === a.length - 1) return null;
  const alan = a.slice(at + 1).toLowerCase();
  const duzgun = ALAN_ADI_DUZELTME[alan] ?? (/\.(con|cmo|vom|coml|comm)$/.test(alan) ? alan.replace(/\.[a-z]+$/, '.com') : null);
  return duzgun && duzgun !== alan ? a.slice(0, at + 1) + duzgun : null;
}

function epostaOnerisiniKur(form: HTMLFormElement, metin: BetikMetni) {
  const alan = form.querySelector<HTMLInputElement>('[name="profil.eposta"]');
  const kutu = form.querySelector<HTMLElement>('[data-eposta-oneri]');
  const yazi = kutu?.querySelector<HTMLElement>('[data-eposta-oneri-metin]');
  const dugme = kutu?.querySelector<HTMLButtonElement>('[data-eposta-oneri-uygula]');
  if (!alan || !kutu || !yazi || !dugme || !metin.epostaOneri) return;
  let oneri: string | null = null;
  const tazele = () => {
    oneri = epostaOnerisi(alan.value);
    kutu.hidden = !oneri;
    if (oneri) yazi.textContent = doldur(metin.epostaOneri, { adres: oneri });
  };
  alan.addEventListener('blur', tazele);
  alan.addEventListener('input', () => { if (!kutu.hidden) tazele(); });
  dugme.addEventListener('click', () => {
    if (!oneri) return;
    alan.value = oneri;
    alan.dispatchEvent(new Event('input', { bubbles: true }));
    kutu.hidden = true;
    alan.focus();
  });
  if (alan.value) tazele();
}

/* ---------- dinleme ---------- */

/** Tek `Audio` nesnesi: yeni düğmeye basınca çalan durur, bitince etiket «Tekrar dinle» olur. */
function dinlemeyiKur(form: HTMLFormElement, metin: BetikMetni) {
  let calar: HTMLAudioElement | null = null;
  let acik: HTMLButtonElement | null = null;
  const durumu = (dugme: HTMLButtonElement) => dugme.parentElement?.querySelector<HTMLElement>('[data-ses-durum]') ?? null;
  const bitir = () => {
    if (!acik) return;
    acik.textContent = metin.tekrarDinle;
    acik.removeAttribute('data-caliyor');
    acik = null;
  };
  const hataGoster = () => {
    const kutu = acik ? durumu(acik) : null;
    bitir();
    if (kutu) kutu.textContent = metin.sesHatasi;
  };
  form.addEventListener('click', (olay) => {
    const dugme = (olay.target as HTMLElement).closest<HTMLButtonElement>('button[data-ses]');
    if (!dugme) return;
    const onceki = acik;
    calar?.pause();
    bitir();
    const oncekiDurum = onceki ? durumu(onceki) : null;
    if (oncekiDurum) oncekiDurum.textContent = '';
    if (onceki === dugme) return;                     // aynı düğmeye ikinci basış yalnız durdurur
    if (!calar) {
      calar = new Audio();
      calar.addEventListener('ended', bitir);
      calar.addEventListener('error', hataGoster);
    }
    const kutu = durumu(dugme);
    if (kutu) kutu.textContent = '';
    acik = dugme;
    dugme.setAttribute('data-caliyor', '1');
    calar.src = dugme.dataset.ses ?? '';
    form.dispatchEvent(new CustomEvent('st:ses', { detail: 'dinle' }));   // sesli okuma çalıyorsa sussun
    void calar.play().catch(hataGoster);
  });
  form.addEventListener('st:ses', (olay) => {
    if ((olay as CustomEvent<string>).detail === 'dinle') return;
    calar?.pause();
    bitir();
  });
}

/** Sayfa görünürken saniyede bir artan süre; taslakla birlikte saklanır. */
function sureyiSay(form: HTMLFormElement) {
  const alan = form.querySelector<HTMLInputElement>('input[name="meta.sureSn"]');
  if (!alan) return;
  let saniye = Number(alan.value) || 0;
  window.setInterval(() => {
    if (document.visibilityState !== 'visible' || form.hidden) return;
    saniye += 1;
    alan.value = String(saniye);
  }, 1000);
}

/* ---------- sonuç ekranı ---------- */

/** Bölmeli çubuk; renk tek başına bilgi taşımaz, `aria-label` ve yanındaki düzey adı okunur. */
function cubuk(bolme: number, dolu: number, etiket: string): HTMLElement {
  const kap = document.createElement('div');
  kap.className = 'st-cubuk';
  kap.setAttribute('role', 'img');
  kap.setAttribute('aria-label', etiket);
  for (let i = 0; i < bolme; i++) {
    const parca = document.createElement('span');
    if (i < dolu) parca.dataset.dolu = '1';
    kap.append(parca);
  }
  return kap;
}

function sonucuCiz(kutu: HTMLElement, sonuc: Sonuc, metin: SonucMetinleri) {
  const okuma = sonuc.okuma;
  const duzey = okuma.atlandi ? 0 : okuma.duzey;
  const okumaAdi = okuma.atlandi ? metin.atlandi : metin.okumaDuzeyleri[okuma.duzey];
  const merdiven = kutu.querySelector<HTMLElement>('[data-okuma-cubuk]');
  if (merdiven) {
    Array.from(merdiven.children).forEach((parca, i) => {
      if (i < duzey) (parca as HTMLElement).dataset.dolu = '1';
      else (parca as HTMLElement).removeAttribute('data-dolu');
    });
    merdiven.setAttribute('aria-label', `${metin.alanAdlari.okuma}: ${okumaAdi} — ${duzey} / 5`);
  }
  const okumaMetni = kutu.querySelector<HTMLElement>('[data-okuma-metin]');
  if (okumaMetni) okumaMetni.textContent = okumaAdi;
  const tecvid = kutu.querySelector<HTMLElement>('[data-tecvid]');
  if (tecvid) { tecvid.textContent = metin.tecvidVar; tecvid.hidden = !okuma.tecvid; }

  const liste = kutu.querySelector<HTMLElement>('[data-alan-liste]');
  if (liste) {
    liste.replaceChildren();
    for (const alan of sonuc.alanlar) {
      const ad = metin.alanAdlari[alan.alan] ?? alan.alan;
      const alanDuzeyi = alan.atlandi ? 0 : alan.duzey;
      const duzeyAdi = alan.atlandi ? metin.atlandi : metin.duzeyAdlari[alan.duzey];
      const satir = document.createElement('li');
      const baslik = document.createElement('span');
      baslik.className = 'st-alan-ad';
      baslik.textContent = ad;
      const deger = document.createElement('span');
      deger.className = 'st-duzey';
      deger.textContent = duzeyAdi;
      satir.append(baslik, cubuk(3, alanDuzeyi, `${ad}: ${duzeyAdi} — ${alanDuzeyi} / 3`), deger);
      liste.append(satir);
    }
  }

  const program = metin.programlar[sonuc.program];
  const programAdi = kutu.querySelector<HTMLElement>('[data-program-ad]');
  const programAciklamasi = kutu.querySelector<HTMLElement>('[data-program-aciklama]');
  if (programAdi) programAdi.textContent = program?.ad ?? '';
  if (programAciklamasi) programAciklamasi.textContent = program?.aciklama ?? '';
}

/* ---------- giriş ---------- */

export function seviyeFormuBaslat() {
  const form = document.querySelector<HTMLFormElement>('form[data-form="seviye"]');
  if (!form) return;
  const metin = JSON.parse(form.querySelector('script[data-metin-seviye]')?.textContent || '{}') as BetikMetni;

  dinlemeyiKur(form, metin);
  epostaOnerisiniKur(form, metin);
  // Aşamalı geliştirme: sesli okuma kurulamasa da form çalışır.
  try { sesliOkumayiBaslat(form); } catch { /* yoksay */ }
  sureyiSay(form);

  let baslangic = 0;
  const cekirdek = formuBaslat(form, {
    hazir: (f) => { baslangic = taslaktanAdim(f); },
    ekDogrula() {
      const hatalar: Array<[string, string]> = [];
      // Banka sorularında genel «zorunlu» yerine «Bilmiyorum»u hatırlatan metin gösterilir.
      for (const soru of acikSorular(form)) {
        if (soru.banka && !soru.yanitli) hatalar.push([soru.ad, metin.soruZorunlu]);
      }
      return hatalar;
    },
    govde(v) {
      const profil = (v.profil ?? {}) as Veriler;
      const onay = (v.onay ?? {}) as Veriler;
      const telefon = String(profil.telefon ?? '').trim();
      // `okumaAtla.*` yalnız arayüz içindir, gövdeye girmez.
      // E-posta küçük harfe çevrilmez: normalleştirmeyi sunucu yapar.
      return {
        bankaSurumu: Number(form.dataset.bankaSurumu) || 0,
        rizaSurumu: form.dataset.rizaSurumu ?? '',
        profil: {
          adSoyad: String(profil.adSoyad ?? ''),
          eposta: String(profil.eposta ?? ''),
          telefon: telefon ? telefonNormalle(telefon) ?? telefon : '',
          yasAraligi: String(profil.yasAraligi ?? ''),
          cinsiyet: String(profil.cinsiyet ?? ''),
          muslumanlik: String(profil.muslumanlik ?? ''),
          oncekiEgitim: String(profil.oncekiEgitim ?? ''),
          hedefler: isaretliler(profil.hedefler),
          dersDili: String(profil.dersDili ?? ''),
          gunler: isaretliler(profil.gunler),
          dilim: isaretliler(profil.dilim),
          bicim: String(profil.bicim ?? ''),
          not: String(profil.not ?? ''),
        },
        onay: { yas18: onay.yas18 === true, riza: onay.riza === true },
        atla: Object.fromEntries(isaretliler(v.atla).map((alan) => [alan, true])),
        cevaplar: sayilar(v.cevaplar),
        ezber: sayilar(v.ezber),
        beyan: sayilar(v.beyan),
        meta: { sureSn: Number((v.meta as Veriler)?.sureSn) || 0 },
      };
    },
    ozet(v, f) {
      const profil = (v.profil ?? {}) as Veriler;
      const etiket = (ad: string, deger: unknown) => {
        const girdi = f.querySelector<HTMLInputElement>(`input[name="${ad}"][value="${String(deger ?? '')}"]`);
        return girdi ? f.querySelector<HTMLLabelElement>(`label[for="${girdi.id}"]`)?.textContent?.trim() ?? '' : '';
      };
      const acik = acikSorular(f);
      const atlananlar = isaretliler(v.atla).map((alan) => metin.bolumAdlari?.[alan] ?? alan);
      return {
        adSoyad: String(profil.adSoyad ?? ''),
        eposta: String(profil.eposta ?? ''),
        telefon: String(profil.telefon ?? ''),
        dersDili: etiket('profil.dersDili', profil.dersDili),
        cevaplanan: doldur(metin.cevaplanan, { n: acik.filter((s) => s.yanitli).length, toplam: metin.toplamSoru }),
        atlanan: doldur(metin.atlanan, { liste: atlananlar.join(', ') || '—' }),
      };
    },
    basarida(_veriler, _ref, yanit) {
      const kutu = document.querySelector<HTMLElement>('[data-basari] [data-sonuc]');
      if (!kutu) return;
      const sonuc = (yanit?.sonuc ?? null) as Sonuc | null;
      // Sunucu sonucu döndürmediyse panel yalnız teşekkür ve referansı gösterir.
      if (!sonuc || typeof sonuc !== 'object' || !Array.isArray(sonuc.alanlar) || !sonuc.okuma) { kutu.hidden = true; return; }
      const sonucMetni = JSON.parse(document.querySelector('script[data-metin-sonuc]')?.textContent || '{}') as SonucMetinleri;
      sonucuCiz(kutu, sonuc, sonucMetni);
      kutu.hidden = false;
    },
  });

  // Etkileşim katmanı ayrı bir modüldür ve çekirdek akışı ASLA engellemez: burada hata
  // fırlatsa bile doğrulama, taslak ve gönderim bugünkü gibi çalışmayı sürdürür.
  // Adım motorundan ÖNCE kurulur ki ilk `form:adim` olayını da duysun.
  try { etkilesimiBaslat(form, metin.etkilesim); } catch { /* deneyim katmanı: yok sayılır */ }

  formAdimlariniBaslat(form, cekirdek.dogrulaBolum, { baslangic });
}
