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
const esma = (ek = {}) => ({ id: 'esma-001', sira: 1, ar: 'ا', okunus: 'o', tr: 't', kaynakTr: 'k', durum: 'imam-onayli', ...ek });

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

test('Esmâ sıraya göre dizilir; sırası 1–99 dışında, mükerrer ya da alanı eksik kayıt yayımlanmaz', () => {
  const s = ekranIcerigi([], [], [], [], [esma({ id: 'e3', sira: 3 }), esma({ id: 'e1', sira: 1 }), esma({ id: 'e0', sira: 0 }), esma({ id: 'e1b', sira: 1 }), esma({ id: 'e-eksik', okunus: '' })]);
  assert.deepEqual(s.esmalar.map((e) => e.id), ['e1', 'e3']);
  assert.deepEqual(s.esmalar[0], { id: 'e1', sira: 1, ar: 'ا', okunus: 'o', tr: 't', kaynak: 'k' });
  assert.deepEqual(s.eksik, ['e0 (sıra 1–99 değil)', 'e1b (sıra mükerrer)', 'e-eksik']);
});

test('bütçeyi aşan kayıt her türde yayımlanmaz; eksikte kısaltma miktarıyla raporlanır', () => {
  const uzun = 'a'.repeat(200);
  const sinir = Math.max(BUTCE.manevi[0].tr, BUTCE.manevi[1].tr);
  const s = ekranIcerigi([ayet({ id: 'a-uzun', tr: uzun })], [hadis({ id: 'h-uzun', tr: uzun })], [], [hadisDuasi({ id: 'd-uzun', tr: uzun })], [esma({ id: 'e-uzun', tr: uzun })]);
  assert.deepEqual([s.ayetler, s.hadisler, s.dualar, s.esmalar].map((l) => l.length), [0, 0, 0, 0]);
  assert.deepEqual(s.eksik, [`a-uzun (ekrana sığmaz: TR 200/${sinir})`, `h-uzun (ekrana sığmaz: TR 200/${sinir})`, `d-uzun (ekrana sığmaz: TR 200/${sinir})`, `e-uzun (ekrana sığmaz: TR 200/${BUTCE.esma.tr})`]);
});

test('Fransızca metinlere Fransız yazım kuralı uygulanır (noktalama öncesi bölünmez boşluk)', () => {
  const s = ekranIcerigi([], [hadis({ fr: 'Qui est le meilleur ? Celui qui aide.' })], [], [], [esma({ fr: 'Le Clément : il pardonne.' })]);
  assert.equal(s.hadisler[0].fr, 'Qui est le meilleur\u202F? Celui qui aide.');
  assert.equal(s.esmalar[0].fr, 'Le Clément\u00A0: il pardonne.');
});

// İçerik kapısı: onaylı bir kayıt ekrana sığmıyorsa derleme onu sessizce düşürür. Bu test düşürmeden önce durdurur.
test('onaylı her ekran kaydı ekrana sığar (veri dosyaları ve sitedeki hadisler)', () => {
  const oku = (ad) => JSON.parse(readFileSync(new URL(`../src/data/ekran/${ad}.json`, import.meta.url), 'utf8'));
  const s = ekranIcerigi(oku('ayetler'), oku('hadisler'), AHLAK_HADISLERI, oku('dualar'), oku('esma'));
  const sigmayan = s.eksik.filter((e) => e.indexOf('ekrana sığmaz') >= 0);
  assert.deepEqual(sigmayan, [], 'Bu metin ekrana sığmaz, kısaltın: ' + sigmayan.join('; '));
});
