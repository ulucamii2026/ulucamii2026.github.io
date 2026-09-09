/* Mühtedi dilekçesi (8 Eylül 2026).
 *
 * NEDEN: «Zarf İçeriği ve Gönderi Talimatı» (Müşavirliğe C4 zarf) beş belge ister ve ilki
 * «Dilekçe — mühtedinin el yazısı/imzalı ihtida belgesi talebi»dir. Diğer dördü sistemde vardı
 * (EK-10, kimlik ön/arka, vesikalık, EK-9 nüshası); dilekçe elle yazılıyordu. Başvuran artık
 * imzasını formda çizdiği için dilekçe panelde, imzalı olarak üretilebiliyor.
 *
 * İKİ DİLLİ: üst blok Türkçe (Müşavirlik okur), alt blok başvuranın kendi dili (ne imzaladığını
 * bilerek imzalar). A4 dikey, tek sayfa, pdf-lib ile — EK-9'daki Lora yazı tipleri kullanılır.
 *
 * Dayanak: Diyanet İhtida İşlemleri Uygulama Genelgesi md. 44.
 */

const A4 = { g: 595.28, y: 841.89 };
const KENAR = 62;

const METIN = {
  tr: {
    yer: 'Marche-en-Famenne',
    makam: 'T.C. BRÜKSEL BÜYÜKELÇİLİĞİ\nSOSYAL İŞLER MÜŞAVİRLİĞİNE',
    baslik: 'Konu: İhtida Belgesi (EK-9) talebi',
    govde: [
      'Kendi hür irademle, hiçbir baskı ve zorlama olmadan İslam dinini seçtim ve Marche-en-Famenne Ulu Camii’nde, iki şahit huzurunda kelime-i şehadet getirerek Müslüman oldum.',
      'Adıma İhtida Belgesi (EK-9) düzenlenmesini talep ediyorum. Diyanet İşleri Başkanlığı İhtida İşlemleri Uygulama Genelgesi’nin 44. maddesi gereğince istenen bir adet vesikalık fotoğrafım ile kimlik belgemin ön ve arka yüzünün örneği bu dilekçenin ekindedir; EK-10 Açık Rıza Metni’ni ayrıca imzaladım.',
      'Gereğini saygılarımla arz ederim.',
    ],
    ekBaslik: 'EKLER',
    ekler: ['Vesikalık fotoğraf (1 adet)', 'Kimlik belgesi örneği (ön ve arka yüz)', 'EK-10 Açık Rıza Metni (imzalı)'],
    bilgiBaslik: 'BAŞVURAN',
    alan: { ad: 'Adı Soyadı', dogum: 'Doğum yeri ve tarihi', uyruk: 'Uyruğu', adres: 'Adresi', telefon: 'Telefon', eposta: 'E-posta', ref: 'Başvuru referansı' },
    imzaEtiket: 'İmza',
    imzaBos: '(İmza)',
    dipnot: 'Bu dilekçe, başvuranın online ihtida başvurusunda verdiği bilgilerle Marche-en-Famenne Ulu Camii tarafından hazırlanmış ve başvuranın kendi imzasını taşımaktadır.',
  },
  fr: {
    baslik: 'Objet : demande d’attestation de conversion (EK-9)',
    govde: [
      'De ma propre volonté, sans aucune pression ni contrainte, j’ai choisi la religion musulmane et je suis devenu(e) musulman(e) à la mosquée Ulu Camii de Marche-en-Famenne, en prononçant la profession de foi devant deux témoins.',
      'Je demande l’établissement de l’attestation de conversion (EK-9) à mon nom. Conformément à l’article 44 de la directive du Diyanet relative aux conversions, une photo d’identité ainsi que la copie du recto et du verso de ma pièce d’identité sont jointes à la présente ; j’ai par ailleurs signé le formulaire de consentement EK-10.',
    ],
    dipnot: 'Traduction française du texte turc ci-dessus ; une seule signature vaut pour les deux.',
  },
  en: {
    baslik: 'Subject: request for a conversion certificate (EK-9)',
    govde: [
      'Of my own free will, under no pressure or compulsion, I have chosen the religion of Islam and became a Muslim at the Ulu Camii mosque in Marche-en-Famenne, pronouncing the declaration of faith before two witnesses.',
      'I request that the conversion certificate (EK-9) be issued in my name. In accordance with article 44 of the Diyanet conversion directive, one passport photo and a copy of the front and back of my identity document are attached; I have also signed the EK-10 consent form.',
    ],
    dipnot: 'English translation of the Turkish text above; one signature covers both.',
  },
};

/**
 * @param {object} g
 * @param {object} g.pdfLib          window.PDFLib
 * @param {object} g.fontkit         window.fontkit
 * @param {Uint8Array} g.fontBytes   Lora-Regular
 * @param {Uint8Array} g.fontKalinBytes Lora-Bold
 * @param {object} g.veri            {ref, adSoyad, dogumYeri, dogumTarihi, uyruk, adres, telefon, eposta, dil}
 * @param {string}  [g.imza]         veri URL'i (form 5. bölümünde çizilen imza); yoksa boş satır bırakılır
 * @param {Date}    [g.tarih]
 * @returns {Promise<Uint8Array>}
 */
export async function dilekceUret(g) {
  const { PDFDocument, rgb } = g.pdfLib;
  const belge = await PDFDocument.create();
  belge.registerFontkit(g.fontkit);
  const font = await belge.embedFont(g.fontBytes, { subset: true });
  const kalin = await belge.embedFont(g.fontKalinBytes, { subset: true });

  const s = belge.addPage([A4.g, A4.y]);
  const MUREKKEP = rgb(0.09, 0.09, 0.12);
  const SOLUK = rgb(0.42, 0.4, 0.38);
  const genislik = A4.g - KENAR * 2;
  let y = A4.y - KENAR;

  const v = g.veri || {};
  const dil = METIN[v.dil] ? v.dil : 'fr';
  const t = { ...METIN.tr, govde: [...METIN.tr.govde], ekler: [...METIN.tr.ekler] };
  const c = dil === 'tr' ? null : { ...METIN[dil], govde: [...METIN[dil].govde] };
  if (g.onBasvuru) {
    t.govde[0] = 'Kendi hür irademle, hiçbir baskı ve zorlama olmadan İslam dinini seçmek ve adıma İhtida Belgesi düzenlenmesi için başvurmak istiyorum. Tören tarihi ve şahitler cami görevlisiyle ayrıca teyit edilecektir.';
    if (c) c.govde[0] = dil === 'fr'
      ? 'De ma propre volonté, sans pression ni contrainte, je souhaite embrasser l’islam et demander une attestation de conversion. La date de la cérémonie et les témoins seront confirmés avec le responsable de la mosquée.'
      : 'Of my own free will, without pressure or compulsion, I wish to embrace Islam and apply for a conversion certificate. The ceremony date and witnesses will be confirmed with the mosque official.';
  }
  if (!g.imza) {
    t.govde[1] = t.govde[1].replace('EK-10 Açık Rıza Metni’ni ayrıca imzaladım.', 'EK-10 Açık Rıza Metni imzalanmak üzere eklenmiştir.');
    t.ekler[2] = 'EK-10 Açık Rıza Metni (imza için)';
    t.dipnot = 'Bu dilekçe, başvuru bilgileriyle hazırlanmıştır. Başvuranın imzası alınacaktır.';
    if (c) c.govde[1] = c.govde[1].replace('j’ai par ailleurs signé le formulaire de consentement EK-10.', 'le formulaire de consentement EK-10 est joint pour signature.').replace('I have also signed the EK-10 consent form.', 'the EK-10 consent form is included for signature.');
  }
  if (g.belgeTuru === 'pasaport') {
    t.govde[1] = t.govde[1].replace('kimlik belgemin ön ve arka yüzünün örneği', 'pasaportumun kimlik bilgileri sayfasının örneği');
    t.ekler[1] = 'Pasaport kimlik bilgileri sayfası örneği';
    if (c) c.govde[1] = c.govde[1].replace('la copie du recto et du verso de ma pièce d’identité', 'la copie de la page d’identité de mon passeport').replace('a copy of the front and back of my identity document', 'a copy of my passport identity page');
  }

  const sar = (metin, boyut, en, f = font) => {
    const satirlar = [];
    let satir = '';
    for (const k of String(metin).replace(/\s+/g, ' ').trim().split(' ')) {
      const aday = satir ? `${satir} ${k}` : k;
      if (f.widthOfTextAtSize(aday, boyut) <= en) satir = aday;
      else { if (satir) satirlar.push(satir); satir = k; }
    }
    if (satir) satirlar.push(satir);
    return satirlar;
  };
  const yaz = (metin, { boyut = 10.5, f = font, renk = MUREKKEP, x = KENAR, en = genislik, aralik = 1.5, altBosluk = 0 } = {}) => {
    for (const satir of sar(metin, boyut, en, f)) {
      s.drawText(satir, { x, y, size: boyut, font: f, color: renk });
      y -= boyut * aralik;
    }
    y -= altBosluk;
  };
  const cizgi = (bosluk = 10) => {
    y -= bosluk;
    s.drawLine({ start: { x: KENAR, y }, end: { x: KENAR + genislik, y }, thickness: 0.6, color: rgb(0.8, 0.78, 0.74) });
    y -= bosluk;
  };

  // --- üst bilgi: yer ve tarih (sağa yaslı) ---
  const tarih = (g.tarih || new Date());
  const iki = (n) => String(n).padStart(2, '0');
  const tarihStr = `${t.yer}, ${g.tarihiBosBirak ? '...... / ...... / ............' : `${iki(tarih.getDate())}.${iki(tarih.getMonth() + 1)}.${tarih.getFullYear()}`}`;
  const tarihEn = font.widthOfTextAtSize(tarihStr, 10);
  s.drawText(tarihStr, { x: KENAR + genislik - tarihEn, y, size: 10, font, color: SOLUK });
  y -= 34;

  // --- muhatap makam ---
  for (const satir of t.makam.split('\n')) {
    s.drawText(satir, { x: KENAR, y, size: 12, font: kalin, color: MUREKKEP });
    y -= 17;
  }
  y -= 16;
  yaz(t.baslik, { boyut: 10.5, f: kalin, altBosluk: 12 });

  // --- Türkçe gövde ---
  for (const p of t.govde) yaz(p, { altBosluk: 8 });

  // --- başvuran bilgileri ---
  y -= 6;
  cizgi(8);
  yaz(t.bilgiBaslik, { boyut: 8.5, f: kalin, renk: SOLUK, altBosluk: 6 });
  const satirlar = [
    [t.alan.ad, v.adSoyad],
    [t.alan.dogum, [v.dogumYeri, v.dogumTarihi].filter(Boolean).join(' · ')],
    [t.alan.uyruk, v.uyruk],
    [t.alan.adres, v.adres],
    [t.alan.telefon, v.telefon],
    [t.alan.eposta, v.eposta],
    [t.alan.ref, v.ref],
  ].filter(([, d]) => String(d || '').trim());
  for (const [etiket, deger] of satirlar) {
    s.drawText(etiket, { x: KENAR, y, size: 9.5, font, color: SOLUK });
    const degerX = KENAR + 132;
    const parcalar = sar(deger, 9.5, genislik - 132);
    for (let i = 0; i < parcalar.length; i++) {
      s.drawText(parcalar[i], { x: degerX, y: y - i * 13, size: 9.5, font: kalin, color: MUREKKEP });
    }
    y -= 13 * parcalar.length + 3;
  }
  cizgi(8);

  // --- ekler ---
  yaz(t.ekBaslik, { boyut: 8.5, f: kalin, renk: SOLUK, altBosluk: 5 });
  for (let i = 0; i < t.ekler.length; i++) {
    s.drawText(`${i + 1}.  ${t.ekler[i]}`, { x: KENAR + 6, y, size: 9.5, font, color: MUREKKEP });
    y -= 14;
  }

  // --- çeviri bloğu ---
  if (c) {
    y -= 14;
    yaz(c.baslik, { boyut: 9.5, f: kalin, renk: SOLUK, altBosluk: 6 });
    for (const p of c.govde) yaz(p, { boyut: 9.5, renk: SOLUK, altBosluk: 6 });
    yaz(c.dipnot, { boyut: 8, renk: SOLUK, altBosluk: 0 });
  }

  // --- imza bloğu (sağ altta) ---
  // Akışın altına iner: 62 pt boşluk, imza görseli çizginin 8-54 pt üstünde durur; böylece
  // yukarıdaki son satırın (çeviri dipnotu) üzerine binmez.
  y -= 62;
  const imzaTaban = Math.max(70, y);
  const imzaX = KENAR + genislik - 200;
  let gomulu = null;
  if (g.imza) {
    try {
      gomulu = String(g.imza).startsWith('data:image/png') || String(g.imza).startsWith('iVBOR')
        ? await belge.embedPng(g.imza)
        : await belge.embedJpg(g.imza);
    } catch { gomulu = null; }
  }
  if (gomulu) {
      const olcek = Math.min(160 / gomulu.width, 42 / gomulu.height);
    s.drawImage(gomulu, {
      x: imzaX + (200 - gomulu.width * olcek) / 2,
      y: imzaTaban + 8,
      width: gomulu.width * olcek,
      height: gomulu.height * olcek,
    });
  } else {
    const bos = t.imzaBos;
    s.drawText(bos, { x: imzaX + (200 - font.widthOfTextAtSize(bos, 9)) / 2, y: imzaTaban + 22, size: 9, font, color: SOLUK });
  }
  s.drawLine({ start: { x: imzaX, y: imzaTaban }, end: { x: imzaX + 200, y: imzaTaban }, thickness: 0.8, color: rgb(0.55, 0.53, 0.5) });
  const ad = String(v.adSoyad || '');
  s.drawText(ad, { x: imzaX + Math.max(0, (200 - kalin.widthOfTextAtSize(ad, 10)) / 2), y: imzaTaban - 14, size: 10, font: kalin, color: MUREKKEP });

  // --- dipnot ---
  const dipnotSatirlari = sar(gomulu ? t.dipnot : 'Bu dilekçe, başvuru bilgileriyle hazırlanmıştır; başvuranın kontrol edip imzalaması için imza alanı boş bırakılmıştır.', 7.5, genislik);
  let dy = 40;
  for (const satir of dipnotSatirlari) {
    s.drawText(satir, { x: KENAR, y: dy, size: 7.5, font, color: SOLUK });
    dy -= 10;
  }

  belge.setTitle(`İhtida Belgesi talebi — ${ad}`.trim());
  belge.setSubject('Mühtedi dilekçesi (Müşavirliğe gönderilecek zarf, 1. belge)');
  belge.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
  if (g.tarih) { belge.setCreationDate(g.tarih); belge.setModificationDate(g.tarih); }
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}
