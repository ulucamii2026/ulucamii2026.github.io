/** İhtida başvuru formu — form davranışı. Kimlik NUMARASI sorulmaz; beyan yazılı ad soyadladır.
 *  8 Eylül 2026'dan beri vesikalık, kimlik belgesinin ön/arka yüzü ve çizilen imza da toplanır
 *  (bkz. ihtida-gorseller.ts) — bunlar taslağa yazılmaz, yalnız gönderim gövdesine eklenir. */
import { formuBaslat, telefonNormalle, type Veriler } from './form-cekirdek';
import { gorselleriBaslat, type BelgeMetinleri, type GorselYonetici } from './ihtida-gorseller';
import { camiSeciminiBaslat } from './ihtida-cami';
import { sahitImzalariniBaslat, DIN_GOREVLISI_SAHIT, type SahitImzaMetinleri } from './ihtida-sahit-imza';
import { ihtidaAdimlariniBaslat } from './ihtida-adimlari';
import { ihtidaYasDurumu } from '../lib/ihtida-yas';

export function ihtidaFormuBaslat() {
  const form = document.querySelector<HTMLFormElement>('form[data-form="ihtida"]');
  if (!form) return;

  const belgeMetin = JSON.parse(form.querySelector('script[data-metin-belge]')?.textContent || '{}') as BelgeMetinleri;
  const gorseller: GorselYonetici | null = gorselleriBaslat(form, belgeMetin);
  const cami = camiSeciminiBaslat(form);
  // 23 Ekim 2026: kendi şahidi yanındaki mühtedi için isteğe bağlı şahit imzası (bkz. ihtida-sahit-imza.ts).
  const sahitMetin = JSON.parse(form.querySelector('script[data-metin-sahit-imza]')?.textContent || '{}') as SahitImzaMetinleri;
  const sahitImzalari = sahitImzalariniBaslat(form, sahitMetin);
  // Yerel reset tamamlandıktan sonra imzasız tercihini, görselleri ve şahit imzalarını birlikte sıfırla.
  form.addEventListener('reset', () => queueMicrotask(() => { gorseller?.sifirla(); sahitImzalari.sifirla(); }));

  // 12 Kasım 2026: 18 yaşından küçükler çevrim içi başvuru yapamaz (din görevlisi kararı). Yaş, başvuru günü (Europe/Brussels)
  // esas alınarak hesaplanır (src/lib/ihtida-yas.ts); sunucu aynı denetimi yapar ("yas-siniri").
  const yasMetin = JSON.parse(form.querySelector('script[data-metin-yas]')?.textContent || '{}') as { kisa?: string; bilgi?: string };
  const dogumAlani = form.querySelector<HTMLInputElement>('#i-dogum');
  const yasKutusu = form.querySelector<HTMLElement>('[data-yas-kutu]');
  const yasAltiMi = () => ihtidaYasDurumu(dogumAlani?.value.trim() ?? '') === 'yas-siniri';
  const yasKutusunuGuncelle = () => {
    if (!yasKutusu) return;
    const goster = yasAltiMi();
    if (goster) { if (yasKutusu.textContent !== yasMetin.bilgi) yasKutusu.textContent = yasMetin.bilgi ?? ''; }
    else yasKutusu.textContent = '';
    yasKutusu.hidden = !goster;
  };
  for (const olay of ['input', 'change']) dogumAlani?.addEventListener(olay, yasKutusunuGuncelle);
  form.addEventListener('reset', () => queueMicrotask(yasKutusunuGuncelle));

  const cekirdek = formuBaslat(form, {
    hazir: () => {
      yasKutusunuGuncelle();   // taslaktan gelen doğum tarihi de denetlensin
      cami.hazir();
      // Önceki sürümdeki taslakta yazılmış şahit adlarını görünür tut.
      const secim = form.querySelector<HTMLInputElement>('#i-sahit-ekle');
      if (secim && !secim.checked && form.querySelector<HTMLInputElement>('#i-sahit-1')?.value.trim()) {
        secim.checked = true;
        secim.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
    ekDogrula: (_v, _f, _m, bolumler) => [
      ...(yasAltiMi() && (!bolumler || bolumler.some(b => b.id === 'b-kisi')) ? [['basvuran.dogumTarihi', yasMetin.kisa ?? ''] as [string, string]] : []),
      ...(!bolumler || bolumler.some(b => b.id === 'b-cami' || b.id === 'b-ihtida') ? cami.dogrula() : []),
      ...(!bolumler || bolumler.some(b => b.id === 'b-ihtida') ? sahitImzalari.dogrula() : []),
      ...(!bolumler || bolumler.some(b => b.id === 'b-belgeler') ? gorseller?.dogrula() ?? [] : []),
    ],
    govde(v) {
      const b = v.basvuran as Veriler, sahit = (v.sahit ?? {}) as Veriler, onay = v.onay as Veriler;
      const sahitImza = sahitImzalari.veri();     // imzasız şahit için null: satır yalnız { ad } kalır
      const sahit1Ad = String(sahit['1'] ?? '').trim();
      const kendiSahit = cami.farkli() || (v.sahitEkle === true && sahit1Ad !== '');
      const adres = [b.adres, b.postaKodu, b.sehir, b.ulke].map(x => String(x ?? '').trim()).filter(Boolean).join(', ');
      return {
        cami: cami.veri(),
        basvuran: {
          // 12 Kas 2026: ad ve soyad ayrı gider; «Ad SOYAD» değerini sunucu tek yerde kurar (ihtidaAdSoyadHazirla).
          ad: b.ad, soyad: b.soyad, cinsiyet: b.cinsiyet, dogumTarihi: b.dogumTarihi, dogumYeri: b.dogumYeri, uyruk: b.uyruk,
          anneAdi: b.anneAdi, babaAdi: b.babaAdi, medeniHali: b.medeniHali, ogrenimDurumu: b.ogrenimDurumu, meslek: b.meslek,
          oncekiDin: b.oncekiDin, ihtidaSebebi: b.ihtidaSebebi ?? '', yeniIsim: b.yeniIsim ?? '',
          eposta: b.eposta, telefon: telefonNormalle(String(b.telefon ?? '')) ?? b.telefon, adres,
          adresSokak: String(b.adres ?? '').trim(), postaKodu: String(b.postaKodu ?? '').trim(),
          sehir: String(b.sehir ?? '').trim(), ulke: String(b.ulke ?? '').trim(),
          torenDili: b.torenDili, torenTarihi: b.torenTarihi ?? '', nasilHaberdar: b.nasilHaberdar ?? '', ekNot: b.ekNot ?? '',
        },
        teslimat: { yontem: (v.teslimat as Veriler)?.yontem ?? 'cami' },
        // 1 Kas 2026: tek şahit kuralı. Başvuran en çok bir şahit (1.) bildirir; 2. şahit her başvuruda din görevlisidir.
        // Ulu Camii'nde şahit bildirilmezse 'cami' + boş liste gider (1. şahit sunucuda/panelde dernek başkanı olarak önerilir).
        sahitSecimi: kendiSahit ? 'kendi' : 'cami',
        sahitler: kendiSahit ? [{ ad: sahit1Ad, ...(sahitImza[0] ?? {}) }, { ad: DIN_GOREVLISI_SAHIT }] : [],
        fotografIzni: v.fotografIzni === true,
        belgeTuru: v.belgeTuru ?? 'kimlik',
        imzaYok: v.imzaYok === true,
        gorseller: gorseller?.paket() ?? { vesikalik: '', kimlikOn: '', kimlikArka: '', imza: '', imzaVektor: '' },
        onay: {
          acikRiza: onay.acikRiza === true, ek10: onay.ek10 === true, gizlilik: onay.gizlilik === true,
          ek10Surumu: '2026-10', imzaAktarimIzni: v.imzaYok !== true && onay.imzaAktarimIzni === true,
          gorselRiza: onay.gorselRiza === true, beyan: onay.beyan,
          sartlar: onay.sartlar === true,   // 25 Eki 2026: «okudum, anladım» + Komisyonun düzenleme hakkı
        },
      };
    },
    ozet(v, f) {
      const b = (v.basvuran ?? {}) as Veriler, sahit = (v.sahit ?? {}) as Veriler;
      const etiket = (ad: string, val: unknown) => {
        const inp = f.querySelector<HTMLInputElement>(`input[name="${ad}"][value="${String(val ?? '')}"]`);
        return inp ? (f.querySelector<HTMLLabelElement>(`label[for="${inp.id}"]`)?.textContent?.trim() ?? '') : '';
      };
      const secText = (ad: string) => { const s = f.querySelector<HTMLSelectElement>(`select[name="${ad}"]`); return s?.value ? s.selectedOptions[0]?.textContent?.trim() ?? '' : ''; };
      const adSoyad = [b.ad, b.soyad].map(x => String(x ?? '').trim()).filter(Boolean).join(' ');
      const dogum = b.dogumTarihi ? String(b.dogumTarihi).split('-').reverse().join('.') : '';
      return {
        cami: cami.ozet(),
        kisi: [adSoyad, etiket('basvuran.cinsiyet', b.cinsiyet)].filter(Boolean).join(' · '),
        dogum: [dogum, b.dogumYeri].filter(Boolean).join(' · '),
        uyruk: String(b.uyruk ?? ''),
        aile: [b.anneAdi, b.babaAdi].filter(Boolean).join(' / '),
        durum: [secText('basvuran.medeniHali'), b.ogrenimDurumu, b.meslek].filter(Boolean).join(' · '),
        iletisim: [b.telefon, b.eposta, b.adres, b.postaKodu, b.sehir, b.ulke].filter(Boolean).join(' · '),
        teslimat: [etiket('teslimat.yontem', (v.teslimat as Veriler)?.yontem), ...((v.teslimat as Veriler)?.yontem === 'adres' ? [adSoyad, b.adres, b.postaKodu, b.sehir, b.ulke] : [])].filter(Boolean).join(' · '),
        din: String(b.oncekiDin ?? ''),
        sebep: String(b.ihtidaSebebi ?? ''),
        yeniIsim: String(b.yeniIsim ?? ''),
        toren: [secText('basvuran.torenDili'), b.torenTarihi].filter(Boolean).join(' · '),
        sahitler: [
          sahit['1'] && (v.sahitEkle === true || cami.farkli())
            ? (sahitImzalari.imzaliMi(1) ? `${sahit['1']} (${sahitImzalari.etiket})` : String(sahit['1']))
            : (cami.farkli() ? '' : 'Ercan MOLA'),
          `${DIN_GOREVLISI_SAHIT} (${f.querySelector('[data-sahit-sabit-unvan]')?.textContent?.trim() ?? ''})`,
        ].filter(Boolean).join(', '),
        belgeler: gorseller?.ozet() ?? '',
      };
    },
  });
  const imzaYok = form.querySelector<HTMLInputElement>('#i-imza-yok');
  const imzaIzni = form.querySelector<HTMLInputElement>('#i-onay-imza');
  imzaYok?.addEventListener('change', () => { if (imzaYok.checked && imzaIzni) imzaIzni.checked = false; });
  ihtidaAdimlariniBaslat(form, cekirdek.dogrulaBolum);
}
