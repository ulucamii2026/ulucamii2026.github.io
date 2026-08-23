/** İhtida Başvuru Formu — çok adımlı Preact adası (client:load).
 *  Taslak: localStorage. Gönderimde cihazda PDF üretilir (IhtidaPdf.tsx) ve
 *  Apps Script /exec adresine text/plain POST ile iletilir (Kur'an kursu kayıt
 *  sistemiyle aynı desen: ortak sır, gonderimAnahtari ile çift-kayıt koruması,
 *  redirect:'follow', 90 sn AbortController). Servis henüz etkin değilse veya
 *  gönderim başarısız olursa PDF indirme / e-posta / WhatsApp yedek yolları sunulur. */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import IhtidaImza from './IhtidaImza';
import { ihtidaPdfUret, type IhtidaPdfSonuc } from './IhtidaPdf';
import {
  metinler, type FormDil,
  CINSIYET_SECENEKLERI, ONCEKI_DIN_SECENEKLERI, OGRENIM_SECENEKLERI, MEDENI_HAL_SECENEKLERI,
  TOREN_DILI_SECENEKLERI, HABERDAR_SECENEKLERI, BELGE_TURU_SECENEKLERI, ADIM_BASLIKLARI,
  type SecenekOgesi,
} from './IhtidaMetinler';

const ORTAK_SIR = 'ULUCAMII-IHTIDA-2026'; // D:/tmp/gas/ulucamii-Kod.gs içindeki AYAR_IHTIDA.ortakSir ile AYNI olmalı
const TASLAK_ANAHTARI = 'uluCamiiIhtidaTaslak:v1';
const MAX_IMAGE_EDGE = 1600;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const JPEG_QUALITY = 0.82;
const TOPLAM_ADIM = 8;

interface FormState {
  adim: number;
  adSoyad: string; cinsiyet: string; dogumTarihi: string; dogumYeri: string; uyruk: string;
  tcVatandasi: boolean; tcKimlikNo: string;
  oncekiDin: string; oncekiDinDiger: string;
  ogrenimDurumu: string; anneAdi: string; babaAdi: string; medeniHali: string; meslek: string;
  eposta: string; telefon: string; adres: string;
  ihtidaSebebi: string; yeniIsim: string; torenDili: string; torenTarihi: string; nasilHaberdar: string; ekNot: string;
  belgeTuru: 'kimlik' | 'pasaport';
  kimlikOn: string; kimlikArka: string; vesikalik: string;
  kvkkOnay: boolean; hurIradeOnay: boolean; fotografIzni: boolean;
  imzaDataUrl: string;
  gonderimAnahtari: string;
}

function bosDurum(): FormState {
  return {
    adim: 0,
    adSoyad: '', cinsiyet: '', dogumTarihi: '', dogumYeri: '', uyruk: '',
    tcVatandasi: false, tcKimlikNo: '',
    oncekiDin: '', oncekiDinDiger: '',
    ogrenimDurumu: '', anneAdi: '', babaAdi: '', medeniHali: '', meslek: '',
    eposta: '', telefon: '', adres: '',
    ihtidaSebebi: '', yeniIsim: '', torenDili: '', torenTarihi: '', nasilHaberdar: '', ekNot: '',
    belgeTuru: 'kimlik',
    kimlikOn: '', kimlikArka: '', vesikalik: '',
    kvkkOnay: false, hurIradeOnay: false, fotografIzni: false,
    imzaDataUrl: '',
    gonderimAnahtari: '',
  };
}

function taslakOku(): FormState {
  try {
    const ham = localStorage.getItem(TASLAK_ANAHTARI);
    if (!ham) return bosDurum();
    const kayitli = JSON.parse(ham);
    return { ...bosDurum(), ...kayitli };
  } catch { return bosDurum(); }
}

function taslakYaz(state: FormState) {
  try { localStorage.setItem(TASLAK_ANAHTARI, JSON.stringify(state)); }
  catch {
    try {
      const { kimlikOn, kimlikArka, vesikalik, imzaDataUrl, ...rest } = state;
      localStorage.setItem(TASLAK_ANAHTARI, JSON.stringify(rest));
    } catch { /* depolama yoksa taslak atlanır, form yine çalışır */ }
  }
}

function taslakSil() { try { localStorage.removeItem(TASLAK_ANAHTARI); } catch { /* yok say */ } }

function gonderimAnahtariUret(): string {
  try {
    const bayt = new Uint8Array(18);
    crypto.getRandomValues(bayt);
    return Array.from(bayt, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14)).slice(0, 36);
  }
}

function tcKimlikGecerliMi(deger: string): boolean {
  if (!/^[0-9]{11}$/.test(deger)) return false;
  const d = deger.split('').map(Number);
  if (d[0] === 0) return false;
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const d10 = (((oddSum * 7) - evenSum) % 10 + 10) % 10;
  if (d10 !== d[9]) return false;
  const toplam10 = d.slice(0, 10).reduce((a, b) => a + b, 0);
  return toplam10 % 10 === d[10];
}

function epostaGecerliMi(deger: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deger.trim()); }
function telGecerliMi(deger: string): boolean { return /^\+[1-9]\d{7,14}$/.test(deger.replace(/[\s-]/g, '')); }

function yasHesapla(dogumTarihi: string): number | null {
  const d = new Date(`${dogumTarihi}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const bugun = new Date();
  let yas = bugun.getFullYear() - d.getFullYear();
  const ayFarki = bugun.getMonth() - d.getMonth();
  if (ayFarki < 0 || (ayFarki === 0 && bugun.getDate() < d.getDate())) yas -= 1;
  return yas;
}

async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch { /* Safari eski sürüm — aşağıdaki yedeğe düş */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image-decode')); };
    img.src = url;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('canvas-encode')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', JPEG_QUALITY);
  });
}

/** Görseli en uzun kenarı ≤1600px olacak şekilde tuvalde küçültür, JPEG dataURL döner. */
async function gorseliSikistir(file: File): Promise<string> {
  if (!file || !file.type.startsWith('image/')) throw new Error('invalid-image');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('too-large');
  const decoded = await decodeImage(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded.source, 0, 0, width, height);
    return await canvasToDataUrl(canvas);
  } finally { decoded.close(); }
}

function base64Cevir(bytes: Uint8Array): string {
  let ikili = '';
  const parca = 0x8000;
  for (let i = 0; i < bytes.length; i += parca) {
    ikili += String.fromCharCode(...bytes.subarray(i, i + parca));
  }
  return btoa(ikili);
}

function etiketBul(liste: SecenekOgesi[], deger: string, dil: FormDil): string {
  return liste.find((s) => s.deger === deger)?.etiket[dil] ?? deger;
}

// ------------------------------------------------------------------ küçük UI parçaları

interface AlanProps {
  etiket: string; deger: string; hata?: string; zorunlu?: boolean; tip?: string;
  yerTutucu?: string; onDegisti: (v: string) => void; girdiTuru?: 'input' | 'textarea';
  satir?: number; genislik?: 'tam' | 'yari';
}
function Alan({ etiket, deger, hata, zorunlu, tip = 'text', yerTutucu, onDegisti, girdiTuru = 'input', satir = 3, genislik = 'tam' }: AlanProps) {
  const sinif = 'w-full min-h-11 rounded-(--radius-kose) border bg-(--zemin) px-3 py-2.5 text-base focus:outline-none focus:border-(--vurgu-2) transition-colors ' + (hata ? 'border-(--vurgu)' : 'border-(--cizgi)');
  return (
    <label class={`grid gap-1.5 ${genislik === 'yari' ? '' : 'sm:col-span-2'}`}>
      <span class="etiket">{etiket}{zorunlu && ' *'}</span>
      {girdiTuru === 'textarea'
        ? <textarea class={sinif} rows={satir} value={deger} placeholder={yerTutucu} onInput={(e) => onDegisti((e.target as HTMLTextAreaElement).value)} />
        : <input class={sinif} type={tip} value={deger} placeholder={yerTutucu} onInput={(e) => onDegisti((e.target as HTMLInputElement).value)} />}
      {hata && <span class="text-sm text-(--vurgu)" role="alert">{hata}</span>}
    </label>
  );
}

interface SecimAlaniProps { etiket: string; deger: string; hata?: string; zorunlu?: boolean; secenekler: SecenekOgesi[]; dil: FormDil; onDegisti: (v: string) => void; genislik?: 'tam' | 'yari'; }
function SecimAlani({ etiket, deger, hata, zorunlu, secenekler, dil, onDegisti, genislik = 'yari' }: SecimAlaniProps) {
  const sinif = 'w-full min-h-11 rounded-(--radius-kose) border bg-(--zemin) px-3 py-2.5 text-base focus:outline-none focus:border-(--vurgu-2) transition-colors ' + (hata ? 'border-(--vurgu)' : 'border-(--cizgi)');
  return (
    <label class={`grid gap-1.5 ${genislik === 'yari' ? '' : 'sm:col-span-2'}`}>
      <span class="etiket">{etiket}{zorunlu && ' *'}</span>
      <select class={sinif} value={deger} onChange={(e) => onDegisti((e.target as HTMLSelectElement).value)}>
        <option value="">—</option>
        {secenekler.map((s) => <option value={s.deger}>{s.etiket[dil]}</option>)}
      </select>
      {hata && <span class="text-sm text-(--vurgu)" role="alert">{hata}</span>}
    </label>
  );
}

function OnayKutusu({ id, isaretli, onDegisti, cocuk, hata }: { id: string; isaretli: boolean; onDegisti: (v: boolean) => void; cocuk: JSX.Element | string; hata?: string }) {
  return (
    <div class="grid gap-1.5">
      <label class="flex items-start gap-3 cursor-pointer" for={id}>
        <input id={id} type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 accent-(--vurgu)" checked={isaretli} onChange={(e) => onDegisti((e.target as HTMLInputElement).checked)} />
        <span class="text-sm leading-relaxed">{cocuk}</span>
      </label>
      {hata && <span class="text-sm text-(--vurgu) pl-8" role="alert">{hata}</span>}
    </div>
  );
}

interface DosyaAlaniProps {
  etiket: string; deger: string; hata?: string; zorunlu?: boolean; m: ReturnType<typeof metinler>;
  isleniyor: boolean; onSecildi: (file: File) => void;
}
function DosyaAlani({ etiket, deger, hata, zorunlu, m, isleniyor, onSecildi }: DosyaAlaniProps) {
  const girdiId = useMemo(() => `dosya-${Math.random().toString(36).slice(2, 9)}`, []);
  return (
    <div class="grid gap-2">
      <span class="etiket">{etiket}{zorunlu && ' *'}</span>
      <div class="flex flex-wrap items-center gap-3">
        {deger && <img src={deger} alt="" class="h-16 w-16 object-cover rounded-(--radius-kose) border border-(--cizgi)" />}
        <label for={girdiId} class="dugme dugme-ikincil cursor-pointer min-h-11">
          {isleniyor ? m.dosyaIsleniyor : (deger ? m.dosyaDegistir : m.dosyaSec)}
        </label>
        <input
          id={girdiId} type="file" accept="image/*" class="sr-only"
          onChange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onSecildi(f); (e.target as HTMLInputElement).value = ''; }}
        />
        <span class="text-sm text-(--metin-2)">{deger ? m.dosyaYuklendi : m.dosyaYok}</span>
      </div>
      {hata && <span class="text-sm text-(--vurgu)" role="alert">{hata}</span>}
    </div>
  );
}

// ------------------------------------------------------------------ ana bileşen

interface Props { dil: FormDil; ucNokta: string; cami: { ad: string; adres: string; telefon: string; eposta: string }; ek10Yolu: string }

export default function IhtidaFormu({ dil, ucNokta, cami, ek10Yolu }: Props) {
  const m = metinler(dil);
  const [durum, setDurum] = useState<FormState>(() => bosDurum());
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [dosyaIsleniyorAlan, setDosyaIsleniyorAlan] = useState<string>('');
  const [asama, setAsama] = useState<'form' | 'hazirlaniyor' | 'gonderiliyor' | 'basari' | 'hata'>('form');
  const [sunucuHatasi, setSunucuHatasi] = useState('');
  const [referansNo, setReferansNo] = useState('');
  const lastPdfRef = useRef<IhtidaPdfSonuc | null>(null);
  const kaydedildiMi = useRef(false);
  const paylasilabilirMi = useRef(false);

  useEffect(() => {
    const kayitli = taslakOku();
    kaydedildiMi.current = true;
    setDurum(kayitli);
  }, []);

  useEffect(() => {
    if (!kaydedildiMi.current) return;
    taslakYaz(durum);
  }, [durum]);

  function guncelle<K extends keyof FormState>(anahtar: K, deger: FormState[K]) {
    setDurum((s) => ({ ...s, [anahtar]: deger }));
    setHatalar((h) => { if (!h[anahtar as string]) return h; const n = { ...h }; delete n[anahtar as string]; return n; });
  }

  async function dosyaSecildi(anahtar: 'kimlikOn' | 'kimlikArka' | 'vesikalik', file: File) {
    setDosyaIsleniyorAlan(anahtar);
    try {
      const dataUrl = await gorseliSikistir(file);
      guncelle(anahtar, dataUrl);
    } catch (hata) {
      const kod = (hata as Error).message;
      setHatalar((h) => ({ ...h, [anahtar]: kod === 'too-large' ? m.dosyaCokBuyuk : m.dosyaGecersiz }));
    } finally {
      setDosyaIsleniyorAlan('');
    }
  }

  function adimGecerliMi(adim: number): boolean {
    const yeniHatalar: Record<string, string> = {};
    if (adim === 1) {
      if (!durum.adSoyad.trim()) yeniHatalar.adSoyad = m.zorunluAlan;
      if (!durum.cinsiyet) yeniHatalar.cinsiyet = m.zorunluAlan;
      if (!durum.dogumTarihi) yeniHatalar.dogumTarihi = m.zorunluAlan;
      else {
        const yas = yasHesapla(durum.dogumTarihi);
        if (yas === null) yeniHatalar.dogumTarihi = m.zorunluAlan;
        else if (yas < 18) yeniHatalar.dogumTarihi = m.yasUyari;
      }
      if (!durum.dogumYeri.trim()) yeniHatalar.dogumYeri = m.zorunluAlan;
      if (!durum.uyruk.trim()) yeniHatalar.uyruk = m.zorunluAlan;
      if (durum.tcVatandasi && !tcKimlikGecerliMi(durum.tcKimlikNo)) yeniHatalar.tcKimlikNo = m.gecersizKimlikNo;
      if (!durum.oncekiDin) yeniHatalar.oncekiDin = m.zorunluAlan;
      if (durum.oncekiDin === 'diger' && !durum.oncekiDinDiger.trim()) yeniHatalar.oncekiDinDiger = m.zorunluAlan;
    }
    if (adim === 2) {
      if (!durum.eposta.trim()) yeniHatalar.eposta = m.zorunluAlan;
      else if (!epostaGecerliMi(durum.eposta)) yeniHatalar.eposta = m.gecersizEposta;
      if (!durum.telefon.trim()) yeniHatalar.telefon = m.zorunluAlan;
      else if (!telGecerliMi(durum.telefon)) yeniHatalar.telefon = m.gecersizTelefon;
      if (!durum.adres.trim()) yeniHatalar.adres = m.zorunluAlan;
    }
    if (adim === 4) {
      if (!durum.kimlikOn) yeniHatalar.kimlikOn = m.zorunluAlan;
      if (durum.belgeTuru === 'kimlik' && !durum.kimlikArka) yeniHatalar.kimlikArka = m.zorunluAlan;
      if (!durum.vesikalik) yeniHatalar.vesikalik = m.zorunluAlan;
    }
    if (adim === 5) {
      if (!durum.kvkkOnay) yeniHatalar.kvkkOnay = m.onayGerekli;
      if (!durum.hurIradeOnay) yeniHatalar.hurIradeOnay = m.onayGerekli;
    }
    if (adim === 6) {
      if (!durum.imzaDataUrl) yeniHatalar.imza = m.imzaBos;
    }
    setHatalar(yeniHatalar);
    return Object.keys(yeniHatalar).length === 0;
  }

  function ileriGit() {
    if (!adimGecerliMi(durum.adim)) return;
    guncelle('adim', Math.min(TOPLAM_ADIM - 1, durum.adim + 1) as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function geriGit() {
    guncelle('adim', Math.max(0, durum.adim - 1) as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function anahtarGetir(): string {
    if (durum.gonderimAnahtari) return durum.gonderimAnahtari;
    const yeni = gonderimAnahtariUret();
    guncelle('gonderimAnahtari', yeni);
    return yeni;
  }

  async function basvuruyuGonder() {
    if (!adimGecerliMi(6)) { guncelle('adim', 6 as any); return; }
    setAsama('hazirlaniyor');
    setSunucuHatasi('');
    try {
      const gonderimTarihi = new Date();
      const pdf = await ihtidaPdfUret({
        dil, m,
        basvuran: {
          adSoyad: durum.adSoyad.trim(),
          cinsiyet: etiketBul(CINSIYET_SECENEKLERI, durum.cinsiyet, dil),
          dogumTarihi: durum.dogumTarihi,
          dogumYeri: durum.dogumYeri.trim(),
          uyruk: durum.uyruk.trim(),
          tcVatandasi: durum.tcVatandasi,
          tcKimlikNo: durum.tcVatandasi ? durum.tcKimlikNo.trim() : '',
          oncekiDin: durum.oncekiDin === 'diger' ? durum.oncekiDinDiger.trim() : etiketBul(ONCEKI_DIN_SECENEKLERI, durum.oncekiDin, dil),
          ogrenimDurumu: etiketBul(OGRENIM_SECENEKLERI, durum.ogrenimDurumu, dil),
          anneAdi: durum.anneAdi.trim(), babaAdi: durum.babaAdi.trim(),
          medeniHali: etiketBul(MEDENI_HAL_SECENEKLERI, durum.medeniHali, dil),
          meslek: durum.meslek.trim(),
          adres: durum.adres.trim(), eposta: durum.eposta.trim(), telefon: durum.telefon.trim(),
          ihtidaSebebi: durum.ihtidaSebebi.trim(), yeniIsim: durum.yeniIsim.trim(),
          torenDili: etiketBul(TOREN_DILI_SECENEKLERI, durum.torenDili, dil),
          torenTarihi: durum.torenTarihi,
          nasilHaberdar: etiketBul(HABERDAR_SECENEKLERI, durum.nasilHaberdar, dil),
          ekNot: durum.ekNot.trim(),
        },
        belgeTuru: durum.belgeTuru,
        kimlikOn: durum.kimlikOn, kimlikArka: durum.belgeTuru === 'kimlik' ? durum.kimlikArka : '', vesikalik: durum.vesikalik,
        imzaDataUrl: durum.imzaDataUrl,
        fotografIzni: durum.fotografIzni,
        gonderimTarihi,
        cami,
      });
      lastPdfRef.current = pdf;
      try { paylasilabilirMi.current = Boolean((navigator as any).share && (navigator as any).canShare && (navigator as any).canShare({ files: [pdf.file] })); } catch { paylasilabilirMi.current = false; }

      if (!ucNokta) { setAsama('hata'); setSunucuHatasi('servis-yok'); return; }

      setAsama('gonderiliyor');
      const govde = {
        tur: 'ihtida',
        sir: ORTAK_SIR,
        pdfBase64: base64Cevir(pdf.bytes),
        basvuran: {
          adSoyad: durum.adSoyad.trim(), cinsiyet: durum.cinsiyet, dogumTarihi: durum.dogumTarihi, dogumYeri: durum.dogumYeri.trim(),
          uyruk: durum.uyruk.trim(), tcKimlikNo: durum.tcVatandasi ? durum.tcKimlikNo.trim() : '',
          oncekiDin: durum.oncekiDin === 'diger' ? durum.oncekiDinDiger.trim() : durum.oncekiDin,
          eposta: durum.eposta.trim(), telefon: durum.telefon.trim(), adres: durum.adres.trim(),
          ogrenimDurumu: durum.ogrenimDurumu, anneAdi: durum.anneAdi.trim(), babaAdi: durum.babaAdi.trim(),
          medeniHali: durum.medeniHali, meslek: durum.meslek.trim(), ihtidaSebebi: durum.ihtidaSebebi.trim(),
          yeniIsim: durum.yeniIsim.trim(), torenDili: durum.torenDili, torenTarihi: durum.torenTarihi,
          nasilHaberdar: durum.nasilHaberdar, ekNot: durum.ekNot.trim(),
        },
        fotografIzni: durum.fotografIzni,
        gonderimAnahtari: anahtarGetir(),
      };
      const govdeMetni = JSON.stringify(govde);
      if (govdeMetni.length > 9 * 1024 * 1024) throw new Error('cok-buyuk');

      const denetleyici = typeof AbortController === 'function' ? new AbortController() : null;
      const zamanlayici = denetleyici ? setTimeout(() => denetleyici.abort(), 90000) : null;
      let cevap: Response;
      try {
        cevap = await fetch(ucNokta, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: govdeMetni,
          redirect: 'follow',
          signal: denetleyici ? denetleyici.signal : undefined,
        });
      } finally { if (zamanlayici) clearTimeout(zamanlayici); }

      let sonuc: any;
      try { sonuc = JSON.parse(await cevap.text()); } catch { throw new Error('gecersiz-cevap'); }
      if (!sonuc.ok) throw new Error(sonuc.hata || 'sunucu-hatasi');

      setReferansNo(sonuc.ref || '');
      taslakSil();
      setDurum(bosDurum());
      setAsama('basari');
    } catch (hata) {
      console.error(hata);
      const kod = String((hata as Error).message || '');
      setSunucuHatasi(kod === 'cok-buyuk' ? 'cok-buyuk' : 'gonderim-basarisiz');
      setAsama('hata');
    }
  }

  function pdfIndir() {
    const pdf = lastPdfRef.current;
    if (!pdf) return;
    const url = URL.createObjectURL(pdf.blob);
    const a = document.createElement('a');
    a.href = url; a.download = pdf.filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function epostaLinki(): string {
    const konu = encodeURIComponent(`${cami.ad} – ${m.pdfBaslik}`);
    const govde = encodeURIComponent(`${m.basariPdfNot}\n\n${cami.ad}\n${cami.adres}`);
    return `mailto:${cami.eposta}?subject=${konu}&body=${govde}`;
  }

  async function whatsappPaylas() {
    const pdf = lastPdfRef.current;
    if (!pdf) return;
    try { await (navigator as any).share({ files: [pdf.file], title: m.pdfBaslik }); } catch { /* kullanıcı iptal etti */ }
  }

  function yeniBasvuruBaslat() {
    taslakSil();
    lastPdfRef.current = null;
    setSunucuHatasi(''); setReferansNo('');
    setDurum(bosDurum());
    setAsama('form');
  }

  // -------------------------------------------------------------- sonuç ekranları
  if (asama === 'basari') {
    return (
      <div class="kart p-6 sm:p-8 grid gap-4 text-center max-w-[560px] mx-auto">
        <p class="etiket etiket-vurgu">{m.basariBaslik}</p>
        <p class="text-lg font-serif">{m.basariMetin(referansNo)}</p>
        <p class="text-sm text-(--metin-2)">{m.basariPdfNot}</p>
        <button type="button" class="dugme dugme-ikincil mx-auto mt-4" onClick={yeniBasvuruBaslat}>{m.yeniBasvuru}</button>
      </div>
    );
  }

  if (asama === 'hata') {
    const servisYok = sunucuHatasi === 'servis-yok';
    return (
      <div class="kart p-6 sm:p-8 grid gap-4 max-w-[560px] mx-auto">
        <p class="etiket etiket-vurgu">{servisYok ? m.servisYokBaslik : m.gonderimHataBaslik}</p>
        <p class="uyari text-sm">{servisYok ? m.servisYok : (sunucuHatasi === 'cok-buyuk' ? m.cokBuyuk : m.gonderimBasarisiz)}</p>
        <div class="grid gap-2">
          <p class="etiket">{m.yedekBaslik}</p>
          <button type="button" class="dugme dugme-birincil justify-center" onClick={pdfIndir}>{m.yedekIndir}</button>
          <a class="dugme dugme-ikincil justify-center" href={epostaLinki()}>{m.yedekEposta}</a>
          {paylasilabilirMi.current && <button type="button" class="dugme dugme-ikincil justify-center" onClick={whatsappPaylas}>{m.yedekWhatsapp}</button>}
        </div>
        {!servisYok && <button type="button" class="dugme dugme-ikincil mx-auto mt-2" onClick={basvuruyuGonder}>{m.tekrarDene}</button>}
      </div>
    );
  }

  const gonderimMeşgul = asama === 'hazirlaniyor' || asama === 'gonderiliyor';
  const adim = durum.adim;
  const adimBasligi = ADIM_BASLIKLARI[dil][adim];

  return (
    <div class="grid gap-6 max-w-[720px] mx-auto">
      <div>
        <div class="flex items-baseline justify-between gap-2 mb-2">
          <p class="etiket etiket-vurgu">{m.adimSayaci(adim + 1, TOPLAM_ADIM)}</p>
          <p class="etiket">{adimBasligi}</p>
        </div>
        <div class="h-1.5 bg-(--zemin-2) rounded-full overflow-hidden" role="progressbar" aria-valuenow={adim + 1} aria-valuemin={1} aria-valuemax={TOPLAM_ADIM}>
          <div class="h-full bg-(--vurgu) transition-[width] duration-300" style={{ width: `${((adim + 1) / TOPLAM_ADIM) * 100}%` }} />
        </div>
      </div>

      <form class="kart p-5 sm:p-7 grid gap-5" onSubmit={(e) => e.preventDefault()}>
        {adim === 0 && (
          <div class="grid gap-4">
            <h2 class="text-xl">{m.girisBaslik}</h2>
            <p class="text-(--metin-2)">{m.girisMetin1}</p>
            <p class="text-(--metin-2)">{m.girisMetin2}</p>
            <p class="uyari text-sm">{m.girisUyari}</p>
          </div>
        )}

        {adim === 1 && (
          <div class="grid gap-5 sm:grid-cols-2">
            <Alan etiket={m.adSoyad} deger={durum.adSoyad} hata={hatalar.adSoyad} zorunlu onDegisti={(v) => guncelle('adSoyad', v)} genislik="tam" />
            <SecimAlani etiket={m.cinsiyet} deger={durum.cinsiyet} hata={hatalar.cinsiyet} zorunlu secenekler={CINSIYET_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('cinsiyet', v)} />
            <Alan etiket={m.dogumTarihi} deger={durum.dogumTarihi} hata={hatalar.dogumTarihi} zorunlu tip="date" onDegisti={(v) => guncelle('dogumTarihi', v)} genislik="yari" />
            <Alan etiket={m.dogumYeri} deger={durum.dogumYeri} hata={hatalar.dogumYeri} zorunlu onDegisti={(v) => guncelle('dogumYeri', v)} genislik="yari" />
            <Alan etiket={m.uyruk} deger={durum.uyruk} hata={hatalar.uyruk} zorunlu onDegisti={(v) => guncelle('uyruk', v)} genislik="yari" />
            <div class="grid gap-1.5 content-start">
              <OnayKutusu id="tcVatandasi" isaretli={durum.tcVatandasi} onDegisti={(v) => guncelle('tcVatandasi', v)} cocuk={m.tcVatandasi} />
              {durum.tcVatandasi && <Alan etiket={m.tcKimlikNo} deger={durum.tcKimlikNo} hata={hatalar.tcKimlikNo} zorunlu tip="text" onDegisti={(v) => guncelle('tcKimlikNo', v.replace(/\D/g, '').slice(0, 11))} genislik="tam" />}
            </div>
            <SecimAlani etiket={m.oncekiDin} deger={durum.oncekiDin} hata={hatalar.oncekiDin} zorunlu secenekler={ONCEKI_DIN_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('oncekiDin', v)} />
            {durum.oncekiDin === 'diger' && <Alan etiket={m.oncekiDinDiger} deger={durum.oncekiDinDiger} hata={hatalar.oncekiDinDiger} zorunlu onDegisti={(v) => guncelle('oncekiDinDiger', v)} genislik="yari" />}

            <p class="sm:col-span-2 etiket etiket-vurgu mt-2">{m.opsiyonelBolum}</p>
            <SecimAlani etiket={m.ogrenimDurumu} deger={durum.ogrenimDurumu} secenekler={OGRENIM_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('ogrenimDurumu', v)} />
            <SecimAlani etiket={m.medeniHali} deger={durum.medeniHali} secenekler={MEDENI_HAL_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('medeniHali', v)} />
            <Alan etiket={m.anneAdi} deger={durum.anneAdi} onDegisti={(v) => guncelle('anneAdi', v)} genislik="yari" />
            <Alan etiket={m.babaAdi} deger={durum.babaAdi} onDegisti={(v) => guncelle('babaAdi', v)} genislik="yari" />
            <Alan etiket={m.meslek} deger={durum.meslek} onDegisti={(v) => guncelle('meslek', v)} genislik="tam" />
          </div>
        )}

        {adim === 2 && (
          <div class="grid gap-5 sm:grid-cols-2">
            <Alan etiket={m.eposta} deger={durum.eposta} hata={hatalar.eposta} zorunlu tip="email" onDegisti={(v) => guncelle('eposta', v)} genislik="yari" />
            <Alan etiket={m.telefon} deger={durum.telefon} hata={hatalar.telefon} zorunlu tip="tel" yerTutucu="+32 4xx xx xx xx" onDegisti={(v) => guncelle('telefon', v)} genislik="yari" />
            <Alan etiket={m.adres} deger={durum.adres} hata={hatalar.adres} zorunlu girdiTuru="textarea" satir={3} yerTutucu={m.adresYerTutucu} onDegisti={(v) => guncelle('adres', v)} genislik="tam" />
          </div>
        )}

        {adim === 3 && (
          <div class="grid gap-5 sm:grid-cols-2">
            <Alan etiket={m.ihtidaSebebi} deger={durum.ihtidaSebebi} girdiTuru="textarea" satir={3} yerTutucu={m.ihtidaSebebiYerTutucu} onDegisti={(v) => guncelle('ihtidaSebebi', v)} genislik="tam" />
            <div class="grid gap-1.5 content-start">
              <Alan etiket={m.yeniIsim} deger={durum.yeniIsim} onDegisti={(v) => guncelle('yeniIsim', v)} genislik="yari" />
              <p class="text-sm text-(--metin-2)">{m.yeniIsimNot}</p>
            </div>
            <SecimAlani etiket={m.torenDili} deger={durum.torenDili} secenekler={TOREN_DILI_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('torenDili', v)} />
            <div class="grid gap-1.5 content-start">
              <Alan etiket={m.torenTarihi} deger={durum.torenTarihi} tip="date" onDegisti={(v) => guncelle('torenTarihi', v)} genislik="yari" />
              <p class="text-sm text-(--metin-2)">{m.torenTarihiNot}</p>
            </div>
            <SecimAlani etiket={m.nasilHaberdar} deger={durum.nasilHaberdar} secenekler={HABERDAR_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('nasilHaberdar', v)} />
            <Alan etiket={m.ekNot} deger={durum.ekNot} girdiTuru="textarea" satir={2} onDegisti={(v) => guncelle('ekNot', v)} genislik="tam" />
          </div>
        )}

        {adim === 4 && (
          <div class="grid gap-5">
            <SecimAlani etiket={m.belgeTuru} deger={durum.belgeTuru} secenekler={BELGE_TURU_SECENEKLERI} dil={dil} onDegisti={(v) => guncelle('belgeTuru', (v || 'kimlik') as any)} genislik="tam" />
            <DosyaAlani etiket={m.kimlikOn} deger={durum.kimlikOn} hata={hatalar.kimlikOn} zorunlu m={m} isleniyor={dosyaIsleniyorAlan === 'kimlikOn'} onSecildi={(f) => dosyaSecildi('kimlikOn', f)} />
            {durum.belgeTuru === 'kimlik' && <DosyaAlani etiket={m.kimlikArka} deger={durum.kimlikArka} hata={hatalar.kimlikArka} zorunlu m={m} isleniyor={dosyaIsleniyorAlan === 'kimlikArka'} onSecildi={(f) => dosyaSecildi('kimlikArka', f)} />}
            <DosyaAlani etiket={m.vesikalik} deger={durum.vesikalik} hata={hatalar.vesikalik} zorunlu m={m} isleniyor={dosyaIsleniyorAlan === 'vesikalik'} onSecildi={(f) => dosyaSecildi('vesikalik', f)} />
          </div>
        )}

        {adim === 5 && (
          <div class="grid gap-5">
            <div>
              <p class="etiket etiket-vurgu mb-2">{m.rizaBaslik}</p>
              <p class="text-sm text-(--metin-2) bilgi">{m.rizaOzet}</p>
              <p class="mt-2"><a href={ek10Yolu} target="_blank" rel="noopener">{m.rizaTamMetin}</a></p>
            </div>
            <OnayKutusu id="kvkkOnay" isaretli={durum.kvkkOnay} onDegisti={(v) => guncelle('kvkkOnay', v)} cocuk={m.rizaOnay} hata={hatalar.kvkkOnay} />
            <OnayKutusu id="hurIradeOnay" isaretli={durum.hurIradeOnay} onDegisti={(v) => guncelle('hurIradeOnay', v)} cocuk={m.hurIradeOnay} hata={hatalar.hurIradeOnay} />
            <div class="cetvel pt-4">
              <p class="etiket etiket-vurgu mb-2">{m.fotografIzniBaslik}</p>
              <p class="text-sm text-(--metin-2)">{m.fotografIzniMetin}</p>
              <div class="mt-2"><OnayKutusu id="fotografIzni" isaretli={durum.fotografIzni} onDegisti={(v) => guncelle('fotografIzni', v)} cocuk={m.fotografIzniOnay} /></div>
            </div>
            <p class="text-sm text-(--metin-2)">{m.gdprNot}</p>
          </div>
        )}

        {adim === 6 && (
          <IhtidaImza deger={durum.imzaDataUrl} onDegisti={(v) => guncelle('imzaDataUrl', v)} m={m} hata={hatalar.imza} />
        )}

        {adim === 7 && (
          <div class="grid gap-4">
            <h2 class="text-xl">{m.ozetBaslik}</h2>
            <dl class="grid gap-2 text-sm">
              <div class="flex justify-between gap-4 cetvel pt-2"><dt class="etiket">{m.adSoyad}</dt><dd class="text-right">{durum.adSoyad}</dd></div>
              <div class="flex justify-between gap-4"><dt class="etiket">{m.dogumTarihi}</dt><dd class="text-right">{durum.dogumTarihi}</dd></div>
              <div class="flex justify-between gap-4"><dt class="etiket">{m.eposta}</dt><dd class="text-right">{durum.eposta}</dd></div>
              <div class="flex justify-between gap-4"><dt class="etiket">{m.telefon}</dt><dd class="text-right">{durum.telefon}</dd></div>
              <div class="flex justify-between gap-4"><dt class="etiket">{m.adres}</dt><dd class="text-right">{durum.adres}</dd></div>
            </dl>
            {durum.imzaDataUrl && <div class="kart-kagit p-3 w-fit"><img src={durum.imzaDataUrl} alt="" class="h-16 w-auto" /></div>}
            <p class="duz-yazi text-sm italic">{m.beyanCumlesi}</p>
            <button type="button" class="dugme dugme-birincil justify-center min-h-11 mt-2" disabled={gonderimMeşgul} onClick={basvuruyuGonder}>
              {asama === 'hazirlaniyor' ? m.hazirlaniyor : asama === 'gonderiliyor' ? m.gonderiliyor : m.gonder}
            </button>
          </div>
        )}

        {adim < 7 && (
          <div class="flex justify-between gap-3 mt-2">
            <button type="button" class="dugme dugme-ikincil min-h-11" onClick={geriGit} disabled={adim === 0}>{m.geri}</button>
            <button type="button" class="dugme dugme-birincil min-h-11" onClick={adim === 0 ? () => { guncelle('adim', 1 as any); window.scrollTo({ top: 0, behavior: 'smooth' }); } : ileriGit}>
              {adim === 0 ? m.devamEt : m.ileri}
            </button>
          </div>
        )}
        {adim === 7 && (
          <div class="flex justify-start mt-1">
            <button type="button" class="dugme dugme-ikincil min-h-11" onClick={geriGit} disabled={gonderimMeşgul}>{m.geri}</button>
          </div>
        )}
      </form>
    </div>
  );
}
