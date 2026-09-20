"""
로고 원본에서 헤더에 쓸 조각들을 잘라낸다.

보내준 로고는 판다 마크 위, PromPick 글자 아래로 된 세로 조합이다. 상단바는 64px밖에 안 되어서
세로 조합을 통째로 넣으면 글자가 읽을 수 없는 크기가 된다. 그래서 둘을 나눠 가로로 세운다.

글자는 흰색으로 바꿔서 내보낸다. 원본이 짙은 남색이라 어두운 상단바에 그대로 올리면 배경에
묻혀 보이지 않는다.

자를 위치를 숫자로 박아두지 않고 내용에서 찾는다. 로고를 다시 그려 비율이 바뀌어도
이 스크립트는 그대로 동작해야 하기 때문이다.

    python scripts/make-logo-mark.py <원본파일>

    public/logo-mark.png       판다 마크 (원래 색)
    public/logo-wordmark.png   PromPick 글자 (흰색)
    public/logo-full-white.png 마크+글자 세로 조합 (흰색)
"""

import sys
from pathlib import Path

from PIL import Image


def trim(image: Image.Image) -> Image.Image:
    """바깥 여백을 걷어낸다. 무엇이 그려진 곳까지만 남긴다."""
    gray = image.convert("L")
    # 흰 바탕을 배경으로 본다. 240보다 어두운 화소가 그림이다.
    mask = gray.point(lambda v: 255 if v < 240 else 0)
    box = mask.getbbox()
    return image.crop(box) if box else image


def split(image: Image.Image) -> tuple[Image.Image, Image.Image | None]:
    """
    마크와 글자를 가르는 빈 줄을 찾아 둘로 나눈다.

    세로로 훑으면서 아무것도 그려지지 않은 줄이 이어지는 구간 중 가장 긴 곳이 둘 사이의
    틈이다. 그 위쪽이 마크, 아래쪽이 글자다.
    """
    gray = image.convert("L")
    width, height = gray.size
    pixels = gray.load()

    def is_blank(y: int) -> bool:
        return all(pixels[x, y] >= 240 for x in range(0, width, 4))

    best_start, best_len = None, 0
    run_start, run_len = None, 0

    for y in range(height):
        if is_blank(y):
            if run_start is None:
                run_start = y
            run_len += 1
        else:
            if run_len > best_len:
                best_start, best_len = run_start, run_len
            run_start, run_len = None, 0

    if run_len > best_len:
        best_start, best_len = run_start, run_len

    # 틈을 못 찾았으면 전체를 마크로 본다.
    if best_start is None or best_len < height * 0.02:
        return image, None

    return (
        image.crop((0, 0, width, best_start)),
        image.crop((0, best_start + best_len, width, height)),
    )


def whiten(image: Image.Image) -> Image.Image:
    """
    글자를 흰색으로 바꾸고 배경을 투명하게 만든다.

    어두운 화소를 흰색으로 칠하되, 원래의 진하기를 알파로 옮긴다. 진한 곳은 불투명한 흰색이
    되고 가장자리의 흐릿한 화소는 반투명해진다 — 그래야 글자 테두리가 계단처럼 깨지지 않는다.
    """
    gray = image.convert("L")
    width, height = gray.size
    out = Image.new("RGBA", (width, height))

    source = gray.load()
    target = out.load()
    for y in range(height):
        for x in range(width):
            value = source[x, y]
            # 255(흰 배경) -> 투명, 0(진한 글자) -> 불투명 흰색
            target[x, y] = (255, 255, 255, 255 - value)
    return out


def square(image: Image.Image, size: int = 512) -> Image.Image:
    """정사각 캔버스 가운데에 놓는다. 상단바에서 좌우로 흔들리지 않게 한다."""
    trimmed = trim(image)
    side = max(trimmed.size)
    canvas = Image.new("RGBA", (side, side), (255, 255, 255, 0))
    canvas.paste(
        trimmed,
        ((side - trimmed.width) // 2, (side - trimmed.height) // 2),
        trimmed if trimmed.mode == "RGBA" else None,
    )
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> int:
    if len(sys.argv) < 2:
        print("사용법: python scripts/make-logo-mark.py <로고파일>")
        return 1

    source = Path(sys.argv[1])
    if not source.exists():
        print(f"파일이 없어요: {source}")
        return 1

    image = Image.open(source).convert("RGBA")
    mark_part, word_part = split(trim(image))

    public = Path(__file__).resolve().parent.parent / "public"

    mark = square(mark_part)
    mark.save(public / "logo-mark.png")
    print(f"마크: {public / 'logo-mark.png'}  ({mark.width}x{mark.height})")

    if word_part is None:
        print("글자 부분을 찾지 못했어요. 마크만 만들었어요.")
        return 0

    wordmark = whiten(trim(word_part))
    # 상단바에서 쓸 크기에 맞춘다. 세로 64px면 어떤 화면에서도 또렷하다.
    height = 64
    ratio = height / wordmark.height
    wordmark = wordmark.resize((int(wordmark.width * ratio), height), Image.LANCZOS)
    wordmark.save(public / "logo-wordmark.png")
    print(f"글자: {public / 'logo-wordmark.png'}  ({wordmark.width}x{wordmark.height}, 흰색)")

    # 세로 공간이 있는 자리(푸터)에서 쓸 원본 조합. 어두운 바탕에 얹으므로 흰색으로 뽑는다.
    full = whiten(trim(image))
    full_height = 320
    scale = full_height / full.height
    full = full.resize((int(full.width * scale), full_height), Image.LANCZOS)
    full.save(public / "logo-full-white.png")
    print(f"세로조합: {public / 'logo-full-white.png'}  ({full.width}x{full.height}, 흰색)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
