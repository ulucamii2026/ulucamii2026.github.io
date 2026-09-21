/** Yönetim panelinin «Seviye testleri» sekmesi — panel.js'in dinamik modülü (paket 06, 20 Eylül 2026).
 *
 *  Mahremiyet — bu modülün bağlayıcı sınırları (docs/SEVIYE-TESTI.md §7, GDPR md. 9):
 *   · Seviye kayıtları CSV'ye AKTARILMAZ; dışa aktarma düğmesi bu sekmede kapalıdır (panel.js).
 *   · `seviye-detay` yanıtı sessionStorage/localStorage'a ASLA yazılmaz; yalnız açık pencerenin
 *     yerel değişkeninde durur ve pencere kapanınca bırakılır.
 *   · Sunucudan gelen her metin `kacir` ile kaçırılır; ham metin innerHTML'e girmez.
 *   · Toplu silme yoktur: tek kayıt, referansı yazdırılan ikinci onayla silinir.
 *   · Din görevlisinin telefonu bu ekranda hiçbir biçimde geçmez.
 */

/* ---- Yardımcılar (panel.js aynılarını parametreyle verebilir; veremezse burası kullanılır) ---- */
const varsayilanKacir = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Defter zamanı ("20.09.2026 14:30") → sıralanabilir sayı. Yalnız sıralama için; saat dilimi sapması önemsiz. */
const zamanSayisi = (deger) => {
  const d = String(deger ?? '').trim();
  const m = d.match(/^(\d{2})[.\/](\d{2})[.\/](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Sütun başlığından sıra: önce tam eşleşme, sonra içerme (panel.js'teki `sut` ile aynı davranış). */
const sut = (basliklar, ...adaylar) => {
  const kucuk = (basliklar || []).map((b) => String(b).trim().toLocaleLowerCase('tr'));
  for (const a of adaylar) { const i = kucuk.indexOf(a); if (i !== -1) return i; }
  for (const a of adaylar) { const i = kucuk.findIndex((b) => b.includes(a)); if (i !== -1) return i; }
  return -1;
};

const DILLER = { tr: 'Türkçe', fr: 'Fransızca', en: 'İngilizce', nl: 'Flemenkçe', de: 'Almanca', ar: 'Arapça' };
const dilAdi = (kod) => DILLER[String(kod || '').trim().toLocaleLowerCase('tr')] || String(kod || '').trim();

/* Arap harfi taşıyan şık metni `lang="ar" dir="rtl"` ile yazılır (Arapça şıklı okuma maddeleri). */
const ARAPCA = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/* Defterdeki «Durum» hücresi " | " ile ayrılmış sistem notlarıdır (seviyeDurumNotuEkle). */
const DURUM_ROZETLERI = [
  { kod: 'imam-eposta-gonderilemedi', sinif: 'sorun', metin: 'Hoca raporu gönderilemedi',
    baslik: 'Rapor bilerek yedeksiz gönderilir; kayıt yine defterdedir, ayrıntı bu panelden okunur.' },
  { kod: 'katilimci-eposta-gonderilemedi', sinif: 'sv-uyari', metin: 'Katılımcıya e-posta gidemedi',
    baslik: 'Katılımcı özet e-postasını alamadı — «E-posta yaz» ile elle dönülür.' },
  { kod: 'eposta-bekleniyor', sinif: '', metin: 'E-posta gönderimi sürüyor',
    baslik: 'Gönderim sonucu henüz deftere işlenmedi; birkaç dakika sonra tazeleyin.' },
];

const HATA_METINLERI = {
  yetki: 'Panel anahtarı kabul edilmedi — bir kez yeniden giriş yapın.',
  yetkisiz: 'Panel anahtarı kabul edilmedi — bir kez yeniden giriş yapın.',
  'ref-gecersiz': 'Referans numarası geçersiz.',
  bulunamadi: 'Kayıt defterde bulunamadı; silinmiş ya da saklama süresi dolmuş olabilir.',
  'sutun-yok': 'Defterin sütun düzeni beklenenden farklı.',
  'seviye-detay-hatasi': 'Arka uç ayrıntıyı hazırlayamadı.',
  'seviye-sil-hatasi': 'Arka uç kaydı silemedi.',
};
const hataMetni = (kod) => HATA_METINLERI[String(kod || '')] || String(kod || 'Bilinmeyen hata');

let pencereSayaci = 0;

/**
 * @param {{ gasIstek:(islem:string, parametreler?:object)=>Promise<any>,
 *           gasPost:(veri:object)=>Promise<any>,
 *           kacir?:(s:any)=>string, yenile?:()=>any,
 *           tarihBicim?:(d:any)=>string, telefonE164?:(d:any)=>string }} baglantilar
 * @returns {{ ciz:(kap:Element, veri:any, suzgec?:string)=>void }}
 */
export function seviyePanelKur({ gasIstek, gasPost, kacir, yenile, tarihBicim, telefonE164 } = {}) {
  const kac = typeof kacir === 'function' ? kacir : varsayilanKacir;
  const tarih = typeof tarihBicim === 'function' ? tarihBicim : (d) => String(d ?? '').trim();
  const e164 = typeof telefonE164 === 'function'
    ? telefonE164
    : (d) => { const r = String(d || '').replace(/\D/g, ''); return r ? (r.startsWith('00') ? '+' + r.slice(2) : (r.startsWith('0') ? '+32' + r.slice(1) : '+' + r)) : ''; };
  const tazele = typeof yenile === 'function' ? yenile : () => {};

  /* ============================ Liste ============================ */

  function ciz(kap, veri, suzgec) {
    if (!kap) return;
    /* Eski arka uç (v37 ve öncesi) `seviyeler` alanını HİÇ göndermez. Yeni arka uçta defter
       henüz açılmamışsa alan gelir ama boştur (`{ basliklar: [], satirlar: [] }`) — o boş liste demektir. */
    if (!veri) {
      kap.innerHTML = '<div class="bilgi-kutu uyari"><b>Arka uç güncellemesi bekleniyor.</b> '
        + 'Seviye testi listesi henüz dağıtılmadı. Gelen sonuçlar yine de dernek defterine düşüyor ve '
        + 'hoca raporu imam@ulucamii.be adresine gidiyor; veri kaybı yok.</div>';
      return;
    }
    const b = Array.isArray(veri.basliklar) ? veri.basliklar : [];
    const satirlar = Array.isArray(veri.satirlar) ? veri.satirlar : [];
    if (!b.length || !satirlar.length) {
      kap.innerHTML = '<div class="bilgi-kutu">Henüz seviye tespit testi sonucu gelmedi. '
        + 'Yeni sonuçlar buraya kendiliğinden düşer.</div>';
      return;
    }
    const s = {
      zaman: sut(b, 'zaman'), ref: sut(b, 'referans'), ad: sut(b, 'ad soyad', 'adı soyadı', 'adı'),
      eposta: sut(b, 'e-posta'), telefon: sut(b, 'telefon'),
      testDili: sut(b, 'test dili'), dersDili: sut(b, 'ders dili'),
      kuran: sut(b, 'kur\'an düzeyi', 'kur’an düzeyi', 'düzeyi'), tecvid: sut(b, 'tecvid'),
      program: sut(b, 'önerilen program', 'program'), sure: sut(b, 'süre (dk)', 'süre'),
      atlananlar: sut(b, 'atlananlar'), durum: sut(b, 'durum'),
    };
    const al = (r, i) => (i >= 0 ? String(r[i] ?? '').trim() : '');
    /* Arama yalnız ad, e-posta ve referansta (bütün satırda arama md. 9 alanlarını da tarardı). */
    const ara = String(suzgec || '').trim().toLocaleLowerCase('tr');
    const secili = satirlar
      .map((r, sira) => ({ r, sira }))
      .filter(({ r }) => !ara || [al(r, s.ad), al(r, s.eposta), al(r, s.ref)]
        .some((x) => x.toLocaleLowerCase('tr').includes(ara)))
      /* En yeni üstte: arka uç da böyle gönderir, panel yine de kendi sıralar. */
      .sort((x, y) => (zamanSayisi(al(y.r, s.zaman)) - zamanSayisi(al(x.r, s.zaman))) || (x.sira - y.sira));

    if (!secili.length) {
      kap.innerHTML = '<div class="bilgi-kutu">Aramaya uyan seviye testi yok.</div>';
      return;
    }

    kap.innerHTML = secili.map(({ r }) => kart(r, s, al)).join('');
    kap.querySelectorAll('[data-seviye-detay]').forEach((d) => d.addEventListener('click', () => ayrintiAc(d)));
    kap.querySelectorAll('[data-seviye-sil]').forEach((d) => d.addEventListener('click', () => silOnayiAc(d)));
  }

  function kart(r, s, al) {
    const ref = al(r, s.ref);
    const ad = al(r, s.ad) || '(isim yok)';
    const eposta = al(r, s.eposta);
    const telefon = al(r, s.telefon);
    const duzey = al(r, s.kuran);
    const tecvid = /^evet$/i.test(al(r, s.tecvid));
    const program = al(r, s.program);
    const atlananlar = al(r, s.atlananlar);

    const notlar = String(al(r, s.durum)).split('|').map((x) => x.trim()).filter(Boolean);
    const rozetler = DURUM_ROZETLERI.filter((u) => notlar.includes(u.kod))
      .map((u) => `<span class="rozet-durum${u.sinif ? ' ' + u.sinif : ''}" title="${kac(u.baslik)}">${kac(u.metin)}</span>`);

    const bilgiler = [];
    if (al(r, s.zaman)) bilgiler.push(`<span>${kac(tarih(al(r, s.zaman)))}</span>`);
    bilgiler.push(`<span class="sv-duzey">Kur’an okuma <b>K${kac(/^[0-5]$/.test(duzey) ? duzey : '?')}</b>${tecvid ? ' · tecvid' : ''}</span>`);
    if (program) bilgiler.push(`<span>Önerilen program <b>${kac(program)}</b></span>`);
    bilgiler.push(`<span>Test dili: <b>${kac(dilAdi(al(r, s.testDili)) || '—')}</b> → ders dili: <b>${kac(dilAdi(al(r, s.dersDili)) || '—')}</b></span>`);
    if (al(r, s.sure)) bilgiler.push(`<span>${kac(al(r, s.sure))} dk</span>`);
    if (atlananlar && atlananlar !== '{}') bilgiler.push('<span class="sv-atlandi">Bölüm atlandı</span>');

    const araclar = [`<button class="dugme" type="button" data-seviye-detay="${kac(ref)}" data-seviye-ad="${kac(ad)}" aria-label="${kac(ad)} — seviye tespiti ayrıntısı">Ayrıntı</button>`];
    if (eposta.includes('@')) {
      const konu = encodeURIComponent(`Seviye tespit sonucunuz — ${ref}`);
      araclar.push(`<a class="dugme" href="mailto:${kac(encodeURIComponent(eposta).replace(/%40/g, '@'))}?subject=${kac(konu)}" aria-label="${kac(ad)} — e-posta yaz">E-posta yaz</a>`);
    }
    if (telefon) {
      const numara = e164(telefon);
      if (numara) araclar.push(`<a class="dugme" href="tel:${kac(numara)}" aria-label="${kac(ad)} — telefonla ara">Ara</a>`);
    }
    araclar.push(`<button class="dugme sv-sil" type="button" data-seviye-sil="${kac(ref)}" data-seviye-ad="${kac(ad)}" aria-label="${kac(ad)} — ${kac(ref)} kaydını sil">Kaydı sil</button>`);

    return `<article class="bkart" data-seviye-kart="${kac(ref)}">
      <div class="bkart-ust"><span class="bkart-ad">${kac(ad)}</span>${ref ? `<span class="bkart-ref">${kac(ref)}</span>` : ''}${
        rozetler.length ? `<span class="sv-rozetler">${rozetler.join('')}</span>` : ''}</div>
      <div class="bkart-satir">${bilgiler.join('')}</div>
      <div class="bkart-arac">${araclar.join('')}</div>
    </article>`;
  }

  /* ============================ Ayrıntı penceresi ============================ */

  /** `<dialog>` iskeleti: Esc ve «Kapat» ile kapanır, odak başlığa gelir ve kapanınca tetikleyene döner. */
  function pencereAc(sinif, baslikMetni, govdeHtml, eylemlerHtml) {
    const no = ++pencereSayaci;
    const baslikId = `sv-pencere-baslik-${no}`;
    const pencere = document.createElement('dialog');
    pencere.className = `ek9-hazirlik ${sinif}`;
    pencere.setAttribute('aria-labelledby', baslikId);
    pencere.innerHTML = `<h2 id="${baslikId}" tabindex="-1">${baslikMetni}</h2>${govdeHtml}
      <div class="ek9-eylemler">${eylemlerHtml}</div>`;
    const eskiOdak = document.activeElement;
    document.body.append(pencere);
    pencere.showModal();
    pencere.addEventListener('close', () => {
      pencere.remove();
      if (eskiOdak && typeof eskiOdak.focus === 'function' && eskiOdak.isConnected) eskiOdak.focus();
    }, { once: true });
    return { pencere, baslik: pencere.querySelector('h2') };
  }

  async function ayrintiAc(dugme) {
    const ref = dugme.dataset.seviyeDetay || '';
    const ad = dugme.dataset.seviyeAd || '';
    const { pencere, baslik } = pencereAc(
      'sv-ayrinti',
      `Seviye tespiti — ${kac(ref)}`,
      `<p class="not">Bu ekrandaki bilgiler özel nitelikli kişisel veridir (GDPR md. 9): dışa aktarılmaz,
       tarayıcıda saklanmaz ve pencere kapanınca bellekten bırakılır.</p>
       <p data-sv-durum role="status" class="not">${kac(ad)} kaydının ayrıntısı getiriliyor…</p>
       <div data-sv-govde></div>`,
      '<button type="button" class="dugme" data-sv-kapat>Kapat</button>'
    );
    baslik.focus();
    pencere.querySelector('[data-sv-kapat]').addEventListener('click', () => pencere.close());
    const durum = pencere.querySelector('[data-sv-durum]');
    const govde = pencere.querySelector('[data-sv-govde]');
    /* Rapor YALNIZ bu değişkende durur; hiçbir tarayıcı deposuna yazılmaz. */
    let rapor = null;
    try {
      const j = await gasIstek('seviye-detay', { ref });
      if (!j || !j.ok || !j.rapor) throw new Error(hataMetni(j && j.hata));
      rapor = j.rapor;
      if (!pencere.isConnected) return;
      govde.innerHTML = raporHtml(rapor);
      /* Yükleme bitti: `role="status"` kısa bir bildirim söyler, rapor metnini tekrarlamaz. */
      durum.className = 'not';
      durum.textContent = 'Ayrıntı hazır.';
    } catch (hata) {
      if (!pencere.isConnected) return;
      durum.hidden = false;
      durum.className = 'bilgi-kutu hata';
      durum.textContent = 'Ayrıntı alınamadı: ' + (hata && hata.message ? hata.message : 'bilinmeyen hata');
    } finally {
      rapor = null;
    }
  }

  /* ---- Rapor bölümleri: `seviyeRaporVerisi` (scripts/apps-script/seviye-testi-isleri.gs) alanlarıyla ---- */

  const metinAr = (deger) => {
    const d = String(deger ?? '');
    return ARAPCA.test(d) ? `<span lang="ar" dir="rtl" class="sv-ar">${kac(d)}</span>` : kac(d);
  };
  const liste = (ogeler) => (ogeler && ogeler.length ? `<ul class="sv-liste">${ogeler.map((x) => `<li>${x}</li>`).join('')}</ul>` : '');
  const bolum = (baslikMetni, icerik) => (icerik ? `<section class="sv-bolum"><h3>${kac(baslikMetni)}</h3>${icerik}</section>` : '');
  const yuzdeSinirli = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const basamakDokumu = (basamaklar, onEk) => (basamaklar || [])
    .map((x) => `${kac(onEk)}${kac(x.basamak)}: ${kac(x.dogru)}/${kac(x.toplam)} — ${x.gecti ? 'geçti' : 'geçmedi'}`)
    .join(' · ');

  function yanlisTablosu(maddeler) {
    return `<table class="sv-tablo"><thead><tr><th scope="col">Kimlik</th><th scope="col">Soru</th>`
      + `<th scope="col">Verdiği</th><th scope="col">Doğrusu</th></tr></thead><tbody>`
      + maddeler.map((m) => `<tr><th scope="row" class="sv-kimlik">${kac(m.id)}${m.basamak ? ` <small>B${kac(m.basamak)}</small>` : ''}</th>`
        + `<td>${kac(m.soru)}</td><td>${metinAr(m.verilen)}</td><td>${metinAr(m.dogru)}</td></tr>`).join('')
      + '</tbody></table>';
  }

  function raporHtml(r) {
    const parcalar = [];

    /* Künye — telefon yalnız katılımcının kendi verdiği numaradır. */
    parcalar.push(`<p class="sv-kunye"><b>${kac(r.adSoyad)}</b> · ${kac(tarih(r.zaman))} · ${kac(r.eposta)}`
      + `${r.telefon ? ' · ' + kac(r.telefon) : ''}${r.sureDk ? ' · ' + kac(r.sureDk) + ' dk' : ''}</p>`);

    /* 1) Raporun İLK başlığı her zaman Kur'an okuma düzeyidir (docs/SEVIYE-TESTI.md §7). */
    const okuma = r.okuma || {};
    const okumaOzet = okuma.atlandi
      ? 'Bölüm atlandı'
      : `${kac(okuma.ad)} <span class="sv-duzey">K${kac(okuma.duzey)}</span> <small>(0–5)</small>`;
    const okumaIcerik = [
      `<p class="sv-buyuk">${okumaOzet}</p>`,
      `<div class="oran" aria-hidden="true"><span style="width:${yuzdeSinirli((okuma.atlandi ? 0 : Number(okuma.duzey) || 0) / 5 * 100)}%"></span></div>`,
      `<p>Tecvid kavramları: <b>${okuma.tecvid ? 'tanıyor' : 'henüz tanımıyor'}</b></p>`,
      okuma.basamaklar && okuma.basamaklar.length ? `<p class="sv-basamak">${basamakDokumu(okuma.basamaklar, 'K')}</p>` : '',
      '<p class="not">Test yalnız <b>tanımayı</b> ölçer; akıcılık, mahreç ve tecvid uygulaması ilk yüz yüze derste teyit edilir.</p>',
    ];
    if (r.okumaBeyanlari && r.okumaBeyanlari.length) {
      okumaIcerik.push('<h4>Katılımcının kendi beyanı</h4>');
      okumaIcerik.push(liste(r.okumaBeyanlari.map((x) => `${kac(x.soru)} → <b>${kac(x.cevap)}</b>`)));
    }
    if (r.celiskiler && r.celiskiler.length) {
      okumaIcerik.push(`<div class="bilgi-kutu uyari"><b>Beyan ile sonuç çelişiyor.</b>${liste(r.celiskiler.map(kac))}</div>`);
    }
    parcalar.push(bolum('Kur’an okuma düzeyi', okumaIcerik.join('')));

    /* 2) Profil */
    if (r.profil && r.profil.length) {
      parcalar.push(bolum('Katılımcı bilgileri',
        `<table class="sv-tablo sv-profil"><tbody>${r.profil
          .map((x) => `<tr><th scope="row">${kac(x.etiket)}</th><td>${kac(x.deger) || '—'}</td></tr>`).join('')}</tbody></table>`));
    }

    /* 2b) Yer ve yerel destek (form sürümü 2) — eğitim katılımcıya en yakın yerde planlanabilsin.
       Paylaşım onayı yoksa uyarı kutusu çıkar: onaysız hiçbir bilgi başka görevliye / Müşavirliğe verilmez. */
    if (r.yerel) {
      const y = r.yerel;
      parcalar.push(bolum('Yer ve yerel destek', [
        liste((y.satirlar || []).map(kac)),
        '<h4>Paylaşım onayları</h4>',
        liste((y.onaylar || []).map((x) => `<b>${kac(x)}</b>`)),
        y.uyari ? `<div class="bilgi-kutu uyari">${kac(y.uyari)}</div>` : '',
        liste((y.oneriler || []).map(kac)),
      ].join('')));
    }

    /* 3) Alan düzeyleri — metin + basit çubuk (çubuk süs, ekran okuyucuya metin yeter). */
    if (r.alanlar && r.alanlar.length) {
      parcalar.push(bolum('Dinî bilgi alanları', r.alanlar.map((a) => `<div class="sv-alan">
        <p class="sv-alan-ust"><b>${kac(a.ad)}</b> <span>${a.atlandi ? 'Bölüm atlandı' : `${kac(a.duzeyAdi)} · %${kac(a.yuzde)}`}</span></p>
        <div class="oran" aria-hidden="true"><span style="width:${yuzdeSinirli(a.atlandi ? 0 : a.yuzde)}%"></span></div>
        ${a.basamaklar && a.basamaklar.length ? `<p class="sv-basamak">${basamakDokumu(a.basamaklar, 'B')}</p>` : ''}
      </div>`).join('')));
    }

    /* 4) Yanlış ve «bilmiyorum» maddeleri — alan alan tablo. */
    const alanAdlari = [{ alan: 'okuma', ad: 'Kur’an okuma' }].concat((r.alanlar || []).map((a) => ({ alan: a.alan, ad: a.ad })));
    const yanlisBloklari = alanAdlari.map(({ alan, ad }) => {
      const maddeler = (r.yanlislar && r.yanlislar[alan]) || [];
      if (!maddeler.length) return '';
      return `<h4>${kac(ad)} <span class="sv-say">(${maddeler.length})</span></h4>${yanlisTablosu(maddeler)}`;
    }).filter(Boolean);
    const sayac = `<p class="not">Cevapsız madde: <b>${kac(r.cevapsiz)}</b> · Doğru madde: <b>${kac((r.dogrular || []).length)}</b></p>`;
    parcalar.push(bolum('Yanlış ve «bilmiyorum» maddeleri',
      (yanlisBloklari.length ? yanlisBloklari.join('') : '<p>Yanlış ya da «bilmiyorum» işaretlenmiş madde yok.</p>') + sayac));

    /* 5) Mezhebe bağlı maddeler — puana girmez, yalnız bilgi. */
    if (r.mezhep && r.mezhep.length) {
      parcalar.push(bolum('Mezhebe bağlı maddeler (puana girmez)',
        `<table class="sv-tablo"><thead><tr><th scope="col">Kimlik</th><th scope="col">Soru</th>`
        + `<th scope="col">Verdiği</th><th scope="col">Hanefî mezhebine göre</th></tr></thead><tbody>`
        + r.mezhep.map((m) => `<tr><th scope="row" class="sv-kimlik">${kac(m.id)}</th><td>${kac(m.soru)}</td>`
          + `<td>${metinAr(m.verilen)}</td><td>${metinAr(m.dogru)}</td></tr>`).join('')
        + '</tbody></table>'));
    }

    /* 6) Ezber */
    if (r.ezberler && r.ezberler.length) {
      parcalar.push(bolum('Ezber listesi', liste(r.ezberler.map((e) => `${kac(e.ad)}: <b>${kac(e.durum)}</b>`))));
    }

    /* 7) Uygulama öz beyanı */
    if (r.uygulamaBeyanlari && r.uygulamaBeyanlari.length) {
      parcalar.push(bolum('Uygulama öz beyanı', liste(r.uygulamaBeyanlari.map((x) => `${kac(x.soru)} → <b>${kac(x.cevap)}</b>`))));
    }

    /* 8) Önerilen program — öneri, karar değil. */
    if (r.program) {
      parcalar.push(bolum('Önerilen program',
        `<p class="sv-buyuk"><b>${kac(r.program.kod)} — ${kac(r.program.ad)}</b></p><p>${kac(r.program.aciklama)}</p>`
        + '<p class="not">Program önerisi karar değil, öneridir.</p>'));
    }

    /* 9) Uyarılar */
    if (r.uyarilar && r.uyarilar.length) {
      parcalar.push(bolum('Uyarılar', `<div class="bilgi-kutu uyari">${liste(r.uyarilar.map(kac))}</div>`));
    }

    /* 10) Katılımcının notu */
    if (r.not) parcalar.push(bolum('Katılımcının notu', `<p class="sv-not">${kac(r.not)}</p>`));

    parcalar.push(`<p class="not sv-kunye-alt">Soru bankası sürümü: ${kac(r.bankaSurumu)} · Rıza sürümü: ${kac(r.rizaSurumu)} · Test dili: ${kac(dilAdi(r.testDili))}</p>`);
    return parcalar.join('');
  }

  /* ============================ Silme (ikinci onay) ============================ */

  function silOnayiAc(dugme) {
    const ref = dugme.dataset.seviyeSil || '';
    const ad = dugme.dataset.seviyeAd || '';
    const { pencere } = pencereAc(
      'sv-onay',
      'Kaydı sil',
      `<p>Silinecek kayıt: <b class="bkart-ref">${kac(ref)}</b>${ad ? ` — ${kac(ad)}` : ''}</p>
       <p>Bu işlem <b>geri alınamaz</b>; kayıt dernek defterinden kalıcı olarak silinir. Hoca posta kutusundaki
       rapor iletisi ve varsa yazışma ayrıca <b>elle</b> silinir (Gelen + Çöp). Talep sahibine silindiği bildirilir.</p>
       <p data-sv-onay-durum role="status"></p>`,
      '<button type="button" class="dugme" data-sv-vazgec>Vazgeç</button>'
      + `<button type="button" class="dugme sv-sil" data-sv-onayla>Evet, ${kac(ref)} kaydını sil</button>`
    );
    const vazgec = pencere.querySelector('[data-sv-vazgec]');
    const onayla = pencere.querySelector('[data-sv-onayla]');
    const durum = pencere.querySelector('[data-sv-onay-durum]');
    vazgec.focus();   // yıkıcı işlemde varsayılan odak güvenli düğmededir
    vazgec.addEventListener('click', () => pencere.close());
    onayla.addEventListener('click', async () => {
      vazgec.disabled = true; onayla.disabled = true;
      durum.className = '';
      durum.textContent = 'Kayıt siliniyor…';
      try {
        const j = await gasPost({ tur: 'seviye-sil', ref });
        if (!j || !j.ok) throw new Error(hataMetni(j && j.hata));
        pencere.close();
        await tazele();
        /* Kart listeden kalkınca odak «gövdeye» düşüyordu: kalan ilk kaydın eylemine,
           liste boşaldıysa sekme düğmesine taşınır (klavye kullanıcısı yerini kaybetmesin). */
        const sonraki = document.querySelector('#basvuru-liste [data-seviye-detay]') || document.getElementById('sekme-seviye');
        if (sonraki && typeof sonraki.focus === 'function') sonraki.focus();
      } catch (hata) {
        if (!pencere.isConnected) return;
        durum.className = 'bilgi-kutu hata';
        durum.textContent = 'Silinemedi: ' + (hata && hata.message ? hata.message : 'bilinmeyen hata');
        vazgec.disabled = false; onayla.disabled = false;
      }
    });
  }

  return { ciz };
}
