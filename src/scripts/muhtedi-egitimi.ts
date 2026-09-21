// İsteğe bağlı, cihazda kalan çalışma işaretleri. Kişisel veri veya ağ isteği yoktur.
const root = document.querySelector<HTMLElement>('[data-egitim]');
if (root) {
  const key = 'ulucamii.egitim.v1';
  const boxes = [...root.querySelectorAll<HTMLInputElement>('[data-eg-tamam]')];
  const count = root.querySelector<HTMLElement>('[data-eg-sayac]');
  const progress = root.querySelector<HTMLProgressElement>('[data-eg-ilerleme]');
  const notice = root.querySelector<HTMLElement>('[data-eg-kayit]');
  const normalNotice = notice?.textContent ?? '';
  const warn = () => { if (notice) notice.textContent = notice.dataset.hata ?? ''; };
  const update = () => {
    const total = boxes.filter((box) => box.checked).length;
    if (count) count.textContent = `${total} / ${boxes.length} ${count.dataset.birim}`;
    if (progress) progress.value = total;
  };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (Array.isArray(saved)) for (const box of boxes) box.checked = saved.includes(box.value);
  } catch { warn(); }
  update();
  root.querySelectorAll<HTMLElement>('[data-eg-takip], [data-eg-isaret]').forEach((el) => { el.hidden = false; });
  for (const box of boxes) box.addEventListener('change', () => {
    update();
    try {
      localStorage.setItem(key, JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.value)));
      if (notice) notice.textContent = normalNotice;
    } catch { warn(); }
  });
  root.querySelector('[data-eg-sifirla]')?.addEventListener('click', () => {
    for (const box of boxes) box.checked = false;
    update();
    try {
      localStorage.removeItem(key);
      if (notice) notice.textContent = normalNotice;
    } catch { warn(); }
  });
}
