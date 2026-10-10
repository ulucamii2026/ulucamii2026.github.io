/** Apps Script v43 (10 Eki 2026) — kimliği kayıtlı defter açılamazsa YENİ TABLO YARATILMAZ.
 *  4 Eki 2026'da tek bir geçici openById hatası kayitV2SayfaGetir'e boş bir kopya yaratıp TABLO2_ID'yi ona çevirtti;
 *  kayıt defteri altı gün boş göründü. Dört alıcı (kayıt, ihtida, seviye, envanter) kimlikliTabloAc'tan geçer. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const kaynak = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v43.gs', 'seviye-testi-isleri.gs', 'envanter-isleri.gs']
  .map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n;\n');

function ortam({ hataSayisi = 0, kimlikler = {} } = {}) {
  const props = new Map(Object.entries(kimlikler));
  const olay = { acma: 0, yaratilan: [], uyku: [] };
  const sayfa = { getLastRow: () => 5, getLastColumn: () => 99, getParent: () => ({ getId: () => 'ESKI' }) };
  const ctx = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, v) }) },
    Utilities: { sleep: ms => olay.uyku.push(ms) },
    SpreadsheetApp: {
      openById(id) {
        olay.acma++;
        if (olay.acma <= hataSayisi) throw new Error('Service Spreadsheets failed while accessing document with id ' + id);
        return { getId: () => id, getSheets: () => [sayfa] };
      },
      create(ad) {
        olay.yaratilan.push(ad);
        const yeni = { getLastRow: () => 0, getLastColumn: () => 0, getRange: () => ({ setValues: () => ({ setFontWeight: () => ({ setBackground: () => ({ setFontColor() {} }) }) }) }), setFrozenRows() {}, setColumnWidth() {} };
        return { getId: () => 'YENI', getSheets: () => [yeni] };
      },
    },
    DriveApp: {
      getFileById: () => ({}), getRootFolder: () => ({ removeFile() {} }),
      getFolderById: () => ({ addFile() {} }), getFoldersByName: () => ({ hasNext: () => true, next: () => ({ getId: () => 'K', addFile() {} }) }),
    },
  });
  vm.runInContext(kaynak, ctx);
  return { ctx, props, olay };
}

const ALICILAR = [
  ['kayitV2SayfaGetir', 'TABLO2_ID'],
  ['ihtidaV2SayfaGetir', 'IHTIDA_TABLO2_ID'],
  ['seviyeSayfaGetir', 'SEVIYE_TABLO_ID'],
  ['envanterTabloGetir', 'ENVANTER_TABLO_ID'],
];

test('Sürüm 43', () => {
  assert.equal(ortam().ctx.SURUM, 43);
});

for (const [islev, ozellik] of ALICILAR) {
  test(`${islev}: kimlik kayıtlı, açılış hep hata → hata fırlatır; tablo yaratılmaz, ${ozellik} değişmez`, () => {
    const t = ortam({ hataSayisi: 99, kimlikler: { [ozellik]: 'ESKI' } });
    assert.throws(() => t.ctx[islev](), /defter-acilamadi: /);
    assert.equal(t.olay.acma, 3, 'üç deneme');
    assert.deepEqual(t.olay.uyku, [1000, 2000]);
    assert.deepEqual(t.olay.yaratilan, []);
    assert.equal(t.props.get(ozellik), 'ESKI');
  });
}

for (const [islev, ozellik] of ALICILAR.slice(0, 3)) {
  test(`${islev}: iki geçici hatadan sonra açılış başarılı → aynı tablo, yeni tablo yok`, () => {
    const t = ortam({ hataSayisi: 2, kimlikler: { [ozellik]: 'ESKI' } });
    const sh = t.ctx[islev]();
    assert.equal(sh.getParent().getId(), 'ESKI');
    assert.equal(t.olay.acma, 3);
    assert.deepEqual(t.olay.yaratilan, []);
    assert.equal(t.props.get(ozellik), 'ESKI');
  });

  test(`${islev}: kimlik hiç kayıtlı değilse tablo yaratılır ve kimlik yazılır (eski davranış)`, () => {
    const t = ortam();
    t.ctx[islev]();
    assert.equal(t.olay.yaratilan.length, 1);
    assert.equal(t.props.get(ozellik), 'YENI');
  });
}
