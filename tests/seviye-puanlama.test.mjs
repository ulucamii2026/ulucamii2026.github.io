import test from 'node:test';
import assert from 'node:assert/strict';
import { BILGI_ALANLARI, BILGI_ESIGI, OKUMA_ESIGI, puanla, girdiDogrula } from '../src/lib/seviye-testi/puanlama.ts';

const metin = s => ({ tr: s, fr: s, en: s });
function grup(alan, basamak, sayi) {
  return Array.from({ length: sayi }, (_, i) => ({
    id: `${alan}-${basamak}-${i}`, tur: alan === 'okuma' ? 'okuma' : 'bilgi', alan, basamak,
    soru: metin('Yapay soru'), siklar: ['Bir', 'İki', 'Üç', 'Dört'].map(metin),
    dogru: i % 4, kaynak: 'Yapay test verisi', ...(alan === 'okuma' ? { goster: 'بَ' } : {}),
  }));
}
const cevapla = (maddeler, sayi = maddeler.length) => Object.fromEntries(maddeler.map((m, i) => [m.id, i < sayi ? m.dogru : -1]));
const alanSonucu = (sonuc, alan = 'itikat') => sonuc.alanlar.find(a => a.alan === alan);

test('eşikler: bilgide 5’te 3, okumada 6’da 4 geçer; bir eksiği kalır', () => {
  assert.equal(BILGI_ESIGI, 0.6);
  assert.equal(OKUMA_ESIGI, 0.66);
  for (const [alan, toplam, sinir] of [['itikat', 5, 3], ['okuma', 6, 4]]) {
    const maddeler = grup(alan, 1, toplam);
    for (const dogru of [sinir - 1, sinir]) {
      const sonuc = puanla(maddeler, { cevaplar: cevapla(maddeler, dogru) });
      const a = alan === 'okuma' ? sonuc.okuma : alanSonucu(sonuc);
      assert.deepEqual(a.basamaklar[0], { basamak: 1, dogru, toplam, gecti: dogru === sinir });
      assert.equal(a.duzey, dogru === sinir ? 1 : 0);
    }
  }
});

test('düzey kesintisizdir: ilk basamakta ve ara basamakta boşluk ilerlemeyi durdurur', () => {
  for (const alan of ['itikat', 'okuma']) {
    for (const gecilen of [[2], [1, 3]]) {
      const maddeler = [1, 2, 3].flatMap(b => grup(alan, b, 5));
      const cevaplar = cevapla(maddeler.filter(m => gecilen.includes(m.basamak)));
      const sonuc = puanla(maddeler, { cevaplar });
      const a = alan === 'okuma' ? sonuc.okuma : alanSonucu(sonuc);
      assert.equal(a.duzey, gecilen[0] === 1 ? 1 : 0);
      assert.equal(a.basamaklar[gecilen.at(-1) - 1].gecti, true);
    }
  }
});

test('boş banka ve eksik basamaklar geçilmez; bilgi alanları sabit sıradadır', () => {
  const sonuc = puanla([], { cevaplar: {} });
  assert.deepEqual(BILGI_ALANLARI, ['kuranBilgi', 'itikat', 'namaz', 'ibadet', 'siyer', 'ahlak']);
  assert.deepEqual(sonuc.alanlar.map(a => a.alan), BILGI_ALANLARI);
  for (const a of [sonuc.okuma, ...sonuc.alanlar]) {
    assert.equal(a.duzey, 0);
    assert.equal(a.atlandi, false);
    assert.equal(a.basamaklar.length, a === sonuc.okuma ? 5 : 3);
    a.basamaklar.forEach((b, i) => assert.deepEqual(b, { basamak: i + 1, dogru: 0, toplam: 0, gecti: false }));
  }
  assert.ok(sonuc.alanlar.every(a => a.yuzde === 0));
  assert.equal(sonuc.okuma.tecvid, false);
  assert.equal(sonuc.program, 'A');
  assert.deepEqual(sonuc.mezhepNotlari, []);
});

test('bilmiyorum, boş, yanlış şık ve geçersiz değerler doğru sayılmaz', () => {
  const maddeler = grup('itikat', 1, 1);
  for (const cevap of [-1, undefined, -2, 4, 0.5, NaN, Infinity, -Infinity, '0', null, false, 1]) {
    const a = alanSonucu(puanla(maddeler, { cevaplar: { [maddeler[0].id]: cevap } }));
    assert.equal(a.basamaklar[0].dogru, 0);
    assert.equal(a.yuzde, 0);
  }
  assert.equal(alanSonucu(puanla(maddeler, { cevaplar: {} })).basamaklar[0].dogru, 0);
});

test('mezhep ve emekli maddeler paya/paydaya girmez; cevaplanmış mezhep maddeleri notta kalır', () => {
  const [normal, mezhep, emekli, ikisi, bos, bilmiyor] = grup('itikat', 1, 6);
  mezhep.mezhepBagli = true;
  emekli.emekli = true;
  Object.assign(ikisi, { mezhepBagli: true, emekli: true });
  bos.mezhepBagli = true;
  bilmiyor.mezhepBagli = true;
  const maddeler = [normal, mezhep, emekli, ikisi, bos, bilmiyor];
  const cevaplar = { ...cevapla([normal, emekli, ikisi]), [mezhep.id]: 0, [bilmiyor.id]: -1 };
  const sonuc = puanla(maddeler, { cevaplar });
  assert.deepEqual(alanSonucu(sonuc).basamaklar[0], { basamak: 1, dogru: 1, toplam: 1, gecti: true });
  assert.equal(alanSonucu(sonuc).yuzde, 100);
  assert.deepEqual(sonuc.mezhepNotlari, [
    { id: mezhep.id, verilen: 0, dogru: mezhep.dogru },
    { id: ikisi.id, verilen: ikisi.dogru, dogru: ikisi.dogru },
  ]);
  // Notlar puan değildir: bölüm atlama, verilmiş mezhep cevabını nottan silmez.
  assert.deepEqual(puanla(maddeler, { cevaplar, atla: { itikat: true } }).mezhepNotlari, sonuc.mezhepNotlari);
  const okuma = grup('okuma', 1, 1).map(m => ({ ...m, emekli: true }));
  assert.equal(puanla(okuma, { cevaplar: cevapla(okuma) }).okuma.basamaklar[0].toplam, 0);
});

test('atla bütün alanlarda gelen doğru cevapları sıfırlar, toplamı korur', () => {
  const alanlar = ['okuma', ...BILGI_ALANLARI];
  const maddeler = alanlar.flatMap(a => Array.from({ length: a === 'okuma' ? 5 : 3 }, (_, i) => grup(a, i + 1, 4)).flat());
  const cevaplar = cevapla(maddeler);
  const sonuc = puanla(maddeler, { cevaplar, atla: Object.fromEntries(alanlar.map(a => [a, true])) });
  for (const a of [sonuc.okuma, ...sonuc.alanlar]) {
    assert.equal(a.duzey, 0);
    assert.equal(a.atlandi, true);
    assert.ok(a.basamaklar.every(b => b.dogru === 0 && b.toplam === 4 && !b.gecti));
  }
  assert.ok(sonuc.alanlar.every(a => a.yuzde === 0));
  assert.equal(sonuc.okuma.tecvid, false);
  assert.equal(sonuc.program, 'A');
  const tek = puanla(maddeler, { cevaplar, atla: { itikat: true, okuma: false } });
  assert.equal(tek.okuma.duzey, 5);
  assert.equal(alanSonucu(tek, 'namaz').duzey, 3);
  assert.equal(alanSonucu(tek).duzey, 0);
});

test('tecvid yalnız Kur’an bilgisi B3 geçişidir; bilgi ve okuma düzeyinden bağımsızdır', () => {
  const maddeler = grup('kuranBilgi', 3, 5);
  for (const [dogru, gecti] of [[2, false], [3, true]]) {
    const sonuc = puanla(maddeler, { cevaplar: cevapla(maddeler, dogru), atla: { okuma: true } });
    assert.equal(sonuc.okuma.tecvid, gecti);
    assert.equal(alanSonucu(sonuc, 'kuranBilgi').duzey, 0);
  }
});

test('programın dört dalı bütün okuma ve namaz düzeylerinde doğru seçilir', () => {
  for (let k = 0; k <= 5; k++) {
    for (let n = 0; n <= 3; n++) {
      const maddeler = [
        ...Array.from({ length: k }, (_, i) => grup('okuma', i + 1, 6)).flat(),
        ...Array.from({ length: n }, (_, i) => grup('namaz', i + 1, 5)).flat(),
      ];
      const sonuc = puanla(maddeler, { cevaplar: cevapla(maddeler) });
      assert.equal(sonuc.okuma.duzey, k);
      assert.equal(alanSonucu(sonuc, 'namaz').duzey, n);
      const beklenen = ['A', 'A', 'B', 'B', n < 2 ? 'C' : 'D', n < 2 ? 'C' : 'D'][k];
      assert.equal(sonuc.program, beklenen, `K${k}, namaz ${n}`);
    }
  }
});

test('yüzde tam sayıya yuvarlanır ve basamak yüzdelerinin ortalaması değildir', () => {
  const maddeler = [...grup('itikat', 1, 1), ...grup('itikat', 2, 2)];
  for (const [dogru, yuzde] of [[1, 33], [2, 67], [3, 100]]) {
    assert.equal(alanSonucu(puanla(maddeler, { cevaplar: cevapla(maddeler, dogru) })).yuzde, yuzde);
  }
  const sekiz = grup('itikat', 1, 8);
  assert.equal(alanSonucu(puanla(sekiz, { cevaplar: cevapla(sekiz, 1) })).yuzde, 13);
});

test('saflık: dondurulmuş girdiler korunur, tekrar çağrısı aynı sonucu verir', () => {
  function dondur(x) {
    if (x && typeof x === 'object') { Object.values(x).forEach(dondur); Object.freeze(x); }
    return x;
  }
  const maddeler = dondur(grup('itikat', 1, 5));
  const girdi = dondur({ cevaplar: cevapla(maddeler, 3), atla: { itikat: false } });
  assert.deepEqual(puanla(maddeler, girdi), puanla(maddeler, girdi));
  assert.equal(girdiDogrula(maddeler, girdi.cevaplar).tamam, true);
});

test('girdi doğrulama: düz nesne, alt küme ve her hata kodu', () => {
  const maddeler = grup('itikat', 1, 2);
  const id = maddeler[0].id;
  for (const girdi of [null, undefined, [], '', 0, true, new Date(), new Map(), () => {}, Object.create({ x: 1 })]) {
    assert.deepEqual(girdiDogrula(maddeler, girdi), { tamam: false, kod: 'cevaplar-gecersiz' });
  }
  for (const cevap of [-2, 4, 0.5, NaN, Infinity, -Infinity, '0', null, undefined, false]) {
    assert.deepEqual(girdiDogrula(maddeler, { [id]: cevap }), { tamam: false, kod: 'cevap-gecersiz' });
  }
  for (const cevap of [-1, 0, 1, 2, 3]) {
    assert.deepEqual(girdiDogrula(maddeler, { [id]: cevap }), { tamam: true });
  }
  for (const girdi of [{}, Object.create(null), cevapla(maddeler)]) {
    assert.deepEqual(girdiDogrula(maddeler, girdi), { tamam: true });
  }
  for (const id of ['yok', 'toString', '__proto__', Symbol('yok')]) {
    assert.deepEqual(girdiDogrula(maddeler, { [id]: 0 }), { tamam: false, kod: 'madde-bilinmiyor' });
  }
  const ucSik = [{ ...maddeler[0], siklar: maddeler[0].siklar.slice(0, 3) }];
  assert.deepEqual(girdiDogrula(ucSik, { [id]: 3 }), { tamam: false, kod: 'cevap-gecersiz' });
});
