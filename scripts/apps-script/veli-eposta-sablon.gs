/* Kurumsal e-posta şablonu v2. Sabitlerin tek kaynağı: üretilen KIMLIK. */
function veliEpostaKacis(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c];
  });
}
function veliEpostaBaglami(dil, secenekler) {
  if (['tr', 'fr', 'en'].indexOf(dil) < 0) throw new Error('veli-eposta-dil');
  // v1'in dördüncü konumdaki düz alt notu da kabul edilir.
  var s = typeof secenekler === 'string' ? {altNot: secenekler} : (secenekler || {});
  var kurum = s.kurum === undefined ? 'kurs' : s.kurum;
  if (['kurs', 'cami'].indexOf(kurum) < 0) throw new Error('veli-eposta-kurum');
  return {dil: dil, secenekler: s, kurum: kurum, k: KIMLIK.kurumlar[kurum],
    renk: KIMLIK.gorunum.ortakRenk, olcu: KIMLIK.gorunum.eposta,
    font: veliEpostaKacis(KIMLIK.gorunum.yaziTipi.epostaYigin)};
}
function veliEpostaYazi(b, punto, satir, renk) {
  return 'font-family:' + b.font + ';font-size:' + (punto || b.olcu.govdePuntoPx) + 'px;line-height:' +
    (satir || b.olcu.satirAraligi) + ';color:' + (renk || b.renk.metin) + ';word-wrap:break-word;overflow-wrap:anywhere;';
}
function veliEpostaUrl(v, gorsel) {
  var url = String(v == null ? '' : v);
  if (!/^https:\/\/[^\s/?#<>"']+(?:[/?#][^\s]*)?$/i.test(url) && !(gorsel && /^cid:[^\s<>"']+$/i.test(url))) {
    throw new Error(gorsel ? 'veli-eposta-gorsel-url' : 'veli-eposta-dugme-url');
  }
  return veliEpostaKacis(url);
}
function veliEpostaBaglantiliMetin(metin, b) {
  var e = veliEpostaKacis, sonuc = '', son = 0;
  var re = /https:\/\/[^\s<>"*]+/gi, es;
  // URL'nin ardına gelen noktalama («(https://…).» gibi) bağlantının DIŞINDA kalır — 13 Eyl 2026'da «).» yutulunca wa.me bağlantısı bozuk gitti.
  // Ham metni ayırıp sonra kaçışla: &amp; gibi HTML varlıklarının sonunu URL sanma.
  while ((es = re.exec(metin)) !== null) {
    sonuc += e(metin.slice(son, es.index));
    var url = es[0].replace(/[.,;:!?)\]»”’…]+$/, '');
    var noktalama = es[0].slice(url.length);
    if (/^https:\/\/[^/?#]+/i.test(url)) {
      sonuc += '<a href="' + e(url) + '" style="color:' + b.k.renk.ana + ';text-decoration:underline;word-break:break-all;display:inline-block;padding:2px 0">' + e(url) + '</a>' + e(noktalama);
    } else sonuc += e(es[0]);
    son = re.lastIndex;
  }
  return (sonuc + e(metin.slice(son))).replace(/\r?\n/g, '<br>');
}
function veliEpostaMetinHtml(metin, b) {
  var t = String(metin == null ? '' : metin), html = '', son = 0, es, re = /\*\*([^*]+)\*\*/g;
  while ((es = re.exec(t)) !== null) {
    html += veliEpostaBaglantiliMetin(t.slice(son, es.index), b) + '<b>' + veliEpostaBaglantiliMetin(es[1], b) + '</b>';
    son = re.lastIndex;
  }
  return html + veliEpostaBaglantiliMetin(t.slice(son), b);
}
function veliEpostaBlokHtml(blok, b) {
  if (!blok || typeof blok !== 'object') throw new Error('veli-eposta-blok');
  var e = veliEpostaKacis, yazi = veliEpostaYazi(b), metin = function(t) { return veliEpostaMetinHtml(t, b); };
  switch (blok.tur) {
    case 'paragraf':
      return '<p style="' + yazi + 'margin:0 0 20px">' + metin(blok.metin) + '</p>';
    case 'baslik':
      return '<h2 style="' + veliEpostaYazi(b, 21, 1.3) + 'font-weight:bold;margin:28px 0 12px">' + metin(blok.metin) + '</h2>';
    case 'dugme':
      var url = veliEpostaUrl(blok.url, false);
      return '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;margin:8px 0 8px"><tr>' +
        '<td align="center" bgcolor="' + b.k.renk.ana + '" style="border-radius:6px;background:' + b.k.renk.ana + '">' +
        '<a href="' + url + '" style="' + veliEpostaYazi(b, 16, 1.4, b.renk.kagit) + 'display:inline-block;padding:14px 28px;border-radius:6px;font-weight:bold;text-decoration:none;mso-padding-alt:0">' + e(blok.metin) + '</a></td></tr></table>' +
        '<p style="' + veliEpostaYazi(b, 12, 1.5, b.renk.ikincil) + 'word-break:break-all;margin:0 0 24px">' + url + '</p>';
    case 'gorsel':
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;margin:0 0 24px"><tr><td>' +
        '<img src="' + veliEpostaUrl(blok.src, true) + '" alt="' + e(blok.alt) + '" width="' + (b.olcu.genislikPx - 56) + '" style="display:block;box-sizing:border-box;width:100%;max-width:100%;height:auto;border:1px solid ' + b.renk.cizgi + ';border-radius:6px"></td></tr></table>';
    case 'liste':
      if (!Array.isArray(blok.ogeler)) throw new Error('veli-eposta-liste');
      return '<ol style="' + yazi + 'list-style:none;padding:0;margin:0 0 24px">' + blok.ogeler.map(function(o, i) {
        if (!o || typeof o !== 'object') throw new Error('veli-eposta-liste-oge');
        return '<li style="' + yazi + 'margin:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed"><tr>' +
          '<td valign="top" width="40" style="width:40px;padding:0 12px 0 0"><span style="' + veliEpostaYazi(b, 14, 2, b.renk.kagit) + 'display:block;width:28px;height:28px;border-radius:50%;text-align:center;background:' + b.k.renk.ana + ';font-weight:bold">' + (i + 1) + '</span></td>' +
          '<td valign="top" style="' + yazi + '"><b>' + metin(o.baslik) + '</b>' + (o.not ? '<br><span style="' + veliEpostaYazi(b, 16, 1.5, b.renk.ikincil) + '">' + metin(o.not) + '</span>' : '') + '</td></tr></table></li>';
      }).join('') + '</ol>';
    case 'madde':
      if (!Array.isArray(blok.ogeler)) throw new Error('veli-eposta-madde');
      return '<ul style="' + yazi + 'padding:0 0 0 23px;margin:8px 0 24px">' + blok.ogeler.map(function(o) {
        return '<li style="' + yazi + 'margin:0 0 8px">' + metin(o) + '</li>';
      }).join('') + '</ul>';
    case 'cizgi':
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0"><tr><td height="1" bgcolor="' + b.renk.cizgi + '" style="height:1px;font-size:0;line-height:0;background:' + b.renk.cizgi + '"></td></tr></table>';
    case 'not':
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;margin:0 0 24px"><tr><td bgcolor="' + b.renk.acikYuzey + '" style="' + veliEpostaYazi(b, 14, 1.6) + 'padding:16px;border-radius:6px;background:' + b.renk.acikYuzey + '">' + metin(blok.metin) + '</td></tr></table>';
    case 'olcek':
      // Seviye tespit testinin alan düzeyleri. Görselsiz: çubuk boyalı hücrelerden kurulur, renk tek başına bilgi taşımaz —
      // düzey metni her zaman yazıyla da görünür (renk körlüğü + görsel engelleyen istemciler); `sayi:true` ise «deger/azami» de eklenir
      // (hoca raporu). Katılımcı e-postasında sayı yazılmaz: sonuç bir not değildir.
      if (!Array.isArray(blok.ogeler) || !blok.ogeler.length) throw new Error('veli-eposta-olcek');
      var olcekTam = function(v, enAz, enCok) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= enAz && v <= enCok; };
      var olcekMetin = function(v) { return typeof v === 'string' && v.trim() !== ''; };
      return blok.ogeler.map(function(o, i) {
        if (!o || typeof o !== 'object' || !olcekMetin(o.etiket) || !olcekMetin(o.metin) ||
          !olcekTam(o.azami, 1, 6) || !olcekTam(o.deger, 0, o.azami)) throw new Error('veli-eposta-olcek');
        var hucreler = '';
        for (var h = 0; h < o.azami; h++) {
          // Renk sabiti şablona gömülmez (kimlik tek kaynak): dolu hücre kurum rengi, boş hücre açık çizgi rengi.
          var dolgu = h < o.deger ? b.k.renk.ana : b.renk.cizgi;
          hucreler += (h ? '<td width="3" style="width:3px;font-size:0;line-height:0"></td>' : '') +
            '<td height="10" bgcolor="' + dolgu + '" style="height:10px;font-size:0;line-height:0;background:' + dolgu + ';border-radius:2px"></td>';
        }
        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;margin:0 0 ' + (i === blok.ogeler.length - 1 ? 24 : 16) + 'px">' +
          '<tr><td style="' + yazi + 'padding:0 0 6px"><b>' + e(o.etiket) + '</b></td></tr>' +
          '<tr><td style="padding:0 0 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed"><tr>' + hucreler + '</tr></table></td></tr>' +
          '<tr><td style="' + veliEpostaYazi(b, 14, 1.6, b.renk.ikincil) + 'padding:0">' + e(o.metin) + (o.sayi === true ? ' (' + o.deger + '/' + o.azami + ')' : '') + '</td></tr></table>';
      }).join('');
    default: throw new Error('veli-eposta-blok');
  }
}
function veliEpostaEkBloklar(s) {
  var bloklar = [];
  if (s.dugme) bloklar.push({tur:'dugme', metin:s.dugme.metin, url:s.dugme.url});
  if (s.gorseller !== undefined) {
    if (!Array.isArray(s.gorseller)) throw new Error('veli-eposta-gorseller');
    s.gorseller.forEach(function(g) {
      if (!g || typeof g !== 'object') throw new Error('veli-eposta-gorsel');
      bloklar.push({tur:'gorsel', src:g.src, alt:g.alt});
    });
  }
  if (s.liste !== undefined) bloklar.push({tur:'liste', ogeler:s.liste});
  return bloklar;
}
function veliEpostaBelge(dil, baslik, icerikHtml, secenekler) {
  var b = veliEpostaBaglami(dil, secenekler), s = b.secenekler, e = veliEpostaKacis;
  var imza = KIMLIK.yazisma.imza[b.kurum][dil].map(function(t, i) { return i === 0 ? '<b>' + e(t) + '</b>' : e(t); }).join('<br>');
  var dip = KIMLIK.yazisma.epostaAltNotu[dil].replace(/\{kurum\}/g, b.k.ad[dil]);
  var genislik = b.olcu.genislikPx, logo = b.olcu.logoPx, radius = b.olcu.koseYaricapiPx;
  var govde = '<h1 style="' + veliEpostaYazi(b, 24, 1.3) + 'font-weight:bold;margin:0 0 24px">' + e(baslik) + '</h1>' + String(icerikHtml == null ? '' : icerikHtml);
  if (s.altNot) govde += veliEpostaBlokHtml({tur:'not', metin:s.altNot}, b);
  return '<!doctype html><html lang="' + dil + '"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' + e(baslik) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + b.renk.zemin + ';' + veliEpostaYazi(b) + '-webkit-text-size-adjust:100%;text-size-adjust:100%">' +
    (s.onIzleme ? '<div aria-hidden="true" style="display:none;max-height:0;overflow:hidden;mso-hide:all">' + e(s.onIzleme) + '</div>' : '') +
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="' + b.renk.zemin + '" style="width:100%;table-layout:fixed;background:' + b.renk.zemin + '"><tr><td align="center" style="padding:16px 4px">' +
    '<!--[if mso]><table role="presentation" width="' + genislik + '" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->' +
    '<table role="presentation" data-eposta-sablon="v2" data-kurum="' + b.kurum + '" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="' + b.renk.kagit + '" style="max-width:' + genislik + 'px;width:100%;table-layout:fixed;background:' + b.renk.kagit + ';border-radius:' + radius + 'px;overflow:hidden">' +
    '<tr><td bgcolor="' + b.renk.kagit + '" style="padding:24px 28px;background:' + b.renk.kagit + ';border-bottom:4px solid ' + b.k.renk.ana + '">' +
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed"><tr>' +
    '<td valign="middle" width="' + (logo + 24) + '" style="width:' + (logo + 24) + 'px;padding:0"><img src="' + e(b.k.logo.web) + '" width="' + logo + '" height="' + logo + '" alt="' + e(b.k.ad[dil]) + '" style="display:block;width:' + logo + 'px;height:' + logo + 'px;border:0;object-fit:contain"></td>' +
    '<td valign="middle" style="padding:0"><p style="' + veliEpostaYazi(b, 11, 1.5, b.renk.ikincil) + 'letter-spacing:0.12em;margin:0 0 6px">' + e(b.k.logoYazisi.ust) + '</p>' +
    '<p style="' + veliEpostaYazi(b, 20, 1.3, b.k.renk.ana) + 'font-weight:bold;margin:0">' + e(b.k.ad[dil]) + '</p></td></tr></table></td></tr>' +
    '<tr><td bgcolor="' + b.renk.kagit + '" style="' + veliEpostaYazi(b) + 'padding:28px 28px 8px;background:' + b.renk.kagit + '">' + govde + '</td></tr>' +
    '<tr><td bgcolor="' + b.renk.acikYuzey + '" style="padding:24px 28px;background:' + b.renk.acikYuzey + '">' +
    '<p style="' + veliEpostaYazi(b, 14, 1.6) + 'margin:0 0 16px">' + imza + '</p>' +
    '<p style="' + veliEpostaYazi(b, 14, 1.6) + 'margin:0 0 12px"><a href="' + e(KIMLIK.iletisim.gizlilik[dil]) + '" style="color:' + b.k.renk.ana + ';text-decoration:underline;display:inline-block;padding:4px 0">' + e(KIMLIK.yazisma.gizlilikBaglantiMetni[dil]) + '</a></p>' +
    '<p style="' + veliEpostaYazi(b, 12, 1.6, b.renk.ikincil) + 'margin:0 0 12px">' + e(dip) + '</p>' +
    '<p style="' + veliEpostaYazi(b, 12, 1.6, b.renk.ikincil) + 'margin:0">' + e(KIMLIK.hukuki.altbilgi[dil]) + '</p></td></tr></table>' +
    '<!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>';
}
function veliEpostaZengin(bloklar, dil, baslik, secenekler) {
  var b = veliEpostaBaglami(dil, secenekler);
  if (!Array.isArray(bloklar)) throw new Error('veli-eposta-bloklar');
  var html = bloklar.concat(veliEpostaEkBloklar(b.secenekler)).map(function(blok) { return veliEpostaBlokHtml(blok, b); }).join('');
  return veliEpostaBelge(dil, baslik, html, b.secenekler);
}
function veliEpostaDuzMetin(metin, dil, baslik, secenekler) {
  var bloklar = String(metin == null ? '' : metin).split(/\n\s*\n/).map(function(p) { return {tur:'paragraf', metin:p}; });
  return veliEpostaZengin(bloklar, dil, baslik, secenekler);
}
