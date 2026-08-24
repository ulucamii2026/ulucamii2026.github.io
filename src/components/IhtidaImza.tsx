/** El ile imza yakalama — canvas + pointer events. Kur'an kursu kayıt sistemindeki
 *  assets/signature.js ile aynı ağırlıklı-mürekkep çizim algoritması; burada Preact
 *  bileşeni olarak, global durum yerine yerel state/ref ile yeniden yazılmıştır. */
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { Metinler } from './IhtidaMetinler';

interface Nokta { x: number; y: number; weight: number }
type Cizgi = Nokta[];

interface Props {
  deger: string;
  onDegisti: (dataUrl: string) => void;
  m: Metinler;
  hata?: string;
  /** Şahit imzalarında başlık/açıklama değişir; verilmezse başvuranın kendi imzası varsayılır. */
  baslik?: string;
  aciklama?: string;
}

const TABAN_G = 1600;
const TABAN_B = 600;

function drawStrokes(context: CanvasRenderingContext2D, width: number, height: number, color: string, strokes: Cizgi[], scaleFactor?: number) {
  const baseScale = scaleFactor || Math.max(0.85, Math.min(1.8, Math.min(width, height) / 500));
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = color;
  context.fillStyle = color;

  strokes.forEach((stroke) => {
    if (!stroke.length) return;
    if (stroke.length === 1) {
      const p = stroke[0];
      context.beginPath();
      context.arc(p.x * width, p.y * height, (1.3 + p.weight * 1.9) * baseScale, 0, Math.PI * 2);
      context.fill();
      return;
    }
    context.beginPath();
    context.moveTo(stroke[0].x * width, stroke[0].y * height);
    for (let i = 1; i < stroke.length; i += 1) {
      const prev = stroke[i - 1];
      const p = stroke[i];
      const midX = ((prev.x + p.x) / 2) * width;
      const midY = ((prev.y + p.y) / 2) * height;
      context.lineWidth = (2.1 + ((prev.weight + p.weight) / 2) * 3.0) * baseScale;
      context.quadraticCurveTo(prev.x * width, prev.y * height, midX, midY);
      context.stroke();
      context.beginPath();
      context.moveTo(midX, midY);
    }
    const last = stroke[stroke.length - 1];
    context.lineTo(last.x * width, last.y * height);
    context.stroke();
  });
}

function sinirKutusu(strokes: Cizgi[]) {
  let bas = false;
  let enAzX = 1, enAzY = 1, enCokX = 0, enCokY = 0;
  strokes.forEach((s) => s.forEach((p) => {
    bas = true;
    if (p.x < enAzX) enAzX = p.x;
    if (p.x > enCokX) enCokX = p.x;
    if (p.y < enAzY) enAzY = p.y;
    if (p.y > enCokY) enCokY = p.y;
  }));
  return bas ? { enAzX, enAzY, enCokX, enCokY } : null;
}

/** Çizilen mürekkebi sınırına kırpıp PNG dataURL üretir (imza kutusunun tamamını doldursun diye). */
function exportDataUrl(strokes: Cizgi[]): string {
  if (!strokes.length) return '';
  const kutu = sinirKutusu(strokes);
  if (!kutu) return '';
  const x0 = kutu.enAzX * TABAN_G;
  const y0 = kutu.enAzY * TABAN_B;
  const genislik = Math.max(28, (kutu.enCokX - kutu.enAzX) * TABAN_G);
  const yukseklik = Math.max(28, (kutu.enCokY - kutu.enAzY) * TABAN_B);
  const payX = Math.max(10, genislik * 0.05);
  const payY = Math.max(10, yukseklik * 0.05);
  const olcek = Math.min(3, Math.max(1, 900 / Math.max(genislik, yukseklik)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((genislik + payX * 2) * olcek);
  canvas.height = Math.round((yukseklik + payY * 2) * olcek);
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.setTransform(olcek, 0, 0, olcek, (payX - x0) * olcek, (payY - y0) * olcek);
  drawStrokes(context, TABAN_G, TABAN_B, '#0e1a14', strokes, 2.8);
  return canvas.toDataURL('image/png');
}

/** Yazılı imza: adı el yazısı hissi veren eğik serif ile PNG'ye çizer (klavye alternatifi) */
function yaziliImza(ad: string): string {
  const olcek = 2, g = 640, y = 200;
  const canvas = document.createElement('canvas'); canvas.width = g * olcek; canvas.height = y * olcek;
  const c = canvas.getContext('2d'); if (!c) return '';
  c.setTransform(olcek, 0, 0, olcek, 0, 0);
  c.fillStyle = '#121a17'; c.textBaseline = 'middle'; c.textAlign = 'center';
  let boyut = 64; c.font = `italic ${boyut}px "Lora Variable", Lora, Georgia, serif`;
  while (c.measureText(ad).width > g - 60 && boyut > 24) { boyut -= 4; c.font = `italic ${boyut}px "Lora Variable", Lora, Georgia, serif`; }
  c.fillText(ad, g / 2, y / 2);
  c.strokeStyle = '#121a17'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(60, y / 2 + boyut * 0.6); c.lineTo(g - 60, y / 2 + boyut * 0.6); c.stroke();
  return canvas.toDataURL('image/png');
}

export default function IhtidaImza({ deger, onDegisti, m, hata, baslik, aciklama }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Cizgi[]>([]);
  const activeRef = useRef<Cizgi | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef(0);
  // Kayıtlı bir imza varsa ve kullanıcı henüz yeniden çizmediyse, önizleme gösterilir
  const [yenidenCiziyor, setYenidenCiziyor] = useState(!deger);
  const [bosMu, setBosMu] = useState(true);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.scale(dpr, dpr);
    const tema = document.documentElement.dataset.theme;
    const koyu = tema ? tema === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    drawStrokes(context, rect.width, rect.height, koyu ? '#f7efe0' : '#0e1a14', strokesRef.current);
    setBosMu(strokesRef.current.length === 0);
  }, []);

  useEffect(() => {
    if (!yenidenCiziyor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    render();
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [yenidenCiziyor, render]);

  function pointFromEvent(e: PointerEvent): Nokta {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(1, rect.height)));
    const last = lastPointRef.current;
    const distance = last ? Math.hypot((x - last.x) * rect.width, (y - last.y) * rect.height) : 0;
    const elapsed = Math.max(1, now - lastTimeRef.current);
    const speed = distance / elapsed;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : Math.max(0.35, Math.min(0.75, 0.75 - speed * 0.1));
    const weight = Math.max(0.35, Math.min(1, pressure * 0.85 + Math.max(0, 0.25 - speed * 0.05)));
    lastPointRef.current = { x, y };
    lastTimeRef.current = now;
    return { x, y, weight };
  }

  function bitir() {
    const dataUrl = exportDataUrl(strokesRef.current);
    onDegisti(dataUrl);
  }

  function pointerDown(e: PointerEvent) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    activeRef.current = [];
    lastPointRef.current = null;
    lastTimeRef.current = performance.now();
    strokesRef.current.push(activeRef.current);
    activeRef.current.push(pointFromEvent(e));
    render();
  }
  function pointerMove(e: PointerEvent) {
    const canvas = canvasRef.current!;
    if (!activeRef.current || !canvas.hasPointerCapture(e.pointerId)) return;
    e.preventDefault();
    const next = pointFromEvent(e);
    const prev = activeRef.current[activeRef.current.length - 1];
    if (!prev || Math.hypot(next.x - prev.x, next.y - prev.y) > 0.0014) {
      activeRef.current.push(next);
      render();
    }
  }
  function pointerUp(e: PointerEvent) {
    const canvas = canvasRef.current!;
    if (!activeRef.current) return;
    e.preventDefault();
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    activeRef.current = null;
    lastPointRef.current = null;
    render();
    bitir();
  }

  function temizle() {
    strokesRef.current = [];
    render();
    onDegisti('');
  }
  function geriAl() {
    strokesRef.current.pop();
    render();
    bitir();
  }
  function yenidenImzalaBasla() {
    strokesRef.current = [];
    setYenidenCiziyor(true);
  }

  const gosterBaslik = baslik ?? m.imzaBaslik;
  const gosterAciklama = aciklama ?? m.imzaAciklama;

  if (!yenidenCiziyor && deger) {
    return (
      <div class="grid gap-3">
        <p class="etiket">{gosterBaslik}</p>
        <div class="kart-kagit p-3 inline-block w-fit">
          <img src={deger} alt="" class="h-20 w-auto" />
        </div>
        <button type="button" class="dugme dugme-ikincil w-fit" onClick={yenidenImzalaBasla}>{m.imzaYenidenImzala}</button>
      </div>
    );
  }

  return (
    <div class="grid gap-3">
      <p class="etiket">{gosterBaslik}</p>
      <p class="text-sm text-(--metin-2)">{gosterAciklama}</p>
      <div
        class="kart-kagit touch-none select-none"
        style={{ height: '220px', background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, var(--cizgi) 40px)' }}
      >
        <canvas
          ref={canvasRef}
          class="h-full w-full touch-none"
          style={{ display: 'block', cursor: 'crosshair' }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          aria-label={gosterBaslik}
          role="img"
        />
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="dugme dugme-ikincil" onClick={geriAl} disabled={bosMu}>{m.imzaGeriAl}</button>
        <button type="button" class="dugme dugme-ikincil" onClick={temizle} disabled={bosMu}>{m.imzaTemizle}</button>
      </div>
      {/* Klavye / ekran okuyucu alternatifi: adını yazarak imzalama — aynı PNG akışını üretir */}
      <details class="text-sm">
        <summary class="cursor-pointer text-(--vurgu-2) min-h-11 inline-flex items-center">{m.imzaYazarak}</summary>
        <form class="mt-2 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget as HTMLFormElement; const ad = (f.elements.namedItem('yazili-imza') as HTMLInputElement).value.trim(); if (ad.length >= 3) onDegisti(yaziliImza(ad)); }}>
          <label class="grid gap-1 grow"><span class="etiket">{m.imzaYazarakEtiket}</span><input name="yazili-imza" type="text" autocomplete="name" minLength={3} required class="min-h-11 rounded-(--radius-kose) border border-(--cizgi) bg-(--zemin) px-3 py-2 text-base" /></label>
          <button type="submit" class="dugme dugme-ikincil min-h-11">{m.imzaYazarakOnay}</button>
        </form>
      </details>
      {hata && <p class="text-sm text-(--vurgu)" role="alert">{hata}</p>}
    </div>
  );
}
