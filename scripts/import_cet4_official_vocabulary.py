"""Extract official CET-4 vocabulary entries and import them into SQLite.

Source:
  全国大学英语四、六级考试大纲（2016年修订版）
  https://cet.neea.edu.cn/res/Home/1704/55b02330ac17274664f06d9d3db8249d.pdf

The official outline states that the vocabulary table only lists word forms:
it does not provide parts of speech, meanings, pronunciations, or examples.
The app's Word model requires those fields, so this script fills them with
explicit source notes rather than invented lexical data.
"""

from __future__ import annotations

import csv
import hashlib
import re
import sqlite3
import sys
import unicodedata
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "data" / "cet-outline-2016.pdf"
CSV_PATH = ROOT / "data" / "cet4-outline-vocabulary.csv"
DB_PATH = ROOT / "dev.db"
SOURCE_TITLE = "全国大学英语四、六级考试大纲（2016年修订版）"
SOURCE_URL = "https://cet.neea.edu.cn/res/Home/1704/55b02330ac17274664f06d9d3db8249d.pdf"

PHONETIC_NOTE = "官方词表未提供读音"
MEANING_NOTE = f"官方《{SOURCE_TITLE}》词表词目；官方未提供释义"
EXAMPLE_NOTE = "官方词表只列词形，不列例句"

VOCAB_START_PAGE_INDEX = 20
VOCAB_END_PAGE_INDEX = 148


def normalize_line(line: str) -> str:
    normalized = line.replace("\u3000", " ")
    normalized = normalized.replace("\uff27", "-")
    normalized = normalized.replace("\uff0e", ".")
    normalized = normalized.replace("\uff0d", "-")
    normalized = normalized.replace("\u2014", "-")
    return unicodedata.normalize("NFKC", normalized).strip()


def is_vocab_line(line: str) -> bool:
    if not line:
      return False
    if any("\u4e00" <= char <= "\u9fff" for char in line):
      return False
    if re.fullmatch(r"[0-9\s]+", line):
      return False
    return bool(re.fullmatch(r"[A-Za-z][A-Za-z0-9./()'\-\s]*", line))


def stable_word_id(entry: str) -> str:
    digest = hashlib.sha1(entry.encode("utf-8")).hexdigest()[:20]
    return f"cet4_{digest}"


def extract_cet4_entries() -> list[dict[str, str | int]]:
    reader = PdfReader(str(PDF_PATH))
    entries: list[dict[str, str | int]] = []
    seen: set[str] = set()

    for page_index in range(VOCAB_START_PAGE_INDEX, VOCAB_END_PAGE_INDEX + 1):
        text = reader.pages[page_index].extract_text() or ""

        for raw_line in text.splitlines():
            line = normalize_line(raw_line)
            is_cet6_entry = line.startswith("\u2605")

            if is_cet6_entry:
                continue

            if not is_vocab_line(line):
                continue

            key = line.lower()
            if key in seen:
                continue

            seen.add(key)
            entries.append(
                {
                    "word": line,
                    "phonetic": PHONETIC_NOTE,
                    "meaning": MEANING_NOTE,
                    "example": EXAMPLE_NOTE,
                    "level": 1,
                    "source": SOURCE_TITLE,
                    "source_url": SOURCE_URL,
                    "source_pdf_page": page_index + 1,
                }
            )

    return entries


def write_csv(entries: list[dict[str, str | int]]) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "word",
                "phonetic",
                "meaning",
                "example",
                "level",
                "source",
                "source_url",
                "source_pdf_page",
            ],
        )
        writer.writeheader()
        writer.writerows(entries)


def import_to_sqlite(entries: list[dict[str, str | int]]) -> None:
    with sqlite3.connect(DB_PATH) as connection:
        connection.executemany(
            """
            INSERT INTO Word (id, word, phonetic, meaning, example, level)
            VALUES (:id, :word, :phonetic, :meaning, :example, :level)
            ON CONFLICT(word) DO UPDATE SET
              phonetic = excluded.phonetic,
              meaning = excluded.meaning,
              example = excluded.example,
              level = excluded.level
            """,
            [
                {
                    "id": stable_word_id(str(entry["word"])),
                    "word": entry["word"],
                    "phonetic": entry["phonetic"],
                    "meaning": entry["meaning"],
                    "example": entry["example"],
                    "level": entry["level"],
                }
                for entry in entries
            ],
        )


def main() -> int:
    if not PDF_PATH.exists():
        print(f"Missing official outline PDF: {PDF_PATH}", file=sys.stderr)
        return 1

    entries = extract_cet4_entries()
    write_csv(entries)
    import_to_sqlite(entries)
    print(f"Extracted {len(entries)} CET-4 vocabulary entries")
    print(f"Wrote CSV: {CSV_PATH}")
    print(f"Updated SQLite database: {DB_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
