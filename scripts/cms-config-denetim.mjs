/**
 * İçerik yönetimi (Sveltia CMS) yapılandırma denetimi — public/admin/icerik/config.yml
 *
 * Neden var: 4 Eylül 2026'da config.yml'ye iki alan yanlış girintiyle eklendi, YAML çözümlenemedi ve
 * içerik yönetimi bir gün boyunca «CMS yapılandırmasında bir hata var» diyerek açılmadı. Site derlemesi
 * bu dosyayı okumadığı için hiçbir denetim yakalamadı. Bu betik yayın öncesi (deploy.yml) ve
 * `npm run denetim` içinde koşar; kritik bulguda hata koduyla çıkar.
 *
 * Kontroller:
 *   1. YAML çözümlenebiliyor mu (kritik)
 *   2. backend / media_folder / collections var mı (kritik)
 *   3. Her koleksiyonun folder'ı ya da files[].file yolu depoda var mı (kritik)
 *   4. Koleksiyon ve alan adları tekrarsız mı (kritik)
 *   5. İçerik dosyalarındaki ön madde anahtarları CMS alanlarında tanımlı mı (uyarı: CMS o alanı
 *      göstermez; kaydetme sırasında düşürebilir)
 *   6. Sveltia'nın KENDİ JSON şemasıyla doğrulama (kritik): Sveltia 0.202'den beri yapılandırmayı
 *      çalışma anında bu şemayla doğrular, geçmezse CMS açılmaz. Şema, index.html'de sabitlenen
 *      sürümle aynı olmalı: scripts/sveltia-cms-<sürüm>.schema.json
 *      (kaynak: https://unpkg.com/@sveltia/cms@<sürüm>/schema/sveltia-cms.json). Sürüm yükseltilince
 *      şema da indirilir; yoksa betik bunu kritik bulgu olarak bildirir.
 *
 * Kullanım: node scripts/cms-config-denetim.mjs [--ayrinti] [başka-config.yml]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { Validator } from '@cfworker/json-schema';   // Sveltia'nın çalışma anında kullandığı motorun aynısı

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const ozelYol = process.argv.slice(2).find((a) => !a.startsWith('--'));
const YOL = ozelYol || join(KOK, 'public', 'admin', 'icerik', 'config.yml');
const AYRINTI = process.argv.includes('--ayrinti');
const kritik = [], uyari = [];

let cfg;
try {
  cfg = parse(readFileSync(YOL, 'utf8'));
} catch (e) {
  console.error(`KRİTİK: config.yml çözümlenemedi — ${e.message.split('\n')[0]}`);
  process.exit(1);
}
if (!cfg || typeof cfg !== 'object') { console.error('KRİTİK: config.yml boş'); process.exit(1); }
if (!cfg.backend || !cfg.backend.name) kritik.push('backend.name yok');
if (!cfg.media_folder) kritik.push('media_folder yok');
else if (!existsSync(join(KOK, cfg.media_folder))) kritik.push(`media_folder depoda yok: ${cfg.media_folder}`);
if (!Array.isArray(cfg.collections) || !cfg.collections.length) kritik.push('collections boş');

/* Ön madde anahtarlarını (--- … --- arası, en üst düzey) kaba ama yeterli biçimde çıkarır. */
const onMaddeAnahtarlari = (metin) => {
  const m = metin.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return [];
  return m[1].split(/\r?\n/).filter((s) => /^[A-Za-z_][\w-]*\s*:/.test(s)).map((s) => s.split(':')[0].trim());
};
const alanAdlari = (fields) => (fields || []).map((f) => f.name);
const dosyalar = (dizin) => readdirSync(dizin).flatMap((ad) => {
  const tam = join(dizin, ad);
  return statSync(tam).isDirectory() ? dosyalar(tam) : (/\.(md|mdx|yaml|yml|json)$/.test(ad) ? [tam] : []);
});

const gorulenKoleksiyon = new Set();
for (const k of cfg.collections || []) {
  if (!k.name) { kritik.push('adsız koleksiyon'); continue; }
  if (gorulenKoleksiyon.has(k.name)) kritik.push(`koleksiyon adı tekrar: ${k.name}`);
  gorulenKoleksiyon.add(k.name);
  const alanKontrol = (fields, etiket) => {
    const adlar = alanAdlari(fields);
    const tekrar = adlar.filter((a, i) => adlar.indexOf(a) !== i);
    if (tekrar.length) kritik.push(`${etiket}: alan adı tekrar — ${[...new Set(tekrar)].join(', ')}`);
    for (const f of fields || []) {
      if (!f.widget && !f.fields) uyari.push(`${etiket}.${f.name}: widget belirtilmemiş`);
      /* Sveltia 0.202+ yapılandırmayı çalışma anında doğrular; Netlify/Decap'ten kalma «date» widget'ı
         desteklenmez ve CMS'i açılmaz hâle getirir (5 Eyl 2026'da yaşandı) → datetime + type: date. */
      if (f.widget === 'date') kritik.push(`${etiket}.${f.name}: «widget: date» Sveltia'da yok — «widget: datetime, type: date» kullan`);
      if (f.fields) alanKontrol(f.fields, `${etiket}.${f.name}`);   // iç içe nesne/liste alanları
    }
  };
  if (k.folder) {
    const dizin = join(KOK, k.folder);
    if (!existsSync(dizin)) { kritik.push(`${k.name}: folder depoda yok — ${k.folder}`); continue; }
    alanKontrol(k.fields, k.name);
    const tanimli = new Set(alanAdlari(k.fields));
    const eksik = new Map();
    for (const d of dosyalar(dizin)) {
      for (const a of onMaddeAnahtarlari(readFileSync(d, 'utf8'))) if (!tanimli.has(a)) eksik.set(a, (eksik.get(a) || 0) + 1);
    }
    for (const [a, n] of eksik) uyari.push(`${k.name}: içerikte «${a}» anahtarı var ama CMS alanı yok (${n} dosya)`);
  } else if (Array.isArray(k.files)) {
    for (const f of k.files) {
      if (!f.file) { kritik.push(`${k.name}: file yolu yok`); continue; }
      if (!existsSync(join(KOK, f.file))) { kritik.push(`${k.name}/${f.name}: dosya depoda yok — ${f.file}`); continue; }
      alanKontrol(f.fields, `${k.name}/${f.name}`);
      if (/\.ya?ml$/.test(f.file)) {
        const veri = parse(readFileSync(join(KOK, f.file), 'utf8')) || {};
        const tanimli = new Set(alanAdlari(f.fields));
        for (const a of Object.keys(veri)) if (!tanimli.has(a)) uyari.push(`${k.name}/${f.name}: dosyada «${a}» anahtarı var ama CMS alanı yok`);
      }
    }
  } else kritik.push(`${k.name}: ne folder ne files`);
}

/* 6) Sveltia'nın kendi şeması */
const indexHtml = readFileSync(join(KOK, 'public', 'admin', 'icerik', 'index.html'), 'utf8');
const surum = (indexHtml.match(/@sveltia\/cms@(\d+\.\d+\.\d+)\//) || [])[1];
const semaYolu = surum && join(KOK, 'scripts', `sveltia-cms-${surum}.schema.json`);
if (!surum) kritik.push('icerik/index.html içinde sabitlenmiş Sveltia sürümü bulunamadı (@sveltia/cms@X.Y.Z)');
else if (!existsSync(semaYolu)) kritik.push(`Sveltia ${surum} şeması yok — indir: curl -sL https://unpkg.com/@sveltia/cms@${surum}/schema/sveltia-cms.json -o scripts/sveltia-cms-${surum}.schema.json`);
else {
  /* Şema, alan türlerini «widget» değerine göre ayrılan bir anyOf birliğiyle tanımlar. Bütün belgeyi tek
     seferde doğrulamak her yanlış için onlarca dal hatası üretir (yanlış dalların hataları). Bunun yerine
     düğüm düğüm ilerlenir: her alan yalnız kendi widget'ının tanımıyla, alt alanlar yer tutucuyla değiştirilerek
     doğrulanır; sonra alt alanlara inilir. Böylece «vefat/foto: beklenmeyen anahtar “aile izniyle)”» gibi
     tam yerinde bulgular çıkar. */
  const sema = JSON.parse(readFileSync(semaYolu, 'utf8'));
  const TANIM = sema.definitions;
  const YER = { name: 'yer', widget: 'string' };
  const dogrulayicilar = new Map();
  const dogrula = (tanim, veri) => {
    if (!dogrulayicilar.has(tanim)) dogrulayicilar.set(tanim, new Validator({ $ref: `#/definitions/${tanim}`, definitions: TANIM }, '7', false));
    return dogrulayicilar.get(tanim).validate(veri);
  };
  /* widget adı → aday tanımlar (list: 4 tanım, object: 2 tanım, ötekiler 1) */
  const ADAY = new Map();
  for (const [ad, t] of Object.entries(TANIM)) {
    const w = t.properties?.widget;
    if (!w) continue;
    for (const isim of w.const ? [w.const] : (w.enum || [])) ADAY.set(isim, [...(ADAY.get(isim) || []), ad]);
  }
  const DAL_GURULTUSU = new Set(['anyOf', 'oneOf', 'allOf', 'items', 'properties', '$ref', 'if', 'then', 'else']);
  /* cfworker, izinsiz anahtarı iki satırla bildirir: üst nesnede «additionalProperties» + anahtarın kendisinde
     «False boolean schema». Anahtarı adıyla söyleyen ikincisi tutulur. */
  const yaprakHatalar = (sonuc) => sonuc.errors
    .filter((e) => !DAL_GURULTUSU.has(e.keyword) && e.keyword !== 'additionalProperties')
    .map((e) => {
      const yer = decodeURIComponent(e.instanceLocation.replace(/^#\/?/, ''));
      if (/False boolean schema/.test(e.error)) return `beklenmeyen anahtar «${yer.split('/').pop()}» — bilinmeyen seçenek ya da virgülde bölünmüş etiket (etiketi tırnakla) ya da yanlış yerde (ör. transformations → config altına)`;
      if (e.keyword === 'required') return `zorunlu alan eksik: ${e.error.replace(/^Instance does not have required property /, '')}`;
      if (e.keyword === 'const' || e.keyword === 'enum') return `${yer || 'değer'}: ${e.error}`;
      return `${yer ? yer + ': ' : ''}${e.error}`;
    });
  const enIyi = (adaylar, veri) => {
    let iyi = null;
    for (const ad of adaylar) {
      const s = dogrula(ad, veri);
      if (s.valid) return null;
      const h = yaprakHatalar(s);
      if (!iyi || h.length < iyi.length) iyi = h;
    }
    return iyi && iyi.length ? [...new Set(iyi)] : ['tanıma uymuyor'];
  };
  const alanDogrula = (f, yol) => {
    if (!f || typeof f !== 'object') { kritik.push(`şema: ${yol} alan nesne değil`); return; }
    const widget = f.widget || 'string';
    const kopya = { ...f };
    if (Array.isArray(kopya.fields)) kopya.fields = [YER];
    if (kopya.field && typeof kopya.field === 'object') kopya.field = YER;
    if (Array.isArray(kopya.types)) kopya.types = [{ name: 'yer', label: 'yer', widget: 'object', fields: [YER] }];
    const adaylar = ADAY.get(widget) || ['CustomField'];
    const hatalar = enIyi(adaylar, kopya);
    if (hatalar) for (const h of hatalar) kritik.push(`şema (Sveltia ${surum}) ${yol} [${widget}]: ${h}`);
    for (const [i, alt] of (Array.isArray(f.fields) ? f.fields : []).entries()) alanDogrula(alt, `${yol}.${alt?.name || i}`);
    if (f.field && typeof f.field === 'object') alanDogrula(f.field, `${yol}.${f.field.name || 'field'}`);
    for (const t of Array.isArray(f.types) ? f.types : []) for (const [i, alt] of (t.fields || []).entries()) alanDogrula(alt, `${yol}[${t.name}].${alt?.name || i}`);
  };
  /* kök: koleksiyonlar yer tutucuyla */
  {
    const kok = { ...cfg, collections: [{ name: 'yer', label: 'yer', folder: 'yer', fields: [YER] }] };
    const h = enIyi(['CmsConfig'], kok);
    if (h) for (const x of h) kritik.push(`şema (Sveltia ${surum}) kök: ${x}`);
  }
  for (const [i, k] of (cfg.collections || []).entries()) {
    const yol = k?.name || `collections[${i}]`;
    if (k?.divider) { const h = enIyi(['CollectionDivider'], k); if (h) for (const x of h) kritik.push(`şema ${yol}: ${x}`); continue; }
    if (Array.isArray(k?.files)) {
      const h = enIyi(['FileCollection'], { ...k, files: [{ name: 'yer', label: 'yer', file: 'yer.yaml', fields: [YER] }] });
      if (h) for (const x of h) kritik.push(`şema (Sveltia ${surum}) ${yol}: ${x}`);
      for (const [j, f] of k.files.entries()) {
        const fy = `${yol}/${f?.name || j}`;
        const hf = enIyi(['CollectionFile'], { ...f, fields: [YER] });
        if (hf) for (const x of hf) kritik.push(`şema (Sveltia ${surum}) ${fy}: ${x}`);
        for (const [m, alt] of (f?.fields || []).entries()) alanDogrula(alt, `${fy}.${alt?.name || m}`);
      }
      continue;
    }
    const h = enIyi(['EntryCollection'], { ...k, fields: [YER] });
    if (h) for (const x of h) kritik.push(`şema (Sveltia ${surum}) ${yol}: ${x}`);
    for (const [m, alt] of (k?.fields || []).entries()) alanDogrula(alt, `${yol}.${alt?.name || m}`);
  }
}

if (AYRINTI || uyari.length) for (const u of uyari) console.log('uyarı:', u);
for (const k of kritik) console.error('KRİTİK:', k);
console.log(`CMS yapılandırması: ${cfg.collections?.length ?? 0} koleksiyon, ${kritik.length} kritik, ${uyari.length} uyarı`);
process.exit(kritik.length ? 1 : 0);
