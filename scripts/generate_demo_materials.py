from pathlib import Path

from openpyxl import Workbook
from PIL import Image, ImageDraw, ImageFont


def load_font(path: str, size: int):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def generate_receipt(base: Path) -> None:
    img = Image.new("RGB", (760, 1040), "#fbfaf5")
    draw = ImageDraw.Draw(img)
    font_title = load_font("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 34)
    font = load_font("/System/Library/Fonts/Supplemental/Arial.ttf", 25)
    font_small = load_font("/System/Library/Fonts/Supplemental/Arial.ttf", 21)

    x = 72
    y = 70
    draw.rounded_rectangle((42, 34, 718, 1000), radius=18, outline="#d6d0c4", width=3, fill="#fffdf7")
    draw.text((x, y), "HANBIT STATIONERY", fill="#1f2937", font=font_title)
    y += 52
    draw.text((x, y), "Receipt No. HB-20260512-1842", fill="#4b5563", font=font_small)
    y += 34
    draw.text((x, y), "2026-05-12 18:42", fill="#4b5563", font=font_small)
    y += 44
    draw.line((x, y, 688, y), fill="#d1d5db", width=2)
    y += 38

    rows = [
        ("Name pen set 12 colors", "1", "8,900"),
        ("Transparent tape", "3", "6,000"),
        ("A4 paper pack", "1", "5,500"),
    ]
    for name, qty, price in rows:
        draw.text((x, y), name, fill="#111827", font=font)
        draw.text((500, y), qty, fill="#111827", font=font)
        draw.text((590, y), price, fill="#111827", font=font)
        y += 48

    draw.line((x, y, 688, y), fill="#d1d5db", width=2)
    y += 38
    draw.text((x, y), "TOTAL", fill="#111827", font=font_title)
    draw.text((560, y), "20,400", fill="#111827", font=font_title)
    y += 58
    draw.text((x, y), "Payment: Check card", fill="#374151", font=font)
    y += 46
    draw.text((x, y), "Memo: Club presentation supplies", fill="#374151", font=font)
    y += 80
    draw.rectangle((x, y, 688, y + 90), outline="#9ca3af", width=2)
    draw.text((x + 28, y + 30), "Needs purchaser confirmation", fill="#b42318", font=font)
    img.save(base / "receipt-001.png")


def generate_xlsx(base: Path) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "May Transfers"
    ws.append(["date", "type", "description", "amount", "memo"])
    rows = [
        ["2026-05-10", "income", "참가비 김민지", 15000, "구글폼 12번"],
        ["2026-05-10", "income", "참가비 이도윤", 15000, "구글폼 13번"],
        ["2026-05-12", "expense", "한빛문구", 20400, "영수증 receipt-001 대조 필요"],
        ["2026-05-13", "expense", "피자 주문", 78000, "영수증 없음"],
        ["2026-05-14", "income", "참가비 박서연", 15000, "구글폼 누락 가능"],
        ["2026-05-15", "expense", "회의실 대관", 50000, "계약서 확인 필요"],
    ]
    for row in rows:
        ws.append(row)
    for column in ["A", "B", "C", "D", "E"]:
        ws.column_dimensions[column].width = 22
    wb.save(base / "may-transfers.xlsx")


def generate_csv(base: Path) -> None:
    (base / "signup-export.csv").write_text(
        "timestamp,name,student_id,paid_name\n"
        "2026-05-09 10:11,김민지,20231234,김민지\n"
        "2026-05-09 10:14,이도윤,20235555,이도윤\n"
        "2026-05-09 11:05,박서연,20230123,박서연\n"
        "2026-05-09 11:30,최현우,20239876,최현우\n",
        encoding="utf-8",
    )


def main() -> None:
    base = Path("public/materials/club-budget")
    base.mkdir(parents=True, exist_ok=True)
    generate_receipt(base)
    generate_xlsx(base)
    generate_csv(base)


if __name__ == "__main__":
    main()

