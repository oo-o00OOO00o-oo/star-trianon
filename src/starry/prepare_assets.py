from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
OUT.mkdir(parents=True, exist_ok=True)
NIGHT = (7, 17, 31, 255)
GOLD = (242, 193, 78, 255)
IVORY = (245, 233, 200, 255)


def save(image, name):
    path = OUT / name
    image.save(path, optimize=True)
    print(f"{name}: {path.stat().st_size} bytes")
    return path


def radial(size, stops):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = image.load()
    center = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            distance = math.hypot(x - center, y - center) / center
            for index, (start, end, color) in enumerate(stops):
                if start <= distance <= end:
                    amount = (distance - start) / (end - start)
                    previous = stops[index - 1][2] if index else color
                    pixels[x, y] = tuple(round(previous[channel] + (color[channel] - previous[channel]) * amount) for channel in range(4))
                    break
    return image


def make_star():
    return radial(128, [(0, .18, IVORY), (.18, .40, GOLD), (.40, .72, (242, 193, 78, 54)), (.72, 1, (242, 193, 78, 0))])


def make_lamp():
    lamp = radial(256, [(0, .24, IVORY), (.24, .48, GOLD), (.48, .76, (242, 193, 78, 48)), (.76, 1, (242, 193, 78, 0))])
    draw = ImageDraw.Draw(lamp)
    draw.line((128, 76, 128, 176), fill=(7, 17, 31, 255), width=16)
    draw.line((128, 76, 82, 122), fill=(7, 17, 31, 255), width=16)
    draw.line((128, 76, 174, 122), fill=(7, 17, 31, 255), width=16)
    return lamp


def make_house():
    image = Image.new("RGBA", (960, 600), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.polygon(((60, 190), (130, 96), (830, 96), (900, 190)), fill=(13, 27, 44, 255), outline=GOLD, width=3)
    draw.rectangle((60, 190, 900, 540), fill=(13, 27, 44, 250), outline=GOLD, width=3)
    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.rectangle((150, 292, 194, 350), fill=(242, 193, 78, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(22))
    image.alpha_composite(glow)
    draw = ImageDraw.Draw(image)
    draw.rectangle((150, 292, 194, 350), fill=GOLD)
    draw.line((224, 316, 820, 316), fill=(245, 233, 200, 150), width=3)
    draw.line((224, 366, 690, 366), fill=(169, 164, 143, 130), width=3)
    return image


def make_castle():
    image = Image.new("RGBA", (600, 800), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((38, 330, 562, 780), fill=(2, 7, 13, 255))
    for left, top, width in ((58, 174, 104), (248, 80, 104), (438, 154, 104)):
        draw.rectangle((left, top, left + width, 780), fill=(2, 7, 13, 255))
        for offset in range(0, width, 26):
            draw.rectangle((left + offset, top - 24, left + offset + 13, top), fill=(2, 7, 13, 255))
    for left, top in ((106, 286), (292, 190), (292, 410), (486, 268), (486, 520)):
        draw.rectangle((left, top, left + 16, top + 28), fill=(242, 193, 78, 220))
    return image


def make_river():
    random.seed(1889)
    image = Image.new("RGBA", (1200, 80), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    for _ in range(48):
        x = random.randrange(0, 1180)
        y = random.randrange(18, 62)
        width = random.randrange(8, 30)
        alpha = random.randrange(65, 190)
        draw.line((x, y, x + width, y), fill=(242, 193, 78, alpha), width=random.choice((2, 3, 4)))
    return image


def make_sky():
    width, height = 1920, 1080
    image = Image.new("RGBA", (width, height), NIGHT)
    draw = ImageDraw.Draw(image, "RGBA")
    for cx, cy, rx, ry in ((1320, 230, 400, 185), (1540, 740, 490, 225), (720, 520, 320, 150)):
        for step in range(min(7, int(min(rx, ry) / 28))):
            inset = step * 28
            alpha = 22 - step * 2
            draw.ellipse((cx - rx + inset, cy - ry + inset, cx + rx - inset, cy + ry - inset), outline=(62, 88, 126, alpha), width=5)
    draw.ellipse((1450, -240, 1990, 300), fill=(242, 193, 78, 12))
    return image


def make_pixel_castle():
    image = Image.new("RGBA", (240, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    ridge = [
        (4, 34), (18, 34), (18, 14), (28, 14), (28, 20), (38, 20), (38, 14),
        (50, 14), (50, 20), (60, 20), (60, 14), (70, 14), (70, 32), (92, 32),
        (118, 18), (144, 32), (164, 32), (164, 25), (180, 25), (180, 32),
        (194, 32), (194, 25), (210, 25), (210, 32), (224, 32), (224, 25),
        (240, 25), (240, 32), (532, 32), (532, 20), (542, 20), (560, 10),
        (578, 20), (588, 20), (588, 32), (648, 32), (648, 26), (664, 26),
        (664, 32), (678, 32), (678, 26), (694, 26), (694, 34), (716, 34),
    ]
    scaled = [(round(x / 3), round(y / 3)) for x, y in ridge]
    body = scaled + [(round(716 / 3), round(92 / 3)), (round(4 / 3), round(92 / 3))]
    draw.polygon(body, fill=(13, 27, 44, 255))
    draw.line(scaled, fill=GOLD, width=1)
    return image


def make_nav_icon(kind):
    image = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    if kind == "new":
        image.alpha_composite(make_star())
        return image
    draw = ImageDraw.Draw(image)
    stroke = (242, 193, 78, 230)
    if kind == "history":
        for inset in (12, 25, 38):
            draw.arc((inset, inset, 128 - inset, 128 - inset), 25, 320, fill=stroke, width=4)
    elif kind in ("files", "account"):
        draw.rectangle((26, 48, 102, 104), outline=stroke, width=4)
        for left in (32, 56, 80):
            draw.rectangle((left, 28, left + 14, 48), outline=stroke, width=3)
        draw.rectangle((58, 70, 70, 86), fill=stroke)
    elif kind == "search":
        draw.ellipse((22, 18, 80, 76), outline=stroke, width=5)
        draw.line((72, 70, 108, 106), fill=stroke, width=6)
    elif kind in ("terminal", "browser"):
        draw.polygon(((18, 46), (28, 30), (100, 30), (110, 46)), outline=stroke)
        draw.rectangle((18, 46, 110, 102), outline=stroke, width=4)
        draw.rectangle((34, 62, 48, 80), fill=stroke)
    elif kind == "model":
        for x, y, r in ((38, 38, 15), (88, 40, 12), (52, 88, 13), (94, 88, 16)):
            draw.ellipse((x-r, y-r, x+r, y+r), outline=stroke, width=3)
    elif kind == "fav":
        image.alpha_composite(make_star().resize((100, 100)), (14, 14))
    elif kind == "look":
        draw.ellipse((22, 16, 96, 90), outline=stroke, width=4)
        draw.ellipse((46, 10, 106, 74), fill=(0, 0, 0, 0), outline=stroke, width=3)
        draw.line((36, 102, 94, 102), fill=stroke, width=4)
    elif kind == "settings":
        draw.ellipse((26, 26, 102, 102), outline=stroke, width=4)
        draw.ellipse((52, 52, 76, 76), fill=stroke)
        for angle in range(0, 360, 45):
            x1 = 64 + math.cos(math.radians(angle)) * 42
            y1 = 64 + math.sin(math.radians(angle)) * 42
            x2 = 64 + math.cos(math.radians(angle)) * 54
            y2 = 64 + math.sin(math.radians(angle)) * 54
            draw.line((x1, y1, x2, y2), fill=stroke, width=5)
    return image


def contact(paths):
    sheet = Image.new("RGBA", (1440, 900), NIGHT)
    sheet.alpha_composite(Image.open(paths["sky"]).resize((960, 540)), (240, 0))
    sheet.alpha_composite(Image.open(paths["star"]).resize((96, 96)), (40, 40))
    sheet.alpha_composite(Image.open(paths["house"]).resize((720, 450)), (360, 180))
    sheet.alpha_composite(Image.open(paths["castle"]).resize((240, 320)), (28, 500))
    sheet.alpha_composite(Image.open(paths["river"]).resize((840, 56)), (360, 740))
    sheet.alpha_composite(Image.open(paths["lamp"]).resize((112, 112)), (1190, 730))
    return sheet.convert("RGB")


def main():
    paths = {
        "sky": save(make_sky(), "sky-field.png"),
        "star": save(make_star(), "star-unit.png"),
        "house": save(make_house(), "tool-house.png"),
        "castle": save(make_castle(), "castle-silhouette.png"),
        "river": save(make_river(), "river-reflection.png"),
        "lamp": save(make_lamp(), "send-lamp.png"),
        "field": save(make_pixel_castle(), "castle-field-pixel.png"),
    }
    for kind in ("new", "history", "files", "search", "terminal", "model", "fav", "look", "browser", "account", "settings"):
        save(make_nav_icon(kind), f"nav-{kind}.png")
    save(contact(paths), "starry-assets-contact.png")


if __name__ == "__main__":
    main()
