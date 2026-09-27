import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranIcerigi } from '../src/lib/ekran/icerik.ts';

const ayet = (ek = {}) => ({ id: 'a-94-5', sure: 94, ayet: [5, 6], sureAdi: { tr: 'İnşirah', fr: 'Ach-Charh' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)', durum: 'imam-onayli', ...ek });
const siteHadisi = { id: 'tebessum', arapca: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', metin: { tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', en: '', nl: '', de: '' }, kaynak: 'Tirmizî, Birr, 36', konu: { tr: '', fr: '', en: '', nl: '', de: '' }, ikon: '' };

test('yalnız imam onaylı ve eksiksiz ayet yayına girer', () => {
  const s = ekranIcerigi([ayet(), ayet({ id: 'a-taslak', durum: 'taslak' }), ayet({ id: 'a-eksik', tr: '' })], [], []);
  assert.deepEqual(s.ayetler.map((a) => a.id), ['a-94-5']);
  assert.deepEqual(s.eksik, ['a-eksik']);
});

test('ayet referansı TR ve FR biçiminde, aralık tireyle yazılır; FR yoksa alan hiç yok', () => {
  const [a] = ekranIcerigi([ayet()], [], []).ayetler;
  assert.deepEqual(a.referans, { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' });
  assert.equal('fr' in a, false);
  const [b] = ekranIcerigi([ayet({ ayet: [5], fr: 'Texte français de test.', kaynakFr: 'Traduction de test' })], [], []).ayetler;
  assert.equal(b.referans.tr, 'İnşirah, 94/5');
  assert.equal(b.kaynakFr, 'Traduction de test');
});

test('sitedeki ahlâk hadisleri havuza AR, TR, FR ve kaynağıyla katılır', () => {
  assert.deepEqual(ekranIcerigi([], [], [siteHadisi]).hadisler, [{ id: 'site-tebessum', ar: siteHadisi.arapca, tr: siteHadisi.metin.tr, fr: siteHadisi.metin.fr, kaynak: 'Tirmizî, Birr, 36' }]);
});

test('mükerrer kimlik ikinci kez alınmaz ve raporlanır', () => {
  const h = { id: 'h1', ar: 'ا', tr: 't', kaynak: 'k', durum: 'imam-onayli' };
  const s = ekranIcerigi([ayet(), ayet()], [h, h], []);
  assert.equal(s.ayetler.length, 1);
  assert.equal(s.hadisler.length, 1);
  assert.deepEqual(s.eksik, ['a-94-5 (mükerrer)', 'h1 (mükerrer)']);
});
