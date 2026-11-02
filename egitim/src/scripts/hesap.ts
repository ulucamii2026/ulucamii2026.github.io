/**
 * Hesabım (2 Kasım 2026): profil bölümleri. Oturum yoksa «giriş yap» bağlantısı; kullanıcı adı yoksa ZORUNLU ad adımı (çocuk hesabı hariç: adı hocası verir).
 *
 *  - Şehir + cami: katalogdan (`cami` = katalog kimliği, `sehir` = şehir) ya da «Diğer» (yalnız şehir, ≤ 60 karakter); boş bırakmak ikisini siler.
 *  - «Yeni Müslümanım»: AYRI açık rıza kutusu. İşaret ve rıza kutusu birlikte işaretlenip «Kaydet»e basılınca yazılır (`metinSurum`); kutulardan biri
 *    kaldırılınca kayıt HEMEN silinir (rıza geri alma). Yaş sorusu yok.
 *  - Haftalık e-posta: `tercihler {haftalik, gun, saat}` (varsayılan Pazar 18). Kurs bağlama kodu: `hesabiBagla`. Silme: 30 gün bekleme, geri alınabilir.
 *  - Çıkış: önce eşitlenir; olmazsa sorulur ve `zorla` ile yeniden denenir.
 * Çocuk hesabı yalnız adını, hocasının notunu ve çıkışı görür. Hiçbir ileti e-posta, şifre ya da kod içermez.
 */
import { kalipDoldur } from '../i18n/sablon';
import type { IlimFirebase } from '../lib/firebase-istemci';
import { cikisYap, dogrulamaGonder, oturumHazir, type Kullanici } from '../lib/hesap/oturum';
import {
  hesabimiSil, hesabiBagla, hesapSilmeIptal, muhtediGeriAl, muhtediIsaretle, muhtediOku, profilGetir, profilYaz, type Profil,
} from '../lib/hesap/profil';
import { adAdimi, cagriMetni, durumYaz, evetHayir, sayfaFirebase, sor, tarihYaz, veriOku } from './hesap-ortak';
import { acilisEsitlemesi, adiGoster } from './oturum-ortak';

const v = veriOku();
const bolum = (ad: string) => sor<HTMLElement>(`[data-bolum="${ad}"]`);
const goster = (e: Element, acik: boolean) => { (e as HTMLElement).hidden = !acik; };

async function baslat() {
  const yukleniyor = sor<HTMLElement>('[data-yukleniyor]');
  let f: IlimFirebase;
  let k: Kullanici | null;
  let p: Profil | null;
  try {
    f = await sayfaFirebase();
    k = await oturumHazir(f);
    p = k ? await profilGetir(f) : null;
  } catch {
    goster(yukleniyor, false);
    goster(sor('[data-yuklenemedi]'), true);
    return;
  }
  goster(yukleniyor, false);
  if (!k) { goster(sor('[data-oturumsuz]'), true); return; }
  void acilisEsitlemesi();
  goster(sor('[data-hesap]'), true);

  const cocuk = k.rol === 'cocuk';
  let kuruldu = false;
  let profil: Profil = p ?? { ad: '', dil: '', tur: '', ref: '', sehir: '', cami: '', tercihler: {}, silinecek: '' };

  // ——— Kullanıcı adı ———
  const adYaz = sor<HTMLElement>('[data-ad-yaz]');
  const adKaydedildi = (ad: string) => {
    profil = { ...profil, ad };
    adiGoster(ad);
    adYaz.textContent = `@${ad}`;
    goster(bolum('ad-zorunlu'), false);
    goster(bolum('kimlik'), true);
    goster(sor('[data-ad-kutu]'), false);
    sor<HTMLElement>('[data-ad-degistir]').setAttribute('aria-expanded', 'false');
    tamamBolumleri();
  };
  const zorunlu = bolum('ad-zorunlu');
  adAdimi(sor<HTMLElement>('[data-ad-form]', zorunlu), f, v, adKaydedildi);
  const kutu = sor<HTMLElement>('[data-ad-kutu]');
  const degistir = adAdimi(sor<HTMLElement>('[data-ad-form]', kutu), f, v, (ad) => {
    adKaydedildi(ad);
    const d = sor<HTMLElement>('[data-ad-degistir]');
    d.focus();
  });
  const degistirDugme = sor<HTMLButtonElement>('[data-ad-degistir]');
  degistirDugme.addEventListener('click', () => {
    const acik = kutu.hidden !== false;
    goster(kutu, acik);
    degistirDugme.setAttribute('aria-expanded', String(acik));
    if (acik) degistir.odakla();
  });

  if (!profil.ad && !cocuk) {
    goster(zorunlu, true);
    goster(bolum('kimlik'), false);
    sor<HTMLElement>('h2', zorunlu).focus();
  } else {
    adYaz.textContent = profil.ad ? `@${profil.ad}` : '';
    if (profil.ad) adiGoster(profil.ad);
    goster(bolum('kimlik'), true);
    tamamBolumleri();
  }

  // Ad adımı bitince (ya da zaten adı olan hesapta) kalan bölümler açılır.
  function tamamBolumleri() {
    goster(bolum('oturum'), true);
    goster(sor('[data-ad-degistir-blok]'), !cocuk);
    goster(sor('[data-cocuk-not]'), cocuk);
    if (cocuk) return;
    epostaBolumu();
    for (const ad of ['yer', 'muhtedi', 'haftalik', 'kurs', 'sil']) goster(bolum(ad), true);
    if (!kuruldu) { kuruldu = true; yerBolumu(); muhtediBolumu(); haftalikBolumu(); kursBolumu(); silBolumu(); }
  }

  // ——— E-posta ———
  function epostaBolumu() {
    if (!k?.eposta) return;
    goster(sor('[data-eposta-satiri]'), true);
    sor('[data-eposta]').textContent = k.eposta;
    sor('[data-eposta-durum]').textContent = k.dogrulanmis ? v.m.pDogrulandi : v.m.pDogrulanmadi;
    const yeniden = sor<HTMLButtonElement>('[data-dogrulama-yeniden]');
    goster(yeniden, !k.dogrulanmis && k.saglayicilar.includes('password'));
    const durum = sor('[data-dogrulama-durum]');
    yeniden.onclick = () => {
      yeniden.disabled = true;
      void dogrulamaGonder(f, { dil: v.dil, donus: `${location.origin}/${v.dil}/hesap/` }).then((r) => {
        yeniden.disabled = false;
        durumYaz(durum, r.ok ? v.m.pDogrulamaGitti : cagriMetni(v, { ok: false, neden: r.neden }, v.m.authHata), r.ok ? 'iyi' : 'hata');
      });
    };
  }

  // ——— Şehir ve cami ———
  function yerBolumu() {
    const secim = sor<HTMLSelectElement>('#p-yer');
    const sehir = sor<HTMLInputElement>('#p-yer-sehir');
    const sehirAlan = sor<HTMLElement>('[data-yer-sehir-alan]');
    const durum = sor('[data-yer-durum]');
    const katalogda = [...secim.options].some((o) => o.value && o.value === profil.cami);
    if (katalogda) secim.value = profil.cami;
    else if (profil.sehir || profil.cami) { secim.value = '__diger'; sehir.value = profil.sehir || profil.cami; }
    const guncelle = () => goster(sehirAlan, secim.value === '__diger');
    guncelle();
    secim.addEventListener('change', () => { guncelle(); durumYaz(durum, ''); if (secim.value === '__diger') sehir.focus(); });
    sor<HTMLFormElement>('[data-form="yer"]').addEventListener('submit', (e) => {
      e.preventDefault();
      void (async () => {
        durumYaz(durum, '');
        let sehirMetni = '';
        let cami = '';
        if (secim.value === '__diger') {
          sehirMetni = sehir.value.trim();
          if ([...sehirMetni].length > 60) { durumYaz(durum, v.m.pYerHata, 'hata'); sehir.focus(); return; }
        } else if (secim.value) {
          cami = secim.value;
          sehirMetni = secim.selectedOptions[0]?.dataset.sehir ?? '';
        }
        const r = await profilYaz(f, { sehir: sehirMetni || null, cami: cami || null });
        durumYaz(durum, r.ok ? v.m.pYerKaydedildi : cagriMetni(v, r, {}), r.ok ? 'iyi' : 'hata');
      })();
    });
  }

  // ——— Yeni Müslümanım (ayrı açık rıza) ———
  function muhtediBolumu() {
    const kutuMuhtedi = sor<HTMLInputElement>('[data-muhtedi]');
    const kutuRiza = sor<HTMLInputElement>('[data-riza-kutu]');
    const riza = sor<HTMLElement>('[data-riza]');
    const kaydet = sor<HTMLButtonElement>('[data-muhtedi-kaydet]');
    const durum = sor('[data-muhtedi-durum]');
    let kayitli = false;
    const gorunum = () => {
      goster(riza, kutuMuhtedi.checked);
      goster(kaydet, !kayitli && kutuMuhtedi.checked);
    };
    void muhtediOku(f).then((x) => {
      kayitli = x === true;
      kutuMuhtedi.checked = kayitli;
      kutuRiza.checked = kayitli;
      gorunum();
    });
    // Kutulardan biri kaldırılırsa rıza geri alınmış sayılır: kayıtlıysa HEMEN silinir.
    const geriAl = async () => {
      kutuMuhtedi.checked = false;
      kutuRiza.checked = false;
      if (kayitli) {
        const r = await muhtediGeriAl(f);
        if (r.ok) { kayitli = false; durumYaz(durum, v.m.pRizaGeriAlindi, 'iyi'); } else { kayitli = true; kutuMuhtedi.checked = true; kutuRiza.checked = true; durumYaz(durum, cagriMetni(v, r, {}), 'hata'); }
      } else durumYaz(durum, '');
      gorunum();
    };
    kutuMuhtedi.addEventListener('change', () => {
      if (!kutuMuhtedi.checked) { void geriAl(); return; }
      durumYaz(durum, '');
      gorunum();
    });
    kutuRiza.addEventListener('change', () => {
      if (!kutuRiza.checked && kayitli) { void geriAl(); return; }
      durumYaz(durum, '');
    });
    kaydet.addEventListener('click', () => {
      void (async () => {
        if (!kutuRiza.checked) { durumYaz(durum, v.m.pRizaGerek, 'hata'); kutuRiza.focus(); return; }
        const r = await muhtediIsaretle(f, v.ek?.rizaSurumu ?? '');
        if (r.ok) { kayitli = true; durumYaz(durum, v.m.pRizaKaydedildi, 'iyi'); gorunum(); } else durumYaz(durum, cagriMetni(v, r, {}), 'hata');
      })();
    });
    gorunum();
  }

  // ——— Haftalık e-posta ———
  function haftalikBolumu() {
    const anahtar = sor<HTMLInputElement>('[data-haftalik]');
    const gunler = sor<HTMLElement>('[data-gunler]');
    const durum = sor('[data-haftalik-durum]');
    const radyolar = [...document.querySelectorAll<HTMLInputElement>('input[name="haftalik-gun"]')];
    const t = profil.tercihler;
    anahtar.checked = t.haftalik === true;
    const gun = Number.isInteger(t.gun) ? t.gun : 0;
    for (const r of radyolar) r.checked = Number(r.value) === gun;
    const guncelle = () => goster(gunler, anahtar.checked);
    guncelle();
    anahtar.addEventListener('change', () => { guncelle(); durumYaz(durum, ''); });
    sor<HTMLFormElement>('[data-form="haftalik"]').addEventListener('submit', (e) => {
      e.preventDefault();
      void (async () => {
        const secili = Number(radyolar.find((r) => r.checked)?.value ?? 0);
        const r = await profilYaz(f, { tercihler: { haftalik: anahtar.checked, gun: secili, saat: t.saat ?? 18 } });
        durumYaz(durum, r.ok ? v.m.pHaftalikKaydedildi : cagriMetni(v, r, {}), r.ok ? 'iyi' : 'hata');
      })();
    });
  }

  // ——— Kurs bağlama kodu ———
  function kursBolumu() {
    const kod = sor<HTMLInputElement>('[data-kod]');
    const durum = sor('[data-kod-durum]');
    const bagli = (b: boolean) => { goster(sor('[data-kurs-bagli]'), b); goster(sor('[data-kod-kutu]'), !b); };
    bagli(Boolean(profil.ref || k?.ref));
    // XXXX-XXXX: büyük harf, yalnız harf/rakam, dördüncü karakterden sonra tire.
    kod.addEventListener('input', () => {
      const t = kod.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 8);
      kod.value = t.length > 4 ? `${t.slice(0, 4)}-${t.slice(4)}` : t;
    });
    const tablo: Record<string, string> = {
      'baska-kayit': v.m.pKodHata.baskaKayit,
      'eposta-dogrulanmamis': v.m.pKodHata.epostaDogrulanmamis,
      'yetki-yok': v.m.pKodHata.yetki,
    };
    sor<HTMLFormElement>('[data-form="kod"]').addEventListener('submit', (e) => {
      e.preventDefault();
      void (async () => {
        durumYaz(durum, '');
        const r = await hesabiBagla(f, kod.value);
        if (r.ok) { bagli(true); durumYaz(durum, v.m.pKodTamam, 'iyi'); return; }
        const alt: Record<string, string> = { bicim: v.m.pKodHata.bicim, yok: v.m.pKodHata.yok, kullanildi: v.m.pKodHata.kullanildi, 'suresi-doldu': v.m.pKodHata.sureDoldu, kapali: v.m.pKodHata.kapali };
        durumYaz(durum, r.neden === 'gecersiz-kod' ? (alt[r.alt ?? ''] ?? v.m.pKodHata.yok) : cagriMetni(v, r, tablo), 'hata');
        kod.focus();
      })();
    });
  }

  // ——— Hesap silme ———
  function silBolumu() {
    const bekliyor = sor('[data-sil-bekliyor]');
    const iptal = sor<HTMLButtonElement>('[data-sil-iptal]');
    const dugme = sor<HTMLButtonElement>('[data-sil-dugme]');
    const onay = sor<HTMLElement>('[data-sil-onay]');
    const gorunum = (silinecek: string) => {
      goster(iptal, Boolean(silinecek));
      goster(dugme, !silinecek);
      if (silinecek) durumYaz(bekliyor, kalipDoldur(v.m.pSilBekliyor, tarihYaz(v, silinecek)));
    };
    gorunum(profil.silinecek);
    dugme.addEventListener('click', () => {
      goster(onay, true);
      dugme.setAttribute('aria-expanded', 'true');
      sor<HTMLButtonElement>('[data-sil-vazgec]').focus();
    });
    sor('[data-sil-vazgec]').addEventListener('click', () => {
      goster(onay, false);
      dugme.setAttribute('aria-expanded', 'false');
      dugme.focus();
    });
    sor<HTMLButtonElement>('[data-sil-evet]').addEventListener('click', () => {
      void (async () => {
        const r = await hesabimiSil(f);
        goster(onay, false);
        if (r.ok) {
          profil = { ...profil, silinecek: r.silinecek };
          gorunum(r.silinecek);
          durumYaz(bekliyor, kalipDoldur(v.m.pSilIstegi, tarihYaz(v, r.silinecek)), 'iyi');
          iptal.focus();
        } else durumYaz(bekliyor, cagriMetni(v, r, {}), 'hata');
      })();
    });
    iptal.addEventListener('click', () => {
      void (async () => {
        const r = await hesapSilmeIptal(f);
        if (r.ok) {
          profil = { ...profil, silinecek: '' };
          gorunum('');
          durumYaz(bekliyor, v.m.pSilIptalTamam, 'iyi');
        } else durumYaz(bekliyor, cagriMetni(v, r, {}), 'hata');
      })();
    });
  }

  // ——— Çıkış ———
  sor<HTMLButtonElement>('[data-cikis]').addEventListener('click', () => {
    void (async () => {
      let r = await cikisYap(f);
      if (!r.ok) {
        const yine = await evetHayir(sor<HTMLElement>('[data-soru]'), { metin: v.m.pCikisEsitlenmedi, evet: v.m.pCikisYine, hayir: v.m.vazgec });
        if (!yine) return;
        r = await cikisYap(f, { zorla: true });
      }
      if (r.ok) location.assign(`/${v.dil}/`);
    })();
  });
}

void baslat();
