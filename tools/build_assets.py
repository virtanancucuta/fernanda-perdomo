"""Genera los assets optimizados de la landing desde el material crudo (no versionado).

Uso: python tools/build_assets.py   (desde la raíz del proyecto)
"""
import os
import subprocess
import urllib.request
from PIL import Image, ImageOps, ImageDraw, ImageFont
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "sesion_fotos")
OUT = os.path.join(ROOT, "assets")
IMG = os.path.join(OUT, "img")

SPIN = ["9874", "9875", "9876", "9877", "9878", "9879", "9880"]
HERO = "9861"
BIO = ["0031", "0035"]
LOOKS = {
    "jean": ["0078", "0083", "0105", "0112", "0118", "0110"],
    "flecos": ["9855", "9862", "9884", "9913", "9900", "9876"],
    "boho": ["9920", "9926", "9934", "9941", "9950", "9957"],
    "turbante": ["9960", "9968", "9973", "9976", "9990", "9997"],
    "street": ["0002", "0008", "0017", "0023", "0032", "0044"],
    "backstage": ["0049", "0050", "9863", "9888", "9919"],
}
# Recortes del collage de flyers (imagenes/p7_0.jpeg, 1080x1920)
FLYERS = {
    "resi-dencias": (130, 265, 512, 760),
    "energy-up": (540, 192, 1002, 768),
    "houp": (128, 778, 513, 1254),
    "ananda": (535, 778, 1002, 1587),
    "coffee-party": (128, 1270, 513, 1893),
}
TRACKS = {
    "noche-en-ibiza": ("NOCHE EN IBIZA.mp3", "Noche en Ibiza"),
    "gin-tonic": ("GINTONIC.m4a", "Gin Tonic"),
    "baila-conmigo": ("BAILA CONMIGO.m4a", "Baila Conmigo"),
}


def open_photo(code):
    return ImageOps.exif_transpose(Image.open(os.path.join(SRC, f"FP-{code}.jpg"))).convert("RGB")


def save_webp(im, path, long_side, quality=78):
    im = im.copy()
    im.thumbnail((long_side, long_side), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    return im.size


def photos():
    for i, code in enumerate(SPIN):
        save_webp(open_photo(code), os.path.join(IMG, "spin", f"{i}.webp"), 1100, 72)
    save_webp(open_photo(HERO), os.path.join(IMG, "hero.webp"), 1600)
    for code in BIO:
        save_webp(open_photo(code), os.path.join(IMG, f"bio-{code}.webp"), 1400)
    for look, codes in LOOKS.items():
        for code in codes:
            ph = open_photo(code)
            save_webp(ph, os.path.join(IMG, "looks", look, f"{code}.webp"), 1800, 80)
            save_webp(ph, os.path.join(IMG, "looks", look, f"{code}-t.webp"), 720, 74)


def flyers():
    col = Image.open(os.path.join(ROOT, "imagenes", "p7_0.jpeg")).convert("RGB")
    for name, box in FLYERS.items():
        save_webp(col.crop(box), os.path.join(IMG, "flyers", f"{name}.webp"), 900, 82)


def rider():
    doc = pymupdf.open(os.path.join(ROOT, "booking_fernanda_perdomo.pdf"))
    pix = doc[4].get_pixmap(dpi=220)
    page = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    w, h = page.size
    save_webp(page.crop((0, int(h * 0.60), w, int(h * 0.985))), os.path.join(IMG, "rider-cdj.webp"), 1400, 82)


def audio():
    out = os.path.join(OUT, "audio")
    os.makedirs(out, exist_ok=True)
    for slug, (src, title) in TRACKS.items():
        subprocess.run([
            "ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "audios", src),
            "-vn", "-ac", "2", "-b:a", "128k",
            "-metadata", f"title={title}", "-metadata", "artist=Fernanda Perdomo",
            os.path.join(out, f"{slug}.mp3"),
        ], check=True)


def font(size):
    path = os.path.join(ROOT, "tools", "Anton-Regular.ttf")
    if not os.path.exists(path):
        urllib.request.urlretrieve("https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf", path)
    return ImageFont.truetype(path, size)


def og():
    W, H = 1200, 630
    lime = (230, 253, 1)
    im = Image.new("RGB", (W, H), (10, 10, 10))
    ph = ImageOps.grayscale(open_photo(HERO))
    ph = ImageOps.autocontrast(ph, cutoff=1)
    ph.thumbnail((W, 900))
    ph = ph.crop((0, 40, ph.width, 40 + H))
    # duotono negro→lima (como la pág. 2 del PDF)
    duo = ImageOps.colorize(ph, black=(10, 10, 10), white=lime)
    im.paste(duo, (W - duo.width + 60, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 690, H), fill=(10, 10, 10))
    d.text((60, 70), "MODEL & DEEJAY", font=font(40), fill=(255, 255, 255))
    d.text((56, 130), "PERDOMO", font=font(172), fill=lime)
    d.text((60, 470), "ELECTRÓNICA · EXPERIMENTAL HOUSE", font=font(38), fill=(255, 255, 255))
    d.text((60, 530), "BOOKING POR WHATSAPP", font=font(30), fill=lime)
    im.save(os.path.join(OUT, "og.jpg"), quality=85)


if __name__ == "__main__":
    photos()
    flyers()
    rider()
    audio()
    og()
    total = 0
    for dp, _, fs in os.walk(OUT):
        for f in fs:
            total += os.path.getsize(os.path.join(dp, f))
    print(f"assets: {total / 1e6:.1f} MB")
