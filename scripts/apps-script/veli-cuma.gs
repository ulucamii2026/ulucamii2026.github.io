/* Cuma günü veli bilgilendirmesi. Kullanıcı talebi: 9 Eylül 2026.
 * Aynı veliye aynı cuma bir ileti. Yalnız yayımlanmış plan/ödev; kişisel gelişim notu yok.
 * Liste aktarımının mevcut beş dakikalık zamanlayıcısı kullanılır.
 */
var VELI_CUMA_SURUM = "20260909-1";
var VELI_CUMA_SITE = "https://www.ulucamii.be";
var VELI_CUMA_DILLER = {
  tr: { konu: "Hayırlı cumalar | Hafta sonu derslerimiz", baslik: "Hayırlı cumalar", hitap: "Değerli velimiz,", selam: "Cumanız mübarek olsun. Ailenize huzurlu, sağlıklı ve bereketli günler diliyoruz.", giris: "Hafta sonuna birlikte hazırlanalım. Çocuğunuzla aşağıdaki kısa hatırlatmaları gözden geçirmeniz bize büyük destek olacaktır.", hafta: "Bu hafta sonu", gunler: ["Cumartesi", "Pazar"], alanlar: { kuran: "Kur'an-ı Kerim", itikat: "İtikat", ibadet: "İbadet", siyer: "Siyer", ahlak: "Ahlak", genel: "Genel" }, odev: "Ödev ve tekrar", odevYok: "Yeni bir ödev ayrıntısı yayımlanmadı. Son derste verilen çalışmaları ve öğrenilen dua/sureleri çocuğunuzla kısaca tekrar edebilirsiniz.", odevEksik: "Ödevin ayrıntısını veli portalından kontrol edebilirsiniz.", ezber: "Ezber", canta: "Çantamız hazır mı?", malzeme: ["Çocuğunuzun kullandığı Elifbâ veya Kur'an-ı Kerim", "Ders kitabı ve dağıtılan çalışma kâğıtları", "Defter, kurşun kalem ve silgi"], malzemeNot: "Eksik malzeme varsa önceden bize haber vermeniz yeterli.", isbirligi: "Kurs ve aile olarak birlikte hareket ettiğimizde çocuklarımız daha düzenli ilerliyor. Lütfen e-postalarımızı ve veli portalını takip ediniz. Desteğiniz için teşekkür ederiz.", portal: "Veli portalını aç", materyal: "Ders materyallerini incele", dersYok: "Yayımlanmış planda bu gün ders yok.", planYok: "Bu gün için yayımlanmış ders planı bulunmuyor. Güncel duyuruları veli portalından kontrol ediniz.", iptal: "Bu gün ders yapılmayacaktır.", tatil: "Bu hafta sonu için ders hazırlığı gerekmiyor. Ailece huzurlu bir hafta sonu dileriz.", odevTarihi: "Yayımlanmış çalışma", imza: "Rıdvan KAYAHAN\nDin Görevlisi · Marche-en-Famenne Ulu Camii", dip: "Bu bilgilendirme, çocuğunuzun kurs kaydı kapsamında gönderilmiştir. İletişim tercihinizi değiştirmek için bu e-postayı yanıtlayabilirsiniz.", portalYol: "/tr/veli-portali/", materyalYol: "/tr/ders-materyalleri/" },
  fr: { konu: "Bon vendredi | Les cours de ce week-end", baslik: "Un vendredi béni à votre famille", hitap: "Chers parents,", selam: "Nous vous souhaitons un vendredi béni, ainsi que des journées paisibles et sereines en famille.", giris: "Préparons ensemble le week-end. Merci de prendre quelques instants avec votre enfant pour parcourir ces rappels.", hafta: "Ce week-end", gunler: ["Samedi", "Dimanche"], alanlar: { kuran: "Coran", itikat: "Foi", ibadet: "Pratique religieuse", siyer: "Vie du Prophète", ahlak: "Éthique", genel: "Activités générales" }, odev: "Devoirs et révisions", odevYok: "Aucun nouveau devoir détaillé n'a été publié. Vous pouvez revoir brièvement avec votre enfant le travail donné au dernier cours ainsi que les invocations et sourates déjà apprises.", odevEksik: "Consultez le portail des parents pour les détails du travail à revoir.", ezber: "Mémorisation", canta: "Le cartable est-il prêt ?", malzeme: ["Le livret Elifbâ ou le Coran utilisé par votre enfant", "Le manuel du cours et les feuilles d'exercices distribuées", "Un cahier, un crayon et une gomme"], malzemeNot: "S'il manque du matériel, il vous suffit de nous prévenir à l'avance.", isbirligi: "La coopération entre l'école et les familles aide nos enfants à progresser régulièrement. Merci de consulter nos e-mails et le portail des parents. Nous vous remercions pour votre soutien.", portal: "Ouvrir le portail des parents", materyal: "Consulter les supports de cours", dersYok: "Aucun cours n'est prévu ce jour dans le programme publié.", planYok: "Le programme de cette journée n'a pas encore été publié. Consultez les annonces du portail des parents.", iptal: "Il n'y aura pas de cours ce jour.", tatil: "Aucune préparation de cours n'est nécessaire pour ce week-end. Nous vous souhaitons un agréable week-end en famille.", odevTarihi: "Travail publié", imza: "Rıdvan KAYAHAN\nImam · Mosquée Ulu Camii de Marche-en-Famenne", dip: "Cette information vous est adressée dans le cadre de l'inscription de votre enfant. Pour modifier votre préférence de communication, vous pouvez répondre à cet e-mail.", portalYol: "/fr/portail-parents/", materyalYol: "/fr/supports-de-cours/" }
};
function veliCumaGunEkle(iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function veliCumaZamanUygun(iso, saat, ayar) { return new Date(iso + "T12:00:00Z").getUTCDay() === 5 && saat >= (ayar.saat == null ? 10 : ayar.saat) && saat < 21; }
function veliCumaKacis(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function veliCumaMetin(v) { return String(v || "").replace(/<br\s*\/?\s*>/gi,"\n").replace(/<\/p>/gi,"\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").trim(); }
function veliCumaKisalt(t, sinir) { if(t.length<=sinir)return t;var parca=t.slice(0,sinir),kes=parca.lastIndexOf('\n');if(kes<0){var m,son=-1,re=/[.!?]\s+[A-ZÇĞİÖŞÜÀÂÉÈÊÎÔÙÛ]/g;while((m=re.exec(parca))!==null)son=m.index+1;kes=son;}if(kes<0)kes=parca.lastIndexOf(' ');return parca.slice(0,kes>0?kes:sinir).trim()+'…'; }
function veliCumaModel(cuma, plan, odevler, ayar) {
  if (!plan || !plan.donem || !Array.isArray(plan.gunler) || !plan.gunler.length) throw new Error("cuma-plan-eksik");
  var haftaSonu = [veliCumaGunEkle(cuma,1),veliCumaGunEkle(cuma,2)];
  var gunler = haftaSonu.map(function (tarih) {
    var g = plan.gunler.filter(function(x){return x.tarih===tarih;})[0], degisim = (ayar.gunler || {})[tarih];
    if (degisim && degisim.iptal === true) return {tarih:tarih,durum:"iptal",aciklama:degisim.aciklama || {},dersler:[]};
    if (!g) return {tarih:tarih,durum:"planYok",dersler:[]};
    if (!g.dersler.length) return {tarih:tarih,durum:"dersYok",dersler:[]};
    return {tarih:tarih,durum:"ders",dersler:g.dersler.map(function(d){return {kod:d.kod,konu:d.konu,kaynak:d.kaynak||""};})};
  });
  var enEski = veliCumaGunEkle(cuma,-6);
  var odev = (odevler || []).filter(function(o){return o.yayin===true && o.tarih>=enEski && o.tarih<=haftaSonu[1];}).sort(function(a,b){return String(b.tarih).localeCompare(a.tarih);})[0] || null;
  return {cuma:cuma,gunler:gunler,odev:odev,dersVar:gunler.some(function(g){return g.durum==='ders';}),dersYok:gunler.every(function(g){return ['dersYok','iptal'].indexOf(g.durum)>=0;})};
}
function veliCumaIcerik(model, dil, cevir) {
  var m = VELI_CUMA_DILLER[dil]; if (!m) throw new Error("cuma-dil-eksik");
  // Posta uygulamasında body/head stilleri korunmasa da metin okunaklı kalır.
  var blocks=[],plain=[], esc=veliCumaKacis,yazi='font-family:Arial,sans-serif;font-size:20px;line-height:1.5;color:#293f42;word-wrap:break-word;';
  function p(t){blocks.push('<p style="'+yazi+'margin:0 0 20px">'+esc(t).replace(/\n/g,'<br>')+'</p>');plain.push(t);}
  function h(t){blocks.push('<h2 style="font-family:Arial,sans-serif;margin:30px 0 14px;font-size:24px;line-height:1.3;color:#163f43">'+esc(t)+'</h2>');plain.push('\n'+t);}
  function list(items){blocks.push('<ul style="'+yazi+'padding-left:23px;margin:8px 0 22px">'+items.map(function(t){plain.push('- '+t);return '<li style="'+yazi+'margin:0 0 8px">'+esc(t)+'</li>';}).join('')+'</ul>');}
  function yerel(obj){return veliCumaMetin((obj || {})[dil]);}
  function tarih(t){return t.slice(8,10)+'.'+t.slice(5,7)+'.'+t.slice(0,4);}
  p(m.hitap);p(m.selam);p(m.giris);h(m.hafta);
  model.gunler.forEach(function(g,i){
    blocks.push('<h3 style="font-family:Arial,sans-serif;margin:22px 0 12px;font-size:21px;line-height:1.4;color:#24676b">'+esc(m.gunler[i]+' '+tarih(g.tarih))+'</h3>');plain.push(m.gunler[i]+' '+tarih(g.tarih));
    if(g.durum==='ders'){
      blocks.push('<ul style="'+yazi+'padding-left:23px;margin:8px 0 22px">'+g.dersler.map(function(d){
        var konu=(m.alanlar[d.kod]||m.alanlar.genel)+': '+(dil==='tr'?d.konu:cevir(d.konu));
        var kaynak=veliCumaKaynakMetni(d.kaynak,dil);plain.push('- '+konu+(kaynak?'\n  '+kaynak:''));
        return '<li style="'+yazi+'margin:0 0 16px">'+esc(konu)+(kaynak?'<br><span style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#536763">'+esc(kaynak)+'</span>':'')+'</li>';
      }).join('')+'</ul>');
    }
    else p(yerel(g.aciklama) || m[g.durum]);
  });
  if(model.dersVar){
    h(m.odev);var od=model.odev,detay=od&&yerel(od.odev),ezber=od&&yerel(od.ezber);
    if(detay || ezber){p(m.odevTarihi+' · '+tarih(od.tarih));if(detay)p(veliCumaKisalt(detay,320));if(ezber)p(m.ezber+': '+veliCumaKisalt(ezber,180));if(detay.length>320||ezber.length>180)p(m.odevEksik);}
    else p(od?m.odevEksik:m.odevYok);
    h(m.canta);list(m.malzeme);if(od&&yerel(od.getirilecekler))p(yerel(od.getirilecekler));p(m.malzemeNot);
  }else if(model.dersYok)p(m.tatil);
  p(m.isbirligi);
  var portal=VELI_CUMA_SITE+m.portalYol,materyal=VELI_CUMA_SITE+m.materyalYol;
  blocks.push('<p style="'+yazi+'margin:28px 0 12px"><a href="'+portal+'" style="font-family:Arial,sans-serif;font-size:20px;line-height:1.4;background:#163f43;color:#fff;padding:17px 14px;display:block;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;word-wrap:break-word">'+esc(m.portal)+'</a></p><p style="'+yazi+'margin:0 0 24px"><a href="'+materyal+'" style="font-family:Arial,sans-serif;font-size:18px;line-height:1.5;display:block;padding:12px 0;color:#23666b;word-wrap:break-word">'+esc(m.materyal)+'</a></p>');
  plain.push(m.portal+': '+portal,m.materyal+': '+materyal);p(m.imza);
  var html=veliEpostaBelge(dil,m.baslik,blocks.join(''),m.dip);
  return {subject:m.konu+' · '+tarih(model.gunler[0].tarih)+' - '+tarih(model.gunler[1].tarih),htmlBody:html,body:plain.concat(m.dip).join('\n\n')};
}
function veliCumaKoleksiyon(ad,alanlar){
  var list=[],token='';
  do {var yol='/'+ad+'?pageSize=100'+alanlar.map(function(a){return '&mask.fieldPaths='+encodeURIComponent(a);}).join('')+(token?'&pageToken='+encodeURIComponent(token):'');var r=veliPortalHttp(yol);
    (r.documents||[]).forEach(function(x){var d={id:x.name.split('/').pop()};Object.keys(x.fields||{}).forEach(function(k){d[k]=veliPortalDegerCoz(x.fields[k]);});list.push(d);});token=r.nextPageToken||'';
  }while(token);return list;
}
function veliCumaAyar(){
  var r=veliPortalHttp('/ayarlar/veliCuma',null,true),o={aktif:false,saat:10,gunler:{}};
  if(r)Object.keys(r.fields||{}).forEach(function(k){o[k]=veliPortalDegerCoz(r.fields[k]);});return o;
}
function veliCumaPlanOku(){
  var r=UrlFetchApp.fetch(VELI_CUMA_SITE+'/tr/veli-portali/',{muteHttpExceptions:true});if(r.getResponseCode()!==200)throw new Error('cuma-plan-http');
  var m=r.getContentText().match(/<script[^>]*id="veli-veri"[^>]*>([\s\S]*?)<\/script>/);if(!m)throw new Error('cuma-plan-yok');var plan=JSON.parse(m[1]);
  if(!/^\d{4}-\d{4}$/.test(plan.donem))throw new Error('cuma-donem-gecersiz');
  var k=UrlFetchApp.fetch('https://raw.githubusercontent.com/ulucamii2026/ulucamii2026.github.io/main/src/data/yillik-plan-'+plan.donem+'.json',{muteHttpExceptions:true});
  if(k.getResponseCode()!==200)throw new Error('cuma-kitap-kaynak-http');
  return veliCumaKaynakEkle(plan,JSON.parse(k.getContentText()));
}
function veliCumaCevir(metin){
  // Yalnız herkese açık ders başlığı çevrilir. Veli/öğrenci/ödev verisi çeviri servisine gitmez.
  // Cami sitesindeki onaylı Fransızca duyuru ve harf adları otomatik çeviriden önce gelir.
  var onayli={"Kutsal kitabımız Kur'an'dır":"Notre Livre saint est le Coran","Abdest alıyorum, temizleniyorum":"Je fais mes ablutions, je me purifie","Hz. Muhammed (s.a.s.) büyüyor":"Le prophète Muhammad (s.a.s.) grandit","Sevincimi paylaşıyorum":"Je partage ma joie"};
  var bolum=String(metin).match(/\s+(\(\d+\/\d+\))$/),temel=bolum?String(metin).slice(0,bolum.index):String(metin);
  if(onayli[temel])return onayli[temel]+(bolum?' '+bolum[1]:'');
  var harf=String(metin).match(/^(.+) Grubu Harfleri$/);if(harf){var adlar={'Elif':'Elif','Hı':'Khâ','Şîn':'Shîn','Ayn':'Ayn'};return 'Lettres du groupe '+(adlar[harf[1]]||harf[1]);}
  var key='VELI_CUMA_FR_'+veliPortalHash(metin),p=PropertiesService.getScriptProperties(),onceki=p.getProperty(key);if(onceki)return onceki;
  var sonuc=LanguageApp.translate(String(metin),'tr','fr');if(!sonuc||sonuc===metin)throw new Error('cuma-ceviri-eksik');sonuc=sonuc.replace(/\bMahomet\b/g,'Muhammad');p.setProperty(key,sonuc);return sonuc;
}
function veliCumaAlicilar(aileler,ogrenciler){
  var aktif=new Set(ogrenciler.filter(function(o){return !o.durum||o.durum==='aktif';}).map(function(o){return o.id;}));
  return aileler.filter(function(a){return epostaGecerli(a.id) && Array.isArray(a.ogrenciler) && a.ogrenciler.some(function(ref){return aktif.has(ref);}) && a.haftalikEposta!==false;}).map(function(a){return {eposta:a.id.toLowerCase(),dil:a.iletisimDili||a.dil};});
}
function veliCumaHazirla(cuma,ayar){
  var plan=veliCumaPlanOku(),odevler=veliCumaKoleksiyon('odevler',['tarih','yayin','odev','ezber','getirilecekler']);
  var model=veliCumaModel(cuma,plan,odevler,ayar),icerik={};
  var alicilar=veliCumaAlicilar(veliCumaKoleksiyon('aileler',['ogrenciler','iletisimDili','dil','haftalikEposta']),veliCumaKoleksiyon('ogrenciler',['durum']));
  // İki dilin içeriği de gönderimden önce hazırlanır; çeviri arızasında yarım kampanya başlamaz.
  ['tr','fr'].forEach(function(dil){icerik[dil]=veliCumaIcerik(model,dil,veliCumaCevir);});
  return {model:model,icerik:icerik,alicilar:alicilar};
}
function veliCumaGonder(alici,icerik,anahtar,tag){
  var key=brevoAnahtari();if(!key)throw new Error('cuma-eposta-yetkisi-yok');
  var payload={sender:BREVO_GONDEREN,to:[{email:alici.eposta}],replyTo:{email:'imam@ulucamii.be'},subject:icerik.subject,htmlContent:icerik.htmlBody,textContent:icerik.body,headers:{idempotencyKey:anahtar},tags:[tag]};
  try{var r=UrlFetchApp.fetch(BREVO_UC,{method:'post',contentType:'application/json',headers:{'api-key':key,accept:'application/json'},payload:JSON.stringify(payload),muteHttpExceptions:true});var kod=r.getResponseCode();
    if(kod>=200&&kod<300){var j=JSON.parse(r.getContentText());return {durum:j.messageId?'saglayici-kabul':'belirsiz',messageId:j.messageId||''};}
    return {durum:kod===429?'yeniden-denenecek':kod>=500||r.getContentText().indexOf('duplicate_parameter')>=0?'belirsiz':'gonderim-hatasi',kod:kod};
  }catch(e){return {durum:'belirsiz'};}
}
function veliCumaIsle(cuma,ayar){
  veliPortalKimlikDogrula();var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {ok:false,mesgul:true};
  var p=PropertiesService.getScriptProperties();
  try{
    var paket=veliCumaHazirla(cuma,ayar),tag='veli-cuma-'+cuma,sayim={ok:true,cuma:cuma,zaman:new Date().toISOString(),alicilar:paket.alicilar.length,gonderildi:0,onceki:0,bekleyen:0,hata:0};
    paket.alicilar.forEach(function(a){
      if(!VELI_CUMA_DILLER[a.dil]){sayim.bekleyen++;return;}
      var pk='VELI_CUMA_GONDERIM_'+cuma+'_'+veliPortalHash(a.eposta),durum=JSON.parse(p.getProperty(pk)||'null');
      if(durum && ['saglayici-kabul','teslim-edildi','teslim-edilemedi','gonderim-hatasi'].indexOf(durum.durum)>=0){sayim.onceki++;return;}
      if(durum&&['gonderiliyor','belirsiz'].indexOf(durum.durum)>=0){
        var found=veliCumaBelirsizYokla(a.eposta,tag);if(found){durum.durum='saglayici-kabul';durum.messageId=found;p.setProperty(pk,JSON.stringify(durum));sayim.onceki++;}else sayim.bekleyen++;return;
      }
      if(!brevoAnahtari()){sayim.hata++;return;}
      var uuid=durum&&durum.anahtar||Utilities.getUuid();p.setProperty(pk,JSON.stringify({durum:'gonderiliyor',anahtar:uuid,zaman:new Date().toISOString(),dil:a.dil}));
      var sonuc=veliCumaGonder(a,paket.icerik[a.dil],uuid,tag);sonuc.anahtar=uuid;sonuc.zaman=new Date().toISOString();sonuc.dil=a.dil;p.setProperty(pk,JSON.stringify(sonuc));
      if(sonuc.durum==='saglayici-kabul')sayim.gonderildi++;else if(sonuc.durum==='gonderim-hatasi')sayim.hata++;else sayim.bekleyen++;
    });
    p.setProperty('VELI_CUMA_SONUC',JSON.stringify(sayim));return sayim;
  }finally{lock.releaseLock();}
}
function veliCumaBelirsizYokla(eposta,tag){
  try{var r=UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/statistics/events?limit=100&tags='+encodeURIComponent(JSON.stringify([tag]))+'&email='+encodeURIComponent(eposta),{headers:{'api-key':brevoAnahtari(),accept:'application/json'},muteHttpExceptions:true});if(r.getResponseCode()!==200)return '';
    var ids=Array.from(new Set((JSON.parse(r.getContentText()).events||[]).filter(function(e){return e.tag===tag&&String(e.email).toLowerCase()===eposta&&e.messageId;}).map(function(e){return e.messageId;})));return ids.length===1?ids[0]:'';
  }catch(e){return '';}
}
function veliCumaKontrol(){
  try{var ayar=veliCumaAyar(),simdi=new Date(),cuma=Utilities.formatDate(simdi,'Europe/Brussels','yyyy-MM-dd'),saat=Number(Utilities.formatDate(simdi,'Europe/Brussels','H'));
    if(!ayar.aktif||!veliCumaZamanUygun(cuma,saat,ayar))return {ok:true,atlandi:true};
    return veliCumaIsle(cuma,ayar);
  }catch(e){var kod=/^(cuma|portal)-[a-z0-9-]+$/.test(String(e.message))?e.message:'cuma-islem-hatasi';PropertiesService.getScriptProperties().setProperty('VELI_CUMA_SONUC',JSON.stringify({ok:false,zaman:new Date().toISOString(),hata:kod}));console.error(kod);return {ok:false,hata:kod};}
}
function veliCumaSina(){
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);veliPortalKimlikDogrula();var ayar=veliCumaAyar(),bugun=Utilities.formatDate(new Date(),'Europe/Brussels','yyyy-MM-dd'),gun=new Date(bugun+'T12:00:00Z').getUTCDay(),cuma=veliCumaGunEkle(bugun,(5-gun+7)%7),paket=veliCumaHazirla(cuma,ayar);
  var s={ok:true,cuma:cuma,alicilar:paket.alicilar.length,tr:paket.alicilar.filter(function(a){return a.dil==='tr';}).length,fr:paket.alicilar.filter(function(a){return a.dil==='fr';}).length,diger:paket.alicilar.filter(function(a){return !VELI_CUMA_DILLER[a.dil];}).length,dersGunleri:paket.model.gunler.map(function(g){return {tarih:g.tarih,durum:g.durum,dersSayisi:g.dersler.length};}),gonderim:false};console.log(JSON.stringify(s));return s;
}
function veliCumaKur(){
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);veliPortalKimlikDogrula();var s=veliCumaSina();if(s.diger)throw new Error('cuma-dil-eksik');
  if(!brevoAnahtari())throw new Error('cuma-eposta-yetkisi-yok');
  var r=UrlFetchApp.fetch('https://api.brevo.com/v3/account',{headers:{'api-key':brevoAnahtari(),accept:'application/json'},muteHttpExceptions:true});if(r.getResponseCode()!==200)throw new Error('cuma-saglayici-erisim');
  var eski=veliPortalHttp('/ayarlar/veliCuma',null,true),saat=eski&&eski.fields&&eski.fields.saat?veliPortalDegerCoz(eski.fields.saat):10;
  if(!Number.isInteger(saat)||saat<0||saat>=21)throw new Error('cuma-saat-gecersiz');
  veliPortalHttp(':commit',{writes:[{update:{name:VELI_PORTAL_DOKUMAN+'/ayarlar/veliCuma',fields:{aktif:{booleanValue:true},saat:{integerValue:String(saat)},surum:{stringValue:VELI_CUMA_SURUM}}},updateMask:{fieldPaths:['aktif','saat','surum']},currentDocument:eski?{updateTime:eski.updateTime}:{exists:false}}]});
  if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='veliMailListesiZamanli';}))throw new Error('cuma-zamanlayici-yok');
  PropertiesService.getScriptProperties().setProperty('VELI_CUMA_KURULU',VELI_CUMA_SURUM);console.log(JSON.stringify({ok:true,kurulu:true,saat:saat,zamanDilimi:'Europe/Brussels',gonderim:false}));
}
function veliCumaPanelIsle(e){
  if(!panelYetkiTamam(e))return json({ok:false,hata:'yetki'});var ayar=veliCumaAyar();
  if(e.parameter.islem==='veli-cuma-onizleme'){
    var bugun=Utilities.formatDate(new Date(),'Europe/Brussels','yyyy-MM-dd'),gun=new Date(bugun+'T12:00:00Z').getUTCDay(),cuma=veliCumaGunEkle(bugun,(5-gun+7)%7),dil=e.parameter.dil||'tr';
    if(!VELI_CUMA_DILLER[dil])return json({ok:false,hata:'dil'});var paket=veliCumaHazirla(cuma,ayar);return json({ok:true,cuma:cuma,dil:dil,icerik:paket.icerik[dil],gonderim:false});
  }
  return json({ok:true,kurulu:PropertiesService.getScriptProperties().getProperty('VELI_CUMA_KURULU')===VELI_CUMA_SURUM,aktif:ayar.aktif,saat:ayar.saat,zamanDilimi:'Europe/Brussels',sonuc:JSON.parse(PropertiesService.getScriptProperties().getProperty('VELI_CUMA_SONUC')||'null')});
}

function veliCumaKaynakEkle(plan,kaynak){
  if(plan.donem!==kaynak.donem||!Array.isArray(kaynak.gunler))throw new Error('cuma-kitap-donem');
  plan.gunler.forEach(function(g){var kg=kaynak.gunler.filter(function(x){return x.tarih===g.tarih;})[0];
    (g.dersler||[]).forEach(function(d){var es=(kg&&kg.dersler||[]).filter(function(x){return x.kod===d.kod&&x.konu===d.konu;});if(es.length===1)d.kaynak=String(es[0].kaynak||'');});});return plan;
}
function veliCumaKaynakMetni(kaynak,dil){
  var s=String(kaynak||'').trim();if(!s)return '';
  return dil==='fr'?s.replace(/Elifbâ \/ Kur'an-ı Kerim/g,'Elifbâ / Coran').replace(/\bs\.\s*/g,'p. '):s;
}
