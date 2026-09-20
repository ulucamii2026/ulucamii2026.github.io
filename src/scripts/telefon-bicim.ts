/** Telefon alanı: yalnız rakam (ve baştaki +) kabul eder, yazarken okunur biçime sokar.
 *  Belçika cep: «+32 470 12 34 56». Gövdeye giden değer `telefonNormalle` ile yine boşluksuzdur;
 *  bu modül yalnız ekrandaki görünüşü kurar. Saf işlevler DOM'a dokunmaz (Node'da sınanır). */

/** Ülke kodu → kod sonrası rakamların öbek uzunlukları (ilk uyan kalıp). Bilinmeyen kodda üçerli öbek. */
const BE_CEP = /^4[5-9]?/;   // 045x–049x cep; 04 2xx / 04 3xx Liège sabit hattıdır
const KALIPLAR: Record<string, { uzunluk(ulusal: string): number; obekler(ulusal: string): number[] }> = {
  '32': {
    uzunluk: u => (BE_CEP.test(u) && !/^4[0-4]/.test(u) ? 9 : 8),
    obekler: u => (BE_CEP.test(u) && !/^4[0-4]/.test(u) ? [3, 2, 2, 2] : /^[2349]/.test(u) ? [1, 3, 2, 2] : [2, 2, 2, 2]),
  },
  '33': { uzunluk: () => 9, obekler: () => [1, 2, 2, 2, 2] },
  '31': { uzunluk: () => 9, obekler: u => (u.startsWith('6') ? [1, 2, 2, 2, 2] : [2, 3, 2, 2]) },
  '352': { uzunluk: () => 9, obekler: () => [3, 3, 3] },
  '49': { uzunluk: () => 11, obekler: () => [3, 4, 4] },
  '44': { uzunluk: () => 10, obekler: () => [4, 3, 3] },
  '90': { uzunluk: () => 10, obekler: () => [3, 3, 2, 2] },
  '212': { uzunluk: () => 9, obekler: () => [3, 2, 2, 2] },
};
const KODLAR = Object.keys(KALIPLAR).sort((a, b) => b.length - a.length);

/** Ham girdiden uluslararası rakam dizisi (başında + olmadan). Yerel Belçika yazımı +32'ye çevrilir. */
export function telefonRakamlari(ham: string): string {
  const arti = ham.trim().startsWith('+');
  let r = ham.replace(/\D/g, '');
  if (!r) return '';
  if (!arti) {
    if (r.startsWith('00')) r = r.slice(2);
    else if (r.startsWith('0')) r = '32' + r.slice(1);
    else if (!r.startsWith('32')) r = '32' + r;
  }
  // «+32 0470…» yazımı: ülke kodundan sonraki ana hat sıfırı düşer.
  const kod = KODLAR.find(k => r.startsWith(k));
  if (kod && r[kod.length] === '0') r = kod + r.slice(kod.length + 1);
  const azami = kod ? kod.length + KALIPLAR[kod].uzunluk(r.slice(kod.length)) : 15;
  return r.slice(0, azami);
}

/** Ekranda gösterilecek biçim. Boş girdi boş kalır; yalnız «+» yazılmışsa «+» korunur. */
export function telefonBicimle(ham: string): string {
  const r = telefonRakamlari(ham);
  if (!r) return ham.trim().startsWith('+') ? '+' : '';
  const kod = KODLAR.find(k => r.startsWith(k));
  if (!kod) return '+' + (r.match(/\d{1,3}/g) ?? []).join(' ');
  const ulusal = r.slice(kod.length);
  const parcalar: string[] = [];
  let i = 0;
  for (const n of KALIPLAR[kod].obekler(ulusal)) {
    if (i >= ulusal.length) break;
    parcalar.push(ulusal.slice(i, i + n));
    i += n;
  }
  if (i < ulusal.length) parcalar.push(ulusal.slice(i));
  return ['+' + kod, ...parcalar].join(' ');
}

/** Biçimlenmiş metinde, soldan `n` rakamın hemen ardındaki imleç konumu. */
function imlecYeri(metin: string, n: number): number {
  if (n <= 0) return metin.startsWith('+') ? 1 : 0;
  let say = 0;
  for (let i = 0; i < metin.length; i++) {
    if (/\d/.test(metin[i]) && ++say === n) return i + 1;
  }
  return metin.length;
}

/** Alanı bağlar: yazarken biçimler, imleci yerinde tutar, boş alana odaklanınca «+32 » önerir. */
export function telefonAlaniniBagla(alan: HTMLInputElement, varsayilanKod = '32'): void {
  if (alan.dataset.telefonBicim === '1') return;
  alan.dataset.telefonBicim = '1';
  const onEk = `+${varsayilanKod} `;
  const uygula = () => {
    const eski = alan.value;
    // «+32 » önerisi silinirken kullanıcıyla inatlaşma: yalnız ön ekin parçası kaldıysa olduğu gibi bırak.
    if (onEk.startsWith(eski)) return;
    const imlec = alan.selectionStart ?? eski.length;
    // İmleçten önceki rakam sayısı, ham metin yeniden yorumlandıktan SONRA da aynı yere düşmeli:
    // yerel «0470…» yazımında baştaki 0 düşer, «32» eklenir → fark kadar kaydır.
    const onceki = eski.slice(0, imlec);
    const fark = telefonRakamlari(eski).length - eski.replace(/\D/g, '').length;
    const yeni = telefonBicimle(eski);
    if (yeni === eski) return;
    alan.value = yeni;
    const hedef = imlec >= eski.length ? yeni.length : imlecYeri(yeni, Math.max(0, onceki.replace(/\D/g, '').length + fark));
    try { alan.setSelectionRange(hedef, hedef); } catch { /* bazı tarayıcılar tel alanında seçim vermez */ }
  };
  alan.addEventListener('input', uygula);
  alan.addEventListener('focus', () => {
    if (alan.value.trim() === '') {
      alan.value = onEk;
      requestAnimationFrame(() => { try { alan.setSelectionRange(onEk.length, onEk.length); } catch { /* yoksay */ } });
    }
  });
  alan.addEventListener('blur', () => {
    // Yalnız öneri kaldıysa alan boş sayılır (isteğe bağlı alan «geçersiz» görünmesin).
    if (alan.value.replace(/\D/g, '') === varsayilanKod || alan.value.trim() === '+') {
      alan.value = '';
      alan.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  if (alan.value.trim()) uygula();
}
