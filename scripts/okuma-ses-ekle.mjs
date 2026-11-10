#!/usr/bin/env node
/**
 * Kur'an Okuma: tecvid örnekleri (adım o8) ve kısa âyetler (adım o9) — Diyanet Elifbâ sesleri egitim Hosting'inden çalar (10 Kasım 2026).
 *
 *   node scripts/okuma-ses-ekle.mjs --dogrula --kuran <kuran_arapca.json> [--kaynak D:/tmp/ilim-yolu-okuma-ses]   Arapça metni doğrular → docs/okuma-metin-dogrulama.json
 *   node scripts/okuma-ses-ekle.mjs --uret [--kaynak …]                  doğrulanan maddeleri içe alır: sesleri kopyalar, src/data/okuma/yeni.json ve künyeyi yazar
 *   node scripts/okuma-ses-ekle.mjs --denetle [--dist]                    her dosya var mı, bayt ve sha256 tutuyor mu (egitim:build çalıştırır)
 *
 * KAYNAK: D:\tmp\ilim-yolu-okuma-ses\KAYNAK.json (Diyanet Elifbâ portalı: kuran.diyanet.gov.tr/elifba ve webdosya.diyanet.gov.tr; her kayıtta kaynak adresi,
 * sha256, Arapça metin). Metin ve ses OLDUĞU GİBİ alınır; yapay ses ve üçüncü taraf ses yoktur. SADECE bu betik yeni maddeleri kurar; elle ekleme yok.
 *
 * DOĞRULAMA (Arapça metin). Karşılaştırma, yazılış biçimi farklarını eleyen kanonik biçim üzerinde yapılır (kanon()): ünsüz + kısa hareke + tenvin (+ sıkı kipte şedde ve
 * sükûn); elif/hemze taşıyıcıları (ve harekeleri; «ا۪ي» uzatma yâsı), uzatma ve vakıf/küçük işaretleri, ZWJ, boşluk ve vurgu işareti `{}` atılır; fetha yalnız SIKI kipte karşılaştırılır (hançer elif ile yazılan fetha gevşek kipte atılır, çünkü Diyanet ve Hafs çıktısı onu farklı harfe koyar);
 * açık tenvin ve iklâb/ihfâ işaretli tenvin kodlamaları tenvine çevrilir; şedde+hareke sırası eşitlenir. Ünsüz, hareke, şedde ya da sükûn farkı eşitsizliktir.
 *  - Kısa âyetler: Ezber Kilimi'nin sûre metni (src/data/ezber/metin, Diyanet kuran.diyanet.gov.tr) ile SIKI kipte, sûre:âyet eşlemesiyle (karar budur); Kur'an'ın tam metniyle (--kuran) aynı âyette
 *    gevşek karşılaştırma ayrıca `tamMetin` olarak kaydedilir (Diyanet ile Hafs çıktısının yazım biçimi her yerde eşlenemez: hemze üzerine uzatma vâvı gibi). Besmele maddesi Fâtiha 1 ile karşılaştırılır.
 *    Bakara 1–5'in depoda metin kaynağı yoktur: yalnız tam metne karşı (gevşek, 2:1–5) doğrulanır.
 *  - Tecvid örnekleri: «yazılışı» maddesi Kur'an'ın tam metninde (gevşek, ≥ 4 ünsüz) geçmelidir; yeri (sûre:âyet) kaydedilir. «okunuşu» maddesi (idğâm sonrası yazım) Kur'an'da
 *    olduğu gibi geçmez: eşinin harfleri ile en çok 3 harf farkla uyuşursa DOLAYLI kabul edilir (eş doğrulanmış olmalı; ses–metin eşi Diyanet'in kendi ders kaydındandır).
 *    Hurûf-ı mukattaa: yazılışı sûre başlangıçlarıyla, okunuşu harf adlarının açılımıyla karşılaştırılır. Doğrulanamayan, Arapça metni olmayan ya da metni Türkçe açıklama
 *    içeren madde ALINMAZ (neden docs/okuma-metin-dogrulama.json'da).
 * Tam Kur'an metni depo dışıdır (Ihtisas2027/data-prep/kaynak/kuran_arapca.json); sonuç kaydı depodadır, bekçi yalnız ses dosyalarını denetler.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { vurguAyir } from './okuma-uret.mjs';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TABAN = '/media/ses/okuma/yeni';
const KLASOR = ['egitim', 'public', ...TABAN.split('/').filter(Boolean)];
const KUNYE = 'docs/okuma-ses-kaynaklari-egitim.json';
const DOGRULAMA = 'docs/okuma-metin-dogrulama.json';
const YENI = 'src/data/okuma/yeni.json';
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const sha256 = (yol) => createHash('sha256').update(readFileSync(yol)).digest('hex');

/* ——— Kanonik biçim ——— */
export function kanon(s, { siki = false, kuran = false } = {}) {
  let o = '';
  let elif = false; // son harf elif/hemze taşıyıcısı mı (harekesi ve ardındaki hançer elif/«ي» karşılaştırılmaz)
  let elifKasra = false;
  let elifDamma = false;
  const harekeMi = (c) => c >= 'ً' && c <= 'ِ';
  const tenvinli = { 'َ': 'ً', 'ُ': 'ٌ', 'ِ': 'ٍ' };
  for (const c of s) {
    let x = c.codePointAt(0);
    if (x === 0x7b || x === 0x7d || x === 0x20 || x === 0xa0 || x === 0x200d || x === 0x200c || x === 0x640) continue;
    if (kuran) {
      if (x === 0x656) x = 0x64d; else if (x === 0x657) x = 0x64b; else if (x === 0x65e) x = 0x64c; // açık tenvin kodlamaları
      if ((x === 0x6e2 || x === 0x6ed) && tenvinli[o[o.length - 1]]) { o = o.slice(0, -1) + tenvinli[o[o.length - 1]]; continue; } // iklâb/ihfâ işaretli tenvin
    }
    if (x === 0x656 || x === 0x6ea) x = 0x650; // Diyanet'te alt hareke biçimi = esre
    if (x === 0x8f0) x = 0x64b; if (x === 0x8f1) x = 0x64c; if (x === 0x8f2) x = 0x64d;
    if (x >= 0x64b && x <= 0x650) { if (x === 0x64e && !siki) { if (elif) { elifKasra = false; elifDamma = false; } continue; } if (elif && x >= 0x64e) { elifKasra = x === 0x650; elifDamma = x === 0x64f; continue; } o += String.fromCodePoint(x); continue; } // elif/hemze taşıyıcısının kısa harekesi atılır, tenvin kalır
    if (x === 0x651) { if (!siki) continue; const son = o[o.length - 1]; o = harekeMi(son ?? '') ? o.slice(0, -1) + 'ّ' + son : o + 'ّ'; continue; } // şedde hareketen önce
    if (x === 0x652 || x === 0x6e1) { if (siki) o += 'ْ'; continue; }
    if (x === 0x670) { const p = o[o.length - 1]; if (siki && !elif && p && !harekeMi(p) && p !== 'ي' && p !== 'و' && p !== 'ّ' && p !== 'ْ') o += 'َ'; continue; }
    if (x === 0x653 || x === 0x654 || x === 0x655) continue;
    if (x === 0x627 || x === 0x623 || x === 0x625 || x === 0x622 || x === 0x621 || x === 0x674 || x === 0x671) { elif = true; elifKasra = false; elifDamma = false; continue; }
    if (x === 0x624) { elif = true; elifKasra = false; elifDamma = false; continue; } // «ؤ»: hemze taşıyıcısı
    if (x === 0x648 && elif && elifDamma) { elif = false; elifDamma = false; continue; } // «ُو» uzatma vâvı
    if (x === 0x626) { o += 'ي'; elif = true; elifKasra = false; elifDamma = false; continue; } // «ئ»: yâ + hemze taşıyıcısı (harekesi karşılaştırılmaz)
    if ((x === 0x64a || x === 0x649 || x === 0x6cc) && elif && elifKasra) { elif = false; elifKasra = false; continue; } // «ا۪ي»: uzatma yâsı
    elif = false; elifKasra = false; elifDamma = false;
    if (x === 0x626 || x === 0x649 || x === 0x6cc || x === 0x64a) { o += 'ي'; continue; }
    if (x === 0x6a9 || x === 0x643) { o += 'ك'; continue; }
    if ((x >= 0x621 && x <= 0x63a) || (x >= 0x641 && x <= 0x64a) || x === 0x629) o += String.fromCodePoint(x);
  }
  return o;
}
/** Yalnız harfler (bütün işaretler atılır; elif/yâ biçimleri katlanır). */
export const harfler = (s) => [...s].map((c) => {
  const x = c.codePointAt(0);
  if (x === 0x623 || x === 0x625 || x === 0x622 || x === 0x671) return 'ا';
  if (x === 0x649 || x === 0x6cc || x === 0x626) return 'ي';
  if (x === 0x6a9) return 'ك';
  return (x >= 0x621 && x <= 0x64a && x !== 0x640) ? c : '';
}).join('');
const sadeHarf = (s) => harfler(s).replace(/ء/g, '');
function uzaklik(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const ADLAR = { ا: 'الف', ل: 'لام', م: 'ميم', ص: 'صاد', ر: 'را', ك: 'كاف', ه: 'ها', ي: 'يا', ع: 'عين', ط: 'طا', س: 'سين', ح: 'حا', ق: 'قاف', ن: 'نون' };
const sadelestir = (s) => s.replace(/(.)\1+/g, '$1').replace(/ن/g, '');

/* ——— Ders eşlemesi ——— */
// ders anahtarı → [grup, tür]. tür: 'dogrudan' (Kur'an'da aynen geçer), 'cift' (yazılışı/okunuşu), 'hurufu'
const TECVID = {
  'zamir/uygulama': ['tv-zamir', 'dogrudan'],
  'ra-harfi/uygulama': ['tv-ra', 'dogrudan'],
  'idgami-bila-gunne/idgami-bila-gunne': ['tv-idgam-bila', 'cift'],
  'idgami-misleyn-bila-gunne/idgami-misleyn-bila-gunne': ['tv-idgam-misleyn', 'cift'],
  'idgami-mutekaribeyn-idgami-mütecaniseyn/idgami-mutekaribeyn': ['tv-idgam-mutekaribeyn', 'cift'],
  'idgami-mutekaribeyn-idgami-mütecaniseyn/idgami-mutecaniseyn': ['tv-idgam-mutecaniseyn', 'cift'],
  'meddi-tabii-muttasil-munfasil/meddi-muttasil': ['tv-med-muttasil', 'dogrudan'],
  'meddi-lazim-ariz-lin/meddi-lazim': ['tv-med-lazim', 'dogrudan'],
  'meddi-lazim-ariz-lin/uygulama': ['tv-med-lazim', 'dogrudan'],
  'hurufu-mukattaa/hurufu-mukattaa': ['tv-hurufu', 'hurufu'],
};
const TECVID_ELENEN = {
  'tenvinli-kelimelerden-gecis/tenvinli-kelimelerden-gecis': 'fonetik yeniden yazım (nûn-i kesre eklenmiş); Kur’an metniyle doğrulanamaz',
  'mushaflarda-yer-alan-isaretler/mushaflarda-yer-alan-isaretler': '«metin» Türkçe açıklama içeriyor (Arapça örnek değil)',
};
/** Kısa âyet dersleri (mushaf sırası). kaynak: Ezber metin dosyası ve âyet numarası kayması (âyet = sıra + kayma; besmele sıra 1). */
const AYETLER = [
  { ders: 'uygulama/bakara-suresi', s: 'bakara-1-5', sure: 2, kayma: -1, ezber: null },
  { ders: 'uygulama/ayetel-kursi', s: 's-ayetel-kursi', sure: 2, kayma: 253, ezber: 's-ayetel-kursi' },
  { ders: 'uygulama/bakara-suresi-285-286', s: 's-bakara-285-286', sure: 2, kayma: 283, ezber: 's-bakara-285-286' },
  { ders: 'uygulama/hasr-suresi', s: 's-hasr-22-24', sure: 59, kayma: 20, ezber: 's-hasr-22-24' },
  { ders: 'uygulama/fil-suresi', s: 's-fil', sure: 105, kayma: -1, ezber: 's-fil' },
  { ders: 'uygulama/kureys-suresi', s: 's-kureys', sure: 106, kayma: -1, ezber: 's-kureys' },
  { ders: 'uygulama/maun-suresi', s: 's-maun', sure: 107, kayma: -1, ezber: 's-maun' },
  { ders: 'uygulama/kevser-suresi', s: 's-kevser', sure: 108, kayma: -1, ezber: 's-kevser' },
  { ders: 'uygulama/kafirun-suresi', s: 's-kafirun', sure: 109, kayma: -1, ezber: 's-kafirun' },
  { ders: 'uygulama/nasr-suresi', s: 's-nasr', sure: 110, kayma: -1, ezber: 's-nasr' },
  { ders: 'uygulama/tebbet-suresi', s: 's-tebbet', sure: 111, kayma: -1, ezber: 's-tebbet' },
  { ders: 'uygulama/ihlas-suresi', s: 's-ihlas', sure: 112, kayma: -1, ezber: 's-ihlas' },
  { ders: 'uygulama/nas-suresi', s: 's-nas', sure: 114, kayma: -1, ezber: 's-nas' },
];

function dogrula(kaynakKlasoru, kuranYolu) {
  const k = json(`${kaynakKlasoru}/KAYNAK.json`);
  const q = json(kuranYolu);
  let akis = '';
  const yer = [];
  const ayetKanon = new Map(); // `${sure}:${ayet}` → gevşek kanon
  const sinir = new Set(); // kelime başı ve sonu olan akış konumları (eşleşme kelime sınırında başlayıp bitmeli: rastlantısal alt dize eşleşmesi engellenir)
  for (const s of q) for (const v of s.verses) {
    const c = kanon(v.text, { kuran: true });
    for (const m of v.text.matchAll(/\S+/g)) { // kelime sınırları, durumlu kanon() ile ÖNEKTEN ölçülür
      const bas = kanon(v.text.slice(0, m.index), { kuran: true }).length;
      const bit = kanon(v.text.slice(0, m.index + m[0].length), { kuran: true }).length;
      if (bit > bas) { sinir.add(akis.length + bas); sinir.add(`-${akis.length + bit}`); }
    }
    ayetKanon.set(`${s.id}:${v.id}`, c); for (let i = 0; i < c.length; i++) yer.push([s.id, v.id]); akis += c;
  }
  const bul = (c) => { for (let at = akis.indexOf(c); at >= 0; at = akis.indexOf(c, at + 1)) if (sinir.has(at) && sinir.has(`-${at + c.length}`)) return at; return -1; };
  // sûre başlangıçları: 1. âyet, 1.+2. âyet birleşik (Şûrâ «حم عسق») ve kısa 1. âyetten sonra 2. âyet
  const acilis = q.flatMap((s) => { const a = sadeHarf(s.verses[0].text); const b = s.verses[1] ? sadeHarf(s.verses[1].text) : ''; return [a, a + b, ...(a.length <= 3 ? [b] : [])]; });
  const sonuc = {};

  /* Tecvid */
  const tecvid = k.ogeler.filter((o) => o.parca === 'tecvid' && o.rol === 'oge');
  const dersSirasi = {};
  for (const o of tecvid) (dersSirasi[o.ders] ??= []).push(o);
  for (const [ders, liste] of Object.entries(dersSirasi)) {
    liste.sort((a, b) => a.sira - b.sira);
    const eslesme = TECVID[ders];
    const metinli = liste.filter((o) => o.ar);
    metinli.forEach((o, i) => {
      const kayit = { grup: eslesme?.[0] ?? null, ders, sira: o.sira };
      sonuc[o.yol] = kayit;
      if (TECVID_ELENEN[ders]) return Object.assign(kayit, { durum: 'elendi', neden: TECVID_ELENEN[ders] });
      if (!eslesme) return Object.assign(kayit, { durum: 'elendi', neden: 'ders eşlemesi yok' });
      const tur = eslesme[1];
      if (tur === 'dogrudan' || tur === 'cift') {
        const c = kanon(o.ar);
        const at = c.length >= 4 ? bul(c) : -1;
        if (at >= 0) {
          Object.assign(kayit, { durum: 'dogrulandi', yontem: 'tam-metin', sure: yer[at][0], ayet: yer[at][1], eslesen: akis.split(c).length - 1 });
          // «okunuşu» da (kelime başı kısalınca) Kur'an'da rastlantıyla geçebilir: eşiyle ≤ 3 harf farklıysa yine yazılışı/okunuşu çifti sayılır
          const onceki = i > 0 ? sonuc[metinli[i - 1].yol] : null;
          if (tur === 'cift' && onceki?.durum === 'dogrulandi' && !onceki.rol && !onceki.okunusEsi && uzaklik(sadeHarf(o.ar), sadeHarf(metinli[i - 1].ar)) <= 3) { onceki.rol = 'yazilis'; onceki.okunusEsi = o.yol; kayit.rol = 'okunus'; }
          return kayit;
        }
        if (tur === 'cift' && i > 0 && sonuc[metinli[i - 1].yol]?.durum === 'dogrulandi' && !sonuc[metinli[i - 1].yol].okunusEsi) {
          // «okunuşu»: idğâm sonrası yazım Kur'an'da olduğu gibi geçmez; hemen önceki (doğrulanmış, eşsiz) yazılışı ile ≤ 3 harf farkla uyuşmalı
          const fark = uzaklik(sadeHarf(o.ar), sadeHarf(metinli[i - 1].ar));
          if (fark <= 3) {
            const es = sonuc[metinli[i - 1].yol];
            es.okunusEsi = o.yol; es.rol = 'yazilis';
            return Object.assign(kayit, { durum: 'dolayli', yontem: 'es-farki', es: metinli[i - 1].yol, harfFarki: fark, sure: es.sure, ayet: es.ayet, rol: 'okunus' });
          }
          return Object.assign(kayit, { durum: 'elendi', neden: `Kur’an’da bulunamadı; eşinden ${fark} harf farklı` });
        }
        return Object.assign(kayit, { durum: 'elendi', neden: 'Kur’an metninde bulunamadı' });
      }
      /* hurufu: çift sıra (yazılışı, okunuşu) */
      if (i % 2 === 0) {
        const h = sadeHarf(o.ar);
        const var_ = h.length >= 1 && acilis.some((a) => a.startsWith(h));
        return Object.assign(kayit, var_ ? { durum: 'dogrulandi', yontem: 'sure-baslangici', rol: 'yazilis' } : { durum: 'elendi', neden: 'sûre başlangıçlarında yok', rol: 'yazilis' });
      }
      const es = sonuc[metinli[i - 1].yol];
      if (es?.durum !== 'dogrulandi') return Object.assign(kayit, { durum: 'elendi', neden: 'eşi (yazılışı) doğrulanamadı', rol: 'okunus' });
      const beklenen = [...sadeHarf(metinli[i - 1].ar)].map((c) => ADLAR[c] ?? '?').join('');
      const ok = sadelestir(sadeHarf(o.ar)) === sadelestir(beklenen);
      return Object.assign(kayit, ok ? { durum: 'dolayli', yontem: 'harf-adlari', es: metinli[i - 1].yol, rol: 'okunus' } : { durum: 'elendi', neden: 'harf adları açılımıyla uyuşmuyor', rol: 'okunus' });
    });
    for (const o of liste.filter((x) => !x.ar)) sonuc[o.yol] = { grup: eslesme?.[0] ?? null, ders, sira: o.sira, durum: 'elendi', neden: 'Arapça metin yok (yalnız ses)' };
  }

  /* Kısa âyetler */
  const fatiha1 = json(join(KOK, 'src/data/ezber/metin/s-fatiha.json')).bolumler.find((b) => b.no === 1).ar;
  for (const a of AYETLER) {
    const ezber = a.ezber ? json(join(KOK, `src/data/ezber/metin/${a.ezber}.json`)) : null;
    for (const o of k.ogeler.filter((x) => x.ders === a.ders).sort((x, y) => x.sira - y.sira)) {
      const kayit = { grup: a.s, ders: a.ders, sira: o.sira };
      sonuc[o.yol] = kayit;
      const besmele = o.sira === 1;
      const ayet = besmele ? 0 : o.sira + a.kayma;
      if (besmele) {
        const tamam = kanon(o.ar, { siki: true }) === kanon(fatiha1, { siki: true }) && ayetKanon.get('1:1') === kanon(o.ar, { kuran: false });
        Object.assign(kayit, tamam ? { durum: 'dogrulandi', yontem: 'ezber+tam-metin', sure: 1, ayet: 1, besmele: true } : { durum: 'elendi', neden: 'besmele metni Fâtiha 1 ile uyuşmuyor' });
        continue;
      }
      const ezberMetin = ezber?.bolumler.find((b) => b.no === ayet)?.ar ?? null;
      const ezberTamam = ezberMetin !== null && kanon(ezberMetin, { siki: true }) === kanon(o.ar, { siki: true });
      const tamTamam = ayetKanon.get(`${a.sure}:${ayet}`) === kanon(o.ar);
      if (a.ezber ? !ezberTamam : !tamTamam) Object.assign(kayit, { durum: 'elendi', neden: `âyet ${a.sure}:${ayet} metinle uyuşmuyor (ezber ${ezberTamam}, tam metin ${tamTamam})` });
      else Object.assign(kayit, { durum: 'dogrulandi', yontem: a.ezber ? 'ezber' : 'tam-metin', sure: a.sure, ayet, ...(a.ezber ? { tamMetin: tamTamam } : {}) });
    }
  }

  const sayi = { tecvid: { dogrulandi: 0, dolayli: 0, elendi: 0 }, ayet: { dogrulandi: 0, dolayli: 0, elendi: 0 } };
  for (const [yol, r] of Object.entries(sonuc)) sayi[AYETLER.some((a) => a.ders === r.ders) ? 'ayet' : 'tecvid'][r.durum]++;
  const cikti = {
    surum: 1,
    tarih: '2026-11-10',
    yontem: 'Betik başlığına bakın (scripts/okuma-ses-ekle.mjs). Tam Kur’an metni: Ihtisas2027 kuran_arapca.json (depo dışı); sûre metni: src/data/ezber/metin.',
    sayilar: sayi,
    ogeler: Object.fromEntries(Object.entries(sonuc).sort(([, a], [, b]) => (a.ders + String(a.sira).padStart(4, '0')).localeCompare(b.ders + String(b.sira).padStart(4, '0'))).map(([yol, r]) => [yol, Object.fromEntries(Object.entries(r).filter(([a]) => a !== 'ders'))])),
  };
  writeFileSync(join(KOK, DOGRULAMA), `${JSON.stringify(cikti, null, 1)}\n`);
  console.log(JSON.stringify(sayi));
}

function uret(kaynakKlasoru) {
  const k = json(`${kaynakKlasoru}/KAYNAK.json`);
  const dog = json(join(KOK, DOGRULAMA));
  const byYol = new Map(k.ogeler.map((o) => [o.yol, o]));
  const kunye = {};
  const al = (o) => {
    const hedefYol = `${TABAN}/${o.yol.replace(/^elifba\//, '')}`;
    const kaynak = join(kaynakKlasoru, o.yol);
    if (sha256(kaynak) !== o.sha256) throw new Error(`sha256 uyuşmuyor: ${o.yol}`);
    if (!/^https:\/\/(kuran|webdosya)\.diyanet\.gov\.tr\//.test(o.kaynakUrl)) throw new Error(`Diyanet adresi değil: ${o.kaynakUrl}`);
    const hedef = join(KOK, 'egitim', 'public', hedefYol);
    mkdirSync(dirname(hedef), { recursive: true });
    copyFileSync(kaynak, hedef);
    kunye[hedefYol] = { kaynak: o.kaynakUrl, sha256: o.sha256, bayt: statSync(hedef).size };
    return hedefYol;
  };
  const secili = (yol) => ['dogrulandi', 'dolayli'].includes(dog.ogeler[yol]?.durum);
  const tecvid = [];
  for (const [ders, [grup]] of Object.entries(TECVID)) {
    let g = tecvid.find((x) => x.grup === grup);
    if (!g) tecvid.push((g = { grup, ogeler: [] }));
    for (const o of k.ogeler.filter((x) => x.ders === ders && x.parca === 'tecvid' && x.rol === 'oge').sort((a, b) => a.sira - b.sira)) {
      if (!secili(o.yol)) continue;
      const { metin, v } = vurguAyir(o.ar);
      const rol = dog.ogeler[o.yol].rol;
      g.ogeler.push({ ar: metin, ...(v.length ? { v } : {}), ...(rol ? { e: rol === 'yazilis' ? 'yazilis' : 'okunus' } : {}), ses: al(o) });
    }
  }
  const ayetler = [];
  for (const a of AYETLER) {
    const ogeler = [];
    for (const o of k.ogeler.filter((x) => x.ders === a.ders).sort((x, y) => x.sira - y.sira)) {
      if (!secili(o.yol)) continue;
      const d = dog.ogeler[o.yol];
      ogeler.push({ ar: o.ar, s: a.s, ...(d.besmele ? { e: 'besmele' } : { n: d.ayet }), ses: al(o) });
    }
    if (ogeler.length) ayetler.push({ grup: a.s, ogeler });
  }
  const bos = tecvid.filter((g) => !g.ogeler.length);
  if (bos.length) throw new Error(`boş grup: ${bos.map((g) => g.grup)}`);
  const sirali = Object.fromEntries(Object.keys(kunye).sort().map((y) => [y, kunye[y]]));
  writeFileSync(join(KOK, YENI), `${JSON.stringify({ surum: 1, taban: TABAN, kaynak: 'Diyanet Elifbâ portalı (kuran.diyanet.gov.tr/elifba, webdosya.diyanet.gov.tr); doğrulama: docs/okuma-metin-dogrulama.json', tecvid, ayetler }, null, 1)}\n`);
  writeFileSync(join(KOK, KUNYE), `${JSON.stringify(sirali, null, 1)}\n`);
  console.log(`tecvid ${tecvid.reduce((t, g) => t + g.ogeler.length, 0)} madde, ayet ${ayetler.reduce((t, g) => t + g.ogeler.length, 0)} madde, ${Object.keys(sirali).length} dosya`);
}

/** Bekçi: künyedeki her ses egitim/public (ya da dist) altında var, bayt ve sha256 tutuyor; klasörde künyesiz dosya yok; yeni.json yalnız künyedeki sesleri kullanır. */
export function denetle({ kok = KOK, dist = false } = {}) {
  const klasor = join(kok, 'egitim', dist ? 'dist' : 'public', ...TABAN.split('/').filter(Boolean));
  const kunye = json(join(kok, KUNYE));
  const hatalar = [];
  for (const [yol, k] of Object.entries(kunye)) {
    const ad = join(kok, 'egitim', dist ? 'dist' : 'public', yol);
    if (!yol.startsWith(`${TABAN}/`)) hatalar.push(`${yol}: yol ${TABAN}/ altında değil`);
    else if (!existsSync(ad)) hatalar.push(`${yol}: dosya yok`);
    else if (statSync(ad).size !== k.bayt) hatalar.push(`${yol}: bayt tutmuyor`);
    else if (sha256(ad) !== k.sha256) hatalar.push(`${yol}: sha256 tutmuyor`);
  }
  const yeni = json(join(kok, YENI));
  for (const o of [...yeni.tecvid, ...yeni.ayetler].flatMap((g) => g.ogeler)) if (!kunye[o.ses]) hatalar.push(`${o.ses}: yeni.json'da var, künyede yok`);
  if (existsSync(klasor)) {
    const gez = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? gez(join(d, e.name)) : [join(d, e.name)]));
    for (const f of gez(klasor)) {
      const yol = `${TABAN}/${f.slice(klasor.length + 1).replace(/\\/g, '/')}`;
      if (!kunye[yol]) hatalar.push(`${yol}: künyede yok (yetim dosya)`);
    }
  }
  return hatalar;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = process.argv.slice(2);
  const deger = (ad, varsayilan) => (a.includes(ad) ? a[a.indexOf(ad) + 1] : varsayilan);
  const kaynak = deger('--kaynak', 'D:/tmp/ilim-yolu-okuma-ses');
  if (a.includes('--denetle')) {
    const hatalar = denetle({ dist: a.includes('--dist') });
    if (hatalar.length) {
      console.error(`Okuma ses denetimi BAŞARISIZ (${hatalar.length} sorun). Sesler git'te değildir; künye ile dosyalar tutmalı.\n${hatalar.slice(0, 12).map((h) => `- ${h}`).join('\n')}${hatalar.length > 12 ? `\n- … ve ${hatalar.length - 12} tane daha` : ''}\nGeri getirme: node scripts/okuma-ses-ekle.mjs --uret   (kaynak: D:\\tmp\\ilim-yolu-okuma-ses; ayrıntı docs/ILIM-YOLU.md «Okuma sesleri»)`);
      process.exit(1);
    }
    console.log(`Okuma ses denetimi tamam (${Object.keys(json(join(KOK, KUNYE))).length} dosya).`);
  } else if (a.includes('--dogrula')) dogrula(kaynak, deger('--kuran'));
  else if (a.includes('--uret')) uret(kaynak);
  else { console.error('Kullanım: --dogrula --kuran <yol> | --uret | --denetle [--dist]'); process.exit(2); }
}
