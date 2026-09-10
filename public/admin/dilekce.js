/** Onaylı dilekçe: normalde tek A4; uzun alanlar kesilmeden devam sayfasına akar. */
const A4 = { w: 595.28, h: 841.89 }, M = 43, CW = A4.w - 2 * M, ALT = 765;

export async function dilekceUret(g) {
  const { PDFDocument, rgb } = g.pdfLib;
  const d = g.veri || {}, en = d.dil === 'en';
  const f = (tr, fr, eng) => `${tr} / ${en ? eng : fr}`;
  const doc = await PDFDocument.create(); doc.registerFontkit(g.fontkit);
  const body = await doc.embedFont(g.fontBytes, { subset: true });
  const bold = await doc.embedFont(g.fontKalinBytes, { subset: true });
  const C = { navy: rgb(.09,.235,.282), ink: rgb(.125,.184,.216), muted: rgb(.33,.4,.43), gold: rgb(.66,.53,.31), line: rgb(.8,.84,.84), wash: rgb(.949,.961,.957) };
  const cami = d.cami || { ad: 'Ulu Camii', sehir: 'Marche-en-Famenne', postaKodu: '6900', adres: 'Thier des Corbeaux 14' };
  const camiAdres = [cami.adres,cami.postaKodu,cami.sehir].filter(Boolean).join(', ');
  const ev = d.teslimat?.yontem === 'adres', teslimAd = ev ? d.adSoyad : cami.ad, teslimAdres = ev ? d.adres : camiAdres;
  let page, y = 26;
  const text = (s,x,top,size=10,font=body,color=C.ink) => page.drawText(String(s || ''),{ x,y:A4.h-top-size,size,font,color });
  const rule = (top,x=M,width=CW,color=C.line,thickness=.5) => page.drawLine({start:{x,y:A4.h-top},end:{x:x+width,y:A4.h-top},color,thickness});
  const wrap = (value,size,width,font=body) => {
    const result=[]; let line='';
    for (const word of String(value || '').trim().split(/\s+/).filter(Boolean)) {
      if (font.widthOfTextAtSize(line ? line+' '+word : word,size) <= width-1) {line=line?line+' '+word:word;continue;}
      if (line) { result.push(line); line=''; }
      for (const ch of word) {if (line && font.widthOfTextAtSize(line+ch,size)>width-1) {result.push(line);line='';} line+=ch;}
    }
    if(line) result.push(line); return result;
  };
  const lines = (items,x,top,size=10,leading=12.5,font=body,color=C.ink) => { items.forEach((s,i)=>text(s,x,top+i*leading,size,font,color)); return items.length*leading; };
  const newPage = (continued=false) => {
    page=doc.addPage([A4.w,A4.h]);y=26;
    if(continued) {text(f('İhtida Belgesi talebi — devam','suite','continuation'),M,y,9,bold,C.muted);rule(45);y=60;}
  };
  const room = height => {if(y+height>ALT)newPage(true);};
  const para = (value,size=9.75,leading=12.2) => {
    for(const line of wrap(value,size,CW)) {room(leading);text(line,M,y,size);y+=leading;}
  };
  const label = value => {room(28);text(value,M,y,8.1,bold,C.navy);y+=18;};
  const fields = (specs, minHeight=37) => {
    const prepared=specs.map(s=>({...s,labels:wrap(s.label,7.6,s.w,bold),values:wrap(s.value,10,s.w)}));
    const height=Math.max(minHeight,...prepared.map(s=>s.labels.length*9.5+Math.max(1,s.values.length)*12.5+10));
    room(height);
    for(const s of prepared) {
      const h=lines(s.labels,s.x,y,7.6,9.5,bold,C.muted);
      lines(s.values,s.x,y+h+3,10,12.5);
      rule(y+height-8,s.x,s.w);
    }
    y+=height;
  };
  const align = top => {if(doc.getPageCount()===1)y=Math.max(y,top);};
  const date = g.tarih || new Date();
  const rawDate = String(d.beyanTarihi || '');
  const iso=rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/), local=rawDate.match(/^(\d{2})[/.](\d{2})[/.](\d{4})/);
  const tarih=iso?`${iso[3]}.${iso[2]}.${iso[1]}`:local?`${local[1]}.${local[2]}.${local[3]}`:new Intl.DateTimeFormat('fr-BE',{timeZone:'Europe/Brussels',day:'2-digit',month:'2-digit',year:'numeric'}).format(date).replaceAll('/','.');
  const tr=g.onBasvuru
    ? 'Kendi hür irademle, hiçbir baskı ve zorlama olmaksızın İslam dinini seçmek ve adıma İhtida Belgesi (EK-9) düzenlenmesi için başvurmak istiyorum. Tören tarihi ve şahitler ilgili cami görevlisiyle ayrıca teyit edilecektir. Gerekli imzalar tamamlandıktan sonra belgemin aşağıdaki teslim adresine gönderilmesini arz ederim.'
    : 'Kendi hür irademle, hiçbir baskı ve zorlama olmaksızın İslam dinini seçtiğimi; yukarıda belirtilen camide ve tarihte, iki şahit huzurunda kelime-i şehadet getirerek Müslüman olduğumu beyan ederim. Adıma İhtida Belgesi (EK-9) düzenlenmesini ve gerekli imzalar tamamlandıktan sonra belgemin aşağıdaki teslim adresine gönderilmesini arz ederim.';
  const translated=en
    ? g.onBasvuru
      ? 'Of my own free will and without pressure or compulsion, I wish to embrace Islam and apply for a conversion certificate (EK-9) in my name. The ceremony date and witnesses will be confirmed with the mosque official. After the required signatures, I request delivery to the return address below.'
      : 'I declare that I have freely chosen Islam, without pressure or compulsion, and become Muslim by pronouncing the declaration of faith before two witnesses at the mosque and on the date stated above. I request a conversion certificate (EK-9) in my name and its delivery to the return address below after the required signatures.'
    : g.onBasvuru
      ? 'De mon plein gré, sans pression ni contrainte, je souhaite embrasser l’islam et demande une attestation de conversion (EK-9) à mon nom. La date de la cérémonie et les témoins seront confirmés avec le responsable de la mosquée. Après les signatures nécessaires, je sollicite l’envoi à l’adresse de retour ci-dessous.'
      : 'Je déclare avoir choisi l’islam de mon plein gré, sans pression ni contrainte, et être devenu(e) musulman(e) en prononçant la profession de foi devant deux témoins à la mosquée et à la date indiquées ci-dessus. Je sollicite une attestation de conversion (EK-9) à mon nom et son envoi à l’adresse de retour ci-dessous, après les signatures nécessaires.';
  newPage();
  text('ULU CAMİİ · MARCHE-EN-FAMENNE',M,26,8.3,bold,C.muted);text(en?'TR / EN':'TR / FR',A4.w-M-40,26,8.3,bold,C.muted);
  text('İhtida Belgesi talebi',M,47,23,body,C.navy);
  text(en?'Request for a conversion certificate (EK-9)':'Demande d’attestation de conversion à l’islam (EK-9)',M,80,10.1,body,C.muted);rule(102,M,CW,C.gold,1);
  text('T.C. BRÜKSEL BÜYÜKELÇİLİĞİ',M,115,11.3,bold);text('SOSYAL İŞLER MÜŞAVİRLİĞİNE',M,129,11.3,bold);
  text(en?'To the Office of the Counsellor for Social Affairs, Embassy of Türkiye in Brussels':'Au Service du conseiller des affaires sociales de l’Ambassade de Türkiye à Bruxelles',M,148,8.1,body,C.muted);
  y=178;label(f('BAŞVURAN','DEMANDEUR','APPLICANT'));
  fields([{label:f('Adı soyadı','Nom et prénom','Full name'),value:d.adSoyad,x:M,w:327},{label:f('Doğum tarihi','Date de naissance','Date of birth'),value:d.dogumTarihi,x:M+348,w:CW-348}]);
  align(233);fields([{label:f('İkamet adresi','Adresse de résidence','Home address'),value:d.adres,x:M,w:CW}],46);
  align(279);fields([{label:'E-posta / E-mail',value:d.eposta,x:M,w:303},{label:f('Telefon','Téléphone','Phone'),value:d.telefon,x:M+324,w:CW-324}]);
  align(324);label(f('CAMİ VE İHTİDA TARİHİ','MOSQUÉE ET DATE DE CONVERSION','MOSQUE AND CONVERSION DATE'));
  fields([{label:f('Başvuru / tören camisi','Mosquée','Mosque'),value:cami.ad,x:M,w:348},{label:f('İhtida tarihi','Date de conversion','Conversion date'),value:d.ihtidaTarihi,x:M+369,w:CW-369}],30);
  fields([{label:f('Cami adresi','Adresse de la mosquée','Mosque address'),value:camiAdres,x:M,w:CW}],33);
  align(407);label(f('BEYAN VE TALEP','DÉCLARATION ET DEMANDE','DECLARATION AND REQUEST'));para(tr);y+=8;room(24);rule(y);y+=12;para(translated,9.25,11.5);y+=12;

  // Kapanış kutusu ve imza bloğu önceden ölçülür. Hiçbir uzun ad/adres kırpılmaz.
  const deliveryTitle=f(ev?'Posta dönüş adresi':'Posta dönüş camisi',ev?'Adresse de retour postal de l’attestation':'Mosquée de retour postal de l’attestation',ev?'Return postal address':'Return mosque');
  const deliveryHead=wrap(deliveryTitle,7.7,CW-22,bold), deliveryName=wrap(teslimAd,10.1,CW-22,bold), deliveryAddress=wrap(teslimAdres,8.8,CW-22);
  const deliveryH=9+deliveryHead.length*9.5+5+deliveryName.length*12.5+3+deliveryAddress.length*11+9;
  const sx=M+322,sw=CW-322;
  const dateLabel=wrap(f('Yer ve tarih','Lieu et date','Place and date'),7.7,sw,bold);
  const dateLines=wrap(`${cami.sehir || 'Marche-en-Famenne'}, ${tarih}`,9.3,sw);
  const sigLabel=wrap(f('Başvuranın imzası','Signature du demandeur','Applicant’s signature'),7.5,sw,bold);
  const signer=wrap(d.adSoyad,8.8,sw,bold);
  const signatureLine=dateLabel.length*9+5+dateLines.length*11.5+12+sigLabel.length*9+39;
  const signH=signatureLine+5+signer.length*11;
  const attachments=[
    f('EK-9: imzaya sunulan nüsha','exemplaire à signer','copy for signature'),
    f('EK-10: açık rıza metni','consentement explicite','explicit consent'),
    f('Kimlik veya pasaport örneği','copie du document d’identité','copy of ID or passport'),
    f('1 adet vesikalık fotoğraf','1 photo d’identité','1 portrait photo'),
  ].map((s,i)=>wrap(`${i+1}. ${s}`,8,295));
  const attachH=18+attachments.reduce((h,a)=>h+a.length*10.5+4,0);
  const closingH=deliveryH+14+Math.max(signH,attachH);
  align(576);room(closingH);
  const by=y;page.drawRectangle({x:M,y:A4.h-by-deliveryH,width:CW,height:deliveryH,color:C.wash});rule(by,M,CW,C.gold,1);
  let dy=by+9;dy+=lines(deliveryHead,M+11,dy,7.7,9.5,bold,C.muted)+5;dy+=lines(deliveryName,M+11,dy,10.1,12.5,bold)+3;lines(deliveryAddress,M+11,dy,8.8,11,body,C.muted);
  y=by+deliveryH+14;const ey=y;
  text(f('EKLER','PIÈCES JOINTES','ENCLOSURES'),M,ey,8.1,bold,C.navy);let ay=ey+18;
  for(const a of attachments)ay+=lines(a,M,ay,8,10.5)+4;
  let sy=ey;sy+=lines(dateLabel,sx,sy,7.7,9,bold,C.muted)+5;sy+=lines(dateLines,sx,sy,9.3,11.5)+12;sy+=lines(sigLabel,sx,sy,7.5,9,bold,C.muted);
  const lineY=ey+signatureLine;rule(lineY,sx,sw);
  if(g.imza){
    let im;try{im=await doc.embedPng(g.imza);}catch{throw new Error('Başvuranın imzası okunamadı; dilekçe imzalı olarak üretilemedi.');}
    const scale=Math.min((sw-12)/im.width,28/im.height),w=im.width*scale,h=im.height*scale;
    page.drawImage(im,{x:sx+(sw-w)/2,y:A4.h-lineY+5,width:w,height:h});
  }
  lines(signer,sx,lineY+5,8.8,11,bold);
  const total=doc.getPageCount();
  doc.getPages().forEach((p,i)=>{page=p;rule(781);text('Türkçe ve diğer dildeki metinler aynı beyanı içerir; tek imza her ikisini kapsar.',M,788,7.1,body,C.muted);text(`${i+1} / ${total}`,A4.w-M-25,806,7.1,body,C.muted);});
  doc.setTitle(`İhtida Belgesi talebi — ${d.adSoyad || ''}`);doc.setSubject('EK-9 talep dilekçesi');doc.setCreator('Marche-en-Famenne Ulu Camii');
  if(g.tarih){doc.setCreationDate(g.tarih);doc.setModificationDate(g.tarih);}
  return doc.save({useObjectStreams:false,objectsPerTick:Infinity});
}
