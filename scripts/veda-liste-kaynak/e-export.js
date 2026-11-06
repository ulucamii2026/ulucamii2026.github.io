/* Dışa aktarma: kapı listesi, mesajlar, özet raporu (yazdır / PDF) ve CSV. Hiçbirinde telefon numarası yoktur. */
const kopyala = (ml) => {
  const metin = ml.map((x) => x.k.ad + (x.k.kurum ? ' (' + x.k.kurum + ')' : '') + '\n' + x.k.mesaj).join('\n\n');
  const bitti = () => { duyur('Mesajlar panoya kopyalandı.'); toast('Mesajlar panoya kopyalandı.'); };
  const yedek = () => { const t = document.createElement('textarea'); t.value = metin; t.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); bitti(); } catch (_) { duyur('Kopyalanamadı.'); } document.body.removeChild(t); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(bitti, yedek); else yedek();
};

// ---------- CSV ----------
const csvHucre = (v) => {
  let s = String(v == null ? '' : v);
  if (/^[\s]*[=+\-@]/.test(s) || /^[\t\r]/.test(s)) s = "'" + s;          // formül enjeksiyonu
  if (/[";\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
};
const csvMetni = () => {
  const satirlar = [['Ad soyad', 'Kurum', 'Görev', 'Durum', 'Kişi', 'Zaman', 'Süre sonrası', 'Mesaj']];
  const liste = gruplar.map((g) => g.cur).sort((a, b) => kol.compare(a.ad, b.ad));
  liste.forEach((k) => {
    const p = k.ms ? parca(k.ms) : null;
    satirlar.push([k.ad, k.kurum, k.gorev, durumEtiket(k), k.kisi, p ? p.d + '.' + p.m + '.' + p.y + ' ' + p.h + ':' + p.mi : '', k.ms > SON_YANIT ? 'Evet' : 'Hayır', k.mesaj]);
  });
  return '﻿' + satirlar.map((r) => r.map(csvHucre).join(';')).join('\r\n') + '\r\n';
};
const csvIndir = () => {
  if (!veri) return;
  const blob = new Blob([csvMetni()], { type: 'text/csv;charset=utf-8' });
  const p = parca(Date.now()); const ad = 'veda-katilim-' + p.y + p.m + p.d + '-' + p.h + p.mi + '.csv';
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; a.rel = 'noopener'; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1500);
  toast('CSV indirildi: ' + ad + ' (telefon içermez).');
};

// ---------- Özet raporu ----------
const raporKur = () => {
  const o = ozet; const g = $('yz-rapor-govde'); bosalt(g); const simdi = Date.now(); const eskiMod = S.gunMod; S.gunMod = 'gun';
  const r = $('yz-r-ozet'); bosalt(r); r.appendChild(document.createTextNode('Rapor tarihi: ' + tamTarih() + '   ·   ' + o.kat + ' katılacak kayıt, ' + o.yok + ' katılamayacak kayıt'));
  const kpi = el('div', 'rp-kpi');
  const kutu = (b, a, buyuk) => { const d = el('div', 'rp-k' + (buyuk ? ' buyuk' : '')); d.appendChild(el('b', '', String(b))); d.appendChild(el('span', '', a)); kpi.appendChild(d); };
  kutu(o.kisi, 'Katılacak kişi', true); kutu(o.kat, 'Katılacak kayıt'); kutu(o.yok, 'Katılamayacak'); kutu(o.msj, 'Hocamıza mesaj'); kutu(o.sonra, 'Süre sonrası');
  g.appendChild(kpi);
  const dur = el('div', 'rp-durum');
  dur.appendChild(el('p', '', simdi < SON_YANIT ? 'Yanıt süresi: Cumartesi 7 Kasım 12.00’ye ' + sureMetni(SON_YANIT - simdi) + ' var.' : 'Yanıt süresi: Cumartesi 7 Kasım 12.00’de doldu; sonradan ' + o.sonra + ' kayıt geldi.'));
  dur.appendChild(el('p', '', simdi < PROGRAM_BAS ? 'Program: Pazar 8 Kasım 15.30 (karşılama 15.00); ' + sureMetni(PROGRAM_BAS - simdi) + ' var.' : 'Program: Pazar 8 Kasım 15.30 (karşılama 15.00).'));
  g.appendChild(dur);
  const ekle = (fn, baslik, alt, w, hedef) => { const k = grafikKarti(baslik, alt); hedef.appendChild(k.f); fn(k, w); const t = k.f.querySelector('.gk-tablo'); if (t) t.remove(); return k; };
  const s1 = el('div', 'rp-s'); g.appendChild(s1);
  ekle((k, w) => cizKum(k, w, false, true), 'Birikimli bildirimler', 'Katılacak kişi ve kayıt; son yanıt saati işaretli.', 690, s1);
  ekle((k, w) => cizGun(k, w, true), 'Günlük bildirimler', 'Süre içinde ve süre sonrası gelen kayıtlar.', 690, s1);
  const s2 = el('div', 'rp-s rp-s2'); g.appendChild(s2);
  ekle((k, w) => cizDurum(k, w, true), 'Katılım durumu', '', 690, s2);
  const iki = el('div', 'rp-iki'); s2.appendChild(iki);
  ekle((k, w) => cizGorev(k, w, true), 'Göreve göre durum', '', 338, iki);
  ekle((k, w) => cizBuyukluk(k, w, true), 'Kayıt başına kişi', '', 338, iki);
  ekle((k, w) => cizKurum(k, w, true), 'Kuruma göre katılacak kişi (ilk 10)', '', 690, s2);
  const kal = o.kalite; const n = el('p', 'rp-kalite');
  n.textContent = 'Veri notları: görevi boş ' + kal.gorevBos.length + ' · olası mükerrer ' + (kal.mukerrerAd.length + kal.mukerrerTel.length) + ' · süre sonrası ' + kal.gec.length + ' · cevabını değiştiren ' + kal.degisen.length + '.';
  s2.appendChild(n);
  $('yz-r-not').textContent = 'Bu rapor ' + tamTarih() + ' tarihli bildirimlere dayanır. Aynı ad ve kurumla yeniden gönderilen bildirimlerde yalnız en yenisi sayılır. Kişisel iletişim bilgisi içermez.';
  S.gunMod = eskiMod;
};

// ---------- Yazdırma ----------
const yazdirHazirla = (tur, ml) => {
  if (tur === 'kapi') {
    const kat = gruplar.map((g) => g.cur).filter((k) => k.gecerli !== false && k.durum === 'katilacak');
    const secim = $('yz-sira') ? $('yz-sira').value : 'ad';
    const soyad = (k) => k.ad.split(/\s+/).slice(-1)[0] || '';
    if (secim === 'soyad') kat.sort((a, b) => kol.compare(soyad(a), soyad(b)) || kol.compare(a.ad, b.ad));
    else if (secim === 'kurum') kat.sort((a, b) => kol.compare(a.kurum, b.kurum) || kol.compare(a.ad, b.ad));
    else kat.sort((a, b) => kol.compare(a.ad, b.ad));
    const kisi = kat.reduce((t, k) => t + k.kisi, 0);
    const o = $('yz-ozet'); bosalt(o); o.appendChild(document.createTextNode('Katılacak kayıt: ')); o.appendChild(el('b', '', String(kat.length))); o.appendChild(document.createTextNode('   ·   Toplam kişi: ')); o.appendChild(el('b', '', String(kisi))); o.appendChild(document.createTextNode('   ·   Liste tarihi: ' + tamTarih()));
    const gv = $('yz-govde'); bosalt(gv);
    kat.forEach((k, i) => { const tr = el('tr'); tr.appendChild(el('td', 'kutu', '☐')); tr.appendChild(el('td', 'no', String(i + 1))); tr.appendChild(el('td', 'ad', k.ad)); tr.appendChild(el('td', '', k.kurum)); tr.appendChild(el('td', '', k.gorev)); tr.appendChild(el('td', 'kisi', String(k.kisi))); gv.appendChild(tr); });
    for (let i = 0; i < 5; i++) { const tr = el('tr', 'bosyer'); tr.appendChild(el('td', 'kutu', '☐')); tr.appendChild(el('td', 'no', '')); for (let j = 0; j < 4; j++) tr.appendChild(el('td', '', '')); gv.appendChild(tr); }
    $('yz-not').textContent = 'Son boş satırlar listede olmayan konuklar içindir. Bu liste ' + tamTarih() + ' tarihli bildirimlere dayanır.';
  } else if (tur === 'rapor') {
    raporKur();
  } else {
    const m = ml || mesajListesi();
    const o = $('yz-m-ozet'); bosalt(o); o.appendChild(document.createTextNode('Mesaj sayısı: ')); o.appendChild(el('b', '', String(m.length))); o.appendChild(document.createTextNode('   ·   Liste tarihi: ' + tamTarih()));
    const gv = $('yz-m-govde'); bosalt(gv);
    m.forEach((x) => { const d = el('div', 'yz-msg'); d.appendChild(el('blockquote', '', x.k.mesaj)); const kim = el('div', 'kim', x.k.ad); const ek = [x.k.kurum, x.k.gorev].filter(Boolean).join(' · '); kim.appendChild(el('span', '', ek ? ' · ' + ek : '')); d.appendChild(kim); gv.appendChild(d); });
  }
  document.body.dataset.yazdir = tur;
};
const yazdir = (tur, ml) => { if (!veri) return; yazdirHazirla(tur, ml); try { window.print(); } catch (_) {} };
window.addEventListener('beforeprint', () => { if (veri && !document.body.dataset.yazdir) yazdirHazirla('kapi'); });
window.addEventListener('afterprint', () => { delete document.body.dataset.yazdir; const r = $('yz-rapor-govde'); if (r) bosalt(r); });
