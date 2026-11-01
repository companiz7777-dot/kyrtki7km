"""Стискає нові фото з incoming/ у webp для сайту.

    python3 tools/process_photos.py [--max 1400] [--quality 82]

Кожен файл incoming/<папка>/<фото> стає img/new/<папка>-<n>.webp
(без EXIF, з правильним поворотом). Оригінали видаляються з incoming/.
Друкує список створених файлів, щоб їх можна було прив'язати до товарів у js/data.js.
"""
import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'incoming'
OUT = ROOT / 'img' / 'new'
EXT = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.bmp', '.tif', '.tiff'}


def slug(s):
    s = re.sub(r'[^a-z0-9а-яіїєґ]+', '-', s.lower()).strip('-')
    return s or 'photo'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max', type=int, default=1400)
    ap.add_argument('--quality', type=int, default=82)
    a = ap.parse_args()

    files = sorted(p for p in SRC.rglob('*') if p.is_file() and p.suffix.lower() in EXT)
    if not files:
        print('incoming/ порожня — нових фото немає')
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    done = 0
    for f in files:
        group = slug(f.parent.name if f.parent != SRC else 'misc')
        n = 1
        while (OUT / f'{group}-{n}.webp').exists():
            n += 1
        dst = OUT / f'{group}-{n}.webp'
        try:
            with Image.open(f) as im:
                im = ImageOps.exif_transpose(im).convert('RGB')
                im.thumbnail((a.max, a.max), Image.LANCZOS)
                im.save(dst, 'WEBP', quality=a.quality, method=6)
        except Exception as e:  # пошкоджений або непідтримуваний файл — лишаємо в incoming/
            print(f'ПРОПУЩЕНО {f.relative_to(ROOT)}: {e}', file=sys.stderr)
            continue
        f.unlink()
        done += 1
        print(f'{f.relative_to(SRC)} -> {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} КБ)')
    for d in sorted((p for p in SRC.rglob('*') if p.is_dir()), reverse=True):
        if not any(d.iterdir()):
            d.rmdir()
    print(f'Оброблено: {done} з {len(files)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
