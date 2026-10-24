/**
 * Dua metinlerinin ikinci kaynakla harf iskeleti denetimi (Faz 2b, 24 Ekim 2026). Portal kayıtlarında harekeleme kusuru
 * ve basım hatası görülür (scripts/ezber-dua-tanim.mjs, `duzelt`). Bu yüzden her duanın harf iskeleti, aynı duayı
 * ayrıca yayımlayan başka bir Diyanet kitabıyla karşılaştırılır: tek bir harf düşse ya da eklense test yakalar.
 *
 * İkinci kaynaklar (hepsi Diyanet İşleri Başkanlığı yayını, yerel arşivde `D:\ihtisas\kaynaklar\diyanet-kitaplik`):
 *   Tecrid-i Sarih Tercemesi ve Şerhi (Kütüb-i Sitte)  — rükû, secde, Ettehiyyâtü; cenaze namazı bölümü: Sübhâneke, Salli, Bârik, Kunut
 *   İslam İlmihali, VIII. Namaz                        — ezan, ikamet, ezan duası
 *
 * Gevşek iskelet (ezber-iskelet.mjs): hareke ve işaretler, elif ve hemze atılır. Fikstür metni değil, yalnız iskeletin
 * SHA-256 özetinin ilk 16 hanesini taşır (yayın telifi: kitap metni depoya girmez).
 *
 *   node scripts/ezber-dua-iskelet.mjs --uret [arşiv-kökü]   fikstürü yeniden üretir (arşiv: D:/ihtisas/kaynaklar/diyanet-kitaplik)
 *   node scripts/ezber-dua-iskelet.mjs --goster [arşiv-kökü] ikinci kaynaktan çıkan harekeli aralıkları yazar (gözle denetim)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { iskelet, ozet } from './ezber-iskelet.mjs';

const KOK = 'D:/ihtisas/kaynaklar/diyanet-kitaplik';
const TS2 = 'hadis-ve-siyer/tecrid-i-sarih-2/011-kitabul-ezan.md';
const TS4 = 'hadis-ve-siyer/tecrid-i-sarih-4/038-raviler-rivayetler.md';
const IIL = 'ilmihal-fikih/islam-ilmihali/018-viii-namaz.md';
const KUNYE = {
  [TS2]: 'Tecrid-i Sarih Tercemesi ve Şerhi, 2. cilt, Kitâbü’l-Ezân (DİB)',
  [TS4]: 'Tecrid-i Sarih Tercemesi ve Şerhi, 4. cilt, Cenâiz (DİB)',
  [IIL]: 'İslam İlmihali, VIII. Namaz (DİB)',
};

/**
 * Karşılaştırma tablosu. `bolumler`: metin dosyasındaki bölüm numaraları (sırayla birleştirilir). `parcalar`: ikinci
 * kaynakta [baş, son] harf iskeleti çapaları (harekesiz) ve gerekirse `nth` (kaçıncı geçişten başlanacağı), `x` (kaç kez
 * tekrarlandığı). Kaynakta olmayan kısımlar (ör. portala özgü sabah bölümü) ayrı satır olarak kendi kaynağıyla yazılır.
 */
export const TABLO = [
  { id: 'd-subhaneke', bolumler: [1, 2, 3], dosya: TS4, not: 'cenaze namazındaki «ve celle senâüke» eklemesi hariç',
    parcalar: [{ bas: 'سبحانك اللهم وبحمدك', son: 'وتعالى جدك' }, { bas: 'ولا اله غيرك', son: 'ولا اله غيرك' }] },
  { id: 'd-ruku-tesbihi', bolumler: [1], dosya: TS2, parcalar: [{ bas: 'سبحان ربي العظيم', son: 'سبحان ربي العظيم' }] },
  { id: 'd-secde-tesbihi', bolumler: [1], dosya: TS2, parcalar: [{ bas: 'سبحان ربي الاعلى', son: 'سبحان ربي الاعلى' }] },
  { id: 'd-ettehiyyatu', bolumler: [1, 2, 3, 4, 5], dosya: TS2,
    parcalar: [{ bas: 'التحيات لله والصلوات والطيبات', son: 'عباد الله الصالحين' }, { bas: 'اشهد ان لا اله الا الله واشهد ان محمدا عبده', son: 'عبده ورسوله' }] },
  { id: 'd-salli', bolumler: [1, 2, 3], dosya: TS4, parcalar: [{ bas: 'اللهم صل على محمد وعلى ال محمد كما صليت', son: 'انك حميد مجيد' }] },
  { id: 'd-barik', bolumler: [1, 2, 3], dosya: TS4, parcalar: [{ bas: 'اللهم بارك على محمد وعلى ال محمد كما باركت', son: 'انك حميد مجيد' }] },
  { id: 'd-kunut-1', bolumler: [1, 2, 3, 4], dosya: TS4, parcalar: [{ bas: 'اللهم انا نستعينك', son: 'من يفجرك' }] },
  { id: 'd-kunut-2', bolumler: [1, 2, 3, 4], dosya: TS4, parcalar: [{ bas: 'اللهم اياك نعبد', son: 'بالكفار ملحق' }] },
  { id: 'd-ezan-duasi', bolumler: [1, 2, 3, 4], dosya: IIL, parcalar: [{ bas: 'اللهم رب هذه الدعوة التامة', son: 'لا تخلف الميعاد' }] },
  { id: 'd-kamet', bolumler: [1, 2, 3, 4, 5, 6, 7, 8], dosya: IIL,
    fark: 'İslam İlmihali’nde «kad kâmeti’s-salâh» ibaresi قَامَةِ (te yerine hâ) basılmıştır; portal قَامَتِ yazar ve Diyanet’in Türkçe okunuşu «kâmeti» der (Diyanet İlmihali I, s. 268).',
    parcalar: [{ bas: 'الله اكبر الله اكبر الله اكبر الله اكبر', son: 'لا اله الا الله', nth: 2, sonNth: 'son' }] },
  { id: 'd-ezan', bolumler: [1, 2, 3, 4, 5, 7, 8], dosya: IIL, not: 'portalda olmayan sabah bölümü ayrı satırda',
    parcalar: [{ bas: 'الله اكبر الله اكبر الله اكبر الله اكبر', son: 'لا اله الا الله', nth: 1, sonNth: 'son' }] },
  { id: 'd-ezan', bolumler: [6], dosya: IIL, not: 'sabah ezanı bölümü: kaynakta bir kez yazılır, «iki defa» denir',
    parcalar: [{ bas: 'الصلاة خير من النوم', son: 'الصلاة خير من النوم', x: 2 }] },
];

// Harf dizisi: Arapça harf dışı her şey (işaret, noktalama, satır sonu, Latin) tek boşluk; elif/yâ biçimleri eşlenir.
const ESLE = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ۀ': 'ه', 'ی': 'ي', 'ک': 'ك', 'ة': 'ه' };
const HARF = /[\u0621-\u064A\u0671\u06C0\u06CC\u06A9]/;
function bosluklu(t) {
  const k = []; const h = [];
  for (let i = 0; i < t.length; i++) {
    const c = ESLE[t[i]] ?? t[i];
    if (HARF.test(t[i])) { k.push(c); h.push(i); }
    else if (k.length && k[k.length - 1] !== ' ' && /[\s،.:;,()\-–—*]/.test(t[i])) { k.push(' '); h.push(i); }
  }
  return { k: k.join(''), h };
}

function aralik(t, { bas, son, nth = 1, sonNth }) {
  const { k, h } = bosluklu(t);
  const b = bosluklu(bas).k.trim();
  const e = bosluklu(son).k.trim();
  let p = -1;
  for (let i = 0; i < nth; i++) { p = k.indexOf(b, p + 1); if (p < 0) throw new Error(`«${bas}» ${nth}. kez bulunamadı`); }
  // Bitiş: başlangıçtan sonraki ilk geçiş; `sonNth: 'son'` bölümdeki bitişten sonraki ayrı bölüme taşmasın diye aynı bölüm sınırını (sonraki «####» başlığı) aşmaz.
  const bolumSonu = (() => { const i = t.indexOf('\n#', h[p]); return i < 0 ? t.length : i; })();
  let q = k.indexOf(e, p);
  if (q < 0) throw new Error(`«${son}» bulunamadı`);
  if (sonNth === 'son') { // bölüm içindeki SON geçiş
    let z = q;
    while (true) { const n = k.indexOf(e, z + 1); if (n < 0 || h[n] > bolumSonu) break; z = n; }
    q = z;
  }
  return t.slice(h[p], h[q + e.length - 1] + 1);
}

export function parcalariAl(kok, kayit) {
  const t = readFileSync(`${kok}/${kayit.dosya}`, 'utf8');
  return kayit.parcalar.map((p) => aralik(t, p).replace(/\s+/g, ' ').repeat(1)).map((s, i) => Array(kayit.parcalar[i].x ?? 1).fill(s).join(' ')).join(' ');
}

export const bolumIskeleti = (metin, nolar) => iskelet(nolar.map((n) => metin.bolumler.find((b) => b.no === n).ar).join(''));

function calis(kok, goster) {
  const kayitlar = []; let sorun = 0;
  for (const k of TABLO) {
    const harekeli = parcalariAl(kok, k);
    const metin = JSON.parse(readFileSync(`src/data/ezber/metin/${k.id}.json`, 'utf8'));
    const ikinci = iskelet(harekeli);
    const bizim = bolumIskeleti(metin, k.bolumler);
    if (goster) console.log(`## ${k.id} [${k.bolumler}] ← ${KUNYE[k.dosya]}\n${harekeli}`);
    const ayri = ikinci !== bizim;
    if (ayri && !k.fark) { sorun++; console.log(`FARK ${k.id} [${k.bolumler}]\n  ikinci kaynak: ${ikinci}\n  bizim metin:   ${bizim}`); }
    if (!ayri && k.fark) { sorun++; console.log(`${k.id}: fark kaydı artık gereksiz`); }
    kayitlar.push({
      id: k.id, bolumler: k.bolumler, kaynak: KUNYE[k.dosya], ...(k.not && { not: k.not }), iskelet: ozet(ikinci),
      // Bilinen fark: bizim iskeletin özeti de sabitlenir; fark yazılı gerekçesiz geçmez (Tanzil fikstürüyle aynı düzen).
      ...(ayri && k.fark && { bizim: ozet(bizim), fark: k.fark }),
    });
  }
  return { kayitlar, sorun };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mod = process.argv[2];
  const kok = process.argv[3] ?? KOK;
  if (!['--uret', '--goster'].includes(mod) || !existsSync(kok)) { console.error('Kullanım: node scripts/ezber-dua-iskelet.mjs --uret|--goster [arşiv-kökü]'); process.exit(2); }
  const { kayitlar, sorun } = calis(kok, mod === '--goster');
  if (mod === '--uret') {
    if (sorun) { console.error(`${sorun} fark var; fikstür yazılmadı.`); process.exit(1); }
    writeFileSync('tests/fixtures/ezber-dua-ikinci-kaynak.json', JSON.stringify({
      kunye: 'Diyanet İşleri Başkanlığı yayınları (Tecrid-i Sarih, İslam İlmihali) — yalnız gevşek iskeletlerin SHA-256 özetinin ilk 16 hanesi; metnin kendisi yok.',
      uretim: 'node scripts/ezber-dua-iskelet.mjs --uret [arşiv-kökü]',
      kayitlar,
    }, null, 1) + '\n');
    console.log(`${kayitlar.length} kayıt yazıldı.`);
  } else console.log(sorun ? `${sorun} fark` : 'fark yok');
}
