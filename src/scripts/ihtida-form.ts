/** İhtida başvuru formu — form davranışı. Kimlik numarası, görsel, imza yok; beyan yazılı ad soyadla. */
import { formuBaslat, telefonNormalle, type Veriler } from './form-cekirdek';

export function ihtidaFormuBaslat() {
  const form = document.querySelector<HTMLFormElement>('form[data-form="ihtida"]');
  if (!form) return;

  formuBaslat(form, {
    govde(v) {
      const b = v.basvuran as Veriler, sahit = (v.sahit ?? {}) as Veriler, onay = v.onay as Veriler;
      return {
        basvuran: {
          adSoyad: b.adSoyad, cinsiyet: b.cinsiyet, dogumTarihi: b.dogumTarihi, dogumYeri: b.dogumYeri, uyruk: b.uyruk,
          anneAdi: b.anneAdi, babaAdi: b.babaAdi, medeniHali: b.medeniHali, ogrenimDurumu: b.ogrenimDurumu, meslek: b.meslek,
          oncekiDin: b.oncekiDin, ihtidaSebebi: b.ihtidaSebebi ?? '', yeniIsim: b.yeniIsim ?? '',
          eposta: b.eposta, telefon: telefonNormalle(String(b.telefon ?? '')) ?? b.telefon, adres: b.adres,
          torenDili: b.torenDili, torenTarihi: b.torenTarihi ?? '', nasilHaberdar: b.nasilHaberdar ?? '', ekNot: b.ekNot ?? '',
        },
        sahitler: [{ ad: sahit['1'] ?? '' }, { ad: sahit['2'] ?? '' }],
        fotografIzni: v.fotografIzni === true,
        onay: { acikRiza: onay.acikRiza === true, ek10: onay.ek10 === true, gizlilik: onay.gizlilik === true, beyan: onay.beyan },
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
        kisi: [b.adSoyad, etiket('basvuran.cinsiyet', b.cinsiyet)].filter(Boolean).join(' · '),
        dogum: [dogum, b.dogumYeri].filter(Boolean).join(' · '),
        uyruk: String(b.uyruk ?? ''),
        aile: [b.anneAdi, b.babaAdi].filter(Boolean).join(' / '),
        durum: [secText('basvuran.medeniHali'), b.ogrenimDurumu, b.meslek].filter(Boolean).join(' · '),
        iletisim: [b.telefon, b.eposta, b.adres].filter(Boolean).join(' · '),
        din: String(b.oncekiDin ?? ''),
        toren: [secText('basvuran.torenDili'), b.torenTarihi].filter(Boolean).join(' · '),
        sahitler: [sahit['1'], sahit['2']].filter(Boolean).join(', '),
      };
    },
  });
}
