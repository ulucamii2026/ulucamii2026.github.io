/** Yalnız genel, kişisel veri içermeyen OOXML iskeleti. docx 9.7.x ile yeniden üretilebilir. */
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { AY_YILDIZ_SVG } from '../public/admin/ay-yildiz.js';
const require = createRequire(import.meta.url);
let lib;
try { lib = require('docx'); } catch { lib = require(join(process.env.APPDATA, 'npm/node_modules/docx')); }
const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, PageOrientation, ImageRun } = lib;
const ayPng = await sharp(Buffer.from(AY_YILDIZ_SVG)).resize(808, 600).png().toBuffer();
const doc = new Document({
  creator: 'Marche-en-Famenne Ulu Camii', title: 'İhtida Defteri', description: 'Cami içi özel takip defteri',
  styles: { default: { document: { run: { font: 'Times New Roman', size: 19, color: '3D2529' }, paragraph: { spacing: { after: 60, line: 220 } } } } },
  sections: [{ properties: { titlePage: true, page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 700, bottom: 700, left: 700, right: 700, header: 360, footer: 360 } } },
    headers: { first: new Header({ children: [new Paragraph('')] }), default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'MARCHE-EN-FAMENNE ULU CAMİİ', bold: true, size: 17, color: 'A91C2A', font: 'Times New Roman' })], border: { bottom: { color: 'A91C2A', style: 'single', size: 8, space: 8 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'ÖZEL · CAMİ İÇİ TAKİP     |     ', size: 16, color: '6A4A4F', font: 'Times New Roman' }), new TextRun({ children: [PageNumber.CURRENT], size: 16 }), new TextRun({ text: ' / ', size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 })] })] }) },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new ImageRun({ type: 'svg', data: Buffer.from(AY_YILDIZ_SVG), fallback: { type: 'png', data: ayPng }, transformation: { width: 82, height: 61 } })] }), new Paragraph('IHTIDA_DEFTERI_GOVDE')]
  }]
});
await mkdir(new URL('../.codex/cikti/ihtida-defteri/', import.meta.url), { recursive: true });
await writeFile(new URL('../.codex/cikti/ihtida-defteri/word-iskele.docx', import.meta.url), await Packer.toBuffer(doc));
execFileSync('py', ['-X', 'utf8', '-c', `
from pathlib import Path
from zipfile import ZipFile
import json,re
root=Path.cwd()
with ZipFile(root/'.codex/cikti/ihtida-defteri/word-iskele.docx') as z:
 parts={n:(z.read(n).decode('utf-8') if n.endswith(('.xml','.rels','.svg')) else list(z.read(n))) for n in z.namelist() if not n.endswith('/')}
 marker=next(p for p in re.findall(r'<w:p(?:\\s[^>]*)?>.*?</w:p>',parts['word/document.xml']) if 'IHTIDA_DEFTERI_GOVDE' in p)
 parts['word/document.xml']=parts['word/document.xml'].replace(marker, '{{GOVDE}}')
 assert '{{GOVDE}}' in parts['word/document.xml']
 parts['word/document.xml']=parts['word/document.xml'].replace('</w:sectPr>','<w:pgBorders w:offsetFrom="page" w:display="firstPage">'+''.join('<w:'+edge+' w:val="double" w:sz="12" w:space="18" w:color="A91C2A"/>' for edge in ['top','left','bottom','right'])+'</w:pgBorders></w:sectPr>')
 parts['docProps/core.xml']=re.sub(r'\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z','2026-09-09T00:00:00Z',parts['docProps/core.xml'])
 (root/'public/admin/ihtida-defteri-word-sablon.js').write_text('// docx 9.7.1 ile üretilmiş genel OOXML iskeleti.\\nexport const WORD_PARCA = '+json.dumps(parts,ensure_ascii=False,separators=(',',':'))+';\\n',encoding='utf-8')
`]);
console.log('Genel Word iskeleti üretildi.');
