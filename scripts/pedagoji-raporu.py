"""Kaynaklı Markdown araştırmasını yerel, bağlantıları tıklanabilir PDF'e çevirir."""
from pathlib import Path
import re
import html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

root = Path(__file__).resolve().parents[1]
out = root / 'output/pdf/Veli-Ogrenci-Pedagojik-Arastirma.pdf'
out.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('ArialTR', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialTRBold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('ArialTR', normal='ArialTR', bold='ArialTRBold')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('Govde', fontName='ArialTR', fontSize=10.5, leading=15, spaceAfter=8, allowWidows=0, allowOrphans=0))
styles.add(ParagraphStyle('Bas1', fontName='ArialTRBold', fontSize=23, leading=28, spaceAfter=18, keepWithNext=True))
styles.add(ParagraphStyle('Bas2', fontName='ArialTRBold', fontSize=16, leading=20, spaceBefore=17, spaceAfter=9, keepWithNext=True))
styles.add(ParagraphStyle('Bas3', fontName='ArialTRBold', fontSize=12, leading=17, spaceBefore=13, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle('Hucre', fontName='ArialTR', fontSize=9, leading=13))

def bicim(text):
    text = html.escape(text)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', r'<link href="\2" color="#16435c"><u>\1</u></link>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    return text

lines = (root / 'docs/VELI-OGRENCI-PEDAGOJIK-ARASTIRMA.md').read_text(encoding='utf-8').splitlines()
flow, para, rows = [], [], []
def flush():
    if para:
        flow.append(Paragraph(bicim(' '.join(para)), styles['Govde']))
        para.clear()
def table():
    if not rows: return
    count = len(rows[0])
    tab = Table([[Paragraph(bicim(v), styles['Hucre']) for v in row] for row in rows], colWidths=[(A4[0]-100)/count]*count, repeatRows=1, hAlign='LEFT')
    tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eeeeee')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#cccccc')),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    flow.extend([KeepTogether([tab]), Spacer(1,12)]); rows.clear()
for line in lines:
    if line.startswith('|'):
        flush()
        if not re.match(r'^\|[-|: ]+\|$',line): rows.append([x.strip() for x in line.strip('|').split('|')])
        continue
    table()
    if not line.strip(): flush(); continue
    head = re.match(r'^(#{1,3}) (.*)',line)
    if head:
        flush();flow.append(Paragraph(bicim(head[2]),styles['Bas'+str(len(head[1]))]));continue
    if re.match(r'^\d+\. ',line): flush()
    para.append(line.strip())
flush();table()
SimpleDocTemplate(str(out), pagesize=A4, rightMargin=50, leftMargin=50, topMargin=48, bottomMargin=48, title='Veli ve öğrenci portalında birlikte öğrenme', author='Ulu Camii').build(flow)
print(out.as_posix())
