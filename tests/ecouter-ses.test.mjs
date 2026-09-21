import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const veri = json('src/data/ecouter.json');
const kaynaklar = json('docs/dinleme-ses-kaynaklari.json');
const resmi = json('tests/fixtures/elifba-resmi-eslesmeler.json');
const hash = (path) => createHash('sha256').update(readFileSync(new URL('public' + path, root))).digest('hex');

test('112 harf/hareke kaydı resmî metin, kaynak ve ses özetiyle eşleşir', () => {
  assert.equal(Object.keys(resmi).length, 112);
  for (const [path, r] of Object.entries(resmi)) {
    assert.equal(kaynaklar[path].kaynak, r.kaynak, path);
    assert.equal(hash(path), r.sha256, path);
  }
  for (const kod of ['alphabet', 'fatha', 'kasra', 'damma']) {
    assert.equal(veri.kodlar[kod].ogeler.length, 28);
    for (const o of veri.kodlar[kod].ogeler) assert.equal(o.ar, resmi[o.ses].metin, o.ses);
  }
  // Önceki hata: üstün klasöründe harf adları; benzer görünen adlar testi kandıramaz.
  for (const o of veri.kodlar.fatha.ogeler) {
    assert.match(kaynaklar[o.ses].kaynak, /\/fetha\/fetha\/btn_\d+\.mp3$/);
    assert.notEqual(hash(o.ses), hash(o.ses.replace('/ustun/', '/')));
  }
});

test('Her ses dosyası vardır ve belgelenmiş kayıtların özeti değişmemiştir', () => {
  for (const ders of Object.values(veri.kodlar)) {
    for (const p of [ders.tam, ders.besmele, {ses:ders.metinSesi}, ...(ders.ogeler ?? []), ...(ders.satirlar ?? [])].filter((p) => p?.ses)) {
      assert.ok(existsSync(new URL('public' + p.ses, root)), p.ses);
      if (p.ses.includes('/elifba/')) assert.ok(kaynaklar[p.ses], p.ses);
    }
  }
  for (const [path, r] of Object.entries(kaynaklar)) assert.equal(hash(path), r.sha256, path);
});

test('13 sûre ve 3 rehberli okuma numarasız, resmî besmeleyle başlar; Fâtiha çiftlenmez', () => {
  const beklenen = ['insirah','kadir','asr','fil','kureys','maun','kevser','kafirun','nasr','tebbet','ihlas','felak','nas','e81','e85','e86'];
  assert.deepEqual(Object.keys(veri.kodlar).filter(k=>veri.kodlar[k].besmele).sort(), beklenen.sort());
  const {no, ...besmele} = veri.kodlar.fatiha.satirlar[0];
  for (const kod of beklenen) {
    assert.deepEqual(veri.kodlar[kod].besmele, besmele, kod);
    assert.equal(veri.kodlar[kod].besmele.no, undefined, kod);
  }
  assert.deepEqual(veri.kodlar.asr.satirlar.map(s=>s.no),[1,2,3]);
  assert.equal(veri.kodlar.fatiha.satirlar.length,7);
  assert.equal(veri.kodlar.e76.ogeler.length,7);
  assert.equal(veri.kodlar['ayetel-kursi'].metinSesi,'/media/ses/ayet/2-255.mp3');
});

test('Kısa–uzun karşılaştırmasında tek kayıt tek düğmede iki heceyi gösterir', () => {
  const ogeler = veri.kodlar.e09.ogeler;
  assert.equal(ogeler.length, 28);
  for (const o of ogeler) assert.match(o.ar, / — /);
  assert.equal(new Set(ogeler.map((o) => kaynaklar[o.ses].kaynak)).size, 28);
});

test('Tam sûreler eûzü, tek besmele ve eksiksiz âyet sırasıyla üretilir', () => {
  const sureler = {fatiha:[1,7],insirah:[94,8],kadir:[97,5],asr:[103,3],fil:[105,5],kureys:[106,4],maun:[107,7],kevser:[108,3],kafirun:[109,6],nasr:[110,3],tebbet:[111,5],ihlas:[112,4],felak:[113,5],nas:[114,6]};
  for (const [kod,[s,n]] of Object.entries(sureler)) {
    const r=kaynaklar[veri.kodlar[kod].tam.ses];
    const expected=['/media/ses/ayet/1-0.mp3',...(s===1?[]:['/media/ses/ayet/1-1.mp3']),...Array.from({length:n},(_,i)=>`/media/ses/ayet/${s}-${i+1}.mp3`)];
    assert.deepEqual(r.parcalar,expected,kod);
    assert.equal(r.parcalar.filter(p=>p==='/media/ses/ayet/1-1.mp3').length,1,kod);
    for(const p of r.parcalar) assert.match(kaynaklar[p].kaynak,/^https:\/\/webdosya\.diyanet\.gov\.tr\/kuran\/kuranikerim\/Sound\/ar_OsmanSahin\//);
    assert.ok(r.pcmOrnek>0);assert.match(r.pcmSha256,/^[a-f0-9]{64}$/);
  }
  assert.deepEqual(kaynaklar[veri.kodlar['ayetel-kursi'].tam.ses].parcalar,['/media/ses/ayet/1-0.mp3','/media/ses/ayet/1-1.mp3','/media/ses/ayet/2-255.mp3']);
  assert.ok(veri.surum>=3,'Eski sesler tarayıcı önbelleğinden ayrılmalı');
});

test('Kunut sınırı son cümleyi korur; sabah ezanı ve uzun ezan duası metinle eşleşir',()=>{
  assert.deepEqual(kaynaklar['/media/ses/dualar/kunut-1.mp3'].kesim,[0,29.4]);
  assert.deepEqual(kaynaklar['/media/ses/dualar/kunut-2.mp3'].kesim,[29.4,50.3208]);
  assert.equal(kaynaklar['/media/ses/dualar/kunut-1.mp3'].ozgunSha256,kaynaklar['/media/ses/dualar/kunut-2.mp3'].ozgunSha256);
  assert.match(kaynaklar[veri.kodlar.ezan.tam.ses].kaynak,/\/Sabah_Ezani_Saba\.mp3$/);
  const ar=veri.kodlar['ezan-duasi'].satirlar.map(s=>s.ar).join(' ').normalize('NFD').replace(/[\u064B-\u065F\u0670]/g,'');
  assert.match(ar,/والدرجة الرفيعة/);assert.match(ar,/لا تخلف الميعاد/);
});
