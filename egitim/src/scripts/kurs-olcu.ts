/**
 * Dinamik ölçüler (Dilim 4 / P5): hosting CSP'si `style-src 'self'` olduğundan satır içi `style="…"` özniteliği yazılamaz; sayfalar değeri `data-` özniteliğine
 * koyar, burada CSSOM ile uygulanır (CSSOM atamaları CSP'ye takılmaz). Betik çalışmazsa çubuklar boş/eşit görünür, sayılar metinde yazılıdır.
 */
for (const e of document.querySelectorAll<HTMLElement>('[data-grow]')) e.style.flexGrow = e.dataset.grow ?? '1';
for (const e of document.querySelectorAll<HTMLElement>('[data-yuzde]')) e.style.width = `${Number(e.dataset.yuzde) || 0}%`;
