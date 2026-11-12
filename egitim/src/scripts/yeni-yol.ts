/**
 * «Yeni Müslüman yolu» sayfalarının davranışı (11 Kasım 2026): dizin ve adım sayfasındaki durum/ilerleme, hafta sayfasındaki soru denetimi,
 * «Uygulamayı yaptım», «Haftayı tamamladım» ve tıklayınca açılan Diyanet videosu. İçerik ve doğru şıklar sunucuda çizilir; burada yalnız
 * etkileşim var. Saklanan şey yalnız hafta başına dört işarettir (soru 1, soru 2, uygulama, hafta): cevap metni, zaman, ad yoktur
 * (src/lib/ilim-yolu/yeni-yol-ilerleme.ts). Cihaza yazılır, girişliyse yalnız sahibinin okuyabildiği `ozel/yol12` ile eşitlenir.
 * CSP: satır içi betik/stil yok; metinler `data-veri` ile gelir, DOM'a yalnız `textContent` yazılır. YouTube iframe'i yalnız video
 * düğmesine tıklanınca eklenir (youtube-nocookie.com); sayfa açılırken üçüncü tarafa hiçbir istek gitmez.
 */
import { HATASIZ, HAFTALAR, TAMAM, durum, haftaDurumu, haftaMi, tamamlananHafta, type Hafta, type Slot, type YolIlerleme } from '@ortak/lib/ilim-yolu/yeni-yol-ilerleme';
import { doldur } from './kip-ortak';
import { oturumVar, tarayiciDeposu } from '../lib/hesap/isaret';
import { evetHayir } from './hesap-ortak';
import { bulutlaEsitle, yolIsaretle, yolOku, yolSilme, yolTeklifi } from './yeni-yol-ortak';

const sor = <T extends HTMLElement>(kok: ParentNode, s: string): T | null => kok.querySelector<T>(s);
const hepsi = <T extends HTMLElement>(kok: ParentNode, s: string): T[] => [...kok.querySelectorAll<T>(s)];
function veriOku<T>(kok: HTMLElement): T | null {
  try { return JSON.parse(kok.dataset.veri ?? '') as T; } catch { return null; }
}

interface ListeM {
  ilerleme: string; soruSayim: string; tamamlandi: string; baslanmadi: string;
  teklifSor: string; teklifNot: string; teklifEvet: string; teklifSimdilik: string; teklifEklendi: string; teklifBekler: string; teklifErtelendi: string;
  silSor: string; silNotYerel: string; silNotHesap: string; silEvet: string; silVazgec: string; silTamam: string; silTamamBekler: string;
}

/** Bir hafta satırının durum metni: tamam / «n / 2 soru doğru» / başlanmadı. */
function durumMetni(il: YolIlerleme, hafta: Hafta, m: ListeM): string {
  const d = haftaDurumu(il, hafta);
  if (d.tamam) return m.tamamlandi;
  return d.dogru > 0 || d.yapildi ? doldur(m.soruSayim, { n: d.dogru }) : m.baslanmadi;
}

// ——— Dizin ve adım sayfası ———
function listeKur(kok: HTMLElement) {
  const v = veriOku<{ m: ListeM; haftalar?: string[] }>(kok);
  if (!v) return;
  const cizim = () => {
    const il = yolOku();
    const kimlikler = (v.haftalar ?? HAFTALAR).filter(haftaMi);
    for (const satir of hepsi(kok, '[data-hafta]')) {
      const h = satir.dataset.hafta;
      if (!haftaMi(h)) continue;
      satir.dataset.tamam = haftaDurumu(il, h).tamam ? '1' : '0';
      const yazi = sor(satir, '[data-yy-durum]');
      if (yazi) yazi.textContent = durumMetni(il, h, v.m);
    }
    const n = kimlikler.filter((h) => haftaDurumu(il, h).tamam).length;
    const yazi = sor(kok, '[data-yy-ilerleme]');
    if (yazi) yazi.textContent = doldur(v.m.ilerleme, { n: v.haftalar ? n : tamamlananHafta(il), m: kimlikler.length });
    const cubuk = sor<HTMLProgressElement>(kok, '[data-yy-cubuk]');
    if (cubuk) cubuk.value = n;
  };
  cizim();
  void bulutlaEsitle(cizim);
  if (kok.hasAttribute('data-yy-indeks')) hesapKur(kok, v.m, cizim);
}

/**
 * Yalnız dizinde: (1) girişli kullanıcıya, bu cihazdaki işaretler hesapta yoksa, BİR kez «hesabınıza ekleyelim mi?» sorulur (sessiz yükleme yok:
 * ortak cihazda işaretler başkasına ait olabilir); (2) «İşaretlerimi silin» onaydan sonra cihazı ve girişliyse hesabı temizler.
 */
function hesapKur(kok: HTMLElement, m: ListeM, cizim: () => void) {
  const bilgi = sor(kok, '[data-yy-bilgi]');
  const duyur = (metin: string) => { if (bilgi) { bilgi.textContent = metin; bilgi.focus(); } };
  void (async () => {
    const t = await yolTeklifi();
    const panel = sor(kok, '[data-yy-teklif] [data-soru]');
    if (!t || t.tur !== 'sor' || !panel) return;
    const ekle = await evetHayir(panel, { metin: m.teklifSor, not: m.teklifNot, evet: m.teklifEvet, hayir: m.teklifSimdilik, donus: bilgi });
    const s = await t.cevapla(ekle);
    cizim();
    duyur(!ekle ? m.teklifErtelendi : s?.durum === 'tamam' ? m.teklifEklendi : m.teklifBekler);
  })();

  const sil = sor<HTMLButtonElement>(kok, '[data-yy-sil]');
  const silPanel = sor(kok, '[data-yy-sil-panel] [data-soru]');
  sil?.addEventListener('click', () => {
    void (async () => {
      if (!silPanel || !silPanel.hidden) return;
      const girisli = oturumVar(tarayiciDeposu());
      const evet = await evetHayir(silPanel, { metin: m.silSor, not: girisli ? m.silNotHesap : m.silNotYerel, evet: m.silEvet, hayir: m.silVazgec, odak: 'hayir', donus: sil });
      if (!evet) return;
      const r = await yolSilme();
      cizim();
      duyur(r.bulut === 'bekliyor' ? m.silTamamBekler : m.silTamam);
    })();
  });
}

// ——— Hafta sayfası ———
interface HaftaM { dogru: string; yanlis: string; secimYok: string; dogruBulundu: string; tamamlandi: string; yapildi: string; soruSayim: string; baslanmadi: string; durumTamam: string }

function haftaKur(kok: HTMLElement) {
  const v = veriOku<{ hafta: string; m: HaftaM }>(kok);
  if (!v || !haftaMi(v.hafta)) return;
  const hafta: Hafta = v.hafta;
  const m = v.m;
  const yanlisYapilan = new Set<string>();

  const durumSatiri = sor(kok, '[data-yy-durum]');
  const yapDugme = sor<HTMLButtonElement>(kok, '[data-yy-yap]');
  const tamamDugme = sor<HTMLButtonElement>(kok, '[data-yy-tamamla]');
  const tamamNot = sor(kok, '[data-yy-tamam-not]');
  const bitis = sor(document, '[data-yy-bitis]');

  const soruCiz = (li: HTMLElement, il: YolIlerleme) => {
    const slot = (li.dataset.slot ?? 's1') as Slot;
    const bitti = (durum(il, hafta, slot) & TAMAM) !== 0;
    li.dataset.tamam = bitti ? '1' : '0';
    if (!bitti) return;
    const dogru = sor<HTMLInputElement>(li, 'input[data-dogru]');
    for (const r of hepsi<HTMLInputElement>(li, 'input[type="radio"]')) { r.checked = r === dogru; r.disabled = true; }
    for (const e of hepsi(li, '.yl-sik')) e.removeAttribute('data-sonuc');
    dogru?.closest<HTMLElement>('.yl-sik')?.setAttribute('data-sonuc', 'dogru');
    const g = sor(li, '[data-geri]');
    if (g) { g.textContent = m.dogruBulundu; g.dataset.d = 'dogru'; }
    const d = sor<HTMLButtonElement>(li, '[data-yy-denetle]');
    if (d) d.hidden = true;
  };

  const cizim = () => {
    const il = yolOku();
    for (const li of hepsi(kok, '[data-yy-soru]')) soruCiz(li, il);
    const d = haftaDurumu(il, hafta);
    if (durumSatiri) durumSatiri.textContent = d.tamam ? m.tamamlandi : d.dogru > 0 || d.yapildi ? doldur(m.soruSayim, { n: d.dogru }) : m.baslanmadi;
    if (yapDugme) {
      yapDugme.setAttribute('aria-pressed', String(d.yapildi));
      yapDugme.disabled = d.yapildi;
      const y = sor(yapDugme, '[data-yy-yap-yazi]');
      if (y && d.yapildi) y.textContent = m.yapildi;
    }
    if (tamamDugme) {
      tamamDugme.setAttribute('aria-pressed', String(d.tamam));
      tamamDugme.disabled = d.tamam;
      const y = sor(tamamDugme, '[data-yy-tamamla-yazi]');
      if (y && d.tamam) y.textContent = m.tamamlandi;
    }
    if (tamamNot) tamamNot.textContent = d.tamam ? m.tamamlandi : '';
    if (bitis) bitis.hidden = !d.tamam;
  };
  const isle = (slot: Slot, bit: number) => {
    yolIsaretle(hafta, slot, bit);
    cizim();
    void bulutlaEsitle(cizim);
  };

  cizim();
  void bulutlaEsitle(cizim);

  yapDugme?.addEventListener('click', () => isle('yap', TAMAM));
  tamamDugme?.addEventListener('click', () => isle('tamam', TAMAM));

  for (const li of hepsi(kok, '[data-yy-soru]')) {
    const slot = (li.dataset.slot ?? 's1') as Slot;
    const geri = sor(li, '[data-geri]');
    // Yeni seçimde önceki «yanlış» işareti kalkar.
    li.addEventListener('change', () => {
      for (const e of hepsi(li, '.yl-sik')) e.removeAttribute('data-sonuc');
      if (geri) { geri.textContent = ''; geri.removeAttribute('data-d'); }
    });
    sor<HTMLButtonElement>(li, '[data-yy-denetle]')?.addEventListener('click', () => {
      const secili = sor<HTMLInputElement>(li, 'input[type="radio"]:checked');
      if (!secili) { if (geri) { geri.textContent = m.secimYok; geri.removeAttribute('data-d'); } return; }
      const id = li.dataset.yySoru ?? '';
      if (secili.hasAttribute('data-dogru')) {
        // İlk denemede doğru: hatasız biti de gelir; yanlıştan sonra yalnız «tamam».
        isle(slot, yanlisYapilan.has(id) ? TAMAM : TAMAM | HATASIZ);
      } else {
        yanlisYapilan.add(id);
        secili.closest<HTMLElement>('.yl-sik')?.setAttribute('data-sonuc', 'yanlis');
        secili.checked = false;
        if (geri) { geri.textContent = m.yanlis; geri.dataset.d = 'yanlis'; }
      }
    });
  }

  // ——— Video: tıklayana kadar üçüncü tarafa istek yok ———
  for (const dugme of hepsi<HTMLButtonElement>(kok, '[data-yy-video]')) {
    dugme.addEventListener('click', () => {
      const id = dugme.dataset.yyVideo ?? '';
      if (!/^[\w-]{11}$/.test(id)) return;
      const cerceve = document.createElement('iframe');
      cerceve.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`;
      cerceve.title = dugme.dataset.baslik ?? '';
      if (dugme.dataset.yyVideoDil) cerceve.lang = dugme.dataset.yyVideoDil; // İngilizce yedek video (fr, nl, de sayfaları)
      cerceve.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      cerceve.allow = 'encrypted-media; picture-in-picture; fullscreen';
      cerceve.allowFullscreen = true;
      cerceve.referrerPolicy = 'strict-origin-when-cross-origin';
      dugme.replaceWith(cerceve);
      cerceve.focus();
    });
  }
}

const liste = sor(document, '[data-yy-indeks],[data-yy-adim]');
if (liste) listeKur(liste);
const hafta = sor(document, '[data-yy-hafta]');
if (hafta) haftaKur(hafta);
