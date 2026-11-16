// İlim Yolu Dilim 2 — Apps Script kuyruk boşaltıcı (scripts/apps-script/ilim-yolu-eposta.gs). Emülatör gerekmez: Firestore REST ve Brevo
// bellek içi taklit; gerçek Apps Script dosyaları (kimlik + şablon + ana kod + portal + bu modül) bir vm bağlamında yüklenir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const kaynak = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v49.gs', 'veli-mail-listesi.gs', 'ilim-yolu-eposta.gs']
  .map((ad) => readFileSync(new URL('../../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');

const SAAT = 3_600_000;
const BASE = 'projects/ulucamii-portal/databases/(default)/documents';
const deger = (x) => {
  if (x && typeof x === 'object' && 't' in x) return { timestampValue: x.t };
  if (typeof x === 'string') return { stringValue: x };
  if (typeof x === 'number') return { integerValue: String(x) };
  return { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, v]) => [k, deger(v)])) } };
};
const duz = (alanlar) => Object.fromEntries(Object.entries(alanlar).map(([k, v]) => [k, v.stringValue ?? (v.integerValue !== undefined ? Number(v.integerValue) : v.timestampValue)]));

function ortam({ hesap = 'ulucamii2026@gmail.com' } = {}) {
  const props = { BREVO_API_KEY: 'test-anahtar' };
  const docs = {}; // id → {fields, updateTime}
  const brevo = []; // gönderilen yükler
  const durum = { brevoHata: 0, yarisKaybet: false, sayac: 0, yazimlar: [] };
  const yanit = (kod, govde) => ({ getResponseCode: () => kod, getContentText: () => JSON.stringify(govde ?? {}) });
  const x = vm.createContext({
    console: { log() {}, error() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => hesap }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    ScriptApp: { getOAuthToken: () => 'belirtec', requireAllScopes() {}, AuthMode: { FULL: 1 } },
    Utilities: { formatDate: (d, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d), base64Encode: (b) => Buffer.from(b).toString('base64') },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    MailApp: { sendEmail() { throw new Error('MailApp yedeği kullanılmamalı'); } },
    UrlFetchApp: {
      fetch(url, o = {}) {
        if (url === 'https://api.brevo.com/v3/smtp/email') {
          if (durum.brevoHata > 0) { durum.brevoHata--; return yanit(500, { message: 'x' }); }
          brevo.push(JSON.parse(o.payload)); return yanit(201, { messageId: 'm' });
        }
        const kok = 'https://firestore.googleapis.com/v1/' + BASE;
        assert.ok(url.startsWith(kok), url);
        if (url === kok + ':runQuery') {
          const f = JSON.parse(o.payload).structuredQuery, sinir = f.limit;
          const eslesen = f.where.compositeFilter.filters.map((q) => [q.fieldFilter.field.fieldPath, q.fieldFilter.value.stringValue]);
          const sonuc = Object.entries(docs)
            .filter(([, d]) => eslesen.every(([alan, v]) => d.fields[alan]?.stringValue === v)).slice(0, sinir)
            .map(([id, d]) => ({ document: { name: `${kok}/epostaKuyrugu/${id}`, fields: d.fields, updateTime: d.updateTime } }));
          return yanit(200, sonuc.length ? sonuc : [{ readTime: 'x' }]);
        }
        const m = /^.*\/epostaKuyrugu\/([^?]+)\?(.*)$/.exec(url);
        assert.ok(m && o.method === 'patch', url);
        const q = new URLSearchParams(m[2]);
        const d = docs[decodeURIComponent(m[1])];
        if (!d) return yanit(404);
        const onkosul = q.get('currentDocument.updateTime');
        if (onkosul && (durum.yarisKaybet || onkosul !== d.updateTime)) return yanit(400, { error: { status: 'FAILED_PRECONDITION' } });
        const govde = JSON.parse(o.payload).fields;
        for (const alan of q.getAll('updateMask.fieldPaths')) { if (alan in govde) d.fields[alan] = govde[alan]; else delete d.fields[alan]; }
        d.updateTime = `2026-11-08T17:00:${String(++durum.sayac).padStart(2, '0')}Z`;
        durum.yazimlar.push(q.getAll('updateMask.fieldPaths'));
        return yanit(200, {});
      },
    },
  });
  vm.runInContext(kaynak, x);
  const ekle = (id, ek = {}) => {
    const v = {
      tur: 'haftalik', uid: id, eposta: `${id}@example.test`, dil: 'tr', ad: 'ali.veli', durum: 'bekliyor', deneme: 0,
      ozet: { gun: 2, madde: 5, tekrar: 1, sonraki: 'tekrar' }, baglanti: 'https://egitim.ulucamii.be/tr/',
      abonelik: `https://egitim.ulucamii.be/api/abonelik-cik?k=${id}.1.abc`, zaman: { t: new Date().toISOString() }, ...ek,
    };
    docs[`h_${id}_2026-W45`] = { fields: Object.fromEntries(Object.entries(v).filter(([, s]) => s !== undefined).map(([k, s]) => [k, deger(s)])), updateTime: '2026-11-08T17:00:00Z' };
    return `h_${id}_2026-W45`;
  };
  const oku = (id) => duz(docs[id].fields);
  return { x, props, docs, brevo, durum, ekle, oku };
}

test('içerik: beş dilde kurumsal «kurs» şablonu, @kullanıcıAdı selamı, tek tıkla çıkış başlıkları; geçersiz alan reddedilir', () => {
  const { x } = ortam();
  const ozet = { gun: 3, madde: 12, tekrar: 0, sonraki: 'devam' };
  const taban = { ad: 'ali.veli', ozet, baglanti: 'https://egitim.ulucamii.be/tr/', abonelik: 'https://egitim.ulucamii.be/api/abonelik-cik?k=u1.99.imza' };
  const selamlar = { tr: 'Selâm @ali.veli,', fr: 'Bonjour @ali.veli,', en: 'Hello @ali.veli,', nl: 'Hallo @ali.veli,', de: 'Hallo @ali.veli,' };
  const konular = new Set();
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    const i = x.ilimYoluEpostaIcerik({ ...taban, dil });
    konular.add(i.subject);
    assert.ok(i.body.includes(selamlar[dil]), dil);
    assert.ok(i.htmlBody.includes('data-eposta-sablon="v2"') && i.htmlBody.includes('data-kurum="kurs"') && i.htmlBody.includes(`lang="${dil}"`), dil);
    assert.ok(i.htmlBody.includes('@ali.veli,') && i.htmlBody.includes('api/abonelik-cik?k=u1.99.imza'), dil);
    assert.equal(i.headers['List-Unsubscribe'], `<${taban.abonelik}>`);
    assert.equal(i.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
    assert.doesNotMatch(i.body + i.htmlBody, /\*\*|undefined|NaN/, dil);
  }
  assert.equal(konular.size, 5);
  assert.match(x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr' }).body, /3 gün/);
  assert.match(x.ilimYoluEpostaIcerik({ ...taban, dil: 'fr', ozet: { ...ozet, gun: 1 } }).body, /1 jour(?!s)/);
  assert.match(x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr', ozet: { gun: 0, madde: 0, tekrar: 0, sonraki: 'ezber' } }).body, /henüz çalışmadınız/);

  // Güvenilmeyen alanlar: kullanıcı adı biçimi, bağlantı kökü, bilinmeyen adım.
  assert.ok(x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr', ad: '<script>x</script>' }).body.startsWith('Selâm,'));
  assert.throws(() => x.ilimYoluEpostaIcerik({ ...taban, dil: 'xx' }), /ilim-eposta-dil/);
  assert.throws(() => x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr', baglanti: 'https://kotu.example/tr/' }), /ilim-eposta-baglanti/);
  assert.throws(() => x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr', abonelik: 'https://kotu.example/api/abonelik-cik?k=a' }), /ilim-eposta-abonelik/);
  assert.throws(() => x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr', abonelik: 'https://egitim.ulucamii.be/api/abonelik-cik?k=a b' }), /ilim-eposta-abonelik/);
  assert.match(x.ilimYoluEpostaIcerik({ ...taban, dil: 'tr', ozet: { gun: 99, madde: -5, tekrar: 'x', sonraki: 'hack' } }).body, /7 gün/);
});

test('boşaltma: gönderir (kurs kimliği + List-Unsubscribe), belgeyi gonderildi yapar, e-posta adresini siler; ikinci tur tekrar göndermez', () => {
  const o = ortam();
  const id = o.ekle('u1', { dil: 'fr' });
  const s = o.x.ilimYoluEpostaIsle({});
  assert.equal(s.gonderilen, 1);
  assert.equal(o.brevo.length, 1);
  const p = o.brevo[0];
  assert.deepEqual(p.to, [{ email: 'u1@example.test' }]);
  assert.equal(p.sender.email, o.x.KIMLIK.kurumlar.kurs.epostaAdresi);
  assert.equal(p.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  assert.match(p.headers['List-Unsubscribe'], /^<https:\/\/egitim\.ulucamii\.be\/api\/abonelik-cik\?k=u1\.1\.abc>$/);
  assert.match(p.subject, /résumé/);
  assert.equal(p.cc, undefined, 'veli Cc\'si bu postaya eklenmez');
  const belge = o.oku(id);
  assert.equal(belge.durum, 'gonderildi');
  assert.ok(belge.gonderim);
  assert.equal(belge.eposta, undefined, 'kişisel veri silindi');
  assert.equal(belge.abonelik, undefined);
  assert.equal(belge.uid, 'u1', 'belge TTL\'e kadar kalır (aynı hafta yeniden kuyruğa girmez)');

  assert.equal(o.x.ilimYoluEpostaIsle({}).gonderilen, 0);
  assert.equal(o.brevo.length, 1);
});

test('boşaltma: Brevo hatasında kilit geri alınır, 30 dk beklenir, 5 denemeden sonra basarisiz (adres silinir); yeniden göndermede kopya yok', () => {
  const o = ortam();
  const id = o.ekle('u1');
  o.durum.brevoHata = 99;
  let s = o.x.ilimYoluEpostaIsle({});
  assert.equal(s.hata, 1);
  assert.deepEqual([o.oku(id).durum, o.oku(id).deneme], ['bekliyor', 1]);
  assert.ok(o.oku(id).eposta, 'tekrar deneme için adres duruyor');

  s = o.x.ilimYoluEpostaIsle({}); // hemen: bekleme süresi
  assert.equal(s.hata, 0);
  assert.equal(s.bekleyen, 1);

  for (let i = 2; i <= 5; i++) {
    o.docs[id].fields.sonDeneme = deger({ t: new Date(Date.now() - SAAT).toISOString() });
    o.x.ilimYoluEpostaIsle({});
    assert.equal(o.oku(id).deneme, i);
  }
  assert.equal(o.oku(id).durum, 'basarisiz');
  assert.equal(o.oku(id).eposta, undefined);
  assert.equal(o.brevo.length, 0);
  // Belge artık «bekliyor» değil: sonraki turlar dokunmaz.
  o.durum.brevoHata = 0;
  assert.equal(o.x.ilimYoluEpostaIsle({}).bakilan, 0);
});

test('boşaltma: Brevo bir kez düşüp sonra çalışırsa tek ileti gider', () => {
  const o = ortam();
  const id = o.ekle('u1');
  o.durum.brevoHata = 1;
  o.x.ilimYoluEpostaIsle({});
  o.docs[id].fields.sonDeneme = deger({ t: new Date(Date.now() - SAAT).toISOString() });
  o.x.ilimYoluEpostaIsle({});
  o.x.ilimYoluEpostaIsle({});
  assert.equal(o.brevo.length, 1);
  assert.equal(o.oku(id).durum, 'gonderildi');
});

test('boşaltma: günlük sınır aşılmaz; kalanlar bekliyor kalır ve sayaç Brüksel gününe bağlıdır', () => {
  const o = ortam();
  o.props.ILIM_YOLU_EPOSTA_GUNLUK_SINIR = '2';
  const idler = ['a1', 'a2', 'a3', 'a4'].map((u) => o.ekle(u));
  const s = o.x.ilimYoluEpostaIsle({});
  assert.equal(s.gonderilen, 2);
  assert.equal(s.sinir, true);
  assert.equal(idler.filter((i) => o.oku(i).durum === 'bekliyor').length, 2);
  assert.equal(JSON.parse(o.props.ILIM_YOLU_EPOSTA_GUNLUK).n, 2);
  assert.equal(o.x.ilimYoluEpostaIsle({}).gonderilen, 0, 'aynı gün ikinci tur gönderemez');

  o.props.ILIM_YOLU_EPOSTA_GUNLUK = JSON.stringify({ gun: '2000-01-01', n: 99 }); // dünün sayacı sıfırlanır
  assert.equal(o.x.ilimYoluEpostaIsle({}).gonderilen, 2);
  assert.equal(o.brevo.length, 4);
});

test('boşaltma: 48 saatten eski özet gönderilmez; geçersiz belge işaretlenir; takılı kilit belirsiz olur ve yeniden gönderilmez', () => {
  const o = ortam();
  const eski = o.ekle('e1', { zaman: { t: new Date(Date.now() - 49 * SAAT).toISOString() } });
  const kotu = o.ekle('k1', { baglanti: 'https://kotu.example/' });
  const adressiz = o.ekle('k2', { eposta: 'bu-bir-adres-degil' });
  const takili = o.ekle('t1', { durum: 'gonderiliyor', talepZamani: { t: new Date(Date.now() - 3 * SAAT).toISOString() } });
  const taze = o.ekle('t2', { durum: 'gonderiliyor', talepZamani: { t: new Date(Date.now() - 10 * 60_000).toISOString() } });
  const s = o.x.ilimYoluEpostaIsle({});
  assert.deepEqual([s.eski, s.gecersiz, s.belirsiz, s.gonderilen], [1, 2, 1, 0]);
  assert.equal(o.oku(eski).durum, 'eski');
  assert.equal(o.oku(kotu).durum, 'gecersiz');
  assert.equal(o.oku(adressiz).durum, 'gecersiz');
  assert.equal(o.oku(takili).durum, 'belirsiz');
  assert.equal(o.oku(taze).durum, 'gonderiliyor', 'henüz yeni kilit: dokunulmaz');
  for (const i of [eski, kotu, adressiz, takili]) assert.equal(o.oku(i).eposta, undefined, i);
  assert.equal(o.brevo.length, 0);
});

test('boşaltma: kilit yarışı kaybedilirse (updateTime önkoşulu) ileti gitmez', () => {
  const o = ortam();
  const id = o.ekle('u1');
  o.durum.yarisKaybet = true;
  const s = o.x.ilimYoluEpostaIsle({});
  assert.equal(s.gonderilen, 0);
  assert.equal(o.brevo.length, 0);
  assert.equal(o.oku(id).durum, 'bekliyor');
});

test('boşaltma: kuru tur hiçbir şey yazmaz/göndermez; başka hesapla çalışmaz; başka tür belgeye dokunmaz', () => {
  const o = ortam();
  const id = o.ekle('u1');
  o.ekle('h9', { tur: 'hareketsiz' });
  o.docs.x1 = { fields: { tur: deger('hareketsiz'), durum: deger('bekliyor') }, updateTime: 'x' }; // kimliği biçime uymaz
  const once = JSON.stringify(o.docs);
  const s = o.x.ilimYoluEpostaIsle({ kuru: true });
  assert.equal(s.kuru, true);
  assert.equal(s.bakilan, 1);
  assert.equal(JSON.stringify(o.docs), once);
  assert.equal(o.brevo.length, 0);
  assert.equal(o.oku(id).durum, 'bekliyor');

  const baska = ortam({ hesap: 'kisisel@example.test' });
  baska.ekle('u1');
  assert.throws(() => baska.x.ilimYoluEpostaIsle({}), /portal-dernek-hesabi-gerekli/);
  assert.equal(baska.brevo.length, 0);
});

// ── Hareketsiz hesap uyarısı (hesap.ts hareketsizTara → epostaKuyrugu/z_<uid>) aynı boşaltıcıdan gider ──
function hareketsizEkle(o, uid, ek = {}) {
  const v = {
    tur: 'hareketsiz', uid, eposta: `${uid}@example.test`, dil: 'tr', ad: 'ali.veli', durum: 'bekliyor', deneme: 0,
    baglanti: 'https://egitim.ulucamii.be/tr/hesap/giris/', zaman: { t: new Date().toISOString() }, ...ek,
  };
  o.docs[`z_${uid}`] = { fields: Object.fromEntries(Object.entries(v).map(([k, s]) => [k, deger(s)])), updateTime: '2026-11-08T17:00:00Z' };
  return `z_${uid}`;
}

test('hareketsiz içerik: beş dilde, hitap «siz»/vous/u/Sie, giriş bağlantısı, abonelik başlığı YOK; geçersiz alan reddedilir', () => {
  const { x } = ortam();
  const taban = { ad: 'ali.veli', baglanti: 'https://egitim.ulucamii.be/tr/hesap/giris/' };
  const beklenen = { tr: /hesabınız[\s\S]*30 gün/, fr: /votre compte[\s\S]*30 jours/, en: /your account[\s\S]*30 days/, nl: /uw account[\s\S]*30 dagen/, de: /Ihr Konto[\s\S]*30 Tagen/ };
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    const i = x.ilimYoluHareketsizIcerik({ ...taban, dil, baglanti: taban.baglanti.replace('/tr/', `/${dil}/`) });
    assert.match(i.body, beklenen[dil], dil);
    assert.ok(i.body.includes(`/${dil}/hesap/giris/`), dil);
    assert.ok(i.htmlBody.includes('@ali.veli,') && i.htmlBody.includes(`<html lang="${dil}"`) || i.htmlBody.includes(`lang="${dil}"`), dil);
    assert.equal(i.headers, undefined, 'hesap güvenliği bildirimi: List-Unsubscribe yok');
    assert.ok(!i.body.includes('abonelik-cik'));
  }
  assert.throws(() => x.ilimYoluHareketsizIcerik({ ...taban, dil: 'xx' }), /ilim-eposta-dil/);
  assert.throws(() => x.ilimYoluHareketsizIcerik({ ...taban, dil: 'tr', baglanti: 'https://kotu.example/' }), /ilim-eposta-baglanti/);
});

test('boşaltma: hareketsiz uyarı haftalıktan ÖNCE gider, aynı günlük sınırı paylaşır, adres silinir; 20 güne kadar bayatlamaz', () => {
  const o = ortam();
  o.props.ILIM_YOLU_EPOSTA_GUNLUK_SINIR = '1';
  const hz = hareketsizEkle(o, 'e1', { zaman: { t: new Date(Date.now() - 10 * 24 * SAAT).toISOString() } });
  const hf = o.ekle('w1');
  let s = o.x.ilimYoluEpostaIsle({});
  assert.equal(s.gonderilen, 1);
  assert.equal(s.sinir, true);
  assert.equal(o.oku(hz).durum, 'gonderildi', '10 günlük hareketsiz uyarı hâlâ gider');
  assert.equal(o.oku(hz).eposta, undefined);
  assert.equal(o.oku(hf).durum, 'bekliyor', 'haftalık sınırdan sonra kalır');
  assert.equal(o.brevo[0].to[0].email, 'e1@example.test');
  assert.equal(o.brevo[0].headers, undefined);
  assert.match(o.brevo[0].subject, /hesabınız silinmek üzere/);

  const eski = hareketsizEkle(o, 'e2', { zaman: { t: new Date(Date.now() - 21 * 24 * SAAT).toISOString() } });
  o.props.ILIM_YOLU_EPOSTA_GUNLUK = JSON.stringify({ gun: '2000-01-01', n: 99 });
  s = o.x.ilimYoluEpostaIsle({});
  assert.equal(o.oku(eski).durum, 'eski');
  assert.equal(o.oku(hf).durum, 'gonderildi');
  assert.equal(s.eski, 1);
});

test('boşaltma: hareketsiz belgesi geçersizse işaretlenir; haftalık kimlikli belge hareketsiz türüyle işlenmez', () => {
  const o = ortam();
  const kotu = hareketsizEkle(o, 'k1', { baglanti: 'https://kotu.example/' });
  const adressiz = hareketsizEkle(o, 'k2', { eposta: 'adres-degil' });
  const s = o.x.ilimYoluEpostaIsle({});
  assert.equal(s.gecersiz, 2);
  assert.equal(o.oku(kotu).durum, 'gecersiz');
  assert.equal(o.oku(adressiz).durum, 'gecersiz');
  assert.equal(o.brevo.length, 0);
});
