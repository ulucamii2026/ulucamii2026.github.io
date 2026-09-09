/** E-posta hatırlama isteğe bağlıdır; depolama engeli kimlik doğrulamayı durdurmaz. */
export const portalTercihleri = {
  getItem(anahtar: string): string | null {
    try { return localStorage.getItem(anahtar); } catch { return null; }
  },
  setItem(anahtar: string, deger: string): void {
    try { localStorage.setItem(anahtar, deger); } catch { /* Depolama kapalı veya dolu. */ }
  },
  removeItem(anahtar: string): void {
    try { localStorage.removeItem(anahtar); } catch { /* Hatırlanan değer zorunlu değil. */ }
  },
};
