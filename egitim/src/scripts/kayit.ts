/**
 * Hesap aç (2 Kasım 2026): 1) e-posta + şifre ya da Google, 2) ZORUNLU kullanıcı adı, 3) hazır. Hesap açılınca `giristeEsitle`: bu cihazdaki anonim
 * çalışma varsa «hesabına eklensin mi?» sorulur. Kullanıcı adı alınmadan hesap «yarım» sayılır: hesap sayfası da ad adımını zorunlu gösterir.
 * Yaş sorusu, «13 yaşından büyüğüm» kutusu ve rıza kutusu burada YOK (rıza yalnız «Yeni Müslümanım» için, hesap sayfasında).
 */
import { kalipDoldur } from '../i18n/sablon';
import type { IlimFirebase } from '../lib/firebase-istemci';
import { googleIleGir, kayitOl, oturumHazir, yonlendirmeSonucu } from '../lib/hesap/oturum';
import { profilGetir } from '../lib/hesap/profil';
import { adAdimi, authMetni, durumYaz, girisSonrasi, sayfaFirebase, sifreGoster, sor, veriOku } from './hesap-ortak';

const v = veriOku();
const durum = sor<HTMLElement>('[data-durum]');
const hata = sor<HTMLElement>('[data-hata]');
const soru = sor<HTMLElement>('[data-soru]');
const dogrulama = sor<HTMLElement>('[data-dogrulama]');
const adimlar = [...document.querySelectorAll<HTMLElement>('[data-adim]')];
const basamaklar = [...document.querySelectorAll<HTMLElement>('[data-adimlar] li')];
const sozu = sayfaFirebase();
sozu.catch(() => undefined);
let mesgul = false;

for (const dugme of document.querySelectorAll<HTMLButtonElement>('[data-sifre-goster]')) {
  const girdi = dugme.closest('.iy-sifre-kutu')?.querySelector<HTMLInputElement>('input');
  if (girdi) sifreGoster(dugme, girdi, v);
}

function mesgulYap(acik: boolean) {
  mesgul = acik;
  for (const d of document.querySelectorAll<HTMLButtonElement>('[data-adim="1"] button[type="submit"], [data-google]')) d.disabled = acik;
  document.querySelector('.iy-form-yigin')?.setAttribute('aria-busy', String(acik));
}

function adimGit(n: 1 | 2 | 3) {
  adimlar.forEach((a, i) => { a.hidden = i + 1 !== n; });
  basamaklar.forEach((b, i) => {
    if (i + 1 === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    b.toggleAttribute('data-bitti', i + 1 < n);
  });
  sor<HTMLElement>('h2', adimlar[n - 1]).focus();
}

async function firebase() {
  try {
    return await sozu;
  } catch {
    durumYaz(hata, v.m.ag, 'hata');
    return null;
  }
}

/** Hesap kurulduktan sonra: eşitleme sorusu, sonra kullanıcı adı adımı (adı varsa «hazır»). */
async function devam(f: IlimFirebase, dogrulamaGitti?: boolean) {
  durumYaz(hata, '');
  durumYaz(durum, '');
  await girisSonrasi(f, v, soru).catch(() => undefined);
  if (dogrulamaGitti !== undefined) durumYaz(dogrulama, dogrulamaGitti ? v.m.kDogrulamaGitti : v.m.kDogrulamaGitmedi, dogrulamaGitti ? 'iyi' : 'hata');
  const p = await profilGetir(f).catch(() => null);
  if (p?.ad) hazir(p.ad); else adimGit(2);
}

function hazir(ad: string) {
  sor<HTMLElement>('[data-hazir]').textContent = kalipDoldur(v.m.kHazirMetin, ad);
  adimGit(3);
}

// Firebase gelene kadar form tarayıcıya gönderilmesin (adAdimi kendi dinleyicisini yükleyince asıl işi yapar).
sor<HTMLFormElement>('[data-ad-form]').addEventListener('submit', (e) => e.preventDefault());
void sozu.then((f) => {
  adAdimi(sor<HTMLElement>('[data-ad-form]'), f, v, hazir);
}).catch(() => undefined);

sor<HTMLFormElement>('[data-form="kayit"]').addEventListener('submit', (e) => {
  e.preventDefault();
  void (async () => {
    if (mesgul) return;
    durumYaz(hata, '');
    const eposta = sor<HTMLInputElement>('#k-eposta');
    const sifre = sor<HTMLInputElement>('#k-sifre');
    if (!eposta.value.trim()) { durumYaz(hata, authMetni(v, 'eposta-gecersiz'), 'hata'); eposta.focus(); return; }
    if (sifre.value.length < 8) { durumYaz(hata, authMetni(v, 'sifre-zayif'), 'hata'); sifre.focus(); return; }
    mesgulYap(true);
    const f = await firebase();
    const r = f ? await kayitOl(f, { eposta: eposta.value, sifre: sifre.value, dil: v.dil, donus: `${location.origin}/${v.dil}/hesap/` }) : null;
    if (!f || !r) { mesgulYap(false); return; }
    if (!r.ok) { mesgulYap(false); durumYaz(hata, authMetni(v, r.neden), 'hata'); return; }
    await devam(f, r.dogrulamaGitti);
    mesgulYap(false);
  })();
});

sor<HTMLButtonElement>('[data-google]').addEventListener('click', () => {
  void (async () => {
    if (mesgul) return;
    durumYaz(hata, '');
    mesgulYap(true);
    const f = await firebase();
    const r = f ? await googleIleGir(f, { dil: v.dil }) : null;
    if (!f || !r) { mesgulYap(false); return; }
    if (!r.ok) { mesgulYap(false); durumYaz(hata, authMetni(v, r.neden), 'hata'); return; }
    if ('yonlendirme' in r) { durumYaz(durum, v.m.gYonleniyor, 'iyi'); return; }
    await devam(f);
    mesgulYap(false);
  })();
});

// Açılış: Google yönlendirmesinden dönüş ya da hesap açık ama kullanıcı adı alınmamış (yarım kalan kayıt).
void (async () => {
  const f = await firebase();
  if (!f) return;
  const geri = await yonlendirmeSonucu(f).catch(() => null);
  if (geri) {
    if (!geri.ok) { durumYaz(hata, authMetni(v, geri.neden), 'hata'); return; }
    mesgulYap(true);
    await devam(f);
    mesgulYap(false);
    return;
  }
  const k = await oturumHazir(f).catch(() => null);
  if (!k) return;
  const p = await profilGetir(f).catch(() => null);
  if (p?.ad) location.replace(`/${v.dil}/hesap/`); else adimGit(2);
})();
