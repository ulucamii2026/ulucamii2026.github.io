/** Şahit imzasını SVG'den sürüm 2 vektör kaydına çevirir ve (istenirse) dernek Google hesabındaki ÖZEL depoya yükler.
 *
 *  23 Ekim 2026 (Rıdvan KAYAHAN): Ulu Camii Marche şahitleri «Rıdvan KAYAHAN» ve «Ercan MOLA»nın imzası ihtida paketine
 *  kendiliğinden basılır. İmzalar herkese açık depoya, public/ klasörüne ya da GAS paketine ASLA girmez; bu betik imzayı
 *  yalnız bellekte işler ve panel anahtarıyla Apps Script'e (tur: "sahit-imza-yukle") gönderir. Çıktıda imza metni ve anahtar
 *  yazdırılmaz; yalnız boyut, nokta sayısı ve kayıt sonucu.
 *
 *  Kullanım:
 *    node scripts/sahit-imza-hazirla.mjs --ad ridvan --svg C:/…/imza.svg            (kuru: dönüştürür, boyutu yazar)
 *    node scripts/sahit-imza-hazirla.mjs --ad ercan  --svg C:/…/imza.svg --yukle     (yükler, geri okuyup karşılaştırır)
 *    node scripts/sahit-imza-hazirla.mjs --ad ercan --kaldir --yukle                 (kaydı siler)
 *  Seçenekler: --tolerans 0.04 (kalem çizgisini sadeleştirme, kaynak birimi), --cikti <json> (yalnız yerel deneme için, geçici
 *  klasöre yaz ve işin sonunda sil), --anahtar-dosya D:/tmp/panel_paket.json (alan: gas).
 *
 *  Desteklenen SVG: tek ya da çok <path>; M L H V C Z (mutlak); isteğe bağlı transform="matrix(a,b,c,d,e,f)".
 *  fill:none + stroke → kalem çizgisi (Bézier düzleştirilip sadeleştirilir); aksi hâlde dolgulu kontur (fill-rule korunur).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { sahitImzaCoz } from '../public/admin/imza-ciz.js';

const sayi = n => String(Math.round(n * 100) / 100).replace(/^-0$/, '0');

function nitelikler(etiket) {
  const sonuc = {};
  for (const [, ad, deger] of etiket.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) sonuc[ad] = deger;
  return sonuc;
}

function matris(metin) {
  if (!metin) return [1, 0, 0, 1, 0, 0];
  const m = metin.match(/^\s*matrix\(([^)]*)\)\s*$/);
  if (!m) throw new Error('Yalnız matrix(a,b,c,d,e,f) dönüşümü desteklenir: ' + metin);
  const s = m[1].split(/[\s,]+/).filter(Boolean).map(Number);
  if (s.length !== 6 || s.some(n => !Number.isFinite(n))) throw new Error('Geçersiz matrix: ' + metin);
  return s;
}

/** Mutlak M L H V C Z yolunu {c, n} komut listesine açar (H/V → L, örtük yinelemeler açılır). */
function yolAyristir(d) {
  const ops = [];
  let x = 0, y = 0;
  for (const [, komut, govde] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    if (!'MLHVCZ'.includes(komut)) throw new Error(`Desteklenmeyen yol komutu «${komut}» (yalnız mutlak M L H V C Z).`);
    const n = (govde.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
    if (komut === 'Z') { ops.push({ c: 'Z', n: [] }); continue; }
    const adim = { M: 2, L: 2, H: 1, V: 1, C: 6 }[komut];
    if (!n.length || n.length % adim) throw new Error(`«${komut}» komutunun sayı sayısı geçersiz.`);
    for (let i = 0; i < n.length; i += adim) {
      const p = n.slice(i, i + adim);
      if (komut === 'M') { ops.push({ c: i === 0 ? 'M' : 'L', n: p }); x = p[0]; y = p[1]; }
      else if (komut === 'L') { ops.push({ c: 'L', n: p }); x = p[0]; y = p[1]; }
      else if (komut === 'H') { ops.push({ c: 'L', n: [p[0], y] }); x = p[0]; }
      else if (komut === 'V') { ops.push({ c: 'L', n: [x, p[0]] }); y = p[0]; }
      else { ops.push({ c: 'C', n: p }); x = p[4]; y = p[5]; }
    }
  }
  return ops;
}

const donustur = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/** Douglas–Peucker (yinelemesiz): büyük imzalarda yığın taşmaz. */
function sadelestir(nokta, tolerans) {
  if (nokta.length < 3) return nokta;
  const tut = new Uint8Array(nokta.length);
  tut[0] = tut[nokta.length - 1] = 1;
  const yigin = [[0, nokta.length - 1]];
  while (yigin.length) {
    const [a, b] = yigin.pop();
    const [ax, ay] = nokta[a], [bx, by] = nokta[b];
    const dx = bx - ax, dy = by - ay, uz = Math.hypot(dx, dy);
    let en = -1, ek = 0;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = nokta[i];
      const uzaklik = uz ? Math.abs(dy * (px - ax) - dx * (py - ay)) / uz : Math.hypot(px - ax, py - ay);
      if (uzaklik > ek) { ek = uzaklik; en = i; }
    }
    if (en >= 0 && ek > tolerans) { tut[en] = 1; yigin.push([a, en], [en, b]); }
  }
  return nokta.filter((_, i) => tut[i]);
}

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
}

/** Kalem çizgisi: her alt yolu çok noktalı çizgiye açar, sadeleştirir. Dönüş: "M x y L x y …" */
function cizgiYolu(ops, m, tolerans) {
  const parcalar = [];
  let simdiki = null, mevcut = null;
  const bitir = () => { if (mevcut && mevcut.length) parcalar.push(sadelestir(mevcut, tolerans)); mevcut = null; };
  for (const { c, n } of ops) {
    if (c === 'M') { bitir(); simdiki = donustur(m, n[0], n[1]); mevcut = [simdiki]; }
    else if (c === 'L') { simdiki = donustur(m, n[0], n[1]); (mevcut ||= [simdiki]).push(simdiki); }
    else if (c === 'C') {
      const [p1, p2, p3] = [0, 2, 4].map(i => donustur(m, n[i], n[i + 1]));
      const uzunluk = Math.hypot(p1[0] - simdiki[0], p1[1] - simdiki[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
      const adim = Math.max(2, Math.ceil(uzunluk / 0.25));
      const p0 = simdiki;
      for (let i = 1; i <= adim; i++) (mevcut ||= [p0]).push(bezier(p0, p1, p2, p3, i / adim));
      simdiki = p3;
    } else if (c === 'Z' && mevcut && mevcut.length) mevcut.push(mevcut[0]);
  }
  bitir();
  return parcalar.map(p => 'M' + p.map(([x, y], i) => (i ? 'L' : '') + sayi(x) + ' ' + sayi(y)).join('')).join('');
}

/** Dolgulu kontur: komutlar korunur (Bézier dahil), yalnız dönüşüm uygulanır ve yuvarlanır. */
function dolguYolu(ops, m) {
  return ops.map(({ c, n }) => {
    if (c === 'Z') return 'Z';
    const nokta = [];
    for (let i = 0; i < n.length; i += 2) nokta.push(...donustur(m, n[i], n[i + 1]).map(sayi));
    return c + nokta.join(' ');
  }).join('');
}

/** SVG metnini sürüm 2 kayda çevirir: {v:2, w, h, p:[…]}. Doğrulama sahitImzaCoz ile yapılır. */
export function svgyiDonustur(svg, { tolerans = 0.04 } = {}) {
  const kok = nitelikler((svg.match(/<svg\b[^>]*>/) || [''])[0]);
  const kutu = (kok.viewBox || '').split(/[\s,]+/).map(Number);
  const w = kutu.length === 4 ? kutu[2] : parseFloat(kok.width), h = kutu.length === 4 ? kutu[3] : parseFloat(kok.height);
  if (!(w > 0 && h > 0)) throw new Error('SVG boyutu (viewBox ya da width/height) okunamadı.');
  const yollar = [];
  for (const [etiket] of svg.matchAll(/<path\b[^>]*>/g)) {
    const a = nitelikler(etiket);
    if (!a.d) continue;
    const m = matris(a.transform), olcek = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
    const ops = yolAyristir(a.d);
    const cizgi = (a.fill || '').toLowerCase() === 'none' && a.stroke && a.stroke.toLowerCase() !== 'none';
    if (cizgi) {
      const k = Number(a['stroke-width'] || 1) * olcek;
      yollar.push({ d: cizgiYolu(ops, m, tolerans), k: Math.round(k * 1000) / 1000 });
    } else {
      yollar.push({ d: dolguYolu(ops, m), f: 1, ...((a['fill-rule'] || '').toLowerCase() === 'evenodd' ? { e: 1 } : {}) });
    }
  }
  if (!yollar.length) throw new Error('SVG içinde <path> bulunamadı.');
  const kayit = { v: 2, w: Math.round(w * 1000) / 1000, h: Math.round(h * 1000) / 1000, p: yollar };
  if (!sahitImzaCoz(kayit)) throw new Error('Üretilen kayıt doğrulamadan geçmedi (boyut ya da komut sınırı).');
  return kayit;
}

// ---- komut satırı ----------------------------------------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

async function main() {
  const arg = (ad, varsayilan) => { const i = process.argv.indexOf('--' + ad); return i < 0 ? varsayilan : process.argv[i + 1]; };
  const var_ = ad => process.argv.includes('--' + ad);
  const ad = arg('ad');
  if (!['ridvan', 'ercan'].includes(ad)) throw new Error('--ad ridvan ya da ercan olmalı.');
  let imza = '';
  if (!var_('kaldir')) {
    const yol = arg('svg');
    if (!yol) throw new Error('--svg <dosya> gerekli (ya da --kaldir).');
    const kayit = svgyiDonustur(readFileSync(yol, 'utf8'), { tolerans: Number(arg('tolerans', 0.04)) });
    imza = JSON.stringify(kayit);
    const nokta = kayit.p.reduce((t, p) => t + (p.d.match(/[ML]/g) || []).length + (p.d.match(/C/g) || []).length * 3, 0);
    console.log(`${ad}: ${kayit.p.length} yol, ~${nokta} nokta, ${imza.length} karakter, kutu ${kayit.w}×${kayit.h}, ${kayit.p.map(p => (p.f ? 'dolgu' : 'çizgi k=' + p.k)).join('/')}`);
    if (arg('cikti')) { writeFileSync(arg('cikti'), imza); console.log('Yerel deneme çıktısı yazıldı (işin sonunda silin).'); }
  }
  if (!var_('yukle')) { console.log('Kuru çalıştırma: yüklenmedi.'); return; }

  const gas = (readFileSync(new URL('../public/admin/panel.js', import.meta.url), 'utf8').match(/const GAS = '([^']+)'/) || [])[1];
  if (!gas) throw new Error('GAS adresi panel.js içinde bulunamadı.');
  const anahtar = JSON.parse(readFileSync(arg('anahtar-dosya', 'D:/tmp/panel_paket.json'), 'utf8')).gas;
  if (!anahtar) throw new Error('Panel anahtarı okunamadı.');
  const r = await fetch(gas, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tur: 'sahit-imza-yukle', anahtar, ad, imza }) });
  const yanit = JSON.parse(await r.text());
  console.log('Yükleme:', JSON.stringify({ ok: yanit.ok, hata: yanit.hata, ad: yanit.ad, kayitli: yanit.kayitli, kayitliSahitler: yanit.kayitliSahitler }));
  if (!yanit.ok) process.exitCode = 1;
  else {
    // Geri okuma: depoda tutulan metin yerel metinle birebir aynı mı (yalnız özet yazdırılır).
    const g = await fetch(`${gas}?${new URLSearchParams({ islem: 'sahit-imzalari', anahtar })}`, { redirect: 'follow' });
    const depo = JSON.parse(await g.text());
    const ozet = s => createHash('sha256').update(s || '').digest('hex').slice(0, 16);
    const esit = (depo.imzalar?.[ad] || '') === imza;
    console.log(`Geri okuma: ${depo.ok ? 'ok' : depo.hata}; depo ${ozet(depo.imzalar?.[ad])} / yerel ${ozet(imza)} → ${esit ? 'AYNI' : 'FARKLI'}`);
    if (!esit) process.exitCode = 1;
  }
}
