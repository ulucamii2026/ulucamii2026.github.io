/** Kur'an kursu kayıt formu — form davranışı (okul→sınıf bağı, sağlık rızası, kardeş kaydı). */
import { formuBaslat, telefonNormalle, deger, alanlariDoldur, type Veriler } from './form-cekirdek';

interface SinifSecenek { v: string; ad: string }
interface SinifVerisi { fondamental: SinifSecenek[]; secondaire: SinifSecenek[]; diger: string; onceOkul: string }

const KARDES_ANAHTARI = 'ulucamii:kayit:veli';

export function kayitFormuBaslat() {
  const form = document.querySelector<HTMLFormElement>('form[data-form="kayit"]');
  if (!form) return;
  const okulSec = form.querySelector<HTMLSelectElement>('select[name="ogrenci.okul"]');
  const sinifSec = form.querySelector<HTMLSelectElement>('select[name="ogrenci.sinif"]');
  const siniflar = JSON.parse(form.querySelector('script[data-siniflar]')?.textContent || '{}') as SinifVerisi;

  function sinifListesiKur(koru = true) {
    if (!okulSec || !sinifSec) return;
    const secili = koru ? sinifSec.value : '';
    const okulOpt = okulSec.selectedOptions[0];
    const tur = okulSec.value === 'diger' ? 'hepsi' : okulOpt?.dataset.tur || '';
    sinifSec.innerHTML = '';
    const ekle = (v: string, ad: string, kapali = false) => {
      const o = document.createElement('option'); o.value = v; o.textContent = ad; o.disabled = kapali; sinifSec.append(o);
    };
    ekle('', okulSec.value ? '—' : siniflar.onceOkul, !okulSec.value);
    if (!okulSec.value) { sinifSec.disabled = true; return; }
    sinifSec.disabled = false;
    const liste = tur === 'hepsi' ? [...siniflar.fondamental, ...siniflar.secondaire]
      : tur === 'secondaire' ? siniflar.secondaire : siniflar.fondamental;
    for (const s of liste) ekle(s.v, s.ad);
    ekle('diger', siniflar.diger);
    if (secili && Array.from(sinifSec.options).some((o) => o.value === secili)) sinifSec.value = secili;
  }
  okulSec?.addEventListener('change', () => sinifListesiKur(true));

  formuBaslat(form, {
    hazir(f) {
      sinifListesiKur(true);
      // Kardeş kaydı: ilk kayıttan sonra veli/ikinci kişi alanları hazır gelir.
      const url = new URL(location.href);
      if (url.searchParams.get('kardes') === '1') {
        try {
          const ham = sessionStorage.getItem(KARDES_ANAHTARI);
          if (ham) alanlariDoldur(f, JSON.parse(ham) as Record<string, string>);
        } catch { /* yok say */ }
        url.searchParams.delete('kardes');
        history.replaceState(null, '', url.pathname + url.hash);
        f.querySelector<HTMLElement>('[name="ogrenci.ad"]')?.focus();
      }
    },
    ekDogrula(v, f, m) {
      const hatalar: Array<[string, string]> = [];
      const kurallar = f.querySelector<HTMLInputElement>('input[name="onay.kurallar"]');
      if (kurallar?.disabled) hatalar.push(['onay.kurallar', m.hata.kurallarKaydir]);
      if (deger(v, 'saglik.var') === 'evet' && deger(v, 'onay.saglikRiza') !== true) hatalar.push(['onay.saglikRiza', m.hata.zorunlu]);
      return hatalar;
    },
    govde(v) {
      const o = v.ogrenci as Veriler, veli = v.veli as Veriler, acil = (v.acil ?? {}) as Veriler;
      const saglik = (v.saglik ?? {}) as Veriler, onay = v.onay as Veriler;
      const saglikVar = saglik.var === 'evet';
      return {
        ogrenci: {
          ad: o.ad, soyad: o.soyad, cinsiyet: o.cinsiyet, dogumTarihi: o.dogumTarihi,
          okul: o.okul, okulDiger: o.okul === 'diger' ? o.okulDiger ?? '' : '', sinif: o.sinif, kursDurumu: o.kursDurumu,
        },
        veli: {
          yakinlik: veli.yakinlik, adSoyad: veli.adSoyad, cep: telefonNormalle(String(veli.cep ?? '')) ?? veli.cep,
          eposta: veli.eposta, adres: veli.adres, postaKodu: veli.postaKodu, sehir: veli.sehir, iletisimDili: veli.iletisimDili,
        },
        acil: { adSoyad: acil.adSoyad ?? '', cep: acil.cep ? telefonNormalle(String(acil.cep)) ?? acil.cep : '' },
        saglik: { var: saglikVar, not: saglikVar ? String(saglik.not ?? '') : '' },
        goruntuIzni: v.goruntuIzni === 'evet',
        goruntuSosyalIzni: v.goruntuSosyalIzni === 'evet',
        onay: { kurallar: onay.kurallar === true, gizlilik: onay.gizlilik === true, saglikRiza: saglikVar ? onay.saglikRiza === true : false, elektronikImza: onay.elektronikImza },
      };
    },
    ozet(v, f) {
      const o = (v.ogrenci ?? {}) as Veriler, veli = (v.veli ?? {}) as Veriler, acil = (v.acil ?? {}) as Veriler, saglik = (v.saglik ?? {}) as Veriler;
      const etiket = (ad: string, val: unknown) => {
        const inp = f.querySelector<HTMLInputElement>(`input[name="${ad}"][value="${String(val ?? '')}"]`);
        return inp ? (f.querySelector<HTMLLabelElement>(`label[for="${inp.id}"]`)?.textContent?.trim() ?? String(val)) : '';
      };
      const secText = (ad: string) => { const s = f.querySelector<HTMLSelectElement>(`select[name="${ad}"]`); return s?.value ? s.selectedOptions[0]?.textContent?.trim() ?? '' : ''; };
      const okul = o.okul === 'diger' ? String(o.okulDiger ?? '') : secText('ogrenci.okul');
      const dogum = o.dogumTarihi ? String(o.dogumTarihi).split('-').reverse().join('.') : '';
      const evetHayir = (x: unknown) => (x === 'evet' ? f.dataset.evet ?? 'Evet' : x === 'hayir' ? f.dataset.hayir ?? 'Hayır' : '');
      return {
        ogrenci: [o.ad, o.soyad].filter(Boolean).join(' ') + (dogum ? ` · ${dogum}` : '') + (o.cinsiyet ? ` · ${etiket('ogrenci.cinsiyet', o.cinsiyet)}` : ''),
        okul,
        sinif: secText('ogrenci.sinif') + (o.kursDurumu ? ` · ${etiket('ogrenci.kursDurumu', o.kursDurumu)}` : ''),
        veli: [etiket('veli.yakinlik', veli.yakinlik), veli.adSoyad].filter(Boolean).join(' — '),
        iletisim: [veli.cep, veli.eposta, [veli.adres, [veli.postaKodu, veli.sehir].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
        acil: [acil.adSoyad, acil.cep].filter(Boolean).join(' · '),
        saglik: saglik.var === 'evet' ? String(saglik.not ?? '') : saglik.var === 'hayir' ? evetHayir('hayir') : '',
        goruntu: evetHayir(v.goruntuIzni),
        goruntuSosyal: evetHayir(v.goruntuSosyalIzni),
      };
    },
    basarida(v) {
      const veli = (v.veli ?? {}) as Veriler, acil = (v.acil ?? {}) as Veriler;
      const saklanacak: Record<string, string> = {};
      for (const [k, val] of Object.entries(veli)) saklanacak[`veli.${k}`] = String(val ?? '');
      for (const [k, val] of Object.entries(acil)) saklanacak[`acil.${k}`] = String(val ?? '');
      try { sessionStorage.setItem(KARDES_ANAHTARI, JSON.stringify(saklanacak)); } catch { /* yok say */ }
    },
  });
}
