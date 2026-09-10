/** Cami içi İhtida Defteri paneli. Kalıcı tarayıcı önbelleği kullanmaz. */
const kacir = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const metin = (v) => String(v ?? '').trim();
const durumlar = {
  bekliyor: 'Bekliyor', tamamlandi: 'Merasim tamamlandı', musavirlikte: 'Müşavirlikte', 'teslim-edildi': 'Teslim edildi', iptal: 'İptal',
};
const teslimler = { cami: 'Camiye teslim', adres: 'Posta ile adrese', elden: 'Elden teslim' };
const sonrakiMi = (d) => ['tamamlandi', 'musavirlikte', 'teslim-edildi'].includes(d);
const tarihGirdisi = (v) => /^\d{4}-\d{2}-\d{2}$/.test(metin(v)) ? metin(v) : '';
const tarihGoster = (v) => {
  const s = metin(v); if (!s) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00Z`) : new Date(s);
  return Number.isNaN(d.getTime()) ? s : new Intl.DateTimeFormat('tr-BE', { timeZone: 'Europe/Brussels', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};
const guncelleniyorMu = (durum) => ['guncelleme-bekliyor', 'guncelleniyor'].includes(durum);
const hataMesaji = (cevap, varsayilan) => ({
  MERASIM_DOGRULAMA_GEREKLI: 'Merasimin yapıldığını doğrulamanız gerekir.',
  MERASIM_TARIHI_GEREKLI: 'Merasim tarihi gereklidir.',
  MUSAVIRLIK_GONDERIM_TARIHI_GEREKLI: 'Müşavirliğe gerçek gönderim tarihi gereklidir.',
  TESLIM_TARIHI_GEREKLI: 'Gerçek teslim tarihi gereklidir.',
  DEFTER_HAZIR_DEGIL: 'Defter henüz hazır değil. Biraz sonra yeniden deneyin.',
  GUNCELLENIYOR: 'Defter güncelleniyor. Biraz sonra yenileyin.',
}[cevap?.kod || cevap?.hataKodu] || metin(cevap?.hata) || varsayilan);

function indirBase64(base64, mime, ad) {
  const ikili = atob(String(base64 || ''));
  const bayt = Uint8Array.from(ikili, c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bayt], { type: mime || 'application/octet-stream' }));
  const a = document.createElement('a'); a.href = url; a.download = ad || 'ihtida-defteri';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
}

function alan(id, etiket, deger = '', tur = 'text') {
  return `<label class="tam" for="${id}">${etiket}<input id="${id}" name="${id}" type="${tur}" value="${kacir(deger)}" /></label>`;
}

/**
 * @param {{gasIstek:(islem:string, parametreler?:object)=>Promise<any>, gasPost:(veri:object)=>Promise<any>}} baglantilar
 */
export function ihtidaDefteriKur({ gasIstek, gasPost }) {
  const hedef = document.querySelector('#basvurular');
  if (!hedef) throw new Error('İhtida Defteri için #basvurular bulunamadı.');
  if (hedef.querySelector('#ihtida-defteri')) return;

  const bolum = document.createElement('details');
  bolum.id = 'ihtida-defteri'; bolum.className = 'katlanir';
  bolum.innerHTML = `<summary>İhtida Defteri</summary>
    <div class="bilgi-kutu"><strong>Cami içi özel takip</strong><br>Bu defter, belge ve teslim sürecini izlemek içindir; DHYS’nin yerine geçmez.</div>
    <div class="satir-arac" role="group" aria-label="İhtida Defteri işlemleri">
      <button type="button" class="dugme" data-defter-yenile>↻ Yenile</button>
      <button type="button" class="dugme" data-defter-dosya="docx" disabled>Word indir</button>
      <button type="button" class="dugme" data-defter-dosya="pdf" disabled>PDF indir</button>
      <span data-defter-durum role="status" aria-live="polite"></span>
    </div>
    <div data-defter-icerik></div>`;
  hedef.append(bolum);

  const durum = bolum.querySelector('[data-defter-durum]');
  const icerik = bolum.querySelector('[data-defter-icerik]');
  let model = null;
  let yuklendi = false;
  let yukleniyor = null;
  let guncelleniyor = false;

  const durumYaz = (yazi) => { durum.textContent = yazi; };
  const dosyaDugmeleri = (etkin) => bolum.querySelectorAll('[data-defter-dosya]').forEach(b => { b.disabled = !etkin; });

  function kayitKarti(k) {
    const no = metin(k.defterNo) ? `<span class="etiket">Defter no: ${kacir(k.defterNo)}</span>` : '';
    const yer = [k.camiAdi, k.camiSehir].filter(metin).map(kacir).join(' · ');
    const tarih = metin(k.ihtidaTarihi) ? `<p>İhtida tarihi: ${kacir(tarihGoster(k.ihtidaTarihi))}</p>` : '';
    return `<article class="kart" data-defter-kayit="${kacir(k.ref)}"><div class="etiket">${kacir(durumlar[k.durum] || k.durum || 'Bekliyor')}</div>
      <h3>${kacir(k.adSoyad || 'Adı belirtilmemiş')}</h3>${no}<p class="mono">${kacir(k.ref)}</p>${yer ? `<p>${yer}</p>` : ''}${tarih}
      <button type="button" class="dugme" data-defter-duzen="${kacir(k.ref)}">Süreci güncelle</button></article>`;
  }

  function ciz() {
    const kayitlar = Array.isArray(model?.kayitlar) ? model.kayitlar : [];
    const bekleyen = kayitlar.filter(k => k.durum === 'bekliyor');
    const takip = kayitlar.filter(k => k.durum !== 'bekliyor' && k.durum !== 'iptal');
    const iptal = kayitlar.filter(k => k.durum === 'iptal');
    const grup = (baslik, liste, aciklama) => `<section><h3>${baslik}</h3><p class="not">${aciklama}</p>${liste.length ? `<div class="kartlar">${liste.map(kayitKarti).join('')}</div>` : '<p class="not">Kayıt yok.</p>'}</section>`;
    icerik.innerHTML = grup('Bekleyen başvurular', bekleyen, 'Merasim tamamlanmadan defter sıra numarası verilmez.')
      + grup('Tamamlanan ve takipteki kayıtlar', takip, 'Defter sıra numarası yalnız merasim tamamlandıktan sonra gösterilir.')
      + grup('İptal edilen kayıtlar', iptal, 'Daha önce verilmiş defter sıra numarası korunur; başka bir kayda verilmez.');
    icerik.querySelectorAll('[data-defter-duzen]').forEach(b => b.addEventListener('click', () => duzenAc(b.dataset.defterDuzen)));
  }

  async function yukle() {
    if (yukleniyor) return yukleniyor;
    durumYaz('Defter getiriliyor…');
    yukleniyor = (async () => {
      try {
        const cevap = await gasIstek('ihtida-defteri');
        if (!cevap?.ok || !cevap.defter) throw new Error(hataMesaji(cevap, 'Defter henüz hazır değil.'));
        model = cevap.defter; yuklendi = true; guncelleniyor = guncelleniyorMu(cevap.durum); dosyaDugmeleri(!guncelleniyor); ciz();
        const adet = Array.isArray(model.kayitlar) ? model.kayitlar.length : 0;
        durumYaz(guncelleniyor ? 'PDF ve Word dosyaları güncelleniyor. Biraz sonra Yenile’ye basın.' : `${adet} kayıt · Son güncelleme: ${tarihGoster(model.guncelleme) || 'bilinmiyor'}`);
      } catch (hata) {
        model = null; dosyaDugmeleri(false); icerik.innerHTML = '<p class="not">Defter şu anda hazır değil. Biraz sonra yeniden deneyin.</p>';
        durumYaz('Defter alınamadı.');
      } finally { yukleniyor = null; }
    })();
    return yukleniyor;
  }

  async function dosyaIndir(format, dugme) {
    dugme.disabled = true; durumYaz('Dosya hazırlanıyor…');
    try {
      const cevap = await gasIstek('ihtida-defteri-dosya', { format });
      if (!cevap?.ok || !cevap.base64) {
        if (guncelleniyorMu(cevap?.durum)) { guncelleniyor = true; dosyaDugmeleri(false); }
        throw new Error(hataMesaji(cevap, 'Dosya henüz hazır değil.'));
      }
      indirBase64(cevap.base64, cevap.mime, cevap.ad); durumYaz('İndirme hazırlandı.');
    } catch (hata) { durumYaz(hata.message || 'Dosya henüz hazır değil. Biraz sonra yeniden deneyin.'); }
    finally { dugme.disabled = !yuklendi || guncelleniyor; }
  }

  function duzenAc(ref) {
    const kayit = model?.kayitlar?.find(k => k.ref === ref);
    if (!kayit) return;
    const eskiOdak = document.activeElement;
    const pencere = document.createElement('dialog');
    pencere.className = 'ek9-hazirlik'; pencere.setAttribute('aria-labelledby', 'defter-duzen-baslik');
    pencere.innerHTML = `<form method="dialog" data-defter-form><h2 id="defter-duzen-baslik">İhtida Defteri kaydı</h2>
      <p><strong>${kacir(kayit.adSoyad)}</strong> · <span class="mono">${kacir(kayit.ref)}</span></p>
      <div class="ucf-izgara">
        <label class="tam" for="defter-durum">Durum<select id="defter-durum" name="durum">${Object.entries(durumlar).map(([deger, ad]) => `<option value="${deger}"${kayit.durum === deger ? ' selected' : ''}${(!metin(kayit.defterNo) && ['musavirlikte', 'teslim-edildi'].includes(deger)) ? ' disabled' : ''}>${ad}</option>`).join('')}</select></label>
        ${alan('defter-ihtida-tarihi', 'İhtida tarihi', tarihGirdisi(kayit.ihtidaTarihi), 'date')}
        ${alan('defter-sahit-1', 'Birinci şahit', kayit.sahit1)}
        ${alan('defter-sahit-2', 'İkinci şahit', kayit.sahit2)}
        ${alan('defter-ek9-no', 'EK-9 no', kayit.ek9No)}
        ${alan('defter-dhys-no', 'DHYS no', kayit.dhysNo)}
        ${alan('defter-gonderim', 'Müşavirliğe gönderim tarihi', tarihGirdisi(kayit.musavirlikGonderimTarihi), 'date')}
        ${alan('defter-donus', 'Müşavirlik dönüş tarihi', tarihGirdisi(kayit.musavirlikDonusTarihi), 'date')}
        ${alan('defter-teslim', 'Teslim tarihi', tarihGirdisi(kayit.teslimTarihi), 'date')}
        <label class="tam" for="defter-teslim-yontemi">Teslim yöntemi<select id="defter-teslim-yontemi" name="teslimYontemi"><option value="">Seçiniz</option>${Object.entries(teslimler).map(([deger, ad]) => `<option value="${deger}"${kayit.teslimYontemi === deger ? ' selected' : ''}>${ad}</option>`).join('')}</select></label>
        ${alan('defter-posta-takip', 'Posta takip no', kayit.postaTakipNo)}
        <label class="tam" for="defter-not">Not<textarea id="defter-not" name="not" rows="4">${kacir(kayit.not)}</textarea></label>
      </div>
      <label class="onay-kutu tam" data-merasim-onayi><input type="checkbox" name="merasimOnayi" /> Merasimin yapıldığını doğruluyorum</label>
      ${!metin(kayit.defterNo) ? '<p class="not">Önce merasim tarihini girip doğrulamayı kaydedin. Defter numarası verildikten sonra Müşavirlik ve teslim adımları açılır.</p>' : ''}
      <p data-defter-hata class="hata" role="alert" hidden></p>
      <div class="ek9-eylemler"><button type="submit" class="dugme birincil" value="kaydet">Kaydet</button><button type="submit" class="dugme" value="iptal">Vazgeç</button></div></form>`;
    document.body.append(pencere); pencere.showModal();
    pencere.addEventListener('close', () => { pencere.remove(); eskiOdak?.focus(); }, { once: true });
    const form = pencere.querySelector('[data-defter-form]');
    const hata = pencere.querySelector('[data-defter-hata]');
    const hataYaz = yazi => { hata.textContent = yazi; hata.hidden = !yazi; };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (e.submitter?.value === 'iptal') return pencere.close();
      const v = Object.fromEntries(new FormData(form));
      if (v.durum === 'tamamlandi' && (!v['defter-ihtida-tarihi'] || v.merasimOnayi !== 'on')) return hataYaz('Merasim tamamlandı için tarih ve doğrulama kutusu gereklidir.');
      if (v.durum === 'musavirlikte' && !v['defter-gonderim']) return hataYaz('Müşavirlikte durumu için gerçek gönderim tarihi gereklidir.');
      if (v.durum === 'teslim-edildi' && !v['defter-teslim']) return hataYaz('Teslim edildi durumu için teslim tarihi gereklidir.');
      hataYaz('');
      const veri = {
        tur: 'ihtida-defteri-guncelle', ref: kayit.ref, durum: v.durum, merasimDogrulandi: v.merasimOnayi === 'on', ihtidaTarihi: v['defter-ihtida-tarihi'],
        sahit1: v['defter-sahit-1'], sahit2: v['defter-sahit-2'], ek9No: v['defter-ek9-no'], dhysNo: v['defter-dhys-no'], musavirlikGonderimTarihi: v['defter-gonderim'], musavirlikDonusTarihi: v['defter-donus'],
        teslimTarihi: v['defter-teslim'], teslimYontemi: v.teslimYontemi, postaTakipNo: v['defter-posta-takip'], not: v['defter-not'],
      };
      const dugme = e.submitter; dugme.disabled = true;
      try {
        const cevap = await gasPost(veri);
        if (!cevap?.ok) throw new Error(hataMesaji(cevap, 'Kayıt güncellenemedi.'));
        pencere.close(); await yukle();
      } catch (kayitHatasi) { hataYaz(kayitHatasi.message || 'Kayıt güncellenemedi. Lütfen yeniden deneyin.'); }
      finally { dugme.disabled = false; }
    });
  }

  bolum.addEventListener('toggle', () => { if (bolum.open && !yuklendi) yukle(); });
  bolum.querySelector('[data-defter-yenile]').addEventListener('click', () => { yuklendi = false; yukle(); });
  bolum.querySelectorAll('[data-defter-dosya]').forEach(b => b.addEventListener('click', () => dosyaIndir(b.dataset.defterDosya, b)));
}

