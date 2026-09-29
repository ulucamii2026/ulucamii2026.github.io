import test from 'node:test';
import assert from 'node:assert/strict';
import { tazele, akisTazele, vakitGecerli, akisGecerli, icerikGecerli, sonrakiTazelemeMs, AKIS_ARALIGI_MS, duyuruAnahtari } from '../src/ekran/veri.ts';
import { VAKIT_ADLARI } from '../src/ekran/metinler.ts';
import { ui } from '../src/i18n/ui.ts';
import { SIRA } from '../src/lib/namaz.ts';

const VAKIT = { kaynakTuru: 'diyanet', ilce: '11890', gunler: [{ tarih: '2026-09-27' }] };
const AKIS = { duyurular: [], ayar: { slayt: { tabanSn: 8 } } };
const ICERIK = { ayetler: [], hadisler: [] };

test('Diyanet dışı ya da bozuk akış kabul edilmez', () => {
  assert.equal(vakitGecerli({ ...VAKIT, kaynakTuru: 'aladhan' }), false);
  assert.equal(vakitGecerli({ ...VAKIT, ilce: '9541' }), false);
  assert.equal(vakitGecerli({ ...VAKIT, gunler: [] }), false);
  assert.equal(vakitGecerli(VAKIT), true);
  assert.equal(akisGecerli({ duyurular: [] }), false);
  assert.equal(akisGecerli(AKIS), true);
  assert.equal(icerikGecerli(null), false);
  assert.equal(icerikGecerli(ICERIK), true);
});

test('ağ hatası, 500 ve bozuk JSON son sağlam veriyi silmez', async () => {
  const v = { vakit: VAKIT, akis: AKIS, icerik: ICERIK };
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => {
    if (yol.endsWith('vakitler.json')) throw new TypeError('ağ yok');
    if (yol.endsWith('akis.json')) return new Response('sunucu hatası', { status: 500 });
    return new Response('{bozuk', { status: 200 });
  };
  try {
    await tazele(v);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});

test('donmuş istek zaman aşımıyla kesilir; son sağlam veri korunur', async () => {
  const v = { vakit: VAKIT, akis: AKIS, icerik: ICERIK };
  const eski = globalThis.fetch;
  // Gerçek fetch hiç yanıt vermez; yalnız AbortController sinyali tetiklenirse reddeder.
  // Eski uygulama fetch'e signal geçirmediği için bu istek sonsuza dek asılı kalır.
  globalThis.fetch = (_yol, secenek) => new Promise((_coz, red) => {
    secenek?.signal?.addEventListener('abort', () => red(new Error('zaman aşımı')));
  });
  try {
    await tazele(v, 50);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});

test('geçerli yanıt eski verinin yerine geçer', async () => {
  const v = { vakit: null, akis: null, icerik: null };
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => Response.json(yol.endsWith('vakitler.json') ? VAKIT : yol.endsWith('akis.json') ? AKIS : ICERIK);
  try {
    await tazele(v);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});

test('sonrakiTazelemeMs: herhangi bir akış eksikse hızlı yeniden dener, hepsi doluysa normal aralık', () => {
  assert.equal(sonrakiTazelemeMs({ vakit: null, akis: null, icerik: null }), 60_000);
  assert.equal(sonrakiTazelemeMs({ vakit: VAKIT, akis: AKIS, icerik: ICERIK }), 10 * 60_000);
  assert.equal(sonrakiTazelemeMs({ vakit: VAKIT, akis: AKIS, icerik: null }), 60_000);
});

// Faz 1 çıkış ölçütü: CMS'te işaretlenen duyuru ≤ 15 dk'da ekranda. Yayın ~3 dk + yoklama aralığı + ekrandaki
// slaytın kalanı (≤ 30 sn): duyuru akışı 3 dakikada bir yoklanır. Vakit (~60 KB) ve içerik akışı 10 dakikada
// kalır — SW her yanıtı önbelleğe yeniden yazar, büyük akışı sık yazmak kutunun flaş belleğini yıpratır.
test('duyuru akışı 3 dakikada bir yoklanır; vakit ve içerik akışı 10 dakikada kalır', () => {
  assert.equal(AKIS_ARALIGI_MS, 3 * 60_000);
  assert.ok(AKIS_ARALIGI_MS + 30_000 + 3 * 60_000 <= 15 * 60_000, 'yayın + yoklama + en uzun slayt 15 dakikayı aşmamalı');
  assert.equal(sonrakiTazelemeMs({ vakit: VAKIT, akis: AKIS, icerik: ICERIK }), 10 * 60_000);
});

test('akisTazele yalnız akis.json ister; bozuk yanıt son sağlam duyuru akışını silmez', async () => {
  const istenen = [];
  const eski = globalThis.fetch;
  let bozuk = false;
  globalThis.fetch = async (yol) => {
    istenen.push(yol);
    return bozuk ? new Response('sunucu hatası', { status: 500 }) : Response.json({ ...AKIS, derleme: 'yeni' });
  };
  try {
    const v = { vakit: VAKIT, akis: AKIS, icerik: ICERIK };
    await akisTazele(v);
    assert.deepEqual(istenen, ['/ekran/akis.json']);
    assert.equal(v.akis.derleme, 'yeni');
    assert.equal(v.vakit, VAKIT);
    assert.equal(v.icerik, ICERIK);
    bozuk = true;
    const onceki = v.akis;
    await akisTazele(v);
    assert.equal(v.akis, onceki);
  } finally {
    globalThis.fetch = eski;
  }
});

// Sayfa verisi (#ekran-veri) bozuksa ekran vakit adlarını kendi kopyasından alır (src/ekran/metinler.ts →
// VAKIT_ADLARI); kopya site sözlüğünden (src/i18n/ui.ts) ayrışırsa bozuk-veri ekranı sitedekinden farklı ad yazardı.
test('güvenli varsayılan vakit adları site sözlüğüyle aynıdır (TR ve FR, Cuma dâhil)', () => {
  for (const dil of ['tr', 'fr']) {
    const sozluk = ui[dil];
    const beklenen = { cuma: sozluk['namaz.cumaKisa'], cumaUzun: sozluk['namaz.cuma'] };
    for (const v of SIRA) beklenen[v] = sozluk[`namaz.${v}`];
    assert.deepEqual(VAKIT_ADLARI[dil], beklenen, dil);
    for (const ad of Object.values(VAKIT_ADLARI[dil])) assert.ok(typeof ad === 'string' && ad.length > 0, `${dil}: boş ad`);
  }
});

// Slayt turu, duyuru içeriği değişince yeniden kurulur (src/ekran/main.ts → sonrakiSlayt). `derleme` her yayında
// değişir (src/pages/ekran/akis.json.ts → derleme anı; günde 2–4 yayın): anahtara girseydi her yayın turu baştan
// başlatırdı ve uzun bir turun sonundaki ayet ile hadis hiç gelmeyebilirdi.
test('duyuru anahtarı: yalnız derleme damgası değişirse aynı; kimlik, metin, tarih, hedef ya da liste değişirse farklı', () => {
  const D = { id: 'kermes', tur: 'duyuru', tr: { baslik: 'Hayır çarşısı', metin: 'Pazar günü.' }, fr: { baslik: 'Kermesse', metin: 'Dimanche.' }, baslangic: '2026-09-28', son: '2026-10-05', hedef: [] };
  const akis = (duyurular, derleme = '2026-09-28T08:00:00.000Z') => ({ derleme, ayar: AKIS.ayar, duyurular });
  const anahtar = duyuruAnahtari(akis([D]));
  assert.equal(typeof anahtar, 'string');
  assert.equal(duyuruAnahtari(akis([D], '2026-09-28T23:11:42.000Z')), anahtar, 'yalnız derleme değişti');
  assert.equal(duyuruAnahtari({ ...akis([D]), ayar: { ...AKIS.ayar, slayt: { tabanSn: 12 } } }), anahtar, 'slayt süresi turu baştan başlatmaz');
  const degisenler = {
    kimlik: { ...D, id: 'kermes-2026' },
    'TR metin': { ...D, tr: { ...D.tr, metin: 'Cumartesi günü.' } },
    'FR başlık': { ...D, fr: { ...D.fr, baslik: 'Grande kermesse' } },
    başlangıç: { ...D, baslangic: '2026-09-29' },
    bitiş: { ...D, son: '2026-10-06' },
    hedef: { ...D, hedef: ['giris'] },
    görsel: { ...D, gorsel: '/media/duyurular/kermes.webp' },
  };
  for (const [ne, d] of Object.entries(degisenler)) assert.notEqual(duyuruAnahtari(akis([d])), anahtar, ne);
  assert.notEqual(duyuruAnahtari(akis([D, { ...D, id: 'mevlid' }])), anahtar, 'duyuru eklendi');
  assert.notEqual(duyuruAnahtari(akis([])), anahtar, 'duyuru kalktı');
  assert.equal(duyuruAnahtari(null), undefined, 'akış hiç gelmediyse');
});

test('önbellekteki eski içerik akışı (dualar ve esmalar alanı yok) geçerlidir; alanlar varsa dizi olmalı', () => {
  assert.equal(icerikGecerli({ ayetler: [], hadisler: [] }), true);
  assert.equal(icerikGecerli({ ayetler: [], hadisler: [], dualar: [], esmalar: [] }), true);
  assert.equal(icerikGecerli({ ayetler: [], hadisler: [], dualar: 'bozuk' }), false);
  assert.equal(icerikGecerli({ ayetler: [], hadisler: [], esmalar: {} }), false);
});
