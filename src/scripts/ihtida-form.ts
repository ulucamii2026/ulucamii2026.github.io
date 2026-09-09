/** İhtida başvuru formu — form davranışı. Kimlik NUMARASI sorulmaz; beyan yazılı ad soyadladır.
 *  8 Eylül 2026'dan beri vesikalık, kimlik belgesinin ön/arka yüzü ve çizilen imza da toplanır
 *  (bkz. ihtida-gorseller.ts) — bunlar taslağa yazılmaz, yalnız gönderim gövdesine eklenir. */
import { formuBaslat, telefonNormalle, type Veriler } from './form-cekirdek';
import { gorselleriBaslat, type BelgeMetinleri, type GorselYonetici } from './ihtida-gorseller';
import { camiSeciminiBaslat } from './ihtida-cami';
import { ihtidaAdimlariniBaslat } from './ihtida-adimlari';

export function ihtidaFormuBaslat() {
  const form = document.querySelector<HTMLFormElement>('form[data-form="ihtida"]');
  if (!form) return;

  const belgeMetin = JSON.parse(form.querySelector('script[data-metin-belge]')?.textContent || '{}') as BelgeMetinleri;
  const gorseller: GorselYonetici | null = gorselleriBaslat(form, belgeMetin);
  const cami = camiSeciminiBaslat(form);
  // Yerel reset tamamlandıktan sonra imzasız tercihini ve görselleri birlikte sıfırla.
  form.addEventListener('reset', () => queueMicrotask(() => gorseller?.sifirla()));

  const cekirdek = formuBaslat(form, {
    hazir: () => {
      cami.hazir();
      // Önceki sürümdeki taslakta yazılmış şahit adlarını görünür tut.
      const secim = form.querySelector<HTMLInputElement>('#i-sahit-ekle');
      if (secim && !secim.checked && form.querySelector<HTMLInputElement>('#i-sahit-1')?.value.trim()) {
        secim.checked = true;
        secim.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
    ekDogrula: (_v, _f, _m, bolumler) => [
      ...(!bolumler || bolumler.some(b => b.id === 'b-cami' || b.id === 'b-ihtida') ? cami.dogrula() : []),
      ...(!bolumler || bolumler.some(b => b.id === 'b-belgeler') ? gorseller?.dogrula() ?? [] : []),
    ],
    govde(v) {
      const b = v.basvuran as Veriler, sahit = (v.sahit ?? {}) as Veriler, onay = v.onay as Veriler;
      const adres = [b.adres, b.postaKodu, b.sehir, b.ulke].map(x => String(x ?? '').trim()).filter(Boolean).join(', ');
      return {
        cami: cami.veri(),
        basvuran: {
          adSoyad: b.adSoyad, cinsiyet: b.cinsiyet, dogumTarihi: b.dogumTarihi, dogumYeri: b.dogumYeri, uyruk: b.uyruk,
          anneAdi: b.anneAdi, babaAdi: b.babaAdi, medeniHali: b.medeniHali, ogrenimDurumu: b.ogrenimDurumu, meslek: b.meslek,
          oncekiDin: b.oncekiDin, ihtidaSebebi: b.ihtidaSebebi ?? '', yeniIsim: b.yeniIsim ?? '',
          eposta: b.eposta, telefon: telefonNormalle(String(b.telefon ?? '')) ?? b.telefon, adres,
          adresSokak: String(b.adres ?? '').trim(), postaKodu: String(b.postaKodu ?? '').trim(),
          sehir: String(b.sehir ?? '').trim(), ulke: String(b.ulke ?? '').trim(),
          torenDili: b.torenDili, torenTarihi: b.torenTarihi ?? '', nasilHaberdar: b.nasilHaberdar ?? '', ekNot: b.ekNot ?? '',
        },
        teslimat: { yontem: (v.teslimat as Veriler)?.yontem ?? 'cami' },
        sahitSecimi: cami.farkli() || v.sahitEkle === true ? 'kendi' : 'cami',
        sahitler: cami.farkli() || v.sahitEkle === true ? [{ ad: sahit['1'] ?? '' }, { ad: sahit['2'] ?? '' }] : [],
        fotografIzni: v.fotografIzni === true,
        belgeTuru: v.belgeTuru ?? 'kimlik',
        imzaYok: v.imzaYok === true,
        gorseller: gorseller?.paket() ?? { vesikalik: '', kimlikOn: '', kimlikArka: '', imza: '' },
        onay: {
          acikRiza: onay.acikRiza === true, ek10: onay.ek10 === true, gizlilik: onay.gizlilik === true,
          ek10Surumu: '2026-09-09', imzaAktarimIzni: v.imzaYok !== true && onay.imzaAktarimIzni === true,
          gorselRiza: onay.gorselRiza === true, beyan: onay.beyan,
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
      const dogum = b.dogumTarihi ? String(b.dogumTarihi).split('-').reverse().join('.') : '';
      return {
        cami: cami.ozet(),
        kisi: [b.adSoyad, etiket('basvuran.cinsiyet', b.cinsiyet)].filter(Boolean).join(' · '),
        dogum: [dogum, b.dogumYeri].filter(Boolean).join(' · '),
        uyruk: String(b.uyruk ?? ''),
        aile: [b.anneAdi, b.babaAdi].filter(Boolean).join(' / '),
        durum: [secText('basvuran.medeniHali'), b.ogrenimDurumu, b.meslek].filter(Boolean).join(' · '),
        iletisim: [b.telefon, b.eposta, b.adres, b.postaKodu, b.sehir, b.ulke].filter(Boolean).join(' · '),
        teslimat: [etiket('teslimat.yontem', (v.teslimat as Veriler)?.yontem), ...((v.teslimat as Veriler)?.yontem === 'adres' ? [b.adSoyad, b.adres, b.postaKodu, b.sehir, b.ulke] : [])].filter(Boolean).join(' · '),
        din: String(b.oncekiDin ?? ''),
        sebep: String(b.ihtidaSebebi ?? ''),
        yeniIsim: String(b.yeniIsim ?? ''),
        toren: [secText('basvuran.torenDili'), b.torenTarihi].filter(Boolean).join(' · '),
        sahitler: v.sahitEkle === true ? [sahit['1'], sahit['2']].filter(Boolean).join(', ') : f.querySelector('[data-sahit-cami]')?.textContent?.trim() ?? '',
        belgeler: gorseller?.ozet() ?? '',
      };
    },
  });
  const imzaYok = form.querySelector<HTMLInputElement>('#i-imza-yok');
  const imzaIzni = form.querySelector<HTMLInputElement>('#i-onay-imza');
  imzaYok?.addEventListener('change', () => { if (imzaYok.checked && imzaIzni) imzaIzni.checked = false; });
  ihtidaAdimlariniBaslat(form, cekirdek.dogrulaBolum);
}
