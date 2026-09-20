import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/* Yönetim panelinin «Seviye testleri» sekmesi (public/admin/seviye-panel.js).
   Bağlayıcı sınırlar (docs/SEVIYE-TESTI.md §7, GDPR md. 9): kayıtlar CSV'ye aktarılmaz,
   ayrıntı yanıtı tarayıcı deposuna yazılmaz, toplu silme yoktur. Bu dosya onları sınar.
   Gerçek kişi verisi kullanılmaz: örnek adresler `.test`, soyad TESTOGLU. */

const REF_1 = 'ST-2099-0001';
const REF_2 = 'ST-2099-0002';

/* `sayfayiOku` gizli sütunları (Gönderim anahtarı, Cevaplar, Beyanlar, Ezberler, Not) çıkarır;
   panele gelen başlık dizisi BASLIKLAR_SEVIYE'nin kalanıdır (scripts/apps-script/seviye-testi-isleri.gs). */
const SEVIYE_BASLIKLAR = [
  'Zaman', 'Referans', 'Ad Soyad', 'E-posta', 'Telefon', 'Test dili', 'Ders dili', 'Yaş aralığı', 'Cinsiyet',
  'Müslümanlık süresi', 'Önceki eğitim', 'Hedefler', 'Müsaitlik', 'Biçim', "Kur'an düzeyi", 'Tecvid',
  "Kur'an bilgisi", 'İnanç', 'Namaz', 'İbadet', 'Siyer', 'Ahlak', 'Yüzdeler', 'Önerilen program',
  'Atlananlar', 'Süre (dk)', 'Banka sürümü', 'Rıza sürümü', 'Durum',
];

const SEVIYE_SATIR_1 = [
  '20.09.2026 14:30', REF_1, 'Deniz TESTOGLU', 'deniz@example.test', '+32 470 00 00 01', 'tr', 'fr', '25-34', 'kadin',
  '1-3-yil', 'yok', 'kuran-okuma, namaz', 'cumartesi | sabah', 'yuzyuze', '3', 'Evet',
  '1', '1', '0', '1', '1', '2', '{"kuranBilgi":55,"namaz":20}', 'C',
  '{}', '22', '3', '2026-09-20', 'Yeni | katilimci-eposta-gonderildi | imam-eposta-gonderilemedi',
];
const SEVIYE_SATIR_2 = [
  '19.09.2026 09:00', REF_2, 'Ayşe TESTOGLU', 'ayse@example.test', '', 'fr', 'fr', '35-44', 'kadin',
  'yeni', 'kurs', 'namaz', 'pazar | ogleden-sonra', 'cevrimici', '1', 'Hayır',
  '0', '1', '0', '0', '1', '1', '{"kuranBilgi":31,"namaz":10}', 'B',
  '{"siyer":true}', '18', '3', '2026-09-20', 'Yeni | katilimci-eposta-gonderildi | imam-eposta-gonderildi',
];

/* `seviyeRaporVerisi` (seviye-testi-isleri.gs l.509) alanlarının birebir karşılığı.
   `not` alanına kasten HTML konur: sunucu metni kaçışsız basılmamalıdır. */
const NOT_METNI = 'Cumartesi sabahları uygunum <b>deneme</b>';
const RAPOR = {
  ref: REF_1, zaman: '2026-09-20', adSoyad: 'Deniz TESTOGLU', eposta: 'deniz@example.test',
  telefon: '+32 470 00 00 01', testDili: 'tr', sureDk: 22, bankaSurumu: 3, rizaSurumu: '2026-09-20',
  profil: [
    { etiket: 'Yaş aralığı', deger: '25-34 yaş' },
    { etiket: 'Ders dili', deger: 'Fransızca' },
    { etiket: 'Müsaitlik', deger: 'Cumartesi' },
  ],
  okuma: {
    duzey: 3, ad: 'Harekeleri tanıyor', atlandi: false, tecvid: true,
    basamaklar: [
      { basamak: 1, dogru: 6, toplam: 6, gecti: true },
      { basamak: 4, dogru: 2, toplam: 6, gecti: false },
    ],
  },
  okumaBeyanlari: [{ id: 'by01', soru: 'Kur’an-ı Kerim’i ne kadar okuyabiliyorsunuz?', cevap: 'Yardımsız okuyabiliyorum', secim: 3, toplam: 4 }],
  celiskiler: ['Öz beyan («Yardımsız okuyabiliyorum») test sonucundan belirgin biçimde YÜKSEK: Harekeleri tanıyor.'],
  alanlar: [
    { alan: 'kuranBilgi', ad: 'Kur’an bilgisi', duzey: 1, duzeyAdi: 'Temel', yuzde: 55, atlandi: false, basamaklar: [{ basamak: 1, dogru: 3, toplam: 4, gecti: true }] },
    { alan: 'namaz', ad: 'Temizlik ve namaz', duzey: 0, duzeyAdi: 'Başlangıç', yuzde: 20, atlandi: false, basamaklar: [{ basamak: 1, dogru: 1, toplam: 6, gecti: false }] },
  ],
  yanlislar: {
    okuma: [{ id: 'ok07', basamak: 2, soru: 'Bu harfin sonda yazılışı hangisidir?', verilen: 'بـ', dogru: 'ـب' }],
    kuranBilgi: [{ id: 'kb03', basamak: 1, soru: 'Kur’an-ı Kerim kaç sûredir?', verilen: 'Bilmiyorum', dogru: '114' }],
    namaz: [],
  },
  cevapsiz: 2, dogrular: ['kb01', 'kb02'],
  mezhep: [{ id: 'nm12', alan: 'namaz', soru: 'Hanefî mezhebine göre vitir namazının hükmü nedir?', verilen: 'Sünnet', dogru: 'Vacip' }],
  ezberler: [{ id: 'ez01', ad: 'Fâtiha sûresi', durum: 'Ezbere biliyor' }],
  uygulamaBeyanlari: [{ id: 'by07', soru: 'Beş vakit namazı kılıyor musunuz?', cevap: 'Bazen', secim: 1, toplam: 3 }],
  program: { kod: 'C', ad: 'Kur’an’a geçiş + ilmihal', aciklama: 'Harf ve hareke tanıma tamam; kelime okumaya geçilir.' },
  atlananlar: [], uyarilar: ['Test çok hızlı tamamlandı (3 dk) — sonuç ihtiyatla okunmalıdır.'],
  not: NOT_METNI,
};

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const hedef = new URL(route.request().url()).origin;
    if (hedef === 'http://127.0.0.1:4401') return route.continue();
    return route.abort();
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

async function kurGeciciOturum(page, sonGoruldu) {
  await page.addInitScript((damga) => {
    localStorage.setItem('sveltia-cms.user', JSON.stringify({ token: 'test-token' }));
    localStorage.setItem('panel-oturum', JSON.stringify({ baslangic: Date.now() }));
    if (damga) localStorage.setItem('panel-son-goruldu', String(damga));
    sessionStorage.setItem('panel-sirlar', JSON.stringify({ gh: 'test-token', gas: 'test-key' }));
  }, sonGoruldu || 0);
}

/** GAS taklidi. `durum.seviyeSatirlari` koşu sırasında değiştirilebilir (silme sonrası tazeleme). */
async function gasTaklidi(page, secenekler = {}) {
  const durum = {
    seviyeSatirlari: secenekler.seviyeler || [SEVIYE_SATIR_1, SEVIYE_SATIR_2],
    seviyelerVar: secenekler.seviyelerVar !== false,
    detayYaniti: secenekler.detayYaniti || { ok: true, rapor: RAPOR },
    silYaniti: secenekler.silYaniti || { ok: true, silinen: 1 },
  };
  const gonderilenler = [];
  const detayIstekleri = [];

  await page.route('https://script.google.com/**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const govde = JSON.parse(request.postData() || '{}');
      gonderilenler.push(govde);
      if (govde.tur === 'seviye-sil') {
        if (durum.silYaniti.ok) durum.seviyeSatirlari = durum.seviyeSatirlari.filter((r) => r[1] !== govde.ref);
        return route.fulfill({ json: durum.silYaniti });
      }
      return route.fulfill({ json: { ok: true, surum: 38 } });
    }
    const islem = new URL(request.url()).searchParams.get('islem');
    if (islem === 'liste') {
      const yanit = {
        ok: true, surum: 38,
        kayitlar: {
          basliklar: ['Zaman damgası', 'Referans', 'Öğrenci adı', 'Öğrenci soyadı', 'Durum'],
          satirlar: [['18.09.2026 10:00', 'UC-2099-0001', 'Kayıt', 'TESTOGLU', 'Yeni kayıt']],
        },
        ihtidalar: { basliklar: ['Zaman damgası', 'Referans', 'Adı Soyadı'], satirlar: [] },
      };
      if (durum.seviyelerVar) yanit.seviyeler = { basliklar: SEVIYE_BASLIKLAR, satirlar: durum.seviyeSatirlari };
      return route.fulfill({ json: yanit });
    }
    if (islem === 'seviye-detay') {
      detayIstekleri.push(new URL(request.url()).searchParams.get('ref'));
      return route.fulfill({ json: durum.detayYaniti });
    }
    return route.fulfill({ json: { ok: true, surum: 38 } });
  });

  return { durum, gonderilenler, detayIstekleri };
}

async function seviyeSekmesiniAc(page) {
  await page.goto('/admin/#basvurular');
  const sekme = page.locator('#sekme-seviye');
  await expect(sekme).toBeVisible();
  await sekme.click();
  return sekme;
}

test('Seviye sekmesi kartları en yeni üstte çizer, uyarı rozetini gösterir ve CSV’yi kapatır', async ({ page }) => {
  await kurGeciciOturum(page);
  await gasTaklidi(page);
  await seviyeSekmesiniAc(page);

  const kartlar = page.locator('[data-seviye-kart]');
  await expect(kartlar).toHaveCount(2);
  await expect(kartlar.first()).toHaveAttribute('data-seviye-kart', REF_1);   // en yeni üstte

  const ilk = page.locator(`[data-seviye-kart="${REF_1}"]`);
  await expect(ilk).toContainText('Deniz TESTOGLU');
  await expect(ilk).toContainText('K3');
  await expect(ilk).toContainText('Önerilen program');
  await expect(ilk).toContainText('Türkçe');
  await expect(ilk).toContainText('Fransızca');
  await expect(ilk.locator('.rozet-durum.sorun')).toHaveText('Hoca raporu gönderilemedi');
  await expect(page.locator(`[data-seviye-kart="${REF_2}"] .rozet-durum`)).toHaveCount(0);
  await expect(page.locator(`[data-seviye-kart="${REF_2}"]`)).toContainText('Bölüm atlandı');

  await expect(page.locator('#rozet-seviye')).toHaveText('(2)');
  await expect(page.locator('#csv')).toBeDisabled();      // md. 9: seviye kayıtları dışa aktarılmaz

  /* Sekme değişince CSV düğmesi eski hâline döner. */
  await page.locator('#sekme-kayit').click();
  await expect(page.locator('#csv')).toBeEnabled();
  await page.locator('#sekme-seviye').click();
  await expect(page.locator('#csv')).toBeDisabled();
});

test('Rozet «son ziyaretten sonra gelen» kaydı sayar; arama ad/e-posta/referansla süzer', async ({ page }) => {
  await kurGeciciOturum(page, Date.UTC(2026, 8, 20, 0, 0));   // 20 Eyl 2026 gecesi görüldü
  await gasTaklidi(page);
  await seviyeSekmesiniAc(page);

  await expect(page.locator('#rozet-seviye')).toHaveText('1 yeni');

  await page.locator('#basvuru-ara').fill('ayse@example.test');
  await expect(page.locator('[data-seviye-kart]')).toHaveCount(1);
  await expect(page.locator('[data-seviye-kart]').first()).toHaveAttribute('data-seviye-kart', REF_2);

  await page.locator('#basvuru-ara').fill(REF_1);
  await expect(page.locator('[data-seviye-kart]')).toHaveCount(1);
  await expect(page.locator('[data-seviye-kart]').first()).toHaveAttribute('data-seviye-kart', REF_1);

  await page.locator('#basvuru-ara').fill('bulunmayan-kisi');
  await expect(page.locator('[data-seviye-kart]')).toHaveCount(0);
  await expect(page.locator('#basvuru-liste')).toContainText('Aramaya uyan seviye testi yok');
});

test('Eski arka uçta (seviyeler alanı yok) sekme bilgilendirir; kayıt akışı bozulmaz', async ({ page }) => {
  await kurGeciciOturum(page);
  await gasTaklidi(page, { seviyelerVar: false });
  await seviyeSekmesiniAc(page);

  await expect(page.locator('#basvuru-liste')).toContainText('Arka uç güncellemesi bekleniyor');
  await expect(page.locator('#rozet-seviye')).toHaveText('');

  await page.locator('#sekme-kayit').click();
  await expect(page.locator('.bkart-ad').first()).toHaveText('Kayıt TESTOGLU');
});

test('Ayrıntı penceresinin ilk başlığı Kur’an okuma düzeyidir; veri kaçırılır ve depoya yazılmaz', async ({ page }) => {
  await kurGeciciOturum(page);
  const { detayIstekleri } = await gasTaklidi(page);
  await seviyeSekmesiniAc(page);

  const dugme = page.locator(`[data-seviye-detay="${REF_1}"]`);
  await dugme.click();

  const pencere = page.locator('dialog.sv-ayrinti');
  await expect(pencere).toBeVisible();
  await expect(pencere.locator('h2')).toHaveText(`Seviye tespiti — ${REF_1}`);
  await expect(pencere.locator('h2')).toBeFocused();
  await expect(pencere.locator('.sv-bolum h3').first()).toHaveText('Kur’an okuma düzeyi');
  expect(detayIstekleri).toEqual([REF_1]);

  await expect(pencere).toContainText('Harekeleri tanıyor');
  await expect(pencere).toContainText('K3');
  await expect(pencere).toContainText('Tecvid kavramları');
  await expect(pencere).toContainText('K1: 6/6 — geçti');
  await expect(pencere).toContainText('Beyan ile sonuç çelişiyor');
  await expect(pencere).toContainText('Temizlik ve namaz');
  await expect(pencere).toContainText('Cevapsız madde');
  await expect(pencere).toContainText('Hanefî mezhebine göre');
  await expect(pencere).toContainText('Fâtiha sûresi');
  await expect(pencere).toContainText('Kur’an’a geçiş + ilmihal');
  await expect(pencere).toContainText('Test çok hızlı tamamlandı');

  /* Yanlış maddeler alan alan tablodadır; Arapça şıklar yön bilgisiyle yazılır. */
  const kb03 = pencere.locator('tr', { hasText: 'kb03' });
  await expect(kb03).toContainText('Bilmiyorum');
  await expect(kb03).toContainText('114');
  const arapca = pencere.locator('.sv-ar').first();
  await expect(arapca).toHaveAttribute('lang', 'ar');
  await expect(arapca).toHaveAttribute('dir', 'rtl');

  /* Sunucudan gelen metin kaçışsız basılmaz: not düz metin olarak görünür, <b> öğesi oluşmaz. */
  await expect(pencere.locator('.sv-not')).toHaveText(NOT_METNI);
  expect(await pencere.locator('.sv-not b').count()).toBe(0);

  /* md. 9: ayrıntı yanıtı hiçbir tarayıcı deposuna yazılmaz (liste önbelleği ayrı bir karardır). */
  const depolar = await page.evaluate(() => JSON.stringify({ s: { ...sessionStorage }, l: { ...localStorage } }));
  for (const iz of ['Harekeleri tanıyor', 'kb03', 'Bilmiyorum', NOT_METNI, 'Fâtiha']) {
    expect(depolar, `«${iz}» tarayıcı deposuna yazılmamalı`).not.toContain(iz);
  }

  /* Esc kapatır, odak tetikleyen düğmeye döner. */
  await page.keyboard.press('Escape');
  await expect(pencere).toHaveCount(0);
  await expect(dugme).toBeFocused();
});

test('Ayrıntı alınamazsa pencere anlaşılır hata gösterir', async ({ page }) => {
  await kurGeciciOturum(page);
  await gasTaklidi(page, { detayYaniti: { ok: false, hata: 'bulunamadi' } });
  await seviyeSekmesiniAc(page);

  await page.locator(`[data-seviye-detay="${REF_1}"]`).click();
  const pencere = page.locator('dialog.sv-ayrinti');
  await expect(pencere.locator('[data-sv-durum]')).toContainText('Ayrıntı alınamadı');
  await expect(pencere.locator('[data-sv-durum]')).toContainText('defterde bulunamadı');
  await pencere.locator('[data-sv-kapat]').click();
  await expect(pencere).toHaveCount(0);
});

test('Silme ikinci onay ister, referansı yazdırır ve seviye-sil gövdesini doğru yollar', async ({ page }) => {
  await kurGeciciOturum(page);
  const { gonderilenler } = await gasTaklidi(page);
  await seviyeSekmesiniAc(page);

  const silDugmesi = page.locator(`[data-seviye-sil="${REF_1}"]`);
  await silDugmesi.click();

  const onay = page.locator('dialog.sv-onay');
  await expect(onay).toBeVisible();
  await expect(onay).toContainText(REF_1);              // ikinci onay referansı yazdırır
  await expect(onay).toContainText('geri alınamaz');
  await expect(onay.locator('[data-sv-vazgec]')).toBeFocused();
  expect(gonderilenler).toHaveLength(0);                // onaysız hiçbir şey gönderilmez

  /* Vazgeçince istek gitmez ve odak geri döner. */
  await onay.locator('[data-sv-vazgec]').click();
  await expect(onay).toHaveCount(0);
  await expect(silDugmesi).toBeFocused();
  expect(gonderilenler).toHaveLength(0);

  await silDugmesi.click();
  await page.locator('dialog.sv-onay [data-sv-onayla]').click();
  await expect(page.locator('dialog.sv-onay')).toHaveCount(0);

  expect(gonderilenler).toHaveLength(1);
  expect(gonderilenler[0]).toEqual({ tur: 'seviye-sil', ref: REF_1, anahtar: 'test-key' });

  /* Silinen kayıt tazelemeden sonra listeden kalkar; ötekine dokunulmaz (toplu silme yok). */
  await expect(page.locator(`[data-seviye-kart="${REF_1}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-seviye-kart="${REF_2}"]`)).toHaveCount(1);
  /* Odak gövdeye düşmez: kalan ilk kaydın eylemine taşınır. */
  await expect(page.locator(`[data-seviye-detay="${REF_2}"]`)).toBeFocused();
});

test('Silme başarısızsa kayıt listede kalır ve pencere hatayı söyler', async ({ page }) => {
  await kurGeciciOturum(page);
  await gasTaklidi(page, { silYaniti: { ok: false, hata: 'yetkisiz' } });
  await seviyeSekmesiniAc(page);

  await page.locator(`[data-seviye-sil="${REF_1}"]`).click();
  await page.locator('dialog.sv-onay [data-sv-onayla]').click();
  await expect(page.locator('dialog.sv-onay [data-sv-onay-durum]')).toContainText('Silinemedi');
  await page.locator('dialog.sv-onay [data-sv-vazgec]').click();
  await expect(page.locator(`[data-seviye-kart="${REF_1}"]`)).toHaveCount(1);
});

test('Liste ve ayrıntı 360 px’te taşmaz; axe serious/critical bulgusu yok (açık ve koyu tema)', async ({ page }) => {
  await kurGeciciOturum(page);
  await gasTaklidi(page);
  await page.setViewportSize({ width: 360, height: 900 });
  await seviyeSekmesiniAc(page);
  await expect(page.locator('[data-seviye-kart]')).toHaveCount(2);

  const agir = (sonuc) => sonuc.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  const alan = page.locator('#basvuru-alan');
  expect(await alan.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'liste 360 px’te taşmamalı').toBe(true);

  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema });
    expect(agir(await new AxeBuilder({ page }).include('#basvuru-alan').analyze())).toEqual([]);
  }

  await page.locator(`[data-seviye-detay="${REF_1}"]`).click();
  const pencere = page.locator('dialog.sv-ayrinti');
  await expect(pencere.locator('.sv-bolum h3').first()).toBeVisible();
  expect(await pencere.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'ayrıntı penceresi 360 px’te taşmamalı').toBe(true);

  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema });
    expect(agir(await new AxeBuilder({ page }).include('dialog.sv-ayrinti').analyze())).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: 'light' });
});
