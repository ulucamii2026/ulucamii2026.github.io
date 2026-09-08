# -*- coding: utf-8 -*-
"""ekitap-detay.json + elle küratörlüğü yapılmış Fransızca veriden site veri dosyasını üretir."""
import json, os, re, unicodedata, collections

DIL = {
    # Diyanet'in «Basım Dili» değeri -> (ISO kodu, kendi dilindeki ad, Türkçe ad)
    'Türkçe': ('tr', 'Türkçe', 'Türkçe'),
    'Türkçe/Arapça': ('tr', 'Türkçe', 'Türkçe / Arapça'),
    'Fransızca': ('fr', 'Français', 'Fransızca'),
    'Felemenkçe': ('nl', 'Nederlands', 'Felemenkçe'),
    'İngilizce': ('en', 'English', 'İngilizce'),
    'Almanca': ('de', 'Deutsch', 'Almanca'),
    'Arapça': ('ar', 'العربية', 'Arapça'),
    'İspanyolca': ('es', 'Español', 'İspanyolca'),
    'İtalyanca': ('it', 'Italiano', 'İtalyanca'),
    'PORTEKİZCE': ('pt', 'Português', 'Portekizce'),
    'Portekizce': ('pt', 'Português', 'Portekizce'),
    'Rusça': ('ru', 'Русский', 'Rusça'),
    'Arnavutça': ('sq', 'Shqip', 'Arnavutça'),
    'Gürcüce': ('ka', 'ქართული', 'Gürcüce'),
    'Bulgarca': ('bg', 'Български', 'Bulgarca'),
    'Macarca': ('hu', 'Magyar', 'Macarca'),
    'Norveççe': ('no', 'Norsk', 'Norveççe'),
    'İsveççe': ('sv', 'Svenska', 'İsveççe'),
    'DANCA': ('da', 'Dansk', 'Danca'),
    'Danca': ('da', 'Dansk', 'Danca'),
    'Fince': ('fi', 'Suomi', 'Fince'),
    'Çince': ('zh', '中文', 'Çince'),
    'Korece': ('ko', '한국어', 'Korece'),
    'Japonca': ('ja', '日本語', 'Japonca'),
    'Filipince': ('fil', 'Filipino', 'Filipince'),
    'Endonezce': ('id', 'Bahasa Indonesia', 'Endonezce'),
    'Farsça': ('fa', 'فارسی', 'Farsça'),
    'Kürtçe': ('ku', 'Kurdî', 'Kürtçe'),
    'Kırgızca': ('ky', 'Кыргызча', 'Kırgızca'),
    'Kazakça': ('kk', 'Қазақша', 'Kazakça'),
    'Özbekçe': ('uz', 'Oʻzbekcha', 'Özbekçe'),
    'Azerice': ('az', 'Azərbaycanca', 'Azerice'),
    'Tatarca': ('tt', 'Татарча', 'Tatarca'),
    'Uygurca': ('ug', 'ئۇيغۇرچە', 'Uygurca'),
    'Moğolca': ('mn', 'Монгол', 'Moğolca'),
    'Türkmence': ('tk', 'Türkmençe', 'Türkmence'),
    'Ukraynaca': ('uk', 'Українська', 'Ukraynaca'),
    'Shonaca': ('sn', 'ChiShona', 'Shonaca'),
    'Boşnakça': ('bs', 'Bosanski', 'Boşnakça'),
    'Sırpça': ('sr', 'Српски', 'Sırpça'),
    'Makedonca': ('mk', 'Македонски', 'Makedonca'),
    'Rumence': ('ro', 'Română', 'Rumence'),
    'ROMENCE': ('ro', 'Română', 'Rumence'),
    'Lehçe': ('pl', 'Polski', 'Lehçe'),
    'Yunanca': ('el', 'Ελληνικά', 'Yunanca'),
    'Urduca': ('ur', 'اردو', 'Urduca'),
    'Bengalce': ('bn', 'বাংলা', 'Bengalce'),
    'Svahili': ('sw', 'Kiswahili', 'Svahili'),
    'Hintçe': ('hi', 'हिन्दी', 'Hintçe'),
    'Samoaca': ('sm', 'Gagana Samoa', 'Samoaca'),
    'ÇEVACA': ('ny', 'Chichewa', 'Çevaca'),
}

# İlk sayfada başlık sanılmaması gereken künye satırları
GURULTU = re.compile(
    r'(publicat|présidence|presidence|presidency|affaires religieuses|religious affairs|'
    r'diyanet|yayın|yayin|isbn|ankara|www\.|©|editions|éditions|livres publics|'
    r'livres professionnels|manuel pour|general publication|coordinat|éditeur|editor|'
    r'baskı|matbaa|sertifika|tel:|faks|e-posta|dini yayınlar|genel yayın|'
    r'edition no|professional books|public books|source books|youth books|children books|'
    r'republic of turkey|prime ministry|presidium|präsidium|hoher rat|religionsangelegenheiten|'
    r'angelegenheiten|yayın no|nummer|reeks|books\s*:|'
    r'kaynak eserler|koordnasyon|koordinasyon|halk k[İi]?taplari|xalq ktablari|neirleri|'
    r'vepra shkencore|livros publicados|libros de referencia|quellentexte|fonti\s*/|'
    r'ltd\.?\s*[şs]?ti|bas\.\s*yay|mat\.\s*tani|sertfka|sertifika no|dyant|d[İi]yanet|'
    r'^\s*(prof|do[cç]|doq|dr)|resim\s*:|dua ederken)', re.I)

# Latin dışı yazı kullanan diller: başlık o yazının harflerini içermiyorsa pdftotext
# kodlamayı çözememiş demektir (transliterasyon çöpü çıkar) — Türkçe künyeye düşülür.
YAZI = {
    'ru': r'[Ѐ-ӿ]', 'bg': r'[Ѐ-ӿ]', 'ky': r'[Ѐ-ӿ]',
    'kk': r'[Ѐ-ӿ]', 'tt': r'[Ѐ-ӿ]', 'mn': r'[Ѐ-ӿ]',
    'uk': r'[Ѐ-ӿ]', 'sr': r'[Ѐ-ӿ]', 'mk': r'[Ѐ-ӿ]',
    'ka': r'[Ⴀ-ჿ]', 'hi': r'[ऀ-ॿ]', 'bn': r'[ঀ-৿]',
    'el': r'[Ͱ-Ͽ]', 'ar': r'[؀-ۿ]', 'fa': r'[؀-ۿ]',
    'ur': r'[؀-ۿ]', 'ug': r'[؀-ۿ]',
    'zh': r'[一-鿿]', 'ja': r'[぀-ヿ一-鿿]', 'ko': r'[가-힯]',
}

# pdftotext kaynak kodlamayı çözemezse U+FFFD üretir; öyle bir başlık kullanılamaz.
BOZUK = re.compile('[�\x00-\x08]')


def sade(s):
    return unicodedata.normalize('NFKC', s or '').strip()


def tekrarSil(b):
    """Kapaklarda başlık iki kez basılır: «Wat is de Islam? Wat is de Islam?» -> tek."""
    y = b.strip()
    n = len(y)
    for k in range(n // 2, 3, -1):
        sol, sag = y[:k].strip(' .?!:-–—'), y[n - k:].strip(' .?!:-–—')
        if sol and sol.lower() == sag.lower() and len(sol) >= 6:
            return sol + (y[k - 1] if y[k - 1] in '?!' else '')
    return y


def baslikCikar(ilk, kod):
    """İlk sayfanın metninden kitabın kendi dilindeki başlığını tahmin eder."""
    if not ilk:
        return None
    satirlar = []
    for ham in ilk.replace('\r', '').split('\n'):
        s = sade(ham)
        if not s or len(s) < 3:
            continue
        if re.fullmatch(r'[\d\s.\-–/]+', s):
            continue
        if GURULTU.search(s) or BOZUK.search(s):
            continue
        # Bozuk kodlama / çoğunlukla simge olan satırları at
        harf = sum(1 for c in s if c.isalpha())
        if harf < max(3, len(s) * 0.4):
            continue
        satirlar.append(s)
        if len(satirlar) >= 4:
            break
    if not satirlar:
        return None
    baslik = satirlar[0]
    # Kapaklarda başlık birkaç satıra bölünür: kısa satırları birleştir.
    i = 1
    while len(baslik) < 26 and i < len(satirlar) and len(baslik) + len(satirlar[i]) <= 90:
        baslik = baslik + ' ' + satirlar[i]
        i += 1
    baslik = tekrarSil(re.sub(r'\s+', ' ', baslik).strip(' .,:;-–—'))
    if len(baslik) < 4 or len(baslik) > 110 or BOZUK.search(baslik):
        return None
    if len(baslik.split()) < 2 and len(baslik) < 8:
        return None
    # TAMAMI BÜYÜK HARFSE okunabilirlik için başlık düzenine çevir (Latin alfabesi için)
    if baslik.isupper() and re.search(r'[A-Za-zÀ-ÿĞÜŞİÖÇğüşıöç]', baslik):
        baslik = latinBaslik(baslik)
    if kod in YAZI and not re.search(YAZI[kod], baslik):
        return None
    return baslik


def latinBaslik(s):
    """str.title() kesme işaretinden sonra büyük harf yapar («Qur'An»); o yüzden elle."""
    return re.sub(r"(?<![A-Za-zÀ-ÿ'’])([a-zà-ÿ])", lambda m: m.group(1).upper(), s.lower())


def trKucuk(s):
    return s.replace('İ', 'i').replace('I', 'ı').lower()


def trBaslik(s):
    """Türkçe kurallı başlık düzeni: «KUR'AN SON VAHİY» -> «Kur'an Son Vahiy».
    str.title() «İ» harfini «i̇» (birleşik nokta) yaptığı için elle yazıldı."""
    cikti = []
    onceki = ''
    for sozcuk in re.split(r'(\W+)', trKucuk(s)):
        # «Muhammed’in», «Kur'an-ı» gibi kesme/tireden sonraki ek büyük harfle başlamaz.
        ek = onceki.endswith(("'", '’')) or (onceki.endswith('-') and len(sozcuk) <= 2)
        if sozcuk and sozcuk[0].isalpha() and not ek:
            bas = 'İ' if sozcuk[0] == 'i' else ('I' if sozcuk[0] == 'ı' else sozcuk[0].upper())
            sozcuk = bas + sozcuk[1:]
        cikti.append(sozcuk)
        onceki = sozcuk
    return ''.join(cikti)


def temizTr(s):
    """«İSLAM NEDİR (FRANSIZCA BROŞÜR)» -> «İslam Nedir (Fransızca Broşür)»"""
    s = re.sub(r'\s+', ' ', sade(s)).strip()
    s = re.sub(r'(?<=[^\s(])\(', ' (', s)  # «Muhammed(S.A.V)» -> «Muhammed (S.A.V)»
    return trBaslik(s) if s == s.upper() else s


detay = json.load(open('ekitap-detay.json', encoding='utf-8'))
kurator = {r['id']: r for r in json.load(open('diyanet-fr-yayinlar.json', encoding='utf-8'))['yayinlar']}
# Otomatik çıkarımın tutmadığı başlıklar elle düzeltilir (id -> kendi dilindeki başlık).
elle = json.load(open('baslik-duzeltme.json', encoding='utf-8')) if os.path.exists('baslik-duzeltme.json') else {}

yayinlar = []
bilinmeyenDil = collections.Counter()
for r in detay:
    if not r.get('pdfMi') or not r.get('boyut'):
        continue
    # Gövdesi yarıda kesilen dosyalar listeye girmez (örn. id=510: 1,7 MB bildirip 21 KB döndürür).
    if r.get('kesik'):
        continue
    # Kaynakta «Basım Dili» boş bırakılmış 17 kayıt Türkçe künyeli Diyanet yayınıdır.
    dilAd = (r.get('dil') or '').strip() or 'Türkçe'
    if dilAd not in DIL:
        bilinmeyenDil[dilAd] += 1
        continue
    kod, ad, adTr = DIL[dilAd]
    k = kurator.get(r['id'])
    baslikTr = temizTr(r.get('baslikTr') or '')
    if r['id'] in elle and elle[r['id']] is None:
        kendiDilinde = None
    else:
        kendiDilinde = (elle.get(r['id']) or (k['baslik'] if k else None)
                        or (baslikCikar(r.get('ilkSayfa'), kod) if kod != 'tr' else None))
    # Kapak metni çözülemeyen kayıtlarda başlık Türkçe künyeye düşer: h4'ün lang'i de
    # Türkçe olmalı, yoksa ekran okuyucu Türkçe metni Arapça/Almanca diye seslendirir.
    baslik = kendiDilinde or baslikTr
    yayinlar.append({
        'id': r['id'], 'dilKodu': kod,
        'baslik': baslik, 'baslikDili': kod if (kendiDilinde or kod == 'tr') else 'tr',
        'baslikTr': baslikTr,
        'aciklama': k['aciklama'] if k else None,
        'grup': k['grup'] if k else None,
        'sayfa': r.get('sayfa'), 'boyut': r.get('boyut'),
        'pdf': r['pdfUrl'], 'epub': r.get('epubUrl'),
        'sayfaUrl': r['sayfaUrl'],
    })

kullanilan = {y['dilKodu'] for y in yayinlar}
diller = []
for dilAd, (kod, ad, adTr) in DIL.items():
    if kod in kullanilan and not any(d['kod'] == kod for d in diller):
        diller.append({'kod': kod, 'ad': ad, 'adTr': adTr})

yayinlar.sort(key=lambda y: (y['dilKodu'], y['baslik'].lower()))
json.dump({'kaynak': 'dijital.diyanet.gov.tr', 'guncelleme': '2026-09-08',
           'diller': diller, 'yayinlar': yayinlar},
          open('diyanet-yayinlar.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print('yayın:', len(yayinlar), '· dil:', len(diller))
print('dil dağılımı:', collections.Counter(y['dilKodu'] for y in yayinlar).most_common())
if bilinmeyenDil:
    print('HARİTADA OLMAYAN DİL:', bilinmeyenDil.most_common())
