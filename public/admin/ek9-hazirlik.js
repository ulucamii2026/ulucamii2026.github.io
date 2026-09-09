/** Belgeye imza basmadan önce her başvuru için yeniden alınan, yalnız bellekte kalan teyit. */
export function sahitOnerileri(kayit) {
  const adlar = [kayit['Şahit 1'], kayit['Şahit 2']].map(ad => String(ad || '').trim());
  if ((kayit['Cami kimliği'] || 'ulucamii-marche') !== 'ulucamii-marche') return adlar;
  const yedekler = ['Rıdvan KAYAHAN', 'Yeliz KAYAHAN'];
  const kullanilan = new Set(adlar.filter(Boolean).map(ad => ad.toLocaleLowerCase('tr')));
  return adlar.map(ad => {
    if (ad) return ad;
    const yedek = yedekler.find(isim => !kullanilan.has(isim.toLocaleLowerCase('tr'))) || '';
    kullanilan.add(yedek.toLocaleLowerCase('tr'));
    return yedek;
  });
}

const imzaAnahtari = ad => {
  const isim = ad.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');
  return isim === 'rıdvan kayahan' ? 'ridvan' : isim === 'yeliz kayahan' ? 'yeliz' : '';
};

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
      <select id="ek9-isim-yazisi" name="isimYazisi"><option value="kaligrafik">Mavi kaligrafi · divit kalem görünümü</option><option value="sade">Sade siyah yazı</option></select>
      <label for="ek9-alan-yazisi">Diğer doldurulan alanlar</label>
      <select id="ek9-alan-yazisi" name="alanYazisi"><option value="el-yazisi">Mavi el yazısı</option><option value="sade">Sade siyah yazı</option></select>
      <p>Şahit adlarını kontrol edin. Kayıtlı imza yalnız ilgili şahidin bu törene katıldığı ve imzasının kullanımını onayladığı teyit edilirse eklenir. Kutular boş kalırsa adlar basılır, imza alanları kalemle imzalamak için boş bırakılır.</p>
      <div data-sahitler></div>
      <label for="ek9-gercek-tarih">Gerçek ihtida tarihi (biliniyorsa)</label>
      <input id="ek9-gercek-tarih" name="tarih" type="date" />
      <p class="not">Tören henüz yapılmadıysa boş bırakın. Tarih tercihi bu alana aktarılmaz. Belge numarası, belge tarihi, düzenleyen birim ve yetkili imzası Müşavirlik için boş bırakılır. T.C. kimlik numarası gerekiyorsa basılı belgede elle tamamlanır.</p>
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
    const teslim = kayit['Belge teslim yeri'];
    const camiAdres = [kayit['Cami adresi'], kayit['Cami posta kodu'], kayit['Cami şehri']].filter(Boolean).join(', ');
    const camiAdi = kayit['Başvuru camisi'] || 'Ulu Camii';
    pencere.querySelector('[data-teslimat]').textContent = teslim === 'adres'
      ? `Posta alıcısı: ${kayit['Adı Soyadı'] || ''} — ${kayit['Adres'] || ''}`
      : teslim === 'cami' ? `Belge Müşavirlikten ${camiAdi}${camiAdres ? ` — ${camiAdres}` : ''} adresine postalanacak; başvuran camiden teslim alacak. EK-9 arka sayfasındaki adres, başvuranın resmî ikamet adresidir.`
      : 'Bu eski başvuruda teslim tercihi yok; göndermeden önce başvuranla teyit edin.';
    const digerCami = (kayit['Cami kimliği'] || 'ulucamii-marche') !== 'ulucamii-marche';
    const alanlar = sahitOnerileri(kayit).map((ad, i) => {
      const kap = document.createElement('fieldset');
      kap.innerHTML = `<legend>${i + 1}. şahit</legend><label for="ek9-sahit-${i}">Adı soyadı</label><input id="ek9-sahit-${i}" type="text" maxlength="120" required autocomplete="off" />
        <label class="ek9-onay"><input type="checkbox" disabled /> <span>Bu kişinin şahitliğini ve kayıtlı imzasının bu belgeye eklenmesine onayını teyit ettim.</span></label><p class="not" data-imza-not></p>`;
      const isim = kap.querySelector('input[type=text]');
      const onay = kap.querySelector('input[type=checkbox]');
      isim.value = ad;
      const yenile = () => {
        isim.setCustomValidity(isim.value.trim() ? '' : 'Şahidin adını soyadını yazın.');
        onay.checked = false;
        onay.disabled = digerCami || !imzalar[imzaAnahtari(isim.value)];
        kap.querySelector('[data-imza-not]').textContent = onay.disabled
          ? (digerCami ? 'Başka cami seçildiği için kayıtlı yerel imza kullanılmaz; şahit belgeyi kalemle imzalayacak.' : 'Bu ad için kayıtlı imza yok; şahit belgeyi kalemle imzalayacak.')
          : 'Kayıtlı imza var; yalnız yukarıdaki teyitle eklenir.';
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
        sahitler: alanlar.map(({ isim, onay }) => ({
          ad: isim.value.trim(), imza: onay.checked && !onay.disabled ? imzalar[imzaAnahtari(isim.value)] || '' : '',
        })),
        ihtidaTarihi: form.elements.namedItem('tarih').value,
        isimYazisi: form.elements.namedItem('isimYazisi').value,
        alanYazisi: form.elements.namedItem('alanYazisi').value,
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
