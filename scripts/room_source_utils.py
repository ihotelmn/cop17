import re

import pandas as pd


def clean_nullable_text(value):
    if value is None or pd.isna(value):
        return None

    text = str(value).strip()
    if not text or text.lower() in {"null", "none", "nan"}:
        return None

    return text


def parse_positive_int(value):
    if value is None or pd.isna(value):
        return None

    try:
        parsed = int(float(value))
    except Exception:
        return None

    return parsed if parsed > 0 else None


def translate_room_name(value):
    text = clean_nullable_text(value)
    if not text:
        return None

    normalized = text.lower()
    room_type = []

    if "standard" in normalized or "стандарт" in normalized:
        room_type.append("Standard")
    if "deluxe" in normalized or "делакс" in normalized:
        room_type.append("Deluxe")
    if "executive" in normalized or "эксекютив" in normalized:
        room_type.append("Executive")
    if "presidential" in normalized or "ерөнхийлөгч" in normalized:
        room_type.append("Presidential")
    if "suite" in normalized or "сьют" in normalized or "люкс" in normalized:
        room_type.append("Suite")
    elif "superior" in normalized or "супериор" in normalized:
        room_type.append("Superior")

    if "single" in normalized or "сингл" in normalized:
        room_type.append("Single")
    elif "double" in normalized or "дабл" in normalized or "дабль" in normalized:
        room_type.append("Double")
    elif "twin" in normalized or "твин" in normalized:
        room_type.append("Twin")
    elif "king" in normalized or "кинг" in normalized:
        room_type.append("King")

    translated = " ".join(dict.fromkeys(room_type)).strip()
    if not translated:
        return text

    if "room" not in translated.lower():
        translated = f"{translated} Room"

    if "smoking" in normalized or "тамхи татах" in normalized:
        translated = f"{translated} (Smoking)"

    return translated


def pick_room_name(row):
    return (
        clean_nullable_text(row.get("name_en"))
        or translate_room_name(row.get("name"))
        or clean_nullable_text(row.get("name"))
    )


def pick_room_description(row):
    return (
        clean_nullable_text(row.get("description_en"))
        or clean_nullable_text(row.get("description"))
    )


def extract_capacity_from_text(*texts):
    patterns = [
        re.compile(r"(\d+)\s*-\s*(\d+)\s*(?:pax|guests?|adults?|хүн)", re.IGNORECASE),
        re.compile(r"(\d+)\s*(?:pax|guests?|adults?|хүн)", re.IGNORECASE),
    ]

    for text in texts:
        source = clean_nullable_text(text)
        if not source:
            continue

        for pattern in patterns:
            match = pattern.search(source)
            if not match:
                continue

            if len(match.groups()) == 2:
                return max(int(match.group(1)), int(match.group(2)))
            return int(match.group(1))

    return None


def infer_room_capacity(row):
    text_capacity = extract_capacity_from_text(
        row.get("description_en"),
        row.get("description"),
        row.get("name_en"),
        row.get("name"),
    )
    people_number = parse_positive_int(row.get("people_number"))
    occupancy = parse_positive_int(row.get("occupancy"))
    bed_number = parse_positive_int(row.get("bed_number"))
    translated_name = (pick_room_name(row) or "").lower()

    if text_capacity:
        return text_capacity
    if people_number:
        return people_number
    if occupancy:
        return occupancy
    if "single" in translated_name:
        return 1
    if "presidential" in translated_name or "family" in translated_name:
        return 4
    if bed_number and bed_number > 1:
        return min(max(bed_number, 2), 4)

    return 2


def derive_room_inventory(row, physical_inventory=0):
    direct_inventory = parse_positive_int(physical_inventory)
    if direct_inventory:
        return direct_inventory

    for fallback_key in ("sale_quantity", "number"):
        fallback_inventory = parse_positive_int(row.get(fallback_key))
        if fallback_inventory:
            return fallback_inventory

    total_people = parse_positive_int(row.get("total_people"))
    if total_people:
        divisor = parse_positive_int(row.get("people_number")) or infer_room_capacity(row)
        if divisor and divisor > 0:
            derived_inventory = int(round(total_people / divisor))
            if derived_inventory > 0:
                return derived_inventory

    return 0
