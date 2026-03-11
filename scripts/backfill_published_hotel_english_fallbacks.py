import json
import os
import re

import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

load_dotenv(".env.local")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is missing")
    raise SystemExit(1)

if "sslmode=" not in db_url and "supabase.co" in db_url:
    db_url += "?sslmode=require"

EMPTY_TEXT = {"", "null", "none", "nan"}


def clean_text(value):
    if value is None:
        return None

    text = str(value).strip()
    if not text or text.lower() in EMPTY_TEXT:
        return None

    return text


def to_plain_text(value):
    return (
        value.replace("<br />", "\n")
        .replace("<br/>", "\n")
        .replace("<br>", "\n")
        .replace("</p>", "\n")
        .replace("</li>", "\n")
        .replace("\r", "\n")
    )


def strip_tags(value):
    return re.sub(r"<[^>]+>", " ", value)


def has_useful_english_text(value, minimum_latin=12):
    cleaned = clean_text(value)
    if not cleaned:
        return False

    plain = strip_tags(to_plain_text(cleaned))
    latin = len(re.findall(r"[A-Za-z]", plain))
    cyrillic = len(re.findall(r"[\u0400-\u04FF]", plain))
    return latin >= minimum_latin and latin > cyrillic * 1.5


def extract_english_segment(value):
    cleaned = clean_text(value)
    if not cleaned:
        return None

    segments = [segment.strip() for segment in cleaned.split("|") if segment.strip()]
    if not segments:
        return cleaned if re.search(r"[A-Za-z]", cleaned) else None

    ranked = []
    for segment in segments:
        latin = len(re.findall(r"[A-Za-z]", segment))
        cyrillic = len(re.findall(r"[\u0400-\u04FF]", segment))
        if latin == 0:
            continue
        ranked.append((latin - cyrillic * 2, segment))

    if not ranked:
        return None

    ranked.sort(reverse=True)
    return ranked[0][1]


def extract_english_description(value):
    cleaned = clean_text(value)
    if not cleaned:
        return None

    normalized = strip_tags(to_plain_text(cleaned))
    parts = [re.sub(r"\s+", " ", part).strip() for part in normalized.split("\n")]
    parts = [part for part in parts if part]

    english_parts = []
    for part in parts:
        latin = len(re.findall(r"[A-Za-z]", part))
        cyrillic = len(re.findall(r"[\u0400-\u04FF]", part))
        if latin >= 20 and latin > cyrillic * 1.5:
            english_parts.append(part)

    if not english_parts:
        if has_useful_english_text(cleaned, minimum_latin=20):
            return cleaned
        return None

    return "".join(f"<p>{part}</p>" for part in english_parts)


def build_fallback_address(name, name_en, address):
    location_source = " ".join(filter(None, [clean_text(address), clean_text(name_en), clean_text(name)]))
    if not location_source:
        return None

    if re.search(r"(улаанбаатар|ulaanbaatar|\bub\b)", location_source, re.IGNORECASE):
        return "Ulaanbaatar, Mongolia"

    return "Mongolia"


def build_fallback_description(name, name_en, address_en, stars):
    display_name = clean_text(name_en) or extract_english_segment(name) or "This hotel"
    location = clean_text(address_en) or "Ulaanbaatar, Mongolia"
    star_prefix = f"{int(stars)}-star " if stars and int(stars) > 0 else ""
    return (
        f"<p>{display_name} is a {star_prefix}hotel in {location} for COP17 travelers. "
        "Contact the property directly for the latest room details, amenities, and check-in information.</p>"
    )


conn = None
cursor = None

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, name, name_en, address, address_en, description, description_en, stars
        FROM public.hotels
        WHERE is_published = TRUE
        """
    )

    updates = []
    preview = []

    for hotel_id, name, name_en, address, address_en, description, description_en, stars in cursor.fetchall():
        resolved_name_en = clean_text(name_en) or extract_english_segment(name)
        resolved_address_en = (
            clean_text(address_en)
            or extract_english_segment(address)
            or build_fallback_address(name, resolved_name_en, address)
        )
        resolved_description_en = (
            extract_english_description(description_en)
            or (clean_text(description_en) if has_useful_english_text(description_en) else None)
            or extract_english_description(description)
            or build_fallback_description(name, resolved_name_en, resolved_address_en, stars)
        )

        updates.append((resolved_name_en, resolved_address_en, resolved_description_en, hotel_id))
        preview.append(
            {
                "id": str(hotel_id),
                "name": name,
                "name_en": resolved_name_en,
                "address_en": resolved_address_en,
                "description_en_preview": strip_tags(to_plain_text(resolved_description_en or ""))[:120],
            }
        )

    execute_batch(
        cursor,
        """
        UPDATE public.hotels
        SET
            name_en = COALESCE(%s, name_en),
            address_en = COALESCE(%s, address_en),
            description_en = COALESCE(%s, description_en)
        WHERE id = %s
        """,
        updates,
        page_size=100,
    )

    conn.commit()
    print(
        json.dumps(
            {
                "updated_count": len(updates),
                "sample": preview[:10],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
except Exception as exc:
    if conn:
        conn.rollback()
    print(f"Database error: {exc}")
    raise
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
