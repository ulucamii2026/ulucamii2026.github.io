"""Resmî Diyanet âyetlerinden eûzü + besmele + metin sırasıyla tam kayıt üretir.

python scripts/sure-ses-uret.py --uret
Kaynak MP3'ler ayrı ayrı PCM'e çözülür; MP3 baytları art arda eklenmez.
"""
import argparse, hashlib, json, pathlib, shutil, subprocess, tempfile, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_OsmanSahin/'
SURELER = {'fatiha':(1,7),'insirah':(94,8),'kadir':(97,5),'asr':(103,3),
    'fil':(105,5),'kureys':(106,4),'maun':(107,7),'kevser':(108,3),
    'kafirun':(109,6),'nasr':(110,3),'tebbet':(111,5),'ihlas':(112,4),
    'felak':(113,5),'nas':(114,6)}
def sha(b): return hashlib.sha256(b).hexdigest()
def ffmpeg():
    found=shutil.which('ffmpeg.exe') or shutil.which('ffmpeg')
    if found and not found.endswith('.cmd'): return found
    paths=list((pathlib.Path.home()/'AppData/Local/Microsoft/WinGet/Packages').glob('Gyan.FFmpeg_*/ffmpeg-*/bin/ffmpeg.exe'))
    if not paths: raise RuntimeError('ffmpeg bulunamadı')
    return str(paths[-1])
def plan():
    result={}
    for kod,(sure,adet) in SURELER.items():
        # Fâtiha'nın 1. âyeti zaten besmeledir; iki kere eklenmez.
        result[kod]=[(1,0)]+([] if sure==1 else [(1,1)])+[(sure,a) for a in range(1,adet+1)]
    result['ayetel-kursi']=[(1,0),(1,1),(2,255)]
    return result
def main():
    p=argparse.ArgumentParser();p.add_argument('--uret',action='store_true');args=p.parse_args()
    if not args.uret: p.error('Dosya üretimi için --uret gerekli')
    manifest_path=ROOT/'docs/dinleme-ses-kaynaklari.json'
    manifest=json.loads(manifest_path.read_text('utf-8'))
    with tempfile.TemporaryDirectory(prefix='ulucamii-sure-') as temp:
        temp=pathlib.Path(temp); pcm={}; source={}
        for s,a in sorted(set(x for parts in plan().values() for x in parts)):
            url=f'{BASE}{s}_{a}.mp3'; data=urllib.request.urlopen(url,timeout=45).read()
            target=f'/media/ses/ayet/{s}-{a}.mp3'
            if target in manifest and sha(data)!=manifest[target]['sha256']:
                raise RuntimeError('Resmî kaynak değişmiş; inceleyin: '+target)
            local=ROOT/'public'/target.lstrip('/');local.write_bytes(data)
            manifest[target]={'kaynak':url,'sha256':sha(data)};source[(s,a)]=target
            # Her kaydı ayrı çözerek dosya başlıklarının âyet aralarında bozuk ses üretmesini önle.
            output=temp/f'{s}-{a}.pcm'
            subprocess.run([ffmpeg(),'-v','error','-xerror','-y','-i',str(local),'-f','s16le','-ar','44100','-ac','1',str(output)],check=True)
            pcm[(s,a)]=output.read_bytes()
        for kod,parts in plan().items():
            joined=temp/'birlesik.pcm';joined.write_bytes(b''.join(pcm[x] for x in parts))
            target=f'/media/ses/sureler/{kod}.mp3';out=ROOT/'public'/target.lstrip('/')
            subprocess.run([ffmpeg(),'-v','error','-y','-f','s16le','-ar','44100','-ac','1','-i',str(joined),'-c:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(out)],check=True)
            subprocess.run([ffmpeg(),'-v','error','-xerror','-i',str(out),'-f','null','-'],check=True)
            manifest[target]={'kaynak':BASE,'sha256':sha(out.read_bytes()),'parcalar':[source[x] for x in parts],
                'pcmSha256':sha(joined.read_bytes()),'pcmOrnek':len(joined.read_bytes())//2,
                'baslangic':'euzu-besmele','birlesim':'PCM 44100 Hz mono → MP3 96 kbps'}
            print(kod,len(parts),out.stat().st_size)
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=1)+'\n','utf-8')
if __name__=='__main__': main()
