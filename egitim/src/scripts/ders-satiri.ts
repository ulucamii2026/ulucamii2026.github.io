/**
 * Çalışma sayfasındaki «Derste:» satırı (25 Ekim 2026): bu ezberin ders takviminde bugünden (Brüksel günü) sonraki ilk günü ve o günkü grupları.
 * Sayfa, ezberin takvimdeki bütün günlerini `data-veri` ile taşır (satır yoksa ezber takvimde hiç geçmiyordur); hangisinin «sıradaki» olduğu tarayıcıda
 * bugüne göre seçilir. Geçmiş günler kalmışsa satır gizli kalır. Hiçbir şey yazılmaz, ağa çıkılmaz.
 */
import { brukselGunu, gunYaz, sonrakiGun } from '@ortak/lib/ezber/ders-takvimi';

interface Veri { yerel: string; yol: string; t: [string, ...string[]][]; k: Record<string, string> }

const satir = document.querySelector<HTMLElement>('[data-ders-satiri]');
if (satir) {
  try {
    const v = JSON.parse(satir.dataset.veri ?? '') as Veri;
    const sira = sonrakiGun(v.t.map(([tarih, ...gruplar]) => ({ tarih, gruplar: gruplar as never })), brukselGunu());
    const a = satir.querySelector<HTMLAnchorElement>('[data-ders-tarih]');
    const g = satir.querySelector<HTMLElement>('[data-ders-gruplar]');
    if (sira && a && g) {
      a.textContent = gunYaz(sira.tarih, v.yerel);
      a.href = `${v.yol}#g-${sira.tarih}`;
      g.textContent = `(${sira.gruplar.map((k) => v.k[k] ?? k).join(' / ')})`;
      satir.hidden = false;
    }
  } catch {
    /* veri okunamadı: satır gizli kalır */
  }
}
