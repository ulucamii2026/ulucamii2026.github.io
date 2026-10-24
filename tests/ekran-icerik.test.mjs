import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ekranIcerigi } from '../src/lib/ekran/icerik.ts';
import { AHLAK_HADISLERI } from '../src/lib/hadis-verisi.ts';
import { BUTCE } from '../src/lib/ekran/butce.ts';

const ayet = (ek = {}) => ({ id: 'a-94-5', sure: 94, ayet: [5, 6], sureAdi: { tr: 'İnşirah', fr: 'Ach-Charh' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)', durum: 'imam-onayli', ...ek });
const hadis = (ek = {}) => ({ id: 'h-1', ar: 'ا', tr: 't', kaynak: 'k', durum: 'imam-onayli', ...ek });
const siteHadisi = { id: 'tebessum', arapca: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', metin: { tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', en: '', nl: '', de: '' }, kaynak: 'Tirmizî, Birr, 36', konu: { tr: '', fr: '', en: '', nl: '', de: '' }, ikon: '' };

const dua = (ek = {}) => ({ id: 'd-20-114', ar: 'رَبِّ زِدْنِي عِلْمًا', tr: 'Rabbim! İlmimi artır.', kaynakTr: 'Kur’an Yolu Meali', ayet: { sure: 20, ayet: [114], sureAdi: { tr: 'Tâhâ', fr: 'Tâ-Hâ' } }, durum: 'imam-onayli', ...ek });
const hadisDuasi = (ek = {}) => ({ id: 'd-h-1', ar: 'ا', tr: 't', kaynakTr: 'DİB', hadis: 'Müslim, Zikir, 1', durum: 'imam-onayli', ...ek });
const bilgi = (ek = {}) => ({ id: 'k-b-1', cesit: 'bilgi', tema: 'emek', baslik: { tr: 'Peygamberlerin meslekleri', fr: 'Les métiers des prophètes' }, tr: 'Her peygamber bir işle geçimini sağladı.', fr: 'Chaque prophète a gagné sa vie par un métier.', kaynak: 'Buhârî, İcâre, 2', durum: 'imam-onayli', ...ek });
const soz = (ek = {}) => ({ id: 'k-s-1', cesit: 'soz', tema: 'emek', tr: 'İşleyen demir ışıldar.', fr: 'C’est en forgeant qu’on devient forgeron.', kaynak: 'Atasözü', durum: 'imam-onayli', ...ek });

test('yalnız imam onaylı ve eksiksiz ayet yayına girer', () => {
  const s = ekranIcerigi([ayet(), ayet({ id: 'a-taslak', durum: 'taslak' }), ayet({ id: 'a-eksik', tr: '' })], [], []);
  assert.deepEqual(s.ayetler.map((a) => a.id), ['a-94-5']);
  assert.deepEqual(s.eksik, ['a-eksik']);
});

test('yalnız imam onaylı ve eksiksiz hadis yayına girer', () => {
  const s = ekranIcerigi([], [hadis(), hadis({ id: 'h-taslak', durum: 'taslak' }), hadis({ id: 'h-eksik', tr: '' })], []);
  assert.deepEqual(s.hadisler.map((h) => h.id), ['h-1']);
  assert.deepEqual(s.eksik, ['h-eksik']);
});

test('ayet referansı TR ve FR biçiminde, aralık tireyle yazılır; FR yoksa alan hiç yok', () => {
  const [a] = ekranIcerigi([ayet()], [], []).ayetler;
  assert.deepEqual(a.referans, { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' });
  assert.equal('fr' in a, false);
  const [b] = ekranIcerigi([ayet({ ayet: [5], fr: 'Texte français de test.', kaynakTr: 'Kur’an Yolu Meali', kaynakFr: 'Le Noble Coran' })], [], []).ayetler;
  assert.equal(b.referans.tr, 'İnşirah, 94/5');
  assert.equal(b.kaynakFr, 'Le Noble Coran');
});

test('FR meali dolu ama kaynağı boşsa FR yayımlanmaz ve eksikte işaretlenir; ikisi de doluysa FR yayımlanır', () => {
  const s = ekranIcerigi([ayet({ fr: 'Texte français de test.', kaynakFr: '' })], [], []);
  const [a] = s.ayetler;
  assert.equal('fr' in a, false);
  assert.equal('kaynakFr' in a, false);
  assert.deepEqual(s.eksik, ['a-94-5 (FR kaynağı yok)']);
  const [b] = ekranIcerigi([ayet({ ayet: [5], fr: 'Texte français de test.', kaynakTr: 'Kur’an Yolu Meali', kaynakFr: 'Le Noble Coran' })], [], []).ayetler;
  assert.equal(b.fr, 'Texte français de test.');
  assert.equal(b.kaynakFr, 'Le Noble Coran');
});

test('sitedeki ahlâk hadisleri havuza AR, TR, FR ve kaynağıyla katılır', () => {
  assert.deepEqual(ekranIcerigi([], [], [siteHadisi]).hadisler, [{ id: 'site-tebessum', ar: siteHadisi.arapca, tr: siteHadisi.metin.tr, fr: siteHadisi.metin.fr, kaynak: 'Tirmizî, Birr, 36' }]);
  const [h] = ekranIcerigi([], [], [{ ...siteHadisi, id: 'frsiz', metin: { ...siteHadisi.metin, fr: '' } }]).hadisler;
  assert.equal('fr' in h, false);
});

test('mükerrer kimlik ikinci kez alınmaz ve raporlanır', () => {
  const h = { id: 'h1', ar: 'ا', tr: 't', kaynak: 'k', durum: 'imam-onayli' };
  const s = ekranIcerigi([ayet(), ayet()], [h, h], []);
  assert.equal(s.ayetler.length, 1);
  assert.equal(s.hadisler.length, 1);
  assert.deepEqual(s.eksik, ['a-94-5 (mükerrer)', 'h1 (mükerrer)']);
});

test('mükerrer kimlik her türün kendi içinde aranır: ayet ile hadisin aynı kimliği çakışma sayılmaz', () => {
  const s = ekranIcerigi([ayet({ id: 'ortak' })], [hadis({ id: 'ortak' }), hadis({ id: 'site-tebessum' })], [siteHadisi]);
  assert.deepEqual(s.ayetler.map((a) => a.id), ['ortak']);
  assert.deepEqual(s.hadisler.map((h) => h.id), ['site-tebessum', 'ortak', 'site-tebessum']);
  assert.deepEqual(s.eksik, []);
});

test('ayet aralığının sonu başından önceyse kayıt yayımlanmaz, eksikte işaretlenir', () => {
  const s = ekranIcerigi([ayet({ id: 'ters', ayet: [7, 5] }), ayet()], [], []);
  assert.deepEqual(s.ayetler.map((a) => a.id), ['a-94-5']);
  assert.deepEqual(s.eksik, ['ters (ayet aralığı bozuk)']);
});

test('boş (null) ya da nesne olmayan öğe derlemeyi düşürmez, eksikte işaretlenir', () => {
  const s = ekranIcerigi([null, 'metin', ayet()], [7, null, hadis()], []);
  assert.deepEqual(s.ayetler.map((a) => a.id), ['a-94-5']);
  assert.deepEqual(s.hadisler.map((h) => h.id), ['h-1']);
  assert.equal(s.eksik.length, 4);
  assert.ok(s.eksik.every((e) => e.includes('geçersiz kayıt')), s.eksik.join(', '));
});

test('Kur’an duası ayet gibi kaynaklanır: referans ve meal kaynağı; FR yalnız kaynağıyla', () => {
  const s = ekranIcerigi([], [], [], [dua(), dua({ id: 'd-fr', fr: 'Texte français de test.', kaynakFr: 'Le Noble Coran' }), dua({ id: 'd-frsiz', fr: 'Texte.', kaynakFr: '' })]);
  assert.deepEqual(s.dualar[0], { id: 'd-20-114', ar: 'رَبِّ زِدْنِي عِلْمًا', tr: 'Rabbim! İlmimi artır.', kaynak: 'Tâhâ, 20/114 · Tâ-Hâ, 20:114 — Kur’an Yolu Meali', kuran: true });
  assert.equal(s.dualar[1].fr, 'Texte français de test.');
  assert.equal(s.dualar[1].kaynak, 'Tâhâ, 20/114 · Tâ-Hâ, 20:114 — Kur’an Yolu Meali · Le Noble Coran');
  assert.equal('fr' in s.dualar[2], false);
  assert.deepEqual(s.eksik, ['d-frsiz (FR kaynağı yok)']);
});

test('hadis duasının kaynak satırı yalnız hadis kaynağıdır (çeviri satırı yok); FR kaynaksız da yayımlanır', () => {
  const [d] = ekranIcerigi([], [], [], [hadisDuasi({ fr: 'Texte français de test.' })]).dualar;
  assert.deepEqual(d, { id: 'd-h-1', ar: 'ا', tr: 't', fr: 'Texte français de test.', kaynak: 'Müslim, Zikir, 1', kuran: false });
});

test('dua: ayet ile hadisten tam olarak biri dolu olmalı; ikisi de ya da hiçbiri doluysa yayımlanmaz', () => {
  const s = ekranIcerigi([], [], [], [dua({ id: 'iki', hadis: 'k' }), hadisDuasi({ id: 'hic', hadis: undefined }), dua({ id: 'taslak', durum: 'taslak' })]);
  assert.deepEqual(s.dualar, []);
  assert.deepEqual(s.eksik, ['iki (ayet/hadis kaynağı bozuk)', 'hic (ayet/hadis kaynağı bozuk)']);
});

test('tema kartları dosyadaki sırayla yayımlanır: ayet ve hadis kendi kurallarıyla, bilgi ve söz kendi alanlarıyla', () => {
  const s = ekranIcerigi([], [], [], [], [
    { ...ayet({ id: 'k-a-94-5' }), cesit: 'ayet', tema: 'sabir' },
    soz(),
    { ...hadis({ id: 'k-h-1' }), cesit: 'hadis', tema: 'ilim' },
    bilgi(),
    soz({ id: 'k-s-ar', ar: 'مَنْ جَدَّ وَجَدَ', tr: 'Çalışan bulur.', fr: undefined, kaynak: 'Arap atasözü', tema: 'emek' }),
  ]);
  assert.deepEqual(s.kartlar.map((k) => k.cesit + ':' + k.tema + ':' + k.oge.id), ['ayet:sabir:k-a-94-5', 'soz:emek:k-s-1', 'hadis:ilim:k-h-1', 'bilgi:emek:k-b-1', 'soz:emek:k-s-ar']);
  assert.deepEqual(s.kartlar[0].oge.referans, { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' });
  assert.deepEqual(s.kartlar[3].oge, { id: 'k-b-1', baslik: { tr: 'Peygamberlerin meslekleri', fr: 'Les métiers des prophètes' }, tr: 'Her peygamber bir işle geçimini sağladı.', fr: 'Chaque prophète a gagné sa vie par un métier.', kaynak: 'Buhârî, İcâre, 2' });
  assert.deepEqual(s.kartlar[4].oge, { id: 'k-s-ar', ar: 'مَنْ جَدَّ وَجَدَ', tr: 'Çalışan bulur.', kaynak: 'Arap atasözü' });
  assert.deepEqual(s.eksik, []);
});

test('tema kartı: taslak yayımlanmaz; bilinmeyen tema ya da çeşit, eksik alan, mükerrer kimlik raporlanır', () => {
  const s = ekranIcerigi([], [], [], [], [
    soz({ id: 'taslak', durum: 'taslak' }),
    soz({ id: 'temasiz', tema: 'esma' }),
    soz({ id: 'cesitsiz', cesit: 'esma' }),
    soz({ id: 'kaynaksiz', kaynak: '' }),
    bilgi({ id: 'basliksiz', baslik: { tr: '' } }),
    { ...ayet({ id: 'k-a-ters', ayet: [7, 5] }), cesit: 'ayet', tema: 'emek' },
    soz(), soz(), null,
  ]);
  assert.deepEqual(s.kartlar.map((k) => k.oge.id), ['k-s-1']);
  assert.deepEqual(s.eksik, ['temasiz (tema bilinmiyor)', 'cesitsiz (kart çeşidi bilinmiyor)', 'kaynaksiz', 'basliksiz', 'k-a-ters (ayet aralığı bozuk)', 'k-s-1 (mükerrer)', 'geçersiz kayıt (kart): null']);
});

test('bilgi kartı: FR başlık ile FR metin birlikte yayımlanır; biri eksikse FR hiç çıkmaz ve işaretlenir', () => {
  const s = ekranIcerigi([], [], [], [], [bilgi({ id: 'frsiz-baslik', baslik: { tr: 'Başlık' } }), bilgi({ id: 'tr-yalniz', baslik: { tr: 'Başlık' }, fr: undefined })]);
  assert.deepEqual(s.kartlar.map((k) => k.oge), [
    { id: 'frsiz-baslik', baslik: { tr: 'Başlık' }, tr: 'Her peygamber bir işle geçimini sağladı.', kaynak: 'Buhârî, İcâre, 2' },
    { id: 'tr-yalniz', baslik: { tr: 'Başlık' }, tr: 'Her peygamber bir işle geçimini sağladı.', kaynak: 'Buhârî, İcâre, 2' },
  ]);
  assert.deepEqual(s.eksik, ['frsiz-baslik (FR başlık ya da metin eksik)']);
});

test('bütçeyi aşan kayıt her türde yayımlanmaz; eksikte kısaltma miktarıyla raporlanır', () => {
  const sinir = Math.max(BUTCE.manevi[0].tr, BUTCE.manevi[1].tr);
  // Uzunluk bütçelerden türer: kalibrasyon bir sınırı yükseltince «uzun» metin sessizce sığar hâle gelmesin.
  const n = Math.max(sinir, BUTCE.sozArapcasiz.tr, BUTCE.bilgi.tr) + 10;
  const uzun = 'a'.repeat(n);
  const s = ekranIcerigi([ayet({ id: 'a-uzun', tr: uzun })], [hadis({ id: 'h-uzun', tr: uzun })], [], [hadisDuasi({ id: 'd-uzun', tr: uzun })], [soz({ id: 's-uzun', tr: uzun }), bilgi({ id: 'b-uzun', tr: uzun }), { ...hadis({ id: 'kh-uzun', tr: uzun }), cesit: 'hadis', tema: 'emek' }]);
  assert.deepEqual([s.ayetler, s.hadisler, s.dualar, s.kartlar].map((l) => l.length), [0, 0, 0, 0]);
  assert.deepEqual(s.eksik, [`a-uzun (ekrana sığmaz: TR ${n}/${sinir})`, `h-uzun (ekrana sığmaz: TR ${n}/${sinir})`, `d-uzun (ekrana sığmaz: TR ${n}/${sinir})`,
    `s-uzun (ekrana sığmaz: TR ${n}/${BUTCE.sozArapcasiz.tr})`, `b-uzun (ekrana sığmaz: TR ${n}/${BUTCE.bilgi.tr})`, `kh-uzun (ekrana sığmaz: TR ${n}/${sinir})`]);
});

test('Fransızca metinlere Fransız yazım kuralı uygulanır (noktalama öncesi bölünmez boşluk)', () => {
  const s = ekranIcerigi([], [hadis({ fr: 'Qui est le meilleur ? Celui qui aide.' })], [], [], [soz({ fr: 'Le patient : il gagne.' }), bilgi({ baslik: { tr: 'B', fr: 'Le saviez-vous ?' } })]);
  assert.equal(s.hadisler[0].fr, 'Qui est le meilleur\u202F? Celui qui aide.');
  assert.equal(s.kartlar[0].oge.fr, 'Le patient\u00A0: il gagne.');
  assert.equal(s.kartlar[1].oge.baslik.fr, 'Le saviez-vous\u202F?');
});

// İçerik kapısı: onaylı bir kayıt ekrana sığmıyorsa derleme onu sessizce düşürür. Bu test düşürmeden önce durdurur.
test('onaylı her ekran kaydı ekrana sığar (veri dosyaları ve sitedeki hadisler)', () => {
  const oku = (ad) => JSON.parse(readFileSync(new URL(`../src/data/ekran/${ad}.json`, import.meta.url), 'utf8'));
  const s = ekranIcerigi(oku('ayetler'), oku('hadisler'), AHLAK_HADISLERI, oku('dualar'), oku('kartlar'));
  const sigmayan = s.eksik.filter((e) => e.indexOf('ekrana sığmaz') >= 0);
  assert.deepEqual(sigmayan, [], 'Bu metin ekrana sığmaz, kısaltın: ' + sigmayan.join('; '));
});

// 24 Ekim 2026 kararı: Chiadmi (DİB) dijitalde yok; ekrandaki Fransızca âyet meâli Hamidullah (scripts/ekran-meal-fr.mjs).
test('Kur’an kayıtlarının Fransızca meâli Hamidullah: çevirmen adı yazılı, «Diyanet» denmez, tipografi yerinde, hepsi yayında', () => {
  const oku = (ad) => JSON.parse(readFileSync(new URL(`../src/data/ekran/${ad}.json`, import.meta.url), 'utf8'));
  const [ayetler, dualar, kartlar] = [oku('ayetler'), oku('dualar'), oku('kartlar')];
  const kuranKayitlari = [...ayetler, ...dualar.filter((d) => d.ayet), ...kartlar.filter((k) => k.cesit === 'ayet')];
  const frli = kuranKayitlari.filter((k) => k.fr !== undefined || k.kaynakFr !== undefined);
  assert.ok(frli.length >= 70, `FR'li Kur’an kaydı ${frli.length}; betik: node scripts/ekran-meal-fr.mjs`);
  for (const k of frli) {
    assert.equal(k.kaynakFr, 'Hamidullah', `${k.id}: FR meâl Hamidullah’tır, «fr» ile «kaynakFr» birlikte yazılır`);
    assert.ok(typeof k.fr === 'string' && k.fr.length > 0, k.id);
    assert.ok(!/Diyanet|Chiadmi/i.test(k.fr + k.kaynakFr), `${k.id}: Hamidullah meâline Diyanet denmez`);
    assert.ok(!/'/.test(k.fr), `${k.id}: düz kesme işareti yerine ’ (Fransız yazım kuralı)`);
    assert.ok(!/"/.test(k.fr), `${k.id}: düz çift tırnak yerine « » (Fransız yazım kuralı)`);
    assert.ok(!/\S[?!;:]/.test(k.fr), `${k.id}: «? ! ; :» öncesinde boşluk olmalı (ince bölünmez boşluğu çalışma anında konur)`);
    assert.ok(!/«\S|\S»/.test(k.fr), `${k.id}: «« »» içinde boşluk olmalı (« metin ») ; bölünmez boşluğu çalışma anında konur`);
  }
  // Ekran akışına giren her FR'li kayıt kaynak satırında çevirmeni taşır; kaynak FR'si olmadan FR yayımlanmaz.
  const s = ekranIcerigi(ayetler, oku('hadisler'), AHLAK_HADISLERI, dualar, kartlar);
  assert.deepEqual(s.eksik.filter((e) => /FR kaynağı yok/.test(e)), []);
  const yayinda = [...s.ayetler, ...s.kartlar.filter((k) => k.cesit === 'ayet').map((k) => k.oge)].filter((a) => a.fr);
  assert.ok(yayinda.length >= 30);
  for (const a of yayinda) assert.equal(a.kaynakFr, 'Hamidullah', a.id);
  for (const d of s.dualar.filter((x) => x.kuran && x.fr)) assert.match(d.kaynak, / · Hamidullah$/, d.id);
  // Bütçeyi aşan kayıt FR'siz kalır, tümden düşmez: FR'siz Kur’an kaydı da yayında.
  const frsiz = kuranKayitlari.filter((k) => !k.fr);
  assert.ok(frsiz.length > 0);
  assert.deepEqual(s.eksik.filter((e) => frsiz.some((k) => e.startsWith(k.id + ' '))), []);
});
