from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
d=Path(r'docs/afisler/esma-avci-2026-2027')
files=sorted(d.glob('*.png'))
w,h=360,450
gap=24
rows=(len(files)+1)//2
sheet=Image.new('RGB',(2*w+3*gap,rows*(h+54)+(rows+1)*gap),(10,40,31))
draw=ImageDraw.Draw(sheet)
font=ImageFont.load_default()
for i,p in enumerate(files):
    im=Image.open(p).convert('RGB')
    im.thumbnail((w,h))
    x=gap+(i%2)*(w+gap)
    y=gap+(i//2)*(h+54+gap)
    card=Image.new('RGB',(w,h),(20,65,52))
    card.paste(im,((w-im.width)//2,(h-im.height)//2))
    sheet.paste(card,(x,y))
    draw.text((x,y+h+8),p.stem[:42],fill=(242,228,192),font=font)
sheet.save(d/'onizleme.jpg',quality=92)
print(sheet.size)
