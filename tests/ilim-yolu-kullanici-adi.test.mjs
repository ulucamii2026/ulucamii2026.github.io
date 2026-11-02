/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — kullanıcı adı biçimi (src/lib/ilim-yolu/kullanici-adi.ts): normalleştirme, kalıp, öneri.
 * Ayrılmış adlar yalnız sunucuda: bu dosya tarayıcı paketine girer, liste burada bulunmamalı.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ilim-yolu-kullanici-adi-test.mjs');
await build({
  entryPoints: ['src/lib/ilim-yolu/kullanici-adi.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(cikti).href);

test('normalize: NFKC, kırpma, küçük harf; İ → i (birleşen nokta yok), I → i, ı kalır', () => {
  assert.equal(m.normalize('  Ali.Veli  '), 'ali.veli');
  assert.equal(m.normalize('İSMAİL'), 'ismail');
  assert.equal(m.normalize('İSMAİL').includes('̇'), false);
  assert.equal(m.normalize('IRMAK'), 'irmak');
  assert.equal(m.normalize('ırmak'), 'ırmak');
  assert.equal(m.normalize('Ａｌｉ１２'), 'ali12', 'tam genişlikli harfler');
  assert.equal(m.normalize('Kerim'), 'kerim', 'Kelvin işareti → k');
  assert.equal(m.normalize(undefined), '');
});

test('gecerliMi: kalıp ^[a-z0-9][a-z0-9._-]{2,23}$ ve nedenler', () => {
  for (const ad of ['ali', 'a1b', 'ahmet.yilmaz', 'x_y-z', '007', 'a'.repeat(24), '  Ali  ', 'İSMAİL']) {
    const s = m.gecerliMi(ad);
    assert.equal(s.ok, true, ad);
    assert.equal(s.ad, m.normalize(ad));
  }
  const neden = (ad) => m.gecerliMi(ad).neden;
  assert.equal(neden(''), 'kisa');
  assert.equal(neden('ab'), 'kisa');
  assert.equal(neden('  ab  '), 'kisa');
  assert.equal(neden('a'.repeat(25)), 'uzun');
  assert.equal(neden('.ali'), 'bas');
  assert.equal(neden('_ali'), 'bas');
  assert.equal(neden('-ali'), 'bas');
  assert.equal(neden('ırmak'), 'bas');
  assert.equal(neden('ali veli'), 'karakter');
  assert.equal(neden('şükrü'), 'bas');
  assert.equal(neden('aşkın'), 'karakter');
  assert.equal(neden('ali@x'), 'karakter');
  assert.equal(neden('ali/../x'), 'karakter');
  assert.equal(neden('ali\u0000x'), 'karakter');
  assert.equal(m.gecerliMi('ali').ok, true);
});

test('oneri: Türkçe harfler çevrilir, diğer aksanlar atılır, sonuç ya boş ya geçerli', () => {
  assert.equal(m.oneri('Ahmet Yılmaz'), 'ahmet.yilmaz');
  assert.equal(m.oneri('İSMAİL Şükrü Öğüç'), 'ismail.sukru.oguc');
  assert.equal(m.oneri('ıışşğğüüööççââîîûû'), 'iissgguuooccaaiiuu');
  assert.equal(m.oneri('Rémi Dupré'), 'remi.dupre');
  assert.equal(m.oneri('Jean-Pierre'), 'jean-pierre');
  assert.equal(m.oneri("O'Brien"), 'obrien');
  assert.equal(m.oneri('Straße'), 'strasse');
  assert.equal(m.oneri('  ...Ali  '), 'ali');
  assert.equal(m.oneri('Ay'), 'ay0');
  assert.equal(m.oneri('a . . b'), 'a.b');
  assert.equal(m.oneri('محمد'), '');
  assert.equal(m.oneri(''), '');
  assert.equal(m.oneri('Muhammed Mustafa Abdurrahman Yıldırım').length, 24);
  for (const ad of ['Ahmet Yılmaz', 'Ay', '  ...Ali  ', 'Muhammed Mustafa Abdurrahman Yıldırım', 'Zeynep_Nur', 'ÇİĞDEM', 'x', '__a__', 'Ğ', 'a__________b']) {
    const o = m.oneri(ad);
    assert.equal(m.gecerliMi(o).ok, true, `${ad} → ${o}`);
    assert.equal(m.normalize(o), o, 'öneri zaten normal biçimde');
  }
});

test('ayrılmış ad listesi istemci dosyasında yok', () => {
  const kaynak = readFileSync('src/lib/ilim-yolu/kullanici-adi.ts', 'utf8');
  for (const ad of ['admin', 'yonetici', 'hoca', 'imam', 'destek', 'ulucamii']) {
    assert.equal(new RegExp(`['"]${ad}['"]`).test(kaynak), false, ad);
  }
});
