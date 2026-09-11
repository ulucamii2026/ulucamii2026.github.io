from pathlib import Path
d=Path(r'docs/afisler/esma-avci-2026-2027')
s= d/'kaynak'
old=['03-genc-kizlar-cuma','04-kiz-cocuklari-hafta-sonu','05-mdr-bire-bir-gorusme','06-haftalik-program-ozeti']
for stem in old:
    for p in [d/f'{stem}.png',d/f'{stem}.pdf',s/f'{stem}.html']:
        if p.exists(): p.unlink()
print('Eski afiş adları temizlendi')
