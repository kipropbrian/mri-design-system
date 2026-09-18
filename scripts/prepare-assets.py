"""
Prepares the MRI brand + provider assets used by the design system.

Reads from the sibling MRI repos (read-only) and writes into
`mri-design-system/public/`:

  brand/mri-logo.png           transparent-background MRI lockup
  brand/mri-logo-inverse.png   white knockout of the same lockup (dark mode)
  brand/mri-mark.png           transparent square emblem only
  brand/mri-logo-cream.png     original artwork, untouched (reference)
  brand/favicon-16x16.png, favicon-32x32.png, favicon.ico
  providers/*                  iNaturalist, eBird, GBIF, Xeno-canto, AviList marks
  taxa/*                       iNaturalist iconic-taxon artwork
  quiz/forest-clearing-frame.webp

Run from the mri-design-system directory:  python3 scripts/prepare-assets.py
Override the source checkout:              MRI_ROOT=/path/to/MRI python3 scripts/prepare-assets.py

Like the data extractor, this is a *refresh* tool: the assets it writes are
committed, so a normal build never invokes it. The source root is explicit and
validated so a moved checkout fails loudly rather than writing empty folders.
"""
import os
from pathlib import Path
from shutil import copy2

from PIL import Image

DESIGN = Path(__file__).resolve().parent.parent
MRI = Path(os.environ.get("MRI_ROOT", "/Users/brian/Developer/MRI"))
MAIN_SITE = MRI / "maiyoinstitute.org/public"
PLATFORM = MRI / "platform/platform.maiyoinstitute.org/public"

REQUIRED_SOURCES = (
    MAIN_SITE / "mri-logo.png",
    PLATFORM / "inaturalist/taxa",
    PLATFORM / "birds/assets",
)

_missing = [str(p) for p in REQUIRED_SOURCES if not p.exists()]
if _missing:
    raise SystemExit(
        "MRI_ROOT does not look like the MRI checkout: "
        + str(MRI)
        + "\n  missing: "
        + "\n  missing: ".join(_missing)
        + "\n\nSet MRI_ROOT to the MRI checkout root and re-run."
    )
print(f"MRI root: {MRI}")

BRAND = DESIGN / "public/brand"
PROVIDERS = DESIGN / "public/providers"
TAXA = DESIGN / "public/taxa"
QUIZ = DESIGN / "public/quiz"

for directory in (BRAND, PROVIDERS, TAXA, QUIZ):
    directory.mkdir(parents=True, exist_ok=True)


def unmix_background(image: Image.Image, bg=(246, 244, 238)) -> Image.Image:
    """Knock the flat cream plate out of an anti-aliased logo.

    For every pixel we solve `p = a * f + (1 - a) * bg` for both the coverage
    `a` and the true foreground colour `f`, which keeps glyph edges clean
    instead of leaving a light halo.
    """
    rgb = image.convert("RGB")
    width, height = rgb.size
    src = rgb.load()
    out = Image.new("RGBA", (width, height))
    dst = out.load()

    for y in range(height):
        for x in range(width):
            r, g, b = src[x, y]
            alpha = max(
                (bg[0] - r) / bg[0],
                (bg[1] - g) / bg[1],
                (bg[2] - b) / bg[2],
            )
            alpha = min(1.0, max(0.0, alpha))
            if alpha <= 0.004:
                dst[x, y] = (0, 0, 0, 0)
                continue
            fg = []
            for channel, base in zip((r, g, b), bg):
                value = (channel - (1 - alpha) * base) / alpha
                fg.append(int(min(255, max(0, round(value)))))
            dst[x, y] = (fg[0], fg[1], fg[2], int(round(alpha * 255)))
    return out


def content_box(image: Image.Image, threshold=8):
    """Bounding box of non-transparent pixels."""
    alpha = image.getchannel("A").point(lambda v: 255 if v > threshold else 0)
    box = alpha.getbbox()
    return box or (0, 0, image.width, image.height)


def column_gap(image: Image.Image, min_ratio=0.72, max_ratio=0.55):
    """Find the vertical gutter separating the emblem from the wordmark."""
    alpha = image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    profile = []
    for x in range(width):
        ink = 0
        for y in range(0, height, 2):
            if pixels[x, y] > 24:
                ink += 1
        profile.append(ink)

    peak = max(profile) or 1
    start = int(width * 0.16)
    end = int(width * max_ratio)
    best_x, best_score = None, None
    for x in range(start, max(1, end)):
        window = profile[x : x + max(4, width // 90)]
        score = max(window) / peak
        if best_score is None or score < best_score:
            best_score, best_x = score, x
    if best_x is None:
        best_x = int(width * 0.42)
    del min_ratio
    return best_x


def trim_below_emblem(image: Image.Image, threshold=24, min_gap=6):
    """Drop the tagline that sits under the emblem inside the left-hand column.

    Walks up from the bottom looking for the first clear horizontal gutter, so
    the square mark contains the emblem only.
    """
    alpha = image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    rows = []
    for y in range(height):
        ink = 0
        for x in range(0, width, 2):
            if pixels[x, y] > threshold:
                ink += 1
        rows.append(ink)

    bottom = height - 1
    while bottom > 0 and rows[bottom] == 0:
        bottom -= 1

    y = bottom
    while y > height // 3:
        if rows[y] > 0:
            y -= 1
            continue
        gap_start = y
        while y > 0 and rows[y] == 0:
            y -= 1
        if gap_start - y >= min_gap:
            return image.crop((0, 0, width, y + 1))
    return image


def save(image: Image.Image, path: Path, max_width: int | None = None):
    if max_width and image.width > max_width:
        ratio = max_width / image.width
        image = image.resize(
            (max_width, max(1, round(image.height * ratio))), Image.LANCZOS
        )
    image.save(path)
    print(f"  {path.relative_to(DESIGN)}  {image.width}x{image.height}")


# --------------------------------------------------------------- MRI brand marks

print("MRI brand marks")
source = Image.open(MAIN_SITE / "mri-logo.png")
copy2(MAIN_SITE / "mri-logo.png", BRAND / "mri-logo-cream.png")

transparent = unmix_background(source)
transparent = transparent.crop(content_box(transparent))
save(transparent, BRAND / "mri-logo.png", max_width=1280)

inverse = Image.new("RGBA", transparent.size)
inverse.putalpha(transparent.getchannel("A"))
white = Image.new("RGBA", transparent.size, (255, 255, 255, 255))
white.putalpha(transparent.getchannel("A"))
save(white, BRAND / "mri-logo-inverse.png", max_width=1280)

split = column_gap(transparent)
mark = transparent.crop((0, 0, split, transparent.height))
mark = trim_below_emblem(mark)
mark = mark.crop(content_box(mark))
side = max(mark.width, mark.height)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)
save(square, BRAND / "mri-mark.png", max_width=512)

mark_inverse = Image.new("RGBA", square.size, (255, 255, 255, 255))
mark_inverse.putalpha(square.getchannel("A"))
save(mark_inverse, BRAND / "mri-mark-inverse.png", max_width=512)

for name in ("favicon-16x16.png", "favicon-32x32.png", "favicon.ico"):
    copy2(MAIN_SITE / name, BRAND / name)
    print(f"  brand/{name}")

# ------------------------------------------------------------------- favicons

copy2(MAIN_SITE / "favicon-32x32.png", DESIGN / "app/favicon.ico")
print("  app/favicon.ico")

# --------------------------------------------------------------- provider marks

print("Provider marks")
provider_sources = {
    "inaturalist.png": PLATFORM / "birds/assets/inaturalist.ico",
    "ebird.png": PLATFORM / "birds/assets/ebird.ico",
    "gbif.png": PLATFORM / "birds/assets/gbif.ico",
    "xeno-canto.png": PLATFORM / "assets/logos/xeno-canto.png",
    "avilist.png": PLATFORM / "assets/logos/avilist.png",
    "wikipedia.png": PLATFORM / "birds/assets/wikipedia.ico",
    "birdlife.png": PLATFORM / "birds/assets/birdlife.png",
}
for name, src in provider_sources.items():
    if not src.exists():
        print(f"  !! missing {src}")
        continue
    if src.suffix.lower() == ".ico":
        icon = Image.open(src)
        frame = getattr(icon, "size", (64, 64))
        best = None
        try:
            best = max(
                (icon.ico.getimage(size) for size in icon.ico.sizes()),
                key=lambda im: im.size[0],
            )
        except Exception:
            best = icon.convert("RGBA")
        del frame
        best.convert("RGBA").save(PROVIDERS / name)
        print(f"  providers/{name} (from .ico)")
    else:
        image = Image.open(src).convert("RGBA")
        if max(image.size) > 256:
            ratio = 256 / max(image.size)
            image = image.resize(
                (round(image.width * ratio), round(image.height * ratio)), Image.LANCZOS
            )
        image.save(PROVIDERS / name)
        print(f"  providers/{name}")

# ------------------------------------------------------------- taxon artwork

print("Taxon artwork")
for src in sorted((PLATFORM / "inaturalist/taxa").glob("*-v2.webp")):
    copy2(src, TAXA / src.name)
    print(f"  taxa/{src.name}")

# ------------------------------------------------------------------ quiz frame

print("Quiz frame")
copy2(PLATFORM / "birds/quiz/forest/forest-clearing-frame.webp", QUIZ / "forest-clearing-frame.webp")
print("  quiz/forest-clearing-frame.webp")

print("done")
