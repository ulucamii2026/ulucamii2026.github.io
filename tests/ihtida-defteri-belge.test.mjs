import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { pdfUret, docxUret } from '../public/admin/ihtida-defteri.js';
const out = '.codex/cikti/ihtida-defteri/test';
const kaynak = { fontBytes: readFileSync('public/fonts/Lora-Regular.ttf'), fontKalinBytes: readFileSync('public/fonts/Lora-Bold.ttf') };
const model = { surum: 1, guncelleme: '2026-09-09T10:00:00Z', kayitlar: [
  { ref: 'IH-2099-0001', defterNo: 'UC-2026-0001', adSoyad: 'Çağrı Élodie ÖRNEK', yeniIsim: 'Meryem', durum: 'tamamlandi', basvuruTarihi: '2026-09-07', ihtidaTarihi: '2026-09-08', sahit1: 'Birinci Örnek Şahit', sahit2: 'İkinci Örnek Şahit', camiAdi: 'Ulu Camii', camiSehir: 'Marche-en-Famenne' },
  { ref: 'IH-2099-0002', defterNo: '', adSoyad: 'Camille <ÖRNEK> & İkinci', durum: 'bekliyor', basvuruTarihi: '2026-09-09' },
] };
test('Matbu PDF 50 yatay kayıt sayfası ve ayrı bekleyen ekini içerir; Word geçerli OOXML ve gerçek gövdedir', async () => {
  mkdirSync(out, { recursive: true });
  const bytes = await pdfUret(model, kaynak, pdfLib, fontkit);
  const pdf = await pdfLib.PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 53);
  for (const p of pdf.getPages()) assert.ok(p.getWidth() > p.getHeight());
  writeFileSync(out + '/defter.pdf', bytes); writeFileSync(out + '/defter.docx', docxUret(model));
  const result = execFileSync('py', ['-X', 'utf8', '-c', `
from zipfile import ZipFile
import xml.etree.ElementTree as E
import pymupdf as F
with ZipFile('${out}/defter.docx') as z:
 assert z.testzip() is None
 for n in z.namelist():
  if n.endswith('.xml') or n.endswith('.rels'): E.fromstring(z.read(n))
 x=z.read('word/document.xml').decode('utf-8')
 assert 'IHTIDA_DEFTERI_GOVDE' not in x and '{{GOVDE}}' not in x
 assert x.count('w:type="page"')==52
 assert 'KAYIT YERİ 100' in x and 'Camille &lt;ÖRNEK&gt; &amp; İkinci' in x
 assert 'w:orient="landscape"' in x
d=F.open('${out}/defter.pdf')
assert 'Çağrı Élodie ÖRNEK' in d[2].get_text()
assert 'Adı soyadı' in d[3].get_text() and 'KAYIT SAYFASI 50' in d[51].get_text()
assert 'Camille <ÖRNEK> & İkinci' in d[52].get_text()
assert not any('Camille' in p.get_text() for p in list(d)[2:52])
for i,p in enumerate(d):
 for b in p.get_text('blocks'):
  assert b[0]>=26 and b[2]<=817 and b[1]>=18 and b[3]<=581,(i,b[:4])
print('ok')
`], { encoding: 'utf8' });
  assert.equal(result.trim(), 'ok');
});
test('Uzun işlem notu PDF ve Word kayıt ekinde eksiksiz korunur', async () => {
  const uzun = { ...model, kayitlar: [{ ...model.kayitlar[0], not: 'Uzun açıklama ve belge teslim takibi. '.repeat(20) + 'SON İŞLEM NOTU' }] };
  mkdirSync(out, { recursive: true });
  writeFileSync(out + '/uzun.pdf', await pdfUret(uzun, kaynak, pdfLib, fontkit));
  writeFileSync(out + '/uzun.docx', docxUret(uzun));
  assert.match(execFileSync('py', ['-X', 'utf8', '-c', `
import pymupdf as F
from zipfile import ZipFile
d=F.open('${out}/uzun.pdf'); t=''.join(p.get_text() for p in d)
assert 'SON İŞLEM NOTU' in t and 'KAYIT AYRINTILARI' in t
with ZipFile('${out}/uzun.docx') as z: assert 'SON İŞLEM NOTU' in z.read('word/document.xml').decode('utf-8')
print('ok')
`], { encoding: 'utf8' }), /ok/);
});
