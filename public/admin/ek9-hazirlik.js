/** Belgeye imza basmadan önce her başvuru için yeniden alınan, yalnız bellekte kalan teyit. */
import { imzaVektorCoz } from './imza-ciz.js';

/* 21 Eki 2026: EK-9 arka yüzünün başvuru kaydından gelen değerleri tek yerden kurulur; panel (tek EK-9, son nüsha
   ekranı) ve sunucu paketi (ihtida-pdf-entry.js) aynı tabloyu kullanır. Kodlu seçimler Mühtedi Koordinatörlüğü
   emsalindeki gibi «Türkçe / Fransızca» yazılır (M-2026-02/-06: «Erkek / Homme»); serbest metin başvuranın yazdığı
   gibi kalır, yalnız ilk harfi büyür. Boş alan belgede «Bildirilmedi / Non communiqué» olur (ek9.js). */
export const EK9_ALANLARI = ['dogumYeri', 'uyruk', 'anneAdi', 'babaAdi', 'medeniHali', 'ogrenim', 'meslek', 'oncekiDin'];
const EK9_ALAN_AZAMI = 120;
const EK9_KODLAR = {
  cinsiyet: { erkek: 'Erkek / Homme', kadin: 'Kadın / Femme', 'kadın': 'Kadın / Femme' },
  oncekiDin: {
    'hristiyan-katolik': 'Hristiyanlık / Katolik', 'hristiyan-ortodoks': 'Hristiyanlık / Ortodoks',
    'hristiyan-protestan': 'Hristiyanlık / Protestan', 'hristiyan-diger': 'Hristiyanlık',
    musevi: 'Musevilik', budist: 'Budizm', hindu: 'Hinduizm',
    ateist: 'Ateist', agnostik: 'Agnostik', dinsiz: 'Dinî bağı yok', yok: 'Dinî bağı yok',
  },
  ogrenim: {
    ilkokul: 'İlkokul', ortaokul: 'Ortaokul', lise: 'Lise', onlisans: 'Ön lisans',
    lisans: 'Lisans', yukseklisans: 'Yüksek lisans', doktora: 'Doktora', diger: 'Diğer',
  },
};
// Medeni hâl Fransızcada cinsiyete göre çekilir; cinsiyet bilinmiyorsa iki biçim birlikte yazılır.
const EK9_MEDENI = {
  bekar: ['Bekâr / Célibataire', 'Bekâr / Célibataire', 'Bekâr / Célibataire'],
  evli: ['Evli / Marié', 'Evli / Mariée', 'Evli / Marié(e)'],
  bosanmis: ['Boşanmış / Divorcé', 'Boşanmış / Divorcée', 'Boşanmış / Divorcé(e)'],
  dul: ['Dul / Veuf', 'Dul / Veuve', 'Dul / Veuf(ve)'],
};
const ek9Sade = deger => String(deger ?? '').trim().replace(/\s+/g, ' ');
const ilkHarfBuyuk = d => d ? d.charAt(0).toLocaleUpperCase('tr') + d.slice(1) : '';

export function ek9Etiket(tur, deger, cinsiyet) {
  const d = ek9Sade(deger);
  if (!d) return '';
  const kod = d.toLocaleLowerCase('tr');
  if (tur === 'medeniHali' && EK9_MEDENI[kod]) {
    const c = ek9Sade(cinsiyet).toLocaleLowerCase('tr');
    return EK9_MEDENI[kod][c === 'erkek' ? 0 : c === 'kadin' || c === 'kadın' ? 1 : 2];
  }
  return EK9_KODLAR[tur]?.[kod] || ilkHarfBuyuk(d);
}

/** Defter satırından EK-9 arka yüzünün kişisel değerleri. Anne ve baba adı yazıldığı gibi kalır. */
export function ek9Degerleri(kayit) {
  const k = kayit || {};
  return {
    cinsiyet: ek9Etiket('cinsiyet', k['Cinsiyet']),
    dogumYeri: ek9Etiket('dogumYeri', k['Doğum yeri']),
    uyruk: ek9Etiket('uyruk', k['Uyruk']),
    anneAdi: ek9Sade(k['Anne adı']),
    babaAdi: ek9Sade(k['Baba adı']),
    medeniHali: ek9Etiket('medeniHali', k['Medeni hali'], k['Cinsiyet']),
    ogrenim: ek9Etiket('ogrenim', k['Öğrenim durumu']),
    meslek: ek9Etiket('meslek', k['Mesleği']),
    oncekiDin: ek9Etiket('oncekiDin', k['Önceki din/mezhep']),
  };
}

/** Son nüsha ekranında görevlinin düzelttiği değerler (yalnız EK9_ALANLARI). Boş değer «Bildirilmedi» demektir. */
export function ek9AlanlariGecerli(alanlar) {
  if (alanlar === undefined || alanlar === null) return true;
  if (typeof alanlar !== 'object' || Array.isArray(alanlar)) return false;
  return Object.entries(alanlar).every(([a, d]) => EK9_ALANLARI.includes(a) && typeof d === 'string' && ek9Sade(d).length <= EK9_ALAN_AZAMI);
}
export function ek9AlanlariUygula(degerler, alanlar) {
  const sonuc = { ...degerler };
  if (!alanlar || !ek9AlanlariGecerli(alanlar)) return sonuc;
  for (const a of EK9_ALANLARI) if (typeof alanlar[a] === 'string') sonuc[a] = ek9Sade(alanlar[a]);
  return sonuc;
}

export function sahitOnerileri(kayit) {
  const adlar = [kayit['Şahit 1'], kayit['Şahit 2']].map(ad => String(ad || '').trim());
  if ((kayit['Cami kimliği'] || 'ulucamii-marche') !== 'ulucamii-marche') return adlar;
  const yedekler = ['Ercan MOLA', 'Rıdvan KAYAHAN'];
  const normalle = ad => ad.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
  const kullanilan = new Set(adlar.filter(Boolean).map(normalle));
  return adlar.map(ad => {
    if (ad) return ad;
    const yedek = yedekler.find(isim => !kullanilan.has(normalle(isim))) || '';
    kullanilan.add(normalle(yedek));
    return yedek;
  });
}

const imzaAnahtari = ad => {
  const isim = ad.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');
  return isim === 'rıdvan kayahan' ? 'ridvan' : isim === 'ercan mola' ? 'ercan' : '';
};
export const sahitImzaAnahtari = ad => imzaAnahtari(String(ad || ''));

/* 23 Eki 2026 (Rıdvan KAYAHAN: «benim imzam ve başkan Ercan MOLA imzası otomatik gelmedi, belgeye … otomatik gelecek
   şekilde düzelt»): Ulu Camii Marche'de «Rıdvan KAYAHAN» ve «Ercan MOLA» adlı şahidin kayıtlı vektör imzası, görevli
   işareti kaldırmadıkça (imzaKullan: false) belgeye kendiliğinden basılır. İmzaların kendisi herkese açık depoda DURMAZ:
   dernek Google hesabındaki özel depodan sunucuda ya da panelin yetkili isteğiyle gelir (imzalar = {ridvan, ercan}).
   Dönüş: {sahitler: imzası bağlanmış liste, uygulanan: ['ercan', 'ridvan']}. Başka camide hiçbir yerel imza bağlanmaz. */
export function sahitImzalariniBagla(sahitler, camiId, imzalar, kendi = []) {
  const uygulanan = [];
  const liste = (Array.isArray(sahitler) ? sahitler : []).map((s, i) => {
    if (s?.imzaKullan === false) return s;
    // 23 Eki 2026: şahit başvuru sırasında formda kendi imzasını attıysa (rızasıyla) o imza basılır; kayıtlı imzanın önüne geçer.
    const k = Array.isArray(kendi) ? kendi[i] : null;
    if (k && k.imza && !s?.imza && sahitAdiNormal(k.ad) === sahitAdiNormal(s?.ad)) return { ...s, imza: k.imza, kendiImza: true };
    const anahtar = camiId === 'ulucamii-marche' ? imzaAnahtari(String(s?.ad || '')) : '';
    const imza = anahtar && imzalar && typeof imzalar[anahtar] === 'string' ? imzalar[anahtar] : '';
    if (!imza || uygulanan.includes(anahtar)) return s;
    uygulanan.push(anahtar);
    return { ...s, imza };
  });
  return { sahitler: liste, uygulanan };
}

/* 23 Eki 2026 (Rıdvan KAYAHAN, kapsam genişletmesi): mühtedi kendi şahitlerini seçtiyse ve şahit formu doldururken yanındaysa,
   şahit imzasını formdaki kutuya kendisi atabilir (isteğe bağlı; şahidin kendi rızasıyla). İmza başvuru dosyasında
   «<ref> - sahit1 imza.png» (+ vektör) olarak, rıza kaydı «<ref> - sahit-imza-riza.json» olarak durur. Burada o kayıttan
   [{ad, imza}|null, {ad, imza}|null] çıkarılır: yalnız rızası kayıtlı ve PNG'siyle birlikte gelen imzalar. Vektör (sürüm 1)
   geçerliyse o, değilse PNG kullanılır. Ad kayıtta şahidin yazıldığı biçimdir; belgedeki ad farklıysa imza basılmaz. */
export const sahitAdiNormal = ad => String(ad ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
export function sahitKendiImzalari(gorseller) {
  const g = gorseller || {};
  let riza = null;
  try { riza = JSON.parse(g.sahitRiza || 'null'); } catch { riza = null; }
  return [1, 2].map(n => {
    const kayit = riza && typeof riza === 'object' ? riza[`sahit${n}`] : null;
    const png = typeof g[`sahit${n}Imza`] === 'string' ? g[`sahit${n}Imza`] : '';
    if (!kayit || kayit.riza !== true || !String(kayit.ad || '').trim() || !png) return null;
    const vektor = imzaVektorCoz(g[`sahit${n}ImzaVektor`]) ? g[`sahit${n}ImzaVektor`] : '';
    return { ad: String(kayit.ad).trim(), imza: vektor || png };
  });
}

export function sahitUnvani(ad, camiId = 'ulucamii-marche') {
  if (camiId !== 'ulucamii-marche') return '';
  const anahtar = imzaAnahtari(String(ad || ''));
  return anahtar === 'ridvan' ? 'Din Görevlisi' : anahtar === 'ercan' ? 'Dernek Başkanı' : '';
}

export function ek9HazirlikAc(kayit, imzalar = {}, secenekler = {}) {
  return new Promise(coz => {
    const oncekiOdak = document.activeElement;
    const pencere = document.createElement('dialog');
    pencere.className = 'ek9-hazirlik';
    pencere.setAttribute('aria-labelledby', 'ek9-hazirlik-baslik');
    // Başvuru verisi HTML'e eklenmez; aşağıda value/textContent kullanılır.
    pencere.innerHTML = `<form>
      <h2 id="ek9-hazirlik-baslik">EK-9 belgesini hazırlayın</h2>
      <p data-basvuran></p>
      <label for="ek9-belge-adi">Belgeye yazılacak ad soyad (kimlikteki gibi)</label>
      <input id="ek9-belge-adi" name="adSoyad" type="text" maxlength="120" required autocomplete="off" />
      <label for="ek9-isim-yazisi">İlk sayfadaki isim</label>
      <select id="ek9-isim-yazisi" name="isimYazisi"><option value="kaligrafik">Mavi dolma kalem (kalıcı kural)</option><option value="sade">Sade siyah yazı (yalnız açık talimatla)</option></select>
      <label for="ek9-alan-yazisi">Diğer doldurulan alanlar</label>
      <select id="ek9-alan-yazisi" name="alanYazisi"><option value="el-yazisi">Mavi dolma kalem (kalıcı kural)</option><option value="sade">Sade siyah yazı (yalnız açık talimatla)</option></select>
      <p>Şahit adlarını kontrol edin. «Ercan MOLA» ve «Rıdvan KAYAHAN» adlı şahitlerin kayıtlı imzası kendiliğinden eklenir (işaretli gelir). O kişi bu törende şahit değilse işareti kaldırın; imza alanı boş kalır ve kalemle imzalanır. Kayıtlı imzası olmayan şahidin adı basılır, imza alanı boş bırakılır.</p>
      <div data-sahitler></div>
      <label for="ek9-gercek-tarih">Gerçek ihtida tarihi (biliniyorsa)</label>
      <input id="ek9-gercek-tarih" name="tarih" type="date" />
      <p class="not">Tören henüz yapılmadıysa boş bırakın. Tarih tercihi bu alana aktarılmaz. Belge numarası, belge tarihi ve yetkili imzası Müşavirlik için boş bırakılır; düzenleyen birim «T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği» olarak yazılır. T.C. kimlik numarası gerekiyorsa basılı belgede elle tamamlanır.</p>
      <fieldset data-ek9-alanlar><legend>EK-9 arka yüzündeki bilgiler</legend>
        <p class="not">Başvuranın formda yazdıkları gelir. Kodlu seçimler emsal belgelerdeki gibi «Türkçe / Fransızca» yazılır; serbest yazılanları isterseniz aynı biçime getirin (ör. «İtalya / Italie», «Emekli / Retraité»). Boş bıraktığınız alana «Bildirilmedi / Non communiqué» yazılır. Bu düzeltmeler yalnız EK-9’a girer; dilekçe başvuranın kendi beyanı olarak kalır, başvuru kaydı değişmez.</p>
      </fieldset>
      <p data-teslimat></p>
      <div class="ek9-eylemler"><button type="button" class="dugme" data-vazgec>Vazgeç</button><button type="submit" class="dugme birincil">PDF’yi hazırla</button></div>
    </form>`;
    const form = pencere.querySelector('form');
    pencere.querySelector('[data-basvuran]').textContent = String(kayit['Adı Soyadı'] || '');
    const belgeAdi = form.elements.namedItem('adSoyad');
    belgeAdi.value = String(kayit['Adı Soyadı'] || '');
    const adiDogrula = () => belgeAdi.setCustomValidity(belgeAdi.value.trim() ? '' : 'Kimlikteki ad ve soyadı yazın.');
    belgeAdi.addEventListener('input', adiDogrula); adiDogrula();
    if (secenekler.paket) {
      pencere.querySelector('h2').textContent = 'İhtida belge paketini hazırlayın';
      // Paketin bütün belgeleri mavi dolma kalemle yazılır (KALICI KURAL, 17 Eki 2026); yazı seçimi yalnız tek EK-9'da.
      for (const ad of ['isimYazisi', 'alanYazisi']) {
        const secim = form.elements.namedItem(ad);
        secim.hidden = true; pencere.querySelector(`label[for="${secim.id}"]`).hidden = true;
      }
      form.elements.namedItem('tarih').required = true;
      pencere.querySelector('label[for="ek9-gercek-tarih"]').textContent = 'Gerçek ihtida tarihi';
      form.elements.namedItem('tarih').nextElementSibling.textContent = 'Paket tören sonrasında hazırlanır. Gerçek ihtida tarihini yazın; tercih edilen tören tarihi kullanılmaz. Belge numarası, düzenleme tarihi ve Müşavir imzası yetkili makam için boş kalır.';
      const ek = document.createElement('div');
      ek.innerHTML = `<label for="ek9-tam-adres">Tam posta adresi (sokak, kapı, posta kodu, şehir, ülke)</label>
        <textarea id="ek9-tam-adres" name="tamAdres" required maxlength="400" rows="3"></textarea>
        <label for="ek9-sebep">İhtida sebebi (isteğe bağlı, başvuranın kendi ifadesi)</label>
        <textarea id="ek9-sebep" name="sebep" maxlength="600" rows="2"></textarea>
        <label for="ek9-beyan-tarihi">Başvuranın beyan ve rıza tarihi</label>
        <input id="ek9-beyan-tarihi" name="beyanTarihi" type="date" required />
        <label for="ek9-kimlik-turu">Eklenen kimlik belgesi</label>
        <select id="ek9-kimlik-turu" name="belgeTuru" required><option value="">Seçin</option><option value="kimlik">Kimlik kartı (ön ve arka)</option><option value="pasaport">Pasaport bilgi sayfası</option></select>
        <p data-paket-not></p>`;
      pencere.querySelector('[data-teslimat]').before(ek);
      form.elements.namedItem('tamAdres').value = String(kayit['Adres'] || '');
      form.elements.namedItem('sebep').value = String(kayit['İhtida sebebi'] || '');
      form.elements.namedItem('beyanTarihi').value = secenekler.beyanTarihi || '';
      form.elements.namedItem('beyanTarihi').readOnly = Boolean(secenekler.imzali);
      form.elements.namedItem('belgeTuru').value = kayit['Kimlik belgesi türü'] || secenekler.belgeTuru || '';
      pencere.querySelector('[data-paket-not]').textContent = secenekler.imzali
        ? 'Başvuranın kayıtlı imzası EK-9, EK-10 ve dilekçeye aktarılır. İmza tarihi kayıttan alınır. Pakete kimlik örneği de eklenir.'
        : 'Başvuranın imzası yok. Adlar ve tarihler doldurulur; EK-9, EK-10 ve dilekçedeki imza yerleri kişinin imzalaması için boş kalır.';
      pencere.querySelector('button[type="submit"]').textContent = 'Tek PDF paketini hazırla';
      if (secenekler.gonder) {
        pencere.querySelector('[data-paket-not]').textContent += ' Onayladığınız paket özel arşive kaydedilir; info@ulucamii.be, imam@ulucamii.be ve başvuranın kayıtlı e-postasına gönderilir.';
        pencere.querySelector('button[type="submit"]').textContent = 'Son nüshayı onayla ve gönder';
      }
    }
    const ek9Basliklari = {
      dogumYeri: 'Doğum yeri', uyruk: 'Uyruğu', anneAdi: 'Anne adı', babaAdi: 'Baba adı',
      medeniHali: 'Medeni hâli', ogrenim: 'Öğrenimi', meslek: 'Mesleği', oncekiDin: 'Önceki dini / mezhebi',
    };
    const ek9Ilk = ek9Degerleri(kayit);
    const ek9Girdiler = EK9_ALANLARI.map(alan => {
      const kimlik = `ek9-alan-${alan}`;
      const etiket = document.createElement('label');
      etiket.htmlFor = kimlik; etiket.textContent = ek9Basliklari[alan];
      const girdi = document.createElement('input');
      Object.assign(girdi, { id: kimlik, type: 'text', maxLength: 120, autocomplete: 'off', value: ek9Ilk[alan] || '' });
      girdi.dataset.ek9Alan = alan;
      pencere.querySelector('[data-ek9-alanlar]').append(etiket, girdi);
      return girdi;
    });
    const teslim = kayit['Belge teslim yeri'];
    const camiAdres = [kayit['Cami adresi'], kayit['Cami posta kodu'], kayit['Cami şehri']].filter(Boolean).join(', ');
    const camiAdi = kayit['Başvuru camisi'] || 'Ulu Camii';
    pencere.querySelector('[data-teslimat]').textContent = teslim === 'adres'
      ? `Posta alıcısı: ${kayit['Adı Soyadı'] || ''} — ${kayit['Adres'] || ''}`
      : teslim === 'cami' ? `Belge Müşavirlikten ${camiAdi}${camiAdres ? ` — ${camiAdres}` : ''} adresine postalanacak; başvuran camiden teslim alacak. EK-9 arka sayfasındaki adres, başvuranın resmî ikamet adresidir.`
      : 'Bu eski başvuruda teslim tercihi yok; göndermeden önce başvuranla teyit edin.';
    const digerCami = (kayit['Cami kimliği'] || 'ulucamii-marche') !== 'ulucamii-marche';
    // Tek PDF paketinde (sunucuda hazırlanır) imzayı sunucu özel depodan kendisi bağlar: tarayıcıya imza gelmez, yalnız
    // «kullanılsın mı» bilgisi gider. Yerel tek EK-9'da imzalar (yetkili istekle gelen) imzalar parametresindedir.
    const sunucuImzasi = secenekler.sunucuImzasi ?? secenekler.paket === true;
    // 23 Eki 2026: şahidin başvuru sırasında formda kendi attığı imza (sahitKendiImzalari çıktısı; rızası kayıtlı). Ad eşleşirse kullanılabilir.
    const kendiImzalar = Array.isArray(secenekler.kendiImzalar) ? secenekler.kendiImzalar : [];
    const kendiImza = (i, ad) => (kendiImzalar[i] && kendiImzalar[i].imza && sahitAdiNormal(kendiImzalar[i].ad) === sahitAdiNormal(ad) ? kendiImzalar[i] : null);
    const alanlar = sahitOnerileri(kayit).map((ad, i) => {
      const kap = document.createElement('fieldset');
      kap.innerHTML = `<legend>${i + 1}. şahit</legend><label for="ek9-sahit-${i}">Adı soyadı</label><input id="ek9-sahit-${i}" type="text" maxlength="120" required autocomplete="off" />
        <p class="not" data-sahit-unvan></p><label class="ek9-onay"><input type="checkbox" disabled /> <span>Bu kişi törende şahitti; imzası belgeye eklensin (şahit değilse işareti kaldırın).</span></label><p class="not" data-imza-not></p>`;
      const isim = kap.querySelector('input[type=text]');
      const onay = kap.querySelector('input[type=checkbox]');
      isim.value = ad;
      const yenile = () => {
        isim.setCustomValidity(isim.value.trim() ? '' : 'Şahidin adını soyadını yazın.');
        const unvan = kap.querySelector('[data-sahit-unvan]');
        unvan.textContent = sahitUnvani(isim.value, kayit['Cami kimliği']);
        unvan.hidden = !unvan.textContent;
        // Kayıtlı imza ya da şahidin başvuruda attığı kendi imzası varsa işaretli gelir (varsayılan: eklenir); görevli şahit değilse işareti kaldırır.
        const anahtar = imzaAnahtari(isim.value);
        const kendi = kendiImza(i, isim.value);
        onay.disabled = !(kendi || (!digerCami && anahtar && (sunucuImzasi || imzalar[anahtar])));
        onay.checked = !onay.disabled;
        kap.querySelector('[data-imza-not]').textContent = kendi ? 'Şahit imzasını başvuru sırasında kendisi attı (rızasıyla); belgeye otomatik eklenir. Şahit değilse işareti kaldırın.'
          : !onay.disabled
          ? 'Kayıtlı imza var; belgeye otomatik eklenir. Şahit değilse işareti kaldırın.'
          : digerCami ? 'Başka cami seçildiği için kayıtlı yerel imza kullanılmaz; şahit belgeyi kalemle imzalayacak.'
          : anahtar && secenekler.imzaHata ? 'Kayıtlı imzalar şu anda alınamadı; şahit belgeyi kalemle imzalayacak. Sayfayı yenileyip yeniden deneyin.'
          : 'Bu ad için kayıtlı imza yok; şahit belgeyi kalemle imzalayacak.';
      };
      isim.addEventListener('input', yenile); yenile();
      pencere.querySelector('[data-sahitler]').append(kap);
      return { isim, onay };
    });
    let sonuc = null;
    form.addEventListener('submit', olay => {
      olay.preventDefault();
      if (!form.reportValidity()) return;
      sonuc = {
        adSoyad: belgeAdi.value.trim(),
        sahitler: alanlar.map(({ isim, onay }, i) => {
          const kullan = onay.checked && !onay.disabled;
          const kendi = kendiImza(i, isim.value);
          return sunucuImzasi
            ? { ad: isim.value.trim(), imza: '', imzaKullan: kullan }
            : { ad: isim.value.trim(), imza: kullan ? (kendi ? kendi.imza : imzalar[imzaAnahtari(isim.value)] || '') : '' };
        }),
        ihtidaTarihi: form.elements.namedItem('tarih').value,
        isimYazisi: form.elements.namedItem('isimYazisi').value,
        alanYazisi: form.elements.namedItem('alanYazisi').value,
        alanlar: Object.fromEntries(ek9Girdiler.map(g => [g.dataset.ek9Alan, g.value.trim().replace(/\s+/g, ' ')])),
      };
      if (secenekler.paket) Object.assign(sonuc, {
        adres: form.elements.namedItem('tamAdres').value.trim(),
        ihtidaSebebi: form.elements.namedItem('sebep').value.trim(),
        beyanTarihi: form.elements.namedItem('beyanTarihi').value,
        belgeTuru: form.elements.namedItem('belgeTuru').value,
        teslimatYontemi: kayit['Belge teslim yeri'] === 'adres' ? 'adres' : 'cami',
      });
      pencere.close();
    });
    pencere.querySelector('[data-vazgec]').addEventListener('click', () => pencere.close());
    pencere.addEventListener('close', () => { pencere.remove(); oncekiOdak?.focus(); coz(sonuc); }, { once: true });
    document.body.append(pencere); pencere.showModal();
  });
}
