import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranIcerigi } from '../src/lib/ekran/icerik.ts';

const ayet = (ek = {}) => ({ id: 'a-94-5', sure: 94, ayet: [5, 6], sureAdi: { tr: 'İnşirah', fr: 'Ach-Charh' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)', durum: 'imam-onayli', ...ek });
const hadis = (ek = {}) => ({ id: 'h-1', ar: 'ا', tr: 't', kaynak: 'k', durum: 'imam-onayli', ...ek });
const siteHadisi = { id: 'tebessum', arapca: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', metin: { tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', en: '', nl: '', de: '' }, kaynak: 'Tirmizî, Birr, 36', konu: { tr: '', fr: '', en: '', nl: '', de: '' }, ikon: '' };

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
  const [b] = ekranIcerigi([ayet({ ayet: [5], fr: 'Texte français de test.', kaynakFr: 'Traduction de test' })], [], []).ayetler;
  assert.equal(b.referans.tr, 'İnşirah, 94/5');
  assert.equal(b.kaynakFr, 'Traduction de test');
});

test('FR meali dolu ama kaynağı boşsa FR yayımlanmaz ve eksikte işaretlenir; ikisi de doluysa FR yayımlanır', () => {
  const s = ekranIcerigi([ayet({ fr: 'Texte français de test.', kaynakFr: '' })], [], []);
  const [a] = s.ayetler;
  assert.equal('fr' in a, false);
  assert.equal('kaynakFr' in a, false);
  assert.deepEqual(s.eksik, ['a-94-5 (FR kaynağı yok)']);
  const [b] = ekranIcerigi([ayet({ fr: 'Texte français de test.', kaynakFr: 'Traduction de test' })], [], []).ayetler;
  assert.equal(b.fr, 'Texte français de test.');
  assert.equal(b.kaynakFr, 'Traduction de test');
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
