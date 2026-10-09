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

// ---- Sunucu saati yüksek su işareti (W7): cihaz saati geriye giderse ekran saate güvenmez ----
// Modül durumu (işaret) testler arası sızmasın diye her test modülü taze bir sorgu dizesiyle yeniden yükler.
let tazeSayac = 0;
const tazeVeri = () => import('../src/ekran/veri.ts?w7=' + (++tazeSayac));
const DATE_A = 'Fri, 09 Oct 2026 11:00:00 GMT';
const MS_A = Date.UTC(2026, 9, 9, 11, 0, 0);
const DATE_B = 'Fri, 09 Oct 2026 11:05:00 GMT';
const MS_B = Date.UTC(2026, 9, 9, 11, 5, 0);

/** localStorage yerine sahte depo koyar (yok = undefined), işi bitince özgün tanımı geri verir. */
async function depoyla(depo, is) {
  const onceki = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: depo, configurable: true, writable: true });
  try { return await is(); } finally {
    if (onceki) Object.defineProperty(globalThis, 'localStorage', onceki); else delete globalThis.localStorage;
  }
}
function sahteDepo(ilk = {}) {
  const veri = new Map(Object.entries(ilk));
  const yazimlar = [];
  return { yazimlar, veri, getItem: (k) => (veri.has(k) ? veri.get(k) : null), setItem: (k, v) => { yazimlar.push([k, v]); veri.set(k, String(v)); } };
}
async function fetchIle(yanit, is) {
  const eski = globalThis.fetch;
  globalThis.fetch = async () => yanit();
  try { return await is(); } finally { globalThis.fetch = eski; }
}
const VAKIT_YANIT = (date) => () => new Response(JSON.stringify(VAKIT), { status: 200, headers: date ? { Date: date } : {} });

test('sunucu saati: geçerli gövdeli yanıtın Date başlığı işareti yükseltir', async () => {
  await depoyla(sahteDepo(), async () => {
    const m = await tazeVeri();
    assert.equal(m.sonSunucuSaati(), 0);
    await fetchIle(VAKIT_YANIT(DATE_A), () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), MS_A);
  });
});

test('sunucu saati: gövde doğrulamadan geçmezse (captive portal) daha yeni Date işareti oynatmaz', async () => {
  await depoyla(sahteDepo(), async () => {
    const m = await tazeVeri();
    await fetchIle(() => new Response(JSON.stringify({ kaynakTuru: 'aladhan' }), { status: 200, headers: { Date: DATE_B } }),
      () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), 0);
    await fetchIle(() => new Response('<html>giriş yapın</html>', { status: 200, headers: { Date: DATE_B } }),
      () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), 0);
  });
});

test('sunucu saati: !ok yanıt işareti oynatmaz', async () => {
  await depoyla(sahteDepo(), async () => {
    const m = await tazeVeri();
    await fetchIle(() => new Response(JSON.stringify(VAKIT), { status: 500, headers: { Date: DATE_B } }),
      () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), 0);
  });
});

test('sunucu saati: Date başlığı olmayan ya da bozuk yanıt işareti oynatmaz', async () => {
  await depoyla(sahteDepo(), async () => {
    const m = await tazeVeri();
    await fetchIle(VAKIT_YANIT(null), () => m.tazele({ vakit: null, akis: null, icerik: null }));
    await fetchIle(VAKIT_YANIT('dün akşam'), () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), 0);
  });
});

test('sunucu saati: eski Date işareti asla düşürmez', async () => {
  await depoyla(sahteDepo(), async () => {
    const m = await tazeVeri();
    await fetchIle(VAKIT_YANIT(DATE_B), () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), MS_B);
    await fetchIle(VAKIT_YANIT(DATE_A), () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), MS_B);
    m.sunucuSaatiniKaydet(MS_A);
    m.sunucuSaatiniKaydet(null);
    m.sunucuSaatiniKaydet(NaN);
    m.sunucuSaatiniKaydet(Infinity);
    assert.equal(m.sonSunucuSaati(), MS_B, 'null, NaN ve Infinity işareti değiştirmez');
  });
});

test('sunucu saati: akisTazele de geçerli yanıttan işareti yükseltir', async () => {
  await depoyla(sahteDepo(), async () => {
    const m = await tazeVeri();
    await fetchIle(() => new Response(JSON.stringify(AKIS), { status: 200, headers: { Date: DATE_A } }),
      () => m.akisTazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), MS_A);
  });
});

test('sunucu saati: depoya yalnız en az 60 sn büyüyünce yazılır', async () => {
  const depo = sahteDepo();
  await depoyla(depo, async () => {
    const m = await tazeVeri();
    m.sunucuSaatiniKaydet(MS_A);
    assert.equal(depo.yazimlar.length, 1);
    assert.deepEqual(depo.yazimlar[0], ['ekran.sonSunucuSaati', String(MS_A)]);
    m.sunucuSaatiniKaydet(MS_A + 59_999);
    assert.equal(depo.yazimlar.length, 1, '60 sn altı büyüme yazılmaz');
    assert.equal(m.sonSunucuSaati(), MS_A + 59_999, 'bellekteki işaret yine de yükselir');
    m.sunucuSaatiniKaydet(MS_A + 60_000);
    assert.equal(depo.yazimlar.length, 2, 'tam 60 sn büyüme yazılır');
    assert.deepEqual(depo.yazimlar[1], ['ekran.sonSunucuSaati', String(MS_A + 60_000)]);
  });
});

test('sunucu saati: ilk değer depodan okunur; bozuk değer 0 sayılır', async () => {
  await depoyla(sahteDepo({ 'ekran.sonSunucuSaati': String(MS_B) }), async () => {
    const m = await tazeVeri();
    assert.equal(m.sonSunucuSaati(), MS_B);
  });
  for (const bozuk of ['', 'abc', 'NaN', 'Infinity', '-5']) {
    await depoyla(sahteDepo({ 'ekran.sonSunucuSaati': bozuk }), async () => {
      const m = await tazeVeri();
      assert.equal(m.sonSunucuSaati(), 0, 'bozuk değer: ' + JSON.stringify(bozuk));
    });
  }
});

test('sunucu saati: depodan okunan değer üstüne yazım eşiği hesaplanır', async () => {
  const depo = sahteDepo({ 'ekran.sonSunucuSaati': String(MS_A) });
  await depoyla(depo, async () => {
    const m = await tazeVeri();
    m.sunucuSaatiniKaydet(MS_A + 30_000);
    assert.equal(depo.yazimlar.length, 0);
    m.sunucuSaatiniKaydet(MS_A + 60_000);
    assert.equal(depo.yazimlar.length, 1);
  });
});

test('sunucu saati: localStorage yoksa bellekte çalışmaya devam eder', async () => {
  await depoyla(undefined, async () => {
    const m = await tazeVeri();
    assert.equal(m.sonSunucuSaati(), 0);
    m.sunucuSaatiniKaydet(MS_A);
    assert.equal(m.sonSunucuSaati(), MS_A);
  });
});

test('sunucu saati: localStorage okurken ve yazarken fırlatırsa yine bellekte çalışır', async () => {
  const atan = { getItem() { throw new Error('depo kapalı'); }, setItem() { throw new Error('kota'); } };
  await depoyla(atan, async () => {
    const m = await tazeVeri();
    assert.equal(m.sonSunucuSaati(), 0);
    m.sunucuSaatiniKaydet(MS_A);
    assert.equal(m.sonSunucuSaati(), MS_A);
    await fetchIle(VAKIT_YANIT(DATE_B), () => m.tazele({ vakit: null, akis: null, icerik: null }));
    assert.equal(m.sonSunucuSaati(), MS_B);
  });
});
