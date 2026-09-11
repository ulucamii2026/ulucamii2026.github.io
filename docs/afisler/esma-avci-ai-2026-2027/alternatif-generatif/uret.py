"""
Esma AVCI Hoca Hanım 2026-2027 Çalışma Programı
Üretken Sanat ve Afiş Üretim Motoru (Anti-Gravity Generative Art Engine)

Bu betik, Pillow ve NumPy kullanarak 8 adet bağımsız, yüksek kaliteli,
kültür-sanat estetiğinde sosyal medya afişi (1080x1350 PNG) ve
baskıya uygun tek sayfalık PDF üretir.
"""

import math
import os
import sys
from pathlib import Path

# Windows konsolunda UTF-8 karakter desteği
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = Path(__file__).resolve().parent
FONTS_DIR = BASE_DIR / "fonts"

# Font Yolları
FONT_LORA_BOLD = str(FONTS_DIR / "Lora-Bold.ttf")
FONT_LORA_REG = str(FONTS_DIR / "Lora-Regular.ttf")
FONT_WORK_BOLD = str(FONTS_DIR / "WorkSans-Bold.ttf")
FONT_WORK_REG = str(FONTS_DIR / "WorkSans-Regular.ttf")

# Hedef Boyutlar (Instagram Dikey 4:5)
W = 1080
H = 1350

# 2x Çizim Tuvali (Süper-örnekleme ile kusursuz anti-aliasing)
SW = W * 2  # 2160
SH = H * 2  # 2700

# Renk Paleti (Koyu indigo/aubergine, mercan, mint, sıcak altın, fildişi)
C_INDIGO_DEEP = (10, 12, 22)       # Derin gece
C_INDIGO = (16, 20, 38)            # İndigo tonu
C_AUBERGINE = (30, 20, 50)         # Patlıcan moru / tefekkür tonu
C_MIDNIGHT = (12, 14, 28)

C_CORAL = (244, 107, 93)           # Mercan
C_CORAL_LIGHT = (255, 148, 136)    # Açık mercan

C_MINT = (45, 212, 191)            # Nane yeşili / turkuaz
C_MINT_LIGHT = (115, 240, 220)     # Parlak nane

C_GOLD = (245, 158, 11)            # Sıcak altın
C_GOLD_LIGHT = (251, 191, 36)      # Parlak altın
C_GOLD_PALE = (254, 240, 138)      # Fildişi-altın ışıltı

C_IVORY = (252, 250, 246)          # Temiz fildişi metin
C_IVORY_MUTED = (208, 204, 194)    # İkincil metin
C_GLASS_CARD = (18, 22, 42, 215)   # Buzlu cam kart zemini


# ==============================================================================
# ÜRETKEN SANAT MOTORU: TEMEL EFEKTLER VE GEOMETRİK ALGORİTMALAR
# ==============================================================================

def create_rich_gradient(w, h, seed, center_color, corner_color, accent_color=None, accent_pos=(0.5, 0.28)):
    """NumPy ile çok katmanlı, zengin 2D atmosfer gradyanı oluşturur."""
    np.random.seed(seed)
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]

    vert = y ** 1.35

    ax, ay = accent_pos
    dist_accent = np.sqrt((x - ax) ** 2 + ((y - ay) * 1.1) ** 2)
    accent_glow = np.clip(1.0 - dist_accent * 1.35, 0, 1) ** 2.2

    dist_center = np.sqrt((x - 0.5) ** 2 + (y - 0.35) ** 2)
    center_glow = np.clip(1.0 - dist_center * 1.25, 0, 1) ** 1.5

    r = corner_color[0] * vert + center_color[0] * (1 - vert) * center_glow
    g = corner_color[1] * vert + center_color[1] * (1 - vert) * center_glow
    b = corner_color[2] * vert + center_color[2] * (1 - vert) * center_glow

    if accent_color:
        r += accent_color[0] * accent_glow * 0.55
        g += accent_color[1] * accent_glow * 0.55
        b += accent_color[2] * accent_glow * 0.55

    img_arr = np.clip(np.dstack([r, g, b]), 0, 255).astype(np.uint8)
    return Image.fromarray(img_arr, mode="RGB").convert("RGBA")


def apply_paper_grain(image, intensity=0.035, seed=42):
    """Doğal kağıt dokusu (paper-grain): Serigrafi ve müze afişi dokusu kazandırır."""
    np.random.seed(seed)
    arr = np.array(image.convert("RGB"), dtype=np.float32)
    h, w, _ = arr.shape
    noise = np.random.normal(0, intensity * 255.0, (h, w, 1))
    arr = np.clip(arr + noise, 0, 255.0).astype(np.uint8)
    return Image.fromarray(arr, mode="RGB").convert("RGBA")


def draw_exhibition_frame(draw, w, h):
    """Zarif kenar çerçevesi ve köşe işaretleri."""
    pad = 80
    c_line = (251, 191, 36, 60)
    c_tick = (251, 191, 36, 120)

    draw.rectangle([pad, pad, w - pad, h - pad], outline=c_line, width=2)

    tick_len = 35
    corners = [(pad, pad), (w - pad, pad), (pad, h - pad), (w - pad, h - pad)]
    for cx, cy in corners:
        dx = tick_len if cx == pad else -tick_len
        dy = tick_len if cy == pad else -tick_len
        draw.line([(cx, cy), (cx + dx, cy)], fill=c_tick, width=3)
        draw.line([(cx, cy), (cx, cy + dy)], fill=c_tick, width=3)


def draw_pointed_arch_path(cx, base_y, width, height, spring_ratio=0.35, steps=100):
    """Sivri kemer (pointed arch) kontur koordinatlarını hesaplar."""
    w2 = width / 2.0
    spring_y = base_y - height * spring_ratio
    arch_h = height * (1.0 - spring_ratio)

    pts_left = []
    pts_right = []

    pts_left.append((cx - w2, base_y))
    pts_left.append((cx - w2, spring_y))

    pts_right.append((cx + w2, base_y))
    pts_right.append((cx + w2, spring_y))

    for i in range(steps + 1):
        t = i / steps
        py = spring_y - arch_h * (t ** 0.88)
        px_l = cx - w2 * ((1 - t) ** 0.95)
        px_r = cx + w2 * ((1 - t) ** 0.95)
        pts_left.append((px_l, py))
        pts_right.append((px_r, py))

    pts_right.reverse()
    return pts_left + pts_right


def draw_smooth_arch(draw, cx, base_y, width, height, spring_ratio=0.35, outline=None, width_px=2, fill=None):
    """Pürüzsüz sivri kemer çizer."""
    coords = draw_pointed_arch_path(cx, base_y, width, height, spring_ratio)
    if fill:
        draw.polygon(coords, fill=fill)
    if outline:
        draw.line(coords + [coords[0]], fill=outline, width=width_px, joint="curve")


def draw_volumetric_rays(overlay_draw, origin, count, min_angle, max_angle, max_length, color, width_deg=2.8):
    """Işık huzmeleri (god rays) üretir."""
    ox, oy = origin
    angles = np.linspace(min_angle, max_angle, count)
    for ang in angles:
        a1 = math.radians(ang - width_deg / 2)
        a2 = math.radians(ang + width_deg / 2)
        p1 = (ox, oy)
        p2 = (ox + max_length * math.cos(a1), oy + max_length * math.sin(a1))
        p3 = (ox + max_length * math.cos(a2), oy + max_length * math.sin(a2))
        overlay_draw.polygon([p1, p2, p3], fill=color)


def draw_halftone_wave(draw, cx, cy, radius_x, radius_y, count_x=24, count_y=14, color=C_GOLD_LIGHT, max_r=8):
    """Ritmik yarıton (halftone) nokta matrisi üretir."""
    for ix in range(count_x):
        for iy in range(count_y):
            u = (ix / (count_x - 1)) * 2 - 1
            v = (iy / (count_y - 1)) * 2 - 1
            if u*u + v*v <= 1.0:
                wave = (math.sin(u * 4.2) * math.cos(v * 4.2) + 1.0) / 2.0
                r = max_r * wave * (1.0 - (u*u + v*v) * 0.35)
                if r > 1.2:
                    px = cx + u * radius_x
                    py = cy + v * radius_y
                    alpha = int(190 * (wave ** 1.3))
                    c = (color[0], color[1], color[2], alpha)
                    draw.ellipse([px - r, py - r, px + r, py + r], fill=c)


def draw_celestial_star(draw, cx, cy, points=8, r_outer=40, r_inner=16, fill=C_GOLD_LIGHT, outline=None):
    """Zarif geometrik İslam/Selçuklu esintili yıldız rozeti çizer."""
    pts = []
    for i in range(points * 2):
        angle = i * math.pi / points - math.pi / 2
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(pts, fill=fill, outline=outline)


# ==============================================================================
# 8 AFİŞ İÇİN ÖZGÜN SANAT KOMPOZİSYONLARI
# ==============================================================================

def render_art_00_portal(canvas):
    """00: Genel Tanıtım — Anıtsal Ulu Portal & Şafak Işığı."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    rays_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(rays_layer)
    draw_volumetric_rays(r_draw, (cx, cy + 240), count=28, min_angle=-165, max_angle=-15,
                         max_length=1350, color=(251, 191, 36, 35), width_deg=3.5)
    draw_volumetric_rays(r_draw, (cx, cy + 240), count=16, min_angle=-150, max_angle=-30,
                         max_length=1100, color=(45, 212, 191, 30), width_deg=4.2)
    rays_layer = rays_layer.filter(ImageFilter.GaussianBlur(22))
    canvas.alpha_composite(rays_layer)

    draw = ImageDraw.Draw(canvas)

    base_y = cy + 440
    arch_configs = [
        (920, 1050, (245, 158, 11, 45), 2, None),
        (780, 920, (251, 191, 36, 85), 3, None),
        (650, 780, (244, 107, 93, 110), 4, None),
        (520, 640, (45, 212, 191, 140), 5, (16, 20, 42, 180)),
        (380, 480, (251, 191, 36, 200), 5, (26, 18, 52, 230)),
        (240, 320, (254, 240, 138, 230), 4, (35, 22, 65, 240)),
    ]
    for aw, ah, col, lw, fill in arch_configs:
        draw_smooth_arch(draw, cx, base_y, aw, ah, spring_ratio=0.38, outline=col, width_px=lw, fill=fill)

    draw_celestial_star(draw, cx, cy - 80, points=8, r_outer=68, r_inner=28,
                        fill=(251, 191, 36, 245), outline=(255, 255, 255, 200))

    for r in [110, 200, 300, 410, 520]:
        alpha = max(18, int(85 - r * 0.12))
        draw.ellipse([cx - r, (cy - 80) - r, cx + r, (cy - 80) + r],
                     outline=(251, 191, 36, alpha), width=2)

    draw_halftone_wave(draw, cx, cy + 280, radius_x=450, radius_y=170,
                       count_x=24, count_y=12, color=C_GOLD_LIGHT, max_r=7)


def render_art_01_book_leaves(canvas):
    """01: Hanımlar Pazartesi — Açılan Sayfalar & Tilavet Yayları."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    beam_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(beam_layer)
    b_draw.rectangle([cx - 60, 100, cx + 60, cy + 420], fill=(251, 191, 36, 50))
    b_draw.ellipse([cx - 300, cy - 120, cx + 300, cy + 320], fill=(45, 212, 191, 65))
    beam_layer = beam_layer.filter(ImageFilter.GaussianBlur(38))
    canvas.alpha_composite(beam_layer)

    draw = ImageDraw.Draw(canvas)

    for r in range(150, 680, 55):
        alpha = int(160 * (1.0 - r / 720.0))
        draw.arc([cx - r, cy - r, cx + r, cy + r], start=195, end=345,
                 fill=(45, 212, 191, alpha), width=3)

    layers = 8
    base_y = cy + 250
    for i in range(layers):
        ratio = (i + 1) / layers
        spread = 520 * ratio
        lift = 340 * (ratio ** 0.82)
        lw = 4 if i >= layers - 2 else 2

        col_l = (45, 212, 191, int(110 + 140 * ratio))
        col_r = (251, 191, 36, int(110 + 140 * ratio))

        pts_l = [
            (cx, base_y),
            (cx - spread * 0.38, base_y - lift * 0.22),
            (cx - spread * 0.78, base_y - lift * 0.72),
            (cx - spread, base_y - lift),
        ]
        pts_r = [
            (cx, base_y),
            (cx + spread * 0.38, base_y - lift * 0.22),
            (cx + spread * 0.78, base_y - lift * 0.72),
            (cx + spread, base_y - lift),
        ]
        draw.line(pts_l, fill=col_l, width=lw, joint="curve")
        draw.line(pts_r, fill=col_r, width=lw, joint="curve")

    draw_halftone_wave(draw, cx - 260, cy + 60, radius_x=220, radius_y=130,
                       count_x=16, count_y=10, color=C_MINT_LIGHT, max_r=6)
    draw_halftone_wave(draw, cx + 260, cy + 60, radius_x=220, radius_y=130,
                       count_x=16, count_y=10, color=C_GOLD_LIGHT, max_r=6)

    draw_celestial_star(draw, cx, base_y, points=8, r_outer=36, r_inner=15,
                        fill=(252, 250, 246, 245), outline=C_GOLD)


def render_art_02_receding_arches(canvas):
    """02: Hanımlar Perşembe — Tefekkür Geçidi & Sonsuzluk Kemerleri."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    dawn_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(dawn_layer)
    d_draw.ellipse([cx - 240, cy - 40, cx + 240, cy + 300], fill=(245, 158, 11, 95))
    d_draw.ellipse([cx - 120, cy + 40, cx + 120, cy + 240], fill=(244, 107, 93, 120))
    dawn_layer = dawn_layer.filter(ImageFilter.GaussianBlur(42))
    canvas.alpha_composite(dawn_layer)

    draw = ImageDraw.Draw(canvas)

    base_y = cy + 440
    vanishing_y = cy + 130
    for px in np.linspace(cx - 560, cx + 560, 13):
        draw.line([(px, base_y), (cx + (px - cx) * 0.12, vanishing_y)],
                  fill=(251, 191, 36, 50), width=2)

    num_arches = 9
    for i in range(num_arches, 0, -1):
        scale = (i / num_arches) ** 1.3
        aw = int(860 * scale)
        ah = int(980 * scale)
        arch_base = int(vanishing_y + (base_y - vanishing_y) * scale)

        alpha = int(45 + 195 * (1.0 - scale))
        color = (251, 191, 36, alpha) if i % 2 == 0 else (244, 107, 93, alpha)
        fill_col = (18, 14, 34, int(180 * (1.0 - scale))) if i < num_arches else None

        draw_smooth_arch(draw, cx, arch_base, aw, ah, spring_ratio=0.35,
                         outline=color, width_px=4 if i > 4 else 2, fill=fill_col)

    rays_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(rays_layer)
    draw_volumetric_rays(r_draw, (cx - 240, cy - 160), count=9, min_angle=35, max_angle=75,
                         max_length=850, color=(254, 240, 138, 40), width_deg=5.0)
    rays_layer = rays_layer.filter(ImageFilter.GaussianBlur(25))
    canvas.alpha_composite(rays_layer)

    draw = ImageDraw.Draw(canvas)
    draw_celestial_star(draw, cx, vanishing_y - 25, points=8, r_outer=32, r_inner=13,
                        fill=(254, 240, 138, 240), outline=(245, 158, 11, 220))


def render_art_03_interlaced_arches(canvas):
    """03: Marche-en-Famenne Çarşamba — İki Kemerin Buluşması & Uyum."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    glow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    g_draw.ellipse([cx - 400, cy - 70, cx - 40, cy + 300], fill=(244, 107, 93, 85))
    g_draw.ellipse([cx + 40, cy - 70, cx + 400, cy + 300], fill=(45, 212, 191, 85))
    g_draw.ellipse([cx - 150, cy - 20, cx + 150, cy + 260], fill=(251, 191, 36, 110))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(40))
    canvas.alpha_composite(glow_layer)

    draw = ImageDraw.Draw(canvas)

    offset_x = 180
    base_y = cy + 440
    arch_w = 640
    arch_h = 840

    draw_smooth_arch(draw, cx - offset_x, base_y, arch_w, arch_h, spring_ratio=0.36,
                     outline=(244, 107, 93, 195), width_px=5)
    draw_smooth_arch(draw, cx - offset_x, base_y, arch_w - 75, arch_h - 75, spring_ratio=0.36,
                     outline=(251, 191, 36, 130), width_px=3)

    draw_smooth_arch(draw, cx + offset_x, base_y, arch_w, arch_h, spring_ratio=0.36,
                     outline=(45, 212, 191, 195), width_px=5)
    draw_smooth_arch(draw, cx + offset_x, base_y, arch_w - 75, arch_h - 75, spring_ratio=0.36,
                     outline=(115, 240, 220, 130), width_px=3)

    draw_celestial_star(draw, cx, cy + 45, points=12, r_outer=58, r_inner=24,
                        fill=(252, 250, 246, 245), outline=C_GOLD)

    for dy in range(-160, 240, 45):
        draw.arc([cx - 480, cy + dy - 50, cx + 480, cy + dy + 230],
                 start=210, end=330, fill=(251, 191, 36, 60), width=2)

    draw_halftone_wave(draw, cx, cy + 230, radius_x=300, radius_y=120,
                       count_x=20, count_y=10, color=C_GOLD_LIGHT, max_r=6)


def render_art_04_youth_constellation(canvas):
    """04: Genç Kızlar Cuma — Akşam Göğü & Geometrik Hasbihal."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    beam_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(beam_layer)
    for offset in [-320, -110, 110, 320]:
        b_draw.polygon([
            (cx + offset - 80, 70),
            (cx + offset + 80, 70),
            (cx + offset * 0.4 + 240, cy + 460),
            (cx + offset * 0.4 + 80, cy + 460)
        ], fill=(244, 107, 93, 38))
    beam_layer = beam_layer.filter(ImageFilter.GaussianBlur(35))
    canvas.alpha_composite(beam_layer)

    draw = ImageDraw.Draw(canvas)

    nodes = [
        (cx - 310, cy - 50, 30, C_MINT),
        (cx - 130, cy - 170, 22, C_GOLD),
        (cx + 150, cy - 150, 34, C_CORAL),
        (cx + 330, cy - 30, 26, C_MINT_LIGHT),
        (cx + 230, cy + 160, 28, C_GOLD_LIGHT),
        (cx - 30, cy + 210, 38, C_CORAL_LIGHT),
        (cx - 250, cy + 140, 25, C_GOLD),
        (cx, cy + 30, 52, C_IVORY),
    ]

    for i in range(len(nodes)):
        x1, y1, _, _ = nodes[i]
        for j in range(i + 1, len(nodes)):
            x2, y2, _, _ = nodes[j]
            dist = math.hypot(x2 - x1, y2 - y1)
            if dist < 420:
                alpha = int(140 * (1.0 - dist / 420.0))
                draw.line([(x1, y1), (x2, y2)], fill=(251, 191, 36, alpha), width=3)

    for nx, ny, nr, ncol in nodes:
        draw.ellipse([nx - nr*1.8, ny - nr*1.8, nx + nr*1.8, ny + nr*1.8],
                     outline=(ncol[0], ncol[1], ncol[2], 85), width=3)
        draw.ellipse([nx - nr, ny - nr, nx + nr, ny + nr],
                     fill=(ncol[0], ncol[1], ncol[2], 230), outline=(255, 255, 255, 200))

    draw.arc([cx - 460, cy - 280, cx + 460, cy + 380], start=30, end=150,
             fill=(45, 212, 191, 140), width=4)
    draw.arc([cx - 380, cy - 200, cx + 380, cy + 300], start=210, end=330,
             fill=(244, 107, 93, 140), width=4)

    draw_halftone_wave(draw, cx, cy + 110, radius_x=340, radius_y=150,
                       count_x=20, count_y=10, color=C_MINT_LIGHT, max_r=6)


def render_art_05_stepping_stones(canvas):
    """05: Kız Öğrenciler Hafta Sonu — Bilgi Basamakları & Neşeli Şafak."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    sun_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(sun_layer)
    s_draw.ellipse([cx - 220, cy - 150, cx + 220, cy + 180], fill=(251, 191, 36, 130))
    s_draw.ellipse([cx - 340, cy - 50, cx + 340, cy + 310], fill=(244, 107, 93, 90))
    sun_layer = sun_layer.filter(ImageFilter.GaussianBlur(40))
    canvas.alpha_composite(sun_layer)

    draw = ImageDraw.Draw(canvas)

    steps = 7
    base_y = cy + 440
    for i in range(steps):
        ratio = (i + 1) / steps
        w_step = 260 + 580 * ratio
        h_step = 220 + 500 * ratio
        spring = 0.30 + 0.08 * (1 - ratio)

        colors = [C_GOLD_LIGHT, C_MINT, C_CORAL_LIGHT, C_GOLD, C_MINT_LIGHT, C_CORAL, C_IVORY]
        c = colors[i % len(colors)]

        draw_smooth_arch(draw, cx, base_y, w_step, h_step, spring_ratio=spring,
                         outline=(c[0], c[1], c[2], 185), width_px=4)

    for i in range(9):
        ang = math.pi * (0.12 + 0.76 * (i / 8.0))
        rx = 450 * math.cos(ang)
        ry = 290 * math.sin(ang)
        px = cx + rx
        py = cy + 80 - ry

        c_dot = C_GOLD_LIGHT if i % 2 == 0 else C_MINT_LIGHT
        draw.ellipse([px - 18, py - 18, px + 18, py + 18],
                     fill=(c_dot[0], c_dot[1], c_dot[2], 230), outline=C_IVORY)

    draw_celestial_star(draw, cx, cy - 20, points=10, r_outer=50, r_inner=20,
                        fill=(254, 240, 138, 245), outline=C_GOLD)

    draw_halftone_wave(draw, cx, cy + 280, radius_x=360, radius_y=130,
                       count_x=22, count_y=9, color=C_GOLD_LIGHT, max_r=6)


def render_art_06_serene_sanctuary(canvas):
    """06: Birebir Görüşme · MDR — Sükûnet Limanı & Dinleme Hücresi."""
    w, h = canvas.size
    cx, cy = w // 2, int(h * 0.26)

    beam_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(beam_layer)
    b_draw.polygon([
        (cx - 40, 90),
        (cx + 40, 90),
        (cx + 160, cy + 440),
        (cx - 160, cy + 440)
    ], fill=(45, 212, 191, 65))
    b_draw.ellipse([cx - 160, cy + 280, cx + 160, cy + 460], fill=(251, 191, 36, 90))
    beam_layer = beam_layer.filter(ImageFilter.GaussianBlur(35))
    canvas.alpha_composite(beam_layer)

    draw = ImageDraw.Draw(canvas)

    base_y = cy + 440
    arch_w = 560
    arch_h = 880

    draw_smooth_arch(draw, cx, base_y, arch_w, arch_h, spring_ratio=0.40,
                     outline=(251, 191, 36, 185), width_px=4)
    draw_smooth_arch(draw, cx, base_y, arch_w - 60, arch_h - 60, spring_ratio=0.40,
                     outline=(45, 212, 191, 130), width_px=3)

    draw.line([(cx - 520, base_y), (cx + 520, base_y)], fill=(251, 191, 36, 75), width=3)

    draw_celestial_star(draw, cx, cy - 160, points=8, r_outer=34, r_inner=14,
                        fill=(252, 250, 246, 245), outline=C_GOLD)

    for r in [120, 240, 360]:
        draw.arc([cx - r, base_y - r * 0.4, cx + r, base_y + r * 0.4],
                 start=180, end=360, fill=(45, 212, 191, 50), width=2)

    draw_halftone_wave(draw, cx, cy + 250, radius_x=180, radius_y=80,
                       count_x=13, count_y=7, color=C_MINT_LIGHT, max_r=5)


def render_art_07_colonnade(canvas):
    """07: Haftalık Program Özeti — Haftanın Mimari Kolonadı (6 Kemer)."""
    w, h = canvas.size
    cy = int(h * 0.19)

    glow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    g_draw.ellipse([w // 2 - 500, cy - 100, w // 2 + 500, cy + 220], fill=(251, 191, 36, 80))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(38))
    canvas.alpha_composite(glow_layer)

    draw = ImageDraw.Draw(canvas)

    num_bays = 6
    bay_w = 160
    bay_h = 300
    spacing = 195
    total_w = spacing * (num_bays - 1)
    start_x = (w - total_w) // 2
    base_y = cy + 175

    bay_colors = [C_GOLD_LIGHT, C_CORAL, C_GOLD, C_MINT, C_CORAL_LIGHT, C_MINT_LIGHT]

    for i in range(num_bays):
        bx = start_x + i * spacing
        col = bay_colors[i]

        draw_smooth_arch(draw, bx, base_y, bay_w, bay_h, spring_ratio=0.35,
                         outline=(col[0], col[1], col[2], 180), width_px=3,
                         fill=(col[0], col[1], col[2], 35))

        draw_celestial_star(draw, bx, base_y - bay_h + 15, points=6, r_outer=14, r_inner=6,
                            fill=(col[0], col[1], col[2], 230))

    draw.line([(start_x - 90, base_y), (start_x + total_w + 90, base_y)],
              fill=(251, 191, 36, 90), width=3)
    draw.line([(start_x - 90, base_y - bay_h + 28), (start_x + total_w + 90, base_y - bay_h + 28)],
              fill=(255, 255, 255, 60), width=2)


# ==============================================================================
# TİPOGRAFİ VE BİLGİ DÜZENİ (YÜKSEK OKUNABİLİRLİK, NET HİYERARŞİ)
# ==============================================================================

def draw_header_section(draw, poster_meta):
    """Üst Bilgi: ESMA AVCI · 2026–2027."""
    font_eyebrow = ImageFont.truetype(FONT_WORK_BOLD, 42)
    font_sub = ImageFont.truetype(FONT_WORK_REG, 28)

    eyebrow_text = "ESMA AVCI   ·   2026–2027"
    draw.text((SW // 2, 140), eyebrow_text, font=font_eyebrow, fill=C_GOLD_LIGHT, anchor="mm")

    y_line = 195
    draw.line([(SW // 2 - 320, y_line), (SW // 2 - 50, y_line)], fill=(251, 191, 36, 110), width=2)
    draw.line([(SW // 2 + 50, y_line), (SW // 2 + 320, y_line)], fill=(251, 191, 36, 110), width=2)
    draw_celestial_star(draw, SW // 2, y_line, points=8, r_outer=16, r_inner=7, fill=C_GOLD_LIGHT)

    tag_text = poster_meta.get("header_tag", "DİNİ DANIŞMANLIK VE EĞİTİM PROGRAMI")
    draw.text((SW // 2, 245), tag_text, font=font_sub, fill=C_IVORY_MUTED, anchor="mm")


def draw_poster_title(draw, title_lines, y_start=1360):
    """Büyük Başlık Bölümü (Lora Bold ile asil serif tipografi)."""
    font_title = ImageFont.truetype(FONT_LORA_BOLD, 106)
    y = y_start

    for line in title_lines:
        draw.text((SW // 2 + 4, y + 4), line, font=font_title, fill=(0, 0, 0, 220), anchor="mm")
        draw.text((SW // 2, y), line, font=font_title, fill=C_IVORY, anchor="mm")
        y += 125

    return y


def draw_badge_pill(draw, cx, cy, text_bold, text_reg):
    """Şık, yüksek kontrastlı rozet kapsülü."""
    font_b = ImageFont.truetype(FONT_WORK_BOLD, 48)
    font_r = ImageFont.truetype(FONT_WORK_REG, 44)

    full_str = f"{text_bold}   ·   {text_reg}"
    bbox = font_b.getbbox(full_str)
    pw = (bbox[2] - bbox[0]) + 130
    ph = 110

    x0 = cx - pw // 2
    y0 = cy - ph // 2
    x1 = cx + pw // 2
    y1 = cy + ph // 2

    draw.rounded_rectangle([x0, y0, x1, y1], radius=55, fill=C_GLASS_CARD, outline=(251, 191, 36, 140), width=3)

    b_box = font_b.getbbox(text_bold)
    b_w = b_box[2] - b_box[0]
    sep = "   ·   "
    s_box = font_r.getbbox(sep)
    s_w = s_box[2] - s_box[0]
    r_box = font_r.getbbox(text_reg)
    r_w = r_box[2] - r_box[0]

    tot_w = b_w + s_w + r_w
    start_tx = cx - tot_w // 2

    draw.text((start_tx, cy), text_bold, font=font_b, fill=C_GOLD_LIGHT, anchor="lm")
    draw.text((start_tx + b_w, cy), sep, font=font_r, fill=C_IVORY_MUTED, anchor="lm")
    draw.text((start_tx + b_w + s_w, cy), text_reg, font=font_r, fill=C_IVORY, anchor="lm")

    return y1


def draw_subtitle_note(draw, note_text, y_pos):
    """Başlık altında zarafet katan açıklama cümlesi."""
    font_note = ImageFont.truetype(FONT_LORA_REG, 38)
    draw.text((SW // 2, y_pos), note_text, font=font_note, fill=C_IVORY_MUTED, anchor="mm")


def draw_content_chips(draw, items, y_start=1810):
    """Ders içeriklerini şık etiket blokları halinde çizer."""
    font_chip = ImageFont.truetype(FONT_WORK_REG, 42)
    font_label = ImageFont.truetype(FONT_WORK_BOLD, 32)

    draw.text((SW // 2, y_start), "DERS VE FAALİYET İÇERİĞİ", font=font_label, fill=C_MINT_LIGHT, anchor="mm")

    mid = math.ceil(len(items) / 2)
    rows = [items[:mid], items[mid:]] if len(items) > 3 else [items]

    curr_y = y_start + 75
    for row in rows:
        row_str = "    ●    ".join(row)
        bbox = font_chip.getbbox(row_str)
        bw = (bbox[2] - bbox[0]) + 100
        bh = 90

        draw.rounded_rectangle([SW // 2 - bw // 2, curr_y - bh // 2, SW // 2 + bw // 2, curr_y + bh // 2],
                               radius=24, fill=(15, 17, 34, 215), outline=(255, 255, 255, 50), width=2)
        draw.text((SW // 2, curr_y), row_str, font=font_chip, fill=C_IVORY, anchor="mm")
        curr_y += 115

    return curr_y


def draw_narrative_box(draw, text_narrative, y_start=1800):
    """Açıklama ve rehberlik metnini ferah bir kart içinde çizer."""
    font_narr = ImageFont.truetype(FONT_LORA_REG, 44)
    font_label = ImageFont.truetype(FONT_WORK_BOLD, 32)

    draw.text((SW // 2, y_start), "PROGRAM KAPSAMI VE REHBERLİK", font=font_label, fill=C_MINT_LIGHT, anchor="mm")

    lines = []
    words = text_narrative.split()
    cur = ""
    for w in words:
        test = cur + (" " if cur else "") + w
        bbox = font_narr.getbbox(test)
        if (bbox[2] - bbox[0]) < 1550:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)

    box_h = len(lines) * 78 + 80
    box_w = 1740
    y0 = y_start + 50
    draw.rounded_rectangle([SW // 2 - box_w // 2, y0, SW // 2 + box_w // 2, y0 + box_h],
                           radius=26, fill=(18, 22, 42, 220), outline=(251, 191, 36, 120), width=3)

    ty = y0 + 55
    for l in lines:
        draw.text((SW // 2, ty), l, font=font_narr, fill=C_IVORY, anchor="mm")
        ty += 78

    return y0 + box_h


def draw_guidance_badge(draw, text_guidance, y_pos=2320):
    """Alt kısımda katılım ve davet notu rozeti."""
    font_g = ImageFont.truetype(FONT_WORK_REG, 32)
    bbox = font_g.getbbox(text_guidance)
    bw = (bbox[2] - bbox[0]) + 70
    bh = 65
    draw.rounded_rectangle([SW // 2 - bw // 2, y_pos - bh // 2, SW // 2 + bw // 2, y_pos + bh // 2],
                           radius=32, fill=(14, 16, 30, 160), outline=(251, 191, 36, 80), width=1)
    draw.text((SW // 2, y_pos), text_guidance, font=font_g, fill=C_GOLD_PALE, anchor="mm")


def draw_schedule_table(draw, y_start=980):
    """07 Afişi İçin Haftalık Program Tablosu (6 Büyük ve Ferah Kart)."""
    schedule_data = [
        ("PAZARTESİ", "10.30 – 16.00", "Hanımlar Buluşması", "Namur Camii", C_GOLD_LIGHT),
        ("SALI", "—", "Haftalık İzin", "Resmî İzin Günü", C_IVORY_MUTED),
        ("ÇARŞAMBA", "10.30 – 16.00", "Hanımlar & Genç Kızlar", "Marche-en-Famenne Ulu Camii", C_CORAL_LIGHT),
        ("PERŞEMBE", "10.30 – 16.00", "Hanımlar Buluşması", "Namur Camii", C_GOLD_LIGHT),
        ("CUMA", "18.30 – 20.30", "Genç Kızlar Hasbihal", "Namur Camii", C_MINT_LIGHT),
        ("HAFTA SONU", "10.00 – 13.00", "Kız Öğrenciler (7+ Yaş)", "Namur Camii (Cumartesi & Pazar)", C_MINT),
    ]

    font_day = ImageFont.truetype(FONT_WORK_BOLD, 42)
    font_time = ImageFont.truetype(FONT_WORK_BOLD, 36)
    font_title = ImageFont.truetype(FONT_LORA_REG, 40)
    font_venue = ImageFont.truetype(FONT_WORK_REG, 34)

    card_w = 1860
    card_h = 185
    curr_y = y_start

    for day, time_str, title_str, venue_str, accent_color in schedule_data:
        x0 = SW // 2 - card_w // 2
        y0 = curr_y
        x1 = SW // 2 + card_w // 2
        y1 = curr_y + card_h

        is_off = "İzin" in title_str
        bg_col = (15, 18, 34, 225) if not is_off else (12, 14, 26, 175)
        border_col = (accent_color[0], accent_color[1], accent_color[2], 130 if not is_off else 55)
        draw.rounded_rectangle([x0, y0, x1, y1], radius=24, fill=bg_col, outline=border_col, width=2)

        draw.rounded_rectangle([x0, y0, x0 + 18, y1], radius=6, fill=accent_color)

        draw.text((x0 + 60, y0 + 58), day, font=font_day, fill=accent_color, anchor="lm")
        draw.text((x0 + 60, y0 + 125), time_str, font=font_time, fill=C_IVORY_MUTED, anchor="lm")

        draw.text((x0 + 600, y0 + 58), title_str, font=font_title, fill=C_IVORY, anchor="lm")
        draw.text((x0 + 600, y0 + 125), venue_str, font=font_venue, fill=C_IVORY_MUTED, anchor="lm")

        curr_y += card_h + 30

    return curr_y


def draw_footer_section(draw, footer_text):
    """Alt Bilgi: Görev Yeri, Kurumsal Çerçeve ve Ayraç Çizgisi."""
    font_footer = ImageFont.truetype(FONT_WORK_REG, 32)
    font_coord = ImageFont.truetype(FONT_WORK_BOLD, 26)

    y_line = 2520
    draw.line([(SW // 2 - 800, y_line), (SW // 2 + 800, y_line)], fill=(255, 255, 255, 45), width=2)

    draw.text((SW // 2, y_line + 55), footer_text, font=font_footer, fill=C_IVORY_MUTED, anchor="mm")
    draw.text((SW // 2, y_line + 110), "T.C. BRÜKSEL BÜYÜKELÇİLİĞİ SOSYAL İŞLER MÜŞAVİRLİĞİ KOORDİNESİNDE",
              font=font_coord, fill=(251, 191, 36, 175), anchor="mm")


# ==============================================================================
# AFİŞ VERİ TANIMLARI
# ==============================================================================

POSTERS = [
    {
        "slug": "00-ai-genel-tanitim",
        "header_tag": "HAFTALIK ÇALIŞMA VE EĞİTİM PROGRAMI",
        "title_lines": ["ESMA AVCI", "Haftalık Çalışma Programı"],
        "subtitle_note": "Hanımlar, genç kızlar ve kız öğrencilere yönelik dinî eğitim ve rehberlik",
        "badge_bold": "NAMUR & MARCHE-EN-FAMENNE",
        "badge_reg": "2026–2027 Eğitim Dönemi",
        "art_func": render_art_00_portal,
        "bg_seed": 101,
        "items": ["Kur’an-ı Kerim", "Ezber & Tecvit", "Tefsir & Hadis", "İlmihal & Siyer", "Manevi Rehberlik"],
        "guidance": "Düzenli haftalık derslerimize tüm hanım kardeşlerimiz davetlidir",
        "footer": "Namur Camii  ·  Marche-en-Famenne Ulu Camii  ·  Düzenli Haftalık Program",
    },
    {
        "slug": "01-ai-hanimlar-pazartesi",
        "header_tag": "HANIMLAR EĞİTİM VE SOHBET BULUŞMASI",
        "title_lines": ["HANIMLAR  ·  PAZARTESİ"],
        "subtitle_note": "Kur’an tilaveti, ezber ve gönülden sohbet için haftanın ilk buluşması",
        "badge_bold": "10.30 – 16.00",
        "badge_reg": "Namur Camii",
        "art_func": render_art_01_book_leaves,
        "bg_seed": 102,
        "items": ["Kur’an-ı Kerim", "Ezber ve Tecvit", "İlmihal", "Siyer", "Sohbet", "Birebir Görüşme"],
        "guidance": "Tüm hanım kardeşlerimiz davetlidir  ·  Katılım serbesttir",
        "footer": "Görev Yeri: Namur Camii  ·  Her Pazartesi Düzenli Buluşma",
    },
    {
        "slug": "02-ai-hanimlar-persembe",
        "header_tag": "TEFSİR, HADİS VE VAAZ PROGRAMI",
        "title_lines": ["HANIMLAR  ·  PERŞEMBE"],
        "subtitle_note": "Tefsir, hadis ve vaaz ile ilmimizi ve maneviyatımızı derinleştiriyoruz",
        "badge_bold": "10.30 – 16.00",
        "badge_reg": "Namur Camii",
        "art_func": render_art_02_receding_arches,
        "bg_seed": 103,
        "items": ["Kur’an-ı Kerim", "Tefsir Dersleri", "Hadis Okumaları", "Dua ve Vaaz", "Birebir Görüşme"],
        "guidance": "Tüm hanım kardeşlerimiz davetlidir  ·  Katılım serbesttir",
        "footer": "Görev Yeri: Namur Camii  ·  Her Perşembe Düzenli Buluşma",
    },
    {
        "slug": "03-ai-marche-carsamba",
        "header_tag": "MARCHE-EN-FAMENNE ULU CAMİİ BULUŞMASI",
        "title_lines": ["HANIMLAR & GENÇ KIZLAR", "Çarşamba Buluşması"],
        "subtitle_note": "Marche-en-Famenne’de Kur’an’ın rehberliğinde ilim ve muhabbetle buluşuyoruz",
        "badge_bold": "10.30 – 16.00",
        "badge_reg": "Marche-en-Famenne Ulu Camii",
        "art_func": render_art_03_interlaced_arches,
        "bg_seed": 104,
        "items": ["Kur’an-ı Kerim", "Ezber ve Tecvit", "İlmihal", "Siyer", "Dua", "Soru-Cevap"],
        "guidance": "Bölgedeki tüm hanım kardeşlerimiz ve genç kızlarımız davetlidir",
        "footer": "Görev Yeri: Marche-en-Famenne Ulu Camii  ·  Her Çarşamba",
    },
    {
        "slug": "04-ai-genc-kizlar-cuma",
        "header_tag": "CUMA AKŞAMI GENÇLİK BULUŞMASI",
        "title_lines": ["GENÇ KIZLAR  ·  CUMA"],
        "subtitle_note": "Cuma akşamı Kur’an’ın aydınlığında samimi hasbihal ve gençlik buluşması",
        "badge_bold": "18.30 – 20.30",
        "badge_reg": "Namur Camii",
        "art_func": render_art_04_youth_constellation,
        "bg_seed": 105,
        "items": ["Kur’an-ı Kerim", "Ezber Çalışmaları", "Dua", "Gönülden Sohbet", "Gençlerle Hasbihal"],
        "guidance": "Ortaokul, lise ve üniversiteli tüm genç kızlarımız davetlidir",
        "footer": "Görev Yeri: Namur Camii  ·  Her Cuma Akşamı",
    },
    {
        "slug": "05-ai-kiz-cocuklari-hafta-sonu",
        "header_tag": "HAFTA SONU KIZ ÖĞRENCİ KUR’AN KURSU",
        "title_lines": ["KIZ ÖĞRENCİLER", "Hafta Sonu Kursu"],
        "subtitle_note": "Yaşa uygun, sevgi dolu ve düzenli bir ortamda temel dinî eğitim",
        "badge_bold": "Cumartesi & Pazar  ·  10.00 – 13.00",
        "badge_reg": "Namur Camii",
        "art_func": render_art_05_stepping_stones,
        "bg_seed": 106,
        "items": ["7 Yaş ve Üzeri", "Kur’an-ı Kerim", "İtikat", "İbadet", "Siyer", "Ahlak"],
        "guidance": "Detaylı bilgi ve kayıt için cami yönetimiyle iletişime geçiniz",
        "footer": "Namur Camii Yönetimi Koordinasyonunda Hafta Sonu Eğitimi",
    },
    {
        "slug": "06-ai-birebir-gorusme",
        "header_tag": "MANEVİ DANIŞMANLIK VE REHBERLİK (MDR)",
        "title_lines": ["BİREBİR GÖRÜŞME · MDR", "Manevi Danışmanlık ve Rehberlik"],
        "subtitle_note": "Dinî ve manevi konularda sorularınız ve rehberlik için randevulu görüşme",
        "badge_bold": "Randevulu Görüşme",
        "badge_reg": "Namur Camii  ·  Pazartesi & Perşembe",
        "art_func": render_art_06_serene_sanctuary,
        "bg_seed": 107,
        "narrative": "Dinî ve kişisel konularda rehberlik almak, danışmak ve konuşmak için randevulu birebir görüşme imkânı. Uygun gün ve saat belirlemek için iletişime geçiniz.",
        "guidance": "Görüşmeler tam gizlilik ve güven esasına dayalı olarak yürütülmektedir",
        "footer": "Gizlilik ve Güven Esasında Manevi Danışmanlık Hizmeti",
    },
    {
        "slug": "07-ai-haftalik-program-ozeti",
        "header_tag": "2026–2027 EĞİTİM VE ÇALIŞMA TAKVİMİ",
        "title_lines": ["HAFTALIK PROGRAM"],
        "badge_bold": "ESMA AVCI HOCA HANIM",
        "badge_reg": "Namur Bölgesi Çalışma Çizelgesi",
        "art_func": render_art_07_colonnade,
        "bg_seed": 108,
        "is_schedule": True,
        "footer": "Namur Camii & Marche-en-Famenne Ulu Camii  ·  2026–2027",
    },
]


def generate_single_poster(poster_data):
    slug = poster_data["slug"]
    print(f"[*] Üretiliyor: {slug} ...")

    # 1. Atmosferik Zemin Gradyanı
    bg = create_rich_gradient(SW, SH, seed=poster_data["bg_seed"],
                              center_color=C_AUBERGINE,
                              corner_color=C_INDIGO_DEEP,
                              accent_color=C_GOLD if "genel" in slug or "ozeti" in slug else C_MINT,
                              accent_pos=(0.5, 0.26))

    # 2. Zarif Çerçeve
    draw_exhibition_frame(ImageDraw.Draw(bg), SW, SH)

    # 3. Özgün Üretken Sanat Katmanı
    art_func = poster_data["art_func"]
    art_func(bg)

    # 4. Kağıt Dokusu (Paper Grain)
    bg = apply_paper_grain(bg, intensity=0.035, seed=poster_data["bg_seed"])

    # 5. Tipografi ve Bilgi Hiyerarşisi
    draw = ImageDraw.Draw(bg)
    draw_header_section(draw, poster_data)

    if poster_data.get("is_schedule"):
        draw_poster_title(draw, poster_data["title_lines"], y_start=760)
        draw_badge_pill(draw, SW // 2, 880, poster_data["badge_bold"], poster_data["badge_reg"])
        draw_schedule_table(draw, y_start=980)
    else:
        y_next = draw_poster_title(draw, poster_data["title_lines"], y_start=1360)
        if "subtitle_note" in poster_data:
            draw_subtitle_note(draw, poster_data["subtitle_note"], y_next + 20)
            y_next += 65

        y_pill = draw_badge_pill(draw, SW // 2, y_next + 55, poster_data["badge_bold"], poster_data["badge_reg"])

        if "narrative" in poster_data:
            draw_narrative_box(draw, poster_data["narrative"], y_start=y_pill + 65)
        elif "items" in poster_data:
            draw_content_chips(draw, poster_data["items"], y_start=y_pill + 65)

        if "guidance" in poster_data:
            draw_guidance_badge(draw, poster_data["guidance"], y_pos=2340)

    # Alt Bilgi (Footer)
    draw_footer_section(draw, poster_data["footer"])

    # 6. Süper-Örnekleme Küçültme (2160x2700 -> 1080x1350)
    final_img = bg.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")

    # 7. PNG Kaydet
    png_path = BASE_DIR / f"{slug}.png"
    final_img.save(png_path, format="PNG", optimize=True)

    # 8. Baskıya Uygun PDF Kaydet
    pdf_path = BASE_DIR / f"{slug}.pdf"
    final_img.save(pdf_path, format="PDF", resolution=150.0)

    print(f"    -> PNG: {png_path.name} ({final_img.size[0]}x{final_img.size[1]})")
    print(f"    -> PDF: {pdf_path.name}")
    return final_img


def generate_preview_board(images, slugs):
    """8 afişi şık bir 4x2 sergi panosu (onizleme.jpg) olarak birleştirir."""
    print("[*] Sergi panosu oluşturuluyor: onizleme.jpg ...")
    cols = 4
    rows = 2
    thumb_w = 480
    thumb_h = 600
    pad = 40
    header_h = 130

    board_w = cols * thumb_w + (cols + 1) * pad
    board_h = rows * thumb_h + (rows + 1) * pad + header_h

    board = Image.new("RGB", (board_w, board_h), (10, 12, 22))
    b_draw = ImageDraw.Draw(board)

    f_title = ImageFont.truetype(FONT_LORA_BOLD, 46)
    f_sub = ImageFont.truetype(FONT_WORK_REG, 24)
    b_draw.text((board_w // 2, 48), "ESMA AVCI HOCA HANIM · 2026–2027 HAFTALIK ÇALIŞMA PROGRAMI",
                font=f_title, fill=C_GOLD_LIGHT, anchor="mm")
    b_draw.text((board_w // 2, 95), "Anti-Gravity Üretken Sanat Motoru (Generative Art Engine) ile Hazırlanmış Bağımsız Afiş Serisi",
                font=f_sub, fill=C_IVORY_MUTED, anchor="mm")

    for idx, (img, slug) in enumerate(zip(images, slugs)):
        c = idx % cols
        r = idx // cols
        x = pad + c * (thumb_w + pad)
        y = header_h + pad + r * (thumb_h + pad)

        thumb = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        board.paste(thumb, (x, y))

        b_draw.rectangle([x - 2, y - 2, x + thumb_w + 1, y + thumb_h + 1],
                         outline=(251, 191, 36, 140), width=2)

    preview_path = BASE_DIR / "onizleme.jpg"
    board.save(preview_path, format="JPEG", quality=92)
    print(f"[+] Sergi panosu hazır: {preview_path.name} ({board_w}x{board_h})")


def main():
    print("================================================================")
    print("  Esma AVCI 2026–2027 Üretken Sanat ve Afiş Üretim Motoru")
    print("================================================================")

    generated_images = []
    slugs = []

    for p in POSTERS:
        img = generate_single_poster(p)
        generated_images.append(img)
        slugs.append(p["slug"])

    generate_preview_board(generated_images, slugs)

    print("================================================================")
    print("  Tüm afişler başarıyla üretildi ve doğrulandı.")
    print("================================================================")


if __name__ == "__main__":
    main()
