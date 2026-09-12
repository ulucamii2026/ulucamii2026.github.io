/**
 * Veli portalı tarayıcı uygulaması (6 Eyl 2026). Sunucu yok: Firebase Auth + Firestore (lite) doğrudan tarayıcıdan.
 * Akış: e-posta bağlantısı → (ilk kez) şifre belirleme → pano; sonraki girişler e-posta + şifre. Veri erişimi
 * firebase/firestore.rules ile sınırlı (veli yalnız aileler/{e-posta}.ogrenciler listesindeki öğrencileri okur).
 */
import type { Dil } from '../i18n/ui';
import { veliMetni, yerlestir, type VeliMetin } from '../i18n/veli';
import { temizleHtml, metniSadelestir, zenginMi } from '../lib/zengin-metin';
import { portalTercihleri } from '../lib/portal-tercihleri';
import { EZBER_LISTESI } from '../lib/ezber-verisi';
import { ELIFBA_HARFLERI, HARF_GRUPLARI, HAREKELER, gununHarfiGetir, type HarfGrup, type HarekeTuru } from '../lib/elifba-verisi';
import { QUIZ_SORULARI } from '../lib/quiz-verisi';
import { gununHadisiGetir } from '../lib/hadis-verisi';

type Ders = { no: number; kod: string; alan: string; konu: string; ezber: string[] };
type PlanGun = { tarih: string; hafta: number; dersler: Ders[] };
type Veri = { donem: string; gunler: PlanGun[]; materyalGunleri: string[]; materyalYolu: string; gizlilikYolu: string; kursYolu: string; dilYollari: Record<Dil, string> };
type Ogrenci = { ref: string; ad: string; soyad: string; durum?: string };
type DurumTip = 'var' | 'yok' | 'mazeret' | 'gec';
// Yoklama artık gün başına DERS DERS tutulur: dersler = { "1": durum, "2": durum, "3": durum } (gün-içi sıra → durum).
// Eski belgeler tek `durum` taşıyordu; okuyucular geriye-dönük uyumlu (o durumu üç derse de uygular).
type Yoklama = { ref: string; tarih: string; dersler?: Record<string, DurumTip>; durum?: DurumTip; not?: string };
type Ilerleme = { kuranAdim?: number; ezber?: Record<string, 'ogrendi' | 'tekrar' | 'baslamadi'>; alanlar?: Record<string, number>; hocaNotu?: string; guncelleme?: string; rozet?: string };
type Degerlendirme = { tarih: string; alan: string; olcut?: string; derece?: number; not?: string };
type Not = { tarih: string; metin: string };
type Odev = { tarih: string; hafta?: number; ezber?: Record<string, string>; odev?: Record<string, string>; materyal?: string; yayin: boolean };
type Duyuru = { tarih: string; baslik: Record<string, string>; metin: Record<string, string>; yayin: boolean };
type Bildirim = { id?: string; ref: string; tur: string; tarih?: string; metin: string; okundu: boolean; zaman?: { toDate?: () => Date } | string; yanit?: string; yanitZaman?: { toDate?: () => Date } | string };

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const yerel: Record<Dil, string> = { tr: 'tr-TR', fr: 'fr-BE', en: 'en-GB' };
const bugunISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
const gunEkle = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export async function veliPortali(): Promise<void> {
  const kok = document.getElementById('veli-portal');
  const veriEl = document.getElementById('veli-veri');
  if (!kok || !veriEl) return;
  const dil = (kok.dataset.dil as Dil) || 'tr';
  const m: VeliMetin = veliMetni(dil);
  const veri = JSON.parse(veriEl.textContent || '{}') as Veri;
  const tarihYaz = (iso: string, sec: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
    iso ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', ...sec }).format(new Date(iso.slice(0, 10) + 'T12:00:00')) : '';
  const cok = (o: Record<string, string> | undefined) => (o ? (o[dil] || o.fr || o.tr || '') : '');
  // Duyuru/ödev metnindeki https bağlantılarını tıklanabilir yapar (önce kaçış, sonra bağlantı; sondaki noktalama bağlantıya girmez)
  const bagla = (s: string) => esc(s).replace(/https?:\/\/[^\s<]*[^\s<.,;:!?)]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  // Duyuru metni: zengin editör HTML'i ise sanitize; düz metin (eski) ise kaçış + bağlantı + satır sonu.
  // zenginMi ile kesin ayrım — «a<b olacak» gibi düz metin yanlışlıkla HTML sanılıp yutulmaz.
  const duyuruHtml = (s: string) => zenginMi(s) ? temizleHtml(s) : bagla(s).replace(/\n/g, '<br>');
  // Uzunluk/kırpma için düz metin biçimi (zengin ise etiketleri at, düz ise olduğu gibi).
  const duyuruDuz = (s: string) => (zenginMi(s) ? metniSadelestir(s) : s).replace(/\s+/g, ' ').trim();
  const alanAdi = (kod: string) => (m.alan as Record<string, string>)[kod] || kod;
  // Bir yoklama gününü ders ders normalleştirir (yeni `dersler` haritası ya da eski tek `durum`dan).
  const dersDurumlari = (y: Yoklama): { sira: string; durum: DurumTip }[] => {
    const h = y.dersler && typeof y.dersler === 'object' ? y.dersler : (y.durum ? { '1': y.durum, '2': y.durum, '3': y.durum } : {});
    return Object.keys(h).filter((s) => h[s]).sort().map((s) => ({ sira: s, durum: h[s] }));
  };

  let paylasimliAudioCtx: AudioContext | null = null;
  const getSesBaglami = (): AudioContext | null => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!paylasimliAudioCtx || paylasimliAudioCtx.state === 'closed') {
        paylasimliAudioCtx = new AudioCtx();
      }
      if (paylasimliAudioCtx.state === 'suspended') {
        paylasimliAudioCtx.resume().catch(() => {});
      }
      return paylasimliAudioCtx;
    } catch {
      return null;
    }
  };

  const kutlamaSesiCal = () => {
    try {
      const ctx = getSesBaglami();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch {}
  };

  const hataSesiCal = () => {
    try {
      const ctx = getSesBaglami();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  };

  const pariltiSesiCal = () => {
    try {
      const ctx = getSesBaglami();
      if (!ctx) return;
      const frekanslar = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      frekanslar.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const baslama = ctx.currentTime + i * 0.05;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, baslama);
        gain.gain.setValueAtTime(0.08, baslama);
        gain.gain.exponentialRampToValueAtTime(0.001, baslama + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(baslama);
        osc.stop(baslama + 0.35);
      });
    } catch {}
  };

  const harekeTonuCal = (harfMetni: string) => {
    try {
      const ctx = getSesBaglami();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (harfMetni.includes('\u064E')) {
        // Üstün: Yükselen ferah ton (a/e)
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
      } else if (harfMetni.includes('\u0650')) {
        // Esre: İnce tiz ton (i)
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.15);
      } else if (harfMetni.includes('\u064F')) {
        // Ötre: Tok derin ton (u/ü)
        osc.frequency.setValueAtTime(349.23, now);
        osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.18);
      } else if (harfMetni.includes('\u0651')) {
        // Şedde: Çift vurgulu ton
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
      } else {
        // Cezim: Kısa net duraklama vuruşu
        osc.frequency.setValueAtTime(440, now);
      }
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  };

  const konfetiPatlat = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const sar = document.createElement('div');
      sar.className = 'konfeti-alani';
      sar.setAttribute('aria-hidden', 'true');
      const renkler = ['#d4af37', '#2e7d32', '#c62828', '#1565c0', '#f59e0b', '#8b5cf6'];
      for (let i = 0; i < 32; i++) {
        const p = document.createElement('span');
        p.className = 'konfeti-parcacik';
        p.style.backgroundColor = renkler[i % renkler.length];
        p.style.left = `${Math.floor(Math.random() * 96) + 2}%`;
        p.style.animationDelay = `${(Math.random() * 0.35).toFixed(2)}s`;
        p.style.animationDuration = `${(1.2 + Math.random() * 0.7).toFixed(2)}s`;
        sar.appendChild(p);
      }
      kok.appendChild(sar);
      setTimeout(() => { sar.remove(); }, 2400);
    } catch {}
  };

  const HARF_SES_HARITASI: Record<string, string> = {
    'elif': 'elif', 'be': 'be', 'te': 'te', 'se': 'se', 'cim': 'cim', 'ha': 'ha', 'hi': 'hi',
    'dal': 'dal', 'zel': 'zel', 'ra': 'ra', 'ze': 'ze', 'sin': 'sin', 'sin2': 'sin2', 'sad': 'sad',
    'dad': 'dad', 'ti': 'ti', 'zi': 'zi', 'ayn': 'ayn', 'gayn': 'gayn', 'fe': 'fe', 'kaf': 'kaf',
    'kef': 'kef', 'lam': 'lam', 'mim': 'mim', 'nun': 'nun', 'vav': 'vav', 'he': 'he', 'ye': 'ye',
    'shin': 'sin2', 'şin': 'sin2',
    'ا': 'elif', 'ب': 'be', 'ت': 'te', 'ث': 'se', 'ج': 'cim', 'ح': 'ha', 'خ': 'hi',
    'د': 'dal', 'ذ': 'zel', 'ر': 'ra', 'ز': 'ze', 'س': 'sin', 'ش': 'sin2', 'ص': 'sad',
    'ض': 'dad', 'ط': 'ti', 'ظ': 'zi', 'ع': 'ayn', 'غ': 'gayn', 'ف': 'fe', 'ق': 'kaf',
    'ك': 'kef', 'ل': 'lam', 'م': 'mim', 'ن': 'nun', 'و': 'vav', 'ه': 'he', 'هـ': 'he', 'ي': 'ye', 'ى': 'ye',
  };

  let aktifAudio: HTMLAudioElement | null = null;
  const tumSesleriDurdur = () => {
    try {
      if (aktifAudio) {
        aktifAudio.pause();
        aktifAudio.currentTime = 0;
      }
    } catch {}
    try {
      kok.querySelectorAll<HTMLAudioElement>('audio').forEach((a) => {
        if (!a.paused) {
          a.pause();
          a.currentTime = 0;
        }
      });
    } catch {}
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  };

  const harekeliSeslendir = (harfId: string, harekeId: HarekeTuru, harfMetni: string) => {
    tumSesleriDurdur();

    const sesKlasor = harekeId === 'ustun' ? 'ustun'
      : harekeId === 'esre' ? 'esre'
      : harekeId === 'otre' ? 'otre'
      : null;

    if (sesKlasor) {
      try {
        aktifAudio = new Audio(`/media/ses/elifba/${sesKlasor}/${harfId}.mp3`);
        aktifAudio.play().catch(() => {
          harekeTonuCal(harfMetni);
          sesliFallback(harfMetni);
        });
        return;
      } catch {
        harekeTonuCal(harfMetni);
        sesliFallback(harfMetni);
        return;
      }
    }

    // Cezm (Sükûn): Arapça fonetiğinde ve Diyanet Elifbâ meşki usulünde
    // cezimli harf tek başına okunamaz, önüne elif/hemze konularak meşk edilir (Eb, Et, Es, Ec...)
    if (harekeId === 'cezm') {
      try {
        harekeTonuCal(harfMetni);
        const yalinHarf = harfMetni.replace(/[\u064B-\u0652]/g, '') || 'ب';
        const meskMetni = yalinHarf === 'ا' ? 'اَهْ' : `اَ${yalinHarf}\u0652`;
        metinSeslendir(meskMetni, 'ar-SA');
        return;
      } catch {
        harekeTonuCal(harfMetni);
        return;
      }
    }

    // Şedde (Teşdid): Arapça fonetiğinde şeddeli harf tek başına okunamaz,
    // bir önceki harfle çiftlenerek meşk edilir (Ebbe, Ette, Esse, Ecce...)
    if (harekeId === 'sedde') {
      try {
        harekeTonuCal(harfMetni);
        const yalinHarf = harfMetni.replace(/[\u064B-\u0652]/g, '') || 'ب';
        const meskMetni = yalinHarf === 'ا' ? 'اَأَّ' : `اَ${yalinHarf}\u0651\u064E`;
        metinSeslendir(meskMetni, 'ar-SA');
        return;
      } catch {
        harekeTonuCal(harfMetni);
        return;
      }
    }

    harekeTonuCal(harfMetni);
    sesliFallback(harfMetni);
  };

  const harfSeslendir = (harfMetni: string, harfId?: string) => {
    tumSesleriDurdur();

    // Harekeli harf seslendiriliyorsa doğrudan Diyanet resmi sesine git
    const harekeliMi = /[\u064B-\u0652]/.test(harfMetni);
    if (harekeliMi) {
      const hId = harfId || HARF_SES_HARITASI[harfMetni[0]] || 'elif';
      let hrk: HarekeTuru = 'ustun';
      if (harfMetni.includes('\u0650')) hrk = 'esre';
      else if (harfMetni.includes('\u064F')) hrk = 'otre';
      else if (harfMetni.includes('\u0652')) hrk = 'cezm';
      else if (harfMetni.includes('\u0651')) hrk = 'sedde';
      harekeliSeslendir(hId, hrk, harfMetni);
      return;
    }

    const sesId = harfId || HARF_SES_HARITASI[harfMetni] || HARF_SES_HARITASI[harfMetni[0]];
    if (sesId) {
      try {
        if (aktifAudio) {
          aktifAudio.pause();
          aktifAudio.currentTime = 0;
        }
        aktifAudio = new Audio(`/media/ses/elifba/${sesId}.mp3`);
        aktifAudio.play().catch(() => {
          sesliFallback(harfMetni);
        });
        return;
      } catch {
        sesliFallback(harfMetni);
        return;
      }
    }
    sesliFallback(harfMetni);
  };

  const metinSeslendir = (metin: string, dilKodu = 'ar-SA') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(metin);
      u.lang = dilKodu;
      u.rate = dilKodu.startsWith('ar') ? 0.75 : 0.9;
      const sesler = window.speechSynthesis.getVoices();
      const uygunSes = sesler.find((v) => v.lang && v.lang.toLowerCase().startsWith(dilKodu.slice(0, 2).toLowerCase()));
      if (uygunSes) u.voice = uygunSes;
      window.speechSynthesis.speak(u);
    }
  };

  const fransizcaMealSeslendir = (ezberId: string, frMetin: string) => {
    tumSesleriDurdur();
    const yerelUrl = `/media/ses/mealler/fr/${ezberId}.mp3`;
    try {
      const a = new Audio(yerelUrl);
      aktifAudio = a;
      a.play().catch(() => {
        metinSeslendir(frMetin, 'fr-FR');
      });
    } catch {
      metinSeslendir(frMetin, 'fr-FR');
    }
  };

  const sesliFallback = (metin: string) => {
    metinSeslendir(metin, 'ar-SA');
  };

  const harfTikSesiCal = () => {
    try {
      const ctx = getSesBaglami();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  };

  /* çizili tek-çizgi ikonlar (currentColor; craft: emoji/glyph değil) */
  const SIMGELER: Record<string, string> = {
    takvim: '<rect x="3" y="4.5" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    grafik: '<path d="M4 4v16h16"/><path d="M7.5 14.5l3-3.5 2.5 2 4.5-6"/>',
    yildiz: '<path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8z"/>',
    not: '<path d="M20 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4v3.5L13.5 16H20a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/>',
    duyuru: '<path d="M4 10v4h3l7 4V6l-7 4H4z"/><path d="M17.5 9a3.5 3.5 0 0 1 0 6"/>',
    gonder: '<path d="M21 3L3 10.6l7 2.5L12.5 20 21 3z"/><path d="M10 13.1L21 3"/>',
    ayar: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    kitap: '<path d="M12 6.5C10.5 5 8 4.6 4 5.1v12.8c4-.5 6.5-.1 8 1.4 1.5-1.5 4-1.9 8-1.4V5.1c-4-.5-6.5-.1-8 1.4z"/><path d="M12 6.5v12.2"/>',
    ogrenci: '<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11.2V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-3.8"/>',
    kilit: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    zarf: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    ok: '<path d="M9 5l7 7-7 7"/>',
    disari: '<path d="M7 17L17 7M8.5 7H17v8.5"/>',
    cikis: '<path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M17 8l4 4-4 4M9.5 12H21"/>',
    kalem: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5z"/><path d="M14 7l3 3"/>',
    geri: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-1.5"/>',
    paylas: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    ates: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  };
  const simge = (ad: string) => `<svg class="simge" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SIMGELER[ad] || ''}</svg>`;
  const monogramHarfleri = (ad: string, soyad: string) => {
    const a = (ad || '').trim().charAt(0).toLocaleUpperCase('tr-TR');
    const s = (soyad || '').trim().charAt(0).toLocaleUpperCase('tr-TR');
    return (a + s) || 'Ö';
  };
  const monogramSinifi = (ref: string) => {
    const renkler = ['r-iznik', 'r-kiremit', 'r-adacayi', 'r-ochre'];
    let hash = 0;
    for (let i = 0; i < (ref || '').length; i++) hash = (hash + ref.charCodeAt(i)) % renkler.length;
    return renkler[hash];
  };

  const gunlukSeriGuncelle = (ref: string): number => {
    try {
      const anahtar = `mektep_seri_${ref}`;
      const sonTarihAnahtar = `mektep_seri_tarih_${ref}`;
      const bugun = bugunISO();
      const sonGiris = localStorage.getItem(sonTarihAnahtar);
      let seri = parseInt(localStorage.getItem(anahtar) || '0', 10);
      if (sonGiris === bugun) {
        return Math.max(1, seri);
      }
      if (sonGiris) {
        const dun = gunEkle(bugun, -1);
        if (sonGiris === dun) {
          seri += 1;
        } else {
          seri = 1;
        }
      } else {
        seri = 1;
      }
      localStorage.setItem(anahtar, String(seri));
      localStorage.setItem(sonTarihAnahtar, bugun);
      return seri;
    } catch {
      return 1;
    }
  };

  const evOnayDurumuGetir = (ref: string, ezberId: string): boolean => {
    try {
      return localStorage.getItem(`ev_onay_${ref}_${ezberId}`) === '1';
    } catch {
      return false;
    }
  };

  const evOnayiKaydet = (ref: string, ezberId: string): boolean => {
    try {
      localStorage.setItem(`ev_onay_${ref}_${ezberId}`, '1');
      return true;
    } catch {
      return false;
    }
  };
  const bosDurum = (ikon: string, metin: string) => `<p class="bos">${simge(ikon)}<span>${esc(metin)}</span></p>`;

  const [{ firebaseUygulamasi }, auth, fs] = await Promise.all([import('../lib/firebase'), import('firebase/auth'), import('firebase/firestore/lite')]);
  const app = firebaseUygulamasi();
  const a = auth.getAuth(app);
  a.languageCode = dil;
  const db = fs.getFirestore(app);
  const sayfaAdresi = location.origin + location.pathname;

  const hataMetni = (e: unknown): string => {
    const kod = (e as { code?: string })?.code || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login-credentials/.test(kod)) return m.hataGiris;
    if (/invalid-email|missing-email/.test(kod)) return m.hataEposta;
    if (/weak-password/.test(kod)) return m.hataSifre;
    if (/too-many-requests|quota-exceeded/.test(kod)) return m.hataCok;
    if (/invalid-action-code|expired-action-code/.test(kod)) return m.hataBag;
    if (/network-request-failed/.test(kod)) return m.hataAg;
    return yerlestir(m.hataGenel, { mesaj: kod || String((e as Error)?.message || e) });
  };
  const mesaj = (form: HTMLElement, metin: string, tur: 'hata' | 'basari' | '' = '') => {
    const p = form.querySelector<HTMLElement>('[data-mesaj]'); if (!p) return;
    p.textContent = metin; p.className = 'not ' + tur; p.hidden = !metin;
  };
  const mesgul = (form: HTMLFormElement, durum: boolean) => form.querySelectorAll<HTMLButtonElement>('button').forEach((b) => { b.disabled = durum; });

  /* Ekran okuyucu duyurusu: panonun tamamı canlı bölge DEĞİL (her çizimde her şeyi okurdu);
     yalnız bu küçük bölge duyurur. Aynı metin art arda gelirse okunsun diye önce boşaltılır. */
  const duyur = (metin: string) => {
    const b = document.getElementById('veli-durum'); if (!b) return;
    b.textContent = ''; setTimeout(() => { b.textContent = metin; }, 60);
  };
  /* Kısa bildirim şeridi: panonun başına konur, duyurulur ve kendiliğinden kalkar. */
  const bildirimGoster = (metin: string, tur: 'basari' | 'hata' = 'basari') => {
    kok.querySelectorAll('.portal-toast').forEach((x) => x.remove());
    kok.insertAdjacentHTML('afterbegin', `<p class="not ${tur} portal-toast" role="presentation">${esc(metin)}</p>`);
    duyur(metin);
    window.setTimeout(() => kok.querySelector('.portal-toast')?.remove(), 6000);
  };

  /* ---------------------------------------------------------------- giriş ekranı */
  const girisEkrani = (onMesaj = '') => {
    kok.innerHTML = `
      <div class="giris-sar">
        ${onMesaj ? `<p class="not basari">${esc(onMesaj)}</p>` : ''}
        <div class="giris-hos">
          <span class="simge-cerceve">${simge('ogrenci')}</span>
          <p>${esc(m.girisHos)}</p>
        </div>
        <form class="giris-kart" data-form="giris" novalidate>
          <h2>${simge('kilit')}${esc(m.girisBaslik)}</h2>
          <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
          <label>${esc(m.sifre)}<input type="password" name="sifre" required autocomplete="current-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.girisYap)}</button></div>
        </form>
        <details class="ilk-giris">
          <summary>${simge('ok')}<span>${esc(m.ilkKez)}</span></summary>
          <div class="govde">
            <form class="giris-kart" data-form="bag" novalidate>
              <p class="kucuk">${esc(m.bagAciklama)}</p>
              <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
              <p data-mesaj hidden class="not"></p>
              <div class="satir-dugmeler"><button type="submit" class="dugme dugme-iznik">${simge('zarf')}${esc(m.bagGonder)}</button><button type="button" class="dugme dugme-ikincil" data-eylem="sifremiUnuttum">${esc(m.sifremiUnuttum)}</button></div>
            </form>
          </div>
        </details>
      </div>`;
    const kayitli = portalTercihleri.getItem('veliEposta');
    if (kayitli) kok.querySelectorAll<HTMLInputElement>('input[name=eposta]').forEach((i) => { i.value = kayitli; });
  };

  const bagTamamlaEkrani = () => {
    kok.innerHTML = `
      <div class="giris-sar">
        <form class="giris-kart" data-form="bagTamamla" novalidate>
          <h2>${simge('zarf')}${esc(m.girisBaslik)}</h2>
          <p class="kucuk">${esc(m.bagTamamla)}</p>
          <label>${esc(m.eposta)}<input type="email" name="eposta" required autocomplete="username" inputmode="email"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${esc(m.bagOnayla)}</button></div>
        </form>
      </div>`;
  };

  const sifreEkrani = (zorunluDegil: boolean) => {
    kok.innerHTML = `
      <div class="giris-sar">
        <div class="giris-hos"><span class="simge-cerceve">${simge('kilit')}</span><p>${esc(m.sifreBelirleA)}</p></div>
        <form class="giris-kart" data-form="sifreBelirle" novalidate>
          <h2>${simge('kilit')}${esc(m.sifreBelirleBaslik)}</h2>
          <label>${esc(m.sifre)}<input type="password" name="sifre" required minlength="8" autocomplete="new-password"></label>
          <label>${esc(m.sifreTekrar)}<input type="password" name="sifre2" required minlength="8" autocomplete="new-password"></label>
          <p data-mesaj hidden class="not"></p>
          <div class="satir-dugmeler">
            <button type="submit" class="dugme dugme-birincil">${esc(m.kaydet)}</button>
            ${zorunluDegil ? `<button type="button" class="dugme dugme-ikincil" data-eylem="atla">${esc(m.atla)}</button>` : ''}
          </div>
        </form>
      </div>`;
  };

  /* ---------------------------------------------------------------- pano */
  type Durum = { eposta: string; aile: { ogrenciler: string[]; dil?: string; sifreVar?: boolean;
      /* kitapSecim: öğrenci ref'i → {secim: 'var'|'satin'|'fotokopi', zaman}. Veli kendi belgesine yazar
         (firestore.rules aileler update izin listesinde). Hoca ekranı bu haritayı okuyup hazırlık yapar. */
      kitapSecim?: Record<string, { secim: string; zaman: string }> }; ogrenciler: Ogrenci[]; secili: number;
    mod?: 'veli' | 'ogrenci'; seciliEzberId?: string; ezberHizi?: number;
    ezberFiltreTur?: 'hepsi' | 'sure' | 'dua'; ezberGizli?: boolean; ezberDongu?: boolean;
    seciliHarfGrup?: HarfGrup; seciliHarfId?: string;
    kulakHedefHarfId?: string; kulakSecenekler?: string[]; kulakCevaplandi?: boolean; kulakSecilenId?: string; kulakDogruMu?: boolean; kulakSkoru?: number;
    quizSoruNo?: number; quizDogruSayisi?: number; quizCevaplandi?: boolean; quizSecilenIndex?: number | null; quizBitti?: boolean;
    odevler: Odev[]; duyurular: Duyuru[]; bildirimler: Bildirim[]; cocuk: Record<string, { yoklama: Yoklama[]; ilerleme: Ilerleme | null; degerlendirme: Degerlendirme[]; notlar: Not[] }> };
  let durum: Durum | null = null;
  let duzenlenenBildirim: string | null = null; // veli bir gönderdiği mesajı düzenliyorsa id'si

  const veriYukle = async (user: { email: string | null }): Promise<Durum | null> => {
    const eposta = (user.email || '').toLowerCase();
    const aileSnap = await fs.getDoc(fs.doc(db, 'aileler', eposta));
    if (!aileSnap.exists()) return null;
    const aile = aileSnap.data() as Durum['aile'];
    const refler = aile.ogrenciler || [];
    const ogrSnaps = await Promise.all(refler.map((r) => fs.getDoc(fs.doc(db, 'ogrenciler', r))));
    const ogrenciler = ogrSnaps.filter((s) => s.exists()).map((s) => ({ ref: s.id, ...(s.data() as Omit<Ogrenci, 'ref'>) }));
    const [odevSnap, duyuruSnap, bildirimSnap] = await Promise.all([
      fs.getDocs(fs.query(fs.collection(db, 'odevler'), fs.where('yayin', '==', true))),
      fs.getDocs(fs.query(fs.collection(db, 'duyurular'), fs.where('yayin', '==', true))),
      fs.getDocs(fs.query(fs.collection(db, 'bildirimler'), fs.where('eposta', '==', eposta))),
    ]);
    const d: Durum = {
      eposta, aile, ogrenciler, secili: 0,
      odevler: odevSnap.docs.map((x) => x.data() as Odev).sort((x, y) => y.tarih.localeCompare(x.tarih)),
      duyurular: duyuruSnap.docs.map((x) => x.data() as Duyuru).sort((x, y) => y.tarih.localeCompare(x.tarih)),
      bildirimler: bildirimSnap.docs.map((x) => ({ id: x.id, ...(x.data() as Bildirim) })),
      cocuk: {},
    };
    await Promise.all(ogrenciler.map((o) => cocukYukle(d, o.ref)));
    return d;
  };

  const cocukYukle = async (d: Durum, ref: string) => {
    const [yok, ile, deg, not] = await Promise.all([
      fs.getDocs(fs.query(fs.collection(db, 'yoklama'), fs.where('ref', '==', ref))),
      fs.getDoc(fs.doc(db, 'ilerleme', ref)),
      fs.getDocs(fs.query(fs.collection(db, 'degerlendirme'), fs.where('ref', '==', ref))),
      fs.getDocs(fs.query(fs.collection(db, 'notlar'), fs.where('ref', '==', ref), fs.where('veliyeGorunur', '==', true))),
    ]);
    d.cocuk[ref] = {
      yoklama: yok.docs.map((x) => x.data() as Yoklama).sort((x, y) => x.tarih.localeCompare(y.tarih)),
      ilerleme: ile.exists() ? (ile.data() as Ilerleme) : null,
      degerlendirme: deg.docs.map((x) => x.data() as Degerlendirme).sort((x, y) => y.tarih.localeCompare(x.tarih)),
      notlar: not.docs.map((x) => x.data() as Not).sort((x, y) => y.tarih.localeCompare(x.tarih)),
    };
  };

  const kuranSirasi = veri.gunler.flatMap((g) => g.dersler.filter((x) => x.kod === 'kuran').map((x) => ({ tarih: g.tarih, konu: x.konu }))).filter((x, i, d) => d.findIndex((y) => y.konu === x.konu) === i); // her Kur'an konusu bir adım (ilk işlendiği gün)

  const panoCiz = () => {
    if (!durum) return;
    const d = durum; const bugun = bugunISO();
    const pzt = gunEkle(bugun, -((new Date(bugun + 'T12:00:00Z').getUTCDay() + 6) % 7)); const paz = gunEkle(pzt, 6);
    const o = d.ogrenciler[d.secili]; const c = o ? d.cocuk[o.ref] : null;
    const haftaGunleri = veri.gunler.filter((g) => g.tarih >= pzt && g.tarih <= paz);
    const siradaki = veri.gunler.find((g) => g.tarih > bugun);
    const haftaOdev = d.odevler.find((x) => x.tarih >= pzt && x.tarih <= paz);
    const yk = c ? c.yoklama : []; const say = { var: 0, yok: 0, mazeret: 0, gec: 0 } as Record<string, number>; let toplamDers = 0; yk.forEach((y) => dersDurumlari(y).forEach((p) => { say[p.durum] = (say[p.durum] || 0) + 1; toplamDers++; }));
    const ile = c?.ilerleme || null;
    const kuranNo = ile?.kuranAdim ?? -1; const kuranKonu = kuranNo >= 0 && kuranSirasi[kuranNo] ? kuranSirasi[kuranNo].konu : '';
    const yuzde = kuranNo >= 0 ? Math.round(((kuranNo + 1) / kuranSirasi.length) * 100) : 0;
    const gelecekGunler = veri.gunler.filter((g) => g.tarih >= bugun).slice(0, 10);
    const dereceAdi = (n: number) => (m.derece as Record<string, string>)[String(n)] || String(n);

    const durumAd = (k: string) => (m.durum as Record<string, string>)[k] || k;
    const kunyeler: { ikon: string; deger: string; etiket: string }[] = [];
    if (toplamDers) kunyeler.push({ ikon: 'takvim', deger: `${say.var}/${toplamDers}`, etiket: m.ozetDevam });
    if (kuranNo >= 0 && kuranSirasi[kuranNo]) kunyeler.push({ ikon: 'grafik', deger: `${kuranNo + 1}/${kuranSirasi.length}`, etiket: m.ozetKuran });
    if (haftaGunleri.length) kunyeler.push({ ikon: 'kitap', deger: yerlestir(m.dersSayi, { n: haftaGunleri.reduce((s, g) => s + g.dersler.length, 0) }), etiket: m.ozetHafta });
    else if (siradaki) kunyeler.push({ ikon: 'kitap', deger: tarihYaz(siradaki.tarih, { day: 'numeric', month: 'short' }), etiket: m.ozetHafta });
    const bas = (ikon: string, baslik: string, sag = '') => `<div class="bolum-bas">${simge(ikon)}<h2>${esc(baslik)}</h2>${sag ? `<span class="sag">${esc(sag)}</span>` : ''}</div>`;

    const ogrenciPanoCiz = () => {
      const basamaklar = m.basamaklar as readonly string[];
      const aktifBasamak = kuranNo >= 0
        ? Math.max(0, Math.min(Math.floor(((kuranNo + 1) / Math.max(kuranSirasi.length, 1)) * basamaklar.length), basamaklar.length - 1))
        : 0;

      const ezberFiltreTur = d.ezberFiltreTur || 'hepsi';
      const filtreliEzberler = EZBER_LISTESI.filter((ez) => {
        if (ezberFiltreTur === 'sure') return ez.tur === 'sure';
        if (ezberFiltreTur === 'dua') return ez.tur === 'dua';
        return true;
      });
      const seciliId = d.seciliEzberId || 'fatiha';
      const seciliEzber = EZBER_LISTESI.find((e) => e.id === seciliId) || EZBER_LISTESI[0];
      // Surelerin başındaki Besmele yukarıdaki Eûzü Besmele serlevhasında yer aldığı için
      // aşağıdaki metin kutusunda mükerrer Besmele gösterilmez, doğrudan âyetle başlar
      const arapcaMetinGoster = seciliEzber.tur === 'sure'
        ? seciliEzber.arapca
            .replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ(?:\s*﴿\s*١\s*﴾)?\s*/u, '')
            .trim()
        : seciliEzber.arapca;

      const seciliGrup: HarfGrup = d.seciliHarfGrup || 'hepsi';
      const harfler = seciliGrup === 'hepsi' ? ELIFBA_HARFLERI : ELIFBA_HARFLERI.filter((h) => h.grup === seciliGrup);
      const seciliHarf = ELIFBA_HARFLERI.find((h) => h.id === d.seciliHarfId) || harfler[0] || ELIFBA_HARFLERI[0];
      const seciliHarfIndex = ELIFBA_HARFLERI.findIndex((h) => h.id === seciliHarf.id);

      const gununHarfi = gununHarfiGetir(bugun);
      const gununHadisi = gununHadisiGetir(bugun);

      // Harf Kulak Talimi ("Dinle ve Bul") oyun durumunu hazırla
      if (!d.kulakHedefHarfId || !d.kulakSecenekler || d.kulakSecenekler.length < 4) {
        const rastgele = ELIFBA_HARFLERI[Math.floor(Math.random() * ELIFBA_HARFLERI.length)];
        d.kulakHedefHarfId = rastgele.id;
        const digerleri = ELIFBA_HARFLERI.filter((h) => h.id !== rastgele.id);
        const karisikDiger = [...digerleri].sort(() => Math.random() - 0.5).slice(0, 3);
        d.kulakSecenekler = [rastgele.id, ...karisikDiger.map((c) => c.id)].sort(() => Math.random() - 0.5);
        d.kulakCevaplandi = false;
        d.kulakSecilenId = undefined;
        d.kulakDogruMu = undefined;
      }
      const kulakSecenekHarfler = (d.kulakSecenekler || []).map((hid) => ELIFBA_HARFLERI.find((h) => h.id === hid)!).filter(Boolean);

      const soruNo = d.quizSoruNo ?? 0;
      const toplamSoru = QUIZ_SORULARI.length;
      const aktifSoruIndex = soruNo % toplamSoru;
      const aktifSoru = QUIZ_SORULARI[aktifSoruIndex];
      const cevaplandi = Boolean(d.quizCevaplandi);
      const secilenIndex = d.quizSecilenIndex ?? null;
      const dogruMu = secilenIndex !== null && secilenIndex === aktifSoru.dogruCevapIndex;

      const yildizKey = `ulucamii_yildiz_${o?.ref || 'genel'}`;
      let yildizSayisi = 0;
      try { yildizSayisi = Number(localStorage.getItem(yildizKey) || '0'); } catch {}
      const gunlukSeri = o ? gunlukSeriGuncelle(o.ref) : 1;

      kok.innerHTML = `
        <div class="ogrenci-pano">
          <div class="ogrenci-hero">
            <div class="hero-serit" aria-hidden="true"></div>
            <div class="hero-gorsel-sar">
              <img src="/media/mektep/mektep-oda.webp" alt="Mektep Odası" class="hero-afis-resim" loading="eager" width="1280" height="420" />
              <div class="hero-golge-katman" aria-hidden="true"></div>
            </div>
            <div class="ogrenci-ust">
              <div class="ogrenci-kimlik">
                <span class="ogrenci-avatar dev ${monogramSinifi(o?.ref || '')}" aria-hidden="true">${esc(monogramHarfleri(o?.ad || '', o?.soyad || ''))}</span>
                <div class="kimlik-yazi">
                  <h2 class="ogrenci-baslik">${esc(yerlestir(m.ogrenciSelam, { ad: o ? o.ad : '' }))}</h2>
                  <p class="ogrenci-motto">${esc(m.ogrenciMotto)}</p>
                </div>
              </div>
              <div class="ogrenci-eylemler">
                <div class="seri-sayac-kutusu" title="${esc(m.gunlukSeriMotto)}">
                  <span class="seri-ikon" aria-hidden="true">🔥</span>
                  <span class="seri-sayi">${gunlukSeri}</span>
                  <span class="seri-etiket">${esc(yerlestir(m.gunlukMektepSerisi, { gun: gunlukSeri }))}</span>
                </div>
                <button type="button" class="yildiz-sayac yildiz-sayac-btn" data-eylem="yildizTik" title="${esc(m.tekrarSayisi)}">
                  <span class="yildiz-ikon" aria-hidden="true">⭐</span>
                  <span class="yildiz-sayi" data-yildiz-goster>${yildizSayisi}</span>
                  <span class="yildiz-etiket">${esc(m.tekrarSayisi)}</span>
                </button>
                <button type="button" class="dugme dugme-ikincil veli-don-btn" data-eylem="veliModunaDon">
                  ${simge('geri')}<span>${esc(m.veliModunaDon)}</span>
                </button>
              </div>
            </div>
          </div>

          ${d.ogrenciler.length > 1 ? `<div class="cocuk-sec" role="tablist" aria-label="${esc(m.cocuklar)}">
            ${d.ogrenciler.map((x, i) => `<button type="button" role="tab" id="cocuk-sekme-${i}" class="cocuk-dugme" aria-selected="${i === d.secili}" aria-controls="cocuk-panel" tabindex="${i === d.secili ? 0 : -1}" data-sec="${i}"><span class="sekme-avatar ${monogramSinifi(x.ref)}" aria-hidden="true">${esc(monogramHarfleri(x.ad, x.soyad))}</span>${esc(x.ad)} ${esc(x.soyad)}</button>`).join('')}
          </div>` : ''}

          <div class="bolumler ogrenci-grid" id="cocuk-panel">
            <!-- GÜNÜN KEŞFİ: GÜNÜN HARFİ & NEBEVÎ HADİSİ -->
            <section class="bolum r-ochre oncelik genis gunun-kesfi-kart">
              ${bas('yildiz', m.gununKesfi, '')}
              <div class="gunun-kesfi-izgara">
                <div class="kesif-kutusu gunun-harfi-kutu">
                  <div class="kesif-etiket-satir">
                    <span class="kesif-rozet">${esc(m.gununHarfi)}</span>
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme kesif-ses-btn" data-eylem="gununHarfiDinle" title="${esc(m.harfiDinle)}">
                      🔊 <span>${esc(m.harfiDinle)}</span>
                    </button>
                  </div>
                  <div class="gunun-harfi-orta">
                    <button type="button" class="gunun-harfi-dev" lang="ar" dir="rtl" data-eylem="gununHarfiDinle" title="${esc(gununHarfi.ad[dil] || gununHarfi.ad.tr)}">
                      ${gununHarfi.harf}
                    </button>
                    <div class="gunun-harfi-detay">
                      <h4 class="kesif-baslik">${esc(gununHarfi.ad[dil] || gununHarfi.ad.tr)}</h4>
                      <p class="kesif-mahrec">${esc(gununHarfi.ipucu[dil] || gununHarfi.ipucu.tr)}</p>
                    </div>
                  </div>
                  <div class="kesif-alt-eylem">
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme kesif-calis-btn" data-eylem="gununHarfiniCalis" data-harf-id="${gununHarfi.id}" title="${esc(m.buHarfiCalis)}">
                      <span>${esc(m.buHarfiCalis)}</span>
                    </button>
                  </div>
                </div>

                <div class="kesif-kutusu gunun-hadisi-kutu">
                  <div class="kesif-etiket-satir hadis-baslik-satir">
                    <span class="kesif-rozet hadis-rozet">✦ ${esc(m.gununHadisi)}</span>
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme kesif-ses-btn hadis-ana-ses-btn" data-eylem="hadisSesCal" data-hadis-tur="arapca" title="${esc(m.hadisiDinle)}">
                      🔊 <span>${esc(m.hadisiDinle)}</span>
                    </button>
                  </div>
                  <div class="gunun-hadisi-govde">
                    <!-- ARAPÇA HADİS METNİ (ORTALI & PRO SES) -->
                    <button type="button" class="hadis-arapca hadis-arapca-btn hadis-ortali" dir="rtl" lang="ar" data-eylem="hadisSesCal" data-hadis-tur="arapca" title="${esc(m.hadisiArapcaDinle)}">
                      ${esc(gununHadisi.arapca)}
                    </button>
                    <!-- HADİS MEALİ (ORTALI & TIKLAYINCA PRO SES) -->
                    <div class="hadis-meal-kutu hadis-ortali" data-eylem="hadisSesCal" data-hadis-tur="meal" role="button" tabindex="0" title="${esc(m.hadisMealiDinle)}">
                      <p class="hadis-meali">«${esc(gununHadisi.metin[dil] || gununHadisi.metin.tr)}»</p>
                    </div>
                    <!-- KAYNAK VE KONU ROZETLERİ (ORTALI) -->
                    <div class="hadis-kaynak-satir hadis-ortali-satir">
                      <span class="hadis-kaynak">📚 ${esc(gununHadisi.kaynak)}</span>
                      <span class="hadis-konu-etiket">🏷️ ${esc(gununHadisi.konu[dil] || gununHadisi.konu.tr)}</span>
                      <button type="button" class="hadis-meal-ses-btn" data-eylem="hadisSesCal" data-hadis-tur="meal" title="${esc(m.hadisMealiDinle)}">
                        🗣️ <span>${esc(m.hadisMealiDinle)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- EZBER VE DİNLEME ODASI -->
            <section class="bolum r-iznik oncelik genis ezber-odasi-kart">
              ${bas('kitap', m.ezberOdasi, m.ezberAciklama)}

              <!-- SÛRE VE DUA KATEGORİ FİLTRESİ -->
              <div class="sure-filtre-sekmeler" role="tablist" aria-label="${esc(m.sureSec)}">
                <button type="button" class="sure-filtre-btn ${ezberFiltreTur === 'hepsi' ? 'aktif-filtre' : ''}" data-eylem="ezberFiltreTur" data-tur="hepsi">
                  ✨ ${dil === 'fr' ? 'Tous' : dil === 'en' ? 'All' : 'Tümü'} <span class="filtre-sayac">(${EZBER_LISTESI.length})</span>
                </button>
                <button type="button" class="sure-filtre-btn ${ezberFiltreTur === 'sure' ? 'aktif-filtre' : ''}" data-eylem="ezberFiltreTur" data-tur="sure">
                  📖 ${esc(m.sureler)} <span class="filtre-sayac">(${EZBER_LISTESI.filter((x) => x.tur === 'sure').length})</span>
                </button>
                <button type="button" class="sure-filtre-btn ${ezberFiltreTur === 'dua' ? 'aktif-filtre' : ''}" data-eylem="ezberFiltreTur" data-tur="dua">
                  🤲 ${esc(m.dualar)} <span class="filtre-sayac">(${EZBER_LISTESI.filter((x) => x.tur === 'dua').length})</span>
                </button>
              </div>

              <!-- HIZLI SÛRE/DUA ÇİPLERİ (YATAY KAYDIRILABİLİR) -->
              <div class="sure-cipler-bar" role="toolbar" aria-label="${esc(m.sureSec)}">
                ${filtreliEzberler.map((ez) => `
                  <button type="button" class="sure-cip-btn ${ez.id === seciliEzber.id ? 'aktif-cip' : ''}" data-eylem="ezberHizliSec" data-ezber-id="${ez.id}" title="${esc(ez.ad[dil] || ez.ad.tr)}">
                    <span class="cip-simge">${ez.tur === 'sure' ? '📖' : '🤲'}</span>
                    <span class="cip-ad">${esc(ez.ad[dil] || ez.ad.tr)}</span>
                  </button>
                `).join('')}
              </div>

              <div class="ezber-secici-sar">
                <label for="ezber-secim-select" class="kucuk"><b>${esc(m.sureSec)}:</b></label>
                <select id="ezber-secim-select" data-eylem="ezberDegistir" class="ezber-secim">
                  ${filtreliEzberler.map((ez) => `<option value="${ez.id}" ${ez.id === seciliEzber.id ? 'selected' : ''}>${esc(ez.ad[dil] || ez.ad.tr)} (${ez.tur === 'sure' ? (dil === 'fr' ? 'Sourate' : 'Kur’an Sûresi') : (dil === 'fr' ? 'Prière' : 'Dua')})</option>`).join('')}
                </select>
              </div>

              <!-- LÜKS MUSHAF KARTI -->
              <div class="ezber-vitrin mushaf-tezyinat-kart">
                <!-- ÜST SERLEVHA BAŞLIK -->
                <div class="mushaf-serlevha">
                  <div class="serlevha-motif serlevha-sol" aria-hidden="true"></div>
                  <div class="serlevha-icerik">
                    <span class="serlevha-tur-rozet ${seciliEzber.tur === 'sure' ? 'rozet-sure' : 'rozet-dua'}">
                      ${seciliEzber.tur === 'sure' ? (dil === 'fr' ? 'SOURATE DU SAINT CORAN' : "KUR'AN-I KERÎM SÛRESİ") : (dil === 'fr' ? 'PRIÈRE DE LA PRIÈRE' : 'NAMAZ DUASI • MEKTEP MÜFREDATI')}
                    </span>
                    <h3 class="mushaf-sure-baslik">${esc(seciliEzber.ad[dil] || seciliEzber.ad.tr)}</h3>
                  </div>
                  <div class="serlevha-motif serlevha-sag" aria-hidden="true"></div>
                </div>

                ${seciliEzber.tur === 'sure' ? `
                  <!-- ALTIN TEZYİNATLI EÛZÜ BESMELE SERLEVHASI -->
                  <div class="besmele-serlevha euzu-besmele-serlevha" aria-label="Eûzübillâhimineşşeytânirracîm Bismillâhirrahmânirrahîm">
                    <div class="euzu-besmele-hat-kapsayici" dir="rtl" lang="ar">
                      <span class="euzu-hat-metin">أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ</span>
                      <span class="euzu-ayrac" aria-hidden="true">✦</span>
                      <span class="besmele-hat-metin">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
                    </div>
                    <span class="euzu-besmele-latin">E’ûzü billâhi mineş-şeytânir-racîm • Bismillâhir-rahmânir-rahîm</span>
                  </div>
                ` : ''}

                <!-- EZBER VE MEŞK ARAÇLARI ÇUBUĞU -->
                <div class="ezber-arac-bar">
                  <button type="button" class="dugme dugme-ikincil ezber-arac-btn ${d.ezberGizli ? 'aktif-arac' : ''}" data-eylem="ezberGizleToggle" title="${esc(m.ezberTesti)}">
                    ${d.ezberGizli ? '👁️ ' + (dil === 'fr' ? 'Afficher le texte' : 'Metni Göster') : '🙈 ' + esc(m.ezberTesti)}
                  </button>
                  <button type="button" class="dugme dugme-ikincil ezber-arac-btn ${d.ezberDongu ? 'aktif-arac' : ''}" data-eylem="ezberDonguToggle" title="${esc(m.meskDongusu)}">
                    🔁 ${esc(m.meskDongusu)} ${d.ezberDongu ? '✓' : ''}
                  </button>
                  <span class="diyanet-kiraat-etiket" title="${esc(m.diyanetKiraati)}">
                    🎧 <span>${esc(m.diyanetKiraati)}</span>
                  </span>
                </div>

                <!-- ARAPÇA MUSHAF HATTINDA METİN (HER ZAMAN ORTALI & BAŞTAKİ BESMELE AYIKLANMIŞ) -->
                <div class="mushaf-metin-sarici ${d.ezberGizli ? 'ezber-metin-gizli' : ''}">
                  <button type="button" class="ezber-arapca ezber-metin-btn mushaf-hat-metin mushaf-ortali" dir="rtl" lang="ar" data-eylem="ezberSesOynatDur" title="${esc(m.metneDokunDinle)}" aria-label="${esc(seciliEzber.ad[dil] || seciliEzber.ad.tr)}: ${esc(m.metneDokunDinle)}">
                    ${esc(arapcaMetinGoster)}
                  </button>
                  ${d.ezberGizli ? `
                    <div class="ezber-gizli-overlay" data-eylem="ezberGizleToggle">
                      <span class="gizli-ipucu-simge">👁️</span>
                      <span class="gizli-ipucu-metin">${dil === 'fr' ? 'Texte masqué pour le test. Touchez pour afficher !' : 'Metin ezber testi için gizlendi. Kontrol etmek için dokunun!'}</span>
                    </div>
                  ` : ''}
                </div>

                <!-- TECVİDLİ OKUNUŞ VE MEÂL KARTLARI -->
                <div class="mushaf-anlam-izgara">
                  <div class="ezber-okunus mushaf-bilgi-kutu">
                    <span class="ezber-etiket">📖 ${dil === 'fr' ? 'Prononciation :' : dil === 'en' ? 'Transliteration:' : 'Tecvidli Okunuş:'}</span>
                    <p class="okunus-metin">${esc(seciliEzber.okunus)}</p>
                  </div>

                  <div class="ezber-anlam mushaf-bilgi-kutu">
                    <span class="ezber-etiket">🌍 ${dil === 'fr' ? 'Traduction française :' : dil === 'en' ? 'Meaning in English:' : 'Türkçe Anlamı:'}</span>
                    <p class="anlam-metin">${esc(seciliEzber.anlam[dil] || seciliEzber.anlam.tr)}</p>
                  </div>
                </div>

                ${dil !== 'fr' ? `
                  <div class="ezber-anlam ezber-fr-anlam mushaf-bilgi-kutu">
                    <div class="ezber-anlam-baslik-satir">
                      <span class="ezber-etiket">🇫🇷 ${esc(m.fransizcaTercume)}:</span>
                      <button type="button" class="dugme dugme-ikincil kucuk-dugme ezber-fr-ses-btn" data-eylem="ezberFransizcaDinle" data-ezber="${seciliEzber.id}" title="${esc(m.fransizcaSesliDinle)}">
                        🔊 ${esc(m.fransizcaSesliDinle)}
                      </button>
                    </div>
                    <p class="anlam-metin fr-metin">${esc(seciliEzber.anlam.fr)}</p>
                  </div>
                ` : ''}

                <!-- TÜRKÇE MEÂL (TIKLAYINCA PRO STÜDYO SESİ ÇALAR) -->
                <div class="ezber-anlam ezber-tr-anlam mushaf-bilgi-kutu ezber-tiklanabilir-kutu" data-eylem="ezberTurkceDinle" data-ezber="${seciliEzber.id}" role="button" tabindex="0" title="${esc(m.turkceSesliDinle)}">
                  <div class="ezber-anlam-baslik-satir">
                    <span class="ezber-etiket">🇹🇷 ${esc(m.turkceAnlam)} <span class="dinle-ipucu">(🔊 ${esc(m.turkceSesliDinle)})</span>:</span>
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme ezber-tr-ses-btn" data-eylem="ezberTurkceDinle" data-ezber="${seciliEzber.id}" title="${esc(m.turkceSesliDinle)}">
                      🔊 ${esc(m.turkceSesliDinle)}
                    </button>
                  </div>
                  <p class="anlam-metin tr-metin">${esc(seciliEzber.anlam.tr)}</p>
                </div>

                <!-- SES OYNATICI VE KUMANDALAR -->
                <div class="ezber-ses-kutusu">
                  <audio controls preload="none" class="ezber-audio" src="${seciliEzber.sesUrl}" ${d.ezberDongu ? 'loop' : ''}>
                    Tarayıcınız ses oynatmayı desteklemiyor.
                  </audio>
                  <div class="ezber-hizli-kumanda" role="group" aria-label="Ses Kumandası">
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme ezber-kumanda-btn" data-eylem="ezberBastan" title="${esc(m.bastanDinle)}">
                      ⏮️ ${esc(m.bastanDinle)}
                    </button>
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme ezber-kumanda-btn" data-eylem="ezberGeriSar" title="${esc(m.besSaniyeGeri)}">
                      ⏪ ${esc(m.besSaniyeGeri)}
                    </button>
                    ${dil === 'fr' ? `
                      <button type="button" class="dugme dugme-ikincil kucuk-dugme ezber-fr-ses-btn" data-eylem="ezberFransizcaDinle" data-ezber="${seciliEzber.id}" title="${esc(m.fransizcaSesliDinle)}">
                        🔊 ${esc(m.fransizcaSesliDinle)}
                      </button>
                    ` : ''}
                  </div>
                  <div class="ezber-hiz-secici" role="group" aria-label="${esc(m.normalDinle)}">
                    <button type="button" class="hiz-btn ${(d.ezberHizi ?? 1) === 0.75 ? 'aktif-hiz' : ''}" data-eylem="ezberHizAyarla" data-hiz="0.75" title="${esc(m.yavasDinle)}">
                      0.75x
                    </button>
                    <button type="button" class="hiz-btn ${(d.ezberHizi ?? 1) === 1 ? 'aktif-hiz' : ''}" data-eylem="ezberHizAyarla" data-hiz="1" title="${esc(m.normalDinle)}">
                      1x
                    </button>
                    <button type="button" class="hiz-btn ${(d.ezberHizi ?? 1) === 1.25 ? 'aktif-hiz' : ''}" data-eylem="ezberHizAyarla" data-hiz="1.25" title="${esc(m.hizliDinle)}">
                      1.25x
                    </button>
                    <button type="button" class="hiz-btn ${(d.ezberHizi ?? 1) === 1.5 ? 'aktif-hiz' : ''}" data-eylem="ezberHizAyarla" data-hiz="1.5" title="${esc(m.cokHizliDinle)}">
                      1.5x
                    </button>
                  </div>
                  <button type="button" class="dugme dugme-birincil tekrar-btn" data-eylem="tekrarEttim" data-ezber="${seciliEzber.id}">
                    ✨ ${esc(m.tekrarEttim)}
                  </button>
                  <div class="veli-ev-onay-kutu">
                    ${o && evOnayDurumuGetir(o.ref, seciliEzber.id)
                      ? `<div class="veli-onaylandi-rozet" title="${esc(m.veliEvOnaylandi)}">
                          <span class="onay-tik" aria-hidden="true">✔️</span>
                          <span>${esc(m.veliEvOnaylandi)}</span>
                        </div>`
                      : `<button type="button" class="dugme dugme-ikincil veli-onay-btn" data-eylem="veliEvOnay" data-ezber="${seciliEzber.id}" title="${esc(m.veliEvOnayi)}">
                          👨‍👩‍👧 <span>${esc(m.veliEvOnayi)}</span>
                        </button>`
                    }
                  </div>
                </div>
                <p class="kutlama-mesaji" data-kutlama hidden></p>
              </div>
            </section>

            <!-- İNTERAKTİF ELİF-BÂ TAHTASI -->
            <section class="bolum r-ochre genis elifba-tahtasi-kart">
              ${bas('kitap', m.elifbaTahtasi, m.elifbaAciklama)}
              
              <div class="elifba-grup-bar">
                ${HARF_GRUPLARI.map((g) => `<button type="button" class="elifba-grup-btn ${g.id === seciliGrup ? 'aktif' : ''}" data-eylem="harfGrupSec" data-grup="${g.id}">${esc(g.ad[dil] || g.ad.tr)}</button>`).join('')}
              </div>

              <div class="elifba-izgara-sar">
                <div class="elifba-harf-izgara" dir="rtl">
                  ${harfler.map((h) => `
                    <button type="button" class="elifba-harf-btn ${h.id === seciliHarf.id ? 'secili' : ''} ${h.kalinMi ? 'kalin' : ''} ${h.peltekMi ? 'peltek' : ''}" data-eylem="harfSec" data-harf="${h.id}" data-harf-karakter="${h.harf}" aria-label="${esc(h.ad[dil] || h.ad.tr)}${h.kalinMi ? ' (' + esc(m.kalinHarf) + ')' : ''}${h.peltekMi ? ' (' + esc(m.peltekHarf) + ')' : ''}" title="${esc(h.ad[dil] || h.ad.tr)}">
                      <span class="harf-sekil" lang="ar">${h.harf}</span>
                      <span class="harf-adi">${esc(h.ad[dil] || h.ad.tr)}</span>
                      ${h.kalinMi ? '<span class="harf-rozet-minik kalin-roz" title="' + esc(m.kalinHarf) + '">K</span>' : ''}
                      ${h.peltekMi ? '<span class="harf-rozet-minik peltek-roz" title="' + esc(m.peltekHarf) + '">P</span>' : ''}
                    </button>
                  `).join('')}
                </div>

                <!-- SEÇİLİ HARF DETAY VİTRİNİ -->
                <div class="elifba-detay-panel">
                  <div class="elifba-banner-kutu">
                    <img src="/media/mektep/elifba-bahcesi.webp" alt="Elifba Bahçesi" class="elifba-banner-resim" loading="lazy" width="480" height="140" />
                  </div>
                  <div class="elifba-detay-ust">
                    <button type="button" class="buyuk-harf-kutu" lang="ar" dir="rtl" data-eylem="harfSesCal" data-harf="${seciliHarf.harf}" data-harf-id="${seciliHarf.id}" title="${esc(m.harfiDinle)}">
                      <span class="buyuk-harf-sekil">${seciliHarf.harf}</span>
                    </button>
                    <div class="elifba-detay-bilgi">
                      <div class="harf-baslik-satir">
                        <h4 class="harf-baslik">
                          ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}
                          ${seciliHarf.kalinMi ? `<span class="rozet derece">${esc(m.kalinHarf)}</span>` : ''}
                          ${seciliHarf.peltekMi ? `<span class="rozet ogrendi">${esc(m.peltekHarf)}</span>` : ''}
                        </h4>
                        <button type="button" class="dugme dugme-ikincil elifba-ses-btn" data-eylem="harfSesCal" data-harf="${seciliHarf.harf}" data-harf-id="${seciliHarf.id}" title="${esc(m.harfiDinle)}">
                          🔊 <span>${esc(m.harfiDinle)}</span>
                        </button>
                      </div>
                      <div class="mahrec-kutu">
                        <span class="mahrec-etiket">${esc(m.mahrecBilgisi)}:</span>
                        <p class="mahrec-metin">${esc(seciliHarf.ipucu[dil] || seciliHarf.ipucu.tr)}</p>
                      </div>
                    </div>
                  </div>

                  <div class="elifba-konumlar">
                    <button type="button" class="konum-kutu" data-eylem="harfSesCal" data-harf="${seciliHarf.harf}" data-harf-id="${seciliHarf.id}" aria-label="${esc(m.yalinHali)}: ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}" title="${esc(m.yalinHali)} — ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}">
                      <span class="konum-etiket">${esc(m.yalinHali)}</span>
                      <span class="konum-harf" lang="ar" dir="rtl">${seciliHarf.harf}</span>
                    </button>
                    <button type="button" class="konum-kutu" data-eylem="harfSesCal" data-harf="${seciliHarf.harf}" data-harf-id="${seciliHarf.id}" aria-label="${esc(m.bastaHali)}: ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}" title="${esc(m.bastaHali)} — ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}">
                      <span class="konum-etiket">${esc(m.bastaHali)}</span>
                      <span class="konum-harf" lang="ar" dir="rtl">${seciliHarf.basta}</span>
                    </button>
                    <button type="button" class="konum-kutu" data-eylem="harfSesCal" data-harf="${seciliHarf.harf}" data-harf-id="${seciliHarf.id}" aria-label="${esc(m.ortadaHali)}: ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}" title="${esc(m.ortadaHali)} — ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}">
                      <span class="konum-etiket">${esc(m.ortadaHali)}</span>
                      <span class="konum-harf" lang="ar" dir="rtl">${seciliHarf.ortada}</span>
                    </button>
                    <button type="button" class="konum-kutu" data-eylem="harfSesCal" data-harf="${seciliHarf.harf}" data-harf-id="${seciliHarf.id}" aria-label="${esc(m.sondaHali)}: ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}" title="${esc(m.sondaHali)} — ${esc(seciliHarf.ad[dil] || seciliHarf.ad.tr)}">
                      <span class="konum-etiket">${esc(m.sondaHali)}</span>
                      <span class="konum-harf" lang="ar" dir="rtl">${seciliHarf.sonda}</span>
                    </button>
                  </div>

                  <div class="harekeler-alani">
                    <span class="hareke-blok-baslik">${esc(m.harekeliOkunuslar)}</span>
                    <div class="hareke-izgara">
                      ${HAREKELER.map((hrk) => {
                        let gorunenHarf = seciliHarf.harf + hrk.isaret;
                        let sesIpucu = hrk.sesEtiketi[dil] || hrk.sesEtiketi.tr;

                        if (hrk.id === 'cezm') {
                          gorunenHarf = seciliHarf.harf === 'ا' ? 'اَهْ' : `اَ${seciliHarf.harf}\u0652`;
                          const unlu = seciliHarf.kalinMi ? 'A' : 'E';
                          sesIpucu = `${unlu}.. (${dil === 'fr' ? 'Arrêt' : dil === 'en' ? 'Stop' : 'Cezm'})`;
                        } else if (hrk.id === 'sedde') {
                          gorunenHarf = seciliHarf.harf === 'ا' ? 'اَأَّ' : `اَ${seciliHarf.harf}\u0651\u064E`;
                          const unlu = seciliHarf.kalinMi ? 'A' : 'E';
                          sesIpucu = `${unlu}..e (${dil === 'fr' ? 'Double' : dil === 'en' ? 'Double' : 'Şedde'})`;
                        }

                        return `
                          <button type="button" class="hareke-kutu" data-eylem="harekeSesCal" data-harf="${gorunenHarf}" data-harf-id="${seciliHarf.id}" data-hareke-id="${hrk.id}" aria-label="${esc(hrk.ad[dil] || hrk.ad.tr)}: ${esc(gorunenHarf)} (${esc(sesIpucu)})" title="${esc(hrk.ad[dil] || hrk.ad.tr)} — ${esc(hrk.aciklama[dil] || hrk.aciklama.tr)}">
                            <span class="hareke-ad">${esc(hrk.ad[dil] || hrk.ad.tr)}</span>
                            <span class="hareke-harf" lang="ar" dir="rtl">${gorunenHarf}</span>
                            <span class="hareke-ses-ipucu">${esc(sesIpucu)}</span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <div class="elifba-nav-bar">
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme elifba-nav-btn" data-eylem="harfOnceki" title="${esc(m.oncekiHarf)}">
                      ${esc(m.oncekiHarf)}
                    </button>
                    <span class="elifba-nav-bilgi">${seciliHarfIndex + 1} / ${ELIFBA_HARFLERI.length}</span>
                    <button type="button" class="dugme dugme-ikincil kucuk-dugme elifba-nav-btn" data-eylem="harfSonraki" title="${esc(m.sonrakiHarf)}">
                      ${esc(m.sonrakiHarf)}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- HARF KULAK TALİMİ OYUNU ("DİNLE VE BUL") -->
            <section class="bolum r-adacayi genis kulak-talimi-kart">
              ${bas('duyuru', m.kulakTalimi, m.kulakTalimiAciklama)}
              <div class="kulak-oyun-sar">
                <div class="kulak-oyun-ust">
                  <button type="button" class="dugme dugme-birincil kulak-dinle-dev-btn" data-eylem="kulakSesiCal">
                    <span class="kulak-ses-ikon" aria-hidden="true">🔊</span>
                    <span>${esc(m.sesiDinle)}</span>
                    <span class="dalga-animasyon" aria-hidden="true"><span></span><span></span><span></span></span>
                  </button>
                  <p class="kulak-talim-ipucu">${esc(m.dogruHarfiSec)}</p>
                </div>

                <div class="kulak-harf-secenekler" dir="rtl">
                  ${kulakSecenekHarfler.map((h) => {
                    let sinif = 'kulak-harf-secenek-btn';
                    if (d.kulakCevaplandi) {
                      if (h.id === d.kulakHedefHarfId) sinif += ' dogru-harf';
                      else if (h.id === d.kulakSecilenId) sinif += ' yanlis-harf';
                      else sinif += ' pasif-harf';
                    }
                    return `
                      <button type="button" class="${sinif}" data-eylem="kulakSecim" data-harf-id="${h.id}" ${d.kulakCevaplandi ? 'disabled' : ''} aria-label="${esc(h.ad[dil] || h.ad.tr)}" title="${d.kulakCevaplandi ? esc(h.ad[dil] || h.ad.tr) : ''}">
                        <span class="kulak-harf-sekil" lang="ar">${h.harf}</span>
                        ${d.kulakCevaplandi ? `<span class="kulak-harf-ad">${esc(h.ad[dil] || h.ad.tr)}</span>` : ''}
                      </button>
                    `;
                  }).join('')}
                </div>

                ${d.kulakCevaplandi ? `
                  <div class="kulak-sonuc-kutusu ${d.kulakDogruMu ? 'basarili' : 'tekrar'}">
                    <p class="kulak-sonuc-mesaj">${d.kulakDogruMu ? esc(m.harikaBildin) : esc(m.tekrarDeneKulak)}</p>
                    <div class="kulak-sonuc-butonlar">
                      ${!d.kulakDogruMu ? `
                        <button type="button" class="dugme dugme-ikincil kulak-tekrar-btn" data-eylem="kulakTekrarDene">
                          ${esc(m.tekrarDeneDugme)}
                        </button>
                      ` : ''}
                      <button type="button" class="dugme dugme-birincil kulak-sonraki-btn" data-eylem="kulakSonraki">
                        ${esc(m.siradakiSoru)}
                      </button>
                    </div>
                  </div>
                ` : ''}
              </div>
            </section>

            <!-- HAFTALIK MİNİ BİLGİ YARIŞMASI -->
            <section class="bolum r-adacayi genis quiz-bolum-kart">
              ${bas('yildiz', m.haftalikQuiz, m.haftalikQuizAciklama)}
              
              <div class="quiz-icerik-sar">
                ${d.quizBitti ? `
                  <div class="quiz-bitti-kart">
                    <div class="quiz-kutlama-gorsel-sar">
                      <img src="/media/mektep/tebrik-kutlama.gif" alt="Kutlama Animasyonu" class="quiz-kutlama-gif" width="160" height="160" />
                      <img src="/media/mektep/quiz-basari.webp" alt="Başarı Kupası" class="quiz-basari-resim" width="340" height="230" />
                    </div>
                    <h3 class="quiz-bitti-baslik">${esc(m.haftaninTestiBitti)}</h3>
                    <div class="quiz-skor-serit">
                      <span class="quiz-skor-rozeti">🎯 ${d.quizDogruSayisi ?? toplamSoru} / ${toplamSoru} ${dil === 'fr' ? 'Bonnes réponses' : dil === 'en' ? 'Correct answers' : 'Doğru Cevap'}</span>
                    </div>
                    <p class="quiz-bitti-metin">${esc(m.haftaninTestiNot)}</p>
                    <div class="quiz-eylem-satir" style="justify-content:center;margin-top:1.2rem">
                      <button type="button" class="dugme dugme-birincil" data-eylem="quizYeniden">
                        ${esc(m.testiYenidenBaslat)}
                      </button>
                    </div>
                  </div>
                ` : `
                  <div class="quiz-ust-bilgi">
                    <span class="quiz-sayac-rozet">${esc(yerlestir(m.soruSayisi, { no: aktifSoruIndex + 1, toplam: toplamSoru }))}</span>
                    <span class="rozet ogrendi">${esc(aktifSoru.kategori[dil] || aktifSoru.kategori.tr)}</span>
                  </div>

                  <h3 class="quiz-soru-metin">${esc(aktifSoru.soru[dil] || aktifSoru.soru.tr)}</h3>

                  <div class="quiz-secenek-izgara">
                    ${(aktifSoru.secenekler[dil] || aktifSoru.secenekler.tr).map((secenek, idx) => {
                      let ekSinif = '';
                      if (cevaplandi) {
                        if (idx === aktifSoru.dogruCevapIndex) ekSinif = 'dogru';
                        else if (idx === secilenIndex) ekSinif = 'yanlis';
                        else ekSinif = 'pasif';
                      }
                      return `
                        <button type="button" class="quiz-secenek-btn ${ekSinif}" data-eylem="quizSecim" data-secenek="${idx}" ${cevaplandi ? 'disabled' : ''}>
                          <span class="secenek-harf">${['A', 'B', 'C'][idx]}</span>
                          <span class="secenek-yazi">${esc(secenek)}</span>
                          ${cevaplandi && idx === aktifSoru.dogruCevapIndex ? '<span class="secenek-ikon">✓</span>' : ''}
                          ${cevaplandi && idx === secilenIndex && !dogruMu ? '<span class="secenek-ikon">✗</span>' : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>

                  ${cevaplandi ? `
                    <div class="quiz-geribildirim ${dogruMu ? 'basarili' : 'bilgilendirici'}">
                      <div class="geribildirim-baslik">
                        <span>${dogruMu ? '🎉 ' + esc(m.dogruCevapTebrik) : '💡 ' + esc(m.yanlisCevapIpucu)}</span>
                      </div>
                      <p class="geribildirim-aciklama">${esc(aktifSoru.aciklama[dil] || aktifSoru.aciklama.tr)}</p>
                      <div class="quiz-eylem-satir">
                        <button type="button" class="dugme dugme-birincil quiz-sonraki-btn" data-eylem="quizSonraki">
                          ${esc(m.sonrakiSoru)}
                        </button>
                      </div>
                    </div>
                  ` : ''}
                `}
              </div>
            </section>

            <!-- KUR'AN YOLCULUĞUM (BASAMAKLAR) -->
            <section class="bolum r-kiremit genis kuran-yol-kart">
              ${bas('grafik', m.kuranYolculugum, m.kuranYolculuguAciklama)}
              <div class="kuran-yolu-sarici">
                <div class="basamak-hatti">
                  ${basamaklar.map((b, idx) => {
                    const tamam = idx < aktifBasamak;
                    const aktif = idx === aktifBasamak;
                    return `<button type="button" class="basamak-oge ${tamam ? 'tamamlandi' : ''} ${aktif ? 'aktif-basamak' : ''}" data-eylem="basamakTik" data-tamam="${tamam ? '1' : '0'}" data-basamak-ad="${esc(b)}" aria-label="${esc(b)}${tamam ? ' (Tamamlandı)' : aktif ? ' (Mevcut Seviye)' : ' (Kilitli)'}" title="${esc(b)}">
                      <div class="basamak-rozet">
                        ${tamam ? '✓' : aktif ? '⭐' : (idx + 1)}
                      </div>
                      <span class="basamak-ad">${esc(b)}</span>
                    </button>`;
                  }).join('')}
                </div>
                <div class="kuran-yolu-gorsel-kutu">
                  <img src="/media/mektep/kuran-yolu.webp" alt="Kur'an Yolu İllüstrasyonu" class="kuran-yol-resim" loading="lazy" width="600" height="220" />
                </div>
              </div>
              ${ile?.hocaNotu ? `<div class="ogrenci-hoca-notu"><p><b>Hocanın Notu:</b> ${esc(ile.hocaNotu)}</p></div>` : ''}
            </section>

            <!-- BAŞARI ROZETLERİM -->
            <section class="bolum r-ochre rozetler-kart">
              ${bas('yildiz', m.rozetlerim, m.rozetAciklama)}
              <div class="rozet-izgara">
                ${ile?.rozet ? `
                  <button type="button" class="rozet-kart kazanildi hoca-ozel-rozet" data-eylem="rozetTik" data-kazanildi="1" data-rozet-ad="${esc(((m.hocaRozetleri as unknown as Record<string, string>) || {})[ile.rozet] || ile.rozet)}" aria-label="${esc(((m.hocaRozetleri as unknown as Record<string, string>) || {})[ile.rozet] || ile.rozet)} (Kazanıldı)">
                    <div class="rozet-simge rozet-gorselli">
                      <img src="/media/mektep/rozet-yildiz.webp" alt="Hoca Takdiri Rozeti" class="rozet-resim-img" width="56" height="56" />
                    </div>
                    <h4>${esc(((m.hocaRozetleri as unknown as Record<string, string>) || {})[ile.rozet] || ile.rozet)}</h4>
                    <p class="kucuk">${esc(m.hocaTakdiriNotu)}</p>
                  </button>
                ` : ''}
                <button type="button" class="rozet-kart kazanildi" data-eylem="rozetTik" data-kazanildi="1" data-rozet-ad="${esc(m.rozetListesi.baslangic.ad)}" aria-label="${esc(m.rozetListesi.baslangic.ad)} (Kazanıldı)">
                  <div class="rozet-simge rozet-gorselli">
                    <img src="/media/mektep/rozet-yildiz.webp" alt="İlk Adım Rozeti" class="rozet-resim-img" width="56" height="56" />
                  </div>
                  <h4>${esc(m.rozetListesi.baslangic.ad)}</h4>
                  <p class="kucuk">${esc(m.rozetListesi.baslangic.aciklama)}</p>
                </button>
                <button type="button" class="rozet-kart ${aktifBasamak >= 1 ? 'kazanildi' : 'kilitli'}" data-eylem="rozetTik" data-kazanildi="${aktifBasamak >= 1 ? '1' : '0'}" data-rozet-ad="${esc(m.rozetListesi.elifba.ad)}" aria-label="${esc(m.rozetListesi.elifba.ad)} (${aktifBasamak >= 1 ? 'Kazanıldı' : 'Kilitli'})">
                  <div class="rozet-simge rozet-gorselli">
                    ${aktifBasamak >= 1 ? '<img src="/media/mektep/rozet-kuran.webp" alt="Elifba Rozeti" class="rozet-resim-img" width="56" height="56" />' : '🔒'}
                  </div>
                  <h4>${esc(m.rozetListesi.elifba.ad)}</h4>
                  <p class="kucuk">${esc(m.rozetListesi.elifba.aciklama)}</p>
                </button>
                <button type="button" class="rozet-kart ${yildizSayisi >= 3 ? 'kazanildi' : 'kilitli'}" data-eylem="rozetTik" data-kazanildi="${yildizSayisi >= 3 ? '1' : '0'}" data-rozet-ad="${esc(m.rozetListesi.namaz.ad)}" aria-label="${esc(m.rozetListesi.namaz.ad)} (${yildizSayisi >= 3 ? 'Kazanıldı' : 'Kilitli'})">
                  <div class="rozet-simge rozet-gorselli">
                    ${yildizSayisi >= 3 ? '<img src="/media/mektep/rozet-ahlak.webp" alt="Namaz Rozeti" class="rozet-resim-img" width="56" height="56" />' : '🔒'}
                  </div>
                  <h4>${esc(m.rozetListesi.namaz.ad)}</h4>
                  <p class="kucuk">${esc(m.rozetListesi.namaz.aciklama)}</p>
                </button>
                <button type="button" class="rozet-kart ${aktifBasamak >= 5 ? 'kazanildi' : 'kilitli'}" data-eylem="rozetTik" data-kazanildi="${aktifBasamak >= 5 ? '1' : '0'}" data-rozet-ad="${esc(m.rozetListesi.kuran.ad)}" aria-label="${esc(m.rozetListesi.kuran.ad)} (${aktifBasamak >= 5 ? 'Kazanıldı' : 'Kilitli'})">
                  <div class="rozet-simge ${aktifBasamak >= 5 ? 'rozet-gorselli' : ''}">
                    ${aktifBasamak >= 5 ? '<img src="/media/mektep/rozet-hatim.webp" alt="Kur’an Rozeti" class="rozet-resim-img" width="56" height="56" />' : '🔒'}
                  </div>
                  <h4>${esc(m.rozetListesi.kuran.ad)}</h4>
                  <p class="kucuk">${esc(m.rozetListesi.kuran.aciklama)}</p>
                </button>
                <button type="button" class="rozet-kart ${toplamDers >= 2 ? 'kazanildi' : 'kilitli'}" data-eylem="rozetTik" data-kazanildi="${toplamDers >= 2 ? '1' : '0'}" data-rozet-ad="${esc(m.rozetListesi.devam.ad)}" aria-label="${esc(m.rozetListesi.devam.ad)} (${toplamDers >= 2 ? 'Kazanıldı' : 'Kilitli'})">
                  <div class="rozet-simge ${toplamDers >= 2 ? 'rozet-gorselli' : ''}">
                    ${toplamDers >= 2 ? '<img src="/media/mektep/rozet-devam.webp" alt="Devam Rozeti" class="rozet-resim-img" width="56" height="56" />' : '🔒'}
                  </div>
                  <h4>${esc(m.rozetListesi.devam.ad)}</h4>
                  <p class="kucuk">${esc(m.rozetListesi.devam.aciklama)}</p>
                </button>
              </div>
            </section>

            <!-- HAFTANIN EĞİTİCİ KÖŞESİ -->
            <section class="bolum r-adacayi video-kose-kart">
              ${bas('duyuru', m.videoKosesi, m.videoAciklama)}
              <div class="video-kose-govde">
                <p class="kucuk">${haftaOdev && haftaOdev.odev ? esc(cok(haftaOdev.odev)) : 'Bu haftaki ders etkinliklerini ve ezberlerini tamamlayarak yeni rozetler kazanabilirsin.'}</p>
                <div class="mektep-video-vitrin">
                  <div class="mektep-video-afis-kutu">
                    <img src="/media/mektep/elifba-bahcesi.webp" alt="Diyanet Çocuk Eğitici Medya" class="mektep-video-afis-resim" loading="lazy" width="600" height="200" />
                    <a href="https://kuran.diyanet.gov.tr/elifba/" target="_blank" rel="noopener" class="mektep-video-oynat-btn" title="Diyanet İnteraktif Elifbâ">
                      <span class="oynat-simge" aria-hidden="true">▶</span>
                      <span class="oynat-yazi">${dil === 'fr' ? 'Ouvrir l’animation Elif-Bâ' : dil === 'en' ? 'Open Elif-Ba Animation' : 'Diyanet Elif-Bâ Animasyonunu Başlat'}</span>
                    </a>
                  </div>
                </div>
                <div class="egitici-bag-kutu">
                  <a class="ic-bag buyuk-bag" href="https://kuran.diyanet.gov.tr/elifba/" target="_blank" rel="noopener">
                    ${simge('kitap')}<span>Diyanet İnteraktif Elifbâ Portalı</span>${simge('disari')}
                  </a>
                  <a class="ic-bag buyuk-bag" href="https://dijital.diyanet.gov.tr/" target="_blank" rel="noopener">
                    ${simge('duyuru')}<span>Diyanet Çocuk Kütüphanesi</span>${simge('disari')}
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>`;
      if (d.ezberHizi) {
        const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
        if (audioEl) audioEl.playbackRate = d.ezberHizi;
      }
    };

    if (d.mod === 'ogrenci') {
      ogrenciPanoCiz();
      return;
    }

    /* Ders kitabı / materyal kartı: her öğrenci için tek seferlik üç seçenek. Yanıtlanmamış öğrenci
       varsa kart vurgulu ve en üstte durur; hepsi yanıtlanınca özet satırlarına iner. */
    const kitapKarti = () => {
      const sec = d.aile.kitapSecim || {};
      const eksik = d.ogrenciler.some((x) => !sec[x.ref]);
      const adlar = m.kitapSecildi as Record<string, string>;
      const satirlar = d.ogrenciler.map((x) => {
        const v = sec[x.ref];
        return `<div class="kitap-satir${v ? '' : ' acik'}">
          <span class="ks-ad">${simge('ogrenci')}<b>${esc(x.ad)} ${esc(x.soyad)}</b></span>
          ${v
            ? `<span class="ks-yanit"><span class="rozet ogrendi">${esc(adlar[v.secim] || v.secim)}</span>
                 <button type="button" class="kucuk-dugme" data-kitap-degistir="${esc(x.ref)}">${simge('kalem')}${esc(m.kitapDegistir)}</button></span>`
            : `<span class="ks-secenek">
                 <button type="button" class="ks-dugme" data-kitap="var" data-ref="${esc(x.ref)}">${esc(m.kitapVar)}</button>
                 <button type="button" class="ks-dugme" data-kitap="satin" data-ref="${esc(x.ref)}">${esc(m.kitapSatin)}</button>
                 <button type="button" class="ks-dugme" data-kitap="fotokopi" data-ref="${esc(x.ref)}">${esc(m.kitapFoto)}</button>
               </span>`}
        </div>`;
      }).join('');
      return `<section class="bolum genis r-ochre kitap-kart${eksik ? ' oncelik' : ''}" id="kitap">
        ${bas('kitap', m.kitapBaslik, eksik ? m.kitapBekliyor : '')}
        <p class="kucuk">${esc(m.kitapA)}</p>
        ${satirlar}
        <div class="kitap-bilgi">
          <p class="kucuk"><b>${esc(m.kitapSatin)}</b> — ${esc(m.kitapSatinNot)}</p>
          <p class="kitap-baglar">
            <a class="ic-bag" href="https://zsu-shop.de" target="_blank" rel="noopener">${esc(m.kitapSatinBag)}${simge('disari')}</a>
            <a class="ic-bag" href="https://www.ditib-akademie.de/cg1/" target="_blank" rel="noopener">${esc(m.kitapCg1)}${simge('disari')}</a>
            <a class="ic-bag" href="https://www.ditib-akademie.de/cg2/" target="_blank" rel="noopener">${esc(m.kitapCg2)}${simge('disari')}</a>
          </p>
          <p class="kucuk"><b>${esc(m.kitapFoto)}</b> — ${esc(m.kitapFotoNot)}</p>
        </div>
      </section>`;
    };

    /* Haftalık Mektep Karnesi (Snapshot Card) */
    const haftalikKarneKarti = () => {
      if (!o) return '';
      const sonYoklama = yk.length ? yk[yk.length - 1] : null;
      const sonYoklamaDersler = sonYoklama ? dersDurumlari(sonYoklama) : [];
      const varSayisi = sonYoklamaDersler.filter((d) => d.durum === 'var').length;
      const yoklamaMetni = sonYoklama
        ? `${tarihYaz(sonYoklama.tarih)}: ${varSayisi}/${sonYoklamaDersler.length || 3} ${m.durum.var}`
        : m.yoklamaYok;

      const buHaftaKonu = haftaGunleri.length && haftaGunleri[0].dersler.length
        ? haftaGunleri[0].dersler.map((d) => d.konu).join(', ')
        : (haftaOdev?.odev ? cok(haftaOdev.odev) : m.varsayilanDersKonusu);

      const ezberHedefi = haftaOdev?.ezber
        ? cok(haftaOdev.ezber)
        : (haftaGunleri.length && haftaGunleri[0].dersler.some((d) => d.ezber.length)
          ? haftaGunleri[0].dersler.flatMap((d) => d.ezber).join(', ')
          : m.varsayilanEzberHedefi);

      const hocaGorus = ile?.hocaNotu || (c && c.notlar.length ? c.notlar[c.notlar.length - 1].metin : '');

      const paylasMesaji = encodeURIComponent(
        `🌟 *${o.ad} ${o.soyad} — ${m.haftalikKarne}*\n` +
        `📅 *${m.haftalikYoklamaDurumu}:* ${yoklamaMetni}\n` +
        `📖 *${m.haftalikDersKonusu}:* ${buHaftaKonu}\n` +
        `🎯 *${m.haftalikEzberHedefi}:* ${ezberHedefi}\n` +
        (hocaGorus ? `💬 *${m.hocaNotu}:* ${hocaGorus}\n` : '') +
        `\n🕌 ${m.karneCamiImza}`
      );

      return `<section class="bolum r-iznik oncelik genis haftalik-karne-kart">
        <div class="karne-baslik-satir">
          <div class="karne-baslik-sol">
            <span class="karne-simge" aria-hidden="true">🌟</span>
            <div>
              <h3 style="margin:0;font-size:1.15rem">${esc(m.haftalikKarne)}</h3>
              <p class="kucuk" style="margin:0">${esc(m.haftalikKarneAciklama)}</p>
            </div>
          </div>
          <a href="https://api.whatsapp.com/send?text=${paylasMesaji}" target="_blank" rel="noopener" class="dugme dugme-ikincil kucuk-dugme whatsapp-paylas-btn" title="${esc(m.ailecePaylas)}">
            ${simge('paylas')}<span>${esc(m.ailecePaylas)}</span>
          </a>
        </div>

        <div class="karne-izgara">
          <div class="karne-hucre">
            <span class="karne-etiket">${simge('takvim')}<span>${esc(m.haftalikYoklamaDurumu)}</span></span>
            <p class="karne-deger">${esc(yoklamaMetni)}</p>
          </div>
          <div class="karne-hucre">
            <span class="karne-etiket">${simge('kitap')}<span>${esc(m.haftalikDersKonusu)}</span></span>
            <p class="karne-deger" lang="tr">${esc(buHaftaKonu)}</p>
          </div>
          <div class="karne-hucre">
            <span class="karne-etiket">${simge('yildiz')}<span>${esc(m.haftalikEzberHedefi)}</span></span>
            <p class="karne-deger" lang="tr">${esc(ezberHedefi)}</p>
          </div>
          ${hocaGorus ? `<div class="karne-hucre genis-hucre">
            <span class="karne-etiket">${simge('not')}<span>${esc(m.hocaNotu)}</span></span>
            <p class="karne-deger hoca-not-deger">${esc(hocaGorus)}</p>
          </div>` : ''}
        </div>
      </section>`;
    };

    const duzen = duzenlenenBildirim ? d.bildirimler.find((b) => b.id === duzenlenenBildirim) || null : null;
    // Mazeret düzenlenirken orijinal tarih gelecek penceresinin dışına düşmüşse seçeneklerin başına
    // eklenir; yoksa hiçbir <option> selected olmaz, tarayıcı sessizce ilk günü gösterir ve kaydeder.
    const bildirTarihleri = duzen?.tarih && !gelecekGunler.some((g) => g.tarih === duzen.tarih)
      ? [duzen.tarih, ...gelecekGunler.map((g) => g.tarih)]
      : gelecekGunler.map((g) => g.tarih);

    kok.innerHTML = `
      <div class="pano-hero">
        <div class="hero-serit" aria-hidden="true"></div>
        <div class="hero-ust">
          <div class="selam-sar">
            ${o ? `<span class="ogrenci-avatar ${monogramSinifi(o.ref)}" aria-hidden="true">${esc(monogramHarfleri(o.ad, o.soyad))}</span>` : ''}
            <div class="selam-metin">
              <p class="selam"><small>${esc(m.hosgeldin)}</small><span class="cocuk-adi">${o ? esc(o.ad) + ' ' + esc(o.soyad) : esc(d.eposta)}</span></p>
            </div>
          </div>
          <div class="hero-eylemler">
            ${o ? `<button type="button" class="dugme dugme-ogrenci" data-eylem="ogrenciModu">${simge('ogrenci')}<span>${esc(m.ogrenciModu)}</span></button>` : ''}
            <button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${simge('cikis')}${esc(m.cikis)}</button>
          </div>
        </div>
        ${kunyeler.length ? `<div class="kunye-serit">${kunyeler.map((k) => `<div class="kunye">${simge(k.ikon)}<div><span class="k-deger">${esc(k.deger)}</span><span class="k-etiket">${esc(k.etiket)}</span></div></div>`).join('')}</div>` : ''}
      </div>
      ${d.ogrenciler.length > 1 ? `<div class="cocuk-sec" role="tablist" aria-label="${esc(m.cocuklar)}">
        ${d.ogrenciler.map((x, i) => `<button type="button" role="tab" id="cocuk-sekme-${i}" class="cocuk-dugme" aria-selected="${i === d.secili}" aria-controls="cocuk-panel" tabindex="${i === d.secili ? 0 : -1}" data-sec="${i}"><span class="sekme-avatar ${monogramSinifi(x.ref)}" aria-hidden="true">${esc(monogramHarfleri(x.ad, x.soyad))}</span>${esc(x.ad)} ${esc(x.soyad)}</button>`).join('')}
      </div>` : ''}
      <div class="bolumler"${d.ogrenciler.length > 1 ? ` role="tabpanel" id="cocuk-panel" aria-labelledby="cocuk-sekme-${d.secili}"` : ''}>
        ${haftalikKarneKarti()}
        ${kitapKarti()}
        <section class="bolum r-iznik oncelik genis">
          ${bas('kitap', m.buHafta, `${tarihYaz(pzt)} – ${tarihYaz(paz)}${haftaGunleri[0] ? ' · ' + yerlestir(m.hafta, { n: haftaGunleri[0].hafta }) : ''}`)}
          ${haftaGunleri.length ? `<div>${haftaGunleri.map((g) => `<div class="hafta-gun"><span class="g-tarih">${esc(tarihYaz(g.tarih, { weekday: 'long', day: 'numeric', month: 'short' }))}</span>
              <span class="g-dersler">${g.dersler.map((x) => `<span class="g-ders"><span class="g-no">${x.no}.</span> ${esc(alanAdi(x.kod))}: <span lang="tr">${esc(x.konu)}</span></span>`).join('')}
              ${g.dersler.some((x) => x.ezber.length) ? `<span class="rozet ogrendi">${esc(m.ezber)}: <span lang="tr">${esc(g.dersler.flatMap((x) => x.ezber).join(', '))}</span></span>` : ''}
              ${veri.materyalGunleri.includes(g.tarih) ? `<a class="ic-bag" href="${esc(veri.materyalYolu)}#g-${g.tarih}">${esc(m.materyal)}${simge('disari')}</a>` : ''}</span></div>`).join('')}</div>` : ''}
          ${haftaOdev ? `<h3>${esc(m.ezber)}</h3><p style="white-space:pre-line">${bagla(cok(haftaOdev.ezber) || '—')}</p>
            <h3>${esc(m.odev)}</h3><p style="white-space:pre-line">${bagla(cok(haftaOdev.odev) || '—')}</p>
            ${haftaOdev.materyal ? `<p style="margin-top:.7rem"><a class="ic-bag" href="${esc(haftaOdev.materyal)}">${esc(m.materyal)}${simge('disari')}</a></p>` : ''}` : bosDurum('kitap', m.odevYok)}
          ${siradaki ? `<p class="kucuk" style="margin-top:1rem;display:flex;align-items:center;gap:.45rem">${simge('takvim')}<span><b>${esc(m.siradakiDers)}:</b> ${esc(tarihYaz(siradaki.tarih, { weekday: 'long', day: 'numeric', month: 'long' }))}</span></p>` : ''}
        </section>

        <section class="bolum r-adacayi">
          ${bas('takvim', m.yoklama)}
          ${yk.length ? `<p class="kucuk">${esc(yerlestir(m.yoklamaBilgi, { n: toplamDers }))}</p>
            <div class="devam-ozet"><span><b>${say.var}</b> ${esc(durumAd('var'))}</span>${say.yok ? `<span><b>${say.yok}</b> ${esc(durumAd('yok'))}</span>` : ''}${say.mazeret ? `<span><b>${say.mazeret}</b> ${esc(durumAd('mazeret'))}</span>` : ''}${say.gec ? `<span><b>${say.gec}</b> ${esc(durumAd('gec'))}</span>` : ''}</div>
            <div class="yoklama-liste">${yk.slice().reverse().slice(0, 10).map((y) => { const gun = veri.gunler.find((gg) => gg.tarih === y.tarih); const pd = dersDurumlari(y); return `<div class="yoklama-gun"><span class="yg-tarih">${esc(tarihYaz(y.tarih, { weekday: 'short', day: 'numeric', month: 'short' }))}</span><div class="yg-dersler">${pd.map((p) => { const ders = gun && gun.dersler ? gun.dersler.find((dd) => String(dd.no) === p.sira) : null; const ad = ders ? alanAdi(ders.kod) : yerlestir(m.dersNo, { n: p.sira }); return `<span class="ders-kayit"><span class="dk-ad"><span class="dk-no">${esc(p.sira)}</span>${esc(ad)}</span><span class="rozet ${p.durum}">${esc(durumAd(p.durum))}</span></span>`; }).join('')}</div>${y.not ? `<p class="yg-not">${simge('not')}<span>${esc(y.not)}</span></p>` : ''}</div>`; }).join('')}</div>`
            : bosDurum('takvim', m.yoklamaYok)}
        </section>

        <section class="bolum r-kiremit">
          ${bas('grafik', m.ilerleme, ile && ile.guncelleme ? tarihYaz(ile.guncelleme, { day: 'numeric', month: 'short' }) : '')}
          ${ile ? `
            ${kuranKonu ? `<h3>${esc(m.kuranAdim)}</h3><div class="ilerleme-not"><b lang="tr">${esc(kuranKonu)}</b><span class="kucuk">${kuranNo + 1}/${kuranSirasi.length}</span></div><div class="cubuk"><span style="width:${yuzde}%"></span></div>` : ''}
            ${ile.ezber && Object.keys(ile.ezber).length ? `<h3>${esc(m.ezberler)}</h3><ul class="liste">${Object.entries(ile.ezber).map(([ad, dr]) => `<li><span lang="tr">${esc(ad)}</span><span class="rozet ${esc(dr)}">${esc((m.ezberDurum as Record<string, string>)[dr] || dr)}</span></li>`).join('')}</ul>` : ''}
            ${ile.alanlar && Object.keys(ile.alanlar).length ? `<h3>${esc(m.alanlar)}</h3><div class="dereceler">${Object.entries(ile.alanlar).map(([k, n]) => `<div class="derece"><b>${esc(alanAdi(k))}</b><span class="pipler" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="pip ${i < n ? 'dolu' : ''}"></span>`).join('')}</span><span class="d-ad">${esc(dereceAdi(n))}</span></div>`).join('')}</div>` : ''}
            ${ile.hocaNotu ? `<h3>${esc(m.hocaNotu)}</h3><p style="white-space:pre-line">${esc(ile.hocaNotu)}</p>` : ''}`
            : bosDurum('grafik', m.ilerlemeYok)}
        </section>

        <section class="bolum r-ochre">
          ${bas('yildiz', m.degerlendirme)}
          ${c && c.degerlendirme.length ? `<ul class="liste">${c.degerlendirme.map((x) => `<li><span class="kucuk">${esc(tarihYaz(x.tarih))}</span><b>${esc(alanAdi(x.alan))}</b>${x.olcut ? `<span lang="tr">${esc(x.olcut)}</span>` : ''}${x.derece ? `<span class="rozet derece">${esc(dereceAdi(x.derece))}</span>` : ''}${x.not ? `<span class="kucuk" style="flex-basis:100%">${esc(x.not)}</span>` : ''}</li>`).join('')}</ul>` : bosDurum('yildiz', m.degerlendirmeYok)}
        </section>

        <section class="bolum r-iznik">
          ${bas('not', m.notlar)}
          ${c && c.notlar.length ? `<ul class="liste">${c.notlar.map((x) => `<li><span class="kucuk">${esc(tarihYaz(x.tarih))}</span><span style="white-space:pre-line;flex-basis:100%">${esc(x.metin)}</span></li>`).join('')}</ul>` : bosDurum('not', m.notYok)}
        </section>

        <section class="bolum r-ochre genis">
          ${bas('duyuru', m.duyurular)}
          ${d.duyurular.length ? d.duyurular.slice(0, 10).map((x) => { const g = cok(x.metin); const uzun = duyuruDuz(g).length > 240; return `<article class="duyuru${uzun ? ' uzun' : ''}"><span class="d-tarih">${esc(tarihYaz(x.tarih, { day: 'numeric', month: 'long' }))}</span><h3>${esc(cok(x.baslik))}</h3><div class="d-govde">${duyuruHtml(g)}</div><button type="button" class="d-devam" data-devam>${esc(m.devaminiOku)}</button></article>`; }).join('') : bosDurum('duyuru', m.duyuruYok)}
        </section>

        <section class="bolum r-adacayi">
          ${bas('gonder', m.bildir)}
          <p class="kucuk">${esc(m.bildirA)}</p>
          <form data-form="bildir" novalidate class="${duzen ? 'duzenleme' : ''}">
            ${duzen ? `<p class="duzen-not">${simge('kalem')}<span>${esc(m.mesajDuzenle)}</span></p>` : ''}
            <label>${esc(m.ogrenci)}<select name="ref">${d.ogrenciler.map((x) => `<option value="${esc(x.ref)}" ${x.ref === (duzen ? duzen.ref : o?.ref) ? 'selected' : ''}>${esc(x.ad)} ${esc(x.soyad)}</option>`).join('')}</select></label>
            <label>${esc(m.bildir)}<select name="tur">${Object.entries(m.bildirTur).map(([k, v]) => `<option value="${k}" ${duzen && duzen.tur === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
            <label data-tarih-alani>${esc(m.bildirTarih)}<select name="tarih">${bildirTarihleri.map((gt) => `<option value="${gt}" ${duzen && duzen.tarih === gt ? 'selected' : ''}>${esc(tarihYaz(gt, { weekday: 'long', day: 'numeric', month: 'long' }))}</option>`).join('')}</select></label>
            <label>${esc(m.bildirMetin)}<textarea name="metin" maxlength="1000" required>${duzen ? esc(duzen.metin) : ''}</textarea></label>
            <p data-mesaj hidden class="not"></p>
            <div class="satir-dugmeler"><button type="submit" class="dugme dugme-birincil">${simge('gonder')}${esc(duzen ? m.guncelle : m.gonder)}</button>${duzen ? `<button type="button" class="dugme dugme-ikincil" data-eylem="bildirVazgec">${esc(m.vazgec)}</button>` : ''}</div>
          </form>
          ${d.bildirimler.length ? `<h3>${esc(m.bildirimlerim)}</h3><ul class="liste mesajlar">${d.bildirimler.slice().sort((x, y) => zamanMs(y) - zamanMs(x)).slice(0, 8).map((x) => `<li><span class="kucuk">${esc(zamanYaz(x))}</span><b>${esc((m.bildirTur as Record<string, string>)[x.tur] || x.tur)}</b>${x.tarih ? `<span class="kucuk">${esc(tarihYaz(x.tarih))}</span>` : ''}<span class="rozet ${x.yanit ? 'ogrendi' : x.okundu ? 'gec' : 'mazeret'}">${esc(x.yanit ? m.yanitlandi : x.okundu ? m.okundu : m.okunmadi)}</span><span class="m-metin">${esc(x.metin)}</span>${x.yanit ? `<div class="hoca-yanit"><span class="hy-bas">${simge('gonder')}${esc(m.hocaYaniti)}${x.yanitZaman ? ` · ${esc(zamanZ(x.yanitZaman))}` : ''}</span><p>${esc(x.yanit)}</p></div>` : ''}${!x.okundu && x.id ? `<span class="msj-eylem"><button type="button" class="kucuk-dugme" data-bildir-duzelt="${esc(x.id)}">${simge('kalem')}${esc(m.duzelt)}</button><button type="button" class="kucuk-dugme sil" data-bildir-sil="${esc(x.id)}">${simge('geri')}${esc(m.geriAl)}</button></span>` : ''}</li>`).join('')}</ul>` : ''}
        </section>

        <section class="bolum r-kiremit">
          ${bas('ayar', m.hesap)}
          <label>${esc(m.dil)}<select name="dil" data-dil-sec>${(['tr', 'fr', 'en'] as Dil[]).map((x) => `<option value="${x}" ${x === dil ? 'selected' : ''}>${x === 'tr' ? 'Türkçe' : x === 'fr' ? 'Français' : 'English'}</option>`).join('')}</select></label>
          <p class="kucuk" style="margin:.9rem 0 .1rem">${esc(m.girisBilgisi)}</p>
          <p style="margin:0;font-weight:600;overflow-wrap:anywhere">${esc(d.eposta)}</p>
          <details class="katlanir" style="margin-top:.95rem">
            <summary>${simge('kilit')}<span>${esc(m.sifreDegistir)}</span></summary>
            <form data-form="sifreDegistir" novalidate class="govde">
              <p class="kucuk" style="margin-top:0">${esc(m.sifreDegistirA)}</p>
              <label>${esc(m.yeniSifre)}<input type="password" name="sifre" minlength="8" required autocomplete="new-password"></label>
              <p data-mesaj hidden class="not"></p>
              <div class="satir-dugmeler"><button type="submit" class="dugme dugme-ikincil">${esc(m.kaydet)}</button></div>
            </form>
          </details>
        </section>
      </div>`;
    const turSec = kok.querySelector<HTMLSelectElement>('select[name=tur]'); const tarihAlani = kok.querySelector<HTMLElement>('[data-tarih-alani]');
    const tarihGoster = () => { if (tarihAlani && turSec) tarihAlani.hidden = turSec.value !== 'mazeret'; };
    turSec?.addEventListener('change', tarihGoster); tarihGoster();
  };
  const zamanMs = (b: Bildirim) => { const z = b.zaman as { toDate?: () => Date } | string | undefined; return typeof z === 'string' ? Date.parse(z) : z?.toDate ? z.toDate().getTime() : 0; };
  const zamanYaz = (b: Bildirim) => { const ms = zamanMs(b); return ms ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };
  const zamanZ = (z: { toDate?: () => Date } | string | undefined) => { const ms = typeof z === 'string' ? Date.parse(z) : z?.toDate ? z.toDate().getTime() : 0; return ms ? new Intl.DateTimeFormat(yerel[dil], { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : ''; };

  const kayitYokEkrani = () => {
    kok.innerHTML = `<div class="giris-sar"><div class="giris-kart"><p class="not hata">${esc(m.kayitYok)}</p><div class="satir-dugmeler"><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${simge('cikis')}${esc(m.cikis)}</button></div></div></div>`;
  };

  const panoyaGec = async (user: { email: string | null }, onMesaj = '') => {
    kok.innerHTML = `<p class="not">${esc(m.yukleniyor)}</p>`;
    try {
      durum = await veriYukle(user);
    } catch (e) {
      kok.innerHTML = `<p class="not hata">${esc(hataMetni(e))}</p><button type="button" class="dugme dugme-ikincil" data-eylem="cikis">${esc(m.cikis)}</button>`; return;
    }
    if (!durum) { kayitYokEkrani(); return; }
    panoCiz();
    if (onMesaj) kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(onMesaj)}</p>`);
    // Sayfayı başka dilde açmak kayıt formundaki iletişim tercihini değiştirmez.
    fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { sonGiris: new Date().toISOString() }).catch(() => {});
  };

  /* Çocuk sekmeleri — WAI-ARIA «tabs» deseni. Pano her seçimde yeniden çizildiği için düğme
     düğümü değişir ve odak gövdeye düşerdi; seçili sekmeye geri veriyoruz. */
  const sekmeSec = (i: number, odakla: boolean) => {
    if (!durum) return;
    tumSesleriDurdur();
    durum.secili = i; panoCiz();
    if (odakla) kok.querySelector<HTMLElement>(`#cocuk-sekme-${i}`)?.focus();
  };

  /* ---------------------------------------------------------------- olaylar */
  kok.addEventListener('keydown', (ev) => {
    const sekme = (ev.target as HTMLElement).closest<HTMLElement>('[role=tab][data-sec]');
    if (!sekme || !durum) return;
    const n = durum.ogrenciler.length; const su = Number(sekme.dataset.sec);
    const k = (ev as KeyboardEvent).key;
    const hedef = k === 'ArrowRight' || k === 'ArrowDown' ? (su + 1) % n
      : k === 'ArrowLeft' || k === 'ArrowUp' ? (su - 1 + n) % n
      : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
    if (hedef < 0) return;
    ev.preventDefault(); sekmeSec(hedef, true);
  });
  kok.addEventListener('click', async (ev) => {
    const devamBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-devam]');
    if (devamBtn) { const art = devamBtn.closest('.duyuru'); if (art) { const acik = art.classList.toggle('acik'); devamBtn.textContent = acik ? m.dahaAz : m.devaminiOku; } return; }
    const kitapBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-kitap]');
    if (kitapBtn && durum) {
      const ref = kitapBtn.dataset.ref as string;
      const secim = kitapBtn.dataset.kitap as string;
      // Nokta yollu alan adı kullanılmaz: öğrenci ref'i tire içerir (UC-2026-0001) ve Firestore
      // alan yolu olarak geçersizdir. Harita bütün olarak yazılır.
      const yeni = { ...(durum.aile.kitapSecim || {}), [ref]: { secim, zaman: new Date().toISOString() } };
      try {
        await fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { kitapSecim: yeni });
        durum.aile.kitapSecim = yeni; panoCiz();
        kok.insertAdjacentHTML('afterbegin', `<p class="not basari">${esc(m.kitapTesekkur)}</p>`);
      } catch (e) { kok.insertAdjacentHTML('afterbegin', `<p class="not hata">${esc(hataMetni(e))}</p>`); }
      return;
    }
    const kitapDegBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-kitap-degistir]');
    if (kitapDegBtn && durum) {
      const ref = kitapDegBtn.dataset.kitapDegistir as string;
      const yeni = { ...(durum.aile.kitapSecim || {}) };
      delete yeni[ref];
      try {
        await fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { kitapSecim: yeni });
        durum.aile.kitapSecim = yeni; panoCiz();
        kok.querySelector('#kitap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) { kok.insertAdjacentHTML('afterbegin', `<p class="not hata">${esc(hataMetni(e))}</p>`); }
      return;
    }
    const silBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-bildir-sil]');
    if (silBtn && durum) {
      const id = silBtn.dataset.bildirSil as string;
      if (!confirm(m.geriAlOnay)) return;
      try {
        await fs.deleteDoc(fs.doc(db, 'bildirimler', id));
        durum.bildirimler = durum.bildirimler.filter((b) => b.id !== id);
        if (duzenlenenBildirim === id) duzenlenenBildirim = null;
        panoCiz(); bildirimGoster(m.geriAlindi);
      } catch (e) { kok.insertAdjacentHTML('afterbegin', `<p class="not hata">${esc(hataMetni(e))}</p>`); }
      return;
    }
    const duzeltBtn = (ev.target as HTMLElement).closest<HTMLElement>('[data-bildir-duzelt]');
    if (duzeltBtn && durum) {
      duzenlenenBildirim = duzeltBtn.dataset.bildirDuzelt as string;
      panoCiz();
      kok.querySelector<HTMLElement>('form[data-form=bildir]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const hedef = (ev.target as HTMLElement).closest<HTMLElement>('[data-eylem], [data-sec]');
    if (!hedef) return;
    if (hedef.dataset.eylem === 'ogrenciModu' && durum) { pariltiSesiCal(); durum.mod = 'ogrenci'; panoCiz(); return; }
    if (hedef.dataset.eylem === 'veliModunaDon' && durum) { harfTikSesiCal(); tumSesleriDurdur(); durum.mod = 'veli'; panoCiz(); return; }
    if (hedef.dataset.eylem === 'hadisSesCal') {
      harfTikSesiCal();
      const gh = gununHadisiGetir(bugunISO());
      const tur = hedef.dataset.hadisTur || 'arapca';
      tumSesleriDurdur();
      hedef.classList.add('oynuyor');
      setTimeout(() => { hedef.classList.remove('oynuyor'); }, 1400);

      if (tur === 'arapca') {
        const sesUrl = `/media/ses/hadisler/ar/${gh.id}.mp3`;
        try {
          const a = new Audio(sesUrl);
          aktifAudio = a;
          a.play().catch(() => {
            metinSeslendir(gh.arapca, 'ar-SA');
          });
        } catch {
          metinSeslendir(gh.arapca, 'ar-SA');
        }
      } else {
        const sesUrl = `/media/ses/hadisler/tr/${gh.id}.mp3`;
        const mealMetin = gh.metin[dil] || gh.metin.tr;
        const dilKodu = dil === 'fr' ? 'fr-FR' : dil === 'en' ? 'en-US' : 'tr-TR';
        if (dil === 'tr') {
          try {
            const a = new Audio(sesUrl);
            aktifAudio = a;
            a.play().catch(() => {
              metinSeslendir(mealMetin, dilKodu);
            });
          } catch {
            metinSeslendir(mealMetin, dilKodu);
          }
        } else {
          metinSeslendir(mealMetin, dilKodu);
        }
      }
      return;
    }
    if (hedef.dataset.eylem === 'yildizTik') {
      pariltiSesiCal();
      konfetiPatlat();
      const kutlamaEl = kok.querySelector<HTMLElement>('[data-kutlama]');
      if (kutlamaEl) {
        kutlamaEl.textContent = `⭐ ${m.harikaGidiyorsun}`;
        kutlamaEl.hidden = false;
        setTimeout(() => { if (kutlamaEl) kutlamaEl.hidden = true; }, 3500);
      }
      return;
    }
    if (hedef.dataset.eylem === 'basamakTik') {
      pariltiSesiCal();
      if (hedef.dataset.tamam === '1') konfetiPatlat();
      return;
    }
    if (hedef.dataset.eylem === 'rozetTik') {
      pariltiSesiCal();
      const kazandi = hedef.dataset.kazanildi === '1';
      if (kazandi) konfetiPatlat();
      const rozetAd = hedef.dataset.rozetAd || '';
      const kutlamaEl = kok.querySelector<HTMLElement>('[data-kutlama]');
      if (kutlamaEl) {
        kutlamaEl.textContent = (kazandi ? '🏅 ' : '🔒 ') + rozetAd + (kazandi ? (dil === 'fr' ? ' — Félicitations !' : dil === 'en' ? ' — Well done!' : ' — Tebrikler!') : (dil === 'fr' ? ' — Continue tes efforts !' : dil === 'en' ? ' — Keep going!' : ' — Yakında kazanacaksın!'));
        kutlamaEl.hidden = false;
        setTimeout(() => { if (kutlamaEl) kutlamaEl.hidden = true; }, 3500);
      }
      return;
    }
    if (hedef.dataset.eylem === 'veliEvOnay' && durum) {
      const ezberId = hedef.dataset.ezber;
      const ogrenci = durum.ogrenciler[durum.secili];
      if (ogrenci && ezberId) {
        evOnayiKaydet(ogrenci.ref, ezberId);
        pariltiSesiCal();
        konfetiPatlat();
        const kutlamaEl = kok.querySelector<HTMLElement>('[data-kutlama]');
        if (kutlamaEl) {
          kutlamaEl.textContent = `👨‍👩‍👧 ${m.veliEvOnayiTebrik}`;
          kutlamaEl.hidden = false;
          setTimeout(() => { if (kutlamaEl) kutlamaEl.hidden = true; }, 3500);
        }
        panoCiz();
      }
      return;
    }
    if (hedef.dataset.eylem === 'gununHarfiDinle') {
      harfTikSesiCal();
      const gh = gununHarfiGetir(bugunISO());
      harfSeslendir(gh.harf, gh.id);
      return;
    }
    if (hedef.dataset.eylem === 'gununHarfiniCalis' && durum) {
      harfTikSesiCal();
      const hid = hedef.dataset.harfId;
      if (hid) {
        durum.seciliHarfId = hid;
        durum.seciliHarfGrup = 'hepsi';
        panoCiz();
        const h = ELIFBA_HARFLERI.find((x) => x.id === hid);
        if (h) harfSeslendir(h.harf, h.id);
        kok.querySelector('.elifba-tahtasi-kart')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    if (hedef.dataset.eylem === 'ezberSesOynatDur') {
      harfTikSesiCal();
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) {
        if (audioEl.paused) audioEl.play().catch(() => {});
        else audioEl.pause();
      }
      return;
    }
    if (hedef.dataset.eylem === 'ezberBastan') {
      harfTikSesiCal();
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      }
      return;
    }
    if (hedef.dataset.eylem === 'ezberGeriSar') {
      harfTikSesiCal();
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) {
        audioEl.currentTime = Math.max(0, audioEl.currentTime - 5);
        if (audioEl.paused) audioEl.play().catch(() => {});
      }
      return;
    }
    if (hedef.dataset.eylem === 'kulakSesiCal' && durum) {
      harfTikSesiCal();
      const hedefId = durum.kulakHedefHarfId;
      const hedefHarf = ELIFBA_HARFLERI.find((h) => h.id === hedefId);
      if (hedefHarf) harfSeslendir(hedefHarf.harf, hedefHarf.id);
      return;
    }
    if (hedef.dataset.eylem === 'kulakSecim' && durum && !durum.kulakCevaplandi) {
      const secilenId = hedef.dataset.harfId;
      durum.kulakSecilenId = secilenId;
      durum.kulakCevaplandi = true;
      durum.kulakDogruMu = (secilenId === durum.kulakHedefHarfId);
      // Dokunulan harfin kendi tilavetini anında dinlet
      if (secilenId) {
        const secilenHarf = ELIFBA_HARFLERI.find((h) => h.id === secilenId);
        if (secilenHarf) harfSeslendir(secilenHarf.harf, secilenHarf.id);
      }
      if (durum.kulakDogruMu) {
        setTimeout(() => {
          kutlamaSesiCal();
          konfetiPatlat();
        }, 380);
        durum.kulakSkoru = (durum.kulakSkoru || 0) + 1;
        const o = durum.ogrenciler[durum.secili];
        const yildizKey = `ulucamii_yildiz_${o?.ref || 'genel'}`;
        try {
          const yildiz = Number(localStorage.getItem(yildizKey) || '0') + 1;
          localStorage.setItem(yildizKey, String(yildiz));
        } catch {}
      } else {
        setTimeout(() => {
          hataSesiCal();
        }, 350);
      }
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'kulakTekrarDene' && durum) {
      harfTikSesiCal();
      durum.kulakCevaplandi = false;
      durum.kulakSecilenId = undefined;
      durum.kulakDogruMu = undefined;
      panoCiz();
      setTimeout(() => {
        const hedefId = durum?.kulakHedefHarfId;
        if (hedefId) {
          const hh = ELIFBA_HARFLERI.find((h) => h.id === hedefId);
          if (hh) harfSeslendir(hh.harf, hh.id);
        }
      }, 250);
      return;
    }
    if (hedef.dataset.eylem === 'kulakSonraki' && durum) {
      harfTikSesiCal();
      const rastgele = ELIFBA_HARFLERI[Math.floor(Math.random() * ELIFBA_HARFLERI.length)];
      durum.kulakHedefHarfId = rastgele.id;
      const digerleri = ELIFBA_HARFLERI.filter((h) => h.id !== rastgele.id);
      const karisikDiger = [...digerleri].sort(() => Math.random() - 0.5).slice(0, 3);
      durum.kulakSecenekler = [rastgele.id, ...karisikDiger.map((c) => c.id)].sort(() => Math.random() - 0.5);
      durum.kulakCevaplandi = false;
      durum.kulakSecilenId = undefined;
      durum.kulakDogruMu = undefined;
      panoCiz();
      setTimeout(() => {
        const hedefId = durum?.kulakHedefHarfId;
        if (hedefId) {
          const hh = ELIFBA_HARFLERI.find((h) => h.id === hedefId);
          if (hh) harfSeslendir(hh.harf, hh.id);
        }
      }, 250);
      return;
    }
    if (hedef.dataset.eylem === 'harfGrupSec' && durum) {
      harfTikSesiCal();
      durum.seciliHarfGrup = hedef.dataset.grup as HarfGrup;
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'harfSec' && durum) {
      harfTikSesiCal();
      durum.seciliHarfId = hedef.dataset.harf;
      panoCiz();
      const secilenHarfOgesi = ELIFBA_HARFLERI.find((h) => h.id === durum?.seciliHarfId);
      if (secilenHarfOgesi) harfSeslendir(secilenHarfOgesi.harf, secilenHarfOgesi.id);
      return;
    }
    if (hedef.dataset.eylem === 'harfSesCal') {
      harfTikSesiCal();
      const harf = hedef.dataset.harf || '';
      const harfId = hedef.dataset.harfId;
      if (harf) harfSeslendir(harf, harfId);
      return;
    }
    if (hedef.dataset.eylem === 'harekeSesCal') {
      harfTikSesiCal();
      const harfMetni = hedef.dataset.harf || '';
      const harfId = hedef.dataset.harfId || durum?.seciliHarfId || 'elif';
      const harekeId = (hedef.dataset.harekeId as HarekeTuru) || 'ustun';
      hedef.classList.add('oynuyor');
      setTimeout(() => { hedef.classList.remove('oynuyor'); }, 700);
      harekeliSeslendir(harfId, harekeId, harfMetni);
      return;
    }
    if (hedef.dataset.eylem === 'harfOnceki' && durum) {
      harfTikSesiCal();
      const currId = durum.seciliHarfId || 'elif';
      const currIdx = ELIFBA_HARFLERI.findIndex((h) => h.id === currId);
      const prevIdx = (currIdx - 1 + ELIFBA_HARFLERI.length) % ELIFBA_HARFLERI.length;
      const yeniHarf = ELIFBA_HARFLERI[prevIdx];
      durum.seciliHarfId = yeniHarf.id;
      panoCiz();
      harfSeslendir(yeniHarf.harf, yeniHarf.id);
      return;
    }
    if (hedef.dataset.eylem === 'harfSonraki' && durum) {
      harfTikSesiCal();
      const currId = durum.seciliHarfId || 'elif';
      const currIdx = ELIFBA_HARFLERI.findIndex((h) => h.id === currId);
      const nextIdx = (currIdx + 1) % ELIFBA_HARFLERI.length;
      const yeniHarf = ELIFBA_HARFLERI[nextIdx];
      durum.seciliHarfId = yeniHarf.id;
      panoCiz();
      harfSeslendir(yeniHarf.harf, yeniHarf.id);
      return;
    }
    if (hedef.dataset.eylem === 'ezberHizAyarla' && durum) {
      harfTikSesiCal();
      const hiz = parseFloat(hedef.dataset.hiz || '1');
      durum.ezberHizi = hiz;
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) audioEl.playbackRate = hiz;
      kok.querySelectorAll<HTMLButtonElement>('.hiz-btn').forEach((b) => {
        const aktif = b.dataset.hiz === String(hiz);
        b.classList.toggle('aktif-hiz', aktif);
      });
      return;
    }
    if (hedef.dataset.eylem === 'ezberFransizcaDinle') {
      harfTikSesiCal();
      const ezId = hedef.dataset.ezber || durum?.seciliEzberId || 'fatiha';
      const ezOgesi = EZBER_LISTESI.find((x) => x.id === ezId) || EZBER_LISTESI[0];
      hedef.classList.add('oynuyor');
      setTimeout(() => { hedef.classList.remove('oynuyor'); }, 1200);
      fransizcaMealSeslendir(ezOgesi.id, ezOgesi.anlam.fr);
      return;
    }
    if (hedef.dataset.eylem === 'ezberHizliSec' && durum) {
      harfTikSesiCal();
      tumSesleriDurdur();
      durum.seciliEzberId = hedef.dataset.ezberId || 'fatiha';
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'ezberFiltreTur' && durum) {
      harfTikSesiCal();
      const yeniTur = (hedef.dataset.tur as 'hepsi' | 'sure' | 'dua') || 'hepsi';
      durum.ezberFiltreTur = yeniTur;
      const yeniListe = EZBER_LISTESI.filter((ez) => {
        if (yeniTur === 'sure') return ez.tur === 'sure';
        if (yeniTur === 'dua') return ez.tur === 'dua';
        return true;
      });
      const aktifEzberId = durum.seciliEzberId;
      const suAnki = EZBER_LISTESI.find((x) => x.id === aktifEzberId);
      if (suAnki && yeniTur !== 'hepsi' && suAnki.tur !== yeniTur && yeniListe.length > 0) {
        durum.seciliEzberId = yeniListe[0].id;
      }
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'ezberGizleToggle' && durum) {
      harfTikSesiCal();
      durum.ezberGizli = !durum.ezberGizli;
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'ezberDonguToggle' && durum) {
      harfTikSesiCal();
      durum.ezberDongu = !durum.ezberDongu;
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) audioEl.loop = Boolean(durum.ezberDongu);
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'ezberBastan') {
      harfTikSesiCal();
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) {
        audioEl.currentTime = 0;
        if (durum?.ezberHizi) audioEl.playbackRate = durum.ezberHizi;
        if (durum?.ezberDongu) audioEl.loop = true;
        audioEl.play().catch(() => {});
      }
      return;
    }
    if (hedef.dataset.eylem === 'ezberGeriSar') {
      harfTikSesiCal();
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) {
        audioEl.currentTime = Math.max(0, audioEl.currentTime - 5);
      }
      return;
    }
    if (hedef.dataset.eylem === 'ezberSesOynatDur') {
      if (durum?.ezberGizli) {
        durum.ezberGizli = false;
        panoCiz();
      }
      const audioEl = kok.querySelector<HTMLAudioElement>('audio.ezber-audio');
      if (audioEl) {
        if (audioEl.paused) {
          tumSesleriDurdur();
          if (durum?.ezberHizi) audioEl.playbackRate = durum.ezberHizi;
          if (durum?.ezberDongu) audioEl.loop = true;
          audioEl.play().catch(() => {});
        } else {
          audioEl.pause();
        }
      }
      return;
    }
    if (hedef.dataset.eylem === 'ezberTurkceDinle') {
      harfTikSesiCal();
      const ezId = hedef.dataset.ezber || durum?.seciliEzberId || 'fatiha';
      const ezOgesi = EZBER_LISTESI.find((x) => x.id === ezId) || EZBER_LISTESI[0];
      hedef.classList.add('oynuyor');
      setTimeout(() => { hedef.classList.remove('oynuyor'); }, 1400);
      tumSesleriDurdur();
      const sesUrl = `/media/ses/mealler/tr/${ezOgesi.id}.mp3`;
      try {
        const a = new Audio(sesUrl);
        aktifAudio = a;
        a.play().catch(() => {
          metinSeslendir(ezOgesi.anlam.tr, 'tr-TR');
        });
      } catch {
        metinSeslendir(ezOgesi.anlam.tr, 'tr-TR');
      }
      return;
    }
    if (hedef.dataset.eylem === 'quizSecim' && durum && !durum.quizCevaplandi) {
      const secilenIdx = Number(hedef.dataset.secenek);
      durum.quizSecilenIndex = secilenIdx;
      durum.quizCevaplandi = true;
      const soruNo = durum.quizSoruNo ?? 0;
      const aktifSoru = QUIZ_SORULARI[soruNo % QUIZ_SORULARI.length];
      if (secilenIdx === aktifSoru.dogruCevapIndex) {
        kutlamaSesiCal();
        konfetiPatlat();
        durum.quizDogruSayisi = (durum.quizDogruSayisi || 0) + 1;
        const o = durum.ogrenciler[durum.secili];
        const yildizKey = `ulucamii_yildiz_${o?.ref || 'genel'}`;
        try {
          const yildiz = Number(localStorage.getItem(yildizKey) || '0') + 1;
          localStorage.setItem(yildizKey, String(yildiz));
        } catch {}
      } else {
        hataSesiCal();
      }
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'quizSonraki' && durum) {
      harfTikSesiCal();
      const sonraki = (durum.quizSoruNo ?? 0) + 1;
      if (sonraki >= QUIZ_SORULARI.length) {
        durum.quizBitti = true;
        kutlamaSesiCal();
        konfetiPatlat();
      } else {
        durum.quizSoruNo = sonraki;
        durum.quizCevaplandi = false;
        durum.quizSecilenIndex = null;
      }
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'quizYeniden' && durum) {
      harfTikSesiCal();
      durum.quizSoruNo = 0;
      durum.quizDogruSayisi = 0;
      durum.quizCevaplandi = false;
      durum.quizSecilenIndex = null;
      durum.quizBitti = false;
      panoCiz();
      return;
    }
    if (hedef.dataset.eylem === 'tekrarEttim' && durum) {
      kutlamaSesiCal();
      konfetiPatlat();
      const o = durum.ogrenciler[durum.secili];
      const yildizKey = `ulucamii_yildiz_${o?.ref || 'genel'}`;
      let yildizSayisi = 0;
      try {
        yildizSayisi = Number(localStorage.getItem(yildizKey) || '0') + 1;
        localStorage.setItem(yildizKey, String(yildizSayisi));
      } catch {}
      const sayacEl = kok.querySelector('[data-yildiz-goster]');
      if (sayacEl) sayacEl.textContent = String(yildizSayisi);
      const kutlamaEl = kok.querySelector<HTMLElement>('[data-kutlama]');
      if (kutlamaEl) {
        kutlamaEl.textContent = `🎉 ${m.harikaGidiyorsun} (+1 ⭐)`;
        kutlamaEl.hidden = false;
        setTimeout(() => { if (kutlamaEl) kutlamaEl.hidden = true; }, 3500);
      }
      return;
    }
    if (hedef.dataset.eylem === 'cikis') { tumSesleriDurdur(); await auth.signOut(a); portalTercihleri.removeItem('veliEposta'); durum = null; duzenlenenBildirim = null; girisEkrani(); return; }
    if (hedef.dataset.eylem === 'bildirVazgec') { duzenlenenBildirim = null; panoCiz(); return; }
    if (hedef.dataset.eylem === 'atla' && a.currentUser) { await panoyaGec(a.currentUser); return; }
    if (hedef.dataset.eylem === 'sifremiUnuttum') {
      const form = hedef.closest('form') as HTMLFormElement; const eposta = (form.querySelector('input[name=eposta]') as HTMLInputElement).value.trim().toLowerCase();
      mesaj(form, '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) { mesaj(form, m.hataEposta, 'hata'); return; }
      try { mesgul(form, true); await auth.sendPasswordResetEmail(a, eposta, { url: sayfaAdresi }); portalTercihleri.setItem('veliEposta', eposta); mesaj(form, yerlestir(m.sifreSifirlaGonderildi, { eposta }), 'basari'); }
      catch (e) { mesaj(form, hataMetni(e), 'hata'); } finally { mesgul(form, false); }
      return;
    }
    if (hedef.dataset.sec !== undefined && durum) { sekmeSec(Number(hedef.dataset.sec), true); }
  });
  kok.addEventListener('change', async (ev) => {
    const ezberSec = (ev.target as HTMLElement).closest<HTMLSelectElement>('[data-eylem=ezberDegistir]');
    if (ezberSec && durum) {
      harfTikSesiCal();
      tumSesleriDurdur();
      durum.seciliEzberId = ezberSec.value;
      panoCiz();
      return;
    }
    const sec = (ev.target as HTMLElement).closest<HTMLSelectElement>('[data-dil-sec]');
    if (sec && durum) {
      const yeni = sec.value as Dil;
      await fs.updateDoc(fs.doc(db, 'aileler', durum.eposta), { dil: yeni }).catch(() => {});
      if (veri.dilYollari?.[yeni]) location.href = veri.dilYollari[yeni];
    }
  });
  // Ezber odasındaki sûre/dua çalmaya başladığında aktif harf sesini durdur ve metni parlat
  kok.addEventListener(
    'play',
    (ev) => {
      const hedefAudio = ev.target as HTMLAudioElement;
      if (hedefAudio && hedefAudio.classList.contains('ezber-audio')) {
        if (durum?.ezberHizi) {
          try { hedefAudio.playbackRate = durum.ezberHizi; } catch {}
        }
        if (durum?.ezberDongu) {
          try { hedefAudio.loop = true; } catch {}
        }
        if (aktifAudio && !aktifAudio.paused) {
          aktifAudio.pause();
          aktifAudio.currentTime = 0;
        }
        kok.querySelector('.ezber-arapca')?.classList.add('oynuyor');
      }
    },
    true
  );
  kok.addEventListener(
    'pause',
    (ev) => {
      const hedefAudio = ev.target as HTMLAudioElement;
      if (hedefAudio && hedefAudio.classList.contains('ezber-audio')) {
        kok.querySelector('.ezber-arapca')?.classList.remove('oynuyor');
      }
    },
    true
  );
  kok.addEventListener(
    'ended',
    (ev) => {
      const hedefAudio = ev.target as HTMLAudioElement;
      if (hedefAudio && hedefAudio.classList.contains('ezber-audio')) {
        kok.querySelector('.ezber-arapca')?.classList.remove('oynuyor');
        if (durum) {
          kutlamaSesiCal();
          konfetiPatlat();
          const o = durum.ogrenciler[durum.secili];
          const yildizKey = `ulucamii_yildiz_${o?.ref || 'genel'}`;
          let yildizSayisi = 0;
          try {
            yildizSayisi = Number(localStorage.getItem(yildizKey) || '0') + 1;
            localStorage.setItem(yildizKey, String(yildizSayisi));
          } catch {}
          const sayacEl = kok.querySelector('[data-yildiz-goster]');
          if (sayacEl) sayacEl.textContent = String(yildizSayisi);
          const kutlamaEl = kok.querySelector<HTMLElement>('[data-kutlama]');
          if (kutlamaEl) {
            kutlamaEl.textContent = `🎉 ${m.harikaGidiyorsun} (+1 ⭐)`;
            kutlamaEl.hidden = false;
            setTimeout(() => { if (kutlamaEl) kutlamaEl.hidden = true; }, 4000);
          }
        }
      }
    },
    true
  );
  // Elif-Bâ harf tahtası klavye gezinimi (ok tuşları ile harf seçimi)
  kok.addEventListener('keydown', (ev) => {
    const hedef = ev.target as HTMLElement;
    if (!hedef || !hedef.classList.contains('elifba-harf-btn')) return;
    const butonlar = Array.from(kok.querySelectorAll<HTMLButtonElement>('.elifba-harf-btn'));
    const suankiIndex = butonlar.indexOf(hedef as HTMLButtonElement);
    if (suankiIndex === -1) return;

    let yeniIndex = suankiIndex;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      yeniIndex = (suankiIndex + 1) % butonlar.length;
    } else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      yeniIndex = (suankiIndex - 1 + butonlar.length) % butonlar.length;
    } else {
      return;
    }
    const yeniButon = butonlar[yeniIndex];
    if (yeniButon) {
      yeniButon.focus();
      yeniButon.click();
    }
  });
  kok.addEventListener('submit', async (ev) => {
    const form = (ev.target as HTMLElement).closest<HTMLFormElement>('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const fd = new FormData(form);
    // Şifre aynen iletilir; boşluklar da şifrenin parçasıdır.
    const al = (k: string) => {
      const deger = String(fd.get(k) || '');
      return k === 'sifre' || k === 'sifre2' ? deger : deger.trim();
    };
    mesaj(form, '');
    try {
      mesgul(form, true);
      switch (form.dataset.form) {
        case 'giris': {
          const eposta = al('eposta').toLowerCase(); const sifre = al('sifre');
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) throw { code: 'auth/invalid-email' };
          portalTercihleri.setItem('veliEposta', eposta);
          const kb = await auth.signInWithEmailAndPassword(a, eposta, sifre);
          await panoyaGec(kb.user); break;
        }
        case 'bag': {
          const eposta = al('eposta').toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) throw { code: 'auth/invalid-email' };
          await auth.sendSignInLinkToEmail(a, eposta, { url: sayfaAdresi, handleCodeInApp: true });
          portalTercihleri.setItem('veliEposta', eposta);
          mesaj(form, yerlestir(m.bagGonderildi, { eposta }), 'basari'); break;
        }
        case 'bagTamamla': {
          const eposta = al('eposta').toLowerCase();
          await bagIleGir(eposta); break;
        }
        case 'sifreBelirle': {
          const s1 = al('sifre'), s2 = al('sifre2');
          if (s1.length < 8) throw { code: 'auth/weak-password' };
          if (s1 !== s2) { mesaj(form, m.sifreUyusmaz, 'hata'); break; }
          if (!a.currentUser) break;
          await auth.updatePassword(a.currentUser, s1);
          await fs.setDoc(fs.doc(db, 'aileler', (a.currentUser.email || '').toLowerCase()), { sifreVar: true }, { merge: true }).catch(() => {});
          await panoyaGec(a.currentUser, m.sifreDegisti); break;
        }
        case 'sifreDegistir': {
          const s1 = al('sifre');
          if (s1.length < 8) throw { code: 'auth/weak-password' };
          if (!a.currentUser) break;
          try {
            await auth.updatePassword(a.currentUser, s1);
            mesaj(form, m.sifreDegisti, 'basari'); form.reset();
          } catch (e) {
            if ((e as { code?: string })?.code === 'auth/requires-recent-login') {
              await auth.sendPasswordResetEmail(a, a.currentUser.email || '', { url: sayfaAdresi });
              mesaj(form, m.yenidenGiris, 'basari');
            } else throw e;
          }
          break;
        }
        case 'bildir': {
          if (!durum) break;
          const tur = al('tur'); const ref = al('ref'); const metin = al('metin');
          if (!metin) { mesaj(form, m.bildirMetin, 'hata'); break; }
          const ogr = durum.ogrenciler.find((x) => x.ref === ref);
          const ogrenciAd = ogr ? `${ogr.ad} ${ogr.soyad}` : '';
          const tarih = tur === 'mazeret' ? al('tarih') : null;
          if (duzenlenenBildirim) {
            const dbid = duzenlenenBildirim;
            await fs.updateDoc(fs.doc(db, 'bildirimler', dbid), { ref, tur, metin: metin.slice(0, 1000), ogrenciAd, dil, tarih });
            const yer = durum.bildirimler.find((b) => b.id === dbid);
            if (yer) { yer.ref = ref; yer.tur = tur; yer.metin = metin; yer.tarih = tarih || undefined; }
            duzenlenenBildirim = null;
            panoCiz(); bildirimGoster(m.guncellendi); break;
          }
          const kayit: Record<string, unknown> = { ref, tur, metin: metin.slice(0, 1000), eposta: durum.eposta, okundu: false, zaman: fs.serverTimestamp(),
            ogrenciAd, dil };
          if (tur === 'mazeret') kayit.tarih = tarih;
          const yeni = await fs.addDoc(fs.collection(db, 'bildirimler'), kayit);
          durum.bildirimler.push({ id: yeni.id, ref, tur, metin, okundu: false, tarih: tarih || undefined, zaman: new Date().toISOString() });
          panoCiz(); bildirimGoster(m.gonderildi); break;
        }
      }
    } catch (e) {
      mesaj(form, hataMetni(e), 'hata');
    } finally {
      if (form.isConnected) mesgul(form, false);
    }
  });

  const bagIleGir = async (eposta: string) => {
    const kb = await auth.signInWithEmailLink(a, eposta, location.href);
    portalTercihleri.setItem('veliEposta', eposta);
    history.replaceState(null, '', sayfaAdresi);
    const aileSnap = await fs.getDoc(fs.doc(db, 'aileler', eposta)).catch(() => null);
    if (aileSnap && aileSnap.exists() && !(aileSnap.data() as { sifreVar?: boolean }).sifreVar) sifreEkrani(true);
    else await panoyaGec(kb.user);
  };

  /* ---------------------------------------------------------------- başlangıç */
  if (auth.isSignInWithEmailLink(a, location.href)) {
    const kayitli = (portalTercihleri.getItem('veliEposta') || '').toLowerCase();
    if (kayitli) {
      try { await bagIleGir(kayitli); return; } catch (e) { girisEkrani(); mesaj(kok.querySelector('form[data-form=bag]') as HTMLElement, hataMetni(e), 'hata'); return; }
    }
    bagTamamlaEkrani(); return;
  }
  window.addEventListener('pagehide', tumSesleriDurdur);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) tumSesleriDurdur();
  });

  auth.onAuthStateChanged(a, (user) => {
    if (user) { if (!durum) panoyaGec(user); }
    else { durum = null; girisEkrani(); }
  });
}
