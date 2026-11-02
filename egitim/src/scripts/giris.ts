/**
 * Giriş sayfası (2 Kasım 2026): E-posta + şifre, Google, kurs öğrencisi (kullanıcı adı + kısa şifre). Firebase sayfa açılınca yüklenir (hesap sayfası),
 * böylece Google açılır penceresi tıklamadan hemen sonra açılabilir. Giriş başarılıysa `giristeEsitle`: cihazdaki anonim çalışma varsa «hesabına eklensin
 * mi?» sorulur. Google yönlendirmesiyle dönüldüğünde sonuç açılışta işlenir. Hiçbir e-posta/şifre/kod depoya ya da konsola yazılmaz.
 */
import { cocukGir } from '../lib/hesap/kart-giris';
import { girisYap, googleIleGir, oturumHazir, sifreSifirla, yonlendirmeSonucu } from '../lib/hesap/oturum';
import { authMetni, cocukMetni, durumYaz, girisSonrasi, girisSonrasiYol, sayfaFirebase, sekmeler, sifreGoster, sor, veriOku } from './hesap-ortak';

const v = veriOku();
const durum = sor<HTMLElement>('[data-durum]');
const hata = sor<HTMLElement>('[data-hata]');
const soru = sor<HTMLElement>('[data-soru]');
const eposta = sor<HTMLInputElement>('#g-eposta');
const sifre = sor<HTMLInputElement>('#g-sifre');
const sozu = sayfaFirebase();
sozu.catch(() => undefined);
let mesgul = false;

const yontemler = ['eposta', 'google', 'kurs'];
sekmeler(sor<HTMLElement>('[data-sekmeler]'), Math.max(0, yontemler.indexOf(new URLSearchParams(location.search).get('yontem') ?? '')));
for (const dugme of document.querySelectorAll<HTMLButtonElement>('[data-sifre-goster]')) {
  const girdi = dugme.closest('.iy-sifre-kutu')?.querySelector<HTMLInputElement>('input');
  if (girdi) sifreGoster(dugme, girdi, v);
}
// Sekme değişince eski ileti kalmasın.
for (const t of document.querySelectorAll('[role="tab"]')) t.addEventListener('click', () => { durumYaz(durum, ''); durumYaz(hata, ''); });

function mesgulYap(acik: boolean) {
  mesgul = acik;
  for (const d of document.querySelectorAll<HTMLButtonElement>('form button[type="submit"], [data-google], [data-sifirla]')) d.disabled = acik;
  document.querySelector('.iy-kart')?.setAttribute('aria-busy', String(acik));
}

async function firebase() {
  try {
    return await sozu;
  } catch {
    durumYaz(hata, v.m.ag, 'hata');
    return null;
  }
}

/** Giriş tamam: eşitle (gerekirse sor), sonra uygun sayfaya git. */
async function bitir(cocuk: boolean) {
  const f = await firebase();
  if (!f) return;
  durumYaz(hata, '');
  durumYaz(durum, v.m.gGirisTamam, 'iyi');
  await girisSonrasi(f, v, soru).catch(() => undefined);
  location.assign(await girisSonrasiYol(f, v, cocuk));
}

sor<HTMLFormElement>('[data-form="eposta"]').addEventListener('submit', (e) => {
  e.preventDefault();
  void (async () => {
    if (mesgul) return;
    durumYaz(hata, '');
    durumYaz(durum, '');
    if (!eposta.value.trim()) { durumYaz(hata, v.m.gEpostaGerek, 'hata'); eposta.focus(); return; }
    if (!sifre.value) { durumYaz(hata, authMetni(v, 'giris-yanlis'), 'hata'); sifre.focus(); return; }
    mesgulYap(true);
    const f = await firebase();
    const r = f ? await girisYap(f, { eposta: eposta.value, sifre: sifre.value }) : null;
    mesgulYap(false);
    if (!r) return;
    if (!r.ok) { durumYaz(hata, authMetni(v, r.neden), 'hata'); return; }
    mesgulYap(true);
    await bitir(r.kullanici.rol === 'cocuk');
  })();
});

sor<HTMLButtonElement>('[data-sifirla]').addEventListener('click', () => {
  void (async () => {
    if (mesgul) return;
    durumYaz(hata, '');
    durumYaz(durum, '');
    if (!eposta.value.trim()) { durumYaz(hata, v.m.gEpostaGerek, 'hata'); eposta.focus(); return; }
    mesgulYap(true);
    const f = await firebase();
    const r = f ? await sifreSifirla(f, { eposta: eposta.value, dil: v.dil }) : null;
    mesgulYap(false);
    if (!r) return;
    if (r.ok) durumYaz(durum, v.m.gSifirlaGitti, 'iyi');
    else durumYaz(hata, authMetni(v, r.neden), 'hata');
  })();
});

sor<HTMLButtonElement>('[data-google]').addEventListener('click', () => {
  void (async () => {
    if (mesgul) return;
    durumYaz(hata, '');
    durumYaz(durum, '');
    mesgulYap(true);
    const f = await firebase();
    const r = f ? await googleIleGir(f, { dil: v.dil }) : null;
    if (!r) { mesgulYap(false); return; }
    if (!r.ok) { mesgulYap(false); durumYaz(hata, authMetni(v, r.neden), 'hata'); return; }
    if ('yonlendirme' in r) { durumYaz(durum, v.m.gYonleniyor, 'iyi'); return; }
    await bitir(r.kullanici.rol === 'cocuk');
  })();
});

sor<HTMLFormElement>('[data-form="kurs"]').addEventListener('submit', (e) => {
  e.preventDefault();
  void (async () => {
    if (mesgul) return;
    durumYaz(hata, '');
    durumYaz(durum, '');
    const ad = sor<HTMLInputElement>('#g-kad');
    const ks = sor<HTMLInputElement>('#g-kursifre');
    if (!ad.value.trim() || !ks.value.trim()) { durumYaz(hata, v.m.cocukHata.gecersiz, 'hata'); (ad.value.trim() ? ks : ad).focus(); return; }
    mesgulYap(true);
    const f = await firebase();
    const r = f ? await cocukGir(f, { kullaniciAdi: ad.value, sifre: ks.value }) : null;
    if (!r) { mesgulYap(false); return; }
    if (!r.ok) { mesgulYap(false); durumYaz(hata, cocukMetni(v, r), 'hata'); return; }
    await bitir(true);
  })();
});

// Açılış: Google yönlendirmesinden dönüş ya da zaten açık oturum.
void (async () => {
  const f = await firebase();
  if (!f) return;
  const geri = await yonlendirmeSonucu(f).catch(() => null);
  if (geri) {
    if (!geri.ok) { durumYaz(hata, authMetni(v, geri.neden), 'hata'); return; }
    mesgulYap(true);
    await bitir(geri.kullanici.rol === 'cocuk');
    return;
  }
  const k = await oturumHazir(f).catch(() => null);
  if (k) location.replace(await girisSonrasiYol(f, v, k.rol === 'cocuk'));
})();
