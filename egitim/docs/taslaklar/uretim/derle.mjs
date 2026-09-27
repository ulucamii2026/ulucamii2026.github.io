// Faz 1e taslakları, adım 2/3: şablonlardan (uretim/sablon) gerçek veriyle üç taslak sayfa üretir → egitim/docs/taslaklar/.
// Çalıştırma (depo kökünden, önce veri.mjs): node egitim/docs/taslaklar/uretim/derle.mjs
// Fâtiha metni ve meâli: fatiha-diyanet.json (kuran.diyanet.gov.tr'den birebir; kaynak adresi dosyada).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const URETIM = 'egitim/docs/taslaklar/uretim';
const VERI = 'node_modules/.cache/egitim-taslak';
const HEDEF = process.env.TASLAK_HEDEF || 'egitim/docs/taslaklar';   // karşılaştırma için başka klasöre yazılabilir
const V = JSON.parse(readFileSync(`${VERI}/veri.json`, 'utf8'));
const FATIHA = JSON.parse(readFileSync(`${URETIM}/fatiha-diyanet.json`, 'utf8'));
const KILIM = readFileSync(`${VERI}/kilim-ornek.svg`, 'utf8');
const LEJANT = readFileSync(`${VERI}/kilim-lejant.html`, 'utf8');
const SAHNE = Object.fromEntries(readdirSync('egitim/src/assets/cizim/sahne').filter((f) => f.endsWith('.svg'))
  .map((f) => [f.replace(/\.svg$/, ''), readFileSync(`egitim/src/assets/cizim/sahne/${f}`, 'utf8')]));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const tarih = (t) => { if (!t) return ''; const [y, a, g] = t.split('-').map(Number); return `${g} ${AYLAR[a - 1]} ${y}`; };
const TUR = { sure: 'Sûre', dua: 'Dua', bilgi: 'Bilgi' };

const IKONLAR = {
  ok: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  geri: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  dis: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  tekrar: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  goz: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  karo: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  saat: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ses: '<path d="M4 10v4h3l5 4V6L7 10z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  tamam: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bulut: '<path d="M3 3l18 18"/><path d="M17.5 17.5H7a4.5 4.5 0 0 1-1.2-8.84"/><path d="M9.4 5.6A6 6 0 0 1 17.4 9a4 4 0 0 1 3.2 6.4"/>',
  kapat: '<path d="M6 6l12 12M18 6L6 18"/>',
  durdur: '<path d="M8.5 5v14M15.5 5v14"/>',
  asagi: '<path d="M6 9l6 6 6-6"/>',
};
const ikon = (ad, sinif = 'ikon') => `<svg class="${sinif}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${IKONLAR[ad]}</svg>`;
const IKON_CAL = '<svg class="ikon ikon-cal" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/></svg>'
  + `<svg class="ikon ikon-dur" viewBox="0 0 24 24" aria-hidden="true" focusable="false" hidden>${IKONLAR.durdur}</svg>`;
const cizim = (ad, sinif = '') => SAHNE[ad].replace('<svg ', `<svg class="cizim${sinif ? ` ${sinif}` : ''}" aria-hidden="true" focusable="false" `).replace(/<title>[^<]*<\/title>/, '');
const isaret = (b, ek = '') => V.isaretler[b].svg.replace('class="ez-isaret', `class="ez-isaret${ek ? ` ${ek}` : ''}`);

// Motif sembolleri + iki bordür deseni (açık zemin, koyu zemin).
const kb = V.motifler['kenar-kocboynuzu'];
const MOTIF_SEMBOLLERI = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>`
  + Object.entries(V.motifler).map(([ad, m]) => `<symbol id="mt-${ad}" viewBox="${m.kutu}">${m.icerik}</symbol>`).join('')
  + `<pattern id="bordur-acik" width="32" height="16" patternUnits="userSpaceOnUse"><svg viewBox="${kb.kutu}" width="32" height="16"><g fill="#134420" class="bordur-desen">${kb.icerik}</g></svg></pattern>`
  + `<pattern id="bordur-koyu" width="32" height="16" patternUnits="userSpaceOnUse"><svg viewBox="${kb.kutu}" width="32" height="16"><g fill="#2A6A3F">${kb.icerik}</g></svg></pattern>`
  + `</defs></svg>`;
const bordur = (desen) => `<svg class="bordur" aria-hidden="true" focusable="false" preserveAspectRatio="none"><rect width="100%" height="100%" fill="url(#${desen})"/></svg>`;

const UST = (sayfa) => `<header class="ust">
  <div class="icerik">
    <a class="logo" href="giris.html"><img src="../../public/logo/kuran-kursu-yatay.svg" alt="Marche-en-Famenne Ulu Camii Kur’an Kursu" width="134" height="64"></a>
    <nav aria-label="Ana menü">
      <a class="bolum-bag" href="giris.html"${sayfa === 'giris' ? ' aria-current="page"' : ''}>Ezber Kilimi</a>
      <a href="https://www.ulucamii.be/tr/">ulucamii.be ${ikon('dis')}</a>
      <div class="diller" role="group" aria-label="Dil (taslakta yalnız Türkçe)"><a href="giris.html" aria-current="true" lang="tr">TR</a><a href="giris.html" lang="fr">FR</a><a href="giris.html" lang="en">EN</a><a href="giris.html" lang="nl">NL</a><a href="giris.html" lang="de">DE</a></div>
    </nav>
  </div>
  ${bordur('bordur-acik')}
</header>`;

const ALT = `<footer class="alt">
  ${bordur('bordur-koyu')}
  <div class="icerik">
    <div><h2>Ulu Camii Kur’an Kursu</h2><p>Marche-en-Famenne Ulu Camii’nin Kur’an kursu ve eğitim çalışmaları. Ücretsizdir; kayıtlar ana sitede.</p><p style="margin-top:0.8rem"><a href="https://www.ulucamii.be/tr/">ulucamii.be’ye dön</a></p></div>
    <div><h2>İletişim</h2><ul><li>Thier des Corbeaux 14, 6900 Marche-en-Famenne</li><li><a href="mailto:info@ulucamii.be">info@ulucamii.be</a></li><li><a href="tel:+32472985073">+32 472 98 50 73</a></li><li><a href="https://www.ulucamii.be">www.ulucamii.be</a></li></ul></div>
    <div><h2>Kaynaklar</h2><ul><li>Kur’an metni, meâl ve tilavet: <a href="https://kuran.diyanet.gov.tr">Diyanet İşleri Başkanlığı</a></li><li>Yazı tipleri: Atkinson Hyperlegible Next ve Ulu Nesih (Scheherazade New’den), SIL Open Font License 1.1</li></ul></div>
    <p class="kucuk">Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL · KBO/BCE 0421.900.807</p>
  </div>
</footer>`;

// ——— Pano ———
// 13 × 14 ızgara: ortada 12 sıra (sıra karosu + en çok 10 madde), çevresinde kenar suyu bordürü. Kenar suyunun maddeleri
// kilimdeki gibi (src/lib/ezber/kilim.ts) saat yönünde dağılır: üst 4, sağ 3, alt 3 sağdan sola, sol 3 alttan üste;
// aradaki bordür karolarında koçboynuzu, köşelerde köşe motifi.
const SUTUN = 13;
const SATIR = V.siralar.length + 2;
const serAdi = (s) => (s.seviye === 8 ? `Amme, ${s.ad}` : `${s.etiket}. şerit`);
const maddeLink = (id) => (id === 's-fatiha' ? 'madde.html' : `#m-${id}`);
const maddeKaro = (o, r, c, serit, motif, bilgi) => `          <a class="karo madde" href="${maddeLink(o.id)}" style="grid-row:${r};grid-column:${c}" data-r="${r}" data-c="${c}" data-ad="${esc(o.ad)}" data-serit="${esc(serit)}" data-tur="${TUR[o.tur]}" data-ses="${o.ses ? 1 : 0}" data-hedef="${esc(tarih(o.hedef))}" aria-label="${esc(bilgi)}"><svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><use href="#mt-${motif}"/></svg></a>\n`;
let pano = '';
V.siralar.forEach((s, i) => {
  const r = i + 2;
  if (s.seviye !== 8) pano += `          <span class="karo sira" aria-hidden="true" style="grid-row:${r};grid-column:2">${s.etiket}</span>\n`;
  else if (s.durak === 1) pano += `          <span class="karo amme" aria-hidden="true" style="grid-row:${r} / span 5;grid-column:2"><span>Amme</span></span>\n`;
  s.ogeler.forEach((o, j) => { pano += maddeKaro(o, r, j + 3, serAdi(s), s.motif, `${o.ad}, ${serAdi(s)}`); });
  for (let c = s.ogeler.length + 3; c < SUTUN; c++) pano += `          <span class="karo bos" aria-hidden="true" style="grid-row:${r};grid-column:${c}"></span>\n`;
});
const yerler = (n, uzunluk) => Array.from({ length: n }, (_, k) => Math.floor(((k + 0.5) * uzunluk) / n));
const kn = V.kenar.ogeler.length;
const dagit = [Math.ceil((kn * 4) / 13), 0, 0, 0];
dagit[1] = Math.ceil((kn - dagit[0]) / 3);
dagit[2] = Math.ceil((kn - dagit[0] - dagit[1]) / 2);
dagit[3] = kn - dagit[0] - dagit[1] - dagit[2];
const kenarYeri = [
  ...yerler(dagit[0], SUTUN - 2).map((k) => [1, 2 + k]),
  ...yerler(dagit[1], SATIR - 2).map((k) => [2 + k, SUTUN]),
  ...yerler(dagit[2], SUTUN - 2).map((k) => [SATIR, SUTUN - 1 - k]),
  ...yerler(dagit[3], SATIR - 2).map((k) => [SATIR - 1 - k, 1]),
];
const dolu = new Map(kenarYeri.map(([r, c], i) => [`${r}.${c}`, V.kenar.ogeler[i]]));
for (let r = 1; r <= SATIR; r++) {
  for (let c = 1; c <= SUTUN; c++) {
    const kose = (r === 1 || r === SATIR) && (c === 1 || c === SUTUN);
    const yon = r === 1 ? 'ust' : c === SUTUN ? 'sag' : r === SATIR ? 'alt' : c === 1 ? 'sol' : '';
    if (!yon) continue;
    const o = dolu.get(`${r}.${c}`);
    if (o) pano += maddeKaro(o, r, c, 'Kenar suyu', V.kenar.motif, `${o.ad}, kenar suyu`);
    else if (kose) pano += `          <span class="karo kose" aria-hidden="true" style="grid-row:${r};grid-column:${c}"><svg viewBox="0 0 120 120" focusable="false"><use href="#mt-kenar-kose"/></svg></span>\n`;
    else pano += `          <span class="karo bordur-karo yon-${yon}" aria-hidden="true" style="grid-row:${r};grid-column:${c}"><svg viewBox="${V.motifler['kenar-kocboynuzu'].kutu}" focusable="false"><use href="#mt-kenar-kocboynuzu"/></svg></span>\n`;
  }
}

// ——— Dört basamak ———
const BASAMAK = [
  { b: 1, ad: 'Çalışıyor', metin: 'Öğrenci bu maddeye başladı. Motif yalnız konturla çizilir.', saat: 'Hoca dinleyince ilerler' },
  { b: 2, ad: 'Hocaya okudu', metin: 'Hocasına ilk kez okudu: «Tam» ya da «Az hatalı». Motif firuzeyle boyanır.', saat: 'En erken 7 gün sonra pekişir' },
  { b: 3, ad: 'Pekişti', metin: 'Bir hafta sonra yine okudu, unutmamış. Motif yeşille sırlanır; şeridin bütün maddeleri pekişince Ezber Sertifikası verilir.', saat: 'En erken 30 gün sonra kalıcı olur' },
  { b: 4, ad: 'Kalıcı', metin: 'Bir ay sonra da hatırladı. Motif altınla bezenir; şeridin bütün maddeleri kalıcı olunca kilime altın kenar dokunur.', saat: 'Tekrarlarla korunur' },
];
const BASAMAKLAR = BASAMAK.map((x) => `        <li><svg class="motif" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${x.b === 4 ? '<rect x="4" y="4" width="112" height="112" class="kl-b4-cerceve" style="stroke-width:4"/>' : ''}<use href="#mt-goz" class="kl-m kl-b${x.b}"/></svg><h3>${x.ad}</h3><p>${x.metin}</p><span class="saat">${ikon('saat')}${x.saat}</span></li>`).join('\n');

// ——— Şeritler ———
const VINYET = { 1: 'serit-1-kapi', 2: 'serit-2-abdest', 3: 'serit-3-seccade', 4: 'serit-4-oturus', 5: 'serit-5-rahle', 6: 'serit-6-mushaf', 7: 'serit-7-minare', 8: 'serit-8-cuz' };
const maddeLi = (o, motif) => {
  const ic = `<span class="rozet-karo" aria-hidden="true"><svg viewBox="0 0 120 120" focusable="false"><use href="#mt-${motif}"/></svg></span><span><span class="ad">${esc(o.ad)}</span><span class="ust-bilgi"><span>${TUR[o.tur]}</span>${o.ses ? `<span class="ses">${ikon('ses')}Sesli</span>` : ''}${o.hedef ? `<span>Sınıf hedefi: ${tarih(o.hedef)}</span>` : ''}</span></span>`;
  return o.id === 's-fatiha' ? `<li id="m-${o.id}"><a href="madde.html">${ic}</a></li>` : `<li id="m-${o.id}"><div class="madde-ic">${ic}</div></li>`;
};
// Şerit: başlık her zaman görünür; madde listesi telefonda katlanır (details), geniş ekranda hep açıktır.
const serit = ({ id, no, ad, amac, vinyet, motif, sayi, liste }) => `        <section class="serit" id="${id}" aria-labelledby="${id}-b">`
  + `<div class="serit-bas">${cizim(vinyet)}<div class="serit-yazi"><h3 id="${id}-b">${no ? `<span class="no">${no}</span>` : ''}${esc(ad)}</h3><p>${esc(amac)}</p></div></div>`
  + `<details class="serit-liste" open><summary><span class="rozet-karo" aria-hidden="true"><svg viewBox="0 0 120 120" focusable="false"><use href="#mt-${motif}"/></svg></span>`
  + `<span>${sayi} madde</span><span class="eylem-yazi"><span class="ac">Göster</span><span class="kapa">Gizle</span>${ikon('asagi')}</span></summary>`
  + `<ul class="maddeler">${liste}</ul></details></section>\n`;
let seritler = '';
for (const sv of [1, 2, 3, 4, 5, 6, 7]) {
  const s = V.siralar.find((x) => x.seviye === sv);
  seritler += serit({ id: `serit-${sv}`, no: sv, ad: s.ad, amac: s.amac, vinyet: VINYET[sv], motif: s.motif, sayi: s.ogeler.length,
    liste: s.ogeler.map((o) => maddeLi(o, s.motif)).join('') });
}
const amme = V.siralar.filter((x) => x.seviye === 8);
const ammeTanim = V.seviyeler.find((x) => x.kimlik === 8);
const ammeSayi = amme.reduce((t, d) => t + d.ogeler.length, 0);
seritler += serit({ id: 'serit-8', no: 8, ad: ammeTanim.ad, amac: `${ammeTanim.amac} Beş durakta, ${ammeSayi} sûre.`, vinyet: VINYET[8],
  motif: amme[0].motif, sayi: ammeSayi,
  liste: amme.map((d) => `<li class="durak-basligi">${esc(d.ad)} · ${d.ogeler.length} sûre</li>${d.ogeler.map((o) => maddeLi(o, d.motif)).join('')}`).join('') });
seritler += serit({ id: 'kenar-suyu', no: 0, ad: V.kenar.ad, amac: V.kenar.amac, vinyet: 'kenar-kandil', motif: V.kenar.motif,
  sayi: V.kenar.ogeler.length, liste: V.kenar.ogeler.map((o) => maddeLi(o, V.kenar.motif)).join('') });

// Telefonda listeler kapalı başlar; bağlantı (#serit-3, #m-…) katlanmış bir listeye giderse o liste açılır.
const SERIT_JS = `(() => {
  const dar = matchMedia('(max-width: 59.99rem)');
  const listeler = [...document.querySelectorAll('details.serit-liste')];
  const hedef = () => { try { return location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch { return null; } };
  const ac = (el) => {
    const d = el && (el.closest('details.serit-liste') || el.querySelector?.('details.serit-liste'));
    if (d && !d.open) { d.open = true; el.scrollIntoView(); }
  };
  const uygula = () => { listeler.forEach((d) => { d.open = !dar.matches; }); ac(hedef()); };
  uygula();
  dar.addEventListener('change', uygula);
  addEventListener('hashchange', () => ac(hedef()));
})();`;

const PANO_JS = `(() => {
  const kusak = document.querySelector('[data-kusak]');
  const karolar = [...document.querySelectorAll('.pano .karo.madde')];
  if (!kusak || !karolar.length) return;
  const varsayilan = [...kusak.childNodes].map((n) => n.cloneNode(true));
  const yaz = (k) => {
    const d = k.dataset;
    const b = document.createElement('b'); b.textContent = d.ad;
    const ek = document.createElement('span'); ek.className = 'kusak-ek';
    ek.textContent = ' · ' + [d.serit, d.tur, d.ses === '1' ? 'sesli' : '', d.hedef ? 'sınıf hedefi ' + d.hedef : ''].filter(Boolean).join(' · ');
    kusak.replaceChildren(b, ek);
  };
  const geri = () => kusak.replaceChildren(...varsayilan.map((n) => n.cloneNode(true)));
  const konum = (k, e) => {
    const r = k.getBoundingClientRect();
    const x = e && e.clientX ? ((e.clientX - r.left) / r.width) * 100 : 50;
    const y = e && e.clientY ? ((e.clientY - r.top) / r.height) * 100 : 50;
    k.style.setProperty('--x', x.toFixed(1) + '%'); k.style.setProperty('--y', y.toFixed(1) + '%');
  };
  karolar.forEach((k, i) => {
    k.tabIndex = i === 0 ? 0 : -1;
    k.addEventListener('pointerenter', (e) => { konum(k, e); yaz(k); });
    k.addEventListener('focus', () => { konum(k); yaz(k); });
    k.addEventListener('blur', geri);
  });
  document.querySelector('.pano-cerceve').addEventListener('pointerleave', geri);
  // Sağ/sol okuma sırasıyla (şeritler, sonra kenar suyu saat yönünde); yukarı/aşağı ızgarada en yakın karo:
  // önce satır uzaklığı, sonra sütun uzaklığı.
  const hucre = (k) => ({ r: Number(k.dataset.r), c: Number(k.dataset.c) });
  const dikey = (k, yon) => {
    const { r, c } = hucre(k);
    let en = null, enSkor = Infinity;
    for (const x of karolar) {
      const h = hucre(x);
      const d = (h.r - r) * yon;
      const skor = d * 100 + Math.abs(h.c - c);
      if (d > 0 && skor < enSkor) { en = x; enSkor = skor; }
    }
    return en;
  };
  document.addEventListener('keydown', (e) => {
    const k = document.activeElement;
    if (!karolar.includes(k)) return;
    let hedef = null;
    if (e.key === 'ArrowRight') hedef = karolar[karolar.indexOf(k) + 1];
    else if (e.key === 'ArrowLeft') hedef = karolar[karolar.indexOf(k) - 1];
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') hedef = dikey(k, e.key === 'ArrowDown' ? 1 : -1);
    else if (e.key === 'Home') hedef = karolar[0];
    else if (e.key === 'End') hedef = karolar[karolar.length - 1];
    if (hedef) { e.preventDefault(); k.tabIndex = -1; hedef.tabIndex = 0; hedef.focus(); }
  });
})();`;

// ——— Madde (Fâtiha) ———
const OKUNUS = 'Bismillâhir-rahmânir-rahîm. Elhamdü lillâhi rabbil-âlemîn. Er-rahmânir-rahîm. Mâliki yevmid-dîn. İyyâke na’büdü ve iyyâke neste’în. İhdinas-sırâtal-müstekîm. Sırâtallezîne en’amte aleyhim, ğayril-mağdûbi aleyhim veled-dâllîn.'
  .split(/(?<=\.)\s+/);
if (OKUNUS.length !== 7) throw new Error('okunuş 7 parça değil');
const HINT = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const arRakam = (n) => String(n).split('').map((d) => HINT[Number(d)]).join('');
const gruplar = FATIHA.meal.map((m) => {
  const [a, b] = m.ayet.split('-').map(Number);
  return { a, b: b || a, meal: m.metin.replace(/'/g, '’') };
});
const AYETLER = gruplar.map((g) => {
  const ayetler = FATIHA.arapca.filter((x) => x.ayet >= g.a && x.ayet <= g.b);
  const ar = ayetler.map((x) => `${esc(x.metin)} <span class="no">\u06DD${arRakam(x.ayet)}</span>`).join(' ');
  const ok = ayetler.map((x) => `<p class="okunus" lang="tr"><span class="no">${x.ayet}</span>${esc(OKUNUS[x.ayet - 1])}</p>`).join('');
  const no = g.a === g.b ? `${g.a}` : `${g.a}–${g.b}`;
  return `          <div class="ayet-grubu"><p class="ar" lang="ar">${ar}</p><div class="okunuslar">${ok}</div><p class="meal"><span class="no">${no}</span>${esc(g.meal)}</p></div>`;
}).join('\n');
const AYET_KAROLARI = FATIHA.arapca.map((x) => `            <button type="button" data-ayet="${x.ayet}"${x.ayet === 2 ? ' aria-current="true"' : ''}${x.ayet === 1 ? ' class="bitti"' : ''} aria-label="${x.ayet}. âyet">${x.ayet}</button>`).join('\n');
const MADDE_JS = `(() => {
  const metin = document.querySelector('.metin');
  const okd = document.querySelector('[data-okunus-dugme]');
  okd?.addEventListener('click', () => {
    const acik = okd.getAttribute('aria-pressed') !== 'true';
    okd.setAttribute('aria-pressed', String(acik));
    metin.dataset.okunus = acik ? 'acik' : 'gizli';
  });
  document.querySelectorAll('.secim:not([data-okunus-dugme])').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));
  const karolar = [...document.querySelectorAll('.ayet-karolari button')];
  const cal = document.querySelector('[data-cal]');
  const tekrarDugme = document.querySelector('[data-tekrar]');
  const yavasDugme = document.querySelector('[data-yavas]');
  const basili = (b) => b?.getAttribute('aria-pressed') === 'true';
  const simge = (c) => { cal.querySelector('.ikon-cal').hidden = c; cal.querySelector('.ikon-dur').hidden = !c; };
  const ses = new Audio();
  let sira = 2, caliyor = false, kez = 0;
  const isaretle = () => karolar.forEach((b) => { const n = Number(b.dataset.ayet); b.toggleAttribute('aria-current', n === sira); if (n === sira) b.setAttribute('aria-current', 'true'); b.classList.toggle('bitti', n < sira); });
  const oynat = () => {
    ses.src = '../../../public/media/ses/ayet/1-' + sira + '.mp3';
    ses.defaultPlaybackRate = ses.playbackRate = basili(yavasDugme) ? 0.75 : 1;
    ses.play().catch(() => durdur());
  };
  const durdur = () => { caliyor = false; kez = 0; ses.pause(); simge(false); cal.setAttribute('aria-label', 'Tilaveti dinle'); };
  ses.addEventListener('ended', () => {
    if (++kez < (basili(tekrarDugme) ? 3 : 1)) return oynat();
    kez = 0;
    if (sira < 7) { sira++; isaretle(); oynat(); } else { durdur(); sira = 1; isaretle(); }
  });
  cal.addEventListener('click', () => { if (caliyor) return durdur(); caliyor = true; simge(true); cal.setAttribute('aria-label', 'Durdur'); oynat(); });
  karolar.forEach((b) => b.addEventListener('click', () => { sira = Number(b.dataset.ayet); kez = 0; isaretle(); if (caliyor) oynat(); }));
})();`;

// ——— Hoca ———
const MADDE = Object.fromEntries([...V.siralar.flatMap((s) => s.ogeler.map((o) => [o.id, { ...o, motif: s.motif }])), ...V.kenar.ogeler.map((o) => [o.id, { ...o, motif: V.kenar.motif }])]);
const OGR = [
  { ad: 'Deniz Örnek', m: 's-ihlas', b: 1, durum: 'Çalışıyor' },
  { ad: 'Talha Deneme', m: 's-kevser', b: 2, durum: 'Hocaya okudu', kontrol: true, ek: 'pekişme kontrolü bugün' },
  { ad: 'Meryem Taslak', m: 'd-subhaneke', b: 2, durum: 'Hocaya okudu', ek: 'kontrol 24 Ekim’de' },
  { ad: 'Emir Sınama', m: 's-fatiha', b: 3, durum: 'Pekişti', ek: 'kalıcılık kontrolü 14 Kasım’da' },
  { ad: 'Lina Örnekoğlu', m: 'd-ettehiyyatu', b: 0, durum: 'Başlanmadı', ek: 'sınıf hedefi 28 Mart' },
  { ad: 'Yusuf Provaoğlu', m: 'd-rabbena-atina', b: 1, durum: 'Çalışıyor' },
];
const ogrLi = (o, { kayit } = {}) => {
  const m = MADDE[o.m];
  return `          <li class="ogrenci"><div><div class="ad">${esc(o.ad)}</div><div class="sonraki"><span class="rozet-karo" aria-hidden="true"><svg viewBox="0 0 120 120" focusable="false"><use href="#mt-${m.motif}"/></svg></span><span class="madde-adi">${esc(m.ad)}</span></div><div class="durum">${isaret(o.b)}<span>${o.durum}${o.ek ? ` · <span class="${o.kontrol ? 'kontrol' : ''}">${o.ek}</span>` : ''}</span></div></div><button class="dinle${o.b === 3 ? ' ikincil' : ''}" type="button">Dinle</button>${kayit ? `<div class="kayit-satiri bekliyor"><span>${kayit}</span><button class="geri" type="button">Geri al</button></div>` : ''}</li>`;
};
const OGRENCILER = OGR.map((o) => ogrLi(o)).join('\n');
const OGRENCILER_KISA = OGR.slice(0, 4).map((o) => ogrLi(o)).join('\n');
const OGR3 = OGR.map((o) => (o.m === 's-ihlas' ? { ...o, b: 2, durum: 'Hocaya okudu', ek: 'kontrol 24 Ekim’de', _k: '<b>Sırada</b> · 10.43 · Tam; deftere yazıldı' }
  : o.m === 's-kevser' ? { ...o, b: 3, durum: 'Pekişti', kontrol: false, ek: 'kalıcılık kontrolü 16 Kasım’da', _k: '<b>Sırada</b> · 10.44 · Tam; pekişti' } : o));
const OGRENCILER_KAYITLI = OGR3.map((o) => ogrLi(o, { kayit: o._k })).join('\n');
const CIPLER = ['Akıcı', 'Mahreç', 'Med', 'Sıra', 'Son kısım', 'Dinleyerek', 'Anlamı', 'Gayret']
  .map((e, i) => `            <button class="cip" type="button" aria-pressed="${i === 0}">${e}</button>`).join('\n');

// ——— Yerleştirme ———
const ortak = (s, sayfa) => s
  .replace('{{MOTIF_SEMBOLLERI}}', MOTIF_SEMBOLLERI)
  .replace('{{UST}}', UST(sayfa))
  .replace('{{ALT}}', ALT)
  .replace(/\{\{IKON:([a-z]+)\}\}/g, (_, a) => ikon(a))
  .replace(/\{\{IKON_BUYUK:kitap\}\}/g, cizim('serit-6-mushaf', 'muhur'))
  .replace(/\{\{ISARET:(\d)\}\}/g, (_, b) => isaret(Number(b)))
  .replace(/\{\{CIZIM:([a-z0-9-]+)\}\}/g, (_, a) => cizim(a));
const yerlestir = (ad, eslem) => {
  let s = readFileSync(`${URETIM}/sablon/${ad}.html`, 'utf8');
  for (const [k, v] of Object.entries(eslem)) s = s.split(`{{${k}}}`).join(v);
  s = ortak(s, ad);
  const kalan = s.match(/\{\{[A-Z_]+(?::[^}]*)?\}\}/g);
  if (kalan) throw new Error(`${ad}: doldurulmamış yer tutucu ${[...new Set(kalan)].join(', ')}`);
  writeFileSync(`${HEDEF}/${ad}.html`, s);
  console.log(ad, (s.length / 1024).toFixed(1), 'KB');
};
yerlestir('giris', { PANO: pano.trimEnd(), BASAMAKLAR, SERITLER: seritler.trimEnd(), KILIM, LEJANT, KILIM_OZET: esc(V.kilimOzeti), PANO_JS: `${PANO_JS}\n${SERIT_JS}` });
// Serlevha: Diyanet sûre listesindeki ad (SureNameArabic «الْفَاتِحَةِ», izafette esreli) «سُورَةُ» ile tamlama olarak yazılır.
yerlestir('madde', { AR_AD: esc('سُورَةُ الْفَاتِحَةِ'), AYET_SAYISI: String(FATIHA.arapca.length), AYETLER, AYET_KAROLARI, KAYNAK_URL: FATIHA.kaynak, MADDE_JS, IKON_CAL });
yerlestir('hoca', { OGRENCILER, OGRENCILER_KISA, OGRENCILER_KAYITLI, CIPLER });
