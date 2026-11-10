// Haftalık e-postadan çıkış onayı (pages/[dil]/abonelik-cik.astro). Belirteç adresin parçasındadır (#…): sunucuya ve Referer'e gitmez.
// Burada okunur, HEMEN adres çubuğundan silinir ve yalnız bellekte tutulur. Düğmeye basılınca /api/abonelik-cik?k=… adresine POST edilir
// (functions/src/eposta.ts: 200 = kapandı; 400 = geçersiz/süresi dolmuş; başka durum ya da ağ hatası = yeniden denenebilir).
// innerHTML yok, satır içi betik/stil yok (CSP).
interface Metinler { gonderiliyor: string; agHatasi: string; tamamBaslik: string; gecersizBaslik: string }

const kok = document.querySelector<HTMLElement>('[data-veri]')!;
const m = JSON.parse(kok.dataset.veri ?? '{}') as Metinler;
const sor = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const goster = (s: string, ac = true) => { sor(s).hidden = !ac; };

const belirtec = decodeURIComponent(location.hash.slice(1)).trim();
// Belirteç adres çubuğundan ve geçmişten silinir (yer imi/paylaşım sızıntısı yok); sayfa yenilenirse onay yeniden istenmez, açıklama gösterilir.
if (location.hash) history.replaceState(null, '', location.pathname + location.search);

const dugme = sor<HTMLButtonElement>('[data-dugme]');
const durum = sor<HTMLElement>('[data-durum]');

function bitir(tur: 'tamam' | 'gecersiz', baslik: string) {
  sor('[data-baslik]').textContent = baslik;
  goster('[data-lead]', false);
  goster('[data-onay]', false);
  goster(tur === 'tamam' ? '[data-tamam]' : '[data-gecersiz]');
  goster('[data-hesap]');
}

if (!belirtec) {
  goster('[data-lead]', false);
  goster('[data-tokensiz]');
  goster('[data-hesap]');
} else {
  goster('[data-onay]');
  dugme.addEventListener('click', async () => {
    dugme.disabled = true;
    durum.classList.remove('hata');
    durum.textContent = m.gonderiliyor;
    try {
      const r = await fetch(`/api/abonelik-cik?k=${encodeURIComponent(belirtec)}`, { method: 'POST', cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (r.ok) return bitir('tamam', m.tamamBaslik);
      if (r.status >= 400 && r.status < 500) return bitir('gecersiz', m.gecersizBaslik);
      throw new Error(String(r.status));
    } catch {
      durum.classList.add('hata');
      durum.textContent = m.agHatasi;
      dugme.disabled = false;
      dugme.focus();
    }
  });
}

// Modül: üst düzey adlar öbür sayfa betikleriyle ortak kapsama düşmesin.
export {};
